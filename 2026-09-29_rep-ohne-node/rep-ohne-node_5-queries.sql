-- rep-ohne-node: 5 Queries als .sql
-- 1. Top-Künstler nach Track-Anzahl (JOIN + GROUP BY + ORDER BY + LIMIT)
SELECT k.name, COUNT(*) AS tracks
FROM kuenstler k JOIN song s ON s.kuenstler_id = k.id
GROUP BY k.id
ORDER BY tracks DESC, k.name ASC
LIMIT 5;

-- 2. Künstlerpaare desselben Labels (Self-JOIN, keine Doppelpaare)
SELECT x.name AS a, y.name AS b, l.name AS label
FROM kuenstler x
JOIN kuenstler y ON x.label_id = y.label_id AND x.id < y.id
JOIN label l ON l.id = x.label_id
ORDER BY label, a, b;

-- 3. Labels mit mehr als einem Künstler (JOIN + GROUP BY + HAVING)
SELECT l.name, COUNT(*) AS anzahl
FROM kuenstler k JOIN label l ON l.id = k.label_id
GROUP BY l.id
HAVING COUNT(*) > 1
ORDER BY anzahl DESC, l.name ASC;

-- 4. COUNT(*) vs. COUNT(label_id): NULL-Werte zählen nicht mit
SELECT COUNT(*) AS alle, COUNT(label_id) AS mit_label
FROM kuenstler;

-- 5. WHERE + HAVING kombiniert: lange Songs (>200 s) je Künstler, nur mit >= 2 langen Songs
SELECT k.name, COUNT(*) AS anzahl_lange
FROM kuenstler k JOIN song s ON s.kuenstler_id = k.id
WHERE s.dauer_sek > 200
GROUP BY k.id
HAVING COUNT(*) >= 2
ORDER BY anzahl_lange DESC, k.name ASC;