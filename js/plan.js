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
import { WT_OPT, tackleFor, wasserTyp } from './tackle.js';
import { fokusFor, hotspotAktiv, istKante, jahreszeit } from './saison.js';
/* ---------- Hilfsgrößen ---------- */
/** Peilung von a nach b in Grad (0 = Nord, 90 = Ost). */
export function peilung(aLat, aLng, bLat, bLng) {
    const r = Math.PI / 180;
    const dLng = (bLng - aLng) * r;
    const y = Math.sin(dLng) * Math.cos(bLat * r);
    const x = Math.cos(aLat * r) * Math.sin(bLat * r) - Math.sin(aLat * r) * Math.cos(bLat * r) * Math.cos(dLng);
    return (Math.atan2(y, x) / r + 360) % 360;
}
const HIMMEL = ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'];
export function himmelsrichtung(grad) {
    return HIMMEL[Math.round(((grad % 360) / 45)) % 8];
}
/** Kleinste Winkeldifferenz zwischen zwei Peilungen (0–180). */
export function winkelDiff(a, b) {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}
/**
 * Liegt der Punkt am auflandigen Ufer?
 * Wind "aus 225° (SW)" bewegt sich nach 45° (NO) – Plankton und Weißfisch treiben dorthin,
 * Räuber folgen. Ein Hotspot, der vom Gewässerzentrum aus in Windrichtung liegt, ist auflandig.
 */
export function istAuflandig(spot, h, windAusGrad) {
    if (typeof spot.lat !== 'number' || typeof h.lat !== 'number')
        return null;
    /* Identischer Punkt: keine Peilung möglich (Hotspot liegt exakt auf dem Spot-Zentrum). */
    if (spot.lat === h.lat && spot.lng === h.lng)
        return null;
    const windZiel = (windAusGrad + 180) % 360;
    const b = peilung(spot.lat, spot.lng, h.lat, h.lng);
    return winkelDiff(b, windZiel) <= 60;
}
/* ---------- Zielfisch ---------- */
/* Aktivitätsoptima kommen aus tackle.ts – eine einzige Quelle für die ganze App. */
const RAUB = ['Zander', 'Hecht', 'Wels', 'Barsch', 'Rapfen', 'Bachforelle', 'Aal'];
/** Wählt die aussichtsreichste, NICHT geschonte Art eines Spots. */
export function zielfischFor(s, wt) {
    const erlaubt = (s.arten || []).filter((a) => {
        const sc = state.SCHON.find((x) => x.fisch === a);
        return !sc || !inSchonzeit(sc);
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
/** Alle beangelbaren Orte (Gewässer und ihre Hotspots) bewerten. */
export function kandidaten(jetzt = new Date()) {
    const monat = jetzt.getMonth() + 1;
    const f = fokusFor(jahreszeit(jetzt));
    const wx = state.WX;
    const pegel = state.PEGEL;
    const hochwasser = !!(pegel && state.REGION?.pegel && pegel.value >= state.REGION.pegel.warnAb);
    const out = [];
    state.SPOTS.filter((s) => s.cat !== 'sperr' && s.cat !== 'info' && !s.my).forEach((s) => {
        const wasser = wasserTyp(s);
        const orte = (s.hotspots || []).length ? [...s.hotspots] : [null];
        orte.forEach((h) => {
            const faktoren = [];
            let p = 0;
            /* 1) Passt der Ort in diese Jahreszeit?
               Gewässer ohne Hotspot-Daten bekommen einen neutralen Basiswert – sonst würden sie
               systematisch verlieren, obwohl ihnen nur die Detaildaten fehlen (z.B. Häfen, die
               bei Hochwasser die richtige Wahl wären). */
            if (h) {
                if (hotspotAktiv(h, monat)) {
                    p += 2;
                    faktoren.push({ text: `„${h.name}" ist laut Spot-Daten jetzt in Saison (${h.saison})`, punkte: 2 });
                }
                else {
                    p -= 2;
                    faktoren.push({ text: `„${h.name}" ist außerhalb seiner Saison (${h.saison})`, punkte: -2 });
                }
                if (istKante(h) && (f.jahreszeit === 'herbst' || f.jahreszeit === 'winter')) {
                    p += 1.5;
                    faktoren.push({ text: 'Tiefenkante – im Herbst/Winter stehen die Räuber dort', punkte: 1.5 });
                }
            }
            else {
                p += 1; /* neutral: keine Saison-Info, also weder Bonus noch Strafe */
            }
            if (f.bevorzugt.includes(wasser)) {
                p += 1.5;
                faktoren.push({ text: `${f.titel}: ${f.betont}`, punkte: 1.5 });
            }
            /* 2) Wind: auflandiges Ufer bevorzugen */
            if (wx && h && typeof s.lat === 'number') {
                const auf = istAuflandig(s, h, wx.dirDeg);
                if (auf === true && wx.wind >= 6) {
                    p += 1.5;
                    faktoren.push({ text: `Wind aus ${wx.dir} (${Math.round(wx.wind)} km/h) drückt aufs Ufer – Plankton und Weißfisch treiben dorthin`, punkte: 1.5 });
                }
                else if (auf === false && wx.wind >= 12) {
                    p -= 0.5;
                    faktoren.push({ text: `Liegt im Windschatten (Wind aus ${wx.dir})`, punkte: -0.5 });
                }
            }
            /* 3) Luftdruck */
            if (wx && typeof wx.trendVal === 'number') {
                if (wx.trendVal <= -1.5) {
                    p += 1;
                    faktoren.push({ text: `Luftdruck fällt (${wx.trendVal.toFixed(1)} hPa/3 h) – klassisch die beste Phase`, punkte: 1 });
                }
                else if (wx.trendVal >= 1.5) {
                    p -= 0.5;
                    faktoren.push({ text: 'Luftdruck steigt stark – Fische oft zurückhaltend', punkte: -0.5 });
                }
            }
            /* 4) Pegel / Hochwasser (nur Fließgewässer) */
            if (hochwasser) {
                if (wasser === 'kanal') {
                    p += 1.5;
                    faktoren.push({ text: 'Hochwasser im Hauptstrom – Häfen und Kanäle sind jetzt die Zuflucht', punkte: 1.5 });
                }
                else if (wasser === 'fluss') {
                    p -= 3.5;
                    faktoren.push({ text: `Hochwasser (${pegel.value} cm) – Buhnen überspült, Strömung zu stark`, punkte: -3.5 });
                }
            }
            /* 5) Zugang: ohne Boot ist ein Bootssee wenig wert */
            if (s.zugang === 'boot') {
                p -= 1;
                faktoren.push({ text: 'Nur vom Boot sinnvoll zu beangeln', punkte: -1 });
            }
            /* 6) Entfernung, falls Standort bekannt */
            if (state.userPos && typeof s.lat === 'number') {
                const d = haversine(state.userPos[0], state.userPos[1], h?.lat ?? s.lat, h?.lng ?? s.lng);
                if (d <= 10) {
                    p += 1.5;
                    faktoren.push({ text: `nur ${d.toFixed(1)} km von dir entfernt`, punkte: 1.5 });
                }
                else if (d <= 30) {
                    p += 0.5;
                    faktoren.push({ text: `${d.toFixed(0)} km entfernt`, punkte: 0.5 });
                }
                else {
                    p -= 0.5;
                    faktoren.push({ text: `${d.toFixed(0)} km entfernt – lohnt eher als Tagestour`, punkte: -0.5 });
                }
            }
            /* 7) Datenlage ehrlich einpreisen */
            if (s.verif === 'C') {
                p -= 1;
                faktoren.push({ text: 'Beleglage dieses Gewässers ist schwach – vorher beim Verein prüfen', punkte: -1 });
            }
            const lat = h?.lat ?? s.lat;
            const lng = h?.lng ?? s.lng;
            if (typeof lat !== 'number' || typeof lng !== 'number')
                return;
            out.push({
                spot: s, hotspot: h, punkte: p, faktoren,
                ort: h ? `${h.name} (${s.name})` : s.name,
                lat, lng,
            });
        });
    });
    return out.sort((a, b) => b.punkte - a.punkte);
}
/** Wählt aus der Tackle-Empfehlung die passende Ködergröße und Saisonfarbe. */
function koederSatz(s, art) {
    const { t } = tackleFor(s);
    const jz = jahreszeit();
    const farbe = t.farben[jz].split(/[–;(,]/)[0].trim();
    const groesse = art === 'Barsch' ? '6–8 cm' : art === 'Wels' ? '15–25 cm' : art === 'Hecht' ? '12–19 cm' : '10–14 cm';
    /* Jigkopf: erste Gewichtsspanne aus der Tackle-Angabe, z.B. "10–17 g über Kraut, …" -> "10–17 g" */
    const jigMatch = /(\d+\s*[–-]\s*\d+\s*g|\d+\s*g)/.exec(t.jig);
    const jig = jigMatch ? jigMatch[1].replace(/\s+/g, '') : '10–21g';
    return { koeder: `${groesse.replace(" ", "-")}-Gummifisch (${farbe})`, jig };
}
export function empfehlung(jetzt = new Date()) {
    const liste = kandidaten(jetzt);
    if (!liste.length)
        return null;
    const k = liste[0];
    const mitte = state.REGION ? { lat: k.lat, lng: k.lng } : null;
    const zeit = startzeitFor(mitte.lat, mitte.lng, jetzt);
    const wt = state.PEGEL?.wt ?? state.WX?.wt ?? null;
    const zf = zielfischFor(k.spot, wt);
    const { koeder, jig } = koederSatz(k.spot, zf?.art ?? null);
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
    const zeitText = zeit.bis
        ? `ab ${hhmm(zeit.von)} Uhr`
        : `zur ${zeit.label} (ca. ${hhmm(zeit.von)} Uhr)`;
    const ortText = k.hotspot
        ? `an der Stelle „${k.hotspot.name}" (${k.spot.name})`
        : `am ${k.spot.name}`;
    const satz = `Starte ${zeitText} ${ortText}`
        + (zf ? ` auf ${zf.art}` : '')
        + ` mit einem ${koeder} am ${jig}-Jigkopf.`;
    /* Maß/Entnahmefenster des Zielfischs – gehört zwingend zur Empfehlung. */
    let massHinweis = null;
    if (zf) {
        const sc = state.SCHON.find((x) => x.fisch === zf.art);
        if (sc)
            massHinweis = `${zf.art}: ${sc.mm}`;
    }
    return { satz, massHinweis, kandidat: k, zeit, zielfisch: zf, koeder, jig, faktoren: k.faktoren, luecken, alternativen: liste.slice(1, 4) };
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
    let h = '<div class="plan-satz">' + esc(e.satz) + '</div>';
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
            + e.alternativen.map((a) => '<div class="plan-alt">' + esc(a.ort) + '</div>').join('')
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
