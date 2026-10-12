# Shutdown

> Session sauber beenden: Workspace inventarisieren, aktualisieren, optional committen — und dich verabschieden.

## Instructions

Führe die Schritte der Reihe nach aus. Schritte, in denen es nichts zu tun gibt, dürfen übersprungen werden — vermerke das in der Zusammenfassung.

### Schritt 1: Inventur

Verschaff dir ein Bild vom aktuellen Stand. Lies `CLAUDE.md` und scanne alle Verzeichnisse:

- `context/` — Stimmen die Inhalte noch? Gibt es Erkenntnisse aus dieser Session, die fehlen?
- `plans/` — Welche Pläne sind „Draft", „In Progress", „Implemented"? Stimmt der Status mit der Realität überein?
- `outputs/` — Verwaiste oder temporäre Dateien?
- `scripts/` — Unbenutzte Skripte?
- `reference/` — Veraltete Referenzdokumente?
- Fremdkörper im Workspace (z. B. `.DS_Store`, `__pycache__`, `*.pyc`, `*.tmp`, `*.bak`, `*.log`)

Erstelle daraus eine interne Liste von **vorgeschlagenen Aktionen** — noch nichts ausführen.

### Schritt 2: Aufräumen (mit Bestätigung)

- **Eindeutig harmlos** (z. B. `.DS_Store`, `__pycache__/`, `*.pyc`): direkt löschen.
- **Potenziell wertvoll** (Logs, Backups, `outputs/`-Dateien, unklare Skripte): in der Zusammenfassung auflisten und den User fragen, statt zu löschen.

Im Zweifel: nicht löschen.

### Schritt 3: Workspace-Dokumentation aktualisieren

Bringe interne Dokumentation und Realität in Einklang:

- **CLAUDE.md**: Neue/entfernte Dateien, Commands, Skripte oder Workflows einarbeiten.
- **`context/`**: Neue Erkenntnisse aus der Session festhalten, veraltete Angaben korrigieren.
- **`plans/`**: Status der Pläne aktualisieren (z. B. „Implemented" für abgeschlossene Vorhaben).

### Schritt 4: Benutzer-Dokumentation aktualisieren

Prüfe und aktualisiere Dokumentation, die sich an **Menschen** richtet (nicht an Claude):

- **`README.md`** (falls vorhanden): Spiegelt sie den aktuellen Stand wider? Neue Commands, Features oder Setup-Schritte ergänzt?
- **Benutzerhandbuch / Hilfe-Dateien** (z. B. `docs/`, `HANDBUCH.md`, `HELP.md`, `USAGE.md`): Stimmen Beispiele, Screenshots, Befehlsreferenzen noch?
- **Changelog** (falls vorhanden): Sichtbare Änderungen aus dieser Session ergänzen.

Falls keine dieser Dateien existiert, aber substanzielle neue Funktionalität entstanden ist: Schlage dem User vor, eine README oder Hilfe-Datei anzulegen — lege sie aber nicht ungefragt an.

### Schritt 5: Git (optional)

Nur falls der Workspace ein Git-Repo ist (`git rev-parse --is-inside-work-tree`):

1. `git status` — Was hat sich geändert?
2. Zeige dem User die geplante Commit-Message und die zu stagenden Dateien.
3. **Erst nach Bestätigung** committen. Niemals Secrets oder `.env` einbeziehen.
4. **Push nur, wenn der User es ausdrücklich wünscht.**

Falls kein Git-Repo: Schritt überspringen und in der Zusammenfassung vermerken.

### Schritt 6: Zusammenfassung & Verabschiedung

Liefere einen kompakten Report und verabschiede dich im selben Zug:

1. **Aufgeräumt:** Welche Dateien wurden gelöscht?
2. **Aktualisiert:** Welche Dateien wurden auf den neuesten Stand gebracht?
3. **Offen / Rückfragen:** Was braucht eine Entscheidung des Users?
4. **Nächste Session:** Sinnvoller Einstiegspunkt für nächstes Mal.
5. **Verabschiedung:** Ein warmer, kurzer Abschluss — wie ein Kollege, der Feierabend macht. Keine künstliche Warteschleife.