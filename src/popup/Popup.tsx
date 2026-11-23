import React, { useEffect, useState } from 'react';
import './Popup.css';
import { browserAPI } from '../shared/browser-polyfill';
import { SiteEmissions, TotalResponse, TabScoreResponse, HistoryResponse, WeekSummary, GradeMix } from '../shared/types';
import { GRADE_COLORS, GRADE_ORDER } from '../utils/grade-colors';
import { formatBytes } from '../utils/format';
import { formatComparison } from '../utils/co2-comparisons';
import { SettingsStorage, UserSettings } from '../shared/settings';

const settingsStorage = new SettingsStorage();

function requestTotals(): Promise<TotalResponse | undefined> {
  return new Promise((resolve) => {
    browserAPI.runtime.sendMessage({ type: 'GET_TOTAL' }, (response) => resolve(response));
  });
}

let activeTabUrl = '';

async function requestTabScore(): Promise<TabScoreResponse | null> {
  const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
  activeTabUrl = tab?.url || '';
  if (!tab || tab.id === undefined) return null;
  return new Promise((resolve) => {
    browserAPI.runtime.sendMessage({ type: 'GET_TAB_SCORE', tabId: tab.id }, (r) => resolve(r || null));
  });
}

function requestHistory(): Promise<HistoryResponse | null> {
  return new Promise((resolve) => {
    browserAPI.runtime.sendMessage({ type: 'GET_HISTORY' }, (r) => resolve(r || null));
  });
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function weightTrend(thisWeek: WeekSummary, lastWeek: WeekSummary): { text: string; good: boolean | null } | null {
  if (thisWeek.avgPageGrams === null || lastWeek.avgPageGrams === null || lastWeek.avgPageGrams === 0) return null;
  const change = (thisWeek.avgPageGrams - lastWeek.avgPageGrams) / lastWeek.avgPageGrams;
  const p = Math.round(Math.abs(change) * 100);
  if (p < 3) return { text: 'about the same as last week', good: null };
  return change < 0
    ? { text: `${p}% lighter than last week`, good: true }
    : { text: `${p}% heavier than last week`, good: false };
}

const GradeMixBar: React.FC<{ mix: GradeMix }> = ({ mix }) => (
  <div className="mix">
    <div className="mix-bar" role="img" aria-label="Sites visited by grade">
      {GRADE_ORDER.filter((g) => mix.counts[g]).map((g) => (
        <div
          key={g}
          className="mix-seg"
          style={{ flexGrow: mix.counts[g], backgroundColor: GRADE_COLORS[g] }}
          title={`${g}: ${mix.counts[g]} site${mix.counts[g] === 1 ? '' : 's'}`}
        >
          {mix.counts[g] / mix.sites >= 0.08 ? g : ''}
        </div>
      ))}
    </div>
    <div className="mix-legend">
      {GRADE_ORDER.filter((g) => mix.counts[g]).map((g) => (
        <span key={g}><i style={{ backgroundColor: GRADE_COLORS[g] }} />{g} {mix.counts[g]}</span>
      ))}
    </div>
  </div>
);

const WeekChart: React.FC<{ daily: HistoryResponse['daily'] }> = ({ daily }) => {
  const max = Math.max(...daily.map((d) => d.grams), 0.0001);
  return (
    <div className="week-chart" aria-label="CO2e per day, last 7 days">
      {daily.map((d, i) => {
        const [y, m, day] = d.date.split('-').map(Number);
        const letter = DAY_LETTERS[new Date(y, m - 1, day).getDay()];
        const h = d.grams > 0 ? Math.max(4, Math.round((d.grams / max) * 48)) : 2;
        return (
          <div key={d.date} className="week-col" title={`${d.date}: ${d.grams.toFixed(1)} g`}>
            <div className={`week-bar${i === daily.length - 1 ? ' today' : ''}`} style={{ height: `${h}px` }} />
            <div className="week-day">{letter}</div>
          </div>
        );
      })}
    </div>
  );
};

const formatEmissions = (grams: number): string => {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  if (grams > 0 && grams < 0.1) return '< 0.1 g';
  return `${grams.toFixed(1)} g`;
};

const formatPageGrams = (grams: number): string =>
  grams < 1 ? `${grams.toFixed(2)} g` : formatEmissions(grams);

const formatSince = (ts: number): string =>
  new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const Popup: React.FC = () => {
  const [totalGrams, setTotalGrams] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [topSites, setTopSites] = useState<SiteEmissions[]>([]);
  const [trackingSince, setTrackingSince] = useState<number | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [tabScore, setTabScore] = useState<TabScoreResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  const load = async () => {
    const [response, s, score] = await Promise.all([
      requestTotals(),
      settingsStorage.getSettings(),
      requestTabScore().catch(() => null)
    ]);
    setTabScore(score);
    setHistory(await requestHistory().catch(() => null));
    if (response) {
      setTotalGrams(response.totalGrams);
      setPageCount(response.pageCount || 0);
      setTopSites(response.topSites || []);
      setTrackingSince(response.trackingSince ?? null);
    }
    setSettings(s);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStart = () => {
    browserAPI.runtime.sendMessage({ type: 'ENABLE_TRACKING' }, () => load());
  };

  const openReport = async () => {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return;
    browserAPI.tabs.create({ url: browserAPI.runtime.getURL(`report.html?tab=${tab.id}`) });
    window.close();
  };

  const handleReset = () => {
    if (confirm('Reset your carbon counter to zero? This erases all stored data.')) {
      browserAPI.runtime.sendMessage({ type: 'RESET' }, () => load());
    }
  };

  const handleToggleDarkMode = async () => {
    const darkMode = await settingsStorage.toggleDarkMode();
    setSettings((s) => (s ? { ...s, darkMode } : s));
  };

  if (!settings) {
    return (
      <div className="popup dark">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const theme = settings.darkMode ? 'dark' : 'light';
  const header = (
    <div className="header">
      <img className="app-icon" src="icons/icon48.png" width="32" height="32" alt="" />
      <div className="title-block">
        <h1>Web CO₂ Report Card</h1>
        <div className="subtitle">Grades for the sites you visit</div>
      </div>
      <button
        onClick={handleToggleDarkMode}
        className="theme-toggle"
        title={settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {settings.darkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );

  if (!settings.trackingEnabled) {
    return (
      <div className={`popup ${theme}`}>
        {header}
        <div className="disclosure">
          <p>
            This extension estimates the CO₂ from the pages you load. To do that it measures the
            size of each network request a page makes and notes the site's domain name.
          </p>
          <p>
            All data stays on this device. Nothing is sent anywhere, and you can erase it at any time.
          </p>
          <button onClick={handleStart} className="start-btn">Start tracking</button>
        </div>
      </div>
    );
  }

  const week = history?.thisWeek;
  const trend = history ? weightTrend(history.thisWeek, history.lastWeek) : null;
  const weekSites = history?.topSites || [];

  return (
    <div className={`popup ${theme}`}>
      {header}

      {!tabScore && (
        <div className="page-score">
          <div className="grade pending">–</div>
          <div className="page-score-text">
            {/^https?:/.test(activeTabUrl) ? (
              <>
                <div className="page-detail">This page hasn't been measured yet.</div>
                <div className="page-blurb">Reload it to get a grade and a report.</div>
              </>
            ) : (
              <div className="page-detail">Browser pages can't be graded.</div>
            )}
          </div>
        </div>
      )}

      {tabScore && (
        <div className="page-score">
          <div
            className={`grade${tabScore.siteGrade ? '' : ' pending'}`}
            style={{ backgroundColor: tabScore.siteGradeColor || undefined }}
          >
            {tabScore.siteGrade || '…'}
          </div>
          <div className="page-score-text">
            <div className="page-host">{tabScore.host}</div>
            {tabScore.siteGrade && tabScore.siteMedianBytes !== null ? (
              <>
                <div className="page-detail">
                  Typical page {formatBytes(tabScore.siteMedianBytes)} · {formatPageGrams(tabScore.siteMedianGrams || 0)} CO₂e
                </div>
                <div className="page-blurb">{tabScore.siteGradeBlurb}</div>
                <div className="page-blurb">
                  {tabScore.siteSamples < 3
                    ? `Early grade, from ${tabScore.siteSamples} page${tabScore.siteSamples === 1 ? '' : 's'}`
                    : `Median of the last ${tabScore.siteSamples} pages you loaded`}
                </div>
              </>
            ) : (
              <>
                <div className="page-detail">Measuring this page…</div>
                <div className="page-blurb">If this doesn't change, reload the page.</div>
              </>
            )}
            {!tabScore.loading && (
              <div className="page-blurb this-page">
                This page: {formatBytes(tabScore.weightBytes)} ({tabScore.grade})
                {tabScore.loadTransferred < tabScore.weightBytes * 0.5 ? ', served from cache' : ''}
                {tabScore.totalBytes > Math.max(tabScore.weightBytes, tabScore.loadTransferred) * 1.1
                  ? ` · ${formatBytes(tabScore.totalBytes)} since opened`
                  : ''}
              </div>
            )}
            <button className="why-link" onClick={openReport}>Why this grade? →</button>
          </div>
        </div>
      )}

      <div className="week-card">
        <div className="week-header">
          <h3>Sites you visited, last 7 days</h3>
        </div>
        {history && history.mix.sites > 0 ? (
          <>
            <div className="week-avg">
              {history.mix.goodSites} of {history.mix.sites} site{history.mix.sites === 1 ? '' : 's'} grade C or better
            </div>
            {history.lastMix.sites > 0 && (
              <div className="page-blurb">
                Last week: {history.lastMix.goodSites} of {history.lastMix.sites} ({pct(history.lastMix.goodSites / history.lastMix.sites)})
              </div>
            )}
            <GradeMixBar mix={history.mix} />
            {history.mix.pageShareGood !== null && (
              <div className="page-blurb">{pct(history.mix.pageShareGood)} of your page views were on C-or-better sites</div>
            )}
            {week && week.avgPageGrams !== null && (
              <div className={`trend ${trend?.good === true ? 'good' : trend?.good === false ? 'bad' : ''}`}>
                Average page {formatPageGrams(week.avgPageGrams)} CO₂e{trend ? `, ${trend.text}` : ''}
              </div>
            )}
            <WeekChart daily={history.daily} />
            {week && week.grams > 0 && <div className="comparison-text week-compare">{formatComparison(week.grams)} this week</div>}
          </>
        ) : (
          <div className="page-blurb">Your weekly summary appears after your first few pages.</div>
        )}
      </div>

      {weekSites.length > 0 && (
        <div className="top-sites">
          <h3>Heaviest sites this week</h3>
          <div className="sites-list">
            {weekSites.map((site) => (
              <div key={site.domain} className="site-item">
                <span className="site-name">{site.domain}</span>
                <span className="site-emissions">
                  {formatEmissions(site.emissions)} ({site.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalGrams > 0 && (
        <div className="all-time">
          All time: {formatEmissions(totalGrams)} from {pageCount.toLocaleString()} pages
          {trackingSince ? ` since ${formatSince(trackingSince)}` : ''}
        </div>
      )}

      <button onClick={handleReset} className="reset-btn">
        Reset Counter
      </button>

      <p className="footnote">
        Estimates use the Sustainable Web Design Model v4 via CO2.js. Grades use the Digital Carbon Ratings scale (sustainablewebdesign.org); a site's grade is the median page weight of its last 20 pages you loaded. Comparisons use U.S. EPA factors.
      </p>
    </div>
  );
};
