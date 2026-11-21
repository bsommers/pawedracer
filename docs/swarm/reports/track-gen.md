# track-gen report

## What I built
- `src/levels/validate.js`: shared maths (cornerLimit, steerAt, speedProfile, shiftBudget), `validateTrack(def, POD) -> { ok, lapTime, difficulty, issues, stats }`.
- `src/levels/tracks.js`: `trackDef(id, seed)` for all 8 tracks (section-based skeleton by id; seeded objects), `buildSegments`, `TRACK_IDS`, `CURVE_VISUAL`.
- `tools/validate-track.mjs` (`--track id --seeds 1..20`): lap time, difficulty, ASCII elevation/curve strip; exit 1 on failure.
- `test/tracks.test.mjs`: 11 tests.

## Verification evidence
- 8 tracks x seeds 1..20 all validate; `node --test test/tracks.test.mjs` 11/11 pass.
- Mutations: disabling curve-closure scaling -> 2 tests red; disabling the "no gap" check -> 1 red; restored.
- Lap times (s): brie 39.9, cheddar 54, swiss 50, fondue 62, blue 58, parmesan 65, camembert 96, gouda 78.5 (x5 laps).

## Deviations from the contract
- `seg.curve` is the physical curve (0.0005..0.022) because ARCHITECTURE 4 gives push = curve*v^2*centrifugal. I add `seg.vis = curve*300` (OutRun-style units) for the renderer.
- `seg.y` is absolute elevation (0 at lap line), not a slope sum; the lap closes because the last section returns to 0.
- Objects: `{ z, x, kind, type:'hazard'|'pickup'|'scenery', art, phase?, period?, amp? }`; scenery `kind` = art name. Cutter amplitude `amp` = 0.7 (road units), wheel range -1.2..1.2.
- Assumed steer(v) = POD.steer * clamp(v/steerSpeedRef, 0.3, 1); "gap >= 0.9 pod widths" = free pod-centre interval >= 0.9*2*collisionX. Static blockers: wedge, mine, fondue, hole; soft: grater, stink; timed: cutter, wheel.
- Difficulty saturates at 10 for camembert.

## Mistakes I made and how I fixed them
- Closure tolerance scaled with segment count and missed a 0.002 break; tightened to 1e-6 absolute.

## Learnings for a future agent
- Generator and validator share budgets via validate.js, with a 0.7 safety factor, so rows are valid by construction.

## Requests for other modules
- render-road: use `seg.vis` (not `seg.curve`) for the road bend; `seg.bank` is -1..1; `seg.zone` in normal|start|fog|lava|grater|tunnel|cave|crowd|straight.
- sim-core: cutter x = amp*sin(2pi(t/period+phase)); wheel x = lerp(-1.2,1.2,frac(t/period+phase)).
Factory proposals: none
