// Music Player JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const playBtn = document.querySelector('.play-btn');
    const previousBtn = document.querySelector('.previous-btn');
    const nextBtn = document.querySelector('.next-btn');
    const listBtn = document.querySelector('.list-btn');
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const currentTimeEl = document.querySelector('.current-time');
    const totalTimeEl = document.querySelector('.total-time');
    const trackTitle = document.querySelector('.track-title');
    const trackTime = document.querySelector('.track-time');
    
    // Audio element
    let audio = null;
    
    // Player state
    let isPlaying = false;
    let currentSongIndex = 0;
    let songs = [];
    
    // Google Sheets configuration
    const GOOGLE_SHEET_ID = '1w_Yrcv_VH8rALORHWaUZ6PAYns7WQY3-hPsAjwJmEEI';
    const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=0`;
    
    // Load song data from Google Sheets first, fallback to local
    async function loadSongs() {
        try {
            console.log('Loading song data from Google Sheets...');
            const response = await fetch(GOOGLE_SHEET_CSV_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvData = await response.text();
            console.log('CSV data received:', csvData);
            
            // Parse CSV data and filter for songs with audio files
            songs = parseCSVData(csvData);
            console.log('Parsed songs:', songs);
            
            checkForSongSelection();
            loadCurrentSong();
        } catch (error) {
            console.error('Error loading songs from Google Sheets:', error);
            // Fallback to local data
            loadFallbackData();
        }
    }
    
    // Parse CSV data (format: Title, Artist, Time, Date, FilePath)
    function parseCSVData(csvData) {
        const lines = csvData.trim().split('\n');
        const songsData = [];
        
        // Process each line
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                const columns = parseCSVLine(trimmedLine);
                
                if (columns.length >= 5) {
                    const filePath = columns[4] || '';
                    
                    // Only include songs that have a file path specified
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
                } else if (columns.length >= 4) {
                    // Fallback for old format without file paths - try to guess
                    const songTitle = columns[0] || 'Unknown Title';
                    let filePath = '';
                    
                    // Legacy mapping for backwards compatibility
                    const legacyMapping = {
                        'BAILE INoLVIDABLE': 'music/Baile Inolvidable- Bad Bunny.m4a',
                        'Chains & Whips': 'music/Chains Whips- Clipse Kendrick Lamar Pusha T Malice.m4a',
                        'Volare': 'music/Volare nel Blu Di Pinto Di Blu- Dean Martin.m4a'
                    };
                    
                    if (legacyMapping[songTitle]) {
                        filePath = legacyMapping[songTitle];
                        songsData.push({
                            id: index + 1,
                            title: songTitle,
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
    
    // Fallback function to load local data
    async function loadFallbackData() {
        try {
            console.log('Loading fallback data from local JSON...');
            const response = await fetch('data/songs.json');
            const data = await response.json();
            
            // Filter songs to only include those with file paths
            songs = data.songs.filter(song => song.filePath);
            console.log('Filtered local songs:', songs);
            
            checkForSongSelection();
            loadCurrentSong();
        } catch (error) {
            console.error('Error loading fallback data:', error);
            // Last resort - use default songs with audio files
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
            
            checkForSongSelection();
            loadCurrentSong();
        }
    }
    
    // Load current song
    function loadCurrentSong() {
        if (songs.length === 0) return;
        
        const currentSong = songs[currentSongIndex];
        console.log('Loading song at index:', currentSongIndex, 'Song:', currentSong);
        const songFile = currentSong.filePath;
        console.log('Song file path:', songFile);
        
        // Create new audio element
        if (audio) {
            audio.pause();
            audio.removeEventListener('loadedmetadata', onAudioLoaded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onSongEnded);
        }
        
        if (songFile) {
            audio = new Audio(songFile);
            audio.addEventListener('loadedmetadata', onAudioLoaded);
            audio.addEventListener('timeupdate', onTimeUpdate);
            audio.addEventListener('ended', onSongEnded);
        } else {
            console.log('No song file found for:', currentSong.title);
            audio = null;
        }
        
        // Update UI with song info
        updateTrackInfo();
        
        // Reset progress and play state
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        totalTimeEl.textContent = '0:00';
        isPlaying = false;
        updatePlayButton();
    }
    
    // Update track info display
    function updateTrackInfo() {
        if (songs.length === 0) return;
        
        const currentSong = songs[currentSongIndex];
        trackTitle.textContent = `${currentSong.artist} — ${currentSong.title}`;
        trackTime.textContent = `${currentSong.time}, ${currentSong.date}`;
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
        // Auto-advance to next song and continue playing
        skipNext();
    }
    
    // Update play button appearance
    function updatePlayButton() {
        if (isPlaying) {
            // Pause icon from Figma
            playBtn.innerHTML = `
                <img src="http://localhost:3845/assets/02ffbe30d55b681ebda4d04fcb7fbedb855adf88.svg" alt="Pause" style="width: 24px; height: 30px;">
            `;
        } else {
            // Play icon from Figma
            playBtn.innerHTML = `
                <img src="http://localhost:3845/assets/9b3edc55cc411a667155c00cde51641c04ab5bfb.svg" alt="Play" style="width: 24px; height: 30px;">
            `;
        }
    }
    
    // Toggle play/pause
    function togglePlay() {
        if (!audio) return;
        
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
            });
            isPlaying = true;
        }
        
        updatePlayButton();
    }
    
    // Skip to previous track
    function skipPrevious() {
        if (songs.length === 0) return;
        
        const wasPlaying = isPlaying;
        console.log('Before skip previous - currentSongIndex:', currentSongIndex, 'songs.length:', songs.length);
        currentSongIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
        console.log('After skip previous - currentSongIndex:', currentSongIndex);
        
        loadCurrentSong(); // Load without autoplay
        
        // Then start playing if we were playing before
        if (wasPlaying && audio) {
            setTimeout(() => {
                audio.play().then(() => {
                    isPlaying = true;
                    updatePlayButton();
                }).catch(error => {
                    console.error('Error playing audio:', error);
                });
            }, 100);
        }
    }
    
    // Skip to next track
    function skipNext() {
        if (songs.length === 0) return;
        
        const wasPlaying = isPlaying;
        console.log('Before skip next - currentSongIndex:', currentSongIndex, 'songs.length:', songs.length);
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        console.log('After skip next - currentSongIndex:', currentSongIndex);
        
        loadCurrentSong(); // Load without autoplay
        
        // Then start playing if we were playing before
        if (wasPlaying && audio) {
            setTimeout(() => {
                audio.play().then(() => {
                    isPlaying = true;
                    updatePlayButton();
                }).catch(error => {
                    console.error('Error playing audio:', error);
                });
            }, 100);
        }
    }
    
    // Click on progress bar to seek
    function seekToPosition(e) {
        if (!audio) return;
        
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audio.currentTime = percentage * audio.duration;
    }
    
    // Event listeners
    playBtn.addEventListener('click', togglePlay);
    previousBtn.addEventListener('click', skipPrevious);
    nextBtn.addEventListener('click', skipNext);
    progressBar.addEventListener('click', seekToPosition);
    
    // List button functionality with transition
    listBtn.addEventListener('click', function() {
        // Store current music state for continuous playback
        const musicState = {
            currentSongIndex: currentSongIndex,
            isPlaying: isPlaying,
            currentTime: audio ? audio.currentTime : 0,
            songs: songs
        };
        localStorage.setItem('musicState', JSON.stringify(musicState));
        
        // Create overlay for smooth transition
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = '#00724d';
        overlay.style.zIndex = '9999';
        overlay.style.transform = 'translateY(100vh)';
        overlay.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        document.body.appendChild(overlay);
        
        // Trigger slide-up animation
        setTimeout(() => {
            overlay.style.transform = 'translateY(0)';
        }, 100);
        
        // Navigate to song list page after animation
        setTimeout(() => {
            window.location.href = 'song-list.html';
        }, 800);
    });
    
    // Initialize the player
    restoreMusicState();
    loadSongs();
    
    // Function to check for song selection from localStorage
    function checkForSongSelection() {
        const selectedIndex = localStorage.getItem('selectedSongIndex');
        if (selectedIndex !== null) {
            currentSongIndex = parseInt(selectedIndex);
            localStorage.removeItem('selectedSongIndex');
            if (songs.length > 0) {
                loadCurrentSong();
            }
        }
    }
    
    // Function to restore music state for continuous playback
    function restoreMusicState() {
        const musicState = localStorage.getItem('musicState');
        if (musicState) {
            try {
                const state = JSON.parse(musicState);
                if (state.songs && state.songs.length > 0) {
                    songs = state.songs;
                    currentSongIndex = state.currentSongIndex || 0;
                    
                    loadCurrentSong();
                    
                    // Resume playback if it was playing
                    if (state.isPlaying && audio) {
                        setTimeout(() => {
                            audio.currentTime = state.currentTime || 0;
                            audio.play().then(() => {
                                isPlaying = true;
                                updatePlayButton();
                            }).catch(error => {
                                console.error('Error resuming audio:', error);
                            });
                        }, 100);
                    }
                }
            } catch (error) {
                console.error('Error restoring music state:', error);
            }
            localStorage.removeItem('musicState');
        }
    }
    
    // Add keyboard controls
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
        }
    });
    
    // Add smooth animations for progress bar
    progressFill.style.transition = 'width 0.1s ease-out';
    
    // Add loading animation for images
    const images = document.querySelectorAll('[style*="background-image"]');
    images.forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in';
        
        // Simulate image loading
        setTimeout(() => {
            img.style.opacity = '1';
        }, Math.random() * 1000);
    });
});