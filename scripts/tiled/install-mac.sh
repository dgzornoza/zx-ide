#!/bin/bash
SRC="zxide-export.js"
DEST="$HOME/Library/Preferences/Tiled/extensions"

echo "Copiando $SRC a $DEST ..."
mkdir -p "$DEST"
cp "$SRC" "$DEST"

echo "Hecho."
