/* Ellie Math — speech (Web Speech API) and parent voice clips.
   iPad Safari rules: speech must be primed inside a user gesture, voices load async, onend sometimes never fires,
   and a backgrounded PWA comes back with a stuck queue. Everything here guards for that. */
'use strict';
(function () {
  const EM = window.EM;
  const synth = window.speechSynthesis;
  let voice = null, primed = false, current = null, fallbackT = 0, seq = 0;

  function pickVoice() {
    if (!synth) return;
    const vs = synth.getVoices();
    if (!vs.length) return;
    const en = vs.filter(v => /^en(-|_)?(US|GB|AU|CA)?/i.test(v.lang));
    const pref = ['Samantha', 'Karen', 'Daniel', 'Moira', 'Google US English', 'Microsoft Aria', 'Microsoft Zira'];
    voice = pref.map(n => en.find(v => v.name.includes(n))).find(Boolean) || en.find(v => v.default) || en[0] || vs[0];
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
      if (voice) u.voice = voice;
      u.rate = opts.rate || 0.92; u.pitch = 1.05;
      u.onend = () => finish(true);
      u.onerror = () => finish(false);
      current = u;
      // Safari sometimes never fires onend: release after ~0.45 s per word + 0.6 s.
      fallbackT = setTimeout(() => finish(false), 600 + words.split(/\s+/).length * 450);
      try { synth.speak(u); } catch (e) { finish(false); }
      // A later say() supersedes this one.
      const guard = setInterval(() => { if (mySeq !== seq) { clearInterval(guard); finish(false); } if (done) clearInterval(guard); }, 200);
    });
  }
  function stop() { clearTimeout(fallbackT); try { if (synth) synth.cancel(); } catch (e) {} current = null; }
  // Rough duration estimate, for timers that must not depend on onend.
  const estimateMs = text => 600 + String(text || '').split(/\s+/).length * 450;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && synth) { try { synth.cancel(); synth.resume && synth.resume(); } catch (e) {} } });
  EM.speech = { prime, say, stop, enabled, estimateMs, get voice() { return voice; } };

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
  let audioEl = null;
  clips.play = async function (key) {
    try {
      const have = key ? [key] : await clips.list();
      if (!have.length) return false;
      const k = have[Math.floor(Math.random() * have.length)];
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
  };
})();
