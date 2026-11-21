import { encodePNG, resize } from './image.mjs';
/** Preview PNG (max 256px side) as {path,data} for the library descriptor. */
export function previewFile(img, path) { const s = Math.min(1, 256 / Math.max(img.w, img.h)); return { path, data: encodePNG(s < 1 ? resize(img, Math.round(img.w * s), Math.round(img.h * s)) : img) }; }
