#!/usr/bin/env node
/* Regeneriert data/*.json + regionen.json aus REGIONS_EMBEDDED in js/data.js.
   Nutzt direkten ES-Modul-Import statt Regex-Parsing (robuster). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const dataUrl = pathToFileURL(path.join(root, 'js', 'data.js')).href;
const { REGIONS_EMBEDDED } = await import(dataUrl);

REGIONS_EMBEDDED.forEach(r =>
  fs.writeFileSync(path.join(root, 'data', r.id + '.json'),
    JSON.stringify(JSON.parse(JSON.stringify(r)), null, 1)));
fs.writeFileSync(path.join(root, 'data', 'regionen.json'),
  JSON.stringify(REGIONS_EMBEDDED.map(r => r.id + '.json'), null, 1));
console.log('JSON-DB regeneriert:', REGIONS_EMBEDDED.map(r => r.id).join(', '));
