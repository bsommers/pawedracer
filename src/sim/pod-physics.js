// Pawed Racer binding of src/lib/pod-physics.js: POD numbers, shop parts, closed-form hazards (ARCHITECTURE 3/4).
import { POD, HAZARDS, PICKUPS, PARTS } from '../core/defs.js';
export { stepPod, makePod, damagePod, clamp } from '../lib/pod-physics.js';

export const PERIOD = Object.freeze({ cutter: 3, wheel: 5 });
const frac = (v) => v - Math.floor(v);

/** Hazard lateral centre at race time t (pure function of t). */
export function hazardX(o, t) {
  const period = o.period ?? PERIOD[o.kind] ?? 4, ph = o.phase ?? 0;
  if (o.kind === 'cutter') return (o.x ?? 0) + (o.amp ?? 0.7) * Math.sin(2 * Math.PI * (t / period + ph));
  if (o.kind === 'wheel') return -1.2 + 2.4 * frac(t / period + ph);
  return o.x ?? 0;
}

/** Per-pod modifier envelope from shop parts (tiers 0..4). */
export function partsEnv(parts = {}) {
  const t = (k) => Math.max(0, Math.min(4, parts[k] | 0));
  return { maxSpeedMul: 1 + 0.04 * t('engine'), coolMul: 1 + 0.12 * t('cooling'), centMul: 1 - 0.08 * t('grip'),
    damageMul: 1 - 0.08 * t('armor'), accelMul: 1 + 0.06 * t('thrust') };
}

export const isHazard = (kind) => kind in HAZARDS;
export const isPickup = (kind) => kind in PICKUPS;

/** Wrapped signed distance a - b on a closed lap of length L, in (-L/2, L/2]. */
export function wrapDz(a, b, L) { let d = (a - b) % L; if (d > L / 2) d -= L; else if (d <= -L / 2) d += L; return d; }

/** Does hazard/pickup object `o` (lap coords) overlap a pod at (zLap, x) at race time t? */
export function overlaps(o, zLap, x, t, L, pad = 0) {
  const dz = Math.abs(wrapDz(o.z, zLap, L));
  if (dz > POD.collisionZ * 0.5 + 100) return false;
  const w = (HAZARDS[o.kind]?.w ?? 0.3) * 0.5;
  return Math.abs(hazardX(o, t) - x) < POD.collisionX + w + pad;
}
export { POD };
