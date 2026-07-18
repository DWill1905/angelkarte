/* Tests für Werkzeuge: bisher nur der Tagesscore des Wochen-Ausblicks (tagesScore).
   Reine Funktion, additiv, mit Sturm als Ausschlusskriterium - wie überall sonst im Modell.

   Wichtig: die Tests laufen an jedem beliebigen Kalendertag, die echte Mondphase ist also
   nicht kontrollierbar. Der Mondbonus wird deshalb überall über mondStaerke() MITGERECHNET
   statt als fester Erwartungswert angenommen - sonst wären die Tests an manchen Tagen (nahe
   Neu-/Vollmond) flaky. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion } from './setup.mjs';

let ctx, app;
before(async () => { ctx = await startApp(); app = ctx.app; });
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
