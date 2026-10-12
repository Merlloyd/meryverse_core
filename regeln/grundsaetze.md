<!-- Erzeugt aus CairnOS. Nicht von Hand ändern: Änderungen in CairnOS machen, sie kommen per Pull Request hierher. -->

# Grundsätze

## Commit nur nach Bestätigung, Push nur auf Wunsch

_Commit-Message und Dateien zeigen, erst nach Bestätigung committieren, nie Secrets oder .env einbeziehen; pushen nur auf ausdrücklichen Wunsch._

Nur falls der Workspace ein Git-Repo ist (`git rev-parse --is-inside-work-tree`):

1. `git status` — Was hat sich geändert?
2. Zeige dem User die geplante Commit-Message und die zu stagenden Dateien.
3. **Erst nach Bestätigung** committen. Niemals Secrets oder `.env` einbeziehen.
4. **Push nur, wenn der User es ausdrücklich wünscht.**

Falls kein Git-Repo: Schritt überspringen und in der Zusammenfassung vermerken.

## Öffentliches Repo: nichts Internes einchecken

_Das Repo ist öffentlich: keine IPs, Zugangsdaten, Kunden-/Personendaten, privaten Konventionen oder Memories; vor jedem Commit gestagte Änderungen prüfen._

`meryverse_core` ist auf GitHub öffentlich. Hier darf **nichts Internes** landen:

- keine Server-IPs oder Hostnamen außer öffentlichen Domains, keine Zugangsdaten, Tokens oder Schlüssel
- keine Kunden-Kennungen (Register-IDs), keine Kundennamen, keine echten Nutzerdaten
- keine Personen- oder Arbeitgeberangaben, keine privaten Konventionen oder Betriebsdetails
- keine Memories / Erinnerungs-Dateien

Vor jedem Commit kurz prüfen, was gestaged ist (`git status`, `git diff --staged`) — ein einmal veröffentlichter Stand
lässt sich nicht zurückholen.

## Doku Deutsch, Code und Kommentare Englisch

_Repo-spezifisch gilt: Dokumentation auf Deutsch, Code und Code-Kommentare auf Englisch._

Arbeitsweise, Branch-/Test-/Deploy-Konvention und Umgang mit Geheimnissen gelten aus **CairnOS** (globale Regeln) und
stehen deshalb nicht in diesem Repo. Repo-spezifisch gilt: Doku Deutsch, Code und Kommentare Englisch.

