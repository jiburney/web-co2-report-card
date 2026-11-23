# Firefox Installation Guide

The Carbon Footprint Tracker now supports Firefox! Here's how to load it:

## Loading in Firefox (Development)

1. **Build the extension** (if you haven't already):
   ```bash
   npm run build
   ```

2. **Open Firefox**

3. **Navigate to the debugging page**:
   - Type `about:debugging` in the address bar
   - Click on "This Firefox" in the left sidebar

4. **Load the extension**:
   - Click "Load Temporary Add-on..."
   - Navigate to your project's `dist/` folder
   - Select any file (e.g., `manifest.json`)
   - Click "Open"

5. **The extension is now loaded!**
   - You'll see it in your extensions list
   - The icon should appear in your toolbar

## Testing

1. Click the extension icon in the toolbar
2. Visit some websites (e.g., youtube.com, github.com)
3. Click the icon again to see your emissions increase
4. Check the "Top Sites" section to see which sites use the most data

## Differences from Chrome

The extension uses the same code for both Chrome and Firefox. Firefox's Manifest V3 support is compatible with Chrome's implementation, so everything should work identically.

## Permanent Installation

Note: In Firefox Developer Edition, temporary extensions are removed when you close the browser. For permanent installation, you would need to:
1. Sign the extension through [addons.mozilla.org](https://addons.mozilla.org)
2. Or use Firefox Developer Edition / Nightly with signing disabled

For development purposes, temporary loading is sufficient.

## Troubleshooting

### Extension won't load
- Make sure you selected a file from the `dist/` folder
- Check that the build completed successfully
- Verify there are no TypeScript errors

### Counter not updating
1. Open Firefox DevTools (F12) on any website
2. Check Console for errors
3. Right-click extension icon → Manage Extension → Debug
4. Check the background script console

### Icons not showing
- The extension includes placeholder icons
- They should work in both Firefox and Chrome
- If you see broken icons, rebuild with `npm run build`

## Browser Compatibility

This extension is tested and works on:
- ✅ Firefox 109+ (Manifest V3 support)
- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Brave (Chromium-based)

The same `dist/` folder works for all browsers!
