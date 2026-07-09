/* Gemeinsames Test-Setup: baut das Modul-Bundle, startet jsdom mit Leaflet-Stub
   und liefert eine App-Instanz, gegen die die Tests laufen.

   Warum ein Bundle? Die App nutzt native ES-Module, die jsdom nicht auflöst.
   esbuild bündelt sie zu einem IIFE, das wir in der jsdom-Umgebung evaluieren.
   Der Produktivcode wird NICHT gebündelt ausgeliefert – das ist reines Test-Werkzeug. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');
const ESBUILD = '/tmp/esbuild-install/node_modules/.bin/esbuild';
const BUNDLE = '/tmp/ak-suite-bundle.js';

/** Baut einmalig das Test-Bundle inklusive Hooks aufs window. */
export function buildBundle() {
  const entry = path.join(ROOT, 'js', '_suite-entry.js');
  fs.writeFileSync(entry, `
import './app.js';
import { state } from './state.js';
import { popupHtml, mapsLink, spotVisible, sperrWarnung, locApply } from './map.js';
import { fbInsights, fbRestore, parseFangDatum, beissfensterJetzt, fbRender } from './fangbuch.js';
import { toggleTrip, inTrip, openTrip, tripReady } from './trip.js';
import { schilfLaden, schilfAus, schilfAktiv } from './reed.js';
import { fullscreenToggle, fullscreenAktiv } from './fullscreen.js';
import { empfehlung, kandidaten, openPlan, zielfischFor, startzeitFor, peilung, himmelsrichtung, winkelDiff, istAuflandig } from './plan.js';
import { bewerteSpot, bewerteAlle, sterneAus, sterneText } from './rating.js';
import { inWindow, inSchonzeit, daysUntilMD, masseAus, fmtMD, fmtDate, solunar, haversine } from './astro.js';
window.__app = { state, popupHtml, mapsLink, spotVisible, sperrWarnung, locApply,
  fbInsights, fbRestore, parseFangDatum, beissfensterJetzt, fbRender,
  toggleTrip, inTrip, openTrip, tripReady, schilfLaden, schilfAus, schilfAktiv,
  fullscreenToggle, fullscreenAktiv,
  empfehlung, kandidaten, openPlan, zielfischFor, startzeitFor,
  peilung, himmelsrichtung, winkelDiff, istAuflandig,
  bewerteSpot, bewerteAlle, sterneAus, sterneText,
  inWindow, inSchonzeit, daysUntilMD, masseAus, fmtMD, fmtDate, solunar, haversine };
`);
  try {
    execFileSync(ESBUILD, [entry, '--bundle', '--format=iife', '--outfile=' + BUNDLE], { stdio: 'pipe' });
  } finally {
    fs.unlinkSync(entry);
  }
  return BUNDLE;
}

/** Leaflet-Stub: alles ist aufrufbar und liefert sich selbst zurück. */
function leafletStub(opts = {}) {
  const stub = new Proxy(function () {}, {
    get: (_t, p) => {
      if (p === Symbol.toPrimitive) return () => 0;
      if (p === 'lat') return opts.lat ?? 52;
      if (p === 'lng') return opts.lng ?? 11.6;
      if (p === 'hasLayer') return () => false;
      if (p === 'getElement') return () => null;
      if (p === 'getContainer') return () => ({ addEventListener: () => {} });
      if (p === 'getBounds') return () => opts.bounds ?? { getWest: () => 11.5, getEast: () => 11.7, getNorth: () => 52.2, getSouth: () => 52.0 };
      if (p === 'getZoom') return () => opts.zoom ?? 12;
      if (p === 'on') return (ev, fn) => { (opts.handlers ||= {})[ev] = fn; };
      if (p === 'invalidateSize') return () => { opts.invalidateCalls = (opts.invalidateCalls || 0) + 1; };
      if (p === 'remove' || p === 'addTo' || p === 'bindTooltip' || p === 'setView') return () => stub;
      return stub;
    },
    apply: () => stub,
  });
  return stub;
}

/** Standard-Wetter-Antwort für fetch-Mocks. */
export const WX_CURRENT = {
  current: { time: '2026-07-08T14:00', temperature_2m: 19, wind_speed_10m: 11, wind_direction_10m: 225, surface_pressure: 1008, weather_code: 1 },
  hourly: { time: ['2026-07-08T11:00', '2026-07-08T12:00', '2026-07-08T13:00', '2026-07-08T14:00'], surface_pressure: [1013, 1011, 1009, 1008], weather_code: [1, 1, 2, 1], wind_gusts_10m: [20, 22, 25, 20] },
};
export const WX_DAILY = {
  daily: { time: ['2026-07-08', '2026-07-09', '2026-07-10', '2026-07-11', '2026-07-12', '2026-07-13', '2026-07-14'],
    weather_code: [1, 3, 61, 0, 95, 2, 45], temperature_2m_max: [24, 22, 19, 26, 21, 25, 20],
    temperature_2m_min: [14, 13, 12, 15, 13, 14, 11], wind_speed_10m_max: [12, 18, 25, 9, 30, 11, 14] },
};

/**
 * Startet die App in jsdom.
 * @param {{fetchImpl?: Function, leaflet?: object, storage?: boolean}} opts
 * @returns {Promise<{window: any, app: any, storageMem: object, leafletOpts: object}>}
 */
export async function startApp(opts = {}) {
  const bundlePath = opts.bundlePath || BUNDLE;
  if (!fs.existsSync(bundlePath)) buildBundle();

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    .replace(/<script[^>]*src="js\/app\.js"[^>]*><\/script>/, '<!-- bundle -->');
  const bundle = fs.readFileSync(bundlePath, 'utf8');

  const leafletOpts = { ...(opts.leaflet || {}) };
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://test.local/' });
  const w = dom.window;
  w.L = leafletStub(leafletOpts);
  w.matchMedia = () => ({ matches: false });
  Object.defineProperty(w.navigator, 'geolocation', { value: { getCurrentPosition: () => {} }, configurable: true });
  w.prompt = () => null;
  w.alert = () => {};
  w.URL.createObjectURL = () => 'blob:test';
  w.URL.revokeObjectURL = () => {};

  const storageMem = {};
  if (opts.storage !== false) {
    w.storage = {
      async get(k) { if (!(k in storageMem)) throw new Error('nicht gefunden'); return { key: k, value: storageMem[k] }; },
      async set(k, v) { storageMem[k] = String(v); return { key: k, value: v }; },
    };
  }
  w.fetch = opts.fetchImpl || (async () => { throw new Error('offline'); });

  w.eval(bundle);
  await tick(w, 60);
  return { window: w, app: w.__app, storageMem, leafletOpts, document: w.document,
    /** jsdom sauber schließen – sonst halten offene Timer den Test-Runner am Leben. */
    close() { try { dom.window.close(); } catch (e) {} } };
}

/** Wartet auf Microtasks/Timer. */
export function tick(w, ms = 30) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Wechselt die Region und wartet, bis sie geladen ist. */
export async function loadRegion(ctx, id) {
  const sel = ctx.document.getElementById('regionSel');
  sel.value = id;
  await sel.onchange();
  await tick(ctx.window, 50);
  return ctx.app.state.REGION;
}

/** Beangelbare Spots (ohne Sperr-/Info-Punkte und eigene). */
export function beangelbar(state) {
  return state.SPOTS.filter((s) => !s.my && s.cat !== 'sperr' && s.cat !== 'info');
}
