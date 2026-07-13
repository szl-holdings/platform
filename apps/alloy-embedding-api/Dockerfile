# syntax=docker/dockerfile:1
#
# apps/alloy-embedding-api — Alloy Embedding Fabric REST API gateway.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f apps/alloy-embedding-api/Dockerfile -t alloy-embedding-api .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root, so the
# build context must be the root. Build stages use node:24 (root engines
# require node>=24, engine-strict=true); runtime uses the mandated node:22.

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered build) ─────────────────────────────
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/alloy-embedding-api/ ./apps/alloy-embedding-api/
COPY lib/ ./lib/
COPY packages/ ./packages/ 2>/dev/null || true
# Per-file COPY — Doctrine v11 (no COPY . .)
ENV NODE_ENV=production
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts
RUN pnpm --filter @workspace/alloy-embedding-api build
RUN pnpm --filter @workspace/alloy-embedding-api deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/apps/alloy-embedding-api/dist ./dist
COPY --from=builder --chown=app:app /app/apps/alloy-embedding-api/package.json ./package.json

USER app

ENV NODE_ENV=production \
    PORT=8766
# Server binds process.env.PORT, defaulting to 8766 (src/index.ts).
EXPOSE 8766

# /healthz exists (src/index.ts) — probe it.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8766)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# start script: node --enable-source-maps dist/index.js
CMD ["node", "--enable-source-maps", "dist/index.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-embedding-api" \
      org.opencontainers.image.description="Alloy Embedding Fabric — REST API gateway for embed, rerank, hybrid-search, ingest, index ops, and evals." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
