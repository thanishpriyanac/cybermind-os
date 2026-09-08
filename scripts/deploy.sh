#!/bin/bash
# CyberMind Auto-Deploy Script
# Runs detached from the Node process so PM2 restart doesn't kill it

set -e

REPO_DIR="/home/vellprint/CyberMind/cybermind-os"
LOG_FILE="$REPO_DIR/deploy.log"

echo "[$(date)] 🚀 Starting auto-deploy..." >> "$LOG_FILE"

cd "$REPO_DIR"

# Pull latest code
git pull origin release/v1.0 >> "$LOG_FILE" 2>&1

# Ensure data directory exists for JSON stores (CVE, IP, Firewall, QBR)
mkdir -p "$REPO_DIR/data"
echo "[$(date)] ✅ data/ directory ready" >> "$LOG_FILE"

# Restore .env.local from root .env (gitignored — must be on server manually)
if [ -f ".env" ]; then
  cat .env > apps/analyst-console/.env.local
  echo "[$(date)] ✅ Copied .env → apps/analyst-console/.env.local" >> "$LOG_FILE"
else
  echo "[$(date)] ⚠️  WARNING: No .env found! API keys may be missing." >> "$LOG_FILE"
fi

# Rebuild
npx nx build analyst-console >> "$LOG_FILE" 2>&1

# Restart PM2
pm2 restart cybermind-console >> "$LOG_FILE" 2>&1
pm2 save >> "$LOG_FILE" 2>&1

echo "[$(date)] ✅ Auto-deploy complete!" >> "$LOG_FILE"
