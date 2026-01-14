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
            console.log(`Action triggered: ${alt}`);

            // Transition logic for 1 Player
            if (alt === '1 Player') {
                startGameScene();
            }
        });
    });

    /**
     * Game Scene Logic
     */
    function startGameScene() {
        const titleScreen = document.getElementById('title-screen');
        const gameScene = document.getElementById('game-scene');
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        titleScreen.classList.add('hidden');
        gameScene.classList.remove('hidden');

        // Set internal resolution
        canvas.width = 400;
        canvas.height = 400;

        const spriteSheet = new Image();
        spriteSheet.src = '/webling_idle.png';
        spriteSheet.onload = () => {
            const frameWidth = 256;
            const frameHeight = 256;
            const frames = [];

            // Process each of the 4 quadrants
            const coords = [[0,0], [256,0], [0,256], [256,256]];
            
            coords.forEach(([sx, sy]) => {
                // Temporary canvas to analyze pixels
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = frameWidth;
                tempCanvas.height = frameHeight;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(spriteSheet, sx, sy, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
                
                const imageData = tempCtx.getImageData(0, 0, frameWidth, frameHeight);
                const data = imageData.data;

                let minX = frameWidth, maxX = 0, minY = frameHeight, maxY = 0;
                let hasPixels = false;

                for (let y = 0; y < frameHeight; y++) {
                    for (let x = 0; x < frameWidth; x++) {
                        const alpha = data[(y * frameWidth + x) * 4 + 3];
                        if (alpha > 10) { // Threshold for non-transparent
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                            hasPixels = true;
                        }
                    }
                }

                if (hasPixels) {
                    frames.push({
                        canvas: tempCanvas,
                        bounds: { minX, maxX, minY, maxY, 
                                  width: maxX - minX, 
                                  height: maxY - minY,
                                  centerX: (minX + maxX) / 2,
                                  bottomY: maxY }
                    });
                }
            });

            // Animation loop
            let currentFrameIdx = 0;
            let lastTime = 0;
            const frameDuration = 200; // ms per frame

            function animate(timestamp) {
                if (!lastTime) lastTime = timestamp;
                const elapsed = timestamp - lastTime;

                if (elapsed > frameDuration) {
                    currentFrameIdx = (currentFrameIdx + 1) % frames.length;
                    lastTime = timestamp;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                if (frames.length > 0) {
                    const frame = frames[currentFrameIdx];
                    // Center frame.bounds.centerX at canvas.width / 2
                    // Align frame.bounds.bottomY at canvas.height * 0.8 (ground level)
                    const groundY = canvas.height * 0.8;
                    const destX = (canvas.width / 2) - frame.bounds.centerX;
                    const destY = groundY - frame.bounds.bottomY;

                    ctx.drawImage(frame.canvas, destX, destY);
                    
                    // Optional: Draw a "shadow" or base line
                    ctx.beginPath();
                    ctx.ellipse(canvas.width/2, groundY, 40, 10, 0, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    ctx.fill();
                }

                requestAnimationFrame(animate);
            }

            requestAnimationFrame(animate);
        };
    }
});