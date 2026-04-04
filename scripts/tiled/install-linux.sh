#!/bin/bash
SRC="zxide-export.js"
DEST="$HOME/.config/tiled/extensions"

echo "Copiando $SRC a $DEST ..."
mkdir -p "$DEST"
cp "$SRC" "$DEST"

echo "Hecho."
