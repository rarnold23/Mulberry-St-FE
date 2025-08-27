import React, { useState, useRef, useEffect } from 'react';

/**
 * LiveStreamCrop React Component
 * A cropped, non-scrollable YouTube livestream embed with click-to-play functionality
 */

const LiveStreamCrop = ({
    videoId = 'GJFHpFppy2k',
    width = 640,
    height = 360,
    offsetX = 0,
    offsetY = 0,
    scale = 1,
    showControls = false,
    responsive = false,
    autoplay = false,
    className = '',
    style = {}
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const iframeRef = useRef(null);
    const containerRef = useRef(null);

    // Update CSS variables when props change
    useEffect(() => {
        if (containerRef.current) {
            const element = containerRef.current;
            element.style.setProperty('--livestream-width', `${width}px`);
            element.style.setProperty('--livestream-height', `${height}px`);
            element.style.setProperty('--livestream-offset-x', `${offsetX}px`);
            element.style.setProperty('--livestream-offset-y', `${offsetY}px`);
            element.style.setProperty('--livestream-scale', scale.toString());
        }
    }, [width, height, offsetX, offsetY, scale]);

    const loadStream = () => {
        if (isLoaded && isPlaying) return;

        setIsLoading(true);
        setHasError(false);

        // Build YouTube embed URL with parameters
        const params = new URLSearchParams({
            autoplay: autoplay ? '1' : '0',
            mute: '1', // Always mute for autoplay compatibility
            playsinline: '1',
            rel: '0',
            modestbranding: '1'
        });

        if (!showControls) {
            params.append('controls', '0');
        }

        const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = embedUrl;
        iframe.title = 'YouTube Live Stream';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        // Handle iframe load events
        iframe.onload = () => {
            setIsLoading(false);
            setIsLoaded(true);
            setIsPlaying(true);
            console.log('✅ LiveStreamCrop: iframe loaded successfully');
        };

        iframe.onerror = () => {
            setIsLoading(false);
            setHasError(true);
            console.error('❌ LiveStreamCrop: iframe failed to load');
        };

        // Clear container and add iframe
        if (iframeRef.current) {
            iframeRef.current.innerHTML = '';
            iframeRef.current.appendChild(iframe);
        }

        console.log('🎥 LiveStreamCrop: YouTube stream loaded', {
            videoId,
            url: embedUrl,
            crop: { offsetX, offsetY, scale }
        });
    };

    const handleRetry = () => {
        setHasError(false);
        loadStream();
    };

    const responsiveClass = responsive ? ' responsive' : '';
    const containerClasses = `live-stream-crop${responsiveClass} ${className}`.trim();

    return (
        <div 
            ref={containerRef}
            className={containerClasses}
            style={style}
        >
            {/* Click-to-play facade */}
            {!isLoaded && !hasError && (
                <div className="play-facade" onClick={loadStream}>
                    <div className="play-icon"></div>
                    <div className="play-text">Click to Play Live Stream</div>
                    <div className="play-subtext">Little Italy, NYC</div>
                </div>
            )}

            {/* YouTube iframe container */}
            {isLoaded && (
                <div className="iframe-container" ref={iframeRef}>
                    {/* iframe will be injected here on load */}
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="loading">
                    Loading live stream...
                </div>
            )}

            {/* Error state */}
            {hasError && (
                <div className="error" onClick={handleRetry}>
                    <div className="error-icon">⚠️</div>
                    <div>Failed to load stream</div>
                    <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                        Click to retry
                    </div>
                </div>
            )}
        </div>
    );
};

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

export default LiveStreamCrop;
