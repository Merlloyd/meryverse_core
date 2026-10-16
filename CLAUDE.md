<!-- Erzeugt aus CairnOS. Nicht von Hand ändern: Änderungen in CairnOS machen, sie kommen per Pull Request hierher. -->

# Regeln: Meryverse Core

## Grundsätze (gelten immer)

### Commit nur nach Bestätigung, Push nur auf Wunsch

Nur falls der Workspace ein Git-Repo ist (`git rev-parse --is-inside-work-tree`):

1. `git status` — Was hat sich geändert?
2. Zeige dem User die geplante Commit-Message und die zu stagenden Dateien.
3. **Erst nach Bestätigung** committen. Niemals Secrets oder `.env` einbeziehen.
4. **Push nur, wenn der User es ausdrücklich wünscht.**

Falls kein Git-Repo: Schritt überspringen und in der Zusammenfassung vermerken.

### Öffentliches Repo: nichts Internes einchecken

`meryverse_core` ist auf GitHub öffentlich. Hier darf **nichts Internes** landen:

- keine Server-IPs oder Hostnamen außer öffentlichen Domains, keine Zugangsdaten, Tokens oder Schlüssel
- keine Kunden-Kennungen (Register-IDs), keine Kundennamen, keine echten Nutzerdaten
- keine Personen- oder Arbeitgeberangaben, keine privaten Konventionen oder Betriebsdetails
- keine Memories / Erinnerungs-Dateien

Vor jedem Commit kurz prüfen, was gestaged ist (`git status`, `git diff --staged`) — ein einmal veröffentlichter Stand
lässt sich nicht zurückholen.

### Doku Deutsch, Code und Kommentare Englisch

Arbeitsweise, Branch-/Test-/Deploy-Konvention und Umgang mit Geheimnissen gelten aus **CairnOS** (globale Regeln) und
stehen deshalb nicht in diesem Repo. Repo-spezifisch gilt: Doku Deutsch, Code und Kommentare Englisch.


## Verzeichnis

Lies eine Regel, wenn „Wann“ auf deine Aufgabe passt.

| Art | Titel | Wann | Datei |
|---|---|---|---|
| Steckbrief | meryverse_core: Architektur und Konsum | bei Änderungen an Paketstruktur oder Auslieferung | [regeln/steckbriefe/core-architektur.md](regeln/steckbriefe/core-architektur.md) |
| Steckbrief | meryverse_core: offene Baustellen | bei Planung neuer Arbeiten | [regeln/steckbriefe/core-baustellen.md](regeln/steckbriefe/core-baustellen.md) |
| Steckbrief | meryverse_core: Konsumenten und Abhängigkeiten | bei Änderungen, die Apps betreffen könnten | [regeln/steckbriefe/core-konsumenten.md](regeln/steckbriefe/core-konsumenten.md) |
| Steckbrief | meryverse_core: wichtige Dateien und Komponenten | bei Arbeiten an Python-Modulen oder am Frontend-Kit | [regeln/steckbriefe/core-wichtige-dateien.md](regeln/steckbriefe/core-wichtige-dateien.md) |
| Steckbrief | meryverse_core: Zweck | zur Orientierung im Projekt | [regeln/steckbriefe/core-zweck.md](regeln/steckbriefe/core-zweck.md) |
| Regel | Hilfsdateien nur unter .cairnos/tmp/ | bei jeder Aufgabe, die Code ändert, Tests, Builds oder Installationen ausführt | [regeln/global/hilfsdateien-nur-unter-cairnos-tmp.md](regeln/global/hilfsdateien-nur-unter-cairnos-tmp.md) |
| Regel | Tests mit pytest ausführen | nach Code-Änderungen | [regeln/regeln/tests-mit-pytest.md](regeln/regeln/tests-mit-pytest.md) |
| Regel | Versions-Bump immer mit Git-Tag und neu erzeugten Tokens | bei Versionsänderungen, Releases oder Änderungen an js/ und tokens.css | [regeln/regeln/version-bump-mit-git-tag.md](regeln/regeln/version-bump-mit-git-tag.md) |
