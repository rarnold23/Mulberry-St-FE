const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = './dist';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Copy all necessary files
const filesToCopy = [
    'index.html',
    'styles.css',
    'unified-player.js',
    'live-stream-crop.js',
    'server.js',
    'package.json'
];

// Copy files
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`✅ Copied ${file}`);
    }
});

// Copy assets directory
const assetsDir = './assets';
const distAssetsDir = './dist/assets';
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
const distMusicDir = './dist/music';
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

console.log('\n🎵 Mulberry Street Radio build complete!');
console.log('📁 Files are ready in the ./dist directory');
console.log('🚀 Ready for deployment to rich-arnold.com/mulberrystradio');
