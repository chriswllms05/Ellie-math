/* Ellie Math — content: skills, item generators, pictures, help text (HTML + spoken strings).
   Items: { key, skillId, kind:'fact'|'proc', type, level, tier, scaff, steps:[{ans, html, say, vis}], help(step, stage, typed) -> {vis, html, say}, done? }
   Help stage 1 = picture + guiding question (no answer). Stage 2 = answer shown. */
'use strict';
(function () {
  const EM = window.EM;
  const { range, uniq, pick, shuffle, fmt } = EM;
  const fill = (n, c) => Array(Math.max(0, n)).fill(c);
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  EM.esc = esc;

  // ---------- pictures ----------
  function frames(cells, opts = {}) {
    const n = Math.max(1, Math.ceil(cells.length / 10));
    let h = `<div class="frames${opts.cls ? ' ' + opts.cls : ''}" aria-hidden="true">`;
    for (let f = 0; f < n; f++) {
      h += '<div class="tf">';
      for (let i = 0; i < 10; i++) { const c = cells[f * 10 + i] || ''; h += `<span class="cell${c === 'e' ? ' hl' : ''}">${c && c !== 'e' ? `<i class="dot ${c}"></i>` : ''}</span>`; }
      h += '</div>';
    }
    return h + '</div>';
  }
  const twoFrames = (x, y) => frames([...fill(x[0], x[1]), ...fill(10 - x[0], ''), ...y]);
  // Number bond: whole on top, two parts below. Pass '?' for the missing one.
  function bond(whole, p1, p2) {
    const c = v => v === '?' ? 'q' : '';
    return `<svg class="bond" viewBox="0 0 200 120" aria-hidden="true">
      <line x1="100" y1="40" x2="50" y2="90"/><line x1="100" y1="40" x2="150" y2="90"/>
      <circle cx="100" cy="30" r="26" class="${c(whole)}"/><circle cx="50" cy="92" r="22" class="${c(p1)}"/><circle cx="150" cy="92" r="22" class="${c(p2)}"/>
      <text x="100" y="37">${whole}</text><text x="50" y="99">${p1}</text><text x="150" y="99">${p2}</text></svg>`;
  }
  // Number line between the two neighbors of n at place `to`. opts: dot, labels, halfway, distances
  function numberLine(n, to, opts = {}) {
    const lo = Math.floor(n / to) * to, hi = lo + to, mid = lo + to / 2, step = to / 10;
    const X0 = 60, X1 = 540, x = v => X0 + (v - lo) / (hi - lo) * (X1 - X0), Y = 80;
    const H = opts.distances ? 180 : 130;
    let s = `<svg class="nl" viewBox="0 0 600 ${H}" role="img" aria-label="Number line from ${fmt(lo)} to ${fmt(hi)}">`;
    s += `<line x1="${X0}" y1="${Y}" x2="${X1}" y2="${Y}" stroke-width="3"/>`;
    for (let i = 0; i <= 10; i++) { const v = lo + i * step, h = i === 0 || i === 10 ? 14 : i === 5 ? 11 : 6; s += `<line x1="${x(v)}" y1="${Y - h}" x2="${x(v)}" y2="${Y + h}" stroke-width="${i % 5 ? 2 : 3}"/>`; }
    if (opts.labels !== false) s += `<text x="${x(lo)}" y="${Y + 40}" text-anchor="middle">${fmt(lo)}</text><text x="${x(hi)}" y="${Y + 40}" text-anchor="middle">${fmt(hi)}</text>`;
    if (opts.halfway !== false) s += `<text class="muted" x="${x(mid)}" y="${Y + 36}" text-anchor="middle">${opts.labels === false ? 'halfway' : fmt(mid) + ' halfway'}</text>`;
    if (opts.distances) {
      const d1 = n - lo, d2 = hi - n, c1 = d1 < d2 ? 'var(--good)' : 'var(--muted)', c2 = d2 <= d1 ? 'var(--good)' : 'var(--muted)', y = Y + 70;
      s += `<path d="M${x(lo)} ${y - 8}v8H${x(n)}v-8" fill="none" stroke-width="3" style="stroke:${c1}"/><text x="${(x(lo) + x(n)) / 2}" y="${y + 24}" text-anchor="middle" style="fill:${c1}">${d1}</text>`;
      s += `<path d="M${x(n)} ${y - 8}v8H${x(hi)}v-8" fill="none" stroke-width="3" style="stroke:${c2}"/><text x="${(x(n) + x(hi)) / 2}" y="${y + 24}" text-anchor="middle" style="fill:${c2}">${d2}</text>`;
    }
    if (opts.dot) s += `<circle cx="${x(n)}" cy="${Y}" r="10" style="fill:var(--a)"/><text x="${x(n)}" y="${Y - 24}" text-anchor="middle" style="fill:var(--a)">${fmt(n)}</text>`;
    return s + '</svg>';
  }
  // Place-value discs in a chart. digits: [thousands, hundreds, tens, ones] (leading places may be omitted).
  const PLACES = [['Th', 1000], ['H', 100], ['T', 10], ['O', 1]];
  function discs(n, opts = {}) {
    const places = n >= 1000 || opts.four ? PLACES : PLACES.slice(1);
    let h = '<div class="pvc" aria-hidden="true">';
    for (const [lab, v] of places) {
      const d = Math.floor(n / v) % 10;
      h += `<div class="col"><div class="lab">${lab}</div><div class="dcs">${fill(d, 0).map(() => `<i class="disc d${v}">${v}</i>`).join('')}</div>${opts.counts ? `<div class="cnt">${d}</div>` : ''}</div>`;
    }
    return h + '</div>';
  }
  function discsTrio(ns) { const four = Math.max(...ns) >= 1000; return `<div class="pvpair trio">${ns.map(n => `<div><div class="pvtitle">${fmt(n)}</div>${discs(n, { four, counts: true })}</div>`).join('')}</div>`; }
  function discsPair(a, b) { return `<div class="pvpair"><div><div class="pvtitle">${fmt(a)}</div>${discs(a, { four: Math.max(a, b) >= 1000, counts: true })}</div><div><div class="pvtitle">${fmt(b)}</div>${discs(b, { four: Math.max(a, b) >= 1000, counts: true })}</div></div>`; }
  // Vertical algorithm display. rows: [a, b], op, filled: array of result digits from the right (strings), carries: {colIdx: n}
  function column(a, b, op, filled, carries, regroupNote) {
    const w = Math.max(String(a).length, String(b).length, String(op === '+' ? a + b : a - b).length);
    const pad = s => String(s).padStart(w, ' ').split('');
    const A = pad(a), B = pad(b);
    const cell = (c, cls = '') => `<span class="${cls}">${c.trim() === '' ? '&nbsp;' : c}</span>`;
    let h = '<div class="colalg" aria-hidden="true">';
    h += '<div class="r carries">' + range(0, w - 1).map(i => cell(carries[w - 1 - i] !== undefined ? String(carries[w - 1 - i]) : '', 'carry')).join('') + '</div>';
    h += '<div class="r">' + A.map(c => cell(c)).join('') + '</div>';
    h += `<div class="r op"><span class="opsign">${op}</span>` + B.map(c => cell(c)).join('') + '</div>';
    // filled is ones-first; column i from the left holds filled[w - 1 - i]
    h += '<div class="r res">' + range(0, w - 1).map(i => { const v = filled[w - 1 - i]; return cell(v === undefined ? '' : String(v), v === undefined ? '' : 'got'); }).join('') + '</div>';
    if (regroupNote) h += `<div class="note">${regroupNote}</div>`;
    return h + '</div>';
  }
  EM.pics = { frames, twoFrames, bond, numberLine, discs, discsPair, column };

  // ---------- facts ----------
  const FACTS = EM.FACTS = {};
  function fact(key, props) { if (!FACTS[key]) FACTS[key] = { key, ...props }; return key; }
  const add = (a, b) => fact(`add:${a}+${b}`, { type: 'add', a, b, ans: a + b });
  const sub = (a, b) => fact(`sub:${a}-${b}`, { type: 'sub', a, b, ans: a - b });
  const m10 = a => fact(`m10:${a}`, { type: 'm10', a, ans: 10 - a });
  const look = n => fact(`look:${n}`, { type: 'look', n, ans: n });

  const SKILLS = EM.SKILLS = [
    // Track A — foundations
    { id: 'look', track: 'A', kind: 'fact', icon: '👀', name: 'Quick Look', desc: 'See how many without counting.', requires: [], facts: range(1, 20).map(look) },
    { id: 'm10', track: 'A', kind: 'fact', icon: '🔟', name: 'Partners of 10', desc: 'Which two numbers make 10?', requires: [], facts: range(0, 10).map(m10) },
    { id: 'plus12', track: 'A', kind: 'fact', icon: '➕', name: '+1 +2, −1 −2', desc: 'One more, two more. One less, two less.', requires: [], facts: uniq([...range(0, 10).flatMap(a => [add(a, 1), add(1, a), add(a, 2), add(2, a)]), ...range(1, 12).flatMap(a => [sub(a, 1), ...(a >= 2 ? [sub(a, 2)] : [])])]) },
    { id: 'doubles', track: 'A', kind: 'fact', icon: '👯', name: 'Doubles', desc: '5 + 5, 7 + 7…', requires: [], facts: range(1, 10).map(a => add(a, a)) },
    { id: 'teens', track: 'A', kind: 'fact', icon: '🧱', name: 'Ten and More', desc: '10 + 4 is one ten and 4 ones.', requires: [], facts: uniq(range(1, 10).flatMap(n => [add(10, n), add(n, 10)])) },
    { id: 'to10', track: 'A', kind: 'fact', icon: '🖐️', name: 'Facts to 10', desc: 'Every way to add up to 10.', requires: ['m10'], facts: uniq(range(2, 10).flatMap(s => range(1, s - 1).map(a => add(a, s - a)))) },
    { id: 'near', track: 'A', kind: 'fact', icon: '🪜', name: 'Near Doubles', desc: '6 + 7 is double 6, and 1 more.', requires: ['doubles'], facts: uniq(range(1, 9).flatMap(a => [add(a, a + 1), add(a + 1, a)])) },
    { id: 'bridge', track: 'A', kind: 'fact', icon: '🌉', name: 'Make a 10', desc: '8 + 5: 8 and 2 make 10, then 3 more.', requires: ['m10', 'teens'], facts: uniq([9, 8, 7, 6, 5, 4, 3].flatMap(a => range(2, 9).filter(b => a + b > 10).flatMap(b => [add(a, b), add(b, a)]))) },
    { id: 'sub10', track: 'A', kind: 'fact', icon: '➖', name: 'Take Away to 10', desc: 'Think addition: 3 and what make 8?', requires: ['to10'], facts: range(2, 10).flatMap(a => range(1, a).map(b => sub(a, b))) },
    { id: 'subteen', track: 'A', kind: 'fact', icon: '⬇️', name: 'Take Away from Teens', desc: '13 − 5: back to 10, then 2 more.', requires: ['bridge', 'sub10'], facts: range(11, 20).flatMap(a => range(a - 10, 10).map(b => sub(a, b))) },
    // Track B — place value and rounding (procedures with levels)
    { id: 'pv_build', track: 'B', kind: 'proc', type: 'pv', icon: '🪙', name: 'Read the Number', desc: 'Thousands, hundreds, tens, ones.', requires: [], levels: ['3-digit', '4-digit'] },
    { id: 'pv_count', track: 'B', kind: 'proc', type: 'pv', icon: '🔢', name: 'Count On', desc: 'By 10s, 100s and 1,000s from any number.', requires: [], levels: ['to 1,000', 'to 10,000'] },
    { id: 'compare', track: 'B', kind: 'proc', type: 'pv', icon: '⚖️', name: 'Which Is Bigger?', desc: 'Start from the biggest place.', requires: ['pv_build@0'], levels: ['3-digit', '4-digit'] },
    { id: 'neighbors', track: 'B', kind: 'proc', type: 'pv', icon: '🏘️', name: 'Neighbors', desc: '437 is between 430 and 440.', requires: ['pv_count@0'], levels: ['tens', 'hundreds', 'thousands'] },
    { id: 'r10', track: 'B', kind: 'proc', type: 'rnd', icon: '📏', name: 'Round to 10', desc: 'Which ten is nearer?', requires: ['neighbors@0'], levels: ['2-digit', '3-digit', '4-digit'] },
    { id: 'r100', track: 'B', kind: 'proc', type: 'rnd', icon: '💯', name: 'Round to 100', desc: 'Which hundred is nearer?', requires: ['r10@1', 'neighbors@1'], levels: ['3-digit', '4-digit'] },
    { id: 'r1000', track: 'B', kind: 'proc', type: 'rnd', icon: '🏔️', name: 'Round to 1,000', desc: 'Which thousand is nearer?', requires: ['r100@1', 'neighbors@2'], levels: ['4-digit'] },
    { id: 'digit', track: 'B', kind: 'proc', type: 'rnd', icon: '⚡', name: 'The Digit Shortcut', desc: 'Round in your head, any place.', requires: ['r1000'], levels: ['mixed'] },
    // Track C — bridge to school
    { id: 'est', track: 'C', kind: 'proc', type: 'est', icon: '🎯', name: 'About How Much?', desc: 'Round first, then add or subtract.', requires: ['r100@0'], levels: ['add to 100', 'subtract to 100', 'thousands'] },
    { id: 'regroup', track: 'C', kind: 'proc', type: 'regroup', icon: '🧮', name: 'Column Add & Subtract', desc: 'Ten ones become one ten.', requires: ['pv_build@0', 'to10'], levels: ['add 3-digit', 'subtract 3-digit', 'add 4-digit', 'subtract 4-digit'] },
  ];
  EM.SK = Object.fromEntries(SKILLS.map(s => [s.id, s]));
  EM.TRACKS = { A: { name: 'Foundations', skills: SKILLS.filter(s => s.track === 'A').map(s => s.id) }, B: { name: 'Number sense', skills: SKILLS.filter(s => s.track === 'B').map(s => s.id) }, C: { name: 'Bridge', skills: SKILLS.filter(s => s.track === 'C').map(s => s.id) } };
  // Which rungs ask her to name her trick before typing (while the fact is still learning).
  EM.TRICK_SKILLS = { to10: ['count on', 'I just know'], near: ['double it', 'make 10', 'I just know'], bridge: ['make 10', 'double it', 'I just know'], sub10: ['think addition', 'count back', 'I just know'], subteen: ['back to 10', 'think addition', 'I just know'] };

  // ---------- fact items ----------
  const sayFact = f => ({ add: `${f.a} plus ${f.b}`, sub: `${f.a} minus ${f.b}`, m10: `${f.a} plus what makes 10?`, look: 'How many dots?' })[f.type];
  const labelFact = f => ({ add: `${f.a} + ${f.b}`, sub: `${f.a} − ${f.b}`, m10: `${f.a} + ? = 10`, look: `Quick Look: ${f.n} dots` })[f.type];
  const sentence = f => ({ add: `${f.a} + ${f.b} = ${f.ans}`, sub: `${f.a} − ${f.b} = ${f.ans}`, m10: `${f.a} + ${f.ans} = 10`, look: `${f.n} dots` })[f.type];
  const sentenceSay = f => ({ add: `${f.a} plus ${f.b} is ${f.ans}`, sub: `${f.a} minus ${f.b} is ${f.ans}`, m10: `${f.a} and ${f.ans} make 10`, look: `${f.n} dots` })[f.type];
  EM.labelFact = labelFact; EM.sentence = sentence; EM.sentenceSay = sentenceSay;

  // Two-stage help for a fact. Returns { vis, html, say } for stage 1 (question) or 2 (answer).
  function factHelp(f, stage) {
    const A = f.ans;
    const two = (vis, q, qSay, ans, ansSay) => stage === 1 ? { vis, html: q, say: qSay } : { vis, html: `${ans} Type <b>${A}</b>.`, say: `${ansSay} Type ${A}.` };
    if (f.type === 'look') {
      const n = f.n, pic = frames(fill(n, 'a'));
      const how = n <= 5 ? `${n}.` : n < 10 ? `A row of 5 and ${n - 5} more.` : n === 10 ? 'A full frame of 10.' : `A full ten and ${n - 10} more.`;
      if (stage === 1) return { vis: pic, flash: true, html: 'Look again. See the row of 5.', say: 'Look again. See the row of five.' };
      return { vis: pic, html: `${how} That's <b>${n}</b>. Type <b>${n}</b>.`, say: `${how} That's ${n}. Type ${n}.` };
    }
    if (f.type === 'm10') {
      const a = f.a, pic = frames([...fill(a, 'a'), ...fill(10 - a, 'e')]);
      if (a === 0) return two(pic, 'No dots. How many empty boxes?', 'No dots. How many empty boxes?', 'All 10 boxes are empty. 0 and 10 make 10.', 'All ten boxes are empty. Zero and ten make ten.');
      if (a === 10) return two(pic, 'The frame is full. How many empty boxes?', 'The frame is full. How many empty boxes?', 'No empty boxes. 10 and 0 make 10.', 'No empty boxes. Ten and zero make ten.');
      return two(pic + bond(10, a, stage === 1 ? '?' : A), `${a} dots. How many empty boxes?`, `${a} dots. How many empty boxes?`, `${A} empty boxes. ${a} and ${A} make 10.`, `${A} empty boxes. ${a} and ${A} make ten.`);
    }
    if (f.type === 'add') {
      const { a, b } = f, big = Math.max(a, b), small = Math.min(a, b), seq = [...fill(big, 'a'), ...fill(small, 'b')];
      const bd = bond(stage === 1 ? '?' : A, a, b);
      if (small === 0) return two(frames(seq) + bd, `${big} and 0 more. How many?`, `${big} and zero more. How many?`, `Adding 0 changes nothing. It's ${A}.`, `Adding zero changes nothing. It's ${A}.`);
      if (big === 10) return two(frames(seq) + bd, `A full ten and ${small} more. How many?`, `A full ten and ${small} more. How many?`, `10 and ${small} make ${A}.`, `Ten and ${small} make ${A}.`);
      if (a === b) return two(twoFrames([a, 'a'], fill(a, 'b')) + bd, `Double ${a}. Count both frames.`, `Double ${a}. Count both frames.`, `${a} and ${a} make ${A}.`, `${a} and ${a} make ${A}.`);
      if (small <= 2) return two(frames(seq) + bd, `Start at ${big}. Count on ${small}.`, `Start at ${big}. Count on ${small}.`, `${big}, ${range(1, small).map(i => big + i).join(', ')}. That's ${A}.`, `${big}, ${range(1, small).map(i => big + i).join(', ')}. That's ${A}.`);
      if (big - small === 1) return two(twoFrames([small, 'a'], [...fill(small, 'a'), 'b']) + bd, `Double ${small} is ${small * 2}. And 1 more?`, `Double ${small} is ${small * 2}. And one more?`, `${small * 2} and 1 more is ${A}.`, `${small * 2} and one more is ${A}.`);
      if (A === 10) return two(frames(seq) + bd, `${a} and ${b}. Fill the frame. How many?`, `${a} and ${b}. Fill the frame. How many?`, `${a} and ${b} make 10. They're partners.`, `${a} and ${b} make ten. They're partners.`);
      if (A > 10) { const need = 10 - big, rest = small - need; const cells = [...fill(big, 'a'), ...fill(need, 'c'), ...fill(rest, 'b')]; return two(frames(cells) + bond(small, need, rest), `${big} and ${need} make 10. Then ${rest} more. How many?`, `${big} and ${need} make ten. Then ${rest} more. How many?`, `10 and ${rest} is ${A}.`, `Ten and ${rest} is ${A}.`); }
      return two(frames(seq) + bd, `${big} and ${small} more. How many?`, `${big} and ${small} more. How many?`, `${big} and ${small} make ${A}.${A > 5 ? ` A row of 5 and ${A - 5}.` : ''}`, `${big} and ${small} make ${A}.`);
    }
    // subtraction
    const { a, b } = f, cells = fill(a, 'a');
    for (let i = 0; i < b; i++) cells[a - 1 - i] = 'x';
    const pic = frames(cells);
    if (a <= 10) return two(pic + bond(a, b, stage === 1 ? '?' : A), `What goes with ${b} to make ${a}?`, `What goes with ${b} to make ${a}?`, `${b} and ${A} make ${a}. So ${a} take away ${b} is ${A}.`, `${b} and ${A} make ${a}. So ${a} take away ${b} is ${A}.`);
    const ones = a - 10;
    if (b <= 2) { const back = range(1, b).map(i => a - i).join(', '); return two(pic + bond(a, b, stage === 1 ? '?' : A), `Start at ${a}. Count back ${b}.`, `Start at ${a}. Count back ${b}.`, `${a}, ${back}. That's ${A}.`, `${a}, ${back}. That's ${A}.`); }
    if (b === 10) return two(pic + bond(a, 10, stage === 1 ? '?' : ones), a === 20 ? '20 is two tens. Take one ten away.' : `${a} is 1 ten and ${ones}. Take the ten away.`, a === 20 ? 'Twenty is two tens. Take one ten away.' : `${a} is one ten and ${ones}. Take the ten away.`, `${A} is left.`, `${A} is left.`);
    if (b === ones) return two(pic + bond(a, 10, b), `${a} is 10 and ${ones}. Take the ${ones} away.`, `${a} is ten and ${ones}. Take the ${ones} away.`, `Just the ten is left: 10.`, `Just the ten is left. Ten.`);
    // Numbers close together (13 − 9, 12 − 8): think addition up through 10 instead of back through 10.
    if (A <= 4) { const up = frames([...fill(b, 'a'), ...fill(A, 'e')]); return two(up + bond(a, b, stage === 1 ? '?' : A), `${b} and ${10 - b} make 10, then ${ones} more. ${b} and what make ${a}?`, `${b} and ${10 - b} make ten, then ${ones} more. ${b} and what make ${a}?`, `${b} and ${A} make ${a}. So ${a} take away ${b} is ${A}.`, `${b} and ${A} make ${a}. So ${a} take away ${b} is ${A}.`); }
    return two(pic + bond(b, ones, b - ones), `Take away ${ones} to get to 10. Then ${b - ones} more.`, `Take away ${ones} to get to ten. Then ${b - ones} more.`, `10 take away ${b - ones} is ${A}.`, `Ten take away ${b - ones} is ${A}.`);
  }

  function factItem(key, mode) {
    const f = FACTS[key];
    const slot = '<span class="slot">&nbsp;</span>';
    const eq = { add: `${f.a} + ${f.b} = ${slot}`, sub: `${f.a} − ${f.b} = ${slot}`, m10: `${f.a} + ${slot} = 10` }[f.type];
    const step = { ans: f.ans, html: f.type === 'look' ? `<div class="ask">How many dots?</div><div class="eq">${slot}</div>` : `<div class="eq">${eq}</div>`, say: sayFact(f), vis: f.type === 'look' ? frames(fill(f.n, 'a')) : '' };
    return { key, skillId: null, kind: 'fact', type: f.type, f, mode, steps: [step], help: (i, stage) => factHelp(f, stage), label: labelFact(f) };
  }
  EM.factItem = factItem;

  // ---------- Track B generators ----------
  const slotN = '<span class="slot wide">&nbsp;</span>';
  const placeName = to => ({ 10: 'ten', 100: 'hundred', 1000: 'thousand' })[to];
  const placeWord = to => ({ 10: 'tens', 100: 'hundreds', 1000: 'thousands' })[to];
  function withZero(d) { // 3- or 4-digit numbers that sometimes carry an internal zero
    const n = d === 3 ? rint(100, 999) : rint(1000, 9999);
    if (Math.random() < 0.35) { const s = String(n).split(''); s[rint(1, d - 2)] = '0'; return Number(s.join('')); }
    return n;
  }
  function expand(n) { // "3 thousands, 4 hundreds, 0 tens, 7 ones"
    const parts = [];
    const places = n >= 1000 ? PLACES : PLACES.slice(1);
    for (const [lab, v] of places) { const d = Math.floor(n / v) % 10; parts.push(`${d} ${({ Th: 'thousand', H: 'hundred', T: 'ten', O: 'one' })[lab]}${d === 1 ? '' : 's'}`); }
    return parts.join(', ');
  }

  function genPvBuild(level) {
    const n = withZero(level === 0 ? 3 : 4);
    return { type: 'pv', steps: [{ ans: n, html: `<div class="ask">What number is this?</div><div class="eq">${slotN}</div>`, say: 'What number do the discs show?', vis: discs(n, { four: n >= 1000 }) }],
      help: (i, stage) => stage === 1 ? { vis: discs(n, { four: n >= 1000, counts: true }), html: `Read each place: ${expand(n)}.`, say: `Read each place. ${expand(n)}.` } : { vis: discs(n, { four: n >= 1000, counts: true }), html: `${expand(n)} is <b>${fmt(n)}</b>. Type <b>${fmt(n)}</b>.`, say: `That's ${fmt(n)}. Type ${fmt(n)}.` }, label: `Read ${fmt(n)}` };
  }
  function genPvCount(level) {
    const by = level === 0 ? pick([10, 100]) : pick([10, 100, 1000]);
    const max = level === 0 ? 999 : 9999;
    let start;
    do { start = rint(level === 0 ? 100 : 1000, max - 3 * by); } while (level === 1 && Math.random() < 0.5 && Math.floor((start + by) / 1000) === Math.floor((start + 3 * by) / 1000));
    const seq = [start, start + by, start + 2 * by], ans = start + 3 * by;
    const vis = discs(seq[2], { four: ans >= 1000 });
    return { type: 'pv', steps: [{ ans, html: `<div class="ask">Count on by ${fmt(by)}.</div><div class="eq seq">${seq.map(fmt).join(', ')}, ${slotN}</div>`, say: `Count on by ${fmt(by)}. ${seq.map(fmt).join(', ')}, and then?`, vis: '' }],
      help: (i, stage) => {
        const d = Math.floor(seq[2] / by) % 10, crosses = Math.floor(ans / (by * 10)) !== Math.floor(seq[2] / (by * 10));
        const line = crosses ? `${d} ${placeWord(by)} and 1 more makes 10 ${placeWord(by)}. That's a new ${placeName(by * 10)}.` : `Add one more ${placeName(by)}.`;
        return stage === 1 ? { vis, html: `${fmt(seq[2])} has ${d} ${placeWord(by)}. ${line} What comes next?`, say: `${fmt(seq[2])} has ${d} ${placeWord(by)}. ${line} What comes next?` } : { vis: discs(ans, { four: ans >= 1000 }), html: `${fmt(seq[2])} and ${fmt(by)} more is <b>${fmt(ans)}</b>. Type <b>${fmt(ans)}</b>.`, say: `${fmt(seq[2])} and ${fmt(by)} more is ${fmt(ans)}. Type ${fmt(ans)}.` };
      }, label: `Count on by ${fmt(by)} from ${fmt(start)}` };
  }
  function genCompare(level) {
    // Three numbers, two typed answers (biggest, then smallest): copying at random is a 1-in-6 shot, not a coin flip.
    const d = level === 0 ? 3 : 4;
    const near = a => { if (Math.random() < 0.5) { const sd = String(a).split(''); shuffle(sd); const b = Number(sd.join('')); if (b !== a && String(b).length === d) return b; } const b = a + pick([-1, 1]) * pick([1, 10, 100, 1000].slice(0, d - 1)) * rint(1, 3); return b >= 10 ** (d - 1) && b <= 10 ** d - 1 && b !== a ? b : null; };
    const a = withZero(d); let b = near(a), c = near(a), tries = 0;
    while ((b === null || c === null || b === c || b === a || c === a) && tries++ < 20) { if (b === null || b === a) b = near(a); if (c === null || c === a || c === b) c = near(a) || withZero(d); }
    if (b === null || b === a) b = a + 1; if (c === null || c === a || c === b) c = a - 1;
    const nums = shuffle([a, b, c]), big = Math.max(a, b, c), small = Math.min(a, b, c);
    const vis = discsTrio(nums);
    const place = (x, y) => { const sx = String(x).padStart(d, '0'), sy = String(y).padStart(d, '0'); let i = 0; while (i < d && sx[i] === sy[i]) i++; return ['thousands', 'hundreds', 'tens', 'ones'].slice(4 - d)[Math.min(i, d - 1)]; };
    const line = `<div class="eq cmp">${nums.map(fmt).join(' <span class="or">or</span> ')}</div>`;
    return { type: 'pv', steps: [
        { ans: big, html: `<div class="ask">Which is the biggest? Type it.</div>${line}<div class="eq">${slotN}</div>`, say: `Which is the biggest? ${nums.map(fmt).join(', or ')}? Type the biggest one.`, vis: '' },
        { ans: small, html: `<div class="ask">And which is the smallest?</div>${line}<div class="eq">${slotN}</div>`, say: `And which is the smallest?`, vis: '' },
      ],
      help: (k, stage) => {
        const target = k === 0 ? big : small, word = k === 0 ? 'biggest' : 'smallest';
        const others = nums.filter(n => n !== target), p = place(target, others[0]);
        return stage === 1 ? { vis, html: `Start with the biggest place. Compare the <b>${p}</b>. Which has the ${k === 0 ? 'most' : 'fewest'}?`, say: `Start with the biggest place. Compare the ${p}. Which has the ${k === 0 ? 'most' : 'fewest'}?` }
          : { vis, html: `<b>${fmt(target)}</b> is the ${word}. Type <b>${fmt(target)}</b>.`, say: `${fmt(target)} is the ${word}. Type ${fmt(target)}.` };
      }, label: `Compare ${nums.map(fmt).join(', ')}` };
  }
  function genNeighbors(level) {
    const to = level === 0 ? 10 : level === 1 ? 100 : pick([10, 100, 1000]);
    const digits = level === 0 ? pick([2, 3]) : level === 1 ? 3 : 4;
    let n; do { n = rint(10 ** (digits - 1), 10 ** digits - 1); } while (n % to === 0);
    const lo = Math.floor(n / to) * to, hi = lo + to;
    const stepsSay = range(-2, 1).map(i => lo + i * to).filter(v => v >= 0).map(fmt).join(', ');
    return { type: 'pv', tierVis: tier => tier === 0 ? numberLine(n, to, { dot: true }) : '', scaffTier: 0,
      steps: [
        { ans: lo, html: `<div class="ask">${fmt(n)} is between which two ${placeWord(to)}?</div><div class="eq small">smaller: ${slotN}</div>`, say: `${fmt(n)} is between which two ${placeWord(to)}? Type the smaller one first.`, vis: '' },
        { ans: hi, html: `<div class="ask">${fmt(n)} is between <b>${fmt(lo)}</b> and…</div><div class="eq small">bigger: ${slotN}</div>`, say: `And the bigger one?`, vis: '' },
      ],
      help: (i, stage) => stage === 1 ? { vis: numberLine(n, to, { dot: true, labels: false }), html: `Count by ${placeWord(to)}: ${stepsSay}. Which two does ${fmt(n)} come between?`, say: `Count by ${placeWord(to)}. ${stepsSay}. Which two does ${fmt(n)} come between?` }
        : { vis: numberLine(n, to, { dot: true }), html: `${fmt(n)} comes after <b>${fmt(lo)}</b> and before <b>${fmt(hi)}</b>. Type <b>${fmt(i === 0 ? lo : hi)}</b>.`, say: `${fmt(n)} comes after ${fmt(lo)} and before ${fmt(hi)}. Type ${fmt(i === 0 ? lo : hi)}.` },
      label: `Neighbors of ${fmt(n)} (${placeWord(to)})` };
  }
  // Rounding items are generated from ranges with forced hard cases.
  function roundN(n, to) { return Math.floor((n + to / 2) / to) * to; }
  function genRound(skillId, level) {
    let to, digits;
    if (skillId === 'r10') { to = 10; digits = level + 2; }
    else if (skillId === 'r100') { to = 100; digits = level + 3; }
    else if (skillId === 'r1000') { to = 1000; digits = 4; }
    else { to = pick([10, 100, 1000]); digits = 4; }
    const lo = 10 ** (digits - 1), hi = 10 ** digits - 1;
    let n;
    const r = Math.random();
    if (r < 0.12) { n = (Math.floor(rint(lo, hi) / to) * to) + to / 2; }                                  // halfway
    else if (r < 0.3) { const base = Math.floor(rint(lo, hi) / (to * 10)) * (to * 10) + to * 10; n = base - rint(1, to / 2 - 1); if (n > hi) n = hi - rint(1, to / 2 - 1); } // rolls over the next place
    else if (r < 0.5) { const base = Math.floor(rint(lo, hi) / to) * to; n = base + (to / 10) * pick([4, 5]) + rint(0, to / 10 - 1); } // digit 4 vs 5
    else n = rint(lo, hi);
    if (n % to === 0) n += rint(1, to - 1);
    if (n > hi) n -= to;
    if (n < lo) n += to;
    const ans = roundN(n, to), L = Math.floor(n / to) * to, H = L + to, d1 = n - L, d2 = H - n;
    const digitBelow = Math.floor(n / (to / 10)) % 10;
    const rule = skillId === 'digit';
    const whyHtml = d1 === d2 ? `${fmt(n)} is exactly halfway. Halfway rounds <b>up</b> to <b>${fmt(ans)}</b>.` : `${fmt(n)} is ${d1} from ${fmt(L)} and ${d2} from ${fmt(H)}. Nearer to <b>${fmt(ans)}</b>.`;
    const whySay = d1 === d2 ? `${fmt(n)} is exactly halfway. Halfway rounds up to ${fmt(ans)}.` : `${fmt(n)} is ${d1} from ${fmt(L)} and ${d2} from ${fmt(H)}. Nearer to ${fmt(ans)}.`;
    const ruleHtml = rule ? `<br><small>Shortcut: the digit to the right of the ${placeWord(to)} is ${digitBelow}. ${digitBelow >= 5 ? '5 or more goes up.' : '4 or less stays down.'}</small>` : '';
    const ruleSay = rule ? ` Shortcut. The digit to the right is ${digitBelow}. ${digitBelow >= 5 ? 'Five or more goes up.' : 'Four or less stays down.'}` : '';
    return { type: 'rnd', n, to, scaffTier: 0,
      tierVis: tier => rule ? '' : tier === 0 ? numberLine(n, to, { dot: true }) : tier === 1 ? numberLine(n, to, { dot: false }) : '',
      steps: [{ ans, html: `<div class="ask">Round <b>${fmt(n)}</b> to the nearest ${placeName(to)}.</div><div class="eq">${slotN}</div>`, say: `Round ${fmt(n)} to the nearest ${placeName(to)}.`, vis: '' }],
      help: (i, stage, typed) => {
        const vis = numberLine(n, to, { dot: true, distances: true });
        if (stage === 1) {
          let lead = `Which ${placeName(to)} is nearer?`, leadSay = lead;
          if (typed !== undefined && typed !== null && typed !== '') {
            const t = Number(typed);
            if (t === n) { lead = `That's the number itself. Which ${placeName(to)} is it near?`; leadSay = lead; }
            else if (t === L || t === H) { lead = `${fmt(n)} is ${d1} from ${fmt(L)} and ${d2} from ${fmt(H)}. Which is nearer?`; leadSay = lead; }
            else if (to > 10 && t === roundN(n, to / 10)) { lead = `${fmt(t)} is the nearest ${placeName(to / 10)}. We want the nearest ${placeName(to)}: ${fmt(L)} or ${fmt(H)}?`; leadSay = lead; }
            else if (t % to === 0) { lead = `${fmt(n)} sits between ${fmt(L)} and ${fmt(H)}. Those are its neighbors. Which is nearer?`; leadSay = lead; }
          }
          return { vis, html: lead, say: leadSay };
        }
        return { vis, html: `${whyHtml}${ruleHtml} Type <b>${fmt(ans)}</b>.`, say: `${whySay}${ruleSay} Type ${fmt(ans)}.` };
      }, label: `Round ${fmt(n)} to nearest ${placeName(to)}` };
  }

  // ---------- Track C: estimation ----------
  function nearRound(n, to) { const r = n % to; return r <= 5 || r >= to - 5; }
  function genEst(level, altSam) {
    const to = level === 2 ? 1000 : 100, op = level === 1 ? '−' : level === 0 ? '+' : pick(['+', '−']);
    const lo = to === 100 ? 100 : 1000, hi = to === 100 ? 999 : 9999;
    let a, b, tries = 0;
    do {
      a = rint(lo, hi); b = rint(lo, hi); tries++;
      if (Math.random() < 0.12) a = Math.floor(a / to) * to + to / 2;
      if (op === '−' && b > a) [a, b] = [b, a];
    } while (tries < 50 && (nearRound(a, to) && a % to !== to / 2 || nearRound(b, to) && b % to !== to / 2 || (op === '+' && to === 100 && roundN(a, to) + roundN(b, to) > 1000 && level === 0) || (op === '−' && (roundN(a, to) === roundN(b, to) || a - b < 2 * to))));
    const ra = roundN(a, to), rb = roundN(b, to), estv = op === '+' ? ra + rb : ra - rb, exact = op === '+' ? a + b : a - b;
    const opSay = op === '+' ? 'plus' : 'minus', place = placeName(to);
    // Sam's claimed answer: a plausible wrong answer at least one rounding unit off, or the right one.
    const samRight = Math.random() < 0.5;
    // Sam's wrong answers are off by several rounding units so the estimate can catch them; a right answer rounds within one unit of the estimate.
    let samVal = samRight ? exact : exact + (op === '+' ? -1 : 1) * to * rint(3, 5);
    if (!samRight && samVal < 2 * to) samVal = exact + to * rint(3, 5);
    const rsam = roundN(samVal, to), samOk = Math.abs(rsam - estv) <= to;
    const strip = (done) => `<div class="strip">${fmt(a)} → <b>${done > 0 ? fmt(ra) : '__'}</b> &nbsp; ${fmt(b)} → <b>${done > 1 ? fmt(rb) : '__'}</b> &nbsp; ${done > 0 ? fmt(ra) : '__'} ${op} ${done > 1 ? fmt(rb) : '__'} ≈ <b>${done > 2 ? fmt(estv) : '__'}</b></div>`;
    const rndStep = (n, idx) => ({ ans: roundN(n, to), html: `${strip(idx)}<div class="ask">${fmt(n)} rounds to the nearest ${place}:</div><div class="eq">${slotN}</div>`, say: idx === 0 ? `About how much is ${fmt(a)} ${opSay} ${fmt(b)}? First, round ${fmt(a)} to the nearest ${place}.` : `Now round ${fmt(b)} to the nearest ${place}.`, vis: '', rnd: n });
    const steps = [rndStep(a, 0), rndStep(b, 1),
      { ans: estv, html: `${strip(2)}<div class="ask">Now ${op === '+' ? 'add' : 'subtract'} your rounded numbers.</div><div class="eq">${fmt(ra)} ${op} ${fmt(rb)} = ${slotN}</div>`, say: `Now ${op === '+' ? 'add' : 'subtract'} your rounded numbers. ${fmt(ra)} ${opSay} ${fmt(rb)} is about?`, vis: '' }];
    if (altSam) steps.push({ ans: rsam, sam: true, html: `${strip(3)}<div class="ask">Sam says ${fmt(a)} ${op} ${fmt(b)} = <b>${fmt(samVal)}</b>.<br>Round Sam's answer to the nearest ${place}:</div><div class="eq">${slotN}</div>`, say: `Sam says ${fmt(a)} ${opSay} ${fmt(b)} equals ${fmt(samVal)}. Round Sam's answer to the nearest ${place}.`, vis: '' });
    const doneHtml = altSam
      ? (samOk ? `Your estimate ${fmt(estv)} and Sam's ${fmt(rsam)} are close. Sam's answer makes sense. The exact answer is ${fmt(exact)}.` : `${fmt(estv)} and ${fmt(rsam)}? No. Sam's answer is probably wrong. Your estimate caught it! The exact answer is ${fmt(exact)}.`)
      : `${fmt(a)} ${op} ${fmt(b)} is about <b>${fmt(estv)}</b>. The exact answer is ${fmt(exact)}. Close!`;
    return { type: 'est', scaffTier: 0, samCaught: altSam && !samOk, steps, strip,
      tierVis: () => '',
      stepVis: (i, tier) => (i < 2 || steps[i].sam) && tier === 0 ? numberLine(steps[i].rnd || samVal, to, { dot: true }) : '',
      done: { html: doneHtml, say: doneHtml.replace(/<[^>]+>/g, '') },
      help: (i, stage, typed) => {
        const st = steps[i];
        if (i < 2 || st.sam) {
          const n = st.rnd || samVal, L = Math.floor(n / to) * to, H = L + to, d1 = n - L, d2 = H - n, vis = numberLine(n, to, { dot: true, distances: true });
          if (stage === 1) {
            const t = Number(typed);
            let q = `Which ${place} is nearer to ${fmt(n)}?`;
            if (t === n) q = `That's the number itself. Which ${place} is it near?`;
            else if (to > 10 && t === roundN(n, to / 10)) q = `${fmt(t)} is the nearest ${placeName(to / 10)}. We want the nearest ${place}: ${fmt(L)} or ${fmt(H)}?`;
            else if (t === L || t === H) q = `${fmt(n)} is ${d1} from ${fmt(L)} and ${d2} from ${fmt(H)}. Which is nearer?`;
            return { vis, html: q, say: q };
          }
          const w = d1 === d2 ? `Exactly halfway, so it goes up to ${fmt(st.ans)}.` : `${fmt(n)} is nearer to ${fmt(st.ans)}.`;
          return { vis, html: `${w} Type <b>${fmt(st.ans)}</b>.`, say: `${w} Type ${fmt(st.ans)}.` };
        }
        // combine step
        const ha = ra / to, hb = rb / to, unit = placeWord(to), vis = `<div class="flats">${fill(ha, 0).map(() => `<i class="flat a">${to}</i>`).join('')}<span class="opsign">${op}</span>${fill(hb, 0).map(() => `<i class="flat b">${to}</i>`).join('')}</div>`;
        const t = Number(typed);
        if (stage === 1) {
          let q = `${ha} ${unit} ${op === '+' ? 'and' : 'take away'} ${hb} ${unit} is how many ${unit}? Type it with its zeros, like ${fmt(ra)}.`;
          if (t === exact) q = `That's the exact answer, good adding! An estimate is quicker: ${fmt(ra)} ${op} ${fmt(rb)}?`;
          else if (t === (op === '+' ? ha + hb : ha - hb)) q = `${t} ${unit}. Each ${place} is ${fmt(to)}. So ${t} ${unit} is?`;
          else if (op === '+' && t === ra - rb) q = `Plus means put them together. ${ha} ${unit} and ${hb} ${unit}?`;
          return { vis, html: q, say: q };
        }
        return { vis, html: `${op === '+' ? ha + hb : ha - hb} ${unit} is <b>${fmt(estv)}</b>. Type <b>${fmt(estv)}</b>.`, say: `${op === '+' ? ha + hb : ha - hb} ${unit} is ${fmt(estv)}. Type ${fmt(estv)}.` };
      }, label: `Estimate ${fmt(a)} ${op} ${fmt(b)}` };
  }

  // ---------- Track C: column addition / subtraction with regrouping ----------
  function genRegroup(level, tier) {
    const hint = tier === 0; // regrouping decision shown for her only while the skill is new
    const opAdd = level % 2 === 0, d = level < 2 ? 3 : 4, lo = 10 ** (d - 1), hi = 10 ** d - 1;
    let a, b, tries = 0;
    do {
      a = rint(lo, hi); b = rint(lo, hi);
      if (!opAdd && b > a) [a, b] = [b, a];
      if (opAdd && a + b > hi) { a = rint(lo, Math.floor(hi / 2)); b = rint(lo, hi - a); }
      tries++;
    } while (tries < 50 && !needsRegroup(a, b, opAdd));
    const op = opAdd ? '+' : '−', total = opAdd ? a + b : a - b;
    const names = ['ones', 'tens', 'hundreds', 'thousands'];
    const da = String(a).padStart(4, '0').split('').reverse().map(Number), db = String(b).padStart(4, '0').split('').reverse().map(Number);
    const steps = [], filled = [], carries = {};
    let carry = 0, borrow = 0;
    const cols = d;
    for (let i = 0; i < cols; i++) {
      const x = da[i], y = db[i];
      if (opAdd) {
        const s = x + y + carry, isLast = i === cols - 1, ansCol = isLast ? s : s % 10, note = carry ? ` and the ${carry} we carried` : '';
        const snapshot = { filled: filled.slice(), carries: { ...carries } };
        steps.push({ ans: ansCol, col: i, html: `<div class="ask">${cap(names[i])}: ${x} + ${y}${carry ? ` + ${carry}` : ''} = ?${hint && !isLast && s >= 10 ? ' <small>Write the ones digit. The ten gets carried.</small>' : ''}</div><div class="eq">${slotN}</div>`,
          say: `${cap(names[i])}. ${x} plus ${y}${note}. ${hint && !isLast && s >= 10 ? 'Type just the ones digit. The ten carries over.' : ''}`,
          vis: () => column(a, b, op, snapshot.filled, snapshot.carries), full: s, carryOut: !isLast && s >= 10 ? 1 : 0, x, y, cin: carry });
        filled.push(ansCol); if (!isLast && s >= 10) carries[i + 1] = 1; carry = !isLast && s >= 10 ? 1 : 0;
      } else {
        let x2 = x - borrow; let note = '';
        const needB = x2 < y && i < cols - 1;
        const snapshot = { filled: filled.slice(), carries: { ...carries } };
        const unit = names[i].slice(0, -1), nextUnit = i < cols - 1 ? names[i + 1].slice(0, -1) : '';
        // A 0 that already lent a ten shows as 9 after regrouping (Dimensions: regroup across zero in two steps).
        const shown = x2 < 0 ? 9 : needB ? x2 + 10 : x2;
        const wasNote = borrow ? ` <small>(${x} before; 1 ${unit} went to the ${names[i - 1]})</small>` : '';
        if (needB) note = x2 < 0 ? `Regroup: 1 ${nextUnit} becomes 10 ${names[i]}. One already went to the ${names[i - 1]}, so 9 ${names[i]}. Now 9 take away ${y}.` : `Regroup: 1 ${nextUnit} becomes 10 ${names[i]}. Now ${x2 + 10} take away ${y}.`;
        const ansCol = needB ? x2 + 10 - y : x2 - y;
        steps.push({ ans: ansCol, col: i, html: `<div class="ask">${cap(names[i])}: ${Math.max(0, x2)}${hint ? wasNote : ''} − ${y}${hint && needB ? ` <small>Not enough. ${note}</small>` : ''}</div><div class="eq">${slotN}</div>`,
          say: `${cap(names[i])}. ${Math.max(0, x2)} take away ${y}. ${hint && needB ? note : ''}`, vis: () => column(a, b, op, snapshot.filled, snapshot.carries), x: x2, y, needB, shown });
        filled.push(ansCol); if (needB) { carries[i] = x2 + 10; borrow = 1; } else borrow = 0;
      }
    }
    steps.push({ ans: total, html: `<div class="ask">Read the answer: ${fmt(a)} ${op} ${fmt(b)} = ?</div><div class="eq">${slotN}</div>`, say: `Read the whole answer. ${fmt(a)} ${op === '+' ? 'plus' : 'minus'} ${fmt(b)} is?`, vis: () => column(a, b, op, filled, carries), final: true });
    return { type: 'regroup', scaffTier: 0, steps, tierVis: () => '',
      stepVis: (i) => steps[i].vis(),
      done: { html: `${fmt(a)} ${op} ${fmt(b)} = <b>${fmt(total)}</b>.`, say: `${fmt(a)} ${op === '+' ? 'plus' : 'minus'} ${fmt(b)} is ${fmt(total)}.` },
      help: (i, stage) => {
        const st = steps[i];
        if (st.final) return stage === 1 ? { vis: st.vis(), html: 'Read the digits from the left.', say: 'Read the digits from the left.' } : { vis: st.vis(), html: `It's <b>${fmt(total)}</b>. Type <b>${fmt(total)}</b>.`, say: `It's ${fmt(total)}. Type ${fmt(total)}.` };
        if (opAdd) {
          const cells = [...fill(st.x, 'a'), ...fill(st.y, 'b'), ...fill(st.cin, 'c')], vis = frames(cells);
          const s = st.full;
          if (stage === 1) return { vis, html: `${st.x} and ${st.y}${st.cin ? ' and 1' : ''}. How many? ${st.carryOut ? `That's more than 10, so write only the ones digit.` : ''}`, say: `${st.x} and ${st.y}${st.cin ? ' and one' : ''}. How many? ${st.carryOut ? 'That is more than ten, so type only the ones digit.' : ''}` };
          return { vis, html: `${st.x} + ${st.y}${st.cin ? ' + 1' : ''} = ${s}. ${st.carryOut ? `Write <b>${st.ans}</b>, carry the 1 ten.` : `Write <b>${st.ans}</b>.`} Type <b>${st.ans}</b>.`, say: `${s}. ${st.carryOut ? `Type ${st.ans} and carry the ten.` : `Type ${st.ans}.`}` };
        }
        const start = st.needB ? st.x + 10 : st.x, cells = fill(start, 'a'); for (let k = 0; k < st.y; k++) cells[start - 1 - k] = 'x';
        const vis = frames(cells);
        const reg = st.needB ? `Not enough ${names[st.col]} to take ${st.y} away, so regroup: 1 ${names[st.col + 1].slice(0, -1)} becomes 10 ${names[st.col]}. Now ${start} take away ${st.y}. ` : '';
        if (stage === 1) return { vis, html: `${reg}${start} take away ${st.y}. ${st.y} and what make ${start}?`, say: `${reg}${start} take away ${st.y}. ${st.y} and what make ${start}?` };
        return { vis, html: `${st.y} and ${st.ans} make ${start}. Write <b>${st.ans}</b>. Type <b>${st.ans}</b>.`, say: `${st.y} and ${st.ans} make ${start}. Type ${st.ans}.` };
      }, label: `${fmt(a)} ${op} ${fmt(b)} in columns` };
  }
  const cap = s => s[0].toUpperCase() + s.slice(1);
  function needsRegroup(a, b, opAdd) {
    const da = String(a).split('').reverse().map(Number), db = String(b).split('').reverse().map(Number);
    for (let i = 0; i < Math.min(da.length, db.length) - 1; i++) { if (opAdd ? da[i] + db[i] >= 10 : da[i] < db[i]) return true; }
    return false;
  }

  // ---------- procedure item factory ----------
  let estAlt = 0;
  function procItem(skillId, level, tier) {
    let g;
    if (skillId === 'pv_build') g = genPvBuild(level);
    else if (skillId === 'pv_count') g = genPvCount(level);
    else if (skillId === 'compare') g = genCompare(level);
    else if (skillId === 'neighbors') g = genNeighbors(level);
    else if (skillId === 'est') g = genEst(level, level >= 1 && (estAlt++ % 2 === 1));
    else if (skillId === 'regroup') g = genRegroup(level, tier);
    else g = genRound(skillId, level);
    // The teaching scaffold (dot already placed on the line) is shown only at tier 0; answers given with it never count toward fluency.
    const scaff = tier === 0 && ['neighbors', 'r10', 'r100', 'r1000', 'est'].includes(skillId);
    const item = { key: `${skillId}:${g.label}`, skillId, kind: 'proc', level, tier, scaff, ...g };
    // per-step visual: tier-dependent for single-step items; stepVis for multi-step
    item.visFor = i => item.stepVis ? item.stepVis(i, tier) : (item.steps[i].vis || (item.tierVis ? item.tierVis(tier) : ''));
    return item;
  }
  EM.procItem = procItem;

  // ---------- placement ----------
  function placementItems() {
    const items = [];
    const take = (arr, n) => shuffle(arr.slice()).slice(0, n);
    for (const id of ['look', 'm10', 'plus12', 'doubles', 'teens', 'to10', 'near', 'bridge', 'sub10', 'subteen']) take(EM.SK[id].facts, id === 'look' ? 3 : 4).forEach(k => items.push(factItem(k, 'probe')));
    const procs = [['pv_build', 0], ['pv_build', 1], ['pv_count', 0], ['pv_count', 1], ['compare', 1], ['neighbors', 0], ['neighbors', 1], ['r10', 0], ['r10', 1], ['r100', 0], ['r100', 1], ['r1000', 0]];
    procs.forEach(([id, lv]) => items.push(procItem(id, lv, 2)));
    return shuffle(items);
  }
  EM.placementItems = placementItems;
})();
