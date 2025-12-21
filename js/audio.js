/**
 * Audio Module
 * Handles Background Music, Shuffle, and Volume
 */
import { PLAYLIST } from './config.js';

let bgMusic;
let audioToggle;
let volumeSlider;
let musicSelector;

// Helper to format name
function formatName(path) {
    const filename = path.split('/').pop().replace('.mp3', '');
    return filename.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function initAudio(musicEl, toggleEl, sliderEl, selectorEl) {
    bgMusic = musicEl;
    audioToggle = toggleEl;
    volumeSlider = sliderEl;
    musicSelector = selectorEl;

    // Remove loop attribute to enable shuffle (ended event)
    bgMusic.loop = false;

    // 1. Play/Pause Toggle
    audioToggle.addEventListener('click', () => {
        if (bgMusic.paused) {
            bgMusic.play().catch(e => console.warn("Manual audio play failed:", e));
            audioToggle.innerHTML = "||";
        } else {
            bgMusic.pause();
            audioToggle.innerHTML = "&#9658;"; // Play symbol
        }
    });

    // 2. Volume Slider
    volumeSlider.addEventListener('input', (e) => {
        bgMusic.volume = e.target.value;
    });

    // 3. Shuffle Logic
    bgMusic.addEventListener('ended', playNextTrack);

    // 4. Music Selector Logic
    if (musicSelector) {
        // Populate options
        PLAYLIST.forEach(track => {
            const option = document.createElement('option');
            option.value = track;
            option.textContent = formatName(track);
            musicSelector.appendChild(option);
        });

        // Set initial value
        const initialMatch = PLAYLIST.find(p => bgMusic.src.includes(p));
        if (initialMatch) musicSelector.value = initialMatch;

        // Handle user selection
        musicSelector.addEventListener('change', (e) => {
            bgMusic.src = e.target.value;
            bgMusic.play()
                .then(() => audioToggle.innerHTML = "||")
                .catch(e => console.warn("Selection play failed:", e));
        });

        // Sync selector when track changes automatically
        bgMusic.addEventListener('play', () => {
            const currentPath = PLAYLIST.find(p => bgMusic.src.includes(p));
            if (currentPath) musicSelector.value = currentPath;
        });
    }
}

function playNextTrack() {
    if (PLAYLIST.length <= 1) {
        // If only one track, just play it again
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.warn("Repeat track failed:", e));
        return;
    }

    // Pick a random track different from current if possible
    // (Assuming current src ends with the filename)
    let currentSrc = bgMusic.src;
    let nextTrack;

    do {
        const randomIndex = Math.floor(Math.random() * PLAYLIST.length);
        nextTrack = PLAYLIST[randomIndex];
    } while (currentSrc.includes(nextTrack) && PLAYLIST.length > 1);

    bgMusic.src = nextTrack;
    bgMusic.play()
        .then(() => {
            audioToggle.innerHTML = "||";
        })
        .catch(e => console.warn("Shuffle play failed:", e));
}

export function startAudioSystem() {
    // Initial start
    bgMusic.volume = volumeSlider.value;
    bgMusic.play().then(() => {
        audioToggle.innerHTML = "||";
    }).catch(e => {
        console.warn("Initial audio play failed (autoplay policy?):", e);
        audioToggle.innerHTML = "&#9658;";
    });
}

/**
 * Lowers background music volume for ducking (e.g., when SFX/Star audio plays)
 */
export function duckVolume() {
    if (!bgMusic) return;
    bgMusic.volume = volumeSlider.value * 0.2;
}

/**
 * Restores background music volume to the level set on the slider
 */
export function unduckVolume() {
    if (!bgMusic) return;
    bgMusic.volume = volumeSlider.value;
}
