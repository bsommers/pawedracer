// AI driver (ARCHITECTURE 4): racing line from curvature lookahead, hazard avoidance over the closed-form
// hazard functions, corner braking, boost use, rubber band. Pure and deterministic: aiInput(sim, pod) -> input.
import { POD, RACE, HAZARDS } from '../core/defs.js';
import { hazardX, wrapDz, clamp } from './pod-physics.js';

/** Deterministic rubber-band speed multiplier for an AI pod relative to the player. */
export function rubberBand(pod, player) {
  const gap = (player.dist - pod.dist) / 1000;                 // positive = pod is behind the player
  return clamp(1 + RACE.rubberBand * clamp(gap, -2, 2), 0.88, 1.12);
}

const curveAt = (sim, z) => sim.segmentAt(z).curve;

/** Look ahead for the first solid/damaging hazard that will be in our lane when we arrive. */
export function hazardsAhead(sim, zLap, speed, reach) {
  const out = [];
  const L = sim.L;
  for (const o of sim.allObjects()) {
    const h = HAZARDS[o.kind];
    if (!h || o.kind === 'stink' || h.damage <= 0) continue;
    const dz = wrapDz(o.z, zLap, L);
    if (dz > 0 && dz < reach) out.push({ o, dz, h });
  }
  return out;
}

export function aiInput(sim, pod, opts = {}) {
  const skill = pod.skill ?? 0.7;
  const p = pod.p, zLap = sim.zLap(p);
  const speed = p.speed;
  const look = clamp(speed * 0.55, 900, 6500);
  let cSum = 0, cMax = 0;
  for (let k = 1; k <= 4; k++) { const c = curveAt(sim, zLap + look * k / 4); cSum += c; cMax = Math.max(cMax, Math.abs(c)); }
  const cAhead = cSum / 4, cHere = curveAt(sim, zLap);
  const apex = opts.cutApex ? 520 : 380;
  let tx = clamp(cAhead * apex, -0.7, 0.7) * (0.45 + 0.55 * skill) + pod.lane * (1 - clamp(Math.abs(cAhead) * 300, 0, 1));
  let roll = 0;

  // hazard avoidance with arrival-time prediction
  const reach = 1800 + speed * 0.45;
  const margin = POD.collisionX + 0.14;
  for (const { o, dz, h } of hazardsAhead(sim, zLap, speed, reach)) {
    const tArr = dz / Math.max(speed, 1500);
    const px = hazardX(o, sim.t + tArr);
    const half = h.w * 0.5 + margin;
    if (Math.abs(px - tx) < half && skill > 0.2) {
      const l = px - half - 0.08, r = px + half + 0.08;
      const lOk = l > -0.95, rOk = r < 0.95;
      let pick = lOk && rOk ? (Math.abs(l - p.x) < Math.abs(r - p.x) ? l : r) : lOk ? l : rOk ? r : tx;
      if (o.kind === 'wheel') pick = clamp(tx, -0.9, 0.9);   // cannot sidestep a crossing wheel reliably: time it with a roll
      tx = pick;
    }
    if (h.solid && dz < 650 + speed * 0.06 && Math.abs(px - p.x) < half && p.rollCd <= 0 && p.rollT <= 0 && skill > 0.55 && (o.kind === 'wheel' || o.kind === 'cutter' || Math.abs(tx - p.x) > 0.5)) {
      roll = px >= p.x ? -1 : 1;
    }
  }
  tx = clamp(tx, -0.95, 0.95);

  const sf = Math.min(1.4, Math.max(speed, 1) / POD.steerSpeedRef);
  const ff = (cHere * speed * speed * POD.centrifugal) / (POD.steer * sf);   // cancel centrifugal push
  const steer = clamp((tx - p.x) * (2.2 + 2 * skill) + ff, -1, 1);

  const vCorner = Math.sqrt((POD.steer * 1.1) / (POD.centrifugal * cMax + 1e-9));
  const over = speed > vCorner * (0.9 + 0.2 * skill);
  const throttle = over ? 0 : 1, brake = over && speed > vCorner * 1.1 ? 1 : 0;

  let boost = false;
  const b = p.boost;
  if (!p.stallT && skill > 0.45 && Math.abs(p.x) <= 1) {
    if (b.active) boost = b.charge > 0.15 && p.heat < 0.75 && cMax < 0.002;
    else boost = b.charge > 0.95 && p.heat < 0.3 && cMax < 0.0012 && !over;
  }
  if (opts.forceBoost && !p.stallT && b.charge > 0.3 && p.heat < 0.8) boost = true;
  return { steer, throttle, brake, boost, roll, yaw: 0 };
}
