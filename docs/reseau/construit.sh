#!/bin/sh
# Reconstruire l'interface de Mechmoum et la copier dans /reseau/ (sans toucher à /reseau/api/).
# Usage : sh docs/reseau/construit.sh   (depuis la racine du dépôt ; il faut Node 20+ et npm)
set -e
RACINE=$(pwd)
TMP=$(mktemp -d)
cp -r docs/reseau/front/. "$TMP/"
cd "$TMP" && npm ci --no-audit --no-fund && NEXT_TELEMETRY_DISABLED=1 npx next build
cd "$RACINE/reseau" && find . -mindepth 1 -maxdepth 1 ! -name api -exec rm -rf {} +
cp -r "$TMP/out/." "$RACINE/reseau/"
rm -rf "$TMP"
echo "Interface reconstruite dans reseau/ : vérifier, puis version.sh, commit et push."
