# Status note (written overnight)

## Where things are

**Ellie Math v1 is built and working** in `ellie-math/` on this session's branch (`claude/math-facts-learning-app-vkrniw`). It's a standalone folder; nothing in the Alero site pages links to it or changed. Everything from SPEC-v1 that was marked v1 is in, including the items added after the adversarial review of the plan.

Verified so far:
- Browser play-tests pass: five personas (knower, guesser, counter, IDK-spammer, mixed), a six-day run, and content sanity across every fact and ~2,000 generated items.
  - The **guesser** earned fast credit on 1 of 53 items and got 52 rushed flags.
  - The **IDK-spammer** owns zero facts after a full session (no credit through help).
  - The **counter** (right but slow) is logged as slow-right, not known.
  - Over six simulated days, facts became "hers" only from day 2 and no fact climbed past box 3 (spacing holds).
- Screenshots of every screen type reviewed by eye; layouts are clean on an iPad-sized viewport.

## Not done / needs you

1. **Push to GitHub failed (403)**: Claude doesn't have access to `chriswllms05/alero-site`. Everything is committed locally in this session. Fix at https://claude.ai/connect-github (reconnect, and install the Claude GitHub App on the repo if it isn't). Then say "push" and I'll push. Longer term this should live in its own repo, not the Alero one; that's a two-minute move once access works.
2. **Hosting**: the app needs an https origin for speech, offline and home-screen install. GitHub Pages from its own repo is the simplest. Until then you can run it from your Mac: `python3 -m http.server 8000` inside `ellie-math/`, then open `http://<mac-ip>:8000/` on the iPad.
3. **Test on her iPad before day 1**: speech voice and timing, the mute switch, microphone permission for voice clips, Add to Home Screen. I can't test real Safari here.
4. **One worksheet photo**: is her homework rounding 4-digit numbers to the nearest 10/100, or to the nearest 1,000? Both are in; it decides what the School-work part leads with.
5. An **adversarial review of the built code** ran overnight (see below for what it found and what I fixed).

## How to look at it right now

Open `ellie-math/index.html` in a browser on the Mac for a quick tour (sound and install need a server; everything else works). Read `FIRST-WEEK.md` before her first session.

## Decisions I made without you (easy to change)

- Default session is 3 × 5 min. Evening review (due facts only) appears on the home screen after the daily session is done.
- "Name your trick" buttons appear only on the derived-strategy rungs while a fact is still learning.
- "How did you know?" pops up after every 4th fast fact.
- Voice clips play at: a fact becoming hers (max 2 per session), a skill unlocking, and the end of a session where she learned something she didn't know.
- The School-work part falls back to Big-numbers items if nothing in it is open yet.
