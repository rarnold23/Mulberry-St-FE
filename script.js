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
    
    // Player state
    let isPlaying = false;
    let currentTime = 155; // 2:35 in seconds
    let totalTime = 201; // 3:21 in seconds
    let progressInterval;
    
    // Update progress bar
    function updateProgress() {
        const progress = (currentTime / totalTime) * 100;
        progressFill.style.width = `${progress}%`;
        
        // Update time display
        const currentMinutes = Math.floor(currentTime / 60);
        const currentSeconds = currentTime % 60;
        const totalMinutes = Math.floor(totalTime / 60);
        const totalSeconds = totalTime % 60;
        
        currentTimeEl.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
        totalTimeEl.textContent = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
    }
    
    // Toggle play/pause
    function togglePlay() {
        isPlaying = !isPlaying;
        
        if (isPlaying) {
            // Change play button to pause
            playBtn.innerHTML = `
                <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
                    <rect x="6" y="5" width="4" height="20" fill="white"/>
                    <rect x="14" y="5" width="4" height="20" fill="white"/>
                </svg>
            `;
            
            // Start progress timer
            progressInterval = setInterval(() => {
                if (currentTime < totalTime) {
                    currentTime++;
                    updateProgress();
                } else {
                    // Song finished
                    isPlaying = false;
                    clearInterval(progressInterval);
                    playBtn.innerHTML = `
                        <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
                            <path d="M8 5L19 15L8 25V5Z" fill="white"/>
                        </svg>
                    `;
                }
            }, 1000);
        } else {
            // Change pause button to play
            playBtn.innerHTML = `
                <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
                    <path d="M8 5L19 15L8 25V5Z" fill="white"/>
                </svg>
            `;
            
            // Stop progress timer
            clearInterval(progressInterval);
        }
    }
    
    // Skip to previous
    function skipPrevious() {
        currentTime = Math.max(0, currentTime - 10);
        updateProgress();
    }
    
    // Skip to next
    function skipNext() {
        currentTime = Math.min(totalTime, currentTime + 10);
        updateProgress();
    }
    
    // Click on progress bar to seek
    function seekToPosition(e) {
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        currentTime = Math.floor(percentage * totalTime);
        updateProgress();
    }
    
    // Event listeners
    playBtn.addEventListener('click', togglePlay);
    previousBtn.addEventListener('click', skipPrevious);
    nextBtn.addEventListener('click', skipNext);
    progressBar.addEventListener('click', seekToPosition);
    
    // List button functionality (placeholder)
    listBtn.addEventListener('click', function() {
        console.log('Playlist button clicked');
        // Add playlist functionality here
    });
    
    // Initialize progress
    updateProgress();
    
    // Add hover effects for better UX
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
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
