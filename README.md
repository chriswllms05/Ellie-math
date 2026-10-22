# Ellie Math

A number-sense and math-facts practice app for one 3rd grader, built to reward knowing rather than guessing. Plain HTML/JS, no build step, installs to an iPad home screen as a web app and runs on a Mac in Safari or Chrome.

## Run it

Serve the folder over https (or http on a local network) and open `index.html`. Opening the file directly (`file://`) works for a quick look but speech, the service worker and home-screen install need a real origin.

- Quick local server: `python3 -m http.server 8000` in this folder, then `http://<your-mac-ip>:8000/` on the iPad.
- Hosting: any static host (GitHub Pages, Netlify, Cloudflare Pages). Keep all files together.
- On the iPad: open in Safari → Share → **Add to Home Screen**. Launch from the icon; it runs full screen and offline.

## What's in it

- **Day 1 is a placement**, not a lesson: cold probes across facts to 20, place value and rounding, with "I don't know" available.
- **Daily session**: three 5-minute parts (Foundations → Big numbers → School work), auto-ends, then a card for the grown-up.
- **Typed answers only**, a praised **I don't know** button, a hidden clock that stops at the last digit.
- **Three outcomes**: fast-right (knows it), slow-right (figured it out; stays in practice), miss → two-stage help (picture + guiding question first, answer only after a second try), then the item returns a few questions later without the picture.
- **Two mastery models**: facts use Leitner boxes that only advance on a fast-right answer on or after the due day (hers = fast on two different days; reviewed at 1, 2, 4, 8, 16 days); procedures (rounding, place value, estimating, column work) count as solid when 8 of the last 10 unscaffolded tries were fast and right across two days.
- **Pictures in Dimensions Math language**: ten frames, number bonds, number lines with the halfway tick, place-value discs, column regrouping.
- **Finger-counting countermeasures**: flashed Quick Look behind a "Ready" button, "name your trick" before typing on learning rungs, "How did you know?" check-ins.
- **Celebration tied to the right things**: a flower garden that grows only from facts that are hers, skill-unlock ceremonies, and the parent's own recorded voice clips at the big moments.
- **Grown-up area** (press and hold): end-of-session card, weekly digest with catch-up targets, skill ladder with per-rung overrides, needs-work list, voice clips; settings and reset sit behind a 4-digit PIN. Backup/restore to a JSON file. State lives in localStorage with an IndexedDB mirror.

## Files

| File | Role |
|---|---|
| `index.html` | shell and all CSS |
| `engine.js` | saved state, mastery models, gates, queues |
| `content.js` | skills, item generators, pictures, help text and spoken strings |
| `app.js` | screens and the session controller |
| `parent.js` | grown-up card, digest, settings, voice clips, backup |
| `audio.js` | speech, voice-clip recording/playback, small sounds |
| `sw.js`, `manifest.webmanifest`, `icon-*.png` | home-screen install and offline |
| `tests/playtest.js` | browser play-tests (personas: knower, guesser, counter, IDK-spammer, mixed; multi-day spacing; content sanity) |
| `tests/shots.js` | screenshots of the main screens |

Tests: `npm i playwright` once (or point `CHROME` at a Chromium binary), then `node tests/playtest.js`. `ONLY=personas|days|sanity` runs one section.
