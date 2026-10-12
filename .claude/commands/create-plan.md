# Plan

Erstelle einen Implementierungsplan für Änderungen an diesem Workspace. Pläne erfassen Kontext, Begründung und schrittweise Aufgaben — damit `/implement` sie später ohne Rückfragen umsetzen kann (oder der User sie zunächst nur diskutiert).

## Variablen

**erste_anforderung**: $ARGUMENTS

`$ARGUMENTS` ist optional — falls leer, frag in Phase 1 nach der ersten Anforderung.

---

## Anweisungen

- **WICHTIG:** Du erstellst einen PLAN, keine Implementierung.
- Folge den Phasen unten in dieser Reihenfolge: **Klärung → Recherche → Plan**.
- Skaliere die Tiefe an der Tragweite (siehe „Skalierung" unten). Nicht jeder Plan braucht jeden Abschnitt.
- Folge bestehenden Patterns. Studiere ähnliche Dateien im Workspace, bevor du neue Strukturen vorschlägst.

---

## Phase 1: Anforderungen sammeln

Sammle **alle** Änderungswünsche des Users iterativ, bevor du recherchierst oder schreibst.

### Ablauf

1. **Starten:**
   - Wenn `$ARGUMENTS` befüllt ist: nimm das als Anforderung #1 auf und zeig dem User: „Anforderung #1: `<Text>`. Was möchtest du noch?"
   - Wenn `$ARGUMENTS` leer ist: frag: „Was ist deine erste Anforderung?"

2. **Iterativ erweitern:** Frag nach jeder Anforderung erneut: „Anforderung #N aufgenommen. Weitere Wünsche? (Sag **fertig**, wenn alles erfasst ist.)"

3. **Bei Bedarf klären:** Wenn eine Anforderung zu vage ist, um sie umzusetzen, stelle 1–2 gezielte Rückfragen — direkt, bevor du nach der nächsten fragst.

4. **Abschluss:** Sobald der User „fertig" sagt:
   - Zeig die vollständige nummerierte Liste zur Bestätigung.
   - Frag: „Soll ich auf dieser Basis den Plan erstellen, oder fehlt noch etwas?"

**Wichtig:** Keine Plan-Datei vor dem „fertig" und der Bestätigung anlegen. Die Liste der nummerierten Anforderungen wird später wörtlich als **Auftrag** im Plan auftauchen — formuliere sie also klar und behalte die Reihenfolge bei.

---

## Phase 2: Recherche

Untersuche den Workspace gezielt — überspringe Schritte, die in dieser Session bereits durch `/prime` abgedeckt wurden.

1. **Kontext sichern** (falls nicht schon geladen): `CLAUDE.md`, relevante Dateien in `context/`.
2. **Bereich erkunden:**
   - Command-Erstellung → bestehende Commands in `.claude/commands/` lesen
   - Output-Änderung → `outputs/`-Struktur prüfen
   - Template-Update → `reference/` auf Patterns prüfen
   - Skript-Erstellung → `scripts/` auf Konventionen prüfen
3. **Zusammenhänge verstehen:**
   - Welche Dateien hängen vom geänderten Bereich ab?
   - Welche Namens- und Strukturkonventionen sind etabliert?
   - Wie greift die Änderung in bestehende Workflows ein?

Konzentriere dich auf konkrete Tradeoffs (Komplexität vs. Nutzen, Konsistenz vs. Flexibilität, Aufwand vs. Wirkung) — nicht auf abstraktes „Nachdenken".

---

## Phase 3: Plan schreiben

### Dateiname

`plans/YYYY-MM-DD-{kebab-name}.md`

- Heutiges Datum verwenden
- `{kebab-name}`: kurzer beschreibender Name in Kebab-Case
- **Kollision am gleichen Tag**: Suffix `-2`, `-3`, … anhängen (z. B. `2026-05-14-shutdown-anpassung-2.md`)

### Status-Werte

Verwende genau einen dieser Werte im Frontmatter-Feld `Status`:

| Status         | Bedeutung                                              |
| -------------- | ------------------------------------------------------ |
| `Entwurf`      | Plan ist in Arbeit, noch nicht abgestimmt              |
| `Bereit`       | Mit User abgestimmt, kann via `/implement` laufen      |
| `In Umsetzung` | Wird gerade implementiert                              |
| `Blockiert`    | Umsetzung gestoppt — Grund in den Implementierungsnotizen |
| `Implementiert` | Vollständig umgesetzt und verifiziert                 |
| `Verworfen`    | Wird nicht umgesetzt (Grund in den Notizen)            |

### Skalierung

Wähle die passende Tiefe — **mehr ist nicht besser**:

- **Trivial** (1 Datei, klar umrissen): Nur Kopf + *Überblick* + *Schritt-für-Schritt-Aufgaben*. Rest weglassen.
- **Mittel** (mehrere Dateien, klare Richtung): Kopf + *Überblick* + *Aktueller Zustand* + *Vorgeschlagene Änderungen* + *Schritte* + *Validierung*.
- **Groß** (struktureller Eingriff, offene Designfragen): Vollständiges Template inkl. *Design-Entscheidungen*, *Alternativen*, *Verbindungen & Abhängigkeiten*.

Tabellen sind optional — bei 1–2 Dateien reicht eine Aufzählung.

### Plan-Vorlage

```markdown
# Plan: <beschreibender Titel>

**Erstellt:** <YYYY-MM-DD>
**Version:** 1.0
**Status:** Entwurf
**Anforderungen:** <Anzahl, z. B. "3 Wünsche">

---

## Auftrag

Folgende Anforderungen wurden in Phase 1 erfasst — sie sind die Quelle dieses Plans:

1. <Anforderung #1 wörtlich oder leicht geglättet>
2. <Anforderung #2>
3. <Anforderung #3>

---

## Überblick

### Was dieser Plan erreicht
<2–3 Sätze zum Endergebnis. Verweise auf die abgedeckten Auftragsnummern, z. B. „adressiert #1–#3".>

### Warum das wichtig ist
<Verbindung zu Zielen/Mission — bei trivialen Plänen weglassen>

---

## Aktueller Zustand

### Relevante bestehende Struktur
<Dateien/Patterns, die mit der Änderung zusammenhängen>

### Lücken oder Probleme
<Was fehlt, ist defekt oder suboptimal>

---

## Vorgeschlagene Änderungen

### Zusammenfassung
<Bullet-Liste auf hoher Ebene>

### Neue Dateien
<Pfad + Zweck — Tabelle oder Liste, je nach Umfang>

### Zu ändernde Dateien
<Pfad + Beschreibung der Änderung>

### Zu löschende Dateien
<falls zutreffend, mit Begründung>

---

## Design-Entscheidungen *(nur bei größeren Plänen)*

### Schlüsselentscheidungen
1. **<Entscheidung>**: <Begründung>

### Betrachtete Alternativen
<Was wurde erwogen und warum verworfen?>

### Offene Fragen
<Falls Phase 1 nicht alles geklärt hat — sonst weglassen>

---

## Schritt-für-Schritt-Aufgaben

Fasse mehrere Anforderungen pro Schritt zusammen, wo sinnvoll. Markiere jeden Schritt mit den Auftragsnummern, die er bedient, damit der User die Zuordnung nachvollziehen kann.

### Schritt 1: <Titel> *(Auftrag: #1, #3)*
<Was zu tun ist>

**Aktionen:**
- <Konkrete Aktion>

**Betroffene Dateien:**
- `pfad/zur/datei.md`

---

### Schritt 2: <Titel> *(Auftrag: #2)*
…

---

## Verbindungen & Abhängigkeiten *(nur bei größeren Plänen)*

### Dateien, die diesen Bereich referenzieren
<Querverweise>

### Nötige Konsistenz-Updates
<Doku, README, CLAUDE.md, …>

### Auswirkungen auf bestehende Workflows
<Was ändert sich für den User?>

---

## Validierungs-Checkliste

- [ ] <Überprüfungsschritt>
- [ ] <Überprüfungsschritt>

---

## Erfolgskriterien

1. <Messbares Kriterium>
2. <Messbares Kriterium>

---

## Notizen
<Optionaler Zusatzkontext>

---

## Änderungslog *(wird von `/update-plan` gepflegt — bei initialer Erstellung nur den v1.0-Eintrag)*

### v1.0 — <YYYY-MM-DD>
- Initiale Version
```

---

## Qualitätsstandards

- **Vollständigkeit:** Alle gewählten Abschnitte mit konkretem Inhalt — keine Platzhalter.
- **Umsetzbarkeit:** Schritte detailliert genug für `/implement` ohne Rückfragen.
- **Konsistenz:** Folgt Workspace-Patterns und Namenskonventionen.
- **Angemessenheit:** Tiefe passt zur Tragweite — kein Theaterdonner für Mini-Änderungen.

---

## Bericht

Nach Erstellung des Plans:

1. **Zusammenfassung** (3–5 Sätze), was der Plan abdeckt — nenne dabei jede Auftragsnummer mindestens einmal, damit der User sieht, dass alle Wünsche eingearbeitet wurden.
2. **Offene Fragen** auflisten, die vor Umsetzung geklärt werden müssen.
3. **Pfad zur Plan-Datei**: `plans/YYYY-MM-DD-{name}.md`.
4. **Nächster Schritt**: Frag den User, ob er den Plan **diskutieren**, **anpassen** oder direkt **`/implement`**en möchte — nicht standardmäßig zur Umsetzung drängen.
