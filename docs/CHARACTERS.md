# Characters: from text to library assets

Tooling in `tools/character-pipeline/` (zero dependencies, Node 22+, offline). Library: `../character-library/` (GitHub `bsommers/character-library@main`, planned, not published).

```
bible.json --validate--> compose prompt --adapter--> raw art --post-process--> consistency check --> contact sheet --> export (library add/validate/index)
 (schema)    (style x shot)  (mock only)   (bg key, trim,      (palette, size/anchor,     (PNG + HTML,       <character>.<style>.<kind>
                                            fit, lock, grade)   silhouette)               green/red)
```

## Commands (`node tools/character-pipeline/bin/char.mjs ...`, every command takes `--json`)
| Command | What |
|---|---|
| `validate <bible>` | schema + semantic check (outline colour, fur/skin/body, forbidden vs features) |
| `prompt <bible> --style toon --shot turnaround [--expression e] [--pose p] [--variant v]` | prints prompt, negative prompt, meta (versions and hashes) |
| `learn <image> --out dir` | bg key, cutout, view split, outline weight, dominant palette -> `identity.json`, `cutout.png` |
| `run <bible> --style toon [--library ../character-library] [--only turnaround,billboard]` | whole pipeline for one character |
| `all --style toon --library ../character-library` | every bundled bible |

Bundled bibles (`tools/character-pipeline/bibles/`): `colby`, `super-colby`, `pete`. Styles: `retro`, `toon`, `ghibli`, `photo`. Shots: `turnaround`, `expression`, `pose`, `billboard` (with mips 256/128/64/32).

## Bible
`character-bible.schema.json`. Required: `id name species role build colors{fur|skin|body, outline, >=3} features(>=2) mood forbidden(>=1)`. Optional: markings, outfit, props, personality, expressions, poses, variants, references, heightHeads. Free text feeds the composer; `colors` also drives the consistency check and the retro palette lock.

## Adapters and approval
`adapters/index.mjs`: `{name, network, generate({prompt,negative,refs,seed,shot,size,style,bible}) -> {image,model}}`. Only `mock` ships: a deterministic procedural drawing from the bible, tagged `quality:placeholder` in the library. A `network:true` adapter is refused unless `approved:true`; reference images are passed to such an adapter only (never to the mock). **No external service has been called and nothing was uploaded.** Real art needs the user's approval (ARCHITECTURE section 9 question 1).

## Consistency check (calibrated on the two learning sheets)
Palette: >= 60% of bible colours present within RGB distance 60 AND >= 75% of opaque pixels near a bible colour (the sheets score 0.85 and 0.99 against their own bibles; swapped bibles score 0.46 and 0.34). Size/anchor: height fill 0.45-0.99, feet low, centred. Silhouette (billboards): IoU >= 0.5 against the reference front view plus aspect ratio within x1.55. Verdicts are stored in `verdict.json` beside the asset.

## Library layout per asset
`<character>.<style>.<kind>/` with `<kind>.png`, `preview.png`, `bible.json`, `prompts.json` (prompt, negative, versions, seeds, model), `verdict.json`, billboards also `mips.png`. Tags: `character:<id> role:<r> style:<factory style id> species:<s> generator:<adapter>`.

## Limits
JPEG: baseline only (progressive throws a clear error). PNG: 8-bit, non-interlaced. Mock art is a placeholder: the Pete mock fails the silhouette check against the real sheet by design of the check (see report).
