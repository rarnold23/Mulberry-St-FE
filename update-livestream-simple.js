#!/usr/bin/env node

/**
 * Simple auto-update script for EarthCam Live: Mulberry Street YouTube stream
 * This script scrapes the EarthCam YouTube channel to find the latest livestream
 */

const fs = require('fs');
const https = require('https');

// Configuration
const EARTHCAM_CHANNEL_URL = 'https://www.youtube.com/@earthcam';
const STREAM_TITLE_KEYWORDS = ['EarthCam Live', 'Mulberry Street'];

// Files to update
const FILES_TO_UPDATE = [
    'unified-player.js',
    'live-stream-crop.js',
    'LiveStreamCrop.jsx'
];

/**
 * Fetch HTML content from a URL
 */
function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            reject(new Error(`HTTP request failed: ${error.message}`));
        });
    });
}

/**
 * Extract video IDs from YouTube page HTML
 */
function extractVideoIds(html) {
    const videoIdRegex = /watch\?v=([a-zA-Z0-9_-]{11})/g;
    const matches = [...html.matchAll(videoIdRegex)];
    return [...new Set(matches.map(match => match[1]))]; // Remove duplicates
}

/**
 * Check if a video title contains our keywords
 */
function isTargetStream(title) {
    const lowerTitle = title.toLowerCase();
    return STREAM_TITLE_KEYWORDS.every(keyword => 
        lowerTitle.includes(keyword.toLowerCase())
    );
}

/**
 * Fetch the latest livestream video ID
 */
async function fetchLatestLivestreamId() {
    try {
        console.log('🔄 Fetching EarthCam YouTube channel...');
        
        // First, try to get the channel page
        const channelHtml = await fetchHtml(EARTHCAM_CHANNEL_URL);
        
        // Extract all video IDs
        const videoIds = extractVideoIds(channelHtml);
        
        if (videoIds.length === 0) {
            throw new Error('No video IDs found on the channel page');
        }
        
        console.log(`📺 Found ${videoIds.length} potential videos`);
        
        // Check each video to find the Mulberry Street stream
        console.log('🔍 Searching for "Mulberry Street" stream...');
        
        for (let i = 0; i < Math.min(videoIds.length, 20); i++) { // Check first 20 videos
            const videoId = videoIds[i];
            try {
                console.log(`🔍 Checking video ${i + 1}/${Math.min(videoIds.length, 20)}: ${videoId}`);
                
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                const videoHtml = await fetchHtml(videoUrl);
                
                // Look for the title in the HTML
                const titleMatch = videoHtml.match(/"title":"([^"]+)"/);
                if (titleMatch) {
                    const title = titleMatch[1];
                    console.log(`📝 Title: ${title}`);
                    
                    if (isTargetStream(title)) {
                        console.log(`✅ Found Mulberry Street stream: "${title}"`);
                        console.log(`🔗 URL: ${videoUrl}`);
                        return videoId;
                    }
                }
                
                // Also check for live indicators
                if (videoHtml.includes('"isLive":true') || videoHtml.includes('LIVE')) {
                    console.log(`📺 Video ${videoId} is live`);
                }
                
            } catch (videoError) {
                console.log(`⚠️  Could not check video ${videoId}: ${videoError.message}`);
                continue;
            }
        }
        
        console.log('❌ No Mulberry Street stream found in recent videos');
        throw new Error('No Mulberry Street stream found');
        
    } catch (error) {
        console.error(`❌ Error fetching latest stream: ${error.message}`);
        
        // Fallback: try to get from the current URL pattern
        console.log('🔄 Trying fallback method...');
        
        try {
            // Try to fetch the current stream URL to see if it's still live
            const currentStreamUrl = 'https://www.youtube.com/watch?v=yZABWbRNAz4';
            const streamHtml = await fetchHtml(currentStreamUrl);
            
            // Check if the page contains "live" indicators
            if (streamHtml.includes('"isLive":true') || streamHtml.includes('LIVE')) {
                console.log('✅ Current stream is still live');
                return 'yZABWbRNAz4';
            } else {
                throw new Error('Current stream is no longer live');
            }
        } catch (fallbackError) {
            throw new Error(`Both methods failed: ${error.message}, ${fallbackError.message}`);
        }
    }
}

/**
 * Update video ID in a file
 */
function updateVideoIdInFile(filePath, oldVideoId, newVideoId) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const oldContent = content;
        
        // Replace all instances of the old video ID
        content = content.replace(new RegExp(`'${oldVideoId}'`, 'g'), `'${newVideoId}'`);
        content = content.replace(new RegExp(`"${oldVideoId}"`, 'g'), `"${newVideoId}"`);
        
        if (content !== oldContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated ${filePath}`);
            return true;
        } else {
            console.log(`ℹ️  No changes needed in ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}: ${error.message}`);
        return false;
    }
}

/**
 * Main function to update all files
 */
async function updateLivestreamUrl() {
    try {
        console.log('🚀 Starting EarthCam livestream update...');
        
        const newVideoId = await fetchLatestLivestreamId();
        const oldVideoId = 'yZABWbRNAz4'; // Current video ID (updated from previous run)
        
        if (newVideoId === oldVideoId) {
            console.log('ℹ️  Video ID is already up to date');
            return;
        }
        
        console.log(`🔄 Updating video ID from ${oldVideoId} to ${newVideoId}...`);
        
        let updatedFiles = 0;
        
        for (const file of FILES_TO_UPDATE) {
            if (fs.existsSync(file)) {
                if (updateVideoIdInFile(file, oldVideoId, newVideoId)) {
                    updatedFiles++;
                }
            } else {
                console.log(`⚠️  File not found: ${file}`);
            }
        }
        
        console.log(`✅ Successfully updated ${updatedFiles} files`);
        console.log(`🎯 New livestream URL: https://www.youtube.com/watch?v=${newVideoId}`);
        
        // Also update the dist files if they exist
        const distFiles = [
            'dist/unified-player.js',
            'dist/live-stream-crop.js',
            'dist-cpanel/unified-player.js',
            'dist-cpanel/live-stream-crop.js'
        ];
        
        for (const file of distFiles) {
            if (fs.existsSync(file)) {
                if (updateVideoIdInFile(file, oldVideoId, newVideoId)) {
                    console.log(`✅ Updated ${file}`);
                    updatedFiles++;
                }
            }
        }
        
        console.log(`🎉 Total files updated: ${updatedFiles}`);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    updateLivestreamUrl();
}

module.exports = {
    updateLivestreamUrl,
    fetchLatestLivestreamId
};
