import { byId, inputById } from './dom.js';
import { state, store } from './state.js';
import { applyFilters, buildChips, buildMarkers } from './map.js';
import { esc, ICON } from './util.js';
import { tripSave, updateTripBadge } from './trip.js';
export var myPending = null;
/** Wird beim Bearbeiten eines bestehenden eigenen Spots gesetzt (myId), sonst null -
    steuert in saveMySpot(), ob ein neuer Eintrag angelegt oder ein bestehender aktualisiert wird. */
export var myEditId = null;
export const myDlg = byId('myDlg');
export async function loadMySpots(rid) {
    try {
        const r = await store.get('myspots:' + rid);
        const a = r && r.value ? JSON.parse(r.value) : [];
        return Array.isArray(a) ? a.filter(m => m && typeof m.lat === 'number' && typeof m.lng === 'number') : [];
    }
    catch {
        return [];
    }
}
export function uid() { const t = Date.now(); state.uidLast = Math.max(t, state.uidLast + 1); return state.uidLast; }
export function mySpotObj(m) {
    return { name: esc(m.name), nr: m.tiefe ? ('Tiefe ' + m.tiefe + ' m') : 'Eigener Spot', cat: 'eigen', arten: [], lat: m.lat, lng: m.lng,
        fisch: m.tiefe ? (m.tiefe + ' m tief') : '–', methode: '–', karte: 'Eigener Spot (nur auf diesem Gerät gespeichert)',
        note: esc(m.tipp || 'Keine Notiz.') + (m.tiefe ? ' · 📏 ' + m.tiefe + ' m' : ''), warn: false, my: true, myId: m.id };
}
export function openMyDlg() {
    myEditId = null;
    byId('myDlgTitle').innerHTML = ICON('pin') + ' Eigenen Spot speichern';
    byId('myDlgTipp').hidden = false;
    inputById('myName').value = '';
    inputById('myTipp').value = '';
    inputById('myTiefe').value = '';
    myDlg.hidden = false;
    inputById('myName').focus();
}
/** Oeffnet denselben Dialog vorbefuellt zum Bearbeiten - vorher liess sich ein eigener Spot
    nur loeschen und komplett neu anlegen, ein Tippfehler im Namen war nicht korrigierbar,
    ohne die Koordinate erneut per Long-Press/Rechtsklick zu treffen. */
window.editMySpot = async function (id) {
    if (!state.REGION)
        return;
    const list = await loadMySpots(state.REGION.id);
    const m = list.find(x => x.id === id);
    if (!m)
        return;
    myEditId = id;
    myPending = null;
    byId('myDlgTitle').innerHTML = ICON('pin') + ' Eigenen Spot bearbeiten';
    byId('myDlgTipp').hidden = true;
    inputById('myName').value = m.name || '';
    inputById('myTipp').value = m.tipp || '';
    inputById('myTiefe').value = m.tiefe != null ? String(m.tiefe) : '';
    myDlg.hidden = false;
    inputById('myName').focus();
};
export function closeMyDlg() { myDlg.hidden = true; myPending = null; myEditId = null; }
export async function saveMySpot() {
    if (!state.REGION || (!myPending && myEditId == null))
        return closeMyDlg();
    const name = inputById('myName').value.trim() || 'Eigener Spot';
    const tipp = inputById('myTipp').value.trim();
    const tiefeEl = inputById('myTiefe');
    /* Das Feld hat schon min/max/type=number - ohne <form>-Submit greift die native
       Validierung aber nie, ein unplausibler Wert wurde bisher kommentarlos verworfen. */
    if (tiefeEl.value && !tiefeEl.checkValidity()) {
        tiefeEl.reportValidity();
        return;
    }
    const tiefe = (() => { const t = parseFloat(tiefeEl.value); return (!isNaN(t) && t > 0 && t <= 80) ? t : null; })();
    const list = await loadMySpots(state.REGION.id);
    let m, editId = myEditId, altName = null;
    if (editId != null) {
        m = list.find(x => x.id === editId);
        if (!m)
            return closeMyDlg();
        altName = m.name;
        m.name = name;
        m.tipp = tipp;
        m.tiefe = tiefe;
    }
    else {
        m = { id: uid(), name, tipp, tiefe, lat: myPending[0], lng: myPending[1] };
        list.push(m);
    }
    try {
        await store.set('myspots:' + state.REGION.id, JSON.stringify(list));
    }
    catch {
        state.persistent = false;
    }
    if (editId != null) {
        const i = state.SPOTS.findIndex(sp => sp.myId === editId);
        if (i > -1) {
            const old = state.SPOTS[i];
            if (old.marker && state.map.hasLayer(old.marker))
                state.map.removeLayer(old.marker);
            state.SPOTS.splice(i, 1);
        }
    }
    state.SPOTS.push(mySpotObj(m));
    /* Die Trip-Liste merkt sich Spots nur ueber den Namen (kein stabiler Fremdschluessel) -
       ohne diesen Abgleich waere ein umbenannter, vorgemerkter eigener Spot in der Trip-
       Liste/im Tagesplan verwaist: der Name in state.trip zeigt dann auf nichts mehr. */
    if (altName != null && altName !== name) {
        let geaendert = false;
        state.trip.forEach(t => { if (t.region === state.REGION.id && t.name === altName) {
            t.name = name;
            geaendert = true;
        } });
        if (geaendert) {
            await tripSave();
            updateTripBadge();
        }
    }
    buildMarkers();
    buildChips();
    applyFilters();
    closeMyDlg();
}
window.delMySpot = async function (id) {
    if (!state.REGION)
        return;
    const list = await loadMySpots(state.REGION.id);
    const geloescht = list.find(m => m.id === id);
    const rest = list.filter(m => m.id !== id);
    try {
        await store.set('myspots:' + state.REGION.id, JSON.stringify(rest));
    }
    catch {
        state.persistent = false;
    }
    const i = state.SPOTS.findIndex(sp => sp.myId === id);
    if (i > -1) {
        const sp = state.SPOTS[i];
        if (sp.marker && state.map.hasLayer(sp.marker))
            state.map.removeLayer(sp.marker);
        state.SPOTS.splice(i, 1);
    }
    /* Denselben verwaisten Trip-Eintrag vermeiden wie beim Umbenennen - ein geloeschter
       eigener Spot darf nicht als Geisterzeile in der Trip-Liste/im Tagesplan haengen bleiben. */
    if (geloescht) {
        const vorher = state.trip.length;
        state.trip = state.trip.filter(t => !(t.region === state.REGION.id && t.name === geloescht.name));
        if (state.trip.length !== vorher) {
            await tripSave();
            updateTripBadge();
        }
    }
    state.map.closePopup();
    buildChips();
    applyFilters();
};
byId('mySave').onclick = saveMySpot;
byId('myCancel').onclick = closeMyDlg;
myDlg.addEventListener('click', e => { if (e.target === myDlg)
    closeMyDlg(); });
/* Kein <form> im Markup - Enter in einem der drei Felder tat bisher nichts. */
['myName', 'myTiefe', 'myTipp'].forEach(id => {
    const el = inputById(id);
    if (el)
        el.addEventListener('keydown', e => { if (e.key === 'Enter') {
            e.preventDefault();
            saveMySpot();
        } });
});
state.map.on('contextmenu', e => { if (!state.REGION)
    return; myPending = [e.latlng.lat, e.latlng.lng]; openMyDlg(); });
/* iOS/Touch: contextmenu feuert bei Long-Press nicht zuverlässig -> eigener Halte-Timer */
export let lpTimer = null, lpStart = null, lpMoved = false;
state.map.on('touchstart mousedown', () => { }); /* Leaflet leitet an eigene Events weiter, wir nutzen den Container */
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
