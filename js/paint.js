/*
 * Moteur de peinture générative.
 * Produit des « toiles » au pinceau, déterministes à partir d'une graine,
 * utilisées comme visuels provisoires en attendant les photos des œuvres.
 * Coordonnées : x ∈ [0, 1], y ∈ [0, aspect], exprimées en largeur de toile.
 */
(function () {
  'use strict';

  const PIG = {
    prussian: '#13294B', ultramarine: '#2B3F9E', cadmium: '#F0B323',
    alizarin: '#A8243A', ochre: '#C68A3A', umber: '#5A3A28',
    viridian: '#1F6E5C', sienna: '#8E4A2B', white: '#F4F3EE',
    rose: '#D98C8C', paper: '#E4E0D5', charcoal: '#222326'
  };

  // Tons de peau : lumière, demi-teinte, ombre
  const SKINS = [
    ['#E3AE80', '#A86A40', '#5A3320'],
    ['#CC8A57', '#8A4E2C', '#3E2316'],
    ['#A56C45', '#6A3F26', '#2B170E'],
    ['#82513A', '#4E2D1B', '#1C0F09']
  ];
  const BGS = [
    [PIG.prussian, PIG.ultramarine], [PIG.ochre, PIG.cadmium],
    [PIG.viridian, PIG.prussian], [PIG.alizarin, PIG.umber],
    ['#C9C4B6', '#A9A393'], [PIG.cadmium, PIG.ochre], [PIG.ultramarine, PIG.viridian]
  ];
  const CLOTH = [PIG.white, PIG.alizarin, PIG.prussian, PIG.cadmium, PIG.viridian, '#1D1C1F', PIG.ultramarine];
  const ACCENTS = [PIG.cadmium, PIG.alizarin, PIG.white, PIG.ultramarine, PIG.rose];

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function stroke(r, x, y, a, l, w, c, al) {
    const n = 4 + ((r() * 4) | 0);
    const br = [];
    for (let i = 0; i < n; i++) {
      br.push({ o: (i / (n - 1) - 0.5) + (r() - 0.5) * 0.2, a: 0.35 + r() * 0.65, w: 0.25 + r() * 0.5 });
    }
    return { x, y, a, l, w, c, al, cv: (r() - 0.5) * 0.3, br };
  }

  function generate(seed, kind, A) {
    const r = rng(seed);
    const pick = arr => arr[(r() * arr.length) | 0];
    const S = [];
    const etude = kind === 'etude';
    const bg = etude ? [PIG.paper, '#D4CFC2'] : pick(BGS);
    const baseA = r() * Math.PI;

    // Sous-couche : grands aplats
    for (let i = 0; i < 240; i++) {
      S.push(stroke(r, r(), r() * A, baseA + (r() - 0.5) * 0.9, 0.15 + r() * 0.25,
        0.05 + r() * 0.06, mix(bg[0], bg[1], r()), 0.55 + r() * 0.4));
    }
    // Texture de fond
    for (let i = 0; i < 200; i++) {
      S.push(stroke(r, r(), r() * A, baseA + (r() - 0.5) * 2, 0.04 + r() * 0.08,
        0.012 + r() * 0.02, mix(mix(bg[0], bg[1], r()), r() < 0.5 ? PIG.white : '#000000', r() * 0.18), 0.4 + r() * 0.4));
    }

    if (kind === 'portrait' || etude) {
      const skin = etude ? ['#8C8B87', '#4D4C4A', PIG.charcoal] : pick(SKINS);
      const cloth = etude ? '#5E5D59' : pick(CLOTH);
      const hairC = etude ? PIG.charcoal : (r() < 0.8 ? '#1A120D' : PIG.umber);
      const cx = 0.5 + (r() - 0.5) * 0.12;
      const cy = A * 0.36 + (r() - 0.5) * 0.04;
      const rx = 0.15 + r() * 0.03;
      const ry = rx * 1.3;
      const light = r() < 0.5 ? -1 : 1;
      const afro = r() < 0.45;
      const shoulderY = cy + ry + 0.06;
      const halfW = y => rx * 0.55 + Math.min(0.34, (y - shoulderY) * 3.2);
      const inHead = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;
      const inNeck = (x, y) => y > cy + ry * 0.55 && y < shoulderY + 0.05 && Math.abs(x - cx) < rx * 0.48;
      const inBody = (x, y) => y > shoulderY && y < A && Math.abs(x - cx) < halfW(y);
      const sample = (test, x0, x1, y0, y1) => {
        for (let k = 0; k < 60; k++) {
          const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
          if (test(x, y)) return [x, y];
        }
        return null;
      };
      const shade = (v) => v < -0.25 ? mix(skin[0], skin[1], r() * 0.4)
        : v < 0.25 ? mix(skin[1], r() < 0.5 ? skin[0] : skin[2], r() * 0.35)
        : mix(skin[2], skin[1], r() * 0.4);

      // Vêtement
      for (let i = 0; i < 420; i++) {
        const p = sample(inBody, cx - 0.6, cx + 0.6, shoulderY, A); if (!p) continue;
        const side = (p[0] - cx) * light;
        const c = mix(cloth, side > 0.05 ? '#000000' : PIG.white, 0.1 + r() * 0.25);
        S.push(stroke(r, p[0], p[1], (p[0] < cx ? 0.35 : -0.35) + (r() - 0.5) * 0.7, 0.05 + r() * 0.08, 0.02 + r() * 0.03, c, 0.7 + r() * 0.3));
      }
      // Cou
      for (let i = 0; i < 110; i++) {
        const p = sample(inNeck, cx - rx, cx + rx, cy, shoulderY + 0.06); if (!p) continue;
        const v = ((p[0] - cx) / rx) * light * 0.8 + 0.3 + (r() - 0.5) * 0.4;
        S.push(stroke(r, p[0], p[1], Math.PI / 2 + (r() - 0.5) * 0.5, 0.03 + r() * 0.04, 0.012 + r() * 0.015, shade(v), 0.75 + r() * 0.25));
      }
      // Cheveux derrière
      if (afro) {
        const hx = cx, hy = cy - ry * 0.35, hr = rx * 1.45;
        for (let i = 0; i < 260; i++) {
          const t = r() * Math.PI * 2, d = Math.sqrt(r()) * hr;
          const x = hx + Math.cos(t) * d, y = hy + Math.sin(t) * d * 0.95;
          if (y > cy + ry * 0.2) continue;
          S.push(stroke(r, x, y, t + Math.PI / 2 + (r() - 0.5) * 1.2, 0.02 + r() * 0.04, 0.012 + r() * 0.02, mix(hairC, PIG.umber, r() * 0.3), 0.8 + r() * 0.2));
        }
      }
      // Visage
      for (let i = 0; i < 640; i++) {
        const p = sample(inHead, cx - rx, cx + rx, cy - ry, cy + ry); if (!p) continue;
        const nx = (p[0] - cx) / rx, ny = (p[1] - cy) / ry;
        const t = Math.atan2(ny, nx);
        const v = nx * light * 0.7 + ny * 0.2 + (r() - 0.5) * 0.5;
        S.push(stroke(r, p[0], p[1], t + Math.PI / 2 + (r() - 0.5) * 0.6, 0.025 + r() * 0.04, 0.01 + r() * 0.014, shade(v), 0.75 + r() * 0.25));
      }
      // Cheveux courts / dessus
      if (!afro) {
        for (let i = 0; i < 170; i++) {
          const p = sample((x, y) => ((x - cx) / (rx * 1.06)) ** 2 + ((y - cy) / (ry * 1.04)) ** 2 < 1 && y < cy - ry * 0.45,
            cx - rx * 1.1, cx + rx * 1.1, cy - ry * 1.1, cy); if (!p) continue;
          S.push(stroke(r, p[0], p[1], (r() - 0.5) * 0.9, 0.02 + r() * 0.035, 0.008 + r() * 0.012, mix(hairC, PIG.umber, r() * 0.35), 0.85));
        }
      }
      // Traits du visage, très lâches
      const dark = mix(skin[2], '#000000', 0.45);
      for (const s of [-1, 1]) {
        const ex = cx + s * rx * 0.4, ey = cy - ry * 0.04;
        for (let k = 0; k < 5; k++) S.push(stroke(r, ex + (r() - 0.5) * 0.015, ey + (r() - 0.5) * 0.008, (r() - 0.5) * 0.3, 0.03, 0.006 + r() * 0.004, dark, 0.7));
        for (let k = 0; k < 4; k++) S.push(stroke(r, ex, ey - ry * 0.16 + (r() - 0.5) * 0.008, -s * 0.15 + (r() - 0.5) * 0.2, 0.045, 0.006, mix(hairC, skin[2], 0.3), 0.6));
      }
      for (let k = 0; k < 5; k++) S.push(stroke(r, cx + light * -0.012, cy + ry * 0.15 + k * 0.012, Math.PI / 2, 0.035, 0.008, skin[2], 0.4));
      const lip = etude ? '#3A3936' : mix(skin[2], PIG.alizarin, 0.35);
      for (let k = 0; k < 6; k++) S.push(stroke(r, cx + (r() - 0.5) * 0.02, cy + ry * 0.5 + (r() - 0.5) * 0.012, (r() - 0.5) * 0.2, 0.06, 0.01 + r() * 0.006, lip, 0.75));
      // Rehauts de lumière
      for (let i = 0; i < 30; i++) {
        const p = sample((x, y) => inHead(x, y) && (x - cx) * light < -rx * 0.1, cx - rx, cx + rx, cy - ry, cy + ry * 0.6); if (!p) continue;
        S.push(stroke(r, p[0], p[1], (r() - 0.5) * 2, 0.015 + r() * 0.02, 0.006 + r() * 0.008, mix(skin[0], PIG.white, 0.12 + r() * 0.18), 0.55));
      }
    }

    if (kind === 'abstract') {
      const fields = [pick(ACCENTS), pick(BGS)[0], pick(ACCENTS)];
      for (let f = 0; f < 3; f++) {
        const fx = r(), fy = r() * A, fa = r() * Math.PI;
        for (let i = 0; i < 160; i++) {
          S.push(stroke(r, fx + (r() - 0.5) * 0.5, fy + (r() - 0.5) * 0.5, fa + (r() - 0.5) * 0.5,
            0.08 + r() * 0.2, 0.02 + r() * 0.05, mix(fields[f], PIG.white, r() * 0.25), 0.55 + r() * 0.4));
        }
      }
      // Geste circulaire
      const gx = 0.3 + r() * 0.4, gy = A * (0.3 + r() * 0.4), gr = 0.15 + r() * 0.15, gc = pick(ACCENTS);
      for (let i = 0; i < 70; i++) {
        const t = (i / 70) * Math.PI * 2;
        S.push(stroke(r, gx + Math.cos(t) * gr, gy + Math.sin(t) * gr, t + Math.PI / 2, 0.06, 0.03 + r() * 0.02, gc, 0.85));
      }
    }

    // Gestes d'accent, signature
    const accents = kind === 'abstract' ? 14 : etude ? 3 : 7;
    for (let i = 0; i < accents; i++) {
      const c = etude ? PIG.charcoal : pick(ACCENTS);
      let x = r(), y = r() * A;
      // Sur un portrait, les accents restent en bordure pour ne pas barrer le visage
      if (kind !== 'abstract') x = x < 0.5 ? x * 0.3 : 0.7 + x * 0.3;
      S.push(stroke(r, x, y, r() * Math.PI, 0.08 + r() * 0.18, 0.01 + r() * 0.03, c, 0.6 + r() * 0.35));
    }
    return S;
  }

  function drawStroke(ctx, s, W) {
    const dx = Math.cos(s.a), dy = Math.sin(s.a);
    const nx = -dy, ny = dx;
    const half = (s.l * W) / 2, w = s.w * W;
    const x = s.x * W, y = s.y * W;
    const bend = s.cv * s.l * W;
    ctx.strokeStyle = s.c;
    for (let i = 0; i < s.br.length; i++) {
      const b = s.br[i];
      const ox = nx * b.o * w, oy = ny * b.o * w;
      ctx.globalAlpha = s.al * b.a;
      ctx.lineWidth = Math.max(0.6, b.w * w);
      ctx.beginPath();
      ctx.moveTo(x - dx * half + ox, y - dy * half + oy);
      ctx.quadraticCurveTo(x + nx * bend + ox, y + ny * bend + oy, x + dx * half + ox, y + dy * half + oy);
      ctx.stroke();
    }
  }

  /** Prépare un canvas à la taille de son conteneur (HiDPI). */
  function fit(canvas, aspect, cssWidth) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cssWidth || canvas.clientWidth || canvas.parentElement.clientWidth;
    const W = Math.max(1, Math.round(w * dpr));
    canvas.width = W;
    canvas.height = Math.round(W * aspect);
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    return { ctx, W };
  }

  /** Peint toute la toile d'un coup. */
  function render(canvas, seed, kind, aspect, cssWidth) {
    const { ctx, W } = fit(canvas, aspect, cssWidth);
    const strokes = generate(seed, kind, aspect);
    ctx.fillStyle = strokes[0].c;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < strokes.length; i++) drawStroke(ctx, strokes[i], W);
    ctx.globalAlpha = 1;
  }

  /** Prépare une toile à peindre progressivement (timelapse). */
  function progressive(canvas, seed, kind, aspect) {
    const { ctx, W } = fit(canvas, aspect);
    const strokes = generate(seed, kind, aspect);
    let done = 0;
    return {
      total: strokes.length,
      reset() {
        ctx.globalAlpha = 1;
        ctx.fillStyle = kind === 'etude' ? PIG.paper : '#ECEEEA';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        done = 0;
      },
      to(n) {
        n = Math.min(n, strokes.length);
        for (; done < n; done++) drawStroke(ctx, strokes[done], W);
        ctx.globalAlpha = 1;
      }
    };
  }

  window.Paint = { render, progressive, mix, drawStroke };
})();
