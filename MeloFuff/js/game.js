/* MeloFuff — Level 1: Sweet Sugar Hills */
const LEVEL = {
  seconds: 58,
  musicOffset: 18,
  groundY: 566,
  bpm: 108,
  beat: 60 / 108,
  playerR: 60,
  feet: 59,
};

const SENSES = [
  { kind: 'eye', name: '眼睛', line: '看见彩虹糖', color: '#FF87A5', soft: '#FFE1E9' },
  { kind: 'ear', name: '耳朵', line: '听见果冻心跳', color: '#6FC8A7', soft: '#DFF7EE' },
  { kind: 'nose', name: '鼻子', line: '闻到棉花糖云', color: '#E0A45C', soft: '#FFF0D7' },
  { kind: 'mouth', name: '嘴巴', line: '尝到草莓微风', color: '#DE7292', soft: '#FFE5EC' },
  { kind: 'hand', name: '手', line: '抱抱软软的糖', color: '#9E7FDA', soft: '#EFE6FD' },
];
const SENSE_THRESHOLDS = [0.15, 0.32, 0.5, 0.7, 0.9];

class MeloGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maxRenderCap = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderCap = this.maxRenderCap;
    this.dpr = this.maxRenderCap;
    this.perfAccum = 0;
    this.view = { scale: 1, ox: 0, oy: 0, cssW: 0, cssH: 0 };
    this.audio = new MeloAudio();
    this.themeIndex = 0;
    this.character = new MeloFuff(0);
    this.world = new CandyWorld();
    this.state = 'boot';
    this.ready = false;
    this.time = 0;
    this.pointer = { x: -100, y: -100, inside: false, type: 'mouse' };
    this.touch = U.isTouch();
    this.keys = {};
    this.jumpHeld = false;
    this.brake = false;
    this.boost = false;
    this.flash = 0;
    this.shake = 0;
    this.endTimer = 0;
    this.last = performance.now();
    this.fpsSmooth = 60;
    this.endFade = false;
    this.pauseButtons = null;

    this.player = null;
    this.camera = { x: 0 };
    this.particles = [];
    this.floaters = [];
    this.fallingNotes = [];
    this.toasts = [];
    this.senseBanner = null;
    this.lastBeat = -1;
    this.beatPulse = 0;
    this.levelTime = 0;
    this.clusterTimer = 0;
    this.startBanner = 0;
    this.finish = null;
    this.ending = null;
    this.quiz = null;
    this.customTheme = null;
    this.debugMode = false;

    this.runStats = { notes: 0, maxCombo: 0, senses: 0 };
    this.title = null;
    this.buttons = {};

    this.bindEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    requestAnimationFrame((ts) => this.loop(ts));
    this.boot();
    window.__MELO__ = this;
  }

  async boot() {
    const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
    try {
      await Promise.all([
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        document.fonts && document.fonts.load ? document.fonts.load('40px "ZCOOL KuaiLe"') : Promise.resolve(),
        document.fonts && document.fonts.load ? document.fonts.load('40px "Baloo 2"') : Promise.resolve(),
        this.audio.load(),
      ]);
    } catch (e) { /* fonts/audio are best-effort */ }
    await timeout(260);

    const bootEl = document.getElementById('boot');
    if (bootEl) bootEl.classList.add('hide');
    this.title = new TitleScene(this);
    this.state = 'title';
    this.ready = true;

    const params = new URLSearchParams(location.search);
    const skin = parseInt(params.get('skin'), 10);
    if (Number.isFinite(skin)) this.setTheme(U.clamp(skin, 0, MELO_THEMES.length - 1));
    if (params.get('scene') === 'play') {
      setTimeout(() => this.startRun(), 120);
    } else if (params.get('scene') === 'quiz') {
      setTimeout(() => this.startQuiz(), 120);
    } else if (params.get('scene') === 'ending') {
      setTimeout(() => {
        this.debugEnding(parseFloat(params.get('et') || '0') || 0);
      }, 120);
    }
  }

  resize() {
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.renderCap);
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    const scale = Math.min(cssW / U.W, cssH / U.H);
    this.view = {
      scale,
      ox: (cssW - U.W * scale) / 2,
      oy: (cssH - U.H * scale) / 2,
      cssW,
      cssH,
    };
  }

  /* =========================================================
     input
     ========================================================= */

  bindEvents() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointerleave', () => {
      this.pointer.inside = false;
      this.canvas.style.cursor = 'default';
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.togglePause(true);
    });
    window.addEventListener('blur', () => {
      if (this.state === 'playing') this.togglePause(true);
    });
  }

  logicalFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * this.canvas.width / this.dpr;
    const y = ((e.clientY - rect.top) / rect.height) * this.canvas.height / this.dpr;
    // account for the letterboxed 1280x720 stage
    return {
      x: (x - this.view.ox) / this.view.scale,
      y: (y - this.view.oy) / this.view.scale,
    };
  }

  onPointerDown(e) {
    if (!this.ready) return;
    e.preventDefault();
    this.audio.ensureGraph();
    const p = this.logicalFromEvent(e);
    this.pointer.x = p.x;
    this.pointer.y = p.y;
    this.pointer.inside = true;
    this.pointer.type = e.pointerType;
    if (p.x < 0 || p.x > U.W || p.y < 0 || p.y > U.H) return;
    this.startPointerTime = performance.now();

    // global mute
    if (Math.hypot(p.x - 1218, p.y - 44) < 34) {
      this.audio.toggleMute();
      return;
    }

    if (this.state === 'quiz' && this.quiz) {
      this.quiz.onPointer(p.x, p.y);
      return;
    }

    if (this.state === 'title') {
      if (this.title && this.title.useStart(p.x, p.y)) {
        this.audio.sfx('ui');
        this.startQuiz();
        return;
      }
      if (this.title && this.title.useSkip(p.x, p.y)) {
        this.audio.sfx('ui');
        this.startRun();
        return;
      }
      const sw = this.title && this.title.swatchAt(p.x, p.y);
      if (sw !== null && sw !== undefined) {
        this.setTheme(sw);
        this.audio.sfx('ui');
        return;
      }
      if (this.title && this.title.charAt(p.x, p.y)) {
        this.title.poke();
        return;
      }
      return;
    }

    if (this.state === 'playing') {
      if (Math.hypot(p.x - 1160, p.y - 44) < 34) {
        this.togglePause(true);
        return;
      }
      if (this.touch) {
        if (Math.hypot(p.x - 1180, p.y - 610) < 70) {
          this.pressJump(true);
          this.touchJumpPointer = e.pointerId;
          return;
        }
        if (Math.hypot(p.x - 92, p.y - 620) < 54) {
          this.brake = true;
          this.touchBrakePointer = e.pointerId;
          return;
        }
        // generous mobile input: tapping the candy scene jumps too
        if (p.y > 150) {
          this.pressJump(true);
          this.touchJumpPointer = e.pointerId;
        }
      } else if (p.y > 126) {
        this.pressJump(true);
        this.mouseJumpPointer = e.pointerId;
      }
      return;
    }

    if (this.state === 'paused') {
      const b = this.pauseButtons;
      if (!b) return;
      if (U.pointInRect(p.x, p.y, b.resume)) { this.togglePause(false); this.audio.sfx('ui'); return; }
      if (U.pointInRect(p.x, p.y, b.restart)) { this.audio.sfx('ui'); this.startRun(); return; }
      if (U.pointInRect(p.x, p.y, b.title)) { this.audio.sfx('ui'); this.goTitle(); return; }
      return;
    }

    if (this.state === 'ending' && this.ending) {
      if (this.ending.replayAt(p.x, p.y)) {
        this.audio.sfx('ui');
        this.startRun();
        return;
      }
      if (this.ending.skipAt(p.x, p.y)) {
        this.audio.sfx('skip');
        this.ending.skip();
        return;
      }
    }
  }

  onPointerUp(e) {
    if (this.touchJumpPointer === e.pointerId || this.mouseJumpPointer === e.pointerId) {
      this.touchJumpPointer = null;
      this.mouseJumpPointer = null;
      this.releaseJump();
    }
    if (this.touchBrakePointer === e.pointerId) {
      this.touchBrakePointer = null;
      this.brake = false;
    }
  }

  onPointerMove(e) {
    const p = this.logicalFromEvent(e);
    this.pointer.x = p.x;
    this.pointer.y = p.y;
    this.pointer.inside = p.x >= 0 && p.x <= U.W && p.y >= 0 && p.y <= U.H;
    this.pointer.type = e.pointerType;
    this.updateCursor();
  }

  updateCursor() {
    if (!this.pointer.inside) { this.canvas.style.cursor = 'default'; return; }
    const p = this.pointer;
    let hand = false;
    if (Math.hypot(p.x - 1218, p.y - 44) < 34) hand = true;
    if (this.state === 'quiz' && this.quiz) {
      if (this.quiz.isInteractive(p.x, p.y)) hand = true;
    } else if (this.state === 'title' && this.title) {
      if (this.title.useStart(p.x, p.y) || this.title.useSkip(p.x, p.y)) hand = true;
      const sw = this.title.swatchAt(p.x, p.y);
      if (sw !== null && sw !== undefined) hand = true;
      if (this.title.charAt(p.x, p.y)) hand = true;
    } else if (this.state === 'playing') {
      if (Math.hypot(p.x - 1160, p.y - 44) < 34) hand = true;
      if (this.touch && (Math.hypot(p.x - 1180, p.y - 610) < 70 || Math.hypot(p.x - 92, p.y - 620) < 54)) hand = true;
    } else if (this.state === 'paused' && this.pauseButtons) {
      const b = this.pauseButtons;
      if (U.pointInRect(p.x, p.y, b.resume) || U.pointInRect(p.x, p.y, b.restart) || U.pointInRect(p.x, p.y, b.title)) hand = true;
    } else if (this.state === 'ending' && this.ending) {
      if (this.ending.replayAt(p.x, p.y) || this.ending.skipAt(p.x, p.y)) hand = true;
    }
    this.canvas.style.cursor = hand ? 'pointer' : 'default';
  }

  onKeyDown(e) {
    const code = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
    if (e.repeat) {
      // movement keys can be held
      if (code === 'ArrowLeft' || code === 'KeyA') this.brake = true;
      if (code === 'ArrowRight' || code === 'KeyD') this.boost = true;
      return;
    }
    if (code === 'KeyM') { this.audio.toggleMute(); return; }

    if (this.state === 'quiz' && this.quiz) {
      this.quiz.onKey(code, e);
      return;
    }

    if (this.state === 'title' && code === 'KeyS') {
      this.startRun();
      return;
    }

    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'Enter') {
      if (this.state === 'title') { this.startQuiz(); return; }
      if (this.state === 'paused') { this.togglePause(false); return; }
      if (this.state === 'playing') { this.pressJump(true); return; }
      if (this.state === 'ending' && this.ending && this.ending.t < 11.2) {
        this.ending.skip();
        return;
      }
    }
    if (code === 'Escape' || code === 'KeyP') {
      if (this.state === 'playing') this.togglePause(true);
      else if (this.state === 'paused') this.togglePause(false);
      return;
    }
    if (code === 'KeyR') {
      if (this.state === 'playing' || this.state === 'paused' || this.state === 'ending') {
        this.startRun();
      }
      return;
    }
    if ((code === 'ArrowLeft' || code === 'KeyA')) this.brake = true;
    if ((code === 'ArrowRight' || code === 'KeyD')) this.boost = true;
    if (this.state === 'title' && /^Digit[1-4]$/.test(code)) {
      this.setTheme(parseInt(code.slice(5), 10) - 1);
      this.audio.sfx('ui');
    }
  }

  onKeyUp(e) {
    const code = e.code;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') this.releaseJump();
    if (code === 'ArrowLeft' || code === 'KeyA') this.brake = false;
    if (code === 'ArrowRight' || code === 'KeyD') this.boost = false;
  }

  pressJump(down) {
    if (this.state !== 'playing' || !this.player) return;
    if (down) {
      this.jumpHeld = true;
      this.player.jumpBuffer = 0.14;
    }
  }

  releaseJump() {
    this.jumpHeld = false;
    if (this.player && this.player.vy < -360) this.player.vy = -360;
  }

  setTheme(i) {
    this.themeIndex = i;
    this.customTheme = null;
    this.character.setTheme(i);
    if (this.title) this.title.themeIndex = i;
    this.audio.ensureGraph();
  }

  setThemeData(theme) {
    this.customTheme = theme;
    this.themeIndex = -1;
    this.character.setThemeData(theme);
    this.audio.ensureGraph();
  }

  startQuiz() {
    if (!this.ready) return;
    if (this.quiz) this.quiz.dispose();
    this.audio.ensureGraph();
    this.audio.stop();
    this.audio.sfx('ui');
    this.state = 'quiz';
    this.quiz = new QuizScene(this);
    if (this.pointer.inside) this.updateCursor();
  }

  /* =========================================================
     run lifecycle
     ========================================================= */

  startRun() {
    if (!this.ready) return;
    if (this.quiz) { this.quiz.dispose(); this.quiz = null; }
    this.audio.ensureGraph();
    this.audio.sfx('start');
    this.resetRun();
    this.state = 'playing';
    this.audio.startAt(LEVEL.musicOffset);
    this.flash = 1;
    this.startBanner = 2.8;
    this.audio.setMood('play', 0.8);
    if (this.pointer.inside) this.updateCursor();
  }

  resetRun() {
    this.world.reset();
    this.player = {
      x: 0,
      y: LEVEL.groundY - LEVEL.feet,
      vy: 0,
      grounded: true,
      jumpsUsed: 0,
      coyote: 0.1,
      jumpBuffer: 0,
      speed: 290,
      runPhase: 0,
      stamina: 100,
      notes: 0,
      combo: 0,
      comboTimer: 0,
      maxCombo: 0,
      speedTier: 0,
      squash: 1,
      tumble: 0,
      invuln: 0,
      magnet: 0,
      balloon: 0,
      recover: null,
      spin: 0,
      lastSafeX: 0,
      lowWarned: false,
      stepTimer: 0,
      burstTimer: 0,
      expressionT: 0,
    };
    this.camera.x = -360;
    this.levelTime = 0;
    this.lastBeat = -1;
    this.beatPulse = 0;
    this.startBanner = 0;
    this.particles = [];
    this.floaters = [];
    this.fallingNotes = [];
    this.toasts = [];
    this.senseBanner = null;
    this.sensesReached = 0;
    this.senseIndex = 0;
    this.runStats = { notes: 0, maxCombo: 0, senses: 0 };
    this.finish = null;
    this.finishTimer = 0;
    this.ending = null;
    this.endFade = false;
    this.endFadeTimer = 0;
    this.flash = 0;
    this.shake = 0;
    this.brake = false;
    this.boost = false;
    this.jumpHeld = false;
    this.touchJumpPointer = null;
    this.touchBrakePointer = null;
    this.pauseButtons = null;
  }

  goTitle() {
    if (this.quiz) { this.quiz.dispose(); this.quiz = null; }
    this.audio.stop();
    this.audio.setMood('play', 0.1);
    this.state = 'title';
    this.title = new TitleScene(this);
    this.ending = null;
    this.player = null;
    if (this.pointer.inside) this.updateCursor();
  }

  togglePause(force) {
    if (this.state === 'playing' && force !== false) {
      this.state = 'paused';
      this.audio.pause();
      this.jumpHeld = false;
      this.brake = false;
      this.boost = false;
      this.audio.sfx('ui');
    } else if (this.state === 'paused' && force !== true) {
      this.state = 'playing';
      this.audio.resume();
      this.audio.sfx('ui');
    }
  }

  /* =========================================================
     main loop
     ========================================================= */

  loop(ts) {
    const rawDt = (ts - this.last) / 1000;
    this.last = ts;
    const dt = U.clamp(rawDt || 0.016, 0.0001, 0.05);
    this.fpsSmooth = U.lerp(this.fpsSmooth, 1 / Math.max(dt, 0.001), 0.05);
    this.time += dt;
    this.perfAccum += dt;
    if (this.perfAccum > 2.4) {
      this.perfAccum = 0;
      // adaptive resolution: stay crisp when the device can afford it
      if (this.fpsSmooth < 48 && this.renderCap > 1.001) {
        this.renderCap = Math.max(1, this.renderCap - 0.25);
        this.resize();
      }
    }
    this.flash = Math.max(0, this.flash - dt * 1.7);
    this.shake = Math.max(0, this.shake - dt * 3.2);

    if (this.state === 'title' && this.title) {
      this.character.update(dt);
      this.title.update(dt, this.pointer);
      this.updateToasts(dt);
    } else if (this.state === 'quiz' && this.quiz) {
      this.character.update(dt);
      this.quiz.update(dt, this.pointer);
    } else if (this.state === 'playing') {
      this.character.update(dt);
      this.updatePlaying(dt);
    } else if (this.state === 'finishing') {
      this.character.update(dt);
      this.updateFinishing(dt);
    } else if (this.state === 'ending' && this.ending) {
      this.character.update(dt);
      this.ending.update(dt, this.pointer);
      this.updateEndingAudio();
    } else if (this.state === 'paused') {
      // frozen; only the pause UI breathes
      this.character.update(dt * 0.2);
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  /* =========================================================
     gameplay update
     ========================================================= */

  updatePlaying(dt) {
    const p = this.player;
    if (!p) return;
    const lt = U.clamp(this.audio.time(), 0, LEVEL.seconds + 2);
    this.levelTime = Math.min(LEVEL.seconds, lt);

    // timers
    p.invuln = Math.max(0, p.invuln - dt);
    p.tumble = Math.max(0, p.tumble - dt);
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    if (p.magnet > 0) p.magnet = Math.max(0, p.magnet - dt);
    if (p.balloon > 0) p.balloon = Math.max(0, p.balloon - dt);
    p.squash = U.damp(p.squash, 1, 12, dt);
    p.spin = Math.max(0, p.spin - dt * 2.5);
    if (p.comboTimer > 0) {
      p.comboTimer -= dt;
      if (p.comboTimer <= 0) p.combo = 0;
    }

    // stamina
    if (!p.recover) {
      p.stamina = U.clamp(p.stamina - dt * 0.82, 0, 100);
      if (p.stamina < 18 && !p.lowWarned) {
        p.lowWarned = true;
        this.addToast('有点累啦… 接住音符补充体力', 'warn');
      }
      if (p.stamina > 40) p.lowWarned = false;
    }

    if (p.recover) {
      this.updateRecovery(dt);
    } else {
      this.updatePhysics(dt, lt);
      this.updateProps(dt);
      this.updateFixedNotes();
      this.updateFallingNotes(dt);
      this.updateNotesSpawner(lt);
    }

    // sense milestones / speed states / progress
    const progress = U.clamp(lt / LEVEL.seconds, 0, 1);
    while (this.senseIndex < SENSE_THRESHOLDS.length && progress >= SENSE_THRESHOLDS[this.senseIndex]) {
      this.reachSense(this.senseIndex);
      this.senseIndex++;
    }
    this.updateSpeedTier();
    this.runStats.notes = p.notes;
    this.runStats.maxCombo = p.maxCombo;
    this.runStats.senses = this.senseIndex;

    // beat & ambience
    this.beatPulse = Math.max(0, this.beatPulse - dt * 3.1);
    if (p.grounded && !p.recover) {
      p.stepTimer -= dt;
      if (p.stepTimer <= 0) {
        p.stepTimer = 0.12;
        this.spawnDust();
      }
    }

    // camera
    const targetCam = p.x - 360;
    this.camera.x = U.damp(this.camera.x, targetCam, 7.5, dt);

    // character animation
    p.runPhase += dt * (9 + p.speed / 90);

    // particles, tutorials, banner
    this.updateParticles(dt);
    this.updateToasts(dt);
    this.startBanner = Math.max(0, this.startBanner - dt);
    if (this.senseBanner) {
      this.senseBanner.t += dt;
      if (this.senseBanner.t > 3.2) this.senseBanner = null;
    }

    if (lt >= LEVEL.seconds) this.beginFinish();
  }

  updatePhysics(dt, lt) {
    const p = this.player;
    const progress = lt / LEVEL.seconds;
    const base = 286 + progress * 106;
    let speed = base;
    if (p.speedTier === 1) speed *= 1.065;
    else if (p.speedTier >= 2) speed *= 1.135;
    if (p.tumble > 0) speed *= 0.6;
    if (p.stamina < 14) speed *= 0.84;
    if (this.brake) speed *= 0.68;
    if (this.boost) speed *= 1.055;
    p.speed = speed;

    p.coyote = p.grounded ? 0.1 : Math.max(0, p.coyote - dt);

    // support check for walking off edges
    if (p.grounded) {
      const feet = p.y + LEVEL.feet;
      let supported = false;
      if (!this.world.isPit(p.x) && feet <= LEVEL.groundY + 3 && feet >= LEVEL.groundY - 8) supported = true;
      if (!supported) {
        for (const plat of this.world.platforms) {
          if (p.x > plat.x - 14 && p.x < plat.x + plat.w + 14 && Math.abs(feet - plat.y) < 6) {
            supported = true;
            break;
          }
        }
      }
      if (!supported) {
        p.grounded = false;
        p.coyote = 0.1;
      }
    }

    p.x += speed * dt;

    // jump
    if (p.jumpBuffer > 0) {
      const maxJumps = p.balloon > 0 ? 3 : 2;
      if (p.tumble <= 0) {
        if (p.grounded || p.coyote > 0) {
          const power = 900 + Math.min(70, p.notes * 0.8);
          p.vy = -power;
          p.grounded = false;
          p.coyote = 0;
          p.jumpsUsed = 1;
          p.jumpBuffer = 0;
          p.squash = 1.14;
          this.audio.sfx('jump');
          this.burst(p.x, p.y + LEVEL.feet, 7, { world: true, color: this.character.theme.cream, spread: 55, speed: 90, life: 0.5, puff: true });
        } else if (p.jumpsUsed < maxJumps) {
          const power = 840 + Math.min(60, p.notes * 0.6);
          p.vy = -power;
          p.jumpsUsed++;
          p.jumpBuffer = 0;
          p.spin = 1;
          p.squash = 1.1;
          this.audio.sfx('double');
          this.burst(p.x, p.y + 20, 14, { world: true, sparkle: true, spread: 70, speed: 170, life: 0.65 });
        }
      }
    }

    // vertical
    const prevFeet = p.y + LEVEL.feet;
    if (!p.grounded) {
      let gravity = 2380;
      if (p.balloon > 0 && this.jumpHeld && p.vy > 0) gravity *= 0.33;
      p.vy += gravity * dt;
      if (p.balloon > 0 && this.jumpHeld && p.vy > 175) p.vy = 175;
      p.y += p.vy * dt;
    }

    // landing / collisions
    const feet = p.y + LEVEL.feet;
    if (p.vy >= 0) {
      // one-way platforms
      for (const plat of this.world.platforms) {
        if (p.x > plat.x - 16 && p.x < plat.x + plat.w + 16) {
          if (prevFeet <= plat.y + 2 && feet >= plat.y && p.y < plat.y + 30) {
            p.y = plat.y - LEVEL.feet;
            this.land(300);
            break;
          }
        }
      }
      // ground (only if not over a jelly river)
      if (!p.grounded && !this.world.isPit(p.x) && feet >= LEVEL.groundY) {
        p.y = LEVEL.groundY - LEVEL.feet;
        this.land(Math.abs(p.vy));
      }
    }

    // fell into a jelly river
    if (p.y > LEVEL.groundY + 90 && !p.recover) {
      this.beginRecovery();
    }

    if (p.grounded) {
      p.lastSafeX = p.x;
      p.jumpsUsed = 0;
      p.coyote = 0.1;
    }

    // obstacle interaction
    this.checkObstacles();
  }

  land(impact) {
    const p = this.player;
    const wasFalling = !p.grounded && p.vy > 120;
    p.grounded = true;
    p.vy = 0;
    p.jumpsUsed = 0;
    p.squash = 0.84;
    if (wasFalling) {
      this.audio.sfx('land');
      this.burst(p.x, p.y + LEVEL.feet, 8, {
        world: true, color: '#FFF6E4', spread: 65, speed: 95, life: 0.5, puff: true,
      });
      this.shake = Math.min(3, this.shake + 1);
    }
  }

  checkObstacles() {
    const p = this.player;
    if (!p || p.recover) return;
    for (const o of this.world.obstacles) {
      if (p.x < o.x - 20 || p.x > o.x + o.w + 20) continue;
      const feet = p.y + LEVEL.feet;
      const top = o.y;
      // landing on top = squishy bounce
      if (p.vy >= 0 && feet >= top - 4 && feet <= top + 28) {
        p.y = top - LEVEL.feet;
        p.vy = -690;
        p.grounded = false;
        p.jumpsUsed = 1;
        p.squash = 0.9;
        this.audio.sfx('spring');
        this.burst(p.x, top, 12, { world: true, sparkle: true, spread: 80, speed: 150, life: 0.6 });
        this.addFloater(p.x, top - 20, '弹～', '#E58AA6');
        p.invuln = 0.4;
        return;
      }
      // side bump: soft stumble, never a fail
      if (p.invuln <= 0 && feet > top + 16 && p.y < o.y + o.h) {
        p.tumble = 0.42;
        p.invuln = 1.05;
        p.squash = 0.9;
        p.combo = 0;
        p.comboTimer = 0;
        p.stamina = U.clamp(p.stamina - 4, 0, 100);
        this.audio.sfx('bump');
        this.shake = 3.5;
        this.burst(p.x + 24, p.y + 10, 14, {
          world: true, color: '#FFD7E3', spread: 80, speed: 150, life: 0.65, puff: true,
        });
        this.addToast('软软的撞了一下～ 没关系', 'soft');
        return;
      }
    }
  }

  beginRecovery() {
    const p = this.player;
    const pit = this.world.pitAfter(p.x) || { x: p.x - 80, w: 160 };
    p.recover = {
      t: 0,
      dur: 1.15,
      fromX: p.x,
      fromY: p.y,
      toX: pit.x + pit.w + 90,
      rise: LEVEL.groundY - 250,
    };
    p.vy = 0;
    p.grounded = false;
    p.combo = 0;
    p.comboTimer = 0;
    p.stamina = U.clamp(p.stamina - 7, 0, 100);
    p.jumpsUsed = 0;
    this.audio.sfx('fall');
    this.addToast('棉花糖云接住你啦 ♡', 'cloud');
    setTimeout(() => this.audio.sfx('cloud'), 320);
  }

  updateRecovery(dt) {
    const p = this.player;
    const r = p.recover;
    r.t += dt;
    const k = U.clamp(r.t / r.dur, 0, 1);
    p.x = U.lerp(r.fromX, r.toX, U.easeInOutCubic(k));
    p.y = U.lerp(r.fromY, r.rise, U.easeOutCubic(Math.min(1, k * 1.6))) - Math.sin(k * Math.PI) * 40;
    if (k >= 1) {
      p.recover = null;
      p.y = r.rise;
      p.vy = 60;
      p.invuln = 1.0;
      p.squash = 1.06;
    }
    p.runPhase += dt * 8;
    this.camera.x = U.damp(this.camera.x, p.x - 360, 6, dt);
    this.updateParticles(dt);
    this.updateToasts(dt);
    this.startBanner = Math.max(0, this.startBanner - dt);
    if (this.senseBanner) {
      this.senseBanner.t += dt;
      if (this.senseBanner.t > 3.2) this.senseBanner = null;
    }
  }

  /* ---------- notes ---------- */

  updateNotesSpawner(lt) {
    const beatIndex = Math.floor(lt / LEVEL.beat);
    if (beatIndex === this.lastBeat) return;
    this.lastBeat = beatIndex;
    this.beatPulse = 1;

    if (lt > 1.6 && lt < 56 && beatIndex % 2 === 0) {
      const p = this.player;
      const star = beatIndex % 16 === 0 && beatIndex > 0;
      this.spawnFallingNote(star);
      if (beatIndex % 8 === 4) this.spawnFallingNote(false);
      // a tiny visual heartbeat
      if (beatIndex % 8 === 0) {
        this.burst(p.x + 620, 120, 3, {
          world: true, color: '#FFF3D4', spread: 80, speed: 40, life: 0.7, puff: true,
        });
      }
    }
  }

  spawnFallingNote(star, offset = 0) {
    if (this.fallingNotes.length > 16) return;
    const p = this.player;
    const r = Math.random();
    const x = p.x + 640 + offset + r * 290;
    const targetY = 300 + Math.random() * 210;
    this.fallingNotes.push({
      x,
      y: -30 - Math.random() * 30,
      vy: 82 + Math.random() * 70,
      targetY,
      kind: star ? 'star' : 'note',
      value: star ? 3 : 1,
      phase: Math.random() * U.TAU,
      taken: false,
      fall: 1,
    });
  }

  updateFallingNotes(dt) {
    const p = this.player;
    const cam = this.camera.x;
    for (let i = this.fallingNotes.length - 1; i >= 0; i--) {
      const n = this.fallingNotes[i];
      if (n.taken) { this.fallingNotes.splice(i, 1); continue; }
      if (n.y < n.targetY) {
        n.y += n.vy * dt;
        n.vy += 8 * dt;
        if (n.y > n.targetY) n.y = n.targetY;
      } else {
        n.y = n.targetY + Math.sin(this.time * 2 + n.phase) * 5;
      }
      if (n.x < cam - 160) { this.fallingNotes.splice(i, 1); continue; }
      const dy = n.y - p.y;
      const dx = n.x - p.x;
      const dist = Math.hypot(dx, dy);
      const magnetRange = p.magnet > 0 ? 330 : 0;
      const grab = n.kind === 'star' ? 78 : 64;
      if (dist < grab || (magnetRange && dist < magnetRange)) {
        this.collectNote(n);
        this.fallingNotes.splice(i, 1);
      }
    }
  }

  updateFixedNotes() {
    const p = this.player;
    for (const n of this.world.fixedNotes) {
      if (n.taken) continue;
      if (Math.abs(n.x - p.x) > 460) continue;
      const ny = n.baseY + Math.sin(this.time * 2.4 + n.phase) * 5;
      const dist = Math.hypot(n.x - p.x, ny - p.y);
      const grab = n.kind === 'star' ? 80 : 66;
      if (dist < grab || (p.magnet > 0 && dist < 340)) this.collectNote(n, ny);
    }
  }

  collectNote(n, yOverride) {
    if (n.taken) return;
    n.taken = true;
    const p = this.player;
    const star = n.kind === 'star';
    const value = n.value || 1;
    p.notes += value;
    p.stamina = U.clamp(p.stamina + (star ? 6 : 2.0), 0, 100);
    p.combo += 1;
    p.comboTimer = 2.35;
    p.maxCombo = Math.max(p.maxCombo, p.combo);
    this.audio.setComboStep(p.combo % 9);
    this.audio.sfx(star ? 'star' : 'note');
    const y = yOverride || n.y || n.baseY || p.y;
    const sx = n.x;
    this.burst(sx, y, star ? 20 : 9, {
      world: true,
      sparkle: star,
      hearts: star,
      color: star ? '#FFE6A0' : '#FFB6CC',
      spread: star ? 110 : 60,
      speed: star ? 220 : 130,
      life: star ? 0.8 : 0.5,
    });
    this.addFloater(sx, y - 18, star ? '+3 ✦' : '+1', star ? '#F0AE4C' : '#E8879F');
    if (p.combo > 0 && p.combo % 10 === 0) {
      this.audio.sfx('milestone');
      this.addFloater(p.x, p.y - 80, `连击 ×${p.combo}`, '#E58AA5', 1.1);
      this.burst(p.x, p.y - 20, 18, {
        world: true, sparkle: true, spread: 110, speed: 190, life: 0.9,
      });
    }
    if (star) {
      this.shake = Math.max(this.shake, 1.5);
    }
  }

  updateSpeedTier() {
    const p = this.player;
    let tier = 0;
    if (p.notes >= 75) tier = 2;
    else if (p.notes >= 30) tier = 1;
    if (tier > p.speedTier) {
      p.speedTier = tier;
      this.audio.sfx('star');
      this.audio.setMood('play', 0.4);
      this.burst(p.x, p.y, 34, {
        world: true, sparkle: true, hearts: true, spread: 130, speed: 260, life: 1.2,
      });
      this.addFloater(p.x, p.y - 100, tier === 1 ? '轻快起来啦！' : '甜度飞扬！', '#E985A5', 1.4);
      this.addToast(tier === 1 ? '节奏加速 · 音绒仔轻快起来啦' : '甜度满格 · 进入飞扬加速！', 'speed');
      this.shake = Math.max(this.shake, 1.2);
    }
  }

  updateProps(dt) {
    const p = this.player;
    for (const prop of this.world.props) {
      if (!prop.active) continue;
      if (prop.cooldown) { prop.cooldown = Math.max(0, prop.cooldown - dt); }
      if (Math.abs(prop.x - p.x) > 220) continue;
      if (prop.type === 'spring') {
        if (prop.cooldown > 0) continue;
        const feet = p.y + LEVEL.feet;
        if (Math.abs(prop.x - p.x) < 54 && feet > prop.y - 100 && feet < prop.y + 24 && p.vy >= -120) {
          p.y = prop.y - LEVEL.feet - 32;
          p.vy = -1280;
          p.grounded = false;
          p.jumpsUsed = 1;
          p.squash = 1.16;
          prop.cooldown = 0.9;
          this.audio.sfx('spring');
          this.shake = 2.5;
          this.burst(prop.x, prop.y - 26, 18, {
            world: true, sparkle: true, spread: 100, speed: 220, life: 0.8,
          });
          this.addFloater(prop.x, prop.y - 110, '跳跳糖！', '#E58AA5', 1.1);
        }
      } else {
        const dy = prop.y - 36 - p.y;
        if (Math.hypot(prop.x - p.x, dy) < 72) {
          prop.active = false;
          if (prop.type === 'magnet') {
            p.magnet = Math.max(p.magnet, 0) + 8;
            this.audio.sfx('magnet');
            this.addToast('葡萄果冻磁铁 · 音符都被吸过来啦', 'magnet');
            this.addFloater(prop.x, prop.y - 90, '磁力 8s', '#A881DA');
            this.burst(prop.x, prop.y - 40, 26, { world: true, sparkle: true, color: '#D7BAF5', spread: 110, speed: 200, life: 0.9 });
          } else if (prop.type === 'balloon') {
            p.balloon = 9;
            p.jumpsUsed = Math.min(p.jumpsUsed, 1);
            this.audio.sfx('balloon');
            this.addToast('棉花糖气球 · 多一次跳跃，长按还能飘', 'balloon');
            this.addFloater(prop.x, prop.y - 100, '气球 9s', '#E996AE');
            this.burst(prop.x, prop.y - 40, 26, { world: true, sparkle: true, color: '#FFDDE7', spread: 110, speed: 200, life: 0.9 });
          } else if (prop.type === 'bonus') {
            p.notes += 12;
            p.stamina = U.clamp(p.stamina + 14, 0, 100);
            this.audio.sfx('bonus');
            this.addToast('幸运棒棒糖 · 甜甜音符 +12', 'bonus');
            this.addFloater(prop.x, prop.y - 80, '+12 ♥', '#E0A04B', 1.2);
            this.burst(prop.x, prop.y - 40, 34, {
              world: true, sparkle: true, hearts: true, color: '#FFE3A0', spread: 140, speed: 240, life: 1.1,
            });
            this.audio.sfx('star');
          }
          this.shake = Math.max(this.shake, 1.6);
        }
      }
    }
  }

  reachSense(index) {
    const s = SENSES[index];
    this.sensesReached = index + 1;
    this.senseBanner = { index, t: 0 };
    this.audio.sfx('milestone');
    this.burst(640, 150, 22, {
      sparkle: true, color: s.soft, spread: 260, speed: 180, life: 1.2,
    });
    this.player.stamina = U.clamp(this.player.stamina + 5, 0, 100);
  }

  /* =========================================================
     particles / toasts / floaters
     ========================================================= */

  burst(x, y, count, opts = {}) {
    const {
      world = false, color = null, spread = 90, speed = 160,
      life = 0.7, sparkle = false, hearts = false, puff = false,
    } = opts;
    const T = this.character.theme;
    const cols = color ? [color] : [T.body, T.bow, T.accent, '#FFF3D2', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length > 420) break;
      const a = Math.random() * U.TAU;
      const sp = speed * (0.25 + Math.random() * 0.85);
      this.particles.push({
        x: x + (Math.random() - 0.5) * spread * 0.35,
        y: y + (Math.random() - 0.5) * spread * 0.35,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (puff ? 30 : 20),
        life: life * (0.65 + Math.random() * 0.6),
        maxLife: life,
        size: puff ? 6 + Math.random() * 10 : 3 + Math.random() * 6,
        color: cols[Math.floor(Math.random() * cols.length)],
        type: hearts && i % 3 === 0 ? 'heart' : sparkle ? 'sparkle' : puff ? 'puff' : 'dot',
        rot: Math.random() * U.TAU,
        vr: (Math.random() - 0.5) * 5,
        grav: puff ? -18 : 180,
        world,
      });
    }
  }

  spawnDust() {
    const p = this.player;
    if (this.particles.length > 380) return;
    const T = this.character.theme;
    this.particles.push({
      x: p.x - 30 - Math.random() * 16,
      y: p.y + LEVEL.feet - 4,
      vx: -40 - Math.random() * 40,
      vy: -20 - Math.random() * 30,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      size: 5 + Math.random() * 7,
      color: U.rgba(T.cream, 0.75),
      type: 'puff',
      rot: 0,
      vr: 0,
      grav: -10,
      world: true,
    });
  }

  addFloater(x, y, text, color = '#E8879F', size = 1) {
    this.floaters.push({
      x, y, text, color, size,
      t: 0, dur: 1.15, world: true,
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt;
      if (q.life <= 0) { this.particles.splice(i, 1); continue; }
      q.vy += q.grav * dt;
      q.vx *= 0.985;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.rot += q.vr * dt;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.t += dt;
      f.y -= 38 * dt;
      if (f.t > f.dur) this.floaters.splice(i, 1);
    }
  }

  addToast(text, tone = 'soft') {
    this.toasts.push({ text, tone, t: 0, dur: 2.9 });
    if (this.toasts.length > 3) this.toasts.shift();
  }

  updateToasts(dt) {
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i];
      t.t += dt;
      if (t.t > t.dur) this.toasts.splice(i, 1);
    }
  }

  /* =========================================================
     finish + ending
     ========================================================= */

  beginFinish() {
    if (this.state !== 'playing') return;
    this.state = 'finishing';
    this.finishTimer = 0;
    this.finish = {
      gateX: this.player.x + 560,
      gateT: 0,
      open: false,
      confettiTimer: 0,
    };
    this.audio.setMood('ending', 1.5);
    this.audio.sfx('finish');
    this.player.expressionT = 1;
    this.jumpHeld = false;
    this.brake = false;
    this.boost = false;
    this.addToast('糖果城门就在前面啦！', 'finish');
    this.burst(900, 260, 40, { sparkle: true, spread: 600, speed: 260, life: 1.4 });
  }

  updateFinishing(dt) {
    const p = this.player;
    this.finishTimer += dt;
    const f = this.finish;
    f.gateT += dt;
    if (f.gateT > 0.55) f.open = true;
    p.speed = 300;
    p.x += 300 * dt;
    p.runPhase += dt * 12;
    p.grounded = true;
    p.y = LEVEL.groundY - LEVEL.feet;
    p.vy = 0;
    p.expressionT = 1;
    this.camera.x = U.damp(this.camera.x, p.x - 360, 6, dt);
    this.updateParticles(dt);
    this.updateToasts(dt);
    const cam = this.camera.x;
    f.confettiTimer -= dt;
    if (f.confettiTimer <= 0) {
      f.confettiTimer = 0.08;
      this.burst(f.gateX - cam + (Math.random() - 0.5) * 180, 240 + Math.random() * 120, 4, {
        sparkle: true, hearts: Math.random() < 0.2, spread: 140, speed: 170, life: 1.6,
      });
    }
    if (this.finishTimer > 2.35 || p.x > f.gateX + 50) this.startEnding();
  }

  startEnding() {
    if (this.state === 'ending') return;
    this.state = 'ending';
    this.ending = new EndingScene(this);
    this.endFade = false;
    this.endFadeTimer = 0;
    this.flash = 1;
    this.audio.setMood('ending', 1.0);
    // keep the music moving into the soft middle section
    if (!this.audio.graphReady) this.audio.el.volume = 0.7;
  }

  updateEndingAudio() {
    const t = this.ending ? this.ending.t : 0;
    if (t > 1.2 && this.audio.graphReady && !this.audio._endMood) {
      this.audio._endMood = true;
      this.audio.setMood('ending', 2.0);
    }
    if (t > 15.6 && !this.ending._ducked) {
      this.ending._ducked = true;
      this.audio.setMood('final', 2.4);
      this.audio.fadeMusic(0.3, 2.6);
    }
    if (t > 21 && !this.ending._faded) {
      this.ending._faded = true;
      this.audio.fadeMusic(0.12, 3.0);
    }
  }

  /* =========================================================
     drawing
     ========================================================= */

  render() {
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);

    ctx.save();
    ctx.translate(this.view.ox, this.view.oy);
    ctx.scale(this.view.scale, this.view.scale);
    ctx.beginPath();
    ctx.rect(0, 0, U.W, U.H);
    ctx.clip();

    if (this.state === 'quiz' && this.quiz) {
      this.quiz.draw(ctx, this.pointer);
      this.drawMute(ctx);
    } else if (this.state === 'title' && this.title) {
      this.title.draw(ctx, this.pointer);
      this.drawMute(ctx);
    } else if (this.state === 'playing' || this.state === 'paused' || this.state === 'finishing') {
      this.drawGameplay(ctx);
      if (this.state === 'paused') this.drawPause(ctx);
    } else if (this.state === 'ending' && this.ending) {
      this.ending.draw(ctx, this.pointer);
      this.drawMute(ctx);
    } else {
      // boot fill (covered by the DOM loading screen)
      ctx.fillStyle = '#FFF3E9';
      ctx.fillRect(0, 0, U.W, U.H);
    }

    if (this.flash > 0.001) {
      ctx.fillStyle = `rgba(255,250,240,${U.clamp(this.flash, 0, 1) * 0.92})`;
      ctx.fillRect(0, 0, U.W, U.H);
    }

    ctx.restore();
  }

  drawGameplay(ctx) {
    const cam = this.camera.x;
    const t = this.time;
    const p = this.player;
    if (!p) return;

    const shakeX = (Math.random() - 0.5) * this.shake * 3;
    const shakeY = (Math.random() - 0.5) * this.shake * 2;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.world.drawSky(ctx, t, cam);
    this.world.drawParallax(ctx, cam, t);
    this.world.drawRiver(ctx, cam, t);
    this.world.drawGround(ctx, cam, t);
    this.world.drawPitSigns(ctx, cam, t);
    this.world.drawPlatforms(ctx, cam, t);
    this.world.drawObstacles(ctx, cam, t);
    this.world.drawProps(ctx, cam, t);
    if (this.finish) this.world.drawFinishGate(ctx, cam, this.finish.gateX, t, this.finish.open);

    // fixed + falling notes
    this.world.drawFixedNotes(ctx, cam, t, p.magnet > 0);
    for (const n of this.fallingNotes) this.world.drawNoteSprite(ctx, n, cam, t, p.magnet > 0);

    // arena ambience around the player at speed
    if (p.speedTier >= 1 && !p.recover) this.drawSpeedMotes(ctx, cam, p, t);

    // shadow
    this.drawPlayerShadow(ctx, cam, p);

    // magnet swirl
    if (p.magnet > 0) this.drawMagnetAura(ctx, cam, p, t);

    // a permanent soft little spotlight keeps the plush readable
    if (!p.recover) {
      const sx = p.x - cam;
      const halo = ctx.createRadialGradient(sx, p.y, 12, sx, p.y, 130);
      halo.addColorStop(0, 'rgba(255,252,243,0.34)');
      halo.addColorStop(0.55, 'rgba(255,246,238,0.16)');
      halo.addColorStop(1, 'rgba(255,246,238,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sx, p.y, 130, 0, U.TAU);
      ctx.fill();
    }

    // the plush
    {
      const screenX = p.x - cam;
      const look = this.computeLook();
      let expression = 'happy';
      if (p.recover) expression = 'wide';
      else if (p.tumble > 0) expression = 'tumble';
      else if (!p.grounded) expression = p.balloon > 0 && this.jumpHeld && p.vy > 0 ? 'cheer' : 'wide';
      else if (this.state === 'finishing') expression = 'cheer';
      else if (p.speedTier >= 2) expression = 'cheer';
      const squash = p.squash;
      const scaleY = squash;
      const scaleX = 1 + (1 - squash) * 0.55;
      this.character.draw(ctx, screenX, p.y, LEVEL.playerR, {
        time: t,
        phase: p.runPhase,
        grounded: p.grounded,
        vy: p.vy,
        expression,
        look,
        lean: p.grounded ? 0.07 + p.speedTier * 0.015 : 0,
        rotation: p.tumble > 0 ? Math.sin(p.tumble * 24) * 0.18 : p.spin * Math.PI * 2 * 0.22,
        scaleX,
        scaleY,
        aura: p.speedTier > 0 || p.magnet > 0,
        sparkle: p.speedTier >= 2,
        speedTier: p.speedTier,
      });
    }

    // recovery cloud
    if (p.recover) this.drawRecoveryCloud(ctx, cam, p, t);

    // balloon buff friend
    if (p.balloon > 0 && !p.recover) {
      const bx = p.x - cam + 30;
      const by = p.y - 100 + Math.sin(t * 2.3) * 4;
      this.drawMiniBalloon(ctx, bx, by, t);
    }

    // particles
    this.drawParticles(ctx, cam);
    this.drawFloaters(ctx, cam);

    // speed streaks in screen space
    if (p.speedTier >= 1) this.drawSpeedLines(ctx, t, p.speedTier);

    // warm vignette
    const v = ctx.createRadialGradient(U.W * 0.48, U.H * 0.45, U.H * 0.28, U.W * 0.5, U.H * 0.5, U.W * 0.76);
    v.addColorStop(0, 'rgba(255,247,229,0)');
    v.addColorStop(1, 'rgba(146,88,108,0.2)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, U.W, U.H);

    ctx.restore();

    // HUD / overlays
    if (this.state !== 'finishing') {
      this.drawHUD(ctx);
    } else {
      this.drawFinishOverlay(ctx);
    }
    if (this.touch && this.state === 'playing') this.drawTouchControls(ctx);
    this.drawMute(ctx);
  }

  computeLook() {
    const p = this.player;
    let best = null;
    let bestD = 300;
    for (const n of this.world.fixedNotes) {
      if (n.taken) continue;
      const d = Math.hypot(n.x - p.x, n.baseY - p.y);
      if (d < bestD) { bestD = d; best = n; }
    }
    for (const n of this.fallingNotes) {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < bestD) { bestD = d; best = n; }
    }
    if (!best) return { x: 0.45, y: -0.05 };
    const dx = best.x - p.x;
    const dy = (best.baseY || best.y) - p.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: U.clamp(dx / len, -1, 1) * 0.6, y: U.clamp(dy / len, -1, 1) * 0.45 };
  }

  drawPlayerShadow(ctx, cam, p) {
    let baseY = null;
    if (!this.world.isPit(p.x)) baseY = this.world.groundTop(p.x);
    for (const plat of this.world.platforms) {
      if (p.x > plat.x && p.x < plat.x + plat.w && p.y + LEVEL.feet <= plat.y + 4) {
        baseY = plat.y;
        break;
      }
    }
    if (baseY === null) return;
    const height = Math.max(0, baseY - (p.y + LEVEL.feet));
    const k = U.clamp(1 - height / 360, 0.15, 1);
    ctx.fillStyle = `rgba(145,79,101,${0.18 * k})`;
    ctx.beginPath();
    ctx.ellipse(p.x - cam, baseY + 3, 54 * (0.55 + k * 0.45), 11 * (0.6 + k * 0.4), 0, 0, U.TAU);
    ctx.fill();
  }

  drawMagnetAura(ctx, cam, p, t) {
    const x = p.x - cam;
    ctx.save();
    ctx.translate(x, p.y);
    const g = ctx.createRadialGradient(0, 0, 30, 0, 0, 260);
    g.addColorStop(0, 'rgba(219,190,250,0.25)');
    g.addColorStop(1, 'rgba(219,190,250,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 260, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(196,158,238,0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 100 + i * 34, 34 + i * 12, t * 0.5 + i, 0, U.TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const a = t * 1.6 + i * 1.57;
      U.drawNote(ctx, Math.cos(a) * 108, Math.sin(a) * 36 - 10, 15, a, 'rgba(255,248,240,0.65)', 0.8);
    }
    ctx.restore();
  }

  drawSpeedMotes(ctx, cam, p, t) {
    const T = this.character.theme;
    for (let i = 0; i < 4 + p.speedTier * 3; i++) {
      const a = t * (2.5 + i * 0.2) + i * 1.7;
      const x = p.x - cam - 50 - (i % 3) * 18;
      const y = p.y + Math.sin(a) * 38;
      U.drawSparkle(ctx, x, y, 2 + Math.sin(t * 5 + i) * 1.6, i % 2 ? T.cream : T.accent, a, 0.55);
    }
  }

  drawRecoveryCloud(ctx, cam, p, t) {
    const x = p.x - cam;
    const y = p.y + 76;
    ctx.save();
    ctx.translate(x, y);
    const g = ctx.createLinearGradient(0, -36, 0, 34);
    g.addColorStop(0, 'rgba(255,253,246,0.98)');
    g.addColorStop(1, 'rgba(255,224,234,0.95)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(-46, 6, 30, 0, U.TAU);
    ctx.arc(-16, -14, 38, 0, U.TAU);
    ctx.arc(24, -8, 34, 0, U.TAU);
    ctx.arc(50, 10, 24, 0, U.TAU);
    ctx.rect(-46, 6, 96, 30);
    ctx.fill();
    // sleepy face
    ctx.strokeStyle = 'rgba(171,113,133,0.7)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-16, 2, 3, 0, Math.PI);
    ctx.arc(16, 2, 3, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.quadraticCurveTo(0, 16, 6, 12);
    ctx.stroke();
    // wings
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-70, -4);
    ctx.quadraticCurveTo(-88, -18, -74, -26);
    ctx.moveTo(74, -4);
    ctx.quadraticCurveTo(92, -18, 78, -26);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      U.drawSparkle(ctx, (i - 1.5) * 38, -34 + Math.sin(t * 3 + i) * 5, 4, '#FFF7DC', t + i, 0.7);
    }
    ctx.restore();
  }

  drawMiniBalloon(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 1.8) * 0.08);
    const g = ctx.createRadialGradient(-4, -14, 1, 0, 0, 22);
    g.addColorStop(0, '#FFF0F4');
    g.addColorStop(1, '#F295B3');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 19, 0, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.quadraticCurveTo(3, 28, 0, 34);
    ctx.stroke();
    U.drawSparkle(ctx, 12, -16, 3.5, '#FFF6D6', t, 0.8);
    ctx.restore();
  }

  drawParticles(ctx, cam) {
    for (const q of this.particles) {
      const x = q.world ? q.x - cam : q.x;
      const a = U.clamp(q.life / q.maxLife, 0, 1);
      if (q.type === 'puff') {
        const g = ctx.createRadialGradient(x, q.y, 1, x, q.y, q.size * 1.8);
        g.addColorStop(0, U.rgba('#FFFFFF', 0.36 * a));
        g.addColorStop(0.5, U.rgba(q.color.startsWith('#') ? q.color : '#FFE8EF', 0.24 * a));
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, q.y, q.size * 1.8, 0, U.TAU);
        ctx.fill();
      } else if (q.type === 'sparkle') {
        U.drawSparkle(ctx, x, q.y, q.size, q.color, q.rot, a);
      } else if (q.type === 'heart') {
        U.drawHeart(ctx, x, q.y, q.size * 1.8, q.color, a * 0.9);
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = q.color;
        ctx.beginPath();
        ctx.arc(x, q.y, q.size * (0.6 + a * 0.4), 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  drawFloaters(ctx, cam) {
    for (const f of this.floaters) {
      const a = Math.sin(U.clamp(f.t / f.dur, 0, 1) * Math.PI);
      const x = f.x - cam;
      U.text(ctx, f.text, x, f.y, {
        size: 19 * f.size, family: U.FONT_DISPLAY, color: f.color, align: 'center',
        alpha: a, stroke: 'rgba(255,252,244,0.9)', strokeWidth: 4,
      });
    }
  }

  drawSpeedLines(ctx, t, tier) {
    ctx.save();
    ctx.globalAlpha = tier >= 2 ? 0.35 : 0.2;
    ctx.strokeStyle = '#FFF9EE';
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const y = 90 + U.hash(i * 4.3) * 560;
      const len = 60 + U.hash(i * 2.1) * 120;
      const x = 1280 - ((t * (450 + i * 35) + i * 240) % 1500);
      ctx.lineWidth = 1 + U.hash(i) * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------- HUD ---------------- */

  drawHUD(ctx) {
    const p = this.player;
    if (!p) return;
    const t = this.time;
    const T = this.character.theme;
    const notes = p.notes;
    const combo = p.combo;
    const stamina = p.stamina;

    // note panel
    CandyUI.panel(ctx, 22, 16, 300, 96, 30, {
      fill: 'rgba(255,251,243,0.86)', border: 'rgba(255,255,255,0.9)',
      shadowColor: 'rgba(155,87,108,0.18)',
    });
    // avatar
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.beginPath();
    ctx.arc(62, 64, 33, 0, U.TAU);
    ctx.fill();
    CandyUI.miniPlush(ctx, 62, 64, 26, T, t);
    ctx.strokeStyle = U.rgba(T.accent, 0.45);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(62, 64, 33, 0, U.TAU);
    ctx.stroke();
    ctx.restore();

    const beatScale = 1 + this.beatPulse * 0.12;
    U.drawNote(ctx, 104, 42, 20 * beatScale, -0.1, U.rgba(T.accent, 0.9), 1);
    U.text(ctx, String(notes), 132, 43, {
      size: 27, family: U.FONT_ROUND, color: '#6B4757', align: 'left',
    });
    U.text(ctx, '甜甜音符', 104, 63, {
      size: 10, color: 'rgba(159,118,132,0.75)', letterSpacing: 1.2,
    });
    if (combo >= 3) {
      const pulse = 1 + Math.max(0, p.comboTimer - 2.1) * 0.35;
      U.text(ctx, `连击 ×${combo}`, 298, 43, {
        size: 14 * pulse, family: U.FONT_DISPLAY, color: '#E9799A', align: 'right',
      });
    } else {
      U.text(ctx, this.state === 'finishing' ? '' : 'COMBO', 298, 43, {
        size: 10, family: U.FONT_ROUND, color: 'rgba(185,142,156,0.4)', align: 'right', letterSpacing: 2,
      });
    }
    // stamina
    U.text(ctx, '体力', 104, 82, { size: 11, color: 'rgba(145,103,117,0.8)' });
    const barX = 140, barY = 76, barW = 158, barH = 12;
    ctx.fillStyle = 'rgba(230,193,206,0.35)';
    U.roundRectPath(ctx, barX, barY, barW, barH, 6);
    ctx.fill();
    const sk = U.clamp(stamina / 100, 0, 1);
    if (sk > 0.001) {
      const sg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      if (stamina < 22) {
        sg.addColorStop(0, '#FFA8A8');
        sg.addColorStop(1, '#F57F9D');
      } else {
        sg.addColorStop(0, '#B9EBD5');
        sg.addColorStop(0.55, '#FFD39B');
        sg.addColorStop(1, '#FFB3CA');
      }
      ctx.fillStyle = sg;
      U.roundRectPath(ctx, barX, barY, Math.max(barH, barW * sk), barH, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      U.roundRectPath(ctx, barX + 3, barY + 2, Math.max(4, barW * sk - 8), 3, 1.5);
      ctx.fill();
    }
    if (stamina < 22) {
      const blink = 0.55 + Math.sin(t * 5) * 0.35;
      U.text(ctx, '有点累…', barX + barW + 8, 82, { size: 10, color: `rgba(224,113,135,${blink})` });
    }

    // progress + senses
    const progW = 532;
    const progX = 374;
    CandyUI.panel(ctx, 350, 16, 580, 66, 28, {
      fill: 'rgba(255,251,243,0.84)', border: 'rgba(255,255,255,0.9)',
      shadowColor: 'rgba(155,87,108,0.15)',
    });
    U.text(ctx, '五官启蒙 · 甜糖丘陵', 374, 33, {
      size: 11, color: 'rgba(146,101,116,0.8)', letterSpacing: 1.2,
    });
    const pct = Math.round(U.clamp(this.levelTime / LEVEL.seconds, 0, 1) * 100);
    U.text(ctx, pct + '%', 906, 33, {
      size: 11, family: U.FONT_ROUND, color: 'rgba(188,126,145,0.9)', align: 'right', letterSpacing: 1,
    });
    const prog = U.clamp(this.levelTime / LEVEL.seconds, 0, 1);
    ctx.fillStyle = 'rgba(238,205,215,0.5)';
    U.roundRectPath(ctx, progX, 50, progW, 12, 6);
    ctx.fill();
    if (prog > 0.002) {
      const pg = ctx.createLinearGradient(progX, 0, progX + progW, 0);
      pg.addColorStop(0, '#FFD3DF');
      pg.addColorStop(0.6, '#FFB0C8');
      pg.addColorStop(1, '#F98DAF');
      ctx.fillStyle = pg;
      U.roundRectPath(ctx, progX, 50, Math.max(10, progW * prog), 12, 6);
      ctx.fill();
    }
    // sense charms positioned along the ribbon
    for (let i = 0; i < SENSES.length; i++) {
      const th = SENSE_THRESHOLDS[i];
      const cx = progX + progW * th;
      const cy = 56;
      const reached = progressReached(this.senseIndex, i);
      const isNext = this.senseIndex === i;
      const s = SENSES[i];
      const pulse = isNext ? 1 + 0.08 * Math.sin(t * 3.5) : 1;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);
      const charm = ctx.createLinearGradient(0, -15, 0, 15);
      charm.addColorStop(0, reached ? '#FFFFFF' : 'rgba(255,252,246,0.96)');
      charm.addColorStop(1, reached ? s.soft : 'rgba(255,241,235,0.96)');
      ctx.fillStyle = charm;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = reached ? s.color : 'rgba(220,180,193,0.6)';
      ctx.lineWidth = reached ? 2.2 : 1.3;
      ctx.stroke();
      CandyUI.senseIcon(ctx, s.kind, 0, 0, 8.4, reached ? s.color : 'rgba(180,131,147,0.55)', reached ? 1 : 0.75);
      if (!reached) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(-4, -5, 4, 0, U.TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    // top-right buttons
    this.drawPauseButton(ctx, true);

    // buff chips
    const buffs = [];
    if (p.magnet > 0) buffs.push({ icon: 'magnet', label: '磁力', time: p.magnet });
    if (p.balloon > 0) buffs.push({ icon: 'balloon', label: '气球', time: p.balloon });
    let by = 84;
    for (const b of buffs) {
      CandyUI.panel(ctx, 1052, by, 140, 30, 15, {
        fill: 'rgba(255,250,243,0.86)', border: 'rgba(255,255,255,0.9)', shadow: false,
      });
      if (b.icon === 'magnet') {
        ctx.save();
        ctx.translate(1070, by + 15);
        ctx.fillStyle = '#B58AE0';
        U.drawStar(ctx, 0, 0, 9, 0.48);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#F4A0B8';
        ctx.beginPath();
        ctx.ellipse(1070, by + 15, 7, 9, 0, 0, U.TAU);
        ctx.fill();
      }
      U.text(ctx, b.label, 1084, by + 15, { size: 11, color: 'rgba(139,99,112,0.9)' });
      const bw = 44;
      ctx.fillStyle = 'rgba(228,195,207,0.45)';
      U.roundRectPath(ctx, 1118, by + 11, bw, 7, 3.5);
      ctx.fill();
      ctx.fillStyle = '#FFB3C9';
      U.roundRectPath(ctx, 1118, by + 11, bw * U.clamp(b.time / 9, 0, 1), 7, 3.5);
      ctx.fill();
      by += 36;
    }

    // intro banner
    if (this.startBanner > 0) {
      const a = Math.min(1, this.startBanner / 0.7) * Math.min(1, (2.8 - this.startBanner) / 0.35 + 0.2);
      ctx.save();
      ctx.globalAlpha = U.clamp(a, 0, 1);
      U.text(ctx, '第一关 · 甜糖丘陵', 640, 150, {
        size: 42, family: U.FONT_DISPLAY, color: '#C96788', align: 'center',
        stroke: 'rgba(255,253,246,1)', strokeWidth: 9,
        shadow: 'rgba(176,90,116,0.26)', shadowBlur: 18, shadowY: 6,
      });
      U.text(ctx, '五官启蒙 · 甜糖丘陵', 640, 184, {
        size: 12, color: 'rgba(145,96,111,0.9)', align: 'center', letterSpacing: 4,
      });
      ctx.restore();
    }

    // sense banner
    if (this.senseBanner) {
      const b = this.senseBanner;
      const s = SENSES[b.index];
      const k = U.clamp(b.t / 0.45, 0, 1);
      const out = U.smoothstep(2.5, 3.2, b.t);
      const a = U.easeOutCubic(k) * (1 - out);
      const y = 138 + (1 - U.easeOutBack(k)) * -20;
      ctx.save();
      ctx.globalAlpha = a;
      const cx = 640;
      CandyUI.panel(ctx, cx - 190, y - 34, 380, 68, 34, {
        fill: 'rgba(255,251,243,0.94)', border: 'rgba(255,255,255,0.95)',
        shadowColor: 'rgba(155,87,108,0.2)',
      });
      ctx.fillStyle = s.soft;
      ctx.beginPath();
      ctx.arc(cx - 143, y, 22, 0, U.TAU);
      ctx.fill();
      CandyUI.senseIcon(ctx, s.kind, cx - 143, y, 12, s.color, 1);
      U.text(ctx, `${s.name} · ${s.line}`, cx - 108, y - 6, {
        size: 19, family: U.FONT_DISPLAY, color: '#A6697D',
      });
      U.text(ctx, `五官启蒙 ${b.index + 1} / 5`, cx - 108, y + 18, {
        size: 10, color: 'rgba(164,121,134,0.75)', letterSpacing: 2,
      });
      ctx.restore();
    }

    // tutorial bubble
    const tut = this.currentTutorial();
    if (tut) {
      const pScreenX = p.x - this.camera.x;
      const bubbleX = U.clamp(pScreenX + 6, 190, 700);
      const bubbleY = 340;
      const a = Math.min(1, tut.t / 0.24, (tut.dur - tut.t) / 0.42);
      ctx.save();
      ctx.globalAlpha = U.clamp(a, 0, 1);
      ctx.save();
      ctx.shadowColor = 'rgba(150,84,104,0.16)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      CandyUI.panel(ctx, bubbleX - 168, bubbleY - 27, 336, 54, 27, {
        fill: 'rgba(255,251,244,0.97)', border: 'rgba(255,255,255,1)', shadow: false,
      });
      ctx.restore();
      ctx.fillStyle = 'rgba(255,251,244,0.97)';
      ctx.beginPath();
      ctx.moveTo(bubbleX - 18, bubbleY + 26);
      ctx.lineTo(bubbleX - 2, bubbleY + 43);
      ctx.lineTo(bubbleX + 15, bubbleY + 26);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,176,200,0.9)';
      ctx.beginPath();
      ctx.arc(bubbleX - U.measure(ctx, tut.text, 15, 400, U.FONT_DISPLAY) / 2 - 22, bubbleY, 11, 0, U.TAU);
      ctx.fill();
      U.drawNote(ctx, bubbleX - U.measure(ctx, tut.text, 15, 400, U.FONT_DISPLAY) / 2 - 24, bubbleY + 1, 13, -0.1, '#FFFDF6', 1);
      U.text(ctx, tut.text, bubbleX + 4, bubbleY, {
        size: 15, family: U.FONT_DISPLAY, color: '#70485A', align: 'center',
      });
      ctx.restore();
    }

    // toasts
    this.drawToasts(ctx);

    // low stamina vignette hint
    if (stamina < 15) {
      const a = 0.06 + Math.sin(t * 4) * 0.025;
      const g = ctx.createRadialGradient(640, 360, 280, 640, 360, 720);
      g.addColorStop(0, 'rgba(255,160,160,0)');
      g.addColorStop(1, `rgba(255,143,168,${a * 3})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, U.W, U.H);
    }
  }

  currentTutorial() {
    if (!this.player || this.state !== 'playing') return null;
    const lt = this.levelTime;
    const items = this.touch
      ? [
          { at: 3.0, dur: 2.8, text: '点「跳」· 轻轻跳起来' },
          { at: 8.0, dur: 3.2, text: '再点一次 · 二段跳' },
          { at: 13.0, dur: 3.0, text: '接住音符 · 会越跑越快' },
          { at: 22.0, dur: 3.4, text: '长按「跳」· 飘得更高' },
        ]
      : [
          { at: 3.0, dur: 2.8, text: '空格 / 点击右侧 · 轻轻跳起来' },
          { at: 8.0, dur: 3.2, text: '空中再按一次 · 二段跳' },
          { at: 13.0, dur: 3.0, text: '接住音符 · 会越跑越快' },
          { at: 22.0, dur: 3.4, text: '长按跳跃 · 可以跳得更高' },
        ];
    for (const it of items) {
      if (lt >= it.at && lt <= it.at + it.dur) {
        return { ...it, t: lt - it.at };
      }
    }
    return null;
  }

  drawToasts(ctx) {
    let y = 648;
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i];
      const a = Math.min(1, t.t / 0.25) * Math.min(1, (t.dur - t.t) / 0.45);
      const w = Math.min(620, U.measure(ctx, t.text, 15, 400, U.FONT_UI) + 64);
      const toneColors = {
        soft: 'rgba(255,251,243,0.94)',
        warn: 'rgba(255,248,238,0.96)',
        cloud: 'rgba(255,253,249,0.96)',
        speed: 'rgba(255,247,248,0.96)',
        finish: 'rgba(255,251,243,0.96)',
        magnet: 'rgba(251,246,255,0.96)',
        balloon: 'rgba(255,248,250,0.96)',
        bonus: 'rgba(255,251,240,0.96)',
      };
      ctx.save();
      ctx.globalAlpha = U.clamp(a, 0, 1);
      CandyUI.panel(ctx, 640 - w / 2, y - 20, w, 38, 19, {
        fill: toneColors[t.tone] || toneColors.soft,
        border: 'rgba(255,255,255,0.9)', shadow: false,
      });
      U.text(ctx, t.text, 640, y - 1, {
        size: 14, color: 'rgba(124,86,99,0.92)', align: 'center',
      });
      ctx.restore();
      y -= 44;
    }
  }

  drawTouchControls(ctx) {
    const t = this.time;
    const jumpHeld = this.jumpHeld;
    // brake
    ctx.save();
    ctx.globalAlpha = 0.9;
    const g = ctx.createRadialGradient(92, 610, 4, 92, 620, 54);
    g.addColorStop(0, 'rgba(255,252,246,0.95)');
    g.addColorStop(1, 'rgba(255,235,242,0.8)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(92, 620, 46, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
    U.text(ctx, '慢', 92, 618, { size: 22, family: U.FONT_DISPLAY, color: '#C58CA0', align: 'center' });
    // jump
    const jg = ctx.createRadialGradient(1160, 590, 6, 1180, 610, 74);
    jg.addColorStop(0, jumpHeld ? '#FFD3DF' : '#FFF3E9');
    jg.addColorStop(0.55, '#FFB8CD');
    jg.addColorStop(1, '#F08CA9');
    ctx.fillStyle = jg;
    ctx.beginPath();
    ctx.arc(1180, 610, 62, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 4;
    ctx.stroke();
    U.text(ctx, '跳', 1180, 607, { size: 32, family: U.FONT_DISPLAY, color: '#FFFDF7', align: 'center' });
    U.drawSparkle(ctx, 1208, 574, 5, '#FFF8DD', t, 0.8);
    ctx.restore();
  }

  drawPauseButton(ctx, asButton = false) {
    if (!asButton) return;
    const hov = this.pointer.inside && Math.hypot(this.pointer.x - 1160, this.pointer.y - 44) < 32;
    this.drawCircleButton(ctx, 1160, 44, 22, hov, () => CandyUI.pause(ctx, 1160, 44, 11, '#8F6373'));
  }

  drawMute(ctx) {
    const hov = this.pointer.inside && Math.hypot(this.pointer.x - 1218, this.pointer.y - 44) < 32;
    this.drawCircleButton(ctx, 1218, 44, 22, hov, () => CandyUI.speaker(ctx, 1218, 44, 10.5, this.audio.muted, '#8F6373'));
  }

  drawCircleButton(ctx, x, y, r, hover, iconFn) {
    ctx.save();
    const s = hover ? 1.08 : 1;
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.translate(-x, -y);
    ctx.fillStyle = 'rgba(255,251,243,0.86)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 2;
    ctx.stroke();
    iconFn();
    ctx.restore();
  }

  drawFinishOverlay(ctx) {
    const p = this.player;
    if (!p) return;
    // fade HUD out during the finish run; gentle title
    U.text(ctx, '抵达糖果城门 ♪', 640, 132, {
      size: 36, family: U.FONT_DISPLAY, color: 'rgba(226,122,151,0.95)', align: 'center',
      stroke: 'rgba(255,252,244,0.95)', strokeWidth: 8,
      shadow: 'rgba(177,89,116,0.18)', shadowBlur: 14, shadowY: 4,
    });
    U.text(ctx, '第一关 · 甜糖丘陵', 640, 168, {
      size: 12, color: 'rgba(159,111,126,0.8)', align: 'center', letterSpacing: 3,
    });
    this.drawToasts(ctx);
  }

  drawPause(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,247,236,0.72)';
    ctx.fillRect(0, 0, U.W, U.H);
    const panel = { x: 390, y: 112, w: 500, h: 500 };
    CandyUI.panel(ctx, panel.x, panel.y, panel.w, panel.h, 42, {
      fill: 'rgba(255,251,243,0.96)', border: 'rgba(255,255,255,0.95)',
      shadowColor: 'rgba(150,84,104,0.25)',
    });
    // plush peeking
    this.character.draw(ctx, 640, 208, 43, {
      time: this.time, phase: 1, grounded: true, expression: 'sleepy', look: { x: 0, y: 0.2 },
    });
    U.text(ctx, '休息一下', 640, 286, {
      size: 38, family: U.FONT_DISPLAY, color: '#C97692', align: 'center',
    });
    U.text(ctx, '喝一口草莓牛奶，再继续冒险吧。', 640, 318, {
      size: 13, color: 'rgba(151,107,120,0.75)', align: 'center', letterSpacing: 0.5,
    });
    const b = {
      resume: { x: 490, y: 350, w: 300, h: 68 },
      restart: { x: 490, y: 434, w: 300, h: 58 },
      title: { x: 490, y: 506, w: 300, h: 58 },
    };
    this.pauseButtons = b;
    const hov = (r) => this.pointer.inside && U.pointInRect(this.pointer.x, this.pointer.y, r);
    CandyUI.button(ctx, b.resume, '继续冒险', { hover: hov(b.resume), primary: true, size: 30 });
    CandyUI.button(ctx, b.restart, '重新开始', { hover: hov(b.restart), primary: false, size: 23, note: false });
    CandyUI.button(ctx, b.title, '回到标题', { hover: hov(b.title), primary: false, size: 23, note: false });
    U.text(ctx, 'P / Esc 继续  ·  R 重新开始  ·  M 静音', 640, 588, {
      size: 11, color: 'rgba(171,128,141,0.65)', align: 'center', letterSpacing: 0.5,
    });
    ctx.restore();
  }

  /* ---------------- debug hooks ---------------- */

  debugEnding(t = 0) {
    this.resetRun();
    this.state = 'ending';
    this.ending = new EndingScene(this);
    this.ending.t = t;
    this.runStats = { notes: 86, maxCombo: 28, senses: 5 };
    this.audio.ensureGraph();
    try { this.audio.setMood('ending', 0.2); } catch (e) { /* ignore */ }
    this.flash = 0;
  }

  debugJumpTo(sec) {
    if (this.state !== 'playing') this.startRun();
    const s = U.clamp(sec, 0, LEVEL.seconds - 0.2);
    this.levelTime = s;
    try { this.audio.el.currentTime = LEVEL.musicOffset + s; } catch (e) { /* ignore */ }
    this.audio.fallbackStart = performance.now() - s * 1000;
    const p = this.player;
    if (p) {
      p.x = Math.max(0, s * 340);
      this.camera.x = p.x - 360;
      p.stamina = 80;
      p.notes = Math.min(75, Math.floor(s * 1.6));
    }
  }
}

function progressReached(senseIndex, i) {
  return i < senseIndex;
}

/* Kick off once the document is parsed. */
let __meloGame = null;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    __meloGame = new MeloGame(document.getElementById('game'));
  });
} else {
  __meloGame = new MeloGame(document.getElementById('game'));
}
