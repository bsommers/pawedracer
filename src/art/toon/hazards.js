// Toon hazards (40x32, 2 frames) and pickups (16x16, 4 frames).
import { PAL, TOON_PAL as TP } from '../../core/defs.js';
import { sprite, shade, light, OUT, PI2 } from './vec.js';

const CH = PAL.cheese, CHD = PAL.cheeseD, RIND = PAL.rind;

function cheeseWheel(c, cx, cy, r, f, spin = 0) {
  c.celEll(cx, cy, r, r * 0.96, CH, CHD, 0.7);
  c.ell(cx, cy, r * 0.78, r * 0.74, '#ffe36a', 0);
  for (let i = 0; i < 4; i++) { const a = spin + i * 1.6 + 0.4, d = r * (0.25 + 0.14 * (i % 2)); c.ell(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.15, r * 0.13, PAL.cheeseHole, 0.35); }
  c.stroke(c.ellPts(cx, cy, r * 0.97, r * 0.93), 1.1, RIND, true);
  c.stroke(c.ellPts(cx, cy, r, r * 0.96), 0.7, OUT, true);
}

export function build() {
  const o = {};
  o.hz_wedge = sprite(40, 32, 2, (c, f) => {
    c.ell(20, 29.4, 17, 2.2, '#14101c', 0, 0); 
    c.cel([[3, 28], [22, 8 + f * 0.6], [37, 27], [37, 29], [3, 29]], CH, CHD);
    c.poly([[3, 28], [37, 27], [37, 30], [3, 30]], RIND, 0.6);
    c.poly([[22, 8 + f * 0.6], [37, 27], [37, 30], [29, 28]], CHD, 0.5);
    c.ell(14, 23, 2.2, 1.7, PAL.cheeseHole, 0.45); c.ell(23, 19, 1.6, 1.3, PAL.cheeseHole, 0.4); c.ell(29, 25, 1.7, 1.4, PAL.cheeseHole, 0.4);
    // warning chevrons
    c.poly([[19, 4 + f], [21, 6 + f], [23, 4 + f], [21, 1 + f]], '#e84a3a', 0.5);
  });
  o.hz_wheel = sprite(40, 32, 2, (c, f) => {
    c.ell(20, 29.6, 14, 2, '#14101c', 0, 0);
    cheeseWheel(c, 20, 17, 13.5, f, f * 0.9);
    for (const x of [3, 35]) c.line(x, 14 + f, x + (x < 20 ? -2 : 2), 14 + f, 0.6, '#ffffff', 160);
  });
  o.hz_grater = sprite(40, 32, 2, (c, f) => {
    c.cel([[1, 29], [3, 20], [37, 20], [39, 29]], TP.peteArmor === '#3b3d3a' ? '#a8b2c8' : '#a8b2c8', '#6a7690');
    for (let i = 0; i < 9; i++) { const x = 4 + i * 4, up = (i + f) % 2; c.poly([[x - 1.2, 25], [x, 19 - up * 1.4], [x + 1.2, 25]], '#d8e0f0', 0.45); c.ell(x, 25.6 - up, 1, 0.8, '#2a2a38', 0.2); }
    c.rect(2, 27, 36, 2.4, '#7a8298', 0.5);
  });
  o.hz_cutter = sprite(40, 32, 2, (c, f) => {
    const sw = f ? 3 : -3;
    for (const x of [5, 35]) c.cel([[x - 2.4, 31], [x - 1.6, 7], [x + 1.6, 7], [x + 2.4, 31]], '#7a5a3a', '#5a3a22');
    for (const x of [5, 35]) c.celEll(x, 6, 2.6, 2, '#c4742a', null);
    c.stroke([[5, 9], [20 + sw, 17], [35, 9]], 0.7, '#e8f0ff'); c.stroke([[5, 9], [20 + sw, 17], [35, 9]], 0.25, '#ffffff');
    c.cel([[17 + sw, 17], [23 + sw, 17], [22 + sw, 24], [18 + sw, 24]], '#c8d0e0', '#8a92a8', 0.5);
    c.celRR(16 + sw, 24, 8, 2.4, 1, '#7a5a3a', null, 0.4);
  });
  o.hz_fondue = sprite(40, 32, 2, (c, f) => {
    c.celEll(20, 25, 19, 5.2, '#ff8a2a', '#d63a1a', 0.7);
    c.ell(20, 24.2, 15, 3.6, '#ffb040', 0, 0); c.ell(18 - f, 24, 8, 2, '#ffd870', 0, 0);
    for (const [x, y, r] of [[10 + f * 2, 23, 2], [27 - f * 2, 25, 2.4], [20 + f, 22, 1.4]]) { c.ell(x, y - 2.6 - f * 1.2, r, r, '#ffb040', 0.45); c.ell(x - 0.5, y - 3 - f, 0.5, 0.5, '#fff0a0', 0); }
    c.glow(20, 24, 17, '#ff5a1a', 0.3);
  });
  o.hz_stink = sprite(40, 32, 2, (c, f) => {
    const col = '#8ed25a', d = shade(col, 0.28);
    for (const [x, y, r] of [[10, 23, 7.5], [20, 17 + f, 9.5], [30, 22, 8], [20, 25, 7]]) c.celEll(x, y, r, r * 0.8, col, d, 0.6);
    c.ell(20, 12 + f * 1.4, 2, 2.6, '#3a6a2a', 0.4);   // wafting skull-ish dot
    for (const [x, y] of [[13, 8 - f], [27, 6 + f]]) c.curve([[x, y + 6], [x + 2, y + 3], [x - 1, y], [x + 1, y - 3]], 0.7, '#5a9a3a');
    c.ell(15, 22, 1.2, 1.5, OUT, 0); c.ell(21, 22, 1.2, 1.5, OUT, 0);
  });
  o.hz_mine = sprite(40, 32, 2, (c, f) => {
    c.ell(20, 29.4, 12, 2, '#14101c', 0, 0);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI2 + 0.2; c.poly([[20 + Math.cos(a - 0.2) * 12, 19 + Math.sin(a - 0.2) * 11], [20 + Math.cos(a) * 17, 19 + Math.sin(a) * 15], [20 + Math.cos(a + 0.2) * 12, 19 + Math.sin(a + 0.2) * 11]], '#3a3d3a', 0.5); }
    cheeseWheel(c, 20, 19, 11.5, f, 0.3);
    c.ell(20, 8, 2.6, 2.6, f ? '#ff2a30' : '#7a1018', 0.5); if (f) c.glow(20, 8, 7, '#ff4a4a', 0.55);
    c.line(20, 10, 20, 12, 0.6, OUT);
  });
  o.hz_hole = sprite(40, 32, 2, (c, f) => {
    c.celEll(20, 24, 18, 6.2, '#f0c040', '#c4902a', 0.7);
    c.ell(20, 24.4, 13, 4.2, '#2a1a30', 0.6); c.ell(20, 25.4, 9, 2.4, '#14101c', 0, 0);
    c.ell(15 + f, 23.4, 1.2, 0.6, '#ffffff', 0, 0, 0);
    c.poly([[26, 17 + f], [27.2, 19 + f], [25, 19.4 + f]], '#ffe36a', 0.4);
  });

  // ------------------------------------------------------------ pickups 16x16
  o.pk_tuna = sprite(16, 16, 4, (c, f) => {
    const sh = [0, 0.8, 0, -0.8][f], k = Math.abs(Math.cos(f * 0.8));
    c.celRR(3, 4, 10, 9, 1.6, '#c8d0e0', '#8a92a8', 0.5);
    c.rect(3, 7, 10, 3.6, '#3f77bd', 0.4); c.poly([[5, 7.6], [10, 7.6], [11, 9], [10, 10.2], [5, 10.2]], '#ff8fa3', 0.25);
    c.ell(8, 4, 5, 1.2, '#e8eefc', 0.4); c.ell(8, 13, 5, 1.2, '#7a8298', 0.4);
    c.line(4.6 + sh, 5, 6 + sh, 4.6, 0.5, '#ffffff'); c.glow(13, 3, 3.2 + f * 0.3, '#ffffff', f === 1 ? 0.8 : 0.2); void k;
  });
  o.pk_mouse = sprite(16, 16, 4, (c, f) => {
    const hop = [0, -1.2, -0.6, 0][f];
    c.rotT(0, 8, 14, 0, hop, () => {
      c.celEll(8, 10, 5.4, 3.8, '#b9b3ae', null); c.celEll(12.4, 9.4, 3, 2.6, '#cfc9c4', null);
      c.celEll(10.6, 6.4, 1.8, 1.8, '#f0a0a0', null); c.ell(13.6, 9.4, 0.7, 0.7, PAL.nose, 0.2); c.ell(11.8, 8.6, 0.5, 0.6, OUT, 0);
      c.curve([[3, 11], [1, 13], [2.4, 14.6], [0.6, 14.4]], 0.6, '#c58a88');
      c.stroke([[6, 13.4], [6, 14.6]], 0.8, OUT);
    });
    c.line(2, 3 + f * 0.4, 5, 6, 0.9, '#c8d0e0'); c.ell(2, 3 + f * 0.4, 1.2, 1.2, '#e84a3a', 0.35);   // wrench = repair
  });
  o.pk_coin = sprite(16, 16, 4, (c, f) => {
    const w = Math.max(0.18, Math.abs(Math.cos(f * Math.PI / 4 + 0.2))) * 6.4;
    c.celEll(8, 8, w, 6.4, '#ffd23a', '#d9a41a', 0.6);
    if (w > 3) { c.ell(8, 8, w * 0.62, 4.1, '#ffe86a', 0, 0); c.poly([[7.4, 5], [8.6, 5], [8.6, 11], [7.4, 11]], '#d9a41a', 0); }
  });
  o.pk_sardine = sprite(16, 16, 4, (c, f) => {
    const wob = Math.sin(f * 1.57) * 0.8;
    c.cel([[1.5, 8 + wob], [4, 5], [11, 5], [14.6, 8 + wob], [11, 11], [4, 11]], '#b8c4dc', '#7a86a8', 0.55);
    c.poly([[13, 8 + wob], [15.6, 5.4], [15.6, 10.6]], '#8a96b8', 0.45);
    c.ell(4.2, 7.4 + wob * 0.5, 1, 1, '#ffffff', 0.3); c.ell(4.4, 7.4 + wob * 0.5, 0.4, 0.4, OUT, 0);
    c.line(6, 7, 12, 7, 0.5, '#e8f0ff'); if (f === 2) c.glow(8, 6, 5, '#ffffff', 0.45);
  });
  o.pk_collar = sprite(16, 16, 4, (c, f) => {
    c.stroke(c.ellPts(8, 9, 5.6, 3.6), 2.6, OUT, true); c.stroke(c.ellPts(8, 9, 5.6, 3.6), 1.6, '#e84a3a', true);
    const sw = [0, 0.8, 0, -0.8][f];
    c.celEll(8 + sw * 0.4, 12.9, 2.1, 2.1, '#ffd23a', '#d9a41a', 0.5); c.ell(8, 12.7, 0.5, 0.5, '#d9a41a', 0);
    for (const x of [4, 8, 12]) c.ell(x, 5.8 + (x === 8 ? 0.5 : 0), 0.5, 0.5, '#ffffff', 0, 0);
    if (f === 1) c.glow(12, 5, 4, '#fff6c0', 0.6);
  });
  return o;
}
void light;
