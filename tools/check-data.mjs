#!/usr/bin/env node
/* Prüft, ob data/*.json bit-genau zu REGIONS_EMBEDDED in js/data.js passen.
   Exit 1 bei Drift. Aufruf: node tools/check-data.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const { REGIONS_EMBEDDED } = await import(pathToFileURL(path.join(root, 'js', 'data.js')).href);

let drift = 0;
REGIONS_EMBEDDED.forEach(r => {
  const f = path.join(root, 'data', r.id + '.json');
  const disk = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  const want = JSON.stringify(JSON.parse(JSON.stringify(r)), null, 1);
  if (disk !== want) { drift++; console.error('DRIFT:', r.id); }
});
if (drift) { console.error(drift + ' Region(en) driften – tools/gen-data.mjs ausführen!'); process.exit(1); }
console.log('Datenbank konsistent (' + REGIONS_EMBEDDED.length + ' Regionen).');
