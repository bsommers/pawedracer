// Screen drawing (owner: ui-shell). Everything draws on a logical W x H context (retro 320x200; hi-res styles pre-scale the context).
// Pure functions of (ctx, state, t, art); Node-safe, so tests can run them against a recording fake context.
import { PAL, W, H, TRACKS, TITLE, SUBTITLE, PRIZE } from '../core/defs.js';
import { drawText } from './font.js';
import { MAIN_ITEMS, OPTION_ITEMS } from './menus.js';
import { toDrawable } from '../art/registry.js';

export const fmtTime = (s) => (s > 0 ? Math.floor(s / 60) + ':' + (s % 60).toFixed(2).padStart(5, '0') : '-:--.--');
const fmt = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const ord = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
const PUNS = ['Gouda luck out there!', 'Brie-ng it on, Pete!', 'Feta late than never.', 'Nacho average race.', 'Cheddar get going!', 'Do not take any Gruyere-ntee.', 'Colby Jack of all trades.', 'Munster-ous speed!'];
const BIOME_COL = { coast: '#4ad2ff', mesa: '#d9a41a', tunnels: '#a87a2a', lava: '#ff5a1a', bog: '#4f6aa8', snow: '#e8f4ff', caves: '#7a4aa8', arena: '#ffd23a' };

/** Draw one art frame at (x,y) at `scale` x its logical size. Returns false when the sprite is unavailable. */
export function blit(g, art, name, fr, x, y, scale = 1) {
  const s = art && art.get && art.get(name);
  if (!s || !s.frames || !s.frames.length) return false;
  const f = s.frames[((fr % s.frames.length) + s.frames.length) % s.frames.length];
  try { g.drawImage(toDrawable(f), x, y, s.w * scale, s.h * scale); return true; } catch { return false; }
}
export function panel(g, x, y, w, h, a = 0.72) {
  g.fillStyle = `rgba(10,7,16,${a})`; g.fillRect(x, y, w, h);
  g.fillStyle = PAL.hudDim; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h);
}
const item = (g, label, x, y, sel, t, opts = {}) => {
  const bob = sel ? Math.round(Math.sin(t * 8)) : 0;
  drawText(g, (sel ? '> ' : '  ') + label, x + bob, y, { color: sel ? PAL.hudTxt : PAL.white, align: opts.align ?? 'left', shadow: PAL.black });
};

export function drawTitle(g, flow, t, art) {
  g.fillStyle = 'rgba(10,7,16,0.35)'; g.fillRect(0, 0, W, H);
  if (!blit(g, art, 'logo', 0, (W - 200) / 2, 8, 1)) {
    drawText(g, TITLE.toUpperCase(), W / 2, 12, { scale: 4, color: PAL.hudTxt, align: 'center', shadow: PAL.furD });
  }
  drawText(g, SUBTITLE, W / 2, 58, { color: PAL.flameL, align: 'center' });
  panel(g, 70, 72, 180, MAIN_ITEMS.length * 12 + 12);
  MAIN_ITEMS.forEach((it, i) => item(g, it.label, 82, 78 + i * 12, flow.cursor.title === i, t));
  drawText(g, PUNS[Math.floor(t / 4) % PUNS.length], W / 2, H - 28, { color: PAL.cream, align: 'center' });
  if (((t * 2) | 0) % 2 === 0) drawText(g, 'PRESS ENTER', W / 2, H - 16, { color: PAL.hudTxt, align: 'center' });
  drawText(g, 'WHISKERS ' + fmt(flow.save.whiskers) + '   WINS ' + flow.save.wins, 4, H - 8, { color: PAL.hudDim, shadow: null });
}

export function drawTracks(g, flow, t, art) {
  g.fillStyle = PAL.hudBg; g.fillRect(0, 0, W, H);
  const mode = { race: 'QUICK RACE', time: 'TIME TRIAL', ghost: 'GHOST RACE' }[flow.pendingMode] ?? 'RACE';
  drawText(g, mode + ' - PICK A CHEESE', W / 2, 6, { scale: 1, color: PAL.hudTxt, align: 'center' });
  TRACKS.forEach((tr, i) => {
    const y = 22 + i * 19, sel = flow.cursor.tracks === i;
    g.fillStyle = sel ? '#3a2a55' : '#1c1428'; g.fillRect(6, y - 2, 150, 17);
    g.fillStyle = BIOME_COL[tr.biome] || PAL.cheese; g.fillRect(6, y - 2, 3, 17);
    item(g, (i + 1) + '. ' + tr.name, 12, y + 1, sel, t);
    const b = flow.save.best[tr.id]; drawText(g, b ? fmtTime(b) : '--', 152, y + 8, { align: 'right', color: PAL.hudDim, shadow: null });
  });
  const tr = TRACKS[flow.cursor.tracks];
  panel(g, 164, 22, 150, 150);
  g.fillStyle = BIOME_COL[tr.biome] || PAL.cheese; g.fillRect(168, 26, 142, 40);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(168, 54, 142, 12);
  for (let i = 0; i < 20; i++) { g.fillStyle = PAL.asphalt; g.fillRect(168 + i * 7, 56 + Math.round(Math.sin(t * 2 + i * 0.5) * 2), 5, 10); }
  drawText(g, tr.name, 239, 72, { align: 'center', color: PAL.white });
  const rows = [['LAPS', tr.laps], ['SETTING', tr.theme.toUpperCase()], ['BIOME', tr.biome.toUpperCase()], ['BEST', fmtTime(flow.save.best[tr.id])], ['BEST LAP', fmtTime(flow.save.bestLap[tr.id])], ['GHOST', flow.save.ghosts[tr.id] ? 'SAVED' : 'NONE']];
  rows.forEach(([k, v], i) => { drawText(g, k, 172, 88 + i * 12, { color: PAL.hudDim, shadow: null }); drawText(g, String(v), 308, 88 + i * 12, { align: 'right', color: PAL.hudTxt }); });
  if (flow.pendingMode === 'ghost' && !flow.save.ghosts[tr.id]) drawText(g, 'Set a time first!', 239, 162, { align: 'center', color: PAL.red, shadow: null });
  drawText(g, 'UP/DOWN  LEFT/RIGHT jump  ENTER go  ESC back', W / 2, H - 10, { align: 'center', color: PAL.hudDim, shadow: null });
}

const OPT_LABEL = { style: 'STYLE', master: 'VOLUME', music: 'MUSIC', mute: 'MUTE', touch: 'TOUCH CONTROLS', crt: 'CRT SCANLINES', back: 'BACK' };
export function optionValue(key, o) {
  if (key === 'style') return o.style.toUpperCase();
  if (key === 'master' || key === 'music') return '[' + '#'.repeat(Math.round(o[key] * 10)) + '.'.repeat(10 - Math.round(o[key] * 10)) + ']';
  if (key === 'mute' || key === 'crt') return o[key] ? 'ON' : 'OFF';
  if (key === 'touch') return o.touch.toUpperCase();
  return '';
}
export function drawOptions(g, flow, t) {
  g.fillStyle = PAL.hudBg; g.fillRect(0, 0, W, H);
  drawText(g, 'OPTIONS', W / 2, 10, { scale: 2, color: PAL.hudTxt, align: 'center' });
  panel(g, 30, 36, W - 60, OPTION_ITEMS.length * 18 + 10);
  OPTION_ITEMS.forEach((k, i) => {
    const y = 44 + i * 18, sel = flow.cursor.options === i;
    item(g, OPT_LABEL[k], 40, y, sel, t);
    if (k !== 'back') drawText(g, '< ' + optionValue(k, flow.options) + ' >', W - 40, y, { align: 'right', color: sel ? PAL.flameL : PAL.white });
  });
  drawText(g, 'Four styles, one sim: G cycles in a race.', W / 2, H - 22, { align: 'center', color: PAL.hudDim, shadow: null });
  drawText(g, 'LEFT/RIGHT change  ESC back', W / 2, H - 10, { align: 'center', color: PAL.hudDim, shadow: null });
}

export function drawResults(g, flow, t, art) {
  const s = flow.lastResults; if (!s) return;
  g.fillStyle = PAL.hudBg; g.fillRect(0, 0, W, H);
  const tr = TRACKS.find((x) => x.id === s.trackId);
  drawText(g, s.win ? 'VICTORY! PURR-FECT!' : 'RACE RESULTS', W / 2, 5, { scale: 2, color: s.win ? PAL.flameL : PAL.hudTxt, align: 'center' });
  drawText(g, (tr ? tr.name : '') + (s.mode === 'time' ? ' (time trial)' : s.mode === 'ghost' ? ' (ghost)' : s.mode === 'duel' ? ' (Pete duel)' : ''), W / 2, 24, { align: 'center', color: PAL.hudDim, shadow: null });
  panel(g, 8, 34, 200, s.results.length * 12 + 8);
  s.results.forEach((r, i) => {
    const y = 40 + i * 12, me = r.pod === 0;
    if (me) { g.fillStyle = '#3a2a55'; g.fillRect(10, y - 2, 196, 11); }
    drawText(g, ord(r.place), 14, y, { color: me ? PAL.flameL : PAL.white, shadow: null });
    drawText(g, r.name.slice(0, 16), 46, y, { color: me ? PAL.flameL : r.pod === 1 ? PAL.red : PAL.white, shadow: null });
    drawText(g, r.finished === false ? 'DNF' : fmtTime(r.time), 202, y, { align: 'right', color: PAL.hudDim, shadow: null });
  });
  panel(g, 214, 34, 98, 118);
  drawText(g, 'YOUR TIME', 262, 40, { align: 'center', color: PAL.hudDim, shadow: null });
  drawText(g, fmtTime(s.me.time), 262, 50, { align: 'center', scale: 1, color: PAL.white });
  drawText(g, 'LAP ' + fmtTime(s.me.bestLap), 262, 62, { align: 'center', color: PAL.hudDim, shadow: null });
  if (s.newBest) drawText(g, 'NEW RECORD!', 262, 74, { align: 'center', color: PAL.green });
  else if (s.newLap) drawText(g, 'NEW LAP RECORD!', 262, 74, { align: 'center', color: PAL.green });
  drawText(g, 'PRIZE', 262, 90, { align: 'center', color: PAL.hudDim, shadow: null });
  drawText(g, '+' + fmt(s.prize) + ' W', 262, 100, { align: 'center', scale: 2, color: PAL.flameL });
  drawText(g, 'WALLET ' + fmt(flow.save.whiskers), 262, 120, { align: 'center', color: PAL.hudTxt });
  if (flow.tournament && s.mode !== 'time') drawText(g, '+' + s.points + ' CUP PTS', 262, 134, { align: 'center', color: PAL.green });
  if (((t * 2) | 0) % 2 === 0) drawText(g, flow.tournament ? 'ENTER: standings' : 'ENTER: next race  ARROWS: retry  ESC: title', W / 2, H - 14, { align: 'center', color: PAL.hudTxt, shadow: null });
}

export function drawStandings(g, flow, t) {
  g.fillStyle = PAL.hudBg; g.fillRect(0, 0, W, H);
  const rd = flow.tournament.round + 1;
  drawText(g, 'CHEESE CUP STANDINGS', W / 2, 6, { scale: 2, color: PAL.hudTxt, align: 'center' });
  drawText(g, 'After race ' + rd + ' of ' + TRACKS.length, W / 2, 26, { align: 'center', color: PAL.hudDim, shadow: null });
  panel(g, 50, 38, 220, 8 * 13 + 8);
  flow.standings().forEach((s, i) => {
    const y = 44 + i * 13, me = s.pod === 0;
    if (me) { g.fillStyle = '#3a2a55'; g.fillRect(52, y - 2, 216, 12); }
    drawText(g, (i + 1) + '.', 58, y, { color: PAL.hudDim, shadow: null });
    drawText(g, s.name.slice(0, 22), 80, y, { color: me ? PAL.flameL : s.pod === 1 ? PAL.red : PAL.white, shadow: null });
    drawText(g, s.points + ' pts', 262, y, { align: 'right', color: PAL.hudTxt, shadow: null });
  });
  const last = rd >= TRACKS.length;
  drawText(g, 'WHISKERS ' + fmt(flow.save.whiskers), W / 2, 150, { align: 'center', color: PAL.flameL });
  if (((t * 2) | 0) % 2 === 0) drawText(g, last ? 'ENTER: the podium!' : 'ENTER: next - ' + TRACKS[rd].name, W / 2, H - 22, { align: 'center', color: PAL.hudTxt, shadow: null });
  drawText(g, 'LEFT/RIGHT: visit the shop   ESC: quit cup', W / 2, H - 10, { align: 'center', color: PAL.hudDim, shadow: null });
}

export function drawPodium(g, flow, t, art) {
  g.fillStyle = '#1a1030'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {   // deterministic confetti
    const x = (i * 97) % W, y = ((i * 53 + t * (30 + (i % 5) * 9)) % (H + 10)) - 5;
    g.fillStyle = [PAL.red, PAL.cheese, PAL.green, PAL.glass, PAL.nose][i % 5]; g.fillRect(x, y, 3, 3);
  }
  const st = flow.standings(), top = st.slice(0, 3), champ = top[0];
  drawText(g, champ && champ.pod === 0 ? 'CHEESE CUP CHAMPION!' : 'CHEESE CUP PODIUM', W / 2, 6, { scale: 2, color: PAL.flameL, align: 'center' });
  const steps = [{ x: 130, h: 56, i: 0 }, { x: 70, h: 40, i: 1 }, { x: 190, h: 28, i: 2 }];
  for (const s of steps) {
    const e = top[s.i]; if (!e) continue;
    const base = 160, y = base - s.h;
    g.fillStyle = s.i === 0 ? PAL.cheese : s.i === 1 ? PAL.steel : PAL.rind; g.fillRect(s.x, y, 60, s.h);
    g.fillStyle = PAL.outline; g.fillRect(s.x, y, 60, 2);
    drawText(g, String(s.i + 1), s.x + 30, y + 8, { scale: 3, color: PAL.outline, align: 'center', shadow: null });
    const nm = e.pod === 0 ? 'colby_podium' : e.pod === 1 ? 'pete_podium' : null;
    const bob = s.i === 0 ? Math.round(Math.sin(t * 6) * 2) : 0;
    if (!(nm && blit(g, art, nm, s.i === 0 ? 1 : 0, s.x + 6, y - 64 + bob, 1))) { g.fillStyle = PAL.cream; g.fillRect(s.x + 20, y - 24 + bob, 20, 24); g.fillStyle = PAL.outline; g.fillRect(s.x + 24, y - 18 + bob, 4, 4); g.fillRect(s.x + 32, y - 18 + bob, 4, 4); }
    drawText(g, e.name.slice(0, 12), s.x + 30, y - 66 + bob < 20 ? 22 : base + 4, { align: 'center', color: e.pod === 0 ? PAL.flameL : PAL.white, shadow: null });
    drawText(g, e.points + ' pts', s.x + 30, base + 14, { align: 'center', color: PAL.hudDim, shadow: null });
  }
  const bonus = flow.champBonus || 0;
  if (bonus) drawText(g, 'Champion bonus +' + fmt(bonus) + ' W', W / 2, H - 22, { align: 'center', color: PAL.green });
  if (((t * 2) | 0) % 2 === 0) drawText(g, 'ENTER', W / 2, H - 10, { align: 'center', color: PAL.hudTxt, shadow: null });
}

export function drawPause(g, flow, t) {
  g.fillStyle = 'rgba(10,7,16,0.6)'; g.fillRect(0, 0, W, H);
  panel(g, 100, 60, 120, 76, 0.85);
  drawText(g, 'PAUSED', W / 2, 68, { scale: 2, color: PAL.hudTxt, align: 'center' });
  flow.PAUSE_ITEMS.forEach((l, i) => item(g, l, 110, 92 + i * 12, flow.cursor.pause === i, t));
  drawText(g, 'P to resume', W / 2, 142, { align: 'center', color: PAL.hudDim, shadow: null });
}

/** Big 3-2-1-GO overlay driven by view.countdown / view.phase. `goT` = seconds since GO (for the GO flash). */
export function drawCountdown(g, view, t, goT = 99) {
  if (view.phase === 'countdown') {
    const n = Math.ceil(view.countdown), frac = view.countdown - Math.floor(view.countdown);
    if (n >= 1) drawText(g, String(n), W / 2, 56, { scale: 8 + Math.round((1 - frac) * 2), color: n === 1 ? PAL.green : PAL.hudTxt, align: 'center', shadow: PAL.black });
    drawText(g, 'GET READY', W / 2, 40, { scale: 1, color: PAL.white, align: 'center' });
  } else if (goT < 1.0) {
    drawText(g, 'GO!', W / 2, 50, { scale: 8 + Math.round(Math.sin(goT * 20)), color: PAL.green, align: 'center', shadow: PAL.black });
  }
}

/** Small corner toast e.g. style change. */
export function drawToast(g, text, t0, t) {
  if (!text || t - t0 > 1.6) return;
  drawText(g, text, W / 2, H - 16, { align: 'center', color: PAL.flameL, shadow: PAL.black });
}

export const PRIZE_TABLE = PRIZE.place;

/** Click/tap hit-test for list screens: returns the item index under logical point (x, y), or -1. */
export function hitItem(screen, x, y) {
  const row = (top, step, n, x0, x1) => { if (x < x0 || x > x1) return -1; const i = Math.floor((y - top + 2) / step); return i >= 0 && i < n && y >= top - 2 ? i : -1; };
  if (screen === 'title') return row(78, 12, MAIN_ITEMS.length, 70, 250);
  if (screen === 'tracks') return row(22, 19, TRACKS.length, 6, 156);
  if (screen === 'options') return row(44, 18, OPTION_ITEMS.length, 30, W - 30);
  if (screen === 'shop') return row(40, 24, 6, 14, W - 14);
  if (screen === 'pause') return row(92, 12, 3, 100, 220);
  return -1;
}
