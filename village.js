/* Ellie Math — her village (v2, first slice): a place she builds, a fishing job that runs on the real fact engine,
   and a meadow that opens when she masters Partners of 10. See DESIGN-v2.md.
   Fishing follows the v1 honesty rules: only right, unrushed answers catch a fish; "I don't know" is safe and opens help;
   facts are graded with gradeFact exactly like practice. Building has no math in it. */
'use strict';
(function () {
  const EM = window.EM, px = EM.px, C = px.C;
  const W = 300, H = 210;
  const S = () => EM.S;
  const V = () => { const s = S(); if (!s.village) s.village = { fish: 3, placed: [], open: {}, caught: 0 }; return s.village; };
  const esc = EM.esc;
  const PAINTS = Object.keys(px.PAINT);
  const MEADOW_SKILL = 'm10', MEADOW_NEED = 8;

  // ---------- the village layout (scene pixels, 300 x 210) ----------
  const POND = [64, 152, 56, 40];
  const STREAM = [[186, -6], [189, 24], [196, 46], [214, 58], [250, 62], [306, 60]];
  const segDist = (x, y, [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - ax - t * dx, y - ay - t * dy); };
  const inStream = (x, y) => STREAM.slice(1).some((p, i) => segDist(x, y, STREAM[i], p) <= 5.5);
  const PLOT = { x: 146, y: 134, cols: 6, rows: 3 };            // her plot, 16px cells
  const MEADOW = { x: 222, y: 10, cols: 4, rows: 2 };           // opens later
  const DOCK = [106, 137, 30, 9];
  const PATHS = [[118, 112, 116, 9], [134, 112, 9, 34], [244, 52, 9, 62]];
  const inRect = (x, y, [rx, ry, rw, rh]) => x >= rx && x < rx + rw && y >= ry && y < ry + rh;
  const area = id => id === 'meadow' ? MEADOW : PLOT;
  const cellAt = (x, y) => { for (const id of ['plot', 'meadow']) { const a = area(id); if (id === 'meadow' && !V().open.meadow) continue; const cx = Math.floor((x - a.x) / 16), cy = Math.floor((y - a.y) / 16); if (cx >= 0 && cy >= 0 && cx < a.cols && cy < a.rows) return { area: id, cx, cy }; } return null; };
  const placedAt = c => V().placed.find(p => p.area === c.area && p.cx === c.cx && p.cy === c.cy);

  function meadowProgress() { const facts = EM.SK[MEADOW_SKILL].facts; return { have: facts.filter(k => EM.isCollected(k)).length, need: MEADOW_NEED }; }
  // The meadow opens once enough Partners of 10 are hers. Returns true the moment it opens.
  function checkUnlocks() { const v = V(); if (v.open.meadow) return false; const p = meadowProgress(); if (p.have >= p.need) { v.open.meadow = Date.now(); v.news = 'meadow'; EM.save(); return true; } return false; }

  function drawVillage(canvas, ui = {}) {
    const v = V(), open = !!v.open.meadow;
    const pc = document.createElement('canvas'); pc.width = W; pc.height = H; const g = pc.getContext('2d');
    const water = (x, y) => px.inEll(x, y, ...POND) || inStream(x, y);
    const path = (x, y) => PATHS.some(r => { const n = px.hash(x >> 1, y >> 1, 3) < .35 ? 1 : 0; return inRect(x, y, [r[0] - n, r[1] - n, r[2] + 2 * n, r[3] + 2 * n]); });
    const inPlot = a => (x, y) => x >= a.x - 1 && x < a.x + a.cols * 16 + 1 && y >= a.y - 1 && y < a.y + a.rows * 16 + 1;
    const tall = (x, y) => !open && x > 202 && y < 52 && !inStream(x, y);
    px.ground(g, W, H, { water, path, plot: (x, y) => inPlot(PLOT)(x, y) || (open && inPlot(MEADOW)(x, y)), tall });
    const k = px.kit(g);
    // ground flowers
    for (let n = 0; n < 40; n++) { const x = Math.floor(px.hash(n, 1, 21) * W), y = Math.floor(px.hash(n, 2, 21) * H); if (water(x, y) || path(x, y) || inPlot(PLOT)(x, y) || inPlot(MEADOW)(x, y) || px.inEll(x, y, POND[0], POND[1], POND[2] + 4, POND[3] + 4)) continue; k.flowersGround(x, y, ['#ffffff', '#ffe066', '#ff9ac6', '#c7a6ff'][n % 4]); }
    // her house
    k.house(226, 112, 40, 'blue', { chimney: true, lit: true, shutter: ['#b04774', '#e86f9a'] });
    k.smoke(256, 64);
    // dock into the pond
    k.add(DOCK[1] - 2, () => { const [x, y, w, h] = DOCK; k.R(x, y, w, h, C.k2); for (let a = x; a < x + w; a += 5) { k.R(a, y, 1, h, C.k1); k.P(a + 2, y + 1 + (a % 6), C.k3); } k.R(x, y, w, 1, C.k4); k.R(x, y + h - 1, w, 1, C.k1); [[x + 2, y + h], [x + 16, y + h]].forEach(([a, b]) => { k.R(a, b, 3, 6, C.k1); k.R(a, b, 1, 6, C.k2); k.R(a - 1, b + 5, 5, 1, C.w3); }); });
    k.barrel(128, 136); k.crate(116, 137, '#f2a33a');
    // stream bridge: broken until the meadow opens
    k.add(66, () => { const x = 241, y = 50; k.R(x - 1, y + 2, 2, 16, C.k1); k.R(x + 14, y + 2, 2, 16, C.k1);
      for (let j = 0; j < 16; j += 3) { if (!open && (j === 6 || j === 9)) continue; k.R(x, y + 2 + j, 15, 2, C.k2); k.R(x, y + 2 + j, 15, 1, C.k3); }
      if (!open) { k.R(x + 18, y + 6, 1, 10, C.k1); k.R(x + 15, y + 4, 8, 5, C.k3); k.R(x + 15, y + 4, 8, 1, C.k4); k.R(x + 17, y + 6, 4, 1, C.k1); } });
    // meadow: fenced plot once open
    if (open) { const a = MEADOW, x0 = a.x - 4, y0 = a.y - 3, x1 = a.x + a.cols * 16 + 2, y1 = a.y + a.rows * 16 + 4; k.fence(x0, y0, x1, y0); k.fence(x0, y1, x1, y1); k.fence(x0, y0, x0, y1); k.fence(x1, y0, x1, y1); }
    // her plot fence
    { const a = PLOT, x0 = a.x - 4, y0 = a.y - 3, x1 = a.x + a.cols * 16 + 2, y1 = a.y + a.rows * 16 + 4; k.fence(x0, y0, x1, y0); k.fence(x0, y1, x1, y1); k.fence(x1, y0, x1, y1); k.fence(x0, y0, x0, y0 + 14); k.fence(x0, y0 + 34, x0, y1); }
    // trees, bushes, rocks, reeds and lilies around the edges
    [[10, 22], [28, 16], [46, 26], [66, 18], [86, 24], [106, 16], [126, 26], [150, 20], [168, 30], [14, 74], [8, 108], [290, 100], [284, 140], [292, 196], [116, 206], [20, 206], [196, 204], [262, 206], [170, 74], [148, 62]].forEach(([x, y], i) => k.tree(x, y, { r: 8 + (i % 3), apples: i % 5 === 2 }));
    [[106, 86], [206, 128], [60, 92], [276, 172], [130, 190], [222, 196]].forEach(([x, y]) => k.bush(x, y));
    [[90, 104], [270, 120], [40, 196], [110, 198]].forEach(([x, y]) => k.rock(x, y));
    [[18, 140], [21, 142], [112, 176], [115, 178], [100, 120]].forEach(([x, y]) => k.reeds(x, y));
    [[36, 142], [76, 168], [48, 178]].forEach(([x, y], i) => k.lily(x, y, i % 2 === 0));
    [[40, 152, '#f2a33a'], [84, 160, '#1d4a7e'], [56, 174, '#f2a33a']].forEach(([x, y, c]) => k.fish(x, y, c));
    if (!open) [[212, 18], [236, 12], [270, 30], [284, 14], [258, 22]].forEach(([x, y]) => k.rock(x, y));
    // her, and what she built
    k.person(124, 128, px.herLook());
    for (const p of v.placed) { if (p.area === 'meadow' && !open) continue; const a = area(p.area), x = a.x + p.cx * 16, y = a.y + p.cy * 16; if (ui.drag && ui.drag.p === p) continue; k.add(y + 15, () => px.drawItem(k, p.item, x, y, p.paint)); }
    // build mode: show the cells; the selected one is highlighted
    if (ui.build) k.add(997, () => { for (const id of ['plot', 'meadow']) { if (id === 'meadow' && !open) continue; const a = area(id); for (let cy = 0; cy < a.rows; cy++) for (let cx = 0; cx < a.cols; cx++) { const x = a.x + cx * 16, y = a.y + cy * 16, sel = ui.sel && ui.sel.area === id && ui.sel.cx === cx && ui.sel.cy === cy; const col = sel ? '#ffe066' : 'rgba(255,255,255,.55)'; for (let i = 0; i < 16; i += 2) { k.R(x + i, y, 1, 1, col); k.R(x + i, y + 15, 1, 1, col); k.R(x, y + i, 1, 1, col); k.R(x + 15, y + i, 1, 1, col); } if (sel) { k.R(x, y, 16, 1, col); k.R(x, y + 15, 16, 1, col); k.R(x, y, 1, 16, col); k.R(x + 15, y, 1, 16, col); } } } });
    if (ui.drag && ui.drag.at) k.add(999, () => px.drawItem(k, ui.drag.p.item, Math.round(ui.drag.at[0] - 8), Math.round(ui.drag.at[1] - 12), ui.drag.p.paint));
    const dot = [206, 92]; k.dot(...dot);
    k.flush();
    px.present(canvas, pc, ui.scale || 4, { glows: [[...dot, 16, 'rgba(255,190,110,.32)'], [240, 99, 7, 'rgba(255,180,90,.22)'], [259, 99, 7, 'rgba(255,180,90,.22)']] });
    return { dot, bridge: [249, 58], dock: [DOCK[0] + 12, DOCK[1]] };
  }

  // ---------- fishing scene (same pixel size) ----------
  function drawFishing(canvas, ui = {}) {
    const pc = document.createElement('canvas'); pc.width = W; pc.height = H; const g = pc.getContext('2d');
    const water = (x, y) => px.inEll(x, y, 118, 132, 108, 60) || (y < 90 && Math.abs(x - (54 + Math.sin(y / 18) * 7)) <= 8);
    const path = (x, y) => inRect(x, y, [222, 98, 80, 10]) || inRect(x, y, [258, 60, 9, 40]);
    px.ground(g, W, H, { water, path });
    const k = px.kit(g);
    for (let n = 0; n < 50; n++) { const x = Math.floor(px.hash(n, 1, 21) * W), y = Math.floor(px.hash(n, 2, 21) * H); if (px.inEll(x, y, 118, 132, 114, 66) || path(x, y) || (y < 96 && Math.abs(x - (54 + Math.sin(y / 18) * 7)) <= 12)) continue; k.flowersGround(x, y, ['#ffffff', '#ffe066', '#ff9ac6', '#c7a6ff'][n % 4]); }
    k.house(236, 76, 38, 'red', { chimney: true, lit: true, shutter: ['#2f5a3b', '#4f8a5b'], extra: (x, y, w, top) => {
      k.R(x - 13, top + 4, 6, 1, C.k1); k.R(x - 9, top + 5, 1, 2, C.k1); k.R(x - 14, top + 7, 12, 8, C.k2); k.R(x - 14, top + 7, 12, 1, C.k3); k.R(x - 14, top + 14, 12, 1, C.k1);
      k.sprite(x - 12, top + 9, ['..ccc.t', '.ccccctt', 'cecccc.t', '..ccc..t'], { c: '#7fb8e8', t: '#7fb8e8', e: '#2b2433' }); } });
    k.smoke(266, 30);
    k.add(96, () => { k.R(156, 101, 70, 10, C.k2); for (let x = 156; x < 226; x += 5) { k.R(x, 101, 1, 10, C.k1); k.P(x + 2, 102 + (x % 6), C.k3); k.P(x + 3, 107 - (x % 4), C.k1); } k.R(156, 101, 70, 1, C.k4); k.R(156, 110, 70, 1, C.k1);
      [[158, 111], [184, 111], [210, 111]].forEach(([x, y]) => { k.R(x, y, 3, 7, C.k1); k.R(x, y, 1, 7, C.k2); k.R(x - 1, y + 6, 5, 1, C.w3); }); });
    k.barrel(214, 100);
    // her basket fills up as she catches fish
    const n = Math.min(ui.caught || 0, 8);
    k.add(103, () => { k.R(176, 96, 11, 6, C.k3); k.R(176, 96, 11, 1, C.k4); k.R(176, 101, 11, 1, C.k1); for (let x = 177; x < 187; x += 2) k.P(x, 98, C.k2); for (let i = 0; i < n; i++) { const fx = 177 + (i % 4) * 2, fy = 94 - Math.floor(i / 4) * 2; k.R(fx, fy, 3, 2, i % 3 === 2 ? '#7fb8e8' : '#f2a33a'); k.P(fx, fy, '#ffd08a'); } });
    k.person(164, 109, px.herLook(), { rodLeft: true });
    const bob = [118, 128];
    k.add(300, () => {
      const [bx, by] = bob, dip = ui.bite ? 2 : 0;
      k.line(150, 87, 140, 98, '#f2f2f2'); k.line(140, 98, 128, 112, '#f2f2f2'); k.line(128, 112, bx + 1, by - 3 + dip, '#f2f2f2');
      k.sprite(bx - 1, by - 3 + dip, ['.ww.', 'wwww', 'rrrr', '.rr.'], { w: '#ffffff', r: '#e8473f' });
      for (let a = -9; a <= 10; a++) if (Math.abs(a) > 3 && px.hash(a, 3, 77) < .8) k.P(bx + a, by + 2, C.w4);
      for (let a = -14; a <= 15; a++) if (Math.abs(a) > 9 && px.hash(a, 4, 78) < .6) k.P(bx + a, by + 5, C.w3);
    });
    // the fish on the line waits just under the bobber
    k.fish(bob[0] - 3, bob[1] + 8, ui.gold ? '#f7c948' : '#f2a33a');
    [[70, 142, '#1d4a7e'], [44, 124, '#1d4a7e'], [160, 140, '#f2a33a'], [96, 174, '#1d4a7e']].forEach(([x, y, c]) => k.fish(x, y, c));
    [[40, 150], [84, 112], [150, 170], [190, 150], [24, 132]].forEach(([x, y], i) => k.lily(x, y, i % 2 === 0));
    [[16, 104], [19, 106], [22, 103], [212, 160], [215, 162], [218, 158], [100, 74], [103, 76]].forEach(([x, y]) => k.reeds(x, y));
    for (let i = 0; i < 8; i++) k.tree(8 + i * 18 + (i % 2) * 6, 22 + (i % 3) * 5, { r: 9 + (i % 2) });
    [[288, 40], [292, 150], [266, 196], [14, 200], [236, 178]].forEach(([x, y], i) => k.tree(x, y, { r: 9 + (i % 2) }));
    for (let c = 0; c < 2; c++) for (let r = 0; r < 2; r++) k.tree(262 + c * 22, 130 + r * 26, { r: 8, apples: true });
    [[110, 72], [204, 80], [6, 160], [240, 120], [196, 196]].forEach(([x, y]) => k.bush(x, y));
    [[26, 90], [228, 150], [186, 72], [64, 200]].forEach(([x, y]) => k.rock(x, y));
    const dot = [136, 84]; k.dot(...dot);
    k.flush();
    px.present(canvas, pc, ui.scale || 4, { glows: [[...dot, 16, 'rgba(255,190,110,.32)'], [247, 64, 7, 'rgba(255,180,90,.22)'], [266, 64, 7, 'rgba(255,180,90,.22)']] });
    return { dot, bob };
  }

  // ---------- screen plumbing ----------
  let $root = null, mode = 'map', B = { item: null, sel: null, moving: null }, F = null;
  const pct = ([x, y]) => `left:${(x / W * 100).toFixed(2)}%;top:${(y / H * 100).toFixed(2)}%`;
  const scaleFor = () => Math.max(3, Math.min(8, Math.round(Math.min(window.innerWidth, window.innerHeight * 1.43) * (window.devicePixelRatio || 1) / W)));
  const toScene = (canvas, e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  const say = t => EM.speech && EM.speech.say(t);
  function icon(id, paint) { const c = document.createElement('canvas'); c.width = 16; c.height = 16; px.drawItem(px.kit(c.getContext('2d')), id, 0, 0, paint); return c.toDataURL(); }
  const iconCache = {}; const itemIcon = (id, paint) => iconCache[id + paint] || (iconCache[id + paint] = icon(id, paint || px.ITEM[id].paint));

  function render($app) {
    $root = $app;
    if (mode === 'fish') return renderFishing();
    renderMap();
  }

  // ---------- map + build mode ----------
  function renderMap() {
    const v = V(), build = mode === 'build', p = meadowProgress();
    const items = px.ITEMS.filter(i => !i.area || v.open[i.area]);
    const sel = B.sel && placedAt(B.sel);
    const bubble = v.news === 'meadow' ? 'The bridge is fixed! The meadow is open. Sheep are waiting!'
      : build ? (B.item ? `Tap a spot on your plot for the ${px.ITEM[B.item].name.toLowerCase()}.` : sel ? 'Paint it, move it, or put it away.' : 'Pick something to build, then tap a spot.')
      : v.placed.length ? `${v.fish} fish to spend. Want to build, or go fishing?` : 'Welcome to your village! Catch fish at the pond, then build your plot.';
    $root.innerHTML = `<main class="village ${build ? 'building' : ''}">
      <div class="vtop"><button class="back" data-v="home">‹ Home</button><span class="vfish">🐟 <b>${v.fish}</b></span></div>
      <div class="vstage" id="vstage"><canvas id="vcanvas"></canvas>
        <div class="vbubble" id="vbubble">${esc(bubble)}</div>
        ${!v.open.meadow ? `<div class="vlock" style="${pct([254, 28])}">🔒 Fix the bridge to the meadow<small>${p.have} of ${p.need} make-10 facts are yours</small></div>` : ''}
        <div class="vlabel" style="${pct([60, 196])}">🎣 Fishing pond</div>
      </div>
      ${build ? buildTray(items, sel) : `<div class="vactions"><button class="big-btn" data-v="fish">🎣 Go fishing<span>Catch fish to build with</span></button><button class="big-btn alt" data-v="build">🔨 Build<span>Place and paint things on your plot</span></button></div>`}
    </main>`;
    const canvas = document.getElementById('vcanvas');
    const info = drawVillage(canvas, { build, sel: B.sel, scale: scaleFor(), drag: B.drag });
    const b = document.getElementById('vbubble'); b.setAttribute('style', pct([info.dot[0] - 6, info.dot[1] - 12]));
    if (v.news === 'meadow') { delete v.news; EM.save(); EM.sfx && EM.sfx.unlock && EM.sfx.unlock(); say('The bridge is fixed! The meadow is open.'); }
    hookCanvas(canvas);
  }
  function buildTray(items, sel) {
    if (sel) {
      const it = px.ITEM[sel.item];
      return `<div class="vtray"><div class="vtray-h"><img src="${itemIcon(sel.item, sel.paint)}" alt=""> <b>${esc(it.name)}</b> <button class="btn secondary small" data-v="deselect">Done</button></div>
        <div class="vpaints">${PAINTS.map(c => `<button class="vpaint ${sel.paint === c ? 'on' : ''}" data-paint="${c}" style="background:${px.PAINT[c][1]}" aria-label="${c}"></button>`).join('')}</div>
        <div class="vrow"><button class="btn secondary" data-v="move">↔ Move</button><button class="btn secondary" data-v="putaway">↩ Put away (+${it.cost} 🐟)</button></div></div>`;
    }
    const v = V();
    return `<div class="vtray"><div class="vtray-h"><b>Build</b><span class="vhint">Drag things to move them. Tap one to paint it.</span><button class="btn secondary small" data-v="done">Done building</button></div>
      <div class="vitems">${items.map(i => `<button class="vitem ${B.item === i.id ? 'on' : ''} ${v.fish < i.cost ? 'poor' : ''}" data-item="${i.id}"><img src="${itemIcon(i.id)}" alt=""><span>${esc(i.name)}</span><b>${i.cost} 🐟</b></button>`).join('')}</div></div>`;
  }
  function hookCanvas(canvas) {
    let down = null;
    canvas.onpointerdown = e => {
      const [x, y] = toScene(canvas, e), c = cellAt(x, y);
      down = { x, y, c, p: c && placedAt(c), t: performance.now(), moved: false };
      if (mode === 'build' && down.p && !B.item) { canvas.setPointerCapture(e.pointerId); }
    };
    canvas.onpointermove = e => {
      if (!down || mode !== 'build' || !down.p || B.item) return;
      const [x, y] = toScene(canvas, e);
      if (!down.moved && Math.hypot(x - down.x, y - down.y) < 4) return;
      down.moved = true; B.drag = { p: down.p, at: [x, y] };
      drawVillage(canvas, { build: true, sel: B.sel, scale: scaleFor(), drag: B.drag });
    };
    canvas.onpointerup = e => {
      const d = down; down = null; if (!d) return;
      const [x, y] = toScene(canvas, e), c = cellAt(x, y);
      if (B.drag) { const p = B.drag.p; B.drag = null; if (c && !placedAt(c)) { Object.assign(p, { area: c.area, cx: c.cx, cy: c.cy }); B.sel = c; EM.save(); EM.sfx && EM.sfx.right && EM.sfx.right(); } return renderMap(); }
      tap(x, y, c);
    };
  }
  function tap(x, y, c) {
    const v = V();
    if (mode !== 'build') {
      if (px.inEll(x, y, ...POND) || inRect(x, y, DOCK)) return startFishing();
      if (c && c.area === 'plot') { mode = 'build'; B = { item: null, sel: placedAt(c) ? c : null }; return renderMap(); }
      if (!v.open.meadow && x > 200 && y < 70) { const p = meadowProgress(); say(`The bridge is broken. Know ${p.need} make 10 facts and it gets fixed.`); return; }
      return;
    }
    if (!c) { B.sel = null; return renderMap(); }
    const there = placedAt(c);
    if (B.moving) { if (!there) { Object.assign(B.moving, c); B.sel = c; EM.save(); } B.moving = null; return renderMap(); }
    if (B.item) {
      if (there) { B.sel = c; B.item = null; return renderMap(); }
      const it = px.ITEM[B.item];
      if (v.fish < it.cost) { say(`You need ${it.cost} fish for that. Go fishing to catch more!`); return; }
      v.fish -= it.cost; v.placed.push({ item: it.id, paint: it.paint, ...c }); EM.save();
      EM.sfx && EM.sfx.right && EM.sfx.right();
      if (v.fish < it.cost) B.item = null;
      B.sel = null; return renderMap();
    }
    B.sel = there ? c : null; renderMap();
  }

  // ---------- fishing: make 10, on the real fact engine ----------
  const GOAL = 8, CONFIRM_MS = 2000;
  function startFishing() {
    mode = 'fish';
    F = { queue: [], i: -1, caught: 0, started: Date.now(), stats: { items: 0, fast: 0, slow: 0, wrong: 0, idk: 0, rushed: 0, times: [], fastKeys: [], learned: [] }, input: '', phase: 'ask' };
    nextFish();
  }
  function refill() { const q = EM.buildFactQueue([MEADOW_SKILL], 14).queue; F.queue.push(...q); }
  function nextFish() {
    F.i++; if (F.i >= F.queue.length) refill();
    const e = F.queue[F.i];
    F.key = e.key; F.mode = e.mode; F.item = EM.factItem(e.key, e.mode); F.f = EM.FACTS[e.key];
    F.input = ''; F.phase = 'ask'; F.help = null; F.first = null; F.t0 = null; F.tLast = null; F.msg = '';
    renderFishing();
    F.t0 = performance.now();
  }
  function renderFishing() {
    const f = F.f, help = F.help;
    $root.innerHTML = `<main class="village fishing">
      <div class="vtop"><button class="back" data-v="stopfish">‹ Done fishing</button><span class="vchip">Catch ${GOAL} fish <b>${Math.min(F.caught, GOAL)}/${GOAL}</b></span><span class="vfish">🐟 <b>${V().fish}</b></span></div>
      <div class="vstage" id="vstage"><canvas id="vcanvas"></canvas>
        <div class="vtag" id="vtag">${f.a}</div>
        <div class="vbubble" id="vbubble">${esc(F.msg || `Your fish says ${f.a}. What makes 10?`)}</div>
      </div>
      <div class="vwork">
        <div class="vq ${help ? 'helping' : ''}">${help ? `<div class="vhelp">${help.vis ? `<div class="visual">${help.vis}</div>` : ''}<div class="vhelp-t">${help.html}</div></div>` : '<div class="ask">Make 10</div>'}
          <div class="eq">${f.a} + <span class="slot">${F.input || '&nbsp;'}</span> = 10</div></div>
        <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-fd="${d}">${d}</button>`).join('')}<button data-v="fback" aria-label="Delete">⌫</button><button data-fd="0">0</button><button class="ok" data-v="fok" aria-label="Check">✓</button></div>
        ${help ? '' : '<button class="idk" data-v="fidk">🙋 I don\'t know</button>'}
      </div>
    </main>`;
    const info = drawFishing(document.getElementById('vcanvas'), { caught: F.caught, scale: scaleFor(), bite: F.phase === 'ask' });
    document.getElementById('vtag').setAttribute('style', pct([info.bob[0], info.bob[1] - 22]));
    document.getElementById('vbubble').setAttribute('style', pct([info.dot[0] - 6, info.dot[1] - 12]));
  }
  function fType(d) { if (F.phase === 'wait' || F.input.length >= 2) return; F.input = F.input === '0' ? d : F.input + d; F.tLast = performance.now(); const s = document.querySelector('.vq .slot'); if (s) s.textContent = F.input; }
  function fBack() { F.input = F.input.slice(0, -1); F.tLast = F.input ? performance.now() : null; const s = document.querySelector('.vq .slot'); if (s) s.innerHTML = F.input || '&nbsp;'; }
  const graded = () => F.mode !== 'rehearse' && F.mode !== 'reask';
  function grade(outcome, ms) {
    F.stats.items++; F.stats[outcome]++;
    if (outcome === 'fast' || outcome === 'slow') F.stats.times.push(ms);
    if (outcome === 'fast') F.stats.fastKeys.push(F.key);
    if (!graded()) return { becameYours: false };
    return EM.gradeFact(F.key, outcome, ms);
  }
  function fOk() {
    if (F.phase === 'wait' || !F.input) return;
    const typed = Number(F.input), ok = typed === F.f.ans, now = performance.now();
    if (F.help) { // in help: the right answer moves on, but this fish already got away
      if (ok) { F.phase = 'wait'; F.msg = `Yes! ${F.f.a} and ${F.f.ans} make 10.`; renderFishing(); say(`Yes! ${F.f.a} and ${F.f.ans} make 10.`); return setTimeout(nextFish, 1600); }
      if (F.help.stage === 1) return enterHelp(2); F.input = ''; renderFishing(); return;
    }
    const ms = (F.tLast || now) - (F.t0 || now), gap = now - (F.tLast || now);
    if (ok) {
      const fast = ms <= EM.fastMs(F.item, 0) && gap <= CONFIRM_MS, g = grade(fast ? 'fast' : 'slow', ms);
      F.caught++; V().fish++; V().caught = (V().caught || 0) + 1; EM.save();
      F.phase = 'wait'; F.msg = fast ? '⚡ Caught one! You knew it.' : 'Caught one! You figured it out.';
      renderFishing(); EM.sfx && (fast ? EM.sfx.fast() : EM.sfx.right());
      const opened = g.becameYours && checkUnlocks();
      return setTimeout(() => {
        if (g.becameYours) return celebrate(`${F.f.a} + ${F.f.ans} = 10 is yours!`, opened ? 'And the bridge to the meadow is fixed! 🐑' : 'You knew it fast on two different days.', () => afterCatch());
        afterCatch();
      }, fast ? 800 : 1100);
    }
    const rushed = ms < EM.rushMs(F.item);
    if (rushed) F.stats.rushed++;
    grade('wrong', ms);
    enterHelp(1, rushed ? 'Whoa, too fast! The fish got away. Think first.' : 'The fish got away. Let\'s look together.');
  }
  function fIdk() { if (F.help || F.phase === 'wait') return; grade('idk', 0); enterHelp(1, 'Good call asking. Let\'s look together.'); }
  function enterHelp(stage, lead) {
    // a fact she missed comes back a few fish later, like in practice (at most twice per fact)
    if (stage === 1) { const n = (F.reasks = F.reasks || {})[F.key] || 0; if (n < 2) { F.reasks[F.key] = n + 1; F.queue.splice(Math.min(F.queue.length, F.i + 3), 0, { key: F.key, mode: 'reask' }); } }
    const h = F.item.help(0, stage);
    F.help = { stage, vis: h.vis, html: h.html }; F.input = ''; F.phase = 'help';
    if (lead) F.msg = lead;
    renderFishing(); say(`${lead || ''} ${h.say}`);
  }
  function afterCatch() {
    if (F.caught === GOAL) return celebrate(`You caught ${GOAL} fish!`, `That's ${V().fish} fish to build with.`, () => { F.caught = 0; nextFish(); }, [['Keep fishing', 'keep'], ['Go build', 'tobuild']]);
    nextFish();
  }
  function celebrate(title, text, then, buttons) {
    const ov = document.createElement('div'); ov.className = 'vover';
    ov.innerHTML = `<div class="vcard"><div class="vcard-art">${EM.theme.dot('cheer', 72)}</div><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="vrow">${(buttons || [['Yay!', 'keep']]).map(([t, a]) => `<button class="big-btn" data-ov="${a}">${esc(t)}</button>`).join('')}</div></div>`;
    document.body.appendChild(ov); say(title);
    ov.addEventListener('click', e => { const b = e.target.closest('[data-ov]'); if (!b) return; ov.remove(); if (b.dataset.ov === 'tobuild') { finishFishing(); mode = 'build'; B = { item: null, sel: null }; return renderMap(); } then(); });
  }
  function finishFishing() {
    if (!F) return;
    const st = F.stats;
    if (st.items) EM.logSession({ date: Date.now(), kind: 'fishing', title: 'Fishing in her village', items: st.items, fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk, rushed: st.rushed, relooks: 0,
      minutes: Math.round((Date.now() - F.started) / 6000) / 10, avg: st.times.length ? Math.round(st.times.reduce((a, b) => a + b, 0) / st.times.length) : 0,
      learned: [], fastKeys: st.fastKeys.slice(0, 40), byKind: { fact: { fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk }, proc: { fast: 0, slow: 0, wrong: 0, idk: 0 } } });
    F = null;
  }

  // ---------- taps ----------
  document.addEventListener('click', e => {
    if (!$root || !document.querySelector('.village')) return;
    const a = e.target.closest('[data-v],[data-item],[data-paint],[data-fd]');
    if (!a) return;
    EM.speech && EM.speech.prime && EM.speech.prime();
    if (a.dataset.fd) return fType(a.dataset.fd);
    if (a.dataset.item) { B.item = B.item === a.dataset.item ? null : a.dataset.item; B.sel = null; return renderMap(); }
    if (a.dataset.paint) { const p = B.sel && placedAt(B.sel); if (p) { p.paint = a.dataset.paint; EM.save(); } return renderMap(); }
    const v = V();
    switch (a.dataset.v) {
      case 'home': mode = 'map'; B = { item: null, sel: null }; return EM.go('home');
      case 'fish': return startFishing();
      case 'build': mode = 'build'; B = { item: null, sel: null }; return renderMap();
      case 'done': mode = 'map'; B = { item: null, sel: null }; return renderMap();
      case 'deselect': B.sel = null; return renderMap();
      case 'move': { const p = B.sel && placedAt(B.sel); if (p) { B.moving = p; say('Tap an empty spot.'); } return; }
      case 'putaway': { const p = B.sel && placedAt(B.sel); if (p) { v.placed.splice(v.placed.indexOf(p), 1); v.fish += px.ITEM[p.item].cost; EM.save(); } B.sel = null; return renderMap(); }
      case 'stopfish': finishFishing(); mode = 'map'; return renderMap();
      case 'fback': return fBack();
      case 'fok': return fOk();
      case 'fidk': return fIdk();
    }
  });
  document.addEventListener('keydown', e => { if (mode !== 'fish' || !F || !document.querySelector('.fishing')) return; if (/^[0-9]$/.test(e.key)) fType(e.key); else if (e.key === 'Backspace') fBack(); else if (e.key === 'Enter') fOk(); });

  EM.village = { render, drawVillage, drawFishing, checkUnlocks, meadowProgress, state: V, _fish: () => F, _mode: () => mode };
})();
