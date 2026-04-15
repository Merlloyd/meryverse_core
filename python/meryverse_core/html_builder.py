"""
html_builder.py — Assemble offline HTML files from shared modules.

Typical usage in a project generator:

    from meryverse_core.html_builder import HtmlBuilder
    from meryverse_core.assets import load_sheetjs

    html = (
        HtmlBuilder(title="Kettenauswertung", version="2.1")
        .css("design_system", "lock_screen")
        .css_raw(MY_CUSTOM_CSS)
        .js("crypto", "lock_screen", "export_utils", "ui_utils")
        .js_raw(load_sheetjs())
        .js_raw(MY_APP_JS)
        .body(MY_HTML_BODY)
        .build()
    )
"""

from . import assets


class HtmlBuilder:
    """Builds a complete, self-contained HTML page from modular parts."""

    def __init__(self, title: str = "MXH App", version: str = "1.0", lang: str = "de"):
        self._title = title
        self._version = version
        self._lang = lang
        self._css_parts: list[str] = []
        self._js_parts: list[str] = []
        self._body_html: str = ""
        self._head_extra: str = ""

    # ── CSS ───────────────────────────────────────────────────────────

    def css(self, *module_names: str) -> "HtmlBuilder":
        """Add one or more shared CSS modules by name."""
        for name in module_names:
            self._css_parts.append(assets.load_css(name))
        return self

    def css_raw(self, raw_css: str) -> "HtmlBuilder":
        """Add raw CSS (project-specific styles)."""
        if raw_css:
            self._css_parts.append(raw_css)
        return self

    # ── JS ────────────────────────────────────────────────────────────

    def js(self, *module_names: str) -> "HtmlBuilder":
        """Add one or more shared JS modules by name."""
        for name in module_names:
            self._js_parts.append(assets.load_js(name))
        return self

    def js_raw(self, raw_js: str) -> "HtmlBuilder":
        """Add raw JS (SheetJS, Chart.js, project-specific code)."""
        if raw_js:
            self._js_parts.append(raw_js)
        return self

    # ── HTML ──────────────────────────────────────────────────────────

    def body(self, html: str) -> "HtmlBuilder":
        """Set the <body> content (everything inside <body>...</body>)."""
        self._body_html = html
        return self

    def head_extra(self, html: str) -> "HtmlBuilder":
        """Add extra elements to <head> (e.g. meta tags, preload hints)."""
        self._head_extra = html
        return self

    # ── Build ─────────────────────────────────────────────────────────

    def build(self) -> str:
        """Assemble the final HTML string."""
        css_block = "\n\n".join(self._css_parts)
        js_block = "\n\n".join(self._js_parts)

        return f"""<!DOCTYPE html>
<html lang="{self._lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{self._title}</title>
{self._head_extra}
<style>
{css_block}
</style>
</head>
<body>
{self._body_html}
<script>
{js_block}
</script>
</body>
</html>"""

    def write(self, path: str) -> str:
        """Build and write to file. Returns the path."""
        html = self.build()
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  ✓ {path} ({len(html):,} Bytes)")
        return path
