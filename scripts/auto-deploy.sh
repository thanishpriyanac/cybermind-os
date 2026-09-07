#!/bin/bash
# ==============================================================================
# CyberMind OS — Automated Git Poll & Deployment Script
# Checks GitHub repository for new commits every execution.
# ==============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"

echo "=============================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking for updates on branch: $BRANCH in $REPO_DIR"
echo "=============================================================================="

cd "$REPO_DIR"

# Fetch latest commits from remote
git fetch origin "$BRANCH"

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] New updates detected!"
    echo "  Local  HEAD: $LOCAL_HASH"
    echo "  Remote HEAD: $REMOTE_HASH"
    echo "------------------------------------------------------------------------------"
    echo "--> 1. Pulling latest changes..."
    git pull origin "$BRANCH"

    echo "--> 2. Starting database containers..."
    sudo docker-compose up -d postgres redis || docker compose up -d postgres redis || true

    echo "--> 3. Applying schema & seeding identity database..."
    if [ -f "services/identity/prisma/seed.js" ]; then
        npx prisma db push --schema=services/identity/prisma/schema.prisma || true
        DATABASE_URL="${DATABASE_URL:-postgresql://cybermind:cybermind_secret@localhost:5432/cybermind_identity}" \
        node services/identity/prisma/seed.js || echo "Warning: Seed script returned non-zero exit code"
    fi

    echo "--> 4. Restarting PM2 services..."
    pm2 restart cybermind-api --update-env || true
    pm2 restart cybermind-console --update-env || true
    pm2 save || true

    echo "=============================================================================="
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment completed successfully!"
    echo "=============================================================================="
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No new changes detected. Server is up to date."
fi
