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
    name: 'Ellie',
    created: 0,
    settings: { fastSec: 3, blockMin: 5, blocks: 3, tts: true, pin: '', pinHint: '', bridge: { est: true, regroup: true }, roundFocus: 'auto', clockOnDigit: true },
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
  Object.assign(EM, { load, save, replaceState, resetState, idbPut, idbGet, idbDel, recoverIfNeeded, persist, DEFAULT });

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
    const wasBelow = r.box < FLUENT_BOX;
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
    const becameYours = wasBelow && r.box >= FLUENT_BOX;
    if (becameYours && !S.yours.includes(key)) S.yours.push(key);
    save();
    return { becameYours };
  }
  const avgTime = r => r && r.times && r.times.length ? r.times.reduce((a, b) => a + b, 0) / r.times.length : 0;
  const isYours = key => { const r = S.facts[key]; return !!r && r.box >= FLUENT_BOX; };
  const countYours = () => Object.keys(S.facts).filter(isYours).length;
  Object.assign(EM, { factRec, gradeFact, avgTime, isYours, countYours });

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
    ms += ({ look: 1500, sub: 1000, rnd: 2000, pv: 2000, est: 2000, regroup: 1500 })[item.type] || 0;
    if (item.type === 'rnd' && st.ans >= 1000) ms += 1000;
    if (st.extraMs) ms += st.extraMs;
    return ms;
  }
  const rushMs = item => item.type === 'rnd' || item.kind === 'proc' ? 1500 : 900;
  Object.assign(EM, { fastMs, rushMs });

  // ---------- queues ----------
  // Facts block: learning first, a few cold probes of new facts, due reviews, then more new; not-yet-due only as filler.
  function buildFactQueue(skillIds, len, now = Date.now(), opts = {}) {
    let keys = uniq(skillIds.flatMap(id => EM.SK[id].facts));
    // Evening review: only facts she is learning or that are due today; nothing new.
    if (opts.dueOnly) keys = keys.filter(k => S.facts[k] && (S.facts[k].box < 1 || startOfDay(S.facts[k].due) <= now));
    const rec = k => S.facts[k];
    const learning = shuffle(keys.filter(k => rec(k) && rec(k).box < 1));
    const due = keys.filter(k => rec(k) && rec(k).box >= 1 && startOfDay(rec(k).due) <= now).sort((a, b) => rec(a).due - rec(b).due);
    const unseen = shuffle(keys.filter(k => !rec(k)));
    const notDue = shuffle(keys.filter(k => rec(k) && rec(k).box >= 1 && startOfDay(rec(k).due) > now));
    const q = [], used = new Set();
    const push = (k, mode) => { if (!used.has(k) && q.length < len) { used.add(k); q.push({ key: k, mode }); } };
    learning.slice(0, 6).forEach(k => push(k, 'normal'));
    unseen.slice(0, Math.max(0, Math.min(5, 8 - q.length))).forEach(k => push(k, 'probe'));
    due.forEach(k => push(k, 'normal'));
    learning.forEach(k => push(k, 'normal'));
    unseen.slice(0, 10).forEach(k => push(k, 'probe'));
    notDue.slice(0, 4).forEach(k => push(k, 'normal'));
    shuffle(q);
    // open with something she has at least once gotten right, when possible
    const first = q.findIndex(e => rec(e.key) && rec(e.key).box >= 1);
    if (first > 0) q.unshift(q.splice(first, 1)[0]);
    return { queue: q, spare: due.filter(k => !used.has(k)) };
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
  Object.assign(EM, { buildFactQueue, pickProcSkills });

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
