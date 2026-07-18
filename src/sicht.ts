/* Zwei Sichten: „Einfach" und „Pro".

   Die einfache Sicht reduziert Entscheidungen, nicht Sicherheit. Was auch dort
   IMMER sichtbar bleibt und niemals ausgeblendet werden darf:
   - Warnungen (Sperrzone, Gewitter, Hochwasser, Spot-Warnhinweis)
   - Erlaubnis und Kartenlinks (rechtlich relevant)
   - Mindestmaß / Entnahmefenster des Zielfischs
   - Schonzeit-Hinweise

   Ausgeblendet werden nur Vertiefungen: Tackle-Ableitung, Gewässer-/Methodendetails,
   die Faktorenliste der Bewertung, seltener genutzte Werkzeuge.
   Die Umschaltung läuft rein über eine Klasse am <body> – kein Neurendern der Popups. */
import { state, store } from './state.js';
import { byId } from './dom.js';

export type Sicht = 'einfach' | 'pro';

const KEY = 'sicht';
const KLASSE = 'sicht-einfach';

export function aktuelleSicht(): Sicht {
  return document.body.classList.contains(KLASSE) ? 'einfach' : 'pro';
}

function anwenden(s: Sicht): void {
  document.body.classList.toggle(KLASSE, s === 'einfach');
  const box = byId('sichtWahl');
  if (box) {
    box.querySelectorAll('button').forEach((b) => {
      const an = (b as HTMLElement).dataset.sicht === s;
      b.classList.toggle('on', an);
      b.setAttribute('aria-pressed', String(an));
    });
  }
  /* Leaflet muss die Popupgröße neu messen, sonst bleibt ein zu großer Rahmen stehen. */
  if (state.map && typeof state.map.invalidateSize === 'function') state.map.invalidateSize(false);
}

export async function setzeSicht(s: Sicht): Promise<void> {
  anwenden(s);
  try { await store.set(KEY, s); } catch (e) { /* Speicher voll – Sicht gilt für diese Sitzung */ }
}

export async function ladeSicht(): Promise<Sicht> {
  /* Usability-Review (4/4): ein Erstbesuch landete bisher direkt in der dichtesten Ansicht
     der App (Pro) und musste den Umschalter im Menü erst selbst entdecken, um es sich
     einfacher zu machen - dabei ist "Einfach" fuer den Erstkontakt die bessere Startrampe.
     Wer die Sicht schon einmal gewaehlt hat, bekommt weiterhin genau die - nur der Default
     fuer echte Erstbesuche (kein Eintrag im Storage) dreht sich um. */
  let s: Sicht = 'einfach';
  try {
    const r = await store.get(KEY);
    if (r.value === 'einfach' || r.value === 'pro') s = r.value;
  } catch (e) { /* nichts gespeichert */ }
  anwenden(s);
  return s;
}

/* ---------- Hauptmenü ---------- */

const OFFEN = 'offen';

export function menuOffen(): boolean {
  const w = byId('menuWrap');
  return !!w && w.classList.contains(OFFEN);
}
export function menuAuf(): void {
  const w = byId('menuWrap');
  if (!w) return;
  w.classList.add(OFFEN);
  byId('menuBtn')?.setAttribute('aria-expanded', 'true');
  const f = byId('menuFuss');
  if (f && state.REGION) {
    f.textContent = state.REGION.name + (state.REGION.geprueft ? ' · Daten geprüft ' + state.REGION.geprueft : '');
  }
  const badge = byId('menuTripCount');
  if (badge) badge.textContent = state.trip.length ? '(' + state.trip.length + ')' : '';
}
export function menuZu(): void {
  const w = byId('menuWrap');
  if (!w) return;
  w.classList.remove(OFFEN);
  byId('menuBtn')?.setAttribute('aria-expanded', 'false');
}

/* Sicherheitsnetz: Falls durch einen Cache-Mix ein alter Zustand hängen bleibt,
   startet das Menü in jedem Fall geschlossen. */
menuZu();

/* Verdrahtung: Sicht-Schalter (im Menü) */
const box = byId('sichtWahl');
if (box) {
  box.querySelectorAll('button').forEach((b) => {
    (b as HTMLElement).onclick = async () => {
      const s = (b as HTMLElement).dataset.sicht as Sicht;
      if (!s) return;
      await setzeSicht(s);
      /* Menü schließen: sonst sieht man die Wirkung nicht, weil das Panel davor liegt. */
      menuZu();
    };
  });
}

byId('menuBtn')?.addEventListener('click', () => (menuOffen() ? menuZu() : menuAuf()));
byId('menuClose')?.addEventListener('click', menuZu);
byId('menuWrap')?.addEventListener('click', (e) => { if (e.target === byId('menuWrap')) menuZu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOffen()) menuZu(); });

export const sichtReady = ladeSicht();
