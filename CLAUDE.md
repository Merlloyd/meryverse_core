# CLAUDE.md — meryverse_core

Geteilte Bibliothek der Meryverse-Apps: Design-Tokens, Frontend-Kit (`js/`), Offline-HTML-Builder.

## Dieses Repo ist ÖFFENTLICH

`meryverse_core` ist auf GitHub öffentlich. Hier darf **nichts Internes** landen:

- keine Server-IPs oder Hostnamen außer öffentlichen Domains, keine Zugangsdaten, Tokens oder Schlüssel
- keine Kunden-Kennungen (Register-IDs), keine Kundennamen, keine echten Nutzerdaten
- keine Personen- oder Arbeitgeberangaben, keine privaten Konventionen oder Betriebsdetails
- keine Memories / Erinnerungs-Dateien

Vor jedem Commit kurz prüfen, was gestaged ist (`git status`, `git diff --staged`) — ein einmal veröffentlichter Stand
lässt sich nicht zurückholen.

## Wo was steht

- **Steckbrief:** `context/core.md` (Zweck, Konsumenten, Dateien, Versionierung, Baustellen)
- **Architektur:** `ARCHITECTURE.md`; **Überblick und Quick start:** `README.md`
- **Branding:** `branding/` (Logo, Farbpaletten) — Quelle der Wahrheit für die Design-Tokens bleibt `meryverse_core/design.py`
- **Icons rendern:** `scripts/render_icons.py` (Aufruf im README), Abhängigkeiten in `requirements-tools.txt`
- **Slash-Commands:** `.claude/commands/` (Vorlage-Commands für Planen und Umsetzen)

## Übergreifende Regeln

Arbeitsweise, Branch-/Test-/Deploy-Konvention und Umgang mit Geheimnissen gelten aus **CairnOS** (globale Regeln) und
stehen deshalb nicht in diesem Repo. Repo-spezifisch gilt: Doku Deutsch, Code und Kommentare Englisch.

## Version und Tag (Pflicht)

`pyproject.toml` → `version` ist die Quelle der Wahrheit (Semver). **Bei jedem Versions-Bump gehört ein Git-Tag
`v<version>` dazu**, gesetzt und gepusht nach dem Merge auf `main`:

```bash
git tag -a v<version> -m "meryverse-core <version>" && git push origin v<version>
```

Grund: Die Website holt die Frontend-Assets (`js/`) **per Tag-Checkout** (`js/` liegt nicht im pip-Paket) und pinnt das
pip-Paket auf denselben Tag. Ohne Tag erreicht eine Änderung die Website nicht. Wird `js/tokens.css` angefasst, muss sie
aus `design.py` neu erzeugt werden (`python -m meryverse_core.design > js/tokens.css`; `tests/test_tokens.py` prüft das).

## Tests

```bash
python3 -m pytest tests/ -q
```
