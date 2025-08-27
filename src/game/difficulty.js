// src/game/difficulty.js
// Score-based difficulty ramp: gaps shrink & speed rises smoothly.
export function getDifficulty(score) {
  const k = 1 - Math.exp(-score / 25); // smooth 0 → 1
  const speed = 1 + (1.9 - 1) * k;     // up to +90%
  const gap = 1 - (1 - 0.65) * k;      // down to 65% of base
  const spawn = 1 - (1 - 0.82) * k;    // spawns up to 18% faster
  return { speed, gap, spawn };
}
