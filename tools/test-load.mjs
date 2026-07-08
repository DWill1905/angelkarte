#!/usr/bin/env node
/* Echter Ladetest: stellt das LIVE-Verhalten nach (Manifest data/regionen.json ->
   einzelne data/*.json laden) statt nur den eingebetteten Fallback zu prüfen.
   Genau die Lücke, durch die Gießen live unsichtbar war, obwohl der Fallback-Test grün war. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');

const { REGIONS_EMBEDDED } = await import(pathToFileURL(path.join(root, 'js', 'data.js')).href);

let fail = 0;
const c = (ok, msg) => { console.log(' ', ok ? 'OK' : 'FEHLER', msg); if (!ok) fail++; };

/* Ladepfad exakt wie region.js: Manifest -> Dateien */
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'regionen.json'), 'utf8'));
const loaded = manifest.map(f => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')))
  .filter(r => r && r.id && Array.isArray(r.spots));

const loadedIds = loaded.map(r => r.id).sort();
const embeddedIds = REGIONS_EMBEDDED.map(r => r.id).sort();

c(loaded.length === REGIONS_EMBEDDED.length,
  `Live lädt ${loaded.length} Regionen, erwartet ${REGIONS_EMBEDDED.length} (${embeddedIds.join(',')})`);
c(JSON.stringify(loadedIds) === JSON.stringify(embeddedIds),
  `Geladene IDs = eingebettete IDs (live: ${loadedIds.join(',')})`);

/* Jede eingebettete Region muss über den Live-Pfad erreichbar sein */
embeddedIds.forEach(id => {
  c(loadedIds.includes(id), `Region „${id}" über Live-Ladepfad (Manifest) erreichbar`);
});

/* Jede geladene Region hat Spots und Schonzeiten */
loaded.forEach(r => {
  c(r.spots.length > 0 && Array.isArray(r.schon) && r.schon.length > 0,
    `Region „${r.id}" hat Spots (${r.spots.length}) und Schonzeiten`);
});

console.log(fail ? `\n✖ ${fail} FEHLER – Live-Ladepfad weicht vom Soll ab!` : '\n✓ Live-Ladepfad korrekt: alle Regionen über das Manifest erreichbar.');
process.exit(fail ? 1 : 0);
