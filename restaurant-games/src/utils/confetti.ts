import confetti from 'canvas-confetti';

export function triggerConfetti() {
  try {
    // Left burst
    confetti({
      particleCount: 55,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#7C3AED', '#9333EA', '#C084FC', '#E9D5FF', '#F59E0B', '#FFFFFF'],
    });
    // Right burst
    confetti({
      particleCount: 55,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#7C3AED', '#9333EA', '#C084FC', '#E9D5FF', '#F59E0B', '#FFFFFF'],
    });
    // Center stars
    confetti({
      particleCount: 35,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      shapes: ['star', 'circle'],
      colors: ['#9333EA', '#A855F7', '#C084FC', '#FBBF24'],
    });
  } catch {
    // Graceful fallback if canvas is restricted
  }
}
