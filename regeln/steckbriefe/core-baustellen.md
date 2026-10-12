---
kennung: core-baustellen
version: 1
art: steckbrief
geltung: dieses Projekt
agenten: alle
wann: bei Planung neuer Arbeiten
---

<!-- Erzeugt aus CairnOS. Nicht von Hand ändern: Änderungen in CairnOS machen, sie kommen per Pull Request hierher. -->

# meryverse_core: offene Baustellen

_Stand des UI-Kits, crypto.py als Stub, manuelles Nachziehen der Pins und egg-info im Repo._

- **UI-Kit (Plan abgeschlossen 2026-10-12, Core 0.8.0–0.23.1, Website V3.154–V3.166, alle auf Prod).** Phasen 0–8 (Tokens → Rahmen → Knöpfe/Felder → Dialoge → Menü/Auswahl/Tabs → Datum → Icons → Typografie) sind gemergt; Core 0.13.0–0.23.1 bewusst ohne Git-Tag, die Website pinnt das Python-Paket weiter auf **v0.2.0**. Stand: 18 vendorte Dateien unter `apps/static/core/`, Core `main` `76ca524` (0.23.1). Seit V2.31 (2026-10-12) nutzen auch Haushaltsbuch und Aktien das Kit per Verweis; `design_system.css`/`lock_screen.css` (Generator-Pfad von `fte`/`ketten`) bleiben unverändert (F6). Konvention, Pflegeweg, Entscheidungen F1–F9, Wächter, offene Grenzen und die Tafel Phase → Core-Version → Website-Merge: **`reference/ui-kit-meryverse.md`**; Regeln je Klasse: `meryverse-website/CLAUDE.md` §5; Plan: `plans/2026-10-03-ui-bedienelemente-vereinheitlichen.md`.
- `crypto.py` ist ein Stub — server-/CLI-seitiges Pendant zur JS-Implementierung in `js/crypto.js` steht aus
- Bei einem Tag-Bump muss der Pin manuell in jeder App nachgezogen werden — kein automatisierter Update-Mechanismus (Website: `scripts/core-version.txt` und `apps/requirements.txt` müssen denselben Tag nennen)
- `meryverse_core.egg-info/` liegt im Repo-Verzeichnis (Build-Artefakt) — sollte in `.gitignore`
