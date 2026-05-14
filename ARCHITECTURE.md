# meryverse_core — Architektur

Technische Beschreibung des Pakets und seines Zusammenspiels mit den
konsumierenden Apps (Haushaltsbuch, Aktien, Chor, FTE, Ketten, mxh Excel
Vergleich, …).

---

## 1. Zweck

`meryverse_core` ist ein installierbares Python-Paket
(`pip install -e ../meryverse_core`), das die geteilten Bausteine aller
Meryverse-Generatoren bündelt:

- **Design-Tokens** als CSS-Variablen (Schemata `meryverse` und `vodafone`)
- **HTML-Builder**, der eigenständige Offline-HTMLs aus modularen Teilen
  zusammensetzt
- **Asset-Loader**, der gemeinsam genutzte CSS/JS/Templates aus dem
  Repo liest
- **Crypto-Helper-Stub** (Server-Pendant zu `js/crypto.js`)

Der Konsument (eine App) bleibt eigenständig: er erzeugt weiterhin sein
eigenes `mxh_*.html` durch sein lokales `generate_html.py`, zieht aber
bei Bedarf einzelne Bausteine aus `meryverse_core`.

---

## 2. Modul-Inventar

```
meryverse_core/                  Paket-Wurzel (pip-name: meryverse-core)
├── pyproject.toml               name="meryverse-core", version="0.2.0"
├── meryverse_core/              Python-Modul (Import-Name)
│   ├── __init__.py              __version__
│   ├── design.py                CSS-Var-Schemes
│   ├── html_builder.py          Fluent Builder für Offline-HTMLs
│   ├── assets.py                CSS/JS/Template-Loader
│   └── crypto.py                Stub (server-seitige AES-Helfer)
├── js/                          Frontend-Module (vom Loader gelesen)
│   ├── design_system.css
│   ├── lock_screen.{css,js}
│   ├── crypto.js                AES-256-GCM + PBKDF2 + Dual-Envelope v2
│   ├── export_utils.js
│   └── ui_utils.js
└── templates/
    └── lock_screen.html
```

### 2.1 `design.py`

Liefert pro Scheme ein Dict aus CSS-Variablen-Name → Wert. Beide Schemata
(`meryverse`, `vodafone`) erfüllen denselben Kernvertrag: `bg`, `surface*`,
`border*`, `accent*`, `pos`/`neg`/`warn`, `text*`, `radius*`, `font*`,
`shadow`. `vodafone` ergänzt seine Sekundärpalette (`aqua`, `turq`,
`violet`, `aubergine`, `spring`, `lemon`), Tönungen (`tint-*`) und einen
`brand-bar`-Gradient.

API:
- `list_schemes() → ["meryverse", "vodafone"]`
- `get_css_variables(scheme="meryverse") → dict[str, str]`
- `get_css_block(scheme="meryverse") → str`   (`":root { --bg: …; }"`)

### 2.2 `assets.py`

Pfad-Auflösung relativ zur Repo-Wurzel von `meryverse_core`:

```
REPO_ROOT  = .../meryverse_core/
JS_DIR     = REPO_ROOT/js/
TPL_DIR    = REPO_ROOT/templates/
```

Eine `_read(path)`-Funktion liest UTF-8-Dateien und wirft eine sprechende
Fehlermeldung, wenn das Repo nicht da liegt, wo es sein sollte.

### 2.3 `html_builder.py`

Fluent Builder, der in vier Sektionen aufbaut: `<style>` (geteilte CSS-
Module + raw CSS), `<script>` (geteilte JS-Module + raw JS), Body-HTML,
Head-Zusatz. Die `version`-Property landet im Footer.

```python
HtmlBuilder(title="Kettenauswertung", version="2.1")
  .css("design_system", "lock_screen")
  .css_raw(MY_CUSTOM_CSS)
  .js("crypto", "lock_screen", "export_utils", "ui_utils")
  .js_raw(load_sheetjs())
  .js_raw(MY_APP_JS)
  .body(MY_HTML_BODY)
  .write("output.html")
```

### 2.4 `crypto.py`

Aktuell ein Platzhalter. Geplant: server-/CLI-seitiges Pendant zur
JS-Implementierung in `js/crypto.js` (AES-256-GCM, PBKDF2-SHA256
mit 250 000 Iterationen, Dual-Envelope-Format v2).

---

## 3. Schemazeichnung — Wirkungsbeziehungen

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Apps  (eigenständige Repos)                     │
│                                                                       │
│  ┌─────────────────────────┐   ┌────────────────────────┐  ┌─────┐   │
│  │ mxh-excel-vergleich/    │   │ haushaltsbuch/         │  │ ... │   │
│  │   generate_html.py      │   │   generate_html.py     │  │     │   │
│  │   • from meryverse_core │   │   • from meryverse_core│  │     │   │
│  │     import design       │   │     .html_builder      │  │     │   │
│  │   • design.get_css_     │   │     import HtmlBuilder │  │     │   │
│  │     block("vodafone")   │   │   • assets.load_sheetjs│  │     │   │
│  │   • baut HTML inline    │   │   • Builder.write()    │  │     │   │
│  └────────────┬────────────┘   └─────────┬──────────────┘  └──┬──┘   │
└───────────────┼──────────────────────────┼────────────────────┼──────┘
                │                          │                    │
                │  pip install -e          │                    │
                ▼                          ▼                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          meryverse_core                               │
│                                                                       │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────────┐     │
│  │  design.py     │  │  html_builder   │  │  assets.py         │     │
│  │                │  │     .py         │  │                    │     │
│  │  SCHEMES =     │  │                 │  │  REPO_ROOT-relativ │     │
│  │   meryverse    │  │  HtmlBuilder    │  │  load_css(name)    │     │
│  │   vodafone     │◀─┤  .css(*names)  ─┼─▶│  load_js(name)     │     │
│  │                │  │  .css_raw(s)    │  │  load_template()   │     │
│  │  get_css_block │  │  .js(*names)   ─┼─▶│  load_sheetjs(...) │     │
│  │  ──────────────┼─▶│  .js_raw(s)     │  │                    │     │
│  │   ":root{...}" │  │  .body(html)    │  │     │              │     │
│  │                │  │  .build()/write │  │     │              │     │
│  └────────────────┘  └─────────────────┘  └─────┼──────────────┘     │
│                                                 │                     │
│  ┌────────────────┐                             │                     │
│  │  crypto.py     │                             │                     │
│  │  (stub)        │                             │                     │
│  └────────────────┘                             │                     │
└─────────────────────────────────────────────────┼─────────────────────┘
                                                  │ liest
                                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   Shared Assets  (im selben Repo)                     │
│                                                                       │
│  js/                                          templates/              │
│  ├─ design_system.css                         └─ lock_screen.html     │
│  ├─ lock_screen.css                                                   │
│  ├─ lock_screen.js                                                    │
│  ├─ crypto.js   ◀── AES-256-GCM, PBKDF2, Dual-Envelope v2             │
│  ├─ export_utils.js                                                   │
│  └─ ui_utils.js                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

Pfeile lesen sich als „liefert/leitet weiter":

- App ruft → `design.get_css_block()` → erhält `:root {...}`-Block
- App ruft → `HtmlBuilder.css("…")` → der Builder fragt → `assets.load_css(…)`
- `HtmlBuilder.build()` faltet alles zu einer einzigen HTML-Datei
  zusammen — kein CDN, keine externen Requests zur Laufzeit der App.

---

## 4. Datenfluss beim Generator-Lauf

Schematisch der Ablauf in einem typischen `generate_html.py` einer App:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1.  Imports                                                          │
│     from meryverse_core import design                                │
│     from meryverse_core.html_builder import HtmlBuilder              │
│     from meryverse_core.assets import load_sheetjs                   │
│                                                                      │
│ 2.  Inputs sammeln                                                   │
│     • SheetJS-Code lokal lesen     ────────────┐                    │
│     • App-spezifische Body-HTML                │                    │
│     • App-spezifische CSS / JS                 │                    │
│                                                │                    │
│ 3.  CSS-Tokens holen                           │                    │
│     css_root = design.get_css_block(scheme=…)  │                    │
│                                                │                    │
│ 4.  Builder zusammensetzen                     │                    │
│     HtmlBuilder(...)                           ▼                    │
│       .css_raw(css_root)                                            │
│       .css("design_system", "lock_screen")  ──▶ assets.load_css     │
│       .js("crypto", "lock_screen", ...)     ──▶ assets.load_js      │
│       .js_raw(load_sheetjs())                                       │
│       .js_raw(MY_APP_JS)                                            │
│       .body(MY_HTML_BODY)                                           │
│                                                                      │
│ 5.  .write(OUTPUT_PATH)                                              │
│       └─▶ vollständig offline-fähige HTML auf der Platte            │
└─────────────────────────────────────────────────────────────────────┘
```

`HtmlBuilder` selbst hat keine Konfiguration zur Laufzeit der HTML —
er produziert nur einmal beim Generator-Lauf den finalen String.
Der Lock-Screen, die Krypto-Logik, die Export-Utilities laufen dann
im Browser ohne weitere Abhängigkeit von `meryverse_core`.

---

## 5. Konsumierende Apps — typische Nutzungstiefe

Nicht jede App nutzt den gesamten Stack. Beispiele:

| App | Genutzte Module | Typischer Aufruf |
|---|---|---|
| `mxh-excel-vergleich` | nur `design` | `design.get_css_block(scheme="vodafone")` als Token-Block, App hat eigenes HTML-Template mit Platzhalter |
| `haushaltsbuch`, `aktien`, `chor`, `fte`, `ketten` | `design` + `html_builder` + `assets` | Voller Builder-Pfad mit geteiltem Lock-Screen, Crypto-JS und Export-Utilities |

Migrationsweg ist additiv: Apps können erst nur die Tokens ziehen
(`design.py`) und später schrittweise auf den Builder umsteigen, wenn
ihr Template-Aufbau das hergibt.

---

## 6. Versionierung & Konsum

```toml
# pyproject.toml
name = "meryverse-core"   # PyPI-Konvention: Bindestrich
version = "0.2.0"
```

Apps konsumieren in zwei Modi:

```bash
# Editable, Development
pip install -e ../meryverse_core

# Pinned, Production (in requirements.txt der App)
meryverse-core @ git+https://github.com/Merlloyd/meryverse_core.git@v0.2.0
```

Tag-Bumps in `meryverse_core` rollen die Apps **nicht** automatisch nach —
jede App entscheidet eigenständig per Version-Pin, wann sie eine neue
Version übernimmt.

---

## 7. Was *nicht* in `meryverse_core` gehört

Bewusste Abgrenzung:

- **App-spezifisches HTML / Body-Markup** — bleibt im jeweiligen Generator
- **App-spezifische JS-Logik** (Datenmodell, Aggregationen, Render) — bleibt
  in der App, wird via `.js_raw(...)` einfach reingegossen
- **Datendateien** (.xlsx, .json) — die Apps verwalten ihre Daten lokal
- **Krypto-Schlüssel/Secrets** — werden zur Laufzeit im Browser
  abgefragt; das Tool persistiert sie nicht

So bleibt `meryverse_core` schlank und enthält ausschließlich, was über
mehrere Apps hinweg gleich aussehen oder gleich funktionieren soll.
