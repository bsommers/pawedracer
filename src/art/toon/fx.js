// Toon FX and UI art: sparks, smoke, fire, speed lines, stink, boost flare, confetti, crumbs; HUD frame/heat/icons, paw cursor, shop parts.
import { PAL, TOON_PAL as TP } from '../../core/defs.js';
import { sprite, shade, light, mixc, OUT, PI2, hash } from './vec.js';

const star = (cx, cy, r, ri, n, rot = 0) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * PI2, rr = i % 2 ? ri : r; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; };

export function build() {
  const o = {};
  o.fx_spark = sprite(8, 8, 4, (c, f) => { const r = [2.2, 3.6, 3, 1.8][f]; c.poly(star(4, 4, r, r * 0.35, 4, f * 0.4), f > 1 ? '#ffb02a' : '#fff08a', 0.3); c.fill(c.ellPts(4, 4, r * 0.28, r * 0.28, 0, 8), '#ffffff'); });
  o.fx_smoke = sprite(16, 16, 4, (c, f) => {
    const r = 3 + f * 1.3, a = 255 - f * 40;
    for (const [x, y, k] of [[8, 9 - f, 1], [5.6, 10 - f * 0.6, 0.7], [10.6, 10.4 - f * 0.4, 0.75]]) { c.fill(c.ellPts(x, y, r * k + 0.8, r * k + 0.8), '#2a2430', Math.max(90, a - 20)); }
    for (const [x, y, k] of [[8, 9 - f, 1], [5.6, 10 - f * 0.6, 0.7], [10.6, 10.4 - f * 0.4, 0.75]]) c.fill(c.ellPts(x - 0.4, y - 0.4, r * k, r * k), '#a8a2b0', Math.max(80, a - 40));
    c.fill(c.ellPts(6.6, 7.4 - f, r * 0.4, r * 0.3), '#d8d4e0', Math.max(60, a - 80));
  });
  o.fx_fire = sprite(16, 16, 4, (c, f) => {
    const L = [12, 13.5, 11, 12.5][f], w = [0.2, -0.5, 0.4, -0.2][f];
    const tear = (l, W, wb) => [[8 - W, 14], [8 - W * 1.1, 10], [8 - W * 0.4 + wb, 14 - l * 0.7], [8 + wb * 1.6, 14 - l], [8 + W * 0.4 + wb, 14 - l * 0.7], [8 + W * 1.1, 10], [8 + W, 14]];
    c.cel(tear(L, 5, w), PAL.flameD, '#a02a10', 0.5); c.fill(tear(L * 0.75, 3.6, w), PAL.flame); c.fill(tear(L * 0.46, 2, w * 0.5), PAL.flameL);
  });
  o.fx_speed = sprite(24, 3, 1, (c) => { c.fill([[0, 1.5], [10, 0.4], [24, 1.1], [24, 1.9], [10, 2.6]], '#ffffff', 230); c.fill([[8, 1.5], [24, 1.3], [24, 1.7]], '#cfeeff'); });
  o.fx_stink = sprite(24, 24, 4, (c, f) => {
    for (const [x, y, r] of [[8, 16 - f, 5], [15, 14 - f * 0.6, 6], [12, 9 - f * 1.4, 4.4]]) c.celEll(x, y, r, r * 0.85, '#8ed25a', '#5a9a3a', 0.5);
    c.curve([[7 + f, 8], [9, 5], [6 + f, 2], [8, 0.4]], 0.6, '#5a9a3a');
  });
  o.fx_boost = sprite(32, 24, 4, (c, f) => {
    const L = [20, 24, 22, 26][f] * 0.9;
    const cone = (l, w, wb) => [[16 - w, 2], [16 + w, 2], [16 + w * 0.7 + wb, 2 + l * 0.6], [16 + wb * 2, 2 + l], [16 - w * 0.7 + wb, 2 + l * 0.6]];
    c.fill(cone(L, 13, f - 1.5), '#2e8aff', 150); c.fill(cone(L * 0.82, 9, f - 1.5), '#6ac8ff', 220); c.fill(cone(L * 0.55, 5, 0), '#ffffff', 255);
    for (let i = 0; i < 4; i++) c.line(7 + i * 6, 3 + (i + f) % 3, 7 + i * 6, 9 + ((i + f) % 3) * 2, 0.6, '#ffffff', 200);
  });
  o.fx_confetti = sprite(6, 6, 4, (c, f) => { const col = ['#ff4a5a', '#ffd23a', '#4fb0ff', '#6cf06c'][f], w = [2.4, 1.2, 2.6, 1.6][f]; c.rotT(f * 0.9, 3, 3, 0, 0, () => c.poly([[3 - w, 1], [3 + w, 1], [3 + w, 5], [3 - w, 5]], col, 0.3)); });
  o.fx_cheese_crumb = sprite(6, 6, 2, (c, f) => { c.poly(f ? [[1, 4.6], [3, 1], [5, 4.6]] : [[1, 1.6], [5, 1.2], [4, 5]], PAL.cheese, 0.4); c.fill(c.ellPts(3, 3.2, 0.5, 0.5, 0, 6), PAL.cheeseHole); });

  // ---------------------------------------------------------------- ui
  o.hud_frame = sprite(320, 200, 1, (c) => {
    const panel = (x, y, w, h, hl) => { c.rr(x, y, w, h, 4, '#14101c', 0.7); c.fill(rrp(x, y, w, h, 4), '#1a1420', 150); c.stroke(rrp(x, y, w, h, 4), 0.9, hl ?? '#ffd23a', true, 220); c.stroke(rrp(x + 1.2, y + 1.2, w - 2.4, h - 2.4, 3), 0.35, '#fff0a0', true, 120); };
    panel(2, 2, 58, 20); panel(260, 2, 58, 20); panel(2, 176, 86, 22); panel(110, 184, 100, 14); panel(230, 150, 88, 48);
    for (const [x, y, fx, fy] of [[1, 1, 1, 1], [319, 1, -1, 1], [1, 199, 1, -1], [319, 199, -1, -1]]) c.cel([[x, y], [x + fx * 12, y], [x + fx * 12, y + fy * 3], [x + fx * 3, y + fy * 3], [x + fx * 3, y + fy * 12], [x, y + fy * 12]], '#ffd23a', null, 0.5);
  });
  o.hud_heat = sprite(48, 8, 1, (c) => {
    c.rr(0.6, 0.6, 46.8, 6.8, 3, '#14101c', 0.6);
    const g = [[2, 14, '#ffd23a'], [16, 34, '#ffb02a'], [34, 46, '#ff4a3a']]; for (const [a, b, col] of g) c.fill([[a, 2], [b, 2], [b, 6], [a, 6]], col);
    c.fill([[2, 2], [46, 2], [46, 3.2], [2, 3.2]], '#ffffff', 90);
    for (const x of [13, 24, 35]) c.line(x, 1.2, x, 6.8, 0.5, '#14101c');
  });
  o.hud_icons = sprite(96, 12, 8, (c, f) => {
    for (let i = 0; i < 8; i++) {
      const x = i * 12, lit = i === f, hl = lit ? '#ffe45a' : '#8d7a3a', k = (cx, cy) => [x + cx, cy];
      c.rr(x + 0.8, 0.8, 10.4, 10.4, 3, lit ? '#3a2a14' : '#1a1420', 0.5); c.stroke(rrp(x + 0.8, 0.8, 10.4, 10.4, 3), 0.55, hl, true);
      const col = (v) => (lit ? v : shade(v, 0.35));
      if (i === 0) { c.poly([[x + 3, 3], [x + 9, 3], [x + 8, 7], [x + 4, 7]], col('#ffd23a'), 0.3); c.line(x + 6, 7, x + 6, 9.4, 0.6, col('#ffd23a')); c.line(x + 4, 9.6, x + 8, 9.6, 0.7, col('#ffd23a')); }
      if (i === 1) { c.stroke(c.ellPts(x + 6, 6, 3.2, 3.2), 0.9, col('#c8d0e0'), true); c.line(x + 6, 6, x + 6, 3.6, 0.5, '#ffffff'); }
      if (i === 2) c.poly([[x + 3.4, 9], [x + 6, 2.4], [x + 8.6, 9]], col('#ff8a2a'), 0.3);
      if (i === 3) { c.rr(x + 3, 3.8, 6, 5.6, 1, col('#c8d0e0'), 0.3); c.fill([[x + 3, 6], [x + 9, 6], [x + 9, 8], [x + 3, 8]], col('#3f77bd')); }
      if (i === 4) { c.fill(c.ellPts(x + 6, 6, 3.4, 3.4), col('#e84a3a')); c.fill([[x + 5.2, 3.6], [x + 6.8, 3.6], [x + 6.8, 8.4], [x + 5.2, 8.4]], '#fff6e0'); c.fill([[x + 3.6, 5.2], [x + 8.4, 5.2], [x + 8.4, 6.8], [x + 3.6, 6.8]], '#fff6e0'); }
      if (i === 5) { c.fill(c.ellPts(x + 6, 6, 3.2, 3.2), col('#ffd23a')); c.fill(c.ellPts(x + 5, 5, 0.6, 0.6), '#a87a2a'); c.fill(c.ellPts(x + 7, 7, 0.6, 0.6), '#a87a2a'); }
      if (i === 6) c.poly([[x + 3.6, 3], [x + 9, 6], [x + 3.6, 9]], col('#6cf06c'), 0.3);
      if (i === 7) { c.fill(c.ellPts(x + 6, 7, 2.6, 2), col('#ff8fa3')); for (const [dx, dy] of [[-3, 4.4], [-1.2, 3], [1.2, 3], [3, 4.4]]) c.fill(c.ellPts(x + 6 + dx, dy, 0.9, 1.1), col('#ff8fa3')); }
    }
  });
  o.cursor_paw = sprite(12, 12, 2, (c, f) => {
    const y = f ? 1 : 0;
    c.celEll(6, 8 + y, 3.8, 3.2, '#e8963c', null, 0.5); for (const [x, yy] of [[2, 4.6], [4.8, 2.4], [7.6, 2.4], [10, 4.6]]) c.celEll(x, yy + y, 1.5, 1.7, '#e8963c', null, 0.4);
    c.ell(6, 9 + y, 1.6, 1.2, '#ff8fa3', 0.2);
  });
  o.shop_parts = sprite(24, 24, 5, (c, f) => {
    if (f === 0) { c.celRR(4, 9, 16, 11, 2.5, '#7a8298', null, 0.6); for (let i = 0; i < 4; i++) c.celRR(6 + i * 4, 4, 2.6, 6, 1, '#c8d0e0', null, 0.4); c.celEll(12, 15, 3.4, 3.4, '#ff8a2a', '#d63a1a', 0.5); c.fill(c.ellPts(12, 15, 1.4, 1.4), '#fff0a0'); }
    if (f === 1) { c.celEll(12, 12, 9, 9, '#9fe6ff', '#4fb0d8', 0.7); for (let i = 0; i < 4; i++) { const t = i * Math.PI / 4; c.line(12 + Math.cos(t) * 6, 12 + Math.sin(t) * 6, 12 - Math.cos(t) * 6, 12 - Math.sin(t) * 6, 0.9, '#ffffff'); } }
    if (f === 2) { c.celEll(12, 12, 9.4, 9.4, '#2a2430', '#14101c', 0.7); c.celEll(12, 12, 4.4, 4.4, '#c4742a', '#8f4f1a', 0.6); for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; c.line(12 + Math.cos(t) * 7, 12 + Math.sin(t) * 7, 12 + Math.cos(t) * 8.4, 12 + Math.sin(t) * 8.4, 0.9, '#6a6478'); } }
    if (f === 3) { c.cel([[12, 2], [21, 5.6], [19.4, 17], [12, 22], [4.6, 17], [3, 5.6]], '#ffd23a', '#d9a41a', 0.7); c.fill(c.ellPts(8, 9, 1.8, 1.4), PAL.cheeseHole); c.fill(c.ellPts(14, 14, 2, 1.6), PAL.cheeseHole); c.line(12, 4, 12, 20, 0.5, '#ffffff', 120); }
    if (f === 4) { c.cel([[2, 12], [8, 5], [8, 19]], '#ff8a2a', null, 0.6); c.celRR(8, 6, 10, 12, 2, '#c8d0e0', null, 0.6); c.cel([[18, 6], [23, 12], [18, 18]], '#ffb02a', null, 0.5); c.fill([[18, 9], [21.4, 12], [18, 15]], '#fff0a0'); }
  });
  return o;
}
function rrp(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); const out = [], k = 4, arc = (cx, cy, a0) => { for (let i = 0; i <= k; i++) { const t = a0 + (i / k) * (Math.PI / 2); out.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r]); } }; arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI); return out; }
void light; void mixc; void OUT; void hash; void TP;
