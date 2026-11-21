# char-pipeline report

## What I built
- `tools/character-pipeline/`: `character-bible.schema.json` + `lib/bible.mjs` (own schema-subset validator, semantic checks); `lib/compose.mjs` (deterministic versioned prompt+negative, 4 styles x 4 shots, variants, expression/pose); `adapters/` (interface, registry with an approval gate for network adapters, offline procedural `mock`); `lib/jpeg.mjs` + `lib/image.mjs` + `lib/draw.mjs` (zero-dep baseline JPEG decoder, PNG codec, resize, rasteriser); `lib/learn.mjs` (palette, bg key + feathered removal + blob clean-up, view split, outline weight, identity sheet); `lib/postprocess.mjs` (trim, fit/anchor, retro palette lock, photo grade, mips); `lib/check.mjs` (palette, size/anchor, silhouette); `lib/sheet.mjs` (contact sheet PNG + HTML); `lib/export.mjs` + `lib/pipeline.mjs`; CLI `bin/char.mjs`; bibles for colby, super-colby, pete.
- `test/char-pipeline.test.mjs` (10 tests), `docs/CHARACTERS.md`.
- 12 mock assets exported to `../character-library` (`colby|super-colby|perring-parkway-pete . toon . turnaround|expressions|pose-sheet|billboard`), tagged `quality:placeholder`, library validates.
- Factory proposal P-004 staged in `../game-factory/proposed/pawedracer/new/char-pipeline/` (+ CHANGELOG entry).

## Verification evidence
- `node --test test/char-pipeline.test.mjs`: 10 pass, 0 fail. Includes negative cases (broken bible, unapproved network adapter, swapped-bible palette, purple blob, thin bar silhouette, bad CLI input) and idempotent re-export (second run: 0 added, 4 unchanged).
- JPEG decode of both 2400x1792 sheets ~0.35 s, visually checked; cutouts keep both views, captions dropped. Calibration: sheet palettes within 25 RGB of the identity-sheet hexes.
- `factory library validate ../character-library` -> OK after export; `char.mjs all --style toon` run end to end; contact sheets viewed.
- Mock under all 4 styles runs (test) but only toon was looked at.

## Deviations from the contract
- Export calls `library/ops.mjs addItems` directly (read-only import) for the add step; `validate` and `index` go through the real `cli.mjs`. Reason: the CLI cannot receive file buffers on argv.
- Role appendix says stage under `proposed/pawgger/`; the task text says `proposed/pawedracer/new/`. I used pawedracer (matches the existing CHANGELOG-PAWEDRACER.md).
- Retro/ghibli/photo mock styles are crude filters, not real style renders.

## Mistakes I made and how I fixed them
- First palette check passed Colby art against Pete's bible (only checked bible-to-image direction). Added pixel on-palette coverage, calibrated 0.75 on the sheets.
- Silhouette IoU alone could not tell a bar from a disc (bbox normalisation); added aspect-ratio test.
- Mock expression shots were cropped giant heads; rescaled.
- Mock Pete still fails the billboard silhouette check (IoU 0.30-0.38 vs the real gaunt rat). Left as an honest FAIL recorded in its `verdict.json`.

## Learnings for a future agent
- Keep bg key from the border median; JPEG noise means the key was #c9c2ba not #c4bcb4, so thresholds must be tolerant (14/34).
- Check both directions for palette (bible in image, image in bible).
- Real art needs approval first; plug an adapter in via `registerAdapter` and pass `approved:true`.

## Requests for other modules
- Factory: a `library.addFiles` capability or `--files-json` for `library add` (see P-004). Library: `pixbuf` untouched. none for game modules.

## Factory proposals
P-004 char-pipeline (staged, see above).
