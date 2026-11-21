# Local SDXL adapter (photo style)

Generates character art on this machine's GPU; references are read from disk and never uploaded. Only public model weights are downloaded from Hugging Face on first use (~14 GB in `HF_HOME`).

Setup (AMD ROCm; used on a Radeon AI PRO R9700):
```
uv venv --python 3.12 /datanapps/venvs/pawedracer-sdxl
uv pip install -p /datanapps/venvs/pawedracer-sdxl/bin/python --index-url https://download.pytorch.org/whl/rocm7.0 torch torchvision
uv pip install -p /datanapps/venvs/pawedracer-sdxl/bin/python diffusers transformers accelerate safetensors pillow numpy
# re-run the first command's torch line afterwards if pip pulled a CUDA torch over it
```
Run: `HF_HOME=/datanapps/cache/huggingface HIP_VISIBLE_DEVICES=1 node tools/character-pipeline/bin/char.mjs run tools/character-pipeline/bibles/super-colby.json --style photo --adapter sdxl --only billboard --out out/char-sdxl`

Config: `PR_SDXL_PY`, `PR_SDXL_MODEL`, `PR_SDXL_STEPS`, `PR_SDXL_REF_SCALE`, `HIP_VISIBLE_DEVICES` (default 1).

Status (MVP): text+reference generation works end to end through post-process and checks. First Colby billboard: silhouette IoU 0.57 (passes), aspect ratio and palette checks fail; background cut-out leaves a grey box. Next: background matting, palette-locked prompts, more seeds.
