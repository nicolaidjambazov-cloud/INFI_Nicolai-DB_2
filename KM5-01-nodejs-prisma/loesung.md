# Lösungen zur Hausaufgabe KM5-01 (Node.js + Prisma 7)

## 1. Vorhersage (vor dem Ausführen)

**Query 1 — Top-Künstler:** Ich habe vorhergesagt:

```
[ { name: 'Nova', tracks: 3 },
  { name: 'Pixel', tracks: 2 },
  { name: 'Solveig', tracks: 1 },
  { name: 'Ohne Label', tracks: 1 } ]
```

Also Nova (3), Pixel (2), Solveig (1) und „Ohne Label" (1). Der Künstler ohne Label taucht
mit auf, weil Query 1 über `Song` gruppiert, nicht über `Label` — es gibt keine Verknüpfung
zum Label, also wird auch nicht nach einem gefiltert. Solveig und „Ohne Label" haben beide
genau 1 Song; ihre Reihenfolge untereinander ist nicht garantiert (kein eindeutiger Tie-Breaker
in der Query, SQLite entscheidet das intern), das war schon vorab die eine Stelle, an der
meine Vorhersage nur „irgendwie gleich" sein konnte.

**Warum `COUNT(*)` = 4, `COUNT(labelId)` = 3:**

`COUNT(*)` zählt die **Zeilen**, die die Abfrage liefert — hier also alle 4 Datensätze in
`Kuenstler`, egal ob in `labelId` etwas steht. `COUNT(labelId)` zählt nur die Zeilen, bei
denen `labelId` **nicht NULL** ist. Der Künstler „Ohne Label" wurde mit `labelId: null`
angelegt; NULL ist per SQL-Definition kein Wert, und Aggregatfunktionen wie `COUNT`
ignorieren NULL. Ergebnis: 4 − 1 = 3.

Merksatz: `COUNT(*)` = „wie viele Datensätze gibt es", `COUNT(spalte)` = „wie viele
Datensätze haben in dieser Spalte einen Wert". In Prisma entspricht das genau
`prisma.kuenstler.count()` (ohne `where`) gegenüber
`prisma.kuenstler.count({ where: { labelId: { not: null } } })` — Query 4 in
`src/queries.js`. Prisma übersetzt den `not: null`-Filter also in ein SQL, das dem
`COUNT(labelId)` entspricht, ohne dass man die Aggregate-Funktion selbst schreiben muss.

## 2. Setup (durchlaufen)

```
npm i prisma@7 @prisma/client@7 @prisma/adapter-better-sqlite3@7 dotenv
npm approve-scripts --all
cp .env.example .env
npm run db:migrate      -> migration 20260928220811_init angewandt
npm run db:seed         -> Seed fertig: 4 Künstler, 7 Songs.
npm run run
npm test
```

Konsolen-Ausgabe `npm run run` (6 Zeilen, die 6. ist aus Aufgabe 3):

```
1) Top-Künstler:           [
  { name: 'Nova', tracks: 3 },
  { name: 'Pixel', tracks: 2 },
  { name: 'Ohne Label', tracks: 1 },
  { name: 'Solveig', tracks: 1 }
]
2) Label-Paare:            [ { a: 'Nova', b: 'Pixel', label: 'Ohrwurm Records' } ]
3) Labels mit >1 Künstler: [ { name: 'Ohrwurm Records', anzahl: 2 } ]
4) COUNT(*) vs. mit Label: { alle: 4, mitLabel: 3 }
5) Künstler mit 2+ langen: [ { name: 'Nova', anzahl: 2 }, { name: 'Pixel', anzahl: 2 } ]
6) Songs pro Playlist:     [
  { name: 'Fokus', anzahl: 3 },
  { name: 'Laufzeit', anzahl: 2 },
  { name: 'Leer', anzahl: 0 }
]
```

`npm test`: **6/6 Tests grün** (`tests 6, pass 6, fail 0`).

### Zwei Fehler, die unterwegs kamen

- **`npm run run` gab keine Ausgabe.** Der Guard
  `import.meta.url === \`file://${process.argv[1]}\`` vergleicht eine URL mit einem
  Windows-Pfad. Sobald der Pfad Leerzeichen enthält (dieser Repo-Pfad hat welche),
  ist der Vergleich `false` und `main()` lief nie. Behoben mit
  `pathToFileURL(process.argv[1]).href` (`src/queries.js`). Merke: Pfade mit Leerzeichen
  sind in Node/ESM ein wiederkehrender Fehlerquelle, `pathToFileURL` ist der saubere Weg.
- **`prisma.song.deleteMany() is not a function` nach dem Schema-Änderung.** Nach einer
  Schema-Änderung muss der Client neu generiert werden, sonst kennt er die neuen Modelle
  nicht: `npm run db:generate`. `migrate dev` allein genügt nicht zuverlässig.

## 3. Erweiterung: `Playlist` mit N:M zu `Song`

**Schema** (`prisma/schema.prisma`): Ich habe *kein* implizites Many-to-many genommen,
sondern einen expliziten Join-Table `PlaylistSong` mit `@@id([playlistId, songId])`.
Begründung: implizites N:M erlaubt nur, dass ein Song pro Playlist **einmal** vorkommt.
In einer echten Playlist darf derselbe Song aber mehrfach enthalten sein (Reorder,
gleiche Liste an verschiedenen Tagen, Duplikat zum Testen des Zählens) — dafür braucht es
eine Surrogate-Zeile pro Vorkommen, also eine 1:n von beiden Seiten. Zusätzlich habe ich
`position` mitgenommen, weil die Reihenfolge in einer Playlist fachlich dazugehört.

**Migration:** `prisma/migrations/20260929131024_playlist/migration.sql` — legt
`Playlist`, `PlaylistSong` und den Index auf `songId` an, beide Fremdschlüssel mit
`ON DELETE CASCADE`.

**Die eine Prisma-Query** (`songAnzahlProPlaylist()` in `src/queries.js`):

```js
export async function songAnzahlProPlaylist() {
  const playlists = await prisma.playlist.findMany({
    select: { name: true, _count: { select: { songs: true } } },
    orderBy: { name: "asc" },
  });
  return playlists.map((p) => ({ name: p.name, anzahl: p._count.songs }));
}
```

Das ist eine einzige Query, kein N+1: `_count: { select: { songs: true } }` lässt Prisma
die Zahl der Join-Zeilen pro Playlist mitzählen und als Skalar mitliefern. Eine leere
Playlist kommt als `0` mit zurück (LEFT-JOIN-Semantik) — die Playlist „Leer" im Seed
demonstriert das. Test dafür ergänzt, damit die 0 nicht unbemerkt wegbricht.

## 4. Reflexion

Prisma war vor allem dort kürzer, wo die Aufgabe eine reine Datenstruktur-Sache war: das
`include`-/`select`-Konzept liefert Verschachtelung ohne JOIN-Schreiben, `_count` liefert
Aggregationen als Feld am Objekt statt als eigene Aggregat-Zeile, und `createMany` mit
Array spart bei Seeds eine Schleife — Query 1, 3 und 4 sind dadurch deutlich kompakter
als die SQL-Fassung, ohne dass die Lesbarkeit leidet. Auf `$queryRaw` ausweichen musste
ich genau einmal, bei Query 2: das Self-JOIN auf `Kuenstler`, um jedes Künstlerpaar pro
Label einmal auszugeben. Prisma kann dasselbe Modell nicht zweimal in einer Query
referenzieren, es gibt kein Aliasing für Relationen — das ist eine echte Lücke der
Abstraktion, kein Bedienfehler. Prisma war auch dort angenehm, wo es das Typische
automatisch richtig macht: `createMany`, die Reihenfolge der `deleteMany`-Aufrufe und
Cascade-Regeln, die man in SQL sonst selbst hätte hinschreiben müssen. Beim
`count` mit `not: null` musste ich allerdings genauer hinsehen, weil Prisma daraus nicht
automatisch `COUNT(spalte)` macht, sondern einen echten Filter mit Zählen — das Ergebnis
ist identisch, aber die Begründung aus Aufgabe 1 gilt nur für das SQL, nicht für die
Prisma-Abstraktion. Insgesamt bleibe ich vorerst bei Prisma: der Raw-SQL-Anteil bleibt
klein und ist genau dort, wo Prisma wirklich nicht weiterkommt (Self-JOIN, echte
Window-Functions, komplexe CTEs), und für alles andere ist es lesbarer. Für die Lehre
behalte ich SQL im Kopf, weil man Aggregate und NULL-Semantik sonst nur behaupten, nicht
erklären kann — die Prisma-Query beweist das Ergebnis, das SQL erklärt es.
