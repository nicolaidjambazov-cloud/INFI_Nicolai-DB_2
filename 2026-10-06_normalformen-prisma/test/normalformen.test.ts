// test/normalformen.test.ts — Node-Testrunner über tsx.
// Jeder Test startet mit frischem Seed, weil einige Tests Daten ändern.
import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/db.ts";
import { seed } from "../src/seed.ts";
import {
  bestellungenMitOrt,
  bestellungLoeschen,
  bestellungMitTracks,
  kontenMitBank,
  ortUmbenennen,
  plzAnlegen,
  songsProPlaylist,
} from "../src/queries.ts";

beforeEach(async () => {
  await seed();
});

after(async () => {
  await prisma.$disconnect();
});

test("JOIN rekonstruiert bestellung_denorm vollständig", async () => {
  assert.deepEqual(await bestellungenMitOrt(), [
    { bestellNr: 101, kunde: "Auer", plz: "1020", ort: "Wien" },
    { bestellNr: 102, kunde: "Beck", plz: "1020", ort: "Wien" },
    { bestellNr: 103, kunde: "Cevik", plz: "4020", ort: "Linz" },
  ]);
});

test("Änderungs-Anomalie: Ort umbenennen trifft genau 1 Zeile, alle Bestellungen sehen es", async () => {
  assert.equal(await ortUmbenennen("1020", "Wien-Leopoldstadt"), 1);
  const orte = (await bestellungenMitOrt()).filter((b) => b.plz === "1020").map((b) => b.ort);
  assert.deepEqual(orte, ["Wien-Leopoldstadt", "Wien-Leopoldstadt"]);
});

test("Einfüge-Anomalie: PLZ ohne Bestellung speicherbar", async () => {
  await plzAnlegen("8010", "Graz");
  const graz = await prisma.plz.findUnique({ where: { plz: "8010" }, include: { bestellungen: true } });
  assert.equal(graz?.ort, "Graz");
  assert.equal(graz?.bestellungen.length, 0);
});

test("Lösch-Anomalie: letzte 4020-Bestellung löschen, Linz bleibt", async () => {
  await bestellungLoeschen(103);
  const linz = await prisma.plz.findUnique({ where: { plz: "4020" } });
  assert.equal(linz?.ort, "Linz");
});

test("FK schützt: Bestellung mit unbekannter PLZ wird abgelehnt", async () => {
  await assert.rejects(
    prisma.bestellung.create({ data: { bestellNr: 999, kunde: "X", plzId: "9999" } }),
  );
});

test("1NF: Bestellung 101 liefert ihre Tracks in Positions-Reihenfolge", async () => {
  assert.deepEqual(await bestellungMitTracks(101), {
    bestellNr: 101,
    kunde: "Auer",
    ort: "Wien",
    tracks: ["Silent Lines", "Night Ferry"],
  });
});

test("2NF: Song-Titel steht einmal, erscheint aber in beiden Playlists", async () => {
  await prisma.song.update({ where: { songId: 1 }, data: { titel: "Silent Lines (Remaster)" } });
  const playlists = await songsProPlaylist();
  assert.deepEqual(playlists.find((p) => p.playlist === "Fokus")?.songs, ["Silent Lines (Remaster)"]);
  assert.deepEqual(playlists.find((p) => p.playlist === "Nachtfahrt")?.songs, [
    "Silent Lines (Remaster)",
    "Night Ferry",
  ]);
});

test("2NF: dieselbe Song/Playlist-Kombination ist nur einmal erlaubt", async () => {
  await assert.rejects(prisma.songPlaylist.create({ data: { songId: 1, playlistId: 10 } }));
});

test("3NF Konto: Bankname kommt über die BLZ aus bank", async () => {
  const konten = await kontenMitBank();
  assert.deepEqual(konten.map((k) => k.bankname), ["Erste Bank", "Erste Bank", "UniCredit Bank Austria"]);
});
