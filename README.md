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
│   ├── controls.css            # buttons and fields .mxh-btn/.mxh-input … (portal: /static/core/)
│   ├── modal.{css,js}          # mxhModal alert/confirm/prompt/open (portal: /core/modal.*)
│   ├── toast.{css,js}          # mxhToast(text, {kind, ms}) (portal: /static/core/)
│   ├── status.css              # app dialogs .mxh-overlay/.mxh-dialog/.mxh-x, empty/loading/progress/flash
│   ├── tooltip.{css,js}        # [data-tip-t]/[data-tip] mouseover, keyboard, touch long-press
│   ├── menu.{css,js}           # mxhMenu: menus/submenus/search, keyboard, ARIA, bottom sheet
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

Since 0.12.0 `js/controls.css` carries **buttons and fields** (UI-Kit phase 3): `.mxh-btn`
(+ `--primary` light green with dark text, `--ghost`, `--danger`, `--sm`, `--icon`, `--block`),
`.mxh-chip`, `.mxh-linkbtn`, `.mxh-input`, labels/hints/errors, switch, file. Only `.mxh-` selectors,
only token colors; `modal.css`/`feedback.css` use the same values. Portal: `/static/core/controls.css`
right after `frame.css`.

Since 0.15.0 (UI-Kit phase 4, popups and feedback): `tokens.css` carries one **layer scale**
`--z-fab 900 < --z-overlay 1000 < --z-modal 3000 < --z-toast 3500 < --z-tooltip 4000`, plus
`--overlay` and `--shadow-pop`. `mxhModal` traps Tab inside the top dialog, returns focus to the
trigger, names the dialog (`aria-labelledby`) and offers a close button `.mxh-modal-x`
(`open(html, {x: true})`); `confirm(…, {danger: true})` focuses *Cancel*. `js/toast.{css,js}`
provide `mxhToast(text, {kind: 'ok'|'err'|'info', ms})`, stacked bottom centre (raise with
`--toast-unten`). The feedback button sits below every dialog. Tests: `tests/test_popups.py`.

Since 0.16.0 `js/status.css` (portal: every page, right after `controls.css`) gives app-owned
dialogs one frame — `.mxh-overlay` (z `--z-overlay`, `--overlay`, blur) + `.mxh-dialog` + close
button `.mxh-x` — and the status patterns `.mxh-empty(--karte)`, `.mxh-loading`/`.mxh-spinner`,
`.mxh-progress > span`, `.mxh-flash(--ok|--err)`. `js/tooltip.{css,js}` is the former chor
mouseover as a core component: `data-tip-t` (bold title) + `data-tip` (text), delegated, also on
keyboard focus and touch long-press.

Since 0.17.0 `js/fokus.js` also traps focus in **app-owned dialogs**: every visible `.mxh-overlay`
(found by a MutationObserver, however the app opens it) keeps Tab inside its `.mxh-dialog`, moves
focus to the dialog itself on open (not into the first field — no surprise keyboard on phones) and
returns focus to the trigger on close. Stacked dialogs: the higher layer wins; an open `mxhModal`
takes precedence. Esc stays with the app.

Since 0.18.0 `js/menu.{css,js}` (UI-kit phase 5) is the former chor "Meryverse menu" as a core
component: `mxhMenu.open(anchor, items, opts)` with items `{label, onSelect, checked, radio,
disabled, keepOpen, icon, hint, color, children}` or `{sep: true}`; opts `host`, `placement`
(`below`/`above`), `search` (true or a minimum item count), `title` + `onDetach`, `matchWidth`,
`role` (`menu`/`listbox`). Full keyboard (arrows, Home/End, Enter/Space, → / ← for submenus, Esc,
Tab, type-ahead), ARIA roles and `aria-expanded` on the anchor, focus back to the anchor, height
clamped to the viewport, closes on scroll/resize, bottom sheet with drill-down submenus on narrow
touch screens. `mxhMenu.build(items, {after})` renders the flat form for detached windows. New
layer token `--z-menu 3400`.

Since 0.19.0 the same file upgrades **selects** (F8, no native drop-down list in the portal):
every `select.mxh-input` / `select.mxh-modal-input` / `select[data-mxh-auswahl]` opens the
Meryverse list (role listbox, search from 8 entries, `<optgroup>` as headings) instead of the
browser list — mouse, touch, Enter/Space/Alt+↓/F4. The select itself stays the visible field
(classes, sizes, value, `change` event untouched); new selects are picked up by a
MutationObserver. Opt out with `data-mxh-nativ`. Item type `{group: 'Heading'}` added.

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
