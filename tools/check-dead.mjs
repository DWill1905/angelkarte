#!/usr/bin/env node
/* Findet ECHTEN toten Code: exportierte Symbole, die weder in einem anderen Modul
   importiert, noch in den Tests, noch im HTML (inline onclick) noch modulintern benutzt werden.

   Bewusst NICHT gemeldet: Symbole, die nur unnötig exportiert sind, aber intern verwendet werden.
   Davon gibt es viele (Überbleibsel der Modularisierung) – sie sind Rauschen, kein Fehler. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

const dateien = fs.readdirSync(SRC).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));
const quelle = {};
dateien.forEach((f) => { quelle[f.replace('.ts', '')] = fs.readFileSync(path.join(SRC, f), 'utf8'); });

const tests = fs.existsSync(path.join(ROOT, 'tests'))
  ? fs.readdirSync(path.join(ROOT, 'tests')).map((f) => fs.readFileSync(path.join(ROOT, 'tests', f), 'utf8')).join('\n')
  : '';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const tot = [];
let unnoetigExportiert = 0;

for (const [mod, src] of Object.entries(quelle)) {
  const exporte = [...src.matchAll(/^export (?:async )?(?:function|const|let) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  for (const sym of exporte) {
    const w = (s) => new RegExp('\\b' + sym + '\\b').test(s);
    const importiert = Object.entries(quelle).some(([m2, s2]) => m2 !== mod && new RegExp('import[^;]*\\b' + sym + '\\b[^;]*from').test(s2));
    const imTest = w(tests);
    const alsWindow = new RegExp('window\\.\\w+\\s*=\\s*' + sym).test(src);
    const imHtml = new RegExp('\\b' + sym + '\\(').test(html);
    if (importiert || imTest || alsWindow || imHtml) continue;

    const treffer = [...src.matchAll(new RegExp('\\b' + sym + '\\b', 'g'))].length;
    const deklarationen = [...src.matchAll(new RegExp('^export (?:async )?(?:function|const|let) ' + sym + '\\b', 'gm'))].length;
    if (treffer - deklarationen > 0) { unnoetigExportiert++; continue; }
    tot.push(`${mod}.ts: ${sym}`);
  }
}

console.log(`Unnötig exportiert (intern genutzt, kein Fehler): ${unnoetigExportiert}`);
if (tot.length) {
  console.error('\n✖ Toter Code – exportiert, aber nirgends verwendet:');
  tot.forEach((t) => console.error('   ' + t));
  process.exit(1);
}
console.log('✓ Kein toter Code.');
