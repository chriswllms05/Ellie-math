# Build plan

The order of work, and how each step is checked before the next one starts. Words and shared numbers come from [00-names-and-numbers.md](00-names-and-numbers.md); how the code is organised and tested is in [11-tech.md](11-tech.md); getting the laptop and iPad ready is [12-laptop-setup.md](12-laptop-setup.md).

## Before the first line of code

- The laptop and Ellie's iPad are set up ([12-laptop-setup.md](12-laptop-setup.md)), and the first session knows her iPad model, iPadOS version and how the app will be installed.
- Names aren't needed yet. The working names in 00 are used until Ellie picks hers; renaming is a text change ([11-tech.md](11-tech.md), String Catalog).
- Art isn't needed yet. Every milestone works with placeholder shapes (coloured circles with an element icon for critters, plain rectangles for Grumps); [10-art-and-sound.md](10-art-and-sound.md) says what replaces them.

## How a milestone is done

Each milestone below lists what to build, the specs it implements, the tests that must pass, and what you check on the iPad. A milestone is **done** when:

1. Its tests pass, along with every earlier milestone's (`swift test` in GameCore and the Xcode tests).
2. Screenshots of its screens on the iPad simulator have been looked at.
3. You've done its iPad check on Ellie's iPad (or yours) and it behaves as described.
4. Anything that changed from the spec is written back into the spec, and new decisions are in [DESIGN.md](../DESIGN.md).

Milestones are built in order: each one leans on the ones before it.

## Slice 1: the core loop, end to end

### M0: the skeleton

**Build:** the Xcode project and the GameCore package laid out as in [11-tech.md](11-tech.md); `Tuning.swift`; `GameRNG` and `GameClock`; `SaveGame` version 1 with saving, the previous-copy and snapshot fallbacks; the app model; portrait, full-screen iPad settings; the main screens from [01-screens.md](01-screens.md) as empty placeholders with working navigation; the debug menu.

**Tests:** GameCore builds and imports no UI framework; save round trip; a corrupted save falls back to the previous copy, then to a snapshot; the seeded RNG repeats with the same seed; a UI test launches the app and visits every placeholder screen.

**On the iPad:** it installs and opens, held upright; every placeholder screen can be reached and left; closing and reopening the app keeps a test value set from the debug menu.

### M1: math rounds

**Build:** the facts-to-20 skills, the placement check, mastery, round planning, timing, grading, "I don't know", help after a miss, pay and combo ([02-math.md](02-math.md), pay and combo from 00); a first camp with one pinball tree to start a round on, pinballs growing on it and tapped to collect ([08-camp.md](08-camp.md)); the pinball count in the top bar.

**Tests:** grading of fast, slow, wrong and "I don't know"; every combo step in 00 (up, down one step, back to x1, unchanged); a fact counts as solid only after fast answers on two different days, with the test clock; round makeup; placement sets starting levels; simulated players: the fast guesser earns fewer pinballs per minute than the knower and the counter.

**On the iPad:** do the placement check and a round yourself. Answer some fast, some slowly, some wrong, and tap "I don't know": the pinballs and the combo do what 00 says. Leave the app mid-question and come back: that question is asked again.

### M2: the pinball machine

**Build:** the board, PUSH button, multiplier picker, timing bumper, slots, capsule bumper gauge, the card hole and jackpot as Slice 1 handles them, candy and the shared level bar ([03-pinball-machine.md](03-pinball-machine.md); every amount from [07-economy.md](07-economy.md)).

**Tests:** 100,000 simulated launches land in each slot within ±0.3 points of the shares in 00; multiplier tiers open at the thresholds in 00 and close when she drops below; cost and payout both scale with the multiplier; candy fills the level bar and levels her up on 07's curve; the scene lands the rolled slot in at least 999 of 1,000 headless runs.

**On the iPad:** launch 50 balls at x1 and a few at higher multipliers (use the debug menu for pinballs). It feels like the real machine: the ball bounces believably, slots light up, candy flies to the level bar, the capsule gauge fills. It stays smooth.

### M3: the catcher

**Build:** capsules from the capsule gauge, the catch session (claw, sliding and fixed multiplier bars, rails, chute, conveyor), balls-needed counts, results, the crate screen showing what can turn up, and duplicates feeding star progress ([04-catcher.md](04-catcher.md)).

**Tests:** 100,000 simulated capsule openings match 04's find chances within ±0.5 points; ball counting and catching at 0; the number of drops per capsule; a duplicate adds star progress instead of a second copy.

**On the iPad:** open several capsules. Timing matters: waiting for the bars to line up catches more. A drop through x20 then x5 (100 balls) stays smooth; check the frame rate in a debug build.

### M4: critters

**Build:** the Slice 1 roster (the four starters plus the other Common and Rare critters [05-critters.md](05-critters.md) lists for Slice 1), the critter list and detail screens, stats at her level, star tiers, evolution with its animation, skills as 05 describes them.

**Tests:** every species passes the catalogue checks (forms match its rarity in 00, an element, a role, skills for each form); stats at a given level; star progress per duplicate; evolution happens at 05's thresholds and only then.

**On the iPad:** with the debug menu, give a starter enough duplicates to evolve. The evolution plays and the new form shows up everywhere (list, detail, battle).

### M5: battle, chapter 1, stages 1–10

**Build:** the formation screen (3 lanes × 3 rows, drag to place, green "Yes!" / red "No!" lane feedback, the wave preview), the battle simulation and its drawing, the Grumps chapter 1 needs, the timer, win and lose, the battle report, the boss on stage 10, and stage rewards and the first boss star ([06-battle.md](06-battle.md), rewards from [07-economy.md](07-economy.md)).

**Tests:** the same team, stage and seed always give the same result; element multipliers from 00; a Grump reaching the bottom loses, the timer running out loses, clearing every wave wins; for each of stages 1–10, the team the economy simulation predicts she'll have by then wins at the rate 06 and 07 target.

**On the iPad:** play stages 1–10. Early stages are winnable with the starters; placement and elements visibly matter; the stage 10 boss needs some thought; losing shows the report and doesn't feel harsh.

### M6: first launch, grown-up view, backup

**Build:** the first-launch flow from [01-screens.md](01-screens.md) (welcome, starters, the placement check, the first round, the first launch, the first catch, the first battle); the grown-up view and its settings behind press-and-hold and the PIN ([02-math.md](02-math.md)); the PIN in the Keychain; backup export and restore ([11-tech.md](11-tech.md)).

**Tests:** a UI test runs the whole first-launch flow on a fresh install; backup export then restore gives back the same save; restore keeps a safety copy; the wrong PIN keeps the grown-up view closed.

**On the iPad:** delete the app, install it fresh, and go through the first launch as Ellie would. Set the PIN. Look at the grown-up view after a few rounds. Export a backup to Files.

### M7: polish and TestFlight

**Build:** whatever art and sound are ready from [10-art-and-sound.md](10-art-and-sound.md) (placeholders stay where art isn't ready), Reduce Motion, the app icon, performance work on her iPad, and the first TestFlight upload if you've joined the Developer Program.

**Tests:** everything above; on her iPad, 60 fps in every scene and no memory growth over 30 minutes (Instruments); the screenshot set at her iPad's size and two other sizes.

**On the iPad:** install from TestFlight (or by cable). Play for 15 minutes the way she would. Then hand it to Ellie.

## Play-testing with Ellie (about 5 days, tune)

Let her play without being told how much math to do; just show her the first tree. The grown-up view and the answer log should be able to show the following ([02-math.md](02-math.md) owns how; the app logs which screen she's on and for how long so time per part can be counted):

| Watch | Why it matters |
|---|---|
| Does she start math rounds **without being asked**, and how many a day? | The whole design depends on math being worth doing for the pinballs. |
| **Wrong-answer rate**, and how many wrong answers were fast | Fast wrong answers mean rushing or guessing for the combo. |
| Share of **fast** right answers, by skill | Whether the 3-second fast time is right for her. |
| **How long a round takes** | Too long and rounds feel like work; too short and pinballs come too easily. |
| **Time spent** in the machine, catcher, battle and camp | Which parts pull her in, and which she skips. |
| Where she gets **stuck** (a stage she keeps losing, a skill she avoids) | Difficulty and balance. |
| What she **says** about it | Things no log catches. |

**What it feeds:**
- Pay, the combo steps and the round length (00, [07-economy.md](07-economy.md)).
- The fast time per skill ([02-math.md](02-math.md)).
- How quickly the economy moves her through levels and stages (07).
- Which part of Slice 2 comes first.
- Art priorities: whatever she spends the most time looking at gets real art first.

## Later slices

Coarser for now; each gets milestones like Slice 1's when it starts.

- **Slice 2:** chapters 2–4 (5 × 3 grid from chapter 4), more Rare critters, evolution trials, feeding, the boss star track, more pinball trees, Quick Deploy, auto-battle, wish boxes, decorating and opening up camp land. Specs: [05](05-critters.md), [06](06-battle.md), [07](07-economy.md), [08](08-camp.md).
- **Slice 3:** the jackpot games against computer camps, shields, reward cards. Spec: [09-later-modes.md](09-later-modes.md).
- **Slice 4:** Horde Invasion with chips, Boss Challenge, the first rotating events. Spec: [09-later-modes.md](09-later-modes.md).
- **Slice 5:** more critters, chapters and events.

Each later slice also adds the next math skills as her class reaches them ([02-math.md](02-math.md)), and grows the economy simulation and battle balance tests to cover the new parts.

## Risks

| Risk | What to do |
|---|---|
| **Art isn't ready** | Build and test with placeholder shapes; everything plays without art. Swap art in as it arrives; scenes never depend on a sprite's exact size. |
| **Pinball or catcher odds drift** from the specs once the board looks right | The slot-share and find-chance simulation tests catch it; outcomes are rolled in GameCore, so the board's look can change without changing the odds. |
| **The economy is too slow or too fast** | Every amount is in `Tuning.swift`; the economy simulation shows the effect of a change before she sees it. Tune from the play-test numbers. |
| **She stops starting math rounds** | Check first: are rounds too long, is the fast time too tight (few fast answers), or does she have more pinballs than she can spend? Then shorten rounds, raise the pay or the combo, or give the trees something new to show (a bigger harvest, a tree that grows). Don't add math anywhere else: math only earns pinballs. |
| **She rushes and guesses** for the combo | Wrong answers already pay nothing and reset the combo; if fast wrong answers stay high, look at how 02 handles quick wrong answers, rather than lowering what fast right answers pay. |
| **Performance on her iPad** | Profile on her iPad from M2 on, not just the simulator; the ball cap and the rules in [11-tech.md](11-tech.md) are the levers. |
| **Lost progress** | Saves fall back automatically; export a backup weekly from the grown-up view. |

## Recording decisions

- Decisions go in [DESIGN.md](../DESIGN.md) under "Decisions made", one line each, with the date.
- When a decision changes how something works, the spec that owns it (see the table in 00) changes in the same commit.
- Shared numbers change in 00 and `Tuning.swift` together.
- Open questions stay in DESIGN.md's "Open questions" until answered.
