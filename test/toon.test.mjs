import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { ART, HI_SCALE } from '../src/core/defs.js';

const MODS = { pods: ['pods'], chars: ['chars'], hazards: ['hazards', 'pickups'], scenery: ['scenery'], backdrop: ['backdrop'], fx: ['fx', 'ui'] };
const hash = (built) => { const h = createHash('sha1'); for (const k of Object.keys(built).sort()) for (const f of built[k].frames) h.update(k).update(Buffer.from(f.rgba.buffer)); return h.digest('hex'); };

for (const [mod, groups] of Object.entries(MODS)) {
  test(`toon/${mod}: manifest, determinism, build time`, async () => {
    const { build } = await import(`../src/art/toon/${mod}.js`);
    const t0 = performance.now(); const a = build(); const ms = performance.now() - t0;
    assert.ok(ms < 400, `${mod} build ${ms.toFixed(0)} ms`);
    const want = groups.flatMap((g) => Object.entries(ART[g]));
    assert.deepEqual(Object.keys(a).sort(), want.map(([n]) => n).sort(), 'names match manifest');
    for (const [name, spec] of want) {
      const e = a[name];
      assert.equal(e.frames.length, spec.frames, `${name} frames`);
      for (const f of e.frames) {
        assert.equal(f.w, spec.w * HI_SCALE, `${name} w`); assert.equal(f.h, spec.h * HI_SCALE, `${name} h`);
        let op = 0; for (let i = 3; i < f.rgba.length; i += 4) if (f.rgba[i] >= 128) op++;
        assert.ok(op > 0, `${name} frame not empty`);
        if (!name.startsWith('portrait_') && !['bg_sky_day', 'bg_sky_dusk', 'bg_sky_night', 'hud_frame'].includes(name)) assert.ok(op < f.w * f.h, `${name} has transparent background`);
      }
    }
    assert.equal(hash(build()), hash(a), 'deterministic');
  });
}

test('toon pods: feet on bottom row, nothing clipped at left/right', async () => {
  const { build } = await import('../src/art/toon/pods.js');
  const a = build();
  for (const n of ['pod_colby', 'pod_pete', 'pod_r1', 'pod_r5']) for (const [fi, f] of a[n].frames.entries()) {
    let x0 = 1e9, x1 = -1, y1 = -1, y0 = 1e9;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.rgba[(y * f.w + x) * 4 + 3] >= 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    assert.ok(y1 >= f.h - 1 - 3 * HI_SCALE, `${n}[${fi}] bottom ${y1}/${f.h}`);
    assert.ok(x0 > 0 && x1 < f.w - 1 && y0 > 0, `${n}[${fi}] clipped x ${x0}-${x1} y0 ${y0}`);
  }
});

test('toon render module + registry pack loading', async () => {
  const m = await import('../src/render/toon.js');
  assert.equal(typeof m.theme, 'function'); assert.ok(m.hooks);
  const { buildArt } = await import('../src/art/registry.js');
  const art = await buildArt({ style: 'toon' });
  assert.deepEqual(art.report.errors, []);
  assert.equal(art.get('pod_colby').fallback, false);
  assert.equal(art.get('logo').w, 200);
});
