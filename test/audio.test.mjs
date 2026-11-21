import test from 'node:test'; import assert from 'node:assert/strict';
import { createAudio, EVENT_SFX, resolveMusic } from '../src/audio/audio.js';
import { createBus } from '../src/core/events.js';
import { SFX, MUSIC } from '../src/core/defs.js';

function fakeCtx() {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = () => ({ connect() {}, disconnect() {}, start() {}, stop() {}, gain: param(), frequency: param(), Q: param(), pan: param(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() });
  return class { constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = node(); this.state = 'running'; }
    createGain() { return node(); } createOscillator() { return node(); } createBiquadFilter() { return node(); } createDynamicsCompressor() { return node(); }
    createStereoPanner() { return node(); } createBufferSource() { return node(); } createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
}

test('every mapped event name is a real SFX', () => {
  for (const f of Object.values(EVENT_SFX)) for (const p of [{}, { pod: 0, n: 3, kind: 'wall', mood: 'laugh' }, { pod: 0, kind: 'tuna' }, { pod: 0, kind: 'pod' }]) { const n = f(p); assert.ok(n === null || SFX.includes(n), n); }
});
test('music names and track ids resolve', () => {
  for (const m of MUSIC) assert.equal(resolveMusic(m), m);
  assert.equal(resolveMusic('brie'), 'race_brie'); assert.equal(resolveMusic('nope'), null);
});
test('live mode: events play SFX, engine follows speed and boost, music is remembered', async () => {
  const bus = createBus(), timers = [];
  const a = createAudio(bus, {}, { AudioContextCtor: fakeCtx(), timer: { set: (f) => { timers.push(f); return timers.length; }, clear() {} } });
  bus.emit('lap', { pod: 0 }); assert.equal(a.stats.played, 0);   // dropped before resume
  a.setMusic('title'); assert.equal(a.musicName, 'title');
  assert.equal(await a.resume(), true);
  bus.emit('countdown', { n: 3 }); bus.emit('hit', { pod: 0, kind: 'wall' }); bus.emit('pickup', { pod: 0, kind: 'mouse' }); bus.emit('lap', { pod: 3 });
  assert.deepEqual(Object.keys(a.stats.byName).sort(), ['countdown_beep', 'hit_wall', 'pickup_mouse']);
  a.engine(0.2, false); const lo = a.engineState.freq; a.engine(1, false); const hi = a.engineState.freq; a.engine(1, true);
  assert.ok(hi > lo && a.engineState.freq > hi && a.engineState.level > 0);
  a.engine(0, false); assert.equal(a.engineState.level, 0);
  assert.equal(a.play('menu_ok'), true); assert.equal(a.play('bogus'), false);
  assert.equal(a.setMusic('duel_pete'), true); assert.equal(a.setMusic('bogus'), false);
  bus.emit('go'); assert.ok(timers.length >= 1);   // crowd_loop scheduler running
  a.dispose();
});
