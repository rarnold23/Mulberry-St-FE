const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Parse JSON bodies
app.use(express.json());

// Helper function to extract actual video stream URL from EarthCam
async function extractVideoStreamUrl(earthcamUrl) {
    try {
        console.log('Fetching EarthCam page to extract video stream...');
        
        // Fetch the EarthCam page
        const response = await axios.get(earthcamUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            timeout: 15000
        });

        const html = response.data;
        
        // Look for actual video stream URLs in the HTML
        const streamPatterns = [
            // HLS streams (.m3u8)
            /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi,
            // MP4 streams
            /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/gi,
            // WebM streams
            /https?:\/\/[^"'\s]+\.webm[^"'\s]*/gi,
            // FLV streams
            /https?:\/\/[^"'\s]+\.flv[^"'\s]*/gi,
            // RTMP streams
            /rtmp:\/\/[^"'\s]+/gi,
            // WebRTC streams
            /https?:\/\/[^"'\s]+webrtc[^"'\s]*/gi,
            // EarthCam specific video patterns
            /https?:\/\/[^"'\s]+earthcam[^"'\s]*\.flv[^"'\s]*/gi,
            /https?:\/\/[^"'\s]+earthcam[^"'\s]*\.mp4[^"'\s]*/gi,
            /https?:\/\/[^"'\s]+earthcam[^"'\s]*\.m3u8[^"'\s]*/gi,
        ];

        let foundStreams = [];
        
        for (const pattern of streamPatterns) {
            const matches = html.match(pattern);
            if (matches) {
                foundStreams.push(...matches);
            }
        }

        // Also look for video URLs in JavaScript variables
        const jsPatterns = [
            /videoUrl\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
            /streamUrl\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
            /source\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
            /url\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
            /src\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
        ];

        for (const pattern of jsPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const url = match[1];
                if (url.includes('http') && (
                    url.includes('.m3u8') || 
                    url.includes('.mp4') || 
                    url.includes('.webm') || 
                    url.includes('.flv') ||
                    url.includes('stream') ||
                    url.includes('video')
                )) {
                    foundStreams.push(url);
                }
            }
        }

        // Filter out non-video URLs
        const validStreams = foundStreams.filter(url => {
            try {
                new URL(url);
                // Exclude analytics, tracking, and non-video URLs
                const excludePatterns = [
                    /analytics|tracking|pixel|beacon|adclick|google-analytics/i,
                    /\.gif|\.png|\.jpg|\.jpeg|\.webp|\.css|\.js/i,
                    /facebook\.com|google\.com|doubleclick\.net/i
                ];
                
                return !excludePatterns.some(pattern => pattern.test(url));
            } catch {
                return false;
            }
        });

        console.log('Found potential video streams:', validStreams);

        // Test each stream URL to see if it actually returns video content
        console.log('Testing stream URLs for video content...');
        
        for (const streamUrl of validStreams) {
            try {
                console.log(`Testing: ${streamUrl}`);
                const testResponse = await axios.head(streamUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    },
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                const contentType = testResponse.headers['content-type'] || '';
                console.log(`Content-Type: ${contentType}`);
                
                // Check if it's actually video content
                if (contentType.includes('video/') || 
                    contentType.includes('application/x-mpegURL') ||
                    contentType.includes('application/vnd.apple.mpegurl') ||
                    streamUrl.includes('.flv') ||
                    streamUrl.includes('.mp4') ||
                    streamUrl.includes('.m3u8')) {
                    console.log(`✅ Found valid video stream: ${streamUrl}`);
                    return streamUrl;
                } else {
                    console.log(`❌ Not video content: ${contentType}`);
                }
            } catch (error) {
                console.log(`❌ Failed to test ${streamUrl}: ${error.message}`);
            }
        }
        
        // If no direct video streams found, try to extract from EarthCam's player configuration
        console.log('No direct video streams found, trying to extract from player config...');
        
        // Look for EarthCam player configuration
        const playerConfigPatterns = [
            /playerConfig\s*[:=]\s*({[^}]+})/gi,
            /config\s*[:=]\s*({[^}]+})/gi,
            /videoConfig\s*[:=]\s*({[^}]+})/gi,
        ];
        
        for (const pattern of playerConfigPatterns) {
            const matches = html.match(pattern);
            if (matches) {
                console.log('Found player config:', matches[0]);
                // Try to extract stream URL from config
                const streamMatch = matches[0].match(/stream[^"'\s]*[:=]\s*['"`]([^'"`]+)['"`]/i);
                if (streamMatch) {
                    console.log('Found stream in config:', streamMatch[1]);
                    return streamMatch[1];
                }
            }
        }
        
        // Try to fetch the actual video stream from the container URL
        console.log('Trying to extract video from container URL...');
        try {
            const containerUrl = 'https://www.earthcam.com/cams/includes/twittercards/container.php?name=27777.flv&timezone=America/New_York&metar=KJFK';
            const containerResponse = await axios.get(containerUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
                timeout: 10000
            });
            
            const containerHtml = containerResponse.data;
            console.log('Container HTML length:', containerHtml.length);
            
            // Look for actual video sources in the container
            const videoSourcePatterns = [
                /<source[^>]*src="([^"]+)"[^>]*>/gi,
                /src="([^"]*\.(?:flv|mp4|m3u8|webm))"/gi,
                /videoUrl\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
                /streamUrl\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
                // Look for EarthCam embed script
                /embed\.php\?vid=([^"'\s&]+)/gi,
            ];
            
            for (const pattern of videoSourcePatterns) {
                const matches = containerHtml.match(pattern);
                if (matches) {
                    console.log('Found video source in container:', matches[0]);
                    
                    // Handle embed.php URLs specially
                    if (matches[0].includes('embed.php')) {
                        const vidMatch = matches[0].match(/vid=([^"'\s&]+)/);
                        if (vidMatch && vidMatch[1]) {
                            const embedUrl = `https://www.earthcam.com/js/embed.php?vid=${vidMatch[1]}&type=h264&w=auto`;
                            console.log('Extracted embed URL:', embedUrl);
                            return embedUrl;
                        }
                    }
                    
                    // Extract the URL from the match
                    const urlMatch = matches[0].match(/src="([^"]+)"/) || matches[0].match(/['"`]([^'"`]+)['"`]/);
                    if (urlMatch && urlMatch[1]) {
                        const videoUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : `https://www.earthcam.com${urlMatch[1]}`;
                        console.log('Extracted video URL:', videoUrl);
                        return videoUrl;
                    }
                }
            }
        } catch (error) {
            console.log('Failed to extract from container:', error.message);
        }
        
        return null;

    } catch (error) {
        console.error('Error extracting video stream URL:', error.message);
        return null;
    }
}

// Endpoint to get video stream URL
app.get('/api/earthcam/stream-url', async (req, res) => {
    try {
        // Fetch the current EarthCam video player page to get the latest stream URL
        const videoPlayerUrl = 'https://www.earthcam.com/js/video/embed.php?vid=27777.flv&type=h264&w=auto&requested_version=current';
        
        console.log('Fetching current video player configuration...');
        const response = await axios.get(videoPlayerUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 10000
        });

        const html = response.data;
        
        // Look for the HLS stream URL in the configuration
        const streamMatch = html.match(/playlist\.m3u8\?[^"'\s]+/);
        
        if (streamMatch) {
            const streamUrl = `https://videos-3.earthcam.com/fecnetwork/27777.flv/${streamMatch[0]}`;
            console.log('Found current stream URL:', streamUrl);
            
            res.json({ 
                success: true, 
                streamUrl: streamUrl,
                proxyUrl: `/api/earthcam/proxy?url=${encodeURIComponent(streamUrl)}`
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'No video stream found in current configuration' 
            });
        }
    } catch (error) {
        console.error('Error getting stream URL:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to extract video stream URL' 
        });
    }
});

// Proxy endpoint for video streams
app.get('/api/earthcam/proxy', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        
        if (!targetUrl) {
            return res.status(400).json({ error: 'Missing URL parameter' });
        }

        console.log('Proxying video stream from:', targetUrl);

        // Set appropriate headers for video streaming
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Range': req.headers.range || 'bytes=0-',
            'Referer': 'https://www.earthcam.com/',
            'Origin': 'https://www.earthcam.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
        };
        
        console.log('🔍 Proxy request details:');
        console.log('  Target URL:', targetUrl);
        console.log('  Headers:', JSON.stringify(headers, null, 2));
        console.log('  Client Range:', req.headers.range);

        // Make the request to the target URL
        console.log('🚀 Making request to EarthCam...');
        const response = await axios({
            method: 'GET',
            url: targetUrl,
            headers: headers,
            responseType: 'stream',
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: () => true, // Don't throw on any status
        });
        
        console.log('📡 Response received:');
        console.log('  Status:', response.status);
        console.log('  Status Text:', response.statusText);
        console.log('  Headers:', JSON.stringify(response.headers, null, 2));
        
        if (response.status !== 200) {
            console.log('❌ Non-200 response, attempting to read error body...');
            let errorBody = '';
            response.data.on('data', (chunk) => {
                errorBody += chunk.toString();
            });
            response.data.on('end', () => {
                console.log('  Error body:', errorBody.substring(0, 500));
            });
            throw new Error(`EarthCam returned status ${response.status}: ${response.statusText}`);
        }

        // Forward the response headers
        Object.keys(response.headers).forEach(header => {
            if (header.toLowerCase() !== 'content-encoding') { // Avoid double encoding
                res.setHeader(header, response.headers[header]);
            }
        });

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Range');

        // Pipe the video stream to the client
        response.data.pipe(res);

        // Handle errors
        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Stream error occurred' });
            }
        });

    } catch (error) {
        console.error('Proxy error:', error.message);
        
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Failed to proxy video stream',
                details: error.message 
            });
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        endpoints: {
            streamUrl: '/api/earthcam/stream-url',
            proxy: '/api/earthcam/proxy'
        }
    });
});

// Serve the main HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/song-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'song-list.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 EarthCam Stream Proxy Server running on http://localhost:${PORT}`);
    console.log(`📺 Stream URL: http://localhost:${PORT}/api/earthcam/stream-url`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📱 Song list: http://localhost:${PORT}/song-list`);
});

module.exports = app; 