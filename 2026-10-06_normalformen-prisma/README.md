# UE 2026-10-06 — Normalformen 1NF–3NF mit Prisma 7

HÜ zu KM5-02 (Normalisierung), umgesetzt **mit Prisma** (Zusatz aus der Stunde).
Die schriftliche Lösung steht in [`loesung.md`](loesung.md).

## Einrichten (einmalig)

```bash
npm install                 # prisma@7, @prisma/client@7, adapter, dotenv, tsx
cp .env.example .env        # DATABASE_URL="file:./dev.db"
npm run db:migrate          # wendet die Migration an + generiert den Client
npm run db:seed             # normalisierte Beispieldaten
```

## Ausführen

```bash
npm run run     # Demo: JOIN-Rekonstruktion + alle drei Anomalien behoben
npm test        # 9 Tests (node:test über tsx)
npm run studio  # Prisma Studio
```

## Dateien

| Datei | Zweck |
| ----- | ----- |
| `loesung.md` | Vorhersage, Zerlegung bis 3NF, zwei eigene Tabellen, Nachweis |
| `prisma/schema.prisma` | normalisierte Modelle (`@@map` → snake_case-Tabellen wie in der Lesson) |
| `prisma/migrations/` | von Prisma erzeugte `CREATE TABLE`s |
| `src/seed.ts` | Beispielzeilen (idempotent, auch von Tests/Demo genutzt) |
| `src/queries.ts` | Prisma-Queries: Sicht rekonstruieren, Anomalien prüfen |
| `src/demo.ts` | Konsolen-Demo (`npm run run`) |
| `test/normalformen.test.ts` | 9 Tests |

## Abgedeckte Tabellen

| Ausgang | Verletzung | Ergebnis |
| ------- | ---------- | -------- |
| `bestellung_denorm(bestell_nr, kunde, plz, ort)` | 3NF: `bestell_nr → plz → ort` | `plz`, `bestellung` |
| „Jetzt du!": `… tracks …` | 1NF: Liste in der Zelle | `track`, `bestellposition` |
| `song_playlist_denorm(song_id, playlist_id, song_titel)` | 2NF: `song_id → song_titel` | `song`, `playlist`, `song_playlist` |
| `konto_denorm(iban, inhaber, blz, bankname)` | 3NF: `iban → blz → bankname` | `bank`, `konto` |
