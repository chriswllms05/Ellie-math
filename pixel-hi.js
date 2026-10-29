/* Ellie Math — the fine-grid pass for the pixel kit (preview). Scenes that ask for { hi: true } draw on a grid twice
   as fine as the layout: the layout, the camera and every coordinate stay in scene pixels, and the art inside each
   scene pixel gets 2x2 real pixels of its own. Same palette, same light from the top left, same outlines made of
   darker shades of each material, never black. Still hard-edged pixel art: nothing here blurs or anti-aliases. */
'use strict';
(function () {
  const EM = window.EM, px = EM.px, C = px.C, hash = px.hash, mix = px.mix, ramp = px.ramp;
  const baseKit = px.kit, baseGround = px.ground;
  const INK = '#2b2433';
  const ext = r => r.length > 4 ? r : [...r, mix(r[3], '#ffffff', .22)];
  // hair ramp that keeps its hue: dark hair gets a warm, saturated highlight instead of a grey one
  const toHsl = c => { const [r, g, b] = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l]; const s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h / 6, s, l]; };
  const fromHsl = (h, s, l) => { const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); }; return '#' + f(0) + f(8) + f(4); };
  const hairRamp = c => { if (!/^#[0-9a-f]{6}$/i.test(c)) return ext(ramp(c)); const [h, s, l] = toHsl(c), dark = l < .35, hs = Math.min(1, s * (dark ? 1.12 : 1.05));
    return [fromHsl(h, Math.min(1, s * 1.1), l * .5), fromHsl(h, Math.min(1, s * 1.1), l * .74), c, fromHsl(h, hs, l + (1 - l) * (dark ? .16 : .28)), fromHsl(h, hs, l + (1 - l) * (dark ? .28 : .5))]; };

  // Scale2x (EPX) on a letter grid: doubles a sprite and rounds its stair-steps. Used only as a starting shape;
  // shading, outlines and faces are then done on the fine grid itself.
  function epx(rows) {
    const h = rows.length, w = rows[0].length, at = (i, j) => (i < 0 || j < 0 || i >= w || j >= h) ? '.' : rows[j][i];
    const out = Array.from({ length: h * 2 }, () => Array(w * 2).fill('.'));
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const P = at(i, j), A = at(i, j - 1), B = at(i + 1, j), L = at(i - 1, j), D = at(i, j + 1);
      out[2 * j][2 * i] = L === A && L !== D && A !== B ? A : P;
      out[2 * j][2 * i + 1] = A === B && A !== L && B !== D ? B : P;
      out[2 * j + 1][2 * i] = D === L && D !== B && L !== A ? L : P;
      out[2 * j + 1][2 * i + 1] = B === D && B !== A && D !== L ? D : P;
    }
    return out;
  }

  px.kit = (g0, opt = {}) => {
    const k = baseKit(g0);
    const Zs = opt.hi ? 2 : 1;
    // fine primitives: coordinates in fine pixels
    const F = k.F = (x, y, w, h, c) => { const g = k.g; g.fillStyle = c; g.fillRect(Math.floor(x) / Zs, Math.floor(y) / Zs, Math.floor(w) / Zs, Math.floor(h) / Zs); };
    const FP = k.FP = (x, y, c) => F(x, y, 1, 1, c);
    if (!opt.hi) return k;
    const { add, shadow } = k;
    const Fsprite = k.Fsprite = (x, y, rows, map) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = map[row[i]]; if (c) FP(x + i, y + j, c); } });
    const Fell = (cx, cy, rx, ry, c) => { ry = Math.max(1, ry); for (let y = -ry; y <= ry; y++) { const s = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + .3); F(cx - s, cy + y, 2 * s + 1, 1, c); } };
    const Fline = (x0, y0, x1, y1, c, t = 1) => { let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy; for (let n = 0; n < 4000; n++) { F(x0, y0, t, t, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } };
    // logical-coordinate shapes, now smooth on the fine grid
    k.ell = (cx, cy, rx, ry, c) => Fell(Math.round(cx * 2) + 1, Math.round(cy * 2) + 1, Math.round(rx * 2), Math.round(ry * 2), c);
    k.shadowEll = (cx, cy, rx, ry) => k.ell(cx, cy, rx, ry, 'rgba(28,36,58,.30)');
    k.line = (x0, y0, x1, y1, c) => Fline(Math.round(x0) * 2, Math.round(y0) * 2, Math.round(x1) * 2, Math.round(y1) * 2, c, 2);

    // ---- shade a letter grid on the fine grid: outline bottom-right, soft rim top-left, volume inside ----
    // mat: letter -> [outline, shade, base, light, sheen]; an uppercase letter is that material's light
    const shadeGrid = (X, Y, grid, mat, o = {}) => {
      const n = grid.length, w = grid[0].length, at = (i, j) => (j < 0 || j >= n || i < 0 || i >= w) ? '.' : grid[j][i];
      const over = o.over || 'h';
      for (let j = 0; j < n; j++) for (let i = 0; i < w; i++) {
        const ch = at(i, j); if (ch === '.') continue;
        const m = ch.toLowerCase(), r = mat[m]; if (!r) continue;
        const same = (a, b) => at(a, b).toLowerCase() === m, solid = (a, b) => at(a, b) !== '.';
        let c = r[2];
        if (!solid(i + 1, j) || !solid(i, j + 1)) c = r[0];
        else if (!solid(i - 1, j) || !solid(i, j - 1)) c = r[1];
        else if (ch !== m) c = at(i, j - 1) !== ch ? r[4] : (at(i + 1, j) !== ch || at(i, j + 1) !== ch) && (i + j) % 2 ? r[2] : r[3];
        else if (!same(i, j - 1) && over.includes(at(i, j - 1).toLowerCase())) c = r[1];          // shadow under hair or a hat
        else if (!same(i + 1, j) || (!same(i + 2, j) && m !== 's')) c = r[1];                      // the turned-away side
        else if (!same(i, j + 1) && m !== 's') c = r[1];
        else if (!same(i - 1, j) || !same(i, j - 1)) c = r[3];                                     // rim light, top left
        else if (m === 'h' && i % 3 === 1 && hash(i, j >> 1, 77) < .5) c = r[1];                   // strands of hair
        else if (m === 'y' && (i + (j >> 1)) % 3 === 0) c = r[1];                                  // woven straw
        FP(X + i, Y + j, c);
      }
    };
    // a face's features, pulled out before scaling and drawn on the fine grid afterwards
    const takeFace = rows => {
      const isEye = (i, j) => j >= 0 && j < rows.length && (rows[j][i] === 'e' || (rows[j][i] === 'w' && (rows[j][i - 1] === 'e' || rows[j][i + 1] === 'e')));
      const eyes = [], cheeks = [], mouth = [];
      rows.forEach((r, j) => [...r].forEach((ch, i) => {
        if (isEye(i, j) && !isEye(i - 1, j) && !isEye(i, j - 1)) { let bw = 1; while (isEye(i + bw, j)) bw++; let bh = 1; while (isEye(i, j + bh)) bh++; eyes.push({ i, j, bw, bh, shineLeft: r[i] === 'w' || r[i + 1] !== 'w' }); }
        if (ch === 'c') cheeks.push([i, j]); if (ch === 'm') mouth.push([i, j, r[i - 1] === 'm']);
      }));
      return { eyes, cheeks, mouth, rows: rows.map((r, j) => [...r].map((ch, i) => isEye(i, j) || ch === 'c' || ch === 'm' ? 's' : ch).join('')) };
    };
    const drawEyes = (X, Y, eyes, blink, lash, skin) => eyes.forEach((e, n) => {
      const ex = X + e.i * 2, ey = Y + e.j * 2, w = e.bw * 2, h = e.bh * 2;
      if (w >= 4) {
        if (blink) { F(ex, ey + 2, w, 1, INK); FP(ex, ey + 1, INK); FP(ex + w - 1, ey + 1, INK); return; }
        Fsprite(ex, ey, e.shineLeft ? ['oooo', 'oWoo', 'oiio', '.oo.'] : ['oooo', 'ooWo', 'oiio', '.oo.'], { o: INK, W: '#ffffff', i: '#6a5a8a' });
        FP(ex, ey + 3, mix(skin, INK, .35)); FP(ex + 3, ey + 3, mix(skin, INK, .35));
        if (lash) { const outer = n === 0 ? ex - 1 : ex + w; FP(outer, ey, INK); FP(outer, ey - 1, INK); }
      } else {
        if (blink) { F(ex, ey + 1, w, 1, INK); return; }
        F(ex, ey, w, h, INK); FP(ex + (e.shineLeft ? 0 : w - 1), ey, '#ffffff');
        if (lash) FP(n === 0 ? ex - 1 : ex + w, ey, INK);
      }
    });

    // ---- people on the map: 18x30 on the fine grid ----
    k.drawPerson = (x, y, look, opt = {}) => {
      const long = look.long, w = opt.walk || 0;
      const arms = opt.wave ? ['.bbbbbbBs', '.sbbbbBS.', '..bbbbB..'] : w % 2 ? ['.bbbbbbB.', 'sbbbbbB.S', '.sbbbbB..'] : ['.bbbbbbB.', '.sbbbbBS.', '.sbbbbBs.'];
      const legs = w === 1 ? ['..pp..pp.', '.pp...pp.', '.oo....o.'] : w === 3 ? ['.pp..pp..', '.pp...pp.', '.o....oo.'] : ['..pp.pp..', '..pp.pp..', '..oo.oo..'];
      let rows = ['..hhhhh..', '.hhHhhhh.', 'hhhssshhh', long ? 'hhsesesh.' : '.hsesesh.', (long ? 'hhsssssh' : '.hsssssh') + (long ? 'h' : '.'),
        long ? 'h.scscS.h' : '..scscS..', long ? 'h..SSS..h' : '...SSS...', '..bbbbb..', ...arms, '..bbbbB..', ...legs];
      if (opt.flip) rows = rows.map(r => [...r].reverse().join(''));
      // S and B are the darker skin and shirt: their own materials, so the light letters stay free
      rows = rows.map(r => r.replace(/S/g, 'k').replace(/B/g, 'd'));
      const f = takeFace(rows), grid = epx(f.rows), X = Math.round(x * 2), Y = Math.round((y - 15 - (opt.bob || 0)) * 2);
      const mat = { h: hairRamp(look.hair), s: ext(ramp(look.skin)), k: ext(ramp(look.skinD)), b: ext(ramp(look.shirt)), d: ext(ramp(look.shirtD)), p: ext(ramp('#4a3b5a')), o: ext(ramp('#3a3040')) };
      shadeGrid(X, Y, grid, mat);
      f.cheeks.forEach(([i, j]) => { FP(X + i * 2, Y + j * 2 + 1, '#f08a8a'); FP(X + i * 2 + 1, Y + j * 2, mix(look.skin, '#f08a8a', .5)); });
      drawEyes(X, Y, f.eyes, opt.blink, false, look.skin);
    };
    k.person = (x, y, look, opt = {}) => {
      shadow(() => k.shadowEll(x + 4, y, 4, 1));
      add(y, () => { k.drawPerson(x, y, look, opt); if (opt.rodLeft) { k.line(x, y - 7, x - 14, y - 22, C.k2); FP(x * 2 - 28, y * 2 - 44, C.k3); } });
    };
    // Rosa's straw hat on the map
    k.strawHat = (x, y) => {
      const X = x * 2, Ys = (y - 18) * 2;
      F(X + 5, Ys - 1, 8, 1, '#f8dc8a'); F(X + 4, Ys, 10, 2, '#e2ae52'); F(X + 4, Ys, 1, 2, '#f8dc8a'); F(X + 5, Ys, 3, 1, '#f8dc8a');
      for (let i = 0; i < 5; i++) FP(X + 6 + i * 2, Ys + 1, '#c08636');
      F(X + 4, Ys + 2, 10, 1, '#b84a3e'); F(X + 4, Ys + 3, 10, 1, '#83303a'); FP(X + 11, Ys + 2, '#da7350');
      F(X - 1, Ys + 4, 20, 1, '#f8dc8a'); F(X - 1, Ys + 5, 20, 1, '#e2ae52'); F(X, Ys + 6, 18, 1, '#c08636'); FP(X - 1, Ys + 5, '#8c5a28'); FP(X + 18, Ys + 5, '#8c5a28');
      for (let i = 0; i < 9; i++) FP(X + 1 + i * 2, Ys + 5, '#d9a23e');
    };

    k.chefHat = (x, y) => { const X = x * 2, Ys = (y - 19) * 2;
      F(X + 4, Ys - 1, 10, 1, '#ffffff'); F(X + 2, Ys, 14, 5, '#f4efe2'); F(X + 3, Ys, 6, 1, '#ffffff'); F(X + 3, Ys + 1, 2, 1, '#ffffff'); F(X + 14, Ys + 1, 2, 4, '#dcd4c4'); FP(X + 7, Ys + 3, '#dcd4c4'); FP(X + 11, Ys + 2, '#dcd4c4'); FP(X + 1, Ys + 1, '#f4efe2');
      F(X + 2, Ys + 5, 14, 3, '#e8e2d4'); F(X + 2, Ys + 5, 14, 1, '#f8f4ea'); F(X + 2, Ys + 7, 14, 1, '#cfc6b4'); FP(X + 15, Ys + 6, '#cfc6b4'); };
    k.mailCap = (x, y) => { const X = x * 2, Ys = (y - 16) * 2;
      F(X + 4, Ys - 1, 10, 1, '#5a7ac8'); F(X + 2, Ys, 14, 4, '#3a5aa8'); F(X + 3, Ys, 5, 1, '#6a8ad8'); F(X + 13, Ys + 1, 3, 3, '#26346a'); F(X + 8, Ys + 1, 2, 2, '#e2ae52'); FP(X + 8, Ys + 1, '#f4d688');
      F(X, Ys + 4, 18, 2, '#2b2b3a'); F(X, Ys + 4, 18, 1, '#45455a'); };
    k.beard = (x, y) => { const X = x * 2, Yb = (y - 10) * 2;
      F(X + 4, Yb, 10, 3, '#e8e8f0'); F(X + 5, Yb + 3, 8, 1, '#e8e8f0'); F(X + 7, Yb + 4, 4, 1, '#d8d8e4'); F(X + 8, Yb + 5, 2, 1, '#c8c8d4'); F(X + 12, Yb + 1, 2, 3, '#c8c8d4'); F(X + 5, Yb, 8, 1, '#ffffff'); F(X + 8, Yb + 1, 2, 1, '#a8433f'); FP(X + 6, Yb + 2, '#c8c8d4'); };
    // ---- the bakery: buns and the baking tray ----
    const BUN = ['...oooo...', '.ooLLyyoo.', 'oLLLyoyyyo', 'oLyyyyoyyd', 'oyyyyyyydd', '.yyyyyyddd', '.dddddddd.', '..dddddd..'];
    k.bun = (x, y) => Fsprite(Math.round(x * 2), Math.round(y * 2), BUN, { o: '#a8602a', L: '#f8dc8a', y: '#e2ae52', d: '#c07a3a' });
    k.bunTray10 = (x, y, cells, ring) => {
      k.shadowEll(x + 19, y + 1, 20, 2);
      const X = x * 2, Y = y * 2;
      F(X, Y - 36, 76, 36, C.s0); F(X + 1, Y - 35, 74, 34, C.s2); F(X + 1, Y - 35, 74, 1, C.s4); F(X + 1, Y - 34, 1, 32, C.s3); F(X + 74, Y - 34, 1, 33, C.s1); F(X + 1, Y - 2, 74, 1, C.s1);
      F(X + 1, Y - 18, 74, 1, C.s1); F(X + 1, Y - 17, 74, 1, C.s3);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) { const cx = X + 4 + c * 14, cy = Y - 32 + r * 16, v = cells[r * 5 + c], more = v === 'A' || v === 'B';
        F(cx, cy, 12, 12, more && ring ? '#fff7c2' : C.s1); F(cx, cy, 12, 1, C.s0); F(cx, cy, 1, 12, C.s0); F(cx, cy + 11, 12, 1, C.s3); F(cx + 11, cy, 1, 12, C.s3);
        if (v && v !== 'e') k.bun(cx / 2 + 0, cy / 2 + 1); }
    };

    // ---- close-ups: the 16-wide chibis become 32 wide ----
    k.chibi = (x, y, rows, mat, opt = {}) => {
      rows = rows.map(r => r.length >= 16 ? r : r + [...r].reverse().join('').replace(/ew/g, 'we'));
      if (opt.flip) rows = rows.map(r => [...r].reverse().join('').replace(/we/g, 'ew'));
      const n = rows.length, top = y - n - (opt.bob || 0);
      if (!opt.noShadow) k.shadowEll(x + 8, y, 7, 2);
      const f = takeFace(rows), grid = epx(f.rows), X = x * 2, Y = top * 2, M = {};
      for (const key in mat) M[key] = ext(mat[key]);
      if (mat.h) M.h = hairRamp(mat.h[2]);
      shadeGrid(X, Y, grid, M, { over: 'hyrkq' });
      // the body: arms hang beside it, a collar opens at the neck, a waist where the shirt meets the skirt
      const lastFace = Math.max(...f.eyes.map(e => e.j + e.bh), 0), jb = rows.findIndex((r, j) => j > lastFace && !'shewcm.'.includes(r[7]) && !'shewcm.'.includes(r[8]));
      if (jb > 0) {
        const bm = rows[jb][7].toLowerCase(), br = M[bm];
        if (br) {
          const cx = X + 16; FP(cx - 2, Y + jb * 2, br[0]); FP(cx + 1, Y + jb * 2, br[0]); F(cx - 1, Y + jb * 2, 2, 1, M.s ? M.s[1] : br[3]); FP(cx - 1, Y + jb * 2 + 1, br[0]); FP(cx, Y + jb * 2 + 1, br[0]);
          FP(cx - 3, Y + jb * 2 + 1, br[3]); FP(cx + 2, Y + jb * 2 + 1, br[1]);
          for (let j = jb + 1; j < rows.length; j++) {
            const L = rows[j][2].toLowerCase(), R2 = rows[j][13].toLowerCase(); if (L !== bm && R2 !== bm && L !== 'a') break;
            if (rows[j][2].toLowerCase() === bm) F(X + 6, Y + j * 2, 1, 2, br[1]); if (rows[j][13].toLowerCase() === bm) F(X + 25, Y + j * 2, 1, 2, br[0]);
            if (rows[j][3] && rows[j][3].toLowerCase() === 'a') { F(X + 6, Y + j * 2, 1, 2, br[0]); F(X + 25, Y + j * 2, 1, 2, br[0]); }
          }
          const jp = rows.findIndex((r, j) => j > jb && r[7] === 'p');
          if (jp > 0 && M.p) { F(X + 6, Y + jp * 2, 20, 1, M.p[0]); F(X + 7, Y + jp * 2 + 1, 18, 1, M.p[3]); }
        }
      }
      const skin = mat.s[2];
      f.cheeks.forEach(([i, j]) => { F(X + i * 2, Y + j * 2, 2, 2, '#f2938a'); FP(X + i * 2 + (i < 8 ? 0 : 1), Y + j * 2, '#f8b4a6'); FP(X + i * 2 + (i < 8 ? 1 : 0), Y + j * 2 + 1, mix(skin, '#f2938a', .5)); });
      f.mouth.forEach(([i, j, right]) => { const mx = X + i * 2, my = Y + j * 2; if (right) { FP(mx, my + 1, '#a8433f'); FP(mx + 1, my, '#a8433f'); } else { FP(mx, my, '#a8433f'); FP(mx + 1, my + 1, '#a8433f'); } });
      if (f.mouth.length === 1) { const [i, j] = f.mouth[0]; F(X + i * 2, Y + j * 2 + 1, 2, 1, '#a8433f'); }
      drawEyes(X, Y, f.eyes, opt.blink, opt.lash !== false, skin);
      // a brow over each eye, in the hair's dark
      if (mat.h) f.eyes.forEach(e => { if (e.bw >= 2) F(X + e.i * 2 + 1, Y + e.j * 2 - 2, 2, 1, mat.h[1]); });
    };

    // ---- Dot: the glowing wisp, round on the fine grid ----
    const DOT = ['....ooooo....', '..ooFFFFFoo..', '.oFFHHFFFFFo.', '.oFHHFFFFFFo.', 'oFFFFFFFFFFFo', 'oFFFFFFFFFFFo', 'oFFFFFFFFFFFo', 'oFFFFFFFFFFFo', 'oFFFFFFFFFFFo', '.oFFFFFFFFDo.', '.oFFFFFFFFDo.', '..ooFFFFDoo..', '....ooooo....'].map(r => r.replace(/[oFD]/g, 'f').replace(/H/g, 'F'));
    const DOTG = epx(DOT), DOTM = { f: ['#b8403a', '#d4503f', '#f06a4f', '#ffb199', '#ffe0d2'] };
    k.drawDot = (cx, cy, t = 0, blink = false) => {
      const X = (cx - 6) * 2, Y = (cy - 6) * 2;
      shadeGrid(X, Y, DOTG, DOTM);
      if (blink) { [6, 18].forEach(ex => { F(X + ex, Y + 13, 3, 1, INK); FP(X + ex - 1, Y + 12, INK); FP(X + ex + 3, Y + 12, INK); }); }
      else [6, 18].forEach(ex => { F(X + ex, Y + 10, 2, 4, INK); FP(X + ex + 1, Y + 9, INK); FP(X + ex, Y + 10, '#ffffff'); FP(X + ex + 1, Y + 13, '#5a3a4a'); });
      FP(X + 8, Y + 16, INK); FP(X + 9, Y + 17, INK); F(X + 10, Y + 18, 6, 1, INK); FP(X + 16, Y + 17, INK); FP(X + 17, Y + 16, INK); F(X + 11, Y + 17, 4, 1, '#a8433f');
      F(X + 3, Y + 15, 3, 2, '#ff8e78'); F(X + 20, Y + 15, 3, 2, '#ff8e78');
      [[-11, 5, 0], [9, -10, 1], [12, 6, 2], [-8, -9, 3]].forEach(([a, b, i]) => { const v = Math.sin(t / 260 + i * 1.7); if (v > -.2) { const sx = (cx + a) * 2 + 1, sy = (cy + b) * 2 + 1; FP(sx, sy, '#fff7c2'); FP(sx - 1, sy, '#ffe27a'); FP(sx + 1, sy, '#ffe27a'); FP(sx, sy - 1, '#ffe27a'); FP(sx, sy + 1, '#ffe27a'); if (v > .6) { FP(sx - 2, sy, '#ffe27a99'); FP(sx + 2, sy, '#ffe27a99'); FP(sx, sy - 2, '#ffe27a99'); FP(sx, sy + 2, '#ffe27a99'); } } });
    };
    k.dot = (cx, cy) => add(999, () => k.drawDot(cx, cy), false);

    // ---- foliage: a canopy made of overlapping leaf clumps, each lit from the top left ----
    const foliage = (inShape, x0, y0, x1, y1, leaf, light, seed, cell, rad) => {
      const cl = [];
      for (let gy = y0; gy <= y1; gy += cell) for (let gx = x0; gx <= x1; gx += cell) {
        const cx = gx + (hash(gx, gy, seed) - .5) * cell * .9, cy = gy + (hash(gy, gx, seed + 1) - .5) * cell * .9;
        if (inShape(cx, cy)) cl.push([cx, cy, rad * (.8 + hash(gx, gy, seed + 2) * .45)]);
      }
      cl.sort((a, b) => a[1] - b[1]);
      const pad = Math.ceil(rad * 1.3) + 1, bx = Math.floor(x0 - pad), by = Math.floor(y0 - pad), bw = Math.ceil(x1 + pad) - bx + 1, bh = Math.ceil(y1 + pad) - by + 1;
      const hit = new Int16Array(bw * bh).fill(-2);
      for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
        const X = bx + i, Y = by + j; let h = -2;
        for (let q = cl.length - 1; q >= 0; q--) { const [cx, cy, r] = cl[q]; if ((X - cx) ** 2 + (Y - cy) ** 2 <= r * r) { h = q; break; } }
        if (h < 0 && inShape(X, Y)) h = -1;
        hit[j * bw + i] = h;
      }
      const H = (i, j) => (i < 0 || j < 0 || i >= bw || j >= bh) ? -2 : hit[j * bw + i];
      const step = [leaf[1], leaf[1], leaf[2], leaf[3], leaf[4]];
      for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
        const h = H(i, j); if (h === -2) continue;
        const X = bx + i, Y = by + j;
        let c;
        if (H(i + 1, j) === -2 || H(i, j + 1) === -2) c = leaf[0];
        else if (H(i - 1, j) === -2 || H(i, j - 1) === -2) c = leaf[1];
        else {
          let v = light(X, Y) + (hash(X, Y, seed + 5) - .5) * .22, lvl;
          if (h >= 0) { const [cx, cy, r] = cl[h]; v += (-(X - cx) * .6 - (Y - cy) * .8) / r * .5; }
          lvl = v > .8 ? 4 : v > .22 ? 3 : v > -.38 ? 2 : 1;
          const ul = H(i - 1, j - 1), u = H(i, j - 1);
          if (ul > h || u > h) lvl = Math.max(0, lvl - (lvl > 2 ? 2 : 1));                  // tucked under the clump in front
          else if (h >= 0 && ul !== h && u !== h && lvl < 3) lvl++;          // the clump's lit rim
          c = lvl === 0 ? leaf[0] : step[lvl];
        }
        FP(X, Y, c);
      }
    };

    // ---- tree ----
    k.tree = (x, y, opt = {}) => {
      const r = opt.r || 9, leaf = opt.leaf || (opt.far ? px.FAR_LEAF : [C.l0, C.l1, C.l2, C.l3, C.l4]);
      shadow(() => k.shadowEll(x + 2, y + 1, r + 2, 3));
      add(y, () => {
        const X = x * 2 + 1, Y = y * 2, R2 = r * 2;
        // trunk with bark, roots and the shade under the canopy
        F(X - 3, Y - 14, 6, 14, C.k2); F(X - 3, Y - 14, 1, 14, C.k3); F(X - 2, Y - 14, 1, 14, C.k4 + '88'); F(X + 1, Y - 14, 2, 14, C.k1);
        F(X - 1, Y - 11, 1, 3, C.k1); F(X, Y - 6, 1, 3, C.k1); FP(X - 2, Y - 4, C.k1);
        F(X - 5, Y - 2, 2, 2, C.k2); FP(X - 5, Y - 1, C.k1); F(X + 3, Y - 2, 2, 2, C.k1); FP(X - 4, Y - 3, C.k3);
        F(X - 3, Y - 14, 6, 3, C.k0 + 'aa');
        const discs = [[0, -R2 - 12, R2], [-R2 * .55, -R2 - 6, R2 * .7], [R2 * .55, -R2 - 6, R2 * .7], [0, -R2 * 1.55 - 12, R2 * .65]].map(([a, b, rr]) => [X + a, Y + b, rr]);
        const inC = (qx, qy) => discs.some(([a, b, rr]) => (qx - a) ** 2 + (qy - b) ** 2 <= rr * rr);
        const inCore = (qx, qy) => discs.some(([a, b, rr]) => (qx - a) ** 2 + (qy - b) ** 2 <= (rr - 3) * (rr - 3));
        const light = (qx, qy) => -(qx - X) / R2 * .55 - (qy - (Y - R2 - 12)) / R2 * .75;
        const cell = r > 12 ? 10 : 6, rad = r > 12 ? 7.2 : 4.3;
        foliage((qx, qy) => inCore(qx, qy) || (inC(qx, qy) && false), X - R2 - 2, Y - R2 * 2.3 - 14, X + R2 + 2, Y - 6, leaf, light, x * 7 + y, cell, rad);
        if (opt.apples) for (let n = 0; n < 6; n++) { const a = X - R2 + 6 + Math.floor(hash(x, n, 31) * (2 * R2 - 10)), b = Y - R2 - 18 + Math.floor(hash(n, y, 32) * R2 * 1.1); if (inCore(a, b) && inCore(a + 3, b + 3)) k.tinyApple(a, b, opt.far); }
      });
    };
    k.tinyApple = (X, Y, far) => { const a = (far ? px.FAR_APPLES : px.APPLES).red; Fsprite(X, Y - 1, ['.k..', 'rLrr', 'rrrd', '.dd.'], { k: C.k1, r: a.r, L: a.L, d: a.d }); };
    k.bush = (x, y) => {
      shadow(() => k.shadowEll(x + 1, y, 6, 2));
      add(y, () => {
        const X = x * 2 + 1, Y = y * 2 - 7, inS = (qx, qy) => ((qx - X) / 12.5) ** 2 + ((qy - Y) / 7.6) ** 2 <= 1;
        foliage(inS, X - 13, Y - 8, X + 13, Y + 8, [C.l0, C.l1, C.l2, C.l3, C.l4], (qx, qy) => -(qx - X) * .05 - (qy - Y) * .1 + .1, x * 3 + y, 5, 3.4);
        [[-6, -4], [5, -1], [-1, 3], [8, 4]].forEach(([a, b]) => { FP(X + a, Y + b, '#ff9ac6'); FP(X + a + 1, Y + b, '#e56bb3'); FP(X + a, Y + b + 1, '#e56bb3'); FP(X + a, Y + b - 1, '#ffd0e4'); });
      });
    };
    k.rock = (x, y) => add(y, () => Fsprite(x * 2, y * 2 - 8, ['....mmmm....', '..mLLaaam...', '.mLaaaaaamb.', 'maaaaaaammbb', 'mmaaaammmbbb', '.bmmmmmbbbb.', '..gg....g...'], { L: C.s4, a: C.s3, m: C.s2, b: C.s1, g: C.l3 }));
    k.barrel = (x, y) => { shadow(() => k.shadowEll(x + 3, y, 4, 1)); add(y, () => {
      const X = x * 2, Y = y * 2;
      F(X, Y - 16, 14, 16, C.k2); F(X + 1, Y - 17, 12, 1, C.k2);
      for (let i = 3; i < 14; i += 4) F(X + i, Y - 15, 1, 14, C.k1);
      F(X, Y - 16, 2, 16, C.k3); FP(X + 1, Y - 12, C.k4); FP(X + 1, Y - 6, C.k4); F(X + 11, Y - 16, 3, 16, C.k1);
      [[Y - 12], [Y - 4]].forEach(([hy]) => { F(X, hy, 14, 2, C.s1); F(X, hy, 14, 1, C.s2); FP(X + 1, hy, C.s4); });
      F(X + 1, Y - 18, 12, 2, C.k3); F(X + 2, Y - 18, 8, 1, C.k4); F(X + 3, Y - 17, 8, 1, C.k1); F(X, Y - 1, 14, 1, C.k0 + 'cc');
    }); };
    k.crate = (x, y, fill) => { shadow(() => k.shadowEll(x + 4, y, 5, 1)); add(y, () => {
      const X = x * 2, Y = y * 2;
      if (fill) { const d = mix(fill, '#1a1020', .35), L = mix(fill, '#ffffff', .5); for (let a = 0; a < 4; a++) Fsprite(X + 1 + a * 4 - (a === 3 ? 1 : 0), Y - 15 + (a % 2), ['.ff.', 'fLff', 'fffd', '.dd.'], { f: fill, L, d }); FP(X + 6, Y - 16, C.l3); FP(X + 7, Y - 17, C.l2); }
      F(X, Y - 12, 16, 12, C.k2); F(X, Y - 12, 16, 2, C.k3); F(X, Y - 12, 16, 1, C.k4); F(X, Y - 7, 16, 1, C.k1); F(X, Y - 6, 16, 1, C.k3);
      F(X, Y - 2, 16, 2, C.k1); F(X, Y - 12, 2, 12, C.k3); F(X + 14, Y - 12, 2, 12, C.k1);
      Fline(X + 2, Y - 10, X + 13, Y - 3, C.k1, 1); Fline(X + 2, Y - 11, X + 13, Y - 4, C.k3, 1);
      [[1, -11], [14, -11], [1, -2], [14, -2]].forEach(([a, b]) => FP(X + a, Y + b, C.s3));
    }); };
    k.reeds = (x, y) => add(y, () => {
      const X = x * 2, Y = y * 2;
      F(X, Y - 22, 1, 22, C.l2); F(X + 1, Y - 18, 1, 18, C.l3); F(X + 2, Y - 14, 1, 14, C.l3); FP(X + 3, Y - 15, C.l4); FP(X + 3, Y - 16, C.l4); FP(X - 1, Y - 10, C.l3); FP(X - 2, Y - 12, C.l3);
      F(X - 1, Y - 28, 3, 7, C.k1); F(X - 1, Y - 28, 1, 7, C.k2); FP(X, Y - 28, C.k3); FP(X, Y - 30, C.l2); FP(X, Y - 29, C.l2);
    });
    k.lily = (x, y, flower) => add(0, () => {
      const X = x * 2, Y = y * 2;
      Fsprite(X, Y, ['..gggggg..', '.gGGggggg.', 'gGgggg.ggd', 'gggggg.gdd', '.gggggddd.', '..dddddd..'], { g: C.l3, G: C.l4, d: C.l2 });
      if (flower) Fsprite(X + 2, Y - 3, ['..p..', '.pWp.', 'ppyPp', '.ppp.'], { p: '#ff9ac6', P: '#e56bb3', W: '#ffd0e4', y: '#ffe066' });
    }, false);
    k.flowersGround = (x, y, c) => {
      if (hash(x, y, 77) < .5) return;
      const X = x * 2 + 1, Y = y * 2, soft = mix(c, C.g3, .35), softD = mix(c, C.g3, .55);
      FP(X, Y + 2, C.g1); FP(X - 1, Y + 1, C.g1);
      FP(X - 1, Y, soft); FP(X + 1, Y, softD); FP(X, Y - 1, soft); FP(X, Y + 1, softD); FP(X, Y, '#f6f0de');
    };
    k.butterfly = (x, y, col, up) => {
      const X = x * 2, Y = y * 2, L = mix(col, '#ffffff', .5);
      F(X, Y - 1, 1, 4, INK);
      if (up) { Fsprite(X - 3, Y - 3, ['LL.LL', 'ccScc', '.c.c.'].map(r => r.replace('S', '.')), { L, c: col }); Fsprite(X - 3, Y - 3, ['LL.LL'], { L }); }
      else Fsprite(X - 4, Y, ['.cc.cc.', 'cLc.cLc', '.c...c.'], { c: col, L });
    };
    // ---- fence ----
    const post = (X, Y) => { F(X, Y - 12, 4, 14, C.k3); F(X + 3, Y - 12, 1, 14, C.k2); F(X, Y - 12, 1, 14, C.k4); FP(X + 1, Y - 13, C.k4); FP(X + 2, Y - 13, C.k3); F(X + 1, Y - 8, 1, 3, C.k2); F(X, Y + 1, 4, 1, C.k1); };
    k.fence = (x0, y0, x1, y1) => {
      if (y0 === y1) {
        for (let x = x0; x <= x1; x += 5) add(y0 + 1, () => post(x * 2, y0 * 2));
        add(y0, () => { const X = x0 * 2, L = (x1 - x0 + 2) * 2, Y = y0 * 2; F(X, Y - 10, L, 1, C.k3); F(X, Y - 9, L, 1, C.k2); F(X, Y - 6, L, 1, C.k2); F(X, Y - 5, L, 1, C.k1); for (let i = 3; i < L; i += 9) { FP(X + i, Y - 9, C.k1); FP(X + i + 4, Y - 6, C.k1); } });
      } else for (let y = y0; y <= y1; y += 5) add(y + 1, () => { post(x0 * 2, y * 2); if (y + 5 <= y1) { F(x0 * 2 + 1, y * 2 - 4, 2, 10, C.k2); F(x0 * 2 + 1, y * 2 - 4, 1, 10, C.k3); } });
    };
    // ---- the notice board ----
    k.board = (x, y) => { shadow(() => k.shadowEll(x + 9, y, 10, 2)); add(y, () => {
      const X = x * 2, Y = y * 2;
      [2, 30].forEach(a => { F(X + a, Y - 36, 4, 36, C.k1); F(X + a, Y - 36, 1, 36, C.k2); FP(X + a + 1, Y - 6, C.k2); });
      F(X - 2, Y - 34, 40, 24, C.k2);
      for (let j = 0; j < 24; j += 6) { F(X - 2, Y - 34 + j, 40, 1, C.k3); F(X - 2, Y - 29 + j, 40, 1, C.k1); }
      for (let i = 0; i < 14; i++) F(X + Math.floor(hash(i, x, 5) * 34), Y - 32 + Math.floor(hash(i, y, 6) * 4) * 6, 3 + Math.floor(hash(i, 9, 7) * 5), 1, C.k1);
      F(X - 2, Y - 34, 1, 24, C.k3); F(X + 37, Y - 34, 1, 24, C.k1); F(X - 2, Y - 11, 40, 1, C.k0);
      for (let j = 0; j < 8; j++) { const ins = j, yy = Y - 42 + j; F(X - 6 + ins, yy, 48 - 2 * ins, 1, j % 2 ? C.r1 : C.r2); for (let i = X - 6 + ins + (j % 4 < 2 ? 0 : 3); i < X + 42 - ins; i += 6) FP(i, yy, j % 2 ? C.r0 : C.r3); }
      F(X - 6, Y - 35, 48, 1, C.r0); F(X - 6, Y - 36, 48, 1, C.r1);
      [[2, -30, '#f7ecd0'], [14, -32, '#ffe9a0'], [24, -28, '#d9ecff']].forEach(([a, b, c]) => {
        F(X + a, Y + b, 10, 12, c); F(X + a + 9, Y + b + 1, 1, 11, mix(c, '#5a3b33', .25)); F(X + a + 1, Y + b + 11, 9, 1, mix(c, '#5a3b33', .25));
        for (let l = 0; l < 4; l++) F(X + a + 2, Y + b + 3 + l * 2, l === 3 ? 3 : 6 - (l % 2), 1, '#a08a74');
        FP(X + a + 4, Y + b, '#d84a4a'); FP(X + a + 5, Y + b, '#b83a3a'); FP(X + a + 4, Y + b - 1, '#ff8f7a');
      });
    }); };
    // ---- the dock and the bridge's planks ----
    k.dock = (x, y, w, h) => {
      const X = x * 2, Y = y * 2, Wf = w * 2, Hf = h * 2;
      [[x + 2, y + h], [x + 16, y + h]].forEach(([a, b]) => { F(a * 2, b * 2, 6, 12, C.k1); F(a * 2, b * 2, 2, 12, C.k2); F(a * 2 - 2, b * 2 + 10, 10, 1, C.w3); F(a * 2 - 1, b * 2 + 11, 8, 1, C.w4); });
      F(X, Y, Wf, Hf, C.k2);
      for (let a = 0; a < Wf; a += 10) {
        F(X + a, Y, 1, Hf, C.k1); F(X + a + 1, Y, 1, Hf, C.k3);
        for (let n = 0; n < 3; n++) F(X + a + 3 + Math.floor(hash(a, n, 81) * 4), Y + 3 + Math.floor(hash(n, a, 82) * (Hf - 6)), 1, 2 + Math.floor(hash(a, n, 83) * 3), C.k1);
        FP(X + a + 2, Y + 2, C.s3); FP(X + a + 8, Y + 2, C.s3); FP(X + a + 2, Y + Hf - 3, C.s2); FP(X + a + 8, Y + Hf - 3, C.s2);
      }
      F(X, Y, Wf, 1, C.k4); F(X, Y + Hf - 2, Wf, 2, C.k1);
    };
    k.plank = (x, y, w, j) => {
      const X = x * 2, Y = y * 2, Wf = w * 2;
      F(X, Y, Wf, 4, j % 2 ? C.k2 : C.k3); F(X, Y, Wf, 1, j % 2 ? C.k3 : C.k4); F(X, Y + 3, Wf, 1, C.k1);
      F(X + 4 + (j * 7) % 12, Y + 1, 5, 1, C.k1 + '99'); FP(X + 1, Y + 1, C.s3); FP(X + Wf - 2, Y + 1, C.s3);
    };

    // ---- house: stone footing, timber frame, windows, door, shingled gable roof ----
    k.house = (x, y, w, roofName, opt = {}) => {
      const roof = px.ROOF[roofName].map(n => C[n]), [c0, c1, c2, c3, c4] = roof;
      const wh = opt.wh || 18, rh = Math.round(w * .5), top = y - wh;
      shadow(() => { const g = k.g; g.fillStyle = 'rgba(28,36,58,.30)'; g.fillRect(x + 3, y - 2, w + 4, 5); g.fillRect(x + w, top - rh + 6, 5, wh + rh - 4); });
      add(y, () => {
        const X = x * 2, Y = y * 2, Wf = w * 2, T = top * 2, WH = wh * 2, RH = rh * 2;
        // plaster
        F(X, T, Wf, WH, C.p2);
        for (let n = 0; n < Wf * WH / 26; n++) FP(X + Math.floor(hash(n, x, 41) * Wf), T + Math.floor(hash(n, y, 42) * WH), n % 3 ? C.p1 : C.p3);
        F(X, T, 2, WH, C.p3); F(X + Wf - 2, T, 2, WH, C.p1);
        // timber
        const beam = (bx, by, bw, bh) => { F(bx, by, bw, bh, C.k1); if (bw > bh) { F(bx, by, bw, 1, C.k2); F(bx, by + bh - 1, bw, 1, C.k0); for (let i = 3; i < bw - 3; i += 7) F(bx + i + Math.floor(hash(i, by, 43) * 3), by + 1 + (i % 2), 3, 1, C.k2); } else { F(bx, by, 1, bh, C.k2); F(bx + bw - 1, by, 1, bh, C.k0); for (let i = 3; i < bh - 3; i += 6) F(bx + 1 + (i % 2), by + i, 1, 3, C.k2); } };
        const mid = T + Math.floor(WH / 2);
        Fline(X + 4, mid - 2, X + 15, T + 4, C.k1, 2); Fline(X + 4, mid - 3, X + 14, T + 4, C.k2, 1);
        Fline(X + Wf - 6, mid - 2, X + Wf - 17, T + 4, C.k1, 2); Fline(X + Wf - 6, mid - 3, X + Wf - 16, T + 4, C.k2, 1);
        beam(X, T, Wf, 4); beam(X, mid, Wf, 4); beam(X, T, 4, WH); beam(X + Wf - 4, T, 4, WH);
        if (w >= 34) beam(X + Wf / 2 - 2, T, 4, WH / 2);
        // stone footing
        F(X - 2, Y - 6, Wf + 4, 6, C.s1);
        for (let row = 0; row < 2; row++) { let sx = X - 2 + (row ? 3 : 0); const sy = Y - 6 + row * 3; while (sx < X + Wf + 2) { const sw = Math.min(5 + Math.floor(hash(sx, row, 44) * 5), X + Wf + 2 - sx); F(sx, sy, sw - 1, 2, C.s2); F(sx, sy, sw - 1, 1, C.s3); FP(sx, sy, C.s4); sx += sw; } }
        F(X - 2, Y - 1, Wf + 4, 1, C.s0);
        // windows
        const sh = opt.shutter || [C.b1, C.b2];
        const win = (wx, wy) => {
          const WX = wx * 2, WY = wy * 2;
          F(WX - 2, WY - 2, 18, 18, C.k1); F(WX - 2, WY - 2, 18, 1, C.k2);
          for (let j = 0; j < 14; j++) for (let i = 0; i < 14; i++) {
            const pi = i % 7, pj = j % 7; let c;
            if (opt.lit) { c = pj < 2 && pi < 3 ? C.lit2 : C.lit; if (pi + pj === 2 && pj < 2) c = '#fff2c4'; if (pj === 6) c = C.lit2; }
            else { c = C.glass; if (pi === 1 && pj === 1) c = C.w4; else if (pi + pj < 4 && pi + pj > 1) c = C.glass2; }
            FP(WX + i, WY + j, c);
          }
          F(WX + 6, WY, 2, 14, C.k2); F(WX, WY + 6, 14, 2, C.k2); FP(WX + 6, WY + 6, C.k3);
          if (opt.lit) { F(WX, WY, 2, 14, '#e8935a'); F(WX + 12, WY, 2, 14, '#e8935a'); FP(WX + 1, WY + 3, '#c86a44'); FP(WX + 12, WY + 3, '#c86a44'); }
          [[WX - 8, 0], [WX + 16, 1]].forEach(([sx, side]) => { F(sx, WY - 2, 6, 18, sh[1]); F(sx + (side ? 5 : 0), WY - 2, 1, 18, sh[0]); for (let j = 1; j < 18; j += 3) F(sx + 1, WY - 2 + j, 4, 1, sh[0]); F(sx + (side ? 0 : 5), WY - 2, 1, 18, mix(sh[1], '#ffffff', .3)); });
          F(WX - 2, WY + 16, 18, 4, C.k2); F(WX - 2, WY + 16, 18, 1, C.k3); F(WX - 2, WY + 19, 18, 1, C.k1);
          [[0, '#ff7fae'], [3, '#ffe066'], [6, '#ff7fae'], [9, '#ffffff'], [12, '#c7a6ff']].forEach(([a, c], n) => { FP(WX + a, WY + 15, C.l3); FP(WX + a + 1, WY + 15, C.l2); FP(WX + a + 1, WY + 14 - (n % 2), c); FP(WX + a, WY + 13 - (n % 2), c); FP(WX + a + 2, WY + 13 - (n % 2), mix(c, '#1a1020', .2)); FP(WX + a + 1, WY + 12 - (n % 2), mix(c, '#ffffff', .4)); FP(WX + a + 1, WY + 13 - (n % 2), '#ffd34a'); });
        };
        if (w >= 34) { win(x + 7, top + 4); win(x + w - 14, top + 4); }
        // door: planks, an arched top, iron straps, a brass handle
        const DX = (x + Math.floor(w / 2) - 4) * 2, DY = (y - 13) * 2;
        F(DX, DY + 2, 16, 24, C.k1); F(DX + 2, DY, 12, 2, C.k1); F(DX + 1, DY + 1, 14, 1, C.k1);
        F(DX + 2, DY + 2, 12, 24, C.k2); F(DX + 3, DY + 1, 10, 1, C.k2);
        for (let i = 2; i < 14; i += 4) { F(DX + i, DY + 2, 1, 24, C.k3); F(DX + i + 3, DY + 2, 1, 24, C.k1); }
        [DY + 6, DY + 19].forEach(hy => { F(DX + 2, hy, 9, 2, C.s1); F(DX + 2, hy, 9, 1, C.s2); FP(DX + 3, hy, C.s3); FP(DX + 9, hy + 1, C.s0); });
        F(DX + 10, DY + 13, 2, 3, C.y3); FP(DX + 10, DY + 13, C.y4); FP(DX + 11, DY + 15, C.y1);
        F(DX - 2, Y, 20, 1, C.s3); F(DX - 2, Y + 1, 20, 1, C.s2); F(DX - 2, Y + 2, 20, 1, C.s1); FP(DX - 1, Y, C.s4);
        // shingled roof
        const ro = 8, RX = X - ro, RW = Wf + 2 * ro, RY = T - RH;
        for (let j = 0; j < RH + 4; j++) {
          const yy = RY + j, inset = Math.max(0, Math.round((RH - j) * .55) - 4), x0 = RX + inset, x1 = RX + RW - inset;
          for (let xx = x0; xx < x1; xx++) {
            const row = Math.floor(j / 4), sx = (xx - RX + (row % 2) * 4) % 8, sy = j % 4, sid = Math.floor((xx - RX + (row % 2) * 4) / 8);
            let c = sy === 3 ? c1 : sx === 0 ? c1 : (sy === 0 && sx > 0 && sx < 4) ? c3 : c2;
            if (sy === 2 && sx === 7) c = c1;
            if (c === c2 && hash(sid, row, 45) < .12) c = sy === 0 ? c4 : c3;
            if (c === c2 && sy === 1 && sx === 1) c = c3;
            if (xx < x0 + 4 && j > 2) c = xx < x0 + 2 ? c3 : (sy === 3 ? c1 : c3);
            if (xx >= x1 - 4) c = xx >= x1 - 2 ? c0 : c1;
            if (xx === x0) c = c0;
            FP(xx, yy, c);
          }
        }
        const ridgeIn = Math.round(RH * .55) - 4; F(RX + ridgeIn, RY - 2, RW - 2 * ridgeIn, 2, c4); F(RX + ridgeIn, RY - 1, RW - 2 * ridgeIn, 1, c3);
        F(RX, T + 3, RW, 1, c0); F(RX + 1, T + 2, RW - 2, 1, c1); F(X, T + 4, Wf, 4, C.p0); F(X, T + 7, Wf, 1, C.k1);
        if (opt.chimney) {
          const CX = (x + w - 10) * 2, CY = (top - rh + 2) * 2;
          F(CX, CY - 16, 12, 24, C.s2);
          for (let j = 0; j < 24; j += 4) { F(CX, CY - 16 + j + 3, 12, 1, C.s1); for (let i = (j / 4) % 2 ? 2 : 0; i < 12; i += 5) { F(CX + i, CY - 16 + j, 1, 3, C.s1); FP(CX + i + 1, CY - 16 + j, C.s3); } }
          F(CX, CY - 16, 2, 24, C.s3); F(CX + 10, CY - 16, 2, 24, C.s1);
          F(CX - 2, CY - 18, 16, 4, C.s1); F(CX - 2, CY - 18, 16, 1, C.s4); F(CX - 2, CY - 17, 16, 1, C.s3); F(CX + 2, CY - 18, 8, 1, C.s0);
        }
        if (opt.extra) opt.extra(x, y, w, top);
      });
    };

    // ---- the orchard close-up ----
    const APPLE = ['.....kll..', '..rr.krr..', '.rLLrrrrr.', 'rLHLrrrrrd', 'rLLrrrrrrd', 'rrrrrrrrrd', 'rrrrrrrrdd', '.rrrrrrdd.', '.drrrrddd.', '..dd.ddd..'];
    k.apple = (x, y, kind = 'red', far) => { const set = far ? px.FAR_APPLES : px.APPLES, a = set[kind] || set.red; Fsprite(Math.round(x * 2), Math.round(y * 2), APPLE, { k: C.k1, l: C.l3, r: a.r, L: a.L, H: far ? a.L : '#ffffff', d: a.d }); };
    k.basket = (x, y, n, kind = 'red') => {
      k.shadowEll(x + 11, y, 12, 2);
      for (let i = 0; i < n; i++) { const row = Math.floor(i / 4), col = i % 4; k.apple(x + 3 + col * 4 + (row % 2) * 2, y - 15 - row * 3 + (col % 2), kind); }
      const X = x * 2, Y = y * 2;
      for (let j = 0; j < 16; j++) {
        const ins = j > 12 ? j - 12 : 0, band = Math.floor(j / 3), r = j % 3;
        for (let i = ins; i < 44 - ins; i++) {
          const cellI = Math.floor(i / 6), sx = i % 6, stake = (band + cellI) % 2 === 0;
          let lvl;
          if (stake && (sx === 2 || sx === 3)) lvl = sx === 2 ? 2 : 1;                   // the upright shows where the weaver passes behind it
          else { lvl = r === 0 ? 3 : r === 1 ? 2 : 1; if (stake && (sx === 1 || sx === 4)) lvl = Math.max(0, lvl - 1); }
          if (i > 37 - ins && lvl > 0) lvl--; else if (i < ins + 4 && lvl > 0 && lvl < 3) lvl++;
          if (i === ins || i === 43 - ins || j === 15) lvl = 0;
          FP(X + i, Y - 16 + j, [C.k1, C.k2, C.k3, C.k4][lvl]);
        }
      }
      F(X - 2, Y - 20, 48, 4, C.k3); F(X - 2, Y - 20, 48, 1, C.k4);
      for (let i = 0; i < 48; i += 4) { FP(X - 2 + i, Y - 19, C.k2); FP(X - 1 + i, Y - 18, C.k2); FP(X + i, Y - 17, C.k2); FP(X + 1 + i, Y - 18, C.k4); }
      F(X - 2, Y - 16, 48, 1, C.k1); FP(X - 2, Y - 20, C.k2); FP(X + 45, Y - 20, C.k2); F(X + 44, Y - 19, 2, 3, C.k2);
    };
    k.sign = (x, y, w, h) => {
      k.shadowEll(x + w / 2, y, w / 2 + 2, 2);
      const X = x * 2, Y = y * 2, Wf = w * 2, Hf = h * 2;
      [x + 6, x + w - 9].forEach(a => { const PX = a * 2; F(PX, Y - 32, 6, 32, C.k1); F(PX, Y - 32, 2, 32, C.k2); FP(PX, Y - 32, C.k3); for (let j = 4; j < 30; j += 7) F(PX + 3 + (j % 2), Y - 32 + j, 1, 3, C.k0); F(PX - 1, Y - 2, 8, 2, C.k0 + '88'); });
      const T = Y - 32 - Hf; F(X, T, Wf, Hf, C.k1);
      for (let j = 2; j < Hf - 2; j++) { const jj = (j - 2) % 12; F(X + 2, T + j, Wf - 4, 1, jj === 0 ? C.k2 : jj === 1 ? C.k4 : jj === 11 ? C.d2 : C.d3); }
      for (let p = 0; p * 12 + 2 < Hf - 4; p++) {
        const py = T + 2 + p * 12;
        for (let s = 0; s < 9; s++) { const sx = X + 4 + Math.floor(hash(s, p, x + 3) * (Wf - 28)), sy = py + 3 + Math.floor(hash(p, s, y + 4) * 7), len = 6 + Math.floor(hash(s, s + p, 5) * 18); F(sx, sy, len, 1, C.d2); if (s % 3 === 0) F(sx + 2, sy + 1, len - 4, 1, C.d4); }
        const kx = X + 10 + Math.floor(hash(p, 7, x) * (Wf - 24)), ky = py + 5; F(kx - 1, ky, 4, 2, C.d2); FP(kx, ky, C.k3); FP(kx + 1, ky + 1, C.k3); F(kx - 3, ky - 1, 2, 1, C.d2); F(kx + 3, ky + 2, 3, 1, C.d2);
        [X + 4, X + Wf - 6].forEach(nx => { FP(nx, py + 4, C.s2); FP(nx, py + 3, C.s4); FP(nx + 1, py + 4, C.s1); FP(nx, py + 8, C.s2); FP(nx, py + 7, C.s4); FP(nx + 1, py + 8, C.s1); });
      }
      F(X + 2, T + 2, 1, Hf - 4, C.d4); F(X + Wf - 3, T + 2, 1, Hf - 4, C.k2); F(X + 2, T + Hf - 3, Wf - 4, 1, C.k2);
      return [x + 1, y - 16 - h + 1, w - 2, h - 2];
    };
    return k;
  };

  // ---------- ground on the fine grid: grass with tufts, water banded by depth, a sandy shore, paths with pebbles ----------
  px.ground = (g, W, H, preds) => {
    const Z = g.getTransform().a || 1; if (Z === 1) return baseGround(g, W, H, preds);
    const { water = () => false, path = () => false, plot = () => false, tall = () => false } = preds;
    const FW = W * Z, FH = H * Z, N = FW * FH, img = g.createImageData(FW, FH), D = img.data, HX = {};
    for (const k in C) HX[k] = px.hash && [parseInt(C[k].slice(1, 3), 16), parseInt(C[k].slice(3, 5), 16), parseInt(C[k].slice(5, 7), 16)];
    const L = v => (v + .5) / Z;
    const wm = new Uint8Array(N), pm = new Uint8Array(N), lm = new Uint8Array(N);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const i = y * FW + x, lx = L(x), ly = L(y); wm[i] = water(lx, ly) ? 1 : 0; if (!wm[i]) { pm[i] = path(lx, ly) ? 1 : 0; lm[i] = plot(lx, ly) ? 1 : 0; } }
    // distance into the water, and out from it onto land
    const din = new Uint8Array(N).fill(255), dout = new Uint8Array(N).fill(255);
    for (let i = 0; i < N; i++) { if (!wm[i]) din[i] = 0; else dout[i] = 0; }
    const relax = (d) => { for (let pass = 0; pass < 2; pass++) for (let y = 1; y < FH - 1; y++) for (let x = 1; x < FW - 1; x++) { const ys = pass ? FH - 1 - y : y, xs = pass ? FW - 1 - x : x, j = ys * FW + xs; if (!d[j]) continue; const m = Math.min(d[j - 1], d[j + 1], d[j - FW], d[j + FW]) + 1; if (m < d[j]) d[j] = m; } };
    relax(din); relax(dout);
    const P = (x, y) => x < 0 || y < 0 || x >= FW || y >= FH ? 1 : pm[y * FW + x], PL = (x, y) => x < 0 || y < 0 || x >= FW || y >= FH ? 1 : lm[y * FW + x];
    // grass tufts: a small fan of blades, dark at the root, light at the tips
    const TUFT = [[0, -2, 'L'], [-2, -1, 'L'], [2, -1, 'L'], [0, -1, 'M'], [-1, 0, 'M'], [1, 0, 'M'], [-1, 1, 'D'], [0, 1, 'D'], [1, 1, 'D'], [-2, 0, 'D'], [2, 0, 'D']];
    const ANCH = [[5, 7], [19, 4], [12, 21], [27, 17], [3, 28], [23, 29], [14, 11], [29, 8]];
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const i = y * FW + x; let k;
      if (wm[i]) {
        const d = din[i];
        k = d <= 2 ? 'w3' : d <= 10 ? 'w2' : d <= 68 ? 'w1' : 'w0';
        if ((d === 3 || d === 11 || d === 69) && (x + y) % 2) k = d === 3 ? 'w3' : d === 11 ? 'w2' : 'w1';
        if (k === 'w1') { const sx = x + (y >> 2) * 7, hv = hash(sx >> 4, y >> 2, 15); if (hv < .2 && ((sx & 15) > 1 && (sx & 15) < 14 || (x + y) % 2)) k = 'w2'; }
        if (d <= 1 && hash(x >> 1, y, 9) < .6) k = 'w4';
        if (d > 5 && y % 14 === 0 && hash(x >> 3, y, 4) < .14) k = d > 68 ? 'w2' : 'w3';
        if (d > 5 && y % 14 === 1 && hash(x >> 3, y - 1, 4) < .14 && (x & 7) > 1 && (x & 7) < 6) k = d > 68 ? 'w0' : 'w2';
        if (d > 5 && y % 14 === 0 && hash(x >> 3, y, 4) < .14 && (x & 7) === 2) k = 'w4';
      } else if (dout[i] <= 4) {
        const h = hash(x, y, 2);
        k = dout[i] <= 1 ? 'd2' : h < .14 ? 'd4' : 'd3';
        if (dout[i] > 1 && hash(x >> 1, y >> 1, 3) < .05) k = (x & 1) || (y & 1) ? 'd2' : 'd4';
        if (dout[i] === 4 && h < .4) k = 'g1';
      } else if (lm[i]) {
        const r = y % 8, h = hash(x, y, 8);
        k = r === 0 ? 'd1' : r === 1 && h < .5 ? 'd1' : r === 3 && h < .25 ? 'd3' : 'd2';
        if (r > 3 && (x + y) % 2 && h < .1) k = 'd1';
        if (!PL(x, y - 1) || !PL(x, y - 2)) k = 'd0';
      } else if (pm[i]) {
        k = 'd2'; const h = hash(x >> 1, y >> 1, 5);
        if (h < .05) k = (x & 1) || (y & 1) ? 'd3' : 'd4';
        else if (h < .07) k = (x & 1) && (y & 1) ? 'd1' : 'd3';
        else if (hash(x, y, 6) < .05) k = 'd1';
        if (!P(x, y - 1)) k = 'g1'; else if (!P(x, y - 2)) k = 'd1'; else if (!P(x, y + 1)) k = 'd1';
      } else {
        const t = tall(L(x), L(y));
        k = t ? 'g3' : 'g2';
        const tx = x & 31, ty = y & 31, s = hash(x >> 5, y >> 5, 1);
        for (const [a, b] of ANCH) {
          const ax = (a + Math.floor(s * 13)) & 31, by = (b + Math.floor(s * 11)) & 31;
          for (const [dx, dy, kind] of TUFT) if (tx === ax + dx && ty === by + dy) k = kind === 'L' ? (t ? 'g4' : 'g3') : kind === 'M' ? (t ? 'g4' : 'g3') : 'g1';
        }
        if (t && hash(x, y >> 2, 19) < .16) { const r = y & 3; k = r === 0 ? 'g4' : r === 3 ? 'g1' : 'g3'; }
        const sp = hash(x, y, 17);
        if (k === 'g2' && sp < .01) k = 'g3'; else if (k === 'g2' && sp < .018) k = 'g1';
        if (hash(x, y, 11) < .002) k = 'gf';
      }
      const c = HX[k]; D[i * 4] = c[0]; D[i * 4 + 1] = c[1]; D[i * 4 + 2] = c[2]; D[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  };
})();
