/* Werkzeuge-Menü: Köder, Beißzeiten, Packliste, Knoten, Blei, Score */
import { byId } from './dom.js';
import { state, store } from './state.js';
import { WT_OPT, istFliess } from './tackle.js';
import { schilfToggle } from './reed.js';
import { openPlan, tagDatum, tagLabel, MAX_TAG } from './plan.js';
import { menuZu } from './sicht.js';
import { openWetter, wxDlg, wxAt } from './weather.js';
import { fullscreenToggle } from './fullscreen.js';
import { fokusFor } from './saison.js';
import { NOW, fmtDate, fmtMD, haversine, hhmm, inSchonzeit, mondPhase, mondStaerke, solunar, sunTimes } from './astro.js';
import { regionCenter } from './ui.js';
import { openOffline, satToggle } from './map.js';
import { openTrip, inTrip, setTripBtn } from './trip.js';
import { ladeNotiz, speichereNotiz } from './notiz.js';
import { esc, de1 } from './util.js';
export function season() { const m = NOW.getMonth() + 1; return m === 12 || m <= 2 ? 'winter' : m <= 5 ? 'fruehjahr' : m <= 8 ? 'sommer' : 'herbst'; }
export const KB = {
    Hecht: { fruehjahr: 'Nach der Schonzeit in den erwärmten Flachbuchten: mittelgroße Gummis 12–16 cm, flach laufende Wobbler.',
        sommer: 'Morgens/abends groß &amp; flach über Kraut: Jerkbaits, Spinnerbaits, 16–20-cm-Gummis. Mittags an die tiefen Kanten wechseln.',
        herbst: 'XXL-Zeit: 20 cm+ Gummis und Swimbaits, langsam an tiefen Kanten – jetzt beißen die Großen.',
        winter: 'Sehr langsam und tief: großer Gummifisch am schweren Kopf, lange Absinkphasen und Pausen.' },
    Zander: { fruehjahr: 'Direkt nach Ende der Schonzeit (regional verschieden – siehe Schonzeit-Hinweis oben): Kanten 3–6 m, Gummi 10–12 cm, Faulenzen.',
        sommer: 'Tagsüber tief an den Kanten jiggen (Gummi 10–12 cm), nachts flach ans Ufer – flach laufender Wobbler.',
        herbst: 'Fressphase: größere Gummis 12–15 cm, härtere Jigs an den tiefsten Kanten, auch tagsüber Chancen.',
        winter: 'Zentimeterarbeit am Grund: kleiner Gummi 8–10 cm, minimale Sprünge, sehr lange Pausen.' },
    Barsch: { fruehjahr: 'Kleine Gummis am DropShot in Ufernähe, ab Mai Cranks über den ersten Krautfeldern.',
        sommer: 'Morgens Oberfläche (Popper!), tagsüber Trupps mit DropShot und kleinen Cranks an Kanten suchen.',
        herbst: 'Schwärme jagen im Freiwasser: Spinner, kleine Blinker, Crankbaits – schnelle Führung.',
        winter: 'Tief und fein: DropShot mit kleinen Würmern, direkt vor der Nase anbieten.' },
    Forelle: { fruehjahr: 'Fluss zu (Schonzeit bis 30.04.) – am Forellenteich: helle Teigfarben, langsam geführte Spoons.',
        sommer: 'Früh und spät: kleine Spinner und Nymphen in den beschatteten Rinnen, mittags Pause.',
        herbst: 'Aggressive Farben, etwas größere Spinner – Bachforellen ab Oktober geschont, Refo prüfen!',
        winter: 'Fluss weitgehend zu – Forellenteich: Teig in Grundnähe, sehr langsam.' },
    Karpfen: { fruehjahr: 'Flache, sonnige Buchten: Mais und helle Pop-ups, wenig Futter.',
        sommer: 'Nachtangeln (wo erlaubt): Boilies fruchtig, Futterplatz klein halten – Schwimmbrot bei Sonne.',
        herbst: 'Fressphase vor dem Winter: fischige Boilies, größere Futtermengen zahlen sich aus.',
        winter: 'Sehr sparsam: einzelne helle Hookbaits an tiefen Löchern, Geduld.' },
    Aal: { fruehjahr: 'Ab den ersten warmen Nächten: Tauwurm am Grund in Ufernähe.',
        sommer: 'Beste Zeit: schwüle, dunkle Nächte – Tauwurmbündel oder Fischfetzen an Einläufen und Kanten.',
        herbst: 'Bis Oktober: letzte warme Nächte nutzen, danach wird es zäh.',
        winter: 'Praktisch aussichtslos – Aal ruht.' }
};
export function kbHtml() {
    /* Wassertemperatur schlägt Kalender: kaltes Wasser im Mai = noch Frühjahrsverhalten */
    let se = season();
    if (state.WX && state.WX.wt != null) {
        const wt = state.WX.wt;
        if (wt < 6)
            se = 'winter';
        else if (wt < 12)
            se = (se === 'herbst') ? 'herbst' : 'fruehjahr';
        else if (wt >= 20)
            se = 'sommer';
    }
    const fische = state.fishSel.length ? state.fishSel.slice() : ['Hecht', 'Zander', 'Barsch'];
    const bekannt = fische.filter(f => KB[f]), unbekannt = fische.filter(f => !KB[f]);
    const seName = { fruehjahr: 'Frühjahr', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter' }[se];
    let h = '<p style="color:var(--muted);margin-bottom:10px">Phase: <b>' + seName + '</b>'
        + (state.WX && state.WX.wt != null ? ' (nach Wassertemp)' : '')
        + (state.WX ? ' · Luft ' + Math.round(state.WX.temp) + '°C · ' + Math.round(state.WX.press) + ' hPa' : '')
        + (state.WX && state.WX.wt != null ? ' · Wasser ' + Math.round(state.WX.wt) + '°C' : '') + '</p>';
    bekannt.forEach(f => {
        const sc = state.SCHON.find(x => x.fisch === f || (f === 'Forelle' && /forelle/i.test(x.fisch)));
        const zu = sc && inSchonzeit(sc);
        h += '<p style="margin-bottom:9px"><b>' + f + ':</b> ' + (zu ? '<span style="color:#f0b6a8">⛔ aktuell geschont (' + fmtMD(sc.von) + '–' + fmtMD(sc.bis) + ') – nicht gezielt beangeln!</span> ' : '') + KB[f][se] + '</p>';
    });
    unbekannt.forEach(f => { h += '<p style="margin-bottom:9px;color:var(--muted)"><b>' + f + ':</b> Friedfisch/Sonderart – kein Raubfisch-Köderprofil hinterlegt. Grundmontage mit Naturköder (Wurm, Mais, Made), an Struktur und in der Dämmerung.</p>'; });
    if (state.WX) {
        if (state.WX.trendVal <= -1.5)
            h += '<p style="margin-bottom:9px"><b>Druck fällt (' + de1(state.WX.trendVal) + ' hPa/3h):</b> Fresslaune – aktiver und schneller führen, jetzt ans Wasser!</p>';
        else if (state.WX.trendVal >= 1.5)
            h += '<p style="margin-bottom:9px"><b>Druck steigt:</b> nach der Front oft zäh – Köder verkleinern, langsamer führen, Tiefe suchen.</p>';
    }
    if (state.WX && state.WX.wt != null) {
        if (state.WX.wt >= 25)
            h += '<p style="margin-bottom:9px"><b>⚠ Wasser ' + Math.round(state.WX.wt) + '°C:</b> Hitzestress – Entnahme statt C&amp;R, kurze Drills, tiefe/strömungsreiche Bereiche.</p>';
        else if (state.WX.wt < 10)
            h += '<p style="margin-bottom:9px"><b>Kaltes Wasser (' + Math.round(state.WX.wt) + '°C):</b> Stoffwechsel runter – alles halb so schnell führen, Pausen verdoppeln.</p>';
        else if (state.WX.wt >= 18 && state.WX.wt < 23)
            h += '<p style="margin-bottom:9px"><b>Wasser ' + Math.round(state.WX.wt) + '°C:</b> optimales Aktivitätsfenster für Zander &amp; Barsch.</p>';
    }
    const mn = new Date().getMonth() + 1;
    if (mn >= 4 && mn <= 6)
        h += '<p style="margin-bottom:9px;color:#e8c98c"><b>Laichzeit-Rücksicht:</b> Flachbuchten und Schilfkanten sind jetzt Kinderstube – dort behutsam, Laichfische zurücksetzen, viele Arten sind ohnehin geschont.</p>';
    h += '<p style="color:var(--muted)">Wasser trüb: Schockfarben (firetiger, chartreuse) und laute Köder · Wasser klar: Naturdekore, leiser, dünnere Vorfächer.</p>';
    return h;
}
export const KNOTS = [
    { name: 'Palomar-Knoten', use: 'Haken/Wirbel an geflochtener Schnur – der stärkste Allrounder', steps: [
            'Schnur doppeln, als Schlaufe durch das Hakenöhr führen',
            'Mit der Schlaufe einen einfachen Überhandknoten machen (Haken hängt lose)',
            'Schlaufe über den kompletten Haken stülpen',
            'An beiden Enden gleichmäßig festziehen, vorher anfeuchten, Rest kappen'
        ] },
    { name: 'Clinch-Knoten (verbessert)', use: 'Haken/Wirbel an monofiler Schnur', steps: [
            'Schnur durchs Öhr, 5–7 Mal um die Hauptschnur wickeln',
            'Ende durch die erste Schlaufe am Öhr führen',
            'Dann zurück durch die große Schlaufe, die dabei entsteht',
            'Anfeuchten, festziehen, Rest kappen'
        ] },
    { name: 'No-Knot (Knotenlos)', use: 'Direktmontage Vorfach an Fluorocarbon, für Zander/Hecht', steps: [
            'FC-Ende ca. 6–8 Mal eng um sich selbst und den Haken-/Schnurschenkel wickeln (aufsteigend)',
            'Ende von hinten durch das Hakenöhr fädeln',
            'Wicklungen zusammenschieben, anfeuchten, straff ziehen',
            'Sitzt bombenfest, kaum Tragkraftverlust'
        ] },
    { name: 'Schlaufenknoten (Rapala-Loop)', use: 'Bewegliche Köderanbindung – Wobbler laufen freier', steps: [
            'Überhandknoten in die Schnur (noch offen), Ende durchs Köderöhr',
            'Ende zurück durch den offenen Überhandknoten',
            '3–4 Mal um die Hauptschnur wickeln, zurück durch den Überhandknoten',
            'Anfeuchten, langsam zuziehen – es bleibt eine feste Schlaufe'
        ] },
    { name: 'Albright (Verbindung)', use: 'Zwei unterschiedlich dicke Schnüre verbinden (Geflecht↔FC-Vorfach)', steps: [
            'Aus der dickeren Schnur eine Schlaufe bilden',
            'Dünnere Schnur durch die Schlaufe, dann 10× um beide Schenkel der Schlaufe wickeln (Richtung Schlaufenende)',
            'Ende zurück durch die Schlaufe führen (gleiche Seite wie Eintritt)',
            'Beide Hauptschnüre halten, anfeuchten, Wicklungen straffziehen'
        ] }
];
export const toolsDlg = byId('toolsDlg');
export function openTools() { toolsDlg.hidden = false; }
byId('toolsClose').onclick = () => { toolsDlg.hidden = true; };
toolsDlg.addEventListener('click', e => { if (e.target === toolsDlg)
    toolsDlg.hidden = true; });
byId('tPlan').onclick = () => { toolsDlg.hidden = true; openPlan(); };
/* Schnellzugriff aus dem Hauptmenü – schließt das Menü und öffnet die Funktion. */
const ausMenu = (fn) => () => { menuZu(); fn(); };
byId('mPlan')?.addEventListener('click', ausMenu(openPlan));
byId('mWx')?.addEventListener('click', ausMenu(openWetter));
byId('mTools')?.addEventListener('click', ausMenu(openTools));
byId('mTrip')?.addEventListener('click', ausMenu(openTrip));
byId('mOff')?.addEventListener('click', ausMenu(openOffline));
byId('mFull')?.addEventListener('click', ausMenu(fullscreenToggle));
byId('tScore').onclick = () => { toolsDlg.hidden = true; openScore(); };
byId('wxScore')?.addEventListener('click', () => { if (wxDlg)
    wxDlg.hidden = true; openScore(); });
byId('tFore').onclick = () => { toolsDlg.hidden = true; openForecast(); };
byId('tOff').onclick = () => { toolsDlg.hidden = true; openOffline(); };
byId('tTrip').onclick = () => { toolsDlg.hidden = true; openTrip(); };
const satBtn = byId('satBtn');
if (satBtn) {
    satBtn.onclick = () => { toolsDlg.hidden = true; satToggle(); };
}
const schilfBtn = byId('schilfBtn');
if (schilfBtn) {
    schilfBtn.onclick = async () => { toolsDlg.hidden = true; await schilfToggle(); };
}
/* Schilf ist im Frühjahr/Sommer taktisch relevant – im Winter blenden wir den Schalter aus. */
export function syncSchilfBtn() {
    const b = byId('schilfBtn');
    if (b)
        b.hidden = !fokusFor().schilf;
}
syncSchilfBtn();
byId('tCol').onclick = () => { toolsDlg.hidden = true; openKb(); };
byId('tBite').onclick = () => { toolsDlg.hidden = true; openBite(); };
byId('tPack').onclick = () => { toolsDlg.hidden = true; openPack(); };
byId('tKnot').onclick = () => { toolsDlg.hidden = true; openKnot(); };
byId('tLead').onclick = () => { toolsDlg.hidden = true; openLead(); };
/* Bleigewicht-Berater: Strömung (Pegeltrend + Gewässertyp) + Tiefe */
export const leadDlg = byId('leadDlg');
export function openLead() {
    /* Fließgewässer? Aus den Spots der Region ableiten – die alte Regex (/rhein|mainz/)
       hielt Elbe, Main, Lahn und die Mulde faelschlich für Stillwasser. */
    const fliessSpots = state.SPOTS.filter(istFliess).length;
    const stroemung = fliessSpots > 0;
    let h = '<p style="color:var(--muted);margin-bottom:10px">Für ' + (state.REGION ? esc(state.REGION.kurz || state.REGION.name) : '—') + '</p>';
    if (stroemung) {
        const hoch = state.PEGEL && state.REGION.pegel && state.PEGEL.value >= state.REGION.pegel.warnAb;
        const steigend = state.PEGEL && state.PEGEL.trend >= 15;
        h += '<div class="card"><h3 style="font-size:13px">Rhein / Fließgewässer</h3><ul style="margin-left:16px">'
            + '<li><b>Normalpegel, Buhnenfeld:</b> Jigkopf 10–21 g – so leicht wie möglich, dass es noch tickt</li>'
            + '<li><b>Hauptstrom / tiefe Rinne:</b> 21–40 g, damit der Köder Grundkontakt hält</li>'
            + (hoch ? '<li style="color:#f0b6a8"><b>⚠ Hochwasser aktuell (' + state.PEGEL.value + ' cm):</b> 40–60 g nötig oder auf Hafenausfahrt ausweichen</li>' : '')
            + (steigend ? '<li style="color:#e8c98c"><b>Pegel steigt stark:</b> Strömung nimmt zu – 10 g mehr einplanen als sonst</li>' : '')
            + '<li><b>Faustregel:</b> leichtester Kopf, mit dem du in 5–8 s Grundkontakt bekommst</li></ul></div>';
    }
    else {
        h += '<div class="card"><h3 style="font-size:13px">Stillgewässer / See</h3><ul style="margin-left:16px">'
            + '<li><b>Flachwasser 0–3 m:</b> 3–7 g, langsames Absinken für misstrauische Fische</li>'
            + '<li><b>Mittlere Tiefe 3–6 m:</b> 7–14 g</li>'
            + '<li><b>Tiefe Kanten / >6 m (z.B. Woblitz-Kuhle, Eicher See):</b> 14–21 g für schnellen, kontrollierten Abstieg</li>'
            + '<li><b>Wind/Drift vom Boot:</b> 3–5 g schwerer, sonst verliert man den Grundkontakt</li>'
            + '<li><b>Vertikal vom Boot:</b> so schwer, dass die Schnur senkrecht bleibt</li></ul>'
            + '<p style="color:var(--muted);font-size:11px;margin-top:8px">🗺 Mehr Struktur sehen? hejfishPro und der Navionics Chart Viewer zeigen für viele Seen Tiefenkarten – bei kleinen Baggerseen ist die Abdeckung aber nicht garantiert, teils kostenpflichtig.</p></div>';
    }
    h += '<p style="color:var(--muted);font-size:11px">Grundkontakt ist König: Der Köder soll den Boden touchieren, aber nicht durchpflügen. Lieber 3 g zu leicht als 10 g zu schwer.</p>';
    byId('leadBody').innerHTML = h;
    leadDlg.hidden = false;
}
byId('leadClose').onclick = () => { leadDlg.hidden = true; };
leadDlg.addEventListener('click', e => { if (e.target === leadDlg)
    leadDlg.hidden = true; });
export const knotDlg = byId('knotDlg');
export function openKnot() {
    let h = '';
    KNOTS.forEach(k => {
        h += '<div class="card" style="margin-bottom:10px"><h3 style="font-size:13.5px">' + k.name + '</h3>'
            + '<p style="color:var(--muted);margin-bottom:6px">' + k.use + '</p><ol style="margin-left:16px">'
            + k.steps.map(x => '<li style="margin:3px 0">' + x + '</li>').join('') + '</ol></div>';
    });
    h += '<p style="color:var(--muted);font-size:11px">Knoten immer anfeuchten vor dem Zuziehen – trocken schneidet die Reibungshitze die Schnur an.</p>';
    byId('knotBody').innerHTML = h;
    knotDlg.hidden = false;
}
byId('knotClose').onclick = () => { knotDlg.hidden = true; };
knotDlg.addEventListener('click', e => { if (e.target === knotDlg)
    knotDlg.hidden = true; });
export const packDlg = byId('packDlg');
export async function packState() { try {
    return JSON.parse((await store.get('pack:' + state.REGION.id)).value) || {};
}
catch (e) {
    return {};
} }
/* ===== Erlaubnisschein-Ablauf: Datum lokal merken, rechtzeitig warnen =====
   Viele Erlaubnisscheine/Jahreskarten laufen jährlich ab – leicht zu vergessen, bis man
   ohne gültigen Schein am Wasser steht. Freiwillige Angabe, nichts wird erfunden: ohne
   gesetztes Datum bleibt die Warnung schlicht aus. */
async function erlaubnisDatum() {
    if (!state.REGION)
        return '';
    try {
        return (await store.get('erlaubnis:' + state.REGION.id)).value || '';
    }
    catch (e) {
        return '';
    }
}
async function setErlaubnisDatum(v) {
    if (!state.REGION)
        return;
    try {
        await store.set('erlaubnis:' + state.REGION.id, v);
    }
    catch (e) {
        state.persistent = false;
    }
}
/** Vergleicht das gespeicherte Ablaufdatum mit heute (Tagesbasis, Mitternacht - "heute"
    gilt noch nicht als abgelaufen) und zeigt/versteckt die Kopfwarnung entsprechend. */
export async function checkErlaubnisAblauf() {
    const warn = byId('erlaubnisWarn');
    if (!warn || !state.REGION)
        return;
    const iso = await erlaubnisDatum();
    if (!iso) {
        warn.classList.remove('show');
        warn.innerHTML = '';
        return;
    }
    const ablauf = new Date(iso + 'T00:00:00');
    if (isNaN(ablauf.getTime())) {
        warn.classList.remove('show');
        warn.innerHTML = '';
        return;
    }
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const tage = Math.round((ablauf.getTime() - heute.getTime()) / 86400000);
    const dtxt = ablauf.toLocaleDateString('de-DE');
    if (tage < 0) {
        warn.innerHTML = '⛔ Erlaubnisschein seit ' + dtxt + ' abgelaufen – vor dem nächsten Trip erneuern!';
        warn.classList.add('show');
    }
    else if (tage <= 14) {
        warn.innerHTML = '⚠ Erlaubnisschein läuft am ' + dtxt + ' ab (' + tage + (tage === 1 ? ' Tag' : ' Tage') + ') – bald erneuern.';
        warn.classList.add('show');
    }
    else {
        warn.classList.remove('show');
        warn.innerHTML = '';
    }
}
export async function openPack() {
    if (!state.REGION) {
        return;
    }
    const items = state.REGION.packliste || [];
    const checked = await packState();
    const erlDatum = await erlaubnisDatum();
    let h = '<p style="color:var(--muted);margin-bottom:10px">Für ' + esc(state.REGION.kurz || state.REGION.name) + ' – Haken bleiben gespeichert.</p>';
    h += '<label class="fbentn" style="margin:5px 0 12px;align-items:center;gap:8px"><span>📅 Erlaubnisschein gültig bis</span>'
        + '<input type="date" id="packErlDatum" value="' + esc(erlDatum) + '" style="font-size:13px;padding:6px 8px;min-height:32px;min-width:132px;border-radius:6px;border:1px solid var(--line);background:var(--panel-2);color:inherit;cursor:pointer"></label>';
    items.forEach((it, i) => {
        h += '<label class="fbentn" style="margin:5px 0"><input type="checkbox" data-pi="' + i + '"' + (checked[i] ? ' checked' : '') + '> <span>' + it + '</span></label>';
    });
    byId('packBody').innerHTML = h;
    byId('packBody').querySelectorAll('input[data-pi]').forEach((cb) => {
        cb.onchange = async () => {
            const st = await packState();
            st[cb.dataset.pi] = cb.checked;
            try {
                await store.set('pack:' + state.REGION.id, JSON.stringify(st));
            }
            catch (e) {
                state.persistent = false;
            }
        };
    });
    const erlEl = byId('packErlDatum');
    if (erlEl)
        erlEl.onchange = async () => { await setErlaubnisDatum(erlEl.value); await checkErlaubnisAblauf(); };
    packDlg.hidden = false;
}
byId('packClose').onclick = () => { packDlg.hidden = true; };
byId('packReset').onclick = async () => { try {
    await store.set('pack:' + state.REGION.id, '{}');
}
catch (e) {
    state.persistent = false;
} openPack(); };
packDlg.addEventListener('click', e => { if (e.target === packDlg)
    packDlg.hidden = true; });
export const biteDlg = byId('biteDlg');
let biteTag = 0;
export function openBite() {
    biteTag = 0;
    renderBite();
    biteDlg.hidden = false;
}
function renderBite() {
    const c = regionCenter();
    const heute = biteTag === 0;
    const now = new Date();
    const tag = tagDatum(biteTag, now);
    const win = solunar(c.lat, c.lng, tag);
    const st = sunTimes(c.lat, c.lng, tag);
    const lbl = byId('biteTagLabel');
    if (lbl)
        lbl.textContent = tagLabel(biteTag, now);
    const tt = byId('biteTitel');
    if (tt)
        tt.textContent = heute ? 'Beißzeiten heute' : 'Beißzeiten ' + tagLabel(biteTag, now).replace(/^Morgen · /, 'morgen, ');
    const pv = byId('bitePrev');
    if (pv)
        pv.disabled = biteTag <= 0;
    const nx = byId('biteNext');
    if (nx)
        nx.disabled = biteTag >= MAX_TAG;
    const ms = mondStaerke(tag.getTime());
    const mondTxt = ms > 0.6 ? ' · Neu-/Vollmond – Fenster verstärkt' : ms < 0.25 ? ' · Halbmond – Fenster schwächer' : '';
    let h = '<p style="color:var(--muted);margin-bottom:10px">' + mondPhase(tag) + ' '
        + (st ? '· ☀ ' + hhmm(st.rise) + '–' + hhmm(st.set) : '') + esc(mondTxt) + ' · für ' + (state.REGION ? esc(state.REGION.kurz || state.REGION.name) : 'aktuelle Region') + '</p>';
    if (!win.length) {
        h += '<p>Für diesen Tag lassen sich keine Fenster berechnen (Polartag/-nacht?).</p>';
    }
    else {
        h += '<p style="margin-bottom:10px">Beste Beißfenster – <b>Major</b> (Mond hoch/tief, ~2 h) sind stärker als <b>Minor</b> (Sonnenauf-/-untergang):</p>';
        const nowMs = now.getTime();
        /* Luftdruck für DIESEN Tag: Mitte des ersten Major-Fensters aus der Stundenvorhersage. */
        const mid = win.find(w => w.type === 'major');
        const wxTag = wxAt(mid ? new Date((mid.from.getTime() + mid.to.getTime()) / 2) : tag);
        const druckGut = !!wxTag && wxTag.trendVal <= -1.0; /* fallender Druck verstärkt */
        const druckSchlecht = !!wxTag && wxTag.trendVal >= 1.5; /* steigend dämpft */
        win.forEach(wdw => {
            const aktiv = heute && nowMs >= wdw.from && nowMs <= wdw.to;
            const vorbei = heute && nowMs > wdw.to;
            const top = wdw.type === 'major' && druckGut; /* Major + fallender Druck = Top */
            const farbe = top ? '#f0c14b' : wdw.type === 'major' ? 'var(--amber)' : 'var(--dusk)';
            h += '<div style="display:flex;align-items:center;gap:9px;margin:7px 0;' + (vorbei ? 'opacity:.45' : '') + '">'
                + '<span style="min-width:8px;width:8px;height:8px;border-radius:50%;background:' + farbe + ';display:inline-block"></span>'
                + '<b style="min-width:96px">' + hhmm(wdw.from) + '–' + hhmm(wdw.to) + '</b>'
                + '<span>' + (top ? '★ Top' : (wdw.type === 'major' ? 'Major' : 'Minor')) + ' · ' + wdw.label + '</span>'
                + (aktiv ? '<span style="margin-left:auto;color:var(--forelle);font-weight:700">● jetzt!</span>' : '')
                + '</div>';
        });
        if (wxTag) {
            h += '<p style="margin-top:10px;padding:8px;border-radius:8px;background:var(--panel-2);font-size:12px">'
                + (druckGut ? '📉 <b>Luftdruck fällt (' + de1(wxTag.trendVal) + ' hPa/3h)</b> – Major-Fenster sind als ★ Top markiert, beste Karten!'
                    : druckSchlecht ? '📈 Luftdruck steigt – nach der Front oft zäh, Fenster eher schwächer als sonst.'
                        : '➡ Luftdruck stabil – Fenster gelten wie berechnet.')
                + (heute ? '' : ' <span style="color:var(--muted)">(aus der Vorhersage)</span>') + '</p>';
        }
        else {
            h += '<p style="margin-top:10px;padding:8px;border-radius:8px;background:var(--panel-2);font-size:12px;color:var(--muted)">'
                + 'Für diesen Tag liegt keine Wettervorhersage vor – die Fenster sind rein astronomisch berechnet (das stimmt, aber Druck und Wind fehlen).</p>';
        }
        h += '<p style="color:var(--muted);margin-top:10px;font-size:11px">Solunar-Theorie: Fische sind rund um Mond-Höchst-/Tiefstand am aktivsten. Näherungswerte – kein Ersatz für eigene Beobachtung. Druckabfall &amp; Dämmerung verstärken die Fenster.</p>';
    }
    byId('biteBody').innerHTML = h;
}
byId('bitePrev').onclick = () => { if (biteTag > 0) {
    biteTag--;
    renderBite();
} };
byId('biteNext').onclick = () => { if (biteTag < MAX_TAG) {
    biteTag++;
    renderBite();
} };
byId('biteClose').onclick = () => { biteDlg.hidden = true; };
biteDlg.addEventListener('click', e => { if (e.target === biteDlg)
    biteDlg.hidden = true; });
/* ===== Wochen-Vorschau: 7 Tage Solunar (offline) + Wetter (online) ===== */
function wxDesc(code) {
    if (code == null)
        return { t: '–', e: '·' };
    if (code === 0)
        return { t: 'klar', e: '☀' };
    if (code <= 2)
        return { t: 'heiter', e: '🌤' };
    if (code === 3)
        return { t: 'bewölkt', e: '☁' };
    if (code <= 48)
        return { t: 'Nebel', e: '🌫' };
    if (code <= 57)
        return { t: 'Niesel', e: '🌦' };
    if (code <= 67)
        return { t: 'Regen', e: '🌧' };
    if (code <= 77)
        return { t: 'Schnee', e: '🌨' };
    if (code <= 82)
        return { t: 'Schauer', e: '🌦' };
    if (code <= 86)
        return { t: 'Schneeschauer', e: '🌨' };
    if (code >= 95)
        return { t: 'Gewitter', e: '⛈' };
    return { t: 'wechselhaft', e: '🌥' };
}
/** Tagesscore für den Wochen-Ausblick: transparent, additiv, nutzt nur bereits geladene
    Daten (keine weiteren Anfragen). Gewichte offen im Code, wie überall sonst in der App.
    Sturm ist ein Ausschlusskriterium (wie in rating.ts/computeScore), kein bloßer Abzug. */
export function tagesScore(day, wx, idx) {
    let punkte = 0;
    const gruende = [];
    if (day.majors.length) {
        punkte += 2;
        gruende.push(day.majors.length > 1 ? day.majors.length + ' Major-Fenster' : 'Major-Fenster');
    }
    const ms = mondStaerke(day.date.getTime());
    if (ms > 0.6) {
        punkte += 1;
        gruende.push('Neu-/Vollmond verstärkt');
    }
    /* Drucktrend am staerksten Major-Fenster des Tages – dieselbe Herleitung wie im
       Beisszeiten-Werkzeug (renderBite): trendVal <= -1.0 gilt dort als "verstaerkt". */
    const mid = day.majors[0];
    const wxTag = mid ? wxAt(new Date((mid.from.getTime() + mid.to.getTime()) / 2)) : null;
    if (wxTag && typeof wxTag.trendVal === 'number' && wxTag.trendVal <= -1.0) {
        punkte += 1.5;
        gruende.push('fallender Luftdruck');
    }
    let sturm = false;
    const windMax = wx && wx.wind_speed_10m_max ? wx.wind_speed_10m_max[idx] : null;
    if (windMax != null && windMax >= 35) {
        sturm = true;
        punkte = Math.min(punkte, 0.5);
        gruende.length = 0;
        gruende.push('Sturm angesagt (' + Math.round(windMax) + ' km/h)');
    }
    return { punkte, gruende, sturm };
}
/* ICS-Zeitstempel in UTC (kein TZID noetig - Date-Objekte kennen ihren absoluten Zeitpunkt
   bereits, der Kalender des Nutzers rechnet selbst in die lokale Zeitzone um). */
function icsDate(d) {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
function icsEsc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}
/** Baut eine .ics-Datei aus den Major-Fenstern des 7-Tage-Ausblicks - nur echte, bereits
    berechnete Solunar-Fenster, keine erfundenen Termine. Minor-Fenster bleiben aussen vor
    (sonst ueberladen 4+ Termine/Tag den Kalender). */
export function wochenIcs(days, regionName) {
    const stamp = icsDate(new Date());
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Beisszeit//Wochenvorschau//DE\r\nCALSCALE:GREGORIAN\r\n';
    let n = 0;
    days.forEach(day => {
        day.majors.forEach(win => {
            n++;
            ics += 'BEGIN:VEVENT\r\n'
                + 'UID:beisszeit-' + win.from.getTime() + '-' + n + '@beisszeit\r\n'
                + 'DTSTAMP:' + stamp + '\r\n'
                + 'DTSTART:' + icsDate(win.from) + '\r\n'
                + 'DTEND:' + icsDate(win.to) + '\r\n'
                + 'SUMMARY:' + icsEsc('🎣 Major-Fenster: ' + win.label) + '\r\n'
                + (regionName ? 'LOCATION:' + icsEsc(regionName) + '\r\n' : '')
                + 'DESCRIPTION:' + icsEsc('Beste Beißzeit laut Solunar-Berechnung.') + '\r\n'
                + 'END:VEVENT\r\n';
        });
    });
    ics += 'END:VCALENDAR\r\n';
    return { ics, count: n };
}
export const foreDlg = byId('foreDlg');
export async function openForecast() {
    const c = regionCenter();
    const body = byId('foreBody');
    foreDlg.hidden = false;
    body.innerHTML = '<p style="color:var(--muted)">Lade Vorschau …</p>';
    /* 7 Tage Solunar offline berechnen */
    const days = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
        const d = new Date(base.getTime() + i * 86400000);
        const win = solunar(c.lat, c.lng, d) || [];
        const majors = win.filter(w => w.type === 'major');
        days.push({ date: d, majors, mond: mondPhase(d) });
    }
    /* Wetter dazuholen (online) – wenn es scheitert, bleibt die Solunar-Vorschau */
    let wx = null;
    try {
        const u = 'https://api.open-meteo.com/v1/forecast?latitude=' + c.lat.toFixed(3) + '&longitude=' + c.lng.toFixed(3)
            + '&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,pressure_msl_max&forecast_days=7&timezone=auto';
        const r = await fetch(u);
        if (r.ok) {
            const j = await r.json();
            if (j.daily && j.daily.time)
                wx = j.daily;
        }
    }
    catch (e) { }
    const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    /* Score je Tag – nur zum Ranking, nie als eigene Zahl angezeigt (sonst zwei Prozentwerte
       fuer dieselbe Sache, wie beim Planer schon vermieden). */
    const scores = days.map((day, i) => tagesScore(day, wx, i));
    /* Sturmtage sind kein Kandidat fuer "bester Tag" (Ausschluss, kein Abzug - wie ueberall
       sonst in der App). Sind ausnahmslos alle 7 Tage Sturm, gibt es ehrlich keinen besten Tag. */
    const offeneTage = scores.map((_, i) => i).filter(i => !scores[i].sturm);
    const bestIdx = offeneTage.length
        ? offeneTage.reduce((best, i) => scores[i].punkte > scores[best].punkte ? i : best, offeneTage[0])
        : -1;
    const beste = bestIdx >= 0 ? scores[bestIdx] : null;
    let h = '<p style="color:var(--muted);margin-bottom:10px">7-Tage-Ausblick für ' + (state.REGION ? esc(state.REGION.kurz || state.REGION.name) : 'aktuelle Region')
        + '. <b>Major-Fenster</b> (Mond hoch/tief) sind die stärksten Beißzeiten.' + (wx ? '' : ' <span style="color:var(--warn)">Wetter offline nicht verfügbar – nur Solunar.</span>') + '</p>';
    if (beste && beste.punkte > 0 && beste.gruende.length) {
        h += '<div style="padding:8px 10px;margin-bottom:10px;border-radius:8px;background:rgba(240,193,75,.12);border:1px solid rgba(240,193,75,.35)">'
            + '🏆 <b>Bester Tag: ' + WD[days[bestIdx].date.getDay()] + ' ' + esc(fmtDate(days[bestIdx].date)) + '</b>'
            + ' – ' + esc(beste.gruende.join(', ')) + '</div>';
    }
    days.forEach((day, i) => {
        const isToday = i === 0;
        const istBester = i === bestIdx && beste && beste.punkte > 0;
        let wxCell = '';
        if (wx) {
            const wd = wxDesc(wx.weather_code ? wx.weather_code[i] : null);
            const tmax = wx.temperature_2m_max ? Math.round(wx.temperature_2m_max[i]) : null;
            const tmin = wx.temperature_2m_min ? Math.round(wx.temperature_2m_min[i]) : null;
            const wind = wx.wind_speed_10m_max ? Math.round(wx.wind_speed_10m_max[i]) : null;
            wxCell = '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">' + wd.e + ' ' + wd.t
                + (tmax != null ? ' · ' + tmin + '–' + tmax + '°C' : '')
                + (wind != null ? ' · 💨 ' + wind + ' km/h' : '') + '</div>';
        }
        const winStr = day.majors.length
            ? day.majors.map(m => hhmm(m.from) + '–' + hhmm(m.to)).join('  ·  ')
            : '<span style="color:var(--muted)">–</span>';
        h += '<div style="padding:8px 0;border-bottom:1px solid var(--line)' + (isToday ? ';background:rgba(110,168,196,.08);border-radius:8px;padding-left:8px;padding-right:8px' : '') + '">'
            + '<div style="display:flex;align-items:baseline;gap:8px">'
            + '<b style="min-width:74px">' + WD[day.date.getDay()] + ' ' + fmtDate(day.date) + (isToday ? ' <span style="color:var(--dusk)">heute</span>' : '') + '</b>'
            + '<span style="font-family:\'Space Mono\',monospace;font-size:12px">' + winStr + '</span>'
            + (istBester ? '<span style="margin-left:6px">🏆</span>' : '')
            + '<span style="margin-left:auto">' + day.mond.split(' ')[0] + '</span>'
            + '</div>' + wxCell + '</div>';
    });
    h += '<p style="color:var(--muted);margin-top:10px;font-size:11px">Solunar-Fenster sind astronomisch berechnet (offline verfügbar). "Bester Tag" ist ein Modellwert aus Major-Fenstern, Mondphase und Luftdrucktrend (Gewichte offen im Quelltext) – Wasserstand, Front-Durchgang und eigene Beobachtung schlagen jede Vorhersage.</p>';
    body.innerHTML = h;
    /* Export nur anbieten, wenn es ueberhaupt Major-Fenster zum Exportieren gibt */
    const icsBtn = byId('foreIcs');
    const { ics, count } = wochenIcs(days, state.REGION ? (state.REGION.kurz || state.REGION.name) : undefined);
    icsBtn.hidden = count === 0;
    if (count > 0) {
        icsBtn.onclick = () => {
            const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'beisszeit-woche.ics';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }
}
byId('foreClose').onclick = () => { foreDlg.hidden = true; };
foreDlg.addEventListener('click', e => { if (e.target === foreDlg)
    foreDlg.hidden = true; });
/* ===== "Heute passt es?"-Score – transparent, additiv, ehrlich bei fehlenden Daten ===== */
export function computeScore() {
    const now = new Date();
    const factors = [];
    /* Faktor 1: Luftdruck-Trend (stärkster Prädiktor) */
    if (state.WX && typeof state.WX.trendVal === 'number') {
        let pt, txt;
        if (state.WX.trendVal <= -1.5) {
            pt = 2;
            txt = 'Fallender Druck (' + de1(state.WX.trendVal) + ' hPa/3h) – Fresslaune';
        }
        else if (state.WX.trendVal < 1.5) {
            pt = 1;
            txt = 'Druck stabil (' + de1(state.WX.trendVal) + ' hPa/3h) – neutral';
        }
        else {
            pt = 0;
            txt = 'Druck steigt (' + de1(state.WX.trendVal) + ' hPa/3h) – nach Front oft zäh';
        }
        factors.push({ name: 'Luftdruck', pts: pt, max: 2, txt });
    }
    else
        factors.push({ name: 'Luftdruck', pts: null, max: 2, txt: 'Keine Wetterdaten geladen' });
    /* Faktor 2: Beißfenster jetzt (solunar) */
    const c = regionCenter();
    const wins = c ? solunar(c.lat, c.lng, now) : [];
    if (wins.length) {
        const inWin = wins.find(w => now >= w.from && now <= w.to);
        let pt, txt;
        if (inWin && inWin.type === 'major') {
            pt = 2;
            txt = 'Major-Beißfenster läuft gerade (' + inWin.label + ')';
        }
        else if (inWin) {
            pt = 1;
            txt = 'Minor-Beißfenster läuft (' + inWin.label + ')';
        }
        else {
            const next = wins.filter(w => w.from > now).sort((a, b) => a.from - b.from)[0];
            if (next && (next.from - now.getTime()) <= 90 * 60e3) {
                pt = 1;
                txt = 'Beißfenster in ' + Math.round((next.from - now.getTime()) / 60e3) + ' min (' + next.label + ')';
            }
            else {
                pt = 0;
                txt = next ? 'Nächstes Fenster erst ' + hhmm(next.from) + ' Uhr' : 'Kein Fenster in Reichweite';
            }
        }
        factors.push({ name: 'Beißfenster', pts: pt, max: 2, txt });
    }
    else
        factors.push({ name: 'Beißfenster', pts: null, max: 2, txt: 'Sonnen-/Monddaten nicht verfügbar' });
    /* Faktor 3: Wassertemperatur */
    const wt = (state.WX && state.WX.wt != null) ? state.WX.wt : (state.PEGEL && state.PEGEL.wt != null ? state.PEGEL.wt : null);
    if (wt != null) {
        let pt, txt;
        if (wt >= 12 && wt <= 20) {
            pt = 2;
            txt = 'Wasser ' + Math.round(wt) + '°C – optimales Raubfischfenster';
        }
        else if ((wt >= 8 && wt < 12) || (wt > 20 && wt < 25)) {
            pt = 1;
            txt = 'Wasser ' + Math.round(wt) + '°C – brauchbar';
        }
        else if (wt >= 25) {
            pt = 0;
            txt = 'Wasser ' + Math.round(wt) + '°C – Hitzestress, träge';
        }
        else {
            pt = 0;
            txt = 'Wasser ' + Math.round(wt) + '°C – Kälte-Lethargie';
        }
        factors.push({ name: 'Wassertemp.', pts: pt, max: 2, txt });
    }
    else
        factors.push({ name: 'Wassertemp.', pts: null, max: 2, txt: 'Keine Wassertemperatur verfügbar' });
    /* Faktor 4: Pegel – nur an Fließgewässern mit Pegelstation */
    const istFluss = state.PEGEL && state.PEGEL.value != null;
    if (istFluss) {
        const hoch = state.REGION.pegel && state.PEGEL.value >= state.REGION.pegel.warnAb;
        const starkSteigend = state.PEGEL.trend != null && state.PEGEL.trend >= 25;
        let pt, txt;
        if (hoch) {
            pt = 0;
            txt = 'Hochwasser (' + state.PEGEL.value + ' cm) – schwer befischbar';
        }
        else if (starkSteigend) {
            pt = 1;
            txt = 'Pegel steigt stark (+' + state.PEGEL.trend + ' cm/24h) – Fische umorientiert';
        }
        else {
            pt = 2;
            txt = 'Pegel moderat (' + state.PEGEL.value + ' cm) – gut befischbar';
        }
        factors.push({ name: 'Pegel', pts: pt, max: 2, txt });
    }
    else
        factors.push({ name: 'Pegel', pts: null, max: 2, txt: 'Kein Pegel in Reichweite' });
    /* Faktor 5: Wind – IMMER bewerten. Vorher war das ein `else if` zum Pegel, wodurch
       an Fließgewässern selbst 34 km/h unsichtbar blieben und der Score 100 % zeigte. */
    if (state.WX && typeof state.WX.wind === 'number') {
        let pt, txt;
        if (state.WX.wind >= 5 && state.WX.wind <= 20) {
            pt = 2;
            txt = 'Wind ' + Math.round(state.WX.wind) + ' km/h – Wellen bringen Aktivität';
        }
        else if (state.WX.wind < 5) {
            pt = 1;
            txt = 'Wenig Wind (' + Math.round(state.WX.wind) + ' km/h) – Wasser ruhig';
        }
        else if (state.WX.wind < 35) {
            pt = 0.5;
            txt = 'Starker Wind (' + Math.round(state.WX.wind) + ' km/h) – schwer zu werfen, Wellen';
        }
        else {
            pt = 0;
            txt = 'Sturm (' + Math.round(state.WX.wind) + ' km/h) – nicht befischbar';
        }
        factors.push({ name: 'Wind', pts: pt, max: 2, txt });
    }
    else
        factors.push({ name: 'Wind', pts: null, max: 2, txt: 'Keine Winddaten' });
    /* Summe nur über bekannte Faktoren */
    const known = factors.filter(f => f.pts != null);
    const sum = known.reduce((a, f) => a + f.pts, 0);
    const maxSum = known.reduce((a, f) => a + f.max, 0);
    let pct = maxSum > 0 ? Math.round(sum / maxSum * 100) : null;
    const sturm = !!(state.WX && typeof state.WX.wind === 'number' && state.WX.wind >= 35);
    /* Konfidenz-Dämpfung wie in der Spotbewertung (rating.ts): bei dünner Datenlage zur
       Mitte ziehen, statt mit vollem Selbstbewusstsein "100%" zu zeigen, obwohl z.B. nur
       1 von 5 Faktoren bekannt ist (vorher: known.length floss nirgends in den Prozentwert
       ein, nur in den kleinen Hinweistext darunter - leicht zu übersehen). Sturm bleibt ein
       harter Ausschluss ohne Dämpfung, wie bei !gesperrt in rating.ts. */
    const konfidenz = factors.length ? known.length / factors.length : 1;
    if (!sturm && pct != null && konfidenz < 0.8) {
        const faktor = 0.6 + 0.5 * konfidenz; // 0.8→1.0, 0.5→0.85, 0.3→0.75
        pct = Math.round(50 + (pct - 50) * faktor);
    }
    /* Sturm ist ein Ausschlusskriterium, kein Abzug – wie in der Spotbewertung.
       Vorher konnten 60 km/h zu "50 % – mäßig" führen, weil der Wind-Faktor an
       Fließgewässern (mit Pegel) gar nicht bewertet wurde. */
    if (sturm) {
        if (pct != null)
            pct = Math.min(pct, 15);
        factors.push({ name: 'Sturm', pts: 0, max: 2, txt: 'Sturm (' + Math.round(state.WX.wind) + ' km/h) – Angeln ist heute unverantwortlich' });
    }
    return { factors, sum, maxSum, pct, knownCount: known.length, konfidenz, sturm };
}
export function scoreAmpel(pct) {
    if (pct == null)
        return { label: 'Zu wenig Daten', color: 'var(--muted)', emoji: '○' };
    if (pct >= 75)
        return { label: 'Top', color: 'var(--ok)', emoji: '●' };
    if (pct >= 55)
        return { label: 'Gut', color: 'var(--dusk)', emoji: '●' };
    if (pct >= 35)
        return { label: 'Mäßig', color: 'var(--amber)', emoji: '●' };
    return { label: 'Schwierig', color: 'var(--warn)', emoji: '●' };
}
export const scoreDlg = byId('scoreDlg');
export function openScore() {
    const r = computeScore();
    const a = scoreAmpel(r.pct);
    let h = '';
    /* Sturm zuerst und unübersehbar – vor jeder Prozentzahl. */
    if (r.sturm)
        h += '<div class="rate-sturm">⚠ Sturm – Angeln ist heute unverantwortlich. Der Wert unten ist gedeckelt.</div>';
    /* Kopf: große Ampel */
    h += '<div style="text-align:center;padding:8px 0 14px">';
    h += '<div style="font-size:34px;font-weight:900;color:' + a.color + ';line-height:1;font-family:\'Lato\',sans-serif">' + (r.pct != null ? r.pct + '%' : '–') + '</div>';
    h += '<div style="font-size:16px;font-weight:700;color:' + a.color + ';margin-top:3px">' + a.emoji + ' ' + a.label + '</div>';
    if (r.knownCount < r.factors.length)
        h += '<div style="font-size:11px;color:var(--muted);margin-top:4px">' + r.knownCount + ' von ' + r.factors.length + ' Faktoren mit Daten – lade Wetter/Pegel für ein volles Bild</div>';
    h += '</div>';
    /* Faktoren */
    h += '<div style="display:flex;flex-direction:column;gap:8px">';
    r.factors.forEach(f => {
        const known = f.pts != null;
        const col = !known ? 'var(--muted)' : f.pts === 2 ? 'var(--ok)' : f.pts === 1 ? 'var(--amber)' : 'var(--warn)';
        h += '<div style="display:flex;gap:10px;align-items:flex-start">';
        h += '<span style="min-width:9px;width:9px;height:9px;border-radius:50%;background:' + col + ';margin-top:4px"></span>';
        h += '<div style="flex:1"><b style="font-size:12.5px">' + esc(f.name) + '</b>' + (known ? ' <span style="font-family:\'Space Mono\',monospace;color:var(--muted);font-size:11px">' + f.pts + '/' + f.max + '</span>' : '') + '<br><span style="font-size:12px;color:var(--muted)">' + esc(f.txt) + '</span></div>';
        h += '</div>';
    });
    h += '</div>';
    h += '<p class="fineprint" style="margin-top:14px">Anhaltspunkt aus Druck-Trend, Beißfenster, Wassertemperatur und Pegel/Wind – kein Ersatz für Wasserkontakt. Faktoren ohne Daten zählen nicht mit.</p>';
    byId('scoreBody').innerHTML = h;
    scoreDlg.hidden = false;
}
byId('scoreClose').onclick = () => { scoreDlg.hidden = true; };
scoreDlg.addEventListener('click', e => { if (e.target === scoreDlg)
    scoreDlg.hidden = true; });
export const kbDlg = byId('kbDlg');
export function openKb() { byId('kbBody').innerHTML = kbHtml(); kbDlg.hidden = false; }
byId('kbClose').onclick = () => { kbDlg.hidden = true; };
kbDlg.addEventListener('click', e => { if (e.target === kbDlg)
    kbDlg.hidden = true; });
/* Handy gedreht / Fenster skaliert: Karte neu vermessen */
export let rsT;
addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => state.map.invalidateSize(), 150); });
/* Aktivitätsoptima: zentrale Tabelle aus tackle.ts (keine zweite Kopie!) */
function wtHinweis(wt, arten) {
    if (wt == null)
        return null;
    const rel = (arten || []).filter(a => WT_OPT[a]).slice(0, 4);
    if (!rel.length)
        return Math.round(wt) + ' °C';
    const gut = [], traege = [], aktiv = [];
    rel.forEach(a => {
        const [lo, hi] = WT_OPT[a];
        if (wt >= lo && wt <= hi)
            gut.push(a);
        else if (wt < lo)
            traege.push(a);
        else
            aktiv.push(a);
    });
    let t = Math.round(wt) + ' °C · ';
    const teile = [];
    if (gut.length)
        teile.push('<b>optimal für ' + gut.join(', ') + '</b>');
    if (traege.length)
        teile.push('zu kalt für ' + traege.join(', ') + ' (träge, langsam führen)');
    if (aktiv.length)
        teile.push('über Optimum für ' + aktiv.join(', ') + ' (tiefe/kühle Zonen suchen)');
    t += teile.join(' · ');
    if (wt >= 25)
        t += ' <span style="color:var(--warn)">⚠ Hitzestress – Drill kurz, C&amp;R vermeiden</span>';
    return t;
}
/* Distanz im Popup nachtragen */
state.map.on('popupopen', e => {
    document.body.classList.add('popup-offen'); /* Karten-Controls ausblenden, kein Layer-Salat beim Scrollen */
    const wrap = e.popup.getElement();
    if (wrap)
        wrap.querySelectorAll('.tackle > summary, .pop-details > summary').forEach((sum) => {
            sum.addEventListener('click', (ev) => {
                ev.preventDefault(); /* nicht im engen Popup aufklappen – Vollbild-Panel öffnen */
                const det = sum.parentElement;
                const body = det && det.querySelector('.tackle-body, .pop-details-body');
                oeffneDetail((sum.textContent || '').replace(/[\u203A+\u2013\s]+$/, '').trim(), body ? body.outerHTML : '');
            });
        });
    const wtEl = e.popup.getElement().querySelector('[data-wt]');
    if (wtEl) {
        const wt = (state.PEGEL && typeof state.PEGEL.wt === 'number') ? state.PEGEL.wt : (state.WX && typeof state.WX.wt === 'number' ? state.WX.wt : null);
        const arten = (wtEl.dataset.wt || '').split(',').map(x => x.trim()).filter(Boolean);
        const txt = wtHinweis(wt, arten);
        if (txt)
            wtEl.innerHTML = '<b>Wassertemperatur</b>' + txt;
        else
            wtEl.remove();
    }
    const tEl = e.popup.getElement().querySelector('.pop-btn.trip');
    if (tEl)
        setTripBtn(tEl, inTrip(tEl.dataset.spot));
    const wEl = e.popup.getElement().querySelector('[data-wind]');
    if (wEl) {
        if (state.WX && state.WX.wind >= 8) {
            const dirs = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'];
            const luv = dirs[Math.round(((state.WX.dirDeg + 180) % 360) / 45) % 8];
            wEl.innerHTML = '<b>Wind-Taktik jetzt</b>💨 ' + state.WX.dir + ' ' + Math.round(state.WX.wind) + ' km/h drückt Nahrung ans <b>' + luv + 'ufer</b> – dort anwerfen.';
        }
        else if (state.WX) {
            wEl.innerHTML = '<b>Wind-Taktik jetzt</b>Wenig Wind (' + Math.round(state.WX.wind) + ' km/h) – Uferwahl frei, Kanten und Struktur entscheiden.';
        }
        else
            wEl.remove();
    }
    const el = e.popup.getElement().querySelector('[data-dist]');
    if (el) {
        const [la, ln] = el.dataset.dist.split(',').map(Number);
        const c = state.map.getCenter();
        const ref = state.userPos || [c.lat, c.lng];
        el.textContent = '~' + de1(haversine(ref[0], ref[1], la, ln)) + ' km ' + (state.userPos ? 'von dir' : 'von Kartenmitte');
    }
    const notizEl = e.popup.getElement().querySelector('.notiz-ta');
    if (notizEl) {
        const name = notizEl.dataset.notizSpot || '';
        ladeNotiz(name).then(txt => { if (notizEl.value === '')
            notizEl.value = txt; }); /* Popup evtl. laengst zu/neu geoeffnet */
        notizEl.onblur = () => { speichereNotiz(name, notizEl.value); };
    }
});
state.map.on('popupclose', () => document.body.classList.remove('popup-offen'));
/* Vollbild-Panel für Tackle / Gewässer & Methode. */
function oeffneDetail(titel, html) {
    const sheet = byId('detailSheet');
    const t = byId('detailTitle');
    const b = byId('detailBody');
    if (!sheet || !b)
        return;
    if (t)
        t.textContent = titel;
    b.innerHTML = html;
    b.scrollTop = 0;
    sheet.hidden = false;
}
(function () {
    const sheet = byId('detailSheet');
    if (!sheet)
        return;
    const zu = () => { sheet.hidden = true; };
    const c = byId('detailClose');
    if (c)
        c.onclick = zu;
    sheet.addEventListener('click', ev => { if (ev.target === sheet)
        zu(); });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !sheet.hidden)
        zu(); });
})();
