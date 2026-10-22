/* Ellie Math — her world: a full scene where every fact has a place.
   Each foundation skill is a zone (flower bed / coral patch / constellation). Each fact in it shows its state:
   0 not tried (soil / pebble / faint dot), 1 learning (sprout / egg / dim star), 2 hers (flower / fish / star),
   3 solid (with a sparkle). Milestones bring new things into the world. All inline SVG, no image files. */
'use strict';
(function () {
  const EM = window.EM;
  const W = 1000, H = 760;

  // ---------- which zone each fact lives in (its first foundation skill) ----------
  let homeOf = null;
  function zoneFacts() {
    if (homeOf) return homeOf;
    homeOf = {};
    const seen = new Set();
    for (const id of EM.TRACKS.A.skills) {
      homeOf[id] = EM.SK[id].facts.filter(k => !seen.has(k));
      homeOf[id].forEach(k => seen.add(k));
    }
    return homeOf;
  }
  function stateOf(key) { const r = EM.S.facts[key]; if (!r) return 0; if (r.box >= 4) return 3; if (r.box >= EM.FLUENT_BOX) return 2; return 1; }

  // ---------- zone layout: three rows in perspective ----------
  // Big skills go in front where there's room; small ones at the back.
  const ZONES = [
    { id: 'doubles', x: 95, y: 228, w: 240, h: 108, s: 0.62 }, { id: 'm10', x: 380, y: 228, w: 240, h: 108, s: 0.62 }, { id: 'near', x: 665, y: 228, w: 240, h: 108, s: 0.62 },
    { id: 'look', x: 55, y: 366, w: 275, h: 148, s: 0.78 }, { id: 'teens', x: 362, y: 366, w: 275, h: 148, s: 0.78 }, { id: 'bridge', x: 670, y: 366, w: 275, h: 148, s: 0.78 },
    { id: 'plus12', x: 22, y: 548, w: 230, h: 196, s: 0.9 }, { id: 'to10', x: 266, y: 548, w: 230, h: 196, s: 0.9 }, { id: 'sub10', x: 510, y: 548, w: 230, h: 196, s: 0.9 }, { id: 'subteen', x: 754, y: 548, w: 230, h: 196, s: 0.9 },
  ];
  // Classroom: sticker charts on a whiteboard, flat (no perspective).
  const CLASS_ZONES = [
    { id: 'doubles', x: 62, y: 214, w: 196, h: 92, s: 0.92 }, { id: 'm10', x: 282, y: 214, w: 196, h: 92, s: 0.92 }, { id: 'near', x: 502, y: 214, w: 196, h: 92, s: 0.92 }, { id: 'teens', x: 722, y: 214, w: 216, h: 92, s: 0.92 },
    { id: 'look', x: 62, y: 354, w: 270, h: 122, s: 0.86 }, { id: 'bridge', x: 356, y: 354, w: 282, h: 122, s: 0.86 }, { id: 'to10', x: 662, y: 354, w: 276, h: 122, s: 0.86 },
    { id: 'plus12', x: 62, y: 524, w: 270, h: 128, s: 0.78 }, { id: 'sub10', x: 356, y: 524, w: 282, h: 128, s: 0.78 }, { id: 'subteen', x: 662, y: 524, w: 276, h: 128, s: 0.78 },
  ];
  const zonesFor = id => id === 'classroom' ? CLASS_ZONES : ZONES;
  const ZONE_COLORS = ['#ef6a4c', '#f0b429', '#e56bb3', '#8d6be8', '#4fa3e0', '#ff8f6b', '#5bc77a', '#ff6b9d', '#36c5c5', '#b388ff'];

  // Deterministic jitter so the world looks hand-planted but never reshuffles.
  const jit = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  function slots(z, n) {
    const ratio = z.w / z.h, cols = Math.max(1, Math.ceil(Math.sqrt(n * ratio))), rows = Math.ceil(n / cols);
    const cw = z.w / cols, rh = z.h / rows, out = [];
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      out.push({ x: z.x + cw * (c + 0.5) + (jit(i, 1) - 0.5) * cw * 0.35, y: z.y + rh * (r + 0.85) + (jit(i, 2) - 0.5) * rh * 0.2, row: r });
    }
    return out;
  }

  // ---------- items per theme (inner SVG, drawn around a base point) ----------
  const ITEMS = {
    classroom: {
      size: [34, 34], view: '0 0 40 40',
      draw(state, zi, i) { return EM.theme.sticker(zi, state).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); },
      zone(z, zi, label) {
        const sk = EM.SK[z.id];
        return `<rect x="${z.x - 12}" y="${z.y - 34}" width="${z.w + 24}" height="${z.h + 46}" rx="10" fill="${['#fff4f4', '#f2f8ff', '#fffbea', '#f3fbef', '#f8f2ff'][zi % 5]}" stroke="${ZONE_COLORS[zi]}" stroke-opacity=".45" stroke-width="2" stroke-dasharray="7 5"/>
          <text x="${z.x - 2}" y="${z.y - 12}" font-size="17" font-weight="600" fill="#3f4a56" class="zname">${label} ${EM.esc(sk.name)}</text>`;
      },
    },
    garden: {
      size: [34, 48], view: '0 0 40 56',
      draw(state, zi, i) {
        const c = ZONE_COLORS[zi], mound = '<ellipse cx="20" cy="53" rx="10" ry="3.2" fill="#7b4f33" opacity=".55"/>';
        if (state === 0) return mound + '<circle cx="17" cy="51" r="1.4" fill="#5c3a24"/><circle cx="23" cy="52" r="1.2" fill="#5c3a24"/>';
        if (state === 1) return mound + '<path d="M20 53 v-12" stroke="#4f9a5b" stroke-width="3" stroke-linecap="round"/><path d="M20 44 q-8 -1 -9 -8 q8 0 9 7z M20 42 q7 -2 9 -9 q-8 0 -9 8z" fill="#6cc46f"/>';
        const petals = 5 + (zi % 3), r = 9; let p = '';
        for (let k = 0; k < petals; k++) { const a = (k / petals) * Math.PI * 2 + zi; p += `<ellipse cx="${(20 + Math.cos(a) * r).toFixed(1)}" cy="${(16 + Math.sin(a) * r).toFixed(1)}" rx="6.5" ry="6.5" fill="${c}"/>`; }
        const flower = `${mound}<path d="M20 26 v27" stroke="#4f9a5b" stroke-width="3.5"/><path d="M20 42 q-9 -2 -11 -9 q9 0 11 7" fill="#5fb36b"/>${p}<circle cx="20" cy="16" r="6" fill="#ffe08a"/>`;
        return state === 3 ? flower + '<path class="twk" d="M34 3 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffd23f"/>' : flower;
      },
      zone(z, zi, label) {
        const soil = `<rect x="${z.x - 8}" y="${z.y + 6}" width="${z.w + 16}" height="${z.h + 8}" rx="${18 * z.s}" fill="#9a6a45" opacity=".35"/><rect x="${z.x - 8}" y="${z.y + 6}" width="${z.w + 16}" height="${z.h + 8}" rx="${18 * z.s}" fill="none" stroke="#b9895e" stroke-width="${5 * z.s}" opacity=".7"/>`;
        return soil + sign(z, label, '#d7a86e', '#7b4f33');
      },
    },
    ocean: {
      size: [40, 34], view: '0 0 48 40',
      draw(state, zi, i) {
        const c = ZONE_COLORS[zi], flip = i % 2 ? ' transform="translate(48 0) scale(-1 1)"' : '';
        if (state === 0) return '<ellipse cx="24" cy="35" rx="7" ry="3.5" fill="#a08a6a" opacity=".5"/>';
        if (state === 1) return '<circle cx="21" cy="30" r="5" fill="rgba(255,255,255,.75)" stroke="#bfe9ff" stroke-width="1.5"/><circle cx="29" cy="32" r="3.5" fill="rgba(255,255,255,.6)" stroke="#bfe9ff" stroke-width="1.2"/><circle cx="20" cy="29" r="1.6" fill="#1d2b4a" opacity=".5"/>';
        const f = `<g class="swim"${flip}><path d="M36 20 l11 -9 v18z" fill="${c}"/><ellipse cx="21" cy="20" rx="17" ry="12" fill="${c}"/><path d="M14 11 q6 9 0 18" stroke="rgba(255,255,255,.55)" stroke-width="3" fill="none"/><circle cx="11" cy="17" r="3.2" fill="#1d2b4a"/><circle cx="10" cy="16" r="1.1" fill="#fff"/></g>`;
        return state === 3 ? `<circle cx="22" cy="20" r="19" fill="${c}" opacity=".18"/>${f}<circle class="twk" cx="40" cy="6" r="3" fill="#fff" opacity=".9"/>` : f;
      },
      zone(z, zi, label) {
        const c = ZONE_COLORS[zi], base = z.y + z.h + 10;
        let coral = `<ellipse cx="${z.x + z.w / 2}" cy="${base}" rx="${z.w / 2 + 6}" ry="${14 * z.s}" fill="#c8a978" opacity=".55"/>`;
        for (let k = 0; k < 5; k++) { const x = z.x + z.w * (0.1 + k * 0.2), hgt = (30 + jit(zi, k) * 26) * z.s; coral += `<path d="M${x} ${base} q${-8 * z.s} ${-hgt * 0.5} 0 ${-hgt} M${x} ${base - hgt * 0.5} q${10 * z.s} ${-6 * z.s} ${12 * z.s} ${-hgt * 0.35}" stroke="${c}" stroke-width="${7 * z.s}" stroke-linecap="round" fill="none" opacity=".55"/>`; }
        return coral + sign(z, label, '#fff4dc', '#3b6b8a');
      },
    },
    space: {
      size: [30, 30], view: '0 0 40 40',
      draw(state, zi, i) {
        const c = ZONE_COLORS[zi], starPath = 'M20 3 l4.8 10.6 11.6 1.3 -8.7 7.8 2.5 11.4 -10.2 -5.9 -10.2 5.9 2.5 -11.4 -8.7 -7.8 11.6 -1.3z';
        if (state === 0) return '<circle cx="20" cy="20" r="2" fill="#fff" opacity=".3"/>';
        if (state === 1) return `<path d="${starPath}" fill="${c}" opacity=".35" transform="translate(8 8) scale(.6)"/>`;
        const s = `<path d="${starPath}" fill="${c}"/><circle cx="16" cy="17" r="1.6" fill="#1a1f3d"/><circle cx="24" cy="17" r="1.6" fill="#1a1f3d"/><path d="M17 22 q3 3 6 0" stroke="#1a1f3d" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
        return state === 3 ? `<circle cx="20" cy="20" r="19" fill="${c}" opacity=".25"/>${s}` : s;
      },
      zone(z, zi, label) {
        return `<ellipse cx="${z.x + z.w / 2}" cy="${z.y + z.h / 2}" rx="${z.w / 2 + 10}" ry="${z.h / 2 + 10}" fill="${ZONE_COLORS[zi]}" opacity=".07"/>` + sign(z, label, 'rgba(255,255,255,.14)', '#e8e6ff');
      },
    },
  };
  function sign(z, label, bg, fg) {
    const sx = z.x - 4, sy = z.y - 6, w = 56 * z.s + 8, h = 30 * z.s + 6;
    return `<g class="zsign"><rect x="${sx}" y="${sy}" width="${w}" height="${h}" rx="${8 * z.s}" fill="${bg}"/><text x="${sx + w / 2}" y="${sy + h * 0.72}" text-anchor="middle" font-size="${20 * z.s}" fill="${fg}">${label}</text></g>`;
  }

  // ---------- backgrounds ----------
  const twinkles = n => { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${(jit(i, 7) * W).toFixed(0)}" cy="${(jit(i, 9) * H).toFixed(0)}" r="${(0.6 + jit(i, 3) * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.25 + jit(i, 5) * 0.6).toFixed(2)}" class="${i % 3 ? '' : 'twk'}"/>`; return s; };
  const BACKS = {
    classroom: () => `
      <rect width="${W}" height="${H}" fill="#f6e6c8"/><rect y="${H - 120}" width="${W}" height="120" fill="#e9d2a8"/>
      <rect y="${H - 62}" width="${W}" height="62" fill="#cfa274"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${i * 140}" y1="${H - 62}" x2="${i * 140 - 30}" y2="${H}" stroke="#b9895e" stroke-width="2" opacity=".6"/>`).join('')}
      ${['A', 'B', 'C', '1', '2', '3'].map((c, i) => `<g transform="translate(${598 + i * 46} 18)"><path d="M0 0 h40 v34 l-20 12 l-20 -12z" fill="${['#ef6a4c', '#f0b429', '#4fa3e0', '#5bc77a', '#e56bb3', '#8d6be8'][i]}"/><text x="20" y="27" text-anchor="middle" font-size="22" font-weight="700" fill="#fff">${c}</text></g>`).join('')}
      <path d="M590 16 Q 735 30 880 16" stroke="#8a6a4a" stroke-width="2" fill="none"/>
      <g transform="translate(940 92)"><circle r="40" fill="#fff" stroke="#3f4a56" stroke-width="6"/><path class="hand" d="M0 0 v-26" stroke="#3f4a56" stroke-width="5" stroke-linecap="round"/><path d="M0 0 h18" stroke="#3f4a56" stroke-width="5" stroke-linecap="round"/><circle r="4" fill="#ef6a4c"/></g>
      <rect x="30" y="160" width="940" height="520" rx="14" fill="#fdfefe" stroke="#b7c0ca" stroke-width="14"/>
      <path d="M70 196 l140 -6" stroke="#e8edf2" stroke-width="10" stroke-linecap="round" opacity=".7"/>
      <rect x="40" y="680" width="920" height="18" rx="5" fill="#a9b3bd"/>${['#ef6a4c', '#4fa3e0', '#5bc77a'].map((c, i) => `<rect x="${700 + i * 54}" y="${672}" width="44" height="10" rx="4" fill="${c}"/>`).join('')}
      <rect x="760" y="${684}" width="0" height="0"/>`,
    garden: () => `
      <defs><linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff"/><stop offset="1" stop-color="#fff6dd"/></linearGradient>
        <linearGradient id="ggrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6dc8a"/><stop offset="1" stop-color="#6fbf5a"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#gsky)"/>
      <g class="sun"><circle cx="880" cy="70" r="44" fill="#ffd54a"/><circle cx="880" cy="70" r="62" fill="#ffd54a" opacity=".25"/></g>
      <g class="cloud c1"><ellipse cx="180" cy="70" rx="58" ry="22" fill="#fff"/><ellipse cx="215" cy="56" rx="38" ry="24" fill="#fff"/></g>
      <g class="cloud c2"><ellipse cx="560" cy="110" rx="48" ry="18" fill="#fff" opacity=".9"/><ellipse cx="590" cy="98" rx="30" ry="18" fill="#fff" opacity=".9"/></g>
      <path d="M0 210 Q180 140 360 196 T720 180 T1000 170 V${H} H0z" fill="#bfe3a2"/>
      <path d="M0 238 Q250 200 520 232 T1000 222 V${H} H0z" fill="url(#ggrass)"/>
      <path d="M500 ${H} C470 650 560 600 520 520 S470 420 505 350 S520 270 500 238" stroke="#e9d3a4" stroke-width="26" fill="none" opacity=".55" stroke-linecap="round"/>`,
    ocean: () => `
      <defs><linearGradient id="osea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe2ff"/><stop offset=".55" stop-color="#3fa9e0"/><stop offset="1" stop-color="#1c6fb0"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#osea)"/>
      <path d="M0 18 Q60 6 120 18 T240 18 T360 18 T480 18 T600 18 T720 18 T840 18 T960 18 T1080 18 V0 H0z" fill="#e8f8ff" opacity=".7"/>
      <g opacity=".18" fill="#fff"><path d="M120 0 L200 0 L330 ${H} L200 ${H}z"/><path d="M460 0 L520 0 L640 ${H} L540 ${H}z"/><path d="M760 0 L820 0 L900 ${H} L810 ${H}z"/></g>
      <path d="M0 ${H - 40} Q200 ${H - 70} 420 ${H - 46} T1000 ${H - 52} V${H} H0z" fill="#e8cf96"/>
      <g class="weed"><path d="M14 ${H} q-14 -60 6 -120 q16 -50 -4 -110" stroke="#3aa76d" stroke-width="10" fill="none" stroke-linecap="round"/></g>
      <g class="weed w2"><path d="M986 ${H} q14 -70 -6 -130 q-14 -50 6 -100" stroke="#2f9a63" stroke-width="10" fill="none" stroke-linecap="round"/></g>
      ${[90, 330, 610, 900].map((x, i) => `<circle class="bub b${i}" cx="${x}" cy="${H - 60}" r="${5 + i}" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`).join('')}`,
    space: () => `
      <defs><radialGradient id="sneb" cx=".75" cy=".2" r=".9"><stop offset="0" stop-color="#4a3f9c"/><stop offset=".5" stop-color="#1e1c52"/><stop offset="1" stop-color="#0d0d2b"/></radialGradient>
        <radialGradient id="sneb2" cx=".2" cy=".7" r=".5"><stop offset="0" stop-color="#d14fa8" stop-opacity=".35"/><stop offset="1" stop-color="#d14fa8" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sneb)"/><rect width="${W}" height="${H}" fill="url(#sneb2)"/>
      ${twinkles(90)}
      <ellipse cx="500" cy="${H + 230}" rx="760" ry="300" fill="#5a4fb0"/><ellipse cx="500" cy="${H + 236}" rx="740" ry="290" fill="#6f63c9"/>
      <circle cx="300" cy="${H - 30}" r="10" fill="#5a4fb0"/><circle cx="700" cy="${H - 22}" r="14" fill="#5a4fb0"/>`,
  };

  // ---------- milestones: things that move into the world ----------
  const MILESTONES = {
    // [facts needed, emoji, name, x, y (baseline), size]; kept out of the top-left where Dot and the bubble sit
    garden: [[5, '🦋', 'a butterfly', 300, 196, 38], [10, '🐝', 'a bumblebee', 640, 168, 32], [20, '🐇', 'a bunny', 470, 214, 44], [35, '🌳', 'a big tree', 948, 206, 120], [50, '🦆', 'a duck', 724, 212, 46], [75, '🌈', 'a rainbow', 760, 122, 130], [100, '🎈', 'a hot-air balloon', 636, 84, 60], [150, '🦄', 'a unicorn', 176, 208, 56], [200, '🏰', 'a castle', 842, 196, 70], [300, '🦚', 'a peacock', 380, 204, 52]],
    ocean: [[5, '🐚', 'a seashell', 470, 742, 34], [10, '🦀', 'a crab', 160, 738, 40], [20, '🐢', 'a sea turtle', 770, 176, 58], [35, '🐙', 'an octopus', 640, 196, 54], [50, '🐡', 'a pufferfish', 300, 202, 46], [75, '🐬', 'a dolphin', 650, 92, 64], [100, '🦭', 'a seal', 920, 712, 60], [150, '🐳', 'a whale', 900, 100, 90], [200, '🧜‍♀️', 'a mermaid', 450, 206, 56], [300, '💎', 'a treasure chest', 620, 746, 40]],
    classroom: [[5, '🍎', 'a shiny apple', 150, 700, 40], [10, '🖍️', 'a box of crayons', 240, 700, 36], [20, '📚', 'a stack of books', 600, 724, 50], [35, '🪴', 'a classroom plant', 40, 690, 72], [50, '🐹', 'a class hamster', 470, 734, 46], [75, '🌍', 'a globe', 380, 120, 60], [100, '🏆', 'a trophy', 330, 700, 46], [150, '🎨', 'an art easel', 960, 740, 66], [200, '🔭', 'a telescope', 470, 126, 56], [300, '🎓', 'a graduation cap', 860, 732, 50]],
    space: [[5, '🌙', 'the moon', 905, 88, 70], [10, '☄️', 'a comet', 620, 76, 50], [20, '🪐', 'a ringed planet', 770, 180, 66], [35, '🛰️', 'a satellite', 300, 198, 46], [50, '🚀', 'a rocket', 930, 704, 70], [75, '👽', 'a friendly alien', 75, 708, 56], [100, '🛸', 'a flying saucer', 560, 198, 54], [150, '🌍', 'planet Earth', 965, 196, 52], [200, '🌌', 'a galaxy', 770, 76, 54], [300, '🌟', 'a superstar', 430, 194, 50]],
  };
  const milestones = () => MILESTONES[EM.theme.current().id];
  function nextMilestone(n) { return milestones().find(m => m[0] > n) || null; }
  function crossed(before, after) { return milestones().filter(m => m[0] > before && m[0] <= after); }

  // ---------- render ----------
  // opts.fresh: keys to animate in (new today); opts.small: summary size
  function render(opts = {}) {
    const t = EM.theme.current(), I = ITEMS[t.id], zf = zoneFacts(), fresh = new Set(opts.fresh || []);
    let zones = '', items = '', lines = '';
    let yours = 0, sprouts = 0;
    zonesFor(t.id).forEach((z, zi) => {
      const sk = EM.SK[z.id], keys = zf[z.id];
      zones += I.zone(z, zi, sk.icon);
      const sl = slots(z, keys.length);
      // draw back-to-front so nearer items overlap farther ones
      const order = keys.map((k, i) => i).sort((a, b) => sl[a].y - sl[b].y);
      let prevStar = null;
      for (const i of order) {
        const k = keys[i], st = stateOf(k), p = sl[i];
        if (st >= 2) yours++; else if (st === 1) sprouts++;
        const w = I.size[0] * z.s, h = I.size[1] * z.s;
        const cls = `wi s${st}${fresh.has(k) ? ' fresh' : ''}`;
        const delay = fresh.has(k) ? (0.5 + [...fresh].indexOf(k) * 0.35).toFixed(2) : 0;
        items += `<g class="${cls}" style="animation-delay:${delay}s"><svg x="${(p.x - w / 2).toFixed(1)}" y="${(p.y - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="${I.view}" overflow="visible">${I.draw(st, zi, i)}</svg></g>`;
      }
      if (t.id === 'space') {
        // constellation lines between lit stars, in reading order
        const lit = keys.map((k, i) => ({ st: stateOf(k), p: sl[i] })).filter(o => o.st >= 2);
        for (let j = 1; j < lit.length; j++) lines += `<line x1="${lit[j - 1].p.x}" y1="${lit[j - 1].p.y - 14 * z.s}" x2="${lit[j].p.x}" y2="${lit[j].p.y - 14 * z.s}" stroke="${ZONE_COLORS[zi]}" stroke-width="1.6" opacity=".55"/>`;
      }
      zones += `<rect class="zhit" data-zone="${z.id}" x="${z.x - 10}" y="${z.y - 10}" width="${z.w + 20}" height="${z.h + 24}" fill="transparent"/>`;
    });
    const total = EM.countYours();
    const deco = milestones().filter(m => total >= m[0]).map(m => `<text class="deco${opts.freshDeco && opts.freshDeco.includes(m[0]) ? ' fresh' : ''}" x="${m[3]}" y="${m[4]}" font-size="${m[5]}" text-anchor="middle">${m[1]}</text>`).join('');
    const svg = `<svg class="world-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(EM.S.name || 'Ellie')}'s ${t.place}: ${yours} ${yours === 1 ? t.one : t.many}, ${sprouts} growing">
      ${BACKS[t.id]()}${deco}${zones}${lines}${items}</svg>`;
    return { svg, yours, sprouts };
  }
  const esc = s => EM.esc(s);

  // Close-up of one zone: every fact with its label, as a trophy case.
  function zoneView(id) {
    const t = EM.theme.current(), I = ITEMS[t.id], zi = zonesFor(t.id).findIndex(z => z.id === id), sk = EM.SK[id], keys = zoneFacts()[id];
    const counts = [0, 0, 0, 0]; keys.forEach(k => counts[stateOf(k)]++);
    const word = { garden: ['bed', 'blooming'], ocean: ['reef', 'swimming'], space: ['constellation', 'shining'], classroom: ['sticker chart', 'earned'] }[t.id];
    const chips = keys.map((k, i) => { const st = stateOf(k); return `<div class="zchip s${st}"><svg viewBox="${I.view}" width="${I.size[0] * (t.id === 'classroom' ? 1.6 : 1.1)}" height="${I.size[1] * (t.id === 'classroom' ? 1.6 : 1.1)}">${I.draw(st, zi, i)}</svg><span>${st ? esc(EM.labelFact(EM.FACTS[k]).replace('Quick Look: ', '👀 ')) : '?'}</span></div>`; }).join('');
    const legend = { classroom: ['dotted circle: not tried yet', 'pencil outline: learning', 'sticker: yours', 'gold sticker: rock solid'], garden: ['soil: not tried yet', 'sprout: learning', 'flower: yours', 'sparkle: rock solid'], ocean: ['pebble: not tried yet', 'egg: learning', 'fish: yours', 'glow: rock solid'], space: ['faint dot: not tried yet', 'dim star: learning', 'bright star: yours', 'glow: rock solid'] }[t.id];
    return `<div class="zhead">${sk.icon} <b>${esc(sk.name)}</b> ${word[0]}</div>
      <p class="zsub"><b>${counts[2] + counts[3]}</b> of ${keys.length} ${word[1]}${counts[1] ? ` · ${counts[1]} growing` : ''}</p>
      <div class="zgrid">${chips}</div>
      <p class="zlegend">${legend.join(' · ')}</p>`;
  }

  EM.world = { render, zoneView, nextMilestone, crossed, stateOf, zoneFacts, MILESTONES };
})();
