# Swarm manifest: Pawed Racer

Single source of truth for the agent swarm. `node tools/swarm-tracker/bin/swarm-plan.mjs` turns this file into `docs/swarm/prompts/<id>.md` and `.tracker/plan.json`. Tracker port 4860 (loopback by default; set `TRACKER_ALLOW` to expose on a LAN).
Agent header: `## id | model | phase | role | Name`, then an `owns:` line, then the task.
Spawn each agent with: "Read {{root}}/docs/swarm/prompts/<id>.md and execute it exactly."

## @meta
project: Pawed Racer
tagline: Colby the orange cat vs Perring Parkway Pete at the Gouda Eve Classic: a cheese pod-racing parody built by an agent swarm

## @preamble
You are subagent `{{id}}` ({{name}}) in a parallel swarm building **Pawgger** (a Frogger parody starring Colby, an orange tabby jungle explorer hopping across Perring Parkway, vs. villain Perring Parkway Pete the rat) in `{{root}}`. Model tier: {{model}}.

Rules:
0. Visual references: `learning/SuperColby-front-side.jpeg`, `learning/Perring-Parkway-Pete-front-side.jpeg`, `learning/IDENTITY-SHEETS.md` (Pete is the gaunt red-eyed armoured rat). Look at an image only when your task is art.
1. `ARCHITECTURE.md` and `src/core/defs.js` are the binding contract. Read `ARCHITECTURE.md` sections 1-5 and the sections your task needs (list headings with `grep -n '^## ' ARCHITECTURE.md`, Read with offset/limit), and grep `defs.js` instead of reading it whole (except for the parts you need: your ART rows, ROW, PAL, TUNING, ART).
2. You own ONLY: {{owns}}. Besides those you may write your tests under `test/<id>*.test.mjs`, your report, and scratch output under `out/`.
   Other agents are writing other modules **right now**: their files may be missing or half-written. Code against the contract, guard with fallbacks, never edit a file you do not own; list what you need under "Requests" in your report.
3. Progress reporting (drives a live dashboard): first `node tools/swarm-tracker/bin/track.mjs {{id}} start "<plan in a few words>"`; then `track.mjs {{id}} progress <pct> "<what just landed>"` at 4 or more milestones; finally `track.mjs {{id}} done "<one-line result>"` (or `blocked` / `failed` with the reason). Run from {{root}}.
4. Verify for real before claiming done: run it, test it, look at it. Report failures honestly.
5. If you must wait for another agent's file, poll (`for i in $(seq 90); do [ -f <path> ] && break; sleep 10; done`), then proceed with a fallback if it still is not there.
6. Finish by writing `docs/swarm/reports/{{id}}.md` with sections: **What I built** · **Verification evidence** · **Deviations from the contract** · **Mistakes I made and how I fixed them** · **Learnings for a future agent** · **Requests for other modules**. Report shared-library defects (pixbuf.js, font.js, defs.js...) here too, do not only work around them.
7. Keep chat output minimal (status lines only). Final reply: 8 lines max.
8. Save work to disk early and often; the swarm can be interrupted by usage limits. If your owned files already exist, you are RESUMING: inspect them and continue instead of starting over.
9. Install no new dependencies (Node 22+, zero deps). No git commands. Never kill processes you did not start. Never use `/tmp` — scratch goes to `out/` or `/datanapps/claude-tmp`.
10. Context budget — your whole context is re-sent on every tool call, so keep it small: read files with offset/limit or grep, never whole large files; pipe command output through `tail`/`grep` (40 lines max); look at an image only when you will act on it (about 6 in total; prefer numeric checks); never re-read a file you just wrote.
11. Checkpoints — keep `docs/swarm/progress/{{id}}.md` (30 lines max: **Done** · **Next steps, in order** · **Gotchas** · **Commands to verify**) and update it at every milestone. If it exists when you start, you are a fresh agent continuing the job: read it first, trust it, do not re-derive. After about 25 tool calls, or at a milestone with substantial work left, update the checkpoint and END your turn with a last line `CONTINUE: <next step>`. Only write the report and call `track.mjs ... done` when the whole task is finished.
12. Stamp times with `date -u`; never type a timestamp.
13. Reference implementations from sibling games live in `/home/bill/src/fun/catxzzon/` (same pixbuf/font/audio/sim patterns) — read-only, use as inspiration; the Pawed Racer contract wins on any disagreement.
14. Factory contribution (ARCHITECTURE section 8): if you build something reusable by other games, or must patch a factory file, stage it under `../game-factory/proposed/pawedracer/` (never edit the live factory) and append an entry to `../game-factory/proposed/pawedracer/CHANGELOG-PAWEDRACER.md`. Mention it in your report under 'Factory proposals' (or 'none').
15. Quality bar: the user wants to be wowed. Charm, cheese puns, juicy speed and feedback. But the contract comes first.
16. The tracker is on port 4860 (loopback unless `TRACKER_ALLOW` is set); do not start or kill servers.

Your task:

## @role:art
Role appendix (art): PixBuf-only, deterministic, palette from `defs.PAL`. Characters get a 1px `PAL.outline`. Run `node tools/sheet.mjs <module> --scale 6`, then LOOK at `out/previews/<module>.png` (and again after fixing) and measure opaque bounding boxes numerically (feet at the bottom row of the frame, nothing clipped, nothing floating). The sheet tool must print `OK`. Add `test/<id>.test.mjs` asserting manifest conformance, determinism (build twice = same bytes) and build time < 400 ms. Add a short note to your report on any palette colour you wished existed.

## @role:sim
Role appendix (sim): pure Node-safe simulation, fixed step, deterministic. Never `Math.random` (use `createRng`). Write unit tests (node:test) for every rule in your section of ARCHITECTURE §4/§5 and mutation-check at least one (break the code, see red).

## @role:audio
Role appendix (audio): one pure-JS synthesis description drives BOTH live WebAudio and offline PCM rendering. No clicks (short attack/release), peak <= 1.0, RMS sensible, durations as listed. Provide the wav-render tool script. Judge the sound by numbers (peak/RMS/length/spectral centroid) and by listening-proxy sanity checks in tests (no NaN, no silence, no clipping).

## @role:tools
Role appendix (tools): general-purpose, reusable infrastructure that must also work for future games. Never edit the live game-factory; use `proposed/pawedracer/` per rule 14.

## @role:art
Role appendix (art): PixBuf-only, deterministic, palette from `defs.PAL`. Characters get a 1px `PAL.outline`. Run `node tools/sheet.mjs <module> --scale 6`, then LOOK at `out/previews/<module>.png` (and again after fixing) and measure opaque bounding boxes numerically (feet at the bottom row of the frame, nothing clipped, nothing floating). The sheet tool must print `OK`. Add `test/<id>.test.mjs` asserting manifest conformance, determinism (build twice = same bytes) and build time < 400 ms. Add a short note to your report on any palette colour you wished existed.

## @role:sim
Role appendix (sim): pure Node-safe simulation, fixed step, deterministic. Never `Math.random` (use `createRng`). Write unit tests (node:test) for every rule in your section of ARCHITECTURE §4/§5 and mutation-check at least one (break the code, see red).

## @role:audio
Role appendix (audio): one pure-JS synthesis description drives BOTH live WebAudio and offline PCM rendering. No clicks (short attack/release), peak <= 1.0, RMS sensible, durations as listed. Provide the wav-render tool script. Judge the sound by numbers (peak/RMS/length/spectral centroid) and by listening-proxy sanity checks in tests (no NaN, no silence, no clipping).

## @role:tools
Role appendix (tools): general-purpose, reusable infrastructure that must also work for future games. Never edit the live game-factory; use `proposed/pawgger/` per rule 14.

## sim-core | sonnet | p1 | sim | Pod physics, race sim, AI, Pete
owns: src/sim/pod-physics.js, src/sim/race.js, src/sim/ai.js, src/sim/pete.js, src/lib/pod-physics.js, test/sim-core.test.mjs
Implement ARCHITECTURE sections 4, 5.1-5.4 completely using `POD`/`RACE`/`HAZARDS`/`PICKUPS` from defs. `src/lib/pod-physics.js` is a generic reusable physics module (header doc and test; factory candidate). Tracks come from `src/levels/tracks.js` (`trackDef`, owned by track-gen; may not exist yet: write a tiny fake track in tests and import with a guarded fallback). Emit every sim event with the payloads in 5.3. Tests: accel/drag/offroad, steering vs curve, boost+heat+stall, barrel roll invulnerability, hazard hit, pod bump, wreck/respawn, lap counting, finish order, rubber band determinism, Pete drops a mine only when the player is close behind, same seed + inputs = same state hash, one mutation-check. A scripted full-throttle run on a fake track finishes 3 laps.

## track-gen | sonnet | p1 | sim | Track generator and fairness validator
owns: src/levels/tracks.js, src/levels/validate.js, tools/validate-track.mjs, test/tracks.test.mjs
Implement ARCHITECTURE sections 3 and 6: `trackDef(id, seed)` for all eight `TRACKS` (distinct personality each: Brie gentle sweepers; Cheddar wedges and esses; Swiss tunnels and hole jumps; Fondue heat and lava puddles; Blue Cheese fog zones and mines; Parmesan graters and hills; Camembert tight cave turns; Gouda Eve a grand loop with a long straight, Pete billboard, crowds), seeded object placement, closed-loop guarantee, `validateTrack`. 8 tracks x seeds 1..20 must validate; the CLI prints per-track lap time, difficulty and an ASCII elevation/curve strip. Tests for determinism, different-seed-different-objects, loop closure, fairness.

## art-pods | sonnet | p1 | art | Retro art: pods and characters
owns: src/art/pods.js, src/art/chars.js, test/art-pods.test.mjs
Implement the `pods` and `chars` groups of defs.ART in PixBuf retro style: Colby's pod (cheese-wedge hull, fondue-pot twin engines, tuna-can thrusters, Colby in helmet/goggles/red scarf visible), Pete's pod (huge, ugly, rind-and-mold hull, scrap plates, pickle-green fender, red-eyed Pete), five rival pods in distinct cheese colours, flame, shadow, roll, wreck, portraits (Colby, Pete canonical per learning/IDENTITY-SHEETS.md, Super Colby, two announcer mice), podium figures and the logo "PAWED RACER". Run `node tools/sheet.mjs` and judge at x6; install Colby sprites from the pawfall-assets library only if they help. Iterate on the sheet at least twice.

## render-road | sonnet | p1 | gfx | Pseudo-3D road renderer (retro), scene, HUD, registry
owns: src/render/renderer.js, src/render/road.js, src/render/scene.js, src/render/particles.js, src/render/hud.js, src/art/registry.js, test/render.test.mjs
Implement ARCHITECTURE section 5.5 and 5.6: the segment projection loop (hills, curves, banking, tunnels, fog), road/rumble/lane bands with themed colours per biome and time of day, parallax backdrop that scrolls with curvature, billboards back to front, pods with steer frames and flame overlay, speed lines, boost blur, heat shimmer, particles, HUD per section 1. Develop against a fake `race.view()` and a fake track; art modules arrive in parallel, so every missing sprite falls back to a coloured rectangle. `createRenderer(ctx,{style})`, `r.setStyle(id)`, `buildArt({style})` must exist from day one with guarded dynamic imports of `src/art/<style>/*.js` and `src/render/<style>.js`. Provide a PixBuf-backed 2D context shim for Node PNG output and a test that renders 3 frames of a fake race. Also write `tools/render-frame.mjs` (PNG of a frame for any track/style).

## art-scenery | sonnet | p2 | art | Retro art: scenery, hazards, pickups, backdrop, FX
owns: src/art/scenery.js, src/art/hazards.js, src/art/backdrop.js, src/art/fx.js, test/art-scenery.test.mjs
Implement the `scenery`, `hazards`, `pickups`, `backdrop`, `fx` and `ui` groups of defs.ART: cheese-themed roadside billboards (wheels, wedges, mouse-hole houses, palms with cheese-rind, stalagmites, grated peaks, crowds, banners, Pete's giant billboard), hazards (cheese wedge, rolling wheel, grater, cheese-cutter gate, fondue puddle, stink cloud, mine, swiss hole), pickups, seamless wrapping backdrops (day/dusk/night sky, hills, mesa, peaks, skyline, cave), FX sheets, HUD icons. Sheet tool OK; seamless horizontal wrap tested.

## audio-sfx | haiku | p2 | audio | Sound effects
owns: src/audio/sfx.js, test/audio-sfx.test.mjs
Implement `SFX_RECIPES` (pure data) for every name in defs.SFX, reusing the recipe format of `../pawgger/src/audio/sfx.js`. Engine loop must be a tileable drone the live audio can pitch. Peak <= 1, no clicks, durations sensible; tests by numbers via `tools/sfx-wav.mjs`.

## audio-music | sonnet | p2 | audio | Songs
owns: src/audio/music.js, src/audio/live-music.js, test/audio-music.test.mjs
Implement `SONGS` for every defs.MUSIC name: driving chiptune with a cheese-circus swagger, one theme per track (biome mood), a menacing `duel_pete`. Reuse the format of `../pawgger/src/audio/music.js`. Validate bar lengths; render WAV previews with `tools/music-wav.mjs`.

## ui-shell | sonnet | p2 | ui | Shell, menus, shop, game loop
owns: src/main.js, index.html, style.css, src/ui/screens.js, src/ui/menus.js, src/ui/shop.js, test/ui.test.mjs
Wire everything: title (attract mode driven by the bot), track select with the eight cheese tracks, tournament, time trial, ghost, shop over `PARTS`, countdown, pause (P), results/podium with prize money, options (style, sound, touch). Poll input once per frame and carry edges. Touch buttons for phones (steer, throttle, boost, roll). URL params and `window.__pawed` debug handle per ARCHITECTURE 5.9. Guard every import of modules that may not exist yet.

## qa-bot | sonnet | p3 | sim | Autopilot QA bot
owns: src/sim/autopilot.js, tools/botplay.mjs, test/bot.test.mjs
Implement 5.8. Look-ahead over the real hazard functions, skill knob, no-progress watchdog. `node tools/botplay.mjs` runs all tracks and seeds headlessly and prints finish times and failures. Report any track the bot cannot finish with the reason.

## toon-style | sonnet | p3 | art | Toon visual mode (from the reference sheets)
owns: src/art/toon/*.js, src/render/toon.js, test/toon.test.mjs
Implement the `toon` style per build-spec section 2: whole game redrawn in the house style of `learning/` (clean near-black outlines, flat cel fills plus one shade tone, chubby readable characters, saturated hero vs grimy villain), using `src/kits/painter-kit` and `TOON_PAL`. Pods, characters (Colby racer, Super Colby, Pete), scenery, hazards, backdrop, HUD, logo, menus. Look at the two reference JPEGs. Same `defs.ART` names; hi-res `HI_SCALE`.

## ghibli-style | sonnet | p3 | art | Ghibli visual mode
owns: src/art/ghibli/*.js, src/render/ghibli.js, test/ghibli.test.mjs
Port the painterly mode from `../pawgger` (read its `src/render/ghibli.js` and `src/art/ghibli/`): painted skies, soft shaded billboards, dappled light, original look, gentle music colour hooks. Same names as `defs.ART`.

## char-pipeline | sonnet | p3 | tools | Character-from-text pipeline and library tie-in
owns: tools/character-pipeline/*, test/char-pipeline.test.mjs, docs/CHARACTERS.md
Build build-spec section 2.1: bible schema, prompt composer, generator adapter interface with a mock adapter (no network, no uploads), reference-learning (palette extraction and background removal from the two learning/ sheets, zero-dep PNG/JPEG handling or documented limits), post-process, consistency check and contact sheet, and export into `../character-library` through the factory library CLI (`node ../game-factory/factory-core/library/cli.mjs library add/validate/index`). Never call an external image service. Stage reusable parts under `../game-factory/proposed/pawedracer/new/`.

## site-docs | haiku | p4 | docs | Site and docs
owns: site/*, docs/HOW-TO-PLAY.md, docs/HOW-IT-WAS-MADE.md, README.md
Showcase site and docs from the real state of the repo (do not invent features). Mention both coordinates, local relative first, for libraries: `../character-library` / `github.com/bsommers/character-library` and `../pawfall-assets` / `github.com/bsommers/pawfall-assets`. Tracker: http://localhost:4860/ (configurable via `TRACKER_PORT` / `TRACKER_ALLOW`).
