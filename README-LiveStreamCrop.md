# LiveStreamCrop Component

A lightweight, cropped YouTube livestream embed component that replaces EarthCam with a click-to-play YouTube livestream. Features precise cropping control, responsive design, and no third-party dependencies.

## Features

- ✅ **Click-to-play facade** - Reduces page weight by only loading iframe on demand
- ✅ **Precise cropping control** - Offset and scale the iframe within a masked container
- ✅ **No scrollbars** - Fixed rectangle window with overflow hidden
- ✅ **Responsive design** - Maintains 16:9 aspect ratio across screen sizes
- ✅ **CSS variable customization** - Easy theming without touching layout code
- ✅ **Pre-built crop presets** - Common scenarios like hiding black bars
- ✅ **Vanilla JavaScript & React** - Both versions included
- ✅ **Auto-initialization** - Works with data attributes
- ✅ **Error handling** - Graceful fallbacks and retry functionality

## Quick Start

### 1. Include the files

```html
<link rel="stylesheet" href="styles.css">
<script src="live-stream-crop.js"></script>
```

### 2. Basic usage

```html
<div id="livestream-container"></div>

<script>
new LiveStreamCrop('livestream-container', {
    videoId: 'GJFHpFppy2k',
    width: 640,
    height: 360
});
</script>
```

### 3. With data attributes (auto-initialization)

```html
<div 
    data-livestream-crop
    data-video-id="GJFHpFppy2k"
    data-width="640"
    data-height="360"
    data-offset-x="-10"
    data-offset-y="-15"
    data-scale="1.2"
></div>
```

## API Reference

### Constructor Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `videoId` | string | `'GJFHpFppy2k'` | YouTube video ID |
| `width` | number | `640` | Container width in pixels |
| `height` | number | `360` | Container height in pixels |
| `offsetX` | number | `0` | Horizontal offset in pixels |
| `offsetY` | number | `0` | Vertical offset in pixels |
| `scale` | number | `1` | Uniform scale factor |
| `showControls` | boolean | `false` | Show YouTube player controls |
| `responsive` | boolean | `false` | Enable 16:9 responsive mode |
| `autoplay` | boolean | `false` | Autoplay on load (requires user interaction) |

### CSS Variables

The component uses CSS variables for easy customization:

```css
.live-stream-crop {
    --livestream-width: 640px;
    --livestream-height: 360px;
    --livestream-offset-x: 0px;
    --livestream-offset-y: 0px;
    --livestream-scale: 1;
    --livestream-border-radius: 0px;
    --livestream-background: #000;
}
```

### Crop Presets

Pre-configured settings for common scenarios:

```javascript
// Hide black bars on 16:9 content
LiveStreamCrop.CropPresets.hideBlackBars
// { offsetX: 0, offsetY: -12.5, scale: 1.25 }

// Center on specific region
LiveStreamCrop.CropPresets.centerRegion
// { offsetX: -25, offsetY: -25, scale: 1.5 }

// Zoom in on center
LiveStreamCrop.CropPresets.zoomCenter
// { offsetX: -12.5, offsetY: -12.5, scale: 1.25 }

// Remove YouTube UI elements
LiveStreamCrop.CropPresets.removeUI
// { offsetX: 0, offsetY: -10, scale: 1.2 }
```

## React Component

```jsx
import LiveStreamCrop from './LiveStreamCrop.jsx';

function App() {
    return (
        <LiveStreamCrop
            videoId="GJFHpFppy2k"
            width={640}
            height={360}
            offsetX={-10}
            offsetY={-15}
            scale={1.2}
            responsive={true}
            className="custom-livestream"
        />
    );
}

// Using crop presets
const { hideBlackBars } = LiveStreamCrop.CropPresets;
<LiveStreamCrop
    videoId="GJFHpFppy2k"
    width={400}
    height={300}
    {...hideBlackBars}
/>
```

## Integration: Replacing EarthCam

### 1. Update HTML

Remove EarthCam dependencies and add LiveStreamCrop:

```html
<!-- Remove these lines -->
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script src="earthcam-stream.js"></script>

<!-- Add this line -->
<script src="live-stream-crop.js"></script>
```

### 2. Update JavaScript

Replace EarthCam initialization in `unified-player.js`:

```javascript
// Replace this:
// window.earthcamStream = new EarthCamStream('header-image', {...});

// With this:
window.liveStreamCrop = new LiveStreamCrop('header-image', {
    videoId: 'GJFHpFppy2k',
    width: 425,
    height: 239,
    offsetX: -10,  // Adjust to crop as needed
    offsetY: -15,  // Adjust to crop as needed
    scale: 1.2,    // Adjust zoom level
    responsive: false
});
```

### 3. Clean up

You can now remove:
- `earthcam-stream.js`
- `earthcam-video.js`
- `server.js` (if only used for EarthCam proxy)
- HLS.js dependency

## Crop Adjustment Guide

### Common Scenarios

**Hide black bars:**
```javascript
{
    offsetX: 0,
    offsetY: -12.5,  // Negative values crop top/bottom
    scale: 1.25      // Scale up to fill container
}
```

**Center on specific area:**
```javascript
{
    offsetX: -25,    // Shift left/right
    offsetY: -25,    // Shift up/down
    scale: 1.5       // Zoom in
}
```

**Remove YouTube UI:**
```javascript
{
    offsetX: 0,
    offsetY: -10,    // Crop top to hide UI
    scale: 1.2       // Slight zoom to compensate
}
```

### How Crop Math Works

The component uses CSS transforms to position and scale the iframe:

```css
iframe {
    position: absolute;
    top: var(--livestream-offset-y);
    left: var(--livestream-offset-x);
    width: calc(100% / var(--livestream-scale));
    height: calc(100% / var(--livestream-scale));
    transform: scale(var(--livestream-scale));
    transform-origin: top left;
}
```

- **offsetX/offsetY**: Move the iframe within the container
- **scale**: Uniform scaling (1 = 100%, 1.5 = 150%, etc.)
- **width/height**: Compensate for scale to maintain aspect ratio

## Examples

See `live-stream-crop-examples.html` for comprehensive examples including:

- Basic implementation
- Responsive design
- Crop presets
- Data attributes
- Custom styling
- React usage
- Integration guide

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires support for:
- CSS Custom Properties (CSS Variables)
- CSS Transform
- ES6 Classes
- Fetch API

## Performance

- **Lightweight**: ~8KB minified
- **Lazy loading**: iframe only loads on user click
- **No dependencies**: Pure vanilla JavaScript
- **Efficient**: Uses CSS transforms for smooth performance

## Troubleshooting

### Stream not loading
- Check video ID is correct and stream is live
- Verify network connectivity
- Check browser console for errors

### Crop not working as expected
- Ensure container has `overflow: hidden`
- Check CSS variables are being applied
- Verify scale and offset values

### Responsive issues
- Use `responsive: true` for 16:9 aspect ratio
- Check container width constraints
- Test on different screen sizes

## License

MIT License - feel free to use in your projects.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This component replaces the EarthCam implementation with a YouTube livestream. Make sure you have permission to use the YouTube stream and comply with YouTube's terms of service.
