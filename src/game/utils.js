export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawGlyphCentered(ctx, text, x, y, font, color = "#fff") {
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

export function colorForPowerup(type) {
  return type === "shield" ? "#06b6d4" : type === "slow" ? "#a855f7" : type === "magnet" ? "#f59e0b" : "#ef4444";
}

export function seededRNG() {
  let seed = Math.floor(Math.random() * 1e9);
  return {
    next() {
      seed = (1103515245 * seed + 12345) & 0x7fffffff;
      return (seed % 10000) / 10000;
    },
    setSeed(s) { seed = s >>> 0; },
    getSeed() { return seed; }
  }
}

export function randInt(rng, min, max) { return Math.floor(rng.next() * (max - min + 1)) + min; }
