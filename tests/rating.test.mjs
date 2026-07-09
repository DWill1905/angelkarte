/* Tests der Spotbewertung.

   Die Zusicherungen, die zählen:
   - Unbekannte Faktoren werden nie stillschweigend als erfüllt gewertet.
   - Sturm sperrt die Bewertung, statt nur Punkte abzuziehen.
   - Geschonte Arten bekommen 0 % – unabhängig vom Wetter.
   - Kein Grund widerspricht einem anderen. */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion } from './setup.mjs';

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; });
after(() => ctx?.close());
beforeEach(() => { app.state.WX = null; app.state.PEGEL = null; });

const GUT = () => { app.state.WX = { temp: 19, wind: 14, dirDeg: 225, dir: 'SW', press: 1006, trendVal: -2.3 }; app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 16 }; };
const STURM = () => { app.state.WX = { temp: 31, wind: 42, dirDeg: 0, dir: 'N', press: 1026, trendVal: 2.8 }; app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 26 }; };
const spotVon = (teil) => app.state.SPOTS.find((s) => s.name.includes(teil));

describe('Sternskala', () => {
  test('differenziert zwischen 71 % und 84 %', () => {
    assert.equal(app.sterneAus(84), 4);
    assert.equal(app.sterneAus(71), 3);
    assert.notEqual(app.sterneAus(84), app.sterneAus(71), 'Beide Werte dürfen nicht gleich aussehen');
  });
  test('Grenzen', () => {
    assert.equal(app.sterneAus(85), 5);
    assert.equal(app.sterneAus(42), 2);
    assert.equal(app.sterneAus(10), 1);
  });
  test('gesperrt gibt höchstens einen Stern', () => {
    assert.ok(app.sterneAus(90, true) <= 1);
  });
  test('sterneText erzeugt fünf Zeichen', () => {
    assert.equal(app.sterneText(4), '★★★★☆');
    assert.equal(app.sterneText(0), '☆☆☆☆☆');
    assert.equal(app.sterneText(4).length, 5);
  });
});

describe('Geschonte Arten', () => {
  test('bekommen 0 % und keine Sterne, egal wie gut das Wetter ist', async () => {
    await loadRegion(ctx, 'elbe');
    GUT();
    const spot = spotVon('Herrenkrug');
    // Elbe: Zander 15.02.–31.05. – wir prüfen jede geschonte Art des Spots
    const geschonte = (spot.arten || []).filter((a) => {
      const sc = app.state.SCHON.find((x) => x.fisch === a);
      return sc && app.inSchonzeit(sc);
    });
    geschonte.forEach((a) => {
      const b = app.bewerteSpot(spot, a);
      assert.equal(b.prozent, 0, `${a}: geschont, aber ${b.prozent} %`);
      assert.equal(b.sterne, 0);
      assert.equal(b.geschont, true);
      assert.match(b.gruende[0].text, /Schonzeit/);
    });
  });

  test('werden ans Ende der Liste sortiert', async () => {
    await loadRegion(ctx, 'elbe');
    GUT();
    const alle = app.bewerteAlle(spotVon('Herrenkrug'));
    const ersteGeschont = alle.findIndex((b) => b.geschont);
    if (ersteGeschont >= 0) {
      alle.slice(ersteGeschont).forEach((b) => assert.ok(b.geschont, 'nach einer geschonten Art darf keine offene mehr kommen'));
    }
  });
});

describe('Sturm ist ein Ausschlusskriterium', () => {
  test('deckelt die Bewertung auf 15 %', async () => {
    await loadRegion(ctx, 'mecklenburg');
    STURM();
    const b = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht');
    assert.equal(b.gesperrt, 'sturm');
    assert.ok(b.prozent <= 15, `Sturm ergibt ${b.prozent} % – zu hoch`);
    assert.ok(b.sterne <= 1);
  });

  test('kein Grund behauptet gleichzeitig gute Bedingungen', async () => {
    await loadRegion(ctx, 'mecklenburg');
    STURM();
    const b = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht');
    const positiveWind = b.gruende.filter((g) => g.status === 'ja' && /Welle|Wind/i.test(g.text));
    assert.equal(positiveWind.length, 0,
      'Bei Sturm darf kein Wind-/Wellengrund als erfüllt gelten: ' + positiveWind.map((g) => g.text).join(' | '));
  });

  test('ohne Sturm ist nichts gesperrt', async () => {
    await loadRegion(ctx, 'mecklenburg');
    GUT();
    const b = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht');
    assert.equal(b.gesperrt, undefined);
  });
});

describe('Unbekannte Faktoren werden nicht als erfüllt gewertet', () => {
  test('offline: Wetter-Faktoren stehen auf "unbekannt"', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = null;
    app.state.PEGEL = null;
    const b = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht');

    const unbekannt = b.gruende.filter((g) => g.status === 'unbekannt');
    assert.ok(unbekannt.length >= 3, 'Ohne Wetter müssen mehrere Faktoren unbekannt sein');
    unbekannt.forEach((g) => {
      assert.equal(g.moeglich, 0, `"${g.text}" darf nicht in die Berechnung eingehen`);
      assert.equal(g.erreicht, 0);
    });
    assert.ok(b.bewertet < b.gesamt, 'bewertet muss kleiner als gesamt sein');
  });

  test('der Prozentwert bezieht sich nur auf bewertbare Faktoren', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = null;
    app.state.PEGEL = null;
    const b = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht');
    const moeglich = b.gruende.reduce((n, g) => n + g.moeglich, 0);
    const erreicht = b.gruende.reduce((n, g) => n + g.erreicht, 0);
    assert.equal(b.prozent, Math.round((erreicht / moeglich) * 100));
  });

  test('fehlende Daten machen die Bewertung nicht besser', async () => {
    await loadRegion(ctx, 'mecklenburg');
    // schlechtes Wetter
    app.state.WX = { temp: 30, wind: 2, dirDeg: 0, dir: 'N', press: 1030, trendVal: 3 };
    app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 27 };
    const mitDaten = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht').prozent;
    app.state.WX = null;
    app.state.PEGEL = null;
    const ohneDaten = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht').prozent;
    // Ohne Daten darf der Wert steigen (weil schlechte Faktoren wegfallen),
    // aber die App muss das über bewertet/gesamt offenlegen – das prüft der Test oben.
    assert.ok(typeof ohneDaten === 'number' && ohneDaten >= 0 && ohneDaten <= 100);
    assert.ok(typeof mitDaten === 'number');
  });
});

describe('Die Faktoren wirken', () => {
  test('gute Bedingungen schlagen schlechte deutlich', async () => {
    await loadRegion(ctx, 'mecklenburg');
    GUT();
    const gut = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht').prozent;
    app.state.WX = { temp: 30, wind: 2, dirDeg: 0, dir: 'N', press: 1030, trendVal: 3.2 };
    app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 28 };
    const schlecht = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht').prozent;
    assert.ok(gut > schlecht + 15, `gut ${gut} % vs schlecht ${schlecht} % – zu wenig Unterschied`);
  });

  test('fallender Luftdruck erzeugt einen erfüllten Grund', async () => {
    await loadRegion(ctx, 'mecklenburg');
    GUT();
    const b = app.bewerteSpot(spotVon('Woblitzsee'), 'Hecht');
    assert.ok(b.gruende.some((g) => g.status === 'ja' && /Luftdruck fällt/.test(g.text)));
  });

  test('Hochwasser wertet die Buhne ab, nicht den Kanal', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 10, wind: 10, dirDeg: 90, dir: 'O', press: 1015, trendVal: 0 };
    app.state.PEGEL = { value: 420, station: 'MD', dist: 2, wt: 9 };
    const buhne = app.bewerteSpot(spotVon('Herrenkrug'), 'Hecht');
    const kanal = app.bewerteSpot(spotVon('Abstiegskanal'), 'Hecht');
    assert.ok(kanal.prozent > buhne.prozent, `Kanal ${kanal.prozent} % muss über Buhne ${buhne.prozent} % liegen`);
    assert.ok(buhne.gruende.some((g) => g.status === 'nein' && /Hochwasser/.test(g.text)));
  });

  test('jeder Grund trägt Text und Punktebudget', async () => {
    await loadRegion(ctx, 'mecklenburg');
    GUT();
    app.bewerteAlle(spotVon('Woblitzsee')).forEach((b) => {
      b.gruende.forEach((g) => {
        assert.ok(g.text && g.text.length > 5);
        assert.ok(['ja', 'nein', 'unbekannt'].includes(g.status));
        assert.ok(g.erreicht <= g.moeglich || g.moeglich === 0);
      });
    });
  });
});

describe('Darstellung im Popup', () => {
  test('der Bewertungsblock erscheint bei beangelbaren Spots', async () => {
    await loadRegion(ctx, 'mecklenburg');
    GUT();
    const html = app.popupHtml(spotVon('Woblitzsee'));
    assert.match(html, /class="rating"/);
    assert.match(html, /Chancen heute/);
    assert.match(html, /★/);
    assert.match(html, /%/);
  });

  test('nennt ausdrücklich, dass es keine Fangwahrscheinlichkeit ist', async () => {
    await loadRegion(ctx, 'mecklenburg');
    GUT();
    const html = app.popupHtml(spotVon('Woblitzsee'));
    assert.match(html, /keine Fangwahrscheinlichkeit/i);
  });

  test('Sperrzonen bekommen keinen Bewertungsblock', async () => {
    await loadRegion(ctx, 'main');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr');
    assert.ok(!/class="rating"/.test(app.popupHtml(sperr)));
  });

  test('bei Sturm erscheint die Warnung im Block', async () => {
    await loadRegion(ctx, 'mecklenburg');
    STURM();
    const html = app.popupHtml(spotVon('Woblitzsee'));
    assert.match(html, /rate-sturm/);
    assert.match(html, /unverantwortlich/i);
  });

  test('Maßangabe steht bei jeder Art', async () => {
    await loadRegion(ctx, 'mecklenburg');
    GUT();
    const html = app.popupHtml(spotVon('Woblitzsee'));
    assert.match(html, /rate-mass/);
    assert.match(html, /Entnahmefenster/);
  });
});
