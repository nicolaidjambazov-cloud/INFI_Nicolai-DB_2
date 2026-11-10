-- CreateTable
CREATE TABLE "plz" (
    "plz" TEXT NOT NULL PRIMARY KEY,
    "ort" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "bestellung" (
    "bestell_nr" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kunde" TEXT NOT NULL,
    "plz" TEXT NOT NULL,
    CONSTRAINT "bestellung_plz_fkey" FOREIGN KEY ("plz") REFERENCES "plz" ("plz") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "track" (
    "track_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "bestellposition" (
    "bestell_nr" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "track_id" INTEGER NOT NULL,

    PRIMARY KEY ("bestell_nr", "position"),
    CONSTRAINT "bestellposition_bestell_nr_fkey" FOREIGN KEY ("bestell_nr") REFERENCES "bestellung" ("bestell_nr") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bestellposition_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "track" ("track_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "song" (
    "song_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titel" TEXT NOT NULL,
    "dauer_sek" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "playlist" (
    "playlist_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "song_playlist" (
    "song_id" INTEGER NOT NULL,
    "playlist_id" INTEGER NOT NULL,

    PRIMARY KEY ("song_id", "playlist_id"),
    CONSTRAINT "song_playlist_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "song" ("song_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "song_playlist_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlist" ("playlist_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bank" (
    "blz" TEXT NOT NULL PRIMARY KEY,
    "bankname" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "konto" (
    "iban" TEXT NOT NULL PRIMARY KEY,
    "inhaber" TEXT NOT NULL,
    "blz" TEXT NOT NULL,
    CONSTRAINT "konto_blz_fkey" FOREIGN KEY ("blz") REFERENCES "bank" ("blz") ON DELETE RESTRICT ON UPDATE CASCADE
);
