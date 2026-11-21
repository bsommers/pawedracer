# render-road report
## What I built
- `src/art/registry.js`: buildArt({style}) with guarded dynamic imports (retro modules, `src/art/<style>/*.js` packs), per-name rectangle fallback, `toDrawable`, `createPixCtx` (PixBuf-backed 2D ctx shim: fillRect, drawImage, polygon fill, scale/translate, alpha, 'lighter').
- `src/render/road.js`: themes (8 biomes x day/dusk/night), `project()` (hills, curves from `seg.vis`, banking shear, tunnels, fog), `drawRoad()` row-based with rumble/lane bands, tunnel walls/ceiling.
- `src/render/scene.js`: sky + parallax backdrop (art or procedural), billboards far to near with clip, pods (steer frames, roll, wreck, shadow, flame overlay), `fakeTrack/fakeView`.
- `src/render/particles.js`, `src/render/hud.js`, `src/render/renderer.js` (createRenderer, setStyle, resize, `ready` promise; speed lines, boost zoom blur, heat shimmer, shake, event-driven particles; optional `src/render/<style>.js` hooks/theme).
- `tools/render-frame.mjs` (PNG for any track/style, real sim or `--fake`), `test/render.test.mjs`.
## Verification evidence
- `node --test test/render.test.mjs`: 4 pass (8 biomes x 3 frames, fallbacks, hi-res determinism, projection).
- Rendered brie (fake), swiss, gouda with the real sim and real art: out/rr-fake.png, rr-swiss.png, rr-gouda.png; looked correct.
## Deviations from the contract
- Sprite scale: pods 1:1 at player seat (art.w*depth/relZ*1280); objects drawn x2 (OBJ_SCALE) to read against the 500px-wide road. Camera sits ~1077 units behind the player so the pod stands at y=H-44.
- Style modules are optional hooks (`theme`, `hooks`), API invented since none specified.
## Mistakes I made and how I fixed them
- Initial curve gain assumed small curve values; coordinator said use `seg.vis`; switched (CURVE_GAIN=1).
## Learnings for a future agent
- Road is painted near to far with a maxY clip; scenery is drawn afterwards far to near using seg.clip.
- HUD radio uses `ui.radio={who,text,mood}`; events read from `view.events` ({type,...}).
## Requests for other modules
- Hi-res packs: entries should carry frames at HI_SCALE; registry derives logical w/h from ART manifest.
- Heat shimmer and boost blur self-copy `ctx.canvas`; ui-shell must pass the real canvas context.
Factory proposals: none
