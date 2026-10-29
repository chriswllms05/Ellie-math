/* Ellie Math — the scratchpad: her own paper for multi-step problems. See DESIGN-v2.md, "Scratchpad".
   Only for two-step story problems and column math once the on-screen steps have faded (never facts, never In Your
   Head). It slides out over the number pad, beside the problem, so the problem stays in view; "Done" brings the
   numbers back. The time it's open doesn't count against her. Nothing she draws is saved, graded or shown to anyone:
   it clears itself when the next problem starts. */
'use strict';
(function () {
  const EM = window.EM;
  const INKS = [['#2b2433', 'Pencil'], ['#3d6bd6', 'Blue'], ['#d4513a', 'Red']];
  let el = null, btn = null, cv = null, g = null, key = null, ink = INKS[0][0], erasing = false, openAt = 0, onShift = null;

  // where it's offered: story problems and column math, once she no longer gets the step-by-step support
  const wanted = R => !!(R && R.cur && R.cur.kind === 'proc' && ['words', 'regroup'].includes(R.cur.skillId) && R.cur.tier >= 1);

  function build() {
    btn = document.createElement('button'); btn.className = 'scratchbtn'; btn.type = 'button'; btn.innerHTML = '✏️ Scratchpad';
    el = document.createElement('div'); el.className = 'scratch'; el.setAttribute('aria-label', 'Scratchpad');
    el.innerHTML = `<div class="scratch-bar">${INKS.map(([c, n], i) => `<button class="ink ${i ? '' : 'on'}" data-ink="${c}" style="--c:${c}" aria-label="${n}"></button>`).join('')}
      <button class="tool" data-tool="erase">Eraser</button><button class="tool" data-tool="clear">Clear</button><button class="done" data-tool="done">Done ✓</button></div>
      <canvas></canvas>`;
    document.body.append(btn, el);
    cv = el.querySelector('canvas'); g = cv.getContext('2d');
    btn.addEventListener('click', () => open());
    el.querySelector('.scratch-bar').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ink) { ink = b.dataset.ink; erasing = false; el.querySelectorAll('.ink, .tool').forEach(x => x.classList.toggle('on', x === b)); }
      else if (b.dataset.tool === 'erase') { erasing = true; el.querySelectorAll('.ink, .tool').forEach(x => x.classList.toggle('on', x === b)); }
      else if (b.dataset.tool === 'clear') clear();
      else if (b.dataset.tool === 'done') close();
    });
    // finger drawing: smooth strokes (this is paper, not pixel art)
    let last = null;
    const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); last = at(e); dot(last); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!last) return; const p = at(e); stroke(last, p); last = p; e.preventDefault(); });
    const up = () => { last = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    window.addEventListener('resize', size);
  }
  const width = () => (erasing ? 34 : 5) * (window.devicePixelRatio || 1);
  function pen() { g.globalCompositeOperation = erasing ? 'destination-out' : 'source-over'; g.strokeStyle = g.fillStyle = ink; g.lineWidth = width(); g.lineCap = g.lineJoin = 'round'; }
  function dot([x, y]) { pen(); g.beginPath(); g.arc(x, y, width() / 2, 0, Math.PI * 2); g.fill(); }
  function stroke([x0, y0], [x1, y1]) { pen(); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function size() {
    if (!cv || !el.classList.contains('on')) return;
    const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1, w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (cv.width === w && cv.height === h) return;
    const keep = document.createElement('canvas'); keep.width = cv.width; keep.height = cv.height; keep.getContext('2d').drawImage(cv, 0, 0);
    cv.width = w; cv.height = h; g.drawImage(keep, 0, 0);
  }
  function clear() { if (g) g.clearRect(0, 0, cv.width, cv.height); }
  function open() { if (!el || el.classList.contains('on')) return; el.classList.add('on'); btn.classList.add('hidden'); document.body.classList.add('scratching'); openAt = performance.now(); requestAnimationFrame(size); }
  function close() {
    if (!el || !el.classList.contains('on')) return;
    el.classList.remove('on'); document.body.classList.remove('scratching'); btn.classList.remove('hidden');
    const dur = performance.now() - openAt; if (onShift && dur > 0) onShift(dur, openAt);
  }
  // called after every practice render (and on every other screen): show the button for the problems that want it,
  // and start fresh paper for each new problem
  function sync(R, screen) {
    const want = screen === 'practice' && wanted(R);
    if (!want && !el) return;
    if (!el) build();
    const k = want ? R.cur.key : null;
    if (k !== key) { if (el.classList.contains('on')) close(); clear(); key = k; }
    btn.classList.toggle('show', want); if (!want) { el.classList.remove('on'); document.body.classList.remove('scratching'); }
  }
  EM.scratch = { sync, close, isOpen: () => !!(el && el.classList.contains('on')), onShift: f => { onShift = f; }, wanted };
})();
