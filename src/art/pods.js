// Retro pods art: rear-view racing pods (Colby, Pete, five rivals), flame, shadow, barrel roll and wreck frames.
// Deterministic PixBuf art, palette from defs.PAL, 1 px PAL.outline on everything that is a body.
// Flame anchors (frame 2, level): Colby nozzles x=9,31 y=26; Pete nozzles x=11,37 y=30 (pod_flame is 12 wide, top row sits on y).
import { PixBuf, ink, shade, mix, hash2 } from './pixbuf.js';
import { PAL } from '../core/defs.js';

const P = PAL;
const OUT = P.outline;

/** Shear rows toward `steer` (-2..2): top leans, bottom row stays put. */
function lean(src, steer, k) {
  const o = new PixBuf(src.w, src.h);
  for (let y = 0; y < src.h; y++) {
    const dx = Math.round(steer * k * (1 - y / (src.h - 1)));
    for (let x = 0; x < src.w; x++) { const p = src.get(x, y); if (p.a > 0) o.set(x + dx, y, p); }
  }
  return o;
}

/** Rotate in the sprite plane about the centre, shrinking so the result stays inside the frame. */
function rot(src, deg, fit = true) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), w = src.w, h = src.h;
  const bw = w * Math.abs(c) + h * Math.abs(s), bh = w * Math.abs(s) + h * Math.abs(c);
  const k = fit ? Math.min(1, (w - 2) / bw, (h - 2) / bh) : 1;
  const o = new PixBuf(w, h), cx = w / 2, cy = h / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x + 0.5 - cx) / k, dy = (y + 0.5 - cy) / k;
    const sx = Math.floor(cx + dx * c + dy * s), sy = Math.floor(cy - dx * s + dy * c);
    const p = src.get(sx, sy);
    if (p && p.a > 0) o.set(x, y, p);
  }
  return o;
}

/** Shift so the lowest opaque row sits on `row`. */
function ground(src, row) {
  let maxY = 0;
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) if (src.has(x, y)) maxY = y;
  const o = new PixBuf(src.w, src.h);
  return o.blit(src, 0, row - maxY);
}

/** Light on the left rim, shadow on the right rim of an opaque layer. */
function edgeShade(layer, l, d) {
  for (let y = 0; y < layer.h; y++) {
    let x0 = -1, x1 = -1;
    for (let x = 0; x < layer.w; x++) if (layer.has(x, y)) { if (x0 < 0) x0 = x; x1 = x; }
    if (x0 < 0) continue;
    layer.set(x0, y, l); layer.set(x0 + 1, y, l); layer.set(x1, y, d); layer.set(x1 - 1, y, d);
  }
}

function hole(pb, x, y, r, c = P.cheeseHole) {
  pb.ellipse(x, y, r, r * 0.85, c);
  pb.hline(Math.floor(x - r + 1), Math.floor(y - r * 0.85), Math.max(1, Math.round(r)), shade(c, 0.7));
}

/** Rear-view pilot: ears, helmet, goggle strap, shoulders and an optional scarf streaming sideways. */
function pilot(pb, cx, cy, o) {
  const { fur, furD = shade(fur, 0.75), helm, helmD = shade(helm, 0.75), scarf } = o;
  pb.ellipse(cx, cy + 6.5, 5.5, 3, furD);
  pb.ellipse(cx, cy + 6, 5, 2.5, fur);
  pb.poly([[cx - 6.5, cy - 1], [cx - 6, cy - 6.5], [cx - 1.5, cy - 4]], furD);
  pb.poly([[cx + 6.5, cy - 1], [cx + 6, cy - 6.5], [cx + 1.5, cy - 4]], furD);
  pb.poly([[cx - 5.5, cy - 1], [cx - 5.3, cy - 5], [cx - 2.5, cy - 3.5]], fur);
  pb.poly([[cx + 5.5, cy - 1], [cx + 5.3, cy - 5], [cx + 2.5, cy - 3.5]], fur);
  pb.circle(cx, cy, 5.5, fur);
  pb.ellipse(cx, cy - 2.8, 5.6, 3.4, helm);
  pb.ellipse(cx + 2, cy - 3.6, 2.2, 1.2, shade(helm, 1.25));
  pb.hline(cx - 5, cy - 0.5, 11, helmD);
  pb.hline(cx - 5, cy, 11, P.black);   // goggle strap
  pb.rect(cx - 1, cy, 2, 2, P.steel);
  pb.hline(cx - 3, cy + 3, 2, furD); pb.hline(cx + 2, cy + 3, 2, furD);   // neck fur tufts   // strap buckle
  if (scarf) {
    pb.rect(cx - 4, cy + 5, 9, 2, scarf);
    pb.line(cx + 4, cy + 5, cx + 9, cy + 3, scarf);
    pb.line(cx + 4, cy + 6, cx + 10, cy + 5, scarf);
    pb.set(cx + 10, cy + 4, P.scarfL); pb.set(cx + 8, cy + 3, P.scarfL);
  }
}

/** Fondue-pot engine seen from behind. */
function pot(pb, cx, body, bodyD, rim) {
  pb.rect(cx - 2.5, 22, 5, 5, P.steelDD);
  pb.hline(cx - 2, 22, 4, P.steel);
  pb.hline(cx - 2, 26, 4, P.black);
  pb.ellipse(cx, 17, 4.2, 5.8, bodyD);
  pb.ellipse(cx - 0.5, 16.5, 3.6, 5.1, body);
  pb.ellipse(cx - 1.3, 14.5, 1.4, 2.4, shade(body, 1.35));
  for (const y of [18, 20]) pb.hline(cx - 2, y, 5, P.steelDD);
  pb.ellipse(cx, 11.5, 4.2, 1.6, rim);
  pb.set(cx - 4, 15, P.steelDD); pb.set(cx + 3, 15, P.steelDD);   // pot handles
}

/** Tuna-can thruster: round steel can end with a blue label ring and a glowing bore. */
function tuna(pb, cx, cy) {
  pb.circle(cx, cy, 3, P.blueD);
  pb.circle(cx, cy, 2.3, P.steel);
  pb.circle(cx, cy, 1.4, P.steelDD);
  pb.set(cx, cy, P.flameD); pb.set(cx - 1, cy - 1, P.steelD);
}

function colbyBase(spec) {
  const pb = new PixBuf(40, 28);
  const hull = new PixBuf(40, 28);
  hull.poly([[12, 10], [28, 10], [35, 25], [5, 25]], spec.hull.m);
  edgeShade(hull, spec.hull.l, spec.hull.d);
  hull.map((x, y, p) => (p.a >= 128 && y >= 21 ? (y === 21 ? spec.hull.rindD : (x + y) & 1 && y === 23 ? spec.hull.rindD : spec.hull.rind) : undefined));
  if (spec.holes !== false) {
    hole(hull, 17, 14.5, 1.4, spec.hull.hole); hole(hull, 23, 17, 2, spec.hull.hole); hole(hull, 13, 19.5, 1.7, spec.hull.hole);
    hole(hull, 28, 21, 1.2, spec.hull.hole);
  }
  if (spec.deco) spec.deco(hull);
  pb.blit(hull);
  if (spec.fin === 'fin') pb.poly([[18, 10], [20, 3], [22, 10]], spec.fin2 || spec.hull.d);
  if (spec.fin === 'antenna') { pb.vline(15, 4, 7, P.steelDD); pb.vline(25, 4, 7, P.steelDD); pb.rect(14, 3, 3, 2, P.flameD); pb.rect(24, 3, 3, 2, P.flameD); }
  if (spec.fin === 'bubble') pb.ellipse(20, 12, 7, 3.5, mix(P.glass, spec.hull.m, 0.35));
  pot(pb, 7, spec.pot.m, spec.pot.d, spec.pot.rim || P.steel);
  pot(pb, 33, spec.pot.m, spec.pot.d, spec.pot.rim || P.steel);
  tuna(pb, 15, 22); tuna(pb, 25, 22);
  pilot(pb, 20, 8, spec.pilot);
  return pb;
}

const COLBY = {
  hull: { m: P.cheese, d: P.cheeseD, l: P.cheeseL, rind: P.rind, rindD: P.rindD, hole: P.cheeseHole },
  pot: { m: P.fondue, d: P.fondueD, rim: P.steel },
  pilot: { fur: P.fur, furD: P.furD, helm: P.hat, helmD: P.hatD, scarf: P.scarf },
};

function bandL(c) { return ink(c); }
const RIVALS = [
  { hull: { m: P.brie, d: shade(P.brie, 0.78), l: P.white, rind: '#e8dcc0', rindD: '#b8a888', hole: '#d8ccaa' }, pot: { m: P.steelD, d: P.steelDD, rim: P.steel },
    pilot: { fur: '#8c8c9a', helm: P.scRed, scarf: P.cream }, fin: 'fin', fin2: P.steelD },
  { hull: { m: P.blue, d: P.blueD, l: shade(P.blue, 1.3), rind: P.blueD, rindD: shade(P.blueD, 0.7), hole: P.blueD }, pot: { m: P.mold, d: shade(P.mold, 0.7), rim: P.steelD },
    pilot: { fur: P.cream, helm: P.mold, scarf: P.glass }, fin: 'antenna',
    deco: (h) => { for (const [x, y] of [[12, 21], [19, 13], [27, 17], [22, 22], [16, 18]]) { h.set(x, y, P.mold); h.set(x + 1, y, P.mold); h.set(x, y + 1, shade(P.mold, 0.7)); } } },
  { hull: { m: P.parm, d: shade(P.parm, 0.72), l: shade(P.parm, 1.25), rind: P.sandD, rindD: shade(P.sandD, 0.7), hole: shade(P.parm, 0.62) }, pot: { m: P.sandD, d: shade(P.sandD, 0.7), rim: P.steelD },
    pilot: { fur: '#5a4a42', helm: P.steelD, scarf: P.flame }, holes: false,
    deco: (h) => { for (let y = 12; y < 21; y += 2) for (let x = 8; x < 33; x++) if (h.has(x, y) && ((x + y) & 3) === 0) h.set(x, y, shade(P.parm, 0.8)); } },
  { hull: { m: P.fondueD, d: shade(P.fondueD, 0.68), l: shade(P.fondueD, 1.3), rind: '#a82a10', rindD: '#701a08', hole: '#701a08' }, pot: { m: P.steelD, d: P.steelDD, rim: P.steel },
    pilot: { fur: P.furL, helm: P.black, scarf: P.cheese }, fin: 'bubble', holes: false,
    deco: (h) => { h.hline(11, 16, 18, P.cream); h.hline(12, 17, 16, P.cream); } },
  { hull: { m: P.mold, d: shade(P.mold, 0.65), l: shade(P.mold, 1.35), rind: P.pickleD, rindD: shade(P.pickleD, 0.7), hole: shade(P.mold, 0.6) }, pot: { m: P.flame, d: P.flameD, rim: P.steel },
    pilot: { fur: '#d8d0c0', helm: P.cheese, scarf: P.scRed }, fin: 'fin', fin2: P.cheese,
    deco: (h) => { for (const [x, y] of [[16, 15], [25, 14], [20, 20], [29, 22], [11, 23]]) { h.set(x, y, P.cheeseL); h.set(x + 1, y, P.cheese); } } },
];

function peteBase() {
  const pb = new PixBuf(48, 32);
  // exhaust stacks behind the hull
  for (const x of [7, 37]) { pb.rect(x, 5, 4, 12, P.steelDD); pb.vline(x, 5, 12, P.steelD); pb.ellipse(x + 2, 5, 2.5, 1.2, P.black); }
  // hull: rind, mold, scrap
  const hull = new PixBuf(48, 32);
  hull.poly([[13, 12], [35, 12], [44, 28], [4, 28]], P.rind);
  edgeShade(hull, shade(P.rind, 1.25), P.rindD);
  hull.map((x, y, p) => (p.a >= 128 && hash2(x, y, 7) < 0.08 ? P.rindD : undefined));
  for (const [x, y, rx, ry] of [[17, 15, 3, 2], [30, 14, 4, 2], [10, 24, 3, 2.5], [24, 21, 3.5, 2], [41, 24, 2.5, 2.5], [21, 12.5, 2, 1.5]]) hull.ellipse(x, y, rx, ry, P.mold);
  hull.map((x, y, p) => (p.a >= 128 && p.g > 110 && p.r < 90 && hash2(x, y, 3) < 0.35 ? shade(P.mold, 0.7) : undefined));
  pb.blit(hull);
  // scrap plates with rivets
  const plate = (x, y, w, h, c) => { pb.rect(x, y, w, h, c); pb.frame(x, y, w, h, shade(c, 0.6)); for (const [rx, ry] of [[x + 1, y + 1], [x + w - 2, y + 1], [x + 1, y + h - 2], [x + w - 2, y + h - 2]]) pb.set(rx, ry, P.steel); };
  plate(5, 19, 11, 6, P.steelD); plate(31, 16, 10, 7, P.peteArmor); plate(19, 22, 9, 4, P.steelDD);
  pb.line(5, 19, 16, 25, shade(P.steelD, 0.6));
  // twin barrels
  for (const cx of [9, 39]) {
    pb.rect(cx - 5, 15, 10, 12, P.steelDD); pb.vline(cx - 5, 15, 12, P.steelD); pb.vline(cx + 4, 15, 12, P.black);
    pb.hline(cx - 5, 18, 10, P.rind); pb.hline(cx - 5, 22, 10, P.rindD);
    pb.rect(cx - 3, 28, 6, 3, P.steelDD); pb.hline(cx - 2, 28, 4, P.steel); pb.hline(cx - 2, 30, 4, P.black);
  }
  // pickle-green fender
  pb.rect(3, 25, 42, 3, P.pickle); pb.hline(3, 27, 42, P.pickleD); pb.hline(5, 25, 38, shade(P.pickle, 1.3));
  pb.ellipse(4, 26.5, 2, 2, P.pickle); pb.ellipse(44, 26.5, 2, 2, P.pickle);
  for (const x of [8, 16, 24, 32, 40]) pb.set(x, 26, P.pickleD);
  // Pete: ears, head, red eyes in the mirrors, tail
  pb.ellipse(24, 15, 8, 3, P.peteArmor); pb.hline(17, 13, 14, P.peteArmorL);
  pb.poly([[14, 12], [18, 15], [22, 11]], P.steelD); pb.poly([[34, 12], [30, 15], [26, 11]], P.steelD);
  pb.circle(17, 5.5, 4.2, P.peteFurD); pb.circle(31, 5.5, 4.2, P.peteFurD);
  pb.circle(17, 5.5, 2.6, P.peteEar); pb.circle(31, 5.5, 2.6, P.peteEar);
  pb.ellipse(24, 9.5, 6.3, 5.8, P.peteFur);
  pb.ellipse(22, 8, 3, 2.2, shade(P.peteFur, 1.6));
  for (const x of [20, 22, 24, 26, 28]) pb.poly([[x - 1.2, 5.5], [x, 2 + (x & 2)], [x + 1.2, 5.5]], P.peteFurD);
  pb.line(18, 9, 30, 9, P.peteFurD);
  for (const [mx, dir] of [[11, 1], [37, -1]]) {
    pb.circle(mx, 9, 3.2, P.steelDD); pb.circle(mx, 9, 2.4, P.glassD);
    pb.rect(mx - 1, 9, 2, 1, P.peteEye); pb.set(mx, 8, P.flameL);
    pb.line(mx + dir * 3, 10, mx + dir * 6, 14, P.steelDD);
  }
  pb.set(19, 10, P.peteEye); pb.set(29, 10, P.peteEye);
  for (const [x, y] of [[24, 17], [26, 18], [26, 20], [24, 21], [22, 21], [22, 23], [24, 24]]) { pb.set(x, y, P.peteTail); pb.set(x + 1, y, shade(P.peteTail, 0.8)); }
  return pb;
}

function finish(pb, steer, k) {
  return lean(pb, steer, k).outline(OUT, { diagonal: true });
}

const frames5 = (base, k) => [-2, -1, 0, 1, 2].map((s) => finish(base, s, k));

function flame() {
  const out = [];
  const L = [14, 16, 12, 15], jit = [0, 1, -1, 0];
  for (let f = 0; f < 4; f++) {
    const pb = new PixBuf(12, 16), t = jit[f], l = L[f];
    pb.poly([[1.5, 0], [10.5, 0], [8, l * 0.55], [6 + t, l], [4, l * 0.55]], P.flameD);
    pb.poly([[2.8, 0], [9.2, 0], [7.4, l * 0.5], [6 + t, l * 0.78], [4.6, l * 0.5]], P.flame);
    pb.poly([[4.2, 0], [7.8, 0], [6.6, l * 0.38], [6 + t * 0.5, l * 0.52], [5.4, l * 0.38]], P.flameL);
    pb.setMat({ emit: 1 });
    out.push(pb);
  }
  return out;
}

function shadow() {
  const pb = new PixBuf(40, 8);
  pb.ellipse(20, 4, 19.5, 3.8, ink(P.black, { a: 80 }));
  pb.ellipse(20, 4, 15, 2.6, ink(P.black, { a: 150 }));
  return pb;
}

function wreck() {
  const scorch = { hull: { m: mix(P.cheese, P.black, 0.55), d: mix(P.cheeseD, P.black, 0.7), l: mix(P.cheeseL, P.black, 0.4), rind: mix(P.rind, P.black, 0.6), rindD: P.black, hole: P.black },
    pot: { m: mix(P.fondue, P.black, 0.6), d: mix(P.fondueD, P.black, 0.7), rim: P.steelDD }, pilot: { fur: mix(P.fur, P.black, 0.35), helm: mix(P.hat, P.black, 0.5), scarf: mix(P.scarf, P.black, 0.3) } };
  const out = [];
  for (let f = 0; f < 2; f++) {
    const base = colbyBase(scorch);
    // cracks and a bent engine
    base.line(18, 11, 21, 17, P.black); base.line(21, 17, 19, 21, P.black); base.line(29, 14, 26, 19, P.black);
    base.rect(2, 9 + f, 14, 2, P.black);   // dent on the left pot rim
    let pb = rot(base, f ? -9 : 9, true);
    pb = ground(pb, 26).outline(OUT, { diagonal: true });
    // smoke puffs and embers
    const puffs = f ? [[9, 7, 3], [17, 5, 3], [29, 6, 3]] : [[12, 6, 3], [22, 4, 2.5], [31, 8, 3]];
    for (const [x, y, r] of puffs) { pb.circle(x, y, r, mix(P.steelDD, P.black, 0.4)); pb.circle(x - 1, y - 1, r * 0.55, P.steelD); }
    for (const [x, y] of f ? [[24, 9], [14, 12]] : [[8, 13], [27, 11]]) { pb.set(x, y, P.flame); pb.set(x, y - 1, P.flameD); }
    pb.setMat({ emit: 0.6 }, 0, 0, 0, 0);
    out.push(pb);
  }
  return out;
}

export function build() {
  const out = {};
  const colby = colbyBase(COLBY);
  out.pod_colby = { frames: frames5(colby, 1.9), w: 40, h: 28 };
  out.pod_pete = { frames: frames5(peteBase(), 1.6), w: 48, h: 32 };
  RIVALS.forEach((r, i) => { out['pod_r' + (i + 1)] = { frames: frames5(colbyBase(r), 1.9), w: 40, h: 28 }; });
  out.pod_flame = { frames: flame(), w: 12, h: 16 };
  out.pod_shadow = { frames: [shadow()], w: 40, h: 8 };
  out.pod_roll = { frames: [0, 1, 2, 3, 4, 5].map((i) => rot(colby, i * 60, true).outline(OUT, { diagonal: true })), w: 40, h: 28 };
  out.pod_wreck = { frames: wreck(), w: 40, h: 28 };
  return out;
}
