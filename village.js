/* Ellie Math — her village (v2): the home of the app. A living pixel world she walks around in, jobs that run on the
   real fact engine (fishing at the pond, picking apples with Rosa in the orchard), a yard she builds and paints, a bridge
   that gets one plank for every make-10 fact that becomes hers, and a notice board with today's practice. Coins are the
   one kind of money. Dot keeps a "next job" note pinned up so she always knows what to do. See DESIGN-v2.md.
   Jobs follow the v1 honesty rules: only right, unrushed answers pay; "I don't know" is safe and opens help;
   facts are graded with gradeFact exactly like practice. Building has no math in it.
   Drawing: the still world is baked once (with tall things cut out as occluders); everything that moves is drawn each
   frame on top, at the small pixel size, then scaled up crisply through a camera that can pan and zoom. */
'use strict';
(function () {
  const EM = window.EM, px = EM.px, C = px.C;
  const W = 300, H = 210;
  const S = () => EM.S;
  const V = () => { const s = S(); if (!s.village) s.village = { coins: 0, placed: [], open: {}, caught: 0, rounds: 0 }; const v = s.village; if (v.coins === undefined) { v.coins = v.fish || 0; delete v.fish; } if (v.planks === undefined) v.planks = Math.min(8, meadowProgress().have); return v; };
  const esc = EM.esc, PAINTS = Object.keys(px.PAINT);
  const MEADOW_SKILL = 'm10', PLANKS = 8;
  const NAME = () => ((S() && S().name) || '').trim();
  const now = () => performance.now();
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- the village layout (scene pixels, 300 x 210) ----------
  const POND = [64, 152, 56, 40];
  const STREAM = [[186, -6], [189, 24], [196, 46], [214, 58], [250, 62], [306, 60]];
  const segDist = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - ax - t * dx, y - ay - t * dy); };
  const inStream = (x, y) => STREAM.slice(1).some((p, i) => segDist(x, y, STREAM[i], p) <= 5.5);
  const YARD = { x: 146, y: 134, cols: 6, rows: 3 };           // her yard, 16px spots
  const MEADOW = { x: 222, y: 10, cols: 4, rows: 2 };          // across the bridge
  const DOCK = [106, 137, 30, 9];
  const BOARD = [178, 110];                                     // notice board (left post x, base y)
  const PATHS = [[118, 112, 116, 9], [134, 112, 9, 34], [244, 52, 9, 62], [94, 112, 26, 9], [244, 121, 9, 56], [98, 48, 8, 66], [98, 46, 44, 8], [204, 86, 8, 28]];
  const ORCHARD = [14, 44, 80, 62], ROSA = [82, 110];             // Rosa's orchard on the map, and where she stands
  const STALL = [258, 166], PIP = [272, 186];                     // Mr. Pip's pie stall, and where he waits
  const POST = [112, 102], MO = [152, 108];                       // the post office, and Mo by its door
  const BAKERY = [122, 46], BEA = [162, 52];                      // Bea's bakery up the lane, and Bea outside it
  const SHOP = [166, 78], TOM = [202, 84];                        // Tom's workshop (left wall x, base y), and Tom by it
  const inRect = (x, y, [rx, ry, rw, rh]) => x >= rx && x < rx + rw && y >= ry && y < ry + rh;
  const area = id => id === 'meadow' ? MEADOW : YARD;
  const cellAt = (x, y) => { for (const id of ['plot', 'meadow']) { const a = area(id); if (id === 'meadow' && !V().open.meadow) continue; const cx = Math.floor((x - a.x) / 16), cy = Math.floor((y - a.y) / 16); if (cx >= 0 && cy >= 0 && cx < a.cols && cy < a.rows) return { area: id, cx, cy }; } return null; };
  const placedAt = c => V().placed.find(p => p.area === c.area && p.cx === c.cx && p.cy === c.cy);
  // where she can walk: stops joined by paths (she takes the shortest way), plus free walking on grass
  const NODES = { dock: [114, 144], bend: [138, 141], cross: [138, 118], yard: [166, 118], board: [190, 118], home: [244, 118], hill: [248, 98], bridge: [248, 82], orchard: [98, 116], market: [250, 176], post: [130, 116], lane: [102, 52], bakery: [140, 52], workshop: [208, 92] };
  const EDGES = [['dock', 'bend'], ['bend', 'cross'], ['cross', 'yard'], ['yard', 'board'], ['board', 'home'], ['home', 'hill'], ['hill', 'bridge'], ['cross', 'orchard'], ['home', 'market'], ['cross', 'post'], ['orchard', 'lane'], ['lane', 'bakery'], ['board', 'workshop']];
  const CAM_FULL = { x: 0, y: 0, w: W, h: H };
  const camAround = (cx, cy, w) => ({ x: Math.max(0, Math.min(W - w, cx - w / 2)), y: Math.max(0, Math.min(H - w * H / W, cy - w * H / W / 2)), w, h: w * H / W });

  function meadowProgress() { const facts = EM.SK[MEADOW_SKILL].facts; return { have: Math.min(PLANKS, facts.filter(k => EM.isCollected(k)).length), need: PLANKS }; }
  // Planks owed for make-10 facts that are hers; the bridge shows them being laid the next time she sees it.
  function checkUnlocks() { const v = V(), p = meadowProgress(); v.planksOwed = p.have; EM.save(); return p.have >= PLANKS && !v.open.meadow; }

  // ---------- shared screen plumbing ----------
  let $root = null, mode = 'map', B = { item: null, sel: null, moving: null }, F = null, scene = null, loopId = 0, ui = {};
  const coverSize = () => { const vw = window.innerWidth, vh = window.innerHeight, w = Math.max(vw, vh * W / H); return { w, h: w * H / W, left: (vw - w) / 2, top: (vh - w * H / W) / 2 }; };
  const scaleFor = () => Math.max(3, Math.min(6, Math.round(coverSize().w * (window.devicePixelRatio || 1) / W)));
  function fit() { const st = document.getElementById('vstage'); if (!st) return; const c = coverSize(); Object.assign(st.style, { width: c.w + 'px', height: c.h + 'px', left: c.left + 'px', top: c.top + 'px' }); }
  window.addEventListener('resize', fit);
  // the canvas is drawn at the screen's real pixel size
  const bufSize = () => { const st = document.getElementById('vstage'), d = window.devicePixelRatio || 1; return st ? [Math.round(st.clientWidth * d), Math.round(st.clientHeight * d)] : [W, H]; };
  // What the camera shows. At rest it snaps so every scene pixel is a whole number of screen pixels, all the same size:
  // crisp pixel art at any zoom. While it moves, it glides.
  function viewCam(sc, DW, DH) {
    const c = sc.cam; if (sc.camTween) return c;
    const ppx = Math.max(Math.round(DW / c.w), Math.ceil(DW / W), Math.ceil(DH / H)), w = DW / ppx, h = DH / ppx;
    const x = Math.round(Math.max(0, Math.min(W - w, c.x + (c.w - w) / 2)) * ppx) / ppx, y = Math.round(Math.max(0, Math.min(H - h, c.y + (c.h - h) / 2)) * ppx) / ppx;
    return { x, y, w, h };
  }
  // scene point -> stage pixels, through the camera
  const toStage = (x, y) => { const st = document.getElementById('vstage'); if (!st || !scene) return [0, 0]; const cam = scene.view || scene.cam, w = st.clientWidth, h = st.clientHeight; return [(x - cam.x) / cam.w * w, (y - cam.y) / cam.h * h]; };
  const toScene = (e) => { const st = document.getElementById('vstage'), r = st.getBoundingClientRect(), cam = scene.view || scene.cam; return [cam.x + (e.clientX - r.left) / r.width * cam.w, cam.y + (e.clientY - r.top) / r.height * cam.h]; };
  const place = (el, x, y) => { if (!el) return; const [sx, sy] = toStage(x, y); el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
    // a speech bubble opens toward the side of the screen with room (and away from the build tray on the left)
    if (el.id === 'vbubble') { const st = document.getElementById('vstage'), r = st.getBoundingClientRect(), screenX = r.left + sx; el.classList.toggle('flip', screenX < window.innerWidth * (mode === 'build' ? .62 : .45)); } };
  const say = (t, opts = {}) => {
    const b = document.getElementById('vbubble'); if (!b) return;
    b.innerHTML = `<span>${esc(t)}</span>`; b.classList.add('on'); clearTimeout(ui.bubbleT);
    if (!opts.stay) ui.bubbleT = setTimeout(() => b.classList.remove('on'), opts.ms || Math.max(2600, t.length * 70));
    if (opts.voice !== false && EM.speech) EM.speech.say(t);
  };
  const look = () => px.herLook();
  let coinSrc = null;
  const COIN = () => `<img class="vcoin" alt="coins" src="${coinSrc || (coinSrc = (() => { const c = document.createElement('canvas'); c.width = 8; c.height = 8; px.kit(c.getContext('2d')).sprite(0, 0, ['..oooo..', '.oyyyyo.', 'oyYYyyyo', 'oyYyyyyd', 'oyyyyyyd', 'oyyyyydd', '.oyyydd.', '..oooo..'], { o: '#8c5a28', y: '#f2c94c', Y: '#fff0a0', d: '#c08636' }); return c.toDataURL(); })())}">`;
  function showCoins() { const el = document.getElementById('vcoins'); if (!el) return; const b = el.querySelector('b'), n = String(V().coins); if (b && b.textContent !== n) { b.textContent = n; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } }
  const sfx = n => { try { EM.sfx && EM.sfx[n] && EM.sfx[n](); } catch (e) {} };

  // ---------- the living scene: baked still layer + things that move ----------
  // D: pixel density. Everything is laid out in W x H scene pixels; a close-up with fine painted art (D 5) keeps its
  // canvases D times larger, drawn through a D-scaled transform, so code-drawn things keep their size and art
  // (drawn with put) keeps every fine pixel
  function makeScene(kind, buildStill, D = 1) {
    const sc = { kind, S: scaleFor(), cam: { ...CAM_FULL }, camTween: null, particles: [], dyn: [], t0: now() };
    const base = document.createElement('canvas'); sc.base = base; sc.frame = document.createElement('canvas'); sc.buildStill = buildStill;
    const scaled = c => { const g = c.getContext('2d'); g.setTransform(sc.D, 0, 0, sc.D, 0, 0); g.imageSmoothingEnabled = false; return g; };
    sc.rebake = () => { const g = scaled(base); g.clearRect(0, 0, W, H); const k = px.kit(g); sc.waterPts = sc.buildStill(g, k); sc.sprites = k.bake(W, H, sc.D); };
    sc.setDensity = d => { sc.D = d; base.width = W * d; base.height = H * d; sc.frame.width = W * d; sc.frame.height = H * d; sc.fk = px.kit(scaled(sc.frame)); sc.rebake(); };
    sc.setDensity(D);
    // soft light: warm wash and window glows, made once at full size; vignette is fixed to the screen
    const DW = W * sc.S, DH = H * sc.S;
    sc.light = document.createElement('canvas'); sc.light.width = DW; sc.light.height = DH;
    { const c = sc.light.getContext('2d'), gr = c.createLinearGradient(0, 0, DW, DH); gr.addColorStop(0, 'rgba(255,220,160,.45)'); gr.addColorStop(1, 'rgba(110,140,255,.22)'); c.fillStyle = gr; c.fillRect(0, 0, DW, DH); }
    sc.glow = document.createElement('canvas'); sc.glow.width = DW; sc.glow.height = DH;
    sc.vig = null;
    return sc;
  }
  function addGlows(sc, list) { const c = sc.glow.getContext('2d'), s = sc.S; c.clearRect(0, 0, sc.glow.width, sc.glow.height); list.forEach(([x, y, r, col]) => { const q = c.createRadialGradient(x * s, y * s, 0, x * s, y * s, r * s); q.addColorStop(0, col); q.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = q; c.fillRect((x - r) * s, (y - r) * s, 2 * r * s, 2 * r * s); }); }
  function tweenCam(to, ms, then) { scene.camTween = { from: { ...scene.cam }, to, t0: now(), ms, then }; }
  function burst(x, y, n, colors, opts = {}) { for (let i = 0; i < n; i++) { const a = (opts.up ? -Math.PI / 2 : 0) + (Math.random() - .5) * (opts.spread || Math.PI * 2), sp = (opts.speed || 40) * (.5 + Math.random()); scene.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: opts.g === undefined ? 90 : opts.g, life: opts.life || 700, t0: now(), c: colors[i % colors.length], s: opts.size || 1 }); } }
  function floatText(text, x, y, cls = '') { const st = document.getElementById('vstage'); if (!st) return; const el = document.createElement('div'); el.className = `vfloat ${cls}`; el.textContent = text; st.appendChild(el); place(el, x, y); setTimeout(() => el.remove(), 1300); }

  function startLoop(draw) {
    const id = ++loopId; let last = 0;
    const tick = t => {
      if (id !== loopId || !document.getElementById('vcanvas')) return;
      requestAnimationFrame(tick);
      if (t - last < 30) return; last = t;
      const sc = scene; if (!sc) return;
      if (sc.camTween) { const tw = sc.camTween, k = Math.min(1, (now() - tw.t0) / tw.ms), e = ease(k); for (const key of ['x', 'y', 'w', 'h']) sc.cam[key] = lerp(tw.from[key], tw.to[key], e); if (k >= 1) { sc.camTween = null; tw.then && tw.then(); } }
      const fc = sc.frame.getContext('2d'); fc.clearRect(0, 0, W, H); fc.drawImage(sc.base, 0, 0, W, H);
      draw(sc, sc.fk, now());
      // particles
      const k = sc.fk, tn = now();
      sc.particles = sc.particles.filter(p => { const a = (tn - p.t0) / 1000; if (a * 1000 > p.life) return false; const x = p.x + p.vx * a, y = p.y + p.vy * a + .5 * p.g * a * a; k.R(Math.round(x), Math.round(y), p.s, p.s, p.c); return true; });
      // to the screen, through the camera
      const cv = document.getElementById('vcanvas'), [DW, DH] = bufSize();
      if (cv.width !== DW || cv.height !== DH) { cv.width = DW; cv.height = DH; }
      const dc = cv.getContext('2d'), cam = sc.view = viewCam(sc, DW, DH), s = sc.S;
      // fine art is close to screen resolution: let the last small scale-up be smooth rather than uneven
      dc.imageSmoothingEnabled = sc.D > 1; dc.imageSmoothingQuality = 'high'; dc.globalCompositeOperation = 'source-over';
      dc.drawImage(sc.frame, cam.x * sc.D, cam.y * sc.D, cam.w * sc.D, cam.h * sc.D, 0, 0, DW, DH);
      // painted art carries its own light and colour: no wash or glows over it (they flatten it)
      if (!sc.painted) { dc.globalCompositeOperation = 'soft-light'; dc.drawImage(sc.light, cam.x * s, cam.y * s, cam.w * s, cam.h * s, 0, 0, DW, DH);
        dc.globalCompositeOperation = 'lighter'; dc.drawImage(sc.glow, cam.x * s, cam.y * s, cam.w * s, cam.h * s, 0, 0, DW, DH); }
      if (sc.dotAt && !sc.painted) { const [x, y] = sc.dotAt, gx = (x - cam.x) / cam.w * DW, gy = (y - cam.y) / cam.h * DH, r = 16 * DW / cam.w, q = dc.createRadialGradient(gx, gy, 0, gx, gy, r); q.addColorStop(0, 'rgba(255,190,110,.32)'); q.addColorStop(1, 'rgba(0,0,0,0)'); dc.fillStyle = q; dc.fillRect(gx - r, gy - r, 2 * r, 2 * r); }
      dc.globalCompositeOperation = 'source-over';
      if (!sc.vig || sc.vig.width !== DW || sc.vig.height !== DH) { sc.vig = document.createElement('canvas'); sc.vig.width = DW; sc.vig.height = DH; const c = sc.vig.getContext('2d'), gr = c.createRadialGradient(DW / 2, DH / 2, DH * .4, DW / 2, DH / 2, DW * .75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(30,20,45,.28)'); c.fillStyle = gr; c.fillRect(0, 0, DW, DH); }
      if (!sc.painted) dc.drawImage(sc.vig, 0, 0);
      if (sc.after) sc.after(tn);
    };
    requestAnimationFrame(tick);
  }
  // Draw moving things in depth order; tall still things in front of them are redrawn on top.
  function drawDepth(sc, items) {
    const fc = sc.frame.getContext('2d');
    items.sort((a, b) => a.y - b.y).forEach(it => {
      it.draw();
      if (!it.box) return; const [bx, by, bw, bh] = it.box;
      for (const s of sc.sprites) if (s.y > it.y && s.x < bx + bw && s.x + s.w > bx && s.top < by + bh && s.top + s.h > by) fc.drawImage(s.c, s.x, s.top, s.w, s.h);
    });
  }

  // ---------- ambient life shared by both scenes ----------
  function ambient(sc, k, t, { chimneys = [], fish = [], butterflies = [] }) {
    // drifting smoke
    for (const [x, y] of chimneys) for (let i = 0; i < 5; i++) { const a = ((t / 2600 + i / 5) % 1), r = 1 + Math.floor(a * 3.5), sx = Math.round(x + Math.sin(a * 6 + i) * 2 + a * 6), sy = Math.round(y - a * 22); k.ell(sx, sy, r, Math.max(1, r - 1), a > .6 ? 'rgba(255,255,255,.45)' : '#f3f1f6'); }
    // water sparkles
    (sc.waterPts || []).forEach(([x, y], i) => { const v = Math.sin(t / 380 + i * 2.3); if (v > .82) { k.P(x, y, C.w4); if (v > .95) { k.P(x + 1, y, C.w4); k.P(x - 1, y, C.w3); } } });
    // fish shadows gliding under the water
    fish.forEach(([cx, cy, rx, ry, sp, ph], i) => { const a = t / 1000 * sp + ph, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; k.drawFish(Math.round(x - 4), Math.round(y - 2), 'rgba(18,48,92,.42)', Math.sin(a) * sp > 0); });
    // ripples now and then
    if (!sc.nextRipple || t > sc.nextRipple) { const pts = sc.waterPts || []; if (pts.length) { const [x, y] = pts[Math.floor(Math.random() * pts.length)]; (sc.ripples = sc.ripples || []).push({ x, y, t0: t }); } sc.nextRipple = t + 1800 + Math.random() * 2200; }
    sc.ripples = (sc.ripples || []).filter(r => { const a = (t - r.t0) / 1100; if (a > 1) return false; const rad = 1 + a * 7; for (let i = 0; i < 18; i++) { const an = i / 18 * Math.PI * 2; if ((i + Math.floor(a * 4)) % 3) k.P(Math.round(r.x + Math.cos(an) * rad), Math.round(r.y + Math.sin(an) * rad * .45), a > .6 ? C.w2 : C.w3); } return true; });
    // butterflies
    butterflies.forEach(([cx, cy, rx, ry, sp, col], i) => { const a = t / 1000 * sp + i * 2, x = Math.round(cx + Math.sin(a) * rx), y = Math.round(cy + Math.sin(a * 2.1) * ry), up = Math.floor(t / 140 + i) % 2; k.P(x, y, '#2b2433'); k.P(x, y + 1, '#2b2433'); if (up) { k.P(x - 1, y - 1, col); k.P(x + 1, y - 1, col); k.P(x - 2, y - 1, col); k.P(x + 2, y - 1, col); } else { k.P(x - 1, y, col); k.P(x + 1, y, col); k.P(x - 1, y + 1, col); k.P(x + 1, y + 1, col); } });
  }
  function clouds(k, t) { [[0, 40, 46, 16], [260, 150, 54, 18]].forEach(([off, y, rx, ry]) => { const x = Math.round(((t * .006 + off) % (W + 2 * rx + 60)) - rx - 30); k.ell(x, y, rx, ry, 'rgba(20,30,60,.07)'); k.ell(x + rx * .5, y - 4, rx * .6, ry * .7, 'rgba(20,30,60,.05)'); }); }

  // =====================================================================
  // the village map
  // =====================================================================
  // the painted map: one generated painting of the whole village, traced from the drawn map so everything stands where
  // it did. The drawn map still runs underneath for its shapes: each tall thing is filled with the painting's own
  // pixels, so she walks behind houses and trees; the bridge planks, her yard, the meadow and the pies stay in code
  function buildPaintedMap(g, k, opt) {
    if (fineMapReady()) return buildFineMap(g, k, opt, () => buildMapStill(g, fineKit(k, true), { ...opt, drawn: true }), 'm-ground');
    const a = MEADOW, keep = V().open.meadow ? [a.x - 5, a.y - 4, a.cols * 16 + 9, a.rows * 16 + 9] : null;
    return paintOver(g, k, ART['map-village'], () => buildMapStill(g, k, { ...opt, drawn: true }), keep);
  }
  // ---------- the fine map (density MAPD): bare ground painted in tiles, every thing on it a fine piece ----------
  // MAPK: each piece's top-left offset from where the map code places it, and its size, in scene px (from the sheets)
  const MAPD = 4, fineMapReady = () => mapArtReady && !!ART['m-tree'];
  const MAPK = {"house-blue": [-4.0, -45.36, 47.88, 47.82], "house-gold": [-4.16, -43.34, 44.26, 45.81], "house-red": [-3.84, -37.29, 44.32, 39.75], "shop": [-6.85, -27.32, 48.14, 34.72], "stall": [-2.38, -28.34, 36.86, 28.25], "dock": [-0.55, -3.97, 31.28, 20.36], "board": [-3.69, -21.19, 24.96, 24.75], "tree-apple": [-11.15, -24.83, 22.55, 25.87], "tree": [-11.0, -24.83, 24.02, 25.87], "bush": [-7.07, -8.34, 15.33, 10.16], "rock": [-0.57, -7.01, 8.54, 8.4], "reeds": [-4.02, -15.18, 8.78, 15.38], "lily-f": [-0.72, -0.93, 6.03, 5.65], "lily": [-0.71, -0.17, 5.65, 4.89], "crate-red": [-0.62, -8.59, 8.92, 9.3], "crate-yellow": [-0.51, -8.16, 8.88, 8.88], "crate-orange": [-0.46, -8.16, 8.88, 8.88], "barrel": [-0.4, -9.4, 8.07, 10.11], "fence-h": [-0.3, -6.93, 27.01, 8.5], "fence-v": [-0.07, -6.0, 2.85, 27.58], "pond-sign": [-1.45, -40.0, 74.35, 41.24], "pond-cottage": [-14.38, -44.99, 56.9, 48.12], "pond-dock": [0, -2, 70, 26.16]};
  function buildFineMap(g, k, opt, build, ground) {
    const v = V(), a = MEADOW, keep = v.open.meadow ? [a.x - 5, a.y - 4, a.cols * 16 + 9, a.rows * 16 + 9] : null;
    const pts = build();
    const D = scene ? scene.D : 1, kept = keep && ground === 'm-ground' ? g.getImageData(keep[0] * D, keep[1] * D, keep[2] * D, keep[3] * D) : null;
    put(g, ART[ground], 0, 0);
    if (kept) g.putImageData(kept, keep[0] * D, keep[1] * D);
    return pts;
  }
  // place a fine piece for a map-code call at (ax, ay), scaled by s about that point; it sorts by ay like the drawn one
  function finePiece(k, name, ax, ay, s = 1, shade = true, tall = true) {
    const m = MAPK[name], im = ART['m-' + name]; if (!m || !im) return;
    const [dx, dy, w, h] = m, x = ax + dx * s, y = ay + dy * s;
    if (shade) k.shadow(() => { const c = k.g; c.fillStyle = 'rgba(40,46,74,.26)'; c.beginPath(); c.ellipse(ax + 2 * s, ay + .5, w * s * .42, 2.2 * s, 0, 0, Math.PI * 2); c.fill(); });
    k.add(ay, () => k.g.drawImage(im, x, y, w * s, h * s), tall);
  }
  // the stand-in kit: the drawn map code runs as written, and each of its things becomes the fine piece; its own
  // hand-drawn add()s (dock, workshop, stall, signs) are replaced by pieces, and k.raw() things stay drawn
  function fineKit(k, village) {
    const f = Object.create(k); let raw = false;
    f.add = (y, fn, tall) => { if (raw) k.add(y, fn, tall); };
    f.shadow = fn => { if (raw) k.shadow(fn); };
    f.raw = fn => { raw = true; k.raw(fn); raw = false; };
    f.flowersGround = () => {};
    f.tree = (x, y, o = {}) => finePiece(k, o.apples ? 'tree-apple' : 'tree', x, y, (o.r || 9) / 9);
    f.house = (x, y, w, roof) => finePiece(k, 'house-' + roof, x, y, w / (roof === 'blue' ? 40 : 36));
    f.bush = (x, y) => finePiece(k, 'bush', x, y); f.rock = (x, y) => finePiece(k, 'rock', x, y, 1, false);
    f.reeds = (x, y) => finePiece(k, 'reeds', x, y, 1, false); f.barrel = (x, y) => finePiece(k, 'barrel', x, y);
    f.lily = (x, y, fl) => finePiece(k, fl ? 'lily-f' : 'lily', x, y, 1, false, false);
    f.crate = (x, y, fill) => finePiece(k, fill === '#e8473f' ? 'crate-red' : fill === '#f7c531' ? 'crate-yellow' : 'crate-orange', x, y);
    f.board = (x, y) => finePiece(k, 'board', x, y);
    f.fence = (x0, y0, x1, y1) => { if (raw) return k.fence(x0, y0, x1, y1);
      const hz = y0 === y1, m = MAPK[hz ? 'fence-h' : 'fence-v'], im = ART[hz ? 'm-fence-h' : 'm-fence-v']; if (!m || !im) return;
      const [dx, dy, w, h] = m, len = hz ? x1 - x0 + 2 : y1 - y0 + 1;
      for (let o = 0; o < len; o += hz ? w - 1 : h - 1) { const seg = Math.min(hz ? w : h, len - o), ax = hz ? x0 + o : x0, ay = hz ? y0 : y0 + o;
        k.add(hz ? y0 + 1 : ay + seg, () => { const c = k.g, fr = seg / (hz ? w : h); hz ? c.drawImage(im, 0, 0, im.width * fr, im.height, ax + dx, ay + dy, seg, h) : c.drawImage(im, 0, 0, im.width, im.height * fr, ax + dx, ay + dy, w, seg); }); } };
    // the one-off buildings, at the map's own anchors
    if (village) { finePiece(k, 'shop', SHOP[0], SHOP[1]); finePiece(k, 'stall', STALL[0], STALL[1] + 4); finePiece(k, 'dock', DOCK[0], DOCK[1], 1, false, false); }
    return f;
  }
  // the pond's own: its cottage with the fish sign, the big blank sign board, the long dock
  function finePondKit(k) {
    const f = fineKit(k, false);
    f.house = (x, y) => finePiece(k, 'pond-cottage', x, y);
    finePiece(k, 'pond-sign', 12, 72); finePiece(k, 'pond-dock', 156, 101, 1, false, false);
    return f;
  }
  // draw a still with build() for its shapes, then lay the plate over it: each tall thing (depth-sorted so she can
  // pass behind it) is filled with the plate's own pixels; anything build() adds through k.raw stays as drawn.
  // keep: a rectangle of the drawn ground to keep (the open meadow's plot)
  function paintOver(g, k, plate, build, keep) {
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; const tg = tmp.getContext('2d');
    k.setSkin(f => () => { const to = k.g; tg.clearRect(0, 0, W, H); k.setCtx(tg); f(); k.setCtx(to); tg.globalCompositeOperation = 'source-in'; tg.drawImage(plate, 0, 0); tg.globalCompositeOperation = 'source-over'; to.drawImage(tmp, 0, 0); });
    const pts = build();
    k.setSkin(null);
    const kept = keep ? g.getImageData(...keep) : null;
    g.drawImage(plate, 0, 0);
    if (kept) g.putImageData(kept, keep[0], keep[1]);
    return pts;
  }
  function buildMapStill(g, k, opt = {}) {
    if (mapArtReady && !opt.drawn) return buildPaintedMap(g, k, opt);
    const v = V(), open = !!v.open.meadow;
    const water = (x, y) => px.inEll(x, y, ...POND) || inStream(x, y);
    const path = (x, y) => PATHS.some(r => { const n = px.hash(x >> 1, y >> 1, 3) < .35 ? 1 : 0; return inRect(x, y, [r[0] - n, r[1] - n, r[2] + 2 * n, r[3] + 2 * n]); });
    const inPlot = a => (x, y) => x >= a.x - 1 && x < a.x + a.cols * 16 + 1 && y >= a.y - 1 && y < a.y + a.rows * 16 + 1;
    const tall = (x, y) => !open && x > 202 && y < 52 && !inStream(x, y);
    px.ground(g, W, H, { water, path, plot: (x, y) => inPlot(YARD)(x, y) || (open && inPlot(MEADOW)(x, y)), tall });
    for (let n = 0; n < 40; n++) { const x = Math.floor(px.hash(n, 1, 21) * W), y = Math.floor(px.hash(n, 2, 21) * H); if (water(x, y) || path(x, y) || inPlot(YARD)(x, y) || inPlot(MEADOW)(x, y) || px.inEll(x, y, POND[0], POND[1], POND[2] + 4, POND[3] + 4)) continue; k.flowersGround(x, y, ['#ffffff', '#ffe066', '#ff9ac6', '#c7a6ff'][n % 4]); }
    k.house(226, 112, 40, 'blue', { chimney: true, lit: true, shutter: ['#b04774', '#e86f9a'] });
    k.add(DOCK[1] - 2, () => { const [x, y, w, h] = DOCK; k.R(x, y, w, h, C.k2); for (let a = x; a < x + w; a += 5) { k.R(a, y, 1, h, C.k1); k.P(a + 2, y + 1 + (a % 6), C.k3); } k.R(x, y, w, 1, C.k4); k.R(x, y + h - 1, w, 1, C.k1); [[x + 2, y + h], [x + 16, y + h]].forEach(([a, b]) => { k.R(a, b, 3, 6, C.k1); k.R(a, b, 1, 6, C.k2); k.R(a - 1, b + 5, 5, 1, C.w3); }); }, false);
    k.barrel(128, 136); k.crate(116, 137, '#f2a33a');
    k.board(...BOARD);
    // the bridge: one plank for each make-10 fact that is hers
    const laid = Math.min(PLANKS, opt.planks === undefined ? v.planks : opt.planks);
    k.raw(() => k.add(66, () => { const x = 241, y = 50; k.R(x - 1, y + 1, 2, 18, C.k1); k.R(x + 14, y + 1, 2, 18, C.k1); k.R(x - 1, y + 1, 1, 18, C.k2); k.R(x + 14, y + 1, 1, 18, C.k2);
      for (let j = 0; j < PLANKS; j++) { if (j >= laid) continue; const yy = y + 2 + j * 2; k.R(x + 1, yy, 13, 2, j % 2 ? C.k2 : C.k3); k.P(x + 1 + (j * 5) % 11, yy, C.k4); k.R(x + 1, yy + 1, 13, 1, C.k1); }
      if (laid < PLANKS) { k.R(x + 18, y + 6, 1, 10, C.k1); k.R(x + 15, y + 3, 9, 5, C.k3); k.R(x + 15, y + 3, 9, 1, C.k4); k.R(x + 16, y + 5, 7, 1, C.k1); } }, false));
    if (open) k.raw(() => { const a = MEADOW, x0 = a.x - 4, y0 = a.y - 3, x1 = a.x + a.cols * 16 + 2, y1 = a.y + a.rows * 16 + 4; k.fence(x0, y0, x1, y0); k.fence(x0, y1, x1, y1); k.fence(x0, y0, x0, y1); k.fence(x1, y0, x1, y1); });
    { const a = YARD, x0 = a.x - 4, y0 = a.y - 3, x1 = a.x + a.cols * 16 + 2, y1 = a.y + a.rows * 16 + 4; k.fence(x0, y0, x1, y0); k.fence(x0, y1, x1, y1); k.fence(x1, y0, x1, y1); k.fence(x0, y0, x0, y0 + 14); k.fence(x0, y0 + 34, x0, y1); }
    // Rosa's orchard: two rows of apple trees, and her crate by the path
    [[24, 66], [48, 62], [72, 66], [34, 92], [58, 90]].forEach(([x, y], i) => k.tree(x, y, { r: 8 + (i % 2), apples: true }));
    k.crate(90, 112, '#e8473f'); k.crate(70, 106, '#f7c531');
    [[10, 22], [28, 16], [46, 26], [66, 18], [86, 24], [106, 16], [176, 24], [8, 108], [290, 100], [290, 140], [116, 206], [20, 206], [196, 204], [262, 206]].forEach(([x, y], i) => k.tree(x, y, { r: 8 + (i % 3), apples: i % 5 === 2 }));
    [[206, 128], [130, 190], [222, 196]].forEach(([x, y]) => k.bush(x, y));
    // Bea's bakery: a gold roof and a bun sign
    k.house(BAKERY[0], BAKERY[1], 36, 'gold', { chimney: true, lit: true });
    k.add(BAKERY[1] + 1, () => { const x = BAKERY[0] + 12, y = BAKERY[1] - 27; k.R(x, y, 12, 7, C.k1); k.R(x + 1, y + 1, 10, 5, C.k3); k.bun(x + 3, y + 1); });
    // Tom's workshop: an open wooden shed with a workbench inside, planks leaning on the wall, a saw over the door
    k.add(SHOP[1], () => { const [x, y] = SHOP, w = 32;
      k.R(x, y - 20, w, 20, C.k1); k.R(x + 1, y - 19, w - 2, 19, C.k2); for (let a = x + 3; a < x + w - 1; a += 4) { k.R(a, y - 19, 1, 19, C.k1); k.P(a + 2, y - 15 + (a % 7), C.k3); }
      k.R(x + 6, y - 15, 20, 15, '#3a2a24'); k.R(x + 6, y - 15, 20, 1, '#2a1e1a'); k.R(x + 5, y - 16, 1, 16, C.k3); k.R(x + 26, y - 16, 1, 16, C.k1);
      k.R(x + 9, y - 13, 6, 1, C.s3); k.R(x + 9, y - 13, 2, 3, C.k3); k.R(x + 18, y - 13, 1, 5, C.s2); k.R(x + 20, y - 12, 1, 4, C.s3); k.R(x + 22, y - 13, 2, 2, C.k3);
      k.R(x + 7, y - 7, 18, 2, C.k3); k.R(x + 7, y - 7, 18, 1, C.k4); k.R(x + 8, y - 5, 1, 5, C.k1); k.R(x + 23, y - 5, 1, 5, C.k1); k.R(x + 12, y - 9, 6, 2, C.k4); k.P(x + 19, y - 8, C.s3);
      for (let j = 0; j < 7; j++) k.R(x - 3 + j, y - 27 + j, w + 6 - 2 * j > 0 ? w + 6 : 0, 1, j === 6 ? '#5a3020' : j % 2 ? '#8a4a32' : '#a85a3a');
      for (let i = 0; i < w + 6; i += 3) k.P(x - 3 + i, y - 26 + (i % 2), '#c27050');
      k.R(x + 11, y - 25, 10, 5, C.k1); k.R(x + 12, y - 24, 8, 3, C.k3); k.R(x + 13, y - 23, 5, 1, C.s3); k.R(x + 17, y - 24, 2, 3, C.k1);
      [[w + 1, 0], [w + 3, 1]].forEach(([a, b]) => { k.line(x + a, y - 1, x + a + 3, y - 16 - b, C.k1); k.line(x + a + 1, y - 1, x + a + 4, y - 16 - b, C.k3); });
      k.R(x - 6, y - 4, 6, 1, C.k3); k.R(x - 6, y - 3, 1, 3, C.k1); k.R(x - 1, y - 3, 1, 3, C.k1); });
    // the post office: a little house with an envelope over the door
    k.house(POST[0], POST[1], 36, 'red', { lit: true });
    k.add(POST[1] + 1, () => { const x = POST[0] + 13, y = POST[1] - 26; k.R(x, y, 10, 7, '#f4ecdc'); k.R(x, y, 10, 1, '#fffaf0'); k.line(x, y, x + 5, y + 4, '#a8978a'); k.line(x + 9, y, x + 4, y + 4, '#a8978a'); k.R(x + 9, y, 1, 7, '#c9b9a0'); k.R(x, y + 6, 10, 1, '#c9b9a0'); });
    // Mr. Pip's pie stall: striped awning, a counter, pies when it's open
    k.add(STALL[1] + 4, () => { const [x, y] = STALL, open = jobOpen('market');
      k.R(x, y - 18, 2, 20, C.k1); k.R(x + 30, y - 18, 2, 20, C.k1);
      for (let j = 0; j < 6; j++) for (let i = -2 + (j >> 1); i < 34 - (j >> 1); i++) k.P(x + i, y - 24 + j, j === 0 ? '#6e3a3a' : Math.floor((i + 8) / 4) % 2 ? '#efe8dc' : '#c06456');
      k.R(x - 1, y - 6, 34, 9, C.k1); k.R(x, y - 5, 32, 7, C.k2); k.R(x, y - 5, 32, 1, C.k4);
      if (!open) { k.R(x + 8, y - 4, 16, 5, '#2f4a3a'); k.R(x + 10, y - 2, 12, 1, '#cfe8d6'); } });
    if (jobOpen('market')) k.raw(() => k.add(STALL[1] + 5, () => { k.pie(STALL[0] + 3, STALL[1] - 10); k.pie(STALL[0] + 17, STALL[1] - 10); }, false));
    [[270, 120], [40, 196], [110, 198]].forEach(([x, y]) => k.rock(x, y));
    [[18, 140], [21, 142], [112, 176], [115, 178], [100, 120]].forEach(([x, y]) => k.reeds(x, y));
    [[36, 142], [76, 168], [48, 178]].forEach(([x, y], i) => k.lily(x, y, i % 2 === 0));
    if (!open) [[212, 18], [236, 12], [270, 30], [284, 14], [258, 22]].forEach(([x, y]) => k.rock(x, y));
    k.raw(() => { for (const p of v.placed) { if (p.area === 'meadow' && !open) continue; if (opt.skip && opt.skip.includes(p)) continue; const a = area(p.area), x = a.x + p.cx * 16, y = a.y + p.cy * 16; k.add(y + 15, () => px.drawItem(k, p.item, x, y, p.paint)); } });
    // water points for sparkles, well inside the pond
    const pts = []; for (let i = 0; i < 70; i++) { const a = px.hash(i, 5, 61) * Math.PI * 2, r = Math.sqrt(px.hash(i, 6, 62)) * .8; const x = Math.round(POND[0] + Math.cos(a) * POND[2] * r), y = Math.round(POND[1] + Math.sin(a) * POND[3] * r); if (!inRect(x, y, [DOCK[0] - 2, DOCK[1] - 2, DOCK[2] + 4, DOCK[3] + 10])) pts.push([x, y]); }
    return pts;
  }

  // her, walking: position, route queue, frames
  const her = { x: 244, y: 118, path: [], flip: false, walkT: 0, then: null, hop: 0, wave: 0 };
  function nodeNear(x, y) { let best = 'dock', bd = 1e9; for (const n in NODES) { const d = Math.hypot(NODES[n][0] - x, NODES[n][1] - y); if (d < bd) { bd = d; best = n; } } return best; }
  function walkTo(stop, then) {
    const from = nodeNear(her.x, her.y), prev = { [from]: null }, q = [from];
    while (q.length) { const n = q.shift(); if (n === stop) break; EDGES.forEach(([a, b]) => { const m = a === n ? b : b === n ? a : null; if (m && !(m in prev)) { prev[m] = n; q.push(m); } }); }
    const pts = []; for (let n = stop; n; n = prev[n]) pts.unshift(NODES[n]);
    if (pts.length && Math.hypot(pts[0][0] - her.x, pts[0][1] - her.y) <= 2) pts.shift();
    her.path = pts.map(p => [...p]); her.then = then || null;
    if (!pts.length && then) { her.then = null; then(); }
  }
  function walkFree(x, y) { her.path = [[x, y]]; her.then = null; }
  function stepHer(dt) {
    if (!her.path.length) return;
    const [tx, ty] = her.path[0], dx = tx - her.x, dy = ty - her.y, d = Math.hypot(dx, dy), sp = 52 * dt;
    if (Math.abs(dx) > .5) her.flip = dx < 0;
    if (d <= sp) { her.x = tx; her.y = ty; her.path.shift(); if (!her.path.length && her.then) { const f = her.then; her.then = null; f(); } }
    else { her.x += dx / d * sp; her.y += dy / d * sp; her.walkT += dt; }
  }
  const dot = { x: 230, y: 96 };

  function renderMap() {
    const v = V(), build = mode === 'build';
    const items = buyable(v);
    const sel = B.sel && placedAt(B.sel);
    ui.primaryJob = undefined;
    $root.innerHTML = `<main class="village full ${build ? 'building' : ''} ${ui.story ? 'story' : ''}">
      <div class="vstage" id="vstage"><canvas id="vcanvas"></canvas><div class="vhaze ${mapArtReady ? 'off' : ''}"></div>
        <div class="vbubble" id="vbubble"></div>
        <div class="vmark" id="vmark">!</div>
      </div>
      <div class="vhud vtl"><span class="vpill vcoins" id="vcoins">${COIN()} <b>${v.coins}</b></span><button class="vguide vpanel" id="vguide" data-v="guide"></button></div>
      <div class="vhud vbr"><button class="vpill vgrown grownup" data-hold="parent"><span class="fillbar"></span>Grown-ups: hold</button></div>
      ${build ? buildTray(items, sel) : `<div class="vhud vbl vactions"><button class="big-btn" data-v="orchard">🍎 Help Rosa<span>Pick apples, earn coins</span></button>${jobOpen('market') ? '<button class="big-btn" data-v="market">🥧 Help Mr. Pip<span>Count his coins back</span></button>' : ''}<button class="big-btn" data-v="bakery">🍞 Help Bea<span>Bake buns</span></button><button class="big-btn" data-v="post">📦 Help Mo<span>Deliver the mail</span></button>${placeOpen('workshop') ? '<button class="big-btn" data-v="workshop">🔨 Help Tom<span>Build with big numbers</span></button>' : ''}${placeOpen('notes') ? '<button class="big-btn" data-v="notes">📜 Read the notes<span>Story problems</span></button>' : ''}<button class="big-btn" data-v="fish">🎣 Go fishing<span>Sell fish for coins</span></button><button class="big-btn alt" data-v="build">🔨 Fix up your yard<span>Spend your coins</span></button></div>`}
      <div class="vfade" id="vfade"></div>
    </main>`;
    fit();
    if (!scene || scene.kind !== 'map' || ui.rebuildMap) { scene = makeScene('map', (g, k) => buildMapStill(g, k, { planks: v.planks, skip: ui.popping ? ui.popping.map(p => p.p) : [] }), fineMapReady() ? MAPD : 1); scene.painted = mapArtReady; ui.rebuildMap = false; addGlows(scene, [[240, 99, 7, 'rgba(255,180,90,.22)'], [259, 99, 7, 'rgba(255,180,90,.22)']]); }
    scene.after = mapOverlays;
    hookMapInput();
    startLoop(drawMap);
    if (!ui.arrived) { ui.arrived = true; arrive(); }
  }
  // ---------- morning orders: three requests a day; when they're done, the rest of the day is hers ----------
  // Rosa's apples (adding), Mr. Pip's pies (taking away; until his stall opens, fish for make 10), and Dot's lesson on
  // the notice board (big numbers, school work, Teach Dot). Only right, unrushed answers move an order forward.
  function orders() {
    const v = V(), s = S(); if (!s || !s.placement.done) return null;
    const day = EM.dayStr(Date.now());
    if (!v.orders || v.orders.day !== day) {
      if (v.orders && v.orders.list) { const o = v.orders, log = v.orderLog = v.orderLog || {}; log[o.day] = { done: o.list.filter(x => x.got >= x.need).length, n: o.list.length, ms: o.ms || 0 }; Object.keys(log).sort().slice(0, -30).forEach(d => delete log[d]); }
      v.orders = { day, list: [
        // the first order takes turns: Rosa's apples one day she plays, Bea's buns the next
        (v.orderDays = (v.orderDays || 0) + 1) % 2 === 0 ? { id: 'bakery', text: 'Bake 5 trays with Bea', short: "Bea's buns", need: 5, got: 0 } : { id: 'orchard', text: 'Pick 5 apples with Rosa', short: "Rosa's apples", need: 5, got: 0 },
        jobOpen('market') ? { id: 'market', text: 'Sell 5 pies to Mr. Pip', short: "Mr. Pip's pies", need: 5, got: 0 } : { id: 'fish', text: 'Catch 5 fish', short: '5 fish', need: 5, got: 0 },
        { id: 'lesson', text: "Do Dot's lesson on the board", short: "Dot's lesson", need: 1, got: 0 },
      ] };
      EM.save();
    }
    return v.orders;
  }
  // a hard day still ends: after about 12 minutes on the orders, the day counts as done (time on jobs and the lesson)
  const ORDER_LIMIT_MS = 12 * 60000;
  const ordersDone = () => { const o = orders(); return !!o && (o.list.every(x => x.got >= x.need) || (o.ms || 0) >= ORDER_LIMIT_MS); };
  function addOrderTime(ms) { const o = orders(); if (!o || ordersDone() || !(ms > 0)) return; o.ms = (o.ms || 0) + Math.min(ms, 30 * 60000); EM.save(); }
  const ordersCount = () => { const o = orders(); return o ? o.list.filter(x => x.got >= x.need).length : 0; };
  function orderProgress(id) { const o = orders(); if (!o) return false; const x = o.list.find(q => q.id === id); if (!x || x.got >= x.need) return false; x.got++; EM.save(); return x.got >= x.need; }
  // the fact skills today's job orders cover (Dot's lesson does the rest)
  const jobSkills = () => { const o = orders(); return o ? o.list.flatMap(x => x.id === 'fish' ? ['m10'] : JOBS[x.id] ? JOBS[x.id].skills : []) : []; };

  // ---------- Dot's guide: the one next thing to do, pinned at the top and marked on the map ----------
  function mission() {
    const v = V(), s = S(), done = EM.todayDone && EM.todayDone(), cheap = Math.min(...px.ITEMS.filter(i => !i.gift && (!i.area || v.open[i.area])).map(i => i.cost));
    const pond = { job: 'fish', text: 'Catch fish at the pond', say: 'Tap the pond to catch some fish!', mark: [POND[0] + 30, POND[1] - 24], go: () => walkTo('dock', toFishing) };
    const yard = { job: 'build', text: 'Buy something for your yard', say: `You have ${v.coins} coins. Tap your yard to spend them!`, mark: [YARD.x + 48, YARD.y - 8], go: () => walkTo('yard', () => enterBuild(null)) };
    const rosa = { job: 'orchard', text: 'Help Rosa pick apples', say: 'Rosa needs help in the orchard. Tap her!', mark: [ROSA[0] + 4, ROSA[1] - 22], go: () => walkTo('orchard', toOrchard) };
    const bea = { job: 'bakery', text: 'Bake buns with Bea', say: 'Bea needs help in the bakery. Tap her!', mark: [BEA[0] + 4, BEA[1] - 22], go: () => walkTo('bakery', toBakery) };
    const pip = { job: 'market', text: 'Sell pies to Mr. Pip', say: 'Mr. Pip needs help with his coins. Tap him!', mark: [PIP[0] + 4, PIP[1] - 20], go: () => walkTo('market', marketTap) };
    const board = (text, say) => ({ text, say, mark: [BOARD[0] + 9, BOARD[1] - 26], go: () => walkTo('board', openBoard) });
    if (!v.rounds && !v.placed.length) return pond;
    if (!v.placed.length) return v.coins >= cheap ? yard : pond;
    if (!s.placement.done) return board("Read Dot's note on the board", 'I pinned a note on the board for you. Tap it!');
    // the morning orders, in order
    const o = orders(), next = o && o.list.find(x => x.got < x.need);
    if (next) {
      const tag = { label: `Today's orders · ${ordersCount()} of ${o.list.length} done` }, count = next.need > 1 ? ` (${next.got} of ${next.need})` : '';
      if (next.id === 'orchard') return { ...rosa, ...tag, text: next.text + count };
      if (next.id === 'bakery') return { ...bea, ...tag, text: next.text + count };
      if (next.id === 'market') return { ...pip, ...tag, text: next.text + count };
      if (next.id === 'fish') return { ...pond, ...tag, text: next.text + count };
      return { ...board(next.text, "Dot's lesson is on the board."), ...tag };
    }
    // the day is hers: build, or keep helping (whoever she's helped least)
    if (v.coins >= 6) return { ...yard, label: 'Free time' };
    const mo = { job: 'post', text: 'Help Mo deliver the mail', say: 'Mo has packages to deliver. Tap Mo!', mark: [MO[0] + 4, MO[1] - 20], go: () => walkTo('post', toPost) };
    const tom = { job: 'workshop', text: 'Help Tom in his workshop', say: 'Tom needs help building. Tap Tom!', mark: [TOM[0] + 4, TOM[1] - 20], go: () => walkTo('workshop', () => toPlace('workshop')) };
    const notes = { job: 'notes', text: 'Answer a note on the board', say: 'Your neighbors pinned notes on the board. Tap it!', mark: [BOARD[0] + 9, BOARD[1] - 26], go: () => walkTo('board', () => toPlace('notes')) };
    const friends = [[rosa, v.orchardRounds || 0], [bea, v.bakeryRounds || 0], [mo, v.postRounds || 0], ...(jobOpen('market') ? [[pip, v.marketRounds || 0]] : []), ...(placeOpen('workshop') ? [[tom, v.workshopRounds || 0]] : []), ...(placeOpen('notes') ? [[notes, v.notesRounds || 0]] : [])];
    return { ...friends.sort((a, b) => a[1] - b[1])[0][0], label: 'Free time' };
  }
  function mapOverlays() {
    place(document.getElementById('vbubble'), dot.x, dot.y - 9);
    const m = mission(), show = m && !ui.story && mode !== 'build';
    const mk = document.getElementById('vmark'); if (mk) { mk.classList.toggle('on', !!show); if (m) place(mk, m.mark[0], m.mark[1] - Math.round(Math.sin(now() / 300) * 1.5)); }
    const job = show ? m.job : null; if (ui.primaryJob !== job) { ui.primaryJob = job; document.querySelectorAll('.vactions .big-btn').forEach(b => b.classList.toggle('primary', b.dataset.v === job)); }
    const g = document.getElementById('vguide'); if (g) { g.classList.toggle('on', !!show); const t = m ? m.text : ''; if (g.dataset.t !== t + (m && m.label)) { g.dataset.t = t + (m && m.label); g.innerHTML = `${EM.theme.dot('happy', 40)}<span><small>${esc(m.label || 'Next job')}</small>${esc(t)}</span><b>›</b>`; } }
  }
  function drawMap(sc, k, t) {
    const dt = Math.min(.06, (t - (sc.lastT || t)) / 1000); sc.lastT = t;
    stepHer(dt);
    // Dot floats beside her (or wherever the story puts Dot)
    const dTarget = ui.dotTarget || [her.x + (her.flip ? 14 : -10), her.y - 24];
    dot.x = lerp(dot.x, dTarget[0], Math.min(1, dt * 2.6)); dot.y = lerp(dot.y, dTarget[1], Math.min(1, dt * 2.6));
    const dy = Math.round(Math.sin(t / 420) * 1.5), blinkDot = (t % 4200) < 130;
    sc.dotAt = [dot.x, dot.y + dy];
    ambient(sc, fineMapReady() && ART['m-fish-orange'] ? fineFishKit(k) : k, t, { chimneys: [[258, 64]], fish: [[60, 158, 26, 12, .35, 0], [52, 148, 18, 8, -.5, 2], [70, 164, 34, 14, .25, 4]], butterflies: [[96, 96, 20, 8, .7, '#ffe066'], [190, 196, 26, 6, .55, '#ff9ac6'], [286, 120, 10, 14, .6, '#ffffff']] });
    // the pond glows while it's what she should tap
    if (ui.pulsePond) { const a = (Math.sin(t / 260) + 1) / 2; for (let i = 0; i < 48; i++) { const an = i / 48 * Math.PI * 2; if (i % 2) k.P(Math.round(POND[0] + Math.cos(an) * (POND[2] + 3 + a * 2)), Math.round(POND[1] + Math.sin(an) * (POND[3] + 3 + a * 2)), '#fff3b0'); } }
    if (ui.pulseYard) { const a = (Math.sin(t / 260) + 1) / 2, x0 = YARD.x - 2 - a, y0 = YARD.y - 2 - a, w = YARD.cols * 16 + 4 + 2 * a, h = YARD.rows * 16 + 4 + 2 * a; for (let i = 0; i < w; i += 2) { k.P(Math.round(x0 + i), Math.round(y0), '#fff3b0'); k.P(Math.round(x0 + i), Math.round(y0 + h), '#fff3b0'); } for (let i = 0; i < h; i += 2) { k.P(Math.round(x0), Math.round(y0 + i), '#fff3b0'); k.P(Math.round(x0 + w), Math.round(y0 + i), '#fff3b0'); } }
    const items = [];
    const walking = her.path.length > 0, wf = walking ? [0, 1, 0, 3][Math.floor(her.walkT / .11) % 4] : 0;
    const hop = her.hop > t ? Math.round(Math.sin((her.hop - t) / 400 * Math.PI) * 4) : 0;
    // the painted villagers (one sheet, so they share the painting's light); she takes her avatar's hair and shirt
    if (mapArtReady) {
      const c = sc.frame.getContext('2d'), P = (im, cx, base, flip, bob) => { const w = im.width / dOf(im), h = im.height / dOf(im), x = Math.round(cx - w / 2), y = Math.round(base - h - bob);
        if (flip) { c.save(); c.translate(x + w, y); c.scale(-1, 1); c.drawImage(im, 0, 0, w, h); c.restore(); } else c.drawImage(im, x, y, w, h); };
      const V_ = n => (fineMapReady() && artReady && mapSize(ART[n], n)) || ART['m-v-' + n] || ART['map-' + n];   // the close-up villagers, shrunk to map size, once they are in
      const step = walking ? Math.floor(her.walkT / .14) % 2 : 0, m = mission() || {}, wave = (period, off, on) => on && ((t + off) % period) < 1100 ? Math.floor(t / 180) % 2 : 0;
      items.push({ y: her.y, box: [Math.round(her.x) - 2, Math.round(her.y) - 20, 13, 21], draw: () => { k.shadowEll(Math.round(her.x) + 4, Math.round(her.y), 5, 1); P(fineMapReady() && artReady ? mapSize(herArt(), 'her|' + look().hair + look().shirt) : herArt(ART['m-v-her'] ? 'm-v-her' : 'map-her'), Math.round(her.x) + 4, Math.round(her.y) + 1, her.flip, step + hop); } });
      const npc = (n, [x, y], on, off) => items.push({ y, box: [x - 3, y - 20, 15, 21], draw: () => { k.shadowEll(x + 4, y, 5, 1); P(V_(n), x + 4, y + 1, false, wave(5600, off, on)); } });
      npc('rosa', ROSA, m.text === 'Help Rosa pick apples', 0); npc('bea', BEA, m.job === 'bakery', 3300); npc('mo', MO, m.job === 'post', 2600); npc('pip', PIP, m.job === 'market', 1700);
      if (placeOpen('workshop')) npc('tom', TOM, m.job === 'workshop', 2100);
    } else {
    items.push({ y: her.y, box: [Math.round(her.x) - 1, Math.round(her.y) - 20, 11, 21], draw: () => { k.shadowEll(Math.round(her.x) + 4, Math.round(her.y), 4, 1); k.drawPerson(Math.round(her.x), Math.round(her.y), look(), { walk: wf, flip: her.flip, blink: !walking && (t % 3600) < 120, bob: hop, wave: her.wave > t }); } });
    // Rosa by her orchard, in her straw hat; she waves when helping her is the next job
    items.push({ y: ROSA[1], box: [ROSA[0] - 2, ROSA[1] - 19, 13, 20], draw: () => { const [x, y] = ROSA; k.shadowEll(x + 4, y, 4, 1); k.drawPerson(x, y, ROSA_LOOK, { blink: (t % 3900) < 120, wave: (t % 5200) < 1100 && (mission() || {}).text === 'Help Rosa pick apples' });
      k.R(x + 2, y - 18, 5, 2, '#e2ae52'); k.R(x + 2, y - 18, 3, 1, '#f8dc8a'); k.R(x, y - 16, 9, 1, '#c08636'); k.R(x + 2, y - 17, 5, 1, '#b84a3e'); } });
    items.push({ y: BEA[1], box: [BEA[0] - 2, BEA[1] - 19, 13, 20], draw: () => { const [x, y] = BEA; k.shadowEll(x + 4, y, 4, 1); k.drawPerson(x, y, BEA_LOOK, { flip: true, blink: ((t + 3300) % 4500) < 120, wave: (t % 5900) < 1100 && (mission() || {}).job === 'bakery' });
      k.R(x + 1, y - 19, 7, 4, '#f4efe2'); k.R(x + 1, y - 19, 7, 1, '#ffffff'); k.R(x + 1, y - 15, 7, 1, '#cfc6b4'); } });
    items.push({ y: MO[1], box: [MO[0] - 2, MO[1] - 17, 13, 18], draw: () => { const [x, y] = MO; k.shadowEll(x + 4, y, 4, 1); k.drawPerson(x, y, MO_LOOK, { flip: true, blink: ((t + 2600) % 4700) < 120, wave: (t % 6100) < 1100 && (mission() || {}).job === 'post' });
      k.R(x + 1, y - 16, 7, 2, '#3a5aa8'); k.R(x, y - 14, 9, 1, '#2b2b3a'); } });
    if (placeOpen('workshop')) items.push({ y: TOM[1], box: [TOM[0] - 2, TOM[1] - 17, 13, 18], draw: () => { const [x, y] = TOM; k.shadowEll(x + 4, y, 4, 1); k.drawPerson(x, y, TOM_LOOK, { flip: true, blink: ((t + 2100) % 4400) < 120, wave: (t % 6300) < 1100 && (mission() || {}).job === 'workshop' });
      k.R(x + 1, y - 16, 7, 2, '#6a5a4a'); k.R(x, y - 14, 9, 1, '#4a3e34'); k.R(x + 2, y - 9, 5, 2, '#9a5a2a'); } });
    items.push({ y: PIP[1], box: [PIP[0] - 2, PIP[1] - 17, 13, 18], draw: () => { const [x, y] = PIP; k.shadowEll(x + 4, y, 4, 1); k.drawPerson(x, y, PIP_LOOK, { flip: true, blink: ((t + 1700) % 4300) < 120, wave: (t % 5600) < 1100 && (mission() || {}).job === 'market' });
      k.R(x + 2, y - 10, 5, 2, '#e8e8f0'); k.P(x + 4, y - 8, '#e8e8f0'); } });
    }
    // things she just built pop in
    (ui.popping || []).forEach(pp => { const a = Math.min(1, (t - pp.t0) / 380), s = a < .7 ? a / .7 * 1.15 : 1.15 - (a - .7) / .3 * .15, ar = area(pp.p.area), x = ar.x + pp.p.cx * 16, y = ar.y + pp.p.cy * 16;
      items.push({ y: y + 15, draw: () => { const c = pp.c || (pp.c = itemCanvas(pp.p.item, pp.p.paint)); const w = Math.max(1, Math.round(16 * s)); sc.frame.getContext('2d').drawImage(c, Math.round(x + 8 - w / 2), Math.round(y + 16 - w), w, w); } }); });
    if (ui.popping && ui.popping.length && ui.popping.every(pp => t - pp.t0 > 420)) { ui.popping = []; scene.buildStill = (g, kk) => buildMapStill(g, kk, { planks: V().planks }); scene.rebake(); }
    drawDepth(sc, items);
    // a plank flying onto the bridge
    if (ui.plankFly) { const a = Math.min(1, (t - ui.plankFly.t0) / 600), y = Math.round(lerp(20, 52 + ui.plankFly.j * 2, ease(a))); k.R(242, y, 13, 2, C.k3); k.R(242, y + 1, 13, 1, C.k1); if (a >= 1) { const f = ui.plankFly.then; ui.plankFly = null; f(); } }
    // build mode: the spots
    if (mode === 'build') for (const id of ['plot', 'meadow']) { if (id === 'meadow' && !V().open.meadow) continue; const a = area(id); for (let cy = 0; cy < a.rows; cy++) for (let cx = 0; cx < a.cols; cx++) { const x = a.x + cx * 16, y = a.y + cy * 16, sel = B.sel && B.sel.area === id && B.sel.cx === cx && B.sel.cy === cy, col = sel ? '#ffe066' : 'rgba(255,255,255,.55)'; for (let i = 0; i < 16; i += 2) { k.R(x + i, y, 1, 1, col); k.R(x + i, y + 15, 1, 1, col); k.R(x, y + i, 1, 1, col); k.R(x + 15, y + i, 1, 1, col); } if (sel) { k.R(x, y, 16, 1, col); k.R(x, y + 15, 16, 1, col); k.R(x, y, 1, 16, col); k.R(x + 15, y, 1, 16, col); } } }
    if (B.drag && B.drag.at) px.drawItem(k, B.drag.p.item, Math.round(B.drag.at[0] - 8), Math.round(B.drag.at[1] - 12), B.drag.p.paint);
    if (fineMapReady() && ART['dot-1']) { const im = ART[blinkDot ? 'dot-2' : 'dot-1'], s = 15; sc.frame.getContext('2d').drawImage(im, dot.x - s / 2, dot.y + dy - s / 2, s, s); } else
    k.drawDot(Math.round(dot.x), Math.round(dot.y) + dy, t, blinkDot);
    clouds(k, t);
  }
  let backdropKey = '', backdropUrl = '';
  function backdrop() {
    const v = V(), key = `${v.placed.map(p => p.item + p.cx + p.cy + p.paint).join()}|${v.planks}|${!!v.open.meadow}`;
    if (key === backdropKey && backdropUrl) return backdropUrl;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const k = px.kit(c.getContext('2d'));
    buildMapStill(c.getContext('2d'), k, { planks: v.planks }); k.bake(W, H);
    const big = document.createElement('canvas'); big.width = W * 4; big.height = H * 4; const g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, big.width, big.height);
    backdropKey = key; backdropUrl = big.toDataURL('image/jpeg', .82); return backdropUrl;
  }
  const buyable = v => px.ITEMS.filter(i => (!i.area || v.open[i.area]) && (!i.gift || ((v.gifts || {})[i.id] || 0) > 0));
  function itemCanvas(id, paint) { const c = document.createElement('canvas'); c.width = 16; c.height = 16; px.drawItem(px.kit(c.getContext('2d')), id, 0, 0, paint); return c; }
  const iconCache = {}; const itemIcon = (id, paint) => iconCache[id + (paint || '')] || (iconCache[id + (paint || '')] = itemCanvas(id, paint || px.ITEM[id].paint).toDataURL());

  // What happens when she arrives in the village: the story the first time, then news (planks, board, greetings).
  function arrive() {
    const v = V();
    if (!v.introDone) return story();
    if (ui.from) { [her.x, her.y] = NODES[ui.from === 'fish' ? 'dock' : ui.from]; ui.from = null; }
    layPlanks(() => {
      if (ui.next) { const f = ui.next; ui.next = null; return f(); }
      const o = orders();
      if (o && ordersDone() && !o.cheered) { o.cheered = true; v.coins += 5; EM.save(); return dayDone(); }
      if (jobOpen('market') && !(v.announced || {}).market) { (v.announced = v.announced || {}).market = Date.now(); EM.save(); her.wave = now() + 1200; return say("Mr. Pip's pie stall is open! He needs help counting his coins.", { ms: 4200 }); }
      const m = mission(); if (m) say(m.say);
    });
  }
  // Lay any planks she has earned since she last looked, one at a time.
  function layPlanks(done) {
    const v = V(), owed = Math.min(PLANKS, Math.max(v.planksOwed || 0, meadowProgress().have));
    if (v.planks >= owed) return done();
    her.path = []; ui.story = true; const m = document.querySelector('.village'); if (m) m.classList.add('story');
    const end = done; done = () => { ui.story = false; const m2 = document.querySelector('.village'); if (m2) m2.classList.remove('story'); end(); };
    tweenCam(camAround(248, 60, 150), 700, () => {
      const next = () => {
        if (V().planks >= owed) {
          if (V().planks >= PLANKS && !V().open.meadow) { V().open.meadow = Date.now(); EM.save(); scene.buildStill = (g, k) => buildMapStill(g, k); scene.rebake(); burst(262, 30, 30, ['#ffe066', '#ffffff', '#ff9ac6'], { speed: 60, g: 40, life: 1200 }); say('The bridge is fixed! The meadow is open. Look, sheep!', { ms: 4200 }); sfx('unlock'); return setTimeout(() => tweenCam({ ...CAM_FULL }, 900, done), 2600); }
          return setTimeout(() => tweenCam({ ...CAM_FULL }, 800, done), 1200);
        }
        const j = V().planks;
        ui.plankFly = { j, t0: now(), then: () => { V().planks++; EM.save(); scene.buildStill = (g, k) => buildMapStill(g, k); scene.rebake(); burst(249, 52 + j * 2, 10, [C.k4, C.d3, '#ffffff'], { up: true, spread: 2, speed: 30, life: 500 }); sfx('right');
          say(V().planks < PLANKS ? `A new plank! ${V().planks} of ${PLANKS}. Every make 10 fact you know fixes one more.` : 'The last plank!', { ms: 2600 }); setTimeout(next, 1500); } };
      };
      next();
    });
  }

  // ---------- the arrival story: one beat at a time, the camera shows each place ----------
  function story() {
    const n = NAME(), steps = [
      { cam: CAM_FULL, dot: null, text: `Oh! You made it${n ? ', ' + n : ''}! I'm Dot. I've been waiting so long for someone new to come live here.`, say: "Oh! You made it! I'm Dot. I've been waiting so long for someone new to come live here." },
      { cam: camAround(246, 96, 120), dot: [222, 88], text: 'This little house is yours now. Look, I already lit the lamps for you.' },
      { cam: camAround(194, 160, 140), dot: [176, 124], text: "And this is your yard. It's a bit empty... for now. You can fill it with anything you like." },
      { cam: camAround(84, 150, 140), dot: [104, 120], text: 'Everyone here pays with coins. Catch fish in the pond and sell them. Then you can buy flowers, a bench, even a wishing well.' },
      { cam: camAround(62, 84, 130), dot: [92, 84], text: "That's Rosa's orchard. She always needs help picking apples, and she pays in coins too." },
      { cam: camAround(248, 50, 130), dot: [226, 44], text: "And see that old bridge? It broke a long, long time ago. Nobody knows what's on the other side..." },
      { cam: camAround(248, 50, 130), dot: [226, 44], text: 'Every time you really learn a make 10 fact, we can fix one plank. Eight planks, and we can cross!' },
      { cam: CAM_FULL, dot: null, text: "Let's catch your very first fish. Tap the pond!", end: true },
    ];
    ui.story = true; her.x = 244; her.y = 118; her.path = [];
    const main = document.querySelector('.village'); if (main) main.classList.add('story');
    const box = document.createElement('div'); box.className = 'vdialog'; box.innerHTML = `<div class="vdialog-dot">${EM.theme.dot('wow', 56)}</div><div class="vdialog-t"></div><div class="vdialog-more">Tap to continue ▸</div><button class="vskip" data-v="skipstory">Skip</button>`;
    document.querySelector('.village').appendChild(box);
    const fade = document.getElementById('vfade'); fade.classList.add('black', 'on'); setTimeout(() => fade.classList.remove('on'), 60);
    let i = -1, typing = null;
    const show = () => {
      i++; const st = steps[i]; if (!st) return;
      ui.dotTarget = st.dot; tweenCam({ ...st.cam }, i === 0 ? 10 : 900);
      if (i === 0) { dot.x = her.x - 30; dot.y = her.y - 60; burst(her.x - 6, her.y - 30, 16, ['#fff7c2', '#ffe27a'], { g: 0, speed: 30, life: 900 }); her.wave = now() + 1400; }
      const el = box.querySelector('.vdialog-t'); el.textContent = ''; let c = 0; clearInterval(typing);
      typing = setInterval(() => { c += 2; el.textContent = st.text.slice(0, c); if (c >= st.text.length) { clearInterval(typing); typing = null; } }, 28);
      box.querySelector('.vdialog-more').style.visibility = st.end ? 'hidden' : 'visible';
      if (EM.speech) EM.speech.say(st.say || st.text);
      if (st.end) { setTimeout(() => { box.remove(); ui.story = false; ui.dotTarget = null; ui.pulsePond = true; const m = document.querySelector('.village'); if (m) m.classList.remove('story'); V().introDone = true; EM.save(); say(st.text, { stay: true, voice: false }); }, 2200); }
    };
    box.addEventListener('click', e => { if (e.target.closest('[data-v=skipstory]')) { e.stopPropagation(); clearInterval(typing); EM.speech && EM.speech.stop(); i = steps.length - 2; return show(); } const st = steps[i]; if (!st || st.end) return; if (typing) { clearInterval(typing); typing = null; box.querySelector('.vdialog-t').textContent = st.text; return; } show(); });
    show();
  }

  // ---------- taps on the map ----------
  function hookMapInput() {
    const st = document.getElementById('vstage'); let down = null;
    st.onpointerdown = e => { if (ui.story || ui.busy) return; const [x, y] = toScene(e), c = cellAt(x, y); down = { x, y, c, p: c && placedAt(c), moved: false }; if (mode === 'build' && down.p && !B.item) st.setPointerCapture(e.pointerId); };
    st.onpointermove = e => { if (!down || mode !== 'build' || !down.p || B.item) return; const [x, y] = toScene(e); if (!down.moved && Math.hypot(x - down.x, y - down.y) < 4) return; down.moved = true; B.drag = { p: down.p, at: [x, y] }; };
    st.onpointerup = e => {
      const d = down; down = null; if (!d) return;
      const [x, y] = toScene(e), c = cellAt(x, y);
      if (B.drag) { const p = B.drag.p; B.drag = null; if (c && !placedAt(c)) { Object.assign(p, { area: c.area, cx: c.cx, cy: c.cy }); B.sel = c; EM.save(); sfx('right'); popIn(p); } else { scene.buildStill = (g, k) => buildMapStill(g, k); scene.rebake(); } return renderTray(); }
      tap(x, y, c);
    };
  }
  function tap(x, y, c) {
    const v = V();
    if (mode === 'build') return buildTap(c);
    if (Math.hypot(x - (her.x + 4), y - (her.y - 8)) < 9) { her.hop = now() + 400; her.wave = now() + 900; return say(['Hi!', 'Wheee!', 'This is my village!'][Math.floor(Math.random() * 3)], { voice: false }); }
    if (Math.hypot(x - dot.x, y - dot.y) < 9) return say(dotHint());
    if (px.inEll(x, y, ...POND) || inRect(x, y, DOCK)) { ui.pulsePond = false; return walkTo('dock', () => toFishing()); }
    if (inRect(x, y, ORCHARD) || Math.hypot(x - ROSA[0] - 4, y - ROSA[1] + 8) < 10) return walkTo('orchard', toOrchard);
    if (inRect(x, y, [STALL[0] - 4, STALL[1] - 26, 42, 30]) || Math.hypot(x - PIP[0] - 4, y - PIP[1] + 8) < 10) return walkTo('market', marketTap);
    if (inRect(x, y, [BAKERY[0] - 4, BAKERY[1] - 40, 46, 42]) || Math.hypot(x - BEA[0] - 4, y - BEA[1] + 8) < 10) return walkTo('bakery', toBakery);
    if (inRect(x, y, [SHOP[0] - 6, SHOP[1] - 28, 44, 30]) || Math.hypot(x - TOM[0] - 4, y - TOM[1] + 8) < 10) return walkTo('workshop', () => toPlace('workshop'));
    if (inRect(x, y, [POST[0] - 4, POST[1] - 40, 46, 42]) || Math.hypot(x - MO[0] - 4, y - MO[1] + 8) < 10) return walkTo('post', toPost);
    if (c && c.area === 'plot') { ui.pulseYard = false; return walkTo('yard', () => enterBuild(placedAt(c) ? c : null)); }
    if (inRect(x, y, [BOARD[0] - 4, BOARD[1] - 24, 28, 26])) return walkTo('board', openBoard);
    if (inRect(x, y, [232, 40, 40, 34])) return walkTo('bridge', () => { const p = meadowProgress(); say(V().open.meadow ? 'The bridge is fixed! Tap the meadow to build there.' : `${p.have} of ${PLANKS} planks fixed. Every make 10 fact you really know fixes one more.`); });
    if (c && c.area === 'meadow') return walkTo('bridge', () => enterBuild(placedAt(c) ? c : null));
    if (inRect(x, y, [222, 72, 48, 42])) return walkTo('home', () => say('Home sweet home.', { voice: false }));
    if (!(px.inEll(x, y, ...POND) || inStream(x, y)) && y > 30 && y < H - 4 && x > 4 && x < W - 4) walkFree(x, y);
  }
  // tapping Dot: the next job first, then other ideas
  function dotHint() { const p = meadowProgress(), m = mission(); const hints = [m ? m.say : 'Tap your yard to put things in it.', 'Help Rosa or go fishing to earn coins.', `${p.have} of ${PLANKS} bridge planks fixed. Make 10 facts fix them!`]; ui.hintI = ((ui.hintI || 0) + 1) % hints.length; return hints[ui.hintI === 1 ? 0 : ui.hintI]; }

  // all three orders done: the village says thank you, and the rest of the day is hers
  function dayDone() {
    const ov = document.createElement('div'); ov.className = 'vover';
    const o = orders(), all = o.list.every(x => x.got >= x.need);
    const who = o.list.filter(x => JOBS[x.id]).map(x => JOBS[x.id].npc), thanks = who.length > 1 ? `${who.slice(0, -1).join(', ')}, ${who[who.length - 1]} and I all say thank you.` : `${who[0] || 'Everyone'} and I say thank you.`;
    const title = all ? "Today's orders are done!" : 'You worked hard today!', text = all ? `${thanks} Here are 5 bonus coins. The rest of the day is yours: build, explore, or keep helping.` : "That's plenty of orders for one day. Here are 5 bonus coins. The rest of the day is yours: build, explore, or keep helping.";
    ov.innerHTML = `<div class="vcard"><div class="vcard-art">${EM.theme.dot('cheer', 72)}</div><h2>${title}</h2><p>${text}</p><div class="vrow"><button class="big-btn" data-ov="ok">Yay!</button></div></div>`;
    document.body.appendChild(ov); EM.speech && EM.speech.say(title); sfx('yours'); showCoins();
    burst(her.x + 4, her.y - 20, 24, ['#fff7c2', '#ffe27a', '#ff9ac6', '#ffffff'], { up: true, spread: 2.4, speed: 60, life: 1100 });
    ov.addEventListener('click', e => { if (!e.target.closest('[data-ov]')) return; ov.remove(); const m = mission(); if (m) say(m.say); });
  }

  // ---------- notice board ----------
  function openBoard() {
    const s = S(), o = orders(), lesson = o && o.list.find(x => x.id === 'lesson'), done = EM.todayDone && EM.todayDone(), evening = done && EM.dueTonight && EM.dueTonight();
    const list = o ? `<ul class="vorders">${o.list.map(x => `<li class="${x.got >= x.need ? 'done' : ''}"><i>${x.got >= x.need ? '✓' : ''}</i>${esc(x.short)}${x.need > 1 && x.got < x.need ? ` <small>${x.got} of ${x.need}</small>` : ''}</li>`).join('')}</ul>` : '';
    const card = document.createElement('div'); card.className = 'vover'; card.innerHTML = `<div class="vcard vboard"><h2>📋 Notice board</h2>
      ${!s.placement.done ? `<div class="vnote"><b>A note from Dot</b><p>Before we start, show me what you already know. Then I'll know how to help you. About 10 minutes.</p><button class="big-btn" data-b="placement">Show Dot what I know</button></div>`
      : `<div class="vnote"><b>${ordersDone() ? "Today's orders are done! ⭐" : "Today's orders"}</b>${list}
          <button class="big-btn" data-b="lesson">${lesson && lesson.got >= lesson.need ? "Do Dot's lesson again" : "Start Dot's lesson"}</button></div>
        ${evening ? '<button class="btn secondary" data-b="evening">🌙 Evening review · 5 minutes</button>' : ''}
        ${placeOpen('notes') ? '<button class="btn secondary" data-b="notes">📜 Notes from the village</button>' : ''}
        <button class="btn secondary" data-b="today">📚 Practice everything</button>
        <button class="btn secondary" data-b="skills">🎯 Pick a skill to practice</button>`}
      <button class="btn secondary" data-b="close">Back to the village</button></div>`;
    document.body.appendChild(card);
    card.addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (!b) { if (e.target === card) card.remove(); return; } card.remove(); stopLoop();
      ({ notes: () => enterPlace('notes'), placement: () => EM.startSession('placement'), lesson: () => EM.startSession('lesson'), today: () => EM.startSession('daily'), evening: () => EM.startSession('evening'), skills: () => EM.go('skills'), close: () => startLoop(drawMap) })[b.dataset.b](); });
  }

  // ---------- build mode ----------
  function enterBuild(sel) { mode = 'build'; B = { item: null, sel }; renderMap(); if (!V().placed.length) say(V().coins >= 2 ? 'Flowers cost 2 coins. Pick them, then tap a spot in your yard.' : "You need coins to buy things. Let's go earn some!"); }
  function renderTray() { const old = document.querySelector('.vtray'), v = V(); if (!old) return; const items = buyable(v); old.outerHTML = buildTray(items, B.sel && placedAt(B.sel)); showCoins(); }
  function buildTray(items, sel) {
    if (sel) {
      const it = px.ITEM[sel.item];
      return `<div class="vtray vpanel"><div class="vtray-h"><img src="${itemIcon(sel.item, sel.paint)}" alt=""> <b>${esc(it.name)}</b> <button class="btn secondary small" data-v="deselect">Done</button></div>
        <div class="vhint">Pick a color</div><div class="vpaints">${PAINTS.map(c => `<button class="vpaint ${sel.paint === c ? 'on' : ''}" data-paint="${c}" style="background:${px.PAINT[c][1]}" aria-label="${c}"></button>`).join('')}</div>
        <div class="vcol"><button class="btn secondary" data-v="move">↔ Move it</button><button class="btn secondary" data-v="putaway">↩ Put it away (get ${it.cost} coins back)</button></div></div>`;
    }
    const v = V();
    return `<div class="vtray vpanel"><div class="vtray-h"><b>Your yard</b><button class="btn secondary small" data-v="done">Done</button></div><div class="vhint">Pick something, then tap a spot. Drag things to move them.</div>
      <div class="vitems">${items.map(i => `<button class="vitem ${B.item === i.id ? 'on' : ''} ${v.coins < i.cost ? 'poor' : ''}" data-item="${i.id}"><img src="${itemIcon(i.id)}" alt=""><span>${esc(i.name)}</span><b>${i.gift ? '🎁 Gift' : `${i.cost} ${COIN()}`}</b></button>`).join('')}</div></div>`;
  }
  function popIn(p) { (ui.popping = ui.popping || []).push({ p, t0: now() }); scene.buildStill = (g, k) => buildMapStill(g, k, { skip: ui.popping.map(q => q.p) }); scene.rebake(); const a = area(p.area); burst(a.x + p.cx * 16 + 8, a.y + p.cy * 16 + 14, 12, ['#efd3a2', '#d9b17c', '#ffffff'], { up: true, spread: 2.4, speed: 34, life: 520 }); }
  function buildTap(c) {
    const v = V();
    if (!c) { B.sel = null; return renderTray(); }
    const there = placedAt(c);
    if (B.moving) { if (!there) { Object.assign(B.moving, c); B.sel = c; EM.save(); popIn(B.moving); } B.moving = null; return renderTray(); }
    if (B.item) {
      if (there) { B.sel = c; B.item = null; return renderTray(); }
      const it = px.ITEM[B.item];
      if (v.coins < it.cost) { say(`That costs ${it.cost} coins. You have ${v.coins}. Let's earn more!`); return; }
      v.coins -= it.cost; if (it.gift) v.gifts[it.id]--; const p = { item: it.id, paint: it.paint, ...c }; v.placed.push(p); EM.save(); sfx('right'); popIn(p);
      const first = v.placed.length === 1;
      if (v.coins < it.cost || (it.gift && !v.gifts[it.id])) B.item = null;
      B.sel = null; renderTray();
      if (first) setTimeout(() => say(S().placement.done ? 'Your yard is starting to look like home!' : 'Your yard is starting to look like home! One more thing: I pinned a note on the board for you.', { ms: 4200 }), 500);
      return;
    }
    B.sel = there ? c : null; renderTray();
  }

  // =====================================================================
  // fishing: make 10, on the real fact engine
  // =====================================================================
  const CONFIRM_MS = 2000, BOB = [118, 128], BASKET = [181, 93], HAND = [166, 101];
  const goal = () => V().rounds ? 5 : 3;  // her first round is short
  function buildFishStill(g, k) {
    if (fineMapReady()) return buildFineMap(g, k, {}, () => buildDrawnPond(g, finePondKit(k)), 'm-pond-ground');
    if (mapArtReady) return paintOver(g, k, ART['map-pond'], () => buildDrawnPond(g, k));
    return buildDrawnPond(g, k);
  }
  function buildDrawnPond(g, k) {
    const water = (x, y) => px.inEll(x, y, 118, 132, 108, 60) || (y < 90 && Math.abs(x - (54 + Math.sin(y / 18) * 7)) <= 8);
    const path = (x, y) => inRect(x, y, [222, 98, 80, 10]) || inRect(x, y, [258, 60, 9, 40]);
    px.ground(g, W, H, { water, path });
    for (let n = 0; n < 50; n++) { const x = Math.floor(px.hash(n, 1, 21) * W), y = Math.floor(px.hash(n, 2, 21) * H); if (px.inEll(x, y, 118, 132, 114, 66) || path(x, y) || (y < 96 && Math.abs(x - (54 + Math.sin(y / 18) * 7)) <= 12)) continue; k.flowersGround(x, y, ['#ffffff', '#ffe066', '#ff9ac6', '#c7a6ff'][n % 4]); }
    k.house(236, 76, 38, 'red', { chimney: true, lit: true, shutter: ['#2f5a3b', '#4f8a5b'], extra: (x, y, w, top) => { k.R(x - 13, top + 4, 6, 1, C.k1); k.R(x - 9, top + 5, 1, 2, C.k1); k.R(x - 14, top + 7, 12, 8, C.k2); k.R(x - 14, top + 7, 12, 1, C.k3); k.R(x - 14, top + 14, 12, 1, C.k1); k.sprite(x - 12, top + 9, ['..ccc.t', '.ccccctt', 'cecccc.t', '..ccc..t'], { c: '#7fb8e8', t: '#7fb8e8', e: '#2b2433' }); } });
    k.add(96, () => { k.R(156, 101, 70, 10, C.k2); for (let x = 156; x < 226; x += 5) { k.R(x, 101, 1, 10, C.k1); k.P(x + 2, 102 + (x % 6), C.k3); k.P(x + 3, 107 - (x % 4), C.k1); } k.R(156, 101, 70, 1, C.k4); k.R(156, 110, 70, 1, C.k1); [[158, 111], [184, 111], [210, 111]].forEach(([x, y]) => { k.R(x, y, 3, 7, C.k1); k.R(x, y, 1, 7, C.k2); k.R(x - 1, y + 6, 5, 1, C.w3); }); }, false);
    k.barrel(214, 100);
    k.add(72, () => k.sign(12, 72, 72, 24));
    [[40, 150], [84, 112], [150, 170], [190, 150], [24, 132]].forEach(([x, y], i) => k.lily(x, y, i % 2 === 0));
    [[16, 104], [19, 106], [22, 103], [212, 160], [215, 162], [218, 158], [100, 74], [103, 76]].forEach(([x, y]) => k.reeds(x, y));
    for (let i = 0; i < 8; i++) k.tree(8 + i * 18 + (i % 2) * 6, 22 + (i % 3) * 5, { r: 9 + (i % 2), far: true });
    [[288, 40], [292, 150], [266, 196], [14, 200], [236, 178]].forEach(([x, y], i) => k.tree(x, y, { r: 9 + (i % 2) }));
    for (let c = 0; c < 2; c++) for (let r = 0; r < 2; r++) k.tree(262 + c * 22, 130 + r * 26, { r: 8, apples: true });
    [[110, 72], [204, 80], [6, 160], [240, 120], [196, 196]].forEach(([x, y]) => k.bush(x, y));
    [[26, 90], [228, 150], [186, 72], [64, 200]].forEach(([x, y]) => k.rock(x, y));
    const pts = []; for (let i = 0; i < 90; i++) { const a = px.hash(i, 7, 63) * Math.PI * 2, r = Math.sqrt(px.hash(i, 8, 64)) * .85; const x = Math.round(118 + Math.cos(a) * 108 * r), y = Math.round(132 + Math.sin(a) * 60 * r); if (!inRect(x, y, [150, 96, 80, 26])) pts.push([x, y]); }
    return pts;
  }
  function toFishing() {
    ui.busy = true; her.path = [];
    tweenCam(camAround(112, 150, 96), 800, () => {
      const f = document.getElementById('vfade'); if (f) f.classList.add('on');
      setTimeout(() => { ui.busy = false; startFishing(); }, 260);
    });
  }
  function startFishing() {
    mode = 'fish';
    F = { queue: [], i: -1, caught: 0, goal: goal(), started: Date.now(), stats: { items: 0, fast: 0, slow: 0, wrong: 0, idk: 0, rushed: 0, times: [], fastKeys: [], learned: [] }, input: '', phase: 'cast', anim: { t0: now(), kind: 'cast' }, fishPos: [40, 170], fishFlip: false };
    renderFishing(true);
    scene = makeScene('fish', buildFishStill, fineMapReady() ? MAPD : 1); scene.painted = mapArtReady; addGlows(scene, [[247, 64, 7, 'rgba(255,180,90,.22)'], [266, 64, 7, 'rgba(255,180,90,.22)']]);
    scene.cam = camAround(150, 110, 230); tweenCam({ ...CAM_FULL }, 700);
    scene.after = fishOverlays;
    const fd = document.getElementById('vfade'); if (fd) { fd.classList.add('on'); requestAnimationFrame(() => setTimeout(() => fd.classList.remove('on'), 30)); }
    startLoop(drawFishing);
    nextFish();
  }
  function refill() { F.queue.push(...EM.buildFactQueue([MEADOW_SKILL], 14).queue); }
  function nextFish() {
    F.i++; if (F.i >= F.queue.length) refill();
    const e = F.queue[F.i];
    F.key = e.key; F.mode = e.mode; F.item = EM.factItem(e.key, e.mode); F.f = EM.FACTS[e.key];
    F.input = ''; F.help = null; F.t0 = null; F.tLast = null; F.msg = ''; F.said = ''; F.waitSpeech = false;
    // cast, then a fish swims up to the bobber; the question (and its clock) starts when the fish arrives
    F.phase = 'cast'; F.anim = { kind: 'cast', t0: now() }; F.splashed = false; F.fled = false; F.leap = null;
    const edge = [[20, 150], [60, 186], [24, 118], [96, 186]][Math.floor(Math.random() * 4)]; F.fishPos = [...edge];
    renderFishWork();
  }
  function fishArrived() {
    F.phase = 'ask'; F.said = F.caught === 0 && !V().rounds ? `This fish has ${F.f.a}. How many more make 10? Tap the number, then the check.` : `This fish has ${F.f.a}. How many more make 10?`;
    renderFishWork();
    // her first fish each round is read aloud; the clock waits until Dot has finished talking
    if (F.caught === 0 && F.i === 0 && EM.speech && EM.speech.enabled()) fishHear(); else F.t0 = performance.now();
  }
  function fishHear() {
    if (!F || (F.phase !== 'ask' && F.phase !== 'help')) return;
    const text = F.phase === 'help' ? `${F.msg || ''} ${F.help.say}` : F.said, key = F.key, i = F.i;
    if (F.phase === 'help' || F.input) { EM.speech && EM.speech.say(text); return; }
    F.waitSpeech = true; renderFishWork();
    const release = () => { if (F && F.key === key && F.i === i && F.waitSpeech) { F.waitSpeech = false; F.t0 = performance.now(); renderFishWork(); } };
    (EM.speech ? EM.speech.say(text) : Promise.resolve()).then(release);
    setTimeout(release, (EM.speech ? EM.speech.estimateMs(text) : 0) + 300);
  }
  // fishing's sign stands on the shore, top left; Dot floats over the water
  const FSIGN = [13, 33, 70, 22], FDOT = [136, 84];
  // practice's help says "dots" and "boxes"; at the pond they are fish and spots
  const fishWords = t => String(t).replace(/\bdots\b/g, 'fish').replace(/\bdot\b/g, 'fish').replace(/empty boxes/g, 'empty spots').replace(/empty box/g, 'empty spot').replace(/\bboxes\b/g, 'spots');
  function renderFishing() {
    const goalN = F ? F.goal : goal(), marks = Array.from({ length: goalN }, (_, i) => `<i class="${F && i < F.caught ? 'on' : ''}"></i>`).join('');
    $root.innerHTML = `<main class="village full fishing job">
      <div class="vstage" id="vstage"><canvas id="vcanvas"></canvas><div class="vhaze ${mapArtReady ? 'off' : 'mid'}"></div>
        <div class="jsign" id="jsign"></div><div class="vtag" id="vtag"></div><div class="jbub bydot" id="jbub"></div>
      </div>
      <div class="vhud vtl"><span class="vpill vcoins" id="vcoins">${COIN()} <b>${V().coins}</b></span><div class="jorder vpanel"><b>Make 10: catch fish</b><div class="jmarks fish" id="jmarks">${marks}</div></div></div>
      <div class="vhud vtr"><button class="jhome vpanel" data-v="stopfish">🏠 Village</button></div>
      <div class="jpad vpanel" id="jpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-fd="${d}">${d}</button>`).join('')}<button data-v="fback" aria-label="Delete">⌫</button><button data-fd="0">0</button><button class="ok" data-v="fok" aria-label="Check">✓</button></div>
      <div class="jleft"><button class="jround" data-v="jhear" aria-label="Hear it again">🔊</button><button class="jidk" data-v="jidk">I don't know</button></div>
      <div class="vfade on" id="vfade"></div>
    </main>`;
    fit();
  }
  // the sign, Dot's bubble and the pad (no full re-render, so the scene keeps moving)
  function renderFishWork() {
    const sign = document.getElementById('jsign'), pad = document.getElementById('jpad'); if (!sign || !F) return;
    const f = F.f, help = F.help, asking = F.phase === 'ask' || F.phase === 'help', shown = asking || F.phase === 'caught' || F.phase === 'reel';
    sign.innerHTML = shown ? `<span>${f.a} +</span><span class="slot ${asking && !F.waitSpeech ? 'cursor' : ''}">${F.phase === 'caught' || F.phase === 'reel' ? f.ans : esc(F.input)}</span><span>= 10</span>` : '<span>Make 10</span>';
    sign.classList.toggle('right', F.phase === 'caught' || F.phase === 'reel');
    const bub = document.getElementById('jbub');
    const words = help ? `${F.msg ? `<b>${esc(F.msg)}</b> ` : ''}${help.html}${help.vis ? `<div class="jvis">${help.vis}</div>` : ''}` : F.phase === 'ask' ? esc(F.said) : F.msg ? esc(F.msg) : '';
    bub.innerHTML = words ? `<small>Dot</small>${words}` : ''; bub.classList.toggle('on', !!words);
    pad.classList.toggle('busy', !asking || F.waitSpeech);
    document.querySelector('.jidk').style.visibility = help || !asking || F.waitSpeech ? 'hidden' : 'visible';
    const m = document.getElementById('jmarks'); if (m) { if (m.children.length !== F.goal) m.innerHTML = Array.from({ length: F.goal }, () => '<i></i>').join(''); [...m.children].forEach((el, i) => el.classList.toggle('on', i < F.caught)); }
    const tag = document.getElementById('vtag'); tag.textContent = f.a; tag.classList.toggle('on', F.phase === 'ask' || F.phase === 'help');
    showCoins();
  }
  function fishOverlays() { if (!F) return; place(document.getElementById('vtag'), BOB[0], BOB[1] - 6); const r = placeSign(FSIGN); placeBubble(FDOT[0], FDOT[1] - 8 + Math.round(Math.sin(now() / 420) * 1.5), r); }
  // at the pond's fine density: painted fish, bobber and basket; the line, sparkles and ripples drawn fine, not in blocks
  function fineFishKit(k) {
    const f = Object.create(k), c = () => k.g, s = 1 / MAPD;
    f.P = (x, y, col) => { c().fillStyle = col; c().fillRect(x + .5 - s, y + .5 - s, 2 * s, 2 * s); };
    f.line = (x0, y0, x1, y1, col) => { const g = c(); g.strokeStyle = col; g.lineWidth = .4; g.beginPath(); g.moveTo(x0 + .5, y0 + .5); g.lineTo(x1 + .5, y1 + .5); g.stroke(); };
    f.drawFish = (x, y, col, flip) => { const im = ART[String(col).startsWith('rgba(18') ? 'm-fish-shadow' : col === '#f7c948' ? 'm-fish-gold' : 'm-fish-orange'], w = 10, h = w * im.height / im.width, g = c();
      g.save(); if (String(col).startsWith('rgba(18')) g.globalAlpha = .4; g.translate(x + 4, y + 2); if (!flip) g.scale(-1, 1); g.drawImage(im, -w / 2, -h / 2, w, h); g.restore(); };
    f.sprite = (x, y, rows, map) => rows[0] === '.ww.' ? c().drawImage(ART['m-bobber'], x - .4, y - 2.6, 4.6, 6.9) : k.sprite(x, y, rows, map);
    return f;
  }
  function drawFishing(sc, k0, t) {
    const k = fineMapReady() && ART['m-fish-orange'] ? fineFishKit(k0) : k0;
    const a = F && F.anim, at = a ? t - a.t0 : 0;
    ambient(sc, k, t, { chimneys: [[267, 29]], fish: [[70, 150, 30, 12, .3, 0], [150, 168, 26, 8, -.4, 1], [60, 120, 20, 8, .45, 3]], butterflies: [[220, 140, 16, 8, .6, '#ffe066'], [40, 70, 20, 6, .5, '#ff9ac6']] });
    if (!F) return;
    // the fish on her line
    if (F.phase === 'cast' && at > 900) { const tx = BOB[0] - 4, ty = BOB[1] + 7; const [x, y] = F.fishPos, d = Math.hypot(tx - x, ty - y); if (d < 1.5) { F.fishPos = [tx, ty]; fishArrived(); } else { const sp = Math.min(d, 1.6); F.fishPos = [x + (tx - x) / d * sp, y + (ty - y) / d * sp]; F.fishFlip = tx < x; } }
    if (F.fled && F.fishPos[0] > -12) { const [x, y] = F.fishPos; F.fishPos = [x - 3.2, y + 1.2]; F.fishFlip = true; }
    const fishVisible = F.phase !== 'caught' && !(F.fled && F.fishPos[0] < -10);
    const nib = F.phase === 'ask' && !F.fled ? Math.round(Math.sin(t / 200) * 1) : 0;
    if (fishVisible && F.phase !== 'reel') k.drawFish(Math.round(F.fishPos[0] + nib), Math.round(F.fishPos[1]), 'rgba(242,163,58,.85)', F.fishFlip);
    // rod and line
    let tip = [150, 86];
    if (F.phase === 'cast' && at < 350) { const e = at / 350; tip = [Math.round(lerp(176, 146, e)), Math.round(lerp(78, 90, e))]; }
    if (F.phase === 'caught' && at < 300) tip = [158, 80];
    let bob = BOB, dip = 0;
    if (F.phase === 'cast') { if (at < 350) bob = null; else if (at < 850) { const e = (at - 350) / 500; bob = [Math.round(lerp(tip[0], BOB[0], e)), Math.round(lerp(tip[1], BOB[1], e) - Math.sin(e * Math.PI) * 26)]; } }
    if (F.phase === 'cast' && at >= 850 && !F.splashed) { F.splashed = true; burst(BOB[0], BOB[1], 10, [C.w4, '#ffffff', C.w3], { up: true, spread: 2.2, speed: 34, life: 500 }); (sc.ripples = sc.ripples || []).push({ x: BOB[0], y: BOB[1] + 2, t0: t }); }
    if (F.phase === 'ask' || F.phase === 'help') dip = Math.sin(t / 700) > .85 ? 1 : 0;
    if (F.phase === 'caught' || (F.phase === 'reel' && at > 0)) bob = null;
    k.R(HAND[0] - 1, HAND[1], 2, 2, C.k2); k.line(HAND[0], HAND[1], tip[0], tip[1], C.k2); k.P(tip[0], tip[1], C.k3);
    if (bob) { const bx = bob[0], by = bob[1] + dip; const mx = (tip[0] + bx) / 2, my = Math.max(tip[1], by) + 6; for (let i = 0; i < 12; i++) { const u = i / 12, v2 = (i + 1) / 12; const p = (s2) => [Math.round((1 - s2) * (1 - s2) * tip[0] + 2 * (1 - s2) * s2 * mx + s2 * s2 * bx), Math.round((1 - s2) * (1 - s2) * tip[1] + 2 * (1 - s2) * s2 * my + s2 * s2 * (by - 3))]; const [x0, y0] = p(u), [x1, y1] = p(v2); k.line(x0, y0, x1, y1, 'rgba(255,255,255,.9)'); } k.sprite(bx - 1, by - 3, ['.ww.', 'wwww', 'rrrr', '.rr.'], { w: '#ffffff', r: '#e8473f' }); }
    // a caught fish leaps into the basket
    if (F.phase === 'caught' && F.leap) { const e = Math.min(1, (t - F.leap.t0) / 720), x = lerp(BOB[0], BASKET[0], e), y = lerp(BOB[1], BASKET[1], e) - Math.sin(e * Math.PI) * 46; k.drawFish(Math.round(x - 4), Math.round(y - 2), F.leap.fast ? '#f7c948' : '#f2a33a', false); if (Math.random() < .5) burst(x, y, 1, F.leap.fast ? ['#fff7c2', '#ffe27a'] : ['#ffffff'], { g: 20, speed: 8, life: 400 }); if (e >= 1 && !F.leap.landed) { F.leap.landed = true; F.inBasket = (F.inBasket || 0) + 1; burst(BASKET[0], BASKET[1], 10, ['#ffe066', '#ffffff', '#f2a33a'], { up: true, spread: 2, speed: 40, life: 600 }); floatText('+1 🐟', BASKET[0], BASKET[1] - 8, F.leap.fast ? 'fast' : ''); } }
    // her, the basket, Dot
    const items = [];
    items.push({ y: 109, draw: () => { const bob = F.phase === 'caught' && t - F.anim.t0 < 300 ? 1 : 0; k.shadowEll(168, 109, 4, 1);
      if (mapArtReady) { const im = fineMapReady() && artReady ? mapSize(herArt(), 'her|' + look().hair + look().shirt) : herArt(ART['m-v-her'] ? 'm-v-her' : 'map-her'), w = im.width / dOf(im), h = im.height / dOf(im); sc.frame.getContext('2d').drawImage(im, 168 - Math.floor(w / 2), 110 - h - bob, w, h); } else k.drawPerson(164, 109, look(), { blink: (t % 3600) < 120, bob }); } });
    items.push({ y: 103, draw: () => { const n = Math.min(F.inBasket || 0, 12);
      if (ART['m-fish-basket'] && fineMapReady()) { const g = k.g; for (let i = 0; i < Math.min(n, 6); i++) { const im = ART[i % 3 === 2 ? 'm-fish-gold' : 'm-fish-orange']; g.save(); g.translate(178 + (i % 3) * 3.4, 95.5 - Math.floor(i / 3) * 1.6); g.rotate(-.5 + (i % 3) * .5); g.drawImage(im, -2.5, -1.8, 5, 3.6); g.restore(); }
        g.drawImage(ART['m-fish-basket'], 175, 95, 13, 8.7); return; } k.R(176, 96, 11, 6, C.k3); k.R(176, 96, 11, 1, C.k4); k.R(176, 101, 11, 1, C.k1); for (let x = 177; x < 187; x += 2) k.P(x, 98, C.k2); for (let i = 0; i < n; i++) { const fx = 177 + (i % 4) * 2, fy = 94 - Math.floor(i / 4) * 2; k.R(fx, fy, 3, 2, i % 3 === 2 ? '#7fb8e8' : '#f2a33a'); k.P(fx, fy, '#ffd08a'); } } });
    drawDepth(sc, items);
    const dy = Math.round(Math.sin(t / 420) * 1.5); sc.dotAt = [136, 84 + dy];
    if (fineMapReady() && ART['dot-1']) { const mood = F.phase === 'caught' ? 3 : F.help ? 4 : (t % 4200) < 130 ? 2 : 1, s = 15; k.g.drawImage(ART['dot-' + mood], 136 - s / 2, 84 + dy - s / 2, s, s); } else k.drawDot(136, 84 + dy, t, (t % 4200) < 130);
    clouds(k, t);
  }
  // keys act the moment a finger lands (see app.js): a dropped tap feels like the game ignoring her
  function fType(d) { if ((F.phase !== 'ask' && F.phase !== 'help') || F.waitSpeech) return nudge(); if (F.input.length >= 2) return; F.input = F.input === '0' ? d : F.input + d; F.tLast = performance.now(); renderFishWork(); }
  function fBack() { F.input = F.input.slice(0, -1); F.tLast = F.input ? performance.now() : null; renderFishWork(); }
  function nudge() { const p = document.querySelector('.vpadwrap .pad, .jpad'); if (!p) return; p.classList.remove('nudge'); void p.offsetWidth; p.classList.add('nudge'); }
  const graded = () => F.mode !== 'rehearse' && F.mode !== 'reask';
  function grade(outcome, ms) {
    F.stats.items++; F.stats[outcome]++;
    if (outcome === 'fast' || outcome === 'slow') F.stats.times.push(ms);
    if (outcome === 'fast') F.stats.fastKeys.push(F.key);
    if (!graded()) return { becameYours: false };
    return EM.gradeFact(F.key, outcome, ms);
  }
  function fOk() {
    if ((F.phase !== 'ask' && F.phase !== 'help') || F.waitSpeech || !F.input) return F.input ? nudge() : null;
    const typed = Number(F.input), ok = typed === F.f.ans, tn = performance.now();
    if (F.help) { // in help: the right answer moves on, but this fish already got away
      if (ok) { F.phase = 'reel'; F.anim = { kind: 'reel', t0: now() }; F.help = null; F.msg = `Yes! ${F.f.a} and ${F.f.ans} make 10.`; renderFishWork(); EM.speech && EM.speech.say(F.msg); const cur = F; return setTimeout(() => { if (F === cur) nextFish(); }, 1700); }
      if (F.help.stage === 1) return enterHelp(2); F.input = ''; renderFishWork(); return;
    }
    const ms = (F.tLast || tn) - (F.t0 || tn), gap = tn - (F.tLast || tn);
    if (ok) {
      const fast = ms <= EM.fastMs(F.item, 0) && gap <= CONFIRM_MS, g = grade(fast ? 'fast' : 'slow', ms);
      F.caught++; V().coins++; orderProgress('fish'); floatText('+1', BASKET[0], BASKET[1] - 14, 'coin'); V().caught = (V().caught || 0) + 1; EM.save();
      F.phase = 'caught'; F.anim = { kind: 'caught', t0: now() }; F.leap = { t0: now() + 120, fast };
      burst(BOB[0], BOB[1], 16, [C.w4, '#ffffff', C.w3], { up: true, spread: 1.8, speed: 52, life: 650 });
      F.msg = fast ? '⚡ Got it! You just knew that one.' : 'Got one! Nice thinking.';
      renderFishWork(); sfx(fast ? 'fast' : 'right');
      if (g.becameYours) checkUnlocks();
      const cur = F;
      return setTimeout(() => {
        if (F !== cur) return;
        if (g.becameYours) return celebrate(`${F.f.a} + ${F.f.ans} = 10 is yours now!`, meadowProgress().have <= PLANKS ? 'That fixes a plank on the bridge. Go see!' : 'You knew it fast on two different days.', afterCatch);
        afterCatch();
      }, 1250);
    }
    const rushed = ms < EM.rushMs(F.item);
    if (rushed) F.stats.rushed++;
    grade('wrong', ms);
    F.fled = true; burst(F.fishPos[0] + 4, F.fishPos[1], 6, [C.w4, '#ffffff'], { up: true, spread: 2, speed: 26, life: 400 });
    enterHelp(1, rushed ? 'Whoa, too fast! It slipped away. Think first, then tap.' : "Oops, it got away. Let's figure it out together.");
  }
  function fIdk() { if (!F || F.help || F.phase !== 'ask' || F.waitSpeech) return; grade('idk', 0); F.fled = true; enterHelp(1, "Good idea to ask. Let's look together."); }
  function enterHelp(stage, lead) {
    // a fact she missed comes back a few fish later, like in practice (at most twice per fact)
    if (stage === 1) { const n = (F.reasks = F.reasks || {})[F.key] || 0; if (n < 2) { F.reasks[F.key] = n + 1; F.queue.splice(Math.min(F.queue.length, F.i + 3), 0, { key: F.key, mode: 'reask' }); } }
    const h = F.item.help(0, stage);
    F.help = { stage, vis: h.vis, html: fishWords(h.html), say: fishWords(h.say) }; F.input = ''; F.phase = 'help';
    if (lead) F.msg = lead; else if (stage === 2) F.msg = '';
    renderFishWork(); EM.speech && EM.speech.say(`${F.msg || ''} ${F.help.say}`);
  }
  function afterCatch() {
    if (F.caught === F.goal) {
      const first = !V().rounds; V().rounds = (V().rounds || 0) + 1; EM.save();
      return celebrate(first ? 'Your very first fish!' : `Basket full! ${F.goal} fish!`, `Each fish sold for a coin. You have ${V().coins} coins to spend.`, () => { F.caught = 0; F.inBasket = 0; F.goal = goal(); nextFish(); }, [['Keep fishing', 'keep'], [first ? 'Go spend them!' : 'Spend them', 'tobuild']]);
    }
    nextFish();
  }
  function celebrate(title, text, then, buttons, spoken) {
    const ov = document.createElement('div'); ov.className = 'vover';
    ov.innerHTML = `<div class="vcard"><div class="vcard-art">${EM.theme.dot('cheer', 72)}</div><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="vrow">${(buttons || [['Yay!', 'keep']]).map(([t, a], i) => `<button class="big-btn ${i ? 'alt' : ''}" data-ov="${a}">${esc(t)}</button>`).join('')}</div></div>`;
    document.body.appendChild(ov); EM.speech && EM.speech.say(spoken || title);
    ov.addEventListener('click', e => { const b = e.target.closest('[data-ov]'); if (!b) return; ov.remove(); if (b.dataset.ov === 'tobuild') return leaveJob(() => enterBuild(null)); then(); });
  }
  function finishFishing() {
    if (!F) return;
    addOrderTime(Date.now() - F.started);
    const st = F.stats;
    if (st.items) EM.logSession({ date: Date.now(), kind: 'fishing', title: 'Fishing in her village', items: st.items, fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk, rushed: st.rushed, relooks: 0,
      minutes: Math.round((Date.now() - F.started) / 6000) / 10, avg: st.times.length ? Math.round(st.times.reduce((a, b) => a + b, 0) / st.times.length) : 0,
      learned: [], fastKeys: st.fastKeys.slice(0, 40), byKind: { fact: { fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk }, proc: { fast: 0, slow: 0, wrong: 0, idk: 0 } } });
    F = null;
  }
  // back to the village from a job: fade, then the camera pulls out from where she was
  function leaveJob(next) {
    const from = O ? O.id : 'fish', cam = O ? O.J.mapCam : [112, 150, 96];
    finishFishing(); finishJob(); EM.speech && EM.speech.stop();
    const f = document.getElementById('vfade'); if (f) f.classList.add('on');
    setTimeout(() => { mode = 'map'; scene = null; ui.from = from; ui.arrived = false; ui.next = next || null; renderMap(); scene.cam = camAround(...cam); tweenCam({ ...CAM_FULL }, 900); const f2 = document.getElementById('vfade'); if (f2) { f2.classList.add('on'); setTimeout(() => f2.classList.remove('on'), 40); } }, 260);
  }
  function stopLoop() { loopId++; }

  // =====================================================================
  // jobs: a villager needs help, and the math is how she helps. Each job is a close-up scene running on the real
  // fact engine with the honesty rules: only right, unrushed answers pay (a coin each); "I don't know" is safe and opens
  // help, which is drawn in the scene (crates or trays of ten) with practice's own strategies and class words.
  // The screen is built for a landscape iPad: the question is on a thing in the world, numbers under her right thumb,
  // hear-it and "I don't know" under her left.
  // =====================================================================
  const JCAM = { x: 0, y: 0, w: 236, h: 236 * H / W };              // the close-up: 236 scene pixels across
  const ROSA_LOOK = { hair: '#a84a2a', skin: '#f2c49c', skinD: '#d9997a', shirt: '#4f8a5b', shirtD: '#2f5a3b', long: true };
  const BEA_LOOK = { hair: '#4a2a1a', skin: '#e8b07f', skinD: '#c98a6c', shirt: '#c06456', shirtD: '#8e4040', long: false };
  const MO_LOOK = { hair: '#3a2418', skin: '#c98a6c', skinD: '#a8705a', shirt: '#3a5aa8', shirtD: '#26346a', long: false };
  const PIP_LOOK = { hair: '#e8e8f0', skin: '#f2c49c', skinD: '#d9997a', shirt: '#7a4a2a', shirtD: '#5a3420', long: false };
  const fillN = (n, c) => Array(Math.max(0, n)).fill(c), ten = (...parts) => [...parts.flat(), ...fillN(10 - parts.flat().length, 'e')];
  // ---------- painted art (exploration): generated with Weave from a style swatch, cleaned onto the scene's pixel grid,
  // and laid out here in code. The orchard uses it when it has loaded; until then (or offline without it) the drawn
  // orchard stays. See vault notes: base plate + kit, composed, then her, Rosa, the basket and apples as sprites.
  const ART = {}; let artReady = false, mapArtReady = false;
  (function loadMapArt() {
    const names = ['village', 'pond', 'her', 'rosa', 'bea', 'mo', 'pip', 'tom'];
    let left = names.length;
    names.forEach(n => { const im = new Image(); im.onload = () => { ART['map-' + n] = im; if (--left === 0) { mapArtReady = true; if (scene && (scene.kind === 'map' || scene.kind === 'fish')) { scene.painted = true; scene.rebake(); const hz = document.querySelector('.vhaze'); if (hz) hz.className = 'vhaze off'; } } }; im.src = `art/map-${n}.png?v=3`; });
  })();
  // fine art: how many of its pixels make one scene pixel (the rest is 1)
  const ARTD = { cart: 5, parcel: 5, her: 5, rosa: 5, bea: 5, mo: 5, 'post-street': 5, 'dot-1': 5, 'dot-2': 5, 'dot-3': 5, 'dot-4': 5, 'dot-5': 5, 'dot-6': 5, basket: 5, tray: 5, 'apple-red': 5, 'apple-yellow': 5, bun: 5, 'orchard-scene': 5, 'bakery-scene': 5, 'market-scene': 5, 'market-counter': 5, pip: 5, tom: 5, 'workshop-scene': 5 };
  // the market counter's top-left in the scene (it is drawn in front of her each frame)
  const MARKET_COUNTER = [18.9, 107.8];
  // the fine map art (its own density, MAPD), loaded on its own so the rest can show first
  (function loadFineMap() {
    const names = ['ground', 'pond-ground', 'tree', 'tree-apple', 'bush', 'rock', 'reeds', 'lily', 'lily-f', 'crate-red', 'crate-yellow', 'crate-orange', 'barrel', 'board', 'fence-h', 'fence-v',
      'house-blue', 'house-gold', 'house-red', 'shop', 'stall', 'dock', 'pond-cottage', 'pond-sign', 'pond-dock', 'v-her', 'v-rosa', 'v-bea', 'v-mo', 'v-pip', 'v-tom', 'fish-orange', 'fish-gold', 'fish-shadow', 'bobber', 'fish-basket'];
    let left = names.length;
    names.forEach(n => { const im = new Image(); im.d = MAPD; im.onload = () => { ART['m-' + n] = im; if (--left === 0 && scene && (scene.kind === 'map' || scene.kind === 'fish') && mapArtReady) { scene.setDensity(MAPD); } }; im.src = `art/m-${n}.png?v=1`; });
  })();
  (function loadArt() {
    const names = ['orchard-scene', 'her', 'rosa', 'basket', 'apple-red', 'apple-yellow', 'bakery-scene', 'bea', 'tray', 'bun', 'post-street', 'mo', 'cart', 'parcel', 'market-scene', 'market-counter', 'pip', 'workshop-scene', 'tom', 'dot-1', 'dot-2', 'dot-3', 'dot-4', 'dot-5', 'dot-6']; let left = names.length;
    names.forEach(n => { const im = new Image(); im.d = ARTD[n] || 1; im.onload = () => { ART[n] = im; if (--left === 0) { artReady = true; if (scene && scene.kind === 'job' && paintedJob()) { scene.painted = true; scene.setDensity(FINE); const hz = document.querySelector('.vhaze'); if (hz) hz.className = 'vhaze off'; } } }; im.src = `art/${n}.png?v=3`; });
  })();
  const mapCopies = {};
  function mapSize(im, key, tall = 18) {
    if (!im) return null; if (mapCopies[key]) return mapCopies[key];
    const h = tall * MAPD, w = Math.round(im.width * h / im.height), c = document.createElement('canvas'); c.width = w; c.height = h; c.d = MAPD;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    // shrink in halves for a clean result
    let src = im, sw = im.width, sh = im.height;
    while (sw / 2 > w) { const t = document.createElement('canvas'); t.width = Math.round(sw / 2); t.height = Math.round(sh / 2); const tg = t.getContext('2d'); tg.imageSmoothingQuality = 'high'; tg.drawImage(src, 0, 0, t.width, t.height); src = t; sw = t.width; sh = t.height; }
    g.drawImage(src, 0, 0, w, h); return (mapCopies[key] = c);
  }
  const paintedJob = () => !!(O && O.J.art && artReady), FINE = 5;   // close-ups with painted art draw at 5x density (about the iPad's own resolution there)
  // her painted sprite in her own avatar's colours: the hair and shirt pixels take her colours, keeping their shading
  const herCache = {};
  function herArt(src = 'her') {
    const l = look(), key = `${src}|${l.hair}|${l.shirt}`; if (herCache[key]) return herCache[key];
    const im = ART[src], c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.d = dOf(im); const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const toRGB = s => s.startsWith('#') ? hex(s) : s.match(/\d+/g).map(Number);
    const hair = toRGB(l.hair), shirt = toRGB(l.shirt), lum = (r, g2, b) => 0.2126 * r + 0.7152 * g2 + 0.0722 * b;
    const cls = (r, g2, b, y) => { const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), sat = mx ? (mx - mn) / mx : 0;
      if (r > 140 && b > g2 + 15 && g2 < r - 40 && sat > 0.3) return 'shirt';             // the pink shirt (skin has less blue than green)
      if (y < c.height * .7 && mx < 175 && r >= g2 && g2 >= b - 10 && sat > 0.25) return 'hair';   // the brown hair and its highlights, above her shoes
      return null; };
    const ref = { shirt: lum(...hex('#e46a9a')), hair: lum(...hex('#6b4a32')) };
    for (let i = 0; i < p.length; i += 4) { if (p[i + 3] < 128) continue; const k = cls(p[i], p[i + 1], p[i + 2], Math.floor(i / 4 / c.width)); if (!k) continue;
      const t = k === 'shirt' ? shirt : hair, f = Math.min(1.6, lum(p[i], p[i + 1], p[i + 2]) / ref[k]);
      p[i] = Math.min(255, t[0] * f); p[i + 1] = Math.min(255, t[1] * f); p[i + 2] = Math.min(255, t[2] * f); }
    g.putImageData(d, 0, 0); herCache[key] = c; return c;
  }
  // a basket of n apples: the first four sit inside the rim, the rest heap up out of it (relative to the basket's top-left)
  const BASKET_SPOTS = [[3, 4], [8, 4], [13, 4], [17, 4], [5, 1], [10, 0], [15, 1], [7, -2], [12, -3], [10, -5]];
  function drawBasketArt(cx, base, n, kind) {
    const c = scene.frame.getContext('2d'), B = ART.basket, A = ART[kind === 'yellow' ? 'apple-yellow' : 'apple-red'], bw = B.width / dOf(B), bh = B.height / dOf(B), x = Math.round(cx - bw / 2), y = base - bh;
    put(c, B, x, y);
    for (let i = 0; i < Math.min(n, BASKET_SPOTS.length); i++) put(c, A, x + BASKET_SPOTS[i][0], y + BASKET_SPOTS[i][1]);
    const d = dOf(B), r = d > 1 ? 11 : 9; c.drawImage(B, 0, r * d, B.width, B.height - r * d, x, y + r, B.width / d, B.height / d - r);       // the front lip and wall over the lowest apples
  }
  // a tray of ten on the counter: buns sit in the cups; the one more bun (uppercase) blinks with a light rim
  // a bun's top-left in cup n (the fine tray's cups are 7.15 px apart, rows 5.7 apart)
  const trayCup = (x, base, n) => dOf(ART.tray) > 1 ? [x + 1 + (n % 5) * 7.15, base - 15.2 + Math.floor(n / 5) * 5.7] : [x + 2 + (n % 5) * 7, base - 13 + Math.floor(n / 5) * 5];
  function drawTrayArt(x, base, cells, ring) {
    const c = scene.frame.getContext('2d'); put(c, ART.tray, x, base - ART.tray.height / dOf(ART.tray));
    cells.forEach((v, n) => { if (v === 'e') return; const [bx, by] = trayCup(x, base, n);
      if (v === v.toUpperCase() && ring) { c.fillStyle = '#fff3b0'; c.fillRect(bx - 1, by - 1, 8, 6); }
      put(c, ART.bun, bx, by); });
  }
  // the painted Dot: her face follows the moment (cheer on a right answer, curious in help, a blink now and then)
  function drawDotArt(at, t, O) {
    const mood = O && O.phase === 'right' ? 3 : O && (O.crates || O.phase === 'help') ? 4 : O && O.phase === 'solved' ? 5 : (t % 4200) < 140 ? 2 : 1, im = ART[`dot-${mood}`];
    put(scene.frame.getContext('2d'), im, Math.round(at[0] - im.width / dOf(im) / 2), Math.round(at[1] - im.height / dOf(im) / 2));
  }
  // art carries its own density (im.d fine pixels per scene pixel); put draws it at its size in scene pixels, on the
  // scene's grid
  const dOf = im => im.d || 1, snap = v => { const D = (scene && scene.D) || 1; return Math.round(v * D) / D; };
  function put(c, im, x, y) { c.drawImage(im, snap(x), snap(y), im.width / dOf(im), im.height / dOf(im)); }
  function drawSpriteArt(im, cx, base) { put(scene.frame.getContext('2d'), im, cx - im.width / dOf(im) / 2, base - im.height / dOf(im)); }
  let O = null;
  const JOBS = {
    // the orchard: she and Rosa each pick apples; how many in all? (positions stay clear of the sides a 4:3 iPad crops)
    orchard: {
      npc: 'Rosa', chibi: 'rosa', art: true, order: 'Rosa needs apples', marks: 'apple', node: 'orchard', mapCam: [60, 80, 96], rounds: 'orchardRounds', log: 'Picking apples with Rosa',
      skills: ['plus12', 'teens', 'to10', 'bridge'], fact: f => f.type === 'add' && f.a > 0 && f.b > 0,
      her: [16, 134], npcAt: [134, 136], get head() { return artReady ? [142, 94] : [142, 113]; }, sign: [39, 73, 78, 28], get dotHome() { return artReady ? [24, 76] : [30, 100]; }, dotHelp: n => artReady ? (n === 1 ? [132, 92] : [130, 76]) : [n === 1 ? 126 : 150, 104],
      boxes: [[38, 138], [102, 138]],
      eq: (a, b) => `${a} + ${b} =`,
      ask: (f, i) => i % 2 ? `Your basket has ${f.a}. Mine has ${f.b}. How many apples altogether?` : `You picked ${f.a}. I picked ${f.b}. How many apples in all?`,
      solved: f => `Yes! ${f.a} and ${f.b} make ${f.ans}.`,
      // practice says "frame" and "dots"; here they are crates and apples
      words: t => String(t).replace(/\bframes\b/g, 'crates').replace(/\bframe\b/g, 'crate').replace(/\bdots\b/g, 'apples').replace(/\bdot\b/g, 'apple').replace(/empty boxes/g, 'empty spots').replace(/empty box/g, 'empty spot'),
      // her apples red ('a'), Rosa's yellow ('b'); an apple moved over to make 10 is uppercase
      cells(f) {
        const { a, b } = f, A = a + b;
        if (a === b || Math.abs(a - b) === 1) return [ten(fillN(a, 'a')), ten(fillN(b, 'b'))];
        if (A > 10) { const herBig = a >= b, big = Math.max(a, b), small = Math.min(a, b), mine = herBig ? 'a' : 'b', other = herBig ? 'b' : 'a';
          if (big === 10) return [ten(fillN(10, mine)), ten(fillN(small, other))];
          return [ten(fillN(big, mine), fillN(10 - big, other.toUpperCase())), ten(fillN(small - (10 - big), other))]; }
        return [ten(fillN(a, 'a'), fillN(b, 'b'))];
      },
      // apples drop from the trees into the two baskets, one at a time
      deal(f, i) { const t = now(), d = [];
        for (let n = 0; n < f.a; n++) d.push({ who: 0, t0: t + 250 + n * 110, x: 24 + Math.floor(px.hash(n, i, 5) * 40), y: 18 + Math.floor(px.hash(i, n, 6) * 22) });
        for (let n = 0; n < f.b; n++) d.push({ who: 1, t0: t + 330 + n * 110, x: 100 + Math.floor(px.hash(n, i, 7) * 40), y: 18 + Math.floor(px.hash(i, n, 8) * 22) });
        return d; },
      land(who, n) { const [bx, by] = this.boxes[who];
        if (artReady) { const s = BASKET_SPOTS[Math.min(n, BASKET_SPOTS.length - 1)]; return [bx + 11 - 11 + s[0], by + 2 - 21 + s[1]]; }
        return [bx + 3 + (n % 4) * 4 + (Math.floor(n / 4) % 2) * 2, by - 14 - Math.floor(n / 4) * 3]; },
      falling: (k, x, y, who) => artReady ? put(scene.frame.getContext('2d'), ART[who ? 'apple-yellow' : 'apple-red'], x, y) : k.apple(x, y, who ? 'yellow' : 'red'),
      tags(O) { return this.boxes.map(([bx, by], i) => ({ x: bx + 11, y: artReady ? by - 24 - (O.shown[i] > 7 ? 7 : O.shown[i] > 4 ? 4 : 0) : by - 20 - Math.ceil(O.shown[i] / 4) * 3, text: O.shown[i], on: O.shown[i] > 0 })); },
      still(g, k) {
        if (artReady) { px.ground(g, W, H, {}); put(g, ART['orchard-scene'], 0, 0); k.add(118, () => k.sign(38, 118, 80, 30)); return []; }
        const path = (x, y) => y > 146 && y < 160 + Math.sin(x / 30) * 2;
        px.ground(g, W, H, { path, tall: (x, y) => y < 50 });
        for (let i = 0; i < 7; i++) k.tree(10 + i * 44 + (i % 2) * 5, 52 + (i % 2) * 5, { r: 17 + (i % 3), far: true });
        k.add(70, () => [[8, 18], [30, 30], [20, 6], [60, 24], [76, 10], [100, 34], [112, 16], [150, 28], [140, 10], [180, 30], [196, 14], [228, 24], [250, 30], [274, 14], [290, 26]].forEach(([a, b]) => k.apple(a, b, 'red', true)), false);
        k.add(140, () => [[160, 142], [4, 160], [150, 64], [64, 66], [210, 120]].forEach(([a, b]) => k.apple(a, b, 'red', b < 80)), false);
        for (let n = 0; n < 34; n++) { const x = Math.floor(px.hash(n, 3, 9) * W), y = 70 + Math.floor(px.hash(n, 4, 9) * 136); if (!path(x, y)) k.flowersGround(x, y, ['#ffffff', '#ffe066', '#ff9ac6', '#c7a6ff'][n % 4]); }
        [[262, 120], [286, 150], [250, 196], [20, 200]].forEach(([x, y], i) => k.tree(x, y, { r: 12 + (i % 2) }));
        [[200, 104], [178, 196], [120, 190]].forEach(([x, y]) => k.bush(x, y));
        k.crate(170, 132, '#e8473f'); k.crate(179, 134, '#f7c531');
        k.add(118, () => k.sign(38, 118, 80, 30));
        return [];
      },
      draw(k, t, O, hop) {
        if (O.crates) { const xs = O.crates.length === 1 ? [78] : [58, 100]; O.crates.forEach((c, i) => k.crate10(xs[i], 141, c, Math.floor(t / 350) % 2 === 0)); }
        else if (artReady) this.boxes.forEach(([bx, by], i) => drawBasketArt(bx + 11, by + 2 - hop, O.shown[i], i ? 'yellow' : 'red'));
        else this.boxes.forEach(([bx, by], i) => k.basket(bx, by - hop, O.shown[i], i ? 'yellow' : 'red'));
        if (artReady) { const b = O.phase === 'right' ? hop : 0; k.shadowEll(this.her[0] + 8, this.her[1], 9, 2); k.shadowEll(this.npcAt[0] + 8, this.npcAt[1], 10, 2);
          drawSpriteArt(herArt(), this.her[0] + 8, this.her[1] + 1 - b); drawSpriteArt(ART.rosa, this.npcAt[0] + 8, this.npcAt[1] + 1 - b); return; }
        drawHer(k, t, this.her, O, hop); drawNpc(k, t, this, O, hop);
      },
    },
    // the bakery: Bea and she each bake a tray of buns, the same or one more (doubles and near doubles); the trays
    // are trays of ten, so help can say "double 6" and point at both
    bakery: {
      npc: 'Bea', chibi: 'bea', art: true, order: 'Bea needs buns baked', marks: 'bun', node: 'bakery', mapCam: [136, 44, 96], rounds: 'bakeryRounds', log: 'Baking buns with Bea',
      skills: ['doubles', 'near'], fact: f => f.type === 'add' && f.a > 0 && f.b > 0 && Math.abs(f.a - f.b) <= 1,
      her: [16, 134], npcAt: [134, 136], get head() { return artReady ? [142, 96] : [142, 113]; }, sign: [39, 73, 78, 28], get dotHome() { return artReady ? [24, 76] : [30, 100]; }, dotHelp: () => artReady ? [130, 76] : [150, 100],
      trays: [[50, 142], [92, 142]],
      eq: (a, b) => `${a} + ${b} =`,
      ask: (f, i) => { const buns = n => `${n} bun${n === 1 ? '' : 's'}`; return f.a === f.b ? (i % 2 ? `I baked ${buns(f.b)}. You baked the same. How many buns in all?` : `You baked ${buns(f.a)}, and I baked the same. How many buns in all?`) : `You baked ${buns(f.a)}. I baked ${buns(f.b)}. How many buns in all?`; },
      solved: f => `Yes! ${f.a} and ${f.b} make ${f.ans}.`,
      words: t => String(t).replace(/\bframes\b/g, 'trays').replace(/\bframe\b/g, 'tray').replace(/\bdots\b/g, 'buns').replace(/\bdot\b/g, 'bun'),
      // her buns on the left tray, Bea's on the right; for a near double the one more bun is marked
      cells(f) { const t = n => ten(fillN(n, 'a')); if (f.a === f.b) return [t(f.a), t(f.b)]; const small = Math.min(f.a, f.b); const more = n => ten(fillN(small, 'a'), ['B']);
        return f.a < f.b ? [t(f.a), more(f.b)] : [more(f.a), t(f.b)]; },
      // Bea sets the buns out one at a time
      deal(f, i) { const t = now(), d = []; for (let n = 0; n < f.a; n++) d.push({ who: 0, t0: t + 250 + n * 100, x: 132, y: 112 }); for (let n = 0; n < f.b; n++) d.push({ who: 1, t0: t + 250 + (f.a + n) * 100, x: 132, y: 112 }); return d; },
      land(who, n) { const [x, y] = this.trays[who]; return artReady ? trayCup(x, y - 2, Math.min(n, 9)) : [x + 2 + (n % 5) * 7, y - 15 + Math.floor(n / 5) * 8]; },
      falling: (k, x, y) => artReady ? put(scene.frame.getContext('2d'), ART.bun, x, y) : k.bun(x, y),
      tags(O) { return this.trays.map(([x, y], i) => ({ x: x + 19, y: y - 22, text: O.shown[i], on: O.shown[i] > 0 })); },
      still(g, k) {
        if (artReady) { px.ground(g, W, H, {}); put(g, ART['bakery-scene'], 0, 0); k.add(118, () => k.sign(38, 118, 80, 30)); return []; }
        const path = (x, y) => y > 146 && y < 160 + Math.sin(x / 30) * 2;
        px.ground(g, W, H, { path });
        k.house(-6, 52, 48, 'blue', { chimney: true, lit: true, far: true }); k.house(176, 52, 44, 'red', { far: true });
        // the bakery's front (gold roof, like on the map): a striped awning and a bun sign
        k.house(66, 60, 84, 'gold', { chimney: true, lit: true });
        k.add(61, () => { for (let i = 0; i < 88; i++) k.P(64 + i, 58, Math.floor(i / 6) % 2 ? '#efe8dc' : '#c06456'); k.R(98, 18, 20, 9, C.k1); k.R(99, 19, 18, 7, C.k3); k.bun(101, 21); k.bun(109, 21); }, false);
        [[250, 100], [280, 150], [228, 190], [16, 196]].forEach(([x, y], i) => k.tree(x, y, { r: 11 + (i % 2) }));
        k.barrel(200, 120); k.crate(212, 124, '#f2c94c');
        k.add(118, () => k.sign(38, 118, 80, 30));
        return [];
      },
      draw(k, t, O, hop) {
        if (artReady) { const cells = O.crates || [ten(fillN(O.shown[0], 'a')), ten(fillN(O.shown[1], 'a'))], ring = Math.floor(t / 350) % 2 === 0, b = O.phase === 'right' ? hop : 0;
          this.trays.forEach(([x, y], i) => drawTrayArt(x, y - 2 - b, cells[i], ring));
          k.shadowEll(this.her[0] + 8, this.her[1], 9, 2); k.shadowEll(this.npcAt[0] + 8, this.npcAt[1], 10, 2);
          drawSpriteArt(herArt(), this.her[0] + 8, this.her[1] + 1 - b); drawSpriteArt(ART.bea, this.npcAt[0] + 8, this.npcAt[1] + 1 - b); return; }
        // the table, and the two trays (help marks the one more bun)
        k.R(44, 140, 92, 4, C.k3); k.R(44, 140, 92, 1, C.k4); k.R(44, 143, 92, 1, C.k1); k.R(48, 144, 3, 10, C.k1); k.R(129, 144, 3, 10, C.k1);
        const cells = O.crates || [ten(fillN(O.shown[0], 'a')), ten(fillN(O.shown[1], 'a'))];
        this.trays.forEach(([x, y], i) => k.bunTray10(x, y - (O.phase === 'right' ? hop : 0), cells[i], Math.floor(t / 350) % 2 === 0));
        drawHer(k, t, this.her, O, hop); drawNpc(k, t, this, O, hop);
      },
    },
    // the market: Mr. Pip buys a pie and pays with a handful of coins; how many coins back? (take-away facts)
    market: {
      npc: 'Mr. Pip', chibi: 'pip', art: true, order: 'Mr. Pip wants pies', marks: 'pie', node: 'market', mapCam: [262, 168, 96], rounds: 'marketRounds', log: 'Selling pies to Mr. Pip',
      skills: ['tenminus', 'sub10', 'subteen'], fact: f => f.type === 'sub' && f.b > 0 && f.a > f.b,
      her: [100, 120], npcAt: [138, 150], get head() { return artReady ? [146, 106] : [146, 127]; }, sign: [30, 121, 88, 16], dotHome: [14, 96], dotHelp: () => [158, 100], chalk: true,
      eq: (a, b) => `${a} − ${b} =`,
      ask: (f, i) => i % 2 ? `I have ${f.a} coins. One pie is ${f.b}. How many coins do I get back?` : `Here are ${f.a} coins. The pie costs ${f.b}. How many coins back?`,
      solved: f => `Yes! ${f.a} take away ${f.b} is ${f.ans}.`,
      words: t => String(t).replace(/\bframes\b/g, 'trays').replace(/\bframe\b/g, 'tray').replace(/\bdots\b/g, 'coins').replace(/\bdot\b/g, 'coin').replace(/empty boxes/g, 'empty spots').replace(/empty box/g, 'empty spot'),
      // his coins in trays of ten; the ones that pay for the pie ('x') go in her money box, the way practice's help takes them
      cells(f) {
        const { a, b } = f, ones = a - 10, A = a - b;
        if (a <= 10) return [ten(fillN(a - b, 'a'), fillN(b, 'x'))];
        if (b <= 2) return [ten(fillN(10, 'a')), ten(fillN(ones - b, 'a'), fillN(b, 'x'))];
        if (b === 10) return [ten(fillN(10, 'x')), ten(fillN(ones, 'a'))];
        if (b === ones) return [ten(fillN(10, 'a')), ten(fillN(ones, 'x'))];
        if (A <= 4 || b >= 6) return [ten(fillN(10 - b, 'a'), fillN(b, 'x')), ten(fillN(ones, 'a'))];
        return [ten(fillN(10 - (b - ones), 'a'), fillN(b - ones, 'x')), ten(fillN(ones, 'x'))];
      },
      // he counts his coins onto the counter, one at a time
      deal(f, i) { const t = now(), d = []; for (let n = 0; n < f.a; n++) d.push({ who: 0, t0: t + 300 + n * 95, x: 140, y: 128 }); return d; },
      pile: n => [52 + (n % 7) * 6 + (Math.floor(n / 7) % 2) * 3, 112 - Math.floor(n / 7) * 3],
      land(who, n) { return this.pile(n); },
      falling: (k, x, y) => k.coin(x, y),
      tags(O) { return [{ x: 72, y: 100 - Math.ceil(O.shown[0] / 7) * 3, text: O.shown[0], on: O.shown[0] > 0 && !O.crates }, { x: 36, y: 100, text: `${O.f.b} coin${O.f.b === 1 ? "" : "s"}`, on: O.phase !== 'pick' }]; },
      // the painted plaza with the stall (one picture); the counter is its own piece, drawn in front of her each frame
      still(g, k) { if (!artReady) return this.drawnStill(g, k); put(g, ART['market-scene'], 0, 0); return []; },
      drawnStill(g, k) {
        px.ground(g, W, H, { path: (x, y) => y > 56 && !(x < 6 && y > 150) });
        k.house(-6, 52, 44, 'blue', { chimney: true, far: true }); k.house(118, 48, 36, 'gold', { far: true }); k.house(176, 52, 48, 'red', { chimney: true, lit: true, far: true });
        k.barrel(44, 66); k.barrel(52, 68); k.crate(104, 64, '#e8473f'); k.crate(160, 68, '#f7c531'); k.barrel(220, 120); k.crate(206, 150, '#f7c531');
        [[250, 96], [280, 140], [262, 190]].forEach(([x, y], i) => k.tree(x, y, { r: 11 + (i % 2) }));
        // the stall's awning and posts (the counter is drawn in front of her each frame)
        const sx = 22, sw = 104;
        k.add(60, () => { k.R(sx + 2, 66, 3, 54, C.k1); k.R(sx + sw - 5, 66, 3, 54, C.k1); k.R(sx + 2, 66, 1, 54, C.k3); k.R(sx + sw - 5, 66, 1, 54, C.k3);
          for (let j = 0; j < 14; j++) for (let i = -4 + Math.floor(j / 3); i < sw + 4 - Math.floor(j / 3); i++) { const st = Math.floor((i + 40) / 9) % 2; k.P(sx + i, 56 + j, j === 0 ? '#6e3a3a' : st ? (j < 3 ? '#fbf6ec' : '#efe8dc') : (j < 3 ? '#d8786a' : '#c06456')); }
          for (let i = -2; i < sw + 2; i += 9) k.ell(sx + i + 4, 71, 4, 2, Math.floor((i + 42) / 9) % 2 ? '#efe8dc' : '#c06456'); }, false);
        return [];
      },
      draw(k, t, O, hop) {
        if (artReady) { const b = O.phase === 'right' ? hop : 0, ct = 118, c = k.g;
          drawSpriteArt(herArt(), this.her[0] + 8, this.her[1] + 1 - b);
          put(c, ART['market-counter'], MARKET_COUNTER[0], MARKET_COUNTER[1]);
          if (O.crates) { const xs = O.crates.length === 1 ? [44] : [22, 61]; O.crates.forEach((cr, i) => k.tray10(xs[i], ct - 3, cr, Math.floor(t / 350) % 2 === 0)); }
          else for (let n = 0; n < O.shown[0]; n++) { const [x, y] = this.pile(n); k.coin(x, y - (O.phase === 'right' ? hop : 0)); }
          k.shadowEll(this.npcAt[0] + 8, this.npcAt[1], 10, 2); drawSpriteArt(ART.pip, this.npcAt[0] + 8, this.npcAt[1] + 1 - b); return; }
        drawHer(k, t, this.her, O, hop);
        // the counter in front of her, the pie with its price, his coins (or the trays while helping)
        const sx = 22, sw = 104, ct = 118;
        k.R(sx, ct, sw, 24, C.k1); for (let j = 1; j < 23; j++) k.R(sx + 1, ct + j, sw - 2, 1, j % 7 === 0 ? C.k1 : j % 7 === 1 ? C.k3 : C.k2);
        k.R(sx - 2, ct - 3, sw + 4, 4, C.k3); k.R(sx - 2, ct - 3, sw + 4, 1, C.k4); k.R(sx - 2, ct, sw + 4, 1, C.k1);
        k.R(sx + 6, ct + 2, sw - 12, 20, C.k3); k.R(sx + 8, ct + 4, sw - 16, 16, '#2f4a3a'); k.R(sx + 8, ct + 4, sw - 16, 1, '#24392c');
        k.pie(24, ct - 8); k.pie(37, ct - 9);
        if (O.crates) { const xs = O.crates.length === 1 ? [44] : [22, 61]; O.crates.forEach((c, i) => k.tray10(xs[i], ct - 3, c, Math.floor(t / 350) % 2 === 0)); }
        else for (let n = 0; n < O.shown[0]; n++) { const [x, y] = this.pile(n); k.coin(x, y - (O.phase === 'right' ? hop : 0)); }
        drawNpc(k, t, this, O, hop);
      },
    },
    // the post office: Mo the mail carrier. Read the place-value discs on a package (or count on along the street) to
    // find which house it goes to. Place value, graded like practice's big-number skills.
    post: {
      npc: 'Mo', chibi: 'mo', art: true, order: 'Mo needs help with the mail', marks: 'mail', node: 'post', mapCam: [150, 92, 96], rounds: 'postRounds', log: 'Delivering mail with Mo',
      skills: ['pv_build', 'pv_count'], proc: true, maxLen: 5, tagCount: 3,
      her: [84, 144], get npcAt() { return artReady ? [146, 136] : [158, 136]; }, get head() { return artReady ? [154, 97] : [166, 113]; }, sign: [11, 81, 72, 24], dotHome: [44, 118], dotHelp: () => artReady ? [130, 92] : [146, 94],
      houses: [6, 64, 122], labelAt: [108, 100], labelW: 50,
      // three houses on the street: the right one and two that are easy to mix up with it (digits swapped, or one place off)
      setup(O) {
        const n = O.f.ans, d = String(n).split(''), L = d.length, sw = (i, j) => { const x = d.slice(); [x[i], x[j]] = [x[j], x[i]]; return Number(x.join('')); };
        const alts = [sw(L - 2, L - 1), sw(L - 3, L - 2), n + 10, n - 10, n + 100, n - 100].filter((m, i, a) => m !== n && String(m).length === L && a.indexOf(m) === i);
        O.houses = EM.shuffle([n, ...EM.shuffle(alts).slice(0, 2)]);
      },
      ask: (f, i, O) => O.item.skillId === 'pv_count' ? 'I deliver along the street, counting on. Which house comes next?' : 'Read the label on this package. Which house is it for?',
      solved: f => `Yes! It goes to ${EM.fmt(f.ans)}.`,
      words: t => t,
      signHtml: (O, slot) => `<span>House</span>${slot}`,
      label(O) { const st = O.item.steps[0]; if (O.help && O.help.vis) return O.help.vis; return O.item.skillId === 'pv_build' ? O.item.visFor(0) : st.html.replace(/<span class="slot[^"]*">(&nbsp;)?<\/span>/, '<b class="q">?</b>'); },
      deal() { return [{ who: 0, t0: now() + 200, x: -20, y: 108 }]; },
      land: () => [104, 104],
      falling: (k, x, y) => artReady ? put(k.g, ART.parcel, x, y) : k.package(x, y, 18, 12),
      tags(O) { return O.houses.map((n, i) => ({ x: this.houses[i] + 22, y: 36, text: EM.fmt(n), on: true, hit: O.phase === 'right' || O.phase === 'solved' ? n === O.f.ans : false })); },
      // the painted street (one painting, traced from the drawn one below, with an evening sky behind the roofs)
      still(g, k) { if (!artReady) return this.drawnStill(g, k); put(g, ART['post-street'], 0, 0); return []; },
      drawnStill(g, k) {
        px.ground(g, W, H, { path: (x, y) => y > 70 && y < 88 + Math.sin(x / 40) * 2, tall: (x, y) => y > 190 });
        this.houses.forEach((x, i) => k.house(x, 66, 44, ['red', 'blue', 'gold'][i], { chimney: i !== 1, lit: i === 1 }));
        k.house(180, 66, 44, 'red', { chimney: true });
        [[244, 100], [270, 150], [230, 190], [16, 196]].forEach(([x, y], i) => k.tree(x, y, { r: 11 + (i % 2) }));
        k.bush(200, 120); k.fence(0, 104, 0, 104);
        // a mailbox by the sign
        k.add(122, () => { k.R(4, 106, 2, 16, C.k1); k.R(0, 98, 10, 8, '#c06456'); k.R(0, 98, 10, 1, '#d8786a'); k.R(9, 96, 1, 4, C.k1); k.R(9, 96, 3, 2, '#e8473f'); });
        k.add(122, () => k.sign(10, 122, 74, 26));
        return [];
      },
      draw(k, t, O, hop) {
        if (artReady) { k.shadowEll(118, 140, 30, 3); put(k.g, ART.cart, 85, 107); if (O.phase !== 'pick') put(k.g, ART.parcel, 96 - (O.phase === 'right' ? hop : 0), 104); }
        else { k.cart(88, 132); if (O.phase !== 'pick') k.package(96 - (O.phase === 'right' ? hop : 0), 104, 18, 12); k.package(118, 110, 12, 8); k.package(132, 108, 10, 9); }
        if (artReady) { const b = O.phase === 'right' ? hop : 0; k.shadowEll(this.her[0] + 8, this.her[1], 9, 2); k.shadowEll(this.npcAt[0] + 8, this.npcAt[1], 10, 2);
          drawSpriteArt(herArt(), this.her[0] + 8, this.her[1] + 1 - b); drawSpriteArt(ART.mo, this.npcAt[0] + 8, this.npcAt[1] + 1 - b); return; }
        drawHer(k, t, this.her, O, hop); drawNpc(k, t, this, O, hop);
      },
    },
  };
  const jobOpen = id => JOBS[id].skills.some(s => EM.isOpen(s));

  // =====================================================================
  // places: Tom's workshop (column math) and the notes on the board (story problems). These are practice's own
  // multi-step problems, with their pictures, steps, help and scratchpad, run inside a village frame: a close-up of
  // the place behind, the problem on a paper note, a coin for each one solved without help, Tom's hello, and a
  // surprise after three rounds. app.js runs the problems (EM.startSession('workshop' | 'notes')); this is the place.
  // =====================================================================
  const TOM_LOOK = { hair: '#9a5a2a', skin: '#e0a882', skinD: '#c08a6c', shirt: '#b88a5a', shirtD: '#8a6040', long: false };
  const PLACES = {
    workshop: { npc: 'Tom', chibi: 'tom', title: "Tom's workshop", order: 'Tom is building', marks: 'plank', goal: 3, skills: ['regroup', 'trade'], rounds: 'workshopRounds', node: 'workshop', mapCam: [186, 70, 96], log: 'Building with Tom',
      done: 'Tom finished building!', paid: n => `Tom paid you ${n} coins.`, closed: "That's Tom's workshop. He builds with big numbers. It opens when you learn to trade tens!",
      right: ['Measured just right!', 'That plank fits!', 'Perfect cut!', 'Nice building!'], still: workshopStill },
    notes: { npc: 'The village', title: 'Notes from the village', order: 'Help with the notes', marks: 'paper', goal: 4, skills: ['words'], rounds: 'notesRounds', node: 'board', mapCam: [188, 100, 96], log: 'Story problems on the board',
      done: 'Every note is answered!', paid: n => `Your neighbors left ${n} coins on the board.`, closed: "The notes need story problems. They open soon!",
      right: ['Note answered!', 'They will be so glad!', 'That helps a lot!', 'You figured it out!'], still: notesStill },
  };
  const placeOpen = id => PLACES[id].skills.some(s => EM.isOpen(s));
  // the cast of the village's story problems: her neighbors, and village things
  const STORY_CAST = () => ({ who: ['Rosa', 'Bea', 'Mo', 'Mr. Pip', 'Tom', String((S().avatar && S().avatar.name) || 'Mia')], things: ['apples', 'buns', 'pies', 'fish', 'letters', 'packages', 'flowers', 'shells', 'acorns', 'pebbles'], colored: ['flowers', 'shells', 'pebbles', 'ribbons', 'buttons'] });
  const placeArt = {};
  function frameArt(id) {
    if (placeArt[id]) return placeArt[id];
    const fine = artReady && ART[id + '-scene'];
    if (fine) { const big = document.createElement('canvas'); big.width = W * 4; big.height = H * 4; const bg = big.getContext('2d'); bg.imageSmoothingQuality = 'high'; bg.drawImage(fine, 0, 0, big.width, big.height); return (placeArt[id] = big.toDataURL('image/png')); }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), k = px.kit(g);
    PLACES[id].still(g, k); k.bake(W, H);
    const big = document.createElement('canvas'); big.width = W * 4; big.height = H * 4; const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(c, 0, 0, big.width, big.height);
    return (placeArt[id] = big.toDataURL('image/png'));
  }
  function faceArt(chibi) {
    const fine = artReady && ART[chibi];
    if (fine) { const big = document.createElement('canvas'); big.width = 96; big.height = 78; const g = big.getContext('2d'); g.imageSmoothingQuality = 'high';
      const s = 78 / (fine.height * .62), dw = fine.width * s; g.drawImage(fine, 0, 0, fine.width, fine.height * .62, (96 - dw) / 2, 0, dw, 78); return big.toDataURL(); }   // the top half: head and shoulders
    const c = document.createElement('canvas'), ch = px.CHIBI[chibi](); c.width = 16; c.height = 13; px.kit(c.getContext('2d')).chibi(0, ch.rows.length, ch.rows, ch.mat, { noShadow: true });
    const big = document.createElement('canvas'); big.width = 16 * 6; big.height = 13 * 6; const g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, big.width, big.height); return big.toDataURL();
  }
  // the notes' badge: a pinned note
  function noteArt() {
    const c = document.createElement('canvas'); c.width = 16; c.height = 13; const k = px.kit(c.getContext('2d'));
    k.R(3, 2, 11, 11, '#a8978a'); k.R(2, 1, 11, 11, '#fdf3c8'); k.R(2, 1, 11, 1, '#ffffff'); [4, 6, 8, 10].forEach((y, i) => k.R(4, y, i % 2 ? 5 : 7, 1, '#a8978a')); k.R(7, 0, 2, 2, '#d84a4a'); k.P(7, 0, '#ff9a8a');
    const big = document.createElement('canvas'); big.width = 96; big.height = 78; const g = big.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, 96, 78); return big.toDataURL();
  }
  // what app.js needs to frame a session here
  function frame(id) {
    const P = PLACES[id];
    return { id, title: P.title, order: P.order, marks: P.marks, goal: P.goal, got: 0, art: frameArt(id), face: P.chibi ? faceArt(P.chibi) : noteArt(), right: P.right, coin: COIN(), cast: id === 'notes' ? STORY_CAST() : null };
  }
  function pay(n = 1) { V().coins += n; EM.save(); }
  function toPlace(id) {
    const P = PLACES[id];
    if (!placeOpen(id)) return say(P.closed);
    ui.busy = true; her.path = [];
    tweenCam(camAround(...P.mapCam), 800, () => { const f = document.getElementById('vfade'); if (f) f.classList.add('on'); setTimeout(() => { ui.busy = false; enterPlace(id); }, 260); });
  }
  function enterPlace(id) {
    stopLoop();
    const met = V().met = V().met || {};
    if (!met[id] && MEET[id]) { met[id] = Date.now(); EM.save(); return hello(id, () => EM.startSession(id)); }
    EM.startSession(id);
  }
  // the first visit: the villager's hello, over the place itself
  function hello(id, then) {
    const P = PLACES[id], ov = document.createElement('div'); ov.className = 'vover vhello'; ov.style.backgroundImage = `url(${frameArt(id)})`;
    ov.innerHTML = `<div class="vcard"><div class="vcard-art"><img class="vface" src="${P.chibi ? faceArt(P.chibi) : noteArt()}" alt=""></div><p>${esc(MEET[id])}</p><div class="vrow"><button class="big-btn" data-ov="go">Let's go!</button></div></div>`;
    document.body.appendChild(ov); EM.speech && EM.speech.say(MEET[id]);
    ov.addEventListener('click', e => { if (!e.target.closest('[data-ov]')) return; ov.remove(); EM.speech && EM.speech.stop(); then(); });
  }
  // back from a place: a full round pays out its thanks (and after three, a surprise); otherwise just home
  function placeDone(fr, ms) {
    const P = PLACES[fr.id], v = V();
    addOrderTime(ms); mode = 'map'; ui.from = P.node; ui.arrived = false; ui.next = null;
    if (fr.got >= fr.goal) {
      v[P.rounds] = (v[P.rounds] || 0) + 1; EM.save();
      const g = giftDue(fr.id);
      ui.next = () => { sfx('yours'); celebrate(P.done, `${P.paid(fr.got)} You have ${v.coins} coins.${g ? '' : untilGift(fr.id)}`, () => { if (g) giveGift(g, () => {}, fr.id); }, g ? [['Yay!', 'keep']] : [['Yay!', 'keep'], ['Spend them', 'tobuild']]); };
    } else if (fr.got) ui.next = () => say(`You earned ${fr.got} coin${fr.got === 1 ? '' : 's'}. Come back any time!`);
  }
  // the workshop, close up: plank walls, a window, tools on the wall, a workbench with a plank on it, wood shavings
  function workshopStill(g, k) {
    g.fillStyle = '#6a4a38'; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 12) { k.R(x, 0, 12, 150, (x / 12) % 3 === 1 ? '#8a6248' : (x / 12) % 3 === 2 ? '#7e5840' : '#946a4e'); k.R(x, 0, 1, 150, '#5a3e30'); for (let y = 6 + (x * 7) % 23; y < 150; y += 31) { k.R(x + 4, y, 3, 1, '#6e4c3a'); k.P(x + 5, y + 1, '#6e4c3a'); } }
    k.R(0, 24, W, 6, '#5a3e30'); k.R(0, 24, W, 1, '#b08a68'); k.R(0, 29, W, 1, '#3e2a22');
    // the window, with the village outside
    { const x = 196, y = 40, w = 70, h = 46; k.R(x - 3, y - 3, w + 6, h + 6, '#4a3228'); k.R(x, y, w, h, '#bcdcf0'); k.R(x, y + h - 14, w, 14, '#8cc07a'); k.R(x, y + h - 14, w, 1, '#a8d290'); k.R(x + 8, y + h - 24, 14, 10, '#d9c4a0'); k.R(x + 6, y + h - 28, 18, 4, '#c06456'); k.R(x + 44, y + h - 26, 4, 12, '#6e4c3a'); for (let i = 0; i < 9; i++) k.R(x + 38 + Math.round(Math.sin(i) * 2), y + h - 34 + i, 16 - Math.abs(i - 4) * 2, 1, i < 3 ? '#a6cf86' : '#7aa863');
      k.R(x, y + 8, 18, 3, '#ffffff'); k.R(x + 4, y + 6, 10, 2, '#ffffff'); k.R(x + w / 2 - 1, y, 3, h, '#4a3228'); k.R(x, y + h / 2 - 1, w, 3, '#4a3228'); k.R(x - 5, y + h + 3, w + 10, 4, '#a07a5a'); k.R(x - 5, y + h + 3, w + 10, 1, '#c8a27e'); }
    // tools on the wall: a saw, two hammers, a ruler, a coil of rope
    k.R(16, 48, 150, 3, '#4a3228');
    { const x = 22, y = 54; k.R(x, y, 34, 12, '#c9ced8'); for (let i = 0; i < 34; i += 2) k.P(x + i, y + 12, '#9aa0ae'); k.R(x, y, 34, 1, '#eef0f6'); k.R(x + 34, y - 2, 9, 14, '#a85a3a'); k.R(x + 37, y + 2, 3, 6, '#6a4a38'); }
    [[70, 52], [86, 52]].forEach(([x, y], i) => { k.R(x + 3, y, 2, 22 - i * 3, '#c8935e'); k.R(x + 3, y, 1, 22 - i * 3, '#e2b07a'); k.R(x, y, 8, 5, '#7e8694'); k.R(x, y, 8, 1, '#b8bec8'); });
    { const x = 104, y = 54; k.R(x, y, 6, 34, '#f2c94c'); for (let j = 0; j < 34; j += 3) k.R(x, y + j, j % 9 ? 2 : 4, 1, '#6a4a10'); }
    { const cx = 136, cy = 66; for (let r = 10; r > 3; r -= 2) for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2; k.P(Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r * .9), r % 4 ? '#d9b878' : '#b8945a'); } }
    // a shelf with jars of nails
    k.R(16, 98, 120, 3, '#a07a5a'); k.R(16, 98, 120, 1, '#c8a27e'); [[22, '#cfe0ea'], [40, '#e8d8b0'], [58, '#cfe0ea'], [100, '#e2c890']].forEach(([x, c]) => { k.R(x, 86, 10, 12, c); k.R(x, 84, 10, 2, '#6a4a38'); k.R(x + 2, 92, 6, 4, '#8a8a96'); k.R(x + 1, 87, 2, 8, '#ffffff'); });
    k.R(76, 88, 16, 10, '#b88a5a'); k.R(76, 88, 16, 1, '#d8b080');
    // the floor
    for (let y = 150; y < H; y += 7) { k.R(0, y, W, 7, (y / 7) % 2 ? '#b88a62' : '#a87c56'); k.R(0, y, W, 1, '#8a6244'); for (let x = (y * 13) % 40; x < W; x += 47) k.R(x, y + 1, 1, 6, '#8a6244'); }
    for (let n = 0; n < 60; n++) { const x = Math.floor(px.hash(n, 3, 71) * W), y = 152 + Math.floor(px.hash(n, 4, 71) * (H - 154)); k.P(x, y, n % 3 ? '#e8cc98' : '#f4e0b4'); if (n % 4 === 0) k.P(x + 1, y, '#e8cc98'); }
    // the workbench, with a plank and shavings on it
    k.add(150, () => { const x = 24, y = 124, w = 252; k.R(x, y, w, 7, '#c8935e'); k.R(x, y, w, 1, '#e8b880'); k.R(x, y + 6, w, 1, '#7e5638'); k.R(x, y + 7, w, 4, '#a8764a'); k.R(x, y + 10, w, 1, '#6e4a30');
      [x + 6, x + w - 14].forEach(a => { k.R(a, y + 11, 8, 30, '#8a6040'); k.R(a, y + 11, 2, 30, '#a8764a'); }); k.R(x + 6, y + 30, w - 12, 4, '#7e5638');
      k.R(x + 60, y - 5, 90, 5, '#e2b07a'); k.R(x + 60, y - 5, 90, 1, '#f4cc94'); k.R(x + 60, y - 1, 90, 1, '#a87c56'); for (let i = 70; i < 150; i += 19) k.R(x + i, y - 4, 6, 1, '#c8935e');
      [[x + 160, y - 3], [x + 168, y - 2], [x + 30, y - 2]].forEach(([a, b]) => { k.R(a, b, 5, 2, '#f4dcaa'); k.P(a + 1, b - 1, '#f4dcaa'); });
      k.R(x + 190, y - 9, 16, 9, '#7e8694'); k.R(x + 190, y - 9, 16, 2, '#b8bec8'); k.R(x + 196, y - 13, 4, 4, '#5a606c'); }, false);
    // planks leaning in the corner
    [0, 6, 11].forEach((d, i) => { const x = 280 + d; k.add(150, () => { k.line(x, 150, x + 10, 34, '#7e5638'); k.line(x + 1, 150, x + 11, 34, i % 2 ? '#d8a670' : '#c8935e'); k.line(x + 2, 150, x + 12, 34, '#e2b07a'); k.line(x + 3, 150, x + 13, 34, '#a8764a'); }, false); });
    return [];
  }
  // the notice board, close up: a big cork board crowded with the village's notes, under its little roof
  function notesStill(g, k) {
    px.ground(g, W, H, {});
    [[20, 60], [282, 70], [40, 200], [262, 200]].forEach(([x, y], i) => k.tree(x, y, { r: 12 + (i % 2), far: y < 100 }));
    k.add(170, () => {
      const x = 22, y = 22, w = 256, h = 140;
      k.R(x + 10, y + h, 8, 40, '#6e4c3a'); k.R(x + w - 18, y + h, 8, 40, '#6e4c3a'); k.R(x + 10, y + h, 2, 40, '#8a6248'); k.R(x + w - 18, y + h, 2, 40, '#8a6248');
      for (let j = 0; j < 10; j++) k.R(x - 10 + j, y - 16 + j, w + 20 - 2 * j, 1, j === 9 ? '#5a2e2e' : j % 2 ? '#a84a3e' : '#c06456');
      k.R(x - 4, y - 6, w + 8, h + 10, '#6e4c3a'); k.R(x - 4, y - 6, w + 8, 2, '#946a4e'); k.R(x, y, w, h, '#c8a070');
      for (let n = 0; n < 500; n++) k.P(x + Math.floor(px.hash(n, 7, 81) * w), y + Math.floor(px.hash(n, 8, 81) * h), n % 2 ? '#b88e60' : '#d8b484');
      const notes = [[8, 8, 50, 40, '#f7ecd0'], [66, 14, 44, 36, '#ffe9a0'], [118, 6, 56, 44, '#d9ecff'], [182, 12, 64, 40, '#f7ecd0'], [12, 60, 54, 46, '#ffd9e4'], [74, 62, 48, 40, '#f7ecd0'], [132, 58, 52, 50, '#e2f2d0'], [192, 62, 56, 44, '#ffe9a0'], [26, 112, 40, 24, '#d9ecff'], [168, 114, 50, 22, '#f7ecd0']];
      notes.forEach(([a, b, nw, nh, c], i) => { const X = x + a, Y = y + b; k.R(X + 2, Y + 2, nw, nh, 'rgba(60,40,20,.25)'); k.R(X, Y, nw, nh, c); k.R(X, Y, nw, 1, '#ffffff');
        for (let l = 8; l < nh - 4; l += 6) k.R(X + 5, Y + l, nw - 10 - ((l * 7 + i * 5) % 14), 1, '#a8978a'); k.R(X + nw / 2 - 1, Y - 1, 3, 3, ['#d84a4a', '#3d6bd6', '#2e7d4f', '#e2ae52'][i % 4]); k.P(X + nw / 2 - 1, Y - 1, '#ffffff'); });
    });
    return [];
  }
  function drawHer(k, t, [x, y], O, hop) { const l = look(), c = px.CHIBI.her(l, l.long); k.chibi(x, y, c.rows, c.mat, { blink: (t % 3600) < 120, bob: O.phase === 'right' ? hop : 0 }); }
  function drawNpc(k, t, J, O, hop) { const c = px.CHIBI[J.chibi](); k.chibi(J.npcAt[0], J.npcAt[1], c.rows, c.mat, { flip: true, blink: ((t + 900) % 4100) < 120, bob: O.phase === 'right' ? hop : 0 }); }

  function toJob(id) {
    const J = JOBS[id];
    ui.busy = true; her.path = [];
    tweenCam(camAround(...J.mapCam), 800, () => { const f = document.getElementById('vfade'); if (f) f.classList.add('on'); setTimeout(() => { ui.busy = false; startJob(id); }, 260); });
  }
  const toOrchard = () => toJob('orchard'), toMarket = () => toJob('market'), toPost = () => toJob('post'), toBakery = () => toJob('bakery');
  // Mr. Pip's stall opens with the take-away facts (Ten Take Away needs Partners of 10)
  function marketTap() { if (jobOpen('market')) return toMarket(); say("Mr. Pip's stall opens once your partners of 10 get strong. Keep fishing!"); }
  // What each villager says the first time, and the surprise they promise for three full rounds
  const MEET = {
    orchard: "Hi! I'm Rosa. Apples are falling everywhere! Help me count them, and I'll pay you a coin for each one. Fill my baskets three times and I'll have a surprise for you.",
    bakery: "Hi! I'm Bea, the baker. Every tray holds ten buns. When I bake some, you bake the same, or one more. Count them up for me and I'll pay you a coin each time. Help me three times and I'll have a surprise.",
    post: "Hi, I'm Mo, the mail carrier! Every package has its house number on the label, written in number discs. Read them for me and I'll pay you a coin for each one. Help me three times and I'll have a surprise.",
    workshop: "Hi! I'm Tom, the carpenter. I build fences and benches and barns, and every plank has to be just the right length. That takes big numbers! Help me with my sums, and I'll pay you a coin for each one. Help me three times and I'll have a surprise.",
    notes: "Look! Your neighbors pinned notes on the board. Each one is a story problem they need help with. Every note you answer earns a coin. Answer them three times and the village has a surprise for you.",
    market: "Hello! I'm Mr. Pip. I buy a pie every day, but I always mix up my coins. Help me count my coins back, and there's a coin in it for you. Help me three times and I'll have a surprise.",
  };
  const GIFT = { orchard: { item: 'appletree', title: 'Rosa gave you an apple tree!', text: 'Grown from her very best apples. It\'s waiting in your yard tray.' },
    bakery: { item: 'cake', title: 'Bea baked you a cake!', text: 'A cake of your very own. It\'s waiting in your yard tray.' },
    post: { item: 'mailbox', title: 'Mo gave you a mailbox!', text: 'Now you can get letters too. It\'s waiting in your yard tray.' },
    workshop: { item: 'wheelbarrow', title: 'Tom built you a wheelbarrow!', text: 'He made it from the planks you measured. It\'s waiting in your yard tray.' },
    notes: { item: 'kite', title: 'The village made you a kite!', text: 'Everyone helped: Rosa, Bea, Mo, Mr. Pip and Tom. It\'s waiting in your yard tray.' },
    market: { item: 'kitten', title: 'Mr. Pip gave you a kitten!', text: 'One of his cat\'s kittens needs a home. It\'s waiting in your yard tray.' } };
  const PLACE = id => JOBS[id] || PLACES[id];
  const giftDue = id => (V()[PLACE(id).rounds] || 0) >= 3 && !(V().gifted || {})[id] ? GIFT[id] : null;
  function giveGift(g, next, id = O.id) {
    const v = V(); (v.gifted = v.gifted || {})[id] = Date.now(); (v.gifts = v.gifts || {})[g.item] = (v.gifts[g.item] || 0) + 1; EM.save(); sfx('unlock');
    const ov = document.createElement('div'); ov.className = 'vover';
    ov.innerHTML = `<div class="vcard"><div class="vcard-art"><img class="vgift" src="${itemIcon(g.item)}" alt=""></div><h2>${esc(g.title)}</h2><p>${esc(g.text)}</p><div class="vrow"><button class="big-btn" data-ov="tobuild">Put it in my yard</button><button class="big-btn alt" data-ov="keep">Keep going</button></div></div>`;
    document.body.appendChild(ov); EM.speech && EM.speech.say(g.title);
    ov.addEventListener('click', e => { const b = e.target.closest('[data-ov]'); if (!b) return; ov.remove(); if (b.dataset.ov === 'tobuild') return leaveJob(() => enterBuild(null)); next(); });
  }
  const untilGift = id => { const left = 3 - (V()[PLACE(id).rounds] || 0), who = PLACE(id).npc; return left > 0 && !(V().gifted || {})[id] ? ` ${left} more until ${who === 'The village' ? "the village's" : `${who}'s`} surprise!` : ''; };
  function startJob(id) {
    mode = 'job';
    O = { id, J: JOBS[id], queue: [], i: -1, picked: 0, goal: 5, started: Date.now(), stats: { items: 0, fast: 0, slow: 0, wrong: 0, idk: 0, rushed: 0, times: [], fastKeys: [], learned: [] }, input: '', phase: 'pick', drops: [], shown: [0, 0], said: '' };
    renderJob();
    scene = makeScene('job', (g, k) => O.J.still(g, k), paintedJob() ? FINE : 1); scene.painted = paintedJob(); scene.cam = { ...CAM_FULL }; tweenCam({ ...JCAM }, 800);
    scene.after = jobOverlays;
    const fd = document.getElementById('vfade'); if (fd) requestAnimationFrame(() => setTimeout(() => fd.classList.remove('on'), 30));
    startLoop(drawJob);
    // the first time, the villager says hello and what they'll give her; then the work starts
    const met = V().met = V().met || {};
    if (!met[id]) { met[id] = Date.now(); EM.save(); O.phase = 'hello'; O.said = MEET[id]; renderJobWork(); EM.speech && EM.speech.say(MEET[id]); O.helloT = setTimeout(() => { if (O && O.phase === 'hello') nextQ(); }, Math.max(5500, (EM.speech ? EM.speech.estimateMs(MEET[id]) : 0) + 600)); return; }
    nextQ();
  }
  function startJobScene() { scene = makeScene('job', (g, k) => O.J.still(g, k), paintedJob() ? FINE : 1); scene.painted = paintedJob(); scene.cam = { ...JCAM }; scene.after = jobOverlays; startLoop(drawJob); renderJobWork(); const fd = document.getElementById('vfade'); if (fd) fd.classList.remove('on'); }
  function jobRefill() {
    const open = O.J.skills.filter(id => EM.isOpen(id));
    O.queue.push(...EM.buildFactQueue(open.length ? open : [O.J.skills[0]], 14, Date.now(), { only: k => O.J.fact(EM.FACTS[k]) }).queue);
  }
  function nextQ() {
    clearTimeout(O.helloT); O.i++; if (O.i >= O.queue.length && !O.J.proc) jobRefill();
    if (!O.queue[O.i] && !O.J.proc) { const keys = O.J.skills.flatMap(id => EM.SK[id].facts).filter(k => O.J.fact(EM.FACTS[k])); O.queue.push({ key: keys[Math.floor(Math.random() * keys.length)], mode: 'normal' }); }
    if (O.J.proc) { // a place-value question, at her level in that skill, chosen like practice chooses them
      const open = O.J.skills.filter(id => EM.isOpen(id)), id = EM.pickProcSkills(open.length ? open : O.J.skills, 1)[0] || O.J.skills[0], rec = EM.skillRec(id);
      O.item = EM.procItem(id, rec.level, EM.procTier(id, rec.level)); O.key = O.item.key; O.mode = 'normal'; O.f = { a: 0, b: 0, ans: O.item.steps[0].ans }; O.J.setup(O);
      O.queue[O.i] = { key: O.key, mode: 'normal' };
    }
    const e = O.queue[O.i];
    if (!O.J.proc) { O.key = e.key; O.mode = e.mode; O.item = EM.factItem(e.key, e.mode); O.f = EM.FACTS[e.key]; }
    O.input = ''; O.help = null; O.crates = null; O.t0 = null; O.tLast = null; O.waitSpeech = false; O.cheer = 0;
    // the things arrive (apples fall, coins are counted out); the question starts when they've landed
    O.phase = 'pick'; O.shown = [0, 0]; O.drops = O.J.deal(O.f, O.i);
    O.lead = ''; O.said = '';
    renderJobWork();
  }
  function jobAsk() {
    O.phase = 'ask'; O.said = O.J.ask(O.f, O.i, O);
    renderJobWork();
    // her first question each round is read aloud; the clock waits until the villager has finished talking
    if (O.picked === 0 && EM.speech && EM.speech.enabled()) jobHear(); else O.t0 = performance.now();
  }
  function jobHear() {
    if (!O || (O.phase !== 'ask' && O.phase !== 'help')) return;
    const text = O.phase === 'help' ? `${O.lead} ${O.help.say}` : O.said, key = O.key;
    if (O.phase === 'help' || O.input) { EM.speech && EM.speech.say(text); return; }
    O.waitSpeech = true; renderJobWork();
    const release = () => { if (O && O.key === key && O.waitSpeech) { O.waitSpeech = false; O.t0 = performance.now(); renderJobWork(); } };
    (EM.speech ? EM.speech.say(text) : Promise.resolve()).then(release);
    setTimeout(release, (EM.speech ? EM.speech.estimateMs(text) : 0) + 300);
  }
  function renderJob() {
    const J = O.J, marks = Array.from({ length: O.goal }, (_, i) => `<i class="${i < O.picked ? 'on' : ''}"></i>`).join('');
    $root.innerHTML = `<main class="village full job ${O.id}">
      <div class="vstage" id="vstage"><canvas id="vcanvas"></canvas><div class="vhaze ${paintedJob() ? 'off' : 'deep'}"></div>
        <div class="jsign ${J.chalk ? 'chalk' : ''}" id="jsign"></div><div class="jbub" id="jbub"></div>
        ${Array.from({ length: J.tagCount || 2 }, (_, i) => `<div class="jtag" id="jtag${i}"></div>`).join('')}${J.label ? '<div class="jlabel" id="jlabel"></div>' : ''}
      </div>
      <div class="vhud vtl"><span class="vpill vcoins" id="vcoins">${COIN()} <b>${V().coins}</b></span><div class="jorder vpanel"><b>${esc(J.order)}</b><div class="jmarks ${J.marks}" id="jmarks">${marks}</div></div></div>
      <div class="vhud vtr"><button class="jhome vpanel" data-v="leavejob">🏠 Village</button></div>
      <div class="jpad vpanel" id="jpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-fd="${d}">${d}</button>`).join('')}<button data-v="fback" aria-label="Delete">⌫</button><button data-fd="0">0</button><button class="ok" data-v="fok" aria-label="Check">✓</button></div>
      <div class="jleft"><button class="jround" data-v="jhear" aria-label="Hear it again">🔊</button><button class="jidk" data-v="jidk">I don't know</button></div>
      <div class="vfade on" id="vfade"></div>
    </main>`;
    fit();
    document.getElementById('vstage').onclick = () => { if (O && O.phase === 'hello') { EM.speech && EM.speech.stop(); nextQ(); } };
  }
  // the sign, the speech bubble and the pad, without a full re-render (the scene keeps moving)
  function renderJobWork() {
    const sign = document.getElementById('jsign'); if (!sign || !O) return;
    const asking = O.phase === 'ask' || O.phase === 'help', J = O.J, f = O.f || { a: 0, b: 0 }, { a, b } = f;
    const sa = O.phase === 'pick' ? (J.boxes ? O.shown[0] : O.shown[0]) : a, sb = O.phase === 'pick' && J.boxes ? O.shown[1] : b;
    const slot = `<span class="slot ${asking && !O.waitSpeech ? 'cursor' : ''}">${O.phase === 'right' || O.phase === 'solved' ? (J.proc ? EM.fmt(f.ans) : f.ans) : esc(O.input)}</span>`;
    sign.innerHTML = J.signHtml ? J.signHtml(O, slot) : `<span>${J.eq(sa, O.phase === 'pick' && !J.boxes ? '?' : sb)}</span>${slot}`;
    const lab = document.getElementById('jlabel'); if (lab) { const html = O.phase === 'pick' || O.phase === 'hello' || !O.item ? '' : J.label(O); if (lab.dataset.k !== O.key + O.phase + (O.help ? O.help.stage : '')) { lab.dataset.k = O.key + O.phase + (O.help ? O.help.stage : ''); lab.innerHTML = html; } lab.classList.toggle('on', !!html); }
    sign.classList.toggle('right', O.phase === 'right' || O.phase === 'solved');
    const bub = document.getElementById('jbub'), dotTalks = !!O.help || O.phase === 'solved';
    const words = O.phase === 'help' ? `${O.lead ? `<b>${esc(O.lead)}</b> ` : ''}${O.help.html}${O.help.vis && !J.cells && !J.label ? `<div class="jvis">${O.help.vis}</div>` : ''}` : O.phase === 'pick' ? '' : esc(O.said);
    if (O.phase === 'hello') { sign.innerHTML = '<span>Hello!</span>'; }
    bub.innerHTML = words ? `<small>${dotTalks ? 'Dot' : esc(J.npc)}</small>${words}` : ''; bub.classList.toggle('on', !!words); bub.classList.toggle('bydot', dotTalks);
    const busy = !asking || O.waitSpeech;
    document.getElementById('jpad').classList.toggle('busy', busy);
    document.querySelector('.jidk').style.visibility = O.help || busy ? 'hidden' : 'visible';
    (O.f ? J.tags(O) : Array.from({ length: J.tagCount || 2 }, () => ({}))).forEach((tg, i) => { const el = document.getElementById(`jtag${i}`); if (!el) return; el.textContent = tg.text || ''; el.classList.toggle('on', !!O.f && !O.crates && !!tg.on); el.classList.toggle('hit', !!tg.hit); });
    const m = document.getElementById('jmarks'); if (m) [...m.children].forEach((el, i) => el.classList.toggle('on', i < O.picked));
    showCoins();
  }
  // the sign's words sit on its face, at whatever size the camera shows it; returns the face in stage pixels
  function placeSign(SIGN) {
    const sign = document.getElementById('jsign'), [x0, y0] = toStage(SIGN[0], SIGN[1]), [x1, y1] = toStage(SIGN[0] + SIGN[2], SIGN[1] + SIGN[3]);
    Object.assign(sign.style, { transform: `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`, width: `${(x1 - x0).toFixed(1)}px`, height: `${(y1 - y0).toFixed(1)}px` });
    // the words fit the sign: as big as its height allows, smaller when a long sum needs the room
    const fitKey = `${sign.textContent}|${Math.round(x1 - x0)}`;
    if (sign.dataset.fit !== fitKey) { sign.dataset.fit = fitKey; let fs = (y1 - y0) * .56; sign.style.fontSize = `${fs}px`; const need = sign.scrollWidth, room = (x1 - x0) * .94; if (need > room) sign.style.fontSize = `${(fs * room / need).toFixed(1)}px`; }
    return [x0, y0, x1, y1];
  }
  // the bubble opens above whoever is talking (scene point x, y), clear of the number pad, and never over the sign's
  // answer box: beside it if there's room, otherwise above it
  function placeBubble(x, y, [x0, y0, x1, y1], avoid) {
    const st = document.getElementById('vstage'), bub = document.getElementById('jbub'); if (!st || !bub) return;
    const [sx, sy] = toStage(x, y), r = st.getBoundingClientRect(), padL = document.getElementById('jpad').getBoundingClientRect().left - r.left;
    bub.style.width = ''; let w = bub.offsetWidth, left = Math.max(-r.left + 12, Math.min(sx - w * .55, padL - w - 14)), top = sy - bub.offsetHeight - 14;
    if (left < x1 + 8 && left + w > x0 && top < y1 && top + bub.offsetHeight > y0) {
      const room = padL - 14 - (x1 + 10);
      if (room >= 230) { left = x1 + 10; if (room < w) { bub.style.width = `${room}px`; w = room; } top = sy - bub.offsetHeight - 14; }
      else top = Math.min(top, y0 - bub.offsetHeight - 10);
    }
    // and clear of anything else that must stay readable (the post office's label): above it if they'd meet
    if (avoid && left < avoid[2] + 8 && left + w > avoid[0] - 8 && top < avoid[3] && top + bub.offsetHeight > avoid[1]) top = avoid[1] - bub.offsetHeight - 10;
    top = Math.max(top, -r.top + 72);
    bub.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px)`; bub.style.setProperty('--tx', `${Math.max(18, Math.min(w - 36, sx - left - 11)).toFixed(0)}px`);
  }
  function jobOverlays() {
    if (!document.getElementById('vstage') || !O) return;
    const J = O.J, rect = placeSign(J.sign), dotTalks = document.getElementById('jbub').classList.contains('bydot');
    let avoid = null; const lab = document.getElementById('jlabel');
    if (lab && J.labelAt) {
      // the label is scaled to J.labelW scene pixels wide, its bottom centered on J.labelAt
      const [lx, ly] = toStage(...J.labelAt), [lx1] = toStage(J.labelAt[0] + J.labelW, 0), z = Math.min(1.2, (lx1 - lx) / Math.max(1, lab.offsetWidth));
      const w = lab.offsetWidth * z, h = lab.offsetHeight * z;
      lab.style.transform = `translate(${(lx - w / 2).toFixed(1)}px, ${(ly - h).toFixed(1)}px) scale(${z.toFixed(3)})`;
      if (lab.classList.contains('on')) avoid = [lx - w / 2, ly - h, lx + w / 2, ly];
    }
    if (dotTalks) placeBubble(O.dotAt[0], O.dotAt[1] - 8, rect, avoid); else placeBubble(J.head[0], J.head[1], rect, avoid);
    if (O.f) J.tags(O).forEach((tg, i) => place(document.getElementById(`jtag${i}`), tg.x, tg.y));
  }
  function drawJob(sc, k, t) {
    ambient(sc, k, t, { butterflies: [[60, 140, 20, 8, .6, '#ffe066'], [190, 90, 16, 10, .5, '#ff9ac6']] });
    if (!O) return;
    const J = O.J;
    // things arriving: apples falling into baskets, coins counted onto the counter, buns set on trays
    const arcs = O.id === 'market' || O.id === 'bakery';
    O.drops = O.drops.filter(d => { const e = (t - d.t0) / 420; if (e < 0) return true; const [tx, ty] = J.land(d.who, O.shown[d.who]);
      if (e >= 1) { O.shown[d.who]++; if (arcs) sfx('tick'); renderJobWork(); return false; }
      J.falling(k, Math.round(lerp(d.x, tx, e)), Math.round(lerp(d.y, ty, e) - (arcs ? Math.sin(e * Math.PI) * 10 : 0) + (arcs ? 0 : (ty - d.y) * (e * e - e))), d.who); return true; });
    if (O.phase === 'pick' && !O.drops.length) jobAsk();
    const hop = O.cheer && t - O.cheer < 500 ? Math.round(Math.sin((t - O.cheer) / 500 * Math.PI) * 3) : 0;
    J.draw(k, t, O, hop);
    // Dot: by her, or over the help while helping
    const to = O.crates || O.phase === 'solved' ? J.dotHelp(O.crates ? O.crates.length : 2) : J.dotHome;
    O.dotPos = O.dotPos || [...to]; O.dotPos[0] = lerp(O.dotPos[0], to[0], .12); O.dotPos[1] = lerp(O.dotPos[1], to[1], .12);
    const dy = Math.round(Math.sin(t / 420) * 1.5); O.dotAt = [Math.round(O.dotPos[0]), Math.round(O.dotPos[1]) + dy]; sc.dotAt = O.dotAt;
    if (paintedJob()) drawDotArt(O.dotAt, t, O); else { k.drawDot(O.dotAt[0], O.dotAt[1], t, (t % 4200) < 130); clouds(k, t); }
  }
  function oType(d) { if ((O.phase !== 'ask' && O.phase !== 'help') || O.waitSpeech) return nudge(); if (O.input.length >= (O.J.maxLen || 2)) return; O.input = O.input === '0' ? d : O.input + d; O.tLast = performance.now(); renderJobWork(); }
  function oBack() { O.input = O.input.slice(0, -1); O.tLast = O.input ? performance.now() : null; renderJobWork(); }
  const oGraded = () => O.mode !== 'rehearse' && O.mode !== 'reask';
  function oGrade(outcome, ms) {
    const st = O.stats; st.items++; st[outcome]++;
    if (outcome === 'fast' || outcome === 'slow') st.times.push(ms);
    if (outcome === 'fast') st.fastKeys.push(O.key);
    if (O.J.proc) { const it = O.item; return { becameYours: false, ...EM.gradeProc(it.skillId, it.level, { ok: outcome === 'fast' || outcome === 'slow', fast: outcome === 'fast', scaff: it.scaff, outcome }) }; }
    return oGraded() ? EM.gradeFact(O.key, outcome, ms) : { becameYours: false };
  }
  function oOk() {
    if ((O.phase !== 'ask' && O.phase !== 'help') || O.waitSpeech || !O.input) return O.input ? nudge() : null;
    const typed = Number(O.input), ok = typed === O.f.ans, tn = performance.now(), { a, b, ans } = O.f, J = O.J;
    if (O.help) { // in help: the right answer moves on, but pays nothing
      if (ok) { O.phase = 'solved'; O.help = null; O.crates = null; O.said = J.solved(O.f); O.cheer = now(); renderJobWork(); EM.speech && EM.speech.say(O.said); sfx('right'); const cur = O; return setTimeout(() => { if (O === cur) nextQ(); }, 1900); }
      if (O.help.stage === 1) return enterJobHelp(2); O.input = ''; renderJobWork(); return;
    }
    const ms = (O.tLast || tn) - (O.t0 || tn), gap = tn - (O.tLast || tn);
    if (ok) {
      const fast = ms <= EM.fastMs(O.item, 0) && gap <= CONFIRM_MS, g = oGrade(fast ? 'fast' : 'slow', ms);
      O.picked++; V().coins++;
      orderProgress(O.id); EM.save();
      O.phase = 'right'; O.cheer = now(); O.said = fast ? 'Wow, you just knew that! Here, a coin.' : 'Thank you! Here, a coin.';
      J.tags(O).forEach(tg => burst(tg.x, tg.y + 4, 8, ['#fff7c2', '#ffe27a', '#ffffff'], { up: true, spread: 2, speed: 40, life: 600 }));
      floatText('+1', J.head[0], J.head[1] - 4, 'coin'); renderJobWork(); sfx(fast ? 'fast' : 'right');
      const cur = O;
      return setTimeout(() => {
        if (O !== cur) return;
        if (g.leveledUp) return celebrate(`${EM.SK[O.item.skillId].name}, next level!`, 'Harder numbers from now on. You earned it.', afterQ);
        if (g.becameYours) return celebrate(`${J.eq(a, b)} ${ans} is yours now!`, 'You knew it fast on two different days.', afterQ, null, O.id === 'market' ? `${a} take away ${b} is ${ans}. That one is yours now!` : `${a} + ${b} = ${ans} is yours now!`);
        afterQ();
      }, 1400);
    }
    const rushed = ms < EM.rushMs(O.item);
    if (rushed) O.stats.rushed++;
    oGrade('wrong', ms);
    enterJobHelp(1, rushed ? 'Whoa, too fast! Think first, then tap.' : "Not quite. Let's count them together.");
  }
  function oIdk() { if (!O || O.help || O.phase !== 'ask' || O.waitSpeech) return; oGrade('idk', 0); enterJobHelp(1, "Good idea to ask. Let's look together."); }
  function enterJobHelp(stage, lead) {
    // a fact she missed comes back a few questions later, like in practice (at most twice per fact)
    if (stage === 1 && !O.J.proc) { const n = (O.reasks = O.reasks || {})[O.key] || 0; if (n < 2) { O.reasks[O.key] = n + 1; O.queue.splice(Math.min(O.queue.length, O.i + 3), 0, { key: O.key, mode: 'reask' }); } }
    const h = O.item.help(0, stage);
    O.help = { stage, html: O.J.words(h.html), say: O.J.words(h.say), vis: h.vis }; O.input = ''; O.phase = 'help'; O.crates = O.J.cells ? O.J.cells(O.f) : null;
    if (lead) O.lead = lead; else if (stage === 2) O.lead = '';
    renderJobWork(); EM.speech && EM.speech.say(`${O.lead} ${O.help.say}`);
  }
  function afterQ() {
    if (O.picked >= O.goal) {
      const J = O.J; V()[J.rounds] = (V()[J.rounds] || 0) + 1; EM.save();
      const gift = giftDue(O.id);
      const title = { orchard: "Rosa's baskets are full!", market: 'Mr. Pip has his pies!', post: 'All the mail is delivered!', bakery: 'The buns are all baked!' }[O.id];
      const next = () => { O.picked = 0; renderJobWork(); nextQ(); };
      if (gift) return celebrate(title, `${J.npc} paid you ${O.goal} coins.`, () => giveGift(gift, next));
      return celebrate(title, `${J.npc} paid you ${O.goal} coins. You have ${V().coins} coins.${untilGift(O.id)}`, next, [['Keep going', 'keep'], ['Spend them', 'tobuild']]);
    }
    nextQ();
  }
  function finishJob() {
    if (!O) return;
    addOrderTime(Date.now() - O.started);
    const st = O.stats;
    if (st.items) EM.logSession({ date: Date.now(), kind: O.id, title: O.J.log, items: st.items, fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk, rushed: st.rushed, relooks: 0,
      minutes: Math.round((Date.now() - O.started) / 6000) / 10, avg: st.times.length ? Math.round(st.times.reduce((a, b) => a + b, 0) / st.times.length) : 0,
      learned: [], fastKeys: st.fastKeys.slice(0, 40), byKind: { fact: { fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk }, proc: { fast: 0, slow: 0, wrong: 0, idk: 0 } } });
    O = null;
  }

  // ---------- entry ----------
  function render($app) {
    $root = $app;
    if (mode === 'fish' && F) { renderFishing(); scene = null; startFishingScene(); return; }
    if (mode === 'job' && O) { renderJob(); scene = null; startJobScene(); return; }
    // a story or cinematic cut short (say, by opening the grown-up area) must not leave the village ignoring taps
    mode = mode === 'build' ? 'build' : 'map'; scene = null; ui.arrived = false; ui.popping = []; ui.story = false; ui.busy = false; ui.dotTarget = null; ui.plankFly = null;
    renderMap();
  }
  function startFishingScene() { scene = makeScene('fish', buildFishStill, fineMapReady() ? MAPD : 1); scene.painted = mapArtReady; scene.after = fishOverlays; startLoop(drawFishing); renderFishWork(); const fd = document.getElementById('vfade'); if (fd) fd.classList.remove('on'); }

  // ---------- taps ----------
  // Pad keys act on pointerdown (see app.js); the click that follows is ignored. Both jobs share the pad's buttons.
  let padDownAt = -1e9;
  const padJob = () => mode === 'fish' && F && document.querySelector('.village.fishing') ? { type: fType, ok: fOk, back: fBack } : mode === 'job' && O && document.querySelector('.village.job') ? { type: oType, ok: oOk, back: oBack } : null;
  const padKey = (j, a) => a.dataset.fd ? j.type(a.dataset.fd) : a.dataset.v === 'fok' ? j.ok() : j.back();
  const PADKEYS = ['.vpadwrap', '.jpad'].map(w => `${w} [data-fd], ${w} [data-v=fok], ${w} [data-v=fback]`).join(', ');
  document.addEventListener('pointerdown', e => {
    const j = padJob(); if (!j) return;
    const a = e.target.closest(PADKEYS); if (!a || e.button > 0) return;
    padDownAt = performance.now(); EM.speech && EM.speech.prime && EM.speech.prime();
    padKey(j, a);
  });
  document.addEventListener('click', e => {
    if (!$root || !document.querySelector('.village')) return;
    const a = e.target.closest('[data-v],[data-item],[data-paint],[data-fd]');
    if (!a) return;
    EM.speech && EM.speech.prime && EM.speech.prime();
    if (a.matches(PADKEYS)) { if (performance.now() - padDownAt < 1500) return; const j = padJob(); return j && padKey(j, a); }
    if (a.dataset.item) { B.item = B.item === a.dataset.item ? null : a.dataset.item; B.sel = null; const it = px.ITEM[B.item]; if (it && V().coins < it.cost) say(`That costs ${it.cost} coins. You have ${V().coins}.`, { voice: false }); return renderTray(); }
    if (a.dataset.paint) { const p = B.sel && placedAt(B.sel); if (p) { p.paint = a.dataset.paint; EM.save(); popIn(p); } return renderTray(); }
    const v = V();
    switch (a.dataset.v) {
      case 'fish': return walkTo('dock', () => toFishing());
      case 'build': return walkTo('yard', () => enterBuild(null));
      case 'done': mode = 'map'; B = { item: null, sel: null }; return renderMap();
      case 'deselect': B.sel = null; return renderTray();
      case 'move': { const p = B.sel && placedAt(B.sel); if (p) { B.moving = p; say('Tap an empty spot.'); } return; }
      case 'putaway': { const p = B.sel && placedAt(B.sel); if (p) { v.placed.splice(v.placed.indexOf(p), 1); v.coins += px.ITEM[p.item].cost; if (px.ITEM[p.item].gift) (v.gifts = v.gifts || {})[p.item] = (v.gifts[p.item] || 0) + 1; EM.save(); const ar = area(p.area); burst(ar.x + p.cx * 16 + 8, ar.y + p.cy * 16 + 10, 10, ['#ffffff', '#efd3a2'], { speed: 30, life: 450 }); scene.buildStill = (g, k) => buildMapStill(g, k); scene.rebake(); } B.sel = null; return renderTray(); }
      case 'stopfish': case 'leavejob': return leaveJob();
      case 'orchard': return walkTo('orchard', toOrchard);
      case 'guide': { const m = mission(); if (m && !ui.story && !ui.busy) m.go(); return; }
      case 'market': return walkTo('market', marketTap);
      case 'post': return walkTo('post', toPost);
      case 'bakery': return walkTo('bakery', toBakery);
      case 'workshop': return walkTo('workshop', () => toPlace('workshop'));
      case 'notes': return walkTo('board', () => toPlace('notes'));
      case 'jhear': return mode === 'fish' ? fishHear() : jobHear();
      case 'jidk': return mode === 'fish' ? fIdk() : oIdk();
      case 'fidk': return fIdk();
    }
  });
  document.addEventListener('keydown', e => { const j = padJob(); if (!j) return; if (/^[0-9]$/.test(e.key)) j.type(e.key); else if (e.key === 'Backspace') j.back(); else if (e.key === 'Enter') j.ok(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && document.getElementById('vcanvas') && scene) startLoop({ fish: drawFishing, job: drawJob }[scene.kind] || drawMap); });

    // for the grown-up area: the last few days of orders (today's live, earlier days from the log)
  function orderHistory(days = 7) {
    const v = V(), out = [];
    for (let i = days - 1; i >= 0; i--) { const d = EM.dayStr(Date.now() - i * 86400000), o = v.orders && v.orders.day === d ? v.orders : null, l = (v.orderLog || {})[d];
      out.push(o ? { day: d, done: o.list.filter(x => x.got >= x.need).length, n: o.list.length, ms: o.ms || 0, today: true } : l ? { day: d, ...l } : { day: d, done: 0, n: 0, ms: 0 }); }
    return out;
  }
  EM.village = { frame, pay, placeDone, placeOpen, render, openBoard, orderHistory, checkUnlocks, meadowProgress, mission: () => mission(), orders: () => orders(), ordersDone, orderProgress, addOrderTime, jobSkills, backdrop, state: V, _fish: () => F, _orch: () => O, _job: () => O, _mode: () => mode, _her: () => her, _ui: () => ui, _scene: () => scene };
})();
