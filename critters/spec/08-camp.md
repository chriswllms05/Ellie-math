# Camp

Her home base: where the pinball trees grow, where her critters live, and the place she makes her own. Words and shared numbers: [00-names-and-numbers.md](00-names-and-numbers.md). Screen layout and buttons: [01-screens.md](01-screens.md). Every amount (tree bonuses, shovels, which boss star opens what): [07-economy.md](07-economy.md).

**Real game:** the camp holds the pinball trees (which fill with pinballs over time), the pinball machine as a building, other buildings (canteen, bento maker, spa, scanner, journals), decorations, and the critters wandering about. It grows tile by tile with boss stars and shovels, and other players raid and visit it.

**Ours:** the same, set in a camp of our own, with one big change: **the trees fill only from math.**

## The setting (ours)

**Mossy Hollow**: a forest clearing with a stream, a little wooden bridge, mossy stones, string lights between the trees, and a big hollow tree stump that Juniper (the guide, [01-screens.md](01-screens.md)) uses as her ranger station. Cozy, green and warm, never spooky. The Grumps come from far off down the battle paths and never come into camp. The look: [10-art-and-sound.md](10-art-and-sound.md).

## The map

- **Seen from above at a slight angle** (3/4 view), drawn on a square tile grid. She pans with one finger and pinches to zoom between 0.75× and 1.5× (tune).
- **Size:** 16 × 20 tiles (tune). At the start, a **6 × 8 clearing** in the middle is open. The rest is wild land (bushes, logs, rocks, tall grass) that opens later.
- **Tile size:** 64 × 64 points at zoom 1 (tune).
- **Fixed places,** which can't be moved:
  - the **pinball shed**
  - the **first pinball tree**
  - **Juniper's stump**
  - the **stream** and **bridge**
  - the **path out to the battle trail**, at the top edge
- **Tapping:**
  - the pinball shed opens the pinball screen
  - a pinball tree starts a math round
  - Juniper's stump shows a bubble from her ("Your trees are ready whenever you are!")
  - the battle trail opens the battle map

## Pinball trees

**Real game:** trees fill with pinballs over time (up to 10 hours' worth each), and a camp can have up to 8.

**Ours:** a tree grows pinballs **only during a math round**. Rounds: [02-math.md](02-math.md).

**How many trees**
- **Slice 1:** one tree.
- **Slice 2:** more trees open on the boss star track, up to 8 as in the real game (which stars: [07-economy.md](07-economy.md)).
- **Every tree runs the same kind of round,** built by the math engine. So an extra tree doesn't add more questions. It adds a **tree bonus**: each tree beyond the first raises the pinballs every round grows (the size of the bonus: [07-economy.md](07-economy.md)). That's our version of the real game's "+1 tree" upgrades.
- **Each new tree** is planted in a spot she chooses on open land.

**What a tree looks like** (tree art: [10-art-and-sound.md](10-art-and-sound.md)):

| State | Looks |
|---|---|
| **Resting** | Full green leaves; a faint sparkle on the branches says "ready for a round". |
| **Growing** (in a round) | Each paying answer pops a pinball onto a branch: a big glowing one with a "+6"-style number for a fast answer, a small one for a slow one. Branches bend a little as they fill. |
| **Combo** | At x2, x3 and x4 the leaves glow brighter and little sparkles drift up. At x4 the whole crown shimmers. |
| **Wrong or "I don't know"** | One leaf flutters down. Nothing is taken off the tree. |
| **Full** (round over) | Heavy with pinballs; a hand pulses: **tap the tree!** |
| **Waiting** (she left partway or the app closed) | It keeps its pinballs and shows them in camp, with a small bouncing arrow over it. |

**The collect moment** is the best part, so it gets the most attention:
1. She taps the tree. It shakes for about 0.4 s.
2. Pinballs rain into a basket at its foot, with a rising "plink-plink-plink" for each one.
3. They then arc from the basket up into the pinball count in the top bar, which rolls up.
4. With Reduce Motion on, the pinballs fade into the basket and the count simply ticks up.

A tree that is **waiting** can be collected from camp with the same tap. Starting a new round at a tree that's still holding pinballs collects them first.

## Critters in camp

**Real game:** your critters wander the camp, and you can tap them.

**Ours:**
- **Who comes out:** up to **12** of her critters (tune) wander at a time: her most recently used team, then her newest catches.
- **What they do,** in a calm loop:
  - **Walk:** a short hop or waddle to a nearby open tile, about every 4–10 seconds (random).
  - **Idle:** breathing, blinking, looking around.
  - **Element moments:** Water critters sometimes splash in the stream; Fire critters warm themselves by a lantern; Grass critters sit in the tall grass; Lightning critters zip in short bursts; Rock critters roll a pebble.
  - **Sleep:** at night (see Day and night), with a little "z".
- **Tapping one:** it hops, a heart floats up, and it makes its sound. Tapping the same critter three times quickly makes it spin.
- **Pressing and holding one:** opens its critter detail page ([01-screens.md](01-screens.md)).
- **They don't walk into water,** buildings or uncleared land, and they find paths around decorations (simple grid pathfinding).

## Decorating · Slice 2

**Real game:** you decorate the camp freely with items earned from play.

**Ours:**
- **Entering:** the **Decorate** button in camp ([01-screens.md](01-screens.md)) turns on build mode. The grid shows faintly, and a tray of her decorations slides up from the bottom.
- **Placing:** she drags an item from the tray onto open, cleared tiles. It snaps to the grid, with a green outline where it fits and red where it doesn't.
- **Changing:** she taps a placed item to get three small buttons: **move** (drag), **flip** (mirror), **put away** (back to the tray).
- **Sizes:** items take 1 × 1, 2 × 1 or 2 × 2 tiles.
- **No cost to move, and nothing is ever lost.** Put-away items wait in the tray.
- **Fixed places can't be moved.** Trees she plants can be moved like decorations.
- **Done** closes build mode.
- **Where decorations come from:** chapter rewards, boss stars, level-ups and (later) event tracks. Which and how many: [07-economy.md](07-economy.md). There's no shop and nothing to buy.
- **First set** (tune): benches, lanterns, flower patches, mushroom stools, a hammock, a pond, picnic blanket, signposts, stepping stones, fences, bushes of each colour, and one statue per element.

## Opening up the land · Slice 2

**Real game:** each boss star unlocks a tile of camp land, and shovels (from boss stages) clear it.

**Ours:**
- The wild land around the clearing is split into **plots** of 2 × 2 tiles.
- **A plot opens** when she reaches the boss star count it needs, and the next plots to open show a small star count on them. The order and counts: [07-economy.md](07-economy.md).
- **Clearing it:** an open plot still has bushes, rocks or logs on it. She taps the plot with a **shovel** to clear it, using one shovel per plot. The bush puffs into leaves, the rock rolls away. Shovels come from boss stages ([07-economy.md](07-economy.md)).
- **Plots spread outward** from the clearing, so the camp always grows as one piece.

## Buildings

| Building | Does | Slice |
|---|---|---|
| **Pinball shed** | Opens the pinball screen | 1 |
| **Pinball tree** (first) | Math rounds | 1 |
| **Juniper's stump** | Guide bubbles; help | 1 |
| **Battle trail** | Opens the battle map | 1 |
| **More pinball trees** | Tree bonus ([07-economy.md](07-economy.md)) | 2 |
| **Canteen** | Feeding critters (rules: [05-critters.md](05-critters.md)) | 2 |
| **Quest board** | Opens daily quests (the side button does too) | 2 |
| **Shield post** | Shows her shields; where raids land ([09-later-modes.md](09-later-modes.md)) | 3 |
| **Trophy shelf** | Event trophies ([09-later-modes.md](09-later-modes.md)) | 4 |
| Bento maker (real game: crafts food) | **Dropped**: food comes straight from rewards ([07-economy.md](07-economy.md)) | never |
| Spa (real game: weekly buffs) | **Dropped** ([09-later-modes.md](09-later-modes.md)) | never |
| Scanner and journals (real game: random critter encounters with story bits) | Maybe later: a critter visits camp and leaves a short note | 5, maybe |

## Day and night · Slice 1

**Real game:** the camp has a day and night cycle.

**Ours:** it follows the iPad's clock.

| Time | Camp |
|---|---|
| 6:00 to 7:00 | Dawn: soft pink light, birds |
| 7:00 to 18:00 | Day: full colour |
| 18:00 to 20:00 | Dusk: warm orange light; the string lights switch on |
| 20:00 to 6:00 | Night: a deep blue tint, lantern glows, slow drifting light specks, stars; critters curl up and sleep, but wake to a tap |

- It's a colour overlay plus light sprites, not separate art.
- Trees and the pinball shed stay fully usable at night.
- With Reduce Motion on, the drifting specks stay still.

## Raids and visits in camp · Slice 3

What raids and visits are: [09-later-modes.md](09-later-modes.md). In camp:
- **After a raid,** the critter that was hit sits dizzy, with circling stars, until she taps it. It springs back with a heart.
- **After a visit,** a little gift box sits by the shed until she taps it.
- The **shield post** shows how many shields she has left.

## Saving

Camp layout, decorations, trees (including pinballs waiting on them), cleared plots and which critters are out all save the moment they change (mechanism: [11-tech.md](11-tech.md)).

## Slice 1 checklist

- [ ] Camp scene with the clearing, stream, bridge, the pinball shed, one tree, Juniper's stump, the battle trail.
- [ ] Pan and pinch zoom within the limits.
- [ ] The tree's states (resting, growing, combo, full, waiting) and the collect moment.
- [ ] Up to 12 critters wandering, tapping, pressing to open detail, sleeping at night.
- [ ] Day and night from the iPad clock.
- [ ] Everything saved immediately.
