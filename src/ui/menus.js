// Menus + flow state machine (owner: ui-shell). Node-safe: no DOM at import time. `createFlow` turns UI actions
// (left|right|up|down|confirm|back|pause) into state changes and returns commands for main.js:
//   { cmd:'start', mode, trackId, laps?, seed } | { cmd:'resume' } | { cmd:'restart' } | { cmd:'quit' } | { cmd:'options' } plus optional sfx name.
import { TRACKS, STYLES, DEFAULT_STYLE, SCORE } from '../core/defs.js';
import { createShop, shopAct, shopTick, prizeFor, writeSave, loadSave } from './shop.js';

export const OPTIONS_KEY = 'pawedracer.options';
export const TOUCH_MODES = Object.freeze(['auto', 'on', 'off']);
export const DEFAULT_OPTIONS = Object.freeze({ style: DEFAULT_STYLE, master: 0.8, sfx: 1, music: 0.7, mute: false, touch: 'auto', crt: true });
export const CHAMP_BONUS = 2000;
export const TOURNAMENT_POINTS = Object.freeze([10, 8, 6, 5, 4, 3, 2, 1]);

const clamp01 = (v, d) => (typeof v === 'number' && isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
export function sanitizeOptions(o) {
  o = o && typeof o === 'object' ? o : {};
  const D = DEFAULT_OPTIONS;
  return { style: STYLES.includes(o.style) ? o.style : D.style, master: clamp01(o.master, D.master), sfx: clamp01(o.sfx, D.sfx), music: clamp01(o.music, D.music),
    mute: typeof o.mute === 'boolean' ? o.mute : D.mute, touch: TOUCH_MODES.includes(o.touch) ? o.touch : D.touch, crt: typeof o.crt === 'boolean' ? o.crt : D.crt };
}
const store = (s) => { if (s) return s; try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };
export function loadOptions(storage) { try { const s = store(storage); return sanitizeOptions(s ? JSON.parse(s.getItem(OPTIONS_KEY)) : null); } catch { return sanitizeOptions(null); } }
export function saveOptions(o, storage) { try { const s = store(storage); if (s) { s.setItem(OPTIONS_KEY, JSON.stringify(sanitizeOptions(o))); return true; } } catch { /* ignore */ } return false; }

export const MAIN_ITEMS = Object.freeze([
  { id: 'race', label: 'QUICK RACE' }, { id: 'tournament', label: 'CHEESE CUP TOURNAMENT' }, { id: 'time', label: 'TIME TRIAL' },
  { id: 'ghost', label: 'GHOST RACE' }, { id: 'duel', label: 'PETE DUEL' }, { id: 'shop', label: 'PAW-TS SHOP' }, { id: 'options', label: 'OPTIONS' },
]);
export const OPTION_ITEMS = Object.freeze(['style', 'master', 'music', 'mute', 'touch', 'crt', 'back']);
const wrap = (i, n, d) => (i + d + n) % n;
const step01 = (v, d) => Math.round(Math.min(1, Math.max(0, v + d * 0.1)) * 10) / 10;

export function createFlow({ save = loadSave(), options = loadOptions(), storage, seed = 1 } = {}) {
  const f = {
    screen: 'title', save, options, seed,
    cursor: { title: 0, tracks: 0, options: 0, pause: 0, results: 0, standings: 0 },
    shop: createShop(), pendingMode: 'race', tournament: null, lastResults: null, paused: false, shopReturn: 'title', t: 0,
  };
  const persist = () => { writeSave(f.save, storage); saveOptions(f.options, storage); };
  const startCmd = (mode, trackId, extra = {}) => ({ cmd: 'start', mode, trackId, seed: f.seed, sfx: 'menu_ok', ...extra });

  f.startTournament = () => { f.tournament = { round: 0, points: Array(8).fill(0), names: Array(8).fill(''), history: [] }; return startCmd('race', TRACKS[0].id, { tournament: true }); };
  f.current = () => (f.tournament ? TRACKS[f.tournament.round] : null);

  /** Race finished (raceEnd results). Applies prize money, records, tournament points. Returns the summary shown on the results screen. */
  f.finishRace = (results, info = {}) => {
    const me = results.find((r) => r.pod === 0) ?? { place: 8, time: null, bestLap: null };
    const solo = info.mode === 'time' || info.mode === 'ghost';
    const prize = solo ? (me.finished === false ? 0 : 100) : (me.finished === false ? 0 : prizeFor(me.place));
    const sum = { results, me, prize, mode: info.mode, trackId: info.trackId, score: SCORE.place[Math.min(7, me.place - 1)] ?? 0, newBest: false, newLap: false, points: 0, win: me.place === 1 && !solo };
    if (me.finished !== false) f.save.whiskers += prize;
    if (me.finished !== false && me.time > 0) {
      const b = f.save.best[info.trackId];
      if (!b || me.time < b) { f.save.best[info.trackId] = me.time; sum.newBest = true; if (info.ghost) f.save.ghosts[info.trackId] = info.ghost; }
    }
    if (me.bestLap > 0 && (!f.save.bestLap[info.trackId] || me.bestLap < f.save.bestLap[info.trackId])) { f.save.bestLap[info.trackId] = me.bestLap; sum.newLap = true; }
    if (sum.win) f.save.wins += 1;
    if (f.tournament && info.tournament) {
      for (const r of results) { f.tournament.points[r.pod] += TOURNAMENT_POINTS[Math.min(7, r.place - 1)] ?? 0; f.tournament.names[r.pod] = r.name; }
      sum.points = TOURNAMENT_POINTS[Math.min(7, me.place - 1)] ?? 0;
      f.tournament.history.push({ track: info.trackId, place: me.place });
    }
    f.lastResults = sum; f.screen = 'results'; persist();
    return sum;
  };
  /** Standings sorted by points (ties: lower pod index first). */
  f.standings = () => (f.tournament ? f.tournament.points.map((p, i) => ({ pod: i, name: f.tournament.names[i] || 'Racer ' + i, points: p })).sort((a, b) => b.points - a.points || a.pod - b.pod) : []);

  function act(a) {
    const sc = f.screen, cur = f.cursor;
    if (sc === 'title') {
      if (a === 'up' || a === 'down') { cur.title = wrap(cur.title, MAIN_ITEMS.length, a === 'up' ? -1 : 1); return { sfx: 'menu_move' }; }
      if (a === 'confirm') {
        const id = MAIN_ITEMS[cur.title].id;
        if (id === 'tournament') return f.startTournament();
        if (id === 'duel') return startCmd('duel', 'gouda');
        if (id === 'shop') { f.screen = 'shop'; f.shopReturn = 'title'; return { sfx: 'menu_ok', music: 'shop' }; }
        if (id === 'options') { f.screen = 'options'; return { sfx: 'menu_ok' }; }
        f.pendingMode = id; f.screen = 'tracks'; return { sfx: 'menu_ok' };
      }
      return {};
    }
    if (sc === 'tracks') {
      if (a === 'up' || a === 'down') { cur.tracks = wrap(cur.tracks, TRACKS.length, a === 'up' ? -1 : 1); return { sfx: 'menu_move' }; }
      if (a === 'left' || a === 'right') { cur.tracks = wrap(cur.tracks, TRACKS.length, a === 'left' ? -4 : 4); return { sfx: 'menu_move' }; }
      if (a === 'confirm') return startCmd(f.pendingMode, TRACKS[cur.tracks].id);
      if (a === 'back') { f.screen = 'title'; return { sfx: 'menu_move' }; }
      return {};
    }
    if (sc === 'options') {
      const key = OPTION_ITEMS[cur.options], o = f.options;
      if (a === 'up' || a === 'down') { cur.options = wrap(cur.options, OPTION_ITEMS.length, a === 'up' ? -1 : 1); return { sfx: 'menu_move' }; }
      if (a === 'back' || (a === 'confirm' && key === 'back')) { f.screen = 'title'; persist(); return { sfx: 'menu_ok', options: true }; }
      const d = a === 'left' ? -1 : a === 'right' || a === 'confirm' ? 1 : 0;
      if (!d) return {};
      if (key === 'style') o.style = STYLES[wrap(STYLES.indexOf(o.style), STYLES.length, d)];
      else if (key === 'master' || key === 'music') o[key] = step01(o[key], d);
      else if (key === 'mute' || key === 'crt') o[key] = !o[key];
      else if (key === 'touch') o.touch = TOUCH_MODES[wrap(TOUCH_MODES.indexOf(o.touch), TOUCH_MODES.length, d)];
      persist();
      return { sfx: 'menu_move', options: true };
    }
    if (sc === 'shop') {
      const r = shopAct(f.shop, f.save, a);
      if (r.changed) persist();
      if (r.leave) { f.screen = f.shopReturn; persist(); return { sfx: r.sfx, music: f.shopReturn === 'title' ? 'title' : undefined, shopDone: f.shopReturn === 'standings' ? true : undefined }; }
      return r;
    }
    if (sc === 'results') {
      if (a === 'confirm') {
        if (f.tournament && f.lastResults.mode !== 'time') { f.screen = 'standings'; return { sfx: 'menu_ok' }; }
        f.screen = 'tracks'; return { sfx: 'menu_ok', music: 'title' };
      }
      if (a === 'back') { f.screen = 'title'; f.tournament = null; return { sfx: 'menu_move', music: 'title' }; }
      if ((a === 'left' || a === 'right') && !f.tournament) return { restart: true };   // retry quickly
      return {};
    }
    if (sc === 'standings') {
      if (a === 'confirm') {
        if (f.tournament.round >= TRACKS.length - 1) { f.screen = 'podium'; f.champBonus = f.standings()[0].pod === 0 ? CHAMP_BONUS : 0; f.save.whiskers += f.champBonus; if (f.champBonus) f.save.wins += 1; persist(); return { sfx: 'podium', music: 'podium' }; }
        f.tournament.round += 1; return startCmd('race', TRACKS[f.tournament.round].id, { tournament: true });
      }
      if (a === 'left' || a === 'right') { f.screen = 'shop'; f.shopReturn = 'standings'; return { sfx: 'menu_ok', music: 'shop' }; }
      if (a === 'back') { f.screen = 'title'; f.tournament = null; return { sfx: 'menu_move', music: 'title' }; }
      return {};
    }
    if (sc === 'podium') {
      if (a === 'confirm' || a === 'back') { f.screen = 'title'; f.tournament = null; return { sfx: 'menu_ok', music: 'title' }; }
      return {};
    }
    return {};
  }
  f.act = act;
  f.tick = (dt) => { f.t += dt; shopTick(f.shop, dt); };
  /** Pause menu (race screens): items resume / restart / options-free quit. */
  f.PAUSE_ITEMS = ['RESUME', 'RESTART', 'QUIT TO TITLE'];
  f.pauseAct = (a) => {
    if (a === 'up' || a === 'down') { f.cursor.pause = wrap(f.cursor.pause, 3, a === 'up' ? -1 : 1); return { sfx: 'menu_move' }; }
    if (a === 'pause' || a === 'back') return { cmd: 'resume' };
    if (a === 'confirm') return [{ cmd: 'resume' }, { cmd: 'restart' }, { cmd: 'quit' }][f.cursor.pause];
    return {};
  };
  f.persist = persist;
  return f;
}

/** Race touch overlay: steer L/R, throttle, boost, roll, pause. Held state is read each frame via `state`. DOM only; returns null without a document. */
export function createRaceTouch({ root = typeof document !== 'undefined' ? document.body : null, onPause, enabled = true } = {}) {
  if (!root || typeof document === 'undefined') return null;
  const el = document.createElement('div');
  el.id = 'racetouch'; el.hidden = true;
  el.innerHTML = '<div class="rt-left"><button data-k="left" aria-label="steer left">&#9664;</button><button data-k="right" aria-label="steer right">&#9654;</button></div>' +
    '<button class="rt-pause" data-k="pause" aria-label="pause">II</button>' +
    '<div class="rt-right"><button data-k="roll" aria-label="barrel roll">ROLL</button><button data-k="boost" aria-label="boost">BOOST</button><button data-k="throttle" aria-label="throttle">GAS</button></div>';
  root.appendChild(el);
  const held = { left: false, right: false, throttle: false, boost: false, roll: false };
  let rollEdge = false, enabledNow = enabled, shown = false;
  for (const b of el.querySelectorAll('button')) {
    const k = b.dataset.k;
    const on = (e) => { e.preventDefault(); if (k === 'pause') { if (onPause) onPause(); return; } if (k === 'roll' && !held.roll) rollEdge = true; held[k] = true; b.classList.add('on'); };
    const off = () => { if (k !== 'pause') held[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, off);
  }
  return {
    el, held,
    setEnabled(v) { enabledNow = !!v; el.hidden = !(shown && enabledNow); },
    setVisible(v) { shown = !!v; el.hidden = !(shown && enabledNow); if (!shown) for (const k of Object.keys(held)) held[k] = false; },
    /** Latched roll edge: true once per press. */
    takeRoll() { const r = rollEdge; rollEdge = false; return r; },
    dispose() { el.remove(); },
  };
}

// ------------------------------------------------------------------ pure helpers (Node-testable) used by main.js
/** URL parameters per ARCHITECTURE 5.9. */
export function parseParams(search = '') {
  const q = new URLSearchParams(String(search).replace(/^\?/, ''));
  const num = (k) => { const v = q.get(k); if (v === null || v === '') return undefined; const n = Number(v); return isFinite(n) ? n : undefined; };
  const flag = (k) => q.has(k) && !['0', 'false', 'off'].includes(q.get(k));
  const style = q.get('style');
  const track = q.get('track');
  const bot = q.has('bot') ? (num('bot') ?? 0.85) : undefined;
  return { style: STYLES.includes(style) ? style : undefined, autostart: flag('autostart'), track: TRACKS.some((t) => t.id === track) ? track : undefined,
    seed: num('seed') !== undefined ? Math.floor(num('seed')) : undefined, laps: num('laps') !== undefined ? Math.min(9, Math.max(1, Math.floor(num('laps')))) : undefined,
    bot: bot === undefined ? undefined : Math.min(1, Math.max(0, bot)), nosound: flag('nosound'), time: flag('time'), touch: q.get('touch') === '1' };
}

/** Held controls -> sim input (ARCHITECTURE 4). `roll` is a one-shot edge supplied by the caller. */
export function buildRaceInput(c) {
  const steer = Math.max(-1, Math.min(1, (c.right ? 1 : 0) - (c.left ? 1 : 0) + (c.padDx || 0)));
  const yaw = (c.yawR ? 1 : 0) - (c.yawL ? 1 : 0);
  return { steer, throttle: c.up ? 1 : 0, brake: c.down ? 1 : 0, boost: !!c.boost, roll: c.rollEdge ? (steer !== 0 ? Math.sign(steer) : c.lastSteer || 1) : 0, yaw };
}

/** Ghost recording: samples (dist, x) every `every` steps. */
export function createGhostRecorder(every = 3, dt = 1 / 60) {
  let n = 0; const d = [], x = [];
  return { sample(pod) { if (n++ % every === 0 && pod) { d.push(Math.round(pod.dist)); x.push(Math.round(pod.x * 1000) / 1000); } },
    finish(time) { return { time, dt: every * dt, d: d.slice(), x: x.slice() }; }, get length() { return d.length; } };
}
/** Pod-shaped ghost at race time t (lap length L), or null once the recording ran out. */
export function ghostPod(ghost, t, L) {
  if (!ghost || !ghost.d || !ghost.d.length) return null;
  const f = t / ghost.dt, i = Math.floor(f);
  if (i < 0) return null;
  const last = ghost.d.length - 1, a = Math.min(i, last), b = Math.min(i + 1, last), k = Math.min(1, f - i);
  const dist = ghost.d[a] + (ghost.d[b] - ghost.d[a]) * k, x = ghost.x[a] + (ghost.x[b] - ghost.x[a]) * k;
  const speed = Math.abs(ghost.d[b] - ghost.d[a]) / ghost.dt;
  return Object.freeze({ id: 99, name: 'Ghost', art: 'pod_colby', isPlayer: false, ghost: true, z: ((dist % L) + L) % L, x, dist, speed, heat: 0, health: 100, boost: Object.freeze({ active: false, charge: 0 }),
    rolling: false, rollDir: 0, steer: 0, stalled: false, wreck: false, lap: Math.floor(dist / L) + 1, place: 9, finishTime: null, score: 0 });
}
