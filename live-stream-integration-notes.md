# Live Stream Integration - Troubleshooting Notes

## Project Context
Attempting to integrate the EarthCam Mulberry Street live stream into the song list page header image area to replace the static image with real-time video from Little Italy, NYC.

## Target URL
- **Desired Stream**: https://www.earthcam.com/usa/newyork/littleitaly/?cam=littleitaly
- **Reason**: Perfect thematic match for "Mulberry Street Radio" - shows actual Little Italy street where music is supposedly being captured

## Issues Encountered

### 1. Song List Loading Issue (RESOLVED ✅)
- **Problem**: Song list showing "Unable to load song data. Please try again later."
- **Cause**: Browser security restrictions when opening HTML files directly (file:// protocol blocks JSON loading)
- **Solution**: Use local HTTP server (`python3 -m http.server 9000`)
- **Status**: Fixed - songs now load correctly from Google Sheets + fallback JSON

### 2. Live Stream Embedding Issues (ONGOING ❌)

#### Issue A: iframe Shows Black Square
- **Problem**: EarthCam URL loads in iframe but displays as black square instead of video
- **Potential Causes**:
  - EarthCam blocks iframe embedding with X-Frame-Options header
  - Content Security Policy restrictions
  - Video player requires user interaction to start
  - Heavy CSS transforms breaking video rendering

#### Issue B: Console Errors (PARTIALLY EXPECTED)
```
- ERR_BLOCKED_BY_CONTENT_BLOCKER (Google Ads, Facebook tracking) - NORMAL/GOOD
- SecurityError: Failed to set named property 'href' on 'Location' - NORMAL/EXPECTED
- Navigation errors from embedded page trying to control parent - NORMAL/EXPECTED
```

## Attempted Solutions

### HTML Approaches Tried:
1. **Basic iframe**: `<iframe src="https://www.earthcam.com/usa/newyork/littleitaly/?cam=littleitaly">`
2. **Player-specific URL**: `src="https://www.earthcam.com/usa/newyork/littleitaly/player.php"` (404 error)
3. **Sandbox restrictions**: `sandbox="allow-scripts allow-same-origin allow-presentation"` (made it worse)
4. **Permission attributes**: `allow="autoplay; fullscreen; camera; microphone"`

### CSS Approaches Tried:
1. **No scaling**: `width: 100%; height: 100%` - still black square
2. **Moderate scaling**: `width: 150%; height: 150%; transform: translate(-15%, -20%)`
3. **Heavy scaling**: `width: 250-300%; transform: translate(-30%, -35%)`
4. **Container overflow**: `overflow: hidden` on `.header-image`

### Alternative URLs Tested:
- ❌ EarthCam player.php (404)
- ✅ YouTube EarthCam Times Square stream (works but wrong location)

## Current Status
- **Song list**: ✅ Working perfectly
- **Live stream**: ❌ Black square in header area
- **Server**: Running on `http://localhost:9000`

## Next Steps to Try

### Option 1: Alternative EarthCam URLs
- Research EarthCam's official embed documentation
- Check if they have an official embed API
- Look for mobile/lightweight player URLs

### Option 2: Different NYC Webcams
- Find other Little Italy webcams that allow embedding
- Consider nearby NYC locations (SoHo, Chinatown) that might be embeddable
- Use reliable YouTube live streams of NYC

### Option 3: Technical Workarounds
- Use JavaScript to detect if iframe loads successfully
- Implement fallback to static image if video fails
- Try loading EarthCam in a popup/modal instead of iframe

### Option 4: Alternative Approaches
- Screenshot-based: Periodically capture stills from the stream
- Proxy server to bypass iframe restrictions
- Browser extension approach for development

## Files Modified
- `song-list.html` - iframe implementation in `.header-image` div
- `song-list.css` - iframe styling and positioning
- Local server setup for testing

## Key Code Locations
- Header image container: `.header-image` (song-list.css lines 60-70)
- iframe element: song-list.html lines 62-69
- Current server: `python3 -m http.server 9000`

## Console Logs Summary
- Songs loading successfully from CSV
- EarthCam security/tracking errors (expected)
- No iframe-specific loading errors visible

---
**Last Updated**: [Current date]
**Priority**: Medium (nice-to-have feature)
**Workaround**: Can use static image or YouTube NYC stream temporarily