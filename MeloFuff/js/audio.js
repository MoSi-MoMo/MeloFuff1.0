/* MeloFuff — music + candy sound design */
class MeloAudio {
  constructor() {
    this.el = new Audio();
    this.el.src = 'assets/audio/candy-jelly-run.mp3';
    this.el.preload = 'auto';
    this.el.playsInline = true;
    this.el.setAttribute('playsinline', '');
    this.el.volume = 1;

    this.ctx = null;
    this.source = null;
    this.musicGain = null;
    this.filter = null;
    this.analyser = null;
    this.sfxGain = null;
    this.graphReady = false;
    this.graphFailed = false;

    this.muted = false;
    this.paused = false;
    this.offset = 0;
    this.fallbackStart = 0;
    this.started = false;
    this.loadFailed = false;
    this._noise = null;

    try {
      const saved = localStorage.getItem('melofuff-muted');
      if (saved === '1') this.muted = true;
    } catch (e) { /* private mode */ }
  }

  load() {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve(!this.loadFailed);
      };
      this.el.addEventListener('canplaythrough', finish, { once: true });
      this.el.addEventListener('loadeddata', finish, { once: true });
      this.el.addEventListener('error', () => { this.loadFailed = true; finish(); }, { once: true });
      setTimeout(finish, 6000);
      try { this.el.load(); } catch (e) { this.loadFailed = true; finish(); }
    });
  }

  /* Must be called from a user gesture. */
  ensureGraph() {
    if (this.graphReady || this.graphFailed) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.graphFailed = true; return; }
    try {
      this.ctx = new AC();
      this.source = this.ctx.createMediaElementSource(this.el);
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 16000;
      this.filter.Q.value = 0.35;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.muted ? 0 : 0.72;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.muted ? 0 : 0.9;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      this.source.connect(this.filter);
      this.filter.connect(this.musicGain);
      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);

      this.noiseBuffer();
      this.graphReady = true;
    } catch (e) {
      this.graphFailed = true;
    }
  }

  noiseBuffer() {
    if (this._noise || !this.ctx) return this._noise;
    const len = Math.floor(this.ctx.sampleRate * 1.2);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = 0.96 * last + 0.04 * white;
      d[i] = last * 2.2;
    }
    this._noise = buf;
    return buf;
  }

  async startAt(seconds) {
    this.ensureGraph();
    if (this.ctx && this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (e) { /* ignore */ }
    }
    this.offset = seconds;
    this.started = true;
    this.paused = false;
    this.setMood('play', 0.05);
    const seek = () => {
      try { this.el.currentTime = seconds; } catch (e) { /* ignore */ }
    };
    if (this.el.readyState >= 1) seek();
    else this.el.addEventListener('loadedmetadata', seek, { once: true });
    this.fallbackStart = performance.now();
    try {
      await this.el.play();
    } catch (e) {
      // Autoplay can still fail on unusual embeds; game clock will carry on.
    }
  }

  /* Gameplay clock, in seconds since the level's musical start. */
  time() {
    if (!this.started) return 0;
    const t = this.el.currentTime - this.offset;
    if (!isFinite(t) || Math.abs(t - (performance.now() - this.fallbackStart) / 1000) > 1.2) {
      // If the media clock is unavailable (some headless/embedded contexts),
      // fall back to a performance clock.
      return Math.max(0, (performance.now() - this.fallbackStart) / 1000);
    }
    return Math.max(0, t);
  }

  rawTime() {
    return this.el.currentTime || 0;
  }

  pause() {
    this.paused = true;
    try { this.el.pause(); } catch (e) { /* ignore */ }
  }

  resume() {
    this.paused = false;
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    this.el.play().catch(() => {});
  }

  stop() {
    this.started = false;
    try { this.el.pause(); } catch (e) { /* ignore */ }
    try { this.el.currentTime = 0; } catch (e) { /* ignore */ }
  }

  setMood(mood, ramp = 0.8) {
    if (!this.graphReady) return;
    const now = this.ctx.currentTime;
    let freq = 16000, vol = 0.72;
    if (mood === 'ending') { freq = 1050; vol = 0.5; }
    else if (mood === 'curious') { freq = 1800; vol = 0.46; }
    else if (mood === 'swell') { freq = 7200; vol = 0.78; }
    else if (mood === 'final') { freq = 2600; vol = 0.34; }
    else if (mood === 'quiet') { freq = 900; vol = 0.2; }
    this.filter.frequency.cancelScheduledValues(now);
    this.musicGain.gain.cancelScheduledValues(now);
    this.filter.frequency.setTargetAtTime(freq, now, Math.max(0.03, ramp / 3));
    this.musicGain.gain.setTargetAtTime(this.muted ? 0 : vol, now, Math.max(0.03, ramp / 3));
  }

  fadeMusic(to, seconds) {
    if (!this.graphReady) {
      try {
        this.el.volume = U.clamp(to / 0.72, 0, 1);
      } catch (e) { /* ignore */ }
      return;
    }
    const now = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(this.muted ? 0 : to, now + seconds);
  }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('melofuff-muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
    if (this.graphReady) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.setTargetAtTime(m ? 0 : 0.7, now, 0.05);
      this.sfxGain.gain.setTargetAtTime(m ? 0 : 0.9, now, 0.05);
    } else {
      this.el.volume = m ? 0 : 1;
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted) this.sfx('ui');
  }

  /* ---------- synthesized candy SFX ---------- */
  tone(freq, dur = 0.2, opts = {}) {
    if (!this.graphReady || this.muted) return;
    const {
      type = 'sine', gain = 0.04, attack = 0.008, delay = 0, slide = 0,
      pan = 0, detune = 0,
    } = opts;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
    if (detune) osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    if (p) { p.pan.value = pan; g.connect(p); p.connect(this.sfxGain); }
    else g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur = 0.2, opts = {}) {
    if (!this.graphReady || this.muted) return;
    const { gain = 0.02, freq = 2400, q = 1.2, delay = 0, sweep = 0, type = 'bandpass' } = opts;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer() || this.noiseBufferFallback();
    if (!src.buffer) return;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(80, sweep), t0 + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  noiseBufferFallback() {
    return null;
  }

  // D major pentatonic — matches the track's palette.
  chime(step = 0, gain = 0.035, dur = 0.32, type = 'sine') {
    const scale = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51, 1479.98, 1760.0, 1975.53, 2349.32];
    const i = U.clamp(step, 0, scale.length - 1);
    this.tone(scale[i], dur, { type, gain, attack: 0.006 });
    this.tone(scale[i] * 2, dur * 0.6, { type: 'sine', gain: gain * 0.22, attack: 0.004 });
  }

  sfx(name) {
    switch (name) {
      case 'ui':
        this.tone(660, 0.1, { type: 'sine', gain: 0.03, slide: 920 });
        break;
      case 'start':
        [0, 2, 4, 5].forEach((s, i) => setTimeout(() => this.chime(s, 0.04, 0.5), i * 70));
        this.noise(0.5, { freq: 2800, gain: 0.018, sweep: 7000 });
        break;
      case 'jump':
        this.tone(420, 0.18, { type: 'sine', gain: 0.045, slide: 760 });
        this.noise(0.12, { freq: 1200, gain: 0.012, sweep: 2600 });
        break;
      case 'double':
        this.chime(5, 0.035, 0.4);
        this.chime(7, 0.026, 0.35);
        this.noise(0.22, { freq: 3200, gain: 0.014, sweep: 6000 });
        break;
      case 'land':
        this.tone(190, 0.12, { type: 'sine', gain: 0.03, slide: 150 });
        break;
      case 'note': {
        const comboStep = Math.min(7, this._comboStep || 0);
        this.chime(comboStep, 0.032, 0.28);
        this.noise(0.08, { freq: 4200, gain: 0.008, sweep: 7000 });
        break;
      }
      case 'star':
        [3, 5, 7, 9].forEach((s, i) => setTimeout(() => this.chime(s, 0.03, 0.45), i * 55));
        this.noise(0.45, { freq: 4000, gain: 0.016, sweep: 8000 });
        break;
      case 'magnet':
        this.tone(300, 0.55, { type: 'sine', gain: 0.03, slide: 900 });
        this.noise(0.45, { freq: 900, gain: 0.014, sweep: 3600 });
        break;
      case 'balloon':
        this.noise(0.5, { freq: 1800, gain: 0.02, sweep: 800 });
        this.chime(2, 0.028, 0.5);
        break;
      case 'spring':
        this.tone(150, 0.3, { type: 'triangle', gain: 0.055, slide: 720 });
        this.chime(4, 0.03, 0.4);
        break;
      case 'bonus':
        [2, 4, 6, 8].forEach((s, i) => setTimeout(() => this.chime(s, 0.033, 0.5), i * 65));
        this.noise(0.6, { freq: 3600, gain: 0.018, sweep: 9000 });
        break;
      case 'bump':
        this.tone(170, 0.2, { type: 'sine', gain: 0.04, slide: 110 });
        this.noise(0.18, { freq: 500, gain: 0.014, sweep: 250 });
        break;
      case 'milestone':
        [0, 2, 4, 7].forEach((s, i) => setTimeout(() => this.chime(s, 0.03, 0.9), i * 90));
        break;
      case 'finish':
        [0, 2, 4, 5, 7, 9].forEach((s, i) => setTimeout(() => {
          this.chime(s, 0.042, 0.9);
          if (i === 5) this.chime(11, 0.03, 1.4);
        }, i * 105));
        this.noise(1.1, { freq: 2400, gain: 0.016, sweep: 8500 });
        break;
      case 'fall':
        this.tone(620, 0.5, { type: 'sine', gain: 0.03, slide: 180 });
        this.noise(0.4, { freq: 600, gain: 0.012, sweep: 300 });
        break;
      case 'cloud':
        this.tone(240, 0.5, { type: 'sine', gain: 0.03, slide: 520 });
        this.noise(0.55, { freq: 1000, gain: 0.014, sweep: 2000 });
        break;
      case 'skip':
        this.tone(520, 0.18, { type: 'sine', gain: 0.03, slide: 780 });
        break;
      default:
        break;
    }
  }

  setComboStep(n) {
    this._comboStep = n;
  }

  getLevel() {
    if (!this.analyser) return 0;
    const arr = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(arr);
    let s = 0;
    for (let i = 2; i < 32; i++) s += arr[i];
    return s / (30 * 255);
  }
}
