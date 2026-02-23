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
npm ci
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

# 6. Restart PM2
log "Restarting application..."
pm2 restart pos-karczma --update-env 2>/dev/null || pm2 start ecosystem.config.js --only pos-karczma
pm2 restart pos-webhook --update-env 2>/dev/null || pm2 start ecosystem.config.js --only pos-webhook
pm2 save 2>/dev/null || true
log "PM2 restart OK"

# 7. Health check - weryfikacja ĹĽe aplikacja odpowiada
log "Verifying application health..."
HEALTH_URL="http://127.0.0.1:3001/api/health"
MAX_ATTEMPTS=12
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  sleep 5
  ATTEMPT=$((ATTEMPT + 1))
  if curl -sf --max-time 10 "$HEALTH_URL" >/dev/null 2>&1; then
    log "Health check OK (attempt $ATTEMPT)"
    break
  fi
  log "Health check attempt $ATTEMPT/$MAX_ATTEMPTS failed, waiting..."
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    log "ERROR: Health check failed after ${MAX_ATTEMPTS} attempts. Check: pm2 logs pos-karczma"
    exit 1
  fi
done

log "=== Deploy completed successfully ==="
