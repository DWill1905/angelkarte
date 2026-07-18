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
import { hhmm, inSchonzeitAt, mondStaerke, solunar, sunTimes } from './astro.js';
import { WT_OPT, wasserTyp } from './tackle.js';
import { istAuflandig } from './geo.js';
import { hotspotAktiv } from './saison.js';
import { wtSchaetzung, wxAt } from './weather.js';
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
  /** Datenbasis 0–1 (bewertet/gesamt) – wie belastbar die Prozentzahl ist. */
  konfidenz: number;
  /** Geschont? Dann ist die Bewertung gesperrt. */
  geschont: boolean;
  /** Kurzhinweis zu Maß/Entnahmefenster. */
  mass?: string;
}

/* ---------- Artprofile: wann ist die Art besonders aktiv? ---------- */

type Licht = 'scheu' | 'sicht';
interface ArtProfil {
  /** Bevorzugte Gewässertypen. */
  wasser: Wasser[];
  /** Monate mit Hochsaison (1–12). */
  hoch: number[];
  /** Beißt vor allem in der Dämmerung/Nacht? */
  daemmerung: boolean;
  /** Strikt nachtaktiv – beißt bei hellem Tageslicht kaum, auch nicht im Solunar-Fenster. */
  nacht?: boolean;
  /** Profitiert von trübem/gefärbtem Wasser und windgetriebener Trübung. */
  truebung?: boolean;
  /** Lichtverhalten: 'scheu' = lichtscheu (Zander), 'sicht' = Sichträuber (Barsch, Forelle …). */
  licht?: Licht;
  /** Geschlossene Schwimmblase (Physoclisti, z. B. Zander/Barsch) → empfindlich gegen abrupte
      Luftdruckwechsel. Salmoniden (Bachforelle, Regenbogenforelle, Äsche) sind Physostomen
      (offener Ductus pneumaticus, Blase per Luftschlucken regelbar) und daher NICHT so gelistet. */
  druckSensibel?: boolean;
  /** Wärmeliebend – mag schwül-bedeckte Tiefdrucklagen (Aal, Wels, Karpfen …). */
  warm?: boolean;
  /** Strömungspräferenz im Fließgewässer: 'liebt' (Barbe, Rapfen …) oder 'meidet' (Karpfen, Schleie …). */
  stroemung?: 'liebt' | 'meidet';
}

/* Quellen: Blinker, simfisch, zanderfang, outdoorverliebt u. a. (Recherche Juli 2026).
   Kernaussagen: Zander lichtscheu → Trübung/Wolken/Welle helfen; Aal/Wels wärmeliebend & nachtaktiv,
   lieben schwül-bedeckte Lagen; Barsch/Forelle/Rapfen/Döbel Sichträuber; Zander/Barsch druckempfindlich. */
const PROFIL: Record<string, ArtProfil> = {
  Hecht:            { wasser: ['see-flach', 'see-tief', 'fluss'], hoch: [3, 4, 5, 9, 10, 11], daemmerung: false, licht: 'sicht' },
  /* Zander gilt auch im Hochwinter (Jan/Feb) als Hochsaison ("Winterzander") – konsistent mit
     dem Winter-Fokus (saison.ts) und dem Winter-Köderrat (tools.ts KB), die beide explizit
     Zander-Taktik für Dez–Feb geben. Die Schonzeit (separat geprüft) sperrt die betroffenen
     Tage ohnehin unabhängig von diesem Saisonwert. */
  Zander:           { wasser: ['fluss', 'kanal', 'see-tief'], hoch: [1, 2, 6, 7, 8, 9, 10, 11, 12], daemmerung: true, truebung: true, licht: 'scheu', druckSensibel: true },
  Barsch:           { wasser: ['see-flach', 'see-tief', 'fluss', 'kanal'], hoch: [5, 8, 9, 10, 11], daemmerung: false, licht: 'sicht', druckSensibel: true },
  Wels:             { wasser: ['fluss', 'see-tief'], hoch: [5, 6, 7, 8, 9], daemmerung: true, truebung: true, nacht: true, warm: true },
  Aal:              { wasser: ['fluss', 'kanal', 'see-flach'], hoch: [5, 6, 7, 8, 9], daemmerung: true, truebung: true, nacht: true, warm: true },
  Rapfen:           { wasser: ['fluss'], hoch: [5, 6, 7, 8], daemmerung: false, licht: 'sicht', stroemung: 'liebt' },
  Bachforelle:      { wasser: ['fluss'], hoch: [4, 5, 6, 9], daemmerung: false, licht: 'sicht', stroemung: 'liebt' },
  Regenbogenforelle:{ wasser: ['fluss', 'see-tief'], hoch: [4, 5, 6, 9, 10], daemmerung: false, licht: 'sicht' },
  Äsche:            { wasser: ['fluss'], hoch: [5, 6, 7, 8], daemmerung: false, licht: 'sicht', stroemung: 'liebt' },
  Karpfen:          { wasser: ['see-flach', 'see-tief', 'kanal'], hoch: [5, 6, 7, 8, 9], daemmerung: false, truebung: true, warm: true, stroemung: 'meidet' },
  Schleie:          { wasser: ['see-flach'], hoch: [5, 6, 7], daemmerung: true, truebung: true, warm: true, stroemung: 'meidet' },
  Brachse:          { wasser: ['see-flach', 'see-tief', 'fluss', 'kanal'], hoch: [5, 6, 7, 8], daemmerung: true, truebung: true, warm: true, stroemung: 'meidet' },
  Barbe:            { wasser: ['fluss'], hoch: [6, 7, 8, 9], daemmerung: false, truebung: true, warm: true, stroemung: 'liebt' },
  Döbel:            { wasser: ['fluss'], hoch: [5, 6, 7, 8, 9], daemmerung: false, licht: 'sicht', stroemung: 'liebt' },
  Rotauge:          { wasser: ['see-flach', 'see-tief', 'fluss', 'kanal'], hoch: [4, 5, 6, 7, 8, 9, 10], daemmerung: false, stroemung: 'meidet' },
  Quappe:           { wasser: ['fluss', 'see-tief'], hoch: [11, 12, 1, 2], daemmerung: true, nacht: true },
  Karausche:        { wasser: ['see-flach'], hoch: [5, 6, 7, 8, 9], daemmerung: false, truebung: true, warm: true, stroemung: 'meidet' },
  Rotfeder:         { wasser: ['see-flach', 'see-tief', 'kanal'], hoch: [5, 6, 7, 8, 9], daemmerung: false, truebung: true, warm: true, stroemung: 'meidet' },
};

/** Zeitprofil einer Art (aus PROFIL) für die art-spezifische Startzeit-Empfehlung im Planer. */
export function artZeitprofil(art: string): { nacht: boolean; daemmerung: boolean } {
  const p = PROFIL[art];
  return { nacht: !!p?.nacht, daemmerung: !!p?.daemmerung };
}

/** Strömungslage des aktuellen Pegels – bevorzugt relativ zum mittleren Abfluss (Q/MQ),
    mit Rückfall auf Pegelstand vs. Regionsschwelle, wenn kein MQ vorliegt. */
export interface StroemLage {
  stark: boolean;       // kräftige/hohe Strömung
  wenig: boolean;       // Niedrigwasser / wenig Zug
  steigt: boolean;      // Strömung nimmt zu
  hoch: boolean;        // Hochwasser (Pegel ≥ Regionsschwelle)
  ratio: number | null; // Q / MQ, falls verfügbar
  text: string;         // kompakt, z. B. „140 % des Mittels, 2100 m³/s" oder „460 cm"
}
export function stroemungsLage(): StroemLage | null {
  const pegel = state.PEGEL;
  if (!pegel) return null;
  const warn = state.REGION?.pegel?.warnAb;
  const hoch = warn != null && pegel.value >= warn;
  const ratio = pegel.abfluss != null && pegel.abflussMittel && pegel.abflussMittel > 0 ? pegel.abfluss / pegel.abflussMittel : null;
  const abflussSteigt = pegel.abflussTrend != null && pegel.abflussTrend > Math.max(20, (pegel.abfluss || 0) * 0.05);
  const levelSteigt = typeof pegel.trend === 'number' && pegel.trend >= 25;
  const steigt = abflussSteigt || levelSteigt;

  let stark: boolean; let wenig: boolean;
  const amtlich = pegel.mqQuelle === 'amtlich';
  if (ratio != null) {
    /* Mit amtlichen Kennwerten sind MNQ/MHQ die richtigen Schwellen – sie sagen für DIESEN
       Pegel, was Nieder- bzw. Hochwasser ist. Ohne sie bleibt die alte 70/150-%-Heuristik. */
    const unterMnq = amtlich && pegel.mnq != null && pegel.abfluss != null && pegel.abfluss <= pegel.mnq;
    const ueberMhq = amtlich && pegel.mhq != null && pegel.abfluss != null && pegel.abfluss >= pegel.mhq;
    stark = hoch || ueberMhq || ratio >= 1.5;
    wenig = !hoch && !ueberMhq && (unterMnq || ratio <= 0.7);
  } else {
    stark = hoch || steigt;            // ohne MQ: grobe Schwelle wie bisher
    wenig = false;
  }
  const qt = pegel.abfluss != null ? `, ${Math.round(pegel.abfluss)} m³/s` : '';
  const bezug = amtlich ? 'von MQ' : 'vom ~Mittel (30 d)';
  const text = ratio != null ? `${Math.round(ratio * 100)} % ${bezug}${qt}` : `${pegel.value} cm${qt}`;
  return { stark, wenig, steigt, hoch, ratio, text };
}

/* ---------- Zeitfenster ---------- */

/** Liegt „jetzt“ oder der kommende Abend in einem Beißfenster? */
function zeitBewertung(lat: number, lng: number, jetzt: Date, daemmerungsfisch: boolean, nachtfisch = false): { punkte: number; text: string; status: Bewertbar; tagsperre?: boolean } {
  const st = sunTimes(lat, lng, jetzt);
  const fenster = (solunar(lat, lng, jetzt) || []).map((f: any) => ({ ...f, from: new Date(f.from), to: new Date(f.to) }));
  const t = jetzt.getTime();

  /* Nachtaktive Arten (Aal, Wels): heller Tag ist tote Zeit – das gilt auch, wenn gerade ein
     Solunar-Fenster läuft. Nur Dämmerung und Nacht zählen. Deshalb VOR der Fensterprüfung. */
  if (nachtfisch && st && st.rise && st.set) {
    const puffer = 75 * 60000; /* Kerntag = ab gut 1 h nach Sonnenaufgang bis gut 1 h vor -untergang */
    const hellerTag = t > st.rise.getTime() + puffer && t < st.set.getTime() - puffer;
    if (hellerTag) {
      return { punkte: 0.1, text: 'Mitten am Tag – nachtaktive Art, jetzt kaum Bisse (Dämmerung/Nacht abwarten)', status: 'nein', tagsperre: true };
    }
    const dusk = (st.dusk || st.set).getTime();
    const dawn = (st.dawn || st.rise).getTime();
    if (t >= dusk || t <= dawn) {
      return { punkte: 0.95, text: 'Nacht – Prime Time für nachtaktive Arten', status: 'ja' };
    }
    /* sonst: Dämmerungsübergang → fällt unten in die Dämmerungs-Logik */
  }

  const laeuft = fenster.find((f: any) => t >= f.from.getTime() && t <= f.to.getTime());
  if (laeuft) {
    const ms = mondStaerke(jetzt.getTime());        /* Neu-/Vollmond verstärkt die Solunar-Fenster */
    const basis = laeuft.type === 'major' ? 1 : 0.7;
    const punkte = Math.max(0.4, Math.min(1, basis * (0.9 + 0.2 * ms)));
    const mondZus = ms > 0.6 ? ' · Neu-/Vollmond verstärkt' : ms < 0.25 ? ' · Halbmond, etwas schwächer' : '';
    return {
      punkte,
      text: `${laeuft.type === 'major' ? 'Starkes Beißfenster' : 'Beißfenster'} läuft gerade (bis ${hhmm(laeuft.to)})${mondZus}`,
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

/** Wassertemperatur-Trend über ~3 Tage. Erwärmung aktiviert (v. a. im Frühjahr / Richtung Optimum),
    ein schneller Kälteeinbruch bremst – besonders wärmeliebende Arten (Wels, Aal, Zander). */
function wtTrendBewertung(art: string, wt: number | null, wtTrend: number | null, p?: ArtProfil): { status: Bewertbar; text: string; erreicht: number; moeglich: number } {
  const G = 1;
  if (wtTrend == null || wt == null) return { status: 'unbekannt', text: 'Wassertemperatur-Trend unbekannt (keine Historie)', erreicht: 0, moeglich: 0 };
  const opt = WT_OPT[art];
  const lbl = `${wtTrend > 0 ? '+' : ''}${wtTrend} °C/3 T`;

  if (wtTrend <= -2.5) {
    return { status: 'nein', text: `Kälteeinbruch (${lbl}) – ${art} fährt den Stoffwechsel runter`, erreicht: p?.warm ? 0.1 : 0.25, moeglich: G };
  }
  if (Math.abs(wtTrend) < 1.5) {
    return { status: 'ja', text: `Wassertemperatur stabil (${lbl})`, erreicht: 0.8, moeglich: G };
  }
  let richtungOptimum: boolean | null = null;
  if (opt) {
    if (wt < opt[0]) richtungOptimum = wtTrend > 0;      // zu kalt → Erwärmung gut
    else if (wt > opt[1]) richtungOptimum = wtTrend < 0; // zu warm → Abkühlung gut
  }
  if (richtungOptimum === true) return { status: 'ja', text: `Wasser bewegt sich Richtung Optimum (${lbl}) – aktiviert ${art}`, erreicht: G, moeglich: G };
  if (richtungOptimum === false) return { status: 'nein', text: `Temperatur entfernt sich vom Optimum (${lbl}) – ${art} wird träge`, erreicht: 0.3, moeglich: G };
  if (wtTrend > 0) return { status: 'ja', text: `Wasser erwärmt sich im Optimum (${lbl}) – Fressphase für ${art}`, erreicht: G, moeglich: G };
  return { status: p?.warm ? 'nein' : 'ja', text: `Leichte Abkühlung (${lbl})${p?.warm ? ` – ${art} reagiert empfindlich` : ''}`, erreicht: p?.warm ? 0.5 : 0.8, moeglich: G };
}

/** Licht- und Bewölkungslage artspezifisch bewerten (nutzt weather_code + Wind + Trübungsprofil).
    Lichtscheue Räuber (Zander) mögen gedämpftes Licht, Sichträuber (Barsch, Forelle …) klareres. */
function lichtBewertung(lat: number, lng: number, jetzt: Date, wx: any, art: string, p?: ArtProfil, trueb?: boolean): { status: Bewertbar; text: string; erreicht: number; moeglich: number } {
  const G = 1.5;
  if (!wx) return { status: 'unbekannt', text: 'Bewölkung/Licht unbekannt (offline?)', erreicht: 0, moeglich: 0 };
  const st = sunTimes(lat, lng, jetzt);
  const t = jetzt.getTime();
  const hell = !!(st && st.rise && st.set && t > st.rise.getTime() && t < st.set.getTime());
  if (!hell) return { status: 'ja', text: 'Dunkelheit – Licht ist kein limitierender Faktor', erreicht: G, moeglich: G };

  /* Trübes Stillwasser wirkt wie Dauerdeckung und überlagert die Oberflächen-Lichtlage:
     ein Plus für lichtscheue/trübungsliebende Räuber, leichte Dämpfung für Sichträuber. */
  if (trueb) {
    if (p?.licht === 'scheu' || p?.truebung) {
      return { status: 'ja', text: `Trübes Wasser wirkt wie Dauerdeckung – ideal für ${art}`, erreicht: G, moeglich: G };
    }
    if (p?.licht === 'sicht') {
      return { status: 'ja', text: `Trübes Wasser – ${art} jagt hier eher über Kontrast/Vibration als auf Sicht`, erreicht: 1, moeglich: G };
    }
    return { status: 'ja', text: `Trübes, deckungsreiches Wasser – neutral für ${art}`, erreicht: 1.1, moeglich: G };
  }

  const code: number | undefined = wx.code;
  const sonnig = code == null || code <= 1;
  const bedeckt = code === 3 || code === 45 || code === 48;
  const regen = code != null && code >= 51 && code <= 82;
  const chop = wx.wind >= 8 && wx.wind < 30;
  const flau = wx.wind < 4;
  const wenigLicht = bedeckt || regen || chop; /* echte Bedingungen, NICHT das Artprofil */

  if (p?.licht === 'scheu') {
    if (wenigLicht) return { status: 'ja', text: `Gedämpftes Licht (bedeckt/Welle/Regen) – ideal für den lichtscheuen ${art}`, erreicht: G, moeglich: G };
    if (sonnig && flau) return { status: 'nein', text: `Grelles Licht auf spiegelglattem Wasser – ${art} ist lichtscheu und steht tief`, erreicht: 0.3, moeglich: G };
    return { status: 'ja', text: `Wechselndes Licht – ${art} jagt, wenn Wolken oder Wellen es brechen`, erreicht: 1, moeglich: G };
  }
  if (p?.licht === 'sicht') {
    if (regen && bedeckt) return { status: 'nein', text: `Trüb und dunkel – der Sichträuber ${art} findet die Beute schlechter`, erreicht: 0.6, moeglich: G };
    if ((sonnig || code === 2) && chop) return { status: 'ja', text: `Gutes Licht mit Kräuselung – perfekt für den Sichträuber ${art}`, erreicht: G, moeglich: G };
    if (sonnig && flau) return { status: 'nein', text: `Spiegelglatt und grell – Sichträuber wie ${art} werden scheu`, erreicht: 0.6, moeglich: G };
    return { status: 'ja', text: `Solides Licht für den Sichträuber ${art}`, erreicht: 1.1, moeglich: G };
  }
  if (p?.warm || p?.truebung) {
    if (bedeckt || regen || chop) return { status: 'ja', text: `Bedeckt, Regen oder Welle – angenehm für ${art}`, erreicht: G, moeglich: G };
    return { status: 'ja', text: `Neutrale Lichtlage für ${art}`, erreicht: 1, moeglich: G };
  }
  return { status: 'ja', text: `Licht spielt für ${art} eine untergeordnete Rolle`, erreicht: 1, moeglich: G };
}

export function bewerteSpot(s: Spot, art: string, jetzt: Date = new Date(), hotspot: Hotspot | null = null): Bewertung {
  const gruende: Grund[] = [];
  const schon = state.SCHON.find((x) => x.fisch === art);
  const geschont = !!schon && inSchonzeitAt(schon, jetzt);
  const mass = schon?.mm;

  if (geschont) {
    return {
      art, prozent: 0, sterne: 0, geschont, mass, gesperrt: 'schonzeit', bewertet: 1, gesamt: 1, konfidenz: 1,
      gruende: [{ status: 'nein', text: `Schonzeit – ${art} darf jetzt nicht entnommen werden`, erreicht: 0, moeglich: 1 }],
    };
  }

  const p = PROFIL[art];
  const wasser = wasserTyp(s);
  const wx = wxAt(jetzt);
  const pegel = state.PEGEL;
  /* Wassertemperatur: gemessen (PEGELONLINE) vor geschätzt (Lufttemperatur-Verlauf).
     Die Schätzung ist klar gekennzeichnet und zählt mit reduziertem Gewicht – sie ist
     besser als „unbekannt", aber kein Messwert. */
  let wt = pegel?.wt ?? wx?.wt ?? null;
  let wtTrend = pegel?.wtTrend ?? null;
  let wtGeschaetzt = false;
  if (wt == null) {
    const est = wtSchaetzung(wasser);
    if (est) { wt = est.wert; wtTrend = est.trend; wtGeschaetzt = true; }
  }
  const monat = jetzt.getMonth() + 1;
  const lat = hotspot?.lat ?? s.lat ?? 51;
  const lng = hotspot?.lng ?? s.lng ?? 10;

  const add = (status: Bewertbar, text: string, erreicht: number, moeglich: number) =>
    gruende.push({ status, text, erreicht, moeglich });

  /* Post-Schonzeit-Hunger (Gewicht 1): frisch aus der Schonzeit fressen viele Arten
     in der Nachlaichphase aggressiv – ~2 Wochen lang ein kleiner Bonus. */
  if (schon && schon.bis) {
    const ende = new Date(jetzt.getFullYear(), schon.bis[0] - 1, schon.bis[1]);
    const tage = Math.floor((jetzt.getTime() - ende.getTime()) / 86400000);
    if (tage >= 0 && tage <= 16) {
      add('ja', `Frisch aus der Schonzeit (seit ${tage} ${tage === 1 ? 'Tag' : 'Tagen'}) – ${art} frisst nach dem Laichen aggressiv`, 1, 1);
    }
  }

  /* 1) Wassertemperatur (Gewicht 2; geschätzt aus Lufttemperatur nur 1.5) */
  const opt = WT_OPT[art];
  const G1 = wtGeschaetzt ? 1.5 : 2;
  const f1 = G1 / 2;
  const wtLbl = wtGeschaetzt ? `≈ ${Math.round(wt!)} °C (geschätzt aus Lufttemperatur)` : `${Math.round(wt!)} °C`;
  if (wt == null || !opt) {
    add('unbekannt', wt == null ? 'Wassertemperatur unbekannt (kein Pegel in Reichweite, keine Schätzbasis)' : 'Kein Temperaturprofil für diese Art', 0, 0);
  } else if (wt >= opt[0] && wt <= opt[1]) {
    add('ja', `Wassertemperatur ${wtLbl} liegt im Optimum (${opt[0]}–${opt[1]} °C)`, G1, G1);
  } else if (wt < opt[0]) {
    add('nein', `${wtLbl} – zu kalt, ${art} ist träge`, 0.4 * f1, G1);
  } else {
    add('nein', `${wtLbl} – über dem Optimum, tiefe Zonen suchen`, 0.6 * f1, G1);
  }

  /* 1b) Wassertemperatur-Trend (Gewicht 1; geschätzt nur 0.75) – Erwärmung aktiviert, Kälteeinbruch bremst. */
  {
    const zt = wtTrendBewertung(art, wt, wtTrend, p);
    const ft = wtGeschaetzt ? 0.75 : 1;
    add(zt.status, wtGeschaetzt && zt.status !== 'unbekannt' ? zt.text + ' (aus Lufttemperatur geschätzt)' : zt.text, zt.erreicht * ft, zt.moeglich * ft);
  }

  /* 2) Beißzeit (Gewicht 2) */
  const z = zeitBewertung(lat, lng, jetzt, p?.daemmerung ?? false, p?.nacht ?? false);
  add(z.status, z.text, z.punkte * 2, 2);

  /* 3) Luftdruck (Gewicht 1.5) – artspezifisch: Zander/Barsch (geschlossene Schwimmblase)
     reagieren empfindlich auf abrupte Wechsel; wärmeliebende Arten mögen schwüle Tiefdrucklagen. */
  if (!wx || typeof wx.trendVal !== 'number') {
    add('unbekannt', 'Luftdruck unbekannt (offline?)', 0, 0);
  } else if (wx.trendVal <= -1.5) {
    if (p?.warm) add('ja', `Luftdruck fällt (${wx.trendVal.toFixed(1)} hPa/3 h) – schwül vor der Front, top für ${art}`, 1.5, 1.5);
    else if (p?.druckSensibel && wx.trendVal <= -3) add('ja', `Luftdruck fällt schnell (${wx.trendVal.toFixed(1)} hPa/3 h) – ${art} reagiert empfindlich, oft zickig`, 0.9, 1.5);
    else add('ja', `Luftdruck fällt (${wx.trendVal.toFixed(1)} hPa/3 h) – die stärkste Phase`, 1.5, 1.5);
  } else if (wx.trendVal >= 1.5) {
    add('nein', p?.druckSensibel ? `Luftdruck steigt stark – der empfindliche ${art} ist oft zurückhaltend` : 'Luftdruck steigt stark – Fische oft zurückhaltend', p?.druckSensibel ? 0.2 : 0.4, 1.5);
  } else {
    const ap = typeof wx.press === 'number' ? wx.press : null;
    if (ap !== null && ap >= 1025) {
      add('ja', p?.druckSensibel
        ? `Kräftiges Hoch (${Math.round(ap)} hPa), stabil – ideal für den druckempfindlichen ${art}`
        : `Kräftiges Hoch (${Math.round(ap)} hPa) – stabil, aber Fische oft satt und träge`, p?.druckSensibel ? 1.5 : 0.8, 1.5);
    } else if (ap !== null && ap <= 1002) {
      add('ja', `Tiefdrucklage (${Math.round(ap)} hPa) – meist gesteigerte Aktivität`, p?.druckSensibel ? 1.1 : 1.3, 1.5);
    } else {
      add('ja', p?.druckSensibel ? `Luftdruck stabil – ideal für den druckempfindlichen ${art}` : 'Luftdruck stabil – solide Bedingungen', p?.druckSensibel ? 1.5 : 1, 1.5);
    }
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

  /* 4b) Licht & Bewölkung (Gewicht 1.5) – artspezifisch, nutzt den weather_code der Wetter-API. */
  {
    const li = lichtBewertung(lat, lng, jetzt, wx, art, p, s.trueb);
    add(li.status, li.text, li.erreicht, li.moeglich);
  }

  /* 5) Strömung/Wasserstand (Fluss) bzw. Wellenlage (See) – Gewicht 1.5, artspezifisch. */
  const fliess = wasser === 'fluss' || wasser === 'kanal';
  if (fliess) {
    const lage = stroemungsLage();
    if (!lage) {
      add('unbekannt', 'Kein Pegel in Reichweite', 0, 0);
    } else {
      const pref = p?.stroemung;
      const rt = ` (${lage.text})`;
      if (lage.hoch && wasser === 'kanal') {
        add('ja', 'Hochwasser im Hauptstrom – der Kanal ist die ruhige Zuflucht', 1.5, 1.5);
      } else if (lage.hoch && pref !== 'liebt') {
        add('nein', `Hochwasser${rt} – Hauptstrom zu stark, nur Ränder & Buhnenkehrwasser`, pref === 'meidet' ? 0 : 0.4, 1.5);
      } else if (lage.stark && pref === 'liebt') {
        add('ja', `Kräftige Strömung${rt} – ${art} steht genau im Zug`, 1.5, 1.5);
      } else if (lage.stark && pref === 'meidet') {
        add('nein', `Viel Strömung${rt} – ${art} meidet den Zug, sucht ruhige Buchten`, 0.4, 1.5);
      } else if (lage.steigt && !lage.stark) {
        add('nein', `Strömung nimmt zu${rt} – Fische orientieren sich neu`, 0.5, 1.5);
      } else if (lage.wenig && pref === 'liebt') {
        add('nein', `Wenig Zug${rt} – ${art} sucht die letzten Strömungskanten`, 0.5, 1.5);
      } else if (lage.wenig) {
        add('ja', `Niedrigwasser${rt} – Fische stehen konzentriert, ruhige Lage`, 1.2, 1.5);
      } else if (pref === 'liebt') {
        add('ja', `Solide Strömung${rt} – gute Lage für ${art}`, 1.5, 1.5);
      } else {
        add('ja', `Wasserstand gut${rt}, Pegel ${pegel!.station}`, 1.5, 1.5);
      }
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

  /* Tages-Deckel: eine strikt nachtaktive Art (Aal, Wels) bei hellem Tageslicht ist keine
     ehrliche Empfehlung – egal wie gut Saison/Gewässer sind. Analog zum Sturm-Deckel. */
  if (z.tagsperre) prozent = Math.min(prozent, 20);

  /* Konfidenz: Anteil der Faktoren, die überhaupt Daten hatten. */
  const bewertet = gruende.filter((g) => g.status !== 'unbekannt').length;
  const gesamt = gruende.length;
  const konfidenz = gesamt ? bewertet / gesamt : 0;

  /* Ehrlichkeits-Dämpfung: bei dünner Datenlage (< 80 % Abdeckung) die Zahl zur Mitte (50)
     ziehen – zwei gute Signale sind keine 95 %. Harte Deckel (Sturm/Tagsperre) bleiben unberührt. */
  if (!gesperrt && !z.tagsperre && konfidenz < 0.8) {
    const faktor = 0.6 + 0.5 * konfidenz; // 0.8→1.0, 0.5→0.85, 0.3→0.75
    prozent = Math.round(50 + (prozent - 50) * faktor);
  }

  const sterne = moeglich > 0 ? sterneAus(prozent, !!gesperrt) : 0;

  return {
    art, prozent, sterne, gruende, geschont, mass, gesperrt,
    bewertet, gesamt, konfidenz,
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
    /* Nur noch eine Zahl statt Sterne + Prozent nebeneinander fuer denselben Wert -
       dieselbe Dopplung, die anderswo im Code bewusst vermieden wird (siehe Kommentar
       weiter unten zu "keine zwei Prozentwerte fuer dieselbe Sache"). */
    const kopf = `<summary class="rate-kopf">
        <span class="rate-art">${esc(b.art)}</span>
        <span class="rate-proz${b.geschont ? ' zu' : ''}">${b.geschont ? 'geschont' : b.prozent + '\u202F%'}</span>
      </summary>`;
    /* Progressive Disclosure: bekannte Signale zeigen, Qualitäts-Metadaten (fehlende Signale +
       Datenbasis) in EINER gemeinsamen Box bündeln – statt zwei Zeilen direkt untereinander. */
    const bekannt = b.gruende.filter((g) => g.status !== 'unbekannt');
    const fehlt = b.gruende.filter((g) => g.status === 'unbekannt').length;
    const gruende = bekannt.map((g) =>
      `<div class="rate-g ${g.status}"><span class="rate-ik">${IKON[g.status]}</span> ${esc(g.text)}</div>`).join('');
    const meta: string[] = [];
    if (b.bewertet < b.gesamt) meta.push(`Datenbasis ${b.bewertet}/${b.gesamt} Signale${b.konfidenz < 0.8 ? ' – dünn, Wert zur Mitte gedämpft' : ''}`);
    if (fehlt) meta.push(`${fehlt} Signal${fehlt > 1 ? 'e' : ''} fehlen gerade (offline / kein Pegel / keine Historie)`);
    const mass = b.mass ? `<div class="rate-mass">⚖ ${esc(b.mass)}</div>` : '';
    const unklar = meta.length
      ? `<div class="rate-hinweis${b.konfidenz < 0.8 ? ' warn' : ''}"><span class="ik">i</span> ${meta.join(' · ')}.</div>`
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
      <div class="verif"><span class="ik">i</span> <span>Modellwert aus Wassertemperatur, Beißzeit, Luftdruck, Wind, Wasserstand,
        Gewässertyp und Jahreszeit – <b>keine Fangwahrscheinlichkeit</b>. Ohne Messstation wird die Wassertemperatur
        aus dem Lufttemperatur-Verlauf geschätzt (±2 °C) und schwächer gewichtet. Die Gewichte stehen offen im Quelltext.</span></div>
    </div>
  </details>`;
}
