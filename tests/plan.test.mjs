/* Tests für "Heute würde ich genau hier anfangen".

   Die Empfehlung darf nie: eine geschonte Art nennen, in eine Sperrzone schicken,
   einen Ort erfinden oder fehlende Signale verschweigen. Genau das wird hier geprüft. */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { startApp, loadRegion, tick, ROOT } from './setup.mjs';

let ctx, app, doc;
let peilung, himmelsrichtung, winkelDiff, istAuflandig;
before(async () => {
  ctx = await startApp(); app = ctx.app; doc = ctx.document;
  ({ peilung, himmelsrichtung, winkelDiff, istAuflandig } = app);
});
after(() => ctx?.close());
beforeEach(() => { app.state.WX = null; app.state.PEGEL = null; app.state.userPos = null; });

const SOMMER_MV = () => { app.state.WX = { temp: 21, wind: 14, dirDeg: 225, dir: 'SW', press: 1006, trendVal: -2.1 }; app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 18 }; };

describe('Geometrie: Peilung und Wind', () => {
  test('peilung: nach Norden ist 0°, nach Osten 90°', () => {
    assert.ok(Math.abs(peilung(50, 8, 51, 8) - 0) < 1);
    assert.ok(Math.abs(peilung(50, 8, 50, 9) - 90) < 1);
    assert.ok(Math.abs(peilung(50, 8, 49, 8) - 180) < 1);
  });

  test('himmelsrichtung benennt korrekt', () => {
    assert.equal(himmelsrichtung(0), 'Nord');
    assert.equal(himmelsrichtung(90), 'Ost');
    assert.equal(himmelsrichtung(225), 'Südwest');
  });

  test('winkelDiff kennt den kürzeren Weg über 0°', () => {
    assert.equal(winkelDiff(350, 10), 20);
    assert.equal(winkelDiff(10, 350), 20);
    assert.equal(winkelDiff(0, 180), 180);
  });

  test('Südwestwind macht das Ostufer auflandig, nicht das Westufer', () => {
    const spot = { lat: 53.30, lng: 12.99 };
    const ost = { lat: 53.30, lng: 13.01 };   // östlich vom Zentrum
    const west = { lat: 53.30, lng: 12.97 };  // westlich
    assert.equal(istAuflandig(spot, ost, 225), true, 'SW-Wind treibt nach NO – Ostufer ist auflandig');
    assert.equal(istAuflandig(spot, west, 225), false, 'Westufer liegt im Windschatten');
  });

  test('istAuflandig liefert null ohne Koordinaten', () => {
    assert.equal(istAuflandig({ lat: undefined }, { lat: 53, lng: 13 }, 225), null);
  });
});

describe('Die Empfehlung ist konkret und aus den Daten', () => {
  test('nennt Zeit, Ort, Fisch, Köder und Jigkopf in einem Satz', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    const e = app.empfehlung();
    assert.ok(e, 'keine Empfehlung erzeugt');
    assert.match(e.satz, /Starte/);
    assert.match(e.satz, /\d{1,2}:\d{2}/, 'keine Uhrzeit');
    assert.match(e.satz, /Jigkopf/, 'kein Jigkopfgewicht');
    assert.match(e.satz, /Gummifisch/, 'kein Köder');
  });

  test('der empfohlene Ort existiert wirklich in den Daten', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    const e = app.empfehlung();
    const spot = app.state.SPOTS.find((s) => s.name === e.kandidat.spot.name);
    assert.ok(spot, 'Spot existiert nicht');
    if (e.kandidat.hotspot) {
      const h = (spot.hotspots || []).find((x) => x.name === e.kandidat.hotspot.name);
      assert.ok(h, 'Hotspot erfunden!');
      assert.equal(h.lat, e.kandidat.lat);
    }
  });

  test('jede Empfehlung ist begründet', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      SOMMER_MV();
      const e = app.empfehlung();
      if (!e) continue;
      assert.ok(e.faktoren.length > 0, `${r.id}: keine Faktoren`);
      e.faktoren.forEach((f) => {
        assert.ok(f.text && f.text.length > 5, `${r.id}: leerer Faktor`);
        assert.equal(typeof f.punkte, 'number');
      });
    }
  });
});

describe('Rechtliche Grenzen werden nie überschritten', () => {
  test('empfiehlt niemals eine geschonte Art', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      SOMMER_MV();
      const e = app.empfehlung();
      if (!e?.zielfisch) continue;
      const sc = app.state.SCHON.find((x) => x.fisch === e.zielfisch.art);
      if (sc) assert.equal(app.inSchonzeit(sc), false,
        `${r.id}: ${e.zielfisch.art} ist aktuell geschont und wird trotzdem empfohlen!`);
    }
  });

  test('schickt niemals in eine Sperrzone', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      SOMMER_MV();
      const alle = app.kandidaten();
      alle.forEach((k) => {
        assert.notEqual(k.spot.cat, 'sperr', `${r.id}: Sperrzone "${k.spot.name}" als Kandidat!`);
        assert.notEqual(k.spot.cat, 'info');
      });
    }
  });

  test('nennt Mindestmaß bzw. Entnahmefenster des Zielfischs', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    const e = app.empfehlung();
    assert.ok(e.massHinweis, 'Maßangabe fehlt');
    assert.match(e.massHinweis, /cm/);
    assert.match(e.massHinweis, /Entnahmefenster/, 'MV hat Entnahmefenster – das muss dabeistehen');
  });
});

describe('Ehrlichkeit über fehlende Signale', () => {
  test('ohne Wetter wird das offen gesagt', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = null;
    app.state.PEGEL = null;
    const e = app.empfehlung();
    assert.ok(e.luecken.some((l) => /Wetter/i.test(l)), 'Fehlendes Wetter nicht benannt');
    assert.ok(e.luecken.some((l) => /Pegel|Wassertemperatur/i.test(l)));
  });

  test('ohne Standort wird die Entfernung nicht vorgetäuscht', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.userPos = null;
    const e = app.empfehlung();
    assert.ok(e.luecken.some((l) => /Standort/i.test(l)));
    assert.ok(!e.faktoren.some((f) => /km/.test(f.text)), 'Entfernungsfaktor ohne Standort!');
  });

  test('ein Bootssee wird als solcher gekennzeichnet', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    const e = app.empfehlung();
    if (e.kandidat.spot.zugang === 'boot') {
      assert.ok(e.luecken.some((l) => /Boot/i.test(l)));
    }
  });

  test('bei schwacher Beleglage wird gewarnt', async () => {
    await loadRegion(ctx, 'giessen');
    SOMMER_MV();
    const e = app.empfehlung();
    if (e.kandidat.spot.verif === 'C') {
      assert.ok(e.luecken.some((l) => /Beleglage/i.test(l)));
    }
  });
});

describe('Die Signale wirken tatsächlich', () => {
  test('Hochwasser schickt in den Hafen statt auf die Buhne', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 9, wind: 20, dirDeg: 90, dir: 'O', press: 1020, trendVal: 0.2 };
    app.state.PEGEL = { value: 420, station: 'MD', dist: 2, wt: 8 };
    const hoch = app.empfehlung();

    app.state.PEGEL = { value: 180, station: 'MD', dist: 2, wt: 8 };
    const normal = app.empfehlung();

    assert.notEqual(hoch.kandidat.ort, normal.kandidat.ort,
      'Hochwasser muss die Empfehlung verändern');
    assert.match(hoch.kandidat.spot.name, /Kanal|Hafen|Zollelbe/i,
      'Bei Hochwasser gehört die Empfehlung in Kanal oder Hafen');
    assert.ok(hoch.faktoren.some((f) => /Hochwasser/i.test(f.text)));
  });

  test('fallender Luftdruck wird positiv gewertet', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = { temp: 20, wind: 5, dirDeg: 180, dir: 'S', press: 1000, trendVal: -2.5 };
    app.state.PEGEL = { value: 100, station: 'X', dist: 3, wt: 17 };
    const e = app.empfehlung();
    assert.ok(e.faktoren.some((f) => /Luftdruck fällt/.test(f.text) && f.punkte > 0));
  });

  test('kaltes Wasser wählt Hecht statt Zander', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 6, wind: 5, dirDeg: 0, dir: 'N', press: 1015, trendVal: 0 };
    app.state.PEGEL = { value: 180, station: 'MD', dist: 2, wt: 7 };
    const e = app.empfehlung();
    assert.equal(e.zielfisch.art, 'Hecht', 'Bei 7 °C ist Zander träge, Hecht aktiv');
    assert.match(e.zielfisch.grund, /optimum/i);
  });

  test('warmes Wasser bevorzugt Zander vor Hecht', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 24, wind: 5, dirDeg: 0, dir: 'N', press: 1015, trendVal: 0 };
    app.state.PEGEL = { value: 180, station: 'MD', dist: 2, wt: 21 };
    const e = app.empfehlung();
    assert.equal(e.zielfisch.art, 'Zander', 'Bei 21 °C ist Hecht über dem Optimum');
  });

  test('die Startzeit liegt in der Zukunft oder läuft gerade', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    const e = app.empfehlung();
    const jetzt = Date.now();
    assert.ok(e.zeit.von.getTime() >= jetzt - 60000, 'Startzeit liegt in der Vergangenheit');
  });
});

describe('Darstellung', () => {
  test('der Dialog zeigt Satz, Begründung und Lücken', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    app.openPlan();
    const body = doc.getElementById('planBody').innerHTML;
    assert.match(body, /plan-satz/);
    assert.match(body, /Warum dort/);
    assert.match(body, /Warum dann/);
    assert.match(body, /Was ich nicht weiß/);
    assert.match(body, /kein Orakel/, 'Der Ehrlichkeits-Disclaimer fehlt');
  });

  test('der Menü-Eintrag steht ganz oben', () => {
    const btns = [...doc.querySelectorAll('#toolsDlg .fbtool')].map((b) => b.id);
    assert.equal(btns[0], 'tPlan', 'Die Kernfunktion gehört an die erste Stelle');
  });
});
