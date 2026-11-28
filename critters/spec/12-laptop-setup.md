# Getting the laptop and Ellie's iPad ready

For you, before the first build session. The game is built on your personal laptop, which **has to be a Mac**: iPad apps can only be built with Apple's Xcode, which only runs on a Mac. Most steps are one-time. Where a menu name might be slightly different on your machine, it says "about".

## 1. Check which iPad Ellie has

On her iPad: **Settings → General → About**. Note the **Model Name** and the **iPadOS version** (about: "Software Version" or "iOS Version").

This sets the oldest iPadOS the game has to support. The plan is iPadOS 17 or newer.

**Already known:** an **iPad mini (5th generation)** on **iPadOS 26.5.2**.

## 2. Check the Mac

Apple menu () → **About This Mac**. Note the macOS version and how much free disk space there is (about: System Settings → General → Storage).

- Xcode needs a fairly recent macOS. If the App Store says Xcode won't install, update macOS first: **System Settings → General → Software Update**.
- Plan on **about 50 GB free**. Xcode and the iPad simulator are large.

## 3. Install Xcode

**Done:** Xcode is already installed on the laptop. Just make sure it's up to date (App Store → Updates) and that the iOS platform is installed (item 2 below), then run item 3 once.

1. Open the **App Store** on the Mac, search for **Xcode**, and install it. It's free and a big download, so start it on good Wi-Fi.
2. Open Xcode once. Let it install its extra components, and when it asks which platforms to add, include **iOS** (this covers iPad).
3. Open **Terminal** (in Applications → Utilities) and run:
   ```bash
   xcode-select --install
   ```
   If it says the tools are already installed, that's fine.

## 4. Sign in to Xcode with your Apple ID

In Xcode: **Xcode → Settings → Accounts** (about), click **+**, choose **Apple ID**, and sign in. This lets Xcode put apps on Ellie's iPad.

## 5. How the game gets onto her iPad

**Decided: the Apple Developer Program**, which you've already joined ($99 a year). That means:

- New versions reach Ellie's iPad **over the air through TestFlight**, and each lasts **90 days** (step 10).
- During the early building you can still plug her iPad in and install straight from Xcode (step 9), which is quicker for trying things out. Builds installed that way last a year with the paid program.

In Xcode's Accounts settings (step 4), your Apple ID should show your team as **(Individual)** or your name, not "Personal Team". If it only shows "Personal Team", sign out and back in.

## 6. Get this project onto the laptop

The project lives on GitHub at **chriswllms05/Ellie-math**. Pick one way:

- **GitHub Desktop** (easiest): install it from desktop.github.com, sign in, then **File → Clone Repository** (about) and pick **Ellie-math**. Choose a folder you'll remember, for example your Documents folder.
- **Terminal:**
  ```bash
  cd ~/Documents
  ```
  ```bash
  git clone https://github.com/chriswllms05/Ellie-math.git
  ```

The game's documents are on `main` (merged on 2026-11-28). If the repo was already on the laptop, pull the latest `main` first (in GitHub Desktop: **Fetch origin**, then **Pull**).

## 7. Install Claude Code on the laptop

Install the **Claude app** for Mac from **claude.ai/download** and sign in. Claude Code is in the app (about: its **Code** tab). If you'd rather use it in Terminal, Claude can walk you through installing the command-line version.

## 8. Start a session on the laptop

Start a new **local** Claude Code session (one that runs on your Mac, not in the cloud) and point it at the **Ellie-math** folder from step 6. Only a session running on the Mac can use Xcode.

Then say something like:

> We're building the critter game in `critters/`. Read `critters/README.md`, then `critters/spec/13-build-plan.md`, and start milestone M0. Ellie's iPad is an iPad mini (5th generation) on iPadOS 26.5.2. I'm in the Apple Developer Program, and Xcode is installed.

**Your vault.** All the docs (the README, the design, the specs and the research notes) also belong in your ChrisOS vault, under **Projects/Critter Math**. In that first session, also say:

> Copy the docs into my vault with `critters/tools/sync-to-vault.sh`, then add a Stop hook to `.claude/settings.local.json` that runs it, so the vault stays up to date after every turn.

The script finds the vault on its own (iCloud Obsidian, iCloud Drive, Documents or your home folder) and only copies files that changed. If your Mac asks whether Claude may access files in iCloud Drive, allow it. The hook goes in the laptop's own settings file, which isn't shared, and Claude Code asks you to approve it.

## 9. The first time you install on her iPad by cable

1. Plug her iPad into the Mac with a cable. On the iPad, tap **Trust** when it asks about the computer, and enter her passcode.
2. Claude (or you, in Xcode) picks her iPad as the place to run the app and starts it.
3. The first time, the iPad asks for **Developer Mode**: go to **Settings → Privacy & Security → Developer Mode**, turn it on, and let the iPad restart. After it restarts, confirm when asked. (The switch only shows up after the iPad has been connected to Xcode once.)

## 10. TestFlight (you have the Developer Program)

Claude can do most of this from the Mac; the parts that need your Apple sign-in are yours.

1. In **App Store Connect** (appstoreconnect.apple.com), create a new app record for the game. It stays private; nothing goes to the App Store.
2. Claude builds and uploads a version from Xcode.
3. In App Store Connect, under **TestFlight**, add yourself as an **internal tester**.
4. On Ellie's iPad, install the free **TestFlight** app from the App Store, and open the invite. New versions then show up in TestFlight to install with one tap.

TestFlight installs to the Apple ID that the iPad's App Store uses. **Her iPad's App Store uses your Apple ID** (she has no Apple ID of her own), so this just works: you add yourself as the tester.

## Questions to answer in the first session

None left: the iPad, the iPadOS version, Xcode and the Developer Program are all settled.
