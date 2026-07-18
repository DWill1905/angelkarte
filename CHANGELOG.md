# Changelog

Fachliche und technische Änderungen an der Angelkarte-App, neueste zuerst.
Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/); SW-Version
bezieht sich auf `angelkarte-shell-vN` in `sw.js`.

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
