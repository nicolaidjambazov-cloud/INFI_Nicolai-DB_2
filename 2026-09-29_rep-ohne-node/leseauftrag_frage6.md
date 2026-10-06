Frage 6 (schriftlich, 5–6 Sätze)

Da wir heute nur Deno mit eingebautem 
ode:sqlite ohne Node/npm und ohne Prisma-Adapter-Setup genutzt haben, konnte ich sehr direkt mit reinen SQL-Queries arbeiten und sehen, wie JOIN/GROUP BY/HAVING und COUNT(*) vs. COUNT(label_id) genau funktionieren. Genau das ist das Handwerk, das wir später beim Arbeiten mit einem ORM brauchen: Nur wenn ich weiß, was im SQL passiert (inkl. Self-JOIN, WHERE vs. HAVING, NULL-Verhalten), kann ich prüfen, ob das ORM die richtige Abfrage erzeugt.

Die Adapter-Pflicht von Prisma 7 (etter-sqlite3 nativ) plus der npm-„latest"-Zugriff auf einen 8.0.0-RC zeigt, dass die Toolchain derzeit noch etwas unruhig läuft – genau wie wir in der Stunde am Prisma-Scaffold gesehen haben. Deshalb halte ich es für sinnvoll, im Unterricht zuerst reines SQL zu fahren, um die Denkweise zu verinnerlichen.

Wenn wir später ein ORM einführen, würde ich eher zu Drizzle tendieren. Es ist „SQL-first“, typisiert, kleiner im Runtime-Umfang, erzeugt lesbares SQL und zwingt mich nicht, eine eigene Prisma-DSL zu lernen, während ich gleichzeitig im Deno/TypeScript-Umfeld bleibe. So bleibt SQL im Mittelpunkt und das ORM hilft eher „mitdenken“ statt „ersetzen“.