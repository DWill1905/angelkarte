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

describe('Hauptmenü', () => {
  /* Sichtbarkeit heißt: die Klasse ist gesetzt UND das CSS blendet ohne sie aus.
     Vorher prüfte der Test nur `wrap.hidden` – das Attribut war gesetzt, aber
     `display:flex` in `.menu-wrap` hebelte es aus. Das Menü blieb offen. */
  const menuSichtbar = () => doc.getElementById('menuWrap').classList.contains('offen');

  test('das CSS blendet das Menü ohne Klasse aus', () => {
    assert.match(css, /\.menu-wrap\{display:none\}/,
      'Ohne diese Regel entscheidet nur das hidden-Attribut – und display:flex schlägt es');
    assert.match(css, /\.menu-wrap\.offen\{[^}]*display:flex/);
  });

  test('das Menü hängt nicht mehr am hidden-Attribut', () => {
    const html = doc.getElementById('menuWrap').outerHTML;
    assert.ok(!/\shidden\b/.test(html.slice(0, 60)), 'zwei Mechanismen für denselben Zustand');
  });
  test('Knopf im Header öffnet und schließt', async () => {
    const btn = doc.getElementById('menuBtn');
    const wrap = doc.getElementById('menuWrap');
    assert.ok(btn && wrap);
    assert.equal(menuSichtbar(), false, 'Menü startet geschlossen');

    btn.click();
    await tick(ctx.window, 30);
    assert.equal(menuSichtbar(), true);
    assert.equal(btn.getAttribute('aria-expanded'), 'true');

    btn.click();
    await tick(ctx.window, 20);
    assert.equal(menuSichtbar(), false);
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
  });

  test('Escape schließt das Menü', async () => {
    doc.getElementById('menuBtn').click();
    await tick(ctx.window, 20);
    doc.dispatchEvent(new ctx.window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(menuSichtbar(), false);
  });

  test('ein Klick auf den Hintergrund schließt', async () => {
    doc.getElementById('menuBtn').click();
    await tick(ctx.window, 20);
    const wrap = doc.getElementById('menuWrap');
    const ev = new ctx.window.MouseEvent('click', { bubbles: true });
    Object.defineProperty(ev, 'target', { value: wrap });
    wrap.dispatchEvent(ev);
    assert.equal(menuSichtbar(), false);
  });

  test('ein Sichtwechsel schließt das Menü, damit die Wirkung sichtbar wird', async () => {
    doc.getElementById('menuBtn').click();
    await tick(ctx.window, 20);
    doc.querySelector('[data-sicht="einfach"]').onclick();
    await tick(ctx.window, 40);
    assert.ok(doc.body.classList.contains('sicht-einfach'));
    assert.equal(menuSichtbar(), false,
      'Sonst verdeckt das Panel genau das, was sich ändert');
    await app.setzeSicht('pro');
  });

  test('die Fußzeile nennt Region und Datenstand', async () => {
    await loadRegion(ctx, 'mecklenburg');
    doc.getElementById('menuBtn').click();
    await tick(ctx.window, 20);
    const fuss = doc.getElementById('menuFuss').textContent;
    assert.match(fuss, /Kleinseenplatte|Mecklenburg/i);
    assert.match(fuss, /geprüft/);
    doc.getElementById('menuClose').click();
  });

  test('Schnellzugriffe öffnen ihre Funktion und schließen das Menü', async () => {
    doc.getElementById('menuBtn').click();
    await tick(ctx.window, 20);
    doc.getElementById('mPlan').click();
    await tick(ctx.window, 60);
    assert.equal(doc.getElementById('planDlg').hidden, false);
    assert.equal(menuSichtbar(), false);
    doc.getElementById('planClose').click();
  });

  test('der Trip-Zähler steht im Menü', async () => {
    app.state.trip.length = 0;
    await loadRegion(ctx, 'elbe');
    await app.toggleTrip(app.state.SPOTS.find((s) => !s.my && s.cat !== 'sperr').name);
    doc.getElementById('menuBtn').click();
    await tick(ctx.window, 20);
    assert.equal(doc.getElementById('menuTripCount').textContent, '(1)');
    doc.getElementById('menuClose').click();
    app.state.trip.length = 0;
  });

  test('der Sicht-Schalter existiert genau einmal', () => {
    assert.equal(doc.querySelectorAll('#sichtWahl').length, 1, 'doppelte IDs brechen die Verdrahtung');
  });

  test('die beiden Sichten sind beschriftet und erklärt', () => {
    const einfach = doc.querySelector('[data-sicht="einfach"]');
    const pro = doc.querySelector('[data-sicht="pro"]');
    assert.match(einfach.textContent, /Einfach/);
    assert.match(einfach.textContent, /Erlaubnis|Warnung|Wichtigste/i, 'Der Nutzer soll wissen, was bleibt');
    assert.match(pro.textContent, /Pro/);
  });
});

describe('Header entschlackt: Wetter im eigenen Dialog', () => {
  test('Sonnen- und Wetterzeile stehen nicht mehr im Header', () => {
    assert.equal(doc.querySelector('header #sunline'), null);
    assert.equal(doc.querySelector('header #wxline'), null);
    assert.ok(doc.querySelector('#wxDlg #sunline'), 'Sonnenzeile gehört in den Wetter-Dialog');
    assert.ok(doc.querySelector('#wxDlg #wxline'));
  });

  test('die IDs existieren genau einmal', () => {
    ['sunline', 'wxline'].forEach((id) =>
      assert.equal(doc.querySelectorAll('#' + id).length, 1, `doppelte ID: ${id}`));
  });

  test('der Chip im Header öffnet den Wetter-Dialog', async () => {
    const chip = doc.getElementById('wxChip');
    assert.ok(chip, 'Chip fehlt – der schnelle Blick ginge verloren');
    chip.click();
    await tick(ctx.window, 30);
    assert.equal(doc.getElementById('wxDlg').hidden, false);
    doc.getElementById('wxClose').click();
  });

  test('der Menüpunkt öffnet den Wetter-Dialog und schließt das Menü', async () => {
    doc.getElementById('menuBtn').click();
    await tick(ctx.window, 20);
    doc.getElementById('mWx').click();
    await tick(ctx.window, 40);
    assert.equal(doc.getElementById('wxDlg').hidden, false);
    assert.ok(!doc.getElementById('menuWrap').classList.contains('offen'));
    doc.getElementById('wxClose').click();
  });

  test('der Header lässt rechts Platz für den Chip', () => {
    assert.match(css, /header\{[^}]*padding-right:136px/,
      'Sonst läuft der Titel unter den Chip');
  });

  test('Warnbanner bleiben im Header-Bereich, nicht im Dialog', () => {
    assert.ok(doc.getElementById('stormWarn'), 'Gewitterwarnung darf nicht in einem Dialog verschwinden');
    assert.ok(doc.getElementById('sperrWarn'));
    assert.equal(doc.querySelector('#wxDlg #stormWarn'), null);
  });
});
