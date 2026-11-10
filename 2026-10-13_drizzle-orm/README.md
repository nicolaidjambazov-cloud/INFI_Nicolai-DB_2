# UE 2026-10-13 — Drizzle ORM (Kopie von km5-05-drizzle-orm, erweitert)

> **HÜ-Abgabe:** Lösung in [`loesung.md`](loesung.md). Neu gegenüber dem Original:
> `queries.ts` (3 Queries aus der Aufgabe), deren Aufrufe mit `toSQL()` in `demo.ts`
> und 3 zusätzliche Tests in `demo_test.ts` (12 statt 9).
> Benötigt **Deno ≥ 2.9**. Mit 2.5.2 kommt `stmt.setReturnArrays is not a function`.

Beispielprojekt zur Lesson `GRG-INFI/unterricht/KM5-05-drizzle-orm/lesson.html`:
die Musik-DB (Artist/Album/Track) als **TypeScript-Schema mit Drizzle ORM** —
Typsicherheit statt SQL-Strings, mit Einblick in das erzeugte SQL.

## Stack

- **Deno** (Runtime) + **`node:sqlite`** (eingebauter SQLite-Treiber)
- **`drizzle-orm` 1.0.0-rc.4, gepinnt** — der Doku-Standard-Pfad für den
  `node:sqlite`-Treiber (in der stabilen 0.45.x existiert `drizzle-orm/node-sqlite`
  noch nicht). Reines TypeScript, kein Node-Zwang, kein `node_modules`.
- **kein drizzle-kit:** die Kit-CLI (Migrationen) läuft nicht unter Deno —
  Schema-Evolution ist KM6-Stoff. Die Tabellen legt `db.ts` mit DDL an
  (`CREATE TABLE IF NOT EXISTS`), synchron gehalten mit `schema.ts`.

## Aufgaben

- **Demo:** `deno task demo` — seedet den Katalog und zeigt Lesen/Schreiben/
  Auswerten samt erzeugtem SQL (7 Konsolenausgaben).
- **Tests:** `deno task test` — 12 Tests (9 Original + 3 HÜ) (insert/returning, where, FK-Verstoß,
  update nur im Ziel, delete, orderBy/limit, join, Parametrisierung).

## Struktur

| Datei | Inhalt |
|---|---|
| `schema.ts` | Tabellen als Drizzle-Schema (`sqliteTable`) — **erzeugt keine Tabellen** |
| `db.ts` | Verbindung (`drizzle({ client })` über `node:sqlite`) + DDL-Anlage |
| `demo.ts` | Seeded Demo-Ablauf mit `toSQL()`-Einblicken |
| `queries.ts` | HÜ: ältestes Album, Echo-Tracks, Tracks je Album |
| `demo_test.ts` | Tests zu allen Lesson-Konzepten + 3 HÜ-Tests |
| `loesung.md` | Lesenotizen, Vorhersage, SQL-Vergleich, Nachweis |

## Merksätze (aus der Arbeit mit dem Projekt)

- `drizzle(client)` **falsch** — der Positional-Overload erwartet einen Pfad-String
  und baut intern eine eigene Verbindung. Immer **`drizzle({ client })`**, sonst
  findet Drizzle die mit DDL angelegten Tabellen nicht („no such table").
- Query-Builder-Objekte sind **lazy**: erst `await` führt das SQL aus.
- Werte landen nie im SQL-Text (`toSQL().params`) — Parametrisierung by default.
- Aggregations-Helfer wie `avg()`/`sum()` liefern bei SQLite **Strings** zurück
  (`"200"`) — Ergebnis prüfen statt dem TypeScript-Typ blind vertrauen.
