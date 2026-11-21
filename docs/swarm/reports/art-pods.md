# art-pods report

## What I built
- `src/art/pods.js`: pod_colby (cheese-wedge hull, fondue-pot twin engines, tuna-can thrusters, helmeted Colby with red scarf), pod_pete (rind/mold hull, scrap plates, pickle-green fender, red-eyed Pete in mirrors, tail), pod_r1..r5 (brie, blue, parmesan, red edam, mold-green; own pilots/fins), pod_flame (4 emissive frames), pod_shadow, pod_roll (6 frames, in-plane rotation of Colby's pod), pod_wreck (2 smoking frames). Steer frames use a row shear (bottom row fixed).
- `src/art/chars.js`: portraits (Colby x3, Pete x3 per IDENTITY-SHEETS, Super Colby x2), two announcer mice (mouth closed/open), podium figures (Colby idle/cheer/sad, Pete smug/rage/shock) and the 200x48 "PAWED RACER" logo (cheese block letters, rind extrusion).
- `test/art-pods.test.mjs`.
- Flame anchors (pod_flame top row sits on): Colby nozzles x=7,33 (level frame), y=26; Pete x=9,39, y=30. They shift with the steer lean by up to about 2 px at the top-heavy rows, but nozzles are near the bottom so about 0-1 px.

## Verification evidence
- `node --test test/art-pods.test.mjs`: 5/5 pass (manifest, determinism, build under 400 ms (about 12 ms), no clipping, feet on bottom row for all body pods).
- Looked at the sheet at x5/x6 three times; fixed pot dominance, hidden pilot, clipping, detached podium heads, illegible logo.
- Numeric bbox via `out/bbox.mjs`.

## Deviations from the contract
- `tools/sheet.mjs` could not run (see Requests); I used my scratch `out/sheet-art.mjs`, which does the same checks against `defs.ART`.
- `build()` takes no argument (imports PixBuf directly), which is compatible with `build(PixBuf)` callers.
- pod_flame and pod_shadow have no outline (effects). Portraits are bust crops; the bottom edge is intentionally cut.
- pod_roll frame 0 is the upright pod.

## Mistakes I made and how I fixed them
- First pass: oversized pots hid the hull and the pilot was a hat blob; shrank pots, widened hull, shrank helmet.
- Edge clipping at steer extremes; reduced shear, moved handles and ears.
- Podium heads floated above bodies; lowered heads.
- Logo extrusion stripes made it unreadable; used a solid 2 px extrusion and less shear.

## Learnings for a future agent
- Check numerically that non-outline pixels never touch the frame edge.
- Pete is dark on the dark HUD; rely on the outline and mauve ears.

## Requests for other modules
- defs.js defect: no `artManifest()` export, so `tools/sheet.mjs` crashes (`artManifest is not a function`). Needs an export returning `{module,name,w,h,frames,kind,desc}` rows built from `ART`.
- Palette wishes: a mid grey-brown fur, a lighter pink for Pete's tail/ears, and a brighter white-blue for glass highlights.
- Renderer: pods are rear view; draw pod_flame at the nozzle anchors above; pod_shadow under the pod.

## Factory proposals
none
