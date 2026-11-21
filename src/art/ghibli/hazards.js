// Ghibli pack: hazards (40x32) and pickups (16x16). Soft painted cheese-world props with ink lines. Owner: ghibli-style.
import { G, sprite, ell, poly, dot, line, shade, glowDot, sh, holes, star, TAU } from './draw.js';

function wedge(kit, c, i) {
  const wob = i ? 0.8 : 0;
  sh(kit, c, 20, 29.5, 15, 2.2, 0.3);
  c.save(); c.translate(20, 29); c.rotate(wob * 0.025); c.translate(-20, -29);
  const side = () => poly(c, [[26, 29], [34, 27], [34, 18], [26, 7]]);
  shade(kit, c, side, G.cheeseD, { lw: 0.5, y0: 7, y1: 29 });
  const top = () => poly(c, [[6, 27], [26, 7], [26, 29]]);   // front face (triangle)
  const face = () => { c.beginPath(); c.moveTo(5, 28); c.quadraticCurveTo(14, 12, 26, 5); c.lineTo(28, 29); c.closePath(); };
  shade(kit, c, face, G.cheese, { lw: 0.55, y0: 5, y1: 29 });
  void top;
  c.save(); face(); c.clip();
  holes(kit, c, [[14, 24, 2.2], [21, 17, 2.8], [23.5, 25, 1.6], [18, 12.6, 1.2]]);
  c.restore();
  c.beginPath(); c.moveTo(5, 28); c.lineTo(28, 29); c.lineTo(34, 27); c.lineTo(11, 26); c.closePath(); c.fillStyle = G.rind; c.fill(); c.lineWidth = 0.4; c.strokeStyle = G.ink; c.stroke();   // rind base
  line(c, 8, 22, 16, 15, 0.7, 'rgba(255,245,170,0.6)');
  c.restore();
}
function wheel(kit, c, i) {
  sh(kit, c, 20, 29.5, 14, 2, 0.3);
  const cx = 20, cy = 17, R = 12.6;
  shade(kit, c, () => ell(c, cx, cy, R, R), G.rind, { lw: 0.6, y0: 4, y1: 30 });
  shade(kit, c, () => ell(c, cx, cy, R - 2.2, R - 2.2), G.cheese, { lw: 0.35, y0: 5, y1: 28 });
  c.save(); ell(c, cx, cy, R - 2.2, R - 2.2); c.clip(); c.translate(cx, cy); c.rotate(i * 0.9);
  holes(kit, c, [[-4, -4, 2.4], [4.5, -2, 1.8], [1, 5, 2.6], [-5.6, 4.6, 1.4], [5.8, 5.6, 1.1], [0, -8, 1.2]]);
  c.restore();
  for (let k = 0; k < 6; k++) { const a = i * 0.9 + (k / 6) * TAU; line(c, cx + Math.cos(a) * (R - 0.3), cy + Math.sin(a) * (R - 0.3), cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2), 0.5, G.rindD); }
  c.beginPath(); c.arc(cx, cy, R - 3, Math.PI * 1.15, Math.PI * 1.5); c.lineWidth = 0.8; c.strokeStyle = 'rgba(255,248,190,0.7)'; c.stroke();
}
function grater(kit, c, i) {
  sh(kit, c, 20, 28, 18, 2, 0.25);
  shade(kit, c, () => kit.roundRect(c, 2, 20, 36, 8.4, 1.4), G.steelM, { lw: 0.5, y0: 20, y1: 29 });
  for (let k = 0; k < 11; k++) {
    const x = 4 + k * 3.1 + (i ? 0.3 : 0);
    shade(kit, c, () => poly(c, [[x - 1.2, 20.4], [x, 11.6 + (k % 2) * 1.6], [x + 1.2, 20.4]]), G.steel, { lw: 0.4, hi: 0.3, lo: 0.2, y0: 11, y1: 21 });
    dot(c, x, 24.4, 0.9, G.steelD); dot(c, x - 0.3, 24.1, 0.35, '#fff');
  }
  for (let k = 0; k < 4; k++) dot(c, 8 + k * 8.5 + i * 2, 29.8, 0.7, G.cheeseL);        // shreds
}
function cutter(kit, c, i) {
  sh(kit, c, 20, 29.5, 17, 2, 0.25);
  for (const x of [4, 36]) { shade(kit, c, () => kit.roundRect(c, x - 2.4, 4, 4.8, 25.6, 1.4), G.rindD, { lw: 0.5, y0: 4, y1: 30 }); dot(c, x, 4.6, 2.6, G.steel); }
  const a = i ? 0.05 : -0.05;
  c.save(); c.translate(20, 6); c.rotate(a); c.translate(-20, -6);
  c.beginPath(); c.moveTo(4, 5.6); c.lineTo(36, 5.6); c.lineWidth = 0.7; c.strokeStyle = G.steelD; c.stroke();
  for (let k = 0; k < 6; k++) { const x = 8 + k * 4.8; line(c, x, 5.6, x, 25, 0.35, 'rgba(212,218,232,0.75)'); }       // taut wires
  shade(kit, c, () => poly(c, [[16, 8], [24, 8], [26, 26], [14, 26]]), G.steel, { lw: 0.5, hi: 0.35, lo: 0.25, y0: 8, y1: 26 });
  line(c, 16.6, 9, 14.8, 25, 0.7, 'rgba(255,255,255,0.7)');
  c.restore();
}
function fondue(kit, c, i) {
  glowDot(kit, c, 20, 24, 15, G.fondue, 0.45);
  shade(kit, c, () => ell(c, 20, 24, 17, 6.2), G.fondueD, { lw: 0.55, y0: 18, y1: 30, hi: 0.2 });
  shade(kit, c, () => ell(c, 20, 23.4, 14.6, 4.8), G.fondue, { lw: 0, y0: 18, y1: 28, hi: 0.35, outline: false });
  ell(c, 18, 22.6, 8, 2.4); c.fillStyle = kit.rgba(G.flameL, 0.55); c.fill();
  for (let k = 0; k < 5; k++) { const ph = (i * 0.5 + k * 0.37) % 1, x = 9 + k * 5.6, y = 23 - ph * 8 + (k % 2); const r = 0.8 + ph * 1.3 * (k % 2 ? 1 : 0.8); dot(c, x, y, r, kit.rgba(G.flameL, 0.9 - ph * 0.4)); c.lineWidth = 0.3; c.strokeStyle = G.fondueD; c.stroke(); }
}
function stink(kit, c, i) {
  for (let k = 0; k < 6; k++) {
    const x = 7 + k * 5.2, y = 21 + Math.sin(k * 1.7 + i * 1.2) * 3, r = 6 + (k % 3) * 1.4;
    c.fillStyle = kit.radial(c, x, y, 0, r, [[0, 'rgba(150,200,90,0.8)'], [0.7, 'rgba(110,170,70,0.5)'], [1, 'rgba(110,170,70,0)']]); ell(c, x, y, r, r * 0.8); c.fill();
  }
  for (let k = 0; k < 3; k++) { const x = 11 + k * 9, ph = (i * 0.5 + k * 0.3) % 1; c.beginPath(); c.moveTo(x, 18 - ph * 3); c.bezierCurveTo(x + 3, 14 - ph * 3, x - 3, 10 - ph * 3, x, 6 - ph * 3); c.lineWidth = 0.9; c.strokeStyle = `rgba(90,150,60,${0.8 - ph * 0.3})`; c.stroke(); }
  for (const [x, y] of [[13, 22], [27, 20]]) dot(c, x, y, 0.8, 'rgba(255,255,200,0.7)');
}
function mine(kit, c, i) {
  sh(kit, c, 20, 29.5, 11, 2, 0.3);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; shade(kit, c, () => poly(c, [[20 + Math.cos(a - 0.2) * 10, 20 + Math.sin(a - 0.2) * 9], [20 + Math.cos(a) * 14.4, 20 + Math.sin(a) * 13], [20 + Math.cos(a + 0.2) * 10, 20 + Math.sin(a + 0.2) * 9]]), G.steelD, { lw: 0.4, hi: 0.2, lo: 0.1, y0: 6, y1: 34 }); }
  shade(kit, c, () => ell(c, 20, 20, 10.4, 9.6), G.rind, { lw: 0.55, y0: 10, y1: 30 });
  shade(kit, c, () => ell(c, 20, 20, 8, 7.4), G.cheese, { lw: 0.3, y0: 12, y1: 28 });
  holes(kit, c, [[16, 17, 1.7], [23, 22, 1.5], [17.5, 23.5, 1]]);
  glowDot(kit, c, 20, 14.4, i ? 6 : 2, G.red, i ? 0.9 : 0.3); dot(c, 20, 14.4, 1.4, i ? '#ff7a6a' : '#8a2a2a');
}
function hole(kit, c, i) {
  shade(kit, c, () => ell(c, 20, 21, 17, 7.6), G.cheeseD, { lw: 0.6, y0: 13, y1: 29, hi: 0.1, lo: 0.2 });
  ell(c, 20, 21.6, 14.4, 5.8); c.fillStyle = kit.radial(c, 20, 21.6, 1, 15, [[0, '#0a0710'], [0.7, '#2a1a2a'], [1, '#5a3a2a']]); c.fill();
  c.beginPath(); c.ellipse(20, 21, 15, 6.4, 0, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 0.7; c.strokeStyle = 'rgba(255,245,170,0.7)'; c.stroke();
  for (let k = 0; k < 3; k++) dot(c, 10 + k * 10 + (i ? 1.4 : 0), 27, 0.7, G.cheeseL);
}

const HZ = { hz_wedge: wedge, hz_wheel: wheel, hz_grater: grater, hz_cutter: cutter, hz_fondue: fondue, hz_stink: stink, hz_mine: mine, hz_hole: hole };

// ------------------------------------------------------------------ pickups (16x16, 4 frames spin / glint)
const spin = (c, i) => Math.max(0.18, Math.abs(Math.cos(i * Math.PI / 4)));
const glint = (c, x, y, i, r = 2.2) => { star(c, x, y, r * (0.6 + 0.4 * ((i + 1) % 2)), r * 0.2, 4, i * 0.4); c.fillStyle = '#fff'; c.fill(); };
const PK = {
  pk_tuna(kit, c, i) {
    sh(kit, c, 8, 14.6, 5.6, 1, 0.3);
    c.save(); c.translate(8, 0); c.scale(spin(c, i), 1); c.translate(-8, 0);
    shade(kit, c, () => kit.roundRect(c, 3.2, 4.4, 9.6, 9.6, 1.4), '#4a8ad8', { lw: 0.5, y0: 4, y1: 14 });
    shade(kit, c, () => ell(c, 8, 4.8, 4.8, 1.5), G.steel, { lw: 0.4 });
    ell(c, 8, 9.4, 3, 2.3); c.fillStyle = '#ffb0a0'; c.fill(); c.lineWidth = 0.3; c.strokeStyle = G.ink; c.stroke();
    line(c, 4.4, 6.6, 4.4, 12.6, 0.6, 'rgba(255,255,255,0.5)'); c.restore(); glint(c, 12.8, 3.4, i, 2);
  },
  pk_mouse(kit, c, i) {
    sh(kit, c, 8, 14.6, 5.4, 1, 0.3);
    const bob = Math.sin(i * 1.57) * 0.8;
    shade(kit, c, () => ell(c, 4.4, 4.8 + bob, 2, 2), '#c9c4d2', { lw: 0.4 }); shade(kit, c, () => ell(c, 11.6, 4.8 + bob, 2, 2), '#c9c4d2', { lw: 0.4 });
    shade(kit, c, () => ell(c, 8, 9 + bob, 5.4, 4.6), '#d6d0de', { lw: 0.5, y0: 4, y1: 14 });
    dot(c, 6.2, 8 + bob, 0.7, G.ink); dot(c, 9.8, 8 + bob, 0.7, G.ink); dot(c, 8, 10 + bob, 0.7, G.nose);
    kit.roundRect(c, 6.8, 11.2 + bob, 2.4, 2.4, 0.4); c.fillStyle = G.red; c.fill(); line(c, 8, 11.6 + bob, 8, 13.2 + bob, 0.5, '#fff'); line(c, 7.2, 12.4 + bob, 8.8, 12.4 + bob, 0.5, '#fff');
    if (i === 2) glint(c, 13, 3.2, i, 2.2);
  },
  pk_coin(kit, c, i) {
    sh(kit, c, 8, 14.6, 5, 1, 0.3);
    c.save(); c.translate(8, 8); c.scale(spin(c, i), 1);
    shade(kit, c, () => ell(c, 0, 0, 5.8, 5.8), G.gold, { lw: 0.5, y0: -6, y1: 6 });
    ell(c, 0, 0, 4, 4); c.lineWidth = 0.4; c.strokeStyle = G.cheeseD; c.stroke();
    for (const sx of [-1, 1]) { line(c, sx * 1, 1.2, sx * 2.8, 0.2, 0.4, G.cheeseD); line(c, sx * 1, 2, sx * 2.8, 2.4, 0.4, G.cheeseD); }
    poly(c, [[-1.8, -0.4], [-1.2, -2.6], [-0.3, -0.8], [0.3, -0.8], [1.2, -2.6], [1.8, -0.4], [0, 1.6]]); c.fillStyle = G.cheeseD; c.fill();
    c.restore(); glint(c, 12.6, 3.4, i, 2.2);
  },
  pk_sardine(kit, c, i) {
    sh(kit, c, 8, 14.6, 6, 1, 0.3);
    shade(kit, c, () => kit.roundRect(c, 1.6, 4.6, 12.8, 8.4, 1.6), '#d63a2f', { lw: 0.5, y0: 4, y1: 13 });
    shade(kit, c, () => ell(c, 8, 8.6, 5, 2.4), '#c8d8ec', { lw: 0.4, hi: 0.4, y0: 6, y1: 11 });
    poly(c, [[12.6, 8.6], [14.6, 6.9], [14.6, 10.3]]); c.fillStyle = '#9aaac4'; c.fill(); dot(c, 4.2, 8.2, 0.55, G.ink);
    for (let k = 0; k < 3; k++) line(c, 6.4 + k * 1.8, 7, 6.4 + k * 1.8, 10.2, 0.3, 'rgba(100,120,150,0.6)');
    glint(c, 3 + ((i * 4) % 11), 6.2, i, 2);
  },
  pk_collar(kit, c, i) {
    sh(kit, c, 8, 14.6, 5.8, 1, 0.3);
    c.beginPath(); c.ellipse(8, 8, 5.8, 4.2, 0, 0.1, Math.PI - 0.1); c.lineWidth = 2.6; c.strokeStyle = G.ink; c.stroke(); c.lineWidth = 1.6; c.strokeStyle = '#d63a2f'; c.stroke();
    c.beginPath(); c.ellipse(8, 8, 5.8, 4.2, 0, 0.1, Math.PI - 0.1); c.setLineDash([0.6, 1.6]); c.lineWidth = 0.5; c.strokeStyle = G.gold; c.stroke(); c.setLineDash([]);
    shade(kit, c, () => ell(c, 8, 12.6 + Math.sin(i * 1.57) * 0.5, 2.1, 2.1), G.gold, { lw: 0.45 }); line(c, 8, 13, 8, 14.2, 0.4, G.ink);
    glint(c, 12.6, 4.4, i, 2.4);
  },
};

export function build(kit) {
  const out = {};
  for (const [n, f] of Object.entries(HZ)) out[n] = sprite(kit, 40, 32, 2, (c, i) => f(kit, c, i));
  for (const [n, f] of Object.entries(PK)) out[n] = sprite(kit, 16, 16, 4, (c, i) => f(kit, c, i));
  return out;
}
