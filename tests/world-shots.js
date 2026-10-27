/* Screenshots of her world at different stages. THEME=garden|ocean|space node tests/world-shots.js [outdir] */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = process.argv[2] || '/tmp', THEME = process.env.THEME || 'garden';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { let p = req.url.split('?')[0]; if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'text/plain' }); res.end(d); }); });
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: EXE, args: ['--mute-audio'] });
  const page = await (await browser.newContext({ viewport: { width: 1194, height: 834 } })).newPage();
  await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  const shot = n => page.screenshot({ path: `${OUT}/w-${THEME}-${n}.png` });
  // stage 1: empty world before placement
  await page.evaluate(t => { EM.S.theme = t; EM.S.avatar = { skin: 3, hair: 'curly', hairColor: 1, glasses: 'none', shirt: 5, extra: 'headband' }; EM.S.name = 'Mia'; EM.save(); EM.theme.apply(); EM.go('home'); }, THEME);
  await page.waitForTimeout(800); await shot('1-empty');
  // stage 2: a few weeks in — seeded mix of states
  await page.evaluate(() => {
    EM.S.placement.done = true;
    const zf = EM.world.zoneFacts(); let i = 0;
    const plan = { doubles: [9, 1], m10: [10, 1], plus12: [40, 15], teens: [14, 4], look: [12, 6], to10: [16, 14], near: [5, 7], bridge: [3, 10], sub10: [4, 12], subteen: [0, 6] };
    for (const [id, [hers, learning]] of Object.entries(plan)) zf[id].forEach((k, j) => { i++; if (j < hers) EM.factRec(k, true).box = j % 5 === 0 ? 4 : 2; else if (j < hers + learning) EM.factRec(k, true).box = j % 2; });
    EM.save(); EM.go('home');
  });
  await page.waitForTimeout(1800); await shot('2-weeks-in');
  await page.screenshot({ path: `${OUT}/w-${THEME}-2b-full.png`, fullPage: true });
  // zone close-up
  await page.evaluate(() => document.querySelector('[data-zone=doubles]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(600); await shot('3-closeup');
  await page.evaluate(() => { const o = document.getElementById('overlay'); if (o) o.remove(); });
  // milestone surprise overlay
  await page.evaluate(() => {
    const m = EM.world.MILESTONES[EM.theme.current().id][3];
    const d = document.createElement('div'); d.id = 'overlay'; d.className = 'overlay';
    d.innerHTML = `<div class="sheet"><div class="celebrate-row">${EM.theme.dot('wow', 80)}<span class="milestone-big">${m[1]}</span></div><h2>Surprise!</h2><p>You really know <b>${m[0]}</b> facts, so ${m[2]} moved into your ${EM.theme.current().place}!</p><button class="big-btn">Hello!</button></div>`;
    document.body.appendChild(d);
  });
  await page.waitForTimeout(1200); await shot('4-milestone');
  await browser.close(); server.close(); console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
