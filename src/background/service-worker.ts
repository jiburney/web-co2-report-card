import { calculateEmissions } from '../utils/co2-calculator';
import { gradeForBytes } from '../utils/page-score';
import { EmissionsStorage } from '../shared/storage';
import { SettingsStorage } from '../shared/settings';
import type { ExtensionMessage, PageLoadMessage, TabScoreResponse } from '../shared/types';
import { browserAPI } from '../shared/browser-polyfill';
import { TabTracker, hostOf, siteKey } from './tab-tracker';
import { analyzePage } from '../report/analyze';
import type { PageDetails } from '../report/types';

const storage = new EmissionsStorage();
const settings = new SettingsStorage();
const tracker = new TabTracker();

// ---- tracking switch (cached; refreshed when settings change) ----
let trackingEnabled = false;
const settingsReady = settings.getSettings().then((s) => { trackingEnabled = s.trackingEnabled; });
browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SettingsStorage.SETTINGS_KEY]) {
    trackingEnabled = !!(changes[SettingsStorage.SETTINGS_KEY].newValue as { trackingEnabled?: boolean } | undefined)?.trackingEnabled;
  }
});

async function ready() {
  await Promise.all([settingsReady, tracker.ready]);
}

// ---- pending writes, flushed every 2 seconds ----
const pending: { [domain: string]: { grams: number; pageViews: number } } = {};
const pendingGraded = { pages: 0, weightGrams: 0 };
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function addPending(domain: string, grams: number, pageViews: number) {
  const p = pending[domain] || (pending[domain] = { grams: 0, pageViews: 0 });
  p.grams += grams;
  p.pageViews += pageViews;
  if (!flushTimer) flushTimer = setTimeout(flush, 2000);
}

async function flush() {
  flushTimer = null;
  const batch = { ...pending };
  for (const k of Object.keys(pending)) delete pending[k];
  const graded = { ...pendingGraded };
  pendingGraded.pages = 0;
  pendingGraded.weightGrams = 0;
  if (Object.keys(batch).length || graded.pages) await storage.addBatch(batch, graded);
}

function creditTab(tabId: number) {
  const s = tracker.get(tabId);
  if (!s) return;
  const bytes = tracker.takeUncredited(tabId);
  if (bytes > 0) addPending(s.host, calculateEmissions(bytes), 0);
}

// ---- network measurement ----
const FILTER = { urls: ['<all_urls>'] };

browserAPI.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return undefined;
    ready().then(() => {
      if (!trackingEnabled) return;
      const isNew = tracker.startNavigation(details.tabId, details.url, details.requestId);
      const host = hostOf(details.url);
      if (isNew && host) addPending(host, 0, 1);
      if (isNew) showKnownSiteGrade(details.tabId, host);
    });
    return undefined;
  },
  { ...FILTER, types: ['main_frame'] as chrome.webRequest.ResourceType[] }
);

browserAPI.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId < 0 || details.fromCache) return;
    const headers = details.responseHeaders || [];
    const get = (name: string) => headers.find((h) => h.name.toLowerCase() === name)?.value;
    const len = get('content-length');
    const bytes = len ? parseInt(len, 10) || 0 : 0;
    ready().then(() => {
      if (!trackingEnabled) return;
      tracker.logRequest(details.tabId, {
        url: details.url,
        type: details.type,
        bytes: Math.max(0, bytes),
        contentType: get('content-type'),
        encoding: get('content-encoding') ?? null
      });
      if (bytes <= 0) return;
      tracker.addWebBytes(details.tabId, bytes, '');
      creditTab(details.tabId);
    });
  },
  FILTER,
  ['responseHeaders']
);

browserAPI.tabs.onRemoved.addListener((tabId) => {
  tracker.ready.then(() => tracker.remove(tabId));
});

// ---- lifecycle ----
browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    browserAPI.tabs.create({ url: browserAPI.runtime.getURL('welcome.html') });
  }
});

// ---- messages ----
browserAPI.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    case 'PAGE_LOAD':
      handlePageLoad(message as PageLoadMessage, sender);
      return false;
    case 'GET_TOTAL':
      handleGetTotal(sendResponse);
      return true;
    case 'GET_HISTORY':
      flush().then(() => storage.getHistory()).then(sendResponse);
      return true;
    case 'GET_REPORT':
      handleGetReport(message.tabId, sendResponse);
      return true;
    case 'GET_TAB_SCORE':
      handleGetTabScore(message.tabId, sendResponse);
      return true;
    case 'RESET':
      handleReset(sendResponse);
      return true;
    case 'ENABLE_TRACKING':
      handleEnableTracking(sendResponse);
      return true;
  }
  return false;
});

async function handlePageLoad(message: PageLoadMessage, sender: chrome.runtime.MessageSender) {
  await ready();
  const tabId = sender.tab?.id;
  if (!trackingEnabled || tabId === undefined || sender.frameId !== 0) return;
  const host = siteKey(message.url || '');

  if (message.isNewPage && tracker.beginPageIfNeeded(tabId, host)) {
    if (host) addPending(host, 0, 1);
    showKnownSiteGrade(tabId, host);
  }
  const weight = message.weightBytes || 0;
  if (message.bytesTransferred > 0 || weight > 0) {
    tracker.addPerfBytes(tabId, Math.max(0, message.bytesTransferred), weight, host);
  }

  if (message.isNewPage) {
    tracker.markLoaded(tabId);
    const s = tracker.get(tabId);
    const pageBytes = s ? tracker.gradeBytes(s) : 0;
    if (s && s.host && pageBytes > 0) {
      pendingGraded.pages += 1;
      pendingGraded.weightGrams += calculateEmissions(pageBytes);
      if (!flushTimer) flushTimer = setTimeout(flush, 2000);
      const site = await storage.recordSiteWeight(s.host, pageBytes);
      s.siteMedianBytes = site.medianBytes;
      s.siteSamples = site.samples;
      setGradeBadge(tabId, site.medianBytes);
    }
  }
  creditTab(tabId);
}

async function handleGetTotal(sendResponse: (response: any) => void) {
  await flush();
  const data = await storage.getData();
  const topSites = await storage.getTopSites(5);
  sendResponse({
    type: 'TOTAL_RESPONSE',
    totalGrams: data.totalEmissions,
    pageCount: data.pageCount,
    lastUpdated: data.lastUpdated,
    trackingSince: data.trackingSince ?? null,
    topSites
  });
}

async function handleGetTabScore(tabId: number, sendResponse: (response: TabScoreResponse | null) => void) {
  await ready();
  const s = tracker.get(tabId);
  if (!s || !s.host) return sendResponse(null);
  const total = tracker.totalBytes(s);
  const weight = tracker.gradeBytes(s);
  const band = gradeForBytes(weight);

  // Site grade: from this tab once loaded, otherwise from earlier visits
  let siteMedian = s.siteMedianBytes ?? null;
  let samples = s.siteSamples ?? 0;
  if (siteMedian === null) {
    const known = await storage.getSiteWeight(s.host);
    if (known) { siteMedian = known.medianBytes; samples = known.samples; }
  }
  const siteBand = siteMedian !== null ? gradeForBytes(siteMedian) : null;

  sendResponse({
    host: s.host,
    siteGrade: siteBand ? siteBand.grade : null,
    siteGradeColor: siteBand ? siteBand.color : null,
    siteGradeBlurb: siteBand ? siteBand.blurb : null,
    siteMedianBytes: siteMedian,
    siteMedianGrams: siteMedian !== null ? calculateEmissions(siteMedian) : null,
    siteSamples: samples,
    weightBytes: weight,
    loading: s.loadBytes === null,
    loadTransferred: s.loadBytes ?? total,
    totalBytes: total,
    weightGrams: calculateEmissions(weight),
    totalGrams: calculateEmissions(total),
    grade: band.grade,
    gradeColor: band.color,
    gradeBlurb: band.blurb
  });
}

async function handleGetReport(tabId: number, sendResponse: (r: any) => void) {
  await ready();
  try {
    const details = (await browserAPI.tabs.sendMessage(tabId, { type: 'COLLECT_DETAILS' }, { frameId: 0 })) as PageDetails | undefined;
    if (!details || !details.pageUrl) return sendResponse({ error: 'no-details' });
    const report = analyzePage(details, tracker.getRequests(tabId));
    const s = tracker.get(tabId);
    const site = s?.host ? await storage.getSiteWeight(s.host) : null;
    sendResponse({
      report,
      site: site ? { ...site, grade: gradeForBytes(site.medianBytes).grade, color: gradeForBytes(site.medianBytes).color } : null,
      trackingEnabled
    });
  } catch {
    // Content script not present (browser pages, the Web Store, or a tab opened before install)
    sendResponse({ error: 'unavailable' });
  }
}

async function handleReset(sendResponse: (response: any) => void) {
  for (const k of Object.keys(pending)) delete pending[k];
  pendingGraded.pages = 0;
  pendingGraded.weightGrams = 0;
  await storage.reset();
  sendResponse({ success: true });
}

async function handleEnableTracking(sendResponse: (response: any) => void) {
  await settings.setSetting('trackingEnabled', true);
  trackingEnabled = true;
  sendResponse({ success: true });
}

// ---- badge: the site's grade, per tab ----
// Blank while a page of a new site loads; a site graded on earlier visits shows
// its grade right away. The grade is the median of the site's last 20 pages.
function setGradeBadge(tabId: number, medianBytes: number) {
  const band = gradeForBytes(medianBytes);
  browserAPI.action.setBadgeText({ tabId, text: band.grade }).catch(() => undefined);
  browserAPI.action.setBadgeBackgroundColor({ tabId, color: band.color }).catch(() => undefined);
  browserAPI.action.setBadgeTextColor?.({ tabId, color: '#ffffff' })?.catch?.(() => undefined);
}

function showKnownSiteGrade(tabId: number, host: string) {
  browserAPI.action.setBadgeText({ tabId, text: '' }).catch(() => undefined);
  if (!host) return;
  storage.getSiteWeight(host).then((known) => {
    const s = tracker.get(tabId);
    if (known && s && s.host === host && s.siteMedianBytes === undefined) {
      setGradeBadge(tabId, known.medianBytes);
    }
  });
}
