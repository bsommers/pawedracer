# Identity sheets (read from the supplied reference graphics)

Sources: `SuperColby-front-side.jpeg`, `Perring-Parkway-Pete-front-side.jpeg` (2400x1792 each, front + side turnaround on a warm grey #c4bcb4 background, "Front View" / "Side View" captions). Originals are never modified. Copies live in `~/src/fun/character-library/` (the library's seed sources).

## Shared house style ("toon" visual mode)
- Clean uniform near-black outline (about 3-4 px at 2400 px), closed shapes, slightly thicker on the silhouette.
- Flat cel fills with one soft shade tone and a few hard-edged accent strokes (stripes, fur tufts). No gradients on the characters; gentle gradient only on backgrounds.
- Saturated, readable colour blocks; the villain is desaturated and grimy, the hero is bright.
- Turnaround layout: front and side view, same height, feet on a shared baseline, captioned.
- Proportions: chubby, round, readable at small size (hero); gaunt, hunched, long-limbed (villain).

## Super Colby (hero, superhero variant of Colby)
- Chubby orange tabby, standing upright; round head, pink inner ears, big green eyes (#9bc04a-ish), small pink nose, cream muzzle and chest-belly patch, cream paws and foot tips, darker orange tabby stripes on forehead, cheeks, legs, belly flanks, ringed tail with a cream tip.
- Outfit: long-sleeved blue shirt (#3f77bd) with a red-and-yellow shield and a stylised letter "C" (original emblem; keep it a "C", not any existing logo), bright orange cape (#f26a10) with darker inner lining, no pants.
- Palette: fur #e8963c, stripes #c76a1f, cream #fbe5c8, blue #3f77bd, red #e0392b, yellow #f4d12e, cape #f26a10, outline #1a1a1a, eyes #8fc04a.
- Personality: cheerful, smug, heroic. For the racer: pilot goggles and the red scarf may be added on top of the identity; the stripes, belly patch, C emblem and cape colours are the recognisable core.

## Perring Parkway Pete (villain)
- Gaunt, hunched, feral dark-brown/charcoal rat (#4a423b body, #3a342f shadow), mangy tufted fur, pink-mauve ears (#a86a68), pink nose, long whiskers, glowing **red eyes** (#e0262e), buck teeth, snarling open mouth with white foam drool, pink clawed hands and feet, long scaly pink tail with ring ridges.
- Gear: dark scrap-plate chest armour/harness with shoulder straps (#3b3d3a), torn belly fur.
- Mood: menacing and rabid, more brutal than the earlier "pinstripes-and-sunglasses" Pete. For Pawed Racer, treat this as canonical Pete; the pinstripes/shades gag can return as a comedic racing-suit overlay (decision for the design agent, flagged in the bible as `variants`).
- Silhouette cues: hunched back, long pointed muzzle, huge round ears, long curling tail.

## Style tooling notes
- Extraction targets for the character pipeline: palette, outline weight, shading style, proportions, signature features, per-view anchor points.
- Both sheets have no transparent background; background removal (flat colour key #c4bcb4 plus feathered edge) is the first post-process step.
