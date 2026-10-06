-- CreateTable
CREATE TABLE "Playlist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PlaylistSong" (
    "playlistId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("playlistId", "songId"),
    CONSTRAINT "PlaylistSong_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlaylistSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_name_key" ON "Playlist"("name");

-- CreateIndex
CREATE INDEX "PlaylistSong_songId_idx" ON "PlaylistSong"("songId");
