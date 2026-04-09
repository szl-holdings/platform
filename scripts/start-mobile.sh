#!/usr/bin/env bash
# start-mobile.sh — Start a single Expo mobile app on demand
#
# Usage:
#   ./scripts/start-mobile.sh <app-name>
#
# Available apps:
#   aegis-mobile         Aegis Mobile — SOC Command Center
#   carlota-jo-mobile    Carlota Jo — Client App
#   lyte-mobile          Lyte Mobile — AIOps Command
#   stephen-mobile       Stephen — Personal Command
#   szl-holdings-mobile  SZL Holdings — Executive Command
#   terra-mobile         Terra Mobile — Field Intelligence
#   vessels-mobile       Vessels — Fleet Command Mobile
#
# Example:
#   ./scripts/start-mobile.sh aegis-mobile

set -euo pipefail

VALID_APPS=(
  aegis-mobile
  carlota-jo-mobile
  lyte-mobile
  stephen-mobile
  szl-holdings-mobile
  terra-mobile
  vessels-mobile
)

APP="${1:-}"

if [[ -z "$APP" ]]; then
  echo "Usage: $0 <app-name>"
  echo ""
  echo "Available apps:"
  for a in "${VALID_APPS[@]}"; do
    echo "  $a"
  done
  exit 1
fi

VALID=false
for a in "${VALID_APPS[@]}"; do
  if [[ "$a" == "$APP" ]]; then
    VALID=true
    break
  fi
done

if [[ "$VALID" != "true" ]]; then
  echo "Unknown app: $APP"
  echo "Run '$0' with no arguments to see available apps."
  exit 1
fi

echo "Starting $APP..."
exec pnpm --filter "@workspace/$APP" run dev
