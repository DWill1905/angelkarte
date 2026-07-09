import { byId, inputById } from './dom.js';
import { state, store } from './state.js';
import { applyFilters, buildChips, buildMarkers } from './map.js';
import { esc } from './util.js';
export var myPending = null;
export const myDlg = byId('myDlg');
export async function loadMySpots(rid) {
    try {
        const r = await store.get('myspots:' + rid);
        const a = r && r.value ? JSON.parse(r.value) : [];
        return Array.isArray(a) ? a.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number') : [];
    }
    catch (e) {
        return [];
    }
}
export function uid() { const t = Date.now(); state.uidLast = Math.max(t, state.uidLast + 1); return state.uidLast; }
export function mySpotObj(m) {
    return { name: esc(m.name), nr: m.tiefe ? ('Tiefe ' + m.tiefe + ' m') : 'Eigener Spot', cat: 'eigen', arten: [], lat: m.lat, lng: m.lng,
        fisch: m.tiefe ? (m.tiefe + ' m tief') : '–', methode: '–', karte: 'Eigener Spot (nur auf diesem Gerät gespeichert)',
        note: esc(m.tipp || 'Keine Notiz.') + (m.tiefe ? ' · 📏 ' + m.tiefe + ' m' : ''), warn: false, my: true, myId: m.id };
}
export function openMyDlg() { inputById('myName').value = ''; inputById('myTipp').value = ''; inputById('myTiefe').value = ''; myDlg.hidden = false; inputById('myName').focus(); }
export function closeMyDlg() { myDlg.hidden = true; myPending = null; }
export async function saveMySpot() {
    if (!myPending || !state.REGION)
        return closeMyDlg();
    const m = { id: uid(),
        name: inputById('myName').value.trim() || 'Eigener Spot',
        tipp: inputById('myTipp').value.trim(),
        tiefe: (() => { const t = parseFloat(inputById('myTiefe').value); return (!isNaN(t) && t > 0 && t <= 80) ? t : null; })(),
        lat: myPending[0], lng: myPending[1] };
    const list = await loadMySpots(state.REGION.id);
    list.push(m);
    try {
        await store.set('myspots:' + state.REGION.id, JSON.stringify(list));
    }
    catch (e) { }
    state.SPOTS.push(mySpotObj(m));
    buildMarkers();
    buildChips();
    applyFilters();
    closeMyDlg();
}
window.delMySpot = async function (id) {
    if (!state.REGION)
        return;
    const list = (await loadMySpots(state.REGION.id)).filter(m => m.id !== id);
    try {
        await store.set('myspots:' + state.REGION.id, JSON.stringify(list));
    }
    catch (e) { }
    const i = state.SPOTS.findIndex(sp => sp.myId === id);
    if (i > -1) {
        const sp = state.SPOTS[i];
        if (sp.marker && state.map.hasLayer(sp.marker))
            state.map.removeLayer(sp.marker);
        state.SPOTS.splice(i, 1);
    }
    state.map.closePopup();
    buildChips();
    applyFilters();
};
byId('mySave').onclick = saveMySpot;
byId('myCancel').onclick = closeMyDlg;
myDlg.addEventListener('click', e => { if (e.target === myDlg)
    closeMyDlg(); });
state.map.on('contextmenu', e => { if (!state.REGION)
    return; myPending = [e.latlng.lat, e.latlng.lng]; openMyDlg(); });
/* iOS/Touch: contextmenu feuert bei Long-Press nicht zuverlässig -> eigener Halte-Timer */
export let lpTimer = null, lpStart = null, lpMoved = false;
state.map.on('touchstart mousedown', e => { }); /* Leaflet leitet an eigene Events weiter, wir nutzen den Container */
export const mapC = state.map.getContainer();
mapC.addEventListener('touchstart', ev => {
    if (ev.touches.length !== 1 || !state.REGION)
        return;
    lpMoved = false;
    lpStart = ev.touches[0];
    lpTimer = setTimeout(() => {
        if (lpMoved)
            return;
        const pt = state.map.mouseEventToLatLng(lpStart);
        myPending = [pt.lat, pt.lng];
        openMyDlg();
        if (navigator.vibrate)
            navigator.vibrate(30);
    }, 600);
}, { passive: true });
mapC.addEventListener('touchmove', ev => {
    if (!lpStart)
        return;
    const t = ev.touches[0];
    if (Math.abs(t.clientX - lpStart.clientX) > 12 || Math.abs(t.clientY - lpStart.clientY) > 12) {
        lpMoved = true;
        clearTimeout(lpTimer);
    }
}, { passive: true });
mapC.addEventListener('touchend', () => clearTimeout(lpTimer), { passive: true });
