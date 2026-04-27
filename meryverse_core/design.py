"""
design.py — mxh design system as data.

Single source of truth for the colors, fonts, radii and shadow tokens used by
all Meryverse HTML dashboard generators. Returned as a plain dict so callers
can pick individual values, or as a ready-to-embed `:root { ... }` CSS block.
"""

from __future__ import annotations


def get_css_variables() -> dict[str, str]:
    """Return the mxh design tokens as a dict of CSS variable name → value.

    Keys are the CSS custom property names without the leading `--`.
    """
    return {
        # Surfaces
        "bg":        "#0c3242",
        "surface":   "#114B5F",
        "surface2":  "#1a5d74",
        "surface3":  "#1f6b85",
        # Accents
        "accent":    "#1A936F",
        "accent2":   "#88D498",
        # Semantic
        "pos":       "#88D498",
        "neg":       "#f87171",
        "warn":      "#fbbf24",
        # Text
        "text":      "#F3E9D2",
        "text2":     "#C6DABF",
        "text3":     "rgba(198,218,191,0.65)",
        # Geometry
        "radius":    "10px",
        "radius-lg": "16px",
        # Typography
        "font":      "'IBM Plex Sans','Segoe UI',sans-serif",
        "font-mono": "'IBM Plex Mono','Courier New',monospace",
        # Effects
        "shadow":    "0 4px 28px rgba(0,0,0,0.55)",
    }


def get_css_block() -> str:
    """Return a `:root { ... }` CSS block ready to embed in a <style> tag."""
    lines = [f"  --{name}: {value};" for name, value in get_css_variables().items()]
    return ":root {\n" + "\n".join(lines) + "\n}"
