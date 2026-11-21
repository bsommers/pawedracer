// Seamless horizontally-wrapping far layers (defs.ART.backdrop), 640 px wide. Every feature is periodic in x
// (integer harmonics of 640, or objects wrapped with modular distance), so column 639 flows into column 0.
// Skies are fully opaque; hills/mesa/peaks/skyline/cave are silhouettes with transparent sky.
import { PixBuf, mix, shade, hash2 } from './pixbuf.js';
import { PAL as P } from '../core/defs.js';

const W = 640, TAU = Math.PI * 2;
const frames1 = (p) => { const a = [p]; a.frames = a; a.w = p.w; a.h = p.h; return a; };
const dist = (a, b) => { const d = Math.abs(a - b) % W; return Math.min(d, W - d); };   // wrapped distance
/** Periodic height profile: sum of sines with integer harmonic k (period W / k). */
const prof = (x, terms) => terms.reduce((s, [k, a, ph]) => s + Math.sin(TAU * k * x / W + ph) * a, 0);
const hx = (c) => ({ r: parseInt(c.slice(1, 3), 16), g: parseInt(c.slice(3, 5), 16), b: parseInt(c.slice(5, 7), 16) });
const lerpC = (a, b, t) => mix(a, b, Math.max(0, Math.min(1, t)));
/** Cheese-wedge cloud, wrapped. */
function cloud(p, cx, cy, s, c, d) {
  for (let ox = -1; ox <= 1; ox++) {
    const x = cx + ox * W;
    p.ellipse(x, cy, 9 * s, 3 * s, d); p.ellipse(x - 5 * s, cy - 2 * s, 5 * s, 3 * s, c); p.ellipse(x + 3 * s, cy - 3 * s, 6 * s, 4 * s, c); p.ellipse(x, cy, 9 * s, 2 * s, c);
    p.rect(x - 9 * s, cy + 1, 18 * s, 1, d);
  }
}
function sky(h, stops, { stars = false, sun = null, cl = [], cc = P.white, cd = P.brie, seed = 1 } = {}) {
  const p = new PixBuf(W, h);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(t)), f = t - i;
    const band = Math.floor(f * 6) / 6, jit = (y & 1) ? 0.04 : 0;   // 6-step banding with 1-row dither
    const c = lerpC(stops[i], stops[i + 1], band + jit);
    for (let x = 0; x < W; x++) p.set(x, y, c);
  }
  if (stars) for (let i = 0; i < 110; i++) {
    const x = Math.floor(hash2(i, 1, seed) * W), y = Math.floor(hash2(i, 2, seed) * h * 0.8), b = hash2(i, 3, seed);
    p.set(x, y, b > 0.8 ? P.white : b > 0.4 ? P.cheeseL : P.steel);
    if (b > 0.93) { p.set(x + 1, y, P.cheeseL); p.set(x, y + 1, P.cheeseL); }
  }
  if (sun) {
    const [sx, sy, r, c, g] = sun;
    p.circle(sx, sy, r + 3, { ...hx(g), __ink: true, a: 70, emit: 0.3, gloss: 0, spark: 0 }); p.circle(sx, sy, r + 1, { ...hx(g), __ink: true, a: 120, emit: 0.4, gloss: 0, spark: 0 });
    p.circle(sx, sy, r, c);
    if (sun[5] === 'moon') { p.circle(sx - 3, sy - 2, 2, P.cheeseD); p.circle(sx + 4, sy + 3, 2, P.cheeseD); p.circle(sx + 3, sy - 4, 1, P.cheeseD); }
  }
  for (const [x, y, s] of cl) cloud(p, x, y, s, cc, cd);
  return p;
}
function fillCol(p, x, top, c, bot = p.h) { for (let y = Math.max(0, Math.floor(top)); y < bot; y++) p.set(x, y, c); }
/** Silhouette layer: height function top(x); fills colour ramp banded by depth below the ridge. */
function ridge(h, top, cols, fx) {
  const p = new PixBuf(W, h);
  for (let x = 0; x < W; x++) {
    const t = Math.floor(top(x));
    for (let y = t; y < h; y++) { const d = y - t; p.set(x, y, d < 1 ? cols[0] : d < 3 ? cols[1] : d < 14 ? cols[2] : cols[3]); }
  }
  if (fx) fx(p);
  return p;
}

export function build() {
  const o = {};
  // skies
  o.bg_sky_day = frames1(sky(80, [P.glassD, P.glass, shade(P.glass, 1.35), '#fff0c0'], { sun: [470, 22, 9, P.cheeseL, P.flameL], cl: [[70, 20, 1.2], [210, 34, 1], [330, 12, 1.4], [560, 38, 0.9], [150, 48, 0.8]] }));
  o.bg_sky_dusk = frames1(sky(80, ['#3a2a6a', P.scBlue, '#e0728a', P.flame, P.cheeseL], { sun: [150, 66, 12, P.flame, P.flameD], cl: [[60, 30, 1.3], [260, 18, 1], [420, 40, 1.4], [570, 26, 1]], cc: '#f6a0a0', cd: '#a85a88' }));
  o.bg_sky_night = frames1(sky(80, [P.black, '#140c2a', '#241848', '#3a2a6a'], { stars: true, sun: [190, 24, 8, P.cheeseL, P.cheese], cl: [[400, 46, 1.4], [40, 56, 1.1], [560, 30, 1]], cc: '#4a3a7a', cd: '#2a1c4a', seed: 5 }));

  // rolling green hills, with tiny cheese-wedge houses
  o.bg_hills = frames1(ridge(48, (x) => 20 + prof(x, [[2, 5, 0.4], [5, 3, 1.1], [11, 1.5, 2]]), [P.grass, shade(P.grass, 0.9), P.grassD, shade(P.grassD, 0.8)], (p) => {
    for (let i = 0; i < 9; i++) { const x = 30 + i * 70, t = Math.floor(20 + prof(x, [[2, 5, 0.4], [5, 3, 1.1], [11, 1.5, 2]])) + 2; p.rect(x, t + 6, 5, 4, P.cheese); p.rect(x, t + 5, 5, 1, P.rind); p.set(x + 2, t + 8, P.cheeseHole); p.set(x + 1, t + 4, P.rindD); p.set(x + 3, t + 4, P.rindD); }
    for (let x = 0; x < W; x++) if (hash2(x, 3, 2) > 0.985) p.set(x, 30 + Math.floor(hash2(x, 4, 2) * 12), P.grass);
  }));

  // mesa: flat-topped cheddar buttes
  const buttes = [[60, 56, 40], [200, 38, 30], [330, 60, 36], [470, 44, 44], [590, 34, 26]];   // centre, width, height
  o.bg_mesa = frames1(ridge(56, (x) => { let t = 46 + prof(x, [[7, 1, 0.5]]); for (const [c, w, hh] of buttes) { const d = dist(x, c); if (d < w) t = Math.min(t, 56 - hh + (d > w - 4 ? (d - (w - 4)) * 3 : 0)); } return t; },
    [P.cheese, P.cheeseD, P.rind, P.rindD], (p) => {
      for (let x = 0; x < W; x++) for (let y = 0; y < 56; y++) { if (!p.has(x, y)) continue; const g = hash2(x >> 2, y >> 1, 7); if (((y >> 2) & 1) && g > 0.7) p.set(x, y, P.rindD); if (g > 0.97) p.set(x, y, P.cheeseHole); }
      for (const [c, w, hh] of buttes) for (let y = 56 - hh + 5; y < 56; y += 7) for (let x = c - w + 4; x < c + w - 4; x++) if (hash2(x, y, 9) > 0.55) p.set(((x % W) + W) % W, y, P.cheeseHole);
    }));

  // peaks: snowy grated parmesan mountains
  const peakH = (x) => 14 + 18 * (0.5 - 0.5 * Math.cos(TAU * 5 * x / W)) ** 0.8 * 0 + 30 - 24 * Math.abs(Math.sin(TAU * 2.5 * x / W)) ** 0.7 - 6 * Math.abs(Math.sin(TAU * 7 * x / W + 1));
  o.bg_peaks = frames1(ridge(64, peakH, [P.white, P.parm, P.steel, P.steelD], (p) => {
    for (let x = 0; x < W; x++) { const t = Math.floor(peakH(x)); for (let y = t; y < t + 12 + 6 * Math.sin(x * 0.9); y++) if (p.has(x, y) && ((x + y) & 3) > 0) p.set(x, y, y < t + 3 ? P.white : P.brie); }
    for (let x = 0; x < W; x++) { const t = Math.floor(peakH(x)); for (let y = t + 14; y < 64; y++) if (hash2(x >> 1, y, 3) > 0.9) p.set(x, y, P.steelDD); if (x % 4 === 0 && p.has(x, t + 18)) p.vline(x, t + 14, 5, P.steelDD); }
    for (let y = 56; y < 64; y++) for (let x = 0; x < W; x++) p.set(x, y, hash2(x, y, 4) > 0.5 ? P.pickleD : P.grassD);
  }));

  // skyline: mouse-city towers, windows lit
  const tw = []; { let x = 0, i = 0; while (x < W) { const wdt = Math.min(W - x, 14 + Math.floor(hash2(i, 1, 6) * 20)); tw.push([x, wdt, 14 + Math.floor(hash2(i, 2, 6) * 28), i]); x += wdt; i++; } }
  o.bg_skyline = frames1(((p) => {
    for (const [x, w, hh, i] of tw) {
      const base = hash2(i, 5, 6) > 0.5 ? P.steelDD : '#3a3a5a', top = 48 - hh;
      p.rect(x, top, w, hh, base); p.rect(x, top, w, 1, P.steelD); p.rect(x + w - 1, top, 1, hh, P.black);
      if (hash2(i, 6, 6) > 0.6 && w > 8) { p.rect(x + w / 2 - 1, top - 5, 2, 5, base); p.set(x + w / 2 - 1, top - 5, P.red); }
      if (hash2(i, 7, 6) > 0.7) { p.poly([[x, top], [x + w - 1, top], [x + w / 2, top - 4]], P.cheeseD); }
      for (let y = top + 3; y < 46; y += 4) for (let xx = x + 2; xx < x + w - 2; xx += 3) { const lit = hash2(xx, y, 8) > 0.55; p.set(xx, y, lit ? (hash2(xx, y, 9) > 0.5 ? P.cheese : P.cheeseL) : P.black); if (lit) p.setMat({ emit: 0.6 }, xx, y, 1, 1); }
    }
    for (let x = 0; x < W; x++) p.set(x, 47, P.black);
    return p;
  })(new PixBuf(W, 48)));

  // cave: stalactite ceiling, stalagmite floor, glowing mould, hazy middle left open
  const cTop = (x) => 10 + 7 * Math.abs(Math.sin(TAU * 6 * x / W)) ** 0.5 + 4 * Math.sin(TAU * 3 * x / W + 1) + 7 * Math.abs(Math.sin(TAU * 11 * x / W + 2)) ** 3;
  const cBot = (x) => 52 - 6 * Math.abs(Math.sin(TAU * 5 * x / W + 0.7)) ** 0.8 - 5 * Math.abs(Math.sin(TAU * 13 * x / W)) ** 4;
  o.bg_cave = frames1(((p) => {
    for (let x = 0; x < W; x++) {
      const t = Math.floor(cTop(x)), b = Math.floor(cBot(x));
      for (let y = 0; y < t; y++) p.set(x, y, y > t - 2 ? shade(P.rindD, 1.15) : y > t - 5 ? P.rindD : P.black);
      for (let y = b; y < 64; y++) p.set(x, y, y < b + 2 ? P.steelD : y < b + 6 ? P.steelDD : P.black);
      if (hash2(x, 1, 12) > 0.992) p.vline(x, t, 3, P.blue);
    }
    for (let i = 0; i < 16; i++) { const x = Math.floor(hash2(i, 2, 12) * W), t = Math.floor(cTop(x)), g = hash2(i, 3, 12) > 0.5 ? P.blue : P.mold; p.rect(x, t + 1, 2, 2, { ...hx(g), __ink: true, a: 255, emit: 0.9, gloss: 0, spark: 0.4 }); p.set(x, t + 3, shade(g, 0.7)); }
    for (let i = 0; i < 26; i++) { const x = Math.floor(hash2(i, 4, 12) * W), b = Math.floor(cBot(x)); p.set(x, b - 1, P.steel); }
    // far rocks
    for (let x = 0; x < W; x++) { const t = Math.floor(cTop(x)), b = Math.floor(cBot(x)), m = 30 + 6 * Math.sin(TAU * 4 * x / W); if (m > t + 6 && m < b - 6 && hash2(x >> 2, 5, 12) > 0.93) p.rect(x, m, 3, b - m, '#14101c'); }
    return p;
  })(new PixBuf(W, 64)));
  return o;
}
