import test from 'node:test'; import assert from 'node:assert/strict';
import { trackDef, TRACK_IDS, CURVE_VISUAL } from '../src/levels/tracks.js';
import { validateTrack, speedProfile, cornerLimit, blockedInterval } from '../src/levels/validate.js';
import { TRACKS, ROAD, POD, HAZARDS } from '../src/core/defs.js';

test('all eight tracks exist with contract shape', () => {
  assert.equal(TRACK_IDS.length, 8);
  for (const t of TRACKS) {
    const d = trackDef(t.id, 1);
    assert.equal(d.id, t.id); assert.equal(d.segments.length, t.length * 10);
    assert.equal(d.laps, t.laps); assert.equal(d.theme, t.theme); assert.equal(d.biome, t.biome);
    for (const k of ['curve', 'y', 'bank', 'tunnel', 'zone']) assert.ok(k in d.segments[5]);
    assert.ok(d.objects.length > 50);
  }
});
test('8 tracks x seeds 1..20 validate', () => {
  for (const id of TRACK_IDS) for (let s = 1; s <= 20; s++) {
    const r = validateTrack(trackDef(id, s));
    assert.ok(r.ok, `${id}/${s}: ${r.issues.join('; ')}`);
  }
});
test('determinism: same id+seed identical, no shared mutation', () => {
  for (const id of TRACK_IDS) {
    const a = trackDef(id, 7), b = trackDef(id, 7);
    assert.deepEqual(a, b);
    a.segments[0].curve = 99; a.objects.length = 0;
    assert.deepEqual(trackDef(id, 7), b);
  }
});
test('different seed -> different objects, same curve skeleton', () => {
  for (const id of TRACK_IDS) {
    const a = trackDef(id, 1), b = trackDef(id, 2);
    assert.deepEqual(a.segments, b.segments);
    const sig = (d) => JSON.stringify(d.objects.filter((o) => o.type === 'hazard').map((o) => [o.kind, o.z, o.x]));
    assert.notEqual(sig(a), sig(b), id);
  }
});
test('loop closure: curve sums to zero, elevation returns to start', () => {
  for (const id of TRACK_IDS) {
    const s = trackDef(id, 1).segments;
    assert.ok(Math.abs(s.reduce((a, g) => a + g.curve, 0)) < 1e-9, id);
    assert.ok(Math.abs(s[s.length - 1].y - s[0].y) < 60, id);
    assert.ok(Math.abs(s[0].y) < 60);
    assert.ok(s.every((g) => Math.abs(g.vis - g.curve * CURVE_VISUAL) < 1e-9));
  }
});
test('personalities differ', () => {
  const lap = Object.fromEntries(TRACK_IDS.map((id) => [id, validateTrack(trackDef(id, 1))]));
  const kinds = (id) => new Set(trackDef(id, 1).objects.filter((o) => o.type === 'hazard').map((o) => o.kind));
  assert.ok(kinds('fondue').has('fondue')); assert.ok(kinds('swiss').has('hole')); assert.ok(kinds('blue').has('stink'));
  assert.ok(kinds('blue').has('mine')); assert.ok(trackDef('swiss', 1).segments.some((s) => s.tunnel));
  assert.ok(trackDef('blue', 1).segments.some((s) => s.zone === 'fog'));
  assert.ok(trackDef('parmesan', 1).segments.some((s) => s.y > 2500));
  assert.ok(Math.max(...trackDef('camembert', 1).segments.map((s) => Math.abs(s.curve))) > 0.018);
  assert.ok(Math.max(...trackDef('brie', 1).segments.map((s) => Math.abs(s.curve))) < 0.006);
  const g = trackDef('gouda', 1);
  assert.ok(g.objects.some((o) => o.kind === 'sc_pete_billboard') && g.objects.some((o) => o.kind === 'sc_crowd'));
  assert.ok(g.segments.slice(30, 130).every((s) => Math.abs(s.curve) < 1e-9), 'long straight');
  assert.ok(lap.camembert.lapTime > lap.brie.lapTime);
});
test('speed profile: corner limit monotone and profile respects it', () => {
  assert.ok(cornerLimit(0.02) < cornerLimit(0.005));
  const d = trackDef('camembert', 1), p = speedProfile(d.segments);
  d.segments.forEach((s, i) => assert.ok(p[i] <= cornerLimit(s.curve) + 1e-6));
});
test('fairness: every hazard row leaves a gap; validator catches a wall', () => {
  const d = trackDef('brie', 1);
  const z = 20000;
  const wall = [-0.6, 0, 0.6].map((x) => ({ z, x, kind: 'wedge', type: 'hazard', art: 'hz_wedge' }));
  const bad = { ...d, objects: [...d.objects, ...wall].sort((a, b) => a.z - b.z) };
  const r = validateTrack(bad);
  assert.equal(r.ok, false); assert.match(r.issues.join('|'), /no gap/);
});
test('fairness: unreachable row after a gap shift is rejected', () => {
  const d = trackDef('brie', 1);
  const mk = (z, g) => [g - 0.55 - 0.53, g + 0.55 + 0.53].map((x) => ({ z, x, kind: 'wedge', type: 'hazard' }));
  // gap at -0.4 then, 800 units later, gap at +0.4 : impossible shift
  const objs = [...mk(30000, -0.45), ...mk(30900, 0.45)].map((o) => ({ ...o }));
  const bad = { ...d, objects: objs.sort((a, b) => a.z - b.z) };
  const r = validateTrack(bad);
  assert.ok(!r.ok);
});
test('fairness: hazards inside start clear zone, bad timed spacing, broken closure all flagged', () => {
  const d = trackDef('cheddar', 1);
  assert.ok(!validateTrack({ ...d, objects: [{ z: 500, x: 0.8, kind: 'wedge' }, ...d.objects] }).ok);
  const t = (z) => ({ z, x: 0, kind: 'cutter', period: 4, phase: 0, type: 'hazard' });
  const two = { ...d, objects: [t(40000), t(41000)] };
  assert.match(validateTrack(two).issues.join('|'), /too close/);
  const segs = d.segments.map((s, i) => (i === 100 ? { ...s, curve: s.curve + 0.002 } : s));
  assert.match(validateTrack({ ...d, segments: segs }).issues.join('|'), /sum to zero|jumps/);
  const fast = { ...d, objects: [t(40000)].map((o) => ({ ...o, period: 1 })) };
  assert.match(validateTrack(fast).issues.join('|'), /period/);
});
test('objects sorted, x sane, hazards carry art names', () => {
  for (const id of TRACK_IDS) {
    const d = trackDef(id, 3);
    for (let i = 1; i < d.objects.length; i++) assert.ok(d.objects[i].z >= d.objects[i - 1].z);
    for (const o of d.objects.filter((o) => o.type === 'hazard')) assert.equal(o.art, HAZARDS[o.kind].art);
    for (const o of d.objects) assert.ok(o.z >= 0 && o.z < d.segments.length * ROAD.segLen);
  }
});
