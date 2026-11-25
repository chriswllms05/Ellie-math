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
| **Pinball machine** | Same as the real game: tap to launch, a moving bumper at the top (launch when it points to the middle), capsule and shield bumpers with gauges, the centre card slot, four candy slots and the jackpot along the bottom, the same landing odds, and multiplier tiers that open as her pile grows (x3 at 240 pinballs up to x200 at 18,000). |
| **Candy and levels** | Same: candy levels critters up. |
| **Catcher** | A capsule opens the catcher. Which critter turns up depends on its find chance: rarer critters are harder to find. She catches them by hand. |
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

- **What it covers:** to decide (open question 1).
- **How a fact grows:** new → learning → fast → solid. A fact counts as solid only after fast answers on two different days.
- **What a round holds:** mostly facts she's learning, some review of fast and solid ones spaced out over days, and a few new ones.
- **After a miss:** the answer, with a quick picture or strategy, then the fact comes back a few questions later.
- **Grown-up view** (behind a press-and-hold and a PIN): minutes and answers per day, fast %, her slowest and most-missed facts, and settings (what's practised, the fast time). Backup to a file.

## Platform

An iPad web app, held upright (the pinball board and the lanes both run top to bottom). It installs to the home screen, works offline and saves on the iPad. It lives at `/Ellie-math/critters/` on GitHub Pages.

## Build plan

**Slice 1: the core loop, end to end**
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

## Open questions

1. **Which math?** For example addition and subtraction facts to 20, times tables, division, or a mix, and which first.
2. **How does catching work in the real game?** The wiki doesn't describe it. A description or screenshot of the catcher would let us copy it closely.
3. **Names and look:** critter names, the enemies' name, and the game's name. Ellie could name them.
