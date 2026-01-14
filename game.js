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

    // Replaced frame-based SVG loading with component-based SVG loading
    // This allows for 60fps smooth animation of parts (arms, breathing)
    loadComponents().then(assets => {
        startSmoothAnimation(ctx, canvas, assets);
    });
}

function startSmoothAnimation(ctx, canvas, assets) {
    let startTime = null;

    function loop(timestamp) {
        if (!startTime) startTime = timestamp;
        const totalTime = timestamp - startTime;

        // Clear screen
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Layout constants
        const size = Math.min(canvas.width, canvas.height) * 0.45; 
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + size * 0.15; // slightly lower than center

        // --- Smooth Animation Logic ---
        // 1. Breathing (Y Scale & Y Offset)
        const breatheSpeed = 0.0025;
        const breatheAmount = 0.03;
        const breathe = 1 + Math.sin(totalTime * breatheSpeed) * breatheAmount;
        const bobOffset = Math.sin(totalTime * breatheSpeed) * (size * 0.04);

        // 2. Arms (Rotation)
        const armSpeed = 0.003;
        const armWag = Math.sin(totalTime * armSpeed) * 0.15;
        const leftArmAngle = 0.4 + armWag; // Radians
        const rightArmAngle = -0.4 - armWag;

        // 3. Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        const shadowW = size * 0.7 * breathe;
        const shadowH = size * 0.15;
        ctx.ellipse(cx, cy + size * 0.52, shadowW, shadowH, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Character Composition
        ctx.save();
        ctx.translate(cx, cy + bobOffset);
        
        // Feet (Draw first to be behind)
        const footW = size * 0.28;
        const footH = size * 0.18;
        const footXOffset = size * 0.22;
        const footYOffset = size * 0.38;

        // Left Foot
        ctx.drawImage(assets.foot, -footXOffset - footW/2, footYOffset - footH/2, footW, footH);
        // Right Foot
        ctx.drawImage(assets.foot, footXOffset - footW/2, footYOffset - footH/2, footW, footH);

        // Arms (Attached behind body for cuteness)
        const armW = size * 0.35;
        const armH = size * 0.14;
        
        // Left Arm
        ctx.save();
        ctx.translate(-size * 0.28, -size * 0.05);
        ctx.rotate(leftArmAngle); 
        ctx.drawImage(assets.arm, -armW * 0.15, -armH/2, armW, armH);
        ctx.restore();

        // Right Arm (Mirrored)
        ctx.save();
        ctx.translate(size * 0.28, -size * 0.05);
        ctx.scale(-1, 1);
        ctx.rotate(-rightArmAngle); // Note: flipped coord system
        ctx.drawImage(assets.arm, -armW * 0.15, -armH/2, armW, armH);
        ctx.restore();

        // Body (Scales with breathing)
        ctx.save();
        ctx.scale(breathe, 1/breathe + 0.02); // Preserve volume-ish
        const bodySize = size;
        ctx.drawImage(assets.body, -bodySize/2, -bodySize/2, bodySize, bodySize);
        ctx.restore();

        // Face (Moves with body but slightly less squash/stretch to look solid)
        // Blink Logic
        const blinkLoop = totalTime % 3500;
        const isBlinking = blinkLoop > 3300;
        const faceImg = isBlinking ? assets.faceClosed : assets.faceOpen;
        
        const faceSize = size * 0.8;
        ctx.drawImage(faceImg, -faceSize/2, -faceSize/2 + (breathe * 5), faceSize, faceSize);

        ctx.restore(); // End character transform

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function loadComponents() {
    // We construct detailed SVG components separately to compose them in the render loop.
    // This provides infinite resolution and smooth rotation/scaling.
    
    const cMain = "#88e060"; // Vibrant Lime Green
    const cShadow = "#66b040"; // Darker Green for depth
    const cOutline = "#407a20"; // Dark Green Outline
    const cHighlight = "#d4ffb0"; // Top light
    const cCheek = "#ff99aa"; // Cute pink

    const createImg = (svgString) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const blob = new Blob([svgString], {type: 'image/svg+xml'});
            const url = URL.createObjectURL(blob);
            img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = reject;
            img.src = url;
        });
    };

    // 1. BODY Component
    const svgBody = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
        <defs>
            <radialGradient id="gradBody" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stop-color="${cHighlight}" />
                <stop offset="100%" stop-color="${cMain}" />
            </radialGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>
        <!-- Little Antenna Tuft -->
        <path d="M 100,25 Q 90,5 80,15 Q 95,10 100,25 Z" fill="${cMain}" stroke="${cOutline}" stroke-width="3"/>
        
        <!-- Main Body Shape: Soft Tear-drop/Round -->
        <path d="M 100,30 
                 C 150,30 175,70 175,115
                 C 175,170 140,190 100,190
                 C 60,190 25,170 25,115
                 C 25,70 50,30 100,30 Z" 
              fill="url(#gradBody)" stroke="${cOutline}" stroke-width="5" />
        
        <!-- Inner rim highlight -->
        <path d="M 50,60 Q 100,45 150,60" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4" stroke-linecap="round"/>
    </svg>`;

    // 2. FOOT Component
    const svgFoot = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" width="200" height="120">
        <defs>
            <linearGradient id="gradFoot" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="${cMain}" />
                <stop offset="100%" stop-color="${cShadow}" />
            </linearGradient>
        </defs>
        <ellipse cx="50" cy="30" rx="45" ry="25" fill="url(#gradFoot)" stroke="${cOutline}" stroke-width="4"/>
    </svg>`;

    // 3. ARM Component
    const svgArm = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" width="250" height="100">
        <!-- Cute nubby arm -->
        <path d="M 5,20 C 5,10 20,5 85,12 C 95,14 95,26 85,28 C 20,35 5,30 5,20 Z" 
              fill="${cMain}" stroke="${cOutline}" stroke-width="4"/>
    </svg>`;

    // 4. FACE OPEN Component
    const svgFaceOpen = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
        <!-- Cheeks -->
        <ellipse cx="50" cy="125" rx="18" ry="12" fill="${cCheek}" opacity="0.6" />
        <ellipse cx="150" cy="125" rx="18" ry="12" fill="${cCheek}" opacity="0.6" />

        <!-- Eyes -->
        <g>
            <!-- Left Eye -->
            <ellipse cx="65" cy="95" rx="20" ry="26" fill="white" stroke="${cOutline}" stroke-width="2"/>
            <ellipse cx="70" cy="95" rx="12" ry="16" fill="#1a1a1a"/> <!-- Pupil looking slight right -->
            <circle cx="74" cy="90" r="5" fill="white" opacity="0.9"/> <!-- Glint -->
            
            <!-- Right Eye -->
            <ellipse cx="135" cy="95" rx="20" ry="26" fill="white" stroke="${cOutline}" stroke-width="2"/>
            <ellipse cx="130" cy="95" rx="12" ry="16" fill="#1a1a1a"/> <!-- Pupil looking slight left (cute focus) -->
            <circle cx="134" cy="90" r="5" fill="white" opacity="0.9"/>
        </g>
        
        <!-- Mouth: Small and happy -->
        <path d="M 92,130 Q 100,136 108,130" fill="none" stroke="${cOutline}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;

    // 5. FACE CLOSED Component
    const svgFaceClosed = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
        <!-- Cheeks -->
        <ellipse cx="50" cy="125" rx="18" ry="12" fill="${cCheek}" opacity="0.6" />
        <ellipse cx="150" cy="125" rx="18" ry="12" fill="${cCheek}" opacity="0.6" />

        <!-- Closed Eyes (Happy Arches) -->
        <path d="M 45,100 Q 65,115 85,100" fill="none" stroke="${cOutline}" stroke-width="4" stroke-linecap="round"/>
        <path d="M 115,100 Q 135,115 155,100" fill="none" stroke="${cOutline}" stroke-width="4" stroke-linecap="round"/>
        
        <!-- Mouth -->
        <path d="M 92,130 Q 100,136 108,130" fill="none" stroke="${cOutline}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;

    return Promise.all([
        createImg(svgBody),
        createImg(svgFoot),
        createImg(svgArm),
        createImg(svgFaceOpen),
        createImg(svgFaceClosed)
    ]).then(([body, foot, arm, faceOpen, faceClosed]) => ({
        body, foot, arm, faceOpen, faceClosed
    }));
}