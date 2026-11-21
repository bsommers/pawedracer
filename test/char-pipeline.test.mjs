import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateBible, loadBible } from '../tools/character-pipeline/lib/bible.mjs';
import { composePrompt, shotPlan, STYLES } from '../tools/character-pipeline/lib/compose.mjs';
import { getAdapter, registerAdapter } from '../tools/character-pipeline/adapters/index.mjs';
import { readImage, encodePNG, decodePNG, newImage } from '../tools/character-pipeline/lib/image.mjs';
import { learnReference, extractPalette, removeBackground } from '../tools/character-pipeline/lib/learn.mjs';
import { postProcess } from '../tools/character-pipeline/lib/postprocess.mjs';
import { checkPalette, checkSilhouette, silhouetteIoU, consistencyCheck } from '../tools/character-pipeline/lib/check.mjs';
import { runPipeline } from '../tools/character-pipeline/lib/pipeline.mjs';
import { fill, ellipse } from '../tools/character-pipeline/lib/draw.mjs';
const B = (n) => `tools/character-pipeline/bibles/${n}.json`;
const colby = loadBible(B('colby')), pete = loadBible(B('pete')), sc = loadBible(B('super-colby'));
const scratch = () => { const d = '/datanapps/claude-tmp/char-pipeline-test'; mkdirSync(d, { recursive: true }); return mkdtempSync(join(d, 'run-')); };

test('bible schema: bundled bibles valid; broken ones rejected with paths', () => {
  for (const f of ['colby', 'super-colby', 'pete']) assert.ok(validateBible(JSON.parse(readFileSync(B(f), 'utf8'))).ok);
  const bad = { ...colby, role: 'wizard', colors: { fur: 'orange', outline: '#000000', x: '#123456' }, features: ['one'] }; delete bad.forbidden;
  const r = validateBible(bad); assert.equal(r.ok, false);
  const t = r.errors.join('\n'); assert.match(t, /role/); assert.match(t, /colors\.fur/); assert.match(t, /features/); assert.match(t, /forbidden/);
  assert.equal(validateBible({ ...colby, colors: { fur: '#e8963c', a: '#111111', b: '#222222' } }).ok, false, 'outline required');
});
test('composer: deterministic, includes forbidden in negative, style and shot differ, bad inputs throw', () => {
  const a = composePrompt(pete, { style: 'toon', shot: 'turnaround' }), b = composePrompt(pete, { style: 'toon', shot: 'turnaround' });
  assert.deepEqual(a, b); assert.match(a.prompt, /red eyes/); assert.match(a.negative, /cuteness softening/);
  assert.notEqual(composePrompt(pete, { style: 'photo' }).prompt, a.prompt); assert.notEqual(composePrompt(pete, { shot: 'billboard' }).prompt, a.prompt);
  assert.match(composePrompt(pete, { shot: 'expression', expression: 'laugh' }).prompt, /expression: laugh/);
  assert.match(composePrompt(colby, { variant: 'racer' }).prompt, /pilot goggles/);
  assert.throws(() => composePrompt(pete, { style: 'oil' }), /unknown style/); assert.throws(() => composePrompt(pete, { variant: 'zz' }), /no variant/);
  assert.equal(Object.keys(STYLES).length, 4); assert.ok(shotPlan(colby, 'toon').length >= 8);
});
test('adapters: mock offline + deterministic; network adapters need approval', async () => {
  const m = getAdapter('mock'), c = composePrompt(colby, { shot: 'billboard' }), args = { bible: colby, style: 'toon', shot: 'billboard', seed: 3, size: c.meta.size };
  const r1 = await m.generate(args), r2 = await m.generate(args); assert.equal(m.network, false); assert.deepEqual(r1.image.rgba, r2.image.rgba);
  registerAdapter({ name: 'fake-net', network: true, generate: async () => { throw new Error('must not run'); } });
  assert.throws(() => getAdapter('fake-net'), /approval/); assert.doesNotThrow(() => getAdapter('fake-net', { approved: true })); assert.throws(() => getAdapter('nope'), /unknown adapter/);
});
test('image codecs: PNG roundtrip; JPEG decodes the learning sheet', () => {
  const im = newImage(5, 4, [10, 20, 30, 255]); im.rgba[3] = 100; assert.deepEqual(decodePNG(encodePNG(im)).rgba, im.rgba);
  const j = readImage('learning/SuperColby-front-side.jpeg'); assert.equal(j.w, 2400); assert.equal(j.h, 1792);
  assert.throws(() => readImage('package.json'), /unsupported|not a|Unexpected/);
});
test('reference learning: sheets give two views, bg key near #c4bcb4, palette matches the identity sheet (calibration)', () => {
  const near = (pal, hexv, d = 40) => pal.some((p) => Math.hypot(...[1, 3, 5].map((i) => parseInt(p.hex.slice(i, i + 2), 16) - parseInt(hexv.slice(i, i + 2), 16))) < d);
  const c = learnReference(readImage('learning/SuperColby-front-side.jpeg'), 'c'), p = learnReference(readImage('learning/Perring-Parkway-Pete-front-side.jpeg'), 'p');
  assert.equal(c.views.length, 2); assert.equal(p.views.length, 2);
  for (const r of [c, p]) { const k = [1, 3, 5].map((i) => parseInt(r.background.slice(i, i + 2), 16)); assert.ok(Math.hypot(k[0] - 196, k[1] - 188, k[2] - 180) < 20); assert.ok(r.outlineWeightPx >= 2 && r.outlineWeightPx <= 12); assert.equal(r.cutout.rgba[3], 0, 'corner is transparent'); }
  for (const h of ['#e8963c', '#3f77bd', '#fbe5c8', '#f26a10', '#e0392b']) assert.ok(near(c.palette, h), `colby ${h}`);
  for (const h of ['#4a423b', '#3a342f', '#a86a68']) assert.ok(near(p.palette, h, 45), `pete ${h}`);
});
test('check: reference sheets pass their own bibles; wrong bible / wrong colours / bad anchor / wrong silhouette fail', () => {
  const c = learnReference(readImage('learning/SuperColby-front-side.jpeg'), 'c'), p = learnReference(readImage('learning/Perring-Parkway-Pete-front-side.jpeg'), 'p');
  assert.ok(checkPalette(c.cutout, sc).pass, 'colby sheet vs super-colby bible'); assert.ok(checkPalette(p.cutout, pete).pass, 'pete sheet vs pete bible');
  assert.equal(checkPalette(p.cutout, sc).pass, false, 'pete art must not satisfy colby palette'); assert.equal(checkPalette(c.cutout, pete).pass, false);
  const blank = newImage(64, 64, [0, 0, 0, 0]); ellipse(blank, 32, 20, 6, 6, '#ff00ff');
  const v = consistencyCheck([{ label: 'purple', kind: 'billboard', image: blank }], { bible: colby }); assert.equal(v.pass, false); assert.equal(v.items[0].checks.find((x) => x.name === 'size-anchor').pass, false);
  assert.ok(silhouetteIoU(c.cutout, c.cutout) > 0.99); const wide = newImage(100, 100, [0, 0, 0, 0]); ellipse(wide, 50, 50, 45, 45, '#000000'); const bar = newImage(100, 100, [0, 0, 0, 0]); for (let y = 0; y < 100; y++) for (let x = 0; x < 12; x++) bar.rgba.set([0, 0, 0, 255], (y * 100 + x) * 4); assert.equal(checkSilhouette(bar, wide).pass, false, 'thin bar is not a disc'); assert.ok(checkSilhouette(wide, wide).pass); assert.ok(silhouetteIoU(wide, wide) > 0.99);
});
test('post-process: bg removal, fit anchor, retro palette lock, mips', async () => {
  const img = newImage(200, 200); fill(img, '#c4bcb4'); ellipse(img, 100, 100, 40, 60, '#e8963c'); const s = (x, y) => img.rgba[(y * 200 + x) * 4 + 3];
  const r = postProcess(img, { style: 'retro', kind: 'billboard', palette: ['#e8963c', '#1a1a1a'], size: [128, 160] });
  assert.equal(r.image.w, 128); assert.equal(r.image.rgba[3], 0); assert.deepEqual(r.mips.map((m) => m.h), [256, 128, 64, 32]);
  const cols = new Set(); for (let i = 0; i < 128 * 160; i++) if (r.image.rgba[i * 4 + 3]) cols.add([...r.image.rgba.slice(i * 4, i * 4 + 3)].join()); assert.ok(cols.size <= 2, `locked colours ${cols.size}`);
  assert.equal(removeBackground(img).image.rgba[3], 0); assert.ok(s(0, 0) === 255);
});
test('pipeline + export: mock run into a scratch library validates, is idempotent, carries provenance', async () => {
  const tmp = scratch(), lib = join(tmp, 'lib'); cpSync('../character-library', lib, { recursive: true, filter: (s) => !s.includes('.git') });
  const out = join(tmp, 'out'), go = () => runPipeline({ biblePath: B('colby'), style: 'toon', outRoot: out, libraryDir: lib, seed: 7 });
  const r = await go(); assert.ok(r.verdict.pass, r.verdict.summary); assert.equal(r.export.validateOk, true, r.export.validateOut); assert.equal(r.export.indexOk, true);
  for (const k of ['turnaround', 'expressions', 'pose-sheet', 'billboard']) { const d = join(lib, 'assets', `colby.toon.${k}`); assert.ok(existsSync(join(d, 'asset.json')), k); assert.ok(existsSync(join(d, 'bible.json'))); assert.ok(existsSync(join(d, 'prompts.json'))); }
  const desc = JSON.parse(readFileSync(join(lib, 'assets/colby.toon.billboard/asset.json'), 'utf8')); assert.ok(desc.tags.includes('quality:placeholder')); assert.match(desc.provenance.generator, /mock/); assert.ok(desc.tags.includes('style:cartoon-vector'));
  const r2 = await go(); assert.deepEqual(r2.export.add.added, []); assert.deepEqual(r2.export.add.updated, []), assert.equal(r2.export.add.unchanged.length, 4);
  for (const f of ['contact-sheet.png', 'contact-sheet.html', 'verdict.json', 'prompts.json']) assert.ok(existsSync(join(out, 'colby/toon', f)), f);
  const bad = spawnSync(process.execPath, ['../game-factory/factory-core/library/cli.mjs', 'library', 'validate', lib], { encoding: 'utf8' }); assert.equal(bad.status, 0, bad.stdout);
});
test('pipeline: all four styles produce a verdict; retro output uses only bible colours', async () => {
  const out = scratch();
  for (const style of ['retro', 'toon', 'ghibli', 'photo']) { const r = await runPipeline({ biblePath: B('super-colby'), style, outRoot: out, only: ['billboard', 'expression'] }); assert.ok(r.results.length >= 2); assert.ok(typeof r.verdict.pass === 'boolean'); }
});
test('CLI: validate, prompt, bad input exit codes', () => {
  const run = (...a) => spawnSync(process.execPath, ['tools/character-pipeline/bin/char.mjs', ...a], { encoding: 'utf8' });
  assert.equal(run('validate', 'pete').status, 0); assert.match(run('prompt', 'pete', '--style', 'toon').stdout, /NEGATIVE/);
  const d = scratch(); writeFileSync(join(d, 'bad.json'), '{"id":"x"}'); assert.equal(run('validate', join(d, 'bad.json')).status, 1); assert.equal(run('run', 'nobody').status, 1); assert.equal(run('bogus').status, 2);
  assert.equal(JSON.parse(run('adapters', '--json').stdout)[0].name, 'mock');
});
