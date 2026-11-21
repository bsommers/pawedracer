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
