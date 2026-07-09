/* Regressionstests für Bugs, die eine gezielte Suche aufgedeckt hat.
   Jeder Test hier steht für einen Fehler, der real im Code war. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startApp, loadRegion, tick, ROOT } from './setup.mjs';

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; });
after(() => ctx?.close());

describe('Bug: istAuflandig verglich Breitengrade als Winkel', () => {
  test('identische Punkte liefern null (keine Peilung möglich)', () => {
    const p = { lat: 53.3, lng: 12.99 };
    assert.equal(app.istAuflandig(p, { lat: 53.3, lng: 12.99 }, 225), null);
  });

  test('unterschiedliche Breite, gleiche Länge wird korrekt bewertet', () => {
    const spot = { lat: 53.30, lng: 12.99 };
    const nord = { lat: 53.32, lng: 12.99 };
    // Nordwind (0°) treibt nach Süden – das Nordufer liegt im Windschatten
    assert.equal(app.istAuflandig(spot, nord, 0), false);
    // Südwind (180°) treibt nach Norden – Nordufer ist auflandig
    assert.equal(app.istAuflandig(spot, nord, 180), true);
  });

  test('gleiche Breite, unterschiedliche Länge (früher fälschlich null)', () => {
    const spot = { lat: 53.30, lng: 12.99 };
    const ost = { lat: 53.30, lng: 13.02 };
    const r = app.istAuflandig(spot, ost, 225);
    assert.notEqual(r, null, 'Gleiche Breite darf nicht als "identischer Punkt" gelten');
    assert.equal(r, true, 'SW-Wind macht das Ostufer auflandig');
  });
});

describe('Bug: zwei Kopien der Jahreszeit-Logik', () => {
  test('saison() und jahreszeit() liefern für jeden Monat dasselbe', () => {
    for (let m = 0; m < 12; m++) {
      const d = new Date(2026, m, 15);
      assert.equal(app.saison(d), app.jahreszeit(d), `Monat ${m + 1} weicht ab`);
    }
  });

  test('es gibt nur eine Implementierung im Quelltext', () => {
    const saisonTs = fs.readFileSync(path.join(ROOT, 'src', 'saison.ts'), 'utf8');
    const tackleTs = fs.readFileSync(path.join(ROOT, 'src', 'tackle.ts'), 'utf8');
    assert.match(saisonTs, /export function jahreszeit/);
    assert.ok(!/export function saison\s*\(/.test(tackleTs),
      'tackle.ts darf keine eigene saison()-Funktion mehr haben – nur einen Re-Export');
  });
});

describe('Bug: Schilf-Layer blieb beim Regionswechsel liegen', () => {
  test('nach dem Regionswechsel ist der Schilf-Layer aus', async () => {
    const c = await startApp({
      leaflet: { zoom: 14 },
      fetchImpl: async (u) => String(u).includes('overpass')
        ? { ok: true, json: async () => ({ elements: [{ type: 'way', geometry: [
            { lat: 53.30, lon: 12.99 }, { lat: 53.31, lon: 12.99 }, { lat: 53.31, lon: 13.00 }, { lat: 53.30, lon: 12.99 }] }] }) }
        : Promise.reject(new Error('offline')),
    });

    await loadRegion(c, 'mecklenburg');
    const r = await c.app.schilfLaden();
    assert.equal(r.ok, true, 'Vorbedingung: Schilf geladen');
    assert.equal(c.app.schilfAktiv(), true);

    await loadRegion(c, 'mainz');
    assert.equal(c.app.schilfAktiv(), false,
      'Schilfflächen der alten Region dürfen nicht über der neuen Karte liegen bleiben');

    const btn = c.document.getElementById('schilfBtn');
    assert.equal(btn.getAttribute('aria-pressed'), 'false',
      'Der Schalter muss den echten Zustand zeigen');
    c.close();
  });
});

describe('Robustheit: kein Popup wirft, egal welcher Spot', () => {
  test('alle Spots aller Regionen, mit und ohne Wetterdaten', async () => {
    for (const wetter of [null, { temp: 19, wind: 14, dirDeg: 225, dir: 'SW', press: 1006, trendVal: -2.1 }]) {
      for (const r of app.state.REGIONS) {
        await loadRegion(ctx, r.id);
        app.state.WX = wetter;
        app.state.PEGEL = wetter ? { value: 120, station: 'X', dist: 5, wt: 16 } : null;
        app.state.SPOTS.forEach((s) => {
          assert.doesNotThrow(() => app.popupHtml(s), `${r.id}/${s.name}`);
          if (s.cat !== 'sperr' && s.cat !== 'info') {
            assert.doesNotThrow(() => app.bewerteAlle(s), `bewerteAlle ${r.id}/${s.name}`);
          }
        });
      }
    }
  });

  test('Flussstrecken haben eine Mittelpunkt-Koordinate', () => {
    app.state.REGIONS.forEach((r) => {
      r.spots.filter((s) => s.line).forEach((s) => {
        assert.equal(typeof s.lat, 'number', `${s.name}: ohne lat wäre der Spot nie empfehlbar`);
        assert.equal(typeof s.lng, 'number', `${s.name}: ohne lng`);
      });
    });
  });
});

describe('Struktur: keine toten Verweise', () => {
  test('jede im Code angesprochene Element-ID existiert oder wird dynamisch erzeugt', () => {
    const vorhanden = new Set([...doc.querySelectorAll('[id]')].map((e) => e.id));
    const dynamisch = new Set(['swReload', 'offProg', 'tripClear']); // per innerHTML erzeugt
    const quelltext = fs.readdirSync(path.join(ROOT, 'src'))
      .filter((f) => f.endsWith('.ts'))
      .map((f) => fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'))
      .join('\n');

    const genutzt = new Set();
    for (const m of quelltext.matchAll(/(?:byId|byIdOrThrow|inputById|selectById|buttonById)(?:<[^>]*>)?\('([^']+)'\)/g)) {
      genutzt.add(m[1]);
    }
    const fehlend = [...genutzt].filter((id) => !vorhanden.has(id) && !dynamisch.has(id));
    assert.deepEqual(fehlend, [], 'Diese IDs werden angesprochen, existieren aber nicht: ' + fehlend.join(', '));
  });

  test('keine doppelten IDs im HTML', () => {
    const zaehler = {};
    [...doc.querySelectorAll('[id]')].forEach((e) => { zaehler[e.id] = (zaehler[e.id] || 0) + 1; });
    const doppelt = Object.entries(zaehler).filter(([, n]) => n > 1).map(([i]) => i);
    assert.deepEqual(doppelt, [], 'Doppelte IDs: ' + doppelt.join(', '));
  });

  test('alle Laufzeit-Module liegen im Service-Worker-Cache', () => {
    const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    const module = fs.readdirSync(path.join(ROOT, 'js'))
      .filter((f) => f.endsWith('.js') && f !== 'types.js'); // types.js wird zur Laufzeit nie importiert
    const fehlend = module.filter((m) => !sw.includes('js/' + m));
    assert.deepEqual(fehlend, [], 'Ohne Cache-Eintrag bricht die Offline-Nutzung: ' + fehlend.join(', '));
  });
});

describe('Bug: validierte Fanglänge wurde verworfen', () => {
  test('unsinnige Längen werden nicht gespeichert', async () => {
    await loadRegion(ctx, 'elbe');
    doc.querySelector('[data-view="fangbuch"]').click();
    const sp = doc.getElementById('fbSpot');
    if (sp.options.length) sp.selectedIndex = 0;

    const faelle = [['', ''], ['9999', ''], ['-5', ''], ['55', 55]];
    for (const [eingabe, erwartet] of faelle) {
      app.state.fbMem.length = 0;
      doc.getElementById('fbFisch').value = 'Zander';
      doc.getElementById('fbLaenge').value = eingabe;
      await doc.getElementById('fbSave').onclick();
      await tick(ctx.window, 30);
      assert.equal(app.state.fbMem[0].laenge, erwartet,
        `Eingabe "${eingabe}" wurde als ${JSON.stringify(app.state.fbMem[0].laenge)} gespeichert`);
    }
  });

  test('gespeicherte Länge ist nie NaN', async () => {
    await loadRegion(ctx, 'elbe');
    doc.querySelector('[data-view="fangbuch"]').click();
    app.state.fbMem.length = 0;
    doc.getElementById('fbFisch').value = 'Hecht';
    doc.getElementById('fbLaenge').value = 'abc';
    const sp = doc.getElementById('fbSpot');
    if (sp.options.length) sp.selectedIndex = 0;
    await doc.getElementById('fbSave').onclick();
    await tick(ctx.window, 30);
    const l = app.state.fbMem[0].laenge;
    assert.ok(!(typeof l === 'number' && Number.isNaN(l)), 'NaN landet als null im Backup');
  });

  test('ein 9999-cm-Fisch taucht nicht in der Bestenliste auf', async () => {
    app.state.fbMem.length = 0;
    for (let i = 0; i < 8; i++) {
      app.state.fbMem.push({ id: i, datum: `${i + 1}.7.2026`, fisch: 'Zander', laenge: 50 + i, spot: 'A', koeder: 'G', entnommen: false });
    }
    app.state.fbMem.push({ id: 99, datum: '9.7.2026', fisch: 'Zander', laenge: '', spot: 'A', koeder: 'G', entnommen: false });
    app.fbInsights();
    const h = doc.getElementById('fbInsights').innerHTML;
    assert.ok(!/9999/.test(h));
    assert.ok(!/NaN/.test(h), 'NaN darf nie in der Auswertung erscheinen');
  });
});
