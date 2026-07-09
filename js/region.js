/* Regions-Verwaltung: JSON-DB laden mit eingebettetem Fallback */
import { byId, selectById } from './dom.js';
import { state, store } from './state.js';
import { REGIONS_EMBEDDED } from './data.js';
import { buildFbOptions, checkFang } from './fangbuch.js';
import { applyFilters, buildChips, buildMarkers, syncFishChips, sperrWarnung } from './map.js';
import { loadMySpots, mySpotObj } from './myspots.js';
import { buildRegeln, buildSchonUI } from './regeln.js';
import { buildBanner, sunLine } from './ui.js';
import { loadWeather } from './weather.js';
export async function initRegions() {
    try {
        const idx = await (await fetch('data/regionen.json', { cache: 'no-cache' })).json();
        const loaded = await Promise.all(idx.map(f => fetch('data/' + f, { cache: 'no-cache' }).then(r => { if (!r.ok)
            throw 0; return r.json(); })));
        state.REGIONS = loaded.filter(r => r && r.id && Array.isArray(r.spots));
        if (!state.REGIONS.length)
            throw 0;
    }
    catch (e) {
        state.REGIONS = REGIONS_EMBEDDED;
    }
    const sel = selectById('regionSel');
    sel.innerHTML = '';
    state.REGIONS.forEach(r => { const o = document.createElement('option'); o.value = r.id; o.textContent = r.name; sel.appendChild(o); });
    let saved = null;
    try {
        saved = (await store.get('region')).value;
    }
    catch (e) { }
    const start = state.REGIONS.find(r => r.id === saved) || state.REGIONS[0];
    sel.value = start.id;
    sel.onchange = async () => { loadRegion(state.REGIONS.find(r => r.id === sel.value)); try {
        await store.set('region', sel.value);
    }
    catch (e) { } };
    loadRegion(start);
}
export async function loadRegion(r) {
    const myToken = ++state.loadToken;
    if (state.REGION)
        state.SPOTS.forEach(sp => {
            if (sp.marker && state.map.hasLayer(sp.marker))
                state.map.removeLayer(sp.marker);
            (sp.hotMarkers || []).forEach(m => { if (state.map.hasLayer(m))
                state.map.removeLayer(m); });
        });
    state.REGION = r;
    state.SCHON = r.schon;
    const mine = await loadMySpots(r.id);
    if (myToken !== state.loadToken)
        return; /* zwischenzeitlich weitergeschaltet */
    state.SPOTS = r.spots.concat(mine.map(mySpotObj));
    byId('footRegion').innerHTML = r.fusszeile || '';
    byId('appTitle').innerHTML = 'Angelrevier ' + (r.kurz || r.name) + ' <span class="tilde">~</span>';
    buildMarkers();
    buildChips();
    buildBanner();
    buildSchonUI();
    buildRegeln();
    buildFbOptions();
    if (typeof checkFang === 'function')
        checkFang(); /* Maßcheck an neue Region anpassen */
    if (typeof sunLine === 'function')
        sunLine();
    state.fishSel = null;
    syncFishChips();
    applyFilters();
    sperrWarnung(); /* Warnung für die neue Region neu bewerten */
    const pts = state.SPOTS.map(sp => [sp.lat, sp.lng]);
    if (pts.length)
        state.map.fitBounds(pts, { padding: [30, 30] });
    loadWeather();
}
