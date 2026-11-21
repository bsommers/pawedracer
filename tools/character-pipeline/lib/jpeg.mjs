// Zero-dep baseline (SOF0/SOF1) JPEG decoder. Progressive (SOF2) and arithmetic coding are NOT supported (throws).
// Handles 1 or 3 components, any sampling factors, restart intervals. Returns {w,h,rgba:Uint8Array}.
const ZZ = new Uint8Array([0,1,8,16,9,2,3,10,17,24,32,25,18,11,4,5,12,19,26,33,40,48,41,34,27,20,13,6,7,14,21,28,35,42,49,56,57,50,43,36,29,22,15,23,30,37,44,51,58,59,52,45,38,31,39,46,53,60,61,54,47,55,62,63]);
function buildHuff(counts, syms) {
  const lut = new Map(); let code = 0, k = 0;
  for (let len = 1; len <= 16; len++) { for (let i = 0; i < counts[len - 1]; i++) lut.set((len << 16) | code++, syms[k++]); code <<= 1; }
  return lut;
}
export function decodeJPEG(buf) {
  let p = 2; if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG');
  const qt = [], hdc = [], hac = []; let fr = null, ri = 0;
  const u16 = () => { const v = (buf[p] << 8) | buf[p + 1]; p += 2; return v; };
  while (p < buf.length) {
    if (buf[p] !== 0xff) { p++; continue; }
    const m = buf[p + 1]; p += 2;
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { if (m === 0xff) p--; continue; }
    if (m === 0xd9) break;
    const len = u16(), end = p + len - 2;
    if (m === 0xdb) { while (p < end) { const pq = buf[p] >> 4, id = buf[p] & 15; p++; const t = new Int32Array(64); for (let i = 0; i < 64; i++) { t[ZZ[i]] = pq ? u16() : buf[p++]; } qt[id] = t; } }
    else if (m === 0xc4) { while (p < end) { const tc = buf[p] >> 4, id = buf[p] & 15; p++; const counts = buf.subarray(p, p + 16); p += 16; let n = 0; for (const c of counts) n += c; const syms = buf.subarray(p, p + n); p += n; (tc ? hac : hdc)[id] = buildHuff(counts, syms); } }
    else if (m === 0xc0 || m === 0xc1) { p++; const h = u16(), w = u16(), nc = buf[p++]; const comps = []; for (let i = 0; i < nc; i++) { comps.push({ id: buf[p], hs: buf[p + 1] >> 4, vs: buf[p + 1] & 15, tq: buf[p + 2] }); p += 3; } fr = { w, h, comps }; }
    else if (m === 0xc2 || (m >= 0xc3 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)) throw new Error('unsupported JPEG type (progressive/lossless/arithmetic): only baseline is supported');
    else if (m === 0xdd) ri = u16();
    else if (m === 0xda) {
      const ns = buf[p++]; const sc = []; for (let i = 0; i < ns; i++) { const c = fr.comps.find((x) => x.id === buf[p]); c.td = buf[p + 1] >> 4; c.ta = buf[p + 1] & 15; sc.push(c); p += 2; }
      p = end; return scan(buf, p, fr, sc, qt, hdc, hac, ri);
    }
    p = end;
  }
  throw new Error('no scan found');
}
function scan(buf, p, fr, sc, qt, hdc, hac, ri) {
  const { w, h, comps } = fr; const hmax = Math.max(...comps.map((c) => c.hs)), vmax = Math.max(...comps.map((c) => c.vs));
  const mcux = Math.ceil(w / (8 * hmax)), mcuy = Math.ceil(h / (8 * vmax));
  for (const c of comps) { c.bw = mcux * c.hs * 8; c.bh = mcuy * c.vs * 8; c.px = new Uint8Array(c.bw * c.bh); c.pred = 0; }
  let bits = 0, nb = 0;
  const bit = () => {
    if (nb === 0) { let b = buf[p++]; if (b === 0xff) { const n = buf[p]; if (n === 0) p++; else { p--; b = 0; /* marker: feed zeros */ } } bits = b; nb = 8; }
    nb--; return (bits >> nb) & 1;
  };
  const dec = (t) => { let code = 0; for (let len = 1; len <= 16; len++) { code = (code << 1) | bit(); const s = t.get((len << 16) | code); if (s !== undefined) return s; } throw new Error('bad huffman code'); };
  const recv = (n) => { let v = 0; for (let i = 0; i < n; i++) v = (v << 1) | bit(); return v; };
  const ext = (v, n) => (n && v < (1 << (n - 1)) ? v - (1 << n) + 1 : v);
  const blk = new Float64Array(64), tmp = new Float64Array(64);
  const cosT = []; for (let x = 0; x < 8; x++) { cosT[x] = []; for (let u = 0; u < 8; u++) cosT[x][u] = (u === 0 ? Math.SQRT1_2 : 1) * Math.cos(((2 * x + 1) * u * Math.PI) / 16) / 2; }
  const block = (c, bx, by) => {
    const q = qt[c.tq]; blk.fill(0);
    const t = dec(hdc[c.td]); c.pred += ext(recv(t), t); blk[0] = c.pred * q[0];
    for (let k = 1; k < 64;) { const rs = dec(hac[c.ta]), r = rs >> 4, s = rs & 15; if (s === 0) { if (r === 15) { k += 16; continue; } break; } k += r; if (k > 63) break; blk[ZZ[k]] = ext(recv(s), s) * q[ZZ[k]]; k++; }
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { let s = 0; for (let u = 0; u < 8; u++) s += cosT[x][u] * blk[y * 8 + u]; tmp[y * 8 + x] = s; }
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) { let s = 0; for (let v = 0; v < 8; v++) s += cosT[y][v] * tmp[v * 8 + x]; const o = (by * 8 + y) * c.bw + bx * 8 + x; c.px[o] = Math.max(0, Math.min(255, Math.round(s + 128))); }
  };
  let n = 0;
  for (let my = 0; my < mcuy; my++) for (let mx = 0; mx < mcux; mx++) {
    if (ri && n && n % ri === 0) { nb = 0; while (p < buf.length && !(buf[p] === 0xff && buf[p + 1] >= 0xd0 && buf[p + 1] <= 0xd7)) p++; p += 2; for (const c of comps) c.pred = 0; }
    n++;
    for (const c of sc) for (let v = 0; v < c.vs; v++) for (let hh = 0; hh < c.hs; hh++) block(c, mx * c.hs + hh, my * c.vs + v);
  }
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = comps.map((c) => c.px[Math.floor((y * c.vs) / vmax) * c.bw + Math.floor((x * c.hs) / hmax)]); const o = (y * w + x) * 4;
    if (comps.length === 1) { rgba[o] = rgba[o + 1] = rgba[o + 2] = s[0]; }
    else { const Y = s[0], cb = s[1] - 128, cr = s[2] - 128; rgba[o] = clamp(Y + 1.402 * cr); rgba[o + 1] = clamp(Y - 0.344136 * cb - 0.714136 * cr); rgba[o + 2] = clamp(Y + 1.772 * cb); }
    rgba[o + 3] = 255;
  }
  return { w, h, rgba };
}
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
