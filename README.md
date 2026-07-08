# Angelkarte

Interaktive Angelkarten-PWA (Leaflet) für Raubfischangler – **keyfrei**, offline-fähig,
läuft als statische Seite auf GitHub Pages. Vier Regionen mit recherchierten Spots,
Schonzeiten-Status, Fangbuch, Beißzeiten-/Köder-/Blei-Beratern und einem
„Heute passt es?"-Score.

**Live:** https://dwill1905.github.io/angelkarte/

## Features

- **Karte** mit Spots, Flussstrecken, Hotspots und eigenen Spots (Long-Press/Rechtsklick)
- **4 Regionen** (umschaltbar, alles regionsabhängig): Erzgebirge, Rhein & Rheinhessen,
  Gießen/Lahntal, Mecklenburgische Kleinseenplatte
- **Filter** nach Kategorie, Zielfisch und „nur Ufer" (blendet reine Bootsseen aus)
- **Schonzeiten & Maße** mit Live-Maßcheck im Fangbuch (inkl. Entnahmefenster),
  Jahres-Kalender, regionsabhängige Regeln – gegen die Landesverordnungen abgeglichen
- **Fangbuch** (lokal): Maßcheck, Bearbeiten, CSV-Export, Musterauswertung, Bestenliste
- **Wetter & Pegel** im Header (Open-Meteo + PEGELONLINE, keylos): Temperatur, Wind,
  Luftdruck mit 3h-Trend, nächster Pegel im Umkreis, Gewitter-/Sturmwarnung
- **Sonne, Mond & blaue Stunde** im Header inkl. Nachtangel-Fenster
- **Werkzeuge** (Menue): „Heute passt es?"-Score, Koederberater, Beisszeiten/Solunar,
  Packliste, Knoten-Referenz, Bleigewicht-Berater
- **Offline-Modus**: Service Worker cached App, Module, Regionsdaten und besuchte Tiles

## Architektur

Der App-Code ist in **ES-Module** unter `js/` aufgeteilt. `index.html` laedt Leaflet (global)
und den Einstiegspunkt `js/app.js`; der Browser loest die Imports nativ auf – **kein Build-Schritt**.

| Modul | Verantwortung |
|-------|---------------|
| `state.js` | Zentraler mutable State (als Objekt) + Storage-Shim |
| `util.js` | HTML-Escape, SVG-Icon-Set |
| `data.js` | Regionsdaten: Kategorien, Spots, Schonzeiten, `REGIONS_EMBEDDED` |
| `astro.js` | Sonne, Mond, Solunar, Schonzeit-Fenster |
| `mapcore.js` | Leaflet-Instanz (frueh initialisiert, reihenfolge-kritisch) |
| `region.js` | Regions-Verwaltung (JSON-DB + eingebetteter Fallback) |
| `ui.js` | Header (Sonne/Banner) & Tabs |
| `map.js` | Marker, Filter, Popups, Standort, Spot-Liste |
| `myspots.js` | Eigene Spots (Long-Press/Rechtsklick) |
| `weather.js` | Wetter & Pegel (Open-Meteo + PEGELONLINE) |
| `tools.js` | Werkzeuge-Menue (Score, Koeder, Beisszeiten, Packliste, Knoten, Blei) |
| `regeln.js` | Regeln-Tab & Schonzeit-Kalender |
| `fangbuch.js` | Fangbuch |
| `app.js` | Einstiegspunkt, laedt Module in Abhaengigkeitsreihenfolge |

Geteilter Zustand liegt im `state`-Objekt aus `state.js` (Properties werden mutiert, nie neu
zugewiesen) – so sehen alle Module live dieselben Werte, ohne die Import-Bindungen zu verletzen.

Die Regionsdaten liegen zusaetzlich als JSON unter `data/` (aus `js/data.js` generiert) und
werden zur Laufzeit geladen; `REGIONS_EMBEDDED` in `js/data.js` ist der Offline-Fallback.

## Entwicklung & Workflow

Voraussetzung fuer Tests/Build-Helfer: Node.js. `esbuild` wird nur fuer den Test-Bundle
gebraucht (nicht fuers Deployment).

```
node tools/gen-data.mjs         # data/*.json aus js/data.js regenerieren
node tools/check-data.mjs       # pruefen ob data/*.json bit-genau zu js/data.js passen
node tools/validate-data.mjs    # Datenintegritaet (Schonzeiten, Masse, Koordinaten, zugang, verif)
node tools/check-imports.mjs    # fehlende moduluebergreifende Importe finden (Live-Crash-Schutz)
node tools/build-test-bundle.mjs# Test-Bundle fuer den jsdom-Harness bauen
```

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
