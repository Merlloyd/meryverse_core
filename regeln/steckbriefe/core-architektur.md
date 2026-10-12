---
kennung: core-architektur
version: 1
art: steckbrief
geltung: dieses Projekt
agenten: code
wann: bei Änderungen an Paketstruktur oder Auslieferung
---

<!-- Erzeugt aus CairnOS. Nicht von Hand ändern: Änderungen in CairnOS machen, sie kommen per Pull Request hierher. -->

# meryverse_core: Architektur und Konsum

_Das pip-Paket wird von Apps per Tag-Pin konsumiert; Tag-Bumps rollen Apps nicht automatisch nach, js/ und templates/ werden über assets.py gelesen._

Das pip-Paket (`pip-name: meryverse-core`, Import-Name `meryverse_core`) wird von den Apps konsumiert — editable für Development, Git-Tag-gepinnt für Produktion. Tag-Bumps rollen die Apps **nicht** automatisch nach; jede App entscheidet eigenständig per Version-Pin in ihrer `requirements.txt`. Konsumtiefe variiert pro App: manche nutzen nur Design-Tokens, andere den vollen Builder-Stack mit geteilten Lock-Screen, Crypto-JS und Export-Utilities.

```
Apps  →  pip install meryverse-core  →  design / html_builder / assets / crypto
                                            │
                                            ▼
                                  js/* + templates/* (gelesen via assets.py)
```
