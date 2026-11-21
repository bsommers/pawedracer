// Roadside billboards (defs.ART.scenery). PixBuf-only, deterministic, 1px outline, palette from PAL.
// Sprites are bottom-anchored: the lowest outline pixel sits on the last row of the frame.
// Exports shared helpers (mk, thick, wheel, wedge, ...) that hazards.js / fx.js reuse.
import { PixBuf, shade, mix, hash2 } from './pixbuf.js';
import { PAL as P } from '../core/defs.js';

/** Build n frames of w x h. Returns an array of PixBufs that also carries {frames,w,h} (ARCHITECTURE 5.6 + sheet tool). */
export function mk(w, h, n, fn, { outline = true } = {}) {
  const frames = [];
  for (let i = 0; i < n; i++) { const p = new PixBuf(w, h); fn(p, i, n); if (outline) p.outline(P.outline); frames.push(p); }
  frames.frames = frames; frames.w = w; frames.h = h;
  return frames;
}
/** Thick line (t px) via offset strokes. */
export function thick(p, x0, y0, x1, y1, c, t = 2) {
  for (let i = 0; i < t; i++) { const o = i - ((t - 1) >> 1); p.line(x0 + o, y0, x1 + o, y1, c); if (t > 1 && i < t - 1) p.line(x0, y0 + o, x1, y1 + o, c); }
}
/** Swiss holes scattered deterministically on opaque cheese pixels inside a box. */
export function holes(p, x, y, w, h, n, seed, c = P.cheeseHole, rmax = 2) {
  for (let i = 0; i < n; i++) {
    const hx = x + 2 + Math.floor(hash2(i, 1, seed) * (w - 4)), hy = y + 2 + Math.floor(hash2(i, 2, seed) * (h - 4)), r = 1 + Math.floor(hash2(i, 3, seed) * rmax);
    if (!p.has(hx, hy) || !p.has(hx - r, hy) || !p.has(hx + r, hy) || !p.has(hx, hy + r) || !p.has(hx, hy - r)) continue;
    p.ellipse(hx, hy, r, Math.max(1, r - 0.4), c); p.set(hx, hy - r + 1, shade(c, 0.7));
  }
}
/** Front-facing cheese wheel: rind ring, cheese face, highlight, holes. */
export function wheel(p, cx, cy, r, seed = 1, nHoles = 5) {
  p.circle(cx, cy, r, P.rindD); p.circle(cx, cy, r - 1, P.rind); p.circle(cx, cy, r - 2, P.cheese);
  p.ellipse(cx - r * 0.28, cy - r * 0.3, r * 0.45, r * 0.3, P.cheeseL);
  p.map((x, y, c) => (c.a >= 128 && c.r === 0xff && c.g === 0xd2 && ((x + y) & 1) && hash2(x, y, seed) > 0.8 ? P.cheeseD : undefined));
  holes(p, cx - r + 2, cy - r + 2, r * 2 - 3, r * 2 - 3, nHoles, seed, P.cheeseHole, Math.max(1, r / 6));
}
/** Side-view cheese wedge, base at y+h-1. Slope falls to the left. */
export function wedge(p, x, y, w, h, seed = 1) {
  p.poly([[x, y + h], [x + w, y + h], [x + w, y + h * 0.25], [x + 1, y + h * 0.78]], P.rind);
  p.poly([[x + 1, y + h - 1], [x + w - 1, y + h - 1], [x + w - 1, y + h * 0.4], [x + 2, y + h * 0.8]], P.cheese);
  p.line(x + 2, y + h * 0.8, x + w - 1, y + h * 0.4, P.cheeseL); p.vline(x + w - 1, y + h * 0.3, h * 0.7, P.rindD);
  p.hline(x + 1, y + h - 1, w - 1, P.cheeseD);
  holes(p, x, y, w, h, 3, seed);
}
const T = (a, b, f) => a + (b - a) * f;

export function build() {
  const out = {};

  // ---- palm: rind-striped trunk, pickle fronds, hanging cheese balls
  out.sc_palm = mk(48, 64, 2, (p, f) => {
    const sw = f ? 2 : -1;
    for (let y = 61; y >= 24; y--) {
      const t = (61 - y) / 37, x = Math.round(T(22, 26, t) + Math.sin(t * 2.4) * 2);
      const c = ((y >> 2) & 1) ? P.rind : P.rindD;
      p.hline(x - 2 + (y > 56 ? -1 : 0), y, y > 56 ? 6 : 4, c); p.set(x - 2, y, P.rind); p.set(x + 1, y, P.rindD);
    }
    const hx = 26, hy = 23;
    const tips = [[-22, 8 + sw], [-15, -2], [-6, -8], [8, -8], [17, -1], [23, 9 - sw], [-10, 14], [12, 14]];
    tips.forEach(([dx, dy], i) => {
      const tx = hx + dx + (i < 3 ? sw : -sw), ty = hy + dy;
      thick(p, hx, hy, (hx + tx) >> 1, Math.min(hy, ty) - 4 + (dy > 8 ? 6 : 0), P.pickle, 2);
      thick(p, (hx + tx) >> 1, Math.min(hy, ty) - 4 + (dy > 8 ? 6 : 0), tx, ty, P.pickleD, 2);
    });
    p.circle(hx, hy + 2, 3, P.cheese); p.set(hx - 1, hy + 1, P.cheeseL); p.set(hx + 1, hy + 3, P.cheeseHole);
    p.circle(hx - 4, hy + 5, 2, P.cheese); p.circle(hx + 4, hy + 5, 2, P.cheeseD);
  });

  // ---- rock: mouldy rind boulder cluster
  out.sc_rock = mk(48, 40, 1, (p) => {
    p.poly([[3, 37], [6, 22], [16, 12], [28, 14], [34, 24], [30, 37]], P.rindD);
    p.poly([[5, 36], [8, 23], [17, 14], [27, 16], [31, 25], [28, 36]], P.rind);
    p.poly([[28, 37], [30, 26], [38, 22], [45, 28], [44, 37]], P.rindD);
    p.poly([[31, 36], [32, 28], [38, 24], [43, 29], [42, 36]], P.rind);
    p.poly([[8, 24], [17, 15], [26, 17], [16, 22]], P.cheeseL);
    p.line(12, 36, 16, 28, P.rindD); p.line(34, 34, 37, 29, P.rindD);
    p.rect(20, 30, 5, 3, P.mold); p.noise(0.08, 3, 2);
  });

  // ---- giant wheel standing on edge, parked
  out.sc_wheel_big = mk(64, 64, 1, (p) => {
    wheel(p, 32, 31, 30, 7, 9);
    p.ring(32, 31, 23, 23, P.cheeseD, 1);
    p.rect(26, 59, 12, 3, P.rindD); p.rect(27, 58, 10, 2, P.rind);
  });

  // ---- cactus: pickle-green saguaro with a pink bloom
  out.sc_cactus = mk(32, 56, 1, (p) => {
    p.rect(13, 8, 7, 46, P.pickle); p.rect(13, 8, 2, 46, P.pickleD); p.rect(18, 10, 2, 44, P.pickleD);
    p.rect(14, 6, 5, 3, P.pickle);
    p.rect(5, 26, 8, 5, P.pickle); p.rect(5, 14, 5, 14, P.pickle); p.rect(5, 14, 2, 14, P.pickleD);
    p.rect(20, 20, 8, 5, P.pickle); p.rect(24, 10, 5, 12, P.pickle); p.rect(27, 10, 2, 12, P.pickleD);
    for (let y = 10; y < 52; y += 6) { p.set(16, y, P.cheeseL); p.set(11, y + 2, P.cheeseL); p.set(22, y + 3, P.cheeseL); }
    p.circle(16, 5, 2, P.nose); p.set(16, 5, P.cheeseL);
    p.rect(8, 51, 18, 3, P.sandD); p.rect(10, 50, 14, 2, P.sand);
  });

  // ---- stalagmite: cheese-rind drip spike
  out.sc_stalag = mk(40, 64, 1, (p) => {
    p.poly([[4, 61], [14, 36], [19, 4], [24, 34], [36, 61]], P.rindD);
    p.poly([[7, 60], [16, 38], [19, 8], [22, 36], [31, 60]], P.rind);
    p.poly([[13, 58], [18, 30], [19, 12], [20, 40]], P.cheeseL);
    p.poly([[26, 52], [31, 60], [36, 61], [30, 44]], P.rindD);
    p.rect(8, 60, 24, 1, P.rindD); p.noise(0.07, 5, 2); p.set(19, 12, P.white);
  });

  // ---- pine: snowy tree, 2 sway frames
  out.sc_pine = mk(40, 72, 2, (p, f) => {
    const s = f ? 1 : 0;
    p.rect(17, 58, 6, 12, P.rindD); p.rect(17, 58, 2, 12, P.rind);
    const tiers = [[16, 6, 12], [26, 12, 18], [38, 17, 24], [50, 22, 30]];
    tiers.forEach(([y, hw, h], i) => {
      const sx = i < 2 ? s : 0;
      p.poly([[20 + sx, y - 12], [20 - hw + sx, y + 6], [20 + hw + sx, y + 6]], P.pickleD);
      p.poly([[20 + sx, y - 12], [20 - hw + 2 + sx, y + 3], [20 + sx, y + 5]], P.pickle);
      p.poly([[20 + sx, y - 12], [20 - hw * 0.5 + sx, y - 3], [20 + hw * 0.5 + sx, y - 3], [20 + sx, y - 6]], P.white);
      p.hline(20 - hw + 2 + sx, y + 5, 3, P.white); p.hline(20 + hw - 5 + sx, y + 5, 3, P.white);
    });
  });

  // ---- mushroom: blue-cheese cap with mould spots, spore twinkle
  out.sc_mushroom = mk(40, 48, 2, (p, f) => {
    p.ellipse(20, 24, 18, 14, P.blueD); p.rect(0, 25, 40, 12, [0, 0, 0, 0]);
    p.ellipse(20, 24, 17, 13, P.blue); p.rect(0, 25, 40, 14, [0, 0, 0, 0]);
    p.rect(3, 24, 34, 3, P.blueD); p.hline(5, 27, 30, P.steelD);
    p.rect(16, 27, 9, 19, P.brie); p.rect(16, 27, 3, 19, P.parm); p.rect(23, 27, 2, 19, P.cheeseD);
    [[12, 15], [22, 12], [28, 18], [17, 20], [8, 21]].forEach(([x, y], i) => { p.circle(x, y, 2, P.mold); p.set(x - 1, y - 1, P.cheeseL); });
    p.ellipse(14, 10, 6, 2, shade(P.blue, 1.25));
    p.rect(17, 44, 7, 2, P.sandD);
    const sp = f ? [[5, 6], [33, 9]] : [[8, 4], [30, 6]];
    sp.forEach(([x, y]) => { p.set(x, y, { ...P2(P.flameL), emit: 1 }); p.set(x + 1, y, P.cheeseL); p.set(x, y + 1, P.cheeseL); });
  });

  // ---- crystal: blue shards, glowing
  out.sc_crystal = mk(32, 48, 2, (p, f) => {
    const shard = (x, w, h, c, d) => { p.poly([[x, 45], [x + w * 0.2, 45 - h * 0.8], [x + w * 0.5, 45 - h], [x + w * 0.85, 45 - h * 0.75], [x + w, 45]], d); p.poly([[x + 1, 44], [x + w * 0.25, 45 - h * 0.78], [x + w * 0.5, 45 - h + 1], [x + w * 0.5, 44]], c); };
    shard(2, 10, 26, P.blue, P.blueD); shard(17, 11, 36, P.glass, P.glassD); shard(9, 11, 42, shade(P.blue, 1.2), P.blueD); shard(22, 8, 20, P.blue, P.blueD);
    p.setMat({ emit: 0.35, gloss: 0.9, spark: 0.9 });
    const g = f ? [[15, 12], [22, 24]] : [[14, 20], [25, 30]];
    g.forEach(([x, y]) => { p.set(x, y, P.white); p.set(x - 1, y, P.cheeseL); p.set(x + 1, y, P.cheeseL); p.set(x, y - 1, P.cheeseL); p.set(x, y + 1, P.cheeseL); });
    p.rect(3, 44, 26, 2, P.steelDD);
  });

  // ---- lamp: street lamp with a cheese-wedge shade; frame 1 flickers
  out.sc_lamp = mk(16, 64, 2, (p, f) => {
    p.rect(6, 12, 3, 49, P.steelD); p.rect(6, 12, 1, 49, P.steel); p.rect(4, 58, 7, 3, P.steelDD);
    p.rect(3, 55, 9, 3, P.steelD);
    p.poly([[1, 12], [14, 12], [11, 5], [4, 5]], P.cheeseD); p.poly([[3, 11], [12, 11], [10, 6], [5, 6]], P.cheese);
    p.rect(4, 12, 8, 3, f ? P.flameL : P.cheeseL); p.setMat({ emit: f ? 0.7 : 1 }, 4, 12, 8, 3);
    if (!f) { p.hline(3, 16, 10, { ...P2(P.flameL), a: 120 }); p.hline(5, 17, 6, { ...P2(P.flameL), a: 70 }); }
  });

  // ---- crowd: cheering mice and cats, 4-frame wave
  out.sc_crowd = mk(64, 32, 4, (p, f) => {
    const fur = [P.fur, P.peteFur, P.steel, P.cream, P.furD, P.brie, P.blue, P.cheese];
    for (let i = 0; i < 9; i++) {
      const row = i % 2, x = 4 + i * 6 + (row ? 3 : 0), yb = 30 - row * 5, up = (f + i) & 3;
      const c = fur[(i * 3) % 8], y = yb - 12 - (up === 1 ? 2 : 0);
      p.rect(x - 2, yb - 8, 6, 8, [P.scarf, P.scBlue, P.cheese, P.pickle][i & 3]);
      p.circle(x + 1, y + 4, 3, c); p.set(x - 1, y, c); p.set(x + 3, y, c); p.set(x - 1, y + 3, P.black); p.set(x + 3, y + 3, P.black);
      if (up === 1 || up === 2) { p.vline(x - 3, yb - 14, 5, c); p.vline(x + 5, yb - 14 - (up & 1), 5, c); }
    }
    if (f & 1) p.rect(30, 3, 4, 3, P.cheese); else p.rect(36, 2, 3, 3, P.scarf);
    p.rect(1, 29, 62, 2, P.asphaltD);
  });

  // ---- banner on two poles, waving (2 frames)
  out.sc_banner = mk(64, 32, 2, (p, f) => {
    p.rect(3, 4, 2, 26, P.steelD); p.rect(59, 4, 2, 26, P.steelD); p.circle(4, 3, 2, P.cheese); p.circle(60, 3, 2, P.cheese);
    for (let x = 6; x < 59; x++) {
      const dy = Math.round(Math.sin((x + f * 8) * 0.28) * 1.5), c = ((x >> 3) & 1) ? P.scarf : P.scarfL;
      p.vline(x, 7 + dy, 15, c); p.set(x, 7 + dy, P.cheeseL); p.set(x, 21 + dy, shade(P.scarf, 0.7));
    }
    wedge(p, 24, 9, 16, 11, 4); p.rect(8, 11, 12, 2, P.cheeseL); p.rect(44, 11, 12, 2, P.cheeseL); p.rect(8, 16, 10, 2, P.cheese); p.rect(46, 16, 10, 2, P.cheese);
  });

  // ---- sign: cheese warning with arrow
  out.sc_sign = mk(32, 40, 1, (p) => {
    p.rect(14, 22, 4, 16, P.steelD); p.rect(14, 22, 1, 16, P.steel);
    p.poly([[16, 1], [30, 14], [16, 27], [2, 14]], P.steelDD); p.poly([[16, 3], [28, 14], [16, 25], [4, 14]], P.cheese);
    wedge(p, 9, 9, 14, 10, 2); p.line(8, 21, 24, 21, P.scarf);
    p.rect(11, 37, 10, 1, P.sandD);
  });

  // ---- start / finish arch with checker banner
  out.sc_start = mk(220, 40, 1, (p) => {
    p.rect(4, 6, 10, 32, P.steelD); p.rect(206, 6, 10, 32, P.steelD); p.rect(4, 6, 3, 32, P.steel); p.rect(206, 6, 3, 32, P.steel);
    p.rect(2, 34, 14, 4, P.steelDD); p.rect(204, 34, 14, 4, P.steelDD);
    p.rect(10, 4, 200, 20, P.black);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 100; x++) if (((x + y) & 1)) p.rect(10 + x * 2, 4 + y * 2, 2, 2, P.white);
    for (let y = 18; y < 22; y += 2) for (let x = 0; x < 100; x++) if (((x + (y >> 1)) & 1)) p.rect(10 + x * 2, y + 2, 2, 2, P.white);
    p.rect(10, 10, 200, 8, P.scarf); p.rect(10, 10, 200, 1, P.scarfL);
    wedge(p, 22, 9, 14, 9, 8); wedge(p, 184, 9, 14, 9, 9);
    for (let i = 0; i < 6; i++) { const x = 52 + i * 26; p.rect(x, 12, 10, 4, P.cheese); p.rect(x + 1, 12, 8, 1, P.cheeseL); }
    wheel(p, 22, 30, 5, 2, 2); wheel(p, 198, 30, 5, 3, 2);
  });

  // ---- tunnel mouth: giant swiss-cheese arch, dark bore
  out.sc_tunnel = mk(300, 160, 1, (p) => {
    p.poly([[0, 157], [0, 52], [12, 24], [44, 6], [150, 1], [256, 6], [288, 24], [300, 52], [300, 157]], P.rindD);
    p.poly([[4, 157], [4, 54], [15, 28], [46, 10], [150, 5], [254, 10], [285, 28], [296, 54], [296, 157]], P.cheeseD);
    p.poly([[10, 157], [10, 56], [20, 32], [50, 16], [150, 11], [250, 16], [280, 32], [290, 56], [290, 157]], P.cheese);
    p.rect(30, 20, 240, 2, P.cheeseL);
    holes(p, 4, 12, 292, 140, 26, 11, P.cheeseHole, 6);
    // bore
    p.poly([[56, 157], [56, 84], [70, 52], [104, 34], [150, 30], [196, 34], [230, 52], [244, 84], [244, 157]], P.rindD);
    p.poly([[60, 157], [60, 86], [73, 56], [106, 38], [150, 34], [194, 38], [227, 56], [240, 86], [240, 157]], P.black);
    for (let r = 0; r < 3; r++) p.poly([[86 + r * 14, 157], [86 + r * 14, 100 - r * 8], [150, 60 + r * 9], [214 - r * 14, 100 - r * 8], [214 - r * 14, 157]], r % 2 ? P.black : P.outline);
    p.rect(40, 152, 220, 5, P.asphaltD); p.rect(0, 154, 300, 3, P.rindD);
    for (let i = 0; i < 5; i++) { p.rect(24 + i * 6, 120, 4, 4, P.scarf); }
  }, { outline: false });

  // ---- mouse-hole cheese house
  out.sc_cheese_house = mk(64, 56, 1, (p) => {
    p.rect(6, 22, 52, 32, P.cheeseD); p.rect(7, 23, 50, 30, P.cheese); p.rect(7, 23, 50, 2, P.cheeseL);
    p.poly([[2, 24], [32, 2], [62, 24]], P.rindD); p.poly([[6, 23], [32, 5], [58, 23]], P.rind); p.poly([[10, 22], [32, 8], [38, 12], [14, 22]], shade(P.rind, 1.2));
    p.rect(40, 5, 6, 10, P.rindD); p.rect(41, 5, 4, 8, P.rind);
    holes(p, 6, 24, 52, 28, 6, 21, P.cheeseHole, 2);
    p.ellipse(25, 52, 8, 10, P.black); p.rect(17, 52, 17, 3, P.black); p.ellipse(25, 50, 6, 8, P.outline);
    p.rect(19, 53, 13, 1, P.rindD);
    p.rect(40, 32, 11, 9, P.glassD); p.rect(41, 33, 9, 7, P.glass); p.hline(41, 36, 9, P.steelD); p.vline(45, 33, 7, P.steelD);
    p.set(42, 34, P.white); p.circle(25, 47, 1, P.cheeseL);
    p.rect(6, 53, 52, 1, P.rindD);
  });

  // ---- Pete's giant billboard: gaunt red-eyed rat in scrap armour
  out.sc_pete_billboard = mk(96, 56, 1, (p) => {
    p.rect(10, 40, 6, 14, P.steelDD); p.rect(80, 40, 6, 14, P.steelDD);
    p.rect(1, 1, 94, 41, P.steelDD); p.rect(3, 3, 90, 37, P.peteFurD); p.rect(3, 3, 90, 37, P.black);
    p.rect(4, 4, 88, 35, P.scarf); p.rect(4, 4, 88, 2, P.scarfL);
    for (let i = 0; i < 8; i++) p.rect(5 + i * 11, 36, 6, 2, P.cheese);
    // face
    p.poly([[32, 36], [34, 18], [48, 8], [62, 18], [64, 36], [48, 38]], P.peteFur);
    p.circle(33, 15, 8, P.peteFur); p.circle(63, 15, 8, P.peteFur); p.circle(33, 15, 5, P.peteEar); p.circle(63, 15, 5, P.peteEar);
    p.poly([[40, 36], [43, 25], [53, 25], [56, 36], [48, 39]], P.peteFurD);
    p.poly([[37, 21], [46, 23], [45, 26], [36, 25]], P.black); p.poly([[59, 21], [50, 23], [51, 26], [60, 25]], P.black);
    p.rect(39, 23, 5, 2, P.peteEye); p.rect(52, 23, 5, 2, P.peteEye); p.setMat({ emit: 0.8 }, 39, 23, 18, 2);
    p.circle(48, 28, 2, P.nose); p.rect(45, 32, 6, 2, P.black); p.rect(46, 32, 1, 2, P.peteFoam); p.rect(49, 32, 1, 2, P.peteFoam);
    for (let i = 0; i < 3; i++) { p.line(38, 29 + i, 24, 27 + i * 3, P.steel); p.line(58, 29 + i, 72, 27 + i * 3, P.steel); }
    p.rect(34, 37, 8, 3, P.peteArmor); p.rect(54, 37, 8, 3, P.peteArmor); p.rect(34, 37, 8, 1, P.peteArmorL); p.rect(54, 37, 8, 1, P.peteArmorL);
    p.rect(8, 8, 18, 3, P.cheese); p.rect(8, 14, 14, 3, P.cheese); p.rect(74, 8, 14, 3, P.cheese); p.rect(70, 14, 18, 3, P.cheese);
  });
  return out;
}
const P2 = (c) => ({ __ink: true, ...hexRGB(c), a: 255, emit: 0, gloss: 0, spark: 0 });
function hexRGB(h) { const n = parseInt(h.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
export { mix };
