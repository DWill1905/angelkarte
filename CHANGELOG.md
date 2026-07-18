# Changelog

Fachliche und technische Änderungen an der Angelkarte-App, neueste zuerst.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/); SW-Version
bezieht sich auf `angelkarte-shell-vN` in `sw.js`.

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
