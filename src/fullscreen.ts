/* Vollbildmodus für die Karte.

   Zwei Ebenen, weil die native Fullscreen-API auf iOS-Safari für normale Elemente
   nicht existiert (nur für <video>) und eine installierte PWA ohnehin keine Browser-UI hat:

   1. Immer: CSS-Vollbild – Header, Tabs und Saison-Leiste weichen, die Karte füllt den Viewport.
      Funktioniert auf iPhone, iPad, Android und Desktop gleichermaßen.
   2. Zusätzlich, falls vorhanden: die echte Fullscreen-API (blendet auf Desktop/Android
      auch die Browserleisten aus).

   Bewusst weiterhin sichtbar: die Sperrzonen-Warnung. Sie darf nie hinter dem Vollbild
   verschwinden – wer neben einer Sperrzone steht, muss das sehen. */
import { state } from './state.js';
import { byId } from './dom.js';
import { ICON } from './util.js';

const KLASSE = 'map-fs';

function nativeAn(el: any): void {
  const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (typeof fn === 'function') { try { fn.call(el); } catch (e) { /* egal, CSS-Vollbild greift */ } }
}
function nativeAus(): void {
  const d: any = document;
  const fn = d.exitFullscreen || d.webkitExitFullscreen || d.msExitFullscreen;
  if (typeof fn === 'function' && (d.fullscreenElement || d.webkitFullscreenElement)) {
    try { fn.call(d); } catch (e) { /* egal */ }
  }
}

/** Ist der Vollbildmodus aktiv? (maßgeblich ist die CSS-Klasse, nicht die API) */
export function fullscreenAktiv(): boolean {
  return document.body.classList.contains(KLASSE);
}

/** Leaflet muss nach jedem Größenwechsel neu messen – sonst bleiben graue Kacheln. */
function kartengroesseNeu(): void {
  if (!state.map) return;
  state.map.invalidateSize(false);
  setTimeout(() => state.map && state.map.invalidateSize(false), 220);
}

function knopfSync(): void {
  const btn = byId('fsBtn');
  if (!btn) return;
  const an = fullscreenAktiv();
  btn.setAttribute('aria-pressed', String(an));
  btn.title = an ? 'Vollbild beenden' : 'Karte im Vollbild';
  btn.innerHTML = ICON(an ? 'x' : 'target');
}

export function fullscreenAn(): void {
  if (fullscreenAktiv()) return;
  document.body.classList.add(KLASSE);
  /* Spotliste einklappen – sie verdeckt sonst die halbe Karte. */
  const sheet = byId('sheet');
  if (sheet) sheet.classList.add('collapsed');
  nativeAn(document.documentElement);
  knopfSync();
  kartengroesseNeu();
}

export function fullscreenAus(): void {
  if (!fullscreenAktiv()) return;
  document.body.classList.remove(KLASSE);
  nativeAus();
  knopfSync();
  kartengroesseNeu();
}

export function fullscreenToggle(): void {
  if (fullscreenAktiv()) fullscreenAus(); else fullscreenAn();
}

/* Verdrahtung */
const btn = byId('fsBtn');
if (btn) btn.onclick = fullscreenToggle;

/* ESC beendet den Vollbildmodus – auch wenn nur die CSS-Ebene aktiv ist. */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && fullscreenAktiv()) fullscreenAus();
});

/* Verlässt der Nutzer das native Vollbild (z.B. über die Browserleiste),
   ziehen wir die CSS-Ebene nach, damit beide Zustände nie auseinanderlaufen. */
['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => {
  document.addEventListener(ev, () => {
    const d: any = document;
    const nativAn = !!(d.fullscreenElement || d.webkitFullscreenElement);
    if (!nativAn && fullscreenAktiv()) {
      document.body.classList.remove(KLASSE);
      knopfSync();
      kartengroesseNeu();
    }
  });
});

/* Drehen des Geräts: Leaflet neu vermessen. */
window.addEventListener('orientationchange', () => setTimeout(kartengroesseNeu, 300));

knopfSync();
