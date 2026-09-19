#!/bin/bash
# CyberMind Auto-Deploy Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_FILE="$REPO_DIR/deploy.log"

echo "[$(date)] 🚀 Starting auto-deploy in $REPO_DIR..." | tee -a "$LOG_FILE"

cd "$REPO_DIR"

# Pull latest code
echo "[$(date)] 📥 Fetching and pulling latest release/v1.0..." | tee -a "$LOG_FILE"
git fetch origin
git checkout release/v1.0
git pull origin release/v1.0 >> "$LOG_FILE" 2>&1

# Ensure data directory exists for JSON stores (CVE, IP, Firewall, QBR, alerts)
mkdir -p "$REPO_DIR/data"
echo "[$(date)] ✅ data/ directory ready" | tee -a "$LOG_FILE"

# Restore .env.local from root .env if present
if [ -f "$REPO_DIR/.env" ]; then
  cp "$REPO_DIR/.env" "$REPO_DIR/apps/analyst-console/.env.local"
  echo "[$(date)] ✅ Copied .env → apps/analyst-console/.env.local" | tee -a "$LOG_FILE"
fi

# Rebuild analyst-console
echo "[$(date)] 🔨 Compiling production build for analyst-console..." | tee -a "$LOG_FILE"
cd "$REPO_DIR/apps/analyst-console"
npm run build >> "$LOG_FILE" 2>&1

# Restart PM2
echo "[$(date)] 🔄 Restarting PM2 process (cybermind-console)..." | tee -a "$LOG_FILE"
(pm2 restart cybermind-console || pm2 restart all) >> "$LOG_FILE" 2>&1
pm2 save >> "$LOG_FILE" 2>&1

echo "[$(date)] ✅ Auto-deploy complete and live!" | tee -a "$LOG_FILE"
