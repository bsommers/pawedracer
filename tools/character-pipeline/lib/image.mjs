// Zero-dep image helpers: PNG encode/decode (zlib from node:zlib), JPEG via jpeg.mjs, resize, blit. Image = {w,h,rgba}.
import { deflateSync, inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { decodeJPEG } from './jpeg.mjs';
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const o = Buffer.alloc(12 + data.length); o.writeUInt32BE(data.length, 0); o.write(type, 4, 'latin1'); data.copy(o, 8); o.writeUInt32BE(crc(o.subarray(4, 8 + data.length)), 8 + data.length); return o; };
export function encodePNG({ w, h, rgba }) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
export function decodePNG(buf) {
  let p = 8, w, h, ct, bd, plte = null, trns = null; const idat = [];
  while (p < buf.length) { const len = buf.readUInt32BE(p), t = buf.toString('latin1', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len); p += 12 + len;
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; if (d[12]) throw new Error('interlaced PNG unsupported'); } else if (t === 'PLTE') plte = d; else if (t === 'tRNS') trns = d; else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break; }
  if (bd !== 8) throw new Error('only 8-bit PNG supported');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct]; if (!ch) throw new Error('bad PNG colour type');
  const raw = inflateSync(Buffer.concat(idat)), stride = w * ch, out = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], s = y * (stride + 1) + 1, o = y * stride;
    for (let x = 0; x < stride; x++) { const a = x >= ch ? out[o + x - ch] : 0, b = y ? out[o - stride + x] : 0, c = x >= ch && y ? out[o - stride + x - ch] : 0; let v = raw[s + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[o + x] = v & 255; } }
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { const q = i * ch, o = i * 4;
    if (ct === 6) { rgba.set(out.subarray(q, q + 4), o); } else if (ct === 2) { rgba[o] = out[q]; rgba[o + 1] = out[q + 1]; rgba[o + 2] = out[q + 2]; rgba[o + 3] = 255; }
    else if (ct === 0) { rgba[o] = rgba[o + 1] = rgba[o + 2] = out[q]; rgba[o + 3] = 255; } else if (ct === 4) { rgba[o] = rgba[o + 1] = rgba[o + 2] = out[q]; rgba[o + 3] = out[q + 1]; }
    else { const k = out[q]; rgba[o] = plte[k * 3]; rgba[o + 1] = plte[k * 3 + 1]; rgba[o + 2] = plte[k * 3 + 2]; rgba[o + 3] = trns && k < trns.length ? trns[k] : 255; } }
  return { w, h, rgba };
}
export function decodeImage(buf) { if (buf[0] === 0x89 && buf[1] === 0x50) return decodePNG(buf); if (buf[0] === 0xff && buf[1] === 0xd8) return decodeJPEG(buf); throw new Error('unsupported image format (PNG and baseline JPEG only)'); }
export const readImage = (path) => decodeImage(readFileSync(path));
export const newImage = (w, h, fill = [0, 0, 0, 0]) => { const rgba = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i++) rgba.set(fill, i * 4); return { w, h, rgba }; };
/** Box-filter downscale / nearest upscale to w2 x h2. */
export function resize(img, w2, h2) {
  const out = newImage(w2, h2), sx = img.w / w2, sy = img.h / h2;
  for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
    const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx)), y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = (yy * img.w + xx) * 4, al = img.rgba[i + 3]; r += img.rgba[i] * al; g += img.rgba[i + 1] * al; b += img.rgba[i + 2] * al; a += al; n++; }
    const o = (y * w2 + x) * 4; if (a > 0) { out.rgba[o] = r / a; out.rgba[o + 1] = g / a; out.rgba[o + 2] = b / a; } out.rgba[o + 3] = a / n;
  }
  return out;
}
export function blit(dst, src, dx, dy) {
  for (let y = 0; y < src.h; y++) { const yy = y + dy; if (yy < 0 || yy >= dst.h) continue;
    for (let x = 0; x < src.w; x++) { const xx = x + dx; if (xx < 0 || xx >= dst.w) continue; const i = (y * src.w + x) * 4, o = (yy * dst.w + xx) * 4, a = src.rgba[i + 3] / 255; if (!a) continue;
      for (let c = 0; c < 3; c++) dst.rgba[o + c] = src.rgba[i + c] * a + dst.rgba[o + c] * (1 - a); dst.rgba[o + 3] = Math.max(dst.rgba[o + 3], src.rgba[i + 3]); } }
}
export const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export const unhex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
