# The critter game

Working title. Started 2026-11-25 as a fresh start: nothing from Ellie Math v1 or v2 (the village) carries over. The old app at the root of this repository stays live for Ellie until this one replaces it.

How the real game plays, in detail: [research/clash-of-critters.md](research/clash-of-critters.md).

## The idea

Copy the gameplay of Clash of Critters for Ellie, with one change: **pinballs come from math.** Right answers earn pinballs, and fast right answers earn a lot more. That is the only place math appears. The pinball machine, the catcher, battles and everything else play like the real game, with no math in them.

The critters, enemies and art are our own, and Ellie can help name them. Working names: **critters**, and the **Grumps** (the zombies).

## How it plays

```
Math round ──► pinballs ──► pinball machine ──► candy, capsules, cards, jackpot games
                                                   │          │
                              candy ──► critter levels        │
                                                   capsules ──► catcher ──► critters
                                                                  duplicates ──► stars ──► evolutions
Critters ──► battles ──► boss stars ──► unlocks, more pinballs, camp land
```

## What we copy, and what changes

| System | In ours |
|---|---|
| **Pinball machine** | Same as the real game: a peg board with no flippers, a big PUSH button to launch (with the multiplier beside it), a moving bumper at the top (launch when it points to the middle), capsule and shield bumpers whose rings fill up, the centre card hole, four candy slots and the jackpot along the bottom, the same landing odds, and multiplier tiers that open as her pile grows (x3 at 240 pinballs up to x200 at 18,000). |
| **Candy and levels** | Same: candy levels critters up. |
| **Catcher** | Copied from the real one (from your screenshots and description). A capsule from the pinball machine opens a catch session. A claw at the top holds a ball; she taps the big button to drop it. On the way down it passes through multiplier bars (x3, x5, x20; the upper ones slide side to side), and each bar it goes through multiplies it into that many balls. The balls roll down two rails into a chute that pours them onto a moving conveyor belt of critters. Each critter shows a number: how many balls it takes to catch it. Every ball that lands on it counts it down, and at 0 it's caught. She gets a few drops per session (5 in the screenshots), so timing decides how many she catches: dropping when the bars line up, and when the critter she wants is passing under the chute. Which critters ride the belt depends on find chances: rarer ones turn up less often and need more balls. A crate button shows what can turn up. Better capsules give better odds. Quick Capture (catch them all) comes later, as in the real game. |
| **Rarity** | As in the real game: **Common** lines (blue) have 2 forms and **Rare** lines (purple) have 4. Forms go T1 → T2 (gold) → T3 (red) → T4 (rainbow), and a T4 form gives the whole team an aura. |
| **Stars and evolution** | As in the real game: each duplicate adds star progress, stars make a critter stronger, and enough stars unlock its next form. Stars climb in tiers (bronze for stars 1–6, then silver, gold, moons, suns and crowns), each needing more duplicates per star. Going from T2 to T3 also needs a **trial**: early ones are goals she can reach anywhere (beat a number of Grumps, clear stages, hit the jackpot, feed it up a level), and event trials arrive with the events. Wish boxes give a duplicate of the critter she chooses. The research doesn't give the exact star count for every evolution (some evolve at 1 star, others at 6), so we set them along those lines and adjust if we learn the real ones. |
| **Starters** | Four, one of each: **Grass, Lightning, Water and Fire**. Common lines (2 forms), like the real game's starters. |
| **Elements** | Five, as in the real game: Water beats Fire, Fire beats Grass, Grass beats Rock, Rock beats Lightning, Lightning beats Water. A counter does double damage; being countered does half. Rock critters come from the catcher. |
| **Battle** | Same: place critters on a grid (3 lanes × 3 rows in chapters 1–3, then 5 × 3), the lane lights green "Yes!" or red "No!" for the matchup, the "?" button shows the next wave, critters attack on their own, the Grumps walk down the lanes, and she loses if one reaches the bottom or the timer runs out. A boss every 10th stage, a battle report after a loss, Quick Deploy, and auto-battle on regular stages. Roles: tank, guardian, DPS, healer, support, specialist. |
| **Boss stars** | Same idea: each boss beaten gives a star that unlocks the next feature (multipliers, more trees, card boosts, raid rewards, more camp land). Trimmed to fit how far she'll actually get. |
| **Camp** | Same: her home, decorated however she likes, critters wandering around it. The pinball trees fill from math instead of from time passing. |
| **Jackpot games** | Raid, Duel, Visit and Feed, against made-up neighbours' camps instead of real players. |
| **Daily quests** | Same, e.g. "Shoot 100 pinballs", "Clear 30 Grumps", "Do a raid". |
| **Modes and events** | Horde Invasion (with pick-1-of-3 chips), Boss Challenge, and the rotating events (fishing, treasure hunt, racing, the shooter), played solo with computer teammates and rivals. |

**Left out:** anything paid (gems, packs, passes, pop-up offers), ads, real other players, chat, and leaderboards against strangers.

## Where the math goes

Math has one job: **it earns pinballs.** It replaces the real game's main free pinball income (trees that fill while you're away, plus slow recovery). The game's other pinball rewards stay as they are: boss stages, daily quests, chapter chests, duels and events.

### Math rounds

The pinball trees in her camp are where math happens. She taps a tree to start a round of about 20 questions (2 to 4 minutes). As she answers, pinballs grow on the tree, and at the end she taps them to collect, like collecting from a tree in the real game. She can do as many rounds as she likes, whenever she likes. Trees never fill on their own.

| Her answer | Pinballs |
|---|---|
| Right and fast | 3, times her combo |
| Right but slow | 1 |
| Wrong | 0 |
| "I don't know" | 0, and no harm done |

**Speed combo:** fast right answers in a row build a combo: x2 after 3, x3 after 6, x4 after 10. A slow answer drops it one step; a wrong answer drops it back to x1. "I don't know" never touches it. So a run of fast answers pays about ten times what slow ones do, and that's the part that feels like the pinball machine.

**Rules that keep it honest:**
- Wrong answers pay nothing and break the combo, so fast guessing never pays.
- Answers are typed, never picked from choices.
- "I don't know" is always safe: it shows her how, and the question comes back later in the round.
- "Fast" is a time per kind of question, starting at 3 seconds for facts, adjustable by the grown-up. The clock runs from the question appearing to her entering the answer.

**Balance target:** about 10 minutes of math a day should earn roughly what a real player's trees give at the same point in the game. All the numbers are easy to tune once she's playing.

### The math engine (new)

- **What it covers**, from what's known about Ellie (third grade, Singapore Dimensions Math 3; behind on facts to 20 and still counting them on her fingers; tends to rush and guess when unsure):
  1. **First and most: addition and subtraction facts to 20.** Her biggest gap, and the one everything else in third grade leans on. Built up the way her class teaches them: partners of 10, doubles, near doubles, make 10, subtract from 10, take away from teens.
  2. **Then times tables, as her class reaches them:** ×2, ×5, ×10, then ×3 and ×4 (chapter 4 expects 0–5 and 10 from memory), then ×6 to ×9, each with its division partner.
  3. **Later, as bigger questions with their own, longer time:** place value and rounding to 10,000, and mental math (chapter 2 strategies). They pay more per question.
- **It starts with a short check** (with "I don't know" always there) to find where she is now, since those notes are from October.
- **Speed pays for knowing, not counting.** Counting a fact on fingers usually takes longer than 3 seconds, so the pay table quietly rewards recall over counting without anyone telling her not to count.
- **How a fact grows:** new → learning → fast → solid. A fact counts as solid only after fast answers on two different days.
- **What a round holds:** mostly facts she's learning, some review of fast and solid ones spaced out over days, and a few new ones.
- **After a miss:** the answer, with a quick picture or strategy, then the fact comes back a few questions later.
- **Grown-up view** (behind a press-and-hold and a PIN): minutes and answers per day, fast %, her slowest and most-missed facts, and settings (what's practised, the fast time). Backup to a file.

## Platform: a native iPad app

A real iPad app, not a web page: built in Swift, with **SpriteKit** (Apple's 2D game engine) for the pinball machine, catcher and battles, and SwiftUI for menus and the grown-up view. That gives real physics for dozens of bouncing balls, smooth animation at the iPad's full frame rate, quick sound, and saving that Safari can't clear. Held upright, like the real game. Works offline; no accounts; nothing uploaded.

What it needs:
- **A Mac with Xcode** (free from the App Store) to build it. Cloud sessions can't build iPad apps, so building and testing happen in a Claude Code session on the Mac.
- **A way onto Ellie's iPad.** Either plug the iPad into the Mac and install from Xcode with a free Apple ID (the app stops opening after 7 days until it's installed again), or join the **Apple Developer Program** ($99 a year) and use **TestFlight**: each new version arrives on her iPad over the air and lasts 90 days.
- The game's rules (the math engine, payouts, odds, critter stats, battle numbers) are kept apart from the screens, so they can be checked on their own.

## Names

Like Pokémon: made-up names that sound like the real animal plus its element, with each evolution family sharing a sound (Caterpie → Metapod → Butterfree). Our own animals, not the real game's. Ideas for the starters, for Ellie to pick from or replace:

| Element | Animal | Forms (starters are Common: 2 forms) |
|---|---|---|
| Grass | hedgehog with leaf spines | Sprickle → Thornhog |
| Lightning | hamster with sparking cheeks | Zapster → Voltamster |
| Water | axolotl | Axolittle → Tidalotl |
| Fire | red panda | Cinderpaw → Blazepanda |

Rare lines have 4 forms, for example a rock armadillo (Pebbledillo → Rockadillo → Boulderdillo → Titanadillo) or a water tadpole that grows up (Tadpip → Froglet → Tidetoad → Kingcroak). The zombies are still "Grumps" for now, and the game still needs a title.

## Build plan

**Slice 1: the core loop, end to end**
- The iPad app itself: an Xcode project, SpriteKit scenes, saving on the device.
- A math round on a pinball tree, with pinballs and the speed combo.
- The pinball machine: slots, odds, bumpers, multipliers, candy, capsules.
- The catcher; the 4 starters and a handful of other Common and Rare critters; levels, stars and the first evolutions.
- Battle chapter 1: 3 × 3 grid, 10 stages, a boss at stage 10.
- A first camp with trees and critters wandering.

Then put it in front of her for a few days and watch: does she start math rounds without being asked? Does she rush? (Her wrong-answer rate will say.)

**Slice 2:** chapters 2–4 (5 × 3 from chapter 4), more Rare critters, evolution trials, feeding, the boss star track, Quick Deploy, auto-battle, daily quests, wish boxes.

**Slice 3:** the jackpot games against computer camps, shields, reward cards.

**Slice 4:** Horde Invasion with chips, Boss Challenge, the first rotating events.

**Slice 5:** more critters, chapters and events.

## Decisions made

- Copy the real game's gameplay; our own names and art. (2026-11-25)
- Math only earns pinballs: no math in battles or anywhere else. (2026-11-25)
- Luck-based rewards are fine: the machine, cards, jackpot. The catcher works on find chances. (2026-11-25)
- Rarity, stars and evolution follow the real game. (2026-11-25)
- Four starters: Grass, Lightning, Water, Fire. (2026-11-25)
- Built as a new folder in this repository; the old app is left untouched. (2026-11-25)
- A native iPad app (Swift, SpriteKit), not a web app. (2026-11-25)
- The math follows where Ellie is: facts to 20 first, then times tables as her class reaches them, then bigger questions. (2026-11-25)
- The catcher works like the real one: claw drop, multiplier bars, conveyor of critters that each take a number of balls. (2026-11-25)
- Names in the Pokémon style: real animal plus element, shared sounds within a family. (2026-11-25)

## Open questions

1. **Building:** is Xcode installed on the Mac, and is it recent enough for the iPad's iOS version?
2. **Installing:** free Apple ID (reinstall every 7 days by cable) or the Apple Developer Program ($99 a year, updates over the air with TestFlight)?
3. **Names:** starters from the list above or Ellie's own; a name for the zombies; a title for the game.
