# Economy

Every amount she earns or spends, and how the whole thing is meant to feel over a day, a week and a month. Words and shared numbers: [00-names-and-numbers.md](00-names-and-numbers.md). Every number here is a starting point (tune) unless it says it's copied from the real game.

## Principles

- **Math is the main way to get pinballs.** It replaces the real game's free pinball income (trees that fill while you're away, slow recovery, a free daily gift). The game's other pinball rewards (boss stages, daily quests, chapter rewards, achievements, and later duels and events) stay.
- **Nothing is for sale.** No gems, shop, packs, passes, offers or codes. Every reward is earned in play.
- **Nothing expires and nothing is taken back,** except candy lost to raids later, and even then she never loses a level ([09-later-modes.md](09-later-modes.md)).
- **The multiplier doesn't change the average.** At any multiplier a pinball is worth the same candy on average; higher multipliers mean bigger, faster, more exciting launches, and lower ones fill the capsule ring faster ([03-pinball-machine.md](03-pinball-machine.md)).
- **She can always move forward.** If a battle is too hard, a math round earns pinballs, pinballs level her up, and every critter gets stronger. A wall in battle becomes a reason to do math, never a dead end.

## Every currency and item

| Item | Comes from | Goes to | Slice |
|---|---|---|---|
| **Pinballs** | Math rounds (main source; [02-math.md](02-math.md)); daily quests; boss stages; chapter 1 reward; achievements; capsule ring after the daily cap; Green capsule bonus bags. Later: duels, Horde, Boss Challenge, events ([09](09-later-modes.md)). | Pinball machine launches: 1 × multiplier each. | Slice 1 |
| **Candy** | Every pinball machine slot, the card hole and the jackpot; Blue capsule bonus piles. Later: reward cards, raids, duels, visits, feeds ([09](09-later-modes.md)). | Fills her level bar automatically; extra carries over into the next level. Later: some can be lost to raids. | Slice 1 |
| **Capsules** (Green, Blue, Purple) | Level-ups; the capsule ring; boss stages; chapter 1 reward; one to start. | Opening a catch session ([04-catcher.md](04-catcher.md)). | Slice 1 |
| **Boss stars** | Each boss stage, first time beaten (one each). | Nothing: they unlock the boss star track below, and camp land ([08-camp.md](08-camp.md)). | Slice 1 |
| **Wish boxes** | Chests at stages 40 and 80 of each chapter; the stage 80 boss. Later: events. | A duplicate of the critter she picks ([05-critters.md](05-critters.md)). | Slice 2 |
| **Shovels** | Each boss stage, first time beaten (one each). | Clearing camp land ([08-camp.md](08-camp.md)). | When 08 adds camp land |
| **Shields** | Shield ring; pinball slots ([09](09-later-modes.md)). | Blocking a raid. | Later |
| **Reward cards** | The card hole, from boss star 3 ([09](09-later-modes.md)). | Opened at once for candy or pinballs. | Later |
| **Food** | Boss Challenge and others ([09](09-later-modes.md)). | Feeding ([05-critters.md](05-critters.md)). | Later |
| **Event items** (rods, pickaxes and so on) | Pinball slots during an event ([09](09-later-modes.md)). | That event's minigame. | Later |

## Pinballs from math

The pay rules are canonical in [00](00-names-and-numbers.md#math-pay-the-only-place-math-appears): 3 × combo fast, 1 slow, nothing for wrong or "I don't know"; a perfect 20-question round of facts pays 183.

Income targets (assume 3 rounds a day, about 10 minutes):

| | First week | A month in |
|---|---|---|
| Fast right answers | about 50% | about 75% |
| Slow right | about 30% | about 15% |
| Pinballs per round | about 50 | about 100 |
| From math, per day | about 150 | about 300 |
| From daily quests | 60–90 | 60–90 |
| **Typical day, all sources** | **about 250** | **about 400** |

More rounds earn more, with no limit; that's the point. Fewer rounds slow her down but never stop her.

## Candy

### What the slots pay

Each slot's candy grows with her level. With **base = 10 × 1.04^(level − 1)**, rounded to a whole number:

| Outcome | Candy (× multiplier, × candy boost) |
|---|---|
| Far left, far right | base |
| Mid left, mid right | 2 × base |
| Jackpot (Slice 1 stand-in) | 20 × base |
| Card hole (Slice 1 stand-in) | 10 × base |

Real game: the screenshot shows the mid slots paying twice the far slots (3,000 and 6,000), which this copies.

| Her level | 1 | 5 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Base (far slot at x1) | 10 | 12 | 14 | 21 | 31 | 46 | 68 | 101 | 150 | 222 | 328 | 486 |

**Average candy per pinball** with the canonical odds: about **2.06 × base** on an ordinary launch and **2.39 × base** on a good launch ([03](03-pinball-machine.md#the-launch-timing-trick)); with about one launch in three good, about **2.1 × base**. When reward cards and jackpot minigames replace the stand-ins later, their average value should stay close to 10 × base and 20 × base so these numbers hold ([09](09-later-modes.md)).

**Candy boost** (from boss stars, below) multiplies all candy from the machine: +20% means × 1.2. Each new boost replaces the last (the highest is +50%).

### What a level costs

Candy to go from level L to L + 1 = **(20 + 5 × (L − 1)) × base(L)**, rounded to two significant figures. So a level always costs about (20 + 5 × (L − 1)) ÷ 2.1 pinballs: about 10 at level 1, 31 at level 10, 80 at level 30, 130 at level 50, 250 at level 100. There's no top level.

| Level | 1 | 2 | 5 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Candy to the next level | 200 | 260 | 470 | 930 | 2,400 | 5,100 | 9,900 | 18,000 | 32,000 | 55,000 | 92,000 | 150,000 | 250,000 |
| Pinballs spent to reach this level, in all | 0 | 10 | 52 | 170 | 590 | 1,240 | 2,140 | 3,270 | 4,640 | 6,240 | 8,090 | 10,170 | 12,490 |

(The last row is without candy boosts; boosts bring later levels about 20–50% sooner.)

## Level-up rewards

Every level-up is a moment ([03](03-pinball-machine.md#feedback-and-animation)), and some pay a capsule:

| Level reached | Reward |
|---|---|
| A multiple of 10 | Purple capsule |
| A multiple of 5 (not 10) | Blue capsule |
| Any other even level | Green capsule |
| Odd levels | none |

That's 6 capsules every 10 levels. Real game: a reviewer says candy is used "to unlock gachapon capsules"; we read that as level-up rewards (not confirmed by the research).

## Capsules: all sources

| Source | How many | Colour |
|---|---|---|
| Start | 1 | Blue (her first catch) |
| Level-ups | 6 per 10 levels (above) | Green, Blue, Purple |
| Capsule ring ([03](03-pinball-machine.md#ring-bumpers-and-their-gauges)) | up to **3 a day** | Green 80%, Blue 18%, Purple 2% |
| Capsule ring after the daily cap | none: pays **25 pinballs** instead | |
| Boss stages | 1 each | Blue; the stage 80 boss gives Purple |
| Chapter 1 reward | 13 | 3 Purple, 10 Blue |

Capsule bonuses instead of a session ([04-catcher.md](04-catcher.md#capsules)): a Green capsule's pinball bag is **25 pinballs**; a Blue capsule's candy pile is **50 × base** candy.

## Battle rewards

Real game: regular stages give only progress (they once gave 3 pinballs); a boss stage gives 1 boss star, 30+ pinballs and a shovel, sometimes wish boxes (the chapter's last boss paid 240 pinballs and 3 wish boxes); chests at stages 40 and 80 give 5 wish boxes each; finishing chapter 1 gives a big one-time chest.

| Stage | First win | Slice |
|---|---|---|
| Regular stage | Nothing but the next stage (copied; if battles feel unrewarding, try 3 pinballs per first win) | Slice 1 |
| Boss stage 10, 20, 30, 40, 50, 60, 70, 80 | 1 boss star, 1 shovel, 1 capsule (above), and pinballs: **30, 40, 50, 60, 80, 100, 150, 240** | Slice 1 has stage 10 only |
| Boss stage 80 | also 3 wish boxes | Slice 2 |
| Chest at stage 40 | 5 wish boxes | Slice 2 |
| Chest at stage 80 | 5 wish boxes | Slice 2 |
| **Finishing chapter 1** (once) | 1,000 pinballs, 3 Purple and 10 Blue capsules, one Rare critter ([05](05-critters.md) picks which), one decoration ([08](08-camp.md)) | Slice 2 |
| Later chapters' bosses | pinballs × (1 + 0.25 × (chapter − 1)), rounded to 5 | Slice 2 |

- Winning a stage again pays nothing more.
- Losing costs nothing; Grumps defeated still count toward daily quests (copied).

## Boss star track

Real game: 601 boss stars; each unlocks a piece of camp land, and the first 14 each unlock an upgrade, then one every 2 stars. Ours keeps the real track's order, trimmed to what our game has, and adds a slice to each.

| Boss star | Unlocks | Slice |
|---|---|---|
| Every star | +1 piece of camp land ([08](08-camp.md)) | as 08 says |
| 1 | The multiplier toggle ([03](03-pinball-machine.md#multiplier)) | Slice 1 |
| 3 | Reward cards from the card hole ([09](09-later-modes.md)) | Slice 3 |
| 4 | Card boost: more candy from Blue cards | Slice 3 |
| 5 | Raid rewards up | Slice 3 |
| 7 | Duel rewards up | Slice 3 |
| 8 | Feeding ([05](05-critters.md)) | Slice 2 |
| 9 | Candy boost +20% | Slice 2 |
| 10 | Candy boost +30% | Slice 2 |
| 11 | Gold reward cards | Slice 3 |
| 12 | Card boost up | Slice 3 |
| 14 | Raid rewards up | Slice 3 |
| 15 | Auto feeder | later |
| 16 | Duel rewards up | Slice 3 |
| 18 | Candy boost +40% | Slice 2 |
| 28 | Candy boost +50%, and Quick Capture ([04](04-catcher.md#quick-capture-and-auto-capture-later)) | Slice 2 |
| 70 | One more shield allowed | later |

**More pinball trees** (Slice 2): a second tree at boss star 2, then one more at stars 6, 13, 20, 30, 45 and 60, up to 8 trees as in the real game. Every tree runs the same math round ([08-camp.md](08-camp.md)); each tree beyond the first adds a **tree bonus** of **+5%** to the pinballs every round grows (tune; 8 trees = +35%). The balance targets below assume it, and the balance simulation must include it.

Left out of the real track: critter badges (no badge challenge yet), pinball recovery (math replaces idle income), and pinball storage (there's no cap on pinballs).

Until boss star 3, the card hole pays its Slice 1 candy bonus; until the jackpot minigames exist, the jackpot does too.

## Daily quests

Real game: 3 quests a day, 30 pinballs each, like "Shoot 100 pinballs", "Clear 30 zombies", "Complete a raid".

Ours: **3 a day, 30 pinballs each**, starting the day after her first launch. New quests at **4:00 in the morning**, local time. Unfinished ones simply go away; nothing is lost. Quests never ask for math: math only shows up as the pinballs she earns.

| Quest | Slice |
|---|---|
| Shoot 50 pinballs (pinballs spent; 100 from level 30) | Slice 1 |
| Win 2 battle stages | Slice 1 |
| Defeat 30 Grumps (losses count too) | Slice 1 |
| Catch 3 critters | Slice 1 |
| Open 2 capsules | Slice 1 |
| Level up once | Slice 1 |
| Make 10 good launches ([03](03-pinball-machine.md#the-launch-timing-trick)) | Slice 1 |
| Do a raid / a duel | Slice 3 |
| Get a Purple or Gold reward card | Slice 3 |

Each day's three are different from each other and are always possible that day.

## Achievements

One-time, paid in pinballs (real game: 20–50 each).

| Achievement | Pinballs |
|---|---|
| Finish your first math round | 20 |
| Reach a x4 combo | 30 |
| First catch | 20 |
| Catch 10 / 50 / 200 / 500 critters | 20 / 30 / 40 / 50 |
| Catch 3 critters from one drop | 30 |
| Hit the x20 bar in the catcher | 20 |
| Land the jackpot | 20 |
| Reach level 10 / 25 / 50 / 100 | 20 / 30 / 40 / 50 |
| Beat the boss at stage 10 / 40 / 80 | 20 / 30 / 50 |
| Own a critter of every element | 30 |
| First evolution | 50 |

## Day 1: what she starts with

| Item | Amount |
|---|---|
| Level | 1 (empty candy bar) |
| Pinballs | 50, so she can try the machine before her first round ([01-screens.md](01-screens.md) decides the order) |
| Critters | the four starters, first form, no stars ([05-critters.md](05-critters.md)) |
| Capsules | 1 Blue |
| Multiplier | x1 (toggle hidden until boss star 1) |
| Shields | none until shields exist; then 5, as in the real game ([09](09-later-modes.md)) |

## Balance targets

What a typical month looks like with about 10 minutes of math a day (3 rounds), answers improving from about 50% fast to about 75%:

| | Day 1 | Day 7 | Day 14 | Day 30 |
|---|---|---|---|---|
| Math rounds, in all | 3 | about 21 | about 42 | about 90 |
| Pinballs earned, in all | about 250 | about 1,900 | about 5,500 | about 11,500 |
| Her level | about 12 | about 35 | about 65 | about 100 |
| Capsules opened, in all | about 10 | about 35 | about 75 | about 130 |
| Critters caught, in all | about 25 | about 85 | about 190 | about 325 |
| Battle | boss 10 beaten (day 1–2) | about stage 40 | chapter 1 done (about day 12) | chapter 3 done |
| Boss stars | 1 | about 4 | about 8 | about 24 |

**For battle tuning ([06-battle.md](06-battle.md)):** the level she's likely to be when she reaches each chapter 1 boss. A typical team at that level should win the boss in one to three tries; the regular stages between should be won on the first try most of the time.

| Chapter 1 boss at stage | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 |
|---|---|---|---|---|---|---|---|---|
| Her level by then | 11 | 18 | 25 | 32 | 40 | 46 | 52 | 58 |
| About which day | 1–2 | 2–3 | 4 | 6 | 8 | 9 | 10–11 | 12 |

Chapter 2's bosses fall between levels 60 and 80, chapter 3's between 80 and 100 (the 5-lane grid arrives in chapter 4).

## Left out from the real game

Paid there, so simply not in ours: premium gems and everything bought with them; the shop and its packs; battle pass, monthly pass, growth fund, club store; pop-up offers; redeem codes; buying wish boxes or silver bricks.

Free there, but replaced by math: pinball trees' idle income, the pinball recovery timer, the free daily gift, and the pinball storage cap.

Needs real players there, so not in ours: being visited for pinballs, team rankings, leaderboards against strangers.

## How to check the balance

In the rules code's tests ([11-tech.md](11-tech.md)), with a fixed random seed so results repeat:

- **Odds and averages:** over 1,000,000 launches, average candy per pinball is 2.06 × base (ordinary) and 2.39 × base (good), within 1%.
- **A simulated month:** a "typical Ellie" (3 rounds a day; each answer fast, slow, wrong or "I don't know" at the rates above, improving day by day; combos worked out by the real pay code; spends every pinball, a third of launches good; opens every capsule with a catcher model that averages 2.5 catches; finishes 2 of 3 quests a day; wins a stage once her level reaches the table above). Run 1,000 seeds. The middle results at days 1, 7, 14 and 30 should be within 20% of the balance targets.
- **Other kinds of player:** a light player (2 rounds a day, 40% → 60% fast) still levels up at least every other day in week 4; a keen player (6 rounds a day, 70% → 90% fast) stays under level 160 at day 30.
- **Never negative, never stuck:** no currency ever goes below 0, and in every run a math round is always available.
