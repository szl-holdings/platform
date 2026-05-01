# syntax=docker/dockerfile:1
# ${{ values.domainName }} API — Multi-stage Dockerfile
# Base image: node:22-alpine (required by platform convention)

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/${{ values.domainSlug }}-api/ ./services/${{ values.domainSlug }}-api/

# Install dependencies (production + build deps)
RUN pnpm install --frozen-lockfile --filter @workspace/${{ values.domainSlug }}-api

# Build TypeScript
RUN pnpm --filter @workspace/${{ values.domainSlug }}-api build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3100

# Copy compiled output only
COPY --from=builder /app/services/${{ values.domainSlug }}-api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Non-root user for security
RUN addgroup -g 1001 -S app && adduser -S -u 1001 app -G app
USER app

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/index.js"]
