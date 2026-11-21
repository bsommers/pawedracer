// Retro character art: HUD/radio portraits, announcer mice, podium figures and the PAWED RACER logo.
// Deterministic PixBuf art, palette from defs.PAL, 1 px PAL.outline.
import { PixBuf, ink, shade, mix } from './pixbuf.js';
import { PAL } from '../core/defs.js';

const P = PAL, OUT = P.outline;

/** Drawing context in head-local coordinates (origin at head centre) with scale s. */
function ctx(pb, cx, cy, s) {
  const X = (x) => cx + x * s, Y = (y) => cy + y * s;
  return {
    e: (x, y, rx, ry, c) => pb.ellipse(X(x), Y(y), Math.max(0.6, rx * s), Math.max(0.6, ry * s), c),
    poly: (pts, c) => pb.poly(pts.map(([x, y]) => [X(x), Y(y)]), c),
    line: (a, b, c, d, col) => pb.line(X(a), Y(b), X(c), Y(d), col),
    px: (x, y, c) => pb.set(Math.round(X(x)), Math.round(Y(y)), c),
    rect: (x, y, w, h, c) => pb.rect(Math.round(X(x)), Math.round(Y(y)), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), c),
  };
}

/** Colby head, front view, centre of face at origin (about 30 wide, 28 tall at s=1). */
function colbyHead(pb, cx, cy, s, expr, o = {}) {
  const c = ctx(pb, cx, cy, s);
  // ears (outer fur, pink inner); with a pith hat they poke out of the sides
  const ey = o.hat ? -3 : -9;
  c.poly([[-15, ey + 8], [-14, ey - 8], [-3, ey - 1]], P.furD); c.poly([[15, ey + 8], [14, ey - 8], [3, ey - 1]], P.furD);
  c.poly([[-13, ey + 6], [-13, ey - 4], [-6, ey]], P.nose); c.poly([[13, ey + 6], [13, ey - 4], [6, ey]], P.nose);
  c.e(0, 2, 15, 13, P.furD); c.e(0, 1.4, 14.5, 12.5, P.fur);
  c.e(-5, -4, 5, 3, P.furL);
  // tabby stripes
  for (const x of [-4, 0, 4]) c.rect(x, -11, 1.6, 6 - Math.abs(x) * 0.3, P.stripe);
  c.rect(-14, 2, 4, 1.3, P.stripe); c.rect(-14, 6, 3, 1.3, P.stripe); c.rect(10, 2, 4, 1.3, P.stripe); c.rect(11, 6, 3, 1.3, P.stripe);
  // muzzle
  c.e(0, 8, 8.5, 5.5, P.cream); c.e(0, 6.5, 7, 3, shade(P.cream, 1.1));
  c.poly([[-2.5, 3.5], [2.5, 3.5], [0, 6.5]], P.nose);
  const hurt = expr === 'hurt', grin = expr === 'grin', happy = expr === 'happy' || expr === 'wink';
  // eyes
  const eye = (x, flip) => {
    if (hurt) { c.line(x - 3, -2, x + 3, 4, P.eyeD); c.line(x + 3, -2, x - 3, 4, P.eyeD); return; }
    if (grin || (happy && !(expr === 'wink' && flip))) {
      if (grin) { c.line(x - 3.5, 1, x, -2.5, P.eyeD); c.line(x, -2.5, x + 3.5, 1, P.eyeD); c.line(x - 3.5, 2, x, -1.5, P.eyeD); c.line(x, -1.5, x + 3.5, 2, P.eyeD); return; }
    }
    if (expr === 'wink' && flip) { c.line(x - 3.5, 1.5, x, -1, P.eyeD); c.line(x, -1, x + 3.5, 1.5, P.eyeD); return; }
    c.e(x, 0.5, 3.6, 4.2, P.eyeD); c.e(x, 0.5, 3.1, 3.7, P.eye); c.e(x, 1.3, 1.5, 2.6, P.eyeD);
    c.px(x - 1, -1.5, P.white); c.px(x, -1.5, P.white); c.px(x - 1, -0.5, P.white);
  };
  eye(-8, false); eye(8, true);
  // mouth
  if (grin) { c.e(0, 10.5, 4.5, 3.4, P.black); c.e(0, 12.2, 3, 1.4, P.nose); c.rect(-3, 8, 2, 1.5, P.white); c.rect(1, 8, 2, 1.5, P.white); }
  else if (hurt) { c.line(-4, 11, -2, 9.5, P.eyeD); c.line(-2, 9.5, 0, 11, P.eyeD); c.line(0, 11, 2, 9.5, P.eyeD); c.line(2, 9.5, 4, 11, P.eyeD); }
  else { c.line(0, 6.5, 0, 8.5, P.eyeD); c.line(-4, 9.5, -2, 10.5, P.eyeD); c.line(-2, 10.5, 0, 8.5, P.eyeD); c.line(0, 8.5, 2, 10.5, P.eyeD); c.line(2, 10.5, 4, 9.5, P.eyeD); }
  // whisker dots
  for (const [x, y] of [[-6, 7], [-4.5, 8.5], [6, 7], [4.5, 8.5]]) c.px(x, y, P.furD);
  if (o.hat) {
    c.e(0, -9.5, 17, 4, P.hatD); c.e(0, -10.5, 16, 3.2, P.hat);
    c.e(0, -15, 11, 8, P.hatD); c.e(-0.5, -15.5, 10.4, 7.4, P.hat); c.e(-4, -18, 4, 2.5, shade(P.hat, 1.25));
    c.rect(-10, -11, 20, 2, P.scarf);
    for (const x of [-6, 6]) { c.e(x, -10, 3.6, 3.2, P.steelDD); c.e(x, -10, 2.6, 2.3, P.glass); c.px(x - 1, -11, P.white); }
    c.rect(-3, -11, 6, 2, P.steelDD);
  } else if (o.goggles) {
    c.rect(-14, -8, 28, 2, P.black);
    for (const x of [-6, 6]) { c.e(x, -7, 3.8, 3.4, P.steelDD); c.e(x, -7, 2.8, 2.5, P.glass); c.px(x - 1, -8, P.white); }
  }
  if (o.scarf !== false) {
    c.e(0, 17, 13, 4, P.scarf); c.e(0, 16, 12, 3, P.scarfL); c.e(0, 17.5, 12, 3, P.scarf);
    c.poly([[2, 18], [9, 18], [10, 27], [5, 25]], P.scarf); c.line(4, 19, 4, 24, P.scarfL);
  }
}

/** Pete's head, front view: gaunt, big ears, red eyes, buck teeth. expr: snarl | laugh | shock. */
function peteHead(pb, cx, cy, s, expr) {
  const c = ctx(pb, cx, cy, s);
  // huge round ears
  for (const sx of [-1, 1]) { c.e(sx * 13, -10, 9, 9.5, P.peteFurD); c.e(sx * 13, -10, 6.5, 7, P.peteEar); c.e(sx * 13, -9, 4, 4.5, shade(P.peteEar, 0.8)); }
  // head and spiky mangy tufts
  c.e(0, -2, 11.5, 14, P.peteFurD); c.e(0, -2.5, 11, 13.5, P.peteFur);
  for (const x of [-8, -4, 0, 4, 8]) c.poly([[x - 2.5, -12], [x + (x < 0 ? -1 : 1) * 0.5, -19 - ((x + 8) % 8 === 0 ? 1 : 3)], [x + 2.5, -12]], P.peteFur);
  c.e(-4, -9, 3, 2, shade(P.peteFur, 1.4));
  // long muzzle
  c.poly([[-6, 2], [6, 2], [2.5, 17], [-2.5, 17]], P.peteFur);
  c.poly([[-6, 2], [-2, 2], [-1, 17], [-2.5, 17]], shade(P.peteFur, 1.25));
  c.e(0, 17, 3.2, 2.4, P.nose);
  // eyes: red glow
  const shock = expr === 'shock', laugh = expr === 'laugh';
  for (const sx of [-1, 1]) {
    const x = sx * 5.5;
    if (laugh) { c.line(x - 3.5 * sx, 0, x, -3, P.peteEye); c.line(x, -3, x + 3.5 * sx, 0, P.peteEye); c.line(x - 3.5 * sx, 1.2, x, -1.8, P.peteEye); c.line(x, -1.8, x + 3.5 * sx, 1.2, P.peteEye); continue; }
    c.e(x, -1, shock ? 4.6 : 3.8, shock ? 5 : 3.2, P.black);
    c.e(x, -1, shock ? 4 : 3.2, shock ? 4.4 : 2.6, shock ? P.peteFoam : P.peteEye);
    c.e(x, -1, shock ? 1.2 : 1, shock ? 1.6 : 2.2, shock ? P.peteEye : P.black);
    c.px(x - 1 * sx, -2, P.flameL);
    if (!shock) c.line(x - sx * 4.5, -5.5 + 2 * 0, x + sx * 3, -3.2, P.black);   // angry brow
    else c.line(x - 3, -6.5, x + 3, -6.5, P.peteFurD);
  }
  // mouth + teeth + foam
  if (expr === 'snarl') {
    c.e(0, 11, 5.5, 3, P.black); c.rect(-3, 9, 2, 5, P.peteFoam); c.rect(1, 9, 2, 5, P.peteFoam);
    c.px(-4, 12, P.peteFoam); c.px(4, 12, P.peteFoam); c.px(-1, 17.5, P.peteFoam); c.px(-1, 19, P.peteFoam); c.px(2, 18.5, P.peteFoam);
  } else if (laugh) {
    c.e(0, 11.5, 6, 5, P.black); c.e(0, 13.5, 4, 2.4, P.nose); c.rect(-3, 7.5, 6, 2.4, P.peteFoam);
    c.px(-7, 2, P.glassD); c.px(-7, 3, P.glass); c.px(7, 2, P.glassD); c.px(7, 3, P.glass);   // tears of joy
  } else {
    c.e(0, 12, 2.6, 3.4, P.black); c.rect(-1.5, 8.5, 3, 2.4, P.peteFoam);
    c.px(11, -6, P.glass); c.px(11, -5, P.glassD);
  }
  // whiskers
  for (const sx of [-1, 1]) { c.line(sx * 5, 8, sx * 14, 6, P.peteFoam); c.line(sx * 5, 10, sx * 14, 11, P.peteFoam); }
  // scrap armour and strap
  c.poly([[-16, 26], [-9, 18], [9, 18], [16, 26]], P.peteArmor); c.poly([[-16, 26], [-9, 18], [-6, 18], [-12, 26]], P.peteArmorL);
  c.rect(-1, 18, 2, 8, P.black);
  for (const [x, y] of [[-9, 22], [9, 22], [-4, 24], [4, 24]]) c.px(x, y, P.steel);
}

function portraitColby() {
  return ['idle', 'grin', 'hurt'].map((ex) => {
    const pb = new PixBuf(48, 48);
    colbyHead(pb, 24, 24, 0.86, ex, { hat: true });
    if (ex === 'grin') { pb.set(5, 8, P.flameL); pb.set(5, 7, P.flame); pb.set(43, 10, P.flameL); pb.hline(2, 30, 3, P.white); pb.hline(44, 33, 3, P.white); }
    if (ex === 'hurt') { pb.set(40, 12, P.glass); pb.set(40, 13, P.glassD); for (const [x, y] of [[8, 6], [40, 5]]) { pb.set(x, y, P.cheese); pb.set(x - 1, y, P.cheeseL); pb.set(x + 1, y, P.cheeseL); pb.set(x, y - 1, P.cheeseL); pb.set(x, y + 1, P.cheeseL); } }
    return pb.outline(OUT, { diagonal: true });
  });
}

function portraitPete() {
  return ['snarl', 'laugh', 'shock'].map((ex) => {
    const pb = new PixBuf(48, 48);
    peteHead(pb, 24, 26, 0.9, ex);
    return pb.outline(OUT, { diagonal: true });
  });
}

function portraitSuper() {
  return ['happy', 'wink'].map((ex) => {
    const pb = new PixBuf(48, 48);
    // orange cape behind, blue shirt with C shield
    pb.poly([[0, 47], [4, 30], [44, 30], [47, 47]], P.scCape);
    pb.poly([[4, 47], [8, 34], [40, 34], [44, 47]], shade(P.scCape, 0.7));
    pb.poly([[10, 47], [13, 36], [35, 36], [38, 47]], P.scBlue);
    pb.poly([[10, 47], [13, 36], [18, 36], [16, 47]], shade(P.scBlue, 1.2));
    pb.poly([[19, 38], [29, 38], [29, 44], [24, 47], [19, 44]], P.scRed);
    pb.poly([[20, 39], [28, 39], [28, 43], [24, 46], [20, 43]], P.scYellow);
    pb.rect(22, 40, 4, 1, P.scRed); pb.rect(22, 40, 1, 4, P.scRed); pb.rect(22, 43, 4, 1, P.scRed);
    colbyHead(pb, 24, 19, 0.82, ex, { goggles: true, scarf: false });
    pb.rect(8, 28, 5, 3, P.scYellow);   // cape clasp
    pb.rect(35, 28, 5, 3, P.scYellow);
    if (ex === 'wink') { pb.set(37, 8, P.white); pb.hline(35, 8, 5, P.white); pb.vline(37, 6, 5, P.white); }
    return pb.outline(OUT, { diagonal: true });
  });
}

function mouse(kind, open) {
  const pb = new PixBuf(32, 32);
  const fur = kind === 'a' ? '#9a9aa8' : '#b8844a', furD = shade(fur, 0.75), ear = P.nose;
  // suit shoulders
  const suit = kind === 'a' ? P.blueD : P.mold;
  pb.ellipse(16, 31, 12, 6, suit); pb.ellipse(16, 31, 12, 6, suit); pb.hline(10, 27, 12, shade(suit, 1.25));
  if (kind === 'b') { pb.poly([[13, 27], [19, 27], [16, 30]], P.scRed); pb.poly([[13, 27], [13, 31], [16, 30]], P.scRed); pb.poly([[19, 27], [19, 31], [16, 30]], P.scRed); pb.set(16, 29, P.black); }
  else { pb.rect(14, 26, 4, 4, P.white); pb.poly([[15, 27], [17, 27], [16, 30]], P.scRed); }
  // ears
  pb.circle(6, 9, 6, furD); pb.circle(26, 9, 6, furD); pb.circle(6, 9, 4, ear); pb.circle(26, 9, 4, ear);
  pb.ellipse(16, 17, 9.5, 8.5, fur); pb.ellipse(14, 14, 4, 2.5, shade(fur, 1.25));
  pb.ellipse(16, 21, 5, 3.5, P.cream);
  // headset
  pb.line(6, 12, 8, 4, P.steelDD); pb.line(8, 4, 24, 4, P.steelDD); pb.line(24, 4, 26, 12, P.steelDD);
  pb.rect(3, 12, 4, 6, P.black); pb.rect(25, 12, 4, 6, P.black); pb.set(4, 13, P.steel);
  pb.line(27, 17, 22, 23, P.steelDD); pb.circle(21, 23, 1.6, P.black); pb.set(20, 22, P.steel);
  // face
  if (kind === 'b') { pb.ring(12, 15, 3.5, 3.5, P.black, 1); pb.ring(20, 15, 3.5, 3.5, P.black, 1); pb.hline(15, 15, 2, P.black); pb.set(12, 15, P.black); pb.set(20, 15, P.black); }
  else { pb.rect(11, 14, 2, 3, P.black); pb.rect(19, 14, 2, 3, P.black); pb.set(11, 14, P.white); pb.set(19, 14, P.white); }
  pb.circle(16, 19, 1.4, P.nose);
  if (open) { pb.ellipse(16, 23, 2.6, 2.2, P.black); pb.set(16, 24, P.nose); } else { pb.line(14, 22, 16, 23, P.furD); pb.line(16, 23, 18, 22, P.furD); }
  for (const sx of [-1, 1]) { pb.line(16 + sx * 3, 20, 16 + sx * 10, 18, P.white); pb.line(16 + sx * 3, 21, 16 + sx * 10, 23, P.white); }
  return pb.outline(OUT, { diagonal: true });
}

function podiumColby(pose) {
  const pb = new PixBuf(48, 64);
  // tail
  pb.line(34, 52, 40, 48, P.furD); pb.line(35, 52, 41, 48, P.fur); pb.line(40, 48, 43, 40, P.fur); pb.line(41, 48, 44, 40, P.furD); pb.set(43, 39, P.cream); pb.set(44, 39, P.cream);
  // legs and feet
  for (const x of [19, 29]) { pb.ellipse(x, 55, 4.5, 5, P.fur); pb.ellipse(x, 60.5, 5.5, 2.3, P.cream); pb.set(x - 2, 56, P.stripe); pb.set(x - 2, 57, P.stripe); }
  // body
  pb.ellipse(24, 46, 10, 11, P.fur); pb.ellipse(24, 48, 6, 8, P.cream);
  for (const y of [42, 46, 50]) { pb.hline(14, y, 3, P.stripe); pb.hline(31, y, 3, P.stripe); }
  pb.ellipse(24, 37, 8, 2.5, P.scarf); pb.rect(26, 38, 3, 8, P.scarf); pb.vline(27, 39, 6, P.scarfL);
  // arms
  const arm = (x0, y0, x1, y1) => { pb.line(x0, y0, x1, y1, P.fur); pb.line(x0 + 1, y0, x1 + 1, y1, P.fur); pb.line(x0 - 1, y0, x1 - 1, y1, P.furD); pb.circle(x1, y1, 2.2, P.cream); };
  if (pose === 0) { arm(15, 40, 13, 50); arm(33, 40, 35, 50); }
  else if (pose === 1) { arm(15, 40, 9, 28); arm(33, 40, 39, 28); pb.set(7, 25, P.flameL); pb.set(41, 25, P.flameL); pb.set(5, 27, P.cheese); pb.set(43, 27, P.cheese); }
  else { arm(15, 41, 10, 48); arm(33, 41, 38, 48); }
  const head = pose === 1 ? 'grin' : pose === 0 ? 'idle' : 'hurt';
  colbyHead(pb, 24, pose === 2 ? 28 : 26, 0.58, head, { hat: true, scarf: false });
  if (pose === 1) { pb.set(10, 8, P.cheese); pb.set(38, 10, P.cheese); pb.set(24, 4, P.flameL); }
  return pb.outline(OUT, { diagonal: true });
}

function podiumPete(pose) {
  const pb = new PixBuf(48, 64);
  // long tail
  for (let i = 0; i < 16; i++) { const x = 32 + i * 0.7, y = 58 - Math.sin(i / 3) * 4; pb.set(x, y, P.peteTail); pb.set(x, y + 1, shade(P.peteTail, 0.8)); }
  // legs, clawed feet
  for (const x of [19, 29]) { pb.rect(x - 2, 50, 4, 9, P.peteFur); pb.ellipse(x, 60.5, 5, 2.3, P.peteEar); pb.set(x - 3, 61, P.peteFoam); pb.set(x + 3, 61, P.peteFoam); }
  // hunched torso with armour
  pb.ellipse(24, 44, 9.5, 12, P.peteFurD); pb.ellipse(24, 45, 7, 9, P.peteFur);
  pb.poly([[14, 36], [34, 36], [32, 52], [16, 52]], P.peteArmor); pb.poly([[14, 36], [19, 36], [18, 52], [16, 52]], P.peteArmorL);
  pb.line(15, 36, 33, 50, P.black); pb.line(33, 36, 15, 50, P.black);
  for (const [x, y] of [[17, 40], [31, 40], [20, 48], [28, 48]]) pb.set(x, y, P.steel);
  pb.poly([[10, 34], [18, 33], [18, 38], [11, 38]], P.peteArmorL); pb.poly([[38, 34], [30, 33], [30, 38], [37, 38]], P.peteArmorL);
  const arm = (x0, y0, x1, y1) => { pb.line(x0, y0, x1, y1, P.peteFur); pb.line(x0 + 1, y0, x1 + 1, y1, P.peteFurD); pb.circle(x1, y1, 2, P.peteEar); };
  if (pose === 0) { pb.rect(14, 42, 20, 3, P.peteFur); pb.rect(14, 45, 20, 2, P.peteFurD); pb.circle(14, 43, 2, P.peteEar); pb.circle(34, 43, 2, P.peteEar); }   // smug crossed arms
  else if (pose === 1) { arm(12, 38, 6, 24); arm(36, 38, 42, 24); pb.set(5, 20, P.peteEye); pb.set(43, 20, P.peteEye); pb.set(3, 23, P.flame); pb.set(45, 23, P.flame); }
  else { arm(12, 38, 11, 52); arm(36, 38, 37, 52); }
  peteHead(pb, 24, pose === 2 ? 28 : 25, 0.52, pose === 0 ? 'laugh' : pose === 1 ? 'snarl' : 'shock');
  if (pose === 2) { pb.set(14, 20, P.glass); pb.set(14, 21, P.glassD); }
  return pb.outline(OUT, { diagonal: true });
}

// 5x7 block font for the logo
const GLYPH = {
  P: ['1111 ', '1   1', '1   1', '1111 ', '1    ', '1    ', '1    '],
  A: [' 111 ', '1   1', '1   1', '11111', '1   1', '1   1', '1   1'],
  W: ['1   1', '1   1', '1   1', '1 1 1', '1 1 1', '11 11', '1   1'],
  E: ['11111', '1    ', '1    ', '1111 ', '1    ', '1    ', '11111'],
  D: ['1111 ', '1   1', '1   1', '1   1', '1   1', '1   1', '1111 '],
  R: ['1111 ', '1   1', '1   1', '1111 ', '1 1  ', '1  1 ', '1   1'],
  C: [' 1111', '1    ', '1    ', '1    ', '1    ', '1    ', ' 1111'],
};

function logo() {
  const pb = new PixBuf(200, 48), text = 'PAWED RACER';
  const sx = 3, sy = 3, adv = 17, shear = 2;
  const layer = new PixBuf(200, 48);
  let x0 = 4;
  const glyphs = [];
  for (const ch of text) { if (ch !== ' ') glyphs.push([ch, x0]); x0 += ch === ' ' ? 9 : adv; }
  const gy = 10;
  for (const [ch, gx] of glyphs) {
    GLYPH[ch].forEach((row, r) => [...row].forEach((v, cI) => {
      if (v !== '1') return;
      for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) {
        const y = gy + r * sy + j, x = gx + cI * sx + i + Math.round((gy + 7 * sy - y) / 21 * shear);
        layer.set(x, y, P.cheese);
      }
    }));
  }
  // extrusion (rind brown, 3 px down-right), then cheese face on top
  const ext = new PixBuf(200, 48);
  for (let d = 2; d >= 1; d--) ext.blit(layer, d, d);
  ext.map((x, y, p) => (p.a >= 128 ? (hasRow(layer, x, y) ? undefined : P.rindD) : undefined));
  pb.blit(ext);
  // paint face: light top rows, shade bottom rows, holes
  layer.map((x, y, p) => (p.a < 128 ? undefined : y < gy + 4 ? P.cheeseL : y > gy + 17 ? P.cheeseD : P.cheese));
  pb.blit(layer);
  for (const [x, y] of [[8, 17], [26, 24], [45, 16], [62, 25], [83, 18], [104, 25], [123, 17], [140, 24], [160, 18], [180, 25]]) if (layer.has(x, y)) { pb.set(x, y, P.cheeseHole); pb.set(x + 1, y, P.cheeseHole); }
  // speed stripes under the text and a tiny flame trailing from the final R
  pb.rect(6, 38, 130, 2, P.scarf); pb.rect(12, 41, 100, 1, P.flame); pb.rect(8, 43, 60, 1, P.cheese);
  pb.rect(140, 38, 50, 2, P.pickle); pb.rect(150, 41, 40, 1, P.pickleD);
  // checkered flag dots at the top
  for (let i = 0; i < 30; i++) pb.set(4 + i * 6, 3 + (i & 1), (i & 1) ? P.white : P.black);
  return pb.outline(OUT, { diagonal: true });
}
function hasRow(layer, x, y) { return layer.has(x, y); }

export function build() {
  return {
    portrait_colby: { frames: portraitColby(), w: 48, h: 48 },
    portrait_pete: { frames: portraitPete(), w: 48, h: 48 },
    portrait_supercolby: { frames: portraitSuper(), w: 48, h: 48 },
    portrait_mouse_a: { frames: [mouse('a', false), mouse('a', true)], w: 32, h: 32 },
    portrait_mouse_b: { frames: [mouse('b', false), mouse('b', true)], w: 32, h: 32 },
    colby_podium: { frames: [0, 1, 2].map(podiumColby), w: 48, h: 64 },
    pete_podium: { frames: [0, 1, 2].map(podiumPete), w: 48, h: 64 },
    logo: { frames: [logo()], w: 200, h: 48 },
  };
}
