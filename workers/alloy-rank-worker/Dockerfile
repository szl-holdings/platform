# syntax=docker/dockerfile:1
#
# workers/alloy-rank-worker — Alloy Embedding Fabric cross-encoder reranking
# worker. Runs per-profile cross-encoder scoring in CPU mode with a lightweight
# fallback (score inversion) when no model is loaded.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f workers/alloy-rank-worker/Dockerfile -t alloy-rank-worker .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root. Build
# stages use node:24 (root engines require node>=24, engine-strict=true);
# runtime uses the mandated node:22.
#
# NOTE: package.json defines "start": "tsx src/server.ts" and has NO "build"
# script. tsconfig has outDir ./dist + rootDir ./src + composite references, so
# this image compiles with `tsc --build` and runs compiled output. Adding a
# "build" script to package.json would make this explicit — flagged for founder.

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered tsc --build) ───────────────────────
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./ ./
ENV NODE_ENV=production
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts
RUN pnpm --filter @workspace/alloy-rank-worker exec tsc --build tsconfig.json
RUN pnpm --filter @workspace/alloy-rank-worker deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/workers/alloy-rank-worker/dist ./dist
COPY --from=builder --chown=app:app /app/workers/alloy-rank-worker/package.json ./package.json

USER app

ENV NODE_ENV=production \
    AEF_RANK_WORKER_PORT=4203
# Server binds AEF_RANK_WORKER_PORT, falling back to PORT, default 4203
# (src/server.ts).
EXPOSE 4203

# /health exists (src/server.ts; no /healthz alias) — probe /health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.AEF_RANK_WORKER_PORT||process.env.PORT||4203)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Compiled entry (tsx start runs src/server.ts -> dist/server.js after build).
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-rank-worker" \
      org.opencontainers.image.description="Alloy Embedding Fabric — cross-encoder reranking worker. Runs per-profile cross-encoder scoring in CPU mode with a lightweight fallback mode (score inversion) when no model is loaded. Accepts candidates from the hybrid-search pipeline and returns ranked results with score breakdowns." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
