// src/queries.ts — Abfragen auf das normalisierte Schema über die Prisma-API.
// Jede Funktion zeigt, dass eine der drei Anomalien nach der Zerlegung weg ist,
// oder baut die ursprüngliche (denormalisierte) Sicht per JOIN wieder auf.
import { prisma } from "./db.ts";

// Ursprüngliche Sicht bestellung_denorm(bestell_nr, kunde, plz, ort) per JOIN.
export async function bestellungenMitOrt() {
  const zeilen = await prisma.bestellung.findMany({
    include: { plz: true },
    orderBy: { bestellNr: "asc" },
  });
  return zeilen.map((b) => ({
    bestellNr: b.bestellNr,
    kunde: b.kunde,
    plz: b.plz.plz,
    ort: b.plz.ort,
  }));
}

// Änderungs-Anomalie weg: Ortsname ändern = genau EINE Zeile anfassen.
export async function ortUmbenennen(plz: string, neuerOrt: string) {
  const ergebnis = await prisma.plz.updateMany({
    where: { plz },
    data: { ort: neuerOrt },
  });
  return ergebnis.count;
}

// Einfüge-Anomalie weg: neue PLZ ohne Dummy-Bestellung speicherbar.
export async function plzAnlegen(plz: string, ort: string) {
  return prisma.plz.create({ data: { plz, ort } });
}

// Lösch-Anomalie weg: letzte Bestellung einer PLZ löschen, der Ort bleibt.
export async function bestellungLoeschen(bestellNr: number) {
  await prisma.bestellung.delete({ where: { bestellNr } });
}

// Interleaving („Jetzt du!"): Bestellung inkl. Track-Titel wieder ausgeben.
export async function bestellungMitTracks(bestellNr: number) {
  const b = await prisma.bestellung.findUniqueOrThrow({
    where: { bestellNr },
    include: {
      plz: true,
      positionen: { include: { track: true }, orderBy: { position: "asc" } },
    },
  });
  return {
    bestellNr: b.bestellNr,
    kunde: b.kunde,
    ort: b.plz.ort,
    tracks: b.positionen.map((p) => p.track.titel),
  };
}

// Teil 3a: song_playlist_denorm wieder aufbauen (Titel kommt aus song).
export async function songsProPlaylist() {
  const playlists = await prisma.playlist.findMany({
    include: { songs: { include: { song: true }, orderBy: { songId: "asc" } } },
    orderBy: { playlistId: "asc" },
  });
  return playlists.map((p) => ({
    playlist: p.name,
    songs: p.songs.map((s) => s.song.titel),
  }));
}

// Teil 3b: konto_denorm wieder aufbauen (Bankname kommt aus bank).
export async function kontenMitBank() {
  const konten = await prisma.konto.findMany({
    include: { bank: true },
    orderBy: { iban: "asc" },
  });
  return konten.map((k) => ({
    iban: k.iban,
    inhaber: k.inhaber,
    bankname: k.bank.bankname,
  }));
}
