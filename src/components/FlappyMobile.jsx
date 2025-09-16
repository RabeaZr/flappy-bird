import React, { useEffect, useRef, useState } from "react";
import { themeForScore } from "../game/themes";
import { selectStarTier } from "../game/spawn";

// NOTE: draw.js already contains these helpers in your project scaffold.
// If your paths differ, adjust the import accordingly.
import {
  drawCloud,
  drawGroundPattern,
  drawBird,
  drawStar,
  drawBomb,
  drawPowerup,
  drawHUD,        // shows bars & shields row
  drawStartPanel,
  drawGameOver,
  drawPipe,
} from "../game/draw";

import { getDifficulty } from "../game/difficulty";
import { initSoundEngine } from "../game/sound";

export default function FlappyMobile() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(0);

  const [best, setBest] = useState(() => {
    try {
      return Number(localStorage.getItem("flappy_best") || 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let ctx = canvas.getContext("2d");

    // --- Sound engine (fast beat) ---
    const ui = { muted: false, audioReady: false };
    const sound = initSoundEngine(ui);

    // --- Game state ---
    const state = {
      running: true,
      now: performance.now(),
      last: performance.now(),
      elapsed: 0, // seconds since play start
      world: { w: 400, h: 600, floorH: 90 },
      gameState: /** @type {"ready"|"playing"|"over"} */ ("ready"),
      score: 0,
      stars: 0, // collectible awards (sum of values)
      pipes: /** @type {Array<any>} */ ([]),
      awards: /** @type {Array<any>} */ ([]),   // stars & bombs
      powerups: /** @type {Array<any>} */ ([]),
      pipeTimer: 0,
      rngSeed: Math.floor(Math.random() * 1e9),
      bird: {
        x: 120,
        y: 300,
        r: 14,
        vy: 0,
        gravity: 1800, // px/s^2 (scaled later)
        jump: -420, // px/s
      },
      effects: {
        shield: 0, // integer charges
        slow: 0,   // seconds remaining
        magnet: 0, // seconds remaining
        double: 0, // seconds remaining
        invuln: 0, // i-frames after shield hit
        timeScale: 1, // eased time scale (0.5..1)
      },
      // spawn smoothing plan
      spawnPlan: {
        nextStarIn: 0,
        nextPowerIn: 0,
      },
      // base (difficulty scales these up/down)
      speeds: {
        pipe: 170, // px/s (base)
        spawnEvery: 1400, // ms (base)
        gapRatio: 0.26, // portion of height (base)
        pipeW: 68,
      },
    };

    // seeded RNG
    function rand01() {
      state.rngSeed = (1103515245 * state.rngSeed + 12345) & 0x7fffffff;
      return (state.rngSeed % 10000) / 10000;
    }
    function randInt(min, max) { return Math.floor(rand01() * (max - min + 1)) + min; }

    // --- Responsive sizing ---
    function sizeCanvas() {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.max(320, Math.min(560, container.clientWidth));
      const h = Math.round(w * 1.5); // 2:3 aspect ratio
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing to CSS pixels
      state.world.w = w;
      state.world.h = h;
    }

    function scheduleNexts(initial = false) {
      // Stars: every 1–2 pipes (avg ~1.5)
      // Power-ups: every 2–4 pipes (avg ~3)
      state.spawnPlan.nextStarIn = randInt(1, 2);
      state.spawnPlan.nextPowerIn = randInt(2, 4);
      if (initial) state.spawnPlan.nextStarIn = 1;
    }

    function resetGame() {
      state.gameState = "ready";
      state.score = 0;
      state.stars = 0;
      state.pipes = [];
      state.awards = [];
      state.powerups = [];
      state.pipeTimer = 0;
      state.bird.vy = 0;
      state.bird.y = state.world.h * 0.45;
      state.effects.shield = 0;
      state.effects.slow = 0;
      state.effects.magnet = 0;
      state.effects.double = 0;
      state.effects.invuln = 0;
      state.effects.timeScale = 1;
      state.elapsed = 0;
      scheduleNexts(true);
    }

    function startGame() {
      if (state.gameState === "over") resetGame();
      state.gameState = "playing";
      state.pipeTimer = 0;
      state.pipes = [];
      state.awards = [];
      state.powerups = [];
      state.score = 0;
      state.stars = 0;
      state.effects.shield = 0;
      state.effects.slow = 0;
      state.effects.magnet = 0;
      state.effects.double = 0;
      state.effects.invuln = 0;
      state.effects.timeScale = 1;
      state.elapsed = 0;
      state.rngSeed = Math.floor(Math.random() * 1e9);
      scheduleNexts(true);
    }

    function gameOver() {
      state.gameState = "over";
      try {
        const newBest = Math.max(best, state.score);
        localStorage.setItem("flappy_best", String(newBest));
        setBest(newBest);
      } catch {}
    }

    // --- Input ---
    const onPointerDown = (e) => {
      e.preventDefault();
      flap();
    };
    const onKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
      if (e.code === "KeyM") {
        sound.init();
        if (sound.ctx) sound.ctx.resume();
        sound.setMuted(!ui.muted);
        if (!ui.muted) sound.startMusic();
      }
      if (e.code === "Enter" && state.gameState === "over") resetGame();
    };

    function flap() {
      if (!ui.audioReady) {
        sound.init();
        if (sound.ctx) sound.ctx.resume();
        sound.startMusic();
      }
      if (state.gameState === "ready") startGame();
      else if (state.gameState === "playing") {
        state.bird.vy = -Math.abs(state.bird.jump * (state.world.h / 600));
      } else if (state.gameState === "over") {
        resetGame();
      }
    }

    canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    // --- Resize handling ---
    const ro = new ResizeObserver(() => sizeCanvas());
    ro.observe(container);
    sizeCanvas();

    function nowMs() { return performance.now(); }

    // --- Dev self-tests (kept) ---
    (function runSelfTests() {
      try {
        const d0 = getDifficulty(0);
        console.assert(d0.speed === 1 && d0.gap === 1 && d0.spawn === 1, "getDifficulty(0) neutral", d0);
        const d20 = getDifficulty(20);
        const d60 = getDifficulty(60);
        console.assert(d20.speed > 1 && d20.gap < 1, "score increases difficulty", d20);
        console.assert(d60.speed >= d20.speed && d60.gap <= d20.gap, "monotonic ramp by score", d60);
        scheduleNexts(true);
        console.assert(state.spawnPlan.nextStarIn === 1, "first star soon");
        console.assert(state.spawnPlan.nextPowerIn >= 2 && state.spawnPlan.nextPowerIn <= 4, "power window ok");
      } catch (e) {
        console.warn("Self-tests skipped:", e);
      }
    })();

    // --- Main loop ---
    function step(now) {
      state.now = now;
      const dtReal = Math.min(0.032, (now - state.last) / 1000); // clamp to 32ms
      state.last = now;
      update(dtReal);
      render(ctx);
      rafRef.current = requestAnimationFrame(step);
    }

    function update(dtReal) {
      const { w, h } = state.world;
      const floorY = h - state.world.floorH;

      // accumulate elapsed
      if (state.gameState === "playing") state.elapsed += dtReal;

      // target time scale: slow = 0.5, else 1; smooth ~2s in/out
      const targetScale = state.effects.slow > 0 ? 0.5 : 1;
      const smooth = Math.min(1, dtReal * 0.5); // ~2.0s ease
      state.effects.timeScale += (targetScale - state.effects.timeScale) * smooth;
      const dt = dtReal * state.effects.timeScale;

      // Scale physics to world height
      const g = state.bird.gravity * (h / 600);
      const basePipeSpeed = state.speeds.pipe * (w / 400);
      const pipeW = state.speeds.pipeW * (w / 400);
      const baseGap = Math.max(90, h * state.speeds.gapRatio);

      const diff = getDifficulty(state.score);
      const pipeSpeed = basePipeSpeed * diff.speed;
      const gap = Math.max(70, baseGap * diff.gap);
      const spawnEveryMs = state.speeds.spawnEvery * diff.spawn;

      // tick down timed effects
      state.effects.slow = Math.max(0, state.effects.slow - dtReal);
      state.effects.magnet = Math.max(0, state.effects.magnet - dtReal);
      state.effects.double = Math.max(0, state.effects.double - dtReal);
      state.effects.invuln = Math.max(0, state.effects.invuln - dtReal);

      if (state.gameState === "ready") {
        // idle bob
        state.bird.y += Math.sin(nowMs() / 300) * 0.15;
      }

      if (state.gameState === "playing") {
        // bird physics
        state.bird.vy += g * dt;
        state.bird.y += state.bird.vy * dt;

        // spawn pipes (with dynamic interval)
        state.pipeTimer += dt * 1000;
        if (state.pipeTimer >= spawnEveryMs) {
          state.pipeTimer = 0;
          const minTop = 40;
          const maxTop = floorY - gap - 40;
          
          // Get the previous pipe's gap center position
          const prevPipe = state.pipes[state.pipes.length - 1];
          let prevGapCenter = h / 2; // Default to middle for first pipe
          if (prevPipe) {
              prevGapCenter = prevPipe.baseTop + (prevPipe.gap / 2);
          }
          
          // Limit vertical distance to 60% of screen height
          const maxVerticalChange = h * 0.6;
          const minNewCenter = Math.max(minTop + (gap / 2), prevGapCenter - maxVerticalChange);
          const maxNewCenter = Math.min(maxTop - (gap / 2), prevGapCenter + maxVerticalChange);
          
          // Calculate the new gap position within these constraints
          const gapCenter = minNewCenter + rand01() * (maxNewCenter - minNewCenter);
          const topH = gapCenter - (gap / 2);
          
          const movingChance = 0.35;
          const canAmp = Math.max(0, (maxTop - minTop - 20) / 2);
          const oscAmp = rand01() < movingChance && canAmp > 12 ? Math.min(50, canAmp) : 0;
          const newPipe = {
            x: w + pipeW,
            w: pipeW,
            baseTop: topH,
            gap: gap,
            oscAmp,
            oscSpeed: 0.8 + rand01() * 0.8,
            oscPhase: rand01() * Math.PI * 2,
            scored: false,
          };
          state.pipes.push(newPipe);

          // deterministic-ish spawn plan to smooth variance
          state.spawnPlan.nextStarIn -= 1;
          state.spawnPlan.nextPowerIn -= 1;

          // ⭐ / 💣 Awards
          if (state.spawnPlan.nextStarIn <= 0) {
            // Hazard chance
            const hazard = rand01() < 0.06; // 6% -> bomb
            const xBase = newPipe.x + newPipe.w + Math.min(60, gap * 0.25) + rand01() * 24;
            const yInGap = topH + 10 + rand01() * Math.max(10, gap - 20);
            const yClamped = Math.max(30, Math.min(floorY - 30, yInGap));

            if (hazard) {
              const baseR = Math.max(7, 8 * (h / 600));
              const r = baseR * 1.2;
              state.awards.push({
                x: xBase, y: yClamped, r, value: 0, type: "bomb", vx: 0, vy: 0,
              });
            } else {
              // pick tier by score gates
              const tier = selectStarTier(state.score, rand01());
              const baseR = Math.max(7, 8 * (h / 600));
              const r = baseR * tier.rScale;
              state.awards.push({
                x: xBase, y: yClamped, r,
                value: tier.value,
                type: tier.key,          // "star1" | "star2" | "star3"
                color: tier.color,       // render color
                vx: 0, vy: 0,
              });
            }

            // re-schedule
            state.spawnPlan.nextStarIn = randInt(1, 2);
          }

          // 🎁 Power-up
          if (state.spawnPlan.nextPowerIn <= 0) {
            const types = ["shield", "slow", "magnet", "double"]; // 4 types
            const type = types[Math.floor(rand01() * types.length)];
            const yTarget = topH + gap * (0.35 + rand01() * 0.3);
            state.powerups.push({
              x: newPipe.x + newPipe.w + 100 + rand01() * 30,
              y: Math.max(30, Math.min(floorY - 30, yTarget)),
              r: Math.max(9, 9 * (h / 600)),
              type,
              vx: 0,
              vy: 0,
              t: 0,
            });
            state.spawnPlan.nextPowerIn = randInt(2, 4);
          }
        }

        // move pipes & scoring
        for (const p of state.pipes) {
          p.x -= pipeSpeed * dt;
          if (!p.scored && p.x + p.w < state.bird.x - state.bird.r) {
            p.scored = true;
            state.score += 1 * (state.effects.double > 0 ? 2 : 1);
          }
        }
        state.pipes = state.pipes.filter((p) => p.x + p.w > -10);

        // move & handle awards
        for (const a of state.awards) {
          const isStar = a.type && String(a.type).startsWith("star");
          if (state.effects.magnet > 0 && isStar) {
            // magnet pulls only safe stars
            const dx = state.bird.x - a.x;
            const dy = state.bird.y - a.y;
            const d = Math.max(0.001, Math.hypot(dx, dy));
            const homing = 560 * (h / 600);
            a.x += (dx / d) * homing * dt;
            a.y += (dy / d) * homing * dt;
          } else {
            a.x += (-pipeSpeed) * dt + (a.vx || 0) * dt;
            a.y += (a.vy || 0) * dt;
            a.vx = (a.vx || 0) * 0.98;
            a.vy = (a.vy || 0) * 0.98;
          }
        }

        // collect awards & hazards
        for (let i = state.awards.length - 1; i >= 0; i--) {
          const a = state.awards[i];
          const dx = state.bird.x - a.x;
          const dy = state.bird.y - a.y;
          if (dx * dx + dy * dy <= (state.bird.r + a.r) * (state.bird.r + a.r)) {
            if (a.type === "bomb") {
              if (state.effects.shield > 0) {
                state.effects.shield -= 1;
                state.effects.invuln = 0.6; // brief grace
                spawnPop(a.x, a.y, "#111111");
                state.bird.vy = -Math.abs(state.bird.jump * (state.world.h / 600)) * 0.4;
              } else {
                gameOver();
              }
              state.awards.splice(i, 1);
            } else {
              // stars: add to stars counter and score
              const mult = state.effects.double > 0 ? 2 : 1;
              state.stars += a.value;
              state.score += a.value * mult;
              spawnPop(a.x, a.y, a.color || "#f5c400");
              if (!ui.muted) sound.playStar();
              state.awards.splice(i, 1);
            }
          } else if (a.x + a.r < -10) {
            state.awards.splice(i, 1);
          }
        }

        // move & handle POWER-UPS
        for (const pu of state.powerups) {
          pu.t += dt;
          pu.x += (-pipeSpeed) * dt + pu.vx * dt;
          pu.y += pu.vy * dt;
          pu.vx *= 0.985; pu.vy *= 0.985;
        }
        for (let i = state.powerups.length - 1; i >= 0; i--) {
          const pu = state.powerups[i];
          const dx = state.bird.x - pu.x;
          const dy = state.bird.y - pu.y;
          if (dx * dx + dy * dy <= (state.bird.r + pu.r) * (state.bird.r + pu.r)) {
            applyPowerup(pu.type);
            spawnPop(pu.x, pu.y, colorForPowerup(pu.type));
            if (!ui.muted) sound.playPower();
            state.powerups.splice(i, 1);
          } else if (pu.x + pu.r < -10) {
            state.powerups.splice(i, 1);
          }
        }

        // collisions with world & pipes
        const outsideWorld = state.bird.y + state.bird.r >= floorY || state.bird.y - state.bird.r <= 0;
        if (outsideWorld && state.effects.invuln <= 0) {
          gameOver();
        } else if (state.effects.invuln <= 0) {
          for (const p of state.pipes) {
            const pTop = currentPipeTop(p, gap, floorY);
            const withinX = state.bird.x + state.bird.r > p.x && state.bird.x - state.bird.r < p.x + p.w;
            if (withinX) {
              const topClear = state.bird.y - state.bird.r > pTop;
              const bottomClear = state.bird.y + state.bird.r < pTop + p.gap;
              if (!(topClear && bottomClear)) {
                if (state.effects.shield > 0) {
                  state.effects.shield -= 1;
                  state.effects.invuln = 0.9; // ~0.9s grace
                  const safeYMin = pTop + state.bird.r + 4;
                  const safeYMax = pTop + p.gap - state.bird.r - 4;
                  const mid = (safeYMin + safeYMax) / 2;
                  if (!isNaN(mid)) state.bird.y = Math.max(safeYMin, Math.min(safeYMax, mid));
                  state.bird.vy = -Math.abs(state.bird.jump * (state.world.h / 600)) * 0.6;
                } else {
                  gameOver();
                }
                break;
              }
            }
          }
        }
      }
    }

    function currentPipeTop(p, gap, floorY) {
      if (!p.oscAmp) return p.baseTop;
      const t = state.now / 1000;
      const raw = p.baseTop + Math.sin(p.oscPhase + t * p.oscSpeed) * p.oscAmp;
      const minTop = 40;
      const maxTop = floorY - gap - 40;
      return Math.max(minTop, Math.min(maxTop, raw));
    }

    // visual pop particles when collecting awards/powerups
    const pops = [];
    function spawnPop(x, y, color = "#ffd700") {
      for (let i = 0; i < 7; i++) {
        pops.push({ x, y, vx: (Math.random() - 0.5) * 180, vy: -60 - Math.random() * 120, a: 1, r: 2 + Math.random() * 2, color });
      }
    }

    function applyPowerup(type) {
      switch (type) {
        case "shield":
          state.effects.shield = Math.min(3, state.effects.shield + 1); // cap at 3 stacks
          break;
        case "slow":
          state.effects.slow = Math.min(10, state.effects.slow + 6); // seconds
          break;
        case "magnet":
          state.effects.magnet = Math.min(12, state.effects.magnet + 8);
          break;
        case "double":
          state.effects.double = Math.min(10, state.effects.double + 6);
          break;
      }
    }

    function colorForPowerup(type) {
      return type === "shield" ? "#06b6d4"
        : type === "slow" ? "#a855f7"
        : type === "magnet" ? "#f59e0b"
        : "#ef4444"; // double
    }

    function render(ctx) {
      const { w, h } = state.world;
      const floorY = h - state.world.floorH;
      const pipeW = state.speeds.pipeW * (w / 400);
      const theme = themeForScore(state.score);

      // Background gradient (slight hue hint per theme)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      const skyTop = theme.name === "Lava" ? "#ffd0d0"
        : theme.name === "Ice" ? "#d9f2ff"
        : theme.name === "Tech" ? "#efe5ff"
        : theme.name === "Neon" ? "#e0ffff"
        : theme.name === "Obsidian" ? "#f0f0f0"
        : "#87CEEB";
      grad.addColorStop(0, skyTop);
      grad.addColorStop(1, "#e0f7ff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Parallax clouds
      drawCloud(ctx, (state.now / 40) % (w + 120) - 120, h * 0.2, 1.0);
      drawCloud(ctx, (state.now / 60) % (w + 160) - 160, h * 0.35, 0.8);

      // Pipes (themed)
      for (const p of state.pipes) {
        const pTop = currentPipeTop(p, p.gap, floorY);
        drawPipe(ctx, p.x, pTop, p.gap, pipeW, h, state.world.floorH, theme);
      }

      // Awards: stars (three tiers) and bombs
      for (const a of state.awards) {
        if (a.type === "bomb") drawBomb(ctx, a.x, a.y, a.r);
        else drawStar(ctx, a.x, a.y, a.r, a.color || "#f5c400");
      }

      // POWER-UPS
      for (const pu of state.powerups) {
        drawPowerup(ctx, pu.x, pu.y, pu.r, pu.type);
      }

      // Pop particles
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.x += p.vx * (1 / 60);
        p.y += p.vy * (1 / 60);
        p.vy += 120 * (1 / 60);
        p.a -= 0.03;
        if (p.a <= 0) pops.splice(i, 1);
        else {
          ctx.globalAlpha = Math.max(0, p.a);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Floor
      ctx.fillStyle = "#DED59A";
      ctx.fillRect(0, floorY, w, state.world.floorH);
      drawGroundPattern(ctx, w, floorY);

      // Bird
      const r = Math.max(10, state.bird.r * (h / 600));
      const tilt = Math.max(-0.5, Math.min(0.5, state.bird.vy / 600));
      ctx.save();
      ctx.translate(state.bird.x, state.bird.y);
      ctx.rotate(tilt);
      drawBird(ctx, r);
      // shield aura
      if (state.effects.shield > 0) {
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      // invulnerability blink
      if (state.effects.invuln > 0) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(performance.now() / 60);
        ctx.fillStyle = "#06b6d4";
        ctx.beginPath();
        ctx.arc(0, 0, r + 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // UI
      ctx.fillStyle = "#1a1a1a";
      ctx.textBaseline = "top";

      // Center score
      ctx.textAlign = "center";
      ctx.font = "bold 28px ui-sans-serif, system-ui, -apple-system";
      if (state.gameState !== "over") {
        ctx.fillText(String(state.score), w / 2, 16);
      }

      // Power-up HUD – top-right (bars + shields row)
      drawHUD(ctx, w, 12, {
        shield: state.effects.shield,
        slow: state.effects.slow,
        magnet: state.effects.magnet,
        double: state.effects.double,
      });

      if (state.gameState === "ready") {
        drawStartPanel(ctx, w, h);
      } else if (state.gameState === "over") {
        drawGameOver(ctx, w, h, state.score, best);
      }
    }

    // kick off
    resetGame();
    state.last = performance.now();
    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      ro.disconnect();
      sound.stop();
    };
  }, [best]);

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div ref={containerRef} className="w-full max-w-md">
        <canvas
          ref={canvasRef}
          className="rounded-2xl shadow-xl border border-gray-200 touch-manipulation select-none bg-white"
          aria-label="Flappy mobile game canvas"
        />
        <p className="text-center text-sm text-gray-600 mt-2">
          Tap/Click/Space to flap. Press M to mute/unmute. Awards ⭐ spawn tiers at 50/100. Power-ups 🛡️🐌🧲×2.
        </p>
      </div>
    </div>
  );
}
