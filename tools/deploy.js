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
if (!TOKEN || !message || !files.length) {
  console.error('Nutzung: GH_TOKEN=... node tools/deploy.js "Message" datei1 [datei2 ...]');
  process.exit(1);
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
  const ref = await api('GET', `/repos/${REPO}/git/ref/heads/main`);
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
  await api('PATCH', `/repos/${REPO}/git/refs/heads/main`, { sha: newCommit.sha });
  console.log('Commit:', newCommit.sha.slice(0, 7), '->', message);
})().catch((e) => {
  console.error('FEHLER:', e.message);
  process.exit(1);
});
