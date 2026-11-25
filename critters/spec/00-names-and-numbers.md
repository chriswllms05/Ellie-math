# Names and numbers (shared by every spec)

The one place for the words and starting numbers that more than one spec uses. Other specs link here instead of repeating these. When a number changes, change it here.

## How to read the specs

- **Real game:** what Clash of Critters does, from [the research notes](../research/clash-of-critters.md).
- **Ours:** what this game does. Where ours copies the real game, the spec says so.
- **(tune):** a starting number, picked to be reasonable, to adjust once Ellie plays.
- **Slice 1 / later:** whether it's in the first build (see [13-build-plan.md](13-build-plan.md)).
- Our critters, enemies, art and names are our own. The real game's names (Tatari, Zobos, their critters, bosses and places) appear only in the research notes, never in the game.

## Words

| Word | Means |
|---|---|
| **critter** | A creature she collects and battles with (the real game's "Tatari"). |
| **Grumps** | The zombie-like enemies (working name; the real game's "Zobos"). |
| **pinballs** | The main currency. Earned by math. Spent to launch balls in the pinball machine. |
| **candy** | Won from the pinball machine. Levels up critters. |
| **capsule** | Won from the pinball machine. Opens a catch session in the catcher. Green, Blue, Purple. |
| **wish box** | Adds a duplicate (star progress) to a critter she chooses. |
| **shield** | Protects her candy from raids (later). |
| **reward card** | A bonus from the pinball machine's centre hole: candy or pinballs (later). |
| **boss star** | Earned for each boss stage beaten. Unlocks features and camp land. |
| **math round** | About 20 questions at a pinball tree; the only way trees fill. |
| **combo** | Her streak of fast right answers in a math round; multiplies pinballs. |
| **form** | One stage of a critter's evolution line (T1 to T4). |
| **lane / row** | Battle grid: lanes run top to bottom; rows are front, middle, back. |

## Elements

Five, as in the real game. Each beats the next and loses to the one before:

**Water → Fire → Grass → Rock → Lightning → Water**

- A counter (attacker's element beats the target's) does **×2** damage; being countered does **×0.5**; everything else ×1.
- Some Grumps have no element (×1 against everything).

## Roles

Tank, Guardian, DPS, Healer, Support, Specialist (control and status effects), as in the real game.

## Rarity and forms

| Rarity | Pedestal / colour | Forms | Notes |
|---|---|---|---|
| **Common** | blue | 2 (T1 → T2) | The four starters are Common. |
| **Rare** | purple | 4 (T1 → T2 → T3 → T4) | T3 needs a trial; T4 gives a team aura. |

Form colours: T1 plain, T2 gold, T3 red, T4 rainbow.

## Levels

As in the real game: **candy fills one shared level bar** (her level, shown at the top of the pinball screen). When it fills she levels up, and **every critter she owns is at her level**. Stars and forms belong to each critter. Candy costs per level and the candy each slot pays both scale with her level ([07-economy.md](07-economy.md)).

## Who owns which detail

So that two specs never give two answers:

| Detail | Lives in |
|---|---|
| Screens, navigation, first launch, top bar and buttons | 01-screens |
| Skills, questions, mastery, timing, help, grown-up view and settings | 02-math |
| Pinball board layout, physics, launching, gauges | 03-pinball-machine |
| Capsules, catcher board, critter find chances | 04-catcher |
| Critter roster, stats, growth, stars, evolution, skills, auras | 05-critters |
| Grumps, waves, damage, bosses, stages, battle screens | 06-battle |
| Every amount earned or spent: candy per slot, level costs, stage and chest rewards, boss star track, daily quests, balance targets | 07-economy |
| Camp, trees, decorating | 08-camp |
| Jackpot minigames, shields, reward cards, Horde, Boss Challenge, events | 09-later-modes |
| Look, assets, animation, sound | 10-art-and-sound |
| Code structure, data, saving, testing | 11-tech |
| Mac and iPad setup | 12-laptop-setup |
| Order of work, checks, play-testing with Ellie | 13-build-plan |

## Starters (working names until Ellie picks)

| Element | Animal | Forms |
|---|---|---|
| Grass | hedgehog with leaf spines | Sprickle → Thornhog |
| Lightning | hamster with sparking cheeks | Zapster → Voltamster |
| Water | axolotl | Axolittle → Tidalotl |
| Fire | red panda | Cinderpaw → Blazepanda |

No Rock starter; Rock critters come from the catcher.

## Math pay (the only place math appears)

| Her answer | Pinballs |
|---|---|
| Right and fast | 3 × combo |
| Right but slow | 1 |
| Wrong | 0 |
| "I don't know" | 0 |

- **Fast** = answered within the skill's fast time: **3 seconds** for facts (tune; grown-up setting).
- **Combo:** x1 to start; x2 after 3 fast right answers in a row, x3 after 6, x4 after 10. A slow right answer drops it one step; a wrong answer drops it to x1; "I don't know" leaves it where it is.
- **Round:** about 20 questions (tune). As many rounds a day as she likes. Trees never fill on their own.

## Pinball machine (copied from the real game)

| Slot | Share of landings | Pays |
|---|---|---|
| Far left | 25.1% | candy (+ event items, later) |
| Mid left | 22.0% | candy (+ event currency, later) |
| **Jackpot** (centre) | 1.7% | a jackpot minigame (later; Slice 1 pays a candy bonus) |
| Mid right | 22.0% | candy (+ event currency, later) |
| Far right | 25.5% | candy |
| Centre card hole | 3.3% | a reward card |

The real shares add to 99.6%; ours are scaled to 100%. Two bumpers near the top fill ring gauges: **capsule bumper** (top left; full ring gives a capsule) and **shield bumper** (top right; later).

**Multiplier tiers:** x1 and x2 always; each higher tier opens while she holds at least: **x3 240 · x5 360 · x10 600 · x20 1,200 · x40 2,400 · x60 4,800 · x100 7,200 · x150 12,000 · x200 18,000** pinballs. A launch costs 1 pinball × the multiplier and pays × the multiplier.

## Catcher (copied from the real game)

- A capsule opens a catch session with **5 drops** (tune by capsule colour).
- Multiplier bars: two **x3** (fixed, low left and right), two **x5** and one **x20** (sliding).
- Balls needed to catch: Common **about 10**, Rare **about 16** (seen in the real game; tune).

## Battle (copied from the real game)

- Grid: **3 lanes × 3 rows** (9 critters) in chapters 1–3; **5 × 3** (15) from chapter 4.
- **80 stages per chapter**, a boss on every 10th.
- Lose if a Grump reaches the bottom or the timer runs out; win by clearing every wave.

## The app

- Native iPad app: **Swift, SwiftUI for menus, SpriteKit for the game scenes.** Portrait. Offline. Saves on the iPad; backup to a file. No accounts, ads, purchases or network.
- Built in Xcode on the user's personal Mac laptop.
