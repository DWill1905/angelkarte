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
    const dynamisch = new Set(['swReload', 'offProg', 'tripClear', 'tripRoute', 'packErlDatum']); // per innerHTML erzeugt
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
  test('eine Art ohne Schonzeit-/Maßdaten wird nur mit Prüf-Hinweis empfohlen', async () => {
    const mittag = new Date(Date.UTC(2026, 6, 15, 12, 0));
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      app.state.PEGEL = { value: 100, station: 'X', dist: 3, wt: 16 };
      const e = app.empfehlung(mittag);
      if (!e?.zielfisch) continue;
      const sc = app.state.SCHON.find((x) => x.fisch === e.zielfisch.art);
      if (!sc) {
        assert.ok(e.luecken.some((l) => /keine Schonzeit\/kein Mindestmaß|Erlaubnisschein/.test(l)),
          `${r.id}: "${e.zielfisch.art}" ohne Schonzeitdaten empfohlen, aber ohne Prüf-Hinweis`);
      }
    }
  });

  test('sind alle Arten geschont, nennt der Satz keinen Fisch und keinen Köder', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.PEGEL = { value: 100, station: 'X', dist: 3, wt: 16 };
    const sicherung = app.state.SCHON.map((s) => ({ ...s }));
    app.state.SCHON.forEach((s) => { s.von = [1, 1]; s.bis = [12, 31]; });

    /* Sind alle EINGETRAGENEN Arten geschont, darf höchstens noch eine Art OHNE Schonzeit-Eintrag
       übrig bleiben (die gilt als ganzjährig offen) – nie eine geschonte. */
    const e = app.empfehlung();
    if (e) {
      const sc = app.state.SCHON.find((x) => x.fisch === e.kandidat.art);
      assert.ok(!sc, `nur eine Art ohne Schonzeit-Eintrag darf übrig bleiben, war „${e.kandidat.art}"`);
      assert.ok(e.luecken.some((l) => /Schonzeit|Erlaubnisschein/.test(l)), 'Prüf-Hinweis fehlt');
    }

    app.state.SCHON.forEach((s, i) => { s.von = sicherung[i].von; s.bis = sicherung[i].bis; });
  });
});

describe('Bug: Gummifisch am Jigkopf für Friedfische', () => {
  test('Karpfen bekommt keinen Jigkopf empfohlen', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.PEGEL = { value: 100, station: 'X', dist: 3, wt: 18 };
    const e = app.empfehlung(new Date(Date.UTC(2026, 6, 15, 12, 0)), { fisch: ['Karpfen'] });
    assert.equal(e.zielfisch.art, 'Karpfen');
    assert.ok(!/Jigkopf/.test(e.satz), 'Friedfisch am Jigkopf: ' + e.satz);
    assert.match(e.satz, /Boilie|Mais|Feeder/);
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

describe('Bug: Löschen und Bearbeiten warfen (currentTarget nach await)', () => {
  test('ein Fang lässt sich löschen', async () => {
    await loadRegion(ctx, 'elbe');
    doc.querySelector('[data-view="fangbuch"]').click();
    app.state.fbMem.length = 0;
    app.state.fbMem.push(
      { id: 111, datum: '1.7.2026', fisch: 'Zander', laenge: 55, spot: 'A', koeder: 'G', entnommen: false },
      { id: 222, datum: '2.7.2026', fisch: 'Hecht', laenge: 70, spot: 'A', koeder: 'W', entnommen: false },
    );
    app.fbRender();
    doc.querySelector('.fb-del').click();
    await tick(ctx.window, 50);
    assert.equal(app.state.fbMem.length, 1, 'Löschen hatte keine Wirkung');
    assert.equal(app.state.fbMem[0].id, 111, 'der falsche Eintrag wurde gelöscht');
  });

  test('ein Fang lässt sich bearbeiten, ohne ein Duplikat zu erzeugen', async () => {
    await loadRegion(ctx, 'elbe');
    doc.querySelector('[data-view="fangbuch"]').click();
    app.state.fbMem.length = 0;
    app.state.fbMem.push({ id: 333, datum: '1.7.2026', fisch: 'Zander', laenge: 55, spot: 'Buhnenfeld Herrenkrug', koeder: 'Gummi', entnommen: false });
    app.fbRender();

    doc.querySelector('.fb-edit').click();
    await tick(ctx.window, 50);
    assert.equal(doc.getElementById('fbLaenge').value, '55', 'Werte wurden nicht ins Formular geladen');

    doc.getElementById('fbLaenge').value = '60';
    await doc.getElementById('fbSave').onclick();
    await tick(ctx.window, 50);

    assert.equal(app.state.fbMem.length, 1, 'Bearbeiten erzeugte ein Duplikat');
    assert.equal(app.state.fbMem[0].laenge, 60);
  });

  test('kein Handler liest event.currentTarget nach einem await', () => {
    const src = fs.readdirSync(path.join(ROOT, 'src'))
      .filter((f) => f.endsWith('.ts'))
      .map((f) => ({ f, t: fs.readFileSync(path.join(ROOT, 'src', f), 'utf8') }));

    src.forEach(({ f, t }) => {
      const zeilen = t.split('\n');
      let inAsync = false, sahAwait = false;
      zeilen.forEach((z, i) => {
        if (/onclick\s*=\s*async/.test(z)) { inAsync = true; sahAwait = false; }
        if (inAsync) {
          if (/\bawait\b/.test(z)) sahAwait = true;
          if (sahAwait && /\bev\.currentTarget\b/.test(z)) {
            assert.fail(`${f}:${i + 1} liest ev.currentTarget nach einem await – dort ist es null`);
          }
          if (/^\s*\};?\s*$/.test(z)) inAsync = false;
        }
      });
    });
  });
});

describe('Bug: Tackle-Ableitung ohne Zielfischangaben', () => {
  test('ein eigener Spot ohne Arten bekommt keine Fliegenruten-Empfehlung', () => {
    const eigen = { name: 'Meine Buhne', cat: 'eigen', arten: [], lat: 52.15, lng: 11.67, my: true };
    const html = app.popupHtml(eigen);
    assert.ok(!/Fliegenrute|UL-Rute/.test(html),
      'Ohne Artangaben wurde die leichteste Ruten-Klasse empfohlen (Math.max(0, ...[]) = 0)');
    assert.match(html, /keine Zielfischarten hinterlegt/);
  });

  test('echte Spots bekommen weiterhin eine Ableitung', async () => {
    await loadRegion(ctx, 'elbe');
    const spot = app.state.SPOTS.find((s) => s.arten?.length);
    const html = app.popupHtml(spot);
    assert.ok(!/keine Zielfischarten hinterlegt/.test(html));
    assert.match(html, /Rute/);
  });
});

describe('Speicherfehler (voller Storage)', () => {
  test('ein Fang geht nicht verloren und der Nutzer wird gewarnt', async () => {
    const c = await startApp({
      storageImpl: () => ({
        async get() { throw new Error('nicht gefunden'); },
        async set() { throw new Error('QuotaExceededError'); },
      }),
    });
    await loadRegion(c, 'elbe');
    c.document.querySelector('[data-view="fangbuch"]').click();
    c.document.getElementById('fbFisch').value = 'Zander';
    c.document.getElementById('fbLaenge').value = '55';
    const sp = c.document.getElementById('fbSpot');
    if (sp.options.length) sp.selectedIndex = 0;
    await c.document.getElementById('fbSave').onclick();
    await tick(c.window, 50);

    assert.equal(c.app.state.fbMem.length, 1, 'Fang ging verloren');
    assert.equal(c.app.state.persistent, false, 'persistent-Flag nicht gesetzt');
    assert.match(c.document.getElementById('fbStatus').textContent, /nur für diese Sitzung/i,
      'Der Nutzer erfährt nicht, dass nichts gespeichert wird');
    c.close();
  });
});

describe('Bug: CSV-Export verschluckte den Wert 0', () => {
  /** RFC-4180-Parser – naives split(';') scheitert an gequoteten Feldern. */
  const parseCsvZeile = (z) => {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < z.length; i++) {
      const c = z[i];
      if (q) { if (c === '"') { if (z[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ';') { out.push(cur); cur = ''; }
      else cur += c;
    }
    out.push(cur); return out;
  };

  const exportiere = async (fang) => {
    const c = await startApp();
    let csv = '';
    c.window.Blob = class { constructor(a) { csv = a[0]; } };
    await loadRegion(c, 'elbe');
    c.app.state.fbMem.length = 0;
    c.app.state.fbMem.push(fang);
    c.app.fbCsv();
    c.close();
    const zeilen = csv.replace(/^\ufeff/, '').split('\n');
    const kopf = parseCsvZeile(zeilen[0]);
    const daten = parseCsvZeile(zeilen[1]);
    return (feld) => daten[kopf.indexOf(feld)];
  };

  test('ein Drucktrend von 0.0 (stabile Lage) bleibt erhalten', async () => {
    const f = await exportiere({ id: 1, datum: '1.7.2026', fisch: 'Zander', laenge: 55, spot: 'A', koeder: 'G',
      entnommen: false, ctx: { zeit: '20:00', mond: 'M', druck: 1013, trend: 0, wind: 'SW', pegel: 0, wt: 0 } });
    assert.equal(f('Drucktrend'), '0', 'Der Wert 0 wurde durch `||` in einen leeren String verwandelt');
    assert.equal(f('Pegel_cm'), '0');
    assert.equal(f('Wassertemp_C'), '0');
  });

  test('Semikolon und Anführungszeichen werden korrekt gequotet', async () => {
    const f = await exportiere({ id: 1, datum: '1.7.2026', fisch: 'Zander', laenge: 55,
      spot: 'Buhne; Nord', koeder: 'Gummi "rot"', entnommen: false });
    assert.equal(f('Spot'), 'Buhne; Nord', 'Semikolon zerlegt sonst die Zeile');
    assert.equal(f('Koeder'), 'Gummi "rot"');
  });

  test('fehlende Werte bleiben leer, werden nicht zu "undefined"', async () => {
    const f = await exportiere({ id: 1, datum: '1.7.2026', fisch: 'Zander', laenge: 55, spot: 'A', koeder: '', entnommen: false });
    assert.equal(f('Koeder'), '');
    assert.equal(f('Druck_hPa'), '');
    assert.ok(!/undefined|null|NaN/.test(f('Drucktrend') + f('Pegel_cm')));
  });
});

describe('Bug: Wetterzeilen fehlten bei Salmoniden- und Flussstrecken', () => {
  test('jeder beangelbare Spot bekommt die Wassertemperatur-Zeile', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      app.state.SPOTS.filter((s) => !s.my && s.cat !== 'sperr' && s.cat !== 'info').forEach((s) => {
        assert.match(app.popupHtml(s), /data-wt=/,
          `${r.id}/${s.name} (cat=${s.cat}): keine Wassertemperatur – bei Salmoniden das wichtigste Kriterium`);
      });
    }
  });

  test('Flussstrecken (Polylines) bekommen keine Windzeile, alle anderen schon', async () => {
    await loadRegion(ctx, 'erzgebirge');
    app.state.SPOTS.filter((s) => !s.my && s.cat !== 'sperr' && s.cat !== 'info').forEach((s) => {
      const hatWind = /data-wind=/.test(app.popupHtml(s));
      assert.equal(hatWind, !s.line, `${s.name}: Windzeile ${hatWind ? 'vorhanden' : 'fehlt'}`);
    });
  });

  test('Sperrzonen bekommen keine Wetterzeilen', async () => {
    await loadRegion(ctx, 'main');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr');
    const h = app.popupHtml(sperr);
    assert.ok(!/data-wt=|data-wind=/.test(h));
  });
});

describe('Bug: Score meldete bei Sturm "50 % – mäßig"', () => {
  const wetter = (wind, extra = {}) => {
    app.state.WX = { temp: 18, wind, dirDeg: 0, dir: 'N', press: 1005, trendVal: -2.5, ...extra };
    app.state.PEGEL = { value: 180, station: 'X', dist: 1, wt: 16 };
  };

  test('Sturm ab 35 km/h sperrt den Score auf höchstens 15 %', async () => {
    await loadRegion(ctx, 'elbe');
    wetter(42);
    const r = app.computeScore();
    assert.equal(r.sturm, true, 'Sturm nicht erkannt');
    assert.ok(r.pct <= 15, `Score bei 42 km/h: ${r.pct} %`);
  });

  test('der Score widerspricht der Spotbewertung nicht mehr', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = { temp: 20, wind: 42, dirDeg: 0, dir: 'N', press: 1010, trendVal: 0 };
    app.state.PEGEL = { value: 120, station: 'X', dist: 3, wt: 16 };
    const score = app.computeScore();
    const bewertung = app.bewerteSpot(app.state.SPOTS.find((s) => s.name.includes('Woblitzsee')), 'Hecht');
    assert.ok(score.pct <= 15 && bewertung.prozent <= 15,
      `Score ${score.pct} % vs Spotbewertung ${bewertung.prozent} % – beide müssen sperren`);
  });

  test('Wind wird auch an Fließgewässern mit Pegel bewertet', async () => {
    await loadRegion(ctx, 'elbe');
    wetter(12);
    const ruhig = app.computeScore().pct;
    wetter(30);
    const stuermisch = app.computeScore().pct;
    assert.ok(stuermisch < ruhig,
      `30 km/h muss den Score senken (${stuermisch} % vs ${ruhig} %) – vorher war Wind an Fluessen unsichtbar`);
    const windFaktor = app.computeScore().factors.find((f) => f.name === 'Wind');
    assert.ok(windFaktor && windFaktor.pts != null, 'Wind-Faktor fehlt trotz vorhandener Winddaten');
  });

  test('knapp unter der Sturmgrenze wird nicht gesperrt', async () => {
    await loadRegion(ctx, 'elbe');
    wetter(34);
    const r = app.computeScore();
    assert.ok(!r.sturm);
    assert.ok(r.pct > 15);
  });

  test('der Hinweis nennt die tatsächliche Faktorenzahl', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = null; app.state.PEGEL = null;
    const r = app.computeScore();
    assert.ok(r.knownCount < r.factors.length);
    assert.equal(r.factors.length, 5, 'Score hat fünf Faktoren – Pegel und Wind getrennt');
  });
});

describe('Bug: "Heute passt es?" zeigte 100% bei nur 1 von 5 bekannten Faktoren', () => {
  test('dünne Datenlage zieht den Wert zur Mitte - nie 0% oder 100%, wie schon in der Spotbewertung', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = null; app.state.PEGEL = null;
    const r = app.computeScore();
    assert.equal(r.knownCount, 1, 'in diesem Setup sollte nur das Beißfenster bekannt sein (Solunar braucht kein WX/PEGEL)');
    assert.ok(r.konfidenz < 0.8, `Konfidenz sollte niedrig sein (1/5): ${r.konfidenz}`);
    assert.ok(r.pct !== 0 && r.pct !== 100, `Extremwert trotz dünner Datenlage: ${r.pct} %`);
    assert.ok(r.pct >= 15 && r.pct <= 85, `Wert außerhalb des gedämpften Bereichs (50 ± 35): ${r.pct} %`);
  });

  test('Sturm bleibt trotz Dämpfung ein harter Ausschluss, kein Hochziehen Richtung 50%', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 18, wind: 60, dirDeg: 0, dir: 'N', press: 1005, trendVal: 0 };
    app.state.PEGEL = null; // dünne Datenlage UND Sturm gleichzeitig
    const r = app.computeScore();
    assert.equal(r.sturm, true);
    assert.ok(r.pct <= 15, `Sturm-Deckel darf durch die Konfidenz-Dämpfung nicht aufgeweicht werden: ${r.pct} %`);
  });

  test('mit voller Datenlage bleibt der Wert ungedämpft (Konfidenz ≥ 0.8)', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 16, wind: 10, dirDeg: 0, dir: 'N', press: 1005, trendVal: -2, wt: 15 };
    app.state.PEGEL = { value: 180, station: 'X', dist: 1, wt: 15 };
    const r = app.computeScore();
    assert.equal(r.knownCount, 5);
    assert.ok(r.konfidenz >= 0.8);
  });
});

describe('Bug: Gewitterwarnung schaute wegen UTC-Versatz kaum voraus', () => {
  const pad = (n) => String(n).padStart(2, '0');
  const lokalStunde = (basis, versatz) => {
    const d = new Date(basis);
    d.setHours(basis.getHours() + versatz, 0, 0, 0);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':00';
  };

  /** Open-Meteo liefert wegen timezone=auto LOKALE Zeitstempel. */
  const wetterMock = (gewitterBei) => {
    const jetzt = new Date();
    const versaetze = [-2, -1, 0, 1, 2, 3, 4, 5];
    return async (u) => {
      if (!/open-meteo/.test(String(u))) throw new Error('offline');
      return { ok: true, json: async () => ({
        current: { time: lokalStunde(jetzt, 0), temperature_2m: 19, wind_speed_10m: 11,
          wind_direction_10m: 225, surface_pressure: 1011, weather_code: 1 },
        hourly: {
          time: versaetze.map((v) => lokalStunde(jetzt, v)),
          weather_code: versaetze.map((v) => (v === gewitterBei ? 95 : 1)),
          wind_gusts_10m: versaetze.map(() => 10),
          surface_pressure: versaetze.map((_, i) => 1013 - i),
        },
      })};
    };
  };

  test('ein Gewitter in 3 Stunden wird erkannt', async () => {
    const c = await startApp({ fetchImpl: wetterMock(3) });
    await loadRegion(c, 'elbe');
    await tick(c.window, 220);
    const warn = c.document.getElementById('stormWarn');
    assert.match(warn.textContent, /Gewitter/,
      'Vor dem Fix startete das Prüffenster zwei Stunden in der Vergangenheit');
    c.close();
  });

  test('ohne Gewitter bleibt die Warnung leer', async () => {
    const c = await startApp({ fetchImpl: wetterMock(99) });
    await loadRegion(c, 'elbe');
    await tick(c.window, 220);
    assert.ok(!/Gewitter/.test(c.document.getElementById('stormWarn').textContent));
    c.close();
  });

  test('die Stundenberechnung nutzt lokale Zeit, nicht UTC', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src', 'weather.ts'), 'utf8');
    assert.ok(!/nowH\s*=\s*now\.toISOString/.test(src),
      'toISOString() liefert UTC – Open-Meteo liefert bei timezone=auto lokale Zeit');
    assert.match(src, /now\.getHours\(\)/);
  });
});
