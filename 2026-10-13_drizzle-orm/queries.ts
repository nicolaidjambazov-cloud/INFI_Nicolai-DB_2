// queries.ts — die drei Queries aus der Aufgabe (KM5-05), als Funktionen,
// damit demo.ts und demo_test.ts dieselben Queries benutzen.
// Rückgabe ist jeweils der (lazy) Query-Builder: erst await führt aus,
// vorher kann man mit .toSQL() das erzeugte SQL ansehen.
import { and, asc, count, eq, like } from "drizzle-orm";
import type { oeffneDb } from "./db.ts";
import { album, track } from "./schema.ts";

type Db = ReturnType<typeof oeffneDb>;

// 1) Ältestes Album: orderBy aufsteigend nach Jahr + limit 1.
export function aeltestesAlbum(db: Db) {
  return db.select().from(album).orderBy(asc(album.jahr)).limit(1);
}

// 2) Tracks eines Albums, deren Titel mit „Echo" beginnt: and + eq + like.
export function echoTracks(db: Db, albumId: number) {
  return db.select().from(track)
    .where(and(eq(track.albumId, albumId), like(track.titel, "Echo%")));
}

// 3) Anzahl Tracks je Album: count + groupBy (Album-Titel über innerJoin).
export function tracksProAlbum(db: Db) {
  return db.select({ titel: album.titel, tracks: count() })
    .from(track)
    .innerJoin(album, eq(track.albumId, album.id))
    .groupBy(album.id)
    .orderBy(album.id);
}
