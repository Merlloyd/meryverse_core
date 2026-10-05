"""js/controls.css: Knöpfe und Felder jeder Portal-Seite (UI-Kit Phase 3, seit 0.12.0).

Handgeschrieben. Das Portal vendort die Datei nach apps/static/core/controls.css.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = (ROOT / "js" / "controls.css").read_text(encoding="utf-8")
OHNE_KOMMENTARE = re.sub(r"/\*.*?\*/", "", CSS, flags=re.S)


def _regeln():
    for m in re.finditer(r"([^{}]*)\{([^{}]*)\}", OHNE_KOMMENTARE):
        sel = m.group(1).strip()
        if sel and not sel.startswith("@"):
            yield [s.strip() for s in sel.split(",")], m.group(2)


def test_bausteine_vorhanden():
    for teil in (".mxh-btn {", ".mxh-btn--primary {", ".mxh-btn--ghost {", ".mxh-btn--danger {",
                 ".mxh-btn--sm {", ".mxh-btn--icon {", ".mxh-chip {", ".mxh-linkbtn {",
                 ".mxh-input {", "select.mxh-input {", ".mxh-label {", ".mxh-hint {",
                 ".mxh-switch {", ".mxh-file {", ".mxh-chip--gross {", "--ctl-h: 36px"):
        assert teil in CSS, teil


def test_nur_mxh_klassen():
    # Nicht umgestellte Apps dürfen nichts abbekommen: jeder Selektor hängt an
    # einer .mxh-Klasse (oder ist :root).
    for sels, _ in _regeln():
        for s in sels:
            assert s == ":root" or ".mxh-" in s or s.startswith("[data-mxh-"), s


def test_primaer_ist_hell_mit_dunkler_schrift():
    # F1: --accent2-Fläche, Schrift --bg (über --on-accent). Weiß auf --accent
    # hatte nur ~3,9:1.
    m = re.search(r"\.mxh-btn--primary \{([^}]*)\}", OHNE_KOMMENTARE)
    assert "background: var(--accent2)" in m.group(1)
    assert "color: var(--on-accent)" in m.group(1)
    assert "--on-accent: var(--bg)" in OHNE_KOMMENTARE


def test_keine_hex_farben_kein_outline_none_kein_transition_all():
    assert not re.search(r"#[0-9a-fA-F]{3,8}\b|rgba?\(", OHNE_KOMMENTARE)
    assert not re.search(r"outline\s*:\s*(none|0)\b", OHNE_KOMMENTARE)
    assert not re.search(r"transition\s*:\s*all\b", OHNE_KOMMENTARE)


def test_touchziele_nie_unter_36px():
    for wert in re.findall(r"min-height:\s*(\d+)px", OHNE_KOMMENTARE):
        assert int(wert) >= 32, wert          # Chips 32, sonst ≥ 36
    assert "min-height: var(--ctl-h)" in OHNE_KOMMENTARE


def test_eine_groesse_fuer_alle():
    # Betreiber 2026-10-04 (0.14.0): Knöpfe und Felder einheitlich 36 px —
    # die --sm-Varianten dürfen Höhe, Innenabstand und Schrift nicht mehr ändern.
    assert "--ctl-h: 36px" in OHNE_KOMMENTARE
    assert "--ctl-h-sm: var(--ctl-h)" in OHNE_KOMMENTARE
    for klasse in (".mxh-btn--sm", ".mxh-input--sm"):
        m = re.search(re.escape(klasse) + r" \{([^}]*)\}", OHNE_KOMMENTARE)
        assert m, klasse
        assert not re.search(r"min-height|padding|font-size", m.group(1)), klasse
    modal = (ROOT / "js" / "modal.css").read_text(encoding="utf-8")
    assert "min-height: 40px" not in modal and "min-height: 44px" not in modal


def test_ios_zoom_schutz():
    assert re.search(r"@media \(pointer: coarse\) \{\s*\.mxh-input[^{]*\{ font-size: 16px; \}", OHNE_KOMMENTARE)


def test_modal_und_feedback_erben_die_werte():
    modal = (ROOT / "js" / "modal.css").read_text(encoding="utf-8")
    fb = (ROOT / "js" / "feedback.css").read_text(encoding="utf-8")
    assert "#ef4444" not in modal and "#dc2626" not in modal
    assert re.search(r"\.mxh-modal-ok \{[^}]*background: var\(--accent2", modal)
    assert re.search(r"\.mxh-fb-btn\.primary \{[^}]*background: var\(--accent2", fb)
    assert "border-radius: 8px" not in modal


def test_hidden_attribut_gewinnt():
    # .mxh-btn setzt display:inline-flex — ohne diese Regel bleibt ein per
    # hidden ausgeblendeter Knopf sichtbar.
    m = re.search(r"([^{}]*)\{\s*display:\s*none;\s*\}", OHNE_KOMMENTARE)
    for k in (".mxh-btn[hidden]", ".mxh-chip[hidden]", ".mxh-input[hidden]"):
        assert k in m.group(1), k


def test_tabs_segmente_akkordeon():
    # UI-Kit Phase 5 (0.20.0): Aktiv-Zustand nur über ARIA, keine .active-Klassen.
    for teil in (".mxh-tabs {", ".mxh-tab {", '.mxh-tab[aria-selected="true"]', ".mxh-seg {",
                 '.mxh-seg-btn[aria-pressed="true"]', ".mxh-akkordeon > summary"):
        assert teil in CSS, teil
    assert ".mxh-tab.active" not in CSS and ".mxh-seg-btn.active" not in CSS
    fokus = (ROOT / "js" / "fokus.js").read_text(encoding="utf-8")
    assert "[role=tablist]" in fokus and "e.key === 'Home'" in fokus


def test_navigation_leise_umschalter_gefuellt():
    # Betreiber 2026-10-04: aria-current="page" (Navigation) bekommt keine
    # gefüllte Fläche — die gehört Hauptaktion und echten Umschaltern.
    nav = re.search(r'\.mxh-seg-btn\[aria-current="page"\] \{([^}]*)\}', OHNE_KOMMENTARE)
    assert nav and "background: transparent" in nav.group(1)
    gefuellt = re.search(r'\.mxh-seg-btn\[aria-pressed="true"\][^{]*\{([^}]*)\}', OHNE_KOMMENTARE)
    assert gefuellt and "background: var(--accent2)" in gefuellt.group(1)
    assert 'aria-current="page"' not in OHNE_KOMMENTARE[gefuellt.start():gefuellt.end()]
