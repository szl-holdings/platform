#!/bin/bash
# WAYRA — Hatun-Willay daily digest runner (real systemd-invoked wrapper)
# Organ: WAYRA (4th organ, additive) · Author: Yachay · Zero Bandaid
# RECEIVE-ONLY: reads local Khipu IngestLog; writes digest to data/digests/.
set -euo pipefail
export TZ=America/New_York
WAYRA_HOME=/home/user/workspace/szl_wayra
cd "$WAYRA_HOME"
export PYTHONPATH="$WAYRA_HOME:${PYTHONPATH:-}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
echo "=== WAYRA daily digest run @ ${STAMP} (TZ=$TZ local=$(date)) ==="
/usr/bin/python3 "$WAYRA_HOME/daily_digest.py" --out-dir "$WAYRA_HOME/data/digests"
echo "=== run complete rc=$? ==="
