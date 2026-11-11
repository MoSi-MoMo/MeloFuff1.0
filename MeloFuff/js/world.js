/* MeloFuff — the candy hillside level */
class CandyWorld {
  constructor(seed = 20261110) {
    this.seed = seed;
    this.groundY = 566;
    this.rng = U.mulberry32(seed);
    this.platforms = [];
    this.obstacles = [];
    this.props = [];
    this.pits = [];
    this.fixedNotes = [];
    this.lollipops = [];

    // Pre-rendered scenery is built at a higher resolution on retina
    // screens; otherwise the 1x tiles look soft when the canvas is scaled.
    const dpr = window.devicePixelRatio || 1;
    this.tileScale = dpr >= 2.5 ? 1.8 : dpr > 1.3 ? 2 : 1;

    this.farTile = this._buildFarTile();
    this.midTile = this._buildMidTile();
    this.nearTile = this._buildNearTile();
    this.clouds = [
      { x: 180, y: 104, s: 1.35, a: 0.72, v: 5 },
      { x: 720, y: 62, s: 0.9, a: 0.58, v: 3.5 },
      { x: 1120, y: 150, s: 1.05, a: 0.5, v: 4.4 },
      { x: 1520, y: 82, s: 0.72, a: 0.4, v: 6 },
      { x: 1880, y: 190, s: 0.6, a: 0.32, v: 3 },
    ];
    this.generate();
  }

  generate() {
    const gy = this.groundY;
    const rng = this.rng;
    this.platforms.length = 0;
    this.obstacles.length = 0;
    this.props.length = 0;
    this.pits.length = 0;
    this.fixedNotes.length = 0;
    this.rng = U.mulberry32(this.seed);
    const r = this.rng;

    // jelly rivers
    const pitSpots = [
      [3600, 150], [6900, 170], [10400, 160], [13900, 180], [17400, 170], [19900, 170],
    ];
    for (const [x, w] of pitSpots) this.pits.push({ x, w });

    // macaron platforms
    const platformSpots = [
      [1650, 448, 190], [3000, 402, 210], [4400, 438, 180], [5800, 390, 230],
      [7200, 430, 200], [8600, 398, 220], [10100, 445, 190], [11600, 386, 230],
      [13000, 420, 210], [14500, 392, 220], [15900, 430, 200], [17200, 392, 230],
      [18600, 438, 190], [19700, 400, 220],
    ];
    for (let i = 0; i < platformSpots.length; i++) {
      const [x, y, w] = platformSpots[i];
      this.platforms.push({
        x, y, w, h: 26,
        type: i % 3 === 0 ? 'wafer' : 'macaron',
        color: ['#FFC6D9', '#BFEAD8', '#DCC7F7', '#FFD7B0'][i % 4],
        scallops: 5 + (i % 3),
        phase: r() * U.TAU,
      });
      // a little arc of notes above most platforms
      if (i > 0) this.addNoteArc(x + w * 0.18, 5, y - 66, 46, 46, i % 4 === 0);
    }

    // soft gummy bumps
    let ox = 2400;
    while (ox < 19800) {
      const w = 66 + r() * 48;
      const h = 40 + r() * 34;
      const nearPit = this.pits.some((p) => ox + w > p.x - 180 && ox < p.x + p.w + 180);
      const nearProp = [2650, 5200, 7600, 10100, 12600, 15000, 17300, 19200].some((px) => Math.abs(px - ox) < 170);
      if (!nearPit && !nearProp) {
        this.obstacles.push({
          x: ox, y: gy - h, w, h,
          type: r() > 0.55 ? 'marshmallow' : 'gumdrop',
          color: ['#FFA9C3', '#A9E6CE', '#D7BCF5', '#FFD39B', '#FFB9A8'][Math.floor(r() * 5)],
          lean: (r() - 0.5) * 0.12,
          crystals: Math.floor(r() * 5) + 3,
        });
      }
      ox += 760 + r() * 620;
    }

    // helper props
    const propSpots = [
      ['spring', 2650], ['magnet', 5200], ['balloon', 7600], ['bonus', 10100],
      ['spring', 12600], ['magnet', 15000], ['balloon', 17300], ['bonus', 19200],
    ];
    for (const [type, x] of propSpots) {
      const float = type === 'spring' ? 0 : -120 - r() * 50;
      this.props.push({
        type, x, y: gy + float, baseY: gy + float, phase: r() * U.TAU,
        active: true,
      });
    }

    // the first friendly line of notes
    for (let i = 0; i < 9; i++) {
      this.fixedNotes.push({
        x: 1050 + i * 62, baseY: gy - 96 - Math.sin((i / 8) * Math.PI) * 34,
        phase: r() * U.TAU, taken: false, kind: 'note', value: 1,
      });
    }

    // arcs over the jelly rivers (high, optional)
    for (const pit of this.pits) {
      this.addNoteArc(pit.x - 40, 6, gy - 122, 120, 80, false, true);
    }

    // friendly ground-level refrains between the platform sections
    for (const [gx, count] of [[2900, 6], [6200, 6], [9600, 6], [12300, 6], [15500, 6], [18200, 6]]) {
      this.addNoteArc(gx, count, gy - 92, 58, 40, false);
    }

    // a few stars at nice heights
    const starSpots = [
      [2000, gy - 190], [3600, gy - 235], [6900, gy - 245], [11300, gy - 220],
      [14600, gy - 250], [17700, gy - 210], [19400, gy - 235],
    ];
    for (const [x, y] of starSpots) {
      this.fixedNotes.push({
        x, baseY: y, phase: r() * U.TAU, taken: false, kind: 'star', value: 3,
      });
    }

    // ground-level candy pebbles are drawn procedurally, not stored
  }

  addNoteArc(x, count, baseY, spacing, height, star = false, desc = false) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      this.fixedNotes.push({
        x: x + i * spacing,
        baseY: baseY - Math.sin(t * Math.PI) * height * (desc ? 1 : 1),
        phase: i * 0.8,
        taken: false,
        kind: star && i === Math.floor(count / 2) ? 'star' : 'note',
        value: star && i === Math.floor(count / 2) ? 3 : 1,
      });
    }
  }

  reset() {
    for (const n of this.fixedNotes) n.taken = false;
    for (const p of this.props) p.active = true;
  }

  /* =========================================================
     parallax scenery
     ========================================================= */

  _makeTile(w, h) {
    const f = this.tileScale;
    const c = U.makeTile(w * f, h * f);
    c.logicalW = w;
    c.logicalH = h;
    const ctx = c.getContext('2d');
    ctx.scale(f, f);
    return { c, ctx };
  }

  _buildFarTile() {
    const { c, ctx: x } = this._makeTile(1920, 720);
    const r = U.mulberry32(717);

    // a whisper of rainbow behind the far hills
    const rainbow = ['#FF9FB8', '#FFCE97', '#FFEEA8', '#B7EAD2', '#AFD7F3', '#D2B9F1'];
    x.save();
    x.globalAlpha = 0.16;
    for (let i = 0; i < rainbow.length; i++) {
      x.strokeStyle = rainbow[i];
      x.lineWidth = 17;
      x.beginPath();
      x.arc(880, 820, 430 + i * 16, Math.PI * 1.12, Math.PI * 1.88);
      x.stroke();
    }
    x.restore();

    const mound = (cx, base, rx, ry, color) => {
      const top = base - ry;
      const g = x.createLinearGradient(0, top, 0, base);
      g.addColorStop(0, U.shade(color, 0.26));
      g.addColorStop(0.55, color);
      g.addColorStop(1, U.shade(color, -0.08));
      x.fillStyle = g;
      x.beginPath();
      x.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      x.rect(cx - rx, base, rx * 2, 220);
      x.fill();
      x.strokeStyle = U.rgba(U.shade(color, -0.25), 0.22);
      x.lineWidth = 2;
      x.stroke();

      // frosted crest
      x.save();
      x.beginPath();
      x.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      x.rect(cx - rx, base, rx * 2, 220);
      x.clip();
      const capY = top + Math.min(64, ry * 0.3);
      x.fillStyle = 'rgba(255,250,240,0.95)';
      x.beginPath();
      x.moveTo(cx - rx, capY + 26);
      const n = Math.max(5, Math.round(rx / 100));
      for (let i = 0; i <= n; i++) {
        const px = cx - rx + (rx * 2 * i) / n;
        const py = capY + Math.sin((i / n) * Math.PI) * -8 + Math.sin(i * 2.7) * 7;
        x.quadraticCurveTo(px - rx / n * 0.5, py + 22, px, py);
      }
      x.lineTo(cx + rx, top - 30);
      x.lineTo(cx - rx, top - 30);
      x.closePath();
      x.fill();
      // piped icing frill
      x.strokeStyle = 'rgba(255,255,255,0.75)';
      x.lineWidth = 3;
      x.beginPath();
      for (let i = 0; i <= n; i++) {
        const px = cx - rx + (rx * 2 * i) / n;
        const py = capY + Math.sin((i / n) * Math.PI) * -8 + Math.sin(i * 2.7) * 7 + 5;
        x.arc(px, py, 8, 0.2, Math.PI - 0.2);
      }
      x.stroke();

      // sugar speckles
      for (let i = 0; i < 36; i++) {
        const dx = cx + (U.hash(i * 3.1 + cx) - 0.5) * rx * 1.7;
        const dy = top + U.hash(i * 7.7 + cx) * ry * 0.95;
        x.fillStyle = ['rgba(255,255,255,.65)', 'rgba(255,181,203,.7)', 'rgba(168,225,204,.7)', 'rgba(255,235,170,.7)'][i % 4];
        x.beginPath();
        x.arc(dx, dy, 1.6 + U.hash(i) * 2.4, 0, U.TAU);
        x.fill();
      }
      // tiny candy cane posts on the crest
      for (let i = 0; i < 2; i++) {
        const px = cx + (i ? 0.38 : -0.4) * rx;
        const py = top + (i ? 0.14 : 0.2) * ry;
        x.strokeStyle = '#FFF8EB';
        x.lineWidth = 4;
        x.lineCap = 'round';
        x.beginPath();
        x.moveTo(px, py + 26);
        x.lineTo(px, py - 20);
        x.stroke();
        x.strokeStyle = '#FFA5BE';
        x.setLineDash([5, 7]);
        x.beginPath();
        x.moveTo(px, py + 26);
        x.lineTo(px, py - 20);
        x.stroke();
        x.setLineDash([]);
        x.fillStyle = i ? '#FFD69A' : '#FFB3C9';
        x.beginPath();
        x.arc(px, py - 24, 5, 0, U.TAU);
        x.fill();
      }
      x.restore();
    };

    mound(180, 780, 380, 290, '#D6B8F0');
    mound(760, 780, 520, 320, '#FFC1D8');
    mound(1330, 790, 440, 285, '#BCE8D5');
    mound(1780, 800, 360, 250, '#EBD3F7');
    mound(1000, 820, 260, 200, '#FFDDB0');

    // a storybook wafer castle on the ridge
    const drawCastle = (cx, base, scale = 1) => {
      x.save();
      x.translate(cx, base);
      x.scale(scale, scale);
      x.globalAlpha = 0.9;
      const tower = (tx, tw, th, roofColor) => {
        x.fillStyle = '#FBEBD8';
        U.roundRectPath(x, tx - tw / 2, -th, tw, th, [tw / 2, tw / 2, 6, 6]);
        x.fill();
        x.strokeStyle = 'rgba(196,148,120,0.28)';
        x.lineWidth = 1.6;
        x.stroke();
        x.fillStyle = roofColor;
        x.beginPath();
        x.moveTo(tx - tw * 0.66, -th);
        x.quadraticCurveTo(tx, -th - tw * 1.25, tx + tw * 0.66, -th);
        x.closePath();
        x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.75)';
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(tx, -th - tw * 0.9);
        x.lineTo(tx, -th - tw * 1.55);
        x.stroke();
        x.fillStyle = '#FFF4B5';
        x.beginPath();
        x.moveTo(tx, -th - tw * 1.55);
        x.lineTo(tx + tw * 0.45, -th - tw * 1.4);
        x.lineTo(tx, -th - tw * 1.25);
        x.closePath();
        x.fill();
        // windows
        for (let i = 0; i < 3; i++) {
          x.fillStyle = 'rgba(255,205,230,0.65)';
          U.roundRectPath(x, tx - tw * 0.13, -th + 26 + i * 34, tw * 0.26, 18, 9);
          x.fill();
        }
      };
      tower(-86, 52, 190, '#FFB2C7');
      tower(82, 44, 150, '#B5E8D4');
      tower(0, 66, 118, '#D7BCF2');
      x.fillStyle = '#F8E3CD';
      U.roundRectPath(x, -80, -118, 160, 118, [12, 12, 0, 0]);
      x.fill();
      x.strokeStyle = 'rgba(196,148,120,0.28)';
      x.stroke();
      for (let i = 0; i < 3; i++) {
        x.fillStyle = 'rgba(255,252,235,0.75)';
        U.roundRectPath(x, -22, -96 + i * 26, 44, 15, 7);
        x.fill();
      }
      x.restore();
    };
    drawCastle(1210, 706, 1.0);

    // floating candy islands
    const island = (cx, cy, s, color) => {
      x.save();
      x.translate(cx, cy);
      x.scale(s, s);

      // sugar halo
      const glow = x.createRadialGradient(0, 0, 10, 0, 0, 150);
      glow.addColorStop(0, 'rgba(255,255,255,0.34)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = glow;
      x.beginPath();
      x.arc(0, 10, 150, 0, U.TAU);
      x.fill();

      // fluffy candy-cloud underside, with a little pointed tail
      const ug = x.createLinearGradient(0, -10, 0, 95);
      ug.addColorStop(0, U.shade(color, 0.25));
      ug.addColorStop(0.45, color);
      ug.addColorStop(1, '#FFF0DE');
      x.fillStyle = ug;
      x.beginPath();
      x.moveTo(-96, 2);
      x.bezierCurveTo(-102, 45, -72, 48, -66, 66);
      x.bezierCurveTo(-52, 56, -42, 56, -34, 76);
      x.bezierCurveTo(-18, 65, -10, 76, 0, 104);
      x.bezierCurveTo(12, 74, 20, 66, 36, 78);
      x.bezierCurveTo(44, 55, 58, 55, 66, 64);
      x.bezierCurveTo(78, 40, 96, 36, 96, 2);
      x.closePath();
      x.fill();
      x.strokeStyle = U.rgba(U.shade(color, -0.3), 0.28);
      x.lineWidth = 2.5;
      x.stroke();

      // hanging sugar crystals
      for (let i = 0; i < 6; i++) {
        const px = -70 + i * 28;
        const py = 44 + Math.sin(i * 2.1) * 12;
        x.fillStyle = ['#FFF6E6', '#FFC5D8', '#C9EEDF'][i % 3];
        x.beginPath();
        x.ellipse(px, py, 4, 9 + (i % 3) * 3, 0, 0, Math.PI);
        x.fill();
      }

      // vanilla icing top
      x.fillStyle = '#FFF9EE';
      x.beginPath();
      x.ellipse(0, 2, 106, 27, 0, 0, U.TAU);
      x.fill();
      x.strokeStyle = 'rgba(220,173,190,0.25)';
      x.lineWidth = 1.8;
      x.stroke();
      // candy-coloured lawn
      x.fillStyle = U.rgba(color, 0.72);
      x.beginPath();
      x.ellipse(0, -2, 96, 19, 0, 0, U.TAU);
      x.fill();
      // scalloped icing edge
      for (let i = 0; i < 9; i++) {
        const px = -88 + i * 22;
        x.fillStyle = 'rgba(255,250,240,0.95)';
        x.beginPath();
        x.arc(px, 10 + Math.sin(i) * 3, 10, 0, Math.PI);
        x.fill();
      }
      // sprinkles on the lawn
      for (let i = 0; i < 10; i++) {
        x.fillStyle = ['#FF9FBA', '#FFE4A2', '#FFFFFF', '#B3EBD8'][i % 4];
        x.save();
        x.translate(-76 + U.hash(i * 3.4) * 150, -8 + U.hash(i * 5.2) * 20);
        x.rotate(U.hash(i * 2.1) * 3);
        U.roundRectPath(x, -4, -1.4, 8, 2.8, 1.4);
        x.fill();
        x.restore();
      }

      // tiny lollipop garden
      x.strokeStyle = '#FFF7E8';
      x.lineWidth = 5;
      x.beginPath();
      x.moveTo(28, -2);
      x.lineTo(28, -52);
      x.stroke();
      x.fillStyle = '#FFB7CC';
      x.beginPath();
      x.arc(28, -60, 20, 0, U.TAU);
      x.fill();
      x.strokeStyle = '#FFF9EC';
      x.lineWidth = 4.5;
      x.beginPath();
      for (let a = 0; a < Math.PI * 3; a += 0.2) {
        const rr = (a / (Math.PI * 3)) * 15;
        if (a === 0) x.moveTo(28 + rr, -60);
        else x.lineTo(28 + Math.cos(a) * rr, -60 + Math.sin(a) * rr);
      }
      x.stroke();
      // candy cane
      x.strokeStyle = '#FFF7E8';
      x.lineWidth = 4;
      x.beginPath();
      x.moveTo(-34, -2);
      x.lineTo(-34, -36);
      x.quadraticCurveTo(-34, -50, -20, -48);
      x.stroke();
      x.strokeStyle = '#FF9FBA';
      x.setLineDash([4, 5]);
      x.beginPath();
      x.moveTo(-34, -2);
      x.lineTo(-34, -36);
      x.quadraticCurveTo(-34, -50, -20, -48);
      x.stroke();
      x.setLineDash([]);
      // little flowers
      for (let i = 0; i < 3; i++) {
        x.fillStyle = ['#FFE6A0', '#FFC4D7', '#FFFFFF'][i];
        x.beginPath();
        x.arc(-62 + i * 20, -12 + (i % 2) * 8, 3.4, 0, U.TAU);
        x.fill();
      }

      for (let i = 0; i < 4; i++) {
        U.drawSparkle(x, -72 + i * 46, -42 + (i % 2) * 18, 4.5, '#FFF8E5', i, 0.8);
      }
      x.restore();
    };
    island(330, 330, 0.9, '#FFD3E2');
    island(1540, 300, 0.68, '#CFEEDF');

    // far-away balloons
    const balloon = (cx, cy, s, color) => {
      x.save();
      x.translate(cx, cy);
      x.scale(s, s);
      x.globalAlpha = 0.6;
      const bg = x.createLinearGradient(-20, -30, 20, 30);
      bg.addColorStop(0, U.shade(color, 0.3));
      bg.addColorStop(1, color);
      x.fillStyle = bg;
      x.beginPath();
      x.ellipse(0, 0, 24, 30, 0, 0, U.TAU);
      x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.45)';
      x.lineWidth = 1.2;
      x.beginPath();
      x.moveTo(-8, 26);
      x.quadraticCurveTo(-4, 40, 0, 48);
      x.moveTo(8, 26);
      x.quadraticCurveTo(4, 40, 0, 48);
      x.stroke();
      x.fillStyle = '#FFF8EC';
      U.roundRectPath(x, -11, 47, 22, 12, 5);
      x.fill();
      x.restore();
    };
    balloon(620, 180, 0.8, '#FFAFC7');
    balloon(1710, 200, 0.6, '#AEE7D2');

    // sugar dust
    for (let i = 0; i < 26; i++) {
      const px = U.hash(i * 1.7) * 1920;
      const py = 120 + U.hash(i * 4.4) * 420;
      x.fillStyle = 'rgba(255,255,255,0.5)';
      U.drawSparkle(x, px, py, 1.5 + U.hash(i) * 2.5, '#FFFFFF', i, 0.55);
    }
    return c;
  }

  _buildMidTile() {
    const { c, ctx: x } = this._makeTile(1800, 720);
    const r = U.mulberry32(991);

    const hill = (cx, base, rx, ry, color) => {
      const top = base - ry;
      const g = x.createLinearGradient(0, top, 0, base);
      g.addColorStop(0, U.shade(color, 0.24));
      g.addColorStop(1, U.shade(color, -0.04));
      x.fillStyle = g;
      x.beginPath();
      x.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      x.rect(cx - rx, base, rx * 2, 120);
      x.fill();
      // cream crest
      x.save();
      x.beginPath();
      x.ellipse(cx, base, rx, ry, 0, Math.PI, 0);
      x.rect(cx - rx, base, rx * 2, 120);
      x.clip();
      x.fillStyle = 'rgba(255,249,239,0.72)';
      x.beginPath();
      x.ellipse(cx, top + 16, rx * 1.01, ry * 0.22, 0, 0, U.TAU);
      x.fill();
      x.restore();
      // sprinkles
      for (let i = 0; i < 16; i++) {
        x.fillStyle = ['rgba(255,255,255,.55)', 'rgba(255,190,210,.6)', 'rgba(255,236,170,.6)'][i % 3];
        x.beginPath();
        x.arc(cx + (U.hash(i * 3.7 + cx) - 0.5) * rx * 1.4, top + 30 + U.hash(i * 5.3 + cx) * ry * 0.5, 1.4 + U.hash(i) * 1.8, 0, U.TAU);
        x.fill();
      }
    };

    hill(180, 690, 310, 125, '#AFE3D1');
    hill(760, 700, 420, 155, '#D4BCF0');
    hill(1290, 690, 340, 135, '#FFD8A8');
    hill(1690, 700, 290, 120, '#FFC1D8');

    // generous lollipop trees (long sticks, high candy heads)
    const lollipop = (cx, base, size, color, swirlColor, lean) => {
      x.save();
      x.translate(cx, base);
      x.rotate(lean);
      const stickH = 292 + size * 0.28;
      const sg = x.createLinearGradient(-6, 0, 7, 0);
      sg.addColorStop(0, '#FFF7EA');
      sg.addColorStop(0.5, '#F4E3D0');
      sg.addColorStop(1, '#E3CAB3');
      x.fillStyle = sg;
      U.roundRectPath(x, -5, -stickH, 10, stickH + 20, 5);
      x.fill();
      x.strokeStyle = 'rgba(181,133,108,0.28)';
      x.lineWidth = 1.3;
      x.stroke();
      // head
      const hy = -stickH;
      const rr = size * 0.55;
      const g = x.createRadialGradient(-rr * 0.3, hy - rr * 0.3, 3, 0, hy, rr * 1.15);
      g.addColorStop(0, U.shade(color, 0.4));
      g.addColorStop(0.55, color);
      g.addColorStop(1, U.shade(color, -0.12));
      x.fillStyle = g;
      x.beginPath();
      x.arc(0, hy, rr, 0, U.TAU);
      x.fill();
      x.strokeStyle = U.rgba(U.shade(color, -0.3), 0.3);
      x.lineWidth = 2;
      x.stroke();
      // spiral
      x.strokeStyle = swirlColor;
      x.lineWidth = Math.max(4, size * 0.095);
      x.lineCap = 'round';
      x.beginPath();
      for (let a = 0; a < Math.PI * 3.4; a += 0.16) {
        const rad = (a / (Math.PI * 3.4)) * rr * 0.82;
        const px = Math.cos(a) * rad;
        const py = hy + Math.sin(a) * rad;
        if (a === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
      x.stroke();
      // gloss
      x.fillStyle = 'rgba(255,255,255,0.42)';
      x.beginPath();
      x.ellipse(-rr * 0.32, hy - rr * 0.35, rr * 0.22, rr * 0.12, -0.55, 0, U.TAU);
      x.fill();
      for (let i = 0; i < 3; i++) {
        x.fillStyle = '#FFF8E7';
        x.beginPath();
        x.arc(-rr * 0.5 + i * rr * 0.5, hy + rr * (0.35 + (i % 2) * 0.25), 2, 0, U.TAU);
        x.fill();
      }
      x.restore();
    };
    lollipop(120, 690, 66, '#FFB3C9', '#FFF6E8', -0.05);
    lollipop(570, 700, 54, '#A9E4CE', '#FFF6E8', 0.06);
    lollipop(1080, 690, 78, '#CDB0EF', '#FFF6E8', -0.03);
    lollipop(1560, 700, 58, '#FFD29C', '#FFF6E8', 0.04);

    // tall candy-cane arch
    const arch = (cx, base, span, height, lean = 0) => {
      x.save();
      x.translate(cx, base);
      x.rotate(lean);
      const path = new Path2D();
      path.moveTo(-span / 2, 0);
      path.lineTo(-span / 2, -height);
      path.quadraticCurveTo(0, -height - span * 0.62, span / 2, -height);
      path.lineTo(span / 2, 0);
      x.lineCap = 'round';
      x.strokeStyle = 'rgba(214,146,164,0.4)';
      x.lineWidth = 25;
      x.stroke(path);
      x.strokeStyle = '#FFF7E8';
      x.lineWidth = 21;
      x.stroke(path);
      x.strokeStyle = '#FFA4BB';
      x.lineWidth = 21;
      x.setLineDash([30, 30]);
      x.stroke(path);
      x.setLineDash([]);
      x.strokeStyle = 'rgba(255,255,255,0.5)';
      x.lineWidth = 5;
      x.stroke(path);
      // icing frill at the feet
      for (const side of [-1, 1]) {
        x.fillStyle = '#FFF9EF';
        x.beginPath();
        x.arc(side * span / 2, -2, 16, 0, Math.PI);
        x.fill();
      }
      x.restore();
    };
    arch(330, 700, 220, 260, -0.015);
    arch(1280, 700, 180, 220, 0.02);

    // bunting between the arch and the lollipop
    x.strokeStyle = 'rgba(255,250,238,0.75)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(330, 440);
    x.quadraticCurveTo(470, 490, 620, 460);
    x.stroke();
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const px = U.lerp(338, 612, t);
      const py = U.lerp(442, 462, t) + Math.sin(t * Math.PI) * 28;
      x.fillStyle = ['#FFAFC6', '#FFE0A4', '#A9E5CF', '#D6B8F0'][i % 4];
      x.beginPath();
      x.moveTo(px - 9, py);
      x.lineTo(px + 9, py);
      x.lineTo(px, py + 17);
      x.closePath();
      x.fill();
    }

    // cotton-candy puffs
    for (let i = 0; i < 5; i++) {
      const px = 150 + r() * 1500;
      const py = 560 + r() * 80;
      const s = 30 + r() * 28;
      x.fillStyle = 'rgba(255,250,243,0.82)';
      x.beginPath();
      x.arc(px, py, s, 0, U.TAU);
      x.arc(px + s * 0.8, py + 4, s * 0.72, 0, U.TAU);
      x.arc(px - s * 0.75, py + 7, s * 0.6, 0, U.TAU);
      x.fill();
    }

    // a tiny candy cane fence
    for (let i = 0; i < 6; i++) {
      const fx = 1490 + i * 34;
      x.strokeStyle = '#FFF8EC';
      x.lineWidth = 8;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(fx, 640);
      x.lineTo(fx, 570);
      x.stroke();
      x.strokeStyle = '#FFA5BC';
      x.setLineDash([7, 8]);
      x.beginPath();
      x.moveTo(fx, 640);
      x.lineTo(fx, 570);
      x.stroke();
      x.setLineDash([]);
    }
    x.strokeStyle = '#FFF8EC';
    x.lineWidth = 7;
    x.beginPath();
    x.moveTo(1486, 592);
    x.lineTo(1668, 592);
    x.stroke();

    return c;
  }

  _buildNearTile() {
    const { c, ctx: x } = this._makeTile(1500, 720);
    const r = U.mulberry32(335);

    // plump gumdrop bushes, mainly for a low foreground fringe
    const bush = (cx, base, s, color) => {
      const g = x.createLinearGradient(0, base - s * 1.35, 0, base);
      g.addColorStop(0, U.shade(color, 0.34));
      g.addColorStop(1, U.shade(color, -0.06));
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(cx - s, base);
      x.bezierCurveTo(cx - s * 1.06, base - s * 0.78, cx - s * 0.55, base - s * 1.22, cx - s * 0.04, base - s * 1.06);
      x.bezierCurveTo(cx + s * 0.4, base - s * 1.4, cx + s * 1.0, base - s * 0.96, cx + s * 0.93, base - s * 0.18);
      x.quadraticCurveTo(cx + s * 0.9, base, cx + s * 0.8, base);
      x.closePath();
      x.fill();
      x.strokeStyle = U.rgba(U.shade(color, -0.28), 0.28);
      x.lineWidth = 1.8;
      x.stroke();
      // frosting halo
      x.fillStyle = 'rgba(255,250,242,0.65)';
      x.beginPath();
      x.ellipse(cx + s * 0.02, base - s * 1.02, s * 0.78, s * 0.2, 0, Math.PI, 0);
      x.fill();
      // gloss
      x.fillStyle = 'rgba(255,255,255,0.28)';
      x.beginPath();
      x.ellipse(cx - s * 0.28, base - s * 0.8, s * 0.18, s * 0.1, -0.5, 0, U.TAU);
      x.fill();
      // sprinkles
      for (let i = 0; i < 6; i++) {
        x.fillStyle = ['rgba(255,255,255,.6)', 'rgba(255,240,170,.75)', 'rgba(255,255,255,.4)'][i % 3];
        x.beginPath();
        x.arc(cx + (U.hash(i * 2.2 + cx) - 0.5) * s * 1.2, base - U.hash(i * 7.1 + cx) * s * 0.95, 1.7 + U.hash(i) * 2, 0, U.TAU);
        x.fill();
      }
    };
    bush(130, 630, 74, '#FFB9CF');
    bush(640, 638, 96, '#ABE4D0');
    bush(1190, 630, 70, '#D9C0F2');
    bush(1410, 636, 56, '#FFCFA0');

    // one tall lollipop close to the camera
    x.save();
    x.translate(980, 680);
    x.rotate(0.04);
    x.fillStyle = '#F6E2CE';
    U.roundRectPath(x, -7, -300, 14, 300, 7);
    x.fill();
    const hg = x.createRadialGradient(-18, -350, 4, 0, -340, 74);
    hg.addColorStop(0, '#FFE3EC');
    hg.addColorStop(0.6, '#FFB3C8');
    hg.addColorStop(1, '#EC8FAD');
    x.fillStyle = hg;
    x.beginPath();
    x.arc(0, -340, 66, 0, U.TAU);
    x.fill();
    x.strokeStyle = 'rgba(206,118,143,0.3)';
    x.lineWidth = 2;
    x.stroke();
    x.strokeStyle = '#FFF7EA';
    x.lineWidth = 11;
    x.beginPath();
    for (let a = 0; a < Math.PI * 3.4; a += 0.16) {
      const rad = (a / (Math.PI * 3.4)) * 53;
      const px = Math.cos(a) * rad;
      const py = -340 + Math.sin(a) * rad;
      if (a === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.45)';
    x.beginPath();
    x.ellipse(-20, -362, 14, 8, -0.5, 0, U.TAU);
    x.fill();
    x.restore();

    // smaller candy flowers
    const flower = (cx, base, s, petal) => {
      x.strokeStyle = '#EEDCC8';
      x.lineWidth = 3;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(cx, base);
      x.quadraticCurveTo(cx + 5, base - s * 0.8, cx + 2, base - s * 1.4);
      x.stroke();
      x.fillStyle = petal;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * U.TAU;
        x.beginPath();
        x.arc(cx + 2 + Math.cos(a) * s * 0.32, base - s * 1.4 + Math.sin(a) * s * 0.32, s * 0.27, 0, U.TAU);
        x.fill();
      }
      x.fillStyle = '#FFF3B8';
      x.beginPath();
      x.arc(cx + 2, base - s * 1.4, s * 0.17, 0, U.TAU);
      x.fill();
    };
    for (let i = 0; i < 10; i++) {
      flower(50 + r() * 1400, 580 + r() * 14, 16 + r() * 10, ['#FFC2D6', '#C4A8EA', '#FFE0A9'][i % 3]);
    }

    // a wrapped candy and a little fence
    x.save();
    x.translate(440, 604);
    x.rotate(-0.08);
    x.fillStyle = '#FFD7A2';
    x.beginPath();
    x.moveTo(-60, 0); x.lineTo(-34, -18); x.lineTo(-34, 18); x.closePath();
    x.moveTo(60, 0); x.lineTo(34, -18); x.lineTo(34, 18); x.closePath();
    x.fill();
    const wg = x.createLinearGradient(0, -22, 0, 22);
    wg.addColorStop(0, '#FFF4E3');
    wg.addColorStop(1, '#FFC1D6');
    x.fillStyle = wg;
    U.roundRectPath(x, -36, -22, 72, 44, 18);
    x.fill();
    x.strokeStyle = 'rgba(213,135,155,0.4)';
    x.lineWidth = 1.5;
    x.stroke();
    x.strokeStyle = '#FF9FBB';
    x.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      x.beginPath();
      x.moveTo(i * 12 - 6, -18);
      x.lineTo(i * 12 + 6, 18);
      x.stroke();
    }
    x.restore();

    for (let i = 0; i < 7; i++) {
      const fx = 820 + i * 30;
      x.fillStyle = '#FFF5E7';
      U.roundRectPath(x, fx, 560, 12, 48, 6);
      x.fill();
      x.fillStyle = '#FFB6C9';
      x.beginPath();
      x.moveTo(fx, 560);
      x.lineTo(fx + 6, 543);
      x.lineTo(fx + 12, 560);
      x.fill();
    }
    x.fillStyle = '#FFF5E7';
    U.roundRectPath(x, 816, 578, 218, 11, 5.5);
    x.fill();

    return c;
  }

  drawSky(ctx, t, camX) {
    const g = ctx.createLinearGradient(0, 0, 0, U.H);
    g.addColorStop(0, '#FFF9ED');
    g.addColorStop(0.34, '#FFF0F4');
    g.addColorStop(0.62, '#FFE9F0');
    g.addColorStop(0.82, '#E8F7FF');
    g.addColorStop(1, '#FFF4E4');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, U.W, U.H);

    // cotton sun
    const sx = 1035, sy = 122;
    const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 210);
    halo.addColorStop(0, 'rgba(255,249,224,0.95)');
    halo.addColorStop(0.35, 'rgba(255,243,220,0.45)');
    halo.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, 210, 0, U.TAU);
    ctx.fill();
    const sun = ctx.createRadialGradient(sx - 14, sy - 14, 4, sx, sy, 62);
    sun.addColorStop(0, '#FFFDF1');
    sun.addColorStop(0.7, '#FFF1C8');
    sun.addColorStop(1, 'rgba(255,229,184,0.65)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(sx, sy, 58, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(sx - 16, sy - 20, 22, 13, -0.5, 0, U.TAU);
    ctx.fill();

    // drifting clouds
    for (const c of this.clouds) {
      const span = 1800;
      let cx = ((c.x - camX * 0.035 + t * c.v) % span + span) % span - 220;
      if (cx > U.W + 260) cx -= span;
      const y = c.y - camX * 0.01;
      ctx.save();
      ctx.globalAlpha = c.a;
      ctx.translate(cx, y);
      ctx.scale(c.s, c.s);
      U.cloudPath(ctx, -140, 0, 280, 100);
      const cg = ctx.createLinearGradient(0, 0, 0, 100);
      cg.addColorStop(0, 'rgba(255,253,245,0.98)');
      cg.addColorStop(0.7, 'rgba(255,243,238,0.95)');
      cg.addColorStop(1, 'rgba(255,214,226,0.85)');
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(-60, 26, 55, 20, -0.1, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    }

    // sugar dust in the air
    for (let i = 0; i < 24; i++) {
      const x = ((U.hash(i * 2.9) * 1500 - camX * 0.08 + t * (4 + i % 5)) % 1500 + 1500) % 1500 - 100;
      const y = 70 + U.hash(i * 7.3) * 440 + Math.sin(t * 0.7 + i) * 10;
      ctx.globalAlpha = 0.2 + U.hash(i) * 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 1 + U.hash(i * 3.3) * 2.2, 0, U.TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawParallax(ctx, camX, t) {
    const drawTile = (tile, speed, yOff = 0) => {
      const w = tile.logicalW || tile.width;
      let off = -((camX * speed) % w);
      if (off > 0) off -= w;
      for (let x = off; x < U.W + w; x += w) {
        ctx.drawImage(tile, x, yOff, w, tile.logicalH || tile.height);
      }
    };
    drawTile(this.farTile, 0.055, 0);
    drawTile(this.midTile, 0.17, 8);
    drawTile(this.nearTile, 0.4, -10);
  }

  /* =========================================================
     ground + jelly rivers
     ========================================================= */

  groundTop(x) {
    return this.groundY + Math.sin(x * 0.006) * 2.2 + Math.sin(x * 0.013 + 1.7) * 1.6;
  }

  isPit(x) {
    for (const p of this.pits) {
      if (x > p.x + 4 && x < p.x + p.w - 4) return p;
    }
    return null;
  }

  pitAfter(x) {
    for (const p of this.pits) {
      if (x > p.x - 30 && x < p.x + p.w + 30) return p;
    }
    return null;
  }

  _groundSegments() {
    const segs = [];
    let start = -3000;
    for (const p of this.pits) {
      if (p.x > start) segs.push([start, p.x]);
      start = p.x + p.w;
    }
    segs.push([start, 40000]);
    return segs;
  }

  drawRiver(ctx, camX, t) {
    for (const p of this.pits) {
      const x = p.x - camX;
      if (x > U.W + 100 || x + p.w < -100) continue;
      const top = this.groundY + 6;
      const g = ctx.createLinearGradient(0, top, 0, U.H);
      g.addColorStop(0, '#D6F5F2');
      g.addColorStop(0.25, '#A9E4E4');
      g.addColorStop(0.7, '#8FD2D8');
      g.addColorStop(1, '#79BFCC');
      ctx.fillStyle = g;
      ctx.fillRect(x, top + 20, p.w, U.H - top);
      // wavy jelly surface
      ctx.beginPath();
      ctx.moveTo(x, top + 26);
      for (let i = 0; i <= 10; i++) {
        const px = x + (p.w * i) / 10;
        ctx.quadraticCurveTo(px - p.w / 20, top + 18 + Math.sin(t * 2 + i) * 5, px, top + 24 + Math.sin(t * 1.6 + i * 1.3) * 4);
      }
      ctx.lineTo(x + p.w, top + 44);
      ctx.lineTo(x, top + 44);
      ctx.closePath();
      const surf = ctx.createLinearGradient(0, top + 16, 0, top + 50);
      surf.addColorStop(0, 'rgba(255,255,255,0.75)');
      surf.addColorStop(1, 'rgba(180,240,235,0.35)');
      ctx.fillStyle = surf;
      ctx.fill();
      // sparkles on water
      for (let i = 0; i < 5; i++) {
        const px = x + 20 + U.hash(i * 4.7 + p.x) * (p.w - 40);
        const py = top + 60 + U.hash(i * 2.2) * 100 + Math.sin(t + i) * 5;
        U.drawSparkle(ctx, px, py, 3 + Math.sin(t * 3 + i) * 2, 'rgba(255,255,255,0.75)', t * 0.3, 0.6);
      }
      // floating jelly cube
      ctx.save();
      ctx.translate(x + p.w * 0.5, top + 80 + Math.sin(t * 1.4) * 6);
      ctx.rotate(Math.sin(t * 0.8) * 0.08);
      ctx.fillStyle = 'rgba(255,193,216,0.7)';
      U.roundRectPath(ctx, -17, -14, 34, 28, 9);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      U.roundRectPath(ctx, -10, -9, 11, 6, 3);
      ctx.fill();
      ctx.restore();
    }
  }

  drawGround(ctx, camX, t) {
    const gy = this.groundY;
    const segs = this._groundSegments();
    for (const [a, b] of segs) {
      const x0 = Math.max(a, camX - 160);
      const x1 = Math.min(b, camX + U.W + 160);
      if (x1 <= x0) continue;
      const sx0 = x0 - camX;
      const sx1 = x1 - camX;

      // main candy earth
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx0, this.groundTop(x0));
      for (let x = x0; x <= x1; x += 18) ctx.lineTo(x - camX, this.groundTop(x));
      ctx.lineTo(sx1, U.H + 20);
      ctx.lineTo(sx0, U.H + 20);
      ctx.closePath();
      const earth = ctx.createLinearGradient(0, gy, 0, U.H);
      earth.addColorStop(0, '#FFE7EE');
      earth.addColorStop(0.22, '#FFD0DF');
      earth.addColorStop(0.55, '#FFBED2');
      earth.addColorStop(1, '#F0A6C0');
      ctx.fillStyle = earth;
      ctx.fill();
      ctx.clip();

      // soft candy strata
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 4; i++) {
        const yy = gy + 48 + i * 44;
        ctx.fillStyle = i % 2 ? '#FFF7EA' : i === 2 ? '#A9E6D3' : '#FF9FBC';
        ctx.beginPath();
        ctx.moveTo(0, yy);
        for (let x = 0; x <= U.W; x += 40) {
          ctx.lineTo(x, yy + Math.sin((x + camX) * 0.02 + i) * 4);
        }
        ctx.lineTo(U.W, yy + 13);
        ctx.lineTo(0, yy + 13);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // wafer bottom edge
      const wy = gy + 130;
      const wg = ctx.createLinearGradient(0, wy, 0, U.H);
      wg.addColorStop(0, '#F6DCB8');
      wg.addColorStop(1, '#E7BA8C');
      ctx.fillStyle = wg;
      ctx.fillRect(0, wy, U.W, U.H - wy);
      ctx.strokeStyle = 'rgba(187,129,82,0.22)';
      ctx.lineWidth = 1.2;
      for (let x = -camX % 22; x < U.W; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, wy);
        ctx.lineTo(x + 18, U.H);
        ctx.stroke();
      }
      ctx.beginPath();
      for (let x = -camX % 70; x < U.W; x += 70) {
        ctx.moveTo(x, wy + 18);
        ctx.lineTo(x + 70, wy + 18);
        ctx.stroke();
      }

      // sprinkle field in the cake
      for (let i = 0; i < 80; i++) {
        const wx = x0 + U.hash(i * 3.3 + Math.floor(x0 / 60)) * (x1 - x0);
        const wy = gy + 46 + U.hash(i * 7.7 + Math.floor(x0 / 60)) * 160;
        const col = ['rgba(255,255,255,.55)', 'rgba(255,176,199,.7)', 'rgba(255,230,170,.65)', 'rgba(170,226,208,.65)'][i % 4];
        ctx.fillStyle = col;
        ctx.save();
        ctx.translate(wx - camX, wy);
        ctx.rotate(U.hash(i) * 3);
        U.roundRectPath(ctx, -5, -1.5, 10, 3, 1.5);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // frosting icing cap
      ctx.beginPath();
      ctx.moveTo(sx0, this.groundTop(x0) - 2);
      for (let x = x0; x <= x1; x += 16) ctx.lineTo(x - camX, this.groundTop(x) - 2);
      ctx.lineTo(sx1, this.groundTop(x1) + 30);
      ctx.lineTo(sx0, this.groundTop(x0) + 30);
      ctx.closePath();
      const ice = ctx.createLinearGradient(0, gy - 16, 0, gy + 34);
      ice.addColorStop(0, '#FFFBF1');
      ice.addColorStop(0.55, '#FFF4E4');
      ice.addColorStop(1, '#FFE6D6');
      ctx.fillStyle = ice;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // frosting drips
      for (let x = Math.floor(x0 / 54) * 54; x < x1; x += 54) {
        const h = 12 + U.hash(x * 0.13) * 16;
        const px = x - camX;
        const py = this.groundTop(x) + 26;
        ctx.fillStyle = '#FFF2E3';
        ctx.beginPath();
        ctx.ellipse(px + 14, py, 17, h * 0.72, 0, 0, Math.PI);
        ctx.arc(px + 14, py - 1, 16, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.ellipse(px + 9, py - 2, 4, 2.5, -0.4, 0, U.TAU);
        ctx.fill();
      }

      // piped icing beads
      for (let x = Math.floor(x0 / 46) * 46; x < x1; x += 46) {
        const px = x - camX + 23;
        const py = this.groundTop(x + 23) + 3;
        const beadCols = ['#FFF9EC', '#FFD8E4', '#FFF0C0', '#D6F3E7'];
        ctx.fillStyle = beadCols[Math.floor(U.hash(x * 0.61) * beadCols.length)];
        ctx.beginPath();
        ctx.ellipse(px, py, 7, 5.5, 0, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.58)';
        ctx.beginPath();
        ctx.arc(px - 2, py - 1.6, 2.2, 0, U.TAU);
        ctx.fill();
      }

      // chunky candy decorations on the icing verge
      for (let x = Math.floor(x0 / 210) * 210; x < x1; x += 210) {
        if (U.hash(x * 0.43) > 0.68) continue;
        const px = x - camX + 70 + U.hash(x * 2.6) * 60;
        const py = this.groundTop(x) + 2;
        const kind = Math.floor(U.hash(x * 1.9) * 3);
        if (kind === 0) {
          // gumdrop
          const col = ['#FFAEC7', '#A7E5D0', '#D5B9F1', '#FFD59C'][Math.floor(U.hash(x * 3.1) * 4)];
          const s = 9 + U.hash(x * 5.3) * 5;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(px - s, py);
          ctx.bezierCurveTo(px - s * 1.1, py - s * 1.2, px - s * 0.4, py - s * 1.5, px, py - s * 1.5);
          ctx.bezierCurveTo(px + s * 0.4, py - s * 1.5, px + s * 1.1, py - s * 1.2, px + s, py);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.arc(px - s * 0.25, py - s * 0.95, s * 0.22, 0, U.TAU);
          ctx.fill();
        } else if (kind === 1) {
          // wrapped sweet
          const s = 12 + U.hash(x * 3.7) * 5;
          ctx.fillStyle = '#FFE1A4';
          ctx.beginPath();
          ctx.moveTo(px - s * 1.8, py - s);
          ctx.lineTo(px - s, py);
          ctx.lineTo(px - s * 1.8, py + s);
          ctx.closePath();
          ctx.moveTo(px + s * 1.8, py - s);
          ctx.lineTo(px + s, py);
          ctx.lineTo(px + s * 1.8, py + s);
          ctx.closePath();
          ctx.fill();
          const g = ctx.createLinearGradient(0, py - s, 0, py + s);
          g.addColorStop(0, '#FFF4E4');
          g.addColorStop(1, ['#FFB7CC', '#B1E7D5', '#D7BDF2'][Math.floor(U.hash(x * 5.1) * 3)]);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(px, py - s, s, s * 1.15, 0, 0, U.TAU);
          ctx.fill();
          ctx.strokeStyle = '#FFF8EC';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - s * 0.6, py - s * 1.6);
          ctx.quadraticCurveTo(px, py - s, px + s * 0.6, py - s * 1.6);
          ctx.stroke();
        } else {
          // candy flower
          const s = 8 + U.hash(x * 4.4) * 5;
          ctx.fillStyle = ['#FFB7CC', '#C7ACEE', '#FFE29C'][Math.floor(U.hash(x * 6.6) * 3)];
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * U.TAU;
            ctx.beginPath();
            ctx.arc(px + Math.cos(a) * s * 0.55, py - s * 1.2 + Math.sin(a) * s * 0.55, s * 0.45, 0, U.TAU);
            ctx.fill();
          }
          ctx.fillStyle = '#FFF4B8';
          ctx.beginPath();
          ctx.arc(px, py - s * 1.2, s * 0.3, 0, U.TAU);
          ctx.fill();
        }
      }

      // colorful sprinkles on top of the frosting
      for (let x = Math.floor(x0 / 26) * 26; x < x1; x += 26) {
        if (U.hash(x * 0.37) > 0.5) continue;
        const px = x - camX + U.hash(x * 1.7) * 18;
        const py = this.groundTop(x) + 7 + U.hash(x * 2.9) * 12;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(U.hash(x * 4.1) * Math.PI);
        const cols = ['#FF8FAE', '#7BCBB0', '#D3A9F1', '#FFCB77', '#87B7E8'];
        ctx.fillStyle = cols[Math.floor(U.hash(x * 8.8) * cols.length)];
        U.roundRectPath(ctx, -4.5, -1.4, 9, 2.8, 1.4);
        ctx.fill();
        ctx.restore();
      }

      // little candy pebbles / flowers along the verge
      for (let x = Math.floor(x0 / 130) * 130; x < x1; x += 130) {
        if (U.hash(x * 0.71) > 0.62) continue;
        const px = x - camX + 40;
        const py = this.groundTop(x) + 2;
        const col = ['#FFEBA0', '#FFB8CC', '#B9EBD8'][Math.floor(U.hash(x * 2.2) * 3)];
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py - 6, 6, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(px - 2, py - 8, 2, 0, U.TAU);
        ctx.fill();
      }

    }
  }

  _drawPitEdge(ctx, sx, gy, side, t) {
    ctx.save();
    ctx.translate(sx, gy);
    // icing lip
    ctx.fillStyle = '#FFF6E8';
    U.roundRectPath(ctx, -14, -8, 28, 38, 12);
    ctx.fill();
    ctx.fillStyle = '#FFE3D3';
    ctx.beginPath();
    ctx.arc(0, 30, 15, 0, Math.PI);
    ctx.fill();
    // wafer cliff face
    const g = ctx.createLinearGradient(0, 20, 0, 150);
    g.addColorStop(0, '#F6DAB5');
    g.addColorStop(1, '#E6B98C');
    ctx.fillStyle = g;
    U.roundRectPath(ctx, -11, 22, 22, 128, [0, 0, 9, 9]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(191,134,90,0.28)';
    ctx.lineWidth = 1.4;
    for (let y = 42; y < 140; y += 20) {
      ctx.beginPath();
      ctx.moveTo(-11, y);
      ctx.lineTo(11, y - 5);
      ctx.stroke();
    }
    // icing drips on top
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#FFF3E2';
      ctx.beginPath();
      ctx.ellipse(-7 + i * 7, 25 + (i % 2) * 4, 3.5, 8 + (i % 2) * 4, 0, 0, Math.PI);
      ctx.fill();
    }
    // candy cane post
    ctx.save();
    ctx.translate(side * 15, -2);
    ctx.strokeStyle = '#FFF8EC';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -62);
    ctx.stroke();
    ctx.strokeStyle = '#FF9FBA';
    ctx.lineWidth = 7;
    ctx.setLineDash([7, 9]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -62);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#FFC2D5';
    ctx.beginPath();
    ctx.arc(0, -67, 8, 0, U.TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(-2.5, -70, 2.8, 0, U.TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  drawPitSigns(ctx, camX, t) {
    for (let i = 0; i < this.pits.length; i++) {
      const p = this.pits[i];
      const x = p.x - camX;
      const right = p.x + p.w - camX;
      if (x < -260 && right < -260) continue;
      if (x > U.W + 260 && right > U.W + 260) continue;
      this._drawPitEdge(ctx, x, this.groundTop(p.x), -1, t);
      this._drawPitEdge(ctx, right, this.groundTop(p.x + p.w), 1, t);
      if (x < -220 || x > U.W + 200) continue;
      const gy = this.groundTop(p.x);
      ctx.save();
      ctx.translate(x + 4, gy);
      // post
      ctx.fillStyle = '#F1D9C4';
      U.roundRectPath(ctx, -4, -94, 8, 94, 4);
      ctx.fill();
      // board
      ctx.save();
      ctx.translate(-44, -104);
      ctx.rotate(-0.04 + Math.sin(t * 1.4 + i) * 0.015);
      ctx.fillStyle = '#FFF7E9';
      U.roundRectPath(ctx, -48, -20, 96, 40, 12);
      ctx.fill();
      ctx.strokeStyle = '#FFC4D6';
      ctx.lineWidth = 3;
      ctx.stroke();
      U.text(ctx, '果冻河', 0, 1, { size: 19, family: U.FONT_DISPLAY, color: '#E487A6', align: 'center', weight: 400 });
      ctx.restore();
      ctx.restore();
    }
  }

  /* =========================================================
     gameplay objects
     ========================================================= */

  drawPlatforms(ctx, camX, t) {
    for (const p of this.platforms) {
      const x = p.x - camX;
      if (x > U.W + 100 || x + p.w < -100) continue;
      const bob = Math.sin(t * 1.2 + p.phase) * 1.5;
      ctx.save();
      ctx.translate(x, p.y + bob);

      // soft floating shadow
      ctx.fillStyle = 'rgba(139,75,96,0.13)';
      ctx.beginPath();
      ctx.ellipse(p.w / 2, 72, p.w * 0.4, 9, 0, 0, U.TAU);
      ctx.fill();

      if (p.type === 'macaron') {
        // bottom shell
        const bg = ctx.createLinearGradient(0, 30, 0, 56);
        bg.addColorStop(0, U.shade(p.color, 0.06));
        bg.addColorStop(1, U.shade(p.color, -0.14));
        ctx.fillStyle = bg;
        U.roundRectPath(ctx, 0, 30, p.w, 26, 13);
        ctx.fill();
        ctx.strokeStyle = U.rgba(U.shade(p.color, -0.3), 0.35);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // ruffled cream filling
        ctx.fillStyle = '#FFF4DE';
        ctx.beginPath();
        for (let i = 0; i <= p.scallops; i++) {
          const sx = (p.w * i) / p.scallops;
          ctx.arc(sx, 27, 12, 0, Math.PI);
        }
        ctx.rect(0, 22, p.w, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(225,186,157,0.32)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // top shell
        const g = ctx.createLinearGradient(0, -2, 0, 30);
        g.addColorStop(0, U.shade(p.color, 0.36));
        g.addColorStop(0.6, p.color);
        g.addColorStop(1, U.shade(p.color, -0.08));
        ctx.fillStyle = g;
        U.roundRectPath(ctx, 0, 0, p.w, 26, 13);
        ctx.fill();
        ctx.strokeStyle = U.rgba(U.shade(p.color, -0.28), 0.4);
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        U.roundRectPath(ctx, 16, 5, p.w * 0.4, 5, 2.5);
        ctx.fill();
        // sugar pearls
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.7)' : 'rgba(255,238,176,0.8)';
          ctx.beginPath();
          ctx.arc(22 + U.hash(i * 3 + p.x) * (p.w - 44), 12 + U.hash(i * 5) * 6, 2.2, 0, U.TAU);
          ctx.fill();
        }
        // tiny flag on the right edge
        ctx.strokeStyle = 'rgba(255,249,236,0.9)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p.w - 22, 2);
        ctx.lineTo(p.w - 22, -26);
        ctx.stroke();
        ctx.fillStyle = '#FFF0B3';
        ctx.beginPath();
        ctx.moveTo(p.w - 22, -26);
        ctx.lineTo(p.w - 2, -20);
        ctx.lineTo(p.w - 22, -12);
        ctx.closePath();
        ctx.fill();
      } else {
        // wafer sandwich
        const g = ctx.createLinearGradient(0, 0, 0, 40);
        g.addColorStop(0, '#FFF3E0');
        g.addColorStop(0.5, '#F9DDBB');
        g.addColorStop(1, '#F0C79E');
        ctx.fillStyle = g;
        U.roundRectPath(ctx, 0, 0, p.w, 38, 11);
        ctx.fill();
        ctx.strokeStyle = 'rgba(209,151,117,0.4)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        // wafer grid
        ctx.strokeStyle = 'rgba(209,151,117,0.22)';
        ctx.lineWidth = 1.3;
        for (let i = 16; i < p.w - 8; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 5);
          ctx.lineTo(i, 34);
          ctx.stroke();
        }
        for (let y = 10; y < 34; y += 9) {
          ctx.beginPath();
          ctx.moveTo(4, y);
          ctx.lineTo(p.w - 4, y);
          ctx.stroke();
        }
        // cream stripe
        ctx.fillStyle = '#FFF4E2';
        U.roundRectPath(ctx, 0, 15, p.w, 7, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        U.roundRectPath(ctx, 8, 17, p.w * 0.45, 2.5, 1.2);
        ctx.fill();
        // candy buttons
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = ['#FF9EBE', '#8FDCC2', '#CDABEF'][i % 3];
          ctx.beginPath();
          ctx.arc(24 + i * (p.w - 48) / 3, 1, 4, 0, U.TAU);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.arc(22.6 + i * (p.w - 48) / 3, -0.4, 1.4, 0, U.TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  drawObstacles(ctx, camX, t) {
    for (const o of this.obstacles) {
      const x = o.x - camX;
      if (x > U.W + 100 || x + o.w < -100) continue;
      ctx.save();
      ctx.translate(x + o.w / 2, o.y + o.h);
      ctx.rotate(o.lean);
      ctx.fillStyle = 'rgba(147,83,107,0.13)';
      ctx.beginPath();
      ctx.ellipse(0, 4, o.w * 0.55, 9, 0, 0, U.TAU);
      ctx.fill();

      if (o.type === 'gumdrop') {
        const g = ctx.createLinearGradient(0, -o.h, 0, 0);
        g.addColorStop(0, U.shade(o.color, 0.38));
        g.addColorStop(0.65, o.color);
        g.addColorStop(1, U.shade(o.color, -0.1));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-o.w / 2, 0);
        ctx.bezierCurveTo(-o.w / 2, -o.h * 0.6, -o.w * 0.16, -o.h, 0, -o.h);
        ctx.bezierCurveTo(o.w * 0.16, -o.h, o.w / 2, -o.h * 0.6, o.w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.26)';
        ctx.beginPath();
        ctx.ellipse(-o.w * 0.16, -o.h * 0.7, o.w * 0.12, o.h * 0.1, -0.5, 0, U.TAU);
        ctx.fill();
      } else {
        // stacked marshmallows
        const puff = (py, pw, ph, tint) => {
          const g = ctx.createLinearGradient(0, py - ph, 0, py);
          g.addColorStop(0, U.shade(tint, 0.5));
          g.addColorStop(1, tint);
          ctx.fillStyle = g;
          U.roundRectPath(ctx, -pw / 2, py - ph, pw, ph, ph / 2);
          ctx.fill();
        };
        puff(0, o.w, o.h * 0.5, o.color);
        puff(-o.h * 0.34, o.w * 0.78, o.h * 0.55, U.shade(o.color, 0.2));
        puff(-o.h * 0.62, o.w * 0.55, o.h * 0.5, U.shade(o.color, 0.35));
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(-o.w * 0.15, -o.h * 0.52, o.w * 0.14, o.h * 0.06, -0.2, 0, U.TAU);
        ctx.fill();
      }

      // sugar crystals
      for (let i = 0; i < o.crystals; i++) {
        const px = (U.hash(i * 3.7 + o.x) - 0.5) * o.w * 0.72;
        const py = -o.h * (0.25 + U.hash(i * 5.1 + o.x) * 0.6);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(px, py, 1.2 + U.hash(i) * 1.8, 0, U.TAU);
        ctx.fill();
      }
      // leaf
      ctx.fillStyle = '#A9E3C7';
      ctx.beginPath();
      ctx.ellipse(o.w * 0.1, -o.h * 0.98, 9, 5, -0.5, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawProps(ctx, camX, t) {
    for (const p of this.props) {
      if (!p.active) continue;
      const x = p.x - camX;
      if (x < -120 || x > U.W + 120) continue;
      const bob = p.type === 'spring' ? 0 : Math.sin(t * 1.6 + p.phase) * 7;
      const y = p.y + bob;
      ctx.save();
      ctx.translate(x, y);

      // halo
      const halo = ctx.createRadialGradient(0, -30, 4, 0, -30, 70);
      halo.addColorStop(0, 'rgba(255,255,255,0.55)');
      halo.addColorStop(0.5, 'rgba(255,226,238,0.25)');
      halo.addColorStop(1, 'rgba(255,226,238,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, -30, 70, 0, U.TAU);
      ctx.fill();

      if (p.type === 'spring') {
        // ground pad
        ctx.fillStyle = 'rgba(147,83,107,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 42, 8, 0, 0, U.TAU);
        ctx.fill();
        ctx.strokeStyle = '#FFB6CA';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(0, -12 - i * 11, 25 - i * 4, 9, 0, 0, U.TAU);
          ctx.stroke();
        }
        ctx.fillStyle = '#FFF7EA';
        U.roundRectPath(ctx, -30, -8, 60, 12, 6);
        ctx.fill();
        // strawberry gumdrop top
        const g = ctx.createLinearGradient(0, -62, 0, -24);
        g.addColorStop(0, '#FFD3E0');
        g.addColorStop(1, '#FF9CB9');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-22, -26);
        ctx.bezierCurveTo(-24, -52, -8, -64, 0, -64);
        ctx.bezierCurveTo(8, -64, 24, -52, 22, -26);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(-7, -50, 5, 3, -0.5, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = '#A9E3C7';
        ctx.beginPath();
        ctx.ellipse(2, -65, 8, 4, -0.3, 0, U.TAU);
        ctx.fill();
        // little sparkle
        U.drawSparkle(ctx, 28, -48, 5, '#FFF7D4', t * 0.5, 0.8);
      } else if (p.type === 'magnet') {
        // jelly star
        ctx.save();
        ctx.rotate(Math.sin(t * 1.2 + p.phase) * 0.08);
        const g = ctx.createRadialGradient(-8, -44, 4, 0, -34, 44);
        g.addColorStop(0, '#F1DFFF');
        g.addColorStop(0.6, '#C9A6F0');
        g.addColorStop(1, '#9C6FD1');
        ctx.fillStyle = g;
        U.drawStar(ctx, 0, -36, 32, 0.48);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        U.drawSparkle(ctx, -9, -45, 6, 'rgba(255,255,255,0.8)', 0.3, 0.9);
        // orbit
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, -36, 46, 14, Math.sin(t) * 0.4, 0, U.TAU);
        ctx.stroke();
        ctx.restore();
        U.drawNote(ctx, 26, -76, 15, Math.sin(t * 2) * 0.2, '#FFF7EC', 0.85);
      } else if (p.type === 'balloon') {
        // balloon
        const g = ctx.createRadialGradient(-10, -70, 3, 0, -56, 36);
        g.addColorStop(0, '#FFEFF4');
        g.addColorStop(0.55, '#FFC1D6');
        g.addColorStop(1, '#EF8FB0');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, -58, 30, 36, 0, 0, U.TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.ellipse(-10, -70, 8, 12, -0.35, 0, U.TAU);
        ctx.fill();
        // little cloud basket
        ctx.strokeStyle = 'rgba(255,247,235,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-14, -26);
        ctx.lineTo(-9, -10);
        ctx.moveTo(14, -26);
        ctx.lineTo(9, -10);
        ctx.stroke();
        ctx.fillStyle = '#FFF8ED';
        U.roundRectPath(ctx, -20, -12, 40, 18, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,220,235,0.7)';
        ctx.beginPath();
        ctx.arc(-8, -4, 3, 0, U.TAU);
        ctx.arc(2, -2, 2.4, 0, U.TAU);
        ctx.fill();
        U.drawSparkle(ctx, 26, -84, 6, '#FFF6D8', t * 0.4, 0.8);
      } else if (p.type === 'bonus') {
        // lollipop
        ctx.fillStyle = '#F4DCC6';
        U.roundRectPath(ctx, -4, -46, 8, 48, 4);
        ctx.fill();
        const g = ctx.createRadialGradient(-8, -66, 4, 0, -60, 36);
        g.addColorStop(0, '#FFF6D9');
        g.addColorStop(0.6, '#FFD483');
        g.addColorStop(1, '#F0A64E');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, -60, 27, 0, U.TAU);
        ctx.fill();
        ctx.strokeStyle = '#FFF8EC';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 3; a += 0.2) {
          const rr = (a / (Math.PI * 3)) * 21;
          const px = Math.cos(a + t * 0.4) * rr;
          const py = -60 + Math.sin(a + t * 0.4) * rr;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        U.drawSparkle(ctx, 26, -80, 7, '#FFF7CF', t * 0.5, 0.9);
      }
      ctx.restore();
    }
  }

  drawNoteSprite(ctx, note, camX, t, magnet = false) {
    const x = note.x - camX;
    if (x < -80 || x > U.W + 80) return;
    const bob = Math.sin(t * 2.4 + (note.phase || 0)) * 6;
    const y = note.y + bob;
    const star = note.kind === 'star';
    const scale = note.pop ? note.pop : 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // halo
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, star ? 46 : 34);
    if (star) {
      halo.addColorStop(0, 'rgba(255,244,178,0.9)');
      halo.addColorStop(0.4, 'rgba(255,209,118,0.34)');
      halo.addColorStop(1, 'rgba(255,209,118,0)');
    } else {
      halo.addColorStop(0, 'rgba(255,255,255,0.85)');
      halo.addColorStop(0.4, 'rgba(255,160,190,0.38)');
      halo.addColorStop(1, 'rgba(255,160,190,0)');
    }
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, star ? 46 : 34, 0, U.TAU);
    ctx.fill();

    if (magnet) {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 23 + Math.sin(t * 4 + note.phase) * 3, 0, U.TAU);
      ctx.stroke();
    }

    if (star) {
      ctx.save();
      ctx.rotate(t * 0.9 + (note.phase || 0));
      // silhouette outline
      ctx.fillStyle = 'rgba(205,128,42,0.38)';
      U.drawStar(ctx, 0, 0, 26, 0.48, 5, -Math.PI / 2);
      ctx.fill();
      const g = ctx.createRadialGradient(-7, -8, 2, 0, 0, 25);
      g.addColorStop(0, '#FFFBE0');
      g.addColorStop(0.45, '#FFDD8E');
      g.addColorStop(0.85, '#F7B85C');
      g.addColorStop(1, '#E9973E');
      ctx.fillStyle = g;
      U.drawStar(ctx, 0, 0, 23, 0.48, 5, -Math.PI / 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,253,243,0.95)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // inner tiny star
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      U.drawStar(ctx, 0, 0, 8, 0.44, 5, -Math.PI / 2);
      ctx.fill();
      ctx.restore();
      U.drawSparkle(ctx, 15, -16, 5, '#FFFFFF', 0.5, 0.95);
      U.drawSparkle(ctx, -15, 10, 3, '#FFF6D6', t * 0.4, 0.7);
    } else {
      ctx.save();
      ctx.rotate(-0.15 + Math.sin(t * 2 + (note.phase || 0)) * 0.1);
      // soft dark silhouette makes the notes pop against candy-pink skies
      ctx.save();
      ctx.scale(1.12, 1.12);
      U.drawNote(ctx, 0, 0, 34, 0, 'rgba(186,73,108,0.30)', 1);
      ctx.restore();
      const g = ctx.createLinearGradient(-12, -18, 14, 20);
      g.addColorStop(0, '#FFFDF6');
      g.addColorStop(0.42, '#FFD0DF');
      g.addColorStop(0.78, '#FF9EBE');
      g.addColorStop(1, '#EF7C9F');
      ctx.fillStyle = g;
      U.drawNote(ctx, 0, 0, 34, 0, g, 1);
      // head shine
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(-6, 9, 4.2, 2.6, -0.45, 0, U.TAU);
      ctx.fill();
      ctx.restore();
      U.drawSparkle(ctx, 15, -16, 5, '#FFFFFF', t * 0.3, 0.95);
    }

    // tiny landing ring
    ctx.strokeStyle = star ? 'rgba(255,220,150,0.55)' : 'rgba(255,168,195,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, star ? 30 : 25, star ? 17 : 14, 5, 0, 0, U.TAU);
    ctx.stroke();

    ctx.restore();
  }

  drawFixedNotes(ctx, camX, t, magnet) {
    for (const n of this.fixedNotes) {
      if (n.taken) continue;
      n.y = n.baseY;
      this.drawNoteSprite(ctx, n, camX, t, magnet);
    }
  }

  drawFinishGate(ctx, camX, gateX, t, open) {
    const x = gateX - camX;
    if (x < -320 || x > U.W + 320) return;
    const gy = this.groundY;
    ctx.save();
    ctx.translate(x, gy);

    // glow
    const glow = ctx.createRadialGradient(0, -170, 10, 0, -170, 260);
    glow.addColorStop(0, 'rgba(255,246,206,0.5)');
    glow.addColorStop(1, 'rgba(255,246,206,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -170, 260, 0, U.TAU);
    ctx.fill();

    const pillar = (px) => {
      ctx.save();
      ctx.translate(px, 0);
      const g = ctx.createLinearGradient(-26, 0, 26, 0);
      g.addColorStop(0, '#FFF6E8');
      g.addColorStop(0.5, '#FFE6D4');
      g.addColorStop(1, '#F8D2C0');
      ctx.fillStyle = g;
      U.roundRectPath(ctx, -25, -270, 50, 270, 24);
      ctx.fill();
      ctx.save();
      U.roundRectPath(ctx, -25, -270, 50, 270, 24);
      ctx.clip();
      ctx.strokeStyle = '#FFAFC6';
      ctx.lineWidth = 15;
      for (let y = -300; y < 20; y += 48) {
        ctx.beginPath();
        ctx.moveTo(-40, y);
        ctx.lineTo(40, y + 34);
        ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = '#FFF8EC';
      U.roundRectPath(ctx, -33, -282, 66, 30, 14);
      ctx.fill();
      ctx.fillStyle = '#A9E4CF';
      ctx.beginPath();
      ctx.arc(0, -288, 12, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    };
    pillar(-138);
    pillar(138);

    // arch
    ctx.strokeStyle = '#FFF4E6';
    ctx.lineWidth = 44;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-145, -262);
    ctx.quadraticCurveTo(0, -400, 145, -262);
    ctx.stroke();
    ctx.strokeStyle = '#FFB3C8';
    ctx.lineWidth = 44;
    ctx.setLineDash([30, 34]);
    ctx.beginPath();
    ctx.moveTo(-145, -262);
    ctx.quadraticCurveTo(0, -400, 145, -262);
    ctx.stroke();
    ctx.setLineDash([]);

    // icing banner
    const bannerY = -315;
    ctx.fillStyle = '#FFF9EE';
    ctx.beginPath();
    ctx.moveTo(-116, bannerY - 30);
    ctx.quadraticCurveTo(0, bannerY - 48, 116, bannerY - 30);
    ctx.lineTo(108, bannerY + 26);
    ctx.quadraticCurveTo(0, bannerY + 44, -108, bannerY + 26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFC5D7';
    ctx.lineWidth = 3;
    ctx.stroke();
    U.text(ctx, '第一关 · 甜糖丘陵', 0, bannerY, {
      size: 27, family: U.FONT_DISPLAY, color: '#E27D9D', align: 'center',
    });
    U.text(ctx, 'SWEET SUGAR HILLS', 0, bannerY + 22, {
      size: 11, family: U.FONT_ROUND, color: '#D5A6B6', align: 'center', letterSpacing: 2,
    });

    // little flags & sparkles
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.15 + i * 0.175);
      const fx = Math.cos(a) * 190;
      const fy = -280 + Math.sin(a) * -70;
      U.drawStar(ctx, fx, fy, 6, 0.45, 5, t * 0.2 + i);
      ctx.fillStyle = ['#FFD0E0', '#FFF0B3', '#BCEBD8'][i % 3];
      ctx.fill();
    }

    if (open) {
      // two ribbon streamers swinging open from the banner
      ctx.save();
      const sway = Math.sin(t * 2.2) * 8;
      for (const side of [-1, 1]) {
        const bx = side * 112;
        ctx.strokeStyle = '#FF9FB9';
        ctx.lineWidth = 11;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, -292);
        ctx.bezierCurveTo(bx + side * 26, -262 + sway, bx + side * 8, -226, bx + side * 20, -192 + sway);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,249,238,0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx, -292);
        ctx.bezierCurveTo(bx + side * 26, -262 + sway, bx + side * 8, -226, bx + side * 20, -192 + sway);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}
