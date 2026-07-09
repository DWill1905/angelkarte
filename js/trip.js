/* Trip-Planer: Spots vormerken, als Tagesliste abrufen (regionsübergreifend, persistent) */
import { byId, qsa } from './dom.js';
import { state, store } from './state.js';
import { esc, ICON } from './util.js';
import { mapsLink } from './map.js';
const KEY = 'trip';
export function inTrip(name) {
    if (!state.REGION)
        return false;
    return state.trip.some(t => t.region === state.REGION.id && t.name === name);
}
export async function tripLoad() {
    try {
        const r = await store.get(KEY);
        const parsed = JSON.parse(r.value);
        state.trip = Array.isArray(parsed) ? parsed.filter(t => t && t.region && t.name) : [];
    }
    catch (e) {
        state.trip = [];
    }
}
export async function tripSave() {
    try {
        await store.set(KEY, JSON.stringify(state.trip));
    }
    catch (e) { }
}
export async function toggleTrip(name) {
    if (!state.REGION)
        return;
    const rid = state.REGION.id;
    const i = state.trip.findIndex(t => t.region === rid && t.name === name);
    if (i >= 0)
        state.trip.splice(i, 1);
    else
        state.trip.push({ region: rid, name, notiz: '' });
    await tripSave();
    updateTripBadge();
    /* offenes Popup aktualisieren */
    /* offenes Popup aktualisieren – ohne CSS.escape (nicht überall verfügbar) */
    qsa('.pop-btn.trip').forEach(btn => {
        if (btn.dataset.spot === name)
            setTripBtn(btn, inTrip(name));
    });
}
export function setTripBtn(btn, drin) {
    btn.textContent = drin ? '★ Gemerkt' : '☆ Merken';
    btn.style.background = drin ? '#2f5b4a' : '';
    btn.style.color = drin ? '#b9e6cf' : '';
}
window.toggleTripSpot = async function (name) { await toggleTrip(name); };
/* Badge am Werkzeuge-Button: Anzahl gemerkter Spots */
export function updateTripBadge() {
    const b = byId('tripCount');
    if (b)
        b.textContent = state.trip.length ? String(state.trip.length) : '';
}
export const tripDlg = byId('tripDlg');
export function openTrip() {
    const body = byId('tripBody');
    if (!state.trip.length) {
        body.innerHTML = '<p>Noch keine Spots vorgemerkt.</p><p style="color:var(--muted);margin-top:8px;font-size:12px">Tippe in einem Spot-Popup auf <b>☆ Merken</b>, um ihn hier zu sammeln – z.B. für die Tagesplanung.</p>';
        tripDlg.hidden = false;
        return;
    }
    /* nach Region gruppieren */
    const byRegion = {};
    state.trip.forEach(t => { (byRegion[t.region] = byRegion[t.region] || []).push(t); });
    const regName = rid => { const r = state.REGIONS.find(x => x.id === rid); return r ? (r.kurz || r.name) : rid; };
    let h = '<p style="color:var(--muted);margin-bottom:10px">' + state.trip.length + ' Spot' + (state.trip.length === 1 ? '' : 's') + ' vorgemerkt. Reihenfolge = deine Tagesliste.</p>';
    Object.keys(byRegion).forEach(rid => {
        h += '<div style="margin-top:10px"><b style="color:var(--dusk);font-size:11px;letter-spacing:.1em;text-transform:uppercase">' + esc(regName(rid)) + '</b>';
        byRegion[rid].forEach(t => {
            const spot = (rid === (state.REGION && state.REGION.id)) ? state.SPOTS.find(s => s.name === t.name) : null;
            h += '<div class="trip-row" style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--line)">'
                + '<span style="flex:1">' + esc(t.name) + '</span>'
                + (spot ? '<a class="pop-btn nav" style="padding:4px 8px;font-size:11px" href="' + mapsLink(spot) + '" target="_blank" rel="noopener">Route</a>' : '')
                + '<button class="trip-del" data-region="' + esc(rid) + '" data-name="' + esc(t.name) + '" aria-label="Von der Liste entfernen" style="background:none;border:0;color:var(--muted);cursor:pointer;padding:4px">' + ICON('x') + '</button>'
                + '</div>';
        });
        h += '</div>';
    });
    h += '<div class="mydlg-btns" style="margin-top:12px"><button id="tripClear" class="ghost">Liste leeren</button></div>';
    body.innerHTML = h;
    qsa('.trip-del', body).forEach(b => {
        b.onclick = async () => {
            const { region, name } = b.dataset;
            state.trip = state.trip.filter(t => !(t.region === region && t.name === name));
            await tripSave();
            updateTripBadge();
            openTrip();
        };
    });
    const clr = byId('tripClear');
    if (clr)
        clr.onclick = async () => { state.trip = []; await tripSave(); updateTripBadge(); openTrip(); };
    tripDlg.hidden = false;
}
if (tripDlg) {
    byId('tripClose').onclick = () => { tripDlg.hidden = true; };
    tripDlg.addEventListener('click', e => { if (e.target === tripDlg)
        tripDlg.hidden = true; });
}
export const tripReady = tripLoad().then(updateTripBadge);
