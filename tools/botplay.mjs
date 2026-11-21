#!/usr/bin/env node
// Headless bot runner: node tools/botplay.mjs [--track id|all] [--seeds 1..10] [--skill 0.8] [--laps n] [--style retro] [--json]
import { createRace } from '../src/sim/race.js';
import { trackDef } from '../src/levels/tracks.js';
import { createBot } from '../src/sim/autopilot.js';
import { TRACKS, DT } from '../src/core/defs.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const seedSpec = opt('seeds', '1..3');
const seeds = seedSpec.includes('..') ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(seedSpec.split('..').map(Number)) : seedSpec.split(',').map(Number);
const trackSel = opt('track', 'all');
const tracks = trackSel === 'all' ? TRACKS.map((t) => t.id) : trackSel.split(',');
const skill = Number(opt('skill', 0.8));
const lapsOpt = opt('laps', null);
const maxSecFactor = 1.6;
// --style is accepted for contract parity: the sim is style-independent, so it is ignored.

export function runBot(id, seed, { skill = 0.8, laps } = {}) {
  const race = createRace({ track: trackDef(id, seed), seed, laps, player: {}, mode: 'race' });
  const bot = createBot({ skill, seed });
  const nLaps = race.view().laps;
  const limit = (TRACKS.find((t) => t.id === id).length * 10 * 200 * nLaps) / 6000 * maxSecFactor + 30;   // generous: ~6000 u/s average
  let steps = 0, hits = 0, wrecks = 0, wasWreck = false, minHealth = 100;
  while (race.view().phase !== 'finished' && race.t < limit + 4) {
    const v = race.view();
    race.step(bot.act(v));
    steps++;
    for (const e of race.view().events) if (e.type === 'hit' && e.pod === 0) hits++;
    const pw = race.view().player.wreck; if (pw && !wasWreck) wrecks++; wasWreck = pw;
    minHealth = Math.min(minHealth, race.view().player.health);
  }
  const v = race.view(), pl = v.player;
  const done = pl.finishTime != null;
  return { track: id, seed, finished: done, time: pl.finishTime, place: pl.place, laps: nLaps, hits, wrecks, minHealth: Math.round(minHealth), watchdog: bot.stats.watchdog, rolls: bot.stats.rolls, simTime: +race.t.toFixed(1) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = [];
  for (const id of tracks) for (const seed of seeds) rows.push(runBot(id, seed, { skill, laps: lapsOpt ? Number(lapsOpt) : undefined }));
  if (args.includes('--json')) console.log(JSON.stringify(rows));
  else {
    for (const r of rows) console.log(`${r.track.padEnd(9)} seed ${String(r.seed).padStart(2)}  ${r.finished ? 'FINISH ' + r.time.toFixed(1) + 's p' + r.place : 'FAIL (no finish by ' + r.simTime + 's)'}  hits ${r.hits} wrecks ${r.wrecks} minHP ${r.minHealth} wd ${r.watchdog} rolls ${r.rolls}`);
    const fails = rows.filter((r) => !r.finished);
    console.log(`\n${rows.length - fails.length}/${rows.length} finished${fails.length ? '; FAILED: ' + fails.map((f) => f.track + '#' + f.seed).join(' ') : ''}`);
    process.exitCode = fails.length ? 1 : 0;
  }
}
