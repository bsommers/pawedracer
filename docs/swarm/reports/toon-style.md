# toon-style report

## What I built
- `src/art/toon/vec.js`: tiny deterministic polygon rasteriser over PixBuf at HI_SCALE (outlined cel fills with a crescent shade tone, round-join strokes, Catmull-Rom blobs, banded gradients, glow, point-transform for tilt/roll). Node + browser, no Math.random.
- `pods.js` (colby, pete, r1-r5 x5 steer frames, flame, shadow, 6-frame roll, wreck), `chars.js` (portraits, mice, podium figures, PAWED RACER logo), `hazards.js` (8 hazards + 5 pickups), `scenery.js` (16 billboards), `backdrop.js` (3 skies + 5 tileable horizon layers, period 640), `fx.js` (8 fx + hud_frame/heat/icons/cursor/shop_parts), `index.js` (empty build + buildAll helper).
- `src/render/toon.js`: `theme(biome)` saturated cel palettes, `hooks.afterWorld` (cel vignette + hud_frame plates under the HUD text), `hooks.afterHud` (red heat edge pulse).
- `test/toon.test.mjs`: manifest/frame/size, determinism (sha1 of two builds), build < 400 ms per module (87 ms worst), non-empty and transparent background, pod feet/clipping, registry pack load (no errors, no fallbacks).

## Verification evidence
- `node --test test/toon.test.mjs`: 8 pass, 0 fail.
- Looked at contact sheets (`out/previews/toon/*.png`) for every module and fixed: pod dome clipping and ring look, roll frames clipped, logo overlap, banner text, blocky cat head.
- `node tools/render-frame.mjs --style toon --track brie` renders (out/toon-frame.png): pod, hazards, scenery, HUD plates all appear in toon art.

## Deviations from the contract
- `sheet.mjs <module>` imports `src/art/<mod>.js`; toon lives in `src/art/toon/`, so I ran `sheet.mjs toon/<m>` (manifest check is skipped there; EXTRA warnings are expected, the real manifest check is in the test).
- Pack ignores the painter-kit (Node shim records calls, no pixels) and draws through my own PixBuf rasteriser so Node tests, determinism and sheets work. build(kit, opts) signature kept.
- tunnel sc_tunnel opening is transparent so the road shows through.

## Mistakes I made and how I fixed them
- cel() with null shade colour crashed: made null mean "auto shade". Roll frames clipped at 90 degrees: scaled pod 0.7 about its centre.

## Learnings for a future agent
- Draw in logical units; Cv scales by HI_SCALE. Fill under stroke gives outline thickness = half stroke width outward.
- Periodic ridge functions with integer frequencies make seamless 640 px layers.

## Requests for other modules
- render-road: `scene.js` drawSky uses `f.w`/`f.h` of the frame (pixel size) for tiling; hi-res packs need `art.get(name).w/h` (logical). In the toon frame the sky/hills layers are drawn 4x too big (green wash above the horizon). Same check anywhere `frames[0].w` is used as logical size (pod body height uses a ratio so it is fine).
- Palette wish: a TOON_PAL entry for cheese yellow/rind and sky blues (I used PAL.cheese etc. and local hexes).

## Factory proposals
- `../game-factory/proposed/pawedracer/toon-vec.js` (+ CHANGELOG entry).
