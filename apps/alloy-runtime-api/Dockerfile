# syntax=docker/dockerfile:1
#
# apps/alloy-runtime-api — AEEP Alloy Runtime API
# unified v1 surface for tasks, memory, and workflow execution.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f apps/alloy-runtime-api/Dockerfile -t alloy-runtime-api .
#
# Building from the package directory alone fails: this is a pnpm workspace
# and the package declares workspace:* siblings that only resolve from root.
#
# Build-stage images use node:24 because the root engines field requires
# node>=24 with engine-strict=true (.npmrc); the runtime stage uses the
# mandated node:22-alpine — see the PR notes for this version discrepancy.

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
# pnpm fetch only needs the lockfile; it populates the virtual store so the
# install in the builder stage can run fully offline and stays cache-friendly.
COPY pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered build) ─────────────────────────────
FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
# Offline install against the fetched store, then compile only this package
# and its workspace dependency graph (tsc -p tsconfig.json -> ./dist).
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts
RUN pnpm --filter @workspace/alloy-runtime-api build
# Prune to production dependencies for the runtime stage.
RUN pnpm --filter @workspace/alloy-runtime-api deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:22-alpine AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
# uid/gid 1000 non-root user
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
# Production node_modules (resolved workspace deps) + compiled output only.
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/apps/alloy-runtime-api/dist ./dist
COPY --from=builder --chown=app:app /app/apps/alloy-runtime-api/package.json ./package.json

USER app

ENV NODE_ENV=production \
    PORT=4010
# Server binds process.env.PORT, defaulting to 4010 (src/server.ts).
EXPOSE 4010

# No /healthz endpoint exists in src/server.ts, so no HEALTHCHECK is declared
# (declaring one would be fake). Add a probe here once /healthz lands.

# start script: node --enable-source-maps dist/server.js
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-runtime-api" \
      org.opencontainers.image.description="AEEP Alloy Runtime API — unified v1 surface for tasks, memory, and workflow execution." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.vendor="SZL Holdings"
