/* Test: Eigene Spots bearbeiten.
   Vorher liess sich ein eigener Spot nur löschen und komplett neu anlegen - ein Tippfehler
   im Namen war nicht korrigierbar, ohne die Koordinate erneut per Long-Press/Rechtsklick zu
   treffen. editMySpot() öffnet denselben Dialog vorbefüllt; saveMySpot() aktualisiert dann
   den bestehenden Eintrag statt einen zweiten anzulegen. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion } from './setup.mjs';

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; await loadRegion(ctx, 'elbe'); });
after(() => ctx?.close());

/** Simuliert einen Rechtsklick auf die Karte (öffnet den "Eigenen Spot speichern"-Dialog). */
function rechtsklick(lat, lng) {
  const handler = ctx.leafletOpts.handlers && ctx.leafletOpts.handlers.contextmenu;
  assert.ok(handler, 'contextmenu-Handler wurde nicht registriert');
  handler({ latlng: { lat, lng } });
}

async function legeSpotAn(name, tiefe, tipp) {
  rechtsklick(51.1, 12.2);
  doc.getElementById('myName').value = name;
  doc.getElementById('myTiefe').value = tiefe;
  doc.getElementById('myTipp').value = tipp;
  await app.saveMySpot();
}

describe('Eigene Spots bearbeiten', () => {
  test('editMySpot() befüllt den Dialog mit den bestehenden Werten', async () => {
    await legeSpotAn('Alte Buhne', '3.5', 'Zander abends');
    const angelegt = app.state.SPOTS.find((s) => s.my && s.name === 'Alte Buhne');
    assert.ok(angelegt, 'Spot wurde nicht angelegt');

    await ctx.window.editMySpot(angelegt.myId);
    assert.equal(doc.getElementById('myName').value, 'Alte Buhne');
    assert.equal(doc.getElementById('myTiefe').value, '3.5');
    assert.equal(doc.getElementById('myTipp').value, 'Zander abends');
    assert.equal(doc.getElementById('myDlgTitle').textContent, 'Eigenen Spot bearbeiten');
    assert.ok(doc.getElementById('myDlgTipp').hidden, 'Long-Press-Tipp ist beim Bearbeiten irreführend und sollte weg sein');
    app.closeMyDlg();
  });

  test('Speichern nach Bearbeiten aktualisiert den Eintrag statt einen zweiten anzulegen', async () => {
    await legeSpotAn('Kiesbank', '2', 'Barsch');
    const vorher = app.state.SPOTS.filter((s) => s.my);
    const anzahlVorher = vorher.length;
    const ziel = vorher.find((s) => s.name === 'Kiesbank');

    await ctx.window.editMySpot(ziel.myId);
    doc.getElementById('myName').value = 'Kiesbank Süd';
    doc.getElementById('myTiefe').value = '2.5';
    await app.saveMySpot();

    const nachher = app.state.SPOTS.filter((s) => s.my);
    assert.equal(nachher.length, anzahlVorher, 'es sollte kein zusätzlicher Spot entstehen');
    assert.ok(nachher.some((s) => s.name === 'Kiesbank Süd'), 'umbenannter Spot fehlt');
    assert.ok(!nachher.some((s) => s.name === 'Kiesbank'), 'alter Name sollte verschwunden sein');

    const gespeichert = await app.loadMySpots(app.state.REGION.id);
    const eintrag = gespeichert.find((m) => m.id === ziel.myId);
    assert.ok(eintrag, 'Eintrag sollte weiterhin unter derselben ID im Storage stehen (nicht neu angelegt)');
    assert.equal(eintrag.name, 'Kiesbank Süd');
    assert.equal(eintrag.tiefe, 2.5);
    /* Koordinate bleibt beim Bearbeiten unangetastet - der Dialog hat keine Lat/Lng-Felder */
    assert.equal(eintrag.lat, 51.1);
    assert.equal(eintrag.lng, 12.2);
  });

  test('Long-Press/Rechtsklick nach einem Bearbeiten-Vorgang legt wieder einen neuen Spot an (kein hängender Edit-Modus)', async () => {
    await legeSpotAn('Erster', '1', '');
    const erster = app.state.SPOTS.find((s) => s.my && s.name === 'Erster');
    await ctx.window.editMySpot(erster.myId);
    app.closeMyDlg(); // Bearbeiten abgebrochen, ohne zu speichern

    const vorher = app.state.SPOTS.filter((s) => s.my).length;
    await legeSpotAn('Zweiter', '1', '');
    const nachher = app.state.SPOTS.filter((s) => s.my).length;
    assert.equal(nachher, vorher + 1, 'nach abgebrochenem Edit sollte ein Long-Press wieder einen NEUEN Spot anlegen');
    assert.ok(app.state.SPOTS.some((s) => s.my && s.name === 'Erster'), 'der ursprüngliche Spot sollte unverändert erhalten bleiben');
  });
});

describe('Trip-Liste bleibt synchron mit umbenannten/gelöschten eigenen Spots', () => {
  /* Bug, den die neue Bearbeiten-Funktion selbst eingeführt hätte: die Trip-Liste merkt sich
     Spots nur über den Namen (kein stabiler Fremdschlüssel). Ohne Abgleich würde ein
     umbenannter, vorgemerkter eigener Spot in der Trip-Liste/im Tagesplan als Geisterzeile
     auf einen nicht mehr existierenden Namen zeigen. */
  test('Umbenennen eines vorgemerkten eigenen Spots aktualisiert den Namen in der Trip-Liste', async () => {
    await legeSpotAn('Steg Nord', '3', '');
    const spot = app.state.SPOTS.find((s) => s.my && s.name === 'Steg Nord');
    await app.toggleTrip('Steg Nord');
    assert.ok(app.inTrip('Steg Nord'), 'Spot sollte vorgemerkt sein');

    await ctx.window.editMySpot(spot.myId);
    doc.getElementById('myName').value = 'Steg Süd';
    await app.saveMySpot();

    assert.ok(!app.inTrip('Steg Nord'), 'alter Name sollte nicht mehr in der Trip-Liste stehen');
    assert.ok(app.inTrip('Steg Süd'), 'Trip-Liste sollte dem neuen Namen folgen, statt verwaist zu bleiben');
    assert.equal(app.state.trip.filter((t) => t.region === app.state.REGION.id).length, 1,
      'Umbenennen darf keinen zweiten/doppelten Trip-Eintrag erzeugen');
  });

  test('Löschen eines vorgemerkten eigenen Spots entfernt ihn auch aus der Trip-Liste', async () => {
    await legeSpotAn('Bald weg', '1', '');
    const spot = app.state.SPOTS.find((s) => s.my && s.name === 'Bald weg');
    await app.toggleTrip('Bald weg');
    assert.ok(app.inTrip('Bald weg'));

    await ctx.window.delMySpot(spot.myId);

    assert.ok(!app.inTrip('Bald weg'), 'gelöschter Spot darf nicht als Geisterzeile in der Trip-Liste hängen bleiben');
  });

  test('Umbenennen eines NICHT vorgemerkten Spots lässt die Trip-Liste unangetastet', async () => {
    await legeSpotAn('Unbeachtet', '1', '');
    const spot = app.state.SPOTS.find((s) => s.my && s.name === 'Unbeachtet');
    const tripVorher = app.state.trip.length;

    await ctx.window.editMySpot(spot.myId);
    doc.getElementById('myName').value = 'Unbeachtet Umbenannt';
    await app.saveMySpot();

    assert.equal(app.state.trip.length, tripVorher, 'ohne Trip-Eintrag darf sich an state.trip nichts ändern');
  });
});
