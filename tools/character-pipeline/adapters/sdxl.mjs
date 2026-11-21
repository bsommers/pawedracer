// Local SDXL adapter (photoreal style). Runs a Python subprocess on this machine's GPU; references are read from disk and never uploaded.
// network:false (only public model weights are fetched from Hugging Face on first use); local:true so the pipeline passes bible references to it.
// Config: PR_SDXL_PY (python with torch+diffusers; default /datanapps/venvs/pawedracer-sdxl/bin/python), HIP_VISIBLE_DEVICES (default 1), PR_SDXL_STEPS, PR_SDXL_REF_SCALE.
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeImage } from '../lib/image.mjs';
const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'py', 'sdxl_gen.py');
export const sdxl = {
  name: 'sdxl', network: false, local: true,
  async generate({ prompt, negative = '', refs = [], seed = 1, size }) {
    const py = process.env.PR_SDXL_PY || '/datanapps/venvs/pawedracer-sdxl/bin/python';
    const [w, h] = Array.isArray(size) ? size : [size?.w || 1024, size?.h || 1024];
    const snap = (n) => Math.max(512, Math.round(n / 64) * 64);
    const dir = mkdtempSync(join(process.env.CLAUDE_CODE_TMPDIR || tmpdir(), 'sdxl-')), out = join(dir, 'o.png');
    const args = [SCRIPT, '--prompt', prompt, '--negative', negative, '--out', out, '--seed', String(seed), '--w', String(snap(w)), '--h', String(snap(h)), '--steps', process.env.PR_SDXL_STEPS || '30', '--ref-scale', process.env.PR_SDXL_REF_SCALE || '0.6'];
    for (const r of refs.slice(0, 1)) args.push('--ref', resolve(r));
    const r = spawnSync(py, args, { encoding: 'utf8', env: { HIP_VISIBLE_DEVICES: '1', ...process.env }, maxBuffer: 1 << 26 });
    if (r.status !== 0) { rmSync(dir, { recursive: true, force: true }); throw new Error(`sdxl failed: ${(r.stderr || '').split('\n').slice(-6).join(' | ')}`); }
    const image = decodeImage(readFileSync(out)); rmSync(dir, { recursive: true, force: true });
    return { image, model: process.env.PR_SDXL_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0', note: refs.length ? 'ip-adapter ref' : 'text only' };
  },
};
