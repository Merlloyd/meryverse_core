"""js/frame.css: Rahmen jeder Portal-Seite (UI-Kit Phase 2, seit 0.10.0).

Handgeschrieben, nicht generiert. Das Portal vendort die Datei nach
apps/static/core/frame.css (scripts/sync-core-assets.sh im Workspace).
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = (ROOT / "js" / "frame.css").read_text(encoding="utf-8")
OHNE_KOMMENTARE = re.sub(r"/\*.*?\*/", "", CSS, flags=re.S)


def _selektoren():
    for m in re.finditer(r"([^{}]*)\{[^{}]*\}", OHNE_KOMMENTARE):
        for s in m.group(1).split(","):
            if s.strip() and not s.strip().startswith("@"):
                yield s.strip()


def test_rahmen_bausteine_vorhanden():
    for teil in ("--kopf: 64px", "--seitenrand:", ".portal-footer {",
                 ".mxh-seite {", ".mxh-tabelle {"):
        assert teil in CSS, teil


def test_nur_klassen_selektoren():
    # Native HTML-Bausteine (Info Material) und Dialoge haben eigene
    # <footer>/<header> — die dürfen nie getroffen werden.
    for s in _selektoren():
        assert not re.search(r"(^|[\s>+~])(footer|header)\b(?![-\w])", s), s


def test_kein_fokus_abschalten_und_kein_transition_all():
    assert not re.search(r"outline\s*:\s*(none|0)\b", OHNE_KOMMENTARE)
    assert not re.search(r"transition\s*:\s*all\b", OHNE_KOMMENTARE)


def test_nur_tokens_als_farben():
    # Farben kommen aus tokens.css; frame.css trägt keine eigenen Werte.
    assert not re.search(r"#[0-9a-fA-F]{3,8}\b|rgba?\(", OHNE_KOMMENTARE)
