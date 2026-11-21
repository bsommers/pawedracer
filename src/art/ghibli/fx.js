// Ghibli pack: particle FX (soft glows, no outlines) and HUD/UI pieces (painted paper plates with cheese trim). Owner: ghibli-style.
import { G, sprite, ell, poly, dot, line, shade, glowDot, star, TAU, hash } from './draw.js';

const PAPER = 'rgba(40,28,52,0.62)', TRIM = '#ffd23a';

function plate(kit, c, x, y, w, h) {
  kit.roundRect(c, x, y, w, h, 4); c.fillStyle = kit.lin(c, 0, y, 0, y + h, ['rgba(70,52,86,0.72)', 'rgba(30,20,42,0.72)']); c.fill();
  kit.roundRect(c, x + 0.5, y + 0.5, w - 1, h - 1, 3.6); c.lineWidth = 0.9; c.strokeStyle = 'rgba(255,210,58,0.85)'; c.stroke();
  kit.roundRect(c, x + 1.8, y + 1.8, w - 3.6, h - 3.6, 2.6); c.lineWidth = 0.3; c.strokeStyle = 'rgba(255,240,170,0.35)'; c.stroke();
}
const icon = [
  (kit, c, x, y, l) => { shade(kit, c, () => poly(c, [[x + 3, y + 8.6], [x + 2.4, y + 3], [x + 4.6, y + 5.4], [x + 6, y + 2.2], [x + 7.4, y + 5.4], [x + 9.6, y + 3], [x + 9, y + 8.6]]), G.gold, { lw: 0.4, y0: y + 2, y1: y + 9 }); },            // position crown
  (kit, c, x, y, l) => { c.beginPath(); c.arc(x + 6, y + 6, 3.4, 0, TAU); c.lineWidth = 1.2; c.strokeStyle = G.steel; c.stroke(); line(c, x + 6, y + 6, x + 6, y + 3.6, 0.7, '#fff'); line(c, x + 6, y + 6, x + 7.6, y + 6.8, 0.7, '#fff'); },    // lap clock
  (kit, c, x, y, l) => { shade(kit, c, () => { c.beginPath(); c.moveTo(x + 6, y + 1.8); c.quadraticCurveTo(x + 10.4, y + 6, x + 6, y + 10); c.quadraticCurveTo(x + 1.6, y + 6, x + 6, y + 1.8); }, G.flame, { lw: 0.4, y0: y + 2, y1: y + 10 }); ell(c, x + 6, y + 8, 1.4, 1.8); c.fillStyle = G.flameL; c.fill(); },   // heat
  (kit, c, x, y, l) => { shade(kit, c, () => kit.roundRect(c, x + 3, y + 3.4, 6, 6, 1), '#4a8ad8', { lw: 0.4, y0: y + 3, y1: y + 10 }); ell(c, x + 6, y + 3.6, 3, 0.9); c.fillStyle = G.steel; c.fill(); ell(c, x + 6, y + 6.8, 1.6, 1.2); c.fillStyle = '#ffb0a0'; c.fill(); },   // tuna
  (kit, c, x, y, l) => { dot(c, x + 6, y + 6, 4, G.red); c.lineWidth = 0.4; c.strokeStyle = G.ink; c.stroke(); line(c, x + 6, y + 3.6, x + 6, y + 8.4, 1, '#fff'); line(c, x + 3.6, y + 6, x + 8.4, y + 6, 1, '#fff'); },   // health
  (kit, c, x, y, l) => { shade(kit, c, () => poly(c, [[x + 2.4, y + 9], [x + 9.6, y + 8], [x + 9.6, y + 4], [x + 6, y + 2.2]]), G.cheese, { lw: 0.4, y0: y + 2, y1: y + 9 }); dot(c, x + 5.6, y + 6.4, 0.9, G.cheeseHole); dot(c, x + 8, y + 5.6, 0.6, G.cheeseHole); },   // cheese
  (kit, c, x, y, l) => { poly(c, [[x + 3.6, y + 2.8], [x + 9.4, y + 6], [x + 3.6, y + 9.2]]); c.fillStyle = '#6cf06c'; c.fill(); c.lineWidth = 0.35; c.strokeStyle = G.ink; c.stroke(); },   // go
  (kit, c, x, y, l) => { dot(c, x + 6, y + 7.4, 2.2, G.fur); for (const [dx, dy] of [[-3, -0.2], [-1.2, -2.4], [1.2, -2.4], [3, -0.2]]) dot(c, x + 6 + dx, y + 6 + dy, 1, G.fur); },   // paw
];

const PARTS = [
  (kit, c) => { shade(kit, c, () => kit.roundRect(c, 4, 8, 16, 12, 2.4), G.steelM, { lw: 0.5, y0: 8, y1: 20 }); for (let i = 0; i < 4; i++) shade(kit, c, () => kit.roundRect(c, 6 + i * 3.6, 3.6, 2, 5.4, 0.8), G.steel, { lw: 0.35 }); glowDot(kit, c, 12, 14, 5, G.flame, 0.8); dot(c, 12, 14, 2.4, G.flameL); },                                      // engine
  (kit, c) => { shade(kit, c, () => ell(c, 12, 12, 9, 9), G.glassD, { lw: 0.5, y0: 3, y1: 21 }); ell(c, 12, 12, 7, 7); c.fillStyle = kit.rgba(G.glass, 0.7); c.fill(); for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; poly(c, [[12, 12], [12 + Math.cos(a - 0.5) * 6.4, 12 + Math.sin(a - 0.5) * 6.4], [12 + Math.cos(a + 0.5) * 6.4, 12 + Math.sin(a + 0.5) * 6.4]]); c.fillStyle = G.white; c.fill(); } dot(c, 12, 12, 1.4, G.steelD); },      // cooling fan
  (kit, c) => { shade(kit, c, () => ell(c, 12, 12, 9.4, 9.4), '#2a2630', { lw: 0.5, y0: 3, y1: 21, hi: 0.4 }); ell(c, 12, 12, 4.6, 4.6); c.fillStyle = G.steelM; c.fill(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(c, 12 + Math.cos(a) * 7.6, 12 + Math.sin(a) * 7.6, 12 + Math.cos(a) * 9.2, 12 + Math.sin(a) * 9.2, 1.2, '#4a4658'); } dot(c, 12, 12, 1.4, G.steelD); },   // grip tyre
  (kit, c) => { shade(kit, c, () => { c.beginPath(); c.moveTo(12, 2); c.quadraticCurveTo(20, 3.4, 21, 6); c.quadraticCurveTo(21, 16, 12, 22); c.quadraticCurveTo(3, 16, 3, 6); c.quadraticCurveTo(4, 3.4, 12, 2); }, G.steelM, { lw: 0.55, y0: 2, y1: 22 }); poly(c, [[12, 4.4], [18, 6], [17, 14], [12, 19]]); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fill(); dot(c, 12, 10, 2, G.cheese); dot(c, 12.4, 9.6, 0.7, '#fff'); },    // armour shield
  (kit, c) => { shade(kit, c, () => poly(c, [[3, 12], [10, 6], [10, 18]]), G.steelD, { lw: 0.45, y0: 6, y1: 18 }); shade(kit, c, () => kit.roundRect(c, 9, 7, 9, 10, 1.4), G.steelM, { lw: 0.45, y0: 7, y1: 17 }); poly(c, [[18, 6], [23, 12], [18, 18]]); c.fillStyle = G.flame; c.fill(); poly(c, [[18, 9], [21.4, 12], [18, 15]]); c.fillStyle = G.flameL; c.fill(); glowDot(kit, c, 21, 12, 4, G.flame, 0.6); },   // thruster
];

export function build(kit) {
  const o = {};
  // ---- particles
  o.fx_spark = sprite(kit, 8, 8, 4, (c, i) => { const r = [3.4, 2.8, 2.2, 1.4][i]; glowDot(kit, c, 4, 4, 3.8, '#ffe27a', 0.5 - i * 0.08); star(c, 4, 4, r + 0.6, 0.5, 4, i * 0.3); c.fillStyle = '#fffbe0'; c.fill(); });
  o.fx_smoke = sprite(kit, 16, 16, 4, (c, i) => { const r = 4 + i * 1.1, a = 0.7 - i * 0.14; for (let k = 0; k < 3; k++) { const x = 8 + (k - 1) * 2.2, y = 8 - (k % 2) * 1.2; c.fillStyle = kit.radial(c, x, y, 0, r, [[0, `rgba(235,228,240,${a})`], [0.7, `rgba(180,172,196,${a * 0.6})`], [1, 'rgba(180,172,196,0)']]); ell(c, x, y, r, r); c.fill(); } });
  o.fx_fire = sprite(kit, 16, 16, 4, (c, i) => { const h = [12, 10, 13, 11][i], w = [5, 6, 4.6, 5.6][i]; glowDot(kit, c, 8, 9, 8, G.flame, 0.4); for (const [k, col] of [[1, G.flameD], [0.72, G.flame], [0.42, G.flameL]]) { c.beginPath(); c.moveTo(8, 15 - h * k); c.bezierCurveTo(8 + w * k * 1.1, 15 - h * k * 0.3, 8 + w * k * 0.7, 15, 8, 15); c.bezierCurveTo(8 - w * k * 0.7, 15, 8 - w * k * 1.1, 15 - h * k * 0.3, 8, 15 - h * k); c.fillStyle = col; c.fill(); } });
  o.fx_speed = sprite(kit, 24, 3, 1, (c) => { c.fillStyle = kit.lin(c, 0, 0, 24, 0, [[0, 'rgba(255,255,255,0)'], [0.7, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0.95)']]); c.beginPath(); c.moveTo(0, 1.5); c.lineTo(22, 0.3); c.quadraticCurveTo(24, 1.5, 22, 2.7); c.closePath(); c.fill(); });
  o.fx_stink = sprite(kit, 24, 24, 4, (c, i) => { for (let k = 0; k < 4; k++) { const a = i * 0.6 + k * 1.6, x = 12 + Math.cos(a) * 5, y = 13 + Math.sin(a * 1.3) * 4, r = 5.4; c.fillStyle = kit.radial(c, x, y, 0, r, [[0, 'rgba(150,205,90,0.6)'], [1, 'rgba(110,170,70,0)']]); ell(c, x, y, r, r); c.fill(); } for (let k = 0; k < 2; k++) { const x = 8 + k * 8; c.beginPath(); c.moveTo(x, 18 - i); c.bezierCurveTo(x + 2.4, 14, x - 2.4, 10, x, 5 + i); c.lineWidth = 0.9; c.strokeStyle = 'rgba(90,150,60,0.85)'; c.stroke(); } });
  o.fx_boost = sprite(kit, 32, 24, 4, (c, i) => {
    const L = [30, 25, 32, 27][i];
    glowDot(kit, c, 6, 12, 12, G.glass, 0.4);
    for (const [k, col, wd] of [[1, 'rgba(60,160,230,0.55)', 8], [0.78, 'rgba(140,215,255,0.8)', 5.4], [0.5, '#ffffff', 2.8]]) { c.beginPath(); c.moveTo(2, 12 - wd * 0.6); c.quadraticCurveTo(L * k * 0.5, 12 - wd, L * k, 12); c.quadraticCurveTo(L * k * 0.5, 12 + wd, 2, 12 + wd * 0.6); c.closePath(); c.fillStyle = col; c.fill(); }
    for (let k = 0; k < 4; k++) dot(c, 8 + ((i * 5 + k * 7) % 22), 7 + (k * 5 + i) % 10, 0.6, '#fff');
  });
  o.fx_confetti = sprite(kit, 6, 6, 4, (c, i) => { const cols = [G.red, G.gold, '#6cb8f0', '#8cc66a']; c.save(); c.translate(3, 3); c.rotate(i * 0.8); c.scale(1, Math.max(0.25, Math.abs(Math.cos(i * 0.8)))); c.fillStyle = cols[i]; c.fillRect(-2.2, -1.4, 4.4, 2.8); c.restore(); });
  o.fx_cheese_crumb = sprite(kit, 6, 6, 2, (c, i) => { shade(kit, c, () => poly(c, i ? [[1, 4.6], [3.4, 1], [5, 4.4]] : [[1, 4], [2.6, 1.2], [5, 3], [4, 5]]), G.cheese, { lw: 0.35, y0: 1, y1: 5, hi: 0.3 }); });
  // ---- ui
  o.hud_frame = sprite(kit, 320, 200, 1, (c) => {
    for (const [x, y, w, h] of [[2, 2, 58, 20], [260, 2, 58, 20], [2, 176, 86, 22], [110, 184, 100, 14], [230, 150, 88, 48]]) plate(kit, c, x, y, w, h);
    const v = kit.radial(c, 160, 100, 90, 230, [[0, 'rgba(40,20,50,0)'], [1, 'rgba(40,20,50,0.22)']]); c.fillStyle = v; c.fillRect(0, 0, 320, 200);   // painted vignette
    for (const [x, y, fx, fy] of [[0, 0, 1, 1], [320, 0, -1, 1], [0, 200, 1, -1], [320, 200, -1, -1]]) { c.beginPath(); c.moveTo(x + fx * 14, y); c.quadraticCurveTo(x, y, x, y + fy * 14); c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,210,58,0.7)'; c.stroke(); }
  });
  o.hud_heat = sprite(kit, 48, 8, 1, (c) => {
    kit.roundRect(c, 0.4, 0.4, 47.2, 7.2, 3.6); c.fillStyle = 'rgba(20,12,30,0.85)'; c.fill();
    kit.roundRect(c, 1.8, 1.8, 44.4, 4.4, 2.2); c.fillStyle = kit.lin(c, 1.8, 0, 46.2, 0, [[0, G.cheese], [0.5, G.flame], [0.8, '#ff6a2a'], [1, G.red]]); c.fill();
    kit.roundRect(c, 3, 2.2, 42, 1.2, 0.6); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill();
    kit.roundRect(c, 0.4, 0.4, 47.2, 7.2, 3.6); c.lineWidth = 0.7; c.strokeStyle = 'rgba(255,210,58,0.85)'; c.stroke();
    for (const x of [12, 23, 34]) line(c, x, 1.6, x, 6.4, 0.35, 'rgba(20,12,30,0.6)');
  });
  o.hud_icons = sprite(kit, 96, 12, 8, (c, f) => {
    for (let i = 0; i < 8; i++) {
      const x = i * 12, lit = i === f;
      if (lit) glowDot(kit, c, x + 6, 6, 8, '#ffd23a', 0.45);
      kit.roundRect(c, x + 0.8, 0.8, 10.4, 10.4, 3); c.fillStyle = kit.lin(c, 0, 0, 0, 12, ['rgba(70,52,86,0.8)', 'rgba(30,20,42,0.8)']); c.fill();
      c.lineWidth = lit ? 0.9 : 0.5; c.strokeStyle = lit ? '#ffd23a' : 'rgba(200,170,90,0.7)'; c.stroke();
      c.save(); if (!lit) c.globalAlpha = 0.8; icon[i](kit, c, x, 0, lit); c.restore();
    }
  });
  o.cursor_paw = sprite(kit, 12, 12, 2, (c, f) => { const y = f ? 0.8 : 0; for (const [x, yy, r] of [[2.2, 5, 1.5], [4.8, 2.6, 1.6], [7.6, 2.6, 1.6], [10, 5, 1.5]]) shade(kit, c, () => ell(c, x, yy - 0.6 + y, r, r * 1.2), G.fur, { lw: 0.4 }); shade(kit, c, () => ell(c, 6.2, 8 + y, 3.8, 3.2), G.fur, { lw: 0.5 }); dot(c, 6.2, 8.4 + y, 1.6, G.nose); dot(c, 5, 7 + y, 0.5, G.furL); });
  o.shop_parts = sprite(kit, 24, 24, 5, (c, i) => { kit.softShadow(c, 12, 21.4, 8, 1.6, 0.3, G.ink); PARTS[i](kit, c); });
  return o;
}
