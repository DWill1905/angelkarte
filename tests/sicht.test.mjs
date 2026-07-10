/* Tests des Sicht-Umschalters (Einfach / Pro).

   Der wichtigste Test hier ist nicht, was verschwindet, sondern was NICHT verschwinden darf:
   Warnungen, Erlaubnis, Kartenlinks, Maß/Entnahmefenster und die Sperrzonen-Warnung
   müssen in beiden Sichten sichtbar bleiben. Eine „einfache" Ansicht darf Bedienung
   vereinfachen, niemals Recht oder Sicherheit. */
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion, tick } from './setup.mjs';

let ctx, app, doc, css;
before(async () => {
  ctx = await startApp();
  app = ctx.app; doc = ctx.document;
  await app.sichtReady;
  css = [...doc.querySelectorAll('style')].map((s) => s.textContent).join('\n');
});
after(() => ctx?.close());
beforeEach(async () => { await app.setzeSicht('pro'); });

/** Trifft eine `body.sicht-einfach`-Regel diesen Selektor mit display:none? */
const wirdVersteckt = (sel) => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('body\\.sicht-einfach[^{]*' + esc + '[^{]*\\{[^}]*display:\\s*none').test(css);
};

describe('Umschalten und Persistenz', () => {
  test('Standard ist die Pro-Sicht', async () => {
    const c = await startApp();
    await c.app.sichtReady;
    assert.equal(c.app.aktuelleSicht(), 'pro');
    c.close();
  });

  test('Umschalten setzt die Body-Klasse und den Knopfzustand', async () => {
    await app.setzeSicht('einfach');
    assert.ok(doc.body.classList.contains('sicht-einfach'));
    assert.equal(app.aktuelleSicht(), 'einfach');
    assert.equal(doc.querySelector('[data-sicht="einfach"]').getAttribute('aria-pressed'), 'true');
    assert.equal(doc.querySelector('[data-sicht="pro"]').getAttribute('aria-pressed'), 'false');

    await app.setzeSicht('pro');
    assert.ok(!doc.body.classList.contains('sicht-einfach'));
  });

  test('ein Klick auf den Knopf wirkt', async () => {
    doc.querySelector('[data-sicht="einfach"]').onclick();
    await tick(ctx.window, 30);
    assert.equal(app.aktuelleSicht(), 'einfach');
  });

  test('die Wahl wird gespeichert', async () => {
    await app.setzeSicht('einfach');
    assert.equal(ctx.storageMem.sicht, 'einfach');
    await app.setzeSicht('pro');
    assert.equal(ctx.storageMem.sicht, 'pro');
  });

  test('nach einem Neustart wird die gespeicherte Sicht geladen', async () => {
    const c = await startApp({ storageImpl: () => ({
      async get(k) { if (k === 'sicht') return { key: k, value: 'einfach' }; throw new Error('nf'); },
      async set() { return {}; },
    })});
    await c.app.sichtReady;
    assert.equal(c.app.aktuelleSicht(), 'einfach');
    c.close();
  });

  test('ein voller Speicher verhindert das Umschalten nicht', async () => {
    const c = await startApp({ storageImpl: () => ({
      async get() { throw new Error('nf'); },
      async set() { throw new Error('QuotaExceededError'); },
    })});
    await c.app.sichtReady;
    await c.app.setzeSicht('einfach');
    assert.equal(c.app.aktuelleSicht(), 'einfach', 'Die Sicht muss wenigstens für die Sitzung greifen');
    c.close();
  });

  test('nach dem Umschalten wird die Karte neu vermessen', async () => {
    const c = await startApp();
    await c.app.sichtReady;
    const vorher = c.leafletOpts.invalidateCalls || 0;
    await c.app.setzeSicht('einfach');
    assert.ok((c.leafletOpts.invalidateCalls || 0) > vorher, 'sonst bleibt ein zu großer Popup-Rahmen stehen');
    c.close();
  });
});

describe('Die Grenze: was in der einfachen Sicht NIEMALS verschwinden darf', () => {
  const mussBleiben = [
    ['.pop-note', 'Spot-Warnung / Hinweistext'],
    ['.pop-warn', 'Warnhervorhebung'],
    ['.pop-links', 'Kartenlinks (Erlaubnisschein)'],
    ['.rate-mass', 'Mindestmaß / Entnahmefenster'],
    ['.rate-sturm', 'Sturmwarnung in der Bewertung'],
    ['#sperrWarn', 'Sperrzonen-Warnung'],
    ['#stormWarn', 'Gewitter-/Sturmwarnung'],
    ['.pop-actions', 'Route und Fang loggen'],
  ];

  mussBleiben.forEach(([sel, name]) => {
    test(`${name} bleibt sichtbar`, () => {
      assert.equal(wirdVersteckt(sel), false,
        `${sel} wird per CSS ausgeblendet – das ist rechtlich oder sicherheitsrelevant`);
    });
  });

  test('die Erlaubnis-Zeile steht weiterhin im Popup', async () => {
    await loadRegion(ctx, 'mecklenburg');
    await app.setzeSicht('einfach');
    const html = app.popupHtml(app.state.SPOTS.find((s) => s.name.includes('Woblitzsee')));
    assert.match(html, /<b>Erlaubnis/);
  });

  test('die Sperrzonen-Warnung erscheint auch in der einfachen Sicht', async () => {
    await loadRegion(ctx, 'main');
    await app.setzeSicht('einfach');
    const sperr = app.state.SPOTS.find((s) => s.cat === 'sperr' && typeof s.lat === 'number');
    app.locApply({ coords: { latitude: sperr.lat, longitude: sperr.lng } });
    await tick(ctx.window, 40);
    assert.equal(doc.getElementById('sperrWarn').hidden, false);
  });

  test('das Fangbuch mit seinem Maßcheck bleibt erreichbar', async () => {
    await app.setzeSicht('einfach');
    assert.ok(doc.querySelector('[data-view="fangbuch"]'), 'Der Fangbuch-Tab darf nicht verschwinden');
    assert.equal(wirdVersteckt('.tabs'), false);
  });
});

describe('Was die einfache Sicht ausblendet', () => {
  const wirdAusgeblendet = [
    ['.tackle', 'Tackle-Ableitung'],
    ['.pop-details', 'Gewässer & Methode'],
    ['.rate-g', 'Faktorenliste der Bewertung'],
    ['[data-gruppe="wasser"]', 'Werkzeuggruppe "Am Wasser"'],
    ['[data-gruppe="karte"]', 'Werkzeuggruppe "Karte & Listen"'],
    ['#tFore', 'Wochen-Vorschau'],
  ];

  wirdAusgeblendet.forEach(([sel, name]) => {
    test(`${name} verschwindet`, () => {
      assert.equal(wirdVersteckt(sel), true, `${sel} sollte in der einfachen Sicht ausgeblendet sein`);
    });
  });

  test('nur die stärkste Zielart bleibt stehen', () => {
    assert.match(css, /body\.sicht-einfach \.rating \.rate-art-block:not\(:first-of-type\)\{display:none\}/);
  });

  test('die Werkzeuge werden über data-Attribute adressiert, nicht über nth-of-type', () => {
    assert.ok(!/body\.sicht-einfach[^{]*nth-of-type/.test(css),
      'nth-of-type bricht, sobald jemand eine Gruppe umsortiert');
  });
});

describe('Der Bewertungsblock ist standardmäßig offen', () => {
  test('„Chancen heute" ist die Kernaussage und startet aufgeklappt', async () => {
    await loadRegion(ctx, 'mecklenburg');
    const html = app.popupHtml(app.state.SPOTS.find((s) => s.name.includes('Woblitzsee')));
    assert.match(html, /<details class="rating" open>/);
  });
});
