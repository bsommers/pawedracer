// Orchestrates: bible -> prompts -> adapter -> raw -> post-process -> consistency -> contact sheet -> (optional) export.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadBible } from './bible.mjs';
import { composePrompt, shotPlan, hashOf } from './compose.mjs';
import { getAdapter } from '../adapters/index.mjs';
import { encodePNG, readImage } from './image.mjs';
import { postProcess } from './postprocess.mjs';
import { consistencyCheck } from './check.mjs';
import { contactSheet, contactHtml } from './sheet.mjs';
import { learnReference, splitViews, crop } from './learn.mjs';
import { buildItems, exportToLibrary } from './export.mjs';
const name = (s) => [s.shot, s.expression, s.pose].filter(Boolean).join('-');
export async function runPipeline({ biblePath, style = 'toon', adapter = 'mock', approved = false, seed = 1, outRoot = 'out/char', libraryDir = null, refPath = null, only = null }) {
  const bible = typeof biblePath === 'string' ? loadBible(biblePath) : biblePath, ad = getAdapter(adapter, { approved });
  const dir = resolve(outRoot, bible.id, style); for (const d of ['raw', 'processed']) mkdirSync(join(dir, d), { recursive: true });
  let plan = shotPlan(bible, style); if (only) plan = plan.filter((s) => only.includes(s.shot));
  const refs = (bible.references || []).slice(0, 4); // paths only; the mock never reads or sends them, network adapters would need approval for uploads
  const results = [];
  for (const [i, s] of plan.entries()) {
    const c = composePrompt(bible, s), g = await ad.generate({ prompt: c.prompt, negative: c.negative, refs: ad.network ? refs : [], seed: seed + i, shot: s.shot, size: c.meta.size, style, bible, expression: s.expression, pose: s.pose });
    const kind = s.shot, label = name(s), pp = postProcess(g.image, { style, kind, palette: Object.values(bible.colors), size: c.meta.size });
    writeFileSync(join(dir, 'raw', `${label}.png`), encodePNG(g.image)); writeFileSync(join(dir, 'processed', `${label}.png`), encodePNG(pp.image));
    results.push({ kind, label, image: pp.image, mips: pp.mips, prompt: c.prompt, negative: c.negative, meta: c.meta, model: g.model, seed: seed + i, steps: pp.steps });
  }
  // silhouette reference for billboards: front view of the reference sheet (if any), else the generated turnaround's first view
  let refSil = null; const refFile = refPath || (refs[0] && resolve(refs[0]));
  try { if (refFile) { const l = learnReference(readImage(refFile)), v = splitViews(l.cutout)[0]; if (v?.bbox) refSil = crop(l.cutout, v.bbox.x, v.bbox.y, v.bbox.w, v.bbox.h); } } catch { /* optional */ }
  if (!refSil) { const t = results.find((r) => r.kind === 'turnaround'); if (t) { const v = splitViews(t.image)[0]; if (v?.bbox) refSil = crop(t.image, v.bbox.x, v.bbox.y, v.bbox.w, v.bbox.h); } }
  const verdict = consistencyCheck(results.map((r) => ({ label: r.label, kind: r.kind, image: r.image })), { bible, ref: refSil });
  const sheet = contactSheet(results.map((r) => ({ image: r.image, pass: verdict.items.find((x) => x.label === r.label)?.pass })));
  writeFileSync(join(dir, 'contact-sheet.png'), encodePNG(sheet)); writeFileSync(join(dir, 'contact-sheet.html'), contactHtml(`${bible.name} (${style}, ${adapter})`, 'contact-sheet.png', verdict, { bible: hashOf(bible), adapter }));
  writeFileSync(join(dir, 'verdict.json'), JSON.stringify(verdict, null, 2)); writeFileSync(join(dir, 'prompts.json'), JSON.stringify(results.map(({ image, mips, ...r }) => r), null, 2));
  const run = { bible, style, adapter, results, verdict, dir };
  if (libraryDir) { run.items = buildItems(run); run.export = await exportToLibrary(run.items, libraryDir); }
  return run;
}
