# Flappy Mobile (React + Vite)

A Flappy Bird–style canvas game with dynamic difficulty, themed obstacles, power-ups (Shield, Slow-Mo, Magnet, ×2), stars and bomb hazards, and a fast-beat synth background.

## Run locally (macOS)
1. Ensure you have Node.js 18+ installed (`node -v`).
2. Unzip the project.
3. In the project folder:
   ```bash
   npm install
   npm run dev
   ```
4. Open the printed local URL (usually http://localhost:5173).

## Tests
Run unit tests for the difficulty ramp and theme cycling:
```bash
npm test
```

## Files
- `src/components/FlappyMobile.jsx` – React component + game loop
- `src/game/sound.js` – audio engine (fast beat + sfx)
- `src/game/difficulty.js` – score-based difficulty curve
- `src/game/themes.js` – obstacle themes that cycle every 25 score
- `src/game/draw.js` – canvas drawing helpers & HUD
- `src/game/utils.js` – utility helpers
