/* Tests für Werkzeuge: bisher nur der Tagesscore des Wochen-Ausblicks (tagesScore).
   Reine Funktion, additiv, mit Sturm als Ausschlusskriterium - wie überall sonst im Modell.

   Wichtig: die Tests laufen an jedem beliebigen Kalendertag, die echte Mondphase ist also
   nicht kontrollierbar. Der Mondbonus wird deshalb überall über mondStaerke() MITGERECHNET
   statt als fester Erwartungswert angenommen - sonst wären die Tests an manchen Tagen (nahe
   Neu-/Vollmond) flaky. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion } from './setup.mjs';

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; });
after(() => ctx?.close());

/** Baut einen Tag mit einem Major-Fenster genau "jetzt" (± 30 min), damit wxAt() aus
    state.WX (Aktuellwerte) statt aus einer nicht vorhandenen Stundenreihe liest. */
function tagMitFensterJetzt() {
  const jetzt = new Date();
  return { date: jetzt, majors: [{ from: new Date(jetzt.getTime() - 30 * 60e3), to: new Date(jetzt.getTime() + 30 * 60e3), type: 'major', label: 'Test' }] };
}
function mondBonus(day) { return app.mondStaerke(day.date.getTime()) > 0.6 ? 1 : 0; }

describe('tagesScore – Wochen-Ausblick', () => {
  before(async () => { await loadRegion(ctx, 'elbe'); });

  test('Major-Fenster + fallender Druck ergeben Punkte und nennen beide Gründe', () => {
    app.state.WX = { temp: 18, wind: 10, dirDeg: 200, dir: 'SW', press: 1010, trendVal: -2.5, code: 3 };
    const day = tagMitFensterJetzt();
    const s = app.tagesScore(day, null, 0);
    assert.equal(s.punkte, 3.5 + mondBonus(day));
    assert.ok(s.gruende.some((g) => /Major-Fenster/.test(g)));
    assert.ok(s.gruende.some((g) => /fallender Luftdruck/.test(g)));
    assert.equal(s.sturm, false);
  });

  test('Tag ohne Major-Fenster punktet niedriger als einer mit Fenster (am selben Tag, gleicher Mondbonus)', () => {
    app.state.WX = { temp: 18, wind: 10, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 };
    const tag = tagMitFensterJetzt();
    const mitFenster = app.tagesScore(tag, null, 0);
    const ohneFenster = app.tagesScore({ date: tag.date, majors: [] }, null, 0);
    assert.ok(mitFenster.punkte > ohneFenster.punkte);
    assert.ok(!ohneFenster.gruende.some((g) => /Major-Fenster/.test(g)));
  });

  test('Sturm deckelt den Score und ersetzt die Gründe, egal wie stark das Fenster ist', () => {
    app.state.WX = { temp: 18, wind: 10, dirDeg: 200, dir: 'SW', press: 1010, trendVal: -2.5, code: 3 };
    const day = tagMitFensterJetzt();
    const wx = { wind_speed_10m_max: [40] };
    const s = app.tagesScore(day, wx, 0);
    assert.equal(s.sturm, true);
    assert.ok(s.punkte <= 0.5, `Sturm muss den Score deckeln (${s.punkte})`);
    assert.equal(s.gruende.length, 1);
    assert.match(s.gruende[0], /Sturm/);
  });

  test('ohne Wetterdaten kein erfundener Druckbonus', () => {
    app.state.WX = null;
    const day = tagMitFensterJetzt();
    const s = app.tagesScore(day, null, 0);
    assert.equal(s.punkte, 2 + mondBonus(day), 'nur Major-Fenster (+ evtl. Mondbonus), kein Druckbonus ohne Wetterdaten');
    assert.ok(s.gruende.includes('Major-Fenster'));
    assert.ok(!s.gruende.some((g) => /Luftdruck/.test(g)), 'ohne Wetter darf kein Druckgrund auftauchen');
  });
});

/** Setzt das Erlaubnisschein-Datum über den echten Formularpfad (Packliste-Dialog),
    nicht direkt am Speicher vorbei - dieselbe Route wie ein Nutzer sie nimmt. */
async function setzeErlaubnisDatum(offsetTage) {
  await app.openPack();
  const input = doc.getElementById('packErlDatum');
  const d = new Date(); d.setDate(d.getDate() + offsetTage);
  input.value = d.toISOString().slice(0, 10);
  await input.onchange();
  return d.toLocaleDateString('de-DE');
}

describe('wochenIcs – Kalender-Export der Wochen-Vorschau', () => {
  test('ein Major-Fenster wird zu genau einem VEVENT mit passenden Zeiten', () => {
    const from = new Date('2026-08-01T18:30:00Z');
    const to = new Date('2026-08-01T19:30:00Z');
    const days = [{ date: from, majors: [{ from, to, type: 'major', label: 'Mond-Höchststand' }] }];
    const { ics, count } = app.wochenIcs(days, 'Erzgebirge');
    assert.equal(count, 1);
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /BEGIN:VEVENT/);
    assert.match(ics, /SUMMARY:.*Mond-Höchststand/);
    assert.match(ics, /DTSTART:20260801T183000Z/);
    assert.match(ics, /DTEND:20260801T193000Z/);
    assert.match(ics, /LOCATION:Erzgebirge/);
  });

  test('mehrere Tage/Fenster ergeben ebenso viele VEVENTs, ohne Region bleibt LOCATION weg', () => {
    const d1 = new Date('2026-08-01T05:00:00Z'), d2 = new Date('2026-08-01T06:00:00Z');
    const d3 = new Date('2026-08-02T18:00:00Z'), d4 = new Date('2026-08-02T19:00:00Z');
    const days = [
      { date: d1, majors: [{ from: d1, to: d2, type: 'major', label: 'A' }] },
      { date: d3, majors: [{ from: d3, to: d4, type: 'major', label: 'B' }] },
    ];
    const { ics, count } = app.wochenIcs(days);
    assert.equal(count, 2);
    assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
    assert.ok(!ics.includes('LOCATION:'));
  });

  test('Tage ohne Major-Fenster erzeugen keine VEVENTs (count 0, gültiges leeres Kalendergerüst)', () => {
    const { ics, count } = app.wochenIcs([{ date: new Date(), majors: [] }]);
    assert.equal(count, 0);
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /END:VCALENDAR/);
    assert.ok(!ics.includes('BEGIN:VEVENT'));
  });

  test('Sonderzeichen im Fenster-Label werden ICS-konform escaped (kein kaputtes Kalenderformat)', () => {
    const from = new Date(), to = new Date(from.getTime() + 3600e3);
    const days = [{ date: from, majors: [{ from, to, type: 'major', label: 'Sonnenuntergang, Zone; Test' }] }];
    const { ics } = app.wochenIcs(days);
    assert.match(ics, /Sonnenuntergang\\,\s*Zone\\;\s*Test/);
  });
});

describe('Erlaubnisschein-Ablaufwarnung', () => {
  test('ohne gesetztes Datum bleibt die Warnung aus', async () => {
    await loadRegion(ctx, 'elbe');
    await app.checkErlaubnisAblauf();
    const el = doc.getElementById('erlaubnisWarn');
    assert.ok(!el.classList.contains('show'));
    assert.equal(el.innerHTML, '');
  });

  test('abgelaufenes Datum zeigt eine "abgelaufen"-Warnung', async () => {
    await loadRegion(ctx, 'main');
    const dtxt = await setzeErlaubnisDatum(-3);
    const el = doc.getElementById('erlaubnisWarn');
    assert.ok(el.classList.contains('show'));
    assert.match(el.innerHTML, /abgelaufen/);
    assert.ok(el.innerHTML.includes(dtxt));
  });

  test('Ablauf in 5 Tagen zeigt eine Vorwarnung (innerhalb 14 Tage)', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const dtxt = await setzeErlaubnisDatum(5);
    const el = doc.getElementById('erlaubnisWarn');
    assert.ok(el.classList.contains('show'));
    assert.match(el.innerHTML, /läuft am/);
    assert.ok(el.innerHTML.includes(dtxt));
  });

  test('Ablauf in 60 Tagen: keine Warnung (weit genug weg)', async () => {
    await loadRegion(ctx, 'giessen');
    await setzeErlaubnisDatum(60);
    const el = doc.getElementById('erlaubnisWarn');
    assert.ok(!el.classList.contains('show'));
  });

  test('Datum bleibt beim erneuten Öffnen der Packliste erhalten', async () => {
    await loadRegion(ctx, 'mainz');
    await app.openPack();
    const input = doc.getElementById('packErlDatum');
    input.value = '2027-03-01';
    await input.onchange();
    await app.openPack();
    assert.equal(doc.getElementById('packErlDatum').value, '2027-03-01');
  });
});
