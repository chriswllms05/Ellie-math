/* Ellie Math — grown-up card, weekly digest, settings (behind a PIN), voice clips, backup. */
'use strict';
(function () {
  const EM = window.EM;
  const { range, fmt, esc, dayStr, startOfDay, DAY } = EM;
  const P = EM.parent = {};
  const sec = ms => ms ? `${(ms / 1000).toFixed(1)}s` : '–';
  const S = () => EM.S;
  let pinOk = false;

  // ---------- end-of-session card for the grown-up ----------
  P.grownupCard = function (R) {
    const st = R.stats, S_ = S();
    const fastLabels = R.stats.fastKeys.slice(0, 6).map(k => EM.labelFact(EM.FACTS[k]));
    const learned = st.learned.slice(0, 5).map(l => l.label);
    const ask = fastLabels.length ? `How did you know ${fastLabels[Math.floor(Math.random() * fastLabels.length)]}?` : learned.length ? `Show me how you figured out ${learned[0]}.` : 'What was the trickiest one today?';
    const yours = R.yoursNow || [];
    return `<div class="gcard"><h2>For a grown-up 👋</h2>
      <p style="margin:0 0 6px">${esc(S_.name || 'She')} did <b>${st.items}</b> questions in about <b>${Math.max(1, Math.round((Date.now() - R.started) / 60000))}</b> minutes.</p>
      <ul>
        ${yours.length ? `<li>🌸 Now <b>hers for keeps</b>: ${yours.map(esc).join(', ')}</li>` : ''}
        ${fastLabels.length ? `<li>⚡ Knew fast: ${fastLabels.map(esc).join(', ')}${st.fastKeys.length > 6 ? ` and ${st.fastKeys.length - 6} more` : ''}</li>` : ''}
        ${learned.length ? `<li>🧠 Asked for help, then learned: ${learned.map(esc).join(', ')}</li>` : ''}
        ${st.idk ? `<li>🙋 Said "I don't know" ${st.idk} time${st.idk > 1 ? 's' : ''} instead of guessing. Worth praising out loud.</li>` : ''}
        ${st.rushed ? `<li>🐢 Rushed guesses: ${st.rushed}. Ask her to think first.</li>` : ''}
        ${st.taught && st.taught.n ? `<li>🧑‍🏫 Taught Dot ${st.taught.ok} of ${st.taught.n} facts${st.taught.dotWrong ? `, caught ${st.taught.caught} of ${st.taught.dotWrong} of Dot's mistakes` : ''}. A miss here sends that fact back to practice.</li>` : ''}
        ${st.slow ? `<li>✓ Right but slow (still working it out): ${st.slow}. Normal; that's what practice is for.</li>` : ''}
      </ul>
      <div class="ask-her">Ask her: "${esc(ask)}"<br><span style="font-weight:600;color:var(--muted);font-size:14px">"I counted" is an honest answer. The goal is for that to change over the weeks.</span></div>
    </div>`;
  };

  // ---------- helpers ----------
  const STATUS = [['s0', 'Not tried'], ['s1', 'Learning'], ['s2', 'Getting there'], ['s3', 'Hers'], ['s4', 'Solid']];
  function statusOf(k) { const r = S().facts[k]; if (!r) return 0; return r.box === 0 ? 1 : r.box === 1 ? 2 : r.box <= 3 ? 3 : 4; }
  function weekSessions(n = 7, from = 0) { const now = Date.now(), lo = now - n * DAY, hi = now - from * DAY; return S().sessions.filter(s => s.date > lo && s.date <= hi && s.kind !== 'placement'); }
  function tot(sess) {
    const z = () => ({ fast: 0, slow: 0, wrong: 0, idk: 0 });
    return sess.reduce((a, s) => {
      const bk = s.byKind || {}, f = bk.fact || z(), h = s.how || {}, e = s.est || {};
      for (const k of ['fast', 'slow', 'wrong', 'idk']) { a[k] += s[k] || 0; a.fact[k] += f[k] || 0; }
      const tg = s.taught || {}; a.teach.n += tg.n || 0; a.teach.ok += tg.ok || 0; a.teach.caught += tg.caught || 0; a.teach.dotWrong += tg.dotWrong || 0;
      a.rushed += s.rushed || 0; a.minutes += s.minutes || 0; a.learned += (s.learned || []).length;
      for (const k of ['knew', 'trick', 'counted']) a.how[k] += h[k] || 0;
      for (const k of ['round', 'combine', 'sam']) { a.est[k].ok += (e[k] || {}).ok || 0; a.est[k].n += (e[k] || {}).n || 0; }
      return a;
    }, { ...z(), fact: z(), rushed: 0, minutes: 0, learned: 0, how: { knew: 0, trick: 0, counted: 0 }, est: { round: { ok: 0, n: 0 }, combine: { ok: 0, n: 0 }, sam: { ok: 0, n: 0 } }, teach: { n: 0, ok: 0, caught: 0, dotWrong: 0 } });
  }
  const pctFluent = ids => { const facts = EM.uniq(ids.flatMap(id => EM.SK[id].facts)); return facts.filter(EM.isYours).length / facts.length; };

  // Catch-up targets (weeks since first use).
  function targets() {
    const wk = EM.weekNumber();
    const procDone = (id, lv) => { const r = EM.skillRec(id); return r.level > lv || EM.levelFluent(id, lv); };
    const rows = [
      { name: 'Facts to 10 are hers', by: 3, val: pctFluent(['m10', 'plus12', 'doubles', 'to10']), fmt: v => `${Math.round(v * 100)}%` , done: v => v >= 0.8 },
      { name: 'Facts to 20 incl. subtraction', by: 10, val: pctFluent(['teens', 'near', 'bridge', 'sub10', 'subteen']), fmt: v => `${Math.round(v * 100)}%`, done: v => v >= 0.8 },
      { name: 'Rounding to 10 / 100 / 1,000', by: 4, val: ['r10', 'r100', 'r1000'].filter(id => procDone(id, 0)).length, fmt: v => `${v}/3 solid`, done: v => v >= 3 },
      { name: 'Place value to 10,000', by: 3, val: ['pv_build', 'pv_count', 'compare', 'neighbors'].filter(id => procDone(id, 1)).length, fmt: v => `${v}/4`, done: v => v >= 4 },
      { name: '"I counted" under 25% when asked (last 2 weeks)', by: 4, val: (() => { const h = tot(weekSessions(14)).how, n = h.knew + h.trick + h.counted; return n ? h.counted / n : null; })(), fmt: v => v === null ? 'no data yet' : `${Math.round(v * 100)}%`, done: v => v !== null && v < 0.25 },
    ];
    return { wk, rows: rows.map(r => ({ ...r, ok: r.done(r.val), late: !r.done(r.val) && wk > r.by })) };
  }

  // ---------- main view ----------
  P.render = function ($app, ctx) {
    const S_ = S();
    const week = weekSessions(7), t = tot(week), answered = t.fast + t.slow + t.wrong + t.idk;
    const prev = weekSessions(14, 7), tp = tot(prev);
    const fa = t.fact, fAns = fa.fast + fa.slow + fa.wrong + fa.idk, fp = tp.fact, fAnsPrev = fp.fast + fp.slow + fp.wrong + fp.idk;
    const tried = Object.keys(S_.facts).length, yours = EM.countYours();
    const { wk, rows } = targets();
    const h = t.how, hn = h.knew + h.trick + h.counted, hp = tp.how, hnp = hp.knew + hp.trick + hp.counted;
    const backupDue = !S_.backupAt || Date.now() - S_.backupAt > 7 * DAY;
    const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
    const arrow = (now, before) => before === null || before === undefined ? '' : now > before ? ' ↑' : now < before ? ' ↓' : ' →';

    // calendar: last 28 days
    const today = startOfDay(Date.now());
    const cal = range(27, 0).map(i => { const d = dayStr(today - i * DAY); const on = S_.days[d] && S_.days[d].items > 0; return `<div class="${on ? 'on' : ''}${i === 0 ? ' today' : ''}" title="${d}"></div>`; }).join('');

    const skillRows = EM.SKILLS.map(s => {
      const st = EM.skillSummary(s.id), rec = EM.skillRec(s.id);
      const lvl = s.kind === 'proc' ? `${s.levels[st.level]}${st.done ? ' ✓' : ''}` : `${EM.factSkillStats(s).yours}/${s.facts.length} hers`;
      return `<tr><td>${s.icon} ${esc(s.name)}</td><td style="width:34%"><span class="bar"><i class="f" style="width:${st.progress * 100}%"></i><i class="l" style="width:${(st.learningPct || 0) * 100}%"></i></span></td><td>${lvl}</td><td>${st.open ? 'Open' : '🔒'}</td>
        <td>${pinOk ? `<label style="font-size:13px"><input type="checkbox" data-manual="${s.id}" ${rec.manual ? 'checked' : ''}> force open</label>` : ''}</td></tr>`;
    }).join('');

    let grid = '<div class="h">+</div>' + range(1, 10).map(b => `<div class="h">${b}</div>`).join('');
    for (const a of range(1, 10)) { grid += `<div class="h">${a}</div>`; for (const b of range(1, 10)) { const k = `add:${a}+${b}`, s = statusOf(k), r = S_.facts[k]; grid += `<div class="${STATUS[s][0]}" title="${a} + ${b}: ${STATUS[s][1]}${r ? `, avg ${sec(EM.avgTime(r))}` : ''}">${a + b}</div>`; } }

    const trouble = Object.keys(EM.FACTS).filter(k => S_.facts[k]).map(k => { const r = S_.facts[k], avg = EM.avgTime(r); return { k, r, avg, score: (r.wrong + r.idk) * 2 + (r.box === 0 ? 2 : 0) + (avg > EM.fastMs(EM.factItem(k), 0) ? 1 : 0) + (r.peak >= 2 && r.box < 2 ? 2 : 0) }; }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 12);

    const sessRows = S_.sessions.slice(-14).reverse().map(s => `<tr><td>${new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td><td>${esc(s.title)}</td><td>${s.items}</td><td>${s.fast}</td><td>${s.slow}</td><td>${s.wrong}</td><td>${s.idk}</td><td>${s.rushed}</td><td>${sec(s.avg)}</td><td>${s.minutes || ''}</td></tr>`).join('');

    $app.innerHTML = `<main class="wrap parent">
      <div class="row"><h1>Grown-ups</h1><button class="btn secondary small" data-act="home">Done</button></div>

      <section><h2>This week (week ${wk} of the catch-up)</h2>
        <div class="kpis">
          <div class="kpi"><b>${week.length}</b><span>sessions · ${Math.round(t.minutes)} min</span></div>
          <div class="kpi ${yours ? 'ok' : ''}"><b>${yours}</b><span>facts hers for keeps, of ${tried} tried</span></div>
          <div class="kpi ok"><b>${pct(fa.fast, fAns)}%${arrow(pct(fa.fast, fAns), fAnsPrev ? pct(fp.fast, fAnsPrev) : null)}</b><span>facts fast and right (known)</span></div>
          <div class="kpi"><b>${pct(fa.slow, fAns)}%${arrow(pct(fa.slow, fAns), fAnsPrev ? pct(fp.slow, fAnsPrev) : null)}</b><span>facts right but slow (still counting)</span></div>
          <div class="kpi ${t.rushed ? 'warn' : 'ok'}"><b>${t.rushed}</b><span>rushed guesses</span></div>
          <div class="kpi"><b>${t.idk}</b><span>"I don't know" · ${t.learned} learned after help</span></div>
          <div class="kpi ${hn && h.counted / hn > 0.5 ? 'warn' : ''}"><b>${hn ? Math.round(h.counted / hn * 100) + '%' : '–'}${hnp ? arrow(Math.round(h.counted / hn * 100), Math.round(hp.counted / hnp * 100)) : ''}</b><span>"I counted" when asked how she knew (${hn} asked this week)</span></div>
          ${t.teach.n ? `<div class="kpi ${t.teach.ok / t.teach.n >= 0.8 ? 'ok' : 'warn'}"><b>${pct(t.teach.ok, t.teach.n)}%</b><span>Teach Dot: facts still hers on a later check (${t.teach.ok}/${t.teach.n}); caught ${t.teach.caught} of ${t.teach.dotWrong} of Dot's mistakes</span></div>` : ''}
          ${t.est.round.n ? `<div class="kpi"><b>${pct(t.est.round.ok, t.est.round.n)}% · ${pct(t.est.combine.ok, t.est.combine.n)}%</b><span>estimating: rounding steps right · adding steps right</span></div>` : ''}
        </div>
        <p style="margin-top:12px;color:var(--muted)">The signal you want: <b>fast-and-right rising</b>, <b>slow-right and "I counted" falling</b>, rushed guesses near zero. Percentages are facts only; big-number work is tracked on the skill ladder below.</p>
        ${backupDue ? '<p style="color:var(--danger)">No backup in the last week. Open Settings and save one (it takes 10 seconds).</p>' : ''}
        <div class="cal">${cal}</div><p style="font-size:13px;color:var(--muted);margin-top:6px">Last 28 days. Green = practiced.</p>
      </section>

      <section><h2>Catch-up targets</h2><ul class="targets">
        ${rows.map(r => `<li><span>${esc(r.name)} <span style="color:var(--muted)">(by week ${r.by})</span></span><span class="st ${r.ok ? 'ok' : r.late ? 'late' : ''}">${r.fmt(r.val)}${r.ok ? ' ✓' : r.late ? ' · behind' : ''}</span></li>`).join('')}
      </ul><p style="color:var(--muted)">If a target is behind by its week, change something (more minutes, more of you at the end, a different off-screen game) rather than waiting.</p></section>

      <section><h2>Skills</h2>
        <p>Rungs open when the skills they build on are 80% hers. Green is hers, yellow is learning.</p>
        <div class="scroll"><table><tbody>${skillRows}</tbody></table></div></section>

      <section><h2>Addition facts 1–10</h2><div class="grid">${grid}</div>
        <div class="legend">${STATUS.map(([c, l]) => `<span><i class="${c}"></i>${l}</span>`).join('')}</div></section>

      <section><h2>Needs work</h2>
        ${trouble.length ? `<div class="scroll"><table><thead><tr><th>Fact</th><th>Missed</th><th>Didn't know</th><th>Avg time</th><th>Status</th></tr></thead><tbody>
          ${trouble.map(x => `<tr><td>${esc(EM.labelFact(EM.FACTS[x.k]))}</td><td>${x.r.wrong}</td><td>${x.r.idk}</td><td>${sec(x.avg)}</td><td>${STATUS[statusOf(x.k)][1]}${x.r.peak >= 2 && x.r.box < 2 ? ' (slipped)' : ''}</td></tr>`).join('')}
        </tbody></table></div>` : '<p>Nothing yet. This fills in after a few sessions.</p>'}</section>

      <section><h2>Recent sessions</h2>
        ${sessRows ? `<div class="scroll"><table><thead><tr><th>Date</th><th>Practice</th><th>Qs</th><th>Fast</th><th>Slow</th><th>Missed</th><th>IDK</th><th>Rushed</th><th>Avg</th><th>Min</th></tr></thead><tbody>${sessRows}</tbody></table></div>` : '<p>No sessions yet.</p>'}</section>

      <section><h2>Your voice 🎙️</h2>
        <p>Record a few 3-second clips ("That's my girl!", "So proud of you"). The app plays one at the big moments: when a fact becomes hers, when a skill unlocks, and after a session where she learned something she didn't know.</p>
        <div class="clips" id="clips">Loading…</div></section>

      <section><h2>Settings ${pinOk ? '' : '🔒'}</h2>
        ${pinOk ? settingsHTML(S_) : `<p>${S_.settings.pin ? 'Enter the grown-up PIN.' : 'Choose a 4-digit grown-up PIN to protect settings and reset.'}</p>
          <div class="pinpad"><input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" id="pin" placeholder="••••" style="max-width:100%;font-size:28px;text-align:center;letter-spacing:.4em"><br>
          ${S_.settings.pin ? `<p style="font-size:14px;color:var(--muted)">Hint: ${esc(S_.settings.pinHint || 'none')}</p>` : '<input type="text" id="pinHint" placeholder="A hint for yourself" style="max-width:100%;margin-top:8px">'}
          <button class="btn secondary small" data-act="pin" style="margin-top:10px">${S_.settings.pin ? 'Unlock' : 'Set PIN'}</button></div>`}
      </section>

      <section><h2>How Ellie Math works</h2><ul>
        <li><b>No multiple choice.</b> Every answer is typed. There's nothing to tap through.</li>
        <li><b>Three outcomes.</b> Fast-right means she knows it. Slow-right is praised but tells you she's still counting, so the fact stays in practice. Wrong or "I don't know" turns into a picture lesson with a guiding question first; the answer only appears after a second try.</li>
        <li><b>Retention, not completion.</b> A fact is hers only after a fast, correct answer on two different days, reviewed again after 2, 4, 8 and 16 days. One miss sends it back.</li>
        <li><b>Procedures</b> (rounding, place value, estimating) count as solid when 8 of her last 10 unscaffolded tries were fast and right, across two days. The number line fades as she gets better.</li>
        <li><b>Guessing gets flagged.</b> Wrong answers in about a second count as rushed. She's told to slow down, and you see the count above.</li>
        <li><b>Finger counting</b> is a stage, not a sin. Quick Look flashes dots so counting fails and seeing wins. Naming her trick before typing nudges her toward strategies. "How did you know?" tells you both whether recall is real.</li>
        <li><b>Dimensions Math language</b>: number bonds, make 10, place-value discs, "nearer to," column regrouping.</li>
      </ul></section>

      <section><h2>Off-screen, 5 minutes that matter</h2><ul>
        <li>React to the card at the end of each session. Praise the specific thing: "you didn't count that."</li>
        <li>Ask <b>"how did you know?"</b> about any number at dinner. "I counted" is honest and useful.</li>
        <li>Egg carton with 10 cups and pennies: "7 in, how many more to make 10?" Then with the lid closed.</li>
        <li>Dice, dominoes, cards: say the total without counting. You do it out loud too: "I see 5 and 3, so 8."</li>
        <li>Tape a number line on the floor, 30 to 40. Stand on 37, walk to the nearer ten, count steps both ways. Then 300 to 400 on paper, then 3,000 to 4,000.</li>
      </ul></section>
    </main>`;
    renderClips();
  };

  function settingsHTML(S_) {
    const st = S_.settings;
    return `
      <label class="set">Child's name <input type="text" data-set="name" value="${esc(S_.name)}" maxlength="20"></label>
      <label class="set">An answer counts as "known" within <select data-set="fastSec">${[2, 3, 4, 5, 6].map(v => `<option value="${v}" ${st.fastSec === v ? 'selected' : ''}>${v} s (+0.6 s per extra digit)</option>`).join('')}</select></label>
      <label class="set">Parts per daily session <select data-set="blocks">${[1, 2, 3].map(v => `<option value="${v}" ${st.blocks === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="set">Minutes per part <select data-set="blockMin">${[3, 4, 5, 6, 7].map(v => `<option value="${v}" ${st.blockMin === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="set">Read prompts aloud <input type="checkbox" data-set="tts" ${st.tts ? 'checked' : ''}></label>
      <label class="set">School work: estimating by rounding <input type="checkbox" data-bridge="est" ${st.bridge.est !== false ? 'checked' : ''}></label>
      <label class="set">School work: column add/subtract with regrouping <input type="checkbox" data-bridge="regroup" ${st.bridge.regroup !== false ? 'checked' : ''}></label>
      <label class="set">Grown-up PIN <button class="btn secondary small" data-act="changePin">Change PIN</button></label>
      <p style="margin-top:12px"><button class="btn secondary small" data-act="export">Save a backup</button>
        <button class="btn secondary small" data-act="import">Restore backup</button>
        <button class="btn secondary small danger" data-act="reset">Reset all progress</button>
        <input type="file" id="importFile" accept="application/json" hidden></p>
      <p style="color:var(--muted)">Progress lives on this device. ${S_.backupAt ? `Last backup ${new Date(S_.backupAt).toLocaleDateString()}.` : 'No backup yet. Make one once a week.'}</p>`;
  }

  async function renderClips() {
    const el = document.getElementById('clips'); if (!el) return;
    if (!EM.clips.supported()) { el.innerHTML = '<p style="color:var(--muted)">Recording isn\'t available in this browser. On the iPad, open the app from the home screen or in Safari.</p>'; return; }
    const have = await EM.clips.list();
    el.innerHTML = EM.clips.keys.map((k, i) => have.includes(k)
      ? `<span><button class="btn secondary small" data-clip-play="${k}">▶ Clip ${i + 1}</button><button class="btn secondary small danger" data-clip-del="${k}">✕</button></span>`
      : `<button class="btn secondary small" data-clip-rec="${k}">🎙️ Record clip ${i + 1}</button>`).join('') + '<p id="clipstatus" style="font-size:14px;color:var(--muted);margin-top:8px"></p>';
  }

  // ---------- events ----------
  // Share sheet on iPad (Files, AirDrop, Mail), download elsewhere. Only a confirmed save counts as a backup.
  async function exportBackup() {
    const name = `ellie-math-${dayStr(Date.now())}.json`, json = JSON.stringify(S(), null, 1);
    let ok = false;
    try {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); ok = true; }
    } catch (e) { if (e && e.name === 'AbortError') return false; }
    if (!ok) {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const link = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      ok = confirm(`Did the file "${name}" save? (Check Downloads or the Files app.)`);
    }
    if (ok) { S().backupAt = Date.now(); EM.save(); EM.render(); }
    return ok;
  }
  document.addEventListener('click', async e => {
    const a = e.target.closest('[data-act]');
    if (a && document.querySelector('.parent')) {
      switch (a.dataset.act) {
        case 'pin': {
          const v = (document.getElementById('pin') || {}).value || '';
          if (!/^\d{4}$/.test(v)) { alert('Four digits, please.'); return; }
          if (!S().settings.pin) { S().settings.pin = v; S().settings.pinHint = (document.getElementById('pinHint') || {}).value || ''; EM.save(); pinOk = true; }
          else if (v === S().settings.pin) pinOk = true; else { alert('That PIN is not right.'); return; }
          EM.render(); return;
        }
        case 'export': return exportBackup();
        case 'import': return document.getElementById('importFile').click();
        case 'changePin': {
          const a = prompt('New 4-digit PIN'); if (!/^\d{4}$/.test(a || '')) { if (a !== null) alert('Four digits, please.'); return; }
          const b = prompt('Type it again'); if (a !== b) { alert("Those didn't match. PIN not changed."); return; }
          S().settings.pin = a; S().settings.pinHint = prompt('A hint for yourself (optional)', S().settings.pinHint || '') || ''; EM.save();
          alert(`PIN changed. Hint: ${S().settings.pinHint || 'none'}`); return;
        }
        case 'reset': {
          const saved = await exportBackup();
          if (!saved && !confirm('No backup was saved. Erase anyway?')) return;
          const word = prompt('Type RESET to erase all progress on this device.');
          if (word === 'RESET') { try { await EM.idbPut('state:before-reset', JSON.stringify(S())); } catch (e) {} EM.resetState(); pinOk = false; EM.go('home'); }
          return;
        }
      }
    }
    const rec = e.target.closest('[data-clip-rec]');
    if (rec) {
      const status = document.getElementById('clipstatus');
      try {
        await EM.clips.start();
        rec.textContent = '● Recording… (3 s)'; rec.disabled = true;
        setTimeout(async () => { try { await EM.clips.stop(rec.dataset.clipRec); S().clipCount = (await EM.clips.list()).length; EM.save(); } catch (err) { if (status) status.textContent = 'Could not save the clip.'; } renderClips(); }, 3000);
      } catch (err) { if (status) status.textContent = 'Microphone permission is needed to record.'; }
      return;
    }
    const pl = e.target.closest('[data-clip-play]'); if (pl) return EM.clips.play(pl.dataset.clipPlay);
    const del = e.target.closest('[data-clip-del]'); if (del) { await EM.clips.remove(del.dataset.clipDel); renderClips(); }
  });
  document.addEventListener('change', e => {
    if (!document.querySelector('.parent')) return;
    const S_ = S();
    if (e.target.id === 'importFile' && e.target.files[0]) {
      e.target.files[0].text().then(t => {
        try { const s = JSON.parse(t); if (!s.facts || !s.settings) throw 0; const n = (s.sessions || []).length; if (!confirm(`Replace everything on this device with this backup (${n} sessions, ${Object.keys(s.facts).length} facts)?`)) return; EM.idbPut('state:before-restore', JSON.stringify(S())).catch(() => {}); EM.replaceState(s); alert('Backup restored.'); EM.render(); }
        catch (err) { alert("That file doesn't look like an Ellie Math backup."); }
      });
      return;
    }
    const m = e.target.dataset.manual;
    if (m) { EM.skillRec(m).manual = e.target.checked; EM.save(); EM.render(); return; }
    const b = e.target.dataset.bridge;
    if (b) { S_.settings.bridge[b] = e.target.checked; EM.save(); return; }
    const key = e.target.dataset.set; if (!key) return;
    if (key === 'name') S_.name = e.target.value.trim() || '';
    else if (e.target.type === 'checkbox') S_.settings[key] = e.target.checked;
    else S_.settings[key] = Number(e.target.value);
    EM.save();
  });
})();
