/* Intelligente Spotbewertung: Wie gut passt HEUTE dieser Spot für DIESE Art?

   Ergebnis: Sterne, Prozentwert und eine Liste nachvollziehbarer Gründe.

   Ehrlichkeitsregeln, die hier hart durchgezogen werden:
   - Der Prozentwert ist ein Modellwert aus offengelegten Faktoren, KEINE Fangwahrscheinlichkeit.
   - Ein Faktor, für den Daten fehlen (kein Wetter, kein Pegel), zählt weder positiv noch
     negativ. Er erscheint als „unbekannt“ und der Prozentwert bezieht sich nur auf die
     bewertbaren Faktoren. So wird aus fehlendem Wissen nie stillschweigend Zustimmung.
   - Ist die Art geschont, gibt es 0 % und einen klaren Hinweis – unabhängig vom Wetter.
   - Die Gewichte stehen offen in diesem Modul. */
import { state } from './state.js';
import { hhmm, inSchonzeit, solunar, sunTimes } from './astro.js';
import { WT_OPT, wasserTyp } from './tackle.js';
import { istAuflandig } from './geo.js';
import { hotspotAktiv } from './saison.js';
import type { Hotspot, Spot, Wasser } from './types';

export type Bewertbar = 'ja' | 'nein' | 'unbekannt';

export interface Grund {
  /** ✔ erfüllt, ✖ nicht erfüllt, – unbekannt */
  status: Bewertbar;
  text: string;
  /** erreichte Punkte / mögliche Punkte */
  erreicht: number;
  moeglich: number;
}

export interface Bewertung {
  art: string;
  /** Sturm o.ä.: Bewertung ist gedeckelt, weil Angeln unverantwortlich wäre. */
  gesperrt?: 'sturm' | 'schonzeit';
  /** 0–100, bezogen auf die bewertbaren Faktoren. */
  prozent: number;
  /** 0–5 */
  sterne: number;
  gruende: Grund[];
  /** Wie viele Faktoren konnten überhaupt bewertet werden? */
  bewertet: number;
  gesamt: number;
  /** Geschont? Dann ist die Bewertung gesperrt. */
  geschont: boolean;
  /** Kurzhinweis zu Maß/Entnahmefenster. */
  mass?: string;
}

/* ---------- Artprofile: wann ist die Art besonders aktiv? ---------- */

interface ArtProfil {
  /** Bevorzugte Gewässertypen. */
  wasser: Wasser[];
  /** Monate mit Hochsaison (1–12). */
  hoch: number[];
  /** Beißt vor allem in der Dämmerung/Nacht? */
  daemmerung: boolean;
  /** Profitiert von trübem Wasser / Wellen? */
  truebung: boolean;
}

const PROFIL: Record<string, ArtProfil> = {
  Hecht: { wasser: ['see-flach', 'see-tief', 'fluss'], hoch: [3, 4, 9, 10, 11], daemmerung: false, truebung: false },
  Zander: { wasser: ['fluss', 'kanal', 'see-tief'], hoch: [6, 7, 8, 9, 10, 11, 12], daemmerung: true, truebung: true },
  Barsch: { wasser: ['see-flach', 'see-tief', 'fluss', 'kanal'], hoch: [8, 9, 10, 11], daemmerung: false, truebung: false },
  Wels: { wasser: ['fluss', 'see-tief'], hoch: [6, 7, 8], daemmerung: true, truebung: true },
  Aal: { wasser: ['fluss', 'kanal', 'see-flach'], hoch: [5, 6, 7, 8], daemmerung: true, truebung: true },
  Rapfen: { wasser: ['fluss'], hoch: [5, 6, 7, 8], daemmerung: false, truebung: false },
  Bachforelle: { wasser: ['fluss'], hoch: [4, 5, 6, 9], daemmerung: false, truebung: false },
  Karpfen: { wasser: ['see-flach', 'see-tief'], hoch: [5, 6, 7, 8, 9], daemmerung: false, truebung: false },
  Schleie: { wasser: ['see-flach'], hoch: [5, 6, 7], daemmerung: false, truebung: false },
  Barbe: { wasser: ['fluss'], hoch: [6, 7, 8, 9], daemmerung: false, truebung: false },
};

/* ---------- Zeitfenster ---------- */

/** Liegt „jetzt“ oder der kommende Abend in einem Beißfenster? */
function zeitBewertung(lat: number, lng: number, jetzt: Date, daemmerungsfisch: boolean): { punkte: number; text: string; status: Bewertbar } {
  const st = sunTimes(lat, lng, jetzt);
  const fenster = (solunar(lat, lng, jetzt) || []).map((f: any) => ({ ...f, from: new Date(f.from), to: new Date(f.to) }));
  const t = jetzt.getTime();

  const laeuft = fenster.find((f: any) => t >= f.from.getTime() && t <= f.to.getTime());
  if (laeuft) {
    return {
      punkte: laeuft.type === 'major' ? 1 : 0.7,
      text: `${laeuft.type === 'major' ? 'Starkes Beißfenster' : 'Beißfenster'} läuft gerade (bis ${hhmm(laeuft.to)})`,
      status: 'ja',
    };
  }

  const kommt = fenster.filter((f: any) => f.from.getTime() > t).sort((a: any, b: any) => a.from - b.from)[0];
  const dusk: Date | undefined = st.dusk || st.set;
  const bisDusk = dusk ? (dusk.getTime() - t) / 3600000 : 99;

  if (daemmerungsfisch && dusk && bisDusk > 0 && bisDusk <= 4) {
    return { punkte: 0.85, text: `Abenddämmerung um ${hhmm(dusk)} – Prime Time für diese Art`, status: 'ja' };
  }
  if (kommt) {
    const std = (kommt.from.getTime() - t) / 3600000;
    if (std <= 3) return { punkte: 0.6, text: `Beißfenster in ${std < 1 ? Math.round(std * 60) + ' min' : std.toFixed(1) + ' h'} (${hhmm(kommt.from)})`, status: 'ja' };
    return { punkte: 0.2, text: `Nächstes Beißfenster erst ${hhmm(kommt.from)}`, status: 'nein' };
  }
  if (dusk && bisDusk > 0 && bisDusk <= 3) {
    return { punkte: 0.6, text: `Abenddämmerung um ${hhmm(dusk)}`, status: 'ja' };
  }
  return { punkte: 0.15, text: 'Aktuell weder Beißfenster noch Dämmerung', status: 'nein' };
}

/* ---------- Die Bewertung ---------- */

export function bewerteSpot(s: Spot, art: string, jetzt: Date = new Date(), hotspot: Hotspot | null = null): Bewertung {
  const gruende: Grund[] = [];
  const schon = state.SCHON.find((x) => x.fisch === art);
  const geschont = !!schon && inSchonzeit(schon);
  const mass = schon?.mm;

  if (geschont) {
    return {
      art, prozent: 0, sterne: 0, geschont, mass, gesperrt: 'schonzeit', bewertet: 1, gesamt: 1,
      gruende: [{ status: 'nein', text: `Schonzeit – ${art} darf jetzt nicht entnommen werden`, erreicht: 0, moeglich: 1 }],
    };
  }

  const p = PROFIL[art];
  const wasser = wasserTyp(s);
  const wx = state.WX;
  const pegel = state.PEGEL;
  const wt = pegel?.wt ?? wx?.wt ?? null;
  const monat = jetzt.getMonth() + 1;
  const lat = hotspot?.lat ?? s.lat ?? 51;
  const lng = hotspot?.lng ?? s.lng ?? 10;

  const add = (status: Bewertbar, text: string, erreicht: number, moeglich: number) =>
    gruende.push({ status, text, erreicht, moeglich });

  /* 1) Wassertemperatur (Gewicht 2) */
  const opt = WT_OPT[art];
  if (wt == null || !opt) {
    add('unbekannt', wt == null ? 'Wassertemperatur unbekannt (kein Pegel in Reichweite)' : 'Kein Temperaturprofil für diese Art', 0, 0);
  } else if (wt >= opt[0] && wt <= opt[1]) {
    add('ja', `Wassertemperatur ${Math.round(wt)} °C liegt im Optimum (${opt[0]}–${opt[1]} °C)`, 2, 2);
  } else if (wt < opt[0]) {
    add('nein', `${Math.round(wt)} °C – zu kalt, ${art} ist träge`, 0.4, 2);
  } else {
    add('nein', `${Math.round(wt)} °C – über dem Optimum, tiefe Zonen suchen`, 0.6, 2);
  }

  /* 2) Beißzeit (Gewicht 2) */
  const z = zeitBewertung(lat, lng, jetzt, p?.daemmerung ?? false);
  add(z.status, z.text, z.punkte * 2, 2);

  /* 3) Luftdruck (Gewicht 1.5) */
  if (!wx || typeof wx.trendVal !== 'number') {
    add('unbekannt', 'Luftdruck unbekannt (offline?)', 0, 0);
  } else if (wx.trendVal <= -1.5) {
    add('ja', `Luftdruck fällt (${wx.trendVal.toFixed(1)} hPa/3 h) – die stärkste Phase`, 1.5, 1.5);
  } else if (wx.trendVal >= 1.5) {
    add('nein', 'Luftdruck steigt stark – Fische oft zurückhaltend', 0.3, 1.5);
  } else {
    add('ja', 'Luftdruck stabil – solide Bedingungen', 1, 1.5);
  }

  /* 4) Wind (Gewicht 1.5) */
  if (!wx) {
    add('unbekannt', 'Wind unbekannt (offline?)', 0, 0);
  } else {
    const auf = hotspot ? istAuflandig(s, hotspot, wx.dirDeg) : null;
    if (wx.wind >= 35) add('nein', `Sturm (${Math.round(wx.wind)} km/h) – gefährlich und meist unfischbar`, 0, 1.5);
    else if (auf === true && wx.wind >= 6) add('ja', `Wind aus ${wx.dir} drückt aufs Ufer – Nahrung treibt heran`, 1.5, 1.5);
    else if (auf === false && wx.wind >= 12) add('nein', `Uferabschnitt liegt im Windschatten (Wind aus ${wx.dir})`, 0.4, 1.5);
    else if (wx.wind >= 8 && wx.wind < 25) add('ja', `Leichte Welle (${Math.round(wx.wind)} km/h) – gut, bricht das Licht`, 1.2, 1.5);
    else if (wx.wind < 4) add('nein', 'Windstille – blankes Wasser, Fische scheu', 0.5, 1.5);
    else add('ja', `Wind ${Math.round(wx.wind)} km/h aus ${wx.dir}`, 1, 1.5);
  }

  /* 5) Wasserstand bzw. Wellenlage (Gewicht 1.5) */
  const fliess = wasser === 'fluss' || wasser === 'kanal';
  if (fliess) {
    if (!pegel) {
      add('unbekannt', 'Kein Pegel in Reichweite', 0, 0);
    } else {
      const warn = state.REGION?.pegel?.warnAb;
      const hoch = warn != null && pegel.value >= warn;
      const steigt = typeof pegel.trend === 'number' && pegel.trend >= 25;
      if (hoch && wasser === 'fluss') add('nein', `Hochwasser (${pegel.value} cm) – Buhnen überspült`, 0, 1.5);
      else if (hoch && wasser === 'kanal') add('ja', `Hochwasser im Hauptstrom – hier ist die Zuflucht`, 1.5, 1.5);
      else if (steigt) add('nein', `Pegel steigt stark (+${pegel.trend} cm/24 h) – Fische orientieren sich neu`, 0.5, 1.5);
      else add('ja', `Wasserstand gut (${pegel.value} cm, Pegel ${pegel.station})`, 1.5, 1.5);
    }
  } else if (!wx) {
    add('unbekannt', 'Keine Wetterdaten für die Wellenlage', 0, 0);
  } else if (wx.wind >= 35) {
    add('nein', `Sturm (${Math.round(wx.wind)} km/h) – hohe Wellen, nicht befahrbar`, 0, 1.5);
  } else if (wx.wind >= 25) {
    add('nein', `Starker Wind (${Math.round(wx.wind)} km/h) – schwer zu fischen`, 0.4, 1.5);
  } else if (wx.wind >= 6) {
    add('ja', 'Leichte Wellen auf dem See – gute Bedingungen', 1.5, 1.5);
  } else {
    add('ja', 'Ruhiger See', 1, 1.5);
  }

  /* 6) Passt der Gewässertyp zur Art? (Gewicht 1) */
  if (!p) {
    add('unbekannt', 'Kein Artprofil hinterlegt', 0, 0);
  } else if (p.wasser.includes(wasser)) {
    add('ja', `${art} passt zu diesem Gewässertyp`, 1, 1);
  } else {
    add('nein', `${art} ist hier untypisch (${wasser})`, 0.2, 1);
  }

  /* 7) Jahreszeit der Art (Gewicht 1.5) */
  if (!p) {
    add('unbekannt', 'Keine Saison-Angabe für diese Art', 0, 0);
  } else if (p.hoch.includes(monat)) {
    add('ja', `${monatName(monat)} ist Hochsaison für ${art}`, 1.5, 1.5);
  } else {
    add('nein', `${monatName(monat)} ist Nebensaison für ${art}`, 0.6, 1.5);
  }

  /* 8) Ist der Hotspot selbst in Saison? (Gewicht 1, nur wenn Hotspot) */
  if (hotspot) {
    if (hotspotAktiv(hotspot, monat)) add('ja', `„${hotspot.name}" ist jetzt in Saison`, 1, 1);
    else add('nein', `„${hotspot.name}" ist außerhalb seiner Saison (${hotspot.saison})`, 0, 1);
  }

  const moeglich = gruende.reduce((n, g) => n + g.moeglich, 0);
  const erreicht = gruende.reduce((n, g) => n + g.erreicht, 0);
  let prozent = moeglich > 0 ? Math.round((erreicht / moeglich) * 100) : 0;

  /* Sturm ist ein Ausschlusskriterium, kein Abzug: bei über 35 km/h wäre Angeln
     unverantwortlich (Wellen, Blitzschlagrisiko, Bootsgefahr). Die Bewertung wird
     gedeckelt, damit nie ein "passt schon" entsteht. */
  let gesperrt: 'sturm' | undefined;
  if (wx && wx.wind >= 35) {
    gesperrt = 'sturm';
    prozent = Math.min(prozent, 15);
  }

  const sterne = moeglich > 0 ? sterneAus(prozent, !!gesperrt) : 0;

  return {
    art, prozent, sterne, gruende, geschont, mass, gesperrt,
    bewertet: gruende.filter((g) => g.status !== 'unbekannt').length,
    gesamt: gruende.length,
  };
}

/** Sterne aus Prozent. Explizite Schwellen statt Division durch 20 –
    sonst landen 71 % und 84 % beide bei vier Sternen und die Skala sagt nichts. */
export function sterneAus(prozent: number, gesperrt = false): number {
  if (gesperrt) return prozent >= 15 ? 1 : 0;
  if (prozent >= 85) return 5;
  if (prozent >= 72) return 4;
  if (prozent >= 58) return 3;
  if (prozent >= 42) return 2;
  return 1;
}

const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
function monatName(m: number): string { return MON[m - 1] || ''; }

/** Bewertet alle sinnvollen Zielarten eines Spots, beste zuerst. */
export function bewerteAlle(s: Spot, jetzt: Date = new Date(), hotspot: Hotspot | null = null): Bewertung[] {
  const RAUB = ['Zander', 'Hecht', 'Wels', 'Barsch', 'Rapfen', 'Bachforelle', 'Aal'];
  const arten = (s.arten || []).filter((a) => PROFIL[a]);
  const sortiert = arten.sort((a, b) => (RAUB.includes(b) ? 1 : 0) - (RAUB.includes(a) ? 1 : 0));
  return sortiert
    .map((a) => bewerteSpot(s, a, jetzt, hotspot))
    .sort((a, b) => (a.geschont ? 1 : 0) - (b.geschont ? 1 : 0) || b.prozent - a.prozent);
}

/** Sterne als Text, z.B. "★★★★☆". */
export function sterneText(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
}

/* ---------- Darstellung im Popup ---------- */
import { esc } from './util.js';

const IKON: Record<Bewertbar, string> = { ja: '✔', nein: '✖', unbekannt: '–' };

/** Rendert den Bewertungsblock: Zielarten mit Sternen, Prozent und Gründen. */
export function ratingHtml(s: Spot, hotspot: Hotspot | null = null): string {
  if (s.cat === 'sperr' || s.cat === 'info') return '';
  const alle = bewerteAlle(s, new Date(), hotspot);
  if (!alle.length) return '';

  const top = alle.slice(0, 4);
  const sturm = top.find((b) => b.gesperrt === 'sturm');

  const zeilen = top.map((b, i) => {
    const offen = i === 0 && !b.geschont;
    const kopf = `<summary class="rate-kopf">
        <span class="rate-art">${esc(b.art)}</span>
        <span class="rate-sterne" aria-label="${b.sterne} von 5 Sternen">${sterneText(b.sterne)}</span>
        <span class="rate-proz${b.geschont ? ' zu' : ''}">${b.geschont ? 'geschont' : b.prozent + ' %'}</span>
      </summary>`;
    const gruende = b.gruende.map((g) =>
      `<div class="rate-g ${g.status}">${IKON[g.status]} ${esc(g.text)}</div>`).join('');
    const mass = b.mass ? `<div class="rate-mass">⚖ ${esc(b.mass)}</div>` : '';
    const unklar = b.bewertet < b.gesamt
      ? `<div class="rate-hinweis">${b.bewertet} von ${b.gesamt} Faktoren konnten bewertet werden – der Prozentwert bezieht sich nur auf diese.</div>`
      : '';
    return `<details class="rate-art-block"${offen ? ' open' : ''}>${kopf}
      <div class="rate-body">${gruende}${mass}${unklar}</div></details>`;
  }).join('');

  /* Offen, nicht zugeklappt: die Fangchance ist die Kernaussage des Popups.
     In der einfachen Sicht blendet CSS die Gruende und die Zweitarten aus. */
  return `<details class="rating" open>
    <summary>${'★'} Chancen heute</summary>
    <div class="rating-body">
      ${sturm ? '<div class="rate-sturm">⚠ Sturm – Angeln ist heute unverantwortlich. Die Bewertung ist gedeckelt.</div>' : ''}
      ${zeilen}
      <div class="verif">Modellwert aus Wassertemperatur, Beißzeit, Luftdruck, Wind, Wasserstand,
        Gewässertyp und Jahreszeit – <b>keine Fangwahrscheinlichkeit</b>. Die Gewichte stehen offen im Quelltext.</div>
    </div>
  </details>`;
}
