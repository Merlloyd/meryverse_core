# meryverse_core

Shared utilities for the Meryverse apps: design tokens, (later) crypto helpers,
plus the legacy CSS/JS asset loader and HTML builder used by the offline
dashboard generators (Haushaltsbuch, Aktien, Chor, FTE, Ketten, Vergleich).

## Install

### Editable (local development)

When working on `meryverse_core` and a consuming app side by side:

```bash
cd path/to/consuming-app
pip install -e ../meryverse_core
```

Edits in `meryverse_core/` are picked up immediately — no reinstall needed.

### Pinned (production)

In the consuming app's `requirements.txt`, pin a Git tag:

```
meryverse-core @ git+https://github.com/Merlloyd/meryverse_core.git@v0.1.0
```

Bump the tag (e.g. `@v0.2.0`) when you want to roll the consuming app forward.

## Layout

```
meryverse_core/
├── pyproject.toml              # Package metadata (name "meryverse-core")
├── meryverse_core/             # Python module (import name with underscore)
│   ├── __init__.py             # __version__
│   ├── design.py               # mxh design tokens (colors, fonts, radii)
│   ├── crypto.py               # placeholder — server-side crypto helpers
│   ├── assets.py               # CSS/JS/template loader for offline generators
│   └── html_builder.py         # Builder for self-contained HTML files
├── js/                         # Frontend modules (loaded via assets.py)
│   ├── design_system.css
│   ├── lock_screen.{css,js}
│   ├── crypto.js
│   ├── export_utils.js
│   └── ui_utils.js
└── templates/
    └── lock_screen.html
```

`pip` package name is `meryverse-core` (hyphen, PyPI convention); Python import
name is `meryverse_core` (underscore).

## Quick start

```python
from meryverse_core import design

# All tokens as a dict
tokens = design.get_css_variables()       # {"bg": "#0c3242", ...}

# Drop straight into a <style> block
css_root = design.get_css_block()         # ":root {\n  --bg: #0c3242;\n  ...\n}"
```

For the legacy generators (CSS/JS bundling):

```python
from meryverse_core.html_builder import HtmlBuilder
from meryverse_core.assets import load_sheetjs

html = (
    HtmlBuilder(title="Kettenauswertung", version="2.1")
    .css("design_system", "lock_screen")
    .js("crypto", "lock_screen", "export_utils", "ui_utils")
    .js_raw(load_sheetjs(SCRIPT_DIR))
    .body(MY_HTML_BODY)
    .write("output.html")
)
```
