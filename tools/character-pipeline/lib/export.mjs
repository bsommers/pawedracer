// Export to the asset-library format through the factory library tooling. Never edits the factory; imports its capability handlers read-only and
// shells out to its CLI for validate/index. Asset ids: <character>.<style>.<kind>, kinds turnaround | expressions | pose-sheet | billboard (+ bible/prompts beside the image).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encodePNG, resize, newImage, blit } from './image.mjs';
import { previewFile } from './preview.mjs';
export const STYLE_TAG = { retro: 'style:retro-16bit', toon: 'style:cartoon-vector', ghibli: 'style:ghibli', photo: 'style:photoreal' };
const HERE = dirname(fileURLToPath(import.meta.url));
export const FACTORY_CLI = process.env.FACTORY_LIBRARY_CLI || resolve(HERE, '../../../../game-factory/factory-core/library/cli.mjs');
const json = (o) => Buffer.from(JSON.stringify(o, null, 2) + '\n');
const gridOf = (images, cell = 256, cols = 3) => { const rows = Math.ceil(images.length / cols), g = newImage(cols * cell, rows * cell); images.forEach((im, i) => { const s = Math.min(cell / im.w, cell / im.h), r = resize(im, Math.max(1, Math.round(im.w * s)), Math.max(1, Math.round(im.h * s))); blit(g, r, (i % cols) * cell + ((cell - r.w) >> 1), Math.floor(i / cols) * cell + ((cell - r.h) >> 1)); }); return g; };
/** Build the library items for one pipeline run. run = {bible, style, results:[{kind,label,image,mips?,prompt,negative,meta,model,seed}], verdict, palette}. */
export function buildItems(run) {
  const { bible, style, results, verdict } = run, base = `${bible.id}.${style}`, tags = [`character:${bible.id}`, `role:${bible.role}`, STYLE_TAG[style] || `style:${style}`, `species:${bible.species.split(/[ (]/)[0].toLowerCase()}`, `generator:${run.adapter || 'mock'}`, ...(run.adapter === 'mock' || !run.adapter ? ['quality:placeholder'] : [])];
  const common = (kind, rs) => ({ provenance: { game: 'pawedracer', generator: [...new Set(rs.map((r) => r.model))].join(', ').slice(0, 190), source: 'char-pipeline 1.0', note: `bible ${rs[0].meta.bibleHash}; prompts ${rs.map((r) => r.meta.promptHash).join(',')}; seeds ${rs.map((r) => r.seed).join(',')}; verdict ${verdict.pass ? 'pass' : 'fail'}`.slice(0, 480) }, tags });
  const aux = (rs) => [{ path: 'bible.json', data: json(bible) }, { path: 'prompts.json', data: json(rs.map((r) => ({ label: r.label, prompt: r.prompt, negative: r.negative, meta: r.meta, model: r.model, seed: r.seed }))) }, { path: 'verdict.json', data: json({ pass: verdict.pass, summary: verdict.summary, items: verdict.items.filter((x) => rs.some((r) => r.label === x.label)) }) }];
  const items = [], by = (k) => results.filter((r) => r.kind === k);
  const mk = (kind, type, name, description, rs, img, extra = {}) => { const png = encodePNG(img); items.push({ id: `${base}.${kind}`, type, name, description, format: 'png+json', size: { w: img.w, h: img.h }, palette: Object.values(bible.colors).map((c) => c.toLowerCase()).slice(0, 32), ...common(kind, rs), files: [{ path: `${kind}.png`, data: png }, ...aux(rs), ...(extra.files || [])], preview: previewFile(img, `preview.png`) }); };
  const t = by('turnaround')[0]; if (t) mk('turnaround', 'character', `${bible.name}: ${style} turnaround`, `Front and side turnaround of ${bible.name} (${style}).`, [t], t.image);
  const ex = by('expression'); if (ex.length) mk('expressions', 'character', `${bible.name}: ${style} expressions`, `Expression sheet (${ex.map((e) => e.meta.expression).join(', ')}).`, ex, gridOf(ex.map((e) => e.image)));
  const po = by('pose'); if (po.length) mk('pose-sheet', 'character', `${bible.name}: ${style} pose sheet`, `Pose sheet (${po.map((e) => e.meta.pose).join(', ')}).`, po, gridOf(po.map((e) => e.image)));
  const b = by('billboard')[0]; if (b) mk('billboard', 'sprite', `${bible.name}: ${style} billboard`, `In-game billboard sprite with mip chain ${(b.mips || []).map((m) => m.h).join('/')} px (mips.png).`, [b], b.image, { files: b.mips ? [{ path: 'mips.png', data: encodePNG(strip(b.mips.map((m) => m.image))) }] : [] });
  return items;
}
const strip = (ims) => { const w = ims.reduce((s, i) => s + i.w, 0), h = Math.max(...ims.map((i) => i.h)), o = newImage(w, h); let x = 0; for (const i of ims) { blit(o, i, x, h - i.h); x += i.w; } return o; };
/** Add items via the factory's library.add capability (the CLI cannot take file buffers on argv), then run `library validate` and `library index --check` via the real CLI. */
export async function exportToLibrary(items, libraryDir, { update = true } = {}) {
  const lib = resolve(libraryDir); if (!existsSync(join(lib, 'library.json'))) throw new Error(`not a library: ${lib}`);
  if (!existsSync(FACTORY_CLI)) throw new Error(`factory library CLI not found at ${FACTORY_CLI} (set FACTORY_LIBRARY_CLI)`);
  const { addItems } = await import(pathToFileURL(resolve(dirname(FACTORY_CLI), 'ops.mjs')).href);
  const add = addItems(lib, items, { update });
  if (!add.ok) throw new Error(`library add failed: ${add.error?.code} ${add.error?.message}`);
  const run = (sub) => spawnSync(process.execPath, [FACTORY_CLI, 'library', sub, lib], { encoding: 'utf8' });
  const idx = run('index'), val = run('validate');
  return { add: add.data, indexOk: idx.status === 0, validateOk: val.status === 0, validateOut: (val.stdout + val.stderr).trim().split('\n').slice(0, 6).join('\n') };
}
