/* MeloFuff — shared helpers */
const U = (() => {
  const W = 1280;
  const H = 720;
  const TAU = Math.PI * 2;

  const FONT_UI = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  const FONT_DISPLAY = '"ZCOOL KuaiLe", "Hiragino Maru Gothic ProN", "PingFang SC", sans-serif';
  const FONT_ROUND = '"Baloo 2", "Arial Rounded MT Bold", "PingFang SC", sans-serif';

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, v) => clamp((v - a) / (b - a || 1), 0, 1);
  const smoothstep = (a, b, v) => {
    const t = invLerp(a, b, v);
    return t * t * (3 - 2 * t);
  };
  const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeInCubic = (t) => t * t * t;
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
  const easeOutBack = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  const easeOutElastic = (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
  };
  const pulse = (t, speed = 1) => (Math.sin(t * speed * TAU) + 1) / 2;

  /* deterministic randomness */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(n) {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }
  function hash2(x, y) {
    return hash(x * 12.9898 + y * 78.233);
  }

  /* ---------- color ---------- */
  function parseHex(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a = 1) {
    const [r, g, b] = parseHex(hex);
    return `rgba(${r},${g},${b},${a})`;
  }
  function mix(hexA, hexB, t) {
    const A = parseHex(hexA), B = parseHex(hexB);
    const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t, 0, 1))));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function shade(hex, amt) {
    return amt >= 0 ? mix(hex, '#ffffff', amt) : mix(hex, '#2e1a23', -amt);
  }

  /* ---------- paths ---------- */
  function roundRectPath(ctx, x, y, w, h, r) {
    const rr = typeof r === 'number' ? [r, r, r, r] : r;
    const [tl, tr, br, bl] = rr;
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
    ctx.closePath();
  }
  function fillRoundRect(ctx, x, y, w, h, r, fill) {
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function circle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
  }
  function ellipse(ctx, x, y, rx, ry, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
  }

  function drawStar(ctx, cx, cy, outer, inner = 0.45, points = 5, rot = -Math.PI / 2) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : outer * inner;
      const a = rot + (i * Math.PI) / points;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawSparkle(ctx, x, y, r, color, rot = 0, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    const k = r * 0.16;
    ctx.moveTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r);
    ctx.quadraticCurveTo(x - Math.sin(rot) * k, y + Math.cos(rot) * k, x + Math.cos(rot + Math.PI / 2) * r, y + Math.sin(rot + Math.PI / 2) * r);
    ctx.quadraticCurveTo(x + Math.sin(rot) * k, y - Math.cos(rot) * k, x + Math.cos(rot + Math.PI) * r, y + Math.sin(rot + Math.PI) * r);
    ctx.quadraticCurveTo(x + Math.sin(rot) * k, y - Math.cos(rot) * k, x + Math.cos(rot + Math.PI * 1.5) * r, y + Math.sin(rot + Math.PI * 1.5) * r);
    ctx.quadraticCurveTo(x - Math.sin(rot) * k, y + Math.cos(rot) * k, x + Math.cos(rot) * r, y + Math.sin(rot) * r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHeart(ctx, x, y, s, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.32);
    ctx.bezierCurveTo(x - s * 0.72, y - s * 0.22, x - s * 0.38, y - s * 0.82, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.38, y - s * 0.82, x + s * 0.72, y - s * 0.22, x, y + s * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function cloudPath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.arc(x + w * 0.22, y + h * 0.62, h * 0.34, Math.PI * 0.85, Math.PI * 1.95);
    ctx.arc(x + w * 0.44, y + h * 0.38, h * 0.42, Math.PI * 1.0, Math.PI * 1.9);
    ctx.arc(x + w * 0.7, y + h * 0.48, h * 0.36, Math.PI * 1.1, Math.PI * 2.02);
    ctx.arc(x + w * 0.84, y + h * 0.64, h * 0.28, Math.PI * 1.4, Math.PI * 2.15);
    ctx.quadraticCurveTo(x + w * 0.86, y + h * 0.94, x + w * 0.6, y + h * 0.92);
    ctx.quadraticCurveTo(x + w * 0.34, y + h * 1.02, x + w * 0.14, y + h * 0.9);
    ctx.quadraticCurveTo(x + w * 0.02, y + h * 0.82, x + w * 0.22, y + h * 0.62);
    ctx.closePath();
  }

  function drawNote(ctx, x, y, size, rot, color, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    // flag
    ctx.beginPath();
    ctx.moveTo(size * 0.28, -size * 0.48);
    ctx.bezierCurveTo(size * 0.82, -size * 0.42, size * 0.86, -size * 0.02, size * 0.52, size * 0.08);
    ctx.bezierCurveTo(size * 0.72, -size * 0.18, size * 0.52, -size * 0.28, size * 0.28, -size * 0.24);
    ctx.closePath();
    ctx.fill();
    // stem
    ctx.beginPath();
    ctx.moveTo(size * 0.24, -size * 0.44);
    ctx.quadraticCurveTo(size * 0.35, -size * 0.06, size * 0.2, size * 0.2);
    ctx.lineTo(size * 0.08, size * 0.2);
    ctx.quadraticCurveTo(size * 0.23, 0, size * 0.1, -size * 0.44);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.ellipse(-size * 0.13, size * 0.25, size * 0.29, size * 0.21, -0.42, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /* ---------- text ---------- */
  function setFont(ctx, size, weight = 400, family = FONT_UI) {
    ctx.font = `${weight} ${size}px ${family}`;
  }
  function text(ctx, str, x, y, opts = {}) {
    const {
      size = 20, weight = 400, family = FONT_UI, color = '#6b4757',
      align = 'left', baseline = 'middle', alpha = 1,
      shadow = null, shadowBlur = 0, stroke = null, strokeWidth = 0,
      letterSpacing = 0,
    } = opts;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.font = `${weight} ${size}px ${family}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${letterSpacing}px`;
    if (shadow) {
      ctx.shadowColor = shadow;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetY = opts.shadowY || 0;
    }
    if (stroke && strokeWidth) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function measure(ctx, str, size = 20, weight = 400, family = FONT_UI) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${family}`;
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  }
  function wrapText(ctx, str, maxWidth, size, weight, family = FONT_UI) {
    ctx.save();
    ctx.font = `${weight} ${size}px ${family}`;
    const lines = [];
    let line = '';
    for (const ch of str) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = ch;
      } else line = test;
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }

  /* ---------- misc ---------- */
  function makeTile(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  function isTouch() {
    return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
  }
  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }
  function pick(arr, rng = Math.random) {
    return arr[Math.floor(rng() * arr.length) % arr.length];
  }

  return {
    W, H, TAU, FONT_UI, FONT_DISPLAY, FONT_ROUND,
    clamp, lerp, invLerp, smoothstep, damp,
    easeOutCubic, easeInCubic, easeInOutCubic, easeOutQuint, easeOutBack, easeOutElastic, pulse,
    mulberry32, hash, hash2,
    rgba, mix, shade, parseHex,
    roundRectPath, fillRoundRect, circle, ellipse,
    drawStar, drawSparkle, drawHeart, drawNote, cloudPath,
    setFont, text, measure, wrapText,
    makeTile, isTouch, pointInRect, pick,
  };
})();
