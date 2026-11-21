// Ghibli pack: roadside scenery billboards. Painterly foliage, soft shading, dappled highlights. Owner: ghibli-style.
import { G, sprite, ell, poly, dot, line, shade, glowDot, sh, star, TAU, hash } from './draw.js';
import { peteFace } from './chars.js';

const FONT = '"Trebuchet MS","Segoe UI",Verdana,Arial,sans-serif';
const txt = (c, s, x, y, size, fill, lw = 0.9) => { c.font = `bold ${size}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = lw; c.strokeStyle = G.ink; c.lineJoin = 'round'; c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y); };

function palm(kit, c, i) {
  sh(kit, c, 24, 62, 12, 2, 0.3);
  const sw = i ? 1.2 : -1.2;
  c.beginPath(); c.moveTo(21, 63); c.quadraticCurveTo(25, 40, 24 + sw, 18); c.lineTo(28 + sw, 18); c.quadraticCurveTo(29, 40, 28, 63); c.closePath();
  c.fillStyle = kit.lin(c, 20, 0, 30, 0, [G.trunkL, G.trunk, kit.darken(G.trunk, 0.3)]); c.fill(); c.lineWidth = 0.5; c.strokeStyle = G.ink; c.stroke();
  for (let k = 0; k < 7; k++) { const y = 56 - k * 5.4; line(c, 22.4 + k * 0.5, y, 27.6 + k * 0.5, y - 1.2, 0.4, 'rgba(59,47,58,0.5)'); }
  const hx = 26 + sw, hy = 18;
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + (k - 3.5) * 0.52 + (i ? 0.05 : -0.05), L = 17 - Math.abs(k - 3.5) * 0.8;
    const ex = hx + Math.cos(a) * L, ey = hy + Math.sin(a) * L * 0.8 + Math.abs(k - 3.5) * 2.6;
    c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + Math.cos(a) * L * 0.6, hy + Math.sin(a) * L * 0.9 - 4, ex, ey); c.quadraticCurveTo(hx + Math.cos(a) * L * 0.6, hy + Math.sin(a) * L * 0.9 - 0.4, hx, hy + 1);
    c.fillStyle = kit.lin(c, hx, hy - 12, hx, hy + 14, [G.leafL, G.leaf, G.leafD]); c.fill(); c.lineWidth = 0.45; c.strokeStyle = G.ink; c.stroke();
    line(c, hx, hy, ex, ey - 0.4, 0.3, 'rgba(255,255,200,0.4)');
  }
  dot(c, hx - 1.4, hy + 2.2, 1.7, '#8a5a30'); dot(c, hx + 1.6, hy + 2.6, 1.7, '#7a4a28');
}
function rock(kit, c) {
  sh(kit, c, 24, 38, 21, 2.4, 0.3);
  for (const [x, y, rx, ry, col] of [[16, 28, 13, 10, G.rock], [32, 26, 12, 11, G.rockL], [24, 20, 11, 10, G.rock]]) {
    shade(kit, c, () => kit.blob(c, x, y, rx, ry, { seed: Math.floor(x), wobble: 0.14 }), col, { lw: 0.6, y0: y - ry, y1: y + ry });
    ell(c, x - rx * 0.3, y - ry * 0.4, rx * 0.4, ry * 0.2, -0.4); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fill();
  }
  c.beginPath(); c.moveTo(8, 31); c.quadraticCurveTo(14, 25, 22, 30); c.quadraticCurveTo(15, 34, 8, 31); c.fillStyle = G.leaf; c.globalAlpha = 0.85; c.fill(); c.globalAlpha = 1;   // moss
  for (const x of [34, 38]) { line(c, x, 36, x - 1, 32, 0.5, G.leafL); line(c, x, 36, x + 1, 32.4, 0.5, G.leaf); }
}
function wheelBig(kit, c) {
  sh(kit, c, 32, 62, 24, 2.4, 0.3);
  shade(kit, c, () => ell(c, 32, 31, 29.4, 29.4), G.rind, { lw: 0.7, y0: 2, y1: 62 });
  shade(kit, c, () => ell(c, 32, 31, 25.6, 25.6), G.cheese, { lw: 0.4, y0: 6, y1: 58 });
  c.save(); ell(c, 32, 31, 25.6, 25.6); c.clip();
  for (const [x, y, r] of [[24, 22, 4.6], [40, 28, 3.4], [30, 42, 5], [16, 40, 2.6], [43, 44, 2.2], [34, 14, 2.4]]) { dot(c, x, y, r, G.cheeseHole); dot(c, x + r * 0.2, y + r * 0.25, r * 0.7, kit.darken(G.cheeseHole, 0.2)); dot(c, x - r * 0.35, y - r * 0.35, r * 0.25, 'rgba(255,245,170,0.6)'); }
  c.restore();
  c.beginPath(); c.arc(32, 31, 22, Math.PI * 1.1, Math.PI * 1.55); c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,250,200,0.6)'; c.stroke();
  line(c, 10, 62, 54, 62, 0.01, 'rgba(0,0,0,0)');
}
function cactus(kit, c) {
  sh(kit, c, 16, 54.6, 10, 1.8, 0.3);
  const arm = (x0, y0, x1, y1) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x1, y0, x1, y1); c.lineWidth = 5; c.strokeStyle = G.ink; c.stroke(); c.lineWidth = 3.8; c.strokeStyle = G.leaf; c.stroke(); c.lineWidth = 1; c.strokeStyle = G.leafL; c.stroke(); };
  arm(16, 34, 5, 25); arm(16, 40, 27, 30);
  shade(kit, c, () => kit.roundRect(c, 11, 6, 10, 49, 5), G.leaf, { lw: 0.6, y0: 6, y1: 55 });
  for (const x of [13.4, 16, 18.6]) line(c, x, 9, x, 52, 0.3, 'rgba(45,106,69,0.7)');
  line(c, 12.6, 10, 12.6, 50, 0.7, 'rgba(255,255,200,0.3)');
  for (let k = 0; k < 6; k++) dot(c, 12 + (k % 3) * 4, 14 + k * 6.4, 0.35, '#fff6dc');
  for (const [x, y] of [[16, 5.6], [5, 21.4], [27, 26.4]]) { for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; dot(c, x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5, 1, '#ff9fb2'); } dot(c, x, y, 0.9, G.gold); }
}
function stalag(kit, c) {
  sh(kit, c, 20, 62.4, 15, 2, 0.3);
  c.beginPath(); c.moveTo(5, 63); c.quadraticCurveTo(14, 56, 16, 36); c.quadraticCurveTo(18, 14, 20, 2); c.quadraticCurveTo(22.6, 16, 25, 34); c.quadraticCurveTo(28, 54, 35, 63); c.closePath();
  c.fillStyle = kit.lin(c, 4, 0, 36, 0, ['#8a8098', '#6a6078', '#443c58']); c.fill(); c.lineWidth = 0.6; c.strokeStyle = G.ink; c.stroke();
  line(c, 17, 52, 19, 12, 0.8, 'rgba(255,255,255,0.28)');
  for (const [x, y, r] of [[14, 50, 1.6], [24, 44, 1.2], [18, 30, 1]]) dot(c, x, y, r, G.cheeseHole);
  glowDot(kit, c, 20, 8, 7, '#b9a2ff', 0.35);
}
function pine(kit, c, i) {
  sh(kit, c, 20, 70.4, 11, 1.8, 0.3);
  shade(kit, c, () => kit.roundRect(c, 17.6, 56, 4.8, 15, 1), G.trunk, { lw: 0.5, y0: 56, y1: 71 });
  const sw = i ? 0.6 : -0.6;
  for (let k = 0; k < 4; k++) {
    const y = 58 - k * 12, w = 17 - k * 3.2, ty = y - 19;
    shade(kit, c, () => poly(c, [[20 - w, y], [20 + sw * k * 0.5, ty], [20 + w, y], [20 + w * 0.5, y + 2.4], [20, y - 1], [20 - w * 0.5, y + 2.4]]), k % 2 ? '#3a7a58' : G.leafD, { lw: 0.55, y0: ty, y1: y + 3 });
    c.beginPath(); c.moveTo(20 + sw * k * 0.5, ty + 1); c.lineTo(20 - w * 0.55, y - 5); c.lineTo(20 - w * 0.2, y - 5.6); c.closePath(); c.fillStyle = 'rgba(180,220,120,0.5)'; c.fill();
  }
}
function mushroom(kit, c, i) {
  sh(kit, c, 20, 46.6, 12, 1.8, 0.3);
  shade(kit, c, () => { c.beginPath(); c.moveTo(14, 47); c.quadraticCurveTo(16, 32, 15.4, 26); c.lineTo(24.6, 26); c.quadraticCurveTo(24, 32, 26, 47); c.closePath(); }, G.parm, { lw: 0.55, y0: 26, y1: 47 });
  shade(kit, c, () => { c.beginPath(); c.moveTo(2, 28); c.quadraticCurveTo(3, 5, 20, 3.4); c.quadraticCurveTo(37, 5, 38, 28); c.quadraticCurveTo(20, 33, 2, 28); c.closePath(); }, '#d6504a', { lw: 0.65, y0: 3, y1: 32 });
  for (const [x, y, r] of [[12, 17, 3.4], [24, 11, 3], [30, 21, 2.6], [20, 22, 2], [8, 25, 1.6]]) { dot(c, x, y, r, G.brie); dot(c, x - r * 0.3, y - r * 0.3, r * 0.4, '#fff'); }
  glowDot(kit, c, 20, 20, i ? 22 : 18, '#ffd0c0', i ? 0.28 : 0.14);
  line(c, 6, 12, 14, 7, 0.9, 'rgba(255,255,255,0.4)');
}
function crystal(kit, c, i) {
  sh(kit, c, 16, 46.6, 12, 1.6, 0.3);
  glowDot(kit, c, 16, 28, i ? 17 : 13, '#9ab0ff', i ? 0.45 : 0.28);
  for (const [x, h, w, a, col] of [[9, 28, 6, -0.12, '#7a96e8'], [22, 34, 7, 0.1, '#9ab0ff'], [16, 44, 8, 0, '#b9c8ff'], [27, 20, 5, 0.2, '#7a96e8']]) {
    c.save(); c.translate(x, 46); c.rotate(a);
    shade(kit, c, () => poly(c, [[-w / 2, 0], [-w / 2 + 0.6, -h * 0.8], [0, -h], [w / 2 - 0.6, -h * 0.8], [w / 2, 0]]), col, { lw: 0.55, y0: -h, y1: 0, hi: 0.35 });
    line(c, -w / 6, -h * 0.9, -w / 6, -h * 0.1, 0.5, 'rgba(255,255,255,0.55)'); c.restore();
  }
  star(c, 8 + i * 14, 8 + i * 6, 2.2, 0.5, 4); c.fillStyle = '#fff'; c.fill();
}
function lamp(kit, c, i) {
  sh(kit, c, 8, 62.6, 6, 1.2, 0.3);
  shade(kit, c, () => kit.roundRect(c, 6.6, 12, 2.8, 51, 1), '#5a5668', { lw: 0.45, y0: 12, y1: 63 });
  shade(kit, c, () => kit.roundRect(c, 4.6, 58, 6.8, 5, 1.4), '#4a4658', { lw: 0.45 });
  glowDot(kit, c, 8, 9, i ? 14 : 10, G.flameL, i ? 0.65 : 0.4);
  shade(kit, c, () => { c.beginPath(); c.moveTo(3.6, 12); c.lineTo(5, 4); c.lineTo(11, 4); c.lineTo(12.4, 12); c.closePath(); }, '#fff0a0', { lw: 0.5, y0: 4, y1: 12, hi: 0.4, lo: 0.05 });
  poly(c, [[2.4, 4], [8, 0.8], [13.6, 4]]); c.fillStyle = '#4a4658'; c.fill(); c.lineWidth = 0.45; c.strokeStyle = G.ink; c.stroke();
}
function crowd(kit, c, i) {
  const cols = ['#d9b27a', '#c9c4d2', '#e8a8a0', '#a8c0e8', '#b9a28a', '#f0d8b0'];
  for (let k = 0; k < 8; k++) {
    const x = 5 + k * 7.6, h = hash(k * 13 + 5), up = ((i + k) % 4) < 2, y = 18 + (k % 2) * 3, col = cols[k % 6];
    for (const sx of [-1, 1]) line(c, x + sx * 3.3, y + 5, x + sx * 4.4, up ? y - 3 - h * 2 : y + 7, 1.5, G.ink), line(c, x + sx * 3.3, y + 5, x + sx * 4.4, up ? y - 3 - h * 2 : y + 7, 0.8, col);
    shade(kit, c, () => kit.roundRect(c, x - 3.6, y + 2, 7.2, 12 + (k % 2) * 3, 2.6), [G.scarf, '#4f86d6', '#6cb848', G.gold][k % 4], { lw: 0.45, y0: y, y1: 32 });
    shade(kit, c, () => ell(c, x, y, 3.6, 3.4), col, { lw: 0.45, y0: y - 3, y1: y + 4 });
    for (const sx of [-1, 1]) shade(kit, c, () => ell(c, x + sx * 2.8, y - 2.8, 1.5, 1.7), col, { lw: 0.35 });
    dot(c, x - 1.2, y - 0.4, 0.45, G.ink); dot(c, x + 1.2, y - 0.4, 0.45, G.ink);
    if (up) ell(c, x, y + 1.6, 1.1, 0.9), c.fillStyle = '#7a2a30', c.fill();
  }
}
function banner(kit, c, i) {
  const w1 = i ? 1.6 : -1.6;
  line(c, 3, 2, 3, 32, 1.4, G.trunk); line(c, 61, 2, 61, 32, 1.4, G.trunk);
  shade(kit, c, () => { c.beginPath(); c.moveTo(4, 4); c.quadraticCurveTo(32, 4 + w1 * 2, 60, 4); c.lineTo(60, 22); c.quadraticCurveTo(32, 22 - w1 * 2, 4, 22); c.closePath(); }, '#e0483c', { lw: 0.6, y0: 4, y1: 22 });
  for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(4 + k * 10.6, 4); c.lineTo(9.3 + k * 10.6, 4); c.lineTo(9.3 + k * 10.6 + 0, 22); c.lineTo(4 + k * 10.6, 22); c.closePath(); if (k % 2) { c.fillStyle = 'rgba(255,240,200,0.22)'; c.fill(); } }
  txt(c, 'GOUDA EVE', 32, 13.4, 9.4, G.cheese, 1.4);
  for (let k = 0; k < 6; k++) { const x = 8 + k * 9.6; poly(c, [[x, 22 - w1 * 0.4], [x + 4, 22 - w1 * 0.4], [x + 2, 28 + (k % 2) * 2]]); c.fillStyle = k % 2 ? G.cheese : '#fff6e0'; c.fill(); c.lineWidth = 0.4; c.strokeStyle = G.ink; c.stroke(); }
}
function sign(kit, c) {
  sh(kit, c, 16, 38.6, 8, 1.4, 0.3);
  shade(kit, c, () => kit.roundRect(c, 14.4, 16, 3.2, 23, 1), G.trunkL, { lw: 0.5, y0: 16, y1: 39 });
  shade(kit, c, () => kit.roundRect(c, 3, 2, 26, 17, 2.6), '#f6efd6', { lw: 0.6, y0: 2, y1: 19 });
  kit.roundRect(c, 4.6, 3.6, 22.8, 13.8, 1.6); c.lineWidth = 0.7; c.strokeStyle = G.scarf; c.stroke();
  poly(c, [[7, 10.6], [18, 10.6], [18, 7], [25, 10.6], [18, 14.4], [18, 10.6]]); c.fillStyle = G.scarf; c.fill();
  dot(c, 5.4, 4.4, 0.6, G.steelM); dot(c, 26.6, 4.4, 0.6, G.steelM);
}
function start(kit, c) {
  for (const x of [8, 212]) { shade(kit, c, () => kit.roundRect(c, x - 5, 6, 10, 34, 2), '#6a5a78', { lw: 0.6, y0: 6, y1: 40 }); }
  shade(kit, c, () => kit.roundRect(c, 2, 2, 216, 22, 4), '#fff6e0', { lw: 0.8, y0: 2, y1: 24 });
  c.save(); kit.roundRect(c, 2, 2, 216, 22, 4); c.clip();
  for (let k = 0; k < 36; k++) for (let r = 0; r < 2; r++) if ((k + r) % 2) { c.fillStyle = '#2a2234'; c.fillRect(2 + k * 6, 2 + r * 3, 6, 3); }
  c.restore();
  shade(kit, c, () => kit.roundRect(c, 40, 7, 140, 16, 5), '#e0483c', { lw: 0.6, y0: 7, y1: 23 });
  txt(c, 'START / FINISH', 110, 15.4, 11, G.cheese, 1.4);
  for (const x of [28, 192]) { glowDot(kit, c, x, 15, 6, G.flameL, 0.5); dot(c, x, 15, 2.4, G.flameL); }
}
function tunnel(kit, c) {
  c.save();
  c.beginPath(); c.moveTo(0, 160); c.lineTo(0, 62); c.quadraticCurveTo(0, 0, 150, 0); c.quadraticCurveTo(300, 0, 300, 62); c.lineTo(300, 160); c.lineTo(262, 160); c.lineTo(262, 70); c.quadraticCurveTo(262, 30, 150, 30); c.quadraticCurveTo(38, 30, 38, 70); c.lineTo(38, 160); c.closePath();
  c.fillStyle = kit.lin(c, 0, 0, 0, 160, ['#9a8e98', '#6e6478', '#4a4258']); c.fill(); c.lineWidth = 1.2; c.strokeStyle = G.ink; c.stroke();
  c.clip();
  for (let k = 0; k < 60; k++) { const x = hash(k) * 300, y = hash(k + 77) * 160, r = 3 + hash(k + 9) * 6; ell(c, x, y, r, r * 0.7); c.fillStyle = `rgba(${k % 2 ? '255,255,255' : '40,30,50'},0.12)`; c.fill(); }
  for (let k = 0; k < 9; k++) { const a = Math.PI + (k / 8) * Math.PI, x = 150 + Math.cos(a) * 138, y = 66 + Math.sin(a) * 52 + 12; dot(c, x, y, 3, G.cheese); glowDot(kit, c, x, y, 9, G.flameL, 0.35); }
  c.restore();
  c.save(); c.beginPath(); c.moveTo(38, 160); c.lineTo(38, 70); c.quadraticCurveTo(38, 30, 150, 30); c.quadraticCurveTo(262, 30, 262, 70); c.lineTo(262, 160); c.closePath(); c.fillStyle = kit.radial(c, 150, 110, 6, 130, [[0, '#0a0710'], [1, '#2a2036']]); c.fill(); c.restore();
}
function cheeseHouse(kit, c) {
  sh(kit, c, 32, 54.6, 26, 2, 0.3);
  shade(kit, c, () => kit.roundRect(c, 8, 22, 48, 33, 3), G.cheese, { lw: 0.7, y0: 22, y1: 55 });
  c.save(); kit.roundRect(c, 8, 22, 48, 33, 3); c.clip(); for (const [x, y, r] of [[14, 30, 2.2], [50, 44, 2.6], [44, 28, 1.6], [16, 48, 1.8]]) { dot(c, x, y, r, G.cheeseHole); dot(c, x - r * 0.3, y - r * 0.3, r * 0.3, 'rgba(255,245,170,0.6)'); } c.restore();
  shade(kit, c, () => poly(c, [[3, 25], [32, 3], [61, 25]]), '#d6504a', { lw: 0.7, y0: 3, y1: 25 });
  for (let k = 0; k < 4; k++) line(c, 10 + k * 7, 21 - k * 3.4 * (k < 2 ? 1 : 0), 14 + k * 7, 25, 0.4, 'rgba(59,47,58,0.35)');
  shade(kit, c, () => { c.beginPath(); c.moveTo(24, 55); c.lineTo(24, 40); c.arc(29, 40, 5, Math.PI, 0); c.lineTo(34, 55); c.closePath(); }, '#7a5236', { lw: 0.55, y0: 34, y1: 55 });
  dot(c, 32.4, 47, 0.7, G.gold);
  shade(kit, c, () => ell(c, 46, 36, 5, 5), '#8fd4ff', { lw: 0.6 }); glowDot(kit, c, 46, 36, 8, G.flameL, 0.3); line(c, 41, 36, 51, 36, 0.4, G.ink); line(c, 46, 31, 46, 41, 0.4, G.ink);
  shade(kit, c, () => kit.roundRect(c, 46, 6, 6, 12, 1), G.rindD, { lw: 0.5 });
}
function peteBillboard(kit, c) {
  line(c, 22, 44, 22, 56, 2.4, G.ink); line(c, 74, 44, 74, 56, 2.4, G.ink); line(c, 22, 44, 22, 56, 1.4, G.trunk); line(c, 74, 44, 74, 56, 1.4, G.trunk);
  shade(kit, c, () => kit.roundRect(c, 1, 1, 94, 46, 3), '#3a2a48', { lw: 0.8, y0: 1, y1: 47 });
  c.save(); kit.roundRect(c, 3.6, 3.6, 88.8, 40.8, 2); c.clip(); c.fillStyle = kit.radial(c, 30, 24, 2, 60, [[0, '#d9604a'], [1, '#7a2a38']]); c.fillRect(0, 0, 96, 48);
  for (let k = 0; k < 9; k++) line(c, 30, 24, 30 + Math.cos(k * 0.7) * 80, 24 + Math.sin(k * 0.7) * 80, 3, 'rgba(255,200,120,0.12)');
  c.save(); c.translate(6, -1); c.scale(0.92, 0.92); peteFace(kit, c, 1); c.restore(); c.restore();
  txt(c, 'PETE', 70, 16, 12, G.cheese, 1.6); txt(c, 'RULES!', 70, 30, 10.4, G.white, 1.4); txt(c, '*cheese terms apply', 70, 40, 3.6, G.paper, 0.4);
  for (const x of [6, 90]) for (const y of [6, 42]) dot(c, x, y, 0.8, G.steelM);
  for (const x of [26, 70]) { glowDot(kit, c, x, -0.5, 5, G.flameL, 0.3); }
}

const SC = {
  sc_palm: [48, 64, 2, palm], sc_rock: [48, 40, 1, rock], sc_wheel_big: [64, 64, 1, wheelBig], sc_cactus: [32, 56, 1, cactus], sc_stalag: [40, 64, 1, stalag], sc_pine: [40, 72, 2, pine],
  sc_mushroom: [40, 48, 2, mushroom], sc_crystal: [32, 48, 2, crystal], sc_lamp: [16, 64, 2, lamp], sc_crowd: [64, 32, 4, crowd], sc_banner: [64, 32, 2, banner], sc_sign: [32, 40, 1, sign],
  sc_start: [220, 40, 1, start], sc_tunnel: [300, 160, 1, tunnel], sc_cheese_house: [64, 56, 1, cheeseHouse], sc_pete_billboard: [96, 56, 1, peteBillboard],
};

export function build(kit) {
  const out = {};
  for (const [n, [w, h, f, fn]] of Object.entries(SC)) out[n] = sprite(kit, w, h, f, (c, i) => fn(kit, c, i));
  return out;
}
