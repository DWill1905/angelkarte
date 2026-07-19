import { byId, inputById, qs, qsa, selectById } from './dom.js';
import { state, store } from './state.js';
import { fmtMD, hhmm, inSchonzeit, masseAus, mondPhase, solunar } from './astro.js';
import { uid } from './myspots.js';
import { initRegions } from './region.js';
import { ICON, esc } from './util.js';
import { regionCenter } from './ui.js';
import { WT_OPT } from './tackle.js';
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
    /* `||` würde den Wert 0 verschlucken: ein Drucktrend von 0.0 (stabile Lage) oder ein
       Pegel von 0 cm sind echte Messwerte, keine fehlenden. Deshalb überall auf null/undefined prüfen. */
    const val = (x) => (x === null || x === undefined || x === '' ? '' : x);
    const rows = fbSortiert().map(e => [e.datum, e.fisch, val(e.laenge), val(e.spot), val(e.koeder), e.entnommen ? 'ja' : 'nein',
        e.ctx ? val(e.ctx.zeit) : '', e.ctx ? val(e.ctx.mond) : '', e.ctx ? val(e.ctx.druck) : '', e.ctx ? val(e.ctx.trend) : '',
        e.ctx ? val(e.ctx.wind) : '', e.ctx ? val(e.ctx.pegel) : '', e.ctx ? val(e.ctx.wt) : ''
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
/* ---- Modell-Abgleich: hält das Fangbuch, was das Modell behauptet? ----
   Bewusst NUR ein Abgleich, kein Nachjustieren der Gewichte. Und mit einer
   Einschränkung, die man nicht wegdiskutieren kann: Das Fangbuch kennt nur
   Fänge, nicht die Stunden ohne Biss. Ohne diese Vergleichsbasis lässt sich
   nicht beweisen, dass ein Faktor die Ursache war – nur, ob die Annahme des
   Modells zu deinen Fängen passt. Das steht auch so in der Ausgabe. */
function urteil(passt, jaTxt, neinTxt, wenig) {
    if (passt === null)
        return '<span style="color:var(--muted)">' + wenig + '</span>';
    return passt
        ? '<span style="color:var(--forelle)">✓ ' + jaTxt + '</span>'
        : '<span style="color:var(--warn)">✗ ' + neinTxt + '</span>';
}
export function fbModellCheck() {
    const MIN = 12;
    if (state.fbMem.length < MIN) {
        return '<p class="fineprint" style="margin-top:10px">Modell-Abgleich erscheint ab ' + MIN + ' Fängen (aktuell ' + state.fbMem.length + ').</p>';
    }
    const zeilen = [];
    /* 1) Luftdruck: das Modell wertet fallenden Druck (≤ -1,5 hPa/3h) als Beißtrigger. */
    const mitDruck = state.fbMem.filter(e => e.ctx && typeof e.ctx.trend === 'number');
    if (mitDruck.length >= 8) {
        const fallend = mitDruck.filter(e => e.ctx.trend <= -1.5).length;
        const pct = Math.round(fallend / mitDruck.length * 100);
        /* Fallender Druck herrscht grob an einem Viertel der Zeit – deutlich mehr Fänge
           sprechen für die Annahme, deutlich weniger dagegen. */
        const passt = pct >= 35 ? true : pct <= 12 ? false : null;
        zeilen.push('<div style="margin-top:8px"><b>Fallender Luftdruck = Beißtrigger</b>'
            + '<div>Modell: hoch gewichtet · Dein Fangbuch: ' + pct + '\u202F% von ' + mitDruck.length + ' Fängen</div>'
            + '<div>' + urteil(passt, 'passt zusammen', 'widerspricht – bei dir beißt es eher nicht bei fallendem Druck', 'uneindeutig – liegt im Bereich des Zufalls') + '</div></div>');
    }
    /* 2) Solunar: das Modell gewichtet die Beißfenster mit 2 – dem höchsten Einzelgewicht. */
    const mitF = state.fbMem.filter(e => e.ctx && e.ctx.fenster !== undefined);
    if (mitF.length >= 8) {
        const drin = mitF.filter(e => !!e.ctx.fenster).length;
        const pct = Math.round(drin / mitF.length * 100);
        /* Die Fenster decken grob ein Drittel des Tages ab. */
        const passt = pct >= 45 ? true : pct <= 20 ? false : null;
        zeilen.push('<div style="margin-top:8px"><b>Beißfenster (Solunar)</b>'
            + '<div>Modell: stärkstes Einzelgewicht · Dein Fangbuch: ' + pct + '\u202F% von ' + mitF.length + ' Fängen im Fenster</div>'
            + '<div>' + urteil(passt, 'passt zusammen', 'widerspricht – deine Fänge kommen überwiegend außerhalb', 'uneindeutig – die Fenster decken ohnehin ~⅓ des Tages ab') + '</div></div>');
    }
    /* 3) Wassertemperatur-Optimum je Art (WT_OPT) – nur Arten mit genug Fängen. */
    const proArt = {};
    state.fbMem.forEach(e => {
        const opt = WT_OPT[e.fisch];
        const wt = e.ctx && typeof e.ctx.wt === 'number' ? e.ctx.wt : null;
        if (!opt || wt == null)
            return;
        const a = proArt[e.fisch] || (proArt[e.fisch] = { drin: 0, n: 0 });
        a.n++;
        if (wt >= opt[0] && wt <= opt[1])
            a.drin++;
    });
    const arten = Object.keys(proArt).filter(a => proArt[a].n >= 4);
    if (arten.length) {
        const teile = arten.map(a => {
            const { drin, n } = proArt[a];
            const pct = Math.round(drin / n * 100);
            return esc(a) + ': ' + pct + '\u202F% von ' + n + ' Fängen im Modell-Optimum (' + WT_OPT[a][0] + '–' + WT_OPT[a][1] + '\u202F°C)';
        });
        const gesamt = arten.reduce((s, a) => s + proArt[a].drin, 0) / arten.reduce((s, a) => s + proArt[a].n, 0);
        const passt = gesamt >= 0.6 ? true : gesamt <= 0.3 ? false : null;
        zeilen.push('<div style="margin-top:8px"><b>Wassertemperatur-Optimum</b><div>' + teile.join('<br>') + '</div>'
            + '<div>' + urteil(passt, 'passt zusammen', 'widerspricht – deine Fänge liegen meist außerhalb des angenommenen Optimums', 'uneindeutig') + '</div></div>');
    }
    if (!zeilen.length) {
        return '<p class="fineprint" style="margin-top:10px">Für den Modell-Abgleich fehlen die Begleitdaten (Druck, Fenster, Wassertemperatur) – die werden erst seit neueren Fängen mitgeschrieben.</p>';
    }
    return '<div class="insight" style="margin-top:10px"><h4>Modell-Abgleich</h4>'
        + '<p class="fineprint" style="margin:0 0 4px">Hält das Modell, was es behauptet – gemessen an DEINEN Fängen?</p>'
        + zeilen.join('')
        + '<p class="fineprint" style="margin-top:10px">⚠ Wichtig: Das Fangbuch kennt nur deine <b>Fänge</b>, nicht die Stunden <b>ohne Biss</b>. '
        + 'Ohne diese Vergleichsbasis lässt sich nicht belegen, dass ein Faktor die Ursache war – der Abgleich zeigt nur, '
        + 'ob die Annahme des Modells zu deinen Fängen passt. Die Gewichte werden bewusst <b>nicht</b> automatisch nachgestellt: '
        + 'bei dieser Datenmenge wäre das Überanpassung an Zufall.</p></div>';
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
    el.innerHTML = h + fbModellCheck();
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
/** Baut den teilbaren Text zu einem Fang – nur Fakten, die tatsächlich geloggt wurden,
    nichts wird ergänzt oder geschönt. */
export function fangTeilenText(e) {
    let kopf = '🎣 ' + e.fisch + (e.laenge ? ', ' + e.laenge + ' cm' : '');
    const zeilen = [kopf];
    const orts = [e.spot, e.datum].filter(Boolean);
    if (orts.length)
        zeilen.push(orts.join(' · '));
    const kontext = [];
    if (e.ctx) {
        if (e.ctx.wt != null)
            kontext.push('Wasser ' + e.ctx.wt + '°C');
        if (typeof e.ctx.trend === 'number' && e.ctx.trend <= -1.5)
            kontext.push('fallender Luftdruck');
        if (e.ctx.fenster)
            kontext.push(e.ctx.fenster === 'major' ? 'Major-Fenster' : 'Minor-Fenster');
    }
    if (e.koeder)
        kontext.push(e.koeder);
    if (kontext.length)
        zeilen.push(kontext.join(' · '));
    zeilen.push('📍 geloggt mit der Angelkarte-App');
    return zeilen.join('\n');
}
/** Teilt einen Fang über die native Share-Sheet, sonst Zwischenablage. Der Aufrufer blendet
    den Button aus, wenn keins von beidem verfügbar ist – kein totes UI-Element. */
async function teileFang(id) {
    const entry = state.fbMem.find(x => x.id === id);
    if (!entry)
        return;
    const text = fangTeilenText(entry);
    const nav = navigator;
    const st = byId('fbStatus');
    if (typeof nav.share === 'function') {
        try {
            await nav.share({ text });
        }
        catch (e) { /* Nutzer hat abgebrochen – kein Fehler */ }
    }
    else if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        try {
            await nav.clipboard.writeText(text);
            if (st)
                st.textContent = '📋 In die Zwischenablage kopiert';
        }
        catch (e) {
            if (st)
                st.textContent = '❌ Konnte nicht in die Zwischenablage kopieren';
        }
    }
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
        const teilenVerfuegbar = typeof navigator.share === 'function' || !!(navigator.clipboard && navigator.clipboard.writeText);
        d.innerHTML = `<div class="info"><div class="fish">${esc(e.fisch)} ${e.laenge ? '· ' + esc(e.laenge) + ' cm' : ''} ${e.entnommen ? '<span title="entnommen">🪣</span>' : '<span title="zurückgesetzt">↩</span>'}</div>
      <div class="sub">${esc(e.spot)} · ${esc(e.datum)}${e.koeder ? ' · ' + esc(e.koeder) : ''}${cx ? '<br>' + esc(cx) : ''}</div></div>
      ${teilenVerfuegbar ? `<button class="fb-share" aria-label="Fang teilen" data-id="${esc(e.id)}" style="background:none;border:0;color:var(--muted);cursor:pointer;padding:4px">${ICON('share')}</button>` : ''}
      <button class="fb-edit" aria-label="Eintrag bearbeiten" data-id="${esc(e.id)}" style="background:none;border:0;color:var(--muted);cursor:pointer;padding:4px">${ICON('edit')}</button>
      <button class="fb-del" aria-label="Eintrag löschen" data-id="${esc(e.id)}">${ICON('x')}</button>`;
        /* WICHTIG: dataset VOR dem await auslesen. Nach einem await ist die Event-Dispatch-Phase
           beendet und `ev.currentTarget` ist null – Löschen und Bearbeiten warfen dadurch. */
        if (teilenVerfuegbar)
            qs('.fb-share', d).onclick = ev => {
                const id = Number(ev.currentTarget.dataset.id);
                teileFang(id);
            };
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
    if (!isNaN(len) && (len < 0 || len > 300))
        len = NaN; /* unplausibel ignorieren – Wels kann in D legitim >250 cm erreichen */
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
        /* Arten ohne Mindestmaß können hier trotzdem eine echte Pflicht tragen: laut Erlaubnisschein
           (siehe schonQuelle/Regeln-Tab) muss ein gefangener Fisch entnommen werden, weil "ohne Maß"
           nicht "freigestellt" heißt. Die Info stand bisher nur im Regeln-Tab, das Fangbuch selbst
           - wo genau diese Entscheidung (Häkchen "entnommen") getroffen wird - sagte dazu nichts. */
        if (sc.ruecksetzverbot) {
            const entnommen = inputById('fbEntnommen').checked;
            if (!entnommen) {
                bad = true;
                msgs.push('⛔ ' + fisch + ' hat kein Mindestmaß – Rücksetzverbot! Muss entnommen werden (Häkchen setzen).');
            }
            else
                msgs.push('✓ Entnahme korrekt – ' + fisch + ' hat kein Mindestmaß und darf nicht zurückgesetzt werden.');
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
        /* Regel hat zwei Teile (siehe Regeln-Tab): max. 10/Tag gesamt, davon max. 5 über 30 cm.
           Vorher wurde nur die Gesamtzahl geprüft - ein Angler mit z.B. 6 Barschen über 30 cm
           sah "6/10", obwohl die Teilquote schon gerissen war. */
        const heuteBarsch = state.fbMem.filter(e => e.datum === heute && e.entnommen && e.fisch === 'Barsch');
        const n = heuteBarsch.length;
        const ueber30 = heuteBarsch.filter(e => { const l = parseInt(String(e.laenge), 10); return !isNaN(l) && l >= 30; }).length;
        if (n >= 10) {
            bad = true;
            msgs.push('⛔ Barsch-Tageslimit erreicht (' + n + '/10 entnommen).');
        }
        else
            msgs.push('Barsch-Entnahme heute: ' + n + '/10.');
        if (ueber30 >= 5) {
            bad = true;
            msgs.push('⛔ Teilquote über 30 cm erreicht (' + ueber30 + '/5) – weitere nur unter 30 cm entnehmen.');
        }
        else if (ueber30 > 0)
            msgs.push('Davon über 30 cm: ' + ueber30 + '/5.');
    }
    if (state.REGION.id === 'main' && ['Barsch', 'Hecht', 'Zander'].includes(fisch)) {
        /* Erlaubnisschein-Regel (siehe schonQuelle): max. 3 Raubfische/Tag UND max. 10/Woche -
           bisher komplett unenforced, obwohl die Region sie selbst zweimal nennt (Regeln-Tab +
           Spot-Hinweis). Wochenfenster: rollierend die letzten 7 Tage (heute eingeschlossen). */
        const raub = ['Barsch', 'Hecht', 'Zander'];
        const heuteN = state.fbMem.filter(e => e.datum === heute && e.entnommen && raub.includes(e.fisch)).length;
        const vor7Tagen = new Date();
        vor7Tagen.setDate(vor7Tagen.getDate() - 6);
        vor7Tagen.setHours(0, 0, 0, 0);
        const wocheN = state.fbMem.filter(e => {
            if (!e.entnommen || !raub.includes(e.fisch))
                return false;
            const d = parseFangDatum(e.datum);
            return !!d && d >= vor7Tagen;
        }).length;
        if (heuteN >= 3) {
            bad = true;
            msgs.push('⛔ Tageslimit erreicht: ' + heuteN + '/3 entnommene Raubfische (Barsch/Hecht/Zander).');
        }
        else
            msgs.push('Entnahme heute: ' + heuteN + '/3 Raubfische (Barsch/Hecht/Zander).');
        if (wocheN >= 10) {
            bad = true;
            msgs.push('⛔ Wochenlimit erreicht: ' + wocheN + '/10 Raubfische in den letzten 7 Tagen.');
        }
        else if (wocheN > 0)
            msgs.push('Diese Woche: ' + wocheN + '/10.');
    }
    if (state.REGION.id === 'elbe' && ['Hecht', 'Zander', 'Karpfen', 'Quappe'].includes(fisch)) {
        /* Erlaubnisschein-Regel (siehe Regeln-Tab "Erlaubnis & Fangbegrenzung"): max. 3 Fische
           der Arten Hecht/Zander/Karpfen/Quappe pro Tag gesamt - bisher komplett unenforced,
           obwohl die Region sie selbst nennt (dieselbe Luecke wie zuvor bei Main). */
        const gelistet = ['Hecht', 'Zander', 'Karpfen', 'Quappe'];
        const n = state.fbMem.filter(e => e.datum === heute && e.entnommen && gelistet.includes(e.fisch)).length;
        if (n >= 3) {
            bad = true;
            msgs.push('⛔ Tageslimit erreicht: ' + n + '/3 entnommene Fische (Hecht/Zander/Karpfen/Quappe).');
        }
        else
            msgs.push('Entnahme heute: ' + n + '/3 (Hecht/Zander/Karpfen/Quappe).');
    }
    el.innerHTML = msgs.length ? '<div class="fbcheck ' + (bad ? 'bad' : 'ok') + '">' + msgs.map(esc).join('<br>') + '</div>' : '';
}
selectById('fbFisch').onchange = checkFang;
inputById('fbLaenge').oninput = checkFang;
inputById('fbEntnommen').onchange = checkFang;
byId('fbSave').onclick = async () => {
    if (state.fbSaving)
        return;
    state.fbSaving = true;
    try {
        await fbReady; /* verhindert, dass fbLoad einen frischen Eintrag überschreibt */
        const fisch = selectById('fbFisch').value;
        let laenge = parseInt(inputById('fbLaenge').value, 10);
        const laengeOut = (isNaN(laenge) || laenge < 0 || laenge > 300) ? '' : laenge;
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
