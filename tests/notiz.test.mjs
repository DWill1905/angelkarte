/* Tests für persönliche Spot-Notizen (notiz.ts): lokal, pro Region, unabhängig vom
   Fangbuch und der Trip-Liste. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion } from './setup.mjs';

let ctx, app;
before(async () => { ctx = await startApp(); app = ctx.app; });
after(() => ctx?.close());

describe('Notiz speichern und laden', () => {
  test('ohne gespeicherte Notiz kommt ein leerer String zurück', async () => {
    await loadRegion(ctx, 'elbe');
    const txt = await app.ladeNotiz('Buhnenfeld Herrenkrug');
    assert.equal(txt, '');
  });

  test('Speichern und Laden geben denselben Text zurück', async () => {
    await loadRegion(ctx, 'elbe');
    await app.speichereNotiz('Buhnenfeld Herrenkrug', 'Zufahrt bei Nässe gesperrt.');
    const txt = await app.ladeNotiz('Buhnenfeld Herrenkrug');
    assert.equal(txt, 'Zufahrt bei Nässe gesperrt.');
  });

  test('leeren Text speichern löscht die Notiz wieder', async () => {
    await loadRegion(ctx, 'elbe');
    await app.speichereNotiz('Buhnenfeld Herrenkrug', 'Wird gleich wieder gelöscht.');
    assert.notEqual(await app.ladeNotiz('Buhnenfeld Herrenkrug'), '');
    await app.speichereNotiz('Buhnenfeld Herrenkrug', '   ');
    assert.equal(await app.ladeNotiz('Buhnenfeld Herrenkrug'), '');
  });

  test('Notizen verschiedener Spots stören sich nicht', async () => {
    await loadRegion(ctx, 'elbe');
    await app.speichereNotiz('Elbe Magdeburg-Prester', 'Spot A');
    await app.speichereNotiz('Rothenseer Abstiegskanal', 'Spot B');
    assert.equal(await app.ladeNotiz('Elbe Magdeburg-Prester'), 'Spot A');
    assert.equal(await app.ladeNotiz('Rothenseer Abstiegskanal'), 'Spot B');
  });

  test('Notizen sind pro Region getrennt (gleicher Spotname, andere Region)', async () => {
    await loadRegion(ctx, 'elbe');
    await app.speichereNotiz('Gemeinsamer-Testname', 'Elbe-Notiz');
    await loadRegion(ctx, 'main');
    assert.equal(await app.ladeNotiz('Gemeinsamer-Testname'), '', 'Main darf die Elbe-Notiz nicht sehen');
    await app.speichereNotiz('Gemeinsamer-Testname', 'Main-Notiz');
    assert.equal(await app.ladeNotiz('Gemeinsamer-Testname'), 'Main-Notiz');
    await loadRegion(ctx, 'elbe');
    assert.equal(await app.ladeNotiz('Gemeinsamer-Testname'), 'Elbe-Notiz', 'Elbe-Notiz darf nicht überschrieben worden sein');
  });
});

describe('Notiz-Feld im Popup', () => {
  test('kuratierte Spots bekommen ein Notizfeld, eigene Spots nicht (haben schon ihre Notiz)', async () => {
    await loadRegion(ctx, 'elbe');
    const spot = app.state.SPOTS.find((s) => !s.my && s.cat !== 'sperr' && s.cat !== 'info');
    assert.match(app.popupHtml(spot), /notiz-ta/, 'Notizfeld fehlt im Popup');
    const eigen = { name: 'Eigener Test', cat: 'eigen', arten: [], lat: 1, lng: 1, my: true, myId: 1, note: 'x', karte: 'x', fisch: 'x', methode: 'x' };
    assert.doesNotMatch(app.popupHtml(eigen), /notiz-ta/, 'eigene Spots brauchen kein zweites Notizfeld');
  });
});
