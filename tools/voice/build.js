/* Records Dot's voice (Azure neural voice "Ana", excited: a little faster and higher) and packs it for the app.
   Run: node tools/voice/collect.js lines.json && node tools/voice/build.js lines.json [said.json]
   Needs network access to eastus.tts.speech.microsoft.com with the key attached by the environment.
   Clips are cached in tools/voice/cache (not committed), so a rerun only records lines that are new.
   Output: voice/index.json and voice/pack-N.bin (whole mp3 files back to back; the index gives each clip's offset). */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const V = require('../../voice.js');
const ROOT = path.resolve(__dirname, '../..'), CACHE = path.join(__dirname, 'cache'), OUT = path.join(ROOT, 'voice');
const URL_ = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';
const VOICE = 'en-US-AnaNeural', RATE = '+8%', PITCH = '+6%', RECIPE = `${VOICE}|${RATE}|${PITCH}|v1`;
const SR = 24000, BREAK_MS = 1500, SPLIT_MS = 900, BATCH = 40, PACK_BYTES = 4 << 20;
const NAMES = ['NAME', 'friend', 'Teacher'];

// ---------- which keys to record ----------
function wanted(lines) {
  const keys = new Set();
  // Fact lines are recorded whole; their pieces too, for the rare variant the collector didn't see.
  for (const t of lines.facts) for (const s of V.sentences(V.normalize(t, NAMES))) { keys.add(`s:${V.key(s)}`); if (/\d/.test(s)) V.pieces(s).forEach(p => keys.add(p.k)); }
  for (const t of [...lines.procs, ...lines.app]) for (const s of V.sentences(V.normalize(t, NAMES))) {
    if (!/\d/.test(s)) keys.add(`s:${V.key(s)}`);
    else V.pieces(s).forEach(p => keys.add(p.k));
  }
  for (let n = 0; n <= 100; n++) keys.add(`n:${n}`);
  for (let h = 2; h <= 9; h++) keys.add(`n:${h * 100}`);
  for (let t = 1; t <= 10; t++) keys.add(`n:${(t * 1000).toLocaleString('en-US')}`);
  keys.add('n:thousand');
  return [...keys].sort();
}

// ---------- recording ----------
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const cacheFile = k => path.join(CACHE, crypto.createHash('sha1').update(RECIPE + '\n' + k).digest('hex') + '.pcm');
async function synth(texts) {
  const body = `<speak version='1.0' xml:lang='en-US'><voice name='${VOICE}'><prosody rate='${RATE}' pitch='${PITCH}'>${texts.map(esc).join(`<break time='${BREAK_MS}ms'/>`)}</prosody></voice></speak>`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'raw-24khz-16bit-mono-pcm', 'User-Agent': 'ellie-math-voice' }, body });
    if (r.ok) return new Int16Array((await r.arrayBuffer()).slice(0));
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 4000 * (attempt + 1))); continue; }
    throw new Error(`Azure ${r.status}: ${await r.text()}`);
  }
  throw new Error('Azure kept refusing (rate limit)');
}
// Speech regions, found by 10 ms loudness; gaps of SPLIT_MS or more separate clips.
function regions(pcm) {
  const F = SR / 100, n = Math.floor(pcm.length / F), loud = [];
  for (let i = 0; i < n; i++) { let m = 0; for (let j = i * F; j < (i + 1) * F; j++) m = Math.max(m, Math.abs(pcm[j])); loud.push(m > 500); }
  const out = []; let start = -1, quiet = 0;
  for (let i = 0; i < n; i++) {
    if (loud[i]) { if (start < 0) start = i; quiet = 0; }
    else if (start >= 0 && ++quiet * 10 >= SPLIT_MS) { out.push([start, i - quiet + 1]); start = -1; quiet = 0; }
  }
  if (start >= 0) out.push([start, n - quiet]);
  return out.map(([a, b]) => pcm.slice(Math.max(0, a * F - SR * 0.03), Math.min(pcm.length, b * F + SR * 0.06)));
}
async function record(keys) {
  fs.mkdirSync(CACHE, { recursive: true });
  const todo = keys.filter(k => !fs.existsSync(cacheFile(k)));
  console.log(`${keys.length} clips, ${todo.length} to record (${todo.reduce((a, k) => a + V.spoken(k).length, 0)} characters)`);
  const batches = []; for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));
  let done = 0;
  const work = async batch => {
    let parts = regions(await synth(batch.map(V.spoken)));
    if (parts.length !== batch.length) { // a clip with a long pause inside, or a silent one: record this batch one by one
      parts = [];
      for (const k of batch) { const r = regions(await synth([V.spoken(k)])); parts.push(r.length === 1 ? r[0] : concat(r)); }
    }
    batch.forEach((k, i) => fs.writeFileSync(cacheFile(k), Buffer.from(parts[i].buffer, parts[i].byteOffset, parts[i].byteLength)));
    done += batch.length; process.stdout.write(`\r  recorded ${done}/${todo.length}`);
  };
  for (let i = 0; i < batches.length; i += 3) await Promise.all(batches.slice(i, i + 3).map(work));
  if (todo.length) console.log();
}
function concat(rs) { const out = new Int16Array(rs.reduce((a, r) => a + r.length, 0)); let o = 0; for (const r of rs) { out.set(r, o); o += r.length; } return out; }

// ---------- packing ----------
function pack(keys) {
  fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
  const index = { recipe: RECIPE, packs: [], clips: {} };
  let buf = [], size = 0;
  const flush = () => { if (!size) return; const name = `pack-${index.packs.length}.bin`; fs.writeFileSync(path.join(OUT, name), Buffer.concat(buf)); index.packs.push(name); buf = []; size = 0; };
  for (const k of keys) {
    const mp3 = execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', cacheFile(k), '-codec:a', 'libmp3lame', '-b:a', '32k', '-f', 'mp3', '-write_xing', '0', '-id3v2_version', '0', '-'], { maxBuffer: 1 << 26 });
    if (size + mp3.length > PACK_BYTES) flush();
    index.clips[k] = [index.packs.length, size, mp3.length];
    buf.push(mp3); size += mp3.length;
  }
  flush();
  index.version = crypto.createHash('sha1').update(JSON.stringify(index.clips)).digest('hex').slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
  const total = index.packs.reduce((a, p) => a + fs.statSync(path.join(OUT, p)).size, 0);
  console.log(`packed ${keys.length} clips into ${index.packs.length} packs, ${(total / 1048576).toFixed(1)} MB`);
}

(async () => {
  const lines = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  if (process.argv[3]) lines.app.push(...JSON.parse(fs.readFileSync(process.argv[3], 'utf8')));
  const keys = wanted(lines);
  if (process.env.DRY) { console.log(keys.length, 'clips,', keys.reduce((a, k) => a + V.spoken(k).length, 0), 'characters'); return; }
  await record(keys);
  pack(keys);
})().catch(e => { console.error(e); process.exit(1); });
