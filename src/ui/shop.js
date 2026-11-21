// Shop + persistence (owner: ui-shell). Pure logic (Node-safe) plus drawShop(). Save data lives under one localStorage key.
import { PARTS, PAL, W, H, PRIZE, TRACKS } from '../core/defs.js';
import { drawText } from './font.js';
import { blit } from './screens.js';

export const SAVE_KEY = 'pawedracer.save';
export const PART_KEYS = Object.freeze(Object.keys(PARTS));
export const MAX_TIER = 4;
export const START_WHISKERS = 500;

export const defaultSave = () => ({ whiskers: START_WHISKERS, parts: { engine: 0, cooling: 0, grip: 0, armor: 0, thrust: 0 }, best: {}, bestLap: {}, ghosts: {}, wins: 0 });

const isNum = (v) => typeof v === 'number' && isFinite(v) && v >= 0;
/** Validate arbitrary parsed data into a full save object. */
export function sanitizeSave(o) {
  const d = defaultSave();
  if (!o || typeof o !== 'object') return d;
  if (isNum(o.whiskers)) d.whiskers = Math.floor(o.whiskers);
  if (isNum(o.wins)) d.wins = Math.floor(o.wins);
  for (const k of PART_KEYS) if (o.parts && Number.isInteger(o.parts[k])) d.parts[k] = Math.min(MAX_TIER, Math.max(0, o.parts[k]));
  for (const t of TRACKS) {
    if (o.best && isNum(o.best[t.id]) && o.best[t.id] > 0) d.best[t.id] = o.best[t.id];
    if (o.bestLap && isNum(o.bestLap[t.id]) && o.bestLap[t.id] > 0) d.bestLap[t.id] = o.bestLap[t.id];
    const g = o.ghosts && o.ghosts[t.id];
    if (g && Array.isArray(g.d) && Array.isArray(g.x) && isNum(g.time) && g.d.length === g.x.length && g.d.length > 2 && g.d.length < 20000) d.ghosts[t.id] = { time: g.time, dt: isNum(g.dt) && g.dt > 0 ? g.dt : 0.05, d: g.d.map(Number), x: g.x.map(Number) };
  }
  return d;
}
const store = (s) => { if (s) return s; try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };
export function loadSave(storage) { try { const s = store(storage); return sanitizeSave(s ? JSON.parse(s.getItem(SAVE_KEY)) : null); } catch { return defaultSave(); } }
export function writeSave(save, storage) { try { const s = store(storage); if (s) { s.setItem(SAVE_KEY, JSON.stringify(save)); return true; } } catch { /* quota / private mode */ } return false; }

/** Cost of the next tier of a part, or null when maxed. */
export function nextCost(save, key) { const lv = save.parts[key]; return lv >= MAX_TIER ? null : PARTS[key].tiers[lv + 1]; }
export function canBuy(save, key) { const c = nextCost(save, key); return c !== null && save.whiskers >= c; }
/** Buy one tier. Returns { ok, reason?, cost? }; mutates save only on success. */
export function buy(save, key) {
  if (!PARTS[key]) return { ok: false, reason: 'unknown' };
  const c = nextCost(save, key);
  if (c === null) return { ok: false, reason: 'maxed' };
  if (save.whiskers < c) return { ok: false, reason: 'poor', cost: c };
  save.whiskers -= c; save.parts[key] += 1;
  return { ok: true, cost: c };
}
/** Refund the last tier (full price, so players can experiment). */
export function sell(save, key) {
  const lv = save.parts[key];
  if (!PARTS[key] || lv <= 0) return { ok: false };
  const c = PARTS[key].tiers[lv]; save.parts[key] -= 1; save.whiskers += c;
  return { ok: true, cost: c };
}
export const prizeFor = (place) => PRIZE.place[Math.min(7, Math.max(0, (place | 0) - 1))] ?? 0;

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const QUIPS = ['Tuna-mazing!', 'Finest rind!', 'Cheddar go fast!', 'Whisker-thin margins!', 'Gouda choice!'];

/** shop UI state: { cursor, msg, msgT }. */
export function createShop() { return { cursor: 0, msg: '', msgT: 0 }; }
export function shopAct(shop, save, act) {
  const n = PART_KEYS.length + 1;                        // last row = LEAVE
  if (act === 'up') { shop.cursor = (shop.cursor + n - 1) % n; return { sfx: 'menu_move' }; }
  if (act === 'down') { shop.cursor = (shop.cursor + 1) % n; return { sfx: 'menu_move' }; }
  if (act === 'back') return { leave: true };
  if (act === 'left' && shop.cursor < PART_KEYS.length) { const r = sell(save, PART_KEYS[shop.cursor]); if (r.ok) { shop.msg = 'Refunded ' + fmt(r.cost) + ' whiskers'; shop.msgT = 2; return { sfx: 'menu_move', changed: true }; } return {}; }
  if (act === 'confirm' || act === 'right') {
    if (shop.cursor >= PART_KEYS.length) return act === 'confirm' ? { leave: true, sfx: 'menu_ok' } : {};
    const key = PART_KEYS[shop.cursor], r = buy(save, key);
    if (r.ok) { shop.msg = PARTS[key].name + ' upgraded! ' + QUIPS[(save.parts[key] + shop.cursor) % QUIPS.length]; shop.msgT = 2.5; return { sfx: 'shop_buy', changed: true }; }
    shop.msg = r.reason === 'maxed' ? 'Already purrfect.' : 'Not enough whiskers!'; shop.msgT = 2;
    return { sfx: 'menu_move' };
  }
  return {};
}
export function shopTick(shop, dt) { if (shop.msgT > 0) { shop.msgT -= dt; if (shop.msgT <= 0) shop.msg = ''; } }

export function drawShop(g, shop, save, t, art) {
  g.fillStyle = PAL.hudBg; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4) { g.fillStyle = y % 8 ? '#150f1f' : '#1c1428'; g.fillRect(0, y, W, 4); }
  drawText(g, 'PAW-TS SHOP', W / 2, 8, { scale: 2, color: PAL.hudTxt, align: 'center' });
  drawText(g, 'WHISKERS ' + fmt(save.whiskers), W / 2, 26, { color: PAL.flameL, align: 'center' });
  PART_KEYS.forEach((k, i) => {
    const y = 40 + i * 24, sel = shop.cursor === i, lv = save.parts[k], c = nextCost(save, k);
    g.fillStyle = sel ? '#3a2a55' : '#241a38'; g.fillRect(14, y - 3, W - 28, 22);
    g.fillStyle = sel ? PAL.hudTxt : PAL.outline; g.fillRect(14, y - 3, 2, 22);
    if (!blit(g, art, 'shop_parts', i, 20, y - 1, 0.75)) { g.fillStyle = PAL.cheese; g.fillRect(20, y, 18, 18); g.fillStyle = PAL.cheeseHole; g.fillRect(25, y + 5, 4, 4); }
    drawText(g, PARTS[k].name, 44, y, { color: sel ? PAL.white : PAL.hudDim });
    drawText(g, PARTS[k].effect, 44, y + 10, { color: PAL.hudDim, shadow: null });
    for (let j = 0; j < MAX_TIER; j++) { g.fillStyle = j < lv ? PAL.cheese : PAL.outline; g.fillRect(W - 112 + j * 11, y + 1, 9, 6); }
    drawText(g, c === null ? 'MAX' : fmt(c) + ' W', W - 20, y + 10, { align: 'right', color: c === null ? PAL.green : save.whiskers >= c ? PAL.green : PAL.red });
  });
  const ly = 40 + PART_KEYS.length * 24;
  drawText(g, (shop.cursor === PART_KEYS.length ? '> ' : '  ') + 'BACK TO THE PARKWAY', W / 2, ly + 2, { align: 'center', color: shop.cursor === PART_KEYS.length ? PAL.hudTxt : PAL.hudDim });
  if (shop.msg) drawText(g, shop.msg, W / 2, H - 22, { align: 'center', color: PAL.flameL, shadow: PAL.black });
  drawText(g, 'UP/DOWN pick  ENTER/RIGHT buy  LEFT refund  ESC back', W / 2, H - 10, { align: 'center', color: PAL.hudDim, shadow: null });
}
