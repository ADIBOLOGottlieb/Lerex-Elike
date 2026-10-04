(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ------------------------------------------------------------------
   * Œuvres
   * Pour utiliser une vraie photo, ajoutez `src: 'images/mon-oeuvre.jpg'`.
   * `aspect` = hauteur / largeur de l'œuvre. `w` = largeur sur 6 colonnes.
   * ------------------------------------------------------------------ */
  const WORKS = [
    { title: 'Awa, le dimanche', cat: 'portrait', medium: 'Huile sur toile', size: '100 × 80 cm', year: 2025, seed: 1203, aspect: 1.25, w: 3 },
    { title: 'Le frère', cat: 'portrait', medium: 'Huile sur toile', size: '60 × 50 cm', year: 2025, seed: 88, aspect: 1.2, w: 3 },
    { title: 'Bruit jaune', cat: 'abstract', medium: 'Acrylique sur toile', size: '90 × 90 cm', year: 2024, seed: 5521, aspect: 1, w: 2 },
    { title: 'Étude pour Kofi', cat: 'etude', medium: 'Fusain sur papier', size: '42 × 30 cm', year: 2025, seed: 3017, aspect: 1.4, w: 2 },
    { title: 'Mère, bleu de Prusse', cat: 'portrait', medium: 'Huile sur lin', size: '120 × 90 cm', year: 2024, seed: 640, aspect: 1.33, w: 2 },
    { title: 'Marché, 7 h', cat: 'abstract', medium: 'Huile sur toile', size: '80 × 120 cm', year: 2023, seed: 9182, aspect: 0.67, w: 4 },
    { title: 'Inconnue du train', cat: 'portrait', medium: 'Huile sur bois', size: '40 × 30 cm', year: 2024, seed: 2750, aspect: 1.33, w: 2 },
    { title: 'Étude de lumière', cat: 'etude', medium: 'Fusain et craie', size: '30 × 30 cm', year: 2024, seed: 4466, aspect: 1, w: 2 },
    { title: 'Ce qui reste', cat: 'abstract', medium: 'Huile et sable', size: '100 × 70 cm', year: 2025, seed: 7704, aspect: 1.43, w: 2 },
    { title: 'Ibrahim au chapeau', cat: 'portrait', medium: 'Huile sur toile', size: '81 × 65 cm', year: 2025, seed: 3391, aspect: 1.25, w: 2 },
    { title: 'Grand-père, de mémoire', cat: 'portrait', medium: 'Huile sur toile', size: '150 × 120 cm', year: 2023, seed: 1057, aspect: 1.25, w: 3 },
    { title: 'Carnet, page 41', cat: 'etude', medium: 'Fusain sur papier', size: '21 × 15 cm', year: 2025, seed: 6620, aspect: 1.4, w: 3 }
  ];
  const CAT_KIND = { portrait: 'portrait', abstract: 'abstract', etude: 'etude' };

  /* ---------------- Menu mobile ---------------- */
  const header = $('.site-header');
  const toggle = $('.menu-toggle');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('is-open', open);
    toggle.textContent = open ? 'Fermer' : 'Menu';
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    header.classList.remove('is-open');
    toggle.textContent = 'Menu';
  }));

  /* ---------------- Hero : toile à peindre ---------------- */
  const hero = $('.hero');
  const heroCanvas = $('.hero__canvas');
  const hctx = heroCanvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let brushColor = '#13294B';

  function sizeHero() {
    const { width, height } = hero.getBoundingClientRect();
    const W = Math.round(width * dpr), H = Math.round(height * dpr);
    if (W === heroCanvas.width && H === heroCanvas.height) return;
    let snapshot = null;
    if (heroCanvas.width && heroCanvas.height) {
      snapshot = document.createElement('canvas');
      snapshot.width = heroCanvas.width; snapshot.height = heroCanvas.height;
      snapshot.getContext('2d').drawImage(heroCanvas, 0, 0);
    }
    heroCanvas.width = W; heroCanvas.height = H;
    hctx.lineCap = 'round';
    hctx.lineJoin = 'round';
    if (snapshot) hctx.drawImage(snapshot, 0, 0, W, H);
  }

  function newBrush(color, size) {
    const bristles = [];
    const n = 16;
    for (let i = 0; i < n; i++) {
      bristles.push({
        o: (i / (n - 1) - 0.5) + (Math.random() - 0.5) * 0.12,
        a: 0.25 + Math.random() * 0.75,
        w: 1.1 + Math.random() * 1.9,
        c: Paint.mix(color, Math.random() < 0.5 ? '#ffffff' : '#000000', Math.random() * 0.14)
      });
    }
    return { bristles, size, load: 1, last: null };
  }

  function brushTo(b, x, y) {
    if (!b.last) { b.last = { x, y }; return; }
    const dx = x - b.last.x, dy = y - b.last.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1.5) return;
    const nx = -dy / dist, ny = dx / dist;
    const w = b.size * dpr * (0.75 + 0.5 * Math.max(0, 1 - dist / (60 * dpr)));
    for (const br of b.bristles) {
      const ox = nx * br.o * w, oy = ny * br.o * w;
      hctx.globalAlpha = br.a * (0.25 + 0.75 * b.load);
      hctx.strokeStyle = br.c;
      hctx.lineWidth = (w / b.bristles.length) * br.w * (0.45 + 0.55 * b.load);
      hctx.beginPath();
      hctx.moveTo(b.last.x + ox, b.last.y + oy);
      hctx.lineTo(x + ox, y + oy);
      hctx.stroke();
    }
    hctx.globalAlpha = 1;
    // La peinture s'épuise au fil du trait, puis on recharge le pinceau
    b.load -= dist / (1600 * dpr);
    if (b.load < 0.05) Object.assign(b, newBrush(brushColor, b.size), { last: { x, y } });
    else b.last = { x, y };
  }

  let userBrush = null;
  function heroPoint(e) {
    const r = heroCanvas.getBoundingClientRect();
    return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr];
  }
  function isOverUi(e) { return !!e.target.closest('.palette, a, button'); }

  hero.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    if (isOverUi(e)) { if (userBrush) userBrush.last = null; return; }
    if (!userBrush) userBrush = newBrush(brushColor, 30);
    const [x, y] = heroPoint(e);
    brushTo(userBrush, x, y);
  });
  hero.addEventListener('pointerleave', () => { if (userBrush) userBrush.last = null; });
  // Sur écran tactile : un toucher pose une touche de peinture
  hero.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || isOverUi(e)) return;
    const [x, y] = heroPoint(e);
    const b = newBrush(brushColor, 34);
    const a = Math.random() * Math.PI;
    const len = 90 * dpr;
    b.last = { x: x - Math.cos(a) * len / 2, y: y - Math.sin(a) * len / 2 };
    for (let i = 1; i <= 12; i++) brushTo(b, b.last.x + Math.cos(a) * len / 12, b.last.y + Math.sin(a) * len / 12);
  });

  // Palette de pigments
  const swatches = $$('.swatch');
  const swatchName = $('.palette__name');
  swatches.forEach(s => s.addEventListener('click', () => {
    swatches.forEach(o => { o.classList.remove('is-active'); o.setAttribute('aria-pressed', 'false'); });
    s.classList.add('is-active');
    s.setAttribute('aria-pressed', 'true');
    brushColor = s.dataset.color;
    swatchName.textContent = s.getAttribute('aria-label');
    userBrush = newBrush(brushColor, 30);
    document.documentElement.style.setProperty('--brush', brushColor);
  }));
  $('.palette__clear').addEventListener('click', () => {
    heroCanvas.classList.add('is-clearing');
    setTimeout(() => {
      hctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
      heroCanvas.classList.remove('is-clearing');
    }, reduced ? 0 : 450);
  });

  // Ouverture : quelques coups de pinceau automatiques
  const OPENING = [
    { c: '#F0B323', s: 70, p: [[-0.05, 0.78], [0.25, 0.55], [0.55, 0.9], [1.05, 0.62]] },
    { c: '#13294B', s: 44, p: [[0.62, -0.05], [0.95, 0.2], [0.6, 0.45], [0.9, 0.7]] },
    { c: '#A8243A', s: 26, p: [[0.08, 0.2], [0.3, 0.05], [0.45, 0.32], [0.7, 0.12]] },
    { c: '#1F6E5C', s: 18, p: [[0.7, 0.95], [0.82, 0.8], [0.95, 0.92], [1.05, 0.78]] }
  ];
  function bez(p, t) {
    const u = 1 - t;
    return [0, 1].map(i => u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i]);
  }
  function openingStrokes() {
    const W = heroCanvas.width, H = heroCanvas.height;
    const run = (stroke, t0, t1) => {
      const b = stroke.brush;
      for (let k = 0; k <= 1; k += 0.004) {
        if (k < t0 || k > t1) continue;
        const [x, y] = bez(stroke.p, k);
        brushTo(b, x * W, y * H);
      }
    };
    const strokes = OPENING.map(o => ({ ...o, brush: Object.assign(newBrush(o.c, o.s), { load: 1 }) }));
    strokes.forEach(s => { s.brush.size = s.s * (W / dpr) / 1400; });
    if (reduced) { strokes.forEach(s => run(s, 0, 1)); return; }
    const dur = 900, gap = 260;
    const start = performance.now();
    const progress = strokes.map(() => 0);
    (function frame(now) {
      let active = false;
      strokes.forEach((s, i) => {
        const t = Math.min(1, Math.max(0, (now - start - i * gap) / dur));
        const eased = 1 - Math.pow(1 - t, 3);
        if (eased > progress[i]) { run(s, progress[i], eased); progress[i] = eased; }
        if (t < 1) active = true;
      });
      if (active) requestAnimationFrame(frame);
    })(start);
  }

  if (!finePointer) $('.palette__hint').textContent = 'Touchez la toile pour peindre';
  sizeHero();
  window.addEventListener('load', () => {
    document.body.classList.add('is-ready');
    openingStrokes();
  });

  /* ---------------- Curseur ---------------- */
  const cursor = $('.cursor');
  const cursorLabel = $('.cursor__label');
  if (finePointer) {
    document.body.classList.add('has-cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      const t = e.target;
      let state = '';
      if (t.closest('[data-cursor="view"]')) state = 'view';
      else if (t.closest('[data-reel]')) state = 'play';
      else if (t.closest('a, button, input, select, textarea, label')) state = 'link';
      else if (t.closest('.hero')) state = 'brush';
      cursor.dataset.state = state;
      cursorLabel.textContent = state === 'view' ? 'Voir' : state === 'play' ? 'Lire' : '';
    });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));
    (function loop() {
      cx += (tx - cx) * (reduced ? 1 : 0.22);
      cy += (ty - cy) * (reduced ? 1 : 0.22);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- Galerie « salon » ---------------- */
  const salon = $('[data-salon]');
  const tiles = WORKS.map((w, i) => {
    const fig = document.createElement('figure');
    fig.className = 'work';
    fig.dataset.cat = w.cat;
    fig.innerHTML = `
      <button class="work__frame" data-cursor="view" style="aspect-ratio: 1 / ${w.aspect}"
        aria-label="Agrandir ${w.title}, ${w.medium.toLowerCase()}, ${w.year}">
        ${w.src ? `<img src="${w.src}" alt="${w.title}" loading="lazy">` : '<canvas aria-hidden="true"></canvas>'}
      </button>
      <figcaption class="work__label">
        <span class="work__title">${w.title}</span>
        <span class="work__meta">${w.medium}, ${w.size}, ${w.year}</span>
      </figcaption>`;
    salon.appendChild(fig);
    w.el = fig;
    w.index = i;
    return fig;
  });

  function columns() {
    const width = salon.clientWidth;
    return width >= 1000 ? 6 : width >= 620 ? 4 : 2;
  }
  function layoutSalon() {
    const cols = columns();
    salon.style.setProperty('--cols', cols);
    const visible = WORKS.filter(w => !w.el.hidden);
    visible.forEach(w => {
      const span = cols === 6 ? w.w : cols === 4 ? Math.min(4, Math.max(2, Math.round(w.w * 4 / 6))) : (w.w >= 3 ? 2 : 1);
      w.el.style.gridColumn = `span ${span}`;
    });
    const rowUnit = 4;
    const gap = parseFloat(getComputedStyle(salon).columnGap) || 24;
    const heights = visible.map(w => w.el.firstElementChild.getBoundingClientRect().height + w.el.lastElementChild.getBoundingClientRect().height);
    visible.forEach((w, i) => {
      w.el.style.gridRowEnd = `span ${Math.ceil((heights[i] + gap * 1.6) / rowUnit)}`;
    });
  }

  const painted = new Set();
  function paintWork(w) {
    const canvas = w.el.querySelector('canvas');
    if (!canvas) return;
    Paint.render(canvas, w.seed, CAT_KIND[w.cat], w.aspect);
    painted.add(w);
  }
  const workObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const w = WORKS.find(x => x.el === en.target);
      if (w && !painted.has(w)) paintWork(w);
      workObserver.unobserve(en.target);
    });
  }, { rootMargin: '300px 0px' });

  layoutSalon();
  tiles.forEach(t => workObserver.observe(t));

  // Peinture fraîche au survol
  const disp = $('#wet feDisplacementMap');
  const turb = $('#wet feTurbulence');
  let wetTarget = 0, wetValue = 0, wetEl = null, wetRaf = 0;
  function wetLoop() {
    wetValue += (wetTarget - wetValue) * 0.12;
    disp.setAttribute('scale', wetValue.toFixed(2));
    turb.setAttribute('baseFrequency', `0.012 ${(0.022 + wetValue * 0.0006).toFixed(4)}`);
    if (Math.abs(wetTarget - wetValue) > 0.05) wetRaf = requestAnimationFrame(wetLoop);
    else {
      wetRaf = 0;
      if (wetTarget === 0 && wetEl) { wetEl.style.filter = ''; wetEl = null; }
      else if (wetTarget > 6) { wetTarget = 6; wetRaf = requestAnimationFrame(wetLoop); }
    }
  }
  if (!reduced && finePointer) {
    $$('.work__frame').forEach(frame => {
      frame.addEventListener('pointerenter', () => {
        if (wetEl && wetEl !== frame) wetEl.style.filter = '';
        wetEl = frame;
        frame.style.filter = 'url(#wet)';
        wetTarget = 22;
        if (!wetRaf) wetRaf = requestAnimationFrame(wetLoop);
      });
      frame.addEventListener('pointerleave', () => {
        wetTarget = 0;
        if (!wetRaf) wetRaf = requestAnimationFrame(wetLoop);
      });
    });
  }

  // Filtres avec transition FLIP
  const filters = $$('.filter');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
    const first = new Map(WORKS.filter(w => !w.el.hidden).map(w => [w, w.el.getBoundingClientRect()]));
    WORKS.forEach(w => { w.el.hidden = !(f === 'all' || w.cat === f); });
    layoutSalon();
    WORKS.forEach(w => {
      if (w.el.hidden) return;
      if (!painted.has(w)) paintWork(w);
      if (reduced) return;
      const last = w.el.getBoundingClientRect();
      const prev = first.get(w);
      if (prev) {
        const dx = prev.left - last.left, dy = prev.top - last.top;
        if (dx || dy) w.el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else {
        w.el.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }],
          { duration: 500, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  }));

  /* ---------------- Visionneuse ---------------- */
  const lb = $('.lightbox');
  const lbFrame = $('.lightbox__frame');
  const lbTitle = $('.lightbox__title');
  const lbMeta = $('.lightbox__meta');
  const lbCount = $('.lightbox__count');
  let lbList = [], lbIndex = 0, lbOrigin = null;

  function frameSize(w) {
    const wide = innerWidth > 900;
    const maxW = wide ? innerWidth * 0.6 : innerWidth - 32;
    const maxH = wide ? innerHeight * 0.84 : innerHeight * 0.66;
    let width = maxW, height = width * w.aspect;
    if (height > maxH) { height = maxH; width = height / w.aspect; }
    return { width: Math.round(width), height: Math.round(height) };
  }
  function fillLightbox(w) {
    const { width, height } = frameSize(w);
    lbFrame.style.width = width + 'px';
    lbFrame.style.height = height + 'px';
    lbFrame.innerHTML = w.src ? `<img src="${w.src}" alt="${w.title}">` : '<canvas aria-hidden="true"></canvas>';
    const c = lbFrame.querySelector('canvas');
    if (c) Paint.render(c, w.seed, CAT_KIND[w.cat], w.aspect, width);
    lbTitle.textContent = w.title;
    lbMeta.textContent = `${w.medium}, ${w.size}, ${w.year}`;
    lbCount.textContent = `${lbIndex + 1} sur ${lbList.length}`;
  }
  function flipFrom(rect, reverse) {
    const to = lbFrame.getBoundingClientRect();
    const sx = rect.width / to.width, sy = rect.height / to.height;
    const dx = rect.left - to.left, dy = rect.top - to.top;
    const from = { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` };
    const end = { transform: 'none' };
    return lbFrame.animate(reverse ? [end, from] : [from, end],
      { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)', fill: reverse ? 'forwards' : 'none' });
  }
  function openLightbox(w) {
    lbList = WORKS.filter(x => !x.el.hidden);
    lbIndex = lbList.indexOf(w);
    lbOrigin = w.el.querySelector('.work__frame');
    fillLightbox(w);
    lb.showModal();
    document.documentElement.classList.add('no-scroll');
    if (!reduced) flipFrom(lbOrigin.getBoundingClientRect(), false);
  }
  function closeLightbox() {
    const done = () => {
      lb.close();
      document.documentElement.classList.remove('no-scroll');
      lbFrame.getAnimations().forEach(a => a.cancel());
    };
    const current = lbList[lbIndex].el.querySelector('.work__frame');
    lbOrigin = current;
    if (reduced) return done();
    lb.classList.add('is-closing');
    flipFrom(current.getBoundingClientRect(), true).finished.then(() => { lb.classList.remove('is-closing'); done(); });
  }
  function step(dir) {
    lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
    if (reduced) return fillLightbox(lbList[lbIndex]);
    lbFrame.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 24}px)` }],
      { duration: 180, easing: 'ease-in' }).finished.then(() => {
      fillLightbox(lbList[lbIndex]);
      lbFrame.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }
  WORKS.forEach(w => w.el.querySelector('.work__frame').addEventListener('click', () => openLightbox(w)));
  $('.lightbox__close').addEventListener('click', closeLightbox);
  $('.lightbox__prev').addEventListener('click', () => step(-1));
  $('.lightbox__next').addEventListener('click', () => step(1));
  lb.addEventListener('cancel', e => { e.preventDefault(); closeLightbox(); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lightbox__stage')) closeLightbox(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  /* ---------------- Atelier : autoportrait ---------------- */
  const staticPaints = $$('[data-paint]');
  const paintStatic = () => staticPaints.forEach(c => Paint.render(c, +c.dataset.seed, c.dataset.kind, +c.dataset.aspect));
  paintStatic();

  /* ---------------- Timelapses ---------------- */
  const DURATION = 5200, HOURS = 6;
  const reels = $$('[data-reel]').map(el => {
    const canvas = el.querySelector('canvas');
    const clock = el.querySelector('.reel__clock');
    const bar = el.querySelector('.reel__bar span');
    const kind = el.dataset.kind;
    const hours = kind === 'etude' ? 1 / 6 : HOURS;
    const r = { el, canvas, kind, seed: +el.dataset.seed, t: 0.72, playing: false, raf: 0, hold: 0 };
    r.setup = () => {
      r.painter = Paint.progressive(canvas, r.seed, kind, 16 / 9);
      r.painter.reset();
      r.painter.to(Math.floor(r.t * r.painter.total));
      r.show();
    };
    r.show = () => {
      const mins = Math.round(r.t * hours * 60);
      clock.textContent = `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}`;
      bar.style.transform = `scaleX(${r.t})`;
    };
    r.tick = (now) => {
      if (!r.playing) return;
      const dt = now - (r.last || now);
      r.last = now;
      if (r.t >= 1) {
        r.hold += dt;
        if (r.hold > 1400) { r.t = 0; r.hold = 0; r.painter.reset(); }
      } else {
        r.t = Math.min(1, r.t + dt / DURATION);
        r.painter.to(Math.floor(r.t * r.painter.total));
      }
      r.show();
      r.raf = requestAnimationFrame(r.tick);
    };
    r.play = () => { if (r.playing || reduced) return; r.playing = true; r.last = 0; r.el.classList.add('is-playing'); r.raf = requestAnimationFrame(r.tick); };
    r.pause = () => { r.playing = false; cancelAnimationFrame(r.raf); r.el.classList.remove('is-playing'); };
    if (reduced) r.t = 1;
    el.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') r.play(); });
    el.addEventListener('pointerleave', r.pause);
    el.addEventListener('focus', r.play);
    el.addEventListener('blur', r.pause);
    return r;
  });
  reels.forEach(r => r.setup());
  // Sur écran tactile, la vidéo visible se lit toute seule
  if (!finePointer && !reduced) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      const r = reels.find(x => x.el === en.target);
      en.isIntersecting ? r.play() : r.pause();
    }), { threshold: 0.6 });
    reels.forEach(r => io.observe(r.el));
  }

  /* ---------------- Redimensionnement ---------------- */
  let lastWidth = innerWidth, resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      sizeHero();
      if (innerWidth === lastWidth) return;
      lastWidth = innerWidth;
      layoutSalon();
      painted.forEach(paintWork);
      paintStatic();
      reels.forEach(r => r.setup());
      if (lb.open) fillLightbox(lbList[lbIndex]);
    }, 150);
  });

  /* ---------------- Formulaire ---------------- */
  const CONTACT_EMAIL = 'lerexelike@gmail.com';
  const form = $('.form');
  const status = $('.form__status');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get('name').trim(), email = data.get('email').trim(), msg = data.get('message').trim();
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    let error = '', field = null;
    if (!name) { error = 'Indiquez votre nom.'; field = 'f-name'; }
    else if (!/^\S+@\S+\.\S+$/.test(email)) { error = 'Indiquez une adresse e-mail valide, par exemple nom@domaine.com.'; field = 'f-email'; }
    else if (!msg) { error = 'Écrivez quelques mots sur votre projet.'; field = 'f-msg'; }
    status.classList.toggle('is-error', !!error);
    if (error) {
      status.textContent = error;
      const el = document.getElementById(field);
      el.setAttribute('aria-invalid', 'true');
      el.focus();
      return;
    }
    const subject = `${data.get('type')} — ${name}`;
    const body = `${msg}\n\n${name}\n${email}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Votre messagerie s\'ouvre avec le message prêt à envoyer.';
  });

  $('[data-year]').textContent = new Date().getFullYear();
})();
