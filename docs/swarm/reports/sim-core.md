# sim-core report

## What I built
- `src/lib/pod-physics.js`: generic pod physics (makePod, stepPod, damagePod): accel/brake/drag, off-road cap, speed-scaled steering, centrifugal push, yaw assist, boost + heat + overheat stall, barrel roll with invulnerability, walls, wreck/respawn.
- `src/sim/pod-physics.js`: POD binding, shop-part multipliers, closed-form hazardX (cutter/wheel), overlap helpers.
- `src/sim/ai.js`: racing line, hazard lookahead, corner braking, boost use, deterministic rubber band.
- `src/sim/pete.js`: updatePete, TAUNTS, mine drops, shoves, final-lap boost.
- `src/sim/race.js`: createRace (countdown, grid, laps, finish order, pickups, hazards, pod bumps, passes, places, raceEnd, view(), hash()). All 5.3 events emitted.
- `test/sim-core.test.mjs`: 23 tests.

## Verification evidence
`node --test test/sim-core.test.mjs`: 23 pass, 0 fail (includes a run on the real `trackDef('brie',1)`). Mutation check: removing the invulnerability guard in damagePod turned the barrel-roll test red; restored, green.

## Deviations from the contract
- Curve units: `curve` is used raw in `x -= curve*v^2*centrifugal*dt`, so sane values are about 0.001-0.004. Larger values make the road unplayable.
- `heatBoost` is heat per second of boost.
- Pod ids in events are integer indexes (player 0, Pete 1). `view.pods[i]` also has extra fields: art, dist, steer, rollDir, score.
- Pickups respawn each lap; `view.objects[].active` reflects the player's collection only.
- Mode `duel` = Colby + Pete, `time` = Colby only.
- Lap event `lap` = the new current lap number.

## Mistakes I made and how I fixed them
- Off-road cap leaked (accel pushed past it): cap is now the effective max speed off-road.
- Tests initially counted AI pods' events (pickups, bumps); filtered to pod 0.
- Rubber-band test ignored the +-2 gap clamp.

## Learnings for a future agent
- `race.sim` exposes mutable internals for tests (pods, dyn mines, pete state).
- Pete's mine has a 2 s initial cooldown, 7 s between mines.

## Requests for other modules
- track-gen: confirm object shape `{z, x, kind, phase?, period?}` with z in world units within one lap, and curve magnitudes of about 0.001-0.004.
- render: use `view.pods[i].z` (lap coordinate) and `.steer` (-1..1) for the sprite frame.

## Factory proposals
none (lib/pod-physics.js is a candidate; not staged).
