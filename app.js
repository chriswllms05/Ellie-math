/* Ellie Math — screens and the session controller. */
'use strict';
(function () {
  const EM = window.EM;
  const { range, shuffle, pick, fmt, esc, dayStr, DAY } = EM;
  const S = EM.load();
  const $app = document.getElementById('app');
  let screen = 'home', R = null, overlayQueue = [];

  // ---------- navigation ----------
  function go(s) { screen = s; render(); window.scrollTo(0, 0); }
  function render() {
    const views = { home: renderHome, skills: renderSkills, practice: renderPractice, summary: renderSummary, parent: () => EM.parent.render($app, { go, startSession }), break: renderBreak };
    (views[screen] || renderHome)();
  }
  EM.go = go; EM.render = render;

  // ---------- home ----------
  function todayDone() { const d = dayStr(Date.now()); return S.sessions.some(s => dayStr(s.date) === d && s.kind === 'daily'); }
  function garden(n, limit = 60) {
    if (!n) return '<div class="garden-empty">Your garden is empty for now. Every fact you really know grows a flower here.</div>';
    const cols = ['#ef6a4c', '#f0b429', '#3d8bd6', '#c45cd6', '#4fb5a6', '#ff8fb1'];
    const shown = Math.min(n, limit);
    return `<div class="garden">${range(1, shown).map(i => `<div class="flower" style="--f:${cols[i % cols.length]}; animation-delay:${Math.min(i, 20) * 25}ms"></div>`).join('')}${n > limit ? `<span class="garden-empty">+${n - limit} more</span>` : ''}</div>`;
  }
  function renderHome() {
    const known = EM.countYours(), name = esc(S.name || 'Ellie');
    if (!S.placement.done) {
      $app.innerHTML = `<main class="wrap">
        <h1>Hi, ${name}! 👋</h1>
        <p class="sub">This is <b>Ellie Math</b>. Today isn't a lesson. I just want to see what you already know, so we can start in the right place.</p>
        <button class="big-btn" data-act="placement">Let's see what you know<span>About 10 minutes</span></button>
        <div class="card"><h2>Two rules</h2><ul>
          <li>🧠 Think first, then type. There's no rush.</li>
          <li>🙋 Not sure? Tap <b>I don't know</b>. That is the smart move here. Guessing teaches nothing.</li>
        </ul></div>
        <button class="grownup" data-hold="parent"><span class="fillbar"></span>Grown-ups: press and hold</button>
      </main>`;
      return;
    }
    const done = todayDone();
    $app.innerHTML = `<main class="wrap">
      <h1>Hi, ${name}! 👋</h1>
      <p class="sub">${known ? `You really know <b>${known}</b> fact${known > 1 ? 's' : ''}. They're yours for keeps.` : "Let's grow some math muscles."}</p>
      ${garden(known)}
      <button class="big-btn" data-act="today">${done ? 'Practice again' : "Today's practice"}<span>${done ? "You already did today's. Extra is fine!" : `About ${S.settings.blockMin * S.settings.blocks} minutes, ${S.settings.blocks} short parts`}</span></button>
      ${done ? '<button class="btn secondary" data-act="evening" style="margin-bottom:12px">Evening review <span style="font-size:14px;color:var(--muted)">5 minutes, just the facts that are due</span></button>' : ''}
      <button class="btn secondary" data-act="skills">Pick a skill</button>
      <div class="card"><h2>How to play</h2><ul>
        <li>🧠 Think first, then type.</li>
        <li>🙋 Not sure? Tap <b>I don't know</b>. That's how you learn. No guessing!</li>
        <li>⚡ Know a fact fast on two different days and it's <b>yours</b>. A flower grows.</li>
      </ul></div>
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
      blocks = [{ name: 'Foundations', cap, build: () => factQueueItems(openIds('A'), 24) }];
      if (S.settings.blocks >= 2) blocks.push({ name: 'Big numbers', cap, build: () => ({ items: procQueueItems(openIds('B'), 12), spare: [] }) });
      if (S.settings.blocks >= 3) blocks.push({ name: 'School work', cap, build: () => { const ids = openIds('C'); return { items: ids.length ? procQueueItems(ids, 8) : procQueueItems(openIds('B'), 10), spare: [] }; } });
    }
    R = { kind, title: kind === 'placement' ? 'Placement' : kind === 'skill' ? EM.SK[opt.id].name : kind === 'evening' ? 'Evening review' : "Today's practice", blocks, bi: -1, started: Date.now(),
      stats: { fast: 0, slow: 0, wrong: 0, idk: 0, rushed: 0, relooks: 0, items: 0, times: [], learned: [], fastKeys: [], tricks: {} }, missed: {}, yoursNow: [], howCount: 0, clipPlays: 0 };
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
      <div class="big">${['🌟', '🚀', '🎉'][R.bi % 3]}</div>
      <h1>Part ${done} of ${total} done!</h1>
      <p class="sub">Shake out your hands. Take a breath. Next up: <b>${esc(R.blocks[R.bi + 1].name)}</b>.</p>
      <button class="big-btn" data-act="nextblock">I'm ready</button>
    </main>`;
    EM.speech.say(`Part ${done} done! Shake out your hands. Next up, ${R.blocks[R.bi + 1].name}.`);
  }

  // ---------- items ----------
  const curStep = () => R.cur.steps[R.step];
  const digitsAllowed = () => Math.max(1, String(curStep().ans).length);
  function needsTrick(item) { if (item.kind !== 'fact' || item.mode === 'probe' || item.mode === 'reask' || R.kind === 'placement') return false; const r = S.facts[item.key]; if (r && r.box >= EM.FLUENT_BOX) return false; return !!skillOfFact(item.key, true); }
  function skillOfFact(key, trickOnly) { for (const id of Object.keys(EM.TRICK_SKILLS)) if (EM.SK[id].facts.includes(key)) return id; if (trickOnly) return null; return EM.SKILLS.find(s => s.kind === 'fact' && s.facts.includes(key)).id; }

  function beginItem() {
    clearTimeout(R.flashT); clearTimeout(R.speechT);
    if (R.idx >= R.queue.length || (R.idx > 0 && blockTimeUp())) return endOfBlock();
    const it = R.queue[R.idx];
    R.cur = it; R.step = 0; R.phase = 'ask'; R.helpStage = 0; R.helpTries = 0; R.input = ''; R.lock = false; R.msg = null; R.trick = null; R.stepRes = []; R.relooked = false;
    R.waitReady = it.type === 'look';
    R.waitTrick = needsTrick(it);
    R.waitSpeech = false;
    render();
    startStepClock();
  }
  // Starts the clock for the current step, after speech if the prompt is spoken.
  function startStepClock() {
    const st = curStep();
    R.t0 = null; R.tLast = null;
    const spoken = R.cur.kind === 'proc' && st.say && EM.speech.enabled();
    if (R.waitReady) return; // look items: clock starts on "Ready"
    if (spoken) {
      R.waitSpeech = true; setPadHidden(true);
      const release = () => { if (R.waitSpeech) { R.waitSpeech = false; setPadHidden(false); R.t0 = performance.now(); } };
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
  function setVisual(html) { const v = document.querySelector('.visual'); if (v) v.innerHTML = html || ''; }

  function submit() {
    if (!R || R.lock || !R.input || R.waitReady || R.waitTrick || R.waitSpeech) return;
    clearTimeout(R.flashT);
    const st = curStep(), typed = Number(R.input), ok = typed === st.ans;
    if (R.phase === 'help') return helpSubmit(ok);
    const ms = (R.tLast || performance.now()) - (R.t0 || performance.now());
    const fast = ms <= EM.fastMs(R.cur, R.step);
    if (ok) {
      R.stepRes.push({ ok: true, fast, ms, firstTry: true });
      if (R.step + 1 < R.cur.steps.length) return nextStep(fast ? pick(['⚡ Yes!', '⚡ Quick!']) : '✓ Right!');
      return completeItem();
    }
    const rushed = ms < EM.rushMs(R.cur);
    if (rushed) R.stats.rushed++;
    R.stepRes.push({ ok: false, fast: false, ms, firstTry: false, typed });
    if (R.kind === 'placement') return placementMiss();
    enterHelp(rushed ? 'Whoa, that was super fast! Slow down and think.' : pick(['Not quite.', 'Not yet.', 'Hmm, not that one.']), typed);
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
    setTimeout(completeItem, 900);
  }
  function nextStep(msg) {
    R.lock = true;
    showMsg('good', msg);
    setTimeout(() => { R.step++; R.phase = 'ask'; R.helpStage = 0; R.helpTries = 0; R.input = ''; R.lock = false; R.msg = null; render(); startStepClock(); }, 700);
  }

  // ---------- help (two stages) ----------
  function enterHelp(lead, typed) {
    R.phase = 'help'; R.helpStage = 1; R.helpTries = 0; R.input = ''; R.lock = false;
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
      R.stepRes[R.stepRes.length - 1].helped = true;
      setTimeout(() => { if (R.step + 1 < R.cur.steps.length) { R.step++; R.phase = 'ask'; R.helpStage = 0; R.input = ''; R.lock = false; R.msg = null; render(); startStepClock(); } else completeItem(); }, 1100);
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
    setTimeout(() => { if (R.step + 1 < R.cur.steps.length) { R.step++; R.phase = 'ask'; R.helpStage = 0; R.input = ''; R.lock = false; R.msg = null; render(); startStepClock(); } else completeItem(); }, 1600);
  }

  // ---------- completing an item: grading, praise, celebrations ----------
  function completeItem() {
    const it = R.cur, res = R.stepRes;
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
      const g = EM.gradeFact(it.key, outcome, ms); becameYours = g.becameYours;
      if (outcome === 'fast') R.stats.fastKeys.push(it.key);
    } else if (graded && it.kind === 'proc') {
      const g = EM.gradeProc(it.skillId, it.level, { ok: outcome === 'fast' || outcome === 'slow', fast: outcome === 'fast', scaff: it.scaff, outcome }); leveledUp = g.leveledUp;
      if (it.samCaught && allFirst) R.stats.samCaught = (R.stats.samCaught || 0) + 1;
    }
    if (graded) { R.stats[outcome]++; if (outcome === 'fast' || outcome === 'slow') R.stats.times.push(ms); }
    if (it.mode === 'reask' && (outcome === 'fast' || outcome === 'slow')) { const m = R.missed[it.key]; if (m && !m.learned) { m.learned = true; R.stats.learned.push({ label: it.label, idk: m.idk }); } }
    if (outcome === 'wrong' || outcome === 'idk') { if (!R.missed[it.key]) R.missed[it.key] = { label: it.label, idk: outcome === 'idk', learned: false }; if (it.mode !== 'reask') queueReask(it); if (it.mode === 'probe' && R.kind !== 'placement' && ++R.failedProbes >= 3) R.queue = R.queue.filter((e, i) => i <= R.idx || e.mode !== 'probe'); }
    if (it.mode === 'probe' && outcome === 'fast') { /* she already knew it: nothing to teach */ }
    // messages
    R.lock = true;
    const after = () => { R.idx++; beginItem(); };
    if (outcome === 'fast' || outcome === 'slow') {
      const multi = it.steps.length > 1;
      if (R.kind === 'placement') { showMsg('good', outcome === 'fast' ? '⚡' : '✓'); return setTimeout(after, 500); }
      if (it.mode === 'reask') { showMsg('good', pick(['✓ You remembered!', '✓ Got it this time!'])); EM.sfx.right(); return setTimeout(after, 900); }
      if (outcome === 'fast') { showMsg('good', pick(['⚡ You knew it!', '⚡ Quick!', '⚡ Zoom!'])); EM.sfx.fast(); }
      else { showMsg('good', pick(['✓ Right! You figured it out.', '✓ Yes! You worked it out.'])); EM.sfx.right(); }
      if (multi && it.done) { showMsg('good', `✓ ${it.done.html}`); EM.speech.say(it.done.say); }
      const delay = multi ? 2200 : outcome === 'fast' ? 700 : 1100;
      setTimeout(() => {
        if (becameYours) return celebrateYours(it, () => maybeHow(it, outcome, after));
        if (leveledUp) return levelUpNote(it, after);
        maybeHow(it, outcome, after);
      }, delay);
      return;
    }
    // miss: help already happened; just move on (message already shown)
    if (!R.msg || R.msg.kind !== 'soft') showMsg('soft', pick(['We\'ll see that one again soon.', 'That one is coming back.']));
    setTimeout(after, 800);
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
    overlay(`<h2>How did you know?</h2><p>${esc(it.label)}</p><div class="how">
      <button class="btn secondary" data-how="knew">I just knew it</button>
      <button class="btn secondary" data-how="trick">I used a trick</button>
      <button class="btn secondary" data-how="counted">I counted</button></div>`, next);
    EM.speech.say('How did you know?');
  }
  function celebrateYours(it, next) {
    R.yoursNow.push(it.label);
    const n = EM.countYours();
    confetti();
    EM.sfx.yours();
    overlay(`<div class="celebrate">🌸</div><h2>${esc(it.label)} is YOURS!</h2><p>You knew it fast today <b>and</b> another day. That's what really knowing looks like.<br>A new flower grew. You now know <b>${n}</b> fact${n > 1 ? 's' : ''} for keeps.</p><button class="big-btn" data-close="1">Yes!</button>`, next);
    EM.speech.say(`${it.label.replace('−', 'minus').replace('+', 'plus').replace('?', 'what')} is yours! You now really know ${n} facts.`).then(() => { if (R.clipPlays < 2) { R.clipPlays++; EM.clips.play(); } });
  }
  function levelUpNote(it, next) {
    const sk = EM.SK[it.skillId], rec = EM.skillRec(it.skillId);
    EM.sfx.unlock();
    overlay(`<div class="celebrate">🪜</div><h2>${sk.name}: next level!</h2><p>You've got <b>${sk.levels[rec.level - 1]}</b>. Now: <b>${sk.levels[rec.level]}</b>.</p><button class="big-btn" data-close="1">Let's go</button>`, next);
    EM.speech.say(`${sk.name}, next level!`);
  }
  function unlockCeremony(skills, next) {
    if (!skills.length) return next();
    const sk = skills[0];
    EM.sfx.unlock(); confetti();
    overlay(`<div class="celebrate">${sk.icon}</div><h2>New skill unlocked!</h2><p><b>${esc(sk.name)}</b><br>${esc(sk.desc)}</p><button class="big-btn" data-close="1">Awesome</button>`, () => unlockCeremony(skills.slice(1), next));
    EM.speech.say(`New skill unlocked. ${sk.name}.`).then(() => EM.clips.play());
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
    overlay(`<h2>Stop for now?</h2><p>What you did so far is saved.</p><button class="btn secondary" data-quit="yes">Yes, stop</button><button class="big-btn" data-close="1" style="margin-top:10px">Keep going</button>`, null);
  }
  function finishSession() {
    clearTimeout(R.flashT); clearTimeout(R.breakT); EM.speech.stop();
    const st = R.stats, answered = st.fast + st.slow + st.wrong + st.idk;
    const minutes = Math.round((Date.now() - R.started) / 6000) / 10;
    if (answered) {
      EM.logSession({ date: Date.now(), kind: R.kind === 'skill' ? 'skill' : R.kind, title: R.title, items: st.items, fast: st.fast, slow: st.slow, wrong: st.wrong, idk: st.idk, rushed: st.rushed, relooks: st.relooks, minutes,
        avg: st.times.length ? Math.round(st.times.reduce((a, b) => a + b, 0) / st.times.length) : 0, learned: st.learned.map(l => l.label), fastKeys: st.fastKeys.slice(0, 40), tricks: st.tricks, samCaught: st.samCaught || 0 });
    }
    if (R.kind === 'placement') { S.placement.done = true; S.placement.at = Date.now(); EM.save(); }
    R.newSkills = EM.newlyOpened();
    screen = answered ? 'summary' : 'home';
    render();
    if (answered && R.newSkills.length) unlockCeremony(R.newSkills, () => {});
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
    $app.innerHTML = `<main class="wrap practice">
      <div class="topbar"><button class="icon-btn" data-act="quit" aria-label="Stop practice">✕</button>
        <div class="progress"><i style="width:${Math.min(100, R.idx / Math.max(1, R.planned) * 100)}%"></i></div>
        <span class="blockname">${esc(R.blocks[R.bi].name)}${R.blocks.length > 1 ? ` ${R.bi + 1}/${R.blocks.length}` : ''}</span></div>
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
        <h1>Thank you! 🙌</h1>
        <p class="sub">Now I know where to start. Tomorrow we begin for real: ${S.settings.blocks} short parts, about ${S.settings.blockMin * S.settings.blocks} minutes.</p>
        <div class="tiles"><div class="tile"><b>${st.fast}</b><span>⚡ Knew it fast</span></div><div class="tile"><b>${st.slow}</b><span>✓ Figured it out</span></div><div class="tile"><b>${st.wrong + st.idk}</b><span>🧠 To learn</span></div></div>
        ${st.idk ? `<div class="note">🙋 You said "I don't know" ${st.idk} time${st.idk > 1 ? 's' : ''}. That's exactly right. Now I know what to teach.</div>` : ''}
        ${EM.parent.grownupCard(R)}
        <p style="margin-top:20px"><button class="big-btn" data-act="home">Done</button></p>
      </main>`;
      return;
    }
    const notes = [];
    if (R.yoursNow.length) notes.push(`🌸 New flowers: <b>${R.yoursNow.map(esc).join(', ')}</b>. Those are yours now.`);
    if (st.learned.length) notes.push(`🧠 You didn't know <b>${esc(st.learned[0].label)}</b>${st.learned.length > 1 ? ` and ${st.learned.length - 1} more` : ''} at the start. Then you learned ${st.learned.length > 1 ? 'them' : 'it'}. That's brave, and it's how your brain grows.`);
    if (st.rushed) notes.push(`🐢 ${st.rushed} answer${st.rushed > 1 ? 's were' : ' was'} super quick and wrong. Think first, then tap.`);
    if (st.samCaught) notes.push(`🕵️ Your estimate caught ${st.samCaught} of Sam's mistakes!`);
    if (!R.yoursNow.length) notes.push(`⭐ Facts you get right fast on two different days become yours. Come back tomorrow!`);
    $app.innerHTML = `<main class="wrap">
      <h1>Nice work, ${esc(S.name || 'Ellie')}! 🎉</h1>
      <p class="sub">${R.title} · ${st.items} questions</p>
      ${garden(known)}
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
    const tr = e.target.closest('[data-trick]');
    if (tr) return trickTap(tr.dataset.trick);
    const a = e.target.closest('[data-act]');
    if (!a) return;
    EM.speech.prime();
    switch (a.dataset.act) {
      case 'home': return go('home');
      case 'skills': return go('skills');
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
    if (h) { S.how[h.dataset.how] = (S.how[h.dataset.how] || 0) + 1; EM.save(); return closeOverlay(); }
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
  EM.recoverIfNeeded().then(r => { if (r) render(); });
  EM.persist();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  render();
  // Exposed for tests
  EM._run = () => R; EM._screen = () => screen; EM.startSession = startSession;
})();
