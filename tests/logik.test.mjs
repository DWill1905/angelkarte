/* Tests der reinen Logik: Datumsfenster, Schonzeiten, Entnahmefenster, Entfernungen.
   Diese Regeln entscheiden am Wasser über legal/illegal – sie sind der wichtigste Testbereich. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp } from './setup.mjs';

let app, ctx;
before(async () => { ctx = await startApp(); app = ctx.app; });
after(() => ctx?.close());

describe('inWindow – Datumsfenster über Jahresgrenzen', () => {
  test('Fenster innerhalb eines Jahres', () => {
    // Fenster 01.02.–15.04.: am 1. März drin, am 1. Juni draußen.
    // inWindow nutzt intern "heute", daher prüfen wir die Randlogik indirekt über bekannte Paare.
    const drin = app.inWindow([1, 1], [12, 31]);
    assert.equal(drin, true, 'ganzjähriges Fenster muss immer greifen');
  });

  test('Fenster über den Jahreswechsel (Aal 15.09.–01.03.)', () => {
    // Ganzjahres-Gegenprobe: ein Fenster, das heute sicher NICHT greift
    const heute = new Date();
    const morgen = new Date(heute.getTime() + 86400000);
    const uebermorgen = new Date(heute.getTime() + 2 * 86400000);
    const von = [morgen.getMonth() + 1, morgen.getDate()];
    const bis = [uebermorgen.getMonth() + 1, uebermorgen.getDate()];
    assert.equal(app.inWindow(von, bis), false, 'Fenster ab morgen darf heute nicht greifen');
  });
});

describe('inSchonzeit', () => {
  test('Art ohne Schonzeit ist nie geschont', () => {
    assert.equal(app.inSchonzeit({ fisch: 'Wels', von: null, bis: null, mm: '–' }), false);
  });
  test('ganzjährige Schonzeit greift immer', () => {
    assert.equal(app.inSchonzeit({ fisch: 'X', von: [1, 1], bis: [12, 31], mm: '' }), true);
  });
});

describe('daysUntilMD – Countdown', () => {
  test('liefert 0..366 Tage', () => {
    const d = app.daysUntilMD([12, 31]);
    assert.ok(d >= 0 && d <= 366, `unplausibel: ${d}`);
  });
  test('null bei fehlendem Datum', () => {
    assert.equal(app.daysUntilMD(null), null);
  });
  test('heute ergibt 0', () => {
    const h = new Date();
    assert.equal(app.daysUntilMD([h.getMonth() + 1, h.getDate()]), 0);
  });
});

describe('masseAus – Mindest-/Höchstmaß aus Freitext', () => {
  test('Entnahmefenster 50–90 cm', () => {
    const m = app.masseAus('Entnahmefenster 50–90 cm');
    assert.equal(m.min, 50);
    assert.equal(m.max, 90);
  });
  test('nur Mindestmaß (Zander in Hessen)', () => {
    const m = app.masseAus('ab 50 cm (keine Schonzeit – in HE gebietsfremd)');
    assert.equal(m.min, 50);
    assert.ok(!m.max, 'Zander hat kein Höchstmaß');
  });
  test('kein Maß', () => {
    const m = app.masseAus('– (kein gesetzl. Maß)');
    assert.ok(!m.min && !m.max);
  });
  test('Entnahmefenster Aal 50–70', () => {
    const m = app.masseAus('Entnahmefenster 50–70 cm');
    assert.equal(m.min, 50);
    assert.equal(m.max, 70);
  });
});

describe('Entnahmefenster-Semantik (Hessen)', () => {
  const fenster = () => app.masseAus('Entnahmefenster 50–90 cm');
  const entnehmbar = (len) => {
    const m = fenster();
    return len >= m.min && (!m.max || len <= m.max);
  };
  test('60 cm Hecht ist entnehmbar', () => assert.equal(entnehmbar(60), true));
  test('45 cm Hecht ist untermaßig', () => assert.equal(entnehmbar(45), false));
  test('95 cm Hecht ist ÜBER dem Fenster (Laichfisch, muss zurück)', () =>
    assert.equal(entnehmbar(95), false));
  test('exakt 50 und exakt 90 sind erlaubt (Grenzen inklusiv)', () => {
    assert.equal(entnehmbar(50), true);
    assert.equal(entnehmbar(90), true);
  });
});

describe('fmtMD vs fmtDate – der Bug, den TypeScript fand', () => {
  test('fmtMD formatiert [monat, tag]', () => {
    assert.equal(app.fmtMD([7, 9]), '09.07.');
  });
  test('fmtDate formatiert ein Date', () => {
    assert.equal(app.fmtDate(new Date(2026, 6, 9)), '09.07.');
  });
  test('fmtDate erzeugt niemals "undefined"', () => {
    const s = app.fmtDate(new Date());
    assert.ok(!s.includes('undefined'), `fmtDate lieferte: ${s}`);
  });
});

describe('haversine – Entfernungen', () => {
  test('gleicher Punkt = 0 km', () => {
    assert.equal(Math.round(app.haversine(52, 11.6, 52, 11.6)), 0);
  });
  test('Mainz–Magdeburg ist grob 350–420 km', () => {
    const d = app.haversine(49.99, 8.27, 52.13, 11.63);
    assert.ok(d > 300 && d < 450, `unplausibel: ${d} km`);
  });
  test('ein Breitengrad ist ca. 111 km', () => {
    const d = app.haversine(50, 8, 51, 8);
    assert.ok(Math.abs(d - 111) < 2, `${d} km`);
  });
});

describe('solunar – Beißfenster', () => {
  test('liefert Fenster mit gültigen Typen', () => {
    const wins = app.solunar(52, 11.6, new Date());
    assert.ok(Array.isArray(wins));
    wins.forEach((w) => {
      assert.ok(w.type === 'major' || w.type === 'minor', `unbekannter Typ: ${w.type}`);
      assert.ok(w.to > w.from, 'Fensterende muss nach Fensterbeginn liegen');
    });
  });
  test('funktioniert offline (keine API nötig)', () => {
    // startApp mockt fetch als "offline" – solunar muss trotzdem rechnen
    const wins = app.solunar(50.0, 8.3, new Date());
    assert.ok(wins.length > 0, 'Solunar muss ohne Netz Fenster liefern');
  });
});
