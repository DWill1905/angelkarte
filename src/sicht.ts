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
  let s: Sicht = 'pro';
  try {
    const r = await store.get(KEY);
    if (r.value === 'einfach' || r.value === 'pro') s = r.value;
  } catch (e) { /* nichts gespeichert */ }
  anwenden(s);
  return s;
}

/* Verdrahtung der Schalter */
const box = byId('sichtWahl');
if (box) {
  box.querySelectorAll('button').forEach((b) => {
    (b as HTMLElement).onclick = () => {
      const s = (b as HTMLElement).dataset.sicht as Sicht;
      if (s) setzeSicht(s);
    };
  });
}

export const sichtReady = ladeSicht();
