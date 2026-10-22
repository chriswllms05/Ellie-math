/* Checks that lines play fully from Dot's recordings. Run: node tools/voice/coverage.js lines.json [said.json] */
const fs = require('fs'), path = require('path'), V = require('../../voice.js');
const index = JSON.parse(fs.readFileSync(path.join(__dirname, '../../voice/index.json'), 'utf8'));
const has = k => !!index.clips[k];
const all = [];
for (const f of process.argv.slice(2)) { const d = JSON.parse(fs.readFileSync(f, 'utf8')); for (const t of Array.isArray(d) ? d : [...d.facts, ...d.procs, ...d.app]) all.push(t); }
const miss = [...new Set(all)].filter(t => !V.plan(t, has, ['NAME', 'friend', 'Teacher']));
let whole = 0, spliced = 0;
for (const t of all) for (const s of V.sentences(V.normalize(t, ['NAME', 'friend', 'Teacher']))) has(`s:${V.key(s)}`) ? whole++ : spliced++;
console.log(`${all.length} lines: ${miss.length} not fully recorded; sentences ${whole} whole, ${spliced} joined from pieces`);
miss.slice(0, 30).forEach(t => console.log('  MISSING:', t, '->', V.sentences(V.normalize(t, ['NAME', 'friend', 'Teacher'])).flatMap(s => has(`s:${V.key(s)}`) ? [] : V.pieces(s).filter(p => !has(p.k)).map(p => p.k)).join(' | ')));
process.exit(miss.length ? 1 : 0);
