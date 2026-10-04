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
│   ├── tokens.css              # generated from design.py (portal: /core/tokens.css)
│   ├── fokus.js                # html.mxh-maus: ring in text fields only via keyboard
│   ├── frame.css               # page frame: footer, containers, table (portal: /static/core/)
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

design.list_schemes()                              # ["meryverse", "vodafone"]

# Default scheme = "meryverse"
tokens = design.get_css_variables()                # {"bg": "#0c3242", ...}
css_root = design.get_css_block()                  # ":root {\n  --bg: #0c3242;\n  ...\n}"

# Pick a scheme at the call site
css_root = design.get_css_block(scheme="vodafone")

# Static token stylesheet for pages without a Python render step
# (the portal serves it as /core/tokens.css, vendored via sync-core-assets.sh)
css_file = design.get_tokens_css()                 # == js/tokens.css
```

Since 0.9.0 the file also carries the **portal base rules** (`PORTAL_BASIS_CSS`:
`color-scheme: dark`, global `:focus-visible` ring, `accent-color`, thin scrollbars with a
`.no-scrollbar` opt-out, `prefers-reduced-motion`) — every portal page already loads it first,
so a separate `base.css` would only add a route, a login exception and a link per template.

Since 0.10.0 `js/frame.css` carries the **page frame** (UI-Kit phase 2): `--kopf`,
`--seitenrand`, the footer `.portal-footer` (partial `_footer.html` in the portal), containers
`.mxh-seite`, the table base `.mxh-tabelle`, the documented sticky trap and (since 0.11.0) the
header `.portal-kopf` for the portal macro `kopf()` in `_header.html`. Hand-written, not
generated; the portal loads it as `/static/core/frame.css` right after `fokus.js`. Selectors are
always class-bound, never bare `footer`/`header`.

`js/tokens.css` is **generated** from `design.py` — regenerate with
`python -m meryverse_core.design > js/tokens.css`; `tests/test_tokens.py`
fails if the file is stale.

Both schemes share the same core contract (`bg`, `surface*`, `border*`,
`accent*`, `pos`/`neg`/`warn`, `text*`, `radius*`, `font*`, `shadow`) so they
are swappable. The Vodafone scheme additionally provides its secondary palette
(`aqua`, `turq`, `violet`, `aubergine`, `spring`, `lemon`), tinted variants
(`tint-*`) and the `brand-bar` gradient.

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
