/**
 * EarthCam Stream Client
 * Fetches actual video stream URL and creates a video element (no iframe)
 */

class EarthCamStream {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            serverUrl: options.serverUrl || 'http://localhost:3000',
            fallbackImage: options.fallbackImage || 'assets/Illustration.png',
            autoRetry: options.autoRetry !== false,
            retryDelay: options.retryDelay || 5000,
            maxRetries: options.maxRetries || 3,
            ...options
        };
        
        this.retryCount = 0;
        this.videoElement = null;
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        if (!this.container) {
            console.error(`Container with ID '${this.containerId}' not found`);
            return;
        }
        
        // Create video element
        this.createVideoElement();
        
        // Try to load the stream
        await this.loadStream();
    }
    
    createVideoElement() {
        // Remove existing content
        this.container.innerHTML = '';
        
        // Create video element
        this.videoElement = document.createElement('video');
        this.videoElement.id = 'earthcam-video';
        this.videoElement.controls = false;
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.loop = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
            background: #000;
        `;
        
        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 14px;
            text-align: center;
            z-index: 10;
        `;
        loadingDiv.innerHTML = `
            <div>Loading EarthCam Stream...</div>
            <div style="margin-top: 10px; font-size: 12px;">Little Italy, NYC</div>
        `;
        
        // Add video element and loading indicator to container
        this.container.appendChild(this.videoElement);
        this.container.appendChild(loadingDiv);
        
        // Store reference to loading div for later removal
        this.loadingDiv = loadingDiv;
        
        // Add event listeners
        this.videoElement.addEventListener('loadstart', () => this.onLoadStart());
        this.videoElement.addEventListener('canplay', () => this.onCanPlay());
        this.videoElement.addEventListener('error', (e) => this.onError(e));
        this.videoElement.addEventListener('stalled', () => this.onStalled());
    }
    
    async loadStream() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            console.log('🌍 Fetching EarthCam stream URL...');
            
            // Get the stream URL from our proxy
            const streamResponse = await fetch(`${this.options.serverUrl}/api/earthcam/stream-url`);
            
            if (!streamResponse.ok) {
                throw new Error(`Failed to get stream URL: ${streamResponse.status}`);
            }
            
            const streamData = await streamResponse.json();
            
            if (!streamData.success || !streamData.proxyUrl) {
                throw new Error(streamData.error || 'No stream URL available');
            }
            
            console.log('📺 Stream URL found:', streamData.streamUrl);
            console.log('🔗 Using proxy URL:', streamData.proxyUrl);
            
            // Set the video source to our proxy
            const videoUrl = `${this.options.serverUrl}${streamData.proxyUrl}`;
            console.log('🎥 Setting video source:', videoUrl);
            
            // Check if HLS.js is supported and the stream is HLS
            if (Hls.isSupported() && videoUrl.includes('.m3u8')) {
                console.log('📺 Using HLS.js for HLS stream playback');
                const hls = new Hls({
                    debug: false,
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                
                hls.loadSource(videoUrl);
                hls.attachMedia(this.videoElement);
                
                // Add a timeout to detect if video fails to load
                const videoTimeout = setTimeout(() => {
                    console.warn('⚠️ HLS video loading timeout, showing fallback');
                    hls.destroy();
                    this.handleError(new Error('Video loading timeout'));
                }, 10000); // 10 second timeout
                
                // Wait for the video to be ready
                await new Promise((resolve, reject) => {
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        console.log('✅ HLS manifest parsed successfully');
                        clearTimeout(videoTimeout);
                        resolve();
                    });
                    
                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error('❌ HLS error:', data);
                        clearTimeout(videoTimeout);
                        reject(new Error(`HLS error: ${data.type}`));
                    });
                    
                    this.videoElement.addEventListener('canplay', () => {
                        clearTimeout(videoTimeout);
                        resolve();
                    }, { once: true });
                    
                    this.videoElement.addEventListener('error', (event) => {
                        clearTimeout(videoTimeout);
                        reject(new Error('Video failed to load'));
                    }, { once: true });
                });
                
                // Try to play the video
                try {
                    await this.videoElement.play();
                    console.log('✅ HLS video stream started successfully');
                    clearTimeout(videoTimeout);
                } catch (playError) {
                    console.warn('⚠️ HLS autoplay failed, but video should still load:', playError);
                    // Don't throw here - the video might still load and be playable
                }
                
            } else {
                // Fallback to native video playback for non-HLS streams
                console.log('📺 Using native video playback');
                this.videoElement.src = videoUrl;
                
                // Add a timeout to detect if video fails to load
                const videoTimeout = setTimeout(() => {
                    console.warn('⚠️ Video loading timeout, showing fallback');
                    this.handleError(new Error('Video loading timeout'));
                }, 10000); // 10 second timeout
                
                // Try to play the video
                try {
                    await this.videoElement.play();
                    console.log('✅ Video stream started successfully');
                    clearTimeout(videoTimeout);
                } catch (playError) {
                    console.warn('⚠️ Autoplay failed, but video should still load:', playError);
                    clearTimeout(videoTimeout);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to load EarthCam stream:', error);
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }
    
    showLoadingState() {
        if (this.container) {
            this.container.style.opacity = '0.7';
        }
    }
    
    hideLoadingState() {
        if (this.container) {
            this.container.style.opacity = '1';
        }
    }
    
    onLoadStart() {
        console.log('🔄 Video stream loading started');
        this.showLoadingState();
    }
    
    onCanPlay() {
        console.log('✅ Video stream ready to play');
        this.hideLoadingState();
        this.retryCount = 0; // Reset retry count on success
        
        // Remove loading indicator
        if (this.loadingDiv) {
            this.loadingDiv.remove();
            this.loadingDiv = null;
        }
    }
    
    onError(event) {
        console.error('❌ Video stream error:', event);
        console.error('  Video element error details:', {
            error: this.videoElement.error,
            networkState: this.videoElement.networkState,
            readyState: this.videoElement.readyState,
            src: this.videoElement.src
        });
        this.handleError(new Error('Video stream failed to load'));
    }
    
    onStalled() {
        console.warn('⚠️ Video stream stalled, attempting to reload...');
        setTimeout(() => {
            if (this.videoElement && this.videoElement.readyState < 3) {
                this.loadStream();
            }
        }, 2000);
    }
    
    handleError(error) {
        console.error('❌ EarthCam stream error:', error);
        
        // For 403 errors or timeouts, show fallback immediately
        if (error.message.includes('403') || error.message.includes('timeout')) {
            console.log('🖼️ Showing fallback immediately due to stream access issue');
            this.showFallback();
            return;
        }
        
        if (this.options.autoRetry && this.retryCount < this.options.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Retrying... (${this.retryCount}/${this.options.maxRetries})`);
            
            setTimeout(() => {
                this.loadStream();
            }, this.options.retryDelay);
        } else {
            this.showFallback();
        }
    }
    
    showFallback() {
        console.log('🖼️ Showing fallback image');
        
        if (this.container) {
            this.container.innerHTML = `
                <img src="${this.options.fallbackImage}" 
                     alt="Little Italy, NYC" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit;">
                <div style="
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    background: rgba(0,0,0,0.7);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                ">
                    📍 Little Italy, NYC
                </div>
            `;
        }
    }
    
    // Public methods
    reload() {
        this.retryCount = 0;
        this.loadStream();
    }
    
    destroy() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
            this.videoElement.load();
        }
        this.container.innerHTML = '';
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const headerImage = document.querySelector('.header-image');
    if (headerImage) {
        console.log('🚀 Initializing EarthCam stream for header image');
        
        // Initialize EarthCam stream
        window.earthcamStream = new EarthCamStream('header-image', {
            serverUrl: window.location.origin, // Use same origin as current page
            fallbackImage: 'assets/Illustration.png',
            autoRetry: true,
            retryDelay: 5000,
            maxRetries: 3
        });
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EarthCamStream;
} 