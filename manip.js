/* Ellie Math — things she can move with a finger: counters into a ten-frame, a ten-disc into the ones, a marker on a
   number line, and the surprises in her world. Each widget keeps its state in data- attributes on its root and only
   repaints its inside, so a drag in progress survives. Tapping works everywhere dragging does. */
'use strict';
(function () {
  const EM = window.EM;
  const fill = (n, c) => Array(Math.max(0, n)).fill(c);
  const fmt = n => EM.fmt(n);
  const NAMES = ['ones', 'tens', 'hundreds', 'thousands'];
  const tf = cells => `<div class="tf">${cells.map(c => `<span class="cell">${c ? `<i class="dot ${c}"></i>` : ''}</span>`).join('')}</div>`;
  const counter = cls => `<i class="dot ${cls} mdrag" role="button" aria-label="Move a counter"></i>`;

  // ---------- inner HTML per widget, from its attributes ----------
  const INNER = {
    // Fill the ten first: `big` counters already in the first frame, `small` more waiting in the tray.
    make10(d) {
      const big = +d.big, small = +d.small, moved = +d.moved, need = 10 - big, in1 = Math.min(moved, need), in2 = Math.max(0, moved - need);
      const cap = moved < need ? `Drag the counters up. Fill the ten first!` : moved < small ? 'A full ten! Keep going.' : `A full ten and ${in2} more.`;
      return `<div class="mframes mdrop">${tf([...fill(big, 'a'), ...fill(in1, 'c'), ...fill(need - in1, '')])}${tf([...fill(in2, 'b'), ...fill(10 - in2, '')])}</div>
        <div class="mtray">${fill(small - moved, 0).map(() => counter('b')).join('')}</div><div class="mcap">${cap}</div>`;
    },
    // Number bond: `w` counters in the frame; move `p` of them into the box, then see how many stayed.
    split(d) {
      const w = +d.w, p = +d.p, moved = +d.moved, stay = w - moved;
      const cap = moved < p ? `Drag ${p} counter${p === 1 ? '' : 's'} into the box.` : `${p} in the box. How many are still in the frame?`;
      const frameCells = fill(stay, 0).map(() => (moved < p ? 'a mdrag' : 'a'));
      return `<div class="msplit"><div class="mframes">${tf([...frameCells, ...fill(10 - stay, '')])}</div>
        <div class="mbox mdrop"><div class="mlab">${p}</div><div class="mbin">${fill(moved, 0).map(() => '<i class="dot b"></i>').join('')}</div></div></div><div class="mcap">${cap}</div>`;
    },
    // Regroup: drag the one bigger disc into the column on its right, where it breaks into 10.
    regroup(d) {
      const x = +d.x, col = +d.col, broke = d.broke === '1', unit = 10 ** col, next = unit * 10;
      const nm = NAMES[col], nextNm = NAMES[col + 1].slice(0, -1), lab = { 1: 'O', 10: 'T', 100: 'H', 1000: 'Th' };
      const big = broke ? '<i class="disc ghost"></i>' : `<i class="disc d${next} mdrag" role="button" aria-label="Move one ${nextNm}">${next}</i>`;
      const ones = [...fill(x, `<i class="disc d${unit}">${unit}</i>`), ...fill(broke ? 10 : 0, `<i class="disc d${unit} fresh">${unit}</i>`)].join('');
      const cap = broke ? `1 ${nextNm} is regrouped as 10 ${nm}. How many ${nm} now?` : `${d.short === '1' ? '' : `Not enough ${nm}! `}Regroup: drag 1 ${nextNm} over to the ${nm}.`;
      return `<div class="pvc mreg"><div class="col"><div class="lab">${lab[next]}</div><div class="dcs">${big}</div></div><div class="col mdrop"><div class="lab">${lab[unit]}</div><div class="dcs">${ones}</div></div></div><div class="mcap">${cap}</div>`;
    },
    // Number line from lo to hi with a marker she drags. lab: 'ends' | 'mid' | 'all'. tgt: an arrow where it goes (help).
    line(d) {
      const lo = +d.lo, hi = +d.hi, span = hi - lo, X0 = 40, X1 = 560, Y = 70, x = v => X0 + (v - lo) / span * (X1 - X0);
      let s = `<svg viewBox="0 0 600 130" class="nlput" role="img" aria-label="Number line from ${fmt(lo)} to ${fmt(hi)}"><rect x="0" y="0" width="600" height="130" fill="transparent"/>`;
      s += `<line x1="${X0}" y1="${Y}" x2="${X1}" y2="${Y}" stroke-width="4"/>`;
      for (let i = 0; i <= 10; i++) { const v = lo + i * span / 10, h = i % 10 === 0 ? 16 : i === 5 ? 12 : 7; s += `<line x1="${x(v)}" y1="${Y - h}" x2="${x(v)}" y2="${Y + h}" stroke-width="${i % 5 ? 2 : 3}"/>`; }
      const label = (v, cls = '') => `<text class="${cls}" x="${x(v)}" y="${Y + 42}" text-anchor="middle">${fmt(v)}</text>`;
      if (d.lab === 'all') for (let i = 0; i <= 10; i++) s += label(lo + i * span / 10, i % 10 ? 'small' : '');
      else { s += label(lo) + label(hi); if (d.lab === 'mid') s += label(lo + span / 2, 'muted'); }
      if (d.tgt) s += `<path d="M${x(+d.tgt)} ${Y - 22} l-9 -14 h18z" style="fill:var(--good)"/>`;
      if (d.val !== '') s += `<g class="mmark"><line x1="${x(+d.val)}" y1="${Y - 30}" x2="${x(+d.val)}" y2="${Y + 6}" stroke-width="4" style="stroke:var(--a)"/><circle cx="${x(+d.val)}" cy="${Y - 36}" r="17" style="fill:var(--a)"/></g>`;
      else s += `<text class="muted" x="300" y="22" text-anchor="middle">Tap or drag on the line</text>`;
      return s + '</svg>';
    },
  };
  const attrs = o => Object.entries(o).map(([k, v]) => `data-${k}="${v === null || v === undefined ? '' : v}"`).join(' ');
  const widget = (m, o) => `<div class="manip m-${m}" data-m="${m}" ${attrs(o)}>${INNER[m](Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])))}</div>`;
  const paint = root => { root.innerHTML = INNER[root.dataset.m](root.dataset); };

  // One move: a counter or disc reached its target.
  function act(root) {
    const d = root.dataset;
    if (d.m === 'make10' && +d.moved < +d.small) d.moved = +d.moved + 1;
    else if (d.m === 'split' && +d.moved < +d.p) d.moved = +d.moved + 1;
    else if (d.m === 'regroup' && d.broke !== '1') d.broke = '1';
    else return;
    paint(root); EM.sfx.tick();
  }

  // ---------- number line ----------
  function lineValue(root, clientX) {
    const svg = root.querySelector('svg'), r = svg.getBoundingClientRect(), d = root.dataset;
    const vx = (clientX - r.left) / r.width * 600, t = Math.min(1, Math.max(0, (vx - 40) / 520)), lo = +d.lo, hi = +d.hi, step = (hi - lo) / 100;
    return lo + Math.round(t * 100) * step;
  }
  function setLine(root, v) {
    if (EM.manip.onLine && EM.manip.onLine(v) === false) return;
    root.dataset.val = v; paint(root);
  }

  // ---------- pointer handling (drag with a floating copy; a short tap counts as a move) ----------
  let drag = null;
  document.addEventListener('pointerdown', e => {
    const line = e.target.closest('.m-line');
    if (line) { e.preventDefault(); drag = { line, id: e.pointerId }; try { line.setPointerCapture(e.pointerId); } catch (err) {} setLine(line, lineValue(line, e.clientX)); return; }
    const deco = e.target.closest('.world:not(.inset) [data-deco]');
    if (deco) return decoDown(e, deco);
    const el = e.target.closest('.manip .mdrag'); if (!el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect(), ghost = el.cloneNode(true);
    ghost.classList.add('mghost'); Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    document.body.appendChild(ghost); el.classList.add('lifted');
    drag = { el, ghost, root: el.closest('.manip'), x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
  });
  document.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.line) return setLine(drag.line, lineValue(drag.line, e.clientX));
    if (drag.deco) return decoMove(e);
    drag.ghost.style.left = e.clientX - drag.dx + 'px'; drag.ghost.style.top = e.clientY - drag.dy + 'px';
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const g = drag; drag = null;
    if (g.line) return;
    if (g.deco) return decoUp(e, g);
    g.ghost.remove();
    const tap = Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 10;
    const under = document.elementFromPoint(e.clientX, e.clientY), target = under && under.closest('.mdrop');
    if (e.type === 'pointerup' && (tap || (target && g.root.contains(target)))) act(g.root);
    else g.el.classList.remove('lifted');
  };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);

  // ---------- her world: drag the surprises anywhere ----------
  function svgPoint(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function decoDown(e, deco) {
    e.preventDefault();
    const svg = deco.ownerSVGElement, p = svgPoint(svg, e);
    drag = { deco, svg, id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: +deco.getAttribute('x') - p.x, oy: +deco.getAttribute('y') - p.y, start: [deco.getAttribute('x'), deco.getAttribute('y')] };
    deco.classList.add('dragging');
  }
  function decoMove(e) { const p = svgPoint(drag.svg, e); drag.deco.setAttribute('x', (p.x + drag.ox).toFixed(0)); drag.deco.setAttribute('y', (p.y + drag.oy).toFixed(0)); }
  function decoUp(e, g) {
    g.deco.classList.remove('dragging');
    const n = g.deco.dataset.deco, x = +g.deco.getAttribute('x'), y = +g.deco.getAttribute('y');
    if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 8) { // a tap: say hello
      g.deco.classList.remove('wiggle'); void g.deco.getBBox(); g.deco.classList.add('wiggle');
      const m = EM.world.MILESTONES[EM.theme.current().id].find(m => String(m[0]) === n); if (m) EM.speech.say(m[2].replace(/^(a|an|the) /, ''));
      return;
    }
    if (e.type !== 'pointerup' || !EM.world.canPlace(x, y)) { g.deco.setAttribute('x', g.start[0]); g.deco.setAttribute('y', g.start[1]); EM.sfx.gentle(); return; }
    (EM.S.decoPos || (EM.S.decoPos = {}))[n] = [x, y]; EM.save(); EM.sfx.tick();
  }

  EM.manip = {
    make10: (big, small) => widget('make10', { big, small, moved: 0 }),
    split: (w, p) => widget('split', { w, p, moved: 0 }),
    regroup: (x, col, opts = {}) => widget('regroup', { x, col, broke: 0, short: opts.short ? 1 : 0 }),
    line: (lo, hi, val, opts = {}) => widget('line', { lo, hi, val, lab: opts.labels || 'ends', tgt: opts.target }),
    onLine: null,
    // For tests and keyboard users: set the marker on the line that's on screen.
    setLine: v => { const l = document.querySelector('.m-line'); if (l) setLine(l, v); },
  };
})();
