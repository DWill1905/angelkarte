/* Tests des Vollbildmodus.
   Kernzusagen: die Karte wird neu vermessen (sonst graue Kacheln), Warnungen bleiben
   sichtbar, und der Zustand läuft nie zwischen CSS-Ebene und nativer API auseinander. */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion, tick } from './setup.mjs';

let ctx, app, doc, win;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; win = ctx.window; });
after(() => ctx?.close());
beforeEach(() => { doc.body.classList.remove('map-fs'); });

describe('Vollbild ein- und ausschalten', () => {
  test('der Knopf existiert und ist zunächst nicht gedrückt', () => {
    const btn = doc.getElementById('fsBtn');
    assert.ok(btn, 'Vollbild-Knopf fehlt');
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
  });

  test('Klick schaltet den Vollbildmodus ein und wieder aus', () => {
    const btn = doc.getElementById('fsBtn');
    btn.onclick();
    assert.ok(doc.body.classList.contains('map-fs'), 'CSS-Klasse fehlt');
    assert.equal(btn.getAttribute('aria-pressed'), 'true');

    btn.onclick();
    assert.ok(!doc.body.classList.contains('map-fs'));
    assert.equal(btn.getAttribute('aria-pressed'), 'false');
  });

  test('der Knopf wechselt Symbol und Beschriftung', () => {
    const btn = doc.getElementById('fsBtn');
    const vorher = btn.title;
    btn.onclick();
    assert.notEqual(btn.title, vorher, 'Titel sollte sich ändern');
    assert.match(btn.title, /beenden/i);
    btn.onclick();
    assert.match(btn.title, /Vollbild/i);
  });

  test('doppeltes Einschalten ist unschädlich', () => {
    const btn = doc.getElementById('fsBtn');
    btn.onclick();
    doc.body.classList.add('map-fs'); // simuliert erneuten Aufruf
    btn.onclick();
    assert.ok(!doc.body.classList.contains('map-fs'), 'Ausschalten muss trotzdem greifen');
  });
});

describe('Karte wird neu vermessen', () => {
  test('invalidateSize wird beim Umschalten aufgerufen', async () => {
    const c = await startApp({ leaflet: {} });
    const vorher = c.leafletOpts.invalidateCalls || 0;
    c.document.getElementById('fsBtn').onclick();
    await tick(c.window, 60);
    const nachher = c.leafletOpts.invalidateCalls || 0;
    assert.ok(nachher > vorher,
      'Ohne invalidateSize bleiben nach dem Größenwechsel graue Kacheln stehen');
    c.close();
  });
});

describe('Warnungen bleiben im Vollbild sichtbar', () => {
  test('die Sperrzonen-Warnung wird nicht ausgeblendet', async () => {
    await loadRegion(ctx, 'main');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr' && typeof s.lat === 'number');
    app.locApply({ coords: { latitude: sperr.lat, longitude: sperr.lng } });
    await tick(win, 40);
    assert.equal(doc.getElementById('sperrWarn').hidden, false, 'Vorbedingung: Warnung sichtbar');

    doc.getElementById('fsBtn').onclick();
    assert.equal(doc.getElementById('sperrWarn').hidden, false,
      'Die Sperrzonen-Warnung darf im Vollbild nicht verschwinden');
    doc.getElementById('fsBtn').onclick();
  });

  test('das Stylesheet blendet Sperrzonen- und Sturmwarnung nicht aus', () => {
    const css = doc.head.innerHTML + doc.documentElement.innerHTML.slice(0, 0);
    const stylesheet = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    // In der map-fs-Regelgruppe dürfen die Warn-IDs nicht auf display:none stehen
    const versteckt = /body\.map-fs[^{]*#(sperrWarn|stormWarn)[^{]*\{[^}]*display:\s*none/;
    assert.ok(!versteckt.test(stylesheet), 'Eine Warnung wird per CSS versteckt');
    assert.match(stylesheet, /body\.map-fs #stormWarn\{display:block/,
      'Sturmwarnung muss im Vollbild explizit sichtbar bleiben');
  });
});

describe('Bedienung', () => {
  test('Escape beendet den Vollbildmodus', () => {
    doc.getElementById('fsBtn').onclick();
    assert.ok(doc.body.classList.contains('map-fs'));

    const ev = new win.KeyboardEvent('keydown', { key: 'Escape' });
    doc.dispatchEvent(ev);
    assert.ok(!doc.body.classList.contains('map-fs'), 'Escape muss beenden');
  });

  test('Escape ohne Vollbild tut nichts', () => {
    assert.ok(!doc.body.classList.contains('map-fs'));
    doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.ok(!doc.body.classList.contains('map-fs'));
  });

  test('die Spotliste wird beim Öffnen eingeklappt', () => {
    const sheet = doc.getElementById('sheet');
    sheet.classList.remove('collapsed');
    doc.getElementById('fsBtn').onclick();
    assert.ok(sheet.classList.contains('collapsed'),
      'Die aufgeklappte Liste würde die halbe Karte verdecken');
    doc.getElementById('fsBtn').onclick();
  });
});

describe('Layout-Regeln', () => {
  test('Header, Tabs und Saison-Leiste weichen im Vollbild', () => {
    const stylesheet = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    assert.match(stylesheet, /body\.map-fs > header/);
    assert.match(stylesheet, /body\.map-fs > \.tabs/);
    assert.match(stylesheet, /body\.map-fs #saisonBar/);
  });

  test('Safe-Area des iPhones wird berücksichtigt', () => {
    const stylesheet = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
    assert.match(stylesheet, /\.fsbtn\{[^}]*env\(safe-area-inset-top\)/s,
      'Der Knopf säße sonst unter der Dynamic Island');
  });
});
