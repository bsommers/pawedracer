// Ghibli pack: portraits, podium figures, logo. Soft painted faces, warm rim light. Owner: ghibli-style.
import { G, sprite, ell, poly, dot, line, shade, glowDot, sh, star, TAU } from './draw.js';
import { PAL } from '../../core/defs.js';

const FONT = '"Trebuchet MS","Segoe UI",Verdana,Arial,sans-serif';
const backdrop = (kit, c, w, h, col) => {            // soft painted disc behind a portrait
  c.fillStyle = kit.radial(c, w / 2, h * 0.45, 0, w * 0.62, [[0, kit.rgba(kit.lighten(col, 0.4), 0.9)], [0.7, kit.rgba(col, 0.75)], [1, kit.rgba(col, 0)]]);
  ell(c, w / 2, h / 2, w * 0.5, h * 0.5); c.fill();
};
const eyeOpen = (c, x, y, r, col, look = 0) => {
  ell(c, x, y, r, r * 1.15); c.fillStyle = G.white; c.fill(); c.lineWidth = 0.35; c.strokeStyle = G.ink; c.stroke();
  dot(c, x + look, y + r * 0.1, r * 0.78, col); dot(c, x + look, y + r * 0.1, r * 0.4, G.ink); dot(c, x + look - r * 0.3, y - r * 0.3, r * 0.26, '#fff');
};
const eyeArc = (c, x, y, r, up = true) => { c.beginPath(); c.arc(x, y + (up ? r * 0.4 : -r * 0.4), r, up ? Math.PI * 1.1 : Math.PI * 0.1, up ? Math.PI * 1.9 : Math.PI * 0.9); c.lineWidth = 0.7; c.strokeStyle = G.ink; c.stroke(); };
const crossEye = (c, x, y, r) => { line(c, x - r, y - r, x + r, y + r, 0.7, G.ink); line(c, x + r, y - r, x - r, y + r, 0.7, G.ink); };

/** Colby front-face in a 48x48 box. mood 0 idle, 1 grin, 2 hurt, 3 hero (mask) */
export function colbyFace(kit, c, mood, o = {}) {
  const sc = o.super;
  for (const sx of [-1, 1]) {                                          // ears
    const x = 24 + sx * 12.5;
    shade(kit, c, () => poly(c, [[x - sx * 6, 17], [x + sx * 2.4, 3.6], [x + sx * 7.6, 19]]), G.fur, { lw: 0.55, y0: 3, y1: 19 });
    poly(c, [[x - sx * 3.2, 16.2], [x + sx * 2.2, 7.6], [x + sx * 5, 16.6]]); c.fillStyle = G.nose; c.globalAlpha = 0.6; c.fill(); c.globalAlpha = 1;
  }
  shade(kit, c, () => ell(c, 24, 27, 17.5, 15), G.fur, { y0: 12, y1: 42, lw: 0.6 });                      // head
  for (const x of [-5.5, 0, 5.5]) { c.beginPath(); c.moveTo(24 + x, 12.2); c.quadraticCurveTo(24 + x * 1.1, 16, 24 + x * 0.9, 18.8); c.lineWidth = 1.5 - Math.abs(x) * 0.07; c.strokeStyle = G.stripe; c.stroke(); }
  for (const sx of [-1, 1]) for (const k of [0, 1]) line(c, 24 + sx * 15.4, 25 + k * 3.4, 24 + sx * 11.4, 25.8 + k * 3, 1.1, G.stripe);   // cheek stripes
  ell(c, 24, 34, 9, 6.4); c.fillStyle = G.cream; c.fill();                                              // muzzle
  const ey = 26;
  if (sc) { shade(kit, c, () => { c.beginPath(); c.moveTo(6.6, 22); c.quadraticCurveTo(24, 17.4, 41.4, 22); c.lineTo(41, 29); c.quadraticCurveTo(24, 25.4, 7, 29); c.closePath(); }, '#3f77bd', { lw: 0.5, hi: 0.2, lo: 0.2, y0: 18, y1: 29 }); }
  if (mood === 0 || mood === 3) { eyeOpen(c, 17, ey, 3.5, G.eye, 0.3); eyeOpen(c, 31, ey, 3.5, G.eye, 0.3); }
  else if (mood === 1) { eyeArc(c, 17, ey, 3.2); eyeArc(c, 31, ey, 3.2); line(c, 11, ey - 4.6, 20, ey - 3.8, 0.8, G.furD); line(c, 37, ey - 4.6, 28, ey - 3.8, 0.8, G.furD); }
  else { crossEye(c, 17, ey, 2.4); crossEye(c, 31, ey, 2.4); }
  shade(kit, c, () => poly(c, [[21.6, 31], [26.4, 31], [24, 34]]), G.nose, { lw: 0.4, hi: 0.1, lo: 0.2, y0: 31, y1: 34 });
  c.beginPath(); c.moveTo(24, 34); c.lineTo(24, 35.6); c.lineWidth = 0.5; c.strokeStyle = G.ink; c.stroke();
  if (mood === 1) { c.beginPath(); c.moveTo(18.4, 36); c.quadraticCurveTo(24, 46, 29.6, 36); c.closePath(); c.fillStyle = '#7a2a30'; c.fill(); c.lineWidth = 0.5; c.strokeStyle = G.ink; c.stroke(); ell(c, 24, 41, 3, 1.4); c.fillStyle = G.nose; c.fill(); }
  else if (mood === 2) { c.beginPath(); c.moveTo(19.5, 39); c.quadraticCurveTo(24, 35.6, 28.5, 39); c.lineWidth = 0.7; c.strokeStyle = G.ink; c.stroke(); dot(c, 38, 17, 1.4, G.glass); dot(c, 38.4, 20.4, 1, G.glass); }
  else { c.beginPath(); c.moveTo(24, 35.6); c.quadraticCurveTo(21.4, 38.4, 19, 36.4); c.moveTo(24, 35.6); c.quadraticCurveTo(26.6, 38.4, 29, 36.4); c.lineWidth = 0.6; c.strokeStyle = G.ink; c.stroke(); }
  for (const sx of [-1, 1]) for (const k of [-1, 0, 1]) { c.beginPath(); c.moveTo(24 + sx * 9, 34.4 + k); c.lineTo(24 + sx * 18.6, 33 + k * 2.6); c.lineWidth = 0.28; c.strokeStyle = 'rgba(59,47,58,0.7)'; c.stroke(); }   // whiskers
  if (!sc) {                                                          // scarf and explorer hat
    shade(kit, c, () => { c.beginPath(); c.moveTo(10, 42); c.quadraticCurveTo(24, 50, 38, 42); c.lineTo(37, 47.6); c.quadraticCurveTo(24, 51, 11, 47.6); c.closePath(); }, G.scarf, { lw: 0.5 });
    if (mood !== 3) {
      shade(kit, c, () => { c.beginPath(); c.moveTo(11, 15); c.quadraticCurveTo(24, 5.4, 37, 15); c.quadraticCurveTo(24, 17, 11, 15); c.closePath(); }, G.hat, { lw: 0.5, y0: 6, y1: 17 });
      line(c, 12.5, 14.4, 35.5, 14.4, 1.1, G.scarf);
    }
  } else {                                                            // hero cape clasp + star
    shade(kit, c, () => { c.beginPath(); c.moveTo(10, 42); c.quadraticCurveTo(24, 50, 38, 42); c.lineTo(36, 48); c.quadraticCurveTo(24, 51, 12, 48); c.closePath(); }, '#e0392b', { lw: 0.5 });
    star(c, 24, 46.6, 2.2, 0.9); c.fillStyle = G.gold; c.fill();
  }
}

/** Pete front-face: gaunt charcoal rat, red eyes, scrap armour. mood 0 snarl, 1 laugh, 2 shocked */
export function peteFace(kit, c, mood) {
  for (const sx of [-1, 1]) {
    const x = 24 + sx * 14.4;
    shade(kit, c, () => ell(c, x, 12.5, 7.4, 8.6), G.peteFurD, { lw: 0.55 });
    ell(c, x, 13, 4.6, 5.6); c.fillStyle = G.peteEar; c.fill();
  }
  shade(kit, c, () => { c.beginPath(); c.moveTo(11, 24); c.quadraticCurveTo(12, 10, 24, 9); c.quadraticCurveTo(36, 10, 37, 24); c.quadraticCurveTo(34, 38, 28, 46); c.lineTo(20, 46); c.quadraticCurveTo(14, 38, 11, 24); c.closePath(); }, G.peteFur, { lw: 0.6, y0: 9, y1: 46 });
  for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(24 + sx * 2.6, 11); c.lineTo(24 + sx * 3.6, 16); c.lineWidth = 0.8; c.strokeStyle = G.peteFurD; c.stroke(); }
  shade(kit, c, () => poly(c, [[13, 20], [24, 14.6], [35, 20], [33, 22.4], [15, 22.4]]), G.peteArmor, { lw: 0.5, y0: 14, y1: 23 });    // scrap brow plate
  for (const x of [17, 24, 31]) dot(c, x, 18.8, 0.6, G.peteArmorL);
  const ey = 27;
  if (mood === 0) { for (const sx of [-1, 1]) { glowDot(kit, c, 24 + sx * 6.4, ey, 5, G.peteEye, 0.35); ell(c, 24 + sx * 6.4, ey, 3, 2.3, sx * 0.35); c.fillStyle = G.peteEye; c.fill(); c.lineWidth = 0.4; c.strokeStyle = G.ink; c.stroke(); dot(c, 24 + sx * 6.4, ey, 0.9, G.ink); dot(c, 24 + sx * 6.9, ey - 0.8, 0.5, '#fff'); } }
  else if (mood === 1) { eyeArc(c, 17.6, ey, 3); eyeArc(c, 30.4, ey, 3); glowDot(kit, c, 17.6, ey, 3.5, G.peteEye, 0.25); glowDot(kit, c, 30.4, ey, 3.5, G.peteEye, 0.25); }
  else { for (const sx of [-1, 1]) { glowDot(kit, c, 24 + sx * 6.4, ey, 6, G.peteEye, 0.4); ell(c, 24 + sx * 6.4, ey, 3.2, 3.6); c.fillStyle = G.white; c.fill(); c.lineWidth = 0.4; c.strokeStyle = G.ink; c.stroke(); dot(c, 24 + sx * 6.4, ey, 1.2, G.peteEye); } }
  shade(kit, c, () => ell(c, 24, 38, 4.4, 3.4), G.peteEar, { lw: 0.45, hi: 0.1, lo: 0.2, y0: 34, y1: 41 });                           // snout
  dot(c, 24, 36.2, 1.4, G.ink);
  if (mood === 0) { c.beginPath(); c.moveTo(18, 41); c.quadraticCurveTo(24, 38.4, 30, 41); c.lineWidth = 0.6; c.strokeStyle = G.ink; c.stroke(); kit.roundRect(c, 22, 40.2, 4, 3.6, 0.6); c.fillStyle = '#f1ead8'; c.fill(); c.lineWidth = 0.35; c.stroke(); }   // buck teeth
  else if (mood === 1) { c.beginPath(); c.moveTo(16, 39.6); c.quadraticCurveTo(24, 52, 32, 39.6); c.closePath(); c.fillStyle = '#5a1a22'; c.fill(); c.lineWidth = 0.5; c.strokeStyle = G.ink; c.stroke(); kit.roundRect(c, 22, 40, 4, 3.4, 0.6); c.fillStyle = '#f1ead8'; c.fill(); }
  else { ell(c, 24, 42.4, 3, 3.4); c.fillStyle = '#5a1a22'; c.fill(); c.lineWidth = 0.5; c.strokeStyle = G.ink; c.stroke(); dot(c, 38.6, 15, 1.4, G.glass); }
  for (const sx of [-1, 1]) for (const k of [-1, 0, 1]) { c.beginPath(); c.moveTo(24 + sx * 5, 38.4 + k); c.lineTo(24 + sx * 17, 36.6 + k * 3); c.lineWidth = 0.28; c.strokeStyle = 'rgba(241,234,216,0.75)'; c.stroke(); }
  shade(kit, c, () => { c.beginPath(); c.moveTo(6, 48); c.lineTo(11, 43); c.lineTo(20, 46.4); c.lineTo(28, 46.4); c.lineTo(37, 43); c.lineTo(42, 48); c.closePath(); }, G.peteArmor, { lw: 0.5, y0: 43, y1: 48 });   // pauldrons
}

function mouse(kit, c, body, mood, kind) {                          // announcer mouse 32x32, headset mic
  for (const sx of [-1, 1]) { shade(kit, c, () => ell(c, 16 + sx * 9.4, 8, 5, 5), body, { lw: 0.5 }); ell(c, 16 + sx * 9.4, 8.2, 2.9, 2.9); c.fillStyle = G.nose; c.globalAlpha = 0.6; c.fill(); c.globalAlpha = 1; }
  shade(kit, c, () => ell(c, 16, 19, 11, 10.4), body, { y0: 9, y1: 30, lw: 0.55 });
  ell(c, 16, 22.4, 6, 4.4); c.fillStyle = G.cream; c.fill();
  for (const sx of [-1, 1]) { eyeOpen(c, 16 + sx * 4.6, 17, 2.2, '#3a2a30', 0); if (kind === 'a') { c.beginPath(); c.arc(16 + sx * 4.6, 17, 3.7, 0, TAU); c.lineWidth = 0.5; c.strokeStyle = G.inkSoft; c.stroke(); } }
  if (kind === 'a') line(c, 16 - 0.9, 17, 16 + 0.9, 17, 0.5, G.inkSoft);
  dot(c, 16, 21.2, 1.1, G.nose);
  if (mood) { ell(c, 16, 25, 2.2, 1.9); c.fillStyle = '#7a2a30'; c.fill(); } else { c.beginPath(); c.moveTo(13.6, 24.2); c.quadraticCurveTo(16, 26, 18.4, 24.2); c.lineWidth = 0.5; c.strokeStyle = G.ink; c.stroke(); }
  c.beginPath(); c.arc(16, 15, 11.2, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = 1.1; c.strokeStyle = '#4a4d5a'; c.stroke();     // headset band
  line(c, 26.6, 14.6, 25, 22, 0.55, '#4a4d5a'); dot(c, 24.8, 22.6, 1.3, '#d63a2f');                                                    // mic boom
  if (kind === 'b') { poly(c, [[12.6, 29.4], [16, 28], [19.4, 29.4], [19.4, 31.4], [16, 30.4], [12.6, 31.4]]); c.fillStyle = G.scarf; c.fill(); }   // bow tie
}

function cheeseTrophy(kit, c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  shade(kit, c, () => { c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); c.lineTo(5, -6); c.quadraticCurveTo(0, -10, -5, -6); c.closePath(); }, G.cheese, { lw: 0.5, y0: -9, y1: 0 });
  dot(c, -1.6, -4, 1, G.cheeseHole); dot(c, 2.2, -2.2, 0.8, G.cheeseHole); star(c, 0, -11.6, 2.4, 1, 5); c.fillStyle = G.gold; c.fill(); c.lineWidth = 0.3; c.strokeStyle = G.ink; c.stroke();
  c.restore();
}

function podium(kit, c, who, pose) {                                  // 48x64: figure above a numbered block
  const bh = 22, by = 64 - bh, col = who === 'colby' ? '#e8c060' : '#9aa0b0';
  sh(kit, c, 24, 63, 22, 2.4, 0.3);
  shade(kit, c, () => kit.roundRect(c, 4, by, 40, bh, 2), col, { lw: 0.6, y0: by, y1: 64 });
  c.fillStyle = 'rgba(255,255,255,0.25)'; kit.roundRect(c, 6, by + 2, 36, 3, 1); c.fill();
  c.font = `bold 13px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 1.1; c.strokeStyle = G.ink; c.strokeText(who === 'colby' ? '1' : '2', 24, by + 12); c.fillStyle = G.paper; c.fillText(who === 'colby' ? '1' : '2', 24, by + 12);
  const fs = 0.8; c.save(); c.translate(24 - 24 * fs, by - 47 * fs + (pose === 1 ? -2 : 0)); c.scale(fs, fs);   // face box sits on the block
  if (who === 'colby') {
    for (const sx of [-1, 1]) { const ax = 24 + sx * 17; line(c, 24 + sx * 12, 44, ax, pose === 2 ? 50 : 30 - (pose === 1 ? 4 : 0), 5, G.fur); line(c, 24 + sx * 12, 44, ax, pose === 2 ? 50 : 30 - (pose === 1 ? 4 : 0), 3.6, G.furL); dot(c, ax, pose === 2 ? 51 : 29 - (pose === 1 ? 4 : 0), 3, G.cream); }
    colbyFace(kit, c, pose === 2 ? 2 : 1);
    if (pose !== 2) cheeseTrophy(kit, c, 36, 47 - (pose === 1 ? 5 : 0), 1.1);
  } else {
    for (const sx of [-1, 1]) line(c, 24 + sx * 12, 46, 24 + sx * 16, pose === 1 ? 36 : 50, 4.6, G.peteFurD);
    peteFace(kit, c, pose === 1 ? 1 : pose === 2 ? 2 : 0);
  }
  c.restore();
}

export function build(kit) {
  const out = {};
  out.portrait_colby = sprite(kit, 48, 48, 3, (c, i) => { backdrop(kit, c, 48, 48, '#8fd4e8'); colbyFace(kit, c, i); if (i === 1) for (let k = 0; k < 3; k++) line(c, 1 + k * 1.6, 12 + k * 7, 8 + k * 2, 12 + k * 7, 0.7, 'rgba(255,255,255,0.8)'); });
  out.portrait_pete = sprite(kit, 48, 48, 3, (c, i) => { backdrop(kit, c, 48, 48, '#a05a5a'); peteFace(kit, c, i); });
  out.portrait_supercolby = sprite(kit, 48, 48, 2, (c, i) => { backdrop(kit, c, 48, 48, '#f4d12e'); colbyFace(kit, c, i ? 1 : 3, { super: true }); if (i) glowDot(kit, c, 24, 26, 26, '#fff08a', 0.3); });
  out.portrait_mouse_a = sprite(kit, 32, 32, 2, (c, i) => { backdrop(kit, c, 32, 32, '#b9d8e8'); mouse(kit, c, '#c9c4d2', i, 'a'); });
  out.portrait_mouse_b = sprite(kit, 32, 32, 2, (c, i) => { backdrop(kit, c, 32, 32, '#f0d8b0'); mouse(kit, c, '#d9b27a', i, 'b'); });
  out.colby_podium = sprite(kit, 48, 64, 3, (c, i) => podium(kit, c, 'colby', i));
  out.pete_podium = sprite(kit, 48, 64, 3, (c, i) => podium(kit, c, 'pete', i));
  out.logo = sprite(kit, 200, 48, 1, (c) => {
    const txt = 'PAWED RACER';
    c.font = `italic bold 36px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    let w = c.measureText(txt).width, k = Math.min(1, 176 / Math.max(1, w)); c.save(); c.translate(100, 24); c.scale(k, k);
    c.lineWidth = 7; c.strokeStyle = G.ink; c.strokeText(txt, 0, 1); c.lineWidth = 4.4; c.strokeStyle = G.scarf; c.strokeText(txt, 0, 1);
    c.fillStyle = kit.lin(c, 0, -16, 0, 18, [[0, '#fff08a'], [0.5, G.cheese], [1, '#e0a81e']]); c.fillText(txt, 0, 1);
    c.restore();
    for (let k2 = 0; k2 < 5; k2++) dot(c, 24 + k2 * 38 + (k2 % 2) * 6, 7 + (k2 * 13) % 30, 0.7, 'rgba(255,255,255,0.7)');
    for (const [x, y] of [[8, 38], [192, 38]]) { dot(c, x, y, 3.2, G.fur); for (const [dx, dy] of [[-2.8, -3.4], [0, -4.6], [2.8, -3.4]]) dot(c, x + dx, y + dy, 1.2, G.fur); }
    void PAL;
  });
  return out;
}
