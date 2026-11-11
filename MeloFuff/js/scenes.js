/* MeloFuff — candy UI, title vignette and ending cinematic */
const CandyUI = {
  panel(ctx, x, y, w, h, r = 24, opts = {}) {
    const {
      fill = 'rgba(255,250,242,0.9)',
      border = 'rgba(255,255,255,0.9)',
      shadow = true,
      shadowColor = 'rgba(177,103,126,0.16)',
      alpha = 1,
    } = opts;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (shadow) {
      ctx.fillStyle = shadowColor;
      U.roundRectPath(ctx, x, y + 6, w, h, r);
      ctx.fill();
    }
    U.roundRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  },

  button(ctx, rect, label, opts = {}) {
    const {
      hover = false, pressed = false, primary = true, alpha = 1,
      size = 30, sub = null, note = true,
    } = opts;
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const sc = pressed ? 0.975 : hover ? 1.028 : 1;
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.translate(-cx, -cy);

    // floating shadow
    ctx.fillStyle = primary ? 'rgba(196,96,126,0.24)' : 'rgba(196,150,160,0.18)';
    U.roundRectPath(ctx, rect.x, rect.y + (pressed ? 3 : 8), rect.w, rect.h, rect.h / 2);
    ctx.fill();

    const g = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    if (primary) {
      g.addColorStop(0, '#FFB8CB');
      g.addColorStop(0.52, '#FF92AF');
      g.addColorStop(1, '#F47A9C');
    } else {
      g.addColorStop(0, '#FFFDF6');
      g.addColorStop(0.6, '#FFF4E7');
      g.addColorStop(1, '#FFE8DA');
    }
    U.roundRectPath(ctx, rect.x, rect.y + (pressed ? 2 : 0), rect.w, rect.h, rect.h / 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = primary ? 'rgba(255,255,255,0.92)' : 'rgba(255,205,216,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // gloss
    ctx.save();
    U.roundRectPath(ctx, rect.x, rect.y + (pressed ? 2 : 0), rect.w, rect.h, rect.h / 2);
    ctx.clip();
    const gloss = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h * 0.58);
    gloss.addColorStop(0, 'rgba(255,255,255,0.5)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.ellipse(cx, rect.y + rect.h * 0.13, rect.w * 0.4, rect.h * 0.22, 0, 0, U.TAU);
    ctx.fill();
    ctx.restore();

    const textColor = primary ? '#FFFDF7' : '#D97D9A';
    const labelY = sub ? cy - 9 : cy + 1;
    if (note) {
      U.drawNote(ctx, cx - U.measure(ctx, label, size, 400, U.FONT_DISPLAY) / 2 - 27, labelY, 23, -0.12, primary ? 'rgba(255,255,255,0.9)' : U.rgba('#FFB0C5', 0.85));
    }
    U.text(ctx, label, cx + (note ? 9 : 0), labelY, {
      size, family: U.FONT_DISPLAY, color: textColor, align: 'center',
      shadow: primary ? 'rgba(172,70,100,0.22)' : null, shadowBlur: 3, shadowY: 2,
    });
    if (sub) {
      U.text(ctx, sub, cx, cy + 22, {
        size: 12, color: primary ? 'rgba(255,250,245,0.85)' : 'rgba(201,136,153,0.9)',
        align: 'center', letterSpacing: 1.5,
      });
    }
    // tiny sparkle
    U.drawSparkle(ctx, rect.x + rect.w - 28, rect.y + 18, 5 + (hover ? 1.5 : 0), primary ? '#FFF7D6' : '#FFC4D7', 0.4, 0.75);
    ctx.restore();
  },

  senseIcon(ctx, kind, x, y, r, color = '#FF8FAD', alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.6, r * 0.14);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (kind === 'eye') {
      ctx.beginPath();
      ctx.moveTo(-r * 0.82, 0);
      ctx.quadraticCurveTo(0, -r * 0.68, r * 0.82, 0);
      ctx.quadraticCurveTo(0, r * 0.68, -r * 0.82, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.26, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#FFF9F0';
      ctx.beginPath();
      ctx.arc(-r * 0.08, -r * 0.09, r * 0.08, 0, U.TAU);
      ctx.fill();
    } else if (kind === 'ear') {
      ctx.beginPath();
      ctx.moveTo(-r * 0.42, r * 0.75);
      ctx.bezierCurveTo(-r * 0.85, r * 0.22, -r * 0.6, -r * 0.78, 0, -r * 0.78);
      ctx.bezierCurveTo(r * 0.7, -r * 0.78, r * 0.72, r * 0.02, r * 0.24, r * 0.22);
      ctx.bezierCurveTo(-r * 0.1, r * 0.36, -r * 0.02, r * 0.58, r * 0.14, r * 0.68);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.12, r * 0.3);
      ctx.bezierCurveTo(-r * 0.36, r * 0.02, -r * 0.2, -r * 0.42, r * 0.12, -r * 0.4);
      ctx.bezierCurveTo(r * 0.36, -r * 0.38, r * 0.32, -r * 0.06, r * 0.08, r * 0.04);
      ctx.stroke();
    } else if (kind === 'nose') {
      ctx.beginPath();
      ctx.moveTo(r * 0.44, -r * 0.72);
      ctx.bezierCurveTo(r * 0.04, -r * 0.5, -r * 0.22, -r * 0.08, -r * 0.22, r * 0.26);
      ctx.bezierCurveTo(-r * 0.22, r * 0.55, r * 0.1, r * 0.62, r * 0.42, r * 0.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-r * 0.46, r * 0.3, r * 0.16, r * 0.3, 0.2, 0, U.TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(r * 0.02, r * 0.3, r * 0.09, 0, U.TAU);
      ctx.fill();
    } else if (kind === 'mouth') {
      ctx.beginPath();
      ctx.moveTo(-r * 0.68, -r * 0.22);
      ctx.quadraticCurveTo(0, -r * 0.5, r * 0.68, -r * 0.22);
      ctx.quadraticCurveTo(r * 0.4, r * 0.5, 0, r * 0.55);
      ctx.quadraticCurveTo(-r * 0.4, r * 0.5, -r * 0.68, -r * 0.22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.14);
      ctx.quadraticCurveTo(0, r * 0.1, r * 0.4, -r * 0.14);
      ctx.stroke();
    } else if (kind === 'hand') {
      // palm
      ctx.beginPath();
      ctx.ellipse(0, r * 0.28, r * 0.46, r * 0.38, 0, 0, U.TAU);
      ctx.stroke();
      // fingers
      for (let i = 0; i < 4; i++) {
        const fx = -r * 0.34 + i * r * 0.225;
        const len = r * (0.58 - Math.abs(i - 1.4) * 0.1);
        ctx.beginPath();
        ctx.moveTo(fx, r * 0.08);
        ctx.quadraticCurveTo(fx + r * 0.03, -len * 0.5, fx, -len);
        ctx.stroke();
      }
      // thumb
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, r * 0.18);
      ctx.quadraticCurveTo(-r * 0.78, r * 0.02, -r * 0.64, -r * 0.24);
      ctx.stroke();
    }
    ctx.restore();
  },

  speaker(ctx, x, y, r, muted, color = '#8F6373') {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.22);
    ctx.lineTo(-r * 0.2, -r * 0.22);
    ctx.lineTo(r * 0.16, -r * 0.56);
    ctx.lineTo(r * 0.16, r * 0.56);
    ctx.lineTo(-r * 0.2, r * 0.22);
    ctx.lineTo(-r * 0.55, r * 0.22);
    ctx.closePath();
    ctx.fill();
    if (muted) {
      ctx.beginPath();
      ctx.moveTo(r * 0.32, -r * 0.25);
      ctx.lineTo(r * 0.72, r * 0.25);
      ctx.moveTo(r * 0.72, -r * 0.25);
      ctx.lineTo(r * 0.32, r * 0.25);
      ctx.stroke();
    } else {
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.34, -0.8, 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.2, 0, r * 0.58, -0.7, 0.7);
      ctx.stroke();
    }
    ctx.restore();
  },

  pause(ctx, x, y, r, color = '#8F6373') {
    ctx.save();
    ctx.fillStyle = color;
    U.roundRectPath(ctx, x - r * 0.4, y - r * 0.5, r * 0.26, r, r * 0.13);
    ctx.fill();
    U.roundRectPath(ctx, x + r * 0.14, y - r * 0.5, r * 0.26, r, r * 0.13);
    ctx.fill();
    ctx.restore();
  },

  play(ctx, x, y, r, color = '#8F6373') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.34, y - r * 0.5);
    ctx.lineTo(x + r * 0.5, y);
    ctx.lineTo(x - r * 0.34, y + r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  close(ctx, x, y, r, color = '#8F6373') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y - r * 0.4);
    ctx.lineTo(x + r * 0.4, y + r * 0.4);
    ctx.moveTo(x + r * 0.4, y - r * 0.4);
    ctx.lineTo(x - r * 0.4, y + r * 0.4);
    ctx.stroke();
    ctx.restore();
  },

  miniPlush(ctx, x, y, r, theme, t = 0) {
    ctx.save();
    ctx.translate(x, y);
    // body
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 1, 0, 0, r);
    g.addColorStop(0, theme.light);
    g.addColorStop(0.6, theme.body);
    g.addColorStop(1, theme.deep);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, U.TAU);
    ctx.fill();
    // ears
    ctx.fillStyle = theme.body;
    ctx.beginPath();
    ctx.arc(-r * 0.55, -r * 0.72, r * 0.28, 0, U.TAU);
    ctx.arc(r * 0.55, -r * 0.72, r * 0.28, 0, U.TAU);
    ctx.fill();
    // eyes
    ctx.fillStyle = theme.eye;
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 0.02, r * 0.11, r * 0.14, 0, 0, U.TAU);
    ctx.ellipse(r * 0.3, -r * 0.02, r * 0.11, r * 0.14, 0, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(-r * 0.33, -r * 0.07, r * 0.035, 0, U.TAU);
    ctx.arc(r * 0.27, -r * 0.07, r * 0.035, 0, U.TAU);
    ctx.fill();
    // blush & smile
    ctx.fillStyle = U.rgba(theme.blush, 0.55);
    ctx.beginPath();
    ctx.ellipse(-r * 0.5, r * 0.22, r * 0.12, r * 0.07, 0, 0, U.TAU);
    ctx.ellipse(r * 0.5, r * 0.22, r * 0.12, r * 0.07, 0, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = theme.eye;
    ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.1, r * 0.2);
    ctx.quadraticCurveTo(0, r * 0.28, r * 0.1, r * 0.2);
    ctx.stroke();
    // bow
    ctx.fillStyle = theme.bow;
    ctx.beginPath();
    ctx.ellipse(r * 0.42, -r * 0.66, r * 0.2, r * 0.13, -0.5, 0, U.TAU);
    ctx.ellipse(r * 0.56, -r * 0.56, r * 0.2, r * 0.13, 0.4, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  },
};

/* =========================================================
   Title screen
   ========================================================= */

class TitleScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.waveCooldown = 0;
    this.wiggle = 0;
    this.petter = 0;
    this.floatNotes = [];
    for (let i = 0; i < 9; i++) {
      this.floatNotes.push({
        a: (i / 9) * U.TAU,
        r: 170 + (i % 3) * 34,
        speed: 0.18 + (i % 4) * 0.04,
        size: 12 + (i % 3) * 5,
        phase: U.hash(i * 3.1) * U.TAU,
      });
    }
    this.hit = null;
  }

  update(dt, pointer) {
    this.t += dt;
    this.wiggle = Math.max(0, this.wiggle - dt * 2.4);
    this.petter = Math.max(0, this.petter - dt);
    this.charT = (this.charT || 0) + dt;
  }

  poke() {
    this.wiggle = 1;
    this.petter = 1.6;
    this.game.audio.sfx('double');
    this.game.burst(350, 460, 16, { hearts: true, spread: 120, speed: 190 });
  }

  draw(ctx, pointer) {
    const t = this.t;
    const W = U.W, H = U.H;
    const fx = this.game.frameX || 0;
    const camX = 300 + Math.sin(t * 0.12) * 26;
    const world = this.game.world;

    ctx.save();
    // dreamy far-away candy kingdom, kept quiet behind the menu
    world.drawSky(ctx, t, camX);
    const far = world.farTile;
    const farW = far.logicalW || far.width;
    const farH = far.logicalH || far.height;
    let off = -((camX * 0.08) % farW);
    if (off > 0) off -= farW;
    for (let x = off; x < W + farW; x += farW) ctx.drawImage(far, x, 0, farW, farH);

    ctx.save();
    ctx.translate(fx, 0);
    this._drawTitleCandy(ctx, t);
    ctx.restore();

    world.drawGround(ctx, camX, t);

    // warm vignette, full bleed
    const v = ctx.createRadialGradient(W * 0.5, H * 0.42, H * 0.25, W * 0.5, H * 0.5, W * 0.75);
    v.addColorStop(0, 'rgba(255,247,230,0)');
    v.addColorStop(1, 'rgba(164,99,117,0.16)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(fx, 0);

    // soft spotlight for the right-hand menu
    const menuGlow = ctx.createRadialGradient(865, 370, 40, 865, 370, 470);
    menuGlow.addColorStop(0, 'rgba(255,250,241,0.45)');
    menuGlow.addColorStop(0.6, 'rgba(255,249,240,0.24)');
    menuGlow.addColorStop(1, 'rgba(255,249,240,0)');
    ctx.fillStyle = menuGlow;
    ctx.fillRect(520, 0, 760, H);

    // a little candy ring around the plush's feet
    this._drawFootCandy(ctx, 350, 574, t);

    // glow behind plush
    const glow = ctx.createRadialGradient(350, 410, 20, 350, 410, 240);
    glow.addColorStop(0, 'rgba(255,252,235,0.8)');
    glow.addColorStop(0.55, 'rgba(255,235,243,0.28)');
    glow.addColorStop(1, 'rgba(255,235,243,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(350, 410, 240, 0, U.TAU);
    ctx.fill();

    // floating notes
    for (const n of this.floatNotes) {
      const a = n.a + t * n.speed;
      const x = 350 + Math.cos(a) * n.r;
      const y = 420 + Math.sin(a * 0.9) * n.r * 0.5;
      const alpha = 0.35 + 0.25 * Math.sin(t * 2 + n.phase);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t + n.phase) * 0.2);
      U.drawNote(ctx, 0, 0, n.size, 0, 'rgba(255,255,255,0.9)', alpha);
      ctx.restore();
      U.drawSparkle(ctx, x + 12, y - 12, 3.5, '#FFF8E4', a, 0.5);
    }

    // character shadow
    ctx.fillStyle = 'rgba(150,82,104,0.16)';
    ctx.beginPath();
    ctx.ellipse(350, 574, 100, 20, 0, 0, U.TAU);
    ctx.fill();

    // pointer-following eyes
    let look = { x: 0, y: 0 };
    if (pointer && pointer.inside) {
      const dx = pointer.x - 350;
      const dy = pointer.y - 430;
      const len = Math.hypot(dx, dy) || 1;
      look = { x: U.clamp(dx / len, -1, 1) * 0.85, y: U.clamp(dy / len, -1, 1) * 0.7 };
    }
    const wiggle = Math.sin(this.wiggle * 10) * this.wiggle * 0.08;
    const petter = this.petter > 0 ? Math.sin((1.6 - this.petter) * 14) * 0.02 : 0;
    const bounce = Math.sin(t * 2.1) * 3 + Math.sin(t * 3.7) * 1.5;
    this.game.character.draw(ctx, 350, 460 + bounce, 112, {
      time: t,
      phase: t * 2.2,
      grounded: true,
      expression: this.petter > 0 ? 'cheer' : 'happy',
      look,
      rotation: wiggle + Math.sin(t * 1.4) * 0.015,
      scaleX: 1 + petter,
      scaleY: 1 - petter,
      aura: true,
      speedTier: 1,
    });

    // small interaction hint
    const hintAlpha = 0.55 + Math.sin(t * 2.4) * 0.2;
    U.text(ctx, '摸摸我 ✦', 350, 630, {
      size: 15, family: U.FONT_DISPLAY, color: 'rgba(185,110,130,0.85)', align: 'center',
      alpha: hintAlpha,
    });

    // title lockup
    this._drawTitleLockup(ctx, t, pointer);

    // start + swatches
    this._drawMenu(ctx, t, pointer);

    // footer
    U.text(ctx, 'MELOFUFF · PLUSH SOUND PLAYGROUND', 30, 700, {
      size: 11, family: U.FONT_ROUND, color: 'rgba(154,107,120,0.55)', letterSpacing: 2.4,
    });
    U.text(ctx, '第一关 内测原型 · 2026', 1250, 700, {
      size: 11, family: U.FONT_UI, color: 'rgba(154,107,120,0.5)', align: 'right', letterSpacing: 1,
    });
    ctx.restore();
    ctx.restore();
  }

  _drawTitleCandy(ctx, t) {
    // a big candy-cane arch frames the plush like a storybook stage
    this._titleArch(ctx, 350, 640, 430, 300, t);
    // lollipops peeking in from the edges
    this._titleLollipop(ctx, 62, 640, 112, '#FFB3C9', -0.06, t);
    this._titleLollipop(ctx, 1225, 640, 94, '#C7ACEE', 0.05, t);
    this._titleLollipop(ctx, 1076, 640, 62, '#A9E5D0', 0.07, t);

    // a bunting of tiny flags between the arch shoulders
    ctx.save();
    ctx.strokeStyle = 'rgba(255,250,240,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(138, 360);
    ctx.quadraticCurveTo(350, 435, 562, 360);
    ctx.stroke();
    const flags = ['#FFAFC7', '#FFE0A4', '#A9E5CF', '#D6B8F0', '#FFAFC7', '#FFD7A2', '#B7E3F4', '#D6B8F0'];
    for (let i = 0; i < flags.length; i++) {
      const q = (i + 0.5) / flags.length;
      const px = U.lerp(140, 560, q);
      const py = 360 + Math.sin(q * Math.PI) * 70;
      ctx.fillStyle = flags[i];
      ctx.beginPath();
      ctx.moveTo(px - 8, py);
      ctx.lineTo(px + 8, py);
      ctx.lineTo(px, py + 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // foreground gummy pebbles
    for (let i = 0; i < 7; i++) {
      const px = 20 + U.hash(i * 3.3) * 1240;
      const py = 600 + U.hash(i * 5.1) * 26;
      ctx.fillStyle = ['#FFB2C8', '#A9E6D2', '#E0C5F5', '#FFD79E'][i % 4];
      ctx.beginPath();
      ctx.ellipse(px, py, 8 + U.hash(i) * 7, 5 + U.hash(i * 2) * 4, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(px - 2, py - 2, 2, 0, U.TAU);
      ctx.fill();
    }
  }

  _titleArch(ctx, cx, base, span, height, t) {
    ctx.save();
    ctx.translate(cx, base);
    const path = new Path2D();
    path.moveTo(-span / 2, 0);
    path.lineTo(-span / 2, -height);
    path.quadraticCurveTo(0, -height - span * 0.62, span / 2, -height);
    path.lineTo(span / 2, 0);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(210,137,158,0.35)';
    ctx.lineWidth = 35;
    ctx.stroke(path);
    ctx.strokeStyle = '#FFF8EA';
    ctx.lineWidth = 29;
    ctx.stroke(path);
    ctx.strokeStyle = '#FF9FB8';
    ctx.lineWidth = 29;
    ctx.setLineDash([38, 38]);
    ctx.stroke(path);
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 7;
    ctx.stroke(path);

    // icing frills at the feet
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#FFF9ED';
      ctx.beginPath();
      ctx.arc((side * span) / 2, 0, 22, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,200,216,0.7)';
      ctx.beginPath();
      ctx.arc((side * span) / 2, 4, 8, 0, Math.PI);
      ctx.fill();
    }

    // a star charm at the top
    ctx.save();
    ctx.translate(0, -height - span * 0.3);
    U.drawStar(ctx, 0, 0, 20, 0.48, 5, -Math.PI / 2 + Math.sin(t) * 0.1);
    const sg = ctx.createLinearGradient(0, -20, 0, 20);
    sg.addColorStop(0, '#FFF7CF');
    sg.addColorStop(1, '#FFD58E');
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  _titleLollipop(ctx, cx, base, size, color, lean, t) {
    ctx.save();
    ctx.translate(cx, base);
    ctx.rotate(lean + Math.sin(t * 0.8 + cx) * 0.01);
    const stickH = size * 2.1;
    const sg = ctx.createLinearGradient(-7, 0, 8, 0);
    sg.addColorStop(0, '#FFF7EA');
    sg.addColorStop(1, '#EAD4BE');
    ctx.fillStyle = sg;
    U.roundRectPath(ctx, -6, -stickH, 12, stickH + 30, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,140,112,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const rr = size * 0.56;
    const hy = -stickH;
    const g = ctx.createRadialGradient(-rr * 0.3, hy - rr * 0.3, 3, 0, hy, rr * 1.18);
    g.addColorStop(0, U.shade(color, 0.42));
    g.addColorStop(0.6, color);
    g.addColorStop(1, U.shade(color, -0.14));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, hy, rr, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = U.rgba(U.shade(color, -0.3), 0.32);
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.strokeStyle = '#FFF8E8';
    ctx.lineWidth = Math.max(5, size * 0.085);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 3.4; a += 0.14) {
      const rad = (a / (Math.PI * 3.4)) * rr * 0.82;
      const px = Math.cos(a) * rad;
      const py = hy + Math.sin(a) * rad;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-rr * 0.33, hy - rr * 0.36, rr * 0.2, rr * 0.1, -0.55, 0, U.TAU);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      U.drawSparkle(ctx, -rr * 0.4 + i * rr * 0.3, hy + rr * 0.4 + Math.sin(t * 2 + i) * 4, 2.5, '#FFF8E4', i, 0.65);
    }
    ctx.restore();
  }

  _drawFootCandy(ctx, cx, baseY, t) {
    ctx.save();
    // tiny gumdrops and flowers around the feet
    const spots = [
      [-150, 2, '#FFB3C9', 0.9], [-112, 8, '#FFE0A4', 0.8], [-72, 4, '#A9E5D0', 0.75],
      [78, 3, '#D6B8F0', 0.8], [120, 7, '#FFB3C9', 0.9], [158, 2, '#FFD79E', 0.7],
    ];
    for (let i = 0; i < spots.length; i++) {
      const [dx, dy, color, scale] = spots[i];
      const bob = Math.sin(t * 1.7 + i) * 1.5;
      ctx.save();
      ctx.translate(cx + dx, baseY + dy + bob);
      ctx.scale(scale, scale);
      if (i % 3 === 0) {
        // small candy flower
        ctx.fillStyle = color;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * U.TAU;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 6, -5 + Math.sin(a) * 6, 5, 0, U.TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#FFF3B2';
        ctx.beginPath();
        ctx.arc(0, -5, 3, 0, U.TAU);
        ctx.fill();
      } else {
        // gumdrop
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.bezierCurveTo(-10, -13, -4, -17, 0, -17);
        ctx.bezierCurveTo(4, -17, 10, -13, 9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(-3, -11, 2.4, 0, U.TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    // soft shadow under the feet
    ctx.fillStyle = 'rgba(145,80,101,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, baseY + 1, 78, 12, 0, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  }

  _drawStagePedestal(ctx, cx, topY, halfW) {
    ctx.save();
    // shadow under the macaron
    ctx.fillStyle = 'rgba(142,78,99,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx, topY + 52, halfW * 1.12, 16, 0, 0, U.TAU);
    ctx.fill();
    // bottom shell
    const bg = ctx.createLinearGradient(0, topY + 18, 0, topY + 54);
    bg.addColorStop(0, '#FFD3E0');
    bg.addColorStop(1, '#F3AEC3');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(cx, topY + 30, halfW * 0.96, 30, 0, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(211,130,154,0.35)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // cream filling
    ctx.fillStyle = '#FFF4DF';
    ctx.beginPath();
    ctx.ellipse(cx, topY + 15, halfW * 1.01, 18, 0, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,185,150,0.3)';
    ctx.stroke();
    // top shell
    const tg = ctx.createRadialGradient(cx - halfW * 0.3, topY - 8, 4, cx, topY + 2, halfW * 1.05);
    tg.addColorStop(0, '#FFF3F7');
    tg.addColorStop(0.5, '#FFCFDD');
    tg.addColorStop(1, '#F3AEC4');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.ellipse(cx, topY + 2, halfW, 20, 0, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(211,130,154,0.32)';
    ctx.stroke();
    // sugar pearls and sprinkles
    for (let i = 0; i < 12; i++) {
      const px = cx + (U.hash(i * 3.4) - 0.5) * halfW * 1.6;
      const py = topY - 4 + U.hash(i * 5.8) * 24;
      ctx.fillStyle = ['#FFF7E0', '#FFB4CA', '#A9E5CF', '#FFE0A0'][i % 4];
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(U.hash(i * 2.2) * 3);
      U.roundRectPath(ctx, -4.5, -1.5, 9, 3, 1.5);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  _drawStageHill(ctx, cx, base, rx, ry) {
    ctx.save();
    const g = ctx.createLinearGradient(0, base - ry, 0, base + 30);
    g.addColorStop(0, '#FFF8EB');
    g.addColorStop(0.5, '#FFEBEE');
    g.addColorStop(1, '#FFDCE4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
    ctx.rect(cx - rx, base, rx * 2, 50);
    ctx.fill();
    // icing scallop
    ctx.fillStyle = '#FFFDF6';
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.95, base - ry * 0.12);
    for (let i = 0; i <= 10; i++) {
      const px = cx - rx + (rx * 2 * i) / 10;
      const py = base - ry + 12 + Math.sin((i / 10) * Math.PI) * -8;
      ctx.quadraticCurveTo(px - rx / 10 * 0.5, py + 16, px, py);
    }
    ctx.lineTo(cx + rx, base + 4);
    ctx.lineTo(cx - rx, base + 4);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 10; i++) {
      const sx = cx - rx * 0.8 + U.hash(i * 3.4) * rx * 1.6;
      const sy = base - ry * (0.35 + U.hash(i * 6.8) * 0.35);
      ctx.fillStyle = ['#FFB6CB', '#9EE4CC', '#FFD89C'][i % 3];
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(U.hash(i * 8) * 3);
      U.roundRectPath(ctx, -4, -1.5, 8, 3, 1.5);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  _drawTitleLockup(ctx, t, pointer) {
    const bob = Math.sin(t * 1.6) * 2.5;

    // demo chip
    CandyUI.panel(ctx, 28, 26, 196, 34, 17, { fill: 'rgba(255,250,240,0.72)', shadow: false, border: 'rgba(255,255,255,0.6)' });
    ctx.save();
    ctx.translate(46, 43);
    ctx.fillStyle = '#FFB3C7';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, U.TAU);
    ctx.fill();
    ctx.restore();
    U.text(ctx, '内测互动原型 · DEMO 01', 58, 44, {
      size: 12, color: 'rgba(154,107,120,0.85)', letterSpacing: 0.8,
    });

    // logo
    ctx.save();
    ctx.translate(700, 162 + bob);
    const logoGrad = ctx.createLinearGradient(0, -80, 0, 50);
    logoGrad.addColorStop(0, '#FF9EB5');
    logoGrad.addColorStop(0.55, '#FF7E9E');
    logoGrad.addColorStop(1, '#EE6D92');
    U.text(ctx, 'MeloFuff', 0, 0, {
      size: 118, family: U.FONT_ROUND, color: logoGrad, align: 'left',
      stroke: '#FFFDF4', strokeWidth: 14, shadow: 'rgba(189,89,119,0.28)', shadowBlur: 22, shadowY: 8,
    });
    U.drawSparkle(ctx, 18, -74, 15, '#FFF7D0', t * 0.4, 0.95);
    U.drawSparkle(ctx, 473, -54, 9, '#FFF8E4', t * 0.4 + 0.6, 0.8);
    // tiny heart on the o
    U.drawHeart(ctx, 315, -45, 17, 'rgba(255,255,255,0.95)', 0.95);
    ctx.restore();

    // Chinese name pill
    ctx.save();
    ctx.translate(700, 248 + bob * 0.6);
    ctx.rotate(-0.018);
    ctx.fillStyle = 'rgba(255,250,241,0.92)';
    U.roundRectPath(ctx, 0, -31, 196, 62, 31);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    U.text(ctx, '音绒仔', 20, 1, {
      size: 42, family: U.FONT_DISPLAY, color: '#7A5464', align: 'left',
    });
    U.text(ctx, 'PLUSH', 132, 2, {
      size: 12, family: U.FONT_ROUND, color: 'rgba(200,137,155,0.8)', letterSpacing: 2,
    });
    // little bow on pill
    CandyUI.miniPlush(ctx, 170, -32, 17, this.game.character.theme, t);
    ctx.restore();

    // level line
    U.text(ctx, '第一关 · 甜糖丘陵', 700, 320 + bob * 0.5, {
      size: 32, family: U.FONT_DISPLAY, color: '#C86F8D', align: 'left',
    });
    U.text(ctx, '五官启蒙  ·  一场关于糖果与声音的轻治愈跑酷', 702, 355 + bob * 0.4, {
      size: 15, color: 'rgba(126,89,103,0.72)', align: 'left', letterSpacing: 0.5,
    });

    // five senses chips
    const senses = ['eye', 'ear', 'nose', 'mouth', 'hand'];
    const labels = ['看见', '听见', '闻到', '尝到', '摸到'];
    for (let i = 0; i < 5; i++) {
      const x = 704 + i * 78;
      const y = 386 + bob * 0.2;
      ctx.fillStyle = 'rgba(255,252,246,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 17, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      CandyUI.senseIcon(ctx, senses[i], x, y, 10, ['#F27D9B', '#62BC9E', '#CF9A4F', '#DC7591', '#9575D2'][i], 1);
      U.text(ctx, labels[i], x + 24, y + 1, { size: 12, color: 'rgba(121,82,95,0.84)' });
    }
  }

  _drawMenu(ctx, t, pointer) {
    const touch = this.game.touch;
    const startRect = { x: 700, y: 412, w: 300, h: 80 };
    const skipRect = { x: 700, y: 506, w: 300, h: 38 };
    this.startRect = startRect;
    this.skipRect = skipRect;
    const hovered = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, startRect);
    const hoveredSkip = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, skipRect);

    // pulse halo
    const haloA = 0.18 + Math.sin(t * 2.2) * 0.06;
    const hg = ctx.createRadialGradient(850, 452, 40, 850, 452, 200);
    hg.addColorStop(0, `rgba(255,150,177,${haloA})`);
    hg.addColorStop(1, 'rgba(255,150,177,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(850, 452, 200, 0, U.TAU);
    ctx.fill();

    CandyUI.button(ctx, startRect, '开始音绒仔测试', {
      hover: hovered, primary: true, size: 30,
      sub: touch ? '轻触开始 · 声音题可跳过' : '20 道小问题 · 约 2 分钟',
    });

    // a soft, secondary way to jump straight into the level
    ctx.save();
    const skipScale = hoveredSkip ? 1.02 : 1;
    ctx.translate(850, skipRect.y + skipRect.h / 2);
    ctx.scale(skipScale, skipScale);
    ctx.translate(-850, -(skipRect.y + skipRect.h / 2));
    ctx.fillStyle = hoveredSkip ? 'rgba(255,255,255,0.92)' : 'rgba(255,251,244,0.62)';
    U.roundRectPath(ctx, skipRect.x, skipRect.y, skipRect.w, skipRect.h, 19);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    U.text(ctx, touch ? '先跳过测试，直接开始冒险 →' : '先跳过测试，直接开始冒险 →', 850, skipRect.y + 20, {
      size: 13, family: U.FONT_DISPLAY, color: 'rgba(168,111,130,0.85)', align: 'center',
    });
    ctx.restore();

    // theme picker
    U.text(ctx, '或先选一只样例音绒仔', 700, 568, {
      size: 15, family: U.FONT_DISPLAY, color: 'rgba(124,88,102,0.8)',
    });
    U.text(ctx, touch ? '轻触图案换装' : '按 1 ~ 4 换装', 1012, 569, {
      size: 11, color: 'rgba(160,117,130,0.6)',
    });
    const swatchY = 602;
    this.swatchHit = [];
    for (let i = 0; i < MELO_THEMES.length; i++) {
      const x = 714 + i * 112;
      const selected = this.game.themeIndex === i;
      const hov = pointer && pointer.inside && Math.hypot(pointer.x - x, pointer.y - swatchY) < 32;
      ctx.save();
      if (selected) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(x, swatchY, 31, 0, U.TAU);
        ctx.fill();
        ctx.strokeStyle = '#FFA9C1';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(x, swatchY, Math.max(1, 31), 0, U.TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      CandyUI.miniPlush(ctx, x, swatchY - 2, 22, MELO_THEMES[i], t);
      if (hov) {
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, swatchY, 29, 0, U.TAU);
        ctx.stroke();
      }
      ctx.restore();
      U.text(ctx, MELO_THEMES[i].name, x, swatchY + 36, {
        size: 11.5, family: U.FONT_UI, color: selected ? '#C96F8C' : 'rgba(138,101,113,0.65)', align: 'center',
        weight: selected ? 600 : 400,
      });
      this.swatchHit.push({ x, y: swatchY, r: 32, index: i });
    }

    // her material caption
    const custom = !!this.game.customTheme;
    U.text(ctx, `${this.game.character.theme.name} · ${this.game.character.theme.material}`, 700, 662, {
      size: 12, color: 'rgba(166,116,132,0.78)', letterSpacing: 0.5,
    });
    if (custom) {
      ctx.fillStyle = 'rgba(169,231,213,0.8)';
      U.roundRectPath(ctx, 980, 652, 78, 21, 10.5);
      ctx.fill();
      U.text(ctx, '测试专属', 1019, 662, {
        size: 10, color: '#5E9C86', align: 'center', letterSpacing: 1,
      });
      U.text(ctx, '再做一次测试，会遇见另一只音绒仔', 700, 684, {
        size: 10.5, color: 'rgba(166,116,132,0.5)',
      });
    } else {
      U.text(ctx, '测试会生成专属配色、材质与声线', 700, 684, {
        size: 10.5, color: 'rgba(166,116,132,0.5)',
      });
    }
    this.charHit = { x: 350, y: 455, r: 150 };
  }

  useStart(px, py) {
    return this.startRect && U.pointInRect(px, py, this.startRect);
  }

  useSkip(px, py) {
    return this.skipRect && U.pointInRect(px, py, this.skipRect);
  }

  swatchAt(px, py) {
    if (!this.swatchHit) return null;
    for (const s of this.swatchHit) {
      if (Math.hypot(px - s.x, py - s.y) < s.r) return s.index;
    }
    return null;
  }

  charAt(px, py) {
    return this.charHit && Math.hypot(px - this.charHit.x, py - this.charHit.y) < this.charHit.r;
  }
}

/* =========================================================
   Ending cinematic
   ========================================================= */

class EndingScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.confetti = [];
    this.flags = [2, 3, 4, 5, 6, 7];
    this.sparkles = [];
    this.replayRect = { x: 520, y: 600, w: 240, h: 64 };
    this.skipRect = { x: 1084, y: 82, w: 142, h: 38 };
    this.finalSfx = false;
    this.swellSfx = false;
    const rng = U.mulberry32(8811);
    for (let i = 0; i < 125; i++) {
      this.confetti.push({
        x: rng() * U.W,
        y: -20 - rng() * 500,
        vx: (rng() - 0.5) * 40,
        vy: 40 + rng() * 80,
        size: 3 + rng() * 6,
        rot: rng() * U.TAU,
        vr: (rng() - 0.5) * 5,
        color: ['#FFA9C4', '#FFD88F', '#A9E6D1', '#C6A9F2', '#FFF4DF'][Math.floor(rng() * 5)],
        delay: rng() * 2.8,
      });
    }
    for (let i = 0; i < 18; i++) {
      this.sparkles.push({
        x: rng() * U.W, y: rng() * U.H, phase: rng() * U.TAU,
        size: 1 + rng() * 2.5, speed: 0.2 + rng() * 0.4,
      });
    }
  }

  update(dt, pointer) {
    this.t += dt;
    if (!this.swellSfx && this.t > 11.1) {
      this.swellSfx = true;
      this.game.audio.setMood('swell', 1.2);
      this.game.audio.sfx('finish');
      this.game.burst(640, 250, 42, { sparkle: true, spread: 380, speed: 340, life: 1.7 });
    }
    if (!this.finalSfx && this.t > 12.4) {
      this.finalSfx = true;
      this.game.audio.sfx('milestone');
    }
    for (const c of this.confetti) {
      if (this.t < c.delay) continue;
      c.y += c.vy * dt;
      c.x += c.vx * dt + Math.sin(this.t * 2 + c.rot) * 10 * dt;
      c.rot += c.vr * dt;
      if (c.y > U.H + 20) {
        c.y = -20;
        c.x = Math.random() * U.W;
      }
    }
  }

  skip() {
    if (this.t < 11.4) {
      this.t = 11.4;
      this.game.audio.setMood('swell', 0.4);
      this.game.audio.sfx('finish');
    }
  }

  draw(ctx, pointer) {
    const t = this.t;
    const fx = this.game.frameX || 0;
    if (t < 4.9) {
      this._drawHilltop(ctx, t);
    } else if (t < 10.2) {
      this._drawCloseup(ctx, t - 4.9);
    } else {
      this._drawVista(ctx, t - 10.2, pointer);
    }

    // soft transition flashes
    if (t > 4.6 && t < 5.1) {
      const a = 1 - Math.abs((t - 4.85) / 0.25);
      ctx.fillStyle = `rgba(255,252,242,${U.clamp(a, 0, 1) * 0.9})`;
      ctx.fillRect(0, 0, U.W, U.H);
    }
    if (t > 9.9 && t < 10.5) {
      const a = 1 - Math.abs((t - 10.2) / 0.3);
      ctx.fillStyle = `rgba(255,248,232,${U.clamp(a, 0, 1) * 0.85})`;
      ctx.fillRect(0, 0, U.W, U.H);
    }

    // skip affordance
    if (t < 11.2) {
      ctx.save();
      ctx.translate(fx, 0);
      const hov = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, this.skipRect);
      CandyUI.panel(ctx, this.skipRect.x, this.skipRect.y, this.skipRect.w, this.skipRect.h, 21, {
        fill: hov ? 'rgba(255,250,242,0.92)' : 'rgba(255,250,242,0.6)',
        shadow: false, border: 'rgba(255,255,255,0.75)',
      });
      U.text(ctx, '跳过结尾 ›', this.skipRect.x + this.skipRect.w / 2, this.skipRect.y + this.skipRect.h / 2 + 1, {
        size: 13, color: 'rgba(146,103,117,0.8)', align: 'center',
      });
      ctx.restore();
    }

    // film grain sparkles always
    for (const s of this.sparkles) {
      const tw = 0.25 + 0.5 * U.pulse(this.t * s.speed + s.phase);
      U.drawSparkle(ctx, s.x, s.y, s.size * 2.2, 'rgba(255,255,255,0.9)', s.phase, tw);
    }
  }

  _drawHilltop(ctx, t) {
    const W = U.W, H = U.H;
    const fx = (W - 1280) / 2;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFF6DE');
    g.addColorStop(0.42, '#FFE3EC');
    g.addColorStop(0.72, '#FFDCE8');
    g.addColorStop(1, '#D9F2EE');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(fx, 0);

    // low sun and glow
    const sun = ctx.createRadialGradient(900, 330, 20, 900, 330, 260);
    sun.addColorStop(0, 'rgba(255,250,220,0.95)');
    sun.addColorStop(0.4, 'rgba(255,231,187,0.45)');
    sun.addColorStop(1, 'rgba(255,231,187,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(900, 330, 260, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,215,0.95)';
    ctx.beginPath();
    ctx.arc(900, 330, 72, 0, U.TAU);
    ctx.fill();

    // clouds
    const cloud = (x, y, s, a) => {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x, y);
      ctx.scale(s, s);
      U.cloudPath(ctx, -150, 0, 300, 110);
      const cg = ctx.createLinearGradient(0, 0, 0, 110);
      cg.addColorStop(0, '#FFFAF0');
      cg.addColorStop(1, '#FFE2EA');
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.restore();
    };
    cloud(220, 130, 1.1, 0.65);
    cloud(1070, 100, 0.8, 0.55);
    cloud(720, 200, 0.6, 0.4);

    // camera push-in: the whole hilltop leans toward the plush's eyes
    ctx.save();
    const zoom = 1 + U.smoothstep(1.4, 4.7, t) * 1.6;
    ctx.translate(640, 470);
    ctx.scale(zoom, zoom);
    ctx.translate(-640, -470);

    // rolling hills with frosted caps
    const hill = (cx, base, rx, ry, color, flag, number) => {
      const hg = ctx.createLinearGradient(0, base - ry, 0, base + 60);
      hg.addColorStop(0, U.shade(color, 0.3));
      hg.addColorStop(1, color);
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      ctx.rect(cx - rx, base, rx * 2, 180);
      ctx.fill();
      // icing
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      ctx.rect(cx - rx, base, rx * 2, 180);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,250,240,0.85)';
      ctx.beginPath();
      ctx.ellipse(cx, base - ry + 18, rx * 0.98, ry * 0.22, 0, 0, U.TAU);
      ctx.fill();
      ctx.restore();
      // flag
      if (number) {
        const fx = cx + rx * 0.32;
        const fy = base - ry * 0.57;
        ctx.strokeStyle = '#FFF7E8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fx, fy + 42);
        ctx.lineTo(fx, fy - 22);
        ctx.stroke();
        ctx.fillStyle = ['#FF9FBB', '#9FE0C7', '#D2B3F0'][number % 3];
        ctx.beginPath();
        ctx.moveTo(fx, fy - 22);
        ctx.lineTo(fx + 32, fy - 13);
        ctx.lineTo(fx, fy - 3);
        ctx.closePath();
        ctx.fill();
        U.text(ctx, String(number), fx + 12, fy - 12, {
          size: 14, family: U.FONT_ROUND, color: '#FFFDF5', align: 'center',
        });
      }
    };
    hill(-260, 660, 360, 170, '#B9E8D4');
    hill(120, 640, 330, 150, '#B9E8D4');
    hill(980, 655, 380, 175, '#D8BDF2');
    hill(560, 670, 320, 145, '#FFC6D8');
    hill(1280, 690, 340, 160, '#FFD8AF');
    hill(1540, 690, 360, 170, '#FFD8AF');
    hill(760, 760, 520, 200, '#FFB9CE');

    // candy path winding into the distance
    ctx.strokeStyle = 'rgba(255,250,235,0.9)';
    ctx.lineWidth = 48;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(640, 680);
    ctx.bezierCurveTo(720, 620, 930, 640, 1010, 590);
    ctx.bezierCurveTo(1090, 545, 980, 510, 880, 500);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,216,170,0.6)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 22]);
    ctx.stroke();
    ctx.setLineDash([]);

    // foreground flowers
    for (let i = 0; i < 12; i++) {
      const fx = 80 + U.hash(i * 3.1) * 1120;
      const fy = 660 + U.hash(i * 5.7) * 50;
      ctx.fillStyle = ['#FFB4C8', '#FFE3A3', '#BEEBD8'][i % 3];
      ctx.beginPath();
      ctx.arc(fx, fy, 4 + U.hash(i) * 3, 0, U.TAU);
      ctx.fill();
    }

    // confetti
    for (const c of this.confetti) {
      if (this.t < c.delay) continue;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.85;
      U.roundRectPath(ctx, -c.size / 2, -c.size / 4, c.size, c.size / 2, c.size / 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // a pair of lollipop trees on the celebration hill
    this._hilltopLollipop(ctx, 150, 700, 68, '#FFB3C9', t);
    this._hilltopLollipop(ctx, 1125, 704, 58, '#CDB0EF', t);
    this._hilltopLollipop(ctx, 1035, 710, 42, '#A9E4CE', t);

    // character
    ctx.fillStyle = 'rgba(146,85,103,0.16)';
    ctx.beginPath();
    ctx.ellipse(640, 612, 100, 20, 0, 0, U.TAU);
    ctx.fill();

    this.game.character.draw(ctx, 640, 510, 108, {
      time: t,
      phase: 0.8,
      grounded: true,
      expression: t < 1.6 ? 'cheer' : 'curious',
      look: { x: 0.2, y: -0.4 },
      aura: true,
      speedTier: 1,
    });
    ctx.restore();

    // celebration text
    const appear = U.smoothstep(0.2, 1.2, t) * (1 - U.smoothstep(2.1, 3.1, t));
    if (appear > 0.001) {
      ctx.save();
      ctx.globalAlpha = appear;
      const slide = (1 - U.easeOutCubic(U.clamp(t / 1.2, 0, 1))) * 24;
      U.text(ctx, '第一关 · 甜糖丘陵', 640, 190 + slide, {
        size: 54, family: U.FONT_DISPLAY, color: '#E37897', align: 'center',
        stroke: 'rgba(255,253,246,0.95)', strokeWidth: 10,
        shadow: 'rgba(178,86,112,0.2)', shadowBlur: 16, shadowY: 6,
      });
      U.text(ctx, '闯关成功！', 640, 244 + slide, {
        size: 23, family: U.FONT_DISPLAY, color: '#B98195', align: 'center', letterSpacing: 5,
      });
      const stats = this.game.runStats;
      CandyUI.panel(ctx, 500, 292 + slide, 280, 36, 18, {
        fill: 'rgba(255,251,242,0.78)', shadow: false, border: 'rgba(255,255,255,0.8)',
      });
      U.text(ctx, `音符 ${stats.notes}   ·   最高连击 ${stats.maxCombo}   ·   五官 ${stats.senses}/5`, 640, 311 + slide, {
        size: 13, color: 'rgba(144,102,115,0.9)', align: 'center', letterSpacing: 0.5,
      });
      ctx.restore();
    }
    ctx.restore();
  }

  _hilltopLollipop(ctx, x, base, size, color, t) {
    ctx.save();
    ctx.translate(x, base);
    ctx.rotate(Math.sin(t * 0.8 + x) * 0.02);
    const stickH = size * 2.1;
    ctx.fillStyle = '#F5E2CD';
    U.roundRectPath(ctx, -5, -stickH, 10, stickH + 20, 5);
    ctx.fill();
    const hy = -stickH;
    const rr = size * 0.55;
    const g = ctx.createRadialGradient(-rr * 0.3, hy - rr * 0.3, 3, 0, hy, rr * 1.15);
    g.addColorStop(0, U.shade(color, 0.4));
    g.addColorStop(1, U.shade(color, -0.1));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, hy, rr, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = U.rgba(U.shade(color, -0.3), 0.25);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = '#FFF8E9';
    ctx.lineWidth = Math.max(4, size * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 3.4; a += 0.16) {
      const rad = (a / (Math.PI * 3.4)) * rr * 0.82;
      const px = Math.cos(a) * rad;
      const py = hy + Math.sin(a) * rad;
      if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-rr * 0.3, hy - rr * 0.35, rr * 0.2, rr * 0.1, -0.5, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  }

  _drawCloseup(ctx, ct) {
    const char = this.game.character;
    // periodic startled blinks
    let blink = 0;
    const bp = (ct - 1.0) % 2.4;
    if (bp > 0 && bp < 0.16) blink = Math.sin((bp / 0.16) * Math.PI);
    const lookX = Math.sin(U.clamp(ct / 2.2, 0, 1) * 1.6) * 0.55;
    const lookY = -U.smoothstep(0.2, 1.6, ct) * 0.55;
    const reflection = U.smoothstep(1.3, 3.6, ct);

    // a very slow push-in, like a curious camera leaning closer
    const W = U.W, H = U.H;
    const push = 1 + U.smoothstep(0, 4.8, ct) * 0.07;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(push, push);
    ctx.translate(-W / 2, -H / 2);
    char.drawCloseup(ctx, {
      time: ct,
      blink,
      wide: true,
      curious: ct < 2.4,
      look: { x: lookX, y: lookY },
      reflection,
    });
    ctx.restore();

    // curiosity question bubble
    if (ct > 0.4 && ct < 3.2) {
      const a = U.smoothstep(0.4, 0.8, ct) * (1 - U.smoothstep(2.7, 3.2, ct));
      ctx.save();
      ctx.globalAlpha = a;
      const bx = W / 2 + 378 + Math.sin(ct * 3) * 6;
      const by = 118;
      ctx.fillStyle = 'rgba(255,251,242,0.92)';
      ctx.beginPath();
      ctx.arc(bx, by, 30, 0, U.TAU);
      ctx.arc(bx + 32, by + 32, 9, 0, U.TAU);
      ctx.fill();
      U.text(ctx, '?', bx, by + 2, {
        size: 44, family: U.FONT_ROUND, color: '#E58AA4', align: 'center',
      });
      ctx.restore();
    }

    // gentle light halo
    const halo = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 500);
    halo.addColorStop(0, 'rgba(255,252,240,0.22)');
    halo.addColorStop(1, 'rgba(255,252,240,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // text whispers
    const msgA = U.smoothstep(1.5, 2.4, ct) * (1 - U.smoothstep(3.6, 4.3, ct));
    if (msgA > 0) {
      U.text(ctx, '它好像看见了什么…', W / 2, 662, {
        size: 16, family: U.FONT_DISPLAY, color: 'rgba(123,79,94,0.7)', align: 'center',
        alpha: msgA, letterSpacing: 3,
      });
    }

    this._irisWipe(ctx, ct);
  }

  _irisWipe(ctx, ct) {
    // cream bloom at the end, opening into the vista
    const a = U.smoothstep(4.25, 5.15, ct);
    if (a <= 0) return;
    const r = U.lerp(0, U.W * 0.7, U.easeInCubic(a));
    const g = ctx.createRadialGradient(U.W / 2, U.H * 0.53, 0, U.W / 2, U.H * 0.53, Math.max(1, r));
    g.addColorStop(0, 'rgba(255,252,241,1)');
    g.addColorStop(0.8, 'rgba(255,246,231,0.98)');
    g.addColorStop(1, 'rgba(255,246,231,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, U.W, U.H);
  }

  _drawVista(ctx, vt, pointer) {
    const W = U.W, H = U.H;
    const fx = (W - 1280) / 2;
    const t = this.t;
    const appear = U.smoothstep(0, 1.0, vt);
    ctx.save();
    ctx.globalAlpha = appear;

    // golden, storybook sky
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFF4D9');
    g.addColorStop(0.28, '#FFE6E9');
    g.addColorStop(0.58, '#FFDCE9');
    g.addColorStop(0.8, '#E4F6F1');
    g.addColorStop(1, '#FFF0DA');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(fx, 0);

    // sun + halo
    const sx = 880, sy = 300;
    const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 300);
    halo.addColorStop(0, 'rgba(255,251,222,0.9)');
    halo.addColorStop(0.5, 'rgba(255,235,198,0.32)');
    halo.addColorStop(1, 'rgba(255,235,198,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, 300, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,250,220,0.95)';
    ctx.beginPath();
    ctx.arc(sx, sy, 62, 0, U.TAU);
    ctx.fill();

    // rainbow
    ctx.save();
    ctx.globalAlpha *= 0.3;
    const rainbow = ['#FF9DB5', '#FFC98F', '#FFEF9E', '#B6E9CE', '#A9D4F4', '#C6ADEE'];
    for (let i = 0; i < rainbow.length; i++) {
      ctx.strokeStyle = rainbow[i];
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.arc(600, 560, 300 + i * 13, Math.PI * 1.08, Math.PI * 1.64);
      ctx.stroke();
    }
    ctx.restore();

    // far hills + numbered levels
    const hill = (cx, base, rx, ry, color, num, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha *= alpha;
      const top = base - ry;
      const hg = ctx.createLinearGradient(0, top, 0, base + 40);
      hg.addColorStop(0, U.shade(color, 0.34));
      hg.addColorStop(0.55, color);
      hg.addColorStop(1, U.shade(color, -0.05));
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      ctx.rect(cx - rx, base, rx * 2, 160);
      ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(color, -0.25), 0.3);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      ctx.stroke();

      // frosted crest with piped scallops
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      ctx.rect(cx - rx, base, rx * 2, 160);
      ctx.clip();
      const capH = Math.min(54, ry * 0.28);
      ctx.fillStyle = 'rgba(255,250,241,0.94)';
      ctx.beginPath();
      ctx.moveTo(cx - rx, top + capH + 22);
      const scallops = Math.max(5, Math.round(rx / 80));
      for (let i = 0; i <= scallops; i++) {
        const px = cx - rx + (rx * 2 * i) / scallops;
        const py = top + capH + Math.sin((i / scallops) * Math.PI) * -8;
        ctx.quadraticCurveTo(px - rx / scallops * 0.5, py + 20, px, py);
      }
      ctx.lineTo(cx + rx, top - 24);
      ctx.lineTo(cx - rx, top - 24);
      ctx.closePath();
      ctx.fill();
      // cream pearls along the frill
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      for (let i = 0; i < 9; i++) {
        const px = cx - rx * 0.8 + (rx * 1.6 * i) / 8;
        const py = top + 28 + Math.sin((i / 8) * Math.PI) * 16;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, U.TAU);
        ctx.fill();
      }
      // sugar sprinkles on the slope
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = ['rgba(255,255,255,.7)', 'rgba(255,190,210,.7)', 'rgba(255,239,170,.7)', 'rgba(170,230,208,.7)'][i % 4];
        ctx.beginPath();
        ctx.arc(cx + (U.hash(i * 3.2 + cx) - 0.5) * rx * 1.5, top + 36 + U.hash(i * 5.4 + cx) * ry * 0.6, 1.6 + U.hash(i) * 2.2, 0, U.TAU);
        ctx.fill();
      }
      ctx.restore();
      if (num) {
        const crest = base - ry;
        // little candy gate on the hill crest
        const gw = 38;
        ctx.strokeStyle = 'rgba(255,250,240,0.92)';
        ctx.lineWidth = 9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - gw, crest + 18);
        ctx.lineTo(cx - gw, crest - 34);
        ctx.quadraticCurveTo(cx, crest - 78, cx + gw, crest - 34);
        ctx.lineTo(cx + gw, crest + 18);
        ctx.stroke();
        ctx.strokeStyle = ['#FF9FB9', '#8EDCC3', '#C9A7EA', '#FFD086'][num % 4];
        ctx.lineWidth = 9;
        ctx.setLineDash([11, 11]);
        ctx.beginPath();
        ctx.moveTo(cx - gw, crest + 18);
        ctx.lineTo(cx - gw, crest - 34);
        ctx.quadraticCurveTo(cx, crest - 78, cx + gw, crest - 34);
        ctx.lineTo(cx + gw, crest + 18);
        ctx.stroke();
        ctx.setLineDash([]);
        // level flag
        const fx = cx + gw + 14;
        const fy = crest - 34;
        ctx.strokeStyle = '#FFF9EA';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(fx, fy + 72);
        ctx.lineTo(fx, fy - 26);
        ctx.stroke();
        ctx.fillStyle = ['#FF8FAD', '#6FD1B3', '#B18AD8', '#F5B95B'][num % 4];
        ctx.beginPath();
        ctx.moveTo(fx, fy - 26);
        ctx.lineTo(fx + 40, fy - 15);
        ctx.lineTo(fx, fy - 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        U.text(ctx, String(num), fx + 18, fy - 14, {
          size: 18, family: U.FONT_ROUND, color: '#FFFDF4', align: 'center',
        });
        // a little lollipop tree beside the gate
        ctx.strokeStyle = '#FFF8EA';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cx - gw - 26, crest + 18);
        ctx.lineTo(cx - gw - 26, crest - 30);
        ctx.stroke();
        const lc = ['#FFB3C9', '#A9E4CE', '#D2B4F0', '#FFD29C'][num % 4];
        ctx.fillStyle = lc;
        ctx.beginPath();
        ctx.arc(cx - gw - 26, crest - 38, 15, 0, U.TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx - gw - 26, crest - 38, 8, 0, Math.PI * 1.5);
        ctx.stroke();
        // cream badge on the gate
        ctx.fillStyle = 'rgba(255,250,240,0.95)';
        ctx.beginPath();
        ctx.arc(cx, crest - 28, 13, 0, U.TAU);
        ctx.fill();
        U.text(ctx, String(num), cx, crest - 27, {
          size: 15, family: U.FONT_ROUND, color: '#D87896', align: 'center',
        });
      }
      ctx.restore();
    };
    // a wafer castle tucked behind the hills
    this._castle(ctx, 1040, 630, 0.9, t);

    hill(-300, 660, 300, 165, '#BDEBD8', 0, 0.8);
    hill(-40, 640, 280, 160, '#BDEBD8', 0, 0.82);
    hill(210, 665, 265, 165, '#D1B4ED', 2, 0.9);
    hill(450, 650, 235, 150, '#FFBFD3', 3, 0.94);
    hill(690, 675, 260, 175, '#FFD19B', 4, 0.97);
    hill(930, 650, 275, 165, '#B4E6D3', 5, 1);
    hill(1170, 670, 290, 155, '#CDB1EB', 6, 1);
    hill(1380, 690, 265, 170, '#FFBFD3', 7, 1);
    hill(1580, 680, 300, 170, '#D1B4ED', 0, 1);

    // winding path & flags
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,250,238,0.95)';
    ctx.lineWidth = 52;
    ctx.beginPath();
    ctx.moveTo(455, 668);
    ctx.bezierCurveTo(560, 632, 700, 655, 810, 590);
    ctx.bezierCurveTo(905, 530, 1040, 560, 1120, 500);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,209,161,0.55)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 24]);
    ctx.stroke();
    ctx.setLineDash([]);

    // red carpet-ish dots along the path
    for (let i = 0; i < 14; i++) {
      const t1 = i / 13;
      const px = U.lerp(470, 1110, t1) + Math.sin(t1 * 7) * 26;
      const py = U.lerp(655, 505, t1) + Math.cos(t1 * 5) * 12;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, U.TAU);
      ctx.fill();
    }

    // balloons
    const balloon = (bx, by, s, c1, c2) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(s, s);
      const bg = ctx.createLinearGradient(-20, -30, 20, 30);
      bg.addColorStop(0, c1);
      bg.addColorStop(1, c2);
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 32, 0, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 26);
      ctx.quadraticCurveTo(-4, 44, 0, 50);
      ctx.moveTo(10, 26);
      ctx.quadraticCurveTo(4, 44, 0, 50);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,248,236,0.9)';
      U.roundRectPath(ctx, -13, 48, 26, 14, 5);
      ctx.fill();
      ctx.restore();
    };
    balloon(180, 230, 1.0, '#FFB4CA', '#F184A6');
    balloon(1160, 190, 0.75, '#A8E5CD', '#78C6AC');
    balloon(1000, 120, 0.55, '#D2B4F0', '#A981D8');

    // clouds
    const cloud = (x, y, s, a) => {
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(x, y);
      ctx.scale(s, s);
      U.cloudPath(ctx, -150, 0, 300, 110);
      const cg = ctx.createLinearGradient(0, 0, 0, 110);
      cg.addColorStop(0, '#FFFCF2');
      cg.addColorStop(1, '#FFE7EE');
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.restore();
    };
    cloud(130, 120, 0.9, 0.7);
    cloud(700, 70, 0.7, 0.55);
    cloud(1240, 120, 0.8, 0.6);

    // foreground hill and character back
    const fg = ctx.createLinearGradient(0, 540, 0, H);
    fg.addColorStop(0, '#FFF8EC');
    fg.addColorStop(0.28, '#FFE9DA');
    fg.addColorStop(1, '#FFC9D8');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(330, 790, 560, 220, 0, Math.PI, 0);
    ctx.rect(-230, 790, 1120, 80);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,253,246,0.88)';
    ctx.beginPath();
    ctx.ellipse(355, 632, 300, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    // a little local mound the plush can stand on
    ctx.fillStyle = '#FFD9E3';
    ctx.beginPath();
    ctx.ellipse(360, 790, 330, 160, 0, Math.PI, 0);
    ctx.rect(30, 790, 660, 60);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,251,243,0.9)';
    ctx.beginPath();
    ctx.ellipse(360, 660, 280, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // character from behind, fully visible above the little hill
    this.game.character.drawBack(ctx, 360, 558, 74, {
      time: t, phase: 1.1, lean: -0.04,
    });
    // little exclamation
    const bubbleA = U.smoothstep(0.8, 1.4, vt);
    if (bubbleA > 0) {
      ctx.save();
      ctx.globalAlpha *= bubbleA;
      ctx.fillStyle = 'rgba(255,252,244,0.94)';
      ctx.beginPath();
      ctx.arc(292, 462, 24, 0, U.TAU);
      ctx.arc(305, 489, 8, 0, U.TAU);
      ctx.fill();
      U.text(ctx, '!', 292, 463, { size: 28, family: U.FONT_ROUND, color: '#E890A8', align: 'center' });
      ctx.restore();
    }

    // foreground flowers
    for (let i = 0; i < 16; i++) {
      const fx = 30 + U.hash(i * 2.7) * 1240;
      const fy = 690 + U.hash(i * 5.9) * 26;
      ctx.fillStyle = ['#FF9FBB', '#FFE0A0', '#B7EBD5', '#D6B9F2'][i % 4];
      ctx.beginPath();
      ctx.arc(fx, fy, 3 + U.hash(i * 1.3) * 4, 0, U.TAU);
      ctx.fill();
    }

    // confetti
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.8;
      U.roundRectPath(ctx, -c.size / 2, -c.size / 4, c.size, c.size / 2, c.size / 4);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // headline
    const headlineIn = U.smoothstep(1.2, 2.2, vt);
    if (headlineIn > 0) {
      const sc = U.lerp(0.82, 1, U.easeOutBack(U.clamp((vt - 1.2) / 1.1, 0, 1)));
      ctx.save();
      ctx.globalAlpha *= headlineIn;
      ctx.translate(640, 228);
      ctx.scale(sc, sc);
      U.text(ctx, 'MELOFUFF  ·  TO BE CONTINUED', 0, -92, {
        size: 13, family: U.FONT_ROUND, color: 'rgba(180,119,137,0.7)', align: 'center', letterSpacing: 5,
      });
      const txtGrad = ctx.createLinearGradient(-330, -40, 330, 40);
      txtGrad.addColorStop(0, '#EE7D9D');
      txtGrad.addColorStop(0.5, '#FF93AE');
      txtGrad.addColorStop(1, '#E47C9E');
      U.text(ctx, '更多冒险，等你！', 0, 0, {
        size: 92, family: U.FONT_DISPLAY, color: txtGrad, align: 'center',
        stroke: 'rgba(255,253,247,0.98)', strokeWidth: 16,
        shadow: 'rgba(190,92,119,0.28)', shadowBlur: 26, shadowY: 10,
      });
      U.text(ctx, '甜糖丘陵的尽头，还有一整个糖果宇宙在发光。', 0, 76, {
        size: 17, color: 'rgba(126,86,100,0.78)', align: 'center', letterSpacing: 1.2,
      });
      ctx.restore();

      // sparkles around title
      for (let i = 0; i < 12; i++) {
        const a = i * 1.7 + t * 0.3;
        const px = 640 + Math.cos(a) * (320 + (i % 4) * 40);
        const py = 220 + Math.sin(a * 1.1) * (110 + (i % 3) * 30);
        U.drawSparkle(ctx, px, py, 4 + U.pulse(t * 1.6 + i) * 6, i % 2 ? '#FFF6D8' : '#FFFFFF', a, 0.75);
      }
    }

    // stats card at the top, so the little traveller stays visible
    const statsA = U.smoothstep(1.6, 2.6, vt);
    if (statsA > 0) {
      const stats = this.game.runStats;
      ctx.save();
      ctx.globalAlpha *= statsA;
      CandyUI.panel(ctx, 28, 24, 302, 62, 22, {
        fill: 'rgba(255,250,242,0.82)', border: 'rgba(255,255,255,0.85)', shadow: false,
      });
      U.text(ctx, '旅 途 小 结', 48, 43, {
        size: 10, family: U.FONT_ROUND, color: 'rgba(190,130,148,0.85)', letterSpacing: 3,
      });
      U.text(ctx, `音符 ${stats.notes}   ·   最高连击 ${stats.maxCombo}   ·   五官 ${stats.senses}/5`, 48, 66, {
        size: 14, color: 'rgba(121,85,97,0.92)', letterSpacing: 0.2,
      });
      ctx.restore();
    }

    // replay button
    const btnA = U.smoothstep(1.8, 2.5, vt);
    if (btnA > 0) {
      const hov = pointer && pointer.inside && U.pointInRect(pointer.x, pointer.y, this.replayRect);
      ctx.save();
      ctx.globalAlpha *= btnA;
      CandyUI.button(ctx, this.replayRect, '再玩一次', { hover: hov, primary: true, size: 28 });
      U.text(ctx, '第 2 关 · 果冻歌声  ·  敬请期待', 640, 690, {
        size: 12, color: 'rgba(148,106,119,0.7)', align: 'center', letterSpacing: 1.5,
      });
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  _castle(ctx, cx, base, s, t) {
    ctx.save();
    ctx.translate(cx, base);
    ctx.scale(s, s);
    ctx.globalAlpha = 0.75;
    const tower = (tx, tw, th, roof) => {
      ctx.fillStyle = '#FBEBD9';
      U.roundRectPath(ctx, tx - tw / 2, -th, tw, th, [tw / 2, tw / 2, 8, 8]);
      ctx.fill();
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(tx - tw * 0.7, -th);
      ctx.quadraticCurveTo(tx, -th - tw * 1.2, tx + tw * 0.7, -th);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, -th - tw * 0.95);
      ctx.lineTo(tx, -th - tw * 1.45);
      ctx.stroke();
      ctx.fillStyle = '#FFD9A2';
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(tx, -th * 0.55 + i * 30, 5, 0, U.TAU);
        ctx.fill();
      }
    };
    tower(-80, 54, 220, '#FFB4C9');
    tower(80, 46, 170, '#B8E7D5');
    ctx.fillStyle = '#F7E2CD';
    U.roundRectPath(ctx, -70, -130, 140, 130, [12, 12, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-70, -130);
    ctx.quadraticCurveTo(0, -158, 70, -130);
    ctx.stroke();
    ctx.restore();
  }

  replayAt(px, py) {
    return this.t > 12.2 && U.pointInRect(px, py, this.replayRect);
  }

  skipAt(px, py) {
    return this.t < 11.2 && U.pointInRect(px, py, this.skipRect);
  }
}
