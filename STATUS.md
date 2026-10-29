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

## Morning orders, Mr. Pip's market, Mo's post office, and every job on one screen

- **Morning orders.** Each day the village has three requests, shown on Dot's note ("Today's orders · 1 of 3 done") and on the notice board with checkboxes: **Rosa's apples** (5 right answers), **Mr. Pip's pies** (5; until his stall opens, **5 fish** instead), and **Dot's lesson** on the board. All three done: a thank-you, 5 bonus coins, and Dot's note switches to "Free time". A hard day still ends: after about 12 minutes on the orders, the day counts as done.
- **Dot's lesson** (`startSession('lesson')`): the parts of the day that aren't village jobs yet: big numbers, school work, times facts, Teach Dot, and any open fact skills no job covers today (Quick Look, Number Bonds). About 60% of a full session's length. It shows the grown-up card at the end and plays your recorded reply at the start. **Practice everything** (the old full daily session), the evening review and pick-a-skill stay on the board.
- **Mr. Pip's market (taking away).** His pie stall is on the map, bottom right; it opens with Ten Take Away (when partners of 10 are strong), and Dot announces it. Mr. Pip counts his coins onto the counter: "Here are 13 coins. The pie costs 8. How many coins back?" The sum is on a chalkboard on the counter. Help lays his coins in trays of ten and takes the pie's coins out the way practice's strategy says (take from the 10, ones first, or think addition).
- **One job screen for everything.** Fishing moved onto the same layout as the orchard and the market: the question on a sign on the shore, numbers under her right thumb, "hear it" and "I don't know" under her left, coins and the goal top left, Dot's words in a bubble (help shows the ten-frame there, said as fish and spots).
- **Villagers with wants.** The first time she meets Rosa or Mr. Pip, they say hello and promise a surprise for helping three times. Rosa gives her an apple tree; Mr. Pip, one of his cat's kittens. Gifts wait free in the yard tray (and come back if she puts them away).
- **Mo's post office (place value).** Mo the mail carrier stands by the post office (between the orchard and the notice board). Each package's label shows its house number in number discs (Read the Number), or the house numbers so far along the street (Count On); she types the house number and that house's plaque lights up. Questions come at her level in each skill and are graded like practice's big-number skills (a level-up gets its own celebration). Mo's surprise is a mailbox for her yard. Not one of the morning orders: it's there for free time, and Dot suggests whichever villager she's helped least.
- **For you, in Grown-ups → In her village:** the last 7 days of morning orders (✓ all three, a count like 2/3, or ⏱ for a hard day that stopped at 12 minutes, with minutes spent) and this week's jobs: how many times, how long, how many answers. What she picks in free time tells you what she enjoys.
- **The map stays clear.** Job buttons are compact; only the button for Dot's next job is big, colored and explained. In the village's cards the main choice is terracotta and any other is cream, matching.
- **Never leaving the world.** Dot's lesson, placement, the summary and the skill list sit over a soft, blurred view of her own village.

## Coins, Rosa's orchard, and Dot's guide (live)

- **Coins are the one kind of money.** Her fish became coins, one for one. Fishing now sells each fish for a coin; Rosa pays a coin for each apple job. Prices in the yard are in coins.
- **The orchard (adding):** Rosa stands by her apple trees on the map. Tap her (or **🍎 Help Rosa**) and the camera moves in close. Apples drop into two baskets, hers and Rosa's, and Rosa asks "You picked 8. I picked 5. How many apples in all?" The sum is on a wooden sign in the orchard, and the number she types appears on it. Five right answers fill Rosa's baskets.
- It runs on the real engine: the addition facts she has open (+1 +2, Doubles, Ten and More, Facts to 10, Near Doubles, Make a 10; no facts with a 0), graded with `gradeFact`. Only right, unrushed answers pay; misses come back a few apples later; the first question each round is read aloud, and its clock starts after Rosa finishes talking. Sessions show in the grown-up area as "Picking apples with Rosa".
- **Help happens in the orchard.** "I don't know" or a miss turns the baskets into crates of ten: for 8 + 5, her 8 red apples and 2 of Rosa's yellow ones (blinking, moved over) fill a crate, and Rosa's other 3 sit in the next. Dot uses practice's own strategy words, with "frame" and "dots" said as "crate" and "apples".
- **The job screen is built for a landscape iPad:** the scene fills the screen, numbers are under her right thumb, "hear it" and "I don't know" under her left, coins and the goal (apples that fill in) top left, back to the village top right.
- **Dot's guide:** a "Next job" note pinned beside her coins, and a bouncing marker on the place: catch fish, buy something for your yard, read the note on the board, help Rosa, do today's practice. Tapping the note walks her there. Dot also says it when she comes back to the village, and when she taps Dot.
- **Sharper pixels:** the village is drawn at the screen's real resolution, and when the camera rests, every scene pixel is the same whole number of screen pixels. Close-ups use bigger, shaded characters (she and Rosa are 16 x 21 pixels, with eye shine).
- Words: "package", not "parcel"; "coins back", not "change". See "Words she knows" in `DESIGN-v2.md`.

## The village comes alive, and it's home (live)

After a weekend of use: the village felt like wallpaper, the home screen felt disconnected from it, and the copy didn't build any attachment. Changes:
- **The village is home.** No world picker any more: a new player builds an avatar and arrives in the village. Today's practice, the evening review and "pick a skill" live on a **notice board** in the village (a "!" floats over it when something is waiting). Summaries return to the village. Grown-ups: press and hold the small button in the bottom-right corner.
- **An arrival story.** The first time, Dot greets her by name and shows her the house, the empty yard, the pond ("everyone here trades with fish"), and the broken bridge ("nobody knows what's on the other side"), one beat at a time, with the camera moving to each place. Tap to continue; there's a Skip.
- **The world moves.** She walks where you tap (along the paths, behind trees and houses), blinks and waves; Dot floats along beside her; fish glide under the water, smoke drifts from chimneys, butterflies flutter, cloud shadows pass, the water sparkles and ripples.
- **Transitions.** Tapping the pond walks her to the dock and the camera zooms in; leaving zooms back out. Building pops things in with a little dust.
- **Fishing feels like fishing.** She casts, the bobber splashes down, a fish swims up and nibbles, and the question (and its clock) starts only when the fish arrives. A right answer pulls the fish out in a leap into her basket with a splash, sparkles and "+1"; a fast one glows gold. A miss lets the fish dart away. Her first round is 3 fish, then rounds of 5.
- **The bridge is the progress bar.** Each make-10 fact that becomes hers lays one plank, shown as a short scene the next time she's in the village. Eight planks open the meadow.
- **Copy**: "This fish has 7. How many more make 10?"; "Go fishing: fish are money here"; "Fix up your yard"; "Oops, it got away. Let's figure it out together."; "yard" instead of "plot".
- **Fixes**: the number pad now acts the moment a finger lands (quick double taps like "11" were being dropped), dims while it's waiting, and wiggles if tapped then. Placement and practice questions were cut off at the sides on a sideways iPad (an old portrait width limit); fixed. "1 dots" now reads "1 dot".
- All new lines are recorded in Ana's voice.

## Landscape only (live)

The whole app is laid out for an iPad held sideways. Held upright, it shows a "Turn your iPad sideways" card with Dot and a Rotation Lock note for grown-ups (iPadOS ignores a web app's orientation setting, so this is the reliable way). Practice puts the question on the left and a bigger pad on the right, so nothing needs scrolling; home and the session summary put her world beside the buttons; pick a skill and pick a world are two-column grids. The village is full-bleed: the pixel world fills the screen edge to edge (a sliver is cropped on iPads of other shapes) and every control floats on top.

## Her village, slice 1 (live; superseded by the section above where they differ)

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
   The app is **landscape only**. iPadOS doesn't let a web app lock its own orientation, so held upright it shows a "Turn your iPad sideways" card. While she plays, turn the iPad sideways and turn on **Rotation Lock** (swipe down from the top-right corner).
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
