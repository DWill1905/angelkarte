export const CATS = {
    eigen: { label: 'Eigene Spots', color: '#c9699e' },
    info: { label: 'Service/Kartenausgabe', color: '#b58cc9' },
    raub: { label: 'Raubfisch', color: '#e4572e' },
    salmo: { label: 'Salmoniden', color: '#5cc0dc' },
    fried: { label: 'Friedfisch', color: '#8fb069' },
    fluss: { label: 'Fluss allgemein', color: '#7d9bc9' },
    forelle: { label: 'Forellenteich', color: '#e8b93c' },
    sperr: { label: 'Gesperrt/eingeschränkt', color: '#8a93a0' }
};
/* Zielfisch-Filter: Chip-ID → tatsächliche Artennamen in Spot.arten.
   Liegt hier (nicht in map.ts), damit auch der „Heute"-Planer (plan.ts) den aktiven
   Filter auflösen kann, ohne map.ts zu importieren (sonst Zirkelimport map→tools→plan→map). */
export const FISH = [
    { id: 'Hecht', match: ['Hecht'] },
    { id: 'Zander', match: ['Zander'] },
    { id: 'Barsch', match: ['Barsch'] },
    { id: 'Forelle', match: ['Bachforelle', 'Regenbogenforelle'] },
    { id: 'Äsche', match: ['Äsche'] },
    { id: 'Döbel', match: ['Döbel'] },
    { id: 'Karpfen', match: ['Karpfen'] },
    { id: 'Schleie', match: ['Schleie'] },
    { id: 'Aal', match: ['Aal'] },
    { id: 'Rapfen', match: ['Rapfen'] },
    { id: 'Wels', match: ['Wels'] },
    { id: 'Brachse', match: ['Brachse'] }
];
/** Vereinigt die Artennamen aller ausgewählten Zielfisch-Chips.
    Leere Auswahl → leeres Array (= kein Zielfisch-Filter aktiv). */
export function fischArtenFor(ids) {
    if (!ids || !ids.length)
        return [];
    const out = new Set();
    for (const f of FISH)
        if (ids.includes(f.id))
            for (const a of f.match)
                out.add(a);
    return [...out];
}
export const SPOTS_SN = [
    {
        name: 'Talsperre Saidenbach', zugang: 'ufer', keinBoot: true, keinAnfuettern: true, kkVerbot: { von: [2, 1], bis: [4, 30] },
        rig: 'H-Spinnrute 20–60 g, Geflecht + FC-Vorfach. Erlaubte Köder: Kunstköder, Wurm, Mais/Teig – KEINE Maden, kein Fleisch, kein Anfüttern (TWT!).',
        arten: ['Barsch', 'Hecht', 'Karpfen', 'Schleie', 'Brachse', 'Zander'], nr: 'C02-102', cat: 'raub', lat: 50.7358, lng: 13.2342,
        fisch: 'Barsch, Hecht, Karpfen, Schleie, Brasse, Weißfisch (Zander selten)',
        methode: 'Gummifisch & Wobbler an den Kanten der Bachtäler, DropShot auf Barsch – weite Würfe nötig, Fische oft bis ~15 m Tiefe',
        karte: 'AVS-Erlaubnisschein + TWT-Belehrung (Quittung im Fangbuch)',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'Trinkwassertalsperre: kein Boot, kein Waten, kein Anfüttern, keine Maden/Fleisch, kein Nachtangeln. Schonmaß 60 cm für ALLE Salmoniden. Parkplatz am NO-Ufer (Lippersdorfer Str.), Rundwanderweg erschließt alle Ufer.',
        hotspots: [
            { name: 'Staumauer-Bereich', saison: 'Jul–Sep (Sommerloch-Taktik)', lat: 50.7340, lng: 13.2318, tipp: 'Tiefster Bereich der Talsperre. Sommer: Fische stehen tief – weite Würfe mit schweren Gummis, Barschtrupps über den Tiefenkanten suchen.' },
            { name: 'Übergang Vorsperre Forchheim', saison: 'Mai–Jun + Okt', lat: 50.7284, lng: 13.2736, tipp: 'Kante zwischen flacher Vorsperre und Hauptbecken – klassischer Zug für Hecht und Barsch, im Frühsommer zuerst warm.' },
            { name: 'Ufer: Nordostufer am Parkplatz', saison: 'ganzjährig', lat: 50.7420, lng: 13.2430, tipp: 'Bester Uferabschnitt (Luftbild): offene Wiesenkanten ohne Schilf, freie Wurfbahn Richtung Tiefenlinie. Kürzester Weg vom Parkplatz Lippersdorfer Str. Beschilderung der erlaubten Bereiche beachten!' }
        ],
        warn: false
    },
    {
        name: 'Vorsperre Dittersbach', zugang: 'ufer', verif: 'B', keinBoot: true, keinAnfuettern: true, kkVerbot: { von: [2, 1], bis: [4, 30] },
        rig: 'Spinnrute mittel, Stahl- oder dickes FC-Vorfach (Hecht). TWT-Köderregeln wie Saidenbach.',
        arten: ['Barsch', 'Hecht', 'Karpfen', 'Schleie', 'Regenbogenforelle'], nr: 'C01-104', cat: 'raub', lat: 50.8009, lng: 13.4798,
        fisch: 'Barsch, Hecht, Karpfen, Schleie, Regenbogenforelle, Weißfisch',
        methode: 'Spinnfischen vom Ufer, Pose/Grund auf Karpfen & Schleie (TWT-Köderregeln!)',
        karte: 'AVS-Erlaubnisschein + TWT-Belehrung',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: '6 ha Vorsperre der TS Lichtenberg. Die Hauptsperre selbst ist wegen der ~30-Mio-€-Sanierung seit Herbst 2024 entleert und die Dammkrone laut Landestalsperrenverwaltung mindestens bis Ende 2026 gesperrt – die Vorsperre ist davon nicht zwingend betroffen, laut aktueller Quellenlage weiterhin mit Erlaubnisschein befischbar. Vor Anfahrt trotzdem beim AVS bestätigen, da sich der Baustellenbetrieb ändern kann.',
        warn: true
    },
    {
        name: 'Talsperre Rauschenbach', zugang: 'ufer', verif: 'B', keinBoot: true, keinAnfuettern: true, kkVerbot: { von: [2, 1], bis: [4, 30] },
        rig: 'H-Spinnrute 20–60 g für weite Würfe an die Abbruchkanten; TWT-Köderregeln beachten. Uferangeln, kein Boot.',
        arten: ['Barsch', 'Hecht', 'Zander', 'Karpfen', 'Schleie', 'Regenbogenforelle', 'Aal', 'Brachse'], nr: 'AVS (Gew.-Nr. vor Ort prüfen)', cat: 'raub', lat: 50.6965, lng: 13.5057,
        fisch: 'Barsch, Hecht, Zander, Karpfen, Schleie, Regenbogenforelle, Brasse, Aal, Weißfisch',
        methode: 'Trinkwassertalsperre mit flach begehbaren Ufern (fast rundum beangelbar): im Frühjahr Hecht im Flachwasser, sonst Abbruchkanten in Wurfweite auf Zander/Barsch suchen, Grund auf Karpfen/Schleie',
        karte: 'AVS-Gastkarte + TWT-Belehrung; LVSA-Jahresvollzahler ohne Zusatzerlaubnis. Gewässernummer vor Ort/Verzeichnis prüfen.',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'TWT nahe der tschechischen Grenze (Flöha gestaut, 114,58 ha Gesamtfläche – 99,43 ha auf deutscher, 15,15 ha auf tschechischer Seite). Angeln erlaubt AUSSER ~150 m direkt an der Staumauer und der tschechischen Seite. Kein Boot, kein Baden. Flach abfallende, gut begehbare Ufer – eine der zugänglicheren Talsperren der Region. Aktuelle TWT-Bestimmungen beim AVS prüfen.',
        warn: false
    },
    {
        name: 'Talsperre Lichtenberg (Hauptsperre)',
        arten: ['Hecht', 'Barsch'], nr: 'C01-105', cat: 'sperr', lat: 50.8117, lng: 13.4530,
        fisch: 'vor Sanierung: Hecht, Barsch, Rotauge',
        methode: '—',
        karte: '—',
        note: 'ACHTUNG: Seit Herbst 2024 für die Staudamm-Sanierung (~30 Mio €, Entnahmeturm + Dammdichtung) vollständig entleert. Die Dammkrone ist laut Landestalsperrenverwaltung Sachsen mindestens bis Ende 2026 komplett gesperrt (Lebensgefahr durch Bauarbeiten), Bauzeit insgesamt mind. 2 Jahre – kein Angelbetrieb möglich. Status/Wiedereröffnung beim AVS bzw. wasserwirtschaft.sachsen.de erfragen.',
        warn: true
    },
    {
        name: 'Freiberger Mulde – gelbe Salmonidenstrecke', zugang: 'ufer',
        rig: 'UL/L-Rute bis 10 g, Watkescher, Einzelhaken-Umbau: Drillinge vorab tauschen (Sprengringzange mitnehmen!).', nr: 'C01-02', cat: 'salmo',
        arten: ['Bachforelle', 'Regenbogenforelle', 'Äsche', 'Döbel', 'Barsch'],
        lat: 50.828, lng: 13.418, farbe: 'gelb',
        line: [[50.712, 13.603], [50.728, 13.572], [50.741, 13.541], [50.769, 13.498], [50.789, 13.459], [50.807, 13.417], [50.838, 13.410], [50.865, 13.398], [50.882, 13.395], [50.897, 13.392], [50.910, 13.380], [50.927, 13.363]],
        strecke: 'Teichhaus (dt.-tschech. Grenze) bis Straßenbrücke Halsbach, 28 km',
        fisch: 'Bachforelle, Regenbogenforelle, Äsche, Döbel, Barsch',
        methode: 'Fliege &amp; UL-Spinner mit Einzelhaken – Gumpen, Kolke, unterspülte Ufer',
        karte: 'Gelbe Strecke: nur mit Jahres-Salmonidenschein des AVS',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'Für Gastangler ohne Jahres-Salmoschein NICHT zugänglich. Sperr- und Fly-only-Abschnitte vorhanden – Beschilderung beachten.',
        warn: true
    },
    {
        name: 'Freiberger Mulde – allgemeine Strecke', zugang: 'ufer',
        rig: 'Leichte Spinnrute bis 10 g oder Fliegenrute #4–5, Wathose mit Filz-/Spikesohle für die Gumpen.', nr: 'C01-201', cat: 'fluss',
        arten: ['Bachforelle', 'Regenbogenforelle', 'Äsche', 'Döbel', 'Barsch'],
        lat: 50.975, lng: 13.325, farbe: 'allg',
        line: [[50.927, 13.363], [50.938, 13.345], [50.950, 13.337], [50.968, 13.330], [50.983, 13.318], [51.000, 13.320], [51.013, 13.322], [51.028, 13.318]],
        strecke: 'Straßenbrücke Halsbach bis A4-Brücke Siebenlehn (über Altväterbrücke Halsbrücke), 26 km',
        fisch: 'Bachforelle, Äsche, Döbel, Barsch – guter Salmonidenbestand',
        methode: 'Leichte Spinnrute bis 10 g oder Fliege, Wathose empfohlen (Gumpen &amp; Kolke!)',
        karte: 'Allgemeine AVS-Berechtigung / Gastkarte – kein Salmoschein nötig',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'Die realistische Mulde-Strecke für Gastangler: Forellen &amp; Döbel fast überall, Barsche in tiefen Gumpen.',
        warn: false
    },
    {
        name: 'Flöha – grüne Salmonidenstrecke (Lengefeld)', zugang: 'ufer',
        rig: 'UL-Spinnrute oder Fliegenrute, nur 1 Rute und 1 Einzelhaken pro Köder – rutschfeste Watsohlen für die Felspassagen.', nr: 'C02-07', cat: 'salmo',
        arten: ['Bachforelle', 'Regenbogenforelle', 'Äsche', 'Döbel', 'Barsch'],
        lat: 50.731, lng: 13.170, farbe: 'gruen',
        line: [[50.718, 13.184], [50.727, 13.172], [50.736, 13.163], [50.744, 13.157]],
        strecke: 'Straßenbrücke Rauenstein bis Mühlenwehr am Bahnhof Floßmühle',
        fisch: 'Bachforelle, Regenbogenforelle, Äsche, Weißfisch',
        methode: 'Nymphe in den Taschen zwischen den Felsen, UL-Spinner – Wathose mit rutschfester Sohle',
        karte: 'Grüne Strecke: allgemeine AVS-Berechtigung, aber nach Salmonidenregeln (Flug/Spinn, 1 Rute, Einzelhaken)',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'Mäander zwischen bewaldeten Hängen, wechselnd sandig bis felsig – versteckte Rinnen und Löcher.',
        warn: false
    },
    {
        name: 'Flöha – allgemeine Strecke (Borstendorf)', zugang: 'ufer',
        rig: 'Allround-Spinnrute 5–20 g plus leichte Posenrute – laut Fangstatistik ist die Pose hier am erfolgreichsten.', nr: 'AVS', cat: 'fluss',
        arten: ['Bachforelle', 'Regenbogenforelle', 'Döbel', 'Barsch', 'Hecht', 'Aal', 'Karpfen'],
        lat: 50.766, lng: 13.128, farbe: 'allg',
        line: [[50.744, 13.157], [50.752, 13.146], [50.762, 13.135], [50.771, 13.125], [50.780, 13.113], [50.787, 13.100]],
        strecke: 'Mühlenwehr Bhf. Floßmühle bis Straßenbrücke Leubsdorf/Schellenberg, 14 km',
        fisch: 'Bachforelle, Regenbogenforelle, Döbel, Barsch, Hecht, Aal, Karpfen',
        methode: 'UL-Spinnfischen, Pose – laut Fangstatistik erfolgreichste Methode hier',
        karte: 'Allgemeine AVS-Berechtigung / Gastkarte',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'Fischreiche, stark befischte Strecke. Achtung: privates Fischereirecht zwischen Grünhainichen und Borstendorf – siehe rote Sperrstrecke.',
        warn: false
    },
    {
        name: 'Flöha – Sperrstrecke Grünhainichen', nr: 'privat', cat: 'sperr',
        arten: [],
        lat: 50.762, lng: 13.135, farbe: 'sperr',
        line: [[50.752, 13.146], [50.762, 13.135], [50.771, 13.125]],
        strecke: '100 m unterhalb Straßenbrücke Grünhainichen bis Straßenbrücke Borstendorf',
        fisch: '—', methode: '—',
        karte: 'Privates Fischereirecht – Angeln verboten',
        note: 'Dieser Abschnitt darf nicht befischt werden, auch nicht mit AVS-Karte.',
        warn: true
    },
    {
        name: 'Mühlteich (Brand-Erbisdorf)', zugang: 'ufer', verif: 'B', kkVerbot: { von: [2, 1], bis: [4, 30] },
        rig: 'Grundrute mit Freilaufrolle (Karpfen), zweite Rute fein auf Schleie – abends Tauwurm am Grund für Aal.',
        arten: ['Karpfen', 'Schleie', 'Aal', 'Barsch'], nr: 'AVS', cat: 'fried', lat: 50.7999, lng: 13.2761,
        fisch: 'Karpfen, Graskarpfen, Schleie, Aal, Barsch',
        methode: 'Grundangeln (Boilie, Mais), Pose in der Dämmerung auf Schleie, abends auf Aal',
        karte: 'AVS-Erlaubnisschein / Gastkarte',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'Kleiner Naturteich bei Gränitz (OT Brand-Erbisdorf). Angelstatus vorab im AVS-Gewässerverzeichnis prüfen – Lage/Zuordnung nicht eindeutig.',
        warn: false
    },
    {
        name: 'Schlüsselteich (Freiberg)', zugang: 'ufer', kkVerbot: { von: [2, 1], bis: [4, 30] },
        rig: 'Feederrute mittel, Method-Körbe, 10er–12er Haken – stadtnah reicht leichtes Gepäck.',
        arten: ['Karpfen', 'Brachse', 'Schleie', 'Aal', 'Barsch'], nr: 'C01-110', cat: 'fried', lat: 50.9226, lng: 13.3427,
        fisch: 'Karpfen, Brachse, Schleie, Aal, Barsch',
        methode: 'Feeder & Method Feeder auf Karpfen, Madenbündel auf Brachse',
        karte: 'AVS-Erlaubnisschein / Gastkarte',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'Stadtnah und gut erreichbar – solides Friedfischgewässer. Liegt mitten in der Freiberger Altstadt, nördlich des Meißner Rings.',
        warn: false
    },
    {
        name: 'Richter’s Angelteich (Gränitz)', zugang: 'ufer',
        schonzeitInfo: 'Privatgewässer: LVSA-Sperrfrist &amp; Salmonidenregeln gelten hier NICHT – Betreiberregeln maßgeblich.',
        rig: 'Leichte Forellenrute 5–20 g, 0,20er Mono, Sbirolino oder Pose – Teig, Spoons, Bienenmade.', nr: 'privat', cat: 'forelle',
        arten: ['Regenbogenforelle'], lat: 50.7946, lng: 13.2894,
        fisch: 'Regenbogenforelle (Besatz), Stör im Teich',
        methode: 'Forellenteig, Spoons, Bienenmade – Put &amp; Take, auch ohne Fischereischein',
        karte: 'Eintritt 3 €, Fang nach Kilo – direkt beim Betreiber (Tel. 0173 9281089)',
        note: 'Sa 8–17, So 9–12 Uhr, Saison bis Ende Oktober. Sehr gut bewertet (4.8), Ausnehmen vor Ort möglich.',
        warn: false
    },
    {
        name: 'Erzengler Teich', zugang: 'ufer', verif: 'B', kkVerbot: { von: [2, 1], bis: [4, 30] }, nr: 'RWA – AVS-Nr. prüfen', cat: 'fried',
        arten: ['Karpfen', 'Schleie', 'Barsch'],
        lat: 50.8524, lng: 13.3419,
        fisch: 'Karpfen, Schleie, Barsch (Bestand vor Ort prüfen)',
        methode: 'Grund/Pose außerhalb der Bade-Bojen, Randzeiten nutzen',
        karte: 'Fischereigewässer der RWA – Status/Nummer im AVS-Gewässerverzeichnis prüfen',
        rig: 'Feeder- oder Posenrute, 0,25er Mono reicht – Boilies/Mais auf Karpfen, Wurm auf Schleie in der Dämmerung',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: '8-ha-Kunstteich (1570), zugleich EU-Badegewässer mit Naturbad und Bootsverleih: im Sommer tagsüber Badebetrieb – früh morgens oder abends angeln.',
        warn: false
    },
    {
        name: 'Berthelsdorfer Hüttenteich', zugang: 'ufer', verif: 'B', kkVerbot: { von: [2, 1], bis: [4, 30] }, nr: 'RWA – AVS-Nr. prüfen', cat: 'fried',
        arten: ['Karpfen', 'Schleie', 'Barsch'],
        lat: 50.8761, lng: 13.3591,
        fisch: 'Karpfen, Schleie, Barsch (Bestand vor Ort prüfen)',
        methode: 'Klassisches Ansitzangeln, Ufer gut zugänglich, Parken schwierig',
        karte: 'RWA-Kunstteich – Status/Nummer im AVS-Gewässerverzeichnis prüfen',
        rig: 'Method Feeder auf Karpfen, feine Posenmontage auf Schleie',
        kartenLinks: [{ label: 'AVS Sachsen – Gastkarten', url: 'https://angeln-sachsen.de/avs/gastangler/gastkarten' }],
        note: 'FFH-Gebiet "Freiberger Bergwerksteiche", wird wie der Großteich zyklisch abgelassen – Wasserstand vor dem Trip prüfen.',
        warn: true
    },
    {
        name: 'Großhartmannsdorfer Großteich',
        arten: [], nr: 'RWA/LTV', cat: 'sperr', lat: 50.8088, lng: 13.3398,
        fisch: 'Karpfenzucht (bewirtschaftet)',
        methode: '—', karte: 'Kein reguläres Angelgewässer',
        note: 'Naturschutzgebiet, Teil der Revierwasserlaufanstalt, wird alle 4 Jahre abgelassen. Schönes Vogelrevier, aber kein Zielgewässer.',
        warn: true
    }
];
/* Schonzeiten Sachsen (SächsFischVO 2022) – [Art, von(M,T), bis(M,T), Mindestmaß] */
/* Hecht/Zander-Mindestmaß: die LVSA-Gewässerordnung (2024, gilt auf praktisch allen
   Spots dieser Region - fast alle laufen über AVS-/LVSA-Erlaubnisschein) schreibt fuer
   beide Arten 60 cm vor, staerker als das gesetzliche SächsFischVO-Mindestmaß von
   50 cm. Fuer AVS-/LVSA-Erlaubnisschein-Inhaber ist die Vereinsregel bindend - deshalb
   hier als durchgesetzter Wert hinterlegt, nicht die niedrigere Gesetzesuntergrenze.
   Ausnahme: Richter's Angelteich (Privatgewässer, siehe dortiger schonzeitInfo-Hinweis)
   - hat aber ohnehin nur Regenbogenforelle als Zielart, kein Konflikt. */
export const SCHON_SN = [
    { fisch: 'Äsche', von: [1, 1], bis: [6, 15], mm: '35 cm (SächsFischVO)' },
    { fisch: 'Hecht', von: [2, 1], bis: [4, 30], mm: '60 cm (LVSA-Gewässerordnung; gesetzl. SächsFischVO-Mindestmaß wäre 50 cm)' },
    { fisch: 'Zander', von: [2, 1], bis: [5, 31], mm: '60 cm (LVSA-Gewässerordnung; gesetzl. SächsFischVO-Mindestmaß wäre 50 cm)' },
    { fisch: 'Bachforelle', von: [10, 1], bis: [4, 30], mm: '28 cm' },
    { fisch: 'Regenbogenforelle', von: [10, 1], bis: [4, 30], mm: '25 cm (nur Fließgewässer)' },
    { fisch: 'Karpfen', von: null, bis: null, mm: '40 cm' },
    { fisch: 'Schleie', von: null, bis: null, mm: '25 cm (keine Schonzeit in SN)' },
    { fisch: 'Aal', von: null, bis: null, mm: '50 cm' },
    { fisch: 'Barsch', von: null, bis: null, mm: '– (LVSA: max. 10/Tag)' },
    /* Döbel (4 Mulde-/Flöha-Spots) und Brachse (Saidenbach/Rauschenbach/Schlüsselteich)
       fehlten hier komplett, obwohl beide Zielart an mehreren Spots sind - dieselbe Luecke
       wie bei Gießen/Döbel (siehe dortiger Fix). Fangbuch zeigte bislang faelschlich
       "keine Daten vorliegen". */
    { fisch: 'Döbel', von: null, bis: null, mm: 'ab 25 cm, keine Schonzeit' },
    { fisch: 'Brachse', von: null, bis: null, mm: '– (kein gesetzl. Maß, keine Schonzeit)' }
];
/* ============ Region: Mecklenburgische Kleinseenplatte (recherchiert 07/2026) ============ */
export const SPOTS_MV = [
    { name: 'Woblitzsee', motor: 'verbrenner', schleppen: false, wasser: 'see-flach', trueb: true, zugang: 'ufer',
        rig: 'Stahl- oder Titanvorfach Pflichtprogramm (Hechtdichte!), H-Rute 40–80 g fürs Zanderjiggen, Echolot fürs Boot.', nr: 'Obere Havel', cat: 'raub', arten: ['Hecht', 'Zander', 'Barsch', 'Aal', 'Karpfen', 'Schleie', 'Brachse'],
        lat: 53.3001, lng: 13.0102,
        fisch: 'Hecht, Zander, Barsch, Aal, Karpfen, Schleie, Brachse (14 gemeldete Arten)',
        methode: 'Vom verankerten Boot: Gummifisch an den Havel-Rinnen auf Zander, große Köder an Schilfkanten auf Hecht. Schleppen verboten!',
        karte: 'Angelkarte Seenfischerei Obere Havel – online (fischerei-wesenberg.de) oder Fischereihof Wesenberg',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'H-Spinnrute 40–80 g, 2,40–2,70 m', koeder: 'Gummi 12–19 cm, Swimbaits; im Kraut Weedless-Montagen', jig: '10–17 g über Kraut, 17–28 g an den Kanten', vorfach: 'Titan oder 7×7-Stahl 40 cm – bei dieser Hechtdichte Pflicht', zugang: 'Vom Ufer machbar (Stege, Schilfkanten); ein Belly-Boat erweitert den Radius deutlich', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Hohe Hechtdichte + Krautfelder. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Ø nur 1,6 m tief, Max. 7 m! Havel durchfließt den See, im Sommer viel Hausboot-Verkehr. Uferangeln laut Luftbild fast nur an Buhne (Campingpark) und Stadtufer Wesenberg möglich – sonst durchgehender Schilfgürtel, Scharkante weit dahinter: Boot + Echolot.',
        hotspots: [
            { name: 'Havel-Einlauf & 7-m-Kuhle', saison: 'Jun–Sep + Winter (tiefste Stelle)', lat: 53.3070, lng: 13.0040, tipp: 'DIE Stelle: tiefste Kuhle des Sees (7 m) direkt vor der Havel-Einmündung am Campingpark Havelberge. Zander tagsüber an der 5–7-m-Kante. UFER-TIPP: Die gepflasterte Buhne ist einer von nur zwei schilffreien Uferzugängen am See – abends Aal, Barsch.' },
            { name: 'Halbinsel am Ostufer', saison: 'Mai–Okt', lat: 53.2990, lng: 13.0180, tipp: 'Trennt Nord- und Südbecken. Hecht und Karpfen laut Fangmeldungen am besten südlich der Halbinsel – Kanten mit flach laufenden Wobblern abklopfen.' },
            { name: 'Kammerkanal-Mündung', saison: 'Jun–Aug, nachts', lat: 53.3090, lng: 13.0280, tipp: 'Kanal Richtung Zierker See – bekannt für seinen Welsbestand. Abends raubende Barsche entlang der Stege. Lage ungefähr.' },
            { name: 'Ufer: Stadtufer/Havel-Auslauf Wesenberg', saison: 'Mai–Okt, abends', lat: 53.2890, lng: 13.0010, tipp: 'Zweiter schilffreier Uferzugang (Luftbild): Stadtufer und Hafenumfeld Wesenberg. Aal-Strecke am Abend, Barsch an den Stegen. Achtung: 100 m Mindestabstand zur Schleuse!' }
        ], warn: false },
    { name: 'Zotzensee', schleppen: false, wasser: 'see-flach', trueb: true, zugang: 'boot',
        rig: 'Hechtcombo 30–80 g, Stahlvorfach, Weedless-Montagen fürs Kraut – Boot ist Pflicht.', nr: 'Obere Havel', cat: 'raub', arten: ['Hecht', 'Barsch', 'Aal', 'Schleie'],
        lat: 53.2437, lng: 12.8125,
        fisch: 'Hecht, Barsch, Aal, Schleie',
        methode: 'Flacher, krautiger Hechtsee: Spinnerbait/Jerkbait über Kraut, Westbuchten mit Ankerplätzen',
        karte: 'Angelkarte Obere Havel (Meisterbereich Mirow, Tel. 039833 20423)',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'H-Spinnrute 30–80 g', koeder: 'Gummi 12–16 cm, Weedless-Rigs, Chatterbaits über dem Kraut', jig: '7–14 g (flach, krautig) – so leicht wie möglich', vorfach: 'Titan/Stahl 40 cm (Hechtwasser)', zugang: 'Boot nötig – die Krautfelder und Rinnen sind vom Ufer nicht erreichbar', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Flacher Krautsee: hängerarme Montagen schlagen Gewicht. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Reines Bootsrevier: Wald bis ans Wasser, laut Luftbild keine freien Uferzugänge. Wasser eher trüb, Wald teils überflutet – Mückenschutz einpacken. Schleusenpassage ab Mirow.',
        hotspots: [
            { name: 'Westbuchten', saison: 'Mai–Okt', lat: 53.2450, lng: 12.8050, tipp: 'Ruhige Ankerbuchten am Westufer – Hecht über und an den Krautfeldern, Spinnerbait/Chatterbait flach geführt. Lage ungefähr.' }
        ], warn: false },
    { name: 'Vilzsee', motor: 'verbrenner', schleppen: false, wasser: 'see-flach', zugang: 'boot',
        rig: 'Mittlere Spinnrute, Stahlvorfach, flachlaufende Köder – Polbrille fürs Sichtangeln im klaren Wasser.', nr: 'Obere Havel', cat: 'raub', arten: ['Hecht', 'Barsch', 'Schleie'],
        lat: 53.2099, lng: 12.8336,
        fisch: 'Hecht, Barsch, Schleie',
        methode: 'Flach, Seerosenfelder: flachlaufende Wobbler und Spinnerbaits an den Kanten VOR den Feldern (Felder selbst tabu)',
        karte: 'Angelkarte Obere Havel (Meisterbereich Mirow)',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'Spinnrute 20–60 g', koeder: 'Flachlaufende Wobbler, Spinnerbaits, Gummi 10–14 cm', jig: '7–14 g', vorfach: 'Stahl/Titan 40 cm', zugang: 'Boot; Polbrille ist hier Pflichtausrüstung für die Krautkanten', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Sichttiefe hoch – Köder flach führen, Kanten mit Polbrille lesen. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Klares, flaches Wasser – Sichtangeln möglich, Raubvogel-Revier.', warn: false },
    { name: 'Großer Labussee', motor: 'verbrenner', schleppen: false, wasser: 'see-tief', zugang: 'boot',
        rig: 'Zander-Jigrute 15–50 g, FC 0,40+ oder dünner Stahl, DropShot-Setup für die Barschtrupps.', nr: 'Obere Havel', cat: 'raub', arten: ['Hecht', 'Zander', 'Barsch', 'Aal'],
        lat: 53.3067, lng: 12.9504,
        fisch: 'Hecht, Zander, Barsch, Aal',
        methode: 'Tieferes Havelbecken: Zander an Kanten und Löchern jiggen, Barschtrupps mit DropShot suchen',
        karte: 'Angelkarte Obere Havel (Meisterbereich Wesenberg)',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'Jigrute 15–50 g für Zander, dazu H-Rute 40–80 g für Hecht', koeder: 'Zander: No-Action-Shad 10–14 cm; Hecht: Gummi 15–19 cm', jig: '10–21 g an den Kanten, vertikal 15–28 g', vorfach: 'FC 0,40 mm für Zander, Titan/Stahl bei gezieltem Hechtangeln', zugang: 'Boot – die Zanderkanten liegen abseits des Ufers', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Zwei-Combo-Revier: Zanderkanten und Hechtflachwasser liegen dicht beieinander. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Ruhiger als der Woblitzsee, Übergang zum Useriner See (Nationalpark!).', warn: false },
    { name: 'Useriner See', nationalpark: true, schleppen: false, wasser: 'see-flach', trueb: true, zugang: 'boot',
        rig: 'Wie Woblitzsee: Stahlvorfach, Jigrute – dazu Driftsack/Anker (Schleppen verboten).', nr: 'Obere Havel / Müritz-NP', cat: 'raub', arten: ['Hecht', 'Zander', 'Barsch'],
        lat: 53.3431, lng: 12.9680,
        fisch: 'Hecht, Zander, Barsch',
        methode: 'Vom verankerten Boot an den Fahrwasser-Kanten; bei Wind schnell kabbelig (5,2 km lang)',
        karte: 'Angelkarte Obere Havel – Nationalpark-Regeln beachten',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'H-Spinnrute 40–80 g', koeder: 'Gummi 12–19 cm, große Blinker; Schleppen mit tieflaufenden Wobblern', jig: '14–21 g', vorfach: 'Titan/Stahl 40 cm', zugang: 'Boot; Driftsack oder Anker für kontrollierte Drift über den Kanten', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Schleppen ist hier effektiv – Driftkontrolle entscheidet. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Liegt im Müritz-Nationalpark: Schutzzonen und Befahrensregeln beachten, Uferbereiche teils gesperrt.', warn: true },
    { name: 'Mirower See', motor: 'verbrenner', schleppen: false, wasser: 'see-flach', trueb: true, zugang: 'ufer',
        rig: 'Vom Ufer: Spinnrute 10–40 g mit Stahlvorfach an den Stegen, nachts Grundrute mit Tauwurm auf Aal.', nr: 'Obere Havel', cat: 'raub', arten: ['Hecht', 'Zander', 'Barsch', 'Aal'],
        lat: 53.2826, lng: 12.8074,
        fisch: 'Hecht, Zander, Barsch, Aal',
        methode: 'Stadtnaher Allrounder: abends auf Zander an der Fahrrinne, Aal vom Ufer (Nachtangeln erlaubt)',
        karte: 'Angelkarte Obere Havel (Meisterbereich Mirow, Mühlenstr. 21)',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'Spinnrute 10–40 g (Ufer), nachts Grundrute für Aal', koeder: 'Gummi 10–14 cm, kleine Swimbaits; Aal: Tauwurm', jig: '7–17 g', vorfach: 'Stahl/Titan 40 cm am Tag, Aal-Vorfach nachts', zugang: 'Vom Ufer an Stegen und Kanten gut machbar – einer der wenigen echten Ufer-Seen hier', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Ufer-Revier mit Zander- und Aalpotenzial – Doppelnutzung Tag/Nacht. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Schlossinsel und Bootsverkehr – Randbereiche und frühe Stunden wählen.',
        hotspots: [
            { name: 'Ufer: Stadtufer & Schlossinsel', saison: 'Mai–Okt abends, Aal Jun–Aug', lat: 53.2720, lng: 12.8150, tipp: 'Bester Ufer-Spot der Kleinseenplatte (Luftbild): befestigtes Stadtufer mit vielen Stegen und der Schlossinsel-Brücke. Abends Barsch an den Stegen, nachts Aal – kurze Wege, kein Boot nötig.' }
        ], warn: false },
    { name: 'Drewensee', schleppen: false, wasser: 'see-flach', trueb: true, zugang: 'boot',
        rig: 'Allround-Raubfischcombo mit Stahlvorfach, Gummifische 10–14 cm für die Fahrrinnen-Kanten.', nr: 'Obere Havel', cat: 'raub', arten: ['Hecht', 'Zander', 'Barsch'],
        lat: 53.2600, lng: 13.0330,
        fisch: 'Hecht, Zander, Barsch',
        methode: 'Klassisches Ansitz- und Spinnrevier am Havelkanal Ahrensberg',
        karte: 'Angelkarte Obere Havel (Meisterbereich Ahrensberg, Tel. 039832 20230)',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'Allround-Raubfischrute 20–60 g', koeder: 'Gummifische 10–14 cm, Swimbaits; Barsch: 5–8 cm', jig: '10–21 g', vorfach: 'Stahl/Titan 40 cm', zugang: 'Boot – die fängigen Kanten liegen weit draußen', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Klassisches Kanten-Angeln, Echolot hilft beim Finden der Abbrüche. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Ruhiges Revier zwischen Wesenberg und Ahrensberg.', warn: false },
    { name: 'Rätzsee (bei Mirow/Canow)', motor: 'elektro', schleppen: false, wasser: 'see-tief', zugang: 'ufer', verif: 'B',
        rig: 'Vom Ufer an den erreichbaren Buchten: Spinnrute mit Stahlvorfach auf Hecht, DropShot auf Barsch; nur E-Motor auf dem Boot erlaubt.', nr: 'Obere Havel · Meisterbereich Canow/Mirow', cat: 'raub', arten: ['Hecht', 'Zander', 'Barsch', 'Aal', 'Schleie', 'Karpfen', 'Wels'],
        lat: 53.2870, lng: 12.8590,
        fisch: 'Hecht, Zander, Barsch, Aal, Schleie, Karpfen, Wels, Weißfisch (Artenangaben teils user-generated)',
        methode: '290-ha-Waldsee bis 20 m tief, sehr facettenreich mit Buchten/Kanälen/Halbinseln: Hecht an den Schilfkanten der Buchten, Zander an den tiefen Löchern und Steilkanten',
        karte: 'Angelkarte Obere Havel (Meisterbereich Canow Tel. 039828 20476 oder Mirow 039833 20423) – gilt für alle Seen des Verbunds',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'H-Spinnrute 40–80 g; für die Tiefe zusätzlich Vertikalrute', koeder: 'Gummi 12–19 cm; vertikal 10–14 cm No-Action-Shad', jig: '14–28 g an den Kanten, vertikal 20–35 g (bis 20 m!)', vorfach: 'Titan/Stahl 40 cm', zugang: 'Vom Ufer nur die Buchten erreichbar – die tiefen Bereiche brauchen ein Boot', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Tiefer See (bis ~20 m): im Sommer und Winter stehen die Fische tief, im Frühjahr in den Buchten. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Einer der wenigen Seen mit mehreren Uferzugängen: rund um den See führen Wege, das Ufer ist an einigen Stellen gut erreichbar (Nord: Zirtow, Süd: Fleether Mühle). Nur E-Motor erlaubt. Nachtangeln erlaubt. Riesiger Waldkomplex – Mückenschutz.',
        hotspots: [
            { name: 'Übergang zum Zirtowsee (Nordufer)', saison: 'Mai–Okt', lat: 53.3010, lng: 12.8630, tipp: 'Enge Verbindung zum Zirtowsee am Nordufer – Engstellen und Kanäle sind klassische Hecht- und Barschzüge. Vom Ufer bei Zirtow erreichbar. Lage ungefähr.' }
        ], warn: false },
    { name: 'Klenzsee (bei Canow)', motor: 'elektro', schleppen: false, wasser: 'see-tief', zugang: 'boot', verif: 'B',
        rig: 'Kräftige Spinn-/Baitcastrute für schwere Hechtköder + Stahlvorfach; Welsrute mit großem Köfi/Tauwurmbündel fürs Welsloch. Nur vom Boot sinnvoll.', nr: 'Obere Havel · Meisterbereich Canow', cat: 'raub', arten: ['Hecht', 'Zander', 'Barsch', 'Wels', 'Aal', 'Karpfen', 'Schleie'],
        lat: 53.2760, lng: 12.8990,
        fisch: 'Hecht, Zander, Barsch, Wels, Aal, Karpfen, Schleie, Weißfisch',
        methode: '73-ha-See bis 20 m tief, mit Gobenowsee per Kanal verbunden: Hecht an Seerosen/Schilfspitzen (Mai top), Zander an den Steilkanten und tiefen Löchern, Wels im „Welsloch". Kaum Uferstellen – Boot nötig, Schleppen verboten.',
        karte: 'Angelkarte Obere Havel (Fischereihof Canow Tel. 039828 20476) – Tageskarte ~12€, gilt für alle Verbund-Seen',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'Kräftige Spinn-/Baitcastrute 50–120 g (Wels!), dazu Jigrute 15–50 g für Zander', koeder: 'Große Gummis 15–25 cm, Swimbaits; Wels: Tauwurmbündel/Köderfisch am Grund', jig: '17–28 g, am Welsloch schwerer', vorfach: 'Titan/Stahl 40 cm; für Wels 0,50 mm FC oder Kevlar', zugang: 'Boot – Zanderberg und Welsloch liegen in der Seemitte', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Wels im Bestand: Gerät eine Klasse stärker wählen, Schnurfassung beachten. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Reines Bootsrevier (dichter Schilf-/Seerosengürtel, kaum Uferzugang). Nur E-Motor-/Ruderboot, Schlepp- und Driftangeln verboten. Nachtangeln erlaubt, 2 Ruten, max. 3 Edelfische/Tag.',
        hotspots: [
            { name: 'Zanderberg am Ostufer', saison: 'Mai–Okt, Dämmerung/Nacht', lat: 53.2730, lng: 12.9030, tipp: 'Gegenüber dem Kanal aus dem Gobenowsee, bei der Pappel-Gruppe am Ufer: ein sandiger Unterwasserberg nur Rutenlängen vom Schilf. Zander treiben abends/nachts ihre Beute den Hang hinauf. Lage ungefähr.' },
            { name: 'Welsloch (hinter der ersten Kurve)', saison: 'Sommernächte + Winter', lat: 53.2790, lng: 12.8960, tipp: 'In der Bucht steigt der Grund von 13 auf 3 m an; direkt hinter der ersten scharfen Kurve am rechten Ufer liegt ein 9-m-Loch mitten in der flachen Zone – bester Wels- und Winterzander-Platz. Großer Köderfisch oder Tauwurmbündel am Grund. Lage ungefähr.' }
        ], warn: false },
    { name: 'Großer Priepertsee', motor: 'verbrenner', schleppen: false, wasser: 'see-tief', zugang: 'boot', verif: 'B',
        rig: 'Zander-Jigrute 15–50 g für die tiefen Kanten (26 m!), Pilker gehen hier laut Ortsanglern gut; Stahlvorfach auf Hecht. Boot nötig.', nr: 'Obere Havel · Meisterbereich Ahrensberg', cat: 'raub', arten: ['Zander', 'Hecht', 'Barsch', 'Aal', 'Schleie', 'Wels', 'Karpfen'],
        lat: 53.2560, lng: 13.0180,
        fisch: 'Zander (sehr gut), Hecht, Barsch, Aal, Schleie, Wels, Karpfen, Weißfisch',
        methode: '104 ha, Ø ~8–10 m, nördlich von Priepert steil bis 26 m: als Zandergewässer bekannt. Havel-Einlauf (wird schnell tief) und die Steilkanten jiggen, Unterwasserberg am Nordende suchen',
        karte: 'Angelkarte Obere Havel (Fischereihof Ahrensberg Tel. 039832 20230) – Tageskarte ~12€, gilt für alle Verbund-Seen',
        kartenLinks: [{ label: 'Fischereihof Wesenberg', url: 'https://fischerei-wesenberg.de' }],
        tackle: { rute: 'Jigrute 15–50 g + Vertikalrute für die tiefen Kanten; bei gezieltem Wels 50–120 g', koeder: 'No-Action-Shad 10–14 cm; Pilker funktionieren an der Tiefenkante', jig: '17–28 g an den Kanten, vertikal 20–40 g (tiefster See der Strecke)', vorfach: 'FC 0,40–0,45 mm; Titan/Stahl bei Hechtbeifang', zugang: 'Boot mit Echolot – die Tiefenkante und der Havel-Einlauf sind das Ziel', farben: { fruehjahr: 'Naturdekore mit Kontrastpunkt (Barsch, roter Kopf) – klares Nachwinterwasser', sommer: 'Naturtöne (Rotauge, Barsch); über Kraut gern Weiß/Perlmutt', herbst: 'Kontrastreich (Feuertiger, Orange) – Hechte fressen sich Winterspeck an', winter: 'Dezente Naturtöne, kleine Köder, extrem langsam führen' }, warum: 'Tiefster See der Kleinseenplatte: Vertikalangeln an der Kante ist die Methode. Entnahmefenster (Hecht 55–85, Zander 55–75 cm): große Fische MÜSSEN zurück – großer Gummikescher, Abhakmatte, Hakenlöser und Einzelhaken-Umbau gehören ins Gepäck.' },
        note: 'Reges Wasserwander-/Hausbootrevier (Obere-Havel-Wasserstraße) – Dämmerung nutzen. ⚠ Wasserskistrecke auf dem See: markierten Bereich meiden. Kaum Uferstellen, Boot empfohlen. Schleppen verboten, Nachtangeln erlaubt.',
        hotspots: [
            { name: 'Havel-Einlauf (Nord, Richtung Wangnitzsee)', saison: 'ganzjährig, Zander top', lat: 53.2640, lng: 13.0170, tipp: 'Ortsangler-Tipp: gleich am Haveleinlauf wird es schnell tief – klassischer Zanderzug, auch beidseitig Richtung Wangnitzsee. Tiefste Stelle (26 m) liegt nördlich von Priepert. Lage ungefähr.' }
        ], warn: false },
    { name: 'Fischereihof Wesenberg', nr: 'Kartenausgabe', cat: 'info', arten: [],
        lat: 53.2817, lng: 12.9786,
        fisch: '– (Hofladen mit Fischverkauf)',
        methode: '–',
        karte: 'Angelkarten-Verkauf vor Ort, täglich 8–19 Uhr, Tel. 039832 20268',
        note: 'Zentrale Anlaufstelle der Seenfischerei Obere Havel: Karten, aktuelle Infos, Räucherfisch für die Heimfahrt.', warn: false }
];
export const SCHON_MV = [
    { fisch: 'Hecht', von: [2, 1], bis: [4, 30], mm: 'Entnahmefenster 55–85 cm · Stahlvorfach-Pflicht' },
    { fisch: 'Zander', von: [3, 15], bis: [6, 15], mm: 'Entnahmefenster 55–75 cm' },
    { fisch: 'Barsch', von: null, bis: null, mm: 'Entnahmefenster 25–40 cm' },
    { fisch: 'Karpfen', von: null, bis: null, mm: '50 cm' },
    { fisch: 'Aal', von: null, bis: null, mm: '50 cm (lokale Karte Obere Havel; EU-Aalschutz beachten)' },
    { fisch: 'Schleie', von: null, bis: null, mm: '25 cm' },
    { fisch: 'Wels', von: null, bis: null, mm: '90 cm' }
];
/* ============ Region: Rhein & Rheinhessen / Mainz (recherchiert 07/2026) ============ */
export const SPOTS_RLP = [
    { name: 'Rhein Mainz – Stadtstrecke', rlpFruehjahr: true, flussmitte: true, wasser: 'fluss', zugang: 'ufer', nr: 'LFV RLP · ~Strom-km 498–500', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Rapfen', 'Wels', 'Aal', 'Döbel', 'Brachse'],
        lat: 50.0010, lng: 8.2790,
        fisch: 'Zander, Barsch, Rapfen, Wels, Aal, Barbe, Döbel, Brassen – Grundel ist Hauptfutter',
        methode: 'Nachts flach laufende Wobbler an der Steinpackung (schlägt am Rhein oft den Gummi), tagsüber jiggen an Kanten',
        karte: 'Rheinischer Erlaubnisschein (~31 €/Jahr): <a href="https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/" target="_blank" rel="noopener">LFV Rheinland-Rheinhessen</a> oder Angelladen (z.B. Bode Heidesheim)',
        rig: 'Jigrute 30–60 g (Strömung!), Jigköpfe 10–30 g in Grundeldekoren, großer Bleikopf-Vorrat – die Steinpackungen fordern Tribut',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: 'Stadtufer stark frequentiert – die offensichtlichen Stellen sind überlaufen, Strecke machen zahlt sich aus. Wellenschlag der Schifffahrt: Ruten sichern!',
        hotspots: [
            { name: 'Theodor-Heuss-Brücke', saison: 'ganzjährig, top Okt–Dez', lat: 50.0060, lng: 8.2745, tipp: 'Der dokumentierte Zander-Klassiker der Stadt: um und hinter den Brückenpfeilern, beste Zeit Dämmerung und nachts. Viel Angeldruck – antizyklisch angeln (unter der Woche, sehr früh).' },
            { name: 'Rapfen-Spundwände', saison: 'Mai–Sep, ab ~16 Uhr', lat: 49.9960, lng: 8.2830, tipp: 'Rapfen treiben Kleinfisch an den Spundwänden in die Ecke – Sommer ab ca. 16 Uhr Oberflächenrauben, flach laufender schlanker Wobbler oder Spöket.' }
        ], warn: false },
    { name: 'Winterhafen Mainz', wasser: 'kanal', zugang: 'ufer', nr: 'Beschilderung!', cat: 'raub',
        arten: ['Barsch', 'Hecht', 'Rapfen', 'Wels', 'Zander'],
        lat: 49.9926, lng: 8.2854,
        fisch: 'Barsch, Hecht, Rapfen, Wels, Zander, Rotauge (Fangmeldungen)',
        methode: 'Spinnfischen an Spundwänden und Stegen, strömungsberuhigt – gut bei Hochwasser, wenn die Buhnen weg sind',
        karte: 'Rheinischer Erlaubnisschein – Angeln nur in ausgeschilderten Bereichen!',
        rig: 'Barschrute 5–21 g reicht im Hafen, Finesse-Montagen an den Wänden entlang',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: 'Nur teilweise freigegeben und es gab wiederholt Ärger – Beschilderung genau prüfen, im Zweifel weiterziehen. Viele Schaulustige.', warn: true },
    { name: 'Industriehafen Mombach – Hafenausfahrt', wasser: 'kanal', zugang: 'ufer', nr: '~Strom-km 503 · nur Ausfahrt', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Aal', 'Brachse', 'Wels'],
        lat: 50.0310, lng: 8.2210,
        fisch: 'Zander, Barsch, Aal, Brassen, Wels',
        methode: 'Jiggen in der Hafenausfahrt (Zander-Klassiker bei trübem Wasser/Hochwasser), Feederstrecke im Industriegebiet',
        karte: 'Rheinischer Erlaubnisschein – Angeln NUR im Bereich der Hafenausfahrt',
        rig: 'Zander-Jigrute, Gummis 10–12 cm V-Tail natur; abends Grundrute mit Tauwurm auf Aal',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: 'Schild auf der Bauhaus-Seite markiert den Beginn des Angelverbots – dahinter ist Schluss. Stromab beginnt das NSG Mombacher Rheinufer (ganzjährig verboten).',
        hotspots: [
            { name: 'Hinter dem Bauhaus', saison: 'ganzjährig', lat: 50.0305, lng: 8.2200, tipp: 'Zugänglicher Klassiker am erlaubten Ausfahrtsbereich – Ansitz und Raubfisch, entsprechend frequentiert.' },
            { name: 'Auspitze Ingelheimer Aue', saison: 'Okt–Mär + Hochwasser', lat: 50.0370, lng: 8.2340, tipp: 'Die Spitze der Insel an der Hafenausfahrt – Strömungskante trifft Stillwasser, klassischer Zanderzug. Lage ungefähr.' }
        ], warn: true },
    { name: 'Buhnen & Rampen Budenheim', rlpFruehjahr: true, flussmitte: true, wasser: 'fluss', zugang: 'ufer', nr: 'LFV RLP · ~Strom-km 506–508', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Döbel', 'Aal', 'Brachse'],
        lat: 50.0295, lng: 8.1675,
        fisch: 'Zander, Barsch, Barbe, Döbel, Aal, Brassen',
        methode: 'Buhnenkessel systematisch abklopfen; nachts Wobbler flach über die Buhnenköpfe – strömungsberuhigte Taschen hinter den Rampen für die Pose',
        karte: 'Rheinischer Erlaubnisschein',
        rig: 'Jigköpfe 15–30 g je nach Strömung; fürs Posenangeln hinter den Rampen leichte Matchrute',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: '⚠ Dieser Abschnitt liegt genau ZWISCHEN zwei Angelverboten: stromauf endet das NSG Mombacher Rheinufer bei km 506,0, stromab beginnt das NSG Haderaue-Königsklinger Aue bei km 508,0 (dort ganzjährig verboten). Die km-Marken der Karte sind nur auf ±~300 m genau – im Grenzbereich also Beschilderung und Erlaubnisschein prüfen. Zwei Rampen an der chemischen Fabrik plus eine kleine stromauf – die ruhigen Bereiche dahinter sind die Friedfisch-Geheimecken. Parkplatz am Kiosk Rheinblick.', warn: true },
    { name: 'Altrhein Heidenfahrt', rlpFruehjahr: true, wasser: 'see-flach', zugang: 'ufer', verif: 'B', nr: '~Strom-km 512 · Sommersperre', cat: 'fried',
        arten: ['Zander', 'Barsch', 'Hecht', 'Karpfen', 'Schleie', 'Brachse', 'Aal'],
        lat: 50.0121, lng: 8.1021,
        fisch: 'Zander, Barsch, Hecht, Karpfen, Schleie, Brassen, Aal',
        methode: 'Strömungsberuhigt: Pose und Grund auf Friedfisch, am Altrhein-Ausgang Raubfisch',
        karte: 'Rheinischer Erlaubnisschein – im NSG-Band km 511,0–512,5 nur Handangel und nur 01.09.–31.05.',
        rig: 'Feeder/Pose fürs Stillwasser, Spinnrute für den Ausgang zum Strom',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: '⚠ Die kursierenden Berichte über eine „Sperrung bis 31.08." haben eine amtliche Grundlage: Im NSG Haderaue-Königsklinger Aue ist in km 511,0–512,5 die Handangel nur vom 1. September bis 31. Mai erlaubt – von Juni bis August also dicht. Stromauf (km 508,0–511,0) ist die Fischerei ganzjährig verboten. Dieser Spot liegt berechnet bei ~km 512 (±~300 m), also im Randbereich – Beschilderung und Erlaubnisschein sind maßgeblich. Badestrand nebenan = Sommer-Trubel.', warn: true },
    { name: 'Hafen & Buhnen Oppenheim', rlpFruehjahr: true, flussmitte: true, wasser: 'fluss', zugang: 'ufer', nr: 'LFV RLP · ~Strom-km 480', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Wels', 'Aal', 'Brachse'],
        lat: 49.8594, lng: 8.3575,
        fisch: 'Zander, Barsch, Wels, Aal, Brassen, Barbe',
        methode: 'Hafeneinfahrt jiggen, Buhnenfeld stromauf/stromab ablaufen – weniger Druck als in Mainz',
        karte: 'Rheinischer Erlaubnisschein',
        rig: 'Rhein-Standard: Jigrute 30–60 g, Grundelfarben; Welsrute lohnt als zweite Rute',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: 'Gut kombinierbar: Hafeneinfahrt bei Hochwasser, Buhnen bei Normalpegel. Marina-Bereich respektieren.', warn: false },
    { name: 'Rhein Nackenheim & Mühlarm', rlpFruehjahr: true, flussmitte: true, wasser: 'fluss', zugang: 'ufer', verif: 'B', nr: 'LFV RLP · ~km 490–492', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Rapfen', 'Wels', 'Hecht', 'Aal', 'Brachse'],
        lat: 49.9558, lng: 8.3360,
        fisch: 'Zander, Barsch, Rapfen, Wels, Hecht, Aal, Brassen (Artenangaben teils user-generated)',
        methode: 'Buhnen im Hauptstrom auf Zander/Rapfen; der strömungsberuhigte Mühlarm zwischen Ufer und Inseln als Schlechtwetter-/Hochwasser-Alternative',
        karte: 'Rheinischer Erlaubnisschein (LFV Rhl.-Rhh.) – Ausgabestelle u.a. Angelsport Reika, Hauptstr. 55, Eich (Tel. 06246 904605)',
        rig: 'Rhein-Standard: Jigrute 30–60 g mit Grundeldekoren; im Mühlarm reicht leichteres Gerät und Posen-/Grundmontage',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: '⚠ WICHTIG: Die Rheininseln Kisselwörth & Sändchen sind Naturschutzgebiet mit WECHSELNDEN Handangel-Sperren – auf Kisselwörth 16.07.–29.02. verboten, auf Sändchen 10.03.–15.07. verboten. Der Mühlarm (Ufer neben B9) und das befestigte Hauptstromufer sind alle 100–200 m an Treppen/Bootsrampen zugänglich. Zufahrt/Parken über Rheinstraße Nackenheim.',
        hotspots: [
            { name: 'Mühlarm bei der B9', saison: 'ganzjährig, top bei Hochwasser', lat: 49.9585, lng: 8.3345, tipp: 'Strömungsberuhigter Nebenarm zwischen Ufer und den Inseln – ideal wenn der Hauptstrom bei Hochwasser unfischbar wird. Viele Bootsstege, Friedfisch und Zander. Inselseite wegen NSG-Sperren meiden!' }
        ], warn: true },
    { name: 'Buhnen Gimbsheim–Ibersheim', rlpFruehjahr: true, flussmitte: true, wasser: 'fluss', zugang: 'ufer', verif: 'B', nr: 'LFV RLP · km ~453–460', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Wels', 'Aal', 'Barbe', 'Brachse', 'Karpfen'],
        lat: 49.7250, lng: 8.4340,
        fisch: 'Zander (kapital, 3–7 Pfd berichtet), Barsch, Wels, Aal, Barbe, Brassen, Karpfen',
        methode: 'Langes Buhnenfeld gegenüber AKW Biblis: Zander mit totem Köderfisch am Grund an der Buhnenkante (schlägt hier oft Gummi), Feeder auf Brassen/Barbe im ruhigen Buhnenbecken, nachts Aal/Wels an der Steinschüttung',
        karte: 'Rheinischer Erlaubnisschein (LFV Rhl.-Rhh.) – Ausgabestellen im Raum Worms/Eich',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: '⚠ NICHT verwechseln mit dem Eich/Gimbsheimer Altrhein – die ~300 ha Schilffläche ist NSG (Angeln dort verboten)! Gemeint sind die RHEIN-Buhnen östlich der B9. Zugang über Leinpfad/Krippenweg. Bei Buhnenkopf-Strudeln Vorsicht. Pegel Worms/Mainz prüfen: bei Hochwasser Buhnen überspült, dann vom Ufer vor der Steinschüttung.',
        hotspots: [
            { name: 'Ibersheim gegenüber AKW Biblis', saison: 'Okt–Mär + warme Winternächte', lat: 49.7050, lng: 8.4460, tipp: 'Gegenüber/unterhalb des Kraftwerks berichten Ortsangler durchschnittlich 7-Pfd-Zander – toter Köderfisch am Grund. Oberhalb feiner mit Gummi an die Buhnenkante. Lage ungefähr (km ~455).' },
            { name: 'Buhne an der Natorampe (Gimbsheim)', saison: 'Mai–Okt', lat: 49.7380, lng: 8.4290, tipp: 'Große Buhne, Futterkorb bringt Massen an Brassen und kleinere Barben; gute Barsche. Achtung Hänger (Totholz). Von Oppenheim aus die ersten, vom Eicher See aus die letzten Buhnen. Lage ungefähr.' }
        ], warn: true },
    { name: 'Mainspitze & Maaraue', wasser: 'fluss', zugang: 'ufer', nr: 'Mainmündung km 496,6 · HESSEN!', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Wels', 'Rapfen', 'Aal'],
        lat: 49.9937, lng: 8.2940,
        fisch: 'Zander, Barsch, Wels, Rapfen, Aal',
        methode: 'Die Mündung des Mains in den Rhein: Strömungskanten, Kehrwasser – Zander-Dauerbrenner laut Lokalmatadoren',
        karte: 'Hessischer Rheinschein – seit 2025 NUR online: <a href="https://www.hejfish.com" target="_blank" rel="noopener">hejfish.com</a> (HLG)',
        rig: 'Jigrute + nachts Wobbler; vor der Maarauespitze liegt ein Steinwall unter Wasser (Boot: ankern, Hängergefahr)',
        kartenLinks: [{ label: 'hejfish (Hessen, online)', url: 'https://www.hejfish.com' }],
        note: 'Grenze RLP/Hessen: Fußgängerbrücke zur Maaraue. Die Maarauespitze selbst ist Polizeigelände und unzugänglich – dort raubt es sichtbar, erreichbar ist der Bereich davor.', warn: true },
    { name: 'Ginsheimer Altrhein & Mündung', wasser: 'see-flach', zugang: 'ufer', nr: '~km 487–493 · HESSEN!', cat: 'raub',
        arten: ['Zander', 'Wels', 'Barsch', 'Hecht', 'Karpfen'],
        lat: 49.9440, lng: 8.3524,
        fisch: 'Zander, Wels, Barsch, Hecht, Karpfen',
        methode: 'Der Altrhein für Ansitz, die Mündung in den Strom als dokumentierter Zander- und Wels-Hotspot',
        karte: 'Hessischer Rheinschein – online über <a href="https://www.hejfish.com" target="_blank" rel="noopener">hejfish.com</a>',
        rig: 'Wels-tauglich: 0,50er FC oder Stahl an der Mündung, Abrissmontage mit Tauwurm/Tintenfisch',
        kartenLinks: [{ label: 'hejfish (Hessen, online)', url: 'https://www.hejfish.com' }],
        note: 'Anfahrt über Trebur/Steindamm oder Fähre Ginsheim. Teils flach und verkrautet.',
        hotspots: [
            { name: 'Treburer Buhnenfeld (km 487–493)', saison: 'Jun–Okt bei Normalpegel', lat: 49.9550, lng: 8.3250, tipp: '6 km Buhnenfeld auf der Nonnenaue – Fahrrad mitnehmen und Kilometer machen, die hinteren Buhnen sehen kaum Angler. Lage ungefähr, hessischer Schein nötig.' }
        ], warn: true },
    { name: 'Eicher See', rlpFruehjahr: true, wasser: 'see-tief', zugang: 'ufer', nr: 'Anglervereinigung Worms', cat: 'raub',
        schonzeitInfo: 'Vereinsbestimmungen der AVW gelten zusätzlich zur FischGDV – Karte genau lesen.',
        arten: ['Zander', 'Hecht', 'Wels', 'Barsch', 'Karpfen', 'Schleie', 'Aal', 'Brachse'],
        lat: 49.7646, lng: 8.4290,
        fisch: 'Zander, Hecht, Wels, Barsch, Karpfen, Schleie, Aal, Brassen, Giebel',
        methode: '58-ha-Baggersee bis 15 m tief: Zander an den Scharkanten tief jiggen, Wels nachts, Hecht an den Flachzonen der Wochenendhaus-Seite',
        karte: 'Gastkarten FREI erhältlich (kein Verein nötig): Sportgeschäft Volltreffer, Hauptstr. 17, Eich (Tel. 06246 8589040, Mo–Fr 10–13 &amp; 15–18, Sa 10–14) oder Angelsport Engert, Worms (Tel. 06241 593036) – Bewirtschafter: <a href="https://www.avw1924.de/gew%C3%A4sserkarten" target="_blank" rel="noopener">Anglervereinigung Worms 1924</a>',
        rig: 'Tiefwasser-Setup: Jigköpfe bis 30 g, Vertikal-tauglich vom Boot; Welsrute mit 0,60er FC als Nachtoption',
        kartenLinks: [{ label: 'Anglervereinigung Worms', url: 'https://www.avw1924.de/gew%C3%A4sserkarten' }],
        note: 'Das Raubfisch-Stillgewässer Rheinhessens (~30 Autominuten): direkte Rheinverbindung, dadurch Wels- und Zanderbestand. An der Marina (Familie Luy) ist ein Angelkahn für 4 Personen mietbar – bei 15 m Tiefe die beste Option. Sommer: Badebetrieb, Randzeiten nutzen.', warn: false },
    { name: 'Altrheinsee Eich', wasser: 'see-flach', zugang: 'ufer', nr: 'Ortsgemeinde Eich', cat: 'fried',
        arten: ['Karpfen', 'Schleie', 'Hecht', 'Barsch', 'Aal', 'Brachse'],
        lat: 49.7596, lng: 8.4036,
        fisch: 'Karpfen, Schleie, Hecht, Barsch, Aal, Brassen',
        methode: 'Klassisches Ansitzangeln am klaren Badesee',
        karte: 'Angelkarte bei der Ortsgemeinde Eich (Tel. 06246-276) – 15 € Gastgebühr nur in Begleitung eines Eicher Bürgers!',
        rig: 'Feeder/Pose; klares Wasser: feine Vorfächer',
        note: 'Sehr restriktive Gastregelung – ohne Eicher Begleitung keine Karte. Eher Ergänzung zum Eicher See nebenan. Parken kostenpflichtig.', warn: true },
    { name: 'Angelsee Wörrstadt-Wallertheim', wasser: 'see-flach', verif: 'C', nr: 'AV Wörrstadt/Wallertheim · Rheinhessen-Binnenland', cat: 'raub',
        arten: ['Zander', 'Hecht', 'Wels', 'Barsch', 'Rapfen', 'Karpfen', 'Schleie', 'Aal'],
        lat: 49.83737, lng: 8.04023,
        fisch: 'Zander, Hecht, Wels, Barsch, Rapfen, Karpfen, Schleie, Aal, Weißfische',
        methode: 'Baggersee im rheinhessischen Hügelland bei Wallertheim (bei Wörrstadt). Guter Raubfischbestand mit Zander, Hecht und Wels. Der stärkste Binnenland-Standort abseits des Rheins – Spinnfischen an den Kanten, Ansitz auf Karpfen/Schleie.',
        karte: 'Erlaubnisschein AV Wörrstadt/Wallertheim 1978 e.V. (angelverein-woerrstadt-wallertheim.de). Gastkartenmodalitäten beim Verein erfragen',
        kartenLinks: [{ label: 'AV Wörrstadt/Wallertheim', url: 'https://www.angelverein-woerrstadt-wallertheim.de' }],
        note: '⚠ Datenlage zur Größe/Tiefe uneinheitlich (verif C): eine Quelle nennt ~67 ha/15 m, andere führen es als kleineren Teich – vor Anfahrt Größe und Gastkartenausgabe beim Verein klären. Koordinate = Vereinsgelände Wallertheim. Vereinsspezifische Entnahmefenster möglich (in RLP bei Vereinsseen üblich).',
        hotspots: [], warn: true, zugang: 'ufer' },
    { name: 'Niederrheinsee Gimbsheim', wasser: 'see-flach', verif: 'B', nr: 'Rheinhessen · bei Gimbsheim/Alsheim', cat: 'raub',
        arten: ['Zander', 'Hecht', 'Karpfen', 'Barsch', 'Schleie', 'Aal'],
        lat: 49.77419, lng: 8.38029,
        fisch: 'Zander, Hecht, Karpfen, Barsch, Schleie, Aal, Weißfische',
        methode: 'Klarer Baggersee südlich des Eicher Sees, als Zander- und Karpfengewässer bekannt. Sehr klares Wasser – feine Vorfächer, in der Dämmerung/Nacht auf Zander an den Kanten.',
        karte: 'Erlaubnisschein über den bewirtschaftenden Verein – Modalitäten vor Ort/online (hejfish) prüfen',
        note: '⚠ Freizeit-/Badesee: im Sommer tagsüber stark genutzt (sehr klares Wasser, beliebt zum Baden) – Dämmerung und Randsaison sind fängiger. Nicht mit dem benachbarten Eicher See verwechseln.',
        hotspots: [], warn: true, zugang: 'ufer' },
    { name: 'Selz-Mündung Ingelheim', rlpFruehjahr: true, wasser: 'fluss', verif: 'B', nr: 'Selz · Mündung in den Rhein bei Frei-Weinheim', cat: 'raub',
        arten: ['Döbel', 'Barsch', 'Hecht', 'Aal', 'Rapfen', 'Karpfen', 'Brachse'],
        lat: 49.99560, lng: 8.05340,
        fisch: 'Döbel, Barsch, Hecht, Aal, Rapfen, Karpfen, Brassen, Weißfische',
        methode: 'Der zentrale Fluss Rheinhessens mündet bei Frei-Weinheim/Ingelheim in den Rhein. Der Mündungsbereich ist eine Strömungskante mit Mischbestand – kleine Spinnköder auf Döbel/Barsch/Rapfen, Grund auf Aal.',
        karte: 'Pfälzer Rheinkarte (LFV RLP) für den Rheinabschnitt; die Selz selbst über den örtlichen Verein. ⚠ NSG „Fulder Aue–Ilmen Aue" und „Sandaue" = Angelverbot!',
        kartenLinks: [{ label: 'LFV RLP – Rheinkarte', url: 'https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/' }],
        note: '⚠ Rund um die Mündung liegen Naturschutzgebiete mit Angelverbot (Fulder Aue–Ilmen Aue, Sandaue) – Beschilderung genau beachten. Die kleine Selz führt bei Trockenheit wenig Wasser.',
        hotspots: [], warn: true, zugang: 'ufer' },
    { name: 'Angelsee ASV Seerose Ober-Olm', wasser: 'see-flach', verif: 'C', nr: 'ASV Seerose Ober-Olm 1980 · bei Nieder-Olm', cat: 'fried',
        arten: ['Karpfen', 'Schleie', 'Zander', 'Rotauge', 'Rotfeder', 'Karausche', 'Regenbogenforelle'],
        lat: 49.91821, lng: 8.19599,
        fisch: 'Karpfen, Schleie, Zander, Rotauge, Rotfeder, Karausche, (Regenbogenforelle-Besatz)',
        methode: 'Kleiner, gepflegter Vereinssee (2.700 m² Wasserfläche) im Selztal bei Ober-Olm. Winterpause 26.11.–5.3. (Gewässer gesperrt). Klassisches Friedfisch-Ansitzangeln, gelegentlich Forellenbesatz. Familienfreundlich, ruhig.',
        karte: 'Erlaubnisschein ASV Seerose Ober-Olm 1980 e.V. – Gastkarten beim Verein erfragen',
        kartenLinks: [{ label: 'ASV Seerose – Angelweiher', url: 'https://asvseerose.de/Unser-Angelweiher' }],
        note: '⚠ Kleiner Vereinsteich (verif C): eher Friedfisch/Ansitz, kein großes Raubfischrevier. Vereinsgelände mit Bewirtung. Jugendfreundlich, aber Gastregelung vorab klären.',
        hotspots: [], warn: false, zugang: 'ufer' },
    { name: 'Zollhafen Mainz', nr: 'VERBOTEN', cat: 'sperr', arten: [],
        lat: 50.0125, lng: 8.2633,
        fisch: '—', methode: '—', karte: 'Angeln im Zollhafen ist verboten',
        note: 'Trotz verlockender Optik: komplett gesperrt. Kontrollen im Neubaugebiet sind häufig.', warn: true },
    { name: 'Schiersteiner Hafen', verif: 'B', nr: 'VERBOTEN', cat: 'sperr', arten: [],
        lat: 50.0410, lng: 8.1960,
        fisch: '—', methode: '—', karte: 'Seit 2005 komplett gesperrt',
        note: 'Verbot der Stadt Wiesbaden wegen Schadstoffbelastung – Gesundheitsgefahr, gilt bis zur Mündung in den Rhein. Lage ungefähr.', warn: true },
    { name: 'NSG Mombacher Rheinufer', verif: 'B', nr: 'VERBOTEN · Strom-km 505,4–506,0', cat: 'sperr', arten: [],
        lat: 50.0229, lng: 8.1883,
        fisch: '—', methode: '—', karte: 'Naturschutzgebiet – Angelverbot laut Rechtsverordnung',
        note: 'Amtlich (SGD Süd, Stand 2025): „Im Naturschutzgebiet ist es verboten: an den Stillgewässern sowie am Rheinufer zwischen Rhein-km 505,4 und 506,0 zu angeln." Gilt also für den Uferabschnitt UND alle Stillgewässer im NSG. ⚠ Markerlage ist berechnet (±~300 m) – maßgeblich sind die Strom-km der Rechtsverordnung, nicht die Karte. Einsicht: Untere Naturschutzbehörde KV Mainz-Bingen, Ingelheim.', warn: true },
    { name: 'NSG Haderaue-Königsklinger Aue', verif: 'B', nr: 'VERBOTEN · Strom-km 508,0–511,0', cat: 'sperr', arten: [],
        lat: 50.0168, lng: 8.1398,
        fisch: '—', methode: '—', karte: 'Ganzjähriges Angelverbot km 508,0–511,0',
        note: 'Amtlich (SGD Süd, Stand 2025): Fischerei zwischen Strom-km 508,0 und 511,0 am Rhein und Altrhein sowie am Gewässer „Krappen" (Haderaulache) ganzjährig verboten. Erlaubt ist die Handangel vom 1. September bis 31. Mai in km 511,0–512,5 (Rhein und Altrhein) – im Sommer also auch dort dicht. ⚠ Markerlage berechnet (±~300 m) – maßgeblich sind die Strom-km.', warn: true },
    { name: 'NSG Kisselwörth und Sändchen', verif: 'B', nr: 'VERBOTEN (saisonal) · Inseln bei Nackenheim', cat: 'sperr', arten: [],
        lat: 49.9620, lng: 8.3450,
        fisch: '—', methode: '—', karte: 'Handangel auf den Inseln saisonal verboten',
        note: 'Amtlich (SGD Süd, Stand 2025): Handangeln verboten auf der Insel Kisselwörth vom 16.07.–28.(29.)02. und auf der Insel Sändchen vom 10.03.–15.07. Die beiden Rheininseln liegen östlich von Nackenheim, vom Ufer durch den Mühlarm getrennt – das Verbot gilt AUF den Inseln; vom Nackenheimer Ufer/Mühlarm aus ist es nicht berührt. ⚠ Markerlage ungefähr.', warn: true }
];
export const SCHON_RLP = [
    { fisch: 'Hecht', von: [2, 1], bis: [5, 31], mm: '50 cm' },
    { fisch: 'Zander', von: [3, 15], bis: [5, 15], mm: '45 cm' },
    { fisch: 'Barsch', von: null, bis: null, mm: '– (kein Maß; Rücksetzverbot!)', ruecksetzverbot: true },
    { fisch: 'Aal', von: [10, 1], bis: [3, 1], mm: '50 cm (Aalfangverbot 01.10.–01.03. im Rhein, Stillgewässern & Häfen)' },
    { fisch: 'Barbe', von: [5, 1], bis: [6, 15], mm: '35 cm' },
    { fisch: 'Äsche', von: [2, 15], bis: [4, 30], mm: '30 cm' },
    { fisch: 'Bachforelle', von: [10, 15], bis: [3, 15], mm: '25 cm' },
    { fisch: 'Karpfen', von: null, bis: null, mm: '35 cm' },
    { fisch: 'Schleie', von: null, bis: null, mm: '25 cm' },
    { fisch: 'Wels', von: null, bis: null, mm: '– (kein Maß; Rücksetzverbot!)', ruecksetzverbot: true },
    { fisch: 'Brachse', von: null, bis: null, mm: '– (kein Maß; Rücksetzverbot!)', ruecksetzverbot: true },
    { fisch: 'Rotauge', von: null, bis: null, mm: '15 cm' },
    { fisch: 'Rotfeder', von: null, bis: null, mm: '15 cm' },
    { fisch: 'Karausche', von: [1, 1], bis: [12, 31], mm: '– (ganzjährig geschont, Fang nicht ausüben)' },
    { fisch: 'Quappe', von: [1, 1], bis: [12, 31], mm: '– (ganzjährig geschont, Fang nicht ausüben)' },
    { fisch: 'Rapfen', von: null, bis: null, mm: '– (RLP: keine Schonzeit/kein Maß, Vereinsregeln prüfen)' }
];
/* ============ Regionsdefinitionen (eingebetteter Fallback zur JSON-Datenbank) ============ */
/* ===== Region Gießen / Lahntal (Hessen) – recherchiert 07/2026 ===== */
export const SPOTS_HE = [
    { name: 'Lahn – Stadtstrecke Gießen', wasser: 'fluss', verif: 'B', nr: 'IG Lahn · Launsbach–Stadtwerkewehr', cat: 'raub',
        arten: ['Hecht', 'Barbe', 'Döbel', 'Barsch', 'Aal', 'Karpfen', 'Äsche', 'Bachforelle'],
        lat: 50.58385, lng: 8.66391,
        fisch: 'Hecht, Barbe, Döbel, Barsch, Aal, Karpfen, Äsche, Bachforelle, Weißfische',
        methode: 'Von der Gleibach-Einmündung bei Launsbach (unterhalb A480) bis zum Wehr der Stadtwerke. Lange Spinnrute 20–40 g in der Strömung, DropShot fürs Abklopfen kleiner Hotspots vom Ufer. Salmoniden an den Wehren und am Gleibach-Einlauf.',
        karte: 'IG-Lahn-Tageskarte ~10 € (Angel-Shop Lollar, Fishermen\'s Place Heuchelheim, Reinig Gießen). Gastangeln der Stadtstrecke teils nur mit Vereinsmitglied Fischwaidclub Gießen',
        kartenLinks: [{ label: 'Fishermen\'s Place – Karten', url: 'https://www.fishermensplace.de/produkte/angelkarten/' }],
        note: 'Angelstellen stadtnah durch Wohn-/Gewerbebauten und Privatgrundstücke eingeschränkt. Beste Zugänge: großes Wehr bei der Kanustation und die drei Brücken. Vom Ufer, Fliegenfischen mit Wathose erlaubt.',
        hotspots: [
            { name: 'Stadtwerke-Wehr (Streckenende)', saison: 'ganzjährig, Salmoniden im Frühjahr', lat: 50.58385, lng: 8.66391, tipp: 'Sauerstoffreiches Wehrwasser am Ende der Gießener Stadtstrecke: Barben und Döbel im Strömungskehr, im Frühjahr Äsche und Bachforelle. Vom Ufer gut zugänglich.' },
            { name: 'Gleibach-Einlauf Launsbach', saison: 'Frühjahr/Herbst', lat: 50.5910, lng: 8.6470, tipp: 'Kühleres Zulaufwasser zieht Salmoniden und Weißfisch – Streckenanfang der Gießener Karte (unterhalb A480).' }
        ], warn: false, zugang: 'ufer' },
    { name: 'VSA Angelsee Heuchelheim', wasser: 'see-tief', verif: 'B', nr: 'VSA Gießen · Lahnpark', cat: 'raub',
        arten: ['Zander', 'Hecht', 'Karpfen', 'Barsch', 'Aal'],
        lat: 50.56909, lng: 8.62285,
        fisch: 'Zander, Hecht, Karpfen, Barsch, gute Aale',
        methode: '15 ha, bis 10 m tief, direkt an der Lahn. Guter Mischbestand. Vom 01.11.–31.01. nur Kunstköder oder toter Köderfisch auf Raubfisch. Ufer besonders gut zugänglich (nach 10–15 min Fußweg ruhige Plätze). Bootsangeln erlaubt.',
        karte: 'Fischerei-Erlaubnisschein VSA Gießen (vsa-giessen.de) + staatlicher Fischereischein',
        kartenLinks: [{ label: 'VSA Gießen – Gastkarten', url: 'https://www.vsa-giessen.de/gastkarten/' }, { label: 'hejfish (online)', url: 'https://www.hejfish.com' }],
        note: '⚠ FKK-Bereich 01.05.–31.10., 10–20 Uhr Angelverbot; Angeln von den Inseln verboten; Laichschongebiet ganzjährig gesperrt (Schilder beachten). Uferbefahren durch Schranken verhindert – zu Fuß erschlossen. Eisangeln verboten. ⚠ Nicht mit dem benachbarten Wasserski-See verwechseln – gemeint ist der Angel-/FKK-See (Lahnpark).',
        hotspots: [
            { name: 'Steilufer Nordseite', saison: 'Okt–Mär, Zander', lat: 50.5698, lng: 8.6232, tipp: 'An der tiefen Kante (bis 10 m) mit Gummi/totem Köfi auf Zander; im Winter nur Kunstköder/Köderfisch erlaubt.' }
        ], warn: true, zugang: 'ufer' },
    { name: 'Dutenhofener See', wasser: 'see-tief', verif: 'B',
        rig: 'Boot mit E-Motor/Ruder empfohlen (verkrautetes Ufer). Hechtcombo mit Stahlvorfach, Welszeug für die Nacht, Zandergummi an den Kanten.', nr: 'Kiessee · zw. Gießen & Wetzlar', cat: 'raub',
        arten: ['Hecht', 'Zander', 'Wels', 'Barsch', 'Karpfen', 'Aal', 'Schleie'],
        lat: 50.56701, lng: 8.61113,
        fisch: 'Hecht, Zander, Wels, Barsch (große Schwärme), große Karpfen, Aal, Schleie, Brassen',
        methode: '29 ha Kiessee, bis 11,4 m tief (Ø 4 m), direkt an der Lahn. Gutes Hecht-/Zander-/Wels- und Karpfengewässer. Bootsangeln ganztägig + Nachtangeln erlaubt (E-Motor/Ruder). 3 Ruten. Fische ab 7,5 kg schonend zurücksetzen (Altbestandsschutz).',
        karte: 'Tageskarte ~15 € (Fishermen\'s Place Heuchelheim / Betreiber Dutenhofener See)',
        kartenLinks: [{ label: 'Fishermen\'s Place – Karten', url: 'https://www.fishermensplace.de/produkte/angelkarten/' }],
        note: '⚠ Intensiv genutztes Freizeitgewässer (Baden, Segeln, Surfen, Campingplatz) – Wochenende/Sommer sehr unruhig, Dämmerung/Nacht nutzen. Westteil Vogelschutzgebiet (gesperrt). Bei Segelregatten Bootsangeln komplett untersagt. Vom Ufer stark verkrautet – Boot klar im Vorteil.',
        hotspots: [
            { name: 'Tiefes Loch (11,4 m) Seemitte', saison: 'Hochsommer + Winter', lat: 50.5670, lng: 8.6111, tipp: 'Tiefste Stelle für Sommer-/Winterzander und Wels – nur vom Boot. Vom Hessischen Landesamt auf 11,4 m vermessen.' },
            { name: 'Ostufer-Krautkante', saison: 'Frühjahr Hecht', lat: 50.5665, lng: 8.6140, tipp: 'Ruhigere Ecke am Ostufer, Krautkanten – Hecht. Abstand zum gesperrten NSG-Westteil (Vogelschutz) halten.' }
        ], warn: true, zugang: 'boot' },
    { name: 'Lahn bei Wetzlar (Gaststrecke ASV)', wasser: 'fluss', verif: 'B', nr: 'ASV Wetzlar · Naunheim–Dillmündung', cat: 'raub',
        arten: ['Hecht', 'Barsch', 'Wels', 'Döbel', 'Aal', 'Barbe', 'Bachforelle', 'Äsche'],
        lat: 50.5620, lng: 8.5150,
        fisch: 'Hecht, Barsch, Wels, Döbel, Bachforelle, Äsche, Barbe, Aal, Schleie',
        methode: 'Gaststrecke vom Auslauf der Naunheimer Schleuse bis zur Dill-Mündung (beidseitig, ~km 13). Spannendes Spinnrevier auf Barsch und Hecht. Hecht/Zander nur mit Stahl-/Kevlar-/Titanvorfach. Angelzeit 1 h vor bis 1 h nach Sonnenuntergang.',
        karte: 'ASV-Wetzlar-Tageskarte (asv-wetzlar.de, Ausgabestellen vor Ort)',
        kartenLinks: [{ label: 'ASV Wetzlar', url: 'https://www.asv-wetzlar.de' }],
        note: '⚠ Großer Teil der Gaststrecke im Landschaftsschutzgebiet – Feld-/Wiesenwege nicht befahren, kein Feuer/Zelten. Bootsangeln, Nachtangeln und Senken verboten. Nur Uferangeln.',
        hotspots: [
            { name: 'Dillmündung (Dillspitze)', saison: 'ganzjährig', lat: 50.5604, lng: 8.5029, tipp: 'Mündungsbereich der Dill in die Lahn – Strömungskante zieht Barsch, Hecht und Döbel. Streckenende km 13.' },
            { name: 'Auslauf Naunheimer Schleuse', saison: 'ganzjährig', lat: 50.57562, lng: 8.52680, tipp: 'Streckenanfang der ASV-Gaststrecke direkt am Schleusenauslauf – strömungsberuhigte Kanten, Barsch und Hecht.' }
        ], warn: false, zugang: 'ufer' },
    { name: 'Wißmarer See', wasser: 'see-flach', verif: 'B', nr: 'AC Wißmar · Lahnschleife bei Wettenberg', cat: 'raub', keinAnfuettern: true,
        arten: ['Zander', 'Hecht', 'Barsch', 'Aal', 'Karpfen', 'Schleie'],
        lat: 50.64193, lng: 8.69152,
        fisch: 'Zander, Hecht, Barsch, Aal, Karpfen, Schleie, Weißfische',
        methode: '9,6 ha Baggersee, Ø 2,35 m, max. 4,3 m (nur eine kleine Fläche im NO-Teil). Flacher, eutropher Kiessee in einer Lahnschleife – als Zandergewässer bekannt, aber auch stark friedfischgeprägt. Viele Uferplätze. Twitchen/Spinnen auf Zander/Hecht, Feeder auf Karpfen/Schleie.',
        karte: 'AC-Wißmar-Tageskarte ~10 € (ac-wissmar.de / Angelladen „Zum Kormoran" am See). 2 Ruten, nur 1 auf Raubfisch, kein lebender Köderfisch, kein Nachtangeln',
        kartenLinks: [{ label: 'AC Wißmar – Gastkarten', url: 'https://www.ac-wissmar.de/gastkarten/' }],
        note: '⚠ Datenlage zum Bestand uneinheitlich: manche Quellen loben kapitale Zander, andere sehen ihn eher friedfischlastig – flacher, eutropher See mit Sauerstoffabfall ab ~1,5 m im Sommer. Campingplatz umschließt großen Uferteil. In den Sommerferien 20–8 Uhr nur für Mitglieder. Anfüttern verboten.',
        hotspots: [
            { name: 'Tiefe Ecke Nordost', saison: 'Sommer, Zander', lat: 50.6430, lng: 8.6935, tipp: 'Die einzige tiefere Zone (bis 4,3 m) liegt im nordöstlichen Seeteil – im flachen See der beste Sauerstoff-/Rückzugsbereich für Zander. Lage grob (Struktur mit Echolot verifizieren).' }
        ], warn: true, zugang: 'ufer' },
    { name: 'Silbersee Launsbach', wasser: 'see-flach', verif: 'C', nr: 'AV Silbersee · Lahnaue bei Launsbach', cat: 'raub',
        arten: ['Zander', 'Hecht', 'Barsch', 'Wels', 'Aal', 'Karpfen', 'Schleie', 'Döbel'],
        lat: 50.61575, lng: 8.67495,
        fisch: 'Zander, Hecht, Barsch, Wels, Aal, Karpfen, Schleie, Döbel, Weißfische',
        methode: 'Baggersee-Gruppe aus drei Becken östlich von Launsbach; Hauptsee ~6,5 ha, bis ~5,4 m. Guter Raubfischbestand (Zander, Hecht, Wels). Landzunge am Damm zum Nachbarsee als Struktur. Westufer Parkplatz/Liegewiese, übrige Ufer von Gehölz gesäumt.',
        karte: 'Bewirtschafter AV Silbersee Launsbach e.V. (av-silbersee-launsbach.de). ⚠ Gastkartenvergabe laut mehreren Quellen unklar – vor Anfahrt direkt beim Verein erfragen',
        kartenLinks: [{ label: 'AV Silbersee Launsbach', url: 'https://www.av-silbersee-launsbach.de' }],
        note: '⚠ Beleglage schwächer (verif C): Fischbestand gut dokumentiert, aber Gastkarten-Regelung nicht gesichert. NSG/Vogelschutz + FKK-Bereich am See, A480 direkt nördlich (Lärm). Sommer starker Badebetrieb – Saisonrand/Herbst deutlich ruhiger. Grenzen vor Ort beschildert.',
        hotspots: [
            { name: 'Landzunge am Trenndamm', saison: 'Frühjahr/Herbst', lat: 50.6165, lng: 8.6760, tipp: 'Am Damm zum nördlichen Nachbarsee bildet eine Landzunge einen 90°-Winkel – Kanten und Übergänge sind klassische Raubfisch-Standplätze. Lage grob.' }
        ], warn: true, zugang: 'ufer' }
];
/* Hessen HFischV vom 14.04.2023 (Gesetz- und Verordnungsblatt): Entnahmefenster für viele Arten, Zander ohne Schonzeit */
export const SCHON_HE = [
    { fisch: 'Äsche', von: [3, 1], bis: [5, 15], mm: '30 cm (HFischV)' },
    { fisch: 'Hecht', von: [2, 1], bis: [4, 15], mm: 'Entnahmefenster 50–90 cm' },
    { fisch: 'Zander', von: null, bis: null, mm: 'ab 50 cm (keine Schonzeit – in HE gebietsfremd)' },
    { fisch: 'Barbe', von: [5, 1], bis: [6, 30], mm: 'Entnahmefenster 40–60 cm' },
    { fisch: 'Aal', von: [9, 15], bis: [3, 1], mm: 'Entnahmefenster 50–70 cm' },
    { fisch: 'Karpfen', von: [3, 15], bis: [5, 31], mm: 'Wildform: Entnahmefenster 45–60 cm' },
    { fisch: 'Schleie', von: [5, 1], bis: [6, 30], mm: 'Entnahmefenster 25–45 cm' },
    { fisch: 'Bachforelle', von: [10, 1], bis: [3, 31], mm: 'Atl. Forelle: Entnahmefenster 25–60 cm' },
    { fisch: 'Barsch', von: null, bis: null, mm: '– (kein gesetzl. Maß)' },
    { fisch: 'Wels', von: null, bis: null, mm: '– (in HE keine Schonzeit/kein Maß)' },
    /* Döbel ist an drei Gießen-Spots Zielart, fehlte hier komplett - im Fangbuch erschien
       dadurch immer "keine Daten vorliegen, KEINE Freigabe" statt einer echten Aussage.
       Recherche deutet an, dass fuer nicht-heimische/gebietsfremde Arten (wie bei Zander)
       teils eine Entnahmepflicht statt Schonzeit gilt "in bestimmten Gebieten" - das ist
       aber nicht sicher genug belegt, um es hier zu behaupten (anders als bei Zander, wo
       die Quelle eindeutig war). Bewusst nur die sicher belegte Kernaussage. */
    { fisch: 'Döbel', von: null, bis: null, mm: '– (kein gesetzl. Maß, keine Schonzeit)' }
];
export const REGION_HE = { id: 'giessen', geprueft: '2026-07', name: 'Gießen / Lahntal (Hessen)', nachtangeln: 'frei', kurz: 'Gießen & Lahn', packliste: ['Staatl. Fischereischein + Erlaubnisschein (IG Lahn / VSA / ASV je Gewässer)', 'Lange Spinnrute 20–40 g für die Lahn-Strömung', 'DropShot-Setup fürs Abklopfen vom Ufer', 'Stahl-/Titanvorfach (Hecht/Zander Pflicht am Wasser)', 'Wathose fürs Fliegenfischen an den Wehren', 'Kescher, Abhakmatte, Kopflampe'],
    koederfisch: ['Grundel breitet sich auch in der Lahn aus – als toter Köderfisch am Grund auf Zander/Wels/Aal top.', 'Lebender Köderfisch verboten (Tierschutzgesetz).', 'An Vereinsgewässern Köderfischregeln des Erlaubnisscheins prüfen.', 'Döbel und Rotaugen sind klassische Lahn-Köderfische (wo erlaubt).'],
    schonQuelle: 'Quelle: Hessische Fischereiverordnung (HFischV) vom 14.04.2023 – Entnahmefenster (Mindest- UND Höchstmaß!) für Hecht 50–90, Barbe 40–60, Aal 50–70, Karpfen(Wild) 45–60, Schleie 25–45. Zander: KEINE Schonzeit, ab 50 cm (gilt in HE als gebietsfremd). Wels ohne Maß. Verein/Erlaubnisschein kann strenger sein.',
    pegel: { warnAb: 350, text: 'Lahn-Hochwasser – Uferzugänge geprüft, Strömung beachten!' },
    fusszeile: 'Erlaubnis je Gewässer: <a href="https://www.vsa-giessen.de" target="_blank" rel="noopener">VSA Gießen</a> · <a href="https://www.asv-wetzlar.de" target="_blank" rel="noopener">ASV Wetzlar</a> · IG Lahn (Angelläden). Hessen-Gastkarten oft über <a href="https://www.hejfish.com" target="_blank" rel="noopener">hejfish</a>',
    spots: SPOTS_HE, schon: SCHON_HE,
    banner: [
        { von: [2, 1], bis: [4, 15], text: '<b>Hecht geschont</b> (01.02.–15.04.) – Entnahmefenster 50–90 cm beachten.' },
        { von: [3, 15], bis: [5, 31], text: '<b>Karpfen (Wildform) geschont</b> (15.03.–31.05.).' },
        { von: [5, 1], bis: [6, 30], text: '<b>Barbe &amp; Schleie geschont</b> (01.05.–30.06.).' }
    ],
    regeln: [
        { titel: 'Hessen: Entnahmefenster statt nur Mindestmaß', punkte: ['Seit HFischV 28.04.2023 gilt für 9 Arten ein Entnahmefenster (Mindest- UND Höchstmaß) – große Laichfische müssen zurück', 'Hecht 50–90 cm, Barbe 40–60, Aal 50–70, Karpfen-Wildform 45–60, Schleie 25–45, Atl. Forelle 25–60', 'Zander: keine Schonzeit, Mindestmaß 50 cm, KEIN Höchstmaß (gilt in Hessen als gebietsfremde Art)', 'Wels: keine Schonzeit, kein Mindestmaß', 'Vereine dürfen strenger sein (Schonzeit verlängern, Fenster verengen) – Erlaubnisschein liest vor'] },
        { titel: 'Erlaubnisscheine im Raum Gießen', punkte: ['Lahn-Strecken über die IG Lahn – Tageskarten ~10 € in Angelläden (Lollar, Heuchelheim, Gießen)', 'VSA Angelsee Heuchelheim: eigener Erlaubnisschein des VSA Gießen', 'Dutenhofener See: Tageskarte ~15 € beim Betreiber / Fishermen\'s Place', 'ASV Wetzlar Gaststrecke: nur Abschnitt Naunheim–Dillmündung für Gäste', 'Hessen-Gastkarten laufen zunehmend online über hejfish.com'] },
        { titel: 'Lahn- & Seen-Praxis', punkte: ['Lahn ab Wetzlar Bundeswasserstraße – Schifffahrt/Wellenschlag beachten, Ruten sichern', 'Stadtnahe Lahn: Zugang durch Bebauung eingeschränkt – Wehre und Brücken sind die Hotspots', 'Baggerseen (Dutenhofen): Sommer/Wochenende Freizeittrubel – Dämmerung und Nacht sind fängiger', 'Grundeln breiten sich aus: toter Köderfisch am Grund auf Zander/Wels/Aal', 'Setzkescher an Bundeswasserstraßen/bei Wellenschlag laut HFischV unzulässig'] }
    ],
    hinweis: 'Angaben ohne Gewähr, recherchiert 07/2026 (HFischV 14.04.2023, Vereinsseiten VSA Gießen/ASV Wetzlar/ASV Lahnau, IG Lahn, Anglerforen). Maßgeblich sind der jeweilige Erlaubnisschein und die Beschilderung vor Ort. Entnahmefenster vor Entnahme prüfen.' };
export const REGION_RLP = { id: 'mainz', geprueft: '2026-07', name: 'Rhein & Rheinhessen (Mainz)', nachtangeln: 'frei', kurz: 'Rhein & Rheinhessen', packliste: ['Rheinischer Erlaubnisschein (Strom-km prüfen!)', 'Pflicht dabei: Kescher, Maßband + Mittel zum Betäuben und Töten', 'Frühjahrsschonzeit 15.4.–31.5. – gilt AUCH für den Rhein & offen verbundene Altrheine: keine Kunstköder, keine aktive Köderführung; Fliege nur an der Fliegenrute', 'Rücksetzverbot: Fische ohne Mindestmaß (Brassen, Barsch, Wels u.a.) dürfen NICHT zurückgesetzt werden', 'Aalfangverbot 01.10.–01.03. im Rhein, verbundenen Stillgewässern & Häfen', 'Rheinkarte gilt nur bis Flussmitte – hessische Seite braucht hessischen Schein', 'Setzkescher: min. 3,5 m lang, Ringe 50 cm, aus Textil, min. 2,5 m eingetaucht – Drahtsetzkescher verboten; bei Wellenschlag/Schiffsverkehr gar kein Hältern', 'Kosak nur senkrecht geführt, 01.06.–31.10.: max. 55 mm, max. 30 g, ein Drilling (Krümmung ≤ 9 mm)', 'Schwere Jigrute 30–60 g + Bleikopf-Vorrat (Steinpackung!)', 'Grundel-Dekore, Stahl-/FC-Vorfach', 'Wathose/Gummistiefel für Buhnen', 'Buhnen NIE bei Hochwasser betreten – lebensgefährlich (Sog/Wellenschlag); Pegel Mainz >400 cm = Buhnen weg', 'Stirnlampe, Kescher, Abhakmatte'],
    koederfisch: ['Grundel ist am Rhein der dominante Beifang und ideal als toter Köderfisch – vor Ort fangen, gebietsfremd aber ohnehin schon überall.', 'Köderfischsenke vom Ufer laut rheinischem Erlaubnisschein erlaubt.', 'Lebender Köderfisch verboten (Tierschutzgesetz).', 'Zander/Wels stehen auf Grundelfetzen &amp; -filet – am Grund an der Strömungskante anbieten.'],
    schonQuelle: 'Quelle: Beiblatt zum Erlaubnisschein für die finanzstaatlichen Gewässer von Rheinhessen-Pfalz, SGD Süd – Obere Fischereibehörde, Stand 2025. Hecht 01.02.–31.05./50, Zander 15.03.–15.05./45, Äsche 15.02.–30.04./30, Barbe 01.05.–15.06./35, Bachforelle 15.10.–15.03./25, Aalfangverbot 01.10.–01.03. (Maß 50). Ganzjährig geschont: Lachs, Meerforelle, Maifisch, Neunaugen, Schnäpel, Karausche, Quappe u.a. Die Frühjahrsschonzeit 15.04.–31.05. gilt AUCH für den Rhein, alle Altrheingewässer, Seitenarme und blind endenden Gewässer mit offener Rhein-Verbindung. Fische ohne Mindestmaß (Brassen, Barsch, Wels u.a.) dürfen NICHT zurückgesetzt werden. Verein/Erlaubnisschein kann strenger sein.',
    pegel: { warnAb: 400, text: 'Buhnen überspült & lebensgefährlich (Sog/Wellenschlag) – nicht betreten, auf Hafenausfahrten ausweichen!' },
    fusszeile: 'Erlaubnis: <a href="https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/" target="_blank" rel="noopener">LFV Rhl.-Rhh.</a> (links) · <a href="https://www.hejfish.com" target="_blank" rel="noopener">hejfish</a> (Hessen-Seite)',
    spots: SPOTS_RLP, schon: SCHON_RLP,
    /* Strom-km: exakte Punkte sind amtliche WSV-Pegel (PEGELONLINE, km + Koordinate).
       Dazwischen nur dort interpoliert, wo die Anker dicht stehen und der Fluss kaum mäandert
       (Nierstein→Bodenheim→Mainz, Faktor 1.03–1.06). Für die Strecke Worms→Nierstein (37 km ohne
       Anker, Faktor 1.43) und flussab Mainz gibt es bewusst KEINE Marken – die wären geraten. */
    flusskm: [
        { km: 443.4, lat: 49.6318, lng: 8.3775, pegel: 'Worms' },
        { km: 480.6, lat: 49.865, lng: 8.3524, pegel: 'Nierstein-Oppenheim' },
        { km: 485, lat: 49.902, lng: 8.3474 },
        { km: 489, lat: 49.9357, lng: 8.3428, pegel: 'Bodenheim' },
        { km: 495, lat: 49.9799, lng: 8.2991 },
        { km: 498.3, lat: 50.004, lng: 8.2753, pegel: 'Mainz' }
    ],
    banner: [
        { von: [2, 1], bis: [3, 14], text: '<b>Hecht geschont</b> (01.02.–31.05.). <b>Aalfangverbot</b> bis 01.03.' },
        { von: [3, 15], bis: [4, 14], text: '<b>Hecht &amp; Zander geschont</b> – Zander bis 15.05., Hecht bis 31.05.' },
        { von: [4, 15], bis: [5, 15], text: '<b>Frühjahrsschonzeit (15.04.–31.05.):</b> am Rhein &amp; allen offen verbundenen Altrheingewässern keine Kunstköder und <b>keine aktive Köderführung</b> – künstliche Fliege nur an der Fliegenrute. Hecht &amp; Zander geschont.' },
        { von: [5, 16], bis: [5, 31], text: '<b>Bis 31.05.:</b> Hecht geschont, Frühjahrsschonzeit läuft – keine Kunstköder, keine aktive Köderführung. Zander offen (nur Naturköder am Grund).' },
        { von: [10, 1], bis: [12, 31], text: '<b>Aalfangverbot 01.10.–01.03.</b> im Rhein, verbundenen Stillgewässern &amp; Häfen.' }
    ],
    regeln: [
        { titel: 'Erlaubnisscheine am Rhein', punkte: ['Linksrheinisch (Mainzer Ufer): rheinischer Erlaubnisschein ~31 €/Jahr – online-Infos &amp; Ausgabestellen: <a href="https://lfv-rhl-rhh.de/fischerei-erlaubnisscheine/rhein/" target="_blank" rel="noopener">lfv-rhl-rhh.de</a>, klassisch im Angelladen (z.B. Bode Heidesheim)', 'Ufer und handgerudertes Boot erlaubt (Bootsplakette sichtbar anbringen), Köderfischsenke vom Ufer zulässig', 'Rechtsrheinische Seite, Mainspitze &amp; Ginsheim: hessischer Rheinschein – seit 2025 nur noch online über <a href="https://www.hejfish.com" target="_blank" rel="noopener">hejfish.com</a> (HLG)', 'Main km 0–2,89: Erlaubnis nur mit Vereinsmitgliedschaft im hessischen Verband'] },
        { titel: 'Verbotszonen – teuer bei Kontrolle', punkte: ['Zollhafen Mainz: komplett verboten', 'Schiersteiner Hafen: seit 2005 komplett gesperrt (Schadstoffe)', 'NSG Mombacher Rheinufer: Angeln an den Stillgewässern + Rheinufer km 505,4–506,0 verboten', 'NSG Haderaue-Königsklinger Aue: km 508,0–511,0 (Rhein/Altrhein) + Gewässer „Krappen"/Haderaulache ganzjährig verboten; km 511,0–512,5 nur Handangel und nur 01.09.–31.05.', 'NSG Kisselwörth und Sändchen (Inseln bei Nackenheim): Handangel auf Kisselwörth 16.07.–28.(29.)02., auf Sändchen 10.03.–15.07. verboten', 'NSG Sandlache: Fischerei (Berufs- und Angelfischerei) komplett verboten – Lage nicht in der App hinterlegt, bei der Unteren Naturschutzbehörde erfragen', 'NSG Fulder Aue – Ilmen Aue: Fischerei verboten, nur vom Ufer km 525,4–525,0 gestattet (liegt stromab der App-Strecke)', 'Industrie- und Winterhafen: nur ausgeschilderte Bereiche', 'Grundlage: Rechtsverordnungen der SGD Süd (Obere Naturschutzbehörde), Stand 2025 – einsehbar bei den Unteren Naturschutzbehörden KV Mainz-Bingen (Ingelheim) und Alzey-Worms', '⚠ Die km-Marken der Karte sind auf ±~300 m genau – sie taugen NICHT zum Beurteilen einer Schutzgebietsgrenze. Maßgeblich sind Rechtsverordnung und Beschilderung.'] },
        { titel: 'Rhein-Praxis', punkte: ['Pegel über ~4 m: Buhnen überspült – dann auf Hafenausfahrten ausweichen (Pegelanzeige oben in der App nutzen!)', 'Grundel ist Hauptfutter: Ködergrößen 9–12 cm in Grundeldekoren, Naturköder am Grund = Grundel-Lotterie', 'Nachts schlägt der flach geführte Wobbler an kurzen Buhnen oft den Gummifisch', 'Frühjahrsschonzeit 15.04.–31.05.: Kunstköder verboten (außer Fliege) – de facto Spinnstart am 1. Juni', 'Schifffahrt: Wellenschlag reißt Ruten ins Wasser – sichern!'] }
    ],
    hinweis: 'Angaben ohne Gewähr, recherchiert 07/2026 (FischGDV RP, LFV RLP, Anglerforen). Maßgeblich: Erlaubnisschein mit Strom-km-Angaben und Beschilderung. Mindestmaße RLP vor Entnahme gegenprüfen.' };
/* ===== Region Elbe / Magdeburg (Sachsen-Anhalt) – recherchiert 07/2026 ===== */
export const SPOTS_EL = [
    { name: 'Buhnenfeld Herrenkrug', kkVerbot: { von: [2, 15], bis: [4, 30] }, wasser: 'fluss', verif: 'B', nr: 'Magdeburger Anglerverein · Elbe rechtes Ufer', cat: 'raub',
        arten: ['Zander', 'Hecht', 'Wels', 'Rapfen', 'Barsch', 'Karpfen', 'Aal', 'Brachse'],
        lat: 52.1535, lng: 11.6720,
        fisch: 'Zander, Hecht, Wels, Rapfen, Barsch, Karpfen, Aal, Brasse',
        methode: 'Klassisches Magdeburger Buhnenfeld am Herrenkrug – der Elb-Zanderhotspot schlechthin. Vom Buhnenkopf die Strömungskante mit Gummifisch (Kopyto 10–12 cm, Bleikopf 10–20 g) beangeln; Kehrströmung und Prallhang sind die Standplätze. In trübem Sommerwasser beißt Zander sogar mittags.',
        karte: 'Tageskarte 15 € / Woche 40 € (Thommis Angelshop Magdeburg). DAV-Sachsen-Anhalt-Mitglieder + DAV-Gastmarke frei. Nacht- und Bootsangeln erlaubt',
        note: '⚠ Vom 15.02.–30.04. Kunstköder & tote Köderfische verboten (Raubfischschonung). Buhnenkopf-Angeln ideal bei Pegel 1,20–1,80 m (Magdeburg-Strombrücke). Steinpackungen = Hängergefahr, Stahlvorfach + Gummi-Vorrat. Berufsschifffahrt hat Vorrang, Ruten gegen Wellenschlag sichern.',
        kartenLinks: [{ label: 'Magdeburger Anglerverein', url: 'https://www.magdeburger-anglerverein.de' }, { label: 'hejfish (online)', url: 'https://www.hejfish.com' }],
        hotspots: [
            { name: 'Buhnenkopf-Strömungskante', saison: 'Juni–Winter, Zander', lat: 52.1540, lng: 11.6710, tipp: 'Am Buhnenkopf bildet die Strömungskante Verwirbelungen an der Oberfläche – dort steht der Zander. Gummi 20 m flussab an der Kante führen.' }
        ], warn: true, zugang: 'ufer' },
    { name: 'Elbe Magdeburg-Prester', kkVerbot: { von: [2, 15], bis: [4, 30] }, wasser: 'fluss', verif: 'B', nr: 'Magdeburger Anglerverein · oberhalb Abzweig Alte Elbe', cat: 'raub',
        arten: ['Zander', 'Hecht', 'Wels', 'Rapfen', 'Barsch', 'Aal'],
        lat: 52.1034, lng: 11.6748,
        fisch: 'Zander, Hecht, Wels, Rapfen, Barsch, Aal',
        methode: 'Sehr fischträchtige Buhnen oberhalb des Abzweigs der Alten Elbe. Tagsüber Spinnfischen mit Gummi an den Buhnenköpfen, zur Dämmerung Ansitz mit totem Köderfisch (Grundel) auf Zander – erste oder letzte Buhne im Feld als Hotspot.',
        karte: 'Tageskarte 15 € (Thommis Angelshop / DAV Sachsen-Anhalt). Nacht- und Bootsangeln erlaubt',
        note: '⚠ 15.02.–30.04. Kunstköder-/Köderfischverbot. Krabbenplage im Sommer (Wollhandkrabbe) nervt Aal-/Ansitzangler – Köder alle 15 min prüfen, genug Köderfisch mitnehmen. Max. 3 Raubfische/Tag.',
        kartenLinks: [{ label: 'Magdeburger Anglerverein', url: 'https://www.magdeburger-anglerverein.de' }, { label: 'hejfish (online)', url: 'https://www.hejfish.com' }],
        hotspots: [
            { name: 'Erste/letzte Buhne am Alte-Elbe-Abzweig', saison: 'Dämmerung, Zander', lat: 52.1050, lng: 11.6770, tipp: 'Die Rand-Buhnen eines Feldes und die Altarm-Mündung sind Top-Ansitzplätze mit Köderfisch. Lage grob – Buhnenreihe abgehen.' }
        ], warn: true, zugang: 'ufer' },
    { name: 'Rothenseer Abstiegskanal', kkVerbot: { von: [2, 15], bis: [4, 30] }, wasser: 'kanal', verif: 'B', nr: 'Magdeburger Anglerverein · Kanal', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Hecht', 'Rotauge'],
        lat: 52.2057, lng: 11.6875,
        fisch: 'Zander, Barsch, Hecht, Weißfisch',
        methode: 'Kanal am Wasserstraßenkreuz – ganzjährig für kapitale Zander gut, auch im Winter. Ruhigeres Wasser als der Hauptstrom, gut mit Gummi und Dropshot an den Kanten und Kanalwänden zu beangeln.',
        karte: 'Tageskarte 15 € (Thommis Angelshop / DAV Sachsen-Anhalt). Angeln nicht überall in Kanälen/Häfen gestattet – Beschilderung beachten',
        note: '⚠ In Kanälen und Häfen ist das Angeln nicht überall erlaubt – auf Verbotsschilder achten. Winter kann sich lohnen (Zander beißt). 15.02.–30.04. Kunstköderverbot.',
        kartenLinks: [{ label: 'Magdeburger Anglerverein', url: 'https://www.magdeburger-anglerverein.de' }, { label: 'hejfish (online)', url: 'https://www.hejfish.com' }],
        hotspots: [], warn: true, zugang: 'ufer' },
    { name: 'Industriehafen Magdeburg', kkVerbot: { von: [2, 15], bis: [4, 30] }, wasser: 'kanal', verif: 'B', nr: 'Magdeburger Anglerverein · Hafenbecken', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Hecht', 'Rotauge'],
        lat: 52.1648, lng: 11.6688,
        fisch: 'Zander, Barsch, Hecht, Weißfisch',
        methode: 'Hafenbecken mit Zander, Barsch und Hecht. Bei Hochwasser im Hauptstrom eine der besten Alternativen – an den Hafenausfahrten stauen sich dann die Fische. Gummiköder erste Wahl.',
        karte: 'Tageskarte 15 € (Thommis Angelshop / DAV Sachsen-Anhalt). Nur ausgeschilderte Bereiche – nicht überall im Hafen erlaubt',
        note: '⚠ Angeln nicht im ganzen Hafen erlaubt – Beschilderung strikt beachten. Hafenausfahrt = Hochwasser-Hotspot. 15.02.–30.04. Kunstköderverbot.',
        kartenLinks: [{ label: 'Magdeburger Anglerverein', url: 'https://www.magdeburger-anglerverein.de' }, { label: 'hejfish (online)', url: 'https://www.hejfish.com' }],
        hotspots: [], warn: true, zugang: 'ufer' },
    { name: 'Zollelbe Magdeburg', kkVerbot: { von: [2, 15], bis: [4, 30] }, wasser: 'kanal', verif: 'B', nr: 'Magdeburger Anglerverein · Nebenarm', cat: 'raub',
        arten: ['Barsch', 'Zander', 'Hecht', 'Rotauge'],
        lat: 52.1305, lng: 11.6496,
        fisch: 'Barsch (im Herbst massenhaft), Zander, Hecht, Weißfisch',
        methode: 'Strömungsberuhigter Nebenarm mitten in der Stadt, gut zu Fuß/mit Rad erreichbar. Im Herbst treten Barsche in großen Mengen auf – kleine Spinner und Gummiköder. Gute Alternative bei starker Strömung im Hauptstrom.',
        karte: 'Tageskarte 15 € (Thommis Angelshop / DAV Sachsen-Anhalt)',
        note: '⚠ Stadtgewässer, teils Baustellen am Ufer. Bootsangeln zwischen km 324,0 (Buckauer Fähre) und km 327,4 (Zollelbe-Mündung) NICHT erlaubt. Herbst = Barschzeit.',
        kartenLinks: [{ label: 'Magdeburger Anglerverein', url: 'https://www.magdeburger-anglerverein.de' }, { label: 'hejfish (online)', url: 'https://www.hejfish.com' }],
        hotspots: [], warn: true, zugang: 'ufer' },
    { name: 'Buhnenfelder Rothensee–Rogätz', kkVerbot: { von: [2, 15], bis: [4, 30] }, wasser: 'fluss', verif: 'B', nr: 'Elbe · zusammenhängende Buhnenfelder nördl. Magdeburg', cat: 'raub',
        arten: ['Zander', 'Hecht', 'Barsch', 'Aal', 'Rapfen', 'Wels', 'Brachse'],
        lat: 52.2600, lng: 11.7150,
        fisch: 'Zander, Hecht, Barsch, Aal, Rapfen, Wels, dicke Brassen/Alande',
        methode: 'Lange, zusammenhängende Buhnenfelder von Magdeburg-Rothensee bis Rogätz – „der ideale Angelplatz auf alles, was Flossen trägt". Strecke machen, aber jede Buhne gründlich abfischen (Strömungskante, Kehrströmung, Buhnenkopf, Prallhang). Zander an der Kante, Hecht am Prallhang, Rapfen am Kopf.',
        karte: 'Tageskarte 15 € (Thommis Angelshop / DAV Sachsen-Anhalt). Ufer zu Fuß über Feld-/Wanderwege (FFOG beachten)',
        note: '⚠ Ufer oft nur über Feld-/Fuß-/Wanderwege erreichbar (Feld- und Forstordnungsgesetz). Nicht an den Buhnen „vorbeiangeln" – zwei bis drei Würfe pro Position reichen nicht. 15.02.–30.04. Kunstköderverbot. Koordinate = Streckenmitte.',
        kartenLinks: [{ label: 'Magdeburger Anglerverein', url: 'https://www.magdeburger-anglerverein.de' }, { label: 'hejfish (online)', url: 'https://www.hejfish.com' }],
        hotspots: [
            { name: 'Rogätz (Streckenende)', saison: 'ganzjährig', lat: 52.3177, lng: 11.7617, tipp: 'Nördliches Streckenende bei Rogätz – weniger Angeldruck als stadtnah. Außenkurven mit ausgespülten Buhnen sind top.' }
        ], warn: true, zugang: 'ufer' }
];
/* Schonzeiten Sachsen-Anhalt (Magdeburger Anglerverein / DAV LSA) – Fangbegrenzung max. 3 der gelisteten Arten/Tag */
export const SCHON_EL = [
    { fisch: 'Zander', von: [2, 15], bis: [5, 31], mm: '50 cm, max 3/Tag' },
    { fisch: 'Hecht', von: [2, 15], bis: [4, 30], mm: '50 cm, max 3/Tag' },
    { fisch: 'Barbe', von: [4, 1], bis: [6, 30], mm: '45 cm, max 2/Tag' },
    { fisch: 'Aal', von: null, bis: null, mm: '50 cm' },
    { fisch: 'Wels', von: null, bis: null, mm: '– (kein Maß), max 1/Tag' },
    { fisch: 'Karpfen', von: null, bis: null, mm: '40 cm, max 3/Tag' },
    { fisch: 'Rapfen', von: null, bis: null, mm: '40 cm, max 2/Tag' },
    { fisch: 'Quappe', von: null, bis: null, mm: '30 cm, max 3/Tag' },
    { fisch: 'Barsch', von: null, bis: null, mm: '– (kein gesetzl. Maß)' }
];
export const REGION_EL = { id: 'elbe', geprueft: '2026-07', name: 'Elbe / Magdeburg (Sachsen-Anhalt)', nachtangeln: 'frei', kurz: 'Elbe (Magdeburg)', packliste: ['Fischereischein + Erlaubnis (DAV Sachsen-Anhalt / Magdeburger AV)', 'Jigrute 15–40 g + Bleiköpfe 10–20 g', 'Gummifische 10–12 cm in Grün/Gelb/Weiß (Trübwasser!)', 'Stahl-/Titanvorfach + reichlich Jighaken (Hänger!)', 'Wathose/Gummistiefel für die Buhnen', 'Pegel Magdeburg-Strombrücke checken (ideal 1,20–1,80 m)', 'Kopflampe, Kescher, Abhakmatte'],
    koederfisch: ['Grundel & Gründling sind an der Elbe häufiger Beifang – als toter Köderfisch auf Zander/Wels/Aal top.', 'Lebender Köderfisch verboten (Tierschutzgesetz).', 'Wollhandkrabben plündern im Sommer Grundmontagen – Köder häufig kontrollieren.', 'Vom 15.02.–30.04. sind tote Köderfische UND Kunstköder verboten (Raubfischschonung).'],
    schonQuelle: 'Quelle: Erlaubnisbestimmungen Magdeburger Anglerverein e.V. / DAV Landesanglerverband Sachsen-Anhalt (Stand lt. BLINKER-Gewässersteckbrief). Zander 15.02.–31.05./50, Hecht 15.02.–30.04./50, Barbe 01.04.–30.06./45, Aal-Maß 50. Max. 3 der gelisteten Arten pro Tag. ⚠ NUR für die Sachsen-Anhalt-Strecke – die Elbe fließt durch Sachsen, Niedersachsen, Brandenburg & Hamburg mit je eigenen Regeln!',
    pegel: { warnAb: 350, text: 'Buhnen überspült – auf Hafenausfahrten/Zollelbe ausweichen!' },
    fusszeile: 'Erlaubnis: <a href="https://www.magdeburger-anglerverein.de" target="_blank" rel="noopener">Magdeburger Anglerverein</a> · <a href="https://www.hejfish.com" target="_blank" rel="noopener">hejfish</a>. Nur Sachsen-Anhalt-Strecke!',
    spots: SPOTS_EL, schon: SCHON_EL,
    banner: [
        { von: [2, 15], bis: [4, 30], text: '<b>Raubfisch-Schonzeit:</b> 15.02.–30.04. Kunstköder &amp; tote Köderfische verboten – Hecht &amp; Zander geschont.' },
        { von: [5, 1], bis: [5, 31], text: '<b>Zander noch geschont</b> bis 31.05. (Hecht ab 01.05. wieder frei).' },
        { von: [4, 1], bis: [6, 30], text: '<b>Barbe geschont</b> (01.04.–30.06.).' }
    ],
    regeln: [
        { titel: 'Erlaubnis & Fangbegrenzung (Sachsen-Anhalt)', punkte: ['Tageskarte ~15 €, Woche ~40 € – u.a. Thommis Angelshop Magdeburg oder online', 'DAV-Sachsen-Anhalt-Mitglieder und DAV-Gäste mit Sachsen-Anhalt-Marke brauchen keine Zusatzkarte', 'Max. 3 Fische der Arten Hecht/Zander/Karpfen/Quappe pro Tag gesamt', 'Nacht- und Bootsangeln erlaubt (Boot-Ausnahme km 324,0–327,4)', 'Seit 2013: in Sachsen-Anhalt Angeln auch ohne Fischereischein möglich – aber Erlaubnisschein nötig'] },
        { titel: 'Raubfisch-Schonzeit 15.02.–30.04.', punkte: ['In diesem Zeitraum KEINE Kunstköder und KEINE toten Köderfische erlaubt (Laichschonung)', 'Zander zusätzlich bis 31.05. geschont, Mindestmaß 50 cm', 'Hecht bis 30.04. geschont, Mindestmaß 50 cm', 'De facto startet die Gummifisch-Saison auf Zander erst am 1. Juni'] },
        { titel: 'Elbe-Praxis', punkte: ['Buhnenkopf-Angeln ideal bei Pegel 1,20–1,80 m (Magdeburg-Strombrücke) – Pegelanzeige oben nutzen', 'Trübes Sommerwasser: grelle Gummis (gelb/weiß/grün); klarer bei Niedrigwasser: dunkle Farben', 'Bei Hochwasser an die Hafenausfahrten ausweichen – dort staut sich der Zander', 'Steinpackungen & Totholz = viele Hänger: Jighaken-Vorrat und Stahlvorfach mitnehmen', 'Berufsschifffahrt hat Vorrang – Wellenschlag reißt Ruten ins Wasser, gut sichern'] }
    ],
    hinweis: 'Angaben ohne Gewähr, recherchiert 07/2026 (BLINKER-Gewässersteckbrief Magdeburg, Magdeburger AV, hejfish, Anglerforen). Diese Regeln gelten NUR für die Sachsen-Anhalt-/Magdeburg-Strecke. Maßgeblich sind der jeweilige Erlaubnisschein (Strom-km!) und die Beschilderung vor Ort.' };
/* ===== Region Main / Frankfurt–Offenbach (Hessen) – recherchiert 07/2026 ===== */
export const SPOTS_MA = [
    { name: 'Main – Niddamündung Höchst', wasser: 'fluss', verif: 'B', nr: 'Frankfurter Zunft-/Stadtstrecke · linksmainisch', cat: 'raub',
        arten: ['Zander', 'Wels', 'Barsch', 'Rapfen', 'Aal', 'Karpfen', 'Brachse'],
        lat: 50.09941, lng: 8.55165,
        fisch: 'Zander, Wels, Barsch, Rapfen, Aal, Karpfen, Brassen',
        methode: 'Mündung der Nidda in den Main – klassische Strömungskante mit sandig-steinigem Grund, laut Praxisberichten einer der besten Zanderbereiche der Frankfurter Strecke. Gummifisch an der Kante, nachts Pose oder Grund mit totem Köderfisch nah am befestigten Ufer.',
        karte: 'Erlaubnisschein Main Frankfurt (Tages-/Monats-/Jahreskarte, u.a. Angel Bär Frankfurt) oder online über hejfish. Staatlicher Fischereischein nötig',
        note: '⚠ Der Main ist trüb – Zander jagt auch tagsüber, nachts kommen die Räuber dicht ans Ufer. Grundeln sind Dauerbeifang: als toter Köderfisch nutzen statt sich ärgern. Tagesfang auf 3 Raubfische (Barsch/Hecht/Zander) begrenzt, max. 10/Woche. Bootsangeln verboten.',
        kartenLinks: [{ label: 'hejfish – Main', url: 'https://www.hejfish.com/d/12472-main' }, { label: 'Angel Bär (Gastkarten)', url: 'https://www.angel-baer.de/gastkarten.htm' }],
        hotspots: [
            { name: 'Kante westlich der Niddamündung', saison: 'Herbst/Winter, Zander', lat: 50.0990, lng: 8.5490, tipp: 'Westlich der Mündung liegen laut Praxisberichten viele sandig-steinige Zanderspots. Kanten mit Gummi absuchen. Lage grob.' }
        ], warn: true, zugang: 'ufer' },
    { name: 'Main – Gerbermühle / Frankfurt-Süd', wasser: 'fluss', verif: 'B', nr: 'Frankfurter Strecke · Stadtstrecke', cat: 'raub',
        arten: ['Zander', 'Barsch', 'Wels', 'Aal', 'Karpfen', 'Brachse', 'Rotauge'],
        lat: 50.10600, lng: 8.72158,
        fisch: 'Zander, Barsch, Wels, Aal, Karpfen, Brassen, Rotaugen',
        methode: 'Stadtstrecke mit befestigten Ufern und Spundwänden – nachts kommen Zander dicht heran. Vertikal/Dropshot an der Spundwand, Pose nachts ufernah. Steiniger Grund = Hängergefahr, Jigkopf-Vorrat einpacken.',
        karte: 'Erlaubnisschein Main Frankfurt (Angel Bär, Angelshop Offenbach) oder online hejfish',
        note: '⚠ Sperrzonen im Stadtgebiet beachten (Hafenbecken, Osthafen-Oberhafenbecken, Staustufe Griesheim, Schleuse Offenbach) – Beschilderung lesen. Stehende Gewässer (Rumpenheimer/Bürgeler Kiesgrube) sind für Gastangler gesperrt. Bootsangeln verboten.',
        kartenLinks: [{ label: 'hejfish – Main', url: 'https://www.hejfish.com/d/12472-main' }, { label: 'Angel Bär (Gastkarten)', url: 'https://www.angel-baer.de/gastkarten.htm' }],
        hotspots: [], warn: true, zugang: 'ufer' },
    { name: 'Main – Mainbogen Rumpenheim', wasser: 'fluss', verif: 'B', nr: 'Offenbach/Rumpenheim · naturnaher Bogen', cat: 'raub',
        arten: ['Zander', 'Wels', 'Barsch', 'Hecht', 'Aal', 'Barbe', 'Döbel'],
        lat: 50.12931, lng: 8.79670,
        fisch: 'Zander, Wels, Barsch, Hecht, Aal, Barbe, Döbel, Weißfische',
        methode: 'Der große Bogen beim NSG Rumpenheim: natürlich bewachsene Uferzonen statt Spundwand – der ruhigste Ansitzplatz der Strecke. Feedern auf Barbe/Brasse, abends Zander an den Kanten.',
        karte: 'Erlaubnisschein der zuständigen Zunft/Frankfurter Strecke – Kilometergrenzen auf der Karte prüfen! Online über hejfish',
        note: '⚠ Naturschutzgebiet in der Nähe – Beschilderung genau beachten, nicht in gesperrte Zonen. Die Kiesgrube Rumpenheim ist für Gastangler NICHT freigegeben (nur mit Vereinsmitglied). Koordinate = Bogenbereich, Lage grob.',
        kartenLinks: [{ label: 'hejfish – Main', url: 'https://www.hejfish.com/d/12472-main' }],
        hotspots: [], warn: true, zugang: 'ufer' },
    { name: 'Staustufe Griesheim', nr: 'SPERRZONE', cat: 'sperr', arten: [],
        lat: 50.08975, lng: 8.59949,
        fisch: '–', methode: '–', karte: '–',
        note: '⛔ Rund um die Staustufe Griesheim besteht laut Erlaubnisbestimmungen eine Sperrzone (rechts- und linksmainisch). Trotz idealer Zanderstruktur: hier NICHT angeln. Beschilderung beachten.',
        hotspots: [], warn: true },
    { name: 'Schleuse Offenbach', nr: 'SPERRZONE', cat: 'sperr', arten: [],
        lat: 50.10793, lng: 8.72710,
        fisch: '–', methode: '–', karte: '–',
        note: '⛔ Rund um die Schleuse Offenbach und den Riedgraben gilt eine Sperrzone. Das Zunftgebiet beginnt rechtsmainisch erst 100 m oberhalb der Schleuse (km 38,5). Nicht befischen.',
        hotspots: [], warn: true }
];
/* Schonzeiten: hessisches Landesrecht (HFischV 14.04.2023) + Erlaubnisschein-Regeln der Main-Strecke */
export const SCHON_MA = [
    { fisch: 'Zander', von: null, bis: null, mm: 'ab 50 cm (keine Schonzeit – in HE gebietsfremd), max 3 Raubfische/Tag' },
    { fisch: 'Hecht', von: [2, 1], bis: [4, 15], mm: 'Entnahmefenster 50–90 cm, max 3 Raubfische/Tag' },
    { fisch: 'Barsch', von: null, bis: null, mm: '– (kein Maß), max 3 Raubfische/Tag' },
    { fisch: 'Barbe', von: [5, 1], bis: [6, 30], mm: 'Entnahmefenster 40–60 cm' },
    { fisch: 'Aal', von: [9, 15], bis: [3, 1], mm: 'Entnahmefenster 50–70 cm' },
    { fisch: 'Karpfen', von: [3, 15], bis: [5, 31], mm: 'Wildform: Entnahmefenster 45–60 cm' },
    { fisch: 'Schleie', von: [5, 1], bis: [6, 30], mm: 'Entnahmefenster 25–45 cm' },
    { fisch: 'Wels', von: null, bis: null, mm: '– (in HE keine Schonzeit/kein Maß)' },
    { fisch: 'Rapfen', von: null, bis: null, mm: '– (kein gesetzl. Maß)' }
];
export const REGION_MA = { id: 'main', geprueft: '2026-07', name: 'Main / Frankfurt–Offenbach (Hessen)', nachtangeln: 'frei', kurz: 'Main (Frankfurt)', packliste: ['Staatl. Fischereischein + Erlaubnisschein der Strecke', 'Jigrute 20–50 g, Bleiköpfe 10–25 g', 'Reichlich Jighaken (Steinpackung = Hänger!)', 'Gummifische + Fischfetzen; Grundeln als Köfi nutzen', 'Stahl-/Titanvorfach', 'Kopflampe – nachts kommen die Zander ans Ufer', 'Kescher mit langem Stiel (Spundwand!)'],
    koederfisch: ['Grundeln sind Dauerbeifang und der beste tote Köderfisch auf Zander/Wels/Aal.', 'Lebender Köderfisch verboten (Tierschutzgesetz).', 'Fischfetzen funktionieren an der Spundwand hervorragend.', 'Vom 15.03.–30.04. ist im Zunftgebiet Hanau/Seligenstadt das Angeln mit Kunst-/Fischködern komplett untersagt – für die Frankfurter Strecke Erlaubnisschein prüfen!'],
    schonQuelle: 'Quelle: Hessische Fischereiverordnung (HFischV) vom 14.04.2023 – Entnahmefenster (Mindest- UND Höchstmaß) für Hecht 50–90, Barbe 40–60, Aal 50–70, Karpfen(Wild) 45–60, Schleie 25–45. Zander: KEINE Schonzeit, ab 50 cm. Zusätzlich Erlaubnisschein-Regel: max. 3 Raubfische (Barsch/Hecht/Zander) pro Tag, max. 10/Woche. ⚠ Der Main ist in Streckenabschnitte verschiedener Fischerzünfte geteilt – Kilometergrenzen und Sperrzonen auf DEINER Karte prüfen!',
    pegel: { warnAb: 400, text: 'Main-Hochwasser – Uferwege und Spundwände gefährlich!' },
    fusszeile: 'Erlaubnis: <a href="https://www.hejfish.com/d/12472-main" target="_blank" rel="noopener">hejfish – Main</a> · <a href="https://www.angel-baer.de/gastkarten.htm" target="_blank" rel="noopener">Angel Bär Frankfurt</a>. Streckengrenzen &amp; Sperrzonen beachten!',
    spots: SPOTS_MA, schon: SCHON_MA,
    banner: [
        { von: [2, 1], bis: [4, 15], text: '<b>Hecht geschont</b> (01.02.–15.04.) – Entnahmefenster 50–90 cm.' },
        { von: [3, 15], bis: [4, 30], text: '<b>Achtung:</b> In benachbarten Zunftgebieten (Hanau/Seligenstadt) 15.03.–30.04. Kunst-/Fischköder-Verbot – eigenen Erlaubnisschein prüfen!' },
        { von: [5, 1], bis: [6, 30], text: '<b>Barbe &amp; Schleie geschont</b> (01.05.–30.06.).' }
    ],
    regeln: [
        { titel: 'Erlaubnisschein-Dschungel am Main', punkte: ['Der Main ist in Abschnitte verschiedener Fischerzünfte/Vereine geteilt – historische Bannwasser und Koppelrechte machen es unübersichtlich', 'Nicht jede Karte gilt überall: Kilometergrenzen auf dem eigenen Schein prüfen (z.B. Zunftgebiet Steinheim km 46,8–69,5 linksmainisch)', 'Gastkarten teils limitiert und schnell vergriffen – Vereinsmitgliedschaft lohnt bei Regelmäßigkeit', 'Tageskarte Frankfurt ~8 € (Angel Bär u.a.), online über hejfish', 'Staatlicher Fischereischein zusätzlich nötig'] },
        { titel: 'Sperrzonen (nicht angeln!)', punkte: ['Staustufe Griesheim – rechts- und linksmainisch gesperrt', 'Schleuse Offenbach + Riedgraben', 'Hafenbecken, Oberhafenbecken des Osthafens Frankfurt', 'Bannwasser Hanau (Schloss Philippsruhe bis WSV-Hafen)', 'Stehende Gewässer (Rumpenheimer/Bürgeler Kiesgrube): Gastangler nur mit Vereinsmitglied', 'Bootsangeln ist auf der Strecke verboten'] },
        { titel: 'Main-Praxis', punkte: ['Zander steht an Staustufen, Steinpackungen, Brücken und versunkenen Buhnen (im Staubereich)', 'Trübes Wasser: Zander jagt auch tagsüber – nachts kommen Räuber dicht ans befestigte Ufer', 'Herbst ist die beste Raubfischzeit; Winter = Zander an tiefen Stellen', 'Grundeln als Chance: toter Köderfisch statt Ärgernis', 'Steiniger Grund + Strömung = Montageverlust einplanen; Pose nachts als Alternative zum Grundblei', 'Schiffsverkehr beachten – Wellenschlag an der Spundwand'] }
    ],
    hinweis: 'Angaben ohne Gewähr, recherchiert 07/2026 (fisch-hitparade, hejfish/Fischerhütte, angelguide, Zunft-Erlaubnisbestimmungen). Die Erlaubnisschein-Lage am Main ist durch historische Fischereirechte komplex – maßgeblich sind DEIN Erlaubnisschein (Strom-km!), die Beschilderung und die HFischV.' };
/* Isar-Kanalgewässer und Baggerseen um München (Donau-Einzugsgebiet). Die Isar selbst
   ist innerhalb Münchens praktisch nicht gastanglertauglich: Die Isarfischer e.V. (seit
   1950, ~1100 Mitglieder) haben laut eigener Auskunft keine Kapazität mehr für neue
   Mitglieder und keine Warteliste; die städtische Jahreskarten-Anzahl ist auf 450/Jahr
   begrenzt. Deshalb hier bewusst die real gastkarten-zugänglichen Gewässer: der
   Mittlere-Isar-Kanal (Ableitung der Isar am Wehr Oberföhring) plus vier Baggerseen im
   Münchner Norden/Westen – alle mit echten Tageskarten für Nicht-Mitglieder. */
export const SPOTS_BY = [
    { name: 'Feringasee (Unterföhring)', wasser: 'see-tief', verif: 'B', nr: 'Fischwaid München e.V. · Erlbachstraße', cat: 'raub',
        arten: ['Hecht', 'Zander', 'Barsch', 'Karpfen', 'Schleie', 'Regenbogenforelle'],
        lat: 48.1929, lng: 11.6649,
        fisch: 'Hecht, Zander, Barsch, Karpfen, Schleie, schnellwüchsige Regenbogenforelle',
        methode: 'Ehemaliger Kiessee mit klarem Wasser nordöstlich von München, seit 1980 eines der wichtigsten Gewässer des Vereins, bis ca. 7 m tief. Spinnfischen ist laut Vereinsangaben die erfolgreichste Methode – Hecht ist der Hauptzielfisch, dazu gute Karpfen/Schleien und schnell wachsende Forellen. Klassische Strukturen wie überall an Baggerseen: Schilfkanten, Seerosenfelder, versunkene Bäume, Stege/Pfähle sowie Buchten/Landzungen sind erste Anlaufstellen – ein einzelner "Über-Hotspot" ist für dieses Gewässer nicht dokumentiert, Fische wechseln je nach Temperatur/Wind. Lage ungefähr (Zufahrt/Parkplätze nur über die Erlbachstraße).',
        karte: 'Tageskarte Fischwaid München e.V. – seit 2025 ausschließlich online über hejfish',
        note: 'Kein eigener Nachweis einer Nachtangel-Sonderregel gefunden – allgemeine bayerische Regeln gelten, Vereinsordnung vor Ort/online prüfen.',
        kartenLinks: [{ label: 'hejfish – Fischwaid München', url: 'https://www.hejfish.com/m/fischereiverein-fischwaid-muenchen-e-v-2022' }, { label: 'Verein – Gewässer', url: 'https://www.fischwaid-muenchen.de/?page_id=42' }],
        hotspots: [], warn: false, zugang: 'ufer' },
    { name: 'Ismaninger Speichersee', wasser: 'see-flach', verif: 'B', nr: 'Fischwaid München e.V. · zw. Ismaning &amp; Neufinsing', cat: 'raub',
        arten: ['Hecht', 'Zander', 'Wels', 'Karpfen', 'Barsch', 'Schleie', 'Brachse', 'Barbe', 'Regenbogenforelle'],
        lat: 48.2231, lng: 11.7069,
        fisch: 'Hecht, Zander, Wels, Karpfen, Barsch, Schleie, Brachse, Barbe (am Kraftwerkseinlauf), Regenbogenforelle (insges. rund 25 nachgewiesene Fischarten)',
        methode: 'Mit 5,8 km² der mit Abstand größte Baggersee/Speichersee der Region – flach und weitläufig statt tiefe Kiesgrube. Hecht, Barsch und Karpfen sind laut Vereinsangaben am häufigsten. Lage ungefähr, Koordinate markiert den zugänglichen Bereich nahe Ismaning – nicht das gesamte Gewässer ist befischbar (siehe Hinweis).',
        karte: 'Tageskarte Fischwaid München e.V. – seit 2025 ausschließlich online über hejfish',
        note: '⚠ Gastangler dürfen laut Vereinsordnung nur EINE Handangel mit einer Bissanzeige führen, ausschließlich vom Ufer (kein Boot, kein Waten/Wathose). Hecht-Mindestmaß hier vereinsseitig 60 cm statt der bayernweiten 50 cm. EU-Vogelschutzgebiet (Ramsar-Fläche seit 1976, bis zu 100.000 Wasservögel im Sommer) – Betriebsgelände und Vogelschutzzone am Südufer des Westteils sind komplett gesperrt, im Ostteil zeitweise Einschränkungen, Beschilderung beachten. Nachtangeln auf Aal laut Quellenlage bis 1 Uhr erlaubt.',
        kartenLinks: [{ label: 'hejfish – Fischwaid München', url: 'https://www.hejfish.com/m/fischereiverein-fischwaid-muenchen-e-v-2022' }, { label: 'Verein – Speichersee', url: 'https://www.fischwaid-muenchen.de/?page_id=2128' }],
        hotspots: [
            { name: 'Einlauf am Kraftwerk', saison: 'v.a. Herbst, Barbe', lat: 48.2245, lng: 11.7095, tipp: 'Laut mehreren Quellen die bekannteste Stelle am See – Zulauf direkt nach dem Kraftwerk, im Herbst regelmäßig große Barben. Steile Uferböschung: langer Kescher/Seil hilfreich. Lage ungefähr.' }
        ], warn: true, zugang: 'ufer', schonzeitInfo: 'Hecht hier vereinsseitig ab 60 cm (bayernweit 50 cm) – strengere Vereinsregel gilt vorrangig.',
        schonzeitOverride: [{ fisch: 'Hecht', von: [2, 15], bis: [4, 30], mm: 'ab 60 cm (Vereinsregel Fischwaid München, bayernweit nur 50 cm)' }] },
    { name: 'Langwieder See', wasser: 'see-tief', verif: 'B', nr: 'Versehrten Fischereiverein München e.V. · A8 Ausf. München-Langwied', cat: 'raub',
        arten: ['Hecht', 'Zander', 'Wels', 'Karpfen', 'Barsch', 'Rotauge', 'Brachse', 'Schleie', 'Aal', 'Regenbogenforelle'],
        lat: 48.1825, lng: 11.3985,
        fisch: 'Hecht, Zander, Wels, Karpfen, Barsch, Rotauge, Brachse, Schleie, Aal, Regenbogenforelle',
        methode: '18 ha großer Kiessee im Münchner Westen (Stadtbezirk Aubing-Lochhausen-Langwied), in den 1930ern durch Kiesaushub für den Autobahnbau entstanden, bis ca. 8 m tief. Typisches Hechtgewässer mit gutem Karpfen-, Barsch- und auch Zanderbestand. Grundangeln gilt laut Erfahrungsberichten als erfolgreichste Methode. Lage ungefähr, Zufahrt über die A8-Ausfahrt „München-Langwied".',
        karte: 'Tageskarte Versehrten Fischereiverein München e.V., Saison 01.05.–30.09., ~20 € + 10 € Pfand (Verkaufsstellen u.a. AKM Angel- u. Ködermarkt München, Fisherman\'s Partner München/Parsdorf)',
        note: '⚠ Aalangeln nur vom verankerten Boot, bis Mitternacht erlaubt – vom Ufer aus laut Vereinsordnung nicht gestattet. Allgemeines Nachtangelverbot: 1,5 h nach Sonnenuntergang bis 1 h vor Sonnenaufgang (für alle anderen Arten/Methoden). Zusätzlich Freizeitsee (Baden, Rudern) – am Wochenende/Sommer entsprechend belebt.',
        kartenLinks: [],
        hotspots: [
            { name: 'Steg zum Lußsee', saison: 'ganzjährig', lat: 48.1865, lng: 11.3965, tipp: 'Der Steg zwischen Lußsee und Langwieder See gilt laut Erfahrungsberichten als eine der besseren Stellen – an der Kante entlang fischen. Nordwestufer zusätzlich mit flacheren Bereichen. Lage ungefähr.' }
        ], warn: true, zugang: 'ufer' },
    { name: 'Mittlerer-Isar-Kanal (Oberföhring/St. Emmeram)', wasser: 'kanal', verif: 'B', nr: 'Versehrten Fischereiverein München e.V. · Ableitung ab Isarwehr Oberföhring', cat: 'salmo',
        arten: ['Bachforelle', 'Regenbogenforelle', 'Saibling', 'Barbe', 'Döbel', 'Hecht', 'Barsch', 'Aal'],
        lat: 48.1706, lng: 11.6210,
        fisch: 'Bachforelle, Regenbogenforelle, Saibling, Barbe, Döbel, dazu Hecht &amp; Barsch, in der Dämmerung Aal',
        methode: 'Künstlicher, strömungsstarker Kanal – zweigt am Isarwehr Oberföhring von der Isar ab und führt einen Großteil ihres Wassers Richtung Kraftwerke/Unterföhring. Bis 4 m tief, Brücken ohne Pfeiler. Strömungsliebende Salmoniden (Bach-/Regenbogenforelle, Saibling – vermutlich Bachsaibling) sind der Hauptreiz, dazu Barbe und Döbel für Friedfischangler. Parkplätze bei St. Emmeram. Lage ungefähr.',
        karte: 'Tageskarte Versehrten Fischereiverein München e.V., Saison 01.05.–15.10., ~15 € + 10 € Pfand (Verkaufsstellen u.a. AKM Angel- u. Ködermarkt München, Fisherman\'s Partner München/Parsdorf)',
        note: '⚠ Nachtangeln hier laut Vereinsordnung verboten (1,5 h nach Sonnenuntergang bis 1 h vor Sonnenaufgang) – abweichend von der sonst freien Nachtangel-Regel in Bayern. Starke Strömung: festes Schuhwerk/Wathose, bei Hochwasser der Isar meiden.',
        kartenLinks: [],
        hotspots: [
            { name: 'Isarwehr Oberföhring (Kanaleinlauf)', saison: 'ganzjährig', lat: 48.1735, lng: 11.6175, tipp: 'Direkt am Wehr, wo der Kanal von der Isar abzweigt: Strömungsbruch und zusätzlicher Sauerstoffeintrag ziehen klassisch sowohl Salmoniden als auch Raubfisch an. Lage ungefähr.' }
        ], warn: true, zugang: 'ufer' },
    { name: 'Hollerner See (Eching)', wasser: 'see-tief', verif: 'B', nr: 'Fischwaid München e.V. &amp; FV Eching · „Am Fretz 1", 85386 Eching', cat: 'raub',
        arten: ['Hecht', 'Zander', 'Wels', 'Karpfen', 'Schleie', 'Regenbogenforelle', 'Seeforelle', 'Barsch', 'Aal', 'Brachse', 'Döbel'],
        lat: 48.3103, lng: 11.6255,
        fisch: 'Hecht, Zander, Wels, Karpfen, Schleie, Regenbogenforelle, Seeforelle, Renke, Barsch, Aal, Brachse, Döbel',
        methode: '41 ha großer, bis 17 m tiefer ehemaliger Kiessee mit auffällig türkisem, klarem Wasser nördlich von München (bei Unterschleißheim/Eching) – seit 1999 gemeinsam von Fischwaid München und dem Fischereiverein Eching bewirtschaftet. Tiefstes und klarstes der hier gelisteten Gewässer, entsprechend anspruchsvoll (Sichtangeln möglich, aber auch scheue Fische) – gilt laut Erfahrungsberichten als eher schwieriger See. Kanten und Krautfelder als erste Anlaufstellen; ein Großteil des Ufers ist steil (Seil empfehlenswert), rund um die Wasserwacht/das Erholungsgebiet ist der Zugang deutlich einfacher und ohne Steilufer. Eine Insel prägt die Struktur zusätzlich. Beste Zeiten laut Quellenlage Jan–Mai und Sep–Okt. Lage ungefähr, Parkplatz-Zufahrt „Am Fretz 1".',
        karte: 'Tageskarte Fischwaid München e.V. – seit 2025 ausschließlich online über hejfish',
        note: 'Als tiefes, isoliertes Gewässer (kein Flussanschluss) gilt für Seeforelle hier vermutlich die kürzere Schonzeit für geschlossene Gewässer (01.10.–15.01. statt 01.10.–15.03.) – im Zweifel Vereinsordnung/Erlaubnisschein prüfen. Klares Wasser: feine Vorfächer, Naturkost im Vorteil.',
        kartenLinks: [{ label: 'hejfish – Fischwaid München', url: 'https://www.hejfish.com/m/fischereiverein-fischwaid-muenchen-e-v-2022' }],
        /* Bewusst KEIN schonzeitOverride: die "geschlossenes Gewässer"-Ausnahme ist hier nur
           "vermutlich" belegt, nicht sicher. Ein Override würde das Fangbuch ab 16.01. "erlaubt"
           anzeigen lassen - im Fehlerfall (falls die kürzere Frist doch nicht greift) hieße das,
           einem Nutzer einen noch geschonten Fisch als fangbar zu bestätigen. Lieber die
           strengere, sicher richtige regionsweite Frist (bis 15.03.) durchsetzen und die
           Unsicherheit nur als Hinweistext zeigen. */
        hotspots: [], warn: false, zugang: 'ufer', schonzeitInfo: 'Seeforelle hier vermutlich schon ab 16.01. wieder fangbar (geschlossenes Gewässer) statt erst ab 16.03. – im Fangbuch bewusst NICHT automatisch freigegeben (unsichere Rechtsgrundlage), gilt dort weiter bis 15.03.' }
];
/* Schonzeiten: AVBayFiG (Ausführungsverordnung Bayerisches Fischereigesetz), Fassung
   seit 01.01.2023, Donau-Einzugsgebiet (gilt für München/Isar). Seit der Reform 2023
   unterscheiden sich Fristen teils nach Einzugsgebiet (Donau/Rhein/Elbe/Weser) – die
   Werte hier gelten NUR für den Donau-Raum. */
export const SCHON_BY = [
    { fisch: 'Hecht', von: [2, 15], bis: [4, 30], mm: 'ab 50 cm (Ismaninger Speichersee vereinsseitig ab 60 cm)' },
    { fisch: 'Zander', von: [2, 15], bis: [4, 30], mm: 'ab 50 cm' },
    { fisch: 'Rapfen', von: [3, 1], bis: [4, 30], mm: 'ab 40 cm' },
    { fisch: 'Barbe', von: [5, 1], bis: [6, 30], mm: 'ab 40 cm' },
    { fisch: 'Schleie', von: [5, 1], bis: [6, 30], mm: 'ab 26 cm' },
    { fisch: 'Bachforelle', von: [10, 1], bis: [3, 15], mm: 'ab 26 cm' },
    { fisch: 'Regenbogenforelle', von: [12, 15], bis: [3, 15], mm: 'ab 26 cm' },
    { fisch: 'Seeforelle', von: [10, 1], bis: [3, 15], mm: 'ab 60 cm (in geschlossenen Gewässern/Baggerseen laut Quellenlage nur bis 15.01. geschont)' },
    { fisch: 'Karpfen', von: null, bis: null, mm: 'ab 35 cm, keine Schonzeit' },
    { fisch: 'Aal', von: null, bis: null, mm: '– (kein Mindestmaß; im Donau-Einzugsgebiet auch keine Schonzeit – die gilt nur im Rhein-/Elbe-/Weser-Gebiet); seit 2023 kein Neubesatz mehr erlaubt' },
    { fisch: 'Wels', von: null, bis: null, mm: '– (kein Maß, keine Schonzeit)' },
    { fisch: 'Barsch', von: null, bis: null, mm: '– (kein Maß, keine Schonzeit)' },
    { fisch: 'Brachse', von: null, bis: null, mm: '– (kein Maß, keine Schonzeit)' },
    { fisch: 'Rotauge', von: null, bis: null, mm: '– (kein Maß, keine Schonzeit)' },
    { fisch: 'Döbel', von: null, bis: null, mm: '– (kein Maß, keine Schonzeit)' },
    { fisch: 'Renke', von: null, bis: null, mm: '– (bayernweit kein einheitliches Maß, an Alpenseen z.T. eigene Vereinsregeln – hier ohne verlässliche Quelle, Vereinsordnung prüfen)' },
    { fisch: 'Saibling', von: null, bis: null, mm: '– (Bachsaibling seit 2023 ohne Mindestmaß/Schonzeit; Seesaibling in Bayern grundsätzlich ab 25 cm, 01.10.–31.12. geschont – am Isarkanal vermutlich Bachsaibling gemeint)' }
];
export const REGION_BY = { id: 'muenchen', geprueft: '2026-07', name: 'München / Isar (Bayern)', nachtangeln: 'frei', kurz: 'München (Isar)',
    packliste: ['Fischereischein nach bestandener Fischerprüfung + Fischereiabgabe – Bayern hat KEINE Prüfungsbefreiung für deutsche Feriengäste; nur wer keinen Wohnsitz in Deutschland hat, bekommt einen 3-Monate-Jahresfischereischein ohne Prüfung', 'Erlaubnisschein je Gewässer (Fischwaid München über hejfish, Versehrtenfischer München direkt/Verkaufsstellen) – die Isar-Stadtstrecke selbst ist für Gäste praktisch nicht zugänglich (siehe Hinweis)', 'Spinn-/Jigrute 20–40 g für Hecht/Zander an den Seen', 'Leichte Forellenausrüstung + ggf. Wathose für den Mittleren-Isar-Kanal', 'Stahl-/Titanvorfach (Hecht/Wels)', 'Kescher, Abhakmatte, Maßband, Kopflampe'],
    koederfisch: ['Lebender Köderfisch ist in ganz Deutschland verboten (Tierschutzgesetz) – nur tote Köderfische verwenden.', 'Köderfische nur aus demselben Gewässer entnehmen (keine Verschleppung/Faunenverfälschung).', 'Aal darf seit 2023 in Bayern nicht mehr besetzt werden – Bestände an den gelisteten Gewässern sind entsprechend unterschiedlich stark.'],
    schonQuelle: 'Quelle: AVBayFiG (Ausführungsverordnung zum Bayerischen Fischereigesetz), Fassung seit 01.01.2023, Werte für das Donau-Einzugsgebiet (München/Isar). Im Rhein-/Elbe-/Weser-Einzugsgebiet gelten teils andere Fristen (v.a. beim Aal). Vereins-/Gewässerordnungen dürfen strenger sein als das Landesrecht und sind maßgeblich (z.B. Hecht-Mindestmaß 60 cm am Ismaninger Speichersee statt bayernweit 50 cm).',
    fusszeile: 'Erlaubnisscheine: <a href="https://www.fischwaid-muenchen.de" target="_blank" rel="noopener">Fischwaid München e.V.</a> (Feringasee, Speichersee, Hollerner See – Tageskarten über hejfish) · <a href="https://www.versehrtenfischer-muenchen.de" target="_blank" rel="noopener">Versehrten Fischereiverein München e.V.</a> (Langwieder See, Mittlerer-Isar-Kanal)',
    spots: SPOTS_BY, schon: SCHON_BY,
    banner: [
        { von: [2, 15], bis: [4, 30], text: '<b>Hecht- &amp; Zander-Schonzeit aktiv</b> (15.02.–30.04., Donau-Einzugsgebiet) – am Ismaninger Speichersee gilt für Hecht zusätzlich ein vereinseigenes Mindestmaß von 60 cm.' },
        { von: [10, 1], bis: [12, 31], text: '<b>Forellen-/Saibling-Schonzeiten aktiv:</b> Bachforelle bis 15.03., Regenbogenforelle ab 15.12., Seeforelle bis 15.03. (an Baggerseen ggf. nur bis 15.01.).' }
    ],
    regeln: [
        { titel: 'Isar-Stadtstrecke: eingeschränkter Zugang', punkte: ['Die Isarfischer e.V. (seit 1950, ~1100 Mitglieder) nehmen laut eigener Auskunft aktuell keine neuen Mitglieder auf und führen keine Warteliste', 'Jahreskarten für die Isar im Stadtgebiet sind auf 450 Stück begrenzt', 'Praktikabler Gast-Zugang zur Isar besteht über den Mittleren-Isar-Kanal (Ableitung ab Wehr Oberföhring) mit echter Tageskarte'] },
        { titel: 'Fischereischein &amp; Erlaubnis in Bayern', punkte: ['Fischereischein nur nach bestandener Fischerprüfung – anders als z.B. Mecklenburg-Vorpommern keine generelle Prüfungsbefreiung für deutsche Feriengäste', 'Ausnahme: Personen ohne Wohnsitz in Deutschland können einen Jahresfischereischein für Touristen ohne Prüfung beantragen (max. 3 Monate Gültigkeit pro Jahr, max. auf 3 Zeitabschnitte aufteilbar)', 'Zusätzlich zum Fischereischein an jedem Gewässer ein eigener Erlaubnisschein nötig – kein bayernweiter Generalschein'] },
        { titel: 'Ismaninger Speichersee: Naturschutz &amp; Gastregeln', punkte: ['EU-Vogelschutzgebiet (Ramsar-Fläche seit 1976) – Süduferbereich des Westteils komplett gesperrt', 'Gastangler: nur eine Handangel mit einer Bissanzeige, ausschließlich vom Ufer', 'Kein Waten/keine Wathose am gesamten See'] }
    ],
    hinweis: 'Angaben ohne Gewähr, recherchiert 07/2026 (Fischwaid München e.V., Versehrten Fischereiverein München e.V., LBV, diverse Angel-Gewässerdatenbanken). Maßgeblich sind immer der jeweilige Erlaubnisschein, die Gewässerordnung des Vereins und die Beschilderung vor Ort. Koordinaten der Seen/des Kanals sind Näherungswerte (Zufahrts-/Parkplatzbereich), keine vermessenen Angelstellen.' };
export const REGIONS_EMBEDDED = [
    { id: 'erzgebirge', geprueft: '2026-07', name: 'Erzgebirge / Freiberg (Sachsen)', nachtangeln: 'lvsa', kurz: 'Erzgebirge', packliste: ['Erlaubnisschein + Personalausweis', 'Fangbuch (vor Angelbeginn ausfüllen!)', 'Maßband &amp; Hakenlöser', 'TWT: KEINE Maden/Fleisch – nur erlaubte Köder', 'Salmo-Strecke: Wathose + Einzelhaken + Sprengringzange', 'Kescher, Kopflampe (Nachtangeln 1h nach SU)'],
        koederfisch: ['Lebender Köderfisch ist in ganz Deutschland verboten (Tierschutzgesetz) – nur tote Köderfische verwenden.', 'Köderfische nur aus demselben Gewässer entnehmen (keine Verschleppung/Faunenverfälschung).', 'In Trinkwassertalsperren: Maden &amp; Fleisch als Köder verboten – Köderfisch dort tabu.', 'Fangbegrenzung Köderfische laut Erlaubnisschein beachten.'],
        schonQuelle: 'Quelle: SächsFischVO 2022 (gesetzliche Mindestwerte) + LVSA-Gewässerordnung 2024 (Verbandsregeln, auf AVS-/LVSA-Erlaubnisscheinen bindend und teils strenger – z.B. Hecht/Zander 60 statt gesetzlich 50 cm).',
        fusszeile: 'Gastkarten: <a href="https://angeln-sachsen.de/avs/gastangler/gastkarten" target="_blank" rel="noopener">AVS Südsachsen</a>',
        spots: SPOTS_SN, schon: SCHON_SN,
        banner: [
            { von: [2, 1], bis: [4, 30], text: '<b>Raubfisch-Sperrfrist aktiv:</b> 01.02.–30.04. Kunstköderverbot in LVSA-Gewässern (gilt NICHT am privaten Angelteich Gränitz), Hecht geschont.' },
            { von: [5, 1], bis: [5, 31], text: '<b>Zander geschont bis 31.05.</b> – Hecht &amp; Barsch sind offen.' }
        ],
        regeln: [
            { titel: 'Raubfisch-Sperrfrist (LVSA)', punkte: ['01.02.–30.04.: Angeln mit raubfischtauglichen Ködern in allen LVSA-Gewässern untersagt (faktisch Kunstköderverbot)', 'Hecht &amp; Zander: Mindestmaß 60 cm (Vereinsregel, strenger als das gesetzliche SächsFischVO-Maß von 50 cm)', 'Barsch: max. 10/Tag, davon 5 über 30 cm', 'Zusätzlich Tageslimit für Hecht/Zander laut Gewässerordnung – genaue Stückzahl je nach Quelle uneinheitlich wiedergegeben, im Zweifel aktuelle LVSA-Gewässerordnung/Erlaubnisschein prüfen', 'Fangbuch vor Angelbeginn ausfüllen', 'Nachtangelzeit: 1 h nach Sonnenuntergang bis 1 h vor Sonnenaufgang'] },
            { titel: 'Trinkwassertalsperren (Saidenbach, Dittersbach)', punkte: ['TWT-Belehrung nötig – Nachweis im Fangbuch/Erlaubnisschein', 'Kein Boot, kein Belly, kein Waten, kein Baden', 'Anfüttern verboten – auch Futterkorb', 'Maden &amp; Fleisch als Köder verboten', 'Kein Nachtangeln, kein Zelten, kein Feuer', 'Fische nicht am Gewässer schlachten'] },
            { titel: 'Streckenfarben an Flüssen (Sachsen)', punkte: ['<b style="color:#e8b93c">Gelb</b>: nur mit Jahres-Salmonidenschein des AVS', '<b style="color:#6fae6f">Grün</b>: allgemeine Berechtigung, aber Salmonidenregeln', '<b style="color:#7d9bc9">Blau</b> (Karte): allgemeines Angelgewässer', '<b style="color:#c94f3d">Rot gestrichelt</b>: Sperrstrecke – Angeln verboten', 'Linienverlauf schematisch – maßgeblich sind die Schilder am Wasser'] },
            { titel: 'Salmonidenstrecken (Mulde, Flöha)', punkte: ['01.01.–30.04.: Angeln komplett verboten', '01.05.–30.09.: Flug- oder Spinnangel', '01.10.–31.12.: nur Flugangel', 'Nur 1 Einzelhaken pro Köder (Drillinge tauschen), Salmonidenschein je nach Strecke', 'Nachtangeln verboten, Salmoniden nicht hältern'] }
        ],
        hinweis: 'Angaben ohne Gewähr, nach SächsFischVO 2022 und LVSA-Gewässerordnung 2024. Maßgeblich: Erlaubnisschein, Gewässerverzeichnis, Beschilderung. Äsche vielerorts ganzjährig geschont – vor Ort prüfen. Gastkarten: angeln-sachsen.de' },
    REGION_RLP,
    REGION_HE,
    REGION_EL,
    REGION_MA,
    REGION_BY,
    { id: 'mecklenburg', geprueft: '2026-07', name: 'Mecklenburgische Kleinseenplatte (MV)', nachtangeln: 'frei', kurz: 'Kleinseenplatte', packliste: ['Fischereischein + Fischereiabgabe MV (10€) + ggf. Touristenschein', 'Anker-Pflicht – Schleppen & Driften verboten, max. 2 Handangeln', 'Tageslimit: max. 3 Edelfische gesamt (Aal, Hecht, Zander, Karpfen)', 'Mind. 5–10 m Abstand zum Schilf (Naturschutz) – nicht ans Schilf fahren', 'Urlauber-Fischereischein ohne Prüfung möglich (Ausgabe: Amt/Rathaus/Tourist-Info)', 'Echolot (Scharkanten weit draußen)', 'Stahl-/Titanvorfach (hohe Hechtdichte)', 'Mückenschutz (Wald überflutet)', 'Kescher, Kopflampe, Regenjacke'],
        koederfisch: ['Lebender Köderfisch verboten (Tierschutzgesetz).', 'Köderfische nur aus dem befischten Gewässer (Seenverbund Obere Havel).', 'Barsch &amp; kleine Plötze sind top Hecht-/Zanderköder – als Fischfetzen oder ganzer toter Köfi am System.', 'Kein Anfüttern in Schongebieten/Nationalpark-Zonen.'],
        schonQuelle: '⚠ KARTENREGELN der Seenfischerei Obere Havel – teils strenger als MV-Landesrecht und NUR auf deren Gewässern gültig!',
        fusszeile: 'Angelkarten: <a href="https://fischerei-wesenberg.de" target="_blank" rel="noopener">Seenfischerei Obere Havel</a> + Fischereiabgabe MV',
        spots: SPOTS_MV, schon: SCHON_MV,
        banner: [
            { von: [2, 1], bis: [3, 14], text: '<b>Hecht-Fangverbot aktiv</b> (01.02.–30.04., Obere-Havel-Gewässer).' },
            { von: [3, 15], bis: [4, 30], text: '<b>Hecht- UND Zander-Verbot aktiv</b> – Hecht bis 30.04., Zander bis 15.06.' },
            { von: [5, 1], bis: [6, 15], text: '<b>Zander-Angelverbot bis 15.06.</b> – Hecht &amp; Barsch sind offen.' }
        ],
        regeln: [
            { titel: 'Kartenregeln Seenfischerei Obere Havel (~5.300 ha)', punkte: ['Max. 2 Ruten, Angeln ständig beaufsichtigen', 'Boot verankern – Schlepp- und Driftangeln verboten!', 'Schilfgürtel, Seerosenfelder und Fischschonbezirke nicht befahren/beangeln', '50 m Abstand zu Fischereigeräten, 100 m zu Schleusen/Stromwehren', 'Entnahme: max. 3 Fische/Tag gesamt aus Hecht, Zander, Aal, Karpfen', 'Entnahmefenster: Hecht über 85, Zander über 75, Barsch über 40 cm zurücksetzen', 'Nachtangeln erlaubt · der Fischer hat Vorrecht'] },
            { titel: 'Scheine &amp; Abgaben (MV)', punkte: ['Fischereischein anderer Bundesländer wird anerkannt (Hauptwohnsitz außerhalb MV)', 'Alternativ: Touristenfischereischein, 28 Tage, ~24 €, ohne Prüfung – Touristinfo Mirow/Wesenberg oder erlaubnis.angeln-mv.de', 'Zusätzlich Pflicht: Fischereiabgabe MV, 10 €/Kalenderjahr (auch für Auswärtige)', 'Angelkarten online: fischerei-wesenberg.de – oder Meisterbereiche Wesenberg, Mirow, Canow, Ahrensberg'] },
            { titel: 'Boot &amp; Praxis', punkte: ['Riesige Schilfgürtel: ohne Boot geht wenig – führerscheinfreie 5-PS-Boote vielerorts charterbar', 'Useriner See liegt im Müritz-Nationalpark: Schutzzonen beachten', 'Sommer = Hausboot-Hochsaison: Dämmerung und Nebenseen nutzen'] }
        ],
        hinweis: 'Angaben ohne Gewähr, recherchiert 07/2026 (Bedingungen Seenfischerei Obere Havel, klein-seenplatte.de). Maßgeblich: Angelkarte und LFischG M-V. Rätzsee &amp; weitere Seen gehören ebenfalls zum Kartengebiet.' }
];
