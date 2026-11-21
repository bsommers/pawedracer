// Ghibli pack shared helpers (owner: ghibli-style). Painterly vector drawing over the painter-kit; units are LOGICAL px (1 unit = HI_SCALE device px).
// Frames are painter-kit surfaces: recording shims in Node (tests), real canvases in the browser (we expose .w/.h/.ctx on the canvas so the
// renderer's drawSprite source-rect maths works; see report "Deviations").
import { PAL, HI_SCALE as S } from '../../core/defs.js';

export const TAU = Math.PI * 2;
/** painterly palette: warm, slightly desaturated, derived from PAL where a retro colour exists */
export const G = {
  ink: PAL.outline, inkSoft: '#4a3a48', paper: '#fbf3e0', white: PAL.white,
  fur: '#f2943a', furL: '#ffc98a', furD: '#c4631f', stripe: '#b0501a', cream: '#fff0d6', nose: '#ff9aa8', eye: '#8fd45a', eyeD: '#1f4a12', scarf: PAL.scarf, scarfL: PAL.scarfL, hat: '#d9c283', hatD: '#a38a4a',
  peteFur: '#6a625a', peteFurD: '#463f3a', peteEar: '#b87a78', peteEye: '#ff3a40', peteArmor: '#4a4d4a', peteArmorL: '#7a7e78', peteTail: '#c9908e',
  cheese: '#ffd23a', cheeseD: '#e0a81e', cheeseL: '#fff08a', cheeseHole: '#b98424', rind: '#d38336', rindD: '#98521e', brie: '#f6efd6', blue: '#93a9de', blueD: '#566fb0', mold: '#4a9a78', parm: '#ecd9a6',
  steel: '#d3dae8', steelM: '#98a1b8', steelD: '#646c88', glass: '#8fd4ff', glassD: '#3aa4dc', flame: '#ffb02a', flameL: '#fff0a0', flameD: '#ff5a1a',
  leaf: '#4f9a52', leafL: '#8cc66a', leafD: '#2d6a45', trunk: '#7a5236', trunkL: '#a6784c', sand: '#ecd08c', sandD: '#c9a45a', rock: '#9a8e8a', rockL: '#c4b8b0', rockD: '#6a5f66',
  fondue: '#ff8a2a', fondueD: '#d63a1a', pickle: '#6cb848', pickleD: '#3a7a1f', gold: '#ffd35a', red: '#e8493a',
};
const { cos, sin } = Math;

/** sprite(kit, w, h, n, draw(c, i, kitSurface)) -> { frames, w, h }; w/h logical. drawing happens in logical units. */
export function sprite(kit, w, h, n, draw, opts = {}) {
  const frames = [];
  for (let i = 0; i < n; i++) {
    const s = kit.makeSurface(w * S, h * S), c = s.ctx;
    c.save(); c.scale(S, S); c.lineJoin = 'round'; c.lineCap = 'round';
    draw(c, i);
    c.restore();
    if (s.isShim) frames.push(s);
    else { const cv = s.canvas; cv.w = opts.logical ? w : w * S; cv.h = opts.logical ? h : h * S; cv.ctx = c; frames.push(cv); }
  }
  return { frames, w, h };
}
export const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
export const poly = (c, pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
export const dot = (c, x, y, r, col) => { ell(c, x, y, r, r); c.fillStyle = col; c.fill(); };
export const line = (c, x0, y0, x1, y1, w, col) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = w; c.strokeStyle = col; c.stroke(); };
export const rr = (kit, c, x, y, w, h, r) => kit.roundRect(c, x, y, w, h, r);

/** soft gradient fill of the current path (light top -> base -> dark bottom) + soft ink outline. `path()` rebuilds the path. */
export function shade(kit, c, path, col, o = {}) {
  const { lw = 0.5, ink = G.ink, y0 = 0, y1 = 1, hi = 0.28, lo = 0.3, outline = true } = o;
  path(); c.fillStyle = kit.lin(c, 0, y0, 0, y1, [[0, kit.lighten(col, hi)], [0.55, col], [1, kit.darken(col, lo)]]); c.fill();
  if (outline && lw > 0) { path(); c.lineWidth = lw; c.strokeStyle = ink; c.stroke(); }
}
/** same, but the gradient spans the supplied bounds [x,y,w,h] */
export function shadeB(kit, c, path, col, b, o = {}) { shade(kit, c, path, col, { ...o, y0: b[1], y1: b[1] + b[3] }); }
export const glowDot = (kit, c, x, y, r, col, a = 0.8) => { c.fillStyle = kit.radial(c, x, y, 0, r, [[0, kit.rgba(col, a)], [1, kit.rgba(col, 0)]]); ell(c, x, y, r, r); c.fill(); };
export const clipPath = (c, path) => { path(); c.clip(); };
export const sh = (kit, c, x, y, rx, ry, a = 0.3) => kit.softShadow(c, x, y, rx, ry, a, G.ink);

/** tiny deterministic hash -> [0,1) */
export function hash(n) { let h = (Math.imul(n | 0, 0x9e3779b1) ^ 0x85ebca6b) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0; return ((h ^ (h >>> 15)) >>> 0) / 4294967296; }

/** star of n points */
export function star(c, x, y, ro, ri, n = 5, rot = -Math.PI / 2) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro, a = rot + (i * Math.PI) / n; i ? c.lineTo(x + cos(a) * r, y + sin(a) * r) : c.moveTo(x + cos(a) * r, y + sin(a) * r); } c.closePath(); }

/** cheese wedge face helper: holes with soft shading */
export function holes(kit, c, pts) { for (const [x, y, r] of pts) { dot(c, x, y, r, G.cheeseHole); dot(c, x + r * 0.15, y + r * 0.2, r * 0.7, kit.darken(G.cheeseHole, 0.2)); dot(c, x - r * 0.35, y - r * 0.35, r * 0.22, 'rgba(255,240,170,0.55)'); } }

/** painterly grain + soft vignette to unify a finished sprite (cheap). Only call on large sprites. */
export function finish(kit, c, w, h, seed, a = 0.04) { kit.paperGrain(c, w, h, seed, { alpha: a, density: 0.0016, size: 0.35, maxSpecks: 2500 }); }
