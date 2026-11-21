import test from 'node:test';
import assert from 'node:assert/strict';
import { ART } from '../src/core/defs.js';
import { build as bScenery } from '../src/art/scenery.js';
import { build as bHaz } from '../src/art/hazards.js';
import { build as bBack } from '../src/art/backdrop.js';
import { build as bFx } from '../src/art/fx.js';

const MODS = { scenery: [bScenery, ['scenery']], hazards: [bHaz, ['hazards', 'pickups']], backdrop: [bBack, ['backdrop']], fx: [bFx, ['fx', 'ui']] };
const bytes = (o) => Buffer.concat(Object.keys(o).sort().flatMap((k) => [...o[k]].map((f) => Buffer.from(f.rgba))));

for (const [name, [build, groups]] of Object.entries(MODS)) {
  test(name + ': manifest conformance', () => {
    const o = build();
    const want = Object.assign({}, ...groups.map((g) => ART[g]));
    assert.deepEqual(Object.keys(o).sort(), Object.keys(want).sort());
    for (const [k, d] of Object.entries(want)) {
      assert.equal(o[k].length, d.frames, k); assert.equal(o[k].frames.length, d.frames);
      for (const f of o[k]) { assert.equal(f.w, d.w, k); assert.equal(f.h, d.h, k); }
    }
  });
  test(name + ': deterministic and fast', () => {
    const t0 = performance.now(); const a = build(); const ms = performance.now() - t0;
    assert.ok(Buffer.compare(bytes(a), bytes(build())) === 0);
    assert.ok(ms < 400, 'build ' + ms);
  });
}

test('backdrop wraps seamlessly', () => {
  const o = bBack();
  for (const [k, fr] of Object.entries(o)) {
    const p = fr[0]; let bad = 0;
    for (let y = 0; y < p.h; y++) {
      const a = (y * p.w + p.w - 1) * 4, b = (y * p.w) * 4;
      if ((p.rgba[a + 3] >= 128) !== (p.rgba[b + 3] >= 128)) { bad++; continue; }
      if (k.startsWith('bg_sky_')) { let d = 0; for (let c = 0; c < 3; c++) d += Math.abs(p.rgba[a + c] - p.rgba[b + c]); if (d > 60) bad++; }
    }
    assert.ok(bad <= (k.startsWith('bg_sky_') ? 3 : 4), `${k}: ${bad} seam mismatches`);
  }
});

test('sprites are bottom-anchored (outline on last row) for grounded scenery', () => {
  const o = bScenery();
  for (const k of ['sc_palm', 'sc_rock', 'sc_cactus', 'sc_stalag', 'sc_pine', 'sc_lamp', 'sc_cheese_house', 'sc_sign']) {
    const f = o[k][0]; let last = -1;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.rgba[(y * f.w + x) * 4 + 3] >= 128) last = y;
    assert.ok(last >= f.h - 3, `${k} lowest opaque row ${last}`);
  }
});
