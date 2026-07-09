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

describe('Bug: Fangliste stand nach Backup-Import auf dem Kopf', () => {
  test('neuester Fang steht immer oben – auch nach einem Import', async () => {
    await loadRegion(ctx, 'elbe');
    doc.querySelector('[data-view="fangbuch"]').click();
    app.state.fbMem.length = 0;
    app.state.fbMem.push(
      { id: 1, datum: '1.7.2026', fisch: 'Zander', laenge: 50, spot: 'A', koeder: 'G', entnommen: false },
      { id: 2, datum: '5.7.2026', fisch: 'Zander', laenge: 60, spot: 'A', koeder: 'G', entnommen: false },
      { id: 3, datum: '9.7.2026', fisch: 'Zander', laenge: 70, spot: 'A', koeder: 'G', entnommen: false },
    );
    app.fbRender();
    const vorher = [...doc.querySelectorAll('.fb-entry')].map((e) => (e.textContent.match(/\d+ cm/) || [''])[0]);
    assert.deepEqual(vorher, ['70 cm', '60 cm', '50 cm'], 'Vorbedingung: neueste zuerst');

    await app.fbRestore({ text: async () => JSON.stringify({ faenge: [
      { id: 4, datum: '3.7.2026', fisch: 'Hecht', laenge: 80, spot: 'B', koeder: 'W', entnommen: false }] }) });
    await tick(ctx.window, 30);

    const nachher = [...doc.querySelectorAll('.fb-entry')].map((e) => (e.textContent.match(/\d+ cm/) || [''])[0]);
    assert.deepEqual(nachher, ['70 cm', '60 cm', '80 cm', '50 cm'],
      'Nach dem Import stand die Liste früher auf dem Kopf (reverse() statt Datumssortierung)');
  });
});

describe('Bug: Empfehlung schlug Arten ohne Schonzeitdaten vor', () => {
  test('eine Art ohne Schonzeit-/Maßdaten wird nie empfohlen', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.PEGEL = { value: 100, station: 'X', dist: 3, wt: 16 };
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      const e = app.empfehlung();
      if (!e?.zielfisch) continue;
      const sc = app.state.SCHON.find((x) => x.fisch === e.zielfisch.art);
      assert.ok(sc, `${r.id}: "${e.zielfisch.art}" empfohlen, obwohl keine Schonzeitdaten vorliegen – `
        + 'der Maßcheck sagt für diesen Fall "KEINE Freigabe"');
    }
  });

  test('sind alle Arten geschont, nennt der Satz keinen Fisch und keinen Köder', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.PEGEL = { value: 100, station: 'X', dist: 3, wt: 16 };
    const sicherung = app.state.SCHON.map((s) => ({ ...s }));
    app.state.SCHON.forEach((s) => { s.von = [1, 1]; s.bis = [12, 31]; });

    const e = app.empfehlung();
    assert.equal(e.zielfisch, null);
    assert.ok(!/ auf [A-ZÄÖÜ]/.test(e.satz), 'nennt trotzdem einen Zielfisch');
    assert.ok(!/Jigkopf|Gummifisch/.test(e.satz), 'nennt trotzdem einen Köder');
    assert.ok(e.luecken.some((l) => /Schonzeit|geschont|Daten/i.test(l)), 'kein Hinweis in den Lücken');

    app.state.SCHON.forEach((s, i) => { s.von = sicherung[i].von; s.bis = sicherung[i].bis; });
  });
});

describe('Bug: Gummifisch am Jigkopf für Friedfische', () => {
  test('Karpfen bekommt keinen Jigkopf empfohlen', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.PEGEL = { value: 100, station: 'X', dist: 3, wt: 18 };
    const sicherung = app.state.SCHON.map((s) => ({ ...s }));
    app.state.SCHON.forEach((s) => { if (s.fisch !== 'Karpfen') { s.von = [1, 1]; s.bis = [12, 31]; } else { s.von = null; s.bis = null; } });

    const e = app.empfehlung();
    assert.equal(e.zielfisch.art, 'Karpfen');
    assert.ok(!/Jigkopf/.test(e.satz), 'Friedfisch am Jigkopf: ' + e.satz);
    assert.match(e.satz, /Boilie|Mais|Feeder/);

    app.state.SCHON.forEach((s, i) => { s.von = sicherung[i].von; s.bis = sicherung[i].bis; });
  });
});

describe('Schonzeit-Grenzen (rechtlich kritisch)', () => {
  const mitDatum = (jahr, monat, tag, fn) => {
    const Echt = ctx.window.Date;
    class Fake extends Echt {
      constructor(...a) { if (a.length === 0) super(jahr, monat - 1, tag, 12); else super(...a); }
      static now() { return new Echt(jahr, monat - 1, tag, 12).getTime(); }
    }
    ctx.window.Date = Fake;
    try { return fn(); } finally { ctx.window.Date = Echt; }
  };

  test('Fenster innerhalb eines Jahres: Grenzen sind inklusiv', () => {
    assert.equal(mitDatum(2026, 2, 14, () => app.inWindow([2, 15], [5, 31])), false);
    assert.equal(mitDatum(2026, 2, 15, () => app.inWindow([2, 15], [5, 31])), true);
    assert.equal(mitDatum(2026, 5, 31, () => app.inWindow([2, 15], [5, 31])), true);
    assert.equal(mitDatum(2026, 6, 1, () => app.inWindow([2, 15], [5, 31])), false);
  });

  test('Fenster über den Jahreswechsel (Aal 15.09.–01.03.)', () => {
    assert.equal(mitDatum(2026, 9, 14, () => app.inWindow([9, 15], [3, 1])), false);
    assert.equal(mitDatum(2026, 9, 15, () => app.inWindow([9, 15], [3, 1])), true);
    assert.equal(mitDatum(2026, 12, 31, () => app.inWindow([9, 15], [3, 1])), true);
    assert.equal(mitDatum(2026, 1, 1, () => app.inWindow([9, 15], [3, 1])), true);
    assert.equal(mitDatum(2026, 3, 1, () => app.inWindow([9, 15], [3, 1])), true);
    assert.equal(mitDatum(2026, 3, 2, () => app.inWindow([9, 15], [3, 1])), false);
  });
});
