// Pawed Racer canonical data. FROZEN (orchestrator). Every module imports constants from here; never duplicate numbers.
// Node-safe: no DOM at import time. Use // comments inside doc blocks (a star-slash would end a block comment early).

export const TITLE = 'Pawed Racer';
export const SUBTITLE = 'The Gouda Eve Classic';

// ---------------------------------------------------------------- display (logical pixels)
export const W = 320, H = 200;                 // retro logical canvas, integer-scaled, image-rendering: pixelated
export const HI_SCALE = 4;                     // toon / ghibli / photo canvases are W*HI_SCALE x H*HI_SCALE (1280x800), smooth scaling
export const FPS = 60, DT = 1 / 60;            // fixed sim step
export const STYLES = Object.freeze(['retro', 'toon', 'ghibli', 'photo']);   // visual modes, same sim; photo falls back to toon until its pack exists
export const DEFAULT_STYLE = 'retro';

// ---------------------------------------------------------------- pseudo-3D road (segment renderer, OutRun style)
export const ROAD = Object.freeze({
  segLen: 200,            // world units per segment
  roadWidth: 2000,        // half-width in world units (lateral position x in [-1,1] maps to +-roadWidth)
  rumbleLen: 3,           // segments per rumble/stripe colour band
  lanes: 3,
  cameraHeight: 1000,
  cameraDepth: 0.84,      // 1 / tan(fov/2), fov = 100 deg
  drawDistance: 220,      // segments drawn
  fogDensity: 5,
  horizonY: 78,           // logical px of the horizon line (retro); other styles scale by HI_SCALE
});

// ---------------------------------------------------------------- pod physics (pod-physics owns the maths; numbers live here)
export const POD = Object.freeze({
  maxSpeed: 12000,        // world units / s  (segLen 200 -> 60 seg/s)
  boostSpeed: 17000,
  accel: 5200,            // u/s^2 at full throttle
  brake: 9000,
  drag: 0.28,             // 1/s proportional drag when coasting
  offRoadMax: 4200,       // speed cap when |x| > 1
  offRoadDrag: 2.4,
  steer: 2.6,             // lateral units/s at full stick at reference speed (x is normalised road units)
  steerSpeedRef: 6000,
  centrifugal: 0.0000042, // push on x = curve * speed^2 * centrifugal * DT
  gripBase: 1.0,
  yawAssist: 1.5,         // twin-engine tilt (hold Z/X): multiplies steer for tight turns, costs speed
  yawAssistDrag: 0.35,
  boostDuration: 1.6, boostCooldown: 2.4,
  heatBoost: 0.38, heatCoolRate: 0.22, heatOverloadAt: 1.0, heatStall: 1.8,   // heat 0..1; at >=1 the engine blows and stalls
  rollTime: 0.45, rollCooldown: 1.2, rollInvuln: 0.35, rollSlide: 1.1,         // barrel roll dodge
  hitSlow: 0.55,          // speed multiplier on a hit
  healthMax: 100, wallDamage: 6, hazardDamage: 18, podHitDamage: 8,
  collisionX: 0.28,       // half-width of a pod in normalised road units
  collisionZ: 260,        // pod length in world units for pod/pod and hazard overlap
});

export const RACE = Object.freeze({
  racers: 8, laps: 3, countdown: 3.0, goTimeout: 0.3,
  rubberBand: 0.06,       // AI speed multiplier per 1000 units of gap, deterministic
  startGrid: 2,           // pods per row
  timeLimitBonus: 90,
  petePos: 7,             // Pete starts the Gouda Eve race pole-adjacent (index 1) and cheats: see ARCHITECTURE 5.4
});

export const SCORE = Object.freeze({ coin: 50, tuna: 100, lap: 500, place: [5000, 3000, 2000, 1000, 600, 300, 100, 0], petaBeat: 10000, noDamage: 2000, bestLap: 1500 });
export const PRIZE = Object.freeze({ place: [800, 500, 300, 150, 80, 40, 20, 0] });   // winnings in whiskers (shop currency) per place

// ---------------------------------------------------------------- tracks (data in tracks.js, ids here)
export const TRACKS = Object.freeze([
  { id: 'brie',     name: 'Brie Beach Run',      theme: 'day',   biome: 'coast',    laps: 3, length: 220 },
  { id: 'cheddar',  name: 'Cheddar Canyon',      theme: 'day',   biome: 'mesa',     laps: 3, length: 260 },
  { id: 'swiss',    name: 'Swiss Hole Tunnels',  theme: 'dusk',  biome: 'tunnels',  laps: 3, length: 260 },
  { id: 'fondue',   name: 'Fondue Falls',        theme: 'day',   biome: 'lava',     laps: 3, length: 300 },
  { id: 'blue',     name: 'Blue Cheese Bog',     theme: 'dusk',  biome: 'bog',      laps: 3, length: 300 },
  { id: 'parmesan', name: 'Parmesan Peaks',      theme: 'day',   biome: 'snow',     laps: 3, length: 340 },
  { id: 'camembert',name: 'Camembert Caverns',   theme: 'night', biome: 'caves',    laps: 3, length: 340 },
  { id: 'gouda',    name: 'Gouda Eve Classic',   theme: 'night', biome: 'arena',    laps: 5, length: 420 },
]);                                            // length = segments in thousands-of-units of 100 segments (so 220 = 22000 world units?) NO: length is in segments x 100. See ARCHITECTURE 3.

export const HAZARDS = Object.freeze({         // kind -> data. Sim and art both key off these names.
  wedge:   { w: 0.5, h: 1, damage: 18, solid: true,  slide: false, art: 'hz_wedge' },     // cheddar wedge on the road
  wheel:   { w: 0.7, h: 1, damage: 18, solid: true,  slide: true,  art: 'hz_wheel' },     // rolling cheese wheel, crosses the road
  grater:  { w: 1.0, h: 0, damage: 6,  solid: false, slide: false, art: 'hz_grater' },    // ridge strip: slows + rattles
  cutter:  { w: 0.9, h: 1, damage: 25, solid: true,  slide: true,  art: 'hz_cutter' },    // swinging cheese-cutter gate (timed)
  fondue:  { w: 0.8, h: 0, damage: 14, solid: false, slide: false, art: 'hz_fondue' },    // lava puddle: heat spike
  stink:   { w: 1.2, h: 0, damage: 0,  solid: false, slide: false, art: 'hz_stink' },     // fog cloud: visibility drop
  mine:    { w: 0.4, h: 1, damage: 30, solid: true,  slide: false, art: 'hz_mine' },      // Pete's dropped cheese-wheel mine
  hole:    { w: 0.6, h: 0, damage: 10, solid: false, slide: false, art: 'hz_hole' },      // swiss hole: jump-through or fall (barrel roll skips)
});
export const PICKUPS = Object.freeze({
  tuna:  { art: 'pk_tuna',  boost: 0.6 },        // tuna boost can: instant boost charge
  mouse: { art: 'pk_mouse', repair: 25 },        // repair mouse
  coin:  { art: 'pk_coin',  score: 50 },
  sardine: { art: 'pk_sardine', score: 100 }, collar: { art: 'pk_collar', score: 300 },
});

export const INPUT_KEYS = Object.freeze({ left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], throttle: ['ArrowUp', 'KeyW'], brake: ['ArrowDown', 'KeyS'], boost: ['Space'], roll: ['KeyX'], yawL: ['KeyZ'], yawR: ['KeyC'], pause: ['KeyP'], style: ['KeyG'] });

// ---------------------------------------------------------------- palette (retro). Toon/ghibli/photo packs define their own palettes in their pack (see TOON_PAL).
export const PAL = Object.freeze({
  outline: '#1a1420', black: '#0a0710', white: '#fff6e0',
  // colby (orange tabby), same as PawFall/Pawgger so installed sprites match
  furD: '#b8561a', fur: '#f08a24', furL: '#ffc26a', cream: '#fff0d0', stripe: '#a8430f', nose: '#ff8fa3', eye: '#7bd44a', eyeD: '#1f4a12',
  hat: '#c9b26a', hatD: '#8f7a3c', scarf: '#d63a2f', scarfL: '#ff6a58',
  // pete (canonical: gaunt charcoal rat, red eyes, scrap armour)
  peteFur: '#4a423b', peteFurD: '#3a342f', peteEar: '#a86a68', peteEye: '#e0262e', peteArmor: '#3b3d3a', peteArmorL: '#5a5d58', peteTail: '#c08a88', peteFoam: '#f1ead8',
  // super colby
  scBlue: '#3f77bd', scRed: '#e0392b', scYellow: '#f4d12e', scCape: '#f26a10',
  // cheese
  cheese: '#ffd23a', cheeseD: '#d9a41a', cheeseL: '#fff08a', cheeseHole: '#a87a2a', rind: '#c4742a', rindD: '#8f4f1a', brie: '#f2ead0', blue: '#8aa0d8', blueD: '#4f6aa8', mold: '#3a8a6a', parm: '#e8d4a0', fondue: '#ff8a2a', fondueD: '#d63a1a',
  // pods and metal
  steel: '#c8d0e0', steelD: '#7a8298', steelDD: '#4a5068', glass: '#7ec8ff', glassD: '#2a9ad6', flame: '#ffb02a', flameL: '#fff0a0', flameD: '#ff5a1a', tire: '#0a0710', pickle: '#5aa832', pickleD: '#3a7a1f',
  // road
  asphalt: '#3a3a4a', asphaltL: '#4a4a5c', asphaltD: '#2a2a38', roadLine: '#e8d68a', rumbleA: '#d63a2f', rumbleB: '#fff6e0', sand: '#e8c878', sandD: '#c4a050', grass: '#2f9a34', grassD: '#1d7a2c',
  // ui
  hudBg: '#0a0710', hudTxt: '#ffd23a', hudDim: '#8d7a3a', red: '#ff4a3a', green: '#6cf06c', heatLo: '#ffd23a', heatHi: '#ff4a3a',
});

// Toon pack palette: clean outline, flat fills (sampled from learning/ turnaround sheets, see learning/IDENTITY-SHEETS.md)
export const TOON_PAL = Object.freeze({
  outline: '#1a1a1a', paper: '#c4bcb4',
  colbyFur: '#e8963c', colbyStripe: '#c76a1f', colbyCream: '#fbe5c8', colbyEye: '#8fc04a', colbyEar: '#f0a0a0',
  scBlue: '#3f77bd', scRed: '#e0392b', scYellow: '#f4d12e', scCape: '#f26a10',
  peteFur: '#4a423b', peteShade: '#3a342f', peteSkin: '#a86a68', peteEye: '#e0262e', peteArmor: '#3b3d3a', peteTooth: '#f1ead8',
});

// ---------------------------------------------------------------- audio names (sfx-recipes and music keyed by these; recipes are pure data)
export const SFX = Object.freeze(['engine_loop', 'boost_on', 'boost_end', 'overheat', 'engine_stall', 'repair', 'roll', 'hit_wall', 'hit_pod', 'hit_hazard', 'scrape', 'pickup_coin', 'pickup_tuna', 'pickup_mouse', 'lap', 'final_lap', 'finish', 'podium', 'countdown_beep', 'countdown_go', 'pass_whoosh', 'crowd_loop', 'pete_laugh', 'pete_taunt', 'announcer_blip', 'menu_move', 'menu_ok', 'shop_buy', 'cheese_cut', 'splat']);
export const MUSIC = Object.freeze(['title', 'shop', 'podium', 'race_brie', 'race_cheddar', 'race_swiss', 'race_fondue', 'race_blue', 'race_parmesan', 'race_camembert', 'race_gouda', 'duel_pete']);

// ---------------------------------------------------------------- events (bus). payloads in ARCHITECTURE 5.3
export const EVENTS = Object.freeze(['countdown', 'go', 'lap', 'finalLap', 'finish', 'boost', 'boostEnd', 'overheat', 'stall', 'roll', 'hit', 'scrape', 'pickup', 'pass', 'peteTaunt', 'peteDrop', 'repair', 'place', 'raceEnd', 'pause']);

// ---------------------------------------------------------------- upgrade shop (data table, parts by name)
export const PARTS = Object.freeze({
  engine:  { name: 'Fondue Engines',   tiers: [0, 400, 900, 1800, 3200], effect: 'maxSpeed x +4% per tier' },
  cooling: { name: 'Ice-Cube Cooler',  tiers: [0, 300, 700, 1500, 2800], effect: 'heatCoolRate x +12% per tier' },
  grip:    { name: 'Rind Tires',       tiers: [0, 300, 700, 1500, 2800], effect: 'centrifugal x -8% per tier' },
  armor:   { name: 'Gouda Plating',    tiers: [0, 250, 600, 1200, 2400], effect: 'damage taken x -8% per tier' },
  thrust:  { name: 'Tuna Thrusters',   tiers: [0, 350, 800, 1600, 3000], effect: 'accel x +6% per tier' },
});

// ---------------------------------------------------------------- art manifest: every sprite/sheet name, size (logical px) and frame count. Packs for ALL styles supply the same names; size is logical, hi-res styles render at size*HI_SCALE.
export const ART = Object.freeze({
  pods: {   // rear view, driving away. frames: 0..4 = steer -2..+2 (left..right); each has engine flame animation done by renderer overlay `pod_flame`
    pod_colby:  { w: 40, h: 28, frames: 5 }, pod_pete: { w: 48, h: 32, frames: 5 },
    pod_r1: { w: 40, h: 28, frames: 5 }, pod_r2: { w: 40, h: 28, frames: 5 }, pod_r3: { w: 40, h: 28, frames: 5 }, pod_r4: { w: 40, h: 28, frames: 5 }, pod_r5: { w: 40, h: 28, frames: 5 },
    pod_flame:  { w: 12, h: 16, frames: 4 }, pod_shadow: { w: 40, h: 8, frames: 1 }, pod_roll: { w: 40, h: 28, frames: 6 }, pod_wreck: { w: 40, h: 28, frames: 2 },
  },
  chars: {  // cockpit/portrait art for HUD, radio, podium
    portrait_colby: { w: 48, h: 48, frames: 3 },      // idle, boost grin, hurt
    portrait_pete: { w: 48, h: 48, frames: 3 },       // snarl, laugh, shocked
    portrait_supercolby: { w: 48, h: 48, frames: 2 },
    portrait_mouse_a: { w: 32, h: 32, frames: 2 }, portrait_mouse_b: { w: 32, h: 32, frames: 2 },   // announcer booth
    colby_podium: { w: 48, h: 64, frames: 3 }, pete_podium: { w: 48, h: 64, frames: 3 }, logo: { w: 200, h: 48, frames: 1 },
  },
  hazards: Object.fromEntries(Object.values(HAZARDS).map((h) => [h.art, { w: 40, h: 32, frames: 2 }])),
  pickups: Object.fromEntries(Object.values(PICKUPS).map((p) => [p.art, { w: 16, h: 16, frames: 4 }])),
  scenery: {  // roadside billboards, scaled by distance. names per biome; each has 1-2 frames
    sc_palm: { w: 48, h: 64, frames: 2 }, sc_rock: { w: 48, h: 40, frames: 1 }, sc_wheel_big: { w: 64, h: 64, frames: 1 }, sc_cactus: { w: 32, h: 56, frames: 1 },
    sc_stalag: { w: 40, h: 64, frames: 1 }, sc_pine: { w: 40, h: 72, frames: 2 }, sc_mushroom: { w: 40, h: 48, frames: 2 }, sc_crystal: { w: 32, h: 48, frames: 2 },
    sc_lamp: { w: 16, h: 64, frames: 2 }, sc_crowd: { w: 64, h: 32, frames: 4 }, sc_banner: { w: 64, h: 32, frames: 2 }, sc_sign: { w: 32, h: 40, frames: 1 },
    sc_start: { w: 220, h: 40, frames: 1 }, sc_tunnel: { w: 300, h: 160, frames: 1 }, sc_cheese_house: { w: 64, h: 56, frames: 1 },
    sc_pete_billboard: { w: 96, h: 56, frames: 1 },   // Pete's face looming over the Gouda Eve arena
  },
  backdrop: {  // far layers, scroll with road curvature; W wide for wrap
    bg_sky_day: { w: 640, h: 80, frames: 1 }, bg_sky_dusk: { w: 640, h: 80, frames: 1 }, bg_sky_night: { w: 640, h: 80, frames: 1 },
    bg_hills: { w: 640, h: 48, frames: 1 }, bg_mesa: { w: 640, h: 56, frames: 1 }, bg_peaks: { w: 640, h: 64, frames: 1 }, bg_skyline: { w: 640, h: 48, frames: 1 }, bg_cave: { w: 640, h: 64, frames: 1 },
  },
  fx: { fx_spark: { w: 8, h: 8, frames: 4 }, fx_smoke: { w: 16, h: 16, frames: 4 }, fx_fire: { w: 16, h: 16, frames: 4 }, fx_speed: { w: 24, h: 3, frames: 1 }, fx_stink: { w: 24, h: 24, frames: 4 }, fx_boost: { w: 32, h: 24, frames: 4 }, fx_confetti: { w: 6, h: 6, frames: 4 }, fx_cheese_crumb: { w: 6, h: 6, frames: 2 } },
  ui: { hud_frame: { w: 320, h: 200, frames: 1 }, hud_heat: { w: 48, h: 8, frames: 1 }, hud_icons: { w: 96, h: 12, frames: 8 }, cursor_paw: { w: 12, h: 12, frames: 2 }, shop_parts: { w: 24, h: 24, frames: 5 } },
});

// ---------------------------------------------------------------- hooks (full signatures and examples in ARCHITECTURE section 5)
export const HOOKS = Object.freeze({
  createRace: 'src/sim/race.js  createRace({ track, seed, laps, player:{ parts, pilot }, mode }) -> race',
  raceStep: 'race.step(input, dt=DT) -> void; input = { steer:-1..1, throttle:0..1, brake:0..1, boost:bool, roll:-1|0|1 (edge), yaw:-1|0|1 }',
  raceView: 'race.view() -> frozen snapshot for render/UI/bot (ARCHITECTURE 5.2)',
  trackDef: 'src/levels/tracks.js  trackDef(id, seed) -> { id, segments:[{ curve, y, bank, tunnel, zone }], objects:[...], length, laps, theme, biome }',
  validateTrack: 'src/levels/validate.js  validateTrack(def, physics=POD) -> { ok, lapTime, issues:[] }',
  createRenderer: 'src/render/renderer.js  createRenderer(ctx, { style }) -> { draw(view, t), setStyle(id), resize() }',
  buildArt: 'src/art/registry.js  buildArt({ style }) -> Promise<{ get(name) -> { frames, w, h } }>',
  createAudio: 'src/audio/audio.js  createAudio(bus, settings) -> { resume(), setMusic(name), engine(speed01, boost) }',
  createBot: 'src/sim/autopilot.js  createBot({ skill:0..1, seed }) -> { act(view) -> input }',
});

// Flat manifest for tools/sheet.mjs: { module, name, w, h, frames } per art name. `module` is the ART group, mapped to the file below.
const ART_FILE = { pods: 'pods', chars: 'chars', hazards: 'hazards', pickups: 'hazards', scenery: 'scenery', backdrop: 'backdrop', fx: 'fx', ui: 'fx' };
export function artManifest() {
  const out = [];
  for (const [group, names] of Object.entries(ART)) for (const [name, s] of Object.entries(names)) out.push({ module: ART_FILE[group], group, name, w: s.w, h: s.h, frames: s.frames });
  return out;
}
