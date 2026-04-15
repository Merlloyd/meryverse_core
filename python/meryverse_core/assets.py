"""
assets.py — Resolve and load shared asset files (CSS, JS, templates).

All paths are relative to the meryverse_core repo root,
which is two levels up from this file:
  meryverse_core/python/meryverse_core/assets.py
  └── repo root: ../../
"""

import os

# ─── Paths ────────────────────────────────────────────────────────────

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(_THIS_DIR, "..", ".."))
JS_DIR = os.path.join(REPO_ROOT, "js")
TEMPLATES_DIR = os.path.join(REPO_ROOT, "templates")


# ─── Generic loader ──────────────────────────────────────────────────

def _read(path: str) -> str:
    """Read a UTF-8 text file; raise clear error if missing."""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Asset nicht gefunden: {path}\n"
            f"Liegt das meryverse_core Repo korrekt neben dem Projekt?"
        )
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ─── CSS modules ─────────────────────────────────────────────────────

def load_css(name: str) -> str:
    """
    Load a CSS module by name (without .css extension).

    Available modules:
      - design_system   (base variables, layout, sidebar, topbar)
      - lock_screen     (password dialog styles)

    Returns the raw CSS string.
    """
    return _read(os.path.join(JS_DIR, f"{name}.css"))


def load_all_css(*names: str) -> str:
    """Load multiple CSS modules and concatenate them."""
    return "\n\n".join(load_css(n) for n in names)


# ─── JS modules ──────────────────────────────────────────────────────

def load_js(name: str) -> str:
    """
    Load a JS module by name (without .js extension).

    Available modules:
      - crypto          (AES-256-GCM, PBKDF2, dual-envelope)
      - lock_screen     (password UI flow)
      - export_utils    (Blob download, CSV, JSON, encrypted export)
      - ui_utils        (formatting, toasts, DOM helpers)

    Returns the raw JS string.
    """
    return _read(os.path.join(JS_DIR, f"{name}.js"))


def load_all_js(*names: str) -> str:
    """Load multiple JS modules and concatenate them."""
    return "\n\n".join(load_js(n) for n in names)


# ─── External libraries ──────────────────────────────────────────────

def load_sheetjs(search_dir: str | None = None) -> str:
    """
    Load xlsx.full.min.js from the calling project's directory.

    SheetJS is NOT bundled in meryverse_core (it's ~1 MB and
    version-specific). Each project keeps its own copy.

    Args:
        search_dir: Directory to look for xlsx.full.min.js.
                    Defaults to the caller's SCRIPT_DIR.
    """
    if search_dir is None:
        import inspect
        frame = inspect.stack()[1]
        search_dir = os.path.dirname(os.path.abspath(frame.filename))

    path = os.path.join(search_dir, "xlsx.full.min.js")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"xlsx.full.min.js nicht gefunden in {search_dir}\n"
            "Bitte SheetJS lokal ablegen: https://sheetjs.com/"
        )
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def load_chartjs(search_dir: str | None = None) -> str:
    """Load chart.min.js from the calling project's directory."""
    if search_dir is None:
        import inspect
        frame = inspect.stack()[1]
        search_dir = os.path.dirname(os.path.abspath(frame.filename))

    path = os.path.join(search_dir, "chart.min.js")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"chart.min.js nicht gefunden in {search_dir}\n"
            "Bitte Chart.js lokal ablegen: https://www.chartjs.org/"
        )
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


# ─── HTML templates ──────────────────────────────────────────────────

def load_template(name: str) -> str:
    """Load an HTML template by name (without .html extension)."""
    return _read(os.path.join(TEMPLATES_DIR, f"{name}.html"))
