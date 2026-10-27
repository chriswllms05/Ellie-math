# Status note

## Where things are

**Ellie Math v1 is built, reviewed and working.** It lives in its own repository, https://github.com/chriswllms05/Ellie-math. Everything from SPEC-v1 marked v1 is in.

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

## Visual pass (done)

She picks her world on first launch (Garden, Ocean, Space or Classroom; changeable from home). Each world has its own colors, a collection scene that grows one flower / fish / star / sticker per fact that's hers, themed celebrations and break screens. Dot, a ten-frame dot with a face, reacts to her answers from the corner of the practice screen and cheers at the big moments. Rounded Fredoka type is bundled for offline use. Motion everywhere except while she's answering; it switches off automatically if Reduce Motion is on.

## World building (done)

The world is now the home screen: a full-width scene where each foundation skill has its own place (flower bed, coral reef, constellation, or sticker chart on the classroom whiteboard) and every fact has a spot. Not tried → learning → hers → rock solid shows as soil → sprout → flower → sparkle (and the equivalents in each world), so the world changes after every session, not only at mastery. Milestones at 5, 10, 20, 35, 50, 75, 100, 150, 200 and 300 facts bring something new into the world with its own celebration; home shows how many facts until the next surprise. Tapping a zone opens a close-up with every fact labeled. After a session the summary shows the world with the new arrivals popping in. In the Classroom, Dot is the teacher (with glasses) and greets her with "Good morning."

## Teach Dot, avatar, review fixes (done)

She builds her own avatar on the device (never uploaded; the repo is public). Teach Dot: on facts that are already hers she checks Dot's work or teaches Dot the steps; a miss there counts as a real retention miss. A whole-app review then fixed, among others: the collection never shrinks (a slipped fact shows as thirsty instead of disappearing), quieter day-2 celebrations, a "Show me" button in help, honest column-subtraction steps once hints fade, subtract-from-10 for teen take-away, no counting "tricks", PIN relock, and iPad sizing.

## Catch-up tuning, iPad dragging, parent loop, next units (done)

- **Engine**: at most 8 facts in learning at once, each woven in three times per session; easiest facts first; a fact becoming hers gives its turn-around a head start; subtraction facts open as soon as their addition partner is hers. While facts to 20 are behind, the daily plan gives facts a second burst.
- **Dragging**: Number Bonds (new Foundations skill; Make 10 builds on it), Where Does It Go? (number-line placement), drag-to-make-10 and split-the-bond in help, drag a ten-disc to regroup in column subtraction help, movable milestone surprises in her world. Anything that drags also works with a tap. A skill she has already opened never re-locks when a new prerequisite is added.
- **Parent loop**: "do this now" on the card, counting slips (answers off by one), one-minute parent check, this week's 3 things, teen take-away grid, a recorded reply that plays at her next session, newest voice clip plays first, a nudge when clips are over two weeks old.
- **Next units**: In Your Head (Dimensions chapter 2 mental math), Story Problems with bar models (help notices number-grabbing and wrong-operation answers), and a separate "getting ready for times tables" track (skip counting, arrays, ×2 ×5 ×10) that only takes a small share of School work.
- **Fixed along the way**: the yellow "fill the ten" counters were invisible in help, and the iPad size rules never applied (they were overridden by the base styles). Both fixed.

## Building blocks under the questions (done)

- **Misses traced to their parts**: when she misses a fact twice, the app checks the smaller facts it's built from (8 + 5 → 8 + ? = 10, 5 as 2 and 3, 10 + 3; 13 − 8 → 10 − 8, then 2 + 3; 6 + 7 → 6 + 6). Weak parts get a cold check a few questions later and go to the front of practice for a week. The grown-up card and "3 things" name the weak part, or say the parts are solid and it's the putting-together.
- **Column slips** send the fact behind the slip (e.g. 7 + 8 in the tens) to practice.
- **Story problems** start with one tap while the skill is new: is the question mark the whole (add) or a part (subtract)?
- **Ten Take Away** (10 − n) is its own small skill, required before take-away from teens.
- **Trade Tens** (14 ones = 1 ten and 4 ones; 1 ten and 4 ones = 14 ones; same with hundreds) comes before column add and subtract.

## Same words as her class (done)

Checked against Singapore Math's own grade 3 Letters Home (chapters 1–4) and the grade 1 lesson titles:
- Column work says **regroup** ("Regroup 10 ones as 1 ten", "There are not enough ones. Regroup 1 ten as 10 ones", "regrouped ten"), never carry or borrow.
- Mental math uses the chapter 2 strategy names: **add the tens**, **make the next hundred**, **over-add**, **over-subtract**.
- Story problems name the two bar models: **part-whole** (whole: add, part: subtract) and **comparison** (greater amount: add, difference or smaller amount: subtract).
- Teen take-away uses the grade 1 lesson names **subtract from 10** and **subtract the ones first**; addition says **make 10**.
- Comparing says **greater**. Number bonds say "3 and 4 make 7".
- Times facts now include ×3 and ×4: chapter 4 expects facts for 0–5 and 10 from memory, taught in grade 2.

## Dot's recorded voice (done)

Dot now speaks with a recorded child voice (Azure neural voice "Ana", slightly faster and higher than her default) instead of the iPad's built-in voice. Every line was recorded once and ships inside the app (`voice/`, about 29 MB in 8 packs), so the iPad needs no account and works offline after the first launch.
- About 2,600 core lines (every fact, its hints, Teach Dot, the app's own lines) are whole recordings. Lines with random big numbers or story names are joined from about 1,000 recorded phrases and numbers ("Round" + "4,000" + "300" + "72" + "to the nearest hundred").
- Coverage check: every line from the full play-test and from 190,000 freshly generated practice lines plays entirely from recordings. A line that somehow isn't recorded falls back to the iPad voice, and the sound check in the grown-up area names it.
- Her name is never spoken (it can't be pre-recorded): "Hi, Ellie!" is said as "Hi!". The name still shows on screen.
- Grown-up area → Voice: **Dot (recorded)** is the default and the first option; the iPad voices are still there.
- To change lines or the voice: `node tools/voice/collect.js lines.json && node tools/voice/build.js lines.json` (needs the Azure key on the environment; only new lines are recorded). `tools/voice/coverage.js` checks nothing is missing.

## Her village, slice 1 (built, not live yet)

The first slice of the v2 design (`DESIGN-v2.md`): a pixel-art village she reaches from a new **🏡 My village** button on home. Everything in v1 is unchanged and still the daily practice.
- **Her plot**: 6 × 3 spots in front of her house. 10 things to build (flowers, berry bush, pumpkin, lantern, bench, birdhouse, little tree, flag, doghouse, wishing well), each paid for in fish. Tap to place; tap a placed thing to paint it (9 colors), move it, or put it away for a full refund; or drag it to a new spot. No math in building. She starts with 3 fish so she can build something right away.
- **Fishing (make 10)**: the fish on her line shows a number; she types the partner that makes 10. It runs on the real engine: facts come from `buildFactQueue(['m10'])`, are graded with `gradeFact`, and use the same fast and rushed rules as practice. Only a right answer catches a fish; a miss lets it get away and opens the same two-step help; "I don't know" is safe; a missed fact comes back a few fish later. Rounds of 8; each round's answers are logged as a session, so the grown-up view counts them.
- **The meadow**: across a broken bridge. When 8 of the 11 Partners of 10 are hers, the bridge is fixed and the meadow opens: a second plot and three new things (sheep, haystack, scarecrow). A sign on the map shows her progress.
- **Her in pixels**: her village self wears her avatar's skin, hair and shirt colors. Dot is a little glowing wisp.
- All of Dot's new lines are recorded in Ana's voice.
- Code: `pixel.js` (art kit: palette, ground, props, people, buildable items), `village.js` (map, building, fishing, unlocks). Checks and screenshots: `node tests/village-shots.js [outdir]` (portrait and landscape).

What to watch when she tries it: does she go back to fishing without being asked? Does she build when nothing is required? Do the rushed flags stay low?

## Needs you

1. **Install on the iPad**: open https://chriswllms05.github.io/Ellie-math/ in Safari (capital E matters), Share → Add to Home Screen.
2. **Test on her iPad before day 1**: Dot's recorded voice (grown-up area → Sound check should say "Dot's recorded voice: 8 of 8 packs ready"), speech timing, mute switch, microphone permission for voice clips, Add to Home Screen, backup via share sheet. I can't run real Safari here.
3. **One worksheet photo**: 4-digit numbers to the nearest 10/100, or to the nearest 1,000? Both are in; it decides what School-work leads with.

## How to look at it

Open https://chriswllms05.github.io/Ellie-math/ once Pages is on (or `index.html` locally) for a tour (sound and install need a server; everything else works). Read `FIRST-WEEK.md` before her first session; it now matters that **you set the PIN and record clips before she touches it**, because the PIN can be claimed by whoever sets it first.

## Decisions made without you (easy to change)

- Default session is 3 × 5 min; evening review (due facts only) appears after the daily session is done; a day counts as done at 15 items or half the planned minutes.
- "Name your trick" buttons appear only on derived-strategy rungs while a fact is still learning; "How did you know?" after every 4th fast fact.
- Voice clips play at: a fact becoming hers (max 2 per session), a skill unlocking, and the end of a session where she learned something she didn't know.
- Many skills unlocking at once (after placement) get one combined ceremony.
- School-work falls back to Big-numbers items if nothing in it is open yet.
