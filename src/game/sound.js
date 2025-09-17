// src/game/sound.js
// Fast-beat background loop + SFX
export function initSoundEngine(ui) {
  const sound = {
    ctx: null,
    master: null,
    sfx: null,
    music: null,
    filter: null,
    musicTimer: null,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.36;
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 1600;
      this.master.connect(this.filter);
      this.filter.connect(this.ctx.destination);

      this.music = this.ctx.createGain();
      this.music.gain.value = 0.18;
      this.music.connect(this.master);

      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = 1.0;
      this.sfx.connect(this.master);
      ui.audioReady = true;
    },
    setMuted(m) {
      ui.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.36;
    },
    _beep(freq, dur, type = "sine", delay = 0, out = null, gainScale = 1) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = /** @type {OscillatorType} */ (type);
      o.frequency.setValueAtTime(freq, t);
      const peak = 0.22 * gainScale;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(out || this.sfx);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    playStar() {
      this._beep(1200, 0.07, "triangle", 0, this.sfx);
      this._beep(1800, 0.05, "sine", 0.015, this.sfx);
    },
    playPower() {
      this._beep(240, 0.1, "square", 0, this.sfx);
      this._beep(360, 0.12, "sine", 0.03, this.sfx);
    },
    playWind() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const duration = 1.0;
      
      // Create noise for wind sound
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate noise with varying intensity
      for (let i = 0; i < bufferSize; i++) {
        const progress = i / bufferSize;
        const envelope = Math.sin(progress * Math.PI); // Smooth fade in/out
        data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
      }
      
      // Play the noise with a filter sweep
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Add filter for whoosh effect
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(100, now);
      filter.frequency.linearRampToValueAtTime(2000, now + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(100, now + duration);
      filter.Q.value = 1.5;
      
      // Connect and play
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfx);
      
      noise.start(now);
      noise.stop(now + duration);
    },
    startMusic() {
      if (!this.ctx || this.musicTimer) return;
      const bpm = 160;
      const spb = 60 / bpm;
      let i = 0;
      this.musicTimer = setInterval(() => {
        if (!this.ctx) return;
        const step = i % 16;
        this._beep(2600, 0.02, "square", 0, this.music, 0.35); // hat
        if (step === 0 || step === 8) this._beep(90, 0.1, "sine", 0.005, this.music, 0.85); // kick
        if (step === 4 || step === 12) this._beep(520, 0.07, "triangle", 0.01, this.music, 0.65); // snare
        if (step % 4 === 0) {
          const bassSeq = [110, 110, 147, 98];
          const b = bassSeq[(i / 4) % bassSeq.length | 0];
          this._beep(b, 0.18, "square", 0.03, this.music, 0.6);
        }
        i++;
      }, spb * 250); // 16th notes
    },
    stop() {
      if (this.musicTimer) clearInterval(this.musicTimer);
      this.musicTimer = null;
    },
  };
  return sound;
}
