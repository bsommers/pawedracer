// Autopilot bot (ARCHITECTURE 5.8): createBot({skill, seed, lapLength}).act(view) -> input.
// Pure and deterministic (seeded noise via createRng). Looks ahead over view.segmentAt (racing line, corner speed)
// and view.objects (hazards: static, wheel closed-form, cutter phase learned from observed motion), picks the best
// of several candidate lanes, rolls through unavoidable solids, boosts on straights, and has a no-progress watchdog.
import { POD, HAZARDS, PICKUPS, TRACKS, ROAD } from '../core/defs.js';
import { createRng } from '../core/rng.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const frac = (v) => v - Math.floor(v);
const CUTTER_AMP = 0.7;
const LANES = [-0.85, -0.68, -0.51, -0.34, -0.17, 0, 0.17, 0.34, 0.51, 0.68, 0.85];
const SAMPLE = 0.1;                         // seconds between cutter motion samples

export function lapLengthOf(view, fallback) {
  const t = TRACKS.find((x) => x.id === view?.track?.id);
  return t ? t.length * 10 * ROAD.segLen : fallback;
}

export function createBot({ skill = 0.8, seed = 1, lapLength, noise = true } = {}) {
  const s = clamp(skill, 0, 1);
  const rng = createRng((seed * 2654435761 + 977) >>> 0);
  let L = lapLength ?? 0;
  const track = new Map();                  // object index -> { x0, x1, t, omega }
  let nextSample = 0;
  let prevZ = null, unwrapped = 0, wd = { t: 0, d: 0 }, recover = 0, recoverDir = 1;
  let rollLock = 0, jitter = 0, jitterT = 0;
  const stats = { watchdog: 0, rolls: 0 };

  /** predicted lateral centre of object o (index i) after tau seconds */
  function predictX(o, i, tau, t) {
    if (o.kind === 'wheel') { const st = track.get(i); const P = st?.period ?? 3.9; return -1.2 + 2.4 * frac((o.x + 1.2) / 2.4 + tau / P); }   // x(t) closed form; period learned
    if (o.kind === 'cutter') {
      const st = track.get(i);
      if (!st || st.omega == null) return o.x;
      const A = CUTTER_AMP, a = clamp(o.x / A, -1, 1);
      const phi0 = st.up ? Math.asin(a) : Math.PI - Math.asin(a);
      return A * Math.sin(phi0 + st.omega * tau);
    }
    return o.x;
  }

  function observe(view, zNear) {
    if (view.t < nextSample) return;
    nextSample = view.t + SAMPLE;
    const objs = view.objects;
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      if (o.kind !== 'cutter' && o.kind !== 'wheel') continue;
      const dz = ((o.z - zNear) % L + L) % L;
      if (dz > 30000) { track.delete(i); continue; }
      const st = track.get(i);
      if (!st) { track.set(i, { x1: o.x, x0: null, xm: null, omega: null, up: true, w: 0 }); continue; }
      st.xm = st.x0; st.x0 = st.x1; st.x1 = o.x;
      if (o.kind === 'wheel') { const v = (st.x1 - st.x0) / SAMPLE; if (v > 0.1) st.period = 2.4 / v; continue; }
      if (st.xm != null) {
        st.up = st.x1 > st.x0 || (st.x1 === st.x0 && st.up);
        if (Math.abs(st.x0) > 0.35 * CUTTER_AMP) {
          const w2 = (2 * st.x0 - st.xm - st.x1) / (SAMPLE * SAMPLE * st.x0);
          if (w2 > 0.5 && w2 < 12) { const w = Math.sqrt(w2); st.w = st.w ? st.w * 0.7 + w * 0.3 : w; st.omega = st.w; }
        }
      }
    }
  }

  function act(view) {
    const out = { steer: 0, throttle: 1, brake: 0, boost: false, roll: 0, yaw: 0 };
    const pl = view.player;
    if (!pl || view.phase !== 'racing') { out.throttle = view.phase === 'countdown' ? 0 : 0; return out; }
    if (!L) L = lapLengthOf(view, 440000);
    const dt = 1 / 60;
    const z = pl.z, speed = pl.speed, x = pl.x;
    observe(view, z);

    // ---- watchdog: no forward progress for >2.5 s (wall hugging, spun, stalled, wrecked)
    if (prevZ != null) { let d = z - prevZ; if (d < -L / 2) d += L; if (d > L / 2) d -= L; unwrapped += d; }
    prevZ = z;
    wd.t += dt;
    if (wd.t >= 1) { // evaluate per second
      const moved = unwrapped - wd.d; wd.d = unwrapped; wd.t = 0;
      wd.low = moved < 1500 && !pl.wreck && view.t > 3 ? (wd.low ?? 0) + 1 : 0;
      if (wd.low >= 3) { recover = 1.2; recoverDir = x > 0 ? -1 : 1; wd.low = 0; stats.watchdog++; }
    }
    if (recover > 0) {
      recover -= dt;
      return { steer: clamp(-x * 3, -1, 1), throttle: speed < 2500 ? 1 : 0.6, brake: 0, boost: false, roll: 0, yaw: 0 };
    }
    if (pl.wreck) return out;

    // ---- racing line and corner speed from segment look-ahead
    const look = clamp(speed * (0.35 + 0.3 * s), 800, 6500);
    let cSum = 0, cMax = 0;
    for (let k = 1; k <= 5; k++) { const c = view.segmentAt(z + (look * k) / 5).curve; cSum += c; cMax = Math.max(cMax, Math.abs(c)); }
    const cHere = view.segmentAt(z).curve, cAhead = cSum / 5;
    cMax = Math.max(cMax, Math.abs(cHere));
    const lineX = clamp(cAhead * 380, -0.6, 0.6);

    // ---- hazards: score candidate lanes by predicted collisions at arrival time
    const sf = Math.min(1.4, Math.max(speed, 1) / POD.steerSpeedRef);
    const reach = (1500 + speed * (0.45 + 0.4 * s)) | 0;
    const sp = Math.max(speed, 2500);
    const threats = [];
    const objs = view.objects;
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      let dz = ((o.z - z) % L + L) % L;
      if (dz > L / 2) dz -= L;
      if (dz < -POD.collisionZ || dz > reach) continue;
      if (!o.active) continue;
      const h = HAZARDS[o.kind];
      if (h) { if (h.damage > 0) threats.push({ o, i, dz, h }); continue; }
      threats.push({ o, i, dz, pk: PICKUPS[o.kind] });
    }
    const NL = LANES.length;
    const events = [];                                   // { dz, tau, c:[cost per lane] }
    let imminent = null;
    for (const th of threats) {
      const tau = Math.max(0, th.dz) / sp;
      const c = new Array(NL).fill(0);
      if (th.h) {
        const half = th.h.w * 0.5 + POD.collisionX + 0.1;
        const weight = (th.h.solid ? 40 : 6) + th.h.damage * (th.h.solid ? 1.5 : 0.8);
        for (let l = 0; l < NL; l++) {
          for (const dtau of [-0.12, 0, 0.12]) {         // sweep window: covers cutters/wheels crossing during our pass
            if (Math.abs(predictX(th.o, th.i, tau + dtau, view.t) - LANES[l]) < half) { c[l] += weight; break; }
          }
        }
        if (th.dz > -POD.collisionZ && th.dz < 520 + speed * 0.05) {
          const px = predictX(th.o, th.i, tau, view.t);
          if (Math.abs(px - x) < th.h.w * 0.5 + POD.collisionX + 0.04 && (!imminent || th.dz < imminent.dz)) imminent = { ...th, px };
        }
      } else if (th.pk && th.dz > 0) {
        const want = th.pk.boost ? 4 : th.pk.repair ? (pl.health < 70 ? 6 : 0.5) : 1;
        for (let l = 0; l < NL; l++) if (Math.abs(th.o.x - LANES[l]) < 0.22) c[l] -= want;
      } else continue;
      events.push({ dz: th.dz, tau, c });
    }
    // other pods: avoid lanes they will occupy (ahead, slower) or are occupying (alongside)
    for (const q of view.pods) {
      if (q.id === pl.id || q.wreck) continue;
      let dz = ((q.z - z) % L + L) % L; if (dz > L / 2) dz -= L;
      if (dz < -POD.collisionZ * 1.6 || dz > reach * 0.6) continue;
      const near = Math.abs(dz) < POD.collisionZ * 2;
      const gap = POD.collisionX * 2 + 0.14 + (near ? 0.12 : 0);
      const w = near ? 14 : 6 * (1 - dz / (reach * 0.6));
      const c = LANES.map((ln) => (Math.abs(ln - q.x) < gap ? w : 0));
      events.push({ dz: Math.max(dz, 0), tau: Math.max(0, dz) / Math.max(speed - q.speed * 0.9, 1500), c });
    }
    // dynamic programming over stages (clusters of events by distance): lane transitions limited by steering rate
    events.sort((a, b) => a.dz - b.dz);
    const stages = [];
    for (const e of events) {
      const last = stages[stages.length - 1];
      if (last && e.dz - last.dz < 500) { for (let l = 0; l < NL; l++) last.c[l] += e.c[l]; last.dz = Math.max(last.dz, e.dz) ; last.tau = Math.min(last.tau, e.tau); }
      else stages.push({ dz: e.dz, tau: e.tau, c: e.c.slice() });
      if (stages.length >= 14) break;
    }
    const rate = POD.steer * Math.max(sf, 0.5) * 0.85;
    const lineNow = lineX;
    const base = (l) => Math.abs(LANES[l] - lineNow) * 0.5 + (Math.abs(LANES[l]) > 0.8 ? 0.6 : 0);
    let best = 0, bestC = 0;
    if (!stages.length) {
      let bd = Infinity; for (let l = 0; l < NL; l++) { const d = Math.abs(LANES[l] - lineNow) * 1.2 + Math.abs(LANES[l] - x) * 0.3; if (d < bd) { bd = d; best = l; } }
    } else {
      const K = stages.length, cum = [], from = [];
      for (let k = 0; k < K; k++) {
        cum.push(new Array(NL).fill(Infinity)); from.push(new Array(NL).fill(-1));
        for (let l = 0; l < NL; l++) {
          let bestPrev = Infinity, bp = -1;
          if (k === 0) { const miss = Math.max(0, Math.abs(LANES[l] - x) - rate * Math.max(stages[0].tau, 0.04) - 0.1); bestPrev = miss * 30 + Math.abs(LANES[l] - x) * 0.3; }
          else {
            const dt2 = Math.max(stages[k].tau - stages[k - 1].tau, 0.02);
            for (let m = 0; m < NL; m++) {
              const miss = Math.max(0, Math.abs(LANES[l] - LANES[m]) - rate * dt2 - 0.05);
              const v = cum[k - 1][m] + miss * 30;
              if (v < bestPrev) { bestPrev = v; bp = m; }
            }
          }
          cum[k][l] = bestPrev + stages[k].c[l] + base(l); from[k][l] = bp;
        }
      }
      let endL = 0, ec = Infinity;
      for (let l = 0; l < NL; l++) if (cum[K - 1][l] < ec) { ec = cum[K - 1][l]; endL = l; }
      let l = endL; for (let k = K - 1; k > 0; k--) l = from[k][l];
      best = l; bestC = stages[0].c[best];
    }
    let tx = LANES[best];
    // skill: low skill ignores some look-ahead and wobbles
    if (noise) {
      jitterT -= dt;
      if (jitterT <= 0) { jitterT = 0.4; jitter = (rng.next() - 0.5) * 0.5 * (1 - s) * (1 - s); }
      tx += jitter;
    }
    tx = clamp(tx, -0.95, 0.95);

    // ---- steering with centrifugal feed-forward
    const ff = (cHere * speed * speed * POD.centrifugal) / (POD.steer * sf);
    out.steer = clamp((tx - x) * (3 + 2 * s) + ff, -1, 1);

    // ---- corner speed
    const auth = POD.steer * Math.min(1.4, Math.max(speed, 3000) / POD.steerSpeedRef);
    const load = (cMax * speed * speed * POD.centrifugal) / auth;           // fraction of steering authority the corner eats
    const limit = 0.62 + 0.2 * s;
    const over = load > limit;
    out.throttle = over ? 0 : 1;
    out.brake = load > limit + 0.2 ? 1 : 0;

    // ---- barrel roll through unavoidable solids
    rollLock = Math.max(0, rollLock - dt);
    if (imminent && rollLock <= 0 && !pl.rolling && !pl.stalled && s > 0.3) {
      if (bestC >= 10) {                                    // no clear lane: roll (invulnerable) toward the centre
        out.roll = x + 1.1 > 1.0 ? -1 : x - 1.1 < -1.0 ? 1 : (Math.abs(x + 1.1) < Math.abs(x - 1.1) ? 1 : -1);
        rollLock = POD.rollCooldown + 0.1; stats.rolls++;
      }
    }

    // ---- boost on straights with headroom
    if (s > 0.35 && !pl.stalled && Math.abs(x) <= 1) {
      if (pl.boost.active) out.boost = pl.boost.charge > 0.15 && pl.heat < 0.78 && cMax < 0.0012;
      else out.boost = pl.boost.charge > 0.9 && pl.heat < 0.3 && cMax < 0.0008 && !over;
    }
    return out;
  }

  return { act, stats, get skill() { return s; } };
}
