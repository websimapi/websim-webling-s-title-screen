export function initGame() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('game-scene');

    // Handle resizing to keep canvas sharp and sized to container
    function resize() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Load sprite sheet
    const img = new Image();
    img.src = '/webling_idle.png';
    img.onload = () => {
        startAnimation(ctx, canvas, img);
    };
}

function startAnimation(ctx, canvas, img) {
    // Cut the image into 4 quadrants (2x2), trim transparency, and put into their own canvases
    const frames = processSprites(img, 2, 2);
    
    let frameIndex = 0;
    let lastFrameTime = 0;
    const frameDuration = 200; // ms per frame

    function loop(timestamp) {
        if (timestamp - lastFrameTime > frameDuration) {
            frameIndex = (frameIndex + 1) % frames.length;
            lastFrameTime = timestamp;
        }

        // Clear screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Turn off smoothing for pixel art look
        ctx.imageSmoothingEnabled = false;

        const frame = frames[frameIndex];
        
        // Positioning Logic:
        // We want the "feet" (bottom center of the sprite) to be at the bottom center of the canvas
        const targetX = canvas.width / 2;
        const targetY = canvas.height - 50; // Padding from bottom

        const scale = 2; // Scale up for visibility

        // Calculate top-left position for drawing based on the feet position
        const drawX = targetX - (frame.feetX * scale);
        const drawY = targetY - (frame.feetY * scale);

        ctx.drawImage(
            frame.canvas, 
            drawX, 
            drawY, 
            frame.canvas.width * scale, 
            frame.canvas.height * scale
        );

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function processSprites(img, cols, rows) {
    // Helper to analyze pixels and extract trimmed sprite to a new canvas
    const quadrantWidth = img.width / cols;
    const quadrantHeight = img.height / rows;
    
    // Temporary canvas for reading pixel data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = quadrantWidth;
    tempCanvas.height = quadrantHeight;
    const tempCtx = tempCanvas.getContext('2d');
    
    const processedFrames = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Clear temp canvas
            tempCtx.clearRect(0, 0, quadrantWidth, quadrantHeight);
            
            // Draw the specific quadrant
            tempCtx.drawImage(
                img, 
                c * quadrantWidth, r * quadrantHeight, quadrantWidth, quadrantHeight, 
                0, 0, quadrantWidth, quadrantHeight
            );

            // Get pixel data to find bounds
            const imageData = tempCtx.getImageData(0, 0, quadrantWidth, quadrantHeight);
            const data = imageData.data;
            
            let minX = quadrantWidth, maxX = 0, minY = quadrantHeight, maxY = 0;
            let foundPixel = false;

            for (let y = 0; y < quadrantHeight; y++) {
                for (let x = 0; x < quadrantWidth; x++) {
                    const index = (y * quadrantWidth + x) * 4;
                    const alpha = data[index + 3];
                    
                    if (alpha > 10) { // Threshold for transparency
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                        foundPixel = true;
                    }
                }
            }

            if (foundPixel) {
                const width = maxX - minX + 1;
                const height = maxY - minY + 1;

                // Create a dedicated canvas for this trimmed sprite
                const spriteCanvas = document.createElement('canvas');
                spriteCanvas.width = width;
                spriteCanvas.height = height;
                const spriteCtx = spriteCanvas.getContext('2d');

                // Draw the trimmed portion onto the new canvas
                spriteCtx.drawImage(
                    tempCanvas, 
                    minX, minY, width, height, 
                    0, 0, width, height
                );

                processedFrames.push({
                    canvas: spriteCanvas,
                    // Feet position is horizontal center, vertical bottom of the trimmed sprite
                    feetX: width / 2,
                    feetY: height
                });
            } else {
                // Fallback for empty frames
                processedFrames.push({
                    canvas: tempCanvas, // Just use the empty/full quadrant
                    feetX: quadrantWidth / 2,
                    feetY: quadrantHeight
                });
            }
        }
    }
    return processedFrames;
}