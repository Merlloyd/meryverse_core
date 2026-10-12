---
app: meryverse_core
repo: git@github.com:Merlloyd/meryverse_core.git
pfad: ./
version: 0.23.1
reifegrad: Produktion
sprachen: Python 3, JavaScript
stand: 2026-10-12
---

# meryverse_core

> **Öffentliches Repo.** Verweise auf `reference/…`, `plans/…` und andere `context/…`-Dateien in diesem Steckbrief betreffen die privaten Meryverse-Repos und liegen hier nicht. Hier gibt es nur `context/core.md`, `branding/`, `scripts/` und den Code.

## 1. Zweck

Geteiltes Python-Paket plus Frontend-Asset-Bibliothek für alle Meryverse-Apps — seit 0.8.0 zugleich die Quelle des **UI-Kits** des Portals (Rahmen, Bedienelemente, Dialoge, Menü, Kalender, Icons; Konvention: `reference/ui-kit-meryverse.md`). Bündelt Design-Tokens (CSS-Variablen für die Schemes `meryverse` und `vodafone`), einen HTML-Builder für eigenständige Offline-HTMLs, einen Asset-Loader für gemeinsam genutzte CSS/JS/Templates und (geplant) server-seitige Crypto-Helfer. Kein Endprodukt — ausschließlich für andere Meryverse-Repos.

## 2. Architektur

Das pip-Paket (`pip-name: meryverse-core`, Import-Name `meryverse_core`) wird von den Apps konsumiert — editable für Development, Git-Tag-gepinnt für Produktion. Tag-Bumps rollen die Apps **nicht** automatisch nach; jede App entscheidet eigenständig per Version-Pin in ihrer `requirements.txt`. Konsumtiefe variiert pro App: manche nutzen nur Design-Tokens, andere den vollen Builder-Stack mit geteilten Lock-Screen, Crypto-JS und Export-Utilities.

```
Apps  →  pip install meryverse-core  →  design / html_builder / assets / crypto
                                            │
                                            ▼
                                  js/* + templates/* (gelesen via assets.py)
```

## 3. Tech-Stack

- **Python 3** (Paket-Code)
- **JavaScript** (Frontend-Module in `js/`)
- **pyproject.toml**, `name="meryverse-core"`, `version="0.23.1"` (Stand 2026-10-05, main `76ca524`, **ohne Git-Tag** wie 0.13.0 — Betreiber-Entscheidung; letzter Tag `v0.12.0`)
- Keine Runtime-Dependencies außer Python-stdlib

## 4. Abhängigkeiten zu anderen Meryverse-Repos

`meryverse_core` ist die zentrale geteilte Bibliothek. Es konsumiert keine anderen Meryverse-Repos, wird aber von **allen sieben Apps** konsumiert:

- `vf-fte-analyse`, `Kettenauswertung` → voller Builder-Pfad (Design-Tokens + Lock-Screen + Crypto-JS + Export-Utils)
- `haushaltsbuch`, `aktien` → seit V2.31 (gemergt 2026-10-12) **kein Python-Import mehr**: die erzeugten Seiten laden das vendorte UI-Kit des Portals per Verweis (`/core/tokens.css`, `/static/core/*`); bis V2.30 nur `design.get_css_block()`. Nie Lock-Screen oder Verschlüsselung (`plans/2026-10-05-generator-apps-ui-kit.md`)
- `mxh-excel-vergleich` → nur `design` (Token-Block via Platzhalter)
- `meryverse-website` → direkt: Design-Tokens für Chor-App (`CHOR_DESIGN_TOKENS = design.get_css_block(scheme="meryverse")`, zur Render-Zeit in `chor.html` injiziert) + alle Portal-Seiten über das vendorte UI-Kit unter `apps/static/core/` (18 Dateien); das Python-Paket ist dort seit V3.169 (2026-10-12) auf **v0.23.1** gepinnt (`apps/requirements.txt`; Wächter `tests/test_core_version.py` hält Pin und `scripts/core-version.txt` gleich) — die Assets hängen nicht am Pin, eine Anhebung wäre ein Docker-Rebuild und ein eigener Schritt; die Generator-Seiten von Haushaltsbuch/Aktien seit V2.30.1 ebenfalls (per Verweis, ohne Python-Import)

## 5. Wichtige Dateien

- `pyproject.toml` — Paket-Metadaten (`name="meryverse-core"`, `version="0.23.1"`)
- `meryverse_core/__init__.py` — `__version__`
- `meryverse_core/design.py` — CSS-Var-Schemes; API: `list_schemes()`, `get_css_variables(scheme=…)`, `get_css_block(scheme=…)`
- `meryverse_core/html_builder.py` — Fluent `HtmlBuilder` (`.css(...)`, `.css_raw(...)`, `.js(...)`, `.js_raw(...)`, `.body(...)`, `.build()`/`.write()`)
- `meryverse_core/assets.py` — Asset-Loader; `REPO_ROOT`-relativ; `load_sheetjs(...)`
- `meryverse_core/crypto.py` — **Platzhalter** (server-/CLI-seitiges AES-Pendant zu `js/crypto.js` geplant)
- `js/design_system.css`, `js/lock_screen.{css,js}`, `js/crypto.js` (AES-256-GCM + PBKDF2 + Dual-Envelope v2), `js/export_utils.js`, `js/ui_utils.js`
- `js/feedback.{js,css}` (ab v0.3.0) — framework-freie Feedback-/Hilfe-Kommentar-Komponente; `feedbackInit(config)` + `feedbackForItem(kontext)`. Wird vom Backend vendored unter `/core/feedback.*` ausgeliefert (Sync `scripts/sync-core-assets.sh`), nicht inline-t. Erste konsumierende App: Chor (V1.69). Ab v0.6.0: `pageButton` akzeptiert `{kontext_typ, ankerResolver}` statt nur `true`, und `marker.fallback: {kontext_typ, ankerResolver}` greift bei Null-Anker (Markierung außerhalb jedes `anchorAttr`-Elements) — Erster Konsument: Info-Material Cluster-Kontext-Feedback (Plan `plans/2026-06-12-feedback-cluster-kontext.md`)
- `js/fokus.js` (ab v0.9.0) — setzt `html.mxh-maus` bis zum ersten Tab, damit der Fokusring in Textfeldern nur bei Tastaturbedienung erscheint; vendored als `/static/core/fokus.js`, synchron direkt nach `tokens.css` geladen.
- `js/frame.css` (ab v0.10.0) — Seitenrahmen: Fußzeile `.portal-footer`, Karten-Seiten (`body.rahmen-fuss`/`body.rahmen-karte-mittig`), Container `.mxh-seite*`, Tabellen `.mxh-tabelle`; vendored als `/static/core/frame.css`, nach `tokens.css` + `fokus.js` geladen. Ab v0.11.0 zusätzlich die Kopfzeile `.portal-kopf` (64 px, sticky, Mitte-Slot, Breitenumbruch per `@container`), die Fußzeile mit Variante „Feedback-Mitte“.
- `js/controls.css` (ab v0.12.0) — Bedienelemente mit Präfix `mxh-`: Knöpfe `mxh-btn` (`--primary`/`--ghost`/`--danger`/`--sm`/`--icon`), Filter-Pille `mxh-chip`, Felder `mxh-input`/`mxh-label`/`mxh-switch`/`mxh-check`/`mxh-file`, `mxh-scroll-x`; vendored als `/static/core/controls.css`, nach `frame.css` geladen; `modal.css`/`feedback.css` mit denselben Werten. Ab v0.13.0 zusätzlich `mxh-chip--gross` (36-px-Pille in Normalschrift, bricht um — für Touch-Schnellwahl); `mxh-chip` ist nie breiter als ihr Platz. **Ab v0.14.0 eine Größe:** alle Knöpfe und einzeiligen Felder sind 36 px hoch (`--ctl-h`, `--ctl-h-sm` nur noch Alias), mit gleicher Schrift und gleichem Innenabstand; `--sm` bleibt als Klasse, wirkt aber nicht mehr; Schalter-/Checkbox-Zeilen sowie Popup-Knöpfe/-Felder (`modal.css`) ebenso. Grund: 44 px neben 36 px wirkte unruhig (Auslöser: „Training starten“ neben „Alle ausklappen“); 36 px liegt über WCAG 2.2 AA (24 px). Ausgenommen sind bewusst große Sonderknöpfe mit eigenem CSS (Timer starten, Spiele-Buzzer, Vollbild-Trainer, Chor-Transport) und mehrzeilige Felder.
- `js/modal.{js,css}` (ab v0.5.0) — framework-freie, Promise-basierte **Popup-Komponente** (`mxhModal.alert/confirm/prompt/open/close`, `.mxh-modal-*`-gescoped, Design-Tokens mit Fallbacks). Ersetzt native `window.alert/confirm/prompt`. Vendored wie Feedback unter `/core/modal.*` (gleiches Sync-Skript + `/core/modal.js`/`.css`-Routen). Erste Konsumenten: Chor + F&F-Admin (UI-Release 2026-06-10, Plan `plans/2026-06-10-chor-sammlung-loops-katalog-popups.md`) **Ab v0.15.0:** Fokusfalle (Tab im Kreis), Fokus-Rückgabe an den Auslöser, `aria-labelledby`, Schließen-Kreuz `.mxh-modal-x`; `confirm` mit `danger` fokussiert „Abbrechen“.
- `js/toast.{js,css}` (ab v0.15.0) — `mxhToast(text, {kind, ms})`: unten Mitte, 3 s, gestapelt; Fehler rot mit `role=alert`. Ersetzt die lokalen `toast()` der Apps.
- `js/status.css` (ab v0.16.0) — App-Dialog-Rahmen `.mxh-overlay`/`.mxh-dialog`/`.mxh-x` und Status-Anzeigen: `.mxh-empty(--karte)` (gestrichelt), `.mxh-loading`/`.mxh-spinner`, `.mxh-progress`, `.mxh-flash--ok/--err`; jede Seite direkt nach `controls.css`.
- `js/tooltip.{js,css}` (ab v0.16.0) — Tooltip für Maus, Tastatur-Fokus und Touch-Halten (aus dem Chor-`.mv-tip` herausgelöst). Ab v0.17.0 setzt `js/fokus.js` zusätzlich die Fokusfalle automatisch für jedes sichtbare `.mxh-overlay` (MutationObserver; Fokus beim Öffnen auf den Dialog, zurück zum Auslöser; Stapel nach Ebene, `mxhModal` hat Vorrang).
- **Ebenen-Skala** (ab v0.15.0, `js/tokens.css`): `--z-fab 900 < --z-overlay 1000 < --z-modal 3000 < --z-toast 3500 < --z-tooltip 4000`, dazu `--overlay` und `--shadow-pop`. Vendort sind damit **13 Dateien** unter `apps/static/core/` (`sync-core-assets.sh` kennt `toast`, `status`, `tooltip`).
- `js/menu.{js,css}` (ab v0.18.0) — `mxhMenu`: das Chor-Meryverse-Menü als Core-Baustein (Tastatur auf allen Ebenen, ARIA, Fokus zurück, Höhen-Clamp, Untermenüs als eigene Ebene, am Handy Blatt von unten mit Drill-down, `--z-menu 3400`). **Ab v0.19.0 Auswahl (F8):** `select.mxh-input`/`select.mxh-modal-input`/`select[data-mxh-auswahl]` öffnen die Meryverse-Liste statt der Browser-Liste (Suche ab 8 Einträgen, Gruppen; Ausnahme `data-mxh-nativ`); das Select bleibt das Feld, nur das Öffnen wird abgefangen. Ab v0.20.2 öffnen auch ↓/↑; ab v0.20.3 am iPhone kein Auto-Fokus der Suche und `scroll`/`resize` schließen das Blatt nicht; ab v0.20.4 Hover-Reaktion nur bei Maus und das Blatt sitzt über der Bildschirmtastatur (`visualViewport`).
- **Tabs/Umschalter/Akkordeon** (ab v0.20.0, `js/controls.css` + `js/fokus.js`): `.mxh-tabs`/`.mxh-tab`, `.mxh-seg`/`.mxh-seg-btn`, `details.mxh-akkordeon`; Aktiv-Zustand nur über ARIA, Tab-Tastatur (←/→/Home/End, roving tabindex) in `fokus.js`. Ab v0.20.1 ist `.mxh-seg-btn[aria-current="page"]` (Navigation) leise — Unterstrich statt Füllung; gefüllt bleiben `aria-pressed`/`aria-selected`/`aria-current="step"`. `tooltip.js` zeigt den Tooltip ab v0.20.5 nur bei echter Maus (`pointerover`), Touch weiter per Halten (iOS verschluckte sonst den Klick). Vendort sind damit **15 Dateien** unter `apps/static/core/` (neu `menu.js`, `menu.css`).
- `js/datepicker.{js,css}` (ab v0.21.0) — `mxhDatum`: rüstet `input[type=date|time|datetime-local]` und `[data-mxh-datum|zeit|datumzeit]` (Ausnahme `data-mxh-nativ`) automatisch (MutationObserver) zu Textfeldern TT.MM.JJJJ / HH:MM / beides auf; das Feld bleibt das Feld, `.value` liefert und nimmt weiter ISO, ein Feld mit `name` bekommt ein verstecktes Feld mit dem ISO-Wert. Tippbar (`5.10.` → 05.10.2026, `930` → 09:30; unlesbar → `.value` leer + `aria-invalid`, `mxhDatum.gueltig(feld)` unterscheidet leer von falsch). Kalender: Montag-Start, NRW-Feiertage, Monats-/Jahreswahl, Wochenende/Feiertag warm (`--warn`), Uhrzeit-Gitter (Stunde → Minute, 5er-Schritte, „Jetzt“, „Leeren“), `min`/`max`; Esc schließt nur den Kalender. Auf Touch Blatt von unten mit `inputmode=none` (keine Bildschirmtastatur, Betreiber-Entscheidung). Vendort sind damit **17 Dateien** unter `apps/static/core/` (neu `datepicker.js`, `datepicker.css`).
- `js/icons.js` (ab v0.22.0) — `mxhIcon(name, klasse)`: 82 Tabler-Linien-Icons (MIT, `@tabler/icons` 3.49, 24er-Raster, deutsche Namen); `mxhIcons.register()` für app-eigene Fach-Icons; `[data-mxh-icon]` wird automatisch gefüllt (MutationObserver, auch bei geändertem Attribut). `controls.css`: `.mxh-ico` 1.15em, in Knopf/Chip/Linkknopf 18 px, Farbe `currentColor`. Seit v0.22.1 trägt jedes `<svg>` `width/height=1em` (Rückfallgröße für Seiten ohne `controls.css`, sonst zeichnete der Browser 300×150). Tests `tests/test_icons.py`. Vendort sind damit **18 Dateien** unter `apps/static/core/` (neu `icons.js`).
- **Schrift-Skala** (ab v0.23.0, `js/tokens.css`/`design.py`): acht Stufen `--fs-2xs` 10 · `--fs-xs` 11 · `--fs-sm` 12 · `--fs-md` 13 · `--fs-base` 14 · `--fs-lg` 16 · `--fs-xl` 18 · `--fs-2xl` 22 px plus `--fs-titel` (`clamp(1.5rem, 3vw, 2rem)`) für Seitentitel; `frame.css` hat dazu `.mxh-titel` und `.mxh-abschnitt`. Alle Portal-Bausteine (Modal, Feedback, Toast, Tooltip, Status, Menü, Datepicker) laufen auf der Skala; was auch ohne `tokens.css` laufen muss, trägt rem-Rückfallwerte. Keine feste Untergrenze (F2). Ab v0.23.1 ist `feedback.js` ohne Emoji (Sprechblase und Schließen-X als Inline-Icons).
- `templates/lock_screen.html`
- `README.md` — Quick-Start für Konsumenten
- `ARCHITECTURE.md` — vollständige Beschreibung des Pakets und seines Zusammenspiels mit den Apps

## 6. Versionierung & Workflow

**Workflow:** Seit 2026-06-07 Branch-Workflow + 3-Stellen-Versionsschema `Major.Prod[.Branch]` — Entwicklung nur auf Branches, Merge auf `main` nach expliziter Freigabe (`reference/entwicklungs-workflow.md`, `reference/versionierung-meryverse-apps.md`).

- `version` in `pyproject.toml` ist die Quelle der Wahrheit; aktuell `0.23.1` (v0.23.1: `feedback.js` ohne Emoji (Sprechblase und Schließen-X als Inline-Icons, Status „Erledigt/Offen“ als Text mit Farbe), ohne Tag; v0.23.0: Schriftgrößen-Skala `--fs-*` in `tokens.css`/`design.py` + Seitentitel, ohne Tag; v0.22.1: Rückfallgröße 1em am `<svg>`, ohne Tag; v0.22.0: `icons.js` (`mxhIcon`), ohne Tag; v0.21.0: `datepicker.{js,css}` (`mxhDatum`), ohne Tag; v0.20.5: `tooltip.js` nur bei echter Maus, ohne Tag; v0.20.4: Menü-Hover nur Maus + Blatt über der Bildschirmtastatur, ohne Tag; v0.20.3: iPhone — kein Auto-Fokus der Suche, `scroll`/`resize` schließen das Blatt nicht, ohne Tag; v0.20.2: ↓/↑ öffnen die Auswahl-Liste, ohne Tag; v0.20.1: Navigation leise (`aria-current="page"`), ohne Tag; v0.20.0: Tabs/Umschalter/Akkordeon über ARIA + Tab-Tastatur, ohne Tag; v0.19.0: Auswahl — `<select>` öffnet die Meryverse-Liste, ohne Tag; v0.18.0: `menu.{js,css}` (`mxhMenu`), ohne Tag; v0.17.0: Fokusfalle automatisch für jedes sichtbare `.mxh-overlay` in `fokus.js`, ohne Tag; v0.16.0: `status.css` + `tooltip.{js,css}`, ohne Tag; v0.15.0: Ebenen-Skala in `tokens.css`, `mxhModal` mit Fokusfalle/`.mxh-modal-x`, `toast.{js,css}`, ohne Tag; v0.14.0: eine Größe — alle Knöpfe und einzeiligen Felder 36 px, `--sm` wirkt nicht mehr, ohne Tag; v0.13.0: `mxh-chip--gross` + Chip nie breiter als ihr Platz, ohne Tag; v0.12.0: Bedienelemente `js/controls.css` — `mxh-btn`/`mxh-chip`/`mxh-input`/`mxh-label`/`mxh-switch`/`mxh-check`/`mxh-file`/`mxh-scroll-x`, `modal.css`/`feedback.css` mit denselben Werten; v0.11.0: Kopfzeile `.portal-kopf` in `js/frame.css`, Fußzeilen-Variante mit Feedback-Mitte, Kopf nach eigener Breite (`container-type` + `@container`); v0.10.0: Seitenrahmen `js/frame.css` — Fußzeile, Karten-Seiten, Container, Tabellen; v0.9.0: Basis-Regeln in `js/tokens.css` — `color-scheme: dark`, `accent-color`, `:focus-visible`-Ring, dünne Scrollbalken, `.no-scrollbar`, `prefers-reduced-motion` — plus `js/fokus.js`; v0.8.0: `js/tokens.css` aus `design.py` erzeugt + Alias `--mono` im Scheme `meryverse`; v0.5.0: Modal-Komponente `js/modal.{js,css}`; v0.6.0: `pageButton`-Objekt + `marker.fallback`; v0.7.0: Feedback-Ankerpflicht — kein Popup ohne Bezugspunkt; v0.3.0: Feedback-Komponente `js/feedback.{js,css}`; v0.3.1: Feedback-Button-Styling; v0.4.0: generische Markierungs-Ebene `marker:{containerId, kontext_typ, anchorAttr}`; v0.4.1: `feedbackForItem` akzeptiert `title`/`placeholder`/`markierter_text` — für iframe-Inhalte, in denen Markieren nicht greift)
- Apps pinnen explizit per Git-Tag: `meryverse-core @ git+https://github.com/Merlloyd/meryverse_core.git@v0.3.1`
- **Hinweis:** Die Frontend-Assets (`js/`) liefert das Backend vendored aus (Kopie in `meryverse-website/apps/static/core/`, Sync `scripts/sync-core-assets.sh` des Website-Repos). Seit 2026-10-12 holt dieser Sync `js/` **per Git-Tag-Checkout** aus diesem Repo (nicht mehr aus einem Nachbarordner); `js/` liegt nicht im pip-Paket.
- **Tag-Bump-Workflow (seit 2026-10-12 wieder verbindlich):** Änderung im Paket → `pyproject.toml`-Version hochziehen → **Git-Tag `v<version>` setzen und pushen**. Die Website holt `js/` per Tag-Checkout und pinnt das pip-Paket auf denselben Tag. Zwischen `v0.12.0` und `v0.23.1` wurde nicht getaggt (frühere Betreiber-Entscheidung, hier aufgehoben); der erste neue Tag ist `v0.23.1`. Ablauf für Kit-Änderungen: `reference/ui-kit-meryverse.md` §3 im Website-Repo
- Semver-mäßiges Vorgehen empfohlen (Major-Bump nur bei Breaking Changes der API)

## 7. Aktuelle Baustellen / TODOs

- **UI-Kit (Plan abgeschlossen 2026-10-12, Core 0.8.0–0.23.1, Website V3.154–V3.166, alle auf Prod).** Phasen 0–8 (Tokens → Rahmen → Knöpfe/Felder → Dialoge → Menü/Auswahl/Tabs → Datum → Icons → Typografie) sind gemergt; Core 0.13.0–0.23.1 bewusst ohne Git-Tag, die Website pinnt das Python-Paket weiter auf **v0.2.0**. Stand: 18 vendorte Dateien unter `apps/static/core/`, Core `main` `76ca524` (0.23.1). Seit V2.31 (2026-10-12) nutzen auch Haushaltsbuch und Aktien das Kit per Verweis; `design_system.css`/`lock_screen.css` (Generator-Pfad von `fte`/`ketten`) bleiben unverändert (F6). Konvention, Pflegeweg, Entscheidungen F1–F9, Wächter, offene Grenzen und die Tafel Phase → Core-Version → Website-Merge: **`reference/ui-kit-meryverse.md`**; Regeln je Klasse: `meryverse-website/CLAUDE.md` §5; Plan: `plans/2026-10-03-ui-bedienelemente-vereinheitlichen.md`.
- `crypto.py` ist ein Stub — server-/CLI-seitiges Pendant zur JS-Implementierung in `js/crypto.js` steht aus
- Bei einem Tag-Bump muss der Pin manuell in jeder App nachgezogen werden — kein automatisierter Update-Mechanismus (Website: `scripts/core-version.txt` und `apps/requirements.txt` müssen denselben Tag nennen)
- `meryverse_core.egg-info/` liegt im Repo-Verzeichnis (Build-Artefakt) — sollte in `.gitignore`

## 8. Verweise

- **GitHub-Repo:** [meryverse_core](https://github.com/Merlloyd/meryverse_core)
- **README:** `meryverse_core/README.md`
- **Architektur-Doku:** `meryverse_core/ARCHITECTURE.md`
