// Renders the "Why this grade?" report for one tab.
import { browserAPI } from '../shared/browser-polyfill';
import { SettingsStorage } from '../shared/settings';
import { formatBytes } from '../utils/format';
import type { Report, Check, FileRow } from './types';

const CATEGORY_COLORS: { [c: string]: string } = {
  Images: '#10b981', Scripts: '#f59e0b', Styles: '#6366f1', Fonts: '#ec4899',
  'Video & audio': '#ef4444', Documents: '#3b82f6', Data: '#8b5cf6', Other: '#6b7280'
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%';
}

function fileTable(files: FileRow[], showSavings: boolean): string {
  if (!files.length) return '';
  return `<table class="files"><tbody>${files.map((f) => `
    <tr>
      <td class="fname"><a href="${esc(f.url)}" target="_blank" rel="noopener" title="${esc(f.url)}">${esc(f.name)}</a>
        <span class="fhost">${esc(f.host)}${f.note ? ' · ' + esc(f.note) : ''}</span></td>
      <td class="num">${formatBytes(f.bytes)}</td>
      ${showSavings ? `<td class="num save">${f.savings ? '−' + formatBytes(f.savings) : ''}</td>` : ''}
    </tr>`).join('')}</tbody></table>`;
}

function checkCard(c: Check): string {
  return `
  <section class="check ${c.passed ? 'pass' : 'issue'}">
    <div class="check-head">
      <span class="status">${c.passed ? '✓' : '!'}</span>
      <h3>${esc(c.title)}</h3>
      ${c.savings > 0 ? `<span class="pill">save ~${formatBytes(c.savings)}</span>` : ''}
    </div>
    <p>${esc(c.summary)}</p>
    ${c.passed ? '' : `<p class="advice">${esc(c.advice)}</p>${fileTable(c.files, c.savings > 0)}`}
  </section>`;
}

function render(r: Report, site: { grade: string; color: string; samples: number } | null): string {
  const totalSavings = r.totalBytes - r.projectedBytes;
  const improves = r.projectedGrade !== r.grade;
  const bar = r.breakdown.map((b) =>
    `<div class="seg" style="flex-grow:${b.bytes};background:${CATEGORY_COLORS[b.category]}" title="${b.category}: ${formatBytes(b.bytes)}"></div>`).join('');
  const legend = r.breakdown.map((b) => `
    <tr><td><i style="background:${CATEGORY_COLORS[b.category]}"></i>${b.category}</td>
    <td class="num">${b.files}</td><td class="num">${formatBytes(b.bytes)}</td><td class="num">${pct(b.bytes, r.totalBytes)}</td></tr>`).join('');
  const issues = r.checks.filter((c) => !c.passed);
  const passes = r.checks.filter((c) => c.passed);

  return `
  <header class="top">
    <div class="grade" style="background:${r.gradeColor}">${r.grade}</div>
    <div>
      <div class="eyebrow">Why this grade?</div>
      <h1>${esc(r.host)}<span class="path">${esc(r.path.length > 60 ? r.path.slice(0, 57) + '…' : r.path)}</span></h1>
      <p class="lede">This page weighs <strong>${formatBytes(r.totalBytes)}</strong> across ${r.fileCount} files,
        about ${r.totalGrams < 1 ? r.totalGrams.toFixed(2) : r.totalGrams.toFixed(1)} g CO₂e per visit. ${esc(r.gradeBlurb)}.</p>
      ${site ? `<p class="muted">Site grade: <b style="color:${site.color}">${site.grade}</b>, the median of the last ${site.samples} page${site.samples === 1 ? '' : 's'} you loaded on this site. This report covers this page only.</p>` : ''}
    </div>
  </header>

  ${totalSavings > 0 ? `
  <div class="whatif">
    <div>Fixing the issues below could save about <strong>${formatBytes(totalSavings)}</strong>${improves
      ? `, moving this page from <b style="color:${r.gradeColor}">${r.grade}</b> to <b style="color:${r.projectedGradeColor}">${r.projectedGrade}</b>.`
      : `. That alone would keep it at ${r.grade}; the biggest remaining weight is listed under Heaviest files.`}</div>
  </div>` : ''}

  <h2>Where the weight comes from</h2>
  <div class="bar">${bar}</div>
  <table class="legend"><thead><tr><th>Type</th><th class="num">Files</th><th class="num">Size</th><th class="num">Share</th></tr></thead><tbody>${legend}</tbody></table>
  <div class="split">
    <div><span class="muted">From ${esc(r.host)}</span><b>${formatBytes(r.firstPartyBytes)}</b> ${pct(r.firstPartyBytes, r.totalBytes)}</div>
    <div><span class="muted">From other domains</span><b>${formatBytes(r.thirdPartyBytes)}</b> ${pct(r.thirdPartyBytes, r.totalBytes)}</div>
  </div>

  <h2>${issues.length ? `${issues.length} thing${issues.length === 1 ? '' : 's'} to fix` : 'Checks'}</h2>
  ${issues.map(checkCard).join('')}
  ${passes.map(checkCard).join('')}

  <h2>Heaviest files</h2>
  ${fileTable(r.heaviest, false)}

  ${r.thirdPartyDomains.length ? `
  <h2>Third-party domains</h2>
  <table class="legend"><tbody>${r.thirdPartyDomains.map((d) =>
    `<tr><td>${esc(d.domain)}</td><td class="num">${d.files} file${d.files === 1 ? '' : 's'}</td><td class="num">${formatBytes(d.bytes)}</td></tr>`).join('')}</tbody></table>` : ''}

  <footer>
    ${r.unmeasured > 0 ? `<p>${r.unmeasured} file${r.unmeasured === 1 ? '' : 's'} from other domains didn't report a size, usually because they came from the browser cache. Reload the page and open this report again for a fuller picture.</p>` : ''}
    <p>Savings are estimates. Resizing assumes file size scales with pixel count. Format savings assume WebP is about 25% smaller (Google reports 25–34% vs JPEG, 26% vs PNG). Compression assumes 65%. Grades use the Digital Carbon Ratings scale from sustainablewebdesign.org and CO₂ estimates use the Sustainable Web Design Model v4.</p>
    <p>This report was built on your device from the page you have open. File addresses are not saved or sent anywhere.</p>
  </footer>`;
}

async function main() {
  const root = document.getElementById('root')!;
  const settings = await new SettingsStorage().getSettings();
  document.body.classList.add(settings.darkMode ? 'dark' : 'light');

  const tabId = Number(new URLSearchParams(location.search).get('tab'));
  if (!tabId) { root.innerHTML = '<p class="muted">Open this report from the extension popup.</p>'; return; }

  browserAPI.runtime.sendMessage({ type: 'GET_REPORT', tabId }, (res) => {
    if (!res || res.error) {
      root.innerHTML = `<p class="muted">${res?.error === 'unavailable'
        ? 'This page can’t be analyzed. Browser pages and the Chrome Web Store don’t allow extensions, and pages that were open when the extension was installed or updated need a reload.'
        : 'Couldn’t read this page. Reload it and try again.'}</p>`;
      return;
    }
    document.title = `Why ${res.report.grade}? ${res.report.host} · Web CO₂ Report Card`;
    root.innerHTML = render(res.report as Report, res.site);
  });
}

main();
