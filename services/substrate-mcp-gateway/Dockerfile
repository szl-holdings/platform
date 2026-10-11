# syntax=docker/dockerfile:1
#
# services/substrate-mcp-gateway — Substrate MCP Gateway.
# Exposes the Sovereign Execution Substrate over the Model Context Protocol
# (HTTP+SSE and stdio transports). Pure transport layer; no business logic.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f services/substrate-mcp-gateway/Dockerfile -t substrate-mcp-gateway .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root. All Node
# stages use the pinned Node 26 image. Node 26 does not bundle Corepack, so pnpm
# is installed and verified explicitly.
#
# NOTE: package.json "start" runs tsx src/index.ts, but this package has a
# real build (tsc --build -> ./dist) and the src/index.ts header documents the
# production entry as `node dist/index.js`. This image runs the compiled
# output for a lean, tsx-free runtime.

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
# tsc --build compiles this package and its referenced workspace projects.
RUN pnpm --filter @szl/substrate-mcp-gateway exec tsc --build --force tsconfig.json
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    node scripts/ci/deploy-production.mjs @szl/substrate-mcp-gateway /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/services/substrate-mcp-gateway/dist ./dist
COPY --from=builder --chown=app:app /app/services/substrate-mcp-gateway/package.json ./package.json

USER app

ENV NODE_ENV=production \
    SUBSTRATE_GATEWAY_PORT=3700
# SUBSTRATE_GATEWAY_API_KEY and an exactly 64-hex SUBSTRATE_SIGNING_KEY are
# intentionally not baked into the image. Inject both through the deployment
# secret manager; production startup rejects missing, blank, or malformed keys.
# Server binds SUBSTRATE_GATEWAY_PORT, falling back to PORT, default 3700
# (src/index.ts). HTTP+SSE transport mounts at /mcp.
EXPOSE 3700

# Docker health reflects deployable readiness, including revocation sync and
# the production execution HOLD. `/healthz` remains liveness-only.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.SUBSTRATE_GATEWAY_PORT||process.env.PORT||3700)+'/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Production entry per src/index.ts header: node dist/index.js (HTTP+SSE).
CMD ["node", "--enable-source-maps", "dist/index.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@szl/substrate-mcp-gateway" \
      org.opencontainers.image.description="Substrate MCP Gateway — exposes the Sovereign Execution Substrate over the Model Context Protocol (HTTP+SSE and stdio transports). Pure transport layer; no business logic." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.vendor="SZL Holdings"
