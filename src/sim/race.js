// Race sim (ARCHITECTURE 4, 5.1-5.4): fixed-step, deterministic, bus events. createRace(opts) -> race.
import { POD, RACE, HAZARDS, PICKUPS, DT, ROAD } from '../core/defs.js';
import { createRng } from '../core/rng.js';
import { stepPod, makePod, damagePod, partsEnv, hazardX, overlaps, wrapDz, clamp } from './pod-physics.js';
import { aiInput, rubberBand } from './ai.js';
import { updatePete, peteState, taunt } from './pete.js';

const ROSTER = [
  { name: 'Colby', art: 'pod_colby', skill: 0 },
  { name: 'Perring Parkway Pete', art: 'pod_pete', skill: 0.92 },
  { name: 'Gouda Gary', art: 'pod_r1', skill: 0.78 }, { name: 'Brie Barbara', art: 'pod_r2', skill: 0.7 },
  { name: 'Colby Jack', art: 'pod_r3', skill: 0.64 }, { name: 'Feta Fred', art: 'pod_r4', skill: 0.58 },
  { name: 'Stilton Sue', art: 'pod_r5', skill: 0.52 }, { name: 'Muenster Mo', art: 'pod_r1', skill: 0.46 },
];
const NOINPUT = Object.freeze({ steer: 0, throttle: 0, brake: 0, boost: false, roll: 0, yaw: 0 });

export function createRace({ track, seed = 1, laps, player = {}, mode = 'race', bus } = {}) {
  const segs = track.segments, L = segs.length * ROAD.segLen;
  const rng = createRng(seed);
  const nLaps = laps ?? track.laps ?? RACE.laps;
  const emitRaw = (type, payload = {}) => { sim.events.push({ type, ...payload }); bus?.emit(type, payload); };
  const count = mode === 'time' ? 1 : mode === 'duel' ? 2 : Math.min(RACE.racers, ROSTER.length);
  const objects = (track.objects ?? []).slice().sort((a, b) => a.z - b.z);

  const pods = [];
  for (let i = 0; i < count; i++) {
    const r = ROSTER[i], row = i >> 1;
    const pr = createRng(seed * 7919 + i * 104729);
    const p = makePod({ dist: -(300 + row * 520), x: i % 2 ? 0.4 : -0.4 });
    p.health = POD.healthMax;
    pods.push({ id: i, name: r.name, art: r.art, isPlayer: i === 0, isPete: i === 1 && mode !== 'time', skill: r.skill, p,
      env: i === 0 ? partsEnv(player.parts) : {}, lane: pr.range(-0.3, 0.3), lap: 1, laps: [], lapStart: 0, finished: false, finishTime: null,
      place: i + 1, score: 0, passes: 0, bumpCd: new Map() });
  }
  const sim = {
    t: 0, L, laps: nLaps, track, seed, rng, pods, events: [], phase: 'countdown', countdown: RACE.countdown, dyn: [], collected: new Set(),
    pete: mode === 'time' ? null : peteState(), bestLap: null, finishOrder: [], endTimer: null, ended: false, lastN: 0, mode,
    emit: emitRaw,
    segmentAt(z) { const i = Math.floor((((z % L) + L) % L) / ROAD.segLen) % segs.length; return segs[i]; },
    zLap: (p) => ((p.dist % L) + L) % L,
    lapOf: (p) => clamp(Math.floor(p.dist / L) + 1, 1, nLaps),
    allObjects() { return sim._all; },
    dropMine(owner, z, x) {
      const zl = ((z % L) + L) % L;
      sim.dyn.push({ z: zl, x, kind: 'mine', owner: owner.id, born: sim.t });
      sim._all = objects.concat(sim.dyn);
      emitRaw('peteDrop', { z: zl, x });
    },
  };
  sim._all = objects.concat(sim.dyn);
  const rebuildAll = () => { sim._all = objects.concat(sim.dyn); };
  const prevPlace = pods.map((p) => p.place);

  function computePlaces() {
    const order = pods.slice().sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime || a.id - b.id;
      if (a.finished) return -1; if (b.finished) return 1;
      return b.p.dist - a.p.dist || a.id - b.id;
    });
    order.forEach((pd, i) => { pd.place = i + 1; });
  }
  computePlaces();
  pods.forEach((pd, i) => { prevPlace[i] = pd.place; });

  function hurt(pd, kind, dmg, extra = {}) {
    const taken = damagePod(pd.p, dmg, POD, pd.env);
    if (taken > 0 || pd.p.invuln <= 0) { emitRaw('hit', { pod: pd.id, kind, damage: taken }); }
    if (pd.isPete && sim.pete && sim.pete.tauntCd <= 0 && taken > 0) taunt(sim, 'hit');
    return taken;
  }

  function interact(pd) {
    const p = pd.p; if (p.wreck) return;
    const zl = sim.zLap(p), lap = Math.floor(p.dist / L);
    const all = sim._all;
    for (let i = 0; i < all.length; i++) {
      const o = all[i];
      if (Math.abs(wrapDz(o.z, zl, L)) > POD.collisionZ + 200) continue;
      if (PICKUPS[o.kind]) {
        const key = i < objects.length ? `${i}:${lap}:${pd.id}` : null;
        if (!key || sim.collected.has(key)) continue;
        if (!overlaps({ ...o, kind: 'coin' }, zl, p.x, sim.t, L, 0.12)) continue;
        sim.collected.add(key);
        const k = PICKUPS[o.kind];
        if (k.boost) p.boost.charge = Math.min(1, p.boost.charge + k.boost);
        if (k.repair) { const before = p.health; p.health = Math.min(POD.healthMax, p.health + k.repair); emitRaw('repair', { pod: pd.id, amount: p.health - before }); }
        if (k.score) pd.score += k.score;
        emitRaw('pickup', { pod: pd.id, kind: o.kind });
        continue;
      }
      const h = HAZARDS[o.kind]; if (!h) continue;
      if (o.kind === 'mine' && (o.owner === pd.id || o.dead)) continue;
      if (p.hitCd > 0 || p.invuln > 0) continue;
      if (!overlaps(o, zl, p.x, sim.t, L)) continue;
      p.hitCd = 0.6;
      if (o.kind === 'stink') continue;
      if (o.kind === 'fondue') p.heat = Math.min(1, p.heat + 0.3);
      if (o.kind === 'mine') o.dead = true;
      p.speed *= h.solid ? POD.hitSlow : 0.85;
      hurt(pd, o.kind, h.damage);
    }
    if (sim.dyn.length) {
      const n = sim.dyn.length;
      sim.dyn = sim.dyn.filter((m) => !m.dead && sim.t - m.born < 30);
      if (sim.dyn.length !== n) rebuildAll();
    }
  }

  function bump() {
    for (let i = 0; i < pods.length; i++) for (let j = i + 1; j < pods.length; j++) {
      const a = pods[i], b = pods[j];
      if (a.p.wreck || b.p.wreck) continue;
      const dz = a.p.dist - b.p.dist, dx = a.p.x - b.p.x;
      if (Math.abs(dz) > POD.collisionZ || Math.abs(dx) > POD.collisionX * 2) continue;
      const key = j; const cd = a.bumpCd.get(key) ?? 0;
      if (cd > sim.t) continue;
      a.bumpCd.set(key, sim.t + 0.4);
      const win = a.p.speed >= b.p.speed ? a : b, lose = win === a ? b : a;
      const overlap = POD.collisionX * 2 - Math.abs(dx);
      const dir = dx === 0 ? (a.id < b.id ? 1 : -1) : Math.sign(dx);
      const aSide = dir, shoveW = overlap * 0.3, shoveL = overlap * 0.7;
      const side = win === a ? aSide : -aSide;       // direction the winner is on relative to the loser
      win.p.x += side * shoveW; lose.p.x -= side * shoveL;
      lose.p.speed *= 0.85; win.p.speed *= 0.97;
      hurt(lose, 'pod', POD.podHitDamage); hurt(win, 'pod', POD.podHitDamage * 0.4);
    }
  }

  function step(input = NOINPUT, dt = DT) {
    sim.events.length = 0;
    if (sim.phase === 'countdown') {
      sim.countdown -= dt;
      const n = Math.ceil(sim.countdown - 1e-9);
      if (sim.countdown > 0 && n !== sim.lastN && n >= 1) { sim.lastN = n; emitRaw('countdown', { n }); }
      if (sim.countdown <= 0) { sim.phase = 'racing'; emitRaw('go', {}); }
      return;
    }
    sim.t += dt;
    const player = pods[0].p;
    for (const pd of pods) {
      const p = pd.p;
      let inp;
      if (pd.isPlayer) inp = pd.finished ? { ...NOINPUT, throttle: 0.4 } : input;
      else {
        inp = pd.isPete ? updatePete(sim, pd, dt) : aiInput(sim, pd);
        if (pd.finished) inp = { ...inp, boost: false, throttle: Math.min(inp.throttle, 0.5) };
      }
      const seg = sim.segmentAt(p.dist);
      const env = { ...pd.env, curve: seg.curve };
      if (!pd.isPlayer) {
        const rb = rubberBand(p, player), sk = 0.92 + 0.08 * pd.skill;
        env.maxSpeedMul = rb * sk; env.accelMul = rb * sk;
      }
      const evs = stepPod(p, inp, dt, POD, env);
      for (const e of evs) {
        if (e.type === 'scrape') { emitRaw('scrape', { pod: pd.id }); emitRaw('hit', { pod: pd.id, kind: 'wall', damage: e.damage }); }
        else if (e.type === 'respawn') { /* silent; view.wreck flips false */ }
        else emitRaw(e.type, { pod: pd.id });
      }
      if (p.wreck && !pd._wrecked) { pd._wrecked = true; }
      if (!p.wreck) pd._wrecked = false;
      interact(pd);
      if (p.health <= 0 && !pd._wreckSent) { pd._wreckSent = true; }
      if (!p.wreck) pd._wreckSent = false;
      // laps
      if (!pd.finished) {
        const done = Math.floor(p.dist / L);
        if (done >= nLaps) {
          pd.finished = true; pd.finishTime = sim.t; pd.lap = nLaps;
          pd.laps.push(sim.t - pd.lapStart); sim.finishOrder.push(pd.id);
          if (pd.isPlayer) { const lt = pd.laps[pd.laps.length - 1]; if (sim.bestLap == null || lt < sim.bestLap) sim.bestLap = lt; }
          emitRaw('finish', { pod: pd.id, place: sim.finishOrder.length, time: sim.t });
        } else if (done + 1 > pd.lap && done >= 1) {
          const lt = sim.t - pd.lapStart; pd.laps.push(lt); pd.lapStart = sim.t; pd.lap = done + 1;
          if (pd.isPlayer && (sim.bestLap == null || lt < sim.bestLap)) sim.bestLap = lt;
          emitRaw('lap', { pod: pd.id, lap: pd.lap, time: lt });
          if (pd.isPlayer && pd.lap === nLaps) emitRaw('finalLap', {});
        }
      }
    }
    bump();
    // places, passes
    computePlaces();
    for (const a of pods) for (const b of pods) {
      if (a === b) continue;
      if (prevPlace[a.id] > prevPlace[b.id] && a.place < b.place) {
        a.passes++; emitRaw('pass', { pod: a.id, over: b.id });
        if (b.isPlayer && a.isPete && sim.pete && sim.pete.tauntCd <= 0) taunt(sim, 'passed');
      }
    }
    for (const pd of pods) { if (pd.isPlayer && pd.place !== prevPlace[pd.id]) emitRaw('place', { pod: pd.id, place: pd.place }); prevPlace[pd.id] = pd.place; }
    // end of race
    if (pods[0].finished && sim.phase === 'racing') {
      sim.phase = 'finished'; sim.endTimer = 6;
      if (sim.pete && pods[1]?.isPete) taunt(sim, pods[1].place < pods[0].place ? 'win' : 'lose');
    }
    if (sim.phase === 'finished' && !sim.ended) {
      sim.endTimer -= dt;
      if (sim.endTimer <= 0 || pods.every((p) => p.finished)) {
        sim.ended = true;
        emitRaw('raceEnd', { results: results() });
      }
    }
  }

  function results() {
    return pods.slice().sort((a, b) => a.place - b.place).map((pd) => ({ pod: pd.id, name: pd.name, place: pd.place,
      time: pd.finishTime, bestLap: pd.laps.length ? Math.min(...pd.laps) : null, score: pd.score, finished: pd.finished }));
  }

  function view() {
    const pv = pods.map((pd) => Object.freeze({ id: pd.id, name: pd.name, art: pd.art, isPlayer: pd.isPlayer, z: sim.zLap(pd.p), x: pd.p.x, dist: pd.p.dist, speed: pd.p.speed,
      heat: pd.p.heat, health: pd.p.health, boost: Object.freeze({ active: pd.p.boost.active, charge: pd.p.boost.charge }), rolling: pd.p.rollT > 0,
      rollDir: pd.p.rollDir, steer: pd.p.steerVis, stalled: pd.p.stallT > 0, wreck: pd.p.wreck, lap: pd.finished ? nLaps : pd.lap, place: pd.place, finishTime: pd.finishTime, score: pd.score }));
    const lap = Math.floor(pods[0].p.dist / L);
    const objs = sim._all.map((o, i) => {
      const h = HAZARDS[o.kind], pk = PICKUPS[o.kind];
      const active = pk ? !sim.collected.has(`${i}:${lap}:0`) : !o.dead;
      return Object.freeze({ z: o.z, x: hazardX(o, sim.t), kind: o.kind, art: (h ?? pk)?.art ?? o.kind, frame: Math.floor(sim.t * 6) % 2, active });
    });
    return Object.freeze({ t: sim.t, phase: sim.phase, countdown: Math.max(0, sim.countdown), lap: pv[0].lap, laps: nLaps, place: pv[0].place, pods: Object.freeze(pv),
      player: pv[0], objects: Object.freeze(objs), segmentAt: sim.segmentAt, events: Object.freeze(sim.events.slice()), bestLap: sim.bestLap,
      track: Object.freeze({ id: track.id, theme: track.theme, biome: track.biome }) });
  }

  function hash() {   // FNV-1a over quantised state, for determinism tests
    let h = 2166136261 >>> 0;
    const mix = (v) => { const n = Math.round(v * 1000) | 0; h = Math.imul(h ^ (n & 0xffff), 16777619); h = Math.imul(h ^ ((n >>> 16) & 0xffff), 16777619); };
    mix(sim.t); mix(sim.dyn.length);
    for (const pd of pods) { const p = pd.p; mix(p.dist); mix(p.x); mix(p.speed); mix(p.heat); mix(p.health); mix(p.boost.charge); mix(pd.place); mix(pd.lap); }
    return (h >>> 0).toString(16);
  }

  return { step, view, hash, sim, results, get t() { return sim.t; } };
}
