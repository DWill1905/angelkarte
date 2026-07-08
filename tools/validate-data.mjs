#!/usr/bin/env node
/* Datenintegritäts-Selbsttest für die Angelkarte-Regionsdaten.
   Prüft REGIONS_EMBEDDED (importiert aus js/data.js) auf plausible
   Schonzeit-/Maß-/Spot-Angaben. Exit-Code 1 bei Fehlern -> blockiert im Deploy. */
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const { REGIONS_EMBEDDED: regions } = await import(pathToFileURL(path.join(root, 'js', 'data.js')).href);

const errors = [];
const warns = [];
const E = (m) => errors.push(m);
const W = (m) => warns.push(m);

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

