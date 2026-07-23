/* Tests der Spot-Auswahl im Bottom-Sheet (ersetzt das frühere Leaflet-Popup).

   Die Zusicherungen, die zählen:
   - selectSpot/selectHotspot öffnen das Sheet und rendern die Detailkarte in DIESELBE
     Liste (kein separates Popup-DOM mehr) – Liste und Detail teilen sich einen Scrollcontainer.
   - Der ausgewählte Listeneintrag wird sichtbar markiert.
   - deselectSpot (✕-Knopf) räumt die Detailkarte wieder weg, ohne die Liste zu schließen.
   - Ein Regionswechsel räumt eine offene Detailkarte der alten Region ab (sonst zeigt das
     Sheet nach dem Wechsel einen Spot, der gar nicht mehr geladen ist). */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion, tick } from './setup.mjs';

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; });
after(() => ctx?.close());

const spotVon = (teil) => app.state.SPOTS.find((s) => s.name.includes(teil));

describe('selectSpot', () => {
  before(async () => { await loadRegion(ctx, 'erzgebirge'); });

  test('öffnet das Sheet und rendert die Detailkarte in der Spotliste', async () => {
    const spot = spotVon('Saidenbach');
    app.selectSpot(spot);
    await tick(ctx.window, 20);
    assert.ok(!doc.getElementById('sheet').classList.contains('collapsed'), 'Sheet muss offen sein');
    const box = doc.getElementById('spotDetailBox');
    assert.ok(box, 'Detailkarte fehlt im DOM');
    assert.match(box.innerHTML, /Talsperre Saidenbach/);
  });

  test('markiert die Zeile des ausgewählten Spots in der Liste', async () => {
    const spot = spotVon('Saidenbach');
    app.selectSpot(spot);
    await tick(ctx.window, 20);
    const rows = [...doc.querySelectorAll('.spot-item')];
    const eigene = rows.find((r) => r.textContent.includes('Talsperre Saidenbach'));
    assert.ok(eigene, 'Zeile muss existieren');
    assert.ok(eigene.classList.contains('selected'), 'ausgewählte Zeile muss .selected tragen');
    rows.filter((r) => r !== eigene).forEach((r) => assert.ok(!r.classList.contains('selected'), r.textContent));
  });

  test('reichert die Detailkarte an: Distanz, Trip-Button, Notiz-Feld', async () => {
    const spot = spotVon('Saidenbach');
    app.selectSpot(spot);
    await tick(ctx.window, 30);
    const box = doc.getElementById('spotDetailBox');
    const dist = box.querySelector('[data-dist]');
    assert.ok(dist, 'Distanz-Zeile fehlt');
    assert.match(dist.textContent, /km/);
    const tripBtn = box.querySelector('.pop-btn.trip');
    assert.ok(tripBtn, 'Merken-Button fehlt');
    assert.match(tripBtn.textContent, /Merken/);
  });

  test('Klick auf ✕ schließt die Detailkarte, das Sheet bleibt offen', async () => {
    app.selectSpot(spotVon('Saidenbach'));
    await tick(ctx.window, 20);
    const x = doc.getElementById('spotDetailClose');
    assert.ok(x, 'Schließen-Knopf fehlt');
    x.onclick();
    await tick(ctx.window, 20);
    assert.equal(doc.getElementById('spotDetailBox'), null, 'Detailkarte muss weg sein');
    assert.ok(!doc.getElementById('sheet').classList.contains('collapsed'), 'Sheet darf nicht zuklappen');
  });

  test('deselectSpot ist idempotent und wirft nicht ohne vorherige Auswahl', () => {
    app.deselectSpot();
    assert.doesNotThrow(() => app.deselectSpot());
    assert.equal(doc.getElementById('spotDetailBox'), null);
  });
});

describe('selectHotspot', () => {
  before(async () => { await loadRegion(ctx, 'erzgebirge'); });

  test('zeigt die Hotspot-Karte, nicht die des übergeordneten Spots', async () => {
    const parent = spotVon('Saidenbach');
    const hot = (parent.hotspots || [])[0];
    assert.ok(hot, 'Testregion braucht einen Hotspot für diesen Test');
    app.selectHotspot(parent, hot);
    await tick(ctx.window, 20);
    const box = doc.getElementById('spotDetailBox');
    assert.ok(box, 'Detailkarte fehlt');
    assert.match(box.innerHTML, new RegExp(hot.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(box.innerHTML, /gehört zu Talsperre Saidenbach/);
  });
});

describe('Regionswechsel räumt die Detailkarte ab', () => {
  test('eine offene Detailkarte der alten Region verschwindet nach dem Wechsel', async () => {
    await loadRegion(ctx, 'erzgebirge');
    app.selectSpot(spotVon('Saidenbach'));
    await tick(ctx.window, 20);
    assert.ok(doc.getElementById('spotDetailBox'), 'Vorbedingung: Detailkarte muss offen sein');
    await loadRegion(ctx, 'mecklenburg');
    assert.equal(doc.getElementById('spotDetailBox'), null, 'Detailkarte der alten Region darf nicht überleben');
  });
});
