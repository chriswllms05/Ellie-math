# Pinball machine

The centre of the game. She spends pinballs here (earned only by math, see [02-math.md](02-math.md)) and wins candy, capsules and bonuses. It copies the real game's machine as closely as the research and the user's description allow. Words and shared numbers: [00-names-and-numbers.md](00-names-and-numbers.md). Every amount won or spent: [07-economy.md](07-economy.md).

## What she sees

Real game: a vertical **peg field** (Plinko or pachinko style, about 30 pegs, **no flippers**) in an arcade cabinet, a moving bumper near the top, two ring bumpers, a cup in the middle over a small card hole, five slots along the bottom, a spring plunger on the right edge, and a huge **PUSH** button under the cabinet with the multiplier toggle beside it. Ours is laid out the same way, with our own cabinet art ([10-art-and-sound.md](10-art-and-sound.md)).

Board coordinates are relative to the playfield inside the cabinet: x from 0 (left) to 1 (right), y from 0 (top) to 1 (bottom). The playfield is taller than wide (about 1 : 1.55), held upright. Where the cabinet sits on the screen, and the top bar above it, belong to [01-screens.md](01-screens.md).

```
 ┌──────────────── arch ────────────────┐
 │            ╲  swing bumper  ╱       ║│ ← launch lane (right edge)
 │  (capsule ring)       (shield ring) ║│
 │   ·    ·    ·    ·    ·             ║│
 │      ·    ·    ·    ·    ·          ║│
 │   ·    ·  ╲__card__╱  ·    ·        ║│
 │      ·    ·    ·    ·    ·          ║│
 │   ·    ·    ·    ·    ·             ║│
 │  | far L | mid L |JACK| mid R | far R|║│
 └──────────────────────────────────────┘
         [ x2 ]   [  PUSH  ]   pinballs: 240
```

| Element | Where (x, y) | Size | Notes |
|---|---|---|---|
| Launch lane | x 0.93–0.99, from y 1.0 up to the arch | ball width + a little | The ball shoots up here when PUSH is pressed. The spring plunger is drawn at its bottom. |
| Arch | across the top, y 0.00–0.07 | | Carries the ball from the lane over to the left, dropping it in at the top centre. |
| **Swing bumper** | pivot at (0.50, 0.13) | bar 0.16 long | Swings side to side (see "The launch-timing trick"). |
| **Capsule ring** | centre (0.22, 0.24) | radius 0.065 | A round bumper; its rim is a gauge that fills with hits. |
| **Shield ring** | centre (0.78, 0.24) | radius 0.065 | Same, for shields (later). |
| Pegs | 6 staggered rows from y 0.33 to 0.73, 5 pegs a row, 0.15 apart | radius 0.012 | About 30 pegs, as in the real game. Rows alternate starting at x 0.17 and x 0.245. Pegs near the cup are left out so the cup reads clearly. |
| **Card cup** | two curved rails meeting over a hole at (0.50, 0.55) | cup 0.18 wide, hole 0.055 wide | A ball that drops into the hole wins a reward card (a candy bonus in Slice 1). |
| Slot posts | at x 0.00, 0.20, 0.40, 0.60, 0.80, 1.00; y 0.86–1.00 | | Gold posts between the five slots. |
| Slots, left to right | far left, mid left, **jackpot**, mid right, far right | | The jackpot's mouth is narrowed by two angled guards to 0.07 wide, so a landing there looks as rare as it is. Each slot shows what it pays (its candy number, scaled by the multiplier). |
| Event bubbles | above a slot | | Later: event items like "x80" over the slot that pays them ([09-later-modes.md](09-later-modes.md)). |

Ball radius 0.022. All sizes (tune) once seen on a real iPad.

## How a launch plays out

1. She taps **PUSH**. If she has at least as many pinballs as the multiplier, that many are taken away. (If not, see "Out of pinballs".)
2. The game decides where the ball will land (next section) and picks a ball path that lands there.
3. The plunger pulls back and springs (0.2 s), the ball shoots up the lane, over the arch, meets the swing bumper, bounces down through the pegs (ringing any bumper it hits), and drops into its slot. About **3 seconds** from tap to landing (tune).
4. The slot lights up and pays. Candy flies up into the candy bar; a level-up, capsule or bonus gets its own moment.

## Where the ball lands

**Decision: the outcome is chosen first, using the real game's odds, and then the ball plays a path recorded from real physics that lands in that slot.**

Why, rather than live physics on a tuned peg layout:
- **The odds have to be exact.** The jackpot (1.7%) and card hole (3.3%) are rare on purpose, and the whole economy rests on the average candy per pinball ([07-economy.md](07-economy.md)). Tuning peg positions until free physics happens to give 1.7% is fiddly and breaks whenever art moves a peg.
- **Same on every iPad.** Live SpriteKit physics changes slightly with frame rate and device. A decided outcome doesn't.
- **Testable without a screen.** The odds live in the game's rules code ([11-tech.md](11-tech.md)) and can be checked over a million draws in a second. SpriteKit can't step its physics faster than real time, so a 100,000-drop physics test isn't practical.
- **It still looks real,** because every path really was produced by physics; nothing is nudged on screen.

How it works:
- **Outcome table** (canonical shares from 00, scaled to 100%):

  | Outcome | Weight |
  |---|---|
  | Far left | 25.20% |
  | Mid left | 22.09% |
  | Jackpot | 1.71% |
  | Mid right | 22.09% |
  | Far right | 25.60% |
  | Card hole | 3.31% |

- **Path library:** a build-time tool drops many balls through the board using the game's own simple physics (balls against pegs, rails, posts and the swing bumper; balls don't hit each other) at many swing-bumper positions, records each path (positions every 1/60 s, plus which ring bumpers it hit and when), and keeps a spread of paths for every outcome at every one of **24 swing positions** (at least 8 paths per outcome per position; more for the common slots). The library ships with the app as a resource. If the board layout changes, the tool is run again.
- **At launch:** draw the outcome from the table (adjusted for the timing trick below), read the swing bumper's current position, pick a random stored path for that outcome at the nearest stored position, and play it. Paths for several balls in flight play independently (balls pass through each other, as they effectively do in the real game).
- **Ring hits come from the path,** so a ring only fills when the ball is seen hitting it.

## The launch-timing trick

Real game: the one skill is timing: launch "when the top-most moving bumper is angled toward the center" for a better chance at the middle slots.

Ours:
- The swing bumper rocks back and forth: angle = 35° × sin(2π·t / 2.4 s) (tune).
- While it's within **±8°** of level (pointing the ball toward the middle), it glows. A launch whose ball reaches the bumper while it glows is a **good launch**. The game knows the 0.9 s travel time from tap to bumper, so it judges by where the bumper will be when the ball arrives, and the glow is shown early by the same amount.
- **A good launch shifts the odds toward the middle:** far-left and far-right weights × 0.70, and what they lose goes to mid left, mid right, card hole and jackpot in proportion to their weights (tune). Average candy per pinball rises about 15% on good launches; [07-economy.md](07-economy.md) assumes about one launch in three is good.
- Nothing tells her she missed; a good launch just gets a small sparkle on the bumper.

## What each slot does

| Outcome | Slice 1 | Later |
|---|---|---|
| Far left, far right | Candy | Candy; event items on some events ([09](09-later-modes.md)) |
| Mid left, mid right | Candy (twice the far slots) | Candy; event currency on some events |
| Jackpot | A big candy bonus with fanfare | Opens a jackpot minigame (Raid, Duel, Visit, Feed; [09](09-later-modes.md)) |
| Card hole | A candy bonus | A reward card (Blue, Purple, Gold; [09](09-later-modes.md)) |

All amounts, and how they grow with her level and the multiplier, are in [07-economy.md](07-economy.md). Every payout is multiplied by the launch's multiplier. Each slot's label shows its current candy amount (like the real game's "3000" and "6000"), so the numbers grow visibly as she levels up and switches multiplier.

## Ring bumpers and their gauges

Real game: hits on the top-left bumper fill a gauge that gives a capsule (or pinballs), with a daily cap; hits on the top-right bumper fill a gauge that gives a raid shield.

| Ring | Hits to fill | When full | Slice |
|---|---|---|---|
| **Capsule ring** | 25 (tune); each hit counts as many times as the launch's multiplier, so the ring fills at the same pace per pinball whatever multiplier she plays | A capsule. After the day's cap is reached, a pinball bonus instead. Cap and contents in [07](07-economy.md). | Slice 1 |
| **Shield ring** | 25 (tune) | +1 shield, or nothing if shields are full ([09](09-later-modes.md)). | Later; shown with a small lock until then, and hits don't count |

- Each hit adds 1, whatever the multiplier (tune). So low multipliers fill rings faster per pinball spent, high multipliers pay more per launch: a real choice for her.
- The rim is drawn as 30 segments lighting up one by one; a full ring flashes, pays, and empties.
- The daily cap resets at 4:00 in the morning, local time (the same moment as daily quests in [07](07-economy.md)).

## Multiplier

Real game: a multiplier is picked per launch; it multiplies both the cost and the payout; tiers open by holding enough pinballs; it drops back to the lowest when you run out or relaunch.

- **The toggle appears after her first boss star** ([07-economy.md](07-economy.md)); until then every launch is x1.
- Tapping the toggle steps through the tiers she can use, then wraps back to x1: x1 and x2 always; each higher tier while she **holds** at least its threshold (00: x3 240, x5 360, x10 600, x20 1,200, x40 2,400, x60 4,800, x100 7,200, x150 12,000, x200 18,000).
- Tiers she can't use yet show as locked with the number she needs to hold ("Hold 600 to unlock x10"). Saving up for a tier is meant to be a decision she makes.
- **Stepping down:** if, before a launch, her pinballs fall below the chosen tier's threshold (or below the multiplier itself), the toggle drops to the highest tier she can use. When she reaches 0 pinballs, and whenever the app starts fresh, it goes back to x1.
- A launch costs exactly the multiplier in pinballs and pays every amount times the multiplier.

## Several balls at once

- She can tap PUSH again **0.35 s** after the last launch (tune); up to **6 balls** can be in flight (tune).
- **Holding PUSH** keeps launching one ball every 0.5 s while she has pinballs (ours: the research doesn't say whether the real game has hold-to-repeat or auto-launch).
- Each ball is charged and paid on its own.

## Out of pinballs

- With fewer pinballs than the multiplier, the multiplier steps down; at 0 pinballs PUSH dims.
- Tapping a dim PUSH shows a friendly note pointing to her trees, where math rounds earn pinballs, with a button that goes there ([01-screens.md](01-screens.md), [08-camp.md](08-camp.md)). Never a shop: there is nothing to buy.
- Balls already in flight still land and pay.

## The top bar on this screen

What it shows (placement and style: [01-screens.md](01-screens.md)):
- **Her level** and the **candy bar** filling toward the next level (current / needed, in short numbers like 12.4K / 18K).
- **Pinballs** she holds.
- Later: a row of **shields** ([09](09-later-modes.md)) and the current **event** panel.

## Feedback and animation

Each of these needs a sound and a small animation ([10-art-and-sound.md](10-art-and-sound.md)):
- PUSH pressed (button squashes; plunger springs).
- Ball hits a peg (peg flashes), the swing bumper (sparkle if a good launch), a ring (a rim segment lights).
- Ball enters each kind of slot (far and mid: candy burst; jackpot: big fanfare; card hole: card flip).
- Candy flying into the bar; the bar filling; **level up** (a big moment: "All your critters got stronger!"; level-ups give no items, [07](07-economy.md#level-ups)).
- A ring filling and paying.
- Multiplier changing (the slot labels count up to their new amounts).
- Holding PUSH (a steady rhythm, not a wall of noise).

Big moments (level-up, jackpot, capsule) pause new launches for about a second so they can be seen.

## What is saved

- Pinballs, candy, level and the candy bar are saved after every landing ([11-tech.md](11-tech.md)).
- Ring gauges and the capsule cap count for today are saved.
- The multiplier is not saved: the app always starts at x1, as in the real game.
- A ball in flight when the app closes is paid on the next launch (the outcome was already decided and charged).

## Edge cases

- Several level-ups from one landing (big multipliers): each one is shown in turn, quickly.
- A tier unlocks or locks mid-flight: affects only the next launch.
- A jackpot or card landing while the minigame or card is still showing (later): queued, shown one after another.
- Rapid tapping during a big moment: ignored until the moment ends.

## Tests

- **Odds:** 1,000,000 drawn outcomes match the table within ±0.1 percentage point; same with the good-launch adjustment.
- **Path library:** every outcome has paths at all 24 swing positions; replaying each stored path through the physics ends in the slot it's labelled with; the average ring hits per launch is what [07](07-economy.md) assumes (about 1 capsule-ring hit in 4 launches, tune).
- **Charging:** pinballs never go below 0; a launch at xN takes exactly N and pays exactly N times.
- **Multiplier:** tiers open and close at exactly the thresholds; resets to x1 at 0 pinballs and on a fresh start.
- **Daily cap:** the capsule ring gives at most the cap's worth of capsules per day, then the bonus; resets at 4:00.
