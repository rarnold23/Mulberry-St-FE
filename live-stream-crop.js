/**
 * LiveStreamCrop Component
 * A cropped, non-scrollable YouTube livestream embed with click-to-play functionality
 */

class LiveStreamCrop {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            videoId: options.videoId || 'GJFHpFppy2k',
            width: options.width || 640,
            height: options.height || 360,
            offsetX: options.offsetX || 0,
            offsetY: options.offsetY || 0,
            scale: options.scale || 1,
            showControls: options.showControls || false,
            responsive: options.responsive || false,
            autoplay: options.autoplay || false,
            ...options
        };
        
        this.isLoaded = false;
        this.isPlaying = false;
        this.iframe = null;
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error('LiveStreamCrop: Container element not found');
            return;
        }
        
        this.render();
        this.setupEventListeners();
        this.updateStyles();
    }
    
    render() {
        const responsiveClass = this.options.responsive ? ' responsive' : '';
        
        this.container.innerHTML = `
            <div class="live-stream-crop${responsiveClass}">
                <!-- Click-to-play facade -->
                <div class="play-facade" id="play-facade">
                    <div class="play-icon"></div>
                    <div class="play-text">Click to Play Live Stream</div>
                    <div class="play-subtext">Little Italy, NYC</div>
                </div>
                
                <!-- YouTube iframe container -->
                <div class="iframe-container" id="iframe-container" style="display: none;">
                    <!-- iframe will be injected here on click -->
                </div>
                
                <!-- Loading state -->
                <div class="loading" id="loading" style="display: none;">
                    Loading live stream...
                </div>
                
                <!-- Error state -->
                <div class="error" id="error" style="display: none;">
                    <div class="error-icon">⚠️</div>
                    <div>Failed to load stream</div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
                        Click to retry
                    </div>
                </div>
            </div>
        `;
        
        // Store references to elements
        this.playFacade = this.container.querySelector('#play-facade');
        this.iframeContainer = this.container.querySelector('#iframe-container');
        this.loadingElement = this.container.querySelector('#loading');
        this.errorElement = this.container.querySelector('#error');
        this.liveStreamCrop = this.container.querySelector('.live-stream-crop');
    }
    
    setupEventListeners() {
        // Click to play
        this.playFacade.addEventListener('click', () => this.loadStream());
        
        // Error retry
        this.errorElement.addEventListener('click', () => this.loadStream());
        
        // Handle iframe load events
        this.iframeContainer.addEventListener('load', () => this.onIframeLoad());
    }
    
    updateStyles() {
        if (!this.liveStreamCrop) return;
        
        // Update CSS variables
        this.liveStreamCrop.style.setProperty('--livestream-width', `${this.options.width}px`);
        this.liveStreamCrop.style.setProperty('--livestream-height', `${this.options.height}px`);
        this.liveStreamCrop.style.setProperty('--livestream-offset-x', `${this.options.offsetX}px`);
        this.liveStreamCrop.style.setProperty('--livestream-offset-y', `${this.options.offsetY}px`);
        this.liveStreamCrop.style.setProperty('--livestream-scale', this.options.scale.toString());
    }
    
    loadStream() {
        if (this.isLoaded && this.isPlaying) return;
        
        this.showLoading();
        
        // Build YouTube embed URL with parameters
        const params = new URLSearchParams({
            autoplay: this.options.autoplay ? '1' : '0',
            mute: '1', // Always mute for autoplay compatibility
            playsinline: '1',
            rel: '0',
            modestbranding: '1'
        });
        
        if (!this.options.showControls) {
            params.append('controls', '0');
        }
        
        const embedUrl = `https://www.youtube.com/embed/${this.options.videoId}?${params.toString()}`;
        
        // Create iframe
        this.iframe = document.createElement('iframe');
        this.iframe.src = embedUrl;
        this.iframe.title = 'YouTube Live Stream';
        this.iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        this.iframe.allowFullscreen = true;
        
        // Clear container and add iframe
        this.iframeContainer.innerHTML = '';
        this.iframeContainer.appendChild(this.iframe);
        
        // Show iframe container
        this.iframeContainer.style.display = 'block';
        this.playFacade.classList.add('hidden');
        this.hideError();
        
        // Set loaded state
        this.isLoaded = true;
        this.isPlaying = true;
        
        // Hide loading after a short delay to allow iframe to start loading
        setTimeout(() => {
            this.hideLoading();
        }, 1000);
        
        console.log('🎥 LiveStreamCrop: YouTube stream loaded', {
            videoId: this.options.videoId,
            url: embedUrl,
            crop: {
                offsetX: this.options.offsetX,
                offsetY: this.options.offsetY,
                scale: this.options.scale
            }
        });
    }
    
    onIframeLoad() {
        this.hideLoading();
        console.log('✅ LiveStreamCrop: iframe loaded successfully');
    }
    
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'block';
        }
    }
    
    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }
    
    showError() {
        if (this.errorElement) {
            this.errorElement.style.display = 'block';
        }
        this.hideLoading();
    }
    
    hideError() {
        if (this.errorElement) {
            this.errorElement.style.display = 'none';
        }
    }
    
    // Public methods for updating crop settings
    updateCrop(offsetX, offsetY, scale) {
        this.options.offsetX = offsetX;
        this.options.offsetY = offsetY;
        this.options.scale = scale;
        this.updateStyles();
    }
    
    updateSize(width, height) {
        this.options.width = width;
        this.options.height = height;
        this.updateStyles();
    }
    
    // Reset to play facade
    reset() {
        this.isLoaded = false;
        this.isPlaying = false;
        this.iframe = null;
        
        this.iframeContainer.style.display = 'none';
        this.playFacade.classList.remove('hidden');
        this.hideLoading();
        this.hideError();
    }
    
    // Destroy component
    destroy() {
        if (this.iframe) {
            this.iframe.remove();
            this.iframe = null;
        }
        this.container.innerHTML = '';
    }
}

// Utility functions for common crop scenarios
LiveStreamCrop.CropPresets = {
    // Hide black bars on 16:9 content in 4:3 container
    hideBlackBars: {
        offsetX: 0,
        offsetY: -12.5, // Crop top/bottom black bars
        scale: 1.25
    },
    
    // Center on a specific region (e.g., for security cameras)
    centerRegion: {
        offsetX: -25,
        offsetY: -25,
        scale: 1.5
    },
    
    // Zoom in on center
    zoomCenter: {
        offsetX: -12.5,
        offsetY: -12.5,
        scale: 1.25
    },
    
    // Crop to remove YouTube UI elements
    removeUI: {
        offsetX: 0,
        offsetY: -10,
        scale: 1.2
    }
};

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('[data-livestream-crop]');
    
    containers.forEach(container => {
        const videoId = container.dataset.videoId || 'GJFHpFppy2k';
        const width = parseInt(container.dataset.width) || 640;
        const height = parseInt(container.dataset.height) || 360;
        const offsetX = parseInt(container.dataset.offsetX) || 0;
        const offsetY = parseInt(container.dataset.offsetY) || 0;
        const scale = parseFloat(container.dataset.scale) || 1;
        const showControls = container.dataset.showControls === 'true';
        const responsive = container.dataset.responsive === 'true';
        
        new LiveStreamCrop(container, {
            videoId,
            width,
            height,
            offsetX,
            offsetY,
            scale,
            showControls,
            responsive
        });
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveStreamCrop;
}
