# Changelog

Alle nennenswerten Änderungen an Beißzeit. Versionierung nach
[Semantic Versioning](https://semver.org/lang/de/) (`MAJOR.MINOR.PATCH`):
**PATCH** für Bugfixes/kleine Korrekturen, **MINOR** für neue, abwärtskompatible
Funktionen, **MAJOR** für Änderungen, die bestehende Nutzung/Daten brechen könnten.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

Die ausführliche technische Historie vor 1.0.0 (jede einzelne der früheren
`beisszeit-shell-vN`-Versionen mit Ursache, Testabdeckung, betroffenen Dateien) steht
weiterhin in **[CHANGELOG-ARCHIV.md](CHANGELOG-ARCHIV.md)**.

## [1.3.0] – 2026-07-19

### Hinzugefügt
- **Konkrete Hotspots für 3 der 5 München-Spots recherchiert und ergänzt:** Einlauf am
  Kraftwerk (Ismaninger Speichersee, dabei auch Barbe als bislang übersehene Zielart
  nachgetragen), Steg zum Lußsee (Langwieder See), Isarwehr Oberföhring/Kanaleinlauf
  (Mittlerer-Isar-Kanal). Für Feringasee und Hollerner See fand sich keine einzelne,
  ausreichend sicher belegte Stelle – dort stattdessen die recherchierten allgemeinen
  Struktur-/Zugangshinweise (Tiefe, Kanten, Wasserwacht-Bereich als leichter begehbare
  Zone) in den Beschreibungstext eingearbeitet, statt eine Koordinate zu erfinden.

## [1.2.1] – 2026-07-19

### Behoben
- **Gießen/Lahntal: Döbel war an drei Spots als Zielart gelistet, fehlte aber komplett
  in der Schonzeiten-Tabelle der Region.** Jeder geloggte Döbel-Fang im Fangbuch zeigte
  dadurch "keine Daten vorliegen – KEINE Freigabe", obwohl Döbel in Hessen laut
  Quellenlage kein Mindestmaß und keine Schonzeit hat (wie bereits für Barsch/Wels in
  derselben Region hinterlegt). Ergänzt – Verhalten jetzt konsistent mit den anderen
  unregulierten Arten. Ein Hinweis auf eine möglicherweise regional geltende
  Entnahmepflicht (wie bei Zander) wurde bewusst NICHT übernommen, da dafür keine
  ausreichend sichere Quelle vorlag.
  Gefunden durch einen gezielten Abgleich aller an Gießen-Spots gelisteten Zielarten
  gegen die Schonzeiten-Tabelle der Region. Derselbe automatisierte Abgleich über alle
  sieben Regionen zeigt: dieselbe Lücke (Art als Zielfisch gelistet, aber nicht in der
  Schonzeiten-Tabelle – meist Brachse/Rotauge/Regenbogenforelle) besteht noch in fünf
  weiteren Regionen. Bewusst nicht im selben Schritt mitgefixt, da jede Region eine
  eigene, ähnlich sorgfältige Rechtsrecherche bräuchte wie München – als eigene
  Folgeaufgabe zu behandeln, nicht nebenbei zu raten.

## [1.2.0] – 2026-07-19

### Hinzugefügt
- **Spot-eigene Schonzeit-/Maß-Ausnahmen werden jetzt im Fangbuch tatsächlich geprüft.**
  Bisher war `schonzeitInfo` (z.B. "Hecht hier vereinsseitig ab 60 cm") reiner
  Anzeigetext im Popup – `checkFang()` prüfte trotzdem nur gegen das regionsweite Maß,
  hätte also einen 55-cm-Hecht am Ismaninger Speichersee fälschlich als "in Ordnung"
  durchgehen lassen. Neues Feld `schonzeitOverride` je Spot wird jetzt vorrangig
  geprüft; bereits für den Ismaninger Speichersee (Hecht ab 60 cm) gesetzt. Bewusst
  NICHT gesetzt für eine zweite, unsicher belegte Ausnahme (Hollerner See, Seeforelle)
  – dort bliebe im Fehlerfall ein noch geschonter Fisch fälschlich freigegeben, das
  Risiko ist in diese Richtung schwerer als im Zweifel zu streng zu prüfen.
- Dabei einen zweiten Bug im selben Zug gefunden und behoben: ein Wechsel des
  Gewässers im Fangbuch-Formular löste bisher keine neue Maßprüfung aus – eine bereits
  angezeigte Warnung blieb nach dem Spotwechsel fälschlich stehen.

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
