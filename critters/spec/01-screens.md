# Screens

Every screen and overlay, how she moves between them, and what she sees on her first day. Portrait iPad. Words and shared numbers: [00-names-and-numbers.md](00-names-and-numbers.md). This spec owns layout and navigation; what happens inside each scene belongs to the spec linked from it.

## The shape of it

As in the real game, **the pinball machine is home**. Everything else is one tap away from it, and everything comes back to it.

```
                         ┌───────────────┐
         first launch ──►│   PINBALL     │◄── app opens here
                         │   (home)      │
                         └──┬──┬──┬──┬───┘
        ┌───────────────────┘  │  │  └─────────────────────┐
        ▼                      ▼  ▼                        ▼
     CAMP                 CRITTERS  BATTLE MAP          CHALLENGE (Slice 4)
   tap a tree ─► MATH ROUND   │       │                 Horde, Boss Challenge
   tap shed ─► PINBALL        ▼       ▼
                        critter    FORMATION ─► FIGHT ─► VICTORY / DEFEAT (+ report)
                        detail                                  │
                                                                └─► back to BATTLE MAP

   PINBALL ── "Grow pinballs" ──► MATH ROUND ──► back to PINBALL
   PINBALL ── capsule won ──► CATCHER ──► CATCH RESULTS ──► back to PINBALL
   PINBALL ── jackpot (Slice 3) ──► RAID / DUEL / VISIT / FEED ──► back to PINBALL
   any main screen ── ⚙ ──► SETTINGS ── press and hold ──► GROWN-UPS (PIN)
```

**Main screens** (pinball, camp, critters, battle map, challenge) show the **bottom bar**. **Activities** (math round, catcher, fight, minigames) fill the screen, hide the bottom bar, and have their own way out.

## Getting back from anywhere

- **Bottom bar** on every main screen: **Camp · Critters · Pinball (centre, larger) · Battle · Challenge**. Challenge shows a lock until Slice 4 (unlock rule: [07-economy.md](07-economy.md)).
- **Sub-screens** (critter detail, formation, settings) have a **back arrow, top left**.
- **Activities** have an **✕, top left**, except the catcher, which has no way out until her drops are used (so a capsule is never wasted by a stray tap).
- Every way out of an activity lands where she came from.
- Tap targets are at least 60 × 60 pt; nothing important sits in the top 24 pt or bottom 20 pt (system gestures).

## Main screens

### Pinball (home) · Slice 1

Purpose: spend pinballs, win candy and capsules. The board itself: [03-pinball-machine.md](03-pinball-machine.md).

Top to bottom:
- **Top bar:**
  - **Level badge** with her level number, and the **candy bar** beside it filling toward the next level.
  - **Pinball count** with a small green **+**. The + starts a math round, since math is the only way to get pinballs.
  - **⚙ settings**, top right.
- **Row under the top bar:**
  - **Capsule button**, left, with a badge for capsules waiting to be opened. Hidden when there are none.
  - **Shields** (Slice 3), a row of small shield icons.
  - **Event panel** (Slice 4), right: the current event, its timer and progress.
- **Side buttons**, right edge: **Quests** (Slice 2).
- **The machine**, about 60% of the height.
- **Under the machine:**
  - The big **PUSH** button, with the **multiplier toggle** beside it (tap to step through the tiers she has open; tiers: [00](00-names-and-numbers.md)).
  - The pinball count again, small, right under PUSH.
  - When she can't afford even x1, PUSH turns into a green **Grow pinballs** button that starts a math round.
- **Bottom bar.**

When the next battle stage is a boss, a small red **BOSS** sign sits on the Battle button.

### Camp · Slice 1

Purpose: her home base, the pinball trees, critters wandering. Details: [08-camp.md](08-camp.md).

- A scrollable camp you can pan with a finger.
- **Tap a pinball tree** to start a math round there.
- **Tap the pinball shed** to go to the pinball screen.
- **Tap a critter** and it reacts. **Press and hold a critter** to open its detail page.
- Top bar as on the pinball screen.
- **Decorate button**, bottom right above the bar (Slice 2).

### Critters · Slice 1

Purpose: see and grow her collection. Rules: [05-critters.md](05-critters.md).

- **Filters**, at the top: all, or one element (five element icons). Sort by element, rarity or newest.
- **A grid of cards.** Each card shows:
  - the critter's art and name
  - an element icon and a rarity frame (blue for Common, purple for Rare)
  - its stars, and a thin bar showing progress to the next star
  - a gold **Evolve!** ribbon when it's ready
- **Critters she hasn't caught yet** appear at the end as dark silhouettes with "?". That makes it a collection she can see filling up.
- **Her level** is shown once at the top ("All critters: level 12"), since every critter shares her level.

#### Critter detail · Slice 1
Opened from a card, or by pressing and holding a critter in camp.

- Big art, name, element, role icon, rarity, form (T1 to T4), stars with progress, and level.
- **Stats:** HP, attack, speed and range, as simple bars with numbers.
- **Its skill:** a name and a one-line description.
- **The evolution line:** small art of each form, with forms she hasn't reached as silhouettes.
- **Evolve** button, when ready: plays the evolution overlay.
- **Use a wish box** (Slice 2). **Trial** progress (Slice 2). **Feed** (Slice 2).
- **Left and right arrows** to flip to the next or previous critter.

### Battle map · Slice 1

Purpose: pick a stage. Rules and stage list: [06-battle.md](06-battle.md).

- **Chapter header:** the chapter's name and art, with **‹ ›** to switch between chapters she has opened.
- **A winding path of stage stones,** numbered 1 to 80 and scrolling vertically.
  - Done stages show a check.
  - The **next stage** glows and bounces gently.
  - **Boss stages** (every 10th) are bigger, with a Grump-boss face.
  - Stages beyond the next one are locked.
  - In Slice 1, stages past 10 show "More soon".
- **Tap the next stage** (or any stage she's already done) to open its formation screen.
- **Boss stars earned** are shown beside each boss stone.

## Activities and sub-screens

### Math round · Slice 1

Purpose: earn pinballs. What's asked, timing, help and pay: [02-math.md](02-math.md). How the tree fills: [08-camp.md](08-camp.md).

Top to bottom:
- **✕** (top left).
- **The tree**, the top third of the screen. Pinballs grow on its branches as she answers.
- **The combo meter:** x1 to x4, getting brighter as it climbs.
- **Pinballs grown this round.**
- **The question card**, big and centred.
- **"I don't know"**, a wide, calm button above the pad.
- **The number pad:** 0–9, delete and ✓, with keys at least 80 pt, centred so either hand works.

**Leaving:** tapping ✕ asks "Stop here? Your tree keeps what it grew." Then **Keep going** or **Stop**. The pinballs she's grown wait on the tree in camp until she collects them.

**End of the round:** the tree is heavy with pinballs, and a pulsing hand says **tap the tree!** The pinballs rain down and fly into the pinball count. A short summary follows ("18 right · 12 fast · best combo x3 · +74 pinballs"). Then **Again** (another round) or **Done** (back to where she came from).

### Catcher · Slice 1

Purpose: turn a capsule into critters. Board and odds: [04-catcher.md](04-catcher.md).

- **Opening it:** when a capsule is won, a capsule overlay pops up (see Overlays) with **Open now** or **Later**. Capsules saved for later wait behind the capsule button on the pinball screen.
- **Layout:** the claw and its ball at the top, then the multiplier bars, the rails and chute, and the moving belt of critters, each with its number. At the bottom, the big **drop button** with the drops she has left. A **crate** button (bottom left) shows what this capsule can hold, and **?** (top right) shows a three-picture how-to.
- **Catch results:** once the drops are used, each caught critter pops up in turn. A new one says **New!**; one she already has shows **+1 star** with its star bar filling. Then **Done** takes her back to the pinball screen.

### Formation · Slice 1

Purpose: place her team before a stage. Rules: [06-battle.md](06-battle.md).

- **Back arrow** (top left) and the stage number.
- **Top half: the lanes,** running up the screen, each tinted by the element of the Grumps coming down it.
- **The **?** wave button:** shows the next waves (which elements, how many, what kinds) and which lane each comes down.
- **The placement grid:** 3 × 3 (5 × 3 from chapter 4), just above the bottom.
- **Her critter tray:** a scrollable row along the bottom.
- **Placing:** she drags a critter from the tray onto a slot. While dragging, each lane lights up green **Yes!** or red **No!** with a thumbs icon, so it isn't colour alone. Dragging a placed critter moves it; dragging it off the grid puts it back in the tray. Tapping works too: tap a critter, then tap a slot.
- **Start** is a big button, bottom right, active once at least one critter is placed.
- **Quick Deploy** and **Auto Battle** buttons arrive in Slice 2.

### Fight · Slice 1

Purpose: watch her team hold the lanes. It plays out on its own.

- **The lanes** fill the screen, with the Grumps coming from the top and her critters on the grid below.
- **Top bar:** the timer (it turns orange in the last 15 seconds), the wave counter ("Wave 2 of 4"), and **⏸ pause**.
- **Pause overlay:** **Resume**, **Try again**, **Leave** (leaving counts as not finished: [06-battle.md](06-battle.md)).

### Victory · Slice 1
- A big cheerful banner and two of her critters celebrating.
- **Rewards**, counted in one by one (amounts: [07-economy.md](07-economy.md)), plus a **boss star** on boss stages.
- **Next stage** or **Map**.

### Defeat · Slice 1
- A gentle banner, never grim: one of her critters sitting dizzy, with a little puff of stars.
- **Tips:** "Match elements" and "Move your critters around."
- **The battle report:** her grid shows which critters fainted, and the lanes that Grumps got through are marked.
- **Try again** (same team) or **Change team** (formation).

### Quests · Slice 2
Daily quests with progress bars and a **Claim** button on each finished one. What they are: [07-economy.md](07-economy.md).

### Settings · Slice 1
- **Music** on/off.
- **Sounds** on/off.
- **Read speech bubbles aloud** on/off (uses the iPad's voice).
- **Grown-ups:** a small button that needs **press and hold for 2 seconds**, then the grown-up PIN. Everything behind it: [02-math.md](02-math.md).

## Overlays

Small celebrations that sit over whatever screen she's on, with one big button to continue.

| Overlay | When | Slice |
|---|---|---|
| **Level up!** | The candy bar fills: "Level 13! All your critters got stronger." | 1 |
| **Capsule won** | A capsule drops from the pinball machine: Open now / Later | 1 |
| **New critter** | First catch of a critter: big art, name, element, "added to your critters" | 1 |
| **Star!** | A duplicate lands: the star bar fills and a star pops on | 1 |
| **Evolution** | She taps Evolve: the critter glows, grows and shows its new form and name | 1 |
| **Boss star** | First win on a boss stage; shows what the star unlocked ([07-economy.md](07-economy.md)) | 1 |
| **Something new opened** | A feature unlocks (from the boss star track); the guide points to it | 2 |
| **While you were away** | On opening the app, if a neighbour raided or visited her camp | 3 |
| **Jackpot!** | The jackpot slot: picks a minigame ([09-later-modes.md](09-later-modes.md)) | 3 (Slice 1: a candy bonus) |

Only one overlay at a time. Any others wait in a queue and show one after another.

## The guide

Ours: **Juniper**, a friendly young camp ranger with a big floppy hat and a satchel. She speaks in short speech bubbles (one sentence, at most two), sits at the side of the screen, and taps to continue. She appears on the first day, when something new opens, and in each screen's **?** help. She never comments on right or wrong answers. Her bubbles can be read aloud (Settings).

## First launch (about 15–20 minutes, Slice 1)

1. **Title.** The **Critter Math** logo over the hollow at dusk, then **Tap to start**.
2. **Welcome.** Juniper: "Hi! Welcome to camp. I look after the critters around here." Then: "What's your name?" A simple keyboard; a grown-up can change it later.
3. **The starters.** Four acorn capsules on a log, one each in green, orange, blue and yellow. Juniper: "These four want to join you." She taps each one to open it: the critter hops out with its name and element (the starters are listed in [00](00-names-and-numbers.md)). **She gets all four**, so her first team has four elements to try. (The real game also gives its starters rather than making you choose.)
4. **Her first tree.** Juniper walks her to a small tree in camp: "Pinballs grow on these trees when you answer questions." This first round is the **placement check**: what it asks and how it's scored are in [02-math.md](02-math.md). It looks and pays like a normal round. "I don't know" is introduced here: "If you don't know one, tap this. That's always okay."
5. **Collect.** She taps the full tree and the pinballs fly to her count.
6. **The pinball machine.** Juniper: "Now the fun part!" Steps:
   - A pulsing hand points at **PUSH**.
   - Her first launches are set up so that the capsule ring fills ([03-pinball-machine.md](03-pinball-machine.md)) and candy lands, so her first **Level up!** comes quickly.
   - The multiplier toggle is pointed out once she has more than one tier open.
7. **First catch.** The capsule overlay offers **Open now**. A hand shows when to drop. The first session is set up so she catches at least one new critter ([04-catcher.md](04-catcher.md)).
8. **First battle.** The Battle button glows. On stage 1 her four starters are already on the grid ([05-critters.md](05-critters.md)). Juniper shows her how to drag one to another slot, and what green **Yes!** and red **No!** mean. She taps Start and wins (stage 1 is easy: [06-battle.md](06-battle.md)).
9. **Back home.** Juniper: "Need more pinballs? Your trees grow them whenever you answer questions." The day is hers from here.

**If she stops partway**, it picks up at the same step next time. Each step can be skipped by a grown-up from the grown-up view.

## Loading, saving and interruptions (what she sees)

The mechanism is in [11-tech.md](11-tech.md).

- **No save button, ever.** Everything she earns or catches is kept the moment it happens.
- **Opening the app:** the title shows for at most 2 seconds, then the pinball screen. There is one exception: if the app closed in the middle of a math round, a catch session or a battle, she goes straight back into it:
  - **math round:** the question she was on is shown again (how its timing is handled: [02-math.md](02-math.md))
  - **catch session:** her remaining drops are waiting
  - **battle:** it opens paused, with **Resume**
- **Balls already falling** on the pinball machine or in the catcher when the app closes still count.
- **Something else takes over the iPad** (a notification, the Home screen, the screen turning off): battles pause, the math round's timer stops ([02-math.md](02-math.md)), and music fades out.
- **Moving between screens:** quick fades or slides of about 0.3 seconds. No loading screens longer than about a second.
