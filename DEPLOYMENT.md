# Deploying Mulberry Street Radio to rich-arnold.com/mulberrystradio

## cPanel Hosting Deployment (Recommended for your setup)

### Step 1: Build the Project
```bash
npm run build
```

### Step 2: Access cPanel
1. Log into your cPanel account for rich-arnold.com
2. Navigate to the **File Manager**

### Step 3: Create the Directory Structure
1. In the File Manager, navigate to your `public_html` directory
2. Create a new folder called `mulberrystradio`
3. This will create the path: `public_html/mulberrystradio/`

### Step 4: Upload Files
1. Open the `mulberrystradio` folder you just created
2. Upload all files from the `dist` folder to this directory
3. Make sure to maintain the folder structure:
   - `index.html` (in the root of mulberrystradio)
   - `styles.css`
   - `unified-player.js`
   - `live-stream-crop.js`
   - `server.js`
   - `package.json`
   - `assets/` folder (with all images)
   - `music/` folder (with all audio files)

### Step 5: Configure Node.js (if needed)
If your cPanel supports Node.js applications:
1. In cPanel, look for **Node.js** or **Node.js Selector**
2. Create a new Node.js app
3. Set the application root to `/mulberrystradio`
4. Set the startup file to `server.js`
5. Set the Node.js version to 14 or higher

### Step 6: Test the Deployment
Visit `rich-arnold.com/mulberrystradio` to test your application

## Alternative: Static File Serving (Simpler)

If you don't need the Node.js server functionality:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload only the static files**:
   - `index.html`
   - `styles.css`
   - `unified-player.js`
   - `live-stream-crop.js`
   - `assets/` folder
   - `music/` folder

3. **Remove server files**:
   - Don't upload `server.js` or `package.json`

## Alternative Deployment Options

### Option 1: Vercel Deployment
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Configure Custom Domain**:
   - In your Vercel dashboard, add `rich-arnold.com` as a custom domain
   - Configure the path `/mulberrystradio` to point to your deployment

### Option 2: Static Hosting (Netlify, GitHub Pages, etc.)
1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload the `dist` folder** to your hosting provider

3. **Configure the subdirectory**:
   - Set the base path to `/mulberrystradio`
   - Ensure all assets are served correctly

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
