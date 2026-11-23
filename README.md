# Web CO₂ Report Card

A Chrome/Firefox extension that tracks the estimated carbon emissions from your web browsing using CO2.js from the Green Web Foundation.

## Features

- **Real-time tracking**: Measures data transfer on every page load
- **CO2 calculations**: Uses industry-standard Sustainable Web Design Model v4
- **Contextual comparisons**: Shows relatable comparisons (like driving, streaming, etc.)
- **Per-site breakdown**: Track emissions by domain with top 5 emitting sites
- **Persistent counter**: Tracks total emissions across browser sessions
- **Clean UI**: Simple, beautiful popup showing your carbon footprint
- **Cross-browser**: Works on Chrome, Edge, Brave, and Firefox
- **Lightweight**: <50ms performance overhead per page load

## Installation (Development)

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in your browser:

   **Chrome/Edge/Brave:**
   - Open `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist/` folder

   **Firefox:**
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select any file in the `dist/` folder

## Development

Run in watch mode:
```bash
npm run dev
```

This will automatically rebuild when you make changes. You'll need to reload the extension in Chrome after changes.

## How It Works

1. **Content Script**: Measures data transfer using the Performance API on every page load
2. **Background Worker**: Calculates CO2 emissions using CO2.js and stores per-site data
3. **Popup UI**: Displays total emissions with contextual comparisons and top 5 emitting sites
4. **Storage**: All data persists locally using chrome.storage.local

## Performance

- Content script execution: <20ms
- CO2 calculation: <1ms
- Storage write: <5ms
- Total overhead: <50ms per page load

## Privacy

- All data stays local (chrome.storage.local)
- Only tracks domain names (not full URLs)
- No external analytics or telemetry
- No browsing history stored

## What's New in V1.2

- **Page grades**: Every page gets an A+ to F grade on the toolbar badge, using the Sustainable Web Design Model v4 rating scale. Grades rate the initial page load; the popup also shows data used since the page was opened.
- **Grades use page weight**: The grade is based on each file's size (`encodedBodySize`), so pages served from a browser or service-worker cache still get a real grade. The running total counts only bytes that actually crossed the network, and the popup notes when a visit was served from cache.
- **Why this grade? report**: Opens from the popup for the current page. Shows weight by file type and first vs third party, the heaviest files, and four checks with estimated savings: images larger than displayed, JPEG/PNG/GIF instead of WebP/AVIF, text sent without compression, and third-party share. Projects the grade after fixes. Per-file details are collected only when a report is opened (content script `COLLECT_DETAILS` plus an in-memory request log per tab) and are never written to storage. Analysis lives in `src/report/analyze.ts` as a pure function; `test/fixtures/report-sample.json` is a sample output.
- **Site grades**: The toolbar badge shows a grade per site: the median page weight of the last 20 pages loaded on that site (`www.` is ignored). A site graded on earlier visits shows its grade immediately; a new site's badge stays blank until its first page finishes loading, so the grade never changes mid-load. Grades use the Digital Carbon Ratings scale (sustainablewebdesign.org), whose cutoffs come from the June 2023 HTTP Archive crawl and are fixed on purpose.
- **Weekly view and history**: The popup groups the sites you visited in the last 7 days by grade, shows how many grade C or better compared with the week before, the share of page views on those sites, average page weight trend, and a 7-day chart. Daily history is kept in `chrome.storage.local` for 365 days.
- **Network-level measurement**: The background worker measures every request a tab makes via `webRequest`, including ads, iframes, and third-party servers that the Performance API reports as 0 bytes. It merges this with the content script's measurement per tab, taking the larger of the two.
- **Correct CO2 model**: Calculations now explicitly use the Sustainable Web Design Model v4. Earlier builds silently used v3 (the CO2.js 0.17 default), which estimated about 2.5x higher.
- **Visible toolbar badge**: The badge now shows your running total (for example, `42g`) in the intensity color. Previously the text was empty, so Chrome hid the badge.
- **More complete measurement**: The content script now uses a PerformanceObserver from document start, so it is no longer capped by the 250-entry resource buffer and it counts data loaded after the page appears (video, infinite scroll).
- **Accurate comparisons**: Comparisons now scale with your total ("About 4 smartphone charges", "About 3 miles driven") using U.S. EPA equivalency factors.
- **Opt-in disclosure**: A welcome page and popup disclosure explain what is read and stored. Nothing is recorded until you click Start tracking.
- **Fixes**: Reset no longer wipes your theme setting. Concurrent page loads no longer overwrite each other's totals. The popup shows the date tracking started.

## What's New in V1.1

### Contextual Comparisons
Your CO2 emissions are now compared to everyday activities to give you a better sense of the impact:
- Charging a smartphone
- Boiling water for tea
- Streaming video
- Driving a car
- And more!

### Per-Site Breakdown
See which websites contribute most to your carbon footprint:
- Top 5 emitting sites
- Emissions per domain
- Percentage of total
- Page view counts

## Roadmap

### Next - Analytics
- Monthly view and longer charts
- Export data as CSV

### V1.3 - Carbon Offset Integration
- Integration with carbon offset APIs
- Calculate offset costs
- Direct links to offset providers

### Next - Report checks, phase 2
- Web fonts (count, weight, self-hosting)
- Cache lifetimes for static files
- Autoplaying or preloaded video
- Optional green hosting lookup via the Green Web Foundation API (would be the extension's first network request; opt-in)

### Future - Community comparison
- Show how a user's grams-per-page average compares with other users of the extension
- Requires an opt-in, anonymous aggregate (for example, one weekly average per install) and a small backend
- Changes the privacy model: today no data leaves the device, so this needs its own consent screen, privacy policy update, and store disclosure
- Interim option with no backend: compare against the HTTP Archive page-weight distribution the grades already use

## Tech Stack

- **React + TypeScript**: Popup UI
- **Webpack 5**: Build tooling
- **CO2.js**: Carbon calculations
- **Chrome Manifest V3**: Extension platform

## License

ISC

## Credits

- CO2 calculations powered by [CO2.js](https://github.com/thegreenwebfoundation/co2.js) from The Green Web Foundation
- Based on the Sustainable Web Design Model v4
