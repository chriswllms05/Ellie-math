/* Ellie Math — her avatar: she builds it, it lives only on this device (saved state, never in the repo).
   Drawn in Dot's flat, round style. Poses: wave (home), teach (whiteboard, holding a marker), cheer (celebrations). */
'use strict';
(function () {
  const EM = window.EM;
  const SKIN = ['#fde3cf', '#f6cba5', '#e8b07f', '#c98a5a', '#9a6440', '#6b4128'];
  const HAIR_COLORS = ['#2b1d16', '#4a2c1d', '#7a4b2a', '#b5702f', '#e8bf62', '#c2412d', '#8a63d8', '#2f8fe0'];
  const SHIRTS = ['#ef6a4c', '#f0b429', '#5bc77a', '#36b5c5', '#4f7be0', '#8d6be8', '#e56bb3', '#3f4a56'];
  const STYLES = ['short', 'bob', 'long', 'ponytail', 'puffs', 'curly', 'braids'];
  const GLASSES = ['none', 'round', 'square'];
  const EXTRAS = ['none', 'bow', 'headband', 'star', 'lanyard'];
  const DEFAULT = { skin: 1, hair: 'long', hairColor: 1, glasses: 'none', shirt: 6, extra: 'bow' };
  const OPTIONS = { SKIN, HAIR_COLORS, SHIRTS, STYLES, GLASSES, EXTRAS };

  const get = () => Object.assign({}, DEFAULT, (EM.S && EM.S.avatar) || {});

  // Hair: [behind the head, in front of the head]
  function hair(style, c) {
    switch (style) {
      case 'short': return ['', `<path d="M23 40 Q22 12 50 11 Q78 12 77 40 Q72 26 50 25 Q30 26 23 40z" fill="${c}"/>`];
      case 'bob': return [`<path d="M20 42 Q18 10 50 10 Q82 10 80 42 L80 64 Q72 70 66 62 L66 40 L34 40 L34 62 Q28 70 20 64z" fill="${c}"/>`, `<path d="M24 40 Q24 14 50 13 Q76 14 76 40 Q66 24 46 27 Q32 30 24 40z" fill="${c}"/>`];
      case 'long': return [`<path d="M19 42 Q17 9 50 9 Q83 9 81 42 L84 92 Q66 98 62 84 L62 46 L38 46 L38 84 Q34 98 16 92z" fill="${c}"/>`, `<path d="M24 41 Q23 13 50 12 Q77 13 76 41 Q70 25 54 26 Q40 22 24 41z" fill="${c}"/>`];
      case 'ponytail': return [`<path d="M74 30 Q98 34 92 70 Q86 82 80 74 Q90 56 76 42z" fill="${c}"/>`, `<path d="M23 41 Q22 12 50 11 Q78 12 77 41 Q70 24 50 25 Q30 25 23 41z" fill="${c}"/><circle cx="76" cy="32" r="5" fill="#ef6a4c"/>`];
      case 'puffs': return [`<circle cx="22" cy="18" r="15" fill="${c}"/><circle cx="78" cy="18" r="15" fill="${c}"/>`, `<path d="M24 40 Q23 13 50 13 Q77 13 76 40 Q68 25 50 26 Q32 25 24 40z" fill="${c}"/>`];
      case 'curly': {
        let b = ''; for (let i = 0; i < 12; i++) { const a = Math.PI * (0.95 + i * 0.105), x = 50 + Math.cos(a) * 31, y = 40 + Math.sin(a) * 31; b += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="${c}"/>`; }
        return [`${b}<circle cx="20" cy="56" r="10" fill="${c}"/><circle cx="80" cy="56" r="10" fill="${c}"/>`, `<path d="M25 38 Q30 18 50 17 Q70 18 75 38 Q62 28 50 30 Q38 28 25 38z" fill="${c}"/>`];
      }
      case 'braids': return [`<path d="M26 50 q-6 14 0 26 q-6 10 0 22" stroke="${c}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M74 50 q6 14 0 26 q6 10 0 22" stroke="${c}" stroke-width="11" fill="none" stroke-linecap="round"/>`, `<path d="M23 41 Q22 12 50 11 Q78 12 77 41 Q70 25 50 26 Q30 25 23 41z" fill="${c}"/><circle cx="26" cy="100" r="4" fill="#e56bb3"/><circle cx="74" cy="100" r="4" fill="#e56bb3"/>`];
    }
    return ['', ''];
  }

  function draw(av = get(), size = 80, pose = 'wave', opts = {}) {
    const skin = SKIN[av.skin] || SKIN[1], hc = HAIR_COLORS[av.hairColor] || HAIR_COLORS[1], shirt = SHIRTS[av.shirt] || SHIRTS[6];
    const [hBack, hFront] = hair(av.hair, hc);
    const armL = pose === 'cheer' ? `<path d="M30 80 q-14 -16 -10 -34" stroke="${shirt}" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="20" cy="44" r="6" fill="${skin}"/>` : `<path d="M30 82 q-10 12 -8 26" stroke="${shirt}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
    const armR = pose === 'wave' ? `<path d="M70 80 q14 -12 12 -32" stroke="${shirt}" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="82" cy="46" r="6" fill="${skin}" class="wavehand"/>`
      : pose === 'teach' ? `<path d="M70 82 q16 -4 26 -14" stroke="${shirt}" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="97" cy="67" r="6" fill="${skin}"/><rect x="96" y="54" width="6" height="16" rx="2" fill="#4f7be0" transform="rotate(35 99 62)"/>`
      : pose === 'cheer' ? `<path d="M70 80 q14 -16 10 -34" stroke="${shirt}" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="80" cy="44" r="6" fill="${skin}"/>`
      : `<path d="M70 82 q10 12 8 26" stroke="${shirt}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
    const eyes = pose === 'cheer' ? '<path d="M38 43 q4 -5 8 0 M54 43 q4 -5 8 0" stroke="#2b1d1a" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : '<ellipse cx="42" cy="43" rx="3.2" ry="4" fill="#2b1d1a"/><ellipse cx="58" cy="43" rx="3.2" ry="4" fill="#2b1d1a"/><circle cx="43" cy="41.5" r="1.1" fill="#fff"/><circle cx="59" cy="41.5" r="1.1" fill="#fff"/>';
    const mouth = pose === 'cheer' ? '<path d="M42 52 q8 10 16 0z" fill="#7a2a22"/>' : '<path d="M43 53 q7 6 14 0" stroke="#7a2a22" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    const glasses = av.glasses === 'round' ? '<g fill="none" stroke="#2b1d1a" stroke-width="2.4"><circle cx="42" cy="43" r="7.5"/><circle cx="58" cy="43" r="7.5"/><path d="M49.5 43 h1"/></g>'
      : av.glasses === 'square' ? '<g fill="none" stroke="#2b1d1a" stroke-width="2.4"><rect x="34" y="37" width="15" height="12" rx="3"/><rect x="51" y="37" width="15" height="12" rx="3"/><path d="M49 42 h2"/></g>' : '';
    const extra = av.extra === 'bow' ? '<g transform="translate(66 15)"><path d="M0 0 l-11 -7 v14z M0 0 l11 -7 v14z" fill="#e56bb3"/><circle r="3.5" fill="#c94a94"/></g>'
      : av.extra === 'headband' ? '<path d="M24 31 Q50 12 76 31" stroke="#f0b429" stroke-width="5" fill="none" stroke-linecap="round"/>'
      : av.extra === 'star' ? '<path d="M70 18 l2.6 5.6 6.1 .7 -4.6 4.1 1.3 6 -5.4 -3.1 -5.4 3.1 1.3 -6 -4.6 -4.1 6.1 -.7z" fill="#ffd23f"/>'
      : av.extra === 'lanyard' ? '<path d="M40 70 L50 94 L60 70" stroke="#36b5c5" stroke-width="3" fill="none"/><rect x="43" y="92" width="14" height="17" rx="2" fill="#fff" stroke="#36b5c5" stroke-width="2"/><path d="M46 99 h8 M46 103 h6" stroke="#9aa3ad" stroke-width="1.6"/>' : '';
    return `<svg class="avatar pose-${pose}${opts.cls ? ' ' + opts.cls : ''}" width="${size}" height="${size * 1.2}" viewBox="0 0 110 132" role="img" aria-label="${EM.esc((EM.S && EM.S.name) || 'You')}">
      ${hBack}<rect x="26" y="70" width="48" height="54" rx="22" fill="${shirt}"/>${armL}${armR}
      <rect x="44" y="60" width="12" height="14" rx="5" fill="${skin}"/>
      <circle cx="50" cy="42" r="25" fill="${skin}"/><circle cx="25" cy="45" r="5" fill="${skin}"/><circle cx="75" cy="45" r="5" fill="${skin}"/>
      ${hFront}${eyes}<ellipse cx="35" cy="51" rx="4.5" ry="3" fill="#ff8f8f" opacity=".45"/><ellipse cx="65" cy="51" rx="4.5" ry="3" fill="#ff8f8f" opacity=".45"/>${mouth}${glasses}${extra}</svg>`;
  }

  // ---------- builder ----------
  function builder(first) {
    const av = get(), name = EM.esc((EM.S && EM.S.name) || '');
    const row = (title, items) => `<div class="avrow"><div class="avlab">${title}</div><div class="avopts">${items}</div></div>`;
    const sw = (key, val, color, on) => `<button class="avsw${on ? ' on' : ''}" data-av="${key}" data-val="${val}" style="background:${color}" aria-label="${key} ${val}"></button>`;
    const mini = (key, val, label, on, preview) => `<button class="avchip${on ? ' on' : ''}" data-av="${key}" data-val="${val}">${preview || ''}<span>${label}</span></button>`;
    const prev = patch => draw(Object.assign({}, av, patch), 46, 'none');
    return `<main class="wrap avbuild">
      ${first ? '' : '<button class="back" data-act="home">‹ Back</button>'}
      <div class="home-top">${EM.theme.dot('happy', 60)}<h1>${first ? 'Now make you!' : 'Change me'}</h1></div>
      <div class="avstage"><div class="avpreview">${draw(av, 150, 'wave')}</div>
        <label class="avname">What should Dot call you?<input type="text" id="avName" maxlength="16" value="${name}" placeholder="Your name" autocomplete="off"></label></div>
      ${row('Skin', SKIN.map((c, i) => sw('skin', i, c, av.skin === i)).join(''))}
      ${row('Hair', STYLES.map(s => mini('hair', s, s, av.hair === s, prev({ hair: s }))).join(''))}
      ${row('Hair color', HAIR_COLORS.map((c, i) => sw('hairColor', i, c, av.hairColor === i)).join(''))}
      ${row('Glasses', GLASSES.map(g => mini('glasses', g, g, av.glasses === g, prev({ glasses: g }))).join(''))}
      ${row('Shirt', SHIRTS.map((c, i) => sw('shirt', i, c, av.shirt === i)).join(''))}
      ${row('Extra', EXTRAS.map(x => mini('extra', x, x, av.extra === x, prev({ extra: x }))).join(''))}
      <button class="big-btn" data-av-done="1" style="margin-top:18px">${first ? "That's me!" : 'Done'}</button>
    </main>`;
  }
  function set(key, val) {
    const av = get();
    av[key] = ['skin', 'hairColor', 'shirt'].includes(key) ? Number(val) : val;
    EM.S.avatar = av; EM.save();
  }

  EM.avatar = { draw, builder, set, get, OPTIONS };
})();
