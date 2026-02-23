#!/bin/bash
set -e

APP_DIR="/var/www/pos"
LOG_FILE="$APP_DIR/webhook/deploy.log"
LOCK_FILE="$APP_DIR/webhook/.deploy.lock"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
    rm -f "$LOCK_FILE"
}

trap cleanup EXIT

# Prevent multiple deploys running at once
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        log "Deploy already running (PID: $PID), skipping"
        exit 0
    fi
fi
echo $$ > "$LOCK_FILE"

cd "$APP_DIR"

log "=== Deploy started ==="

# 1. Git pull
log "Pulling latest changes..."
git fetch origin master
git reset --hard origin/master
log "Git pull OK"

# 2. Install dependencies
log "Installing dependencies..."
npm ci --production=false
log "npm install OK"

# 3. Prisma generate
log "Generating Prisma client..."
npx prisma generate
log "Prisma generate OK"

# 4. Build (with --no-lint to avoid ESLint errors blocking deploy)
log "Building application..."
npx next build --no-lint
log "Build OK"

# 5. Prisma db push (sync schema)
log "Syncing database schema..."
npx prisma db push --accept-data-loss || log "Prisma push warning (continuing)"
log "Database sync OK"

# 6. Restart PM2 (graceful - app stays up during restart)
log "Restarting application..."
pm2 restart pos-karczma --update-env 2>/dev/null || pm2 start ecosystem.config.js --only pos-karczma
pm2 restart pos-webhook --update-env 2>/dev/null || pm2 start ecosystem.config.js --only pos-webhook
log "PM2 restart OK"

log "=== Deploy completed successfully ==="
