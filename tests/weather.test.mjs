/* Tests für Wetter & Pegel (loadWeather/loadPegel mit gemocktem Netz).

   Die Zusicherungen, die zählen:
   - Wassertemperatur kommt von der NÄCHSTEN Station, die WT wirklich misst –
     nicht vom nächsten Pegel, der oft nur W führt (Mainz, Gießen, Elbe, Seenplatte).
   - Nach einem Wechsel des Kartenzentrums bleibt kein Pegel der alten Gegend stehen.
   - Ohne WT-Station erscheint die gekennzeichnete Schätzung aus der Lufttemperatur. */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, WX_CURRENT } from './setup.mjs';

/* Zwei Stationen: die nahe misst nur W, die fernere W+WT+Q. */
const mock = { stationen: [], ctr: null };
const DAILY = { daily: { time: Array.from({ length: 22 }, (_, i) => `2026-07-${String(i + 1).padStart(2, '0')}`), temperature_2m_mean: Array(22).fill(14) } };

function fetchImpl(url) {
  const json = (v) => Promise.resolve({ json: async () => v });
  if (/api\.open-meteo\.com/.test(url)) return json(/temperature_2m_mean/.test(url) ? DAILY : WX_CURRENT);
  if (/stations\.json/.test(url)) return json(mock.stationen);
  if (/uuid-nah\/W\/currentmeasurement/.test(url)) return json({ value: 120 });
  if (/uuid-fern\/WT\/currentmeasurement/.test(url)) return json({ value: 17.5 });
  if (/uuid-fern\/Q\/currentmeasurement/.test(url)) return json({ value: 55 });
  if (/uuid-fern\/Q\.json/.test(url)) return json({ characteristicValues: [{ shortname: 'MQ', value: 50 }] });
  if (/measurements\.json/.test(url)) return json([]);
  return json({});
}

let ctx, app, doc;
before(async () => {
  ctx = await startApp({ fetchImpl });
  app = ctx.app; doc = ctx.document;
  /* Kartenzentrum der geladenen Region – Stationskoordinaten daran ausrichten. */
  const pts = app.state.SPOTS.filter((s) => !s.my);
  mock.ctr = { lat: pts.reduce((a, s) => a + s.lat, 0) / pts.length, lng: pts.reduce((a, s) => a + s.lng, 0) / pts.length };
});
after(() => ctx?.close());

const NAH = () => ({ uuid: 'uuid-nah', shortname: 'NAHDORF', latitude: mock.ctr.lat + 0.01, longitude: mock.ctr.lng,
  timeseries: [{ shortname: 'W' }] });
const FERN = () => ({ uuid: 'uuid-fern', shortname: 'FERNSEE', latitude: mock.ctr.lat + 0.14, longitude: mock.ctr.lng,
  timeseries: [{ shortname: 'W' }, { shortname: 'WT' }, { shortname: 'Q' }] });

describe('Pegel & Wassertemperatur', () => {
  test('WT und Q kommen von der nächsten Station, die sie misst; W vom nächsten Pegel', async () => {
    mock.stationen = [NAH(), FERN()];
    app.state.wxKey = ''; app.state.PEGEL = null;
    await app.loadWeather();
    const p = app.state.PEGEL;
    assert.ok(p, 'PEGEL muss gesetzt sein');
    assert.equal(p.station, 'NAHDORF', 'Wasserstand von der nächsten Station');
    assert.equal(p.value, 120);
    assert.equal(p.wt, 17.5, 'WT von der WT-fähigen Station');
    assert.equal(p.wtStation, 'FERNSEE');
    assert.ok(p.wtDist > 10, 'Entfernung der WT-Station muss ausgewiesen sein');
    assert.equal(p.abfluss, 55, 'Q von der Q-fähigen Station');
    assert.equal(p.mqQuelle, 'amtlich');
    const zeile = doc.getElementById('wxline').innerHTML;
    assert.match(zeile, /Wasser 18°C \(Fernsee, \d+ km\)/, 'WT-Station samt Entfernung muss offengelegt sein: ' + zeile);
  });

  test('nach Wechsel des Kartenzentrums bleibt kein alter Pegel stehen', async () => {
    mock.stationen = [NAH(), FERN()];
    app.state.wxKey = ''; app.state.PEGEL = null;
    await app.loadWeather();
    assert.ok(app.state.PEGEL, 'Ausgangslage: Pegel da');
    /* Neues Zentrum weit weg, dort gibt es keine Stationen. */
    app.state.userPos = [mock.ctr.lat + 2, mock.ctr.lng + 2];
    mock.stationen = [];
    await app.loadWeather();
    assert.equal(app.state.PEGEL, null, 'Pegel der alten Gegend darf nicht weiterleben');
    app.state.userPos = null;
  });

  test('ohne WT-Station: gekennzeichnete Schätzung aus der Lufttemperatur in der Wetterzeile', async () => {
    mock.stationen = [NAH()]; /* nur W – keine WT weit und breit */
    app.state.wxKey = ''; app.state.PEGEL = null;
    await app.loadWeather();
    assert.equal(app.state.PEGEL?.wt, undefined, 'keine gemessene WT');
    const zeile = doc.getElementById('wxline').innerHTML;
    assert.match(zeile, /Wasser ≈\d+°C \(geschätzt aus Lufttemperatur\)/, 'Schätzung muss gekennzeichnet erscheinen: ' + zeile);
    assert.ok(app.state.WXD, 'Tagesmittel müssen im State liegen');
  });
});

describe('Wetter-Chip im Header: Lade- vs. Fehlerzustand', () => {
  /* Vorher zeigte der Chip in beiden Fällen nur "–", ohne dass zu erkennen war, ob noch
     geladen wird oder der Abruf endgültig fehlgeschlagen ist (z.B. offline). */
  test('vor jedem Abruf: Lade-Zustand ("–" + .loading, kein Fehler-Symbol)', () => {
    app.state.WX = null; app.state.wxError = false;
    app.wxChipSetzen();
    const chip = doc.getElementById('wxChip');
    assert.equal(chip.textContent, '–');
    assert.ok(chip.classList.contains('loading'), 'Lade-Puls muss aktiv sein');
    assert.ok(!chip.classList.contains('warn'));
  });

  test('fehlgeschlagener Abruf: Warnsymbol statt "–", kein Lade-Puls mehr', async () => {
    mock.stationen = [];
    app.state.wxKey = ''; app.state.WX = null; app.state.wxError = false;
    ctx.window.fetch = async () => { throw new Error('offline'); };
    await app.loadWeather();
    const chip = doc.getElementById('wxChip');
    assert.equal(app.state.wxError, true);
    assert.equal(chip.textContent, '⚠');
    assert.ok(!chip.classList.contains('loading'), 'kein Lade-Puls mehr, der Abruf ist fertig (fehlgeschlagen)');
    assert.match(chip.title, /nicht verfügbar/);
    ctx.window.fetch = fetchImpl;
  });

  test('erfolgreicher Abruf nach einem Fehler räumt Fehler- und Lade-Zustand wieder auf', async () => {
    mock.stationen = [NAH(), FERN()];
    app.state.wxKey = ''; app.state.WX = null; app.state.wxError = true;
    await app.loadWeather();
    const chip = doc.getElementById('wxChip');
    assert.equal(app.state.wxError, false, 'Erfolg muss den Fehler-Zustand zurücksetzen');
    assert.ok(!chip.classList.contains('loading'));
    assert.match(chip.textContent, /°/, 'zeigt wieder die Temperatur: ' + chip.textContent);
  });
});
