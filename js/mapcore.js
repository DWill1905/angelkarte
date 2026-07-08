/* Karten-Kern: Leaflet-Instanz früh initialisieren (Reihenfolge-kritisch) */
import { state } from './state.js';
state.map=L.map('map');
state.map.setView([51.0,10.0],6); /* neutrale Startansicht (Deutschland), bis Region lädt */
