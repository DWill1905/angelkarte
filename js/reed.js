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
let layer = null;
let laeuft = false;
const cache = new Map();
export function schilfAktiv() {
    return !!layer && state.map && state.map.hasLayer(layer);
}
/** Bounding-Box der aktuellen Ansicht, gerundet – dient auch als Cache-Schlüssel. */
function bbox() {
    const b = state.map.getBounds();
    const r = (x) => Math.round(x * 100) / 100;
    const s = [r(b.getSouth()), r(b.getWest()), r(b.getNorth()), r(b.getEast())].join(',');
    return { s, key: s };
}
function query(bb) {
    return `[out:json][timeout:20];(
    way["natural"="wetland"]["wetland"="reedbed"](${bb});
    way["natural"="reed"](${bb});
    relation["natural"="wetland"]["wetland"="reedbed"](${bb});
  );out geom;`;
}
/** Wandelt Overpass-Elemente in Leaflet-Polygone. */
function zuPolygonen(elemente) {
    const polys = [];
    elemente.forEach((el) => {
        const ringe = [];
        if (el.type === 'way' && Array.isArray(el.geometry)) {
            ringe.push(el.geometry.map((p) => [p.lat, p.lon]));
        }
        else if (el.type === 'relation' && Array.isArray(el.members)) {
            el.members.filter((m) => m.role === 'outer' && Array.isArray(m.geometry))
                .forEach((m) => ringe.push(m.geometry.map((p) => [p.lat, p.lon])));
        }
        ringe.filter((r) => r.length >= 3).forEach((r) => {
            polys.push(L.polygon(r, {
                color: '#5fbf7f', weight: 1, fillColor: '#6fd292', fillOpacity: 0.32, interactive: true,
            }).bindTooltip('Schilf / Röhricht (OpenStreetMap)'));
        });
    });
    return polys;
}
function meldung(text, warn = false) {
    const el = byId('schilfStatus');
    if (el) {
        el.textContent = text;
        el.style.color = warn ? 'var(--warn)' : 'var(--muted)';
    }
}
/** Lädt Schilfflächen für den aktuellen Ausschnitt und zeigt sie an. */
export async function schilfLaden() {
    if (!state.map)
        return { ok: false, anzahl: 0, grund: 'keine Karte' };
    if (laeuft)
        return { ok: false, anzahl: 0, grund: 'läuft bereits' };
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
        if (!res.ok)
            throw new Error('HTTP ' + res.status);
        const json = await res.json();
        const polys = zuPolygonen(json.elements || []);
        cache.set(key, polys);
        zeigen(polys);
        meldung(polys.length
            ? polys.length + ' Schilfflächen aus OpenStreetMap eingeblendet.'
            : 'OpenStreetMap kennt hier keine kartierten Schilfflächen. Das heißt nicht, dass keines wächst – es ist nur nicht erfasst.');
        return { ok: true, anzahl: polys.length };
    }
    catch (e) {
        meldung('Schilfdaten nicht abrufbar (' + (e?.message || 'Netzfehler') + '). Offline oder OSM-Server überlastet.', true);
        return { ok: false, anzahl: 0, grund: 'fetch' };
    }
    finally {
        laeuft = false;
    }
}
function zeigen(polys) {
    if (layer)
        state.map.removeLayer(layer);
    layer = L.layerGroup(polys).addTo(state.map);
}
export function schilfAus() {
    if (layer && state.map)
        state.map.removeLayer(layer);
    layer = null;
    meldung('');
}
export async function schilfToggle() {
    if (schilfAktiv())
        schilfAus();
    else
        await schilfLaden();
    const btn = byId('schilfBtn');
    if (btn) {
        const an = schilfAktiv();
        btn.classList.toggle('on', an);
        btn.setAttribute('aria-pressed', String(an));
    }
}
