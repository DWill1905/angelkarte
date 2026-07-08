#!/usr/bin/env node
/* Bündelt die ES-Module zu einem IIFE für den jsdom-Test-Harness (nur Dev/Test,
   das Deployment lädt die Module nativ im Browser). Nutzt esbuild aus /tmp. */
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const esbuild = '/tmp/esbuild-install/node_modules/.bin/esbuild';
execFileSync(esbuild, [
  path.join(root, 'js', 'app.js'),
  '--bundle', '--format=iife',
  '--outfile=' + path.join('/tmp', 'ak-test-bundle.js')
], { stdio: 'inherit' });
console.log('Test-Bundle: /tmp/ak-test-bundle.js');
