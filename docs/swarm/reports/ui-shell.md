# ui-shell report

## What I built
- `src/main.js`: fixed-step loop (DT accumulator, input polled once per frame, roll edge latched, applied to the first step only), guarded dynamic imports (renderer, autopilot, audio, art), attract mode on the title (bot-driven silent race rotating through the 8 tracks), race start/pause/restart/quit, ghost record + playback (injected as an extra pod in a copy of the view), radio/flash feed from bus events, audio unlock/music/engine, style cycling (G), integer-upscale + CRT output path, URL params (style, autostart, track, seed, laps, bot, nosound, time, touch=1), `window.__pawed` (flow, G, bus, race, view(), hash(), act(), start(), advance(n,input), setStyle, pause, toTitle).
- `src/ui/menus.js`: `createFlow` state machine (title, tracks, options, shop, results, standings, podium, pause) returning commands; tournament (10-8-6-5-4-3-2-1 pts, 2000 W champion bonus), prize money via PRIZE, records, options persistence, `createRaceTouch` (steer L/R, GAS, BOOST, ROLL, pause), pure helpers (parseParams, buildRaceInput, ghost recorder/player).
- `src/ui/screens.js`: draw functions for every screen, countdown/toast, `hitItem` for click/tap on list items.
- `src/ui/shop.js`: save schema + sanitise + persistence, buy/sell over `PARTS`, shop screen.
- `index.html`, `style.css` (8:5 canvas, pixelated for retro, touch overlays).
- `test/ui.test.mjs` (18 tests).

## Verification evidence
- `node --test test/ui.test.mjs`: 18 pass. Mutation: `prizeFor` forced to 0 turned 2 tests red; restored.
- Headless Chrome via `tools/shot.mjs --strict`: title (attract + logo + CRT), race (bot, HUD, radio), tracks, shop, options, results, touch overlay all render with no console errors. Eval-driven e2e: 1-lap time trial finishes -> results -> ghost saved -> ghost race starts with ghost loaded -> pause/resume toggles. Screenshots in `out/shots/ui-*.png`.
- Not verified: toon/ghibli/photo visuals (packs not present yet: 404 for `src/render/ghibli.js`, `src/art/ghibli/*`, which is guarded and falls back to retro); real audio (sfx.js/music.js missing, audio import fails, guarded); real touch hardware.

## Deviations from the contract
- `src/core/input.js`, `settings.js`, `ui/touch.js` are Pawgger-shaped (dx/dy/jump; settings key `pawgger.settings`, style limited to retro/ghibli, Space/Z/X all map to "jump"). I use `input.js` only for UI acts and gamepad, my own key set for racing (INPUT_KEYS), my own settings key `pawedracer.options` and save key `pawedracer.save`. `touch.js` (D-pad) is reused for menus only.
- Ghost = best single run per track recorded in Time Trial/Ghost modes (not best lap only); drawn as a normal pod with `ghost:true`, `place:9` (renderer cannot make it translucent).
- Pete duel is a main-menu item (Gouda Eve, 3 laps), not the last tournament round; the Cheese Cup is 8 normal races.
- Retry-with-arrows on the results screen only outside the cup.

## Mistakes I made and how I fixed them
- Shop message overlapped the BACK row and the long quips ran off screen: tightened row pitch to 24 and shortened the quips (also updated `hitItem`).
- Results screen name column ran into the time column: truncated to 16 chars.
- Test gave 10000 whiskers for a full max-out that costs more: raised to 100000.

## Learnings for a future agent
- `renderer.draw` sets its own transform from `ctx.canvas.width / W`; give it the offscreen logical canvas (320x200 or 1280x800) and call `renderer.resize()` after resizing.
- The HUD already draws the 3-2-1-GO and FINISH text; do not draw a second countdown over it (`drawCountdown` in screens.js exists but is unused in-race).
- `race.view().pods[i].dist` is total distance, `.z` the lap coordinate: record `dist`, play back with `z = dist mod L`.
- `tools/shot.mjs --eval "<js>"` plus `window.__pawed.act(...)` is the fastest way to screenshot any menu state.

## Requests for other modules
- render-road: HUD radio subtitle is cut off at the right edge (long Pete taunts clip at 44 chars but the text box is narrower); `src/render/renderer.js` imports `ART_NAMES` which `src/art/registry.js` does not export (`node tools/check-imports.mjs` reports it; works at runtime only because of try/catch or a late export). Please render `pod.ghost` pods translucent.
- audio: `audio.js` is the Pawgger API (`unlock/play/music/setSettings`); contract says `resume/setMusic/engine`. main.js calls `unlock`, `play`, `music`, `setSettings`, and `engine(speed01, boost)` if present. `sfx.js`/`music.js` still missing.
- core/frozen: `core/settings.js` and `core/input.js` are Pawgger-specific (see Deviations); consider replacing.

## Factory proposals
none
