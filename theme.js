/* Ellie Math — themes she picks (Garden, Ocean, Space), the companion Dot, and the collection pictures.
   Everything is inline SVG so it works offline and recolors with the theme. */
'use strict';
(function () {
  const EM = window.EM;

  // ---------- Dot, the companion: a ten-frame dot with a face ----------
  // moods: calm (default, blinks), think (looking at the question), happy (fast answer), proud (right answer),
  // curious (a miss; never sad), wow (big moment), cheer (celebration, arms up)
  function dot(mood = 'calm', size = 48, opts = {}) {
    const eyes = {
      calm: '<g class="blink"><ellipse cx="38" cy="44" rx="5" ry="6.5"/><ellipse cx="62" cy="44" rx="5" ry="6.5"/></g>',
      think: '<g class="blink"><ellipse cx="41" cy="41" rx="5" ry="6.5"/><ellipse cx="65" cy="41" rx="5" ry="6.5"/></g><circle cx="43" cy="38.5" r="1.8" fill="#fff"/><circle cx="67" cy="38.5" r="1.8" fill="#fff"/>',
      happy: '<path d="M31 46 q7 -9 14 0 M55 46 q7 -9 14 0" fill="none" stroke-width="5" stroke-linecap="round"/>',
      proud: '<path d="M31 45 q7 -7 14 0 M55 45 q7 -7 14 0" fill="none" stroke-width="5" stroke-linecap="round"/>',
      curious: '<ellipse cx="38" cy="45" rx="5" ry="6.5"/><ellipse cx="62" cy="43" rx="6" ry="7.5"/><path d="M55 31 q8 -5 15 1" fill="none" stroke-width="4" stroke-linecap="round"/>',
      wow: '<ellipse cx="38" cy="43" rx="6.5" ry="8"/><ellipse cx="62" cy="43" rx="6.5" ry="8"/><circle cx="40" cy="40" r="2.2" fill="#fff"/><circle cx="64" cy="40" r="2.2" fill="#fff"/>',
      cheer: '<path d="M31 45 q7 -9 14 0 M55 45 q7 -9 14 0" fill="none" stroke-width="5" stroke-linecap="round"/>',
    }[mood] || '';
    const mouth = {
      calm: '<path d="M42 60 q8 7 16 0" fill="none" stroke-width="4" stroke-linecap="round"/>',
      think: '<path d="M44 62 h12" fill="none" stroke-width="4" stroke-linecap="round"/>',
      happy: '<path d="M38 57 q12 14 24 0 z" class="fillmouth"/>',
      proud: '<path d="M40 59 q10 9 20 0" fill="none" stroke-width="4.5" stroke-linecap="round"/>',
      curious: '<ellipse cx="51" cy="62" rx="4.5" ry="5" class="fillmouth"/>',
      wow: '<ellipse cx="50" cy="62" rx="7" ry="8" class="fillmouth"/>',
      cheer: '<path d="M36 56 q14 17 28 0 z" class="fillmouth"/>',
    }[mood] || '';
    const arms = mood === 'cheer' ? '<path class="arm" d="M14 50 q-8 -14 -2 -26 M86 50 q8 -14 2 -26" fill="none" stroke-width="7" stroke-linecap="round"/>'
      : mood === 'wow' ? '<path class="arm" d="M14 56 q-9 -4 -10 -14 M86 56 q9 -4 10 -14" fill="none" stroke-width="7" stroke-linecap="round"/>' : '';
    const cheeks = ['happy', 'proud', 'cheer', 'wow'].includes(mood) ? '<ellipse cx="27" cy="57" rx="6" ry="4" class="cheek"/><ellipse cx="73" cy="57" rx="6" ry="4" class="cheek"/>' : '';
    const sparkle = ['wow', 'cheer'].includes(mood) ? '<path class="spark" d="M88 14 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path class="spark s2" d="M10 12 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>' : '';
    const glasses = (opts.glasses !== false && EM.S && EM.S.theme === 'classroom') ? '<g class="glasses"><circle cx="38" cy="44" r="11"/><circle cx="62" cy="44" r="11"/><path d="M49 43 h2 M27 42 l-9 -3 M73 42 l9 -3"/></g>' : '';
    return `<svg class="dotpal mood-${mood}${opts.cls ? ' ' + opts.cls : ''}" width="${size}" height="${size}" viewBox="-6 -6 112 112" role="img" aria-label="Dot">
      ${arms}<circle class="body" cx="50" cy="52" r="38"/><ellipse class="shine" cx="36" cy="30" rx="11" ry="6"/>
      <g class="face">${eyes}${mouth}</g>${glasses}${cheeks}${sparkle}</svg>`;
  }

  // ---------- collection items ----------
  const PALETTES = {
    garden: ['#ef6a4c', '#f0b429', '#e56bb3', '#8d6be8', '#4fa3e0', '#ff8f6b'],
    ocean: ['#ff9f43', '#ffd166', '#ff6b9d', '#7bdff2', '#b388ff', '#5ee6a8'],
    space: ['#ffe066', '#ffffff', '#9ad1ff', '#ffb3e6', '#b6ff9e', '#ffcf8a'],
  };
  function flower(i) {
    const c = PALETTES.garden[i % 6], petals = 5 + (i % 3), r = 9;
    let p = '';
    for (let k = 0; k < petals; k++) { const a = (k / petals) * Math.PI * 2; p += `<ellipse cx="${20 + Math.cos(a) * r}" cy="${16 + Math.sin(a) * r}" rx="6.5" ry="6.5" fill="${c}"/>`; }
    return `<svg viewBox="0 0 40 56" class="item"><path d="M20 26 v28" stroke="#4f9a5b" stroke-width="3.5"/><path d="M20 42 q-9 -2 -11 -9 q9 0 11 7" fill="#5fb36b"/>${p}<circle cx="20" cy="16" r="6" fill="#ffe08a"/></svg>`;
  }
  function fish(i) {
    const c = PALETTES.ocean[i % 6], flip = i % 2 ? ' transform="translate(48 0) scale(-1 1)"' : '';
    return `<svg viewBox="0 0 48 34" class="item"><g${flip}><path d="M36 17 l11 -9 v18z" fill="${c}"/><ellipse cx="21" cy="17" rx="17" ry="12" fill="${c}"/><path d="M14 8 q6 9 0 18" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none"/><circle cx="11" cy="14" r="3.2" fill="#1d2b4a"/><circle cx="10" cy="13" r="1.1" fill="#fff"/></g></svg>`;
  }
  function star(i) {
    const c = PALETTES.space[i % 6], s = 0.75 + ((i * 37) % 10) / 20;
    return `<svg viewBox="0 0 40 40" class="item" style="--s:${s}"><path d="M20 3 l4.8 10.6 11.6 1.3 -8.7 7.8 2.5 11.4 -10.2 -5.9 -10.2 5.9 2.5 -11.4 -8.7 -7.8 11.6 -1.3z" fill="${c}"/><circle cx="16" cy="17" r="1.6" fill="#1a1f3d"/><circle cx="24" cy="17" r="1.6" fill="#1a1f3d"/><path d="M17 22 q3 3 6 0" stroke="#1a1f3d" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
  }

  const STICKERS = ['🌟', '😊', '❤️', '🦄', '🌈', '🍦', '🐶', '🦋', '⚡', '🎉'];
  function sticker(i, state = 2) {
    const e = STICKERS[i % STICKERS.length];
    if (state === 0) return '<svg viewBox="0 0 40 40" class="item"><circle cx="20" cy="20" r="9" fill="none" stroke="#c4ccd6" stroke-width="1.6" stroke-dasharray="2 3"/></svg>';
    if (state === 1) return `<svg viewBox="0 0 40 40" class="item"><circle cx="20" cy="20" r="16" fill="none" stroke="#8d96a3" stroke-width="1.8" stroke-dasharray="4 3"/><text x="20" y="27" text-anchor="middle" font-size="18" opacity=".22" style="filter:grayscale(1)">${e}</text></svg>`;
    const gold = state === 3;
    return `<svg viewBox="0 0 40 40" class="item"><circle cx="20" cy="21.5" r="17.5" fill="rgba(0,0,0,.12)"/><circle cx="20" cy="20" r="17.5" fill="#fff"/><circle cx="20" cy="20" r="14.5" fill="${gold ? '#ffcf3f' : ['#ffe3e3', '#e3f1ff', '#fff2cc', '#e8f8e3', '#f1e6ff'][i % 5]}"/>${gold ? '<path d="M9 13 q6 -6 14 -5" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>' : ''}<text x="20" y="26.5" text-anchor="middle" font-size="17">${e}</text></svg>`;
  }

  // ---------- themes ----------
  const THEMES = {
    garden: {
      id: 'garden', name: 'Garden', icon: '🌷', pitch: 'Grow a garden full of flowers.',
      one: 'flower', many: 'flowers', place: 'garden', verb: 'grew', item: flower, big: '🌸',
      empty: 'Your garden is waiting. Every fact you really know grows a flower here.',
      newLine: n => `A new flower grew in your garden.`,
      light: { bg: '#f2f6e9', surface: '#ffffff', accent: '#2e7a4c', accentInk: '#ffffff', rule: '#dde7cf', g0: '#e4ecd6', scene: 'linear-gradient(#dff0fb 0%, #dff0fb 62%, #b9e3a5 62%, #8fd07d 100%)', tint: '#e8f2dc' },
      dark: { bg: '#141a15', surface: '#1f2720', accent: '#6fd18f', accentInk: '#0b1a10', rule: '#304034', g0: '#283329', scene: 'linear-gradient(#1c2630 0%, #1c2630 62%, #2f5a32 62%, #244a28 100%)', tint: '#1f2a21' },
      breakArt: '🌻',
    },
    ocean: {
      id: 'ocean', name: 'Ocean', icon: '🐠', pitch: 'Fill a coral reef with fish.',
      one: 'fish', many: 'fish', place: 'reef', verb: 'swam into', item: fish, big: '🐠',
      empty: 'Your reef is quiet for now. Every fact you really know brings a fish to live here.',
      newLine: n => `A new fish swam into your reef.`,
      light: { bg: '#eefaff', surface: '#ffffff', accent: '#1d8fd8', accentInk: '#ffffff', rule: '#d3ecf7', g0: '#dcEFF7', scene: 'linear-gradient(#bfe9ff 0%, #7fcdf2 70%, #f2dca8 70%, #e8c98a 100%)', tint: '#e0f4fd' },
      dark: { bg: '#0d1620', surface: '#15222f', accent: '#4fb3ff', accentInk: '#06131f', rule: '#233646', g0: '#1d2d3b', scene: 'linear-gradient(#123a57 0%, #0b2840 70%, #4a3d24 70%, #3a301c 100%)', tint: '#122130' },
      breakArt: '🐳',
    },
    space: {
      id: 'space', name: 'Space', icon: '🚀', pitch: 'Light up your own sky with stars.',
      one: 'star', many: 'stars', place: 'sky', verb: 'lit up', item: star, big: '⭐',
      empty: 'Your sky is dark for now. Every fact you really know lights up a star here.',
      newLine: n => `A new star lit up in your sky.`,
      light: { bg: '#f3f1ff', surface: '#ffffff', accent: '#6b4fe0', accentInk: '#ffffff', rule: '#e2ddfa', g0: '#e7e3fb', scene: 'radial-gradient(circle at 80% 20%, #3b3f8f 0, #1d1f4f 55%, #14163a 100%)', tint: '#ebe8ff' },
      dark: { bg: '#0f0e1c', surface: '#1a1930', accent: '#9c86ff', accentInk: '#120d2b', rule: '#2c2a49', g0: '#24223d', scene: 'radial-gradient(circle at 80% 20%, #2e3178 0, #16173d 55%, #0c0d26 100%)', tint: '#1a1832' },
      breakArt: '🪐',
    },
    classroom: {
      id: 'classroom', name: 'Classroom', icon: '🍎', pitch: 'Dot is the teacher. Earn stickers for the whiteboard.',
      one: 'sticker', many: 'stickers', place: 'classroom', verb: 'earned', item: i => sticker(i), big: '⭐',
      empty: 'Your sticker chart is empty for now. Every fact you really know earns a sticker.',
      newLine: n => 'A new sticker went up on your chart.',
      light: { bg: '#fdf6ec', surface: '#ffffff', accent: '#1f8f86', accentInk: '#ffffff', rule: '#eadfcd', g0: '#efe6d8', scene: 'linear-gradient(#f6e6c8 0 22%, #ffffff 22% 80%, #cfa274 80%)', tint: '#f1f7f6' },
      dark: { bg: '#17140f', surface: '#231f19', accent: '#45c2b5', accentInk: '#06201d', rule: '#3a3328', g0: '#2f291f', scene: 'linear-gradient(#3a2f22 0 22%, #e9eef2 22% 80%, #6b4a2f 80%)', tint: '#1d2826' },
      breakArt: '🔔', breakTitle: 'Recess!',
    },
  };
  const DEFAULT_THEME = 'garden';
  const current = () => THEMES[(EM.S && EM.S.theme) || DEFAULT_THEME] || THEMES[DEFAULT_THEME];

  function apply() {
    const t = current();
    const vars = v => `--bg:${v.bg};--surface:${v.surface};--accent:${v.accent};--accent-ink:${v.accentInk};--rule:${v.rule};--g0:${v.g0};--scene:${v.scene};--tint:${v.tint};`;
    let el = document.getElementById('theme-style');
    if (!el) { el = document.createElement('style'); el.id = 'theme-style'; document.head.appendChild(el); }
    el.textContent = `:root{${vars(t.light)}} @media (prefers-color-scheme: dark){:root{${vars(t.dark)}}}`;
    document.documentElement.dataset.theme = t.id;
    const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = t.light.accent;
    // Home-screen icon in her world's colors (Safari reads this when you tap Add to Home Screen).
    if (EM.S && EM.S.theme) document.querySelectorAll('link[rel=apple-touch-icon], link[rel=icon]').forEach(l => { l.href = `icon-${t.id}-180.png`; });
  }

  // The collection scene: one item per fact that's hers.
  function collection(n, limit = 48) {
    const t = current();
    if (!n) return `<div class="scene empty"><div class="scene-msg">${t.empty}</div></div>`;
    const shown = Math.min(n, limit);
    let items = '';
    for (let i = 1; i <= shown; i++) items += `<span class="slot-item" style="animation-delay:${Math.min(i, 24) * 30}ms">${t.item(i)}</span>`;
    return `<div class="scene"><div class="scene-items">${items}</div>${n > limit ? `<div class="scene-more">+${n - limit} more</div>` : ''}<div class="scene-count">${n} ${n === 1 ? t.one : t.many}</div></div>`;
  }

  function picker(selected) {
    return `<div class="themes">${Object.values(THEMES).map(t => `
      <button class="theme-card${selected === t.id ? ' on' : ''}" data-theme="${t.id}" data-tc="${t.id}">
        <span class="tc-scene" style="background:${t.light.scene}">${[1, 2, 3, 4].map(i => `<span class="slot-item">${t.item(i)}</span>`).join('')}</span>
        <span class="tc-name">${t.icon} ${t.name}</span><span class="tc-pitch">${t.pitch}</span>
      </button>`).join('')}</div>`;
  }

  EM.theme = { THEMES, current, apply, collection, picker, dot, sticker, STICKERS };
})();
