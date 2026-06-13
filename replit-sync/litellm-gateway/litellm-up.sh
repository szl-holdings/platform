#!/usr/bin/env bash
# Light up the SZL unified inference gateway (no compose plugin needed).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
docker rm -f szl-litellm >/dev/null 2>&1 || true
docker run -d --name szl-litellm --restart unless-stopped \
  -p 127.0.0.1:4000:4000 \
  --env-file /opt/alloyscape/.env \
  --memory 700m --memory-swap 1200m \
  -v "$DIR/litellm.config.yaml:/app/config.yaml:ro" \
  ghcr.io/berriai/litellm:main-stable \
  --config /app/config.yaml --port 4000 --host 0.0.0.0
echo "szl-litellm starting on 127.0.0.1:4000 ; check: curl -s http://127.0.0.1:4000/health/liveliness"
