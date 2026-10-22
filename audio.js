/* Ellie Math — speech (Dot's recorded voice, else the Web Speech API) and parent voice clips.
   iPad Safari rules: speech must be primed inside a user gesture, voices load async, onend sometimes never fires,
   and a backgrounded PWA comes back with a stuck queue. Everything here guards for that. */
'use strict';
(function () {
  const EM = window.EM;
  const synth = window.speechSynthesis;
  // Play like a video even when the iPad is on silent (Safari 16.4+); otherwise silent mode mutes every sound.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  const badVoices = new Set(); // voices that failed to speak this session; skipped from then on
  const diag = { lastError: '', lastVoice: '', started: false, fellBack: false };
  let voice = null, primed = false, current = null, fallbackT = 0, seq = 0;

  // Siri's own voice isn't available to web apps, but the free Enhanced and Premium voices an iPad can download are.
  // Rank what's installed: Premium > Enhanced > natural-sounding standard voices; novelty voices never.
  const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/i;
  const NATURAL = /ava|zoe|allison|susan|nicky|evan|nathan|tom|serena|kate|oliver|jamie|samantha|karen|daniel|moira|aria|jenny|guy/i;
  function quality(v) {
    const id = `${v.name} ${v.voiceURI || ''}`;
    if (NOVELTY.test(v.name)) return -1;
    if (/siri/i.test(id)) return 4; // only listed on some iOS versions; best when it is
    if (/premium|natural|neural|online/i.test(id)) return 3;
    if (/enhanced/i.test(id)) return 2;
    return NATURAL.test(v.name) ? 1 : 0;
  }
  function ranked() {
    if (!synth) return [];
    return synth.getVoices().filter(v => /^en(-|_)/i.test(v.lang) && quality(v) >= 0)
      .map(v => ({ v, q: quality(v) + (/US/i.test(v.lang) ? 0.2 : 0) })).sort((a, b) => b.q - a.q).map(o => o.v);
  }
  function pickVoice() {
    const list = ranked(); if (!list.length) return;
    const ok = list.filter(v => !badVoices.has(v.voiceURI));
    const want = EM.S && EM.S.settings.voiceURI;
    voice = (want && ok.find(v => v.voiceURI === want)) || ok[0] || null;
  }
  if (synth) { pickVoice(); synth.addEventListener && synth.addEventListener('voiceschanged', pickVoice); }

  // ---------- Dot's recorded voice (voice/index.json + packs, made by tools/voice/build.js) ----------
  // Packs are whole mp3 clips back to back; they download once in the background and the service worker keeps them offline.
  // A line plays recorded only when every part of it is recorded; otherwise the whole line uses the iPad voice.
  const dot = { index: null, packs: [], ctx: null, decoded: new Map(), playing: [], timer: 0, end: null };
  const AC = window.AudioContext || window.webkitAudioContext;
  async function loadDot() {
    if (!AC || !EM.voice) return;
    try {
      dot.index = await (await fetch('./voice/index.json')).json();
      for (let i = 0; i < dot.index.packs.length; i++) {
        const r = await fetch(`./voice/${dot.index.packs[i]}?v=${dot.index.version}`);
        if (r.ok) dot.packs[i] = await r.arrayBuffer();
      }
      // Drop packs from earlier recordings (the service worker keeps them in their own cache).
      if (window.caches && dot.packs.every(Boolean)) caches.open('ellie-voice').then(c => c.keys().then(ks => ks.forEach(r => { if (!r.url.includes(`v=${dot.index.version}`)) c.delete(r); }))).catch(() => {});
    } catch (e) { diag.lastError = 'voice pack: ' + (e && e.message); }
  }
  loadDot();
  const useDot = () => !!(EM.S && (EM.S.settings.voiceURI || 'dot') === 'dot' && dot.index && AC);
  const hasClip = k => { const c = dot.index.clips[k]; return !!(c && dot.packs[c[0]]); };
  const names = () => [EM.S && EM.S.name, 'friend', 'Teacher'];
  function clip(k) {
    if (dot.decoded.has(k)) return Promise.resolve(dot.decoded.get(k));
    const [p, off, len] = dot.index.clips[k];
    return new Promise((ok, bad) => dot.ctx.decodeAudioData(dot.packs[p].slice(off, off + len), ok, bad)).then(b => {
      if (dot.decoded.size > 300) dot.decoded.delete(dot.decoded.keys().next().value);
      dot.decoded.set(k, b); return b;
    });
  }
  function sayDot(plan, mySeq) {
    return Promise.all(plan.map(p => clip(p.k))).then(bufs => new Promise(res => {
      if (mySeq !== seq) return res(false);
      const ctx = dot.ctx;
      let t = ctx.currentTime + 0.05;
      bufs.forEach((b, i) => {
        const src = ctx.createBufferSource(); src.buffer = b; src.connect(ctx.destination); src.start(t);
        dot.playing.push(src);
        t += b.duration + (i < bufs.length - 1 ? plan[i].gap / 1000 : 0);
      });
      diag.lastVoice = 'Dot (recorded)'; diag.started = true;
      dot.end = res; // stop() ends it early
      dot.timer = setTimeout(() => { dot.playing = []; dot.end = null; res(mySeq === seq); }, (t - ctx.currentTime) * 1000 + 50);
    }), e => { diag.lastError = 'voice decode: ' + (e && e.message); return null; });
  }

  // Call inside the first tap so iOS lets us speak later.
  function prime() {
    if (AC && !dot.ctx) { try { dot.ctx = new AC(); } catch (e) {} }
    if (dot.ctx && dot.ctx.state !== 'running') { try { const b = dot.ctx.createBuffer(1, 1, 22050), s = dot.ctx.createBufferSource(); s.buffer = b; s.connect(dot.ctx.destination); s.start(0); dot.ctx.resume(); } catch (e) {} }
    if (primed || !synth) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); primed = true; } catch (e) {}
  }
  const enabled = () => !!(synth || useDot()) && EM.S && EM.S.settings.tts !== false;
  // Speak text; resolves when done (or when the fallback timer fires). Cancels anything in progress.
  function say(text, opts = {}) {
    const words = String(text || '').trim();
    const mySeq = ++seq;
    if (window.__sayLog) window.__sayLog.push(words); // tests/voice tooling: collects every line Dot says
    stop();
    if (!words || !enabled()) return Promise.resolve(false);
    if (useDot() && dot.ctx) {
      const plan = EM.voice.plan(words, hasClip, names());
      if (plan) return sayDot(plan, mySeq).then(r => r === null ? sayTTS(words, opts, mySeq) : r);
      diag.missing = words;
    }
    return sayTTS(words, opts, mySeq);
  }
  function sayTTS(words, opts, mySeq) {
    if (!synth || mySeq !== seq) return Promise.resolve(false);
    return new Promise(res => {
      let done = false;
      const finish = ok => { if (done) return; done = true; clearTimeout(fallbackT); if (current === u) current = null; res(ok); };
      const u = new SpeechSynthesisUtterance(words);
      const tried = voice;
      if (voice) u.voice = voice;
      diag.lastVoice = voice ? voice.name : '(iPad default)'; diag.started = false;
      // A downloaded voice can fail silently in Safari (reported on iOS 26). If it errors or never starts,
      // stop using it and say the same words with the next-best voice (finally the iPad's default).
      const retry = why => { if (done || !tried) return false; badVoices.add(tried.voiceURI); diag.lastError = why; diag.fellBack = true; clearTimeout(startT); done = true; clearTimeout(fallbackT); try { synth.cancel(); } catch (e) {} pickVoice(); sayTTS(words, opts, mySeq).then(res); return true; }; // next-best voice, then the iPad default
      const startT = setTimeout(() => { if (!diag.started) retry('did not start'); }, 2500);
      u.rate = opts.rate || (quality(voice || {name: ''}) >= 2 ? 0.98 : 0.92); u.pitch = 1;
      u.onend = () => { clearTimeout(startT); finish(true); };
      u.onerror = e => { clearTimeout(startT); diag.lastError = (e && e.error) || 'error'; if (!retry(diag.lastError)) finish(false); };
      current = u;
      // Safari sometimes never fires onend: release after an estimate of the spoken length (re-armed when speech actually starts).
      fallbackT = setTimeout(() => finish(false), estimateMs(words) + 1500);
      u.onstart = () => { diag.started = true; clearTimeout(startT); clearTimeout(fallbackT); fallbackT = setTimeout(() => finish(false), estimateMs(words) + 800); };
      try { synth.speak(u); } catch (e) { finish(false); }
      // A later say() supersedes this one.
      const guard = setInterval(() => { if (mySeq !== seq) { clearInterval(guard); finish(false); } if (done) clearInterval(guard); }, 200);
    });
  }
  function stop() {
    clearTimeout(fallbackT); try { if (synth) synth.cancel(); } catch (e) {} current = null;
    clearTimeout(dot.timer); dot.playing.forEach(s => { try { s.stop(); } catch (e) {} }); dot.playing = [];
    if (dot.end) { const end = dot.end; dot.end = null; end(false); }
  }
  // Rough duration estimate, for timers that must not depend on onend. Digits are spoken as words, so they cost more than letters.
  function estimateMs(text) { const s = String(text || ''); const digits = (s.match(/\d/g) || []).length; const letters = s.replace(/[\d\s,.?!]/g, '').length; return Math.max(1500, 900 + letters * 75 + digits * 600); }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (synth) { try { synth.cancel(); synth.resume && synth.resume(); } catch (e) {} }
    if (dot.ctx && dot.ctx.state !== 'running') { try { dot.ctx.resume(); } catch (e) {} }
  });
  const voices = () => ranked().map(v => ({ uri: v.voiceURI, name: v.name.replace(/\s*\((Enhanced|Premium)\)/i, ''), lang: v.lang, q: quality(v) }));
  function setVoice(uri) { if (EM.S) { EM.S.settings.voiceURI = uri || ''; EM.save(); } pickVoice(); }
  const dotState = () => !AC ? 'not supported' : !dot.index ? 'not loaded yet' : `${dot.packs.filter(Boolean).length} of ${dot.index.packs.length} packs ready`;
  EM.speech = { prime, say, stop, enabled, estimateMs, voices, setVoice, pick: pickVoice, diag, dotState, usingDot: () => useDot(), supported: () => !!synth || !!AC, get voice() { return voice; }, get quality() { return useDot() ? 5 : voice ? quality(voice) : 0; } };

  // ---------- parent voice clips (MediaRecorder -> IndexedDB blobs) ----------
  const CLIP_KEYS = ['clip:1', 'clip:2', 'clip:3', 'clip:4', 'clip:5'];
  const clips = { keys: CLIP_KEYS, rec: null, chunks: [] };
  clips.supported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  clips.start = async function () {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';
    clips.rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    clips.chunks = [];
    clips.rec.ondataavailable = e => { if (e.data && e.data.size) clips.chunks.push(e.data); };
    clips.rec.start();
    return clips.rec;
  };
  clips.stop = function (key) {
    return new Promise((res, rej) => {
      const r = clips.rec; if (!r) return rej(new Error('not recording'));
      r.onstop = async () => {
        try {
          const blob = new Blob(clips.chunks, { type: r.mimeType || 'audio/webm' });
          r.stream.getTracks().forEach(t => t.stop());
          await EM.idbPut(key, blob);
          clips.rec = null;
          res(blob);
        } catch (e) { rej(e); }
      };
      r.stop();
    });
  };
  clips.list = async function () {
    const out = [];
    for (const k of CLIP_KEYS) { try { const b = await EM.idbGet(k); if (b) out.push(k); } catch (e) {} }
    return out;
  };
  clips.remove = k => EM.idbDel(k);
  let audioEl = null, audioBlessed = false;
  const SILENT = 'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAAAA';
  // Start the shared <audio> inside a tap so iOS lets clips play later from timers and promises.
  clips.prime = function () {
    if (audioBlessed) return;
    try { audioEl = audioEl || new Audio(); audioEl.src = SILENT; audioBlessed = true; const p = audioEl.play(); if (p && p.catch) p.then(() => audioEl.pause()).catch(() => { audioBlessed = false; }); } catch (e) { audioBlessed = false; }
  };
  clips.play = async function (key) {
    try {
      const have = key ? [key] : await clips.list();
      if (!have.length) return false;
      // Least-played clip first, so a newly recorded message comes up next.
      const plays = (EM.S && (EM.S.clipPlays || (EM.S.clipPlays = {}))) || {};
      const k = key || have.slice().sort((a, b) => (plays[a] || 0) - (plays[b] || 0) || Math.random() - 0.5)[0];
      plays[k] = (plays[k] || 0) + 1; EM.save();
      const blob = await EM.idbGet(k); if (!blob) return false;
      stop();
      if (!audioEl) audioEl = new Audio();
      audioEl.src = URL.createObjectURL(blob);
      await audioEl.play();
      return true;
    } catch (e) { return false; }
  };
  EM.clips = clips;

  // ---------- small synthesized sounds (no files) ----------
  let ctx = null;
  // iPad only lets web sound start inside a tap: create and wake the sound engine on every touch, so later chimes can play.
  function wake() { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state !== 'running') ctx.resume(); } catch (e) {} }
  ['pointerdown', 'touchend', 'keydown'].forEach(t => document.addEventListener(t, () => { wake(); prime(); }, { capture: true, passive: true }));
  function tone(seqs) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      let t = ctx.currentTime;
      for (const [freq, dur] of seqs) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
        t += dur * 0.85;
      }
    } catch (e) {}
  }
  EM.sfx = {
    fast: () => tone([[880, 0.12], [1175, 0.16]]),
    right: () => tone([[660, 0.14]]),
    yours: () => tone([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3]]),
    unlock: () => tone([[392, 0.15], [523, 0.15], [659, 0.15], [784, 0.15], [1047, 0.4]]),
    gentle: () => tone([[330, 0.18]]),
    state: () => (ctx ? ctx.state : 'not started'),
    tick: () => tone([[990, 0.05]]),
  };
})();
