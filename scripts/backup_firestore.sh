#!/usr/bin/env bash
# LINCO Automated Cloud Firestore Backup Script
# Schedule via Cloud Scheduler or Cron

set -euo pipefail

PROJECT_ID="${FIREBASE_PROJECT_ID:-linco-ai-production}"
BUCKET_NAME="${FIREBASE_BACKUP_BUCKET:-gs://${PROJECT_ID}-firestore-backups}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_URI="${BUCKET_NAME}/${TIMESTAMP}"

echo "=========================================="
echo "Starting LINCO Firestore Automated Backup"
echo "Project:   ${PROJECT_ID}"
echo "Target:    ${OUTPUT_URI}"
echo "Timestamp: ${TIMESTAMP}"
echo "=========================================="

gcloud config set project "${PROJECT_ID}"

# Export all collections (posts, users, claims, notifications, audit_logs)
gcloud firestore export "${OUTPUT_URI}" \
  --collection-ids=posts,users,claims,notifications,audit_logs,matches

echo "✅ Backup successfully exported to ${OUTPUT_URI}"
