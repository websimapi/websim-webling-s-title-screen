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
 * Advanced Sprite Animation Logic
 * Analyzes quadrants for transparency to find the actual character bounds
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

    const frameData = frames.map(frame => {
        octx.clearRect(0, 0, frameSize, frameSize);
        octx.drawImage(img, frame.x, frame.y, frameSize, frameSize, 0, 0, frameSize, frameSize);
        const imageData = octx.getImageData(0, 0, frameSize, frameSize);
        const data = imageData.data;

        let minX = frameSize, maxX = 0, minY = frameSize, maxY = 0;
        let foundAny = false;

        for (let y = 0; y < frameSize; y++) {
            for (let x = 0; x < frameSize; x++) {
                const alpha = data[(y * frameSize + x) * 4 + 3];
                if (alpha > 10) { // Threshold for "non-transparent"
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    foundAny = true;
                }
            }
        }

        if (!foundAny) return { x: frame.x, y: frame.y, width: frameSize, height: frameSize, pivotX: frameSize / 2, pivotY: frameSize };

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        // Center-Bottom pivot relative to the frame (0,0)
        const pivotX = minX + (width / 2);
        const pivotY = maxY;

        return {
            sourceX: frame.x,
            sourceY: frame.y,
            width,
            height,
            minX,
            minY,
            pivotX,
            pivotY
        };
    });

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
            currentFrame = (currentFrame + 1) % frameData.length;
            lastTime = timestamp;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const frame = frameData[currentFrame];
        const scale = 2; // Make it a bit bigger in scene
        
        // Draw the character anchored at the center of the screen
        // We subtract the pivot points to ensure the "bottom-center" of the pixels is at (centerX, centerY)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const destX = centerX - (frame.pivotX * scale);
        const destY = centerY - (frame.pivotY * scale);

        ctx.drawImage(
            img,
            frame.sourceX, frame.sourceY, frameSize, frameSize, // Use whole frame to avoid jitter if rect changes size
            destX, destY, frameSize * scale, frameSize * scale
        );

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}