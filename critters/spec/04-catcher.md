# Capsules and the catcher

Where new critters and duplicates come from. A capsule opens a catch session: a claw drops balls that multiply through sliding bars and pour onto a moving belt of critters, and each critter is caught when enough balls land on it. Copied from the real game's catcher, from the user's screenshots and description ([research notes](../research/clash-of-critters.md#the-catcher-confirmed-from-the-users-own-screenshots-and-description)). Words and shared numbers: [00-names-and-numbers.md](00-names-and-numbers.md). Which critters exist: [05-critters.md](05-critters.md).

## Capsules

Real game: capsules come in Green, Blue and Purple (and a Wishbox tier), low to high; a capsule can hold critters, pinballs, card packs or candy.

Ours: a capsule is one catch session. The colour decides how good the belt is.

| Capsule | Belt odds: Common / Rare | Drops | Instead of a session (rare) | Slice |
|---|---|---|---|---|
| **Green** | 90% / 10% | 5 | 10%: a bag of pinballs ([07](07-economy.md)) | Slice 1 |
| **Blue** | 75% / 25% | 5 | 5%: a pile of candy ([07](07-economy.md)) | Slice 1 |
| **Purple** | 50% / 50%, and at least one Rare on the belt | 5 | never | Slice 1 |

- All numbers (tune). Drops stay at 5 for every colour (the screenshots show 5); if Purple sessions feel short, try 6.
- The wish box is not a capsule in ours: it's an item that adds a duplicate to a critter she picks ([05-critters.md](05-critters.md), amounts in [07](07-economy.md)). Later.
- **Where capsules come from** (how many: [07-economy.md](07-economy.md)): the pinball machine's capsule ring ([03](03-pinball-machine.md)), boss stages, chapter rewards, one to start and a welcome gift.
- Capsules wait in her inventory until she opens them, one at a time. They never expire. Where she opens them from: [01-screens.md](01-screens.md).

## A catch session, start to finish

1. She opens a capsule: it pops open (a short animation, its colour clear), and the catcher screen fills its belt.
2. If the capsule held a bonus instead (table above), the bonus flies to her total and that's the end.
3. The claw at the top loads a ball. The button shows **5** drops left.
4. She taps the big button. The claw opens; the ball falls, multiplies through any bars it passes, rolls down the rails into the chute, and pours out onto the belt.
5. When every ball has landed or fallen away, the claw loads the next ball and the drop count goes down by one. The button is greyed while balls are falling.
6. Each critter whose number reaches 0 is caught: it hops off the belt into the crate with a cheer, and its "New!" or "+1" shows.
7. After the last drop's balls are done, a summary shows everything caught this session. Uncaught critters ride off the belt.

## The board

Positions are relative to the catcher's play area: x 0 (left) to 1 (right), y 0 (top) to 1 (bottom), held upright. Measured from the user's screenshots.

| Element | Where (x, y) | Size | Behaviour |
|---|---|---|---|
| **Claw** | centre top (0.50, 0.08) | | Holds one ball; opens to drop it straight down from x 0.50. |
| Help "?" | (0.92, 0.10) | | Shows how the catcher works. |
| **x5 bar A** (yellow) | y 0.20, centre slides x 0.25 ↔ 0.75 | 0.20 wide | Slides with a 3.0 s period (tune). |
| **x5 bar B** (yellow) | y 0.265, centre slides x 0.25 ↔ 0.75 | 0.20 wide | Slides with a 2.2 s period, starting half a cycle off from A (tune). |
| **x20 bar** (red) | y 0.33, centre slides x 0.25 ↔ 0.75 | 0.18 wide | Slides with a 1.6 s period (tune). |
| **x3 bars** (cyan) | y 0.41, fixed at x 0.27 and x 0.75 | 0.20 wide | Don't move; catch balls that spread sideways. |
| **Rails** | from (0.03, 0.53) down to (0.38, 0.60); mirrored on the right | | Funnel every ball into the chute. |
| **Chute** | centre (0.50, 0.62) | 0.24 wide | Holds the balls and lets them out one by one onto the belt below, with a light beam. |
| **Belt** | critters standing at y 0.75 | spacing 0.22, critter target 0.16 wide | Moves left to right and loops. Each critter stands on a pedestal (blue Common, purple Rare) with its number under it. |
| Drop button | (0.50, 0.89) | big and round | Drops left shown under it. |
| Crate button | (0.10, 0.92) | | Opens the crate screen. |

Bars slide smoothly (sine motion), so a ball dropped at a random moment hits each sliding bar about 30% of the time, and good timing hits it nearly every time.

## Balls

**Decision: the catcher runs live, on the game's own simple physics in the rules code ([11-tech.md](11-tech.md)), stepped at a fixed 120 times a second; SpriteKit only draws it.** Unlike the pinball machine, the catcher is a timing game, so what happens must come from what she does, not from a decided outcome. Fixed-step physics in the rules code makes it the same on every iPad and testable without a screen.

- **Falling:** a ball falls under gravity. Balls don't bump into each other. They bounce off the walls and roll along the rails.
- **Multiplying:** when a ball passes through a bar, that ball becomes as many balls as the bar shows (x5 → 5, x20 → 20, x3 → 3), fanning out from the bar's lower edge across ±30°. A ball made by a bar can't be multiplied by that same bar again, but it can pass through another bar below and multiply again (x5 then x20 = 100).
- **Limit:** at most **300 balls** from one drop (tune). Past that, bars light up but make no more balls, so the screen stays readable and fast.
- **The chute:** every ball that reaches the chute joins its queue. The chute lets balls out at a steady **12 a second** (tune), straight down onto whatever is passing beneath. A big burst therefore pours out for several seconds while the belt keeps moving, so it can spread across two or three critters: that's what makes catching several in one drop possible.
- **Landing:** a ball that lands on a critter's target counts that critter down by 1. A ball that lands in a gap between critters falls away. A ball that lands on a critter that has just been caught falls away too.

What the drops tend to make (targets for tuning, checked by the tests below):

| Drop timing | Balls per drop, on average | Critters caught per session (of 5 drops) |
|---|---|---|
| Random | about 10 | about 2 |
| Good (dropping as a bar lines up) | about 25 | about 3–4 |
| Great (x5 then x20 lined up) | 100+ | 5 or more |

## The belt

- **6 critters ride the belt** each session (tune), spaced evenly, looping round as it moves. (The screenshots show about five at a time with more coming in.)
- **Belt speed:** 0.15 of the screen width per second (tune): a critter takes about 1.5 s to pass under the chute.
- **Who rides it:** each of the 6 places is filled by first rolling Common or Rare from the capsule's odds, then picking a critter of that rarity from the catcher pool. Within a rarity every critter is equally likely unless [05-critters.md](05-critters.md) gives one a different `findWeight` (default 1). The same critter can appear twice on one belt.
- **The catcher pool** is every critter [05-critters.md](05-critters.md) marks as catchable, including the four starters (so they can earn duplicates). Critters only won some other way are never on the belt.
- **Balls needed:**

  | Rarity | Balls needed |
  |---|---|
  | Common | 10, ±1 at random (9–11) |
  | Rare | 16, ±1 at random (15–17) |

  Critters always ride the belt in their first form; catching one gives her that critter (or a duplicate of it) whatever form hers has reached. Numbers don't grow with her level (tune if catching gets too easy later).

## Caught, duplicate or missed

- **First of its kind:** "New!", and it joins her collection at its first form with no stars. It's ready to battle at her level ([05-critters.md](05-critters.md)).
- **One she already has:** "+1". It counts as a duplicate, which [05-critters.md](05-critters.md) turns into star progress and, in time, evolution.
- **Not caught by the end:** it rides away; balls already on it are lost. Nothing else is lost (ours: the research doesn't say what the real game does).
- Several critters can be caught from one drop; each gets its own little moment, quickly, in the order they're caught.

## The crate screen

Real game: a "crate" button shows what can turn up.

Ours: the crate button opens a panel showing:
- Every critter in the catcher pool for this capsule colour, grouped Common and Rare, with each one's chance of riding a belt place, as a percentage.
- Critters she hasn't caught yet as dark silhouettes with a "?", so there's something to hope for.
- What she's caught so far this session.

The panel pauses the session (the belt and bars stop) until it's closed.

## Quick Capture and Auto Capture (later)

Real game: at a pinball multiplier of x60 or more, a Quick Capture button appears that claims every critter on the belt at once; a later boss-star upgrade adds Quick Capture and Auto Capture.

Ours, later (Slice 2):
- **Quick Capture** button (bottom right) catches every critter on the belt at once. It appears when the pinball machine's multiplier is set to x60 or more, or once she has the boss-star unlock for it ([07-economy.md](07-economy.md)).
- **Auto Capture** plays the drops for her, dropping each time a bar lines up with the claw.

## Saving and interruptions

- The session is saved when it starts (the belt, each critter's number, drops left) and after each drop finishes ([11-tech.md](11-tech.md)).
- If the app closes mid-drop, the session resumes at the start of that drop with the same belt and the drop not yet used.
- A capsule is only used up when its session starts.

## Tests

- **Belt odds:** over 100,000 rolled belts per capsule colour, the Common/Rare split matches the table within ±0.5 percentage point; Purple belts always have a Rare.
- **Multiplying:** a ball that crosses a bar becomes exactly that many balls; no ball is multiplied twice by the same bar; the 300 cap holds.
- **Counting:** every ball that lands on a critter counts it down exactly once; a critter is caught exactly when its number reaches 0, never twice.
- **Timing targets:** a simulated player dropping at random moments averages about 2 catches per session; one dropping when bar A is under the claw averages 3–4 (both within the ranges above, tune the bar speeds if not).
- **Resume:** closing the app mid-drop and reopening restores the same belt and drops.
