/* Collects every line Dot can say from the content generators (facts, Teach Dot, procedures with all help stages).
   Run: node tools/voice/collect.js out.json [itemsPerSkillLevel] */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'; fs.readFile(path.join(ROOT, p), (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); res.end(d); }); });
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${server.address().port}/`);
  await page.waitForFunction(() => window.EM && EM.procItem);
  const lines = await page.evaluate(N => {
    let out = new Set();
    const add = s => { if (s && String(s).trim()) out.add(String(s).trim()); };
    const nums = s => (String(s || '').replace(/<[^>]+>/g, '').match(/\d[\d,]*/g) || []).map(x => Number(x.replace(/,/g, '')));
    function harvest(it) {
      it.steps.forEach((st, i) => {
        add(st.say);
        const typed = new Set([undefined, '']);
        const a = Number(st.ans);
        [1, -1, 2, -2, 10, -10, 100, -100, 1000].forEach(d => typed.add(String(a + d)));
        nums(st.say).concat(nums(st.html)).forEach(n => typed.add(String(n)));
        for (const t of typed) for (const stage of [1, 2]) { try { const h = it.help(i, stage, t); if (h) add(h.say); } catch (e) {} }
      });
      if (it.done) add(it.done.say);
      if (it.label) add(`${it.label.replace('−', 'minus').replace('+', 'plus').replace('?', 'what')} is yours! You didn't know it before. Now you do.`);
    }
    for (const k of Object.keys(EM.FACTS)) {
      for (const mode of ['normal', 'probe']) harvest(EM.factItem(k, mode));
      add(EM.sentenceSay(EM.FACTS[k]) + '.');
      if (EM.FACTS[k].type !== 'look') for (let r = 0; r < 6; r++) for (const how of [false, true]) { try { harvest(EM.teach.item(k, how)); } catch (e) {} }
    }
    const facts = out; out = new Set();
    // Story problems get more samples: their names and things combine many ways.
    for (const sk of EM.SKILLS.filter(s => s.kind === 'proc')) sk.levels.forEach((_, lv) => { for (const tier of [0, 1, 2]) for (let r = 0; r < (sk.id === 'words' ? N * 25 : N); r++) harvest(EM.procItem(sk.id, lv, tier)); });
    const procs = out; out = new Set();
    // app.js and parent.js lines (NAME stands for her name, which is never recorded)
    ["Hi! I'm Dot. Pick your world.", 'Pick your world.', "That's what Dot said. Let's check Dot's work together.", 'Whoa, that was super fast! Slow down and think.', 'Thanks for being honest!', 'Good call asking.', "Smart. Let's figure it out.", "Okay. Let's look at it together.", 'Not quite.', 'Not yet.', 'Hmm, not that one.',
      "Good. Let's look together.", 'You worked it out!', "It's 7. That's okay. We'll see this one again.", "It's 4,372. That's okay. We'll see this one again.", 'How did you know?', '12 skills unlocked!', 'Nice to meet you, NAME!', 'Nice to meet you!',
      'This is Dot. If you can hear me, the sound is working.', "Hi, NAME! 8 plus 5 is 13. You didn't count that one, you just knew it!", 'Hi, NAME! This is how I will sound.', '4,372.', '56.',
      ...['Foundations', 'Quick facts', 'Times facts', 'Big numbers', 'School work', 'Teach Dot', 'Looking', 'Review'].map(b => `Part 1 done! Shake out your hands. Next up, ${b}.`)].forEach(add);
    EM.SKILLS.forEach(sk => { add(`${sk.name}, next level!`); add(`New skill unlocked. ${sk.name}.`); });
    // village.js lines: the arrival story, planks, the board, Dot's hints, building, fishing
    ["Oh! You made it! I'm Dot. I've been waiting so long for someone new to come live here.", 'This little house is yours now. Look, I already lit the lamps for you.',
      "And this is your yard. It's a bit empty... for now. You can fill it with anything you like.", 'Everyone here trades with fish. Catch fish in the pond, and you can trade them for flowers, a bench, even a wishing well.',
      "And see that old bridge? It broke a long, long time ago. Nobody knows what's on the other side...", 'Every time you really learn a make 10 fact, we can fix one plank. Eight planks, and we can cross!',
      "Let's catch your very first fish. Tap the pond!", 'I pinned a note on the board for you. Tap it!', 'Tap the pond to catch some fish!', "Today's practice is on the board.",
      'The last plank!', 'The bridge is fixed! The meadow is open. Look, sheep!', 'The bridge is fixed! Tap the meadow to build there.',
      'Fish are money here. Catch them at the pond!', 'Tap your yard to put things in it.', "Check the notice board for today's practice.",
      'Flowers cost 2 fish. Pick them, then tap a spot in your yard.', "You need fish to buy things. Let's go fishing!", 'Your yard is starting to look like home!',
      'Your yard is starting to look like home! One more thing: I pinned a note on the board for you.', 'Tap an empty spot.',
      'Whoa, too fast! It slipped away. Think first, then tap.', "Oops, it got away. Let's figure it out together.", "Good idea to ask. Let's look together.",
      'Your very first fish!', 'Basket full! 5 fish!', 'Basket full! 3 fish!'].forEach(add);
    for (let n = 0; n <= 8; n++) { add(`A new plank! ${n} of 8. Every make 10 fact you know fixes one more.`); add(`${n} of 8 planks fixed. Every make 10 fact you really know fixes one more.`); add(`${n} of 8 bridge planks fixed. Make 10 facts fix them!`); }
    for (const c of [2, 3, 4, 5, 6, 9, 10]) for (const n of [0, 1, 5, 12]) add(`That costs ${c} fish. You have ${n}. Let's catch more!`);
    for (const n of [2, 7, 23]) add(`You have ${n} fish. Tap your yard to spend them!`);
    for (let a = 0; a <= 10; a++) { add(`Yes! ${a} and ${10 - a} make 10.`); add(`${a} + ${10 - a} = 10 is yours now!`); add(`This fish has ${a}. How many more make 10?`); add(`This fish has ${a}. How many more make 10? Tap the number, then the check.`); }
    const GROW = { garden: ['sprout', 'sprouts'], ocean: ['egg', 'eggs'], space: ['baby star', 'baby stars'], classroom: ['outline', 'outlines'] };
    const was = EM.S && EM.S.theme;
    for (const id of ['garden', 'ocean', 'space', 'classroom']) {
      EM.S.theme = id; const t = EM.theme.current(), g = GROW[id], HI = id === 'classroom' ? 'Good morning' : 'Hi';
      EM.world.MILESTONES[id].forEach(m => { add(`Surprise! ${m[2]} moved into your ${t.place}!`); add(m[2].replace(/^(a|an|the) /, '')); });
      add(id === 'classroom' ? "Welcome to class, NAME! I'm your teacher, Dot. Today I just want to see what you already know, so I know what to teach." : `Hi, NAME! This is your ${t.place}. It's empty for now. Today let's find out what you already know and plant the first ${g[1]}.`);
      for (const [y, sp] of [[1, 0], [7, 0], [1, 1], [23, 4]]) {
        add(`Look at your ${t.place}, NAME! ${y} ${y === 1 ? t.one : t.many}${sp ? ` and ${sp} ${sp === 1 ? g[0] : g[1]} growing` : ''}.`);
        add(`${HI}, NAME! ${y} ${y === 1 ? t.one : t.many} ${id === 'classroom' ? 'earned' : 'so far'}.${sp ? ` Your ${g[1]} are waiting. Know them fast and they'll turn into ${t.many}!` : ''}`);
      }
      add(`${HI}, NAME! See your ${g[1]}? Know them fast on two different days and they turn into ${t.many}.`);
      add(`Nice work, NAME! Look what's new in your ${t.place}!`); add(`Nice work, NAME! Your ${g[1]} are getting stronger.`);
      for (const n of [1, 6]) add(`Nice work, NAME! You planted ${n} new ${n === 1 ? g[0] : g[1]} today.`);
    }
    EM.S.theme = was;
    return { facts: [...facts], procs: [...procs], app: [...out] };
  }, Number(process.argv[3] || 300));
  fs.writeFileSync(process.argv[2], JSON.stringify(lines, null, 1));
  console.log(lines.facts.length, 'fact lines,', lines.procs.length, 'procedure lines,', lines.app.length, 'app lines');
  await browser.close(); server.close();
})();
