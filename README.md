# meryverse_core

Gemeinsame Module für alle MXH HTML-Dashboard-Generatoren. Einmal pflegen, überall nutzen.

## Struktur

```
meryverse_core/
├── js/                         # Shared frontend modules
│   ├── design_system.css       # CSS-Variablen, Layout, Sidebar, Topbar
│   ├── lock_screen.css         # Passwort-Dialog Styles
│   ├── crypto.js               # AES-256-GCM, PBKDF2, Dual-Envelope
│   ├── lock_screen.js          # Passwort-UI Flow (Load/Create)
│   ├── export_utils.js         # Download: JSON, CSV, HTML, verschlüsselt
│   └── ui_utils.js             # Formatierung, Toasts, DOM-Helfer
│
├── templates/                  # Wiederverwendbare HTML-Fragmente
│   └── lock_screen.html        # Lock-Screen Template
│
├── python/                     # Python-Package
│   ├── pyproject.toml          # pip install -e .
│   └── meryverse_core/
│       ├── __init__.py
│       ├── assets.py           # CSS/JS/Template-Loader
│       └── html_builder.py     # HTML-Assembler (Builder-Pattern)
│
└── README.md
```

## Einrichtung (pro Projekt)

### Option A: Git Submodule (empfohlen)

```bash
cd dein-projekt/
git submodule add https://github.com/Merlloyd/meryverse_core.git meryverse_core
pip install -e meryverse_core/python/
```

### Option B: Symlink (lokal)

```bash
ln -s /pfad/zu/meryverse_core meryverse_core
pip install -e meryverse_core/python/
```

## Verwendung

### Vorher (alles in einer riesigen .py)

```python
# 800 Zeilen CSS/JS als String in jeder generate_*.py ...
HTML = f"""<!DOCTYPE html>
<style>
:root {{ --bg: #0c3242; ... }}  /* 150 Zeilen CSS kopiert */
/* Lock-Screen CSS kopiert */
</style>
<script>
async function deriveKey(...) {{ ... }}  /* 200 Zeilen Crypto kopiert */
</script>
"""
```

### Nachher

```python
from meryverse_core.html_builder import HtmlBuilder
from meryverse_core.assets import load_sheetjs

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

html = (
    HtmlBuilder(title="Kettenauswertung", version="2.1")
    .css("design_system", "lock_screen")         # Shared styles
    .css_raw(MY_CUSTOM_CSS)                       # Projekt-spezifisch
    .js("crypto", "lock_screen", "export_utils")  # Shared JS
    .js_raw(load_sheetjs(SCRIPT_DIR))             # SheetJS aus Projektordner
    .js_raw(MY_APP_JS)                            # Projekt-Logik
    .body(MY_HTML_BODY)                           # Projekt-HTML
    .write(os.path.join(SCRIPT_DIR, "output.html"))
)
```

## Module im Detail

| Modul | Beschreibung | Genutzt von |
|-------|-------------|-------------|
| `design_system.css` | Farben, Fonts, Layout, Sidebar, Topbar | Alle 5 Apps |
| `lock_screen.css` | Passwort-Dialog Styles | FTE, Ketten, Vergleich |
| `crypto.js` | AES-256-GCM + PBKDF2 + Dual-Envelope v2 | FTE, Ketten, Vergleich |
| `lock_screen.js` | Load/Create Flow mit Drag & Drop | FTE, Ketten, Vergleich |
| `export_utils.js` | Blob-Download, CSV, JSON, verschlüsselt | Alle 5 Apps |
| `ui_utils.js` | fmtEuro(), fmtDate(), Toasts, escHtml() | Alle 5 Apps |

## Design-System Farben

| Variable | Wert | Verwendung |
|----------|------|-----------|
| `--bg` | `#0c3242` | Hintergrund |
| `--surface` | `#114B5F` | Karten, Sidebar |
| `--accent` | `#1A936F` | Primär-Akzent |
| `--accent2` | `#88D498` | Sekundär-Akzent |
| `--pos` | `#88D498` | Positive Werte |
| `--neg` | `#f87171` | Negative Werte |
| `--warn` | `#fbbf24` | Warnungen |
| `--text` | `#F3E9D2` | Haupttext |
