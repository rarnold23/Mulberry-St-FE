# Automatic Livestream URL Updater

This project includes scripts to automatically update the EarthCam Live: Mulberry Street YouTube livestream URL when it changes.

## Problem

The EarthCam livestream URL changes frequently (daily or so), but the stream is always titled "EarthCam Live: Mulberry Street". This makes it difficult to keep the website updated with the latest stream.

## Solution

Two automated scripts are provided to fetch the latest livestream URL and update all relevant files:

### 1. Simple Version (Recommended)

**File:** `update-livestream-simple.js`

This version uses web scraping to find the latest stream without requiring any API keys.

```bash
npm run update-livestream:simple
```

**How it works:**
- Scrapes the EarthCam YouTube channel page
- Extracts video IDs from the page
- Updates all project files with the new video ID
- Includes fallback to check if current stream is still live

### 2. API Version (Advanced)

**File:** `update-livestream.js`

This version uses the YouTube Data API for more reliable results, but requires an API key.

```bash
# Set your YouTube API key
export YOUTUBE_API_KEY="your_api_key_here"

# Run the script
npm run update-livestream
```

**How it works:**
- Uses YouTube Data API to search for livestreams
- Searches specifically for "EarthCam Live: Mulberry Street"
- More accurate but requires API setup

## Setup

### For Simple Version (No setup required)

Just run:
```bash
npm run update-livestream:simple
```

### For API Version

1. Get a YouTube Data API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Set the environment variable:
   ```bash
   export YOUTUBE_API_KEY="your_api_key_here"
   ```
3. Run the script:
   ```bash
   npm run update-livestream
   ```

## Files Updated

Both scripts update these files:
- `unified-player.js`
- `live-stream-crop.js`
- `LiveStreamCrop.jsx`
- `dist/unified-player.js` (if exists)
- `dist/live-stream-crop.js` (if exists)
- `dist-cpanel/unified-player.js` (if exists)
- `dist-cpanel/live-stream-crop.js` (if exists)

## Automation

### Manual Updates

Run the script whenever you notice the stream has changed:
```bash
npm run update-livestream:simple
```

### Automated Updates (Cron Job)

Set up a cron job to run daily:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /path/to/your/project && npm run update-livestream:simple
```

### GitHub Actions (Recommended)

Create `.github/workflows/update-livestream.yml`:

```yaml
name: Update Livestream URL

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-livestream:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Update livestream URL
      run: npm run update-livestream:simple
    
    - name: Commit changes
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add -A
        git diff --quiet && git diff --staged --quiet || git commit -m "Auto-update livestream URL"
    
    - name: Push changes
      uses: ad-m/github-push-action@master
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        branch: ${{ github.ref }}
```

## Troubleshooting

### Script fails to find new stream

1. Check if the EarthCam channel is accessible
2. Verify the stream title hasn't changed
3. Try running the API version if you have a key

### Files not updating

1. Check file permissions
2. Ensure you're in the correct directory
3. Verify the current video ID in the files matches what the script expects

### API version errors

1. Verify your API key is valid
2. Check API quota limits
3. Ensure the channel ID is correct

## Current Stream

The current stream URL is: https://www.youtube.com/watch?v=neTPjjYfyh0

## Notes

- The simple version is recommended for most users
- The API version provides more reliable results but requires setup
- Both scripts are safe to run multiple times
- The scripts will only update files if the video ID has actually changed
