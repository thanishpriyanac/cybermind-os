#!/bin/bash
# Adds `export const runtime = 'edge'` to all Next.js route.ts files
# that don't already have it, for Cloudflare Workers compatibility.

ROUTES_DIR="/home/thanish/.gemini/antigravity/scratch/cybermind-os/apps/analyst-console/src"
RUNTIME_LINE="export const runtime = 'edge';"
ADDED=0
SKIPPED=0

# Also handle dynamic page files listed in the error
PAGE_FILES=(
  "src/app/cve/[id]/page.tsx"
  "src/app/firewall/[id]/page.tsx"
  "src/app/firewall/[id]/qbr/page.tsx"
  "src/app/investigations/[id]/page.tsx"
  "src/app/qbr/[id]/page.tsx"
  "src/app/vapt/[id]/page.tsx"
)

cd /home/thanish/.gemini/antigravity/scratch/cybermind-os/apps/analyst-console

echo "📦 Processing route.ts files..."
while IFS= read -r file; do
  if grep -q "export const runtime" "$file"; then
    echo "  ⏭️  SKIP (already has runtime): $file"
    ((SKIPPED++))
  else
    # Prepend the runtime export at the top of the file
    tmpfile=$(mktemp)
    echo "$RUNTIME_LINE" > "$tmpfile"
    cat "$file" >> "$tmpfile"
    mv "$tmpfile" "$file"
    echo "  ✅ ADDED runtime to: $file"
    ((ADDED++))
  fi
done < <(find src/app/api -name "route.ts" -type f)

echo ""
echo "📦 Processing dynamic page files..."
for pagefile in "${PAGE_FILES[@]}"; do
  if [ -f "$pagefile" ]; then
    if grep -q "export const runtime" "$pagefile"; then
      echo "  ⏭️  SKIP (already has runtime): $pagefile"
      ((SKIPPED++))
    else
      tmpfile=$(mktemp)
      echo "$RUNTIME_LINE" > "$tmpfile"
      cat "$pagefile" >> "$tmpfile"
      mv "$tmpfile" "$pagefile"
      echo "  ✅ ADDED runtime to: $pagefile"
      ((ADDED++))
    fi
  fi
done

echo ""
echo "✅ Done! Added: $ADDED files | Skipped: $SKIPPED files"
