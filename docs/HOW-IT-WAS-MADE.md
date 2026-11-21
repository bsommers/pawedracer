# How Pawed Racer was made

Pawed Racer is a pod-racing parody built in plain JavaScript (ES modules, Node 22+, zero runtime dependencies). It was built by a swarm of parallel AI agents, each owning one module, working against one written contract. This page explains how that worked, what tools came out of it, and what is still unfinished.

## The contract

[`ARCHITECTURE.md`](../ARCHITECTURE.md) is the binding contract. It defines the screen layout, the module owners (kept disjoint so agents never edit each other's files), the track model, the sim rules, the cross-module API, and the fairness rules. The numbers live in one file, `src/core/defs.js`, so the sim, the AI, the bot and the validator all agree on them.

The race is a deterministic sim. Every random choice goes through a seeded RNG (`createRng(seed)`), and there is no `Math.random`. The same seed gives the same race, which is what makes the bot test and the track validator meaningful.

## Modules and owners

| Module | Where it lives |
|---|---|
| Sim (pod physics, race, AI, Pete) | `src/sim/` |
| Tracks and validator | `src/levels/` and `tools/validate-track.mjs` |
| Retro renderer and HUD | `src/render/` and `src/art/registry.js` |
| Retro art (pods, characters, scenery, hazards) | `src/art/` |
| Toon style | `src/art/toon/`, `src/render/toon.js` |
| Ghibli style | `src/art/ghibli/`, `src/render/ghibli.js` |
| Audio (sound effects and music) | `src/audio/`, `tools/sfx-wav.mjs`, `tools/music-wav.mjs` |
| UI and shell | `src/ui/`, `src/main.js`, `index.html` |
| Bot | `src/sim/autopilot.js`, `tools/botplay.mjs` |
| Characters pipeline | `tools/character-pipeline/` |
| Site and docs | `site/`, `docs/`, `README.md` |

Shared, frozen pieces were copied from the earlier Pawgger game: the pixel buffer, the font, the input layer and the kits.

## Styles

The sim is shared, and four visual styles draw over it:

- **retro**: the 320x200 pixel-art canvas, integer-scaled. This is the reference style.
- **toon**: drawn at higher resolution (1280x800) with painter-kit surfaces.
- **ghibli**: a second high-resolution pack. Code is present. It has not been checked by eye in a real session.
- **photo**: not built. It currently aliases the toon style.

Pressing G cycles the styles.

## Tools that came out of the work

All of these are zero-dependency Node scripts in `tools/`:

- `build-web.mjs`: builds the game. It bundles with esbuild (fetched through `npx`) and writes `dist/web/` plus `dist/pawgger.html`, a single self-contained file that runs from `file://`. Use `--no-bundle` to skip esbuild.
- `botplay.mjs`: plays whole races with the bot, for example `node tools/botplay.mjs --track brie --seeds 1..3 --style retro`.
- `validate-track.mjs`: checks that tracks are fair (cornering speeds, hazard clearance, loop closure) across seeds.
- `render-frame.mjs`: writes a PNG of one frame from the real sim. The screenshot on the site came from this tool.
- `shot.mjs`: drives a headless Chrome over the DevTools protocol, for screenshots and key input.
- `serve.mjs`: the local dev server (`npm start`, port 4861).
- `swarm-tracker/`: a dashboard that agents reported progress to during the build. It runs on the developer's machine on the local network only.

## Verification and what it does not cover

What was checked:

- The single-file build completes and produces one HTML file of about 350 KB (about 130 KB gzipped).
- The bot finished the Brie Beach Run test seeds in headless runs.
- Sample frames of Brie Beach Run (toon) and Gouda Eve (toon) were rendered and looked at.

What was not checked:

- Ghibli and photo visuals in a real session.
- Audio. Sound effects and music are generated from code. Nobody has listened to them. Volume, loops and balance are unverified.
- Human play. The bot is not a player, and the difficulty and fun have not been tested.
- Track fairness on every track and seed. The validator defines the check; this page does not claim it passes everywhere.

## Libraries

Art and characters come from two sibling libraries:

- `../pawfall-assets` (local) or [github.com/bsommers/pawfall-assets](https://github.com/bsommers/pawfall-assets): Colby sprites, treasures, effects, sound effects and songs.
- `../character-library` (local) or [github.com/bsommers/character-library](https://github.com/bsommers/character-library): characters in all styles, with Super Colby and Perring Parkway Pete as seeds.

`libraries.json` lists both. Install with `factory library install --project . --registryId <id> --assets <ids>`.

## Hosting

The site is built by `.github/workflows/pages.yml`. On a push to `main`, it:

1. Builds the single-file game with `node tools/build-web.mjs`.
2. Copies `site/` to `_site/` and the game to `_site/play/index.html`.
3. Uploads `_site/` with `actions/upload-pages-artifact` and deploys it with `actions/deploy-pages`.

The published URL is https://bsommers.github.io/pawedracer/, and the game is at `/play/`.

## Process notes

- The per-agent reports, progress notes and prompts live in `docs/swarm/`. Reports and progress notes are the most useful record of what each agent found and deviated from.
- Some of the working files (`docs/swarm/prompts/`, `docs/swarm/progress/`, `docs/CHECKPOINT.md`) are excluded from git by `.gitignore`.
- Build output goes to `dist/` and scratch output to `out/`. Both are excluded from git.
