#!/usr/bin/env node
/* Kompiliert src/*.ts nach js/. Das Ergebnis wird deployt (GitHub Pages liefert es
   unverändert aus, der Browser lädt die Module nativ – kein Bundler zur Laufzeit). */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync('/tmp/ts-install/node_modules/.bin/tsc', [], { cwd: ROOT, stdio: 'inherit' });
const pkg = path.join(ROOT, 'js', 'package.json');
if (!fs.existsSync(pkg)) fs.writeFileSync(pkg, '{"type":"module"}\n');
console.log('✓ Build nach js/ fertig.');
