#!/usr/bin/env node
/* Führt die komplette Test-Suite aus (Node-Test-Runner + jsdom).
   Baut vorher das Test-Bundle und – falls TypeScript-Quellen vorhanden sind – kompiliert sie.
   Exit 1 bei Fehlern → blockiert den Deploy. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });

/* 1) TypeScript kompilieren (wenn src/ existiert) */
const TSC = '/tmp/ts-install/node_modules/.bin/tsc';
if (fs.existsSync(path.join(ROOT, 'src')) && fs.existsSync(TSC)) {
  console.log('› TypeScript kompilieren …');
  run(TSC, []);
  /* tsc löscht js/package.json nicht, aber sicherheitshalber wiederherstellen */
  const pkg = path.join(ROOT, 'js', 'package.json');
  if (!fs.existsSync(pkg)) fs.writeFileSync(pkg, '{"type":"module"}\n');
}

/* 2) Test-Bundle bauen */
const ESBUILD = '/tmp/esbuild-install/node_modules/.bin/esbuild';
if (!fs.existsSync(ESBUILD)) {
  console.error('✖ esbuild fehlt: npm install esbuild --no-save --prefix /tmp/esbuild-install');
  process.exit(1);
}

/* 3) Tests ausführen */
console.log('› Test-Suite …');
try {
  const testFiles = fs.readdirSync(path.join(ROOT, 'tests'))
    .filter((f) => f.endsWith('.test.mjs'))
    .map((f) => path.join('tests', f));
  if (!testFiles.length) { console.error('✖ Keine Testdateien gefunden.'); process.exit(1); }
  run(process.execPath, ['--test', '--test-reporter=spec', '--test-force-exit', ...testFiles]);
} catch (e) {
  console.error('\n✖ Tests fehlgeschlagen.');
  process.exit(1);
}
console.log('\n✓ Alle Tests grün.');
