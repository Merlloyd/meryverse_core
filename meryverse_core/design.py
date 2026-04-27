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
