// Toon pack entry. The registry loads index.js first, then pods/chars/scenery/hazards/backdrop/fx (each exports build(kit, opts)).
// Nothing to build here; exports the style id and a combined helper for tools/tests.
export const STYLE = 'toon';
export function build() { return {}; }
export async function buildAll() {
  const out = {};
  for (const m of ['pods', 'chars', 'scenery', 'hazards', 'backdrop', 'fx']) Object.assign(out, (await import(`./${m}.js`)).build());
  return out;
}
