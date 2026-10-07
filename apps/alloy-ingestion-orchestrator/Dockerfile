# syntax=docker/dockerfile:1
#
# apps/alloy-ingestion-orchestrator — AEF Ingestion Orchestrator.
# Deterministic workflow control plane for document ingestion, index rebuilds,
# verification, retrieval evals, and profile rotations.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f apps/alloy-ingestion-orchestrator/Dockerfile -t alloy-ingestion-orchestrator .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root. All Node
# stages use the pinned Node 26 image. Node 26 does not bundle Corepack, so pnpm
# is installed and verified explicitly.

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

# ─── Stage 2: builder (install + filtered build) ─────────────────────────────
FROM pnpm-base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY ./ ./
ENV NODE_ENV=production
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts --prod=false
RUN pnpm turbo run build --filter=@workspace/alloy-ingestion-orchestrator
RUN pnpm --filter @workspace/alloy-ingestion-orchestrator deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/apps/alloy-ingestion-orchestrator/dist ./dist
COPY --from=builder --chown=app:app /app/apps/alloy-ingestion-orchestrator/package.json ./package.json

USER app

ENV NODE_ENV=production \
    PORT=3003
# Server binds process.env.PORT, defaulting to 3003 (src/server.ts).
EXPOSE 3003

# Readiness is the traffic contract; production intentionally remains unhealthy
# until durable storage and evidence-ledger prerequisites are wired.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3003)+'/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# start script: node --enable-source-maps dist/server.js
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-ingestion-orchestrator" \
      org.opencontainers.image.description="AEF Ingestion Orchestrator — deterministic workflow control plane for document ingestion, index rebuilds, verification, retrieval evals, and profile rotations." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
