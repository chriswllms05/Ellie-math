# Critter Math

**Critter Math**: a math game for Ellie that copies the gameplay of Clash of Critters, with math as the only way to earn pinballs. A native iPad app (Swift, SwiftUI, SpriteKit), started 2026-11-25 as a fresh start; the old Ellie Math app at the root of this repository is separate and stays as it is.

## Read in this order

1. [DESIGN.md](DESIGN.md): the idea, what's copied, the decisions made, and what's still open.
2. [research/clash-of-critters.md](research/clash-of-critters.md): how the real game plays.
3. The specs, which say exactly what to build:

| Spec | Covers |
|---|---|
| [00-names-and-numbers.md](spec/00-names-and-numbers.md) | Shared words and starting numbers |
| [01-screens.md](spec/01-screens.md) | Every screen, how she moves between them, first launch |
| [02-math.md](spec/02-math.md) | Math rounds, skills, the placement check, mastery, help, the grown-up view |
| [03-pinball-machine.md](spec/03-pinball-machine.md) | The pinball machine: layout, physics, odds, payouts, multipliers |
| [04-catcher.md](spec/04-catcher.md) | Capsules and the catcher |
| [05-critters.md](spec/05-critters.md) | The roster, stats, levels, stars, evolution, skills |
| [06-battle.md](spec/06-battle.md) | Battle rules, Grumps, bosses, chapter 1 |
| [07-economy.md](spec/07-economy.md) | Every currency, where it comes from and goes, the boss star track, daily quests, balance |
| [08-camp.md](spec/08-camp.md) | Her camp: trees, decorating, critters wandering |
| [09-later-modes.md](spec/09-later-modes.md) | Jackpot minigames, Horde, Boss Challenge, events |
| [10-art-and-sound.md](spec/10-art-and-sound.md) | Look, asset list, sound |
| [11-tech.md](spec/11-tech.md) | How the app is built: structure, data, saving, testing |
| [12-laptop-setup.md](spec/12-laptop-setup.md) | Getting the Mac laptop and Ellie's iPad ready |
| [13-build-plan.md](spec/13-build-plan.md) | What gets built in what order, and how each step is checked |

These docs are also copied into the ChrisOS vault, at `Projects/Critter Math`, by [tools/sync-to-vault.sh](tools/sync-to-vault.sh) on the Mac. Edit them here; the vault copy is overwritten.
