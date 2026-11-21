// Bible loading + validation (own mini JSON-Schema subset validator: type, required, properties, enum, pattern, items, min*, additionalProperties).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const SCHEMA = JSON.parse(readFileSync(join(HERE, '..', 'character-bible.schema.json'), 'utf8'));
const tOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
export function validateSchema(v, s, path = '$', errs = []) {
  if (s.type && tOf(v) !== s.type) { errs.push(`${path}: expected ${s.type}, got ${tOf(v)}`); return errs; }
  if (s.enum && !s.enum.includes(v)) errs.push(`${path}: ${JSON.stringify(v)} not in [${s.enum.join(', ')}]`);
  if (typeof v === 'string') { if (s.minLength && v.length < s.minLength) errs.push(`${path}: too short`); if (s.pattern && !new RegExp(s.pattern).test(v)) errs.push(`${path}: ${JSON.stringify(v)} does not match ${s.pattern}`); }
  if (typeof v === 'number') { if (s.minimum !== undefined && v < s.minimum) errs.push(`${path}: below ${s.minimum}`); if (s.maximum !== undefined && v > s.maximum) errs.push(`${path}: above ${s.maximum}`); }
  if (Array.isArray(v)) { if (s.minItems && v.length < s.minItems) errs.push(`${path}: needs >= ${s.minItems} items`); if (s.items) v.forEach((x, i) => validateSchema(x, s.items, `${path}[${i}]`, errs)); }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const r of s.required || []) if (!(r in v)) errs.push(`${path}: missing required "${r}"`);
    if (s.minProperties && Object.keys(v).length < s.minProperties) errs.push(`${path}: needs >= ${s.minProperties} properties`);
    for (const [k, x] of Object.entries(v)) { const sub = s.properties?.[k] ?? (typeof s.additionalProperties === 'object' ? s.additionalProperties : null); if (sub) validateSchema(x, sub, `${path}.${k}`, errs); else if (s.additionalProperties === false) errs.push(`${path}: unknown property "${k}"`); }
  }
  return errs;
}
/** Schema plus semantic checks. Returns {ok, errors, warnings}. */
export function validateBible(b) {
  const errors = validateSchema(b, SCHEMA), warnings = [];
  if (!errors.length) {
    const c = b.colors; if (!c.outline) errors.push('$.colors: needs an "outline" colour');
    if (!c.fur && !c.skin && !c.body) errors.push('$.colors: needs one of fur / skin / body');
    const fl = JSON.stringify([b.features, b.outfit, b.props, b.markings, b.mood]).toLowerCase();
    for (const f of b.forbidden) { const w = f.toLowerCase().split(/\W+/).filter((x) => x.length > 4); if (w.length && w.every((x) => fl.includes(x))) warnings.push(`forbidden "${f}" overlaps with described features`); }
    if (!b.expressions?.length) warnings.push('no expressions listed; composer defaults will be used');
  }
  return { ok: !errors.length, errors, warnings };
}
export const loadBible = (path) => { const b = JSON.parse(readFileSync(path, 'utf8')); const r = validateBible(b); if (!r.ok) throw new Error(`bible ${path} invalid:\n  ${r.errors.join('\n  ')}`); return b; };
export const DEFAULT_EXPRESSIONS = ['neutral', 'happy', 'angry', 'surprised', 'determined', 'smug'];
export const DEFAULT_POSES = ['idle', 'run', 'jump', 'celebrate'];
