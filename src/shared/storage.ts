import { StorageData, SiteData, SiteEmissions, DayRecord, WeekSummary, HistoryResponse, SiteWeights, GradeMix } from './types';
import { gradeForGrams, gradeForBytes } from '../utils/page-score';
import { browserAPI } from './browser-polyfill';

const EMISSIONS_KEYS = ['totalEmissions', 'pageCount', 'lastUpdated', 'siteEmissions', 'trackingSince', 'dailyHistory', 'siteWeights'];
const SITE_SAMPLES = 20;
const MAX_SITES = 3000;
const GOOD_GRADES = new Set(['A+', 'A', 'B', 'C']);
const HISTORY_DAYS = 365;
const SITES_PER_DAY = 25;

/** Local calendar date as YYYY-MM-DD. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

function emptyDay(): DayRecord {
  return { grams: 0, pages: 0, gradedPages: 0, weightGrams: 0, sites: {}, visited: {} };
}

export function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export class EmissionsStorage {
  // Every write goes through this chain so two tabs finishing at the same moment
  // can't both read the old total and overwrite each other's update.
  private queue: Promise<unknown> = Promise.resolve();

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  async getData(): Promise<StorageData> {
    const result = await browserAPI.storage.local.get(EMISSIONS_KEYS);
    return {
      totalEmissions: (result.totalEmissions as number) || 0,
      pageCount: (result.pageCount as number) || 0,
      lastUpdated: (result.lastUpdated as number) || Date.now(),
      trackingSince: result.trackingSince as number | undefined,
      siteEmissions: (result.siteEmissions as { [domain: string]: SiteData }) || {}
    };
  }

  async getTotal(): Promise<number> {
    return (await this.getData()).totalEmissions;
  }

  /**
   * Add emissions for a domain. countAsPageView is false for follow-up
   * measurements on a page that was already counted.
   */
  addEmissions(grams: number, domain: string | undefined, countAsPageView: boolean): Promise<number> {
    return this.enqueue(async () => {
      const data = await this.getData();
      const now = Date.now();
      const siteEmissions = data.siteEmissions || {};

      if (domain) {
        const site = siteEmissions[domain] || { emissions: 0, pageViews: 0 };
        siteEmissions[domain] = {
          emissions: site.emissions + grams,
          pageViews: site.pageViews + (countAsPageView ? 1 : 0)
        };
      }

      const totalEmissions = data.totalEmissions + grams;
      await browserAPI.storage.local.set({
        totalEmissions,
        pageCount: data.pageCount + (countAsPageView ? 1 : 0),
        lastUpdated: now,
        trackingSince: data.trackingSince || now,
        siteEmissions
      });
      return totalEmissions;
    });
  }

  /** Apply many per-domain increments in one storage write. */
  addBatch(
    batch: { [domain: string]: { grams: number; pageViews: number } },
    graded: { pages: number; weightGrams: number } = { pages: 0, weightGrams: 0 }
  ): Promise<number> {
    return this.enqueue(async () => {
      const data = await this.getData();
      const now = Date.now();
      const siteEmissions = data.siteEmissions || {};
      let addedGrams = 0;
      let addedViews = 0;

      for (const [domain, inc] of Object.entries(batch)) {
        addedGrams += inc.grams;
        addedViews += inc.pageViews;
        if (!domain) continue;
        const site = siteEmissions[domain] || { emissions: 0, pageViews: 0 };
        siteEmissions[domain] = {
          emissions: site.emissions + inc.grams,
          pageViews: site.pageViews + inc.pageViews
        };
      }

      // Daily history
      const histResult = await browserAPI.storage.local.get('dailyHistory');
      const history = (histResult.dailyHistory as { [day: string]: DayRecord }) || {};
      const today = dayKey();
      const day = history[today] || emptyDay();
      day.grams += addedGrams;
      day.pages += addedViews;
      day.gradedPages += graded.pages;
      day.weightGrams += graded.weightGrams;
      day.visited = day.visited || {};
      for (const [domain, inc] of Object.entries(batch)) {
        if (domain && inc.grams > 0) day.sites[domain] = (day.sites[domain] || 0) + inc.grams;
        if (domain && inc.pageViews > 0) day.visited[domain] = (day.visited[domain] || 0) + inc.pageViews;
      }
      day.sites = Object.fromEntries(
        Object.entries(day.sites).sort((a, b) => b[1] - a[1]).slice(0, SITES_PER_DAY)
      );
      history[today] = day;
      const cutoff = daysAgo(HISTORY_DAYS);
      for (const k of Object.keys(history)) if (k < cutoff) delete history[k];

      const totalEmissions = data.totalEmissions + addedGrams;
      await browserAPI.storage.local.set({
        totalEmissions,
        pageCount: data.pageCount + addedViews,
        lastUpdated: now,
        trackingSince: data.trackingSince || now,
        siteEmissions,
        dailyHistory: history
      });
      return totalEmissions;
    });
  }

  /**
   * Record one finished page load for a site and return the site's median page
   * weight over its last 20 loads.
   */
  recordSiteWeight(domain: string, bytes: number): Promise<{ medianBytes: number; samples: number }> {
    return this.enqueue(async () => {
      const r = await browserAPI.storage.local.get('siteWeights');
      const all = (r.siteWeights as { [d: string]: SiteWeights }) || {};
      const entry = all[domain] || { w: [], t: 0 };
      entry.w.push(Math.round(bytes));
      if (entry.w.length > SITE_SAMPLES) entry.w = entry.w.slice(-SITE_SAMPLES);
      entry.t = Date.now();
      all[domain] = entry;
      const keys = Object.keys(all);
      if (keys.length > MAX_SITES) {
        keys.sort((a, b) => all[a].t - all[b].t)
          .slice(0, keys.length - MAX_SITES)
          .forEach((k) => delete all[k]);
      }
      await browserAPI.storage.local.set({ siteWeights: all });
      return { medianBytes: median(entry.w), samples: entry.w.length };
    });
  }

  async getSiteWeight(domain: string): Promise<{ medianBytes: number; samples: number } | null> {
    const r = await browserAPI.storage.local.get('siteWeights');
    const entry = ((r.siteWeights as { [d: string]: SiteWeights }) || {})[domain];
    return entry && entry.w.length ? { medianBytes: median(entry.w), samples: entry.w.length } : null;
  }

  /** Rolling 7-day summary compared with the 7 days before it. */
  async getHistory(now: Date = new Date()): Promise<HistoryResponse> {
    const r = await browserAPI.storage.local.get(['dailyHistory', 'siteWeights']);
    const history = (r.dailyHistory as { [day: string]: DayRecord }) || {};
    const weights = (r.siteWeights as { [d: string]: SiteWeights }) || {};
    const siteGrade = (domain: string): string | null => {
      const e = weights[domain];
      return e && e.w.length ? gradeForBytes(median(e.w)).grade : null;
    };

    // Sites visited in a 7-day window, grouped by each site's current grade
    const mixFor = (startOffset: number): GradeMix => {
      const views: { [d: string]: number } = {};
      for (let i = startOffset; i < startOffset + 7; i++) {
        const v = history[daysAgo(i, now)]?.visited || {};
        for (const [d, n] of Object.entries(v)) views[d] = (views[d] || 0) + n;
      }
      const counts: { [g: string]: number } = {};
      let sites = 0, goodSites = 0, gradedViews = 0, goodViews = 0;
      for (const [d, n] of Object.entries(views)) {
        const g = siteGrade(d);
        if (!g) continue;
        counts[g] = (counts[g] || 0) + 1;
        sites += 1;
        gradedViews += n;
        if (GOOD_GRADES.has(g)) { goodSites += 1; goodViews += n; }
      }
      return { counts, sites, goodSites, pageShareGood: gradedViews ? goodViews / gradedViews : null };
    };

    const summarize = (startOffset: number): { summary: WeekSummary; sites: { [d: string]: number } } => {
      let grams = 0, pages = 0, gradedPages = 0, weightGrams = 0;
      const sites: { [d: string]: number } = {};
      for (let i = startOffset; i < startOffset + 7; i++) {
        const d = history[daysAgo(i, now)];
        if (!d) continue;
        grams += d.grams;
        pages += d.pages;
        gradedPages += d.gradedPages;
        weightGrams += d.weightGrams;
        for (const [site, g] of Object.entries(d.sites)) sites[site] = (sites[site] || 0) + g;
      }
      const avg = gradedPages > 0 ? weightGrams / gradedPages : null;
      const band = avg === null ? null : gradeForGrams(avg);
      return {
        summary: {
          grams, pages, gradedPages,
          avgPageGrams: avg,
          grade: band ? band.grade : null,
          gradeColor: band ? band.color : null
        },
        sites
      };
    };

    const thisWeek = summarize(0);
    const lastWeek = summarize(7);
    const daily: { date: string; grams: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = daysAgo(i, now);
      daily.push({ date, grams: history[date]?.grams || 0 });
    }
    const weekTotal = thisWeek.summary.grams;
    const topSites: SiteEmissions[] = Object.entries(thisWeek.sites)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, emissions]) => ({
        domain,
        emissions,
        pageViews: 0,
        percentage: weekTotal > 0 ? (emissions / weekTotal) * 100 : 0
      }));

    return { thisWeek: thisWeek.summary, lastWeek: lastWeek.summary, mix: mixFor(0), lastMix: mixFor(7), daily, topSites };
  }

  // Clear emissions data only. User settings (theme, tracking consent) are kept.
  reset(): Promise<void> {
    return this.enqueue(() => browserAPI.storage.local.remove(EMISSIONS_KEYS));
  }

  async getTopSites(limit: number = 5): Promise<SiteEmissions[]> {
    const data = await this.getData();
    const total = data.totalEmissions;
    return Object.entries(data.siteEmissions || {})
      .map(([domain, site]) => ({
        domain,
        emissions: site.emissions,
        pageViews: site.pageViews,
        percentage: total > 0 ? (site.emissions / total) * 100 : 0
      }))
      .sort((a, b) => b.emissions - a.emissions)
      .slice(0, limit);
  }
}
