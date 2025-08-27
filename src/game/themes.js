// src/game/themes.js
// Ten themes; clamp at last theme (no looping).
export const THEMES = [
  { name: "Forest",   body: "#4CAF50", rim: "#3E8E41", decor: "none"  },
  { name: "Ice",      body: "#9AD9FF", rim: "#76C7F2", decor: "ice"   },
  { name: "Stone",    body: "#9AA0A6", rim: "#7C8288", decor: "brick" },
  { name: "Lava",     body: "#ff6b6b", rim: "#e04848", decor: "magma" },
  { name: "Tech",     body: "#7c3aed", rim: "#5b21b6", decor: "grid"  },
  { name: "Desert",   body: "#E0C97A", rim: "#C9B46A", decor: "none"  },
  { name: "Ocean",    body: "#5EC1E8", rim: "#359BC2", decor: "grid"  },
  { name: "Jungle",   body: "#2E7D32", rim: "#1B5E20", decor: "none"  },
  { name: "Neon",     body: "#00E5FF", rim: "#00B8D4", decor: "grid"  },
  { name: "Obsidian", body: "#3A3A3A", rim: "#2A2A2A", decor: "brick" },
];

export function themeForScore(score) {
  const idx = Math.min(Math.floor(score / 25), THEMES.length - 1);
  return THEMES[idx];
}
