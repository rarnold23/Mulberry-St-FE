/**
 * EarthCam Video Player Client
 * Loads a clean video player from our proxy server
 */

class EarthCamVideo {
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
        this.iframe = null;
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        if (!this.container) {
            console.error(`Container with ID '${this.containerId}' not found`);
            return;
        }
        
        // Create iframe for clean video player
        this.createVideoIframe();
        
        // Try to load the video
        await this.loadVideo();
    }
    
    createVideoIframe() {
        // Remove existing content
        this.container.innerHTML = '';
        
        // Create iframe for clean video player
        this.iframe = document.createElement('iframe');
        this.iframe.id = 'earthcam-video-iframe';
        this.iframe.frameBorder = '0';
        this.iframe.allowFullscreen = true;
        this.iframe.allow = 'autoplay; fullscreen; camera; microphone';
        this.iframe.loading = 'lazy';
        this.iframe.title = 'Mulberry Street Live Camera - Little Italy, NYC';
        this.iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: inherit;
            background: #000;
        `;
        
        // Add loading indicator
        this.container.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 14px;
                text-align: center;
                z-index: 10;
            ">
                <div>Loading EarthCam Stream...</div>
                <div style="margin-top: 10px; font-size: 12px;">Little Italy, NYC</div>
            </div>
        `;
        
        // Add iframe to container
        this.container.appendChild(this.iframe);
        
        // Add event listeners
        this.iframe.addEventListener('load', () => this.onIframeLoad());
        this.iframe.addEventListener('error', (e) => this.onError(e));
    }
    
    async loadVideo() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            console.log('🌍 Loading EarthCam video player...');
            
            // Set the iframe source to our clean video player endpoint
            this.iframe.src = `${this.options.serverUrl}/api/earthcam/clean-iframe`;
            
        } catch (error) {
            console.error('❌ Failed to load EarthCam video:', error);
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
    
    onIframeLoad() {
        console.log('✅ EarthCam video iframe loaded successfully');
        this.hideLoadingState();
        this.retryCount = 0; // Reset retry count on success
        
        // Remove loading indicator
        const loadingIndicator = this.container.querySelector('div');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
    
    onError(event) {
        console.error('❌ Video iframe error:', event);
        this.handleError(new Error('Video iframe failed to load'));
    }
    
    handleError(error) {
        console.error('❌ EarthCam video error:', error);
        
        if (this.options.autoRetry && this.retryCount < this.options.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Retrying... (${this.retryCount}/${this.options.maxRetries})`);
            
            setTimeout(() => {
                this.loadVideo();
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
        this.loadVideo();
    }
    
    destroy() {
        if (this.iframe) {
            this.iframe.src = '';
        }
        this.container.innerHTML = '';
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const headerImage = document.querySelector('.header-image');
    if (headerImage) {
        console.log('🚀 Initializing EarthCam video for header image');
        
        // Initialize EarthCam video
        window.earthcamVideo = new EarthCamVideo('header-image', {
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
    module.exports = EarthCamVideo;
} 