#!/usr/bin/env node
/* Findet Zirkelimporte, die REIHENFOLGEKRITISCH sind.

   Ein Zyklus allein ist bei ES-Modulen harmlos: solange die importierten Symbole erst
   zur Laufzeit (in Funktionen) benutzt werden, löst der Browser das sauber auf.
   Gefährlich wird es, wenn Modul-Toplevel-Code ein Symbol aus dem Zyklus liest –
   dann ist es beim Ausführen womöglich noch undefined. Genau diese Klasse meldet dieses Tool. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const dateien = fs.readdirSync(SRC).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'));

const importe = {};
const quelle = {};
for (const f of dateien) {
  const name = f.replace('.ts', '');
  const t = fs.readFileSync(path.join(SRC, f), 'utf8');
  quelle[name] = t;
  importe[name] = [...t.matchAll(/from '\.\/([a-z]+)\.js'/g)].map((m) => m[1]);
}

/* Zyklen finden */
const zyklen = [];
function suche(start, pfad, besucht) {
  if (pfad.includes(start)) { zyklen.push([...pfad.slice(pfad.indexOf(start)), start]); return; }
  if (besucht.has(start)) return;
  besucht.add(start);
  (importe[start] || []).forEach((n) => suche(n, [...pfad, start], besucht));
}
Object.keys(importe).forEach((m) => suche(m, [], new Set()));

const beteiligt = new Set(zyklen.flat());
if (!beteiligt.size) { console.log('✓ Keine Zirkelimporte.'); process.exit(0); }

/* Für jedes beteiligte Modul: Toplevel-Nutzung von Zyklus-Symbolen? */
let kritisch = 0;
for (const m of beteiligt) {
  const src = quelle[m];
  const symbole = new Set();
  for (const im of src.matchAll(/import \{([^}]*)\} from '\.\/([a-z]+)\.js'/g)) {
    if (beteiligt.has(im[2])) im[1].split(',').forEach((x) => symbole.add(x.trim().split(/\s+as\s+/).pop()));
  }
  if (!symbole.size) continue;

  /* Nur WERTE sind gefährlich: `export function` wird gehoistet und ist im Zyklus verfügbar,
     `export const/let` unterliegt der Temporal Dead Zone und kann undefined sein. */
  const istWert = (sym) => [...beteiligt].some((andere) => {
    if (andere === m) return false;
    return new RegExp('export\\s+(?:const|let|var)\\s+' + sym + '\\b').test(quelle[andere] || '');
  });

  let tiefe = 0;
  src.split('\n').forEach((z, i) => {
    const top = tiefe === 0;
    const istImport = /^\s*(import|export\s+(interface|type)|\/\*|\*|\/\/|})/.test(z);
    /* Nutzung in einem Callback (Pfeilfunktion/function) läuft erst nach dem Laden. */
    const inCallback = /=>|function\s*\(/.test(z);
    /* Bei einer Deklaration zählt nur die rechte Seite: `const x = zyklusWert.foo` ist gefährlich,
       `export const zyklusWert = …` (die Deklaration selbst) nicht. */
    const gleich = z.indexOf('=');
    const pruefteil = /^\s*(export\s+)?(const|let|var|function)\b/.test(z)
      ? (gleich >= 0 ? z.slice(gleich + 1) : '')
      : z;
    if (top && !istImport && !inCallback && pruefteil.trim()) {
      symbole.forEach((sym) => {
        if (!istWert(sym)) return;
        if (new RegExp('\\b' + sym + '\\b').test(pruefteil)) {
          console.error(`✖ ${m}.ts:${i + 1} liest den Wert "${sym}" aus einem Zirkelimport auf Toplevel-Ebene:`);
          console.error('   ' + z.trim().slice(0, 90));
          console.error('   → Beim Laden womöglich noch undefined (Temporal Dead Zone).');
          kritisch++;
        }
      });
    }
    tiefe += (z.match(/\{/g) || []).length - (z.match(/\}/g) || []).length;
  });
}

console.log('Zirkelimporte gefunden: ' + [...new Set(zyklen.map((z) => z.join(' → ')))].join(' | '));
if (kritisch) {
  console.error(`\n✖ ${kritisch} reihenfolgekritische Nutzung(en) – beim Laden womöglich undefined.`);
  process.exit(1);
}
console.log('✓ Alle Zyklen unkritisch (nur Nutzung innerhalb von Funktionen).');
