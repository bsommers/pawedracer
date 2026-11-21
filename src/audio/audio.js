// Pawed Racer audio (ARCHITECTURE 5.7). WebAudio only; Node-importable (no AudioContext touched at import time).
// createAudio(bus, settings, opts) -> { resume(), play(name, opts), setMusic(name), engine(speed01, boost), setSettings(s), setVolume(), setMute(), dispose(), stats }
// The AudioContext is created lazily by resume() (call from a user gesture). Events before that are dropped (music/engine are remembered).
import { describe, LOOP_SFX } from './sfx.js';
import { scheduleVoices } from '../kits/audio-kit/index.js';
import { createLiveMusic } from './live-music.js';
import { describeMusic, MUSIC_FOR } from './music.js';
import { SFX, MUSIC } from '../core/defs.js';

const clamp01 = (x, d = 0) => (typeof x === 'number' && isFinite(x) ? Math.min(Math.max(x, 0), 1) : d);
export const LIMITS = Object.freeze({ perName: 4, total: 20, retrigger: 0.03 });
const LOOP_GAIN = Object.freeze({ crowd_loop: 0.45, engine_loop: 0.6 });

// bus event -> SFX name (function returns null to stay silent). Player pod is id 0.
const mine = (p) => p?.pod === undefined || p.pod === 0;
export const EVENT_SFX = Object.freeze({
  countdown: (p) => (p?.n > 0 ? 'countdown_beep' : null),
  go: () => 'countdown_go',
  lap: (p) => (mine(p) ? 'lap' : null),
  finalLap: () => 'final_lap',
  finish: (p) => (mine(p) ? 'finish' : null),
  boost: (p) => (mine(p) ? 'boost_on' : null),
  boostEnd: (p) => (mine(p) ? 'boost_end' : null),
  overheat: (p) => (mine(p) ? 'overheat' : null),
  stall: (p) => (mine(p) ? 'engine_stall' : null),
  roll: (p) => (mine(p) ? 'roll' : null),
  hit: (p) => (!mine(p) ? null : p?.kind === 'wall' ? 'hit_wall' : p?.kind === 'pod' ? 'hit_pod' : 'hit_hazard'),
  scrape: (p) => (mine(p) ? 'scrape' : null),
  pickup: (p) => (!mine(p) ? null : p?.kind === 'tuna' ? 'pickup_tuna' : p?.kind === 'mouse' ? 'pickup_mouse' : 'pickup_coin'),
  pass: (p) => (mine(p) ? 'pass_whoosh' : null),
  peteTaunt: (p) => (p?.mood === 'laugh' ? 'pete_laugh' : 'pete_taunt'),
  peteDrop: () => 'splat',
  repair: (p) => (mine(p) ? 'repair' : null),
});

/** Resolve a music name: a MUSIC name, or a track id (brie -> race_brie). Returns null when unknown. */
export function resolveMusic(name) {
  if (name == null) return null;
  if (MUSIC.includes(name)) return name;
  return MUSIC_FOR[name] ?? null;
}

export function createAudio(bus, settings = {}, { AudioContextCtor, timer } = {}) {
  const Ctor = AudioContextCtor || (typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext)) || null;
  const vol = { master: clamp01(settings?.master, 0.8), sfx: clamp01(settings?.sfx, 1), music: clamp01(settings?.music, 0.7) };
  const state = { muted: !!settings?.mute, style: settings?.style || 'retro', ctx: null, nodes: null, active: [], lastPlay: new Map(), musicApi: null, musicName: null,
    eng: { speed: 0, boost: false, osc: null, osc2: null, gain: null, filt: null, freq: 0, level: 0 }, loops: new Map() };
  const stats = { played: 0, dropped: 0, ignored: 0, byName: {}, music: [] };
  const unsubs = [];
  const T = timer || { set: (f, ms) => setInterval(f, ms), clear: (h) => clearInterval(h) };

  function applyVolumes() {
    const n = state.nodes; if (!n) return;
    n.master.gain.value = state.muted ? 0 : vol.master;
    n.sfx.gain.value = vol.sfx; n.music.gain.value = vol.music;
  }
  function build(ctx) {
    const master = ctx.createGain(), sfx = ctx.createGain(), music = ctx.createGain(), limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.12;
    sfx.connect(master); music.connect(master); master.connect(limiter); limiter.connect(ctx.destination);
    state.ctx = ctx; state.nodes = { master, sfx, music, limiter };
    applyVolumes();
    try {
      state.musicApi = createLiveMusic(ctx, music, { describe: (n) => describeMusic(n), style: 'retro' });
      if (state.musicName) state.musicApi.play(state.musicName);
    } catch { state.musicApi = null; }
    buildEngine(ctx);
    for (const name of state.loops.keys()) startLoopTimer(name);
  }

  // ---- engine drone: saw + square an octave up through a lowpass; pitch and level follow speed and boost
  function buildEngine(ctx) {
    const e = state.eng;
    try {
      e.osc = ctx.createOscillator(); e.osc.type = 'sawtooth';
      e.osc2 = ctx.createOscillator(); e.osc2.type = 'square';
      e.filt = ctx.createBiquadFilter(); e.filt.type = 'lowpass'; e.filt.Q.value = 0.8;
      e.gain = ctx.createGain(); e.gain.gain.value = 0;
      const g2 = ctx.createGain(); g2.gain.value = 0.3;
      e.osc.connect(e.filt); e.osc2.connect(g2); g2.connect(e.filt); e.filt.connect(e.gain); e.gain.connect(state.nodes.sfx);
      e.osc.start(); e.osc2.start();
      applyEngine();
    } catch { e.osc = null; }
  }
  function applyEngine() {
    const e = state.eng, ctx = state.ctx;
    e.freq = 48 + 120 * Math.min(Math.max(e.speed, 0), 1.3) + (e.boost ? 45 : 0);
    e.level = e.speed > 0.001 ? 0.05 + 0.07 * Math.min(e.speed, 1.2) + (e.boost ? 0.04 : 0) : 0;
    if (!ctx || !e.osc) return;
    const t = ctx.currentTime, tc = 0.06;
    e.osc.frequency.setTargetAtTime(e.freq, t, tc); e.osc2.frequency.setTargetAtTime(e.freq * 2.005, t, tc);
    e.filt.frequency.setTargetAtTime(500 + 1800 * Math.min(e.speed, 1.2) + (e.boost ? 800 : 0), t, tc);
    e.gain.gain.setTargetAtTime(e.level, t, 0.08);
  }

  function playSfx(name, o = {}) {
    if (!SFX.includes(name)) { stats.ignored++; return false; }
    const ctx = state.ctx;
    if (!ctx || ctx.state === 'closed' || !state.nodes) { stats.dropped++; return false; }
    const now = ctx.currentTime;
    state.active = state.active.filter((a) => a.end > now);
    const last = state.lastPlay.get(name), same = state.active.filter((a) => a.name === name).length;
    if ((last !== undefined && now - last < LIMITS.retrigger) || same >= LIMITS.perName || state.active.length >= LIMITS.total) { stats.dropped++; return false; }
    const end = scheduleVoices(ctx, state.nodes.sfx, describe(name, { style: state.style, pitch: o.pitch || 1 }), now + 0.005, { pan: o.pan || 0, gain: o.gain ?? (LOOP_GAIN[name] ?? 1) });
    state.active.push({ name, end }); state.lastPlay.set(name, now);
    stats.played++; stats.byName[name] = (stats.byName[name] || 0) + 1;
    return true;
  }

  // ---- loops: LOOP_SFX names are rescheduled one cycle at a time, back to back on the audio clock
  function startLoopTimer(name) {
    const L = state.loops.get(name); if (!L || !state.ctx || L.handle != null) return;
    const len = LOOP_SFX[name];
    const pump = () => {
      const ctx = state.ctx; if (!ctx || !state.nodes) return;
      if (L.next < ctx.currentTime) L.next = ctx.currentTime + 0.02;
      while (L.next - ctx.currentTime < 1.0) {
        scheduleVoices(ctx, state.nodes.sfx, describe(name, { style: state.style }), L.next, { gain: LOOP_GAIN[name] ?? 1 });
        L.next += len;
      }
    };
    L.next = 0; pump(); L.handle = T.set(pump, 250);
  }
  function startLoop(name) {
    if (!LOOP_SFX[name] || state.loops.has(name)) return false;
    state.loops.set(name, { handle: null, next: 0 }); startLoopTimer(name); return true;
  }
  function stopLoop(name) {
    const L = state.loops.get(name); if (!L) return;
    if (L.handle != null) T.clear(L.handle);
    state.loops.delete(name);
  }

  function setMusic(name) {
    const id = resolveMusic(name);
    if (name != null && !id) return false;
    state.musicName = id; stats.music.push(id);
    if (state.musicApi) { if (id == null) state.musicApi.stop(); else state.musicApi.play(id); }
    return true;
  }

  function setSettings(s = {}) {
    if (s.master !== undefined) vol.master = clamp01(s.master, vol.master);
    if (s.sfx !== undefined) vol.sfx = clamp01(s.sfx, vol.sfx);
    if (s.music !== undefined) vol.music = clamp01(s.music, vol.music);
    if (s.mute !== undefined) state.muted = !!s.mute;
    if (typeof s.style === 'string') state.style = s.style === 'retro' ? 'retro' : state.style;
    applyVolumes();
  }

  const api = {
    stats, limits: LIMITS,
    /** Create (once) and resume the AudioContext. Call from a user gesture. */
    resume() {
      if (!state.ctx && Ctor) { try { build(new Ctor()); } catch { return Promise.resolve(false); } }
      if (!state.ctx) return Promise.resolve(false);
      return Promise.resolve(state.ctx.resume ? state.ctx.resume() : undefined).then(() => true, () => false);
    },
    /** Play one SFX name (menu_move, podium, ...). opts: { pan, pitch, gain }. */
    play(name, opts) { return playSfx(name, opts); },
    /** Music by MUSIC name (title, shop, podium, duel_pete, race_<id>) or track id; null stops. */
    setMusic,
    /** Engine drone: speed01 0..1.2 (0 silences), boost adds pitch. Safe to call every frame. */
    engine(speed01, boost = false) {
      const e = state.eng; const s = Number(speed01) || 0;
      if (Math.abs(s - e.speed) < 0.004 && !!boost === e.boost) return;
      e.speed = s; e.boost = !!boost; applyEngine();
    },
    startLoop, stopLoop,
    setSettings,
    setVolume(master, sfx, music) { setSettings({ master, sfx, music }); },
    setMute(on) { setSettings({ mute: on }); },
    get muted() { return state.muted; },
    get volume() { return { ...vol }; },
    get ctx() { return state.ctx; },
    get engineState() { return { speed: state.eng.speed, boost: state.eng.boost, freq: state.eng.freq, level: state.eng.level }; },
    get musicName() { return state.musicName; },
    dispose() {
      unsubs.splice(0).forEach((u) => u && u());
      for (const n of [...state.loops.keys()]) stopLoop(n);
      try { state.eng.osc?.stop(); state.eng.osc2?.stop(); } catch { /* stopped */ }
      state.musicApi?.stop?.();
      if (state.ctx?.close) state.ctx.close().catch?.(() => {});
      state.ctx = null; state.nodes = null; state.musicApi = null;
    },
  };

  if (bus) {
    for (const [type, map] of Object.entries(EVENT_SFX)) unsubs.push(bus.on(type, (p) => { const name = map(p); if (name) playSfx(name); }));
    unsubs.push(bus.on('go', () => startLoop('crowd_loop')));
    unsubs.push(bus.on('raceEnd', () => { stopLoop('crowd_loop'); api.engine(0, false); }));
    unsubs.push(bus.on('pause', (p) => { if (p?.on) { stopLoop('crowd_loop'); api.engine(0, false); } else if (state.musicName?.startsWith('race_') || state.musicName === 'duel_pete') startLoop('crowd_loop'); }));
    unsubs.push(bus.on('sfx', (e) => { if (e && typeof e.name === 'string') playSfx(e.name, e); }));
    unsubs.push(bus.on('music', (e) => setMusic(e ? e.name : null)));
  }
  return api;
}
