#!/bin/bash

# Script to update hardcoded colors to CSS variables for theme support
# This script updates common color patterns in component files

echo "Updating theme colors in component files..."

# Define the directories to update
DIRS=("components/groups" "components/shares" "app/share")

for DIR in "${DIRS[@]}"; do
  if [ -d "$DIR" ]; then
    echo "Processing $DIR..."

    # Find all .tsx files in the directory
    find "$DIR" -name "*.tsx" -type f | while read -r file; do
      echo "  Updating $file..."

      # Common replacements (most frequent patterns)
      # Background colors
      sed -i '' 's/bg-slate-950/bg-background/g' "$file"
      sed -i '' 's/bg-slate-900/bg-card/g' "$file"
      sed -i '' 's/bg-slate-800/bg-secondary/g' "$file"

      # Text colors
      sed -i '' 's/text-cyan-50/text-foreground/g' "$file"
      sed -i '' 's/text-cyan-100/text-foreground/g' "$file"
      sed -i '' 's/text-cyan-200/text-foreground/g' "$file"
      sed -i '' 's/text-cyan-300/text-primary/g' "$file"
      sed -i '' 's/text-cyan-400/text-primary/g' "$file"
      sed -i '' 's/text-cyan-500/text-primary/g' "$file"
      sed -i '' 's/text-slate-400/text-muted-foreground/g' "$file"
      sed -i '' 's/text-slate-500/text-muted-foreground/g' "$file"
      sed -i '' 's/text-slate-600/text-muted-foreground/g' "$file"

      # Border colors
      sed -i '' 's/border-cyan-800/border/g' "$file"
      sed -i '' 's/border-cyan-900/border/g' "$file"
      sed -i '' 's/border-slate-800/border/g' "$file"

      # Note: Some colors like cyan-500, fuchsia-400, etc. are kept for accent purposes
      # as they provide visual interest and don't need to change with theme
    done
  fi
done

echo "Theme color update complete!"
echo "Note: Some accent colors (purple, fuchsia, blue, etc.) were intentionally kept for visual interest."
echo "Please review the changes and test the application."
