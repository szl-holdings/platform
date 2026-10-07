# syntax=docker/dockerfile:1
#
# workers/alloy-vector-worker — Alloy Embedding Fabric vector embedding worker.
# Runs dense (and optional sparse) embedding on CPU using LocalCpuBackend with
# micro-batching, queue-depth metrics, oversize rejection, and backpressure.
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f workers/alloy-vector-worker/Dockerfile -t alloy-vector-worker .
#
# pnpm workspace: workspace:* siblings only resolve from the repo root. All Node
# stages use the pinned Debian/glibc Node 26 image because the worker's
# @huggingface/transformers dependency loads the glibc onnxruntime-node binary;
# libc6-compat on Alpine is not a supported substitute. Node 26 does not bundle
# Corepack, so pnpm is installed and verified explicitly.
#
# The package build compiles its project-reference graph to ./dist. The image
# runs that compiled entry directly; the source-mode start script is not used in
# the production stage.

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
RUN pnpm --filter @workspace/alloy-vector-worker exec tsc --build --force tsconfig.json
RUN pnpm --filter @workspace/alloy-vector-worker deploy --prod --legacy /app/deploy

# ─── Stage 3: runtime (minimal) ──────────────────────────────────────────────
FROM node:26-bookworm-slim@sha256:662933cf47f013bc8e4beb31a6116448427a82057ba7c42c97e4c5ba766504c2 AS runtime
WORKDIR /app
COPY --from=builder --chown=node:node /app/deploy/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/workers/alloy-vector-worker/dist ./dist
COPY --from=builder --chown=node:node /app/workers/alloy-vector-worker/package.json ./package.json
# Fail the image build if the deployed production graph cannot load the native
# ONNX lane used by Transformers.js on Linux/glibc.
RUN node --input-type=module -e "const mod = await import('@huggingface/transformers'); if (typeof mod.pipeline !== 'function') throw new Error('transformers pipeline export unavailable')"

USER node

ENV NODE_ENV=production \
    AEF_VECTOR_WORKER_PORT=4202
# AEF_S2S_SECRET is intentionally not baked into the image. Inject it through
# the deployment secret manager; the worker exits before listening if absent.
# Server binds AEF_VECTOR_WORKER_PORT, falling back to PORT, default 4202
# (src/server.ts).
EXPOSE 4202

# /health and /healthz are liveness only. /readyz fails closed in production
# until a signed promotion receipt and artifact/cache integrity can be verified.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.AEF_VECTOR_WORKER_PORT||process.env.PORT||4202)+'/readyz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Compiled entry (tsx start runs src/server.ts -> dist/server.js after build).
CMD ["node", "--enable-source-maps", "dist/server.js"]

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="@workspace/alloy-vector-worker" \
      org.opencontainers.image.description="Alloy Embedding Fabric vector worker; production remains on HOLD until model artifact integrity and a qualification receipt can be verified." \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.version="0.0.0" \
      org.opencontainers.image.vendor="SZL Holdings"
