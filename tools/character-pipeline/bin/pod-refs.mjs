// Renders the game's own retro pod sprites (rear view, level frame) as clean reference PNGs for the SDXL adapter:
// learning/pod-<id>.png (512x512, nearest-neighbour upscale on a light grey ground). Used as silhouette reference and img2img/IP-Adapter structure guide.
import { writeFileSync, mkdirSync } from 'node:fs';
import { build } from '../../../src/art/pods.js';
import { encodePNG, resize } from '../lib/image.mjs';
const out = process.argv[2] || 'learning', S = 512, BG = [200, 200, 200];
mkdirSync(out, { recursive: true });
const pods = build();
for (const [name, id] of [['pod_colby', 'colby'], ['pod_pete', 'pete'], ['pod_r1', 'rival']]) {
  const f = pods[name].frames[2], k = Math.floor((S * 0.8) / Math.max(f.w, f.h)), W = f.w * k, H = f.h * k, img = { w: S, h: S, rgba: new Uint8Array(S * S * 4) };
  for (let i = 0; i < S * S; i++) img.rgba.set([...BG, 255], i * 4);
  const ox = (S - W) >> 1, oy = ((S - H) >> 1) + 20;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) { const o = (y * f.w + x) * 4; if (f.rgba[o + 3] < 128) continue; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) img.rgba.set([f.rgba[o], f.rgba[o + 1], f.rgba[o + 2], 255], ((oy + y * k + dy) * S + ox + x * k + dx) * 4); }
  writeFileSync(`${out}/pod-${id}.png`, encodePNG(img)); console.log(`${out}/pod-${id}.png`);
}
