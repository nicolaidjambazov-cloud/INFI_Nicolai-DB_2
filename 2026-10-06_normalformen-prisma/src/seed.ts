// src/seed.ts — dieselben Daten wie seed-normalisierung.sql, aber normalisiert.
// Idempotent: erst leeren (Kinder zuerst), dann neu befüllen.
import { pathToFileURL } from "node:url";
import { prisma } from "./db.ts";

export async function seed() {
  await prisma.bestellposition.deleteMany();
  await prisma.bestellung.deleteMany();
  await prisma.track.deleteMany();
  await prisma.plz.deleteMany();
  await prisma.songPlaylist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.konto.deleteMany();
  await prisma.bank.deleteMany();

  // Teil 1+2: "1020 = Wien" steht genau einmal in der DB.
  await prisma.plz.createMany({
    data: [
      { plz: "1020", ort: "Wien" },
      { plz: "4020", ort: "Linz" },
    ],
  });
  await prisma.bestellung.createMany({
    data: [
      { bestellNr: 101, kunde: "Auer", plzId: "1020" },
      { bestellNr: 102, kunde: "Beck", plzId: "1020" },
      { bestellNr: 103, kunde: "Cevik", plzId: "4020" },
    ],
  });
  await prisma.track.createMany({
    data: [
      { trackId: 1, titel: "Silent Lines" },
      { trackId: 2, titel: "Night Ferry" },
      { trackId: 3, titel: "Dust Choir" },
    ],
  });
  await prisma.bestellposition.createMany({
    data: [
      { bestellNr: 101, position: 1, trackId: 1 },
      { bestellNr: 101, position: 2, trackId: 2 },
      { bestellNr: 102, position: 1, trackId: 3 },
    ],
  });

  // Teil 3a: Titel gehört zum Song, die Zwischentabelle hält nur die Beziehung.
  await prisma.song.createMany({
    data: [
      { songId: 1, titel: "Silent Lines", dauerSek: 215 },
      { songId: 2, titel: "Night Ferry", dauerSek: 240 },
      { songId: 3, titel: "Dust Choir", dauerSek: 198 },
    ],
  });
  await prisma.playlist.createMany({
    data: [
      { playlistId: 10, name: "Fokus" },
      { playlistId: 20, name: "Nachtfahrt" },
      { playlistId: 30, name: "Morgenrunde" },
    ],
  });
  await prisma.songPlaylist.createMany({
    data: [
      { songId: 1, playlistId: 10 },
      { songId: 1, playlistId: 20 },
      { songId: 2, playlistId: 20 },
      { songId: 3, playlistId: 30 },
    ],
  });

  // Teil 3b: Bankname genau einmal pro BLZ.
  await prisma.bank.createMany({
    data: [
      { blz: "20111", bankname: "Erste Bank" },
      { blz: "12000", bankname: "UniCredit Bank Austria" },
      { blz: "32000", bankname: "Raiffeisenlandesbank NÖ-Wien" },
    ],
  });
  await prisma.konto.createMany({
    data: [
      { iban: "AT01", inhaber: "Auer", blz: "20111" },
      { iban: "AT02", inhaber: "Beck", blz: "20111" },
      { iban: "AT03", inhaber: "Cevik", blz: "12000" },
    ],
  });
}

// Nur ausführen, wenn direkt gestartet (npm run db:seed), nicht beim Import aus Tests.
// pathToFileURL, weil der Repo-Pfad Leerzeichen enthält.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then(async () => {
      console.log(
        `Seed fertig: ${await prisma.bestellung.count()} Bestellungen, ` +
          `${await prisma.songPlaylist.count()} Song-Playlist-Zeilen, ` +
          `${await prisma.konto.count()} Konten.`,
      );
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
