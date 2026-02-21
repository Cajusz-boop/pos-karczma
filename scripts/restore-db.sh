#!/bin/bash
# =============================================================================
# POS Karczma Łabędź — Restore bazy danych MariaDB z backupu
# =============================================================================
#
# Użycie:
#   ./scripts/restore-db.sh backup_2026-02-17_030000.sql.gz
#   ./scripts/restore-db.sh backup_2026-02-17_030000.sql
#
# UWAGA: Ta operacja NADPISZE obecną bazę danych!
# =============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Użycie: $0 <plik_backupu>"
  echo "Przykład: $0 backups/backup_2026-02-17_030000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "BŁĄD: Plik nie istnieje: $BACKUP_FILE"
  exit 1
fi

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-pos_karczma}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"

# Build mysql command
MYSQL_CMD="mariadb"
if ! command -v mariadb &>/dev/null; then
  MYSQL_CMD="mysql"
fi

MYSQL_ARGS=(
  --host="$DB_HOST"
  --port="$DB_PORT"
  --user="$DB_USER"
  "$DB_NAME"
)

if [ -n "$DB_PASS" ]; then
  MYSQL_ARGS=(--password="$DB_PASS" "${MYSQL_ARGS[@]}")
fi

echo "==================================================="
echo "  RESTORE BAZY DANYCH"
echo "==================================================="
echo "  Plik:  $BACKUP_FILE"
echo "  Baza:  $DB_NAME @ $DB_HOST:$DB_PORT"
echo "==================================================="
echo ""
echo "UWAGA: Ta operacja NADPISZE obecną bazę danych!"
read -p "Kontynuować? (tak/nie): " CONFIRM

if [ "$CONFIRM" != "tak" ]; then
  echo "Anulowano."
  exit 0
fi

echo "[$(date)] Rozpoczynam restore..."

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "[$(date)] Dekompresja i import..."
  gunzip -c "$BACKUP_FILE" | $MYSQL_CMD "${MYSQL_ARGS[@]}"
else
  echo "[$(date)] Import..."
  $MYSQL_CMD "${MYSQL_ARGS[@]}" < "$BACKUP_FILE"
fi

echo "[$(date)] Restore zakończony pomyślnie!"
echo ""
echo "Następne kroki:"
echo "  1. Uruchom: npx prisma generate"
echo "  2. Zrestartuj aplikację: npm run dev"
