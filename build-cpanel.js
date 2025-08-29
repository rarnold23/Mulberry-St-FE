const fs = require('fs');
const path = require('path');

// Create dist-cpanel directory for static hosting
const distDir = './dist-cpanel';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Copy only static files (no server files)
const filesToCopy = [
    'index.html',
    'styles.css',
    'unified-player.js',
    'live-stream-crop.js'
];

// Copy static files
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`✅ Copied ${file}`);
    }
});

// Copy assets directory
const assetsDir = './assets';
const distAssetsDir = './dist-cpanel/assets';
if (fs.existsSync(assetsDir)) {
    if (!fs.existsSync(distAssetsDir)) {
        fs.mkdirSync(distAssetsDir, { recursive: true });
    }
    
    const assets = fs.readdirSync(assetsDir);
    assets.forEach(asset => {
        const srcPath = path.join(assetsDir, asset);
        const destPath = path.join(distAssetsDir, asset);
        if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied assets/${asset}`);
        }
    });
}

// Copy music directory
const musicDir = './music';
const distMusicDir = './dist-cpanel/music';
if (fs.existsSync(musicDir)) {
    if (!fs.existsSync(distMusicDir)) {
        fs.mkdirSync(distMusicDir, { recursive: true });
    }
    
    const musicFiles = fs.readdirSync(musicDir);
    musicFiles.forEach(file => {
        const srcPath = path.join(musicDir, file);
        const destPath = path.join(distMusicDir, file);
        if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Copied music/${file}`);
        }
    });
}

console.log('\n🎵 Mulberry Street Radio cPanel build complete!');
console.log('📁 Static files are ready in the ./dist-cpanel directory');
console.log('🚀 Upload these files to public_html/mulberrystradio/ in cPanel');
console.log('⚠️  Note: This build excludes server.js and package.json for static hosting');
