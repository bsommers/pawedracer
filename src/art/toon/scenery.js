// Toon roadside scenery (billboards anchored at bottom centre). Flat cel fills, one shade tone, near-black outline.
import { PAL, TOON_PAL as TP } from '../../core/defs.js';
import { sprite, shade, light, OUT, PI2 } from './vec.js';
import { peteHead } from './chars.js';

const CH = PAL.cheese, CHD = PAL.cheeseD;

function palm(c, f) {
  const sw = f ? 1.6 : -1.2;
  c.cel(c.blobPts([[22, 63], [21, 44], [23 + sw * 0.4, 28], [26 + sw * 0.6, 18], [28 + sw * 0.6, 18], [27 + sw * 0.4, 30], [27, 46], [30, 63]], 4), '#b0753a', '#7a4a22');
  for (const y of [56, 48, 40, 32]) c.line(22, y, 29, y - 1.4, 0.5, '#7a4a22');
  const fronds = [[-19, 4, 0.1], [-13, -6, -0.1], [-4, -11, 0], [6, -9, 0.1], [14, -2, 0.2], [19, 8, 0.3], [-8, 5, 0]];
  for (const [dx, dy] of fronds) { const bx = 27 + sw * 0.5, by = 17, ex = bx + dx + sw * Math.sign(dx), ey = by + dy;
    c.cel([[bx, by], [(bx + ex) / 2, Math.min(by, ey) - 6 + Math.abs(dx) * 0.1], [ex, ey + 3], [(bx + ex) / 2, Math.min(by, ey) - 1.8]], '#3fb04a', '#2a7a38', 0.55); }
  c.celEll(25, 20, 2.2, 2.2, '#8a5a2a', null); c.celEll(29, 20.5, 2, 2, '#8a5a2a', null);
}
function pine(c, f) {
  const cx = 20, sw = f ? 0.5 : 0;
  c.rect(cx - 2.5, 62, 5, 10, '#8a5a2a', 0.55);
  [[52, 17], [40, 14], [29, 11], [18, 8]].forEach(([y, w], i) => {
    c.cel([[cx - w - 1, y + 10], [cx + sw * (i * 0.3), y - 10 + i * 0.8], [cx + w + 1, y + 10]], '#2f8f4a', '#1f6a3a', 0.6);
    c.poly([[cx - w * 0.55, y - 1.6 + 2], [cx + sw, y - 10 + i * 0.8], [cx + w * 0.4, y - 1 + 2], [cx + w * 0.2, y + 1], [cx - w * 0.1, y - 0.2 + 2], [cx - w * 0.3, y + 1.4]], '#f2f6ff', 0);
  });
}
function crystal(c, f) {
  const g = f ? 1 : 0;
  for (const [x, w, h, col] of [[10, 5, 30, '#b48aff'], [18, 7, 44, '#8a6aff'], [25, 4.6, 26, '#c8a8ff']]) {
    c.cel([[x - w, 47], [x - w * 0.8, 47 - h * 0.78], [x, 47 - h], [x + w * 0.8, 47 - h * 0.78], [x + w, 47]], col, shade(col, 0.3), 0.55);
    c.line(x - w * 0.3, 44, x - w * 0.3, 47 - h * 0.7, 0.5, '#ffffff', 170);
  }
  c.glow(18, 20, 12 + g, '#c8a8ff', 0.3 + g * 0.2);
}
function mushroom(c, f) {
  c.cel(c.blobPts([[16, 47], [17, 36], [18, 28], [23, 28], [24, 36], [25, 47]], 4), '#f2ead0', '#c8b890');
  const b = f ? 0.8 : 0;
  c.cel(c.blobPts([[2, 31 + b], [5, 16], [20, 8 - b], [35, 16], [38, 31 + b], [20, 34]], 5), '#3a8a6a', '#256a4e');
  for (const [x, y, r] of [[12, 22, 3], [24, 16, 2.6], [29, 25, 2.2], [19, 27, 1.7]]) c.ell(x, y, r, r * 0.85, '#d8f0c0', 0.4);
}
function lamp(c, f) {
  c.cel([[7, 63], [7.6, 14], [8.4, 14], [9, 63]], '#4a4a60', '#2e2e40', 0.5);
  c.rect(5, 59, 6, 5, '#3a3a50', 0.5);
  c.stroke([[8, 14], [8, 6]], 1, OUT); 
  c.celRR(3.4, 4, 9.2, 8, 2, f ? '#fff08a' : '#ffd23a', null, 0.6);
  c.glow(8, 8, 9, '#ffd23a', f ? 0.5 : 0.35);
}
function banner(c, f) {
  const w = f ? 2 : 0;
  c.rect(2, 2, 3, 30, '#6a5a7a', 0.5); c.rect(59, 2, 3, 30, '#6a5a7a', 0.5);
  c.cel([[5, 4], [32, 3 + w * 0.4], [59, 4], [59, 20 + w], [32, 24 - w * 0.6], [5, 20]], '#e84a3a', '#a82a28', 0.6);
  c.celEll(20, 12, 4.4, 4, CH, CHD); c.ell(19, 11, 0.9, 0.8, PAL.cheeseHole, 0);
  for (let i = 0; i < 4; i++) c.poly([[30 + i * 7, 8], [34 + i * 7, 8], [32 + i * 7, 16], [28 + i * 7, 16]], i % 2 ? '#ffd23a' : '#fff6e0', 0);
}
function sign(c) {
  c.rect(14.4, 20, 3.2, 20, '#7a5a3a', 0.5);
  c.celRR(2, 2, 28, 20, 3, '#2e5fa8', null, 0.6);
  c.poly([[8, 12], [18, 6], [18, 10], [25, 10], [25, 14], [18, 14], [18, 18]], '#fff6e0', 0.2);
  c.ell(5, 5, 0.8, 0.8, '#fff6e0', 0); c.ell(27, 5, 0.8, 0.8, '#fff6e0', 0);
}

export function build() {
  const o = {};
  o.sc_palm = sprite(48, 64, 2, palm);
  o.sc_pine = sprite(40, 72, 2, pine);
  o.sc_crystal = sprite(32, 48, 2, crystal);
  o.sc_mushroom = sprite(40, 48, 2, mushroom);
  o.sc_lamp = sprite(16, 64, 2, lamp);
  o.sc_banner = sprite(64, 32, 2, banner);
  o.sc_sign = sprite(32, 40, 1, sign);
  o.sc_rock = sprite(48, 40, 1, (c) => {
    c.cel(c.blobPts([[2, 39], [4, 24], [12, 12], [26, 8], [38, 16], [46, 30], [46, 39]], 5), '#9a8a96', '#6a5a72');
    c.cel(c.blobPts([[20, 39], [22, 28], [30, 22], [40, 26], [45, 39]], 4), '#b0a0aa', '#80708a', 0.5);
    c.line(14, 18, 20, 22, 0.5, '#5a4a62'); c.line(26, 14, 24, 20, 0.5, '#5a4a62');
  });
  o.sc_wheel_big = sprite(64, 64, 1, (c) => {
    c.rect(8, 56, 48, 6, '#8a6a4a', 0.6); 
    c.celEll(32, 32, 28, 26, CH, CHD, 0.8); c.ell(32, 32, 22, 20, '#ffe36a', 0);
    for (const [x, y, r] of [[22, 24, 4], [38, 20, 3], [40, 38, 5], [24, 40, 3.2], [32, 30, 2.4]]) c.ell(x, y, r, r * 0.85, PAL.cheeseHole, 0.5);
    c.stroke(c.ellPts(32, 32, 27, 25), 1.3, PAL.rind, true);
    c.celRR(14, 46, 36, 8, 2, '#e84a3a', null, 0.5);
    c.poly([[18, 49], [22, 49], [22, 52], [18, 52]], '#fff6e0', 0); c.poly([[26, 49], [46, 49], [46, 50.6], [26, 50.6]], '#fff6e0', 0); c.poly([[26, 52], [40, 52], [40, 53], [26, 53]], '#fff6e0', 0);
  });
  o.sc_cactus = sprite(32, 56, 1, (c) => {
    const G = '#3fb04a', D = '#2a7a38';
    c.cel(c.blobPts([[10, 55], [10, 10], [16, 2], [22, 10], [22, 55]], 4), G, D);
    c.cel(c.blobPts([[10, 40], [4, 40], [3, 26], [6.6, 24], [7.4, 34], [10, 34]], 3), G, D);
    c.cel(c.blobPts([[22, 34], [28, 34], [29, 20], [25.6, 18], [24.6, 28], [22, 28]], 3), G, D);
    for (const y of [10, 20, 30, 42]) { c.line(14, y, 14, y + 4, 0.4, D); c.line(18, y + 2, 18, y + 6, 0.4, D); }
    c.ell(16, 3, 1.6, 1.3, '#ff6a8a', 0.4);
  });
  o.sc_stalag = sprite(40, 64, 1, (c) => {
    c.cel([[4, 63], [14, 30], [20, 6], [27, 30], [37, 63]], '#a89aa8', '#6a5a72', 0.7);
    c.cel([[16, 63], [22, 44], [26, 63]], '#c8bcc8', '#8a7a92', 0.5);
    c.line(14, 36, 18, 32, 0.5, '#5a4a62'); c.line(24, 26, 22, 34, 0.5, '#5a4a62');
  });
  o.sc_crowd = sprite(64, 32, 4, (c, f) => {
    const fur = ['#e8963c', '#b9b3ae', '#8a8a95', '#f2e8d0', '#6a4a3a', '#e8963c'];
    c.rect(0, 22, 64, 10, '#6a5a7a', 0.6);
    for (let i = 0; i < 6; i++) {
      const x = 6 + i * 10.4, up = (i + f) % 2, y = 16 - up * 2.4 + (i % 2) * 1.4;
      c.celEll(x, y + 5, 4.6, 4.6, ['#e84a3a', '#3f77bd', '#f4d12e', '#5aa832', '#c58bff', '#ff7aa8'][i], null, 0.5);
      c.celEll(x, y - 1, 3.6, 3.4, fur[i], null, 0.5);
      c.poly([[x - 3.4, y - 3], [x - 2.4, y - 6.4], [x - 0.6, y - 4]], fur[i], 0.4); c.poly([[x + 3.4, y - 3], [x + 2.4, y - 6.4], [x + 0.6, y - 4]], fur[i], 0.4);
      c.ell(x - 1.3, y - 1.4, 0.55, 0.6, OUT, 0); c.ell(x + 1.3, y - 1.4, 0.55, 0.6, OUT, 0);
      if (up) { c.line(x + 3.6, y + 2, x + 5.6, y - 4, 1.2, fur[i]); c.ell(x + 5.8, y - 4.4, 1.2, 1.2, '#fff6e0', 0.3); }
    }
  });
  o.sc_start = sprite(220, 40, 1, (c) => {
    for (const x of [6, 208]) c.cel([[x - 4, 39], [x - 3.4, 6], [x + 9.4, 6], [x + 10, 39]], '#4a4a60', '#2e2e40', 0.7);
    c.celRR(2, 2, 216, 17, 3, '#e8e0d0', null, 0.8);
    for (let i = 0; i < 27; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) c.fill([[6 + i * 7.8, 4 + j * 6.4], [6 + i * 7.8 + 7.8, 4 + j * 6.4], [6 + i * 7.8 + 7.8, 4 + j * 6.4 + 6.4], [6 + i * 7.8, 4 + j * 6.4 + 6.4]], '#1a1a1a');
    c.celRR(64, 20, 92, 14, 3, '#e84a3a', null, 0.7);
    // START text as chunky pixels-free strokes
    const L = { S: [[1, 0], [0, 0.1], [0, 0.4], [1, 0.6], [1, 0.9], [0, 1]], T: [[0, 0], [1, 0]], A: [[0, 1], [0.5, 0], [1, 1]], R: [[0, 1], [0, 0], [1, 0.1], [1, 0.4], [0, 0.5]], };
    let x = 80; for (const ch of 'START') { const gl = L[ch]; c.stroke(gl.map(([u, v]) => [x + u * 7, 23 + v * 8]), 1.5, '#fff6e0'); if (ch === 'T') c.line(x + 3.5, 23, x + 3.5, 31, 1.5, '#fff6e0'); if (ch === 'A') c.line(x + 1.6, 28, x + 5.4, 28, 1.2, '#fff6e0'); if (ch === 'R') c.line(x + 3, 27.2, x + 7, 31, 1.4, '#fff6e0'); x += 12; }
  });
  o.sc_tunnel = sprite(300, 160, 1, (c) => {
    // rock face with an arch opening left transparent so the road shows through
    const arch = [];
    for (let i = 0; i <= 28; i++) { const a = Math.PI + (i / 28) * Math.PI; arch.push([150 + Math.cos(a) * 112, 118 + Math.sin(a) * 100]); }
    const hole = [[262, 159], ...arch.slice().reverse().map((p) => p), [38, 159]];
    void hole;
    // draw solid mass then erase the opening by painting rock only outside the arch: build outer polygon with arch as a notch
    const outer = [[0, 159], [0, 24], [20, 6], [90, 0], [150, 0], [210, 0], [280, 6], [300, 24], [300, 159], [262, 159], ...arch.slice().reverse().map(([x, y]) => [x, y]).reverse().reverse(), [38, 159]];
    c.cel(outer.slice(0, 10).concat(arch.slice().reverse().map(([x, y]) => [x, y]).reverse().reverse().slice().reverse().reverse()).concat([[38, 159]]), '#8a7aa0', '#5a4a72', 0.8);
    c.celRR(30, 6, 240, 12, 5, '#ffd23a', null, 0.7);
    for (let i = 0; i < 12; i++) c.fill([[34 + i * 20, 8], [44 + i * 20, 8], [38 + i * 20, 16], [28 + i * 20, 16]], '#2a2630');
    for (const [x, y, r] of [[22, 60, 8], [276, 70, 9], [40, 110, 6], [262, 118, 7], [150, 30, 7]]) c.ell(x, y, r, r * 0.8, '#3a3050', 0.5);
  });
  o.sc_cheese_house = sprite(64, 56, 1, (c) => {
    c.cel([[6, 55], [6, 28], [58, 28], [58, 55]], CH, CHD, 0.8);
    c.cel([[0, 30], [32, 4], [64, 30]], '#e84a3a', '#a82a28', 0.8);
    c.celRR(26, 36, 12, 19, 5, '#7a4a22', null, 0.6); c.ell(35, 46, 0.9, 0.9, CH, 0);
    c.celRR(10, 34, 11, 9, 2, '#9fe6ff', null, 0.6); c.celRR(43, 34, 11, 9, 2, '#9fe6ff', null, 0.6);
    for (const [x, y, r] of [[12, 49, 2.4], [52, 51, 2], [50, 31, 1.6]]) c.ell(x, y, r, r * 0.8, PAL.cheeseHole, 0.4);
    c.rect(44, 6, 6, 12, '#8a6a4a', 0.6);
  });
  o.sc_pete_billboard = sprite(96, 56, 1, (c) => {
    for (const x of [14, 82]) c.cel([[x - 2, 55], [x - 1.4, 40], [x + 1.4, 40], [x + 2, 55]], '#4a4a60', null, 0.6);
    c.celRR(2, 2, 92, 42, 4, '#3a2a40', '#241a2c', 0.9);
    c.fill([[6, 6], [90, 6], [90, 40], [6, 40]], '#5a2a3a');
    for (let i = 0; i < 6; i++) c.fill([[48, 24], [48 + Math.cos(i) * 90, 24 + Math.sin(i) * 90], [48 + Math.cos(i + 0.5) * 90, 24 + Math.sin(i + 0.5) * 90]], '#6a3040');
    peteHead(c, 30, 24, 1.5, 'snarl');
    const tx = (s, x, y) => { let X = x; for (const ch of s) { const gl = { W: [[0, 0], [0.25, 1], [0.5, 0.4], [0.75, 1], [1, 0]], A: [[0, 1], [0.5, 0], [1, 1]], N: [[0, 1], [0, 0], [1, 1], [1, 0]], T: [[0, 0], [1, 0]], E: [[1, 0], [0, 0], [0, 1], [1, 1]], D: [[0, 0], [0, 1], [0.7, 0.9], [0.7, 0.1], [0, 0]] }[ch]; if (!gl) { X += 5; continue; } c.stroke(gl.map(([u, v]) => [X + u * 5, y + v * 7]), 1.5, '#ffd23a'); if (ch === 'T') c.line(X + 2.5, y, X + 2.5, y + 7, 1.5, '#ffd23a'); X += 7.4; } };
    tx('WANTED', 52, 12); c.line(52, 26, 88, 26, 0.6, '#ffd23a'); c.celEll(70, 34, 4.6, 3.6, CH, CHD, 0.5);
  });
  return o;
}
void PI2; void light; void TP;
