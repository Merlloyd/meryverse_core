# Plan aktualisieren

Erweitere oder ändere einen bestehenden Plan iterativ — mit Versionierung und Änderungslog. Gedacht für **mittlere und große Pläne**, an denen über mehrere Sessions hinweg gearbeitet wird.

## Variablen

**plan_pfad**: $ARGUMENTS (optional — z. B. `plans/2026-05-14-shutdown-anpassung.md`)

---

## Anweisungen

Folge den Phasen in dieser Reihenfolge: **Auswahl → Status-Check → Änderungen sammeln → Plan aktualisieren → Bericht**.

Trivial-Pläne sind absichtlich ausgeschlossen — bei der Größe ist freihändiges Editieren oder ein neuer Plan günstiger.

---

## Phase 0: Plan auswählen

1. **Falls `$ARGUMENTS` gesetzt ist**:
   - Prüfe, ob die Datei existiert. Wenn nicht: Auswahlliste zeigen (siehe unten).
   - Wenn die Datei eine Trivial-Skalierung hat (keine `Auftrag`-Liste, keine Validierungs-Checkliste): hinweisen, dass `/update-plan` hier Overkill ist — schlage stattdessen direktes Editieren oder `/create-plan` vor.

2. **Falls `$ARGUMENTS` leer ist**:
   - Scanne `plans/` nach allen Plänen, deren Status **nicht** `Implementiert` oder `Verworfen` ist.
   - Zeige eine nummerierte Liste mit Pfad, Titel, Status und aktueller Version:
     ```
     Änderbare Pläne:
       1. plans/2026-05-14-shutdown-anpassung.md — "Shutdown-Command modernisieren" — [Bereit, v1.0]
       2. plans/2026-05-10-onboarding-flow.md    — "Onboarding-Flow überarbeiten"     — [In Umsetzung, v2.1]
       …
     ```
   - Frag: **„Welchen Plan aktualisieren? (Nummer)"**
   - Falls keiner existiert: dem User mitteilen und Vorschlag machen (`/create-plan` für neuen Plan).

---

## Phase 1: Status-Check & Vorgehen

Bestimme aufgrund des Plan-Status, wie weitergegangen wird:

- **`Entwurf`** — Freies Editieren erlaubt. Version bumpt mit (siehe Versionsregeln unten).
- **`Bereit`** — Update kippt den Status zurück auf `Entwurf` (Re-Approval nötig). **Ausnahme**: rein kosmetische Änderungen (Tippfehler, Formulierungen) — dann darf `Bereit` bleiben. Frag den User im Zweifel.
- **`In Umsetzung`** — Vorsicht: bereits umgesetzte Schritte/Auftragspunkte dürfen **nicht** geändert werden, nur unerledigte Teile. Beim Lesen die `Auftragsdeckung` und `Implementierungsnotizen` beachten, falls vorhanden.
- **`Blockiert`** — Update darf den Blocker adressieren. Wenn die neuen Änderungen den Blocker auflösen: Status zurück auf `Bereit` setzen und in den Notizen vermerken.
- **`Implementiert`** — Blockiert. Schlage einen Folge-Plan via `/create-plan` vor.
- **`Verworfen`** — Blockiert. Schlage einen Folge-Plan via `/create-plan` vor.

Bei blockierenden Stati: stoppe hier, gib dem User die Empfehlung und beende den Command.

---

## Phase 2: Änderungen sammeln

Analog zu `/create-plan`: iterativ alle Änderungswünsche aufnehmen, bevor Dateien angefasst werden.

### Ablauf

1. **Starten:** Frag den User: „Welche Änderung möchtest du am Plan vornehmen?" Nimm die Antwort als Änderung #A1 auf (Präfix `A` zur Unterscheidung von Auftragsnummern).

2. **Iterativ erweitern:** „Änderung #A`N` aufgenommen. Weitere Änderungen? (Sag **fertig**, wenn alles erfasst ist.)"

3. **Bei Bedarf klären:** Vage Änderungen direkt mit 1–2 Rückfragen schärfen, bevor die nächste folgt.

4. **Kategorisieren:** Bei jeder Änderung im Kopf zuordnen — ergänzt sie einen Auftragspunkt, ändert sie einen Schritt, korrigiert sie nur Text? Das bestimmt später, was im Plan angefasst wird.

5. **Abschluss:** Sobald „fertig":
   - Zeig die gesammelten Änderungen als nummerierte Liste.
   - Frag: „Soll ich diese Änderungen einarbeiten?"

---

## Phase 3: Plan aktualisieren

### Versionsregeln (Semantik)

- **Major-Bump (`1.0 → 2.0`)**: Auftragspunkte gestrichen oder grundlegend umgedeutet, Plan-Richtung ändert sich.
- **Minor-Bump (`1.0 → 1.1`)**: Neue Auftragspunkte oder neue Schritte hinzugefügt, bestehende substanziell geändert.
- **Patch-Bump (`1.0 → 1.0.1`)**: Nur Tippfehler, Formulierungen, Klarstellungen — keine inhaltliche Änderung.

Bei Unsicherheit: lieber den größeren Bump.

### Was im Plan angefasst wird

- **Frontmatter**: `Version:` auf neuen Wert. Bei Status-Wechsel (z. B. `Bereit → Entwurf`) auch `Status:` aktualisieren. `Anforderungen:` an neue Gesamtzahl anpassen.
- **Auftrag**: Neue Punkte additiv anhängen mit der nächsten freien Nummer (#4, #5, …). **Bestehende Nummern bleiben stabil** — Reihenfolge nicht ändern. Wenn ein bestehender Auftrag gestrichen wird: durchstreichen mit `~~#3 …~~` und Hinweis „(entfernt in v`X.Y`)", nicht löschen.
- **Schritte**: Vorhandene Schritte können geändert oder ergänzt werden. Bei `In Umsetzung`-Plänen: bereits abgehakte Schritte bleiben unverändert. Neue Auftragsnummern in den Suffixen `*(Auftrag: #…)*` ergänzen.
- **Validierung & Erfolgskriterien**: neue Checks ergänzen, falls die neuen Wünsche es erfordern.
- **Änderungslog**: chronologisch neuen Eintrag oben (oder unten konsistent) anhängen — siehe Format unten.

### Änderungslog-Format

Falls der Plan noch keinen Abschnitt **Änderungslog** hat, lege ihn direkt nach `Auftrag` an (vor `Überblick`). Format:

```markdown
## Änderungslog

### v1.1 — <YYYY-MM-DD>
- #A1: <Beschreibung der Änderung> → neue Auftragsnummern: #4, #5
- #A2: <Beschreibung> → Schritt 3 ergänzt
- #A3: <Beschreibung> → Tippfehler in Überblick

### v1.0 — <Ursprungs-Datum>
- Initiale Version
```

Bei der allerersten Aktualisierung eines Plans: ergänze rückwirkend den `v1.0`-Eintrag mit dem Erstellungsdatum.

---

## Phase 4: Bericht

Liefere am Ende:

1. **Was geändert wurde** — kurze Aufzählung mit `#A`-Referenzen.
2. **Neue Version** — z. B. `v1.0 → v1.1`.
3. **Status-Wechsel** — falls eingetreten (z. B. `Bereit → Entwurf` zur Re-Approval).
4. **Neue Auftragspunkte** — Liste der hinzugefügten Nummern, falls vorhanden.
5. **Nächster Schritt** — Vorschlag, was als nächstes zu tun ist:
   - Bei `Entwurf` nach Re-Approval: „Soll ich auf `Bereit` setzen?"
   - Bei `Bereit`: „Soll ich `/implement` starten?"
   - Bei `In Umsetzung`: „Ich setze die Umsetzung mit den neuen Punkten fort, sobald du grünes Licht gibst."

---

## Qualitätsstandards

- **Stabilität bestehender Nummern**: Auftragsnummern werden nie umnummeriert — sonst brechen Implementierungsnotizen und Schritt-Referenzen.
- **Nachvollziehbarkeit**: Jede Änderung steht im Änderungslog mit `#A`-Referenz und Datum.
- **Status-Treue**: Status spiegelt nach dem Update den realen Zustand wider (Re-Approval nötig vs. weiterhin freigegeben).
- **Skalierung**: Trivial-Pläne werden umgeleitet, nicht durch diesen Command versorgt.
