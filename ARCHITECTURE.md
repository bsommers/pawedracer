# Pawed Racer: architecture contract (binding; `src/core/defs.js` holds the numbers)

Pod-racing parody. Colby (orange tabby) races the Gouda Eve Classic against Perring Parkway Pete (gaunt red-eyed rat, canonical look in `learning/IDENTITY-SHEETS.md`). Pseudo-3D segment road, deterministic sim, four visual styles (`retro`, `toon`, `ghibli`, `photo`) over one sim. Spec: `spec/build-spec.md`.

## 1. Screen
Retro canvas `W x H` = 320x200, integer-scaled. Other styles draw at `HI_SCALE`x (1280x800). Horizon at `ROAD.horizonY`. HUD: top-left position `3/8` and lap `2/3`, top-right speed and best lap, bottom-left heat bar and health bar, bottom-centre boost charge, bottom-right radio portrait with subtitle line (Pete/announcer barks). Pod sits at y ~ H-44.

## 2. Modules and owners (disjoint)
| Module | Files | Owner agent |
|---|---|---|
| sim | `src/sim/{pod-physics,race,ai,pete}.js`, `src/lib/pod-physics.js` | sim-core |
| tracks | `src/levels/{tracks,validate}.js`, `tools/validate-track.mjs` | track-gen |
| retro render | `src/render/{renderer,road,scene,particles,hud}.js`, `src/art/registry.js` | render-road |
| retro art | `src/art/{pods,chars}.js` | art-pods |
| scenery art | `src/art/{scenery,hazards,backdrop,fx}.js` | art-scenery |
| audio | `src/audio/{sfx,music,live-music}.js`, `tools/{sfx,music}-wav.mjs` | audio-sfx, audio-music |
| ui | `src/ui/{screens,menus,shop}.js`, `src/main.js`, `index.html` | ui-shell |
| bot | `src/sim/autopilot.js`, `tools/botplay.mjs` | qa-bot |
| toon | `src/art/toon/*.js`, `src/render/toon.js` | toon-style |
| ghibli | `src/art/ghibli/*.js`, `src/render/ghibli.js` | ghibli-style |
| characters | `tools/character-pipeline/*`, `docs/CHARACTERS.md` | char-pipeline |
| site/docs | `site/`, `docs/HOW-TO-PLAY.md`, `docs/HOW-IT-WAS-MADE.md`, `README.md` | site-docs |

Shared, frozen: `src/core/*`, `src/art/pixbuf.js`, `src/kits/*`, `src/ui/{font,touch}.js` (copied from Pawgger).

## 3. Track model (closed form, so sim, AI, bot and validator agree)
A track is an array of segments (`ROAD.segLen` units each). Built from sections `{len, curve, hill, bank, zone}` with ease-in/out. `TRACKS[i].length` is in segments x 10 (220 = 2200 segments, 440 000 units). Objects (hazards, pickups, scenery) are placed by `{z, x, kind, phase?}` with `x` in normalised road units (-1..1 on road, beyond = roadside). Periodic hazards are pure functions of `race.t`: `cutter` swings with `sin(2pi(t/period+phase))`, `wheel` crosses by `x(t) = lerp(-1.2,1.2,frac(t/period+phase))`. Lap = one pass of the closed track; the last segment joins the first (curve and y sum to zero by construction, validator checks).

## 4. Sim rules (sim-core; numbers from `POD`, `RACE`)
Fixed step `DT`. Per pod: throttle accel, brake, drag, off-road cap, steering scaled by speed, centrifugal push from segment curve, yaw-assist, boost (consumes charge, adds heat, speed to `boostSpeed`), overheat stall at heat>=1, barrel roll (invulnerable `rollInvuln`, slides sideways), collisions with hazards (damage, `hitSlow`), pod/pod bumping (side shove, small damage, the higher-speed pod wins), walls at |x|>1.6. Health 0 = wreck + respawn on road after 2 s with speed 0. AI: follows a racing line (track curvature lookahead), avoids hazards with lookahead over the same closed-form functions, rubber band `RACE.rubberBand`, skill per racer. **Pete (5.4)** is a scripted dirty racer: shoves toward the player when alongside, drops `mine` hazards behind him on straights when the player is within 1500 units behind, cuts apex, boosts on the final lap. All randomness through `createRng(seed)`; no `Math.random`.

## 5. Cross-module API
### 5.1 Constructors (examples)
```js
import { createRace } from './sim/race.js';
const race = createRace({ track: trackDef('brie', 1), seed: 1, laps: 3, player: { parts: {engine:0,cooling:0,grip:0,armor:0,thrust:0}, pilot: 'colby' }, mode: 'race', bus });
race.step({ steer: -0.5, throttle: 1, brake: 0, boost: false, roll: 0, yaw: 0 });   // once per fixed step
const v = race.view();
```
### 5.2 `race.view()` shape
`{ t, phase:'countdown'|'racing'|'finished', countdown, lap, laps, place, pods:[{ id, name, isPlayer, z, x, speed, heat, health, boost:{active,charge}, rolling, stalled, wreck, lap, place, finishTime }], player(index 0), objects:[{ z, x, kind, art, frame, active }], segmentAt(z) -> { curve, y, bank, tunnel }, events:[...], bestLap, track:{ id, theme, biome } }`. Read-only; frozen per frame.
### 5.3 Events (bus.emit(type, payload))
`countdown {n}`, `go {}`, `lap {pod, lap, time}`, `finalLap {}`, `finish {pod, place, time}`, `boost {pod}`, `boostEnd {pod}`, `overheat {pod}`, `stall {pod}`, `roll {pod}`, `hit {pod, kind, damage}`, `scrape {pod}`, `pickup {pod, kind}`, `pass {pod, over}`, `peteTaunt {text, mood}`, `peteDrop {z, x}`, `repair {pod, amount}`, `place {pod, place}`, `raceEnd {results}`, `pause {on}`.
### 5.4 Pete script
Defined in `src/sim/pete.js`: `updatePete(race, pod, dt)`; lines of taunt text are in `src/sim/pete.js` `TAUNTS` (cheesy, original; no Star Wars dialogue).
### 5.5 Render
`createRenderer(ctx,{style})` -> `{ draw(view, t, ui), setStyle(id), resize() }`. `draw` projects segments with the standard pseudo-3D loop, draws sky/backdrop/parallax by curve, road bands, billboards back to front (sprites scaled by `ROAD.cameraDepth / z`), pods, FX, HUD. Missing sprites fall back to coloured rectangles. Styles: `retro` in `src/render/*`, `toon` in `src/render/toon.js`, `ghibli` in `src/render/ghibli.js`, `photo` aliases to toon until its pack exists. Packs supply every name in `defs.ART`; `buildArt({style})` loads `src/art/<style>/*.js` through guarded dynamic imports (try/catch so Node tests pass) and falls back to retro per name.
### 5.6 Art module API
Each retro module `src/art/<m>.js` exports `build(PixBuf)` returning `{ [name]: { frames:[PixBuf], w, h } }` for every name under its `ART` group; deterministic, 1 px outline, palette from `PAL`. Toon/ghibli packs: `build(kit)` over painter-kit surfaces at `HI_SCALE`.
### 5.7 Audio
`createAudio(bus, settings)`; `sfx.js` exports `SFX_RECIPES` (pure data, one per `SFX` name) plus `SFX_RECIPES_TOON/GHIBLI` optional; `music.js` exports `SONGS[name]` for every `MUSIC` name. `audio.engine(speed01, boost)` sets the engine drone pitch/volume continuously.
### 5.8 Bot
`createBot({skill, seed}).act(view) -> input`. Looks ahead over `view.segmentAt` and `view.objects`. `tools/botplay.mjs --track brie --seeds 1..10 --style retro` must finish every track.
### 5.9 URL parameters
`?style=retro|toon|ghibli|photo`, `autostart`, `track=<id>`, `seed`, `laps`, `bot=<skill>`, `nosound`, `time`. Key G cycles style; settings persisted in localStorage with try/catch.

## 6. Fairness (track-gen)
`validateTrack(def, POD)` computes the speed profile from curvature (max cornering speed given `centrifugal`), the lap time estimate, hazard clearance (every hazard row leaves a gap >= 0.9 pod widths reachable given steer rate at cornering speed), no two timed hazards unavoidable together, and loop closure. Tracks x seeds 1..20 must pass. Different seed -> different object placement, same curve skeleton per track id.

## 7. Libraries and coordinates
`libraries.json` lists `pawfall-assets` (local `../pawfall-assets`, GitHub `bsommers/pawfall-assets@main`) and `character-library` (local `../character-library`, GitHub `bsommers/character-library@main`, not yet published). Install what you need with `factory library install --project . --registryId <id> --assets <ids>`.

## 8. Rules for every agent (see docs/swarm/SWARM.md preamble)
Factory contributions go to `../game-factory/proposed/pawedracer/` with an entry in `CHANGELOG-PAWEDRACER.md`. Never edit the live factory. Visual style direction: `learning/IDENTITY-SHEETS.md` and the two reference JPEGs in `learning/` (read-only).
