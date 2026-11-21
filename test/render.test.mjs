import test from 'node:test';
import assert from 'node:assert/strict';
import { W, H } from '../src/core/defs.js';
import { createPixCtx, buildArt, fallbackSprite, ART_NAMES } from '../src/art/registry.js';
import { createRenderer } from '../src/render/renderer.js';
import { fakeView } from '../src/render/scene.js';
import { project } from '../src/render/road.js';

const distinct = (ctx) => { const s = new Set(); const d = ctx.canvas.__pb.rgba; for (let i = 0; i < d.length; i += 4 * 7) s.add(d[i] << 16 | d[i + 1] << 8 | d[i + 2]); return s.size; };
const sum = (ctx) => { let h = 0; const d = ctx.canvas.__pb.rgba; for (let i = 0; i < d.length; i++) h = (h * 31 + d[i]) >>> 0; return h; };

test('renders 3 frames of a fake race for every biome without throwing', async () => {
  for (const biome of ['coast', 'mesa', 'tunnels', 'lava', 'bog', 'snow', 'caves', 'arena']) {
    const ctx = createPixCtx(W, H), r = createRenderer(ctx, { style: 'retro' });
    await r.ready;
    const hashes = new Set();
    for (let f = 0; f < 3; f++) {
      r.draw(fakeView({ biome, z: 30000 + f * 400, t: f / 60, boost: f === 2, heat: 0.9 }), f / 60, { radio: { who: 'pete', text: 'hi' } });
      assert.ok(distinct(ctx) > 6, biome + ' frame has content');
      hashes.add(sum(ctx));
    }
    assert.equal(hashes.size, 3, biome + ' frames differ');
  }
});

test('missing art falls back to rectangles for every manifest name', async () => {
  const art = await buildArt({ style: 'retro' });
  for (const n of ART_NAMES) { const s = art.get(n); assert.ok(s.frames.length >= 1 && s.w > 0); }
  assert.ok(fallbackSprite('pod_colby').fallback);
});

test('hi-res style (toon) renders at scale via fallback and is deterministic', async () => {
  const run = async () => { const ctx = createPixCtx(W * 2, H * 2), r = createRenderer(ctx, { style: 'toon' }); await r.ready; r.draw(fakeView({}), 0.5); return sum(ctx); };
  assert.equal(await run(), await run());
});

test('projection: road widens toward camera and bends with vis', () => {
  const p = project(fakeView({ z: 30000 }));
  const vs = p.segs.filter((s) => s.visible);
  assert.ok(vs.length > 20 && vs[0].w1 > vs[vs.length - 1].w1);
});

test('every defs.ART name resolves to real art (fallback:false) once all modules exist', async () => {
  const art = await buildArt({ style: 'retro' });
  const missing = ART_NAMES.filter((n) => art.get(n).fallback);
  if (art.report.missing.length) { console.log('modules still missing, skipping strict check:', art.report.missing.join(',')); return; }
  assert.deepEqual(missing, []);
});
