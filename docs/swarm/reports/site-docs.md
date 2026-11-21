# site-docs report

Stamped 2026-11-21T14:26Z.

## What I built
- `site/index.html` and `site/style.css`: a one-page showcase with hero (toon-style frame), highlights, an honest "not finished" list, and both library coordinates (local first, then GitHub).
- `site/img/hero-toon-brie.png`: headless render of Brie Beach Run, toon style, from `tools/render-frame.mjs`.
- `docs/HOW-TO-PLAY.md`: controls from `INPUT_KEYS` in `src/core/defs.js`, HUD, hazards (8 kinds from `HAZARDS`), Pete, tracks (from `TRACKS`), parts (`PARTS`), known gaps.
- `docs/HOW-IT-WAS-MADE.md`: contract, module owners, styles, tools, verification and non-verification, libraries, hosting, process notes.
- `README.md`: rewritten from the scaffold text. Run, build, status, libraries.
- `.github/workflows/pages.yml`: build job runs `node tools/build-web.mjs`, assembles `_site/` (site/ plus `_site/play/index.html` from `dist/pawgger.html`, plus `.nojekyll`), uploads with `actions/upload-pages-artifact`. Deploy job runs `actions/deploy-pages`. Pinned to commit SHAs with version comments: checkout v4.2.2, setup-node v4.4.0, upload-pages-artifact v3.0.1, deploy-pages v4.0.5 (SHAs resolved via `gh api`). Top-level `contents: read`. `pages: write` and `id-token: write` are on the deploy job only, not the workflow.

## Verification evidence
- `node -e "import('./tools/build-web.mjs')...buildWeb({outDir:'out/site-build'})"`: bundled OK. `pawgger.html` 355,851 bytes (about 130 KB gzipped). Output is in `out/site-build/`, not `dist/`.
- Pages assembly reproduced under `out/pages-check/` (same copy steps as the workflow). Output has `play/index.html`, `img/`, `style.css`, `.nojekyll`.
- `tools/shot.mjs` on `out/pages-check/index.html` at 390x844: no console errors, `scrollWidth` 390 = `innerWidth` 390 (no horizontal scroll). Screenshot viewed; layout is correct.
- Workflow parsed with PyYAML: jobs `build`, `deploy`; deploy permissions `pages: write`, `id-token: write`.
- Local links in `site/index.html` resolve to files that exist (`style.css`, `play/`, `img/hero-toon-brie.png`).
- `node tools/botplay.mjs --track brie --seeds 1..3 --style retro`: 3/3 finished (116-118 s). Only Brie was tested.
- NOT verified: the Actions workflow itself (not run on GitHub); the Pages URL; the desktop layout; the game in a real play session; audio; ghibli and photo visuals.

## Deviations from the contract
- Site-doc links point to GitHub `blob/main/docs/...` URLs, since `docs/` is not copied into the Pages site. Assumes the default branch is `main`. The workflow triggers on `main` too.
- The tracker address (LAN IP and port) is not in the public docs, because the repo is public and the Pages site is public. The docs say the tracker is local-network only. Override if you want the IP written in.
- Ghibli is described as "code exists, not checked by eye". Photo is described as an alias of toon.
- No `test/site-docs*.test.mjs` written. The workflow was validated by YAML parse and a local assembly dry run, not by a test file.
- No git commands run, per instructions.

## Mistakes I made and how I fixed them
- First draft said "five hazard types" and "the bot can finish every track". The defs have eight hazard kinds, and I ran only Brie. Both fixed.
- First draft linked to `HOW-TO-PLAY.html`. The docs are markdown and are not copied into the site. Changed to GitHub links.
- The first draft of the HOW-TO-PLAY track section said "three laps each, except the finale" with a five-lap finale. Checked `TRACKS` (gouda: laps 5). The ui-shell report says the Pete duel is a 3-lap Gouda Eve. I left the duel's lap count unconfirmed in the doc.
- Stink cloud and fondue effects in the hazard table: the defs only give damage values, so I dropped the effect text I had guessed.

## Learnings for a future agent
- `build-web.mjs` with `outDir` lets you build to `out/` without touching `dist/`. Its CLI always writes `dist/`.
- `render-frame.mjs` with `--style toon --steps 300` gives a clean hero frame. Retro frames at 600 steps had no visible pod in the frame (see below).
- `gh api repos/<owner>/<repo>/git/ref/tags/<tag>` resolves action SHAs without cloning.

## Requests for other modules
- Observation for render-road or ui-shell: `out/site-shots/retro-brie.png` (render-frame, retro, Brie, 600 steps, scale 3) shows no visible Colby pod in the frame, while the toon frame does. Could be the driver, the frame choice, or a retro pod draw bug. Not investigated further.
- Known from the art-pods report: `defs.js` has no `artManifest()` export, so `tools/sheet.mjs` crashes. Still open as far as I can tell.

## Factory proposals
none
