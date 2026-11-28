# 06 · Battle

Copied from the real game: she places critters on a grid, the Grumps walk down the lanes, and the critters fight on their own. **No math in battle** (decided). Shared numbers are in [00-names-and-numbers.md](00-names-and-numbers.md); critter stats and skills in [05-critters.md](05-critters.md); everything a battle pays in [07-economy.md](07-economy.md); navigation between screens in [01-screens.md](01-screens.md).

**Slice 1:** chapter 1 stages 1–10 on the 3 × 3 grid, the five chapter-1 Grump types, the first boss, the battle report, ×2 speed and the easier-after-losses help. **Slice 2:** stages 11–80, chapters 2–4 (5 × 3 from chapter 4), the other bosses and Grumps, Quick Deploy and auto-battle.

## The field

Portrait. Lanes run top to bottom; the deployment grid sits at the bottom.

- **Lanes:** 3 in chapters 1–3, 5 from chapter 4 (real game). Numbered left to right; each lane is 1 tile wide.
- **Rows:** 3 rows of slots at the bottom: **front**, **middle**, **back** (real game: 9 slots, then 15).
- **Distances** are in tiles, measured up the field. `y = 0` is the bottom edge. Slot centres: back row `y = 0.5`, middle `1.5`, front `2.5`.
- **Grumps spawn** at the top, `y = 12`, in the middle of their lane (± 0.15 tile sideways, seeded, so they don't stack exactly).
- **The line:** a Grump that reaches `y ≤ 0` has got through, and she loses the stage.

## Before a battle

### Chapter map (content)

- Stages 1–80 of the current chapter as a path of nodes. Every 10th node is a boss node with the boss's portrait.
- Each node shows its number and, when locked, a lock. Cleared nodes get a tick; the next stage glows.
- Each node shows its **recommended level** (see [Difficulty](#difficulty)).
- Header: chapter number and name, and her boss stars ([07-economy.md](07-economy.md)).

### Formation screen

- **The grid** (3 × 3 or 5 × 3), with each lane's **element badge** at the top of the lane (or nothing for a lane with no element).
- **Her critter tray** along the bottom: every critter she owns, those that counter at least one lane of this stage first.
- **Recommended level** next to her level. If hers is lower, the recommended number turns orange (never red).
- **"?" wave preview**, **Start**, **Back**; later **Quick Deploy** and **Auto** (see [Quick Deploy and auto-battle](#quick-deploy-and-auto-battle)).
- On a boss stage: the boss's portrait, name and element.

### Placement rules

- Any owned critter can go in any slot; each critter once.
- **Drag** from the tray to a slot; drag slot to slot to swap; drag back to the tray to remove. **Tap** a tray critter to put it in the first empty slot (front row first, middle lane first); tap a placed critter to send it back.
- **Start** needs at least one critter on the grid.
- The formation is saved, one for 3 lanes and one for 5, and comes back next battle. Critters she no longer owns can't happen (she never loses critters).
- Critters can't be moved once the battle starts (campaign). Moving mid-fight is a Horde-mode rule ([09-later-modes.md](09-later-modes.md)).

### "Yes!" / "No!" (real game)

While she drags a critter over a slot, and after it's placed:
- If the critter's element **beats** the lane's element, the whole lane lights **green "Yes!"** and the critter shows a thumbs-up.
- If the lane's element beats the critter's, the lane lights **red "No!"** and the critter shows a thumbs-down.
- Otherwise (or the lane has no element) nothing lights.

The badge and the lights teach the element wheel without any words.

### "?" wave preview (real game)

Before the battle it shows wave 1 and every lane's element; during the battle, tapping it pauses and shows the current and next wave. For each wave: the Grump types as icons with counts, which lanes they come down, and how busy it is: **Few** (≤ 3 Grumps), **Some** (4–7), **Lots** (8+).

## During a battle

- She doesn't control anything: critters attack on their own. Buttons: **pause** (resume, restart, leave), **×2 speed** (from stage 1-3; remembered), and **"?"**.
- Top of the screen: stage number, the **timer** as a shrinking bar, and the wave ("Wave 2 of 3").
- HP bars appear over any critter or Grump that has taken damage.
- The game pauses itself when the iPad leaves the app.
- Every number here runs on game time, so ×2 speed changes nothing but how long she waits.

### Waves and the timer (ours; real game doesn't say)

- A stage has 2–4 waves (see the stage tables). Each wave is a list of spawns: a Grump type, a lane and a time after the wave starts.
- **The next wave starts** 3 s after the current wave is cleared, or 25 s after the current wave started, whichever comes first (tune). Slow clearing means waves pile up.
- **Timer:** 90 s for a regular stage, 150 s for a boss stage (tune).

## Grumps

Our own enemies. Round, sulky little zombie-ish creatures: greenish-grey, patched with stitches, droopy eyes, a permanent frown and a "hmmph". Cute, never scary. When knocked out they puff into a small grey cloud and float away. Their element shows as a tint and a prop: Water ones drip, Fire ones wear a smouldering hat, Grass ones are covered in leaves, Rock ones are crusted with pebbles, Lightning ones have hair standing on end with sparks. A Grump with no element is plain grey.

### How Grumps behave

- They walk straight down their lane at their speed.
- **Target:** the living critter in their lane with the highest `y` that is still at or below them (normally the front-most one).
- When `grump.y − target.y ≤ range`, they stop and attack it every interval. Melee range is 0.7 tiles.
- When their target is knocked out they walk on to the next one.
- If their lane has no living critters, they walk to the bottom, and she loses.
- Grumps don't block each other; they overlap slightly.
- A Grump's element is the lane's element unless the stage says otherwise.

### Grump types

Base stats at recommended level 1 (tune). Speed is tiles per second; range in tiles.

| Type | Look | HP | ATK | Interval | Speed | Range | What's special | First appears |
|---|---|---|---|---|---|---|---|---|
| **Shuffler** | The basic Grump | 90 | 10 | 1.5 s | 0.5 | 0.7 | — | 1-1 |
| **Scamper** | Small and quick | 40 | 6 | 1.0 s | 1.0 | 0.7 | Always comes in groups of 3–4 | 1-3 |
| **Lobber** | Carries a bucket of mud | 60 | 12 | 2.0 s | 0.5 | 4 | Stops 4 tiles away and lobs mud (1 s flight) at its target | 1-5 |
| **Buckethead** | Bucket on its head | 150 | 10 | 1.5 s | 0.4 | 0.7 | Its bucket soaks up the first 120 damage (scaled like HP); piercing attacks ignore the bucket | 1-7 |
| **Big Grump** | Twice as tall, very grumpy | 500 | 25 | 2.0 s | 0.35 | 0.7 | Each hit also hits the critter behind its target in the lane (60%) | 1-9 |
| **Mender** | Wears a plaster cast | 80 | 5 | 1.5 s | 0.5 | 0.7 | Heals Grumps within 1.5 tiles for 3% of their max HP per second | chapter 2 |
| **Splitter** | Lumpy, wobbly | 120 | 10 | 1.5 s | 0.5 | 0.7 | When knocked out, splits into 2 Scampers | chapter 2 |
| **Hopper** | Springs on its feet | 100 | 12 | 1.5 s | 0.6 | 0.7 | The first time it reaches a critter, it hops over and lands 1 tile behind it (if that's below the line, it got through) | chapter 3 |
| **Boomer** | Puffed up like a balloon | 120 | — | — | 0.6 | 0.7 | Reaching a critter, it pops for 80 damage (scaled by level) to every critter within 1 tile, any lane, then it's gone | chapter 3 |
| **Digger** | Shovel in hand | 110 | 12 | 1.5 s | 0.7 | 0.7 | Underground (can't be hit) until `y ≤ 5` | chapter 4 |
| **Floater** | Hanging from a balloon | 70 | 10 | 1.5 s | 0.45 | 3 | Close-reach critters (reach 1) can't hit it | chapter 5 |
| **Lidded Grump** | Holds a pot lid | 140 | 8 | 1.5 s | 0.4 | 0.7 | Takes half damage from single shots; full from area, piercing and bounce | chapter 6 |

Boomer's damage is `80 × levelFactor(R)` (no ATK stat).

## Critters in battle

- **Attack timing:** each critter's first attack comes 0.5 s after the battle starts, plus 0.1 s × its slot number (left to right, front to back), so they don't all fire at once. Then every interval.
- **Reach check:** a Grump is in reach if it's in a lane the critter can hit (its own, or ± 1 where its skill says so) and `|grump.y − critter.y| ≤ reach`. Underground and (for reach-1 critters) floating Grumps don't count.
- **Target choice:** among Grumps in reach, the one with the **lowest `y`** (closest to getting through); ties go to the lowest HP, then the earliest spawned.
- **No target:** the attack waits and fires the moment one comes into reach. "Every Nth attack" counts attacks actually made.
- Healing and shielding pick the critter with the lowest HP % in their lanes; if no one is hurt, a healer attacks instead (its count still advances).
- HP resets at the start of every stage.

## Attacks and projectiles

| Kind | How it works |
|---|---|
| **Melee** | Instant hit on the target. |
| **Single** | A shot that flies at 14 tiles/s and homes in. Damage when it arrives. If the target is gone, it hits the nearest Grump within 1 tile of where the target was, or fizzles. |
| **Piercing** | Instant jet or beam up the lane: hits every Grump in that lane from `critter.y − 0.5` up to `critter.y + reach`, once each. |
| **Bounce** | Hits the target, then jumps (instantly) to the nearest Grump within 2 tiles that it hasn't hit yet, in any lane, up to the skill's number of jumps. Each jump does 70% of the previous hit. |
| **Area** | A single shot that splashes when it lands: the target takes full damage; every other Grump within the radius takes the skill's splash share. |
| **Grump mud (Lobber)** | An arc with a 1 s flight; lands where the target critter is. If that critter was knocked out meanwhile, it does nothing. |

## Status effects

| Effect | On | What it does | How long | Stacking | Bosses |
|---|---|---|---|---|---|
| **Burn** | Grump | Loses 10% of the burner's ATK every 0.5 s | 3 s | One Burn at a time; a new one refreshes it and keeps the stronger | Full |
| **Poison** | Grump | Loses 4% of its max HP per second | 4 s | Refreshes | 0.5% per second |
| **Slow** | Grump | Walks 40% slower; attacks 33% slower | 3 s | Refreshes | Half as strong |
| **Stun** | Grump or critter | Can't walk or attack | As the skill says | Refreshes to the longer | Half as long |
| **Sleep** | Grump | Can't walk or attack; wakes when damaged | 2 s | Refreshes | Immune |
| **Knockback** | Grump | Pushed up its lane by the skill's tiles | Instant | — | A quarter as far |
| **Fragile** | Grump | Takes 25% more damage | 4 s | Refreshes | Full |
| **Guard** | critter | Takes 30% less damage | As the skill says | Refreshes | — |
| **Shield** | critter | Soaks up damage before HP | 4 s | A bigger new shield replaces a smaller one | — |
| **ATK up** | critter | +X% ATK | 4 s | Different sources add up, to at most +100% | — |
| **Attack speed up** | critter | Interval × (1 − X) | 4 s | Refreshes | — |

Each effect shows as a small icon over the creature (flame, droplet, snail, stars, "zzz", cracked shell, shield bubble, up arrow).

## Damage

```
hit    = ATK × skillMultiplier × element × (1 + ATK ups) × (Fragile ? 1.25 : 1) × (Guard ? 0.70 : 1)
damage = max(1, round(hit))
```

- `element` = **2** if the attacker's element beats the target's, **0.5** if the target's beats the attacker's, else **1** (none counts as neutral). It works **both ways**: Grumps hitting critters use the same wheel. A Water critter in a Fire lane hits twice as hard and takes half damage.
- Burn, Poison, thorns and Boomer pops ignore elements.
- Healing = `ATK × healMultiplier × (1 + ATK ups)`, never above max HP. Shields absorb damage before HP.
- Thorns (Sprickle line) return a share of each melee hit's damage to the Grump that dealt it.

## Knock-outs, winning and losing

- A critter at 0 HP is **knocked out**: it sits down dizzy with little stars and is out until the next stage. No reviving.
- A Grump at 0 HP puffs into a cloud.
- **Win:** every wave has spawned and every Grump is knocked out.
- **Lose:** a Grump reaches the line, the timer runs out, or every critter is knocked out (real game: the first two).
- Retrying is free and unlimited; there's no stamina (real game).

### After a win

A **Victory!** banner with her critters cheering, the rewards from [07-economy.md](07-economy.md), and **Next stage** / **Back**. The battle hands the economy: chapter, stage, boss or not, first clear or replay, and how many Grumps were knocked out (for quests and trials, see [05-critters.md](05-critters.md#trials-rare-lines-t2--t3)). Replaying cleared stages is allowed; what replays pay is up to 07.

### After a loss: the battle report (real game)

A gentle **"Oh no!"** banner (critters sitting down, a sulky Grump doing a little dance), then the report:
- Which critters were knocked out (greyed portraits).
- Which lanes Grumps got through (a red arrow on each), or "Time ran out".
- **One tip**, picked in this order:
  1. a critter stood in a lane that counters it → "Match elements: look for green Yes!";
  2. a lane was left empty → "Put a critter in every lane";
  3. time ran out → "Bring more attackers";
  4. otherwise → "Level up your critters (this stage suggests level N)".
- **Try again** and **Change team**.

## Difficulty

Each stage has a fixed **recommended level** `R`. Grumps are built at that level, so a stage is always the same stage; she gets past a hard one by growing (more levels from candy, more stars, evolutions, new critters), which sends her back to the pinball machine and so to math rounds.

**R follows the level she's likely to be** when she reaches the stage, from [07-economy.md](07-economy.md#balance-targets), so a typical team wins a boss in one to three tries and most regular stages on the first try:

- **Boss stages, chapter 1:** R = 11, 18, 25, 32, 40, 46, 52, 58 for stages 10 to 80 (07's table).
- **Boss stages, chapter 2 on:** R = 40 + 20 × (chapter − 1) + 2.5 × k, rounded, for the chapter's k-th boss (k = 1 to 8). Chapter 2's bosses run 63 to 80 and chapter 3's 83 to 100, matching 07; after that, 20 more levels a chapter (tune).
- **Regular stages:** a straight line between the boss before (stage 0 of chapter 1 counts as level 1; stage 0 of a later chapter is the previous chapter's last boss) and the boss after, minus 2, never below 1. Chapter 1's first ten: 1, 1, 2, 3, 4, 5, 6, 7, 8, then 11 for the boss.

```
grump HP  = round(base HP  × levelFactor(R) × help)
grump ATK = round(base ATK × levelFactor(R) × help)
```

`levelFactor` is the critters' own formula ([05-critters.md](05-critters.md#stat-model)). If 07's level targets change, these R values change with them; the battle balance tests check both together ([11-tech.md](11-tech.md)).

**Easier after losses** (ours; the real game doesn't do this): after 3 losses in a row on the same stage its Grumps get `help = 0.9`; after 5, 0.8; after 7 or more, 0.7. It resets when she wins that stage. A grown-up setting can turn it off ([02-math.md](02-math.md) holds the grown-up settings). Leaving a battle doesn't count as a loss.

## Bosses

One every 10th stage (real game). The boss comes in the last wave, in the middle lane unless its gimmick says otherwise, with a name card that slides in. Auto-battle never runs a boss stage. Base stats at recommended level 1 (tune).

| Stage | Boss | Element | HP | ATK | Interval | Speed | Gimmick |
|---|---|---|---|---|---|---|---|
| 1-10 | **Mudlump**, a big grumpy heap of mud | Rock | 2,500 | 30 | 2.0 s | 0.25 | Every 8 s it stomps: critters in its lane's front row are Stunned 0.5 s |
| 1-20 | **Puddlesnort**, a sulky puddle shaped like a hippo | Water | 3,000 | 28 | 1.8 s | 0.30 | Every 12 s it sneezes out 3 Scampers into random lanes |
| 1-30 | **Sir Sulksalot**, in a dented pot helmet and saucepan armour | Fire | 3,600 | 32 | 1.8 s | 0.30 | Takes half damage until below 50% HP; then the armour clatters off and it walks 50% faster |
| 1-40 | **Grizzlegrump**, a big mossy bear-shaped Grump | Grass | 4,200 | 34 | 2.0 s | 0.25 | Every 15 s it regrows 10% of its max HP, unless it's Burning |
| 1-50 | **Static Sulk**, frizzy and crackling | Lightning | 4,000 | 30 | 1.5 s | 0.35 | Range 3. Every 12 s it zaps the critter with the highest ATK anywhere: Stun 2 s |
| 1-60 | **The Grumble Twins**, one dripping, one smouldering | Water + Fire | 2,600 each | 26 | 1.8 s | 0.30 | One in each outer lane; when one is knocked out, the other gets +30% speed and ATK |
| 1-70 | **Burrowbelly**, round and always digging | Rock | 5,000 | 36 | 2.0 s | 0.30 | Every 10 s it burrows (can't be hit for 1.5 s) and pops up in another lane, 2 tiles higher |
| 1-80 | **King Crankypants**, wearing a crown two sizes too small | Grass | 6,500 | 40 | 2.0 s | 0.25 | At 66% and 33% HP he stamps his feet, calls 2 Bucketheads into the other lanes and walks 25% faster |

Each early boss is beaten most easily by a starter: Grass beats Mudlump, Lightning beats Puddlesnort, Water beats Sir Sulksalot, Fire beats Grizzlegrump. Static Sulk needs a Rock critter from the catcher.

**Later chapters** reuse these eight in the same order, built at the new recommended level, and swap in new bosses as they're designed (later; ideas: a Grump riding a shopping cart, a Grump choir that slows critters with groaning, a Grump that splits into three when hit hard).

## Chapter 1, stages 1–10 (Slice 1)

Lanes are Left, Middle, Right; each lane's element is listed L / M / R ("–" = no element). Spawns read `Type ×count lane @start (+gap)`, in seconds from the start of the wave. Every Grump takes its lane's element.

| Stage | R | Lanes | Wave 1 | Wave 2 | Wave 3 |
|---|---|---|---|---|---|
| 1-1 | 1 | – / – / – | Shuffler M @0; Shuffler L @4 | Shuffler R @0; Shuffler M @3; Shuffler L @6 | — |
| 1-2 | 1 | Fire / – / – | Shuffler ×2 L @0 (+3); Shuffler M @2 | Shuffler ×2 L @0 (+3); Shuffler M @1; Shuffler R @4 | — |
| 1-3 | 2 | – / Water / – | Scamper ×3 M @0 (+0.6); Shuffler L @3 | Shuffler R @0; Scamper ×3 M @4 (+0.6); Shuffler L @6 | — |
| 1-4 | 3 | Grass / Fire / Water | Shuffler L @0, M @1, R @2 | Shuffler ×2 L @0 (+3); Scamper ×3 R @2 (+0.6) | Shuffler ×2 M @0 (+3); Shuffler L @2; Shuffler R @4 |
| 1-5 | 4 | Rock / – / Lightning | Lobber M @0; Shuffler L @2; Shuffler R @4 | Shuffler ×2 R @0 (+3); Lobber L @2; Scamper ×3 M @5 (+0.6) | Lobber R @0; Shuffler ×2 M @1 (+3); Shuffler L @3 |
| 1-6 | 5 | Water / Grass / Fire | Shuffler ×2 L @0, M @1, R @2 (each +3) | Scamper ×4 L @0 (+0.5); Lobber M @2; Shuffler ×2 R @3 (+3) | Lobber L @0; Lobber R @0; Shuffler ×3 M @2 (+2.5) |
| 1-7 | 6 | Fire / Rock / Water | Buckethead M @0; Shuffler L @2; Shuffler R @4 | Shuffler ×2 L @0 (+3); Buckethead R @2; Scamper ×3 M @4 (+0.6) | Buckethead L @0; Lobber M @1; Shuffler ×2 R @2 (+3) |
| 1-8 | 7 | Lightning / Water / Grass | Shuffler ×2 L @0 (+3); Scamper ×3 M @1 (+0.6); Shuffler R @2 | Buckethead M @0; Lobber L @1; Lobber R @2 | Scamper ×4 R @0 (+0.5); Buckethead L @2; Shuffler ×2 M @3 (+3) |
| 1-9 | 8 | Grass / Rock / Fire | Shuffler ×2 L @0 (+3); Lobber M @1; Shuffler ×2 R @2 (+3) | Buckethead L @0; Buckethead R @1; Scamper ×4 M @3 (+0.5) | **Big Grump** M @0; Shuffler ×2 L @3 (+3); Shuffler ×2 R @5 (+3) |
| 1-10 | 11 | Water / Rock / Fire | Shuffler ×2 L @0 (+3); Shuffler M @1; Shuffler ×2 R @2 (+3) | Scamper ×3 L @0 (+0.6); Lobber M @1; Buckethead R @2 | **Mudlump** M @0; Shuffler L @6, R @6, L @14, R @14 |

1-1 is a gentle first win with her four starters in their starting places ([05-critters.md](05-critters.md#first-launch)). 1-2 shows the first "Yes!": Axolittle (Water) in the Fire lane. 1-5 brings the first Lightning lane, which none of her starters counter.

## Stages 11–80 and later chapters (generated)

Stages after 1-10 are generated from rules, with a fixed seed per stage (`hash(chapter, stage)`), so every stage is the same each time she plays it. The generator should also be able to print a stage as a table like the one above, for checking.

**Waves per stage:** 3 for stages 4–29, 4 from stage 30 (tune). On a boss stage the last wave is the boss wave.

**Wave size.** Each wave gets a budget of points:
```
budget = lanes × (0.9 + 0.03 × s) × (0.85 + 0.15 × w)     s = stage in chapter (1–80), w = wave number   (tune)
```
Grump costs: Shuffler 1 · Scamper 0.4 each (groups of 3–4) · Lobber 1.5 · Buckethead 2 · Big Grump 5 · Mender 2 · Splitter 2 · Hopper 1.5 · Boomer 2 · Digger 1.5 · Floater 1.5 · Lidded Grump 2.

**Which Grumps:** only types unlocked by this chapter (see the types table). Pick weights: Shuffler 3, every other type 1, the chapter's newest types 2. At most one Big Grump per wave, never in wave 1, and not as a regular before stage 1-40. A boss wave gets half a normal budget of escorts.

**Spreading them out:** share the points across lanes as evenly as possible (within 1 point). In each lane, the first Grump starts 0–2 s into the wave and the rest follow every 2.5–3.5 s (seeded).

**Lane elements:** each lane gets no element (20%) or one of the five (80%, evenly). From stage 4 on, at least two different elements across the lanes. On boss stages, the boss's lane has the boss's element. From chapter 2, each Grump has a 15% chance to be a different element from its lane (it shows in its tint); the "Yes!"/"No!" lights still follow the lane's element.

**Bosses:** stage `10 × k` of chapter `c` uses boss number `((c − 1) × 8 + k − 1) mod (number of bosses)` from the boss table.

**Chapter themes** (ours; backgrounds and colours only, no rule changes):

| Chapter | Theme | New Grumps | Lanes |
|---|---|---|---|
| 1 | Meadow Edge | Shuffler, Scamper, Lobber, Buckethead, Big Grump | 3 |
| 2 | Muddy Marsh | Mender, Splitter | 3 |
| 3 | Pebble Canyon | Hopper, Boomer | 3 |
| 4 | Sunny Shore | Digger | **5** |
| 5 | Toadstool Woods | Floater | 5 |
| 6 | Snowdrift Hills | Lidded Grump | 5 |
| 7 | Foggy Fen | (new types later) | 5 |
| 8 | Ember Valley | | 5 |
| 9 | Stormy Plateau | | 5 |
| 10 | Crystal Caves | | 5 |

After chapter 10, themes repeat in new colours. Real game: 120 named chapters; ours has no fixed end.

## Quick Deploy and auto-battle

### Quick Deploy (Slice 2)

Real game: fills the grid with your 15 best critters by strength and element matchups, unlocked after stage 2-79. Ours unlocks after stage **1-30** (tune), because 2-79 is a long way for a third grader. It fills the grid; she can still change anything before **Start**.

1. Power of each critter = `HP × ATK ÷ interval` at its current stats.
2. Score for a critter in a lane = power × **1.5** if it beats the lane's element, × **0.6** if it's beaten, × 1 otherwise.
3. Handle lanes from the busiest (most Grump points in the stage) to the quietest.
4. **Front row:** best-scoring Tank or Guardian per lane; if she has none left, the highest-HP critter.
5. **Middle row:** best-scoring DPS or Specialist.
6. **Back row:** a Healer or Support per lane while she has them, then the best remaining DPS.
7. Never leave a lane empty while any critter is unplaced: if she has fewer critters than slots, put one in every lane's front row first.

### Auto-battle (Slice 2)

Real game: keeps playing the next stage as long as you win; never on boss stages. Ours unlocks after beating the 1-10 boss. An **Auto** switch on the formation screen. While it's on, after a win the next stage starts by itself 2 s later with the same team. It stops after a loss, before a boss stage, when the grid size changes, or when she taps **Stop** or leaves the screen.

### Speed

A **×2** button from stage 1-3 (ours; the real game doesn't say). It stays as she left it.

## For the builder

- The battle runs at a fixed step of 1/60 s of game time and uses only the seeded random numbers above, so a battle can be run without drawing anything (for tests and balance checks). Code structure is in [11-tech.md](11-tech.md).
- All numbers marked (tune) and all Grump, boss and stage tables should live in data, not in code.
