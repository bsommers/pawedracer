// Toon render style (owner: toon-style). Loaded by renderer.js as the optional style module: exports `theme` (fn(biome,tod) -> partial theme
// override, saturated cel colours, banded stripes) and `hooks` ({ beforeSky, afterWorld, afterHud } called as hook(g, ctx, view, state)).
// The art pack lives in src/art/toon/*.js (build(kit) -> HI_SCALE PixBuf frames). Pure data + guarded drawing: safe to import in Node.
import { W, H, ROAD } from '../core/defs.js';
import { toDrawable } from '../art/registry.js';

export const STYLE = 'toon';

// Saturated, flat colour pairs per biome (outline-friendly: rumble strips stay high contrast).
const BIOME = {
  coast:   { grass: ['#f2cf7a', '#e8bf62'], road: ['#4a4a5e', '#565670'], rumble: ['#ee4a3a', '#fff6e0'], wall: ['#4a8ac0', '#3a78b0'], fog: '#d4f0ff', sky: '#4aa8ff', accent: '#20c8e0' },
  mesa:    { grass: ['#e88a44', '#d87a38'], road: ['#52424e', '#625060'], rumble: ['#ffa030', '#fff6e0'], wall: ['#b8602a', '#a05222'], fog: '#ffd8a8', sky: '#ffa860', accent: '#ff9a2a' },
  tunnels: { grass: ['#625a70', '#554d62'], road: ['#3a384a', '#46435a'], rumble: ['#ffd23a', '#2a2630'], wall: ['#524a62', '#463e56'], fog: '#201832', sky: '#2e2240', accent: '#ffd23a' },
  lava:    { grass: ['#6a2e24', '#58231c'], road: ['#30282e', '#3e2e34'], rumble: ['#ff9a2a', '#2a1a18'], wall: ['#44201a', '#341610'], fog: '#7a2a14', sky: '#c04a20', accent: '#ff8a2a' },
  bog:     { grass: ['#4a8a46', '#3c7a3c'], road: ['#3a4040', '#464e4e'], rumble: ['#4aa07a', '#f2ead0'], wall: ['#2e5a42', '#264c38'], fog: '#8ab08a', sky: '#8aae9e', accent: '#4aa07a' },
  snow:    { grass: ['#ffffff', '#e4ecfa'], road: ['#505668', '#5c6276'], rumble: ['#ee4a3a', '#e4ecfa'], wall: ['#a4bcdc', '#94acd0'], fog: '#eef4ff', sky: '#9cc8ff', accent: '#7ad8ff' },
  caves:   { grass: ['#443e60', '#383254'], road: ['#2e2c48', '#38355a'], rumble: ['#8aa0d8', '#1c1a34'], wall: ['#2e2a48', '#262240'], fog: '#161026', sky: '#1e1638', accent: '#b48aff' },
  arena:   { grass: ['#44a044', '#389038'], road: ['#4a4a5e', '#585872'], rumble: ['#ee4a3a', '#fff6e0'], wall: ['#5a4a80', '#4c3c72'], fog: '#281e52', sky: '#322474', accent: '#ffd23a' },
};
export const theme = (biome) => BIOME[biome] ?? BIOME.coast;

function blit(g, art, name, frame = 0, x = 0, y = 0, w = null, h = null) {
  if (!art || !art.has(name)) return false;
  const s = art.get(name), f = s.frames[frame % s.frames.length];
  g.drawImage(toDrawable(f), x, y, w ?? s.w, h ?? s.h);
  return true;
}

/** soft cel vignette: three flat translucent rings instead of a gradient (toon look) */
function vignette(g, amt) {
  if (amt <= 0) return;
  g.fillStyle = '#1a1420';
  for (let i = 0; i < 3; i++) {
    g.globalAlpha = amt * (0.12 + i * 0.05);
    const t = 3 + i * 3;
    g.fillRect(0, 0, W, t * 0.5); g.fillRect(0, H - t * 0.5, W, t * 0.5); g.fillRect(0, 0, t, H); g.fillRect(W - t, 0, t, H);
  }
  g.globalAlpha = 1;
}

export const hooks = {
  beforeSky() {},
  /** after billboards, before FX and HUD: toon HUD plates under the bitmap text, speed vignette */
  afterWorld(g, ctx, view, S) {
    const P = view.player ?? view.pods?.[0], boost = !!(P && P.boost && P.boost.active);
    vignette(g, boost ? 1.6 : 0.8);
    try { blit(g, S.art, 'hud_frame', 0, 0, 0, W, H); } catch { /* art optional */ }
  },
  afterHud(g, ctx, view, S) {
    // heat gauge frame over the retro bar, with pulsing red edge when about to blow
    const P = view.player ?? view.pods?.[0];
    if (P && (P.heat ?? 0) > 0.8 && S.lastT !== null) {
      g.strokeStyle = '#ff4a3a'; g.globalAlpha = 0.5 + 0.5 * Math.sin((S.lastT ?? 0) * 18); g.lineWidth = 2;
      if (g.strokeRect) g.strokeRect(1, 1, W - 2, H - 2); g.globalAlpha = 1;
    }
  },
};
void ROAD;
