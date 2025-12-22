/**
 * Visual Effects Module
 * Handles Snowfall and Dynamic Canvas Comets
 */
import { PARALLAX_CONF } from './config.js';

let snowflakes = [];
const maxSnowflakes = 60;

let comets = [];

export function initSnow(canvasId, isStartedCallback, onCometClick) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    function createSnowflake() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.2,
            opacity: Math.random() * 0.4 + 0.1,
            sway: Math.random() * 2 - 1
        };
    }

    for (let i = 0; i < maxSnowflakes; i++) {
        snowflakes.push(createSnowflake());
    }

    function createComet() {
        const startX = Math.random() * width * 0.5 + width * 0.5; // Top right 50%
        const startY = Math.random() * height * 0.3; // Top 30%

        return {
            x: startX,
            y: startY,
            vx: -(Math.random() * 4 + 3), // Speed left
            vy: Math.random() * 1.5 + 1,  // Speed down
            history: [], // For the tail
            maxHistory: 20,
            active: true
        };
    }

    function updateAndDraw() {
        if (!isStartedCallback()) {
            requestAnimationFrame(updateAndDraw);
            return;
        }

        ctx.clearRect(0, 0, width, height);

        // Draw Snow
        snowflakes.forEach(flake => {
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
            ctx.fill();

            flake.y += flake.speed;
            flake.x += Math.sin(flake.y * 0.01) * 0.5 + flake.sway * 0.1;

            if (flake.y > height) {
                flake.y = -5;
                flake.x = Math.random() * width;
            }
        });

        // Draw & Update Comets
        comets.forEach(comet => {
            if (!comet.active) return;

            // Update History for Tail
            comet.history.push({ x: comet.x, y: comet.y });
            if (comet.history.length > comet.maxHistory) comet.history.shift();

            // Draw Tail (Dynamic trailing effect)
            if (comet.history.length > 2) {
                for (let i = 0; i < comet.history.length - 1; i++) {
                    const p1 = comet.history[i];
                    const p2 = comet.history[i + 1];
                    const alpha = i / comet.history.length;

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                    ctx.lineWidth = alpha * 3;
                    ctx.lineCap = 'round';
                    ctx.stroke();
                }
            }

            // Draw Head
            ctx.beginPath();
            ctx.arc(comet.x, comet.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fff';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Update Position
            comet.x += comet.vx;
            comet.y += comet.vy;

            // Decay check
            if (comet.x < -100 || comet.y > height + 100) {
                comet.active = false;
            }
        });

        comets = comets.filter(c => c.active);
        requestAnimationFrame(updateAndDraw);
    }

    function startCometSpawner() {
        const nextSpawn = Math.random() * 60000 + 30000; // 30-90 seconds
        setTimeout(() => {
            comets.push(createComet());
            startCometSpawner();
        }, nextSpawn);
    }

    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });

    canvas.addEventListener('click', (e) => {
        if (!isStartedCallback()) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Detect click on comet head
        const clickRadius = 30;

        for (let i = 0; i < comets.length; i++) {
            const comet = comets[i];
            const dist = Math.sqrt((x - comet.x) ** 2 + (y - comet.y) ** 2);

            if (dist < clickRadius) {
                comet.active = false; // Remove comet
                if (onCometClick) onCometClick();
                break; // Only catch one at a time
            }
        }
    });

    updateAndDraw();
    startCometSpawner();
}

export function initParallax(sceneElement, isStartedCallback) {
    document.addEventListener('mousemove', (e) => {
        if (!isStartedCallback()) return;
        const x = (window.innerWidth - e.pageX * 2) / PARALLAX_CONF.intensity;
        const y = (window.innerHeight - e.pageY * 2) / PARALLAX_CONF.intensity;
        sceneElement.style.transform = `translate(${x}px, ${y}px) scale(${PARALLAX_CONF.scale})`;
    });
}

