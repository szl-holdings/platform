FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml* ./
COPY lib/shared-ui/package.json ./lib/shared-ui/
COPY lib/observability/package.json ./lib/observability/
COPY lib/config/package.json ./lib/config/
COPY lib/analytics/package.json ./lib/analytics/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/i18n/package.json ./lib/i18n/
COPY lib/mcp-client/package.json ./lib/mcp-client/
COPY lib/graphql-client/package.json ./lib/graphql-client/
COPY lib/replit-auth-web/package.json ./lib/replit-auth-web/
COPY lib/services/package.json ./lib/services/
COPY artifacts/carlota-jo/package.json ./artifacts/carlota-jo/
RUN corepack enable pnpm && pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY lib/ ./lib/
COPY artifacts/carlota-jo/ ./artifacts/carlota-jo/
# Per-file COPY — Doctrine v11 (no COPY . .)
ENV NODE_ENV=production
RUN corepack enable pnpm && pnpm --filter "carlota-jo" run build

FROM nginx:alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752 AS runner
COPY --from=builder /app/artifacts/carlota-jo/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 8080;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files $uri $uri/ /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf \
    && sed -i 's|pid\s*/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
    && sed -i '/^user /d' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d \
    && chmod -R 755 /usr/share/nginx/html
EXPOSE 8080
LABEL org.opencontainers.image.source="https://github.com/szl-holdings/szl-holdings-platform"
LABEL org.opencontainers.image.description="Carlota Jo Consulting"
LABEL org.opencontainers.image.licenses="UNLICENSED"
USER nginx
CMD ["nginx", "-g", "daemon off;"]
