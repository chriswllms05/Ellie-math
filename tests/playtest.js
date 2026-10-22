/* Browser play-tests for Ellie Math. Run: node tests/playtest.js (serves the folder on a local port).
   Personas: the knower, the guesser (random fast taps), the counter (right but slow), the IDK-spammer, the mixed kid.
   Also drives several simulated days to check spacing, mastery, unlocks and the parent view. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const EXE = process.env.CHROME || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p); fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(d); }); });

const log = (...a) => console.log(...a);
let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; log('  FAIL:', msg); } else log('  ok:', msg); };

async function setup(page, opts = {}) {
  await page.addInitScript((o) => {
    // fake clock so "days" pass, and silence speech so the clock starts immediately
    const base = o.now;
    let off = 0; try { off = Number(localStorage.getItem('__offset') || 0); } catch (e) {}
    Object.defineProperty(window, '__offset', { get: () => off, set: v => { off = v; try { localStorage.setItem('__offset', String(v)); } catch (e) {} } });
    const RealDate = Date;
    class FakeDate extends RealDate { constructor(...a) { if (!a.length) super(base + window.__offset); else super(...a); } static now() { return base + window.__offset; } }
    window.Date = FakeDate;
    // virtual time for performance.now so "slow" answers don't need real waiting
    window.__perf = 0; const realNow = performance.now.bind(performance); performance.now = () => realNow() + window.__perf;
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
  }, { now: opts.now || new Date(2026, 9, 22, 16, 0, 0).getTime() });
  page.on('pageerror', e => { failures++; log('  PAGE ERROR:', e.message); });
  page.on('console', m => { if (m.type() === 'error') { failures++; log('  CONSOLE ERROR:', m.text()); } });
}
const state = page => page.evaluate(() => ({ screen: EM._screen(), R: (() => { const R = EM._run(); return R ? { phase: R.phase, waitReady: R.waitReady, waitTrick: R.waitTrick, waitSpeech: R.waitSpeech, lock: R.lock, step: R.step, ans: R.cur && R.cur.steps[R.step].ans, key: R.cur && R.cur.key, kind: R.cur && R.cur.kind, type: R.cur && R.cur.type, mode: R.cur && R.cur.mode, helpStage: R.helpStage, bi: R.bi } : null; })() }));
async function waitSettled(page) {
  for (let i = 0; i < 60; i++) {
    const st = await state(page);
    if (st.screen !== 'practice') return st;
    if (document_overlay(await page.$('#overlay'))) { await page.click('#overlay [data-close], #overlay [data-how]'); await page.waitForTimeout(50); continue; }
    if (!st.R.lock && !st.R.waitSpeech) return st;
    await page.waitForTimeout(100);
  }
  return state(page);
}
const document_overlay = el => !!el;
async function clearOverlays(page) { for (let i = 0; i < 40; i++) { const o = await page.$('#overlay [data-close], #overlay [data-how]'); if (!o) return; await o.click(); await page.waitForTimeout(60); } }
async function nav(page, sel) { await clearOverlays(page); const w = await page.$('[data-tc]'); if (w) { await w.click(); await page.waitForTimeout(80); } const a = await page.$('[data-av-done]'); if (a) { await a.click(); await page.waitForTimeout(80); } await page.click(sel); await page.waitForTimeout(80); }
async function type(page, s) { for (const ch of String(s)) await page.keyboard.press(ch); }
async function answer(page, value, { delayMs = 0 } = {}) {
  if (delayMs) await page.evaluate(d => { window.__perf += d; }, delayMs);
  await type(page, value);
  await page.keyboard.press('Enter');
}
// Play a whole session with a persona. Returns stats.
async function play(page, persona, { maxItems = 400 } = {}) {
  let n = 0;
  while (n < maxItems) {
    const st = await waitSettled(page);
    if (st.screen === 'break') { await page.click('[data-act=nextblock]'); continue; }
    if (st.screen !== 'practice') break;
    const R = st.R;
    if (R.waitReady) { await page.click('[data-act=ready]'); await page.waitForTimeout(100); continue; }
    if (R.waitTrick) { await page.click('[data-trick]'); continue; }
    if (R.phase === 'help') {
      // in help: persona may still guess once, then follow
      const h = persona.help ? persona.help(R) : R.ans;
      await answer(page, h); await page.waitForTimeout(150); n++; continue;
    }
    const move = persona.move(R, n);
    if (move === 'idk') await page.click('[data-act=idk]');
    else await answer(page, move.value, { delayMs: move.delay || 0 });
    await page.waitForTimeout(150);
    n++;
  }
  return n;
}
const knower = { move: R => ({ value: R.ans, delay: 50 }) };
const counter = { move: R => ({ value: R.ans, delay: 4200 }) };         // right but slow: still counting
const guesser = { move: R => ({ value: Math.floor(Math.random() * 20), delay: 0 }), help: R => Math.floor(Math.random() * 20) }; // rapid random
const idkSpammer = { move: () => 'idk', help: () => 999 };
const mixed = { move: (R, n) => n % 4 === 1 ? 'idk' : n % 4 === 2 ? { value: R.ans + 1, delay: 300 } : { value: R.ans, delay: n % 2 ? 50 : 3600 } };

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port, URL_ = `http://localhost:${port}/index.html`;
  const browser = await chromium.launch({ executablePath: EXE, args: ['--mute-audio', '--disable-audio-output', '--autoplay-policy=no-user-gesture-required'] });

  const ONLY = process.env.ONLY || 'all';
  // ---------- 1. Placement + persona sessions, single day ----------
  if (ONLY === 'all' || ONLY === 'personas') for (const [name, persona] of [['knower', knower], ['guesser', guesser], ['idk-spammer', idkSpammer], ['counter', counter], ['mixed', mixed]]) {
    log(`\n== Persona: ${name}`);
    const ctx = await browser.newContext({ viewport: { width: 820, height: 1100 } });
    const page = await ctx.newPage(); await setup(page);
    await page.goto(URL_);
    await nav(page, '[data-act=placement]');
    const nP = await play(page, persona, { maxItems: 120 });
    let st = await state(page);
    check(st.screen === 'summary', `${name}: placement ends on summary after ${nP} items`);
    await page.screenshot({ path: `/tmp/em-${name}-placement.png`, fullPage: true });
    await nav(page, '[data-act=home]');
    await nav(page, '[data-act=today]');
    const n = await play(page, persona, { maxItems: 700 });
    st = await state(page);
    check(st.screen === 'summary', `${name}: daily session ends on summary after ${n} items`);
    const sess = await page.evaluate(() => EM.S.sessions[EM.S.sessions.length - 1]);
    log('  session:', JSON.stringify({ items: sess.items, fast: sess.fast, slow: sess.slow, wrong: sess.wrong, idk: sess.idk, rushed: sess.rushed, learned: sess.learned.length, min: sess.minutes }));
    if (name === 'guesser') check(sess.rushed > 0, 'guesser gets rushed flags');
    if (name === 'guesser') check(sess.fast <= sess.items * 0.25, 'guesser earns few fast-rights');
    if (name === 'counter') check(sess.slow > sess.fast, 'counter is mostly slow-right, not fast');
    if (name === 'idk-spammer') { const yours = await page.evaluate(() => EM.countYours()); check(yours === 0, 'idk-spammer owns no facts'); check(sess.fast === 0, 'idk-spammer earns no fast credit via help'); }
    await page.screenshot({ path: `/tmp/em-${name}-summary.png`, fullPage: true });
    await ctx.close();
  }

  // ---------- 2. Multi-day knower: spacing, mastery, unlocks, parent view ----------
  if (ONLY === 'all' || ONLY === 'days') {
  log('\n== Multi-day knower');
  const ctx = await browser.newContext({ viewport: { width: 820, height: 1100 } });
  const page = await ctx.newPage(); await setup(page);
  await page.goto(URL_);
  await nav(page, '[data-act=placement]'); await play(page, knower, { maxItems: 120 }); await nav(page, '[data-act=home]');
  const yoursByDay = [];
  for (let day = 1; day <= 6; day++) {
    await page.evaluate(d => { window.__offset = d * 86400000; }, day);
    await page.reload(); await page.waitForTimeout(200);
    await nav(page, '[data-act=today]');
    await play(page, knower, { maxItems: 300 });
    const st = await state(page);
    check(st.screen === 'summary', `day ${day}: session completes`);
    const info = await page.evaluate(() => ({ yours: EM.countYours(), boxes: Object.values(EM.S.facts).map(r => r.box), open: EM.SKILLS.filter(s => EM.isOpen(s.id)).map(s => s.id) }));
    yoursByDay.push(info.yours);
    log(`  day ${day}: yours=${info.yours} maxBox=${Math.max(...info.boxes)} open=${info.open.length}`);
    await nav(page, '[data-act=home]');
  }
  check(yoursByDay[1] > 0 && yoursByDay[0] === 0 || yoursByDay[1] > yoursByDay[0], 'facts become hers only from day 2 (two different days)');
  const maxBox = await page.evaluate(() => Math.max(...Object.values(EM.S.facts).map(r => r.box)));
  check(maxBox <= 3, `after 6 days no fact is above box 3 (spacing holds; got ${maxBox})`);
  const open = await page.evaluate(() => EM.SKILLS.filter(s => EM.isOpen(s.id)).map(s => s.id));
  check(open.length > 7, `more rungs opened for a knower (${open.length})`);
  // parent view
  await page.evaluate(() => EM.go('parent'));
  await page.waitForTimeout(200);
  await page.fill('#pin', '1234'); await page.fill('#pinHint', 'test'); await page.click('[data-act=pin]'); await page.waitForTimeout(200);
  check(!!(await page.$('[data-set=fastSec]')), 'settings unlock after PIN');
  await page.screenshot({ path: '/tmp/em-parent.png', fullPage: true });
  await ctx.close();
  }

  // ---------- 3. Content sanity: every help string renders without undefined/NaN; answers fit the pad ----------
  if (ONLY === 'all' || ONLY === 'sanity') {
  log('\n== Content sanity');
  const ctx3 = await browser.newContext(); const page3 = await ctx3.newPage(); await setup(page3); await page3.goto(URL_);
  const bad = await page3.evaluate(() => {
    const out = [];
    const chk = (item, where) => {
      for (let i = 0; i < item.steps.length; i++) {
        const st = item.steps[i];
        if (!Number.isInteger(st.ans) || st.ans < 0 || String(st.ans).length > 5) out.push(`${where}: bad ans ${st.ans}`);
        for (const stage of [1, 2]) { const h = item.help(i, stage, st.ans + 1); const txt = (h.html || '') + (h.say || '') + (h.vis || ''); if (/undefined|NaN|\[object/.test(txt)) out.push(`${where} step${i} stage${stage}: ${txt.slice(0, 80)}`); if (!h.html || !h.say) out.push(`${where} step${i} stage${stage}: empty help`); }
        if (/undefined|NaN/.test(st.html + st.say)) out.push(`${where} prompt: ${st.html}`);
      }
    };
    for (const k of Object.keys(EM.FACTS)) chk(EM.factItem(k, 'normal'), k);
    for (const sk of EM.SKILLS.filter(s => s.kind === 'proc')) for (let lv = 0; lv < sk.levels.length; lv++) for (let t = 0; t < 3; t++) for (let rep = 0; rep < 25; rep++) chk(EM.procItem(sk.id, lv, t), `${sk.id}@${lv}/t${t}`);
    return out;
  });
  check(bad.length === 0, `content sanity (${bad.length} problems)`); bad.slice(0, 15).forEach(b => log('   ', b));
  // estimation answers are consistent
  const estBad = await page3.evaluate(() => { const out = []; for (let i = 0; i < 60; i++) { const it = EM.procItem('est', i % 3, 1); const [r1, r2, c] = it.steps; const to = it.steps[0].ans % 1000 === 0 && it.level === 2 ? 1000 : 100; if (![ '+', '−'].some(op => (op === '+' ? r1.ans + r2.ans : r1.ans - r2.ans) === c.ans)) out.push(it.label + ' -> ' + it.steps.map(s => s.ans).join(',')); } return out; });
  check(estBad.length === 0, `estimation steps consistent (${estBad.length} bad)`); estBad.slice(0, 5).forEach(b => log('   ', b));
  const regBad = await page3.evaluate(() => { const out = []; for (let lv = 0; lv < 4; lv++) for (let i = 0; i < 40; i++) { const it = EM.procItem('regroup', lv, 1); const m = it.label.match(/([\d,]+) ([+−]) ([\d,]+)/); const a = Number(m[1].replace(/,/g, '')), b = Number(m[3].replace(/,/g, '')); const total = m[2] === '+' ? a + b : a - b; const fin = it.steps[it.steps.length - 1].ans; if (fin !== total) out.push(it.label + ' final ' + fin); const cols = it.steps.slice(0, -1).map(s => s.ans); const digits = String(total).padStart(cols.length - 1, '0').split('').reverse().map(Number); for (let c = 0; c < cols.length - 1; c++) if (cols[c] !== digits[c]) out.push(`${it.label} col${c} ${cols[c]} vs ${digits[c]}`); } return out; });
  check(regBad.length === 0, `regrouping steps consistent (${regBad.length} bad)`); regBad.slice(0, 5).forEach(b => log('   ', b));
  // column picture reads left-to-right; Sam answers positive and judged with tolerance; no negatives in help; neighbors count has no repeats
  const more = await page3.evaluate(() => {
    const out = [], strip = h => h.replace(/&nbsp;/g, '').replace(/<[^>]+>/g, '').trim();
    for (let i = 0; i < 40; i++) { const it = EM.procItem('regroup', i % 4, 1); const m = it.label.match(/([\d,]+) ([+−]) ([\d,]+)/); const a = Number(m[1].replace(/,/g, '')), b = Number(m[3].replace(/,/g, '')); const total = m[2] === '+' ? a + b : a - b; const cols = it.steps.slice(0, -1).map(s => s.ans); const html = EM.pics.column(a, b, m[2], cols, {}); const res = strip(html.split('class="r res">')[1].split('</div>')[0]); if (Number(res) !== total) out.push(`column render ${it.label} shows ${res}`); }
    for (let i = 0; i < 300; i++) { const it = EM.procItem('est', 1 + (i % 2), 1); for (const st of it.steps) if (st.ans <= 0) out.push(`est nonpositive ${it.label} ${st.ans}`); const sam = it.steps.find(s => s.sam); if (sam) { const m = sam.html.match(/= <b>([\d,]+)<\/b>/); const samVal = Number(m[1].replace(/,/g, '')); const exact = (() => { const mm = it.label.match(/([\d,]+) ([+−]) ([\d,]+)/); const a = Number(mm[1].replace(/,/g, '')), b = Number(mm[3].replace(/,/g, '')); return mm[2] === '+' ? a + b : a - b; })(); const right = samVal === exact; if (right && it.samCaught) out.push(`sam right but flagged caught: ${it.label} sam ${samVal}`); if (!right && !it.samCaught) out.push(`sam wrong but not caught: ${it.label} sam ${samVal}`); } }
    for (const k of Object.keys(EM.FACTS)) for (const stage of [1, 2]) { const h = EM.factItem(k, 'normal').help(0, stage); if (/-\d/.test(h.html + h.say)) out.push(`negative in help ${k}: ${h.say}`); }
    for (let i = 0; i < 60; i++) { const it = EM.procItem('neighbors', i % 3, 1); const say = it.help(0, 1).say; const nums = (say.match(/[\d,]+/g) || []).map(x => x.replace(/,/g, '')); for (let j = 1; j < nums.length; j++) if (nums[j] === nums[j - 1]) out.push(`repeated neighbor count: ${say}`); }
    for (let i = 0; i < 40; i++) { const it = EM.procItem('regroup', 1 + 2 * (i % 2), 1); for (const st of it.steps) if (/-\d/.test(st.html + st.say)) out.push(`negative in column prompt ${it.label}: ${st.say}`); }
    // state stays bound after reset/restore
    const before = EM.S; EM.resetState(); const same1 = EM.S === before; EM.replaceState(JSON.parse(JSON.stringify(EM.DEFAULT))); const same2 = EM.S === before; if (!same1 || !same2) out.push('state object rebinds on reset/restore');
    return out;
  });
  check(more.length === 0, `review regressions (${more.length} problems)`); more.slice(0, 12).forEach(b => log('   ', b));
  await ctx3.close();
  }

  await browser.close(); server.close();
  log(`\n${failures ? failures + ' FAILURE(S)' : 'ALL CHECKS PASSED'}`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
