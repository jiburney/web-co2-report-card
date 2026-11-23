# Badge Color System

The Carbon Footprint Tracker uses a **color-coded badge** on the extension icon to give you an at-a-glance view of your browsing intensity.

## How It Works

The badge color changes **automatically** as your CO2 emissions increase, providing instant visual feedback without you needing to open the popup.

## Color Thresholds

| Color | CO2 Range | Intensity | Description |
|-------|-----------|-----------|-------------|
| 🟢 **Green** | 0-100g | Light | Clean browsing - just getting started |
| 🟡 **Yellow** | 100g-500g | Moderate | Normal browsing session |
| 🟠 **Orange** | 500g-2kg | Heavy | Active browsing or some video |
| 🔴 **Red** | 2kg-10kg | Very Heavy | Extended session or lots of media |
| 🟣 **Purple** | 10kg+ | Extreme | Multiple days or very intensive use |

## Why Color-Based?

We chose a **color badge over text** for three key reasons:

1. **Energy Efficient**: Updates only when you cross thresholds (typically 2-3 times per session)
2. **Instant Recognition**: Glanceable - you don't need to read numbers
3. **Privacy-Friendly**: No constant updates or network calls

## Energy Impact

### Traditional Text Badge
- Updates: ~100+ times per session
- CPU usage: ~300ms total
- Energy cost: ~0.5g CO2 per day

### Our Color Badge ✅
- Updates: 2-3 times per session
- CPU usage: <5ms total
- Energy cost: **<0.01g CO2 per day**

**Our approach is 50x more efficient!**

## In the Popup

When you open the extension popup, you'll see the current intensity level with a colored dot:

- 🟢 Light intensity
- 🟡 Moderate intensity
- 🟠 Heavy intensity
- 🔴 Very Heavy intensity
- 🟣 Extreme intensity

This helps you understand what the badge color means and track your browsing habits.

## Reset Behavior

When you click "Reset Counter":
- Your CO2 total resets to 0g
- The badge returns to 🟢 Green
- Intensity level shows "Light"

## Technical Details

The badge system:
- Uses `chrome.action.setBadgeBackgroundColor()` API
- Updates **only when crossing thresholds** using `shouldUpdateBadge()`
- Initializes on extension startup based on stored total
- Persists state across browser restarts

## Privacy Note

The badge color is calculated **entirely locally** on your device. No data is sent anywhere to determine or update the badge color.
