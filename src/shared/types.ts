// Content script -> background: bytes measured on a page.
// isNewPage is true for the first report after a page load, false for later
// resources (lazy-loaded images, video segments, infinite scroll).
export interface PageLoadMessage {
  type: 'PAGE_LOAD';
  bytesTransferred: number;  // bytes that crossed the network
  weightBytes?: number;      // size of the files, even if served from cache
  url: string;          // hostname only
  isNewPage: boolean;
  timestamp: number;
}

export interface GetTotalMessage {
  type: 'GET_TOTAL';
}

export interface ResetMessage {
  type: 'RESET';
}

export interface GetTabScoreMessage {
  type: 'GET_TAB_SCORE';
  tabId: number;
}

export interface GetReportMessage {
  type: 'GET_REPORT';
  tabId: number;
}

export interface GetHistoryMessage {
  type: 'GET_HISTORY';
}

export interface TabScoreResponse {
  host: string;
  siteGrade: string | null;        // null until the first page finishes loading
  siteGradeColor: string | null;
  siteGradeBlurb: string | null;
  siteMedianBytes: number | null;
  siteMedianGrams: number | null;
  siteSamples: number;
  weightBytes: number;            // page weight used for the grade
  loading: boolean;               // true until the page finishes loading
  loadTransferred: number;        // bytes actually transferred during the load
  totalBytes: number;             // bytes transferred since the page was opened
  weightGrams: number;
  totalGrams: number;
  grade: string;
  gradeColor: string;
  gradeBlurb: string;
}

export interface EnableTrackingMessage {
  type: 'ENABLE_TRACKING';
}

export interface TotalResponse {
  type: 'TOTAL_RESPONSE';
  totalGrams: number;
  lastUpdated: number;
  pageCount?: number;
  topSites?: SiteEmissions[];
  trackingSince?: number | null;
}

export interface SiteEmissions {
  domain: string;
  emissions: number;  // grams
  pageViews: number;
  percentage: number; // percentage of total
}

export type ExtensionMessage =
  | PageLoadMessage
  | GetTotalMessage
  | ResetMessage
  | EnableTrackingMessage
  | GetTabScoreMessage
  | GetHistoryMessage
  | GetReportMessage
  | TotalResponse;

export interface StorageData {
  totalEmissions: number;  // grams
  lastUpdated: number;
  pageCount: number;
  trackingSince?: number;
  siteEmissions?: { [domain: string]: SiteData };
}

// One day of history, keyed by local date (YYYY-MM-DD)
export interface DayRecord {
  grams: number;          // CO2e from bytes transferred that day
  pages: number;          // page views
  gradedPages: number;    // pages that finished loading and got a grade
  weightGrams: number;    // sum of graded pages' page-weight CO2e
  sites: { [domain: string]: number };  // grams per site (top 25 kept)
  visited?: { [domain: string]: number }; // page views per site that day
}

// Recent page weights for one site, used for its grade
export interface SiteWeights {
  w: number[];   // page weight in bytes, most recent last (max 20)
  t: number;     // last seen (ms)
}

export interface GradeMix {
  counts: { [grade: string]: number };  // sites per grade
  sites: number;                         // sites with a grade
  goodSites: number;                     // sites graded C or better
  pageShareGood: number | null;          // share of page views on C-or-better sites
}

export interface WeekSummary {
  grams: number;
  pages: number;
  gradedPages: number;
  avgPageGrams: number | null;  // null when no graded pages
  grade: string | null;
  gradeColor: string | null;
}

export interface HistoryResponse {
  thisWeek: WeekSummary;
  lastWeek: WeekSummary;
  mix: GradeMix;
  lastMix: GradeMix;
  daily: { date: string; grams: number }[];  // last 7 days, oldest first
  topSites: SiteEmissions[];                  // this week
}

export interface SiteData {
  emissions: number;  // grams
  pageViews: number;
}
