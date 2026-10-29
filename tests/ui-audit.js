/* UI audit: visits every screen in light and dark mode, measures the contrast of every piece of visible text against
   what is actually behind it, and screenshots each screen. Run: node tests/ui-audit.js [outdir]
   Flags text below WCAG AA (4.5:1, or 3:1 for large text), text that spills out of its box, and buttons too small to tap. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = process.argv[2] || '/tmp';
const EXE = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); });

// Runs in the page: every visible text run, its color, the color really behind it, and the ratio.
function audit() {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const blend = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const visible = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < .35) return false; } const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
  // background: blend the stack of backgrounds from the element up; over pixel art, report it separately
  const bgOf = el => {
    const layers = []; let overArt = false;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e), c = parse(s.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= .99) break; }
      if (s.backgroundImage && s.backgroundImage !== 'none' && !layers.length) overArt = true;
      if (e.classList && (e.classList.contains('vstage') || e.classList.contains('world'))) { if (!layers.some(l => l.a > .9)) overArt = true; break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 }; const body = parse(getComputedStyle(document.body).backgroundColor); if (body && body.a) bg = body;
    for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
    return { bg, overArt };
  };
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim(); if (!t || /^[\p{Extended_Pictographic}\s·|✓⌫▸‹›…]+$/u.test(t)) continue;
    const el = n.parentElement; if (!el || seen.has(el) || ['SCRIPT', 'STYLE', 'TITLE'].includes(el.tagName) || el.closest('svg')) continue; seen.add(el);
    if (!visible(el)) continue;
    const s = getComputedStyle(el), fg = parse(s.color); if (!fg) continue;
    let { bg, overArt } = bgOf(el); if (el.closest('.jsign') && !el.closest('.slot')) { bg = el.closest('.chalk') ? { r: 47, g: 74, b: 58, a: 1 } : { r: 217, g: 177, b: 124, a: 1 }; overArt = false; } // the sign (wood or chalkboard) is drawn on the canvas
    const f = blend(fg, bg);
    const L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700, large = size >= 24 || (size >= 18.6 && bold);
    const need = large ? 3 : 4.5, shadow = s.textShadow && s.textShadow !== 'none';
    const r = el.getBoundingClientRect(), spills = el.scrollWidth > el.clientWidth + 2 && s.overflow === 'visible' && s.whiteSpace === 'nowrap';
    if (ratio < need && !(overArt && shadow)) out.push({ kind: 'contrast', text: t.slice(0, 60), ratio: Math.round(ratio * 100) / 100, need, fg: s.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, size, overArt, sel: el.className || el.tagName });
    if (r.right > innerWidth + 1 || r.left < -1) out.push({ kind: 'offscreen', text: t.slice(0, 60), sel: el.className || el.tagName });
  }
  // wide content cut off by its column (an equation pushing the answer box under the keypad)
  document.querySelectorAll('.eq, .vq, .vnote, .vcard, .vpanel, .jbub, .jsign, .jlabel').forEach(el => { if (!visible(el)) return; const p = el.parentElement, r = el.getBoundingClientRect(), pr = p.getBoundingClientRect(); if (el.scrollWidth > el.clientWidth + 2 || r.right > pr.right + 2 || r.right > innerWidth + 1) out.push({ kind: 'clipped', text: el.textContent.trim().slice(0, 40), sel: el.className }); });
  // tap targets: buttons smaller than 40x40 css px
  document.querySelectorAll('button, [data-act], [data-v], [data-b]').forEach(b => { if (!visible(b)) return; const r = b.getBoundingClientRect(); if ((r.width < 40 || r.height < 36) && b.textContent.trim().length < 30) out.push({ kind: 'small-target', text: (b.textContent.trim() || b.getAttribute('aria-label') || '').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), sel: b.className }); });
  return out;
}

(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: EXE });
  const report = [];
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, colorScheme: scheme, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
    await page.route('**/voice/index.json', r => r.fulfill({ contentType: 'application/json', body: '{"packs":[],"clips":{}}' }));
    page.on('pageerror', e => report.push({ scheme, screen: 'page', kind: 'error', text: e.message }));
    await page.goto(`http://localhost:${server.address().port}/`);
    const check = async (name, wait = 250) => { await page.waitForTimeout(wait); const issues = await page.evaluate(audit); issues.forEach(i => report.push({ scheme, screen: name, ...i })); await page.screenshot({ path: `${OUT}/${scheme}-${name}.png` }); };
    const sp = async (x, y) => page.evaluate(([x, y]) => { const r = document.getElementById('vstage').getBoundingClientRect(), c = EM.village._scene().cam; return { x: r.left + (x - c.x) / c.w * r.width, y: r.top + (y - c.y) / c.h * r.height }; }, [x, y]);
    const tapScene = async (x, y) => { const q = await sp(x, y); await page.mouse.click(q.x, q.y); };

    await check('01-avatar');
    await page.fill('#avName', 'Mia'); await page.click('[data-av-done]');
    await page.waitForSelector('.vdialog'); await check('02-story', 1500);
    await page.evaluate(() => { EM.village.state().introDone = true; EM.village.state().coins = 40; EM.save(); EM.go('home'); });
    await check('03-village', 900);
    await tapScene(150, 150); await page.waitForSelector('.vtray'); await check('04-build-tray', 1500);
    await page.click('[data-item=flowers]'); await tapScene(162, 150); await page.waitForTimeout(300); await page.click('[data-item=flowers]'); await tapScene(162, 150);
    await page.waitForSelector('.vpaints'); await check('05-build-selected');
    await page.click('[data-v=deselect]'); await page.click('[data-v=done]');
    await page.evaluate(() => EM.village.openBoard()); await check('06-board');
    await page.click('[data-b=close]');
    await tapScene(92, 140); await page.waitForSelector('.fishing', { timeout: 8000 });
    await page.waitForFunction(() => EM.village._fish() && EM.village._fish().phase === 'ask', null, { timeout: 8000 }); await check('07-fishing', 400);
    await page.click('[data-v=jidk]'); await check('08-fishing-help');
    await page.evaluate(() => { const ans = EM.village._fish().f.ans; });
    await page.click('[data-v=stopfish]'); await page.waitForTimeout(1500);
    await page.click('[data-v=orchard]'); await page.waitForSelector('.orchard', { timeout: 10000 });
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'hello', null, { timeout: 8000 }); await check('09-rosa-hello', 300); await page.click('#vstage');
    await page.waitForFunction(() => EM.village._orch() && EM.village._orch().phase === 'ask' && !EM.village._orch().waitSpeech, null, { timeout: 10000 }); await check('09a-orchard', 400);
    await page.click('[data-v=jidk]'); await check('09b-orchard-help', 700);
    await page.click('[data-v=leavejob]'); await page.waitForTimeout(1500);
    // the market, the board's orders, and the day-done thank-you
    await page.evaluate(() => { EM.SK.m10.facts.forEach(k => { const r = EM.factRec(k, true); r.box = 3; r.peak = 3; }); EM.S.placement.done = true; EM.save(); EM.go('home'); });
    await page.waitForSelector('[data-v=market]', { timeout: 30000 }); await page.waitForTimeout(600); await check('09c-map-market');
    await page.click('[data-v=market]'); await page.waitForSelector('.market', { timeout: 30000 });
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'hello', null, { timeout: 8000 }); await check('09d-market-hello', 300); await page.click('#vstage');
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'ask' && !EM.village._job().waitSpeech, null, { timeout: 10000 }); await check('09e-market', 400);
    await page.click('[data-v=jidk]'); await check('09f-market-help', 700);
    await page.click('[data-v=leavejob]'); await page.waitForTimeout(1500);
    await page.click('[data-v=bakery]'); await page.waitForSelector('.bakery', { timeout: 30000 });
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'hello', null, { timeout: 8000 }); await page.click('#vstage');
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'ask' && !EM.village._job().waitSpeech, null, { timeout: 10000 }); await check('09f0-bakery', 400);
    await page.click('[data-v=jidk]'); await check('09f1-bakery-help', 700);
    await page.click('[data-v=leavejob]'); await page.waitForTimeout(1500);
    await page.click('[data-v=post]'); await page.waitForSelector('.post', { timeout: 30000 });
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'hello', null, { timeout: 8000 }); await page.click('#vstage');
    await page.waitForFunction(() => EM.village._job() && EM.village._job().phase === 'ask' && !EM.village._job().waitSpeech, null, { timeout: 10000 }); await check('09f2-post', 400);
    await page.click('[data-v=jidk]'); await check('09f3-post-help', 700);
    await page.click('[data-v=leavejob]'); await page.waitForTimeout(1500);
    await page.evaluate(() => EM.village.openBoard()); await check('09g-board-orders');
    await page.click('[data-b=close]');
    await page.evaluate(() => { EM.village.orders().list.forEach(x => { x.got = x.need; }); EM.save(); EM.go('home'); });
    await page.waitForSelector('.vover', { timeout: 15000 }); await check('09h-day-done', 400); await page.click('.vover [data-ov]'); await page.waitForTimeout(400);
    // practice screens, placement, summary, break, skills, grown-ups
    const show = async (name, item, step = 0, help = 0, typed) => {
      await page.evaluate(({ item, step, help, typed }) => {
        const it = item.kind === 'fact' ? EM.factItem(item.key, 'normal') : EM.procItem(item.id, item.level, item.tier);
        EM.startSession('skill', { id: 'doubles' });
        const R = EM._run(); R.queue = [it]; R.idx = 0; R.cur = it; R.step = step; R.phase = 'ask'; R.input = ''; R.waitReady = it.type === 'look'; R.waitTrick = false; R.waitSpeech = false; R.lock = false; R.msg = null; R.helpStage = 0; R.stepRes = [];
        EM.render();
        if (help) { const h = it.help(step, help, typed); R.phase = 'help'; R.helpStage = help; R.msg = { kind: 'help', html: `<b>Not quite.</b> ${h.html}` }; EM.render(); const v = document.querySelector('.visual'); if (v) v.innerHTML = h.vis; }
      }, { item, step, help, typed });
      await check(name);
    };
    await show('10-fact', { kind: 'fact', key: 'add:8+5' });
    await show('11-fact-help', { kind: 'fact', key: 'add:8+5' }, 0, 1);
    await show('12-look', { kind: 'fact', key: 'look:7' });
    await show('13-round-help', { kind: 'proc', id: 'r100', level: 1, tier: 1 }, 0, 1, 1);
    await show('14-compare', { kind: 'proc', id: 'compare', level: 1, tier: 1 });
    await show('15-est-help', { kind: 'proc', id: 'est', level: 0, tier: 1 }, 2, 1, 8);
    await show('16-regroup', { kind: 'proc', id: 'regroup', level: 1, tier: 1 }, 0);
    await show('17-words', { kind: 'proc', id: 'words', level: 0, tier: 0 });
    await show('18-skip', { kind: 'proc', id: 'skip', level: 0, tier: 1 });
    await show('18b-scratchpad', { kind: 'proc', id: 'words', level: 2, tier: 1 }); await page.click('.scratchbtn'); await check('18c-scratchpad-open', 500); await page.click('.scratch [data-tool=done]');
    await page.evaluate(() => { EM.startSession('placement'); }); await check('19-placement');
    await page.evaluate(() => { const S = EM.S; EM.go('skills'); }); await check('20-skills');
    await page.evaluate(() => EM.go('parent')); await check('21-grownups');
    await page.evaluate(() => { EM.startSession('daily'); const R = EM._run(); R.stats.items = 12; R.stats.fast = 7; R.stats.slow = 3; R.stats.wrong = 2; EM.go('summary'); }); await check('22-summary');
    await page.evaluate(() => EM.go('break')).catch(() => {}); await check('23-break');
    await page.evaluate(() => EM.go('avatar')); await check('24-avatar-again');
    await ctx.close();
  }
  { const ctx = await browser.newContext({ viewport: { width: 820, height: 1180 }, colorScheme: 'dark', serviceWorkers: 'block' }); const page = await ctx.newPage(); await page.goto(`http://localhost:${server.address().port}/`); await page.waitForTimeout(300); (await page.evaluate(audit)).forEach(i => report.push({ scheme: 'dark', screen: 'turn', ...i })); await page.screenshot({ path: `${OUT}/dark-turn.png` }); await ctx.close(); }
  await browser.close(); server.close();
  fs.writeFileSync(`${OUT}/ui-audit.json`, JSON.stringify(report, null, 1));
  const byKind = report.reduce((a, r) => (a[r.kind] = (a[r.kind] || 0) + 1, a), {});
  console.log(JSON.stringify(byKind));
  for (const r of report) console.log(`${r.scheme.padEnd(5)} ${String(r.screen).padEnd(18)} ${r.kind.padEnd(12)} ${r.ratio ? `${r.ratio}/${r.need} ${r.fg} on ${r.bg} ${r.overArt ? '(over art)' : ''}` : r.w ? `${r.w}x${r.h}` : ''} "${r.text}" [${String(r.sel).slice(0, 40)}]`);
  process.exit(report.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
