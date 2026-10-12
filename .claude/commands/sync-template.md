# Sync Template

Aktualisiert ein bereits **adoptiertes** Projekt auf den neuesten Stand des Workspace-Templates — Commands, CLAUDE.md, Verzeichnis-Beschreibungen, `.gitignore`-Ergänzungen. Erkennt Schema-Änderungen (z. B. alte 4-Datei-Context-Struktur) und bietet eine Migration an.

Unterschied zu `/adopt`: `/adopt` ist für die **erste** Einführung; `/sync-template` ist für **wiederkehrende Updates**, wenn sich das Template weiterentwickelt hat.

## Variablen

**quelle**: $ARGUMENTS (optional — lokaler Pfad zum Workspace-Template oder GitHub-URL)

---

## Phase 0: Template-Quelle bestimmen

Identisch zu `/adopt`:

1. `$ARGUMENTS` gesetzt → nutzen
2. Standardpfad `~/IdeaProjects/claude-workspace-vorlage/` existiert → nutzen
3. Sonst fragen (lokaler Pfad oder GitHub-URL → in `/tmp/` klonen, am Ende aufräumen)

Sanity-Check: Quelle muss `CLAUDE.md` und `.claude/commands/` enthalten.

---

## Phase 1: Diff erstellen

Vergleiche aktuelles Projekt mit Template. Erstelle eine interne Liste — nichts ändern.

### Was geprüft wird

**Commands (`.claude/commands/`):**
- Pro Template-Command: existiert lokal? Identisch? Abweichend? → Status `identisch` / `abweichend` / `fehlt`.
- Lokale Commands, die nicht im Template stehen → Status `lokal-only` (bleiben unangetastet).
- `sync-template.md` selbst: vergleichen, aber nur als Hinweis melden — niemals selbst überschreiben.

**`CLAUDE.md`:**
- Vergleich Template ↔ Projekt. Bei Abweichungen → Status `abweichend`.
- Sonderfall: Fehlt im Projekt der Abschnitt **„Arbeitsweise / Zusammenarbeit"** (bei früher adoptierten Projekten, die nur den „ab Workspace-Struktur"-Block bekommen haben), diesen Abschnitt separat als `fehlt` melden — er kann per `append` nachgezogen werden, ohne die ganze CLAUDE.md zu ersetzen.

**`context/`-Schema:**
- Wenn `context/workspace.md` existiert: Schema aktuell, kein Migrations-Bedarf.
- Wenn stattdessen `business-info.md` / `personal-info.md` / `strategy.md` / `current-data.md` existieren: **alte Struktur erkannt** → Schema-Migration anbieten.

**`plans/`, `outputs/`, `reference/`, `scripts/`:**
- Existiert der Ordner? Existiert die `.gitkeep` mit aktueller Beschreibung?

**Vom Template mitgebrachte Referenz-Dokumente (`reference/*.md`):**
- Aktuell `reference/zusammenarbeit.md` (projekt-neutrale Zusammenarbeits-Prinzipien). Pro Template-Referenzdatei: existiert lokal? Identisch? Abweichend? → Status `identisch` / `abweichend` / `fehlt`.
- Rein projekt-spezifische Referenzdateien des Users (die es im Template nicht gibt) → `lokal-only`, unangetastet lassen.

**`.gitignore`:**
- Welche Template-Einträge fehlen? (Keine Einträge entfernen, nur ergänzen.)

**Was NICHT geprüft wird:**
- `README.md` des Projekts (projekt-spezifisch)
- `context/workspace.md` Inhalt (User-Daten)
- `plans/*.md` Inhalt (User-Pläne)
- `outputs/`, `scripts/` Inhalt

---

## Phase 2: Diff-Plan zeigen

Präsentiere dem User eine Tabelle:

```
Sync-Plan:

  Ziel                            Status         Aktion-Vorschlag
  ----                            ------         -----------------
  .claude/commands/prime.md       identisch  →   nichts zu tun
  .claude/commands/adopt.md       abweichend →   FRAGEN (deins / Template / diffen)
  .claude/commands/sync-template  identisch  →   nichts zu tun
  .claude/commands/new-thing.md   fehlt      →   kopieren
  CLAUDE.md                       abweichend →   FRAGEN
  CLAUDE.md „Arbeitsweise"-Absatz fehlt      →   anhängen (append) anbieten
  reference/zusammenarbeit.md     abweichend →   FRAGEN (deins / Template / diffen)
  context/ (Schema)               ALT (4 Dateien) → Schema-Migration anbieten
  plans/.gitkeep                  veraltet   →   FRAGEN (Beschreibung ersetzen?)
  .gitignore                      ergänzbar  →   2 Einträge anhängen (.AppleDouble, *.tmp)
```

Klassifizierungen am rechten Rand:
- `identisch` → keine Aktion
- `abweichend` → fragen
- `fehlt` → vorschlagen zu kopieren
- `lokal-only` → unberührt lassen, nur erwähnen
- `Schema-Migration` → speziellen Migrations-Block triggern (Phase 4 unten)

Idempotenz: Wenn die Tabelle leer ist (alles identisch), melden „Projekt ist bereits auf Template-Stand. Nichts zu tun." und beenden.

---

## Phase 3: Bestätigung

1. **Gesamt-Freigabe** anfragen: „Plan OK? (ja / einzeln entscheiden / abbrechen)"
2. Bei „einzeln entscheiden": pro Konfliktzeile separat. Konfliktoptionen:
   - **skip** — lokale Version behalten
   - **replace** — Template-Version übernehmen
   - **diff** — beide Inhalte zeigen, dann entscheiden
   - **append** (nur bei `.gitignore` und ähnlichen Listen-Dateien) — fehlende Einträge anhängen

Schema-Migration wird separat abgefragt (siehe Phase 4).

---

## Phase 4: Ausführung

### Reguläre Updates

Pro Diff-Position gemäß User-Entscheidung handeln. Regeln:

- **`.claude/commands/`** — fehlende Commands kopieren, abweichende nur nach User-OK. `sync-template.md` selbst niemals überschreiben (Endlosschleife / aktuell laufender Command).
- **`CLAUDE.md`** — abweichende Version nur nach explizitem `replace`. Bei `skip` lokale Version behalten, im Bericht erwähnen, dass evtl. neue Strukturelemente fehlen. Fehlt nur der Abschnitt „Arbeitsweise / Zusammenarbeit": als `append` anbieten (nur diesen Abschnitt ans Ende hängen), statt die ganze Datei zu ersetzen.
- **Template-Referenz-Dokumente (`reference/zusammenarbeit.md`, …)** — fehlende kopieren; abweichende nur nach User-OK (`replace` / `diff`). Projekt-eigene Referenzdateien (`lokal-only`) nie anfassen.
- **`plans/.gitkeep`, `outputs/.gitkeep`, …** — bei Abweichung fragen, ob ersetzen. Ordner-Inhalt bleibt unangetastet.
- **`.gitignore`** — fehlende Einträge anhängen mit klarer Trenn-Kommentar-Zeile (`# --- sync-template <YYYY-MM-DD> ---`), nichts entfernen.

### Schema-Migration: alte 4-Datei-Context-Struktur → `workspace.md`

Wenn in Phase 1 als nötig erkannt:

1. **Mapping anzeigen** und vom User freigeben lassen:
   ```
   Schema-Migration vorgeschlagen:

     business-info.md   → Kapitel 1 (Projekt)
     personal-info.md   → Kapitel 3 (Meine Rolle & Hintergrund)
     strategy.md        → Kapitel 4 (Aktueller Fokus)
     current-data.md    → Kapitel 4 (Aktueller Fokus, „Offene Punkte" + Metriken-Bereich)
     Links/Refs (aus allen) → Kapitel 5 (Referenzen & Links)

   Die neue Datei context/workspace.md wird gemäß Template-Schema erstellt,
   die alten vier Dateien werden NICHT automatisch gelöscht — nur nach deiner Freigabe.
   ```

2. **Inhalte mappen**: alte vier Dateien lesen, sinnvoll in die neuen Kapitel verteilen. Bei Konflikten/Ambiguität: lieber **beides** ins Zielkapitel übernehmen und im Bericht eine Bereinigungs-Empfehlung geben, als zu raten.

3. **Ergebnis zeigen**: vollständigen Entwurf von `context/workspace.md` präsentieren.

4. **Freigabe + Aufräumen**: nach User-OK die Datei schreiben und fragen: „Alte Dateien löschen?" (Default: ja, aber nur mit Bestätigung.)

5. **Nicht-zuordenbare Inhalte**: falls Material existiert, das in keines der Kapitel passt → im Bericht namentlich auflisten („`current-data.md` enthielt Datenquellen-Liste, die ich nicht eindeutig zuordnen konnte — bitte manuell prüfen").

Zukünftige Schema-Migrationen (falls das Template sich weiter ändert) folgen demselben Muster: Erkennung → Mapping-Vorschlag → Freigabe → Mapping → Aufräumen.

---

## Phase 5: Bericht & nächste Schritte

1. **Was aktualisiert wurde** — ✅ / ➕ / ⏭ / ⚠️ pro Position.
2. **Schema-Migration** — Status (durchgeführt / abgelehnt / nicht nötig) und ggf. manuelle Nacharbeit.
3. **Lokale Eigenheiten** — Commands oder Konfigurationen, die nicht im Template stehen und unangetastet blieben.
4. **Nächste Schritte:**
   - Sichtkontrolle der gemergten `CLAUDE.md`, falls geändert
   - Bei Schema-Migration: `context/workspace.md` durchlesen und Lücken schließen
   - `/prime` in frischer Session, um die neue Struktur zu laden
5. **Cleanup** — bei GitHub-Klon-Quelle: temporäres Verzeichnis löschen.

---

## Qualitätsstandards

- **Idempotent** — wiederholtes Ausführen ohne Template-Änderungen tut nichts.
- **Kein stilles Überschreiben** — jede inhaltliche Änderung wird vorher gezeigt und freigegeben.
- **Lokale Anpassungen bleiben** — Commands oder Sektionen, die der User selbst hinzugefügt hat, werden nicht entfernt.
- **Migrationsdaten gehen nicht verloren** — Schema-Migration löscht alte Dateien erst nach expliziter Freigabe.
- **Nachvollziehbar** — Bericht erklärt jede Aktion mit Symbol und kurzer Begründung.
