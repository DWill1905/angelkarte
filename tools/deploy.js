#!/usr/bin/env node
/* Single-Commit-Deploy für DWill1905/angelkarte über die Git-Data-API.
   Alle geänderten Dateien landen in EINEM Commit -> genau EIN Pages-Deployment,
   keine gecancelten/kollidierenden Runs mehr.
   Nutzung: GH_TOKEN=... node tools/deploy.js "Commit-Message" datei1 [datei2 ...]
   (Pfade relativ zum Repo-Root = Verzeichnis von index.html) */
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GH_TOKEN;
const REPO = 'DWill1905/angelkarte';
const [, , message, ...files] = process.argv;
const BRANCH = process.env.GH_BRANCH || 'main';
if (!TOKEN || !message || !files.length) {
  console.error('Nutzung: GH_TOKEN=... node tools/deploy.js "Message" datei1 [datei2 ...]');
  process.exit(1);
}

/* Pre-Deploy-Wächter: Datenintegrität prüfen, sobald index.html oder Daten betroffen sind.
   Blockiert den Deploy bei stillen Datenfehlern (Schonzeiten/Maße/Spots). */
const touchesRegionData = files.some(f => /js\/data\.js$|data\/[a-z]+\.json$/.test(f));
const touchesData = files.some(f => /index\.html$|data\/|js\/data\.js$/.test(f));
const touchesSrc = files.some(f => /src\/.+\.ts$/.test(f));
const touchesCode = files.some(f => /js\/.+\.js$|src\/.+\.ts$/.test(f));
/* TypeScript: Typecheck + Drift (js/ muss zu src/ passen) + Test-Suite */
if (touchesSrc || touchesCode) {
  const { execFileSync } = require('child_process');
  for (const [tool, label] of [['check-build.mjs', 'Typecheck/Build'], ['test.mjs', 'Test-Suite']]) {
    try {
      const out = execFileSync('node', [path.join(__dirname, tool)], { encoding: 'utf8' });
      process.stdout.write(out.split('\n').slice(-4).join('\n'));
    } catch (e) {
      if (e.stdout) process.stdout.write(e.stdout);
      if (e.stderr) process.stderr.write(e.stderr);
      console.error('\n✖ ' + label + ' fehlgeschlagen.');
      if (BRANCH === 'main') process.exit(1);
      console.error('   (Branch-Deploy: nur Warnung, kein Abbruch)');
    }
  }
}
if (touchesCode) {
  const { execFileSync } = require('child_process');
  try {
    const out = execFileSync('node', [path.join(__dirname, 'check-imports.mjs')], { encoding: 'utf8' });
    process.stdout.write(out);
    const st = execFileSync('node', [path.join(__dirname, 'check-state.mjs')], { encoding: 'utf8' });
    process.stdout.write(st);
    const dc = execFileSync('node', [path.join(__dirname, 'check-dead.mjs')], { encoding: 'utf8' });
    process.stdout.write(dc.split('\n').slice(-2).join('\n'));
    const cy = execFileSync('node', [path.join(__dirname, 'check-cycles.mjs')], { encoding: 'utf8' });
    process.stdout.write(cy.split('\n').slice(-2).join('\n'));
  } catch (e) {
    if (e.stdout) process.stdout.write(e.stdout);
    if (e.stderr) process.stderr.write(e.stderr);
    console.error('\n✖ Import-/State-Check fehlgeschlagen.');
    if (BRANCH === 'main') process.exit(1);
    console.error('   (Branch-Deploy: nur Warnung, kein Abbruch)');
  }
}
if (touchesData) {
  const { execFileSync } = require('child_process');
  /* Regionsdaten angefasst? Dann Manifest + JSONs regenerieren, damit sie nie veralten,
     und data/regionen.json automatisch in den Deploy aufnehmen (der Bug, der Gießen
     unsichtbar machte: Manifest wurde nicht mitdeployt). */
  if (touchesRegionData) {
    try {
      execFileSync('node', [path.join(__dirname, 'gen-data.mjs')], { encoding: 'utf8' });
    } catch (e) {
      console.error('✖ gen-data.mjs fehlgeschlagen:', e.message); process.exit(1);
    }
    for (const auto of ['data/regionen.json']) {
      if (!files.includes(auto)) { files.push(auto); console.log('Auto-mitgenommen:', auto, '(Manifest-Konsistenz)'); }
    }
  }
  try {
    const out = execFileSync('node', [path.join(__dirname, 'validate-data.mjs')], { encoding: 'utf8' });
    process.stdout.write(out);
    /* Live-Ladepfad prüfen (Manifest -> Dateien), fängt genau den Gießen-Fehler */
    const loadOut = execFileSync('node', [path.join(__dirname, 'test-load.mjs')], { encoding: 'utf8' });
    process.stdout.write(loadOut);
  } catch (e) {
    if (e.stdout) process.stdout.write(e.stdout);
    console.error('\n✖ Daten-/Ladecheck fehlgeschlagen.');
    if (BRANCH === 'main') process.exit(1);
    console.error('   (Branch-Deploy: nur Warnung, kein Abbruch)');
  }
}

const api = async (method, url, body) => {
  const r = await fetch('https://api.github.com' + url, {
    method,
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(method + ' ' + url + ' -> ' + r.status + ': ' + (d.message || ''));
  return d;
};

(async () => {
  // 1) Basis: aktueller Head + Tree
  const ref = await api('GET', `/repos/${REPO}/git/ref/heads/${BRANCH}`);
  const baseCommit = ref.object.sha;
  const commit = await api('GET', `/repos/${REPO}/git/commits/${baseCommit}`);
  console.log('Basis:', baseCommit.slice(0, 7));

  // 2) Blobs für alle Dateien
  const tree = [];
  for (const f of files) {
    const content = fs.readFileSync(f);
    const blob = await api('POST', `/repos/${REPO}/git/blobs`, {
      content: content.toString('base64'),
      encoding: 'base64',
    });
    tree.push({ path: f.replace(/^\.\//, ''), mode: '100644', type: 'blob', sha: blob.sha });
    console.log('Blob:', f, '->', blob.sha.slice(0, 7));
  }

  // 3) Tree, Commit, Ref-Update
  const newTree = await api('POST', `/repos/${REPO}/git/trees`, {
    base_tree: commit.tree.sha,
    tree,
  });
  const newCommit = await api('POST', `/repos/${REPO}/git/commits`, {
    message,
    tree: newTree.sha,
    parents: [baseCommit],
  });
  await api('PATCH', `/repos/${REPO}/git/refs/heads/${BRANCH}`, { sha: newCommit.sha });
  if (BRANCH !== 'main') { console.log('Commit auf Branch ' + BRANCH + ' – kein Pages-Build erwartet.'); }
  console.log('Commit:', newCommit.sha.slice(0, 7), '->', message);

  // 4) Deploy sicherstellen: GitHub triggert bei Git-Data-Pushes unzuverlässig.
  //    Warten, prüfen ob ein Run für den neuen Commit läuft/lief – sonst (oder bei
  //    failure/cancelled) genau EINEN Build anstoßen. Bis zu 3 Versuche.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  if (BRANCH !== 'main') { console.log('Fertig (Branch-Commit, GitHub Pages baut nur main).'); return; }
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(20000);
    const runs = await api('GET', `/repos/${REPO}/actions/runs?per_page=5`);
    const mine = (runs.workflow_runs || []).filter((r) => r.head_sha === newCommit.sha);
    const ok = mine.find((r) => r.conclusion === 'success');
    const active = mine.find((r) => r.status !== 'completed');
    if (ok) { console.log('Deploy: success'); return; }
    if (active) { console.log('Deploy läuft… (Versuch ' + attempt + ')'); attempt--; continue; }
    console.log('Kein erfolgreicher Run – stoße Build an (Versuch ' + attempt + ')');
    await api('POST', `/repos/${REPO}/pages/builds`, {});
  }
  console.log('WARNUNG: Deploy nach 3 Versuchen nicht bestätigt – Actions-Tab prüfen.');
})().catch((e) => {
  console.error('FEHLER:', e.message);
  process.exit(1);
});
