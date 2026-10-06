# AGENTS.md

This document contains operational guidelines for AI agents working in the INFI_Nicolai-DB_2 repository.
It defines build commands, code style, and project structure conventions.

---

## 1. Project Overview & Environment

This repository contains coursework and exercises for INFI (3AHWII).
Key technologies:

- **Runtime:** Deno (TypeScript), Node.js + npm (Prisma 7, KM5-01)
- **Database:** SQLite
- **Languages:** TypeScript, SQL, Markdown/HTML

### Directory Structure

- KM5-01-nodejs-prisma/: Lesson + praxis (Node/Prisma 7). Praxis läuft mit tsx, Tests node --import tsx --test.
- 2026-09-29_rep-ohne-node/: Rep-Stunde ohne Node (Deno + node:sqlite), Seed + Tests (deno test --allow-read --allow-write).
- 2026-10-06_normalisierung-3nf/: Normalisierung 3NF, demo.ts + Tests (Deno), Lesson + Assets.
- ssets/, eference/: Gemeinsame Ressourcen (Style/Quiz + Glossar/Spickzettel).
- README.md: Repo-Übersicht.

---

## 2. Build, Test, and Lint Commands

### Deno (rep-ohne-node, normalisierung-3nf)

`ash
deno task run        # main/demo ausführen
deno test --allow-read --allow-write  # Tests
deno fmt             # Formatieren
deno lint            # Lint
`

### Node.js + Prisma 7 (KM5-01-nodejs-prisma/praxis)

`ash
npm i
npm run db:migrate
npm run db:seed
npm run run          # Queries ausführen
npm test             # node --import tsx --test
npm run studio       # Prisma Studio (SQLite)
`

### SQL

`ash
sqlite3 db.db < script.sql
`

---

## 3. Code Style & Conventions

- TypeScript/Deno: double quotes, semicolons, camelCase, Deutsche Kommentare bei bestehenden Dateien beibehalten.
- SQL: UPPERCASE Keywords, klare Indentation.
- Markdown/HTML: lesbar, deutsche Fachbegriffe.
- Keine unnötigen Kommentare hinzufügen (Agent-Richtlinie).

---

## 4. Testing & Verification

- Tests grün lassen, bevor als „erledigt“ markiert wird.
- Bei Änderungen Seeds/DB neu erzeugen wenn nötig.
- Für rep-ohne-node: DB-Dateien lokal (gitignored) erzeugen.

---

## 5. Notes

Keine Commits ohne expliziten Auftrag. Assets lokal referenzieren (keine Cross-Repo-Links). Prisma 7 nutzt Adapter + tsx (TypeScript-Client).