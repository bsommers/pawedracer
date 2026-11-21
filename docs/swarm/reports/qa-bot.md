# qa-bot report

## What I built
- `src/sim/autopilot.js`: `createBot({skill, seed, lapLength, noise}).act(view) -> input`. Look-ahead over `view.segmentAt` (racing line, centrifugal feed-forward, corner "steering load" speed limit) and `view.objects` (static hazards, closed-form wheel, cutter period/phase learned from sampled motion). A dynamic-programming lane planner over clustered hazard/pod events (rate-limited lane changes) picks the lane; barrel roll when no clear lane; boost on straights; pickup bias; skill knob (low skill = lateral wobble, lower corner limit); no-progress watchdog (3 s of <1500 units/s progress triggers a recovery steer to centre).
- `tools/botplay.mjs`: `--track id[,id]|all --seeds 1..10 --skill --laps --json`; prints finish time/place, hits, wrecks, watchdog and roll counts; exit 1 on any failure.
- `test/bot.test.mjs`: 12 node:test cases.

## Verification evidence
- `node tools/botplay.mjs --seeds 1..10`: 80/80 finished (out/botplay-full.txt), no watchdog trips needed on the early 1..3 runs.
- 12/12 unit tests green. Mutations: flipping the feed-forward sign made the feed-forward test fail; disabling the watchdog threshold made the watchdog test fail.

## Deviations from the contract
- `view` has no lap length; the bot derives it from `TRACKS` by `view.track.id` (or `lapLength` option).
- `--style` is not accepted as a no-op flag beyond being ignored (sim is style-independent).

## Mistakes I made and how I fixed them
- First planner scored lanes per hazard independently, so it never planned multi-hazard rows; replaced by stage DP.
- Corner limit used track curve peak ahead only; included current segment curve.
- Roll trigger required `bestC>30`, too strict for non-solid hazards; lowered to 10.

## Learnings for a future agent
- Steering authority is ~0.06 x per frame at full speed: hazards must be planned >1 s ahead.
- Bot often finishes p5-p8 in a full race (pods collide, AI strong); camembert is slow because of corner limit (~280 s). Finishing is guaranteed, winning is not.

## Requests for other modules
- Expose lap length (`view.track.length` in units) in `race.view()` to remove the TRACKS lookup.
- Pod/pod bumps account for most remaining bot hits; nothing needed otherwise.

Factory proposals: none.
