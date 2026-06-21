# pub-info-display

Öffentliches Termin-Board für GitHub Pages (NAK Gemeinde Neustadt am Rübenberge).

## GitHub Pages

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **`main`**, Folder: **`/ (root)`**
4. URL: `https://ratfury.github.io/pub-info-display/`

## Lokale Vorschau

```bash
python3 -m http.server 8080
```

Dann: http://localhost:8080/

## Aktualisieren (vom Entwicklungsprojekt)

Termine in `info-display` importieren, dann Dateien hierher kopieren:

```bash
cd ../info-display
./scripts/import.sh
./scripts/publish.sh
cd ../pub-info-display
git add .
git commit -m "Update schedule"
git push
```
