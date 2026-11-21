// Particles (owner: render-road): small deterministic pool in screen space. Uses fx_* sprites when present, coloured rects otherwise.
import { PAL, W, H } from '../core/defs.js';
import { toDrawable } from '../art/registry.js';

const KINDS = {
  spark:    { art: 'fx_spark',  life: 0.45, grav: 260, col: PAL.flameL, size: 2 },
  smoke:    { art: 'fx_smoke',  life: 0.9,  grav: -30, col: '#8d8a96', size: 5, grow: 1.6, alpha: 0.7 },
  fire:     { art: 'fx_fire',   life: 0.6,  grav: -60, col: PAL.flame, size: 4, alpha: 0.9 },
  crumb:    { art: 'fx_cheese_crumb', life: 0.8, grav: 300, col: PAL.cheese, size: 2 },
  confetti: { art: 'fx_confetti', life: 2.2, grav: 70, col: PAL.scYellow, size: 3 },
  dust:     { art: 'fx_smoke',  life: 0.5,  grav: -10, col: PAL.sand, size: 3, grow: 1.3, alpha: 0.5 },
  flare:    { art: 'fx_boost',  life: 0.25, grav: 0, col: PAL.glass, size: 6, alpha: 0.8 },
};
const CONF = [PAL.scYellow, PAL.scRed, PAL.scBlue, PAL.green, PAL.nose, PAL.white];
const MAX = 480;

export function createParticles(seed = 1) {
  const list = [];
  let s = seed >>> 0 || 1;
  const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };   // xorshift32, deterministic
  const api = {
    get count() { return list.length; },
    emit(kind, x, y, n = 1, o = {}) {
      const k = KINDS[kind] ?? KINDS.spark;
      for (let i = 0; i < n && list.length < MAX; i++) {
        const a = o.dir ?? rnd() * Math.PI * 2, sp = (o.speed ?? 60) * (0.4 + rnd());
        list.push({ kind, k, x: x + (rnd() - 0.5) * (o.spread ?? 3), y: y + (rnd() - 0.5) * (o.spread ?? 3), vx: Math.cos(a) * sp + (o.vx ?? 0), vy: Math.sin(a) * sp + (o.vy ?? 0), age: 0, life: k.life * (0.7 + rnd() * 0.6), fr: (rnd() * 4) | 0, col: kind === 'confetti' ? CONF[(rnd() * CONF.length) | 0] : o.color ?? k.col });
      }
    },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i]; p.age += dt;
        if (p.age >= p.life || p.y > H + 8 || p.x < -8 || p.x > W + 8) { list[i] = list[list.length - 1]; list.pop(); continue; }
        p.vy += p.k.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
    },
    draw(g, art) {
      for (const p of list) {
        const u = p.age / p.life, a = (p.k.alpha ?? 1) * (1 - u * u), sz = p.k.size * (1 + (p.k.grow ?? 0) * u);
        const sp = art && art.has(p.k.art) ? art.get(p.k.art) : null;
        g.globalAlpha = Math.max(0, a);
        if (sp) { const f = sp.frames[(p.fr + ((u * 4) | 0)) % sp.frames.length]; g.drawImage(toDrawable(f), p.x - sz, p.y - sz, sz * 2, sz * 2); }
        else { g.fillStyle = p.col; g.fillRect(Math.round(p.x - sz / 2), Math.round(p.y - sz / 2), Math.max(1, Math.round(sz)), Math.max(1, Math.round(sz))); }
      }
      g.globalAlpha = 1;
    },
    clear() { list.length = 0; },
  };
  return api;
}
