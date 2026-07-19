# Changelog

## SW v163 – 2026-07-19 (Design-Audit Vorschlag 7/20)

### Added
- **Freitextfelder ohne `name`-Attribut** ("Köder / Methode", eigener Spot "Name"/"Notiz")
  – Browser merken sich frühere Eingaben für die native Autofill-Vorschlagsliste primär
  über `name`, nicht über `id`. Ohne `name` bekamen wiederkehrende Nutzer keine
  Autovervollständigung für Köderbeschreibungen o. ä. angeboten. Kostenlose, risikofreie
  Ergänzung – reines HTML-Attribut, keine Logikänderung.

## SW v162 – 2026-07-19 (Nachbesserung zu Vorschlag 6/20)

### Fixed
- **Erste Fassung der Querformat-Korrektur reichte bei noch kürzeren Viewports nicht.**
  Das reine Stauchen der Bottom-Abstände (v161) löste die Überlappung bei ~390px
  Viewport-Höhe, brach aber bei ~320px (ältere/kleine Handys im Querformat) erneut. Robustere
  Lösung: `toolsfab` zieht bei `max-height:480px` komplett aus dem Bottom-Stack raus und
  steht oben neben `fsBtn` – kollisionsfrei unabhängig von der genauen Höhe. Mit
  automatisierten Kollisionstests bei 320/360/390/430/480px verifiziert.

## SW v161 – 2026-07-19 (Design-Audit Vorschlag 6/20)

### Fixed
- **Querformat-Handy: Werkzeuge-Button und Vollbild-Button lagen fast übereinander –
  ein Tap auf "Werkzeuge" konnte stattdessen versehentlich Vollbild auslösen.** Die
  Bottom-Offsets von `locbtn`/`toolsfab` waren für hohe Portrait-Screens bemessen; bei
  Viewport-Höhen unter 480px (z. B. Handy im Querformat) reichte der obenverankerte
  `fsBtn` bis in dieselbe Zone hinein. Neue `@media(max-height:480px)`-Regel staucht die
  Abstände, sodass keine Überlappung mehr entsteht – mit tatsächlichen Klick-Tests
  verifiziert (Werkzeuge öffnet jetzt zuverlässig das richtige Dialog, kein versehentliches
  Vollbild mehr).

## SW v160 – 2026-07-19 (Design-Audit Vorschlag 5/20)

### Fixed
- **Fehlgeschlagenes Speichern (z. B. voller Speicher, striktes privates Surfen) blieb
  überall außer im Fangbuch komplett unbemerkt.** Region-Wechsel, eigene Spots, Trip-Liste,
  Packliste, Erlaubnisschein-Datum, Notizen und die Einfach/Pro-Ansicht scheiterten still
  (leere `catch`-Blöcke) – nur das Fangbuch selbst zeigte bei eigenen Speicherfehlern einen
  Hinweis ("nur für diese Sitzung"). Alle Speicherstellen setzen jetzt bei einem Fehler
  dasselbe globale Flag – ein Problem in irgendeinem Feature macht sich beim nächsten
  Fangbuch-Eintrag bemerkbar, statt komplett unsichtbar zu bleiben.

## SW v159 – 2026-07-19 (Design-Audit Vorschlag 4/20)

### Added
- **Manifest-Lücken:** `scope` explizit gesetzt (bisher impliziter Browser-Default) und
  `categories` ergänzt (hilft manchen Install-Oberflächen bei der Einordnung). `og:image`
  bekommt zusätzlich `width`/`height`, damit Vorschau-Crawler die quadratische Icon-Grafik
  korrekt (statt geraten) einbetten.

## SW v158 – 2026-07-19 (Design-Audit Vorschlag 3/20)

### Added
- **Keine `<meta name="description">`, keine Open-Graph-Tags.** Wird der App-Link geteilt
  (WhatsApp, Slack, Signal …), gab es nichts, das die Vorschau steuert. Beschreibung und
  `og:title`/`og:description`/`og:url`/`og:image` (App-Icon) ergänzt.

## SW v157 – 2026-07-19 (Design-Audit Vorschlag 2/20)

### Fixed
- **Manifest-Beschreibung versprach einen "KI-Guide", den es nicht gibt.** Die App nutzt
  bewusst kein LLM/KI, sondern ein transparentes, offengelegtes Bewertungsmodell (siehe
  "Ehrlichkeitsregeln" in `rating.ts` – der Prozentwert ist explizit "KEINE
  Fangwahrscheinlichkeit"). Die öffentliche Installationsbeschreibung widersprach damit der
  eigenen Ehrlichkeits-Philosophie der App. Jetzt "Chancen-Bewertung" statt "KI-Guide".

## SW v156 – 2026-07-19 (Design-Audit Vorschlag 1/20)

### Fixed
- **Scroll Chaining bei Listen/Dialogen:** Ein Scroll-Gesture am Ende der Platzliste oder
  eines Dialogs konnte auf die Seite dahinter durchschlagen (Bounce-Effekt) – auf iOS als
  installierte PWA ohne Browser-Chrome drumherum besonders unruhig. `overscroll-behavior:
  contain` auf allen scrollbaren Containern ergänzt.

## SW v155 – 2026-07-19

### Fixed
- **Spotnamen in der Platzliste hatten kein `title`-Attribut** – bei ähnlich beginnenden
  Namen (z. B. "Freiberger Mulde – gelbe Sa…" vs. "Freiberger Mulde – allgemei…") sahen
  abgeschnittene Einträge in der schmalen Liste identisch aus, ohne Möglichkeit, den vollen
  Namen zu sehen. Dieselbe Lösung wie beim Regionsnamen im Header: `title` liefert den
  vollen Namen als Tooltip/Screenreader-Text nach.

## SW v154 – 2026-07-19

### Fixed
- **Letzter Namens-Rest der Umbenennung:** Die aus der Wochen-Vorschau exportierte
  Kalenderdatei hieß noch `angelkarte-woche.ics`, obwohl PRODID und alle sichtbaren Texte
  schon länger auf Beißzeit umgestellt sind. Jetzt `beisszeit-woche.ics`.

## SW v153 – 2026-07-19

### Fixed
- **Schonzeit-Kalender: Monatszellen waren für Screenreader komplett unsichtbar** (leere
  `<div>`s, nur Hintergrundfarbe, kein Text) und bei Rot-Grün-Sehschwäche nur an einem
  moderaten Helligkeitsunterschied zu erkennen – für eine Anzeige mit rechtlicher Relevanz
  (Schonzeiten) zu wenig. Jede Zelle hat jetzt `aria-label`/`title` ("Äsche Januar:
  geschont") als redundante Textinformation, ohne die bestehende Farboptik zu ändern.

## SW v152 – 2026-07-19 (Design-Audit, 20 Verbesserungen)

Zweiter vollständiger Audit-Durchlauf über die ganze App (alle Ansichten, alle ~15 Dialoge,
Menü, Popup, Formulare). 20 konkrete Befunde gesammelt und umgesetzt, jeweils gebaut,
typegecheckt, getestet (441/441 grün) und per Playwright visuell verifiziert.

### Fixed – Bedienbarkeit & Formulare
- **"Erlaubnisschein gültig bis"-Datumsfeld war nur 17×17px groß** – der einzige Weg, das
  Ablaufdatum des Angelscheins zu pflegen (steuert eine Sicherheits-/Rechtswarnung), kaum
  antippbar. Jetzt echte Feldgröße mit sichtbarem Kalender-Icon.
- **Checkbox-Ausrichtung bei mehrzeiligen Packlisten-Einträgen**: `.fbentn` zentrierte die
  Checkbox vertikal zum ganzen (umgebrochenen) Text statt zur ersten Zeile – wirkte
  "schwebend". Jetzt oben ausgerichtet, wie bei einzeiligen Einträgen unverändert.
- **Unplausible Fangbuch-Länge (z. B. Tippfehler "3000") verschwand kommentarlos** beim
  Speichern, ohne jeden Hinweis. Jetzt eine Warnung im bereits vorhandenen Live-Bereich.
  Dieselbe Lücke im "Eigenen Spot speichern"-Dialog (Tiefe-Feld) geschlossen: die
  min/max-Attribute waren da, griffen aber nie (kein `<form>`-Submit) – jetzt löst ein
  unplausibler Wert die native Validierungsmeldung aus, statt leise verworfen zu werden.

### Fixed – Bedienung mit Tastatur/Screenreader
- **Kein Dialog gab beim Schließen den Fokus zurück.** Wer einen der ~15 Werkzeug-/Info-
  Dialoge per Tastatur öffnete, landete beim Schließen "verloren" oben im Dokument statt
  wieder auf dem auslösenden Button. Generische Lösung über einen MutationObserver auf
  `.mydlg-wrap` – deckt automatisch auch künftige Dialoge ab. Menü bekam dieselbe
  Fokus-Rückgabe (nur wenn der Fokus wirklich im Menü lag).
- **Keiner der ~15 Dialoge reagierte auf Escape** – anders als Menü und Vollbild, wo das
  schon erwartungsgemäß funktionierte. Jetzt einheitlich.
- **Fangbuch-Status-Icons (🪣 entnommen / ↩ zurückgesetzt) hatten nur `title`** – auf
  Touchscreens (Hauptzielgruppe der App) nie sichtbar, für Screenreader unzuverlässig.
  `aria-label` ergänzt. "☆ Merken"-Button im Popup bekommt jetzt zusätzlich `aria-pressed`.
- **Banner (Erlaubnis-Ablauf, SW-Update, allgemein) erschienen ohne `aria-live`** – ein
  Screenreader-Nutzer bemerkte eine neu eingeblendete Warnung nicht automatisch. Sturm-
  warnung bekommt `role="alert"` (dringend), die übrigen `aria-live="polite"`.
- **Fokus-Ring app-weit hell (`--dusk`) – auf dem hellen Popup-Hintergrund nur ~1,5:1
  Kontrast, praktisch unsichtbar.** Dort jetzt dunkel überschrieben; der Popup-Schließen-
  Button war zudem gar nicht in der Fokus-Ring-Gruppe.
- **`color-scheme` fehlte komplett**, wodurch native Formularelemente (Datumspicker,
  Checkboxen, `<select>`-Dropdown) mit hellem OS-Standard-Chrome rendern – ein Fremdkörper
  in der sonst durchgehend dunklen App. Jetzt `color-scheme: dark`.
- **Platzhaltertext in Eingabefeldern** ("z. B. 54", "z. B. Gummifisch …") nutzte das
  Browser-Standardgrau (~1,3:1 Kontrast auf dem Eingabefeld-Hintergrund) – nur die
  Spotsuche war bereits gefixt. Jetzt app-weit über `::placeholder`.
- **`.verif`-Hinweistext (Wetter- und Tagesplan-Dialog)** hatte nur einen für den hellen
  Popup-Kontext gedachten Farbwert – in den dunklen Werkzeug-Dialogen dadurch nur ~1,4:1
  Kontrast. Jetzt dort mit `var(--muted)` (~5:1).

### Fixed – Konsistenz & Bugs
- **Vollbild-Button-Klasse zur Fokus-/Hover-Gruppe ergänzt** sowie kleinere Nacharbeiten aus
  der vorherigen Konsistenz-Serie (Runden 6–9): Hover/Aktiv-Feedback jetzt vollständig.
- **Distanzen und Luftdrucktrends zeigten einen englischen Dezimalpunkt** ("20.4 km",
  "-1.5 hPa") statt des deutschen Kommas – in einer sonst durchgehend `de-DE`-lokalisierten
  App (Datumsformat etc.). Betraf Popup-Distanz, Spotlisten-Sortierung, Sperrzonen-Hinweis,
  Tagesplan-Luftlinie und alle Luftdruck-Trend-Texte (9 Stellen in 4 Dateien). Reine
  Anzeigetexte – API-Koordinaten in URLs bleiben bewusst unverändert (müssen technisch
  bleiben).
- **"Eigenen Spot speichern/bearbeiten" war der einzige Dialogtitel ohne Icon** (14 von 15
  anderen hatten eines) – jetzt mit Pin-Icon, passend zum Inhalt.
- Badges und Hinweistexte im hellen Spot-Popup zusätzlich nachgeschärft (waren nach
  genauerer Prüfung mit der korrekten WCAG-Formel bereits ausreichend kontrastreich,
  jetzt mit größerer Sicherheitsmarge).

## Design-Audit Runde 10/10 – 2026-07-19 (keine Code-Änderung)

Abschließender Audit über alle Ansichten (Karte, Regeln, Fangbuch, alle Dialoge) zusätzlich
bei 360×740 (schmales Android-Referenzgerät) sowie ein Review aller interaktiven Elemente
gegen die in Runde 6–9 aufgebauten Hover-/Fokus-/Press-Gruppen: keine Überlappung, kein
horizontaler Overflow außerhalb der bewusst scrollbaren Chip-Reihen, keine weiteren
Controls ohne Zustands-Feedback gefunden. Runden 1–9 damit als geschlossen bestätigt –
diese Runde ehrlich ohne Fix, um keine Änderungen ohne echten Befund zu erzwingen.

## SW v151 – 2026-07-19 (Design-Audit Runde 9/10)

### Fixed
- **Wetter-Chip und Gewässer-Tipp-Button in der Kopfzeile ohne jedes Interaktions-Feedback.**
  Letzte zwei Lücken derselben Serie (Runden 6–8): beide Header-Buttons hatten weder
  `:hover` noch `:active` noch überhaupt eine `transition` definiert. Jetzt press- und
  hover-Feedback konsistent mit dem Rest der App.

## SW v150 – 2026-07-19 (Design-Audit Runde 8/10)

### Fixed
- **"Fang speichern" – die wichtigste Aktion im Fangbuch – hatte gar kein Interaktions-
  Feedback.** Anders als praktisch jeder andere Button der App fehlten dem primären
  Speichern-Button Press-Feedback (`:active`), Hover (`:hover`) und ein sichtbarer
  Fokus-Ring (`:focus-visible`) komplett – er stand nicht mal in der gemeinsamen Button-Liste.
  Jetzt Teil derselben Gruppen wie alle übrigen Aktions-Buttons.

## SW v149 – 2026-07-19 (Design-Audit Runde 7/10)

### Fixed
- **Filter-Chips und Dialog-Buttons ohne Hover-Feedback.** Weiterführung von Runde 6: die
  Kategorie-/Zielfisch-Chips (das mit Abstand meistgenutzte Bedienelement der Karte) sowie
  alle Dialog-Buttons, Werkzeug-Kacheln und Fangbuch-Aktionen (Teilen/Bearbeiten/Löschen)
  hatten trotz vorhandenem `:active`-Tastfeedback keinen `:hover`-Zustand. Für die
  Dialog-Buttons/-Kacheln bewusst über `@media(hover:hover)` + `filter:brightness()` gelöst
  (funktioniert unabhängig von der jeweiligen Grundfarbe, greift nur auf echten
  Zeigegeräten – auf Touchscreens bleibt sonst gelegentlich ein Hover-Zustand nach dem
  Antippen "hängen").

## SW v148 – 2026-07-19 (Design-Audit Runde 6/10)

### Fixed
- **Uneinheitliches Hover-Feedback bei den Karten-Buttons (Desktop/Maus).** Vollbild-Button
  hatte bereits einen `:hover`-Zustand, die beiden direkt danebenliegenden Buttons (Standort,
  Werkzeuge) sowie der Legende-Button nicht – auf drei optisch zusammengehörigen Kontrollen
  reagierte nur eine auf die Maus. Jetzt einheitlich.

## SW v147 – 2026-07-19 (Design-Audit Runde 5/10)

### Fixed
- **"Wetter & Bedingungen"-Dialog blieb bei Netzfehlern leer.** Der kleine Wetter-Chip in der
  Kopfzeile bekam schon in einer früheren Runde ein eigenes Warnsymbol samt Tooltip, sobald
  der Abruf endgültig fehlschlägt. Der ausführliche Dialog, den man genau dafür aufruft – um
  den Grund zu erfahren –, zeigte unter "Wetter & Pegel" aber schlicht nichts an
  (`el.textContent=''`). Jetzt erscheint dort dieselbe ehrliche, bereits vorhandene Erklärung
  ("Wetter aktuell nicht verfügbar – Sonne, Mond und Beißfenster funktionieren trotzdem").

## SW v146 – 2026-07-19 (Design-Audit Runde 4/10)

### Fixed
- **Abgewählte Kategorie-Chips ("Raubfisch", "Salmoniden" …) kaum noch lesbar.** Dieselbe
  Ursache wie beim Menü in Runde 2, hier aber auf dem wichtigsten, immer sichtbaren
  Filter-Element der Karte: `.chip.off` dimmte per `opacity:.38` Text, Punkt-Farbe, Rahmen
  und Füllung gemeinsam – rechnerisch blieben nur ~1,8:1 Kontrast übrig (WCAG AA: 4,5:1).
  Jetzt bleibt die Beschriftung voll lesbar; "abgewählt" wird stattdessen wie bei den
  Zielfisch-Chips über transparente Füllung, blasseren Rahmen und einen entsättigten
  Farbpunkt vermittelt.

## SW v145 – 2026-07-19 (Design-Audit Runde 3/10)

### Fixed
- **Fokus-Ring fehlte bei den vier wichtigsten Karten-/Kopfzeilen-Buttons.** Eine frühere
  Runde hatte bereits einen konsistenten, sichtbaren Fokus-Ring für Tastaturnutzung überall
  ergänzt (`:focus-visible{outline:2px solid var(--dusk)}`) – dabei aber ausgerechnet die
  vier freischwebenden Buttons übersehen, die direkt auf der Karte bzw. dem Luftbild sitzen
  (`#menuBtn`, Vollbild-, Standort- und Werkzeuge-Button) sowie Wetter-Chip und
  Gewässer-Tipp in der Kopfzeile. Genau dort ist ein unauffälliger Browser-Standard-Ring am
  schwersten zu erkennen. Jetzt einheitlich mit demselben Fokus-Ring wie der Rest der App.

## SW v144 – 2026-07-19 (Design-Audit Runde 2/10)

### Fixed
- **Nicht gewählte Ansicht-Option ("Pro") im Menü sah wie deaktiviert aus.** Die unselektierte
  Schaltfläche wurde komplett per `opacity:.55` abgedunkelt – Rahmen, Füllung *und* Text
  zusammen. Rechnerisch blieb davon nur noch ein Textkontrast von ~2,2:1 übrig (WCAG AA
  verlangt 4,5:1) – für eine anklickbare, aktiv wählbare Option zu wenig, und optisch kaum
  von einem echten `disabled`-Zustand zu unterscheiden. Jetzt wie bei den übrigen Chips/Tabs
  im Rest der App: unselektiert bleibt der Titel auf voller Textfarbe, nur die Beschreibung
  ist dezent abgesetzt (`opacity:.75`), Auswahl/Nicht-Auswahl unterscheidet sich weiterhin klar
  über Rahmen/Füllung.

## SW v143 – 2026-07-19 (Design-Audit Runde 1/10)

### Fixed
- **Vollbild-Button überlagerte die Kategorie-Chips auf dem Handy.** `#fsBtn` war
  `position:absolute` relativ zu `#view-karte` positioniert (`top:12px`), nicht relativ zur
  Karte selbst. Da die Chip-Filterzeilen *vor* der Karte im Layout stehen, landete der Button
  optisch nicht über der Karte, sondern über der ersten Chip-Reihe – auf schmalen Viewports
  wurde dadurch der letzte sichtbare Chip ("Friedfisch") von einem schwebenden Button verdeckt.
  Karte, Legende, Werkzeuge-, Standort- und Vollbild-Button stecken jetzt gemeinsam in einem
  neuen `.map-wrap`-Container, der als Positionierungs-Bezugsrahmen dient – die Buttons
  richten sich nun korrekt an der Karte aus, nicht am gesamten Kartenreiter. Betrifft auch
  den Vollbildmodus (dort war dieselbe Überlagerung durch eine redundante CSS-Regel nochmal
  festgeschrieben; die Regel war überflüssig und wurde entfernt).

## SW v142 – 2026-07-19

### Changed
- **Tech-Stand-Check: TypeScript-Pin auf 5.x war überholt.** Leaflet (1.9.4) und
  Leaflet.markercluster (1.5.3) sind bereits die jeweils neueste Version, ebenso esbuild und
  jsdom im Test-Tooling – nichts zu tun. TypeScript war dagegen bewusst auf `5.x` gepinnt
  („TS 7 typt lib.dom anders", laut altem README-Kommentar). Empirisch nachgestellt: TS
  7.0.2 (nativer Go-Compiler) typecheckt den Code fehlerfrei und erzeugt **byte-identisches**
  JS zur TS5-Version – nur ~7,5× schneller (2,8s → 0,4s für den vollen Typecheck). Pin
  entfernt, README/Setup-Anleitung und `check-build.mjs` auf `typescript@latest`
  umgestellt.
- **Zwei PWA-Manifest-Lücken geschlossen:** `lang: "de"` und `id: "."` ergänzt (moderne
  Manifest-Felder, u.a. für stabile App-Identität unabhängig von `start_url`). Zusätzlich
  das generische `<meta name="mobile-web-app-capable">` neben dem bisher alleinigen
  Apple-spezifischen Tag ergänzt.
  Rein infrastrukturell, alle 441 Tests unverändert grün, `js/`-Output nach dem TS7-Rebuild
  byte-für-byte identisch zum vorherigen Stand.

## SW v141 – 2026-07-19

### Changed
- **App umbenannt: Angelkarte → Beißzeit.** Betrifft Titel, Manifest (`name`/`short_name`),
  iOS-Homescreen-Titel, Service-Worker-Cache-Präfix (`angelkarte-shell-*` →
  `beisszeit-shell-*`), ICS-Kalenderexport (PRODID/UID), Fangbuch-Teilen-Text und die
  Doku-Kommentare/README. Bewusst **nicht** angefasst: das GitHub-Repository selbst
  (`DWill1905/angelkarte`) und damit die Live-URL – eine Repo-Umbenennung ist ein größerer,
  schwerer umkehrbarer Schritt (bricht bestehende Links/PWA-Installationen) und wurde nicht
  angefragt. Ebenfalls unverändert: das Wort „Angelkarte" als Sachbegriff (Erlaubnisschein)
  in den Regionsdaten (`src/data.ts`, `data/*.json`) – das ist der Fachbegriff für den
  Angelschein selbst, nicht der App-Name, und hat mit der Umbenennung nichts zu tun. Nutzer
  mit bereits installierter PWA sehen den neuen Namen/Icon erst nach einem Neu-Hinzufügen
  zum Homescreen (iOS liest Titel/Icon nur beim Hinzufügen ein).

## SW v140 – 2026-07-19

### Changed
- **UX-Validierungspass mit ui-ux-pro-max-Skill.** Der pauschale Design-System-Vorschlag
  (Grün-Dashboard-Palette, App-Store-Landingpage) passte nicht zur bestehenden Bathymetrie-
  Identität und wurde verworfen. Die gezielte Regel-Abfrage (Domain `web`: Safe Areas, Touch
  Targets, Accessibility) hat drei echte, kleine Lücken gefunden:
  - Kategorie-Chip-Reihe hatte 6px Abstand zwischen den Chips, Guideline verlangt
    mindestens 8dp zwischen Touch-Targets – auf `--space-2` (8px) angehoben.
  - `#fbStatus` (Speicher-/Import-Rückmeldungen im Fangbuch) und `#offBody` (Offline-Karten-
    Fortschritt/Ergebnis) aktualisierten sich dynamisch, ohne `aria-live` – Screenreader-
    Nutzer bekamen davon nichts mit. Beide jetzt `aria-live="polite"`.
  Alles andere aus der Checkliste (Touch-Target-Größe, Safe-Area-Insets, Rollen/Traits,
  Icon-Labels, Reduced-Motion) war durch frühere Runden bereits abgedeckt.

## SW v139 – 2026-07-19

### Fixed
- **Nachbesserung zu v138: Menü-Button und Wetter-Icon waren nach dem ersten Fix immer noch
  unerreichbar.** Eigener Denkfehler: Für `position:absolute`-Kinder ist die Bezugskante die
  *Padding-Box*-Kante des positionierten Vorfahren – und die verschiebt sich NICHT, wenn man
  nur `padding-top` erhöht (Padding liegt innerhalb der Padding-Box, zwischen ihrer Kante und
  der Content-Box). v138 hatte `env(safe-area-inset-top)` deshalb fälschlich von `#menuBtn`/
  `.hdr-right` entfernt, in der Annahme, `header`s größeres `padding-top` würde das schon
  erledigen – tat es aber nicht, die beiden Buttons landeten dadurch wieder unter der
  Statusleiste. Jetzt tragen `header` (für den fließenden Inhalt: Regions-Select) UND die
  beiden absolut positionierten Buttons (für sich selbst) unabhängig voneinander ihren
  eigenen Safe-Area-Zuschlag – keine der beiden Stellen verlässt sich auf die andere.
  Zusätzlich `overflow:hidden` von `header` entfernt: die Buttons dürfen die von den
  Fließinhalten bestimmte Header-Höhe geringfügig überragen, ohne abgeschnitten zu werden.
  Diesmal mit simulierter Notch UND einem tatsächlichen Klick-Test verifiziert (nicht nur
  Geometrie/Screenshot wie beim ersten Versuch – der hatte das Problem nicht aufgedeckt, weil
  ein Screenshot keine echte Statusleisten-Überdeckung simuliert).

## SW v138 – 2026-07-19

### Fixed
- **Regions-Select und Hauptmenü auf dem Homescreen (installierte PWA) nicht erreichbar.**
  `header` hatte eine feste `padding-top:8px` ohne `env(safe-area-inset-top)`, während
  `#menuBtn` und `.hdr-right` (Wetter-Chip, Gewässer-Tipp) ihre eigene Position bereits per
  `top:calc(12px + env(safe-area-inset-top))` gegen die Notch/Statusleiste absicherten. Im
  normalen Browser-Tab fällt das nicht auf (kein Safe-Area-Inset), aber im installierten
  Vollbildmodus (`display:standalone` + `black-translucent`-Statusleiste) blieb der Header
  dadurch zu kurz: die Buttons wurden per `overflow:hidden` abgeschnitten bzw. überlappten
  mit den Kartenbuttons darunter, und Eyebrow/Regions-Select rutschten unter die
  Statusleiste. Fix: die Safe-Area sitzt jetzt einmal an der Quelle (`header`s eigenes
  `padding-top`), die Kind-Elemente brauchen sie in ihrem `top` nicht mehr doppelt zu
  addieren. Mit simulierter Notch (47px) gegen die vorherige Version verifiziert – vorher
  überlappten Menü-Button und Kartensteuerung sichtbar, jetzt sauber getrennt.
- **Lieblos wirkendes Homescreen-Icon.** Bisher ein reines Emoji (🎣) auf dunklem
  Quadrat als Inline-SVG – und auf iOS gab es mangels `apple-touch-icon`-Tag gar kein
  richtiges Icon, sondern einen automatischen Screenshot der Seite. Neues Icon im
  Bathymetrie-Look der App (Fisch-Silhouette, Tiefenlinien-Textur wie im Header,
  Amber-Akzent) als `icon.svg`, dazu PNG-Varianten (192/512, plus maskable für Android
  Adaptive Icons) und `apple-touch-icon.png` (180px) samt fehlendem Link-Tag. Bei 40px
  Größe und unter Kreis-Maskierung geprüft – bleibt erkennbar.

## SW v137 – 2026-07-19

### Changed
- **Weitere Design-Konsolidierung.** Formularfelder (generisches `input,select` sowie die
  Spot-Suche) hatten zwei unterschiedliche Radien (7px/9px) für dieselbe Art Element – jetzt
  einheitlich `--radius-sm`. Solunar-Kalenderbalken (`.calbar`) ebenfalls auf die Radius-
  Skala umgestellt (4px → `--radius-sm`). Die Schonzeit-Saisonbanner-Leiste am oberen
  Bildschirmrand bekommt jetzt dieselbe sanfte Eintritts-Animation wie die
  Sperrzonen-Warnung, statt abrupt dazustehen – beide sind dieselbe Art von Hinweis, sahen
  sich bisher aber nicht ähnlich.

## SW v136 – 2026-07-19

### Changed
- **Formularelemente vereinheitlicht.** Der Regions-Select im Header hatte schon einen
  eigenen Pfeil, die Fangbuch-Selects (Fischart, Gewässer) liefen bisher mit dem
  Browser-Standardpfeil – uneinheitlich. Jetzt bekommen alle `<select>` denselben Chevron.
  Zahlenfelder (Länge, Tiefe) ohne native Spinner-Pfeile, die nicht zum sonst durchgehend
  eigenen Formular-Look passten. Fokus-Zustand auf einen einzigen, bewussten Stil bereinigt
  (vorher: alter Salmo-Outline + neuerer Dusk-Glow gleichzeitig aktiv).

## SW v135 – 2026-07-19

### Changed
- **Ein paar dezente Animationen ergänzt.**
  - Hauptmenü (Hamburger-Schublade) blendet Backdrop ein und schiebt das Panel sanft von
    links herein, statt hart umzuschalten.
  - Sperrzonen-Warnung und die Legende erscheinen mit einem kurzen Slide-/Pop-in statt
    plötzlich dazustehen.
  - Der Fortschrittsring neben der Chancen-Prozentzahl zeichnet sich beim Öffnen des Popups
    von 0 auf den Zielwert (reines CSS via `@property`, in Browsern ohne Unterstützung
    einfach sofort der Endwert – keine Funktionseinbuße).
  Alles respektiert `prefers-reduced-motion`.

### Fixed
- **Ring-Animation blieb beim ersten Versuch auf 0% hängen.** `to{--pct:var(--pct)}` war
  selbstreferenziell (das animierte Property referenzierte sich selbst) und fiel auf den
  `@property`-Startwert (0) zurück – der Ring wirkte nach dem Laden leer. Getrennt in ein
  statisches `--pct-target` (Inline-Wert je Fischart) und ein animiertes `--pct`, das mit
  `forwards` den Endwert hält statt zurückzuspringen. Vor dem Push per Computed-Style-Check
  verifiziert (nicht nur Screenshot – der hatte den Fehler beim ersten Mal übersehen).

## SW v134 – 2026-07-19

### Changed
- **Typografie: Lato → Space Grotesk.** Lato ist die Standard-Geometrisch-Humanistische, die
  in praktisch jeder Web-App auftaucht – kein bewusster Charakterzug. Die App nutzt für
  Daten/Koordinaten/Prozente bereits Space Mono; Space Grotesk stammt aus derselben Familie
  (Colophon Foundry), das ist kein Trend-Griff, sondern die konsequente Fortführung einer
  bereits getroffenen Entscheidung. Umgestellt über die `body`-Basis (wirkt auf praktisch
  den gesamten Fließtext) plus 10 explizite Stellen (Überschriften, Regionsname,
  Popup-Titel). Font-Weights, die Lato bei 800/900 nutzte (Space Grotesk geht bis 700), auf
  700 gekappt – sonst hätte der Browser ein hässliches "Fake Bold" synthetisiert.
- **Bathymetrie-Signature auf Dialoge ausgeweitet.** Die Tiefenlinien-Textur im Header war
  bisher ein einmaliges Deko-Element. Dieselbe Technik (gestapelte radiale Verläufe als
  konzentrische Konturlinien) jetzt auch auf `.mydlg` (die meisten Dialoge), spiegelbildlich
  aus der gegenüberliegenden Ecke – macht daraus ein wiederkehrendes, erkennbares Merkmal
  statt einer Einzelverzierung.
- `.mydlg` außerdem auf die Radius-Skala umgestellt (12px → `--radius-lg`).
  Rein optisch, alle 441 Tests unverändert grün.

## SW v133 – 2026-07-19

### Changed
- **Design-Vertiefung: Fortschrittsring bekommt Ampel-Farben, Titel-Hierarchie
  vereinheitlicht.** Reine Optik, alle 441 Tests unverändert grün:
  - Der Fortschrittsring neben der Chancen-Prozentzahl war immer blau, unabhängig vom Wert.
    Er folgt jetzt derselben Sterne-Schwelle wie `sterneAus()` (nicht neu erfunden) und
    derselben Ampel-Sprache wie die einzelnen Gründe (`.rate-g.ja`/`.nein`): grün ab 4
    Sternen, rot bei 1–2 Sternen, blau dazwischen.
  - Dialog-/Karten-Titel (h3-Ebene: Regeln-Karten, Fangbuch-Formular, Vollbild-Panel,
    Werkzeug-Dialoge, Popup-Titel, Regionsname, Tagesplan) drifteten unsystematisch zwischen
    16px und 17px, obwohl sie dieselbe Hierarchie-Stufe sind – jetzt einheitlich über einen
    `--fs-title`-Token. Die weit größere Zahl an Fließtext-/Datenzeilen-Größen bleibt bewusst
    unangetastet (eigener, größerer Folge-Schritt).
  - Kategorie-Badge im Popup (RAUBFISCH/FRIEDFISCH) auf die Radius-Skala umgestellt (4px →
    `--radius-sm`).
  - Kontrastprüfung durchgeführt (WCAG-Formel gegen alle Text-/Hintergrund-Kombinationen):
    keine Verstöße gefunden, Kategoriefarben werden nirgends als Fließtext verwendet.
    Icon-System bereits konsistent (eine zentrale `ICON()`-Funktion, keine abweichenden
    Stroke-Widths) – kein Handlungsbedarf.

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

Fachliche und technische Änderungen an der Beißzeit-App (bis SW v140: Angelkarte),
neueste zuerst. Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/);
SW-Version bezieht sich auf `beisszeit-shell-vN` (bis v140: `angelkarte-shell-vN`) in `sw.js`.

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
