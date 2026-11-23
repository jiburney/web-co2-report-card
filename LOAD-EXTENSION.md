# ✅ Extension is Ready to Load!

Your Carbon Footprint Tracker extension is fully built with placeholder icons!

## Load the Extension Now

### Step 1: Open Chrome Extensions Page
1. Open Chrome browser
2. Navigate to: `chrome://extensions/`
3. Or: Click the three dots menu → Extensions → Manage Extensions

### Step 2: Enable Developer Mode
- Look in the **top right corner**
- Toggle **"Developer mode"** to ON (it will turn blue)

### Step 3: Load the Extension
1. Click **"Load unpacked"** button (top left)
2. Navigate to: `/Users/jamesburney/projects/green-score-widget/dist`
3. Click **"Select"**

### Step 4: See Your Extension!
You should now see:
- ✅ "Carbon Footprint Tracker" in your extensions list
- ✅ A green circle with "CO₂" icon in your browser toolbar
- ✅ Status: "Errors (0)" if everything is working

## Test It Out

### Test 1: Check the Popup
1. Click the green CO₂ icon in your toolbar
2. You should see: "🌍 Carbon Tracker" with "0.0 g" displayed
3. And "0 pages tracked"

### Test 2: Track Some Pages
1. Visit a website (try google.com)
2. Click the extension icon again
3. The counter should have increased! (usually 10-50g depending on the page)

### Test 3: Multiple Pages
1. Visit several websites: youtube.com, github.com, reddit.com
2. Check the extension after each page
3. Watch the counter grow!

### Test 4: Reset Button
1. Click "Reset Counter" button
2. Confirm the dialog
3. Counter should go back to 0.0 g

## Troubleshooting

### Extension Won't Load
- **Error about icons**: Icons should now be included
- **Error about manifest**: Make sure you selected the `dist` folder, not the root folder

### Counter Not Increasing
1. Open any website
2. Press F12 to open DevTools
3. Check the Console tab for errors
4. Look for messages from the extension

### Popup Shows "Loading..." Forever
1. Right-click the extension icon
2. Select "Inspect popup"
3. Check the Console for errors

### To Debug Background Worker
1. Go to `chrome://extensions/`
2. Find "Carbon Footprint Tracker"
3. Click "service worker" link (appears when active)
4. This opens DevTools for the background script

## What the Icons Look Like

- **16x16**: Green circle with white "C"
- **48x48**: Green circle with white "CO₂" (your main toolbar icon)
- **128x128**: Green circle with white "CO₂" (shown in extension details)

These are simple placeholders - you can replace them later with custom designs!

## Next Steps

Once the extension is working:

1. **Browse normally** - The extension tracks automatically
2. **Check your footprint** regularly - Click the icon to see your total
3. **Test on different sites** - Heavy sites (YouTube) vs light sites (Wikipedia)
4. **Consider V1.1 features** - Per-site breakdown would be next!

## Making Changes

If you want to modify the extension:

1. Edit files in `src/`
2. Run `npm run dev` (in the terminal)
3. Go to `chrome://extensions/`
4. Click the reload icon on your extension
5. Test your changes

## Success!

You now have a working carbon footprint tracker! 🎉

Every page you visit will be tracked, and you can see your cumulative CO₂ emissions from web browsing.
