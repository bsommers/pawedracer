// Post-process: background removal, trim, consistent scale + anchor (feet bottom-centre), palette lock (retro), grade (photo), mipmaps (billboards).
import { removeBackground, floodMatte, bbox, crop } from './learn.mjs';
import { newImage, resize, blit, unhex } from './image.mjs';
export const BILLBOARD_MIPS = [256, 128, 64, 32];
/** Fit the trimmed subject into a w x h canvas: height = fill*h, bottom-centre anchored (anchorY = fraction of canvas height where the feet sit). */
export function fitAnchor(img, w, h, { fill = 0.88, anchorY = 0.96, pad = 2 } = {}) {
  const bb = bbox(img); if (!bb) return newImage(w, h);
  const sub = crop(img, bb.x, bb.y, bb.w, bb.h), s = Math.min((h * fill) / bb.h, (w * 0.96) / bb.w), tw = Math.max(1, Math.round(bb.w * s)), th = Math.max(1, Math.round(bb.h * s));
  const r = resize(sub, tw, th), out = newImage(w, h); blit(out, r, Math.round((w - tw) / 2), Math.round(h * anchorY) - th - pad + pad); return out;
}
export function paletteLock(img, palette, { alphaCut = 128 } = {}) {
  const pal = palette.map((p) => (typeof p === 'string' ? unhex(p) : p)), out = { w: img.w, h: img.h, rgba: new Uint8Array(img.rgba) };
  for (let i = 0; i < img.w * img.h; i++) { const o = i * 4; if (out.rgba[o + 3] < alphaCut) { out.rgba[o + 3] = 0; continue; } out.rgba[o + 3] = 255; let b = pal[0], bd = 1e9; for (const p of pal) { const d = (p[0] - out.rgba[o]) ** 2 + (p[1] - out.rgba[o + 1]) ** 2 + (p[2] - out.rgba[o + 2]) ** 2; if (d < bd) { bd = d; b = p; } } out.rgba[o] = b[0]; out.rgba[o + 1] = b[1]; out.rgba[o + 2] = b[2]; }
  return out;
}
/** Gentle soft-light-ish grade: lift shadows, warm highlights. */
export function grade(img, { warm = 0.04, lift = 0.04 } = {}) {
  const out = { w: img.w, h: img.h, rgba: new Uint8Array(img.rgba) };
  for (let i = 0; i < img.w * img.h; i++) { const o = i * 4; for (let k = 0; k < 3; k++) { let v = out.rgba[o + k] / 255; v = v + lift * (1 - v) * (1 - v); if (k === 0) v *= 1 + warm; if (k === 2) v *= 1 - warm; out.rgba[o + k] = Math.max(0, Math.min(255, Math.round(v * 255))); } }
  return out;
}
/** Full chain for one generated image. kind: turnaround | expression | pose | billboard. Returns {image, mips?, steps}. */
export function postProcess(img, { style = 'toon', kind = 'billboard', palette = null, size } = {}) {
  const steps = [], bg = style === 'photo' ? floodMatte(img) : removeBackground(img); let cur = bg.image; steps.push(`bg-key ${bg.key.map(Math.round).join(',')}`);
  if (kind === 'turnaround') { const bb = bbox(cur); steps.push('trim'); if (bb) cur = crop(cur, Math.max(0, bb.x - 8), Math.max(0, bb.y - 8), Math.min(cur.w, bb.w + 16), Math.min(cur.h, bb.h + 16)); }
  else { const [w, h] = size || [img.w, img.h]; cur = fitAnchor(cur, w, h); steps.push(`fit ${w}x${h} anchored bottom-centre`); }
  if (style === 'retro' && palette) { cur = paletteLock(cur, palette); steps.push('palette-lock'); }
  if (style === 'photo') { cur = grade(cur); steps.push('grade'); }
  const res = { image: cur, steps };
  if (kind === 'billboard') { res.mips = BILLBOARD_MIPS.map((hh) => ({ h: hh, image: resize(cur, Math.max(1, Math.round((cur.w * hh) / cur.h)), hh) })); steps.push(`mips ${BILLBOARD_MIPS.join('/')}`); }
  return res;
}
