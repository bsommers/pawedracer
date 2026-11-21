// Scene layer (owner: render-road): sky + parallax backdrop, billboards back to front, pods with steer frames and flame overlay,
// plus fakeTrack()/fakeView() so the renderer can be developed and tested without sim or tracks.
import { ROAD, PAL, W, H, POD } from '../core/defs.js';
import { toDrawable } from '../art/registry.js';
import { themeFor, mixHex, darken, placeAt, POD_SCREEN_Y, camBack } from './road.js';

export const SPRITE_K = 1280;      // dest px = art.w * (cameraDepth / relZ) * SPRITE_K  -> pods are 1:1 at the player seat
export const OBJ_SCALE = 2;        // roadside / hazard sprites are drawn this much larger than pods so they read against a 500px road

const hash = (n) => { let x = Math.imul(n | 0, 0x9e3779b1) ^ 0x85ebca6b; x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d); return ((x ^ (x >>> 12)) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- sprite helper
/** Draw frame `fr` of `name` anchored bottom-centre at (sx, sy), dest width wpx, cropped so nothing is drawn below clipY. Returns the dest rect or null. */
export function drawSprite(g, art, name, fr, sx, sy, wpx, clipY = H, alpha = 1, flip = false) {
  const a = art.get(name);
  if (!a || wpx < 0.5) return null;
  const f = a.frames[((fr | 0) % a.frames.length + a.frames.length) % a.frames.length];
  const hpx = wpx * (f.h / f.w), dx = sx - wpx / 2, dy = sy - hpx;
  if (dx > W || dx + wpx < 0 || dy > H || sy < 0) return null;
  const vis = Math.min(1, Math.max(0, (clipY - dy) / hpx));
  if (vis <= 0) return null;
  if (alpha !== 1) g.globalAlpha = alpha;
  const img = toDrawable(f);
  if (flip) g.drawImage(img, 0, 0, f.w, Math.max(1, Math.round(f.h * vis)), dx + wpx, dy, -wpx, hpx * vis);
  else g.drawImage(img, 0, 0, f.w, Math.max(1, Math.round(f.h * vis)), dx, dy, wpx, hpx * vis);
  if (alpha !== 1) g.globalAlpha = 1;
  return { x: dx, y: dy, w: wpx, h: hpx };
}

// ---------------------------------------------------------------- sky and backdrop
const LAYER_OF = { coast: 'bg_hills', mesa: 'bg_mesa', tunnels: 'bg_cave', lava: 'bg_mesa', bog: 'bg_hills', snow: 'bg_peaks', caves: 'bg_cave', arena: 'bg_skyline' };

function skyFallback(g, th, hz, t) {
  const bands = 16;
  for (let i = 0; i < bands; i++) {
    g.fillStyle = mixHex(th.sky, th.fog, Math.pow(i / (bands - 1), 1.6));
    g.fillRect(0, (hz * i) / bands, W, Math.ceil(hz / bands) + 1);
  }
  if (th.night) {
    g.fillStyle = '#fff6e0';
    for (let i = 0; i < 40; i++) { const tw = (Math.sin(t * 3 + i) + 1) * 0.5; g.globalAlpha = 0.4 + 0.6 * tw; g.fillRect(hash(i) * W, hash(i + 99) * hz * 0.8, 1, 1); }
    g.globalAlpha = 1; g.fillStyle = '#fff0b0'; g.fillRect(250, 14, 12, 12); g.fillStyle = th.sky; g.fillRect(254, 12, 10, 10);
  } else {
    g.fillStyle = th.tod === 'dusk' ? '#ffb070' : '#fff6c0'; g.fillRect(236, th.tod === 'dusk' ? hz - 22 : 12, 16, 16);
  }
}

function silhouette(g, th, biome, hz, scroll, dim) {
  const col = mixHex(darken(th.fog, 0.35 + dim), th.grass[0], 0.15);
  g.fillStyle = col;
  const off = scroll;
  for (let x = 0; x < W; x += 2) {
    const u = x + off;
    let h;
    if (biome === 'arena') h = 14 + (Math.floor(u / 10) % 3) * 6 + (hash(Math.floor(u / 10)) > 0.5 ? 10 : 0);
    else if (biome === 'snow') h = 10 + Math.abs(Math.sin(u * 0.03)) * 30 + Math.abs(Math.sin(u * 0.11)) * 8;
    else if (biome === 'mesa' || biome === 'lava') h = 12 + (Math.sin(u * 0.02) > 0.2 ? 20 : 4) + Math.sin(u * 0.05) * 3;
    else if (biome === 'tunnels' || biome === 'caves') h = 14 + Math.abs(Math.sin(u * 0.07)) * 12;
    else h = 8 + Math.sin(u * 0.025) * 8 + Math.sin(u * 0.09) * 3 + 8;
    g.fillRect(x, hz - h, 2, h + 1);
  }
}

/** Sky and the parallax layer; `scroll` accumulates curvature * speed (px of the 640-wide strips). */
export function drawSky(g, art, th, biome, tod, scroll, t, hz = ROAD.horizonY) {
  const skyName = 'bg_sky_' + (tod === 'night' ? 'night' : tod === 'dusk' ? 'dusk' : 'day');
  if (art.has(skyName)) {
    const a = art.get(skyName), f = a.frames[0], img = toDrawable(f);   // a.w/a.h are logical px (hi-res packs have f.w = HI_SCALE x a.w)
    const o = ((scroll * 0.25) % a.w + a.w) % a.w;
    for (let x = -o; x < W; x += a.w) g.drawImage(img, x, hz - a.h, a.w, a.h);
    if (a.h < hz) { g.fillStyle = th.sky; g.fillRect(0, 0, W, hz - a.h); }
  } else skyFallback(g, th, hz, t);
  const layer = LAYER_OF[biome] ?? 'bg_hills';
  if (art.has(layer)) {
    const a = art.get(layer), f = a.frames[0], img = toDrawable(f);
    const o = ((scroll * 0.6) % a.w + a.w) % a.w;
    for (let x = -o; x < W; x += a.w) g.drawImage(img, x, hz - a.h + 2, a.w, a.h);
  } else {
    silhouette(g, th, biome, hz, scroll * 0.6, 0.15);
    silhouette(g, th, biome, hz + 1, scroll * 1.1 + 40, 0);
  }
  // horizon haze
  g.fillStyle = th.fog; g.globalAlpha = 0.45; g.fillRect(0, hz - 3, W, 4); g.globalAlpha = 1;
}

// ---------------------------------------------------------------- pods
const RIVAL = ['pod_r1', 'pod_r2', 'pod_r3', 'pod_r4', 'pod_r5'];
export function podArtName(p, idx) {
  if (p.isPlayer || p.ghost) return 'pod_colby';
  if (/pete/i.test(p.id ?? '') || /pete/i.test(p.name ?? '')) return 'pod_pete';
  return RIVAL[(idx + (p.id ? String(p.id).length : 0)) % RIVAL.length];
}

/** Draw one pod: shadow, body (steer frame / roll / wreck), flame overlay. (sx, sy) = ground contact point, k = sprite scale (1 at the player seat). */
export function drawPod(g, art, p, idx, sx, sy, k, t, steer, clipY = H) {
  const name = podArtName(p, idx), body = art.get(name);
  const wpx = body.w * k, bodyH = body.w * (body.frames[0].h / body.frames[0].w), flH = art.get('pod_flame');
  if (wpx < 1) return;
  const sh = art.get('pod_shadow'), ga = p.ghost ? 0.45 : 1;   // ghost pods (time-trial replay) are translucent
  drawSprite(g, art, 'pod_shadow', 0, sx, sy + 2 * k, sh.w * k * 1.05, clipY, 0.55 * ga);
  const hover = p.wreck ? 0 : Math.sin(t * 9 + idx * 2) * 0.8 * k;
  let nm = name, fr = Math.round(2 + Math.max(-2, Math.min(2, steer)));
  if (p.wreck) { nm = 'pod_wreck'; fr = ((t * 4) | 0) & 1; }
  else if (p.rolling) { nm = 'pod_roll'; fr = ((t * 16) | 0) % 6; }
  if (!p.wreck && !p.stalled) {
    const boost = p.boost && p.boost.active, fl = art.get('pod_flame'), fs = (boost ? 1.5 : 0.85 + Math.min(1, (p.speed ?? 0) / 12000) * 0.3) * k;
    const ff = ((t * 20) | 0) + idx;
    const off = body.w * 0.26 * k, fy = sy - bodyH * 0.18 * k + hover;
    drawSprite(g, art, 'pod_flame', ff, sx - off, fy + fl.w * (fl.frames[0].h / fl.frames[0].w) * fs * 0.6, fl.w * fs, clipY, (boost ? 1 : 0.9) * ga);
    drawSprite(g, art, 'pod_flame', ff + 1, sx + off, fy + fl.w * (fl.frames[0].h / fl.frames[0].w) * fs * 0.6, fl.w * fs, clipY, (boost ? 1 : 0.9) * ga);
    if (body.fallback || fl.fallback) { /* fallback rectangles already visible */ }
  }
  drawSprite(g, art, nm, fr, sx, sy + hover, wpx, clipY, ga);
  if (p.stalled) { g.fillStyle = PAL.flameD; g.globalAlpha = 0.6; g.fillRect(sx - 2 * k, sy - bodyH * k - 2, 4 * k, 2); g.globalAlpha = 1; }
}

// ---------------------------------------------------------------- billboards far -> near
/** Draw scenery/hazards/pickups and rival pods back to front, interleaved with the player pod at its own depth. */
export function drawBillboards(g, art, view, proj, th, state, t) {
  const buckets = new Map();
  const add = (n, o) => { let b = buckets.get(n); if (!b) buckets.set(n, b = []); b.push(o); };
  const D = proj.segs.length;
  const objs = view.objects ?? [];
  for (const o of objs) {
    if (o.active === false) continue;
    const n = Math.floor(o.z / ROAD.segLen) - proj.base;
    if (n < 1 || n >= D) continue;
    add(n, { kind: 'obj', o, z: o.z });
  }
  const pods = view.pods ?? [];
  for (let i = 0; i < pods.length; i++) {
    const p = pods[i];
    if (p.isPlayer) continue;
    const n = Math.floor(p.z / ROAD.segLen) - proj.base;
    if (n < 1 || n >= D) continue;
    add(n, { kind: 'pod', p, i, z: p.z });
  }
  const P = view.player ?? pods[0];
  const pn = Math.floor(P.z / ROAD.segLen) - proj.base;
  add(Math.min(D - 1, Math.max(0, pn)), { kind: 'player', p: P, z: P.z });
  const keys = [...buckets.keys()].sort((a, b) => b - a);
  for (const n of keys) {
    const list = buckets.get(n).sort((a, b) => b.z - a.z);
    const seg = proj.segs[n];
    for (const it of list) {
      if (it.kind === 'player') { state.drawPlayer(); continue; }
      const pl = placeAt(proj, it.z, it.kind === 'obj' ? it.o.x : it.p.x);
      if (!pl) continue;
      const clip = pl.seg.clip, k = pl.scale * SPRITE_K;
      const alpha = 1 - Math.min(0.7, seg.fog * 0.8);
      if (it.kind === 'obj') {
        const o = it.o, nm = o.art ?? 'sc_rock';
        if (nm === 'sc_tunnel' || nm === 'sc_start') drawSprite(g, art, nm, o.frame ?? 0, pl.seg.x1 + (pl.seg.x2 - pl.seg.x1) * 0.5, pl.sy, art.get(nm).w * k * OBJ_SCALE, clip, alpha);
        else drawSprite(g, art, nm, o.frame ?? ((t * 4) | 0), pl.sx, pl.sy, art.get(nm).w * k * OBJ_SCALE, clip, alpha);
      } else {
        drawPod(g, art, it.p, it.i, pl.sx, pl.sy, k / art.get(podArtName(it.p, it.i)).w, t, state.steerOf(it.p), clip);
      }
    }
  }
}

// ---------------------------------------------------------------- fake track / view (dev harness, tests, tools/render-frame.mjs)
const FAKE_BIOMES = { coast: 'day', mesa: 'day', tunnels: 'dusk', lava: 'day', bog: 'dusk', snow: 'day', caves: 'night', arena: 'night' };
export function fakeTrack(biome = 'coast', N = 400) {
  const curve = new Float32Array(N), y = new Float32Array(N + 1), bank = new Float32Array(N), tunnel = new Uint8Array(N);
  const ease = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
  const secs = [[40, 0, 0], [50, 0.9, 40], [40, 0, -20], [50, -1.0, 60], [30, 0, 0], [60, 0.6, -50], [40, -0.7, 30], [50, 0, 0]];
  let i = 0, hy = 0, prevC = 0;
  for (const [len, c, h] of secs) {
    for (let k = 0; k < len && i < N; k++, i++) {
      const p = k / len; const cv = ease(prevC, c, Math.min(1, p * 3)); curve[i] = cv * 0.012; bank[i] = cv * 0.3;
      hy += Math.sin(p * Math.PI * 2) * (h / 10) * 6;
    }
    prevC = c;
  }
  let yy = 0;
  for (let j = 0; j < N; j++) { y[j] = Math.sin((j / N) * Math.PI * 4) * 1800 + Math.sin((j / N) * Math.PI * 10) * 500; yy = y[j]; }
  y[N] = y[0]; void yy; void hy;
  if (biome === 'tunnels' || biome === 'caves') for (let j = 100; j < 220; j++) tunnel[j] = 1;
  const at = (z) => { const j = ((Math.floor(z / ROAD.segLen) % N) + N) % N; return { curve: curve[j], vis: curve[j] * 300, y: y[j] + (y[j + 1] - y[j]) * ((((z / ROAD.segLen) % 1) + 1) % 1), bank: bank[j], tunnel: !!tunnel[j] }; };
  return { N, at, biome, theme: FAKE_BIOMES[biome] ?? 'day' };
}

export function fakeView({ biome = 'coast', theme, z = 30000, x = 0.1, t = 0, speed = 9000, boost = false, heat = 0.2, phase = 'racing', countdown = 0, track, objects = true } = {}) {
  const tr = track ?? fakeTrack(biome);
  const mk = (id, name, dz, px, isPlayer = false) => ({ id, name, isPlayer, z: z + dz, x: px, speed: speed - dz * 0.2, heat: isPlayer ? heat : 0.1, health: isPlayer ? 76 : 100, boost: { active: isPlayer && boost, charge: 0.7 }, rolling: false, stalled: false, wreck: false, lap: 2, place: isPlayer ? 3 : 1, finishTime: 0 });
  const pods = [mk('colby', 'Colby', 0, x, true), mk('pete', 'Pete', 1800, -0.35), mk('r1', 'Rival 1', 900, 0.5), mk('r2', 'Rival 2', 2600, 0.2), mk('r3', 'Rival 3', -400, -0.6)];
  const objs = [];
  if (objects) {
    const first = Math.floor(z / ROAD.segLen);
    const sc = { coast: 'sc_palm', mesa: 'sc_cactus', tunnels: 'sc_lamp', lava: 'sc_rock', bog: 'sc_mushroom', snow: 'sc_pine', caves: 'sc_crystal', arena: 'sc_banner' }[biome] ?? 'sc_rock';
    for (let i = first - 4; i < first + 230; i += 5) {
      const zz = i * ROAD.segLen;
      objs.push({ z: zz, x: -1.5 - hash(i) * 0.6, kind: 'scenery', art: sc, frame: 0, active: true });
      objs.push({ z: zz + 400, x: 1.5 + hash(i + 7) * 0.6, kind: 'scenery', art: hash(i) > 0.5 ? 'sc_rock' : sc, frame: 0, active: true });
    }
    objs.push({ z: (first + 60) * ROAD.segLen, x: 0.4, kind: 'wedge', art: 'hz_wedge', frame: 0, active: true });
    objs.push({ z: (first + 90) * ROAD.segLen, x: -0.5, kind: 'wheel', art: 'hz_wheel', frame: 0, active: true });
    objs.push({ z: (first + 40) * ROAD.segLen, x: 0, kind: 'tuna', art: 'pk_tuna', frame: (t * 8) | 0, active: true });
    objs.push({ z: (first + 120) * ROAD.segLen, x: 0, kind: 'start', art: 'sc_start', frame: 0, active: true });
  }
  return {
    t, phase, countdown, lap: 2, laps: 3, place: 3, pods, player: pods[0], objects: objs, segmentAt: tr.at, events: [], bestLap: 61.234,
    track: { id: 'fake', theme: theme ?? tr.theme, biome },
  };
}
export { camBack, POD_SCREEN_Y, POD };
