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

describe('Fang teilen', () => {
  test('Text nennt Art, Länge, Spot, Datum – keine erfundenen Zusatzangaben', () => {
    const e = { id: 1, fisch: 'Zander', laenge: 58, spot: 'Rhein Mainz – Stadtstrecke', datum: '9.7.2026', koeder: '', entnommen: false };
    const t = app.fangTeilenText(e);
    assert.match(t, /Zander/);
    assert.match(t, /58 cm/);
    assert.match(t, /Rhein Mainz – Stadtstrecke/);
    assert.match(t, /9\.7\.2026/);
    assert.doesNotMatch(t, /Wasser|Luftdruck|Fenster/, 'ohne ctx dürfen keine Bedingungen erfunden werden');
  });

  test('Kontext (Wassertemp, Drucktrend, Beißfenster) fließt nur ein, wenn geloggt', () => {
    const e = {
      id: 2, fisch: 'Hecht', laenge: 70, spot: 'Woblitzsee', datum: '10.7.2026', koeder: 'Gummifisch', entnommen: true,
      ctx: { wt: 19, trend: -2.1, fenster: 'major' },
    };
    const t = app.fangTeilenText(e);
    assert.match(t, /Wasser 19°C/);
    assert.match(t, /fallender Luftdruck/);
    assert.match(t, /Major-Fenster/);
    assert.match(t, /Gummifisch/);
  });

  test('steigender statt fallender Druck taucht nicht als "fallender Luftdruck" auf', () => {
    const e = { id: 3, fisch: 'Barsch', laenge: 25, spot: 'x', datum: '1.1.2026', ctx: { trend: 1.8 } };
    assert.doesNotMatch(app.fangTeilenText(e), /fallender Luftdruck/);
  });

  test('ohne navigator.share/clipboard bleibt der Teilen-Button aus dem Fangbuch verborgen', async () => {
    await loadRegion(ctx, 'elbe');
    await fangEintragen({ fisch: 'Zander', laenge: '55' });
    /* jsdom kennt navigator.share/clipboard nicht - genau der Fall, den die App abfangen muss. */
    assert.equal(doc.getElementById('fbList').querySelectorAll('.fb-share').length, 0,
      'ohne Share-API darf kein totes Icon im Fangbuch stehen');
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

describe('Regionale Tageslimits im Maßcheck', () => {
  /** Wie fangEintragen, aber mit steuerbarem "entnommen" - der Standardhelfer lässt die
      Checkbox unverändert, die Tageslimits zählen aber nur entnommene Fänge. */
  async function entnommenEintragen(fisch, laenge) {
    doc.querySelector('[data-view="fangbuch"]').click();
    doc.getElementById('fbFisch').value = fisch;
    doc.getElementById('fbLaenge').value = String(laenge);
    doc.getElementById('fbEntnommen').checked = true;
    const sp = doc.getElementById('fbSpot');
    if (sp.options.length) sp.selectedIndex = 0;
    await doc.getElementById('fbSave').onclick();
    await tick(ctx.window, 40);
  }

  test('Erzgebirge Barsch: Teilquote über 30 cm greift, auch wenn das 10er-Gesamtlimit noch offen ist', async () => {
    await loadRegion(ctx, 'erzgebirge');
    for (let i = 0; i < 5; i++) await entnommenEintragen('Barsch', 32);
    doc.getElementById('fbFisch').value = 'Barsch';
    doc.getElementById('fbLaenge').value = '31';
    app.checkFang();
    const html = doc.getElementById('fbCheck').innerHTML;
    assert.match(html, /Teilquote über 30 cm erreicht \(5\/5\)/, 'Teilquote wird nicht erkannt');
    assert.match(html, /bad/, 'Hinweis muss als Verstoß (bad) markiert sein');
    /* Gesamtlimit (10) ist mit 5 Faengen noch laengst nicht erreicht - die Sperre kommt
       hier ausschliesslich aus der 30-cm-Teilquote. */
    assert.doesNotMatch(html, /Barsch-Tageslimit erreicht/);
  });

  test('Erzgebirge Barsch: unter der Teilquote bleibt es ein reiner Zähler', async () => {
    await loadRegion(ctx, 'erzgebirge');
    for (let i = 0; i < 3; i++) await entnommenEintragen('Barsch', 32);
    await entnommenEintragen('Barsch', 22);
    doc.getElementById('fbFisch').value = 'Barsch';
    doc.getElementById('fbLaenge').value = '20';
    app.checkFang();
    const html = doc.getElementById('fbCheck').innerHTML;
    assert.match(html, /Davon über 30 cm: 3\/5/);
    assert.doesNotMatch(html, /Teilquote über 30 cm erreicht/);
  });

  test('Main: Tageslimit (3 Raubfische) greift unabhängig vom Wochenlimit', async () => {
    await loadRegion(ctx, 'main');
    await entnommenEintragen('Barsch', 25);
    await entnommenEintragen('Hecht', 55);
    await entnommenEintragen('Zander', 50);
    doc.getElementById('fbFisch').value = 'Barsch';
    app.checkFang();
    const html = doc.getElementById('fbCheck').innerHTML;
    assert.match(html, /Tageslimit erreicht: 3\/3/, 'Main-Tageslimit wird nicht erkannt');
    assert.match(html, /bad/);
  });

  test('Main: Wochenlimit (10) greift auch, wenn das Tageslimit (3) längst nicht erreicht ist', async () => {
    await loadRegion(ctx, 'main');
    /* Direkt ins Fangbuch schreiben statt ueber die UI: das Wochenlimit braucht Faenge an
       verschiedenen Tagen, das Formular stempelt aber immer das heutige Datum. Alle 10 Faenge
       liegen 1-6 Tage zurueck (nie heute), damit das Tageslimit garantiert unberuehrt bleibt. */
    const heute = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(heute); d.setDate(d.getDate() - (1 + (i % 6)));
      app.state.fbMem.push({ id: 100 + i, fisch: 'Zander', laenge: 55, spot: 'x', koeder: 'y',
        datum: d.toLocaleDateString('de-DE'), entnommen: true });
    }
    doc.querySelector('[data-view="fangbuch"]').click();
    doc.getElementById('fbFisch').value = 'Barsch';
    doc.getElementById('fbLaenge').value = '25';
    app.checkFang();
    const html = doc.getElementById('fbCheck').innerHTML;
    assert.match(html, /Wochenlimit erreicht: 10\/10/, 'Main-Wochenlimit wird nicht erkannt');
    assert.doesNotMatch(html, /Tageslimit erreicht/, 'Heute wurde nichts entnommen - Tageslimit darf nicht greifen');
  });

  test('Elbe: Tageslimit (3 Hecht/Zander/Karpfen/Quappe gesamt) war komplett unenforced', async () => {
    await loadRegion(ctx, 'elbe');
    await entnommenEintragen('Hecht', 55);
    await entnommenEintragen('Zander', 55);
    await entnommenEintragen('Karpfen', 45);
    doc.getElementById('fbFisch').value = 'Quappe';
    app.checkFang();
    const html = doc.getElementById('fbCheck').innerHTML;
    assert.match(html, /Tageslimit erreicht: 3\/3/, 'Elbe-Tageslimit wird nicht erkannt');
    assert.match(html, /Hecht\/Zander\/Karpfen\/Quappe/);
    assert.match(html, /bad/);
  });

  test('Elbe: Barsch zählt nicht zum Hecht/Zander/Karpfen/Quappe-Limit (nicht gelistet)', async () => {
    await loadRegion(ctx, 'elbe');
    for (let i = 0; i < 5; i++) await entnommenEintragen('Barsch', 25);
    doc.getElementById('fbFisch').value = 'Hecht';
    doc.getElementById('fbLaenge').value = '55';
    app.checkFang();
    const html = doc.getElementById('fbCheck').innerHTML;
    assert.match(html, /Entnahme heute: 0\/3/, 'Barsch darf das Hecht/Zander/Karpfen/Quappe-Limit nicht auffüllen');
    assert.doesNotMatch(html, /Tageslimit erreicht/);
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
