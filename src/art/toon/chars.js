// Toon character art: portraits, announcer mice, podium figures and the PAWED RACER logo (house style of learning/ sheets).
import { PAL, TOON_PAL as TP } from '../../core/defs.js';
import { Cv, sprite, shade, light, mixc, OUT, PI2 } from './vec.js';

const CREAM = TP.colbyCream, FUR = TP.colbyFur, STR = TP.colbyStripe, GREEN = TP.colbyEye, PINK = TP.colbyEar;

function eye(c, x, y, r, look = 0, mood = 'open') {
  if (mood === 'x') { c.line(x - r * 0.7, y - r * 0.7, x + r * 0.7, y + r * 0.7, r * 0.35, OUT); c.line(x + r * 0.7, y - r * 0.7, x - r * 0.7, y + r * 0.7, r * 0.35, OUT); return; }
  if (mood === 'happy') { c.curve([[x - r, y + r * 0.3], [x, y - r * 0.7], [x + r, y + r * 0.3]], r * 0.4, OUT); return; }
  c.ell(x, y, r, r * 1.12, '#fffdf0', 0.4);
  c.ell(x + look * r * 0.2, y + r * 0.05, r * 0.78, r * 0.9, GREEN, 0);
  c.ell(x + look * r * 0.25, y + r * 0.1, r * 0.36, r * 0.55, OUT, 0);
  c.ell(x + r * 0.1, y - r * 0.35, r * 0.2, r * 0.2, '#ffffff', 0);
}

/** Colby head (front). centre cx,cy, half-width ~ 10*s. expr: idle | grin | hurt | smug */
export function colbyHead(c, cx, cy, s, expr = 'idle', o = {}) {
  const X = (v) => cx + v * s, Y = (v) => cy + v * s;
  // ears
  for (const sx of [-1, 1]) {
    c.cel([[X(sx * 3), Y(-6)], [X(sx * 9.5), Y(-15.5)], [X(sx * 11.2), Y(-4)]], FUR);
    c.poly([[X(sx * 4.8), Y(-6.4)], [X(sx * 9), Y(-13)], [X(sx * 10), Y(-5.5)]], PINK, 0);
  }
  c.cel(c.blobPts([[X(-11.8), Y(-1)], [X(-10.2), Y(-8)], [X(-5.5), Y(-11.6)], [X(0), Y(-12.2)], [X(5.5), Y(-11.6)], [X(10.2), Y(-8)], [X(11.8), Y(-1)], [X(10.5), Y(6)], [X(5), Y(10.5)], [X(-5), Y(10.5)], [X(-10.5), Y(6)]], 5), FUR, shade(FUR, 0.22), 0.6);
  // forehead + cheek stripes
  for (const dx of [-3, 0, 3]) c.poly([[X(dx - 0.8), Y(-10.6)], [X(dx + 0.8), Y(-10.6)], [X(dx * 0.7 + 0.5), Y(-5.5 + Math.abs(dx) * 0.4)], [X(dx * 0.7 - 0.5), Y(-5.5 + Math.abs(dx) * 0.4)]], STR, 0);
  for (const sx of [-1, 1]) for (const k of [0, 1.8]) c.poly([[X(sx * 11), Y(1.5 + k)], [X(sx * 7), Y(2.2 + k)], [X(sx * 7), Y(3.4 + k)], [X(sx * 11), Y(2.8 + k)]], STR, 0);
  // muzzle
  c.ell(X(0), Y(5.4), 5.3 * s, 3.9 * s, CREAM, 0);
  c.ell(X(-2.4), Y(5.2), 3 * s, 2.5 * s, CREAM, 0); c.ell(X(2.4), Y(5.2), 3 * s, 2.5 * s, CREAM, 0);
  const mood = expr === 'hurt' ? 'x' : expr === 'smug' ? 'open' : 'open';
  eye(c, X(-4.4), Y(-0.4), 2.9 * s, 0, expr === 'hurt' ? 'x' : 'open'); eye(c, X(4.4), Y(-0.4), 2.9 * s, 0, expr === 'hurt' ? 'x' : 'open');
  void mood;
  if (expr === 'smug') { c.line(X(-8), Y(-4.4), X(-1.8), Y(-3.2), 0.9 * s * 0.5, OUT); }
  c.poly([[X(-1.5), Y(3.1)], [X(1.5), Y(3.1)], [X(0), Y(4.7)]], PAL.nose, 0.3 * s);
  if (expr === 'grin') {
    c.poly([[X(-3.6), Y(5.8)], [X(3.6), Y(5.8)], [X(2.6), Y(9)], [X(0), Y(10)], [X(-2.6), Y(9)]], '#7a1f2a', 0.35 * s);
    c.ell(X(0), Y(9), 1.7 * s, 0.9 * s, '#ff8fa3', 0);
  } else if (expr === 'hurt') {
    c.ell(X(0), Y(7.8), 1.5 * s, 1.1 * s, '#7a1f2a', 0.35 * s);
  } else {
    c.curve([[X(-3.4), Y(6.6)], [X(-1.7), Y(7.8)], [X(0), Y(6.2)], [X(1.7), Y(7.8)], [X(3.4), Y(6.6)]], 0.35 * s, OUT);
  }
  for (const sx of [-1, 1]) for (const k of [-0.8, 1, 2.8]) c.line(X(sx * 6), Y(5 + k * 0.6), X(sx * 14), Y(3.4 + k * 1.3), 0.18 * s, '#efe6d2');
  if (o.goggles) {
    c.stroke([[X(-11.5), Y(-3)], [X(11.5), Y(-3)]], 1.1 * s, '#7a5a2a');
    for (const sx of [-1, 1]) { c.ell(X(sx * 4.6), Y(-3.2), 4.4 * s, 3.6 * s, '#9fe6ff', 0.55); c.ell(X(sx * 3.8), Y(-4.2), 1.2 * s, 0.7 * s, '#ffffff', 0, -0.5); }
  }
  if (o.bump) c.poly([[X(7), Y(-9)], [X(10), Y(-8)], [X(9.4), Y(-5)], [X(6.4), Y(-6)]], '#ff6a58', 0.4);
}

/** Pete head: gaunt, long snout, big mauve ears, red eyes. expr: snarl | laugh | shocked */
export function peteHead(c, cx, cy, s, expr = 'snarl') {
  const X = (v) => cx + v * s, Y = (v) => cy + v * s, F = TP.peteFur, FS = TP.peteShade;
  for (const sx of [-1, 1]) { c.cel(c.ellPts(X(sx * 9.5), Y(-7.5), 5.2 * s, 5.8 * s, sx * 0.35), TP.peteSkin, shade(TP.peteSkin, 0.3), 0.55); c.ell(X(sx * 9.5), Y(-7), 3 * s, 3.5 * s, '#c58a88', 0, sx * 0.35); }
  c.cel(c.blobPts([[X(-8), Y(-3)], [X(-5.5), Y(-9)], [X(0), Y(-10.5)], [X(5.5), Y(-9)], [X(8), Y(-3)], [X(6.4), Y(4)], [X(3.2), Y(11)], [X(-3.2), Y(11)], [X(-6.4), Y(4)]], 5), F, FS, 0.6);
  // mangy fur tufts
  for (const [x, y, dx] of [[-8, -4, -2.4], [8, -4, 2.4], [-6.6, 3, -2.4], [6.6, 3, 2.4], [-2, -10, -1], [2.4, -10.4, 1.4]]) c.poly([[X(x), Y(y - 1.4)], [X(x + dx), Y(y)], [X(x), Y(y + 1.4)]], F, 0.4);
  // brow and eyes
  const sh = expr === 'shocked', lg = expr === 'laugh';
  for (const sx of [-1, 1]) {
    if (lg) { c.curve([[X(sx * 6.2), Y(-1.4)], [X(sx * 3.6), Y(-3.3)], [X(sx * 1.4), Y(-1.6)]], 0.9 * s, PAL.peteEye); }
    else {
      c.ell(X(sx * 3.8), Y(-2), (sh ? 3.1 : 2.6) * s, (sh ? 3.1 : 2.1) * s, sh ? '#fff6e0' : '#ff2a30', 0.5);
      c.ell(X(sx * 3.8), Y(-2), (sh ? 0.8 : 1.4) * s, (sh ? 0.8 : 1.4) * s, sh ? '#e0262e' : '#ffe0a0', 0);
      if (!sh) c.glow(X(sx * 3.8), Y(-2), 5 * s, '#ff2a30', 0.35);
    }
    c.poly([[X(sx * 7.6), Y(-5.8)], [X(sx * 7.6), Y(-4.4 + (sh ? -1.5 : 0))], [X(sx * 1.2), Y(sh ? -5.2 : -1.2)], [X(sx * 1.4), Y(sh ? -6.6 : -2.8)]], FS, 0.35);
  }
  // snout
  c.cel(c.ellPts(X(0), Y(5.5), 4.6 * s, 4.4 * s), '#6a5a52', '#4a3a34', 0.5);
  c.ell(X(0), Y(2.4), 1.8 * s, 1.3 * s, TP.peteSkin, 0.45);
  // mouth
  if (expr === 'snarl' || lg) {
    c.poly([[X(-3.6), Y(6)], [X(3.6), Y(6)], [X(3), Y(10.4)], [X(0), Y(11.6)], [X(-3), Y(10.4)]], '#4a1018', 0.45 * s);
    c.poly([[X(-3), Y(6)], [X(-1.5), Y(6)], [X(-2.2), Y(9)]], TP.peteTooth, 0.25 * s); c.poly([[X(3), Y(6)], [X(1.5), Y(6)], [X(2.2), Y(9)]], TP.peteTooth, 0.25 * s);
    c.ell(X(0), Y(10.2), 1.6 * s, 0.8 * s, '#ff8fa3', 0);
    c.poly([[X(-3.4), Y(10.4)], [X(-2.6), Y(10.4)], [X(-3), Y(13)]], '#f1ead8', 0.2); c.poly([[X(2.6), Y(10.6)], [X(3.4), Y(10.6)], [X(3.2), Y(12.6)]], '#f1ead8', 0.2);
  } else {
    c.ell(X(0), Y(8.6), 1.6 * s, 2 * s, '#4a1018', 0.45 * s);
    c.poly([[X(-1.1), Y(6.6)], [X(-0.2), Y(6.6)], [X(-0.6), Y(8.4)]], TP.peteTooth, 0.2);
  }
  for (const sx of [-1, 1]) for (const k of [-1, 1]) c.line(X(sx * 4), Y(5 + k), X(sx * 13), Y(4 + k * 2.4), 0.14 * s, '#d8d0c4');
}

function mouse(c, fur, ear, o, talk) {
  c.celEll(8, 8, 5, 5, ear, null); c.celEll(24, 8, 5, 5, ear, null);
  c.cel(c.blobPts([[6, 17], [8, 10], [16, 7], [24, 10], [26, 17], [22, 25], [16, 27], [10, 25]], 5), fur);
  c.ell(16, 21, 4, 3, light(fur, 0.35), 0);
  c.ell(16, 19.4, 1.4, 1, PINK, 0.3);
  for (const x of [11.2, 20.8]) { c.ell(x, 15, 2.1, 2.4, '#fffdf0', 0.4); c.ell(x, 15.3, 0.9, 1.2, OUT, 0); }
  if (talk) c.ell(16, 23.4, 1.8, 1.4, '#7a1f2a', 0.3); else c.curve([[14, 22.6], [16, 23.8], [18, 22.6]], 0.35, OUT);
  c.poly([[15.4, 24.4], [16.6, 24.4], [16.4, 26], [15.6, 26]], '#fff6e0', 0.2);
  if (o.glasses) { c.stroke(c.ellPts(11.2, 15, 3.2, 3.2), 0.5, OUT, true); c.stroke(c.ellPts(20.8, 15, 3.2, 3.2), 0.5, OUT, true); c.line(14.4, 15, 17.6, 15, 0.5, OUT); }
  // headset + mic
  c.stroke([[6.4, 12], [8, 3.8], [16, 2], [24, 3.8], [25.6, 12]], 1.4, o.head, false);
  for (const x of [6, 26]) c.celRR(x - 1.8, 10.6, 3.6, 6, 1.4, o.head, null);
  c.stroke([[26, 16.6], [24, 24], [19, 25.2]], 0.7, OUT);
  c.celEll(18.4, 25.2, 1.7, 1.4, '#3a3a45', null);
}

function colbyBody(c, cx, top, o) {
  // chubby torso (cream belly), used for podium figures; feet at bottom of canvas
  const { arms = [0, 0], cape, shirt } = o;
  if (cape) c.cel([[cx - 9, top + 2], [cx + 9, top + 2], [cx + 14, top + 30], [cx + 8, top + 34], [cx - 8, top + 34], [cx - 14, top + 30]], cape, shade(cape, 0.3));
  c.cel(c.blobPts([[cx - 8, top + 6], [cx, top + 4], [cx + 8, top + 6], [cx + 10, top + 18], [cx + 8, top + 28], [cx, top + 30], [cx - 8, top + 28], [cx - 10, top + 18]], 5), FUR);
  c.ell(cx, top + 19, 6, 8, CREAM, 0);
  if (shirt) { c.cel([[cx - 8.6, top + 6], [cx + 8.6, top + 6], [cx + 9.6, top + 14], [cx - 9.6, top + 14]], shirt); c.poly([[cx - 3.5, top + 7.4], [cx + 3.5, top + 7.4], [cx + 3.5, top + 11], [cx, top + 13.6], [cx - 3.5, top + 11]], PAL.scYellow, 0.4); c.poly([[cx - 1.6, top + 8.6], [cx + 1.8, top + 8.6], [cx + 1.8, top + 9.6], [cx - 0.6, top + 9.6], [cx - 0.6, top + 11], [cx + 1.8, top + 11], [cx + 1.8, top + 12], [cx - 1.6, top + 12]], PAL.scRed, 0.15); }
  for (const dx of [-5, -3, 3, 5]) c.line(cx + dx, top + 22, cx + dx * 1.5, top + 24.6, 0.7, STR);
  // arms
  [[-1, arms[0]], [1, arms[1]]].forEach(([sx, up]) => {
    const sh = [cx + sx * 8, top + 9], hand = [cx + sx * (11 + up * 2), top + 18 - up * 15];
    c.stroke([sh, [sh[0] + sx * 2.4, (sh[1] + hand[1]) / 2], hand], 5.4, OUT); c.stroke([sh, [sh[0] + sx * 2.4, (sh[1] + hand[1]) / 2], hand], 4, shirt ?? FUR);
    c.celEll(hand[0], hand[1], 3.2, 3, CREAM, null);
  });
  // legs + feet
  for (const sx of [-1, 1]) { c.cel(c.blobPts([[cx + sx * 7, top + 26], [cx + sx * 7.6, top + 30], [cx + sx * 6.6, top + 33], [cx + sx * 2.4, top + 33], [cx + sx * 2, top + 28]], 4), FUR); c.celEll(cx + sx * 5.6, top + 34.6, 4.4, 2.6, CREAM, null); }
}

export function build() {
  const o = {};
  o.portrait_colby = sprite(48, 48, 3, (c, f) => {
    c.rect(0, 0, 48, 48, '#f6b86a', 0); c.fill([[0, 0], [48, 0], [48, 48], [0, 48]], '#ffcf88');
    for (let i = 0; i < 6; i++) c.fill([[24, 54], [24 + Math.cos(i * 1.05) * 60, 54 + Math.sin(i * 1.05) * 60 - 0], [24 + Math.cos(i * 1.05 + 0.5) * 60, 54 + Math.sin(i * 1.05 + 0.5) * 60]], '#ffc070');
    c.cel([[10, 48], [14, 40], [34, 40], [38, 48]], '#e84a3a', null, 0.6);
    colbyHead(c, 24, 25, 1.45, ['idle', 'grin', 'hurt'][f], { goggles: f === 1, bump: f === 2 });
  });
  o.portrait_pete = sprite(48, 48, 3, (c, f) => {
    c.fill([[0, 0], [48, 0], [48, 48], [0, 48]], '#5a4a56');
    for (let i = 0; i < 7; i++) c.fill([[24, 54], [24 + Math.cos(i * 0.9) * 64, 54 + Math.sin(i * 0.9) * 64], [24 + Math.cos(i * 0.9 + 0.45) * 64, 54 + Math.sin(i * 0.9 + 0.45) * 64]], '#6a5460');
    c.cel([[6, 48], [12, 38], [36, 38], [42, 48]], TP.peteArmor, null, 0.6);
    c.line(14, 38, 12, 48, 1.4, '#6a5a3a'); c.line(34, 38, 36, 48, 1.4, '#6a5a3a');
    peteHead(c, 24, 24, 1.6, ['snarl', 'laugh', 'shocked'][f]);
  });
  o.portrait_supercolby = sprite(48, 48, 2, (c, f) => {
    c.fill([[0, 0], [48, 0], [48, 48], [0, 48]], '#4fb0ff'); c.fill([[0, 30], [48, 30], [48, 48], [0, 48]], '#2e7acb');
    c.cel([[2, 48], [6, 34], [14, 30], [34, 30], [42, 34], [46, 48]], TP.scCape, null, 0.6);
    c.cel([[10, 48], [12, 38], [36, 38], [38, 48]], TP.scBlue, null, 0.6);
    c.poly([[19, 40], [29, 40], [29, 44], [24, 48], [19, 44]], PAL.scYellow, 0.5);
    colbyHead(c, 24, 22, 1.45, f ? 'grin' : 'smug');
  });
  o.portrait_mouse_a = sprite(32, 32, 2, (c, f) => { c.fill([[0, 0], [32, 0], [32, 32], [0, 32]], '#7a86c0'); mouse(c, '#b9b3ae', PINK, { head: '#f4d12e' }, f); });
  o.portrait_mouse_b = sprite(32, 32, 2, (c, f) => { c.fill([[0, 0], [32, 0], [32, 32], [0, 32]], '#c07a86'); mouse(c, '#a87a5a', '#f0b0a0', { head: '#4fb0ff', glasses: true }, f); });
  o.colby_podium = sprite(48, 64, 3, (c, f) => {
    const bob = [0, -1.5, 0][f], up = [0.4, 1, 0.4][f];
    c.rotT(0, 24, 40, 0, bob, () => { colbyBody(c, 24, 20, { arms: [up, up], shirt: null }); colbyHead(c, 24, 17, 1.0, 'grin'); });
    // trophy cheese wheel overhead on frame 1
    if (f === 1) { c.celEll(24, 4, 6, 3.4, PAL.cheese, shade(PAL.cheese, 0.3)); c.ell(22, 3.6, 1, 0.7, PAL.cheeseHole, 0); }
    for (const [x, y] of [[6, 14 + f * 2], [42, 10 - f]]) { c.poly([[x, y - 2.4], [x + 0.8, y - 0.8], [x + 2.4, y], [x + 0.8, y + 0.8], [x, y + 2.4], [x - 0.8, y + 0.8], [x - 2.4, y], [x - 0.8, y - 0.8]], '#ffe45a', 0.35); }
  });
  o.pete_podium = sprite(48, 64, 3, (c, f) => {
    const cx = 24, sx = [0, 0.8, -0.8][f];
    // hunched rat, scowling, shaking a fist (frames 1/2)
    c.stroke([[cx + 4, 56], [cx + 14, 60], [cx + 20, 52], [cx + 18, 46]], 1.8, OUT); c.stroke([[cx + 4, 56], [cx + 14, 60], [cx + 20, 52], [cx + 18, 46]], 0.9, TP.peteSkin);
    c.cel(c.blobPts([[cx - 10, 32], [cx, 28], [cx + 10, 33], [cx + 12, 48], [cx + 6, 60], [cx - 6, 60], [cx - 12, 48]], 5), TP.peteFur, TP.peteShade);
    c.cel([[cx - 9, 31], [cx + 9, 33], [cx + 8, 43], [cx - 8, 43]], TP.peteArmor, null, 0.5);
    c.cel(c.blobPts([[cx - 4, 62], [cx - 10, 62], [cx - 9, 59], [cx - 4, 59]], 3), TP.peteSkin);
    for (const x of [-6, 6]) c.celEll(cx + x, 62, 4.4, 1.8, TP.peteSkin, null);
    c.stroke([[cx - 9, 34], [cx - 14, 44], [cx - 12 + sx * 2, 50]], 3.6, OUT); c.stroke([[cx - 9, 34], [cx - 14, 44], [cx - 12 + sx * 2, 50]], 2.4, TP.peteFur);
    const fx = cx + 12 + sx * 2, fy = [48, 38 - f, 40 + f][f];
    c.stroke([[cx + 9, 34], [cx + 15, 40], [fx, fy]], 3.6, OUT); c.stroke([[cx + 9, 34], [cx + 15, 40], [fx, fy]], 2.4, TP.peteFur);
    c.celEll(fx, fy, 2.4, 2.4, TP.peteSkin, null);
    peteHead(c, cx + sx * 0.5, 20, 1.15, f ? 'snarl' : 'laugh');
  });
  o.logo = sprite(200, 48, 1, (c) => {
    // block letters PAWED RACER on a cheese wedge, chunky stroked glyphs
    const G = {
      P: [[[0, 1], [0, 0], [0.8, 0], [1, 0.25], [1, 0.45], [0.8, 0.6], [0, 0.6]], [[0, 0.6], [0, 1]]],
      A: [[[0, 1], [0.5, 0], [1, 1]], [[0.2, 0.62], [0.8, 0.62]]],
      W: [[[0, 0], [0.25, 1], [0.5, 0.35], [0.75, 1], [1, 0]]],
      E: [[[1, 0], [0, 0], [0, 1], [1, 1]], [[0, 0.5], [0.75, 0.5]]],
      D: [[[0, 0], [0, 1], [0.6, 1], [1, 0.7], [1, 0.3], [0.6, 0]], [[0, 0], [0.6, 0]]],
      R: [[[0, 1], [0, 0], [0.8, 0], [1, 0.25], [1, 0.4], [0.8, 0.55], [0, 0.55]], [[0.5, 0.55], [1, 1]]],
      C: [[[1, 0.15], [0.7, 0], [0.3, 0], [0, 0.25], [0, 0.75], [0.3, 1], [0.7, 1], [1, 0.85]]],
    };
    const word = (txt, x0, y0, lw, lh, gap, fillC, wOut, wIn) => {
      let x = x0; const strokes = [];
      for (const ch of txt) { if (ch === ' ') { x += lw * 0.6; continue; } for (const s of G[ch]) strokes.push(s.map(([u, v]) => [x + u * lw, y0 + v * lh])); x += lw + gap; }
      for (const s of strokes) c.stroke(s, wOut, OUT);
      for (const s of strokes) c.stroke(s, wIn, fillC);
      return x - gap;
    };
    // cheese wedge backdrop
    c.cel([[3, 40], [14, 6], [186, 4], [197, 38], [190, 44], [10, 46]], PAL.cheese, shade(PAL.cheese, 0.25), 0.9);
    for (const [x, y, r] of [[22, 33, 3], [176, 12, 2.6], [160, 36, 3.4], [44, 10, 2]]) c.ell(x, y, r, r * 0.8, PAL.cheeseHole, 0.4);
    word('PAWED', 15, 8, 26, 14, 5, '#e84a3a', 7, 4.2);
    word('RACER', 38, 31, 19, 10, 4, '#2e5fa8', 6.2, 3.6);
    // paw print tail
    c.celEll(178, 34, 3.4, 2.9, FUR, null); for (const [x, y] of [[173, 29], [177, 27.4], [181, 27.8], [184.6, 30]]) c.ell(x, y, 1.3, 1.6, FUR, 0.4);
  });
  return o;
}
void mixc; void PI2; void Cv;
