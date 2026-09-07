#!/bin/bash
# ==============================================================================
# CyberMind OS — Automated Git Pull & Deployment Script
# Checks GitHub repository for new commits every execution.
# If changes are found, it pulls, seeds the DB, and rebuilds containers.
# ==============================================================================

set -e

# Directory configuration (adjust to repo location on server if needed)
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${1:-main}"

echo "=============================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking for updates on branch: $BRANCH in $REPO_DIR"
echo "=============================================================================="

cd "$REPO_DIR"

# Fetch latest commits from remote without merging
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

    echo "--> 2. Seeding database credentials..."
    if [ -f "services/identity/prisma/seed.js" ]; then
        DATABASE_URL="${DATABASE_URL:-postgresql://cybermind:cybermind_secret@localhost:5432/cybermind_identity}" \
        node services/identity/prisma/seed.js || echo "Warning: Seed script returned non-zero exit code"
    fi

    echo "--> 3. Building and updating Docker containers safely..."
    docker compose up -d --build --remove-orphans

    echo "--> 4. Pruning unused Docker images..."
    docker image prune -f

    echo "=============================================================================="
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment completed successfully!"
    echo "=============================================================================="
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No new changes detected. Server is up to date."
fi
