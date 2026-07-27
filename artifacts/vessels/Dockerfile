# syntax=docker/dockerfile:1
#
# artifacts/vessels — Vessels Maritime Intelligence (Vite SPA, nginx-served).
#
# BUILD FROM THE MONOREPO ROOT (not this directory):
#   docker build -f artifacts/vessels/Dockerfile -t vessels .
#
# Building from the package directory alone fails: this is a pnpm workspace and
# @workspace/vessels declares transitive workspace:* siblings that only resolve
# from the repo root. The root .dockerignore strips node_modules/dist/.git so the
# context remains source- and lockfile-bound.
#
# Node 26 no longer bundles Corepack. The package manager is installed explicitly
# at the exact version declared by root package.json.
#
# The workspace intentionally excludes unused cross-platform Lightning CSS native
# packages, including linux-x64-musl, while retaining linux-x64-gnu. Therefore the
# build stages use the pinned Debian/glibc Node image. An Alpine/musl builder can
# never load the reviewed lockfile's retained Lightning CSS native module.
#
# Build pattern: lockfile-only `pnpm fetch` -> frozen workspace install ->
# filtered `@workspace/vessels` Vite build.

# ─── Shared pinned package-manager base ───────────────────────────────────────
FROM node:26-bookworm-slim@sha256:2d49d876e96237d76de412761cf05dbfe5aee325cc4406a4d41d5824c5bb8beb AS pnpm-base
ARG PNPM_VERSION=10.26.1
RUN npm install --global "pnpm@${PNPM_VERSION}" \
    && test "$(pnpm --version)" = "${PNPM_VERSION}"
WORKDIR /app

# ─── Stage 1: dependency cache (pnpm fetch from root) ────────────────────────
FROM pnpm-base AS deps
# pnpm fetch only needs the lockfile (+ .npmrc); it populates the BuildKit-mounted
# virtual store so the install in the builder stage is cache-friendly.
COPY pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

# ─── Stage 2: builder (install + filtered Vite build) ────────────────────────
FROM pnpm-base AS builder
# Full root context (workspace:* deps only resolve from root). .dockerignore
# excludes generated and VCS state.
COPY ./ ./
# CI=true permits the non-interactive modules-directory reconciliation required
# in container builds.
ENV NODE_ENV=production \
    CI=true
# Frozen install against the same BuildKit cache id used by `pnpm fetch`. We do
# not force --offline because some transitive tarballs are resolved only during
# install; --frozen-lockfile still prevents graph drift.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
# Vite emits to artifacts/vessels/dist/public (see vite.config.ts outDir).
RUN pnpm --filter "@workspace/vessels" run build

# ─── Stage 3: runtime (nginx, non-root, port 8080) ───────────────────────────
FROM nginx:alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752 AS runner
# The app is built with Vite base path "/vessels/". Serve the SPA under both
# / and /vessels/, add the UDS liveness endpoint, and run unprivileged on 8080.
COPY --from=builder /app/artifacts/vessels/dist/public /usr/share/nginx/html
RUN set -eux; \
    cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location = /healthz {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "ok\n";
    }

    location /vessels/ {
        alias /usr/share/nginx/html/;
        try_files $uri $uri/ /index.html;
    }

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
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="vessels" \
      org.opencontainers.image.description="Vessels Maritime Intelligence" \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.vendor="SZL Holdings"

USER nginx
CMD ["nginx", "-g", "daemon off;"]
