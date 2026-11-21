// pod-physics: generic fixed-step arcade pseudo-3D racer physics (zero deps, Node-safe, deterministic).
// Factory candidate. A "pod" is a plain object (see makePod). One call to stepPod() advances one pod by dt and
// returns an array of event objects ({type, ...}); the caller maps them onto its bus. The lib never uses randomness.
//
// Coordinates: dist = total distance along the track in world units (may start negative on a grid),
// x = lateral position in normalised road units (-1..1 on road, walls at +-wallX).
// cfg: numbers shaped like POD in src/core/defs.js (maxSpeed, boostSpeed, accel, brake, drag, offRoadMax,
//   offRoadDrag, steer, steerSpeedRef, centrifugal, gripBase, yawAssist, yawAssistDrag, boostDuration,
//   boostCooldown, heatBoost (heat per second of boosting), heatCoolRate, heatOverloadAt, heatStall, rollTime,
//   rollCooldown, rollInvuln, rollSlide, hitSlow, healthMax, wallDamage, collisionX, collisionZ).
// env (per call): { curve, accelMul, maxSpeedMul, centMul, damageMul, wallX, wreckTime }.
// input: { steer:-1..1, throttle:0..1, brake:0..1, boost:bool, roll:-1|0|1 (edge), yaw:-1|0|1 }.
// Curve convention: curve > 0 bends RIGHT and pushes the pod toward -x (outward), as in OutRun.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function makePod(o = {}) {
  return {
    dist: 0, x: 0, speed: 0, heat: 0, health: 100,
    boost: { active: false, charge: 1 },
    rollT: 0, rollDir: 0, rollCd: 0, invuln: 0, stallT: 0, wreck: false, wreckT: 0,
    hitCd: 0, wallCd: 0, steerVis: 0,
    ...o,
  };
}

export const isRolling = (p) => p.rollT > 0;
export const isStalled = (p) => p.stallT > 0;

/** Apply damage unless invulnerable. Returns the damage actually taken. Health 0 = wreck. */
export function damagePod(p, amount, cfg, env = {}) {
  if (p.wreck || p.invuln > 0 || amount <= 0) return 0;
  const dmg = amount * (env.damageMul ?? 1);
  p.health = Math.max(0, p.health - dmg);
  if (p.health <= 0) { p.wreck = true; p.wreckT = env.wreckTime ?? 2; p.speed = 0; p.boost.active = false; p.rollT = 0; }
  return dmg;
}

export function stepPod(p, inp, dt, cfg, env = {}) {
  const ev = [];
  const wallX = env.wallX ?? 1.6;
  if (p.wreck) {
    p.wreckT -= dt; p.speed = 0;
    if (p.wreckT <= 0) {
      p.wreck = false; p.health = cfg.healthMax; p.heat = 0; p.x = clamp(p.x, -0.8, 0.8) * 0.5;
      p.invuln = 1.5; p.stallT = 0; ev.push({ type: 'respawn' });
    }
    p.invuln = Math.max(0, p.invuln - dt);
    return ev;
  }
  p.invuln = Math.max(0, p.invuln - dt); p.hitCd = Math.max(0, p.hitCd - dt); p.wallCd = Math.max(0, p.wallCd - dt);
  p.rollCd = Math.max(0, p.rollCd - dt);
  const stalled = p.stallT > 0;
  const accelMul = env.accelMul ?? 1; let maxSpeed = cfg.maxSpeed * (env.maxSpeedMul ?? 1);
  const thr = stalled ? 0 : clamp(inp.throttle ?? 0, 0, 1), brk = clamp(inp.brake ?? 0, 0, 1);

  // barrel roll start (edge input)
  if (inp.roll && p.rollT <= 0 && p.rollCd <= 0 && !stalled) {
    p.rollT = cfg.rollTime; p.rollDir = inp.roll > 0 ? 1 : -1; p.rollCd = cfg.rollCooldown;
    p.invuln = Math.max(p.invuln, cfg.rollInvuln); ev.push({ type: 'roll' });
  }

  // boost
  const b = p.boost;
  if (!b.active && inp.boost && b.charge >= 0.25 && !stalled) { b.active = true; ev.push({ type: 'boost' }); }
  if (b.active) {
    b.charge -= dt / cfg.boostDuration;
    p.heat += cfg.heatBoost * dt;
    if (!inp.boost || b.charge <= 0 || stalled) { b.charge = Math.max(0, b.charge); b.active = false; ev.push({ type: 'boostEnd' }); }
  } else if (!stalled) {
    b.charge = Math.min(1, b.charge + dt / cfg.boostCooldown);
  }

  // heat: cool when not boosting; overheat blows the engine
  if (stalled) {
    p.stallT = Math.max(0, p.stallT - dt);
    p.heat = 1 - 0.5 * (1 - p.stallT / cfg.heatStall);
  } else {
    if (!b.active) p.heat = Math.max(0, p.heat - cfg.heatCoolRate * (env.coolMul ?? 1) * dt);
    if (p.heat >= cfg.heatOverloadAt) {
      p.heat = cfg.heatOverloadAt; p.stallT = cfg.heatStall;
      if (b.active) { b.active = false; ev.push({ type: 'boostEnd' }); }
      ev.push({ type: 'overheat' }, { type: 'stall' });
    }
  }

  // speed
  const offRoad = Math.abs(p.x) > 1;
  let v = p.speed;
  if (offRoad) maxSpeed = Math.min(maxSpeed, cfg.offRoadMax);
  if (b.active && !offRoad) v = Math.min(cfg.boostSpeed * (env.maxSpeedMul ?? 1), v + cfg.accel * 3 * accelMul * dt);
  else {
    if (v < maxSpeed) v = Math.min(maxSpeed, v + cfg.accel * accelMul * thr * dt);
    else v -= (v - maxSpeed) * Math.min(1, 2 * dt);          // bleed boost speed back down
    v -= v * cfg.drag * (1 - thr) * dt * (stalled ? 3 : 1);
  }
  v -= cfg.brake * brk * dt;
  if (offRoad && v > cfg.offRoadMax) v += (cfg.offRoadMax - v) * Math.min(1, cfg.offRoadDrag * dt);
  const rolling = p.rollT > 0;
  let yaw = rolling ? 0 : (inp.yaw ?? 0);
  if (yaw) v -= v * cfg.yawAssistDrag * dt;
  p.speed = Math.max(0, v);

  // steering, centrifugal push, roll slide
  const sf = Math.min(1.4, p.speed / cfg.steerSpeedRef);
  let stick = clamp(inp.steer ?? 0, -1, 1);
  if (yaw) stick = clamp(stick + yaw, -1, 1) * cfg.yawAssist;
  let dx = 0;
  if (rolling) {
    dx += p.rollDir * cfg.rollSlide * dt / cfg.rollTime;
    p.rollT = Math.max(0, p.rollT - dt);
    stick = 0;
  } else dx += stick * cfg.steer * sf * (cfg.gripBase ?? 1) * dt;
  dx -= (env.curve ?? 0) * p.speed * p.speed * cfg.centrifugal * (env.centMul ?? 1) * dt;
  p.x += dx;
  p.steerVis = clamp(stick, -1, 1);

  // walls
  if (Math.abs(p.x) > wallX) {
    p.x = Math.sign(p.x) * wallX; p.speed *= 0.7;
    if (p.wallCd <= 0) { p.wallCd = 0.5; damagePod(p, cfg.wallDamage, cfg, env); ev.push({ type: 'scrape', damage: cfg.wallDamage }); }
  }
  p.dist += p.speed * dt;
  return ev;
}
