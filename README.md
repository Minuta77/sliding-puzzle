Sliding Puzzle (15‑Puzzle)
=========================

Kleines Offline-Webprojekt: 3×3 / 4×4 / 5×5 Sliding Puzzle, das ein lokales Bild in Kacheln zerlegt.

Dateien
- index.html — Hauptseite
- styles.css — Styling
- script.js — Logik (konfigurierbar: DEFAULT_IMAGE, DEFAULT_SIZE)
- README.md — diese Datei

Schnellstart (offline)
1. Öffne `sliding-puzzle/index.html` im Browser (keine Server nötig).
2. Standardmäßig verwendet es `puzzle.jpg` im selben Verzeichnis, falls vorhanden.
3. Du kannst ein anderes Bild via "Bild"-Eingabe hochladen.

Konfiguration dauerhaft
- Lege ein Bild `puzzle.jpg` in das `sliding-puzzle`-Verzeichnis, oder ändere `DEFAULT_IMAGE` in `script.js`.
- Ändere `DEFAULT_SIZE` in `script.js` auf 3 oder 5, wenn du eine andere Standardgröße möchtest.

Hinweise
- Die "Mischen"-Funktion arbeitet durch viele zufällige, erlaubte Züge und garantiert so Lösbarkeit.
- Die Darstellung nutzt `background-image` + `background-position`, somit werden keine Bilder zerschnitten.
- Responsive: das Puzzle passt sich der Bildschirmgröße an.

Viel Spaß und alles Gute zum Geburtstag! ❤️
