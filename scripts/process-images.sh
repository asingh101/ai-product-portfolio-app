#!/bin/bash

SOURCE_DIR="/Users/singh/Desktop/Website/Assets/Photos/Bay Area AI Immersion"
TARGET_DIR="/Users/singh/Desktop/Website/portfolio-app/public/images/story"

mkdir -p "$TARGET_DIR"

# Convert HEIC to JPG
for f in "$SOURCE_DIR"/*.HEIC; do
  [ -e "$f" ] || continue
  filename=$(basename "$f" .HEIC)
  echo "Converting $filename.HEIC..."
  sips -s format jpeg "$f" --out "$TARGET_DIR/$filename.jpg" > /dev/null
done

# Copy JPG files
for f in "$SOURCE_DIR"/*.jpg; do
  [ -e "$f" ] || continue
  filename=$(basename "$f")
  echo "Copying $filename..."
  cp "$f" "$TARGET_DIR/"
done

echo "Done! All images are now in $TARGET_DIR"
