# Havarie — meryverse_core: Git → Produktion live

> Idiotensichere Schritt-für-Schritt-Anleitung, wie eine Änderung an
> `meryverse_core` bis zum sichtbaren Ergebnis in Produktion kommt.
>
> **Wichtig vorweg:** `meryverse_core` deployt sich **nicht selbst**. Es ist
> eine geteilte Library und wird von den Apps konsumiert — auf **zwei
> getrennten Wegen**. Welcher Weg gilt, hängt davon ab, **was** du geändert
> hast:
>
> | Geändert | Liefer-Weg | Abschnitt |
> | --- | --- | --- |
> | Python-Module (`design.py`, `assets.py`, `html_builder.py`, `crypto.py`) | pip-Pin in der App (`requirements.txt`) | **Weg A** |
> | Frontend-Assets (`js/*.js`, `js/*.css`) | **vendored** ins Backend kopiert (`scripts/sync-core-assets.sh`) | **Weg B** |
>
> Im Zweifel (du hast beides angefasst): **beide** Wege durchgehen.

---

## 0. Immer zuerst: Version bumpen (an ZWEI Stellen!)

Jede inhaltliche Änderung an core braucht einen Versions-Bump — und die
Version steht an **zwei** Orten, die übereinstimmen müssen:

```bash
cd ~/IdeaProjects/Meryverse/meryverse_core

# 1) pyproject.toml
grep '^version' pyproject.toml              # z. B. version = "0.3.1"
# 2) meryverse_core/__init__.py
grep '__version__' meryverse_core/__init__.py   # MUSS denselben Wert haben
```

Beide auf die neue Nummer setzen (Semver: Patch für Fixes/Styling, Minor für
neue Features, Major nur bei Breaking Changes der API).

```bash
git add pyproject.toml meryverse_core/__init__.py <deine-geänderten-dateien>
git commit -m "vX.Y.Z — kurze Beschreibung"
git push origin main

# Git-Tag setzen (die Apps pinnen auf Tags, nicht auf main!)
git tag -a vX.Y.Z -m "vX.Y.Z — kurze Beschreibung"
git push origin vX.Y.Z
```

**Schief gegangen?**
- `git push` „rejected (non-fast-forward)" → jemand war schneller. `git pull --rebase`, dann erneut pushen. **Kein** `git push --force`.
- Tag schon vergeben → du hast die Nummer schon benutzt. Nächste Nummer wählen (Tags nicht überschreiben).
- pyproject und `__init__.py` driften auseinander → genau der Bug, der dieses Kapitel gibt. Immer beide prüfen.

---

## Weg A — Python-Modul-Änderung (design / assets / html_builder / crypto)

Die Apps ziehen core als pip-Paket über einen **Git-Tag-Pin** in ihrer
`requirements.txt`. Eine neue core-Version wird erst wirksam, wenn die App
ihren Pin nachzieht und neu gebaut/deployt wird.

```bash
# Pin in der/den konsumierenden App(s) hochziehen:
#   meryverse-website/apps/requirements.txt
#   chor-app/requirements.txt        (falls die App core als Paket nutzt)
# Zeile:  meryverse-core @ git+https://github.com/Merlloyd/meryverse_core.git@vX.Y.Z
#                                                                            ^^^^^^ neuer Tag
```

1. Den Tag-Pin in der App auf `@vX.Y.Z` ändern, committen, pushen.
2. Die App deployen — **dabei wird das Pip-Paket frisch gezogen**:
   - **meryverse-website:** `ssh martin@<SERVER-IP>` → `cd /home/martin/meryverse-website && ./deploy.sh` (baut das Docker-Image neu → `pip install` zieht den neuen Tag).
   - **chor-app:** im Admin-Bereich **Pull** für die App (der Generator-Pull installiert core nach Bedarf).

> Wer den Pin **nicht** nachzieht, bleibt bewusst auf der alten core-Version —
> das ist gewollt (keine stillen Upgrades). Heißt aber auch: eine reine
> core-Änderung ist erst „live", wenn mindestens eine App ihren Pin bumpt.

---

## Weg B — Frontend-Asset-Änderung (`js/feedback.{js,css}` o. ä.)

Die JS/CSS-Assets werden **nicht** über den pip-Pin ausgeliefert, sondern als
**vendored Kopie** im Backend gehostet (`meryverse-website/apps/static/core/`)
und unter `/core/<datei>` serviert. Die konsumierenden Seiten (Hilfe-Seiten,
Chor-App) referenzieren diese Datei per `<script src>`/`<link>` — **kein
Inlinen, kein pip-Pin nötig**.

```bash
# 1) Quelle ist meryverse_core/js/<datei>. Vendored Kopie aktualisieren:
cd ~/IdeaProjects/Meryverse
scripts/sync-core-assets.sh
#   → kopiert js/feedback.{js,css} nach meryverse-website/apps/static/core/

# 2) Im Backend-Repo die aktualisierte Kopie committen:
cd meryverse-website
git add apps/static/core/feedback.js apps/static/core/feedback.css
# VERSION in apps/app.py hochzählen (Footer-Konvention), z. B. 2.94 → 2.95
git add apps/app.py
git commit -m "style(feedback): vendored core-Assets nachgezogen (V2.xx)"
git push origin main
```

3. **Backend deployen:** `ssh martin@<SERVER-IP>` → `cd /home/martin/meryverse-website && ./deploy.sh`.
4. **Browser hart neu laden** (⌘⇧R). Die Assets haben `Cache-Control: max-age=3600` — ohne Hard-Reload siehst du bis zu 1 h die alte Version. In der Chor-App ggf. wegen Service-Worker **zweimal** neu laden.

> **Merksatz:** Vergisst du `scripts/sync-core-assets.sh`, ändert sich in
> Produktion **nichts** — die Quelle in `meryverse_core/js/` wird nie direkt
> ausgeliefert, nur die Kopie unter `apps/static/core/`.

---

## 3. Schnell-Checkliste

- [ ] Version in **pyproject.toml** UND **meryverse_core/__init__.py** gleich & erhöht
- [ ] commit + push + **Git-Tag** `vX.Y.Z` gepusht
- [ ] **Weg A** (Python): App-`requirements.txt`-Pin auf neuen Tag → App deployen
- [ ] **Weg B** (Assets): `scripts/sync-core-assets.sh` → website committen → `./deploy.sh` → Hard-Reload
- [ ] In Produktion verifiziert (Footer-Version / sichtbares Ergebnis)

---

## 4. „Es ändert sich nichts" — die üblichen Ursachen

1. **Asset geändert, aber Sync vergessen** → `scripts/sync-core-assets.sh` laufen lassen, website neu deployen (Weg B).
2. **Sync gemacht, aber Backend nicht deployt** → `./deploy.sh` auf dem Server.
3. **Deployt, aber Browser-Cache** → Hard-Reload (Service-Worker in der Chor-App: zweimal).
4. **Python-Modul geändert, aber App-Pin nicht hochgezogen** → `requirements.txt` der App auf neuen Tag, App neu bauen (Weg A).
5. **pyproject gebumpt, `__init__.py` vergessen** (oder umgekehrt) → beide angleichen, neu taggen.
