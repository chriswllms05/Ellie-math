/* Village (v2 slice 1) checks and screenshots. Run: node tests/village-shots.js [outdir]
   Drives the map, build mode (place, paint, drag, put away), fishing (fast catch, rushed miss with help, "I don't know"),
   session logging, and the meadow opening when Partners of 10 are hers. iPad portrait and landscape. */
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
  for (const [vw, vh, tag] of [[834, 1112, 'portrait'], [1194, 834, 'landscape']]) {
    console.log(`== ${tag}`);
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
    await page.route('**/voice/index.json', r => r.fulfill({ contentType: 'application/json', body: '{"packs":[],"clips":{}}' }));
    page.on('pageerror', e => { failures++; console.log('  PAGE ERROR:', e.message); });
    page.on('console', m => { if (m.type() === 'error') { failures++; console.log('  CONSOLE ERROR:', m.text()); } });
    await page.goto(`http://localhost:${server.address().port}/`);
    await page.evaluate(() => { EM.S.theme = 'garden'; EM.S.avatar = { skin: 1, hair: 'long', hairColor: 1, glasses: 'none', shirt: 6, extra: 'bow' }; EM.S.name = 'Mia'; EM.S.placement.done = true; EM.save(); EM.go('home'); });
    const shot = n => page.screenshot({ path: `${OUT}/village-${tag}-${n}.png` });
    await shot('00-home');
    check(await page.$('[data-act=village]') !== null, 'home has the village button');
    await page.click('[data-act=village]');
    await page.waitForSelector('#vcanvas'); await shot('01-map');
    check((await page.evaluate(() => EM.village.state().fish)) === 3, 'starts with 3 fish');

    // ---- build: place flowers on the plot ----
    await page.click('[data-v=build]');
    await page.click('[data-item=flowers]');
    const cellPos = async (cx, cy, area = 'plot') => page.evaluate(([cx, cy, area]) => { const c = document.getElementById('vcanvas').getBoundingClientRect(), a = area === 'plot' ? { x: 146, y: 134 } : { x: 222, y: 10 }; return { x: c.left + (a.x + cx * 16 + 8) / 300 * c.width, y: c.top + (a.y + cy * 16 + 8) / 210 * c.height }; }, [cx, cy, area]);
    let p = await cellPos(1, 1); await page.mouse.click(p.x, p.y);
    let st = await page.evaluate(() => EM.village.state());
    check(st.placed.length === 1 && st.placed[0].item === 'flowers' && st.fish === 1, `placed flowers, paid 2 fish (fish now ${st.fish})`);
    await page.click('[data-item=flowers]'); // still selected? fish 1 < 2, so it deselected; selecting a too-expensive item is allowed but placing is refused
    p = await cellPos(2, 1); await page.mouse.click(p.x, p.y);
    st = await page.evaluate(() => EM.village.state());
    check(st.placed.length === 1 && st.fish === 1, 'cannot place without enough fish');
    // tap the flowers to select, then paint them
    await page.click('[data-item=flowers]');
    p = await cellPos(1, 1); await page.mouse.click(p.x, p.y);
    check(await page.$('.vpaints') !== null, 'tapping a placed thing opens paint and move');
    await page.click('[data-paint=yellow]');
    st = await page.evaluate(() => EM.village.state());
    check(st.placed[0].paint === 'yellow', 'painted the flowers yellow');
    await shot('02-build-selected');
    // drag to another cell
    const a = await cellPos(1, 1), b = await cellPos(4, 2);
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
    st = await page.evaluate(() => EM.village.state());
    check(st.placed[0].cx === 4 && st.placed[0].cy === 2, `dragged the flowers to a new spot (${st.placed[0].cx},${st.placed[0].cy})`);
    // put away refunds
    await page.click('[data-v=putaway]');
    st = await page.evaluate(() => EM.village.state());
    check(st.placed.length === 0 && st.fish === 3, 'putting it away gives the fish back');
    await page.click('[data-v=done]');

    // ---- fishing ----
    await page.click('[data-v=fish]');
    await page.waitForSelector('.fishing'); await shot('03-fishing');
    const ans = () => page.evaluate(() => EM.village._fish().f.ans);
    const type = async (n, wait) => { for (const d of String(n)) await page.click(`[data-fd="${d}"]`); if (wait) await page.waitForTimeout(wait); await page.click('[data-v=fok]'); };
    // a fast, right answer catches a fish and grades the fact
    let key = await page.evaluate(() => EM.village._fish().key);
    await page.waitForTimeout(1000); await type(await ans());
    st = await page.evaluate(() => EM.village.state());
    check(st.fish === 4 && st.caught === 1, 'a right answer catches a fish');
    check(await page.evaluate(k => !!EM.S.facts[k] && EM.S.facts[k].seen >= 1, key), 'the fact was graded by the engine');
    await page.waitForTimeout(1300); await page.evaluate(() => document.querySelectorAll('.vover [data-ov]').forEach(b => b.click()));
    // a rushed wrong answer: no fish, help opens
    await page.waitForFunction(() => EM.village._fish() && EM.village._fish().phase === 'ask');
    const wrong = (await ans() + 1) % 10;
    await type(wrong);
    check(await page.$('.vhelp') !== null, 'a miss opens help');
    st = await page.evaluate(() => EM.village.state());
    check(st.fish === 4, 'a miss catches nothing');
    await shot('04-fishing-help');
    await type(await ans()); await page.waitForTimeout(1800);
    // "I don't know" is safe: help, no fish lost
    await page.waitForFunction(() => EM.village._fish() && EM.village._fish().phase === 'ask');
    await page.click('[data-v=fidk]');
    check(await page.$('.vhelp') !== null && (await page.evaluate(() => EM.village.state().fish)) === 4, '"I don\'t know" opens help and costs nothing');
    await type(await ans()); await page.waitForTimeout(1800);
    // guessing fast in a row never pays: rushed misses are counted
    const rushedBefore = await page.evaluate(() => EM.village._fish().stats.rushed);
    await page.waitForFunction(() => EM.village._fish() && EM.village._fish().phase === 'ask');
    await type((await ans() + 3) % 10);
    check((await page.evaluate(() => EM.village._fish().stats.rushed)) === rushedBefore + 1, 'an instant wrong answer is flagged as rushed');
    await type(await ans()); await page.waitForTimeout(1800);
    // leaving logs a session the grown-up view counts
    const nSess = await page.evaluate(() => EM.S.sessions.length);
    await page.click('[data-v=stopfish]');
    const last = await page.evaluate(() => EM.S.sessions[EM.S.sessions.length - 1]);
    check((await page.evaluate(() => EM.S.sessions.length)) === nSess + 1 && last.kind === 'fishing' && last.items === 4, `fishing logs a session (${last && last.items} answers)`);

    // ---- meadow: opens when 8 Partners of 10 are hers ----
    const opened = await page.evaluate(() => { EM.SK.m10.facts.slice(0, 8).forEach(k => { const r = EM.factRec(k, true); r.box = 3; r.peak = 3; }); return EM.village.checkUnlocks(); });
    check(opened, 'the meadow opens with 8 make-10 facts');
    await page.evaluate(() => { EM.village.state().fish = 120; EM.save(); EM.go('village'); });
    await page.waitForSelector('#vcanvas'); await shot('05-meadow-open');
    await page.click('[data-v=build]');
    check(await page.$('[data-item=sheep]') !== null, 'meadow items appear in the build tray');
    // fill the plot and the meadow with a little of everything
    const fill = [['flowers', 0, 0, 'pink'], ['tree', 1, 0, 'green'], ['bench', 2, 0, 'blue'], ['lantern', 3, 0, 'yellow'], ['birdhouse', 4, 0, 'red'], ['well', 5, 1, 'red'], ['pumpkin', 0, 2, 'orange'], ['bush', 1, 2, 'red'], ['doghouse', 3, 2, 'teal'], ['flag', 5, 0, 'purple'], ['flowers', 2, 2, 'purple'], ['tree', 4, 2, 'orange']];
    for (const [item, cx, cy] of fill) { await page.click(`[data-item=${item}]`); p = await cellPos(cx, cy); await page.mouse.click(p.x, p.y); }
    for (const [item, cx, cy] of [['sheep', 0, 0], ['hay', 2, 0], ['scarecrow', 3, 1], ['sheep', 1, 1]]) { await page.click(`[data-item=${item}]`); p = await cellPos(cx, cy, 'meadow'); await page.mouse.click(p.x, p.y); }
    await page.evaluate(() => { const v = EM.village.state(); for (const [item, cx, paint] of [['tree', 4, 'orange'], ['flowers', 2, 'purple']]) { const q = v.placed.find(q => q.item === item && q.cx === cx && q.area === 'plot'); if (q) q.paint = paint; } EM.save(); });
    await page.click('[data-v=done]');
    st = await page.evaluate(() => EM.village.state());
    check(st.placed.length === 16, `built ${st.placed.length} things across the plot and the meadow`);
    await shot('06-built');
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL VILLAGE CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
