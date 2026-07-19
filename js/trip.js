/* Trip-Planer: Spots vormerken, als Tagesliste abrufen (regionsübergreifend, persistent) */
import { byId, qsa } from './dom.js';
import { state, store } from './state.js';
import { esc, ICON, de1 } from './util.js';
import { mapsLink } from './map.js';
import { tagesplan, tagLabel, MAX_TAG } from './plan.js';
import { hhmm } from './astro.js';
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
    catch (e) {
        state.persistent = false;
    }
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
    btn.setAttribute('aria-pressed', String(drin));
    btn.classList.toggle('on', drin);
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
/* ---- Tagesplan über die gemerkten Spots ---- */
export const routeDlg = byId('routeDlg');
let routeTag = 0;
export function openRoute() {
    routeTag = 0;
    renderRoute();
    if (routeDlg)
        routeDlg.hidden = false;
}
function renderRoute() {
    const body = byId('routeBody');
    if (!body)
        return;
    const lbl = byId('routeTagLabel');
    if (lbl)
        lbl.textContent = tagLabel(routeTag);
    const pv = byId('routePrev');
    if (pv)
        pv.disabled = routeTag <= 0;
    const nx = byId('routeNext');
    if (nx)
        nx.disabled = routeTag >= MAX_TAG;
    const stopps = tagesplan(routeTag);
    if (!stopps.length) {
        body.innerHTML = '<p>Für diesen Tag lässt sich kein Plan bauen.</p>'
            + '<p style="color:var(--muted);margin-top:8px;font-size:12px">Merke dir mindestens einen Spot der aktuellen Region (☆ Merken im Popup). Sind alle Zielfische geschont, bleibt der Plan ebenfalls leer – das ist Absicht.</p>';
        return;
    }
    let h = '<p style="color:var(--muted);margin-bottom:10px">' + stopps.length + ' Stopp' + (stopps.length === 1 ? '' : 's')
        + ' – jeder Spot in dem Beißfenster, in dem er am stärksten ist.</p>';
    stopps.forEach((s, i) => {
        h += '<div style="display:flex;gap:9px;padding:8px 0;border-bottom:1px solid var(--line)">'
            + '<div style="min-width:14px;color:var(--dusk);font-weight:700">' + (i + 1) + '</div>'
            + '<div style="flex:1">'
            + '<div style="font-family:\'Space Mono\',monospace;color:' + (s.typ === 'major' ? 'var(--amber)' : 'var(--dusk)') + '">'
            + hhmm(s.von) + '–' + hhmm(s.bis) + ' · ' + esc(s.label) + (s.typ === 'major' ? ' · stark' : '') + '</div>'
            + '<div style="font-weight:700;margin-top:1px">' + esc(s.spot.name) + '</div>'
            + '<div style="color:var(--muted);font-size:12px">' + esc(s.art) + ' · ' + s.chance + '\u202F% Chance</div>'
            + (s.weiter != null ? '<div style="color:var(--muted);font-size:11px;margin-top:3px">↓ ' + de1(s.weiter) + ' km Luftlinie zum nächsten Stopp</div>' : '')
            + '</div>'
            + '<a class="pop-btn nav" style="padding:4px 8px;font-size:11px;align-self:flex-start" href="' + mapsLink(s.spot) + '" target="_blank" rel="noopener">Route</a>'
            + '</div>';
    });
    h += '<p style="color:var(--muted);margin-top:10px;font-size:11px">Entfernungen sind <b>Luftlinie</b> – echte Fahrzeiten kennt die App nicht. '
        + 'Die Reihenfolge folgt den Beißfenstern, nicht dem kürzesten Weg.</p>';
    body.innerHTML = h;
}
(function () {
    if (!routeDlg)
        return;
    const zu = () => { routeDlg.hidden = true; };
    const c = byId('routeClose');
    if (c)
        c.onclick = zu;
    routeDlg.addEventListener('click', ev => { if (ev.target === routeDlg)
        zu(); });
    const pv = byId('routePrev');
    const nx = byId('routeNext');
    if (pv)
        pv.onclick = () => { if (routeTag > 0) {
            routeTag--;
            renderRoute();
        } };
    if (nx)
        nx.onclick = () => { if (routeTag < MAX_TAG) {
            routeTag++;
            renderRoute();
        } };
})();
export function openTrip() {
    const body = byId('tripBody');
    if (!state.trip.length) {
        body.innerHTML = '<div class="fb-empty">Noch keine Spots vorgemerkt.<br>Tippe in einem Spot-Popup auf <b>☆ Merken</b>, um ihn hier zu sammeln – z.B. für die Tagesplanung.</div>';
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
    h += '<div class="mydlg-btns" style="margin-top:12px"><button id="tripRoute">Tagesplan bauen</button><button id="tripClear" class="ghost">Liste leeren</button></div>';
    body.innerHTML = h;
    const rb = byId('tripRoute');
    if (rb)
        rb.onclick = () => { tripDlg.hidden = true; openRoute(); };
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
