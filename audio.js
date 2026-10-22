/* Ellie Math — speech (Web Speech API) and parent voice clips.
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

  // Call inside the first tap so iOS lets us speak later.
  function prime() {
    if (primed || !synth) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); primed = true; } catch (e) {}
  }
  const enabled = () => !!synth && EM.S && EM.S.settings.tts !== false;
  // Speak text; resolves when done (or when the fallback timer fires). Cancels anything in progress.
  function say(text, opts = {}) {
    const words = String(text || '').trim();
    const mySeq = ++seq;
    stop();
    if (!words || !enabled()) return Promise.resolve(false);
    return new Promise(res => {
      let done = false;
      const finish = ok => { if (done) return; done = true; clearTimeout(fallbackT); if (current === u) current = null; res(ok); };
      const u = new SpeechSynthesisUtterance(words);
      const tried = voice;
      if (voice) u.voice = voice;
      diag.lastVoice = voice ? voice.name : '(iPad default)'; diag.started = false;
      // A downloaded voice can fail silently in Safari (reported on iOS 26). If it errors or never starts,
      // stop using it and say the same words with the next-best voice (finally the iPad's default).
      const retry = why => { if (done || !tried) return false; badVoices.add(tried.voiceURI); diag.lastError = why; diag.fellBack = true; clearTimeout(startT); done = true; clearTimeout(fallbackT); try { synth.cancel(); } catch (e) {} pickVoice(); say(words, opts).then(res); return true; }; // next-best voice, then the iPad default
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
  function stop() { clearTimeout(fallbackT); try { if (synth) synth.cancel(); } catch (e) {} current = null; }
  // Rough duration estimate, for timers that must not depend on onend. Digits are spoken as words, so they cost more than letters.
  function estimateMs(text) { const s = String(text || ''); const digits = (s.match(/\d/g) || []).length; const letters = s.replace(/[\d\s,.?!]/g, '').length; return Math.max(1500, 900 + letters * 75 + digits * 600); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && synth) { try { synth.cancel(); synth.resume && synth.resume(); } catch (e) {} } });
  const voices = () => ranked().map(v => ({ uri: v.voiceURI, name: v.name.replace(/\s*\((Enhanced|Premium)\)/i, ''), lang: v.lang, q: quality(v) }));
  function setVoice(uri) { if (EM.S) { EM.S.settings.voiceURI = uri || ''; EM.save(); } pickVoice(); }
  EM.speech = { prime, say, stop, enabled, estimateMs, voices, setVoice, pick: pickVoice, diag, supported: () => !!synth, get voice() { return voice; }, get quality() { return voice ? quality(voice) : 0; } };

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
