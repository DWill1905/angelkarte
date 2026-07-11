/* Tests für "Heute würde ich genau hier anfangen".

   Die Empfehlung darf nie: eine geschonte Art nennen, in eine Sperrzone schicken,
   einen Ort erfinden oder fehlende Signale verschweigen. Genau das wird hier geprüft. */
import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
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

describe('Zielfisch-Filter steuert die Empfehlung (Mehrfachauswahl)', () => {
  /* Filter nie zwischen den Tests hängen lassen – andere Blöcke erwarten "kein Filter". */
  afterEach(() => { app.state.fishSel.length = 0; });

  test('Filter auf Hecht: Planer empfiehlt nur Hecht-Gewässer und Zielfisch Hecht', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    app.state.fishSel.length = 0; app.state.fishSel.push('Hecht');
    const liste = app.kandidaten();
    assert.ok(liste.length, 'kein Kandidat trotz Hechtbestand');
    /* Kein Kandidat mit anderer Zielart – "auf Hecht" heißt auch: nicht auf Zander. */
    assert.ok(liste.every((k) => k.art === 'Hecht'), 'Fremdart trotz Hecht-Filter empfohlen');
    /* Jeder empfohlene Spot führt tatsächlich Hecht. */
    assert.ok(liste.every((k) => (k.spot.arten || []).includes('Hecht')), 'Gewässer ohne Hecht empfohlen');
    const e = app.empfehlung();
    assert.equal(e.kandidat.art, 'Hecht');
    assert.match(e.satz, /auf Hecht/);
  });

  test('Mehrfachauswahl Hecht+Zander: nur diese Arten, Vereinigung der Gewässer', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    app.state.fishSel.length = 0; app.state.fishSel.push('Hecht', 'Zander');
    const liste = app.kandidaten();
    assert.ok(liste.length, 'kein Kandidat für Hecht/Zander');
    assert.ok(liste.every((k) => k.art === 'Hecht' || k.art === 'Zander'), 'Art außerhalb der Auswahl');
    /* jeder Spot führt mindestens eine der beiden gewählten Arten */
    assert.ok(liste.every((k) => (k.spot.arten || []).some((a) => a === 'Hecht' || a === 'Zander')));
  });

  test('ohne Filter bleibt die Auswahl breiter als mit Hecht-Filter', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    app.state.fishSel.length = 0;
    const alleArten = new Set(app.kandidaten().map((k) => k.art));
    app.state.fishSel.push('Hecht');
    const nurHecht = new Set(app.kandidaten().map((k) => k.art));
    assert.ok(alleArten.size >= nurHecht.size);
    assert.deepEqual([...nurHecht], ['Hecht']);
  });

  test('Filter auf eine in der Region fehlende Art: keine Empfehlung statt falscher Art', async () => {
    await loadRegion(ctx, 'mecklenburg');
    SOMMER_MV();
    app.state.fishSel.length = 0; app.state.fishSel.push('Äsche');
    const liste = app.kandidaten();
    /* Entweder gar kein Kandidat – oder, falls doch Äsche vorkommt, nur Äsche. Nie ein Ersatzfisch. */
    assert.ok(liste.every((k) => k.art === 'Äsche'));
  });
});

describe('Planer-Seite: Fisch- und Gewässerfilter', () => {
  afterEach(() => { app.state.fishSel.length = 0; });

  test('Gewässerfilter schränkt auf die gewählten Spots ein', async () => {
    await loadRegion(ctx, 'mainz');
    const name = 'Industriehafen Mombach – Hafenausfahrt';
    const liste = app.kandidaten(new Date(), { gewaesser: [name] });
    assert.ok(liste.length, 'kein Kandidat für das gewählte Gewässer');
    assert.ok(liste.every((k) => k.spot.name === name), 'Fremdgewässer trotz Gewässerfilter');
  });

  test('Seiten-Fischfilter ist unabhängig vom Kartenfilter', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.fishSel.length = 0; app.state.fishSel.push('Zander'); // Karte: Zander
    const e = app.empfehlung(new Date(), { fisch: ['Hecht'] });     // Seite: Hecht
    assert.ok(e, 'keine Empfehlung');
    assert.equal(e.kandidat.art, 'Hecht');
  });

  test('leerer Seiten-Fischfilter = alle Arten, nicht der Kartenfilter', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.fishSel.length = 0; app.state.fishSel.push('Hecht');
    const arten = new Set(app.kandidaten(new Date(), { fisch: [] }).map((k) => k.art));
    assert.ok(arten.size > 1, 'leerer Seitenfilter darf nicht auf den Kartenfilter zurückfallen');
  });

  test('Kombination Fisch + Gewässer greift zusammen', async () => {
    await loadRegion(ctx, 'mainz');
    const name = 'Industriehafen Mombach – Hafenausfahrt'; // führt Zander, keinen Hecht
    const zander = app.kandidaten(new Date(), { fisch: ['Zander'], gewaesser: [name] });
    assert.ok(zander.every((k) => k.spot.name === name && k.art === 'Zander'));
    const hecht = app.kandidaten(new Date(), { fisch: ['Hecht'], gewaesser: [name] });
    assert.equal(hecht.length, 0, 'Hecht an einem Nicht-Hecht-Gewässer darf nichts liefern');
  });

  test('openPlan baut Fisch- und Gewässer-Chips', async () => {
    await loadRegion(ctx, 'mainz');
    app.openPlan();
    const fish = doc.getElementById('planFishChips');
    const gew = doc.getElementById('planGewChips');
    assert.ok(fish && fish.querySelectorAll('.chip').length > 1, 'keine Fisch-Chips');
    assert.ok(gew && gew.querySelectorAll('.chip').length > 1, 'keine Gewässer-Chips');
    const c = doc.getElementById('planClose'); if (c && c.click) c.click();
  });
});

describe('Strömung & Blei', () => {
  afterEach(() => { app.state.fishSel.length = 0; });
  const MITTAG = () => new Date(Date.UTC(2026, 6, 15, 12, 0));
  const flussSpot = () => app.state.SPOTS.find((s) => s.wasser === 'fluss' && s.cat !== 'sperr' && !s.my && (s.arten || []).includes('Zander'));

  test('Hochwasser → schweres Blei bzw. Ränder', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.WX = { temp: 20, wind: 8, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 };
    app.state.PEGEL = { value: 460, station: 'Mainz', dist: 3, wt: 16, abfluss: 3200 }; // > warnAb 400
    const e = app.empfehlung(MITTAG(), { gewaesser: [flussSpot().name] });
    assert.ok(e && e.stroemung, 'kein Strömungshinweis');
    assert.match(e.stroemung, /Hochwasser|40–80|Ränder/);
  });

  test('normaler Pegel → leichtester Kopf mit Grundkontakt in 5–8 s, Abfluss sichtbar', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.WX = { temp: 20, wind: 8, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 };
    app.state.PEGEL = { value: 200, station: 'Mainz', dist: 3, wt: 16, abfluss: 1400 };
    const e = app.empfehlung(MITTAG(), { gewaesser: [flussSpot().name] });
    assert.match(e.stroemung, /5–8 s/);
    assert.match(e.stroemung, /m³\/s/);
  });

  test('stehendes Gewässer bekommt keinen Strömungshinweis', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = { temp: 20, wind: 8, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 };
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 18 };
    const seeSpot = app.state.SPOTS.find((s) => (s.wasser === 'see-flach' || s.wasser === 'see-tief') && s.cat !== 'sperr' && !s.my && (s.arten || []).length);
    const e = app.empfehlung(MITTAG(), { gewaesser: [seeSpot.name] });
    assert.equal(e.stroemung, null);
  });

  test('strömungsliebende Art profitiert, meidende verliert (viel Zug)', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.WX = { temp: 20, wind: 8, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 };
    app.state.PEGEL = { value: 460, station: 'Mainz', dist: 3, wt: 18, abfluss: 3200 };
    const spot = flussSpot();
    const g = (t) => (t.gruende || []).find((x) => /Strömung|Zug|Hochwasser|Ränder/.test(x.text));
    const barbe = g(app.bewerteSpot(spot, 'Barbe', MITTAG()));
    const brachse = g(app.bewerteSpot(spot, 'Brachse', MITTAG()));
    assert.ok(barbe && barbe.status === 'ja', 'Barbe (liebt Strömung) sollte positiv gewertet werden');
    assert.ok(brachse && brachse.status === 'nein', 'Brachse (meidet Strömung) sollte negativ gewertet werden');
  });
});

describe('Empfehlung: Startfenster, Köder & Begründung', () => {
  afterEach(() => { app.state.fishSel.length = 0; });
  const MITTAG = () => new Date(Date.UTC(2026, 6, 15, 12, 0));

  test('nachtaktive Art bekommt die Nacht als Startfenster (kein Mittagsfenster)', () => {
    const z = app.startzeitFor(50.0, 8.3, MITTAG(), { nacht: true });
    assert.equal(z.label, 'Nacht');
    assert.ok(z.von.getTime() > MITTAG().getTime(), 'Startzeit sollte in der Abenddämmerung/Nacht liegen');
  });

  test('dämmerungsbetonte Art bekommt die Abenddämmerung', () => {
    const z = app.startzeitFor(50.0, 8.3, MITTAG(), { daemmerung: true });
    assert.equal(z.label, 'Abenddämmerung');
  });

  test('bestes Fenster heute liegt nicht unter der Chance jetzt', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 19 };
    app.state.WX = { temp: 24, wind: 2, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 0 }; // klar+windstill
    const e = app.empfehlung(MITTAG(), { fisch: ['Zander'] });
    assert.ok(e, 'keine Empfehlung');
    assert.ok(e.chanceFenster >= e.chance, `Fenster ${e.chanceFenster} darf nicht unter jetzt ${e.chance} liegen`);
    assert.match(e.zeit.label + ' ' + e.zeit.grund, /dämmerung|nacht/i);
  });

  test('trübes Wasser → Schock-/UV-Farbe im Köder', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 19 };
    app.state.WX = { temp: 22, wind: 10, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 63 }; // Regen
    const e = app.empfehlung(MITTAG(), { fisch: ['Zander'] });
    assert.match(e.koeder, /Schockfarbe|UV/);
  });

  test('klares, helles Wasser → natürliches Dekor', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 19 };
    app.state.WX = { temp: 22, wind: 2, dirDeg: 200, dir: 'SW', press: 1020, trendVal: 0, code: 0 }; // klar+windstill
    const e = app.empfehlung(MITTAG(), { fisch: ['Zander'] });
    assert.match(e.koeder, /natürlich/i);
  });

  test('Zielfisch-Begründung nennt neben der Temperatur einen echten Treiber', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 19 };
    app.state.WX = { temp: 22, wind: 10, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 }; // bedeckt
    const e = app.empfehlung(MITTAG(), { fisch: ['Zander'] });
    assert.match(e.zielfisch.grund, /dazu:/);
  });
});

describe('Wassertemperatur-Trend', () => {
  afterEach(() => { app.state.fishSel.length = 0; });
  const TAG = () => new Date(Date.UTC(2026, 6, 15, 12, 0));
  const setWx = () => { app.state.WX = { temp: 18, wind: 10, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 }; };

  test('Erwärmung schlägt Abkühlung (Zander unter dem Optimum)', async () => {
    await loadRegion(ctx, 'mainz'); setWx();
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Zander') && s.cat !== 'sperr' && !s.my);
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 9, wtTrend: 2 };  // kalt, erwärmt sich
    const warm = app.bewerteSpot(spot, 'Zander', TAG()).prozent;
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 9, wtTrend: -2 }; // kalt, kühlt weiter ab
    const kalt = app.bewerteSpot(spot, 'Zander', TAG()).prozent;
    assert.ok(warm > kalt, `Erwärmung ${warm} % muss über Abkühlung ${kalt} % liegen`);
  });

  test('Kälteeinbruch bremst den wärmeliebenden Wels', async () => {
    await loadRegion(ctx, 'mainz'); setWx();
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Wels') && s.cat !== 'sperr' && !s.my);
    const nacht = new Date(Date.UTC(2026, 6, 15, 23, 30)); // Wels ist tagsüber gedeckelt
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 20, wtTrend: 0 };
    const stabil = app.bewerteSpot(spot, 'Wels', nacht).prozent;
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 20, wtTrend: -3 };
    const b = app.bewerteSpot(spot, 'Wels', nacht);
    assert.ok(b.prozent < stabil, `Kälteeinbruch ${b.prozent} % muss unter stabil ${stabil} % liegen`);
    assert.match(b.gruende.map((g) => g.text).join(' | '), /Kälteeinbruch/);
  });

  test('ohne Historie bleibt der Trend neutral (unbekannt, kein Effekt)', async () => {
    await loadRegion(ctx, 'mainz'); setWx();
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Zander') && s.cat !== 'sperr' && !s.my);
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 18 }; // kein wtTrend
    const b = app.bewerteSpot(spot, 'Zander', TAG());
    assert.ok(b.gruende.some((g) => /Trend unbekannt/.test(g.text)), 'Trend-Achse müsste unbekannt sein');
  });
});

describe('Wetter-dynamische, artspezifische Bewertung', () => {
  afterEach(() => { app.state.fishSel.length = 0; });
  const TAG = () => new Date(Date.UTC(2026, 6, 15, 12, 0)); // heller Tag

  test('Zander (lichtscheu): bedeckt schlägt grelle Flaute', async () => {
    await loadRegion(ctx, 'mainz');
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Zander') && s.cat !== 'sperr' && !s.my);
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 18 };
    app.state.WX = { temp: 22, wind: 3, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 0 }; // klar, windstill
    const klar = app.bewerteSpot(spot, 'Zander', TAG()).prozent;
    app.state.WX = { temp: 22, wind: 3, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 }; // bedeckt
    const bedeckt = app.bewerteSpot(spot, 'Zander', TAG()).prozent;
    assert.ok(bedeckt > klar, `bedeckt ${bedeckt} % muss über klar+windstill ${klar} % liegen (Zander lichtscheu)`);
  });

  test('Barsch (Sichträuber): Sonne + Kräuselung ist top', async () => {
    await loadRegion(ctx, 'mainz');
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Barsch') && s.cat !== 'sperr' && !s.my);
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 16 };
    app.state.WX = { temp: 18, wind: 12, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 1 }; // sonnig + Welle
    const sicht = app.bewerteSpot(spot, 'Barsch', TAG()).prozent;
    app.state.WX = { temp: 18, wind: 12, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 63 }; // Dauerregen
    const regen = app.bewerteSpot(spot, 'Barsch', TAG()).prozent;
    assert.ok(sicht >= regen, `Sichträuber bei Sonne+Welle (${sicht} %) darf nicht schlechter sein als Dauerregen (${regen} %)`);
  });

  test('weather_code fließt als Licht-Achse in die Gründe ein', async () => {
    await loadRegion(ctx, 'mainz');
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Zander') && s.cat !== 'sperr' && !s.my);
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 18 };
    app.state.WX = { temp: 22, wind: 3, dirDeg: 200, dir: 'SW', press: 1015, trendVal: 0, code: 3 };
    const b = app.bewerteSpot(spot, 'Zander', TAG());
    assert.ok(b.gruende.some((g) => /Licht|bedeckt|Welle/.test(g.text)), 'Licht-Achse fehlt in den Gründen');
  });

  test('druckempfindlicher Zander: stabiler Druck ist ideal', async () => {
    await loadRegion(ctx, 'mainz');
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Zander') && s.cat !== 'sperr' && !s.my);
    app.state.PEGEL = { value: 200, station: 'X', dist: 3, wt: 18 };
    app.state.WX = { temp: 22, wind: 10, dirDeg: 200, dir: 'SW', press: 1016, trendVal: 0, code: 3 };
    const b = app.bewerteSpot(spot, 'Zander', TAG());
    assert.ok(b.gruende.some((g) => /Luftdruck stabil.*empfindlich/.test(g.text)), 'kein artspezifischer Druck-Grund für Zander');
  });
});

describe('Nachtaktive Arten werden tagsüber nicht empfohlen', () => {
  afterEach(() => { app.state.fishSel.length = 0; });

  test('Aal-Bewertung ist mittags niedrig und nachts hoch', async () => {
    await loadRegion(ctx, 'mainz');
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Aal') && s.cat !== 'sperr' && !s.my);
    assert.ok(spot, 'kein Aal-Gewässer in Mainz');
    const tag = new Date(Date.UTC(2026, 6, 15, 12, 0));    // ~14 Uhr MESZ – heller Tag
    const nacht = new Date(Date.UTC(2026, 6, 15, 23, 30)); // ~01:30 MESZ – Nacht
    const bTag = app.bewerteSpot(spot, 'Aal', tag);
    const bNacht = app.bewerteSpot(spot, 'Aal', nacht);
    assert.ok(bNacht.prozent > bTag.prozent, `Nacht ${bNacht.prozent} % muss über Tag ${bTag.prozent} % liegen`);
    const grundTag = (bTag.gruende || []).map((g) => g.text).join(' | ');
    assert.match(grundTag, /nachtaktive Art|Mitten am Tag/, 'Tages-Bewertung benennt die Nachtaktivität nicht');
  });

  test('Filter auf Aal bringt mittags nur eine niedrige Chance', async () => {
    await loadRegion(ctx, 'mainz');
    const tag = new Date(Date.UTC(2026, 6, 15, 12, 0));
    const e = app.empfehlung(tag, { fisch: ['Aal'] });
    if (e) assert.ok(e.chance <= 30, `Aal mittags sollte niedrig sein, war ${e.chance} %`);
  });

  test('nachtaktiv wirkt auch gegen ein laufendes Solunar-Fenster', async () => {
    /* Ein Tageslicht-Solunarfenster darf Aal nicht auf „ja" heben. */
    await loadRegion(ctx, 'mainz');
    const spot = app.state.SPOTS.find((s) => (s.arten || []).includes('Aal') && s.cat !== 'sperr' && !s.my);
    const tag = new Date(Date.UTC(2026, 6, 15, 12, 0));
    const b = app.bewerteSpot(spot, 'Aal', tag);
    const zeit = (b.gruende || []).find((g) => /Tag|nachtaktive|Beißfenster|Dämmerung/.test(g.text || ''));
    assert.ok(zeit && zeit.status !== 'ja', 'Zeit-Achse steht mittags auf „ja" trotz Nachtaktivität');
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
    /* Friedfische (Aal, Karpfen) bekommen keinen Jigkopf – der Satz nennt dann ihren Köder. */
    assert.match(e.satz, /Jigkopf|Tauwurm|Boilie|Feeder|Made|Brotflocke/, 'kein Köder im Satz');
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
    assert.match(e.massHinweis, /cm|Maß|–/, 'Maßangabe unbrauchbar: ' + e.massHinweis);
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

  test('der Standort beeinflusst die Empfehlung nicht', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.userPos = null;
    const ohne = app.empfehlung();
    app.state.userPos = [52.15, 11.67];
    const mit = app.empfehlung();
    app.state.userPos = null;
    assert.equal(ohne.kandidat.ort, mit.kandidat.ort, 'Standort verändert die Ortswahl');
    assert.ok(!ohne.faktoren.some((f) => /km/.test(f.text)) && !mit.faktoren.some((f) => /km/.test(f.text)),
      'Entfernungsfaktor im Ranking – Standort darf nicht einfließen');
    assert.ok(!mit.luecken.some((l) => /Standort/i.test(l)), 'Standort-Lücke, obwohl der Standort keine Rolle spielt');
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
    const mittag = new Date(Date.UTC(2026, 6, 15, 12, 0)); // fest: Temperatur-Logik, nicht Tageszeit
    const e = app.empfehlung(mittag);
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
    app.state.PEGEL = null; /* echte Lücke erzwingen (kein Pegel) – die Standort-Lücke gibt es nicht mehr */
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

describe('Konsistenz: Empfehlung und Spotbewertung sagen dasselbe', () => {
  const bedingungen = () => {
    app.state.WX = { temp: 19, wind: 14, dirDeg: 225, dir: 'SW', press: 1006, trendVal: -2.1 };
    app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 16 };
  };

  test('die Basis-Chance ist exakt der Wert aus bewerteSpot()', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      bedingungen();
      const e = app.empfehlung();
      if (!e) continue;
      const b = app.bewerteSpot(e.kandidat.spot, e.kandidat.art, new Date(), e.kandidat.hotspot);
      assert.equal(e.kandidat.basis, b.prozent,
        `${r.id}: Plan zeigt ${e.kandidat.basis} %, das Popup ${b.prozent} % – zwei Zahlen für dasselbe`);
    }
  });

  test('die empfohlene Art ist an diesem Ort die beste oder gleichauf', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      bedingungen();
      const e = app.empfehlung();
      if (!e) continue;
      const alle = app.bewerteAlle(e.kandidat.spot, new Date(), e.kandidat.hotspot).filter((b) => !b.geschont);
      const beste = alle[0];
      assert.ok(beste.art === e.kandidat.art || Math.abs(beste.prozent - e.kandidat.basis) <= 10,
        `${r.id}: Plan empfiehlt ${e.kandidat.art} (${e.kandidat.basis} %), `
        + `das Popup zeigt ${beste.art} mit ${beste.prozent} % als beste Art`);
    }
  });

  test('der Zielfisch wechselt mit der Wassertemperatur', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 5, wind: 8, dirDeg: 0, dir: 'N', press: 1015, trendVal: -2 };
    app.state.PEGEL = { value: 180, station: 'MD', dist: 2, wt: 5 };
    const kalt = app.empfehlung();

    app.state.WX = { temp: 24, wind: 8, dirDeg: 0, dir: 'N', press: 1015, trendVal: -2 };
    app.state.PEGEL = { value: 180, station: 'MD', dist: 2, wt: 21 };
    const warm = app.empfehlung();

    assert.notEqual(kalt.kandidat.art, warm.kandidat.art,
      'Vorher wurde der Ort artblind gewählt und die Art erst danach bestimmt');
    assert.equal(kalt.kandidat.art, 'Hecht', 'bei 5 °C ist Hecht der aktive Räuber');
    assert.equal(warm.kandidat.art, 'Zander', 'bei 21 °C liegt Zander im Optimum');
  });
});

describe('Sturm: die Empfehlung schickt niemanden los', () => {
  const sturm = () => {
    app.state.WX = { temp: 15, wind: 45, dirDeg: 0, dir: 'N', press: 1010, trendVal: 0 };
    app.state.PEGEL = { value: 180, station: 'MD', dist: 2, wt: 12 };
  };

  test('die Empfehlung ist als gesperrt markiert', async () => {
    await loadRegion(ctx, 'elbe');
    sturm();
    const e = app.empfehlung();
    assert.equal(e.gesperrt, 'sturm');
  });

  test('der Satz beginnt mit der Warnung, nicht mit "Starte"', async () => {
    await loadRegion(ctx, 'elbe');
    sturm();
    const e = app.empfehlung();
    assert.match(e.satz, /^Heute besser nicht/);
    assert.ok(!/^Starte/.test(e.satz));
  });

  test('die Chance ist gedeckelt – auch nach allen Boni', async () => {
    await loadRegion(ctx, 'elbe');
    sturm();
    app.state.userPos = [52.15, 11.67]; // Entfernungsbonus
    const e = app.empfehlung();
    assert.ok(e.chance <= 15, `${e.chance} % – Raubfisch- und Entfernungsbonus heben die Sperre auf`);
    assert.ok(e.sterne <= 1);
    app.state.userPos = null;
  });

  test('Score, Spotbewertung und Empfehlung stimmen überein', async () => {
    await loadRegion(ctx, 'elbe');
    sturm();
    const e = app.empfehlung();
    const score = app.computeScore();
    const bew = app.bewerteSpot(e.kandidat.spot, e.kandidat.art, new Date(), e.kandidat.hotspot);
    assert.equal(score.sturm, true);
    assert.equal(bew.gesperrt, 'sturm');
    assert.equal(e.gesperrt, 'sturm');
    assert.ok(score.pct <= 15 && bew.prozent <= 15 && e.chance <= 15);
  });

  test('der Hinweis steht auch in den Lücken', async () => {
    await loadRegion(ctx, 'elbe');
    sturm();
    const e = app.empfehlung();
    assert.ok(e.luecken.some((l) => /Sturm/i.test(l)));
    assert.match(e.luecken[0], /Sturm/, 'Der Sturmhinweis gehört an die erste Stelle');
  });
});

describe('Determinismus und Alternativen', () => {
  test('zweimal derselbe Zeitpunkt ergibt dieselbe Empfehlung', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = { temp: 19, wind: 14, dirDeg: 225, dir: 'SW', press: 1006, trendVal: -2.1 };
    app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 16 };
    const t = new Date();
    const a = app.empfehlung(t), b = app.empfehlung(t);
    assert.equal(a.kandidat.ort, b.kandidat.ort);
    assert.equal(a.kandidat.art, b.kandidat.art);
    assert.equal(a.chance, b.chance);
  });

  test('die Alternativen enthalten nicht den Sieger', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const e = app.empfehlung();
    e.alternativen.forEach((a) => assert.notEqual(a.ort, e.kandidat.ort));
  });

  test('Kandidaten sind absteigend sortiert', async () => {
    await loadRegion(ctx, 'elbe');
    const k = app.kandidaten();
    for (let i = 1; i < k.length; i++) assert.ok(k[i - 1].punkte >= k[i].punkte);
  });

  test('kein Kandidat ist eine geschonte Art', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      app.kandidaten().forEach((k) => {
        const sc = app.state.SCHON.find((x) => x.fisch === k.art);
        assert.ok(sc, `${r.id}: ${k.art} ohne Schonzeitdaten als Kandidat`);
        assert.equal(app.inSchonzeit(sc), false, `${r.id}: ${k.art} ist geschont`);
      });
    }
  });
});

describe('Eine Zahl für dieselbe Sache', () => {
  test('die angezeigte Chance ist exakt der Popup-Wert, nicht der interne Rang', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = { temp: 19, wind: 14, dirDeg: 225, dir: 'SW', press: 1006, trendVal: -2.1 };
    app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 16 };
    app.state.userPos = [53.32, 13.00]; // erzeugt Entfernungsbonus

    const e = app.empfehlung();
    const bew = app.bewerteSpot(e.kandidat.spot, e.kandidat.art, new Date(), e.kandidat.hotspot);
    assert.equal(e.chance, bew.prozent,
      `Plan zeigt ${e.chance} %, Popup ${bew.prozent} % – der Entfernungsbonus darf nur sortieren`);
    assert.equal(e.chance, e.kandidat.basis);
    assert.ok(e.kandidat.punkte >= e.kandidat.basis, 'der interne Rang darf höher liegen');
    app.state.userPos = null;
  });

  test('Boni heben die Chance nicht über die Bewertung', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.WX = { temp: 18, wind: 12, dirDeg: 225, dir: 'SW', press: 1005, trendVal: -2.5 };
    app.state.PEGEL = { value: 180, station: 'MD', dist: 2, wt: 16 };
    app.state.userPos = [52.15, 11.67];
    const e = app.empfehlung();
    assert.ok(e.chance <= 100);
    const bew = app.bewerteSpot(e.kandidat.spot, e.kandidat.art, new Date(), e.kandidat.hotspot);
    assert.equal(e.chance, bew.prozent);
    app.state.userPos = null;
  });

  test('jeder Ort erscheint höchstens einmal in den Alternativen', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      const e = app.empfehlung();
      if (!e) continue;
      const orte = e.alternativen.map((a) => a.ort);
      assert.equal(new Set(orte).size, orte.length,
        `${r.id}: dieselbe Stelle mehrfach, nur mit anderer Zielart`);
      orte.forEach((o) => assert.notEqual(o, e.kandidat.ort));
    }
  });

  test('die Alternativen tragen ihre eigene Bewertung', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const e = app.empfehlung();
    e.alternativen.forEach((a) => {
      const b = app.bewerteSpot(a.spot, a.art, new Date(), a.hotspot);
      assert.equal(a.basis, b.prozent, `${a.ort}: ${a.basis} % vs ${b.prozent} %`);
    });
  });
});
