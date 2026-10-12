# Adopt

Übernimmt die Claude-Workspace-Struktur (Commands, Kontext-Vorlagen, Plan-Ordner, …) **in ein bestehendes Projekt** — interaktiv, ohne stilles Überschreiben.

Gedacht für den Fall: „Ich habe ein laufendes Projekt und möchte den Workspace-Workflow nachträglich einziehen."

## Variablen

**quelle**: $ARGUMENTS (optional — lokaler Pfad zum Workspace-Template oder GitHub-URL)

---

## Phase 0: Quelle bestimmen

Suche das Template in dieser Reihenfolge:

1. **`$ARGUMENTS` gesetzt** → diesen Pfad/URL verwenden.
2. **Lokaler Standardpfad** `~/IdeaProjects/claude-workspace-vorlage/` existiert → nutzen.
3. **Keine Quelle gefunden** → frag den User: „Wo liegt das Workspace-Template? Lokaler Pfad oder GitHub-URL?"

Bei GitHub-URL: in ein temporäres Verzeichnis klonen (`/tmp/claude-workspace-adopt-<timestamp>/`) und nach Abschluss wieder löschen.

Vor dem Weitermachen prüfen: enthält die Quelle eine `CLAUDE.md` und ein `.claude/commands/`-Verzeichnis? Wenn nicht, abbrechen — falsche Quelle.

---

## Phase 1: Bestehendes Projekt scannen

Erstelle eine Inventur ohne irgendetwas zu ändern. Prüfe im aktuellen Verzeichnis:

- `CLAUDE.md` — vorhanden? Falls ja: Größe, ungefähre Themen.
- `.claude/commands/` — vorhanden? Welche Commands existieren bereits?
- `context/` — vorhanden? Welche Dateien?
- `plans/`, `outputs/`, `reference/`, `scripts/` — vorhanden?
- `.gitignore` — vorhanden? Welche relevanten Einträge fehlen?
- `README.md` — vorhanden? (Wird nicht angefasst, nur erwähnt.)

---

## Phase 2: Übernahme-Plan zeigen

Präsentiere dem User eine kompakte Tabelle:

```
Übernahme-Plan:

  Ziel                          Status         Aktion
  ----                          ------         ------
  CLAUDE.md                     existiert  →   Workspace-Abschnitt anhängen
  .claude/commands/prime.md     fehlt      →   kopieren
  .claude/commands/create-plan  fehlt      →   kopieren
  .claude/commands/implement    existiert  →   FRAGEN (deins behalten / ersetzen / diffen)
  .claude/commands/update-plan  fehlt      →   kopieren
  .claude/commands/shutdown     fehlt      →   kopieren
  context/                      fehlt      →   mit Vorlagen kopieren
  plans/                        fehlt      →   mit .gitkeep anlegen
  outputs/                      fehlt      →   mit .gitkeep anlegen
  reference/                    fehlt      →   mit .gitkeep anlegen
  reference/zusammenarbeit.md   fehlt      →   kopieren (Zusammenarbeits-Prinzipien)
  scripts/                      fehlt      →   mit .gitkeep anlegen
  .gitignore                    existiert  →   fehlende Einträge anhängen
  README.md                     existiert  →   nicht anfassen
```

Liste auch explizit, was **nicht** übernommen wird (Template-`README.md`, `.idea/`, ggf. weitere).

---

## Phase 3: Bestätigung

Frag den User:

1. **Gesamt-Freigabe**: „Plan OK? (ja / einzeln anpassen / abbrechen)"
2. Falls „einzeln anpassen": für jede Konfliktzeile separat entscheiden lassen.

Bei Konflikten zu Datei-Kollisionen sind dies die Optionen:

- **skip** — vorhandene Datei behalten, nichts ändern
- **replace** — Template-Version komplett übernehmen
- **append** — Template-Inhalt ans Ende anhängen (mit Trennlinie + Quellenhinweis)
- **diff** — beide Inhalte zeigen, dann entscheiden

**Wichtig:** Niemals ohne explizite User-Entscheidung überschreiben.

---

## Phase 4: Übernahme ausführen

### Regeln

- **`.claude/commands/`** — fehlende Commands aus dem Template kopieren. Für vorhandene: Konfliktoption gemäß User-Entscheidung. **`adopt.md` selbst niemals überschreiben**, falls die Template-Quelle es enthält (Endlosschleife vermeiden).
- **`CLAUDE.md`** — wenn nicht vorhanden: kopieren. Wenn vorhanden: am Ende einen klar abgegrenzten Block anhängen:

  ```markdown
  ---

  # Claude Workspace-Struktur

  <Abschnitt „Arbeitsweise / Zusammenarbeit" aus der Template-CLAUDE.md>

  <Inhalt aus Template-CLAUDE.md ab Abschnitt „Workspace-Struktur" — ohne die Template-spezifische Einleitung>
  ```

  Der Abschnitt „Arbeitsweise / Zusammenarbeit" MUSS mitangehängt werden (er steht in der Template-CLAUDE.md **vor** „Workspace-Struktur" und würde sonst durch die reine „ab-Workspace-Struktur"-Regel verloren gehen). Der User merged später bei Bedarf manuell.

- **`context/`** — nur kopieren, wenn nicht vorhanden. Wenn vorhanden: skippen (der User hat dort eigene Inhalte) und im Bericht erwähnen.
- **`plans/`, `outputs/`, `scripts/`** — anlegen, falls nicht vorhanden, jeweils mit der `.gitkeep`-Datei aus dem Template.
- **`reference/`** — Ordner anlegen, falls nicht vorhanden. Zusätzlich die **vom Template mitgebrachten Referenz-Dokumente** übernehmen (aktuell `reference/zusammenarbeit.md` — projekt-neutrale Zusammenarbeits-Prinzipien): fehlt die Datei → kopieren; existiert sie bereits → Konfliktoption gemäß User-Entscheidung (skip / replace / append / diff). Rein projekt-spezifische Referenzdateien des Users bleiben unangetastet.
- **`.gitignore`** — wenn nicht vorhanden: kopieren. Wenn vorhanden: fehlende relevante Einträge anhängen (mind. `.DS_Store`, `.idea/`, `.vscode/`, ggf. `*.log`), aber keinen Eintrag entfernen oder verändern.
- **`README.md`** — niemals anfassen.

### Ausführung

Schritt für Schritt durchgehen, jedes Resultat im Kopf protokollieren (für den Bericht):

- ✅ kopiert
- ➕ angehängt
- ⏭ übersprungen (mit Grund)
- ⚠️ Konflikt manuell zu lösen

Bei Fehlern (Pfad nicht zugänglich, Schreibrechte fehlen): stoppen, dem User den Fehler nennen, fragen wie weiter.

---

## Phase 5: Bericht & nächste Schritte

Liefere am Ende:

1. **Was übernommen wurde** — gegliedert nach kopiert / angehängt / übersprungen / Konflikt.
2. **Was der User noch tun sollte:**
   - `context/`-Vorlagen ausfüllen (Verweis auf die ⚠️ VORLAGE-Banner)
   - Shell-Aliase einrichten, falls noch nicht geschehen (Verweis auf `README.md` im Template)
   - `/prime` in einer frischen Session starten, um Kontext zu laden
3. **Manuelle Merge-Hinweise** — wo der User selbst nacharbeiten muss (z. B. CLAUDE.md-Anhang in die bestehende Struktur integrieren).
4. **Cleanup** — bei GitHub-Klon-Quelle: temporäres Verzeichnis löschen.

---

## Qualitätsstandards

- **Kein stilles Überschreiben** — jede Kollision wird dem User vorgelegt.
- **Idempotent** — wiederholtes Ausführen ändert nichts mehr, was bereits stimmt.
- **Nachvollziehbar** — der Bericht erklärt jede Aktion mit ✅/➕/⏭/⚠️.
- **Reversibel im Geist** — Aktionen sollen so vorhersagbar sein, dass der User sie zur Not manuell rückgängig machen kann (es gibt kein Auto-Rollback).
