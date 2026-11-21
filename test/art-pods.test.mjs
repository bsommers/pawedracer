import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ART } from '../src/core/defs.js';
import { build as buildPods } from '../src/art/pods.js';
import { build as buildChars } from '../src/art/chars.js';

const mods = { pods: buildPods, chars: buildChars };
const hash = (o) => JSON.stringify(Object.entries(o).map(([k, v]) => [k, v.frames.map((f) => Buffer.from(f.rgba).toString('base64'))]));

for (const [m, build] of Object.entries(mods)) {
  test(`${m}: manifest conformance`, () => {
    const out = build();
    for (const [name, spec] of Object.entries(ART[m])) {
      assert.ok(out[name], 'missing ' + name);
      assert.equal(out[name].frames.length, spec.frames, name + ' frames');
      assert.equal(out[name].w, spec.w); assert.equal(out[name].h, spec.h);
      for (const f of out[name].frames) {
        assert.equal(f.w, spec.w, name); assert.equal(f.h, spec.h, name);
        let op = 0; for (let i = 3; i < f.rgba.length; i += 4) if (f.rgba[i] >= 128) op++;
        assert.ok(op > 0, name + ' is blank');
      }
    }
    for (const k of Object.keys(out)) assert.ok(ART[m][k], 'extra ' + k);
  });
  test(`${m}: deterministic and fast`, () => {
    const t0 = performance.now(); const a = build(); const ms = performance.now() - t0;
    assert.equal(hash(a), hash(build()));
    assert.ok(ms < 400, `build took ${ms.toFixed(0)} ms`);
  });
}

test('pods: bodies are not clipped and sit on the bottom row', () => {
  const out = buildPods();
  for (const [name, v] of Object.entries(out)) {
    if (!/^pod_(colby|pete|r\d)$/.test(name)) continue;
    v.frames.forEach((f, i) => {
      let maxY = 0;
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
        const j = (y * f.w + x) * 4; if (f.rgba[j + 3] < 128) continue;
        maxY = Math.max(maxY, y);
        if (x === 0 || y === 0 || x === f.w - 1) assert.ok(f.rgba[j] === 0x1a && f.rgba[j + 1] === 0x14 && f.rgba[j + 2] === 0x20, `${name}[${i}] clipped at ${x},${y}`);
      }
      assert.equal(maxY, f.h - 1, `${name}[${i}] feet row`);
    });
  }
});
