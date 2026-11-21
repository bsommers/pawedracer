// Ghibli (painterly) style module (owner: ghibli-style). Optional hooks for render/renderer.js:
//   theme(biome, tod) -> partial theme override (soft watercolour road/grass/fog colours)
//   hooks = { beforeSky, afterWorld, afterHud }  called as hook(g, ctx, view, state); g is scaled so coordinates are the logical 320x200.
// Everything ambient (light shafts, dappled leaf shadow, drifting motes, grade, music tint) is a pure function of view.t, the track and speed.
import { W, H, ROAD, POD } from '../core/defs.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const hash = (n) => { let h = (Math.imul(n | 0, 0x9e3779b1) ^ 0x85ebca6b) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0; return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${+a.toFixed(3)})`;

// ------------------------------------------------------------------ theme: soft watercolour colour pairs per biome (road.js grades them by time of day)
const THEME = {
  coast:   { grass: ['#ecd592', '#e0c47c'], road: ['#6e6b86', '#7b7894'], rumble: ['#e8685a', '#fff6dc'], wall: ['#6f93b8', '#5e82a8'], fog: '#d4eef8', sky: '#7fc4f0', accent: '#4ec8d8' },
  mesa:    { grass: ['#e0985a', '#d28848'], road: ['#5e5266', '#6c5e74'], rumble: ['#ff9a3a', '#fff6dc'], wall: ['#b86a3a', '#a05a30'], fog: '#f6d2a8', sky: '#ffb878', accent: '#ff9a3a' },
  tunnels: { grass: ['#6a6070', '#5c5262'], road: ['#403c50', '#4c485e'], rumble: ['#ffd23a', '#32283c'], wall: ['#585066', '#4c445a'], fog: '#251b36', sky: '#32263e', accent: '#ffd23a' },
  lava:    { grass: ['#6a3226', '#5a281e'], road: ['#382c32', '#463640'], rumble: ['#ff9a3a', '#34201c'], wall: ['#4a2218', '#3a1a12'], fog: '#7a2c14', sky: '#c04a20', accent: '#ff7a2a' },
  bog:     { grass: ['#4a7e48', '#3e6e40'], road: ['#464a4c', '#52585a'], rumble: ['#58b088', '#f1ead8'], wall: ['#386050', '#2e5242'], fog: '#86a888', sky: '#8eb09a', accent: '#58b088' },
  snow:    { grass: ['#f6f8ff', '#e2eafa'], road: ['#5a6074', '#666c82'], rumble: ['#e8685a', '#e6eefc'], wall: ['#a8bede', '#98aed2'], fog: '#edf4ff', sky: '#a8d0ff', accent: '#8fd4ff' },
  caves:   { grass: ['#4a4468', '#3e3858'], road: ['#363450', '#42405e'], rumble: ['#93a9de', '#221e3a'], wall: ['#383252', '#2e2a46'], fog: '#1a1430', sky: '#241c3c', accent: '#b9a2ff' },
  arena:   { grass: ['#58a85a', '#4a9650'], road: ['#6e6b86', '#7b7894'], rumble: ['#e8685a', '#fff6dc'], wall: ['#5e4c82', '#504074'], fog: '#2c2456', sky: '#3a2c78', accent: '#ffd23a' },
};
export const theme = (biome) => THEME[biome] ?? THEME.coast;

// ------------------------------------------------------------------ music colour hooks: each MUSIC name leans the picture a little
export const MOODS = {
  title:          { tint: [255, 214, 150], k: 0.06, bpm: 80 },
  shop:           { tint: [255, 200, 170], k: 0.06, bpm: 90 },
  podium:         { tint: [255, 232, 140], k: 0.10, bpm: 110 },
  race_brie:      { tint: [255, 236, 170], k: 0.05, bpm: 120 }, race_cheddar: { tint: [255, 190, 110], k: 0.06, bpm: 124 },
  race_swiss:     { tint: [190, 230, 255], k: 0.06, bpm: 118 }, race_fondue: { tint: [255, 140, 90], k: 0.08, bpm: 132 },
  race_blue:      { tint: [150, 170, 255], k: 0.08, bpm: 122 }, race_parmesan: { tint: [255, 226, 160], k: 0.06, bpm: 116 },
  race_camembert: { tint: [200, 240, 190], k: 0.07, bpm: 112 }, race_gouda: { tint: [255, 210, 120], k: 0.07, bpm: 128 },
  duel_pete:      { tint: [255, 90, 90], k: 0.10, bpm: 140 },
};
const mood = { cur: { tint: [255, 255, 255], k: 0, bpm: 100 }, name: null, forced: false, flash: 0 };
/** call from ui-shell / audio when the song changes (optional; the hook also infers the song from the track id) */
export function setMusic(name) { mood.name = name; mood.forced = !!name; }
/** subscribe to the event bus for gentle colour accents: pickups glint, lap/final lap warm up the picture, hits flash */
export function attachBus(bus) {
  if (!bus || !bus.on) return () => {};
  const offs = [bus.on('lap', () => { mood.flash = 0.35; }), bus.on('finalLap', () => { mood.flash = 0.6; }), bus.on('boost', () => { mood.flash = Math.max(mood.flash, 0.2); })];
  return () => offs.forEach((f) => f && f());
}

// ------------------------------------------------------------------ ambient state
const st = { lastT: null, shaft: 0 };
const safe = (fn) => { try { fn(); } catch { /* shim ctx without gradients (Node tests): skip decoration */ } };
const todOf = (view) => view?.track?.theme ?? 'day';
const biomeOf = (view) => view?.track?.biome ?? 'coast';

function motes(g, t, biome, tod, sp, boost) {
  const hz = ROAD.horizonY;
  const kind = tod === 'night' || biome === 'caves' || biome === 'tunnels' ? 'firefly' : biome === 'snow' ? 'snow' : biome === 'lava' ? 'ember' : biome === 'bog' ? 'spore' : 'petal';
  const n = 26;
  for (let i = 0; i < n; i++) {
    const sd = hash(i * 17 + 3), sx = hash(i * 31 + 7), sy = hash(i * 13 + 11), ph = (t * (0.025 + sd * 0.05) + sx) % 1;
    let x, y, r, a, col;
    if (kind === 'petal' || kind === 'snow') { x = ((sx * W + Math.sin(t * 0.7 + i) * 12 - t * (4 + sd * 6) * (1 + sp * 2)) % W + W) % W; y = (hz * 0.3 + ((sy + t * (0.02 + sd * 0.02)) % 1) * (H - hz * 0.3)); r = kind === 'snow' ? 0.5 + sd * 0.7 : 0.9 + sd * 0.8; col = kind === 'snow' ? [255, 255, 255] : [255, 170, 190]; a = 0.55; }
    else if (kind === 'ember') { x = sx * W + Math.sin(t + i) * 6; y = H - ((sy + t * (0.05 + sd * 0.05)) % 1) * (H - hz); r = 0.6 + sd * 0.7; col = [255, 170, 70]; a = 0.7 * (1 - ph); }
    else if (kind === 'spore') { x = sx * W + Math.sin(t * 0.6 + i) * 9; y = hz + ((sy + t * 0.012) % 1) * (H - hz) * 0.9; r = 0.8 + sd; col = [190, 240, 170]; a = 0.35; }
    else { x = sx * W + Math.sin(t * 0.5 + i * 2) * 14; y = hz * 0.5 + sy * (H - hz * 0.5); r = 0.7 + sd * 0.8; col = [255, 240, 150]; a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 + i * 3)); }
    if (sp > 0.6) { g.fillStyle = rgba(col, a * 0.5); g.fillRect(x, y, r * 0.8, r * 0.8 + sp * 4 * 0.6); }
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 2.6); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  }
}

function lightShafts(g, t, tod, biome) {
  if (tod === 'night' || biome === 'tunnels' || biome === 'caves') return;
  const hz = ROAD.horizonY, warm = tod === 'dusk' ? [255, 190, 140] : [255, 244, 200], base = tod === 'dusk' ? 0.1 : 0.08;
  for (let i = 0; i < 4; i++) {
    const x0 = 210 + i * 26 + Math.sin(t * 0.15 + i) * 6, a = base * (0.6 + 0.4 * Math.sin(t * 0.4 + i * 1.7));
    const gr = g.createLinearGradient(x0, 0, x0 - 70, hz + 30); gr.addColorStop(0, rgba(warm, a)); gr.addColorStop(1, rgba(warm, 0));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 14, 0); g.lineTo(x0 - 56, hz + 30); g.lineTo(x0 - 84, hz + 30); g.closePath(); g.fill();
  }
}

function dapple(g, t, tod, biome) {
  if (tod === 'night' || biome === 'tunnels' || biome === 'caves' || biome === 'lava' || biome === 'arena') return;
  const hz = ROAD.horizonY;
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1, u = hash(i * 5 + 1), x = W / 2 + side * (96 + u * 70) + Math.sin(t * 0.5 + i) * 3, y = hz + 14 + hash(i * 9 + 2) * (H - hz - 16), rx = 7 + u * 9, ry = rx * 0.45;
    const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(40,60,50,0.13)'); gr.addColorStop(1, 'rgba(40,60,50,0)');
    g.fillStyle = gr; g.save(); g.translate(0, y); g.scale(1, ry / rx); g.translate(0, -y); g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore();
  }
}

function grade(g, tod, biome) {
  if (tod === 'dusk') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(120,90,170,0.10)'); gr.addColorStop(0.45, 'rgba(255,150,110,0.12)'); gr.addColorStop(1, 'rgba(90,50,90,0.14)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  else if (tod === 'night') { g.fillStyle = 'rgba(20,28,90,0.16)'; g.fillRect(0, 0, W, H); }
  else if (biome !== 'tunnels' && biome !== 'caves') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,250,220,0.05)'); gr.addColorStop(1, 'rgba(255,230,180,0.0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
}

function musicTint(g, view, t, dt) {
  const name = mood.forced ? mood.name : (view?.track?.id ? 'race_' + view.track.id : null);
  const target = MOODS[name] ?? { tint: [255, 255, 255], k: 0, bpm: 100 };
  const k = 1 - Math.exp(-dt * 1.2);                                                 // slow cross-fade between songs
  for (let i = 0; i < 3; i++) mood.cur.tint[i] = lerp(mood.cur.tint[i], target.tint[i], k);
  mood.cur.k = lerp(mood.cur.k, target.k, k); mood.cur.bpm = lerp(mood.cur.bpm, target.bpm, k);
  mood.flash = Math.max(0, mood.flash - dt);
  const beat = 0.5 + 0.5 * Math.cos((t * mood.cur.bpm / 60) * TAU), a = mood.cur.k * (0.75 + 0.25 * beat) + mood.flash * 0.25;
  if (a > 0.002) { g.fillStyle = rgba(mood.cur.tint.map(Math.round), clamp(a, 0, 0.4)); g.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ hooks
export const hooks = {
  beforeSky(g, ctx, view) {
    const t = view?.t ?? 0;
    st.dt = st.lastT === null ? 0 : clamp(t - st.lastT, 0, 0.1); st.lastT = t;
  },
  afterWorld(g, ctx, view) {
    const t = view?.t ?? 0, tod = todOf(view), biome = biomeOf(view), P = view?.player ?? view?.pods?.[0];
    const sp = clamp((P?.speed ?? 0) / POD.maxSpeed, 0, 1.5), boost = !!(P?.boost && P.boost.active);
    g.save();
    safe(() => lightShafts(g, t, tod, biome));
    safe(() => dapple(g, t, tod, biome));
    safe(() => motes(g, t, biome, tod, sp, boost));
    safe(() => grade(g, tod, biome));
    safe(() => musicTint(g, view, t, st.dt ?? 0));
    if (boost) safe(() => { const gr = g.createRadialGradient(W / 2, H * 0.62, 20, W / 2, H * 0.62, 190); gr.addColorStop(0, 'rgba(120,210,255,0)'); gr.addColorStop(1, 'rgba(120,210,255,0.22)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    g.restore();
  },
  afterHud(g) {
    g.save();
    safe(() => { const gr = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.66); gr.addColorStop(0, 'rgba(40,20,50,0)'); gr.addColorStop(1, 'rgba(40,20,50,0.26)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    g.restore();
  },
};
export default { theme, hooks, setMusic, attachBus, MOODS };
