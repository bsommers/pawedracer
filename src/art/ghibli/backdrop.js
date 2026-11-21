// Ghibli pack: painted skies (opaque) and parallax horizon layers (640 wide, seamless in x). Owner: ghibli-style.
// Frames carry LOGICAL w/h (640xH) because render/scene.js tiles them with f.w as destination width (see report).
import { G, sprite, ell, poly, dot, line, glowDot, TAU, hash, star } from './draw.js';

const W = 640;
/** periodic height function (integer frequencies so the strip tiles) in [-1,1] */
const wave = (x, s) => { const u = x / W; let v = 0, a = 1, tot = 0; for (let k = 0; k < 4; k++) { const f = [2, 5, 11, 23][k] + (s % 3); v += a * Math.sin(TAU * (u * f + hash(s * 7 + k))); tot += a; a *= 0.55; } return v / tot; };
const ridge = (c, base, amp, s, fn) => { c.beginPath(); c.moveTo(0, 200); for (let x = 0; x <= W; x += 4) c.lineTo(x, base - (fn ? fn(x, s) : amp * (0.5 + 0.5 * wave(x, s)))); c.lineTo(W, 200); c.closePath(); };
const cloudAt = (kit, c, x, y, w, h, seed, col, shade) => { for (const dx of [-W, 0, W]) { c.save(); c.translate(dx, 0); kit.cloud(c, x, y, w, h, seed); c.fillStyle = shade; c.fill(); c.save(); c.translate(0, -h * 0.07); kit.cloud(c, x, y, w * 0.94, h * 0.88, seed); c.fillStyle = col; c.fill(); c.restore(); c.restore(); } };

const SKY = {
  day:   { stops: ['#6fb8ee', '#a8dcf6', '#e6f2dc', '#fbf1cf'], cloud: '#ffffff', cs: '#d3e2f0', orb: ['#fff6b8', 520, 26, 11] },
  dusk:  { stops: ['#5a5fb0', '#b078a8', '#f0a094', '#ffd9a0'], cloud: '#ffd8c0', cs: '#c88aa0', orb: ['#fff0b0', 430, 60, 15] },
  night: { stops: ['#141a48', '#252e78', '#3c4a98', '#6a74b8'], cloud: '#5a68a8', cs: '#2c3678', orb: ['#fff6d8', 500, 24, 9] },
};
function sky(kit, c, k) {
  const P = SKY[k];
  c.fillStyle = kit.lin(c, 0, 0, 0, 80, P.stops); c.fillRect(0, 0, W, 80);
  if (k === 'night') for (let i = 0; i < 90; i++) { const x = hash(i) * W, y = hash(i + 300) * 62, r = 0.25 + hash(i + 60) * 0.5; dot(c, x, y, r, `rgba(255,250,225,${0.5 + hash(i + 9) * 0.5})`); }
  const [oc, ox, oy, or] = P.orb;
  glowDot(kit, c, ox, oy, or * 4.4, oc, k === 'night' ? 0.22 : 0.5); dot(c, ox, oy, or, oc);
  if (k === 'night') { dot(c, ox + or * 0.35, oy - or * 0.2, or * 0.85, '#252e78'); dot(c, ox - or * 0.2, oy + or * 0.2, or * 0.9, oc); dot(c, ox + or * 0.45, oy - or * 0.25, or * 0.8, '#2c3678'); }
  const n = k === 'night' ? 5 : 8;
  for (let i = 0; i < n; i++) { const x = (i + hash(i + 3) * 0.7) * (W / n), y = 12 + hash(i + 20) * 40, w = 50 + hash(i + 40) * 70; cloudAt(kit, c, x, y, w, 16 + hash(i) * 10, i + 2, P.cloud, P.cs); }
  if (k === 'dusk') { c.fillStyle = kit.lin(c, 0, 52, 0, 80, [[0, 'rgba(255,200,140,0)'], [1, 'rgba(255,190,120,0.45)']]); c.fillRect(0, 52, W, 28); }
  kit.paperGrain(c, W, 80, 11, { alpha: 0.05, density: 0.002, size: 0.5, maxSpecks: 3000 });
}
function hills(kit, c) {
  ridge(c, 40, 22, 3); c.fillStyle = kit.lin(c, 0, 18, 0, 48, ['#9cc8c4', '#b4d8c0']); c.fill();                   // far blue hills
  ridge(c, 44, 20, 8); c.fillStyle = kit.lin(c, 0, 24, 0, 48, ['#78b070', '#5a9a58']); c.fill();
  for (let i = 0; i < 40; i++) { const x = hash(i) * W, y = 44 - 20 * (0.5 + 0.5 * wave(x, 8)); const r = 3 + hash(i + 5) * 3; for (const dx of [-W, 0, W]) { ell(c, x + dx, y + 1, r, r * 0.9); c.fillStyle = kit.rgba(i % 2 ? '#3f8a50' : '#4f9a52', 0.9); c.fill(); ell(c, x + dx - r * 0.3, y - r * 0.3, r * 0.5, r * 0.4); c.fillStyle = 'rgba(190,230,130,0.55)'; c.fill(); } }
  ridge(c, 48, 9, 14); c.fillStyle = kit.lin(c, 0, 34, 0, 48, ['#4f9a52', '#2d6a45']); c.fill();
}
function mesa(kit, c) {
  const flat = (x, s) => { const v = wave(x, s); return 6 + 36 * Math.max(0, Math.min(1, (v + 0.15) * 2.6)); };
  ridge(c, 52, 0, 5, flat); c.fillStyle = kit.lin(c, 0, 10, 0, 56, ['#e0a070', '#c27850', '#9a5a40']); c.fill();
  c.save(); ridge(c, 52, 0, 5, flat); c.clip(); for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? 'rgba(255,220,170,0.18)' : 'rgba(110,50,40,0.16)'; c.fillRect(0, 14 + k * 7, W, 3); } c.restore();
  ridge(c, 56, 0, 12, (x, s) => 3 + 14 * (0.5 + 0.5 * wave(x, s))); c.fillStyle = kit.lin(c, 0, 36, 0, 56, ['#8a4a3a', '#5a3040']); c.fill();
}
function peaks(kit, c) {
  const jag = (x, s) => { const v = wave(x, s), t = Math.abs(((x / 64 + s) % 1) - 0.5) * 2; return 10 + 40 * (0.55 + 0.45 * v) * (0.55 + 0.45 * (1 - t)); };
  ridge(c, 64, 0, 1, jag); c.fillStyle = kit.lin(c, 0, 8, 0, 64, ['#a8b8e0', '#7a8cc0', '#5a6aa0']); c.fill();
  c.save(); ridge(c, 64, 0, 1, jag); c.clip(); ridge(c, 64 + 22, 0, 1, jag); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(255,255,255,0.0)'; c.fill();
  c.beginPath(); c.moveTo(0, 0); for (let x = 0; x <= W; x += 4) c.lineTo(x, 64 - jag(x, 1)); for (let x = W; x >= 0; x -= 4) c.lineTo(x, 64 - jag(x, 1) + 11 + 4 * Math.sin(x * 0.7)); c.closePath(); c.fillStyle = 'rgba(250,252,255,0.92)'; c.fill();   // snow caps
  c.restore();
  ridge(c, 64, 0, 7, (x, s) => 4 + 12 * (0.5 + 0.5 * wave(x, s))); c.fillStyle = kit.lin(c, 0, 44, 0, 64, ['#4a6a8a', '#2d4a6a']); c.fill();
}
function skyline(kit, c) {
  for (let layer = 0; layer < 2; layer++) {
    let x = layer * 9;
    while (x < W) {
      const w = 14 + Math.floor(hash(x * 3 + layer) * 18), h = 12 + hash(x + layer * 50) * 24 + (layer ? 0 : 8);
      c.fillStyle = kit.lin(c, 0, 48 - h, 0, 48, layer ? ['#6a5a98', '#4a3e78'] : ['#9a88c0', '#7a6aa8']); c.fillRect(x, 48 - h, Math.min(w, W - x), h);
      if (layer) for (let wy = 48 - h + 3; wy < 45; wy += 5) for (let wx = x + 2; wx < x + w - 2 && wx < W - 1; wx += 4) if (hash(wx * 13 + wy) > 0.45) { c.fillStyle = hash(wx + wy * 7) > 0.5 ? '#ffe49a' : '#ffb87a'; c.fillRect(wx, wy, 1.6, 2.2); }
      x += w + (layer ? 1 : 3);
    }
  }
  for (let k = 0; k < 8; k++) { const x = 20 + k * 80; line(c, x, 48, x, 14, 1, '#3a3050'); glowDot(kit, c, x, 12, 10, '#fff0b0', 0.55); dot(c, x, 12, 2.4, '#fffbe0'); }   // floodlight masts
}
function cave(kit, c) {
  ridge(c, 64, 0, 2, (x, s) => 8 + 34 * Math.pow(0.5 + 0.5 * wave(x, s), 1.4)); c.fillStyle = kit.lin(c, 0, 10, 0, 64, ['#5a4a78', '#3a3058', '#241c3c']); c.fill();
  ridge(c, 64, 0, 9, (x, s) => 2 + 18 * Math.pow(0.5 + 0.5 * wave(x, s), 1.2)); c.fillStyle = kit.lin(c, 0, 30, 0, 64, ['#2c2448', '#161028']); c.fill();
  for (let i = 0; i < 26; i++) { const x = hash(i + 4) * W, y = 64 - (8 + 34 * Math.pow(0.5 + 0.5 * wave(x, 2), 1.4)) + 3; for (const dx of [-W, 0, W]) { glowDot(kit, c, x + dx, y, 6, i % 3 ? '#b9a2ff' : '#7ae0ff', 0.45); poly(c, [[x + dx - 1, y + 3], [x + dx, y - 2.6], [x + dx + 1, y + 3]]); c.fillStyle = i % 3 ? '#cdbaff' : '#a8f0ff'; c.fill(); } }
}

export function build(kit) {
  const o = {};
  for (const k of ['day', 'dusk', 'night']) o['bg_sky_' + k] = sprite(kit, W, 80, 1, (c) => sky(kit, c, k), { logical: true });
  o.bg_hills = sprite(kit, W, 48, 1, (c) => hills(kit, c), { logical: true });
  o.bg_mesa = sprite(kit, W, 56, 1, (c) => mesa(kit, c), { logical: true });
  o.bg_peaks = sprite(kit, W, 64, 1, (c) => peaks(kit, c), { logical: true });
  o.bg_skyline = sprite(kit, W, 48, 1, (c) => skyline(kit, c), { logical: true });
  o.bg_cave = sprite(kit, W, 64, 1, (c) => cave(kit, c), { logical: true });
  void G; void star;
  return o;
}
