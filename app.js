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
            
            // Just a visual log for now
            const alt = e.currentTarget.querySelector('img').alt;
            console.log(`Action triggered: ${alt}`);
        });
    });
});