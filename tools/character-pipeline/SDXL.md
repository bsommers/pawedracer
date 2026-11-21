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

Status (MVP): the Super Colby billboard now passes all checks (silhouette IoU 0.71, aspect 0.83, palette 75% on-palette, which is exactly the bar) using
`PR_SDXL_REF_SCALE=0.4 ... --tries 4` (best of 4 seeds, scored by checks + IoU + on-palette share). Added: gradient-tolerant `floodMatte` background removal (photo style),
a cropped front-view reference passed to the generator, and flat-background prompts.
Known limits: the look is still cartoon-like, not photographic (the reference photos are cartoons and base SDXL follows them); try a photoreal checkpoint via `PR_SDXL_MODEL`
and lower `PR_SDXL_REF_SCALE`. Each try reloads the model (about 15 s overhead). Only Colby billboard verified; Pete, pods and drivers not yet generated.
