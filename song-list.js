// Song List Page JavaScript

// Global goBack function for navigation
function goBack() {
    const greenBackground = document.querySelector('.green-background');
    const contentContainer = document.querySelector('.content-container');
    
    // Remove animation classes
    greenBackground.classList.remove('slide-up');
    contentContainer.classList.remove('fade-in');
    
    // Wait for animation to complete, then navigate back
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const greenBackground = document.querySelector('.green-background');
    const contentContainer = document.querySelector('.content-container');
    const backBtn = document.querySelector('.back-btn');
    
    // Start the transition animation
    function startTransition() {
        // Trigger the green background slide-up
        setTimeout(() => {
            greenBackground.classList.add('slide-up');
        }, 100);
        
        // Trigger the content fade-in after the background animation
        setTimeout(() => {
            contentContainer.classList.add('fade-in');
        }, 500);
    }
    
    // Event listeners
    backBtn.addEventListener('click', goBack);
    
    // Add keyboard support for back navigation
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Escape' || e.code === 'Backspace') {
            e.preventDefault();
            goBack();
        }
    });
    
    // Start the transition when page loads
    startTransition();
    
    // Load and continue background music
    loadBackgroundMusic();
    
    // Load song data from Google Sheets
    loadSongData();
    
    // Add smooth loading for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in';
        
        // Simulate image loading
        setTimeout(() => {
            img.style.opacity = '1';
        }, Math.random() * 1000 + 600);
    });
});

// Google Sheets configuration
const GOOGLE_SHEET_ID = '1w_Yrcv_VH8rALORHWaUZ6PAYns7WQY3-hPsAjwJmEEI';
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=0`;

// Function to load song data from Google Sheets
async function loadSongData() {
    try {
        console.log('Loading song data from Google Sheets...');
        
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
        console.log('CSV data received:', csvData);
        
        // Parse CSV data
        const songs = parseCSVData(csvData);
        console.log('Parsed songs:', songs);
        
        // Populate the song list
        populateSongList(songs);
        
    } catch (error) {
        console.error('Error loading song data:', error);
        // Fallback to local data if Google Sheets fails
        loadFallbackData();
    }
}

// Function to parse CSV data (format: Title, Artist, Time, Date, FilePath)
function parseCSVData(csvData) {
    const lines = csvData.trim().split('\n');
    const songs = [];
    
    // Process each line
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
            const columns = parseCSVLine(trimmedLine);
            
            if (columns.length >= 5) {
                // New format with file path
                songs.push({
                    id: index + 1,
                    title: columns[0] || 'Unknown Title',
                    artist: columns[1] || 'Unknown Artist', 
                    time: columns[2] || '',
                    date: columns[3] || '',
                    filePath: columns[4] || ''
                });
            } else if (columns.length >= 4) {
                // Legacy format - try to map file paths
                const title = columns[0] || 'Unknown Title';
                let filePath = '';
                
                // Legacy mapping
                const legacyMapping = {
                    'BAILE INoLVIDABLE': 'music/Baile Inolvidable- Bad Bunny.m4a',
                    'Chains & Whips': 'music/Chains Whips- Clipse Kendrick Lamar Pusha T Malice.m4a',
                    'Volare': 'music/Volare nel Blu Di Pinto Di Blu- Dean Martin.m4a'
                };
                
                filePath = legacyMapping[title] || '';
                
                songs.push({
                    id: index + 1,
                    title: title,
                    artist: columns[1] || 'Unknown Artist', 
                    time: columns[2] || '',
                    date: columns[3] || '',
                    filePath: filePath
                });
            }
        }
    });
    
    return songs;
}

// Simple CSV line parser that handles quoted fields
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

// Function to populate the song list in the DOM
function populateSongList(songs) {
    const songListContainer = document.getElementById('songList');
    
    if (!songListContainer) {
        console.error('Song list container not found');
        return;
    }
    
    // Store songs globally for music state
    window.currentSongs = songs;
    
    // Clear existing content
    songListContainer.innerHTML = '';
    
    songs.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.setAttribute('data-song-id', song.id);
        
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
    
    // Add event listeners for the newly created song items
    addSongItemListeners();
}

// Function to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global variables for music state
let currentMusicState = null;
let backgroundAudio = null;

// Function to load and continue background music
function loadBackgroundMusic() {
    const musicState = localStorage.getItem('musicState');
    if (musicState) {
        try {
            currentMusicState = JSON.parse(musicState);
            if (currentMusicState.isPlaying && currentMusicState.songs && currentMusicState.songs.length > 0) {
                const currentSong = currentMusicState.songs[currentMusicState.currentSongIndex];
                if (currentSong && currentSong.filePath) {
                    backgroundAudio = new Audio(currentSong.filePath);
                    backgroundAudio.currentTime = currentMusicState.currentTime || 0;
                    backgroundAudio.play().catch(error => {
                        console.error('Error playing background audio:', error);
                    });
                    
                    // Update current time in state
                    backgroundAudio.addEventListener('timeupdate', () => {
                        if (currentMusicState) {
                            currentMusicState.currentTime = backgroundAudio.currentTime;
                            localStorage.setItem('musicState', JSON.stringify(currentMusicState));
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading background music:', error);
        }
    }
}

// Function to add event listeners to song items
function addSongItemListeners() {
    const songItems = document.querySelectorAll('.song-item');
    
    songItems.forEach((item, index) => {
        const songNumber = item.querySelector('.song-number');
        const playButton = item.querySelector('.play-button');
        
        // Check if this is the currently playing song
        if (currentMusicState && currentMusicState.currentSongIndex === index && currentMusicState.isPlaying) {
            // Replace track number with pause button - create SVG inline
            songNumber.innerHTML = `
                <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 15px; height: 18px;">
                    <rect x="3" y="2" width="3" height="14" fill="white"/>
                    <rect x="9" y="2" width="3" height="14" fill="white"/>
                </svg>
            `;
            songNumber.classList.add('playing');
            songNumber.style.cursor = 'pointer';
            
            // Add pause functionality
            songNumber.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                pauseCurrentSong(index);
            });
        } else {
            // Add hover functionality for play button
            item.addEventListener('mouseenter', function() {
                if (playButton) {
                    playButton.style.opacity = '1';
                }
            });
            
            item.addEventListener('mouseleave', function() {
                if (playButton) {
                    playButton.style.opacity = '0';
                }
            });
            
            // Add play functionality
            if (playButton) {
                playButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    playSelectedSong(index);
                });
            }
        }
        
        // Explicitly prevent any clicks on the song item itself
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Song item clicked - preventing default behavior');
            return false;
        });
    });
}

// Function to pause the currently playing song
function pauseCurrentSong(index) {
    if (backgroundAudio) {
        backgroundAudio.pause();
    }
    
    // Update the music state
    if (currentMusicState) {
        currentMusicState.isPlaying = false;
        localStorage.setItem('musicState', JSON.stringify(currentMusicState));
        
        // Update UI - restore track number and re-add hover functionality
        const currentSongItem = document.querySelector(`[data-song-id="${index + 1}"]`);
        if (currentSongItem) {
            const songNumber = currentSongItem.querySelector('.song-number');
            const playButton = currentSongItem.querySelector('.play-button');
            
            // Reset to track number
            songNumber.innerHTML = `
                <span class="track-number">${index + 1}</span>
                <div class="play-button"></div>
            `;
            songNumber.classList.remove('playing');
            songNumber.style.cursor = 'default';
            
            // Re-add hover functionality
            const newPlayButton = songNumber.querySelector('.play-button');
            if (newPlayButton) {
                currentSongItem.addEventListener('mouseenter', function() {
                    newPlayButton.style.opacity = '1';
                });
                
                currentSongItem.addEventListener('mouseleave', function() {
                    newPlayButton.style.opacity = '0';
                });
                
                newPlayButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    playSelectedSong(index);
                });
            }
        }
    }
}

// Function to play a selected song
function playSelectedSong(index) {
    console.log('Playing song at index:', index, 'Songs:', window.currentSongs);
    
    if (!window.currentSongs || window.currentSongs.length === 0) {
        console.error('No songs available to play');
        return;
    }
    
    if (index >= window.currentSongs.length) {
        console.error('Song index out of range:', index, 'max:', window.currentSongs.length - 1);
        return;
    }
    
    const selectedSong = window.currentSongs[index];
    
    // Determine if this is the same song that was previously playing/paused
    const isSameSong = currentMusicState && 
                      currentMusicState.currentSongIndex === index && 
                      currentMusicState.songs && 
                      currentMusicState.songs.length > 0;
    
    // Get the resume time (either from current state or start from beginning)
    const resumeTime = isSameSong ? (currentMusicState.currentTime || 0) : 0;
    
    // Stop background audio if playing
    if (backgroundAudio) {
        backgroundAudio.pause();
        backgroundAudio = null;
    }
    
    // Create new audio for the selected song and start playing immediately
    if (selectedSong.filePath) {
        backgroundAudio = new Audio(selectedSong.filePath);
        
        // Set the resume time once the audio metadata is loaded
        backgroundAudio.addEventListener('loadedmetadata', function() {
            backgroundAudio.currentTime = resumeTime;
            console.log('Resuming from time:', resumeTime);
        });
        
        // Play the audio immediately
        backgroundAudio.play().then(() => {
            console.log('Successfully started playing:', selectedSong.title, 'from time:', resumeTime);
        }).catch(error => {
            console.error('Error playing audio:', error);
        });
        
        // Update currentTime in localStorage as the song plays
        backgroundAudio.addEventListener('timeupdate', function() {
            if (currentMusicState) {
                currentMusicState.currentTime = backgroundAudio.currentTime;
                localStorage.setItem('musicState', JSON.stringify(currentMusicState));
            }
        });
    }
    
    // Update music state
    currentMusicState = {
        currentSongIndex: index,
        isPlaying: true,
        currentTime: resumeTime,
        songs: window.currentSongs
    };
    localStorage.setItem('musicState', JSON.stringify(currentMusicState));
    localStorage.setItem('selectedSongIndex', index.toString());
    
    // Update the UI to reflect the currently playing song
    // populateSongList(window.currentSongs); // Removed to prevent duplicate event listeners
}

// Fallback function to load local data if Google Sheets fails
async function loadFallbackData() {
    try {
        console.log('Loading fallback data from local JSON...');
        const response = await fetch('data/songs.json');
        const data = await response.json();
        populateSongList(data.songs);
    } catch (error) {
        console.error('Error loading fallback data:', error);
        // Show error message to user
        showErrorMessage('Unable to load song data. Please try again later.');
    }
}

// Function to show error message
function showErrorMessage(message) {
    const songListContainer = document.getElementById('songList');
    if (songListContainer) {
        songListContainer.innerHTML = `
            <div style="color: white; text-align: center; padding: 40px; font-family: 'Bastardo Grotesk', sans-serif;">
                <p>${message}</p>
            </div>
        `;
    }
} 