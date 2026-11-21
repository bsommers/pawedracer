// Perring Parkway Pete: scripted dirty racer (ARCHITECTURE 5.4). updatePete(sim, pod, dt) -> input.
// Shoves toward the player when alongside, drops mines on straights when the player is within 1500 units
// behind, cuts the apex, boosts on the final lap. Taunts are original cheese puns.
import { POD, HAZARDS } from '../core/defs.js';
import { aiInput } from './ai.js';
import { clamp } from './pod-physics.js';

export const TAUNTS = Object.freeze({
  start: ['Smell that? That is the aroma of your defeat, kitty.', 'Gouda luck. You will need all of it.', 'Perring Parkway belongs to me, whiskers.'],
  mine: ['Special delivery: aged and explosive!', 'Whey to go... straight into my cheese.', 'Do not stop for the wheel, it is a gift!'],
  passed: ['Cheddar late than never, hairball!', 'Eat my fumes, furball.', 'Brie-lliant driving. For a cat.'],
  shoved: ['Mind the gap, fluffy. There is none.', 'Sorry, did I smudge your paint? Nope.'],
  hit: ['Squeak! You will pay for that, Colby!', 'That was a cheap shot. I invented cheap shots!'],
  lastLap: ['Final lap, tabby. Time to turn up the heat.', 'Nobody holds a candle to Pete. I own the candle.'],
  win: ['Pete wins. Again. Say cheese, loser!'],
  lose: ['This is not over, Colby. I have a whole cheese vault of tricks.'],
});
const MOOD = { start: 'smug', mine: 'laugh', passed: 'smug', shoved: 'snarl', hit: 'shocked', lastLap: 'snarl', win: 'laugh', lose: 'shocked' };

export function peteState() {
  return { mineCd: 2, tauntCd: 0, shoveCd: 0, started: false, lastLapDone: false, passedPlayer: false, said: 0 };
}

export function taunt(sim, kind) {
  const st = sim.pete; if (!st) return;
  const list = TAUNTS[kind];
  const text = list[sim.rng.int(0, list.length - 1)];
  sim.emit('peteTaunt', { text, mood: MOOD[kind] });
  st.tauntCd = 5;
}

export function updatePete(sim, pod, dt) {
  const st = sim.pete, player = sim.pods[0].p, p = pod.p;
  st.mineCd = Math.max(0, st.mineCd - dt); st.tauntCd = Math.max(0, st.tauntCd - dt); st.shoveCd = Math.max(0, st.shoveCd - dt);
  const finalLap = sim.lapOf(p) >= sim.laps;
  if (!st.started && sim.t > 0.6) { st.started = true; taunt(sim, 'start'); }
  if (finalLap && !st.lastLapDone && !pod.finished) { st.lastLapDone = true; if (st.tauntCd <= 0) taunt(sim, 'lastLap'); }
  const input = aiInput(sim, pod, { cutApex: true, forceBoost: finalLap });

  const lead = p.dist - player.dist;                      // > 0: Pete ahead of player
  const zLap = sim.zLap(p);
  const straight = Math.abs(sim.segmentAt(zLap).curve) < 0.0006 && Math.abs(sim.segmentAt(zLap + 1500).curve) < 0.0006;
  if (lead > 0 && lead < 1500 && straight && st.mineCd <= 0 && !p.wreck && sim.phase === 'racing') {
    st.mineCd = 7;
    sim.dropMine(pod, zLap - 400, clamp(p.x + (player.x - p.x) * 0.5, -0.8, 0.8));
    if (st.tauntCd <= 0) taunt(sim, 'mine');
  }
  // shove when alongside the player
  const dz = p.dist - player.dist, dx = player.x - p.x;
  if (Math.abs(dz) < POD.collisionZ * 1.6 && Math.abs(dx) < 0.9 && !player.wreck) {
    input.steer = clamp(input.steer * 0.3 + Math.sign(dx) * 0.9, -1, 1);
    if (st.shoveCd <= 0 && Math.abs(dx) < POD.collisionX * 2.4) { st.shoveCd = 6; if (st.tauntCd <= 0) taunt(sim, 'shoved'); }
  }
  return input;
}
export { HAZARDS };
