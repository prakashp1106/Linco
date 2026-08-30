#!/usr/bin/env bash
# LINCO Point-in-Time Firestore Recovery Script
# Usage: ./restore_firestore.sh gs://linco-ai-production-firestore-backups/2026-08-30_12-00-00

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Error: Backup GCS URI required."
  echo "Usage: $0 gs://<bucket-name>/<timestamp-folder>"
  exit 1
fi

BACKUP_URI="$1"
PROJECT_ID="${FIREBASE_PROJECT_ID:-linco-ai-production}"

echo "⚠️  WARNING: POINT-IN-TIME RECOVERY OPERATION"
echo "Project:    ${PROJECT_ID}"
echo "Source URI: ${BACKUP_URI}"
read -p "Are you sure you want to restore Firestore data? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore aborted by operator."
  exit 0
fi

gcloud config set project "${PROJECT_ID}"

# Import database collections
gcloud firestore import "${BACKUP_URI}"

echo "✅ Point-in-time recovery completed successfully from ${BACKUP_URI}"
