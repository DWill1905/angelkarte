/* Zentrale Typdefinitionen der Angelkarte.
   Diese Interfaces sind der eigentliche Gewinn des TypeScript-Umbaus:
   Datenfehler in den Regionsdaten fallen beim Kompilieren auf, nicht am Wasser. */

/** Verifikationsgrad der Datenlage eines Spots. */
export type Verif = 'A' | 'B' | 'C';

/** Wie ist der Spot beangelbar? */
export type Zugang = 'ufer' | 'boot';

/** Kategorie eines Kartenpunkts. */
export type SpotCat = 'raub' | 'fried' | 'salmo' | 'fluss' | 'forelle' | 'info' | 'sperr' | 'eigen';

/** Monat/Tag als [monat, tag], 1-basiert.
    Bewusst `number[]` statt Tupel: die Regionsdaten enthalten hunderte Literale wie [2,15],
    die TypeScript sonst überall ein `as const` bräuchten. Länge 2 erzwingt der Validator. */
export type MonatTag = number[];

/** Link zu einer Erlaubniskarten-Ausgabestelle. */
export interface KartenLink {
  label: string;
  /** Muss https sein (wird vom Validator erzwungen). */
  url: string;
}

/** Ein Hotspot innerhalb eines Spots (Buhne, Kante, Einlauf …). */
export interface Hotspot {
  name: string;
  saison: string;
  lat: number;
  lng: number;
  tipp: string;
}

/** Ein Gewässer bzw. Kartenpunkt. */
export interface Spot {
  name: string;
  cat: SpotCat;
  arten: string[];
  lat?: number;
  lng?: number;
  /** Flussstrecken werden als Polyline gezeichnet. */
  line?: Array<[number, number]>;
  nr?: string;
  fisch?: string;
  methode?: string;
  karte?: string;
  note?: string;
  rig?: string;
  verif?: Verif;
  zugang?: Zugang;
  warn?: boolean;
  hotspots?: Hotspot[];
  kartenLinks?: KartenLink[];
  /** Vom Nutzer selbst gesetzter Spot. */
  my?: boolean;
  myId?: number;
  /** Eigene Farbe für Polylines/Marker (überschreibt Kategorie-Farbe). */
  farbe?: string;
  /** Zusatzhinweis zu Schonzeiten dieses Gewässers. */
  schonzeitInfo?: string;
  /** Beschreibung der Strecke (Flussabschnitte). */
  strecke?: string;
  /** Gewässercharakter. Fehlt er, wird er aus cat/line/note abgeleitet. */
  wasser?: Wasser;
  /** Kuratierte Tackle-Empfehlung. Fehlt sie, wird sie abgeleitet. */
  tackle?: Tackle;
  /** Maximaltiefe in Metern, falls belegt (steuert Jigkopf & Rutenwahl). */
  tiefe?: number;
  /** Laufzeit: Entfernung zum Nutzerstandort in km (von renderList gesetzt). */
  _d?: number;
  /** Laufzeit: Leaflet-Marker bzw. Polyline dieses Spots. */
  marker?: any;
  /** Laufzeit: Leaflet-Marker der Hotspots. */
  hotMarkers?: any[];
}

/** Schonzeit-/Maßangabe einer Fischart. */
export interface Schonzeit {
  fisch: string;
  /** null = keine Schonzeit. */
  von: MonatTag | null;
  bis: MonatTag | null;
  /** Freitext, z.B. "Entnahmefenster 50–90 cm" oder "ab 50 cm". */
  mm: string;
}

/** Saisonaler Hinweisbanner. */
export interface Banner {
  von: MonatTag;
  bis: MonatTag;
  text: string;
}

/** Ein Regelblock im Regeln-Tab. */
export interface Regelblock {
  titel: string;
  punkte: string[];
}

/** Pegel-Warnschwelle einer Region. */
export interface PegelRegel {
  warnAb: number;
  text: string;
}

/** Eine Angelregion. */
export interface Region {
  id: string;
  name: string;
  /** Kurzname für Header und Umschalter. */
  kurz?: string;
  /** Datenfrische als JJJJ-MM (vom Validator erzwungen). */
  geprueft?: string;
  nachtangeln?: string;
  packliste?: string[];
  koederfisch?: string[];
  schonQuelle?: string;
  pegel?: PegelRegel;
  fusszeile?: string;
  spots: Spot[];
  schon: Schonzeit[];
  banner?: Banner[];
  regeln?: Regelblock[];
  hinweis?: string;
}


/** Gewässercharakter – bestimmt Jigkopfgewicht, Rutenhärte und Köderführung. */
export type Wasser = 'fluss' | 'kanal' | 'see-flach' | 'see-tief';

/** Saisonale Köderfarben. */
export interface Farben {
  fruehjahr: string;
  sommer: string;
  herbst: string;
  winter: string;
}

/** Konkrete Tackle-Empfehlung für ein Gewässer.
    Erfahrungswerte, keine Rechtsangaben – Ködergrößen/-farben sind Richtwerte,
    die Vorfach- und Zugangsangaben folgen aus Zielfisch und Gewässertyp. */
export interface Tackle {
  /** z.B. "Spinnrute 40–80 g, 2,40–2,70 m" */
  rute: string;
  /** z.B. "Gummi 12–19 cm, Swimbaits bis 25 cm" */
  koeder: string;
  /** Jigkopf-Spanne, z.B. "10–21 g" – bei Fließgewässern pegelabhängig. */
  jig: string;
  /** z.B. "Titan/Stahl 40 cm (Hechtgefahr)" */
  vorfach: string;
  /** Boot- oder Uferempfehlung, konkret begründet. */
  zugang: string;
  /** Saisonale Köderfarben. */
  farben: Farben;
  /** Kurzbegründung, warum genau dieses Setup. */
  warum?: string;
}

/** Kategorie-Metadaten (Label + Farbe). */
export interface CatInfo {
  label: string;
  color: string;
}

/** Ein Solunar-Beißfenster. */
export interface SolunarFenster {
  type: 'major' | 'minor';
  from: number;
  to: number;
}

/** Aktuelle Wetterlage (Open-Meteo). */
export interface Wetter {
  temp: number;
  wind: number;
  dirDeg: number;
  dir: string;
  press: number;
  /** Luftdruckänderung der letzten 3 h in hPa. */
  trendVal: number;
  /** Wassertemperatur, wird ggf. von PEGELONLINE nachgetragen. */
  wt?: number;
  /** WMO weather_code (0–1 klar, 2 heiter, 3 bedeckt, 45/48 Nebel, 51–82 Regen, 95+ Gewitter). */
  code?: number;
}

/** Nächste Pegelstation (PEGELONLINE). */
export interface Pegel {
  value: number;
  station: string;
  /** Entfernung in km. */
  dist: number;
  /** Pegeländerung der letzten 24 h in cm (nachgetragen). */
  trend?: number;
  wt?: number;
  /** Wassertemperatur-Trend in °C über ~3 Tage (nachgetragen, wenn die Station WT-Historie liefert). */
  wtTrend?: number;
  /** Abfluss in m³/s (Strömungsgröße), wenn die Station Q liefert. */
  abfluss?: number;
  /** Abfluss-Trend der letzten 24 h in m³/s (nachgetragen). */
  abflussTrend?: number;
  /** Näherung des mittleren Abflusses (Median der letzten ~30 Tage) als Bezugsgröße für „viel/wenig". */
  abflussMittel?: number;
}

/** Automatisch mitgeloggter Kontext eines Fangs. */
export interface FangKontext {
  zeit: string;
  mond: string;
  druck: number | null;
  trend: number | null;
  wind: string | null;
  pegel: number | null;
  wt: number | null;
  temp?: number | null;
  /** War zum Fangzeitpunkt ein Solunar-Fenster aktiv? */
  fenster?: 'major' | 'minor' | null;
  region?: string | null;
}

/** Ein Fangbuch-Eintrag. */
export interface Fang {
  id: number;
  fisch: string;
  laenge: number | string;
  spot: string;
  koeder: string;
  /** Gespeichert als de-DE ("9.7.2026"); parseFangDatum versteht auch ISO. */
  datum: string;
  entnommen: boolean;
  ctx?: FangKontext;
}

/** Ein vorgemerkter Spot der Trip-Liste. */
export interface TripEintrag {
  region: string;
  name: string;
  notiz?: string;
}

/** Mindest-/Höchstmaß, aus dem mm-Freitext geparst. */
export interface MassGrenzen {
  min: number | null;
  max: number | null;
}

/** Speicher-Shim (window.storage oder localStorage). */
export interface Storage {
  get(key: string): Promise<{ key: string; value: string }>;
  set(key: string, value: string): Promise<{ key: string; value: string }>;
}

/** Der gesamte veränderliche App-Zustand. */
export interface AppState {
  REGIONS: Region[];
  REGION: Region | null;
  SPOTS: Spot[];
  SCHON: Schonzeit[];
  loadToken: number;
  fishSel: string[]; /* Mehrfachauswahl: aktive Zielfisch-Chip-IDs, leer = kein Filter */
  uferOnly: boolean;
  active: Record<string, boolean>;
  userPos: [number, number] | null;
  userMarker: any;
  uidLast: number;
  WX: Wetter | null;
  PEGEL: Pegel | null;
  wxKey: string;
  fbMem: Fang[];
  persistent: boolean;
  fbSaving: boolean;
  trip: TripEintrag[];
  map: any;
}
