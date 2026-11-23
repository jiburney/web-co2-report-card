// Tracks bytes per tab from two sources and credits new bytes to the running total.
//
// 1. webRequest (background): sees every request the tab makes, including iframes,
//    ads, and third-party servers. Size comes from the Content-Length header, which
//    some streamed responses omit.
// 2. Content script (top frame): Performance API sizes. Includes streamed responses,
//    but reports 0 for most cross-origin files.
//
// Each source undercounts in different places, so a tab's bytes are the larger of
// the two. Only growth in that number is credited, so nothing is counted twice.
//
// Service workers are shut down when idle, so tab state lives in
// chrome.storage.session (in memory, cleared when the browser closes).
import { browserAPI } from '../shared/browser-polyfill';
import type { RequestRecord } from '../report/types';

const MAX_REQUESTS_PER_TAB = 800;

export interface TabState {
  host: string;
  webBytes: number;
  perfBytes: number;
  weightBytes: number;       // page weight incl. cached files (content script)
  loadWeight: number | null; // page weight at load, used for the grade
  siteMedianBytes?: number;  // this site's median page weight (incl. this page)
  siteSamples?: number;      // pages behind the site grade
  credited: number;          // bytes already added to the running total
  loadBytes: number | null;  // bytes at page load, used for the grade
  mainRequestId: string | null;
  startedAt: number;
}

const SESSION_KEY = 'tab_states';

export class TabTracker {
  private tabs: Record<number, TabState> = {};
  // Per-file details for the report. Memory only: never written to storage,
  // and cleared when the tab navigates or closes.
  private requests: Record<number, RequestRecord[]> = {};

  logRequest(tabId: number, record: RequestRecord) {
    const list = this.requests[tabId] || (this.requests[tabId] = []);
    if (list.length < MAX_REQUESTS_PER_TAB) list.push(record);
  }

  getRequests(tabId: number): RequestRecord[] {
    return this.requests[tabId] || [];
  }
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  readonly ready: Promise<void>;

  constructor() {
    this.ready = browserAPI.storage.session
      .get(SESSION_KEY)
      .then((r) => {
        this.tabs = (r[SESSION_KEY] as Record<number, TabState>) || {};
      })
      .catch(() => undefined);
  }

  get(tabId: number): TabState | undefined {
    return this.tabs[tabId];
  }

  /** A new top-level navigation started in this tab. Returns true if it's a new page. */
  startNavigation(tabId: number, url: string, requestId: string): boolean {
    const existing = this.tabs[tabId];
    // Redirects reuse the request id; don't reset or double count.
    if (existing && existing.mainRequestId === requestId) {
      existing.host = hostOf(url) || existing.host;
      this.scheduleSave();
      return false;
    }
    this.requests[tabId] = [];
    this.tabs[tabId] = {
      host: hostOf(url),
      webBytes: 0,
      perfBytes: 0,
      weightBytes: 0,
      loadWeight: null,
      credited: 0,
      loadBytes: null,
      mainRequestId: requestId,
      startedAt: Date.now()
    };
    this.scheduleSave();
    return true;
  }

  private ensure(tabId: number, host: string): TabState {
    if (!this.tabs[tabId]) {
      this.tabs[tabId] = {
        host, webBytes: 0, perfBytes: 0, weightBytes: 0, loadWeight: null, credited: 0,
        loadBytes: null, mainRequestId: null, startedAt: Date.now()
      };
    }
    return this.tabs[tabId];
  }

  addWebBytes(tabId: number, bytes: number, fallbackHost: string) {
    this.ensure(tabId, fallbackHost).webBytes += bytes;
  }

  addPerfBytes(tabId: number, bytes: number, weight: number, host: string) {
    const s = this.ensure(tabId, host);
    if (!s.host) s.host = host;
    s.perfBytes += bytes;
    s.weightBytes += weight;
  }

  /** Page weight for grading: the larger of what was transferred and the files' own size. */
  gradeBytes(s: TabState): number {
    if (s.loadBytes !== null) return Math.max(s.loadBytes, s.loadWeight || 0);
    return Math.max(this.totalBytes(s), s.weightBytes);
  }

  totalBytes(s: TabState): number {
    return Math.max(s.webBytes, s.perfBytes);
  }

  /**
   * Called when a page reports it finished loading. If this tab's state already
   * belongs to a page that finished loading, Chrome didn't report a navigation
   * (for example, a page served by a service worker), so start fresh.
   * Returns true if a new page was started here.
   */
  beginPageIfNeeded(tabId: number, host: string): boolean {
    const s = this.tabs[tabId];
    if (s && s.loadBytes === null && (!s.host || s.host === host)) return false;
    this.requests[tabId] = [];
    this.tabs[tabId] = {
      host, webBytes: 0, perfBytes: 0, weightBytes: 0, loadWeight: null,
      credited: 0, loadBytes: null, mainRequestId: null, startedAt: Date.now()
    };
    this.scheduleSave();
    return true;
  }

  markLoaded(tabId: number) {
    const s = this.tabs[tabId];
    if (s && s.loadBytes === null) {
      s.loadBytes = this.totalBytes(s);
      s.loadWeight = s.weightBytes;
    }
  }

  /** Bytes not yet credited to the running total. Marks them credited. */
  takeUncredited(tabId: number): number {
    const s = this.tabs[tabId];
    if (!s) return 0;
    const total = this.totalBytes(s);
    const delta = total - s.credited;
    if (delta <= 0) return 0;
    s.credited = total;
    this.scheduleSave();
    return delta;
  }

  remove(tabId: number) {
    delete this.tabs[tabId];
    delete this.requests[tabId];
    this.scheduleSave();
  }

  private scheduleSave() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      browserAPI.storage.session.set({ [SESSION_KEY]: this.tabs }).catch(() => undefined);
    }, 1000);
  }
}

/** One key per site: "www.nytimes.com" and "nytimes.com" are the same site. */
export function siteKey(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

export function hostOf(url: string | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? siteKey(u.hostname) : '';
  } catch {
    return '';
  }
}
