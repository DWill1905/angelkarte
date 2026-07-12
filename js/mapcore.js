/* Karten-Kern: Leaflet-Instanz früh initialisieren (Reihenfolge-kritisch) */
import { state } from './state.js';
/* closePopupOnClick:false – sonst schließt markercluster den Marker-Klick als Karten-Klick
   durch und das gerade geöffnete Popup verschwindet sofort wieder. */
state.map = L.map('map', { closePopupOnClick: false });
state.map.setView([51.0, 10.0], 6); /* neutrale Startansicht (Deutschland), bis Region lädt */
/* iOS/iPad-Absicherung: Leaflet die Containergröße nach Layout/Load neu messen lassen,
   sonst kann die Karte auf Safari mit 0 Höhe unsichtbar bleiben. */
function nudgeMapSize() { if (state.map)
    state.map.invalidateSize(false); }
window.addEventListener('load', () => { setTimeout(nudgeMapSize, 100); setTimeout(nudgeMapSize, 600); });
window.addEventListener('orientationchange', () => setTimeout(nudgeMapSize, 300));
if (document.readyState === 'complete')
    setTimeout(nudgeMapSize, 100);
