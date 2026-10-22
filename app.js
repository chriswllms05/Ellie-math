/* Ellie Math — screens and the session controller. */
'use strict';
(function () {
  const EM = window.EM;
  const { range, shuffle, pick, fmt, esc, dayStr, DAY } = EM;
  const S = EM.load();
  const NAME = () => S.name || 'friend';
  const T = () => EM.theme.current(), D = (mood, size, opts) => EM.theme.dot(mood, size, opts);
  EM.theme.apply();
  const $app = document.getElementById('app');
  let screen = 'home', R = null, overlayQueue = [];

  // ---------- navigation ----------
  function go(s) { screen = s; render(); window.scrollTo(0, 0); }
  function render() {
    const views = { avatar: () => { $app.innerHTML = EM.avatar.builder(!S.avatar); }, world: renderWorld, home: renderHome, skills: renderSkills, practice: renderPractice, summary: renderSummary, parent: () => EM.parent.render($app, { go, startSession }), break: renderBreak };
    (views[screen] || renderHome)();
  }
  EM.go = go; EM.render = render;

  // ---------- home ----------
  function todayDone() { const d = dayStr(Date.now()), need = S.settings.blockMin * S.settings.blocks / 2; return S.sessions.some(s => dayStr(s.date) === d && s.kind === 'daily' && (s.items >= 15 || (s.minutes || 0) >= need)); }
  const GROW = { garden: ['sprout', 'sprouts'], ocean: ['egg', 'eggs'], space: ['baby star', 'baby stars'], classroom: ['outline', 'outlines'] };
  const HI = () => T().id === 'classroom' ? 'Good morning' : 'Hi';
  // Her world, full width, with Dot and a speech bubble perched in the sky.
  function worldHTML(bubble, opts = {}) {
    const w = EM.world.render(opts);
    const me = S.avatar ? EM.avatar.draw(undefined, 50, opts.mood === 'cheer' ? 'cheer' : 'wave') : '';
    return `<div class="world${opts.inset ? ' inset' : ''}">${w.svg}${bubble ? `<div class="perch">${me}${D(opts.mood || 'calm', 60)}<div class="bubble">${bubble}</div></div>` : ''}</div>`;
  }
  function worldCounts() { const w = EM.world.render(); return { yours: w.yours, sprouts: w.sprouts }; }
  function surpriseHTML(known) {
    const t = T(), next = EM.world.nextMilestone(known);
    if (!next) return '';
    const prev = [...EM.world.MILESTONES[t.id]].reverse().find(m => m[0] <= known), from = prev ? prev[0] : 0, left = next[0] - known;
    return `<div class="surprise">🎁 ${left} more fact${left > 1 ? 's' : ''} until a surprise moves into your ${t.place}<span class="bar"><i style="width:${Math.round((known - from) / (next[0] - from) * 100)}%"></i></span></div>`;
  }
  // Her world: picked on first launch, changeable from home.
  function renderWorld() {
    const first = !S.theme;
    $app.innerHTML = `<main class="wrap">
      ${first ? '' : '<button class="back" data-act="home">‹ Back</button>'}
      <div class="home-top">${D('wow', 72)}<h1>${first ? `Hi, ${esc(NAME())}!` : 'Pick your world'}</h1></div>
      <div class="bubble">${first ? "I'm Dot. Before we start, pick your world. Every fact you really learn adds something to it." : 'You can change your world any time. Everything you earned comes with you.'}</div>
      ${EM.theme.picker(S.theme)}
    </main>`;
    EM.speech.say(first ? "Hi! I'm Dot. Pick your world." : 'Pick your world.');
  }
  function renderHome() {
    const known = EM.countYours(), name = esc(NAME()), t = T();
    if (!S.theme) return renderWorld();
    if (!S.avatar) { screen = 'avatar'; return render(); }
    if (!S.placement.done) {
      $app.innerHTML = `<main class="wrap home">
        ${worldHTML(t.id === 'classroom' ? `Welcome to class, ${name}! I'm your teacher, Dot. Today I just want to see what you already know, so I know what to teach.` : `Hi, ${name}! This is your ${t.place}. It's empty for now. Today let's find out what you already know and plant the first ${GROW[t.id][1]}.`, { mood: 'wow' })}
        <button class="big-btn" data-act="placement">Let's see what you know<span>About 10 minutes</span></button>
        <div class="card"><h2>Two rules</h2><ul>
          <li>🧠 Think first, then type. There's no rush.</li>
          <li>🙋 Not sure? Tap <b>I don't know</b>. That is the smart move here. Guessing teaches nothing.</li>
        </ul></div>
        ${S.settings.pin ? '' : '<div class="card" style="border:2px dashed var(--rule)"><b>Grown-ups:</b> before she starts, press and hold the button below, set your PIN and record a few voice clips.</div>'}
        <button class="grownup" data-hold="parent"><span class="fillbar"></span>Grown-ups: press and hold</button>
      </main>`;
      return;
    }
    const done = todayDone();
    const wc = worldCounts(), g = GROW[t.id];
    const hello = done ? `Look at your ${t.place}, ${name}! ${wc.yours} ${wc.yours === 1 ? t.one : t.many}${wc.sprouts ? ` and ${wc.sprouts} ${wc.sprouts === 1 ? g[0] : g[1]} growing` : ''}.`
      : wc.yours ? `${HI()}, ${name}! ${wc.yours} ${wc.yours === 1 ? t.one : t.many} ${t.id === 'classroom' ? 'earned' : 'so far'}.${wc.sprouts ? ` Your ${g[1]} are waiting. Know them fast and they'll turn into ${t.many}!` : ''}`
      : `${HI()}, ${name}! See your ${g[1]}? Know them fast on two different days and they turn into ${t.many}.`;
    $app.innerHTML = `<main class="wrap home">
      ${worldHTML(hello, { mood: done ? 'proud' : 'calm' })}
      <p class="tap-hint">Tap a ${({ garden: 'flower bed', ocean: 'coral reef', space: 'constellation', classroom: 'sticker chart' })[t.id]} to look closer</p>
      ${surpriseHTML(known)}
      <button class="big-btn" data-act="today">${done ? 'Practice again' : "Today's practice"}<span>${done ? "You already did today's. Extra is fine!" : `About ${S.settings.blockMin * S.settings.blocks} minutes, ${S.settings.blocks} short parts`}</span></button>
      ${done ? '<button class="btn secondary" data-act="evening" style="margin-bottom:12px">Evening review <span style="font-size:14px;color:var(--muted)">5 minutes, just the facts that are due</span></button>' : ''}
      <button class="btn secondary" data-act="skills">Pick a skill</button>
      <div class="card"><h2>How to play</h2><ul>
        <li>🧠 Think first, then type.</li>
        <li>🙋 Not sure? Tap <b>I don't know</b>. That's how you learn. No guessing!</li>
        <li>⚡ Know a fact fast on two different days and it's <b>yours</b>. ${({ garden: 'A flower grows.', ocean: 'A fish swims into your reef.', space: 'A star lights up.', classroom: 'You earn a sticker.' })[t.id]}</li>
      </ul></div>
      ${EM.teach.notebook().length ? `<button class="notebook" data-act="notebook">📓 Dot's notebook: <b>${EM.teach.notebook().length}</b> fact${EM.teach.notebook().length > 1 ? 's' : ''} you taught Dot</button>` : ''}
      <p style="text-align:center;margin:0"><button class="worldbtn" data-act="world">🎨 Change my world</button> &nbsp; <button class="worldbtn" data-act="avatar">🙂 Change me</button></p>
      <button class="grownup" data-hold="parent"><span class="fillbar"></span>Grown-ups: press and hold</button>
    </main>`;
  }
  function renderSkills() {
    const card = s => {
      const st = EM.skillSummary(s.id);
      return `<button class="skill" data-act="skill" data-id="${s.id}" ${st.open ? '' : 'disabled'}>
        <span class="ico">${st.open ? s.icon : '🔒'}</span>
        <span class="meta"><span class="name">${s.name}</span>${s.kind === 'proc' && st.open ? ` <span class="desc">· ${s.levels[st.level]}</span>` : ''}<br><span class="desc">${st.open ? s.desc : 'Opens when the skills before it are yours.'}</span>
        <span class="bar"><i class="f" style="width:${st.progress * 100}%"></i><i class="l" style="width:${(st.learningPct || 0) * 100}%"></i></span></span>
        ${st.done ? '<span class="done">⭐</span>' : ''}
      </button>`;
    };
    $app.innerHTML = `<main class="wrap">
      <button class="back" data-act="home">‹ Back</button>
      <h1>Pick a skill</h1>
      <p class="sub">Green is what you really know. Yellow is what you're learning.</p>
      <h2>Adding and taking away</h2>${EM.TRACKS.A.skills.map(id => card(EM.SK[id])).join('')}
      <h2 style="margin-top:24px">Big numbers and rounding</h2>${EM.TRACKS.B.skills.map(id => card(EM.SK[id])).join('')}
      <h2 style="margin-top:24px">School work</h2>${EM.TRACKS.C.skills.map(id => card(EM.SK[id])).join('')}
    </main>`;
  }

  // ---------- sessions ----------
  const openIds = track => EM.TRACKS[track].skills.filter(EM.isOpen);
  function factQueueItems(ids, len, opts) {
    const { queue, spare } = EM.buildFactQueue(ids, len, Date.now(), opts);
    return { items: queue.map(q => EM.factItem(q.key, q.mode)), spare };
  }
  function procQueueItems(ids, n) {
    return EM.pickProcSkills(ids, n).map(id => { const rec = EM.skillRec(id); return EM.procItem(id, rec.level, EM.procTier(id, rec.level)); });
  }
  function startSession(kind, opt = {}) {
    EM.speech.prime();
    let blocks = [];
    if (kind === 'placement') blocks = [{ name: 'Looking', cap: 10, build: () => ({ items: EM.placementItems(), spare: [] }) }];
    else if (kind === 'skill') { const sk = EM.SK[opt.id]; blocks = [{ name: sk.name, cap: 5, build: () => sk.kind === 'fact' ? factQueueItems([sk.id], 20) : { items: procQueueItems([sk.id], 12), spare: [] } }]; }
    else if (kind === 'evening') blocks = [{ name: 'Review', cap: 5, build: () => factQueueItems(openIds('A'), 20, { dueOnly: true }) }];
    else {
      const cap = S.settings.blockMin;
      blocks = [{ name: 'Foundations', cap, build: () => factQueueItems(openIds('A'), 40) }];
      if (S.settings.blocks >= 2) blocks.push({ name: 'Big numbers', cap, build: () => ({ items: procQueueItems(openIds('B'), 12), spare: [] }) });
      blocks.push({ name: 'Teach Dot', cap: 4, build: () => ({ items: EM.teach.items(3), spare: [] }) });
      if (S.settings.blocks >= 3) blocks.splice(blocks.length - 1, 0, { name: 'School work', cap, build: () => { const ids = openIds('C'); return { items: ids.length ? procQueueItems(ids, 8) : procQueueItems(openIds('B'), 10), spare: [] }; } });
    }
    R = { kind, title: kind === 'placement' ? 'Placement' : kind === 'skill' ? EM.SK[opt.id].name : kind === 'evening' ? 'Evening review' : "Today's practice", blocks, bi: -1, started: Date.now(),
      stats: { fast: 0, slow: 0, wrong: 0, idk: 0, rushed: 0, relooks: 0, items: 0, times: [], learned: [], fastKeys: [], tricks: {}, how: { knew: 0, trick: 0, counted: 0 },
        byKind: { fact: { fast: 0, slow: 0, wrong: 0, idk: 0 }, proc: { fast: 0, slow: 0, wrong: 0, idk: 0 } }, est: { round: { ok: 0, n: 0 }, combine: { ok: 0, n: 0 }, sam: { ok: 0, n: 0 } }, taught: { n: 0, ok: 0, caught: 0, dotWrong: 0 } }, missed: {}, yoursNow: [], yoursKeys: [], planted: 0, plantedKeys: [], howCount: 0, clipPlays: 0, knownBefore: EM.countYours() };
    screen = 'practice';
    nextBlock();
  }
  function nextBlock() {
    R.bi++;
    if (R.bi >= R.blocks.length) return finishSession();
    const b = R.blocks[R.bi];
    const built = b.build();
    R.queue = built.items; R.spare = built.spare || []; R.idx = 0; R.reasks = {}; R.planned = R.queue.length; R.blockStart = Date.now(); R.failedProbes = 0;
    if (!R.queue.length) { if (R.bi + 1 < R.blocks.length) return nextBlock(); return finishSession(); }
    beginItem();
  }
  function blockTimeUp() { return (Date.now() - R.blockStart) / 60000 >= R.blocks[R.bi].cap; }
  function endOfBlock() {
    if (R.bi + 1 >= R.blocks.length) return finishSession();
    screen = 'break'; render();
    R.breakT = setTimeout(() => { if (screen === 'break') { screen = 'practice'; nextBlock(); } }, 25000);
  }
  function renderBreak() {
    const done = R.bi + 1, total = R.blocks.length;
    $app.innerHTML = `<main class="wrap break">
      <div class="break-scene">${D('cheer', 96)}<span class="art">${T().breakArt}</span></div>
      <h1>${T().breakTitle ? `${T().breakTitle} ` : ''}Part ${done} of ${total} done!</h1>
      <p class="sub">Shake out your hands. Take a breath. Next up: <b>${esc(R.blocks[R.bi + 1].name)}</b>.</p>
      <button class="big-btn" data-act="nextblock">I'm ready</button>
    </main>`;
    EM.speech.say(`Part ${done} done! Shake out your hands. Next up, ${R.blocks[R.bi + 1].name}.`);
  }

  // ---------- items ----------
  // All item/step transitions go through here so a quit or a new session cancels pending timers.
  const CONFIRM_MS = 2000;
  function later(fn, ms) { const run = R; clearTimeout(R.nextT); R.nextT = setTimeout(() => { if (run === R && !run.ended) fn(); }, ms); }
  const curStep = () => R.cur.steps[R.step];
  const digitsAllowed = () => Math.max(1, String(curStep().ans).length);
  function needsTrick(item) { if (item.kind !== 'fact' || item.mode === 'probe' || item.mode === 'reask' || R.kind === 'placement') return false; const r = S.facts[item.key]; if (r && r.box >= EM.FLUENT_BOX) return false; return !!skillOfFact(item.key, true); }
  function skillOfFact(key, trickOnly) { for (const id of Object.keys(EM.TRICK_SKILLS)) if (EM.SK[id].facts.includes(key)) return id; if (trickOnly) return null; return EM.SKILLS.find(s => s.kind === 'fact' && s.facts.includes(key)).id; }

  function beginItem() {
    clearTimeout(R.flashT); clearTimeout(R.speechT);
    if (R.idx >= R.queue.length || (R.idx > 0 && blockTimeUp())) return endOfBlock();
    const it = R.queue[R.idx];
    R.cur = it; R.step = 0; R.phase = 'ask'; R.helpStage = 0; R.helpTries = 0; R.input = ''; R.lock = false; R.msg = null; R.trick = null; R.stepRes = []; R.relooked = false;
    R.waitReady = it.type === 'look'; R.mood = 'think';
    R.waitTrick = needsTrick(it);
    R.waitSpeech = false;
    render();
    startStepClock();
  }
  // Starts the clock for the current step, after speech if the prompt is spoken.
  function startStepClock() {
    clearTimeout(R.speechT);
    const st = curStep();
    R.t0 = null; R.tLast = null;
    const spoken = (R.cur.kind === 'proc' || R.cur.kind === 'teach') && st.say && EM.speech.enabled();
    if (R.waitReady) return; // look items: clock starts on "Ready"
    if (spoken) {
      const run = R, item = R.cur, step = R.step;
      R.waitSpeech = true; setPadHidden(true);
      const release = () => { if (run === R && !run.ended && R.cur === item && R.step === step && R.waitSpeech) { R.waitSpeech = false; setPadHidden(false); R.t0 = performance.now(); } };
      EM.speech.say(st.say).then(release);
      R.speechT = setTimeout(release, EM.speech.estimateMs(st.say) + 300);
    } else {
      R.t0 = performance.now();
    }
  }
  function setPadHidden(h) { const p = document.querySelector('.pad'), i = document.querySelector('.idk'); if (p) p.classList.toggle('hidden', h); if (i) i.classList.toggle('hidden', h); }
  function readyTap() {
    if (!R || !R.waitReady) return;
    R.waitReady = false;
    const f = R.cur.f, v = document.querySelector('.visual');
    if (v) v.innerHTML = EM.pics.frames(Array(f.n).fill('a'));
    setPadHidden(false);
    R.t0 = performance.now();
    R.flashT = setTimeout(() => { const v2 = document.querySelector('.visual'); if (v2 && R.phase === 'ask') v2.innerHTML = `<div class="cover">How many did you see?${R.relooked ? '' : ' <button class="lookagain" data-act="relook">Look again</button>'}</div>`; }, f.n > 10 ? 2200 : 1600);
  }
  function relook() {
    if (!R || R.relooked) return;
    R.relooked = true; R.stats.relooks++;
    const f = R.cur.f, v = document.querySelector('.visual');
    if (v) v.innerHTML = EM.pics.frames(Array(f.n).fill('a'));
    R.flashT = setTimeout(() => { const v2 = document.querySelector('.visual'); if (v2 && R.phase === 'ask') v2.innerHTML = '<div class="cover">How many did you see?</div>'; }, f.n > 10 ? 2200 : 1600);
  }
  function trickTap(name) {
    if (!R || !R.waitTrick) return;
    R.waitTrick = false; R.trick = name;
    R.stats.tricks[name] = (R.stats.tricks[name] || 0) + 1;
    const t = document.querySelector('.tricks'); if (t) t.remove();
    setPadHidden(false);
    R.t0 = performance.now();
  }

  function typeDigit(d) {
    if (!R || R.lock || R.waitReady || R.waitTrick || R.waitSpeech) return;
    if (R.input.length >= digitsAllowed()) return;
    R.input = R.input === '0' ? d : R.input + d;
    R.tLast = performance.now();
    updateSlot();
  }
  function backspace() { if (!R || R.lock) return; R.input = R.input.slice(0, -1); R.tLast = R.input ? performance.now() : null; updateSlot(); }
  function updateSlot() { const s = document.querySelector('.slot'); if (s) s.innerHTML = R.input ? fmt(Number(R.input)) : '&nbsp;'; }
  function showMsg(kind, html) { R.msg = { kind, html }; const m = document.querySelector('.msg'); if (m) { m.className = `msg ${kind}`; m.innerHTML = html; } }
  // Dot reacts to what just happened; only the face changes, the question stays still.
  function mood(m) { R.mood = m; const el = document.querySelector('.topbar .dotpal'); if (el) el.outerHTML = D(m, 44); }
  function setVisual(html) { const v = document.querySelector('.visual'); if (v) v.innerHTML = html || ''; }

  function submit() {
    if (!R || R.lock || !R.input || R.waitReady || R.waitTrick || R.waitSpeech) return;
    clearTimeout(R.flashT);
    const st = curStep(), typed = Number(R.input), ok = typed === st.ans;
    if (R.phase === 'help') return helpSubmit(ok);
    const now = performance.now();
    const ms = (R.tLast || now) - (R.t0 || now);
    const gap = now - (R.tLast || now); // time spent looking at the typed answer before ✓ (finger-checking a guess)
    const fast = ms <= EM.fastMs(R.cur, R.step) && gap <= CONFIRM_MS;
    if (ok) {
      R.stepRes.push({ ok: true, fast, ms, firstTry: true });
      if (R.step + 1 < R.cur.steps.length) { mood(fast ? 'happy' : 'proud'); return nextStep(fast ? pick(['⚡ Yes!', '⚡ Quick!']) : '✓ Right!'); }
      return completeItem();
    }
    const rushed = ms < EM.rushMs(R.cur);
    if (rushed) R.stats.rushed++;
    R.stepRes.push({ ok: false, fast: false, ms, firstTry: false, typed });
    if (R.kind === 'placement') return placementMiss();
    const copiedDot = R.cur.kind === 'teach' && R.cur.dotWrong && typed === R.cur.dotAns;
    enterHelp(copiedDot ? "That's what Dot said. Let's check Dot's work together." : rushed ? 'Whoa, that was super fast! Slow down and think.' : pick(['Not quite.', 'Not yet.', 'Hmm, not that one.']), typed);
  }
  function idk() {
    if (!R || R.lock || R.phase !== 'ask' || R.waitReady || R.waitTrick || R.waitSpeech) return;
    clearTimeout(R.flashT);
    R.stepRes.push({ ok: false, fast: false, ms: 0, firstTry: false, idk: true });
    if (R.kind === 'placement') return placementMiss(true);
    enterHelp(pick(['Thanks for being honest!', 'Good call asking.', 'Smart. Let\'s figure it out.']));
  }
  function placementMiss(wasIdk) {
    R.lock = true;
    showMsg('soft', wasIdk ? 'Okay! We\'ll learn that one together.' : 'Okay! We\'ll learn that one.');
    later(completeItem, 900);
  }
  function nextStep(msg) {
    R.lock = true;
    showMsg('good', msg);
    later(() => { R.step++; R.phase = 'ask'; R.helpStage = 0; R.helpTries = 0; R.input = ''; R.lock = false; R.msg = null; R.mood = 'think'; render(); startStepClock(); }, 700);
  }

  // ---------- help (two stages) ----------
  function enterHelp(lead, typed) {
    R.phase = 'help'; R.helpStage = 1; R.helpTries = 0; R.input = ''; R.lock = false; R.mood = 'curious';
    const h = R.cur.help(R.step, 1, typed);
    const stepName = R.cur.steps.length > 1 ? '' : '';
    R.msg = { kind: 'help', html: `<b>${lead}</b> ${h.html}${stepName}` };
    render();
    setVisual(h.vis);
    if (h.flash && R.cur.type === 'look') { R.flashT = setTimeout(() => setVisual('<div class="cover">How many?</div>'), 1800); }
    EM.speech.say(`${lead} ${h.say}`);
  }
  function helpSubmit(ok) {
    const st = curStep();
    if (ok) {
      R.lock = true;
      const worked = R.helpStage === 1;
      showMsg('good', worked ? '✓ You worked it out!' : `✓ ${EM.sentence ? (R.cur.kind === 'fact' ? EM.sentence(R.cur.f) : fmt(st.ans)) : fmt(st.ans)}`);
      EM.speech.say(worked ? 'You worked it out!' : (R.cur.kind === 'fact' ? EM.sentenceSay(R.cur.f) : `${fmt(st.ans)}.`));
      if (worked) EM.sfx.right();
      mood('proud');
      R.stepRes[R.stepRes.length - 1].helped = true;
      later(() => { if (R.step + 1 < R.cur.steps.length) { R.step++; R.phase = 'ask'; R.helpStage = 0; R.input = ''; R.lock = false; R.msg = null; render(); startStepClock(); } else completeItem(); }, 1100);
      return;
    }
    R.helpTries++; R.input = ''; updateSlot();
    if (R.helpStage === 1) {
      R.helpStage = 2;
      const h = R.cur.help(R.step, 2);
      showMsg('help', h.html); setVisual(h.vis);
      EM.speech.say(h.say);
      return;
    }
    // Second wrong try with the answer showing: never a dead end.
    R.lock = true;
    const ans = fmt(st.ans);
    showMsg('soft', `It's <b>${ans}</b>. That's okay, we'll see this one again.`);
    EM.speech.say(`It's ${ans}. That's okay. We'll see this one again.`);
    later(() => { if (R.step + 1 < R.cur.steps.length) { R.step++; R.phase = 'ask'; R.helpStage = 0; R.input = ''; R.lock = false; R.msg = null; render(); startStepClock(); } else completeItem(); }, 1600);
  }

  // ---------- completing an item: grading, praise, celebrations ----------
  function completeItem() {
    const it = R.cur, res = R.stepRes;
    if (it.kind === 'teach') return completeTeach(it, res);
    const allFirst = res.every(r => r.firstTry), allFast = allFirst && res.every(r => r.fast);
    const anyIdk = res.some(r => r.idk);
    // A lesson only on the Sam check counts as slow, not a miss.
    const samOnly = it.type === 'est' && !allFirst && res.every((r, i) => r.firstTry || it.steps[i].sam);
    const outcome = allFast ? 'fast' : (allFirst || samOnly) ? 'slow' : anyIdk ? 'idk' : 'wrong';
    const ms = res.reduce((a, r) => a + (r.ms || 0), 0);
    const graded = it.mode !== 'reask';
    R.stats.items++;
    let becameYours = false, leveledUp = false;
    if (graded && it.kind === 'fact') {
      if (!S.facts[it.key]) { R.planted++; R.plantedKeys.push(it.key); }
      const g = EM.gradeFact(it.key, outcome, ms); becameYours = g.becameYours;
      if (outcome === 'fast') R.stats.fastKeys.push(it.key);
    } else if (graded && it.kind === 'proc') {
      const g = EM.gradeProc(it.skillId, it.level, { ok: outcome === 'fast' || outcome === 'slow', fast: outcome === 'fast', scaff: it.scaff, outcome }); leveledUp = g.leveledUp;
      if (it.samCaught && allFirst) R.stats.samCaught = (R.stats.samCaught || 0) + 1;
      if (it.type === 'est') res.forEach((r, i) => {
        const bucket = it.steps[i].sam ? 'sam' : i < 2 ? 'round' : 'combine', e = R.stats.est[bucket]; e.n++; if (r.firstTry) e.ok++;
        // the two rounding steps also feed her rounding record
        if (i < 2) EM.gradeProc(it.level === 2 ? 'r1000' : 'r100', it.level === 2 ? 0 : 0, { ok: r.firstTry, fast: r.firstTry && r.fast, scaff: it.scaff, outcome: r.idk ? 'idk' : r.firstTry ? (r.fast ? 'fast' : 'slow') : 'wrong' });
      });
    }
    if (graded) { R.stats[outcome]++; R.stats.byKind[it.kind][outcome]++; if (outcome === 'fast' || outcome === 'slow') R.stats.times.push(ms); }
    if (R.kind !== 'placement') saveInflight();
    if (it.mode === 'reask' && (outcome === 'fast' || outcome === 'slow')) { const m = R.missed[it.key]; if (m && !m.learned) { m.learned = true; R.stats.learned.push({ label: it.label, idk: m.idk }); } }
    if (outcome === 'wrong' || outcome === 'idk') { if (!R.missed[it.key]) R.missed[it.key] = { label: it.label, idk: outcome === 'idk', learned: false }; if (it.mode !== 'reask' && R.kind !== 'placement') queueReask(it); if (it.mode === 'probe' && R.kind !== 'placement' && ++R.failedProbes >= 3) R.queue = R.queue.filter((e, i) => i <= R.idx || e.mode !== 'probe'); }
    if (it.mode === 'probe' && outcome === 'fast') { /* she already knew it: nothing to teach */ }
    // messages
    R.lock = true;
    const after = () => { R.idx++; beginItem(); };
    if (outcome === 'fast' || outcome === 'slow') {
      const multi = it.steps.length > 1;
      if (R.kind === 'placement') { showMsg('good', outcome === 'fast' ? '⚡' : '✓'); return later(after, 500); }
      if (it.mode === 'reask') { showMsg('good', pick(['✓ You remembered!', '✓ Got it this time!'])); EM.sfx.right(); mood('proud'); return later(after, 900); }
      if (outcome === 'fast') { showMsg('good', pick(['⚡ You knew it!', '⚡ Quick!', '⚡ Zoom!'])); EM.sfx.fast(); mood('happy'); }
      else { showMsg('good', pick(['✓ Right! You figured it out.', '✓ Yes! You worked it out.'])); EM.sfx.right(); mood('proud'); }
      if (multi && it.done) { showMsg('good', `✓ ${it.done.html}`); EM.speech.say(it.done.say); }
      const delay = multi ? 2200 : outcome === 'fast' ? 700 : 1100;
      later(() => {
        if (becameYours) return celebrateYours(it, () => maybeHow(it, outcome, after));
        if (leveledUp) return levelUpNote(it, after);
        maybeHow(it, outcome, after);
      }, delay);
      return;
    }
    // miss: help already happened; just move on (message already shown)
    if (!R.msg || R.msg.kind !== 'soft') showMsg('soft', pick(['We\'ll see that one again soon.', 'That one is coming back.']));
    later(after, 800);
  }
  // Teach Dot: only the final answer decides; a miss is a real retention miss and the fact goes back to learning.
  function completeTeach(it, res) {
    const ok = res[res.length - 1].firstTry, t = R.stats.taught;
    EM.teach.record(it, ok);
    t.n++; if (ok) t.ok++; if (it.dotWrong) { t.dotWrong++; if (ok) t.caught++; }
    R.lock = true;
    if (ok) { showMsg('good', `✓ ${it.done.html}`); EM.speech.say(it.done.say); mood('happy'); EM.sfx.right(); }
    else { showMsg('soft', "Let's both practice that one again soon."); mood('curious'); }
    saveInflight();
    later(() => { R.idx++; beginItem(); }, ok ? 2200 : 1400);
  }
  function queueReask(it) {
    const n = R.reasks[it.key] || 0; if (n >= 2) return;
    R.reasks[it.key] = n + 1;
    while (R.queue.length < R.idx + 4 && R.spare.length) R.queue.push(EM.factItem(R.spare.shift(), 'normal'));
    let copy;
    if (it.kind === 'fact') copy = EM.factItem(it.key, 'reask');
    else { copy = Object.assign(Object.create(Object.getPrototypeOf(it)), it, { mode: 'reask', tier: Math.max(1, it.tier), scaff: false }); copy.visFor = i => copy.stepVis ? copy.stepVis(i, copy.tier) : (copy.steps[i].vis || (copy.tierVis ? copy.tierVis(copy.tier) : '')); }
    const at = Math.min(R.idx + 3 + Math.floor(Math.random() * 2), R.queue.length);
    R.queue.splice(at, 0, copy);
  }
  // "How did you know?" every 4th fast fact (not in placement)
  function maybeHow(it, outcome, next) {
    if (R.kind === 'placement' || it.kind !== 'fact' || outcome !== 'fast' || it.mode === 'reask') return next();
    R.howCount++;
    if (R.howCount % 4 !== 0) return next();
    overlay(`<div class="celebrate-row">${D('think', 64)}</div><h2>How did you know?</h2><p>${esc(it.label)}</p><div class="how">
      <button class="btn secondary" data-how="knew">I just knew it</button>
      <button class="btn secondary" data-how="trick">I used a trick</button>
      <button class="btn secondary" data-how="counted">I counted</button></div>`, next);
    EM.speech.say('How did you know?');
  }
  function celebrateYours(it, next) {
    R.yoursNow.push(it.label); R.yoursKeys.push(it.key);
    const n = EM.countYours();
    confetti();
    EM.sfx.yours();
    overlay(`<div class="celebrate-row">${S.avatar ? EM.avatar.draw(undefined, 78, 'cheer') : ''}${D('cheer', 92)}<span class="big-item">${T().item(n)}</span></div><h2>${esc(it.label)} is YOURS!</h2><p>You knew it fast today <b>and</b> another day. That's what really knowing looks like.<br>${T().newLine(n)} You now know <b>${n}</b> fact${n > 1 ? 's' : ''} for keeps.</p><button class="big-btn" data-close="1">Yes!</button>`, next);
    EM.speech.say(`${it.label.replace('−', 'minus').replace('+', 'plus').replace('?', 'what')} is yours! You now really know ${n} facts.`).then(() => { if (R.clipPlays < 2) { R.clipPlays++; EM.clips.play(); } });
  }
  function levelUpNote(it, next) {
    const sk = EM.SK[it.skillId], rec = EM.skillRec(it.skillId);
    EM.sfx.unlock();
    overlay(`<div class="celebrate-row">${D('wow', 84)}</div><h2>${sk.name}: next level!</h2><p>You've got <b>${sk.levels[rec.level - 1]}</b>. Now: <b>${sk.levels[rec.level]}</b>.</p><button class="big-btn" data-close="1">Let's go</button>`, next);
    EM.speech.say(`${sk.name}, next level!`);
  }
  function unlockCeremony(skills, next) {
    if (!skills.length) return next();
    if (skills.length > 2) {
      // Many at once (after placement): one ceremony, not a parade.
      EM.sfx.unlock(); confetti();
      overlay(`<div class="celebrate-row">${D('cheer', 92)}</div><h2>${skills.length} skills unlocked!</h2><p>${skills.map(s => `${s.icon} <b>${esc(s.name)}</b>`).join('<br>')}</p><button class="big-btn" data-close="1">Awesome</button>`, next);
      EM.speech.say(`${skills.length} skills unlocked!`).then(() => EM.clips.play());
      return;
    }
    const sk = skills[0];
    EM.sfx.unlock(); confetti();
    overlay(`<div class="celebrate-row">${D('wow', 84)}<span class="celebrate">${sk.icon}</span></div><h2>New skill unlocked!</h2><p><b>${esc(sk.name)}</b><br>${esc(sk.desc)}</p><button class="big-btn" data-close="1">Awesome</button>`, () => unlockCeremony(skills.slice(1), next));
    EM.speech.say(`New skill unlocked. ${sk.name}.`).then(() => EM.clips.play());
  }
  function milestoneCeremony(list) {
    if (!list.length) return;
    const [at, emoji, name] = list[0], t = T();
    EM.sfx.yours(); confetti();
    overlay(`<div class="celebrate-row">${S.avatar ? EM.avatar.draw(undefined, 70, 'cheer') : ''}${D('wow', 80)}<span class="milestone-big">${emoji}</span></div><h2>Surprise!</h2><p>You really know <b>${at}</b> facts, so ${name} moved into your ${t.place}!</p><button class="big-btn" data-close="1">Hello, ${name.replace(/^(a|an|the) /, '')}!</button>`, () => milestoneCeremony(list.slice(1)));
    EM.speech.say(`Surprise! ${name} moved into your ${t.place}!`).then(() => EM.clips.play());
  }
  function zoneSheet(id) {
    overlay(`${EM.world.zoneView(id)}<button class="big-btn" data-close="1" style="margin-top:14px">Back</button>`, null);
    const sh = document.querySelector('#overlay .sheet'); if (sh) sh.classList.add('zone');
  }
  function confetti() {
    const cols = ['#ef6a4c', '#f0b429', '#3d8bd6', '#c45cd6', '#4fb5a6'];
    for (let i = 0; i < 40; i++) { const d = document.createElement('div'); d.className = 'confetti'; d.style.left = Math.random() * 100 + 'vw'; d.style.background = cols[i % cols.length]; d.style.animationDelay = Math.random() * 0.6 + 's'; document.body.appendChild(d); setTimeout(() => d.remove(), 2400); }
  }
  let overlayNext = null;
  function overlay(html, next) {
    overlayNext = next;
    let o = document.getElementById('overlay');
    if (!o) { o = document.createElement('div'); o.id = 'overlay'; o.className = 'overlay'; document.body.appendChild(o); }
    o.innerHTML = `<div class="sheet">${html}</div>`;
  }
  function closeOverlay() { const o = document.getElementById('overlay'); if (o) o.remove(); const n = overlayNext; overlayNext = null; if (n) n(); }

  // ---------- quit / finish ----------
  function askQuit() {
    overlay(`<div class="celebrate-row">${D('curious', 64)}</div><h2>Stop for now?</h2><p>What you did so far is saved.</p><button class="btn secondary" data-quit="yes">Yes, stop</button><button class="big-btn" data-close="1" style="margin-top:10px">Keep going</button>`, null);
  }
  function finishSession() {
    if (!R || R.ended) return;
    R.ended = true;
    clearTimeout(R.nextT); clearTimeout(R.flashT); clearTimeout(R.breakT); clearTimeout(R.speechT); EM.speech.stop();
    const st = R.stats, answered = st.fast + st.slow + st.wrong + st.idk;
    delete S.inflight;
    if (answered) EM.logSession(sessionRecord()); else EM.save();
    if (R.kind === 'placement' && (answered >= 15 || R.idx >= R.queue.length)) { seedLevels(); S.placement.done = true; S.placement.at = Date.now(); EM.save(); }
    R.newSkills = EM.newlyOpened();
    screen = answered ? 'summary' : 'home';
    render();
    const ms = EM.world.crossed(R.knownBefore, EM.countYours());
    if (answered) unlockCeremony(R.newSkills, () => milestoneCeremony(ms));
  }

  // Keep the in-flight session in saved state so an iOS-killed app still logs the day.
  function sessionRecord() {
    const st = R.stats;
    return { date: Date.now(), kind: R.kind === 'skill' ? 'skill' : R.kind, title: R.title, items: st.items, fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk, rushed: st.rushed, relooks: st.relooks,
      minutes: Math.round((Date.now() - R.started) / 6000) / 10, avg: st.times.length ? Math.round(st.times.reduce((a, b) => a + b, 0) / st.times.length) : 0,
      learned: st.learned.map(l => l.label), fastKeys: st.fastKeys.slice(0, 40), tricks: st.tricks, samCaught: st.samCaught || 0, taught: st.taught, how: st.how, byKind: st.byKind, est: st.est };
  }
  function saveInflight() { S.inflight = sessionRecord(); EM.save(); }
  function closeInflight() {
    const f = S.inflight; if (!f) return;
    delete S.inflight;
    if (f.items > 0) { f.title += ' (interrupted)'; EM.logSession(f); } else EM.save();
  }

  // After placement, start each procedure at the highest level she answered fast and right today.
  function seedLevels() {
    const today = dayStr(Date.now());
    for (const sk of EM.SKILLS.filter(s => s.kind === 'proc')) {
      let level = 0;
      for (let lv = 0; lv < sk.levels.length; lv++) {
        const w = EM.levelRec(sk.id, lv).window.filter(x => x.day === today);
        if (w.length && w.every(x => x.ok && x.fast)) level = lv; else break;
      }
      if (level > EM.skillRec(sk.id).level) EM.skillRec(sk.id).level = level;
    }
  }

  // ---------- practice screen ----------
  function stageHTML() {
    const it = R.cur, st = curStep(), help = R.phase === 'help';
    let vis = '';
    if (!help) {
      if (it.type === 'look') vis = R.waitReady ? '<button class="ready" data-act="ready">Ready? Tap to look 👀</button>' : '';
      else vis = it.visFor ? it.visFor(R.step) : (st.vis || '');
    }
    const html = st.html.replace('<span class="slot">&nbsp;</span>', `<span class="slot">${R.input ? fmt(Number(R.input)) : '&nbsp;'}</span>`).replace('<span class="slot wide">&nbsp;</span>', `<span class="slot wide">${R.input ? fmt(Number(R.input)) : '&nbsp;'}</span>`);
    const speaker = it.kind === 'fact' && EM.speech.enabled() ? `<button class="speaker" data-act="speak" aria-label="Hear it">🔊</button>` : (EM.speech.enabled() ? `<button class="speaker" data-act="speak" aria-label="Hear it again">🔊</button>` : '');
    const tricks = R.waitTrick && !help ? `<div class="tricks"><span class="lab">Which trick will you use?</span>${EM.TRICK_SKILLS[skillOfFact(it.key, true)].map(t => `<button data-trick="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : '';
    return `${it.mode === 'reask' && !help ? '<div class="tag">Try this one again</div>' : ''}${html}<div class="visual">${vis}</div>${speaker}${tricks}`;
  }
  function renderPractice() {
    const help = R.phase === 'help', hidden = (R.waitReady || R.waitTrick || R.waitSpeech) && !help;
    $app.innerHTML = `<main class="wrap practice${help ? ' helping' : ''}">
      <div class="topbar"><button class="icon-btn" data-act="quit" aria-label="Stop practice">✕</button>
        <div class="progress"><i style="width:${Math.min(100, R.idx / Math.max(1, R.planned) * 100)}%"></i></div>
        <span class="blockname">${esc(R.blocks[R.bi].name)}${R.blocks.length > 1 ? ` ${R.bi + 1}/${R.blocks.length}` : ''}</span>${D(R.mood || 'think', 44)}</div>
      <div class="stage">
        ${stageHTML()}
        <div class="msg ${R.msg ? R.msg.kind : ''}" aria-live="polite">${R.msg ? R.msg.html : ''}</div>
      </div>
      <div class="pad${hidden ? ' hidden' : ''}">${range(1, 9).map(d => `<button data-d="${d}">${d}</button>`).join('')}
        <button data-act="back" aria-label="Delete">⌫</button><button data-d="0">0</button><button class="ok" data-act="ok" aria-label="Check">✓</button></div>
      <button class="idk${hidden || help ? ' hidden' : ''}" data-act="idk">🙋 I don't know</button>
    </main>`;
  }

  // ---------- summary + grown-up card ----------
  function renderSummary() {
    const st = R.stats, known = EM.countYours();
    if (R.kind === 'placement') {
      $app.innerHTML = `<main class="wrap">
        ${worldHTML(`Thank you! Look, you planted ${R.planted} ${R.planted === 1 ? GROW[T().id][0] : GROW[T().id][1]} in your ${T().place} today!`, { mood: 'cheer', fresh: R.plantedKeys.slice(0, 60) })}
        <p class="sub">Now I know where to start. Tomorrow we begin for real: ${S.settings.blocks} short parts, about ${S.settings.blockMin * S.settings.blocks} minutes.</p>
        <div class="tiles"><div class="tile"><b>${st.fast}</b><span>⚡ Knew it fast</span></div><div class="tile"><b>${st.slow}</b><span>✓ Figured it out</span></div><div class="tile"><b>${st.wrong + st.idk}</b><span>🧠 To learn</span></div></div>
        ${st.idk ? `<div class="note">🙋 You said "I don't know" ${st.idk} time${st.idk > 1 ? 's' : ''}. That's exactly right. Now I know what to teach.</div>` : ''}
        ${EM.parent.grownupCard(R)}
        <p style="margin-top:20px"><button class="big-btn" data-act="home">Done</button></p>
      </main>`;
      return;
    }
    const notes = [];
    if (R.yoursNow.length) notes.push(`${T().big} New ${R.yoursNow.length > 1 ? T().many : T().one}: <b>${R.yoursNow.map(esc).join(', ')}</b>. Those are yours now.`);
    if (st.learned.length) notes.push(`🧠 You didn't know <b>${esc(st.learned[0].label)}</b>${st.learned.length > 1 ? ` and ${st.learned.length - 1} more` : ''} at the start. Then you learned ${st.learned.length > 1 ? 'them' : 'it'}. That's brave, and it's how your brain grows.`);
    if (st.rushed) notes.push(`🐢 ${st.rushed} answer${st.rushed > 1 ? 's were' : ' was'} super quick and wrong. Think first, then tap.`);
    if (st.taught.n) notes.push(`🧑‍🏫 You taught Dot ${st.taught.ok} of ${st.taught.n}${st.taught.dotWrong ? ` and caught ${st.taught.caught} of Dot's ${st.taught.dotWrong} mistake${st.taught.dotWrong > 1 ? 's' : ''}` : ''}. Great teaching!`);
    if (st.samCaught) notes.push(`🕵️ Your estimate caught ${st.samCaught} of Sam's mistakes!`);
    if (!R.yoursNow.length) notes.push(`⭐ Facts you get right fast on two different days become yours. Come back tomorrow!`);
    $app.innerHTML = `<main class="wrap">
      ${worldHTML(R.yoursKeys.length ? `Nice work, ${esc(NAME())}! Look what's new in your ${T().place}!` : R.planted ? `Nice work, ${esc(NAME())}! You planted ${R.planted} new ${R.planted === 1 ? GROW[T().id][0] : GROW[T().id][1]} today.` : `Nice work, ${esc(NAME())}! Your ${GROW[T().id][1]} are getting stronger.`, { mood: 'cheer', fresh: [...R.yoursKeys, ...R.plantedKeys], freshDeco: EM.world.crossed(R.knownBefore, known).map(m => m[0]) })}
      <p class="sub" style="text-align:center">${R.title} · ${st.items} questions</p>
      <div class="tiles">
        <div class="tile"><b>${st.fast}</b><span>⚡ Knew it fast</span></div>
        <div class="tile"><b>${st.slow}</b><span>✓ Figured it out</span></div>
        <div class="tile"><b>${st.wrong + st.idk}</b><span>🧠 Learned with help</span></div>
      </div>
      ${notes.map(n => `<div class="note">${n}</div>`).join('')}
      ${EM.parent.grownupCard(R)}
      <p style="margin-top:20px"><button class="big-btn" data-act="home">Done</button></p>
    </main>`;
    if (st.learned.length && R.kind === 'daily') setTimeout(() => EM.clips.play(), 600);
  }

  // ---------- events ----------
  $app.addEventListener('click', e => {
    const d = e.target.closest('[data-d]');
    if (d) return typeDigit(d.dataset.d);
    const av = e.target.closest('[data-av]');
    if (av) { const ni = document.getElementById('avName'); if (ni) S.name = ni.value.trim(); EM.avatar.set(av.dataset.av, av.dataset.val); EM.sfx.right(); return render(); }
    if (e.target.closest('[data-av-done]')) { const ni = document.getElementById('avName'); if (ni) S.name = ni.value.trim(); S.avatar = EM.avatar.get(); EM.save(); EM.sfx.unlock(); EM.speech.say(S.name ? `Nice to meet you, ${S.name}!` : 'Nice to meet you!'); return go('home'); }
    const zh = e.target.closest('[data-zone]');
    if (zh) return zoneSheet(zh.dataset.zone);
    const tc = e.target.closest('[data-tc]');
    if (tc) { EM.speech.prime(); EM.clips.prime(); S.theme = tc.dataset.tc; EM.save(); EM.theme.apply(); EM.sfx.unlock(); return go('home'); }
    const tr = e.target.closest('[data-trick]');
    if (tr) return trickTap(tr.dataset.trick);
    const a = e.target.closest('[data-act]');
    if (!a) return;
    EM.speech.prime(); EM.clips.prime();
    switch (a.dataset.act) {
      case 'home': return go('home');
      case 'skills': return go('skills');
      case 'world': return go('world');
      case 'avatar': return go('avatar');
      case 'notebook': {
        const keys = EM.teach.notebook();
        overlay(`<div class="celebrate-row">${D('proud', 64)}</div><h2>Dot's notebook</h2><p>Facts ${esc(NAME())} taught me:</p><div class="nbgrid">${keys.map(k => `<span>${esc(EM.labelFact(EM.FACTS[k]))}${S.taught[k].caught ? ' ✓' : ''}</span>`).join('')}</div><p style="font-size:14px;color:var(--muted)">✓ means you caught one of my mistakes on it.</p><button class="big-btn" data-close="1">Back</button>`, null);
        return;
      }
      case 'placement': return startSession('placement');
      case 'today': return startSession('daily');
      case 'evening': return startSession('evening');
      case 'skill': return startSession('skill', { id: a.dataset.id });
      case 'nextblock': clearTimeout(R.breakT); screen = 'practice'; return nextBlock();
      case 'ok': return submit();
      case 'back': return backspace();
      case 'idk': return idk();
      case 'ready': return readyTap();
      case 'relook': return relook();
      case 'speak': { const st = curStep(); const h = R.phase === 'help' && R.msg ? R.msg.html.replace(/<[^>]+>/g, '') : (R.cur.kind === 'fact' ? st.say : st.say); return EM.speech.say(h); }
      case 'quit': return askQuit();
    }
  });
  document.addEventListener('click', e => {
    const h = e.target.closest('[data-how]');
    if (h) { const k = h.dataset.how; S.how[k] = (S.how[k] || 0) + 1; if (R && R.stats.how) R.stats.how[k]++; EM.save(); return closeOverlay(); }
    if (e.target.closest('[data-quit]')) { closeOverlay(); return finishSession(); }
    if (e.target.closest('[data-close]')) return closeOverlay();
  });
  document.addEventListener('keydown', e => {
    if (screen !== 'practice') return;
    if (/^[0-9]$/.test(e.key)) typeDigit(e.key);
    else if (e.key === 'Backspace') { e.preventDefault(); backspace(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (R && R.waitReady) readyTap(); else submit(); }
  });
  // Press-and-hold opens the grown-up area (read-only digest; settings sit behind a PIN).
  let holdT = null;
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-hold]'); if (!b) return;
    b.classList.add('holding');
    holdT = setTimeout(() => go(b.dataset.hold), 1500);
  });
  const cancelHold = () => { clearTimeout(holdT); document.querySelectorAll('.holding').forEach(b => b.classList.remove('holding')); };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => document.addEventListener(t, cancelHold));
  document.addEventListener('contextmenu', e => { if (e.target.closest('[data-hold]')) e.preventDefault(); });

  // ---------- boot ----------
  EM.recoverIfNeeded().then(r => { closeInflight(); if (r) render(); });
  EM.persist();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  render();
  // Exposed for tests
  EM._run = () => R; EM._screen = () => screen; EM.startSession = startSession;
})();
