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

    // Load SVG frames generated programmatically
    loadSvgFrames().then(frames => {
        startAnimation(ctx, canvas, frames);
    });
}

function startAnimation(ctx, canvas, frames) {
    let frameIndex = 0;
    let lastFrameTime = 0;
    const frameDuration = 250; // ms per frame (slightly slower for SVG smoothness)

    function loop(timestamp) {
        if (timestamp - lastFrameTime > frameDuration) {
            frameIndex = (frameIndex + 1) % frames.length;
            lastFrameTime = timestamp;
        }

        // Clear screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use high quality smoothing for vectors
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const img = frames[frameIndex];
        
        // Calculate size relative to screen to fit nicely
        // Use roughly 50% of screen height or width, whichever is smaller
        const size = Math.min(canvas.width, canvas.height) * 0.5;
        
        const drawX = (canvas.width - size) / 2;
        const drawY = canvas.height - size - 20; // 20px padding from bottom

        ctx.drawImage(img, drawX, drawY, size, size);

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function loadSvgFrames() {
    // We create detailed SVG strings to replace the bitmap sprite sheet.
    // The SVGs are designed to match the character description:
    // Green, round, stubby limbs, cute eyes.
    
    const bodyColor = "#76c442"; // Fresh green
    const darkGreen = "#4a8a2a"; // Outline/Detail
    const strokeW = 5;
    
    // Helper to wrap content in a standard SVG envelope
    // ViewBox 0 0 200 200.
    // Includes a drop shadow filter and radial gradient for 3D effect.
    const createSVG = (content) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
        <defs>
            <radialGradient id="bodyGrad" cx="40%" cy="40%" r="55%" fx="40%" fy="40%">
                <stop offset="0%" style="stop-color:#b4e884;stop-opacity:1" />
                <stop offset="100%" style="stop-color:${bodyColor};stop-opacity:1" />
            </radialGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="2" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.2"/>
                </feComponentTransfer>
                <feMerge> 
                    <feMergeNode in="offsetblur"/>
                    <feMergeNode in="SourceGraphic"/> 
                </feMerge>
            </filter>
        </defs>
        <g filter="url(#shadow)">
            ${content}
        </g>
    </svg>`;

    // --- Component Parts ---

    // Feet: Small ellipses at the bottom
    const feet = `
        <ellipse cx="75" cy="165" rx="20" ry="12" fill="${darkGreen}"/>
        <ellipse cx="125" cy="165" rx="20" ry="12" fill="${darkGreen}"/>
    `;
    
    // Body: Main round shape
    const body = `
        <circle cx="100" cy="110" r="55" fill="url(#bodyGrad)" stroke="${darkGreen}" stroke-width="${strokeW}"/>
    `;

    // Eyes: Open (White sclera, black pupil, white glint)
    const eyesOpen = `
        <!-- Left Eye -->
        <g transform="translate(-20, 0)">
            <circle cx="100" cy="100" r="16" fill="white" stroke="${darkGreen}" stroke-width="2"/>
            <circle cx="100" cy="100" r="7" fill="black"/>
            <circle cx="98" cy="97" r="2.5" fill="white"/>
        </g>
        <!-- Right Eye -->
        <g transform="translate(20, 0)">
            <circle cx="100" cy="100" r="16" fill="white" stroke="${darkGreen}" stroke-width="2"/>
            <circle cx="100" cy="100" r="7" fill="black"/>
            <circle cx="98" cy="97" r="2.5" fill="white"/>
        </g>
    `;

    // Eyes: Closed (Happy curves)
    const eyesClosed = `
        <!-- Left Eye Closed -->
        <path d="M 66 102 Q 80 115 94 102" stroke="${darkGreen}" stroke-width="4" fill="none" stroke-linecap="round" />
        <!-- Right Eye Closed -->
        <path d="M 106 102 Q 120 115 134 102" stroke="${darkGreen}" stroke-width="4" fill="none" stroke-linecap="round" />
    `;

    // Mouth: Simple smile
    const mouth = `
        <path d="M 85 135 Q 100 145 115 135" stroke="${darkGreen}" stroke-width="4" fill="none" stroke-linecap="round"/>
    `;

    // Arms: Defined as paths
    // Idle (Down)
    const armLeftDown = `<path d="M 46 110 Q 35 125 45 135" stroke="${darkGreen}" stroke-width="8" stroke-linecap="round" fill="none"/>`;
    const armRightDown = `<path d="M 154 110 Q 165 125 155 135" stroke="${darkGreen}" stroke-width="8" stroke-linecap="round" fill="none"/>`;
    
    // Wave Left (Our Left / Character Right)
    const armLeftUp = `<path d="M 46 110 Q 25 90 40 75" stroke="${darkGreen}" stroke-width="8" stroke-linecap="round" fill="none"/>`;
    
    // Wave Right (Our Right / Character Left)
    const armRightUp = `<path d="M 154 110 Q 175 90 160 75" stroke="${darkGreen}" stroke-width="8" stroke-linecap="round" fill="none"/>`;


    // --- Frame Composition ---
    
    // Frame 1: Idle (Matches original frame 1)
    const svg1 = createSVG(`
        ${feet} ${body}
        ${armLeftDown} ${armRightDown}
        ${eyesOpen} ${mouth}
    `);

    // Frame 2: Wave Right, Eyes Closed (Matches original frame 2)
    const svg2 = createSVG(`
        ${feet} ${body}
        ${armLeftDown} ${armRightUp}
        ${eyesClosed} ${mouth}
    `);

    // Frame 3: Wave Left, Eyes Open (Matches original frame 3)
    const svg3 = createSVG(`
        ${feet} ${body}
        ${armLeftUp} ${armRightDown}
        ${eyesOpen} ${mouth}
    `);

    // Frame 4: Idle, Eyes Closed (Matches original frame 4)
    const svg4 = createSVG(`
        ${feet} ${body}
        ${armLeftDown} ${armRightDown}
        ${eyesClosed} ${mouth}
    `);

    const rawFrames = [svg1, svg2, svg3, svg4];

    // Convert SVG strings to Image objects
    const promises = rawFrames.map(svg => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            // Create a blob URL for the SVG string
            const blob = new Blob([svg], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            
            img.onload = () => {
                URL.revokeObjectURL(url); // clean up memory
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    });

    return Promise.all(promises);
}