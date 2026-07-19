# Changelog

## SW v132 – 2026-07-19

### Changed
- **UI-Modernisierung: 20 Design-/Motion-Verbesserungen.** Reine Optik, keine
  Funktionsänderung – alle 441 Tests unverändert grün, da nur CSS und rein präsentative
  Zusatzmarkup (Fortschrittsring, Grip-Griff) angefasst wurden:
  1. Elevation-Tokens (`--shadow-sm/md/lg/xl`) statt Ad-hoc-Schatten, auf Dialoge, Popup,
     FABs, Sheet-Panel, Marker-Cluster, Legende angewendet
  2. Dialoge blenden jetzt sanft ein (Fade+Scale) statt hart umzuschalten
  3. Tastile `:active`-Rückmeldung (Press-Scale) auf Chips, Tabs, Buttons, Listeneinträgen
  4. Tableiste (Karte/Regeln/Fangbuch) als Segmented Control mit gefüllter aktiver Pille
     statt Underline
  5. Kompakter Fortschrittsring neben der Chancen-Prozentzahl (reines CSS, `conic-gradient`
     + Masken-Trick, aus `--pct` abgeleitet)
  6. Themed Scrollbar für Dialoge und Spotliste statt Browser-Default
  7. Konsistenter Fokus-Ring auf allen interaktiven Elementen (vorher nur 4 vereinzelte
     Stellen)
  8. Grip-Griff am Sheet-Handle (übliche Bottom-Sheet-Affordanz)
  9. Zweischichtiger, weicherer Popup-Schatten + sanftes Eintreten
  10. Sanfter Fokus-Glow auf Eingabefeldern/Selects
  11. Kleiner Feder-Bounce beim Auswählen eines Fischart-Chips
  12. Einheitliches Empty-State-Bild (Kreis-Anker) für Fangbuch, Trip-Liste, Spotliste ohne
     Treffer
  13. Speicher-/Import-Rückmeldungen als Pille statt reinem Fließtext
  14. Lade-Puls (vom Wetter-Chip) auch für den Offline-Karten-Fortschritt
  15. Sanftes Einblenden beim Wechsel zwischen Karte/Regeln/Fangbuch
  16. Spacing-Tokens (`--space-1..6`) eingeführt, auf die häufigsten exakten `gap`-Treffer
     angewendet (wie bei den Radius-Tokens: Migration der übrigen Werte als Folge-Schritt)
  17. Amber-CTAs (Fang speichern, primäre Dialog-Buttons, Tagesplan-CTA) mit Gradient/Glow
     vereinheitlicht
  18. Leichte Hover-/Tap-Skalierung auf Karten-Markern (sitzt bewusst auf dem inneren SVG,
     nicht auf dem von Leaflet positionierten Element)
  19. Popup-Schließen-Kreuz als runder Button mit echter Trefferfläche statt nacktem "×"
  20. Schwebende Werkzeugleiste (Standort/Vollbild/Werkzeuge/Legende) auf einheitliche
     Größe (44px), Schatten und Blur vereinheitlicht – Vollbild-Button war zuvor mit 40px
     unter dem Touch-Ziel-Minimum
  Alles respektiert `prefers-reduced-motion`.

## SW v131 – 2026-07-19

### Fixed
- **Fangbuch-Backup-Import: Einträge ohne (oder mit kollidierender) id waren nach dem
  Import unlöschbar/unbearbeitbar.** `fbRestore()` verlangt beim Validieren bewusst keine
  `id` (damit auch fremde/handbearbeitete JSON-Dateien importierbar bleiben), hat sie aber
  nie nachträglich vergeben. Löschen/Bearbeiten vergleicht Einträge über `id` – fehlte sie
  bei mehreren importierten Fängen gleichzeitig (immer `undefined`), trafen Löschen/
  Bearbeiten keinen oder den falschen Eintrag, ohne Fehlermeldung. `fbRestore()` vergibt
  jetzt für jeden Import-Eintrag ohne gültige, im Bestand noch freie id eine frische
  (`uid()`) – vorhandene, eindeutige ids bleiben unangetastet. Drei neue Tests; die
  bestehenden Backup-Tests liefen bisher selbst unbemerkt über genau diesen Weg (Fixtures
  ohne id).

## SW v130 – 2026-07-19

### Fixed
- **Fachlicher Fix: Anfütterverbot am Wißmarer See (Gießen) war unenforced.** Die Spotnotiz
  sagt explizit "Anfüttern verboten", das strukturierte Feld `keinAnfuettern` (steuert die
  Tackle-Ableitung in `tackleHtml()`) war aber nicht gesetzt – die Köder-/Montage-Empfehlung
  für Karpfen/Schleie schlug trotzdem ganz normal Method-Feeder/Futterkorb vor und
  widersprach damit der eigenen Gewässerregel. `keinAnfuettern:true` ergänzt; einziger
  betroffener Spot regionsübergreifend (alle anderen Vorkommen der Regel waren bereits
  korrekt verdrahtet). Ein neuer Test – die Funktion hatte bisher trotz Verwendung in zwei
  Modulen (tackle.ts, plan.ts) keine einzige Testabdeckung.

## SW v129 – 2026-07-19

### Fixed
- **Fachlicher Fix: Rücksetzverbot (Rhein/Mainz) war im Fangbuch komplett unenforced.**
  Barsch, Wels und Brachse haben laut Erlaubnisschein kein Mindestmaß – die Region weist
  selbst darauf hin (`schonQuelle`, Packliste, Regeln-Tab): "Fische ohne Mindestmaß dürfen
  NICHT zurückgesetzt werden". Diese Info stand aber nur als Anzeige-Text in den
  Schonzeit-Daten (`mm: "– (kein Maß; Rücksetzverbot!)"`) und wurde im Fangbuch selbst –
  wo die Entscheidung "entnommen ja/nein" tatsächlich getroffen wird – nie geprüft:
  `masseAus()` findet in diesem Text keine Zahl, also blieb `checkFang()` für diese drei
  Arten stumm, ob entnommen oder nicht. Neues strukturiertes Feld
  `Schonzeit.ruecksetzverbot`; `checkFang()` warnt jetzt, wenn eine so markierte Art NICHT
  entnommen wird, und bestätigt, wenn doch. Die Checkbox "Fisch entnommen" löst die Prüfung
  jetzt auch live per `change`-Handler aus (vorher nur Fischart/Länge). Dieselbe Lücke wie
  zuvor bei den unenforced Tageslimits (Elbe/Main) – nur diesmal keine Zahlengrenze,
  sondern eine Ja/Nein-Regel. Fünf neue Tests.

## SW v128 – 2026-07-19

### Changed
- **Design-Audit Phase 3: Wetter-Chip unterscheidet jetzt Lade- von Fehlerzustand.** Der
  Chip im Header zeigte bisher in beiden Fällen nur „–", ohne erkennbar zu machen, ob noch
  geladen wird oder der Abruf (z.B. offline) endgültig gescheitert ist – der einzige
  permanent sichtbare Live-Datenpunkt im Header hatte kein bewusstes Leer-/Fehlerbild.
  Neues `state.wxError`: solange noch kein Ergebnis da ist, pulsiert der Chip dezent
  (`#wxChip.loading`, respektiert `prefers-reduced-motion`); schlägt der Abruf fehl, zeigt
  er ein ⚠-Symbol mit Tooltip „Wetter nicht verfügbar – ohne Netz nur lokal berechnete
  Werte (Sonne, Mond, Beißfenster)". Ein erneuter erfolgreicher Abruf setzt beides zurück.
  Drei neue Tests.

## SW v127 – 2026-07-19

### Changed
- **Design-Audit Phase 2 (2/2): Radius-Tokens eingeführt.** 11 verschiedene border-radius-
  Werte (2–14px, 999px) waren ohne System im Einsatz. Neue Tokens `--radius-sm:6px`,
  `--radius-md:10px`, `--radius-lg:14px`, `--radius-full:999px` in `:root`; die bereits
  dominante Gruppe (13× exakt 10px: Chips, Header-Icons, Popups, Karten, Fangbuch-Formular
  u.a.) sowie die einzelnen 14px- und 999px-Stellen darauf umgestellt – reine
  Tokenisierung ohne visuelle Änderung, per Playwright-Vergleich verifiziert. Die
  restlichen Ad-hoc-Werte (8, 9, 7, 6, 5, 4, 3, 2, 11, 12px) bewusst nicht in diesem
  Rutsch angefasst: sie auf die Skala zu konsolidieren heißt pro Komponente eine echte
  Wertentscheidung zu treffen, das verdient einen eigenen Review-Durchgang statt
  pauschales Runden.

## SW v126 – 2026-07-19

### Changed
- **Design-Audit Phase 2 (1/2): Fangbuch-Checkbox nicht mehr in Versalien.** `<label>` ist
  global auf `text-transform:uppercase` gesetzt (gedacht für kurze, einzeilige Eyebrow-
  Feldlabel wie „FISCHART"). Die Checkbox-Beschriftung „Fisch entnommen (nicht
  zurückgesetzt)" ist als `<label class="fbentn">` aber ein ganzer Satz und erbte dieselbe
  Regel – dadurch lief sie in Versalien über zwei Zeilen, was mehrzeilig deutlich schwerer
  zu lesen ist. `.fbentn` bekommt jetzt `text-transform:none`; sonst kein weiteres Label
  in der App betroffen (alle anderen sind kurze, einzeilige Feldlabel, wo Versalien
  korrekt sind).

## SW v125 – 2026-07-19

### Changed
- **Design-Audit Phase 1 (3/3): Tablet-Breakpoint auf 768px gesenkt.** Das schwebende
  Seitenpanel für die Spotliste existierte bereits (`@media(min-width:820px)`), griff aber
  erst ab 820px – ein iPad im Hochformat (768–834px, je nach Modell) fiel noch unter das
  gestreckte Mobil-Layout mit voller Kartenbreite ohne Seitenpanel. Breakpoint auf die
  Standard-Tablet-Portraitbreite 768px gesenkt (beide Hälften des Media-Query-Paars,
  `min-width:820px`/`max-width:819px` → `768px`/`767px`).

## SW v124 – 2026-07-19

### Changed
- **Design-Audit Phase 1 (2/3): Touch-Ziele auf Mindestgröße angehoben.** Filter-Chips
  (`.chip`, min-height 32px), die Fischart-Unterzeile (`.chips.sub .chip`, 28px) und die drei
  Header-Icon-Buttons (`#menuBtn`, `#saisonTip`, `#wxChip`, 38px) lagen unter der
  WCAG-2.5.5-Empfehlung von 44×44px. Für eine App, die für Einhand-Bedienung am Wasser
  gedacht ist (Sonnenlicht, nasse/kalte Finger), erhöht das die Fehltipp-Quote unnötig.
  Haupt-Filter-Chips und Header-Icons jetzt auf 44px, die dichtere Fischart-Unterzeile auf
  40px als bewusster Kompromiss zwischen Trefferfläche und Zeilenlänge.

## SW v123 – 2026-07-19

### Changed
- **Design-Audit Phase 1 (1/3): Button-Hierarchie in Dialogen korrigiert.** In mehreren
  Dialogen (Werkzeuge, Bissfenster-Wochenvorschau, Trip-Liste, Tagesplan, Karte offline
  sichern, "Heute passt es?", Köderberater, Bleigewicht-Berater, Knoten-Kurzreferenz) war
  „Schließen" per Default-Styling amber/hervorgehoben, während echte Aktionen daneben
  („Heute passt es?", „Beißzeiten heute", „Als Kalender exportieren", „Speichern") grau/
  sekundär blieben – die Farbe zeigte auf die unwichtigste Aktion im Dialog. `.mydlg-btns
  button` ist jetzt standardmäßig neutral gestylt, eine neue `.primary`-Klasse markiert
  bewusst die jeweils wichtigste Aktion: bei reinen Info-Dialogen (nur „Schließen" als
  einzige Aktion) bleibt Schließen primär, bei Dialogen mit echten Aktionen wandert die
  Hervorhebung auf „Als Kalender exportieren" bzw. „Speichern" (Eigenen Spot speichern),
  „Schließen"/„Abbrechen" werden neutral.

## SW v122 – 2026-07-18

### Fixed
- **Trip-Liste verwaiste beim Umbenennen/Löschen eines vorgemerkten eigenen Spots.** Eigene
  Regression aus der kürzlich hinzugefügten „Eigene Spots bearbeiten"-Funktion: die
  Trip-Liste merkt sich Spots nur über den Namen (kein stabiler Fremdschlüssel) – wurde ein
  vorgemerkter eigener Spot umbenannt, zeigte die Trip-Liste weiterhin den alten Namen, ohne
  „Route"-Button und unsichtbar für den Tagesplan (`tagesplan()` findet den Spot über
  `state.SPOTS.find(s => s.name === n)` nicht mehr und lässt ihn stillschweigend fallen).
  Dieselbe Lücke bestand schon vorher beim Löschen. `saveMySpot()` und `delMySpot()`
  gleichen die Trip-Liste jetzt mit ab: Umbenennen aktualisiert den Namen dort mit,
  Löschen entfernt den Eintrag. Drei neue Tests.

## SW v121 – 2026-07-18

### Fixed
- **Elbe-Region: Tageslimit für Hecht/Zander/Karpfen/Quappe war komplett unenforced.** Der
  Regeln-Tab nennt selbst „Max. 3 Fische der Arten Hecht/Zander/Karpfen/Quappe pro Tag
  gesamt" – `checkFang()` hatte dafür (anders als bereits für Mecklenburg, Erzgebirge und
  Main) überhaupt keinen Block, dieselbe Lücke wie beim kürzlich behobenen Main-Limit.
  Ergänzt: Tageszähler wie bei den anderen Regionen, unabhängig davon, ob die Schonzeit der
  jeweiligen Art gerade läuft. Barsch zählt bewusst nicht mit (in der Elbe-Regel nicht
  gelistet). Zwei neue Tests.

## SW v120 – 2026-07-18

### Fixed
- **Mond-Transitzeiten wanderten je nach Tageszeit des Aufrufs auf einen anderen Tag.**
  Beim Testen des Tagesplans am Abend fiel auf: „Stopp 1" schlug ein Fenster von z. B.
  06:27 Uhr vor – wirkte wie ein längst verpasstes Fenster von heute früh, war aber in
  Wahrheit ein falsch datiertes Fenster, weil `moonTimes()` (`astro.ts`) die Mondposition
  aus dem **vollen Zeitstempel** von `date` berechnete statt nur dessen Kalendertag. Dieselbe
  Abfrage für „heute" lieferte je nachdem, ob man sie morgens oder abends stellte,
  unterschiedliche – teils auf den Folgetag verschobene – Transit-/Gegentransitzeiten
  (Mond-Höchststand/-Tiefststand), obwohl der Sonnenanteil der Fenster stabil blieb.
  `moonTimes()` normalisiert `date` jetzt zuerst auf Mittag UTC des Kalendertags, bevor
  daraus Mondlänge/Rektaszension/Sternzeit abgeleitet werden – stabil unabhängig von der
  Abfragezeit. Betraf potenziell jede Stelle, die „heute" ohne Mittags-Anker abfragt
  (Tagesplan, Planer, Beißzeiten heute); die Wochen-Vorschau war durch ihren eigenen
  Mittags-Anker bereits zufällig verschont.
- **Tagesplan konnte bereits abgelaufene Fenster für „heute" vorschlagen.** Zusätzlich zum
  Datierungsfehler oben: `tagesplan()` filterte Solunar-Fenster nicht danach, ob sie schon
  vorbei sind – ein Fenster von heute früh landete am Abend weiterhin als „Stopp 1" einer
  angeblichen Handlungsempfehlung. Für „heute" werden jetzt nur noch Fenster berücksichtigt,
  die noch laufen oder erst noch kommen; an Folgetagen wird nichts gefiltert (der ganze Tag
  ist ohnehin Zukunft). Vier neue Tests insgesamt (zwei direkt an `moonTimes()`/`solunar()`,
  zwei am Tagesplan).

## SW v119 – 2026-07-18

### Added
- **Eigene Spots lassen sich jetzt bearbeiten.** Beim Weitersuchen nach Verbesserungen
  aufgefallen: ein eigener Spot (Long-Press/Rechtsklick) ließ sich bisher nur löschen und
  komplett neu anlegen – ein Tippfehler im Namen oder eine veraltete Notiz war nicht
  korrigierbar, ohne die Koordinate erneut zu treffen. Neuer „Bearbeiten"-Button im Popup
  (neben „Löschen") öffnet denselben Dialog vorbefüllt mit Name/Tiefe/Notiz; der irreführende
  Long-Press-Tipp bleibt dabei ausgeblendet. Speichern aktualisiert den bestehenden Eintrag
  (gleiche ID, gleiche Koordinate) statt einen zweiten anzulegen. Drei neue Tests
  (`tests/myspots.test.mjs`, neue Datei).

## SW v118 – 2026-07-18

### Fixed
- **"Heute passt es?" zeigte 100% bei nur 1 von 5 bekannten Faktoren.** Beim Testen mit
  fehlenden Wetter-/Pegeldaten fiel auf: `computeScore()` berechnete den Prozentwert nur aus
  den tatsächlich bekannten Faktoren – ohne Wetter/Pegel blieb oft nur das (immer verfügbare)
  Beißfenster übrig, das dann allein über den ganzen Wert entschied. Ein starkes Major-Fenster
  ergab so ein selbstbewusstes „100% · Top", obwohl 4 von 5 Signalen komplett fehlten; der
  Hinweis darauf stand nur klein und leicht übersehbar darunter. Jetzt greift dieselbe
  Konfidenz-Dämpfung wie in der Spotbewertung (`rating.ts`): unter 80 % bekannten Faktoren
  wird der Wert zur Mitte gezogen (nie mehr 0 % oder 100 % bei dünner Datenlage). Sturm bleibt
  unverändert ein harter Ausschluss ohne Dämpfung. Drei neue Tests.

## SW v117 – 2026-07-18

### Fixed
- **"Karte offline sichern" ließ sich nicht abbrechen und hatte kein Timeout je Kachel.**
  Beim Testen der App fiel auf: `cacheViewport()` lud die Kacheln streng sequentiell ohne
  jede Abbruchmöglichkeit – Schließen des Dialogs (`offClose`, Klick daneben) setzte nur
  `hidden=true`, der Download lief im Hintergrund unbeirrt weiter (Akku/Datenvolumen für
  nichts, da niemand mehr hinschaut) und eine einzelne hängende Kachelanfrage konnte den
  gesamten Vorgang unbegrenzt blockieren. Jetzt bekommt jede Kachelanfrage ein 8-Sekunden-
  Timeout, und ein `AbortController` wird beim Schließen des Dialogs aktiv abgebrochen –
  `cacheViewport()` bricht die Schleife sofort ab, `openOffline()` schreibt danach keine
  verspätete Erfolgsmeldung mehr in einen geschlossenen Dialog. Zwei neue Tests (mit
  gestellter „hängender" Kachelanfrage, die erst durch das Abort-Signal auflöst).

## SW v116 – 2026-07-18

### Changed
- **Erstbesuch startet in der Einfachen statt der Pro-Sicht.** Letzter Punkt aus dem Usability-
  Review (4/4): ein neuer Nutzer landete bisher direkt in der dichtesten Ansicht der App (Pro)
  und musste den Umschalter im Menü erst selbst entdecken, um es sich einfacher zu machen –
  dabei ist "Einfach" für den Erstkontakt die bessere Startrampe. `ladeSicht()` defaultet jetzt
  auf `'einfach'`, aber nur wenn wirklich nichts gespeichert ist – wer die Sicht schon einmal
  gewählt hat (egal welche), bekommt beim nächsten Besuch weiterhin genau diese. Bestehende
  Nutzer sind also nicht betroffen. Test entsprechend umbenannt/angepasst.

## SW v115 – 2026-07-18

### Changed
- **Modell-Erklärung im Popup jetzt hinter einem Tipp-Toggle.** Usability-Review (3/4): das
  Popup ist der dichteste Bildschirm der App – bei einem Spot mit mehreren Zielarten stand die
  immer gleiche, 3-4-zeilige Erklärung ("Modellwert aus Wassertemperatur, Beißzeit, ...") auf
  jedem einzelnen Popup fest offen da, obwohl sich ihr Inhalt nie ändert. Steckt jetzt in einem
  eingeklappten `<details class="rate-verif-toggle">` ("Wie wird das berechnet? ›") direkt
  unter der Artenliste – ein Klick weiter statt immer sichtbar, spürbar kompakteres Popup.
  Transparenz bleibt vollständig erhalten, nur die Standard-Sichtbarkeit ändert sich. Die
  „Einfache Sicht" blendet den Toggle weiterhin komplett aus (CSS-Selektor entsprechend
  angepasst). Ein neuer Test.

## SW v114 – 2026-07-18

### Changed
- **"Warum dort" im Planer zeigt Stärke als Balken statt nackter Dezimalzahl.** Usability-
  Review (2/4): die Gründe-Liste zeigte rohe Punktwerte wie `+3`, `+0.8`, `-12` neben jedem
  Grund – transparent, aber liest sich wie Debug-Output statt wie eine Begründung für jemanden,
  der einfach nur wissen will, wohin er fahren soll. Die Zahl ist jetzt ein kleiner Balken,
  dessen Länge die Stärke relativ zum stärksten Grund zeigt (weiterhin nach Stärke sortiert) –
  nichts wird verheimlicht, der genaue Wert steht weiterhin offen im Quelltext. Ein neuer Test.

## SW v113 – 2026-07-18

### Changed
- **Sterne + Prozent nicht mehr doppelt für denselben Wert.** Usability-Check: jede Fisch-Zeile
  im Popup und die Hero-Zahl im Planer zeigten Sterne UND Prozent nebeneinander für exakt
  dieselbe Chance ("★★★★★ 88 %") – dieselbe Dopplung, die im Code an anderer Stelle bewusst
  vermieden wird ("keine zwei Prozentwerte für dieselbe Sache"). Beide Stellen zeigen jetzt nur
  noch die Prozentzahl. `sterneAus()`/`sterneText()` bleiben bestehen (weiterhin direkt
  getestet, `sterne`-Feld wird intern noch für Grenzwert-Verhalten wie Sturm-Deckelung
  geprüft) – nur die doppelte Anzeige ist weg, inklusive der jetzt toten `.rate-sterne`/
  `.plan-sterne`-CSS.

## SW v112 – 2026-07-18

### Added
- **Scroll-Fade in allen Dialog-Inhalten.** Fünfter und letzter Fund aus dem UI/UX-Review:
  alle scrollbaren Dialog-Inhalte (Packliste, Knoten, Bleigewicht, Beißzeiten, Wochen-Vorschau,
  Wetter, Tagesplan, Trip-Liste, Offline-Karte, Score, Köderberater – 11 Stellen) schnitten
  ihren Text ohne jeden Hinweis ab, dass darüber/darunter noch mehr steht. Neue Klasse
  `.dlg-scroll` plus `scrollFadeInit()` (`util.ts`, dieselbe Opacity-Masken-Technik wie
  `chipsFadeInit()` aus v109, nur vertikal) blendet Ober-/Unterkante ein, sobald in diese
  Richtung noch etwas zu scrollen ist – einmalig für alle betroffenen Elemente verdrahtet.
  Läuft nur im Browser (Guard gegen `document`), damit reine Logik-Tests, die `util.ts` ohne
  DOM importieren (z. B. über `tackle.ts`), nicht brechen.

## SW v111 – 2026-07-18

### Changed
- **Planer ("Heute würde ich hier anfangen"): Filter eingeklappt, Antwort zuerst.** Die
  Zielfisch- und Gewässer-Chips standen fest offen vor der eigentlichen Empfehlung – auf
  Mobile musste man erst an zwei vollen, umbrechenden Chip-Zeilen vorbeiscrollen, bevor die
  90-%-Antwort überhaupt sichtbar war. Ausgerechnet das Werkzeug, das die schnellste Antwort
  liefern soll. Die Filter stecken jetzt in einem `<details>` (`#planFilterbar`), eingeklappt
  per Default – dieselbe Progressive-Disclosure wie beim Tackle-Block und der ausklappbaren
  Rangliste. Eine "N aktiv"-Anzeige in der Kopfzeile bleibt auch eingeklappt sichtbar, damit
  ein gesetzter Filter nicht aus dem Blick gerät. Vierter Fund aus demselben UI/UX-Review.

## SW v110 – 2026-07-18

### Fixed
- **Regionstitel im Header wurde bei langen Namen hart abgeschnitten.** Der Header hat auf
  schmalen Bildschirmen (z. B. iPhone) nur ~190px für den Regionsnamen – lange Namen wie
  "Erzgebirge / Freiberg (Sachsen)" wurden ohne jedes Zeichen mittendrin abgeschnitten, man
  sah nicht, dass da noch mehr steht. `.region-title` bekommt jetzt `text-overflow:ellipsis`
  ("…" statt hartem Cut), zusätzlich liefert ein `title`-Attribut auf dem Select den vollen
  Namen als Tooltip nach (Desktop-Hover, Screenreader) – wird bei jedem Regionswechsel
  mitgepflegt. Dritter Fund aus demselben UI/UX-Review wie v108/v109.

## SW v109 – 2026-07-18

### Added
- **Scroll-Fade an den Chip-Reihen.** Die horizontal scrollbaren Kategorie-/Zielfisch-Chips
  (Karte + Planer) hatten eine unsichtbare Scrollbar und keinerlei Hinweis, dass rechts noch
  mehr Chips folgen – auf schmalen Bildschirmen sah die Reihe aus, als würde sie einfach
  aufhören. Neue `chipsFadeInit()` (`util.ts`) blendet die Ränder per CSS-Maske aus, sobald
  in diese Richtung noch etwas zu scrollen ist (kein Hintergrundfarb-Abgleich nötig, reine
  Opacity), und reagiert automatisch auf Scrollen, Größenänderung und Neuaufbau der Chips
  (MutationObserver) – kein Aufruf an jeder Baustelle nötig, einmal pro Chip-Reihe verdrahtet.
  Gefunden beim selben UI/UX-Review wie der Popup-Fix in v108.

## SW v108 – 2026-07-18

### Fixed
- **Popup-Disclaimer "Modellwert aus ..." zerfiel in überlappende Spalten.** Der Hinweistext
  unter "Chancen heute" (jedes Spot-Popup) enthält ein `<b>keine Fangwahrscheinlichkeit</b>`
  mitten im Fließtext. In Kombination mit `display:flex` auf `.rating-body .verif` (ohne
  `flex-wrap`) zerlegte der Browser den Text an der `<b>`-Grenze in mehrere Flex-Items, die
  nebeneinander statt als durchlaufender Absatz gerendert wurden – auf jedem Popup, Desktop
  wie Mobile. Fix: Text nach dem Info-Icon in einen eigenen `<span>` gefasst (wieder ein
  einzelnes Flex-Item) plus `flex-wrap:wrap` als Absicherung gegen dieselbe Klasse Bug an
  anderer Stelle. Gefunden bei einem UI/UX-Review mit echten Browser-Screenshots (Playwright).

## SW v107 – 2026-07-18

### Added
- **Wochen-Vorschau als Kalender exportieren.** Die Major-Fenster des 7-Tage-Ausblicks
  (Werkzeuge → Wochenvorschau) ließen sich bisher nur in der App selbst ansehen – kein
  Reminder, wenn man gerade nicht in der App ist. Neuer Button „Als Kalender exportieren"
  baut aus genau den Daten, die der Ausblick ohnehin schon berechnet (`wochenIcs()`,
  wiederverwendet `days`/`majors` aus `openForecast()`), eine Standard-`.ics`-Datei und
  bietet sie als Download an – importierbar in Kalender-Apps (iOS/Android/Outlook/Google),
  die dann zur richtigen Zeit erinnern. Nur echte Major-Fenster werden exportiert, Minor-
  Fenster bleiben außen vor (sonst 4+ Termine/Tag). Ohne Fenster in der aktuellen Woche
  bleibt der Button ganz weg statt eine leere Datei anzubieten – wie beim Teilen-Button
  beim Fangbuch. Keine neue Netzwerkanfrage, keine neue Abhängigkeit. Vier neue Tests.

## SW v106 – 2026-07-18

### Added
- **Fang teilen.** Jeder Fangbuch-Eintrag bekommt ein Teilen-Icon, das Art, Länge, Spot,
  Datum und – falls geloggt – Wassertemperatur/Drucktrend/Beißfenster/Köder zu einem kurzen
  Text zusammenfasst (`fangTeilenText()`) und über die native Share-Sheet (`navigator.share`)
  weitergibt, mit Zwischenablage als Fallback. Nur echte, geloggte Fakten – ohne Kontext
  bleibt der Text schlicht kürzer, nichts wird ergänzt. Ohne Share-API oder Zwischenablage
  (z. B. ältere Browser) bleibt der Button ganz weg statt tot dazustehen. Neues Icon (share)
  im SVG-Set. Vier neue Tests.

## SW v105 – 2026-07-18

### Added
- **Erlaubnisschein-Ablauf-Reminder.** Jahreskarten/Erlaubnisscheine laufen meist jährlich ab
  – leicht zu vergessen, bis man ohne gültigen Schein am Wasser steht. Die Packliste (pro
  Region, wo Haken schon lokal gespeichert werden) hat jetzt ein optionales Datumsfeld
  „Erlaubnisschein gültig bis". Ist ein Datum gesetzt, prüft die App bei jedem Regionswechsel
  automatisch dagegen und zeigt eine Kopfwarnung (wie Sturm-/Sperrzonen-Warnung): „läuft in
  N Tagen ab" ab 14 Tagen vorher, „ist abgelaufen" danach – ohne gesetztes Datum bleibt sie
  ehrlich aus, nichts wird erfunden. Immer sichtbar, auch in der Einfachen Sicht (rechtlich
  relevant, keine Vertiefung). Fünf neue Tests.

## SW v104 – 2026-07-18

### Added
- **Persönliche Notizen an bestehenden Spots.** Bisher ging eigenes Wissen zu einem Gewässer
  ("Zufahrt bei Nässe gesperrt", "Verein hat die Regeln verschärft", "bester Zugang ist der
  Waldweg") nur über den Umweg "Eigener Spot" – der aber einen zweiten, unabhängigen Marker
  anlegt statt den bestehenden Spot zu ergänzen. Jedes Popup (außer eigene Spots, die schon
  ihre eigene Notiz haben) hat jetzt ein Notizfeld, das beim Verlassen automatisch lokal
  gespeichert wird (`notiz.ts`, neues Modul, pro Region getrennt, nie an einen Server). In
  der Einfachen Sicht ausgeblendet (Vertiefung, keine Sicherheitsinfo). Neue Datei zum
  Service-Worker-Cache hinzugefügt (sonst offline nicht verfügbar); README-Modultabelle
  ergänzt. Sechs neue Tests.

## SW v103 – 2026-07-18

### Added
- **Ausklappbare Rangliste im Planer.** Die „Alternativen"-Liste zeigte immer nur die 3
  nächstbesten Orte – wer mehr Auswahl wollte, hatte keine. `kandidaten()` berechnet ohnehin
  schon alle Ort-/Art-Kombinationen der Region; die ersten 3 Alternativen stehen wie bisher
  offen da, bis zu 9 weitere stecken jetzt in einem ausklappbaren `<details>`-Block
  („+N weitere Gewässer"), demselben Progressive-Disclosure-Muster wie in der Spotbewertung
  und im Tackle-Block. Keine neue Berechnung, keine neue Anfrage – nur mehr von dem, was der
  Planer ohnehin schon weiß. Neuer Test.

## SW v102 – 2026-07-18

### Added
- **„Bester Tag" im 7-Tage-Ausblick.** Der Wochen-Ausblick (Werkzeuge → Wochenvorschau)
  listete bisher nur alle 7 Tage nebeneinander – man musste selbst vergleichen. Jetzt wird
  aus den ohnehin schon geladenen Daten (Solunar-Fenster, Mondstärke, Luftdrucktrend am
  stärksten Major-Fenster, Windvorhersage) ein transparenter, additiver Tagesscore berechnet
  (`tagesScore()`, Gewichte offen im Quelltext) und der beste Tag mit 🏆 und den konkreten
  Gründen hervorgehoben ("Bester Tag: Mi 22.7. – Major-Fenster, fallender Luftdruck").
  Sturmtage sind ein Ausschlusskriterium, kein Abzug (wie überall sonst im Modell) – an
  ihnen wird nie als „bester Tag" geworben. Ohne Wetterdaten (offline) bleibt es ehrlich bei
  reiner Solunar-Wertung, kein erfundener Druckbonus. Keine neue Netzwerkanfrage nötig – nutzt
  ausschließlich Daten, die der Wochen-Ausblick ohnehin schon lädt. Vier neue Tests.

Fachliche und technische Änderungen an der Angelkarte-App, neueste zuerst.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/); SW-Version
bezieht sich auf `angelkarte-shell-vN` in `sw.js`.

## SW v101 – 2026-07-18

### Fixed
- **Main-Region: Tages-/Wochenlimit für Raubfisch war komplett unenforced.** Die Region
  nennt zweimal (schonQuelle + Spot-Hinweis) die Erlaubnisschein-Regel „max. 3 Raubfische
  (Barsch/Hecht/Zander) pro Tag, max. 10/Woche" – `checkFang()` hatte dafür (anders als
  bereits für Mecklenburg und Erzgebirge) überhaupt keinen Block. Ergänzt: Tageszähler wie
  bei den anderen Regionen, plus ein rollierendes 7-Tage-Wochenlimit (`parseFangDatum` über
  alle Einträge). Zwei neue Tests, die beide Grenzen unabhängig voneinander auslösen (Wochen-
  limit greift auch, wenn heute noch nichts entnommen wurde, und umgekehrt).

## SW v100 – 2026-07-18

### Fixed
- **Erzgebirge-Kunstköderverbot (LVSA, 1.2.–30.4.) war ebenfalls unmodelliert.** Dritte
  Region mit demselben Muster nach RLP und Elbe: die Regeln-Karte nennt „01.02.–30.04.:
  Angeln mit raubfischtauglichen Ködern in allen LVSA-Gewässern untersagt (faktisch
  Kunstköderverbot), gilt NICHT am privaten Angelteich Gränitz" – auch als Banner sichtbar.
  Ohne Mechanismus dahinter hätte der Planer in diesem Fenster Gummifisch auf Barsch/Aal an
  jedem AVS/LVSA-Gewässer empfohlen. `kkVerbot:{von:[2,1],bis:[4,30]}` auf den sieben
  eindeutig AVS/LVSA-verwalteten Spots gesetzt (3 Trinkwassertalsperren + 4 Friedfisch-Teiche
  Mühlteich/Schlüsselteich/Erzengler Teich/Berthelsdorfer Hüttenteich); Richter's Angelteich
  Gränitz bewusst ausgenommen (trägt bereits `schonzeitInfo`: „LVSA-Sperrfrist gilt hier
  NICHT"). Die vier Mulde-/Flöha-Flussstrecken bewusst NICHT angefasst: für die beiden
  Salmonidenstrecken gilt laut Regeln-Karte zusätzlich eine eigene, umfassendere Komplettsperre
  (01.01.–30.04.) statt eines reinen Kunstköderverbots – ob das auch für die „allgemeinen"
  Strecken gilt, lässt sich aus den vorliegenden Daten nicht sicher genug ableiten; hier lieber
  nichts behaupten als etwas Falsches. Zwei neue Tests (Fenster wirkt; Gränitz bleibt
  ausgenommen), data/*.json neu generiert.

## SW v99 – 2026-07-18

### Fixed
- **Elbe-Kunstköderverbot (15.2.–30.4.) war komplett unmodelliert.** Fünf der sechs
  Elbe/Magdeburg-Spots nennen wörtlich „15.02.–30.04. Kunstköderverbot" bzw. „Kunstköder &
  tote Köderfische verboten" in ihrem eigenen `note`-Feld, und die Region bestätigt es noch
  einmal auf Regionsebene (`koederfisch`: „Vom 15.02.–30.04. sind tote Köderfische UND
  Kunstköder verboten (Raubfischschonung)"). Anders als RLPs strukturell identische
  Frühjahrsschonzeit (dort über `rlpFruehjahr` abgedeckt) gab es dafür keinerlei Mechanismus –
  der Planer hätte in diesem Fenster ganz normal Gummifisch auf Zander/Hecht/Wels/Barsch
  empfohlen. Neues, generisches Feld `kkVerbot: {von, bis}` ergänzt `rlpFruehjahr` (bleibt
  unverändert, um dessen bestehende Tests nicht zu riskieren) um ein region-eigenes
  Zeitfenster; threaded durch `plan.ts` (Köder-Override + Lücken-Hinweis mit den echten
  Daten) und `map.ts` (Popup-Badge). Auf allen sechs Elbe-Spots gesetzt (auch „Zollelbe
  Magdeburg", das die Regel nicht wörtlich wiederholt, aber als Elbe-Nebenarm unter dieselbe
  Regionsregel fällt). Neuer Regressionstest, data/*.json neu generiert.

## SW v98 – 2026-07-18

### Fixed
- **Eicher See fehlte ebenfalls die RLP-Frühjahrsschonzeit-Kennzeichnung.** Gleiche Ursache
  wie v97, noch eindeutigerer Beleg: der Spot beschreibt sich im eigenen `note`-Feld wörtlich
  als „direkte Rheinverbindung, dadurch Wels- und Zanderbestand" – exakt der Fall, den die
  RLP-Quelle für die Kunstköder-/Aktivführungs-Sperre (15.4.–31.5.) nennt. Zander/Hecht/Wels
  stehen in seinen Zielarten; ohne Flag hätte der Planer in diesem Fenster Kunstköder auf
  diese Arten empfohlen. Flag ergänzt; data/*.json neu generiert. Andere Altrhein-Seen der
  Region (Niederrheinsee Gimbsheim: „klarer Baggersee", Freizeit-/Badesee; Altrheinsee Eich:
  keine eigene Verbindungsangabe) blieben bewusst unverändert – dort fehlt der textuelle Beleg
  für eine offene Rheinverbindung.

## SW v97 – 2026-07-18

### Fixed
- **Altrhein Heidenfahrt fehlte die RLP-Frühjahrsschonzeit-Kennzeichnung.** Die Region
  begründet ihre Kunstköder-/Aktivführungs-Sperre (15.4.–31.5., Flag `rlpFruehjahr`) explizit
  damit, dass sie „AUCH für den Rhein, alle Altrheingewässer, Seitenarme und blind endenden
  Gewässer mit offener Rhein-Verbindung" gilt. Der Spot „Altrhein Heidenfahrt" beschreibt in
  seinem eigenen `methode`-Feld „am Altrhein-Ausgang Raubfisch" – ein offener Ausgang zum
  Rhein, also klar eine offen verbundene Altrheinwasser (wie „Rhein Nackenheim & Mühlarm",
  das dasselbe Flag bereits trägt). Das Flag fehlte trotzdem: außerhalb der ohnehin
  strengeren NSG-Sperre (Jun–Aug ganz zu) hätte die App während 15.4.–31.5. Kunstköder auf
  Zander/Hecht/Wels empfohlen, wo nur Naturköder erlaubt ist. Flag ergänzt; data/*.json neu
  generiert.

## SW v96 – 2026-07-18

### Fixed
- **Erzgebirge-Barschlimit prüfte nur die Hälfte der Regel.** Die Regeln-Karte nennt für
  Barsch „max. 10/Tag, davon 5 über 30 cm" – zwei Teilbedingungen. `checkFang()`
  (fangbuch.ts) prüfte bisher nur das Gesamtlimit von 10; ein Angler mit z. B. 6 entnommenen
  Barschen über 30 cm sah nur „6/10" und keinen Hinweis, obwohl die 30-cm-Teilquote (max. 5)
  bereits gerissen war. Ergänzt: eigener Zähler für entnommene Barsche ≥ 30 cm mit Sperr-Hinweis
  ab 5, unabhängig vom Gesamtlimit. Zwei neue Tests (Teilquote greift vor dem Gesamtlimit;
  reiner Zähler unterhalb der Teilquote); `checkFang` dafür ins Test-Bundle aufgenommen.

## SW v95 – 2026-07-18

### Fixed
- **Köderrat empfahl Method-Feeder/Futterkorb an denselben Talsperren, die Anfüttern verbieten.**
  Direkte Folge derselben Ursache wie v94: die Standard-Köderempfehlung für Karpfen
  (`'Boilie oder Mais am Method-Feeder'`) und Brachse (`'Futterkorb mit Made/Wurm'`) nennt
  beide explizit die Futterkorb-Methode – die Regeln-Karte der Trinkwassertalsperren
  Saidenbach/Dittersbach/Rauschenbach verbietet aber wörtlich „Anfüttern – auch Futterkorb".
  Betraf sowohl den Tackle-Block im Popup (tackle.ts `koederVon()`, inkl. der statischen
  „Grundmontage / Method-Feeder / Haar-Rig"-Zeile) als auch die Planer-Köderempfehlung
  (plan.ts `koederSatz()`). Neues Flag `keinAnfuettern`: schaltet für Karpfen/Brachse/Brasse
  auf eine anfütter-freie Alternative („Boilie/Mais am Haar-Rig, reine Grundmontage OHNE
  Futterkorb"). Auf allen drei Talsperren gesetzt; data/*.json neu generiert.

## SW v94 – 2026-07-18

### Fixed
- **Tackle-Empfehlung riet an drei Trinkwassertalsperren zum verbotenen Belly-Boot.**
  Talsperre Saidenbach, Vorsperre Dittersbach und Talsperre Rauschenbach (alle Erzgebirge)
  haben `zugang:'ufer'` und keine kuratierte `tackle`-Empfehlung – die generische Ableitung
  in `zugangAus()` (tackle.ts) endete deshalb pauschal mit „... ein Belly-Boot erweitert den
  Radius deutlich". Genau das verbietet die Gewässerordnung dieser TWT: Saidenbachs eigener
  Spot-Hinweis sagt wörtlich „kein Boot, kein Waten", Rauschenbachs „Kein Boot, kein Baden",
  und die Regeln-Karte der Region nennt Saidenbach/Dittersbach explizit unter „Kein Boot,
  kein Belly, kein Waten, kein Baden". Neues Spot-Flag `keinBoot` eingeführt: unterdrückt die
  Belly-Boot-Empfehlung (ersetzt sie durch einen Hinweis auf das Verbot) und zeigt ein
  Popup-Badge, analog zu den bestehenden Motor-/Schleppangeln-Badges. Auf allen drei
  Talsperren gesetzt.

## SW v93 – 2026-07-18

### Fixed
- **Fangbuch-Längenfeld zu knapp für Wels.** Das Plausibilitäts-Limit für die Fanglänge lag
  bei 250 cm (fangbuch.ts, zweifach: Maßcheck und Speichern) bzw. sogar nur 200 cm im
  `max`-Attribut des HTML-Eingabefelds (index.html). Wels (Silurus glanis) erreicht in
  deutschen Gewässern regelmäßig über 2 m und legitim auch über 2,5 m – die App führt Wels
  selbst als Zielfisch mit „XXL"-Ködertaktik. Ein echter Rekordfang wäre am Eingabefeld
  hängengeblieben oder beim Speichern still auf „keine Länge" zurückgefallen, ohne
  Fehlermeldung. Beide Grenzen auf 300 cm angehoben (weiterhin genug Abstand, um
  Zahlendreher/Tippfehler abzufangen).

## SW v92 – 2026-07-18

### Fixed
- **„Heute passt es?"-Score widersprach der Spotbewertung beim Luftdruck.** Die Grenze
  zwischen „stabil" und „steigt" lag in `computeScore()` (tools.ts) bei 1,0 hPa/3h – überall
  sonst im Code (Spotbewertung in rating.ts, Wetter-Chip und Trendpfeil in weather.ts, sogar
  der Köderberater `kbHtml()` im selben File) liegt diese Grenze bei 1,5. Für Trendwerte
  zwischen 1,0 und 1,5 hPa/3h zeigte der Score „Druck steigt – nach Front oft zäh" (0 von 2
  Punkten), während die Spotbewertung denselben Messwert zeitgleich als „Luftdruck stabil"
  einordnete. Grenze auf 1,5 vereinheitlicht. Ein Regressionstest
  („der Score widerspricht der Spotbewertung nicht mehr") existierte bereits für die
  gleiche Fehlerklasse beim Sturm-Faktor – dieser Fall war bisher nicht abgedeckt.

## SW v91 – 2026-07-18

### Fixed
- **Zander-Saison widersprach dem eigenen Winter-Ratgeber.** `PROFIL.Zander.hoch` (rating.ts)
  listete Juni–Dezember als Hochsaison, ließ Januar/Februar aber als „Nebensaison" durchfallen
  (nur 0,6 von 1,5 Punkten im Jahreszeit-Faktor). Das widerspricht der App an zwei anderen
  Stellen: der Winter-Fokus (`saison.ts`) empfiehlt explizit Kanäle/Häfen für träge Winter-
  Zander, und der Köderberater (`tools.ts`, Phase „winter" = Dez–Feb) gibt eine konkrete
  Winterzander-Taktik (kleiner Gummi, minimale Sprünge, lange Pausen) – kein Hinweis auf
  Nebensaison. Real existierende „Winterzander"-Praxis (u. a. in den als Quelle genannten
  zanderfang/Blinker-Artikeln) bestätigt Jan/Feb als reguläre Zielzeit. Hochsaison auf
  Jan/Feb erweitert; die Schonzeit (separat geprüft, teils schon ab 1./15.2.) sperrt betroffene
  Tage davon unabhängig weiterhin komplett.

## SW v90 – 2026-07-18

### Fixed
- **Planer-Köderempfehlung: Karausche/Rotfeder hätten einen Gummifisch bekommen.**
  Folgefehler des vorigen Fixes: `plan.ts`s `koederSatz()` schlägt für alles, was nicht in
  der `FRIEDFISCH`-Tabelle steht, einen 10–14-cm-Gummifisch am Jigkopf vor – richtig für
  Raubfisch, falsch für einen kleinen Weißfisch. Karausche und Rotfeder fehlten in dieser
  Tabelle; da sie jetzt (seit v89) ein vollständiges Artprofil haben, konnten sie leichter
  als Planer-Empfehlung obenauf landen. Beide ergänzt: Made/Wurm bzw. Made/Brotflocke an
  feiner Posenmontage statt Kunstköder.

## SW v89 – 2026-07-18

### Fixed
- **Karausche und Rotfeder fehlten im Artprofil der Spotbewertung.** Beide Arten haben ein
  Wassertemperatur-Optimum in `tackle.ts` (`WT_OPT`) und stehen als Zielfisch in Spot-Daten
  (z. B. Vereinssee Ober-Olm), aber `rating.ts`s `bewerteAlle()` filtert Arten auf
  `PROFIL[art]` – ohne Eintrag tauchten sie in „Chancen heute" nie auf. Für Karausche wog das
  besonders schwer: sie ist am Ober-Olm-See ganzjährig geschont, aber die App verspricht selbst,
  dass geschonte Arten immer mit 0 % und Hinweis erscheinen – das griff für sie nie. Profile
  ergänzt (Karausche wie Schleie: stehendes Gewässer, wärmeliebend, meidet Strömung; Rotfeder
  wie Rotauge, aber ohne Fließgewässer – klassischer Weiher-/Seefisch).

## SW v88 – 2026-07-18

### Fixed
- **Forellen waren fälschlich als druckempfindlich markiert.** Bachforelle und
  Regenbogenforelle standen im Scoring (`rating.ts`) mit `druckSensibel: true` – derselben
  Begründung wie bei Zander/Barsch (geschlossene Schwimmblase). Biologisch falsch: Salmoniden
  sind Physostomen (offener Ductus pneumaticus, Blasenregelung per Luftschlucken an der
  Oberfläche) und damit nicht druckempfindlich wie die Physoclisten Zander/Barsch (Percidae).
  Die Bewertung reagierte dadurch bei Forellen unpassend auf Luftdruckwechsel (z. B. volle
  Punktzahl bei stabilem Hoch, Abzug bei schnellem Druckfall). Flag entfernt, Kommentar an
  `druckSensibel` präzisiert.
