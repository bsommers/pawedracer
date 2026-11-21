#!/usr/bin/env node
// PNG of one rendered frame: node tools/render-frame.mjs [--track brie] [--style retro] [--steps 600] [--out out/frame.png] [--fake] [--scale 1] [--boost] [--t 1.5]
// Uses the real sim (src/sim/race.js + src/levels/tracks.js) with a simple driver when available, else the fake race view from scene.js.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { deflateSync, crc32 } from 'node:zlib';
import { W, H, HI_SCALE, DT } from '../src/core/defs.js';
import { createPixCtx } from '../src/art/registry.js';
import { createRenderer } from '../src/render/renderer.js';
import { fakeView } from '../src/render/scene.js';

export function encodePNG(w, h, rgba) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Render one frame to a Node PixBuf-backed ctx. Returns { ctx, view }. */
export async function renderFrame({ track = 'brie', style = 'retro', steps = 600, fake = false, scale, boost = false, t = 1.5, seed = 1 } = {}) {
  const sc = scale ?? (style === 'retro' ? 1 : HI_SCALE);
  const ctx = createPixCtx(W * sc, H * sc);
  const r = createRenderer(ctx, { style, seed });
  await r.ready;
  r.resize();
  let view = null;
  if (!fake) {
    try {
      const { createRace } = await import('../src/sim/race.js');
      const { trackDef } = await import('../src/levels/tracks.js');
      const race = createRace({ track: trackDef(track, seed), seed, laps: 3, player: { parts: { engine: 0, cooling: 0, grip: 0, armor: 0, thrust: 0 }, pilot: 'colby' }, mode: 'race' });
      for (let i = 0; i < steps; i++) race.step({ steer: 0, throttle: 1, brake: 0, boost: boost && i % 200 > 100, roll: 0, yaw: 0 });
      view = race.view();
    } catch (e) { console.error('real sim unavailable, using fake view:', e.message); }
  }
  if (!view) {
    const { TRACKS } = await import('../src/core/defs.js');
    const def = TRACKS.find((x) => x.id === track);
    view = fakeView({ biome: def?.biome ?? 'coast', theme: def?.theme, boost, t });
  }
  r.draw(view, t, { radio: { who: 'pete', text: 'Eat my dust, tabby!' } });
  return { ctx, view };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2), opt = {};
  for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2); const v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; opt[k] = v; }
  const out = opt.out ?? `out/frame-${opt.track ?? 'brie'}-${opt.style ?? 'retro'}.png`;
  const { ctx } = await renderFrame({ track: opt.track ?? 'brie', style: opt.style ?? 'retro', steps: +(opt.steps ?? 600), fake: !!opt.fake, scale: opt.scale ? +opt.scale : undefined, boost: !!opt.boost, t: +(opt.t ?? 1.5) });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, encodePNG(ctx.canvas.width, ctx.canvas.height, ctx.canvas.__pb.rgba));
  console.log('wrote', out, ctx.canvas.width + 'x' + ctx.canvas.height);
}
