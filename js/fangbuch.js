import { byId, inputById, qs, qsa, selectById } from './dom.js';
import { state, store } from './state.js';
import { fmtMD, hhmm, inSchonzeit, masseAus, mondPhase, solunar } from './astro.js';
import { uid } from './myspots.js';
import { initRegions } from './region.js';
import { ICON, esc } from './util.js';
import { regionCenter } from './ui.js';
import { loadWeather } from './weather.js';
export const fbSpotSel = selectById('fbSpot');
export function buildFbOptions() {
    /* Fischauswahl an Region anpassen: Schonzeit-Arten + generische Zusätze */
    const fischSel = selectById('fbFisch');
    if (fischSel) {
        const prev = fischSel.value;
        const arten = [...new Set(state.SCHON.map(x => x.fisch))];
        ['Regenbogenforelle', 'Döbel', 'Rotauge', 'Brachse', 'Sonstige'].forEach(a => { if (!arten.includes(a))
            arten.push(a); });
        fischSel.innerHTML = arten.map(a => '<option>' + a + '</option>').join('');
        if (arten.includes(prev))
            fischSel.value = prev;
    }
    fbSpotSel.innerHTML = '';
    state.SPOTS.filter(s => s.cat !== 'sperr' && s.cat !== 'info').forEach(s => {
        const o = document.createElement('option');
        o.textContent = s.name;
        fbSpotSel.appendChild(o);
    });
    const oAnd = document.createElement('option');
    oAnd.textContent = 'Anderes Gewässer';
    fbSpotSel.appendChild(oAnd);
}
export async function fbLoad() {
    try {
        const r = await store.get('fangbuch');
        const parsed = r && r.value ? JSON.parse(r.value) : [];
        state.fbMem = Array.isArray(parsed) ? parsed.filter(e => e && typeof e === 'object' && e.fisch) : [];
    }
    catch (e) {
        state.fbMem = [];
    }
    fbRender();
}
export async function fbPersist() {
    try {
        await store.set('fangbuch', JSON.stringify(state.fbMem));
    }
    catch (e) {
        state.persistent = false;
    }
    fbRender();
}
export function fbCsv() {
    if (!state.fbMem.length)
        return;
    const head = ['Datum', 'Fisch', 'Laenge_cm', 'Spot', 'Koeder', 'Entnommen', 'Zeit', 'Mond', 'Druck_hPa', 'Drucktrend', 'Wind', 'Pegel_cm', 'Wassertemp_C'];
    const rows = fbSortiert().map(e => [e.datum, e.fisch, e.laenge || '', e.spot || '', e.koeder || '', e.entnommen ? 'ja' : 'nein',
        e.ctx ? e.ctx.zeit : '', e.ctx ? e.ctx.mond : '', e.ctx ? (e.ctx.druck || '') : '', e.ctx ? (e.ctx.trend || '') : '',
        e.ctx ? (e.ctx.wind || '') : '', e.ctx ? (e.ctx.pegel || '') : '', e.ctx && e.ctx.wt != null ? e.ctx.wt : ''
    ].map(v => { v = String(v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'));
    const csv = '\ufeff' + head.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fangbuch.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function topCount(arr) {
    const m = {};
    arr.forEach(k => { if (k)
        m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
export function bars(entries, total) {
    return entries.slice(0, 4).map(([k, n]) => '<div class="bar"><span>' + esc(k) + '</span><span class="barfill" style="width:' + Math.round(n / total * 90) + 'px"></span><span>' + n + '</span></div>').join('');
}
/* Datum robust parsen: unterstützt "9.7.2026" (de-DE, so gespeichert) und "2026-07-09" (ISO, aus Alt-Backups) */
/* War zum Fangzeitpunkt ein Solunar-Beißfenster aktiv? -> 'major' | 'minor' | null */
export function beissfensterJetzt(zeitpunkt) {
    try {
        const c = regionCenter();
        const wins = solunar(c.lat, c.lng, zeitpunkt) || [];
        const t = zeitpunkt.getTime();
        const hit = wins.find(w => t >= w.from && t <= w.to);
        return hit ? hit.type : null;
    }
    catch (e) {
        return null;
    }
}
export function parseFangDatum(d) {
    if (!d)
        return null;
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    if (m)
        return new Date(+m[1], +m[2] - 1, +m[3]);
    m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(d);
    if (m)
        return new Date(+m[3], +m[2] - 1, +m[1]);
    const t = Date.parse(d);
    return isNaN(t) ? null : new Date(t);
}
export function fbInsights() {
    const el = byId('fbInsights');
    if (state.fbMem.length < 8) {
        el.innerHTML = '<p class="fineprint" style="margin-top:10px">Muster-Auswertung erscheint ab 8 Fängen (aktuell ' + state.fbMem.length + '). Je mehr Fänge, desto aussagekräftiger.</p>';
        return;
    }
    let h = '<div class="insight"><h4>Deine Muster (' + state.fbMem.length + ' Fänge)</h4>';
    const koeder = topCount(state.fbMem.map(e => e.koeder));
    if (koeder.length) {
        h += '<b>Fängigste Köder</b>' + bars(koeder, state.fbMem.length);
    }
    const zeiten = topCount(state.fbMem.map(e => { if (!e.ctx || !e.ctx.zeit)
        return null; const hh = +e.ctx.zeit.slice(0, 2); return hh < 6 ? 'Nacht (0–6)' : hh < 10 ? 'früh (6–10)' : hh < 16 ? 'Tag (10–16)' : hh < 21 ? 'Abend (16–21)' : 'Nacht (21–24)'; }).filter(Boolean));
    if (zeiten.length) {
        h += '<b style="display:block;margin-top:8px">Beste Tageszeiten</b>' + bars(zeiten, state.fbMem.filter(e => e.ctx && e.ctx.zeit).length);
    }
    const trends = state.fbMem.filter(e => e.ctx && typeof e.ctx.trend === 'number');
    if (trends.length >= 5) {
        const fallend = trends.filter(e => e.ctx.trend <= -1.5).length;
        const pct = Math.round(fallend / trends.length * 100);
        h += '<b style="display:block;margin-top:8px">Luftdruck</b><div style="margin-top:3px">' + pct + '% deiner Fänge bei fallendem Druck' + (pct >= 50 ? ' – dein Beißtrigger bestätigt sich!' : '.') + '</div>';
    }
    const spots = topCount(state.fbMem.map(e => e.spot));
    if (spots.length) {
        h += '<b style="display:block;margin-top:8px">Top-Spots</b>' + bars(spots, state.fbMem.length);
    }
    const mitFenster = state.fbMem.filter(e => e.ctx && e.ctx.fenster !== undefined && e.ctx.fenster !== null);
    if (mitFenster.length >= 5) {
        const major = mitFenster.filter(e => e.ctx.fenster === 'major').length;
        const pct = Math.round(major / mitFenster.length * 100);
        h += '<b style="display:block;margin-top:8px">Beißfenster (Solunar)</b><div style="margin-top:3px">'
            + mitFenster.length + ' Fänge im Beißfenster, davon ' + pct + '% im starken Major-Fenster'
            + (pct >= 50 ? ' – die Solunar-Fenster funktionieren bei dir!' : '.') + '</div>';
    }
    const arten = topCount(state.fbMem.map(e => e.fisch));
    if (arten.length > 1) {
        h += '<b style="display:block;margin-top:8px">Artenverteilung</b>' + bars(arten, state.fbMem.length);
    }
    const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const monate = topCount(state.fbMem.map(e => { const d = parseFangDatum(e.datum); return d ? MON[d.getMonth()] : null; }).filter(Boolean));
    if (monate.length > 1) {
        h += '<b style="display:block;margin-top:8px">Fängigste Monate</b>' + bars(monate, state.fbMem.length);
    }
    h += '</div>';
    /* Persönliche Bestenliste: größter Fisch je Art */
    const rekorde = {};
    state.fbMem.forEach(e => {
        const l = parseInt(String(e.laenge), 10);
        if (!isNaN(l) && l > 0 && (!rekorde[e.fisch] || l > rekorde[e.fisch].laenge))
            rekorde[e.fisch] = { laenge: l, datum: e.datum, spot: e.spot };
    });
    const rk = Object.entries(rekorde).sort((a, b) => b[1].laenge - a[1].laenge);
    if (rk.length) {
        h += '<div class="insight"><h4>' + ICON('trophy') + ' Deine Bestenliste</h4>';
        rk.forEach(([fisch, r], i) => {
            const medal = ['🥇', '🥈', '🥉'][i] || '▪';
            h += '<div class="bar" style="margin:5px 0"><span style="min-width:24px">' + medal + '</span>'
                + '<b style="min-width:96px">' + esc(fisch) + '</b>'
                + '<span>' + r.laenge + ' cm' + (r.spot ? ' · ' + esc(r.spot) : '') + '</span></div>';
        });
        h += '</div>';
    }
    el.innerHTML = h;
}
/* ===== Backup: vollständiger Export/Import als JSON (reimportierbar, anders als CSV) ===== */
export function fbBackup() {
    const payload = { format: 'angelkarte-fangbuch', version: 1, exportiert: new Date().toISOString(), anzahl: state.fbMem.length, faenge: state.fbMem };
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fangbuch-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
/* Eindeutiger Schlüssel eines Fangs – für Duplikaterkennung beim Merge */
function fangKey(e) { return [e.datum, e.fisch, e.laenge || '', e.spot || '', e.koeder || ''].join('|'); }
export async function fbRestore(file) {
    const st = byId('fbStatus');
    const zeig = m => { if (st)
        st.textContent = m; };
    let data;
    try {
        data = JSON.parse(await file.text());
    }
    catch (e) {
        zeig('❌ Datei ist kein gültiges JSON.');
        return { error: 'parse' };
    }
    const liste = Array.isArray(data) ? data : (data && Array.isArray(data.faenge) ? data.faenge : null);
    if (!liste) {
        zeig('❌ Kein Fangbuch-Backup erkannt (Feld "faenge" fehlt).');
        return { error: 'format' };
    }
    const gueltig = liste.filter(e => e && typeof e === 'object' && e.fisch && e.datum);
    if (!gueltig.length) {
        zeig('❌ Keine gültigen Fänge in der Datei.');
        return { error: 'leer' };
    }
    /* MERGE statt Überschreiben: vorhandene Fänge bleiben, Duplikate werden übersprungen */
    const vorhanden = new Set(state.fbMem.map(fangKey));
    let neu = 0;
    gueltig.forEach(e => { if (!vorhanden.has(fangKey(e))) {
        state.fbMem.push(e);
        vorhanden.add(fangKey(e));
        neu++;
    } });
    state.fbMem.sort((a, b) => { const da = parseFangDatum(a.datum), db = parseFangDatum(b.datum); return (db ? db.getTime() : 0) - (da ? da.getTime() : 0); });
    await fbPersist();
    zeig('✓ ' + neu + ' neue Fänge importiert' + (gueltig.length - neu > 0 ? ' (' + (gueltig.length - neu) + ' Duplikate übersprungen)' : '') + '.');
    return { neu, duplikate: gueltig.length - neu };
}
export function fbTools() {
    const t = byId('fbTools');
    if (!t)
        return;
    t.innerHTML = '';
    if (state.fbMem.length) {
        const b = document.createElement('button');
        b.className = 'fbtool';
        b.textContent = '⬇ CSV-Export';
        b.onclick = fbCsv;
        t.appendChild(b);
        const bk = document.createElement('button');
        bk.className = 'fbtool';
        bk.textContent = '💾 Backup (JSON)';
        bk.title = 'Vollständige Sicherung – kann wieder importiert werden';
        bk.onclick = fbBackup;
        t.appendChild(bk);
    }
    /* Import immer anbieten (auch bei leerem Fangbuch – z.B. nach Gerätewechsel) */
    const imp = document.createElement('button');
    imp.className = 'fbtool';
    imp.textContent = '📂 Backup einlesen';
    imp.onclick = () => inputById('fbFile').click();
    t.appendChild(imp);
}
/** Fänge für die Anzeige sortieren: neuester zuerst.
    Vorher wurde nur `reverse()` benutzt, also die Einfügereihenfolge umgedreht –
    nach einem Backup-Import (der nach Datum sortiert) stand die Liste dann auf dem Kopf. */
export function fbSortiert() {
    return [...state.fbMem].sort((a, b) => {
        const da = parseFangDatum(a.datum), db = parseFangDatum(b.datum);
        const t = (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
        if (t !== 0)
            return t;
        return (b.id || 0) - (a.id || 0); /* gleicher Tag: zuletzt eingetragen zuerst */
    });
}
export function fbRender() {
    const list = byId('fbList');
    byId('fbStatus').textContent =
        state.persistent ? 'Wird dauerhaft gespeichert' : 'Hinweis: Speicherung nur für diese Sitzung';
    fbTools();
    fbInsights();
    if (!state.fbMem.length) {
        list.innerHTML = '<div class="fb-empty">Noch keine Fänge eingetragen.<br>Petri Heil – der erste kommt bestimmt! 🐟</div>';
        return;
    }
    list.innerHTML = '';
    fbSortiert().forEach(e => {
        const d = document.createElement('div');
        d.className = 'fb-entry';
        const cx = e.ctx ? [e.ctx.zeit, e.ctx.mond, e.ctx.fenster ? (e.ctx.fenster === 'major' ? '★ Major' : '☆ Minor') : null, e.ctx.druck ? e.ctx.druck + ' hPa' + (e.ctx.trend <= -1.5 ? '⇘' : e.ctx.trend >= 1.5 ? '⇗' : '') : null, e.ctx.wind, e.ctx.temp != null ? e.ctx.temp + '°C' : null, e.ctx.pegel ? 'Pegel ' + e.ctx.pegel : null, e.ctx.wt != null ? 'W ' + e.ctx.wt + '°C' : null].filter(Boolean).join(' · ') : '';
        d.innerHTML = `<div class="info"><div class="fish">${esc(e.fisch)} ${e.laenge ? '· ' + esc(e.laenge) + ' cm' : ''} ${e.entnommen ? '<span title="entnommen">🪣</span>' : '<span title="zurückgesetzt">↩</span>'}</div>
      <div class="sub">${esc(e.spot)} · ${esc(e.datum)}${e.koeder ? ' · ' + esc(e.koeder) : ''}${cx ? '<br>' + esc(cx) : ''}</div></div>
      <button class="fb-edit" aria-label="Eintrag bearbeiten" data-id="${esc(e.id)}" style="background:none;border:0;color:var(--muted);cursor:pointer;padding:4px">${ICON('edit')}</button>
      <button class="fb-del" aria-label="Eintrag löschen" data-id="${esc(e.id)}">${ICON('x')}</button>`;
        /* WICHTIG: dataset VOR dem await auslesen. Nach einem await ist die Event-Dispatch-Phase
           beendet und `ev.currentTarget` ist null – Löschen und Bearbeiten warfen dadurch. */
        qs('.fb-del', d).onclick = async (ev) => {
            const id = Number(ev.currentTarget.dataset.id);
            await fbReady;
            state.fbMem = state.fbMem.filter(x => x.id !== id);
            await fbPersist();
        };
        qs('.fb-edit', d).onclick = async (ev) => {
            const id = Number(ev.currentTarget.dataset.id);
            await fbReady;
            const entry = state.fbMem.find(x => x.id === id);
            if (!entry)
                return;
            /* Werte ins Formular laden */
            selectById('fbFisch').value = entry.fisch;
            inputById('fbLaenge').value = String(entry.laenge || '');
            inputById('fbKoeder').value = entry.koeder || '';
            inputById('fbEntnommen').checked = !!entry.entnommen;
            const spSel = selectById('fbSpot');
            if ([...spSel.options].some(o => o.textContent === entry.spot))
                spSel.value = entry.spot;
            /* alten Eintrag entfernen – Speichern legt ihn aktualisiert neu an */
            state.fbMem = state.fbMem.filter(x => x.id !== entry.id);
            await fbPersist();
            checkFang();
            qs('[data-view="fangbuch"]').click();
            const lf = inputById('fbLaenge');
            if (lf.scrollIntoView)
                lf.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const st = byId('fbStatus');
            if (st) {
                st.textContent = '✎ Eintrag geladen – anpassen und erneut speichern';
            }
        };
        list.appendChild(d);
    });
}
export function checkFang() {
    const el = byId('fbCheck');
    if (!state.REGION) {
        el.innerHTML = '';
        return;
    }
    const fisch = selectById('fbFisch').value;
    let len = parseInt(inputById('fbLaenge').value, 10);
    if (!isNaN(len) && (len < 0 || len > 250))
        len = NaN; /* unplausibel ignorieren */
    const sc = state.SCHON.find(x => x.fisch === fisch);
    let msgs = [], bad = false;
    if (!sc) {
        msgs.push('ℹ Für „' + fisch + '“ liegen in dieser Region keine Schonzeit-/Maßdaten vor – bitte Erlaubnisschein prüfen. KEINE Freigabe!');
    }
    if (sc) {
        if (inSchonzeit(sc)) {
            bad = true;
            msgs.push('⛔ ' + fisch + ' ist aktuell geschont (' + fmtMD(sc.von) + '–' + fmtMD(sc.bis) + ') – zurücksetzen!');
        }
        const m = masseAus(sc.mm);
        if (!isNaN(len)) {
            if (m.min && len < m.min) {
                bad = true;
                msgs.push('⛔ Untermaßig: ' + len + ' cm < ' + m.min + ' cm – zurücksetzen!');
            }
            else if (m.max && len > m.max) {
                bad = true;
                msgs.push('⛔ Über dem Entnahmefenster: ' + len + ' cm > ' + m.max + ' cm – zurücksetzen!');
            }
            else if (m.min) {
                msgs.push('✓ Maß in Ordnung (' + (m.max ? m.min + '–' + m.max : 'ab ' + m.min) + ' cm).');
            }
        }
    }
    const heute = new Date().toLocaleDateString('de-DE');
    if (state.REGION.id === 'mecklenburg' && ['Hecht', 'Zander', 'Aal', 'Karpfen'].includes(fisch)) {
        const n = state.fbMem.filter(e => e.datum === heute && e.entnommen && ['Hecht', 'Zander', 'Aal', 'Karpfen'].includes(e.fisch)).length;
        if (n >= 3) {
            bad = true;
            msgs.push('⛔ Tageslimit erreicht: ' + n + '/3 entnommene Raubfische (Hecht/Zander/Aal/Karpfen).');
        }
        else
            msgs.push('Entnahme-Zähler heute: ' + n + '/3 (Hecht/Zander/Aal/Karpfen).');
    }
    if (state.REGION.id === 'erzgebirge' && fisch === 'Barsch') {
        const n = state.fbMem.filter(e => e.datum === heute && e.entnommen && e.fisch === 'Barsch').length;
        if (n >= 10) {
            bad = true;
            msgs.push('⛔ Barsch-Tageslimit erreicht (' + n + '/10 entnommen).');
        }
        else
            msgs.push('Barsch-Entnahme heute: ' + n + '/10.');
    }
    el.innerHTML = msgs.length ? '<div class="fbcheck ' + (bad ? 'bad' : 'ok') + '">' + msgs.map(esc).join('<br>') + '</div>' : '';
}
selectById('fbFisch').onchange = checkFang;
inputById('fbLaenge').oninput = checkFang;
byId('fbSave').onclick = async () => {
    if (state.fbSaving)
        return;
    state.fbSaving = true;
    try {
        await fbReady; /* verhindert, dass fbLoad einen frischen Eintrag überschreibt */
        const fisch = selectById('fbFisch').value;
        let laenge = parseInt(inputById('fbLaenge').value, 10);
        const laengeOut = (isNaN(laenge) || laenge < 0 || laenge > 250) ? '' : laenge;
        const jetzt = new Date();
        state.fbMem.push({
            id: uid(), fisch, laenge: laengeOut,
            spot: fbSpotSel.value,
            koeder: inputById('fbKoeder').value.trim(),
            datum: jetzt.toLocaleDateString('de-DE'),
            entnommen: inputById('fbEntnommen').checked,
            ctx: {
                zeit: hhmm(jetzt), mond: mondPhase(jetzt),
                druck: state.WX ? Math.round(state.WX.press) : null, trend: state.WX ? Math.round(state.WX.trendVal * 10) / 10 : null,
                wind: state.WX ? Math.round(state.WX.wind) + ' ' + state.WX.dir : null,
                pegel: state.PEGEL ? state.PEGEL.value : null, wt: state.PEGEL && state.PEGEL.wt != null ? Math.round(state.PEGEL.wt) : null,
                temp: state.WX && state.WX.temp != null ? Math.round(state.WX.temp) : null,
                fenster: beissfensterJetzt(jetzt), region: state.REGION ? state.REGION.id : null
            }
        });
        inputById('fbLaenge').value = '';
        inputById('fbKoeder').value = '';
        inputById('fbEntnommen').checked = false;
        await fbPersist();
        checkFang();
    }
    finally {
        state.fbSaving = false;
    }
};
export function prefillFang(spotName) {
    qsa('.tab').forEach(x => x.setAttribute('aria-selected', 'false'));
    qsa('.view').forEach(x => x.classList.remove('active'));
    qs('[data-view="fangbuch"]').setAttribute('aria-selected', 'true');
    byId('view-fangbuch').classList.add('active');
    [...fbSpotSel.options].forEach(o => { if (o.textContent === spotName)
        fbSpotSel.value = spotName; });
}
window.prefillFang = prefillFang;
/* data-ic Platzhalter mit SVG-Icons füllen */
qsa('[data-ic]').forEach(el => {
    el.insertAdjacentHTML('afterbegin', ICON(el.dataset.ic) + ' ');
});
export const fbReady = fbLoad();
initRegions();
/* Wetter/Pegel frisch halten: bei Rückkehr in den Tab + alle 20 min */
document.addEventListener('visibilitychange', () => { if (!document.hidden) {
    state.wxKey = '';
    loadWeather();
} });
setInterval(() => { if (!document.hidden) {
    state.wxKey = '';
    loadWeather();
} }, 20 * 60 * 1000);
/* Offline-Modus: Service Worker (nur auf eigener HTTPS-Domain, im Artifact still ignoriert) */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            nw && nw.addEventListener('statechange', () => {
                if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                    const u = byId('swUpdate');
                    u.innerHTML = '🔄 Neue Version verfügbar – <button id="swReload" style="background:none;border:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;padding:0">jetzt aktualisieren</button>';
                    u.classList.add('show');
                    byId('swReload').onclick = () => location.reload();
                }
            });
        });
    }).catch(() => { });
}
/* Datei-Input für Backup-Import verdrahten */
const fbFileEl = inputById('fbFile');
if (fbFileEl) {
    fbFileEl.onchange = async (e) => {
        const target = e.target;
        const f = target.files && target.files[0];
        if (f)
            await fbRestore(f);
        target.value = ''; /* gleiche Datei erneut wählbar */
    };
}
