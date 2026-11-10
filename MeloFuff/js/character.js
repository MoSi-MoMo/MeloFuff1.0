/* MeloFuff — the plush little sound-creature */
const MELO_THEMES = [
  {
    name: '草莓奶油', material: '丝绒软糯', fuzzMul: 0.78, gloss: 0.3,
    body: '#FFCCDA', light: '#FFF2F6', deep: '#E996AE', fur: '#F5B0C4',
    eye: '#4E2F3B', iris: '#F58BA8', irisLight: '#FFDCE6', irisDeep: '#C95679',
    pupil: '#432833', blush: '#FF9DB4',
    bow: '#A9E7D5', bowDeep: '#79CBB5', accent: '#FF7C9D', cream: '#FFF9EF',
    swatch: ['#FFD5E0', '#FF8FAE', '#A9E7D5'],
  },
  {
    name: '薄荷可可', material: '羊毛蓬松', fuzzMul: 1.35, gloss: 0.17,
    body: '#C6EAD9', light: '#F1FCF7', deep: '#93CEB7', fur: '#AEE3CE',
    eye: '#405148', iris: '#75C9A8', irisLight: '#DAF8EA', irisDeep: '#44987C',
    pupil: '#35463D', blush: '#FFB1C0',
    bow: '#FFD6A5', bowDeep: '#EFB36C', accent: '#67C29F', cream: '#FFF9ED',
    swatch: ['#CFEEDF', '#7BCBA9', '#FFD6A5'],
  },
  {
    name: '海盐苏打', material: '短绒哑光', fuzzMul: 0.55, gloss: 0.1,
    body: '#CCE3FF', light: '#F0F8FF', deep: '#9DC3EA', fur: '#B7D6F5',
    eye: '#3F4A64', iris: '#7FB4E8', irisLight: '#DDF0FF', irisDeep: '#4D7FB4',
    pupil: '#354059', blush: '#FFAFBE',
    bow: '#FFE0A8', bowDeep: '#EDC174', accent: '#78AEE4', cream: '#FFFBF0',
    swatch: ['#D6E9FF', '#87B9EB', '#FFE0A8'],
  },
  {
    name: '葡萄软糖', material: '羊羔绒', fuzzMul: 1.08, gloss: 0.2,
    body: '#E1CCF7', light: '#F8F1FF', deep: '#C0A0E4', fur: '#D4BAF0',
    eye: '#503C56', iris: '#AF86DF', irisLight: '#EFE1FF', irisDeep: '#7F56AF',
    pupil: '#432F4B', blush: '#FFA9C9',
    bow: '#FFE2A8', bowDeep: '#EEC17A', accent: '#B58AE0', cream: '#FFF9F0',
    swatch: ['#E7D6F9', '#B58AE0', '#FFB6CE'],
  },
];

class MeloFuff {
  constructor(themeIndex = 0) {
    this.themeIndex = themeIndex;
    this.theme = MELO_THEMES[themeIndex] || MELO_THEMES[0];
    this.blinkTimer = 1.8 + Math.random() * 2.2;
    this.blinkPhase = 0;
    this.fuzz = [];
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * U.TAU;
      this.fuzz.push({
        a,
        jitter: (U.hash(i * 3.13) - 0.5) * 0.035,
        len: 3 + U.hash(i * 7.7) * 7.5,
        w: 1.1 + U.hash(i * 2.2) * 1.6,
        alpha: 0.35 + U.hash(i * 5.9) * 0.4,
      });
    }
    this.speckles = [];
    for (let i = 0; i < 26; i++) {
      const a = U.hash(i * 9.1) * U.TAU;
      const r = Math.sqrt(U.hash(i * 4.3)) * 0.82;
      this.speckles.push({
        x: Math.cos(a) * 90 * r,
        y: Math.sin(a) * 82 * r,
        r: 0.7 + U.hash(i * 6.4) * 1.5,
        a: 0.08 + U.hash(i * 8.8) * 0.14,
      });
    }
  }

  setTheme(i) {
    this.themeIndex = i % MELO_THEMES.length;
    this.theme = MELO_THEMES[this.themeIndex];
  }

  setThemeData(theme) {
    this.themeIndex = -1;
    this.theme = theme;
  }

  update(dt) {
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && this.blinkPhase === 0) {
      this.blinkTimer = 2.2 + Math.random() * 2.8;
      this.blinkPhase = 0.0001;
    }
    if (this.blinkPhase > 0) {
      this.blinkPhase += dt / 0.15;
      if (this.blinkPhase >= 1) this.blinkPhase = 0;
    }
  }

  blinkValue() {
    if (!this.blinkPhase) return 0;
    return Math.sin(this.blinkPhase * Math.PI);
  }

  /* ---------------- front view ---------------- */

  draw(ctx, x, y, R, o = {}) {
    const T = this.theme;
    const s = R / 100;
    const time = o.time || 0;
    const phase = o.phase || 0;
    const grounded = o.grounded !== false;
    const vy = o.vy || 0;
    const expr = o.expression || 'happy';
    const blink = o.blink === undefined ? this.blinkValue() : o.blink;
    const look = o.look || { x: 0, y: 0 };
    const alpha = o.alpha === undefined ? 1 : o.alpha;
    if (alpha <= 0.001) return;

    let bob = 0;
    if (grounded) bob = -Math.abs(Math.sin(phase)) * 3.5;
    else if (vy < 0) bob = -3;
    else bob = Math.sin(time * 4) * 1.6;

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);

    if (o.aura) this._aura(ctx, R, time, o.speedTier || 0);

    ctx.scale(s, s);
    ctx.translate(0, bob);
    ctx.rotate((o.lean || 0) + (o.rotation || 0));
    ctx.scale(o.scaleX || 1, o.scaleY || 1);

    // feet behind the body
    this._feet(ctx, phase, grounded, vy, o.expression);
    // ears
    this._ears(ctx);
    // body
    this._body(ctx);
    // fluttering ribbon tails sit on the plush, by the bow
    this._bowTails(ctx, time, phase, grounded, false);
    // arms
    this._arms(ctx, phase, grounded, vy, o.expression, time);
    // face
    this._face(ctx, time, expr, blink, look, o);
    // tuft and bow
    this._tuft(ctx, time);
    this._bow(ctx);
    // sparkle dust in front
    if (o.sparkle) this._sparkleDust(ctx, time, o.speedTier || 0);

    ctx.restore();
  }

  _aura(ctx, R, time, tier) {
    const T = this.theme;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    const g = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R * (1.5 + pulse * 0.1));
    g.addColorStop(0, U.rgba(T.accent, 0.16 + tier * 0.04));
    g.addColorStop(0.65, U.rgba(T.irisLight, 0.08));
    g.addColorStop(1, U.rgba(T.irisLight, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.6, 0, U.TAU);
    ctx.fill();
    for (let i = 0; i < 4 + tier; i++) {
      const a = time * (0.7 + i * 0.12) + i * 1.7;
      const rr = R * (1.05 + 0.18 * Math.sin(time * 2 + i));
      U.drawSparkle(ctx, Math.cos(a) * rr, Math.sin(a) * rr * 0.8 - R * 0.1, R * (0.05 + 0.02 * Math.sin(time * 3 + i)), T.cream, a * 0.5, 0.75);
    }
  }

  _bowTails(ctx, time, phase, grounded, backView) {
    const T = this.theme;
    const flutter = Math.sin(time * 6 + phase) * (grounded ? 5 : 11);
    const swing = Math.sin(time * 4.2 + 1) * 3;
    ctx.save();
    ctx.translate(34, -80);
    ctx.rotate(-0.12);
    const tail = (bend, len, color, alpha) => {
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.bezierCurveTo(12 + bend, len * 0.22 + flutter * 0.4, 22 + bend * 1.6 + swing, len * 0.58 - flutter * 0.3, 16 + bend * 2.2, len + flutter);
      ctx.quadraticCurveTo(6 + bend, len * 0.62, -4, 6);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.strokeStyle = U.rgba(T.bowDeep, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    tail(5, 42, T.bow, 1);
    tail(11, 31, T.bowDeep, 0.92);
    // bow-tail highlight
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, 12);
    ctx.quadraticCurveTo(13, 22, 14, 28);
    ctx.stroke();
    ctx.restore();
  }

  _feet(ctx, phase, grounded, vy, expr) {
    const T = this.theme;
    let lx = -39, ly = 84, rx = 39, ry = 84;
    let lrot = 0.1, rrot = -0.1;
    if (grounded) {
      const sw = Math.sin(phase);
      lx = -39 + sw * 8;
      ly = 84 - Math.max(0, sw) * 8;
      rx = 39 - sw * 8;
      ry = 84 - Math.max(0, -sw) * 8;
      lrot = 0.08 + Math.max(0, sw) * 0.16;
      rrot = -0.08 - Math.max(0, -sw) * 0.16;
    } else {
      ly = 82 + Math.sin(phase) * 3;
      ry = 82 - Math.sin(phase) * 3;
      lrot = vy < 0 ? -0.18 : 0.22;
      rrot = vy < 0 ? 0.12 : -0.16;
    }
    const drawFoot = (fx, fy, rot, tiny) => {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(rot);
      const g = ctx.createLinearGradient(0, -12, 0, 14);
      g.addColorStop(0, T.body);
      g.addColorStop(1, T.deep);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 13.5, 0, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = U.rgba(T.eye, 0.16);
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.fillStyle = U.rgba(T.cream, 0.35);
      ctx.beginPath();
      ctx.ellipse(-4, -4, 7, 4, -0.2, 0, U.TAU);
      ctx.fill();
      if (!tiny) {
        ctx.fillStyle = U.rgba(T.deep, 0.5);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(4 + i * 5, 2, 1.1, 0, U.TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    };
    drawFoot(lx, ly, lrot, false);
    drawFoot(rx, ry, rrot, false);
  }

  _ears(ctx) {
    const T = this.theme;
    const ear = (ex, ey, r, rot) => {
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(rot);
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 0, 0, 0, r * 1.2);
      g.addColorStop(0, T.light);
      g.addColorStop(1, T.body);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 1.05, 0, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = U.rgba(T.deep, 0.42);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = U.rgba(T.blush, 0.33);
      ctx.beginPath();
      ctx.ellipse(0, 1, r * 0.56, r * 0.66, 0, 0, U.TAU);
      ctx.fill();
      // little fur tufts
      ctx.strokeStyle = U.rgba(T.fur, 0.55);
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const a = -2.2 + i * 0.32;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.9);
        ctx.lineTo(Math.cos(a) * (r * 0.88 + 5), Math.sin(a) * (r * 0.9 + 5));
        ctx.stroke();
      }
      ctx.restore();
    };
    ear(-50, -75, 20, -0.34);
    ear(50, -77, 20, 0.34);
  }

  _body(ctx) {
    const T = this.theme;
    // fuzzy silhouette
    ctx.save();
    ctx.lineCap = 'round';
    for (const f of this.fuzz) {
      const a = f.a + f.jitter;
      const px = Math.cos(a) * 97;
      const py = Math.sin(a) * 89;
      const fl = f.len * (T.fuzzMul || 1);
      const nx = Math.cos(a) * (97 + fl);
      const ny = Math.sin(a) * (89 + fl);
      ctx.strokeStyle = U.rgba(T.fur, f.alpha);
      ctx.lineWidth = f.w;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    }
    ctx.restore();

    // a soft cream halo keeps the plush readable against candy-pink scenery
    ctx.strokeStyle = 'rgba(255,252,245,0.62)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 99.5, 92.5, 0, 0, U.TAU);
    ctx.stroke();

    // main plush body
    const g = ctx.createRadialGradient(-35, -42, 8, 0, 0, 142);
    g.addColorStop(0, T.light);
    g.addColorStop(0.3, T.body);
    g.addColorStop(0.78, T.body);
    g.addColorStop(0.95, T.deep);
    g.addColorStop(1, U.shade(T.deep, -0.04));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 97, 90, 0, 0, U.TAU);
    ctx.fill();

    // bottom occlusion
    const sh = ctx.createRadialGradient(10, 48, 12, 10, 48, 100);
    sh.addColorStop(0, U.rgba(T.deep, 0.22));
    sh.addColorStop(0.7, U.rgba(T.deep, 0.06));
    sh.addColorStop(1, U.rgba(T.deep, 0));
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(0, 0, 97, 90, 0, 0, U.TAU);
    ctx.fill();

    // rim
    ctx.strokeStyle = U.rgba(T.deep, 0.5);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 97, 90, 0, 0, U.TAU);
    ctx.stroke();

    // warm bounce light
    const bounce = ctx.createRadialGradient(-20, 62, 2, -20, 62, 78);
    bounce.addColorStop(0, U.rgba(T.light, 0.22));
    bounce.addColorStop(1, U.rgba(T.light, 0));
    ctx.fillStyle = bounce;
    ctx.beginPath();
    ctx.ellipse(0, 0, 97, 90, 0, 0, U.TAU);
    ctx.fill();

    // velvet sheen
    ctx.save();
    ctx.rotate(-0.48);
    const gloss = ctx.createRadialGradient(-40, -38, 2, -40, -38, 42);
    gloss.addColorStop(0, U.rgba('#ffffff', T.gloss || 0.2));
    gloss.addColorStop(1, U.rgba('#ffffff', 0));
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.ellipse(-40, -38, 40, 22, 0, 0, U.TAU);
    ctx.fill();
    ctx.restore();

    // fabric speckles
    for (const sp of this.speckles) {
      ctx.fillStyle = U.rgba(T.cream, sp.a);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, U.TAU);
      ctx.fill();
    }

    // a tiny stitched heart on the tummy
    ctx.save();
    ctx.translate(0, 55);
    U.drawHeart(ctx, 0, 0, 15, U.rgba(T.accent, 0.42));
    ctx.strokeStyle = U.rgba(T.cream, 0.32);
    ctx.lineWidth = 1;
    ctx.setLineDash([2.4, 3.2]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 10, 0, 0, U.TAU);
    ctx.stroke();
    ctx.restore();
  }

  _arms(ctx, phase, grounded, vy, expr, time) {
    const T = this.theme;
    let la = 0.55, ra = -0.55;
    if (grounded) {
      la = 0.5 + Math.sin(phase) * 0.45;
      ra = -0.5 + Math.sin(phase) * 0.45;
    } else if (vy < 0) {
      la = 1.15 + Math.sin(time * 8) * 0.08;
      ra = -1.15 - Math.sin(time * 8) * 0.08;
    } else {
      la = 0.95;
      ra = -0.95;
    }
    if (expr === 'cheer') { la = 1.5; ra = -1.5; }

    const arm = (sx, sy, angle, side) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle * side);
      const g = ctx.createLinearGradient(0, 0, 0, 34);
      g.addColorStop(0, T.light);
      g.addColorStop(1, T.body);
      ctx.fillStyle = g;
      U.roundRectPath(ctx, -8, -7, 16, 37, 8);
      ctx.fill();
      ctx.strokeStyle = U.rgba(T.deep, 0.32);
      ctx.lineWidth = 1.1;
      ctx.stroke();
      // hand
      ctx.fillStyle = T.body;
      ctx.beginPath();
      ctx.arc(0, 32, 8.5, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = U.rgba(T.deep, 0.28);
      ctx.stroke();
      ctx.fillStyle = U.rgba(T.cream, 0.28);
      ctx.beginPath();
      ctx.ellipse(-2.5, 29.5, 3.2, 2.2, -0.3, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    };
    arm(-83, 8, la, -1);
    arm(83, 8, ra, 1);
  }

  _face(ctx, time, expr, blink, look, o) {
    const T = this.theme;
    const eyeY = -13;
    const eyeX = 29;
    let eyeScale = 1;
    let mode = 'open';
    if (blink > 0.45) mode = 'closed';
    if (expr === 'cheer' || expr === 'happyClosed') mode = 'happy';
    if (expr === 'sleepy') mode = 'sleepy';
    if (expr === 'wide' || expr === 'wow') eyeScale = 1.08;
    if (expr === 'curious') eyeScale = 1.04;

    // blush
    const blushA = expr === 'cheer' ? 0.72 : 0.52;
    for (const side of [-1, 1]) {
      const bx = side * 47;
      const by = 16;
      const bg = ctx.createRadialGradient(bx, by, 1, bx, by, 20);
      bg.addColorStop(0, U.rgba(T.blush, blushA));
      bg.addColorStop(1, U.rgba(T.blush, 0));
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(bx, by, 21, 13, 0, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = U.rgba('#ffffff', 0.48);
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(bx - 6 + i * 5, by + 3);
        ctx.lineTo(bx - 3 + i * 5, by - 1);
        ctx.stroke();
      }
    }

    this._eye(ctx, -eyeX, eyeY, 13.8 * eyeScale, 16.4 * eyeScale, { mode, look, expr, time });
    this._eye(ctx, eyeX, eyeY, 13.8 * eyeScale, 16.4 * eyeScale, { mode, look, expr, time, mirror: true });

    // tiny nose
    ctx.fillStyle = U.rgba(T.irisDeep, 0.7);
    ctx.beginPath();
    ctx.ellipse(0, 10, 3.1, 2.2, 0, 0, U.TAU);
    ctx.fill();

    // mouth
    ctx.save();
    ctx.translate(0, 28);
    ctx.strokeStyle = U.rgba(T.eye, 0.9);
    ctx.fillStyle = U.rgba(T.eye, 0.9);
    ctx.lineCap = 'round';
    if (expr === 'cheer' || expr === 'wow') {
      const g = ctx.createLinearGradient(0, -2, 0, 12);
      g.addColorStop(0, U.rgba(T.eye, 0.9));
      g.addColorStop(1, U.rgba(T.irisDeep, 0.85));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.quadraticCurveTo(0, -5, 8, -2);
      ctx.quadraticCurveTo(7, 10, 0, 11);
      ctx.quadraticCurveTo(-7, 10, -8, -2);
      ctx.fill();
      ctx.fillStyle = U.rgba(T.blush, 0.8);
      ctx.beginPath();
      ctx.ellipse(0, 6.5, 4.2, 2.6, 0, 0, U.TAU);
      ctx.fill();
    } else if (expr === 'curious' || expr === 'wide') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 3.2, 4.2, 0, 0, U.TAU);
      ctx.fill();
    } else if (expr === 'tumble') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, 2);
      ctx.quadraticCurveTo(-3.5, -1, 0, 2);
      ctx.quadraticCurveTo(3.5, 5, 7, 2);
      ctx.stroke();
    } else {
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.quadraticCurveTo(0, 6.5, 7, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  _eye(ctx, x, y, rx, ry, o = {}) {
    this._beadEye(ctx, x, y, rx, ry, { ...o, closeup: false });
  }

  /* A soft, shiny cocoa-bead eye. Big warm highlights, no sharp rings. */
  _beadEye(ctx, x, y, rx, ry, o = {}) {
    const T = this.theme;
    const mode = o.mode || 'open';
    const look = o.look || { x: 0, y: 0 };
    const time = o.time || 0;
    const closeup = !!o.closeup;
    const mirror = o.mirror ? -1 : 1;
    const ix = (look.x || 0);
    const iy = (look.y || 0);
    const shine = U.clamp(T.shine || 1, 0.85, 1.2);

    ctx.save();
    ctx.translate(x + ix * rx * (closeup ? 0.09 : 0.045), y + iy * ry * (closeup ? 0.07 : 0.035));
    ctx.rotate(mirror * 0.025);

    if (mode === 'happy') {
      // closed happy arcs, like a little plush smiling with its whole face
      ctx.strokeStyle = U.rgba(T.eye, 0.92);
      ctx.lineWidth = closeup ? 13 : 3.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-rx * 0.92, ry * 0.22);
      ctx.quadraticCurveTo(0, -ry * 0.86, rx * 0.92, ry * 0.22);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (mode === 'closed') {
      ctx.strokeStyle = U.rgba(T.eye, 0.9);
      ctx.lineWidth = closeup ? 10 : 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-rx * 0.86, -ry * 0.05);
      ctx.quadraticCurveTo(0, ry * 0.46, rx * 0.86, -ry * 0.05);
      ctx.stroke();
      if (closeup) {
        // one soft little lash, just for the close-up
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(rx * 0.75, -ry * 0.02);
        ctx.quadraticCurveTo(rx * 0.94, -ry * 0.1, rx * 1.02, -ry * 0.22);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (mode === 'sleepy') {
      ctx.fillStyle = U.rgba(T.eye, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, ry * 0.16, rx * 0.85, ry * 0.62, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,247,240,0.28)';
      ctx.lineWidth = closeup ? 4 : 1.2;
      ctx.beginPath();
      ctx.ellipse(0, ry * 0.16, rx * 0.85, ry * 0.62, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // soft halo, so the bead melts into the plush face
    if (closeup) {
      const halo = ctx.createRadialGradient(0, ry * 0.05, rx * 0.2, 0, ry * 0.05, rx * 1.45);
      halo.addColorStop(0, U.rgba(T.iris, 0.1));
      halo.addColorStop(0.7, U.rgba(T.irisLight, 0.06));
      halo.addColorStop(1, U.rgba(T.irisLight, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.45, ry * 1.25, 0, 0, U.TAU);
      ctx.fill();
    }

    // everything except the halo stays inside the eye
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, U.TAU);
    ctx.clip();

    // dark cocoa base with a warm top-left
    const base = ctx.createRadialGradient(-rx * 0.32, -ry * 0.38, 1, 0, 0, ry * 1.16);
    base.addColorStop(0, '#75505B');
    base.addColorStop(0.48, '#4E303D');
    base.addColorStop(1, '#311F29');
    ctx.fillStyle = base;
    ctx.fillRect(-rx * 1.2, -ry * 1.2, rx * 2.4, ry * 2.4);

    // a whisper of the theme colour, low in the iris
    const irisGlow = ctx.createRadialGradient(0, ry * 0.3, rx * 0.08, 0, ry * 0.25, ry * 0.95);
    irisGlow.addColorStop(0, U.rgba(T.iris, 0.0));
    irisGlow.addColorStop(0.55, U.rgba(T.iris, 0.3));
    irisGlow.addColorStop(1, U.rgba(T.irisDeep, 0));
    ctx.fillStyle = irisGlow;
    ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    // a soft coloured ring, like a candy-flavoured sparkle inside the bead
    ctx.strokeStyle = U.rgba(T.iris, 0.2);
    ctx.lineWidth = Math.max(1, rx * 0.055);
    ctx.beginPath();
    ctx.ellipse(0, ry * 0.16, rx * 0.64, ry * 0.58, 0, 0, U.TAU);
    ctx.stroke();

    // slightly deeper pupil at the centre
    const pupil = ctx.createRadialGradient(0, 0, 1, 0, 0, rx * 0.62);
    pupil.addColorStop(0, 'rgba(29,17,23,0.55)');
    pupil.addColorStop(0.7, 'rgba(29,17,23,0.12)');
    pupil.addColorStop(1, 'rgba(29,17,23,0)');
    ctx.fillStyle = pupil;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.62, ry * 0.7, 0, 0, U.TAU);
    ctx.fill();

    // the tiny reflected journey
    if (closeup && (o.reflection || 0) > 0.001) {
      ctx.save();
      ctx.globalAlpha = U.clamp(o.reflection, 0, 1) * 0.42;
      const baseY = ry * 0.5;
      const sky = ctx.createLinearGradient(0, baseY - ry * 0.28, 0, ry * 0.98);
      sky.addColorStop(0, 'rgba(255,245,220,0)');
      sky.addColorStop(0.35, 'rgba(255,245,220,0.5)');
      sky.addColorStop(0.7, 'rgba(255,219,229,0.55)');
      sky.addColorStop(1, 'rgba(255,196,214,0.4)');
      ctx.fillStyle = sky;
      ctx.fillRect(-rx, baseY - ry * 0.28, rx * 2, ry * 0.8);
      const hill = (hx, hy, hr, col) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(hx, hy, hr, hr * 0.55, 0, Math.PI, 0);
        ctx.fill();
      };
      hill(-rx * 0.5, baseY + ry * 0.28, rx * 0.5, 'rgba(185,235,213,0.85)');
      hill(rx * 0.15, baseY + ry * 0.34, rx * 0.6, 'rgba(255,204,222,0.85)');
      hill(rx * 0.72, baseY + ry * 0.25, rx * 0.4, 'rgba(220,200,248,0.85)');
      ctx.strokeStyle = 'rgba(255,250,237,0.8)';
      ctx.lineWidth = Math.max(2, rx * 0.04);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-rx * 0.4, ry * 0.86);
      ctx.quadraticCurveTo(-rx * 0.05, ry * 0.56, rx * 0.35, baseY + ry * 0.12);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const fx = -rx * 0.25 + i * rx * 0.3;
        const fy = baseY + ry * 0.12 - i * 4;
        ctx.strokeStyle = 'rgba(255,250,238,0.85)';
        ctx.lineWidth = Math.max(1.4, rx * 0.025);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx, fy - ry * 0.1);
        ctx.stroke();
        ctx.fillStyle = ['rgba(255,163,191,0.9)', 'rgba(154,223,196,0.9)', 'rgba(242,207,151,0.9)'][i];
        ctx.beginPath();
        ctx.moveTo(fx, fy - ry * 0.1);
        ctx.lineTo(fx + rx * 0.09, fy - ry * 0.07);
        ctx.lineTo(fx, fy - ry * 0.044);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // big, soft catchlight
    const cl = ctx.createRadialGradient(-rx * 0.34, -ry * 0.36, 2, -rx * 0.34, -ry * 0.36, rx * 0.34 * shine);
    cl.addColorStop(0, 'rgba(255,255,255,0.99)');
    cl.addColorStop(0.6, 'rgba(255,255,255,0.9)');
    cl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = cl;
    ctx.beginPath();
    ctx.ellipse(-rx * 0.33, -ry * 0.36, rx * 0.34 * shine, ry * 0.26 * shine, -0.5, 0, U.TAU);
    ctx.fill();
    // sharp little sparkle and a lower bounce light
    U.drawSparkle(ctx, -rx * 0.5, -ry * 0.42, rx * 0.13 * shine, 'rgba(255,255,255,0.95)', 0.3, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.66)';
    ctx.beginPath();
    ctx.ellipse(rx * 0.32, ry * 0.27, rx * 0.11, ry * 0.075, 0.4, 0, U.TAU);
    ctx.fill();
    U.drawSparkle(ctx, rx * 0.38, -ry * 0.28, rx * 0.09, 'rgba(255,250,231,0.8)', 0.5, 0.9);

    // lower warm rim
    ctx.strokeStyle = 'rgba(255,238,222,0.16)';
    ctx.lineWidth = Math.max(2, rx * 0.09);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.9, ry * 0.9, 0, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();

    ctx.restore();

    // a soft outer edge, never a hard black ring
    ctx.strokeStyle = U.rgba(T.eye, 0.22);
    ctx.lineWidth = Math.max(1, rx * 0.05);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, U.TAU);
    ctx.stroke();

    ctx.restore();
  }

  _tuft(ctx, time) {
    const T = this.theme;
    const sway = Math.sin(time * 2.4) * 2.5;
    ctx.save();
    ctx.translate(8, -86);
    ctx.rotate(0.15 + sway * 0.012);
    ctx.strokeStyle = T.body;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(6, -12, 16, -16, 12, -26 + sway * 0.4);
    ctx.stroke();
    ctx.strokeStyle = U.rgba(T.deep, 0.28);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(3, -5);
    ctx.bezierCurveTo(8, -14, 15, -17, 12, -24 + sway * 0.4);
    ctx.stroke();
    ctx.fillStyle = T.body;
    ctx.beginPath();
    ctx.ellipse(12, -27 + sway * 0.4, 5.5, 6.5, 0.3, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  }

  _bow(ctx) {
    const T = this.theme;
    ctx.save();
    ctx.translate(34, -82);
    ctx.rotate(-0.12);
    const loop = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(13, -16, 28, -10, 20, 2);
      ctx.bezierCurveTo(14, 9, 4, 6, 0, 0);
      ctx.fillStyle = T.bow;
      ctx.fill();
      ctx.strokeStyle = U.rgba(T.bowDeep, 0.8);
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.fillStyle = U.rgba('#ffffff', 0.22);
      ctx.beginPath();
      ctx.ellipse(13, -4, 5, 3, -0.4, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    };
    loop(-1);
    loop(1);
    ctx.fillStyle = T.bowDeep;
    ctx.beginPath();
    ctx.ellipse(0, 1, 5, 5, 0, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = U.rgba(T.cream, 0.7);
    ctx.beginPath();
    ctx.arc(-1, -1, 1.4, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  }

  _sparkleDust(ctx, time, tier) {
    const T = this.theme;
    for (let i = 0; i < 3 + tier * 2; i++) {
      const a = time * (1.2 + i * 0.2) + i * 2.1;
      const r = 105 + i * 8;
      const x = Math.cos(a) * r;
      const y = Math.sin(a * 0.7) * 70 - 10;
      U.drawSparkle(ctx, x, y, 2 + Math.sin(time * 4 + i) * 1.2, i % 2 ? T.cream : T.accent, a, 0.6);
    }
  }

  /* ---------------- back view ---------------- */

  drawBack(ctx, x, y, R, o = {}) {
    const T = this.theme;
    const s = R / 100;
    const time = o.time || 0;
    const phase = o.phase || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.translate(0, Math.sin(time * 2) * 1.2);
    ctx.rotate(o.lean || 0);
    this._bowTails(ctx, time, phase, true, true);
    this._feet(ctx, phase, true, 0, 'happy');
    this._ears(ctx);
    this._body(ctx);
    // back patch
    ctx.save();
    ctx.translate(0, 8);
    U.drawHeart(ctx, 0, 0, 17, U.rgba(T.accent, 0.36));
    ctx.strokeStyle = U.rgba(T.cream, 0.4);
    ctx.lineWidth = 1.1;
    ctx.setLineDash([2.5, 3]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 12, 0, 0, U.TAU);
    ctx.stroke();
    ctx.restore();
    this._armBack(ctx, -83, 8, 0.35);
    this._armBack(ctx, 83, 8, -0.35);
    this._tuft(ctx, time);
    this._bow(ctx);
    ctx.restore();
  }

  _armBack(ctx, sx, sy, angle) {
    const T = this.theme;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.fillStyle = T.body;
    U.roundRectPath(ctx, -8, -7, 16, 35, 8);
    ctx.fill();
    ctx.strokeStyle = U.rgba(T.deep, 0.28);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = T.body;
    ctx.beginPath();
    ctx.arc(0, 31, 8.5, 0, U.TAU);
    ctx.fill();
    ctx.restore();
  }

  /* ---------------- cinematic eye close-up ---------------- */

  drawCloseup(ctx, o = {}) {
    const T = this.theme;
    const W = U.W, H = U.H;
    const time = o.time || 0;
    const blink = o.blink || 0;
    const reflection = o.reflection || 0;
    const look = o.look || { x: 0, y: 0 };
    const curious = !!o.curious;
    const cx = W / 2;
    const cy = 530;
    const faceRx = 560;
    const faceRy = 560;

    // warm, plush backdrop
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#FFF7EC');
    bg.addColorStop(0.32, T.light);
    bg.addColorStop(0.72, T.body);
    bg.addColorStop(1, U.shade(T.deep, -0.04));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // giant ears peeking in from the sides
    for (const side of [-1, 1]) {
      const ex = cx + side * 432;
      const ey = 250;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(ex, ey, 190, 220, side * 0.18, 0, U.TAU);
      const eg = ctx.createRadialGradient(ex - side * 30, ey - 70, 20, ex, ey, 260);
      eg.addColorStop(0, T.light);
      eg.addColorStop(0.55, T.body);
      eg.addColorStop(1, U.rgba(T.deep, 0.75));
      ctx.fillStyle = eg;
      ctx.fill();
      ctx.strokeStyle = U.rgba(T.deep, 0.25);
      ctx.lineWidth = 3;
      ctx.stroke();
      // inner ear
      const ig = ctx.createRadialGradient(ex, ey + 30, 20, ex, ey + 30, 130);
      ig.addColorStop(0, U.rgba(T.blush, 0.42));
      ig.addColorStop(1, U.rgba(T.blush, 0));
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.ellipse(ex, ey + 30, 105, 140, side * 0.18, 0, U.TAU);
      ctx.fill();
      // fluffy rim
      ctx.strokeStyle = U.rgba(T.fur, 0.5);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = -2.5 + i * 0.32;
        const px = ex + Math.cos(a) * 178;
        const py = ey + Math.sin(a) * 208;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a) * 20, py + Math.sin(a) * 20);
        ctx.stroke();
      }
      ctx.restore();
    }

    // a fuzz halo around the enormous face
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 100; i++) {
      const a = (i / 100) * U.TAU;
      const px = cx + Math.cos(a) * (faceRx + 2);
      const py = cy + Math.sin(a) * (faceRy + 2);
      const len = 10 + U.hash(i * 4.3) * 30;
      ctx.strokeStyle = U.rgba(i % 4 ? T.fur : T.light, 0.32 + U.hash(i) * 0.25);
      ctx.lineWidth = 2 + U.hash(i * 2.7) * 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();

    // enormous plush face
    const hg = ctx.createRadialGradient(cx - 160, cy - 260, 20, cx, cy, faceRy * 1.05);
    hg.addColorStop(0, T.light);
    hg.addColorStop(0.3, T.body);
    hg.addColorStop(0.82, T.body);
    hg.addColorStop(1, T.deep);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, faceRx, faceRy, 0, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = U.rgba(T.deep, 0.38);
    ctx.lineWidth = 4;
    ctx.stroke();

    // soft forehead light
    const light = ctx.createRadialGradient(cx - 190, 190, 20, cx - 190, 190, 420);
    light.addColorStop(0, 'rgba(255,253,245,0.35)');
    light.addColorStop(1, 'rgba(255,253,245,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);

    // faint plush nap
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 55; i++) {
      const px = 90 + U.hash(i * 2.9) * 1100;
      const py = 120 + U.hash(i * 5.3) * 560;
      const a = -Math.PI / 2 + (U.hash(i * 3.7) - 0.5) * 0.6;
      const len = 20 + U.hash(i * 7.1) * 50;
      ctx.strokeStyle = U.rgba(i % 3 ? T.fur : T.light, 0.12);
      ctx.lineWidth = 2 + U.hash(i) * 2.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();

    // little hair tuft at the top
    ctx.save();
    ctx.translate(cx + 70, 60);
    ctx.rotate(0.12 + Math.sin(time * 1.4) * 0.03);
    ctx.strokeStyle = T.body;
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(20, -35, 60, -55, 52, -88);
    ctx.stroke();
    ctx.strokeStyle = U.rgba(T.deep, 0.25);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.bezierCurveTo(28, -48, 55, -60, 50, -82);
    ctx.stroke();
    ctx.fillStyle = T.body;
    ctx.beginPath();
    ctx.ellipse(52, -92, 16, 20, 0.3, 0, U.TAU);
    ctx.fill();
    ctx.restore();

    // the mint bow, attached to the top of the head
    const bowX = cx + 200;
    const bowY = 148;
    ctx.save();
    ctx.translate(bowX, bowY);
    ctx.rotate(-0.12 + Math.sin(time * 1.6) * 0.012);
    const bg2 = ctx.createLinearGradient(0, -46, 0, 46);
    bg2.addColorStop(0, U.shade(T.bow, 0.3));
    bg2.addColorStop(1, T.bowDeep);
    ctx.fillStyle = bg2;
    // short ribbon tails
    const tail = (dir) => {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.beginPath();
      ctx.moveTo(5, 14);
      ctx.bezierCurveTo(24, 30, 34, 46, 28, 64);
      ctx.lineTo(13, 58);
      ctx.lineTo(9, 63);
      ctx.bezierCurveTo(8, 40, 2, 26, 2, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = U.rgba(T.bowDeep, 0.4);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    };
    tail(1);
    tail(-1);
    // rounded bow loops
    ctx.beginPath();
    ctx.ellipse(-36, -2, 44, 30, 0.34, 0, U.TAU);
    ctx.ellipse(38, -4, 42, 28, -0.3, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = U.rgba(T.bowDeep, 0.45);
    ctx.lineWidth = 2;
    ctx.stroke();
    // knot
    ctx.fillStyle = T.bowDeep;
    ctx.beginPath();
    ctx.arc(0, 2, 15, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-44, -8, 15, 6, 0.4, 0, U.TAU);
    ctx.ellipse(30, -12, 13, 5, -0.3, 0, U.TAU);
    ctx.fill();
    ctx.restore();

    // cheeks
    for (const side of [-1, 1]) {
      const bx = cx + side * 278;
      const by = 532;
      const bg3 = ctx.createRadialGradient(bx, by, 4, bx, by, 155);
      bg3.addColorStop(0, U.rgba(T.blush, 0.55));
      bg3.addColorStop(1, U.rgba(T.blush, 0));
      ctx.fillStyle = bg3;
      ctx.beginPath();
      ctx.ellipse(bx, by, 160, 82, 0, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(bx - 26 + i * 20, by + 12);
        ctx.lineTo(bx - 14 + i * 20, by - 4);
        ctx.stroke();
      }
    }

    // eye sockets
    for (const side of [-1, 1]) {
      const ex = cx + side * 160;
      const sock = ctx.createRadialGradient(ex, 410, 30, ex, 410, 200);
      sock.addColorStop(0, U.rgba(T.deep, 0.14));
      sock.addColorStop(1, U.rgba(T.deep, 0));
      ctx.fillStyle = sock;
      ctx.beginPath();
      ctx.ellipse(ex, 405, 190, 180, 0, 0, U.TAU);
      ctx.fill();
    }

    // big, friendly bead eyes
    const eyeScale = o.wide ? 1.06 : 1;
    const eyeRx = 112 * eyeScale;
    const eyeRy = 132 * eyeScale;
    const eyeMode = blink > 0.4 ? 'closed' : 'open';
    this._beadEye(ctx, cx - 160, 390, eyeRx, eyeRy, {
      closeup: true, mode: eyeMode, look, reflection, time, mirror: false,
    });
    this._beadEye(ctx, cx + 160, 390, eyeRx, eyeRy, {
      closeup: true, mode: eyeMode, look, reflection, time, mirror: true,
    });

    // tiny nose
    ctx.fillStyle = U.rgba(T.irisDeep, 0.52);
    ctx.beginPath();
    ctx.ellipse(cx, 506, 17, 11, 0, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - 4, 503, 4, 2.5, -0.3, 0, U.TAU);
    ctx.fill();

    // a small open smile
    ctx.save();
    ctx.translate(cx, 562);
    const mouth = ctx.createLinearGradient(0, -6, 0, 30);
    mouth.addColorStop(0, U.rgba(T.eye, 0.92));
    mouth.addColorStop(1, U.rgba(T.irisDeep, 0.88));
    ctx.fillStyle = mouth;
    if (curious) {
      ctx.beginPath();
      ctx.ellipse(0, 4, 20, 24, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = U.rgba(T.blush, 0.8);
      ctx.beginPath();
      ctx.ellipse(0, 16, 11, 7, 0, 0, U.TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-34, -4);
      ctx.quadraticCurveTo(0, -14, 34, -4);
      ctx.quadraticCurveTo(28, 34, 0, 38);
      ctx.quadraticCurveTo(-28, 34, -34, -4);
      ctx.fill();
      ctx.fillStyle = U.rgba(T.blush, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, 24, 16, 9, 0, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();

    // tiny freckles / sugar dust
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(cx + side * (330 + U.hash(i * 3.1) * 50), 545 + U.hash(i * 5.7) * 60, 2.5 + U.hash(i) * 2, 0, U.TAU);
      ctx.fill();
    }

    // twinkles
    for (let i = 0; i < 14; i++) {
      const a = time * 0.25 + i * 1.37;
      const px = cx + Math.cos(a) * (380 + (i % 4) * 80);
      const py = 380 + Math.sin(a * 1.2) * 240;
      const tw = 0.5 + 0.5 * Math.sin(time * 3 + i);
      U.drawSparkle(ctx, px, py, 4 + tw * 7, i % 3 === 0 ? T.cream : '#FFF7F2', a, 0.2 + tw * 0.45);
    }

    // gentle vignette
    const v = ctx.createRadialGradient(cx, 430, 260, cx, 430, 760);
    v.addColorStop(0, 'rgba(90,45,60,0)');
    v.addColorStop(1, 'rgba(90,45,60,0.16)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

}
