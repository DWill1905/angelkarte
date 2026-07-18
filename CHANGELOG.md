# Changelog

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
