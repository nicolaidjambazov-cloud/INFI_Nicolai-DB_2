# HÜ 2026-10-06 — Normalformen 1NF–3NF (mit Prisma)

Aufgabe: `GRG-INFI/unterricht/KM5-02-normalisierung/hausaufgabe.md` + Zusatz aus der
Stunde: **Umsetzung mit Prisma** (Schema + Migrate statt freier `CREATE`s, Query statt
Roh-SQL). Das lauffähige Projekt liegt im selben Ordner (siehe [README](README.md)).

---

## 1. Vorhersage (vor dem Zerlegen)

Ausgangstabelle aus `seed-normalisierung.sql`:

```text
bestellung_denorm(bestell_nr PK, kunde, plz, ort)
  101 | Auer  | 1020 | Wien
  102 | Beck  | 1020 | Wien     -- "1020 = Wien" zum 2. Mal
  103 | Cevik | 4020 | Linz
```

| Spalte | Normalform | Begründung |
| ------ | ---------- | ---------- |
| `bestell_nr` | — | Schlüssel |
| `kunde` | hält | hängt direkt an `bestell_nr` |
| `plz` | hält | hängt direkt an `bestell_nr` (Lieferadresse der Bestellung) |
| `ort` | **verletzt 3NF** | hängt nicht direkt am Schlüssel, sondern über die Nichtschlüssel-Spalte `plz` |

- **1NF hält:** jede Zelle ist atomar, es gibt keine Listen und keine Wiederholgruppen.
- **2NF ist kein Thema:** Der Schlüssel `bestell_nr` besteht aus einer Spalte. Ohne
  zusammengesetzten Schlüssel gibt es keinen Schlüsselteil, also keine partielle Abhängigkeit.
- **3NF ist verletzt:** `bestell_nr → plz → ort` ist eine transitive Abhängigkeit.

Folgen (alle drei Anomalien):

- **Änderung:** Bekommt 1020 einen neuen Ortsnamen, müssen 2 Zeilen geändert werden.
- **Einfügen:** „8010 = Graz" lässt sich ohne Bestellung nicht speichern.
- **Löschen:** Wird Bestellung 103 gelöscht, ist das Wissen „4020 = Linz" weg.

## 2. Zerlegen bis 3NF

| Stufe | Prüffrage | Ergebnis |
| ----- | --------- | -------- |
| 1NF | Atomar? | ja, keine Änderung |
| 2NF | Ganzer Schlüssel? | PK ist einspaltig → automatisch erfüllt |
| 3NF | Nur der Schlüssel? | nein: `plz → ort` auslagern |

Abhängigkeiten:

```text
bestell_nr → kunde
bestell_nr → plz
plz        → ort          ⇐ Faktum über die PLZ, nicht über die Bestellung
```

Ergebnis (FK = Fremdschlüssel):

```text
plz(plz PK, ort)                              -- "1020 = Wien" genau 1×
bestellung(bestell_nr PK, kunde, plz FK → plz)
```

Als Prisma-Schema (`prisma/schema.prisma`):

```prisma
model Plz {
  plz          String       @id
  ort          String
  bestellungen Bestellung[]
  @@map("plz")
}

model Bestellung {
  bestellNr Int    @id @map("bestell_nr")
  kunde     String
  plzId     String @map("plz")
  plz       Plz    @relation(fields: [plzId], references: [plz])
  @@map("bestellung")
}
```

> **Anmerkung:** Streng genommen ist `plz` die Adresse des **Kunden**. Kauft Auer
> zweimal, stehen Kunde und PLZ wieder doppelt (`kunde → plz`). Mit einer eigenen
> Tabelle `kunde(kunde_id, name, plz FK)` wäre auch das sauber. Ich bleibe bei der
> Lösung der Lesson, weil im Seed jeder Kunde nur einmal bestellt und ein Kunde
> in der Tabelle nur als Name vorkommt (kein eigener Schlüssel).

### Erweiterung „Jetzt du!": `bestellung(bestell_nr PK, kunde, tracks, plz, ort)`

- `tracks` (z. B. `"1, 2"`) verletzt **1NF**: eine Liste in einer Zelle.
- `ort` verletzt wie oben **3NF**.
- 2NF ist auch hier kein Thema, weil der PK einspaltig ist.

Zerlegung:

```text
plz(plz PK, ort)
bestellung(bestell_nr PK, kunde, plz FK)
track(track_id PK, titel)
bestellposition(bestell_nr FK, position, track_id FK, PK(bestell_nr, position))
```

Zurück zur Abfrage (Interleaving): die ursprüngliche Bestellung samt Track-Titeln.

```sql
SELECT b.bestell_nr, b.kunde, p.plz, p.ort, bp.position, t.titel
FROM bestellung b
JOIN plz p              ON p.plz = b.plz
JOIN bestellposition bp ON bp.bestell_nr = b.bestell_nr
JOIN track t            ON t.track_id = bp.track_id
WHERE b.bestell_nr = 101
ORDER BY bp.position;
```

Dieselbe Frage mit Prisma (`bestellungMitTracks()` in `src/queries.ts`):

```ts
prisma.bestellung.findUniqueOrThrow({
  where: { bestellNr: 101 },
  include: {
    plz: true,
    positionen: { include: { track: true }, orderBy: { position: "asc" } },
  },
});
// → { bestellNr: 101, kunde: "Auer", ort: "Wien", tracks: ["Silent Lines", "Night Ferry"] }
```

## 3. Zwei eigene Tabellen

Die `CREATE`s schreibe ich nicht von Hand. Sie entstehen aus dem Prisma-Schema über
`prisma migrate dev` (siehe `prisma/migrations/*/migration.sql`). Die Beispielzeilen
kommen aus `src/seed.ts`.

### a) `song_playlist_denorm(song_id, playlist_id, song_titel)`, PK `(song_id, playlist_id)` → 2NF

- 1NF hält (atomar).
- **2NF verletzt:** `song_id → song_titel` hängt nur an **einem Teil** des
  zusammengesetzten Schlüssels (partielle Abhängigkeit). Der Titel steht in jeder
  Playlist-Zeile erneut (Änderungs-Anomalie).
- Fix: Titel gehört zur Entität Song, die Zwischentabelle hält nur noch die Beziehung.
- 3NF: danach keine transitiven Ketten mehr (`song`: alles hängt direkt an `song_id`).

Erzeugtes SQL (aus der Migration):

```sql
CREATE TABLE "song" (
    "song_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL,
    "dauer_sek" INTEGER NOT NULL
);
CREATE TABLE "playlist" (
    "playlist_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);
CREATE TABLE "song_playlist" (
    "song_id" INTEGER NOT NULL,
    "playlist_id" INTEGER NOT NULL,
    PRIMARY KEY ("song_id", "playlist_id"),
    CONSTRAINT "song_playlist_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "song" ("song_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "song_playlist_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlist" ("playlist_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
```

Beispielzeilen:

| song | | |
| --- | --- | --- |
| **song_id** | **titel** | **dauer_sek** |
| 1 | Silent Lines | 215 |
| 2 | Night Ferry | 240 |
| 3 | Dust Choir | 198 |

| playlist | |
| --- | --- |
| **playlist_id** | **name** |
| 10 | Fokus |
| 20 | Nachtfahrt |
| 30 | Morgenrunde |

| song_playlist | |
| --- | --- |
| **song_id** | **playlist_id** |
| 1 | 10 |
| 1 | 20 |
| 2 | 20 |
| 3 | 30 |

### b) `konto_denorm(iban PK, inhaber, blz, bankname)` → 3NF (SWP-Crossover)

- 1NF hält, 2NF automatisch (einspaltiger PK).
- **3NF verletzt:** `iban → blz → bankname`. Der Bankname ist ein Faktum über die BLZ,
  nicht über das Konto.
- Fix: `blz → bankname` in `bank` auslagern, `konto.blz` wird FK.

```sql
CREATE TABLE "bank" (
    "blz" TEXT NOT NULL PRIMARY KEY,
    "bankname" TEXT NOT NULL
);
CREATE TABLE "konto" (
    "iban" TEXT NOT NULL PRIMARY KEY,
    "inhaber" TEXT NOT NULL,
    "blz" TEXT NOT NULL,
    CONSTRAINT "konto_blz_fkey" FOREIGN KEY ("blz") REFERENCES "bank" ("blz") ON DELETE RESTRICT ON UPDATE CASCADE
);
```

| bank | |
| --- | --- |
| **blz** | **bankname** |
| 20111 | Erste Bank |
| 12000 | UniCredit Bank Austria |
| 32000 | Raiffeisenlandesbank NÖ-Wien |

| konto | | |
| --- | --- | --- |
| **iban** | **inhaber** | **blz** |
| AT01 | Auer | 20111 |
| AT02 | Beck | 20111 |
| AT03 | Cevik | 12000 |

(Die Bank 32000 ohne Konto zeigt, dass die Einfüge-Anomalie weg ist.)

## 4. Nachweis

### Demo aus dem Beispielprojekt (`GRG-INFI/Beispielprojekte/km5-02-normalisierung`)

```text
> deno task demo
1NF: WHERE hobbys = 'Schwimmen' findet 0 Zeilen (die Zelle ist eine Liste).
1NF-Fix: eine Zeile pro Wert -> 1 Treffer.
2NF: song_id 1 hat 2 verschiedene Titel (Titel hängt nur an song_id).
2NF-Fix: der Titel steht 1 Mal fuer song_id 1.
3NF: PLZ 1020 hat 2 verschiedene Orte (Ort hängt an PLZ).
```

### Eigenes Prisma-Projekt (`npm run run`)

```text
Änderung:  1020 umbenannt → 1 Zeile angefasst (vorher 2).
Einfügen:  8010 Graz ohne Bestellung gespeichert.
Löschen:   Bestellung 103 weg, 4020 = Linz bleibt erhalten.
```

### Tests (`npm test`)

9/9 grün. Die Tests prüfen die drei Anomalien, den FK-Schutz, die
1NF-Positionsreihenfolge, 2NF (Titel genau einmal, Kombination eindeutig) und
3NF beim Konto.

## 5. Erkenntnis: Prisma und Normalisierung

- Prisma **zwingt** nicht zur Normalisierung. Ein `model BestellungDenorm { … ort String }`
  wäre genauso gültig. Die Zerlegung bleibt Denkarbeit.
- Prisma **belohnt** sie aber: Jede ausgelagerte Tabelle wird eine Relation, und
  `include` baut die alte, „flache" Sicht ohne handgeschriebenes JOIN wieder auf.
- Die Migration erzeugt die `CREATE`s inklusive FK-Constraints. Den Schutz
  übernimmt die **Datenbank** (Test „FK schützt"), nicht Prisma.
- `@@map`/`@map` trennen DB-Namen (snake_case wie in der Lesson) von den Namen im
  Code (camelCase). Dieselbe Idee taucht bei Drizzle wieder auf (`artistId` ↔ `artist_id`).
