/* Village checks and screenshots. Run: node tests/village-shots.js [outdir]
   Drives a fresh start (avatar, the arrival story), walking to the pond, fishing (catch, rushed miss with help,
   "I don't know", quick double taps on the pad), session logging, building (place, afford, paint, drag, put away),
   the bridge planks and the meadow, and the notice board. Landscape iPad sizes; upright shows the turn-sideways card. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = process.argv[2] || '/tmp';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); });
let failures = 0; const check = (c, m) => { console.log(c ? '  ok:' : '  FAIL:', m); if (!c) failures++; };

(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: EXE });
  for (const [vw, vh, tag] of [[1194, 834, 'ipad11'], [1024, 768, 'ipad4x3'], [1133, 744, 'ipadmini']]) {
    console.log(`== ${tag}`);
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
    await page.route('**/voice/index.json', r => r.fulfill({ contentType: 'application/json', body: '{"packs":[],"clips":{}}' }));
    page.on('pageerror', e => { failures++; console.log('  PAGE ERROR:', e.message); });
    page.on('console', m => { if (m.type() === 'error') { failures++; console.log('  CONSOLE ERROR:', m.text()); } });
    await page.goto(`http://localhost:${server.address().port}/`);
    const shot = n => page.screenshot({ path: `${OUT}/village-${tag}-${n}.png` });
    const sp = async (x, y) => page.evaluate(([x, y]) => { const r = document.getElementById('vstage').getBoundingClientRect(), c = EM.village._scene().cam; return { x: r.left + (x - c.x) / c.w * r.width, y: r.top + (y - c.y) / c.h * r.height }; }, [x, y]);
    const tapScene = async (x, y) => { const q = await sp(x, y); await page.mouse.click(q.x, q.y); };

    // ---- fresh start: no world picker; avatar, then the village and its story ----
    check((await page.evaluate(() => EM._screen())) === 'avatar', 'a fresh start opens the avatar builder (no world picker)');
    await page.fill('#avName', 'Mia'); await page.click('[data-av-done]');
    await page.waitForSelector('.vdialog'); await page.waitForTimeout(1200); await shot('00-story');
    for (let i = 0; i < 12 && await page.$('.vdialog'); i++) { await page.click('.vdialog').catch(() => {}); await page.waitForTimeout(250); await page.click('.vdialog').catch(() => {}); await page.waitForTimeout(400); }
    await page.waitForFunction(() => EM.village.state().introDone, null, { timeout: 8000 });
    check(true, 'the arrival story plays through and ends on "tap the pond"');
    check((await page.evaluate(() => EM.village.state().coins)) === 0, 'she starts with no coins');

    // ---- the pond: she walks there, the camera zooms in ----
    await page.waitForTimeout(300);
    await tapScene(60, 160);
    await page.waitForTimeout(700);
    check(await page.evaluate(() => EM.village._her().path.length > 0 || EM.village._mode() === 'fish'), 'tapping the pond makes her walk there');
    await page.waitForSelector('.fishing', { timeout: 8000 }); await page.waitForFunction(() => EM.village._fish() && EM.village._fish().phase === 'ask', null, { timeout: 8000 });
    await shot('01-fishing');
    const ans = () => page.evaluate(() => EM.village._fish().f.ans);
    const typeAns = async n => { for (const d of String(n)) await page.click(`[data-fd="${d}"]`); await page.click('[data-v=fok]'); };
    const nextAsk = () => page.waitForFunction(() => EM.village._fish() && EM.village._fish().phase === 'ask' && !EM.village._fish().help, null, { timeout: 10000 });
    let key = await page.evaluate(() => EM.village._fish().key);
    await page.waitForTimeout(900); await typeAns(await ans());
    check((await page.evaluate(() => EM.village.state().coins)) === 1, 'a right answer catches a fish and sells it for a coin');
    check(await page.evaluate(k => !!EM.S.facts[k] && EM.S.facts[k].seen >= 1, key), 'the fact was graded by the engine');
    await page.waitForTimeout(500); await shot('02-catch');
    await page.evaluate(() => document.querySelectorAll('.vover [data-ov]').forEach(b => b.click()));
    // quick double tap on the same key registers twice
    await nextAsk();
    const q1 = await page.$eval('[data-fd="1"]', e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.click(q1.x, q1.y); await page.mouse.click(q1.x, q1.y);
    check((await page.evaluate(() => EM.village._fish().input)) === '11', 'two quick taps on 1 type 11');
    await page.click('[data-v=fback]'); await page.click('[data-v=fback]');
    // a rushed wrong answer: no fish, help, flagged
    await typeAns((await ans() + 3) % 10);
    check(await page.evaluate(() => !!EM.village._fish().help && /Dot/.test(document.getElementById('jbub').textContent)), 'a miss opens help in Dot\'s bubble');
    check((await page.evaluate(() => EM.village.state().coins)) === 1, 'a miss catches nothing');
    check((await page.evaluate(() => EM.village._fish().stats.rushed)) === 1, 'an instant wrong answer is flagged as rushed');
    await page.waitForTimeout(400); await shot('03-help');
    await typeAns(await ans());
    // "I don't know" is safe
    await nextAsk(); await page.click('[data-v=jidk]');
    check(await page.evaluate(() => !!EM.village._fish().help) && (await page.evaluate(() => EM.village.state().coins)) === 1, '"I don\'t know" opens help and costs nothing');
    await typeAns(await ans());
    // back to the village logs a session
    await nextAsk();
    const nSess = await page.evaluate(() => EM.S.sessions.length);
    await page.click('[data-v=stopfish]');
    await page.waitForSelector('.village:not(.fishing)'); await page.waitForTimeout(1200);
    const last = await page.evaluate(() => EM.S.sessions[EM.S.sessions.length - 1]);
    check((await page.evaluate(() => EM.S.sessions.length)) === nSess + 1 && last.kind === 'fishing' && last.items === 3, `fishing logs a session (${last && last.items} answers)`);

    // ---- building ----
    await page.evaluate(() => { EM.village.state().coins = 3; EM.save(); });
    await tapScene(150, 150); await page.waitForSelector('.vtray', { timeout: 6000 });
    await page.click('[data-item=flowers]');
    const cell = (cx, cy, a = 'plot') => a === 'plot' ? [146 + cx * 16 + 8, 134 + cy * 16 + 8] : [222 + cx * 16 + 8, 10 + cy * 16 + 8];
    await tapScene(...cell(1, 1));
    let st = await page.evaluate(() => EM.village.state());
    check(st.placed.length === 1 && st.placed[0].item === 'flowers' && st.coins === 1, `placed flowers for 2 coins (coins now ${st.coins})`);
    await page.click('[data-item=flowers]'); await tapScene(...cell(2, 1));
    check((await page.evaluate(() => EM.village.state().placed.length)) === 1, 'cannot buy without enough coins');
    await page.click('[data-item=flowers]');
    await tapScene(...cell(1, 1));
    check(await page.$('.vpaints') !== null, 'tapping a placed thing opens paint and move');
    await page.click('[data-paint=yellow]');
    check((await page.evaluate(() => EM.village.state().placed[0].paint)) === 'yellow', 'painted the flowers yellow');
    const a = await sp(...cell(1, 1)), b = await sp(...cell(4, 2));
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
    st = await page.evaluate(() => EM.village.state());
    check(st.placed[0].cx === 4 && st.placed[0].cy === 2, 'dragged the flowers to a new spot');
    await page.waitForTimeout(150); await shot('04-build');
    await page.click('[data-v=putaway]');
    st = await page.evaluate(() => EM.village.state());
    check(st.placed.length === 0 && st.coins === 3, 'putting it away gives the coins back');
    await page.click('[data-v=done]');

    // ---- the bridge: one plank per make-10 fact that is hers, then the meadow ----
    await page.evaluate(() => { EM.SK.m10.facts.slice(0, 3).forEach(k => { const r = EM.factRec(k, true); r.box = 3; r.peak = 3; }); EM.save(); EM.go('home'); });
    await page.waitForFunction(() => EM.village.state().planks === 3, null, { timeout: 15000 });
    check(true, 'three make-10 facts lay three planks');
    await page.waitForTimeout(800); await shot('05-planks');
    await page.evaluate(() => { EM.SK.m10.facts.slice(0, 8).forEach(k => { const r = EM.factRec(k, true); r.box = 3; r.peak = 3; }); EM.save(); EM.go('home'); });
    await page.waitForFunction(() => EM.village.state().open.meadow, null, { timeout: 25000 });
    check((await page.evaluate(() => EM.village.state().planks)) === 8, 'eight planks fix the bridge and open the meadow');
    await page.waitForTimeout(3500);
    await page.evaluate(() => { EM.village.state().coins = 200; EM.save(); EM.go('home'); }); await page.waitForTimeout(600);
    await tapScene(150, 150); await page.waitForSelector('.vtray', { timeout: 6000 });
    check(await page.$('[data-item=sheep]') !== null, 'meadow things appear in the build tray');
    for (const [item, cx, cy] of [['flowers', 0, 0], ['tree', 1, 0], ['bench', 2, 0], ['lantern', 3, 0], ['birdhouse', 4, 0], ['well', 5, 1], ['pumpkin', 0, 2], ['bush', 1, 2], ['doghouse', 3, 2], ['flag', 5, 0]]) { await page.click(`[data-item=${item}]`); await tapScene(...cell(cx, cy)); }
    for (const [item, cx, cy] of [['sheep', 0, 0], ['hay', 2, 0], ['scarecrow', 3, 1], ['sheep', 1, 1]]) { await page.click(`[data-item=${item}]`); await tapScene(...cell(cx, cy, 'meadow')); }
    await page.click('[data-v=done]'); await page.waitForTimeout(900);
    check((await page.evaluate(() => EM.village.state().placed.length)) === 14, 'built 14 things across the yard and the meadow');
    await shot('06-built');

    // ---- Dot's guide and the orchard ----
    check(await page.isVisible('#vguide') && /note on the board/.test(await page.textContent('#vguide')), "Dot's guide names the next job (the board's note, before placement)");
    await page.evaluate(() => { EM.S.placement.done = true; EM.save(); });
    await page.waitForFunction(() => /Rosa/.test(document.getElementById('vguide').textContent), null, { timeout: 4000 });
    check(/Today's orders/.test(await page.textContent('#vguide')), `after placement, today's orders start with Rosa: "${(await page.textContent('#vguide')).trim()}"`);
    await shot('07a-guide');
    await tapScene(86, 102); await page.waitForSelector('.orchard', { timeout: 10000 });
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'hello', null, { timeout: 6000 });
    check(/Rosa/.test(await page.textContent('#jbub')), 'the first time, Rosa says hello and promises a surprise');
    await shot('07a2-rosa-hello');
    await page.click('#vstage');
    const oAsk = () => page.waitForFunction(() => EM.village._orch() && EM.village._orch().phase === 'ask' && !EM.village._orch().waitSpeech, null, { timeout: 12000 });
    await oAsk(); await page.waitForTimeout(300); await shot('07b-orchard');
    const o1 = await page.evaluate(() => { const O = EM.village._orch(); return { a: O.f.a, b: O.f.b, ans: O.f.ans, coins: EM.village.state().coins, sign: document.getElementById('jsign').textContent }; });
    check(o1.a > 0 && o1.b > 0 && o1.sign.includes(`${o1.a} + ${o1.b}`), `the sign asks ${o1.a} + ${o1.b} (no zero facts in the orchard)`);
    await page.waitForTimeout(900);
    for (const d of String(o1.ans)) await page.click(`.jpad [data-fd="${d}"]`);
    await page.click('.jpad [data-v=fok]'); await page.waitForTimeout(300);
    check((await page.evaluate(() => EM.village.state().coins)) === o1.coins + 1 && (await page.evaluate(() => EM.village._orch().picked)) === 1, 'a right answer earns a coin from Rosa');
    check((await page.evaluate(() => EM.village.orders().list[0].got)) === 1, "and moves Rosa's order forward");
    await shot('07c-orchard-right');
    await oAsk();
    await page.evaluate(() => { const O = EM.village._orch(); O.t0 = performance.now(); });
    const wrong = await page.evaluate(() => EM.village._orch().f.ans + 1);
    for (const d of String(wrong)) await page.click(`.jpad [data-fd="${d}"]`);
    await page.click('.jpad [data-v=fok]'); await page.waitForTimeout(700);
    const oh = await page.evaluate(() => ({ crates: !!EM.village._orch().crates, help: !!EM.village._orch().help, rushed: EM.village._orch().stats.rushed, coins: EM.village.state().coins, bub: document.getElementById('jbub').textContent }));
    check(oh.help && oh.crates && oh.coins === o1.coins + 1, 'a miss pays nothing and turns the baskets into crates of ten');
    check(oh.rushed === 1, 'an instant wrong answer is flagged as rushed');
    check(/Dot/.test(oh.bub) && !/frame|dots/.test(oh.bub), `Dot's help uses orchard words: "${oh.bub.slice(0, 70)}"`);
    await shot('07d-orchard-help');
    await page.click('[data-v=leavejob]'); await page.waitForSelector('.village:not(.orchard)', { timeout: 6000 }); await page.waitForTimeout(1400);
    const ol = await page.evaluate(() => EM.S.sessions[EM.S.sessions.length - 1]);
    check(ol.kind === 'orchard' && ol.items === 2, `the orchard logs a session (${ol.items} answers)`);

    // ---- Rosa's surprise: three full rounds ----
    await page.click('[data-v=orchard]'); await page.waitForSelector('.orchard', { timeout: 10000 }); await oAsk();
    await page.evaluate(() => { EM.village.state().orchardRounds = 2; EM.village._job().picked = 4; });
    const og = await page.evaluate(() => EM.village._job().f.ans); await page.waitForTimeout(900);
    for (const d of String(og)) await page.click(`.jpad [data-fd="${d}"]`); await page.click('.jpad [data-v=fok]');
    await page.waitForSelector('.vover [data-ov]', { timeout: 6000 }); await page.click('.vover [data-ov]');
    await page.waitForSelector('.vgift', { timeout: 6000 }); await shot('07e-gift');
    check(/apple tree/.test(await page.textContent('.vover')), 'after three full rounds, Rosa gives her an apple tree');
    await page.click('.vover [data-ov=tobuild]'); await page.waitForSelector('[data-item=appletree]', { timeout: 10000 });
    check(/Gift/.test(await page.textContent('[data-item=appletree]')), 'the gift waits in the yard tray, free');
    await page.click('[data-v=done]'); await page.waitForTimeout(800);

    // ---- Mr. Pip's market opens with partners of 10 ----
    await page.evaluate(() => { EM.SK.m10.facts.forEach(k => { const r = EM.factRec(k, true); r.box = 3; r.peak = 3; }); EM.save(); EM.go('home'); });
    await page.waitForSelector('[data-v=market]', { timeout: 30000 }); await page.waitForTimeout(800);
    check(true, 'once partners of 10 are hers, a Help Mr. Pip button appears');
    await page.click('[data-v=market]'); await page.waitForSelector('.market', { timeout: 30000 });
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'hello', null, { timeout: 8000 }); await page.click('#vstage');
    await oAsk(); await page.waitForTimeout(300); await shot('07f-market');
    const m1 = await page.evaluate(() => { const O = EM.village._job(); return { a: O.f.a, b: O.f.b, ans: O.f.ans, coins: EM.village.state().coins, sign: document.getElementById('jsign').textContent, bub: document.getElementById('jbub').textContent }; });
    check(m1.sign.includes(`${m1.a} − ${m1.b}`) && /coins back/.test(m1.bub), `Mr. Pip asks for his coins back: ${m1.a} − ${m1.b}`);
    await page.waitForTimeout(900);
    for (const d of String(m1.ans)) await page.click(`.jpad [data-fd="${d}"]`); await page.click('.jpad [data-v=fok]'); await page.waitForTimeout(300);
    check((await page.evaluate(() => EM.village.state().coins)) === m1.coins + 1, 'a right answer earns a coin from Mr. Pip');
    await oAsk(); await page.click('[data-v=jidk]'); await page.waitForTimeout(700);
    const mh = await page.evaluate(() => ({ trays: !!EM.village._job().crates, bub: document.getElementById('jbub').textContent }));
    check(mh.trays && !/frame|dots/.test(mh.bub), `help counts his coins in trays of ten: "${mh.bub.slice(0, 60)}"`);
    await shot('07g-market-help');
    await page.click('[data-v=leavejob]'); await page.waitForSelector('.village:not(.market)', { timeout: 6000 }); await page.waitForTimeout(1500);

    // ---- the morning orders: the board lists them; when all are done the village says thank you ----
    await page.evaluate(() => EM.village.openBoard()); await page.waitForSelector('.vorders');
    check(await page.$('[data-b=lesson]') !== null && (await page.$$('.vorders li')).length === 3, "the board lists today's three orders and Dot's lesson");
    await shot('07h-board-orders'); await page.click('[data-b=close]');
    const c0 = await page.evaluate(() => { const o = EM.village.orders(), c = EM.village.state().coins; o.list.forEach(x => { x.got = x.need; }); EM.save(); EM.go('home'); return c; });
    await page.waitForFunction(() => /orders are done/.test((document.querySelector('.vover') || {}).textContent || ''), null, { timeout: 15000 });
    check((await page.evaluate(() => EM.village.state().coins)) === c0 + 5, 'all three orders done: a thank-you and 5 bonus coins');
    await shot('07i-day-done'); await page.click('.vover [data-ov]');
    check((await page.evaluate(() => EM.todayDone())), 'and the day counts as done');
    await page.evaluate(() => { EM.S.placement.done = false; EM.save(); });

    // ---- the notice board ----
    await tapScene(186, 98); await page.waitForSelector('.vboard', { timeout: 6000 });
    check(await page.$('[data-b=placement]') !== null, 'the notice board offers placement first');
    await shot('07-board');
    await page.click('[data-b=placement]');
    check((await page.evaluate(() => EM._screen())) === 'practice', 'the board starts placement');
    await ctx.close();
  }
  { // held upright: the app hides behind the turn-sideways card
    console.log('== upright');
    const ctx = await browser.newContext({ viewport: { width: 834, height: 1112 }, serviceWorkers: 'block' }); const page = await ctx.newPage();
    await page.goto(`http://localhost:${server.address().port}/`);
    check(await page.isVisible('#turn') && !(await page.isVisible('#app')), 'upright shows only the turn-sideways card');
    await page.screenshot({ path: `${OUT}/village-upright-turn.png` }); await ctx.close();
  }
  await browser.close(); server.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL VILLAGE CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
