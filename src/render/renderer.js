// Renderer (owner: render-road). createRenderer(ctx, {style}) -> { draw(view, t, ui), setStyle(id), resize(), ready }.
// Pipeline: sky/backdrop -> road (project + rows) -> billboards back to front + pods -> FX (speed lines, boost blur, heat shimmer, particles) -> HUD.
// Style modules `src/render/<style>.js` (toon/ghibli; photo aliases toon) are optional: they may export `theme` (partial theme override or
// fn(biome,tod)) and `hooks = { beforeSky, afterWorld, afterHud }` called as hook(g, ctx, view, state).
import { W, H, HI_SCALE, ROAD, POD, DEFAULT_STYLE, PAL } from '../core/defs.js';
import { buildArt, fallbackSprite, ART_NAMES } from '../art/registry.js';
import { themeFor } from './road.js';
import { project, drawRoad, POD_SCREEN_Y } from './road.js';
import { drawSky, drawBillboards, drawPod } from './scene.js';
import { createParticles } from './particles.js';
import { drawHud } from './hud.js';

function fallbackArt() {
  const cache = new Map();
  return { style: 'fallback', has: () => false, names: ART_NAMES, report: {}, get(n) { let s = cache.get(n); if (!s) cache.set(n, s = fallbackSprite(n)); return s; } };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createRenderer(ctx, { style = DEFAULT_STYLE, seed = 1 } = {}) {
  const S = { art: fallbackArt(), style, mod: null, scroll: 0, lastT: null, shake: 0, prevX: new Map(), steer: new Map(), parts: createParticles(seed), scale: 1, flash: 0, loadId: 0 };
  const canvas = ctx.canvas;

  function resize() {
    const cw = canvas && canvas.width ? canvas.width : W;
    S.scale = Math.max(1, cw / W);
    if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = S.style !== 'retro';
  }

  async function load(id) {
    const my = ++S.loadId;
    const eff = id === 'photo' ? 'toon' : id;
    let mod = null;
    if (eff !== 'retro') { try { mod = await import(`./${eff}.js`); } catch { mod = null; } }
    let art = null;
    try { art = await buildArt({ style: id }); } catch { art = null; }
    if (my !== S.loadId) return;
    if (art) S.art = art;
    S.mod = mod; S.style = id; resize();
  }
  const ready = { p: load(style) };

  function setStyle(id) { S.style = id; ready.p = load(id); return ready.p; }

  function steerOf(p) {
    if (typeof p.steer === 'number') return p.steer * 2;
    return S.steer.get(p.id) ?? 0;
  }
  function trackSteer(view, dt) {
    for (const p of view.pods) {
      const prev = S.prevX.get(p.id);
      if (prev !== undefined && dt > 0) {
        const target = clamp(((p.x - prev) / dt) / 1.3, -2, 2), cur = S.steer.get(p.id) ?? 0;
        S.steer.set(p.id, cur + (target - cur) * Math.min(1, dt * 10));
      }
      S.prevX.set(p.id, p.x);
    }
  }

  function events(view, P, px, py) {
    for (const e of view.events ?? []) {
      const mine = e.pod === undefined || e.pod === P.id || e.pod === 0;
      switch (e.type) {
        case 'hit': if (mine) { S.parts.emit('spark', px, py - 10, 14, { speed: 120 }); S.parts.emit('crumb', px, py - 10, 8, { speed: 90 }); S.shake = Math.max(S.shake, 0.35); S.flash = 0.25; } break;
        case 'scrape': if (mine) S.parts.emit('spark', px + (P.x > 0 ? 18 : -18), py - 4, 6, { speed: 80, dir: -Math.PI / 2 }); break;
        case 'boost': if (mine) { S.parts.emit('flare', px, py - 12, 6, { speed: 40 }); S.shake = Math.max(S.shake, 0.15); } break;
        case 'overheat': case 'stall': if (mine) S.parts.emit('smoke', px, py - 16, 12, { speed: 30, dir: -Math.PI / 2 }); break;
        case 'finish': S.parts.emit('confetti', W / 2, -4, 60, { speed: 90, spread: W, dir: Math.PI / 2 }); break;
        case 'pickup': if (mine) S.parts.emit('spark', px, py - 20, 8, { speed: 70, color: PAL.cheeseL }); break;
        case 'roll': if (mine) S.parts.emit('dust', px, py - 4, 6, { speed: 50 }); break;
        default: break;
      }
    }
  }

  function selfCopy(g, sx, sy, sw, sh, dx, dy, dw, dh, alpha) {
    if (!canvas) return;
    const k = S.scale;
    g.globalAlpha = alpha;
    g.drawImage(canvas, sx * k, sy * k, sw * k, sh * k, dx, dy, dw, dh);
    g.globalAlpha = 1;
  }

  function draw(view, t = view.t ?? 0, ui = {}) {
    const g = ctx, th = S.mod && S.mod.theme;
    const dt = S.lastT === null ? 0 : clamp(t - S.lastT, 0, 0.1); S.lastT = t;
    const P = view.player ?? view.pods[0];
    const biome = view.track?.biome ?? 'coast', tod = view.track?.theme ?? 'day';
    const ov = typeof th === 'function' ? th(biome, tod) : th ?? null;
    const theme = themeFor(biome, tod, ov);
    const speed01 = clamp((P.speed ?? 0) / POD.maxSpeed, 0, 1.5), boosting = !!(P.boost && P.boost.active);
    S.shake = Math.max(0, S.shake - dt); S.flash = Math.max(0, S.flash - dt);

    g.setTransform(S.scale, 0, 0, S.scale, 0, 0);
    if ('imageSmoothingEnabled' in g) g.imageSmoothingEnabled = S.style !== 'retro';
    const shx = S.shake > 0 ? Math.round((Math.sin(t * 90) * S.shake * 8)) : 0, shy = S.shake > 0 ? Math.round(Math.cos(t * 70) * S.shake * 5) : 0;
    g.save(); g.translate(shx, shy);

    const proj = project(view);
    const seg0 = proj.segs[0];
    S.scroll += -(view.segmentAt(P.z).vis ?? (view.segmentAt(P.z).curve ?? 0) * 300) * speed01 * dt * 3.2;
    trackSteer(view, dt);
    const hooks = S.mod && S.mod.hooks;
    if (hooks?.beforeSky) hooks.beforeSky(g, ctx, view, S);
    drawSky(g, S.art, theme, biome, tod, S.scroll, t);
    const road = drawRoad(g, proj, theme, { lamps: true });
    void seg0; void road;

    const pxy = [W / 2, POD_SCREEN_Y];
    const state = {
      steerOf,
      drawPlayer: () => {
        const bob = Math.sin(t * 12) * 0.6 * speed01, lean = clamp(steerOf(P), -2, 2);
        drawPod(g, S.art, P, 0, W / 2, POD_SCREEN_Y + bob + 2, 1, t, lean, H);
      },
    };
    drawBillboards(g, S.art, view, proj, theme, state, t);
    if (hooks?.afterWorld) hooks.afterWorld(g, ctx, view, S);

    // ---- FX
    if (speed01 > 0.55 || boosting) {
      const n = boosting ? 26 : 14, len = (boosting ? 46 : 22) * speed01;
      g.fillStyle = boosting ? PAL.glass : PAL.white;
      for (let i = 0; i < n; i++) {
        const ph = ((t * (boosting ? 5 : 3) + i * 0.37) % 1), side = i % 2 ? 1 : -1;
        const x = W / 2 + side * (70 + (i * 53 % 90) + ph * 70), y = ROAD.horizonY + 8 + ((i * 29) % 110) * (0.4 + ph * 0.6);
        g.globalAlpha = (1 - ph) * (boosting ? 0.8 : 0.4);
        g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(len * ph * 0.5)) * -side, 1);
      }
      g.globalAlpha = 1;
    }
    if (boosting) {
      const z = 4 + 3 * Math.sin(t * 20);
      selfCopy(g, 0, 0, W, H, -z, -z * 0.6, W + z * 2, H + z * 1.2, 0.28);
      g.fillStyle = PAL.glass; g.globalAlpha = 0.14; g.fillRect(0, 0, 14, H); g.fillRect(W - 14, 0, 14, H); g.globalAlpha = 1;
    }
    const heat = P.heat ?? 0;
    if ((heat > 0.65 || biome === 'lava') && canvas) {
      const amp = biome === 'lava' ? 1 + heat * 2 : (heat - 0.5) * 6;
      for (let y = ROAD.horizonY - 6; y < ROAD.horizonY + 46; y += 2) {
        const o = Math.sin(t * 7 + y * 0.45) * amp * (1 - (y - ROAD.horizonY + 6) / 70);
        selfCopy(g, 0, y, W, 2, o, y, W, 2, 1);
      }
    }
    // pod exhaust + damage + offroad particles
    if (dt > 0) {
      if (boosting) S.parts.emit('fire', W / 2 + (Math.sin(t * 40) * 6), pxy[1] - 4, 2, { speed: 40, dir: Math.PI / 2, spread: 8 });
      if (Math.abs(P.x) > 1 && speed01 > 0.1) S.parts.emit('dust', W / 2 + (P.x > 0 ? 20 : -20), pxy[1] + 2, 1, { speed: 50, dir: -Math.PI / 2 });
      if ((P.health ?? 100) < 30 && !P.wreck) S.parts.emit('smoke', W / 2 + 4, pxy[1] - 14, 1, { speed: 20, dir: -Math.PI / 2 });
      if (P.wreck) S.parts.emit('fire', W / 2, pxy[1] - 10, 1, { speed: 30, dir: -Math.PI / 2, spread: 14 });
    }
    events(view, P, pxy[0], pxy[1]);
    S.parts.update(dt);
    S.parts.draw(g, S.art);
    if (S.flash > 0) { g.fillStyle = PAL.white; g.globalAlpha = S.flash * 0.7; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    g.restore();

    g.setTransform(S.scale, 0, 0, S.scale, 0, 0);
    drawHud(g, view, S.art, t, ui);
    if (hooks?.afterHud) hooks.afterHud(g, ctx, view, S);
  }

  resize();
  return { draw, setStyle, resize, get ready() { return ready.p; }, get art() { return S.art; }, get style() { return S.style; }, _state: S };
}
