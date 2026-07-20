# syntax=docker/dockerfile:1
#
# artifacts/vessels — Vessels Maritime Intelligence (Vite SPA, nginx-served).
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f artifacts/vessels/Dockerfile -t vessels .
#
# Building from the package directory alone fails: this is a pnpm workspace and
# @workspace/vessels declares 47 transitive workspace:* siblings (lib/* and
# packages/*) that only resolve from the repo root. The .dockerignore at the
# repo root strips node_modules/dist/.git so the root context stays lean and
# auditable (source + lockfile + workspace manifests, nothing else).
#
# Build-stage images use node:24-alpine because the root engines field requires
# node>=24 with engine-strict=true (.npmrc). The prior Dockerfile pinned
# node:22-alpine, which pnpm rejected under engine-strict — one of the reasons
# the image was never published (FA-001). The runtime stage is nginx:alpine.
#
# This Dockerfile is modeled on the proven apps/alloy-runtime-api build:
# `pnpm fetch` (lockfile-only) -> offline `pnpm install --frozen-lockfile`
# -> filtered `pnpm --filter @workspace/vessels run build`.

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
# pnpm fetch only needs the lockfile (+ .npmrc); it populates the virtual store
# so the install in the builder stage can run fully offline and cache-friendly.
COPY pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered Vite build) ────────────────────────
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Full root context (workspace:* deps only resolve from root). .dockerignore
# already excludes node_modules/dist/.git/*.md/etc., so this is auditable.
COPY ./ ./
# CI=true so pnpm may non-interactively reconcile the node_modules dir that
# `pnpm fetch` populated (without a TTY pnpm aborts the modules-dir refresh:
# ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY).
ENV NODE_ENV=production \
    CI=true
# Frozen, deterministic install against the warmed pnpm store (cache-mounted,
# shared with the deps stage by id). We do NOT pass --offline: `pnpm fetch`
# warms most of the store, but a few transitive tarballs (e.g. cors) are not
# covered by fetch's default set, so a strict --offline install fails with
# ERR_PNPM_NO_OFFLINE_TARBALL. --frozen-lockfile still guarantees the resolved
# graph matches pnpm-lock.yaml exactly (no resolution drift).
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
# Vite emits to artifacts/vessels/dist/public (see vite.config.ts outDir).
RUN pnpm --filter "@workspace/vessels" run build

# ─── Stage 3: runtime (nginx, non-root, port 8080) ───────────────────────────
FROM nginx:alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752 AS runner
# The app is built with Vite base path "/vessels/" (vite.config.ts), so assets
# are referenced as /vessels/assets/*. Serve the SPA under both / and /vessels/,
# add a /healthz endpoint (the UDS Package CR uptime check hits /healthz on
# port 8080), and run unprivileged on 8080.
COPY --from=builder /app/artifacts/vessels/dist/public /usr/share/nginx/html
RUN set -eux; \
    cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Liveness/uptime probe for the UDS Package CR (uptime.checks.paths: /healthz).
    location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "ok\n";
    }

    # App is built with base "/vessels/"; map that prefix onto the doc root.
    location /vessels/ {
        alias /usr/share/nginx/html/;
        try_files $uri $uri/ /index.html;
    }

    # Also serve at root for convenience / direct service access.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
RUN sed -i 's|pid\s*/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
    && sed -i '/^user /d' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 8080
# Image-level healthcheck mirrors the UDS uptime probe.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="vessels" \
      org.opencontainers.image.description="Vessels Maritime Intelligence" \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.vendor="SZL Holdings"

USER nginx
CMD ["nginx", "-g", "daemon off;"]
