// Consistency check: palette coverage, size/anchor, silhouette overlap (IoU) -> pass/fail verdict. Thresholds are calibrated on the two learning/ sheets
// (see test/char-pipeline.test.mjs): the reference sheets must pass against their own seed bibles.
import { extractPalette, bbox, crop } from './learn.mjs';
import { unhex, resize, newImage } from './image.mjs';
export const THRESH = Object.freeze({ paletteDist: 60, paletteCoverage: 0.6, pixelCoverage: 0.75, minFill: 0.45, maxFill: 0.99, anchorTol: 0.1, iou: 0.5, aspectTol: 0.55 });
const dist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
/** Palette: share of the bible's non-outline colours that have a dominant colour within paletteDist; plus the share of pixels near any bible colour. */
export function checkPalette(img, bible, th = THRESH) {
  const dom = extractPalette(img, { max: 16, minShare: 0.002 }).map((p) => ({ ...p, rgb: unhex(p.hex) })), want = Object.entries(bible.colors);
  const rows = want.map(([k, v]) => { const w = unhex(v); let best = null; for (const d of dom) { const q = dist(w, d.rgb); if (!best || q < best.d) best = { d: q, hex: d.hex }; } return { role: k, want: v, nearest: best?.hex || null, dist: best ? +best.d.toFixed(1) : null, ok: !!best && best.d <= th.paletteDist }; });
  let near = 0, tot = 0; const wp = want.map(([, v]) => unhex(v)); for (let i = 0; i < img.w * img.h; i += 3) { const o = i * 4; if (img.rgba[o + 3] < 250) continue; tot++; const c = [img.rgba[o], img.rgba[o + 1], img.rgba[o + 2]]; if (wp.some((w) => dist(w, c) <= th.paletteDist)) near++; }
  const px = tot ? near / tot : 0, cov = rows.filter((r) => r.ok).length / rows.length;
  return { name: 'palette', rows, coverage: +cov.toFixed(3), pixelCoverage: +px.toFixed(3), pass: cov >= th.paletteCoverage && px >= th.pixelCoverage, detail: `${rows.filter((r) => r.ok).length}/${rows.length} bible colours found (need ${th.paletteCoverage * 100}%), ${(px * 100).toFixed(0)}% of pixels on-palette (need ${th.pixelCoverage * 100}%)` };
}
/** Size + anchor for a canvas-fitted sprite (billboard/expression/pose). */
export function checkSizeAnchor(img, th = THRESH) {
  const bb = bbox(img); if (!bb) return { name: 'size-anchor', pass: false, detail: 'empty image' };
  const fill = bb.h / img.h, foot = (bb.y + bb.h) / img.h, cx = (bb.x + bb.w / 2) / img.w, ok = fill >= th.minFill && fill <= th.maxFill && Math.abs(cx - 0.5) <= th.anchorTol && foot >= 0.8;
  return { name: 'size-anchor', fill: +fill.toFixed(3), footY: +foot.toFixed(3), centreX: +cx.toFixed(3), pass: ok, detail: `fill ${fill.toFixed(2)}, feet at ${foot.toFixed(2)}, centre ${cx.toFixed(2)}` };
}
const mask = (img, n = 96) => { const bb = bbox(img); if (!bb) return null; const sub = crop(img, bb.x, bb.y, bb.w, bb.h), s = resize(sub, n, n); return Uint8Array.from({ length: n * n }, (_, i) => (s.rgba[i * 4 + 3] > 127 ? 1 : 0)); };
/** Silhouette IoU after normalising both to their bbox (shape only; scale/position removed); checkSilhouette adds a bbox aspect-ratio test because IoU alone cannot tell a bar from a disc. */
export function silhouetteIoU(a, b) { const A = mask(a), B = mask(b); if (!A || !B) return 0; let i = 0, u = 0; for (let k = 0; k < A.length; k++) { i += A[k] & B[k]; u += A[k] | B[k]; } return u ? i / u : 0; }
export function checkSilhouette(img, ref, th = THRESH) { const v = silhouetteIoU(img, ref), a = bbox(img), b = bbox(ref), r = a && b ? a.h / a.w / (b.h / b.w) : 0, okA = Math.abs(Math.log(r || 1e-9)) <= Math.log(1 + th.aspectTol); return { name: 'silhouette', iou: +v.toFixed(3), aspectRatio: +r.toFixed(3), pass: v >= th.iou && okA, detail: `IoU ${v.toFixed(2)} (need ${th.iou}), aspect ratio vs reference ${r.toFixed(2)} (within x${(1 + th.aspectTol).toFixed(2)})` }; }
/** items: [{label, image, kind}], opts: {bible, refs: {label->image}} -> verdict record {pass, items:[{label, checks, pass}], summary} */
export function consistencyCheck(items, { bible, ref = null, th = THRESH } = {}) {
  const rows = items.map((it) => { const checks = [checkPalette(it.image, bible, th)]; if (it.kind && it.kind !== 'turnaround') checks.push(checkSizeAnchor(it.image, th)); if (ref && it.kind === 'billboard') checks.push(checkSilhouette(it.image, ref, th)); return { label: it.label, kind: it.kind, checks, pass: checks.every((c) => c.pass) }; });
  return { pass: rows.every((r) => r.pass), items: rows, thresholds: th, summary: `${rows.filter((r) => r.pass).length}/${rows.length} items pass` };
}
