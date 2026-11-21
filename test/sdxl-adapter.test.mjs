import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdapter, listAdapters } from '../tools/character-pipeline/adapters/index.mjs';
test('sdxl adapter is registered, local, and not a network adapter', () => {
  const a = getAdapter('sdxl'); assert.equal(a.name, 'sdxl'); assert.equal(a.network, false); assert.equal(a.local, true);
  assert.ok(listAdapters().some((x) => x.name === 'sdxl'));
});
test('sdxl adapter fails clearly when the python env is missing', async () => {
  const old = process.env.PR_SDXL_PY; process.env.PR_SDXL_PY = '/nonexistent/python';
  try { await assert.rejects(() => getAdapter('sdxl').generate({ prompt: 'x', size: [512, 512] }), /sdxl failed/); } finally { old === undefined ? delete process.env.PR_SDXL_PY : (process.env.PR_SDXL_PY = old); }
});
import { floodMatte } from '../tools/character-pipeline/lib/learn.mjs';
test('floodMatte removes a gradient background and keeps the subject', () => {
  const w = 40, h = 40, rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4, g = 150 + y; const inside = x > 12 && x < 28 && y > 10 && y < 30; rgba.set(inside ? [220, 90, 30, 255] : [g, g, g, 255], o); }
  const { image } = floodMatte({ w, h, rgba }); const a = (x, y) => image.rgba[(y * w + x) * 4 + 3];
  assert.equal(a(2, 2), 0); assert.equal(a(37, 37), 0); assert.equal(a(20, 20), 255);
});
