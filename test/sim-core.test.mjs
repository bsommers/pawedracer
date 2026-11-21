import test from 'node:test';
import assert from 'node:assert/strict';
import { POD, RACE, DT, ROAD } from '../src/core/defs.js';
import { createBus } from '../src/core/events.js';
import { createRace } from '../src/sim/race.js';
import { makePod, stepPod, damagePod } from '../src/lib/pod-physics.js';
import { hazardX, partsEnv } from '../src/sim/pod-physics.js';
import { rubberBand } from '../src/sim/ai.js';
import { TAUNTS } from '../src/sim/pete.js';
let trackDef = null;
try { ({ trackDef } = await import('../src/levels/tracks.js')); } catch { /* track-gen not landed: fake track only */ }

const N = 200;                                    // 200 segments = 40000 units per lap
function fakeTrack(over = {}) {
  const segments = [];
  for (let i = 0; i < N; i++) segments.push({ curve: over.flat ? 0 : 0.0012 * Math.sin((2 * Math.PI * 2 * i) / N), y: 0, bank: 0, tunnel: false, zone: 0 });
  return { id: 'fake', theme: 'day', biome: 'coast', laps: 3, segments, objects: over.objects ?? [] };
}
const IN = { steer: 0, throttle: 1, brake: 0, boost: false, roll: 0, yaw: 0 };
function mk(over = {}, opts = {}) {
  const bus = createBus(); const log = [];
  bus.on('*', (type, payload) => log.push({ type, ...payload }));
  const race = createRace({ track: fakeTrack(over), seed: opts.seed ?? 1, laps: opts.laps ?? 3, player: {}, mode: opts.mode ?? 'race', bus });
  return { race, log, bus };
}
function go(race, n = 200) { for (let i = 0; i < n && race.sim.phase === 'countdown'; i++) race.step(IN); }
const runSteps = (race, input, n) => { for (let i = 0; i < n; i++) race.step(typeof input === 'function' ? input(race) : input); };
const cfg = POD;

test('countdown emits 3,2,1 then go, pods frozen meanwhile', () => {
  const { race, log } = mk();
  runSteps(race, IN, 60 * 3 + 5);
  assert.deepEqual(log.filter((e) => e.type === 'countdown').map((e) => e.n), [3, 2, 1]);
  assert.equal(log.filter((e) => e.type === 'go').length, 1);
  assert.equal(race.view().phase, 'racing');
});

test('accel, drag, brake, offroad cap', () => {
  const p = makePod();
  for (let i = 0; i < 60; i++) stepPod(p, IN, DT, cfg);
  assert.ok(p.speed > 4000 && p.speed < 6000, `1s accel ${p.speed}`);
  for (let i = 0; i < 600; i++) stepPod(p, IN, DT, cfg);
  assert.ok(Math.abs(p.speed - cfg.maxSpeed) < 50);
  const s0 = p.speed; for (let i = 0; i < 60; i++) stepPod(p, { ...IN, throttle: 0 }, DT, cfg);
  assert.ok(p.speed < s0 * 0.9 && p.speed > s0 * 0.6, 'coast drag');
  const s1 = p.speed; for (let i = 0; i < 20; i++) stepPod(p, { ...IN, throttle: 0, brake: 1 }, DT, cfg);
  assert.ok(p.speed < s1 - 2000, 'brake');
  const q = makePod({ x: 1.3, speed: 12000 });
  for (let i = 0; i < 300; i++) stepPod(q, IN, DT, cfg);
  assert.ok(q.speed <= cfg.offRoadMax + 100, `offroad cap ${q.speed}`);
});

test('steering scales with speed and curve pushes outward', () => {
  const slow = makePod({ speed: 1000 }), fast = makePod({ speed: 9000 });
  stepPod(slow, { ...IN, steer: 1 }, 0.5, cfg); stepPod(fast, { ...IN, steer: 1 }, 0.5, cfg);
  assert.ok(fast.x > slow.x && slow.x > 0);
  const a = makePod({ speed: 9000 }); for (let i = 0; i < 30; i++) stepPod(a, { ...IN, throttle: 0.7 }, DT, cfg, { curve: 0.002 });
  assert.ok(a.x < -0.1, `right curve pushes left ${a.x}`);
  const b = makePod({ speed: 9000 }); for (let i = 0; i < 30; i++) stepPod(b, { ...IN, throttle: 0.7 }, DT, cfg, { curve: -0.002 });
  assert.ok(b.x > 0.1);
  const y1 = makePod({ speed: 9000 }), y0 = makePod({ speed: 9000 });
  for (let i = 0; i < 20; i++) { stepPod(y1, { ...IN, steer: 0.5, yaw: 1 }, DT, cfg); stepPod(y0, { ...IN, steer: 0.5 }, DT, cfg); }
  assert.ok(y1.x > y0.x && y1.speed < y0.speed, 'yaw assist turns tighter, costs speed');
});

test('boost raises speed, adds heat, overheat stalls then recovers', () => {
  const p = makePod({ speed: 12000 }); const ev = [];
  for (let i = 0; i < 60; i++) ev.push(...stepPod(p, { ...IN, boost: true }, DT, cfg));
  assert.ok(ev.some((e) => e.type === 'boost'));
  assert.ok(p.speed > cfg.maxSpeed + 2000, 'boost speed');
  assert.ok(p.heat > 0.3, `heat ${p.heat}`);
  const q = makePod({ speed: 12000, heat: 0.9 }); const ev2 = [];
  for (let i = 0; i < 40; i++) ev2.push(...stepPod(q, { ...IN, boost: true }, DT, cfg));
  assert.ok(ev2.some((e) => e.type === 'overheat') && ev2.some((e) => e.type === 'stall'));
  assert.ok(q.stallT > 0 && !q.boost.active);
  const sp = q.speed; for (let i = 0; i < 30; i++) stepPod(q, IN, DT, cfg);
  assert.ok(q.speed < sp, 'stalled engine does not accelerate');
  for (let i = 0; i < 200; i++) stepPod(q, IN, DT, cfg);
  assert.equal(q.stallT, 0); assert.ok(q.heat < 1);
});

test('boost cooldown: charge drains then regenerates', () => {
  const p = makePod({ speed: 9000 });
  for (let i = 0; i < 100; i++) stepPod(p, { ...IN, boost: true }, DT, cfg);
  assert.ok(p.boost.charge < 0.1 && !p.boost.active);
  for (let i = 0; i < 160; i++) stepPod(p, IN, DT, cfg);
  assert.ok(p.boost.charge > 0.95);
});

test('barrel roll is invulnerable for rollInvuln, slides sideways, has cooldown', () => {
  const p = makePod({ speed: 8000 });
  const ev = stepPod(p, { ...IN, roll: 1 }, DT, cfg);
  assert.ok(ev.some((e) => e.type === 'roll'));
  assert.equal(damagePod(p, 20, cfg), 0, 'invulnerable');
  for (let i = 0; i < 40; i++) stepPod(p, IN, DT, cfg);
  assert.ok(p.x > 0.8, `slid ${p.x}`);
  assert.ok(p.invuln === 0 && damagePod(p, 20, cfg) > 0, 'vulnerable after invuln');
  const evs = stepPod(p, { ...IN, roll: 1 }, DT, cfg);
  assert.ok(!evs.some((e) => e.type === 'roll'), 'cooldown blocks re-roll');
});

test('walls at |x|>1.6 scrape, damage, slow', () => {
  const p = makePod({ x: 1.59, speed: 8000 });
  let ev = [];
  for (let i = 0; i < 10; i++) ev.push(...stepPod(p, { ...IN, steer: 1 }, DT, cfg));
  assert.equal(p.x, 1.6); assert.ok(ev.some((e) => e.type === 'scrape')); assert.equal(p.health, cfg.healthMax - cfg.wallDamage);
});

test('hazard hit: damage, hitSlow, event; mine is consumed', () => {
  const { race, log } = mk({ objects: [{ z: 3000, x: -0.4, kind: 'wedge' }] });
  go(race); const p0 = race.sim.pods[0].p; p0.dist = 2500; p0.x = -0.4; p0.speed = 8000;
  race.step(IN); runSteps(race, IN, 20);
  const hit = log.find((e) => e.type === 'hit' && e.kind === 'wedge');
  assert.ok(hit && hit.pod === 0 && hit.damage === POD.hazardDamage);
  assert.ok(p0.health < POD.healthMax);
  assert.equal(log.filter((e) => e.type === 'hit' && e.kind === 'wedge').length, 1, 'single hit per pass');
});

test('rolling through a hazard is safe', () => {
  const { race, log } = mk({ objects: [{ z: 3000, x: 0, kind: 'wedge' }] });
  go(race); const p0 = race.sim.pods[0].p; p0.dist = 2800; p0.x = -0.05; p0.speed = 3000;
  race.step({ ...IN, roll: 1 }); runSteps(race, IN, 10);
  assert.equal(log.filter((e) => e.type === 'hit' && e.pod === 0).length, 0);
});

test('periodic hazards are pure functions of t', () => {
  const w = { kind: 'wheel', z: 0, x: 0, period: 5, phase: 0 };
  assert.ok(Math.abs(hazardX(w, 0) + 1.2) < 1e-9 && Math.abs(hazardX(w, 2.5)) < 1e-9);
  const c = { kind: 'cutter', z: 0, x: 0, period: 3, phase: 0 };
  assert.ok(Math.abs(hazardX(c, 0.75) - 0.7) < 1e-9);   // default amp 0.7, matches track-gen
  assert.ok(Math.abs(hazardX({ ...c, amp: 0.5 }, 0.75) - 0.5) < 1e-9);   // per-object amp from trackDef
});

test('pod/pod bump: faster pod wins, loser damaged and shoved', () => {
  const { race, log } = mk(); go(race);
  const [a, b] = [race.sim.pods[0].p, race.sim.pods[2].p];
  race.sim.pods.forEach((pd, i) => { if (i > 2) { pd.p.dist = -90000 - i * 9000; } });
  race.sim.pods[1].p.dist = -90000;
  a.dist = 5000; a.x = 0; a.speed = 9000; b.dist = 5050; b.x = 0.2; b.speed = 5000;
  race.step(IN);
  const hits = log.filter((e) => e.type === 'hit' && e.kind === 'pod');
  assert.ok(hits.length >= 1);
  assert.ok(hits.find((h) => h.pod === 2).damage > hits.find((h) => h.pod === 0).damage);
  assert.ok(b.x > 0.2, 'loser shoved outward');
});

test('wreck at health 0, respawn on road after 2 s with speed 0', () => {
  const p = makePod({ speed: 9000, x: 1.5 });
  damagePod(p, 999, cfg);
  assert.ok(p.wreck && p.speed === 0);
  let ev = []; for (let i = 0; i < 100; i++) ev.push(...stepPod(p, IN, DT, cfg));
  assert.ok(p.wreck, 'still wrecked at 1.7 s');
  for (let i = 0; i < 40 && p.wreck; i++) ev.push(...stepPod(p, IN, DT, cfg));
  assert.ok(!p.wreck && p.health === cfg.healthMax && Math.abs(p.x) <= 1 && p.speed === 0);
  assert.ok(ev.some((e) => e.type === 'respawn'));
});

test('pickups: tuna charges boost, mouse repairs, coin scores; once per lap', () => {
  const { race, log } = mk({ objects: [{ z: 3000, x: 0, kind: 'tuna' }, { z: 3400, x: 0, kind: 'mouse' }, { z: 3800, x: 0, kind: 'coin' }] });
  go(race); const pd = race.sim.pods[0], p = pd.p; p.dist = 2700; p.x = 0; p.speed = 8000; p.boost.charge = 0.1; p.health = 50;
  runSteps(race, IN, 60);
  assert.deepEqual(log.filter((e) => e.type === 'pickup' && e.pod === 0).map((e) => e.kind), ['tuna', 'mouse', 'coin']);
  assert.ok(log.some((e) => e.type === 'repair' && e.pod === 0 && e.amount === 25));
  assert.equal(pd.score, 50); assert.ok(p.health >= 75);
  assert.equal(race.view().objects.filter((o) => !o.active).length, 3);
});

test('lap counting, finalLap, finish order, scripted full-throttle run finishes 3 laps', () => {
  const { race, log } = mk({ flat: false });
  const L = N * ROAD.segLen;
  const driver = (r) => { const p = r.sim.pods[0].p, seg = r.sim.segmentAt(p.dist);
    const sf = Math.min(1.4, p.speed / POD.steerSpeedRef) || 0.1;
    const ff = seg.curve * p.speed * p.speed * POD.centrifugal / (POD.steer * sf);
    return { ...IN, steer: Math.max(-1, Math.min(1, -p.x * 2.5 + ff)) }; };
  let steps = 0; while (race.view().phase !== 'finished' && steps++ < 60 * 400) race.step(driver(race));
  const v = race.view();
  assert.equal(v.phase, 'finished', `not finished after ${steps} steps`);
  const laps = log.filter((e) => e.type === 'lap' && e.pod === 0);
  assert.deepEqual(laps.map((e) => e.lap), [2, 3]);
  assert.equal(log.filter((e) => e.type === 'finalLap').length, 1);
  const fin = log.filter((e) => e.type === 'finish');
  assert.ok(fin.length >= 1 && fin[0].place === 1 || fin.some((f) => f.pod === 0));
  assert.deepEqual(fin.map((f) => f.place), fin.map((_, i) => i + 1));
  assert.ok(v.pods[0].finishTime > 3 * L / POD.boostSpeed);
  assert.ok(v.bestLap > 0);
  runSteps(race, IN, 60 * 8);
  const end = log.filter((e) => e.type === 'raceEnd');
  assert.equal(end.length, 1); assert.equal(end[0].results.length, RACE.racers);
  assert.deepEqual(end[0].results.map((r) => r.place), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('pass event when the player overtakes', () => {
  const { race, log } = mk(); go(race);
  const pods = race.sim.pods;
  pods.forEach((pd, i) => { pd.p.dist = i === 0 ? 1000 : 3000 + i * 4000; pd.p.x = 0; });
  race.step(IN); log.length = 0;
  pods[0].p.dist = 40000; pods[0].p.speed = 9000; race.step(IN);
  assert.ok(log.some((e) => e.type === 'pass' && e.pod === 0));
  assert.ok(log.some((e) => e.type === 'place' && e.pod === 0 && e.place === 1));
});

test('rubber band is deterministic and speeds up trailing AI', () => {
  const player = makePod({ dist: 10000 });
  const behind = rubberBand(makePod({ dist: 9000 }), player), ahead = rubberBand(makePod({ dist: 13000 }), player), even = rubberBand(makePod({ dist: 10000 }), player);
  assert.ok(behind > 1 && ahead < 1 && even === 1);
  assert.ok(Math.abs(behind - (1 + RACE.rubberBand * 1)) < 1e-12);
  assert.equal(rubberBand(makePod({ dist: 9000 }), player), behind);
});

test('Pete drops a mine only when the player is close behind', () => {
  const trial = (gap) => {
    const { race, log } = mk({ flat: true }); go(race);
    const pods = race.sim.pods; pods.forEach((pd, i) => { if (i > 1) pd.p.dist = -90000 - i * 9000; });
    pods[1].p.dist = 6000; pods[1].p.speed = 9000; pods[1].p.x = 0.5; race.sim.pete.mineCd = 0;
    pods[0].p.dist = 6000 - gap; pods[0].p.speed = 0; pods[0].p.x = -0.9;
    runSteps(race, { ...IN, throttle: 0 }, 30);
    return log.filter((e) => e.type === 'peteDrop').length;
  };
  assert.ok(trial(900) >= 1, 'close behind drops');
  assert.equal(trial(3000), 0, 'far behind does not');
  assert.equal(trial(-9000), 0, 'player ahead does not');
});

test('Pete taunts are original text lines and emitted with mood', () => {
  const { race, log } = mk({ flat: true }); runSteps(race, IN, 60 * 5);
  const t = log.find((e) => e.type === 'peteTaunt');
  assert.ok(t && typeof t.text === 'string' && t.mood);
  assert.ok(Object.values(TAUNTS).flat().includes(t.text));
});

test('same seed + inputs = same state hash; different seed differs', () => {
  const run = (seed) => { const { race } = mk({}, { seed }); runSteps(race, (r) => ({ ...IN, steer: Math.sin(r.t * 2), boost: r.t % 7 > 5 }), 900); return race.hash(); };
  assert.equal(run(5), run(5));
  assert.notEqual(run(5), run(6));
});

test('view is frozen and has the 5.2 shape', () => {
  const { race } = mk(); go(race); race.step(IN);
  const v = race.view();
  for (const k of ['t', 'phase', 'countdown', 'lap', 'laps', 'place', 'pods', 'player', 'objects', 'segmentAt', 'events', 'bestLap', 'track']) assert.ok(k in v, k);
  assert.ok(Object.isFrozen(v) && Object.isFrozen(v.pods[0]));
  assert.equal(v.pods.length, 8); assert.equal(v.player, v.pods[0]);
  for (const k of ['id', 'name', 'isPlayer', 'z', 'x', 'speed', 'heat', 'health', 'boost', 'rolling', 'stalled', 'wreck', 'lap', 'place', 'finishTime']) assert.ok(k in v.pods[0], k);
  assert.deepEqual(Object.keys(v.segmentAt(0)).sort(), ['bank', 'curve', 'tunnel', 'y', 'zone'].sort());
});

test('parts envelope: engine/cooling/grip/armor/thrust', () => {
  const e = partsEnv({ engine: 4, cooling: 4, grip: 4, armor: 4, thrust: 4 });
  assert.ok(Math.abs(e.maxSpeedMul - 1.16) < 1e-9 && Math.abs(e.damageMul - 0.68) < 1e-9 && Math.abs(e.centMul - 0.68) < 1e-9);
  const p = makePod({ health: 100 }); damagePod(p, 10, cfg, e); assert.ok(Math.abs(p.health - 93.2) < 1e-9);
});

test('AI pods finish a race unaided on a flat fake track; never NaN', () => {
  const { race } = mk({ flat: true }, { laps: 1 });
  let n = 0; while (race.view().phase !== 'finished' && n++ < 60 * 200) race.step(IN);
  for (const p of race.view().pods) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.speed));
  assert.ok(race.sim.pods.slice(1).some((p) => p.finished));
});

test('real tracks (if present) run a few seconds without NaN', { skip: !trackDef }, () => {
  const def = trackDef('brie', 1);
  const race = createRace({ track: def, seed: 1, laps: 1, player: {}, mode: 'race' });
  runSteps(race, IN, 60 * 10);
  for (const p of race.view().pods) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.speed));
});
