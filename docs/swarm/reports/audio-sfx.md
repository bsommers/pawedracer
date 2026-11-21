# audio-sfx report

## What I built
- `src/audio/sfx.js`: `SFX_RECIPES` (pure data, all 30 names in `defs.SFX`), `describe(name, {style, pitch})`, `renderSfx(name, sr, opts)`, `stats`, `duration`, `SFX_NAMES`, `STYLES` (`['retro']`), `LOOP_SFX` (engine_loop 0.5 s, crowd_loop 1.0 s), `RECIPES_BY_STYLE`.
- `test/audio-sfx.test.mjs`: 9 tests (coverage of names, voice shape, unknown name/style, pitch, render sanity, durations, loop seams, engine periodicity, engine pitch).
- `out/sfx/retro/*.wav`: all 30 rendered via `node tools/sfx-wav.mjs` (`tools/sfx-wav.mjs` was already present and works unchanged).

## Verification evidence
- `node --test test/audio-sfx.test.mjs`: 9 pass, 0 fail.
- `node tools/sfx-wav.mjs`: 30 files written, every peak between 0.05 and 0.33 (no clipping), RMS 0.008 to 0.065, lengths 0.06 s to 1.27 s. After a gain bump on crowd_loop it renders peak 0.13, RMS 0.020.

## Deviations from the contract
- No `ghibli` style. `SFX_RECIPES_TOON/GHIBLI` are optional in ARCHITECTURE 5.7, so `STYLES` is `['retro']`; `describe` falls back to retro for any other style.
- `engine_loop` is a one-cycle 2 Hz pulse (0.5 s), not a constant drone. The kit's voice envelope is attack then exponential decay with no sustain, so a true constant drone cannot be made from voices alone. Pitched voices sit on whole multiples of 2 Hz so the buffer tiles at pitch 1.
- `crowd_loop` uses noise, so it is not a periodic loop. Both ends are at about zero amplitude, so it repeats without a click, but the sample pattern does not repeat.

## Mistakes I made and how I fixed them
- The first crowd_loop gain made RMS 0.008, which is borderline quiet. I raised the gains and re-rendered (peak 0.13, RMS 0.020).

## Learnings for a future agent
- The kit's `describeSfx` throws on an unknown name, and `pitch` scales every pitched voice, so pitch-variation needs no extra recipes.
- Engine pitch shifting in live audio will break the tile seam, because pitched voices no longer sit on whole cycles. Live code should crossfade or retrigger the loop when the pitch changes a lot.

## Requests for other modules
- audio.js (not owned by me; it is still the Pawgger copy and imports `describe` from `./sfx.js`): map the events to the 30 `defs.SFX` names and loop `engine_loop` and `crowd_loop` with `LOOP_SFX` as the cycle length.

## Factory proposals
- none

## Shared-library defects
- none found. `src/kits/audio-kit` behaves as documented.
