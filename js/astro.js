export const NOW = new Date();
export function inWindowAt(d, von, bis) {
    const md = (d.getMonth() + 1) * 100 + d.getDate();
    const v = von[0] * 100 + von[1], b = bis[0] * 100 + bis[1];
    return v <= b ? (md >= v && md <= b) : (md >= v || md <= b);
}
export function inWindow(von, bis) {
    return inWindowAt(new Date(), von, bis);
}
export function inSchonzeit(s) { return !!s.von && inWindow(s.von, s.bis); }
/** Formatiert [monat, tag] als "TT.MM." – NICHT für Date-Objekte (siehe fmtDate). */
export function fmtMD(a) { return String(a[1]).padStart(2, '0') + '.' + String(a[0]).padStart(2, '0') + '.'; }
/** Formatiert ein Date als "TT.MM." */
export function fmtDate(d) { return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.'; }
export function haversine(a, b, c, d) {
    const R = 6371, p = Math.PI / 180;
    const x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
}
/* Sonnenauf-/untergang (vereinfacht, ausreichend genau) */
export function sunTimes(lat, lng, date) {
    /* Kein Math.floor! Es verwirft die Tageszeit und verschiebt die Julianische Tageszahl
       um einen halben Tag – beim Runden auf den naechsten Sonnentag landete man dadurch
       systematisch beim Vortag. Die Uhrzeiten stimmten, das Datum war um 1 Tag zu frueh. */
    const rad = Math.PI / 180, J = date / 864e5 + 2440587.5 - 2451545 + 0.0009 - lng / 360;
    const n = Math.round(J), Js = 2451545 + 0.0009 - lng / 360 + n;
    const M = (357.5291 + 0.98560028 * (Js - 2451545)) % 360;
    const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad);
    const L = (M + C + 180 + 102.9372) % 360;
    const Jt = Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
    const toDate = j => new Date((j - 2440587.5) * 864e5);
    const hourAngle = alt => {
        const cosH = (Math.sin(alt * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
        if (cosH < -1 || cosH > 1)
            return null;
        return Math.acos(cosH) / rad / 360;
    };
    const H = hourAngle(-0.833);
    if (H === null)
        return null;
    const Hd = hourAngle(-6); /* bürgerliche Dämmerung */
    return {
        rise: toDate(Jt - H), set: toDate(Jt + H),
        dawn: Hd !== null ? toDate(Jt - Hd) : null, dusk: Hd !== null ? toDate(Jt + Hd) : null
    };
}
export const hhmm = d => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
export function mondPhase(d) {
    const syn = 29.53058867, ref = Date.UTC(2000, 0, 6, 18, 14);
    let age = ((d - ref) / 864e5) % syn;
    if (age < 0)
        age += syn;
    return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][Math.round(age / syn * 8) % 8];
}
/** Solunar-Stärke aus der Mondphase: 1 an Neu-/Vollmond, 0 an den Vierteln (Spring/Nipp-Prinzip). */
export function mondStaerke(d) {
    const syn = 29.53058867, ref = Date.UTC(2000, 0, 6, 18, 14);
    let age = ((d - ref) / 864e5) % syn;
    if (age < 0)
        age += syn;
    const halb = syn / 2; /* Neu- und Vollmond liegen halbe Periode auseinander */
    const r = age % halb; /* 0 an Neu/Voll */
    const dist = Math.min(r, halb - r); /* 0 an Neu/Voll, ~7.38 an den Vierteln */
    return Math.max(0, Math.min(1, 1 - dist / (halb / 2)));
}
/* Vereinfachte Mondkulmination (Transit) & Gegen-Transit für Solunar-Fenster */
/** Mond-Transit (Kulmination). Hängt nur von der geografischen Länge ab –
    `_lat` bleibt nur der Symmetrie zu sunTimes(lat, lng, date) wegen erhalten. */
export function moonTimes(_lat, lng, date) {
    const rad = Math.PI / 180;
    const d = (date - Date.UTC(2000, 0, 1, 12)) / 864e5; /* Tage seit J2000 */
    /* Mondlänge (vereinfachte Meeus-Näherung, für Transit-Zeitpunkt ausreichend) */
    const L = (218.316 + 13.176396 * d) % 360;
    const Mm = (134.963 + 13.064993 * d) % 360;
    const lon = L + 6.289 * Math.sin(Mm * rad);
    /* Rektaszension grob aus ekliptikaler Länge */
    const ra = Math.atan2(Math.sin(lon * rad) * Math.cos(23.44 * rad), Math.cos(lon * rad)) / rad;
    /* Lokale Sternzeit -> Transit, wenn Stundenwinkel 0 */
    let gmst = (280.16 + 360.9856235 * d) % 360;
    let transitDeg = (ra - gmst + lng);
    transitDeg = ((transitDeg % 360) + 360) % 360;
    const transitH = transitDeg / 15.0; /* Stunden UT */
    const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const up = new Date(base.getTime() + transitH * 3600e3);
    const down = new Date(up.getTime() + (12 * 3600e3 + 25 * 60e3)); /* Gegen-Transit ~12h25m später */
    return { transit: up, antitransit: down };
}
export function solunar(lat, lng, date) {
    const st = sunTimes(lat, lng, date), mt = moonTimes(lat, lng, date);
    const win = [];
    const add = (center, type, label) => {
        if (!center || isNaN(center))
            return;
        /* auf heutigen Tag normalisieren (±1 Tag Versatz möglich) */
        let c = new Date(center);
        while (c.getDate() !== date.getDate() && Math.abs(c.getTime() - date.getTime()) > 18 * 3600e3) {
            c = new Date(c.getTime() + (c < date ? 864e5 : -864e5));
        }
        const span = type === 'major' ? 60 : 45; /* Minuten je Seite */
        win.push({ from: new Date(c.getTime() - span * 60e3), to: new Date(c.getTime() + span * 60e3), type, label });
    };
    if (mt) {
        add(mt.transit, 'major', 'Mond-Höchststand');
        add(mt.antitransit, 'major', 'Mond-Tiefststand');
    }
    if (st) {
        add(st.rise, 'minor', 'Sonnenaufgang');
        add(st.set, 'minor', 'Sonnenuntergang');
    }
    if (st && st.dusk)
        add(new Date(st.dusk.getTime() + 20 * 60e3), 'major', 'Blaue Stunde (Raubfisch-Prime)');
    if (st && st.dawn)
        add(new Date(st.dawn.getTime() - 20 * 60e3), 'minor', 'Morgendämmerung');
    win.sort((a, b) => a.from - b.from);
    return win;
}
export function masseAus(mm) {
    const f = String(mm).match(/(\d+)\s*[–-]\s*(\d+)\s*cm/);
    if (f)
        return { min: +f[1], max: +f[2] };
    const m = String(mm).match(/(\d+)\s*cm/);
    return { min: m ? +m[1] : null, max: null };
}
export function daysUntilMD(md) {
    if (!md)
        return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let t = new Date(now.getFullYear(), md[0] - 1, md[1]);
    if (t < now)
        t = new Date(now.getFullYear() + 1, md[0] - 1, md[1]);
    return Math.round((t.getTime() - now.getTime()) / 86400000);
}
