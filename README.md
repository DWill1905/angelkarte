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

## Ohne API-Key

Karte, Filter, Schonzeiten, Regeln und Fangbuch (localStorage) funktionieren
vollständig ohne Key – nur Guide und KI-Recherche brauchen ihn.
