# HÜ 3NF — Normalisierung bis 3NF (Lösungen)

## 1) bestellung_denorm

Schema (Transitive Abhängigkeiten sichtbar machen):

### 1NF
Prüfen: Atomarität? Wenn ein Kunde mehrmals auf einer Bestellposition steht, wird klar: mehrere Zeilen pro Bestellung. 
Namen/Werte sind atomar. 1NF ist erfüllt (beliebig viele Zeilen, jeder Wert atomar).

### 2NF
Schlüssel: (bestell_id, artikel_id) ist der Kandidatenschlüssel.

Funktionale Abhängigkeiten:
- bestell_id, artikel_id → menge, einzelpreis, position_beschreibung, ...
- bestell_id → kunde_id, kunde_name, adresse, bestelldatum, status
- artikel_id → artikel_name, kategorie
- kunde_id → kunde_name, adresse
- status? eher wenig Redundanz
- plz/ort? Adresse abhängig von kunde_id

Da kunde_id/kunde_name/adresse/bestelldatum/status bereits von bestell_id alleine abhängen (Teilabhängigkeit), muss in 2NF zerlegt werden:

Tabelle 1: bestellung(bestell_id PK, kunde_id, bestelldatum, status)
Tabelle 2: artikel(artikel_id PK, artikel_name, kategorie)
Tabelle 3: bestellposition(bestell_id FK, artikel_id FK, menge, einzelpreis, PK(bestell_id,artikel_id))

Damit ist 2NF erfüllt.

### 3NF
In bestellung: kunde_id → kunde_name, adresse (transitiv, nicht nur über ganzen Schlüssel)
In bestellposition: einzelpreis/position? eher nicht transitiv zum Primärschlüssel, aber je nach Modellierung.

Weiter zerlegen:
Tabelle 1: bestellung(bestell_id PK, kunde_id FK, bestelldatum, status)
Tabelle 4: kunde(kunde_id PK, kunde_name, adresse_plz, adresse_ort, ...) 
Tabelle 2: artikel(artikel_id PK, artikel_name, kategorie_id FK)
Tabelle 5: kategorie(kategorie_id PK, kategorie_name)

Transitive Abhängigkeit: bestellung.kunde_id → kunde, artikel.kategorie_id → kategorie → 3NF erreicht.

## 2) Zwei Quiz-Tabellen bis 3NF

### A) seminar(sem_kurz, sem_lang, dozent_kurz, dozent_name, raum, tag, zeit)

1NF: atomar. 
Kandidatenschlüssel: (sem_kurz, dozent_kurz, tag, zeit, raum?) oder eindeutige Kombination. 
2NF: dozent_name nur von dozent_kurz abhängig → separat.
dozent(dozent_kurz PK, dozent_name)
seminar(sem_kurz PK, sem_lang, ...)
zuordnung(id/PK(sem_kurz,dozent_kurz,termin_id)?)
3NF: alles funktional nur vom Schlüssel abhängig → Dozent, Seminar, Termin, Raum etc. sauber getrennt.

Schema 3NF:
- dozent(dozent_id PK, dozent_kurz, dozent_name)
- seminar(sem_id PK, sem_kurz, sem_lang)
- raum(raum_id PK, raum_nr)
- termin(termin_id PK, tag, zeit)
- lehrveranstaltung(lv_id PK, sem_id FK, dozent_id FK, termin_id FK, raum_id FK, UNIQUE(termin_id,raum_id))

Grund: dozent_name hängt nur von dozent_id, Raum/Termin separat.

### B) projekt(proj_nr, proj_name, ma_nr, ma_name, abteilung, stunden)

Kandidatenschlüssel (proj_nr, ma_nr)
Teilabhängigkeiten: proj_name nur proj_nr; ma_name/abteilung nur ma_nr.
3NF:
- mitarbeiter(ma_nr PK, ma_name, abt_id FK)
- abteilung(abt_id PK, abt_name)
- projekt(proj_nr PK, proj_name)
- projekt_mitarbeiter(proj_nr FK, ma_nr FK, stunden, PK(proj_nr,ma_nr))