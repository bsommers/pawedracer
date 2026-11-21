// Toon vector layer: tiny deterministic polygon rasteriser over PixBuf at HI_SCALE. Pure JS (Node + browser), no Math.random.
// Everything is drawn in LOGICAL units (the ART manifest sizes); the surface is w*HI_SCALE x h*HI_SCALE.
// Look: clean near-black outline (stroked under the fill), flat cel fill, one crescent shade tone.
import { PixBuf } from '../pixbuf.js';
import { HI_SCALE as S, TOON_PAL } from '../../core/defs.js';

export const OUT = TOON_PAL.outline;
const rgbCache = new Map();
export function rgb(c) {
  if (Array.isArray(c)) return c;
  let v = rgbCache.get(c);
  if (!v) {
    let h = c.slice(1); if (h.length === 3) h = [...h].map((x) => x + x).join('');
    const n = parseInt(h.slice(0, 6), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; rgbCache.set(c, v);
  }
  return v;
}
const h2 = (n) => (Math.max(0, Math.min(255, Math.round(n))) | 256).toString(16).slice(1);
export function mixc(a, b, t) { const p = rgb(a), q = rgb(b); return '#' + h2(p[0] + (q[0] - p[0]) * t) + h2(p[1] + (q[1] - p[1]) * t) + h2(p[2] + (q[2] - p[2]) * t); }
/** one shade tone: darker and slightly purple-shifted, like the turnaround sheets */
export const shade = (c, t = 0.22) => mixc(c, '#2a1430', t);
export const light = (c, t = 0.3) => mixc(c, '#fff4d8', t);
export const PI2 = Math.PI * 2;
export const TAU = PI2;

/** deterministic hash noise 0..1 */
export function hash(x, y = 0, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export class Cv {
  constructor(w, h) {
    this.w = w; this.h = h; this.W = w * S; this.H = h * S;
    this.pb = new PixBuf(this.W, this.H); this.d = this.pb.rgba;
    this.T = null;      // optional point transform fn(x,y)->[x,y] in logical units
    this.ol = 0.55;     // default outline width (logical px)
  }
  P(x, y) { if (this.T) { const q = this.T(x, y); return [q[0] * S, q[1] * S]; } return [x * S, y * S]; }
  withT(T, fn) { const o = this.T; this.T = T; fn(); this.T = o; }
  /** rotate by a (rad) about (px,py) then translate (tx,ty) around the existing transform */
  rotT(a, px, py, tx, ty, fn, sx = 1, sy = 1) {
    const o = this.T, c = Math.cos(a), s = Math.sin(a);
    this.T = (x, y) => { const dx = (x - px) * sx, dy = (y - py) * sy, X = px + dx * c - dy * s + tx, Y = py + dx * s + dy * c + ty; return o ? o(X, Y) : [X, Y]; };
    fn(); this.T = o;
  }
  // ----------------------------------------------------------- device-space spans
  _span(y, x0, x1, c, a) {
    if (y < 0 || y >= this.H) return;
    x0 = Math.max(0, x0); x1 = Math.min(this.W, x1);
    const d = this.d; let i = (y * this.W + x0) * 4;
    if (a >= 255) { for (let x = x0; x < x1; x++, i += 4) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; } return; }
    const t = a / 255;
    for (let x = x0; x < x1; x++, i += 4) {
      const da = d[i + 3];
      if (da === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a; continue; }
      const oa = t + (da / 255) * (1 - t), k = t / oa;
      d[i] += (c[0] - d[i]) * k; d[i + 1] += (c[1] - d[i + 1]) * k; d[i + 2] += (c[2] - d[i + 2]) * k; d[i + 3] = oa * 255;
    }
  }
  _spans(pts, y) {
    const sy = y + 0.5, xs = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      if ((p[1] <= sy && q[1] > sy) || (q[1] <= sy && p[1] > sy)) xs.push(p[0] + ((sy - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
    }
    xs.sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i + 1 < xs.length; i += 2) { const a = Math.round(xs[i]), b = Math.round(xs[i + 1]); if (b > a) out.push([a, b]); }
    return out;
  }
  _fillDev(pts, c, a = 255) {
    if (pts.length < 3) return;
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(this.H - 1, Math.ceil(y1));
    for (let y = y0; y <= y1; y++) for (const [a0, a1] of this._spans(pts, y)) this._span(y, a0, a1, c, a);
  }
  // ----------------------------------------------------------- polygons (logical coords)
  _dev(pts) { return pts.map((p) => this.P(p[0], p[1])); }
  fill(pts, color, a = 255) { this._fillDev(this._dev(pts), rgb(color), a); return this; }
  /** stroke a polyline/loop with round joins; w in logical px */
  stroke(pts, w, color, closed = false, a = 255) {
    const dv = this._dev(pts), c = rgb(color), hw = (w * S) / 2, n = dv.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const p = dv[i], q = dv[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = (-dy / L) * hw, ny = (dx / L) * hw;
      this._fillDev([[p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny], [q[0] - nx, q[1] - ny], [p[0] - nx, p[1] - ny]], c, a);
    }
    const k = Math.max(6, Math.min(14, Math.round(hw * 1.4)));
    for (let i = 0; i < n; i++) {
      if (!closed && false) continue;
      const p = dv[i], disc = [];
      for (let j = 0; j < k; j++) { const t = (j / k) * PI2; disc.push([p[0] + Math.cos(t) * hw, p[1] + Math.sin(t) * hw]); }
      this._fillDev(disc, c, a);
    }
    return this;
  }
  line(x0, y0, x1, y1, w, color, a) { return this.stroke([[x0, y0], [x1, y1]], w, color, false, a); }
  /** outlined flat polygon */
  poly(pts, fill, ol = this.ol, olc = OUT) {
    if (ol > 0) this.stroke(pts, ol * 2, olc, true);
    if (fill) this.fill(pts, fill);
    return this;
  }
  /** outlined polygon with one crescent shade tone (lit from the top-left) */
  cel(pts, fill, shadeC = shade(fill), ol = this.ol, dx = -0.18, dy = -0.2, olc = OUT) {
    this.poly(pts, fill, ol, olc);
    shadeC = shadeC ?? shade(fill);
    const A = this._dev(pts), B = this._dev(pts.map((p) => [p[0] + dx * this._sz(pts), p[1] + dy * this._sz(pts)])), c = rgb(shadeC);
    let y0 = Infinity, y1 = -Infinity;
    for (const p of A) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.H - 1, Math.ceil(y1)); y++) {
      const sa = this._spans(A, y), sb = this._spans(B, y);
      for (const [a0, a1] of sa) {
        let cur = a0;
        for (const [b0, b1] of sb) { if (b1 <= cur || b0 >= a1) continue; if (b0 > cur) this._span(y, cur, b0, c, 255); cur = Math.max(cur, b1); }
        if (cur < a1) this._span(y, cur, a1, c, 255);
      }
    }
    return this;
  }
  _sz(pts) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } return Math.min(x1 - x0, y1 - y0) || 1; }
  ellPts(cx, cy, rx, ry, rot = 0, n = 0) {
    n = n || Math.max(16, Math.min(40, Math.round(Math.max(rx, ry) * S * 0.9)));
    const out = [], c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i < n; i++) { const t = (i / n) * PI2, x = Math.cos(t) * rx, y = Math.sin(t) * ry; out.push([cx + x * c - y * s, cy + x * s + y * c]); }
    return out;
  }
  ell(cx, cy, rx, ry, fill, ol = this.ol, rot = 0) { return this.poly(this.ellPts(cx, cy, rx, ry, rot), fill, ol); }
  celEll(cx, cy, rx, ry, fill, shadeC, ol = this.ol, rot = 0) { return this.cel(this.ellPts(cx, cy, rx, ry, rot), fill, shadeC ?? shade(fill), ol); }
  rect(x, y, w, h, fill, ol = this.ol) { return this.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, ol); }
  rr(x, y, w, h, r, fill, ol = this.ol) { return this.poly(rrPts(x, y, w, h, r), fill, ol); }
  celRR(x, y, w, h, r, fill, shadeC, ol = this.ol) { return this.cel(rrPts(x, y, w, h, r), fill, shadeC ?? shade(fill), ol); }
  /** smooth closed blob through control points (Catmull-Rom) */
  blobPts(pts, n = 6) { return catmull(pts, true, n); }
  blob(pts, fill, shadeC, ol = this.ol) { const p = catmull(pts, true, 6); return shadeC === false ? this.poly(p, fill, ol) : this.cel(p, fill, shadeC ?? shade(fill), ol); }
  curve(pts, w, color, n = 8) { return this.stroke(catmull(pts, false, n), w, color, false); }
  /** device-aligned vertical gradient rectangle (logical box), optional flat bands for the cel look */
  vgrad(x, y, w, h, c0, c1, bands = 0) {
    const a = rgb(c0), b = rgb(c1), X0 = Math.round(x * S), X1 = Math.round((x + w) * S), Y0 = Math.max(0, Math.round(y * S)), Y1 = Math.min(this.H, Math.round((y + h) * S));
    for (let yy = Y0; yy < Y1; yy++) {
      let t = (yy - Y0) / Math.max(1, Y1 - Y0 - 1); if (bands) t = Math.min(bands - 1, Math.floor(t * bands)) / (bands - 1);
      this._span(yy, X0, X1, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], 255);
    }
    return this;
  }
  /** soft radial glow (small sprites only) */
  glow(cx, cy, r, color, a = 1) {
    const c = rgb(color), X = cx * S, Y = cy * S, R = r * S;
    for (let y = Math.max(0, Math.floor(Y - R)); y < Math.min(this.H, Math.ceil(Y + R)); y++)
      for (let x = Math.max(0, Math.floor(X - R)); x < Math.min(this.W, Math.ceil(X + R)); x++) {
        const t = 1 - Math.hypot(x - X, y - Y) / R; if (t <= 0) continue;
        this._span(y, x, x + 1, c, Math.min(255, t * t * a * 255));
      }
    return this;
  }
  /** erase a device column range above a heightmap etc.: raw access helpers */
  column(x, y0, y1, color, a = 255) { const c = rgb(color); for (let y = Math.max(0, y0); y < Math.min(this.H, y1); y++) this._span(y, x, x + 1, c, a); }
  /** place another Cv (or PixBuf) at logical offset */
  blit(src, x, y) { this.pb.blit(src.pb ?? src, Math.round(x * S), Math.round(y * S)); return this; }
}

export function rrPts(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const out = [], k = 5, arc = (cx, cy, a0) => { for (let i = 0; i <= k; i++) { const t = a0 + (i / k) * (Math.PI / 2); out.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]); } };
  arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
  return out;
}

export function catmull(pts, closed, n = 6) {
  const out = [], N = pts.length, g = (i) => (closed ? pts[((i % N) + N) % N] : pts[Math.max(0, Math.min(N - 1, i))]);
  const m = closed ? N : N - 1;
  for (let i = 0; i < m; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(pts[N - 1]);
  return out;
}

/** make a sprite entry: fn(cv, frameIndex) draws one frame; returns { frames:[PixBuf], w, h } */
export function sprite(w, h, frames, fn) {
  const out = [];
  for (let f = 0; f < frames; f++) { const cv = new Cv(w, h); fn(cv, f); out.push(cv.pb); }
  return { frames: out, w, h };
}
