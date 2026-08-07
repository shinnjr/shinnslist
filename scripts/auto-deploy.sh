#!/bin/bash
# Continuous improvement loop — run this in a background terminal
# Every 5 minutes: rebuild, deploy, verify
set -e
cd ~/projects/freebie
while true; do
  echo "=== $(date) ==="
  if git diff --quiet && git diff --cached --quiet; then
    echo "No changes, skipping..."
  else
    echo "Changes detected, building..."
    bash scripts/build-deploy.sh 2>&1 | tail -5
    echo "Deploy complete: https://$(date +%s | md5 | head -c8).shinnslist.pages.dev"
  fi
  sleep 300
done
