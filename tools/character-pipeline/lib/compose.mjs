// Prompt composer: bible + style + shot -> {prompt, negative, meta}. Deterministic (no clock, no randomness); versioned.
import { DEFAULT_EXPRESSIONS, DEFAULT_POSES } from './bible.mjs';
import { createHash } from 'node:crypto';
export const COMPOSER_VERSION = '1.0.0';
export const STYLES = Object.freeze({
  retro: { label: 'retro pixel art', text: '16-bit pixel art sprite, limited palette, hard pixel edges, no anti-aliasing, dithering allowed', neg: ['smooth gradients', 'photographic', 'blur', 'anti-aliased edges'] },
  toon: { label: 'toon cartoon vector', text: 'clean uniform near-black outline, closed shapes, flat cel fills with one soft shade tone, a few hard-edged accent strokes, chubby readable proportions, no gradients on the character', neg: ['photorealistic', 'painterly', 'gradients on character', 'sketchy lines', 'text watermark'] },
  ghibli: { label: 'hand-painted animation', text: 'soft hand-painted animation-film look, gentle watercolour backgrounds, warm natural light, thin soft outlines, expressive eyes', neg: ['photorealistic', 'harsh black outline', 'pixelated', 'cgi plastic look'] },
  photo: { label: 'photorealistic', text: 'photorealistic studio render, real fur and fabric detail, soft key light, shallow depth of field, accurate anatomy of the described species', neg: ['cartoon outline', 'flat colour', 'pixelated', 'extra limbs', 'text watermark'] },
});
export const SHOTS = Object.freeze({
  turnaround: { text: 'character turnaround sheet: front view and side view side by side, same height, feet on a shared baseline, plain flat warm grey background, captions "Front View" and "Side View"', size: [1200, 896] },
  expression: { text: 'head-and-shoulders expression study, plain flat background', size: [512, 512] },
  pose: { text: 'full-body pose, plain flat background, feet visible', size: [512, 640] },
  billboard: { text: 'single full-body sprite facing the viewer, centred, plain flat background, readable at 64 pixels tall', size: [256, 320] },
});
const list = (a) => (a && a.length ? a.join('; ') : '');
const NAMED = (c) => Object.entries(c).filter(([k]) => k !== 'outline').map(([k, v]) => `${k} ${v}`).join(', ');
/** opts: {style, shot, expression?, pose?, variant?} */
export function composePrompt(bible, { style = 'toon', shot = 'turnaround', expression, pose, variant } = {}) {
  const S = STYLES[style], H = SHOTS[shot];
  if (!S) throw new Error(`unknown style ${style} (have ${Object.keys(STYLES).join(', ')})`);
  if (!H) throw new Error(`unknown shot ${shot} (have ${Object.keys(SHOTS).join(', ')})`);
  const v = variant ? (bible.variants || []).find((x) => x.id === variant) : null;
  if (variant && !v) throw new Error(`bible ${bible.id} has no variant ${variant}`);
  const parts = [
    `${bible.name}, a ${bible.species}, ${bible.role} character, ${bible.build}`,
    bible.personality && `personality: ${bible.personality}`,
    `mood: ${bible.mood}`,
    `colours: ${NAMED(bible.colors)}; outline ${bible.colors.outline}`,
    list(bible.markings) && `markings: ${list(bible.markings)}`,
    list(bible.outfit) && `wearing: ${list(bible.outfit)}`,
    list(bible.props) && `props: ${list(bible.props)}`,
    `must keep: ${list(bible.features)}`,
    v && `variant "${v.id}": ${v.note}`,
    shot === 'expression' && `expression: ${expression || DEFAULT_EXPRESSIONS[0]}`,
    shot === 'pose' && `pose: ${pose || DEFAULT_POSES[0]}`,
    `shot: ${H.text}`,
    `style: ${S.text}`,
  ].filter(Boolean);
  const prompt = parts.join('. ') + '.';
  const negative = [...bible.forbidden, ...S.neg, 'deformed', 'extra fingers', 'inconsistent colours', 'cropped', 'text artefacts'].join(', ');
  const meta = { composer: COMPOSER_VERSION, bible: bible.id, style, shot, expression: expression || null, pose: pose || null, variant: variant || null, size: H.size, bibleHash: hashOf(bible), promptHash: hashOf(prompt + '\n' + negative) };
  return { prompt, negative, meta };
}
export function hashOf(x) { return createHash('sha256').update(typeof x === 'string' ? x : stable(x)).digest('hex').slice(0, 16); }
export function stable(x) { return JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((q) => [q, v[q]])) : v)); }
/** The full shot list a bible implies for one style. */
export function shotPlan(bible, style) {
  const plan = [{ shot: 'turnaround' }, { shot: 'billboard' }];
  for (const e of bible.expressions?.length ? bible.expressions : DEFAULT_EXPRESSIONS) plan.push({ shot: 'expression', expression: e });
  for (const p of bible.poses?.length ? bible.poses : DEFAULT_POSES) plan.push({ shot: 'pose', pose: p });
  return plan.map((s) => ({ ...s, style }));
}
