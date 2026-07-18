/* Test für "Karte offline sichern": Schließen des Dialogs muss den laufenden
   Kachel-Download abbrechen statt ihn im Hintergrund weiterlaufen zu lassen (kostet sonst
   Akku/Datenvolumen, obwohl niemand mehr hinschaut) - vorher lief cacheViewport() ohne
   jede Abbruchmöglichkeit und ohne Timeout je Kachel bis zum Ende durch. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, loadRegion } from './setup.mjs';

let ctx, app, doc;
before(async () => { ctx = await startApp(); app = ctx.app; doc = ctx.document; await loadRegion(ctx, 'elbe'); });
after(() => ctx?.close());

/** Cache-Stub ohne Treffer (jede Kachel muss "geholt" werden) + Fetch, der erst auflöst,
    wenn sein AbortSignal feuert - simuliert eine haengende Kachelanfrage. */
function installiereHaengendenFetch() {
  const signale = [];
  ctx.window.caches = { open: async () => ({ match: async () => undefined, put: async () => {} }) };
  ctx.window.fetch = (url, opts) => {
    signale.push(opts && opts.signal);
    return new Promise((resolve, reject) => {
      const sig = opts && opts.signal;
      if (sig) sig.addEventListener('abort', () => reject(new Error('aborted')));
    });
  };
  return signale;
}

describe('Karte offline sichern: Abbrechbarkeit', () => {
  test('Schließen des Dialogs bricht eine laufende Sicherung ab (Signal wird aborted)', async () => {
    const signale = installiereHaengendenFetch();
    const lauf = app.openOffline();
    await new Promise((r) => setTimeout(r, 20)); // erste Kachel-Anfrage anlaufen lassen

    assert.ok(signale.length > 0, 'es sollte mindestens ein fetch gestartet worden sein');
    assert.equal(signale[0].aborted, false, 'vor dem Schließen darf noch nichts aborted sein');

    doc.getElementById('offClose').onclick();
    await lauf; // openOffline() muss sich jetzt sauber beenden, nicht haengen bleiben

    assert.equal(signale[0].aborted, true, 'das Fetch-Signal der laufenden Kachel muss aborted sein');
    assert.ok(doc.getElementById('offDlg').hidden, 'Dialog sollte geschlossen sein');
    assert.ok(!/offline verfügbar/.test(doc.getElementById('offBody').innerHTML),
      'nach dem Abbruch darf keine verspätete Erfolgsmeldung mehr reinschreiben');
  });

  test('cacheViewport() bricht sofort ab, wenn das Signal schon vor dem Start aborted ist', async () => {
    installiereHaengendenFetch();
    const ctrl = new ctx.window.AbortController();
    ctrl.abort();
    const res = await app.cacheViewport(null, ctrl.signal);
    assert.equal(res.abgebrochen, true);
    assert.equal(res.done, 0, 'keine einzige Kachel sollte noch bearbeitet worden sein');
  });
});
