// Tiny rasteriser on {w,h,rgba} images: ellipses, polygons, thick lines, all with 1px analytic-ish edge softness. Colours are #rrggbb strings or [r,g,b].
import { unhex } from './image.mjs';
const col = (c) => (typeof c === 'string' ? unhex(c) : c);
function put(img, x, y, c, a) {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h || a <= 0) return; const o = (y * img.w + x) * 4, A = Math.min(1, a), d = img.rgba[o + 3] / 255, oa = A + d * (1 - A);
  for (let k = 0; k < 3; k++) img.rgba[o + k] = (c[k] * A + img.rgba[o + k] * d * (1 - A)) / oa; img.rgba[o + 3] = oa * 255;
}
export function ellipse(img, cx, cy, rx, ry, color, rot = 0) {
  const c = col(color), m = Math.max(rx, ry) + 2, cs = Math.cos(rot), sn = Math.sin(rot);
  for (let y = Math.floor(cy - m); y <= cy + m; y++) for (let x = Math.floor(cx - m); x <= cx + m; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry, d = (Math.hypot(u, v) - 1) * Math.min(rx, ry);
    put(img, x, y, c, 0.5 - d);
  }
}
export function polygon(img, pts, color) {
  const c = col(color); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const S = 3; // 3x3 supersample coverage
  for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) { let n = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) { const px = x + (sx + 0.5) / S, py = y + (sy + 0.5) / S; let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) ins = !ins; } if (ins) n++; }
    if (n) put(img, x, y, c, n / (S * S)); }
}
export function line(img, x0, y0, x1, y1, w, color) {
  const c = col(color), L = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(L / (w * 0.25)));
  for (let i = 0; i <= steps; i++) { const t = i / steps; ellipse(img, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w / 2, w / 2, c); }
}
/** Shape with outline: draws the outline colour inflated by o, then the fill. fn(img, inflate, colour). */
export function outlined(img, o, outline, fill, fn) { fn(img, o, outline); fn(img, 0, fill); }
export function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function fill(img, color) { const c = col(color); for (let i = 0; i < img.w * img.h; i++) { img.rgba[i * 4] = c[0]; img.rgba[i * 4 + 1] = c[1]; img.rgba[i * 4 + 2] = c[2]; img.rgba[i * 4 + 3] = 255; } }
