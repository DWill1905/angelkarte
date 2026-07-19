# Changelog

Alle nennenswerten Änderungen an Beißzeit. Versionierung nach
[Semantic Versioning](https://semver.org/lang/de/) (`MAJOR.MINOR.PATCH`):
**PATCH** für Bugfixes/kleine Korrekturen, **MINOR** für neue, abwärtskompatible
Funktionen, **MAJOR** für Änderungen, die bestehende Nutzung/Daten brechen könnten.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

Die ausführliche technische Historie vor 1.0.0 (jede einzelne der früheren
`beisszeit-shell-vN`-Versionen mit Ursache, Testabdeckung, betroffenen Dateien) steht
weiterhin in **[CHANGELOG-ARCHIV.md](CHANGELOG-ARCHIV.md)**.

## [1.5.1] – 2026-07-19

### Geändert
- **`tiefe`-Feld (Maximaltiefe) für 11 Seen nachgetragen.** Audit zur Tiefenkarten-Frage
  ergab: eine flächendeckende, freie Tiefenkarten-Datenquelle für kleine deutsche Seen
  existiert nicht (OpenSeaMap hat hier keine Abdeckung; die einzige echte Landes-WMS,
  Mecklenburg-Vorpommern, ist lizenzrechtlich nur für private Nutzung freigegeben, nicht
  für eine öffentliche App einbindbar). Die App hatte aber bereits ein strukturiertes
  `tiefe`-Feld pro Spot, das Jigkopfgewicht und Rutenwahl mitsteuert (`tackle.ts`, Ström­ungs-
  Bleiempfehlung in `plan.ts`) – befüllt war es bisher bei keinem der 113+ Spots, obwohl
  viele Beschreibungen die Tiefe längst im Freitext nannten. Jetzt aus bereits recherchierten,
  eindeutigen Angaben übernommen: Woblitzsee (7 m), Rätzsee (20 m), Klenzsee (20 m), Eicher
  See (15 m), VSA Angelsee Heuchelheim (10 m), Dutenhofener See (11,4 m), Wißmarer See
  (4,3 m), Feringasee (7 m), Langwieder See (8 m), Mittlerer-Isar-Kanal (4 m), Hollerner See
  (17 m). Talsperre Saidenbach bewusst ausgelassen: die Texterwähnung ("Fische oft bis ~15 m
  Tiefe") beschreibt den Aufenthaltsbereich der Fische, nicht die tatsächliche Maximaltiefe
  der Talsperre (die real deutlich tiefer ist) – hier hätte eine falsche Zahl die Jigkopf-
  Empfehlung eher verfälscht als verbessert.

## [1.5.0] – 2026-07-19

### Hinzugefügt
- **Feste Uhrzeit im Planer ("Heute würde ich hier anfangen"): "Ich will um X Uhr los –
  was sind meine besten Chancen auf welchen Fisch?"** Audit ergab: Das Bewertungsmodell
  (`bewerteSpot()`/`kandidaten()`) konnte technisch schon für jeden beliebigen Zeitpunkt
  rechnen, die Oberfläche zeigte aber immer nur "jetzt" (heute) bzw. das automatisch
  erkannte beste Fenster (Folgetage) – eine gezielte Uhrzeit ließ sich nirgends eingeben.
  Neues Uhrzeit-Feld im Planer (kombinierbar mit der bestehenden Tagesauswahl) schaltet
  auf eine Rangliste "Ort · Zielfisch · Chance %" für exakt diesen Zeitpunkt um, statt
  wie die normale Empfehlung auf ein "besseres" Fenster zu verschieben – das würde einer
  bewusst gewählten Uhrzeit widersprechen. Nutzt dieselbe Berechnung wie die "Chancen
  heute"-Anzeige im Popup, keine neue Bewertungslogik.

## [1.4.1] – 2026-07-19

### Geprüft, keine Fehler gefunden
- Alle 18 Erzgebirge-Spots inkl. Hotspots und die 33 Stützpunkte der Fluss-Polylinien
  (Mulde/Flöha) gegen offizielle/unabhängige Quellen geprüft: keine vertauschten
  Koordinaten, kein falsches Gebiet, alle Werte liegen im erwarteten Gebiet
  (50,69–51,03° N / 13,1–13,6° O). Einzelne Stichproben (Talsperre Saidenbach,
  Talsperre Rauschenbach, Großhartmannsdorfer Großteich, Schlüsselteich) zeigen nur
  die für handplatzierte Pins auf großen Seen übliche Abweichung von 200 m bis 1,1 km
  zum jeweiligen Referenzpunkt (Damm/Zentrum) – kein Fehler.

### Behoben
- **Schlüsselteich (Freiberg): echte Gewässernummer C01-110 ergänzt** (bisher nur
  Platzhalter "AVS") sowie die Lagebeschreibung präzisiert (mitten in der Altstadt,
  nördlich des Meißner Rings).
- **Talsperre Rauschenbach: Wasserfläche korrigiert** – bisher "~94 ha" (grob
  geschätzt), tatsächlich 114,58 ha Gesamtfläche (99,43 ha deutsche + 15,15 ha
  tschechische Seite).

## [1.4.0] – 2026-07-19

### Geändert
- **Erzgebirge: Hecht- und Zander-Mindestmaß im Fangbuch auf 60 cm angehoben.** Die
  LVSA-Gewässerordnung 2024 (bindend für praktisch jeden Spot der Region, da fast alle
  einen AVS-/LVSA-Erlaubnisschein voraussetzen) schreibt für beide Arten 60 cm vor –
  strenger als das gesetzliche SächsFischVO-Mindestmaß von 50 cm, das bisher allein
  hinterlegt war. Ein Hecht/Zander mit 55 cm hätte das Fangbuch bislang fälschlich als
  "in Ordnung" durchgehen lassen. Über vier unabhängige Suchanfragen konsistent
  bestätigt (nur ein Ausreißer-Ergebnis mit abweichenden Werten, die verdächtig genau
  denen der Mecklenburg-Region in dieser App glichen – vermutlich eine KI-Verwechslung
  und bewusst verworfen). Quellenangabe im Regeln-Tab zeigt jetzt beide Werte
  (Vereinsregel + gesetzliches Mindestmaß) transparent nebeneinander.
- Zusätzlich ein Tageslimit für Hecht/Zander laut Gewässerordnung als Hinweis ergänzt
  – die genaue Stückzahl wurde in den Quellen uneinheitlich wiedergegeben, deshalb
  bewusst ohne konkrete Zahl im Fangbuch, nur als Prüfhinweis im Regeln-Tab.

## [1.3.1] – 2026-07-19

### Behoben
- **Erzgebirge: Döbel und Brachse fehlten in der Schonzeiten-Tabelle**, obwohl beide an
  mehreren Spots (4× Döbel an Mulde-/Flöha-Strecken, 3× Brachse an Talsperren/Teichen)
  als Zielart gelistet sind – dieselbe Lücke wie zuletzt bei Gießen/Döbel. Diesmal mit
  konkretem Mindestmaß belegt: Döbel ab 25 cm (keine Schonzeit), Brachse ganz ohne
  Regulierung – beide nach SächsFischVO 2022.
- **Talsperre Lichtenberg/Vorsperre Dittersbach: Sanierungsstand aktualisiert.** Die
  bestehende Notiz ("Bauarbeiten laufen") war noch korrekt, aber ungenau – aktuell
  bestätigt: Dammkrone laut Landestalsperrenverwaltung Sachsen mindestens bis Ende 2026
  gesperrt, Bauzeit insgesamt ≥ 2 Jahre. Für die separate Vorsperre Dittersbach dagegen
  neu gefunden: sie ist von der Hauptsperren-Sanierung nicht zwingend betroffen und
  laut aktueller Quellenlage weiterhin befischbar (vorher stand dort nur ein pauschales
  "vorab prüfen").

### Geprüft, keine Änderung nötig
- Talsperre Rauschenbach hat trotz guter Beschreibung keine Hotspots – dazu keine
  einzelne, ausreichend sicher belegte Stelle gefunden (bewusst keine erfunden).
  Koordinaten aller Fluss-Spots (Mulde/Flöha-Strecken) gegen ihre hinterlegten
  Polylinien geprüft – alle plausibel, keine Abweichung gefunden.

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
