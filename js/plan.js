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
import { hhmm, inSchonzeit, solunar, sunTimes, haversine } from './astro.js';
import { WT_OPT, tackleFor } from './tackle.js';
import { bewerteSpot, sterneAus, sterneText } from './rating.js';
import { jahreszeit } from './saison.js';
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
export function kandidaten(jetzt = new Date()) {
    const out = [];
    state.SPOTS.filter((s) => s.cat !== 'sperr' && s.cat !== 'info' && !s.my).forEach((s) => {
        const orte = (s.hotspots || []).length ? [...s.hotspots] : [null];
        /* Nur Arten mit Schonzeit-/Maßdaten – die Rechtslage muss bekannt sein. */
        const arten = (s.arten || []).filter((a) => state.SCHON.some((x) => x.fisch === a));
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
                if (state.userPos && typeof s.lat === 'number') {
                    const d = haversine(state.userPos[0], state.userPos[1], h?.lat ?? s.lat, h?.lng ?? s.lng);
                    if (d <= 10) {
                        p += 8;
                        faktoren.push({ text: `nur ${d.toFixed(1)} km von dir entfernt`, punkte: 8 });
                    }
                    else if (d <= 30) {
                        p += 3;
                        faktoren.push({ text: `${d.toFixed(0)} km entfernt`, punkte: 3 });
                    }
                    else {
                        p -= 5;
                        faktoren.push({ text: `${d.toFixed(0)} km entfernt – lohnt eher als Tagestour`, punkte: -5 });
                    }
                }
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
export function empfehlung(jetzt = new Date()) {
    const liste = kandidaten(jetzt);
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
    if (!state.userPos)
        luecken.push('Kein Standort freigegeben – die Entfernung wurde nicht berücksichtigt.');
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
/* ---------- Darstellung ---------- */
import { byId } from './dom.js';
import { esc } from './util.js';
let letzterKandidat = null;
export function openPlan() {
    const dlg = byId('planDlg');
    const body = byId('planBody');
    const go = byId('planGo');
    if (!dlg || !body)
        return;
    dlg.hidden = false;
    const e = empfehlung();
    if (!e) {
        body.innerHTML = '<p>Für diese Region kann ich gerade keinen Startpunkt empfehlen – '
            + 'vermutlich sind alle Zielarten geschont oder es fehlen Spot-Daten.</p>';
        if (go)
            go.hidden = true;
        return;
    }
    letzterKandidat = e.kandidat;
    const fak = [...e.faktoren].sort((a, b) => b.punkte - a.punkte);
    let h = '';
    if (e.gesperrt === 'sturm')
        h += '<div class="rate-sturm">⚠ Sturm – Angeln ist heute unverantwortlich.</div>';
    h += '<div class="plan-satz">' + esc(e.satz) + '</div>';
    /* Dieselbe Zahl wie „Chancen heute" im Popup – zwei Werte für dasselbe wären verwirrend. */
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
    body.innerHTML = h;
    if (go) {
        go.hidden = false;
        go.onclick = () => {
            dlg.hidden = true;
            if (letzterKandidat && state.map) {
                state.map.flyTo([letzterKandidat.lat, letzterKandidat.lng], 14, { duration: 0.7 });
                const m = letzterKandidat.hotspot
                    ? (letzterKandidat.spot.hotMarkers || [])[(letzterKandidat.spot.hotspots || []).indexOf(letzterKandidat.hotspot)]
                    : letzterKandidat.spot.marker;
                if (m && typeof m.openPopup === 'function')
                    setTimeout(() => m.openPopup(), 750);
            }
        };
    }
}
const planDlg = byId('planDlg');
if (planDlg) {
    const c = byId('planClose');
    if (c)
        c.onclick = () => { planDlg.hidden = true; };
    planDlg.addEventListener('click', (ev) => { if (ev.target === planDlg)
        planDlg.hidden = true; });
}
