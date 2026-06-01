#!/usr/bin/env bash
# =============================================================================
# EcoSonar - Build the SonarQube plugin
# =============================================================================
# Compiles the EcoSonar-SonarQube plugin using Maven.
# The resulting JAR is placed in EcoSonar-SonarQube/target/ and picked up
# by docker-compose.yml when mounting the plugin into the SonarQube container.
#
# Usage:
#   ./tool_build.sh [API_URL]
#
#   API_URL  (optional) Base URL of the EcoSonar API.
#            Defaults to REACT_APP_BASE_URL_ECOSONAR_API from .env,
#            or http://localhost:3000 if neither is set.
#
# Examples:
#   ./tool_build.sh
#   ./tool_build.sh http://my-api.example.com
# =============================================================================
set -euo pipefail
# -----------------------------------------------------------------------------
# Load .env if present (silently ignored if not found)
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
if [[ -f "${ENV_FILE}" ]]; then
  # Export only the variable we need; avoid polluting the environment
  REACT_APP_BASE_URL_ECOSONAR_API=$(grep -E '^REACT_APP_BASE_URL_ECOSONAR_API=' "${ENV_FILE}" | cut -d '=' -f2- | tr -d '"' || true)
fi
# -----------------------------------------------------------------------------
# Resolve API URL: CLI arg > .env > default
# -----------------------------------------------------------------------------
API_URL="${1:-${REACT_APP_BASE_URL_ECOSONAR_API:-http://localhost:3000}}"
echo "============================================="
echo " EcoSonar - Building SonarQube plugin"
echo " API URL : ${API_URL}"
echo "============================================="
# -----------------------------------------------------------------------------
# Check prerequisites
# -----------------------------------------------------------------------------
if ! command -v mvn &> /dev/null; then
  echo "[ERROR] Maven (mvn) is not installed or not in PATH." >&2
  echo "        Install it from https://maven.apache.org/install.html" >&2
  exit 1
fi
PLUGIN_DIR="${SCRIPT_DIR}/EcoSonar-SonarQube"
if [[ ! -d "${PLUGIN_DIR}" ]]; then
  echo "[ERROR] Directory not found: ${PLUGIN_DIR}" >&2
  echo "        Make sure you are running this script from the repository root." >&2
  exit 1
fi
# -----------------------------------------------------------------------------
# Build
# -----------------------------------------------------------------------------
echo ""
echo "[1/1] Running Maven build..."
cd "${PLUGIN_DIR}"
export REACT_APP_BASE_URL_ECOSONAR_API="${API_URL}"
mvn clean package -DskipTests -Durl="${API_URL}"
echo ""
echo "============================================="
echo " Build complete."
echo " JAR location: EcoSonar-SonarQube/target/"
echo "============================================="