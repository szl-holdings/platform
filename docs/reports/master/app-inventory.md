# SZL Holdings — App Inventory

## Web Applications

| App | Package | Pages | Routes | Build Status | Purpose |
|-----|---------|-------|--------|-------------|---------|
| szl-holdings | @workspace/szl-holdings | 64 | 64+ | PASS | Parent company portal, investor relations, trust center |
| lyte-command-center | @workspace/lyte-command-center | 50+ | 28+ API + pages | PASS | Business observability command plane (flagship) |
| firestorm (Aegis) | @workspace/firestorm | 41 | 60+ | PASS | Defense, intelligence, SOC, cyber operations |
| terra | @workspace/terra | 42 | 12+ | PASS | Real estate operating intelligence |
| vessels | @workspace/vessels | 49 | 49+ | PASS | Maritime operating intelligence |
| carlota-jo | @workspace/carlota-jo | 27 | 27+ | PASS | Premium advisory, consulting |
| stephen-site | @workspace/stephen-site | 18 | 18+ | PASS | Founder credibility, personal brand |
| mockup-sandbox | @workspace/mockup-sandbox | — | — | PASS | Internal design tool |

## Mobile Applications

| App | Package | Screens/Tabs | Framework | Purpose |
|-----|---------|-------------|-----------|---------|
| aegis-mobile | @workspace/aegis-mobile | 5 tabs + 2 detail | Expo | SOC command center mobile |
| carlota-jo-mobile | @workspace/carlota-jo-mobile | 5 tabs | Expo | Client app |
| lyte-mobile | @workspace/lyte-mobile | 6 tabs | Expo | AIOps command mobile |
| stephen-mobile | @workspace/stephen-mobile | 3 screens | Expo | Personal brand mobile |
| szl-holdings-mobile | @workspace/szl-holdings-mobile | 6 tabs + detail | Expo | Executive command |
| terra-mobile | @workspace/terra-mobile | 5 tabs + detail + capture | Expo | Field intelligence |
| vessels-mobile | @workspace/vessels-mobile | 5 tabs + detail | Expo | Fleet command mobile |

## Backend / API

| Service | Endpoints | Route Files | Build Status |
|---------|----------|-------------|-------------|
| api-server | 1166 | 60+ | PASS |

## Shared Packages & Libraries

| Package | Location | Purpose |
|---------|----------|---------|
| ai-engine | lib/ai-engine | HuggingFace AI inference, schemas, retrieval, tools |
| shared-ui | lib/shared-ui | Design system, tokens, components |
| db | lib/db | Drizzle ORM, 50+ schema tables |
| auth | packages/auth | Authentication middleware, RBAC |
| audit | packages/audit | Audit logging |
| workflow-engine | packages/workflow-engine | Alloy workflow orchestration |
| config | packages/config | Shared configuration |
| analytics | packages/analytics | Analytics |
| api-client-react | packages/api-client-react | React API hooks |
| api-spec | packages/api-spec | API specification |
| api-zod | packages/api-zod | Zod validation schemas |
| i18n | packages/i18n | Internationalization |
| observability | packages/observability | Telemetry, tracing |
| services | packages/services | Shared services |
| integrations-anthropic-ai | packages/integrations-anthropic-ai | Anthropic AI proxy |
| integrations-gemini-ai | packages/integrations-gemini-ai | Gemini AI proxy |
| integrations-openai-ai-server | packages/integrations-openai-ai-server | OpenAI AI proxy |
| data-connectors | packages/data-connectors | External data connectors |

## Database Schema (50+ tables)

Key domain tables: alloy, alloy_platform, alloy_chat, audit_logs, auth, billing, capital_readiness, carlota_jo, carlota_client, certification_readiness, cms, comments, connectors, conversations, documents, dreamscape, entities, export_jobs, feature_flags, feedback, files, firestorm, health_checks, holdings, inca, intelligence_cache, lyte, lyte_product, maritime, messages, msp, notifications, nuro_mesh, organizations, ownership_control, platform_events, platform_ops, projects, push_tokens, readiness, recommendations, scim, stephen, stephen_site, szl_canonical, terra, vessels, vessels_intelligence, vessels_product, webhook_events
