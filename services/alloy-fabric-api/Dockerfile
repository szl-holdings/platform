# syntax=docker/dockerfile:1
#
# services/alloy-fabric-api — Alloy Embedding Fabric primary REST API gateway.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f services/alloy-fabric-api/Dockerfile -t alloy-fabric-api .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root. Build
# stages use node:24 (root engines require node>=24, engine-strict=true);
# runtime uses the mandated node:22.
#
# NOTE: package.json defines "start": "tsx src/server.ts" and has NO "build"
# script. This package DOES carry a build-capable tsconfig (outDir ./dist,
# project references), so this image compiles it with `tsc --build` and runs
# the compiled output for a tsx-free production runtime. Adding a "build"
# script to package.json would make this explicit — flagged for the founder.

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM node:26-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered tsc --build) ───────────────────────
FROM node:26-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY services/alloy-fabric-api/ ./services/alloy-fabric-api/
COPY lib/ ./lib/
COPY packages/ ./packages/ 2>/dev/null || true
# Per-file COPY — Doctrine v11 (no COPY . .)
ENV NODE_ENV=production
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts
# No build script: compile this package + referenced projects via tsc --build.
RUN pnpm --filter @workspace/alloy-fabric-api exec tsc --build tsconfig.json
RUN pnpm --filter @workspace/alloy-fabric-api deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/services/alloy-fabric-api/dist ./dist
COPY --from=builder --chown=app:app /app/services/alloy-fabric-api/package.json ./package.json

USER app

ENV NODE_ENV=production \
    PORT=4200
# Server binds process.env.PORT, defaulting to 4200 (src/server.ts).
EXPOSE 4200

# /healthz exists (src/routes/health.ts) — probe it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4200)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Compiled entry (tsx start runs src/server.ts -> dist/server.js after build).
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-fabric-api" \
      org.opencontainers.image.description="Alloy Embedding Fabric — primary REST API gateway. Exposes /v1/embed, /v1/rerank, /v1/hybrid-search, /v1/ingest, /v1/index/rebuild, /v1/index/verify, /v1/evals/run, /v1/openai/embeddings; enforces bearer auth, tenant scoping, and policy guard on every request." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
