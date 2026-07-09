export const JAHRESZEIT_LABEL = {
    fruehjahr: 'Frühjahr', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter',
};
/** Aktuelle Jahreszeit (meteorologisch). */
export function jahreszeit(d = new Date()) {
    const m = d.getMonth() + 1;
    if (m <= 2 || m === 12)
        return 'winter';
    if (m <= 5)
        return 'fruehjahr';
    if (m <= 8)
        return 'sommer';
    return 'herbst';
}
/* ---------- Monats-Parser für die Saison-Freitexte ---------- */
const MONATE = {
    jan: 1, feb: 2, mär: 3, mar: 3, apr: 4, mai: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dez: 12,
};
const WORT_FENSTER = [
    { id: 'ganzjaehrig', re: /ganzjährig/i, monate: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { id: 'hochsommer', re: /\bhochsommer\b/i, monate: [7, 8] },
    { id: 'fruehjahr', re: /\bfrühjahr\b/i, monate: [3, 4, 5] },
    { id: 'sommer', re: /\bsommer(?:nächte)?\b/i, monate: [6, 7, 8] },
    { id: 'herbst', re: /\bherbst\b/i, monate: [9, 10, 11] },
    { id: 'winter', re: /\bwinter(?:nächte)?\b/i, monate: [12, 1, 2] },
];
/** Startmonat einer Jahreszeit – für Bereiche wie "Juni–Winter". */
const JZ_START = { frühjahr: 3, sommer: 6, herbst: 9, winter: 12 };
const JZ_ENDE = { frühjahr: 5, sommer: 8, herbst: 11, winter: 2 };
/** Trägt alle Monate von `von` bis `bis` ein (auch über den Jahreswechsel). */
function spanne(set, von, bis) {
    let cur = von;
    for (let i = 0; i < 12; i++) {
        set.add(cur);
        if (cur === bis)
            break;
        cur = cur === 12 ? 1 : cur + 1;
    }
}
/** Wandelt einen Saison-Freitext in die Menge der Monate um, in denen der Hotspot zählt. */
export function monateAus(text) {
    if (!text)
        return [];
    const set = new Set();
    /* Monate, die schon durch einen Bereich abgedeckt sind, nicht doppelt einzeln zählen */
    const inBereich = new Set();
    /* Ganze Wörter greifen, damit "Juni–Winter" nicht zu "Jun"–"win" verstümmelt wird. */
    const alsMonat = (w) => MONATE[w.slice(0, 3).toLowerCase()];
    const alsJzStart = (w) => JZ_START[w.toLowerCase()];
    const alsJzEnde = (w) => JZ_ENDE[w.toLowerCase()];
    const mm = /\b([a-zäöü]{3,})\s*[–\-]\s*([a-zäöü]{3,})/gi;
    let m;
    while ((m = mm.exec(text))) {
        const [, a, b] = m;
        const vonM = alsMonat(a), bisM = alsMonat(b);
        /* 1) Monat–Monat, z.B. "Okt–Mär" (auch über den Jahreswechsel) */
        if (vonM && bisM && !alsJzEnde(b)) {
            spanne(inBereich, vonM, bisM);
            continue;
        }
        /* 2) Monat–Jahreszeit, z.B. "Juni–Winter" */
        const bisJz = alsJzEnde(b);
        if (vonM && bisJz) {
            spanne(inBereich, vonM, bisJz);
            continue;
        }
        /* 3) Jahreszeit–Monat, z.B. "Herbst–Mär" */
        const vonJz = alsJzStart(a);
        if (vonJz && bisM)
            spanne(inBereich, vonJz, bisM);
    }
    inBereich.forEach((x) => set.add(x));
    /* 4) Jahreszeit-Wörter (nur, wenn sie nicht Teil eines Bereichs waren) */
    const hatHochsommer = /\bhochsommer\b/i.test(text);
    WORT_FENSTER.forEach(({ id, re, monate }) => {
        const treffer = re.exec(text);
        if (!treffer)
            return;
        /* "Hochsommer" ist spezifischer als "Sommer" – sonst käme Juni fälschlich dazu. */
        if (id === 'sommer' && hatHochsommer)
            return;
        /* Stand das Wort an einem Bindestrich? Dann war es Teil eines Bereichs (z.B. "Juni–Winter"). */
        const davor = text.slice(0, treffer.index);
        const danach = text.slice(treffer.index + treffer[0].length);
        if (/[–-]\s*$/.test(davor) || /^\s*[–-]/.test(danach))
            return;
        monate.forEach((x) => set.add(x));
    });
    /* 5) Einzelne Monatsnamen ("Mai–Okt abends, Aal Jun–Aug" → Jun/Aug sind schon drin) */
    Object.entries(MONATE).forEach(([k, v]) => {
        if (new RegExp('\\b' + k + '[a-zä]*\\b', 'i').test(text))
            set.add(v);
    });
    return [...set].sort((a, b) => a - b);
}
/** Ist der Hotspot im angegebenen Monat relevant? Ohne erkennbare Angabe: immer (nicht wegblenden). */
export function hotspotAktiv(h, monat = new Date().getMonth() + 1) {
    const monate = monateAus(h.saison || '');
    return monate.length === 0 ? true : monate.includes(monat);
}
export function fokusFor(js = jahreszeit()) {
    switch (js) {
        case 'fruehjahr':
            return {
                jahreszeit: js,
                titel: 'Frühjahr – flaches Wasser',
                betont: 'Flache Buchten, Schilfkanten und Einläufe',
                hinweis: 'Flachwasser erwärmt sich zuerst; Hechte stehen laichnah in Buchten und am Schilf. Schilfgürtel lassen sich über den OSM-Layer einblenden.',
                bevorzugt: ['see-flach', 'fluss'],
                schilf: true,
            };
        case 'sommer':
            return {
                jahreszeit: js,
                titel: 'Sommer – Kraut und Sauerstoff',
                betont: 'Flachseen mit Krautzonen, strömende Abschnitte',
                hinweis: 'Über Krautfeldern und an Einläufen steht das sauerstoffreiche Wasser. Krautzonen sind nicht kartierbar – such sie mit Polbrille an flachen Seen.',
                bevorzugt: ['see-flach', 'fluss'],
                schilf: true,
            };
        case 'herbst':
            return {
                jahreszeit: js,
                titel: 'Herbst – Tiefenkanten',
                betont: 'Tiefe Seen, Kanten und Abbrüche',
                hinweis: 'Beutefische ziehen ins Freiwasser, Räuber stehen an den Kanten. Die genaue Kante findest du nur mit Echolot – die App hebt tiefe Gewässer und Kanten-Hotspots hervor.',
                bevorzugt: ['see-tief', 'fluss'],
                schilf: false,
            };
        default:
            return {
                jahreszeit: js,
                titel: 'Winter – Tiefe und Ruhe',
                betont: 'Tiefe Löcher, Häfen und Kanäle',
                hinweis: 'Zander stehen tief und träge; Häfen und Kanäle sind wärmer und windgeschützt. Sehr langsam führen.',
                bevorzugt: ['see-tief', 'kanal'],
                schilf: false,
            };
    }
}
/** Hebt der Fokus diesen Spot hervor? */
export function spotImFokus(s, f = fokusFor()) {
    if (s.cat === 'sperr' || s.cat === 'info')
        return false;
    return !!s.wasser && f.bevorzugt.includes(s.wasser);
}
/** Erkennt Kanten-/Tiefen-Hotspots am Text (fürs Herbst-Highlight). */
export function istKante(h) {
    return /kante|abbruch|tief|loch|rinne|steilufer|scharkante/i.test((h.name || '') + ' ' + (h.tipp || ''));
}
