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
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
# pnpm fetch only needs the lockfile; it populates the virtual store so the
# install in the builder stage can run fully offline and stays cache-friendly.
COPY pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered build) ─────────────────────────────
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./ ./
ENV NODE_ENV=production
# Offline install against the fetched store, then compile only this package
# and its workspace dependency graph (tsc -p tsconfig.json -> ./dist).
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts
RUN pnpm --filter @workspace/alloy-runtime-api build
# Prune to production dependencies for the runtime stage.
RUN pnpm --filter @workspace/alloy-runtime-api deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Build provenance: pass these at build time so /healthz reports the exact
# commit and build the container was produced from, e.g.
#   docker build -f apps/alloy-runtime-api/Dockerfile \
#     --build-arg COMMIT_SHA=$(git rev-parse HEAD) \
#     --build-arg BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ) .
ARG COMMIT_SHA=unknown
ARG BUILD_TIMESTAMP
ARG BUILD_VERSION=0.1.0
# uid/gid 1000 non-root user
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
# Production node_modules (resolved workspace deps) + compiled output only.
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/apps/alloy-runtime-api/dist ./dist
COPY --from=builder --chown=app:app /app/apps/alloy-runtime-api/package.json ./package.json

USER app

ENV NODE_ENV=production \
    PORT=4010 \
    COMMIT_SHA=$COMMIT_SHA \
    BUILD_TIMESTAMP=$BUILD_TIMESTAMP \
    BUILD_VERSION=$BUILD_VERSION
# Server binds process.env.PORT, defaulting to 4010 (src/server.ts).
EXPOSE 4010

# Liveness probe against the real /healthz endpoint (src/health.ts). Uses the
# bundled node runtime (no curl/wget in the minimal image) and exits non-zero
# on a non-200 so the orchestrator restarts a wedged container.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||4010)+'/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# start script: node --enable-source-maps dist/server.js
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-runtime-api" \
      org.opencontainers.image.description="AEEP Alloy Runtime API — unified v1 surface for tasks, memory, and workflow execution." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.revision="$COMMIT_SHA" \
      org.opencontainers.image.vendor="SZL Holdings"
