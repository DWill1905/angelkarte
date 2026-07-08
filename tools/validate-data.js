#!/usr/bin/env node
/* Datenintegritäts-Selbsttest für die Angelkarte-Regionsdaten.
   Prüft die eingebettete REGIONS-Datenbank (aus index.html) auf plausible
   Schonzeit-/Maß-/Spot-Angaben. Fängt genau die Fehlerklasse ab, die uns
   beim Sachsen-Barsch (Fenster statt Stückzahl) und RLP-Hecht (veraltete
   Schonzeit) schon zweimal getroffen hat.
   Exit-Code 1 bei Fehlern -> blockiert im Deploy-Workflow. */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

/* REGIONS_EMBEDDED + zugehörige SPOTS/SCHON-Konstanten aus dem Script ziehen und
   in einer Sandbox evaluieren, um an die echten Objekte zu kommen. */
const scriptBody = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
  .map(x => x[1]).filter(x => x.trim() && !/src=/.test(x)).join('\n');

/* Nur den Datenteil bis zur ersten DOM-Nutzung evaluieren wäre fragil;
   stattdessen die relevanten const-Blöcke gezielt extrahieren. */
function extractConst(name) {
  const re = new RegExp('const ' + name + '\\s*=\\s*', 'g');
  const m = re.exec(scriptBody);
  if (!m) return null;
  let i = scriptBody.indexOf('[', m.index);
  if (i < 0) return null;
  let depth = 0, end = -1;
  for (let k = i; k < scriptBody.length; k++) {
    const c = scriptBody[k];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = k; break; } }
  }
  if (end < 0) return null;
  return scriptBody.slice(i, end + 1);
}

/* Alle SCHON_* und SPOTS_* + REGION_RLP + REGIONS_EMBEDDED einsammeln */
const sandbox = {};
const names = [...scriptBody.matchAll(/const (SCHON_[A-Z]+|SPOTS_[A-Z]+)\s*=/g)].map(m => m[1]);
for (const n of names) {
  const code = extractConst(n);
  if (code) { try { sandbox[n] = eval('(' + code + ')'); } catch (e) {} }
}
/* Alle REGION_*-Objekte + REGIONS_EMBEDDED (Array mit Referenzen) separat, mit Kontext */
let regions = null;
try {
  const ctx = names.map(n => 'const ' + n + '=' + JSON.stringify(sandbox[n]) + ';').join('\n');
  /* Jedes 'const REGION_XYZ = {...}' balanciert herausschneiden (zukunftssicher für neue Regionen) */
  const regionNames = [...scriptBody.matchAll(/const (REGION_[A-Z]+)\s*=\s*\{/g)].map(m => m[1]);
  const regionDefs = regionNames.map(rn => {
    const m = new RegExp('const ' + rn + '\\s*=\\s*\\{').exec(scriptBody);
    let i = scriptBody.indexOf('{', m.index), depth = 0, end = -1;
    for (let k = i; k < scriptBody.length; k++) {
      if (scriptBody[k] === '{') depth++;
      else if (scriptBody[k] === '}') { depth--; if (depth === 0) { end = k; break; } }
    }
    return 'const ' + rn + '=' + scriptBody.slice(i, end + 1) + ';';
  }).join('\n');
  const embCode = extractConst('REGIONS_EMBEDDED');
  regions = eval('(function(){' + ctx + '\n' + regionDefs + '\nreturn ' + embCode + ';})()');
} catch (e) {
  console.error('Konnte REGIONS_EMBEDDED nicht evaluieren:', e.message);
  process.exit(2);
}

let errors = [], warns = [];
const E = m => errors.push(m);
const W = m => warns.push(m);

const MONTH_OK = (a) => Array.isArray(a) && a.length === 2 && a[0] >= 1 && a[0] <= 12 && a[1] >= 1 && a[1] <= 31;

for (const r of regions) {
  const tag = '[' + r.id + ']';
  if (!r.id || !r.name) E(tag + ' id/name fehlt');
  if (!Array.isArray(r.spots) || !r.spots.length) E(tag + ' keine Spots');
  if (!Array.isArray(r.schon) || !r.schon.length) E(tag + ' keine Schonzeiten');

  /* Schonzeiten */
  (r.schon || []).forEach(s => {
    const t = tag + ' Schon „' + (s.fisch || '?') + '“';
    if (!s.fisch) E(t + ': fisch fehlt');
    if (typeof s.mm === 'undefined') E(t + ': mm (Maß) fehlt');
    /* von/bis müssen entweder beide null oder beide gültige [M,T] sein */
    const hasV = s.von != null, hasB = s.bis != null;
    if (hasV !== hasB) E(t + ': von/bis inkonsistent (nur eines gesetzt)');
    if (hasV && !MONTH_OK(s.von)) E(t + ': von ungültig ' + JSON.stringify(s.von));
    if (hasB && !MONTH_OK(s.bis)) E(t + ': bis ungültig ' + JSON.stringify(s.bis));
    /* Maß-String plausibel: entweder Zahl+cm, Fenster, oder bewusst '–' */
    if (typeof s.mm === 'string') {
      const hasCm = /\d+\s*cm/.test(s.mm);
      const isNone = /^[–-]/.test(s.mm.trim());
      if (!hasCm && !isNone) W(t + ': Maß „' + s.mm + '“ – weder cm-Angabe noch bewusstes „–“');
      /* Fenster im Maß => beide Grenzen aufsteigend */
      const f = s.mm.match(/(\d+)\s*[–-]\s*(\d+)\s*cm/);
      if (f && +f[1] >= +f[2]) E(t + ': Entnahmefenster nicht aufsteigend (' + s.mm + ')');
    }
  });

  /* Spots */
  (r.spots || []).forEach(sp => {
    const t = tag + ' Spot „' + (sp.name || '?') + '“';
    if (!sp.name) E(t + ': name fehlt');
    if (typeof sp.lat !== 'number' || typeof sp.lng !== 'number') E(t + ': lat/lng fehlt/ungültig');
    else {
      /* grob Deutschland/Mitteleuropa */
      if (sp.lat < 46 || sp.lat > 55) W(t + ': lat ' + sp.lat + ' außerhalb DE-Bereich?');
      if (sp.lng < 5 || sp.lng > 15.5) W(t + ': lng ' + sp.lng + ' außerhalb DE-Bereich?');
    }
    if (!sp.cat) E(t + ': cat fehlt');
    if (!Array.isArray(sp.arten)) E(t + ': arten kein Array');
    if (sp.zugang && !['ufer','boot'].includes(sp.zugang)) E(t + ': zugang ungültig ("' + sp.zugang + '")');
    if (sp.verif && !['A','B','C'].includes(sp.verif)) E(t + ': verif ungültig ("' + sp.verif + '")');
    (sp.hotspots || []).forEach(h => {
      if (typeof h.lat !== 'number' || typeof h.lng !== 'number') E(t + ' Hotspot „' + (h.name || '?') + '“: lat/lng ungültig');
    });
  });

  /* Pflicht-Meta */
  ['schonQuelle', 'hinweis'].forEach(k => { if (!r[k]) W(tag + ': ' + k + ' fehlt'); });
  if (!['lvsa', 'frei', 'verboten'].includes(r.nachtangeln)) W(tag + ': nachtangeln „' + r.nachtangeln + '“ unbekannt');
  if (!Array.isArray(r.packliste) || !r.packliste.length) W(tag + ': packliste fehlt/leer');
}

console.log('Geprüft: ' + regions.length + ' Regionen, ' +
  regions.reduce((a, r) => a + (r.spots || []).length, 0) + ' Spots, ' +
  regions.reduce((a, r) => a + (r.schon || []).length, 0) + ' Schonzeit-Einträge.');
if (warns.length) { console.log('\n⚠ ' + warns.length + ' Warnung(en):'); warns.forEach(w => console.log('  - ' + w)); }
if (errors.length) {
  console.log('\n✖ ' + errors.length + ' FEHLER:');
  errors.forEach(e => console.log('  - ' + e));
  process.exit(1);
}
console.log('\n✓ Datenintegrität OK' + (warns.length ? ' (mit Warnungen)' : '') + '.');
