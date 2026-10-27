/* Screenshots of the main screens for a visual check. node tests/shots.js [outdir] */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = process.argv[2] || '/tmp';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer((req, res) => { let p = req.url.split('?')[0]; if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'text/plain' }); res.end(d); }); });
(async () => {
  await new Promise(r => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/index.html?t=${process.env.THEME || 'garden'}`;
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1194, height: 834 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await page.goto(url);
  const shot = n => page.screenshot({ path: `${OUT}/em-${process.env.THEME || 'garden'}-${n}.png` });
  await page.waitForTimeout(400); await shot('00-pick-world');
  await page.evaluate(() => { EM.S.theme = (new URLSearchParams(location.search)).get('t') || 'garden'; EM.S.avatar = { skin: 3, hair: 'curly', hairColor: 1, glasses: 'none', shirt: 5, extra: 'headband' }; EM.S.name = 'Mia'; EM.save(); EM.theme.apply(); EM.go('home'); });
  await shot('01-first-home');
  // seed some progress so the home has a garden, then show screens
  await page.evaluate(() => { EM.S.placement.done = true; EM.SKILLS.forEach(s => { EM.skillRec(s.id).manual = true; }); ['add:3+3', 'add:4+4', 'm10:7', 'add:10+5', 'add:2+1', 'add:5+5', 'add:6+6', 'add:1+1', 'm10:3', 'm10:5', 'add:2+2', 'add:7+7', 'add:10+1', 'add:10+2'].forEach((k, i) => { const r = EM.factRec(k, true); r.box = 2; EM.S.yours.push(k); }); EM.save(); EM.go('home'); });
  await page.waitForTimeout(1600); await shot('02-home');
  await page.evaluate(() => EM.go('skills')); await shot('03-skills');
  const show = async (name, item, step = 0, help = 0, typed) => {
    await page.evaluate(({ item, step, help, typed }) => {
      const it = item.kind === 'fact' ? EM.factItem(item.key, 'normal') : EM.procItem(item.id, item.level, item.tier);
      EM.startSession('skill', { id: item.kind === 'fact' ? 'doubles' : item.id });
      const R = EM._run(); R.queue = [it]; R.idx = 0; R.cur = it; R.step = step; R.phase = 'ask'; R.input = ''; R.waitReady = it.type === 'look'; R.waitTrick = false; R.waitSpeech = false; R.lock = false; R.msg = null; R.helpStage = 0; R.stepRes = [];
      EM.render();
      if (help) { const h = it.help(step, help, typed); R.phase = 'help'; R.helpStage = help; R.msg = { kind: 'help', html: `<b>Not quite.</b> ${h.html}` }; EM.render(); document.querySelector('.visual').innerHTML = h.vis; }
    }, { item, step, help, typed });
    await page.waitForTimeout(120);
    await shot(name);
  };
  await show('10-fact-ask', { kind: 'fact', key: 'add:8+5' });
  await show('11-fact-help1', { kind: 'fact', key: 'add:8+5' }, 0, 1);
  await show('12-fact-help2', { kind: 'fact', key: 'add:8+5' }, 0, 2);
  await show('13-sub-help1', { kind: 'fact', key: 'sub:13-9' }, 0, 1);
  await show('14-look', { kind: 'fact', key: 'look:7' });
  await show('20-round-tier0', { kind: 'proc', id: 'r100', level: 1, tier: 0 });
  await show('21-round-help', { kind: 'proc', id: 'r100', level: 1, tier: 1 }, 0, 1, 1);
  await show('22-neighbors', { kind: 'proc', id: 'neighbors', level: 2, tier: 0 });
  await show('23-pvbuild', { kind: 'proc', id: 'pv_build', level: 1, tier: 1 });
  await show('24-compare-help', { kind: 'proc', id: 'compare', level: 1, tier: 1 }, 0, 1);
  await show('25-count', { kind: 'proc', id: 'pv_count', level: 1, tier: 1 });
  await show('30-est-step0', { kind: 'proc', id: 'est', level: 0, tier: 0 });
  await show('31-est-step2', { kind: 'proc', id: 'est', level: 0, tier: 1 }, 2);
  await show('32-est-help2', { kind: 'proc', id: 'est', level: 0, tier: 1 }, 2, 1, 8);
  await show('40-regroup-add', { kind: 'proc', id: 'regroup', level: 0, tier: 1 }, 1);
  await show('41-regroup-sub', { kind: 'proc', id: 'regroup', level: 1, tier: 1 }, 0);
  await show('42-regroup-help', { kind: 'proc', id: 'regroup', level: 0, tier: 1 }, 0, 1);
  await page.evaluate(() => EM.go('parent')); await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/em-${process.env.THEME || 'garden'}-50-parent.png`, fullPage: true });
  // celebration + break + summary
  await page.evaluate(() => { EM.go('home'); });
  await page.evaluate(() => { const d = document.createElement('div'); d.id = 'overlay'; d.className = 'overlay'; const T = EM.theme.current(); d.innerHTML = `<div class="sheet"><div class="celebrate-row">${EM.theme.dot('cheer', 92)}<span class="big-item">${T.item(14)}</span></div><h2>7 + 8 is YOURS!</h2><p>You knew it fast today <b>and</b> another day. That's what really knowing looks like.<br>${T.newLine(14)} You now know <b>14</b> facts for keeps.</p><button class="big-btn" data-close="1">Yes!</button></div>`; document.body.appendChild(d); });
  await page.waitForTimeout(900); await shot('60-celebrate');
  await browser.close(); server.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
