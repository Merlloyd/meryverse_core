"""Icons (UI-Kit Phase 7, seit 0.22.0): Tabler-Linien als Core-Satz (js/icons.js)."""
import re
from pathlib import Path

JS = Path(__file__).resolve().parent.parent / "js"


def _lies(name):
    return (JS / name).read_text(encoding="utf-8")


def test_api():
    js = _lies("icons.js")
    for teil in ("global.mxhIcon = mxhIcon", "register: function (map)", "'[data-mxh-icon]'",
                 "new MutationObserver", 'aria-hidden="true"', 'stroke="currentColor"', 'stroke-width="1.8"',
                 'viewBox="0 0 24 24"'):
        assert teil in js, teil


def test_satz_deckt_die_aktionen_ab():
    js = _lies("icons.js")
    namen = set(re.findall(r'^    "([a-z-]+)": \'', js, flags=re.M))
    for n in ("bearbeiten", "loeschen", "x", "plus", "check", "verwalten", "info", "warnung", "hochladen",
              "download", "link", "extern", "auge", "kalender", "suche", "hilfe", "zurueck", "kopieren",
              "anhang", "kommentar", "datei", "ordner", "bild", "mail", "telegram", "schloss", "home",
              "statistik", "rakete", "speichern", "aktualisieren", "play", "pause", "stopp", "merken",
              "standard", "menue", "nutzer", "drucken", "vollbild", "ort", "mikrofon", "musik", "uhr"):
        assert n in namen, n
    # nur Pfad-/Formelemente, keine Skripte oder Fremd-Attribute
    for inhalt in re.findall(r"^    \"[a-z-]+\": '(.*)'", js, flags=re.M):
        assert re.fullmatch(r'(<(path|circle|rect|line|polyline|polygon|ellipse) [^<>]*/>)+', inhalt), inhalt[:60]


def test_icon_css():
    css = _lies("controls.css")
    assert ".mxh-ico {" in css and "[data-mxh-icon]" in css
    # Farbe kommt aus dem Text: keine Füll-/Strichfarbe in der Icon-Regel
    regel = css[css.index(".mxh-ico {"):].split("}")[0]
    assert "color" not in regel and "stroke" not in regel and "fill" not in regel
