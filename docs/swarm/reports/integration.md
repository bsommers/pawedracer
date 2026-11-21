# integration report

## Done
- `src/audio/audio.js` rewritten to the contract: `createAudio(bus, settings, {AudioContextCtor, timer})` -> `resume()`, `play(name,{pan,pitch,gain})`, `setMusic(name)`, `engine(speed01, boost)`, `setSettings/setVolume/setMute`, `startLoop/stopLoop`, `dispose`, `engineState`, `musicName`.
  - Bus events -> the 30 SFX names (`EVENT_SFX`; player pod 0 only for personal sounds; `hit` kind wall/pod/else; `pickup` tuna/mouse/else coin; `peteTaunt` mood laugh -> pete_laugh else pete_taunt; `peteDrop` -> splat). Menu/UI names (menu_*, shop_buy, podium, ...) go through `play()`.
  - LOOP_SFX: `crowd_loop` is rescheduled one cycle at a time (lookahead timer) from `go` until `raceEnd`/pause.
  - Music: `setMusic` takes any MUSIC name (title/shop/podium/duel_pete/race_*) or a bare track id via MUSIC_FOR; remembered before `resume()`.
  - Engine drone: saw + square oscillators through a lowpass; pitch 48..~200 Hz with speed, +45 Hz and brighter on boost, silent at speed 0. engine_loop pulse is not used live.
- `src/main.js`: `audio.unlock` -> `audio.resume`, `audio.music` -> `audio.setMusic` (ui code untouched; `play` and `engine` already matched).
- `scene.js drawSky`: sky and backdrop tile by logical `art.get(name).w/h` (toon sky was 4x too big).
- `hud.js`: radio subtitle word-wrapped to 13 columns, 4 lines, ellipsis (`wrapText` exported). Text column sits left of the portrait.
- `scene.js drawPod`: pods with `ghost: true` draw at alpha 0.45 (body, flame, shadow) and use the pod_colby art.
- `tools/check-imports.mjs`: the false error was not the export regex; `strip()` removed block comments first, so `// src/art/<style>/*.js` in registry.js opened a block comment and ate `export const ART_NAMES`. Line comments are now stripped first.
- New `test/audio.test.mjs` (3 tests, fake AudioContext).

## Verification
- `node --test test/*.test.mjs`: 120 pass (before adding the audio test; audio test passes separately, 3/3).
- `node tools/check-imports.mjs`: 75 files, 0 errors.
- `tools/shot.mjs ?autostart=1&track=brie&style=toon|retro --strict` (plus toon with `bot=1`, 20 s): no console messages, no errors. Frames viewed: out/int/game-toon.png, game-retro.png, game-toon-bot.png. Sky/hills now correct scale, subtitle wraps inside the panel.
- `render-frame.mjs` retro: fine. Toon (out/int/toon.png): sky correct, but the player pod/hazard is a huge red blob. That tool drives straight with no steering and ends up on top of an object at near-zero relZ; the same view in the real game is fine. Not fixed (very-near sprites are not clamped in scene.js).

## Not verified
- Audio was never listened to (no sound device); live path tested only with a fake AudioContext.
