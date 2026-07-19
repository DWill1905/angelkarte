/* Tests der Tackle-Empfehlungen und der Gewässercharakter-Erkennung.
   Der wichtigste Test hier: `istFliess` – die alte Region-Regex hielt Elbe und Main
   fälschlich für Stillwasser und gab dort falsche Jigkopfgewichte aus. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { startApp, loadRegion, ROOT, beangelbar } from './setup.mjs';

const { REGIONS_EMBEDDED: regions } = await import(pathToFileURL(path.join(ROOT, 'js', 'data.js')).href);
const { wasserTyp, istFliess, tackleFor, saison } = await import(pathToFileURL(path.join(ROOT, 'js', 'tackle.js')).href);

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; });
after(() => ctx?.close());

const spotsVon = (id) => regions.find((r) => r.id === id).spots;
const findSpot = (id, teil) => spotsVon(id).find((s) => s.name.includes(teil));

describe('Gewässercharakter', () => {
  test('Flussstrecken werden als Fließgewässer erkannt', () => {
    const lahn = findSpot('giessen', 'Stadtstrecke');
    assert.equal(istFliess(lahn), true, 'Lahn ist ein Fluss');
  });

  test('Elbe-Buhnenfelder sind Fließgewässer (der alte Bug)', () => {
    const elbe = findSpot('elbe', 'Herrenkrug');
    assert.equal(istFliess(elbe), true,
      'Elbe wurde von der alten Regex /rhein|mainz/ als Stillwasser behandelt');
  });

  test('Main-Strecken sind Fließgewässer (der alte Bug)', () => {
    const main = findSpot('main', 'Niddamündung');
    assert.equal(istFliess(main), true, 'Main wurde als Stillwasser behandelt');
  });

  test('Seen sind keine Fließgewässer', () => {
    spotsVon('mecklenburg').filter(beangelbarSpot).forEach((s) => {
      assert.equal(istFliess(s), false, `${s.name} ist ein See`);
    });
  });

  test('Kanäle und Häfen werden als Kanal erkannt', () => {
    const kanal = findSpot('elbe', 'Abstiegskanal');
    assert.equal(wasserTyp(kanal), 'kanal');
    const hafen = findSpot('elbe', 'Industriehafen');
    assert.equal(wasserTyp(hafen), 'kanal');
  });

  function beangelbarSpot(s) { return s.cat !== 'sperr' && s.cat !== 'info'; }
});

describe('Tackle-Ableitung', () => {
  test('jeder beangelbare Spot bekommt eine vollständige Empfehlung', async () => {
    for (const r of regions) {
      r.spots.filter((s) => s.cat !== 'sperr' && s.cat !== 'info').forEach((s) => {
        const { t } = tackleFor(s);
        ['rute', 'koeder', 'jig', 'vorfach', 'zugang'].forEach((k) => {
          assert.ok(t[k] && t[k].length > 3, `${r.id}/${s.name}: ${k} fehlt`);
        });
        ['fruehjahr', 'sommer', 'herbst', 'winter'].forEach((k) => {
          assert.ok(t.farben[k], `${r.id}/${s.name}: Farbe ${k} fehlt`);
        });
      });
    }
  });

  test('Hechtgewässer verlangen Stahl- oder Titanvorfach', () => {
    regions.flatMap((r) => r.spots)
      .filter((s) => (s.arten || []).includes('Hecht'))
      .forEach((s) => {
        const { t } = tackleFor(s);
        assert.match(t.vorfach, /Stahl|Titan/i, `${s.name}: Hecht ohne Stahlvorfach empfohlen`);
      });
  });

  test('Welsgewässer verlangen schwereres Gerät', () => {
    const wels = regions.flatMap((r) => r.spots).filter((s) => (s.arten || []).includes('Wels'));
    assert.ok(wels.length, 'Testdaten brauchen mindestens ein Welsgewässer');
    wels.forEach((s) => {
      const { t } = tackleFor(s);
      const max = Math.max(...(t.rute.match(/\d+/g) || [0]).map(Number));
      assert.ok(max >= 80, `${s.name}: Rute zu leicht für Wels (${t.rute})`);
    });
  });

  test('Fließgewässer bekommen schwerere Jigköpfe als Flachseen', () => {
    const fluss = tackleFor(findSpot('elbe', 'Herrenkrug')).t;
    const see = tackleFor(findSpot('mecklenburg', 'Zotzensee')).t;
    const maxVon = (str) => Math.max(...(str.match(/\d+/g) || [0]).map(Number));
    assert.ok(maxVon(fluss.jig) > maxVon(see.jig),
      `Fluss ${fluss.jig} muss schwerer sein als Flachsee ${see.jig}`);
  });

  test('Bootsseen empfehlen das Boot und begründen es', () => {
    regions.flatMap((r) => r.spots).filter((s) => s.zugang === 'boot').forEach((s) => {
      const { t } = tackleFor(s);
      assert.match(t.zugang, /Boot/i, `${s.name}: Bootsempfehlung fehlt`);
    });
  });

  test('trübe Fließgewässer empfehlen im Sommer Grundeldekore', () => {
    const { t } = tackleFor(findSpot('elbe', 'Herrenkrug'));
    assert.match(t.farben.sommer, /Grundel/i);
  });
});

describe('Kuratierte Empfehlungen (Mecklenburg)', () => {
  test('alle MV-Seen sind kuratiert, nicht nur abgeleitet', () => {
    spotsVon('mecklenburg')
      .filter((s) => s.cat !== 'sperr' && s.cat !== 'info')
      .forEach((s) => {
        const { kuratiert } = tackleFor(s);
        assert.equal(kuratiert, true, `${s.name}: nicht kuratiert`);
      });
  });

  test('das Entnahmefenster schlägt auf die Handling-Empfehlung durch', () => {
    spotsVon('mecklenburg')
      .filter((s) => s.tackle)
      .forEach((s) => {
        assert.match(s.tackle.warum, /Entnahmefenster/,
          `${s.name}: Hinweis auf schonendes Handling fehlt`);
        assert.match(s.tackle.warum, /Abhakmatte|Kescher/,
          `${s.name}: kein konkretes Handling-Gerät genannt`);
      });
  });

  test('der Welssee empfiehlt stärkeres Gerät als die reinen Hechtseen', () => {
    const klenz = findSpot('mecklenburg', 'Klenzsee');
    const vilz = findSpot('mecklenburg', 'Vilzsee');
    const maxVon = (s) => Math.max(...(tackleFor(s).t.rute.match(/\d+/g) || [0]).map(Number));
    assert.ok(maxVon(klenz) > maxVon(vilz), 'Klenzsee (Wels) braucht schwereres Gerät');
  });

  test('der tiefste See empfiehlt Vertikalangeln', () => {
    const priepert = findSpot('mecklenburg', 'Priepertsee');
    const { t } = tackleFor(priepert);
    assert.match(t.rute + t.jig + t.zugang, /Vertikal|vertikal/);
  });
});

describe('Saisonale Farben', () => {
  test('saison() liefert die vier Jahreszeiten korrekt', () => {
    assert.equal(saison(new Date(2026, 0, 15)), 'winter');
    assert.equal(saison(new Date(2026, 3, 15)), 'fruehjahr');
    assert.equal(saison(new Date(2026, 6, 15)), 'sommer');
    assert.equal(saison(new Date(2026, 9, 15)), 'herbst');
    assert.equal(saison(new Date(2026, 11, 15)), 'winter');
  });
});

describe('Darstellung im Popup', () => {
  test('Tackle-Block erscheint bei beangelbaren Spots', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const spot = beangelbar(app.state)[0];
    const html = app.popupHtml(spot);
    assert.match(html, /class="tackle"/);
    assert.match(html, /Jigkopf/);
    assert.match(html, /Vorfach/);
  });

  test('kuratierte Spots weisen sich als solche aus', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const spot = beangelbar(app.state)[0];
    assert.match(app.popupHtml(spot), /Kuratiert für dieses Gewässer/);
  });

  test('abgeleitete Spots kennzeichnen die Herkunft ehrlich', async () => {
    await loadRegion(ctx, 'erzgebirge');
    const spot = beangelbar(app.state).find((s) => !s.tackle);
    assert.ok(spot, 'Testregion braucht einen nicht-kuratierten Spot');
    assert.match(app.popupHtml(spot), /Abgeleitet aus Gewässertyp/);
  });

  test('Sperrzonen bekommen keinen Tackle-Block', async () => {
    await loadRegion(ctx, 'main');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr');
    assert.ok(!/class="tackle"/.test(app.popupHtml(sperr)));
  });

  test('die aktuelle Jahreszeit ist hervorgehoben', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const html = app.popupHtml(beangelbar(app.state)[0]);
    assert.match(html, /class="akt"/, 'aktuelle Saison nicht markiert');
  });

  test('trübe Seen bekommen Signalfarben, klare Naturfarben', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const trueb = app.state.SPOTS.find((s) => s.name.startsWith('Woblitzsee'));
    const klar = app.state.SPOTS.find((s) => s.name.startsWith('Vilzsee'));
    assert.match(app.popupHtml(trueb), /Schockfarben|Firetiger/, 'trüber See ohne Signalfarben');
    assert.match(app.popupHtml(klar), /Naturdekore|Naturtöne/, 'klarer See ohne Naturfarben');
  });

  test('Tackle trennt Kunst- und Naturköder (kein Spinnrute+Boilie-Mix)', async () => {
    await loadRegion(ctx, 'mainz');
    const spot = app.state.SPOTS.find((s) => !s.tackle
      && (s.arten || []).some((a) => ['Zander', 'Hecht', 'Barsch'].includes(a))
      && (s.arten || []).some((a) => ['Karpfen', 'Brachse', 'Rotauge', 'Aal', 'Schleie'].includes(a)));
    assert.ok(spot, 'kein gemischtes Gewässer gefunden');
    const html = app.popupHtml(spot);
    assert.match(html, /Kunstköder/, 'Kunstköder-Sektion fehlt');
    assert.match(html, /Naturköder/, 'Naturköder-Sektion fehlt');
  });

  test('Anfütterverbot am Wißmarer See schlägt auf die Köder-/Montage-Empfehlung durch', async () => {
    /* Die Spotnotiz sagt explizit "Anfüttern verboten" - das strukturierte Feld keinAnfuettern
       fehlte trotzdem, wodurch die Tackle-Ableitung für Karpfen/Schleie einen normalen
       Futterkorb/Method-Feeder empfahl und damit der eigenen Gewässerregel widersprach. */
    await loadRegion(ctx, 'giessen');
    const spot = findSpot('giessen', 'Wißmarer See');
    assert.ok(spot, 'Wißmarer See fehlt in den Testdaten');
    assert.equal(spot.keinAnfuettern, true);
    const html = app.popupHtml(spot);
    assert.match(html, /kein Futterkorb, kein Anfüttern/, 'Montage-Hinweis muss das Anfütterverbot nennen: ' + html);
    assert.doesNotMatch(html, /Method-Feeder \/ Haar-Rig je nach Zielfisch/, 'darf nicht die normale Futterkorb-Empfehlung zeigen');
  });
});
