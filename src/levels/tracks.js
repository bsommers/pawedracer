// Track generator (ARCHITECTURE sections 3 and 6).
// trackDef(id, seed) -> { id, name, segments:[{ curve, vis, y, bank, tunnel, zone }], objects:[...], length, laps, theme, biome }
//  * curve  = physical curve used by sim/AI/validator (push = curve * v^2 * POD.centrifugal), roughly +-0.0005..0.022
//  * vis    = curve * CURVE_VISUAL, classic OutRun units (+-0..7) for the renderer's dx accumulation
//  * y      = absolute elevation in world units; the lap starts and ends at 0 so the loop closes
// Skeleton (segments) depends only on the track id. Objects depend on the seed. No Math.random.
import { TRACKS, ROAD, POD, HAZARDS, PICKUPS } from '../core/defs.js';
import { createRng } from '../core/rng.js';
import { speedProfile, shiftBudget, SAFETY, hazardRowHalf, CLEAR_START, CLEAR_END, TIMED_SPACING, TIMED_VS_STATIC, MIN_ROW_GAP, CUTTER_AMP } from './validate.js';

export const CURVE_VISUAL = 300;
export const TRACK_IDS = Object.freeze(TRACKS.map((t) => t.id));

// section tuple: [weight, curve, hillEndHeight, zone, flags]  (flags: { tunnel, bank })
const S = (w, curve, hill = 0, zone = 'normal', f = {}) => ({ w, curve, hill, zone, ...f });

const SECTIONS = {
  brie: [
    S(10, 0, 0, 'start'), S(14, .0030, 150), S(8, 0, 300), S(14, -.0035, 300), S(10, .0020, 500), S(12, .0045, 350),
    S(8, 0, 200), S(14, -.0042, 100), S(10, 0, 0), S(12, .0025, -100), S(12, -.0030, 0), S(10, .0040, 120), S(10, -.0025, 0), S(8, 0, 0),
  ],
  cheddar: [   // wedge-shaped mesa corners and esses
    S(8, 0, 0, 'start'), S(8, .0075, 150), S(8, -.0080, 250), S(8, .0070, 150), S(10, 0, 400), S(10, -.0095, 600), S(8, .0060, 400),
    S(8, 0, 200), S(7, .0105, 200), S(7, -.0100, 100), S(7, .0090, 0), S(9, 0, -150), S(10, -.0085, 0), S(10, .0070, 100), S(9, 0, 0),
  ],
  swiss: [     // tunnels (dusk), long sweepers inside
    S(8, 0, 0, 'start'), S(10, .0040, 100), S(8, 0, 100, 'tunnel', { tunnel: true }), S(14, -.0060, 200, 'tunnel', { tunnel: true }), S(12, .0050, 200, 'tunnel', { tunnel: true }),
    S(8, 0, 300), S(10, .0070, 500), S(10, -.0060, 350), S(8, 0, 200, 'tunnel', { tunnel: true }), S(12, .0075, 100, 'tunnel', { tunnel: true }), S(12, -.0080, 0, 'tunnel', { tunnel: true }),
    S(8, 0, 0), S(10, .0045, 0), S(8, -.0035, 0),
  ],
  fondue: [    // heat and lava
    S(8, 0, 0, 'start'), S(10, .0060, 100), S(10, -.0070, 300), S(8, 0, 500, 'lava'), S(12, .0090, 700, 'lava'), S(10, -.0090, 600, 'lava'),
    S(8, 0, 400, 'lava'), S(10, .0085, 200), S(9, -.0100, 100), S(8, 0, 300), S(12, .0105, 500, 'lava'), S(10, -.0080, 200, 'lava'), S(9, .0060, 0), S(8, 0, 0),
  ],
  blue: [      // bog with fog banks
    S(8, 0, 0, 'start'), S(12, .0040, 0), S(10, -.0050, -100, 'fog'), S(14, .0060, -200, 'fog'), S(10, 0, -100, 'fog'), S(12, -.0065, 0),
    S(10, .0050, 100), S(8, 0, 100, 'fog'), S(14, -.0075, 0, 'fog'), S(12, .0070, -100, 'fog'), S(10, 0, 0), S(10, -.0045, 0), S(10, .0035, 0), S(8, 0, 0),
  ],
  parmesan: [  // hills and graters
    S(8, 0, 0, 'start'), S(10, .0045, 800), S(12, 0, 2200, 'grater'), S(10, -.0060, 3200), S(10, .0050, 3000), S(8, 0, 1800, 'grater'),
    S(12, -.0070, 600), S(10, .0075, 1400), S(10, 0, 2600, 'grater'), S(10, -.0065, 1800), S(8, .0055, 900), S(12, 0, 300, 'grater'), S(10, .0040, 0), S(8, -.0030, 0), S(6, 0, 0),
  ],
  camembert: [ // tight cave turns, always dark
    S(7, 0, 0, 'start', { tunnel: true }), S(7, .0170, 100, 'cave', { tunnel: true }), S(6, -.0200, 200, 'cave', { tunnel: true }), S(6, .0150, 100, 'cave', { tunnel: true }),
    S(6, 0, 300, 'cave', { tunnel: true }), S(7, -.0190, 200, 'cave', { tunnel: true }), S(6, .0220, 100, 'cave', { tunnel: true }), S(6, -.0120, 0, 'cave', { tunnel: true }),
    S(6, 0, -100, 'cave', { tunnel: true }), S(7, .0185, 0, 'cave', { tunnel: true }), S(6, -.0165, 100, 'cave', { tunnel: true }), S(6, .0140, 0, 'cave', { tunnel: true }),
    S(6, -.0210, 0, 'cave', { tunnel: true }), S(6, .0120, 0, 'cave', { tunnel: true }), S(6, 0, 0, 'cave', { tunnel: true }),
  ],
  gouda: [     // grand loop with a long straight
    S(20, 0, 0, 'start'), S(120, 0, 0, 'straight'), S(14, .0035, 0, 'crowd'), S(14, .0060, 300, 'crowd'), S(10, 0, 300), S(18, .0085, 500), S(10, -.0050, 600),
    S(12, -.0090, 400), S(10, 0, 200), S(14, .0060, 0), S(14, -.0075, -200), S(10, 0, -200), S(16, .0095, 0, 'crowd'), S(16, .0070, 100, 'crowd'),
    S(10, 0, 0), S(14, -.0065, 0), S(12, .0045, 0), S(10, 0, 0, 'crowd'),
  ],
};
const BANK_SCALE = { brie: .5, cheddar: .6, swiss: .4, fondue: .7, blue: .3, parmesan: .9, camembert: 1, gouda: .8 };

const smooth = (u) => u * u * (3 - 2 * u);

/** Segment skeleton for a track id. Depends on nothing but the id. */
export function buildSegments(id) {
  const meta = TRACKS.find((t) => t.id === id);
  if (!meta) throw new Error(`unknown track ${id}`);
  const secs = SECTIONS[id];
  const n = meta.length * 10;
  const wTot = secs.reduce((a, s) => a + s.w, 0);
  const segs = [];
  let acc = 0, yPrev = 0;
  secs.forEach((s, k) => {
    const end = k === secs.length - 1 ? n : Math.round(((acc += s.w) / wTot) * n);
    const start = segs.length, len = end - start;
    const hill = k === secs.length - 1 ? 0 : s.hill;
    for (let i = 0; i < len; i++) {
      const u = (i + 0.5) / len;
      const env = smooth(Math.min(u / 0.3, 1)) * smooth(Math.min((1 - u) / 0.3, 1));
      segs.push({ curve: s.curve * env, y: yPrev + (hill - yPrev) * smooth(u), bank: 0, tunnel: !!s.tunnel, zone: s.zone });
    }
    yPrev = hill;
  });
  // closure: scale the heavier side of the curve sum so left and right cancel exactly
  let P = 0, N = 0;
  for (const s of segs) { if (s.curve > 0) P += s.curve; else N -= s.curve; }
  if (P > 0 && N > 0) {
    const f = P > N ? N / P : P / N;
    for (const s of segs) if ((P > N) === (s.curve > 0)) s.curve *= f;
  }
  const bs = BANK_SCALE[id] ?? 0.5;
  for (const s of segs) {
    s.bank = Math.max(-1, Math.min(1, s.curve * 45)) * bs;
    s.vis = s.curve * CURVE_VISUAL;
    s.y = Math.round(s.y * 100) / 100;
  }
  return segs;
}

// ---------------------------------------------------------------- object placement configs
const W = (...pairs) => pairs;   // [[kind, weight], ...]
const CFG = {
  brie: {
    rowMin: 9000, rowMax: 15000, timed: 0.0, soft: 0.1, wheelChance: 0,
    kinds: W(['wedge', 5]), zoneKinds: {}, softKinds: W(['grater', 1]),
    scenery: ['sc_palm', 'sc_palm', 'sc_rock', 'sc_sign', 'sc_cheese_house'], step: [5, 9],
  },
  cheddar: {
    rowMin: 6500, rowMax: 11000, timed: 0.12, soft: 0.05, wheelChance: 0.7,
    kinds: W(['wedge', 8], ['wheel', 0]), zoneKinds: {}, softKinds: W(['grater', 1]),
    scenery: ['sc_cactus', 'sc_rock', 'sc_rock', 'sc_wheel_big', 'sc_sign'], step: [5, 9],
  },
  swiss: {
    rowMin: 6500, rowMax: 11000, timed: 0.1, soft: 0.04, wheelChance: 0.5,
    kinds: W(['wedge', 3], ['hole', 5]), zoneKinds: { tunnel: W(['hole', 6], ['wedge', 2]) }, softKinds: W(['grater', 1]),
    scenery: ['sc_mushroom', 'sc_stalag', 'sc_lamp', 'sc_cheese_house', 'sc_sign'], step: [6, 10],
  },
  fondue: {
    rowMin: 6000, rowMax: 10000, timed: 0.1, soft: 0.04, wheelChance: 0.3,
    kinds: W(['wedge', 3], ['fondue', 3]), zoneKinds: { lava: W(['fondue', 7], ['wedge', 1]) }, softKinds: W(['grater', 1]),
    scenery: ['sc_rock', 'sc_crystal', 'sc_sign', 'sc_lamp', 'sc_cactus'], step: [5, 9],
  },
  blue: {
    rowMin: 6000, rowMax: 10500, timed: 0.04, soft: 0.38, wheelChance: 0.5,
    kinds: W(['wedge', 3], ['mine', 4]), zoneKinds: { fog: W(['mine', 5], ['wedge', 1]) }, softKinds: W(['stink', 1]),
    scenery: ['sc_mushroom', 'sc_pine', 'sc_rock', 'sc_lamp', 'sc_sign'], step: [5, 9],
  },
  parmesan: {
    rowMin: 6500, rowMax: 11000, timed: 0.08, soft: 0.34, wheelChance: 0.6,
    kinds: W(['wedge', 4], ['mine', 1]), zoneKinds: { grater: W(['wedge', 1]) }, softKinds: W(['grater', 1]),
    scenery: ['sc_pine', 'sc_pine', 'sc_rock', 'sc_sign', 'sc_crystal'], step: [5, 9],
  },
  camembert: {
    rowMin: 7500, rowMax: 12000, timed: 0.05, soft: 0.1, wheelChance: 0.3,
    kinds: W(['wedge', 3], ['hole', 2]), zoneKinds: {}, softKinds: W(['stink', 1]),
    scenery: ['sc_stalag', 'sc_stalag', 'sc_crystal', 'sc_mushroom', 'sc_lamp'], step: [4, 7],
  },
  gouda: {
    rowMin: 5500, rowMax: 9000, timed: 0.24, soft: 0.08, wheelChance: 0.5,
    kinds: W(['wedge', 4], ['mine', 1], ['hole', 1]), zoneKinds: { straight: W(['wedge', 1]) }, softKinds: W(['grater', 1]),
    scenery: ['sc_lamp', 'sc_banner', 'sc_sign', 'sc_lamp', 'sc_crowd'], step: [4, 8],
  },
};

function wpick(rng, pairs) {
  const tot = pairs.reduce((a, p) => a + p[1], 0);
  let r = rng.next() * tot;
  for (const [k, w] of pairs) { if ((r -= w) < 0) return k; }
  return pairs[0][0];
}
const mk = (kind, z, x, extra = {}) => {
  const type = HAZARDS[kind] ? 'hazard' : PICKUPS[kind] ? 'pickup' : 'scenery';
  const art = HAZARDS[kind]?.art ?? PICKUPS[kind]?.art ?? kind;
  return { z: Math.round(z), x: Math.round(x * 1000) / 1000, kind, type, art, ...extra };
};

function placeObjects(id, segs, seed) {
  const cfg = CFG[id], meta = TRACKS.find((t) => t.id === id);
  const rng = createRng((seed * 2654435761 + TRACK_IDS.indexOf(id) * 40503 + 17) >>> 0);
  const n = segs.length, total = n * ROAD.segLen, segLen = ROAD.segLen;
  const prof = speedProfile(segs, POD);
  const idx = (z) => Math.min(n - 1, Math.max(0, Math.floor(z / segLen)));
  const objs = [];
  const gapHalf = 0.3;                       // free pod-centre half-width we promise (validator needs >= 0.252)
  const rows = [];                           // { z, g } for pickups

  // ---- hazard rows
  let z = CLEAR_START + 1200 + rng.range(0, 2500), prevZ = null, gPrev = 0, lastTimedZ = -1e9, lastRowZ = -1e9;
  while (z < total - CLEAR_END - 1500) {
    const i = idx(z), seg = segs[i];
    let gapToPrev = prevZ == null ? 1e9 : z - prevZ;
    const roll = rng.next();
    let type = 'static';
    if (roll < cfg.timed) type = 'timed'; else if (roll < cfg.timed + cfg.soft) type = 'soft';
    if (type === 'timed' && (z - lastTimedZ < TIMED_SPACING || z - lastRowZ < TIMED_VS_STATIC)) type = 'static';
    if (type === 'static' && z - lastTimedZ < TIMED_VS_STATIC) { z += TIMED_VS_STATIC; continue; }
    if (seg.zone === 'start') { z += 3000; continue; }
    if (type === 'static') {
      const v = prof[i];
      const budget = Math.min(0.9, shiftBudget(v, seg.curve, gapToPrev, POD) * SAFETY);
      let g = gPrev + rng.range(-1, 1) * budget;
      g = Math.max(-0.62, Math.min(0.62, g));
      if (prevZ != null && Math.abs(g - gPrev) > budget) g = gPrev + Math.sign(g - gPrev) * budget;
      const kinds = cfg.zoneKinds[seg.tunnel && cfg.zoneKinds.tunnel ? 'tunnel' : seg.zone] || cfg.kinds;
      let placed = 0;
      const sides = [-1, 1];
      if (rng.chance(0.5)) sides.reverse();
      for (const side of sides) {
        if (placed && !rng.chance(0.85)) continue;
        const kind = wpick(rng, kinds.filter((p) => p[1] > 0));
        const x = g + side * (gapHalf + hazardRowHalf(kind, POD) + 0.03);
        if (Math.abs(x) > 1.12) continue;
        objs.push(mk(kind, z + rng.range(-120, 120) * 0, x)); placed++;
      }
      if (!placed) { z += 2000; continue; }
      rows.push({ z, g });
      gPrev = g; prevZ = z; lastRowZ = z;
    } else if (type === 'timed') {
      const wheel = rng.chance(cfg.wheelChance);
      const period = Math.round(rng.range(3.2, 4.6) * 100) / 100;
      objs.push(mk(wheel ? 'wheel' : 'cutter', z, 0, wheel ? { period, phase: Math.round(rng.next() * 100) / 100 } : { period, phase: Math.round(rng.next() * 100) / 100, amp: CUTTER_AMP }));
      lastTimedZ = z; lastRowZ = z;
    } else {
      const kind = wpick(rng, cfg.softKinds);
      if (kind === 'grater') objs.push(mk('grater', z, rng.range(-0.15, 0.15)));
      else objs.push(mk('stink', z, rng.range(-0.6, 0.6)));
      lastRowZ = Math.max(lastRowZ, z - 100000);
    }
    z += rng.range(cfg.rowMin, cfg.rowMax);
  }
  // fog and lava stretches get extra soft puffs so the zone reads
  if (id === 'blue' || id === 'camembert') {
    for (let k = CLEAR_START; k < total - CLEAR_END; k += rng.range(2400, 4200)) {
      const s = segs[idx(k)];
      if (s.zone === 'fog' || s.zone === 'cave') objs.push(mk('stink', k, rng.range(-0.8, 0.8)));
    }
  }
  const hazardZ = objs.filter((o) => o.type === 'hazard').map((o) => o.z);
  const nearHazard = (zz, d) => hazardZ.some((h) => Math.abs(h - zz) < d);

  // ---- pickups: coin trails ride the safe line between rows; tuna/mouse/sardine/collar sit on open road
  for (let r = 0; r + 1 < rows.length; r++) {
    if (!rng.chance(0.6)) continue;
    const a = rows[r], b = rows[r + 1];
    if (b.z - a.z > 22000) continue;
    const cnt = rng.int(3, 5);
    for (let c = 1; c <= cnt; c++) {
      const u = c / (cnt + 1), zz = a.z + (b.z - a.z) * u * 0.9 + 600;
      const xx = a.g + (b.g - a.g) * smooth(u);
      if (!nearHazard(zz, 900)) objs.push(mk('coin', zz, xx));
    }
  }
  const lapPickups = [['tuna', 4], ['mouse', 3], ['sardine', 3], ['collar', 1]];
  for (const [kind, count] of lapPickups) {
    let tries = 0, got = 0;
    while (got < count && tries++ < 60) {
      const zz = rng.range(CLEAR_START, total - CLEAR_END);
      if (nearHazard(zz, 2200)) continue;
      const x = kind === 'collar' ? (rng.chance(0.5) ? -1 : 1) * rng.range(0.7, 0.92) : rng.range(-0.55, 0.55);
      objs.push(mk(kind, zz, x)); got++;
    }
  }
  if (id === 'gouda') {   // tuna runway on the long straight
    for (let s = 40; s < 150; s += 12) objs.push(mk('tuna', s * segLen, ((s / 12) % 2 ? 0.3 : -0.3)));
  }

  // ---- fixed landmarks (skeleton-determined) and seeded scenery
  objs.push(mk('sc_start', 3 * segLen, 0));
  let inTunnel = false;
  for (let i = 0; i < n; i++) {
    if (segs[i].tunnel !== inTunnel) {
      inTunnel = segs[i].tunnel;
      if (id !== 'camembert' || i > 0) objs.push(mk('sc_tunnel', i * segLen, 0));
    }
  }
  if (id === 'gouda') {
    objs.push(mk('sc_pete_billboard', 70 * segLen, -1.9));
    objs.push(mk('sc_pete_billboard', 100 * segLen, 1.9));
    objs.push(mk('sc_pete_billboard', (n - 25) * segLen, -1.9));
  }
  for (let i = 8; i < n - 4; i += rng.int(cfg.step[0], cfg.step[1])) {
    const s = segs[i];
    let kind = rng.pick(cfg.scenery);
    if (s.zone === 'crowd') kind = rng.chance(0.65) ? 'sc_crowd' : rng.pick(['sc_banner', 'sc_lamp']);
    if (s.zone === 'straight' && rng.chance(0.5)) kind = rng.chance(0.7) ? 'sc_crowd' : 'sc_banner';
    if (s.tunnel && !['sc_stalag', 'sc_lamp', 'sc_crystal', 'sc_mushroom'].includes(kind)) kind = rng.pick(['sc_stalag', 'sc_crystal', 'sc_lamp']);
    const side = rng.chance(0.5) ? -1 : 1;
    objs.push(mk(kind, i * segLen, side * rng.range(1.3, 2.7)));
    if (rng.chance(0.3)) objs.push(mk(rng.pick(cfg.scenery), (i + 1) * segLen, -side * rng.range(1.4, 2.9)));
  }
  objs.sort((a, b) => a.z - b.z);   // stable, so same-z order stays deterministic
  return objs;
}

const skeletonCache = new Map();
export function trackDef(id, seed = 1) {
  const meta = TRACKS.find((t) => t.id === id);
  if (!meta) throw new Error(`unknown track ${id}`);
  let segments = skeletonCache.get(id);
  if (!segments) { segments = buildSegments(id); skeletonCache.set(id, segments); }
  const segs = segments.map((s) => ({ ...s }));   // callers may not mutate the cache
  const objects = placeObjects(id, segs, seed | 0);
  return { id, name: meta.name, seed: seed | 0, segments: segs, objects, length: meta.length, laps: meta.laps, theme: meta.theme, biome: meta.biome, segLen: ROAD.segLen };
}
