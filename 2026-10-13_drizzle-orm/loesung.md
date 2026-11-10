# HÜ 2026-10-13 — Drizzle ORM (KM5-05)

Auftrag laut Klassen-README: *„Das Drizzle-Projekt gründlich durchlesen"*. Zusätzlich
die Aufgabe am Ende der Lesson (`unterricht/KM5-05-drizzle-orm/aufgabe.md`). Das
Beispielprojekt liegt als Kopie in diesem Ordner und ist erweitert.

---

## 0. Lesenotizen zum Projekt

| Datei | Was sie macht | Was ich mir merke |
| ----- | ------------- | ----------------- |
| `deno.json` | `nodeModulesDir: "none"`, `drizzle-orm` per `npm:` auf **1.0.0-rc.4** gepinnt | Keine `node_modules`, kein Node. Der `node-sqlite`-Treiber existiert erst ab 1.0-rc, nicht in 0.45.x. |
| `schema.ts` | `artist`, `album`, `track` als `sqliteTable(...)` | **Nur Definition, keine DDL.** Jede Spalte hat zwei Namen: TS-Name (`artistId`) und DB-Name (`artist_id`). Ohne `.notNull()` ist der Typ `number \| null`. |
| `db.ts` | öffnet `DatabaseSync`, legt Tabellen mit `CREATE TABLE IF NOT EXISTS` an, gibt `drizzle({ client })` zurück | DDL und Schema müssen **von Hand** synchron bleiben (kein drizzle-kit unter Deno). Wichtig: `drizzle({ client })` und nicht `drizzle(client)`, sonst entsteht eine neue Verbindung („no such table"). |
| `demo.ts` | seedet → liest (mit `toSQL()`) → wertet aus → update → delete | Query-Builder sind **lazy**: erst `await` führt aus. `toSQL()` zeigt SQL und Parameter, ohne etwas auszuführen. |
| `demo_test.ts` | Tests auf `:memory:`-DB, jeder Test hat eine eigene DB | Der FK-Fehler kommt von **SQLite**, nicht von Drizzle. `node:sqlite` aktiviert `foreign_keys` standardmäßig. |

Weitere Beobachtungen:

- `select()` ohne Argumente listet trotzdem **alle Spalten explizit** auf, und zwar in
  der Reihenfolge, in der sie in `schema.ts` stehen (nicht `SELECT *`).
- Auch `limit(1)` wird als Parameter `?` übergeben, nicht als Zahl im SQL-Text.
- `count()` liefert unter SQLite eine Zahl, `avg()`/`sum()` liefern laut README
  aber **Strings**. Deshalb das Ergebnis prüfen und nicht blind dem Typ vertrauen.
- Der Test „assertThrows ist importiert" ist nur ein Platzhalter und prüft nichts
  Fachliches.

## 1. Vorhersage (vor dem Ausführen notiert)

**a)** `db.select().from(artist).where(eq(artist.gruendungsjahr, 1999))`

```text
Vorhersage: select "id", "name", "gruendungsjahr" from "artist"
            where "artist"."gruendungsjahr" = ?      params: [1999]
```

**b)** `db.select({ n: count() }).from(album).where(eq(album.artistId, 1))`

```text
Vorhersage: select count(*) from "album"
            where "album"."artist_id" = ?            params: [1]
```

Begründung: `select()` ohne Objekt listet alle Schema-Spalten in Definitions-Reihenfolge
auf. `count()` ohne Spalte wird zu `count(*)`. Im WHERE steht der **DB-Name**
(`artist_id`) und nicht der TS-Name (`artistId`). Werte kommen immer ins `params`-Array.

**Tatsächliche Ausgabe** (`deno task demo`):

```text
HÜ Vorhersage a): select "id", "name", "gruendungsjahr" from "artist" where "artist"."gruendungsjahr" = ? [ 1999 ]
HÜ Vorhersage b): select count(*) from "album" where "album"."artist_id" = ? [ 1 ]
```

→ Beide Vorhersagen stimmen. Der Alias `n` taucht im SQL **nicht** auf. Drizzle mappt
die Spalte erst beim Auslesen auf den Schlüssel `n` im Ergebnis-Objekt.

## 2. Beispielprojekt erweitert

Die drei Queries stehen in `queries.ts` (damit Demo **und** Tests dieselben Funktionen
nutzen) und werden in `demo.ts` aufgerufen. Die Demo hat dafür zusätzliche Tracks
bekommen, darunter „Echo Harbour" im *anderen* Album. So sieht man, dass das `and`
wirklich wirkt.

```ts
// 1) Ältestes Album: orderBy + limit
db.select().from(album).orderBy(asc(album.jahr)).limit(1);

// 2) Tracks eines Albums mit Titel-Anfang „Echo": and + eq + like
db.select().from(track)
  .where(and(eq(track.albumId, albumId), like(track.titel, "Echo%")));

// 3) Anzahl Tracks je Album: count + groupBy
db.select({ titel: album.titel, tracks: count() })
  .from(track)
  .innerJoin(album, eq(track.albumId, album.id))
  .groupBy(album.id)
  .orderBy(album.id);
```

Ausgabe:

```text
HÜ 1) Ältestes Album: Night Ferry (2012)
      SQL: select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?
HÜ 2) Echo-Tracks in Silent Lines: [ "Echo Room", "Echoes" ]
      SQL: select "id", "titel", "dauer_sek", "album_id" from "track" where (("track"."album_id" = ?) and ("track"."titel" like ?))
      Parameter: [ 1, "Echo%" ]
HÜ 3) Tracks je Album: [ { titel: "Silent Lines", tracks: 3 }, { titel: "Night Ferry", tracks: 2 } ]
      SQL: select "album"."titel", count(*) from "track" inner join "album" on "track"."album_id" = "album"."id" group by "album"."id" order by "album"."id"
```

Bei 2) steht auch das Muster `"Echo%"` im `params`-Array. Das Wildcard-`%` ist Teil
des **Werts** und nicht des SQL-Texts.

## 3. SQL-Vergleich (Interleaving): „Tracks pro Album"

Von Hand geschrieben:

```sql
SELECT a.titel, COUNT(*) AS tracks
FROM track t
INNER JOIN album a ON t.album_id = a.id
GROUP BY a.id
ORDER BY a.id;
```

Von Drizzle erzeugt:

```sql
select "album"."titel", count(*)
from "track"
inner join "album" on "track"."album_id" = "album"."id"
group by "album"."id"
order by "album"."id"
```

| Baustein | Drizzle-Code | Erzeugtes SQL |
| -------- | ------------ | ------------- |
| Spaltenliste | `select({ titel: album.titel, tracks: count() })` | `select "album"."titel", count(*)` |
| COUNT | `count()` | `count(*)` |
| JOIN | `.innerJoin(album, eq(track.albumId, album.id))` | `inner join "album" on "track"."album_id" = "album"."id"` |
| GROUP BY | `.groupBy(album.id)` | `group by "album"."id"` |

Unterschiede:

- Drizzle verwendet **keine Tabellen-Aliase** (`t`, `a`), sondern volle, gequotete
  Tabellennamen.
- Drizzle schreibt **kein `AS tracks`**. Der Name `tracks` existiert nur im
  TypeScript-Ergebnis.
- Inhaltlich ist es dieselbe Abfrage: gleicher JOIN, gleiche Gruppierung, gleiches Ergebnis.

## 4. Nachweis

```text
> deno task test
running 12 tests from ./demo_test.ts
... (9 Original-Tests + 3 neue HÜ-Tests)
ok | 12 passed | 0 failed
```

> **Stolperstein:** Mit **Deno 2.5.2** scheitern Demo und Tests, auch im
> unveränderten Original-Beispielprojekt, mit
> `TypeError: stmt.setReturnArrays is not a function`. Drizzle 1.0-rc nutzt eine
> neuere `node:sqlite`-API, die erst neuere Deno-Versionen haben. Mit **Deno 2.9.8**
> läuft alles grün. Lösung: `deno upgrade`.
