# Notes for Claude

- **New work goes in `critters/`.** Since 2026-11-25 the project is a brand-new math game that copies Clash of Critters' gameplay, with math answers earning the pinballs. Start with `critters/DESIGN.md` (decisions and open questions) and `critters/research/clash-of-critters.md` (how the real game plays).
- **Everything at the repository root is the old Ellie Math app** (v1 practice and the v2 village). Ellie still uses it on GitHub Pages, so leave it as it is. Its docs (`DESIGN-v2.md`, `STATUS.md`, `README.md`) are history, not plans for the new game. Don't reuse its code or design unless asked.
- **Cloud sessions for this game should run on the `ellie-math` environment.** It allows the Clash of Critters wiki and guide sites. The user prefers that Claude handle environment setup.
