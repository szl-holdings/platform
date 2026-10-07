# syntax=docker/dockerfile:1
#
# apps/alloy-runtime-api — AEEP Alloy Runtime API development surface.
# Production execution remains on HOLD until durable backends are wired.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f apps/alloy-runtime-api/Dockerfile -t alloy-runtime-api .
#
# Building from the package directory alone fails: this is a pnpm workspace
# and the package declares workspace:* siblings that only resolve from root.
#
# All Node stages use the pinned Node 26 image, satisfying the root node>=24
# engine. Node 26 does not bundle Corepack, so pnpm is installed and verified
# explicitly.

# ─── Shared pinned package-manager base ───────────────────────────────────────
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS pnpm-base
ARG PNPM_VERSION=10.26.1
RUN apk add --no-cache libc6-compat \
    && npm install --global "pnpm@${PNPM_VERSION}" \
    && test "$(pnpm --version)" = "${PNPM_VERSION}"
WORKDIR /app

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM pnpm-base AS deps
# pnpm fetch only needs the lockfile; it populates the virtual store so the
# install in the builder stage can run fully offline and stays cache-friendly.
COPY pnpm-lock.yaml .npmrc ./
COPY patches/ ./patches/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered build) ─────────────────────────────
FROM pnpm-base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY ./ ./
ENV NODE_ENV=production
# Offline install against the fetched store, then compile only this package
# and its workspace dependency graph (tsc -p tsconfig.json -> ./dist).
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --offline --ignore-scripts --prod=false
RUN pnpm turbo run build --filter=@workspace/alloy-runtime-api
# Prune to production dependencies for the runtime stage.
RUN pnpm --filter @workspace/alloy-runtime-api deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS runtime
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
# ALLOY_API_KEY is intentionally not baked into the image. Inject it through
# the deployment secret manager and set ALLOY_API_TENANT_ID to the non-secret
# tenant scope authorized for that credential. Production startup fails before
# listen when either value is absent or blank.
# Server binds process.env.PORT, defaulting to 4010 (src/server.ts).
EXPOSE 4010

# Docker health follows traffic readiness. It intentionally remains unhealthy
# in production while the runtime is on HOLD; /healthz is still available as a
# separate liveness endpoint for orchestrators that distinguish the two.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||4010)+'/readyz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# start script: node --enable-source-maps dist/server.js
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-runtime-api" \
      org.opencontainers.image.description="AEEP Alloy Runtime API development surface; production execution remains on HOLD pending durable qualified backends." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.revision="$COMMIT_SHA" \
      org.opencontainers.image.vendor="SZL Holdings"
