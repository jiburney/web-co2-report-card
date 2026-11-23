# Beta Testing Instructions

Thanks for helping test the Carbon Footprint Tracker! 🌍

## Installation

### Chrome / Edge / Brave

1. **Download the extension**
   - Get `carbon-tracker-v1.1.0-beta.zip`
   - Extract the ZIP file to a folder on your computer

2. **Open Extensions Page**
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
   - Brave: Navigate to `brave://extensions/`

3. **Enable Developer Mode**
   - Look for "Developer mode" toggle in the **top right corner**
   - Turn it **ON**

4. **Load the Extension**
   - Click "Load unpacked" button (top left)
   - Select the `dist/` folder inside the extracted folder
   - Click "Select Folder"

5. **Done!**
   - You should see "Carbon Footprint Tracker" in your extensions list
   - The icon should appear in your browser toolbar

### Firefox

1. **Download and extract** `carbon-tracker-v1.1.0-beta.zip`

2. **Open Firefox Debugging Page**
   - Navigate to `about:debugging#/runtime/this-firefox`

3. **Load Temporary Extension**
   - Click "Load Temporary Add-on..."
   - Navigate to the `dist/` folder
   - Select any file (e.g., `manifest.json`)
   - Click "Open"

**Note:** In Firefox, the extension will be removed when you close the browser. This is a limitation of temporary add-ons.

## What to Test

### 1. Basic Functionality ✅
- [ ] Visit several websites (YouTube, GitHub, Reddit, etc.)
- [ ] Click the extension icon - counter should increase
- [ ] Visit more sites - counter continues to grow
- [ ] Close and reopen browser - counter persists

### 2. Badge Colors 🎨
- [ ] Icon badge starts green
- [ ] After ~10 pages, badge turns yellow
- [ ] Keep browsing - badge progresses: orange → red → purple
- [ ] Open popup - intensity indicator matches badge color

### 3. Contextual Comparisons 📊
- [ ] Open popup - see comparison (e.g., "Like charging a smartphone")
- [ ] Keep browsing - comparison updates appropriately
- [ ] Different totals show different comparisons

### 4. Top Sites 🏆
- [ ] Visit various sites multiple times
- [ ] Open popup - see "Top Sites" section
- [ ] Sites ranked by emissions
- [ ] Percentages add up correctly

### 5. Reset Function 🔄
- [ ] Click "Reset Counter"
- [ ] Confirm the dialog
- [ ] Counter resets to 0.0 g
- [ ] Badge returns to green
- [ ] Top sites list clears

## What to Look For

### Bugs 🐛
- Does anything crash or throw errors?
- Are there any visual glitches?
- Does the counter ever go backwards?
- Do the colors look wrong?

### Performance 💨
- Does browsing feel slower?
- Does your computer fan spin up?
- Are pages loading normally?
- Any noticeable lag when opening popup?

### Accuracy 🎯
- Do the emissions numbers seem reasonable?
- Are heavy sites (YouTube, image galleries) ranked higher?
- Does the badge color reflect your browsing intensity?

### UX/Design 🎨
- Is the UI clear and understandable?
- Are the comparisons helpful?
- Is any information confusing?
- What would you change?

## Reporting Issues

Please report any issues with the following info:

**Template:**
```
Browser: Chrome/Firefox/Edge/Brave + version
OS: Windows/Mac/Linux

What happened:
[Describe the issue]

Expected:
[What you expected to happen]

Steps to reproduce:
1. [First step]
2. [Second step]
3. [Result]

Screenshot (if applicable):
[Attach screenshot]
```

## Feedback Questions

1. **First Impression**: What's your immediate reaction?
2. **Clarity**: Do you understand what the extension does?
3. **Value**: Would you keep using this?
4. **Comparisons**: Are the comparisons helpful or confusing?
5. **Badge**: Is the color system useful?
6. **Top Sites**: Does the breakdown help you understand your habits?
7. **Missing**: What feature would you want to see next?

## Privacy Note

This is a beta test build. All your data stays **completely local** on your device. We don't collect any analytics, telemetry, or browsing data. The extension never makes external network requests.

## Known Limitations

- **Firefox users**: Extension is temporary and will be removed on browser restart
- **Developer Mode Warning**: Chrome will show a banner about "extensions in developer mode"
- **No auto-updates**: When we release a new version, you'll need to reinstall manually

## Getting Updates

When a new beta version is released:
1. Delete the old extracted folder
2. Download the new ZIP
3. Extract it
4. Go to `chrome://extensions/`
5. Click the reload icon on Carbon Footprint Tracker
6. Or remove the old one and load the new folder

## Questions?

Feel free to reach out with any questions or feedback!

Thank you for helping make this extension better! 🙏
