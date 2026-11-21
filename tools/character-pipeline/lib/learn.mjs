// Reference learning: dominant palette, background key + removal (feathered), component clean-up, per-view split, proportions, outline weight.
// Output is a reviewable identity-sheet JSON (a "bible patch"), not an embedding.
import { hex, newImage } from './image.mjs';
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
/** Background colour = per-channel median of the 1px border. */
export function keyColor(img) {
  const px = []; const add = (x, y) => { const o = (y * img.w + x) * 4; px.push([img.rgba[o], img.rgba[o + 1], img.rgba[o + 2]]); };
  for (let x = 0; x < img.w; x += 3) { add(x, 0); add(x, img.h - 1); } for (let y = 0; y < img.h; y += 3) { add(0, y); add(img.w - 1, y); }
  return [0, 1, 2].map((k) => px.map((p) => p[k]).sort((a, b) => a - b)[px.length >> 1]);
}
/** Returns a new image with alpha from distance to the key colour (feathered between t0 and t1); small detached blobs (captions, specks) dropped. */
export function removeBackground(img, { key = keyColor(img), t0 = 14, t1 = 34, minBlob = 0.02 } = {}) {
  const out = { w: img.w, h: img.h, rgba: new Uint8Array(img.rgba) }, n = img.w * img.h, a = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const d = Math.sqrt(d2([img.rgba[i * 4], img.rgba[i * 4 + 1], img.rgba[i * 4 + 2]], key)); a[i] = d <= t0 ? 0 : d >= t1 ? 255 : Math.round(((d - t0) / (t1 - t0)) * 255); }
  // connected components of a>127 (4-connected, iterative), keep those >= minBlob * largest
  const lab = new Int32Array(n), sizes = [0]; let L = 0; const st = new Int32Array(n);
  for (let s = 0; s < n; s++) { if (a[s] < 128 || lab[s]) continue; L++; let sp = 0, cnt = 0; st[sp++] = s; lab[s] = L;
    while (sp) { const i = st[--sp]; cnt++; const x = i % img.w, y = (i / img.w) | 0; for (const j of [x > 0 ? i - 1 : -1, x < img.w - 1 ? i + 1 : -1, y > 0 ? i - img.w : -1, y < img.h - 1 ? i + img.w : -1]) if (j >= 0 && !lab[j] && a[j] >= 128) { lab[j] = L; st[sp++] = j; } } sizes[L] = cnt; }
  const big = Math.max(0, ...sizes), keep = sizes.map((s) => s >= big * minBlob);
  // dilate kept mask by 2px so feathered edge pixels of kept blobs survive
  const km = new Uint8Array(n); for (let i = 0; i < n; i++) if (lab[i] && keep[lab[i]]) km[i] = 1;
  const km2 = new Uint8Array(n); for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { let f = 0; for (let dy = -2; dy <= 2 && !f; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < img.w && yy < img.h && km[yy * img.w + xx]) { f = 1; break; } } km2[y * img.w + x] = f; }
  for (let i = 0; i < n; i++) out.rgba[i * 4 + 3] = km2[i] ? a[i] : 0;
  return { image: out, key, blobs: sizes.length - 1, kept: keep.filter(Boolean).length - 0 };
}
/** Dominant palette of opaque pixels: 4-bit buckets, averaged, greedily de-duplicated by RGB distance. */
export function extractPalette(img, { max = 12, minShare = 0.004, minDist = 38, step = 2 } = {}) {
  const B = new Map(); let tot = 0;
  for (let y = 0; y < img.h; y += step) for (let x = 0; x < img.w; x += step) { const o = (y * img.w + x) * 4; if (img.rgba[o + 3] < 250) continue; const k = ((img.rgba[o] >> 4) << 8) | ((img.rgba[o + 1] >> 4) << 4) | (img.rgba[o + 2] >> 4); let e = B.get(k); if (!e) B.set(k, (e = [0, 0, 0, 0])); e[0]++; e[1] += img.rgba[o]; e[2] += img.rgba[o + 1]; e[3] += img.rgba[o + 2]; tot++; }
  const all = [...B.values()].map((e) => ({ rgb: [e[1] / e[0], e[2] / e[0], e[3] / e[0]], n: e[0] })).sort((a, b) => b.n - a.n), pal = [];
  for (const c of all) { const near = pal.find((p) => d2(p.rgb, c.rgb) < minDist * minDist); if (near) { near.n += c.n; continue; } if (pal.length < max * 3) pal.push({ ...c }); }
  return pal.sort((a, b) => b.n - a.n).filter((p) => p.n / tot >= minShare).slice(0, max).map((p) => ({ hex: hex(...p.rgb), share: +(p.n / tot).toFixed(4) }));
}
export function bbox(img, thr = 40) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1; for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.rgba[(y * img.w + x) * 4 + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
/** Split a turnaround into views at the widest empty vertical gaps (>= minGap px of empty columns). */
export function splitViews(img, { minGap = 24 } = {}) {
  const cols = new Uint8Array(img.w); for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.rgba[(y * img.w + x) * 4 + 3] > 40) cols[x] = 1;
  const views = []; let x = 0; while (x < img.w) { while (x < img.w && !cols[x]) x++; if (x >= img.w) break; let s = x, gap = 0, e = x; while (x < img.w && gap < minGap) { if (cols[x]) { gap = 0; e = x; } else gap++; x++; } views.push([s, e]); }
  return views.map(([s, e]) => { const sub = crop(img, s, 0, e - s + 1, img.h); return { x: s, w: e - s + 1, bbox: bbox(sub) && { ...bbox(sub), x: bbox(sub).x + s } }; });
}
export function crop(img, x, y, w, h) { const o = newImage(w, h); for (let j = 0; j < h; j++) { const s = ((y + j) * img.w + x) * 4; o.rgba.set(img.rgba.subarray(s, s + w * 4), j * w * 4); } return o; }
/** Median length (px) of dark runs across the silhouette edge = outline thickness estimate. */
export function outlineWeight(img, dark = 70) {
  const runs = []; for (let y = 0; y < img.h; y += 4) { let r = 0; for (let x = 0; x < img.w; x++) { const o = (y * img.w + x) * 4, isD = img.rgba[o + 3] > 200 && img.rgba[o] < dark && img.rgba[o + 1] < dark && img.rgba[o + 2] < dark; if (isD) r++; else { if (r >= 1 && r <= 40) runs.push(r); r = 0; } } }
  runs.sort((a, b) => a - b); return runs.length ? runs[runs.length >> 1] : 0;
}
/** Full identity sheet for one reference image. */
export function learnReference(img, name = 'reference') {
  const { image, key, kept } = removeBackground(img), views = splitViews(image).length > 1 ? splitViews(image) : [8, 3].map((g) => splitViews(image, { minGap: g })).find((v) => v.length > 1) || splitViews(image), palette = extractPalette(image), bb = bbox(image), ow = outlineWeight(image);
  const notes = [];
  if (views.length === 2) notes.push(`two views detected (front/side); heights ${views.map((v) => v.bbox?.h).join(' / ')} px`);
  if (ow) notes.push(`outline about ${ow}px at ${img.w}px width (${(ow / img.w * 1000).toFixed(1)} per mille)`);
  return { source: name, size: { w: img.w, h: img.h }, background: hex(...key), keptBlobs: kept, bbox: bb, views: views.map((v) => ({ x: v.x, w: v.w, bbox: v.bbox, aspect: v.bbox ? +(v.bbox.h / v.bbox.w).toFixed(3) : null })), outlineWeightPx: ow, palette, notes, cutout: image };
}

/** Gradient-tolerant background removal: flood from the image border, growing into pixels whose colour is close to the neighbour they were reached from
 *  (step) and not too far from the border seed (cap). Handles studio gradients and soft floor shadows that a single key colour cannot. */
export function floodMatte(img, { step = 9, cap = 70, erode = 1 } = {}) {
  const { w, h } = img, n = w * h, px = (i) => [img.rgba[i * 4], img.rgba[i * 4 + 1], img.rgba[i * 4 + 2]], bg = new Uint8Array(n), seed = new Int32Array(n).fill(-1), st = new Int32Array(n); let sp = 0;
  const push = (i, from) => { if (bg[i]) return; if (from >= 0) { if (Math.sqrt(d2(px(i), px(from))) > step || Math.sqrt(d2(px(i), px(seed[from]))) > cap) return; seed[i] = seed[from]; } else seed[i] = i; bg[i] = 1; st[sp++] = i; };
  for (let x = 0; x < w; x++) { push(x, -1); push((h - 1) * w + x, -1); } for (let y = 0; y < h; y++) { push(y * w, -1); push(y * w + w - 1, -1); }
  while (sp) { const i = st[--sp], x = i % w, y = (i / w) | 0; if (x > 0) push(i - 1, i); if (x < w - 1) push(i + 1, i); if (y > 0) push(i - w, i); if (y < h - 1) push(i + w, i); }
  let fg = new Uint8Array(n); for (let i = 0; i < n; i++) fg[i] = bg[i] ? 0 : 1;
  for (let e = 0; e < erode; e++) { const nx = new Uint8Array(fg); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (fg[i] && (!fg[i - 1] || !fg[i + 1] || !fg[i - w] || !fg[i + w])) nx[i] = 0; } fg = nx; }
  // keep only the largest foreground blob (drops floating specks and stray shadow islands)
  const lab = new Int32Array(n); let best = 0, bestL = 0, L = 0;
  for (let s0 = 0; s0 < n; s0++) { if (!fg[s0] || lab[s0]) continue; L++; let c = 0; sp = 0; st[sp++] = s0; lab[s0] = L; while (sp) { const i = st[--sp]; c++; const x = i % w, y = (i / w) | 0; for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && fg[j] && !lab[j]) { lab[j] = L; st[sp++] = j; } } if (c > best) { best = c; bestL = L; } }
  const out = { w, h, rgba: new Uint8Array(img.rgba) }; for (let i = 0; i < n; i++) out.rgba[i * 4 + 3] = lab[i] === bestL ? 255 : 0;
  return { image: out, key: px(0), blobs: L, kept: 1 };
}
