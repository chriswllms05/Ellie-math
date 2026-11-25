# How the app is built

For the Claude session that builds the game. Words and shared numbers come from [00-names-and-numbers.md](00-names-and-numbers.md); what each screen and system does comes from the other specs. This one says how the code is laid out, how state is saved, and how it's tested.

## Platform

- **Native iPad app** in Swift (Swift 6 language mode, Xcode 16 or newer). Apple frameworks only: no third-party packages, SDKs or CocoaPods.
- **SwiftUI** for the app shell, menus, the math round, the grown-up view and every non-game screen.
- **SpriteKit** for the four game scenes: pinball machine, catcher, battle, camp. Each is hosted in SwiftUI with `SpriteView`.
- **Minimum iPadOS: 17.** 17 is the floor because the app model uses the Observation framework (`@Observable`).
- **The device to design and test for:** Ellie's iPad is an **iPad mini (5th generation)**: A12 chip, 3 GB of memory, a 7.9-inch 60 Hz screen (no ProMotion), **768 × 1024 points** held upright, drawn at @2x. Her parent read the iPadOS version as "20.6.5.2", which isn't a number Apple uses; it's most likely iPadOS 18 or 26, and either is above the minimum. Check it on the iPad in the first build session. Xcode must be new enough to install on her iPad's iPadOS; current Xcode is.
- **iPad only, portrait only** (portrait and portrait upside-down). `UIRequiresFullScreen = YES`, so no Split View or Slide Over to lay out for. Status bar hidden in game scenes.
- **No network, no accounts, no analytics, no ads, no purchases.** The app requests no network entitlement and makes no network calls. Nothing leaves the iPad except a backup file she or a grown-up chooses to share.

## Folders

Everything lives under `critters/app/` in this repository. The old Ellie Math app at the repository root is untouched.

```
critters/app/
  Critters.xcodeproj          working name; renamed when the game has a title
  Critters/                   the app target
    App/                      CrittersApp.swift, AppModel.swift (the @Observable store), Router
    Screens/                  SwiftUI views, one folder per screen in 01-screens
    Math/                     the math round view, number pad, help views
    Scenes/                   PinballScene, CatcherScene, BattleScene, CampScene
    Nodes/                    shared SpriteKit nodes (critter sprite, ball, gauge, popups)
    Audio/                    SoundPlayer
    Persistence/              SaveStore (files), BackupExporter
    GrownUp/                  grown-up view, PIN entry, Keychain helper
    Debug/                    debug menu (DEBUG builds only)
    Resources/                Assets.xcassets, sprite atlases, Sounds/, Fonts/, Localizable.xcstrings
  CrittersTests/              app-level tests (save files, scene logic that needs SpriteKit)
  CrittersUITests/            XCUITest flows and screenshots
  GameCore/                   local Swift package: every rule, no UI
    Package.swift
    Sources/GameCore/
      Tuning.swift            every (tune) number, in one place
      Random/                 GameRNG
      Time/                   GameClock, day boundaries
      Math/                   skills, question generators, grading, combo, mastery, round planner, placement
      Economy/                wallet, pinball odds and payouts, level curve, rewards, boss star track, daily quests
      Catcher/                capsules, find chances, catch counts
      Critters/               species catalogue, owned critters, stats, stars, evolution, skills
      Battle/                 grid, Grumps, waves, damage, the simulation step, stage catalogue
      Save/                   SaveGame (Codable), migrations
    Tests/GameCoreTests/      unit tests, simulations, save fixtures
```

## GameCore: the rules, kept pure

**GameCore imports Foundation only.** No SwiftUI, UIKit, SpriteKit, AVFoundation, CryptoKit, OSLog or Combine. That keeps every rule unit-testable in seconds with `swift test`, and lets it build on Linux, so cloud sessions (which can't run Xcode) can still work on the rules. A test fails the build if any GameCore file imports a UI framework.

`Package.swift`: tools version 6.0, platforms `.iOS(.v17), .macOS(.v14)`, one library product `GameCore`, one test target.

What lives where:

| GameCore (rules) | App (presentation) |
|---|---|
| Question generation, grading (fast / slow / wrong / "I don't know"), combo, mastery, round planning, placement ([02-math.md](02-math.md)) | The number pad, timing capture, help pictures, round screen |
| Pinball slot odds, multiplier tiers, costs and payouts, gauges, level curve ([03](03-pinball-machine.md), [07](07-economy.md)) | The board, ball physics, animation, sound |
| Capsule contents, which critters ride the belt, balls needed, catch results ([04-catcher.md](04-catcher.md)) | The catcher board, claw, bars, conveyor, ball physics |
| Species catalogue, stats, stars, evolution, skills ([05-critters.md](05-critters.md)) | Critter sprites, lists, evolution animation |
| Battle simulation: positions, attacks, damage, status effects, waves, timer, win/lose ([06-battle.md](06-battle.md)) | Drawing the simulation, placement drag and drop, effects |
| Rewards, boss stars, unlocks, daily quests ([07](07-economy.md)) | Reward popups |
| The save model and migrations | Reading and writing files, backup export/import |

**Types:** value types (`struct`, `enum`), `Codable`, `Sendable`, `Equatable`. State changes are functions that take state plus inputs and return results (`func launch(_ wallet: inout Wallet, multiplier: Int, rng: inout GameRNG) -> LaunchResult`), so tests can drive them directly.

**Catalogues** (species, Grumps, stages, skills) are Swift data files (static arrays of structs) rather than JSON, so the compiler checks them. Tests check their invariants: every species has the number of forms its rarity calls for in 00, every stage's waves are valid, and so on. Display names come from the String Catalog in the app, keyed by stable IDs (`critter.grass.starter.1`), so renaming a critter (Ellie may) never touches a save file.

**Tuning.swift** holds every number marked (tune) in the specs, each with a comment naming the spec it comes from. Changing the economy means editing one file.

## The app model

- `AppModel` is a `@MainActor @Observable` class holding the current `SaveGame` and the services (SaveStore, SoundPlayer, GameRNG, GameClock). Screens read from it; actions call GameCore and then ask SaveStore to save.
- Navigation: a `NavigationStack` / router enum for menus; the game scenes are full-screen views. 01-screens owns what the screens are.
- SpriteKit scenes get what they need from `AppModel` when presented and report results back (`onLaunchFinished(slot:)`, `onCatchFinished(results:)`, `onBattleFinished(outcome:)`). Scenes never write the save themselves.

## Saving

- **One save file**: `SaveGame`, a Codable struct with `schemaVersion: Int`, written as JSON to `Application Support/save.json`.
- **Atomic writes:** encode, write with `.atomic`, then move. Before replacing, the previous file is kept as `save.prev.json`.
- **Daily snapshots:** the first save each day also writes `snapshots/save-YYYY-MM-DD.json`; keep the last 14 (tune).
- **Loading:** try `save.json`; if it's missing or won't decode, try `save.prev.json`, then the newest snapshot that decodes. If one of those is used, record it so the grown-up view can say "restored from yesterday's copy".
- **Picking up where she left off:** reopening the app returns her to the same place. A math round resumes at the next unanswered question (pinballs already grown stay on the tree); a catch session resumes with the same belt, counts and drops left, from the moment before the last drop; a battle restarts from the start of the wave she was on. Everything needed for that lives in the save file.
- **When to save:** after every math answer, every catch session, every battle, every purchase or evolution, and when the app goes to the background (`scenePhase` changes). Pinball launches can be many per second, so those saves are coalesced: at most once a second, plus on background.
- **Migrations:** each schema change bumps `schemaVersion` and adds a step `migrate(fromVersion n: Int, json: [String: Any]) -> [String: Any]`. Loading runs every step from the file's version to the current one, then decodes. Every old version keeps a fixture file in the tests.
- **Backup:** the grown-up view exports the save as a file (`Critters-backup-YYYY-MM-DD.json`) through the share sheet (`ShareLink`), so it can go to Files, AirDrop or Mail. **Restore** uses `.fileImporter`, checks the file decodes (after migration), asks for confirmation, and keeps a safety copy of the current save first.
- **Math history:** every answer is logged (question ID, skill, her answer, right or not, time in milliseconds, fast/slow, help shown, timestamp) for mastery and the grown-up view. Keep every answer for 120 days (tune), then fold older ones into daily totals so the file stays small.

## Randomness

- **One seeded RNG**, `GameRNG` (xoshiro256** seeded through SplitMix64), conforming to `RandomNumberGenerator`. Every random choice in GameCore takes it as `inout`. Nothing calls `Int.random(in:)` without passing it.
- Its state lives in the save file, so closing and reopening the app can't re-roll an outcome.
- Tests and simulations pass a fixed seed and get the same results every run.
- Separate streams for separate systems (math, pinball, catcher, battle), each derived from the main seed, so adding a roll in one system doesn't change results in another.

## Time

- `GameClock` protocol (`now`, `today`), with the real clock in the app and a settable clock in tests and the debug menu.
- **A day** for mastery ("fast on two different days"), daily quests and snapshots starts at **4:00 a.m. local time** ([00](00-names-and-numbers.md#days)), so a late-evening round counts as that day.
- If the device clock goes backwards, nothing is awarded twice: GameCore keeps the latest day it has seen and never treats an earlier day as new.
- **Answer timing** is measured in the app with a monotonic clock (`ContinuousClock`), from the moment the number pad becomes active to the moment she submits. If the app leaves the foreground mid-question, that question's time is thrown away and it's asked again. 02-math owns what counts as fast and how keypresses are treated.

## Game loop and physics

- **SpriteKit** drives each scene's frame loop. `SpriteView` gets `preferredFramesPerSecond: 120`; Ellie's iPad mini runs at 60, and ProMotion iPads at 120.
- **Pinball and catcher** balls move by a small fixed-step physics stepper in GameCore (circles against pegs, rails, posts and bars; balls don't hit each other), not by SpriteKit's physics engine. The scenes only draw what the stepper says. That keeps both testable without an iPad and lets simulation tests run thousands of drops quickly.
- **Pinball outcomes are rolled first.** GameCore picks the slot from the shares in 00 when she launches, then plays back a ball path recorded earlier by the stepper that ends in that slot, chosen for the top bumper's position at launch (the path library: [03-pinball-machine.md](03-pinball-machine.md)). That guarantees the odds in 00 and keeps the outcome in the saved RNG. A build-time tool in the GameCore package makes the path library; it's run again whenever the board changes.
- **Catcher** balls run live on the stepper, so where they land depends on her timing. When a ball's centre crosses a multiplier bar, the stepper spawns the extra balls just below it (each ball passes a given bar once). GameCore counts the balls that land on each critter and decides catches ([04-catcher.md](04-catcher.md)).
- **Battle** is not physics. It's a deterministic simulation in GameCore that advances in fixed ticks (**30 ticks a second**, tune) from the team, the stage and the seed. The scene runs an accumulator in `update(_:)`, steps the simulation as many ticks as time allows, and draws positions interpolated between the last two ticks. The same team, stage and seed always give the same battle, which is what makes balance tests possible.
- **Camp** is mostly animation (critters wandering, trees, decorations); no physics needed.

### Keeping dozens of balls cheap

- Balls are small circles (`SKPhysicsBody(circleOfRadius:)`), one shared texture from an atlas.
- **Balls don't collide with each other** (their `collisionBitMask` leaves out the ball category). They collide with pegs, rails, walls and bars; they report contacts only where the game needs them (slots, critters, bars, gauges).
- `usesPreciseCollisionDetection` stays off except on the single pinball if testing shows it tunnelling through pegs.
- A ball is removed the moment it lands or leaves the board.
- **Live ball cap in the catcher: 150** (tune). Beyond that, extra balls are counted, not drawn: the chute shows a denser stream and the count still goes down by the full number.
- Category bitmasks are defined once in a `PhysicsCategory` option set.

## Performance targets

- **60 fps steady** on Ellie's iPad mini (its screen's top speed) in every scene, including a catcher drop that hits x20 then x5 (100 balls). **120 fps** on ProMotion iPads where it holds.
- Launch to the first interactive screen in under 2 seconds.
- No memory growth over a 30-minute session (check with Instruments' Allocations).
- Debug builds show SpriteKit's `showsFPS`, `showsNodeCount` and `showsDrawCount`. Profile on the real iPad with Instruments (Time Profiler, Game Performance) before each TestFlight build.
- Sprites come from texture atlases; no per-frame allocations in `update(_:)`; particle emitters only for short bursts.

## Sound

- `SoundPlayer` uses **AVAudioEngine** with sound effects preloaded into buffers (lower and steadier latency than `SKAction.playSoundFileNamed`), a small pool of player nodes for overlapping effects, and a separate looped music player.
- Audio session category **`.ambient`**: it respects the iPad's silent switch and mixes with other audio.
- Separate volume/mute for music and effects in settings. 10-art-and-sound owns the sound list.

## Accessibility

- **Reduce Motion** (`@Environment(\.accessibilityReduceMotion)` in SwiftUI, `UIAccessibility.isReduceMotionEnabled` in scenes): no screen shake, no full-screen flashes, shorter celebrations. The physics still plays.
- **Dynamic Type** in menus and the grown-up view only. Game scenes and the math round use fixed sizes laid out for the iPad.
- Elements are never shown by colour alone: each has an icon too.
- Buttons in menus get accessibility labels. Full VoiceOver play is not a goal.

## The grown-up PIN

- The PIN is stored in the **Keychain** (generic password item, this device only, available after first unlock) as a salted SHA-256 hash (CryptoKit, in the app, not GameCore). Never in the save file or `UserDefaults`.
- Restoring a backup doesn't change the PIN. A "forgot PIN" path resets it only after a confirmation that needs a grown-up (02-math owns the grown-up view's design).

## Debug menu (DEBUG builds only)

Reached by a hidden gesture in debug builds; compiled out of release builds. It can: add pinballs, candy, capsules and wish boxes; set her level; give a critter or duplicates; jump to a stage; set the game clock forward by days; replay the first-launch flow; show the current RNG seed; force a pinball slot. Every milestone in [13-build-plan.md](13-build-plan.md) uses it for the parent's checks.

## Testing

**GameCore** (Swift Testing, `import Testing`; `swift test` in `critters/app/GameCore`):
- Table-driven tests for every rule: grading, combo steps, mastery across days, multiplier tiers, costs and payouts, level-ups, catch counts, star and evolution thresholds, damage and element multipliers.
- **Pinball slot shares:** 100,000 launches with a fixed seed land in each slot within ±0.3 percentage points of 00.
- **Catcher find chances:** 100,000 capsule openings match 04's chances within ±0.5 points.
- **Economy simulation:** simulated players (a quick knower, a careful counter, a fast guesser; profiles of speed and accuracy) play thousands of simulated days: math rounds → pinballs → launches → candy, capsules → catches → levels → battles. Assertions are the balance targets in [07-economy.md](07-economy.md) (where she should be after day 1, week 1, month 1), and that the guesser earns fewer pinballs per minute than the knower and the counter.
- **Battle:** the same team, stage and seed always produce the same result; for each stage, the team the economy simulation predicts she'll have wins at the rate 06/07 target.
- **Catalogues:** every species, stage and skill passes its invariants.
- **Saves:** round trip; every old-version fixture migrates and decodes; a corrupted `save.json` falls back to `save.prev.json`, then to a snapshot.
- **Purity:** no GameCore source file imports a UI framework.

**App** (`CrittersTests`, XCTest): SaveStore against a temporary directory; backup export and import; the pinball scene plays the rolled slot's path to the end and shows the right payout (scene presented in an offscreen `SKView`).

**UI flows** (`CrittersUITests`): launched with `-uiTesting`, which uses a fixed seed, a fixed clock, fast animations and an optional save fixture. Flows: first launch through the placement check, a math round, a pinball launch, a catch, and battle stage 1; the grown-up view behind the PIN; backup export. Each flow attaches screenshots.

**Screenshots:** before each milestone is called done, capture every screen on an iPad simulator matching Ellie's model plus an 11-inch and a 13-inch iPad, and look at them.

**Commands:**
```
cd critters/app/GameCore && swift test
xcodebuild test -project critters/app/Critters.xcodeproj -scheme Critters \
  -destination 'platform=iOS Simulator,name=<an iPad simulator matching Ellie's model>'
```

## Code style

- Swift 6 language mode with strict concurrency on. UI code is `@MainActor`; GameCore is plain `Sendable` values.
- No force unwraps (`!`) or `try!` outside tests. No `fatalError` on save or load paths: fall back and report.
- Every number from a spec lives in `Tuning.swift` or a catalogue, never inline in a view or scene.
- Names in code follow 00: `Critter`, `Grump`, `pinballs`, `candy`, `Capsule`, `WishBox`, `BossStar`, `MathRound`, `Combo`.
- Player-facing text lives in `Localizable.xcstrings` (English only), so wording and names change in one place.
- Format with `swift-format` (ships with Xcode 16 and newer) using its default style.
- Small files; one type per file in GameCore.

## How Claude sessions work in this repository

- **Build on a branch**, never directly on `main`. The old app at the repository root stays untouched.
- **Run `swift test` (and, on the Mac, the Xcode tests) before every commit.** Don't commit with failing tests.
- **Keep GameCore pure.** If a rule needs a UI framework, it isn't a rule: move that part into the app.
- **When behaviour changes, change the spec in the same commit.** New decisions go in [DESIGN.md](../DESIGN.md) under "Decisions made", with the date. Shared numbers change in 00 and `Tuning.swift` together.
- **Never commit screenshots or art from the real game.** The repository is public.
- **Cloud sessions** (Linux, no Xcode) can work on GameCore and the specs if a Swift toolchain is available; anything that needs the app, the simulator or the iPad happens in a session on the Mac laptop.
- Version numbers: `0.<milestone>` for the marketing version during Slice 1 (0.0 for M0 … 0.7 for M7), and a build number that goes up by one for every TestFlight upload.
