---
kennung: version-bump-mit-git-tag
version: 1
art: regel
geltung: dieses Projekt
agenten: code
wann: bei Versionsänderungen, Releases oder Änderungen an js/ und tokens.css
---

<!-- Erzeugt aus CairnOS. Nicht von Hand ändern: Änderungen in CairnOS machen, sie kommen per Pull Request hierher. -->

# Versions-Bump immer mit Git-Tag und neu erzeugten Tokens

_Jeder Bump der Version in pyproject.toml braucht einen gepushten Tag v<version>; tokens.css muss bei Änderung aus design.py neu erzeugt werden._

`pyproject.toml` → `version` ist die Quelle der Wahrheit (Semver). **Bei jedem Versions-Bump gehört ein Git-Tag
`v<version>` dazu**, gesetzt und gepusht nach dem Merge auf `main`:

```bash
git tag -a v<version> -m "meryverse-core <version>" && git push origin v<version>
```

Grund: Die Website holt die Frontend-Assets (`js/`) **per Tag-Checkout** (`js/` liegt nicht im pip-Paket) und pinnt das
pip-Paket auf denselben Tag. Ohne Tag erreicht eine Änderung die Website nicht. Wird `js/tokens.css` angefasst, muss sie
aus `design.py` neu erzeugt werden (`python -m meryverse_core.design > js/tokens.css`; `tests/test_tokens.py` prüft das).
