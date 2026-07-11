/* "Heute würde ich genau hier anfangen."

   Eine einzige, konkrete Empfehlung statt sechs Rohwerte. Kombiniert:
   Solunar/Dämmerung (Zeit), Hotspot-Saison + Wind + Gewässertyp (Ort),
   Schonzeiten + Wassertemperatur (Zielfisch), Tackle + Trübung (Köder).

   Was diese Funktion NICHT tut:
   - Sie erfindet keine Orte. Empfohlen wird immer ein Hotspot oder Gewässer,
     das in den Daten steht – mit dessen echtem Namen.
   - Sie empfiehlt nie eine geschonte Art oder eine Sperrzone.
   - Sie verschweigt nicht, worauf sie keine Antwort hat. Fehlende Signale
     (kein Netz, kein Standort, kein Pegel) stehen offen in der Ausgabe.

   Die Gewichte stehen offen im Code. Das ist kein Orakel, sondern eine
   nachvollziehbare Vorauswahl – die Entscheidung trifft der Angler. */
import { state } from './state.js';
import { hhmm, inSchonzeit, solunar, sunTimes } from './astro.js';
import { WT_OPT, tackleFor } from './tackle.js';
import { bewerteSpot, sterneAus, sterneText } from './rating.js';
import { jahreszeit } from './saison.js';
import { fischArtenFor, FISH } from './data.js';
/* Geometrie liegt in geo.ts – hier nur re-exportiert, damit bestehende Aufrufer bleiben können. */
export { peilung, himmelsrichtung, winkelDiff, istAuflandig } from './geo.js';
/** Wählt die aussichtsreichste, NICHT geschonte Art eines Spots.
    Arten ohne Schonzeit-/Maßdaten werden bewusst NICHT empfohlen: die Rechtslage ist
    dann unbekannt, und der Maßcheck im Fangbuch sagt für genau diesen Fall „KEINE Freigabe".
    Die App darf sich nicht selbst widersprechen. */
export function zielfischFor(s, wt) {
    const erlaubt = (s.arten || []).filter((a) => {
        const sc = state.SCHON.find((x) => x.fisch === a);
        if (!sc)
            return false; /* keine Daten -> nicht empfehlen */
        return !inSchonzeit(sc);
    });
    const raub = erlaubt.filter((a) => RAUB.includes(a));
    const kandidaten = raub.length ? raub : erlaubt;
    if (!kandidaten.length)
        return null;
    const bewertet = kandidaten.map((art) => {
        const opt = WT_OPT[art];
        let punkte = 1;
        let grund = 'im Bestand und aktuell nicht geschont';
        if (opt && wt != null) {
            if (wt >= opt[0] && wt <= opt[1]) {
                punkte = 3;
                grund = `${Math.round(wt)} °C liegen im Aktivitätsoptimum (${opt[0]}–${opt[1]} °C)`;
            }
            else if (wt < opt[0]) {
                punkte = 0.5;
                grund = `bei ${Math.round(wt)} °C eher träge`;
            }
            else {
                punkte = 0.5;
                grund = `${Math.round(wt)} °C über dem Optimum – tiefe Zonen suchen`;
            }
        }
        return { art, punkte, grund };
    }).sort((a, b) => b.punkte - a.punkte);
    return { art: bewertet[0].art, grund: bewertet[0].grund };
}
/** Bestes Zeitfenster ab jetzt: Major-Solunar vor Minor vor Dämmerung. */
export function startzeitFor(lat, lng, jetzt = new Date()) {
    const fenster = (solunar(lat, lng, jetzt) || [])
        .map((f) => ({ ...f, from: new Date(f.from), to: new Date(f.to) }))
        .filter((f) => f.to.getTime() > jetzt.getTime())
        .sort((a, b) => (a.type === b.type ? a.from - b.from : a.type === 'major' ? -1 : 1));
    if (fenster.length) {
        const f = fenster[0];
        const laeuft = f.from.getTime() <= jetzt.getTime();
        return {
            von: laeuft ? jetzt : f.from,
            bis: f.to,
            label: f.label || (f.type === 'major' ? 'Major-Fenster' : 'Minor-Fenster'),
            grund: laeuft
                ? `Das ${f.type === 'major' ? 'starke Major' : 'Minor'}-Fenster läuft bereits – bis ${hhmm(f.to)}`
                : `${f.type === 'major' ? 'Starkes Major' : 'Minor'}-Fenster ${hhmm(f.from)}–${hhmm(f.to)}`,
        };
    }
    const st = sunTimes(lat, lng, jetzt);
    const abend = st.dusk || st.set;
    return {
        von: abend > jetzt ? abend : st.dawn || st.rise,
        bis: null,
        label: 'Dämmerung',
        grund: 'Kein Solunar-Fenster mehr heute – die Dämmerung bleibt die verlässlichste Beißzeit',
    };
}
const RAUB = ['Zander', 'Hecht', 'Wels', 'Barsch', 'Rapfen', 'Bachforelle', 'Aal'];
/** Alle Paare aus beangelbarem Ort und erlaubter Zielart bewerten. */
export function kandidaten(jetzt = new Date(), filter = {}) {
    const out = [];
    /* Zielfisch: expliziter Planer-Filter schlägt den Kartenfilter; sonst state.fishSel. */
    const fishIds = filter.fisch != null ? filter.fisch : state.fishSel;
    const nurArten = fischArtenFor(fishIds);
    /* Gewässer-Filter (Spot-Namen). Leer = keine Einschränkung. */
    const gew = filter.gewaesser && filter.gewaesser.length ? filter.gewaesser : null;
    state.SPOTS
        .filter((s) => s.cat !== 'sperr' && s.cat !== 'info' && !s.my)
        .filter((s) => !gew || gew.includes(s.name))
        .filter((s) => !nurArten.length || (s.arten || []).some((a) => nurArten.includes(a)))
        .forEach((s) => {
        const orte = (s.hotspots || []).length ? [...s.hotspots] : [null];
        /* Nur Arten mit Schonzeit-/Maßdaten – die Rechtslage muss bekannt sein.
           Bei aktivem Filter zusätzlich auf die gewählten Zielfische eingegrenzt. */
        const arten = (s.arten || [])
            .filter((a) => state.SCHON.some((x) => x.fisch === a))
            .filter((a) => !nurArten.length || nurArten.includes(a));
        orte.forEach((h) => {
            arten.forEach((art) => {
                const b = bewerteSpot(s, art, jetzt, h);
                if (b.geschont)
                    return; /* nie eine geschonte Art empfehlen */
                const faktoren = b.gruende
                    .filter((g) => g.status !== 'unbekannt')
                    .map((g) => ({ text: g.text, punkte: Math.round((g.erreicht - g.moeglich / 2) * 10) / 10 }));
                let p = b.prozent;
                /* Planspezifische Zu-/Abschläge, die eine Spotbewertung nicht kennt. */
                if (s.zugang === 'boot') {
                    p -= 12;
                    faktoren.push({ text: 'Nur vom Boot sinnvoll zu beangeln', punkte: -12 });
                }
                if (s.verif === 'C') {
                    p -= 8;
                    faktoren.push({ text: 'Beleglage dieses Gewässers ist schwach – vorher beim Verein prüfen', punkte: -8 });
                }
                if (RAUB.includes(art)) {
                    p += 3;
                    faktoren.push({ text: art + ' ist ein Raubfisch – dein Schwerpunkt', punkte: 3 });
                }
                /* Kein Entfernungs-/Standortfaktor: alle Gewässer der Region werden gleich bewertet,
                   die Nähe zum Standort fließt bewusst NICHT ins Ranking ein. */
                const lat = h?.lat ?? s.lat;
                const lng = h?.lng ?? s.lng;
                if (typeof lat !== 'number' || typeof lng !== 'number')
                    return;
                /* Deckelung ZULETZT: sonst heben Raubfisch- und Entfernungsbonus die Sturmsperre wieder an. */
                if (b.gesperrt === 'sturm')
                    p = Math.min(p, 15);
                out.push({
                    spot: s, hotspot: h, art, basis: b.prozent, punkte: Math.max(0, Math.min(100, p)),
                    faktoren, gesperrt: b.gesperrt,
                    ort: h ? `${h.name} (${s.name})` : s.name,
                    lat, lng,
                });
            });
        });
    });
    /* Beste zuerst; bei Gleichstand gewinnt der Raubfisch, dann der Name (deterministisch). */
    return out.sort((a, b) => b.punkte - a.punkte
        || (RAUB.includes(b.art) ? 1 : 0) - (RAUB.includes(a.art) ? 1 : 0)
        || a.ort.localeCompare(b.ort));
}
/** Wählt aus der Tackle-Empfehlung den passenden Köder und die Saisonfarbe. */
function koederSatz(s, art) {
    const { t } = tackleFor(s);
    const jz = jahreszeit();
    const farbe = t.farben[jz].split(/[–;(,]/)[0].trim();
    /* Kein Kunstköder-Setup für Fried- und Grundfische. */
    if (art && FRIEDFISCH[art])
        return { koeder: FRIEDFISCH[art], jig: null };
    const groesse = art === 'Barsch' ? '6–8 cm' : art === 'Wels' ? '15–25 cm' : art === 'Hecht' ? '12–19 cm' : '10–14 cm';
    const jigMatch = /(\d+\s*[–-]\s*\d+\s*g|\d+\s*g)/.exec(t.jig);
    const jig = jigMatch ? jigMatch[1].replace(/\s+/g, '') : '10–21g';
    return { koeder: `${groesse.replace(" ", "-")}-Gummifisch (${farbe})`, jig };
}
/** Friedfische bekommen keinen Gummifisch am Jigkopf. */
const FRIEDFISCH = {
    Karpfen: 'Boilie oder Mais am Method-Feeder',
    Schleie: 'Made- oder Maisbündel an feiner Posenmontage',
    Brachse: 'Futterkorb mit Made/Wurm',
    Brasse: 'Futterkorb mit Made/Wurm',
    Barbe: 'Feeder mit Käse oder Tauwurm',
    Döbel: 'Brotflocke oder kleiner Wobbler',
    Rotauge: 'Made an feiner Pose',
    Aal: 'Tauwurmbündel am Grund',
};
/** Pro Ort nur den stärksten Kandidaten behalten – sonst steht dieselbe Stelle
    dreimal in den Alternativen, nur mit anderer Zielart. */
function besteJeOrt(liste) {
    const gesehen = new Set();
    return liste.filter((k) => (gesehen.has(k.ort) ? false : (gesehen.add(k.ort), true)));
}
export function empfehlung(jetzt = new Date(), filter = {}) {
    const liste = kandidaten(jetzt, filter);
    if (!liste.length)
        return null;
    const k = liste[0];
    const zeit = startzeitFor(k.lat, k.lng, jetzt);
    const wt = state.PEGEL?.wt ?? state.WX?.wt ?? null;
    /* Begründung für den Zielfisch aus dem Temperaturprofil. */
    const opt = WT_OPT[k.art];
    let grund = 'im Bestand und aktuell nicht geschont';
    if (opt && wt != null) {
        if (wt >= opt[0] && wt <= opt[1])
            grund = `${Math.round(wt)} °C liegen im Aktivitätsoptimum (${opt[0]}–${opt[1]} °C)`;
        else if (wt < opt[0])
            grund = `bei ${Math.round(wt)} °C eher träge, aber die beste offene Option hier`;
        else
            grund = `${Math.round(wt)} °C über dem Optimum – tiefe Zonen suchen`;
    }
    const zf = { art: k.art, grund };
    const { koeder, jig } = koederSatz(k.spot, k.art);
    const luecken = [];
    if (!state.WX)
        luecken.push('Kein Wetter verfügbar (offline?) – Wind und Luftdruck fließen nicht ein.');
    if (!state.PEGEL)
        luecken.push('Kein Pegel/Wassertemperatur in Reichweite – Zielfischwahl beruht nur auf Bestand und Saison.');
    if (k.spot.zugang === 'boot')
        luecken.push('Dieses Gewässer ist praktisch nur vom Boot zu beangeln.');
    if (k.spot.verif === 'C')
        luecken.push('Beleglage schwach: Gastkarte und Zugang vorher beim Verein klären.');
    const schon = state.SCHON.find((x) => x.fisch === k.art);
    const massHinweis = schon ? `${k.art}: ${schon.mm}` : null;
    const zeitText = zeit.bis ? `ab ${hhmm(zeit.von)} Uhr` : `zur ${zeit.label} (ca. ${hhmm(zeit.von)} Uhr)`;
    const ortText = k.hotspot
        ? `an der Stelle „${k.hotspot.name}" (${k.spot.name})`
        : `am ${k.spot.name}`;
    /* Sturm: nicht losschicken. Score und Spotbewertung sperren bereits – die Empfehlung
       tat es bisher nicht und widersprach damit beiden. */
    const sturm = k.gesperrt === 'sturm';
    const satz = sturm
        ? `Heute besser nicht: Sturm (${Math.round(state.WX.wind)} km/h). `
            + `Sobald es abflaut, wäre ${ortText} ${zeitText} der beste Startpunkt – auf ${k.art}.`
        : `Starte ${zeitText} ${ortText} auf ${k.art}`
            + (jig ? ` mit einem ${koeder} am ${jig}-Jigkopf.` : ` mit ${koeder}.`);
    if (sturm)
        luecken.unshift('Sturm ab 35 km/h – Angeln ist heute unverantwortlich (Wellen, Blitzschlag).');
    return {
        satz, massHinweis, kandidat: k, zeit, zielfisch: zf, koeder, jig,
        faktoren: k.faktoren, chance: k.basis, sterne: sterneAus(k.basis, sturm),
        gesperrt: sturm ? 'sturm' : undefined,
        luecken, alternativen: besteJeOrt(liste.filter((x) => x.ort !== k.ort)).slice(0, 3),
    };
}
/* ---------- Darstellung: eigene Planer-Seite mit Fisch- & Gewässerfilter ---------- */
import { byId } from './dom.js';
import { esc } from './util.js';
let letzterKandidat = null;
/* Seiten-lokale Auswahl (verändert NICHT den Kartenfilter). Leer = „alle". */
const planFisch = [];
const planGew = [];
/** Beangelbare Gewässer (Spot-Namen) der aktuellen Region, ohne Sperr/Info/eigene. */
function beangelbareGewaesser() {
    return state.SPOTS
        .filter((s) => s.cat !== 'sperr' && s.cat !== 'info' && !s.my && !!s.name)
        .map((s) => s.name)
        .filter((n, i, a) => a.indexOf(n) === i);
}
/** Zielfisch-IDs, die in der Region tatsächlich vorkommen (keine leeren Chips anbieten). */
function regionFischIds() {
    const arten = new Set();
    state.SPOTS
        .filter((s) => s.cat !== 'sperr' && s.cat !== 'info' && !s.my)
        .forEach((s) => (s.arten || []).forEach((a) => arten.add(a)));
    return FISH.filter((f) => f.match.some((m) => arten.has(m))).map((f) => f.id);
}
function mkChip(label, on, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (on ? ' on' : '');
    b.setAttribute('aria-pressed', String(on));
    b.textContent = label;
    b.onclick = onClick;
    return b;
}
function buildPlanFilter() {
    const fishBox = byId('planFishChips');
    if (fishBox) {
        fishBox.innerHTML = '';
        fishBox.appendChild(mkChip('Alle', planFisch.length === 0, () => { planFisch.length = 0; buildPlanFilter(); rerenderPlan(); }));
        regionFischIds().forEach((id) => {
            fishBox.appendChild(mkChip(id, planFisch.includes(id), () => {
                const i = planFisch.indexOf(id);
                if (i >= 0)
                    planFisch.splice(i, 1);
                else
                    planFisch.push(id);
                buildPlanFilter();
                rerenderPlan();
            }));
        });
    }
    const gewBox = byId('planGewChips');
    if (gewBox) {
        gewBox.innerHTML = '';
        gewBox.appendChild(mkChip('Alle Gewässer', planGew.length === 0, () => { planGew.length = 0; buildPlanFilter(); rerenderPlan(); }));
        beangelbareGewaesser().forEach((name) => {
            gewBox.appendChild(mkChip(name, planGew.includes(name), () => {
                const i = planGew.indexOf(name);
                if (i >= 0)
                    planGew.splice(i, 1);
                else
                    planGew.push(name);
                buildPlanFilter();
                rerenderPlan();
            }));
        });
    }
}
function leerText() {
    const teile = [];
    if (planFisch.length)
        teile.push('Zielfisch <b>' + esc(planFisch.join(', ')) + '</b>');
    if (planGew.length)
        teile.push('Gewässer <b>' + esc(planGew.join(', ')) + '</b>');
    const suffix = teile.length ? ' für ' + teile.join(' und ') : '';
    return '<p style="color:var(--muted)">Kein Startpunkt' + suffix + ' empfehlbar – '
        + 'keine passende Kombination, oder die Art ist gerade geschont. Filter oben lösen oder erweitern.</p>';
}
function renderPlanBody(e) {
    const fak = [...e.faktoren].sort((a, b) => b.punkte - a.punkte);
    let h = '';
    if (e.gesperrt === 'sturm')
        h += '<div class="rate-sturm">⚠ Sturm – Angeln ist heute unverantwortlich.</div>';
    h += '<div class="plan-satz">' + esc(e.satz) + '</div>';
    h += '<div class="plan-chance"><span class="plan-sterne">' + sterneText(e.sterne) + '</span>'
        + '<span class="plan-proz">' + e.chance + ' %</span>'
        + '<span class="plan-basis">Chance für ' + esc(e.kandidat.art) + ' an diesem Ort – dieselbe Zahl wie im Popup</span></div>';
    if (e.massHinweis)
        h += '<div class="plan-mass">⚖ ' + esc(e.massHinweis) + '</div>';
    h += '<div class="plan-sec"><h4>Warum dort</h4>'
        + fak.map((f) => '<div class="plan-f ' + (f.punkte >= 0 ? 'pos' : 'neg') + '">'
            + '<span class="pt">' + (f.punkte > 0 ? '+' : '') + f.punkte + '</span>'
            + '<span>' + esc(f.text) + '</span></div>').join('')
        + '</div>';
    h += '<div class="plan-sec"><h4>Warum dann</h4><div style="font-size:12.5px">' + esc(e.zeit.grund) + '</div></div>';
    if (e.zielfisch) {
        h += '<div class="plan-sec"><h4>Warum dieser Fisch</h4><div style="font-size:12.5px">'
            + esc(e.zielfisch.art) + ' – ' + esc(e.zielfisch.grund) + '</div></div>';
    }
    if (e.luecken.length) {
        h += '<div class="plan-sec"><h4>Was ich nicht weiß</h4>'
            + e.luecken.map((l) => '<div class="plan-luecke">' + esc(l) + '</div>').join('')
            + '</div>';
    }
    if (e.alternativen.length) {
        h += '<div class="plan-sec"><h4>Alternativen</h4>'
            + e.alternativen.map((a) => '<div class="plan-alt">' + esc(a.ort) + ' · ' + esc(a.art) + ' <b>' + a.basis + ' %</b></div>').join('')
            + '</div>';
    }
    h += '<div class="verif" style="margin-top:12px">Eine begründete Vorauswahl aus Saison, Wind, Luftdruck, '
        + 'Pegel, Wassertemperatur und deinen Spot-Daten – kein Orakel. Die Gewichte stehen offen im Quelltext. '
        + 'Am Wasser entscheidest du.</div>';
    return h;
}
function goToKandidat() {
    const dlg = byId('planDlg');
    if (dlg)
        dlg.hidden = true;
    if (letzterKandidat && state.map) {
        state.map.flyTo([letzterKandidat.lat, letzterKandidat.lng], 14, { duration: 0.7 });
        const m = letzterKandidat.hotspot
            ? (letzterKandidat.spot.hotMarkers || [])[(letzterKandidat.spot.hotspots || []).indexOf(letzterKandidat.hotspot)]
            : letzterKandidat.spot.marker;
        if (m && typeof m.openPopup === 'function')
            setTimeout(() => m.openPopup(), 750);
    }
}
/** Empfehlung mit den aktuellen Seiten-Filtern neu berechnen und anzeigen. */
function rerenderPlan() {
    const body = byId('planBody');
    const go = byId('planGo');
    if (!body)
        return;
    const e = empfehlung(new Date(), { fisch: planFisch, gewaesser: planGew });
    if (!e) {
        body.innerHTML = leerText();
        letzterKandidat = null;
        if (go)
            go.hidden = true;
        return;
    }
    letzterKandidat = e.kandidat;
    body.innerHTML = renderPlanBody(e);
    if (go) {
        go.hidden = false;
        go.onclick = goToKandidat;
    }
}
export function openPlan() {
    const dlg = byId('planDlg');
    if (!dlg)
        return;
    /* Beim Öffnen die Fisch-Auswahl aus dem Kartenfilter vorbelegen; Gewässer offen (alle). */
    planFisch.length = 0;
    state.fishSel.forEach((id) => planFisch.push(id));
    planGew.length = 0;
    buildPlanFilter();
    rerenderPlan();
    dlg.hidden = false;
    const bodyEl = byId('planBody');
    if (bodyEl)
        bodyEl.scrollTop = 0;
}
const planDlg = byId('planDlg');
if (planDlg) {
    const c = byId('planClose');
    if (c)
        c.onclick = () => { planDlg.hidden = true; };
    planDlg.addEventListener('click', (ev) => { if (ev.target === planDlg)
        planDlg.hidden = true; });
}
