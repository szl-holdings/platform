# syntax=docker/dockerfile:1
#
# Build from the monorepo root. The workspace retains the linux-x64-gnu
# Lightning CSS binary and excludes linux-x64-musl, so the build stages must
# use the same pinned Debian/glibc Node image proven by the Vessels artifact.
FROM node:26-bookworm-slim@sha256:662933cf47f013bc8e4beb31a6116448427a82057ba7c42c97e4c5ba766504c2 AS pnpm-base
ARG PNPM_VERSION=10.26.1
RUN npm install --global "pnpm@${PNPM_VERSION}" \
    && test "$(pnpm --version)" = "${PNPM_VERSION}"
WORKDIR /app

FROM pnpm-base AS deps
COPY pnpm-lock.yaml .npmrc ./
COPY patches/ ./patches/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm fetch

FROM pnpm-base AS builder
COPY ./ ./
ENV NODE_ENV=production \
    CI=true
# Vite is a devDependency; retain build tooling despite production mode.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --prod=false
RUN pnpm --filter "@workspace/terra" run build

FROM nginx:alpine@sha256:72ba65eb42c10344912a84ff42408db7d34f2feb642204570ab8fc5ffd29f1d3 AS runner
COPY --from=builder /app/artifacts/terra/dist/public /usr/share/nginx/html
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

    location /terra/ {
        alias /usr/share/nginx/html/;
        try_files $uri $uri/ /index.html;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX
RUN sed -i 's|^[[:space:]]*pid[[:space:]][^;]*;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
    && grep -Fqx 'pid /tmp/nginx.pid;' /etc/nginx/nginx.conf \
    && sed -i '/^user /d' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && chmod -R 755 /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1

LABEL org.opencontainers.image.source="https://github.com/szl-holdings/platform" \
      org.opencontainers.image.title="terra" \
      org.opencontainers.image.description="Terra Real Estate Intelligence" \
      org.opencontainers.image.licenses="LicenseRef-SZL-Proprietary" \
      org.opencontainers.image.vendor="SZL Holdings"

USER nginx
CMD ["nginx", "-g", "daemon off;"]
