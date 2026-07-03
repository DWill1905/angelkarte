# Angelkarte – GitHub Pages Setup

Interaktive Angelkarte (Leaflet) mit Spots, Streckenverläufen, Schonzeiten-Status,
Fangbuch, standortbasierter KI-Spot-Recherche und Chat-Guide.

## Veröffentlichen (einmalig, ~3 Minuten)

1. Auf github.com einloggen → **New repository** → Name z.B. `angelkarte`, Public, Create
2. **Add file → Upload files** → `index.html`, `manifest.json` (und diese README) hochladen → Commit
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, Ordner `/ (root)` → Save
4. Nach 1–2 Minuten läuft die App unter `https://DEINNAME.github.io/angelkarte/`
5. Auf dem iPhone/Android: Seite öffnen → *Zum Home-Bildschirm hinzufügen* → läuft wie eine App

## KI-Features aktivieren (Guide-Tab & "Spots hier finden")

Außerhalb von Claude brauchen die KI-Features einen eigenen Anthropic-API-Key:

1. Key erstellen: https://console.anthropic.com → API Keys
2. In der App unten auf **⚙ API-Key** tippen und einfügen

Der Key wird ausschließlich im localStorage deines Browsers gespeichert und nur an
api.anthropic.com gesendet. Kosten: Claude Sonnet, wenige Cent pro Anfrage.
**Hinweis:** Repo ist public, aber der Key steht nirgends im Code – niemals den Key
in eine Datei committen.

## Neue Features

- **Wetter & Pegel** im Header (Open-Meteo + PEGELONLINE, kein Key nötig): Temperatur, Wind, Luftdruck mit 3h-Trend (Beißtrigger bei Druckabfall), nächster Pegel im 30-km-Umkreis
- **Eigene Spots**: Long-Press (Handy) oder Rechtsklick (Desktop) auf die Karte → Name + Taktik-Notiz, pro Region auf dem Gerät gespeichert, löschbar über das Popup
- **Offline-Modus**: Service Worker cached App, Regionsdaten und besuchte Karten-Tiles – einmal geladen funktioniert die Karte auch ohne Empfang auf dem Wasser (Wetter/Guide brauchen Netz)

## Ohne API-Key

Karte, Filter, Schonzeiten, Regeln und Fangbuch (localStorage) funktionieren
vollständig ohne Key – nur Guide und KI-Recherche brauchen ihn.
