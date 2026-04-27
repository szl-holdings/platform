FROM node:25-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY pnpm-lock.yaml* ./
COPY lib/shared-ui/package.json ./lib/shared-ui/
COPY lib/db/package.json ./lib/db/
COPY lib/ai-engine/package.json ./lib/ai-engine/
COPY lib/config/package.json ./lib/config/
COPY lib/services/package.json ./lib/services/
COPY lib/analytics/package.json ./lib/analytics/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/covenant-policy/package.json ./lib/covenant-policy/
COPY lib/audit/package.json ./lib/audit/
COPY lib/auth/package.json ./lib/auth/
COPY lib/data-connectors/package.json ./lib/data-connectors/
COPY lib/graphql-client/package.json ./lib/graphql-client/
COPY lib/i18n/package.json ./lib/i18n/
COPY lib/mcp-client/package.json ./lib/mcp-client/
COPY lib/observability/package.json ./lib/observability/
COPY lib/proof-chain/package.json ./lib/proof-chain/
COPY lib/replit-auth-web/package.json ./lib/replit-auth-web/
COPY lib/forge-runtime/package.json ./lib/forge-runtime/
COPY lib/worldline/package.json ./lib/worldline/
COPY lib/integrations-anthropic-ai/package.json ./lib/integrations-anthropic-ai/
COPY lib/integrations-gemini-ai/package.json ./lib/integrations-gemini-ai/
COPY lib/integrations-openai-ai-server/package.json ./lib/integrations-openai-ai-server/
COPY artifacts/api-server/package.json ./artifacts/api-server/
RUN corepack enable pnpm && pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN corepack enable pnpm && pnpm --filter "@workspace/api-server" run build

FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:nodejs /app/artifacts/api-server/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
ENV PORT=3000
LABEL org.opencontainers.image.source="https://github.com/szl-holdings/szl-holdings-platform"
LABEL org.opencontainers.image.description="SZL Holdings API Server"
LABEL org.opencontainers.image.licenses="UNLICENSED"
CMD ["node", "--max-old-space-size=1024", "--expose-gc", "--enable-source-maps", "./dist/index.mjs"]
