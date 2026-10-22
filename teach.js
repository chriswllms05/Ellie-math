/* Ellie Math — Teach Dot: she becomes the teacher. On facts that are already hers, Dot either tries an answer
   (sometimes with a real kid mistake) and she types the real answer, or asks "how do I do this?" and she fills in
   the strategy steps. Every answer is typed, so nothing can be guessed. A miss is a real retention miss. */
'use strict';
(function () {
  const EM = window.EM;
  const pick = EM.pick, shuffle = EM.shuffle;
  const NAME = () => (EM.S && EM.S.name) || 'Teacher';
  const slot = '<span class="slot">&nbsp;</span>';
  const scene = (dotMood, dotLine) => `<div class="teach-scene">${EM.avatar.draw(undefined, 96, 'teach')}<div class="teach-dot">${EM.theme.dot(dotMood, 84, { glasses: false })}<div class="dot-says">${dotLine}</div></div></div>`;
  const strip = s => s.replace(/<[^>]+>/g, '');

  // Dot's plausible mistakes, by fact shape. Returns { ans, line, say } where line shows Dot's thinking.
  function dotAttempt(f) {
    const { a, b, ans } = f, big = Math.max(a, b), small = Math.min(a, b);
    const wrong = Math.random() < 0.6;
    if (f.type === 'add' && ans > 10 && big < 10 && small > 2) {
      const need = 10 - big, rest = small - need;
      if (!wrong) return { ans, line: `${big} and ${need} make 10, then ${rest} more… so ${ans}?`, wrongDot: false };
      return { ans: ans - 1, line: `${big} and ${need} make 10, then ${rest - 1} more… so ${ans - 1}?`, wrongDot: true };
    }
    if (f.type === 'add' && a === b) {
      if (!wrong) return { ans, line: `Double ${a}… that's ${ans}?`, wrongDot: false };
      return { ans: ans + 2, line: `Double ${a}… that's ${ans + 2}?`, wrongDot: true };
    }
    if (f.type === 'sub' && a > 10 && b > a - 10) {
      const ones = a - 10, more = b - ones;
      if (!wrong) return { ans, line: `Take away ${ones} to get to 10, then ${more} more… ${ans}?`, wrongDot: false };
      return { ans: ans + 1, line: `Take away ${ones} to get to 10, then ${more} more… ${ans + 1}?`, wrongDot: true };
    }
    if (f.type === 'sub') {
      if (!wrong) return { ans, line: `${b} and ${ans} make ${a}… so ${ans}?`, wrongDot: false };
      return { ans: ans + 1, line: `I counted back on my fingers: ${a}, ${a - 1}, ${a - 2}… I think ${ans + 1}?`, wrongDot: true };
    }
    if (f.type === 'm10') {
      if (!wrong) return { ans, line: `${f.a} and ${ans} make 10, I think?`, wrongDot: false };
      return { ans: ans + 1, line: `${f.a} and ${ans + 1} make 10, I think?`, wrongDot: true };
    }
    // count-on style
    if (!wrong) return { ans, line: `Is it ${ans}?`, wrongDot: false };
    return { ans: ans + 1, line: `I counted on my fingers: ${big}, ${big + 1}, ${big + 2}… is it ${ans + 1}?`, wrongDot: true };
  }

  // "Teach me how": the strategy steps for facts that have one.
  function howSteps(f) {
    const { a, b, ans } = f, big = Math.max(a, b), small = Math.min(a, b);
    if (f.type === 'add' && ans > 10 && big < 10 && small > 2 && Math.abs(a - b) > 1) {
      const need = 10 - big, rest = small - need;
      return [{ ans: need, q: `${big} and ${slot} make 10.`, s: `${big} and what make ten?` }, { ans: rest, q: `Then ${slot} more.`, s: `Then how many more?` }, { ans, q: `So ${a} + ${b} = ${slot}`, s: `So ${a} plus ${b} is?` }];
    }
    if (f.type === 'add' && Math.abs(a - b) === 1 && small > 1) {
      return [{ ans: small, q: `Double ${slot} is ${small * 2}.`, s: `Double what is ${small * 2}?` }, { ans, q: `And 1 more is ${slot}`, s: `And one more is?` }];
    }
    if (f.type === 'sub' && a > 10 && b > a - 10 && b !== 10) {
      const ones = a - 10;
      return [{ ans: ones, q: `${a} take away ${slot} gets to 10.`, s: `${a} take away what gets to ten?` }, { ans: b - ones, q: `Then take away ${slot} more.`, s: `Then take away how many more?` }, { ans, q: `So ${a} − ${b} = ${slot}`, s: `So ${a} minus ${b} is?` }];
    }
    if (f.type === 'sub' && a <= 10) {
      return [{ ans, q: `${b} and ${slot} make ${a}.`, s: `${b} and what make ${a}?` }, { ans, q: `So ${a} − ${b} = ${slot}`, s: `So ${a} minus ${b} is?` }];
    }
    return null;
  }

  function item(key, how) {
    const f = EM.FACTS[key], label = EM.labelFact(f);
    const help = (i, stage) => EM.factItem(key).help(0, stage);
    if (how) {
      const st = howSteps(f);
      const howHelp = (i, stage) => { const h = EM.factItem(key).help(0, 1), a = st[i].ans; return stage === 1 ? h : { vis: h.vis, html: `It's <b>${a}</b>. Type <b>${a}</b>.`, say: `It's ${a}. Type ${a}.` }; };
      const steps = st.map((x, i) => ({
        ans: x.ans,
        html: `${scene(i === 0 ? 'curious' : 'think', i === 0 ? `How do I figure out <b>${label}</b>? Teach me!` : 'Okay… and then?')}<div class="eq small teach-eq">${x.q}</div>`,
        say: i === 0 ? `How do I figure out ${strip(label).replace('−', 'minus').replace('+', 'plus')}? Teach me! ${x.s}` : x.s, vis: '',
      }));
      return { key: key + ':teach', factKey: key, kind: 'teach', how: true, type: 'teach', mode: 'normal', steps, help: howHelp, label,
        done: { html: `Thank you, ${EM.esc(NAME())}! Now I know how to do ${label}.`, say: `Thank you, ${NAME()}! Now I know how.` } };
    }
    const at = dotAttempt(f);
    return { key: key + ':teach', factKey: key, kind: 'teach', how: false, type: 'teach', mode: 'normal', dotWrong: at.wrongDot, dotAns: at.ans, label,
      steps: [{ ans: f.ans, html: `${scene('think', `${label}… ${at.line}`)}<div class="ask">Check Dot's work. What's the real answer?</div>${EM.factItem(key).steps[0].html}`, say: `${strip(label).replace('−', 'minus').replace('+', 'plus')}. ${at.line.replace('…', ',')} Check Dot's work. What's the real answer?`, vis: '' }],
      help, done: at.wrongDot ? { html: `Oh! I see it now. Thank you, ${EM.esc(NAME())}!`, say: `Oh! I see it now. Thank you!` } : { html: `You checked my work. I was right!`, say: `You checked my work. I was right!` } };
  }

  // Pick 2–3 facts that are hers: due ones first (doubles as a retention check), then any.
  function items(n = 3, now = Date.now()) {
    const S = EM.S;
    const hers = Object.keys(S.facts).filter(k => EM.FACTS[k] && EM.FACTS[k].type !== 'look' && S.facts[k].box >= EM.FLUENT_BOX);
    if (hers.length < 3) return [];
    const due = shuffle(hers.filter(k => EM.startOfDay(S.facts[k].due) <= now));
    const rest = shuffle(hers.filter(k => !due.includes(k)));
    const keys = [...due, ...rest].slice(0, n);
    return keys.map((k, i) => item(k, i === 1 && !!howSteps(EM.FACTS[k])));
  }

  // Record the outcome. Only a miss changes mastery (it is a real retention miss); a success is logged in Dot's notebook.
  function record(it, ok) {
    const S = EM.S;
    S.taught = S.taught || {};
    if (ok) { const t = S.taught[it.factKey] || (S.taught[it.factKey] = { n: 0, caught: 0, first: Date.now() }); t.n++; if (it.dotWrong) t.caught++; t.last = Date.now(); EM.save(); }
    else EM.gradeFact(it.factKey, 'wrong', 0);
  }
  const notebook = () => Object.keys((EM.S && EM.S.taught) || {});

  EM.teach = { items, item, record, notebook, howSteps, dotAttempt };
})();
