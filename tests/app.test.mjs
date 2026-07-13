/* Tests des App-Verhaltens: Regionswechsel, Filter, Popups, Trip-Liste, Sperrzonen-Warnung. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion, tick, beangelbar } from './setup.mjs';

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; });
after(() => ctx?.close());

describe('Regionen laden', () => {
  test('alle Regionen stehen im Umschalter', () => {
    const werte = [...doc.getElementById('regionSel').options].map((o) => o.value);
    const ids = app.state.REGIONS.map((r) => r.id);
    ids.forEach((id) => assert.ok(werte.includes(id), `${id} fehlt im Umschalter`));
  });

  test('jede Region lädt ohne Fehler und hat Spots', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      assert.equal(app.state.REGION.id, r.id);
      assert.ok(app.state.SPOTS.length > 0, `${r.id}: keine Spots geladen`);
      assert.ok(app.state.SCHON.length > 0, `${r.id}: keine Schonzeiten geladen`);
    }
  });

  test('der Titel folgt der Region', async () => {
    await loadRegion(ctx, 'elbe');
    const sel = doc.getElementById('regionSel');
    const titel = sel.options[sel.selectedIndex]?.textContent || sel.value;
    assert.match(titel, /Elbe|Magdeburg/);
  });
});

describe('Popups', () => {
  test('kein Popup wirft beim Rendern (alle Regionen, alle Spots)', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      app.state.SPOTS.forEach((s) => {
        assert.doesNotThrow(() => app.popupHtml(s), `${r.id}/${s.name}`);
      });
    }
  });

  test('fehlende Signale werden im Popup zu einer Zeile gebündelt', async () => {
    await loadRegion(ctx, 'mainz');
    app.state.WX = null; app.state.PEGEL = null;
    const spot = app.state.SPOTS.find((s) => s.cat !== 'sperr' && s.cat !== 'info' && (s.arten || []).length && !s.my);
    const h = app.popupHtml(spot);
    assert.match(h, /Signale? fehlen/, 'gebündelte Fehl-Zeile fehlt');
    assert.ok(!/rate-g unbekannt/.test(h), 'einzelne unbekannt-Zeilen sollten gebündelt sein');
  });

  test('Detail-Panel existiert und lässt sich schließen', () => {
    const sheet = doc.getElementById('detailSheet');
    const close = doc.getElementById('detailClose');
    assert.ok(sheet && close, 'Detail-Panel oder Schließen-Button fehlt');
    sheet.hidden = false;
    close.click();
    assert.equal(sheet.hidden, true, 'Schließen wirkt nicht');
  });

  test('Popup zeigt das Prüfdatum der Region', async () => {
    await loadRegion(ctx, 'elbe');
    const s = beangelbar(app.state)[0];
    assert.match(app.popupHtml(s), /Daten geprüft/);
  });

  test('verif-C-Spots warnen vor schwacher Beleglage', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      const c = app.state.SPOTS.find((s) => s.verif === 'C');
      if (c) assert.match(app.popupHtml(c), /Beleglage schwach/, `${r.id}/${c.name}`);
    }
  });

  test('Spots mit Kartenlinks rendern klickbare Links', async () => {
    await loadRegion(ctx, 'elbe');
    const mitLink = app.state.SPOTS.find((s) => s.kartenLinks?.length);
    const html = app.popupHtml(mitLink);
    assert.match(html, /pop-link/);
    mitLink.kartenLinks.forEach((l) => assert.ok(html.includes(l.url), `URL fehlt: ${l.url}`));
  });

  test('Sperrzonen bekommen keinen Merken-Button', async () => {
    await loadRegion(ctx, 'main');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr');
    assert.ok(sperr, 'Testregion braucht eine Sperrzone');
    assert.ok(!/pop-btn trip/.test(app.popupHtml(sperr)));
  });
});

describe('Filter', () => {
  test('Ufer-Filter blendet reine Bootsseen aus', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const boote = app.state.SPOTS.filter((s) => s.zugang === 'boot');
    assert.ok(boote.length > 0, 'Testregion braucht Bootsseen');

    app.state.uferOnly = false;
    assert.ok(app.spotVisible(boote[0]), 'ohne Filter muss der Bootssee sichtbar sein');
    app.state.uferOnly = true;
    assert.equal(app.spotVisible(boote[0]), false, 'mit Ufer-Filter muss er verschwinden');
    app.state.uferOnly = false;
  });

  test('Spot-Suche filtert die Liste nach Name', async () => {
    await loadRegion(ctx, 'elbe');
    const such = doc.getElementById('spotSearch');
    const alle = doc.querySelectorAll('.spot-item').length;

    such.value = 'herrenkrug';
    such.oninput();
    assert.equal(doc.querySelectorAll('.spot-item').length, 1);

    such.value = 'XYZ-existiert-nicht';
    such.oninput();
    assert.match(doc.getElementById('spotList').innerHTML, /Kein Treffer/);

    such.value = '';
    such.oninput();
    assert.equal(doc.querySelectorAll('.spot-item').length, alle, 'Zurücksetzen stellt alle wieder her');
  });

  test('Suche ist unabhängig von Groß-/Kleinschreibung', async () => {
    await loadRegion(ctx, 'elbe');
    const such = doc.getElementById('spotSearch');
    such.value = 'ZOLLELBE';
    such.oninput();
    assert.equal(doc.querySelectorAll('.spot-item').length, 1);
    such.value = '';
    such.oninput();
  });
});

describe('Trip-Liste', () => {
  test('Spot merken, prüfen, entfernen', async () => {
    await loadRegion(ctx, 'elbe');
    app.state.trip.length = 0;
    const spot = beangelbar(app.state)[0];

    assert.equal(app.inTrip(spot.name), false);
    await app.toggleTrip(spot.name);
    assert.equal(app.inTrip(spot.name), true);
    assert.equal(app.state.trip.length, 1);

    await app.toggleTrip(spot.name);
    assert.equal(app.inTrip(spot.name), false, 'nochmal tippen entfernt wieder');
  });

  test('Merkliste ist regionsübergreifend', async () => {
    app.state.trip.length = 0;
    await loadRegion(ctx, 'elbe');
    const a = beangelbar(app.state)[0];
    await app.toggleTrip(a.name);

    await loadRegion(ctx, 'main');
    const b = beangelbar(app.state)[0];
    await app.toggleTrip(b.name);

    assert.equal(app.state.trip.length, 2);
    assert.equal(app.inTrip(a.name), false, 'Elbe-Spot darf in Main nicht als gemerkt gelten');
    assert.equal(app.inTrip(b.name), true);
  });

  test('Merkliste überlebt einen Neustart (persistiert)', async () => {
    app.state.trip.length = 0;
    await loadRegion(ctx, 'elbe');
    await app.toggleTrip(beangelbar(app.state)[0].name);
    assert.ok(ctx.storageMem.trip, 'nichts gespeichert');
    assert.equal(JSON.parse(ctx.storageMem.trip).length, 1);
  });
});

describe('Sperrzonen-Warnung', () => {
  test('warnt in der Nähe einer Sperrzone', async () => {
    await loadRegion(ctx, 'main');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr' && typeof s.lat === 'number');
    app.locApply({ coords: { latitude: sperr.lat, longitude: sperr.lng } });
    await tick(ctx.window, 40);

    const box = doc.getElementById('sperrWarn');
    assert.equal(box.hidden, false, 'Warnung fehlt');
    assert.ok(box.innerHTML.includes(sperr.name));
    assert.match(box.innerHTML, /keine exakte Grenze/, 'ehrlicher Hinweis fehlt');
  });

  test('warnt nicht in 10 km Entfernung', async () => {
    await loadRegion(ctx, 'main');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr' && typeof s.lat === 'number');
    app.locApply({ coords: { latitude: sperr.lat + 0.09, longitude: sperr.lng } });
    await tick(ctx.window, 40);
    assert.equal(doc.getElementById('sperrWarn').hidden, true);
  });

  test('Warnung verschwindet beim Regionswechsel', async () => {
    await loadRegion(ctx, 'main');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr' && typeof s.lat === 'number');
    app.locApply({ coords: { latitude: sperr.lat, longitude: sperr.lng } });
    await tick(ctx.window, 40);
    assert.equal(doc.getElementById('sperrWarn').hidden, false);

    await loadRegion(ctx, 'elbe'); // Elbe hat keine Sperrzonen
    assert.equal(doc.getElementById('sperrWarn').hidden, true);
  });
});

describe('Standort und Spotliste', () => {
  test('mit Standort wird nach Entfernung sortiert', async () => {
    await loadRegion(ctx, 'elbe');
    app.locApply({ coords: { latitude: 52.15, longitude: 11.67 } });
    await tick(ctx.window, 40);

    assert.match(doc.getElementById('spotSort').textContent, /Entfernung/);
    const erster = doc.querySelector('.spot-item');
    assert.ok(erster.classList.contains('nearest'), 'nächster Spot nicht hervorgehoben');
    assert.match(erster.innerHTML, /km/);
  });
});

describe('Regeln-Tab', () => {
  test('Schonzeit-Kalender und Tabelle rendern für jede Region', async () => {
    for (const r of app.state.REGIONS) {
      await loadRegion(ctx, r.id);
      doc.querySelector('[data-view="regeln"]').click();
      await tick(ctx.window, 30);
      assert.ok(doc.getElementById('schonKalender').querySelectorAll('.calrow').length > 3, `${r.id}: Kalender leer`);
      assert.ok(doc.getElementById('schonzeiten').children.length > 0, `${r.id}: Tabelle leer`);
    }
  });
});

describe('UI: Popup ist auf das Wesentliche reduziert', () => {
  const ohneKlappinhalt = (html) =>
    html.replace(/<details[\s\S]*?<\/details>/g, (m) => (m.match(/<summary[\s\S]*?<\/summary>/) || [''])[0]);
  const nurText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  test('ohne Aufklappen bleibt das Popup unter 30 Zeilen', async () => {
    await loadRegion(ctx, 'mecklenburg');
    app.state.WX = { temp: 19, wind: 14, dirDeg: 225, dir: 'SW', press: 1006, trendVal: -2.1 };
    app.state.PEGEL = { value: 120, station: 'X', dist: 5, wt: 16 };
    const html = app.popupHtml(app.state.SPOTS.find((s) => s.name.includes('Woblitzsee')));
    const zeilen = Math.round(nurText(ohneKlappinhalt(html)).length / 55);
    assert.ok(zeilen <= 30, `${zeilen} Zeilen sofort sichtbar – vorher waren es 66`);
  });

  test('die Fangchance steht vor den Erlaubnisformalitäten', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const html = app.popupHtml(app.state.SPOTS.find((s) => s.name.includes('Woblitzsee')));
    const chancen = html.indexOf('class="rating"');
    const erlaubnis = html.indexOf('<b>Erlaubnis');
    assert.ok(chancen >= 0 && erlaubnis >= 0);
    assert.ok(chancen < erlaubnis, 'Am Wasser interessiert zuerst, ob es sich lohnt');
  });

  test('Methode, Rig und Hotspots stecken in einem Klappblock', async () => {
    await loadRegion(ctx, 'elbe');
    const html = app.popupHtml(app.state.SPOTS.find((s) => s.name.includes('Herrenkrug')));
    assert.match(html, /class="pop-details"/);
    assert.ok(!/pop-details[^>]*open/.test(html), 'Der Detailblock soll zugeklappt starten');
    const body = html.slice(html.indexOf('pop-details'));
    assert.match(body, /Methode/);
  });

  test('Warnung und Erlaubnis bleiben immer sichtbar (nicht eingeklappt)', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const html = app.popupHtml(app.state.SPOTS.find((s) => s.warn));
    const sichtbar = ohneKlappinhalt(html);
    assert.match(sichtbar, /pop-warn|pop-note/, 'Warnung darf nie im Klappblock verschwinden');
    assert.match(sichtbar, /<b>Erlaubnis/, 'Die Erlaubnis ist rechtlich relevant');
  });

  test('Sperrzonen bekommen keinen Detail- und keinen Tackle-Block', async () => {
    await loadRegion(ctx, 'main');
    const html = app.popupHtml(app.state.SPOTS.find((s) => s.cat === 'sperr'));
    assert.ok(!/pop-details/.test(html));
    assert.ok(!/class="tackle"/.test(html));
    assert.match(html, /pop-warn/, 'Die Sperrwarnung muss stehen');
  });
});

describe('UI: Werkzeuge-Menü ist gruppiert', () => {
  test('drei Gruppen mit Überschriften', () => {
    const gruppen = [...doc.querySelectorAll('.tool-gruppe')].map((e) => e.textContent);
    assert.deepEqual(gruppen, ['Planen', 'Am Wasser', 'Karte & Listen']);
  });

  test('die Kernfunktion steht über den Gruppen und volle Breite', () => {
    const erster = doc.querySelector('#toolsDlg .fbtool');
    assert.equal(erster.id, 'tPlan');
    assert.ok(erster.classList.contains('plan'));
  });

  test('kein Werkzeug ist verloren gegangen', () => {
    const ids = [...doc.querySelectorAll('#toolsDlg .fbtool')].map((b) => b.id);
    ['tPlan', 'tScore', 'tFore', 'tBite', 'tCol', 'tLead', 'tKnot', 'tPack', 'tTrip', 'tOff', 'schilfBtn']
      .forEach((id) => assert.ok(ids.includes(id), `${id} fehlt`));
  });
});
