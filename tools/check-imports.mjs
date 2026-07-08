#!/usr/bin/env node
/* Statische Analyse: findet Symbole, die ein Modul benutzt, aber weder lokal definiert
   noch importiert – obwohl ein anderes Modul sie exportiert. Genau der esc-in-map-Bug:
   im Monolithen global, nach Modularisierung ein latenter Laufzeit-Crash.
   Exit 1 bei Fund. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.join(__dirname, '..', 'js');

const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.startsWith('_'));

/* Browser-/Standard-Globals, die kein Import brauchen */
const GLOBALS = new Set([
  'window','document','navigator','location','localStorage','console','fetch','L',
  'Math','JSON','Date','Array','Object','String','Number','Boolean','RegExp','Map','Set',
  'Promise','parseInt','parseFloat','isNaN','isFinite','setTimeout','setInterval','clearTimeout',
  'clearInterval','encodeURIComponent','decodeURIComponent','Intl','Error','undefined','null',
  'true','false','NaN','Infinity','requestAnimationFrame','addEventListener','removeEventListener',
  'CustomEvent','Event','structuredClone','URL','URLSearchParams','AbortController','crypto',
  'prompt','alert','confirm','matchMedia','getComputedStyle','history','screen','performance',
  'arguments','this','function','return','const','let','var','if','else','for','while','switch',
  'case','break','continue','new','typeof','instanceof','in','of','delete','void','yield','await',
  'async','try','catch','finally','throw','class','extends','super','import','export','default','from',
]);

/* Pro Modul: definierte + importierte Namen und referenzierte Identifier */
const defined = {}, imported = {}, exportsOf = {};
const srcOf = {};
for (const f of files) {
  const src = fs.readFileSync(path.join(jsDir, f), 'utf8');
  srcOf[f] = src;
  const defs = new Set();
  // top-level + verschachtelte function/const/let/var-Deklarationen und function-Parameter grob
  for (const m of src.matchAll(/\b(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
  for (const m of src.matchAll(/\bfunction\s+[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g))
    m[1].split(',').forEach(p => { const n = p.trim().split(/[=\s]/)[0].replace(/[{}.]/g,''); if (n) defs.add(n); });
  // Arrow-Parameter & catch-Parameter grob
  for (const m of src.matchAll(/\(([^)]*)\)\s*=>/g))
    m[1].split(',').forEach(p => { const n = p.trim().split(/[=:\s]/)[0].replace(/[{}.[\]]/g,''); if (n && /^[A-Za-z_$]/.test(n)) defs.add(n); });
  for (const m of src.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g)) defs.add(m[1]);
  defined[f] = defs;
  const imp = new Set();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from/g))
    m[1].split(',').forEach(x => { const n = x.trim().split(/\s+as\s+/).pop().trim(); if (n) imp.add(n); });
  imported[f] = imp;
  const exp = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) exp.add(m[1]);
  exportsOf[f] = exp;
}
/* Symbol -> exportierendes Modul */
const owner = {};
for (const f of files) for (const s of exportsOf[f]) if (!(s in owner)) owner[s] = f;

let problems = 0;
for (const f of files) {
  const src = srcOf[f];
  const seen = new Set();
  // Strings/Kommentare grob entfernen, um Treffer in Textliteralen zu vermeiden
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`((?:\\.|[^`\\])*)`/g, (mm, inner) => {
      // ${...}-Ausdrücke behalten, Text dazwischen verwerfen
      const exprs = [];
      inner.replace(/\$\{([\s\S]*?)\}/g, (x, e) => { exprs.push(e); return ''; });
      return '`' + exprs.join(';') + '`';
    });
  for (const m of code.matchAll(/(?<![\w.$])([A-Za-z_$][\w$]*)/g)) {
    const name = m[1];
    // Objekt-Key? (Identifier direkt gefolgt von ':' – aber nicht Ternary '? x :')
    const after = code.slice(m.index + name.length);
    if (/^\s*:/.test(after)) {
      // ausschließen, wenn davor kein '?' steht (dann wäre es Ternary-Wert, kein Key)
      const before = code.slice(Math.max(0, m.index - 40), m.index);
      if (!/\?[^?:]*$/.test(before)) continue;
    }
    if (seen.has(name)) continue; seen.add(name);
    if (GLOBALS.has(name)) continue;
    if (defined[f].has(name)) continue;
    if (imported[f].has(name)) continue;
    if (name === 'state' || name === 'store') continue;
    if (owner[name] && owner[name] !== f) {
      console.error(`FEHLENDER IMPORT: ${f} nutzt ${name} – exportiert von ${owner[name]}, aber nicht importiert`);
      problems++;
    }
  }
}
if (problems) { console.error(`\n✖ ${problems} fehlende(r) modulübergreifende(r) Import(e) – Live-Crash-Gefahr!`); process.exit(1); }
console.log('✓ Keine fehlenden modulübergreifenden Importe gefunden.');
