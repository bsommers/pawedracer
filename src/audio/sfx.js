// Pawed Racer sound effects (ARCHITECTURE.md 5.7). Every name in defs.SFX is a pure recipe -> list of voices (plain data).
// The same voices drive live WebAudio (audio-kit scheduleVoices) and the offline PCM path (Node tests, tools/sfx-wav.mjs).
// Recipe format is the Pawgger one (see src/kits/audio-kit/index.js): (v, { arp, midiHz }) => void, v(voice) appends one.
// engine_loop and crowd_loop are one-cycle loops: every voice starts and ends at ~0 amplitude and every pitched voice
// sits on a whole multiple of 1/dur Hz, so the buffer tiles without a seam at pitch 1.
import { SFX } from '../core/defs.js';
import { describeSfx, renderVoices, pcmStats, midiHz, voicesDuration } from '../kits/audio-kit/index.js';

export const SFX_NAMES = SFX;
export const STYLES = Object.freeze(['retro']);
export const LOOP_SFX = Object.freeze({ engine_loop: 0.5, crowd_loop: 1.0 });   // loop length in seconds

// ---- retro: chiptune blips, square-wave arps, noise bursts --------------------------------------------------------
export const SFX_RECIPES = Object.freeze({
  // Engine: one 2 Hz cycle (0.5 s). Saw 56 Hz + square 112 Hz + sine 168 Hz, all whole multiples of 2 Hz.
  engine_loop: (v) => {
    v({ src: 'saw', dur: 0.5, gain: 0.1, att: 0.25, f: 56, filters: [{ type: 'lp', f: 900, q: 0.7 }] });
    v({ src: 'square', dur: 0.5, gain: 0.035, att: 0.25, f: 112, filters: [{ type: 'lp', f: 600, q: 0.7 }] });
    v({ src: 'sine', dur: 0.5, gain: 0.03, att: 0.25, f: 168 });
  },
  boost_on: (v) => {                                                  // rising whoosh-blip
    v({ src: 'square', dur: 0.25, gain: 0.14, att: 0.01, f: [220, 880], filters: [{ type: 'lp', f: 3000, q: 0.7 }] });
    v({ src: 'triangle', dur: 0.25, gain: 0.08, att: 0.01, f: [440, 1320] });
  },
  boost_end: (v) => v({ src: 'square', dur: 0.3, gain: 0.12, att: 0.005, f: [660, 180], filters: [{ type: 'lp', f: 2000, q: 0.7 }] }),
  overheat: (v) => {                                                  // steam hiss with falling siren
    v({ src: 'noise', dur: 0.6, gain: 0.14, att: 0.05, f: 1, filters: [{ type: 'bp', f: [3000, 1200], q: 1 }] });
    v({ src: 'saw', dur: 0.5, gain: 0.08, att: 0.02, f: [300, 200], filters: [{ type: 'lp', f: 800, q: 0.7 }] });
  },
  engine_stall: (v) => {                                              // sputter and die
    v({ src: 'saw', dur: 0.45, gain: 0.2, att: 0.005, f: [160, 40], filters: [{ type: 'lp', f: [1200, 200], q: 0.9 }] });
    v({ src: 'noise', dur: 0.25, gain: 0.1, t: 0.1, att: 0.01, f: 1, filters: [{ type: 'lp', f: 500, q: 0.7 }] });
  },
  repair: (v, { arp }) => arp(v, [67, 72, 79], 0.06, { src: 'triangle', dur: 0.14, gain: 0.14 }),   // tin-can ding-ding
  roll: (v) => {                                                      // low rumble while sideways
    v({ src: 'noise', dur: 0.35, gain: 0.12, att: 0.03, f: 1, filters: [{ type: 'bp', f: [500, 250], q: 1.2 }] });
    v({ src: 'triangle', dur: 0.35, gain: 0.1, att: 0.03, f: [90, 70] });
  },
  hit_wall: (v) => {                                                  // crunchy crash
    v({ src: 'noise', dur: 0.25, gain: 0.3, att: 0.002, f: 1, filters: [{ type: 'lp', f: [2500, 400], q: 0.8 }] });
    v({ src: 'sine', dur: 0.25, gain: 0.3, att: 0.002, f: [120, 45] });
  },
  hit_pod: (v) => {                                                   // pod-on-pod bonk
    v({ src: 'square', dur: 0.18, gain: 0.2, att: 0.002, f: [240, 110], filters: [{ type: 'lp', f: 1400, q: 0.9 }] });
    v({ src: 'noise', dur: 0.06, gain: 0.12, att: 0.001, f: 1, filters: [{ type: 'lp', f: 1500, q: 0.7 }] });
  },
  hit_hazard: (v) => {                                                // thud and sting
    v({ src: 'sine', dur: 0.2, gain: 0.3, att: 0.002, f: [180, 60] });
    v({ src: 'square', t: 0.02, dur: 0.1, gain: 0.08, att: 0.002, f: [700, 300], filters: [{ type: 'lp', f: 2500, q: 0.7 }] });
  },
  scrape: (v) => {                                                    // sideswipe grind
    v({ src: 'noise', dur: 0.22, gain: 0.15, att: 0.02, f: 1, filters: [{ type: 'bp', f: [1800, 900], q: 1.2 }] });
    v({ src: 'saw', dur: 0.2, gain: 0.05, att: 0.01, f: [200, 160], filters: [{ type: 'lp', f: 900, q: 0.7 }] });
  },
  pickup_coin: (v, { arp }) => arp(v, [83, 88], 0.05, { src: 'square', dur: 0.12, gain: 0.16 }),
  pickup_tuna: (v, { arp }) => arp(v, [67, 71, 74, 79], 0.05, { src: 'triangle', dur: 0.16, gain: 0.15, lp: 3000 }),
  pickup_mouse: (v) => {                                              // squeak
    v({ src: 'square', dur: 0.08, gain: 0.12, att: 0.002, f: [1500, 2600] });
    v({ src: 'sine', t: 0.04, dur: 0.06, gain: 0.06, att: 0.002, f: [2200, 3000] });
  },
  lap: (v, { arp }) => arp(v, [72, 76, 79, 84], 0.07, { src: 'square', dur: 0.14, gain: 0.13, lp: 3500 }),
  final_lap: (v, { arp }) => {                                        // urgent, higher
    arp(v, [76, 79, 83, 88, 91], 0.06, { src: 'square', dur: 0.12, gain: 0.14 });
    [84, 88, 91].forEach((n) => v({ src: 'triangle', t: 0.35, dur: 0.45, gain: 0.1, f: midiHz(n) }));
  },
  finish: (v, { arp }) => {                                           // fanfare
    arp(v, [60, 64, 67, 72], 0.1, { src: 'square', dur: 0.2, gain: 0.14 });
    [72, 76, 79].forEach((n) => v({ src: 'triangle', t: 0.45, dur: 0.8, gain: 0.12, f: midiHz(n) }));
  },
  podium: (v, { arp }) => {                                           // victory arpeggio and chord
    arp(v, [72, 76, 79, 84], 0.08, { src: 'square', dur: 0.16, gain: 0.14 });
    [84, 88, 91].forEach((n) => v({ src: 'triangle', t: 0.34, dur: 0.7, gain: 0.12, f: midiHz(n) }));
  },
  countdown_beep: (v) => v({ src: 'square', dur: 0.12, gain: 0.16, att: 0.002, f: 660 }),
  countdown_go: (v) => {                                              // bright two-note go
    v({ src: 'square', dur: 0.35, gain: 0.16, att: 0.005, f: [660, 990] });
    v({ src: 'triangle', dur: 0.35, gain: 0.1, att: 0.005, f: [990, 1320] });
  },
  pass_whoosh: (v) => {                                               // air rush as a pod goes by
    v({ src: 'noise', dur: 0.4, gain: 0.2, att: 0.1, f: 1, filters: [{ type: 'bp', f: [300, 2400], q: 1 }] });
    v({ src: 'triangle', dur: 0.3, gain: 0.08, att: 0.05, f: [400, 180] });
  },
  crowd_loop: (v) => {                                                // one-cycle murmur, 1 s, swells and falls
    v({ src: 'noise', dur: 1.0, gain: 0.25, att: 0.5, f: 1, filters: [{ type: 'bp', f: [900, 500], q: 0.8 }] });
    v({ src: 'noise', dur: 1.0, gain: 0.12, att: 0.5, f: 1, filters: [{ type: 'bp', f: [2200, 1200], q: 0.8 }] });
  },
  pete_laugh: (v, { arp }) => arp(v, [76, 72, 76, 72, 69], 0.1, { src: 'saw', dur: 0.08, gain: 0.12, lp: 2200 }),   // "ha-ha-ha-ha"
  pete_taunt: (v) => {                                                // sly wah-wah down
    v({ src: 'saw', dur: 0.4, gain: 0.14, att: 0.01, f: [440, 220], filters: [{ type: 'lp', f: [1800, 400], q: 2 }] });
    v({ src: 'triangle', t: 0.4, dur: 0.25, gain: 0.1, att: 0.01, f: [330, 165] });
  },
  announcer_blip: (v) => {
    v({ src: 'square', dur: 0.05, gain: 0.1, att: 0.002, f: [1000, 1500], filters: [{ type: 'lp', f: 3000, q: 0.7 }] });
    v({ src: 'sine', t: 0.05, dur: 0.04, gain: 0.06, att: 0.002, f: 1500 });
  },
  menu_move: (v) => v({ src: 'square', dur: 0.04, gain: 0.12, att: 0.002, f: 880 }),
  menu_ok: (v, { arp }) => arp(v, [76, 88], 0.06, { dur: 0.08, gain: 0.14 }),
  shop_buy: (v, { arp }) => {                                         // cash register
    arp(v, [79, 83, 86, 91], 0.05, { src: 'square', dur: 0.09, gain: 0.13 });
    v({ src: 'noise', t: 0.2, dur: 0.05, gain: 0.08, att: 0.001, f: 1, filters: [{ type: 'hp', f: 3000, q: 0.7 }] });
  },
  cheese_cut: (v) => {                                                // knife slice through Gouda
    v({ src: 'noise', dur: 0.08, gain: 0.2, att: 0.001, f: 1, filters: [{ type: 'bp', f: [3000, 1500], q: 1.5 }] });
    v({ src: 'square', dur: 0.12, gain: 0.1, att: 0.002, f: [1100, 600], filters: [{ type: 'lp', f: 3000, q: 0.7 }] });
  },
  splat: (v) => {                                                     // wet squash
    v({ src: 'noise', dur: 0.35, gain: 0.28, att: 0.003, f: 1, filters: [{ type: 'bp', f: [1200, 200], q: 0.8 }] });
    v({ src: 'sine', dur: 0.3, gain: 0.25, att: 0.003, f: [160, 40] });
  },
});

export const RECIPES_BY_STYLE = Object.freeze({ retro: SFX_RECIPES });
const cache = new Map();

/** Voices for one name in one style (plain data). opts.pitch scales pitched voices. Unknown style falls back to retro. */
export function describe(name, { style = 'retro', pitch = 1 } = {}) {
  const table = RECIPES_BY_STYLE[style] || SFX_RECIPES;
  if (pitch === 1) {
    const key = `${style}:${name}`;
    if (!cache.has(key)) cache.set(key, describeSfx(table, name));
    return cache.get(key).map((o) => ({ ...o }));
  }
  return describeSfx(table, name, { pitch });
}
export const duration = voicesDuration;

/** Offline render of one SFX name to mono Float32Array. opts: { style, pitch, seed, tail }. Peak kept <= 0.98 by the kit. */
export function renderSfx(name, sr = 44100, opts = {}) { return renderVoices(describe(name, opts), sr, opts); }
export const stats = pcmStats;
export { midiHz };
