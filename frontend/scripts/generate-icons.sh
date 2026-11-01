#!/usr/bin/env bash
# Nécessite : ImageMagick (apt install imagemagick)
# Usage : ./scripts/generate-icons.sh chemin/vers/logo-512.png

set -e
SRC="${1:-logo-512.png}"
DEST="client/public/icons"
mkdir -p "$DEST"

for size in 72 96 128 144 152 192 384 512; do
  convert "$SRC" -resize "${size}x${size}" "$DEST/icon-${size}.png"
  echo "✓ icon-${size}.png"
done

# Version maskable (avec padding pour éviter le crop)
convert "$SRC" -resize 410x410 -background "#1e3a8a" -gravity center \
  -extent 512x512 "$DEST/icon-maskable-512.png"
echo "✓ icon-maskable-512.png"

echo "Icônes générées dans $DEST"