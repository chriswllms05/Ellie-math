# Art and sound

How the game looks and sounds, every Slice 1 asset, and how the art gets made. Words and shared numbers: [00-names-and-numbers.md](00-names-and-numbers.md). Which critters exist and what they look like: [05-critters.md](05-critters.md). Which Grumps and bosses exist: [06-battle.md](06-battle.md). How sprites and sound are loaded and played: [11-tech.md](11-tech.md).

**Real game:** cute and cozy. Thick dark outlines, flat bright colours, chunky rounded lettering, round blushing chibi animals, a purple-and-gold arcade cabinet, and a camper van in a forest.

**Ours:** the genre's conventions (round, cute, outlined, bright), with **our own setting, palette, cabinet, catcher, items and characters.** Nothing traced, copied or closely imitated from the real game.

## Setting and mood

**Mossy Hollow** ([08-camp.md](08-camp.md)): a forest clearing with a stream, string lights and wooden things built by hand. It's a little storybook, a little summer camp. It's warm in the day and twinkly at night, and never spooky.

Our versions of the real game's things:

| Thing | Ours |
|---|---|
| Pinball machine | A **wooden treehouse cabinet**: carved wood frame, vines and string lights, a brass top sign. The playfield backdrop is a dusk sky over the hollow. Pegs are little brass acorn-caps. The slots are wooden cups. PUSH is a big round **moss-green** button. The multiplier is a wooden sign that flips. |
| Pinballs | **Pinball berries**: glossy marbles with a teal-to-pink swirl and a tiny leaf. They grow on the trees, so they look like fruit. |
| Candy | **Gumdrops**: rainbow sugar drops with a sparkle. |
| Capsules | **Acorn capsules** in green, blue and purple that crack open. |
| Catcher | **The Critter Crane**: a greenhouse-glass case with a copper claw on a rope pulley. The multiplier bars are wooden planks with painted numbers (x3 teal, x5 butter yellow, x20 coral). The rails are hollow branch troughs, and the chute is a wooden hopper. The belt is a mossy log conveyor carrying **flowerpots** as pedestals (blue pots for Common, purple pots with a star for Rare), each with a little wooden number tag. |
| Battle field | Grassy forest paths running up the screen, one per lane, with the critters' grid at the bottom on a mossy patch. |

## Palette

Outlines are **deep bark brown (#3B2A20), not black**, which keeps everything soft.

| Name | Hex | Use |
|---|---|---|
| Moss | #5DAA5A | grass, the PUSH button, "go" buttons |
| Leaf | #9ED36A | highlights, light grass |
| Bark | #7A5236 | wood, frames |
| Cream | #FFF4DC | panels, cards |
| Sky teal | #4FC3C9 | sky, x3, calm buttons |
| Butter | #FFD45C | gold, x5, stars |
| Coral | #FF7A6B | x20, alerts, "Grow pinballs" accents |
| Plum night | #3A3266 | night tint, dark panels |

| Element | Colour | Icon |
|---|---|---|
| Grass | #58B947 | leaf |
| Fire | #F26B3A | flame |
| Water | #3A9FE0 | droplet |
| Lightning | #F7C531 | bolt |
| Rock | #A58C6F | pebble stack |

| Marking | Colour |
|---|---|
| Common | blue #4A90E2 |
| Rare | purple #9B59D0 |
| T2 form | gold #F4C430 |
| T3 form | red #E8474C |
| T4 form | rainbow gradient |

Elements always show their **icon** as well as their colour, so they never depend on colour alone.

## Critters

**Every critter:**
- **Shape:** chibi, with the head about as big as the body, big shiny eyes, rosy cheeks, short limbs, and a soft, round outline.
- **One real animal and one element idea,** readable from the silhouette alone. For example, a hedgehog with leaf spines, or a red panda with an ember tail.
- **The animals are ours.** The real game uses capybaras, pear birds, boars, puppies, octopuses, seals and owls, so we don't ([05-critters.md](05-critters.md)), and nothing resembles a Pokémon either.

**Silhouette rules by element:**

| Element | Shapes |
|---|---|
| Grass | rounded with leaf tufts, sprouts, petals, vines |
| Fire | pointed flame tufts, flame-tipped tails, warm stripes |
| Water | fins, frills, smooth curves, droplets, bubbles |
| Lightning | zigzag tufts, spiky fluff, glowing pads or cheeks |
| Rock | chunky, blocky plates, pebbles, crystals |

**How forms grow:**

| Form | Looks | Size in battle (tune) |
|---|---|---|
| T1 | a baby: biggest head, tiny element feature | 0.8 × |
| T2 | taller and bolder; the element feature doubles | 1.0 × |
| T3 | armour, pattern or a prop; a confident stance | 1.1 × |
| T4 | grand, with a rainbow trim line; the aura glow is drawn in code | 1.2 × |

Each line's looks are described in [05-critters.md](05-critters.md#the-slice-1-roster).

## Grumps

**Silly-grumpy, never scary.**
- **Body:** round, rubbery, potato-shaped, with stubby legs, a heavy unibrow, a droopy frown and half-closed sleepy eyes.
- **Colour:** dull lilac-grey and sage.
- **Clothes:** mismatched socks and a slightly too-small hat.
- **Movement:** they waddle.

**Element Grumps** wear one thing that shows their element, drawn as a separate layer on the same body:

| Element | Accessory |
|---|---|
| Fire | a candle hat |
| Water | a dripping bucket hat |
| Grass | weedy hair |
| Rock | a pebble helmet |
| Lightning | frizzy static hair |
| No element | a plain beanie |

**Bosses** are big Grumps in a job costume (who they are: [06-battle.md](06-battle.md)).

**When a Grump is beaten,** it poofs into a dust cloud and floats off as a tiny cloud with a "hmph".

**Never** teeth, blood, rot, wounds, red glowing eyes, or anything a seven-year-old would find creepy.

## Juniper (the guide)

A young camp ranger: a big floppy moss-green hat, freckles, a satchel, rolled-up sleeves and a friendly grin. **Three poses:** wave, point, cheer. She appears beside a speech bubble ([01-screens.md](01-screens.md)).

## UI style

- **Buttons:** chunky rounded rectangles (corner radius 20 pt) with a 3 pt bark outline and a 4 pt darker "ledge" under them. When pressed, a button squashes down 4 pt and the ledge vanishes.
  - **Primary:** moss with cream text. **Secondary:** cream with bark text. **Attention:** coral.
- **Panels:** cream with a wood frame and soft inner shadow.
- **Numbers:** big, with monospaced digits so counts don't jiggle.
- **Icons:** our own simple drawings in the same outline style. SF Symbols are used only in the grown-up view.
- **Tap targets** are at least 60 × 60 pt; number keys are 80 pt ([02-math.md](02-math.md)).

## Fonts

Both are bundled in the app, under the SIL Open Font License (free to use and ship):
- **Lilita One:** headings, button labels, big numbers on badges.
- **Nunito** (Bold and ExtraBold): body text, speech bubbles, the math question and the number pad, with monospaced digits.

## Animation

Most motion is **done in code** (SpriteKit actions), so each critter needs only a few drawn frames.

| Motion | How |
|---|---|
| Idle breathing | scale Y 1.00 ↔ 1.04 over 1.2 s, looping, with a random start |
| Blink | swap to the blink frame for 0.12 s, every 2–5 s |
| Hop / walk in camp | move along an arc with a squash on landing |
| Attack | lunge 6 pt toward the target with the attack frame, then back |
| Hit | white flash for 0.1 s and a 4 pt knock back, with the hit frame |
| Faint | the faint frame, tilt, circling stars, fade to 40% |
| Evolution | glow, white silhouette, grow, burst, new form ([01-screens.md](01-screens.md)) |
| T4 aura | a soft looping particle glow |

## How the art gets made

The real game's art isn't used, traced or fed to an image tool as a reference.

**Recommendation for Slice 1: placeholder art first, final critter art alongside it.**
1. **Placeholders from day one.** Simple vector shapes drawn in code or as quick SVGs: a circle body in the element colour, eyes, the element icon on its belly, and a T1/T2 badge. Grumps as grey ovals with a unibrow. Wooden boxes for the cabinet. The whole game can be built and tested with these, so building never waits for art. Every sprite is loaded by a **fixed asset name**, so final art replaces a placeholder by dropping in a file of the same name.
2. **Final art: generate, then clean up.** Generate designs with an image tool, using one fixed style description (the rules above) and a style sheet of the first good critter as the reference for the rest. Then clean up each design by hand in a drawing app (Procreate, Affinity, Figma): even outline thickness, flat colour, transparent background, consistent proportions. Export at 3× the point size.
   - **Order:** the 12 Slice 1 critters (T1 and T2) first, since they're what she'll care about most; then Juniper, the Grumps, the cabinet and the crane; then everything else.
3. **Other routes, if wanted:**
   - **Hire an illustrator:** the most consistent result, but it costs money and takes weeks.
   - **Ellie draws a critter:** it gets cleaned up and joins the game, which makes a lovely surprise for a later slice.

**Files:**
- **Sprites:** PNG with transparency, in sprite atlases in the asset catalog.
- **Icons and UI pieces:** PDF vectors where possible.
- **Resolution:** iPads draw at 2× (@2x), so ship @2x. Keep the source art at 3× or vector, for zooming in camp and in case the art is reused later.
- **Names:** `critter_<line>_t<form>_<pose>` (for example `critter_sprickle_t1_idle`), `grump_<type>_<pose>`, `fx_<name>`, `ui_<name>`, `camp_<name>`, `pinball_<name>`, `catcher_<name>`.

## Slice 1 asset list

Sizes are in points (pixels = 2 × points on iPad).

**Critters** (12 lines from [05-critters.md](05-critters.md); T1 and T2 only in Slice 1, so 24 forms)

| Asset | Size | Frames |
|---|---|---|
| Battle sprite, per form | 96 × 96 | idle, blink, attack, hit, faint (5) |
| The same sprite in camp and catcher | 64 and 80 (scaled) | reuses the battle frames |
| Portrait, per form (detail page, New critter, Evolution) | 320 × 320 | 1 |
| Silhouette (not caught yet; next form) | | made in code by tinting the portrait dark |
| A sound per line | | see Sound |

Total: 120 small frames and 24 portraits. T3 and T4 for the five Rare lines come in Slice 2; until then the line shows "?" for those forms.

**Grumps** (types and bosses: [06-battle.md](06-battle.md))

| Asset | Size | Frames |
|---|---|---|
| Body, per Grump type | 88 × 88 | walk A, walk B, attack, hit (4) |
| Element accessories (5 + beanie) | fits the body | 1 each, a separate layer |
| Chapter 1 boss | 200 × 200 | idle, attack, hit, special (4) |
| Poof cloud | 96 × 96 | 4 |

**Battle**

| Asset | Size | Notes |
|---|---|---|
| Chapter 1 field background | 1024 × 1366 | aspect-fill; covers every iPad size |
| Lane divider, lane element tint | tileable | tint made in code |
| Grid slot | 88 × 88 | empty, filled, selected |
| Yes! / No! badge with thumbs | 120 × 56 | 2 |
| Projectile per element | 24 × 24 | 5 |
| Water jet (pierce), bolt (bounce), rock (area) | strips / 32 × 32 | 3 |
| Area burst per element | 96 × 96 | 3 frames each |
| Heal bubble, shield bubble, buff sparkle | 48 × 48 | 2 frames each |
| Status icons (Burn, Slow, Stun, Sleep, Poison, Fragile, Guard, Shield, Knockback) | 24 × 24 | 9 |
| Wave preview panel, timer, wave counter | | UI kit |
| Victory and Defeat banners | 640 × 220 | 2 |
| Critter tray card | 104 × 120 | 1 |

**Pinball machine** (layout: [03-pinball-machine.md](03-pinball-machine.md))

| Asset | Notes |
|---|---|
| Cabinet frame | full width, sized to the board |
| Playfield backdrop | dusk sky |
| Peg | 24 pt, unlit and lit |
| Swing bumper (moving) | 1 + sparkle |
| Capsule ring and shield ring | rim segments unlit / lit, centre icon; shield ring greyed in Slice 1 |
| Card cup rails and hole | 1 |
| Slot cups | 5 cups, a gumdrop icon (small and big pile), a jackpot star icon |
| Posts between slots, plunger | 1 each |
| PUSH button | normal, pressed, disabled, and the "Grow pinballs" version |
| Multiplier sign | wooden sign; the tier is drawn in the font |
| Pinball berry | 28 pt, plus a short trail |

**Critter Crane** (layout: [04-catcher.md](04-catcher.md))

| Asset | Notes |
|---|---|
| Glass case frame and backdrop | 1 |
| Claw | closed (holding a berry), open; pulley rope tileable |
| Multiplier planks x3, x5, x20 | idle and lit |
| Branch rails, hopper chute, light beam | 1 each |
| Log conveyor segment | 64 pt tileable, scrolled in code |
| Flowerpots (blue Common, purple Rare) and number tag | 1 each |
| Drop button | ready, pressed, disabled, with a drops-left counter |
| Crate button, three how-to pictures | 1 each |
| Acorn capsules, green / blue / purple | closed, cracking, open (3 each) |

**Camp** ([08-camp.md](08-camp.md))

| Asset | Size |
|---|---|
| Ground tiles: grass, path, dirt, stream edges (autotile set) | 64 × 64 each |
| Water | 64 × 64, 4 frames |
| Bridge | 2 × 1 tiles |
| Pinball shed | 2 × 2 tiles |
| Pinball tree, with resting and glow states and anchor points for berries | 2 × 2 tiles (and drawn at 600 pt wide for the math round) |
| Juniper's stump, battle trail sign | 2 × 2, 1 × 1 |
| Wild props: bush, log, rock, tall grass | 1 × 1 |
| String lights (off/on), lantern | 1 each |
| Day and night | colour overlays made in code; light specks are particles |

**Math round** (layout: [01-screens.md](01-screens.md), [02-math.md](02-math.md))

| Asset | Notes |
|---|---|
| Number key | 80 × 80, normal and pressed |
| Question card, "I don't know" button, ✕ | UI kit |
| Combo meter | x1, x2, x3, x4 states |

**UI kit**

| Asset | Notes |
|---|---|
| Top bar | level badge, candy bar frame and fill, pinball icon, green + |
| Bottom bar icons | Camp, Critters, Pinball, Battle, Challenge (locked); normal and selected |
| Signs and arrows | BOSS sign, back arrow, ✕, gear |
| Buttons | 3 sizes × primary / secondary / attention |
| Panels and frames | panel frame, card frame, rarity frames (blue, purple) |
| Badges | element icons (32 and 64 pt), role icons (6), star icons (bronze, silver), form badges T1–T4 |
| Rewards | gumdrop icon, boss star icon |
| Juniper | 3 poses, 200 × 260 |
| Speech bubble, pointing hand | 1 each |
| Particles | confetti, sparkle, plink |
| Title logo | **Critter Math**, in Lilita One with a pinball berry for the dot of the i |
| App icon | 1024 px: a pinball berry and a starter critter, on moss green |

## Later slices (summary)

| Slice | New art |
|---|---|
| 2 | T3 and T4 forms of the Rare lines; chapter 2–4 fields; more trees; about 25 decorations ([08-camp.md](08-camp.md)); canteen, quest board; food icons, wish box, shovel, trial badges; Quick Deploy and Auto Battle buttons |
| 3 | 6 neighbour portraits and their camps (built from the camp kit); raid rings and blasts; shield bubble and shield icons; duel crates; feed board, cookie blocks and pieces; reward cards in blue, purple and gold; jackpot wheel |
| 4 | Grump Rush board and energizer icon; 10 chips in 3 colours; challenge bosses; event panel; fishing (20 fish, rods, bait, the yellow bar); treasure hunt (board, treasures, keys, chest); trophy shelf and trophies |
| 5 | race, shooter and garden events; about 30 more critter lines ([05-critters.md](05-critters.md)) |

## Sound

**Rules:**
- Everything is gentle. **No buzzer, ever.** Wrong answers and defeats get soft, friendly sounds.
- Every sound has a **visual partner**, so the game makes sense with sound off.

**Sources:** effects and music that are free to use and ship offline:
- **Effects:**
  - [Kenney](https://kenney.nl/assets?q=audio) audio packs (CC0; their Interface, Impact and Casino packs suit the pinball machine).
  - Freesound filtered to CC0.
  - OpenGameArt CC0.
  - Little blips made with a free generator (jsfxr or ChipTone).
- **Music:** CC0 or no-attribution libraries (check each track's licence and note it in a credits file), or commission a couple of loops.

**Formats:**
- **Effects:** `.caf`, 44.1 kHz, mono.
- **Music:** `.m4a` AAC stereo, looping cleanly.
- **Total audio** under about 30 MB.

**Playback:** how sound is played is in [11-tech.md](11-tech.md). It respects the iPad's silent setting and mixes with other audio. Music and sound effects each have their own on/off ([01-screens.md](01-screens.md)).

**Slice 1 effects:**

| Area | Sounds |
|---|---|
| Pinball | PUSH thump; plunger spring; peg tick (5 pitches, random); swing bumper boing; ring segment (notes rising as the ring fills); ring full + capsule pop; candy landing (small, big); jackpot fanfare; card hole thunk; multiplier step (pitch rises per tier); "not enough pinballs" soft pff |
| Catcher | claw whir, claw open clack; plank pass whoosh + multiply pops (capped so 100 balls don't deafen); rail rattle (soft loop); hopper drop; ball on critter boing (pitch rises as its number nears 0); caught jingle + the critter's sound; belt hum (quiet loop); session end |
| Critters | one short chirp per line (12), made from cute vocal sounds, pitch-shifted per line; level-up fanfare; star twinkle; new critter fanfare; evolution whoosh and chime |
| Battle | an attack per element (5) and pierce / bounce / area variants; Grump hit squish; Grump poof + "hmph"; Grump reaching the bottom (gentle honk); critter faint (soft slide down); heal sparkle; shield bubble; buff chime; wave start (soft horn); last 10 seconds (soft tick); boss entrance (silly rumble); victory jingle; defeat (gentle tune) |
| Math | key tap; ✓; right and fast (bright chime that steps up a note with each combo level); right but slow (soft chime); wrong (low, soft bloop); "I don't know" (neutral page flip); combo up (rising sparkle); combo down (small soft blip, not sad); tree shake rustle; berries raining (plink series); count rolling up |
| UI | tap, back, panel open/close, toggle, overlay pop, speech bubble pop |
| Camp | day ambience (birds, stream), night ambience (crickets, soft wind) |

**Music** (Slice 1):

| Track | Where | Feel |
|---|---|---|
| Hollow theme | title, camp, pinball | cozy acoustic, about 95 bpm, 1–2 min loop |
| Battle theme | fights | bouncy, about 120 bpm |
| Boss theme | boss stages | silly-tense |
| Crane theme | catcher | arcade-y and playful |
| Victory and defeat stingers | results | 3–4 s |

**Math rounds have no music** (tune), just the tree's soft ambience, so it's quiet for thinking.

**Voice:** none recorded in Slice 1. Juniper's bubbles can be read aloud with the iPad's built-in voice (a setting in [01-screens.md](01-screens.md)). Reading questions aloud is [02-math.md](02-math.md)'s call.

## Haptics

None. iPads (apart from the Apple Pencil Pro) have no vibration motor, so iOS haptic feedback does nothing on them. Sound and animation carry all the feedback.

## Accessibility

Matches [11-tech.md](11-tech.md):
- **Reduce Motion** (the iPad setting):
  - Turns off screen shake, flashes and drifting ambient specks.
  - Shortens celebrations and makes the collect moment a simple fade ([08-camp.md](08-camp.md)).
  - The pinball and catcher physics still play, since they are the game.
- **Flashes:** never more than 3 per second, and no full-screen white flashes even with Reduce Motion off. The jackpot uses a soft pulsing glow.
- **Sound off:** the combo meter, the timer turning orange, the tree's leaf for a wrong answer, and the number on each critter in the catcher carry everything that sound does.
- **Colour:** elements have icons, Yes!/No! has words and thumbs, and Rare pots have a star as well as being purple.
- **Contrast:** text on panels is at least 4.5:1.
