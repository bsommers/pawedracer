// Toon backdrops: 640x80 skies (cel-banded gradient + outlined puffs / stars) and 640 wide tileable horizon layers.
// All shapes are periodic in x (period 640) so the renderer can wrap them.
import { sprite, shade, light, mixc, hash, OUT, rgb } from './vec.js';
import { HI_SCALE as S } from '../../core/defs.js';

const PER = 640;
function cloud(c, x, y, s, col, sh) {
  for (const dx of [-PER, 0, PER]) {
    const X = x + dx; if (X < -60 || X > PER + 60) continue;
    c.cel(c.blobPts([[X - 22 * s, y + 6 * s], [X - 20 * s, y], [X - 10 * s, y - 3 * s], [X - 4 * s, y - 10 * s], [X + 6 * s, y - 9 * s], [X + 10 * s, y - 3 * s], [X + 20 * s, y - 2 * s], [X + 24 * s, y + 6 * s]], 4), col, sh, 0.6);
  }
}
function sky(top, mid, bot, o = {}) {
  return sprite(640, 80, 1, (c) => {
    c.vgrad(0, 0, 640, 80, top, bot, 6);
    if (o.sun) for (const [r, col] of [[20, o.sun[1]], [14, o.sun[2]]]) c.fill(c.ellPts(o.sun[0], 62, r, r), col);
    if (o.stars) { for (let i = 0; i < 70; i++) { const x = hash(i, 1) * PER, y = hash(i, 2) * 56, r = 0.35 + hash(i, 3) * 0.7; c.fill(c.ellPts(x, y, r, r, 0, 6), i % 5 ? '#fff6e0' : '#ffd23a'); } c.fill(c.ellPts(480, 20, 8, 8), '#fff6d0'); c.fill(c.ellPts(484, 18, 7, 7), top); }
    for (let i = 0; i < (o.clouds ?? 7); i++) cloud(c, 50 + i * (PER / (o.clouds ?? 7)) + hash(i, 7) * 30, 18 + hash(i, 8) * 34, 0.7 + hash(i, 9) * 0.7, o.cloud ?? '#fff8ee', o.cloudS ?? '#c8d8f0');
  });
}

/** periodic ridge height 0..1 at logical x */
const ridge = (x, k) => {
  const t = (x / PER) * Math.PI * 2;
  return 0.5 + 0.22 * Math.sin(t * (2 + k)) + 0.13 * Math.sin(t * (5 + k * 2) + k) + 0.08 * Math.sin(t * (11 + k) + 2 * k);
};
function layer(h, fn, cols, o = {}) {
  return sprite(640, h, 1, (c) => {
    const bands = cols.length;
    for (let X = 0; X < c.W; X++) {
      const x = X / S, top = Math.round(fn(x) * S);
      for (let b = 0; b < bands; b++) {
        const y0 = b === 0 ? top : top + Math.round(((c.H - top) * b) / bands), y1 = b === bands - 1 ? c.H : top + Math.round(((c.H - top) * (b + 1)) / bands);
        c.column(X, y0, y1, cols[b]);
      }
      c.column(X, top - Math.round(0.6 * S), top + Math.round(0.6 * S), OUT);
      if (o.snow && fn(x) < o.snow) c.column(X, top + Math.round(0.6 * S), top + Math.round(Math.min(10, (o.snow - fn(x)) * 0.6 + 2) * S), '#f4f8ff');
    }
    if (o.after) o.after(c);
  });
}

export function build() {
  const o = {};
  o.bg_sky_day = sky('#4aa8ff', '#7cc4ff', '#cfeeff', { sun: [470, '#fff2a0', '#ffd84a'] });
  o.bg_sky_dusk = sky('#5a3a8a', '#c0507a', '#ffb070', { sun: [180, '#ffe0a0', '#ffc060'], clouds: 6, cloud: '#ffb0a0', cloudS: '#b05a7a' });
  o.bg_sky_night = sky('#0e1038', '#2a2a70', '#4a3a8a', { stars: true, clouds: 4, cloud: '#4a4a90', cloudS: '#2e2e66' });
  o.bg_hills = layer(48, (x) => 10 + ridge(x, 0) * 22, ['#5ac04a', '#47a83e', '#379234']);
  o.bg_mesa = layer(56, (x) => { const v = ridge(x, 1); return 8 + Math.floor(v * 4) * 7 + (v > 0.7 ? 0 : 6); }, ['#e8884a', '#c8683a', '#a8502e']);
  o.bg_peaks = layer(64, (x) => 4 + (1 - Math.abs(Math.sin((x / PER) * Math.PI * 6 + ridge(x, 2) * 2))) * 40 * (0.6 + ridge(x, 2) * 0.6), ['#8aa0d0', '#6a80b8', '#5468a0'], { snow: 22 });
  o.bg_skyline = layer(48, (x) => { const i = Math.floor(x / 26); return 8 + hash(i, 5, 3) * 26; }, ['#4a3a78', '#382a60', '#2a1e4a'], {
    after: (c) => { for (let i = 0; i < 25; i++) for (let k = 0; k < 4; k++) { const hx = i * 26 + 4 + (k % 2) * 8, hy = 14 + hash(i, k, 8) * 24, top = 8 + hash(i, 5, 3) * 26; if (hy > top + 4 && hash(i, k, 9) > 0.45) c.fill([[hx, hy], [hx + 3, hy], [hx + 3, hy + 3], [hx, hy + 3]], '#ffd23a'); } },
  });
  o.bg_cave = layer(64, (x) => 40 + ridge(x, 3) * 16, ['#3a3050', '#2c2540', '#201a30'], {
    after: (c) => { // stalactites hanging from the top, periodic
      for (let i = 0; i < 24; i++) { const x = i * 26.7 + hash(i, 4) * 10, len = 8 + hash(i, 5) * 22, w = 4 + hash(i, 6) * 4; c.cel([[x - w, 0], [x + w, 0], [x, len]], '#4a3e66', '#352c50', 0.5); } },
  });
  return o;
}
void shade; void light; void mixc; void rgb;
