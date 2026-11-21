// HUD (owner: render-road), ARCHITECTURE section 1. Bitmap font from src/ui/font.js (fillRect based).
// ui = { radio:{ who:'colby'|'pete'|'mouse_a'|'mouse_b'|'supercolby', text, t }, flash:{ text, color, t }, hidden }
import { PAL, W, H, POD } from '../core/defs.js';
import { drawText } from '../ui/font.js';
import { drawSprite } from './scene.js';

const ordinal = (n) => n + '/8';
export const fmtTime = (s) => (s > 0 ? Math.floor(s / 60) + ':' + (s % 60).toFixed(2).padStart(5, '0') : '-:--.--');

function bar(g, x, y, w, h, v, c0, c1, label) {
  g.fillStyle = PAL.hudBg; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = PAL.outline; g.fillRect(x, y, w, h);
  const fw = Math.max(0, Math.min(1, v)) * w;
  g.fillStyle = c0; g.fillRect(x, y, fw, h);
  if (c1 && fw > 0) { g.fillStyle = c1; g.fillRect(x, y, fw, 1); }
  if (label) drawText(g, label, x, y - 8, { color: PAL.hudDim, shadow: PAL.black });
}

export function drawHud(g, view, art, t, ui = {}) {
  if (ui.hidden) return;
  const P = view.player ?? view.pods[0], tx = { shadow: PAL.black };
  // top-left: position and lap
  drawText(g, ordinal(view.place ?? P.place ?? 1), 4, 4, { ...tx, color: PAL.hudTxt, scale: 2 });
  drawText(g, 'LAP ' + Math.min(view.laps, P.lap ?? view.lap ?? 1) + '/' + view.laps, 4, 22, { ...tx, color: PAL.white });
  // top-right: speed and best lap
  const kph = Math.round(((P.speed ?? 0) / POD.maxSpeed) * 320);
  drawText(g, kph + ' KPH', W - 4, 4, { ...tx, color: P.boost && P.boost.active ? PAL.flameL : PAL.hudTxt, scale: 2, align: 'right' });
  drawText(g, 'BEST ' + fmtTime(view.bestLap ?? 0), W - 4, 22, { ...tx, color: PAL.white, align: 'right' });
  // bottom-left: heat and health
  const heat = P.heat ?? 0, hot = heat > 0.8 && ((t * 8) | 0) % 2 === 0;
  bar(g, 6, H - 22, 56, 6, heat, hot ? PAL.white : PAL.heatLo, heat > 0.6 ? PAL.heatHi : null, 'HEAT');
  const hp = (P.health ?? 100) / POD.healthMax;
  bar(g, 6, H - 8, 56, 6, hp, hp < 0.3 ? PAL.red : PAL.green, '#ffffff55', 'HULL');
  // bottom-centre: boost charge
  const bc = P.boost ? P.boost.charge : 0, ready = bc >= 0.999 || (P.boost && P.boost.active);
  bar(g, W / 2 - 28, H - 8, 56, 5, bc, P.boost && P.boost.active ? PAL.flameL : ready ? PAL.glass : PAL.glassD, null, null);
  drawText(g, P.boost && P.boost.active ? 'BOOST!' : ready ? 'BOOST READY' : 'BOOST', W / 2, H - 17, { ...tx, color: ready ? PAL.glass : PAL.hudDim, align: 'center' });
  // bottom-right: radio portrait + subtitle
  const r = ui.radio;
  if (r && r.text) {
    const nm = 'portrait_' + (r.who ?? 'pete'), px = W - 40, py = H - 40;
    g.fillStyle = PAL.hudBg; g.globalAlpha = 0.8; g.fillRect(W - 128, H - 46, 124, 44); g.globalAlpha = 1;
    g.fillStyle = PAL.outline; g.fillRect(px - 1, py - 1, 38, 38);
    drawSprite(g, art, nm, r.mood ?? ((t * 6) | 0) % 2, px + 18, py + 36, 36);
    drawText(g, String(r.text).slice(0, 44), W - 126, H - 40, { color: PAL.hudTxt, shadow: PAL.black, wrap: undefined });
  }
  // centre messages: countdown, GO, final lap, flash
  if (view.phase === 'countdown') {
    const n = Math.ceil(view.countdown ?? 0), s = 5 + (1 - ((view.countdown ?? 0) % 1)) * 3;
    drawText(g, n > 0 ? String(n) : 'GO!', W / 2, 60, { color: n > 0 ? PAL.hudTxt : PAL.green, scale: Math.round(s), align: 'center', shadow: PAL.black });
  } else if (view.phase === 'racing' && view.t < (view.goFlash ?? 0.8)) {
    drawText(g, 'GO!', W / 2, 60, { color: PAL.green, scale: 6, align: 'center', shadow: PAL.black });
  }
  if (P.wreck) drawText(g, 'WRECKED!', W / 2, 70, { color: PAL.red, scale: 3, align: 'center', shadow: PAL.black });
  else if (P.stalled) drawText(g, 'OVERHEAT!', W / 2, 70, { color: ((t * 6) | 0) % 2 ? PAL.red : PAL.flameL, scale: 3, align: 'center', shadow: PAL.black });
  if (ui.flash && ui.flash.text) drawText(g, ui.flash.text, W / 2, 46, { color: ui.flash.color ?? PAL.scYellow, scale: 2, align: 'center', shadow: PAL.black });
  if (view.phase === 'finished') drawText(g, 'FINISH!', W / 2, 60, { color: PAL.scYellow, scale: 5, align: 'center', shadow: PAL.black });
}
