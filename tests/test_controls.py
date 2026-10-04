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
                 ".mxh-switch {", ".mxh-file {", ".mxh-chip--gross {", "--ctl-h: 44px", "--ctl-h-sm: 36px"):
        assert teil in CSS, teil


def test_nur_mxh_klassen():
    # Nicht umgestellte Apps dürfen nichts abbekommen: jeder Selektor hängt an
    # einer .mxh-Klasse (oder ist :root).
    for sels, _ in _regeln():
        for s in sels:
            assert s == ":root" or ".mxh-" in s, s


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
