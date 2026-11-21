#!/usr/bin/env node
// char-pipeline CLI. Every command accepts --json. Zero dependencies, offline (mock adapter only unless a user-approved adapter is registered).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBible, loadBible } from '../lib/bible.mjs';
import { composePrompt, STYLES, SHOTS } from '../lib/compose.mjs';
import { learnReference } from '../lib/learn.mjs';
import { readImage, encodePNG } from '../lib/image.mjs';
import { runPipeline } from '../lib/pipeline.mjs';
import { listAdapters } from '../adapters/index.mjs';
const HERE = dirname(fileURLToPath(import.meta.url)), BIBLES = join(HERE, '..', 'bibles');
const argv = process.argv.slice(2), cmd = argv[0], opt = {}, pos = [];
for (let i = 1; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const [k, v] = a.slice(2).split(/=(.*)/s); opt[k] = v ?? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true); } else pos.push(a); }
const out = (o, text) => console.log(opt.json ? JSON.stringify(o, null, 2) : text ?? JSON.stringify(o, null, 2));
const bibleFile = (x) => (x.endsWith('.json') ? resolve(x) : join(BIBLES, `${x}.json`));
const help = `usage: char.mjs <command> [args] [--json]
  validate <bible|path>                       check a bible against the schema
  prompt <bible> --style toon --shot turnaround [--expression e] [--pose p] [--variant v]
  learn <image> [--out dir]                   palette, bg-key cutout, views, outline weight of a reference sheet
  run <bible> --style toon [--adapter mock] [--seed 1] [--out out/char] [--library ../character-library] [--only turnaround,billboard] [--tries N (best of N seeds)]
  all [--style toon] [--library dir]          run every bundled bible
  adapters                                    list adapters
bundled bibles: ${readdirSync(BIBLES).map((f) => basename(f, '.json')).join(', ')}; styles: ${Object.keys(STYLES).join(', ')}; shots: ${Object.keys(SHOTS).join(', ')}`;
try {
  if (cmd === 'validate') { const f = bibleFile(pos[0]), r = validateBible(JSON.parse(readFileSync(f, 'utf8'))); out(r, `${r.ok ? 'OK' : 'INVALID'} ${f}\n${[...r.errors, ...r.warnings.map((w) => 'warn: ' + w)].join('\n')}`); process.exit(r.ok ? 0 : 1); }
  else if (cmd === 'prompt') { const c = composePrompt(loadBible(bibleFile(pos[0])), { style: opt.style || 'toon', shot: opt.shot || 'turnaround', expression: opt.expression, pose: opt.pose, variant: opt.variant }); out(c, `${c.prompt}\n\nNEGATIVE: ${c.negative}\n${JSON.stringify(c.meta)}`); }
  else if (cmd === 'learn') { const l = learnReference(readImage(resolve(pos[0])), basename(pos[0])), { cutout, ...rest } = l; if (opt.out) { mkdirSync(opt.out, { recursive: true }); writeFileSync(join(opt.out, 'cutout.png'), encodePNG(cutout)); writeFileSync(join(opt.out, 'identity.json'), JSON.stringify(rest, null, 2)); } out(rest, `${rest.source}: ${rest.views.length} views, outline ${rest.outlineWeightPx}px, bg ${rest.background}\npalette ${rest.palette.map((p) => p.hex).join(' ')}`); }
  else if (cmd === 'run' || cmd === 'all') {
    const ids = cmd === 'all' ? readdirSync(BIBLES).map((f) => basename(f, '.json')) : [pos[0]], res = [];
    for (const id of ids) { const r = await runPipeline({ biblePath: bibleFile(id), style: opt.style || 'toon', adapter: opt.adapter || 'mock', seed: +opt.seed || 1, outRoot: opt.out || 'out/char', libraryDir: opt.library || null, only: opt.only ? opt.only.split(',') : null, tries: +opt.tries || 1 }); res.push({ bible: r.bible.id, style: r.style, dir: r.dir, pass: r.verdict.pass, summary: r.verdict.summary, failing: r.verdict.items.filter((x) => !x.pass).map((x) => x.label), export: r.export }); }
    out(res, res.map((r) => `${r.pass ? 'PASS' : 'FAIL'} ${r.bible}/${r.style}: ${r.summary} -> ${r.dir}${r.export ? `\n  library: added ${r.export.add.added.length}, updated ${r.export.add.updated.length}, validate ${r.export.validateOk ? 'ok' : 'FAILED'}` : ''}`).join('\n'));
  } else if (cmd === 'adapters') out(listAdapters(), listAdapters().map((a) => `${a.name} network=${a.network}`).join('\n'));
  else { console.log(help); process.exit(cmd ? 2 : 0); }
} catch (e) { console.error('error: ' + e.message); process.exit(1); }
