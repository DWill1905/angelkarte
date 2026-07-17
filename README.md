# Angelkarte

Interaktive Angelkarten-PWA (Leaflet) für Raubfischangler – **keyfrei**, offline-fähig,
läuft als statische Seite auf GitHub Pages. Sechs Regionen mit recherchierten Spots,
Schonzeiten-Status, Fangbuch, Beißzeiten-/Köder-/Blei-Beratern und einem
„Heute passt es?"-Score.

**Live:** https://dwill1905.github.io/angelkarte/

## Features

- **Karte** mit Spots, Flussstrecken, Hotspots und eigenen Spots (Long-Press/Rechtsklick)
- **6 Regionen** (umschaltbar, alles regionsabhängig): Erzgebirge, Rhein & Rheinhessen,
  Gießen/Lahntal, Elbe/Magdeburg, Main/Frankfurt–Offenbach, Mecklenburgische Kleinseenplatte
- **Filter** nach Kategorie, Zielfisch und „nur Ufer" (blendet reine Bootsseen aus)
- **Schonzeiten & Maße** mit Live-Maßcheck im Fangbuch (inkl. Entnahmefenster),
  Jahres-Kalender, regionsabhängige Regeln – gegen die Landesverordnungen abgeglichen
- **Fangbuch** (lokal): Maßcheck, Bearbeiten, CSV-Export, Musterauswertung, Bestenliste
- **Wetter & Pegel** im Header (Open-Meteo + PEGELONLINE, keylos): Temperatur, Wind,
  Luftdruck mit 3h-Trend, nächster Pegel im Umkreis, Gewitter-/Sturmwarnung;
  Wassertemperatur von der nächsten WT-Station (auch wenn der nächste Pegel keine führt),
  sonst als gekennzeichnete Schätzung aus dem Lufttemperatur-Verlauf (±2 °C)
- **Sonne, Mond & blaue Stunde** im Header inkl. Nachtangel-Fenster
- **Werkzeuge** (Menue): „Heute passt es?"-Score, Koederberater, Beisszeiten/Solunar,
  Packliste, Knoten-Referenz, Bleigewicht-Berater
- **Offline-Modus**: Service Worker cached App, Module, Regionsdaten und besuchte Tiles

## Architektur

Der App-Code ist in **TypeScript** unter `src/` geschrieben und wird nach `js/` kompiliert.
`index.html` laedt Leaflet (global) und den Einstiegspunkt `js/app.js`; der Browser loest die
ES-Module-Imports nativ auf – **kein Bundler zur Laufzeit**, GitHub Pages liefert `js/` unveraendert aus.

Die Typen liegen zentral in `src/types.ts` (Spot, Region, Schonzeit, Fang, …). Damit sind auch die
60 KB Regionsdaten in `src/data.ts` compilergeprueft: ein Tippfehler in einer Kategorie oder ein
fehlendes Pflichtfeld faellt beim Bauen auf, nicht am Wasser.

| Modul | Verantwortung |
|-------|---------------|
| `types.ts` | Zentrale Typdefinitionen (Spot, Region, Schonzeit, Fang, AppState) |
| `dom.ts` | Typsichere DOM-Helfer (byId, qs, qsa) |
| `state.ts` | Zentraler mutable State (als Objekt) + Storage-Shim |
| `util.ts` | HTML-Escape, SVG-Icon-Set |
| `data.ts` | Regionsdaten: Kategorien, Spots, Schonzeiten, `REGIONS_EMBEDDED` |
| `astro.ts` | Sonne, Mond, Solunar, Schonzeit-Fenster |
| `mapcore.ts` | Leaflet-Instanz (frueh initialisiert, reihenfolge-kritisch) |
| `region.ts` | Regions-Verwaltung (JSON-DB + eingebetteter Fallback) |
| `ui.ts` | Header (Sonne/Banner) & Tabs |
| `map.ts` | Marker, Filter, Popups, Standort, Spot-Liste |
| `myspots.ts` | Eigene Spots (Long-Press/Rechtsklick) |
| `weather.ts` | Wetter & Pegel (Open-Meteo + PEGELONLINE) |
| `geo.ts` | Geometrie fuer Wind- und Ufer-Logik (Peilung, auflandig) |
| `rating.ts` | Spotbewertung: Sterne/Prozent + nachvollziehbare Gruende |
| `plan.ts` | Planer: konkrete Spot-/Zeit-Empfehlung, Tages-Blaetterer, Tagesplan |
| `saison.ts` | Jahreszeit-Fokus & saisonale Hotspot-Dimmung |
| `tackle.ts` | Tackle-Empfehlung pro Gewaesser (kuratiert + abgeleitet) |
| `sicht.ts` | Einfach-/Pro-Sicht (reduziert Entscheidungen, nie Sicherheit) |
| `reed.ts` | Schilf-/Roehricht-Layer aus OSM (Overpass) |
| `fullscreen.ts` | Vollbildmodus der Karte (inkl. iOS-Fallback) |
| `tools.ts` | Werkzeuge-Menue (Score, Koeder, Beisszeiten, Packliste, Knoten, Blei) |
| `regeln.ts` | Regeln-Tab & Schonzeit-Kalender |
| `fangbuch.ts` | Fangbuch inkl. Backup/Restore |
| `trip.ts` | Trip-Planer (gemerkte Spots) |
| `app.ts` | Einstiegspunkt, laedt Module in Abhaengigkeitsreihenfolge |

Geteilter Zustand liegt im `state`-Objekt aus `state.js` (Properties werden mutiert, nie neu
zugewiesen) – so sehen alle Module live dieselben Werte, ohne die Import-Bindungen zu verletzen.

Die Regionsdaten liegen zusaetzlich als JSON unter `data/` (aus `js/data.js` generiert) und
werden zur Laufzeit geladen; `REGIONS_EMBEDDED` in `js/data.js` ist der Offline-Fallback.

## Entwicklung & Workflow

Voraussetzung fuer Tests/Build-Helfer: Node.js. `esbuild` wird nur fuer den Test-Bundle
gebraucht (nicht fuers Deployment).

```
node tools/build.mjs            # src/*.ts -> js/ kompilieren (vor jedem Deploy noetig)
node tools/check-build.mjs      # Typecheck + Drift-Check (ist js/ aktuell zu src/?)
node tools/test.mjs             # komplette Test-Suite (Node-Test-Runner + jsdom)

node tools/gen-data.mjs         # data/*.json aus js/data.js regenerieren
node tools/check-data.mjs       # pruefen ob data/*.json bit-genau zu js/data.js passen
node tools/validate-data.mjs    # Datenintegritaet (Schonzeiten, Masse, Koordinaten, zugang, verif)
node tools/test-load.mjs        # echter Live-Ladepfad (Manifest -> Dateien)
node tools/check-imports.mjs    # fehlende moduluebergreifende Importe finden
node tools/check-state.mjs      # nackte State-Referenzen finden (z.B. fbMem statt state.fbMem)
```

Voraussetzungen fuer die Werkzeuge (einmalig pro Umgebung):

```
npm install typescript@5 --no-save --prefix /tmp/ts-install      # TS 7 (nativer tsc) typt lib.dom anders
npm install esbuild      --no-save --prefix /tmp/esbuild-install # nur fuer den Test-Harness
npm install jsdom        --no-save --prefix /tmp/jsdom-install   # nur fuer den Test-Harness
```

## Tests

Die Suite liegt unter `tests/` und nutzt den eingebauten Node-Test-Runner (keine zusaetzliche
Abhaengigkeit) plus jsdom:

| Datei | Inhalt |
|-------|--------|
| `tests/logik.test.mjs` | Datumsfenster, Schonzeiten, Entnahmefenster, Solunar, Entfernungen |
| `tests/daten.test.mjs` | Regionsdaten: Pflichtfelder, Koordinaten, Kartenlinks, Manifest |
| `tests/fangbuch.test.mjs` | Speichern, Maszcheck, Statistik, Backup/Restore |
| `tests/app.test.mjs` | Regionswechsel, Popups, Filter, Trip-Liste, Sperrzonen-Warnung |
| `tests/plan.test.mjs` | Planer: Empfehlung, Tages-Blaetterer, Tagesplan |
| `tests/rating.test.mjs` | Spotbewertung (Sterne/Prozent/Gruende) |
| `tests/saison.test.mjs`, `sicht`, `tackle`, `fullscreen` | Saison-Fokus, Einfach/Pro-Sicht, Tackle, Vollbild |
| `tests/regression.test.mjs` | Regressionen aus echten Bugs |

Die Datentests pruefen **Regeln statt konkreter Zahlen**, damit neue Regionen automatisch
mitgeprueft werden. `tools/test.mjs` kompiliert vorher TypeScript und laeuft im Deploy-Waechter
automatisch mit – ein roter Test blockiert den Deploy auf `main`.

Nach jeder Datenaenderung in `js/data.js`: `gen-data.mjs` -> `check-data.mjs` ausfuehren,
damit die JSON-Dateien synchron bleiben. `validate-data.mjs` laeuft im Deploy automatisch mit
und blockiert bei Datenfehlern.

## Veroeffentlichen (GitHub Pages)

1. Repo `angelkarte` (Public), hochladen: `index.html`, `manifest.json`, `sw.js`,
   Ordner `js/` und Ordner `data/`
2. **Settings -> Pages** -> Source: *Deploy from a branch* -> Branch `main`, Ordner `/ (root)`
3. Nach 1–2 Minuten laeuft die App unter `https://DEINNAME.github.io/angelkarte/`
4. iPhone/Android: Seite oeffnen -> *Zum Home-Bildschirm hinzufuegen*

**Hinweis:** ES-Module brauchen HTTP(S) – die App laeuft nicht per `file://`, sondern muss
ausgeliefert werden (GitHub Pages, lokaler Webserver o.ae.).

Bei Aenderungen am Service Worker oder den Modulen die Cache-Version in `sw.js`
(`angelkarte-shell-vN`) hochzaehlen, damit Clients die neue Version laden.

## Datenqualitaet

Spots tragen ein `verif`-Level: **A** (Kerndaten belegt), **B** (teils unbelegt, vor Ort
pruefen), **C** (schwache Beleglage). Schonzeiten/Masse sind gegen die jeweiligen
Landesverordnungen abgeglichen (Stand 07/2026). Massgeblich bleiben immer der jeweilige
Erlaubnisschein und die Beschilderung vor Ort.

## Keine API-Keys

Alle Features laufen ohne Schluessel: Wetter (Open-Meteo) und Pegel (PEGELONLINE) sind
frei zugaenglich, die Karte nutzt OpenStreetMap-Tiles.
