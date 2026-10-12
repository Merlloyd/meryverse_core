---
kennung: core-konsumenten
version: 1
art: steckbrief
geltung: dieses Projekt
agenten: code, urteil
wann: bei Änderungen, die Apps betreffen könnten
---

<!-- Erzeugt aus CairnOS. Nicht von Hand ändern: Änderungen in CairnOS machen, sie kommen per Pull Request hierher. -->

# meryverse_core: Konsumenten und Abhängigkeiten

_Welche Meryverse-Apps core wie nutzen (Builder-Pfad, nur Tokens, vendortes UI-Kit) und wie die Website pinnt._

`meryverse_core` ist die zentrale geteilte Bibliothek. Es konsumiert keine anderen Meryverse-Repos, wird aber von **allen sieben Apps** konsumiert:

- `vf-fte-analyse`, `Kettenauswertung` → voller Builder-Pfad (Design-Tokens + Lock-Screen + Crypto-JS + Export-Utils)
- `haushaltsbuch`, `aktien` → seit V2.31 (gemergt 2026-10-12) **kein Python-Import mehr**: die erzeugten Seiten laden das vendorte UI-Kit des Portals per Verweis (`/core/tokens.css`, `/static/core/*`); bis V2.30 nur `design.get_css_block()`. Nie Lock-Screen oder Verschlüsselung (`plans/2026-10-05-generator-apps-ui-kit.md`)
- `mxh-excel-vergleich` → nur `design` (Token-Block via Platzhalter)
- `meryverse-website` → direkt: Design-Tokens für Chor-App (`CHOR_DESIGN_TOKENS = design.get_css_block(scheme="meryverse")`, zur Render-Zeit in `chor.html` injiziert) + alle Portal-Seiten über das vendorte UI-Kit unter `apps/static/core/` (18 Dateien); das Python-Paket ist dort seit V3.169 (2026-10-12) auf **v0.23.1** gepinnt (`apps/requirements.txt`; Wächter `tests/test_core_version.py` hält Pin und `scripts/core-version.txt` gleich) — die Assets hängen nicht am Pin, eine Anhebung wäre ein Docker-Rebuild und ein eigener Schritt; die Generator-Seiten von Haushaltsbuch/Aktien seit V2.30.1 ebenfalls (per Verweis, ohne Python-Import)
