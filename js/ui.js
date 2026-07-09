/* Header (Sonne/Banner) & Tabs */
import { byId, qsa } from './dom.js';
import { state } from './state.js';
import { hhmm, inWindow, mondPhase, sunTimes } from './astro.js';
import { ICON, esc } from './util.js';
export function regionCenter() {
    const pts = (state.SPOTS || []).filter(sp => !sp.my);
    if (state.userPos)
        return { lat: state.userPos[0], lng: state.userPos[1] };
    if (pts.length)
        return { lat: pts.reduce((a, s) => a + s.lat, 0) / pts.length, lng: pts.reduce((a, s) => a + s.lng, 0) / pts.length };
    return { lat: 50.80, lng: 13.33 };
}
export function sunLine() {
    const c = regionCenter();
    const st = sunTimes(c.lat, c.lng, new Date());
    if (!st) {
        byId('sunline').innerHTML = ICON('moon') + ' ' + esc(mondPhase(new Date()));
        return;
    }
    let txt = ICON('sun') + ' ' + hhmm(st.rise) + ' – ' + hhmm(st.set) + ' Uhr · ' + esc(mondPhase(new Date()));
    if (st.dawn && st.dusk)
        txt += ' · ' + ICON('waves') + ' blaue Stunde ' + hhmm(st.dusk) + '–' + hhmm(new Date(st.dusk.getTime() + 40 * 60e3));
    /* Nachtangel-Fenster nur wo Regel dokumentiert ist */
    if (state.REGION && state.REGION.nachtangeln === 'lvsa') {
        const a = new Date(st.set.getTime() + 3600e3), b = new Date(st.rise.getTime() - 3600e3);
        txt += ' · ' + ICON('moon') + ' Nachtangeln erlaubt ' + hhmm(a) + '–' + hhmm(b);
    }
    else if (state.REGION && state.REGION.nachtangeln === 'frei') {
        txt += ' · ' + ICON('moon') + ' Nachtangeln erlaubt';
    }
    else if (state.REGION && state.REGION.nachtangeln === 'verboten') {
        txt += ' · ' + ICON('x') + ' kein Nachtangeln (TWT/Salmo)';
    }
    byId('sunline').innerHTML = txt;
}
export const banner = byId('banner');
export function buildBanner() {
    banner.classList.remove('show');
    banner.innerHTML = '';
    const hit = (state.REGION.banner || []).find(x => inWindow(x.von, x.bis));
    if (hit) {
        banner.innerHTML = hit.text;
        banner.classList.add('show');
    }
}
/* ============ Tabs ============ */
qsa('.tab').forEach(t => {
    t.onclick = () => {
        qsa('.tab').forEach(x => x.setAttribute('aria-selected', 'false'));
        qsa('.view').forEach(x => x.classList.remove('active'));
        t.setAttribute('aria-selected', 'true');
        document.getElementById('view-' + t.dataset.view).classList.add('active');
        if (t.dataset.view === 'karte')
            setTimeout(() => state.map.invalidateSize(), 50);
    };
});
