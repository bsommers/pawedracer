#!/usr/bin/env node
// Usage: node tools/validate-track.mjs [--track id] [--seeds 1..20] [--strip]
// Prints lap time, difficulty and an ASCII elevation/curve strip per track; exit 1 if any track/seed fails.
import { trackDef, TRACK_IDS } from '../src/levels/tracks.js';
import { validateTrack } from '../src/levels/validate.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const ids = opt('--track') ? [opt('--track')] : TRACK_IDS;
const [a, b] = String(opt('--seeds', '1..20')).split('..').map(Number);
const s0 = a, s1 = b ?? a, COLS = 64, BARS = ' ▁▂▃▄▅▆▇█';

function strip(def) {
  const segs = def.segments, n = segs.length;
  const ys = segs.map((s) => s.y), lo = Math.min(...ys), hi = Math.max(...ys), span = Math.max(1, hi - lo);
  let elev = '', L = '', R = '';
  for (let c = 0; c < COLS; c++) {
    const i0 = Math.floor(c * n / COLS), i1 = Math.floor((c + 1) * n / COLS);
    let ym = 0, cm = 0;
    for (let i = i0; i < i1; i++) { ym += ys[i]; cm += segs[i].curve; }
    ym /= i1 - i0; cm /= i1 - i0;
    elev += BARS[Math.round(((ym - lo) / span) * 8)];
    const m = Math.min(9, Math.round(Math.abs(cm) / 0.0025));
    L += cm < 0 && m ? m : ' '; R += cm > 0 && m ? m : ' ';
  }
  return `  elev ${elev}\n  left ${L}\n  right${R}`;
}

let fails = 0;
for (const id of ids) {
  let first = null, worst = null, ok = 0;
  for (let s = s0; s <= s1; s++) {
    const def = trackDef(id, s), r = validateTrack(def);
    if (!first) first = { def, r };
    if (r.ok) ok++; else { fails++; worst ??= { s, r }; }
  }
  const { r, def } = first;
  console.log(`${id.padEnd(10)} lap ${r.lapTime.toFixed(1)}s  x${def.laps}  difficulty ${r.difficulty}/10  seeds ok ${ok}/${s1 - s0 + 1}  hazards ${r.stats.hazards} (timed ${r.stats.timed})`);
  console.log(strip(def));
  if (worst) console.log(`  FAIL seed ${worst.s}: ${worst.r.issues.slice(0, 3).join('; ')}`);
}
process.exit(fails ? 1 : 0);
