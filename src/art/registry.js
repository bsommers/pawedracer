// Art registry (owner: render-road). buildArt({style}) -> Promise<{ get(name), has(name), style, names, report }>.
// Loads retro modules src/art/<m>.js (build(PixBuf) -> { name: {frames,w,h} }) and, for other styles, packs under
// src/art/<style>/*.js (build(kit)), all through guarded dynamic imports so Node tests pass when a module is missing.
// Any name in defs.ART without art gets a coloured-rectangle fallback ({ fallback:true }) so the renderer never crashes.
// Also exports createPixCtx(w,h): a PixBuf-backed 2D context shim (Node PNG output and tests).
import { ART, PAL, HI_SCALE } from '../core/defs.js';
import { PixBuf } from './pixbuf.js';

export const RETRO_MODULES = ['pods', 'chars', 'scenery', 'hazards', 'backdrop', 'fx'];
export const PACK_MODULES = ['index', ...RETRO_MODULES];
const GROUP_OF = {};
for (const [g, names] of Object.entries(ART)) for (const n of Object.keys(names)) GROUP_OF[n] = g;
export const ART_NAMES = Object.keys(GROUP_OF);

const FALLBACK_COLOURS = {
  pods: PAL.steel, chars: PAL.fur, hazards: PAL.cheese, pickups: PAL.coin ?? PAL.cheeseL, scenery: PAL.grass, backdrop: PAL.blueD, fx: PAL.flame, ui: PAL.hudTxt,
};

/** Coloured-rectangle stand-in for a missing sprite: filled body with a 1px dark outline and a lighter top edge. */
export function fallbackSprite(name, scale = 1) {
  const spec = ART[GROUP_OF[name]]?.[name] ?? { w: 16, h: 16, frames: 1 };
  const w = Math.max(1, Math.round(spec.w * scale)), h = Math.max(1, Math.round(spec.h * scale));
  const frames = [];
  for (let f = 0; f < Math.max(1, spec.frames); f++) {
    const p = new PixBuf(w, h);
    const base = FALLBACK_COLOURS[GROUP_OF[name]] ?? '#ff00ff';
    p.rect(0, 0, w, h, base);
    p.frame(0, 0, w, h, PAL.outline);
    if (h > 3) p.hline(1, 1, w - 2, PAL.white);
    frames.push(p);
  }
  return { frames, w, h, fallback: true };
}

async function tryImport(spec) {
  try { return await import(spec); } catch { return null; }
}

function normalise(entry, scale, name) {
  if (Array.isArray(entry)) entry = { frames: entry };
  if (!entry || !entry.frames || !entry.frames.length) return null;
  const f0 = entry.frames[0];
  const spec = ART[GROUP_OF[name]]?.[name];
  return { frames: entry.frames, w: spec ? spec.w : (entry.w ?? f0.w) / scale, h: spec ? spec.h : (entry.h ?? f0.h) / scale, scale, fallback: false };
}

async function loadRetro(out, report) {
  for (const m of RETRO_MODULES) {
    const mod = await tryImport(`./${m}.js`);
    if (!mod || typeof mod.build !== 'function') { report.missing.push(`retro:${m}`); continue; }
    try {
      const built = mod.build(PixBuf) || {};
      for (const [n, e] of Object.entries(built)) { const s = normalise(e, 1, n); if (s) out.retro.set(n, s); }
      report.loaded.push(`retro:${m}`);
    } catch (err) { report.errors.push(`retro:${m}: ${err.message}`); }
  }
}

async function loadPack(style, out, report) {
  let kit = null;
  const kitMod = await tryImport('../kits/painter-kit/index.js') ?? await tryImport('../kits/index.js');
  if (kitMod) kit = kitMod.painterKit ?? kitMod.default ?? kitMod;
  for (const m of PACK_MODULES) {
    const mod = await tryImport(`./${style}/${m}.js`);
    if (!mod || typeof mod.build !== 'function') continue;
    try {
      const built = (await mod.build(kit, { PixBuf, HI_SCALE })) || {};
      for (const [n, e] of Object.entries(built)) { const s = normalise(e, HI_SCALE, n); if (s) out.pack.set(n, s); }
      report.loaded.push(`${style}:${m}`);
    } catch (err) { report.errors.push(`${style}:${m}: ${err.message}`); }
  }
}

/** buildArt({style}) -> { get(name), has(name), style, report }. get() always returns a sprite (fallback rectangle if none). */
export async function buildArt({ style = 'retro' } = {}) {
  const report = { loaded: [], missing: [], errors: [], fallback: [] };
  const out = { retro: new Map(), pack: new Map(), fb: new Map() };
  await loadRetro(out, report);
  const effective = style === 'photo' ? 'toon' : style;
  if (effective !== 'retro') await loadPack(effective, out, report);
  const get = (name) => {
    const s = out.pack.get(name) ?? out.retro.get(name);
    if (s) return s;
    let fb = out.fb.get(name);
    if (!fb) { fb = fallbackSprite(name); out.fb.set(name, fb); report.fallback.push(name); }
    return fb;
  };
  return { style, get, has: (n) => out.pack.has(n) || out.retro.has(n), report, names: ART_NAMES };
}

// ------------------------------------------------------------------ drawable cache (PixBuf -> canvas when a DOM exists)
const drawCache = new WeakMap();
/** Convert a PixBuf frame to something ctx.drawImage accepts: a canvas in the browser, the PixBuf itself in Node (shim reads it). */
export function toDrawable(pb) {
  if (typeof document === 'undefined' || !pb || !pb.rgba) return pb;
  let c = drawCache.get(pb);
  if (!c) {
    c = document.createElement('canvas'); c.width = pb.w; c.height = pb.h;
    const x = c.getContext('2d');
    x.putImageData(new ImageData(new Uint8ClampedArray(pb.rgba), pb.w, pb.h), 0, 0);
    drawCache.set(pb, c);
  }
  return c;
}

// ------------------------------------------------------------------ PixBuf-backed 2D context shim
function parseCss(s) {
  if (typeof s !== 'string') return [255, 0, 255, 1];
  if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1];
  }
  const m = /rgba?\(([^)]+)\)/.exec(s);
  if (m) { const p = m[1].split(',').map((v) => parseFloat(v)); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  return [255, 0, 255, 1];
}

/** Minimal 2D context over a PixBuf: fillRect, clearRect, drawImage (PixBuf / shim canvas), polygon fill, scale/translate transforms,
 *  globalAlpha, 'lighter' composite. Enough for the renderer and font.drawText. canvas.__pb is the backing PixBuf. */
export function createPixCtx(w, h) {
  const pb = new PixBuf(w, h);
  const canvas = { width: w, height: h, __pb: pb, getContext: () => ctx };
  let st = { sx: 1, sy: 1, tx: 0, ty: 0, alpha: 1, fill: [0, 0, 0, 1], comp: 'source-over' };
  const stack = [];
  let path = [];
  const D = pb.rgba;
  const blend = (i, r, g, b, a) => {
    if (a <= 0) return;
    if (st.comp === 'lighter') {
      D[i] = Math.min(255, D[i] + r * a); D[i + 1] = Math.min(255, D[i + 1] + g * a); D[i + 2] = Math.min(255, D[i + 2] + b * a); D[i + 3] = 255; return;
    }
    if (a >= 1 || D[i + 3] === 0) { D[i] = r; D[i + 1] = g; D[i + 2] = b; D[i + 3] = a >= 1 ? 255 : Math.round(a * 255); return; }
    const da = D[i + 3] / 255, oa = a + da * (1 - a);
    D[i] = (r * a + D[i] * da * (1 - a)) / oa; D[i + 1] = (g * a + D[i + 1] * da * (1 - a)) / oa; D[i + 2] = (b * a + D[i + 2] * da * (1 - a)) / oa; D[i + 3] = oa * 255;
  };
  const devRect = (x, y, rw, rh) => {
    const ax = st.tx + x * st.sx, bx = st.tx + (x + rw) * st.sx, ay = st.ty + y * st.sy, by = st.ty + (y + rh) * st.sy;
    return [Math.round(Math.min(ax, bx)), Math.round(Math.min(ay, by)), Math.round(Math.max(ax, bx)), Math.round(Math.max(ay, by))];
  };
  const ctx = {
    canvas,
    set fillStyle(v) { st.fill = parseCss(v); }, get fillStyle() { return st.fill; },
    set strokeStyle(v) { st.stroke = parseCss(v); }, get strokeStyle() { return st.stroke; },
    set globalAlpha(v) { st.alpha = v; }, get globalAlpha() { return st.alpha; },
    set globalCompositeOperation(v) { st.comp = v; }, get globalCompositeOperation() { return st.comp; },
    imageSmoothingEnabled: false, font: '', textBaseline: 'top', lineWidth: 1,
    save() { stack.push({ ...st }); }, restore() { if (stack.length) st = stack.pop(); },
    scale(x, y) { st.sx *= x; st.sy *= y; }, translate(x, y) { st.tx += x * st.sx; st.ty += y * st.sy; },
    setTransform(a, b, c, d, e, f) { if (typeof a === 'object') { st.sx = a.a; st.sy = a.d; st.tx = a.e; st.ty = a.f; } else { st.sx = a; st.sy = d; st.tx = e; st.ty = f; } },
    resetTransform() { st.sx = st.sy = 1; st.tx = st.ty = 0; },
    fillRect(x, y, rw, rh) {
      let [x0, y0, x1, y1] = devRect(x, y, rw, rh);
      x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(w, x1); y1 = Math.min(h, y1);
      const [r, g, b, fa] = st.fill, a = fa * st.alpha;
      for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) blend((j * w + i) * 4, r, g, b, a);
    },
    clearRect(x, y, rw, rh) {
      let [x0, y0, x1, y1] = devRect(x, y, rw, rh);
      x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(w, x1); y1 = Math.min(h, y1);
      for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) { const k = (j * w + i) * 4; D[k] = D[k + 1] = D[k + 2] = D[k + 3] = 0; }
    },
    beginPath() { path = []; }, moveTo(x, y) { path.push([x, y]); }, lineTo(x, y) { path.push([x, y]); }, closePath() {},
    rect(x, y, rw, rh) { path = [[x, y], [x + rw, y], [x + rw, y + rh], [x, y + rh]]; },
    fill() {
      if (path.length < 3) return;
      const pts = path.map(([x, y]) => [st.tx + x * st.sx, st.ty + y * st.sy]);
      let ymin = Infinity, ymax = -Infinity;
      for (const p of pts) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
      const [r, g, b, fa] = st.fill, a = fa * st.alpha;
      for (let y = Math.max(0, Math.floor(ymin)); y < Math.min(h, Math.ceil(ymax)); y++) {
        const yc = y + 0.5, xs = [];
        for (let k = 0; k < pts.length; k++) {
          const p = pts[k], q = pts[(k + 1) % pts.length];
          if ((p[1] <= yc && q[1] > yc) || (q[1] <= yc && p[1] > yc)) xs.push(p[0] + ((yc - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
        }
        xs.sort((m, n) => m - n);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.round(xs[k])); x < Math.min(w, Math.round(xs[k + 1])); x++) blend((y * w + x) * 4, r, g, b, a);
      }
    },
    drawImage(src, ...a) {
      const sp = src && src.__pb ? src.__pb : src;
      if (!sp || !sp.rgba) return;
      let sx = 0, sy = 0, sw = sp.w, sh = sp.h, dx, dy, dw, dh;
      if (a.length === 2) { [dx, dy] = a; dw = sw; dh = sh; }
      else if (a.length === 4) { [dx, dy, dw, dh] = a; }
      else { [sx, sy, sw, sh, dx, dy, dw, dh] = a; }
      const self = sp === pb, S = self ? sp.rgba.slice() : sp.rgba;
      const [x0, y0, x1, y1] = devRect(dx, dy, dw, dh);
      if (x1 <= x0 || y1 <= y0) return;
      const wasNeg = dw < 0;
      for (let j = Math.max(0, y0); j < Math.min(h, y1); j++) {
        const v = Math.min(sy + sh - 1, Math.floor(sy + ((j - y0 + 0.5) / (y1 - y0)) * sh));
        for (let i = Math.max(0, x0); i < Math.min(w, x1); i++) {
          let u = ((i - x0 + 0.5) / (x1 - x0)); if (wasNeg) u = 1 - u;
          const ui = Math.min(sx + sw - 1, Math.floor(sx + u * sw));
          const k = (v * sp.w + ui) * 4;
          const al = S[k + 3] / 255;
          if (al > 0) blend((j * w + i) * 4, S[k], S[k + 1], S[k + 2], al * st.alpha);
        }
      }
    },
    getImageData(x, y, rw, rh) { return { width: rw, height: rh, data: pb.rgba.slice(0, rw * rh * 4) }; },
  };
  return ctx;
}
