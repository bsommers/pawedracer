// Pseudo-3D road (owner: render-road): themes, segment projection loop (hills, curves, banking, tunnels, fog) and row-wise road drawing.
// All coordinates are logical (W x H); the renderer sets a context scale for hi-res styles.
import { ROAD, PAL, W, H } from '../core/defs.js';

// ---------------------------------------------------------------- colour helpers (hex only, cached)
const rgbCache = new Map();
export function rgbOf(hex) {
  let v = rgbCache.get(hex);
  if (!v) {
    let h = hex.slice(1); if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; rgbCache.set(hex, v);
  }
  return v;
}
const to2 = (n) => (Math.max(0, Math.min(255, Math.round(n))) | 256).toString(16).slice(1);
export function mixHex(a, b, t) {
  const p = rgbOf(a), q = rgbOf(b);
  return '#' + to2(p[0] + (q[0] - p[0]) * t) + to2(p[1] + (q[1] - p[1]) * t) + to2(p[2] + (q[2] - p[2]) * t);
}
export const darken = (hex, f) => mixHex(hex, '#000000', f);

// ---------------------------------------------------------------- themes: biome base, then time-of-day grade
const BIOMES = {
  coast:   { grass: ['#e8c878', '#dcb866'], road: [PAL.asphalt, PAL.asphaltL], rumble: [PAL.rumbleA, PAL.rumbleB], wall: ['#5a7a9a', '#4a6a8a'], fog: '#bfe8ff', sky: '#58b8ff', accent: '#30c0d8' },
  mesa:    { grass: ['#d98a4a', '#c97a3a'], road: ['#4a3f4a', '#58495a'], rumble: ['#ff8a2a', PAL.rumbleB], wall: ['#a85a2a', '#8f4a22'], fog: '#f2c898', sky: '#ffb870', accent: '#ff8a2a' },
  tunnels: { grass: ['#5a5260', '#4e4654'], road: ['#34323f', '#3e3b4c'], rumble: [PAL.cheese, '#2a2630'], wall: ['#4a4254', '#3e364a'], fog: '#1a1426', sky: '#2a2036', accent: PAL.cheese },
  lava:    { grass: ['#5a2a22', '#4a1f1a'], road: ['#2c2428', '#38292c'], rumble: ['#ff8a2a', '#2a1a18'], wall: ['#3a1a14', '#2c130f'], fog: '#5a1f10', sky: '#a03a1a', accent: PAL.fondue },
  bog:     { grass: ['#3a6a3a', '#2f5a35'], road: ['#363a3a', '#404646'], rumble: [PAL.mold, PAL.parm], wall: ['#2a4a38', '#233f30'], fog: '#6a8a6a', sky: '#7a9a8a', accent: PAL.mold },
  snow:    { grass: ['#f2f6ff', '#dde6f4'], road: ['#4a5060', '#565c6e'], rumble: [PAL.rumbleA, '#dde6f4'], wall: ['#9ab0d0', '#8aa0c4'], fog: '#e8f0ff', sky: '#9cc8ff', accent: PAL.glass },
  caves:   { grass: ['#3a3550', '#2f2b44'], road: ['#2a2840', '#33304c'], rumble: [PAL.blue, '#1a1830'], wall: ['#2a2640', '#221e36'], fog: '#120e20', sky: '#1a1430', accent: PAL.crystalHint ?? '#a88aff' },
  arena:   { grass: ['#3a7a3a', '#2f6a30'], road: [PAL.asphalt, PAL.asphaltL], rumble: [PAL.rumbleA, PAL.rumbleB], wall: ['#4a3a6a', '#3e3060'], fog: '#201a40', sky: '#2a2060', accent: PAL.scYellow },
};
const TOD = { day: { tint: null, k: 0, dark: 0 }, dusk: { tint: '#ff7a50', k: 0.26, dark: 0.12 }, night: { tint: '#0a1030', k: 0.5, dark: 0.18 } };
const themeCache = new Map();

/** Resolve a theme for (biome, time-of-day): colour pairs for grass, road, rumble, walls, fog and sky. Cached. */
export function themeFor(biome = 'coast', tod = 'day', override = null) {
  const key = biome + '/' + tod + (override ? JSON.stringify(override) : '');
  let th = themeCache.get(key);
  if (th) return th;
  const b = { ...(BIOMES[biome] ?? BIOMES.coast), ...(override ?? {}) }, g = TOD[tod] ?? TOD.day;
  const grade = (c, keep = 0) => { let o = c; if (g.tint) o = mixHex(o, g.tint, g.k * (1 - keep)); return g.dark ? darken(o, g.dark * (1 - keep)) : o; };
  th = {
    biome, tod,
    grass: b.grass.map((c) => grade(c)), road: b.road.map((c) => grade(c, 0.3)), rumble: b.rumble.map((c) => grade(c, 0.5)), wall: b.wall.map((c) => grade(c)),
    line: grade(PAL.roadLine, 0.6), fog: grade(b.fog), sky: grade(b.sky), accent: grade(b.accent, 0.6),
    night: tod === 'night', lampy: tod !== 'day',
  };
  themeCache.set(key, th);
  return th;
}

// ---------------------------------------------------------------- fog colour cache (16 levels)
const fogCache = new Map();
export function fogged(hex, fog, level) {
  const q = Math.min(15, Math.max(0, Math.round(level * 15)));
  if (q === 0) return hex;
  const key = hex + fog + q;
  let v = fogCache.get(key);
  if (!v) { v = mixHex(hex, fog, q / 15); fogCache.set(key, v); }
  return v;
}

// ---------------------------------------------------------------- projection
export const CURVE_GAIN = 1.0;      // bend = seg.vis (curve*300, OutRun units) * CURVE_GAIN; falls back to curve*300 when vis is absent
const visOf = (sg) => sg.vis ?? (sg.curve ?? 0) * 300;
export const BANK_SHEAR = 0.45;     // pixels of horizontal shear per pixel below the horizon per unit bank
export const POD_SCREEN_Y = H - 44;
const CAM_BACK = (ROAD.cameraDepth * ROAD.cameraHeight * (H / 2)) / (POD_SCREEN_Y - ROAD.horizonY);   // camera distance behind the player pod
export const camBack = () => CAM_BACK;

/**
 * Project the visible segments for a camera following the player pod.
 * view: race.view() (needs player.z/x, segmentAt). Returns { camZ, camX, camY, base, segs[] } with segs[n] = { i, relZ, curve, bank, tunnel,
 * x1,y1,w1, x2,y2,w2, clip, fog, scale1, scale2 }.  y1/x1/w1 is the near edge, y2/x2/w2 the far edge; clip = lowest row far scenery may use.
 */
export function project(view, opts = {}) {
  const P = view.player ?? view.pods[0];
  const D = opts.drawDistance ?? ROAD.drawDistance, segLen = ROAD.segLen, depth = ROAD.cameraDepth;
  const camZ = P.z - CAM_BACK;
  const base = Math.floor(camZ / segLen), frac = camZ / segLen - base;
  const pz = P.z / segLen, pi = Math.floor(pz), pf = pz - pi;
  const yAt = (i) => view.segmentAt(i * segLen).y ?? 0;
  const camY = ROAD.cameraHeight + yAt(pi) * (1 - pf) + yAt(pi + 1) * pf;
  const camX = (P.x ?? 0) * ROAD.roadWidth;
  const hz = opts.horizonY ?? ROAD.horizonY;
  const segs = [];
  const yy = new Array(D + 2);
  for (let n = 0; n <= D + 1; n++) yy[n] = yAt(base + n);
  let x = 0;
  const s0 = view.segmentAt((base + 0.5) * segLen);
  let dx = -visOf(s0) * CURVE_GAIN * frac;
  let maxY = H;
  const gain = CURVE_GAIN;   // world x shift per segment per unit curve
  for (let n = 0; n <= D; n++) {
    const i = base + n, sg = view.segmentAt((i + 0.5) * segLen);
    const relZ1 = Math.max(60, i * segLen - camZ), relZ2 = (i + 1) * segLen - camZ;
    const x1w = x, x2w = x + dx;
    const sc1 = depth / relZ1, sc2 = depth / relZ2;
    const bank = sg.bank ?? 0;
    let y1 = hz - sc1 * (yy[n] - camY) * (H / 2), y2 = hz - sc2 * (yy[n + 1] - camY) * (H / 2);
    const sh1 = bank * BANK_SHEAR * (y1 - hz), sh2 = bank * BANK_SHEAR * (y2 - hz);
    const seg = {
      i, n, relZ: relZ1, curve: sg.curve ?? 0, bank, tunnel: !!sg.tunnel, zone: sg.zone,
      x1: W / 2 + sc1 * (x1w - camX) * (W / 2) + sh1, y1, w1: sc1 * ROAD.roadWidth * (W / 2),
      x2: W / 2 + sc2 * (x2w - camX) * (W / 2) + sh2, y2, w2: sc2 * ROAD.roadWidth * (W / 2),
      scale1: sc1, scale2: sc2, fog: 1 - 1 / Math.exp(Math.pow(n / D, 2) * ROAD.fogDensity), clip: maxY, visible: false,
    };
    seg.visible = y2 < maxY && y2 < y1;
    if (seg.visible) maxY = y2;
    seg.top = maxY;
    segs.push(seg);
    x += dx;
    dx += visOf(sg) * gain;
  }
  return { camZ, camX, camY, base, frac, segs, horizonY: hz };
}

/** Screen placement of a world (z, x) point relative to a projection: { sx, sy, scale, seg } or null if outside. */
export function placeAt(proj, z, x) {
  const n = Math.floor(z / ROAD.segLen) - proj.base;
  if (n < 0 || n >= proj.segs.length) return null;
  const s = proj.segs[n];
  const t = Math.min(1, Math.max(0, (z - s.i * ROAD.segLen) / ROAD.segLen));
  const y = s.y1 + (s.y2 - s.y1) * t, cx = s.x1 + (s.x2 - s.x1) * t, hw = s.w1 + (s.w2 - s.w1) * t;
  const relZ = z - proj.camZ;
  if (relZ < 60) return null;
  return { sx: cx + x * hw, sy: y, scale: ROAD.cameraDepth / relZ, hw, seg: s, n };
}

// ---------------------------------------------------------------- drawing (painter rows, near to far, clipped by maxY)
/** Draw ground/road/rumble/lane rows for every visible segment. Returns nothing. */
export function drawRoad(g, proj, theme, opts = {}) {
  const lanes = ROAD.lanes, hz = proj.horizonY;
  // base ground fill to the horizon so gaps never show sky
  g.fillStyle = fogged(theme.grass[0], theme.fog, 1); g.fillRect(0, hz, W, H - hz);
  let drawnTo = H;
  const lamps = [];
  for (let n = 0; n < proj.segs.length; n++) {
    const s = proj.segs[n];
    if (!s.visible) continue;
    const band = Math.floor(s.i / ROAD.rumbleLen) & 1, f = s.fog, fg = theme.fog;
    const dark = s.tunnel ? 0.35 : 0;
    const col = (c) => fogged(dark ? darken(c, dark) : c, fg, f);
    const ground = s.tunnel ? theme.wall[band] : theme.grass[band];
    const cGround = col(ground), cRoad = col(theme.road[band]), cRum = col(theme.rumble[band]), cLine = col(theme.line);
    const top = Math.max(Math.ceil(s.y2), 0), bot = Math.min(Math.ceil(s.y1), s.clip, H);
    const dyy = s.y1 - s.y2 || 1;
    for (let y = top; y < bot; y++) {
      const t = (y + 0.5 - s.y2) / dyy;          // 0 far .. 1 near
      const cx = s.x2 + (s.x1 - s.x2) * t, hw = s.w2 + (s.w1 - s.w2) * t;
      const rw = hw / Math.max(6, 2 * lanes);
      g.fillStyle = cGround; g.fillRect(0, y, W, 1);
      g.fillStyle = cRum; g.fillRect(cx - hw - rw, y, rw, 1); g.fillRect(cx + hw, y, rw, 1);
      g.fillStyle = cRoad; g.fillRect(cx - hw, y, hw * 2, 1);
      if (!band) {
        const lw = hw / Math.max(32, 8 * lanes);
        g.fillStyle = cLine;
        for (let l = 1; l < lanes; l++) { const lx = cx - hw + (hw * 2 * l) / lanes; g.fillRect(lx - lw / 2, y, lw, 1); }
      }
    }
    if (s.tunnel) {
      // ceiling rows: from the near ceiling edge to the far ceiling edge, full width, lamp stripes on alternate bands
      const hh1 = s.w1 * 0.85, hh2 = s.w2 * 0.85;
      const cy1 = s.y1 - hh1, cy2 = s.y2 - hh2;
      const ct = Math.max(0, Math.ceil(cy1)), cb = Math.min(Math.floor(hz + 4), Math.ceil(cy2));
      const cc = fogged(darken(theme.wall[band], 0.45), fg, f), cl = fogged(band ? theme.accent : darken(theme.wall[0], 0.3), fg, f);
      g.fillStyle = cc; for (let y = ct; y < cb; y++) g.fillRect(0, y, W, 1);
      if (!band && cb > ct) { g.fillStyle = cl; const mid = (ct + cb) >> 1; g.fillRect(s.x2 - s.w2 * 0.15, mid, s.w2 * 0.3, Math.max(1, (cb - ct) / 4)); }
    } else if (theme.lampy && opts.lamps && band === 0 && n > 2 && n % 6 === 0) {
      lamps.push(s);
    }
    drawnTo = Math.min(drawnTo, top);
  }
  return { drawnTo, lamps };
}
