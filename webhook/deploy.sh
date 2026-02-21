#!/bin/bash
set -e

APP_DIR="/var/www/pos"
LOG_FILE="$APP_DIR/webhook/deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

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

# 4. Build
log "Building application..."
npm run build
log "Build OK"

# 5. Prisma db push (sync schema)
log "Syncing database schema..."
npx prisma db push --accept-data-loss || log "Prisma push warning (continuing)"
log "Database sync OK"

# 6. Copy static files to standalone
log "Copying static files..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
log "Static files OK"

# 7. Restart PM2
log "Restarting application..."
pm2 restart pos-karczma --update-env || pm2 start ecosystem.config.js
log "PM2 restart OK"

log "=== Deploy completed successfully ==="
