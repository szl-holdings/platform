# syntax=docker/dockerfile:1
# ${{ values.agentName }} — Multi-stage Dockerfile
# Base image: node:22-alpine (required by platform convention)

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY workers/${{ values.agentSlug }}-worker/ ./workers/${{ values.agentSlug }}-worker/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @workspace/${{ values.agentSlug }}-worker

# Build TypeScript
RUN pnpm --filter @workspace/${{ values.agentSlug }}-worker build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -g 1001 -S app && adduser -S -u 1001 app -G app

COPY --from=builder /app/workers/${{ values.agentSlug }}-worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/workers/${{ values.agentSlug }}-worker/package.json ./package.json

USER app
EXPOSE 9090

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:9090/health || exit 1

CMD ["node", "dist/index.js"]
