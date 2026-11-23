// Turns per-file details for one page into a breakdown, checks, and savings estimates.
// Pure function: no browser APIs, so it can be unit tested.
import { calculateEmissions } from '../utils/co2-calculator';
import { gradeForBytes } from '../utils/page-score';
import type { Category, Check, FileRow, PageDetails, Report, RequestRecord } from './types';

// Estimates used for savings. Kept conservative and labeled "about" in the UI.
// WebP: Google reports lossy WebP files 25-34% smaller than JPEG, lossless 26% smaller than PNG.
const MODERN_FORMAT_SAVINGS = 0.25;
// gzip/Brotli typically shrink HTML, CSS, and JavaScript by 60-80%.
const COMPRESSION_SAVINGS = 0.65;
const MIN_IMAGE_BYTES = 40 * 1024;
const MIN_OVERSIZE_BYTES = 20 * 1024;
const MIN_TEXT_BYTES = 10 * 1024;
const THIRD_PARTY_SHARE = 0.25;

const TWO_PART_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'co.nz', 'co.jp',
  'com.br', 'com.mx', 'co.in', 'co.za', 'com.cn', 'com.tr', 'co.kr', 'com.sg', 'com.ar'
]);

/** Approximate registrable domain: news.bbc.co.uk -> bbc.co.uk, cdn.nyt.com -> nyt.com */
export function baseDomain(host: string): string {
  const parts = host.toLowerCase().replace(/\.$/, '').split('.');
  if (parts.length <= 2) return parts.join('.');
  const lastTwo = parts.slice(-2).join('.');
  return TWO_PART_SUFFIXES.has(lastTwo) ? parts.slice(-3).join('.') : lastTwo;
}

function parseUrl(url: string): URL | null {
  try { return new URL(url); } catch { return null; }
}

function extension(url: string): string {
  const u = parseUrl(url);
  const m = (u ? u.pathname : url).toLowerCase().match(/\.([a-z0-9]{2,5})$/);
  return m ? m[1] : '';
}

function shortName(url: string): string {
  const u = parseUrl(url);
  if (!u) return url.slice(0, 60);
  const last = u.pathname.split('/').filter(Boolean).pop() || u.hostname;
  const name = decodeURIComponentSafe(last);
  return name.length > 48 ? name.slice(0, 45) + '…' : name;
}

function decodeURIComponentSafe(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

export function categorize(url: string, contentType?: string, type?: string, initiator?: string): Category {
  const ct = (contentType || '').toLowerCase();
  const ext = extension(url);
  if (ct.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp'].includes(ext)) return 'Images';
  if (ct.startsWith('font/') || ct.includes('font-woff') || ['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) return 'Fonts';
  if (ct.includes('text/css') || ext === 'css') return 'Styles';
  if (ct.includes('javascript') || ct.includes('ecmascript') || ['js', 'mjs'].includes(ext)) return 'Scripts';
  if (ct.startsWith('video/') || ct.startsWith('audio/') || ct.includes('mpegurl') ||
      ['mp4', 'webm', 'm3u8', 'm4s', 'ts', 'mp3', 'm4a', 'ogg', 'mov'].includes(ext)) return 'Video & audio';
  if (ct.includes('text/html') || type === 'main_frame' || type === 'sub_frame' ||
      initiator === 'navigation' || initiator === 'iframe') return 'Documents';
  if (ct.includes('json') || type === 'xmlhttprequest' || initiator === 'fetch' || initiator === 'xmlhttprequest' || initiator === 'beacon') return 'Data';
  switch (type) {
    case 'image': return 'Images';
    case 'script': return 'Scripts';
    case 'stylesheet': return 'Styles';
    case 'font': return 'Fonts';
    case 'media': return 'Video & audio';
  }
  switch (initiator) {
    case 'img': case 'image': return 'Images';
    case 'script': return 'Scripts';
    case 'video': case 'audio': return 'Video & audio';
  }
  return 'Other';
}

function imageFormat(url: string, contentType?: string): string {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'JPEG';
  if (ct.includes('png')) return 'PNG';
  if (ct.includes('gif')) return 'GIF';
  if (ct.includes('webp')) return 'WebP';
  if (ct.includes('avif')) return 'AVIF';
  if (ct.includes('svg')) return 'SVG';
  const ext = extension(url);
  if (ext === 'jpg' || ext === 'jpeg') return 'JPEG';
  if (ext === 'png') return 'PNG';
  if (ext === 'gif') return 'GIF';
  if (ext === 'webp') return 'WebP';
  if (ext === 'avif') return 'AVIF';
  if (ext === 'svg') return 'SVG';
  return '';
}

interface Merged {
  url: string;
  host: string;
  category: Category;
  bytes: number;
  transferBytes: number;
  decodedBytes: number;
  contentType?: string;
  encoding?: string | null;   // undefined = unknown
  thirdParty: boolean;
}

function fmtKB(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function analyzePage(details: PageDetails, requests: RequestRecord[]): Report {
  const page = parseUrl(details.pageUrl);
  const host = page ? page.hostname.replace(/^www\./, '') : '';
  const pageBase = baseDomain(host);

  // ---- merge Performance API entries with network request records by URL ----
  const byUrl = new Map<string, Merged>();
  const make = (url: string): Merged | null => {
    const u = parseUrl(url);
    if (!u || !/^https?:$/.test(u.protocol)) return null;
    return {
      url, host: u.hostname, category: 'Other', bytes: 0, transferBytes: 0, decodedBytes: 0,
      thirdParty: baseDomain(u.hostname) !== pageBase
    };
  };
  for (const r of details.resources) {
    const m = byUrl.get(r.name) || make(r.name);
    if (!m) continue;
    m.bytes = Math.max(m.bytes, r.transferSize || 0, r.encodedBodySize || 0);
    m.transferBytes = Math.max(m.transferBytes, r.transferSize || 0);
    m.decodedBytes = Math.max(m.decodedBytes, r.decodedBodySize || 0);
    m.category = categorize(r.name, m.contentType, undefined, r.initiatorType);
    byUrl.set(r.name, m);
  }
  for (const q of requests) {
    const m = byUrl.get(q.url) || make(q.url);
    if (!m) continue;
    m.bytes = Math.max(m.bytes, q.bytes || 0);
    if (q.bytes) m.transferBytes = Math.max(m.transferBytes, q.bytes);
    if (q.contentType) m.contentType = q.contentType;
    m.encoding = q.encoding;
    m.category = categorize(q.url, q.contentType, q.type);
    byUrl.set(q.url, m);
  }
  const all = [...byUrl.values()];
  const files = all.filter((f) => f.bytes > 0);
  const unmeasured = all.filter((f) => f.bytes === 0 && f.thirdParty).length;
  const total = files.reduce((s, f) => s + f.bytes, 0);

  const row = (f: Merged, extra: Partial<FileRow> = {}): FileRow => ({
    url: f.url, name: shortName(f.url), host: f.host, category: f.category,
    bytes: f.bytes, thirdParty: f.thirdParty, ...extra
  });

  // ---- breakdown ----
  const cats = new Map<Category, { bytes: number; files: number }>();
  for (const f of files) {
    const c = cats.get(f.category) || { bytes: 0, files: 0 };
    c.bytes += f.bytes; c.files += 1;
    cats.set(f.category, c);
  }
  const breakdown = [...cats.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.bytes - a.bytes);

  const thirdPartyBytes = files.filter((f) => f.thirdParty).reduce((s, f) => s + f.bytes, 0);
  const tpDomains = new Map<string, { bytes: number; files: number }>();
  for (const f of files.filter((x) => x.thirdParty)) {
    const d = baseDomain(f.host);
    const v = tpDomains.get(d) || { bytes: 0, files: 0 };
    v.bytes += f.bytes; v.files += 1;
    tpDomains.set(d, v);
  }
  const thirdPartyDomains = [...tpDomains.entries()]
    .map(([domain, v]) => ({ domain, ...v }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8);

  const heaviest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 6).map((f) => row(f));

  // ---- image checks ----
  // Largest display size per image URL (same image can appear more than once)
  const display = new Map<string, { nw: number; nh: number; dw: number; dh: number }>();
  for (const im of details.images) {
    if (!im.src || im.naturalWidth <= 0 || im.displayWidth <= 0) continue;
    const prev = display.get(im.src);
    if (!prev || im.displayWidth * im.displayHeight > prev.dw * prev.dh) {
      display.set(im.src, { nw: im.naturalWidth, nh: im.naturalHeight, dw: im.displayWidth, dh: im.displayHeight });
    }
  }

  const imageFiles = files.filter((f) => f.category === 'Images');
  const oversized: FileRow[] = [];
  const remainingAfterResize = new Map<string, number>();
  for (const f of imageFiles) {
    const d = display.get(f.url);
    const fmt = imageFormat(f.url, f.contentType);
    if (!d || fmt === 'SVG' || f.bytes < MIN_OVERSIZE_BYTES) continue;
    const natural = d.nw * d.nh;
    const needed = Math.max(1, Math.round(d.dw) * Math.round(d.dh));
    if (natural < needed * 2) continue;
    const ratio = Math.min(0.9, 1 - needed / natural);
    const save = Math.round(f.bytes * ratio);
    remainingAfterResize.set(f.url, f.bytes - save);
    oversized.push(row(f, {
      savings: save,
      note: `${d.nw}×${d.nh} shown at ${Math.round(d.dw)}×${Math.round(d.dh)}`
    }));
  }
  oversized.sort((a, b) => (b.savings || 0) - (a.savings || 0));

  const oldFormat: FileRow[] = [];
  let modernCount = 0;
  for (const f of imageFiles) {
    const fmt = imageFormat(f.url, f.contentType);
    if (fmt === 'WebP' || fmt === 'AVIF') { modernCount += 1; continue; }
    if (!['JPEG', 'PNG', 'GIF'].includes(fmt) || f.bytes < MIN_IMAGE_BYTES) continue;
    const base = remainingAfterResize.get(f.url) ?? f.bytes;
    oldFormat.push(row(f, { savings: Math.round(base * MODERN_FORMAT_SAVINGS), note: fmt }));
  }
  oldFormat.sort((a, b) => (b.savings || 0) - (a.savings || 0));

  // ---- compression ----
  const uncompressed: FileRow[] = [];
  for (const f of files) {
    const isText = ['Scripts', 'Styles', 'Documents', 'Data'].includes(f.category) ||
      (f.contentType || '').includes('svg') || extension(f.url) === 'svg';
    if (!isText) continue;
    let flagged = false;
    if (f.encoding === null && f.bytes >= MIN_TEXT_BYTES) {
      flagged = true;                       // header seen, no Content-Encoding
    } else if (f.encoding === undefined && f.transferBytes > 0 && f.decodedBytes >= MIN_TEXT_BYTES &&
               f.transferBytes >= f.decodedBytes * 0.9) {
      flagged = true;                       // fetched over the network at full size
    }
    if (flagged) uncompressed.push(row(f, { savings: Math.round(f.bytes * COMPRESSION_SAVINGS), note: 'Not compressed' }));
  }
  uncompressed.sort((a, b) => (b.savings || 0) - (a.savings || 0));

  const sum = (rows: FileRow[]) => rows.reduce((s, r) => s + (r.savings || 0), 0);
  const tpShare = total > 0 ? thirdPartyBytes / total : 0;

  const checks: Check[] = [
    {
      id: 'oversized-images',
      title: 'Images larger than they are shown',
      passed: oversized.length === 0,
      summary: oversized.length
        ? `${oversized.length} image${oversized.length === 1 ? ' is' : 's are'} at least twice the size needed. Resizing could save about ${fmtKB(sum(oversized))}.`
        : 'Images are close to the size they are displayed at.',
      advice: 'Serve images at the size they appear, accounting for high-density screens. Use srcset so phones get smaller files than desktops.',
      savings: sum(oversized),
      files: oversized.slice(0, 8)
    },
    {
      id: 'image-format',
      title: 'Older image formats',
      passed: oldFormat.length === 0,
      summary: oldFormat.length
        ? `${oldFormat.length} large JPEG, PNG, or GIF image${oldFormat.length === 1 ? '' : 's'}. WebP or AVIF could save about ${fmtKB(sum(oldFormat))}.`
        : modernCount > 0 ? 'Large images already use WebP or AVIF.' : 'No large images in older formats.',
      advice: 'Convert photos to WebP or AVIF. Most image CDNs and build tools can do this automatically. Replace animated GIFs with video.',
      savings: sum(oldFormat),
      files: oldFormat.slice(0, 8)
    },
    {
      id: 'compression',
      title: 'Text files sent without compression',
      passed: uncompressed.length === 0,
      summary: uncompressed.length
        ? `${uncompressed.length} HTML, CSS, or JavaScript file${uncompressed.length === 1 ? ' was' : 's were'} sent uncompressed. gzip or Brotli could save about ${fmtKB(sum(uncompressed))}.`
        : 'Text files that could be checked were compressed.',
      advice: 'Turn on Brotli or gzip compression on the server or CDN for HTML, CSS, JavaScript, JSON, and SVG.',
      savings: sum(uncompressed),
      files: uncompressed.slice(0, 8)
    },
    {
      id: 'third-party',
      title: 'Weight from third parties',
      passed: tpShare < THIRD_PARTY_SHARE,
      summary: thirdPartyBytes > 0
        ? `${Math.round(tpShare * 100)}% of this page (${fmtKB(thirdPartyBytes)}) comes from ${tpDomains.size} other domain${tpDomains.size === 1 ? '' : 's'}, such as ads, analytics, embeds, or fonts.`
        : 'Everything on this page comes from the site itself.',
      advice: 'Review each third-party service for whether it earns its weight. Load embeds (video, maps, social) only when someone clicks them, and self-host fonts.',
      savings: 0,
      files: files.filter((f) => f.thirdParty).sort((a, b) => b.bytes - a.bytes).slice(0, 8).map((f) => row(f))
    }
  ];

  const savings = checks.reduce((s, c) => s + c.savings, 0);
  const projectedBytes = Math.max(0, total - savings);
  const band = gradeForBytes(total);
  const projected = gradeForBytes(projectedBytes);

  return {
    host,
    path: page ? page.pathname : '',
    totalBytes: total,
    totalGrams: calculateEmissions(total),
    grade: band.grade,
    gradeColor: band.color,
    gradeBlurb: band.blurb,
    projectedBytes,
    projectedGrade: projected.grade,
    projectedGradeColor: projected.color,
    breakdown,
    firstPartyBytes: total - thirdPartyBytes,
    thirdPartyBytes,
    thirdPartyDomains,
    heaviest,
    checks,
    unmeasured,
    fileCount: files.length
  };
}
