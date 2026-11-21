import test from 'node:test';
import assert from 'node:assert/strict';
import { MUSIC, TRACKS } from '../src/core/defs.js';
import { SONGS, MUSIC_FOR, MUSIC_NAMES, describeMusic, renderMusic, musicStats, spectralCentroid, songFor, trackForRace } from '../src/audio/music.js';
import { createLiveMusic } from '../src/audio/live-music.js';
import { parseBar } from '../src/kits/audio-kit/index.js';

const SR = 22050, LOOPS = MUSIC.filter((n) => n !== 'podium');

test('SONGS defines exactly the defs.MUSIC names; MUSIC_FOR covers every track', () => {
  assert.deepEqual(MUSIC_NAMES, MUSIC);
  assert.deepEqual(Object.keys(SONGS).sort(), [...MUSIC].sort());
  for (const t of TRACKS) { assert.ok(MUSIC.includes(MUSIC_FOR[t.id]), t.id); assert.equal(trackForRace(t.id), 'race_' + t.id); }
  assert.throws(() => songFor('nope'));
});
test('every bar is exactly 16 sixteenths; loop flags and bpm are right', () => {
  for (const n of MUSIC) {
    const s = SONGS[n];
    for (const [ch, C] of Object.entries(s.channels)) { assert.ok(C.pat.length >= 1); for (const b of C.pat) parseBar(b); assert.ok(C.pat.length === s.bars || s.bars % C.pat.length === 0, `${n}/${ch}`); }
    if (s.drums) for (const b of s.drums.pat) assert.equal(b.length, 16, `${n} drums`);
    assert.equal(s.loop, LOOPS.includes(n), `${n} loop`);
    assert.ok(s.bpm >= 100 && s.bpm <= 160, `${n} bpm`);
  }
});
test('lead bars sum to 16 steps exactly', () => {
  for (const n of MUSIC) for (const b of SONGS[n].channels.lead.pat) {
    const sum = b.split(/\s+/).reduce((a, tok) => a + +tok.split(':')[1], 0);
    assert.equal(sum, 16, `${n}: ${b}`);
  }
});
test('every track renders: no NaN, audible, unclipped, sensible RMS, deterministic', () => {
  for (const n of MUSIC) {
    const a = renderMusic(n, SR), b = renderMusic(n, SR), s = musicStats(a), T = describeMusic(n);
    for (let i = 0; i < a.length; i += 7) assert.ok(Number.isFinite(a[i]), `${n} NaN`);
    assert.ok(s.peak > 0.2 && s.peak <= 1, `${n} peak ${s.peak}`);
    assert.ok(s.rms > 0.04 && s.rms < 0.4, `${n} rms ${s.rms}`);
    assert.ok(Math.abs(s.len / SR - (T.loop ? T.length : T.length + 0.6)) < 0.01, `${n} length`);
    assert.deepEqual(a, b);
    const c = spectralCentroid(a, SR); assert.ok(c > 150 && c < 6000, `${n} centroid ${c}`);
  }
});
test('loops are seamless and the podium sting fades out', () => {
  for (const n of LOOPS) {
    const T = describeMusic(n), pcm = renderMusic(n, SR, T.length * 2), N = Math.round(T.length * SR);
    let worst = 0; for (let i = 1; i < pcm.length; i++) worst = Math.max(worst, Math.abs(pcm[i] - pcm[i - 1]));
    let wrap = 0; for (let i = N - 3; i < N + 3; i++) wrap = Math.max(wrap, Math.abs(pcm[i] - pcm[i - 1]));
    assert.ok(wrap <= worst + 1e-9 && wrap < 0.6, `${n} wrap step ${wrap}`);
    const r1 = musicStats(pcm.subarray(0, N)).rms, r2 = musicStats(pcm.subarray(N, 2 * N)).rms;
    assert.ok(Math.abs(r1 - r2) / r1 < 0.03, `${n} rms pass1 ${r1} vs pass2 ${r2}`);
  }
  for (const n of MUSIC) assert.ok(Math.abs(renderMusic(n, SR)[0]) < 0.05 || LOOPS.includes(n), `${n} first sample`);
  const p = renderMusic('podium', SR); assert.ok(Math.abs(p[p.length - 1]) < 0.01);
});
test('tracks are distinct and duel_pete is darker/denser than shop', () => {
  const keys = new Set(MUSIC.map((n) => JSON.stringify(SONGS[n].channels.lead.pat)));
  assert.equal(keys.size, MUSIC.length);
  assert.ok(SONGS.duel_pete.bpm > SONGS.shop.bpm);
  assert.ok(musicStats(renderMusic('duel_pete', SR)).rms > musicStats(renderMusic('shop', SR)).rms * 0.9);
});
test('live-music schedules a loop against a fake AudioContext without throwing', () => {
  const mk = () => ({ connect() {}, disconnect() {}, start() {}, stop() {}, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }, frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  const ctx = { currentTime: 0, sampleRate: 8000, createGain: mk, createOscillator: mk, createBiquadFilter: mk, createBufferSource: mk, createBuffer: () => ({ getChannelData: () => new Float32Array(8000) }) };
  const lm = createLiveMusic(ctx, mk(), { describe: describeMusic, timer: { set: () => 1, clear() {} } });
  assert.ok(lm.play('race_gouda')); assert.equal(lm.current, 'race_gouda'); assert.ok(lm.stats.nodes > 100);
  lm.dispose();
});
