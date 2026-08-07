#!/bin/bash
set -e
BACKUP="/tmp/shinnslist-build-$$"
cd "$(dirname "$0")/.."

echo "=== Building Shinnslist for Cloudflare Pages ==="

# Move dynamic routes out
echo "Moving dynamic routes..."
mkdir -p "$BACKUP"
for d in src/app/api/billing src/app/api/auth src/app/api/checkout src/app/api/push src/app/api/listings src/app/api/webhooks src/app/auth; do
  [ -d "$d" ] && mv "$d" "$BACKUP/" && echo "  → backed up $d"
done

# Build
echo ""
npm run build

# Restore
echo ""
echo "Restoring dynamic routes..."
for item in "$BACKUP"/*; do
  if [ -d "$item" ]; then
    name=$(basename "$item")
    target=""
    case "$name" in
      auth) target="src/app/auth" ;;
      billing) target="src/app/api/billing" ;;
      checkout) target="src/app/api/checkout" ;;
      push) target="src/app/api/push" ;;
      listings) target="src/app/api/listings" ;;
      webhooks) target="src/app/api/webhooks" ;;
      *) target="" ;;
    esac
    [ -n "$target" ] && mv "$item" "$target" && echo "  → restored $target"
  fi
done
rmdir "$BACKUP" 2>/dev/null || true

# Deploy
echo ""
echo "=== Deploying to Cloudflare Pages ==="
npx wrangler pages deploy out --project-name=shinnslist --commit-dirty=true
