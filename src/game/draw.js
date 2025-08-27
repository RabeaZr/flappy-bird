// src/game/draw.js
// All canvas drawing helpers used by FlappyMobile.

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawGlyphCentered(ctx, text, x, y, font, color = "#fff") {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(text);
  const ascent = m.actualBoundingBoxAscent || 0;
  const descent = m.actualBoundingBoxDescent || 0;
  const yOffset = (ascent - descent) / 2;
  ctx.fillText(text, x, y + yOffset);
  ctx.restore();
}

function colorForPowerup(type) {
  return type === "shield" ? "#06b6d4"
    : type === "slow" ? "#a855f7"
    : type === "magnet" ? "#f59e0b"
    : "#ef4444"; // double
}

export function drawCloud(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.arc(22, -8, 16, 0, Math.PI * 2);
  ctx.arc(44, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGroundPattern(ctx, w, y) {
  ctx.save();
  ctx.strokeStyle = "#c9c089";
  ctx.lineWidth = 2;
  for (let i = 0; i < w; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, y);
    ctx.lineTo(i + 8, y + 8);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBird(ctx, r) {
  ctx.fillStyle = "#FFC107";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  const flap = Math.sin(performance.now() / 120) * 0.4 + 0.6;
  ctx.fillStyle = "#FF9800";
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, 0, r * 0.9, r * 0.5 * flap, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(r * 0.35, -r * 0.25, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.25, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FF5722";
  ctx.beginPath();
  ctx.moveTo(r * 0.6, 0);
  ctx.lineTo(r * 1.05, r * 0.15);
  ctx.lineTo(r * 0.6, r * 0.3);
  ctx.closePath();
  ctx.fill();
}

export function drawStar(ctx, cx, cy, r, color = "#f5c400") {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  const spikes = 5;
  const outer = r;
  const inner = r * 0.5;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawBomb(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.beginPath();
  ctx.moveTo(r * 0.2, -r * 0.4);
  ctx.quadraticCurveTo(r * 0.6, -r * 0.9, r * 0.9, -r * 0.6);
  ctx.stroke();
  ctx.fillStyle = "#ffa500";
  ctx.beginPath();
  ctx.arc(r * 0.95, -r * 0.6, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.2, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPowerup(ctx, x, y, r, type) {
  const color = colorForPowerup(type);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  const fontPx = Math.max(10, Math.round(r * 0.95));
  const label = type === "shield" ? "🛡" : type === "slow" ? "🐌" : type === "magnet" ? "🧲" : "×2";
  drawGlyphCentered(ctx, label, 0, 0, `700 ${fontPx}px ui-sans-serif, system-ui, -apple-system`, "#fff");
  ctx.restore();
}

export function drawHUD(ctx, w, top, vals) {
  const xRight = w - 12;
  let y = top + 8;

  if (vals.shield > 0) {
    drawHUDShields(ctx, xRight, y, vals.shield);
    y += 24;
  }

  const BW = 142;
  const BH = 18;
  if (vals.slow > 0) {
    drawHUDBar(ctx, xRight, y, BW, BH, "#a855f7", vals.slow, 10, "🐌");
    y += 22;
  }
  if (vals.magnet > 0) {
    drawHUDBar(ctx, xRight, y, BW, BH, "#f59e0b", vals.magnet, 12, "🧲");
    y += 22;
  }
  if (vals.double > 0) {
    drawHUDBar(ctx, xRight, y, BW, BH, "#ef4444", vals.double, 10, "×2");
  }
}

function drawHUDShields(ctx, xRight, top, count) {
  const maxIcons = 8;
  const size = 18;
  const pad = 4;
  let x = xRight;
  for (let i = 0; i < Math.min(count, maxIcons); i++) {
    const w = size + 8;
    x -= (w + pad);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    roundRect(ctx, x, top, w, size, 8);
    ctx.fill();
    ctx.fillStyle = "#06b6d4";
    roundRect(ctx, x, top, 6, size, 8);
    ctx.fill();
    drawGlyphCentered(ctx, "🛡️", x + w / 2 + 2, top + size / 2 + 1, "700 14px ui-sans-serif, system-ui, -apple-system", "#111");
  }
  if (count > maxIcons) {
    const w = size + 8;
    x -= (w + pad);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    roundRect(ctx, x, top, w, size, 8);
    ctx.fill();
    drawGlyphCentered(ctx, `+${count - maxIcons}`, x + w / 2, top + size / 2 + 1, "700 12px ui-sans-serif, system-ui, -apple-system", "#111");
  }
}

function drawHUDBar(ctx, xRight, y, w, h, color, remaining, max, label) {
  const x = xRight - w;
  const p = Math.max(0, Math.min(1, remaining / max));
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(4, w * p), h, 8);
  ctx.fill();
  const glyphPx = Math.floor(h * 0.9);
  drawGlyphCentered(ctx, label, x + 16, y + h / 2, `700 ${glyphPx}px ui-sans-serif, system-ui, -apple-system`, "#111");
  ctx.font = "700 12px ui-sans-serif, system-ui, -apple-system";
  ctx.fillStyle = "#111";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const timeText = `${Math.ceil(remaining)}s`;
  const m = ctx.measureText(timeText);
  ctx.fillText(timeText, x + w - 6, y + h / 2 + (m.actualBoundingBoxAscent && m.actualBoundingBoxDescent ? 0 : 1));
  ctx.restore();
}

export function drawStartPanel(ctx, w, h) {
  ctx.save();
  const bw = Math.min(340, w * 0.88);
  const bh = 150;
  const bx = (w - bw) / 2;
  const by = h * 0.25;
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(ctx, bx, by, bw, bh, 16);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.font = "800 28px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText("Flappy Mobile", w / 2, by + 22);

  ctx.font = "600 16px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText("Tap to start", w / 2, by + 62);
  ctx.font = "500 14px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText("Tap / Click / Space / ↑", w / 2, by + 86);
  ctx.fillText("Power-ups: 🛡 🐌 🧲 ×2", w / 2, by + 108);
  ctx.restore();
}

export function drawGameOver(ctx, w, h, score, bestScore) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  const bw = Math.min(360, w * 0.9);
  const bh = 220;
  const bx = (w - bw) / 2;
  const by = h * 0.2;
  roundRect(ctx, bx, by, bw, bh, 18);
  ctx.fill();

  ctx.fillStyle = "#b91c1c";
  ctx.font = "800 30px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText("Game Over", w / 2, by + 48);
  ctx.fillStyle = "#111";
  ctx.font = "600 20px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText(`Score: ${score}`, w / 2, by + 90);
  ctx.fillText(`Best: ${bestScore}`, w / 2, by + 118);

  ctx.font = "500 15px ui-sans-serif, system-ui, -apple-system";
  ctx.fillText("Tap to restart", w / 2, by + 162);
  ctx.restore();
}

export function drawPipe(ctx, x, top, gap, pipeW, h, floorH, theme) {
  ctx.fillStyle = theme.body;
  ctx.fillRect(x, 0, pipeW, top);
  ctx.fillRect(x, top + gap, pipeW, h - (top + gap) - floorH);

  ctx.fillStyle = theme.rim;
  ctx.fillRect(x - 2, top - 12, pipeW + 4, 12);
  ctx.fillRect(x - 2, top + gap, pipeW + 4, 12);

  if (theme.decor === "ice") {
    ctx.fillStyle = "#e8f7ff";
    for (let i = 0; i < pipeW; i += 10) {
      ctx.beginPath();
      ctx.moveTo(x + i + 2, top - 12);
      ctx.lineTo(x + i + 7, top - 12);
      ctx.lineTo(x + i + 4.5, top - 12 + 10);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + i + 2, top + gap + 12);
      ctx.lineTo(x + i + 7, top + gap + 12);
      ctx.lineTo(x + i + 4.5, top + gap + 2);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme.decor === "brick") {
    ctx.strokeStyle = "#7f868c";
    ctx.lineWidth = 1;
    for (let y = 8; y < top; y += 12) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + pipeW, y);
      ctx.stroke();
    }
    for (let y = top + gap + 12; y < h - floorH; y += 12) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + pipeW, y);
      ctx.stroke();
    }
  } else if (theme.decor === "magma") {
    ctx.strokeStyle = "#ffa07a";
    ctx.lineWidth = 2;
    for (let y of [top - 6, top + gap + 6]) {
      ctx.beginPath();
      for (let i = 0; i <= pipeW; i += 6) {
        const yy = y + Math.sin((x + i) / 10) * 2;
        if (i === 0) ctx.moveTo(x + i, yy);
        else ctx.lineTo(x + i, yy);
      }
      ctx.stroke();
    }
  } else if (theme.decor === "grid") {
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    for (let i = 6; i < pipeW; i += 10) {
      ctx.beginPath();
      ctx.moveTo(x + i, 0);
      ctx.lineTo(x + i, top);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + i, top + gap);
      ctx.lineTo(x + i, h - floorH);
      ctx.stroke();
    }
  }
}
