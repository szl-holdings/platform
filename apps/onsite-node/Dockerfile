# SZL On-Site Sovereign Node — Dockerfile
# Crusoe-style: "arrive pre-wired in a container; run on local wasted energy."
#
# DOCTRINE:
#   - No credentials committed; all secrets via env or Docker secrets at runtime.
#   - nvidia-smi is read from the HOST GPU (--gpus all / NVIDIA runtime in compose).
#     Without it, joules stay SAMPLE/ESTIMATE — honest and safe.
#   - The image carries only Python stdlib + this package; no third-party deps
#     with network egress at build time.
#
# Build:
#   docker build -t szl-onsite-node:latest .
#
# Run (see docker-compose.yml for the canonical invocation):
#   docker run --rm --gpus all \
#     -e HOME_URL=https://a11oy.net \
#     -e NODE_LAT=52.5 -e NODE_LON=13.4 \
#     -e CONSENT_TOKEN=<your-signed-token> \
#     -p 9101:9101 \
#     szl-onsite-node:latest

FROM python:3.12-slim

LABEL maintainer="szl-holdings" \
      org.opencontainers.image.title="szl-onsite-node" \
      org.opencontainers.image.description="SZL on-site sovereign node: harvest local wasted energy, run bounded compute, send results home." \
      org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.version="1.0.0"

# ---- system deps ---------------------------------------------------------
# We add nvidia-smi probe support via the nvidia-container-toolkit on the HOST.
# The container itself only needs Python.  curl is added for healthcheck only.
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# ---- app source ----------------------------------------------------------
WORKDIR /app

# Copy the onsite-node package
COPY apps/onsite-node/ ./onsite-node/

# Copy the agentic-gpu sibling modules (harvest, scheduler, daemon, etc.)
# These are the existing built pieces the node_agent composes.
COPY apps/agentic-gpu/ ./agentic-gpu/

# Make agentic-gpu modules importable alongside onsite-node
ENV PYTHONPATH="/app/agentic-gpu:/app/onsite-node:${PYTHONPATH:-}"

# ---- env defaults (NEVER commit real values) -----------------------------
# Operators MUST override these at runtime via docker-compose secrets or -e flags.
ENV HOME_URL=""
ENV NODE_LAT="52.5"
ENV NODE_LON="13.4"
ENV SITE_NAME="onsite-node-1"
ENV BIND_ADDR="0.0.0.0"
ENV BIND_PORT="9101"
# CONSENT_TOKEN and RECEIPT_SIGN_KEY MUST be set at runtime — not here.
# MAX_JOULES_PER_WINDOW: conservative 1-hour budget default (SAMPLE)
ENV MAX_JOULES_PER_WINDOW="3600"

# ---- healthcheck ---------------------------------------------------------
# /health from node_thermal_agent on BIND_PORT
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -sf "http://localhost:${BIND_PORT}/health" || exit 1

# ---- entrypoint ----------------------------------------------------------
# supervisord-style: run both agents. For production, use docker-compose with
# separate services (see docker-compose.yml). This single-image entrypoint uses
# a shell wrapper to run both in parallel.
COPY apps/onsite-node/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 9101

ENTRYPOINT ["/app/entrypoint.sh"]
