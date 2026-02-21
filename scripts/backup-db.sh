#!/bin/bash
# =============================================================================
# POS Karczma Łabędź — Automatyczny backup bazy danych MariaDB
# =============================================================================
#
# Użycie:
#   ./scripts/backup-db.sh                    # backup z domyślnymi ustawieniami
#   ./scripts/backup-db.sh --keep 14          # zachowaj backupy z ostatnich 14 dni
#   ./scripts/backup-db.sh --output /mnt/nas  # zapisz na NAS
#
# Cron (codziennie o 3:00):
#   0 3 * * * /path/to/pos-karczma/scripts/backup-db.sh >> /var/log/pos-backup.log 2>&1
#
# Restore:
#   mariadb -u root -p pos_karczma < backup_2026-02-17_030000.sql
#   lub: ./scripts/restore-db.sh backup_2026-02-17_030000.sql.gz
# =============================================================================

set -euo pipefail

# Configuration (override via environment variables)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-pos_karczma}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
COMPRESS="${COMPRESS:-true}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --keep) KEEP_DAYS="$2"; shift 2 ;;
    --output) BACKUP_DIR="$2"; shift 2 ;;
    --no-compress) COMPRESS="false"; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate filename
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
FILENAME="backup_${TIMESTAMP}.sql"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Starting backup of ${DB_NAME}..."

# Build mysqldump command
DUMP_CMD="mariadb-dump"
if ! command -v mariadb-dump &>/dev/null; then
  DUMP_CMD="mysqldump"
fi

DUMP_ARGS=(
  --host="$DB_HOST"
  --port="$DB_PORT"
  --user="$DB_USER"
  --single-transaction
  --routines
  --triggers
  --events
  --add-drop-table
  --complete-insert
  "$DB_NAME"
)

if [ -n "$DB_PASS" ]; then
  DUMP_ARGS=(--password="$DB_PASS" "${DUMP_ARGS[@]}")
fi

# Execute dump
$DUMP_CMD "${DUMP_ARGS[@]}" > "$FILEPATH"

# Compress if enabled
if [ "$COMPRESS" = "true" ]; then
  gzip "$FILEPATH"
  FILEPATH="${FILEPATH}.gz"
  FILENAME="${FILENAME}.gz"
fi

# Get file size
SIZE=$(du -h "$FILEPATH" | cut -f1)
echo "[$(date)] Backup created: ${FILENAME} (${SIZE})"

# Cleanup old backups
if [ "$KEEP_DAYS" -gt 0 ]; then
  DELETED=$(find "$BACKUP_DIR" -name "backup_*.sql*" -mtime +"$KEEP_DAYS" -delete -print | wc -l)
  if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Deleted ${DELETED} old backup(s) (older than ${KEEP_DAYS} days)"
  fi
fi

echo "[$(date)] Backup complete: ${FILEPATH}"
