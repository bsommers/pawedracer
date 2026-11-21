// Toon pods: rear-view cheese-wedge racers, flame overlay, shadow, barrel-roll and wreck frames. Rendered at HI_SCALE.
import { PAL, TOON_PAL as TP } from '../../core/defs.js';
import { Cv, sprite, shade, light, mixc, OUT, PI2 } from './vec.js';

/** pilots seen from behind: head + ears + helmet hint */
function pilot(c, x, y, k, o = {}) {
  const { fur, ear, kind = 'cat', helmet } = o, s = o.s ?? 1;
  const sc = (v) => v * s;
  if (kind === 'cat' || kind === 'dog') {
    c.cel([[x - sc(5.6), y - sc(3)], [x - sc(5), y - sc(8.2)], [x - sc(1.6), y - sc(5.2)]], fur);
    c.cel([[x + sc(5.6), y - sc(3)], [x + sc(5), y - sc(8.2)], [x + sc(1.6), y - sc(5.2)]], fur);
    c.poly([[x - sc(4.6), y - sc(4)], [x - sc(4.4), y - sc(6.6)], [x - sc(2.6), y - sc(5)]], ear, 0);
    c.poly([[x + sc(4.6), y - sc(4)], [x + sc(4.4), y - sc(6.6)], [x + sc(2.6), y - sc(5)]], ear, 0);
  } else if (kind === 'rat' || kind === 'mouse') {
    c.celEll(x - sc(5), y - sc(3.2), sc(2.8), sc(3.2), ear, null);
    c.celEll(x + sc(5), y - sc(3.2), sc(2.8), sc(3.2), ear, null);
  }
  c.celEll(x, y, sc(6.4), sc(5.6), fur);
  if (kind === 'cat') for (const dx of [-2.2, 0, 2.2]) c.line(x + sc(dx), y - sc(5.3), x + sc(dx * 0.8), y - sc(2.8), 0.7, TP.colbyStripe);
  if (helmet) {
    c.cel([[x - sc(6.6), y + sc(0.6)], [x - sc(6), y - sc(3.8)], [x, y - sc(6.6)], [x + sc(6), y - sc(3.8)], [x + sc(6.6), y + sc(0.6)], [x, y - sc(1.2)]], helmet);
  }
}

function podBody(c, w, h, o, tilt, tick, rear) {
  const cx = w / 2, by = h - 3;
  const { body, trim, glass = PAL.glass, kind, fur, ear, helmet, scarf = PAL.scarf, fat = 1 } = o;
  const nac = (w * 0.26) * (rear ? 1 : 1);
  c.rotT(tilt, cx, by, 0, 0, () => {
    // wing bar linking the nacelles
    c.cel([[cx - nac, h - 14], [cx + nac, h - 14], [cx + nac, h - 8], [cx - nac, h - 8]], trim);
    // nacelles
    for (const sx of [-1, 1]) {
      const nx = cx + sx * nac, nw = w * 0.11 * fat;
      c.cel([[nx - nw, h - 20], [nx + nw, h - 20], [nx + nw * 1.05, h - 4], [nx - nw * 1.05, h - 4]], trim, shade(trim, 0.3));
      c.celEll(nx, h - 20, nw, 2.4, light(trim, 0.25), null);
      c.ell(nx, h - 4, nw * 0.9, 1.9, '#1a1420', 0.4);
      c.ell(nx, h - 4, nw * 0.5, 1, PAL.flame, 0);
      c.line(nx - nw * 0.2, h - 18, nx - nw * 0.2, h - 8, 0.7, light(trim, 0.55));
    }
    // cheese wedge main body
    const bw = w * 0.30 * fat;
    c.cel([[cx - bw, h - 8], [cx - bw * 0.78, h - 17], [cx, h - 19], [cx + bw * 0.78, h - 17], [cx + bw, h - 8], [cx + bw * 0.7, h - 4], [cx - bw * 0.7, h - 4]], body);
    // holes (cheese) or trim panels
    if (o.holes) { c.ell(cx - bw * 0.4, h - 12, 1.7, 1.4, o.holes, 0.4); c.ell(cx + bw * 0.45, h - 8.5, 1.2, 1, o.holes, 0.4); c.ell(cx + bw * 0.1, h - 16, 1, 0.9, o.holes, 0.4); }
    if (o.stripe) c.fill([[cx - 1.6, h - 21], [cx + 1.6, h - 21], [cx + 1.8, h - 5], [cx - 1.8, h - 5]], o.stripe);
    // cockpit dome + pilot (head first, glass over it)
    const dy = h - 20.5, dr = w * 0.15;
    pilot(c, cx, dy + 0.8, 0, { fur, ear, kind, helmet, s: w * 0.0155 });
    c.fill(c.ellPts(cx, dy, dr, dr * 1.02), glass, 70);
    c.stroke(c.ellPts(cx, dy, dr, dr * 1.02), 0.9, OUT, true);
    c.ell(cx - dr * 0.45, dy - dr * 0.5, dr * 0.22, dr * 0.12, '#ffffff', 0, -0.6);
    // scarf streaming
    if (o.scarf !== false) {
      const sw = Math.sin(tick * 1.6) * 0.8;
      c.cel([[cx + 4.5, dy + 3], [cx + 8.5 + sw, dy + 3.6], [cx + 12 + sw * 1.4, dy + 0.5 + sw], [cx + 8 + sw, dy + 5.6], [cx + 4, dy + 5.2]], scarf, shade(scarf, 0.3), 0.4);
    }
  });
}

const LIV = {
  pod_colby: { w: 40, h: 28, body: PAL.cheese, trim: '#e84a3a', fur: TP.colbyFur, ear: TP.colbyEar, kind: 'cat', holes: PAL.cheeseHole, stripe: null, helmet: '#c9b26a' },
  pod_pete: { w: 48, h: 32, body: '#3b3d3a', trim: '#5a5d58', glass: '#7a2a2a', fur: TP.peteFur, ear: TP.peteSkin, kind: 'rat', stripe: '#e0262e', scarf: false, fat: 1.12, spikes: true },
  pod_r1: { w: 40, h: 28, body: '#6fb0ff', trim: '#2e5fa8', fur: '#a9a39c', ear: '#e8a0a0', kind: 'mouse', helmet: '#f4d12e', stripe: '#ffffff' },
  pod_r2: { w: 40, h: 28, body: '#7ed957', trim: '#2f7a2c', fur: '#d9b27a', ear: '#e8a0a0', kind: 'dog', helmet: '#e0392b', holes: '#3a8a3a' },
  pod_r3: { w: 40, h: 28, body: '#c58bff', trim: '#6a3aa8', fur: '#f2f2f2', ear: '#f0a0c0', kind: 'cat', stripe: '#f4d12e', scarf: '#f4d12e' },
  pod_r4: { w: 40, h: 28, body: '#ff7aa8', trim: '#a8305a', fur: '#8a8a95', ear: '#f0a0a0', kind: 'mouse', helmet: '#ffffff', holes: '#ffd0e0' },
  pod_r5: { w: 40, h: 28, body: '#ffd23a', trim: '#2a2a35', fur: '#6a4a3a', ear: '#e8a0a0', kind: 'dog', helmet: '#2a2a35', stripe: '#1a1a1a', scarf: '#2e5fa8' },
};

function pod(name, frames, fn) {
  const L = LIV[name];
  return sprite(L.w, L.h, frames, (c, f) => fn(c, f, L));
}

export function build() {
  const o = {};
  for (const n of ['pod_colby', 'pod_pete', 'pod_r1', 'pod_r2', 'pod_r3', 'pod_r4', 'pod_r5']) {
    o[n] = pod(n, 5, (c, f, L) => {
      const tilt = (f - 2) * 0.07, shift = (f - 2) * 0.5;
      c.withT((x, y) => [x + shift * (1 - (y / L.h)) * 0.4, y], () => {
        if (L.spikes) for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) c.poly([[L.w / 2 + sx * (11 + i * 2.2), L.h - 20 + i * 4], [L.w / 2 + sx * (16 + i * 2.2), L.h - 22 + i * 4], [L.w / 2 + sx * (11 + i * 2.2), L.h - 17 + i * 4]], '#2a2a28', 0.35);
        podBody(c, L.w, L.h, L, tilt, f, true);
      });
    });
  }
  o.pod_flame = sprite(12, 16, 4, (c, f) => {
    const len = [13, 15, 12, 14][f], wob = [0, 0.7, -0.5, 0.4][f], w0 = 4.4;
    const tear = (L, W, wb) => [[6 - W, 1], [6 + W, 1], [6 + W * 0.9, 4], [6 + W * 0.45 + wb, 1 + L * 0.7], [6 + wb * 1.6, 1 + L], [6 - W * 0.45 + wb, 1 + L * 0.7], [6 - W * 0.9, 4]];
    c.cel(tear(len, w0, wob), PAL.flameD, '#b02a10', 0.5);
    c.fill(tear(len * 0.78, w0 * 0.72, wob * 0.8), PAL.flame);
    c.fill(tear(len * 0.5, w0 * 0.42, wob * 0.5), PAL.flameL);
    c.fill(tear(len * 0.28, w0 * 0.2, 0), '#ffffff');
  });
  o.pod_shadow = sprite(40, 8, 1, (c) => { c.fill(c.ellPts(20, 4, 18.5, 3, 0, 40), '#14101c', 255); });
  o.pod_roll = pod('pod_colby', 6, (c, f, L) => {
    // barrel roll about the forward axis: squash width with cos, flip the pod upside down past 90 degrees
    const a = (f / 6) * PI2, cx = L.w / 2, cy = L.h * 0.6;
    const cz = Math.cos(a), sn = Math.sin(a);
    c.rotT(a * 0.9, cx, L.h * 0.52, 0, 0, () => {
      podBody(c, L.w, L.h, L, 0, f * 2, true);
    }, 0.7, 0.7);
    void cz; void cy; void sn;
    // motion streaks
    c.line(3, 6 + f, 8, 6 + f, 0.5, '#ffffffaa'.slice(0, 7), 140); c.line(L.w - 8, 18 - f, L.w - 3, 18 - f, 0.5, '#ffffff', 140);
  });
  o.pod_wreck = pod('pod_colby', 2, (c, f, L) => {
    const dark = { ...L, body: '#7a6a3a', trim: '#4a3a40', glass: '#5a6a7a', holes: '#4a3a1a' };
    c.rotT(f ? -0.16 : 0.12, L.w / 2, L.h - 3, f ? -1 : 1, 0, () => podBody(c, L.w, L.h, dark, 0, 0, true));
    // smoke puffs and X eyes of shame
    c.celEll(10 + f * 2, 6 - f, 4, 3, '#6a6470', '#4a4450'); c.celEll(16 + f, 2, 3, 2.4, '#8a8490', '#5a5460');
    c.line(L.w / 2 - 2.4, L.h - 27, L.w / 2 - 0.4, L.h - 25, 0.6, OUT); c.line(L.w / 2 - 0.4, L.h - 27, L.w / 2 - 2.4, L.h - 25, 0.6, OUT);
    c.poly([[L.w / 2 + 6, L.h - 12], [L.w / 2 + 9, L.h - 17 - f * 2], [L.w / 2 + 11, L.h - 11], [L.w / 2 + 13, L.h - 14 - f], [L.w / 2 + 12, L.h - 7]], PAL.flame, 0.4);
  });
  return o;
}
void mixc;
