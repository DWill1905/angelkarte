/* Schilf-/Röhricht-Layer aus OpenStreetMap.

   Echte Daten statt gemalter Flächen: OSM kennt `natural=wetland` mit `wetland=reedbed`
   sowie `natural=reed`. Abgefragt über die öffentliche Overpass-API – keyfrei, aber
   eine externe Abhängigkeit mit Rate-Limit. Deshalb:
   - nur auf Nutzerwunsch (Schalter), nie automatisch beim Start
   - nur ab Zoom 12 (sonst zu große Bounding-Box)
   - Ergebnisse werden pro Ausschnitt zwischengespeichert
   - jeder Fehler wird angezeigt, nie verschluckt: keine Daten heißt "keine Daten",
     nicht "hier wächst kein Schilf". */
import { state } from './state.js';
import { byId } from './dom.js';

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const MIN_ZOOM = 12;

let layer: any = null;
let laeuft = false;
const cache = new Map<string, any>();

export function schilfAktiv(): boolean {
  return !!layer && state.map && state.map.hasLayer(layer);
}

/** Bounding-Box der aktuellen Ansicht, gerundet – dient auch als Cache-Schlüssel. */
function bbox(): { s: string; key: string } {
  const b = state.map.getBounds();
  const r = (x: number) => Math.round(x * 100) / 100;
  const s = [r(b.getSouth()), r(b.getWest()), r(b.getNorth()), r(b.getEast())].join(',');
  return { s, key: s };
}

function query(bb: string): string {
  return `[out:json][timeout:20];(
    way["natural"="wetland"]["wetland"="reedbed"](${bb});
    way["natural"="reed"](${bb});
    relation["natural"="wetland"]["wetland"="reedbed"](${bb});
  );out geom;`;
}

/** Wandelt Overpass-Elemente in Leaflet-Polygone. */
function zuPolygonen(elemente: any[]): any[] {
  const polys: any[] = [];
  elemente.forEach((el) => {
    const ringe: Array<Array<[number, number]>> = [];
    if (el.type === 'way' && Array.isArray(el.geometry)) {
      ringe.push(el.geometry.map((p: any) => [p.lat, p.lon] as [number, number]));
    } else if (el.type === 'relation' && Array.isArray(el.members)) {
      el.members.filter((m: any) => m.role === 'outer' && Array.isArray(m.geometry))
        .forEach((m: any) => ringe.push(m.geometry.map((p: any) => [p.lat, p.lon] as [number, number])));
    }
    ringe.filter((r) => r.length >= 3).forEach((r) => {
      polys.push(L.polygon(r, {
        color: '#5fbf7f', weight: 1, fillColor: '#6fd292', fillOpacity: 0.32, interactive: true,
      }).bindTooltip('Schilf / Röhricht (OpenStreetMap)'));
    });
  });
  return polys;
}

function meldung(text: string, warn = false): void {
  const el = byId('schilfStatus');
  if (el) {
    el.textContent = text;
    el.style.color = warn ? 'var(--warn)' : 'var(--muted)';
  }
}

/** Lädt Schilfflächen für den aktuellen Ausschnitt und zeigt sie an. */
export async function schilfLaden(): Promise<{ ok: boolean; anzahl: number; grund?: string }> {
  if (!state.map) return { ok: false, anzahl: 0, grund: 'keine Karte' };
  if (laeuft) return { ok: false, anzahl: 0, grund: 'läuft bereits' };

  const zoom = Math.round(state.map.getZoom());
  if (zoom < MIN_ZOOM) {
    meldung('Bitte näher heranzoomen (mindestens Zoomstufe ' + MIN_ZOOM + ') – sonst wird der Ausschnitt zu groß für den OSM-Server.', true);
    return { ok: false, anzahl: 0, grund: 'zoom' };
  }

  const { s: bb, key } = bbox();
  if (cache.has(key)) {
    zeigen(cache.get(key));
    return { ok: true, anzahl: cache.get(key).length };
  }

  laeuft = true;
  meldung('Lade Schilfflächen aus OpenStreetMap …');
  try {
    const res = await fetch(OVERPASS, { method: 'POST', body: 'data=' + encodeURIComponent(query(bb)) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const polys = zuPolygonen(json.elements || []);
    cache.set(key, polys);
    zeigen(polys);
    meldung(polys.length
      ? polys.length + ' Schilfflächen aus OpenStreetMap eingeblendet.'
      : 'OpenStreetMap kennt hier keine kartierten Schilfflächen. Das heißt nicht, dass keines wächst – es ist nur nicht erfasst.');
    return { ok: true, anzahl: polys.length };
  } catch (e: any) {
    meldung('Schilfdaten nicht abrufbar (' + (e?.message || 'Netzfehler') + '). Offline oder OSM-Server überlastet.', true);
    return { ok: false, anzahl: 0, grund: 'fetch' };
  } finally {
    laeuft = false;
  }
}

function zeigen(polys: any[]): void {
  if (layer) state.map.removeLayer(layer);
  layer = L.layerGroup(polys).addTo(state.map);
}

export function schilfAus(): void {
  if (layer && state.map) state.map.removeLayer(layer);
  layer = null;
  meldung('');
  knopfSync();
}

/** Schalterzustand an die Realität angleichen. */
function knopfSync(): void {
  const btn = byId('schilfBtn');
  if (!btn) return;
  const an = schilfAktiv();
  btn.classList.toggle('on', an);
  btn.setAttribute('aria-pressed', String(an));
}

export async function schilfToggle(): Promise<void> {
  if (schilfAktiv()) schilfAus();
  else await schilfLaden();
  knopfSync();
}
