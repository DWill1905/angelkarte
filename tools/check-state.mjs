#!/usr/bin/env node
/* Findet "nackte" State-Referenzen (z.B. `fbMem` statt `state.fbMem`).
   Diese Klasse entstand bei der Modularisierung: im alten Monolithen waren die
   Variablen global, jetzt leben sie im state-Objekt. Ein verpasstes Vorkommen
   (z.B. in Spread-Syntax `[...fbMem]`) crasht erst, wenn der Codepfad läuft. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const jsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js');
const STATE = ['REGIONS','REGION','SPOTS','SCHON','loadToken','fishSel','uferOnly',
  'userPos','userMarker','uidLast','WX','PEGEL','wxKey','fbMem','persistent','fbSaving','active'];
let problems = 0;
for (const f of fs.readdirSync(jsDir).filter(x => x.endsWith('.js') && x !== 'state.js' && !x.startsWith('_'))) {
  const src = fs.readFileSync(path.join(jsDir, f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/\.\.\./g, '   '); /* Spread-Punkte neutralisieren, damit [...fbMem] erkannt wird */
  for (const v of STATE) {
    /* Lookbehind darf Property-Zugriff (`x.fbMem`) ausschließen, aber NICHT Spread (`[...fbMem]`).
       Trick: erst Spread-Punkte neutralisieren, dann prüfen. */
    const re = new RegExp('(?<![\\w.$])' + v + '(?![\\w:])', 'g');
    let m;
    while ((m = re.exec(src))) {
      console.error(`NACKTE STATE-REFERENZ: ${f} nutzt \`${v}\` statt \`state.${v}\``);
      console.error('   ...' + src.slice(Math.max(0, m.index - 30), m.index + v.length + 10).replace(/\s+/g, ' ') + '...');
      problems++;
    }
  }
}
if (problems) { console.error(`\n✖ ${problems} nackte State-Referenz(en) – Live-Crash-Gefahr!`); process.exit(1); }
console.log('✓ Keine nackten State-Referenzen.');
