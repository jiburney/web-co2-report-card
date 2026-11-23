# Setup Guide

## Quick Start

Your Carbon Footprint Tracker extension is ready! Follow these steps to test it:

### 1. Create Icons (Required)

The extension needs three icon files in `public/icons/`:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

**Quick Solution**: You can temporarily use any PNG images renamed to these sizes, or create simple colored squares using online tools like:
- https://www.favicon-generator.org/
- https://www.websiteplanet.com/webtools/favicon-generator/

Just create a simple green or earth-themed icon.

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right corner)
3. Click "Load unpacked"
4. Select the `/Users/jamesburney/projects/green-score-widget/dist` folder
5. The extension icon should appear in your toolbar!

### 3. Test the Extension

1. **Click the extension icon** - You should see the popup with "0.0 g" CO₂
2. **Navigate to any website** (e.g., google.com, youtube.com, github.com)
3. **Click the extension icon again** - The counter should have increased!
4. **Test the reset button** - Should reset counter to 0

### 4. Development Workflow

To make changes:

1. Edit files in `src/`
2. Run `npm run dev` (watches for changes)
3. After changes, go to `chrome://extensions/` and click the reload icon on your extension
4. Test your changes

## Troubleshooting

### Extension won't load
- Make sure you selected the `/dist` folder, not the root folder
- Check that icons exist in `public/icons/` (see step 1 above)

### Counter not incrementing
- Open Chrome DevTools on any website
- Go to Console tab
- Check for any errors from the content script
- Open the extension background worker console (click "service worker" link in `chrome://extensions/`)

### Popup not showing data
- Right-click the popup and select "Inspect"
- Check the Console for errors
- Verify chrome.storage permissions in manifest.json

## File Structure

```
dist/               # Built extension (load this in Chrome)
├── background.js   # Service worker
├── content.js      # Content script (runs on pages)
├── popup.html      # Popup HTML
├── popup.js        # Popup React app
└── manifest.json   # Extension config

src/                # Source code
├── background/     # Service worker source
├── content/        # Content script source
├── popup/          # React popup UI
├── shared/         # Shared types & utilities
└── utils/          # Helper functions
```

## Next Steps

Once the basic extension works:

1. **Add better icons** - Create professional-looking icons
2. **Test on various websites** - Heavy sites (YouTube), light sites (Wikipedia)
3. **Check performance** - Open Performance tab in DevTools
4. **Add features from V1.1** - Per-site breakdown, charts, etc.

## Performance Testing

To verify the extension meets performance goals:

1. Open DevTools → Performance tab
2. Start recording
3. Navigate to a website
4. Stop recording
5. Look for "carbon-tracker" markers in the timeline
6. Verify execution time < 50ms

## Need Help?

- Check [README.md](README.md) for full documentation
- Review the implementation plan in `.claude/plans/`
- Open Chrome DevTools for debugging
