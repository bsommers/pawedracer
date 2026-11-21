// FX sheets (defs.ART.fx) and HUD/ui art (defs.ART.ui). Deterministic, PAL colours only.
// FX are un-outlined (they are particles/glows); HUD pieces are drawn with their own edges.
// hud_icons: every frame is the full 96x12 strip of 8 icons (12px each); frame i lights icon i.
import { PixBuf, shade, hash2 } from './pixbuf.js';
import { PAL as P } from '../core/defs.js';
import { mk, wedge, wheel } from './scenery.js';

const ink = (c, a = 255, emit = 0) => { const n = parseInt(c.slice(1), 16); return { __ink: true, r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a, emit, gloss: 0, spark: 0 }; };
const NO = { outline: false };

export function build() {
  const o = {};
  o.fx_spark = mk(8, 8, 4, (p, f) => {
    const r = [1, 3, 3, 2][f], c = [P.white, P.flameL, P.flame, P.flameD][f];
    p.set(4, 4, ink(P.white, 255, 1));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let i = 1; i <= r; i++) p.set(4 + dx * i, 4 + dy * i, ink(i === r ? P.flameD : c, 255, 1));
    if (f > 0 && f < 3) { p.set(2, 2, ink(P.flameL, 255, 1)); p.set(6, 6, ink(P.flameL, 255, 1)); }
  }, NO);
  o.fx_smoke = mk(16, 16, 4, (p, f) => {
    const r = 3 + f * 1.4, a = [230, 190, 160, 135][f];
    p.circle(8, 12 - f * 2, r, ink(P.steelDD, a)); p.circle(7, 11 - f * 2, r * 0.7, ink(P.steelD, a)); p.circle(6, 10 - f * 2, r * 0.35, ink(P.steel, a));
  }, NO);
  o.fx_fire = mk(16, 16, 4, (p, f) => {
    const sw = [0, 1, 0, -1][f];
    p.poly([[8, 15], [3, 10], [5 + sw, 6], [7, 1 + (f & 1)], [9 + sw, 5], [12, 9], [13, 12]], ink(P.flameD, 255, 0.8));
    p.poly([[8, 15], [4, 11], [6 + sw, 7], [8, 3 + (f & 1)], [10, 8], [12, 11]], ink(P.flame, 255, 0.9));
    p.poly([[8, 14], [6, 11], [7 + sw, 8], [9, 10], [10, 12]], ink(P.flameL, 255, 1));
  }, NO);
  o.fx_speed = mk(24, 3, 1, (p) => { for (let x = 0; x < 24; x++) p.set(x, 1, ink(P.white, Math.round(40 + x * 9))); p.hline(14, 0, 8, ink(P.cheeseL, 90)); p.hline(16, 2, 7, ink(P.cheeseL, 90)); }, NO);
  o.fx_stink = mk(24, 24, 4, (p, f) => {
    for (let i = 0; i < 4; i++) { const t = (f + i) & 3, x = 5 + i * 4 + (t & 1), y = 20 - t * 4; p.circle(x, y, 3 - (t > 2 ? 1 : 0), ink(i & 1 ? P.mold : P.pickle, 190 - t * 30)); p.set(x - 1, y - 1, ink(P.pickle, 160)); }
    for (let s = 0; s < 3; s++) p.set(4 + s * 7 + (f & 1), 3 + f, ink(P.pickleD, 220));
  }, NO);
  o.fx_boost = mk(32, 24, 4, (p, f) => {
    const L = [24, 30, 26, 32][f];
    p.poly([[0, 12], [L * 0.6, 6], [L, 12], [L * 0.6, 18]], ink(P.flameD, 255, 0.8));
    p.poly([[0, 12], [L * 0.5, 8], [L * 0.85, 12], [L * 0.5, 16]], ink(P.flame, 255, 0.9));
    p.poly([[0, 12], [L * 0.35, 10], [L * 0.6, 12], [L * 0.35, 14]], ink(P.flameL, 255, 1));
    for (let i = 0; i < 6; i++) p.set(Math.floor(hash2(i, f, 4) * 28), 4 + Math.floor(hash2(i, f, 5) * 16), ink(P.white, 255, 1));
    p.line(0, 3 + f, 12, 5, ink(P.cheeseL, 140)); p.line(0, 21 - f, 12, 19, ink(P.cheeseL, 140));
  }, NO);
  o.fx_confetti = mk(6, 6, 4, (p, f) => {
    const c = [P.scarf, P.cheese, P.glass, P.green][f];
    if (f & 1) { p.rect(1, 2, 4, 2, c); p.set(2, 2, P.white); } else { p.rect(2, 1, 2, 4, c); p.set(2, 1, P.white); }
    if (f === 2) { p.set(0, 0, ink(P.cheeseL)); }
  }, NO);
  o.fx_cheese_crumb = mk(6, 6, 2, (p, f) => {
    p.poly([[1, 4], [3, 1], [5, 4]], P.cheese); p.set(2, 3, P.cheeseL); p.set(4 - f, 4, P.cheeseD); if (f) p.set(0, 0, P.rind);
  }, NO);

  // ------------------------------------------------------------ ui
  o.hud_frame = mk(320, 200, 1, (p) => {
    const panel = (x, y, w, h) => { p.rect(x, y, w, h, ink(P.hudBg, 150)); p.frame(x, y, w, h, ink(P.hudDim, 220)); p.hline(x + 1, y, w - 2, ink(P.hudTxt, 230)); };
    panel(2, 2, 58, 20); panel(260, 2, 58, 20); panel(2, 176, 86, 22); panel(110, 184, 100, 14); panel(230, 150, 88, 48);
    for (const [x, y, fx, fy] of [[0, 0, 1, 1], [319, 0, -1, 1], [0, 199, 1, -1], [319, 199, -1, -1]]) {
      for (let i = 0; i < 8; i++) { p.set(x + fx * i, y, P.cheese); p.set(x, y + fy * i, P.cheese); }
      p.set(x + fx, y + fy, P.cheeseD);
    }
    for (let i = 0; i < 6; i++) { p.set(62 + i * 3, 4, ink(P.cheese, 200)); p.set(257 - i * 3, 4, ink(P.cheese, 200)); }
  }, NO);
  o.hud_heat = mk(48, 8, 1, (p) => {
    p.rect(0, 0, 48, 8, P.outline); p.rect(1, 1, 46, 6, P.black);
    for (let x = 2; x < 46; x++) { const t = (x - 2) / 43, c = t < 0.5 ? P.heatLo : t < 0.8 ? P.flame : P.heatHi; p.vline(x, 2, 4, c); p.set(x, 2, shade(c, 1.3)); p.set(x, 5, shade(c, 0.75)); }
    for (let x = 12; x < 46; x += 11) p.vline(x, 1, 6, P.outline);
    p.vline(0, 1, 6, P.hudDim); p.vline(47, 1, 6, P.hudDim); for (const [cx, cy] of [[0, 0], [47, 0], [0, 7], [47, 7]]) p.erase(cx, cy);
  }, NO);
  o.hud_icons = mk(96, 12, 8, (p, f) => {
    for (let i = 0; i < 8; i++) {
      const x = i * 12, lit = i === f, c = lit ? 1.25 : 1;
      p.rect(x + 1, 1, 10, 10, ink(P.hudBg, 200)); p.frame(x + 1, 1, 10, 10, lit ? P.hudTxt : P.hudDim);
      const q = (px, py, col) => p.set(x + px, py, shade(col, c));
      if (i === 0) { for (let k = 0; k < 6; k++) p.vline(x + 3 + k, 3 + (k & 1), 6 - (k & 1), P.cheese); }                 // position cup
      if (i === 1) { p.circle(x + 6, 6, 3, P.steel); p.hline(x + 4, 6, 5, P.black); q(6, 6, P.white); }                 // lap
      if (i === 2) { p.poly([[x + 3, 9], [x + 6, 2], [x + 9, 9]], shade(P.flame, c)); p.rect(x + 5, 6, 2, 3, shade(P.flameL, c)); }   // heat
      if (i === 3) { p.rect(x + 3, 4, 6, 5, shade(P.steel, c)); p.rect(x + 3, 4, 6, 1, P.white); p.rect(x + 3, 6, 6, 2, shade(P.scBlue, c)); }   // tuna
      if (i === 4) { p.circle(x + 6, 6, 3, shade(P.scarf, c)); p.rect(x + 5, 4, 2, 5, P.white); p.rect(x + 4, 5, 4, 2, P.white); }   // health
      if (i === 5) { p.rect(x + 3, 3, 6, 6, shade(P.cheese, c)); p.set(x + 5, 5, P.cheeseHole); p.set(x + 7, 7, P.cheeseHole); }   // coin/cheese
      if (i === 6) { p.poly([[x + 3, 3], [x + 9, 6], [x + 3, 9]], shade(P.green, c)); }                                 // go / speed
      if (i === 7) { p.circle(x + 5, 5, 1.5, shade(P.cheese, c)); p.circle(x + 7, 7, 1.5, shade(P.nose, c)); p.set(x + 4, 4, P.white); }   // whisker/collar
    }
  }, NO);
  o.cursor_paw = mk(12, 12, 2, (p, f) => {
    const y = f ? 1 : 0;
    p.circle(6, 8 + y, 3.5, P.fur); p.circle(2, 4 + y, 1.5, P.fur); p.circle(5, 2 + y, 1.5, P.fur); p.circle(8, 2 + y, 1.5, P.fur); p.circle(10, 4 + y, 1.5, P.fur);
    p.circle(6, 9 + y, 1.5, P.nose); p.set(5, 7 + y, P.furL);
  });
  o.shop_parts = mk(24, 24, 5, (p, f) => {
    if (f === 0) { p.rect(4, 8, 16, 12, P.steelD); p.rect(4, 8, 16, 3, P.steel); for (let i = 0; i < 4; i++) p.rect(6 + i * 4, 4, 2, 5, P.steelDD); p.circle(12, 14, 3, P.flame); }
    if (f === 1) { p.circle(12, 12, 9, P.glassD); p.circle(12, 12, 7, P.glass); for (let i = 0; i < 4; i++) { const t = i * Math.PI / 4; p.line(12 + Math.cos(t) * 6, 12 + Math.sin(t) * 6, 12 - Math.cos(t) * 6, 12 - Math.sin(t) * 6, P.white); } }
    if (f === 2) { p.circle(12, 12, 9, P.tire); p.circle(12, 12, 4, P.steel); for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; p.set(12 + Math.cos(t) * 8, 12 + Math.sin(t) * 8, P.asphaltL); } }
    if (f === 3) { p.poly([[12, 2], [21, 6], [19, 17], [12, 22], [5, 17], [3, 6]], P.steelD); p.poly([[12, 4], [19, 7], [17, 16], [12, 20]], P.steel); p.set(12, 11, P.cheese); }
    if (f === 4) { p.poly([[4, 12], [10, 6], [10, 18]], P.steelD); p.rect(10, 7, 9, 10, P.steel); p.poly([[19, 7], [23, 12], [19, 17]], P.flame); p.poly([[19, 9], [22, 12], [19, 15]], P.flameL); }
  });
  return o;
}
