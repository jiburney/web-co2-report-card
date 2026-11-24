# Chrome Web Store submission: Web CO2 Report Card v1.2.0

Upload: `web-co2-report-card-v1.2.0.zip` (manifest.json is at the zip root, as the store requires).

## Store listing tab

**Name:** Web CO2 Report Card

(Use the plain "2" in the store name so searches for "co2" match. The extension displays it as CO₂.)

**Summary (132 char max):**
Carbon grades for every website, based on the data it loads. See why each site got its grade. Runs on your device.

**Category:** Productivity (alternative: Tools)

**Language:** English

**Description:**

Every web page you load moves data through networks and data centers that use electricity. Web CO2 Report Card estimates the CO2 that data represents and keeps a running total as you browse.

What you get
- An A+ to F grade for every site you visit, shown on the toolbar icon. A site's grade is the median weight of the last 20 pages you loaded there, so it stays steady as you move around the site.
- Grades use the Digital Carbon Ratings scale from the Sustainable Web Design project, which compares page weight against real websites measured by the HTTP Archive. The scale is intentionally strict: the median web page earns an F. (Website Carbon's calculator uses an older, more lenient scale, so its grades can differ.)
- A weekly view of the sites you visited, grouped by grade, with how many grade C or better compared with last week
- A running total of estimated CO2e across all your browsing
- Your top five sites by emissions, with each site's share of the total
- A "Why this grade?" report for any page: where the weight comes from (images, scripts, fonts, third parties), the heaviest files, and checks for oversized images, older image formats, uncompressed text, and third-party weight, with estimated savings and the grade the page would get after fixing them
- A 7-day chart of your browsing's CO2e and an everyday comparison, such as smartphone charges or miles driven, using U.S. EPA equivalency factors
- An intensity level that changes color as your total grows
- Light and dark themes

How it works
The extension measures the size of every network request a page makes, including ads, embedded content, and video that loads after the page appears. It converts bytes to CO2e with CO2.js from the Green Web Foundation, using the Sustainable Web Design Model v4.

Privacy
All data stays on your device. The extension stores only byte totals and domain names, makes no network requests, and has no accounts, analytics, or ads. Tracking starts only after you choose to turn it on. Reset Counter erases everything.

Limitations
These are estimates. A few streamed responses don't report their size, so totals can run slightly low.

**Screenshots needed (1280x800 or 640x400, at least 1, up to 5):**
1. Popup showing a page grade, total, and top sites (dark theme)
2. Same in light theme
3. Welcome page showing the privacy disclosure
4. Toolbar badge showing a page grade on a real site

**Small promo tile (440x280):** required. Leaf + "Web CO2 Report Card" + one line.

## Privacy practices tab

**Single purpose:**
Estimate and display the carbon emissions of the web pages the user loads.

**Permission justifications:**
- `storage`: Saves the running emissions total, per-domain totals, and the user's settings on the device.
- `webRequest`: Reads the size (Content-Length) of each network request so the extension can measure how much data a page transfers, including ads and embedded frames. Requests are observed only; nothing is blocked or modified.
- Report details: when the user opens a report, the extension reads the current page's file list, sizes, response headers, and image dimensions to explain the grade. This is held in memory for that tab only and never stored or transmitted.
- Host permission (`<all_urls>`): Required for webRequest to observe requests and for the measurement script to run on any site the user visits. The extension reads request sizes, performance timing data, and the page's hostname. It does not read page content or store URLs.

**Remote code:** No, I am not using remote code. (All JavaScript is bundled in the package.)

**Data usage disclosures:**
- Check **Web history** only if the dashboard's wording requires it for domain names stored locally. The data never leaves the device; say so in the justification field if one is offered.
- Certify all three statements: not sold to third parties; not used for purposes unrelated to the single purpose; not used for creditworthiness or lending.

**Privacy policy URL:**
https://jiburney.github.io/carbon-tracker-landing/privacy.html (confirm this URL once landing-page/privacy.html is pushed; replace CONTACT_EMAIL in that file first)

## Account

- Developer registration is a one-time $5 fee in the developer dashboard.
- Set a contact email on the account; the store requires a way for users to reach you.

## Expect

Broad host permissions with webRequest usually trigger a longer manual review than an extension with narrow permissions. The clear single purpose, local-only storage, and opt-in disclosure are what reviewers look for.
