# Deploying Mulberry Street Radio to rich-arnold.com/mulberrystradio

## Option 1: Vercel Deployment (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Configure Custom Domain**:
   - In your Vercel dashboard, go to your project settings
   - Add `rich-arnold.com` as a custom domain
   - Configure the path `/mulberrystradio` to point to your deployment

## Option 2: Static Hosting (Netlify, GitHub Pages, etc.)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder** to your hosting provider

3. **Configure the subdirectory**:
   - Set the base path to `/mulberrystradio`
   - Ensure all assets are served correctly

## Option 3: Traditional Web Hosting

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload files** to your web server at the path `/mulberrystradio/`

3. **Configure your web server** to serve the files correctly

## Environment Variables

If deploying to a platform that supports environment variables, you may want to set:
- `NODE_ENV=production`
- `PORT=3000` (or your preferred port)

## File Structure After Deployment

Your deployment should have this structure:
```
/mulberrystradio/
├── index.html
├── styles.css
├── unified-player.js
├── live-stream-crop.js
├── server.js
├── package.json
├── assets/
│   ├── little-italy-earthcam.jpg
│   └── live-stream-play-button.svg
└── music/
    └── [music files]
```

## Testing

After deployment, test these features:
- ✅ Main player loads correctly
- ✅ Song list view works
- ✅ Live stream play button works
- ✅ Music playback functions
- ✅ Mobile responsiveness
- ✅ All assets load properly

## Troubleshooting

- **404 errors**: Ensure your hosting provider is configured to serve the correct base path
- **CORS issues**: The app includes CORS headers, but you may need to configure your hosting provider
- **Asset loading**: Verify all paths in CSS and JS files are relative and correct
