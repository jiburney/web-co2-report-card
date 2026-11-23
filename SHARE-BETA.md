# Sharing Your Beta

## Quick Distribution Guide

### 1. What to Send

Send testers two files:
- `carbon-tracker-v1.1.0-beta.zip` (the extension)
- `BETA-TESTING.md` (installation instructions)

### 2. Distribution Options

**Option A: Email**
- Attach the ZIP file
- Include link to BETA-TESTING.md
- Personal and direct

**Option B: File Sharing**
- Upload to Google Drive / Dropbox / WeTransfer
- Set to "Anyone with link"
- Share the link

**Option C: GitHub Release**
- Create a GitHub release tagged `v1.1.0-beta`
- Upload ZIP as release asset
- Share release URL
- Professional and trackable

**Option D: Discord / Slack**
- Post ZIP in dedicated channel
- Pin the beta testing instructions
- Easy for ongoing discussion

### 3. How Many Testers?

**Recommended:**
- **5-10 power users** for thorough testing
- **20-30 casual users** for broader feedback
- Mix of technical and non-technical

**Quality > Quantity**
- 5 engaged testers > 50 passive installs

### 4. Testing Timeline

**Week 1: Closed Beta**
- Send to 5-10 close contacts
- Fix critical bugs
- Iterate quickly

**Week 2: Open Beta**
- Expand to 20-30 users
- Focus on UX feedback
- Prepare for public launch

**Week 3: Pre-Launch**
- Final bug fixes
- Submit to Chrome Web Store
- Keep beta running during review

### 5. Feedback Collection

**Option A: Google Form**
```
Questions:
1. What browser are you using?
2. Rate clarity (1-5)
3. Rate usefulness (1-5)
4. Would you recommend this?
5. What would you change?
6. Any bugs or issues?
```

**Option B: GitHub Issues**
- Use issue templates
- Tag issues: `bug`, `feature`, `ux`
- Track everything publicly

**Option C: Shared Doc**
- Google Doc with comments enabled
- Everyone can see feedback
- Collaborative discussion

### 6. Communication Template

**Initial Message:**
```
Hey!

I'm launching a Chrome extension that tracks carbon emissions
from web browsing. Would you be interested in beta testing?

It's privacy-first (all data stays local) and super lightweight.
Takes 2 minutes to install.

Interested? Let me know and I'll send the files!
```

**Follow-up with ZIP:**
```
Thanks for helping test!

Installation:
1. Extract the attached ZIP
2. Go to chrome://extensions/
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the dist/ folder

See BETA-TESTING.md for detailed instructions and what to test.

Looking forward to your feedback!
```

### 7. Tracking Metrics (Informal)

What to track manually:
- Number of installs
- Number of bug reports
- Number of feature requests
- Common feedback themes
- Browser/OS distribution

### 8. When to Go Public

✅ Ready to submit when:
- No critical bugs reported in 3+ days
- Core features work reliably
- Positive feedback from majority of testers
- Performance is acceptable on most systems
- UI/UX is clear to non-technical users

⚠️ Not ready if:
- Frequent crashes
- Data loss issues
- Privacy concerns raised
- Confusing user experience
- Major feature requests from all testers

## Sample GitHub Release

If using GitHub:

**Tag:** `v1.1.0-beta`
**Title:** Carbon Footprint Tracker - Public Beta
**Description:**
```markdown
# 🌍 Carbon Footprint Tracker - Beta v1.1.0

Help test the new carbon tracking extension!

## What's New
- Color-coded badge showing browsing intensity
- Contextual CO2 comparisons (driving, streaming, etc.)
- Per-site breakdown with top 5 emitting sites
- Cross-browser support (Chrome, Firefox, Edge, Brave)

## Installation
Download `carbon-tracker-v1.1.0-beta.zip` and follow the
instructions in `BETA-TESTING.md`.

## Feedback
Open an issue or reach out directly with feedback!

## Known Issues
- Firefox version is temporary (removed on browser restart)
- Developer mode warning in Chrome
```

## Tips for Success

1. **Set Expectations**: Tell testers it's beta software
2. **Be Responsive**: Reply to feedback quickly
3. **Show Appreciation**: Thank testers publicly
4. **Iterate Fast**: Push fixes quickly, re-test
5. **Document Everything**: Track all feedback for launch

## Next Steps After Beta

1. Fix critical bugs
2. Implement high-value feedback
3. Update version to 1.1.0 (remove beta)
4. Submit to Chrome Web Store
5. Keep beta testers updated on launch
6. Give beta testers early access to new features

Good luck with your beta! 🚀
