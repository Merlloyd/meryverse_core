"""Popups und Rückmeldungen (UI-Kit Phase 4, seit 0.15.0): modal, toast, Ebenen.

Die Dateien sind handgeschrieben; das Portal vendort sie nach apps/static/core/.
"""
import re
from pathlib import Path

from meryverse_core import design

ROOT = Path(__file__).resolve().parent.parent
JS = ROOT / "js"


def _lies(name):
    return (JS / name).read_text(encoding="utf-8")


def test_ebenen_reihenfolge():
    # Feedback-Knopf unter App-Dialogen, App-Dialoge unter mxhModal (Rückfrage
    # über einem Dialog), Toast und Tooltip ganz oben.
    css = design.get_tokens_css()
    werte = {k: int(v) for k, v in re.findall(r"--z-([a-z]+):\s*(\d+)", css)}
    assert werte["fab"] < werte["overlay"] < werte["modal"] < werte["menu"] < werte["toast"] < werte["tooltip"]


def test_komponenten_nutzen_die_ebenen():
    # Keine festen z-index-Zahlen mehr in den geteilten Komponenten.
    for name in ("modal.css", "feedback.css", "toast.css", "status.css", "tooltip.css", "menu.css"):
        for wert in re.findall(r"z-index\s*:\s*([^;]+);", _lies(name)):
            assert wert.strip().startswith("var(--z-"), (name, wert)


def test_modal_fokusfalle_und_rueckgabe():
    js = _lies("modal.js")
    assert "e.key !== 'Tab'" in js            # Tab wird abgefangen
    assert "ausloeser" in js                  # Fokus kehrt zum Auslöser zurück
    assert "aria-labelledby" in js
    assert ".mxh-modal-x" in _lies("modal.css")


def test_confirm_gefahr_fokussiert_abbrechen():
    assert "(opts.danger ? ab : ok).focus()" in _lies("modal.js")


def test_toast_api():
    js = _lies("toast.js")
    assert "global.mxhToast = mxhToast" in js
    assert "role', k === 'err' ? 'alert' : 'status'" in js
    css = _lies("toast.css")
    for teil in (".mxh-toast-host {", ".mxh-toast {", ".mxh-toast--err {", "--toast-unten"):
        assert teil in css, teil


def test_keine_harten_weiss_und_rottoene():
    for name in ("modal.css", "toast.css", "feedback.css", "status.css", "tooltip.css"):
        text = re.sub(r"/\*.*?\*/", "", _lies(name), flags=re.S)
        for verboten in ("#fff;", "#ef4444", "#dc2626", "color: #0c3242"):
            assert verboten not in text, (name, verboten)


def test_status_bausteine():
    css = _lies("status.css")
    for teil in (".mxh-overlay {", ".mxh-overlay[hidden]", ".mxh-dialog {", ".mxh-x {",
                 ".mxh-empty {", ".mxh-loading {", ".mxh-spinner", ".mxh-progress {",
                 ".mxh-flash--ok {", ".mxh-flash--err {", "var(--z-overlay"):
        assert teil in css, teil


def test_status_nur_mxh_klassen():
    ohne = re.sub(r"/\*.*?\*/", "", _lies("status.css"), flags=re.S)
    for m in re.finditer(r"([^{}]*)\{[^{}]*\}", ohne):
        for s in m.group(1).split(","):
            s = s.strip()
            if s and not s.startswith(("@", "to", "from")):
                assert s.startswith(".mxh-"), s


def test_tooltip():
    js = _lies("tooltip.js")
    assert "global.mxhTip" in js and "'[data-tip-t], [data-tip]'" in js
    assert "esc(titel)" in js and "esc(text)" in js        # kein HTML aus Attributen
    assert "var(--z-tooltip" in _lies("tooltip.css")


def test_fokusfalle_fuer_app_dialoge():
    # Seit 0.17.0: fokus.js (lädt auf jeder Seite) fängt Tab in jedem sichtbaren
    # .mxh-overlay, ohne dass die Apps etwas aufrufen; mxhModal hat Vorrang.
    js = _lies("fokus.js")
    assert "querySelectorAll('.mxh-overlay')" in js
    assert "MutationObserver" in js and "attributeFilter: ['hidden', 'class', 'style']" in js
    assert "getElementById('mxh-modal-root')" in js           # Vorrang mxhModal
    assert "ausloeser" in js                                  # Fokus zurück
    assert ".focus()" not in js.split("function fokusRein")[1].split("}")[0].replace("d.focus(", "")  # nie ins erste Feld


# ── Menü (UI-Kit Phase 5, seit 0.18.0) ──

def test_menu_api_und_tastatur():
    js = _lies("menu.js")
    assert "global.mxhMenu = api" in js
    for teil in ("case 'ArrowDown'", "case 'ArrowUp'", "case 'Home'", "case 'End'", "case 'ArrowRight'",
                 "case 'ArrowLeft'", "case 'Escape'", "case 'Tab'", "aria-expanded", "aria-haspopup",
                 "menuitemradio", "menuitemcheckbox", "aria-checked", "'listbox'"):
        assert teil in js, teil


def test_menu_escaped_texte():
    js = _lies("menu.js")
    assert "esc(it.label)" in js and "esc(it.hint)" in js and "esc(st.opts.title)" in js


def test_menu_css():
    css = _lies("menu.css")
    for teil in (".mxh-menu {", "var(--z-menu", ".mxh-menu--sheet", ".mxh-menu-item {", "min-height: var(--ctl-h"):
        assert teil in css, teil
    ohne = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    for m in re.finditer(r"([^{}]*)\{[^{}]*\}", ohne):
        for s in m.group(1).split(","):
            s = s.strip()
            if s and not s.startswith("@"):
                assert s.startswith(".mxh-"), s


def test_auswahl_faengt_nur_das_oeffnen_ab():
    # F8: <select class="mxh-input"> öffnet die Meryverse-Liste; das Select
    # bleibt das Feld (Klassen, Maße, Wert, change-Event unverändert).
    js = _lies("menu.js")
    assert "global.mxhAuswahl" in js
    assert "'select.mxh-input, select.mxh-modal-input, select[data-mxh-auswahl]'" in js
    for teil in ("addEventListener('mousedown'", "addEventListener('touchend'", "e.key === 'Enter'",
                 "new Event('change', { bubbles: true })", "data-mxh-nativ"):
        assert teil in js, teil
