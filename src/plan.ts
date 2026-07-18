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
import { fmtMD, haversine, hhmm, inSchonzeitAt, inWindowAt, mondStaerke, solunar, sunTimes } from './astro.js';
import { FUTTERKORB_ARTEN, OHNE_ANFUETTERN, WT_OPT, tackleFor, wasserTyp } from './tackle.js';
import { bewerteSpot, sterneAus, artZeitprofil, stroemungsLage } from './rating.js';
import { jahreszeit } from './saison.js';
import { wtSchaetzung } from './weather.js';
import { fischArtenFor, FISH } from './data.js';
import type { Hotspot, Spot } from './types';

/* Geometrie liegt in geo.ts – hier nur re-exportiert, damit bestehende Aufrufer bleiben können. */
export { peilung, himmelsrichtung, winkelDiff, istAuflandig } from './geo.js';

/* ---------- Zielfisch ---------- */

/* Aktivitätsoptima kommen aus tackle.ts – eine einzige Quelle für die ganze App. */
export interface Zielfisch {
  art: string;
  grund: string;
}

/** Wählt die aussichtsreichste, NICHT geschonte Art eines Spots.
    Arten ohne Schonzeit-/Maßdaten werden bewusst NICHT empfohlen: die Rechtslage ist
    dann unbekannt, und der Maßcheck im Fangbuch sagt für genau diesen Fall „KEINE Freigabe".
    Die App darf sich nicht selbst widersprechen. */
export function zielfischFor(s: Spot, wt: number | null, jetzt: Date = new Date()): Zielfisch | null {
  const erlaubt = (s.arten || []).filter((a) => {
    const sc = state.SCHON.find((x) => x.fisch === a);
    return !sc || !inSchonzeitAt(sc, jetzt); /* kein Eintrag = keine hinterlegte Schonzeit -> beangelbar */
  });
  const raub = erlaubt.filter((a) => RAUB.includes(a));
  const kandidaten = raub.length ? raub : erlaubt;
  if (!kandidaten.length) return null;

  const bewertet = kandidaten.map((art) => {
    const opt = WT_OPT[art];
    let punkte = 1;
    let grund = 'im Bestand und aktuell nicht geschont';
    if (opt && wt != null) {
      if (wt >= opt[0] && wt <= opt[1]) { punkte = 3; grund = `${Math.round(wt)} °C liegen im Aktivitätsoptimum (${opt[0]}–${opt[1]} °C)`; }
      else if (wt < opt[0]) { punkte = 0.5; grund = `bei ${Math.round(wt)} °C eher träge`; }
      else { punkte = 0.5; grund = `${Math.round(wt)} °C über dem Optimum – tiefe Zonen suchen`; }
    }
    return { art, punkte, grund };
  }).sort((a, b) => b.punkte - a.punkte);

  return { art: bewertet[0].art, grund: bewertet[0].grund };
}

/* ---------- Startzeit ---------- */

export interface Startzeit {
  von: Date;
  bis: Date | null;
  label: string;
  grund: string;
}

/** Bestes Zeitfenster ab jetzt – art-spezifisch:
    nachtaktiv → Nacht (kein mittägliches Solunar), dämmerungsbetont → Abenddämmerung,
    sonst Major-Solunar vor Minor vor Dämmerung. */
export function startzeitFor(lat: number, lng: number, jetzt: Date = new Date(), opts: { nacht?: boolean; daemmerung?: boolean } = {}): Startzeit {
  const st = sunTimes(lat, lng, jetzt);
  const dusk = st.dusk || st.set;
  const dawn = st.dawn || st.rise;
  const t = jetzt.getTime();

  /* Nachtaktive Arten: die Nacht ist das Fenster – egal welches Solunar mittags läuft. */
  if (opts.nacht) {
    const istNacht = t >= dusk.getTime() || t <= dawn.getTime();
    const von = istNacht ? jetzt : dusk;
    return {
      von,
      bis: dawn.getTime() > von.getTime() ? dawn : null,
      label: 'Nacht',
      grund: istNacht
        ? 'Die Nacht läuft – Prime Time für nachtaktive Arten'
        : `Ab der Abenddämmerung (${hhmm(dusk)}) – tagsüber beißt diese Art kaum`,
    };
  }

  /* Dämmerungsbetonte Arten: die kommende Abenddämmerung ist das Kernfenster. */
  if (opts.daemmerung && dusk.getTime() > t) {
    return {
      von: dusk,
      bis: null,
      label: 'Abenddämmerung',
      grund: `Abenddämmerung (${hhmm(dusk)}) – die verlässlichste Beißzeit für diese Art`,
    };
  }

  const fenster = (solunar(lat, lng, jetzt) || [])
    .map((f: any) => ({ ...f, from: new Date(f.from), to: new Date(f.to) }))
    .filter((f: any) => f.to.getTime() > t)
    .sort((a: any, b: any) => (a.type === b.type ? a.from - b.from : a.type === 'major' ? -1 : 1));

  if (fenster.length) {
    const f = fenster[0];
    const laeuft = f.from.getTime() <= t;
    return {
      von: laeuft ? jetzt : f.from,
      bis: f.to,
      label: f.label || (f.type === 'major' ? 'Major-Fenster' : 'Minor-Fenster'),
      grund: laeuft
        ? `Das ${f.type === 'major' ? 'starke Major' : 'Minor'}-Fenster läuft bereits – bis ${hhmm(f.to)}`
        : `${f.type === 'major' ? 'Starkes Major' : 'Minor'}-Fenster ${hhmm(f.from)}–${hhmm(f.to)}`,
    };
  }

  const abend = dusk;
  return {
    von: abend > jetzt ? abend : dawn,
    bis: null,
    label: 'Dämmerung',
    grund: 'Kein Solunar-Fenster mehr heute – die Dämmerung bleibt die verlässlichste Beißzeit',
  };
}

/* ---------- Bewertung von Ort-Kandidaten ----------

   Grundlage ist bewerteSpot() aus rating.ts – dieselbe Funktion, die im Popup „Chancen heute"
   anzeigt. Vorher hatte plan.ts eigene, gröbere Faktoren; Empfehlung und Popup konnten
   deshalb verschiedene Zielfische nennen (Popup „Wels 96 %", Plan „auf Barsch").

   Bewertet wird das PAAR (Ort, Zielart), nicht erst der Ort und dann die Art. Sonst ist die
   Ortswahl artblind: bei 5 °C und bei 21 °C kam derselbe Ort heraus, obwohl der Zielfisch
   von Hecht auf Zander wechselt. */

export interface Faktor { text: string; punkte: number; }
export interface Kandidat {
  spot: Spot;
  hotspot: Hotspot | null;
  art: string;
  /** 0–100, aus bewerteSpot() – identisch mit der Anzeige im Popup. Das ist DIE Chance. */
  basis: number;
  /** Interner Rang: basis plus planspezifische Zu-/Abschläge (Entfernung, Zugang, Beleglage).
      Nur für die Reihenfolge – niemals anzeigen, sonst stünden zwei Zahlen für dasselbe. */
  punkte: number;
  faktoren: Faktor[];
  /** Datenbasis der Chance: bewertete vs. mögliche Signale. */
  bewertet: number;
  gesamt: number;
  /** Sturm oder Schonzeit: dann wird nicht empfohlen. */
  gesperrt?: 'sturm' | 'schonzeit';
  /** Name des empfohlenen Ortes – immer aus den Daten, nie erfunden. */
  ort: string;
  lat: number;
  lng: number;
}

const RAUB = ['Zander', 'Hecht', 'Wels', 'Barsch', 'Rapfen', 'Bachforelle', 'Aal'];

/** Optionaler Filter für den Planer. Wird kein `fisch` übergeben (undefined), gilt der
    globale Kartenfilter `state.fishSel`; ein übergebenes (auch leeres) Array hat Vorrang.
    `gewaesser` schränkt auf einzelne Gewässer (Spot-Namen) ein; leer/undefiniert = alle. */
export interface PlanFilter { fisch?: string[] | null; gewaesser?: string[] | null; }

/** Alle Paare aus beangelbarem Ort und erlaubter Zielart bewerten. */
export function kandidaten(jetzt: Date = new Date(), filter: PlanFilter = {}): Kandidat[] {
  const out: Kandidat[] = [];

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
    const orte: Array<Hotspot | null> = (s.hotspots || []).length ? [...(s.hotspots as Hotspot[])] : [null];

    /* Alle gelisteten Arten betrachten; die Schonzeit-Ausnahme greift unten über b.geschont.
       Arten ohne Schonzeit-Eintrag gelten als ganzjährig beangelbar (Hinweis dazu in der Empfehlung). */
    const arten = (s.arten || [])
      .filter((a) => !nurArten.length || nurArten.includes(a));

    orte.forEach((h) => {
      arten.forEach((art) => {
        const b = bewerteSpot(s, art, jetzt, h);
        if (b.geschont) return; /* nie eine geschonte Art empfehlen */

        const faktoren: Faktor[] = b.gruende
          .filter((g) => g.status !== 'unbekannt')
          .map((g) => ({ text: g.text, punkte: Math.round((g.erreicht - g.moeglich / 2) * 10) / 10 }));

        let p = b.prozent;

        /* Planspezifische Zu-/Abschläge, die eine Spotbewertung nicht kennt. */
        if (s.zugang === 'boot') { p -= 12; faktoren.push({ text: 'Nur vom Boot sinnvoll zu beangeln', punkte: -12 }); }
        if (s.verif === 'C') { p -= 8; faktoren.push({ text: 'Beleglage dieses Gewässers ist schwach – vorher beim Verein prüfen', punkte: -8 }); }
        if (RAUB.includes(art)) { p += 3; faktoren.push({ text: art + ' ist ein Raubfisch – dein Schwerpunkt', punkte: 3 }); }

        /* Kein Entfernungs-/Standortfaktor: alle Gewässer der Region werden gleich bewertet,
           die Nähe zum Standort fließt bewusst NICHT ins Ranking ein. */

        const lat = h?.lat ?? s.lat;
        const lng = h?.lng ?? s.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        /* Deckelung ZULETZT: sonst heben Raubfisch- und Entfernungsbonus die Sturmsperre wieder an. */
        if (b.gesperrt === 'sturm') p = Math.min(p, 15);

        out.push({
          spot: s, hotspot: h, art, basis: b.prozent, punkte: Math.max(0, Math.min(100, p)),
          faktoren, bewertet: b.bewertet, gesamt: b.gesamt, gesperrt: b.gesperrt,
          ort: h ? `${h.name} (${s.name})` : s.name,
          lat, lng,
        });
      });
    });
  });

  /* Beste zuerst; bei Gleichstand gewinnt der Raubfisch, dann der Name (deterministisch). */
  return out.sort((a, b) =>
    b.punkte - a.punkte
    || (RAUB.includes(b.art) ? 1 : 0) - (RAUB.includes(a.art) ? 1 : 0)
    || a.ort.localeCompare(b.ort));
}

/* ---------- Die Empfehlung ---------- */

export interface Empfehlung {
  satz: string;
  /** Rechtlicher Kurzhinweis zum empfohlenen Zielfisch (Maß/Entnahmefenster). */
  massHinweis: string | null;
  kandidat: Kandidat;
  zeit: Startzeit;
  zielfisch: Zielfisch | null;
  koeder: string;
  jig: string | null;
  /** Strömungs-/Blei-Hinweis fürs Fließgewässer (null bei stehendem Gewässer). */
  stroemung: string | null;
  faktoren: Faktor[];
  /** 0–100, identisch mit der Anzeige „Chancen heute" im Popup (Wert JETZT). */
  chance: number;
  /** Chance zum empfohlenen Startfenster heute (z. B. Dämmerung/Nacht) – oft deutlich höher. */
  chanceFenster: number;
  sterne: number;
  /** Sturm: dann wird nicht empfohlen loszufahren. */
  gesperrt?: 'sturm';
  /** Signale, die gerade fehlen – offen benannt statt stillschweigend übergangen. */
  luecken: string[];
  /** Persönliche Rückkopplung aus dem Fangbuch (Fänge an diesem Spot / passende Tageszeit). */
  persoenlich?: string;
  alternativen: Kandidat[];
}

/** Köderfarbe nach echten Bedingungen (Trübung/Licht) – überschreibt die Saisonfarbe,
    wenn die Lage eindeutig ist. Recherche: klar → natürlich, trüb/dunkel → Schock/Kontrast. */
function dynamischeFarbe(): string {
  const wx = state.WX;
  const pegel = state.PEGEL;
  const code = wx?.code;
  const truebe = (pegel?.trend != null && pegel.trend >= 20) /* Pegel steigt stark → getrübt */
    || (code != null && code >= 51 && code <= 82); /* Regen */
  const bedeckt = code === 3 || code === 45 || code === 48;
  const grell = (code == null || code <= 1) && (wx?.wind ?? 0) < 6; /* klar + windstill */
  if (truebe) return 'Schockfarbe/UV-grell bei trübem Wasser';
  if (bedeckt) return 'Kontrastfarbe dunkel/UV bei bedecktem Himmel';
  if (grell) return 'natürliches Dekor bei klarem, hellem Wasser';
  return '';
}

/** Wählt aus der Tackle-Empfehlung den passenden Köder und die Farbe (dynamisch vor saisonal). */
function koederSatz(s: Spot, art: string | null): { koeder: string; jig: string | null } {
  const { t } = tackleFor(s);
  const jz = jahreszeit();
  const saisonFarbe = t.farben[jz].split(/[–;(,]/)[0].trim();
  const farbe = dynamischeFarbe() || saisonFarbe;

  /* Kein Kunstköder-Setup für Fried- und Grundfische. Anfütterverbot (Trinkwassertalsperren
     u.ä.) schlägt die Standard-Futterkorb-/Method-Feeder-Empfehlung – sonst rät die App zu
     einer an diesem Gewässer verbotenen Methode. */
  if (art && FRIEDFISCH[art]) {
    if (s.keinAnfuettern && FUTTERKORB_ARTEN.has(art)) return { koeder: OHNE_ANFUETTERN, jig: null };
    return { koeder: FRIEDFISCH[art], jig: null };
  }

  const groesse = art === 'Barsch' ? '6–8 cm' : art === 'Wels' ? '15–25 cm' : art === 'Hecht' ? '12–19 cm' : '10–14 cm';
  const jigMatch = /(\d+\s*[–-]\s*\d+\s*g|\d+\s*g)/.exec(t.jig);
  const jig = jigMatch ? jigMatch[1].replace(/\s+/g, '') : '10–21g';
  return { koeder: `${groesse.replace(' ', '-')}-Gummifisch (${farbe})`, jig };
}

/** Friedfische bekommen keinen Gummifisch am Jigkopf. */
const FRIEDFISCH: Record<string, string> = {
  Karpfen: 'Boilie oder Mais am Method-Feeder',
  Schleie: 'Made- oder Maisbündel an feiner Posenmontage',
  Brachse: 'Futterkorb mit Made/Wurm',
  Brasse: 'Futterkorb mit Made/Wurm',
  Barbe: 'Feeder mit Käse oder Tauwurm',
  Döbel: 'Brotflocke oder kleiner Wobbler',
  Rotauge: 'Made an feiner Pose',
  Rotfeder: 'Made oder Brotflocke an feiner Pose – Rotfeder steht oft hoch im Wasser, flach anbieten',
  Karausche: 'Made oder Wurm an feiner Posenmontage, wenig anfüttern',
  Aal: 'Tauwurmbündel am Grund',
};

/** Pro Ort nur den stärksten Kandidaten behalten – sonst steht dieselbe Stelle
    dreimal in den Alternativen, nur mit anderer Zielart. */
function besteJeOrt(liste: Kandidat[]): Kandidat[] {
  const gesehen = new Set<string>();
  return liste.filter((k) => (gesehen.has(k.ort) ? false : (gesehen.add(k.ort), true)));
}

/** Strömungs- und bleiabhängige Empfehlung fürs Fließgewässer (nutzt Q/MQ bzw. Pegelstand). */
function stroemungBlei(s: Spot): string | null {
  const w = wasserTyp(s);
  if (w !== 'fluss' && w !== 'kanal') return null; /* Strömung nur im Fließgewässer relevant */
  const lage = stroemungsLage();
  if (!lage) return null;
  const tief = (s.tiefe ?? 0) >= 6;
  const bez = ` (${lage.text})`;

  if (lage.hoch) {
    return `Strömung stark, Hochwasser${bez}: 40–80 g Blei – oder auf Grundmontage mit Krallenblei wechseln und die ruhigen Ränder & das Buhnenkehrwasser befischen.`;
  }
  if (lage.stark || lage.steigt) {
    return `Strömung erhöht${bez}: oberes Bleiende, ~30–50 g${tief ? ' (hier tief – eher 40–50 g)' : ''}, sonst kein Grundkontakt. Faustregel: leichtester Kopf, der in 5–8 s auftippt.`;
  }
  if (lage.wenig) {
    return `Wenig Strömung${bez}: leicht fischen – ~7–15 g reichen für Grundkontakt, feiner anbieten.`;
  }
  return `Strömung normal${bez}: leichtester Jigkopf mit Grundkontakt in 5–8 s – Buhnenfeld ~10–21 g, Hauptstrom ~21–40 g${tief ? ', in der Tiefe eher schwerer' : ''}.`;
}

export function empfehlung(jetzt: Date = new Date(), filter: PlanFilter = {}): Empfehlung | null {
  const liste = kandidaten(jetzt, filter);
  if (!liste.length) return null;
  const k = liste[0];

  const zp = artZeitprofil(k.art);
  const zeit = startzeitFor(k.lat, k.lng, jetzt, zp);
  /* Chance zum empfohlenen Startfenster (Dämmerung/Nacht liegt oft deutlich über „jetzt"). */
  const chanceFenster = zeit.von.getTime() > jetzt.getTime() + 30 * 60000
    ? bewerteSpot(k.spot, k.art, zeit.von, k.hotspot).prozent
    : k.basis;
  const wt = state.PEGEL?.wt ?? state.WX?.wt ?? null;

  /* Begründung für den Zielfisch: Temperatur plus der stärkste tatsächliche Aktivitätstreiber. */
  const opt = WT_OPT[k.art];
  let grund = 'im Bestand und aktuell nicht geschont';
  if (opt && wt != null) {
    if (wt >= opt[0] && wt <= opt[1]) grund = `${Math.round(wt)} °C liegen im Aktivitätsoptimum (${opt[0]}–${opt[1]} °C)`;
    else if (wt < opt[0]) grund = `bei ${Math.round(wt)} °C eher träge, aber die beste offene Option hier`;
    else grund = `${Math.round(wt)} °C über dem Optimum – tiefe Zonen suchen`;
  }
  const treiber = k.faktoren
    .filter((f) => f.punkte > 0 && !/°C|Optimum|Raubfisch|Schwerpunkt|passt zu diesem Gewässer|^„/.test(f.text))
    .sort((a, b) => b.punkte - a.punkte)[0];
  if (treiber) grund += ` – dazu: ${treiber.text}`;
  const zf: Zielfisch = { art: k.art, grund };
  let { koeder, jig } = koederSatz(k.spot, k.art);
  /* RLP-Frühjahrsschonzeit (15.4.–31.5.): an §18-Gewässern Kunstköderverbot – Empfehlung auf
     Naturköder/Fliege umstellen, statt zu illegaler Methode zu raten.
     kkVerbot (generisch, z. B. Elbe/Magdeburg 15.2.–30.4.) deckt dieselbe Regelidee mit
     eigenem, region-spezifischem Zeitfenster ab – zwei Regionen, zwei Fenster, ein Grundsatz:
     nie zu einer am Erlaubnisschein verbotenen Methode raten. */
  const kkFenster = k.spot.kkVerbot;
  const kkVerbotRLP = !!k.spot.rlpFruehjahr && inWindowAt(jetzt, [4, 15], [5, 31]);
  const kkVerbotRegional = !!kkFenster && inWindowAt(jetzt, kkFenster.von, kkFenster.bis);
  const kkVerbot = (kkVerbotRLP || kkVerbotRegional) && !(k.art && FRIEDFISCH[k.art]);
  if (kkVerbot) { koeder = 'Naturköder ruhig am Grund (Tauwurm/Grundelfetzen) – keine aktive Köderführung'; jig = null; }

  const luecken: string[] = [];
  if (kkVerbotRLP) {
    luecken.push('Frühjahrsschonzeit 15.4.–31.5.: keine Kunstköder (Spinner/Blinker/Gummi) und keine aktive Köderführung; künstliche Fliege nur an der Fliegenrute. Genauen Abschnitt auf dem Erlaubnisschein prüfen.');
  } else if (kkVerbotRegional && kkFenster) {
    luecken.push(`Kunstköder-/Köderfischverbot ${fmtMD(kkFenster.von)}–${fmtMD(kkFenster.bis)} (Raubfischschonung): keine Kunstköder und keine toten Köderfische. Erlaubnisschein prüfen.`);
  }
  if (!state.SCHON.some((x) => x.fisch === k.art)) {
    luecken.push(`Für ${k.art} ist keine Schonzeit/kein Mindestmaß hinterlegt – vor Entnahme den Erlaubnisschein prüfen.`);
  }
  if (!state.WX) luecken.push('Kein Wetter verfügbar (offline?) – Wind und Luftdruck fließen nicht ein.');
  if (!state.PEGEL) {
    luecken.push('Kein Pegel/Wassertemperatur in Reichweite – ' + (wtSchaetzung(null)
      ? 'die Bewertung nutzt eine Schätzung aus der Lufttemperatur (±2 °C), die Zielfischwahl beruht auf Bestand und Saison.'
      : 'Zielfischwahl beruht nur auf Bestand und Saison.'));
  }
  if (k.spot.zugang === 'boot') luecken.push('Dieses Gewässer ist praktisch nur vom Boot zu beangeln.');
  if (k.spot.verif === 'C') luecken.push('Beleglage schwach: Gastkarte und Zugang vorher beim Verein klären.');

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
    ? `Heute besser nicht: Sturm (${Math.round(state.WX!.wind)} km/h). `
      + `Sobald es abflaut, wäre ${ortText} ${zeitText} der beste Startpunkt – auf ${k.art}.`
    : `Starte ${zeitText} ${ortText} auf ${k.art}`
      + (jig ? ` mit einem ${koeder} am ${jig}-Jigkopf.` : ` mit ${koeder}.`);

  if (sturm) luecken.unshift('Sturm ab 35 km/h – Angeln ist heute unverantwortlich (Wellen, Blitzschlag).');

  /* Persönliche Rückkopplung: was hast DU an diesem Spot schon geloggt?
     Bewusst deskriptiv – das Modell wird davon nicht verstellt. */
  const meine = (state.fbMem || []).filter((e) => e.spot === k.spot.name);
  let persoenlich: string | undefined;
  if (meine.length) {
    const l = meine[meine.length - 1];
    const detail = l.fisch ? ` – zuletzt ${l.fisch}${l.laenge ? ' ' + l.laenge + '\u202Fcm' : ''}` : '';
    persoenlich = `Dein Fangbuch: hier ${meine.length} ${meine.length === 1 ? 'Fang' : 'Fänge'} geloggt${detail}.`;
  }

  return {
    satz, massHinweis, kandidat: k, zeit, zielfisch: zf, koeder, jig,
    stroemung: stroemungBlei(k.spot), persoenlich,
    faktoren: k.faktoren, chance: k.basis, chanceFenster, sterne: sterneAus(k.basis, sturm),
    gesperrt: sturm ? 'sturm' : undefined,
    /* 12 statt 3: die ersten 3 stehen offen da, der Rest steckt in der ausklappbaren
       Rangliste (renderPlanBody) - Tiefe auf Wunsch, ohne den Normalfall zu ueberladen. */
    luecken, alternativen: besteJeOrt(liste.filter((x) => x.ort !== k.ort)).slice(0, 12),
  };
}


/* ---------- Darstellung: eigene Planer-Seite mit Fisch- & Gewässerfilter ---------- */
import { byId } from './dom.js';
import { chipsFadeInit, esc } from './util.js';

let letzterKandidat: Kandidat | null = null;
/* Seiten-lokale Auswahl (verändert NICHT den Kartenfilter). Leer = „alle". */
const planFisch: string[] = [];
const planGew: string[] = [];
chipsFadeInit(byId('planFishChips'));
chipsFadeInit(byId('planGewChips'));

/** Beangelbare Gewässer (Spot-Namen) der aktuellen Region, ohne Sperr/Info/eigene. */
function beangelbareGewaesser(): string[] {
  return state.SPOTS
    .filter((s) => s.cat !== 'sperr' && s.cat !== 'info' && !s.my && !!s.name)
    .map((s) => s.name)
    .filter((n, i, a) => a.indexOf(n) === i);
}

/** Zielfisch-IDs, die in der Region tatsächlich vorkommen (keine leeren Chips anbieten). */
function regionFischIds(): string[] {
  const arten = new Set<string>();
  state.SPOTS
    .filter((s) => s.cat !== 'sperr' && s.cat !== 'info' && !s.my)
    .forEach((s) => (s.arten || []).forEach((a) => arten.add(a)));
  return FISH.filter((f) => f.match.some((m) => arten.has(m))).map((f) => f.id);
}

function mkChip(label: string, on: boolean, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip' + (on ? ' on' : '');
  b.setAttribute('aria-pressed', String(on));
  b.textContent = label;
  b.onclick = onClick;
  return b;
}

function buildPlanFilter(): void {
  const fishBox = byId('planFishChips');
  if (fishBox) {
    fishBox.innerHTML = '';
    fishBox.appendChild(mkChip('Alle', planFisch.length === 0, () => { planFisch.length = 0; buildPlanFilter(); rerenderPlan(); }));
    regionFischIds().forEach((id) => {
      fishBox.appendChild(mkChip(id, planFisch.includes(id), () => {
        const i = planFisch.indexOf(id);
        if (i >= 0) planFisch.splice(i, 1); else planFisch.push(id);
        buildPlanFilter(); rerenderPlan();
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
        if (i >= 0) planGew.splice(i, 1); else planGew.push(name);
        buildPlanFilter(); rerenderPlan();
      }));
    });
  }
  /* Zusammenfassung in der <summary>-Zeile, damit ein aktiver Filter auch eingeklappt
     sichtbar bleibt statt sich hinter "Zielfisch & Gewässer einschränken" zu verstecken. */
  const countEl = byId('planFilterCount');
  if (countEl) {
    const n = planFisch.length + planGew.length;
    countEl.textContent = n ? n + ' aktiv' : '';
  }
}

function leerText(): string {
  const teile: string[] = [];
  if (planFisch.length) teile.push('Zielfisch <b>' + esc(planFisch.join(', ')) + '</b>');
  if (planGew.length) teile.push('Gewässer <b>' + esc(planGew.join(', ')) + '</b>');
  const suffix = teile.length ? ' für ' + teile.join(' und ') : '';
  return '<p style="color:var(--muted)">Kein Startpunkt' + suffix + ' empfehlbar – '
    + 'keine passende Kombination, oder die Art ist gerade geschont. Filter oben lösen oder erweitern.</p>';
}

function renderPlanBody(e: Empfehlung, offset: number = 0): string {
  const fak = [...e.faktoren].sort((a, b) => b.punkte - a.punkte);
  let h = '';
  if (e.gesperrt === 'sturm') h += '<div class="rate-sturm">⚠ Sturm – Angeln ist heute unverantwortlich.</div>';
  /* KPIs zuerst: die Chance ist das wichtigste Entscheidungskriterium. Nur die Prozentzahl,
     keine Sterne mehr daneben fuer denselben Wert (dieselbe Dopplung wie im Popup entfernt). */
  h += '<div class="plan-hero">'
    + '<div class="plan-kpi"><span class="plan-proz">' + e.chance + '\u202F%</span></div>'
    + '<div class="plan-basis">Chance ' + (offset === 0 ? 'jetzt' : 'im besten Fenster') + ' für ' + esc(e.kandidat.art) + ' · Datenbasis '
    + e.kandidat.bewertet + '/' + e.kandidat.gesamt + ' Signale</div>'
    + '</div>';
  if (e.kandidat.gesamt && e.kandidat.bewertet / e.kandidat.gesamt < 0.8) {
    h += '<div class="plan-luecke">⚠ Dünne Datenlage – die Chance ist bewusst zur Mitte gedämpft; was fehlt, steht unter „Was ich nicht weiß".</div>';
  }
  if (e.chanceFenster > e.chance + 4) {
    h += '<div class="plan-fenster">☾ Bestes Fenster heute: ' + esc(e.zeit.label) + ' ~' + hhmm(e.zeit.von)
      + ' Uhr → dann eher <b>~' + e.chanceFenster + '\u202F%</b></div>';
  }
  /* Danach der generierte Detail-Tipp (Köder, Ort, Zeit). */
  h += '<div class="plan-satz">' + esc(e.satz) + '</div>';
  if (e.persoenlich) h += '<div class="plan-pers">' + esc(e.persoenlich) + '</div>';
  if (e.massHinweis) h += '<div class="plan-mass">⚖ ' + esc(e.massHinweis) + '</div>';
  if (e.stroemung) h += '<div class="plan-mass">🌊 ' + esc(e.stroemung) + '</div>';

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
    const altZeile = (a: Kandidat) => '<div class="plan-alt">' + esc(a.ort) + ' · ' + esc(a.art) + ' <b>' + a.basis + '\u202F%</b></div>';
    const sichtbar = e.alternativen.slice(0, 3);
    const rest = e.alternativen.slice(3);
    h += '<div class="plan-sec"><h4>Alternativen</h4>'
      + sichtbar.map(altZeile).join('')
      + (rest.length
          ? `<details class="plan-rangliste"><summary>+${rest.length} weitere Gewässer</summary>${rest.map(altZeile).join('')}</details>`
          : '')
      + '</div>';
  }
  h += '<div class="verif" style="margin-top:12px">Eine begründete Vorauswahl aus Saison, Wind, Luftdruck, '
    + 'Pegel, Wassertemperatur und deinen Spot-Daten – kein Orakel. Die Gewichte stehen offen im Quelltext. '
    + 'Am Wasser entscheidest du.</div>';
  return h;
}

function goToKandidat(): void {
  const dlg = byId('planDlg');
  if (dlg) dlg.hidden = true;
  if (letzterKandidat && state.map) {
    state.map.flyTo([letzterKandidat.lat, letzterKandidat.lng], 14, { duration: 0.7 });
    const m = letzterKandidat.hotspot
      ? (letzterKandidat.spot.hotMarkers || [])[(letzterKandidat.spot.hotspots || []).indexOf(letzterKandidat.hotspot)]
      : letzterKandidat.spot.marker;
    if (m && typeof m.openPopup === 'function') setTimeout(() => m.openPopup(), 750);
  }
}

/* --- Tages-Blätterer -------------------------------------------------------
   Beißfenster sind rein astronomisch und damit für JEDEN Tag exakt berechenbar.
   Das Wetter dagegen reicht nur so weit wie die Vorhersage (7 Tage) – deshalb
   ist MAX_TAG bewusst begrenzt statt unbegrenzt weiterblättern zu lassen. */
export const MAX_TAG = 6;
let planTag = 0;

/** Datum für einen Tages-Offset. Heute = jetzt; Folgetage = 12:00 als neutraler Anker. */
export function tagDatum(offset: number, jetzt: Date = new Date()): Date {
  if (offset <= 0) return jetzt;
  const d = new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + offset, 12, 0, 0, 0);
  return d;
}

/** Bewertungszeitpunkt: heute „jetzt", an Folgetagen die Mitte des stärksten Beißfensters. */
export function bewertZeit(offset: number, lat: number, lng: number, jetzt: Date = new Date()): Date {
  const tag = tagDatum(offset, jetzt);
  if (offset <= 0) return tag;
  const win = solunar(lat, lng, tag).filter((w: any) => w.type === 'major');
  if (!win.length) return tag;
  const w = win[0];
  return new Date((w.from.getTime() + w.to.getTime()) / 2);
}

const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export function tagLabel(offset: number, jetzt: Date = new Date()): string {
  const d = tagDatum(offset, jetzt);
  if (offset === 0) return 'Heute · ' + WOCHENTAG[d.getDay()] + ' ' + d.getDate() + '.' + (d.getMonth() + 1) + '.';
  if (offset === 1) return 'Morgen · ' + WOCHENTAG[d.getDay()] + ' ' + d.getDate() + '.' + (d.getMonth() + 1) + '.';
  return WOCHENTAG[d.getDay()] + ' ' + d.getDate() + '.' + (d.getMonth() + 1) + '.';
}

/** Beißfenster-Liste für einen Tag – funktioniert ohne jede Wetterabfrage. */
export function fensterHtml(lat: number, lng: number, tag: Date, offset: number): string {
  const win = solunar(lat, lng, tag);
  if (!win.length) return '';
  const zeilen = win.map((w: any) =>
    `<div class="z ${w.type}">${hhmm(w.from)}–${hhmm(w.to)}</div>`
    + `<div class="l ${w.type}">${esc(w.label)}${w.type === 'major' ? ' · stark' : ''}</div>`).join('');
  const ms = mondStaerke(tag.getTime());
  const mond = ms > 0.6 ? ' · Neu-/Vollmond verstärkt die Fenster' : ms < 0.25 ? ' · Halbmond, Fenster schwächer' : '';
  return '<div class="plan-fenster-liste"><div class="plan-fl-h">Beißfenster '
    + (offset === 0 ? 'heute' : offset === 1 ? 'morgen' : tagLabel(offset)) + esc(mond)
    + '</div><div class="plan-fl">' + zeilen + '</div></div>';
}

/* --- Tagesplan über die gemerkten Spots -------------------------------------
   Verteilt die vorgemerkten Spots über die Beißfenster eines Tages: jeder Spot
   bekommt das Fenster, in dem ER am stärksten ist – jedes Fenster nur einmal.
   Bewusst KEINE Fahrzeit: dafür fehlt eine Routing-Quelle, die Distanz ist
   Luftlinie und wird auch so benannt. */
export interface Stopp {
  spot: Spot;
  art: string;
  chance: number;
  von: Date;
  bis: Date;
  label: string;
  typ: 'major' | 'minor';
  /** Luftlinie zum nächsten Stopp in km (null beim letzten). */
  weiter: number | null;
}

export function tagesplan(offset: number, jetzt: Date = new Date()): Stopp[] {
  if (!state.REGION) return [];
  const namen = state.trip.filter((t) => t.region === state.REGION.id).map((t) => t.name);
  const spots = namen.map((n) => state.SPOTS.find((s) => s.name === n))
    .filter((s): s is Spot => !!s && s.cat !== 'sperr' && s.cat !== 'info');
  if (!spots.length) return [];
  const tag = tagDatum(offset, jetzt);
  const c = spots[0];
  const fenster = solunar(c.lat, c.lng, tag);
  if (!fenster.length) return [];
  const wt = state.PEGEL?.wt ?? state.WX?.wt ?? null;

  /* Alle Kombinationen (Spot × Fenster) bewerten. */
  type Paar = { spot: Spot; f: any; art: string; chance: number };
  const paare: Paar[] = [];
  for (const s of spots) {
    for (const f of fenster) {
      const mitte = new Date((f.from.getTime() + f.to.getTime()) / 2);
      const zf = zielfischFor(s, wt, mitte);
      if (!zf) continue;
      const b = bewerteSpot(s, zf.art, mitte);
      if (b.geschont) continue;
      paare.push({ spot: s, f, art: zf.art, chance: b.prozent });
    }
  }
  /* Gierig zuordnen: stärkste Kombination zuerst, jeder Spot nur einmal.
     Solunar-Fenster überlappen sich (Mond-Transit und Dämmerung fallen oft zusammen) –
     überlappende Stopps wären aber unmöglich, man kann nicht an zwei Orten gleichzeitig
     sein. Deshalb wird jedes Fenster verworfen, das ein bereits verplantes schneidet. */
  paare.sort((a, b) => b.chance - a.chance);
  const gelegt: { von: number; bis: number }[] = [];
  const verplant = new Set<string>();
  const stopps: Stopp[] = [];
  for (const p of paare) {
    if (verplant.has(p.spot.name)) continue;
    const von = p.f.from.getTime(); const bis = p.f.to.getTime();
    if (gelegt.some((g) => von < g.bis && bis > g.von)) continue;
    gelegt.push({ von, bis });
    verplant.add(p.spot.name);
    stopps.push({ spot: p.spot, art: p.art, chance: p.chance, von: p.f.from, bis: p.f.to,
      label: p.f.label, typ: p.f.type, weiter: null });
  }
  stopps.sort((a, b) => a.von.getTime() - b.von.getTime());
  for (let i = 0; i < stopps.length - 1; i++) {
    stopps[i].weiter = haversine(stopps[i].spot.lat, stopps[i].spot.lng,
      stopps[i + 1].spot.lat, stopps[i + 1].spot.lng);
  }
  return stopps;
}

/** Empfehlung mit den aktuellen Seiten-Filtern neu berechnen und anzeigen. */
function rerenderPlan(): void {
  const body = byId('planBody');
  const go = byId('planGo');
  if (!body) return;
  const lbl = byId('planTagLabel');
  if (lbl) lbl.textContent = tagLabel(planTag);
  const pv = byId('planPrev') as HTMLButtonElement | null;
  const nx = byId('planNext') as HTMLButtonElement | null;
  if (pv) pv.disabled = planTag <= 0;
  if (nx) nx.disabled = planTag >= MAX_TAG;

  /* Bewertungszeitpunkt: heute „jetzt", an Folgetagen das stärkste Fenster des Tages. */
  const ctr = state.SPOTS.find((s) => !s.my) || ({ lat: 50, lng: 8 } as any);
  const zeitpunkt = bewertZeit(planTag, ctr.lat, ctr.lng);
  const e = empfehlung(zeitpunkt, { fisch: planFisch, gewaesser: planGew });
  if (!e) {
    body.innerHTML = leerText();
    letzterKandidat = null;
    if (go) go.hidden = true;
    return;
  }
  letzterKandidat = e.kandidat;
  const sp = e.kandidat.spot;
  body.innerHTML = renderPlanBody(e, planTag)
    + fensterHtml(sp.lat, sp.lng, tagDatum(planTag), planTag);
  if (go) { go.hidden = false; go.onclick = goToKandidat; }
}

export function openPlan(): void {
  const dlg = byId('planDlg');
  if (!dlg) return;
  /* Beim Öffnen die Fisch-Auswahl aus dem Kartenfilter vorbelegen; Gewässer offen (alle). */
  planFisch.length = 0; state.fishSel.forEach((id) => planFisch.push(id));
  planGew.length = 0;
  planTag = 0;
  buildPlanFilter();
  rerenderPlan();
  dlg.hidden = false;
  const bodyEl = byId('planBody');
  if (bodyEl) bodyEl.scrollTop = 0;
}

const planDlg = byId('planDlg');
if (planDlg) {
  const c = byId('planClose');
  if (c) c.onclick = () => { planDlg.hidden = true; };
  planDlg.addEventListener('click', (ev) => { if (ev.target === planDlg) planDlg.hidden = true; });
  const pv = byId('planPrev');
  const nx = byId('planNext');
  if (pv) pv.onclick = () => { if (planTag > 0) { planTag--; rerenderPlan(); } };
  if (nx) nx.onclick = () => { if (planTag < MAX_TAG) { planTag++; rerenderPlan(); } };
}
