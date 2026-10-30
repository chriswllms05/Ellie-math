/* Ellie Math — pixel-art kit for her village: palette, ground, props, people, and the things she can build.
   Every pixel is placed on purpose: no anti-aliasing, no blur. Light comes from the top left, and outlines are
   darker shades of each material, never black. Scenes are drawn small and scaled up with nearest-neighbor.
   Depth and hierarchy decide how loud anything is: the world is a calm, warm middle ground; far things (opt.far)
   are lighter, cooler and lower in contrast; the things she's working with (people, the apples she counts, what she
   builds) keep full color. */
'use strict';
(function () {
  const EM = window.EM;
  const C = {
    // the middle ground: warm, sunlit and calm; grass tufts sit close to the grass so the ground stays quiet
    g0: '#4f7f55', g1: '#7aa863', g2: '#87b46c', g3: '#9bc27a', g4: '#b9d698', gf: '#d6e8b2',
    d0: '#8a6a55', d1: '#ad8b6c', d2: '#c9a985', d3: '#dcc4a0', d4: '#eedcbc',
    s0: '#56536a', s1: '#75738a', s2: '#9896aa', s3: '#bcbaca', s4: '#dcdae4',
    w0: '#4c76a2', w1: '#5a86b2', w2: '#7099c2', w3: '#94b8da', w4: '#c4dcf0',
    k0: '#5e4640', k1: '#84624f', k2: '#a07d62', k3: '#bf9c7c', k4: '#d9bc98',
    p0: '#a8978a', p1: '#c9b9a0', p2: '#e2d6be', p3: '#f4ecdc',
    r0: '#5a2a34', r1: '#8e4040', r2: '#b85a4a', r3: '#d47e60', r4: '#e8a888',
    b0: '#2f3f66', b1: '#435888', b2: '#5a72a6', b3: '#7c94c2', b4: '#a8bcde',
    y0: '#6a4a30', y1: '#9a6e3a', y2: '#c4964a', y3: '#ddb468', y4: '#f0d696',
    // trees: a cooler, deeper green than the grass so they stand apart from it
    l0: '#2e5a4a', l1: '#427656', l2: '#5a9062', l3: '#77aa72', l4: '#a2c98e',
    sk: '#f2c49c', sk2: '#c98a6c', glass: '#28405e', glass2: '#4e7ea8', lit: '#ffd27a', lit2: '#ffb453',
  };
  const ROOF = { red: ['r0', 'r1', 'r2', 'r3', 'r4'], blue: ['b0', 'b1', 'b2', 'b3', 'b4'], gold: ['y0', 'y1', 'y2', 'y3', 'y4'] };
  // Paints she can choose for the things she builds: [dark, base, light]
  const PAINT = {
    red: ['#83303a', '#d84a4a', '#ff8f7a'], orange: ['#a24b1f', '#e8833a', '#ffc078'], yellow: ['#a8791c', '#f2c94c', '#fff0a0'],
    green: ['#245535', '#4fa64a', '#a4d66a'], teal: ['#1d5a62', '#36a7b5', '#9be3e8'], blue: ['#2f4386', '#4f7be0', '#a3c8f0'],
    purple: ['#4a2f86', '#8d6be8', '#cdb8ff'], pink: ['#8e2f62', '#e56bb3', '#ffb8dd'], white: ['#9a97ad', '#eeeaf4', '#ffffff'],
  };
  const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const inEll = (x, y, cx, cy, rx, ry) => ((x - cx) ** 2) / (rx * rx) + ((y - cy) ** 2) / (ry * ry) <= 1;
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

  // Drawing primitives bound to one canvas, plus a back-to-front draw list (things lower on screen draw later).
  function kit(g0) {
    let g = g0;
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
    const P = (x, y, c) => R(x, y, 1, 1, c);
    const sprite = (x, y, rows, map) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.' && map[ch]) P(x + i, y + j, map[ch]); } });
    const ell = (cx, cy, rx, ry, c) => { for (let y = -ry; y <= ry; y++) { const s = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + .3); R(cx - s, cy + y, 2 * s + 1, 1, c); } };
    const line = (x0, y0, x1, y1, c) => { x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy; for (;;) { P(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
    const shadowEll = (cx, cy, rx, ry) => ell(cx, cy, rx, ry, 'rgba(28,36,58,.30)');
    const list = [], shadows = [];
    // a skin wraps every draw added from now on (a painted map fills the drawn shapes with its own pixels); raw(fn)
    // adds things unwrapped, for what still changes as she plays
    let skin = null;
    // add(y, f, tall): tall things also become occluders, so a moving character can pass behind them
    const add = (y, f, tall = true) => list.push({ y, f: skin ? skin(f) : f, tall }), shadow = f => shadows.push(skin ? skin(f) : f);
    const flush = () => { shadows.forEach(f => f()); list.sort((a, b) => a.y - b.y).forEach(t => t.f()); list.length = 0; shadows.length = 0; };
    const k = { R, P, sprite, ell, line, shadowEll, add, shadow, flush, C, get g() { return g; } };
    k.setCtx = c => { g = c; };
    k.setSkin = s => { skin = s; }; k.raw = fn => { const s = skin; skin = null; fn(); skin = s; };
    // Draw everything onto the current canvas, and also cut each tall thing out as its own sprite (with its base y).
    // D: the canvas's pixel density (a fine painted scene draws through a D-scaled transform); sprites keep scene units
    k.bake = (W, H, D = 1) => {
      shadows.forEach(f => f());
      const base = g, CW = W * D, CH = H * D, sc = document.createElement('canvas'); sc.width = CW; sc.height = CH;
      const sx = sc.getContext('2d', { willReadFrequently: true }); sx.setTransform(D, 0, 0, D, 0, 0); sx.imageSmoothingEnabled = false;
      const sprites = [];
      list.sort((a, b) => a.y - b.y).forEach(t => {
        t.f();
        if (!t.tall) return;
        sx.clearRect(0, 0, W, H); g = sx; t.f(); g = base;
        // the bounds, sampled every D canvas pixels (one per scene pixel) and widened by D: quick at any density
        const d = sx.getImageData(0, 0, CW, CH).data; let x0 = CW, y0 = CH, x1 = -1, y1 = -1;
        for (let y = 0; y < CH; y += D) for (let x = 0; x < CW; x += D) if (d[(y * CW + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return;
        x0 = Math.max(0, x0 - D); y0 = Math.max(0, y0 - D); x1 = Math.min(CW - 1, x1 + D); y1 = Math.min(CH - 1, y1 + D);
        const c = document.createElement('canvas'); c.width = x1 - x0 + 1; c.height = y1 - y0 + 1; c.getContext('2d').drawImage(sc, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
        sprites.push({ y: t.y, x: x0 / D, top: y0 / D, w: c.width / D, h: c.height / D, c });
      });
      list.length = 0; shadows.length = 0;
      return sprites;
    };

    // ---- tree: shaded canopy from discs, selective outline ----
    k.tree = (x, y, opt = {}) => {
      const r = opt.r || 9, leaf = opt.leaf || (opt.far ? FAR_LEAF : [C.l0, C.l1, C.l2, C.l3, C.l4]);
      shadow(() => shadowEll(x + 2, y + 1, r + 2, 3));
      add(y, () => {
        R(x - 1, y - 7, 3, 7, C.k2); P(x - 1, y - 7, C.k3); R(x + 1, y - 7, 1, 7, C.k1); P(x - 2, y - 1, C.k1); P(x + 2, y - 1, C.k1);
        const discs = [[0, -r - 6, r], [-r * .55, -r - 3, r * .7], [r * .55, -r - 3, r * .7], [0, -r * 1.55 - 6, r * .65]].map(([a, b, rr]) => [x + a, y + b, rr]);
        const inC = (px, py) => discs.some(([a, b, rr]) => (px - a) ** 2 + (py - b) ** 2 <= rr * rr);
        for (let py = Math.floor(y - r * 2.4 - 8); py <= y - 2; py++) for (let px = x - r - 4; px <= x + r + 4; px++) {
          if (!inC(px, py)) continue;
          const edge = !inC(px + 1, py) || !inC(px, py + 1) || !inC(px - 1, py) || !inC(px, py - 1);
          const lum = -(px - x) / r * .55 - (py - (y - r - 6)) / r * .75 + (hash(px >> 1, py >> 1, 13) - .5) * .7;
          let c = lum > .75 ? leaf[4] : lum > .15 ? leaf[3] : lum > -.45 ? leaf[2] : leaf[1];
          if (edge) c = (!inC(px, py + 1) || !inC(px + 1, py)) ? leaf[0] : leaf[1];
          P(px, py, c);
        }
        if (opt.apples) for (let n = 0; n < 5; n++) { const a = x - r + 3 + Math.floor(hash(x, n, 31) * (2 * r - 5)), b = y - r - 9 + Math.floor(hash(n, y, 32) * r); if (inC(a, b) && inC(a + 1, b + 1)) { P(a, b, '#e8473f'); P(a + 1, b, '#c22f39'); P(a, b + 1, '#c22f39'); P(a + 1, b + 1, '#8e2335'); P(a, b - 1, '#ff9f8a'); } }
      });
    };
    // ---- house: stone footing, timber frame, windows, door, shingled gable roof ----
    k.house = (x, y, w, roofName, opt = {}) => {
      const roof = ROOF[roofName].map(n => C[n]), [c0, c1, c2, c3, c4] = roof;
      const wh = opt.wh || 18, rh = Math.round(w * .5), top = y - wh;
      shadow(() => { g.fillStyle = 'rgba(28,36,58,.30)'; g.fillRect(x + 3, y - 2, w + 4, 5); g.fillRect(x + w, top - rh + 6, 5, wh + rh - 4); });
      add(y, () => {
        R(x, top, w, wh, C.p2);
        for (let n = 0; n < w * wh / 14; n++) P(x + Math.floor(hash(n, x, 41) * w), top + Math.floor(hash(n, y, 42) * wh), C.p1);
        R(x, top, 1, wh, C.p3); R(x + w - 1, top, 1, wh, C.p1);
        const beam = (bx, by, bw, bh) => { R(bx, by, bw, bh, C.k1); if (bw > bh) R(bx, by, bw, 1, C.k2); else R(bx, by, 1, bh, C.k2); };
        beam(x, top, w, 2); beam(x, top + Math.floor(wh / 2), w, 2); beam(x, top, 2, wh); beam(x + w - 2, top, 2, wh);
        if (w >= 34) beam(x + Math.floor(w / 2) - 1, top, 2, Math.floor(wh / 2));
        line(x + 2, top + Math.floor(wh / 2) - 1, x + 7, top + 2, C.k1); line(x + w - 3, top + Math.floor(wh / 2) - 1, x + w - 8, top + 2, C.k1);
        R(x - 1, y - 3, w + 2, 3, C.s2); for (let a = x - 1; a < x + w + 1; a += 4) { R(a, y - 3, 1, 3, C.s1); P(a + 1, y - 3, C.s4); P(a + 2, y - 3, C.s3); } R(x - 1, y - 1, w + 2, 1, C.s1);
        const sh = opt.shutter || [C.b1, C.b2];
        const win = (wx, wy) => {
          R(wx - 1, wy - 1, 9, 9, C.k1); R(wx, wy, 7, 7, opt.lit ? C.lit : C.glass); R(wx + 3, wy, 1, 7, C.k2); R(wx, wy + 3, 7, 1, C.k2);
          if (opt.lit) { R(wx, wy, 3, 3, C.lit2); P(wx + 1, wy + 1, '#fff2c4'); } else { P(wx + 1, wy + 1, C.w4); P(wx + 2, wy + 1, C.glass2); P(wx + 1, wy + 2, C.glass2); P(wx + 5, wy + 4, C.glass2); }
          R(wx - 4, wy - 1, 3, 9, sh[1]); R(wx - 4, wy - 1, 1, 9, sh[0]); R(wx + 8, wy - 1, 3, 9, sh[1]); R(wx + 10, wy - 1, 1, 9, sh[0]);
          R(wx - 1, wy + 8, 9, 2, C.k2); R(wx - 1, wy + 9, 9, 1, C.k1); [[0, '#ff7fae'], [2, '#ffe066'], [4, '#ff7fae'], [6, '#ffffff']].forEach(([a, c]) => { P(wx + a, wy + 7, C.l3); P(wx + a, wy + 6, c); });
        };
        if (w >= 34) { win(x + 7, top + 4); win(x + w - 14, top + 4); }
        const dx = x + Math.floor(w / 2) - 4, dy = y - 13;
        R(dx, dy + 1, 8, 12, C.k1); R(dx + 1, dy, 6, 1, C.k1); R(dx + 1, dy + 1, 6, 12, C.k2); P(dx + 1, dy + 1, C.k1); P(dx + 6, dy + 1, C.k1);
        R(dx + 3, dy + 1, 1, 12, C.k1); R(dx + 1, dy + 2, 1, 10, C.k3); P(dx + 5, dy + 7, C.y4); P(dx + 5, dy + 8, C.y1);
        R(dx - 1, y, 10, 1, C.s3); R(dx - 1, y + 1, 10, 1, C.s1);
        const ro = 4, rx0 = x - ro, rw = w + 2 * ro, ry0 = top - rh;
        for (let j = 0; j < rh + 2; j++) {
          const yy = ry0 + j, inset = Math.max(0, Math.round((rh - j) * .55) - 2), x0 = rx0 + inset, x1 = rx0 + rw - inset;
          for (let xx = x0; xx < x1; xx++) {
            const row = Math.floor(j / 3), sx = (xx - rx0 + (row % 2) * 3) % 6, sy = j % 3;
            let c = sy === 2 ? c1 : sx === 0 ? c1 : (sy === 0 && sx < 3) ? c3 : c2;
            if (xx < x0 + 2 && j > 1) c = sy === 2 ? c1 : c3;
            if (xx >= x1 - 2) c = c1;
            if (xx === x0 || xx === x1 - 1) c = c0;
            P(xx, yy, c);
          }
        }
        R(rx0 + Math.round(rh * .55) - 2, ry0 - 1, rw - 2 * (Math.round(rh * .55) - 2), 1, c4);
        R(rx0, top + 1, rw, 1, c0); R(x, top + 2, w, 2, C.p0);
        if (opt.chimney) { const cx = x + w - 10, cy = ry0 + 2; R(cx, cy - 8, 6, 12, C.s2); R(cx, cy - 8, 1, 12, C.s3); R(cx + 5, cy - 8, 1, 12, C.s1); R(cx - 1, cy - 9, 8, 2, C.s1); R(cx - 1, cy - 9, 8, 1, C.s3); }
        if (opt.extra) opt.extra(x, y, w, top);
      });
    };
    k.bush = (x, y) => { shadow(() => shadowEll(x + 1, y, 6, 2)); add(y, () => { for (let py = y - 8; py <= y; py++) for (let px = x - 7; px <= x + 7; px++) { const a = ((px - x) / 7) ** 2 + ((py - y + 4) / 4.6) ** 2; if (a > 1) continue; const e = a > .78, l = -(px - x) * .1 - (py - y + 4) * .25 + (hash(px, py, 51) - .5); P(px, py, e ? ((px > x || py > y - 3) ? C.l0 : C.l1) : l > .5 ? C.l4 : l > -.2 ? C.l3 : C.l2); } P(x - 3, y - 5, '#ff9ac6'); P(x + 3, y - 3, '#ff9ac6'); }); };
    k.rock = (x, y) => add(y, () => { R(x, y - 3, 6, 3, C.s2); R(x + 1, y - 4, 4, 1, C.s3); P(x + 1, y - 3, C.s4); R(x, y - 1, 6, 1, C.s1); });
    k.barrel = (x, y) => { shadow(() => shadowEll(x + 3, y, 4, 1)); add(y, () => { R(x, y - 8, 7, 8, C.k2); R(x, y - 8, 1, 8, C.k3); R(x + 6, y - 8, 1, 8, C.k1); R(x, y - 6, 7, 1, C.s1); R(x, y - 2, 7, 1, C.s1); R(x + 1, y - 9, 5, 1, C.k3); }); };
    k.crate = (x, y, fill) => { shadow(() => shadowEll(x + 4, y, 5, 1)); add(y, () => { R(x, y - 6, 8, 6, C.k2); R(x, y - 6, 8, 1, C.k3); R(x, y - 1, 8, 1, C.k1); line(x, y - 6, x + 7, y - 1, C.k1); if (fill) for (let a = 0; a < 3; a++) { P(x + 1 + a * 2, y - 7, fill); P(x + 2 + a * 2, y - 7, fill); P(x + 2 + a * 2, y - 8, fill); } }); };
    k.reeds = (x, y) => add(y, () => { R(x, y - 11, 1, 11, C.l2); R(x + 1, y - 8, 1, 8, C.l3); R(x, y - 14, 1, 4, C.k1); P(x, y - 14, C.k2); });
    k.lily = (x, y, flower) => add(0, () => { sprite(x, y, ['.ggg.', 'gGggg', 'gggg.', '.gg..'], { g: C.l3, G: C.l4 }); if (flower) { P(x + 2, y - 1, '#ff9ac6'); P(x + 1, y, '#ff9ac6'); P(x + 3, y, '#ff9ac6'); P(x + 2, y, '#ffe066'); } }, false);
    const FISH = ['..ccc.t', '.ccccctt', 'cecccc.t', '.ccccctt', '..ccc..t'], FISHR = FISH.map(r => [...r.padEnd(8, '.')].reverse().join(''));
    k.drawFish = (x, y, c, flip) => sprite(x, y, flip ? FISHR : FISH, { c, t: c, e: '#2b2433' });
    k.fish = (x, y, c, under = true) => add(under ? 0 : y, () => k.drawFish(x, y, c), !under);
    // wildflowers are scenery: small, few, and blended toward the grass
    k.flowersGround = (x, y, c) => { if (hash(x, y, 77) < .5) return; const soft = mix(c, C.g3, .35); P(x - 1, y, soft); P(x + 1, y, soft); P(x, y, '#f6f0de'); };
    // ---- fence: posts and two rails ----
    k.fence = (x0, y0, x1, y1) => {
      if (y0 === y1) { for (let x = x0; x <= x1; x += 5) add(y0 + 1, () => { R(x, y0 - 6, 2, 7, C.k3); P(x, y0 - 7, C.k4); R(x + 1, y0 - 6, 1, 7, C.k2); }); add(y0, () => { R(x0, y0 - 5, x1 - x0 + 2, 1, C.k2); R(x0, y0 - 3, x1 - x0 + 2, 1, C.k1); }); }
      else for (let y = y0; y <= y1; y += 5) add(y + 1, () => { R(x0, y - 6, 2, 7, C.k3); R(x0 + 1, y - 6, 1, 7, C.k2); if (y + 5 <= y1) R(x0, y - 2, 1, 5, C.k2); });
    };
    // ---- people: 9x15 sprites; she is drawn in her avatar's colors ----
    // Draws a person right now (no draw list). opt: walk frame 0-3, flip (facing left), blink, bob (px up), wave.
    k.drawPerson = (x, y, look, opt = {}) => {
      const m = { h: look.hair, s: look.skin, S: look.skinD, e: '#2b2433', b: look.shirt, B: look.shirtD, p: '#4a3b5a', o: '#2b2433', c: '#f08a8a' };
      const long = look.long, eyes = opt.blink ? (long ? 'hhsSsSsh.' : '.hsSsSsh.') : (long ? 'hhsesesh.' : '.hsesesh.');
      const w = opt.walk || 0;
      const arms = opt.wave ? ['.bbbbbbBs', '.sbbbbBS.', '..bbbbB..'] : w % 2 ? ['.bbbbbbB.', 'sbbbbbB.S', '.sbbbbB..'] : ['.bbbbbbB.', '.sbbbbBS.', '.sbbbbBs.'];
      const legs = w === 1 ? ['..pp..pp.', '.pp...pp.', '.oo....o.'] : w === 3 ? ['.pp..pp..', '.pp...pp.', '.o....oo.'] : ['..pp.pp..', '..pp.pp..', '..oo.oo..'];
      let rows = ['..hhhhh..', '.hhhhhhh.', 'hhhssshhh', eyes, (long ? 'hhsssssh' : '.hsssssh') + (long ? 'h' : '.'),
        long ? 'h.scscS.h' : '..scscS..', long ? 'h..SSS..h' : '...SSS...', '..bbbbb..', ...arms, '..bbbbB..', ...legs];
      if (opt.flip) rows = rows.map(r => [...r].reverse().join(''));
      sprite(x, y - 15 - (opt.bob || 0), rows, m);
    };
    k.person = (x, y, look, opt = {}) => {
      shadow(() => shadowEll(x + 4, y, 4, 1));
      add(y, () => { k.drawPerson(x, y, look, opt); if (opt.rodLeft) { line(x, y - 7, x - 14, y - 22, C.k2); P(x - 14, y - 22, C.k3); } });
    };
    // Dot, drawn right now: bobbing and blinking is up to the caller; sparkles twinkle with t (ms)
    k.drawDot = (cx, cy, t = 0, blink = false) => {
      sprite(cx - 6, cy - 6, ['....ooooo....', '..ooFFFFFoo..', '.oFFHHFFFFFo.', '.oFHHFFFFFFo.', 'oFFFFFFFFFFFo', blink ? 'oFFFFFFFFFFFo' : 'oFFeFFFFFeFFo', blink ? 'oFFeeFFFeeFFo' : 'oFFeFFFFFeFFo', 'oFFFFFFFFFFFo', 'oFFFmFFFmFFFo', '.oFFFmmmFFFo.', '.oFFFFFFFFDo.', '..ooFFFFDoo..', '....ooooo....'],
        { o: '#b8403a', F: '#f06a4f', H: '#ffb199', e: '#2b2433', m: '#2b2433', D: '#d4503f' });
      [[-11, 5, 0], [9, -10, 1], [12, 6, 2], [-8, -9, 3]].forEach(([a, b, i]) => { if (Math.sin(t / 260 + i * 1.7) > -.2) { P(cx + a, cy + b, '#fff7c2'); P(cx + a + 1, cy + b, '#ffe27a'); P(cx + a, cy + b + 1, '#ffe27a'); } });
    };
    // notice board: two posts, a roof, pinned notes
    k.board = (x, y) => { shadow(() => shadowEll(x + 9, y, 10, 2)); add(y, () => {
      R(x + 1, y - 18, 2, 18, C.k1); R(x + 15, y - 18, 2, 18, C.k1); R(x + 1, y - 18, 1, 18, C.k2); R(x + 15, y - 18, 1, 18, C.k2);
      R(x - 1, y - 17, 20, 12, C.k2); R(x - 1, y - 17, 20, 1, C.k3); R(x - 1, y - 6, 20, 1, C.k1);
      for (let j = 0; j < 4; j++) R(x - 3 + j, y - 21 + j, 24 - 2 * j, 1, j % 2 ? C.r1 : C.r2); R(x - 3, y - 18, 24, 1, C.r0);
      [[1, -15, '#f7ecd0'], [7, -16, '#ffe9a0'], [12, -14, '#d9ecff']].forEach(([a, b, c]) => { R(x + a, y + b, 5, 6, c); R(x + a + 1, y + b + 2, 3, 1, '#a08a74'); R(x + a + 1, y + b + 4, 2, 1, '#a08a74'); P(x + a + 2, y + b, '#d84a4a'); });
    }); };
    // ---- Dot: a little glowing wisp with Dot's face ----
    k.dot = (cx, cy) => add(999, () => k.drawDot(cx, cy), false);
    // ---- close-ups: people at 16x21, auto-shaded from a material map (outline and shade bottom right, light top left) ----
    // rows are the left half (mirrored) or a full 16; mat maps a letter to a 4-color ramp [outline, shade, base, light];
    // an uppercase letter forces that material's light. e w c m are eye, eye shine, cheek, mouth.
    k.chibi = (x, y, rows, mat, opt = {}) => {
      rows = rows.map(r => r.length >= 16 ? r : r + [...r].reverse().join('').replace(/ew/g, 'we'));
      if (opt.flip) rows = rows.map(r => [...r].reverse().join('').replace(/we/g, 'ew'));
      const n = rows.length, top = y - n - (opt.bob || 0), at = (i, j) => (j < 0 || j >= n || i < 0 || i >= 16) ? '.' : rows[j][i], solid = (i, j) => at(i, j) !== '.';
      const FIX = { e: '#2b2433', w: '#ffffff', c: '#f2938a', m: '#a8433f' };
      if (!opt.noShadow) shadowEll(x + 8, y, 7, 2);
      for (let j = 0; j < n; j++) for (let i = 0; i < 16; i++) {
        let ch = rows[j][i]; if (ch === '.') continue;
        if (opt.blink && (ch === 'e' || ch === 'w') && at(i, j - 1).toLowerCase() !== 'e' && at(i, j - 1) !== 'w') ch = 's';
        if (FIX[ch]) { P(x + i, top + j, FIX[ch]); continue; }
        const lo = ch.toLowerCase(), ramp = mat[lo]; if (!ramp) continue;
        let c = ramp[2];
        if (ch !== lo) c = ramp[3];
        else if (!solid(i + 1, j) || !solid(i, j + 1)) c = ramp[0];
        else if (!solid(i - 1, j) || !solid(i, j - 1)) c = ramp[1];
        else { let r = 0; while (at(i + r + 1, j).toLowerCase() === lo) r++; let l = 0; while (at(i - l - 1, j).toLowerCase() === lo) l++;
          if (r <= 1 && l > 2) c = ramp[1]; else if (at(i, j + 1).toLowerCase() !== lo && lo !== 's') c = ramp[1]; else if (l === 0 && at(i, j - 1).toLowerCase() !== lo) c = ramp[3]; }
        P(x + i, top + j, c);
      }
    };
    k.apple = (x, y, kind = 'red', far) => sprite(x, y, ['..k..', '.rlr.', 'rLrrr', 'rrrrd', '.rdd.'], { k: C.k1, l: C.l3, ...(far ? FAR_APPLES : APPLES)[kind] });
    // a woven basket, n apples heaped in it; x,y = bottom left, 22 wide
    k.basket = (x, y, n, kind = 'red') => {
      shadowEll(x + 11, y, 12, 2);
      for (let i = 0; i < n; i++) { const row = Math.floor(i / 4), col = i % 4; k.apple(x + 3 + col * 4 + (row % 2) * 2, y - 15 - row * 3 + (col % 2), kind); }
      for (let j = 0; j < 9; j++) { const ins = j > 6 ? j - 6 : 0; for (let i = ins; i < 22 - ins; i++) P(x + i, y - 9 + j, (i + (j >> 1)) % 3 === 0 ? C.k1 : j % 2 ? C.k2 : C.k3); }
      R(x - 1, y - 10, 24, 2, C.k3); R(x - 1, y - 10, 24, 1, C.k4); R(x - 1, y - 8, 24, 1, C.k1);
    };
    // a crate of ten (two rows of 5), the orchard's ten-frame. cells: 'a' red, 'b' yellow, 'e' empty;
    // uppercase is an apple moved over to make 10, framed in light when ring is on (the caller blinks it)
    k.crate10 = (x, y, cells, ring) => {
      shadowEll(x + 19, y + 1, 20, 2);
      R(x, y - 18, 38, 18, C.k1); R(x + 1, y - 17, 36, 16, C.k2); R(x + 1, y - 17, 36, 1, C.k3); R(x + 1, y - 9, 36, 1, C.k1);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const cx = x + 2 + c * 7, cy = y - 16 + r * 8, v = cells[r * 5 + c]; const moved = v === 'A' || v === 'B'; R(cx, cy, 6, 6, moved && ring ? '#fff7c2' : C.k0); if (moved && ring) R(cx + 1, cy + 1, 4, 4, C.k0); if (v && v !== 'e') k.apple(cx, cy, v.toLowerCase() === 'a' ? 'red' : 'yellow'); }
    };
    // a coin (6x5), a pie, and a tray of ten for counting coins: 'a' a coin, 'x' a coin that paid for something
    // (pale; framed in light when ring is on, the caller blinks it), 'e' empty
    k.coin = (x, y) => sprite(x, y, ['.oooo.', 'oyYyyo', 'oYyyyd', 'oyyydd', '.oddd.'], { o: '#8c5a28', y: '#f2c94c', Y: '#fff0a0', d: '#c08636' });
    k.pie = (x, y) => { k.ell(x + 6, y + 2, 7, 3, '#e8e2d4'); k.ell(x + 6, y + 1, 6, 2, '#c07a3a'); k.ell(x + 6, y + 1, 5, 2, '#e2ae52'); for (let i = 1; i < 11; i += 3) P(x + i + 1, y + 1, '#a8602a'); P(x + 4, y, '#f8dc8a'); R(x, y + 4, 13, 1, '#b8b2a4'); };
    k.tray10 = (x, y, cells, ring) => {
      shadowEll(x + 19, y + 1, 20, 2);
      R(x, y - 18, 38, 18, C.k1); R(x + 1, y - 17, 36, 16, C.k3); R(x + 1, y - 17, 36, 1, C.k4); R(x + 1, y - 9, 36, 1, C.k2);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const cx = x + 2 + c * 7, cy = y - 16 + r * 8, v = cells[r * 5 + c];
        R(cx, cy, 6, 6, v === 'x' && ring ? '#fff7c2' : C.k2);
        if (v === 'a') k.coin(cx, cy + 1);
        else if (v === 'x') sprite(cx, cy + 1, ['.oooo.', 'o....o', 'o....o', 'o....o', '.oooo.'], { o: '#a08a6a' }); }
    };
    // a bun (5x4), and a baking tray of ten (two rows of 5): 'a' 'b' a bun, uppercase the one more (framed in light
    // when ring is on; the caller blinks it), 'e' empty
    k.bun = (x, y) => sprite(x, y, ['.ooo.', 'oLyyo', 'oyyyd', '.ddd.'], { o: '#a8602a', L: '#f8dc8a', y: '#e2ae52', d: '#c07a3a' });
    k.bunTray10 = (x, y, cells, ring) => {
      shadowEll(x + 19, y + 1, 20, 2);
      R(x, y - 18, 38, 18, C.s0); R(x + 1, y - 17, 36, 16, C.s2); R(x + 1, y - 17, 36, 1, C.s3); R(x + 1, y - 9, 36, 1, C.s1);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const cx = x + 2 + c * 7, cy = y - 16 + r * 8, v = cells[r * 5 + c], more = v === 'A' || v === 'B';
        R(cx, cy, 6, 6, more && ring ? '#fff7c2' : C.s1); if (v && v !== 'e') k.bun(cx, cy + 1); }
    };
    // a package (tied with string) and the mail cart
    k.package = (x, y, w = 14, h = 10) => { R(x, y, w, h, '#c89a64'); R(x, y, w, 1, '#e2bc88'); R(x + w - 1, y, 1, h, '#9a6e40'); R(x, y + h - 1, w, 1, '#9a6e40'); R(x + Math.floor(w / 2), y, 2, h, '#b84a3e'); R(x, y + Math.floor(h / 2), w, 1, '#b84a3e'); };
    k.cart = (x, y) => { shadowEll(x + 30, y + 8, 30, 3); R(x, y - 16, 60, 16, C.k1); R(x + 1, y - 15, 58, 14, C.k2); R(x + 1, y - 15, 58, 1, C.k3); for (let i = x + 8; i < x + 60; i += 12) R(i, y - 15, 1, 14, C.k1);
      for (const wx of [x + 10, x + 50]) { k.ell(wx, y + 2, 6, 6, C.k1); k.ell(wx, y + 2, 5, 5, C.k3); k.ell(wx, y + 2, 2, 2, C.k1); R(wx - 5, y + 2, 10, 1, C.k2); R(wx, y - 3, 1, 10, C.k2); }
      R(x + 60, y - 10, 14, 2, C.k1); };
    // a wooden sign on two posts; returns its face [x, y, w, h] for the words drawn over it
    k.sign = (x, y, w, h) => {
      shadowEll(x + w / 2, y, w / 2 + 2, 2);
      R(x + 6, y - 16, 3, 16, C.k1); R(x + w - 9, y - 16, 3, 16, C.k1); R(x + 6, y - 16, 1, 16, C.k2); R(x + w - 9, y - 16, 1, 16, C.k2);
      const top = y - 16 - h; R(x, top, w, h, C.k1);
      for (let j = 1; j < h - 1; j++) R(x + 1, top + j, w - 2, 1, j % 6 === 0 ? C.k2 : j % 6 === 1 ? C.k4 : C.d3);
      for (let i = 0; i < 12; i++) P(x + 2 + Math.floor(hash(i, x, 3) * (w - 4)), top + 2 + Math.floor(hash(i, y, 4) * (h - 4)), C.d2);
      [[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]].forEach(([a, b]) => P(x + a, top + b, C.s2));
      return [x + 1, top + 1, w - 2, h - 2];
    };
    k.smoke = (x, y) => add(998, () => { [[0, 0, 2], [2, -5, 3], [0, -11, 3], [3, -17, 4]].forEach(([a, b, r], i) => { ell(x + a, y + b, r, r - (r > 2 ? 1 : 0), i > 2 ? 'rgba(255,255,255,.55)' : '#f3f1f6'); P(x + a + r - 1, y + b + 1, '#cfcbd8'); }); });
    return k;
  }

  // Ground, per pixel: grass with tufts, water banded by depth with a sandy shore, dirt paths with a grass lip.
  function ground(g, W, H, { water = () => false, path = () => false, plot = () => false, tall = () => false }) {
    const img = g.createImageData(W, H), D = img.data, HX = {};
    for (const k in C) HX[k] = hex(C[k]);
    const wm = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) wm[y * W + x] = water(x, y) ? 1 : 0;
    const dist = new Uint8Array(W * H).fill(255);
    for (let i = 0; i < W * H; i++) if (!wm[i]) dist[i] = 0;
    for (let pass = 0; pass < 2; pass++) for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const ys = pass ? H - 1 - y : y, xs = pass ? W - 1 - x : x, j = ys * W + xs; if (!wm[j]) continue; dist[j] = Math.min(dist[j], dist[j - 1] + 1, dist[j + 1] + 1, dist[j - W] + 1, dist[j + W] + 1); }
    const near = (x, y) => { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const xx = x + a, yy = y + b; if (xx >= 0 && yy >= 0 && xx < W && yy < H && wm[yy * W + xx]) return true; } return false; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; let k;
      if (wm[i]) {
        const d = dist[i];
        k = d <= 1 ? 'w3' : d <= 5 ? 'w2' : d <= 34 ? 'w1' : 'w0';
        if (k === 'w1' && hash(x >> 3, y >> 2, 15) < .25) k = 'w2';
        if (d === 1 && hash(x, y, 9) < .55) k = 'w4';
        if (d > 3 && y % 7 === 0 && hash(x >> 2, y, 4) < .14) k = d > 34 ? 'w2' : 'w3';
      } else if (near(x, y)) k = hash(x, y, 2) < .2 ? 'd4' : 'd3';
      else if (plot(x, y)) { k = (x + y) % 2 && hash(x, y, 8) < .3 ? 'd1' : 'd2'; if (y % 4 === 0) k = 'd1'; if (!plot(x, y - 1)) k = 'd0'; }
      else if (path(x, y)) { k = 'd2'; const h = hash(x, y, 5); if (h < .06) k = 'd3'; else if (h < .1) k = 'd1'; if (!path(x, y - 1)) k = 'g1'; else if (!path(x, y + 1)) k = 'd1'; }
      else {
        const t = tall(x, y);
        k = t ? 'g3' : 'g2';
        const tx = x & 15, ty = y & 15, s = hash(x >> 4, y >> 4, 1);
        for (const [a, b] of [[3, 4], [10, 2], [6, 11], [13, 9], [1, 14]]) { const ax = (a + Math.floor(s * 7)) & 15, by = (b + Math.floor(s * 5)) & 15; if (ty === by && (tx === ax - 1 || tx === ax + 1)) k = 'g1'; if (ty === by - 1 && tx === ax) k = t ? 'g4' : 'g3'; if (ty === by + 1 && tx === ax) k = 'g1'; }
        if (t && hash(x, y, 19) < .18) k = (y % 3) ? 'g4' : 'g1';
        if (hash(x, y, 11) < .004) k = 'gf';
      }
      const c = HX[k]; D[i * 4] = c[0]; D[i * 4 + 1] = c[1]; D[i * 4 + 2] = c[2]; D[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  // Scale the small scene up with nearest-neighbor, then add soft light on top without blurring a pixel.
  function present(canvas, pc, S, { glows = [], warm = true } = {}) {
    canvas.width = pc.width * S; canvas.height = pc.height * S;
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
    c.drawImage(pc, 0, 0, canvas.width, canvas.height);
    const CW = canvas.width, CH = canvas.height;
    if (warm) { c.globalCompositeOperation = 'soft-light'; const gr = c.createLinearGradient(0, 0, CW, CH); gr.addColorStop(0, 'rgba(255,220,160,.45)'); gr.addColorStop(1, 'rgba(110,140,255,.22)'); c.fillStyle = gr; c.fillRect(0, 0, CW, CH); }
    c.globalCompositeOperation = 'lighter';
    glows.forEach(([x, y, r, col]) => { const q = c.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S); q.addColorStop(0, col); q.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = q; c.fillRect((x - r) * S, (y - r) * S, 2 * r * S, 2 * r * S); });
    c.globalCompositeOperation = 'source-over';
    const gr = c.createRadialGradient(CW / 2, CH / 2, CH * .4, CW / 2, CH / 2, CW * .75); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(30,20,45,.28)'); c.fillStyle = gr; c.fillRect(0, 0, CW, CH);
  }

  // the apples she counts keep full color; apples far up in the trees fade back
  const APPLES = { red: { r: '#e8473f', L: '#ffb0a0', d: '#a82a33' }, yellow: { r: '#f7c531', L: '#fff3b0', d: '#c4861c' } };
  const FAR_APPLES = { red: { r: '#c98b80', L: '#e8c4ba', d: '#a8736a' }, yellow: { r: '#d8c48a', L: '#efe4c0', d: '#b8a06a' } };
  const FAR_LEAF = ['#4a7a60', '#5a8a6a', '#6e9c76', '#86b086', '#a6c8a0'];
  // a 4-color ramp from one color: [outline, shade, base, light]
  const mix = (c, to, f) => { const a = c[0] === '#' ? hex(c) : c.match(/\d+/g).map(Number), b = hex(to); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * f).toString(16).padStart(2, '0')).join(''); };
  const ramp = c => [mix(c, '#1a1020', .62), mix(c, '#1a1020', .32), mix(c, '#000000', 0), mix(c, '#ffffff', .35)];
  // close-up people: her (in her avatar's colors) and the villagers
  const FACE = ['hhssssss', 'hhsswess', 'hhsseess', 'hhscssss', 'hhhssssm', 'hhhhssss', 'hhh...ss'], FACE_SHORT = ['hhssssss', 'hhsswess', 'hhsseess', 'hhscssss', '.hhssssm', '..hsssss', '......ss'];
  const CHIBI = {
    her: (look, long) => ({ rows: ['....hhhh', '..hhhhhh', '.hhHHhhh', '.hHhhhhh', 'hhhhhhhh', 'hhhhshss', ...(long ? FACE : FACE_SHORT), long ? 'hh.bbbbb' : '...bbbbb', long ? 'h.bBbbbb' : '..bBbbbb', '.bbbbbbb', '.sbbbbbb', '..pppppp', '.ppppppp', '.....ss.', '....fff.'],
      mat: { h: ramp(look.hair), s: ramp(look.skin), b: ramp(look.shirt), p: ramp('#55467a'), f: ramp('#6b4430') } }),
    bea: () => ({ rows: ['...wwwww', '..wWWwww', '..wwwwww', '..wwwwww', '.kkkkkkk', '.hhsssss', '.hsswess', '.hsseess', '.hscssss', '.hhssssm', '..hsssss', '.....sss', '..bbbbbb', '.bbaaaaa', '.bbaAaaa', '.sbaaaaa', '..aaaaaa', '.ppppppp', '.....pp.', '....fff.'],
      mat: { w: ramp('#f4efe2'), k: ramp('#cfc6b4'), h: ramp('#4a2a1a'), s: ramp('#e8b07f'), b: ramp('#c06456'), a: ramp('#f4efe2'), p: ramp('#55467a'), f: ramp('#6b4430') } }),
    mo: () => ({ rows: ['....qqqq', '..qqQQqq', '.qqQqqqq', '.qqqqqqq', 'kkkkkkkk', '.hhsssss', '.hsswess', '.hsseess', '.hscsssss'.slice(0, 8), '.hhssssm', '..hsssss', '.....sss', '..qqqqqq', '.qqqqqqq', '.qqyqqqq', '.sqqqqqq', '..qqqqqq', '.ddddddd', '.....dd.', '....fff.'],
      mat: { q: ramp('#3a5aa8'), k: ramp('#2b2b3a'), h: ramp('#3a2418'), s: ramp('#c98a6c'), y: ramp('#e2ae52'), d: ramp('#3a3a4e'), f: ramp('#6b4430') } }),
    pip: () => ({ rows: ['....ssss', '..sSssss', '.sSsssss', '.sssssss', 'wsssssss', 'wwssssss', 'wwsswess', 'wwsseess', 'wwscssss', '.wsswwww', '.wwwwwww', '..wwwwww', '...wwwww', '..bv.www', '.bvvvvbb', '.bvvVvbb', '.svvvvbb', '..vvvvvv', '.ppppppp', '.....pp.', '....fff.'],
      mat: { s: ramp('#f2c49c'), w: ramp('#e8e8f0'), v: ramp('#7a4a2a'), b: ramp('#c8d4ea'), p: ramp('#6a6a7a'), f: ramp('#6b4430') } }),
    // Tom the carpenter: a flat cap, a beard, a leather apron over a checked shirt
    tom: () => ({ rows: ['....qqqq', '..qqQQqq', '.qqQqqqq', 'kkkkkkkk', '.hhsssss', '.hsswess', '.hsseess', '.hscssss', '.hhhsssm', '..hhhhhh', '....hhhh', '..bbbbbb', '.bbaaaaa', '.bbaAaaa', '.sbaayaa', '..aaaaaa', '.ppppppp', '.....pp.', '....fff.'],
      mat: { q: ramp('#6a5a4a'), k: ramp('#4a3e34'), h: ramp('#9a5a2a'), s: ramp('#e0a882'), b: ramp('#3f7a8a'), a: ramp('#b88a5a'), y: ramp('#8a8a96'), p: ramp('#4a4a5a'), f: ramp('#6b4430') } }),
    rosa: () => ({ rows: ['.....yyy', '...yYYyy', '..yYyyyy', '..rrrrrr', 'yyyyyyyy', '.hhhhhhh', '.hhsssss', '.hsswess', '.hsseess', '.hscssss', '.hhssssm', 'hhhhssss', 'hh....ss', '..bbbbbb', '.bbaaaaa', '.bbaAaaa', '.sbaaaaa', '..aaaaaa', '.ppppppp', '.....ss.', '....fff.'],
      mat: { y: ramp('#e2ae52'), r: ramp('#b84a3e'), h: ramp('#a84a2a'), s: ramp('#f2c49c'), b: ramp('#4f8a5b'), a: ramp('#f4efe2'), p: ramp('#4f8a5b'), f: ramp('#6b4430') } }),
  };
  // Her avatar's colors, for her pixel self.
  function herLook() {
    const a = (EM.avatar && EM.avatar.get()) || {}, O = (EM.avatar && EM.avatar.OPTIONS) || {};
    const shade = (c, f) => { const [r, g, b] = hex(c); return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`; };
    const skin = (O.SKIN || [])[a.skin] || C.sk, hair = (O.HAIR_COLORS || [])[a.hairColor] || '#3a2418', shirt = (O.SHIRTS || [])[a.shirt] || '#e46a9a';
    return { skin, skinD: shade(skin, .8), hair, shirt, shirtD: shade(shirt, .75), long: ['long', 'braids', 'ponytail', 'bob'].includes(a.hair) };
  }

  // ---------- things she can build: each fits one 16x16 cell, drawn with its base at the bottom middle ----------
  // cost is in fish; paint is the starting color; area 'meadow' items appear once the meadow opens.
  const ITEMS = [
    { id: 'flowers', name: 'Flowers', cost: 2, paint: 'pink' },
    { id: 'bush', name: 'Berry bush', cost: 3, paint: 'red' },
    { id: 'pumpkin', name: 'Pumpkin', cost: 3, paint: 'orange' },
    { id: 'lantern', name: 'Lantern', cost: 4, paint: 'yellow' },
    { id: 'bench', name: 'Bench', cost: 5, paint: 'blue' },
    { id: 'birdhouse', name: 'Birdhouse', cost: 5, paint: 'red' },
    { id: 'tree', name: 'Little tree', cost: 6, paint: 'green' },
    { id: 'flag', name: 'Flag', cost: 3, paint: 'purple' },
    { id: 'doghouse', name: 'Doghouse', cost: 9, paint: 'teal' },
    { id: 'well', name: 'Wishing well', cost: 10, paint: 'red' },
    { id: 'sheep', name: 'Sheep', cost: 6, paint: 'white', area: 'meadow' },
    { id: 'hay', name: 'Haystack', cost: 4, paint: 'yellow', area: 'meadow' },
    { id: 'scarecrow', name: 'Scarecrow', cost: 5, paint: 'blue', area: 'meadow' },
    // showpieces: big (2 by 2 spots), painted art, unlocked as the village grows
    { id: 'duckpond', name: 'Duck pond', cost: 25, paint: 'blue', size: 2, level: 3 },
    { id: 'treehouse', name: 'Treehouse', cost: 35, paint: 'green', size: 2, level: 5 },
    { id: 'fountain', name: 'Fountain', cost: 50, paint: 'blue', size: 2, level: 7 },
    // gifts from the villagers: free, and only once they've given them to her
    { id: 'appletree', name: "Rosa's apple tree", cost: 0, paint: 'green', gift: 'orchard' },
    { id: 'kitten', name: "Mr. Pip's kitten", cost: 0, paint: 'orange', gift: 'market' },
    { id: 'mailbox', name: "Mo's mailbox", cost: 0, paint: 'blue', gift: 'post' },
    { id: 'cake', name: "Bea's cake", cost: 0, paint: 'pink', gift: 'bakery' },
    { id: 'wheelbarrow', name: "Tom's wheelbarrow", cost: 0, paint: 'red', gift: 'workshop' },
    { id: 'kite', name: 'The village kite', cost: 0, paint: 'yellow', gift: 'notes' },
  ];
  const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
  // x,y = top-left of the cell
  function drawItem(k, id, x, y, paint) {
    const { R, P, sprite, line } = k, [pd, pb, pl] = PAINT[paint] || PAINT[ITEM[id].paint];
    const sh = (cx, rx) => k.ell(x + cx, y + 15, rx, 1, 'rgba(28,36,58,.30)');
    switch (id) {
      case 'flowers': sh(8, 6); for (const [a, b] of [[3, 9], [8, 6], [12, 10], [6, 12], [11, 4]]) { R(x + a, y + b + 1, 1, 15 - b - 1, C.l2); P(x + a - 1, y + b + 3, C.l3); P(x + a, y + b - 1, pb); P(x + a - 1, y + b, pb); P(x + a + 1, y + b, pb); P(x + a, y + b + 1, pd); P(x + a, y + b, pl); } break;
      case 'bush': sh(8, 7); for (let py = 5; py <= 15; py++) for (let px = 1; px <= 15; px++) { const a = ((px - 8) / 7) ** 2 + ((py - 10.5) / 5.5) ** 2; if (a > 1) continue; const e = a > .75, l = -(px - 8) * .12 - (py - 10) * .22 + (hash(px, py, 52) - .5); P(x + px, y + py, e ? (px > 8 || py > 12 ? C.l0 : C.l1) : l > .5 ? C.l4 : l > -.2 ? C.l3 : C.l2); } [[4, 8], [9, 7], [12, 11], [6, 12], [10, 13]].forEach(([a, b]) => { P(x + a, y + b, pb); P(x + a + 1, y + b, pd); P(x + a, y + b - 1, pl); }); break;
      case 'pumpkin': sh(8, 6); sprite(x + 2, y + 6, ['.....g......', '....gg......', '..oOOOoOOo..', '.oOOLOoOLOo.', 'oOOLOOoOOLOo', 'oOOOOOoOOOOd', 'oOOOOOoOOOOd', '.oOOOOoOOOd.', '..dddddddd..'], { g: C.l2, o: pd, O: pb, L: pl, d: pd }); P(x + 9, y + 5, C.l3); P(x + 10, y + 4, C.l3); break;
      case 'lantern': sh(8, 3); R(x + 7, y + 7, 2, 8, C.s1); R(x + 7, y + 7, 1, 8, C.s2); R(x + 5, y + 14, 6, 2, C.s1); R(x + 5, y + 14, 6, 1, C.s2);
        sprite(x + 4, y, ['..ssss..', '.ssssss.', '.sLLLLs.', '.sLlLLs.', '.sLLLLs.', '.ssssss.', '...ss...'], { s: C.s0, L: pb, l: pl }); break;
      case 'bench': sh(8, 7); R(x + 1, y + 7, 14, 2, pb); R(x + 1, y + 7, 14, 1, pl); R(x + 1, y + 10, 14, 2, pb); R(x + 1, y + 10, 14, 1, pl); R(x + 1, y + 12, 14, 1, pd); R(x + 2, y + 13, 2, 3, C.k1); R(x + 12, y + 13, 2, 3, C.k1); R(x + 2, y + 9, 1, 1, pd); R(x + 13, y + 9, 1, 1, pd); break;
      case 'birdhouse': sh(8, 3); R(x + 7, y + 8, 2, 8, C.k2); R(x + 7, y + 8, 1, 8, C.k3); sprite(x + 3, y + 1, ['....rr....', '...rRRr...', '..rRRRRr..', '.rRRRRRRr.', 'rrrrrrrrrr', '.wwwwwwww.', '.wwwkkwww.', '.wwwkkwww.', '.wwwwwwww.'].map(r => r.slice(0, 10)), { r: pd, R: pb, w: C.p2, k: C.k0 }); P(x + 7, y + 2, pl); break;
      case 'tree': { const leaf = [C.l0, pd, pb, pl]; sh(8, 6); R(x + 7, y + 9, 2, 7, C.k2); P(x + 7, y + 9, C.k3); for (let py = 0; py <= 11; py++) for (let px = 1; px <= 15; px++) { const a = ((px - 8) / 6.5) ** 2 + ((py - 6) / 5.6) ** 2; if (a > 1) continue; const e = a > .78, l = -(px - 8) * .12 - (py - 5) * .2 + (hash(px >> 1, py >> 1, 53) - .5) * .8; P(x + px, y + py, e ? (px > 8 || py > 8 ? leaf[0] : leaf[1]) : l > .45 ? leaf[3] : l > -.25 ? leaf[2] : leaf[1]); } break; }
      case 'appletree': { const leaf = [C.l0, pd, pb, pl]; sh(8, 7); R(x + 7, y + 9, 2, 7, C.k2); P(x + 7, y + 9, C.k3); for (let py = 0; py <= 11; py++) for (let px = 0; px <= 16; px++) { const a = ((px - 8) / 7.5) ** 2 + ((py - 6) / 5.8) ** 2; if (a > 1) continue; const e = a > .8, l = -(px - 8) * .12 - (py - 5) * .2 + (hash(px >> 1, py >> 1, 57) - .5) * .8; P(x + px, y + py, e ? (px > 8 || py > 8 ? leaf[0] : leaf[1]) : l > .45 ? leaf[3] : l > -.25 ? leaf[2] : leaf[1]); }
        [[4, 4], [10, 3], [7, 8], [12, 8], [3, 9]].forEach(([a, b]) => { P(x + a, y + b, '#e8473f'); P(x + a + 1, y + b, '#c22f39'); P(x + a, y + b + 1, '#c22f39'); P(x + a + 1, y + b + 1, '#8e2335'); P(x + a, y + b, '#ffb0a0'); }); break; }
      case 'kitten': sh(7, 6); sprite(x + 1, y + 4, ['..o...o.........', '.oOo.oOo........', '.oOOOOOo........', 'oOeOOOeOo.......', 'oOOOnOOOo.......', '.oOOOOOo....t...', '..oOOOOo.....t..', '.oOOOOOOo....t..', '.oOLLOOOOottt...', '.oOLLOOOOOOo....', '..oooooooooo....'], { o: pd, O: pb, L: pl, e: '#2b2433', n: '#f08a8a', t: pd }); break;
      case 'cake': sh(8, 6); R(x + 3, y + 13, 10, 1, C.k1); R(x + 7, y + 13, 2, 3, C.k2); sprite(x + 2, y + 3, ['.....yy.....', '.....r......', '..wwwwwwww..', '.wLLwwwwwww.', '.pppppppppp.', '.PPPPPPPPPP.', '.wwwwwwwwww.', '.pppppppppp.', '.dddddddddd.', '..........'], { y: '#ffe066', r: '#e8473f', w: '#fff7f0', L: '#ffffff', p: pb, P: pl, d: pd }); break;
      case 'mailbox': sh(8, 4); R(x + 7, y + 8, 2, 8, C.k2); R(x + 7, y + 8, 1, 8, C.k3); sprite(x + 3, y + 1, ['..bbbbbb..', '.bBBBBBBb.', 'bBLLBBBBBb', 'bBBBBBBBBb', 'bBBBBBBBBb', 'bbbbbbbbbb'], { b: pd, B: pb, L: pl }); R(x + 12, y, 1, 5, C.k1); R(x + 12, y, 3, 2, '#e8473f'); R(x + 5, y + 4, 4, 1, pd); break;
      case 'wheelbarrow': sh(8, 7); sprite(x, y + 6, ['..............k', 'llllllllllkkk..', 'bbbbbbbbbb.....', '.bbbbbbbbb.....', '..ddddddd......', '..oOo...k......', '.oO.Oo..k......', '..oOo..........'], { l: pl, b: pb, d: pd, k: C.k1, o: C.s0, O: C.s2 }); break;
      case 'kite': sh(8, 2); R(x + 7, y + 9, 1, 7, C.k1); sprite(x + 3, y, ['....b....', '...bbl...', '..bbbll..', '.bbbblll.', 'bbbbkllll', '.ddddbbb.', '..dddbb..', '...ddb...', '....k....'].map(r => r.padEnd(9, '.')), { b: pb, l: pl, d: pd, k: C.k1 });
        [[5, 11], [9, 13]].forEach(([a, b]) => { P(x + a, y + b, '#e8473f'); P(x + a + 1, y + b, '#e8473f'); P(x + a - 1, y + b - 1, '#e8473f'); }); line(x + 7, y + 9, x + 5, y + 11, C.k3); line(x + 7, y + 12, x + 9, y + 13, C.k3); break;
      case 'flag': sh(5, 3); R(x + 4, y + 1, 1, 15, C.k1); P(x + 4, y, C.y4); sprite(x + 5, y + 2, ['FFFFFFFF', 'FLLFFFFd', 'FFFFFFd.', 'FFFFFFFF', 'dddddddd'], { F: pb, L: pl, d: pd }); break;
      case 'doghouse': sh(8, 8); sprite(x, y + 1, ['......rr........', '.....rRRr.......', '....rRRRRr......', '...rRLRRRRr.....', '..rRLRRRRRRr....', '.rrrrrrrrrrrr...', '..wwwwwwwwww....', '..wwwkkkkwww....', '..wwkkkkkkww....', '..wwkkkkkkww....', '..wwkkkkkkww....', '..WWWWWWWWWW....'], { r: pd, R: pb, L: pl, w: C.k3, W: C.k2, k: C.k0 });
        sprite(x + 10, y + 7, ['.ee...', 'eaaa..', 'aaaan.', 'aaaa..', '.a.a..'], { a: '#e8c08a', e: '#9a6a3a', n: '#2b2433' }); P(x + 12, y + 8, '#2b2433'); break;
      case 'well': sh(8, 7); for (let py = 9; py < 16; py++) for (let px = 2; px < 14; px++) P(x + px, y + py, (py - 9) % 3 === 2 || (px + (Math.floor((py - 9) / 3) % 2) * 2) % 4 === 3 ? C.s1 : (py - 9) % 3 === 0 ? C.s4 : C.s3); R(x + 4, y + 9, 8, 2, C.w1); P(x + 5, y + 9, C.w3);
        R(x + 2, y + 3, 1, 7, C.k1); R(x + 13, y + 3, 1, 7, C.k1); R(x + 3, y + 5, 10, 1, C.k2); for (let j = 0; j < 4; j++) R(x + j, y + j, 16 - 2 * j, 1, j % 2 ? pd : pb); P(x + 1, y + 2, pl); P(x + 2, y + 1, pl); break;
      case 'sheep': sh(8, 6); sprite(x + 1, y + 5, ['...wWWw.......', '..wWWWWWw.....', '.wWWLWWWWWw...', 'wWWLWWWWWWWfff.', 'wWWWWWWWWWWfef.', '.wWWWWWWWWwff..', '..wwwwwwww....', '..k..k..k..k..', '..k..k..k..k..'], { w: pd, W: pb, L: pl, f: '#3a3040', e: '#ffffff', k: '#3a3040' }); break;
      case 'hay': sh(8, 7); sprite(x + 1, y + 4, ['....yyyyy.....', '..yYYLYYYYy...', '.yYLYYYYyYYy..', 'yYYYYyYYYYYYy.', 'yYyYYYYYYyYYd.', 'yYYYYYYyYYYYd.', 'yYYyYYYYYYyYd.', '.ddddddddddd..'], { y: pd, Y: pb, L: pl, d: C.y0 }); line(x + 4, y + 8, x + 6, y + 6, pd); line(x + 9, y + 10, x + 11, y + 8, pd); break;
      case 'scarecrow': sh(8, 3); R(x + 7, y + 3, 2, 13, C.k2); R(x + 2, y + 7, 12, 1, C.k2); sprite(x + 4, y, ['..hhhh..', '.hhhhhh.', 'hhhhhhhh', '..ssss..', '..sese..', '..ssss..'], { h: C.y1, s: '#e8c896', e: '#2b2433' }); sprite(x + 3, y + 6, ['.bbbbbbbb.', 'bbBbbbbBbb', '.bbbbbbbb.', '..bbbbbb..', '..bBbbBb..'], { b: pb, B: pd }); P(x + 2, y + 8, C.y3); P(x + 13, y + 8, C.y3); break;
    }
  }

  EM.px = { C, PAINT, ROOF, ITEMS, ITEM, hash, inEll, kit, ground, present, herLook, drawItem, CHIBI, ramp };
})();
