// Track fairness validator and speed-profile maths (ARCHITECTURE sections 3 and 6). Pure, Node-safe, deterministic.
// tracks.js imports the shared helpers from here so generator and validator can never disagree.
import { POD, ROAD, HAZARDS, PICKUPS, ART } from '../core/defs.js';

export const BLOCKING = Object.freeze(['wedge', 'mine', 'fondue', 'hole']);   // static hazards a pod must steer around
export const TIMED = Object.freeze(['cutter', 'wheel']);                       // pure functions of race.t
export const SOFT = Object.freeze(['grater', 'stink']);                        // slow/visibility only, never block
export const CUTTER_AMP = 0.7;
export const WHEEL_RANGE = 1.2;
export const CLEAR_START = 4000, CLEAR_END = 3000;   // world units kept free of hazards near the line
export const MIN_ROW_GAP = 760;                       // hazards closer than this in z form one row (collisionZ + margin)
export const TIMED_SPACING = 4500;                    // min z distance between two timed hazards
export const TIMED_VS_STATIC = 2500;                  // min z distance between a timed hazard and any static row
export const GRID = 0.02;                             // lateral grid step for reachability
const SAFETY = 0.7;                                   // generator stays this fraction inside the validator's budget

export const podWidth = (phys = POD) => 2 * phys.collisionX;
export const minGap = (phys = POD) => 0.9 * podWidth(phys);   // free pod-centre interval (road units) a row must leave

/** Steer rate (road units/s) available at speed v. */
export function steerAt(v, phys = POD) {
  const s = Math.min(1, Math.max(0.3, v / phys.steerSpeedRef));
  return phys.steer * s;
}
/** Lateral centrifugal push (road units/s) at speed v on a segment with this curve. */
export const pushAt = (v, curve, phys = POD) => Math.abs(curve) * v * v * phys.centrifugal;
/** Net steering authority left over after fighting the push; floor keeps it positive. */
export function netSteer(v, curve, phys = POD) {
  const s = steerAt(v, phys);
  return Math.max(0.2 * s, s - pushAt(v, curve, phys));
}
/** Highest speed at which the push uses at most 80% of steer authority. */
export function cornerLimit(curve, phys = POD) {
  const k = Math.abs(curve);
  if (k < 1e-9) return phys.maxSpeed;
  // low-speed branch: steer scales with v (v <= ref); high-speed branch: steer flat
  const low = (0.8 * phys.steer) / (phys.steerSpeedRef * phys.centrifugal * k);
  const v = low <= phys.steerSpeedRef ? low : Math.sqrt((0.8 * phys.steer) / (phys.centrifugal * k));
  return Math.min(phys.maxSpeed, Math.max(phys.maxSpeed * 0.05, v));
}

/** Per-segment target speed (u/s) of a tidy driver: corner limited, accel and brake bounded, cyclic. */
export function speedProfile(segments, phys = POD, driveFrac = 0.92) {
  const n = segments.length, ds = ROAD.segLen;
  const top = phys.maxSpeed * driveFrac;
  const v = segments.map((s) => Math.min(top, cornerLimit(s.curve, phys)));
  const brake = phys.brake * 0.7, accel = phys.accel * 0.8;
  for (let pass = 0; pass < 3; pass++) {
    for (let k = n * 2 - 1; k >= 0; k--) {          // backward: braking
      const i = k % n, j = (i + 1) % n;
      v[i] = Math.min(v[i], Math.sqrt(v[j] * v[j] + 2 * brake * ds));
    }
    for (let k = 0; k < n * 2; k++) {                // forward: accel
      const i = k % n, j = (i + 1) % n;
      v[j] = Math.min(v[j], Math.sqrt(v[i] * v[i] + 2 * accel * ds));
    }
  }
  return v;
}
export function lapTimeOf(profile) {
  let t = 0;
  for (const v of profile) t += ROAD.segLen / v;
  return t;
}

/** Lateral distance (road units) a pod can move while covering dz at the speed/curve of the given segment. */
export function shiftBudget(v, curve, dz, phys = POD) {
  return (netSteer(v, curve, phys) * Math.max(0, dz - phys.collisionZ)) / v;
}
export { SAFETY };

/** Pod-centre blocked interval [lo, hi] (road units) for a static hazard. */
export function blockedInterval(o, phys = POD) {
  const hw = (HAZARDS[o.kind]?.w ?? 0.5) / 2 + phys.collisionX;
  return [o.x - hw, o.x + hw];
}
export const hazardRowHalf = (kind, phys = POD) => (HAZARDS[kind]?.w ?? 0.5) / 2 + phys.collisionX;

/** Pod-centre free runs inside the road (-1..1) given blocked intervals; returns [{lo,hi}] on the grid. */
export function freeRuns(blocked) {
  const n = Math.round(2 / GRID) + 1;
  const free = new Array(n).fill(true);
  for (const [lo, hi] of blocked) {
    for (let k = 0; k < n; k++) {
      const x = -1 + k * GRID;
      if (x > lo + 1e-9 && x < hi - 1e-9) free[k] = false;
    }
  }
  return free;
}
function runsOf(free, minWidth) {
  const out = [];
  let s = -1;
  for (let k = 0; k <= free.length; k++) {
    if (k < free.length && free[k]) { if (s < 0) s = k; }
    else if (s >= 0) { if ((k - 1 - s) * GRID + 1e-9 >= minWidth) out.push([s, k - 1]); s = -1; }
  }
  return out;
}

/** Timed hazard blocked interval at time t. */
export function timedBlocked(o, t, phys = POD) {
  const period = o.period || 4, ph = o.phase || 0;
  const f = t / period + ph;
  const half = (HAZARDS[o.kind].w / 2) + phys.collisionX;
  const cx = o.kind === 'cutter'
    ? (o.amp ?? CUTTER_AMP) * Math.sin(2 * Math.PI * f)
    : -WHEEL_RANGE + 2 * WHEEL_RANGE * (f - Math.floor(f));
  return [cx - half, cx + half];
}

const SEG_CURVE_STEP = 0.0035, SEG_Y_STEP = 60;

export function validateTrack(def, phys = POD) {
  const issues = [];
  const add = (m) => { if (issues.length < 40) issues.push(m); };
  const segs = def?.segments;
  if (!Array.isArray(segs) || segs.length < 100) {
    return { ok: false, lapTime: 0, difficulty: 0, issues: ['no segments'], stats: {} };
  }
  const n = segs.length, total = n * ROAD.segLen;
  if (def.length != null && n !== def.length * 10) add(`segments ${n} != length*10 ${def.length * 10}`);

  // ---- loop closure and smoothness
  let sumCurve = 0, absCurve = 0, maxCurve = 0, maxStep = 0, maxDy = 0;
  for (let i = 0; i < n; i++) {
    const s = segs[i], nx = segs[(i + 1) % n];
    if (![s.curve, s.y, s.bank].every(Number.isFinite)) { add(`segment ${i} has non-finite field`); break; }
    sumCurve += s.curve; absCurve += Math.abs(s.curve); maxCurve = Math.max(maxCurve, Math.abs(s.curve));
    maxStep = Math.max(maxStep, Math.abs(nx.curve - s.curve));
    maxDy = Math.max(maxDy, Math.abs(nx.y - s.y));
  }
  if (Math.abs(sumCurve) > 1e-6) add(`curve does not sum to zero (${sumCurve.toExponential(2)})`);
  if (Math.abs(segs[n - 1].y - segs[0].y) > SEG_Y_STEP) add('elevation does not close at the lap line');
  if (maxStep > SEG_CURVE_STEP) add(`curve jumps ${maxStep.toFixed(4)} between segments`);
  if (maxDy > SEG_Y_STEP) add(`elevation step ${maxDy.toFixed(1)} per segment too steep`);

  // ---- speed profile and lap time
  const prof = speedProfile(segs, phys);
  const lapTime = lapTimeOf(prof);
  if (!(lapTime > 20 && lapTime < 220)) add(`lap time ${lapTime.toFixed(1)}s outside 20..220`);
  const minSpeed = Math.min(...prof);
  if (minSpeed < 2800) add(`corner too tight: speed floor ${Math.round(minSpeed)}`);

  // ---- object sanity
  const objs = def.objects || [];
  const hazards = [], pickups = [];
  let lastZ = -1;
  for (const o of objs) {
    if (!(o.z >= 0 && o.z < total)) add(`object ${o.kind} z ${o.z} outside the lap`);
    if (o.z < lastZ) { add('objects not sorted by z'); break; }
    lastZ = o.z;
    if (!Number.isFinite(o.x)) add(`object ${o.kind} has bad x`);
    if (HAZARDS[o.kind]) hazards.push(o);
    else if (PICKUPS[o.kind]) pickups.push(o);
    else if (!(o.kind in ART.scenery)) add(`unknown object kind ${o.kind}`);
  }
  const statics = hazards.filter((o) => BLOCKING.includes(o.kind));
  const timed = hazards.filter((o) => TIMED.includes(o.kind));
  for (const o of hazards) {
    if (o.z < CLEAR_START || o.z > total - CLEAR_END) add(`hazard ${o.kind} at z ${o.z} inside the start/finish clear zone`);
    if (Math.abs(o.x) > 1.2) add(`hazard ${o.kind} off the road (x ${o.x})`);
  }

  // ---- static hazard rows: a reachable gap in every row (grid DP over lateral position)
  const rows = [];
  for (const o of statics) {
    const last = rows[rows.length - 1];
    if (last && o.z - last.zMax < MIN_ROW_GAP) { last.items.push(o); last.zMax = o.z; }
    else rows.push({ z: o.z, zMax: o.z, items: [o] });
  }
  const gapMin = minGap(phys);
  const nGrid = Math.round(2 / GRID) + 1;
  let reach = new Array(nGrid).fill(true), prevZ = null, worstSlack = Infinity;
  for (const row of rows) {
    const free = freeRuns(row.items.map((o) => blockedInterval(o, phys)));
    const runs = runsOf(free, gapMin);
    if (!runs.length) { add(`row at z ${row.z} leaves no gap >= ${gapMin.toFixed(2)}`); reach = new Array(nGrid).fill(true); prevZ = row.zMax; continue; }
    const ok = new Array(nGrid).fill(false);
    for (const [a, b] of runs) for (let k = a; k <= b; k++) ok[k] = true;
    if (prevZ != null) {
      const i = Math.min(n - 1, Math.floor(row.z / ROAD.segLen));
      const v = prof[i];
      const budget = shiftBudget(v, segs[i].curve, row.z - prevZ, phys);
      const steps = Math.floor(budget / GRID + 1e-9);
      const next = new Array(nGrid).fill(false);
      let any = false;
      for (let k = 0; k < nGrid; k++) {
        if (!ok[k]) continue;
        for (let d = -steps; d <= steps; d++) { if (reach[k + d]) { next[k] = true; any = true; break; } }
      }
      if (!any) { add(`row at z ${row.z} unreachable from previous row (budget ${budget.toFixed(2)})`); reach = ok; }
      else reach = next;
      worstSlack = Math.min(worstSlack, budget);
    } else reach = ok;
    prevZ = row.zMax;
  }

  // ---- timed hazards: individually avoidable, and never two decisions at once
  timed.sort((a, b) => a.z - b.z);
  let minWindow = Infinity;
  for (let i = 0; i < timed.length; i++) {
    const o = timed[i];
    if (!(o.period >= 2.5)) add(`${o.kind} at z ${o.z} period ${o.period} < 2.5 s`);
    if (i && o.z - timed[i - 1].z < TIMED_SPACING) add(`timed hazards at z ${timed[i - 1].z} and ${o.z} too close`);
    for (const s of statics) if (Math.abs(s.z - o.z) < TIMED_VS_STATIC) { add(`${o.kind} at z ${o.z} overlaps a static row`); break; }
    // sample one period: longest continuous stretch where a gap exists
    const N = 120, period = o.period || 4;
    let best = 0, run = 0;
    for (let k = 0; k < N * 2; k++) {
      const t = (k % N) * (period / N);
      const free = freeRuns([timedBlocked(o, t, phys)]);
      if (runsOf(free, gapMin).length) { run++; best = Math.max(best, Math.min(run, N)); } else run = 0;
    }
    const window = (best / N) * period;
    minWindow = Math.min(minWindow, window);
    // a pod needs ~ (collisionZ*2 / speed) s to cross the hazard band plus reaction
    if (window < 0.6) add(`${o.kind} at z ${o.z} leaves only a ${window.toFixed(2)} s window`);
  }

  // ---- pickups never sit inside a blocking hazard
  for (const p of pickups) {
    for (const h of statics) {
      if (Math.abs(h.z - p.z) < phys.collisionZ && Math.abs(h.x - p.x) < HAZARDS[h.kind].w / 2 + 0.15) {
        add(`pickup ${p.kind} at z ${p.z} inside ${h.kind}`); break;
      }
    }
  }

  // ---- difficulty 1..10
  const meanV = total / (lapTime * ROAD.segLen) * ROAD.segLen;   // = mean speed in u/s
  const slowFrac = 1 - meanV / phys.maxSpeed;
  const dens = (hazards.length / total) * 100000;                // hazards per 100k units
  const tight = prof.filter((v) => v < 6500).length / n;
  const difficulty = Math.round(Math.min(10, Math.max(1, 1 + slowFrac * 8 + dens * 0.12 + tight * 6 + timed.length * 0.03 + (maxCurve * 100)*0.1)) * 10) / 10;

  return {
    ok: issues.length === 0, lapTime, difficulty, issues,
    stats: { segments: n, hazards: hazards.length, timed: timed.length, rows: rows.length, pickups: pickups.length, scenery: objs.length - hazards.length - pickups.length, maxCurve, minSpeed: Math.round(minSpeed), meanSpeed: Math.round(meanV), worstShiftBudget: Number.isFinite(worstSlack) ? +worstSlack.toFixed(2) : null, sumCurve },
  };
}
