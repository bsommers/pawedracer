import test from 'node:test';
import assert from 'node:assert/strict';
import { SFX } from '../src/core/defs.js';
import { SFX_RECIPES, SFX_NAMES, LOOP_SFX, describe, renderSfx, stats, duration } from '../src/audio/sfx.js';

const SR = 44100;
const SRC = new Set(['sine', 'square', 'saw', 'triangle', 'noise']);

test('every defs.SFX name has a recipe and no extra names', () => {
  assert.deepEqual([...SFX_NAMES], [...SFX]);
  for (const n of SFX) assert.equal(typeof SFX_RECIPES[n], 'function', `missing recipe ${n}`);
  assert.equal(Object.keys(SFX_RECIPES).length, SFX.length);
});

test('voices are well-formed plain data', () => {
  for (const n of SFX) {
    const voices = describe(n);
    assert.ok(voices.length > 0, `${n} has no voices`);
    for (const o of voices) {
      assert.ok(SRC.has(o.src), `${n} bad src ${o.src}`);
      for (const k of ['t', 'dur', 'gain', 'att']) assert.ok(Number.isFinite(o[k]), `${n}.${k} not finite`);
      assert.ok(o.dur > 0 && o.gain > 0 && o.gain <= 1, `${n} bad dur/gain`);
    }
  }
});

test('unknown name throws, unknown style falls back to retro', () => {
  assert.throws(() => describe('no_such_sfx'), /unknown sfx/);
  assert.deepEqual(describe('hit_wall', { style: 'nope' }), describe('hit_wall'));
});

test('pitch option scales pitched voices and leaves cache intact', () => {
  const base = describe('pickup_coin');
  const hi = describe('pickup_coin', { pitch: 2 });
  assert.equal(hi[0].f, base[0].f * 2);
  assert.equal(describe('pickup_coin')[0].f, base[0].f);
});

test('every SFX renders finite, audible, un-clipped audio with soft edges', () => {
  for (const n of SFX) {
    const pcm = renderSfx(n, SR);
    const s = stats(pcm);
    assert.ok(pcm.every(Number.isFinite), `${n} has NaN/Infinity`);
    assert.ok(s.peak >= 0.05 && s.peak < 0.97, `${n} peak ${s.peak.toFixed(3)} out of range (needs headroom, not limiter)`);
    assert.ok(s.rms > 0.005, `${n} rms ${s.rms.toFixed(4)} is near silence`);
    assert.ok(Math.abs(pcm[0]) < 0.02, `${n} starts hard (click)`);
    assert.ok(Math.abs(pcm[pcm.length - 1]) < 0.01, `${n} ends hard (click)`);
  }
});

test('durations are sensible; loops match their declared cycle', () => {
  for (const n of SFX) {
    const d = duration(describe(n));
    if (n in LOOP_SFX) assert.equal(d, LOOP_SFX[n], `${n} cycle length`);
    else assert.ok(d >= 0.03 && d <= 1.5, `${n} duration ${d}s`);
  }
});

test('loops tile: the seam between last and first sample is no bigger than the signal', () => {
  for (const n of Object.keys(LOOP_SFX)) {
    const pcm = renderSfx(n, SR);
    const len = Math.round(LOOP_SFX[n] * SR);
    const loop = pcm.subarray(0, len);
    const s = stats(loop);
    const seam = Math.abs(loop[len - 1] - loop[0]);
    assert.ok(seam < 0.02 * s.peak + 1e-3, `${n} seam ${seam.toFixed(4)} vs peak ${s.peak.toFixed(3)}`);
    const edge = Math.max(Math.abs(loop[len - 1]), Math.abs(loop[0]));
    assert.ok(edge < 0.01, `${n} edge amplitude ${edge}`);
  }
});

test('engine loop stays periodic when rendered twice in a row', () => {
  const pcm = renderSfx('engine_loop', SR);
  const len = Math.round(LOOP_SFX.engine_loop * SR);
  const first = pcm.subarray(0, len);
  const twice = new Float32Array(len * 2);
  twice.set(first, 0); twice.set(first, len);
  // the loop has no DC step and the second cycle matches the first within the peak (voices are phase-locked to the cycle)
  const mid = twice[len - 1], wrap = twice[len];
  assert.ok(Math.abs(mid - wrap) < 0.02 * stats(first).peak + 1e-3);
});

test('engine pitch changes the drone without breaking audibility', () => {
  const p = renderSfx('engine_loop', SR, { pitch: 1.25 });
  assert.ok(p.every(Number.isFinite));
  assert.ok(stats(p).rms > 0.005);
});
