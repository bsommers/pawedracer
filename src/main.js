// Pawed Racer entry (owner: ui-shell): game loop, input, screens, race driving, ghost, audio/renderer wiring, URL params, window.__pawed.
// Every module another agent owns is loaded through a guarded dynamic import and has a fallback, so a missing file never blanks the game.
import { W, H, HI_SCALE, DT, TRACKS, ROAD, INPUT_KEYS, STYLES } from './core/defs.js';
import { createBus } from './core/events.js';
import { createInput } from './core/input.js';
import { createRace } from './sim/race.js';
import { trackDef } from './levels/tracks.js';
import { aiInput } from './sim/ai.js';
import { createTouch, isTouchDevice } from './ui/touch.js';
import { createFlow, createRaceTouch, parseParams, buildRaceInput, createGhostRecorder, ghostPod } from './ui/menus.js';
import { drawTitle, drawTracks, drawOptions, drawResults, drawStandings, drawPodium, drawPause, drawToast, hitItem } from './ui/screens.js';
import { drawShop } from './ui/shop.js';
import { drawText } from './ui/font.js';
import { createCRT } from './render/crt.js';

const tryImport = async (p) => { try { return await import(p); } catch { return null; } };
const params = parseParams(typeof location !== 'undefined' ? location.search : '');
const out = document.getElementById('game'), octx = out.getContext('2d');
const view = document.createElement('canvas'), vctx = view.getContext('2d');   // logical canvas: 320x200 retro, 1280x800 hi-res
const flow = createFlow({ seed: params.seed ?? 1 });
if (params.style) flow.options.style = params.style;
if (params.touch) flow.options.touch = 'on';
const bus = createBus();
const keys = new Set();
const G = { race: null, trackId: null, mode: null, tournament: false, laps: undefined, seed: 1, rec: null, ghost: null, paused: false, acc: 0, goT: 99, wasRacing: false,
  radio: null, flash: null, toast: '', toastT: -9, t: 0, rollEdge: false, lastSteer: 0, botSkill: params.bot, bot: null, L: 1, attract: null, music: null };
let renderer = null, audio = null, botMod = null, crt = null, art = null, lastNow = 0, touchMenu = null, touchRace = null;

// ---------------------------------------------------------------- canvas / style
const isHi = () => flow.options.style !== 'retro';
function layout() {
  const hi = isHi(), sc = hi ? HI_SCALE : 1;
  if (view.width !== W * sc) { view.width = W * sc; view.height = H * sc; }
  const dpr = window.devicePixelRatio || 1, cssW = Math.min(window.innerWidth, window.innerHeight * 1.6);
  const s = hi ? 0 : Math.max(1, Math.floor((cssW * dpr) / W));
  const ow = hi ? W * HI_SCALE : W * s, oh = hi ? H * HI_SCALE : H * s;
  if (out.width !== ow) { out.width = ow; out.height = oh; }
  out.classList.toggle('pix', !hi);
  G.outScale = hi ? 1 : s;
  if (renderer && renderer.resize) renderer.resize();
}
async function applyStyle(id, silent) {
  flow.options.style = id; layout();
  if (renderer && renderer.setStyle) { try { await renderer.setStyle(id); } catch { /* keep going on the old pack */ } }
  if (audio && audio.setSettings) audio.setSettings({ style: id === 'retro' ? 'retro' : 'ghibli' });
  if (!silent) { G.toast = 'STYLE: ' + id.toUpperCase(); G.toastT = G.t; flow.persist(); }
}
const cycleStyle = () => applyStyle(STYLES[(STYLES.indexOf(flow.options.style) + 1) % STYLES.length]);
function applyOptions() {
  const o = flow.options;
  if (audio && audio.setSettings) audio.setSettings({ master: o.master, sfx: o.sfx, music: o.music, mute: o.mute });
  const on = o.touch === 'on' || (o.touch === 'auto' && isTouchDevice());
  G.touchOn = on;
  if (touchRace) touchRace.setEnabled(on);
  if (o.style !== (renderer && renderer.style)) applyStyle(o.style, true);
}
const sfx = (n) => { if (n && audio && audio.play) { try { audio.play(n); } catch { /* audio is optional */ } } };
function music(n) { if (!n || n === G.music) return; G.music = n; if (audio && audio.music) { try { audio.music(n); } catch { /* optional */ } } }

// ---------------------------------------------------------------- races
function newRace({ mode, trackId, seed, laps, tournament, bot }, b) {
  const def = trackDef(trackId, seed);
  const simMode = mode === 'time' || mode === 'ghost' ? 'time' : mode === 'duel' ? 'duel' : 'race';
  const race = createRace({ track: def, seed, laps: laps ?? (simMode === 'duel' ? 3 : undefined), player: { parts: flow.save.parts, pilot: 'colby' }, mode: simMode, bus: b });
  return { race, def, L: def.segments.length * ROAD.segLen };
}
function startRace(cmd) {
  const seed = cmd.seed ?? flow.seed ?? 1;
  const { race, L } = newRace({ ...cmd, seed, laps: cmd.laps ?? G.laps }, bus);
  Object.assign(G, { race, L, trackId: cmd.trackId, mode: cmd.mode, tournament: !!cmd.tournament, seed, acc: 0, goT: 99, wasRacing: false, radio: null, flash: null,
    paused: false, rec: createGhostRecorder(3, DT), ghost: cmd.mode === 'ghost' ? flow.save.ghosts[cmd.trackId] ?? null : null, laps: undefined, rollEdge: false });
  G.bot = G.botSkill !== undefined && botMod ? botMod.createBot({ skill: G.botSkill, seed, lapLength: L }) : null;
  flow.screen = 'race';
  music(cmd.mode === 'duel' ? 'duel_pete' : 'race_' + cmd.trackId);
  if (touchRace) touchRace.setVisible(true);
  if (touchMenu) touchMenu.el.hidden = true;
}
const lastCmd = () => ({ mode: G.mode, trackId: G.trackId, seed: G.seed, tournament: G.tournament });
function leaveRace(screen = 'title') {
  G.race = null; G.paused = false; flow.screen = screen; if (touchRace) touchRace.setVisible(false); music('title');
  if (audio && audio.engine) audio.engine(0, false);
}
bus.on('raceEnd', ({ results }) => {
  if (flow.screen !== 'race') return;
  let ghost = null;
  const me = results.find((r) => r.pod === 0);
  if ((G.mode === 'time' || G.mode === 'ghost') && me && me.time > 0 && G.rec) ghost = G.rec.finish(me.time);
  else if (G.rec && me && me.time > 0) ghost = null;
  flow.finishRace(results, { mode: G.mode, trackId: G.trackId, tournament: G.tournament, ghost });
  if (touchRace) touchRace.setVisible(false);
  if (touchMenu) touchMenu.el.hidden = !G.touchOn;
  G.race = null; music('podium'); sfx('podium');
});
bus.on('peteTaunt', (p) => { G.radio = { who: 'pete', text: p.text, mood: p.mood === 'laugh' ? 1 : 0, until: G.t + 3.6 }; });
bus.on('finalLap', () => { G.flash = { text: 'FINAL LAP!', color: '#ff4a3a', until: G.t + 2 }; G.radio = { who: 'mouse_a', text: 'Final lap! Hold onto your whiskers!', mood: 0, until: G.t + 3 }; });
bus.on('lap', (p) => { if (p.pod === 0 && G.race) { G.flash = { text: 'LAP ' + Math.min(p.lap, G.race.view().laps), color: '#ffd23a', until: G.t + 1.2 }; } });
bus.on('go', () => { G.goT = 0; });

function pollInput(pad) {
  const held = (names) => names.some((c) => keys.has(c));
  const tr = touchRace ? touchRace.held : {};
  const c = { left: held(INPUT_KEYS.left) || tr.left, right: held(INPUT_KEYS.right) || tr.right, up: held(INPUT_KEYS.throttle) || tr.throttle || pad.dy < 0, down: held(INPUT_KEYS.brake) || pad.dy > 0,
    boost: held(INPUT_KEYS.boost) || tr.boost || (pad.device === 'pad' && pad.jump), yawL: held(INPUT_KEYS.yawL), yawR: held(INPUT_KEYS.yawR), padDx: pad.device === 'pad' ? pad.dx : 0,
    rollEdge: G.rollEdge || (touchRace ? touchRace.takeRoll() : false), lastSteer: G.lastSteer };
  const inp = buildRaceInput(c);
  if (inp.steer) G.lastSteer = Math.sign(inp.steer);
  G.rollEdge = false;
  return inp;
}
function botInput(race, b) {
  if (b) return b.act(race.view());
  const pd = race.sim.pods[0];
  return aiInput(race.sim, { ...pd, skill: 0.85 }, {});
}
function stepRace(race, inp) {
  race.step(inp);
  if (G.rec && race === G.race) { const v = race.view(); if (v.phase === 'racing') G.rec.sample(v.player); }
}

// ---------------------------------------------------------------- attract mode (title background, bot-driven, silent)
function attractStart() {
  const idx = ((G.attract ? G.attract.n : -1) + 1) % TRACKS.length, tid = TRACKS[idx].id;
  const { race, L } = newRace({ mode: 'race', trackId: tid, seed: 1 + idx }, null);
  G.attract = { race, n: idx, L, bot: botMod ? botMod.createBot({ skill: 0.85, seed: 1 + idx, lapLength: L }) : null, t: 0 };
}
function attractUpdate(dt) {
  if (!G.attract) attractStart();
  const A = G.attract; A.acc = (A.acc || 0) + dt;
  while (A.acc >= DT) { A.acc -= DT; try { A.race.step(botInput(A.race, A.bot)); } catch { attractStart(); return; } A.t += DT; }
  const v = A.race.view();
  if (A.t > 40 || v.phase === 'finished') attractStart();
}

// ---------------------------------------------------------------- frame
function update(dt, padRaw) {
  G.t += dt; flow.tick(dt);
  const pad = padRaw;
  if (flow.screen === 'race' && G.race && !G.paused) {
    G.acc += dt;
    const inp = G.botSkill !== undefined ? null : pollInput(pad);
    let k = 0;
    while (G.acc >= DT && G.race && flow.screen === 'race') {
      G.acc -= DT;
      const race = G.race, frame = inp ? { ...inp, roll: k === 0 ? inp.roll : 0 } : botInput(race, G.bot);
      stepRace(race, frame); k++;
    }
    if (G.race) {
      const v = G.race.view();
      if (v.phase === 'racing') G.goT += dt;
      if (audio && audio.engine) audio.engine(Math.min(1.2, v.player.speed / 12000), !!v.player.boost.active);
    }
  } else if (flow.screen === 'title') attractUpdate(dt);
  if (flow.screen !== 'race' && audio && audio.engine) audio.engine(0, false);
}

function drawRaceFrame() {
  const race = G.race; if (!race) return;
  let v = race.view();
  if (G.ghost) { const gp = ghostPod(G.ghost, v.t, G.L); if (gp) v = { ...v, pods: [...v.pods, gp] }; }
  const ui = { radio: G.radio && G.radio.until > G.t ? G.radio : null, flash: G.flash && G.flash.until > G.t ? G.flash : null };
  if (renderer) renderer.draw(v, G.t, ui);
  else { vctx.setTransform(view.width / W, 0, 0, view.width / W, 0, 0); vctx.fillStyle = '#0a0710'; vctx.fillRect(0, 0, W, H); drawText(vctx, 'renderer loading...', W / 2, H / 2, { align: 'center', color: '#ffd23a' }); }
}
function render() {
  const sc = view.width / W;
  const sn = flow.screen;
  if (sn === 'race') drawRaceFrame();
  else if (sn === 'title' && G.attract && renderer) renderer.draw(G.attract.race.view(), G.attract.t, { hidden: true });
  vctx.setTransform(sc, 0, 0, sc, 0, 0);
  if ('imageSmoothingEnabled' in vctx) vctx.imageSmoothingEnabled = isHi();
  const a = renderer && renderer.art ? renderer.art : art;
  if (sn === 'title') { if (!renderer) { vctx.fillStyle = '#0a0710'; vctx.fillRect(0, 0, W, H); } drawTitle(vctx, flow, G.t, a); }
  else if (sn === 'tracks') drawTracks(vctx, flow, G.t, a);
  else if (sn === 'options') drawOptions(vctx, flow, G.t);
  else if (sn === 'shop') drawShop(vctx, flow.shop, flow.save, G.t, a);
  else if (sn === 'results') drawResults(vctx, flow, G.t, a);
  else if (sn === 'standings') drawStandings(vctx, flow, G.t);
  else if (sn === 'podium') drawPodium(vctx, flow, G.t, a);
  else if (sn === 'race' && G.paused) drawPause(vctx, flow, G.t);
  drawToast(vctx, G.toast, G.toastT, G.t);
  vctx.setTransform(1, 0, 0, 1, 0, 0);
  // present: integer upscale for retro (crisp pixels), then the CRT pass on the output canvas
  octx.imageSmoothingEnabled = isHi();
  octx.drawImage(view, 0, 0, out.width, out.height);
  if (!isHi() && flow.options.crt && crt && G.outScale >= 2) crt.apply(octx, { ox: 0, oy: 0, s: G.outScale, w: out.width, h: out.height }, G.t);
}
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000)); lastNow = now;
  const p = input.poll();
  try { update(dt, { dx: p.dx, dy: p.dy, jump: p.jump, device: input.device }); render(); } catch (e) { if (!G.errT || now - G.errT > 2000) { console.error(e); G.errT = now; } }
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- actions
function togglePause(on = !G.paused) {
  if (flow.screen !== 'race' || !G.race) return;
  const v = G.race.view(); if (v.phase === 'finished') return;
  G.paused = on; if (on) flow.cursor.pause = 0;
  bus.emit('pause', { on });
}
function runCmd(r) {
  if (!r) return;
  for (const c of Array.isArray(r) ? r : [r]) {
    if (c.sfx) sfx(c.sfx);
    if (c.music) music(c.music);
    if (c.options) applyOptions();
    if (c.restart && flow.screen === 'results') { startRace(lastCmd()); continue; }
    if (c.cmd === 'start') {
      if (c.mode === 'ghost' && !flow.save.ghosts[c.trackId]) { G.toast = 'SET A TIME TRIAL FIRST!'; G.toastT = G.t; sfx('menu_move'); continue; }
      startRace(c);
    } else if (c.cmd === 'resume') togglePause(false);
    else if (c.cmd === 'restart') startRace(lastCmd());
    else if (c.cmd === 'quit') { leaveRace('title'); flow.tournament = null; }
    if (flow.screen === 'title' || flow.screen === 'tracks') { if (touchMenu) touchMenu.el.hidden = !G.touchOn; }
  }
}
function onAct(e) {
  if (audio && audio.unlock) audio.unlock();
  const a = e.act;
  if (a === 'mute') { flow.options.mute = !flow.options.mute; applyOptions(); flow.persist(); G.toast = flow.options.mute ? 'MUTED' : 'SOUND ON'; G.toastT = G.t; return; }
  if (a === 'fullscreen') { try { document.fullscreenElement ? document.exitFullscreen() : out.requestFullscreen(); } catch { /* unsupported */ } return; }
  if (flow.screen === 'race') {
    if (G.paused) runCmd(flow.pauseAct(a));
    else if (a === 'pause' || a === 'back') togglePause(true);
    return;
  }
  if (!['left', 'right', 'up', 'down', 'confirm', 'back', 'pause'].includes(a)) return;
  runCmd(flow.act(a === 'pause' ? 'back' : a));
  if (flow.screen !== 'race' && touchMenu) touchMenu.el.hidden = !G.touchOn;
}

const input = createInput({ target: window });
input.on(onAct);
window.addEventListener('keydown', (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  keys.add(ev.code);
  if (ev.code === 'Space' || ev.code.startsWith('Arrow')) ev.preventDefault();
  if (flow.screen === 'race' && !G.paused && INPUT_KEYS.roll.includes(ev.code) && !ev.repeat) G.rollEdge = true;
  if (INPUT_KEYS.style.includes(ev.code) && !ev.repeat) cycleStyle();
  if (audio && audio.unlock) audio.unlock();
});
window.addEventListener('keyup', (ev) => keys.delete(ev.code));
window.addEventListener('blur', () => { keys.clear(); if (flow.screen === 'race') togglePause(true); });
document.addEventListener('visibilitychange', () => { if (document.hidden && flow.screen === 'race') togglePause(true); });
window.addEventListener('resize', layout);
out.addEventListener('pointerdown', (e) => {
  if (audio && audio.unlock) audio.unlock();
  const r = out.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
  const sn = flow.screen === 'race' && G.paused ? 'pause' : flow.screen;
  const i = hitItem(sn, x, y);
  if (i >= 0) {
    if (sn === 'title') flow.cursor.title = i; else if (sn === 'tracks') flow.cursor.tracks = i; else if (sn === 'options') flow.cursor.options = i;
    else if (sn === 'shop') flow.shop.cursor = i; else if (sn === 'pause') flow.cursor.pause = i;
    onAct({ act: 'confirm' });
  } else if (['results', 'standings', 'podium'].includes(sn)) onAct({ act: 'confirm' });
});

// ---------------------------------------------------------------- boot
async function boot() {
  layout();
  const rmod = await tryImport('./render/renderer.js');
  if (rmod && rmod.createRenderer) { try { renderer = rmod.createRenderer(vctx, { style: flow.options.style }); } catch (e) { console.warn('renderer failed', e); } }
  if (!renderer) { const reg = await tryImport('./art/registry.js'); if (reg && reg.buildArt) { try { art = await reg.buildArt({ style: flow.options.style }); } catch { /* fallback sprites */ } } }
  botMod = await tryImport('./sim/autopilot.js');
  crt = createCRT((w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; });
  if (!params.nosound) {
    const am = await tryImport('./audio/audio.js');
    if (am && am.createAudio) { try { audio = am.createAudio(bus, { ...flow.options, style: flow.options.style === 'retro' ? 'retro' : 'ghibli' }); } catch (e) { console.warn('audio failed', e); } }
  }
  touchMenu = createTouch({ input, onStyle: cycleStyle, onPause: () => input.act('pause'), enabled: true });
  touchRace = createRaceTouch({ onPause: () => input.act('pause'), enabled: true });
  applyOptions();
  touchMenu.el.hidden = !G.touchOn;
  music('title');
  if (params.autostart || params.track || params.bot !== undefined) {
    const mode = params.time ? 'time' : 'race';
    startRace({ mode, trackId: params.track ?? 'brie', seed: params.seed ?? 1, laps: params.laps });
  }
  lastNow = performance.now();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- debug handle (ARCHITECTURE 5.9)
window.__pawed = {
  params, flow, G, bus, input, keys,
  get race() { return G.race; }, get screen() { return flow.screen; }, get renderer() { return renderer; }, get audio() { return audio; },
  view: () => (G.race ? G.race.view() : null), hash: () => (G.race ? G.race.hash() : null),
  act: (a) => onAct({ act: a }), start: (cmd) => startRace({ mode: 'race', trackId: 'brie', seed: 1, ...cmd }),
  advance(n = 1, inp) { let c = 0; while (c < n && G.race) { stepRace(G.race, inp ?? (G.botSkill !== undefined ? botInput(G.race, G.bot) : { steer: 0, throttle: 1, brake: 0, boost: false, roll: 0, yaw: 0 })); c++; } return c; },
  setStyle: applyStyle, cycleStyle, pause: togglePause, toTitle: () => leaveRace('title'),
};
boot();
