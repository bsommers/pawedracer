// Mock generator: offline, deterministic placeholder art drawn procedurally from the bible (no network, no uploads, no reference ever leaves the machine).
// Not a substitute for real art: it makes the whole pipeline (post-process, check, export) testable and gives a charming stand-in.
import { newImage, resize, blit, hex, unhex } from '../lib/image.mjs';
import { ellipse, polygon, line, mulberry, fill } from '../lib/draw.mjs';
export const PAPER = '#c4bcb4';
const SC = 2; // supersample
function figure(img, b, view, cx, base, H, rnd, shot, expression) {
  const C = b.colors, out = C.outline, rat = /rat|mouse|mice/i.test(b.species), gaunt = /gaunt|thin|lanky/i.test(b.build), fur = C.fur || C.skin || C.body, o = Math.max(2, H * 0.012) * SC;
  const bw = H * (gaunt ? 0.27 : 0.3), bh = H * (gaunt ? 0.3 : 0.3), by = base - H * 0.3, hr = H * (gaunt ? 0.15 : 0.24), hy = by - bh * 0.95 - hr * 0.55 - (gaunt ? 0 : 0), side = view === 'side', hx = cx + (side ? -hr * 0.12 : 0) + (gaunt ? -hr * 0.2 : 0);
  const sh = (x, y, rx, ry, c, rot = 0) => { ellipse(img, x, y, rx + o, ry + o, out, rot); ellipse(img, x, y, rx, ry, c, rot); };
  if (shot === 'expression') { /* head only handled by caller via H scale */ }
  // tail
  const tdir = side ? 1 : 1, tc = rat ? C.skin || fur : fur;
  for (let i = 0; i < 14; i++) { const t = i / 13, x = cx + tdir * (bw * 0.7 + t * H * 0.3), y = base - H * 0.22 - Math.sin(t * 2.6 + rnd() * 0.05) * H * 0.18 - t * H * 0.1, r = (rat ? 0.012 : 0.026) * H * (1 - t * 0.3); ellipse(img, x, y, r + o, r + o, out); }
  for (let i = 0; i < 14; i++) { const t = i / 13, x = cx + tdir * (bw * 0.7 + t * H * 0.3), y = base - H * 0.22 - Math.sin(t * 2.6) * H * 0.18 - t * H * 0.1, r = (rat ? 0.012 : 0.026) * H * (1 - t * 0.3); ellipse(img, x, y, r, r, i > 10 && C.cream ? C.cream : (!rat && i % 3 === 1 && C.stripes) || tc); }
  // legs and feet
  for (const s of side ? [-0.25, 0.25] : [-0.55, 0.55]) { sh(cx + s * bw, base - H * 0.04, H * 0.055, H * 0.045, C.cream || fur); }
  // cape behind
  if (C.cape) polygon(img, [[cx - bw * 0.9, by - bh * 0.7], [cx + bw * 0.9, by - bh * 0.7], [cx + bw * 1.5, base - H * 0.05], [cx - bw * 1.5, base - H * 0.05]], C.cape);
  // body, armour/shirt, belly
  sh(cx, by, bw, bh, fur); if (C.shirt) ellipse(img, cx, by - bh * 0.28, bw * 0.98, bh * 0.62, C.shirt); if (C.armor) ellipse(img, cx, by - bh * 0.1, bw * 0.85, bh * 0.6, C.armor);
  if (C.cream && !gaunt) ellipse(img, cx, by + bh * 0.3, bw * 0.62, bh * 0.5, C.cream);
  if (C.shield) { polygon(img, [[cx - bw * 0.35, by - bh * 0.7], [cx + bw * 0.35, by - bh * 0.7], [cx, by - bh * 0.1]], out); polygon(img, [[cx - bw * 0.3, by - bh * 0.66], [cx + bw * 0.3, by - bh * 0.66], [cx, by - bh * 0.17]], C.shield); if (C.emblem) ellipse(img, cx, by - bh * 0.5, bw * 0.12, bw * 0.12, C.emblem); }
  if (C.stripes) for (let i = -1; i <= 1; i += 2) line(img, cx + i * bw * 0.85, by + bh * 0.1, cx + i * bw * 0.6, by + bh * 0.25, H * 0.012, C.stripes);
  // arms
  for (const s of side ? [0.1] : [-1, 1]) sh(cx + s * (bw + H * 0.03), by + bh * 0.05, H * 0.04, H * 0.11, C.shirt || fur, s * 0.15);
  // ears
  const ec = C.ear || C.skin || fur;
  for (const s of side ? [0.4] : [-1, 1]) { const ex = hx + s * hr * 0.7, ey = hy - hr * 0.8;
    if (rat) { sh(ex, ey, hr * 0.42, hr * 0.5, fur); ellipse(img, ex, ey, hr * 0.28, hr * 0.36, ec); }
    else { const P = [[ex - hr * 0.35, ey + hr * 0.5], [ex + s * hr * 0.15, ey - hr * 0.7], [ex + hr * 0.35, ey + hr * 0.5]]; polygon(img, P.map(([x, y]) => [x + (x < ex ? -o : o), y - o * 0.5]), out); polygon(img, P, fur); polygon(img, [[ex - hr * 0.18, ey + hr * 0.4], [ex + s * hr * 0.1, ey - hr * 0.35], [ex + hr * 0.18, ey + hr * 0.4]], ec); } }
  // head
  sh(hx, hy, hr * (gaunt ? 0.85 : 1.05), hr, fur); if (C.stripes) for (let i = -1; i <= 1; i++) line(img, hx + i * hr * 0.25, hy - hr * 0.95, hx + i * hr * 0.22, hy - hr * 0.55, H * 0.012, C.stripes);
  const mz = side ? -hr * 0.6 : 0; ellipse(img, hx + mz, hy + hr * 0.4, hr * (rat ? 0.4 : 0.55), hr * (rat ? 0.32 : 0.38), rat ? fur : C.cream || fur);
  // face
  const ex = expression || 'neutral', angry = /angry|snarl|sneer|determined/.test(ex), happy = /happy|smug|laugh|heroic/.test(ex), scared = /scared|surprised/.test(ex);
  const eyeC = C.eyes || '#ffffff', er = hr * (scared ? 0.26 : 0.2);
  for (const s of side ? [-0.45] : [-0.42, 0.42]) { const x = hx + s * hr + (side ? 0 : 0); ellipse(img, x, hy - hr * 0.05, er + o * 0.7, er * (angry ? 0.8 : 1.15) + o * 0.7, out); ellipse(img, x, hy - hr * 0.05, er, er * (angry ? 0.8 : 1.15), rat ? eyeC : '#ffffff'); if (!rat) ellipse(img, x, hy - hr * 0.05, er * 0.7, er * 0.9, eyeC); ellipse(img, x + er * 0.1, hy - hr * 0.05, er * 0.34, er * 0.5, out);
    if (angry) line(img, x - er * 1.1, hy - hr * (s < 0 ? 0.42 : 0.3) - (s < 0 ? 0 : 0), x + er * 1.1, hy - hr * (s < 0 ? 0.3 : 0.42), H * 0.012, out); }
  ellipse(img, hx + mz, hy + hr * 0.22, hr * 0.1, hr * 0.07, C.nose || C.skin || '#e88a8a');
  const mw = hr * 0.22, my = hy + hr * 0.5; if (happy) { for (let i = 0; i < 8; i++) { const t = i / 7, x = hx + mz - mw + t * mw * 2, y = my + Math.sin(t * Math.PI) * hr * 0.1; ellipse(img, x, y, H * 0.007, H * 0.007, out); } } else if (scared || angry) { ellipse(img, hx + mz, my + hr * 0.05, mw * 0.6, hr * (angry ? 0.12 : 0.16), out); if (rat && C.tooth) polygon(img, [[hx + mz - mw * 0.3, my], [hx + mz + mw * 0.3, my], [hx + mz, my + hr * 0.2]], C.tooth); } else line(img, hx + mz - mw, my, hx + mz + mw, my, H * 0.01, out);
  if (C.goggles && /racer|goggles/.test(JSON.stringify(b.outfit))) ellipse(img, hx, hy - hr * 0.85, hr * 0.5, hr * 0.12, C.goggles);
}
const toRetro = (img, b, scale) => { const small = resize(img, Math.max(8, Math.floor(img.w / scale)), Math.max(8, Math.floor(img.h / scale))); const pal = Object.values(b.colors).map(unhex).concat([unhex(PAPER)]);
  for (let i = 0; i < small.w * small.h; i++) { const o = i * 4; small.rgba[o + 3] = small.rgba[o + 3] > 127 ? 255 : 0; let best = 0, bd = 1e9; pal.forEach((p, k) => { const d = (p[0] - small.rgba[o]) ** 2 + (p[1] - small.rgba[o + 1]) ** 2 + (p[2] - small.rgba[o + 2]) ** 2; if (d < bd) { bd = d; best = k; } }); small.rgba[o] = pal[best][0]; small.rgba[o + 1] = pal[best][1]; small.rgba[o + 2] = pal[best][2]; }
  const out = newImage(img.w, img.h); for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const s = (Math.floor(y / scale) * small.w + Math.floor(x / scale)) * 4; if (s < small.rgba.length) out.rgba.set(small.rgba.subarray(s, s + 4), (y * img.w + x) * 4); } return out; };
export const mock = {
  name: 'mock', network: false,
  async generate({ bible, style = 'toon', shot = 'turnaround', seed = 1, size, expression }) {
    const [W, Hh] = size, rnd = mulberry(seed), img = newImage(W * SC, Hh * SC); fill(img, PAPER);
    const H = Hh * SC * (shot === 'turnaround' ? 0.72 : shot === 'expression' ? 1.25 : 0.8), base = Hh * SC * (shot === 'expression' ? 1.36 : 0.86);
    if (shot === 'turnaround') { figure(img, bible, 'front', W * SC * 0.24, base, H, rnd, shot); figure(img, bible, 'side', W * SC * 0.66, base, H, rnd, shot); }
    else figure(img, bible, 'front', W * SC * 0.5, base, H, rnd, shot, expression);
    let out = resize(img, W, Hh);
    if (style === 'retro') out = toRetro(out, bible, Math.max(2, Math.round(Hh / 64)));
    else if (style === 'photo') for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4, g = 1 - 0.25 * (y / Hh) + (((x * 7 + y * 13) % 5) - 2) * 0.006; for (let k = 0; k < 3; k++) out.rgba[o + k] = Math.max(0, Math.min(255, out.rgba[o + k] * g)); }
    else if (style === 'ghibli') { const soft = resize(resize(out, Math.round(W * 0.8), Math.round(Hh * 0.8)), W, Hh); out = soft; }
    return { image: out, model: `mock-procedural/1.0 (${style})`, note: 'procedural placeholder drawn from the bible; no network' };
  },
};
