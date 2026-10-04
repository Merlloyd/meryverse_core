"""js/tokens.css muss exakt dem entsprechen, was design.py erzeugt.

Hintergrund: Das Portal lädt js/tokens.css als statische Datei
(/core/tokens.css), der Chor bekommt dieselben Werte über
get_css_block(). Zwei Wege, eine Quelle — dieser Test hält sie gleich.
"""
from pathlib import Path

from meryverse_core import design

ROOT = Path(__file__).resolve().parent.parent


def test_tokens_css_ist_aktuell():
    datei = (ROOT / "js" / "tokens.css").read_text(encoding="utf-8")
    assert datei == design.get_tokens_css(), (
        "js/tokens.css ist veraltet — neu erzeugen mit "
        "`python -m meryverse_core.design > js/tokens.css`"
    )


def test_portal_kernwerte_unveraendert():
    # Die elf Kernfarben aus dem Portal-Design-System (CLAUDE.md §5 der
    # Website). Eine Änderung hier ändert jede Seite des Portals.
    t = design.get_css_variables("meryverse")
    assert t["bg"] == "#0c3242"
    assert t["surface"] == "#114B5F"
    assert t["surface2"] == "#1a5d74"
    assert t["border"] == "rgba(136,212,152,0.15)"
    assert t["border2"] == "rgba(136,212,152,0.28)"
    assert t["accent"] == "#1A936F"
    assert t["accent2"] == "#88D498"
    assert t["text"] == "#F3E9D2"
    assert t["text2"] == "#C6DABF"
    assert t["text3"] == "rgba(198,218,191,0.65)"
    assert t["neg"] == "#f87171"


def test_mono_und_font_mono_gleich():
    t = design.get_css_variables("meryverse")
    assert t["mono"] == t["font-mono"]


def test_basis_regeln_enthalten():
    # UI-Kit Phase 1: jede Portal-Seite bekommt die Basis-Regeln mit tokens.css.
    css = design.get_tokens_css()
    for teil in (":root { color-scheme: dark; accent-color: var(--accent2); }",
                 ":focus-visible { outline: 2px solid var(--accent2)",
                 "prefers-reduced-motion: reduce",
                 ".no-scrollbar, .no-scrollbar *",
                 "::-webkit-calendar-picker-indicator"):
        assert teil in css, teil


def test_kern_assets_schalten_fokus_nicht_ab():
    # Der globale :focus-visible-Ring darf nicht von den geteilten Komponenten
    # selbst wieder abgeschaltet werden.
    import re
    for name in ("modal.css", "feedback.css"):
        text = (ROOT / "js" / name).read_text(encoding="utf-8")
        assert not re.search(r"outline\s*:\s*(none|0)\b", text), name


def test_kalendersymbol_nicht_invertiert():
    # color-scheme: dark lässt Chrome das Kalendersymbol schon hell zeichnen.
    # Ein zusätzliches filter: invert() dreht es zurück ins Dunkle — auf dem
    # dunklen Portal-Grund ist es dann kaum sichtbar (gemessen: hellster Pixel
    # 255 ohne, 136 mit invert(0.85)).
    css = design.PORTAL_BASIS_CSS
    regel = css[css.index("::-webkit-calendar-picker-indicator"):]
    regel = regel[:regel.index("}")]
    assert "invert" not in regel


def test_textfeld_ring_nur_bei_tastatur():
    # Der Ring in Textfeldern wird nur im Maus-Modus (html.mxh-maus, gesetzt
    # von js/fokus.js) abgeschaltet — nie pauschal.
    css = design.PORTAL_BASIS_CSS
    assert "html.mxh-maus :is(input:not(" in css
    fokus = (ROOT / "js" / "fokus.js").read_text(encoding="utf-8")
    assert "classList.add('mxh-maus')" in fokus
    assert "e.key === 'Tab'" in fokus
