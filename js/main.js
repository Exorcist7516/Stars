/**
 * Main Game Logic
 */
import { initAudio, startAudioSystem, duckVolume, unduckVolume } from './audio.js';
import { initSnow, initParallax } from './visuals.js';
import { initStars } from './stars.js';
import { ERROR_PHRASES } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const startScreen = document.getElementById('start-screen');
    const mainScene = document.getElementById('main-scene');

    // Audio Elements
    const bgMusic = document.getElementById('bg-music');
    const sfxQuest = document.getElementById('sfx-quest');
    const sfxLevelUp = document.getElementById('sfx-levelup');

    // UI Elements
    const questNotification = document.getElementById('quest-notification');
    const questMarkerContainer = document.getElementById('quest-marker-container');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeBtnUi = document.getElementById('close-btn-ui');
    const audioControlsUi = document.getElementById('audio-controls-ui');
    const audioToggle = document.getElementById('audio-toggle');
    const volumeSlider = document.getElementById('volume-slider');

    const musicSelector = document.getElementById('music-selector');

    // Password Elements
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordCancel = document.getElementById('password-cancel');
    const passwordError = document.getElementById('password-error');

    // --- State ---
    let isStarted = false;
    let isModalOpen = false;
    let isPasswordCorrect = false;
    let hasTriggeredLevelUp = false;

    // --- Initialize Modules ---
    initSnow('snow', () => isStarted);
    initAudio(bgMusic, audioToggle, volumeSlider, musicSelector);
    initStars('stars-container');

    // Initialize Parallax (only runs when isStarted is true)
    initParallax(mainScene, () => isStarted);

    // --- Game Logic ---

    /**
     * Shows quest notification with specific text and sound
     */
    function showNotification(title, desc, sfx, duration = 5000, volume = 0.4) {
        const titleEl = questNotification.querySelector('.quest-title');
        const descEl = questNotification.querySelector('.quest-desc');

        titleEl.textContent = title;
        descEl.textContent = desc;

        // Reset animation
        questNotification.classList.remove('show');
        questNotification.style.opacity = '1';
        void questNotification.offsetWidth; // Force reflow
        questNotification.classList.add('show');

        if (sfx) {
            sfx.volume = volume;
            sfx.play().catch(e => console.warn("SFX play failed:", e));
        }

        // Hide after delay
        setTimeout(() => {
            questNotification.style.opacity = '0';
        }, duration);
    }

    // 1. Start Interaction
    function startGame() {
        if (isStarted) return;
        isStarted = true;

        // Hide start screen
        startScreen.style.opacity = '0';
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 1000);

        // Show main scene
        mainScene.classList.add('active');

        // Start Audio System
        startAudioSystem();

        // Show controls
        audioControlsUi.style.opacity = '0.7';
        audioControlsUi.style.pointerEvents = 'auto';

        // Play Quest Update Sound after a short delay
        setTimeout(() => {
            showNotification("НОВОЕ ЗАДАНИЕ", "Прочесть Древний Свиток", sfxQuest);
        }, 1000);
    }

    // Listen for any key or click to start
    document.addEventListener('keydown', (e) => {
        if (!isStarted) startGame();
    });
    startScreen.addEventListener('click', startGame);

    // 2. Quest Marker Interaction
    function checkPassword() {
        if (passwordInput.value.toLowerCase() === 'niktoneznaetbeina') {
            isPasswordCorrect = true;
            passwordModal.classList.remove('open');
            // isModalOpen remains true, immediately opening scroll
            openScroll();
        } else {
            const randomPhrase = ERROR_PHRASES[Math.floor(Math.random() * ERROR_PHRASES.length)];
            passwordError.textContent = randomPhrase;
            passwordError.classList.add('show');
            setTimeout(() => passwordError.classList.remove('show'), 10000);
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    function openScroll() {
        if (!isStarted) return;

        // If modal is already open, do nothing (unless switching from password to scroll, handled internally)
        if (isModalOpen && !isPasswordCorrect && passwordModal.classList.contains('open')) return;

        isModalOpen = true;

        if (!isPasswordCorrect) {
            passwordModal.classList.add('open');
            passwordInput.focus();
            return;
        }

        modalOverlay.classList.add('open');

        // Play paper sound if available
        const sfxPaper = document.getElementById('sfx-paper');
        if (sfxPaper) {
            sfxPaper.volume = 0.6;
            sfxPaper.currentTime = 0;
            sfxPaper.play().catch(e => console.warn("Paper SFX failed:", e));
        }
    }

    function closeScroll() {
        if (!isModalOpen) return;

        // Check if we are closing the scroll itself
        const wasScrollVisible = modalOverlay.classList.contains('open');

        isModalOpen = false;
        modalOverlay.classList.remove('open');
        passwordModal.classList.remove('open');

        // Trigger Level Up once after first scroll closure
        if (wasScrollVisible && !hasTriggeredLevelUp) {
            hasTriggeredLevelUp = true;
            setTimeout(() => {
                duckVolume();
                showNotification("ЗАДАНИЕ ЗАВЕРШЕНО", "Ты самая хитрая, Юна-тан.", sfxLevelUp, 20000, 0.3); // Quieter level up (0.3)

                // Unduck when sound ends
                if (sfxLevelUp) {
                    sfxLevelUp.onended = () => {
                        unduckVolume();
                    };
                } else {
                    // Fallback if sound missing
                    setTimeout(unduckVolume, 4000);
                }
            }, 500);
        }
    }

    questMarkerContainer.addEventListener('click', openScroll);

    // Password Listeners
    passwordSubmit.addEventListener('click', checkPassword);
    passwordCancel.addEventListener('click', closeScroll);
    passwordInput.addEventListener('keydown', (e) => {
        e.stopPropagation(); // Prevent triggering other keys
        if (e.key === 'Enter') checkPassword();
        if (e.key === 'Escape') closeScroll();
    });
    closeBtnUi.addEventListener('click', (e) => {
        e.stopPropagation();
        closeScroll();
    });

    // 3. Keyboard Controls
    document.addEventListener('keydown', (e) => {
        if (!isStarted) return;

        // 'E' to open
        if (e.key.toLowerCase() === 'e' && !isModalOpen) {
            openScroll();
        }

        // 'Tab' or 'Escape' to close
        if ((e.key === 'Tab' || e.key === 'Escape') && isModalOpen) {
            e.preventDefault(); // Prevent default Tab focus switch
            closeScroll();
        }
    });

    // Mobile specific: Prevent tap zoom if needed (optional)
});
