# SZL Holdings — Environment Variables Inventory

## Core Platform
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| DATABASE_URL | Yes | Secret | api-server, db |
| PORT | Yes | Config | All artifacts |
| NODE_ENV | Yes | Config | All |
| SESSION_SECRET | Yes | Secret | api-server |
| CORS_ORIGINS | Yes | Config | api-server |
| PUBLIC_APP_URL | Yes | Config | api-server |
| LOG_LEVEL | No | Config | api-server |

## AI / ML
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| HUGGINGFACE_API_KEY | Yes | Secret | ai-engine |
| AI_INTEGRATIONS_OPENAI_API_KEY | No | Secret | integrations-openai |
| AI_INTEGRATIONS_OPENAI_BASE_URL | No | Config | integrations-openai |
| AI_INTEGRATIONS_ANTHROPIC_API_KEY | No | Secret | integrations-anthropic |
| AI_INTEGRATIONS_ANTHROPIC_BASE_URL | No | Config | integrations-anthropic |
| AI_INTEGRATIONS_GEMINI_API_KEY | No | Secret | integrations-gemini |
| AI_INTEGRATIONS_GEMINI_BASE_URL | No | Config | integrations-gemini |
| OPENAI_API_KEY | No | Secret | ai-engine fallback |
| ANTHROPIC_API_KEY | No | Secret | ai-engine fallback |
| GEMINI_API_KEY | No | Secret | ai-engine fallback |

## Auth / Identity
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| ISSUER_URL | Yes | Config | auth |
| OAUTH_STATE_SECRET | Yes | Secret | auth |
| AZURE_AD_CLIENT_ID | No | Secret | SSO |
| AZURE_AD_CLIENT_SECRET | No | Secret | SSO |
| AZURE_AD_TENANT_ID | No | Config | SSO |

## Alloy
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| ALLOY_INTERNAL_TOKEN | Yes | Secret | alloy |
| ALLOY_MAX_BATCH_SIZE | No | Config | alloy |
| ALLOY_REQUIRE_APPROVAL_CRITICAL | No | Config | alloy |
| ALLOY_WORKFLOW_AUTO_RUN | No | Config | alloy |

## Feature Flags
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| FEATURE_ALLOY_GOVERNANCE | No | Config | api-server |
| FEATURE_ALLOY_ORCHESTRATION | No | Config | api-server |
| FEATURE_ALLOY_WEBHOOKS | No | Config | api-server |
| FEATURE_AUDIT_LOGGING | No | Config | api-server |
| DEMO_MODE | No | Config | api-server |
| SYNTHETIC_ALERTS | No | Config | api-server |

## External Services
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| STRIPE_SECRET_KEY | No | Secret | billing |
| STRIPE_WEBHOOK_SECRET | No | Secret | billing |
| RESEND_API_KEY | No | Secret | email |
| SENDGRID_API_KEY | No | Secret | email |
| SLACK_BOT_TOKEN | No | Secret | notifications |
| SLACK_WEBHOOK_URL | No | Secret | notifications |
| HUBSPOT_ACCESS_TOKEN | No | Secret | CRM |
| GITHUB_TOKEN | No | Secret | integrations |
| MAPBOX_ACCESS_TOKEN | No | Secret | terra, vessels |
| GOOGLE_MAPS_API_KEY | No | Secret | terra |
| DOCUSIGN_CLIENT_ID | No | Secret | documents |
| NEW_RELIC_LICENSE_KEY | No | Secret | observability |

## Azure (Future Production)
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| AZURE_PG_CONNECTION_STRING | No | Secret | db (Azure) |
| AZURE_REDIS_CONNECTION_STRING | No | Secret | cache (Azure) |
| AZURE_STORAGE_CONNECTION_STRING | No | Secret | storage (Azure) |
| AZURE_KEY_VAULT_URL | No | Config | secrets (Azure) |
| AZURE_APP_INSIGHTS_CONNECTION_STRING | No | Secret | telemetry (Azure) |

## Database Tuning
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| DB_POOL_MIN | No | Config | db |
| DB_POOL_MAX | No | Config | db |
| DB_IDLE_TIMEOUT_MS | No | Config | db |
| DB_CONNECT_TIMEOUT_MS | No | Config | db |
| DB_STATEMENT_TIMEOUT_MS | No | Config | db |
| SLOW_QUERY_THRESHOLD_MS | No | Config | db |

## Frontend
| Variable | Required | Sensitivity | Used By |
|----------|----------|-------------|---------|
| VITE_APP_URL | No | Config | web apps |
| VITE_ADMIN_PIN | No | Secret | admin pages |
| VITE_PLAUSIBLE_DOMAIN | No | Config | analytics |

Total: 80+ environment variables referenced across the estate.
