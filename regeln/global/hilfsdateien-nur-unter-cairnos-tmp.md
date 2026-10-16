---
kennung: hilfsdateien-nur-unter-cairnos-tmp
version: 2
art: regel
geltung: alle Projekte
agenten: gimli, aragorn
wann: bei jeder Aufgabe, die Code ändert, Tests, Builds oder Installationen ausführt
---

<!-- Erzeugt aus CairnOS. Nicht von Hand ändern: Änderungen in CairnOS machen, sie kommen per Pull Request hierher. -->

# Hilfsdateien nur unter .cairnos/tmp/

_Hilfsdateien nur unter .cairnos/tmp/_

Caches, Hilfsdateien und Testausgaben, die du selbst anlegst (npm-Cache, jsdom, Coverage, Berichte, zusätzliche venvs), gehören nach .cairnos/tmp/, nie anderswo ins Repo. Die .venv aus der Installation bleibt, wo sie ist. Legt ein Werkzeug seinen Cache von selbst im Repo an (__pycache__, .pytest_cache u. a.) und steht der nicht in der .gitignore, lenke ihn um (z. B. npm_config_cache=.cairnos/tmp/npm, PYTHONPYCACHEPREFIX=.cairnos/tmp/pycache, pytest -o cache_dir=.cairnos/tmp/pytest) oder schlag den .gitignore-Eintrag in deiner Antwort vor.
