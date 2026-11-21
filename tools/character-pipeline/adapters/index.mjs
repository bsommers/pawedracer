// Generator adapter interface. An adapter is { name, network:boolean, generate({prompt,negative,refs,seed,shot,size,style,bible}) -> Promise<{image:{w,h,rgba}, model, note?}> }.
// Only the mock adapter ships. Any adapter with network:true is refused unless the caller passes {approved:true}: calling an image service or uploading
// a reference is an outward-facing action that needs the user's explicit approval (build-spec 2.1 constraints).
import { mock } from './mock.mjs';
const ADAPTERS = { mock };
export function registerAdapter(a) { for (const k of ['name', 'generate']) if (!a?.[k]) throw new Error(`adapter missing ${k}`); ADAPTERS[a.name] = a; }
export function getAdapter(name = 'mock', { approved = false } = {}) {
  const a = ADAPTERS[name]; if (!a) throw new Error(`unknown adapter ${name} (have ${Object.keys(ADAPTERS).join(', ')})`);
  if (a.network && !approved) throw new Error(`adapter ${name} uses the network; user approval required (pass approved:true after the user agrees)`);
  return a;
}
export const listAdapters = () => Object.values(ADAPTERS).map((a) => ({ name: a.name, network: !!a.network }));
