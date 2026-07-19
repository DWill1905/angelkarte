# Changelog

Alle nennenswerten Änderungen an Beißzeit. Versionierung nach
[Semantic Versioning](https://semver.org/lang/de/) (`MAJOR.MINOR.PATCH`):
**PATCH** für Bugfixes/kleine Korrekturen, **MINOR** für neue, abwärtskompatible
Funktionen, **MAJOR** für Änderungen, die bestehende Nutzung/Daten brechen könnten.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

Die ausführliche technische Historie vor 1.0.0 (jede einzelne der früheren
`beisszeit-shell-vN`-Versionen mit Ursache, Testabdeckung, betroffenen Dateien) steht
weiterhin in **[CHANGELOG-ARCHIV.md](CHANGELOG-ARCHIV.md)**.

## [1.1.0] – 2026-07-19

### Hinzugefügt
- **Neue Region: München / Isar (Bayern)**, 5 recherchierte Spots (Feringasee,
  Ismaninger Speichersee, Langwieder See, Mittlerer-Isar-Kanal, Hollerner See) mit
  echten Tageskarten-Quellen (Fischwaid München e.V. über hejfish, Versehrten
  Fischereiverein München e.V.). Schonzeiten/Mindestmaße nach AVBayFiG (Stand
  01.01.2023, Donau-Einzugsgebiet – seit der Reform gelten dort teils andere
  Fristen als im Rhein-/Elbe-/Weser-Gebiet, z. B. beim Aal). Die Isar-Stadtstrecke
  selbst ist für Gastangler praktisch nicht zugänglich (Isarfischer e.V. nimmt
  aktuell keine neuen Mitglieder auf) – das ist im Regeln-Tab transparent vermerkt,
  statt eine unrealistische Zugangsmöglichkeit zu suggerieren.

## [1.0.1] – 2026-07-19

### Entfernt
- Toten Code aufgeräumt: ungenutzte CSS-Regeln (`h1`/`.tilde`-Rest ohne zugehöriges
  Element, `.saison-i`-Badge, eine ins Leere zeigende `#saisonBar`-Selektorzeile),
  ungenutzte CSS-Variablen (`--abyss`-Duplikat von `--ink`, `--raub`/`--fried`/
  `--sperr` – die echten Kategoriefarben kommen aus `data.ts`) sowie ein verwaistes
  Build-Skript (`tools/build-test-bundle.mjs`), dessen Ausgabe nirgends mehr
  eingelesen wurde. Keine sichtbare Änderung – rein interne Aufräumarbeit.

## [1.0.0] – 2026-07-19

Erste Version nach Semantic Versioning. Fasst die gesamte bisherige Entwicklung
(vormals `SW v1`–`v177`) zusammen – Details dazu im Archiv.

### Hinzugefügt
- Fangbuch mit Maßcheck, Bearbeiten, CSV-Export, Backup/Restore, Teilen-Funktion
- Planer ("Heute würde ich hier anfangen") mit Rangliste, 7-Tage-Ausblick und
  Kalender-Export (.ics)
- Eigene Spots (Long-Press/Rechtsklick), bearbeitbar, plus persönliche Notizen an
  bestehenden Spots
- Erlaubnisschein-Ablauf-Reminder, Offline-Kartenmodus mit Fortschritt/Abbruch
- Wetter, Pegel, Sonne/Mond/Solunar, "Heute passt es?"-Score, Köder-/Blei-/
  Knoten-Berater

### Geändert
- Durchgängiges Design-System (Farben, Abstände, Radien, Schatten als Tokens),
  einheitliche Typografie, dezente Motion (respektiert `prefers-reduced-motion`)
- Umbenennung Angelkarte → Beißzeit (Name, Icons, Manifest, Exporte)
- Zahlreiche Usability-Durchgänge: kompaktere Dialoge, weniger Wiederholung,
  bessere Lesbarkeit von Bewertungen und Empfehlungen

### Behoben
- Barrierefreiheit: Fokus-Ring, Tastaturbedienung, Kontrast (WCAG), Windows-
  Kontrastmodus, Screenreader-Hinweise (`aria-live`, Labels) app-weit nachgezogen
- Diverse regionsspezifische Angelregeln (Kunstköderverbote, Rücksetzverbote,
  Tageslimits, Anfütter-/Bootsverbote) korrekt im Fangbuch/Planer abgebildet
- Verschiedene Detail-Bugs (u. a. Datumsfehler bei Mondzeiten, verwaiste
  Trip-Einträge, Layout-Überlappungen auf kleinen/queren Bildschirmen)
