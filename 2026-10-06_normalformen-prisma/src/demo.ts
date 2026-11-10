// src/demo.ts — npm run run: alle drei Anomalien am normalisierten Schema prüfen.
// Startet mit frischem Seed, damit die Ausgabe immer gleich ist.
import { prisma } from "./db.ts";
import { seed } from "./seed.ts";
import {
  bestellungenMitOrt,
  bestellungLoeschen,
  bestellungMitTracks,
  kontenMitBank,
  ortUmbenennen,
  plzAnlegen,
  songsProPlaylist,
} from "./queries.ts";

async function main() {
  await seed();

  console.log("bestellung_denorm (per JOIN rekonstruiert):");
  console.table(await bestellungenMitOrt());

  const geaendert = await ortUmbenennen("1020", "Wien-Leopoldstadt");
  console.log(`Änderung:  1020 umbenannt → ${geaendert} Zeile angefasst (vorher 2).`);

  await plzAnlegen("8010", "Graz");
  console.log("Einfügen:  8010 Graz ohne Bestellung gespeichert.");

  await bestellungLoeschen(103);
  const linz = await prisma.plz.findUnique({ where: { plz: "4020" } });
  console.log(`Löschen:   Bestellung 103 weg, 4020 = ${linz?.ort} bleibt erhalten.`);

  console.log("Bestellung 101 mit Tracks:", await bestellungMitTracks(101));
  console.log("Songs pro Playlist:", await songsProPlaylist());
  console.log("Konten mit Bank:");
  console.table(await kontenMitBank());
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
