#!/usr/bin/env node
/* Prüft: (1) TypeScript kompiliert fehlerfrei, (2) das ausgelieferte js/ ist aktuell zu src/.
   Ohne (2) könnte veralteter JS-Code deployt werden, während die TS-Quelle schon anders aussieht. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TSC = '/tmp/ts-install/node_modules/.bin/tsc';
if (!fs.existsSync(TSC)) {
  console.error('✖ tsc fehlt: npm install typescript --no-save --prefix /tmp/ts-install');
  process.exit(1);
}

/* 1) Typecheck */
try {
  execFileSync(TSC, ['--noEmit'], { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
  console.log('✓ Typecheck sauber.');
} catch (e) {
  process.stdout.write(e.stdout || '');
  console.error('✖ TypeScript-Fehler – Deploy blockiert.');
  process.exit(1);
}

/* 2) Drift-Check: frisch nach tmp bauen und mit js/ vergleichen */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ak-build-'));
try {
  execFileSync(TSC, ['--outDir', tmp], { cwd: ROOT, stdio: 'pipe' });
  const drift = [];
  for (const f of fs.readdirSync(tmp).filter((x) => x.endsWith('.js'))) {
    const neu = fs.readFileSync(path.join(tmp, f), 'utf8');
    const alt = fs.existsSync(path.join(ROOT, 'js', f)) ? fs.readFileSync(path.join(ROOT, 'js', f), 'utf8') : '';
    if (neu !== alt) drift.push(f);
  }
  if (drift.length) {
    console.error('✖ js/ ist veraltet gegenüber src/: ' + drift.join(', '));
    console.error('  → node tools/build.mjs ausführen und die js/-Dateien mitdeployen.');
    process.exit(1);
  }
  console.log('✓ js/ ist aktuell zu src/.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
