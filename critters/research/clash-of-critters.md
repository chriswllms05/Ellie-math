# Clash of Critters: how the real game plays

Research notes for the critter game, gathered on 2026-11-25 by a helper session that read the Clash of Critters wiki (clashofcritters.wiki.gg) and about 20 guide sites. Names and numbers are quoted from those pages; where sources disagree, both are given. "Not covered" means none of the pages said it. The game changes with patches, so treat numbers as a snapshot.

**Reliability:** the wiki, clashofcritters.online, clashofcritters.net, grindnstrat, kenzkunz, Roonby's Horde guide and PocketGamer agree with each other. The BlueStacks beginner/tips guides and the games.gg beginner guide describe aimed "launch-and-bounce" combat, towers, walls and guilds that every other source contradicts; ignore them for mechanics.

**Naming:** critters are "Tatari" (called "Critters" before March 2026); enemies are "Zobos". Developer Farlight Games. Global launch May 20, 2026 (soft launch 2025). App Store: "Collect 100+ Unique Tataris", Tier 4 evolutions, "Glitter forms", rated 9+.

## Core loop

"Shoot pinballs → grow Tatari → clear stages → earn more pinballs." PocketGamer: "you tap on a pinball machine, collect candies, and use said candies to unlock gachapon capsules. These are used to catch your Tatari in a gachapon machine; then you deploy these Tatari onto the battlefield to fend off an incoming zombie invasion." The pinball machine is "the lifeblood"; the camp has trees that generate pinballs; other players can raid your camp (compared to Coin Master).

## 1. Battle (campaign)

Lane tower defense ("clever auto-chess"): place Tatari on a grid, Zobos walk down the lanes, Tatari attack on their own.

**Grid**
- Chapters 1–3: 3 columns, up to 9 Tatari. Chapter 4 on: 5 columns, up to 15.
- So 3 rows deep (inferred from 9 = 3×3, 15 = 5×3). Rows: front, mid, back. Lanes 1–5, 3 is the centre.
- Any Tatari can go in any slot. Common layout per lane: tank/guardian front, DPS behind, support/healer/control in the back slot. "Ask which 15 can fill five lanes without leaving one lane empty."

**Placement**
- Placed before the battle. PocketGamer: "you constantly need to reposition your critters." Mid-battle moving is confirmed only in Horde mode.
- While placing, the lane lights a green "Yes!" or red "No!" (also shown as thumbs up/down on the Tatari). Thumbs up = "Counter DMG: 200%", thumbs down = "Countered DMG: 50%", else 100%.
- A zombie-head "?" button shows the current wave's elements, density and Zobo types, and where they come from. Elements "vary for every stage and every lane".

**Element wheel (5):** Water > Fire > Grass > Rock > Lightning > Water. Zobos come in the same five, plus a few with no element.

**How Tatari attack:** automatic, no aiming; each has a base skill that fires repeatedly. Examples:
- single ranged shots; chain lightning; exploding fruit (area damage)
- piercing lances (with Paralysis), piercing spirals and orbs
- bouncing (ricocheting) projectiles
- ice blocks that Slow; sleep shots; slowing terrain
- dash with invincibility and area damage; close-range double slash
- counterattack when hit by close enemies, otherwise heal self
- heal + attack buff; area damage + heal + buff; clouds of area lightning; summon a clone
- Range matters; some hit several lanes (one evolves from 1 lane to 3).
- Status effects: Slow, Sleep, Paralysis, Freeze, Burn, Stun, Knockback, Pull, Bind, stacking stings, Fragile, Poison, shields, ATK/DEF/attack-speed buffs.
- Skill timing (cooldowns): not covered beyond "continuously", "occasionally", "after taking damage".

**Roles:** DPS, Tank, Guardian, Healer, Support, Specialist (control/status).

**Enemies:** humanoid zombies that spawn at the top and walk down lanes; attack range 1/4–4/4 and move speed 1/4–3/4. Many types (ordinary, plant, shotgun, slingshot, nurse, miner, bomber…). Some bosses summon minions; one skips your front line; one teleports so you need damage in every lane. Zobos fight back and can kill Tatari.

**Waves and timer:** several waves per stage (count not covered). A stage timer exists (length not covered).

**Win/lose:** lose if any Zobo reaches the bottom of the field, or if the timer runs out first. Win by clearing all waves. After a loss, a battle report shows which Tatari died and which lanes were beaten. Kills still count toward quests even on a loss.

**Structure:** 80 stages per chapter, boss every 10th (8 bosses a chapter); 120 named themed chapters (Green Hills, Kobi Desert, Lost Woods, Thunder Peak…). Known difficulty walls (e.g. chapters 19–23).

**Bosses:** every 10th stage; need re-thought teams ("never underestimate a properly positioned healer"). About 25 bosses across the five elements, with gimmicks: freezing, barrel armies, teleporting, summoning, exploding 3 times and reviving twice, curses.

**Quick Deploy** (unlocks after 2-79): auto-fills 15 Tatari into effective rows by strength and element matchups; you tweak. **Auto-Battle**: keeps playing stages while you win; off on boss stages. "The auto-fight feature is a lifesaver."

**Rewards:** regular stages give progress only (earlier: 3 pinballs). Boss stage: 1 boss star, 30+ pinballs, a shovel (clears a camp tile), sometimes wish boxes; e.g. 1-80 boss pays 240 pinballs and 3 wish boxes. Chests at stages 40 and 80 give 5 wish boxes each. Finishing chapter 1: 1,000 pinballs, capsules, a Tatari and a decoration.

**Boss stars (main progression track):** 601 in all; each also unlocks a camp tile. The first 14 stars give one upgrade each, then one per 2 stars. Early unlocks: 1 pinball multiplier; 2 badges; 3 pinball card; 4 card boost; 5 raid rewards; 6 pinball recovery +5/hr; 7 duel rewards; 8 feeding canteen; 9–10 candy boost +20/30%; 11 gold card; 13 pinball storage; 15 auto feeder; 18 candy +40%; 70 shield limit +1. Repeating: more pinball trees (max 8), feed/visit rewards, bento maker, quick capture then auto capture.

## 2. Pinball machine

A vertical pinball board. One launch costs pinballs × the multiplier; the ball's path is physics-driven and mostly random and ends in a bottom slot.

**Launching:** tap the machine. The one skill: launch when the moving bumper at the top points toward the centre, for a better chance at the middle lanes. Bumper hits mid-flight fill gauges. "Flashy combos, satisfying multipliers, and bonus bonanzas … each time you tap."

**Layout and payouts** (share of landings):
- Top-left **capsule bumper**: hits fill a gauge; full gauge gives a random Tatari capsule or pinballs. Daily cap.
- Top-right **shield bumper**: gauge; full gives +1 raid shield.
- **Centre card slot**, 3.3%: a reward card (Blue, Purple, Gold) of pinballs or candy, × multiplier.
- Bottom row, left to right:
  - Far left, 25.1%: candy; event items.
  - Mid-left, 22%: candy; event currency (fishing rods, shooter coins, fertilizer).
  - **Jackpot**, centre, 1.7%: a minigame (Raid, Duel, Visit, Feed).
  - Mid-right, 22%: candy; event currency (skateboards, energy drinks).
  - Far right, 25.5%: candy.
- Event slots rotate with each event; every event has a 150-tier reward track.

**Multipliers:** chosen per launch; multiply cost and payout. A tier unlocks while you hold at least: x3 240, x5 360, x10 600 (or 720), x20 1,200, x40 2,400, x60 4,800, x100 7,200, x150 12,000, x200 18,000. Resets to the lowest when you run out or relaunch. At x60+, the catcher gets Quick Capture.

**Pinball sources:** pinball trees in camp (up to 8, each holds 10 hours), recovery +5/hr, daily quests (3 × 30), a free daily gift (60), duels, boss stages, milestone chests, card album sets, Horde, Boss Challenge, achievements (20–50), event tracks, being visited (3), codes, and paid gems.

## 3. Minigames

**Jackpot minigames:**
- **Raid:** visit a random camp; targets appear over some of its Tatari; tap one and an elemental blast hits it. Shielded target: base candy. Unshielded: double, and the victim loses candy.
- **Duel:** 3 enemy Tatari and 10 face-down boxes; open up to 5 looking for your Tatari of the countering element. Pays candy and a few pinballs. "Very luck-based."
- **Visit (hide and seek):** 30 seconds to find 5–6 hidden Tatari in someone's camp ("Find Sick / Sleeping / Happy"). More found, more candy.
- **Feed:** a 30-second Tetris-like block board (shapes: X, heart, cat, stripes…); two of their Tatari eat as you clear blocks; you get candy.

**Tatari Catcher:** capsules (Green, Blue, Purple, Wishbox) open a gachapon machine where you catch each Tatari by hand. Quick Capture / Auto Capture unlock later. The exact catching interaction is not covered.

**Fishing Contest** (3-day event): rods from the mid-left slot. Each cast shows a shadow; small fish: tap to reel in before a timer; big fish: keep a needle in a yellow bar. Luck levels 1–8 (low luck brings junk). Rods upgrade with points; rare bait gives team luck. Teams of 4, weight records, trophies.

**Zobo Shooter** (event): coins from the mid-left slot; in an arena, zombies walk in; each attack costs coins × the arena multiplier and each kill is a probability roll. Bigger arenas (×1 to ×1,000) have bigger bosses and points; power-ups "Lock On" and "Enrage".

**Other events:** Treasure Hunt (battleship-style digging with pickaxes; keys open a grand chest), Marathon Party (spin a wheel with skateboards to race), Cozy Farm (grow crops with fertilizer), Artifact Adventure, Carnival Rush, Raft Race and others.

## 4. Critters (Tatari)

- 100+ Tatari, about 63 evolution lines; new ones most patches. Starters: a Lightning and a Grass one, plus three easy "purple" starters.
- Elements: Lightning, Grass, Fire, Water, Rock. Roles: Guardian, DPS, Healer, Tank, Support, Specialist.
- **Rarity:** Blue (common) lines have 2 forms; Purple (rare) lines have 4. Tier colours: T1 → T2 Gold → T3 Red → T4 Rainbow. Example line: a fire pup → hound → hellhound → daemon.
- **Levels:** raised with candy from pinball. Account-wide or per Tatari: not clearly covered. Levels run into the hundreds.
- **Stars:** duplicates add star progress; stars raise stats and gate evolution. Bronze stars 1–6 (1–5 dupes each), Silver 7–12, Gold 13–18, then moons, suns, crowns… up to 78–84 stars.
- **Wish boxes:** wildcards that add a duplicate to the Tatari you choose. From chapter chests, boss stages, events, card albums.
- **Evolution:** needs stars, then (T2 → T3) two **trials**: always a feeding level of 3+, plus one by element (e.g. Water: use 2,000 fishing rods; Grass: 15–20k pinballs; Rock: 5,000 energy drinks; Lightning: dig 70 treasure tiles). Others: defeat N Zobos, clear stages, log in N days, land the star slot N times. One trial Tatari at a time. T4 forms get team-wide auras. Glitter variants are cosmetic.
- **Skills:** a base skill everywhere; in Horde mode Tatari level 1–7 in the run and learn extra skills at 3, 5 and 7. Evolution is "where a Tatari's real kit appears".
- **Feeding:** 15 feeds a day; raises stat stages 0–15, gated by stars. Food from Boss Challenge, a bento maker, the Feed minigame.

## 5. Economy

- **Pinballs:** launches. **Candy:** levels (and capsules); lost in unshielded raids. **Capsules:** new Tatari and duplicates. **Wish boxes:** chosen duplicates. **Shields:** block raids (start at 5). **Reward cards.** **Food, bentos, cookies.** **Glitter fruit.** **Shovels** (camp land). **Gems** (paid). Event currencies (rods, bait, skateboards, energy drinks, pickaxes, fertilizer, coins…) reset per event. Horde **energizers** (in-run).
- **Idle income:** pinball trees (max 8, each holds 10 hours) plus recovery. "Designed as an AFK or idle progression game."
- **No battle stamina.** Pinballs are the only gate. Boss Challenge 5 tries a day; Horde 3 per window.
- **Daily:** 3 quests × 30 pinballs ("Shoot 100 pinballs", "Complete Raid ×2", "Clear 30 Zobos", "Get a Purple+ card"), achievements, a free daily gift.
- **Camp:** your decoratable home; holds the pinball trees, bento maker, canteen, spa, scanner, journals (random Tatari encounters with story bits), day/night; expands tile by tile with boss stars and shovels; your Tatari wander there and appear in others' raids and visits.
- **Other tracks:** Badge Dojo (element challenges → permanent stat badges), Card Album (collect 9-card sets), Spa (weekly buffs).

## 6. Events and modes

- **Rotating 3-day pinball events:** Fishing → Treasure Hunt → Marathon → Zobo Shooter → Cozy Farm (→ Artifact Adventure). Each has a slot currency and a 150-tier track; most are 4-player teams; 24-hour gap between.
- **Zobo Horde Invasion:** 2-player co-op, every 3–4 hours, 3 attempts per window; 25 waves (older: 35), up to 750 kills, a boss each wave, 4–6 difficulties. In-run **energizers** deploy and upgrade Tatari (up to a deployment limit); Tatari level 1–7 in the run; you can move them mid-fight. Lawn mowers at the bottom trigger when Zobos get through. **Chips:** bosses at waves 5, 10, 15 carry a chip (Blue, Gold, Rainbow); beat it and pick 1 of 3 (max 3), e.g. +20–40% fire damage, +1 deployment and 250 energizers, energizers over time, +25% boss damage, a slowing river, "your countered matchups count as counters", glass cannon, random free deployments, forced auto-battle for energizers.
- **Boss Challenge:** daily; 5 rotating bosses with gimmicks; ranked by highest level cleared and damage; main food source.
- **Trials:** evolution quests (above).
- **Island Gold Rush:** 7-day, 4-team land grab with energy drinks; formations attack and defend.
- Seasonal events (Halloween, Carnival…).

## 7. Screen flow

- **Camp (home):** Tatari wander; collect pinball trees; buildings.
- **Pinball machine (centre of the game):** pick a multiplier, tap to launch. Candy and cards pile up; capsules open the Catcher; the jackpot sends you to a Raid/Duel/Visit/Feed in another camp and back; event currencies go to the event screen.
- **Roster:** level up with candy, star up, evolve, feed.
- **Battle:** chapter map of stages 1–80 → formation screen (Quick Deploy, wave info, green/red lane feedback) → auto-battle → result or battle report. Auto-progress chains stages.
- **Side menus:** events, Horde, Boss Challenge, Dojo, Card Album, shop, mail.
- **A typical session:** collect trees and freebies → spend pinballs → level and evolve → push stages → check events, Horde and Boss Challenge. Players open it 3–4 times a day.

## 8. What reviewers find fun, and what they complain about

**Fun:** cute designs; "flashy combos, satisfying multipliers, and bonus bonanzas … the kind of dopamine hit that'll keep you coming back"; "never-ending and absolutely compelling loop"; "the perfect combination of auto-battling idleness and cuteness overload"; the suspense of being raided; repeated centre hits at high multipliers; the jackpot; levelling fast early; auto-fight.

**Complaints:** "not like the ads"; the dopamine fades as levels slow; constant pop-up offers; fishing is tedious; some bonus games drag; unfair for players who don't pay; overwhelming ("an unholy amount of things happening"); difficulty walls; server merges.
