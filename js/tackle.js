/* Tackle-Empfehlung pro Gewässer.

   Zwei Quellen:
   1. Kuratiert – `spot.tackle` ist gesetzt (Erfahrungswerte, im Popup als solche gekennzeichnet).
   2. Abgeleitet – aus Gewässercharakter (Fluss/Kanal/flacher oder tiefer See), Zielfischen,
      Zugang und ggf. Tiefe. Transparent, weil die Regeln hier offen im Code stehen.

   Wichtig: Das sind Erfahrungs- und Faustwerte, keine Rechtsangaben. Vorfach- und
   Zugangsempfehlungen folgen aus dem Bestand (Hecht ⇒ Stahl) und der Gewässerform. */
import { jahreszeit } from './saison.js';
import { esc, ICON } from './util.js';
/* ---------- Gewässercharakter ---------- */
/** Leitet den Gewässercharakter ab, wenn er nicht gesetzt ist. */
export function wasserTyp(s) {
    if (s.wasser)
        return s.wasser;
    if (s.cat === 'fluss' || s.cat === 'forelle' || Array.isArray(s.line))
        return 'fluss';
    const txt = ((s.name || '') + ' ' + (s.nr || '') + ' ' + (s.methode || '')).toLowerCase();
    if (/kanal|hafen|abstiegs|zollelbe/.test(txt))
        return 'kanal';
    if (typeof s.tiefe === 'number')
        return s.tiefe >= 8 ? 'see-tief' : 'see-flach';
    if (/tief|kante|\b1[0-9] ?m|\b2[0-9] ?m/.test(txt))
        return 'see-tief';
    return 'see-flach';
}
/** Fließt das Gewässer? (ersetzt die alte, regionsweite Rhein-Erkennung) */
export function istFliess(s) {
    const w = wasserTyp(s);
    return w === 'fluss' || w === 'kanal';
}
/** Aktivitätsoptima in °C – EINE Quelle für die ganze App (Popup-Hinweis und Empfehlung).
    Hecht ist bewusst weit nach unten offen: er ist der klassische Kaltwasser-Räuber
    und beißt zuverlässig, wenn Zander längst träge ist. */
export const WT_OPT = {
    Hecht: [4, 18],
    Zander: [10, 22],
    Barsch: [8, 22],
    Wels: [18, 26],
    Aal: [14, 24],
    Rapfen: [14, 24],
    Karpfen: [18, 26],
    Schleie: [18, 26],
    Bachforelle: [6, 16],
    Regenbogenforelle: [6, 16],
    Äsche: [6, 16],
    Barbe: [14, 22],
    Döbel: [12, 22],
    Quappe: [1, 8],
    Brachse: [16, 24],
    Rotauge: [14, 22],
    Rotfeder: [16, 24],
    Karausche: [16, 26],
};
const PROFILE = {
    Hecht: { rutePlus: 3, koeder: 'Gummi 12–19 cm, Swimbaits bis 25 cm, große Spinner/Blinker', stahl: true },
    Wels: { rutePlus: 4, koeder: 'Große Gummis 15–25 cm, Tauwurmbündel, toter Köderfisch', stahl: true },
    Zander: { rutePlus: 2, koeder: 'Gummi 10–14 cm (No-Action-Shad), toter Köderfisch (Grundel)', stahl: false },
    Barsch: { rutePlus: 1, koeder: 'Gummi 5–8 cm, kleine Spinner, DropShot-Köder', stahl: false },
    Rapfen: { rutePlus: 2, koeder: 'Schlanke Blinker 15–25 g, Streamer, kleine Wobbler', stahl: false },
    Aal: { rutePlus: 2, koeder: 'Tauwurm, Köderfischfetzen (Grundgrundmontage)', stahl: false },
    Karpfen: { rutePlus: 2, koeder: 'Boilies, Mais, Method-Feeder', stahl: false },
    Schleie: { rutePlus: 1, koeder: 'Made, Mais, kleine Boilies', stahl: false },
    Bachforelle: { rutePlus: 0, koeder: 'Kleine Spinner 2–5 g, Wobbler bis 5 cm, Naturköder', stahl: false },
    Barbe: { rutePlus: 2, koeder: 'Feeder mit Käse/Mais, Tauwurm', stahl: false },
    Döbel: { rutePlus: 1, koeder: 'Kleine Wobbler, Brot, Insekten', stahl: false },
};
/** Wurfgewichtsklasse aus Zielfischen und Gewässer. */
function ruteAus(arten, w) {
    /* Ohne Artangaben keine Empfehlung erfinden – der Aufrufer fängt das ab. */
    if (!arten.length)
        return 'Ohne Zielfischangabe nicht ableitbar';
    const bedarf = Math.max(0, ...arten.map((a) => PROFILE[a]?.rutePlus ?? 1));
    const fliess = w === 'fluss' || w === 'kanal';
    if (bedarf >= 4)
        return fliess ? 'Kräftige Spinn-/Baitcastrute 40–100 g, 2,40–2,70 m' : 'Baitcast-/H-Rute 50–120 g für schwere Köder';
    if (bedarf >= 3)
        return fliess ? 'H-Spinnrute 30–80 g, 2,70 m (Strömung + Wurfweite)' : 'H-Spinnrute 40–80 g, 2,40–2,70 m';
    if (bedarf >= 2)
        return fliess ? 'Jigrute 20–60 g, 2,70 m (Grundkontakt in der Strömung)' : 'Spinnrute 15–50 g, 2,40 m';
    if (bedarf >= 1)
        return fliess ? 'Leichte Spinnrute 5–25 g' : 'Barsch-/Finesse-Rute 5–21 g';
    return 'UL-Rute bis 10 g oder Fliegenrute #4–5';
}
/** Jigkopf-Spanne. Fließgewässer: pegelabhängig, deshalb Spanne + Faustregel. */
function jigAus(w, tiefe) {
    switch (w) {
        case 'fluss': return '10–30 g (Buhnenfeld 10–21 g, Hauptstrom 21–40 g) – leichtester Kopf mit Grundkontakt in 5–8 s';
        case 'kanal': return '7–15 g – ruhigeres Wasser, feiner anfüttern';
        case 'see-tief': return (tiefe && tiefe >= 15 ? '14–28 g' : '10–21 g') + ' an den Kanten, vertikal 15–30 g';
        default: return '5–12 g – flach und langsam führen, Krautkanten abklopfen';
    }
}
/** Vorfach: Stahl/Titan sobald Hecht oder Wels im Bestand sind. */
function vorfachAus(arten) {
    const raubZahn = arten.some((a) => PROFILE[a]?.stahl);
    if (raubZahn)
        return 'Titan oder 7×7-Stahl, 30–40 cm – Pflicht, sobald Hecht/Wels im Gewässer sind';
    if (arten.includes('Zander'))
        return 'Fluorocarbon 0,35–0,45 mm, 60–80 cm (kein Stahl nötig, aber Hechtbeifang möglich)';
    return 'Fluorocarbon 0,20–0,30 mm';
}
/** Boot- oder Uferempfehlung, begründet statt behauptet. */
function zugangAus(s, w) {
    if (s.zugang === 'boot') {
        return 'Boot klar im Vorteil – die fängigen Kanten und Tiefen sind vom Ufer nicht erreichbar' +
            (w === 'see-tief' ? '. Echolot lohnt sich, Driftsack für kontrollierte Drift.' : '.');
    }
    if (w === 'fluss')
        return 'Vom Ufer gut zu beangeln – Strecke machen und jede Buhne/Kante gründlich abfischen, statt an einer Stelle zu verharren.';
    if (w === 'kanal')
        return 'Vom Ufer: Kanten und Spundwände senkrecht abklopfen (Vertikal/DropShot).';
    return 'Vom Ufer beangelbar – Krautkanten, Einläufe und Stege ansteuern; ein Belly-Boat erweitert den Radius deutlich.';
}
/** Saisonale Farbwahl, abhängig von der typischen Wassertrübung. */
function farbenAus(w, trueb) {
    const fluss = w === 'fluss' || w === 'kanal';
    const truebe = fluss || !!trueb;
    if (truebe) {
        return {
            fruehjahr: 'Grelle Signalfarben (Firetiger, Chartreuse) – kaltes, trübes Wasser',
            sommer: fluss
                ? 'Grün/Weiß, Grundeldekore – die Hauptbeute ist grundelbraun gemustert'
                : 'Schockfarben (Firetiger, Weiß, Pink); große Schaufelschwänze für die Druckwelle',
            herbst: 'Weiß, Perlmutt, UV-Akzente – kürzeres Licht, Räuber jagen auf Sicht',
            winter: 'Dunkle Silhouette (Schwarz, Motoroil) – stärkster Kontrast gegen das Oberlicht',
        };
    }
    return {
        fruehjahr: 'Natürlich mit Kontrastpunkt (Barschdekor, roter Kopf) – klares Wasser nach der Eiszeit',
        sommer: 'Naturdekore (Rotauge, Barsch, Ukelei), Green Pumpkin/Motoroil – lautlos, keine Rasseln',
        herbst: 'Gedeckte Naturtöne mit dezentem Akzent – Sicht nimmt ab, aber im Klaren kein Grellton',
        winter: 'Klarwasser: dezente Naturtöne, kleine Köder, sehr langsam',
    };
}
/** Aktuelle Jahreszeit. Re-Export der EINEN Implementierung aus saison.ts –
    zwei Kopien derselben Logik sind eine Fehlerquelle (siehe WT_OPT). */
export const saison = jahreszeit;
/** Erzeugt die Tackle-Empfehlung: kuratiert, sonst abgeleitet. */
export function tackleFor(s) {
    if (s.tackle)
        return { t: s.tackle, kuratiert: true };
    const w = wasserTyp(s);
    const arten = s.arten || [];
    return {
        kuratiert: false,
        t: {
            rute: ruteAus(arten, w),
            koeder: arten.map((a) => PROFILE[a]?.koeder).filter(Boolean)[0]
                || 'Nach Zielfisch wählen – siehe Köderberater im Werkzeuge-Menü',
            jig: jigAus(w, s.tiefe),
            vorfach: vorfachAus(arten),
            zugang: zugangAus(s, w),
            farben: farbenAus(w, s.trueb),
        },
    };
}
/** Arten, die primär mit Kunstködern (Spinn-/Fliegenfischen) befischt werden.
    Alle übrigen gelten als Naturköder-/Grundfische – damit im Popup nicht Spinnrute + Boilie steht. */
const KUNST = new Set(['Hecht', 'Zander', 'Barsch', 'Wels', 'Rapfen', 'Bachforelle', 'Regenbogenforelle', 'Äsche', 'Döbel']);
function naturRuteAus(arten) {
    if (arten.includes('Karpfen'))
        return 'Karpfen-/Grundrute 2,75–3,60 m, ~3 lbs, Freilaufrolle';
    if (arten.includes('Barbe'))
        return 'Feederrute 90–150 g für die Strömung, ~3,60 m';
    if (arten.includes('Aal'))
        return 'Robuste Grund-/Aalrute, Freilaufrolle, Kopflampe';
    return 'Feeder-/Matchrute 20–60 g, feine Montage';
}
function koederVon(arten) {
    return arten.map((a) => PROFILE[a]?.koeder).filter(Boolean)[0]
        || 'Nach Zielfisch wählen – siehe Köderberater im Werkzeuge-Menü';
}
/** Rendert den Tackle-Block fürs Popup. */
export function tackleHtml(s) {
    if (s.cat === 'sperr' || s.cat === 'info')
        return '';
    /* Ohne Artangaben ist jede Ableitung Raterei – ein eigener Spot bekam hier früher
       eine "UL-Rute bis 10 g oder Fliegenrute", weil Math.max(0, ...[]) = 0 ergibt. */
    if (!s.tackle && !(s.arten || []).length) {
        return `<details class="tackle">
      <summary>${ICON('fish')} Tackle für dieses Gewässer</summary>
      <div class="tackle-body">
        <div class="pop-row">Für diesen Spot sind keine Zielfischarten hinterlegt – daraus lässt sich
          kein Gerät ableiten. Trage die Arten ein oder nutze den Köderberater im Werkzeuge-Menü.</div>
      </div>
    </details>`;
    }
    const jetzt = saison();
    const w = wasserTyp(s);
    const LABEL = { fruehjahr: 'Frühjahr', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter' };
    const SDOT = { fruehjahr: '#6fae6f', sommer: '#e8b93c', herbst: '#d98a3d', winter: '#6ea8c4' };
    const row = (k, v) => `<div class="tk-row"><span class="k">${k}</span><span>${esc(v)}</span></div>`;
    const farbBlock = (farben) => {
        const zeilen = Object.keys(LABEL).map((k) => {
            const akt = k === jetzt;
            return `<div class="${akt ? 'akt' : 'inakt'}"><span class="dot" style="background:${SDOT[k]}"></span><b>${LABEL[k]}:</b> ${esc(farben[k])}</div>`;
        }).join('');
        return `<div class="tk-free"><b>Köderfarben nach Saison</b><div class="tk-farb">${zeilen}</div></div>`;
    };
    let inner = '';
    if (s.tackle) {
        const t = s.tackle;
        inner = row('Rute', t.rute) + row('Köder', t.koeder) + row('Jigkopf', t.jig) + row('Vorfach', t.vorfach)
            + farbBlock(farbenAus(w, s.trueb))
            + `<div class="tk-free"><b>Boot / Ufer</b> ${esc(t.zugang)}</div>`
            + (t.warum ? `<div class="tk-free"><b>Warum</b> ${esc(t.warum)}</div>` : '')
            + '<div class="tk-verif">✎ Kuratiert für dieses Gewässer – Erfahrungswerte, kein Gesetz</div>';
    }
    else {
        const arten = s.arten || [];
        const kunst = arten.filter((a) => KUNST.has(a));
        const natur = arten.filter((a) => !KUNST.has(a));
        if (kunst.length) {
            inner += '<div class="tk-grp"><div class="tk-grp-h">🎣 Raubfisch · Kunstköder / Spinnfischen</div>'
                + row('Rute', ruteAus(kunst, w)) + row('Köder', koederVon(kunst)) + row('Jigkopf', jigAus(w, s.tiefe))
                + row('Vorfach', vorfachAus(kunst)) + farbBlock(farbenAus(w, s.trueb)) + '</div>';
        }
        if (natur.length) {
            inner += '<div class="tk-grp"><div class="tk-grp-h">🪱 Fried-/Grundfisch · Naturköder</div>'
                + row('Rute', naturRuteAus(natur)) + row('Köder', koederVon(natur))
                + row('Montage', 'Grundmontage / Method-Feeder / Haar-Rig je nach Zielfisch')
                + '<div class="tk-free">Farbe ist hier zweitrangig – es entscheiden Futterplatz, Aroma und Präsentation.</div></div>';
        }
        inner += `<div class="tk-free"><b>Boot / Ufer</b> ${esc(zugangAus(s, w))}</div>`
            + '<div class="tk-verif">⚙ Abgeleitet aus Gewässertyp, Zielfischen und Zugang – als Startpunkt gedacht</div>';
    }
    return `<details class="tackle">
    <summary>${ICON('fish')} Tackle für dieses Gewässer</summary>
    <div class="tackle-body">${inner}</div>
  </details>`;
}
