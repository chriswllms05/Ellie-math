/* Ellie Math — how a spoken line maps onto Dot's recorded clips (Azure "Ana", recorded once by tools/voice/build.js).
   Shared by the app and the build script so both cut a line into exactly the same keys.
   A sentence plays as one whole clip when it was recorded; otherwise it is joined from recorded phrases and numbers. */
'use strict';
(function (root) {
  const NUM = /\d{1,3}(?:,\d{3})+s?|\d+s?/g;
  // Spoken form: symbols as words, her name left out (clips can't know it), one kind of pause mark.
  function normalize(text, names = []) {
    let s = String(text || '').replace(/<[^>]+>/g, '').replace(/ /g, ' ')
      .replace(/…/g, ',').replace(/×/g, ' times ').replace(/−/g, ' minus ').replace(/\+/g, ' plus ').replace(/=/g, ' equals ');
    for (const n of names) {
      if (!n) continue;
      const e = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      s = s.replace(new RegExp(`,\\s*${e}(?=\\s*[!.?,])`, 'g'), '').replace(new RegExp(`\\b${e},\\s*`, 'g'), '');
    }
    return s.replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').replace(/,(\s*,)+/g, ',').trim();
  }
  const sentences = s => s.split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean);
  const key = s => s.replace(/\.$/, '').trim();
  // Numbers as recorded pieces: 0–100 whole, then "4,000" + "300" + "72".
  function numberKeys(n) {
    if (n <= 100) return [`n:${n}`];
    const out = [], t = Math.floor(n / 1000), h = Math.floor((n % 1000) / 100), r = n % 100;
    if (t) out.push(...(t <= 10 ? [`n:${(t * 1000).toLocaleString('en-US')}`] : [...numberKeys(t), 'n:thousand']));
    if (h) out.push(`n:${h * 100}`);
    if (r) out.push(`n:${r}`);
    return out;
  }
  // A sentence as pieces: [{ k, gap }] where gap is the pause (ms) after it.
  function pieces(sentence) {
    const out = [];
    let last = 0;
    const text = part => {
      const comma = /,\s*$/.test(part), lead = /^\s*,/.test(part);
      if (lead && out.length) out[out.length - 1].gap = 160;
      const p = part.replace(/^[\s,]+|[\s,]+$/g, '');
      if (/[A-Za-z]/.test(p)) out.push({ k: `p:${key(p)}`, gap: comma ? 160 : 40 });
      else if (comma && out.length) out[out.length - 1].gap = 160;
    };
    sentence.replace(NUM, (m, at) => {
      text(sentence.slice(last, at));
      last = at + m.length;
      if (/s$/.test(m)) out.push({ k: `p:${m}`, gap: 40 });
      else numberKeys(Number(m.replace(/,/g, ''))).forEach(k => out.push({ k, gap: 40 }));
      return m;
    });
    text(sentence.slice(last));
    return out;
  }
  // The whole line as clips, or null if any part was never recorded.
  function plan(text, has, names) {
    const out = [];
    for (const s of sentences(normalize(text, names))) {
      const whole = `s:${key(s)}`;
      if (has(whole)) out.push({ k: whole, gap: 300 });
      else {
        const ps = pieces(s);
        if (!ps.length || !ps.every(p => has(p.k))) return null;
        ps[ps.length - 1].gap = 300;
        out.push(...ps);
      }
    }
    return out.length ? out : null;
  }
  // The words Azure is asked to say for a key.
  const spoken = k => k.slice(2);
  const api = { normalize, sentences, key, pieces, numberKeys, plan, spoken };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.EM = root.EM || {}).voice = api;
})(typeof window !== 'undefined' ? window : this);
