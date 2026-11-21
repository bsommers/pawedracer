// Ghibli pack: pods (rear view, driving away). Painted gradients, soft ink line, warm rim light. Owner: ghibli-style.
import { G, sprite, ell, poly, dot, line, shade, shadeB, sh, glowDot, TAU, star } from './draw.js';

const RACERS = {
  pod_colby: { hull: '#f0b24a', trim: '#e0483c', stripe: '#fff0d6', glow: '#7ad4ff', who: 'colby' },
  pod_pete:  { hull: '#4a4d4a', trim: '#9a2a2a', stripe: '#7a7e78', glow: '#ff4a3a', who: 'pete' },
  pod_r1: { hull: '#6f8fd8', trim: '#e8f0ff', stripe: '#f6efd6', glow: '#9ad4ff', who: '#e8e4ec' },   // blue-cheese team, white mouse
  pod_r2: { hull: '#f6efd6', trim: '#e0786a', stripe: '#d9b27a', glow: '#ffd88a', who: '#d9b27a' },   // brie team
  pod_r3: { hull: '#4aa078', trim: '#ffe27a', stripe: '#2d6a50', glow: '#9af0a0', who: '#9a8e8a' },   // mold team
  pod_r4: { hull: '#ecd29a', trim: '#7a5236', stripe: '#c9a45a', glow: '#ffe08a', who: '#b9a28a' },   // parmesan team
  pod_r5: { hull: '#e0623a', trim: '#ffd23a', stripe: '#ffb02a', glow: '#ff9a4a', who: '#8a7a8a' },   // fondue team
};

function ear(kit, c, x, y, dx, col, inner) {
  shade(kit, c, () => poly(c, [[x - 2.2, y + 1.6], [x + dx, y - 3.6], [x + 2.2, y + 1.6]]), col, { lw: 0.4, hi: 0.15, lo: 0.2, y0: y - 4, y1: y + 2 });
  if (inner) { poly(c, [[x - 0.9, y + 1.1], [x + dx * 0.8, y - 1.8], [x + 0.9, y + 1.1]]); c.fillStyle = inner; c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1; }
}

function driver(kit, c, who, t) {
  if (who === 'colby') {                                  // orange tabby, rear view, red scarf streaming behind
    const wob = Math.sin(t * 2) * 0.5;
    c.beginPath(); c.moveTo(21, 11); c.quadraticCurveTo(28, 11 + wob, 33, 8 + wob * 2); c.quadraticCurveTo(29, 13, 22, 13.4); c.closePath(); c.fillStyle = G.scarfL; c.fill(); c.lineWidth = 0.4; c.strokeStyle = G.ink; c.stroke();
    ear(kit, c, 15.5, 6, -1, G.fur, G.nose); ear(kit, c, 24.5, 6, 1, G.fur, G.nose);
    shade(kit, c, () => ell(c, 20, 10, 6, 5.2), G.fur, { y0: 5, y1: 15, lw: 0.5 });
    for (const x of [17.2, 20, 22.8]) line(c, x, 5.4, x + (x - 20) * 0.1, 8.3, 0.7, G.stripe);        // tabby back-of-head stripes
    ell(c, 20, 13.4, 5.2, 1.7); c.fillStyle = G.scarf; c.fill(); c.lineWidth = 0.4; c.strokeStyle = G.ink; c.stroke();
    dot(c, 17.5, 8.2, 0.9, G.furL);
  } else if (who === 'pete') {                            // gaunt charcoal rat, big pink ears, scrap-armour helmet, whip tail
    const w = Math.sin(t * 3) * 1.5;
    c.beginPath(); c.moveTo(20, 18); c.bezierCurveTo(14, 24, 8 + w, 22, 4 + w, 27); c.lineWidth = 1.1; c.strokeStyle = G.peteTail; c.stroke(); c.lineWidth = 0.4;
    shade(kit, c, () => ell(c, 13.5, 6.2, 3.7, 4.2), G.peteFurD, { lw: 0.5 }); shade(kit, c, () => ell(c, 26.5, 6.2, 3.7, 4.2), G.peteFurD, { lw: 0.5 });
    ell(c, 13.5, 6.4, 2.2, 2.7); c.fillStyle = G.peteEar; c.fill(); ell(c, 26.5, 6.4, 2.2, 2.7); c.fill();
    shade(kit, c, () => ell(c, 20, 11, 5.8, 6), G.peteFur, { y0: 5, y1: 17, lw: 0.5 });
    shade(kit, c, () => poly(c, [[14.6, 9.6], [20, 5.8], [25.4, 9.6], [24.2, 11.2], [15.8, 11.2]]), G.peteArmor, { lw: 0.45, y0: 6, y1: 11 });   // scrap helmet plate
    for (const x of [16.8, 20, 23.2]) dot(c, x, 8.8, 0.45, G.peteArmorL);
    glowDot(kit, c, 20, 14, 2.6, G.peteEye, 0.35);
  } else {                                                // little round mouse
    shade(kit, c, () => ell(c, 15.5, 6.6, 3.2, 3.2), who, { lw: 0.45 }); shade(kit, c, () => ell(c, 24.5, 6.6, 3.2, 3.2), who, { lw: 0.45 });
    ell(c, 15.5, 6.8, 1.7, 1.7); c.fillStyle = G.nose; c.globalAlpha = 0.6; c.fill(); ell(c, 24.5, 6.8, 1.7, 1.7); c.fill(); c.globalAlpha = 1;
    shade(kit, c, () => ell(c, 20, 10.6, 5.2, 4.8), who, { y0: 6, y1: 15, lw: 0.5 });
    shade(kit, c, () => poly(c, [[15.6, 9.4], [20, 7], [24.4, 9.4], [23.6, 10.8], [16.4, 10.8]]), '#3b3d4a', { lw: 0.4, y0: 7, y1: 11 });   // helmet
  }
}

/** one pod, drawn in a 40x28 box; lean -2..2 shears the nacelles and banks the hull */
export function drawPod(kit, c, P, lean = 0, t = 0, o = {}) {
  const k = o.k ?? 1;
  c.save();
  c.translate(20, 25); c.rotate(lean * 0.055); c.translate(-20 - lean * 0.5, -25);
  sh(kit, c, 20, 25.6, 16, 1.7, 0.28);
  // engine nacelles
  for (const sx of [-1, 1]) {
    const cx = 20 + sx * 13.2 + lean * sx * 0.3;
    shade(kit, c, () => kit.roundRect(c, cx - 4.6, 11, 9.2, 13.6, 3.4), P.hull, { y0: 11, y1: 25 });
    shade(kit, c, () => ell(c, cx, 23.6, 3.9, 1.7), G.steelD, { lw: 0.4, hi: 0, lo: 0.3 });
    glowDot(kit, c, cx, 23.8, 3.8, P.glow, 0.85);
    ell(c, cx, 23.8, 1.9, 0.85); c.fillStyle = G.white; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1;
    kit.roundRect(c, cx - 3.6, 13.2, 7.2, 1.7, 0.8); c.fillStyle = P.trim; c.fill();                                          // trim band
    line(c, cx - sx * 1.6, 16.4, cx - sx * 1.6, 21.4, 0.45, 'rgba(255,255,255,0.4)');                                        // sun-catch
  }
  // struts
  for (const sx of [-1, 1]) shade(kit, c, () => kit.roundRect(c, 20 + sx * 8.6 - 3, 16.6, 6, 2.4, 1), G.steelM, { lw: 0.35, y0: 16, y1: 19 });
  // central hull (rounded wedge)
  const hull = () => { c.beginPath(); c.moveTo(11.4, 24); c.quadraticCurveTo(10.6, 12, 16, 9.6); c.lineTo(24, 9.6); c.quadraticCurveTo(29.4, 12, 28.6, 24); c.quadraticCurveTo(20, 26.4, 11.4, 24); c.closePath(); };
  shade(kit, c, hull, P.hull, { y0: 9, y1: 26 });
  c.save(); hull(); c.clip();
  kit.roundRect(c, 10, 17, 20, 2.2, 1); c.fillStyle = P.stripe; c.globalAlpha = 0.85; c.fill(); c.globalAlpha = 1;
  ell(c, 15, 21.5, 1.3, 1.3); c.fillStyle = P.trim; c.fill(); ell(c, 25, 21.5, 1.3, 1.3); c.fill();
  c.fillStyle = kit.rgba(G.paper, 0.35); ell(c, 15.4, 12.6, 2.6, 1.3, -0.5); c.fill();
  c.restore();
  dot(c, 14.6, 24.6, 0.9, G.red); dot(c, 25.4, 24.6, 0.9, G.red); glowDot(kit, c, 14.6, 24.6, 2.2, G.red, 0.5); glowDot(kit, c, 25.4, 24.6, 2.2, G.red, 0.5);   // tail lamps
  driver(kit, c, P.who, t);
  c.restore();
}

function buildRacer(kit, name, w, h) {
  const P = RACERS[name], k = w / 40;
  return sprite(kit, w, h, 5, (c, i) => { c.scale(k, h / 28); drawPod(kit, c, P, i - 2, i * 0.7); });
}

export function build(kit) {
  const out = {};
  for (const name of Object.keys(RACERS)) out[name] = name === 'pod_pete' ? buildRacer(kit, name, 48, 32) : buildRacer(kit, name, 40, 28);
  out.pod_flame = sprite(kit, 12, 16, 4, (c, i) => {
    const L = [14, 11.5, 15, 12.5][i], Wd = [4.6, 5.2, 4.2, 5][i], sway = [0, 0.6, -0.5, 0.3][i];
    const tear = (len, wd) => { c.beginPath(); c.moveTo(6, 0.6); c.bezierCurveTo(6 - wd, 2 + len * 0.2, 6 - wd * 0.7 + sway, len * 0.7, 6 + sway, len); c.bezierCurveTo(6 + wd * 0.7 + sway, len * 0.7, 6 + wd, 2 + len * 0.2, 6, 0.6); c.closePath(); };
    tear(L, Wd); c.fillStyle = kit.lin(c, 0, 0, 0, L, [[0, G.flameL], [0.4, G.flame], [1, kit.rgba(G.flameD, 0.0)]]); c.fill();
    tear(L * 0.62, Wd * 0.55); c.fillStyle = kit.lin(c, 0, 0, 0, L * 0.62, [[0, '#ffffff'], [1, kit.rgba(G.flameL, 0)]]); c.fill();
    glowDot(kit, c, 6, 2, 5, G.flame, 0.35);
  });
  out.pod_shadow = sprite(kit, 40, 8, 1, (c) => { kit.softShadow(c, 20, 4, 19, 3.4, 0.5, G.ink); });
  out.pod_roll = sprite(kit, 40, 28, 6, (c, i) => {
    const a = (i / 6) * TAU;
    c.translate(20, 15); c.rotate(a); c.scale(0.66, 0.66); c.translate(-20, -15);
    drawPod(kit, c, RACERS.pod_colby, 0, i);
    if (i % 2) { glowDot(kit, c, 20, 14, 15, G.glass, 0.25); }
  });
  out.pod_wreck = sprite(kit, 40, 28, 2, (c, i) => {
    c.translate(20, 22); c.rotate(i ? 0.12 : -0.14); c.translate(-20, -22);
    drawPod(kit, c, { ...RACERS.pod_colby, hull: '#8a6a5a', trim: '#4a3a38', stripe: '#6a5448', glow: '#3a2a2a' }, i ? 2 : -2, 0);
    for (let k = 0; k < 4; k++) { const x = 11 + k * 6 + (i ? 2 : 0), y = 8 - k % 2 * 2; kit.blob(c, x, y, 3.6, 3.2, { seed: k + 1 + i * 5 }); c.fillStyle = `rgba(70,60,70,${0.5 - k * 0.07})`; c.fill(); }
    glowDot(kit, c, 28, 16, 3.5, G.flame, i ? 0.9 : 0.55);
    for (let s = 0; s < 3; s++) { star(c, 12 + s * 8, 2.4 + (s % 2), 1.4, 0.6, 4, i * 0.4 + s); c.fillStyle = G.gold; c.fill(); }
  });
  return out;
}
