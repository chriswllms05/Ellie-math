/* Ellie Math — engine: saved state, two mastery models, gates, queues.
   No DOM here. Everything is attached to window.EM so the other scripts can use it. */
'use strict';
(function () {
  const EM = window.EM = window.EM || {};
  const STORE = 'elliemath.v2';
  const DAY = 86400000;
  const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16];   // by box
  const FLUENT_BOX = 2;                         // fast-right on two different days
  const WINDOW = 10, WINDOW_NEED = 8;           // procedures: 8 of last 10 unscaffolded, 2+ days
  const GATE = 0.8;

  // ---------- small helpers ----------
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const uniq = arr => [...new Set(arr)];
  const clone = o => JSON.parse(JSON.stringify(o));
  function shuffle(arr, rnd = Math.random) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  const pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
  function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function dayStr(t) { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function startOfDay(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  const fmt = n => Number(n).toLocaleString('en-US');
  Object.assign(EM, { range, uniq, clone, shuffle, pick, seeded, dayStr, startOfDay, fmt, DAY, FLUENT_BOX, INTERVAL_DAYS });

  // ---------- saved state ----------
  const DEFAULT = {
    v: 2,
    name: '',         // set on this device in the avatar builder; never in the repo
    avatar: null,     // her avatar, built by her; device only
    taught: {},       // Dot's notebook: facts she taught Dot
    theme: '',        // garden | ocean | space, picked by her on first launch
    created: 0,
    settings: { fastSec: 3, minutes: 15, blockMin: 5, blocks: 3, tts: true, pin: '', pinHint: '', bridge: { est: true, regroup: true }, roundFocus: 'auto', clockOnDigit: true },
    facts: {},        // key -> fact record (Leitner)
    skills: {},       // id -> { level, levels: { [level]: { window: [] } }, manual: false, lastReview: '' }
    sessions: [],     // { date, kind, items, fast, slow, wrong, idk, rushed, minutes, learned: [...], fastKeys: [...] }
    days: {},         // dayStr -> { minutes, items }
    how: { knew: 0, trick: 0, counted: 0 },
    placement: { done: false, at: 0 },
    yours: [],        // keys that have reached "hers" (for the garden, in order)
    unlockedSeen: {}, // skill ids whose unlock ceremony has been shown
    backupAt: 0,
    clipCount: 0,
  };
  let S = null;
  function migrate(s) {
    const out = { ...clone(DEFAULT), ...s };
    out.settings = { ...clone(DEFAULT.settings), ...(s.settings || {}) };
    out.settings.bridge = { ...clone(DEFAULT.settings.bridge), ...((s.settings || {}).bridge || {}) };
    // Dot's recorded voice arrived after some iPads had picked a device voice: switch everyone to it once.
    if (!out.settings.dotVoice) { out.settings.dotVoice = 1; out.settings.voiceURI = 'dot'; }
    out.v = 2;
    return out;
  }
  function load() {
    let raw = null;
    try { raw = localStorage.getItem(STORE); } catch (e) {}
    if (raw) { try { S = migrate(JSON.parse(raw)); } catch (e) { S = clone(DEFAULT); } }
    else S = clone(DEFAULT);
    if (!S.created) S.created = Date.now();
    EM.S = S;
    return S;
  }
  let saveT = 0;
  function save() {
    EM.S = S;
    const json = JSON.stringify(S);
    try { localStorage.setItem(STORE, json); } catch (e) {}
    // Mirror into IndexedDB so an evicted localStorage can be recovered.
    clearTimeout(saveT);
    saveT = setTimeout(() => idbPut('state', json).catch(() => {}), 300);
  }
  // Replace the state in place so every script holding a reference to EM.S stays valid.
  function adopt(obj) { for (const k of Object.keys(S)) delete S[k]; Object.assign(S, obj); save(); return S; }
  function replaceState(obj) { return adopt(migrate(obj)); }
  function resetState() { const d = clone(DEFAULT); d.created = Date.now(); return adopt(d); }
  // A clean start for her: every bit of practice, her world, avatar and name go; the grown-up setup stays
  // (PIN, settings, chosen voice, recorded clips and when they were recorded, last backup date).
  function freshStart() {
    const old = S, d = clone(DEFAULT);
    d.created = Date.now();
    d.settings = Object.assign(clone(DEFAULT.settings), clone(old.settings));
    for (const k of ['clipCount', 'clipDates', 'clipPlays', 'backupAt']) if (old[k] !== undefined) d[k] = clone(old[k]);
    return adopt(d);
  }

  // ---------- IndexedDB (state mirror + voice clips) ----------
  let dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('no idb'));
      const req = indexedDB.open('elliemath', 1);
      req.onupgradeneeded = () => { const d = req.result; if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv'); };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return dbP;
  }
  function idbPut(k, v) { return db().then(d => new Promise((res, rej) => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); })); }
  function idbGet(k) { return db().then(d => new Promise((res, rej) => { const tx = d.transaction('kv', 'readonly'); const r = tx.objectStore('kv').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); }
  function idbDel(k) { return db().then(d => new Promise((res, rej) => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); })); }
  // If localStorage came back empty but the mirror has data, restore it.
  async function recoverIfNeeded() {
    try {
      if (Object.keys(S.facts).length || S.sessions.length) return false;
      const json = await idbGet('state');
      if (!json) return false;
      const s = JSON.parse(json);
      if ((s.sessions || []).length || Object.keys(s.facts || {}).length) { adopt(migrate(s)); return true; }
    } catch (e) {}
    return false;
  }
  async function persist() { try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {} }
  Object.assign(EM, { load, save, replaceState, resetState, freshStart, idbPut, idbGet, idbDel, recoverIfNeeded, persist, DEFAULT });

  // ---------- fact mastery (Leitner, promote only on/after due day) ----------
  function factRec(key, create) {
    let r = S.facts[key];
    if (!r && create) r = S.facts[key] = { box: 0, due: 0, seen: 0, right: 0, wrong: 0, idk: 0, times: [], advDay: '', slowRun: 0, peak: 0, last: 0 };
    return r;
  }
  // outcome: 'fast' | 'slow' | 'wrong' | 'idk'. Returns { becameYours }.
  function gradeFact(key, outcome, ms, now = Date.now()) {
    const r = factRec(key, true);
    const today = dayStr(now);
    const wasBelow = r.box < FLUENT_BOX, wasEverHers = (r.peak || 0) >= FLUENT_BOX, hadTrouble = r.wrong + r.idk > 0;
    r.seen++; r.last = now;
    if (outcome === 'fast' || outcome === 'slow') {
      r.right++;
      if (ms > 0 && ms < 60000) { r.times.push(Math.round(ms)); if (r.times.length > 6) r.times.shift(); }
    }
    if (outcome === 'fast') {
      r.slowRun = 0;
      const dueOk = r.box === 0 || now >= startOfDay(r.due);
      if (dueOk && r.advDay !== today) {
        r.box = Math.min(5, r.box + 1); r.advDay = today;
        r.due = startOfDay(now + INTERVAL_DAYS[Math.max(1, r.box)] * DAY);
      }
      // early fast review: box and due untouched (interval is not restarted)
    } else if (outcome === 'slow') {
      r.slowRun++;
      if (r.slowRun >= 2 && r.box >= 2) { r.box--; r.slowRun = 0; }
      r.due = r.box ? startOfDay(now + DAY) : now;
    } else {
      r.box = 0; r.due = now; r.advDay = today; r.slowRun = 0;
      if (outcome === 'idk') r.idk++; else r.wrong++;
    }
    r.peak = Math.max(r.peak || 0, r.box);
    // First time hers: a celebration (big if she once missed it). Back again after slipping: a rescue.
    const becameYours = wasBelow && r.box >= FLUENT_BOX && !wasEverHers, rescued = wasBelow && r.box >= FLUENT_BOX && wasEverHers;
    if (becameYours && !S.yours.includes(key)) S.yours.push(key);
    if (becameYours && !r.hersAt) r.hersAt = now;
    if (becameYours) {
      const f = EM.FACTS[key];
      if (f && f.type === 'add' && f.a !== f.b) {
        const pk = `add:${f.b}+${f.a}`, p = EM.FACTS[pk] && factRec(pk, true);
        if (p && p.box < 1) { p.box = 1; p.due = startOfDay(now + DAY); p.peak = Math.max(p.peak || 0, 1); p.linked = key; }
      }
    }
    // Trace repeated misses to the smaller facts this one is built from; weak ones get practised first.
    let weakComps = [];
    if (becameYours && S.focus) delete S.focus[key];
    if ((outcome === 'wrong' || outcome === 'idk') && r.wrong + r.idk >= 2) {
      const comps = components(key);
      if (comps.length) {
        weakComps = comps.filter(c => !(S.facts[c] && S.facts[c].box >= FLUENT_BOX));
        weakComps.forEach(c => focusFact(c, now));
        (S.roots || (S.roots = {}))[key] = { weak: weakComps, at: now };
      }
    }
    save();
    return { becameYours, rescued, hadTrouble, weakComps };
  }
  // The smaller facts a strategy fact is built from (Dimensions strategies), only those that exist as facts.
  function components(key) {
    const f = EM.FACTS[key]; if (!f) return [];
    const out = [];
    if (f.type === 'add') {
      const big = Math.max(f.a, f.b), small = Math.min(f.a, f.b);
      if (big - small === 1 && small > 1) out.push(`add:${small}+${small}`); // near doubles: double, then 1 more
      else if (f.ans > 10 && big < 10 && small > 2) { const need = 10 - big, rest = small - need; out.push(`m10:${big}`, `bond:${small}:${Math.min(need, rest)}`, `add:10+${rest}`); }
    } else if (f.type === 'sub') {
      const { a, b, ans } = f, ones = a - 10;
      if (a > 10 && b >= 6 && b < 10) out.push(`sub:10-${b}`, `add:${10 - b}+${ones}`);
      else if (a > 10 && b > ones && b < 10) out.push(`sub:${a}-${ones}`, `sub:10-${b - ones}`);
      else if (a <= 10 && b > 2) out.push(`add:${b}+${ans}`);
    }
    return out.filter(k => EM.FACTS[k] && k !== key);
  }
  function focusFact(key, now = Date.now()) { if (!EM.FACTS[key]) return; (S.focus || (S.focus = {}))[key] = now + 7 * DAY; }
  const avgTime = r => r && r.times && r.times.length ? r.times.reduce((a, b) => a + b, 0) / r.times.length : 0;
  const isYours = key => { const r = S.facts[key]; return !!r && r.box >= FLUENT_BOX; };
  const countYours = () => Object.keys(S.facts).filter(isYours).length;
  // Her collection only grows: a fact that was ever hers stays in it (it may look thirsty until rescued).
  const isCollected = key => { const r = S.facts[key]; return !!r && ((r.peak || 0) >= FLUENT_BOX || r.box >= FLUENT_BOX); };
  const countCollected = () => Object.keys(S.facts).filter(isCollected).length;
  Object.assign(EM, { factRec, gradeFact, avgTime, isYours, countYours, isCollected, countCollected });

  // ---------- procedure mastery (window of recent unscaffolded items) ----------
  function skillRec(id) {
    let s = S.skills[id];
    if (!s) s = S.skills[id] = { level: 0, levels: {}, manual: false, lastReview: '' };
    return s;
  }
  function levelRec(id, level) { const s = skillRec(id); return s.levels[level] || (s.levels[level] = { window: [], seen: 0, right: 0, wrong: 0, idk: 0 }); }
  // scaff: true when the teaching scaffold (dot on the line, discs regrouped for her) was shown.
  function gradeProc(id, level, { ok, fast, scaff, outcome }, now = Date.now()) {
    const lr = levelRec(id, level);
    lr.seen++;
    if (ok) lr.right++; else if (outcome === 'idk') lr.idk++; else lr.wrong++;
    lr.window.push({ ok: !!ok, fast: !!fast, scaff: !!scaff, day: dayStr(now) });
    if (lr.window.length > 40) lr.window.shift();
    const sk = skillRec(id);
    const def = EM.SK[id];
    let leveledUp = false;
    if (levelFluent(id, level) && def && level === sk.level && level < def.levels.length - 1) { sk.level = level + 1; leveledUp = true; }
    if (def && sk.level === def.levels.length - 1 && levelFluent(id, sk.level)) { sk.lastReview = dayStr(now); sk.lastReviewAt = now; }
    save();
    return { leveledUp };
  }
  function recentUnscaffolded(id, level) { return levelRec(id, level).window.filter(w => !w.scaff).slice(-WINDOW); }
  function levelFluent(id, level) {
    const w = recentUnscaffolded(id, level);
    if (w.length < WINDOW) return false;
    const fastRight = w.filter(x => x.ok && x.fast).length;
    return fastRight >= WINDOW_NEED && uniq(w.map(x => x.day)).length >= 2;
  }
  // Teaching tier for a procedure at its current level: 0 full scaffold, 1 light scaffold, 2 none.
  function procTier(id, level) {
    if (levelFluent(id, level)) return 2;
    const w = levelRec(id, level).window.slice(-WINDOW);
    const rights = w.filter(x => x.ok).length;
    return rights < 3 ? 0 : 1;
  }
  // 0..1 progress toward fluency at the current level, for bars.
  function procProgress(id) {
    const def = EM.SK[id]; if (!def) return 0;
    const sk = skillRec(id), n = def.levels.length;
    if (levelFluent(id, sk.level)) return (sk.level + 1) / n;
    const w = recentUnscaffolded(id, sk.level);
    const part = Math.min(1, w.filter(x => x.ok && x.fast).length / WINDOW_NEED);
    return (sk.level + part * 0.9) / n;
  }
  Object.assign(EM, { skillRec, levelRec, gradeProc, levelFluent, procTier, procProgress });

  // ---------- skill status and gates ----------
  function factSkillStats(sk) {
    let yours = 0, learning = 0;
    for (const k of sk.facts) { const r = S.facts[k]; if (r) r.box >= FLUENT_BOX ? yours++ : learning++; }
    return { yours, learning, unseen: sk.facts.length - yours - learning, total: sk.facts.length, pct: yours / sk.facts.length };
  }
  // 'id' or 'id@level' (fluent at that level or past it)
  function reqMet(req) {
    const [id, lv] = req.split('@');
    const sk = EM.SK[id]; if (!sk) return true;
    if (sk.kind === 'fact') return factSkillStats(sk).pct >= GATE;
    const need = lv === undefined ? sk.levels.length - 1 : Number(lv);
    const rec = skillRec(id);
    return rec.level > need || levelFluent(id, need);
  }
  function isOpen(id) {
    const sk = EM.SK[id]; if (!sk) return false;
    if (skillRec(id).manual) return true;
    if (sk.track === 'C' && S.settings.bridge[id] === false) return false;
    if (S.unlockedSeen && S.unlockedSeen[id]) return true; // once she has it, a new prerequisite never takes it away
    return (sk.requires || []).every(reqMet);
  }
  function skillSummary(id) {
    const sk = EM.SK[id];
    if (sk.kind === 'fact') { const st = factSkillStats(sk); return { ...st, open: isOpen(id), progress: st.pct, learningPct: st.learning / st.total, done: st.pct >= GATE }; }
    const rec = skillRec(id);
    return { open: isOpen(id), progress: procProgress(id), learningPct: 0, level: rec.level, tier: procTier(id, rec.level), done: rec.level === sk.levels.length - 1 && levelFluent(id, rec.level) };
  }
  function newlyOpened() {
    const out = [];
    for (const sk of EM.SKILLS) if (isOpen(sk.id) && !S.unlockedSeen[sk.id]) { S.unlockedSeen[sk.id] = true; out.push(sk); }
    if (out.length) save();
    return out;
  }
  Object.assign(EM, { factSkillStats, isOpen, skillSummary, newlyOpened, GATE });

  // ---------- timing ----------
  function fastMs(item, step) {
    const base = S.settings.fastSec * 1000;
    const st = item.steps[step || 0];
    const digits = String(st.ans).length;
    let ms = base + 600 * Math.max(0, digits - 1);
    ms += ({ look: 1500, sub: 1000, rnd: 2000, pv: 2000, est: 2000, regroup: 1500, line: 3000, mental: 2000, skip: 1000, array: 1500, word: 9000 })[item.type] || 0;
    if (st.line) ms -= 600 * Math.max(0, digits - 1); // dragging, not typing digits
    if (item.type === 'rnd' && st.ans >= 1000) ms += 1000;
    if (st.extraMs) ms += st.extraMs;
    return ms;
  }
  const rushMs = item => item.type === 'rnd' || item.kind === 'proc' ? 1500 : 900;
  Object.assign(EM, { fastMs, rushMs });

  // ---------- queues ----------
  // Facts block: learning first, a few cold probes of new facts, due reviews, then more new; not-yet-due only as filler.
  // Easiest first within a skill: make 10 with +9 before +6, take 9 from a teen before 6, smaller sums before bigger.
  function difficulty(k) {
    const f = EM.FACTS[k]; if (!f) return 99;
    if (f.type === 'look') return f.n;
    if (f.type === 'm10') return 10 - Math.abs(5 - f.a);
    if (f.type === 'bond') return f.w * 10 + f.p;
    if (f.type === 'mul') return ({ 10: 0, 2: 20, 5: 40, 3: 60, 4: 80 })[f.b] + f.a;
    if (f.type === 'add') { const big = Math.max(f.a, f.b), small = Math.min(f.a, f.b); return f.a + f.b > 10 && big < 10 ? 100 + (10 - big) * 10 + small : f.a + f.b; }
    if (f.type === 'sub') return f.a > 10 ? 100 + (10 - Math.min(f.b, 9)) * 10 + f.a : f.a;
    return 50;
  }
  // Subtraction facts open as soon as their addition partner is hers, even before the subtraction skill opens.
  function familyKeys() {
    const out = [];
    for (const id of ['sub10', 'subteen']) {
      if (isOpen(id)) continue;
      for (const k of EM.SK[id].facts) { const f = EM.FACTS[k], c = f.a - f.b; if (EM.isCollected(`add:${f.b}+${c}`) || EM.isCollected(`add:${c}+${f.b}`)) out.push(k); }
    }
    return out;
  }
  // Facts block for catching up: a small active set of unknown facts (each seen three times, spaced),
  // mixed into mostly known and due facts. New facts enter only when the active set has room, easiest first.
  const ACTIVE = 8;
  function buildFactQueue(skillIds, len, now = Date.now(), opts = {}) {
    const order = new Map();
    const focus = S.focus || {}, isF = k => focus[k] > now;
    let keys = uniq([...skillIds.flatMap(id => EM.SK[id].facts), ...(opts.extraKeys || []), ...(opts.dueOnly ? [] : Object.keys(focus).filter(k => isF(k) && EM.FACTS[k]))]);
    keys.forEach((k, i) => order.set(k, i));
    if (opts.dueOnly) keys = keys.filter(k => S.facts[k] && (S.facts[k].box < 1 || startOfDay(S.facts[k].due) <= now));
    const rec = k => S.facts[k];
    const learning = keys.filter(k => rec(k) && rec(k).box < 1).sort((a, b) => (isF(b) - isF(a)) || (rec(a).last || 0) - (rec(b).last || 0));
    const active = learning.slice(0, ACTIVE);
    const due = keys.filter(k => rec(k) && rec(k).box >= 1 && startOfDay(rec(k).due) <= now).sort((a, b) => rec(a).due - rec(b).due);
    const unseen = keys.filter(k => !rec(k)).sort((a, b) => (isF(b) - isF(a)) || difficulty(a) - difficulty(b) || order.get(a) - order.get(b));
    const notDue = shuffle(keys.filter(k => rec(k) && rec(k).box >= 1 && startOfDay(rec(k).due) > now));
    const probes = opts.dueOnly ? [] : unseen.slice(0, Math.min(3, Math.max(0, ACTIVE - learning.length)));
    const unknownSlots = active.length * 3 + probes.length;
    const knownWant = Math.max(len - unknownSlots, unknownSlots * 2);
    const known = [...due, ...notDue.slice(0, 6)].slice(0, knownWant);
    const base = shuffle([...known.map(k => ({ key: k, mode: 'normal' })), ...probes.map(k => ({ key: k, mode: 'probe' }))]);
    // open with something she has gotten right before
    const first = base.findIndex(e => rec(e.key) && rec(e.key).box >= 1);
    if (first > 0) base.unshift(base.splice(first, 1)[0]);
    // weave each active fact in three times, about four items apart
    active.forEach((k, j) => {
      let p = Math.min(base.length, 1 + j * 2);
      ['normal', 'rehearse', 'rehearse'].forEach(mode => { base.splice(Math.min(p, base.length), 0, { key: k, mode }); p += 5; });
    });
    const used = new Set(base.map(e => e.key));
    return { queue: base, spare: due.filter(k => !used.has(k)) };
  }
  // Procedure block: weighted toward skills not yet fluent; fluent skills get a light review every few days.
  function pickProcSkills(skillIds, n, now = Date.now()) {
    const today = dayStr(now);
    const open = skillIds.filter(isOpen);
    const working = open.filter(id => !skillSummary(id).done);
    const review = open.filter(id => skillSummary(id).done && skillRec(id).lastReview !== today && (now - (skillRec(id).lastReviewAt || 0)) > 2 * DAY);
    const out = [];
    for (let i = 0; i < n; i++) {
      if (review.length && (i % 5 === 4 || !working.length)) out.push(review[i % review.length]);
      else if (working.length) out.push(working[i % working.length]);
    }
    return shuffle(out);
  }
  Object.assign(EM, { buildFactQueue, pickProcSkills, difficulty, familyKeys, components, focusFact });

  // ---------- session log ----------
  function logSession(sess) {
    S.sessions.push(sess);
    if (S.sessions.length > 400) S.sessions.shift();
    const d = dayStr(sess.date);
    const day = S.days[d] || (S.days[d] = { minutes: 0, items: 0 });
    day.minutes += sess.minutes; day.items += sess.items;
    save();
  }
  function weekNumber(now = Date.now()) { return Math.floor((startOfDay(now) - startOfDay(S.created)) / (7 * DAY)) + 1; }
  Object.assign(EM, { logSession, weekNumber });
})();
