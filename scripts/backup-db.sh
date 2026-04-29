#!/bin/bash
# Backup automático de la BD — ejecutar con cron:
# 0 3 * * * /var/www/backendavant/scripts/backup-db.sh >> /var/log/avantservice-backup.log 2>&1

set -euo pipefail

# Cargar variables del .env
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_NAME="${DB_NAME:-backendavant}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/avantservice}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

FILENAME="$BACKUP_DIR/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql.gz"

mysqldump \
    -h "$DB_HOST" \
    -u "$DB_USER" \
    ${DB_PASS:+-p"$DB_PASS"} \
    --single-transaction \
    --routines \
    --triggers \
    "$DB_NAME" | gzip > "$FILENAME"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup creado: $FILENAME ($(du -sh "$FILENAME" | cut -f1))"

# Borrar backups con más de KEEP_DAYS días
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backups antiguos (>$KEEP_DAYS días) eliminados."
