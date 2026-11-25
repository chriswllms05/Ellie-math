# 05 · Critters

The critters she collects: who they are, how strong they are, and how they grow through levels, stars and evolution. Shared words and numbers (elements, rarity, forms, starters, levels) are in [00-names-and-numbers.md](00-names-and-numbers.md). How critters are caught is in [04-catcher.md](04-catcher.md); how they fight is in [06-battle.md](06-battle.md); every amount of candy, wish boxes or food is in [07-economy.md](07-economy.md).

No math happens anywhere in this spec.

## What a critter is

Each critter belongs to an **evolution line** (a family): a fixed list of forms (2 for Common, 4 for Rare). She owns each line at most once. Catching it again gives a **duplicate**, which adds star progress instead of a second copy.

What each owned critter stores:

| Field | Meaning |
|---|---|
| `lineId` | Which family (e.g. `sprickle`). |
| `form` | 1 to 4 (T1 to T4). Starts at 1. |
| `stars` | 0 to 84. Starts at 0 when first caught. |
| `dupProgress` | Duplicates collected toward the next star. |
| `trial` | For Rare lines going T2 → T3: not started / active (with progress) / done. |
| `isNew` | True until she opens its card once. |
| `feedStage` | Later (feeding). 0 to 15. |

Its **level is not stored**: every critter is at her shared level (see [00](00-names-and-numbers.md#levels)).

What each line (species) defines, besides its forms, stats and skills below: `catchable` (true for every Slice 1 line, starters included, so they can earn duplicates) and `findWeight` (default 1; how often it turns up in the catcher compared with others of its rarity, [04-catcher.md](04-catcher.md)).

## Stat model

Four numbers matter in battle. Two grow; two are fixed per form.

| Stat | Grows? | Meaning |
|---|---|---|
| **HP** | yes | How much damage it can take before it's knocked out for the rest of the stage. |
| **Attack (ATK)** | yes | Base damage (and base healing) of each hit. |
| **Attack interval** | no | Seconds between attacks. Shown to her as Fast (≤ 1.0 s), Normal (≤ 1.3 s) or Slow. |
| **Reach** | no | How far up the field it can hit, in tiles, and which lanes: its own lane, or its own and the lanes beside it. Shown as Close (1), Short (3), Middle (5–6), Long (7+). |

**HP and ATK** (ours; all factors tune):

```
value = round(base × levelFactor(L) × formFactor(form) × starFactor(stars) × feedFactor(feedStage))

levelFactor(L)     = 1 + 0.10 × (L − 1)            L = her shared level
formFactor(form)   = T1 1.00 · T2 1.40 · T3 1.90 · T4 2.60
starFactor(stars)  = 1 + 0.03 × stars                (84 stars → ×3.52)
feedFactor(stage)  = 1 + 0.02 × stage                (later; 1.00 until feeding exists)
```

`levelFactor` is shared with the Grumps ([06-battle.md](06-battle.md)), so a stage at its recommended level feels the same no matter how big the numbers get. Her real gains come from stars, forms, auras and catching more critters.

Real game: levels from candy are shared by all critters; stars "boost stats significantly"; evolution "is where a critter's real kit appears". The exact formulas aren't published; these are ours.

## Stars (from duplicates)

Copied from the real game's star tiers. Each star needs a number of duplicates; the "total" column is how many duplicates (or wish boxes) it takes from 0 stars.

| Stars | Badge | Duplicates per star | Total by the last star of the tier |
|---|---|---|---|
| 1–6 | Bronze star | 1, 1, 2, 2, 3, 4 | 13 |
| 7–12 | Silver star | 5 each | 43 |
| 13–18 | Gold star | 7 each | 85 |
| 19–24 | Silver moon | 7 each | 127 |
| 25–30 | Gold moon | 7 each | 169 |
| 31–36 | Shimmer moon | 9 each | 223 |
| 37–42 | Gold sun | 9 each | 277 |
| 43–48 | Shimmer sun | 11 each | 343 |
| 49–54 | Red sun | 11 each | 409 |
| 55–60 | Blue crown | 13 each | 487 |
| 61–66 | Gold crown | 13 each | 565 |
| 67–72 | Shimmer crown | 15 each | 655 |
| 73–78 | Ribbon star | 15 each | 745 |
| 79–84 | Winged star | 18, 20, 22, 24, 26, 28 | 883 |

- Real game: the bronze tier needs "1–5" duplicates per star and totals 13; the split above is ours. Everything else matches the research table.
- The badge shows the tier icon with 1 to 6 pips for the star within the tier.
- At 84 stars, more duplicates turn into candy instead (amount in [07-economy.md](07-economy.md)).
- **Slice 1** needs bronze and silver; the table is complete so nothing changes later.

## Evolution

Evolving is a button on the critter's card. It's free and it can't be undone. When a critter evolves it keeps its stars, gains the new form's stat factor and skill, and gets a short celebration (light burst, the old form spins into the new one, its new name appears).

**When a line can evolve** (ours, following the real game's examples: some critters evolve at 1 star, others at 6; the T3 step also needs a trial):

| Rarity | T1 → T2 | T2 → T3 | T3 → T4 |
|---|---|---|---|
| Common | 1 star | — | — |
| Rare | 6 stars | 12 stars **and** its trial | 18 stars |

(tune: 18 stars is 85 duplicates; [07-economy.md](07-economy.md) has to make duplicates and wish boxes common enough that a favourite Rare reaches T4 in a few months, not years.)

### Trials (Rare lines, T2 → T3)

Real game: each critter has two trials; the first is always "feeding level 3 or more", the second depends on its element and mostly uses event items. Only one critter can be on a trial at a time, and you can switch once a day (switching resets progress).

Ours:
- A trial can be started any time the critter is at T2. It finishes when its goal is met; the evolution still needs 12 stars.
- **One trial at a time.** She can switch to a different critter once per day; switching wipes the old trial's progress.
- Progress only counts after the trial starts.
- **Until feeding exists**, the feeding part is skipped. **Until events exist**, each element uses a goal she can reach in the core game:

| Element | Slice 1 trial goal (tune) | Later (with events) |
|---|---|---|
| Grass | Spend 2,000 pinballs in the pinball machine (cost × multiplier counts) | same, or event fertilizer |
| Water | Knock out 300 Grumps with this critter on the team | event fishing rods |
| Fire | Win 10 stages with this critter on the team | event racing items |
| Rock | Land the jackpot 5 times | event energy drinks |
| Lightning | Catch 15 critters in the catcher | event digging |

Because pinballs only come from math, the Grass trial quietly needs math too.

### Auras (T4)

Each T4 critter has an **aura** while it's on the battle team: every critter of its element on the team gets **+15% HP and +15% ATK** (tune). Two T4s of the same element stack (+30%). Real game: T4 forms "carry auras (team-wide passive element buffs)".

## Wish boxes

A wish box adds **1 duplicate** to a critter she already owns and chooses. Used from the critter's card ("Use a wish box"), one at a time or with a "use 5" button when she has 5 or more. Can't be used on a critter at 84 stars. Where wish boxes come from: [07-economy.md](07-economy.md).

## Feeding (later, Slice 2)

Copied from the real game, trimmed:
- Up to **15 feeds a day**, shared across all critters.
- Each critter has a **feed stage** from 0 to 15; each stage gives +2% HP and ATK (the `feedFactor` above).
- Each stage needs feed points (from food) and a minimum star count: stage 3 needs 2 stars, stage 10 needs 36 stars, stage 15 needs 78 stars (real game); stages between are spaced evenly (tune).
- **Common critters stop at stage 10.**
- Food types, amounts and where food comes from: [07-economy.md](07-economy.md) and [09-later-modes.md](09-later-modes.md).

## Glitter variants

Not planned. (Real game: a rare cosmetic recolour.) Revisit after Slice 4 if Ellie wants rare looks.

## The Slice 1 roster

Twelve lines: the 4 starters and 8 more, covering all five elements (two Rock), every role, and both rarities. All twelve can turn up in the catcher, starters included (they need duplicates to evolve); find chances are in [04-catcher.md](04-catcher.md).

Base stats are at level 1, T1, 0 stars (tune). Reach is tiles up the field; "± 1 lane" means it can also hit or help the lanes beside its own.

| Line (id) | Forms | Animal and look | Element | Role | Rarity | HP | ATK | Interval | Reach |
|---|---|---|---|---|---|---|---|---|---|
| `sprickle` | Sprickle → Thornhog | Round hedgehog with leaf spines; grows thorny vine quills and a flower on its head | Grass | Tank | Common | 320 | 10 | 1.4 s | 1, own lane |
| `zapster` | Zapster → Voltamster | Hamster with glowing, sparking cheek pouches; grows a lightning-bolt tuft | Lightning | DPS | Common | 130 | 22 | 1.0 s | 6, own lane |
| `axolittle` | Axolittle → Tidalotl | Pink-and-blue axolotl with frilly gills; the gills become curling waves | Water | Healer | Common | 160 | 10 | 1.3 s | 6, own lane (heals ± 1 lane) |
| `cinderpaw` | Cinderpaw → Blazepanda | Red panda with an ember-tipped tail; the tail becomes flame stripes | Fire | DPS | Common | 140 | 18 | 1.1 s | 5, own lane |
| `cobblemole` | Cobblemole → Quarrymole | Mole in a pebble helmet with big digging claws; later wears a glowing crystal lamp | Rock | DPS | Common | 170 | 24 | 1.6 s | 5, own lane |
| `sparkoon` | Sparkoon → Voltcoon | Raccoon with a lightning-striped tail and goggles; later a crackling mask | Lightning | Specialist | Common | 150 | 14 | 1.2 s | 6, own lane |
| `budsnail` | Budsnail → Bloomsnail | Snail whose shell is a flower bud; the bud blooms into a big flower | Grass | Specialist | Common | 160 | 12 | 1.3 s | 5, own lane |
| `pebbledillo` | Pebbledillo → Rockadillo → Boulderdillo → Titanadillo | Armadillo with stone plates; grows a boulder back, then crystal spikes | Rock | Guardian | Rare | 260 | 8 | 1.5 s | 3, own lane (shields ± 1 lane) |
| `sprigloth` | Sprigloth → Mossloth → Vineloth → Groveloth | Sleepy sloth with mossy fur; grows vines, then a little tree on its back | Grass | Support | Rare | 180 | 12 | 1.3 s | 3, own lane (buffs ± 1 lane) |
| `kindlehorn` | Kindlehorn → Flarehorn → Scorchhorn → Infernohorn | Baby rhino with an ember on its horn; grows a flaming horn and glowing lava-crack armour | Fire | Tank | Rare | 340 | 14 | 1.6 s | 1, own lane |
| `tadpip` | Tadpip → Froglet → Tidetoad → Kingcroak | Tadpole with a bubble crown; grows into a frog, a toad in a lily-pad cape, then a frog king with a water crown | Water | DPS | Rare | 130 | 20 | 1.0 s | 6, own lane |
| `fizzgeck` | Fizzgeck → Voltgeck → Stormgeck → Tempestgeck | Gecko with glowing yellow toe pads; grows a storm-cloud frill, then a lightning crown | Lightning | DPS | Rare | 120 | 18 | 0.9 s | 9, own lane ± 1 |

### Skills

Every critter repeats its **base attack** every interval. Some attacks are special: "every Nth attack" counts its own attacks from the start of the stage (attack 1, 2, 3 …), so it's predictable. Damage and healing numbers are multiples of the critter's current ATK. Projectile types (single, piercing, bounce, area) and status effects (Burn, Slow, Stun, Sleep, Poison, Fragile, Guard, Shield, Knockback) are defined exactly in [06-battle.md](06-battle.md#attacks-and-projectiles).

**Sprickle → Thornhog** (Grass Tank)
- *Prickle Back* (T1): hits the nearest Grump within reach for 1.0 × ATK. Grumps that hit it take back 20% of the damage they dealt. Every 4th attack it curls up and gains **Guard** for 3 s.
- *Thorn Wall* (T2): thorns return 35%. When it curls, the critters directly beside it (same row, lanes beside it) also get Guard for 3 s.

**Zapster → Voltamster** (Lightning DPS)
- *Cheek Spark* (T1): a single bolt, 1.0 × ATK. Every 3rd attack the bolt **bounces** to up to 2 more Grumps (instant, 70% each jump).
- *Pouch Storm* (T2): every 3rd attack bounces to up to 3 more, and the first Grump hit is **Stunned** 0.5 s.

**Axolittle → Tidalotl** (Water Healer)
- *Bubble Mend* (T1): a single bubble, 1.0 × ATK. Every 3rd attack, if any critter in its lane or the lanes beside it is below full HP, it heals the one with the lowest HP % by 3.0 × ATK instead of attacking.
- *Tide Mend* (T2): the heal is 4.0 × ATK and also heals the second-lowest critter for 2.0 × ATK. Its bubbles **Slow**.

**Cinderpaw → Blazepanda** (Fire DPS)
- *Ember Toss* (T1): a single fireball, 1.0 × ATK, that **Burns**.
- *Flare Toss* (T2): the fireball is **area** (radius 1 tile) and Burns everything it hits.

**Cobblemole → Quarrymole** (Rock DPS)
- *Pebble Pitch* (T1): a thrown rock, **area** (radius 0.75 tile, 50% to others), 1.0 × ATK.
- *Rockslide* (T2): every 4th attack is a rockslide that **pierces** its whole lane within reach for 1.2 × ATK and **Knocks back** each Grump 0.5 tile.

**Sparkoon → Voltcoon** (Lightning Specialist)
- *Static Snag* (T1): single, 1.0 × ATK. Every 4th attack **Stuns** the target 1 s.
- *Live Wire* (T2): every 3rd attack Stuns 1 s and makes the target **Fragile**.

**Budsnail → Bloomsnail** (Grass Specialist)
- *Sticky Trail* (T1): a slime shot, single, 0.8 × ATK, that **Slows**. Every 4th attack also **Poisons**.
- *Petal Cloud* (T2): every shot Slows and Poisons. Every 5th attack also releases a pollen cloud (area, radius 1 tile, no damage) that puts Grumps to **Sleep** for 2 s.

**Pebbledillo → Rockadillo → Boulderdillo → Titanadillo** (Rock Guardian)
- *Shell Share* (T1): base attack is a single pebble, 1.0 × ATK. Every 6 s, gives a **Shield** worth 20% of its own max HP (4 s) to the critter with the lowest HP % in its lane or the lanes beside it.
- T2: shield 25%, every 5 s.
- T3: shields go to the 2 lowest critters; it gains Guard for 2 s each time.
- T4 aura *Bedrock*: Rock critters +15% HP and ATK.

**Sprigloth → Mossloth → Vineloth → Groveloth** (Grass Support)
- *Cheery Leaves* (T1): base attack is a single leaf, 1.0 × ATK. Every 6 s, gives critters in its lane and the lanes beside it **+20% ATK** for 4 s.
- T2: +25%, every 5 s.
- T3: also **+15% attack speed** (interval × 0.87) for the same 4 s.
- T4 aura *Greenwood*: Grass critters +15% HP and ATK.

**Kindlehorn → Flarehorn → Scorchhorn → Infernohorn** (Fire Tank)
- *Hot Horn* (T1): a melee horn bump, 1.0 × ATK, that **Burns**.
- T2: every 5th attack is a charge: 1.5 × ATK, **Knockback** 1 tile, Burn.
- T3: the charge hits every Grump within 1 tile (area) and gives it Guard for 3 s.
- T4 aura *Ember Heart*: Fire critters +15% HP and ATK.

**Tadpip → Froglet → Tidetoad → Kingcroak** (Water DPS)
- *Splash Shot* (T1): a water jet that **pierces** its lane within reach, 1.0 × ATK to each Grump.
- T2: reach 7; every 4th jet **Slows** everything it hits.
- T3: every 4th attack is a wide wave: the jet runs up its own lane and both lanes beside it.
- T4 aura *Royal Tide*: Water critters +15% HP and ATK.

**Fizzgeck → Voltgeck → Stormgeck → Tempestgeck** (Lightning DPS)
- *Static Flick* (T1): a long single shot, 1.0 × ATK, at a Grump in its own lane or the lanes beside it.
- T2: every 3rd attack **bounces** to up to 2 more (70% each jump).
- T3: every 5th attack is a lightning strike: area (radius 1 tile), 1.5 × ATK, Stun 0.5 s.
- T4 aura *Thunderhead*: Lightning critters +15% HP and ATK.

### The chapter 1 reward critter

Finishing chapter 1 gives one Rare critter ([07-economy.md](07-economy.md)): a Rare line she doesn't own yet, picked at random; if she owns every Rare, a duplicate of the Rare with the fewest stars.

### First launch

She starts with the four starters at T1, 0 stars, level 1. They are already placed on the battle grid so stage 1-1 can be played straight away (front row: Sprickle in the middle lane; middle row: Zapster left, Cinderpaw right; back row: Axolittle in the middle). The first-launch flow itself is in [01-screens.md](01-screens.md).

## The later roster (outline)

About 30 more lines, added a few at a time in later slices so the catcher keeps surprising her. Names follow the rule in [DESIGN.md](../DESIGN.md#names) (real animal + element sound, one shared sound per family). Roughly a third Rare. Our own animals: no capybaras, pear birds, boars, puppies, octopuses, seals or owls (the real game uses those).

| Element | Line ideas (animal · role · rarity) |
|---|---|
| Grass | mantis · Specialist · Rare; ladybug · Support · Common; fawn · Healer · Rare; koala · Tank · Common; chameleon · Specialist · Common; stag beetle · Guardian · Rare |
| Lightning | zebra foal · Tank · Rare; bumblebee · Support · Common; lemur · DPS · Common; eel · DPS · Rare; cricket · Healer · Common; jellyfish · Specialist · Rare |
| Water | otter · DPS · Common; hermit crab · Guardian · Common; narwhal · DPS · Rare; duckling · Healer · Common; manatee · Tank · Rare; pufferfish · Specialist · Common |
| Fire | firebug beetle · DPS · Common; meerkat · Support · Common; bat · DPS · Rare; yak · Tank · Rare; peacock · Support · Rare; newt · Healer · Common |
| Rock | tortoise · Tank · Rare; mountain goat · Guardian · Common; gorilla · Tank · Rare; horned lizard · Specialist · Common; pika · DPS · Common; badger · Specialist · Rare |

New lines reuse the same stat model, role templates and projectile types, so adding one is data only (forms, look, base stats, skill parameters).

**Role templates** for new lines (L1, T1, 0 stars; tune), adjusted ±15% per critter:

| Role | HP | ATK | Interval | Reach |
|---|---|---|---|---|
| Tank | 320 | 12 | 1.5 s | 1 |
| Guardian | 250 | 8 | 1.5 s | 3 |
| DPS | 130 | 20 | 1.0 s | 5–7 |
| Healer | 160 | 10 | 1.3 s | 6 |
| Support | 175 | 12 | 1.3 s | 3 |
| Specialist | 150 | 14 | 1.2 s | 5–6 |

Rare lines get the bigger skill upgrades at T3 and an aura at T4; Common lines get one upgrade at T2.

## What the critter screens show

Layout and navigation are in [01-screens.md](01-screens.md). Content:

**Roster (all her critters)**
- One tile per owned line: portrait of its current form, current form's name, element icon, role icon, star badge, and a border in its rarity colour (blue Common, purple Rare).
- Badges: **New** (`isNew`), **Can evolve** (meets the star rule, and the trial if needed), **Trial** (its trial is active).
- A tick or outline on critters that are on the battle team.
- Sort: team first, then by element (wheel order), then Rare before Common, then name. Filter buttons by element.
- **Collection count**, e.g. "9 of 12 found", with silhouettes for lines she hasn't caught yet (name hidden until caught).

**Critter card (one critter)**
- Big portrait of the current form, its name, and form pips (●●○○).
- Element, role and rarity, each with an icon and a one-word label.
- Level (her shared level), HP and ATK as numbers; attack speed as Fast / Normal / Slow; reach as Close / Short / Middle / Long plus "+ lanes beside it" where true.
- Skill: name and one or two plain sentences with the real numbers for its current form (e.g. "Every 3rd attack, heals the most-hurt critter nearby by 36").
- Next form: a silhouette and one line of what changes. Rare lines show all four forms as pips.
- Stars: the badge and a bar of duplicates toward the next star ("3 / 5").
- **Evolve** button: bright when ready; otherwise greyed with the reason ("2 more stars", "Finish its trial").
- **Trial** (Rare at T2): goal, progress bar, Start / Switch button (with the once-a-day rule explained).
- **Use a wish box** button (with her wish box count).
- Aura line at T4.
- Later: **Feed** button and feed stage.
