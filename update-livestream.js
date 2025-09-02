#!/usr/bin/env node

/**
 * Auto-update script for EarthCam Live: Mulberry Street YouTube stream
 * This script fetches the latest livestream URL and updates the video ID in the project files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CHANNEL_ID = 'UCneTPjjYfyh0'; // This would need to be the actual channel ID
const STREAM_TITLE = 'EarthCam Live: Mulberry Street';
const API_KEY = process.env.YOUTUBE_API_KEY; // Set this in your environment variables

// Files to update
const FILES_TO_UPDATE = [
    'unified-player.js',
    'live-stream-crop.js',
    'LiveStreamCrop.jsx'
];

/**
 * Fetch the latest livestream from YouTube Data API
 */
async function fetchLatestLivestream() {
    return new Promise((resolve, reject) => {
        if (!API_KEY) {
            reject(new Error('YouTube API key not found. Please set YOUTUBE_API_KEY environment variable.'));
            return;
        }

        // Search for the latest livestream with the specific title
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&q=${encodeURIComponent(STREAM_TITLE)}&type=video&key=${API_KEY}`;
        
        https.get(searchUrl, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.error) {
                        reject(new Error(`YouTube API Error: ${response.error.message}`));
                        return;
                    }
                    
                    if (response.items && response.items.length > 0) {
                        const latestStream = response.items[0];
                        const videoId = latestStream.id.videoId;
                        const title = latestStream.snippet.title;
                        
                        console.log(`✅ Found latest stream: "${title}"`);
                        console.log(`📺 Video ID: ${videoId}`);
                        console.log(`🔗 URL: https://www.youtube.com/watch?v=${videoId}`);
                        
                        resolve(videoId);
                    } else {
                        reject(new Error('No livestream found with the specified title'));
                    }
                } catch (error) {
                    reject(new Error(`Failed to parse API response: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`HTTP request failed: ${error.message}`));
        });
    });
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
        console.log('🔄 Fetching latest EarthCam Live: Mulberry Street stream...');
        
        const newVideoId = await fetchLatestLivestream();
        const oldVideoId = 'neTPjjYfyh0'; // Current video ID
        
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
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Alternative method using web scraping (fallback if API key is not available)
 */
async function fetchLatestLivestreamFallback() {
    return new Promise((resolve, reject) => {
        // This is a simplified approach - in practice you'd need a more robust scraping solution
        const url = 'https://www.youtube.com/@earthcam';
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                // This is a basic example - you'd need proper HTML parsing
                const videoIdMatch = data.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (videoIdMatch) {
                    resolve(videoIdMatch[1]);
                } else {
                    reject(new Error('Could not extract video ID from page'));
                }
            });
        }).on('error', (error) => {
            reject(new Error(`HTTP request failed: ${error.message}`));
        });
    });
}

// Run the script if called directly
if (require.main === module) {
    updateLivestreamUrl();
}

module.exports = {
    updateLivestreamUrl,
    fetchLatestLivestream,
    fetchLatestLivestreamFallback
};
