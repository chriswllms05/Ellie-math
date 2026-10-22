# Status note

## Where things are

**Ellie Math v1 is built, reviewed and working.** It lives in its own repository, https://github.com/chriswllms05/ellie-math. Everything from SPEC-v1 marked v1 is in.

### Verification so far
- Browser play-tests (`tests/playtest.js`): five personas (knower, guesser, counter, IDK-spammer, mixed), a six-day simulated run, content sanity across every fact and ~2,000 generated items, and regression checks for every bug the review found.
  - The **guesser** earned fast credit on 1 of 53 items and got 52 rushed flags.
  - The **IDK-spammer** owns zero facts after a full session.
  - The **counter** (right but slow) is logged as slow-right, not known.
  - Over six simulated days, facts became "hers" only from day 2 and nothing climbed past box 3 (spacing holds).
- Screenshots of every screen type reviewed by eye (`tests/shots.js`).
- **Adversarial code review** (40 agents: five lenses, one skeptic per finding): 29 findings survived verification. All of the blocking and important ones are fixed; the three "nice" ones are fixed too except the estimation-help nudge, which is simplified rather than fully implemented.

### What the review caught (and is now fixed)
Would have hurt her directly:
- Saved state went stale after a restore/reset/recovery, which could show the placement screen over a full record and regrade real facts.
- Column-algorithm digits rendered mirrored on the "read the answer" step (456 shown as 654).
- The "Sam says" check called correct answers wrong about half the time; Sam's wrong answers could go negative (untypeable).
- "12 − 1" help said "then −1 more"; subtraction across a zero said "Tens: −1"; the neighbors count read "430, 440, 440".
- "Which is bigger?" was a coin flip that luck could mark solid; now three numbers, biggest then smallest.
- Column regrouping told her when to regroup at every level; now only while the skill is new.
- Clock stopped at the last digit, so "type a guess, check on fingers, then ✓" earned fast credit; now a fast answer must also be confirmed within 2 s.
- Quitting during an answer's pause let timers fire afterwards and double-log the session.
- Quitting placement on item 1 marked it done forever; now placement needs 15 answers or the full set, never re-asks, and seeds each procedure's starting level.

iPad-specific:
- Voice clips would silently fail (iOS autoplay policy); audio is now primed inside her first tap.
- Speech fallback timers from an earlier step could un-hide the pad mid-sentence; timers are bound to their step.
- Service worker: slow Wi-Fi no longer leaves a blank screen (cached copy wins after 2.5 s) and bad responses are never cached.
- An iOS-killed session is now logged as "(interrupted)" on next launch instead of vanishing.
- Double-tap zoom and long-press selection disabled on practice screens.

Parent side:
- "I counted" is now weekly (with a week-over-week arrow) instead of lifetime.
- Fast/slow percentages are facts-only, so opening harder rungs can't make the trend look worse.
- Backup goes through the iPad share sheet (Files/AirDrop/Mail) and only counts when confirmed; the digest nags after 7 days without one; restore asks first and keeps a safety copy.
- PIN change asks twice and updates the hint; no silent change on blur.
- Estimation steps show rounding-right vs adding-right in the digest, and her rounding steps feed her rounding record.

## Needs you

1. **Turn on GitHub Pages** (one time): repo Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, folder `/ (root)` → Save. A minute later the app is at https://chriswllms05.github.io/ellie-math/. Open that in Safari on the iPad and Add to Home Screen.
2. **Test on her iPad before day 1**: speech voice and timing, mute switch, microphone permission for voice clips, Add to Home Screen, backup via share sheet. I can't run real Safari here.
3. **One worksheet photo**: 4-digit numbers to the nearest 10/100, or to the nearest 1,000? Both are in; it decides what School-work leads with.
4. **Her theme** (garden / ocean / space / animals…) for the visual pass. Not started until she picks.

## How to look at it

Open https://chriswllms05.github.io/ellie-math/ once Pages is on (or `index.html` locally) for a tour (sound and install need a server; everything else works). Read `FIRST-WEEK.md` before her first session; it now matters that **you set the PIN and record clips before she touches it**, because the PIN can be claimed by whoever sets it first.

## Decisions made without you (easy to change)

- Default session is 3 × 5 min; evening review (due facts only) appears after the daily session is done; a day counts as done at 15 items or half the planned minutes.
- "Name your trick" buttons appear only on derived-strategy rungs while a fact is still learning; "How did you know?" after every 4th fast fact.
- Voice clips play at: a fact becoming hers (max 2 per session), a skill unlocking, and the end of a session where she learned something she didn't know.
- Many skills unlocking at once (after placement) get one combined ceremony.
- School-work falls back to Big-numbers items if nothing in it is open yet.
