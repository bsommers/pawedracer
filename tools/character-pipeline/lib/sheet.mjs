// Contact sheet: PNG grid of cells with a green/red verdict border (no text rendering needed), plus an HTML index with captions and the verdict table.
import { newImage, blit, resize, encodePNG } from './image.mjs';
import { fill, polygon } from './draw.mjs';
export function contactSheet(items, { cell = 220, cols = 4, gap = 8, bg = '#2a2a30' } = {}) {
  const rows = Math.ceil(items.length / cols), W = cols * (cell + gap) + gap, H = rows * (cell + gap) + gap, out = newImage(W, H); fill(out, bg);
  items.forEach((it, i) => { const x = gap + (i % cols) * (cell + gap), y = gap + Math.floor(i / cols) * (cell + gap), edge = it.pass === false ? [214, 60, 60] : it.pass === true ? [70, 180, 90] : [120, 120, 130];
    const box = newImage(cell, cell, [...edge, 255]); blit(out, box, x, y); const inner = newImage(cell - 6, cell - 6, [196, 188, 180, 255]); blit(out, inner, x + 3, y + 3);
    const s = Math.min((cell - 10) / it.image.w, (cell - 10) / it.image.h), r = resize(it.image, Math.max(1, Math.round(it.image.w * s)), Math.max(1, Math.round(it.image.h * s))); blit(out, r, x + Math.round((cell - r.w) / 2), y + Math.round((cell - r.h) / 2)); });
  return out;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function contactHtml(title, sheetPng, verdict, meta = {}) {
  const rows = verdict.items.map((r) => `<tr class="${r.pass ? 'ok' : 'bad'}"><td>${esc(r.label)}</td><td>${r.pass ? 'PASS' : 'FAIL'}</td><td>${r.checks.map((c) => `${esc(c.name)}: ${esc(c.detail)}`).join('<br>')}</td></tr>`).join('');
  return `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:14px system-ui;background:#1d1d22;color:#eee;margin:16px}img{max-width:100%}td{padding:4px 10px;vertical-align:top}.ok td:nth-child(2){color:#6c6}.bad td:nth-child(2){color:#e66}</style><h1>${esc(title)}</h1><p>${esc(verdict.summary)} &middot; overall <b>${verdict.pass ? 'PASS' : 'FAIL'}</b> &middot; ${esc(JSON.stringify(meta))}</p><img src="${sheetPng}" alt="contact sheet"><table>${rows}</table>`;
}
