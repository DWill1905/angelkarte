/* Tests der saisonalen Karte.
   Kern: der Parser der Saison-Freitexte (echte Daten) und die Ehrlichkeit der Darstellung –
   Krautfelder und Tiefenkanten dürfen NICHT als Flächen erfunden werden. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { startApp, loadRegion, tick, ROOT } from './setup.mjs';

const { REGIONS_EMBEDDED: regions } = await import(pathToFileURL(path.join(ROOT, 'js', 'data.js')).href);
const { monateAus, hotspotAktiv, jahreszeit, fokusFor, istKante, spotImFokus } =
  await import(pathToFileURL(path.join(ROOT, 'js', 'saison.js')).href);

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; });
after(() => ctx?.close());

describe('monateAus – Parser der Saison-Freitexte', () => {
  const f = (t) => monateAus(t).sort((a, b) => a - b);
  const soll = (arr) => arr.sort((a, b) => a - b);

  test('Monatsbereich', () => assert.deepEqual(f('Mai–Okt'), soll([5, 6, 7, 8, 9, 10])));
  test('Bereich über den Jahreswechsel', () =>
    assert.deepEqual(f('Okt–Mär, Zander'), soll([10, 11, 12, 1, 2, 3])));
  test('Monat bis Jahreszeit ("Juni–Winter")', () =>
    assert.deepEqual(f('Juni–Winter, Zander'), soll([6, 7, 8, 9, 10, 11, 12, 1, 2])));
  test('"Hochsommer" zieht Juni NICHT mit rein', () =>
    assert.deepEqual(f('Hochsommer + Winter'), soll([7, 8, 12, 1, 2])));
  test('"Sommerloch-Taktik" ist kein Sommer-Fenster', () =>
    assert.deepEqual(f('Jul–Sep (Sommerloch-Taktik)'), soll([7, 8, 9])));
  test('Jahreszeit-Wörter', () => {
    assert.deepEqual(f('Frühjahr Hecht'), soll([3, 4, 5]));
    assert.deepEqual(f('Frühjahr/Herbst'), soll([3, 4, 5, 9, 10, 11]));
  });
  test('ganzjährig ergibt alle zwölf Monate', () => assert.equal(f('ganzjährig').length, 12));
  test('ohne Monatsangabe leeres Ergebnis', () => assert.deepEqual(f('Dämmerung, Zander'), []));
  test('leerer Text stürzt nicht ab', () => {
    assert.deepEqual(f(''), []);
    assert.deepEqual(monateAus(null), []);
  });
});

describe('Alle echten Saison-Texte sind verarbeitbar', () => {
  test('kein Text wirft, jeder liefert 0–12 Monate', () => {
    regions.flatMap((r) => r.spots).flatMap((s) => s.hotspots || []).forEach((h) => {
      const m = monateAus(h.saison || '');
      assert.ok(Array.isArray(m), `${h.name}: kein Array`);
      assert.ok(m.length <= 12, `${h.name}: ${m.length} Monate`);
      m.forEach((x) => assert.ok(x >= 1 && x <= 12, `${h.name}: Monat ${x}`));
    });
  });

  test('Hotspots ohne erkennbare Saison werden nie weggeblendet', () => {
    const ohne = regions.flatMap((r) => r.spots).flatMap((s) => s.hotspots || [])
      .filter((h) => monateAus(h.saison || '').length === 0);
    ohne.forEach((h) => {
      for (let m = 1; m <= 12; m++) {
        assert.equal(hotspotAktiv(h, m), true, `${h.name} müsste in Monat ${m} sichtbar bleiben`);
      }
    });
  });

  test('ein Winter-Hotspot ist im Juli nicht aktiv', () => {
    const winter = regions.flatMap((r) => r.spots).flatMap((s) => s.hotspots || [])
      .find((h) => /Okt–Mär/.test(h.saison || ''));
    assert.ok(winter, 'Testdaten brauchen einen Winter-Hotspot');
    assert.equal(hotspotAktiv(winter, 7), false);
    assert.equal(hotspotAktiv(winter, 1), true);
  });
});

describe('jahreszeit und Fokus', () => {
  test('Jahreszeiten-Grenzen', () => {
    assert.equal(jahreszeit(new Date(2026, 1, 15)), 'winter');
    assert.equal(jahreszeit(new Date(2026, 2, 15)), 'fruehjahr');
    assert.equal(jahreszeit(new Date(2026, 5, 15)), 'sommer');
    assert.equal(jahreszeit(new Date(2026, 8, 15)), 'herbst');
    assert.equal(jahreszeit(new Date(2026, 11, 1)), 'winter');
  });

  test('Frühjahr betont flaches Wasser, Herbst die Tiefe', () => {
    assert.ok(fokusFor('fruehjahr').bevorzugt.includes('see-flach'));
    assert.ok(fokusFor('herbst').bevorzugt.includes('see-tief'));
    assert.ok(!fokusFor('herbst').bevorzugt.includes('see-flach'));
  });

  test('Schilf wird nur im Frühjahr/Sommer angeboten', () => {
    assert.equal(fokusFor('fruehjahr').schilf, true);
    assert.equal(fokusFor('sommer').schilf, true);
    assert.equal(fokusFor('herbst').schilf, false);
    assert.equal(fokusFor('winter').schilf, false);
  });

  test('jeder Fokus erklärt sich selbst', () => {
    ['fruehjahr', 'sommer', 'herbst', 'winter'].forEach((jz) => {
      const f = fokusFor(jz);
      assert.ok(f.titel && f.betont && f.hinweis, `${jz}: unvollständig`);
      assert.ok(f.bevorzugt.length > 0, `${jz}: kein bevorzugter Gewässertyp`);
    });
  });

  test('spotImFokus trifft im Herbst tiefe Seen, nicht flache', () => {
    const mv = regions.find((r) => r.id === 'mecklenburg');
    const tief = mv.spots.find((s) => s.wasser === 'see-tief');
    const flach = mv.spots.find((s) => s.wasser === 'see-flach');
    const herbst = fokusFor('herbst');
    assert.equal(spotImFokus(tief, herbst), true);
    assert.equal(spotImFokus(flach, herbst), false);
  });

  test('Sperrzonen stehen nie im Fokus', () => {
    const sperr = regions.flatMap((r) => r.spots).find((s) => s.cat === 'sperr');
    ['fruehjahr', 'sommer', 'herbst', 'winter'].forEach((jz) =>
      assert.equal(spotImFokus(sperr, fokusFor(jz)), false));
  });
});

describe('istKante – Tiefenkanten-Erkennung', () => {
  test('erkennt Kanten und Löcher am Text', () => {
    assert.equal(istKante({ name: 'Tiefes Loch (11,4 m) Seemitte', tipp: '' }), true);
    assert.equal(istKante({ name: 'Steilufer Nordseite', tipp: '' }), true);
    assert.equal(istKante({ name: 'Buhnenkopf-Strömungskante', tipp: '' }), true);
    assert.equal(istKante({ name: 'Schilfbucht', tipp: 'flaches Wasser' }), false);
  });
});

describe('Saison-Leiste im UI', () => {
  test('Leiste nennt Jahreszeit und Fokus', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const bar = doc.getElementById('saisonBar');
    const f = fokusFor();
    assert.ok(bar.textContent.includes(f.titel.split(' – ')[0]), 'Jahreszeit fehlt');
    assert.ok(bar.textContent.includes('Was heißt das?'));
  });

  test('Erklärung ist zugeklappt und lässt sich öffnen', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const info = doc.getElementById('saisonInfo');
    const bar = doc.getElementById('saisonBar');
    assert.equal(info.hidden, true, 'Erklärung sollte zunächst zu sein');
    bar.onclick();
    assert.equal(info.hidden, false);
    bar.onclick();
    assert.equal(info.hidden, true);
  });

  test('Erklärung sagt ehrlich, was NICHT eingezeichnet wird', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const body = doc.getElementById('saisonBody').innerHTML;
    assert.match(body, /Krautfelder und Tiefenkanten/);
    assert.match(body, /nicht.*eingezeichnet|keine verlässlichen Daten/i,
      'Der Hinweis auf fehlende Daten fehlt – das ist die Kernzusage');
    assert.match(body, /Echolot/);
  });

  test('Erklärung zählt aktive Hotspots', async () => {
    await loadRegion(ctx, 'elbe');
    const body = doc.getElementById('saisonBody').innerHTML;
    assert.match(body, /\d+ von \d+ Hotspots/);
  });
});

describe('Schilf-Layer (OpenStreetMap)', () => {
  test('bei zu kleiner Zoomstufe wird der OSM-Server nicht befragt', async () => {
    let aufrufe = 0;
    const c = await startApp({
      leaflet: { zoom: 8 },
      fetchImpl: async (u) => { if (String(u).includes('overpass')) aufrufe++; throw new Error('offline'); },
    });
    const r = await c.app.schilfLaden();
    assert.equal(aufrufe, 0, 'Overpass darf bei Zoom 8 nicht abgefragt werden');
    assert.equal(r.grund, 'zoom');
    assert.match(c.document.getElementById('schilfStatus').textContent, /heranzoomen/);
    c.close();
  });

  test('Netzfehler wird ehrlich gemeldet und blockiert die Karte nicht', async () => {
    const c = await startApp({
      leaflet: { zoom: 14 },
      fetchImpl: async () => { throw new Error('offline'); },
    });
    const r = await c.app.schilfLaden();
    assert.equal(r.ok, false);
    const status = c.document.getElementById('schilfStatus').textContent;
    assert.match(status, /nicht abrufbar/i);
    assert.ok(!/kein Schilf|wächst kein/i.test(status),
      'Ein Netzfehler darf nicht als "hier wächst kein Schilf" verkauft werden');
    assert.ok(c.document.getElementById('saisonBar'), 'Karte steht weiterhin');
    c.close();
  });

  test('leeres OSM-Ergebnis wird als "nicht erfasst" formuliert, nicht als "kein Schilf"', async () => {
    const c = await startApp({
      leaflet: { zoom: 14 },
      fetchImpl: async () => ({ ok: true, json: async () => ({ elements: [] }) }),
    });
    const r = await c.app.schilfLaden();
    assert.equal(r.ok, true);
    assert.equal(r.anzahl, 0);
    const status = c.document.getElementById('schilfStatus').textContent;
    assert.match(status, /nicht erfasst|kennt hier keine kartierten/i);
    c.close();
  });

  test('gefundene Schilfflächen werden als Polygone eingeblendet', async () => {
    const elements = [{ type: 'way', geometry: [
      { lat: 53.30, lon: 12.99 }, { lat: 53.31, lon: 12.99 }, { lat: 53.31, lon: 13.00 }, { lat: 53.30, lon: 12.99 },
    ]}];
    const c = await startApp({
      leaflet: { zoom: 14 },
      fetchImpl: async () => ({ ok: true, json: async () => ({ elements }) }),
    });
    const r = await c.app.schilfLaden();
    assert.equal(r.ok, true);
    assert.equal(r.anzahl, 1, 'ein Polygon erwartet');
    assert.match(c.document.getElementById('schilfStatus').textContent, /1 Schilfflächen|1 Schilf/);
    c.close();
  });

  test('der Schilf-Schalter existiert im Werkzeuge-Menü', () => {
    assert.ok(doc.getElementById('schilfBtn'), 'Schalter fehlt');
  });
});
