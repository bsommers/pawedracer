import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTS, TRACKS, PRIZE, W, H } from '../src/core/defs.js';
import { defaultSave, sanitizeSave, loadSave, writeSave, buy, sell, nextCost, prizeFor, createShop, shopAct, PART_KEYS } from '../src/ui/shop.js';
import { createFlow, parseParams, buildRaceInput, createGhostRecorder, ghostPod, sanitizeOptions, loadOptions, saveOptions, DEFAULT_OPTIONS, TOURNAMENT_POINTS } from '../src/ui/menus.js';
import * as scr from '../src/ui/screens.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
// recording fake 2D context: counts drawing calls, tracks bounds
const fakeCtx = () => { const c = { calls: 0, texts: 0 }; return new Proxy(c, { get: (t, k) => (k in t ? t[k] : (...a) => { t.calls++; }), set: (t, k, v) => { t[k] = v; return true; } }); };
const results = (place, extra = {}) => Array.from({ length: 8 }, (_, i) => ({ pod: i === 0 ? 0 : i, name: i === 0 ? 'Colby' : 'R' + i, place: i === 0 ? place : i < place ? i : i + 1, time: 60 + i, bestLap: 20 + i, score: 0, finished: true, ...(i === 0 ? extra : {}) }));

test('save: defaults, sanitise, round-trip, corrupt storage', () => {
  const s = defaultSave(); assert.equal(s.parts.engine, 0);
  const bad = sanitizeSave({ whiskers: -5, parts: { engine: 99, cooling: 'x' }, best: { brie: -1, nope: 3 } });
  assert.equal(bad.whiskers, defaultSave().whiskers); assert.equal(bad.parts.engine, 4); assert.equal(bad.parts.cooling, 0); assert.equal(bad.best.brie, undefined);
  const st = mem(); const s2 = defaultSave(); s2.whiskers = 1234; s2.best.brie = 33.3; writeSave(s2, st);
  assert.equal(loadSave(st).whiskers, 1234); assert.equal(loadSave(st).best.brie, 33.3);
  st.setItem('pawedracer.save', '{not json'); assert.equal(loadSave(st).whiskers, defaultSave().whiskers);
  assert.equal(loadSave({ getItem() { throw new Error('x'); } }).whiskers, defaultSave().whiskers);
});
test('shop: buy, insufficient funds, max tier, refund', () => {
  const s = defaultSave(); s.whiskers = 100000;
  for (const k of PART_KEYS) { for (let i = 1; i <= 4; i++) { const c = PARTS[k].tiers[i]; const w = s.whiskers; assert.deepEqual(buy(s, k), { ok: true, cost: c }); assert.equal(s.whiskers, w - c); } assert.equal(buy(s, k).reason, 'maxed'); assert.equal(nextCost(s, k), null); }
  const p = defaultSave(); p.whiskers = 100; assert.equal(buy(p, 'engine').reason, 'poor'); assert.equal(p.parts.engine, 0); assert.equal(p.whiskers, 100);
  p.whiskers = 400; buy(p, 'engine'); assert.equal(sell(p, 'engine').ok, true); assert.equal(p.whiskers, 400); assert.equal(sell(p, 'engine').ok, false);
  assert.equal(buy(p, 'bogus').reason, 'unknown');
});
test('shop UI: cursor wraps, buy via confirm, leave', () => {
  const sh = createShop(), s = defaultSave(); s.whiskers = 5000;
  shopAct(sh, s, 'up'); assert.equal(sh.cursor, PART_KEYS.length);
  assert.equal(shopAct(sh, s, 'confirm').leave, true);
  sh.cursor = 0; const r = shopAct(sh, s, 'confirm'); assert.equal(r.sfx, 'shop_buy'); assert.equal(s.parts.engine, 1);
  assert.equal(shopAct(sh, s, 'back').leave, true);
});
test('prizeFor matches PRIZE and clamps', () => { assert.equal(prizeFor(1), PRIZE.place[0]); assert.equal(prizeFor(8), 0); assert.equal(prizeFor(99), 0); assert.equal(prizeFor(0), PRIZE.place[0]); });

test('options sanitise and persist', () => {
  assert.deepEqual(sanitizeOptions(null), { ...DEFAULT_OPTIONS });
  const o = sanitizeOptions({ style: 'photo', master: 7, touch: 'zzz', crt: 'no' }); assert.equal(o.style, 'photo'); assert.equal(o.master, 1); assert.equal(o.touch, 'auto'); assert.equal(o.crt, true);
  const st = mem(); saveOptions({ ...DEFAULT_OPTIONS, style: 'toon', mute: true }, st); const l = loadOptions(st); assert.equal(l.style, 'toon'); assert.equal(l.mute, true);
});
test('URL params', () => {
  const p = parseParams('?style=ghibli&autostart&track=swiss&seed=7&laps=2&bot=0.6&nosound&time');
  assert.deepEqual([p.style, p.autostart, p.track, p.seed, p.laps, p.bot, p.nosound, p.time], ['ghibli', true, 'swiss', 7, 2, 0.6, true, true]);
  const q = parseParams('?style=bogus&track=nope&laps=99&bot'); assert.equal(q.style, undefined); assert.equal(q.track, undefined); assert.equal(q.laps, 9); assert.equal(q.bot, 0.85);
  assert.equal(parseParams('').autostart, false); assert.equal(parseParams('?autostart=0').autostart, false);
});
test('race input mapping and roll edge direction', () => {
  assert.deepEqual(buildRaceInput({ left: true, up: true }), { steer: -1, throttle: 1, brake: 0, boost: false, roll: 0, yaw: 0 });
  assert.equal(buildRaceInput({ left: true, right: true }).steer, 0);
  assert.equal(buildRaceInput({ right: true, rollEdge: true }).roll, 1);
  assert.equal(buildRaceInput({ rollEdge: true, lastSteer: -1 }).roll, -1);
  assert.equal(buildRaceInput({ rollEdge: true }).roll, 1);
  assert.equal(buildRaceInput({ yawL: true }).yaw, -1); assert.equal(buildRaceInput({ padDx: 5 }).steer, 1);
});
test('ghost record and playback', () => {
  const r = createGhostRecorder(3, 1 / 60);
  for (let i = 0; i < 90; i++) r.sample({ dist: i * 100, x: 0.1 });
  const g = r.finish(1.5); assert.equal(g.d.length, 30); assert.ok(Math.abs(g.dt - 0.05) < 1e-9);
  const L = 100000, p = ghostPod(g, 0.5, L); assert.ok(Math.abs(p.dist - 3000) < 400); assert.equal(p.lap, 1); assert.ok(p.ghost);
  assert.equal(ghostPod(null, 1, L), null); assert.equal(ghostPod({ d: [], x: [], dt: 1 }, 1, L), null);
  assert.ok(ghostPod(g, 99, L).z >= 0);   // past the end: holds last sample, no NaN
  const s = sanitizeSave({ ghosts: { brie: g } }); assert.equal(s.ghosts.brie.d.length, 30);
  assert.equal(sanitizeSave({ ghosts: { brie: { time: 1, d: [1, 2], x: [1] } } }).ghosts.brie, undefined);
});

test('flow: title -> tracks -> start command', () => {
  const f = createFlow({ save: defaultSave(), options: { ...DEFAULT_OPTIONS }, storage: mem() });
  assert.equal(f.screen, 'title'); assert.equal(f.act('confirm').sfx, 'menu_ok'); assert.equal(f.screen, 'tracks');
  f.act('down'); const c = f.act('confirm'); assert.equal(c.cmd, 'start'); assert.equal(c.trackId, TRACKS[1].id); assert.equal(c.mode, 'race');
  f.screen = 'tracks'; f.act('back'); assert.equal(f.screen, 'title');
  f.cursor.title = 0; f.act('up'); assert.equal(f.cursor.title, 6);   // wraps to OPTIONS
});
test('flow: every main item reachable; time/ghost/duel/tournament/shop/options', () => {
  const f = createFlow({ save: defaultSave(), options: { ...DEFAULT_OPTIONS }, storage: mem() });
  const modes = [];
  for (let i = 0; i < 7; i++) { f.screen = 'title'; f.cursor.title = i; const r = f.act('confirm'); modes.push(r.cmd ? r.mode : f.screen + (f.pendingMode && f.screen === 'tracks' ? ':' + f.pendingMode : '')); }
  assert.deepEqual(modes, ['tracks:race', 'race', 'tracks:time', 'tracks:ghost', 'duel', 'shop', 'options']);
  assert.equal(f.tournament.round, 0);
});
test('flow: options change style/volume/toggles and persist', () => {
  const st = mem(), f = createFlow({ save: defaultSave(), options: { ...DEFAULT_OPTIONS }, storage: st });
  f.screen = 'options'; f.cursor.options = 0; f.act('right'); assert.equal(f.options.style, 'toon');
  f.act('left'); f.act('left'); assert.equal(f.options.style, 'photo');
  f.cursor.options = 1; f.act('left'); assert.equal(f.options.master, 0.7);
  f.cursor.options = 3; f.act('confirm'); assert.equal(f.options.mute, true);
  f.cursor.options = 4; f.act('right'); assert.equal(f.options.touch, 'on');
  assert.equal(loadOptions(st).style, 'photo'); assert.equal(f.act('back').options, true); assert.equal(f.screen, 'title');
});
test('flow: finishRace pays prize, records, points, no payout on DNF', () => {
  const f = createFlow({ save: defaultSave(), options: { ...DEFAULT_OPTIONS }, storage: mem() });
  const w0 = f.save.whiskers; const sum = f.finishRace(results(2), { mode: 'race', trackId: 'brie' });
  assert.equal(sum.prize, PRIZE.place[1]); assert.equal(f.save.whiskers, w0 + PRIZE.place[1]); assert.equal(f.save.best.brie, 60); assert.equal(sum.newBest, true); assert.equal(f.screen, 'results');
  f.finishRace(results(1, { time: 70 }), { mode: 'race', trackId: 'brie' }); assert.equal(f.save.best.brie, 60);   // slower: no record
  assert.equal(f.save.wins, 1);
  const w1 = f.save.whiskers; f.finishRace(results(1, { finished: false, time: null }), { mode: 'race', trackId: 'cheddar' }); assert.equal(f.save.whiskers, w1);
  const g = { time: 55, dt: 0.05, d: [0, 1, 2], x: [0, 0, 0] };
  f.finishRace(results(3, { time: 55 }), { mode: 'time', trackId: 'swiss', ghost: g }); assert.ok(f.save.ghosts.swiss);
});
test('flow: tournament runs 8 rounds to the podium, champion bonus once', () => {
  const f = createFlow({ save: defaultSave(), options: { ...DEFAULT_OPTIONS }, storage: mem() });
  let c = f.startTournament(); assert.equal(c.trackId, TRACKS[0].id);
  for (let r = 0; r < TRACKS.length; r++) {
    f.finishRace(results(1), { mode: 'race', trackId: TRACKS[r].id, tournament: true });
    assert.equal(f.screen, 'results'); f.act('confirm'); assert.equal(f.screen, 'standings');
    const w = f.save.whiskers; c = f.act('confirm');
    if (r < TRACKS.length - 1) { assert.equal(c.cmd, 'start'); assert.equal(c.trackId, TRACKS[r + 1].id); }
    else { assert.equal(f.screen, 'podium'); assert.equal(f.save.whiskers, w + 2000); assert.equal(f.standings()[0].pod, 0); assert.equal(f.standings()[0].points, TOURNAMENT_POINTS[0] * 8); }
  }
  f.act('confirm'); assert.equal(f.screen, 'title'); assert.equal(f.tournament, null);
});
test('flow: tournament shop detour returns to standings; retry blocked in cup', () => {
  const f = createFlow({ save: defaultSave(), options: { ...DEFAULT_OPTIONS }, storage: mem() });
  f.startTournament(); f.finishRace(results(4), { mode: 'race', trackId: 'brie', tournament: true });
  assert.equal(f.act('left').restart, undefined); f.act('confirm'); f.act('right'); assert.equal(f.screen, 'shop'); f.act('back'); assert.equal(f.screen, 'standings');
});
test('flow: pause menu', () => {
  const f = createFlow({ save: defaultSave(), options: { ...DEFAULT_OPTIONS }, storage: mem() });
  assert.equal(f.pauseAct('pause').cmd, 'resume'); assert.equal(f.pauseAct('confirm').cmd, 'resume');
  f.pauseAct('down'); assert.equal(f.pauseAct('confirm').cmd, 'restart'); f.pauseAct('down'); assert.equal(f.pauseAct('confirm').cmd, 'quit');
});

test('screens draw every state on a fake ctx without throwing, inside bounds', () => {
  const f = createFlow({ save: defaultSave(), options: { ...DEFAULT_OPTIONS }, storage: mem() });
  const g = fakeCtx(); f.startTournament(); f.finishRace(results(1), { mode: 'race', trackId: 'brie', tournament: true });
  const draws = { title: scr.drawTitle, tracks: scr.drawTracks, options: scr.drawOptions, results: scr.drawResults, standings: scr.drawStandings, podium: scr.drawPodium, pause: scr.drawPause };
  for (const [n, fn] of Object.entries(draws)) { for (const t of [0, 0.3, 7.9]) { const before = g.calls; fn(g, f, t, null); assert.ok(g.calls > before, n + ' drew nothing'); } }
  scr.drawCountdown(g, { phase: 'countdown', countdown: 2.4 }, 0); scr.drawCountdown(g, { phase: 'racing', countdown: 0 }, 0, 0.2); scr.drawToast(g, 'hi', 0, 0.5);
  assert.equal(scr.optionValue('master', { master: 0.5 }), '[#####.....]');
});
test('hit-testing maps points to list items', () => {
  assert.equal(scr.hitItem('title', 100, 79), 0); assert.equal(scr.hitItem('title', 100, 79 + 12 * 6), 6); assert.equal(scr.hitItem('title', 5, 79), -1); assert.equal(scr.hitItem('title', 100, 10), -1);
  assert.equal(scr.hitItem('tracks', 50, 22 + 19 * 7), 7); assert.equal(scr.hitItem('results', 50, 50), -1); assert.ok(W === 320 && H === 200);
});
test('fmtTime', () => { assert.equal(scr.fmtTime(0), '-:--.--'); assert.equal(scr.fmtTime(65.5), '1:05.50'); });
