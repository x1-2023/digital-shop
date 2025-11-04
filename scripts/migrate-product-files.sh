#!/bin/bash

# Migrate product files from public/products/ to uploads/products/

echo "🔄 Migrating product files to uploads/products/..."
echo ""

# Ensure uploads/products directory exists
mkdir -p uploads/products

# Count files to migrate
file_count=$(find public/products -maxdepth 1 -name "combolist-*.txt" 2>/dev/null | wc -l)

if [ "$file_count" -eq 0 ]; then
  echo "✅ No product files found in public/products/ - nothing to migrate"
  exit 0
fi

echo "📊 Found $file_count product file(s) to migrate"
echo ""

# Move all combolist-*.txt files
migrated=0
for file in public/products/combolist-*.txt; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "  Moving $filename..."
    mv "$file" "uploads/products/$filename"
    migrated=$((migrated + 1))
  fi
done

echo ""
echo "✅ Migration complete!"
echo "   Migrated: $migrated file(s)"
echo ""
echo "Note: Product images remain in public/products/images/ for browser access"
