"""
design.py — Color/typography schemes for Meryverse HTML dashboard generators.

A scheme is a dict of CSS-variable name → value. Both schemes share a core
contract (surfaces, borders, accents, semantic, text, geometry, typography,
shadow) so they can be swapped at the call site. Schemes may add their own
extras (e.g. Vodafone's secondary palette + tint colors + brand-bar).

Usage:
    from meryverse_core import design

    css = design.get_css_block()                     # default = "meryverse"
    css = design.get_css_block(scheme="vodafone")    # opt-in
    tokens = design.get_css_variables("vodafone")    # raw dict
    available = design.list_schemes()                # ["meryverse", "vodafone"]
"""

from __future__ import annotations


SCHEMES: dict[str, dict[str, str]] = {
    "meryverse": {
        # Surfaces
        "bg":         "#0c3242",
        "surface":    "#114B5F",
        "surface2":   "#1a5d74",
        "surface3":   "#1f6b85",
        # Borders (rgba derivatives of accent2)
        "border":     "rgba(136,212,152,0.15)",
        "border2":    "rgba(136,212,152,0.28)",
        # Accents
        "accent":     "#1A936F",
        "accent2":    "#88D498",
        # Semantic
        "pos":        "#88D498",
        "neg":        "#f87171",
        "warn":       "#fbbf24",
        # Text
        "text":       "#F3E9D2",
        "text2":      "#C6DABF",
        "text3":      "rgba(198,218,191,0.65)",
        # Geometry
        "radius":     "10px",
        "radius-lg":  "16px",
        # Typography
        "font":       "'IBM Plex Sans','Segoe UI',sans-serif",
        "font-mono":  "'IBM Plex Mono','Courier New',monospace",
        # Kurzname, den das Portal (app.meryverse.de) seit jeher nutzt —
        # gleicher Wert wie font-mono, damit beide Namen funktionieren.
        "mono":       "'IBM Plex Mono','Courier New',monospace",
        # Effects
        "shadow":     "0 4px 28px rgba(0,0,0,0.55)",
    },
    "vodafone": {
        # Surfaces — light with subtle aqua tint
        "bg":         "#EEF3F6",
        "surface":    "#FFFFFF",
        "surface2":   "#F5F8FA",
        "surface3":   "#E4ECF1",
        # Borders — Vodafone Grey, subtle
        "border":     "rgba(84,87,90,0.15)",
        "border2":    "rgba(84,87,90,0.32)",
        # Accents
        "accent":     "#E60000",  # Vodafone Red
        "accent2":    "#B20000",  # darker red for hover/gradient end
        # Semantic
        "pos":        "#7A8300",  # darker spring green for legibility on white
        "neg":        "#CC1414",  # dark red, distinct from accent
        "warn":       "#EB9700",  # orange (VF secondary)
        # Vodafone secondary palette
        "aqua":       "#00B0CA",
        "turq":       "#007C92",
        "violet":     "#9C2AA0",
        "aubergine":  "#5E2750",
        "spring":     "#A8B400",
        "lemon":      "#FECB00",
        # Tinted backgrounds for badges / highlights
        "tint-accent":    "rgba(230,0,0,0.10)",
        "tint-aqua":      "rgba(0,176,202,0.12)",
        "tint-turq":      "rgba(0,124,146,0.12)",
        "tint-violet":    "rgba(156,42,160,0.12)",
        "tint-aubergine": "rgba(94,39,80,0.10)",
        "tint-spring":    "rgba(168,180,0,0.16)",
        "tint-warn":      "rgba(235,151,0,0.14)",
        # Text — Vodafone greys
        "text":       "#25282B",
        "text2":      "#54575A",
        "text3":      "rgba(37,40,43,0.55)",
        # Geometry
        "radius":     "10px",
        "radius-lg":  "16px",
        # Typography
        "font":       "'IBM Plex Sans','Segoe UI',sans-serif",
        "font-mono":  "'IBM Plex Mono','Courier New',monospace",
        # Effects
        "shadow":     "0 2px 12px rgba(0,0,0,0.08)",
        "brand-bar":  "linear-gradient(90deg, var(--accent) 0%, var(--violet) 55%, var(--aqua) 100%)",
    },
}

DEFAULT_SCHEME = "meryverse"


def list_schemes() -> list[str]:
    """Return the names of the available schemes."""
    return list(SCHEMES)


def get_css_variables(scheme: str = DEFAULT_SCHEME) -> dict[str, str]:
    """Return the design tokens of `scheme` as a dict of name → value.

    Keys are the CSS custom property names without the leading `--`.
    Raises ValueError if `scheme` is not a known scheme.
    """
    if scheme not in SCHEMES:
        raise ValueError(
            f"Unknown scheme {scheme!r}. Available: {list_schemes()}"
        )
    return dict(SCHEMES[scheme])


def get_css_block(scheme: str = DEFAULT_SCHEME) -> str:
    """Return a `:root { ... }` CSS block ready to embed in a <style> tag."""
    lines = [f"  --{name}: {value};" for name, value in get_css_variables(scheme).items()]
    return ":root {\n" + "\n".join(lines) + "\n}"


# Statische Token-Datei für Seiten, die keinen Python-Renderschritt haben
# (Portal-Templates laden sie als /core/tokens.css). Sie wird aus SCHEMES
# erzeugt, damit es genau eine Quelle der Wahrheit gibt — ein Test prüft,
# dass js/tokens.css und get_tokens_css() übereinstimmen.
TOKENS_CSS_HEADER = """/* meryverse_core — Design-Tokens (Scheme "meryverse")
 *
 * GENERIERT aus meryverse_core/design.py — nicht von Hand ändern.
 * Neu erzeugen:  python -m meryverse_core.design > js/tokens.css
 *
 * Wird im Portal als /core/tokens.css VOR allen anderen Stylesheets geladen.
 * Seiten dürfen einzelne Tokens danach überschreiben (z. B. der Spiele-
 * Beamer); alles andere kommt aus dieser Datei.
 *
 * Enthält seit 0.9.0 außer den Tokens auch die Basis-Regeln aller Portal-
 * Seiten (Fokus, dunkle Bedienelemente, Scrollbalken, reduzierte Bewegung).
 */
"""


# Basis-Regeln für jede Portal-Seite (UI-Kit Phase 1, Workspace-Plan
# plans/2026-10-03-ui-bedienelemente-vereinheitlichen.md). Sie stehen in
# derselben Datei wie die Tokens, weil jede Seite tokens.css bereits als ERSTES
# Stylesheet lädt: Eine eigene base.css hätte eine neue Route, einen Eintrag in
# der allowed-Menge von require_login und einen Link in jedem Template
# gebraucht — genau die Fehlerklasse von V3.153.4. Und weil die Datei zuerst
# kommt, behalten bewusste Abweichungen der Apps das letzte Wort.
# Alle Selektoren sind absichtlich schwach (Spezifität 0 bzw. eine Klasse).
PORTAL_BASIS_CSS = """
/* ── Basis-Regeln (UI-Kit Phase 1) ─────────────────────────────────────
 * Dunkles Portal: native Bedienelemente (Datums-Picker, Auswahllisten,
 * Scrollbalken, Autofill) dunkel rendern; Häkchen, Radios und Regler in der
 * Akzentfarbe.
 */
:root { color-scheme: dark; accent-color: var(--accent2); }

/* Sichtbarer Tastatur-Fokus überall. Apps dürfen ihn nicht mit
 * `outline: none` abschalten (Wächter tests/test_ui_basis.py im Website-Repo). */
:focus-visible { outline: 2px solid var(--accent2); outline-offset: 2px; }

/* Textfelder zeigen den Ring nur bei Tastaturbedienung (Betreiber-Entscheidung
 * 2026-10-04): Chrome wertet :focus-visible dort auch nach Mausklick und bei
 * autofocus als „sichtbar". js/fokus.js setzt html.mxh-maus, bis mit Tab
 * navigiert wird; ohne Skript fehlt die Klasse und der Ring bleibt immer an. */
html.mxh-maus :is(input:not([type=checkbox], [type=radio], [type=range], [type=button], [type=submit], [type=reset], [type=file], [type=color]), textarea, select, [contenteditable]):focus-visible { outline-style: none; }

/* Kalender-Symbol nativer Datums-/Zeitfelder: Hell zeichnet Chrome es schon
 * wegen color-scheme: dark — KEIN filter: invert(), der dreht es zurück ins
 * Dunkle und macht es auf dunklem Grund unsichtbar (nachgemessen 2026-10-04). */
::-webkit-calendar-picker-indicator { cursor: pointer; }

/* Dünne, getönte Scrollbalken. Ausblenden nur gezielt mit .no-scrollbar —
 * wirkt auf das Element und alles darin (z. B. <body class="no-scrollbar">). */
* { scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 8px; }
::-webkit-scrollbar-track { background: transparent; }
.no-scrollbar, .no-scrollbar * { scrollbar-width: none; -ms-overflow-style: none; }
.no-scrollbar::-webkit-scrollbar, .no-scrollbar *::-webkit-scrollbar { display: none; }

/* Wer Bewegung reduziert haben möchte, bekommt keine Animationen. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important; animation-iteration-count: 1 !important;
    transition-duration: .01ms !important; scroll-behavior: auto !important;
  }
}
"""


def get_tokens_css(scheme: str = DEFAULT_SCHEME) -> str:
    """Return the content of the static token stylesheet (js/tokens.css):
    header, the scheme's :root block and the portal base rules."""
    return TOKENS_CSS_HEADER + get_css_block(scheme) + "\n" + PORTAL_BASIS_CSS


if __name__ == "__main__":  # pragma: no cover
    import sys
    sys.stdout.write(get_tokens_css(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SCHEME))
