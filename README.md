# Ellie Math

A number-sense and math-facts practice app for one 3rd grader, built to reward knowing rather than guessing. Plain HTML/JS, no build step, installs to an iPad home screen as a web app and runs on a Mac in Safari or Chrome.

## Run it

Serve the folder over https (or http on a local network) and open `index.html`. Opening the file directly (`file://`) works for a quick look but speech, the service worker and home-screen install need a real origin.

- Quick local server: `python3 -m http.server 8000` in this folder, then `http://<your-mac-ip>:8000/` on the iPad.
- Hosting: GitHub Pages from this repo (Settings → Pages → branch `main`, folder `/`), served at https://chriswllms05.github.io/Ellie-math/. Any static host works; keep all files together.
- On the iPad: open in Safari → Share → **Add to Home Screen**. Launch from the icon; it runs full screen and offline.

## What's in it

- **Day 1 is a placement**, not a lesson: cold probes across facts to 20, place value and rounding, with "I don't know" available.
- **Daily session**: three 5-minute parts (Foundations → Big numbers → School work), auto-ends, then a card for the grown-up.
- **Typed answers only**, a praised **I don't know** button, a hidden clock that stops at the last digit.
- **Three outcomes**: fast-right (knows it), slow-right (figured it out; stays in practice), miss → two-stage help (picture + guiding question first, answer only after a second try), then the item returns a few questions later without the picture.
- **Two mastery models**: facts use Leitner boxes that only advance on a fast-right answer on or after the due day (hers = fast on two different days; reviewed at 1, 2, 4, 8, 16 days); procedures (rounding, place value, estimating, column work) count as solid when 8 of the last 10 unscaffolded tries were fast and right across two days.
- **Pictures in Dimensions Math language**: ten frames, number bonds, number lines with the halfway tick, place-value discs, column regrouping, bar models, arrays.
- **Hands-on on the iPad**: drag a marker to place numbers on a number line; in help, drag counters to fill the ten first, split a number bond, or drag a ten-disc into the ones where it breaks into 10. Everything that drags also works with a tap.
- **Skills**: Foundations (Quick Look, Number Bonds, Partners of 10, +1/+2, Doubles, Ten and More, Facts to 10, Near Doubles, Make 10, Ten Take Away, both kinds of take-away); Big numbers (read the number, Trade Tens, Where Does It Go?, count on, compare, neighbors, rounding to 10/100/1,000); School work (In Your Head mental math, Story Problems with bar models, estimating, column add and subtract); Getting ready for times tables (skip counting, rows and groups, ×2 ×5 ×10).
- **Misses traced to their building blocks**: a fact she keeps missing triggers a check of the smaller facts it depends on; weak ones are practised first.
- **Finger-counting countermeasures**: flashed Quick Look behind a "Ready" button, "name your trick" before typing on learning rungs, "How did you know?" check-ins.
- **Her world, her choice**: on first launch she picks Garden, Ocean, Space or Classroom. Every fact that's hers adds a flower, fish, star or sticker to it; the colors, celebrations and break screens follow her pick. She can change worlds any time and keeps everything.
- **Dot**, a ten-frame dot with a face, keeps her company: thinking while she works, delighted at a fast answer, curious (never disappointed) at a miss, cheering at the big moments. While she's answering, Dot is the only thing that moves.
- **Celebration tied to the right things**: collection items only from facts that are hers, skill-unlock ceremonies, and the parent's own recorded voice clips at the big moments.
- **Teach Dot**: on facts that are already hers, she checks Dot's work (Dot makes real kid mistakes) or teaches Dot the strategy step by step. Dot keeps a notebook of what she taught.
- **Her avatar** (built on the device, never uploaded) appears in her world and at celebrations; milestone surprises can be dragged anywhere in her world.
- **Grown-up area** (press and hold): end-of-session card with a 60-second "do this now", a one-minute parent check, this week's 3 things (pace forecast, stuck facts with a matching game, column-work mistakes split into fact slips vs regrouping), weekly digest with catch-up targets, teen take-away grid, a recorded reply that plays at her next session, skill ladder with per-rung overrides, needs-work list, voice clips; settings and reset sit behind a 4-digit PIN. Backup/restore to a JSON file. State lives in localStorage with an IndexedDB mirror.

## Files

| File | Role |
|---|---|
| `index.html` | shell and all CSS |
| `engine.js` | saved state, mastery models, gates, queues |
| `content.js` | skills, item generators, pictures, help text and spoken strings |
| `app.js` | screens and the session controller |
| `parent.js` | grown-up card, digest, settings, voice clips, backup |
| `voice.js` | how a spoken line maps onto Dot's recorded clips (shared with `tools/voice`) |
| `audio.js` | speech (Dot's recorded voice, else the iPad voice), voice-clip recording/playback, small sounds |
| `voice/` | Dot's recorded voice: `index.json` and mp3 packs, built by `tools/voice/build.js` |
| `theme.js` | the four worlds, Dot, and the collection pictures (all inline SVG) |
| `world.js` | her world: zones, fact spots, milestones, the close-up view |
| `manip.js` | drag-or-tap widgets: counters, ten-discs, the number-line marker, world surprises |
| `avatar.js` | her avatar and the builder |
| `teach.js` | Teach Dot |
| `fonts/` | Fredoka, bundled so it works offline (SIL Open Font License) |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | home-screen install and offline |
| `tests/playtest.js` | browser play-tests (personas: knower, guesser, counter, IDK-spammer, mixed; multi-day spacing; content sanity) |
| `tests/shots.js` | screenshots of the main screens |

Tests: `npm i playwright` once (or point `CHROME` at a Chromium binary), then `node tests/playtest.js`. `ONLY=personas|days|sanity` runs one section.
