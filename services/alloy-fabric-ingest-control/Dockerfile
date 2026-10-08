# syntax=docker/dockerfile:1
#
# services/alloy-fabric-ingest-control — Alloy Embedding Fabric ingestion
# control service. Orchestrates ingest_document, rebuild_index,
# verify_index_health, run_retrieval_eval, and rotate_profile_version
# workflows with approval gates and audit emission.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f services/alloy-fabric-ingest-control/Dockerfile -t alloy-fabric-ingest-control .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root. All Node
# stages use the pinned Node 26 image. Node 26 does not bundle Corepack, so pnpm
# is installed and verified explicitly.
#
# The image compiles the workspace references and runs the emitted JavaScript.
# Production readiness intentionally remains on HOLD until tenant-scoped durable
# workflow state and a qualified evidence ledger replace the local JSON files.

# ─── Shared pinned package-manager base ───────────────────────────────────────
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS pnpm-base
ARG PNPM_VERSION=10.26.1
RUN apk add --no-cache libc6-compat \
    && npm install --global "pnpm@${PNPM_VERSION}" \
    && test "$(pnpm --version)" = "${PNPM_VERSION}"
WORKDIR /app

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM pnpm-base AS deps
COPY pnpm-lock.yaml .npmrc ./
COPY patches/ ./patches/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered tsc --build) ───────────────────────
FROM pnpm-base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY ./ ./
ENV NODE_ENV=production
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts --prod=false
RUN pnpm --filter @workspace/alloy-fabric-ingest-control exec tsc --build --force tsconfig.json
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    node scripts/ci/deploy-production.mjs @workspace/alloy-fabric-ingest-control /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/services/alloy-fabric-ingest-control/dist ./dist
COPY --from=builder --chown=app:app /app/services/alloy-fabric-ingest-control/package.json ./package.json

USER app

ENV NODE_ENV=production \
    AEF_INGEST_CONTROL_PORT=4201
# Server binds AEF_INGEST_CONTROL_PORT, falling back to PORT, default 4201
# (src/server.ts).
EXPOSE 4201

# /readyz is the readiness contract. It intentionally returns 503 in production
# while the service is on HOLD; /healthz remains a liveness-only endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.AEF_INGEST_CONTROL_PORT||process.env.PORT||4201)+'/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Compiled entry.
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-fabric-ingest-control" \
      org.opencontainers.image.description="Alloy Embedding Fabric ingest-control development surface; production remains on HOLD pending durable tenant state and evidence ledger." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
