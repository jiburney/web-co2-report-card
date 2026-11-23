// Measures bytes transferred by the page and reports them to the background worker.
// Runs at document_start so the observer sees every resource, including ones loaded
// after the page finishes (lazy images, video segments, infinite scroll).
// Only the hostname is sent. No URLs, page content, or personal data are read.
import { browserAPI } from '../shared/browser-polyfill';

const FLUSH_INTERVAL_MS = 15000;

let pendingBytes = 0;
let pendingWeight = 0;
let firstReportSent = false;

function record(entries: PerformanceEntryList) {
  for (const entry of entries) {
    const e = entry as PerformanceResourceTiming;
    const transferred = e.transferSize || 0;
    // encodedBodySize is the file's size even when it came from a cache
    // (browser cache or a site's service worker), where transferSize is 0.
    const weight = Math.max(transferred, e.encodedBodySize || 0);
    if (transferred > 0) pendingBytes += transferred;
    if (weight > 0) pendingWeight += weight;
  }
}

function send(isNewPage: boolean) {
  if (!isNewPage && pendingBytes === 0 && pendingWeight === 0) return;
  const bytes = pendingBytes;
  const weight = pendingWeight;
  pendingBytes = 0;
  pendingWeight = 0;
  try {
    browserAPI.runtime.sendMessage({
      type: 'PAGE_LOAD',
      bytesTransferred: bytes,
      weightBytes: weight,
      url: window.location.hostname,
      isNewPage,
      timestamp: Date.now()
    });
  } catch {
    // Extension was reloaded or updated; this page's script is orphaned. Ignore.
  }
}

try {
  // An observer is not limited by the 250-entry resource timing buffer,
  // which heavy pages fill quickly.
  const observer = new PerformanceObserver((list) => record(list.getEntries()));
  observer.observe({ type: 'resource', buffered: true });
  const navObserver = new PerformanceObserver((list) => record(list.getEntries()));
  navObserver.observe({ type: 'navigation', buffered: true });
} catch {
  // PerformanceObserver unavailable: fall back to a one-time read at load.
  window.addEventListener('load', () => {
    record(performance.getEntriesByType('navigation'));
    record(performance.getEntriesByType('resource'));
  });
}

function onLoaded() {
  // Give the observer a moment to deliver the final entries.
  setTimeout(() => {
    firstReportSent = true;
    send(true);
    setInterval(() => send(false), FLUSH_INTERVAL_MS);
  }, 500);
}

if (document.readyState === 'complete') {
  onLoaded();
} else {
  window.addEventListener('load', onLoaded, { once: true });
}

// Flush anything left when the user leaves or hides the tab.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && firstReportSent) send(false);
});
window.addEventListener('pagehide', () => {
  if (firstReportSent) send(false);
});

// ---- Report details, collected only when the user opens a report ----
browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'COLLECT_DETAILS') return false;
  const entries = [
    ...performance.getEntriesByType('navigation'),
    ...performance.getEntriesByType('resource')
  ] as PerformanceResourceTiming[];
  const dpr = window.devicePixelRatio || 1;
  const images = Array.from(document.images)
    .filter((img) => img.complete && img.naturalWidth > 0)
    .map((img) => {
      const rect = img.getBoundingClientRect();
      return {
        src: img.currentSrc || img.src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: rect.width * dpr,
        displayHeight: rect.height * dpr
      };
    })
    .filter((i) => i.displayWidth > 0 && i.displayHeight > 0);
  sendResponse({
    pageUrl: location.href,
    resources: entries.map((e) => ({
      name: e.name,
      initiatorType: e.entryType === 'navigation' ? 'navigation' : e.initiatorType,
      transferSize: e.transferSize || 0,
      encodedBodySize: e.encodedBodySize || 0,
      decodedBodySize: e.decodedBodySize || 0
    })),
    images
  });
  return false;
});
