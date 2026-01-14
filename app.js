/**
 * Title Screen Logic
 * Adds simple sound interaction or button feedback
 */

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.game-btn');
    
    // Add click sound effect using WebAudio API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const playClickSound = () => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    };

    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            playClickSound();
            
            const alt = e.currentTarget.querySelector('img').alt;

            // Transition logic for 1 Player
            if (alt === '1 Player') {
                const titleScreen = document.getElementById('title-screen');
                const gameScene = document.getElementById('game-scene');
                
                titleScreen.classList.add('hidden');
                gameScene.classList.remove('hidden');
                initGameCanvas();
            }
        });
    });
});

/**
 * Sprite Animation Logic
 * Splits image into 4 quadrants and aligns them using a collective bounding box
 * to prevent jitter while centering the character visually.
 */
async function initGameCanvas() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = '/webling_idle.png';

    await new Promise(resolve => img.onload = resolve);

    const frameSize = 256;
    const frames = [
        { x: 0, y: 0 },
        { x: 256, y: 0 },
        { x: 0, y: 256 },
        { x: 256, y: 256 }
    ];

    // Offscreen canvas for pixel analysis
    const offscreen = document.createElement('canvas');
    offscreen.width = frameSize;
    offscreen.height = frameSize;
    const octx = offscreen.getContext('2d', { willReadFrequently: true });

    // Detect collective bounds across all 4 frames to ensure stable alignment
    let globalMinX = frameSize, globalMaxX = 0, globalMinY = frameSize, globalMaxY = 0;
    let foundAnyAtAll = false;

    frames.forEach(frame => {
        octx.clearRect(0, 0, frameSize, frameSize);
        octx.drawImage(img, frame.x, frame.y, frameSize, frameSize, 0, 0, frameSize, frameSize);
        const data = octx.getImageData(0, 0, frameSize, frameSize).data;

        for (let y = 0; y < frameSize; y++) {
            for (let x = 0; x < frameSize; x++) {
                if (data[(y * frameSize + x) * 4 + 3] > 10) {
                    if (x < globalMinX) globalMinX = x;
                    if (x > globalMaxX) globalMaxX = x;
                    if (y < globalMinY) globalMinY = y;
                    if (y > globalMaxY) globalMaxY = y;
                    foundAnyAtAll = true;
                }
            }
        }
    });

    // Default to center of frame if no pixels found
    if (!foundAnyAtAll) {
        globalMinX = 0; globalMaxX = frameSize; globalMinY = 0; globalMaxY = frameSize;
    }

    // Calculate a consistent pivot point for all frames
    // This uses the center-bottom of the character's total movement area
    const charWidth = globalMaxX - globalMinX + 1;
    const pivotX = globalMinX + (charWidth / 2);
    const pivotY = globalMaxY;

    // Resize visible canvas to fit viewport
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    let currentFrame = 0;
    let lastTime = 0;
    const fps = 4; // Animation speed

    function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const elapsed = timestamp - lastTime;

        if (elapsed > 1000 / fps) {
            currentFrame = (currentFrame + 1) % frames.length;
            lastTime = timestamp;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const frame = frames[currentFrame];
        const scale = 2.5; // Slightly larger for better visibility
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Apply the collective pivot so the body stays still while arms/eyes move
        const destX = centerX - (pivotX * scale);
        const destY = centerY - (pivotY * scale);

        ctx.drawImage(
            img,
            frame.x, frame.y, frameSize, frameSize,
            destX, destY, frameSize * scale, frameSize * scale
        );

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}