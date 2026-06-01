#!/usr/bin/env bash
# =============================================================================
# EcoSonar - MongoDB initialisation script
# =============================================================================
# This script runs once when the MongoDB container is first created.
# It creates a dedicated application user for the EcoSonar API.
#
# Required environment variables (set in docker-compose.yml via .env):
#   MONGO_USERNAME   — the app user to create
#   MONGO_PASSWORD   — the app user's password
#   MONGO_INITDB_ROOT_USERNAME / MONGO_INITDB_ROOT_PASSWORD are set
#   automatically by the mongo Docker image and used here for auth.
# =============================================================================

set -euo pipefail

echo ">>> Initialising EcoSonar MongoDB user..."

mongosh \
  --username "${MONGO_INITDB_ROOT_USERNAME}" \
  --password "${MONGO_INITDB_ROOT_PASSWORD}" \
  --authenticationDatabase admin \
  --eval "
    db = db.getSiblingDB('EcoSonar');
    db.createUser({
      user: '${MONGO_USERNAME}',
      pwd:  '${MONGO_PASSWORD}',
      roles: [{ role: 'readWrite', db: 'EcoSonar' }]
    });
    print('>>> User ${MONGO_USERNAME} created successfully on EcoSonar database.');
  "