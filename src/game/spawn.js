// src/game/spawn.js
// Stars: all same size. Tier unlocks at 50 (2pt, purple) and 100 (3pt, obsidian).
// Selection is uniform among unlocked tiers.

export function selectStarTier(score, rFloat) {
    // Use one common radius scale so all stars render the same size.
    const SAME_SIZE = 1.25;
  
    const tiers = [
      { key: "star1", value: 1, color: "#f5c400", rScale: SAME_SIZE }, // gold (1 point)
    ];
  
    if (score >= 50) {
      tiers.push({ key: "star2", value: 2, color: "#a855f7", rScale: SAME_SIZE }); // purple (2 points)
    }
    if (score >= 100) {
      tiers.push({ key: "star3", value: 3, color: "#3A3A3A", rScale: SAME_SIZE }); // obsidian (3 points)
    }
  
    const i = Math.min(tiers.length - 1, Math.floor((rFloat ?? Math.random()) * tiers.length));
    return tiers[i];
  }
  