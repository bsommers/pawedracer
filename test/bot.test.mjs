import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace } from '../src/sim/race.js';
import { trackDef } from '../src/levels/tracks.js';
import { createBot } from '../src/sim/autopilot.js';

const L = 100000;
function view({ z = 1000, x = 0, speed = 8000, objects = [], curve = () => 0, t = 10, phase = 'racing', pods, health = 100 } = {}) {
  const player = { id: 0, isPlayer: true, z, x, speed, heat: 0, health, boost: { active: false, charge: 0 }, rolling: false, stalled: false, wreck: false };
  return { t, phase, player, pods: pods ?? [player], objects, segmentAt: (zz) => ({ curve: curve(zz) }), track: { id: 'none' } };
}
const wedge = (z, x) => ({ z, x, kind: 'wedge', active: true });
const mk = (o = {}) => createBot({ lapLength: L, noise: false, ...o });

test('no input before go; throttle in countdown is 0', () => {
  const i = mk().act(view({ phase: 'countdown' }));
  assert.equal(i.throttle, 0);
});

test('steers away from a wedge in its lane (look-ahead over view.objects)', () => {
  const r = mk().act(view({ objects: [wedge(4000, 0)] }));
  assert.ok(Math.abs(r.steer) > 0.2, 'should steer');
  const left = mk().act(view({ objects: [wedge(4000, 0.1)] })), right = mk().act(view({ objects: [wedge(4000, -0.1)] }));
  assert.ok(left.steer < 0 && right.steer > 0, 'dodges to the open side');
});

test('ignores an object that is behind or far beyond reach', () => {
  const r = mk().act(view({ objects: [wedge(500, 0), wedge(90000, 0)] }));
  assert.ok(Math.abs(r.steer) < 0.05);
});

test('brakes / lifts for a tight corner at speed, full throttle on a straight', () => {
  const corner = mk().act(view({ speed: 14000, curve: (zz) => (zz > 3000 ? 0.004 : 0) }));
  assert.ok(corner.throttle === 0 || corner.brake > 0);
  const straight = mk().act(view({ speed: 14000 }));
  assert.equal(straight.throttle, 1);
});

test('feed-forward cancels centrifugal push inside a corner', () => {
  const r = mk().act(view({ speed: 14000, x: 0.34, curve: () => 0.001 }));
  assert.ok(r.steer > 0.1, 'positive curve pushes x negative; bot steers positive');
});

test('rolls through an unavoidable wall of solids', () => {
  const objects = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9].map((x) => wedge(1350, x));
  const r = mk().act(view({ objects, speed: 9000 }));
  assert.ok(r.roll !== 0);
});

test('does not roll when a clear lane exists', () => {
  const r = mk().act(view({ objects: [wedge(1900, 0)], speed: 9000 }));
  assert.equal(r.roll, 0);
});

test('skill knob: low skill wobbles, high skill is steady', () => {
  const steers = (skill) => { const b = createBot({ lapLength: L, skill, seed: 3 }); const a = []; for (let i = 0; i < 200; i++) a.push(b.act(view({ t: i / 60, z: 1000 + i * 100 })).steer); return a; };
  const spread = (a) => Math.max(...a) - Math.min(...a);
  assert.ok(spread(steers(0.1)) > spread(steers(1)) + 0.05);
});

test('watchdog: no progress for several seconds triggers a recovery manoeuvre', () => {
  const b = mk();
  let rec = null;
  for (let i = 0; i < 60 * 6; i++) { const r = b.act(view({ t: 5 + i / 60, z: 5000, x: 0.9, speed: 100 })); if (b.stats.watchdog && !rec) rec = r; }
  assert.ok(b.stats.watchdog >= 1);
  assert.ok(rec.steer < 0, 'steers back toward the centre');
});

test('determinism: same seed, same inputs', () => {
  const run = () => { const race = createRace({ track: trackDef('brie', 1), seed: 1, mode: 'time' }); const b = createBot({ skill: 0.5, seed: 1 }); const log = []; for (let i = 0; i < 1500; i++) { const inp = b.act(race.view()); log.push(inp.steer.toFixed(5)); race.step(inp); } return log.join(); };
  assert.equal(run(), run());
});

test('finishes brie (full race, 3 laps) with a real sim', () => {
  const race = createRace({ track: trackDef('brie', 2), seed: 2, mode: 'race' });
  const b = createBot({ skill: 0.8, seed: 2 });
  while (race.view().phase !== 'finished' && race.t < 400) race.step(b.act(race.view()));
  assert.equal(race.view().phase, 'finished');
  assert.ok(race.view().player.finishTime > 60);
});

test('solo hazard-dodging: brie time-trial lap loses little health', () => {
  const race = createRace({ track: trackDef('swiss', 1), seed: 1, mode: 'time', laps: 1 });
  const b = createBot({ skill: 0.9, seed: 1 });
  while (race.view().phase !== 'finished' && race.t < 300) race.step(b.act(race.view()));
  assert.equal(race.view().phase, 'finished');
  assert.ok(race.view().player.health >= 50, 'health ' + race.view().player.health);
});
