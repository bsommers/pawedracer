"""Local SDXL (+ optional IP-Adapter) generator. Runs fully on this machine; only model weights are downloaded from Hugging Face (nothing is uploaded).
Usage: sdxl_gen.py --prompt P --negative N --out out.png --seed 1 --w 1024 --h 1024 [--ref img ...] [--ref-scale 0.6] [--steps 30]
Env: PR_SDXL_MODEL (default stabilityai/stable-diffusion-xl-base-1.0), HIP_VISIBLE_DEVICES (R9700 = 1 on this box)."""
import argparse, os, sys
ap = argparse.ArgumentParser()
ap.add_argument('--prompt', required=True); ap.add_argument('--negative', default='')
ap.add_argument('--out', required=True); ap.add_argument('--seed', type=int, default=1)
ap.add_argument('--w', type=int, default=1024); ap.add_argument('--h', type=int, default=1024)
ap.add_argument('--ref', action='append', default=[]); ap.add_argument('--ref-scale', type=float, default=0.6)
ap.add_argument('--steps', type=int, default=30); ap.add_argument('--cfg', type=float, default=6.5)
a = ap.parse_args()
import torch
from diffusers import StableDiffusionXLPipeline
from PIL import Image
dev = 'cuda' if torch.cuda.is_available() else 'cpu'
dt = torch.float16 if dev == 'cuda' else torch.float32
pipe = StableDiffusionXLPipeline.from_pretrained(os.environ.get('PR_SDXL_MODEL', 'stabilityai/stable-diffusion-xl-base-1.0'), torch_dtype=dt, use_safetensors=True).to(dev)
kw = {}
if a.ref:
    pipe.load_ip_adapter('h94/IP-Adapter', subfolder='sdxl_models', weight_name='ip-adapter_sdxl.safetensors')
    pipe.set_ip_adapter_scale(a.ref_scale)
    kw['ip_adapter_image'] = Image.open(a.ref[0]).convert('RGB')
g = torch.Generator(device='cpu').manual_seed(a.seed)
img = pipe(prompt=a.prompt, negative_prompt=a.negative, width=a.w, height=a.h, num_inference_steps=a.steps, guidance_scale=a.cfg, generator=g, **kw).images[0]
img.save(a.out); print('OK', a.out, dev, file=sys.stderr)
