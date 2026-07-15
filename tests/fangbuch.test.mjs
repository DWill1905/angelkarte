/* Tests des Fangbuchs: Speichern, Maßcheck, Statistik, Backup/Restore.
   Deckt die Bugs ab, die in dieser Session real aufgetreten sind. */
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion, tick } from './setup.mjs';

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; });
after(() => ctx?.close());
beforeEach(() => {
  app.state.fbMem.length = 0;
  app.fbRender(); // Liste neu zeichnen, sonst zeigen Tests Reste des Vorgängers
});

/** Trägt einen Fang über das echte Formular ein (wie ein Nutzer). */
async function fangEintragen({ fisch = 'Zander', laenge = '55', koeder = 'Gummifisch' } = {}) {
  doc.querySelector('[data-view="fangbuch"]').click();
  doc.getElementById('fbFisch').value = fisch;
  doc.getElementById('fbLaenge').value = laenge;
  doc.getElementById('fbKoeder').value = koeder;
  const sp = doc.getElementById('fbSpot');
  if (sp.options.length) sp.selectedIndex = 0;
  await doc.getElementById('fbSave').onclick();
  await tick(ctx.window, 40);
}

describe('Fang speichern und anzeigen', () => {
  test('ein gespeicherter Fang landet im Speicher UND in der Liste', async () => {
    await loadRegion(ctx, 'elbe');
    await fangEintragen({ fisch: 'Zander', laenge: '58' });

    assert.equal(app.state.fbMem.length, 1, 'Fang nicht im Speicher');
    const liste = doc.getElementById('fbList');
    assert.equal(liste.querySelectorAll('.fb-entry').length, 1,
      'Fang nicht gerendert – genau dieser Bug ließ Fänge nur im Export erscheinen');
    assert.match(liste.innerHTML, /Zander/);
  });

  test('leeres Fangbuch zeigt einen Empty-State', async () => {
    await loadRegion(ctx, 'elbe');
    doc.querySelector('[data-view="fangbuch"]').click();
    await tick(ctx.window, 30);
    assert.match(doc.getElementById('fbList').innerHTML, /Noch keine Fänge/);
  });

  test('mehrere Fänge werden alle gelistet', async () => {
    await loadRegion(ctx, 'elbe');
    await fangEintragen({ fisch: 'Zander', laenge: '55' });
    await fangEintragen({ fisch: 'Hecht', laenge: '70' });
    await fangEintragen({ fisch: 'Barsch', laenge: '28' });
    assert.equal(app.state.fbMem.length, 3);
    assert.equal(doc.getElementById('fbList').querySelectorAll('.fb-entry').length, 3);
  });
});

describe('Automatischer Fang-Kontext', () => {
  test('Wetter, Pegel und Beißfenster werden mitgeloggt', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 19.4, wind: 11, dir: 'SW', dirDeg: 225, press: 1008.2, trendVal: -1.9 };
    app.state.PEGEL = { value: 214, station: 'MAGDEBURG', dist: 3, wt: 17.6 };
    await fangEintragen();

    const ctxData = app.state.fbMem[0].ctx;
    assert.equal(ctxData.druck, 1008, 'Luftdruck');
    assert.equal(ctxData.trend, -1.9, 'Drucktrend');
    assert.match(ctxData.wind, /SW/, 'Windrichtung');
    assert.equal(ctxData.pegel, 214, 'Pegel');
    assert.equal(ctxData.wt, 18, 'Wassertemperatur');
    assert.equal(ctxData.temp, 19, 'Lufttemperatur');
    assert.equal(ctxData.region, 'elbe', 'Region');
    assert.ok('fenster' in ctxData, 'Beißfenster-Feld fehlt');
  });

  test('beissfensterJetzt liefert major, minor oder null', () => {
    const r = app.beissfensterJetzt(new Date());
    assert.ok(r === null || r === 'major' || r === 'minor', `unerwartet: ${r}`);
  });
});

describe('parseFangDatum – beide Formate', () => {
  test('deutsches Format (so wird gespeichert)', () => {
    const d = app.parseFangDatum('9.7.2026');
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 6);
    assert.equal(d.getDate(), 9);
  });
  test('ISO-Format (aus Alt-Backups)', () => {
    const d = app.parseFangDatum('2026-07-09');
    assert.equal(d.getMonth(), 6);
    assert.equal(d.getDate(), 9);
  });
  test('führende Nullen', () => {
    assert.equal(app.parseFangDatum('01.12.2025').getMonth(), 11);
  });
  test('Müll ergibt null statt Absturz', () => {
    assert.equal(app.parseFangDatum('abc'), null);
    assert.equal(app.parseFangDatum(''), null);
    assert.equal(app.parseFangDatum(null), null);
  });
});

describe('Statistik (Muster-Auswertung)', () => {
  const machFaenge = () => ([
    { datum: '2.5.2026', fisch: 'Zander', laenge: '55', spot: 'A', koeder: 'Gummi', ctx: { zeit: '20:00', fenster: 'major' } },
    { datum: '14.5.2026', fisch: 'Zander', laenge: '62', spot: 'A', koeder: 'Gummi', ctx: { zeit: '21:00', fenster: 'major' } },
    { datum: '3.6.2026', fisch: 'Hecht', laenge: '71', spot: 'B', koeder: 'Wobbler', ctx: { zeit: '07:00', fenster: 'minor' } },
    { datum: '11.6.2026', fisch: 'Barsch', laenge: '28', spot: 'C', koeder: 'Spinner', ctx: { zeit: '16:00', fenster: 'minor' } },
    { datum: '19.6.2026', fisch: 'Zander', laenge: '48', spot: 'A', koeder: 'Gummi', ctx: { zeit: '22:00', fenster: 'major' } },
    { datum: '1.7.2026', fisch: 'Barsch', laenge: '31', spot: 'C', koeder: 'Spinner', ctx: { zeit: '17:00', fenster: 'major' } },
    { datum: '4.7.2026', fisch: 'Hecht', laenge: '83', spot: 'B', koeder: 'Wobbler', ctx: { zeit: '06:00', fenster: 'minor' } },
    { datum: '5.7.2026', fisch: 'Zander', laenge: '59', spot: 'A', koeder: 'Köfi', ctx: { zeit: '23:00', fenster: 'major' } },
    { datum: '7.7.2026', fisch: 'Zander', laenge: '66', spot: 'A', koeder: 'Gummi', ctx: { zeit: '21:30', fenster: 'major' } },
  ]);

  test('Monatsstatistik erkennt das deutsche Datumsformat', () => {
    app.state.fbMem.push(...machFaenge());
    app.fbInsights();
    const h = doc.getElementById('fbInsights').innerHTML;
    assert.match(h, /Fängigste Monate/);
    assert.match(h, /Jul|Jun|Mai/, 'kein Monat erkannt – Datumsformat-Bug zurück?');
  });

  test('Artenverteilung listet die häufigste Art zuerst', () => {
    app.state.fbMem.push(...machFaenge());
    app.fbInsights();
    const h = doc.getElementById('fbInsights').innerHTML;
    assert.match(h, /Artenverteilung/);
    assert.ok(h.indexOf('Zander') < h.indexOf('Barsch'), 'Zander ist häufiger, muss zuerst stehen');
  });

  test('Beißfenster-Anteil wird berechnet', () => {
    app.state.fbMem.push(...machFaenge());
    app.fbInsights();
    const h = doc.getElementById('fbInsights').innerHTML;
    assert.match(h, /Beißfenster \(Solunar\)/);
    assert.match(h, /Major-Fenster/);
  });

  test('unter 8 Fängen keine Musterauswertung (zu wenig Daten)', () => {
    app.state.fbMem.push(...machFaenge().slice(0, 3));
    app.fbInsights();
    const h = doc.getElementById('fbInsights').innerHTML;
    assert.ok(!/Fängigste Monate/.test(h), 'Auswertung bei zu wenig Daten – unseriös');
  });
});

describe('Backup: Export und Import', () => {
  test('Import fügt hinzu, ohne Vorhandenes zu löschen (Merge)', async () => {
    app.state.fbMem.push(
      { datum: '1.7.2026', fisch: 'Zander', laenge: '55', spot: 'A', koeder: 'Gummi' },
      { datum: '2.7.2026', fisch: 'Hecht', laenge: '70', spot: 'B', koeder: 'Wobbler' },
    );
    const backup = { format: 'angelkarte-fangbuch', version: 1, faenge: [
      { datum: '1.7.2026', fisch: 'Zander', laenge: '55', spot: 'A', koeder: 'Gummi' }, // Duplikat
      { datum: '20.6.2026', fisch: 'Wels', laenge: '120', spot: 'B', koeder: 'Köfi' },
      { datum: '25.6.2026', fisch: 'Barsch', laenge: '30', spot: 'C', koeder: 'Spinner' },
    ]};
    const r = await app.fbRestore({ text: async () => JSON.stringify(backup) });

    assert.equal(r.neu, 2, 'zwei neue Fänge erwartet');
    assert.equal(r.duplikate, 1, 'ein Duplikat erwartet');
    assert.equal(app.state.fbMem.length, 4, 'Bestand wurde überschrieben statt gemerged');
    assert.ok(app.state.fbMem.some((e) => e.fisch === 'Hecht'), 'alter Fang verloren');
  });

  test('nach dem Import ist neuester Fang zuerst sortiert', async () => {
    app.state.fbMem.push({ datum: '1.1.2026', fisch: 'A', laenge: 1, spot: '', koeder: '' });
    await app.fbRestore({ text: async () => JSON.stringify({ faenge: [
      { datum: '15.6.2026', fisch: 'B', laenge: 1, spot: '', koeder: '' },
      { datum: '3.3.2026', fisch: 'C', laenge: 1, spot: '', koeder: '' },
    ]})});
    assert.equal(app.state.fbMem[0].datum, '15.6.2026');
    assert.equal(app.state.fbMem[2].datum, '1.1.2026');
  });

  test('kaputtes JSON lässt den Bestand unangetastet', async () => {
    app.state.fbMem.push({ datum: '1.7.2026', fisch: 'Zander', laenge: 50, spot: '', koeder: '' });
    const r = await app.fbRestore({ text: async () => '{kein json' });
    assert.equal(r.error, 'parse');
    assert.equal(app.state.fbMem.length, 1, 'Bestand darf nicht verloren gehen');
  });

  test('fremdes Format wird abgewiesen', async () => {
    const r = await app.fbRestore({ text: async () => JSON.stringify({ foo: 1 }) });
    assert.equal(r.error, 'format');
  });

  test('Backup ohne gültige Fänge wird abgewiesen', async () => {
    const r = await app.fbRestore({ text: async () => JSON.stringify({ faenge: [{ unsinn: true }] }) });
    assert.equal(r.error, 'leer');
  });
});

describe('Modell-Abgleich (Fangbuch gegen Modell)', () => {
  const mk = (n, { trend, fenster, wt }) => Array.from({ length: n }, (_, i) => ({
    id: i + 1, fisch: 'Zander', laenge: 60, spot: 'X', koeder: 'Gummi', datum: '1.7.2026', entnommen: false,
    ctx: { zeit: '20:00', mond: 'M', druck: 1010, trend, wind: 'SW', pegel: 250, wt, fenster },
  }));
  afterEach(() => { app.state.fbMem = []; });

  test('unter 12 Fängen wird kein Urteil gefällt', () => {
    app.state.fbMem = mk(5, { trend: -2.5, fenster: 'major', wt: 18 });
    const h = app.fbModellCheck();
    assert.match(h, /ab 12 Fängen/, 'bei dünner Datenlage darf es kein Urteil geben');
    assert.ok(!/passt zusammen/.test(h), 'kein Urteil bei zu wenig Daten');
  });

  test('modellkonforme Fänge werden bestätigt', () => {
    app.state.fbMem = mk(14, { trend: -2.5, fenster: 'major', wt: 18 });
    const h = app.fbModellCheck();
    assert.match(h, /passt zusammen/, 'Bestätigung fehlt');
    assert.ok(!/widerspricht/.test(h), 'darf hier nicht widersprechen');
  });

  test('widersprechende Fänge werden auch als Widerspruch benannt', () => {
    app.state.fbMem = mk(14, { trend: 3, fenster: null, wt: 2 });
    const h = app.fbModellCheck();
    assert.match(h, /widerspricht/, 'Widerspruch muss benannt werden – nicht schöngeredet');
    assert.ok(!/passt zusammen/.test(h), 'darf hier nichts bestätigen');
  });

  test('die fehlende Vergleichsbasis wird immer offengelegt', () => {
    app.state.fbMem = mk(14, { trend: -2.5, fenster: 'major', wt: 18 });
    const h = app.fbModellCheck();
    assert.match(h, /nicht die Stunden/, 'Caveat zu den fehlenden Nullfängen fehlt');
    assert.match(h, /nicht.*automatisch/, 'Hinweis auf bewusst kein Auto-Tuning fehlt');
  });
});
