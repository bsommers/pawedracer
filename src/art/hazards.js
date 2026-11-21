// Hazards (40x32x2) and pickups (16x16x4). Bottom-anchored, 1px outline, PAL colours only, deterministic.
import { shade } from './pixbuf.js';
import { PAL as P } from '../core/defs.js';
import { mk, thick, wheel, wedge, holes } from './scenery.js';

const glow = (c, e = 1) => ({ __ink: true, ...rgb(c), a: 255, emit: e, gloss: 0, spark: 0 });
function rgb(h) { const n = parseInt(h.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }

export function build() {
  const o = {};
  // ---- wedge: cheddar wedge on the road; frame 1 = wobble (sparkle moves)
  o.hz_wedge = mk(40, 32, 2, (p, f) => {
    wedge(p, 3, 4, 34, 25, 2); p.vline(36, 10 + f, 18, P.rindD);
    p.set(14 + f * 8, 18 - f * 3, P.white); p.set(15 + f * 8, 18 - f * 3, P.cheeseL);
    p.ellipse(20, 29, 17, 1.5, { ...glow(P.asphaltD, 0), a: 150 });
  });
  // ---- rolling wheel: spoke-marked rolling cheese wheel
  o.hz_wheel = mk(40, 32, 2, (p, f) => {
    wheel(p, 20, 15, 14, 4 + f, 0);
    const a = f * 0.5;
    for (let i = 0; i < 4; i++) { const t = a + i * Math.PI / 2; p.line(20, 15, 20 + Math.cos(t) * 11, 15 + Math.sin(t) * 11, P.cheeseD); }
    for (let i = 0; i < 4; i++) { const t = a + i * Math.PI / 2 + 0.78; p.circle(20 + Math.cos(t) * 7, 15 + Math.sin(t) * 7, 2, P.cheeseHole); }
    p.circle(20, 15, 2, P.rindD);
    p.rect(8, 28, 24, 1, { ...glow(P.asphaltD, 0), a: 170 });
  });
  // ---- grater: ridge strip, teeth shimmer
  o.hz_grater = mk(40, 32, 2, (p, f) => {
    p.rect(2, 22, 36, 8, P.steelDD); p.rect(3, 22, 34, 2, P.steel);
    for (let i = 0; i < 9; i++) {
      const x = 3 + i * 4 + (f ? 1 : 0);
      p.poly([[x, 22], [x + 2, 12 + ((i + f) & 1) * 2], [x + 4, 22]], P.steel); p.poly([[x + 2, 22], [x + 2, 13 + ((i + f) & 1) * 2], [x + 4, 22]], P.steelD);
      p.set(x + 2, 15, P.white); p.set(x + 1, 26, P.asphaltD); p.set(x + 3, 27, P.cheeseHole);
    }
    p.setMat({ gloss: 0.9, spark: 0.6 });
    p.rect(5, 27, 6, 2, P.cheese); p.rect(26, 26, 8, 2, P.cheeseD);
  });
  // ---- cutter: swinging cheese-cutter gate; wire swings between frames
  o.hz_cutter = mk(40, 32, 2, (p, f) => {
    p.rect(1, 26, 7, 4, P.steelDD); p.rect(32, 26, 7, 4, P.steelDD); p.rect(3, 4, 4, 23, P.steelD); p.rect(33, 4, 4, 23, P.steelD);
    p.rect(3, 4, 1, 23, P.steel); p.rect(33, 4, 1, 23, P.steel); p.rect(1, 1, 38, 4, P.steelD); p.rect(1, 1, 38, 1, P.steel);
    const y0 = f ? 9 : 14, y1 = f ? 14 : 9;
    p.line(7, y0, 33, y1, P.white); p.line(7, y0 + 1, 33, y1 + 1, P.steelD);
    thick(p, 20, 5, 20, (y0 + y1) / 2 + 3, P.steelD, 2); p.rect(17, (y0 + y1) / 2 + 2, 7, 4, P.scarf);
    p.setMat({ gloss: 1, spark: 0.9 }, 7, 8, 26, 8); p.set(10 + f * 18, 10, P.white);
    p.rect(14, 20, 12, 4, P.cheese); p.rect(14, 20, 12, 1, P.cheeseL);
  });
  // ---- fondue puddle: bubbling lava cheese, emissive
  o.hz_fondue = mk(40, 32, 2, (p, f) => {
    p.ellipse(20, 22, 18, 8, P.fondueD); p.ellipse(20, 21, 16, 6.5, P.fondue); p.ellipse(18, 20, 10, 3.5, P.flame); p.ellipse(16, 19, 5, 2, P.flameL);
    [[10, 22], [26, 21], [20, 24], [31, 23]].forEach(([x, y], i) => { const k = (i + f) & 1; p.circle(x, y - k * 2, 2 - (k ? 0 : 1) + 1, P.flame); p.set(x - 1, y - 1 - k * 2, P.flameL); });
    p.set(14 + f * 10, 12 - f, P.flameL); p.set(15 + f * 10, 12 - f, P.flame); p.setMat({ emit: 0.9, gloss: 0.6 });
  });
  // ---- stink cloud: green-grey fog puffs with stink lines
  o.hz_stink = mk(40, 32, 2, (p, f) => {
    const puff = (x, y, r, c) => { p.circle(x, y, r, c); };
    puff(12, 22, 8, shade(P.mold, 0.8)); puff(27, 21, 9, shade(P.mold, 0.8)); puff(20, 15 - f, 10, shade(P.mold, 0.8)); puff(8, 18, 5, P.mold);
    puff(13, 21, 6, P.mold); puff(27, 20, 7, P.mold); puff(20, 14 - f, 8, shade(P.mold, 1.2)); puff(24, 12 - f, 4, shade(P.pickle, 1.15));
    for (let i = 0; i < 3; i++) { const x = 9 + i * 11, y = 8 - f; for (let s = 0; s < 4; s++) p.set(x + ((s + i + f) & 1), y - s * 2, P.pickle); }
    p.setMat({ gloss: 0.1, emit: 0.1 });
    [[15, 20], [24, 17], [19, 24]].forEach(([x, y]) => { p.set(x, y, P.black); p.set(x + 2, y, P.black); p.set(x, y + 2, P.black); p.set(x + 1, y + 2, P.black); p.set(x + 2, y + 2, P.black); });
  });
  // ---- mine: Pete's cheese-wheel mine; frame 1 blinks red
  o.hz_mine = mk(40, 32, 2, (p, f) => {
    p.ellipse(20, 20, 13, 9, P.steelDD); p.ellipse(20, 19, 12, 8, P.steelD); p.ellipse(18, 17, 8, 4, P.steel);
    p.rect(8, 16, 24, 6, P.cheese); p.rect(8, 16, 24, 1, P.cheeseL); holes(p, 8, 16, 24, 6, 3, 5, P.cheeseHole, 1);
    for (let i = 0; i < 5; i++) { const x = 9 + i * 5; p.poly([[x, 12], [x + 2, 6], [x + 4, 12]], P.steelD); p.set(x + 2, 7, P.steel); }
    p.circle(20, 4, 3, f ? glow(P.red, 1) : P.scarf); p.set(19, 3, f ? P.white : P.scarfL); if (f) p.setMat({ emit: 1 }, 17, 1, 7, 6);
    p.rect(14, 26, 12, 2, P.steelDD);
    p.rect(17, 12, 6, 3, P.peteArmor); p.hline(17, 12, 6, P.peteArmorL);
  });
  // ---- swiss hole: dark pit with cheese lip
  o.hz_hole = mk(40, 32, 2, (p, f) => {
    p.ellipse(20, 20, 18, 9, P.rindD); p.ellipse(20, 20, 17, 8, P.cheeseHole); p.ellipse(20, 21, 14, 6.5, P.black); p.ellipse(20, 22, 10, 4, P.outline);
    p.hline(6, 15, 28, P.cheeseD); p.ellipse(20, 13, 14, 2, P.cheeseD); p.ellipse(20, 12, 13, 1.5, P.cheese);
    p.ellipse(20, 20, 14, 7.5, [0, 0, 0, 0]); p.ellipse(20, 21, 14, 6.5, P.black); p.ellipse(20, 22, 10, 4, P.outline);
    p.set(26 - f * 4, 24, P.blueD); p.set(14 + f * 5, 20, P.steelDD);
    p.ring(20, 20, 16, 8, P.cheese, 1); p.set(30, 15, P.cheeseL);
  });

  // ---------------- pickups 16x16x4
  o.pk_tuna = mk(16, 16, 4, (p, f) => {
    const s = [0, 1, 0, -1][f];
    p.rect(2, 4, 12, 10, P.steelD); p.rect(2, 4, 12, 3, P.steel); p.rect(2, 12, 12, 2, P.steelDD);
    p.rect(2, 7, 12, 4, P.scBlue); p.rect(3, 8, 3 + (s > 0), 2, P.white);
    p.poly([[6 + s, 9], [10 + s, 8], [11 + s, 10], [6 + s, 11]], P.nose); p.set(10 + s, 9, P.black);
    p.ellipse(8, 3, 5, 1.5, P.steel); p.set(8, 2, P.white); p.set(3 + f * 3, 5, P.white); p.setMat({ gloss: 0.9, spark: f === 1 ? 1 : 0.3 });
  });
  o.pk_mouse = mk(16, 16, 4, (p, f) => {
    const b = [0, -1, 0, 1][f] * 0 + (f & 1 ? 1 : 0);
    p.ellipse(8, 10 + b, 5, 4, P.steel); p.circle(4, 5 + b, 3, P.steel); p.circle(11, 5 + b, 3, P.steel);
    p.circle(4, 5 + b, 1.5, P.peteEar); p.circle(11, 5 + b, 1.5, P.peteEar);
    p.rect(6, 9 + b, 5, 3, P.steelD); p.set(5, 9 + b, P.black); p.set(10, 9 + b, P.black); p.set(8, 11 + b, P.nose);
    p.line(12, 12 + b, 14, 12 + (f >> 1) * 2 + b, P.peteTail);
    p.set(8, 1 + b, P.scarf); p.set(7, 2 + b, P.scarf); p.set(9, 2 + b, P.scarf); p.set(7, 1 + b, P.scarf); p.set(9, 1 + b, P.scarf);   // red repair cross hint
    p.rect(7, 1 + b, 3, 1, P.scarf); p.vline(8, 0 + b, 3, P.scarf);
  });
  o.pk_coin = mk(16, 16, 4, (p, f) => {
    const rx = [6, 4, 1, 4][f];
    p.ellipse(8, 8, rx + 1, 7, P.cheeseD); p.ellipse(8, 8, rx, 6, P.cheese);
    if (rx > 2) { p.ellipse(8 - 1, 7, rx - 2, 4, P.cheeseL); wedgeLogo(p, rx); }
    p.setMat({ gloss: 1, spark: f === 0 ? 0.8 : 0.2 }); p.set(5, 4, P.white);
  });
  o.pk_sardine = mk(16, 16, 4, (p, f) => {
    const w = [0, 1, 0, -1][f];
    p.ellipse(8, 8, 6, 3, P.steel); p.ellipse(8, 7, 5, 1.5, P.glass); p.poly([[13, 8], [15, 5 + w], [15, 11 - w]], P.steelD);
    p.set(3, 7, P.black); p.set(3, 6, P.white); p.rect(6, 5, 1, 6, P.steelD); p.rect(9, 5, 1, 6, P.steelD); p.hline(4, 10, 7, P.cheeseL);
    p.setMat({ gloss: 1, spark: f === 2 ? 1 : 0.3 });
    p.set(2 + f * 3, 4, P.white);
  });
  o.pk_collar = mk(16, 16, 4, (p, f) => {
    const sp = f * 3;
    p.ring(8, 9, 6, 5, P.scarf, 2); p.ring(8, 9, 6, 5, P.scarfL, 1); p.hline(3, 8, 3, P.scarfL);
    p.circle(8, 14, 2, P.cheese); p.set(8, 14, P.cheeseHole); p.set(7, 13, P.cheeseL); p.setMat({ gloss: 1, spark: 0.9 });
    for (let i = 0; i < 5; i++) p.set(3 + i * 2, 5 + ((i & 1) ? 1 : 0), P.flameL);
    p.set(2 + sp, 3 + (f & 1), P.white); p.set(1 + sp, 3 + (f & 1), P.cheeseL); p.set(3 + sp, 3 + (f & 1), P.cheeseL);
  });
  return o;
}
function wedgeLogo(p, rx) { p.poly([[5, 11], [11, 11], [11, 6]], P.cheeseD); p.set(9, 9, P.cheeseHole); }
