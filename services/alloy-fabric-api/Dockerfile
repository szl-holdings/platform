# syntax=docker/dockerfile:1
#
# services/alloy-fabric-api — Alloy Embedding Fabric primary REST API gateway.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f services/alloy-fabric-api/Dockerfile -t alloy-fabric-api .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root. All Node
# stages use the pinned Debian/glibc Node 26 image because the embedded local
# backend loads onnxruntime-node through Transformers.js. Node 26 does not
# bundle Corepack, so pnpm is installed and verified explicitly.

# ─── Shared pinned package-manager base ───────────────────────────────────────
FROM node:26-bookworm-slim@sha256:662933cf47f013bc8e4beb31a6116448427a82057ba7c42c97e4c5ba766504c2 AS pnpm-base
ARG PNPM_VERSION=10.26.1
RUN npm install --global "pnpm@${PNPM_VERSION}" \
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
RUN pnpm --filter @workspace/alloy-fabric-api exec tsc --build --force tsconfig.json
RUN pnpm --filter @workspace/alloy-fabric-api deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-bookworm-slim@sha256:662933cf47f013bc8e4beb31a6116448427a82057ba7c42c97e4c5ba766504c2 AS runtime
WORKDIR /app
COPY --from=builder --chown=node:node /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/services/alloy-fabric-api/dist ./dist
COPY --from=builder --chown=node:node /app/services/alloy-fabric-api/package.json ./package.json
RUN node --input-type=module -e "const mod = await import('@huggingface/transformers'); if (typeof mod.pipeline !== 'function') throw new Error('transformers pipeline export unavailable')"

USER node

ENV NODE_ENV=production \
    PORT=4200
# AEF_BEARER_TOKEN (or AEF_API_KEY) and AEF_API_TENANT_ID are intentionally not
# baked into the image. Inject them through the deployment secret/config
# manager; the credential is authorized only for the configured tenant.
# Server binds process.env.PORT, defaulting to 4200 (src/server.ts).
EXPOSE 4200

# /healthz is liveness only. /readyz intentionally remains non-2xx in
# production until durable tenant state, qualified models, and evidence exist.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4200)+'/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Compiled production entry.
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-fabric-api" \
      org.opencontainers.image.description="Alloy Embedding Fabric development API surface; production remains on HOLD pending durable tenant storage, qualified model artifacts, and durable evidence." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
