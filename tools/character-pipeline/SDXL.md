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

## Pete and pods (attempted 2026-11-21): NOT usable yet
- Pete (`bibles/pete.json`): expressions (snarl/sneer/laugh/angry) came out as a single rat and pass the checks, but every billboard attempt (up to 8 seeds, ref scale 0.2-0.4) rendered two rats side by side, copying his two-view reference sheet. The "pass" results for earlier seeds were false positives (collage with high silhouette overlap).
- Pods (`bibles/pod-*.json`, new vehicle prompt in `compose.mjs`): output is abstract panel patterns, not a pod. The checks still print PASS because, with no reference silhouette, only palette and size/anchor are tested; they cannot detect a non-pod. Do not trust a PASS on pods.
- Ideas, in order: (1) feed the project's own toon pod sprite (src/art/toon) as the IP-Adapter reference or an img2img/ControlNet structure guide; (2) a vehicle/product-capable checkpoint via `PR_SDXL_MODEL`; (3) crop Pete's reference to one view before passing it; (4) add a vision-based "is this a pod / one subject" check to the pipeline.
