/**
 * Stars Logic
 * Handles interactive stars on the background
 */
import { duckVolume, unduckVolume, pauseBackgroundMusic, resumeBackgroundMusic } from './audio.js';
import { STARS_CONFIG } from './config.js';

let starContainer;
let starModal;
let starModalText;
let starModalLinkContainer;
let starModalClose;
let currentAudio = null;

// Secrets Counter State
let secretsCount = 3;
let hasStartedSecretCounter = false;
let isWarningModalOpen = false;
let counterEl;
let warningModal;
let warningModalClose;
let interventionModal;
let interventionContent; // Added this
let interventionText;
let interventionNextBtn;
let clickCountAfterQuestionMark = 0;
let isInterventionActive = false;
let currentInterventionStep = 0;
let isCounterPermanentlyHidden = false;
let inactivityTimer = null; // Timer for fading out counter

export function initStars(containerId) {
    starContainer = document.getElementById(containerId);
    if (!starContainer) return;

    // Cache Modal Elements
    starModal = document.getElementById('star-modal-overlay');
    starModalText = document.getElementById('star-modal-text');
    starModalLinkContainer = document.getElementById('star-modal-link-container');
    starModalClose = document.getElementById('star-modal-close');

    counterEl = document.getElementById('cursor-counter');
    warningModal = document.getElementById('warning-modal-overlay');
    warningModalClose = document.getElementById('warning-modal-close');
    interventionModal = document.getElementById('intervention-modal-overlay');
    interventionContent = document.querySelector('.intervention-modal-content'); // Cache content
    interventionText = document.getElementById('intervention-text-content');
    interventionNextBtn = document.getElementById('intervention-modal-next');

    if (starModalClose) {
        starModalClose.addEventListener('click', closeStarModal);
    }

    if (warningModalClose) {
        warningModalClose.addEventListener('click', () => {
            warningModal.classList.remove('open');
            isWarningModalOpen = false;
        });
    }

    if (interventionNextBtn) {
        interventionNextBtn.addEventListener('click', handleInterventionNext);
    }

    // Follow cursor
    document.addEventListener('mousemove', (e) => {
        if (counterEl && hasStartedSecretCounter) {
            counterEl.style.left = e.clientX + 'px';
            counterEl.style.top = e.clientY + 'px';
        }
    });

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
    if (!starModal || !starModalText || !starModalLinkContainer || isWarningModalOpen || isInterventionActive) return;

    // Secret Counter Logic
    if (!isCounterPermanentlyHidden) {
        if (!hasStartedSecretCounter) {
            hasStartedSecretCounter = true;
            updateCounterUI();
        } else {
            if (secretsCount === 3) {
                secretsCount = 2;
                updateCounterUI();
            } else if (secretsCount === 2) {
                secretsCount = 1;
                updateCounterUI();
                if (warningModal) {
                    warningModal.classList.add('open');
                    isWarningModalOpen = true;
                }
            } else if (secretsCount === 1) {
                secretsCount = '?';
                updateCounterUI();
            } else if (secretsCount === '?') {
                clickCountAfterQuestionMark++;
                if (clickCountAfterQuestionMark === 2) {
                    startIntervention();
                    return; // Don't open the star modal when intervention starts
                }
                updateCounterUI(); // Reset inactivity timer even in ? state
            }
        }
    }

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

function updateCounterUI() {
    if (!counterEl) return;

    if (secretsCount === '?') {
        counterEl.textContent = "Осталось ? тайн.";
    } else {
        let text = `Осталось ${secretsCount} тайны.`;
        if (secretsCount === 1) text = `Осталась ${secretsCount} тайна.`;
        counterEl.textContent = text;
    }

    // Reset inactivity timer
    counterEl.style.opacity = 1;
    resetInactivityTimer();
}

function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }

    inactivityTimer = setTimeout(() => {
        if (counterEl) {
            counterEl.style.opacity = 0;
        }
    }, 10000); // 10 seconds
}

function startIntervention() {
    isInterventionActive = true;
    currentInterventionStep = 1;
    showInterventionStep();

    // Pause background music
    pauseBackgroundMusic();

    if (interventionModal) {
        interventionModal.classList.add('open');
    }
}

function playInterventionSFX() {
    // Using glitch.wav as requested
    const crackle = new Audio('assets/audio/glitch.wav');
    crackle.volume = 0.5;
    crackle.play().catch(e => console.warn("Intervention SFX failed:", e));
}

function showInterventionStep() {
    if (!interventionText || !interventionNextBtn || !interventionContent) return;

    // Remove previous modes
    interventionContent.classList.remove('divine-mode', 'void-mode');

    if (currentInterventionStep === 1 || currentInterventionStep === 2) {
        interventionContent.classList.add('divine-mode');
        if (currentInterventionStep === 1) {
            interventionText.innerHTML = "СБОЙ! Обнаружено вмешательство в Сущность Этериуса. Превышение лимита Хранительницей Звёзд.<br>Попытка остановить манипуляцию.";
            interventionNextBtn.textContent = "Что?";
        } else {
            interventionText.innerHTML = "Директива получена.<br>Протокол уничтожения ИНИЦИИРОВАН.<br>Хранительница Звёзд будет очищена божественным светом.";
            interventionNextBtn.textContent = "Спасите!";
        }
    } else if (currentInterventionStep === 3) {
        interventionContent.classList.add('void-mode');
        interventionText.innerHTML = "Щупальца. Шелест. Фиолетовые отблески пожирают золотистый свет. Треск магии.<br>Тишина.";
        interventionNextBtn.textContent = "...";

        // Add black threads effect
        addBlackThreadsEffect();

        // Final crackling sound
        playInterventionSFX();
    }
}

function addBlackThreadsEffect() {
    if (!interventionContent) return;

    // Create container if not exists
    let threadsContainer = interventionContent.querySelector('.black-threads-container');
    if (!threadsContainer) {
        threadsContainer = document.createElement('div');
        threadsContainer.className = 'black-threads-container';
        interventionContent.appendChild(threadsContainer);
    }

    threadsContainer.innerHTML = '';
    // Create 15-20 thin black threads
    for (let i = 0; i < 20; i++) {
        const thread = document.createElement('div');
        thread.className = 'thread';
        thread.style.left = (Math.random() * 100) + '%';
        thread.style.animationDelay = (Math.random() * 5) + 's';
        thread.style.opacity = 0.2 + (Math.random() * 0.5);
        threadsContainer.appendChild(thread);
    }
}

function handleInterventionNext() {
    if (currentInterventionStep < 3) {
        currentInterventionStep++;
        showInterventionStep();
    } else {
        // Finalize
        if (interventionModal) {
            interventionModal.classList.remove('open');
        }

        // Cleanup effects
        const threads = interventionContent.querySelector('.black-threads-container');
        if (threads) threads.remove();
        interventionContent.classList.remove('divine-mode', 'void-mode');

        isInterventionActive = false;

        // Resume background music
        resumeBackgroundMusic();

        hideCounterForever();
    }
}

function hideCounterForever() {
    isCounterPermanentlyHidden = true;
    if (counterEl) {
        counterEl.style.opacity = 0;
        setTimeout(() => {
            counterEl.style.display = 'none';
        }, 500);
    }
}
