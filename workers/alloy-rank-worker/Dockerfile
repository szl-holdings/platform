# syntax=docker/dockerfile:1
#
# workers/alloy-rank-worker — Alloy Embedding Fabric development-only lexical
# overlap reranking worker. No qualified cross-encoder model is loaded.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f workers/alloy-rank-worker/Dockerfile -t alloy-rank-worker .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root. All Node
# stages use the pinned Node 26 image. Node 26 does not bundle Corepack, so pnpm
# is installed and verified explicitly.
#
# Production readiness intentionally remains on HOLD until a qualified,
# immutable reranking model artifact replaces the development heuristics.

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
RUN pnpm --filter @workspace/alloy-rank-worker exec tsc --build --force tsconfig.json
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    node scripts/ci/deploy-production.mjs @workspace/alloy-rank-worker /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN addgroup -g 1000 -S app && adduser -u 1000 -S app -G app
COPY --from=builder --chown=app:app /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/workers/alloy-rank-worker/dist ./dist
COPY --from=builder --chown=app:app /app/workers/alloy-rank-worker/package.json ./package.json

USER app

ENV NODE_ENV=production \
    AEF_RANK_WORKER_PORT=4203
# AEF_S2S_SECRET is intentionally not baked into the image. Inject it through
# the deployment secret manager; the worker exits before listening if absent.
# Server binds AEF_RANK_WORKER_PORT, falling back to PORT, default 4203
# (src/server.ts).
EXPOSE 4203

# Probe readiness, not liveness. This intentionally reports unhealthy in
# production while only lexical/passthrough development heuristics are wired.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.AEF_RANK_WORKER_PORT||process.env.PORT||4203)+'/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Compiled entry.
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-rank-worker" \
      org.opencontainers.image.description="Alloy Embedding Fabric development reranking worker; production remains on HOLD until a qualified immutable model is wired." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
