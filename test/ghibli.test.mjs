import test from 'node:test';
import assert from 'node:assert/strict';
import * as kit from '../src/kits/painter-kit/index.js';
import { artManifest, HI_SCALE } from '../src/core/defs.js';
import * as render from '../src/render/ghibli.js';

const MODS = ['pods', 'chars', 'scenery', 'hazards', 'backdrop', 'fx'];
const manifestFor = (m) => artManifest().filter((a) => (m === 'hazards' ? ['hazards', 'pickups'] : m === 'fx' ? ['fx', 'ui'] : [m]).includes(a.group));
const sig = (b) => JSON.stringify(Object.entries(b).map(([k, v]) => [k, v.frames.map((f) => f.ctx.calls.length + ':' + f.ctx.calls.map((c) => c.op + (c.fill && typeof c.fill === 'string' ? c.fill : '')).join('|').length)]));

for (const m of MODS) {
  const mod = await import(`../src/art/ghibli/${m}.js`);
  test(`ghibli ${m}: manifest conformance`, () => {
    const built = mod.build(kit), want = manifestFor(m);
    for (const a of want) {
      const v = built[a.name];
      assert.ok(v, `missing ${a.name}`);
      assert.equal(v.frames.length, a.frames, `${a.name} frames`);
      assert.equal(v.w, a.w, `${a.name} w`); assert.equal(v.h, a.h, `${a.name} h`);
      for (const f of v.frames) { assert.equal(f.canvas.width, a.w * HI_SCALE, `${a.name} surface w`); assert.equal(f.canvas.height, a.h * HI_SCALE, `${a.name} surface h`); }
    }
    for (const k of Object.keys(built)) assert.ok(want.some((a) => a.name === k), `extra ${k}`);
  });
  test(`ghibli ${m}: deterministic and fast`, () => {
    const t0 = performance.now(); const a = mod.build(kit); const ms = performance.now() - t0;
    const b = mod.build(kit);
    assert.equal(sig(a), sig(b));
    // byte-level determinism: identical recorded draw calls
    for (const k of Object.keys(a)) a[k].frames.forEach((f, i) => assert.equal(JSON.stringify(f.ctx.calls.map((c) => [c.op, c.args.filter((x) => typeof x === 'number')])), JSON.stringify(b[k].frames[i].ctx.calls.map((c) => [c.op, c.args.filter((x) => typeof x === 'number')])), `${k}[${i}] differs between builds`));
    assert.ok(ms < 400, `build took ${ms.toFixed(0)} ms`);
    for (const v of Object.values(a)) for (const f of v.frames) assert.ok(f.ctx.calls.length > 5, 'every frame draws something');
  });
}

test('ghibli render: theme and hooks are well formed and safe on a recording ctx', () => {
  for (const b of ['coast', 'mesa', 'tunnels', 'lava', 'bog', 'snow', 'caves', 'arena']) { const t = render.theme(b); assert.equal(t.grass.length, 2); assert.equal(t.road.length, 2); assert.ok(t.fog && t.sky); }
  const s = kit.makeSurface(1280, 800);
  const view = { t: 1.5, track: { id: 'brie', biome: 'coast', theme: 'dusk' }, pods: [{ speed: 900, boost: { active: true } }] };
  for (const h of ['beforeSky', 'afterWorld', 'afterHud']) assert.doesNotThrow(() => render.hooks[h](s.ctx, s.ctx, view, {}));
  assert.ok(s.ctx.calls.length > 20, 'hooks draw ambient decoration');
  render.setMusic('duel_pete'); assert.doesNotThrow(() => render.hooks.afterWorld(s.ctx, s.ctx, view, {}));
});
