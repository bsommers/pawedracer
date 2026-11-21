# Pawed Racer: build specification

A Star Wars Episode I: Racer parody starring Colby the orange cat. This is the brief for the build session. It is adapted from `../pawgger/spec/build-spec.md` (the Frogger parody), which in turn reuses the PawFall method. Anything not changed here is inherited from that spec: read it first, especially §2 (standing instructions), §5 (swarm method), §6 (lessons) and Appendix A/B. Where the two disagree, this file wins.

> Naming: the user said "Pod Racer, like a cat pawing". The game is **Pawed Racer** (a pun on Pod Racer), directory `../pawedracer/`, repo `github.com/bsommers/pawedracer`. Easy to rename; keep the title in one constant in `defs.js`.

---

## 1. The game

**Title:** Pawed Racer. **Parodies:** Star Wars Episode I: Racer (LucasArts, 1999).
**Hero:** Colby the orange cat, now a pod-racer pilot. He keeps the pith helmet and red scarf (goggles on the helmet).
**Rival and villain:** Perring Parkway Pete, the sunglasses-and-pinstripes rat tycoon, as the Sebulba stand-in: the dirty, favoured champion with the biggest, loudest pod, who cheats, shoves and shortcuts.
**The big race:** the **Gouda Eve Classic** (parody of the Boonta Eve Classic): the final, marquee race of the circuit, run on a cheese-wheel track.
**Shared universe:** same theme and characters as KÄSEKRIEG (`../callofcheeseduty-ratops/`), `../catxzzon/`, `../duum/desktop/`, `../pawfall/`, `../pawgger/`. Read them for tone.
**Creative brief (user):** the same theme with **both retro and Studio Ghibli style graphics**, plus a **photorealistic mode**. Cheese theme on the vehicles, backgrounds and level names.

### Core Pod Racer mechanics to deliver
- Behind-the-pod pseudo-3D racing (OutRun-style segment road, banking, hills, tunnels), with a clean seam to move to true 3D later (a 3D game is the follow-up).
- Twin-engine pods: steering, throttle, brake, **boost with heat** (overheat means engine fire and a stall), **barrel-roll dodge**, and a **repair/cooldown** mechanic in the pit lane. The Racer signature is twin engines you can tilt for tight turns; model this as a yaw-assist input.
- A circuit of races (see §1.2) with lap counter, position, best lap, and a podium.
- Rival AI racers on rubber-band lines, with Pete as a scripted dirty racer: he rams, drops cheese-wheel mines, cuts corners, and taunts over the radio.
- Obstacles and hazards per track: mouse-hole tunnels, cheese-grater ridges, wheel rollers, sliding wedges, swinging cheese-cutter gates, fondue lava, stinky fog.
- Pickups: tuna boost cans, repair mice, coin treasures (sardine, gold, collar), reusing PawFall art.
- Upgrade shop between races: engines, cooling, grip, armor, paid for with winnings. Hang part names off a data table, not code.
- Single race, time trial, tournament, and a split-screen-free two-player ghost mode (ghost replay of your best lap).
- Title attract mode driven by the autopilot bot, high-score and best-lap tables, pause and options.

### 1.1 Tone and creative direction
- Cheese everywhere: pods built from cheese wedges and wheels, engines as fondue pots or tuna-can thrusters, a rind-and-mold hull for Pete's pod, "stinky" speed lines.
- Pete's pod: huge, ugly, twin-fondue engines, a pickle-green fender, a limo-style horn. His broadcast voice is text-only (subtitled radio barks with a talk-blip SFX).
- Announcers are a pair of mice in a booth at the Gouda Eve Classic. Text plus blips only.
- Gouda Eve Classic is the last race in the circuit, and ends with the Pete duel.

### 1.2 Proposed tracks (cheese-themed, tune and rename freely)
| # | Track | Biome and cheese motif | Notes |
|---|---|---|---|
| 1 | Brie Beach Run | pale coast, brie-rind dunes | tutorial, gentle |
| 2 | Cheddar Canyon | orange mesa, sliding wedges | first hazards |
| 3 | Swiss Hole Tunnels | holes as tunnels and jumps | verticality |
| 4 | Fondue Falls | lava-like fondue, steam | heat management |
| 5 | Blue Cheese Bog | mold swamp, fog, stink clouds | low visibility |
| 6 | Parmesan Peaks | grated-snow mountains, grater ridges | hills, drifts |
| 7 | Camembert Caverns | crystal-rind caves, glow | tight turns |
| 8 | **Gouda Eve Classic** | grand Perring Parkway arena, crowds, night lights | the finale, longest, Pete duel |

Tracks are data (control points, banking, hazards, scenery tags), produced by a seeded **track generator** plus a **fairness/lap-time validator** derived from the same physics numbers.

---

## 2. Style: three render modes (the new core requirement)

The user wants retro, Studio Ghibli style and photorealistic modes, and (added after the reference graphics arrived) a **Toon mode in the style of the supplied Super Colby / Pete sheets, applied to the whole game**. So four modes. Treat these as **swappable render profiles over one deterministic simulation**: the sim never knows which mode is drawing.

| Mode | Look | How it is drawn | Factory style preset |
|---|---|---|---|
| **Retro** | 8/16-bit, locked palette, chunky pixels, CRT feel | code-drawn `PixBuf` sprites, scaled-sprite billboards, segment road, low internal resolution | `retro-8bit-sidescroller` base, `retro-16bit` for the road/scaling look |
| **Ghibli** | hand-painted, soft gradients, big skies, lush scenery, warm light | layered painted backdrops, soft-shaded billboards, painterly post (grain, bloom, gentle outlines) | `cartoon-vector` / `cel-shaded-toon-3d` ideas; likely needs a new preset (see §2.2) |
| **Toon** (reference style) | clean black outline, flat cel fills with one shade tone, chubby readable characters, saturated hero and grimy villain colours; taken from the supplied Super Colby and Pete turnaround sheets in `learning/` | everything in the game is redrawn in this house style: pods, tracks, scenery, HUD, menus, logo. Vector-like billboards drawn in code (outlined polygon/bezier primitives) or pre-rendered sprites | `cartoon-vector` |
| **Photoreal** | realistic fur, materials, lighting | AI-generated reference art turned into billboards and textures, then lit and graded; optional WebGL path | `raytraced-3d` guidance; new preset likely |

Rules:
- One mode switch (`?style=retro|ghibli|toon|photo`, options menu, saved to local storage). Same replay, same bot results in every mode.
- The render layer is an interface: `RenderProfile { drawRoad, drawBillboard, drawSky, drawHud, post }`. Each mode is one implementation. Asset lookups go through a manifest keyed by `(assetId, style)` with fallback to retro.
- Retro ships first and must be complete, then Toon (it has real reference art, so it is the second priority). Ghibli and photoreal are layered on, and a missing asset must degrade to retro rather than crash.
- **Style choice for the factory run:** run `factory styles recommend --idea "..."` and `factory styles apply` per mode; record departures in `config/style.json`. Ghibli and photoreal probably need new presets: stage them under `../game-factory/proposed/pawedracer/new/styles/presets/` (see §6).
- Honour the tech decision in §3 before choosing how Ghibli and photoreal are drawn.

### 2.1 Photorealistic mode and "polished characters from text descriptions"
The user wants to explore **tooling to turn text descriptions into polished, consistent characters**. This is a research-and-build track, with a deliverable that goes into the factory as a proposal.

Goal: given a **character bible** (structured text: species, build, fur colour and markings, outfit, props, personality, palette, forbidden traits) and optional **reference images**, produce a **consistent set of character art** (turnaround, expressions, poses, in-game billboards) in any of the three styles.

Proposed pipeline (each stage a small, testable module with a CLI and `--json`):
1. **Bible schema** (`character-bible.schema.json`): structured fields plus free-text; machine-checkable.
2. **Prompt composer**: bible + style + shot type → prompt text and negative prompt, deterministic and versioned.
3. **Generator adapters**: a pluggable interface (`generate(prompt, refs, seed) → image`) with adapters for whichever image-generation service the user approves (see open questions), plus a **mock adapter** that returns placeholder art so the whole pipeline is testable offline.
4. **Reference learning**: read images from `learning/` (the user is supplying a graphic of Perring Parkway Pete) and extract a **style/identity sheet**: dominant palette, silhouette notes, proportions, distinguishing features, written up as a bible patch. A vision-capable agent does the reading; the result is a reviewed text file, not an opaque embedding.
5. **Post-process**: background removal, trim, consistent scale and anchor, palette-lock or downscale for retro, soft-light/grade for photoreal, mipmaps for billboards.
6. **Consistency check**: automated checks (palette distance, size, anchor, silhouette overlap) plus a **contact sheet** a human or vision agent reviews, with a pass/fail verdict recorded.
7. **Export** to the asset-library format (descriptor plus hashes), so characters become reusable library assets.

Constraints:
- No image-generation service may be called, and no user data or reference image may be uploaded, without the user's explicit approval (they are an outward-facing action). Build and test everything against the mock adapter first, then ask.
- Generated and downloaded files are untrusted data: put them in their own directories, validate type and size, never execute them.
- Record provenance for each generated asset (prompt, model, seed, bible version, reference ids) so results are reproducible and licensable.
- Do not copy copyrighted Star Wars designs. Parody by homage (cheese pods, mice announcers, a rat rival); no logos, names or verbatim designs.

### 2.2 Learning directory (reference graphics have arrived)
`learning/` now holds copies of `SuperColby-front-side.jpeg` and `Perring-Parkway-Pete-front-side.jpeg` (front and side turnarounds, flat warm-grey background) plus `learning/IDENTITY-SHEETS.md`, the extracted identity sheets (palette, outline, proportions, signature features). Never modify the originals. **Pete is now canonical as the gaunt, red-eyed, armoured rat in the sheet**; the pinstripes-and-sunglasses look becomes a comic racing-suit variant. Super Colby (blue C-shirt, orange cape) is a costume variant of Colby: Colby the racer wears goggles, helmet and scarf over the same identity.
Use the sheets to: (a) define the Toon mode style, (b) seed the character bibles, (c) calibrate the character pipeline's palette-extraction and consistency checks.

### 2.3 Character library (new, a growing GitHub-tracked asset library)
Character assets for this and later games are collected in a **separate asset-library repo**:
| Coordinate | Value |
|---|---|
| Local path (relative to this repo) | `../character-library/` |
| Local path (absolute, this machine) | `/home/bill/src/fun/character-library/` |
| GitHub repo (planned, not yet published) | `github.com/bsommers/character-library` (`bsommers/character-library@main`) |
| Registry id | `character-library` |
The library follows the factory asset-library format (`library.json`, `assets/<id>/asset.json`, generated `INDEX.json/.md`, CI validator). It already exists as a local git repo with two seed assets: `super-colby.toon-turnaround` and `perring-parkway-pete.toon-turnaround` (image, `bible.json`, palette, tags `style:cartoon-vector`). Its `sources/` folder keeps the untouched originals.
Growth plan: every character the pipeline produces (Colby racer, Super Colby, Pete, rival racers, announcer mice, crowd) is added per style as `<character>.<style>.<kind>` assets (kinds: `turnaround`, `expressions`, `pose-sheet`, `billboard`), with the bible, prompt, provenance and consistency verdict stored beside the image. Bibles and prompts are assets too, so a character can be regenerated in a new style. Use `factory library add` / `validate` / `index`; the pipeline's export stage (§2.1 step 7) must call them. **Publishing the repo needs the user's approval** (`factory library publish` only prints the plan without `--yes`).

### 2.4 Tracking libraries from the factory (coordinates in docs and specs)
The factory must be able to track this and other libraries. Each project keeps a committed **`libraries.json`** next to `assets.lock.json` listing every library with both a relative local path and a GitHub coordinate, so a person, an agent or software can resolve either:
```json
{ "libraries": [
  { "id": "pawfall-assets",    "github": "bsommers/pawfall-assets@main",    "local": "../pawfall-assets",    "role": "colby sprites, sfx, songs" },
  { "id": "character-library", "github": "bsommers/character-library@main", "local": "../character-library", "role": "characters in all styles" }
]}
```
Resolution order: `local` if it exists, else `github`. A script (`tools/libs.mjs`, to be staged as a factory proposal `factory registry sync --manifest libraries.json`) adds each entry to the registry, refreshes, and reports status. Today the registry already accepts both forms (`registry add ../character-library`, `registry add bsommers/pawfall-assets@main`); the missing piece is the committed manifest and the sync command, staged under `../game-factory/proposed/pawedracer/new/`. Reference both coordinates, local relative first, in `README.md`, `docs/`, the site and every library's own README.

---

## 3. Technical decisions (to make in the contract, with recommendations)

| Question | Recommendation |
|---|---|
| Engine for racing | **Pseudo-3D segment renderer in Canvas 2D** for retro and Ghibli (fast, zero-dependency, fits the factory's web template). Keep a `RenderProfile` seam so a real-3D renderer (three.js or WebGL) can replace it for photoreal and for the follow-up 3D game. |
| Photoreal rendering | Start with **pre-generated photoreal billboards and textures on the same segment renderer**, with grading, depth fog, soft shadows and bloom as a post pass. Treat a WebGL/three.js path as a stretch goal, behind a dependency decision the orchestrator makes explicitly (this is the first non-zero-dep candidate). |
| Resolution | Retro: low internal (for example 320×200 or 384×216), integer-scaled. Ghibli and photoreal: higher, scaled smoothly. Decide in the contract and keep each fixed. |
| Sim | Deterministic, fixed 1/60 step, seeded RNG, Node-safe, no `Math.random`. Shared by all modes and by the bot. |
| Physics | New `pod-physics` module: speed, drag, steering, grip, banking, twin-engine yaw, boost/heat, collisions, barrel roll. Do not reuse platformer physics as-is. If it generalises, upstream it. |
| Audio | Synthesized only: engine drone as a pitch/volume function of speed and boost, doppler passes for rivals, track songs, crowd, announcer blips. Pure-JS offline PCM for tests and previews. |
| Assets | Retro Colby sprites and sfx come from `bsommers/pawfall-assets` (`../pawfall-assets`, see pawgger §4). Characters in every style come from `bsommers/character-library` (`../character-library`, §2.3). Pods, tracks, scenery are new. |

Open questions for the user (decide a default, proceed, and report; only ask if blocked):
1. **Which image-generation service, if any, may be used** for photoreal characters, and are API calls or uploads of the Pete reference acceptable? Default: none, mock adapter only.
2. (Resolved: Toon is a mode, not a separate game.) Is a true 3D renderer wanted in this game, or only the pseudo-3D seam? Default: seam only.
3. Final spelling of the title. Default: Pawed Racer.

---

## 4. Method and standing rules (inherited, with changes)

Everything in pawgger §2 and §5 still applies. Restated briefly:
- Use `../game-factory/`. Contract first by the orchestrator: `ARCHITECTURE.md` and `src/core/defs.js` (canvas, palette per style, constants, entities, events, SFX/music names, art manifest, every cross-module hook with an example call). Run `tools/check-imports.mjs` after every edit.
- Parallel sub-agents with an explicit `model` every time: Haiku mechanical, Sonnet integration, debugging, review, art, sim and planning, Opus only for a genuinely hard architecture or security question. Planning and research agents are Sonnet or Haiku. Subagents keep output short. Concurrency cap 5, using `swarm-next`.
- **Tracker:** Gantt-style web tracker (factory `swarm/dashboard`, copied as `tools/swarm-tracker`). **Port 4860** (verified free at spec time; 4780, 4795, 4841 and 4850 are taken). Put it in `README.md`, `docs/CHECKPOINT.md`, `docs/SWARM.md` and `package.json`, and verify it loads.
- Git: `git init` in `../pawedracer/` (it is not a repository yet), public repo `bsommers/pawedracer`, GitHub Pages from a workflow (site at `/`, game at `/play/`). **Ask the user before creating the public repo or pushing**, since publishing is outward-facing.
- Temp and build output under `/datanapps/claude-tmp`, never `/tmp`. Commit trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Re-run tests yourself before committing: agent claims are not evidence.

### Factory contribution policy (unchanged in spirit)
- Never edit live factory files. Stage changes under `../game-factory/proposed/pawedracer/` (a `.proposed` suffix mirroring the original path for changes, `new/<path>` for additions) and log each in `../game-factory/proposed/pawedracer/CHANGELOG-PAWEDRACER.md` (id, file, NEW or MODIFIES, why, how used, how to adopt, test status). Final pass: run the factory tests unmodified, verify the log against `git status`, report. No PRs.
- Strong factory candidates from this game: `pod-physics`, the segment road renderer, track generator and validator, the **render-profile abstraction**, Ghibli and photoreal style presets and themes, the **character-bible schema, prompt composer, generator-adapter interface (with mock), post-process and consistency-check tools**, SFX recipes (engines, doppler), new library assets.

---

## 5. Wave plan (proposed)

- **p0 (orchestrator, not delegated):** contract (`ARCHITECTURE.md`, `defs.js`), manifest, style decision, `config/style.json`, scaffold via `factory new pawedracer --web`, apply styles, install Colby/Pete assets from the registry.
- **p1:** sim-core (`pod-physics`, laps, collisions, boost/heat), track generator + validator, road renderer (retro), art-pods (cheese pods and engines), art-characters (Colby driving frames, Pete's pod placeholder), render-profile seam.
- **p2:** art-scenery per track (billboards, skies, tunnels), art-fx (speed lines, fire, stink, sparks), audio-sfx (engines, doppler, crowd), audio-music (track songs), AI racers and Pete behaviours, ui-shell (menus, HUD, shop, podium), tracker-media.
- **p3:** Ghibli profile (painted skies, soft billboards, post), qa-bot (autopilot that finishes every track on a range of seeds), character-pipeline tooling (bible schema, composer, mock adapter, post-process, consistency check), site and docs.
- **p0b (done by orchestrator before launch):** character-library repo seeded, registry entries added, identity sheets written.
- **p3b:** Toon profile (outlined billboards, HUD, logo) from `learning/`; art agents redraw Colby/Pete/pods in toon.
- **p4 (after the user approves any generator):** photoreal profile and assets, factory-extract and `proposed/` final pass.

Models: Haiku for SFX recipes, site, docs and mechanical edits; Sonnet for everything else; Opus only if a hard design question appears (for example the photoreal renderer decision).

---

## 6. Lessons to apply on day one

All of pawgger §6 and the factory's `docs/LEARNINGS-PAWFALL.md`, plus these for a racer:
- Seamless scrolling and road stripes need periods that divide the repeat length; derive them from the segment length.
- Make the fairness validator derive from the physics numbers (top speed, boost, turn rate vs curvature, hazard spacing) so retuning cannot make a track impossible. A lap-time estimator doubles as AI target pace.
- Poll input once per frame, carry edges to the next sim step (a barrel-roll tap must not be lost).
- Rubber-banding changes difficulty, not physics: keep it deterministic and seeded so replays and ghosts match.
- Keep every style swappable by data: no style-specific branches in the sim.
- Keep SFX recipes as pure data so live and offline rendering match; audio can only be checked by numbers here. Say so, and invite the user to listen.
- `*/` inside a `/** */` comment breaks the file. Use `//` in doc blocks.
- A `.gitignore` entry like `*.log` can silently drop files. Check `git ls-files` before publishing.
- Fetch and rebase the factory before pushing (it is not pushed in this build, but check `git status` before staging).

---

## 7. Definition of done

- Playable at `https://bsommers.github.io/pawedracer/play/` (once the user approves publishing) with a showcase site at `/`.
- Eight tracks, rival AI, shop, tournament, ghost mode, and all four style modes selectable (retro and toon complete; Ghibli complete; photoreal as far as approved tooling and assets allow, clearly reported).
- Tracker live during the build with agents, phases, media totals and galleries.
- `node --test test/*.mjs` green, import checker 0 errors, art sheets OK, bot finishes every track on a range of seeds in every mode, no console errors in headless Chrome, a smoke-tested single-file build.
- Character-from-text pipeline staged in `proposed/pawedracer/` with a working mock end-to-end demo and docs; Pete and Super Colby identity sheets derived from `learning/` (done) and the character-library repo growing with each new asset.
- `CHANGELOG-PAWEDRACER.md` complete, factory tests green.
- A final report: what was built, what was verified and how, what was not (audio unheard, any photoreal step untested against a real generator), and what is left.

---

## Appendix A. This session's request (verbatim)

> - use the refined specifiction and learnings from @../pawgger/spec/build-spec.md and @../pawgger/ ;
> - modify the game specification here and copy it to the spec/ directory ;
> - This game has the same theme with both retro and Studio Ghibli style graphics. It is called Pod Racer, like a cat pawing, and it is modeled off of the old Star Wars game from like 28 years ago called Pod Racer.
> - In this parody, Perring Parkway Pete is like Sebolba in one of the pod racers. But there's some kind of cheese theme to the vehicles and to the backgrounds and different levels that the race is in.
> - they are at the "Gouda Eve" race instead of "Boonta Eve" as in Star Wars Episode I (I think that was what the rraces were called).
> - also have a photorealistic mode. i want to explore how we can add tooling to the game factory to make even more polished characters from text descriptsons.
> - I will supply a graphic example of Perring Parkway Pete that you and your agents can learn from. in learning/ directory . i'll prompt when it is there.

Earlier directives from the Pawgger and PawFall prompts are in `../pawgger/spec/build-spec.md` (Appendix A, B and §2).
