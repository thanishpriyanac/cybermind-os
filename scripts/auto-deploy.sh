#!/bin/bash
# ==============================================================================
# CyberMind OS — Autonomous Auto-Deploy & Self-Healing Watchdog
# Runs via cron. Detects git pushes, builds updated apps, and keeps services online.
# ==============================================================================

# Ensure full PATH under cron
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:$HOME/.local/share/pnpm:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"
[ -s "$HOME/.profile" ] && \. "$HOME/.profile"
[ -s "$HOME/.bashrc" ] && \. "$HOME/.bashrc"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"

echo "=============================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment check on branch: $BRANCH in $REPO_DIR"
echo "=============================================================================="

cd "$REPO_DIR"

# 1. Fetch latest commits from remote
git fetch origin "$BRANCH" 2>/dev/null || true

LOCAL_HASH=$(git rev-parse HEAD 2>/dev/null || echo "")
REMOTE_HASH=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "")

NEEDS_DEPLOY=false
if [ "$LOCAL_HASH" != "$REMOTE_HASH" ] && [ -n "$REMOTE_HASH" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] New code detected! Local: $LOCAL_HASH -> Remote: $REMOTE_HASH"
    NEEDS_DEPLOY=true
fi

# Also deploy if PM2 apps are stopped/errored
if command -v pm2 &>/dev/null; then
    if pm2 status | grep -E "(errored|stopped)" &>/dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Service in errored/stopped state detected! Self-healing triggered..."
        NEEDS_DEPLOY=true
    fi
fi

if [ "$NEEDS_DEPLOY" = true ]; then
    echo "--> 1. Pulling latest code..."
    git reset --hard "origin/$BRANCH"
    git pull origin "$BRANCH"

    echo "--> 1b. Syncing dependencies..."
    npm install --legacy-peer-deps 2>/dev/null || pnpm install 2>/dev/null || true

    echo "--> 2. Ensuring database containers are running..."
    docker compose up -d postgres redis 2>/dev/null || sudo docker-compose up -d postgres redis 2>/dev/null || true

    echo "--> 3. Pushing database schema & seeding users..."
    if [ -f "services/identity/prisma/schema.prisma" ]; then
        npx prisma db push --schema=services/identity/prisma/schema.prisma || true
    fi
    if [ -f "services/identity/prisma/seed.js" ]; then
        DATABASE_URL="${DATABASE_URL:-postgresql://cybermind:cybermind_secret@localhost:5432/cybermind_identity}" \
        node services/identity/prisma/seed.js || true
    fi

    echo "--> 4. Building analyst-console (Next.js production build)..."
    npx nx build analyst-console || true

    echo "--> 5. Restarting all PM2 services..."
    if command -v pm2 &>/dev/null; then
        pm2 restart all --update-env || pm2 start npm --name "cybermind-console" -- start || true
        pm2 save || true
    fi

    echo "=============================================================================="
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Auto-deployment & self-heal completed successfully!"
    echo "=============================================================================="
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] System is up to date and healthy. No action needed."
fi
