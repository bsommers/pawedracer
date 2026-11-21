# ghibli-style report
## What I built
- `src/art/ghibli/{draw,pods,chars,hazards,scenery,backdrop,fx,index}.js`: complete painterly pack, every name in `defs.ART` (pods, chars, hazards, pickups, scenery, backdrop, fx, ui) via `build(kit)` at HI_SCALE (frames = painter-kit surfaces). Gradient-shaded bodies, soft ink line, glow dots, paper grain on skies.
- `src/render/ghibli.js`: `theme(biome)` watercolour overrides for all 8 biomes, `hooks.{beforeSky,afterWorld,afterHud}` (light shafts, dappled leaf shadow, biome motes: petals/snow/embers/spores/fireflies, dusk/night grade, boost glow, vignette), music colour hooks (`MOODS` per MUSIC name, `setMusic(name)`, `attachBus(bus)`, auto-inferred `race_<track.id>`; slow cross-fade plus a gentle beat pulse).
- `test/ghibli.test.mjs`: 13 tests (manifest, determinism, <400 ms, hooks safe on the recording ctx).
## Verification evidence
- `node --test test/ghibli.test.mjs`: 13 pass. Browser build time of all modules about 15 ms.
- Looked at contact sheets (out/previews/gh-{pods,chars,chars2,haz,sc,sc2,bg,fx}.png) via `out/ghibli-sheet.html` + `tools/shot.mjs`; fixed pine clipping, podium overflow, roll/wreck clipping.
- Real game: `/index.html?style=ghibli&autostart=1&track=brie` renders the pack with no console errors (out/previews/gh-game.png).
- Numeric bbox (out/ghibli-bbox.html): pod bodies end within ~2 px of the bottom row; remaining "touches edge" hits are soft glows/shadows/backdrop discs by design.
## Deviations from the contract
- `tools/sheet.mjs <module>` cannot run a pack (it loads `src/art/<m>.js` with PixBuf, no pixels in Node), so it never prints OK for ghibli; I used browser sheets plus the Node test instead.
- Outline is `G.ink` (= `PAL.outline`) at 0.5 logical px (2 device px), not 1 logical px: 4 px would look heavy at HI_SCALE.
- Palette is the pack's own (`G` in draw.js), defs has no ghibli palette (Pawgger's `GPAL` is absent).
- Browser frames are canvases with `.w/.h` set to device pixels (what `scene.js drawSprite` needs for its source rect); backdrop frames carry LOGICAL w/h (640xH) because `scene.js drawSky` uses `f.w` as destination width.
## Mistakes I made and how I fixed them
- Pine tiers overflowed the top; podium faces overflowed the sprite; roll frames clipped. Fixed after viewing the sheets.
## Learnings for a future agent
- painter-kit has no pixels in Node: verify art in headless Chrome (`node tools/shot.mjs --url "/out/ghibli-sheet.html?m=pods&s=1" --out ... --wait-for "window.DONE"`).
- Hooks run inside the renderer's scaled ctx: draw in 320x200 logical coordinates.
## Requests for other modules
- render-road: `drawSky`/backdrop use `f.w` as destination width, wrong for hi-res frames (works for my pack only because of the logical-w workaround). Better: use `art.get(n).w` (logical) for dest and `f.w` for the source.
- render-road: `toDrawable` returns non-PixBuf frames untouched; fine for canvases, but a surface object (no canvas) would break `drawImage`.
- ui-shell (optional): call `ghibli.setMusic(name)` / `attachBus(bus)` for exact song colour; otherwise inferred from track id.
- Palette wish: a `PAL.paper`/soft-shadow colour and a sky ramp.
Factory proposals: none
