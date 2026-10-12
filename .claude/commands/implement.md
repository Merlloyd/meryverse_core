# Implementieren

Führe einen mit `/create-plan` erstellten Plan aus. Lies ihn, setze jeden Schritt der Reihe nach um, dokumentiere Auftragsdeckung und Abweichungen.

## Variablen

**plan_pfad**: $ARGUMENTS (optional — z. B. `plans/2026-05-14-shutdown-anpassung.md`)

---

## Phase 0: Plan auswählen

1. **Falls `$ARGUMENTS` gesetzt ist**:
   - Prüfe, ob die Datei existiert. Wenn nicht: zeige die verfügbaren Pläne (siehe unten) und frag, welcher gemeint war.
   - Wenn die Datei existiert: weiter zu Phase 1 mit diesem Plan.

2. **Falls `$ARGUMENTS` leer ist**:
   - Scanne `plans/` nach allen Dateien mit Status `Bereit`.
   - Zeige eine nummerierte Liste:
     ```
     Bereite Pläne:
       1. plans/2026-05-14-shutdown-anpassung.md — "Shutdown-Command modernisieren"
       2. plans/2026-05-12-readme-erstellen.md   — "README für Workspace anlegen"
       …
     ```
   - Frag den User: **„Welchen Plan ausführen? Nummer wählen, mehrere kommagetrennt, oder `alle` für alle bereiten Pläne in obiger Reihenfolge."**
   - Falls keine bereiten Pläne existieren: zusätzlich Pläne im Status `Entwurf`, `In Umsetzung` oder `Blockiert` anzeigen und entsprechend hinweisen — keine Auswahl ohne User-Bestätigung.

3. **Bei Auswahl mehrerer Pläne / „alle"**:
   - Arbeite sie nacheinander ab (Phase 1–4 pro Plan).
   - Liefere am Ende einen Gesamtbericht plus pro-Plan-Berichte.
   - Stoppe bei einem blockierten Plan und frag, ob die nächsten trotzdem laufen sollen.

---

## Phase 1: Plan verstehen

1. **Plan lesen.** Bei großen Plänen darfst du Abschnitte überfliegen, die nicht zur Umsetzung beitragen (z. B. „Notizen") — Auftrag, Schritte, Validierung und Erfolgskriterien immer vollständig lesen.

2. **Status prüfen** und entsprechend reagieren (siehe Status-Verhalten unten).

3. **Auftrag erfassen.** Die nummerierte Liste im Abschnitt **Auftrag** ist die Erfolgsmessung — merk sie dir, hak sie später Schritt für Schritt ab.

4. **Voraussetzungen klären.** Offene Fragen, fehlende Abhängigkeiten oder unklare Annahmen → stoppen und User fragen, nicht raten.

### Status-Verhalten

- **`Bereit`** — Direkt weiter zu Phase 2.
- **`Entwurf`** — Frag: „Plan ist noch Entwurf — auf `Bereit` heben und umsetzen?" Erst nach Bestätigung weiter.
- **`In Umsetzung`** — Resume-Fall: Frag, ob fortgesetzt oder neu gestartet werden soll.
- **`Blockiert`** — Dokumentierten Blocker-Grund zeigen und fragen, ob er gelöst ist.
- **`Implementiert`** — Warne: bereits umgesetzt. Nicht ohne ausdrückliche Bestätigung erneut ausführen.
- **`Verworfen`** — Warne: wurde verworfen. Nicht ohne ausdrückliche Bestätigung ausführen.

---

## Phase 2: Plan ausführen

1. **Status auf `In Umsetzung` setzen** (im Plan-Frontmatter), bevor du den ersten Schritt anfasst. Damit ist auch bei Abbruch klar, wo wir stehen.

2. **Schritte in genau der vorgegebenen Reihenfolge umsetzen:**
   - Jeden Schritt vollständig abschließen, bevor du zum nächsten gehst.
   - Bei „Datei erstellen": vollständige Datei schreiben, kein Stub.
   - Bei „Datei ändern": zuerst lesen, dann präzise editieren.
   - Notiere mental (oder via TaskCreate bei großen Plänen), welche Auftragsnummern der Schritt abgehakt hat.

3. **Probleme behandeln:**
   - Kleine Klarstellungen (Pfade, Wording): selbst entscheiden und in den Implementierungsnotizen festhalten.
   - Echte Mehrdeutigkeit oder neue Designfrage: User fragen.
   - **Echter Blocker** (Voraussetzung fehlt, externe Ressource nicht erreichbar): Status auf `Blockiert` setzen, Grund in den Implementierungsnotizen festhalten, dem User berichten — keine Heuristiken.

---

## Phase 3: Validieren

Skaliere die Tiefe an der Plan-Größe (trivial → knapper, groß → vollständig).

1. **Validierungs-Checkliste** aus dem Plan durchgehen, jeden Punkt abhaken oder als Fehlschlag markieren.
2. **Erfolgskriterien** überprüfen.
3. **Auftragsdeckung prüfen:** Ist *jede* Auftragsnummer durch mindestens einen umgesetzten Schritt adressiert? Lücken sind Fehler.
4. **Doku-Konsistenz:**
   - `CLAUDE.md` — bei strukturellen Änderungen aktualisieren.
   - `context/` — wenn sich Kontext-relevante Fakten geändert haben.
   - **Benutzer-Doku** (`README.md`, `docs/`, `HANDBUCH.md`, `HELP.md`, Changelog) — wenn sichtbares Verhalten oder Commands geändert wurden.
5. **Querverweise** prüfen: neue Dateien dort referenziert, wo sie sollten? Namenskonventionen eingehalten?

---

## Phase 4: Plan-Status aktualisieren

Aktualisiere die Plan-Datei am Ende:

1. Status auf `Implementiert` setzen (oder `Blockiert`, falls Phase 2 dort gelandet ist).
2. Abschnitt **Implementierungsnotizen** anhängen (oder ergänzen, falls bereits vorhanden):

```markdown
---

## Implementierungsnotizen

**Implementiert:** <YYYY-MM-DD>

### Auftragsdeckung
- #1: <Schritt X — Status>
- #2: <Schritt Y — Status>
- …

### Zusammenfassung
<2–4 Sätze, was getan wurde>

### Abweichungen vom Plan
<Liste, oder "Keine">

### Aufgetretene Probleme
<Liste mit Lösung, oder "Keine">
```

---

## Qualitätsstandards

- **Status-Treue:** Plan-Status spiegelt die Realität in jedem Moment wider.
- **Auftragsdeckung:** Jede Auftragsnummer ist nachvollziehbar adressiert.
- **Präzision:** Änderungen entsprechen dem Plan; bewusste Abweichungen werden dokumentiert.
- **Vollständigkeit:** Dateien werden vollständig geschrieben, nicht als Stubs.
- **Doku-Konsistenz:** CLAUDE.md *und* Benutzer-Doku werden mitgepflegt.

---

## Bericht

Skaliere die Tiefe an der Plan-Größe.

**Pro Plan** mindestens:

```
## Implementierung abgeschlossen — <Plan-Titel>

### Zusammenfassung
- <Was wurde erledigt — referenziere Auftragsnummern, z. B. „Auftrag #1 + #3 via Schritt 2 umgesetzt">

### Auftragsdeckung
- #1: ✅ <kurze Notiz>
- #2: ✅
- #3: ⚠️ teilweise — <Grund>

### Geänderte Dateien
**Erstellt:** …
**Geändert:** …
**Gelöscht:** …

### Validierung
- [x] …

### Abweichungen vom Plan
<Keine, oder Liste>

### Plan-Status
`plans/YYYY-MM-DD-{name}.md` → `Implementiert` (oder `Blockiert` mit Grund)
```

Bei **mehreren Plänen** (Phase 0 mit „alle" oder Mehrfachauswahl):
- Pro Plan einen Block wie oben.
- Am Ende einen kurzen **Gesamtbericht**: wie viele Pläne `Implementiert` / `Blockiert`, was als nächstes zu tun ist.