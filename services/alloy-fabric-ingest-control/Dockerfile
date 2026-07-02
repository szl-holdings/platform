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
# pnpm workspace: workspace:* siblings only resolve from the repo root. Build
# stages use node:24 (root engines require node>=24, engine-strict=true);
# runtime uses the mandated node:22.
#
# NOTE: package.json defines "start": "tsx src/server.ts" and has NO "build"
# script. tsconfig has outDir ./dist + rootDir ./src + references, so this
# image compiles with `tsc --build` and runs the compiled output. Adding a
# "build" script to package.json would make this explicit — flagged for founder.

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM node:26-alpine@sha256:725aeba2364a9b16beae49e180d83bd597dbd0b15c47f1f28875c290bfd255b9 AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered tsc --build) ───────────────────────
FROM node:26-alpine@sha256:725aeba2364a9b16beae49e180d83bd597dbd0b15c47f1f28875c290bfd255b9 AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./ ./
ENV NODE_ENV=production
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts
RUN pnpm --filter @workspace/alloy-fabric-ingest-control exec tsc --build tsconfig.json
RUN pnpm --filter @workspace/alloy-fabric-ingest-control deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:725aeba2364a9b16beae49e180d83bd597dbd0b15c47f1f28875c290bfd255b9 AS runtime
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

# /healthz exists (src/server.ts) — probe it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.AEF_INGEST_CONTROL_PORT||process.env.PORT||4201)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Compiled entry (tsx start runs src/server.ts -> dist/server.js after build).
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-fabric-ingest-control" \
      org.opencontainers.image.description="Alloy Embedding Fabric — ingestion control service. Orchestrates ingest_document, rebuild_index, verify_index_health, run_retrieval_eval, and rotate_profile_version workflows with approval gates and audit emission." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
