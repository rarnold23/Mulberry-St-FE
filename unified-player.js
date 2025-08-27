// Unified Music Player - Single Page Application

// App state
let currentView = 'player'; // 'player' | 'song-list'
let isTransitioning = false;
let audio = null;
let isPlaying = false;
let currentSongIndex = 0;
let songs = [];
let isMobile = false;

// DOM elements
let playerView, songListView, showSongListBtn, backToPlayerBtn;
let playBtn, previousBtn, nextBtn, progressBar, progressFill;
let currentTimeEl, totalTimeEl, trackTitle, trackTime;
let songListContainer, svgBackground, contentContainer;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 Initializing Unified Music Player');
    
    // Detect mobile device
    isMobile = window.innerWidth <= 768;
    console.log('📱 Mobile device detected:', isMobile);
    
    // Get DOM elements
    initializeElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Ensure SVG background starts in correct state
    if (svgBackground) {
        console.log('🔧 Initializing SVG background state');
        console.log('  - SVG background initial opacity:', svgBackground.style.opacity);
        console.log('  - SVG background initial bottom:', svgBackground.style.bottom);
        console.log('  - SVG background initial classes:', svgBackground.className);
        
        svgBackground.style.bottom = '-100vh';
        svgBackground.style.opacity = '0';
        svgBackground.classList.remove('slide-up', 'slide-down');
        
        console.log('  - SVG background after initialization:');
        console.log('    - opacity:', svgBackground.style.opacity);
        console.log('    - bottom:', svgBackground.style.bottom);
        console.log('    - classes:', svgBackground.className);
        console.log('    - computed opacity:', window.getComputedStyle(svgBackground).opacity);
        console.log('    - computed bottom:', window.getComputedStyle(svgBackground).bottom);
        console.log('✅ SVG background initialized in hidden state');
    }
    
    // Load songs and initialize player
    loadSongs();
    
    // Load EarthCam stream
    loadEarthCamStream();
    
    // Handle window resize for responsive design
    window.addEventListener('resize', handleResize);
});

function handleResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== isMobile) {
        console.log('📱 Mobile state changed:', isMobile);
        // Reinitialize layout if needed
        if (currentView === 'song-list') {
            // Force reflow for song list view
            setTimeout(() => {
                if (contentContainer) {
                    contentContainer.style.display = 'none';
                    contentContainer.offsetHeight; // Force reflow
                    contentContainer.style.display = '';
                }
            }, 10);
        }
    }
}

function initializeElements() {
    // Views
    playerView = document.getElementById('player-view');
    songListView = document.getElementById('song-list-view');
    
    // Navigation buttons
    showSongListBtn = document.getElementById('show-song-list');
    backToPlayerBtn = document.getElementById('back-to-player');
    
    // Player controls
    playBtn = document.querySelector('.play-btn');
    previousBtn = document.querySelector('.previous-btn');
    nextBtn = document.querySelector('.next-btn');
    progressBar = document.querySelector('.progress-bar');
    progressFill = document.querySelector('.progress-fill');
    currentTimeEl = document.querySelector('.current-time');
    totalTimeEl = document.querySelector('.total-time');
    trackTitle = document.querySelector('.track-title');
    trackTime = document.querySelector('.track-time');
    
    // Song list elements
    songListContainer = document.getElementById('songList');
    svgBackground = document.querySelector('.svg-background');
    contentContainer = document.querySelector('.content-container');
    
    console.log('✅ DOM elements initialized');
}

function setupEventListeners() {
    // Navigation
    showSongListBtn.addEventListener('click', showSongList);
    backToPlayerBtn.addEventListener('click', showPlayer);
    
    // Player controls
    playBtn.addEventListener('click', togglePlay);
    previousBtn.addEventListener('click', skipPrevious);
    nextBtn.addEventListener('click', skipNext);
    progressBar.addEventListener('click', seekToPosition);
    
    // Mobile touch events
    if (isMobile) {
        setupMobileTouchEvents();
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                skipPrevious();
                break;
            case 'ArrowRight':
                e.preventDefault();
                skipNext();
                break;
            case 'Escape':
                if (currentView === 'song-list') {
                    e.preventDefault();
                    showPlayer();
                }
                break;
        }
    });
    
    console.log('✅ Event listeners set up');
}

function setupMobileTouchEvents() {
    // Add touch event listeners for mobile
    if (progressBar) {
        progressBar.addEventListener('touchstart', handleTouchStart);
        progressBar.addEventListener('touchmove', handleTouchMove);
        progressBar.addEventListener('touchend', handleTouchEnd);
    }
    
    // Prevent zoom on double tap for mobile
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    if (!touchStartX || !touchStartY) {
        return;
    }
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Prevent default if it's a horizontal swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    if (!touchStartX || !touchStartY) {
        return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Check if touch was on progress bar
    const rect = progressBar.getBoundingClientRect();
    const touchX = touchEndX;
    const touchY = touchEndY;
    
    if (touchX >= rect.left && touchX <= rect.right && 
        touchY >= rect.top && touchY <= rect.bottom) {
        // Touch was on progress bar, seek to position
        seekToPosition(e);
        return;
    }
    
    // Handle horizontal swipe gestures (only if not on progress bar)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
            // Swipe left - next song
            skipNext();
        } else {
            // Swipe right - previous song
            skipPrevious();
        }
    }
    
    // Reset touch coordinates
    touchStartX = 0;
    touchStartY = 0;
}

// View Management
function showSongList() {
    if (isTransitioning || currentView === 'song-list') return;
    
    console.log('🔄 Switching to song list view');
    console.log('  - Player view element:', playerView);
    console.log('  - Song list view element:', songListView);
    console.log('  - SVG background element:', svgBackground);
    console.log('  - Content container element:', contentContainer);
    
    // Log initial states
    console.log('📊 Initial states:');
    console.log('  - Player view display:', playerView.style.display);
    console.log('  - Song list view display:', songListView.style.display);
    console.log('  - SVG background opacity:', svgBackground.style.opacity);
    console.log('  - SVG background bottom:', svgBackground.style.bottom);
    console.log('  - SVG background classes:', svgBackground.className);
    console.log('  - Content container opacity:', window.getComputedStyle(contentContainer).opacity);
    
    isTransitioning = true;
    
    // 1. First, ensure SVG background is in correct initial state
    console.log('🔧 Step 1: Resetting SVG background state');
    svgBackground.style.opacity = '0';
    svgBackground.style.bottom = '-100vh';
    svgBackground.classList.remove('slide-up', 'slide-down');
    console.log('  - SVG background reset to initial state');
    console.log('  - SVG background opacity after reset:', svgBackground.style.opacity);
    console.log('  - SVG background bottom after reset:', svgBackground.style.bottom);
    console.log('  - SVG background classes after reset:', svgBackground.className);
    
    // 2. Show song list view (keep player view visible until animation covers it)
    console.log('🔧 Step 2: Showing song list view');
    songListView.style.display = 'block';
    songListView.style.backgroundColor = '#00724d'; // Temporary green background
    console.log('  - Song list view shown with green background');
    console.log('  - Song list view display after show:', songListView.style.display);

    // 3. Check if white flash might be coming from song list container
    console.log('🔍 Step 3: Checking potential white background sources');
    console.log('  - Song list container background:', window.getComputedStyle(songListView).backgroundColor);
    console.log('  - Content container background:', window.getComputedStyle(contentContainer).backgroundColor);
    console.log('  - Body background:', window.getComputedStyle(document.body).backgroundColor);
    console.log('  - HTML background:', window.getComputedStyle(document.documentElement).backgroundColor);
    console.log('  - SVG background computed opacity:', window.getComputedStyle(svgBackground).opacity);
    console.log('  - SVG background computed visibility:', window.getComputedStyle(svgBackground).visibility);
    console.log('  - SVG background computed display:', window.getComputedStyle(svgBackground).display);
    
    // 4. Force a reflow to ensure initial state is applied
    console.log('🔧 Step 4: Forcing reflow');
    svgBackground.offsetHeight;
    console.log('  - Reflow completed');
    
    // 5. Start the SVG background animation
    setTimeout(() => {
        console.log('🔧 Step 5: Adding slide-up class to SVG background');
        console.log('  - SVG background classes before slide-up:', svgBackground.className);
        svgBackground.classList.add('slide-up');
        console.log('  - SVG background classes after slide-up:', svgBackground.className);
        
        // Check computed styles after adding class
        setTimeout(() => {
            console.log('  - SVG background computed opacity after slide-up:', window.getComputedStyle(svgBackground).opacity);
            console.log('  - SVG background computed bottom after slide-up:', window.getComputedStyle(svgBackground).bottom);
        }, 10);
    }, 50);
    
    // 6. Add fade-in class to content container
    setTimeout(() => {
        console.log('🔧 Step 6: Adding fade-in class to content container');
        console.log('  - Content container classes before fade-in:', contentContainer.className);
        contentContainer.classList.add('fade-in');
        console.log('  - Content container classes after fade-in:', contentContainer.className);
        
        // Check computed styles after adding class
        setTimeout(() => {
            console.log('  - Content container computed opacity after fade-in:', window.getComputedStyle(contentContainer).opacity);
        }, 10);
    }, 300);
    
    // 7. Remove temporary background and finalize transition
    setTimeout(() => {
        songListView.style.backgroundColor = 'transparent';
        console.log('  - Removed temporary green background');
        console.log('🔧 Step 7: Finalizing transition');
        console.log('  - Hiding player view');
        playerView.style.display = 'none';
        currentView = 'song-list';
        isTransitioning = false;
        console.log('✅ Song list view active');
        console.log('📊 Final states:');
        console.log('  - SVG background computed opacity:', window.getComputedStyle(svgBackground).opacity);
        console.log('  - SVG background computed bottom:', window.getComputedStyle(svgBackground).bottom);
        console.log('  - Content container computed opacity:', window.getComputedStyle(contentContainer).opacity);
    }, 600);
}

function showPlayer() {
    if (isTransitioning || currentView === 'player') return;
    
    console.log('🔄 Switching to player view');
    console.log('  - Current view:', currentView);
    console.log('  - Is transitioning:', isTransitioning);
    
    // Log initial states
    console.log('📊 Initial states:');
    console.log('  - Player view display:', playerView.style.display);
    console.log('  - Song list view display:', songListView.style.display);
    console.log('  - SVG background opacity:', svgBackground.style.opacity);
    console.log('  - SVG background bottom:', svgBackground.style.bottom);
    console.log('  - SVG background classes:', svgBackground.className);
    
    isTransitioning = true;
    
    // 1. Show player view first with temporary background
    console.log('🔧 Step 1: Showing player view with temporary background');
    playerView.style.display = 'block';
    playerView.style.backgroundColor = '#fffdf9'; // Temporary white background
    console.log('  - Player view shown with white background');
    console.log('  - Player view display after show:', playerView.style.display);
    
    // 2. Trigger exit animation for content
    console.log('🔧 Step 2: Triggering content fade-out');
    contentContainer.classList.remove('fade-in');
    contentContainer.classList.add('fade-out');
    
    // 3. Start SVG background slide-down animation
    setTimeout(() => {
        console.log('🔧 Step 3: Starting SVG background slide-down');
        svgBackground.classList.remove('slide-up');
        svgBackground.classList.add('slide-down');
    }, 100);
    
    // 4. Hide song list view after SVG background is hidden
    setTimeout(() => {
        console.log('🔧 Step 4: Hiding song list view (after SVG is hidden)');
        songListView.style.display = 'none';
        songListView.style.backgroundColor = 'transparent'; // Reset temporary background
        console.log('  - Song list view hidden');
    }, 400);
    
    // 5. Remove temporary background and finalize transition
    setTimeout(() => {
        playerView.style.backgroundColor = 'transparent';
        console.log('  - Removed temporary white background');
        console.log('🔧 Step 5: Finalizing transition');
        
        // Reset classes and ensure proper state
        contentContainer.classList.remove('fade-out');
        svgBackground.classList.remove('slide-down');
        
        // Ensure SVG background is properly hidden
        svgBackground.style.opacity = '0';
        svgBackground.style.bottom = '-100vh';
        
        currentView = 'player';
        isTransitioning = false;
        console.log('✅ Player view active');
        console.log('📊 Final states:');
        console.log('  - SVG background computed opacity:', window.getComputedStyle(svgBackground).opacity);
        console.log('  - SVG background computed bottom:', window.getComputedStyle(svgBackground).bottom);
    }, 600);
}

// Song Management
async function loadSongs() {
    try {
        console.log('📡 Loading songs from Google Sheets...');
        
        const GOOGLE_SHEET_ID = '1w_Yrcv_VH8rALORHWaUZ6PAYns7WQY3-hPsAjwJmEEI';
        const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=0`;
        
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
        songs = parseCSVData(csvData);
        
        console.log(`✅ Loaded ${songs.length} songs`);
        
        // Populate song list
        populateSongList();
        
        // Load current song
        loadCurrentSong();
        
    } catch (error) {
        console.error('❌ Error loading songs:', error);
        loadFallbackData();
    }
}

function parseCSVData(csvData) {
    const lines = csvData.trim().split('\n');
    const songsData = [];
    
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
            const columns = parseCSVLine(trimmedLine);
            
            if (columns.length >= 5) {
                const filePath = columns[4] || '';
                if (filePath) {
                    songsData.push({
                        id: index + 1,
                        title: columns[0] || 'Unknown Title',
                        artist: columns[1] || 'Unknown Artist',
                        time: columns[2] || '',
                        date: columns[3] || '',
                        filePath: filePath
                    });
                }
            }
        }
    });
    
    return songsData;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function loadFallbackData() {
    console.log('📡 Loading fallback data...');
    songs = [
        {
            id: 1,
            artist: "Bad Bunny",
            title: "BAILE INoLVIDABLE", 
            time: "6:50 PM",
            date: "7/3/2025",
            filePath: "music/Baile Inolvidable- Bad Bunny.m4a"
        },
        {
            id: 2,
            artist: "Clipse",
            title: "Chains & Whips",
            time: "2:23 PM", 
            date: "7/21/2025",
            filePath: "music/Chains Whips- Clipse Kendrick Lamar Pusha T Malice.m4a"
        },
        {
            id: 3,
            artist: "Dean Martin",
            title: "Volare",
            time: "11:52 AM",
            date: "7/4/2025",
            filePath: "music/Volare nel Blu Di Pinto Di Blu- Dean Martin.m4a"
        }
    ];
    
    populateSongList();
    loadCurrentSong();
}

function populateSongList() {
    if (!songListContainer) return;
    
    songListContainer.innerHTML = '';
    
    songs.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.setAttribute('data-song-id', song.id);
        
        // All songs use simplified 3-column layout on mobile
        songItem.innerHTML = `
            <div class="song-divider"></div>
            <div class="song-content">
                <div class="song-number">
                    <span class="track-number">${index + 1}</span>
                    <div class="play-button"></div>
                </div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-time">${escapeHtml(song.time)}</div>
                <div class="song-date">${escapeHtml(song.date)}</div>
            </div>
        `;
        
        songListContainer.appendChild(songItem);
    });
    
    addSongItemListeners();
}

function addSongItemListeners() {
    const songItems = document.querySelectorAll('.song-item');
    
    songItems.forEach((item, index) => {
        const songNumber = item.querySelector('.song-number');
        const playButton = item.querySelector('.play-button');
        const trackNumber = item.querySelector('.track-number');
        
        // Remove all existing event listeners by cloning the element
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Get references to the new elements
        const newSongNumber = newItem.querySelector('.song-number');
        const newPlayButton = newItem.querySelector('.play-button');
        const newTrackNumber = newItem.querySelector('.track-number');
        
        // Reset the display state
        newSongNumber.classList.remove('playing');
        newSongNumber.style.cursor = 'default';
        
        // Check if this is the currently playing song and is actually playing
        if (currentSongIndex === index && isPlaying) {
            // Show pause button for currently playing song
            newSongNumber.innerHTML = `
                <img src="http://localhost:3845/assets/02ffbe30d55b681ebda4d04fcb7fbedb855adf88.svg" alt="Pause" style="width: 15px; height: 18px;">
            `;
            newSongNumber.classList.add('playing');
            newSongNumber.style.cursor = 'pointer';
            
            // Add pause functionality
            newSongNumber.addEventListener('click', function(e) {
                e.stopPropagation();
                togglePlay();
            });
        } else {
            // Show track number for all other songs
            newSongNumber.innerHTML = `
                <span class="track-number">${index + 1}</span>
                <div class="play-button"></div>
            `;
            
            if (!isMobile) {
                // Add hover functionality for desktop
                newItem.addEventListener('mouseenter', function() {
                    const hoverPlayButton = newItem.querySelector('.play-button');
                    const hoverTrackNumber = newItem.querySelector('.track-number');
                    if (hoverPlayButton && hoverTrackNumber) {
                        hoverPlayButton.style.opacity = '1';
                        hoverTrackNumber.style.opacity = '0';
                    }
                });
                
                newItem.addEventListener('mouseleave', function() {
                    const hoverPlayButton = newItem.querySelector('.play-button');
                    const hoverTrackNumber = newItem.querySelector('.track-number');
                    if (hoverPlayButton && hoverTrackNumber) {
                        hoverPlayButton.style.opacity = '0';
                        hoverTrackNumber.style.opacity = '1';
                    }
                });
            }
        }
        
        // Add click functionality to entire song item
        newItem.addEventListener('click', function(e) {
            // If this is the currently playing song, toggle play/pause
            if (currentSongIndex === index) {
                togglePlay();
            } else {
                // Otherwise, play the selected song
                playSelectedSong(index);
            }
        });
        
        // Make the song item clickable
        newItem.style.cursor = 'pointer';
        newItem.style.pointerEvents = 'auto';
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Audio Management
function loadCurrentSong() {
    if (songs.length === 0) return;
    
    const currentSong = songs[currentSongIndex];
    console.log('🎵 Loading song:', currentSong.title);
    
    // Create new audio element
    if (audio) {
        audio.pause();
        audio.removeEventListener('loadedmetadata', onAudioLoaded);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onSongEnded);
    }
    
    if (currentSong.filePath) {
        audio = new Audio(currentSong.filePath);
        audio.addEventListener('loadedmetadata', onAudioLoaded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onSongEnded);
    }
    
    // Update UI
    updateTrackInfo();
    updatePlayButton();
    
    // Reset progress
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    totalTimeEl.textContent = '0:00';
    isPlaying = false;
}

function updateTrackInfo() {
    if (songs.length === 0) return;
    
    const currentSong = songs[currentSongIndex];
    trackTitle.textContent = `${currentSong.artist} — ${currentSong.title}`;
    trackTime.textContent = `${currentSong.time}, ${currentSong.date}`;
}

function updatePlayButton() {
    if (isPlaying) {
        playBtn.innerHTML = `
            <img src="http://localhost:3845/assets/02ffbe30d55b681ebda4d04fcb7fbedb855adf88.svg" alt="Pause" style="width: 24px; height: 30px;">
        `;
    } else {
        playBtn.innerHTML = `
            <img src="http://localhost:3845/assets/9b3edc55cc411a667155c00cde51641c04ab5bfb.svg" alt="Play" style="width: 24px; height: 30px;">
        `;
    }
}

function togglePlay() {
    if (!audio) return;
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play().catch(error => {
            console.error('❌ Error playing audio:', error);
        });
        isPlaying = true;
    }
    
    updatePlayButton();
    addSongItemListeners(); // Update song list UI
}

function skipPrevious() {
    if (songs.length === 0) return;
    
    const wasPlaying = isPlaying;
    currentSongIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    
    loadCurrentSong();
    
    if (wasPlaying && audio) {
        setTimeout(() => {
            audio.play().then(() => {
                isPlaying = true;
                updatePlayButton();
                addSongItemListeners();
            }).catch(error => {
                console.error('❌ Error playing audio:', error);
            });
        }, 100);
    }
}

function skipNext() {
    if (songs.length === 0) return;
    
    const wasPlaying = isPlaying;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    
    loadCurrentSong();
    
    if (wasPlaying && audio) {
        setTimeout(() => {
            audio.play().then(() => {
                isPlaying = true;
                updatePlayButton();
                addSongItemListeners();
            }).catch(error => {
                console.error('❌ Error playing audio:', error);
            });
        }, 100);
    }
}

function playSelectedSong(index) {
    console.log('🎵 Playing selected song at index:', index);
    
    const wasPlaying = isPlaying;
    currentSongIndex = index;
    
    loadCurrentSong();
    
    setTimeout(() => {
        audio.play().then(() => {
            isPlaying = true;
            updatePlayButton();
            addSongItemListeners();
        }).catch(error => {
            console.error('❌ Error playing audio:', error);
        });
    }, 100);
}

function seekToPosition(e) {
    if (!audio) return;
    
    const rect = progressBar.getBoundingClientRect();
    let clientX;
    
    // Handle both mouse and touch events
    if (e.type === 'click') {
        clientX = e.clientX;
    } else if (e.type === 'touchend' && e.changedTouches && e.changedTouches[0]) {
        clientX = e.changedTouches[0].clientX;
    } else {
        return;
    }
    
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * audio.duration;
    
    audio.currentTime = newTime;
}

// Audio event handlers
function onAudioLoaded() {
    const totalMinutes = Math.floor(audio.duration / 60);
    const totalSeconds = Math.floor(audio.duration % 60);
    totalTimeEl.textContent = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
}

function onTimeUpdate() {
    if (!audio) return;
    
    const currentTime = audio.currentTime;
    const totalTime = audio.duration;
    
    // Update progress bar
    const progress = (currentTime / totalTime) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Update time display
    const currentMinutes = Math.floor(currentTime / 60);
    const currentSeconds = Math.floor(currentTime % 60);
    const totalMinutes = Math.floor(totalTime / 60);
    const totalSecondsRemaining = Math.floor(totalTime - currentTime);
    const remainingMinutes = Math.floor(totalSecondsRemaining / 60);
    const remainingSeconds = totalSecondsRemaining % 60;
    
    currentTimeEl.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
    totalTimeEl.textContent = `-${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function onSongEnded() {
    skipNext();
}

// LiveStreamCrop Integration
function loadEarthCamStream() {
    // This will be handled by live-stream-crop.js
    console.log('📹 LiveStreamCrop loading...');
    
    // Initialize LiveStreamCrop when song list view is shown
    if (window.liveStreamCrop) {
        console.log('✅ LiveStreamCrop already initialized');
        // Update crop settings if component exists
        window.liveStreamCrop.updateCrop(-10, -15, 1.45);
    } else {
        console.log('🔄 Waiting for LiveStreamCrop to initialize...');
        
        // Initialize LiveStreamCrop for the header image
        const headerImage = document.getElementById('header-image');
        if (headerImage) {
            console.log('🚀 Initializing LiveStreamCrop for header image');
            
            window.liveStreamCrop = new LiveStreamCrop('header-image', {
                videoId: 'GJFHpFppy2k',
                width: 425,
                height: 239,
                offsetX: 0,    // Center horizontally
                offsetY: 0,    // Center vertically
                scale: 1.2,    // Start with moderate scale
                responsive: false
            });
        }
    }
}

// Function to update LiveStreamCrop settings
function updateLiveStreamCrop(offsetX, offsetY, scale) {
    if (window.liveStreamCrop) {
        window.liveStreamCrop.updateCrop(offsetX, offsetY, scale);
        console.log(`🎯 Updated LiveStreamCrop: offsetX=${offsetX}, offsetY=${offsetY}, scale=${scale}`);
    } else {
        console.log('⚠️ LiveStreamCrop not initialized yet');
    }
}

// Function to force re-initialize LiveStreamCrop with new settings
function reinitializeLiveStreamCrop() {
    if (window.liveStreamCrop) {
        window.liveStreamCrop.destroy();
        window.liveStreamCrop = null;
    }
    
    const headerImage = document.getElementById('header-image');
    if (headerImage) {
        console.log('🔄 Re-initializing LiveStreamCrop with new settings');
        
        window.liveStreamCrop = new LiveStreamCrop('header-image', {
            videoId: 'GJFHpFppy2k',
            width: 425,
            height: 239,
            offsetX: 0,    // Center horizontally
            offsetY: 0,    // Center vertically
            scale: 1.2,    // Start with moderate scale
            responsive: false
        });
    }
}

console.log('🎵 Unified Music Player loaded');

// Debug function to test animation manually
function testAnimation() {
    console.log('🧪 Testing animation manually...');
    console.log('  - Current view:', currentView);
    console.log('  - Is transitioning:', isTransitioning);
    
    if (currentView === 'player') {
        showSongList();
    } else {
        showPlayer();
    }
}

// Make functions available globally for testing
window.testAnimation = testAnimation;
window.updateLiveStreamCrop = updateLiveStreamCrop;
window.reinitializeLiveStreamCrop = reinitializeLiveStreamCrop;
