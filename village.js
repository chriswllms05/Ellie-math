/* Ellie Math — her village (v2): the home of the app. A living pixel world she walks around in, a fishing job that runs
   on the real fact engine, a yard she builds and paints, a bridge that gets one plank for every make-10 fact that becomes
   hers, and a notice board with today's practice. See DESIGN-v2.md.
   Fishing follows the v1 honesty rules: only right, unrushed answers catch a fish; "I don't know" is safe and opens help;
   facts are graded with gradeFact exactly like practice. Building has no math in it.
   Drawing: the still world is baked once (with tall things cut out as occluders); everything that moves is drawn each
   frame on top, at the small pixel size, then scaled up crisply through a camera that can pan and zoom. */
'use strict';
(function () {
  const EM = window.EM, px = EM.px, C = px.C;
  const W = 300, H = 210;
  const S = () => EM.S;
  const V = () => { const s = S(); if (!s.village) s.village = { fish: 0, placed: [], open: {}, caught: 0, rounds: 0 }; const v = s.village; if (v.planks === undefined) v.planks = Math.min(8, meadowProgress().have); return v; };
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
  const PATHS = [[118, 112, 116, 9], [134, 112, 9, 34], [244, 52, 9, 62]];
  const inRect = (x, y, [rx, ry, rw, rh]) => x >= rx && x < rx + rw && y >= ry && y < ry + rh;
  const area = id => id === 'meadow' ? MEADOW : YARD;
  const cellAt = (x, y) => { for (const id of ['plot', 'meadow']) { const a = area(id); if (id === 'meadow' && !V().open.meadow) continue; const cx = Math.floor((x - a.x) / 16), cy = Math.floor((y - a.y) / 16); if (cx >= 0 && cy >= 0 && cx < a.cols && cy < a.rows) return { area: id, cx, cy }; } return null; };
  const placedAt = c => V().placed.find(p => p.area === c.area && p.cx === c.cx && p.cy === c.cy);
  // where she can walk: a route along the paths, plus free walking on grass
  const ROUTE = [[114, 144], [138, 141], [138, 118], [166, 118], [190, 118], [244, 118], [248, 98], [248, 82]];
  const STOP = { dock: 0, yard: 3, board: 4, home: 5, bridge: 7 };
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
  // scene point -> stage pixels, through the camera
  const toStage = (x, y) => { const st = document.getElementById('vstage'); if (!st || !scene) return [0, 0]; const cam = scene.cam, w = st.clientWidth, h = st.clientHeight; return [(x - cam.x) / cam.w * w, (y - cam.y) / cam.h * h]; };
  const toScene = (e) => { const st = document.getElementById('vstage'), r = st.getBoundingClientRect(), cam = scene.cam; return [cam.x + (e.clientX - r.left) / r.width * cam.w, cam.y + (e.clientY - r.top) / r.height * cam.h]; };
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
  const sfx = n => { try { EM.sfx && EM.sfx[n] && EM.sfx[n](); } catch (e) {} };

  // ---------- the living scene: baked still layer + things that move ----------
  function makeScene(kind, buildStill) {
    const sc = { kind, S: scaleFor(), cam: { ...CAM_FULL }, camTween: null, particles: [], dyn: [], t0: now() };
    const base = document.createElement('canvas'); base.width = W; base.height = H;
    sc.base = base; sc.buildStill = buildStill; sc.rebake = () => { const g = base.getContext('2d'); g.clearRect(0, 0, W, H); const k = px.kit(g); sc.waterPts = sc.buildStill(g, k); sc.sprites = k.bake(W, H); };
    sc.rebake();
    sc.frame = document.createElement('canvas'); sc.frame.width = W; sc.frame.height = H; sc.fk = px.kit(sc.frame.getContext('2d'));
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
      const fc = sc.frame.getContext('2d'); fc.clearRect(0, 0, W, H); fc.drawImage(sc.base, 0, 0);
      draw(sc, sc.fk, now());
      // particles
      const k = sc.fk, tn = now();
      sc.particles = sc.particles.filter(p => { const a = (tn - p.t0) / 1000; if (a * 1000 > p.life) return false; const x = p.x + p.vx * a, y = p.y + p.vy * a + .5 * p.g * a * a; k.R(Math.round(x), Math.round(y), p.s, p.s, p.c); return true; });
      // to the screen, through the camera
      const cv = document.getElementById('vcanvas'), DW = W * sc.S, DH = H * sc.S;
      if (cv.width !== DW) { cv.width = DW; cv.height = DH; }
      const dc = cv.getContext('2d'), cam = sc.cam, s = sc.S;
      dc.imageSmoothingEnabled = false; dc.globalCompositeOperation = 'source-over';
      dc.drawImage(sc.frame, cam.x, cam.y, cam.w, cam.h, 0, 0, DW, DH);
      dc.globalCompositeOperation = 'soft-light'; dc.drawImage(sc.light, cam.x * s, cam.y * s, cam.w * s, cam.h * s, 0, 0, DW, DH);
      dc.globalCompositeOperation = 'lighter'; dc.drawImage(sc.glow, cam.x * s, cam.y * s, cam.w * s, cam.h * s, 0, 0, DW, DH);
      if (sc.dotAt) { const [x, y] = sc.dotAt, gx = (x - cam.x) / cam.w * DW, gy = (y - cam.y) / cam.h * DH, r = 16 * DW / cam.w, q = dc.createRadialGradient(gx, gy, 0, gx, gy, r); q.addColorStop(0, 'rgba(255,190,110,.32)'); q.addColorStop(1, 'rgba(0,0,0,0)'); dc.fillStyle = q; dc.fillRect(gx - r, gy - r, 2 * r, 2 * r); }
      dc.globalCompositeOperation = 'source-over';
      if (!sc.vig || sc.vig.width !== DW) { sc.vig = document.createElement('canvas'); sc.vig.width = DW; sc.vig.height = DH; const c = sc.vig.getContext('2d'), gr = c.createRadialGradient(DW / 2, DH / 2, DH * .4, DW / 2, DH / 2, DW * .75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(30,20,45,.28)'); c.fillStyle = gr; c.fillRect(0, 0, DW, DH); }
      dc.drawImage(sc.vig, 0, 0);
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
      for (const s of sc.sprites) if (s.y > it.y && s.x < bx + bw && s.x + s.w > bx && s.top < by + bh && s.top + s.h > by) fc.drawImage(s.c, s.x, s.top);
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
  function buildMapStill(g, k, opt = {}) {
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
    k.add(66, () => { const x = 241, y = 50; k.R(x - 1, y + 1, 2, 18, C.k1); k.R(x + 14, y + 1, 2, 18, C.k1); k.R(x - 1, y + 1, 1, 18, C.k2); k.R(x + 14, y + 1, 1, 18, C.k2);
      for (let j = 0; j < PLANKS; j++) { if (j >= laid) continue; const yy = y + 2 + j * 2; k.R(x + 1, yy, 13, 2, j % 2 ? C.k2 : C.k3); k.P(x + 1 + (j * 5) % 11, yy, C.k4); k.R(x + 1, yy + 1, 13, 1, C.k1); }
      if (laid < PLANKS) { k.R(x + 18, y + 6, 1, 10, C.k1); k.R(x + 15, y + 3, 9, 5, C.k3); k.R(x + 15, y + 3, 9, 1, C.k4); k.R(x + 16, y + 5, 7, 1, C.k1); } }, false);
    if (open) { const a = MEADOW, x0 = a.x - 4, y0 = a.y - 3, x1 = a.x + a.cols * 16 + 2, y1 = a.y + a.rows * 16 + 4; k.fence(x0, y0, x1, y0); k.fence(x0, y1, x1, y1); k.fence(x0, y0, x0, y1); k.fence(x1, y0, x1, y1); }
    { const a = YARD, x0 = a.x - 4, y0 = a.y - 3, x1 = a.x + a.cols * 16 + 2, y1 = a.y + a.rows * 16 + 4; k.fence(x0, y0, x1, y0); k.fence(x0, y1, x1, y1); k.fence(x1, y0, x1, y1); k.fence(x0, y0, x0, y0 + 14); k.fence(x0, y0 + 34, x0, y1); }
    [[10, 22], [28, 16], [46, 26], [66, 18], [86, 24], [106, 16], [126, 26], [150, 20], [168, 30], [14, 74], [8, 108], [290, 100], [284, 140], [292, 196], [116, 206], [20, 206], [196, 204], [262, 206], [160, 74], [140, 64]].forEach(([x, y], i) => k.tree(x, y, { r: 8 + (i % 3), apples: i % 5 === 2 }));
    [[106, 86], [206, 128], [60, 92], [276, 172], [130, 190], [222, 196]].forEach(([x, y]) => k.bush(x, y));
    [[90, 104], [270, 120], [40, 196], [110, 198]].forEach(([x, y]) => k.rock(x, y));
    [[18, 140], [21, 142], [112, 176], [115, 178], [100, 120]].forEach(([x, y]) => k.reeds(x, y));
    [[36, 142], [76, 168], [48, 178]].forEach(([x, y], i) => k.lily(x, y, i % 2 === 0));
    if (!open) [[212, 18], [236, 12], [270, 30], [284, 14], [258, 22]].forEach(([x, y]) => k.rock(x, y));
    for (const p of v.placed) { if (p.area === 'meadow' && !open) continue; if (opt.skip && opt.skip.includes(p)) continue; const a = area(p.area), x = a.x + p.cx * 16, y = a.y + p.cy * 16; k.add(y + 15, () => px.drawItem(k, p.item, x, y, p.paint)); }
    // water points for sparkles, well inside the pond
    const pts = []; for (let i = 0; i < 70; i++) { const a = px.hash(i, 5, 61) * Math.PI * 2, r = Math.sqrt(px.hash(i, 6, 62)) * .8; const x = Math.round(POND[0] + Math.cos(a) * POND[2] * r), y = Math.round(POND[1] + Math.sin(a) * POND[3] * r); if (!inRect(x, y, [DOCK[0] - 2, DOCK[1] - 2, DOCK[2] + 4, DOCK[3] + 10])) pts.push([x, y]); }
    return pts;
  }

  // her, walking: position, route queue, frames
  const her = { x: 244, y: 118, path: [], flip: false, walkT: 0, then: null, hop: 0, wave: 0 };
  function routeIndexNear(x, y) { let best = 0, bd = 1e9; ROUTE.forEach(([a, b], i) => { const d = Math.hypot(a - x, b - y); if (d < bd) { bd = d; best = i; } }); return best; }
  function walkTo(stop, then) {
    const to = STOP[stop], from = routeIndexNear(her.x, her.y), pts = [];
    if (Math.hypot(ROUTE[from][0] - her.x, ROUTE[from][1] - her.y) > 2) pts.push(ROUTE[from]);
    if (from <= to) for (let i = from + 1; i <= to; i++) pts.push(ROUTE[i]); else for (let i = from - 1; i >= to; i--) pts.push(ROUTE[i]);
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
    const items = px.ITEMS.filter(i => !i.area || v.open[i.area]);
    const sel = B.sel && placedAt(B.sel);
    $root.innerHTML = `<main class="village full ${build ? 'building' : ''} ${ui.story ? 'story' : ''}">
      <div class="vstage" id="vstage"><canvas id="vcanvas"></canvas>
        <div class="vbubble" id="vbubble"></div>
        <div class="vmark" id="vboardmark">!</div>
      </div>
      <div class="vhud vtl"><span class="vpill vfish" id="vfishcount">🐟 <b>${v.fish}</b></span></div>
      <div class="vhud vbr"><button class="vpill vgrown grownup" data-hold="parent"><span class="fillbar"></span>Grown-ups: hold</button></div>
      ${build ? buildTray(items, sel) : `<div class="vhud vbl vactions"><button class="big-btn" data-v="fish">🎣 Go fishing<span>Fish are money here</span></button><button class="big-btn alt" data-v="build">🔨 Fix up your yard<span>Spend fish on things you like</span></button></div>`}
      <div class="vfade" id="vfade"></div>
    </main>`;
    fit();
    if (!scene || scene.kind !== 'map' || ui.rebuildMap) { scene = makeScene('map', (g, k) => buildMapStill(g, k, { planks: v.planks, skip: ui.popping ? ui.popping.map(p => p.p) : [] })); ui.rebuildMap = false; addGlows(scene, [[240, 99, 7, 'rgba(255,180,90,.22)'], [259, 99, 7, 'rgba(255,180,90,.22)']]); }
    scene.after = mapOverlays;
    hookMapInput();
    startLoop(drawMap);
    if (!ui.arrived) { ui.arrived = true; arrive(); }
  }
  function boardAlert() { const s = S(); if (!V().placed.length && !s.placement.done) return false; return !s.placement.done || !(EM.todayDone && EM.todayDone()); }
  function mapOverlays() {
    place(document.getElementById('vbubble'), dot.x, dot.y - 9);
    const m = document.getElementById('vboardmark'); if (m) { m.classList.toggle('on', boardAlert() && !ui.story && mode !== 'build'); place(m, BOARD[0] + 9, BOARD[1] - 26 - Math.round(Math.sin(now() / 300) * 1.5)); }
  }
  function drawMap(sc, k, t) {
    const dt = Math.min(.06, (t - (sc.lastT || t)) / 1000); sc.lastT = t;
    stepHer(dt);
    // Dot floats beside her (or wherever the story puts Dot)
    const dTarget = ui.dotTarget || [her.x + (her.flip ? 14 : -10), her.y - 24];
    dot.x = lerp(dot.x, dTarget[0], Math.min(1, dt * 2.6)); dot.y = lerp(dot.y, dTarget[1], Math.min(1, dt * 2.6));
    const dy = Math.round(Math.sin(t / 420) * 1.5), blinkDot = (t % 4200) < 130;
    sc.dotAt = [dot.x, dot.y + dy];
    ambient(sc, k, t, { chimneys: [[258, 64]], fish: [[60, 158, 26, 12, .35, 0], [52, 148, 18, 8, -.5, 2], [70, 164, 34, 14, .25, 4]], butterflies: [[96, 96, 20, 8, .7, '#ffe066'], [190, 196, 26, 6, .55, '#ff9ac6'], [286, 120, 10, 14, .6, '#ffffff']] });
    // the pond glows while it's what she should tap
    if (ui.pulsePond) { const a = (Math.sin(t / 260) + 1) / 2; for (let i = 0; i < 48; i++) { const an = i / 48 * Math.PI * 2; if (i % 2) k.P(Math.round(POND[0] + Math.cos(an) * (POND[2] + 3 + a * 2)), Math.round(POND[1] + Math.sin(an) * (POND[3] + 3 + a * 2)), '#fff3b0'); } }
    if (ui.pulseYard) { const a = (Math.sin(t / 260) + 1) / 2, x0 = YARD.x - 2 - a, y0 = YARD.y - 2 - a, w = YARD.cols * 16 + 4 + 2 * a, h = YARD.rows * 16 + 4 + 2 * a; for (let i = 0; i < w; i += 2) { k.P(Math.round(x0 + i), Math.round(y0), '#fff3b0'); k.P(Math.round(x0 + i), Math.round(y0 + h), '#fff3b0'); } for (let i = 0; i < h; i += 2) { k.P(Math.round(x0), Math.round(y0 + i), '#fff3b0'); k.P(Math.round(x0 + w), Math.round(y0 + i), '#fff3b0'); } }
    const items = [];
    const walking = her.path.length > 0, wf = walking ? [0, 1, 0, 3][Math.floor(her.walkT / .11) % 4] : 0;
    const hop = her.hop > t ? Math.round(Math.sin((her.hop - t) / 400 * Math.PI) * 4) : 0;
    items.push({ y: her.y, box: [Math.round(her.x) - 1, Math.round(her.y) - 20, 11, 21], draw: () => { k.shadowEll(Math.round(her.x) + 4, Math.round(her.y), 4, 1); k.drawPerson(Math.round(her.x), Math.round(her.y), look(), { walk: wf, flip: her.flip, blink: !walking && (t % 3600) < 120, bob: hop, wave: her.wave > t }); } });
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
    k.drawDot(Math.round(dot.x), Math.round(dot.y) + dy, t, blinkDot);
    clouds(k, t);
  }
  function itemCanvas(id, paint) { const c = document.createElement('canvas'); c.width = 16; c.height = 16; px.drawItem(px.kit(c.getContext('2d')), id, 0, 0, paint); return c; }
  const iconCache = {}; const itemIcon = (id, paint) => iconCache[id + (paint || '')] || (iconCache[id + (paint || '')] = itemCanvas(id, paint || px.ITEM[id].paint).toDataURL());

  // What happens when she arrives in the village: the story the first time, then news (planks, board, greetings).
  function arrive() {
    const v = V();
    if (!v.introDone) return story();
    if (ui.from === 'fish') { her.x = 114; her.y = 144; ui.from = null; }
    layPlanks(() => {
      if (ui.next) { const f = ui.next; ui.next = null; return f(); }
      if (!S().placement.done && v.placed.length) say('I pinned a note on the board for you. Tap it!');
      else if (!v.placed.length && v.fish >= 2) { say(`You have ${v.fish} fish. Tap your yard to spend them!`); ui.pulseYard = true; }
      else if (!v.fish && !v.placed.length) { say('Tap the pond to catch some fish!'); ui.pulsePond = true; }
      else if (EM.todayDone && !EM.todayDone() && S().placement.done) say("Today's practice is on the board.");
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
      { cam: camAround(84, 150, 140), dot: [104, 120], text: 'Everyone here trades with fish. Catch fish in the pond, and you can trade them for flowers, a bench, even a wishing well.' },
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
    if (c && c.area === 'plot') { ui.pulseYard = false; return walkTo('yard', () => enterBuild(placedAt(c) ? c : null)); }
    if (inRect(x, y, [BOARD[0] - 4, BOARD[1] - 24, 28, 26])) return walkTo('board', openBoard);
    if (inRect(x, y, [232, 40, 40, 34])) return walkTo('bridge', () => { const p = meadowProgress(); say(V().open.meadow ? 'The bridge is fixed! Tap the meadow to build there.' : `${p.have} of ${PLANKS} planks fixed. Every make 10 fact you really know fixes one more.`); });
    if (c && c.area === 'meadow') return walkTo('bridge', () => enterBuild(placedAt(c) ? c : null));
    if (inRect(x, y, [222, 72, 48, 42])) return walkTo('home', () => say('Home sweet home.', { voice: false }));
    if (!(px.inEll(x, y, ...POND) || inStream(x, y)) && y > 30 && y < H - 4 && x > 4 && x < W - 4) walkFree(x, y);
  }
  function dotHint() { const v = V(), p = meadowProgress(); const hints = ['Fish are money here. Catch them at the pond!', 'Tap your yard to put things in it.', `${p.have} of ${PLANKS} bridge planks fixed. Make 10 facts fix them!`, "Check the notice board for today's practice."]; ui.hintI = ((ui.hintI || 0) + 1) % hints.length; return v.fish < 2 ? hints[0] : hints[ui.hintI]; }

  // ---------- notice board ----------
  function openBoard() {
    const s = S(), done = EM.todayDone && EM.todayDone(), evening = done && EM.dueTonight && EM.dueTonight();
    const card = document.createElement('div'); card.className = 'vover'; card.innerHTML = `<div class="vcard vboard"><h2>📋 Notice board</h2>
      ${!s.placement.done ? `<div class="vnote"><b>A note from Dot</b><p>Before we start, show me what you already know. Then I'll know how to help you. About 10 minutes.</p><button class="big-btn" data-b="placement">Show Dot what I know</button></div>`
      : `<div class="vnote"><b>${done ? "You did today's practice! ⭐" : "Today's practice"}</b><p>${done ? 'Extra practice is always welcome.' : `About ${s.settings.minutes || 15} minutes, in short parts.`}</p><button class="big-btn" data-b="today">${done ? 'Practice again' : "Start today's practice"}</button></div>
        ${evening ? '<button class="btn secondary" data-b="evening">🌙 Evening review · 5 minutes</button>' : ''}
        <button class="btn secondary" data-b="skills">🎯 Pick a skill to practice</button>`}
      <button class="btn secondary" data-b="close">Back to the village</button></div>`;
    document.body.appendChild(card);
    card.addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (!b) { if (e.target === card) card.remove(); return; } card.remove(); stopLoop();
      ({ placement: () => EM.startSession('placement'), today: () => EM.startSession('daily'), evening: () => EM.startSession('evening'), skills: () => EM.go('skills'), close: () => startLoop(drawMap) })[b.dataset.b](); });
  }

  // ---------- build mode ----------
  function enterBuild(sel) { mode = 'build'; B = { item: null, sel }; renderMap(); if (!V().placed.length) say(V().fish >= 2 ? 'Flowers cost 2 fish. Pick them, then tap a spot in your yard.' : "You need fish to buy things. Let's go fishing!"); }
  function renderTray() { const old = document.querySelector('.vtray'), v = V(); if (!old) return; const items = px.ITEMS.filter(i => !i.area || v.open[i.area]); old.outerHTML = buildTray(items, B.sel && placedAt(B.sel)); const f = document.getElementById('vfishcount'); if (f) f.innerHTML = `🐟 <b>${v.fish}</b>`; }
  function buildTray(items, sel) {
    if (sel) {
      const it = px.ITEM[sel.item];
      return `<div class="vtray vpanel"><div class="vtray-h"><img src="${itemIcon(sel.item, sel.paint)}" alt=""> <b>${esc(it.name)}</b> <button class="btn secondary small" data-v="deselect">Done</button></div>
        <div class="vhint">Pick a color</div><div class="vpaints">${PAINTS.map(c => `<button class="vpaint ${sel.paint === c ? 'on' : ''}" data-paint="${c}" style="background:${px.PAINT[c][1]}" aria-label="${c}"></button>`).join('')}</div>
        <div class="vcol"><button class="btn secondary" data-v="move">↔ Move it</button><button class="btn secondary" data-v="putaway">↩ Put it away (get ${it.cost} 🐟 back)</button></div></div>`;
    }
    const v = V();
    return `<div class="vtray vpanel"><div class="vtray-h"><b>Your yard</b><button class="btn secondary small" data-v="done">Done</button></div><div class="vhint">Pick something, then tap a spot. Drag things to move them.</div>
      <div class="vitems">${items.map(i => `<button class="vitem ${B.item === i.id ? 'on' : ''} ${v.fish < i.cost ? 'poor' : ''}" data-item="${i.id}"><img src="${itemIcon(i.id)}" alt=""><span>${esc(i.name)}</span><b>${i.cost} 🐟</b></button>`).join('')}</div></div>`;
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
      if (v.fish < it.cost) { say(`That costs ${it.cost} fish. You have ${v.fish}. Let's catch more!`); return; }
      v.fish -= it.cost; const p = { item: it.id, paint: it.paint, ...c }; v.placed.push(p); EM.save(); sfx('right'); popIn(p);
      const first = v.placed.length === 1;
      if (v.fish < it.cost) B.item = null;
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
    const water = (x, y) => px.inEll(x, y, 118, 132, 108, 60) || (y < 90 && Math.abs(x - (54 + Math.sin(y / 18) * 7)) <= 8);
    const path = (x, y) => inRect(x, y, [222, 98, 80, 10]) || inRect(x, y, [258, 60, 9, 40]);
    px.ground(g, W, H, { water, path });
    for (let n = 0; n < 50; n++) { const x = Math.floor(px.hash(n, 1, 21) * W), y = Math.floor(px.hash(n, 2, 21) * H); if (px.inEll(x, y, 118, 132, 114, 66) || path(x, y) || (y < 96 && Math.abs(x - (54 + Math.sin(y / 18) * 7)) <= 12)) continue; k.flowersGround(x, y, ['#ffffff', '#ffe066', '#ff9ac6', '#c7a6ff'][n % 4]); }
    k.house(236, 76, 38, 'red', { chimney: true, lit: true, shutter: ['#2f5a3b', '#4f8a5b'], extra: (x, y, w, top) => { k.R(x - 13, top + 4, 6, 1, C.k1); k.R(x - 9, top + 5, 1, 2, C.k1); k.R(x - 14, top + 7, 12, 8, C.k2); k.R(x - 14, top + 7, 12, 1, C.k3); k.R(x - 14, top + 14, 12, 1, C.k1); k.sprite(x - 12, top + 9, ['..ccc.t', '.ccccctt', 'cecccc.t', '..ccc..t'], { c: '#7fb8e8', t: '#7fb8e8', e: '#2b2433' }); } });
    k.add(96, () => { k.R(156, 101, 70, 10, C.k2); for (let x = 156; x < 226; x += 5) { k.R(x, 101, 1, 10, C.k1); k.P(x + 2, 102 + (x % 6), C.k3); k.P(x + 3, 107 - (x % 4), C.k1); } k.R(156, 101, 70, 1, C.k4); k.R(156, 110, 70, 1, C.k1); [[158, 111], [184, 111], [210, 111]].forEach(([x, y]) => { k.R(x, y, 3, 7, C.k1); k.R(x, y, 1, 7, C.k2); k.R(x - 1, y + 6, 5, 1, C.w3); }); }, false);
    k.barrel(214, 100);
    [[40, 150], [84, 112], [150, 170], [190, 150], [24, 132]].forEach(([x, y], i) => k.lily(x, y, i % 2 === 0));
    [[16, 104], [19, 106], [22, 103], [212, 160], [215, 162], [218, 158], [100, 74], [103, 76]].forEach(([x, y]) => k.reeds(x, y));
    for (let i = 0; i < 8; i++) k.tree(8 + i * 18 + (i % 2) * 6, 22 + (i % 3) * 5, { r: 9 + (i % 2) });
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
    scene = makeScene('fish', buildFishStill); addGlows(scene, [[247, 64, 7, 'rgba(255,180,90,.22)'], [266, 64, 7, 'rgba(255,180,90,.22)']]);
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
    F.input = ''; F.help = null; F.t0 = null; F.tLast = null; F.msg = '';
    // cast, then a fish swims up to the bobber; the question (and its clock) starts when the fish arrives
    F.phase = 'cast'; F.anim = { kind: 'cast', t0: now() }; F.splashed = false; F.fled = false; F.leap = null;
    const edge = [[20, 150], [60, 186], [24, 118], [96, 186]][Math.floor(Math.random() * 4)]; F.fishPos = [...edge];
    renderFishWork();
  }
  function fishArrived() {
    F.phase = 'ask'; F.t0 = performance.now();
    renderFishWork();
    say(F.caught === 0 && !V().rounds ? `This fish has ${F.f.a}. How many more make 10? Tap the number, then the check.` : `This fish has ${F.f.a}. How many more make 10?`, { stay: true, voice: F.caught === 0 && F.i === 0 });
  }
  function renderFishing() {
    $root.innerHTML = `<main class="village full fishing">
      <div class="vstage" id="vstage"><canvas id="vcanvas"></canvas>
        <div class="vtag" id="vtag"></div><div class="vbubble" id="vbubble"></div>
      </div>
      <div class="vhud vtl"><button class="vpill" data-v="stopfish">‹ Back to the village</button><span class="vpill vfish" id="vfishcount">🐟 <b>${V().fish}</b></span></div>
      <div class="vq vpanel" id="vq"></div>
      <div class="vpadwrap vpanel" id="vpad"><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-fd="${d}">${d}</button>`).join('')}<button data-v="fback" aria-label="Delete">⌫</button><button data-fd="0">0</button><button class="ok" data-v="fok" aria-label="Check">✓</button></div>
        <button class="idk" data-v="fidk">🙋 I don't know</button></div>
      <div class="vfade on" id="vfade"></div>
    </main>`;
    fit();
  }
  // the question panel and pad state (no full re-render, so the scene keeps moving)
  function renderFishWork() {
    const q = document.getElementById('vq'), pad = document.getElementById('vpad'); if (!q) return;
    const f = F.f, help = F.help, asking = F.phase === 'ask' || F.phase === 'help';
    q.className = `vq vpanel ${help ? 'helping' : ''} ${asking ? '' : 'waiting'}`;
    q.innerHTML = help ? `<div class="vhelp">${F.msg ? `<div class="vhelp-lead">${esc(F.msg)}</div>` : ''}${help.vis ? `<div class="visual">${help.vis}</div>` : ''}<div class="vhelp-t">${help.html}</div></div><div class="eq">${f.a} + <span class="slot">${F.input || '&nbsp;'}</span> = 10</div>`
      : asking ? `<div class="ask">Make 10 <span class="vcaught">· ${Math.min(F.caught, F.goal)} of ${F.goal} caught</span></div><div class="eq">${f.a} + <span class="slot">${F.input || '&nbsp;'}</span> = 10</div>`
      : `<div class="ask">${F.msg ? esc(F.msg) : 'Casting...'} <span class="vcaught">· ${Math.min(F.caught, F.goal)} of ${F.goal} caught</span></div>`;
    pad.classList.toggle('busy', !asking);
    const idk = pad.querySelector('.idk'); if (idk) idk.style.visibility = help || !asking ? 'hidden' : 'visible';
    const tag = document.getElementById('vtag'); tag.textContent = f.a; tag.classList.toggle('on', F.phase === 'ask' || F.phase === 'help');
    const fc = document.getElementById('vfishcount'); if (fc) fc.innerHTML = `🐟 <b>${V().fish}</b>`;
  }
  function fishOverlays() { place(document.getElementById('vtag'), BOB[0], BOB[1] - 6); place(document.getElementById('vbubble'), 136, 76 + Math.round(Math.sin(now() / 420) * 1.5)); }
  function drawFishing(sc, k, t) {
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
    items.push({ y: 109, draw: () => { k.shadowEll(168, 109, 4, 1); k.drawPerson(164, 109, look(), { blink: (t % 3600) < 120, bob: F.phase === 'caught' && t - F.anim.t0 < 300 ? 1 : 0 }); } });
    items.push({ y: 103, draw: () => { const n = Math.min(F.inBasket || 0, 12); k.R(176, 96, 11, 6, C.k3); k.R(176, 96, 11, 1, C.k4); k.R(176, 101, 11, 1, C.k1); for (let x = 177; x < 187; x += 2) k.P(x, 98, C.k2); for (let i = 0; i < n; i++) { const fx = 177 + (i % 4) * 2, fy = 94 - Math.floor(i / 4) * 2; k.R(fx, fy, 3, 2, i % 3 === 2 ? '#7fb8e8' : '#f2a33a'); k.P(fx, fy, '#ffd08a'); } } });
    drawDepth(sc, items);
    const dy = Math.round(Math.sin(t / 420) * 1.5); sc.dotAt = [136, 84 + dy]; k.drawDot(136, 84 + dy, t, (t % 4200) < 130);
    clouds(k, t);
  }
  // keys act the moment a finger lands (see app.js): a dropped tap feels like the game ignoring her
  function fType(d) { if (F.phase !== 'ask' && F.phase !== 'help') return nudge(); if (F.input.length >= 2) return; F.input = F.input === '0' ? d : F.input + d; F.tLast = performance.now(); const s = document.querySelector('.vq .slot'); if (s) s.textContent = F.input; }
  function fBack() { F.input = F.input.slice(0, -1); F.tLast = F.input ? performance.now() : null; const s = document.querySelector('.vq .slot'); if (s) s.innerHTML = F.input || '&nbsp;'; }
  function nudge() { const p = document.querySelector('.vpadwrap .pad'); if (!p) return; p.classList.remove('nudge'); void p.offsetWidth; p.classList.add('nudge'); }
  const graded = () => F.mode !== 'rehearse' && F.mode !== 'reask';
  function grade(outcome, ms) {
    F.stats.items++; F.stats[outcome]++;
    if (outcome === 'fast' || outcome === 'slow') F.stats.times.push(ms);
    if (outcome === 'fast') F.stats.fastKeys.push(F.key);
    if (!graded()) return { becameYours: false };
    return EM.gradeFact(F.key, outcome, ms);
  }
  function fOk() {
    if ((F.phase !== 'ask' && F.phase !== 'help') || !F.input) return F.input ? nudge() : null;
    const typed = Number(F.input), ok = typed === F.f.ans, tn = performance.now();
    if (F.help) { // in help: the right answer moves on, but this fish already got away
      if (ok) { F.phase = 'reel'; F.anim = { kind: 'reel', t0: now() }; F.help = null; F.msg = `Yes! ${F.f.a} and ${F.f.ans} make 10.`; renderFishWork(); say(F.msg, { ms: 1800 }); return setTimeout(nextFish, 1700); }
      if (F.help.stage === 1) return enterHelp(2); F.input = ''; renderFishWork(); return;
    }
    const ms = (F.tLast || tn) - (F.t0 || tn), gap = tn - (F.tLast || tn);
    if (ok) {
      const fast = ms <= EM.fastMs(F.item, 0) && gap <= CONFIRM_MS, g = grade(fast ? 'fast' : 'slow', ms);
      F.caught++; V().fish++; V().caught = (V().caught || 0) + 1; EM.save();
      F.phase = 'caught'; F.anim = { kind: 'caught', t0: now() }; F.leap = { t0: now() + 120, fast };
      burst(BOB[0], BOB[1], 16, [C.w4, '#ffffff', C.w3], { up: true, spread: 1.8, speed: 52, life: 650 });
      F.msg = fast ? '⚡ Got it! You just knew that one.' : 'Got one! Nice thinking.';
      renderFishWork(); say(F.msg, { voice: false, ms: 1600 }); sfx(fast ? 'fast' : 'right');
      if (g.becameYours) checkUnlocks();
      return setTimeout(() => {
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
  function fIdk() { if (F.help || F.phase !== 'ask') return; grade('idk', 0); F.fled = true; enterHelp(1, "Good idea to ask. Let's look together."); }
  function enterHelp(stage, lead) {
    // a fact she missed comes back a few fish later, like in practice (at most twice per fact)
    if (stage === 1) { const n = (F.reasks = F.reasks || {})[F.key] || 0; if (n < 2) { F.reasks[F.key] = n + 1; F.queue.splice(Math.min(F.queue.length, F.i + 3), 0, { key: F.key, mode: 'reask' }); } }
    const h = F.item.help(0, stage);
    F.help = { stage, vis: h.vis, html: h.html }; F.input = ''; F.phase = 'help';
    if (lead) F.msg = lead;
    renderFishWork(); EM.speech && EM.speech.say(`${lead || ''} ${h.say}`);
    const b = document.getElementById('vbubble'); if (b) b.classList.remove('on');
  }
  function afterCatch() {
    if (F.caught === F.goal) {
      const first = !V().rounds; V().rounds = (V().rounds || 0) + 1; EM.save();
      return celebrate(first ? 'Your very first fish!' : `Basket full! ${F.goal} fish!`, `You have ${V().fish} fish to spend.`, () => { F.caught = 0; F.inBasket = 0; F.goal = goal(); nextFish(); }, [['Keep fishing', 'keep'], [first ? 'Go spend them!' : 'Spend them', 'tobuild']]);
    }
    nextFish();
  }
  function celebrate(title, text, then, buttons) {
    const ov = document.createElement('div'); ov.className = 'vover';
    ov.innerHTML = `<div class="vcard"><div class="vcard-art">${EM.theme.dot('cheer', 72)}</div><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="vrow">${(buttons || [['Yay!', 'keep']]).map(([t, a]) => `<button class="big-btn" data-ov="${a}">${esc(t)}</button>`).join('')}</div></div>`;
    document.body.appendChild(ov); EM.speech && EM.speech.say(title);
    ov.addEventListener('click', e => { const b = e.target.closest('[data-ov]'); if (!b) return; ov.remove(); if (b.dataset.ov === 'tobuild') return leaveFishing(() => enterBuild(null)); then(); });
  }
  function finishFishing() {
    if (!F) return;
    const st = F.stats;
    if (st.items) EM.logSession({ date: Date.now(), kind: 'fishing', title: 'Fishing in her village', items: st.items, fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk, rushed: st.rushed, relooks: 0,
      minutes: Math.round((Date.now() - F.started) / 6000) / 10, avg: st.times.length ? Math.round(st.times.reduce((a, b) => a + b, 0) / st.times.length) : 0,
      learned: [], fastKeys: st.fastKeys.slice(0, 40), byKind: { fact: { fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk }, proc: { fast: 0, slow: 0, wrong: 0, idk: 0 } } });
    F = null;
  }
  // back to the village: fade, then the camera pulls out from the pond
  function leaveFishing(next) {
    finishFishing(); EM.speech && EM.speech.stop();
    const f = document.getElementById('vfade'); if (f) f.classList.add('on');
    setTimeout(() => { mode = 'map'; scene = null; ui.from = 'fish'; ui.arrived = false; ui.next = next || null; renderMap(); scene.cam = camAround(112, 150, 96); tweenCam({ ...CAM_FULL }, 900); const f2 = document.getElementById('vfade'); if (f2) { f2.classList.add('on'); setTimeout(() => f2.classList.remove('on'), 40); } }, 260);
  }
  function stopLoop() { loopId++; }

  // ---------- entry ----------
  function render($app) {
    $root = $app;
    if (mode === 'fish' && F) { renderFishing(); scene = null; startFishingScene(); return; }
    mode = mode === 'build' ? 'build' : 'map'; scene = null; ui.arrived = false; ui.popping = [];
    renderMap();
  }
  function startFishingScene() { scene = makeScene('fish', buildFishStill); scene.after = fishOverlays; startLoop(drawFishing); renderFishWork(); const fd = document.getElementById('vfade'); if (fd) fd.classList.remove('on'); }

  // ---------- taps ----------
  // Pad keys act on pointerdown (see app.js); the click that follows is ignored.
  let padDownAt = -1e9;
  document.addEventListener('pointerdown', e => {
    if (!document.querySelector('.village.fishing') || !F) return;
    const a = e.target.closest('.vpadwrap [data-fd], .vpadwrap [data-v=fok], .vpadwrap [data-v=fback]'); if (!a || e.button > 0) return;
    padDownAt = performance.now(); EM.speech && EM.speech.prime && EM.speech.prime();
    if (a.dataset.fd) fType(a.dataset.fd); else if (a.dataset.v === 'fok') fOk(); else fBack();
  });
  document.addEventListener('click', e => {
    if (!$root || !document.querySelector('.village')) return;
    const a = e.target.closest('[data-v],[data-item],[data-paint],[data-fd]');
    if (!a) return;
    EM.speech && EM.speech.prime && EM.speech.prime();
    if (a.closest('.vpadwrap') && (a.dataset.fd || a.dataset.v === 'fok' || a.dataset.v === 'fback')) { if (performance.now() - padDownAt < 1500) return; if (a.dataset.fd) return fType(a.dataset.fd); return a.dataset.v === 'fok' ? fOk() : fBack(); }
    if (a.dataset.item) { B.item = B.item === a.dataset.item ? null : a.dataset.item; B.sel = null; const it = px.ITEM[B.item]; if (it && V().fish < it.cost) say(`That costs ${it.cost} fish. You have ${V().fish}.`, { voice: false }); return renderTray(); }
    if (a.dataset.paint) { const p = B.sel && placedAt(B.sel); if (p) { p.paint = a.dataset.paint; EM.save(); popIn(p); } return renderTray(); }
    const v = V();
    switch (a.dataset.v) {
      case 'fish': return walkTo('dock', () => toFishing());
      case 'build': return walkTo('yard', () => enterBuild(null));
      case 'done': mode = 'map'; B = { item: null, sel: null }; return renderMap();
      case 'deselect': B.sel = null; return renderTray();
      case 'move': { const p = B.sel && placedAt(B.sel); if (p) { B.moving = p; say('Tap an empty spot.'); } return; }
      case 'putaway': { const p = B.sel && placedAt(B.sel); if (p) { v.placed.splice(v.placed.indexOf(p), 1); v.fish += px.ITEM[p.item].cost; EM.save(); const ar = area(p.area); burst(ar.x + p.cx * 16 + 8, ar.y + p.cy * 16 + 10, 10, ['#ffffff', '#efd3a2'], { speed: 30, life: 450 }); scene.buildStill = (g, k) => buildMapStill(g, k); scene.rebake(); } B.sel = null; return renderTray(); }
      case 'stopfish': return leaveFishing();
      case 'fidk': return fIdk();
    }
  });
  document.addEventListener('keydown', e => { if (mode !== 'fish' || !F || !document.querySelector('.fishing')) return; if (/^[0-9]$/.test(e.key)) fType(e.key); else if (e.key === 'Backspace') fBack(); else if (e.key === 'Enter') fOk(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && document.getElementById('vcanvas') && scene) startLoop(scene.kind === 'fish' ? drawFishing : drawMap); });

  EM.village = { render, openBoard, checkUnlocks, meadowProgress, state: V, _fish: () => F, _mode: () => mode, _her: () => her, _ui: () => ui, _scene: () => scene };
})();
