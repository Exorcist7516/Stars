/**
 * Stars Logic
 * Handles interactive stars on the background
 */
import { duckVolume, unduckVolume } from './audio.js';
import { STARS_CONFIG } from './config.js';

let starContainer;
let starModal;
let starModalText;
let starModalLinkContainer;
let starModalClose;
let currentAudio = null;

export function initStars(containerId) {
    starContainer = document.getElementById(containerId);
    if (!starContainer) return;

    // Cache Modal Elements
    starModal = document.getElementById('star-modal-overlay');
    starModalText = document.getElementById('star-modal-text');
    starModalLinkContainer = document.getElementById('star-modal-link-container');
    starModalClose = document.getElementById('star-modal-close');

    if (starModalClose) {
        starModalClose.addEventListener('click', closeStarModal);
    }

    if (starModal) {
        starModal.addEventListener('click', (e) => {
            if (e.target === starModal) closeStarModal();
        });
    }

    // Render Stars
    STARS_CONFIG.forEach(star => {
        const starEl = document.createElement('div');
        starEl.classList.add('star-marker');
        starEl.style.left = star.x;
        starEl.style.top = star.y;
        starEl.title = "Нажми";

        if (star.opacity !== undefined) {
            starEl.style.opacity = star.opacity;
        }

        starEl.addEventListener('click', (e) => {
            e.stopPropagation();
            openStarMessage(star);
        });

        starContainer.appendChild(starEl);
    });
}

function openStarMessage(starData) {
    if (!starModal || !starModalText || !starModalLinkContainer) return;

    // Set Text
    starModalText.textContent = starData.message;

    // Handle Link
    starModalLinkContainer.innerHTML = ''; // Safe because we control the link content
    if (starData.link) {
        const linkEl = document.createElement('div');
        linkEl.className = 'star-modal-link';
        const a = document.createElement('a');
        a.href = starData.link;
        a.target = '_blank';
        a.className = 'star-btn';
        a.textContent = 'Обнажить';
        linkEl.appendChild(a);
        starModalLinkContainer.appendChild(linkEl);
    }

    starModal.classList.add('open');

    // Play Audio if exists
    if (starData.audio) {
        duckVolume(); // Lower background music

        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        currentAudio = new Audio(starData.audio);
        currentAudio.volume = 0.8;
        currentAudio.play().catch(e => console.warn("Star audio failed:", e));
    }
}

function closeStarModal() {
    if (starModal) starModal.classList.remove('open');
    unduckVolume(); // Restore background music

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}
