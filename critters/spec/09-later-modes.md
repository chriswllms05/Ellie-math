# Later modes

Everything after the core loop: the jackpot minigames, shields, reward cards, Horde, Boss Challenge, and the rotating events. All of it is for one player: **computer neighbours** stand in for the real game's friends, strangers and teammates. Words and shared numbers: [00-names-and-numbers.md](00-names-and-numbers.md). Every amount won, lost or spent here: [07-economy.md](07-economy.md). Battle rules these modes reuse: [06-battle.md](06-battle.md).

**No math in any of these.** Math only earns pinballs (decided 2026-11-25).

## Slices at a glance

| Mode | Slice |
|---|---|
| Computer neighbours | 3 |
| Jackpot minigames: Raid, Duel, Visit, Feed | 3 (Slice 1's jackpot pays a candy bonus instead) |
| Shields, and raids on her camp | 3 |
| Reward cards | 3 |
| Grump Rush (the real game's Horde Invasion) | 4 |
| Boss Challenge | 4 |
| Events: Fishing Contest, Treasure Hunt | 4 |
| Events: Critter Race, Grump Shooter, Critter Garden | 5 |
| Card album, Element Dojo | 5, maybe |
| Spa, Gold Rush, chat, friends, real leaderboards, anything paid | never |

## Computer neighbours · Slice 3

Six made-up neighbours, each with a camp of their own near Mossy Hollow:

| Neighbour | Camp | Personality |
|---|---|---|
| Wren | Pebble Point | cheerful, loves Rock critters |
| Basil | Fernwood | sleepy, loves Grass critters |
| Olive | Sunny Ridge | bossy-but-nice, loves Fire critters |
| Milo | Driftwood Cove | goofy, loves Water critters |
| Hazel | Acorn Hill | clever, loves Lightning critters |
| Rory | Thistle Glen | competitive, mixed team |

- **Their level** follows hers, within 3 levels either way (tune), so they stay close.
- **Their critters** come from the same roster as hers ([05-critters.md](05-critters.md)). Each has 8 to 15, weighted toward their favourite element.
- **Their camps** are drawn from her camp's kit (ground, trees, decorations: [08-camp.md](08-camp.md)), with each layout fixed per neighbour.
- **They are always kind in words.** A raid message says "Olive bonked your camp!", never anything mean.

## The jackpot · Slice 3

**Real game:** the jackpot slot (1.7%, [00-names-and-numbers.md](00-names-and-numbers.md)) sends you to a random minigame (Raid, Duel, Visit or Feed) at another player's camp, then back.

**Ours:**
- When the jackpot is hit, a **Jackpot!** overlay ([01-screens.md](01-screens.md)) spins between the four minigames and lands on one. Each has an equal chance (tune).
- A random neighbour is picked, and she plays at their camp.
- What it pays is scaled by her level and by the multiplier on that launch ([07-economy.md](07-economy.md)).
- **Slice 1 and 2:** the jackpot pays a candy bonus instead ([03-pinball-machine.md](03-pinball-machine.md), [07-economy.md](07-economy.md)).

### Raid

**Real game:** you're shown another camp with targets over about 5 of its critters, and tap one to send an elemental blast at it (a fireball at a grass critter, and so on). If that camp has a shield, the blast is blocked and you get the base candy. If not, it lands and you get double. Other players raid your camp the same way, and an unshielded raid takes some of your candy.

**Ours, her raid:**
- **The screen:** a neighbour's camp from above, with targeting rings drifting over **5** of their critters (tune).
- **The blast:** she taps one, and a blast of the element that beats that critter's element flies in (water at fire, fire at grass, and so on).
- **If the neighbour has a shield** (each raid: 40% chance, tune), the blast bounces off a bubble and she gets the base candy.
- **If not,** it lands, the critter goes dizzy with circling stars, and she gets **double** candy.
- **Switch camp:** once per raid (tune), before she taps, she can swap to a different neighbour.
- **Amounts:** [07-economy.md](07-economy.md).

**Ours, raids on her camp:**
- **When:** a neighbour may raid her camp while the app is closed. At most once a day, and only after she's been away at least 4 hours (tune).
- **If she has a shield,** it's used up and the raid fails. Next time she opens the app: "Hazel tried to bonk your camp. Your shield stopped it!"
- **If not,** the raid takes some candy (amount: [07-economy.md](07-economy.md)), and one critter in camp is dizzy until she taps it ([08-camp.md](08-camp.md)).
- **It never takes a level away.** Candy is only taken from her progress inside her current level, never below its start.
- **A grown-up switch** turns this off. With it off, raids still use up shields but never take candy. The switch sits in the grown-up settings ([02-math.md](02-math.md)). It defaults to on, as in the real game.

### Duel

**Real game:** three of the other player's critters at the top, ten face-down boxes below, and up to five boxes to open. You're looking for your own critters of the element that beats theirs. It pays candy, and it's the only minigame that also pays a few pinballs.

**Ours:**
- **The enemy:** the neighbour's 3 critters stand at the top, of three different elements.
- **The crates:** 10 wooden crates sit in two staggered rows below. **Remaining tries: 5.**
- **What's inside:** each crate hides one of her own critters (drawn from her collection), or, for 3 of the 10 (tune), just a puff of leaves.
- **What's guaranteed:** the draw always includes at least one counter for each enemy critter (tune), so a perfect duel is always possible, though she may not find them all.
- **Opening a crate:** if the critter inside beats one of the enemy critters still standing, it springs out and bonks that one, which poofs. If it doesn't match, it waves and sits down.
- **The end:** after 5 tries, or when all 3 enemies are gone, a rewards screen shows candy per enemy beaten, plus a few pinballs ([07-economy.md](07-economy.md)).

### Visit (hide and seek)

**Real game:** another player's camp, darkened, with a task like "Find Sick Pets". You have 30 seconds to tap 5 or 6 hidden critters among the others. More found means more candy, and the camp's owner gets 3 pinballs for being visited.

**Ours:**
- **The task:** a neighbour's camp, dimmed, with a banner: **Find the sleepy critters**, **Find the sneezy critters**, or **Find the happy critters**.
- **The clues:** sleepy ones have a tiny "z", sneezy ones a little sniffle cloud, happy ones a small heart. The clues are small, so she has to look.
- **Playing:** she taps **Start**, then has **30 seconds** to find **5** of them among about 15 critters (tune). A wrong tap makes that critter wobble, with no penalty.
- **Pay:** candy per critter found ([07-economy.md](07-economy.md)).
- **Neighbours visit her too:** at most once a day while she's away (tune), a neighbour visits and leaves a small gift by the shed: 3 pinballs, as in the real game ([08-camp.md](08-camp.md)).

### Feed

**Real game:** a 30-second block puzzle on an 8 × 8 board with a shape pattern; two of the other player's critters eat as you clear blocks; you get candy.

**Ours:**
- **The board:** 8 × 8, with a pattern of cookie blocks already on it. Patterns: X, heart, cat face, plus, stripes, corners, diagonal, V, squares, rectangles.
- **The pieces:** three at a time along the bottom. She drags them onto the board. A full row or column clears, and cookie blocks cleared that way go to the neighbour's **two critters** at the top, who munch happily.
- **Time and pay:** 30 seconds. Candy by cookies cleared ([07-economy.md](07-economy.md)).

## Shields · Slice 3

**Real game:** you start with 5 shields. Each one blocks one raid on your camp and is used up doing it. The top-right bumper on the pinball machine gives more, and boss stars raise the limit.

**Ours:**
- The same: **5 shields at the start**, and a limit of 5 that boss stars raise ([07-economy.md](07-economy.md)).
- She gets more from the **shield bumper** ring on the pinball machine ([03-pinball-machine.md](03-pinball-machine.md)). A full ring when she already has the most she can hold gives nothing.
- **Shown** as a row of small shields under the top bar on the pinball screen ([01-screens.md](01-screens.md)), and on the shield post in camp ([08-camp.md](08-camp.md)).

## Reward cards · Slice 3

**Real game:** the centre card hole (3.3%) gives a reward card: Blue, Purple, or Gold (Gold comes later from a boss star). A card is a random amount of candy or pinballs, times the multiplier.

**Ours:**
- **The same.** When a ball drops into the centre hole, a card flies out face down. She taps it, it flips over, and its candy or pinballs count into her totals.
- **Card colours and amounts:** [07-economy.md](07-economy.md). What the centre hole does before Slice 3: [03-pinball-machine.md](03-pinball-machine.md).
- **The card album** (the real game's collect-9-card sets, with trades) is **Slice 5, maybe.** It's another collection on top of critters, so only if she shows she likes collecting.

## Grump Rush · Slice 4

**Real game (its horde invasion mode):**
- Two players defend together against 25 waves (35 in older versions), with a boss at the end of each wave.
- You earn **energizers** during the run to deploy and upgrade critters, up to a deployment limit.
- Critters level 1 to 7 inside the run and learn skills at 3, 5 and 7. You can move them mid-fight.
- Bosses at waves 5, 10 and 15 carry a **chip**: beat the boss, pick 1 of 3, up to 3 per run.
- It opens every few hours with 3 tries per window, at 4 to 6 difficulties, and is ranked on a leaderboard.

**Ours:** the same mode, played solo.

- **The board:** 5 lanes × 3 rows, using the battle rules ([06-battle.md](06-battle.md)).
- **Deploying:** she starts with no critters on the board. She taps one in her tray, then a slot, and that costs energizers. Up to **6** critters can be on the board at once (tune). She can **drag a deployed critter to another slot** at any time.
- **Upgrading:** she taps a deployed critter and spends energizers to raise its run level, from 1 up to 7. It learns new skills at run levels 3, 5 and 7 ([05-critters.md](05-critters.md)). Its run level starts at 1 every run, whatever her own level.
- **Energizers:** a starting amount, then more per Grump beaten and per wave cleared ([07-economy.md](07-economy.md)). They only exist inside a run.
- **Waves:** 25, each ending with a boss (bosses: [06-battle.md](06-battle.md)). The bosses at waves **5, 10 and 15** carry a chip.
- **Chips:** after beating a chip boss, she picks **1 of 3** chips, at most **3** per run. The chip's colour shows how strong it is: blue, gold or rainbow.

| Chip | Does |
|---|---|
| Fire / Water / Grass / Rock / Lightning Power | That element's critters do +20% / +30% / +40% damage (blue / gold / rainbow) |
| New Friend | +1 critter allowed on the board, and some energizers |
| Sunshine | Energizers every 5 seconds |
| Boss Buster | +25% damage to bosses |
| Little River | A stream across the lanes slows Grumps by 40% |
| Underdog | Her critters' bad matchups count as good ones |
| All-Out | +25% attack, −10% HP |
| Surprise Squad | A few random critters from her collection join the board for free |
| Nap Time | The board plays itself for 90 seconds, and she gets a pile of energizers |
| Garden Rollers | A roller sits at the bottom of each lane and clears that lane once when a Grump reaches it |

- **The end:** the run ends when a Grump reaches the bottom of a lane (with no roller left) or after wave 25. Score: waves cleared, then Grumps beaten.
- **Difficulty:** 4 levels (tune). A first clear of a level doesn't use up a try.
- **When she can play:** **3 tries a day**, refilled at 6:00 (tune). The real game opens in windows every few hours, but her play time is short and set by the family's day.
- **Ranking:** her best score against her six neighbours. Each neighbour's score is made up near hers, sometimes above, sometimes below. A daily reward goes by her place ([07-economy.md](07-economy.md)), and a season badge for her profile.

## Boss Challenge · Slice 4

**Real game:** a daily mode against 5 rotating bosses, each with a gimmick. 5 tries a day. Bosses run up to about level 500, and you're ranked by the highest level cleared, then damage. It's the main source of critter food.

**Ours:**
- **The boss:** one challenge boss each day, rotating through five (who they are and their gimmicks: [06-battle.md](06-battle.md)).
- **Playing:** she uses her own formation on a 5 × 3 grid (3 × 3 if she hasn't reached chapter 4). There's no auto-battle, as in the real game.
- **Levels:** the boss starts at level 1. Each clear opens the next level, which is stronger (scaling: [06-battle.md](06-battle.md)), up to 500.
- **Tries:** **5** a day, refilled at 6:00.
- **Score:** the highest level cleared; ties go to damage dealt on the next level.
- **Ranking:** against her six neighbours, as in Grump Rush.
- **Pays:** critter food for feeding ([05-critters.md](05-critters.md)) and pinballs, by rank ([07-economy.md](07-economy.md)).

## Rotating events · Slice 4 and 5

**Real game:**
- 3-day events in a fixed rotation, with a 24-hour gap between them.
- During an event, one pinball slot also drops that event's item.
- You spend the item in a team minigame (teams of 4) to climb a 150-tier reward track, and items reset when the event ends.

**Ours:**
- **The schedule:** each event runs **3 days**, then **1 day** off, in the order **Fishing Contest → Treasure Hunt → Critter Race → Grump Shooter → Critter Garden**, repeating. An event only shows up once its slice is built.
- **The item:** during an event, a bubble over one pinball slot shows its item. Each landing there drops the item, scaled by the multiplier (which slot and how many: [07-economy.md](07-economy.md)).
- **The track:** **50 tiers** (tune; the real game has 150). A normal three days of play should reach the end. Tiers pay candy, pinballs, capsules, wish boxes and decorations, and the end pays a trophy for the trophy shelf ([08-camp.md](08-camp.md)). Amounts: [07-economy.md](07-economy.md).
- **Her team:** her plus three neighbours. They add progress at a steady pace, so the team goals are reachable when she does her part. Rival teams of the other neighbours rank against hers. That ranking only decides the trophy's colour.
- **The event panel** on the pinball screen shows the time left and her progress, and opens the event ([01-screens.md](01-screens.md)).
- **Items reset** when the event ends, as in the real game. The day before it ends, the panel turns orange to remind her.

### Fishing Contest · Slice 4
**Real game:** rods from the mid-left slot. Each cast shows a fish shadow: for a small one you tap to reel it in before a timer; for a big one you keep a needle inside a yellow bar. Luck levels 1 to 8 decide how often you get junk and how rare the fish are. Rods upgrade with points, and rare bait gives a short luck boost. Teams chase a weight record.

**Ours:**
- **Rods:** each cast uses one rod.
- **Small shadow:** tap before the ring closes.
- **Big shadow:** hold to raise the needle and let go to let it fall, keeping it inside the moving yellow bar until the catch meter fills. A miss costs 2 seconds and doesn't spoil the fish.
- **The fish:** 20 kinds (tune), drawn in our style, each with a weight. Her **fish book** fills as she catches new kinds.
- **Luck:** levels 1 to 8; low luck brings old boots and candy instead of fish. Rod upgrades from event points raise it, and rare bait gives +1 luck for 10 minutes.
- **The team** aims for a heaviest-fish record.

### Treasure Hunt · Slice 4
**Real game:** pickaxes from the jackpot (15 per jackpot at x1). You dig on a battleship-style board to find hidden treasures. Three boards earn a key, and four team keys open a grand chest of wish boxes.

**Ours:**
- **Pickaxes:** each one digs one tile.
- **The boards:** a 7 × 7 board of dirt hides 3 treasures of different shapes (tune). Dug tiles show a hint of how close a treasure is (warm or cold colour).
- **Progress:** finding all three treasures moves her to the next board. After 3 boards she gets a **key**.
- **The chest:** her key plus her teammates' keys open the **grand chest** (wish boxes: [07-economy.md](07-economy.md)).
- **Bombs:** sometimes a dig turns up a **bomb**, which reveals a 3 × 3 area for free.

### Critter Race · Slice 5
**Real game (Marathon):** skateboards from the mid-right slot. You spin a wheel to move your team along a track, and distance milestones give reward boxes to choose from.

**Ours:**
- **Scooters** are the item. Each spin of the wheel moves her lead critter 1 to 6 spaces.
- **Spaces:** some give candy or pinballs, and some say "zoom ahead 2".
- **Milestones:** each one offers three closed boxes, and she picks one.

### Grump Shooter · Slice 5
**Real game:** coins from the mid-left slot. In an arena, zombies walk through; each attack costs coins times the arena's multiplier, and each hit is a chance roll to beat the target. Bigger arenas (×1 up to ×1,000) have bigger bosses and more points, and they unlock as you earn coins. Power-ups lock on to targets or speed up attacks.

**Ours:**
- **Acorn coins** are the item. Grumps waddle across the arena.
- **Attacking:** she taps one, and her chosen critter flings at it. Each fling costs coins times the arena multiplier and has a chance to poof that Grump (chances: [07-economy.md](07-economy.md)).
- **Arenas:** ×1, ×2, ×5, ×10, ×20 (tune; fewer than the real game), each with a featured boss Grump.
- **Power-ups:** **Lock On** (flings always aim true for 10 seconds) and **Hurry Up** (double fling speed).

### Critter Garden · Slice 5
**Real game (Cozy Farm):** grow crops with magic fertilizer. Fruit weight counts toward milestones, fruit can be fed to your critters, and fertilizer sometimes gives a 5× growth crit.

**Ours:**
- **Fertilizer** is the item. She plants seeds in a 3 × 3 garden bed.
- **Growing:** each fertilizer makes a crop grow, and sometimes there's a **5× crit** with a sparkle.
- **Harvest:** ripe fruit is weighed toward milestones, and can be fed to critters ([05-critters.md](05-critters.md)).

## Element Dojo · Slice 5, maybe

**Real game (Badge Dojo):** element challenges that give permanent element badges, which boost stats.

**Ours, if built:**
- Five short towers of battle stages, one per element. Only critters of that element can enter that tower.
- Each floor cleared earns a badge, which gives a small permanent boost to all her critters of that element (amounts: [07-economy.md](07-economy.md)).

## Dropped

- **Spa** (weekly buffs): little play value for her.
- **Island Gold Rush:** a week-long land grab built around real teams.
- **Chat, friends lists, real leaderboards, gifts between real players.**
- **Anything paid:** gems, packs, passes, offers.
