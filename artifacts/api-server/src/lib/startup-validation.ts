import { randomBytes } from 'node:crypto';
import {
  isProductionMode,
  isDemoMode as resolveIsDemoMode,
  resolveRuntimeMode,
} from '@szl-holdings/config';
import { logger } from './logger';

interface EnvVarSpec {
  key: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  sensitive?: boolean;
  group?: string;
}

export const ENV_SPECS: EnvVarSpec[] = [
  {
    key: 'PORT',
    required: false,
    description: 'Server listen port',
    defaultValue: '3000',
    group: 'server',
  },
  {
    key: 'NODE_ENV',
    required: false,
    description: 'Runtime environment (development | production | test)',
    defaultValue: 'development',
    group: 'server',
  },
  {
    key: 'APP_ENV',
    required: false,
    description: 'Application environment label (staging | production | demo)',
    group: 'server',
  },
  {
    key: 'RUNTIME_MODE',
    required: false,
    description:
      'Explicit runtime mode override: local-dev | internal-preview | demo | production (resolved from APP_ENV/NODE_ENV/DEMO_MODE if not set)',
    group: 'server',
  },
  {
    key: 'LOG_LEVEL',
    required: false,
    description: 'Pino log level (trace | debug | info | warn | error | fatal)',
    defaultValue: 'info',
    group: 'server',
  },
  {
    key: 'PUBLIC_APP_URL',
    required: false,
    description: 'Public-facing application URL (used for OIDC redirects and email links)',
    group: 'server',
  },
  {
    key: 'CORS_ORIGINS',
    required: false,
    description: 'Comma-separated list of allowed CORS origins',
    group: 'server',
  },

  {
    key: 'DATABASE_URL',
    required: false,
    description: 'PostgreSQL connection string for the primary database',
    sensitive: true,
    group: 'database',
  },

  {
    key: 'DEMO_MODE',
    required: false,
    description:
      "Set to 'true' to enable demo mode (mocks external services, disables destructive ops)",
    defaultValue: 'false',
    group: 'platform',
  },

  {
    key: 'AUTH_PROVIDER_URL',
    required: false,
    description: 'OIDC provider discovery URL (defaults to Replit OIDC)',
    group: 'auth',
  },
  {
    key: 'AUTH_PROVIDER_KEY',
    required: false,
    description: 'OIDC client secret or API key for the auth provider',
    sensitive: true,
    group: 'auth',
  },
  {
    key: 'SERVICE_ROLE_KEY',
    required: false,
    description: 'Internal service role key for machine-to-machine calls (admin bypass)',
    sensitive: true,
    group: 'auth',
  },
  {
    key: 'SESSION_SECRET',
    required: false,
    description: 'Session encryption secret (must be set in production)',
    sensitive: true,
    group: 'auth',
  },
  {
    key: 'REPL_ID',
    required: false,
    description: 'Replit deployment REPL_ID used for OIDC client ID',
    group: 'auth',
  },
  {
    key: 'ISSUER_URL',
    required: false,
    description: 'OIDC issuer URL (defaults to https://replit.com/oidc)',
    group: 'auth',
  },

  {
    key: 'ALLOY_INTERNAL_TOKEN',
    required: false,
    description:
      'Internal admin token for AlloyChat admin context (enables privileged agent access) — must be 32+ chars',
    sensitive: true,
    group: 'alloy',
  },
  {
    key: 'CONNECTOR_ENCRYPTION_KEY',
    required: false,
    description:
      'AES-256-GCM encryption key (64 hex chars) for RMM provider credential storage — required in production',
    sensitive: true,
    group: 'alloy',
  },
  {
    key: 'IP_HASH_SALT',
    required: false,
    description:
      'Salt used to hash client IP addresses for privacy-preserving rate limiting and audit logs — required in production',
    sensitive: true,
    group: 'security',
  },

  {
    key: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key for payment processing',
    sensitive: true,
    group: 'billing',
  },

  {
    key: 'MFA_SECRET_ENCRYPTION_KEY',
    required: false,
    description:
      'AES-256-GCM key (64 hex chars or 44 base64 chars = 32 bytes) for TOTP secret encryption at rest — required in production',
    sensitive: true,
    group: 'auth',
  },

  {
    key: 'GITHUB_TOKEN',
    required: false,
    description: 'GitHub personal access token or OAuth token for repository integration',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AI_INTEGRATIONS_OPENAI_API_KEY',
    required: false,
    description: 'Replit AI Integrations proxy key for OpenAI-compatible inference',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AI_INTEGRATIONS_ANTHROPIC_API_KEY',
    required: false,
    description: 'Replit AI Integrations proxy key for Anthropic-compatible inference',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'ELEVENLABS_API_KEY',
    required: false,
    description: 'ElevenLabs API key for voice asset generation',
    sensitive: true,
    group: 'integrations',
  },

  {
    key: 'DEFAULT_OBJECT_STORAGE_BUCKET_ID',
    required: false,
    description: 'Replit GCS object storage bucket ID (set by App Storage provisioning)',
    group: 'storage',
  },
  {
    key: 'PUBLIC_OBJECT_SEARCH_PATHS',
    required: false,
    description:
      'Comma-separated GCS paths for public asset serving (set by App Storage provisioning)',
    group: 'storage',
  },
  {
    key: 'PRIVATE_OBJECT_DIR',
    required: false,
    description: 'GCS path prefix for private object uploads (set by App Storage provisioning)',
    group: 'storage',
  },
  {
    key: 'REPLIT_DEV_DOMAIN',
    required: false,
    description: 'Replit development domain for proxy-aware redirects',
    group: 'runtime',
  },

  {
    key: 'ATLAS_SCHEMA_VERSION',
    required: false,
    description:
      'ATLAS enterprise state model schema version — used for compatibility checks across domain packs',
    defaultValue: '1.0.0',
    group: 'atlas',
  },
  {
    key: 'ATLAS_DOMAIN_PACK_ENFORCE',
    required: false,
    description: "Set to 'true' to enforce strict ATLAS conformance validation on entity writes",
    defaultValue: 'false',
    group: 'atlas',
  },
  {
    key: 'ATLAS_EVENT_BUS_ENABLED',
    required: false,
    description: "Set to 'true' to enable cross-domain ATLAS event bus routing",
    defaultValue: 'false',
    group: 'atlas',
  },
  {
    key: 'ATLAS_CROSS_DOMAIN_TELEMETRY',
    required: false,
    description: "Set to 'true' to capture cross-domain entity relationship telemetry",
    defaultValue: 'false',
    group: 'atlas',
  },

  {
    key: 'ENABLE_DEMO_SEED',
    required: false,
    description:
      "Set to 'true' to enable demo data seeding on startup (sets runtime mode to 'demo')",
    defaultValue: 'false',
    group: 'platform',
  },
  {
    key: 'FEATURE_ALLOY_ORCHESTRATION',
    required: false,
    description: "Set to 'true' to enable the Alloy orchestration subsystem",
    defaultValue: 'true',
    group: 'features',
  },
  {
    key: 'FEATURE_ALLOY_GOVERNANCE',
    required: false,
    description: "Set to 'true' to enable the Alloy governance and approval subsystem",
    defaultValue: 'true',
    group: 'features',
  },
  {
    key: 'FEATURE_ALLOY_WEBHOOKS',
    required: false,
    description: "Set to 'true' to enable Alloy outbound webhook delivery",
    defaultValue: 'true',
    group: 'features',
  },
  {
    key: 'FEATURE_AUDIT_LOGGING',
    required: false,
    description: "Set to 'true' to enable platform-wide immutable audit logging",
    defaultValue: 'true',
    group: 'features',
  },
  {
    key: 'ALLOY_REQUIRE_APPROVAL_CRITICAL',
    required: false,
    description:
      "Set to 'true' to require human approval for critical operations (cannot be false in production)",
    defaultValue: 'true',
    group: 'alloy',
  },
  {
    key: 'ALLOY_WORKFLOW_AUTO_RUN',
    required: false,
    description: "Set to 'true' to auto-run scheduled workflows on server startup",
    defaultValue: 'true',
    group: 'alloy',
  },
  {
    key: 'ALLOY_MAX_BATCH_SIZE',
    required: false,
    description: 'Maximum number of items processed in a single workflow batch',
    defaultValue: '100',
    group: 'alloy',
  },

  {
    key: 'SENTRY_DSN',
    required: false,
    description:
      'Sentry DSN for error tracking — activates lib/sentry.ts when set. Required in production (KG028).',
    sensitive: true,
    group: 'observability',
  },
  {
    key: 'SENTRY_TRACES_SAMPLE_RATE',
    required: false,
    description: 'Sentry trace sample rate (0–1). Default: 0.1',
    defaultValue: '0.1',
    group: 'observability',
  },
  {
    key: 'SENTRY_PROFILES_SAMPLE_RATE',
    required: false,
    description: 'Sentry profile sample rate (0–1). Default: 0.1',
    defaultValue: '0.1',
    group: 'observability',
  },
  {
    key: 'OTEL_EXPORTER_OTLP_ENDPOINT',
    required: false,
    description:
      'OTLP exporter URL for distributed tracing (Grafana Tempo, Jaeger, Honeycomb, Datadog). Required in production (KG009).',
    group: 'observability',
  },
  {
    key: 'OTLP_ENDPOINT',
    required: false,
    description: 'Alias for OTEL_EXPORTER_OTLP_ENDPOINT',
    group: 'observability',
  },
  {
    key: 'OTEL_SERVICE_NAME',
    required: false,
    description: 'OpenTelemetry service name tag. Default: szl-api',
    defaultValue: 'szl-api',
    group: 'observability',
  },
  {
    key: 'OTEL_CONSOLE_EXPORT',
    required: false,
    description: "Set to 'true' to log OTel spans to stdout (development/debug only)",
    defaultValue: 'false',
    group: 'observability',
  },
  {
    key: 'AZURE_APP_INSIGHTS_CONNECTION_STRING',
    required: false,
    description:
      'Azure Application Insights connection string — enables Azure Monitor OTLP export. Preferred exporter for Azure production deploys.',
    sensitive: true,
    group: 'observability',
  },
  {
    key: 'NEW_RELIC_LICENSE_KEY',
    required: false,
    description: 'New Relic license key — enables New Relic OTLP ingest',
    sensitive: true,
    group: 'observability',
  },
  {
    key: 'UPTIME_MONITOR_ID',
    required: false,
    description:
      'External uptime monitor ID (Betterstack/UptimeRobot) — informational; used in health status reporting',
    group: 'observability',
  },

  // ── Server (additional) ──────────────────────────────────────────────────
  {
    key: 'BASE_URL',
    required: false,
    description: 'Public-facing base URL of the API server (no trailing slash)',
    group: 'server',
  },

  // ── Session (additional) ─────────────────────────────────────────────────
  {
    key: 'SESSION_TTL_MS',
    required: false,
    description: 'Session TTL in milliseconds (default: 86400000 = 24 hours)',
    defaultValue: '86400000',
    group: 'auth',
  },
  {
    key: 'OAUTH_STATE_SECRET',
    required: false,
    description: 'Secret used to sign OAuth state parameters (CSRF protection) — auto-generated if not set',
    sensitive: true,
    group: 'auth',
  },

  // ── Encryption ───────────────────────────────────────────────────────────
  {
    key: 'FIELD_ENCRYPTION_KEY',
    required: false,
    description: 'AES-256 key for field-level encryption of PII columns (32 bytes hex)',
    sensitive: true,
    group: 'alloy',
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  {
    key: 'ADMIN_PIN',
    required: false,
    description: 'Admin PIN for the admin dashboard (hashed comparison)',
    sensitive: true,
    group: 'auth',
  },
  {
    key: 'VITE_ADMIN_PIN',
    required: false,
    description: '4-digit PIN used by Vite dev proxy (overrides ADMIN_PIN in dev)',
    sensitive: true,
    group: 'auth',
  },

  // ── AI / LLM ─────────────────────────────────────────────────────────────
  {
    key: 'AI_EXECUTION_MODE',
    required: false,
    description: 'Controls AI execution: real | mock | disabled',
    defaultValue: 'mock',
    group: 'integrations',
  },
  {
    key: 'HUGGINGFACE_API_KEY',
    required: false,
    description: 'HuggingFace API token for embedding and inference calls',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'HF_TOKEN',
    required: false,
    description: 'Alias for HUGGINGFACE_API_KEY',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AI_INTEGRATIONS_OPENAI_BASE_URL',
    required: false,
    description: 'Replit AI Integrations proxy base URL for OpenAI-compatible endpoint',
    group: 'integrations',
  },
  {
    key: 'AI_INTEGRATIONS_ANTHROPIC_BASE_URL',
    required: false,
    description: 'Replit AI Integrations proxy base URL for Anthropic-compatible endpoint',
    group: 'integrations',
  },
  {
    key: 'AI_INTEGRATIONS_GEMINI_API_KEY',
    required: false,
    description: 'Replit AI Integrations proxy key for Gemini-compatible inference',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AI_INTEGRATIONS_GEMINI_BASE_URL',
    required: false,
    description: 'Replit AI Integrations proxy base URL for Gemini-compatible endpoint',
    group: 'integrations',
  },

  // ── Azure ─────────────────────────────────────────────────────────────────
  {
    key: 'AZURE_AD_TENANT_ID',
    required: false,
    description: 'Azure Active Directory tenant ID for SSO / Microsoft Graph',
    group: 'integrations',
  },
  {
    key: 'AZURE_AD_CLIENT_ID',
    required: false,
    description: 'Azure Active Directory client ID for SSO / Microsoft Graph',
    group: 'integrations',
  },
  {
    key: 'AZURE_AD_CLIENT_SECRET',
    required: false,
    description: 'Azure Active Directory client secret for SSO / Microsoft Graph',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AZURE_STORAGE_CONNECTION_STRING',
    required: false,
    description: 'Azure Blob Storage connection string',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AZURE_DOC_INTEL_ENDPOINT',
    required: false,
    description: 'Azure Document Intelligence (Form Recognizer) endpoint URL',
    group: 'integrations',
  },
  {
    key: 'AZURE_DOC_INTEL_KEY',
    required: false,
    description: 'Azure Document Intelligence API key',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AZURE_REDIS_CONNECTION_STRING',
    required: false,
    description: 'Azure Redis Cache connection string',
    sensitive: true,
    group: 'integrations',
  },

  // ── Redis ─────────────────────────────────────────────────────────────────
  {
    key: 'REDIS_URL',
    required: false,
    description: 'Redis connection URL (standalone)',
    group: 'integrations',
  },
  {
    key: 'REDIS_HOST',
    required: false,
    description: 'Redis host (standalone, used when REDIS_URL is not set)',
    group: 'integrations',
  },

  // ── Microsoft 365 / Teams ─────────────────────────────────────────────────
  {
    key: 'MICROSOFT_CLIENT_ID',
    required: false,
    description: 'Microsoft 365 / Teams OAuth client ID',
    group: 'integrations',
  },
  {
    key: 'MICROSOFT_CLIENT_SECRET',
    required: false,
    description: 'Microsoft 365 / Teams OAuth client secret',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'MICROSOFT_TENANT_ID',
    required: false,
    description: 'Microsoft 365 / Teams tenant ID',
    group: 'integrations',
  },
  {
    key: 'MICROSOFT_GRAPH_TOKEN',
    required: false,
    description: 'Microsoft Graph API access token',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'MICROSOFT_TEAMS_WEBHOOK_URL',
    required: false,
    description: 'Microsoft Teams incoming webhook URL for notifications',
    group: 'integrations',
  },

  // ── Dataverse / Power Platform ────────────────────────────────────────────
  {
    key: 'DATAVERSE_ORG_URL',
    required: false,
    description: 'Dataverse / Power Platform organization URL',
    group: 'integrations',
  },
  {
    key: 'DATAVERSE_CLIENT_ID',
    required: false,
    description: 'Dataverse OAuth client ID',
    group: 'integrations',
  },
  {
    key: 'DATAVERSE_CLIENT_SECRET',
    required: false,
    description: 'Dataverse OAuth client secret',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'DATAVERSE_TENANT_ID',
    required: false,
    description: 'Dataverse tenant ID',
    group: 'integrations',
  },
  {
    key: 'PURVIEW_ENABLED',
    required: false,
    description: 'Enable Purview data governance integration (true | false)',
    defaultValue: 'false',
    group: 'integrations',
  },

  // ── Stripe (additional) ───────────────────────────────────────────────────
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook signing secret (from Stripe dashboard → Webhooks)',
    sensitive: true,
    group: 'billing',
  },
  {
    key: 'STRIPE_PRICE_AEGIS_ENTERPRISE',
    required: false,
    description: 'Stripe price ID for the Aegis Enterprise product',
    group: 'billing',
  },
  {
    key: 'STRIPE_PRICE_ADVISORY_RETAINER',
    required: false,
    description: 'Stripe price ID for the Advisory Retainer product',
    group: 'billing',
  },
  {
    key: 'STRIPE_PRICE_PORTFOLIO_REVIEW',
    required: false,
    description: 'Stripe price ID for the Portfolio Review product',
    group: 'billing',
  },
  {
    key: 'STRIPE_PRICE_STRATEGY_SESSION',
    required: false,
    description: 'Stripe price ID for the Strategy Session product',
    group: 'billing',
  },

  // ── Slack ─────────────────────────────────────────────────────────────────
  {
    key: 'SLACK_BOT_TOKEN',
    required: false,
    description: 'Slack bot token for sending messages',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SLACK_SIGNING_SECRET',
    required: false,
    description: 'Slack signing secret for verifying webhook payloads',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SLACK_ALERT_CHANNEL',
    required: false,
    description: 'Slack channel ID for operational alerts',
    group: 'integrations',
  },
  {
    key: 'SLACK_WEBHOOK_URL',
    required: false,
    description: 'Slack incoming webhook URL for digest notifications',
    group: 'integrations',
  },
  {
    key: 'ALLOY_DIGEST_SLACK_CHANNEL',
    required: false,
    description: 'Slack channel for daily Alloy digest delivery',
    group: 'alloy',
  },

  // ── Email ─────────────────────────────────────────────────────────────────
  {
    key: 'EMAIL_PROVIDER',
    required: false,
    description: 'Email provider: resend | sendgrid | smtp',
    defaultValue: 'resend',
    group: 'integrations',
  },
  {
    key: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for transactional email delivery',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SENDGRID_API_KEY',
    required: false,
    description: 'SendGrid API key for transactional email delivery',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'ALPHA_VANTAGE_API_KEY',
    required: false,
    description:
      'Alpha Vantage API key for delayed/EOD macro market indicators (equities, FX, commodities, treasury yields). ' +
      'When absent the Lyte macro indicator panel falls back to a built-in seed snapshot with isStale=true.',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SMTP_HOST',
    required: false,
    description: 'SMTP server hostname (used when EMAIL_PROVIDER=smtp)',
    group: 'integrations',
  },
  {
    key: 'SMTP_PORT',
    required: false,
    description: 'SMTP server port (used when EMAIL_PROVIDER=smtp)',
    defaultValue: '587',
    group: 'integrations',
  },
  {
    key: 'SMTP_USER',
    required: false,
    description: 'SMTP username (used when EMAIL_PROVIDER=smtp)',
    group: 'integrations',
  },
  {
    key: 'SMTP_PASS',
    required: false,
    description: 'SMTP password (used when EMAIL_PROVIDER=smtp)',
    sensitive: true,
    group: 'integrations',
  },

  // ── Web Push (VAPID) ──────────────────────────────────────────────────────
  {
    key: 'VAPID_PUBLIC_KEY',
    required: false,
    description: 'VAPID public key for Web Push notifications',
    group: 'integrations',
  },
  {
    key: 'VAPID_PRIVATE_KEY',
    required: false,
    description: 'VAPID private key for Web Push notifications',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'VAPID_SUBJECT',
    required: false,
    description: 'VAPID subject (mailto: or https: URL) for Web Push notifications',
    group: 'integrations',
  },

  // ── Alloy (additional) ────────────────────────────────────────────────────
  {
    key: 'ALLOY_EMAIL_INGEST_SECRET',
    required: false,
    description: 'Secret for verifying inbound Alloy email ingestion webhooks',
    sensitive: true,
    group: 'alloy',
  },

  // ── Guardian Policy Engine ────────────────────────────────────────────────
  {
    key: 'GUARDIAN_ENFORCE',
    required: false,
    description:
      'Enforce policy decisions: when true, deny → HTTP 403 and require-approval → HTTP 202. When false, advisory/log-only mode.',
    defaultValue: 'true',
    group: 'alloy',
  },
  {
    key: 'GUARDIAN_POLICY_SYNC_INTERVAL_MS',
    required: false,
    description: 'How often to sync policies from the policy store (ms)',
    defaultValue: '60000',
    group: 'alloy',
  },

  // ── Object Storage (additional) ───────────────────────────────────────────
  {
    key: 'OBJECT_STORAGE_BUCKET_ID',
    required: false,
    description: 'Replit Object Storage bucket ID',
    group: 'storage',
  },
  {
    key: 'OBJECT_STORE_BUCKET',
    required: false,
    description: 'Alias for OBJECT_STORAGE_BUCKET_ID',
    group: 'storage',
  },
  {
    key: 'S3_BUCKET',
    required: false,
    description: 'S3-compatible bucket name (for non-Replit deployments)',
    group: 'storage',
  },
  {
    key: 'DEFAULT_ORG_STORAGE_QUOTA_BYTES',
    required: false,
    description: 'Default per-org object storage quota in bytes (default: 5 GB)',
    defaultValue: '5368709120',
    group: 'storage',
  },

  // ── HubSpot ───────────────────────────────────────────────────────────────
  {
    key: 'HUBSPOT_ACCESS_TOKEN',
    required: false,
    description: 'HubSpot private app access token',
    sensitive: true,
    group: 'integrations',
  },

  // ── DocuSign ──────────────────────────────────────────────────────────────
  {
    key: 'DOCUSIGN_CLIENT_ID',
    required: false,
    description: 'DocuSign OAuth integration key (client ID)',
    group: 'integrations',
  },
  {
    key: 'DOCUSIGN_USER_ID',
    required: false,
    description: 'DocuSign impersonated user ID (GUID)',
    group: 'integrations',
  },
  {
    key: 'DOCUSIGN_ACCOUNT_ID',
    required: false,
    description: 'DocuSign account ID',
    group: 'integrations',
  },
  {
    key: 'DOCUSIGN_BASE_URL',
    required: false,
    description: 'DocuSign REST API base URL',
    group: 'integrations',
  },
  {
    key: 'DOCUSIGN_AUTH_URL',
    required: false,
    description: 'DocuSign OAuth base URL',
    group: 'integrations',
  },
  {
    key: 'DOCUSIGN_PRIVATE_KEY',
    required: false,
    description: 'DocuSign RSA private key (base64-encoded) for JWT auth',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'DOCUSIGN_CONNECT_HMAC_KEY',
    required: false,
    description: 'DocuSign Connect HMAC key for webhook verification',
    sensitive: true,
    group: 'integrations',
  },

  // ── Maps ──────────────────────────────────────────────────────────────────
  {
    key: 'GOOGLE_MAPS_API_KEY',
    required: false,
    description: 'Google Maps API key for server-side geocoding and routing',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'MAPBOX_ACCESS_TOKEN',
    required: false,
    description:
      'Mapbox access token for server-side and Terra/mobile map tiles (required for distress map — P1-004)',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'VITE_MAPBOX_TOKEN',
    required: false,
    description: 'Frontend Mapbox token (Vite build-time, must start with pk.)',
    sensitive: true,
    group: 'integrations',
  },

  // ── Legal / Compliance Feeds ──────────────────────────────────────────────
  {
    key: 'COURT_LISTENER_API_KEY',
    required: false,
    description: 'CourtListener API key for legal case data feed',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'EQUIFAX_API_KEY',
    required: false,
    description: 'Equifax API key for credit/KYB data feed',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AIS_API_KEY',
    required: false,
    description:
      'AIS vessel tracking API key — required for live vessel positions (P1-005); falls back to demo data without it',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AIS_FEED_ENABLED',
    required: false,
    description: 'Enable AIS vessel tracking data feed (true | false)',
    defaultValue: 'false',
    group: 'integrations',
  },
  {
    key: 'LEGAL_FEED_ENABLED',
    required: false,
    description: 'Enable legal case data feed (true | false)',
    defaultValue: 'false',
    group: 'integrations',
  },
  {
    key: 'SANCTIONS_FEED_ENABLED',
    required: false,
    description: 'Enable sanctions data feed (true | false)',
    defaultValue: 'false',
    group: 'integrations',
  },
  {
    key: 'STIX_FEED_ENABLED',
    required: false,
    description: 'Enable STIX threat intelligence feed (true | false)',
    defaultValue: 'false',
    group: 'integrations',
  },

  // ── Feature Flags (additional) ────────────────────────────────────────────
  {
    key: 'SYNTHETIC_ALERTS',
    required: false,
    description: 'Enable synthetic alert generation for demo/dev environments (true | false)',
    defaultValue: 'false',
    group: 'features',
  },

  // ── Memory / RAG ──────────────────────────────────────────────────────────
  {
    key: 'MEMORY_HYDRATE_LIMIT',
    required: false,
    description: 'Maximum number of memory entries to hydrate per request',
    defaultValue: '100',
    group: 'platform',
  },
  {
    key: 'MEMORY_EPHEMERAL_MAX_AGE_MIN',
    required: false,
    description: 'Maximum age of ephemeral memory entries in minutes',
    defaultValue: '60',
    group: 'platform',
  },
  {
    key: 'TRACE_HYDRATE_LIMIT',
    required: false,
    description: 'Maximum number of traces to hydrate per request',
    defaultValue: '50',
    group: 'platform',
  },
  {
    key: 'TRACE_RETENTION_DAYS',
    required: false,
    description: 'Number of days to retain decision traces',
    defaultValue: '90',
    group: 'platform',
  },
  {
    key: 'CORTEX_SNAPSHOT_RETENTION_DAYS',
    required: false,
    description: 'Number of days to retain Cortex snapshots',
    defaultValue: '30',
    group: 'platform',
  },
  {
    key: 'PERSISTENCE_FLUSH_INTERVAL_MS',
    required: false,
    description: 'How often to flush the persistence layer (ms)',
    defaultValue: '5000',
    group: 'platform',
  },
  {
    key: 'PERSISTENCE_RETENTION_INTERVAL_MS',
    required: false,
    description: 'How often to run retention cleanup (ms)',
    defaultValue: '3600000',
    group: 'platform',
  },

  // ── Expo / Mobile ─────────────────────────────────────────────────────────
  {
    key: 'EXPO_ACCESS_TOKEN',
    required: false,
    description: 'Expo access token for EAS Build API calls from the server',
    sensitive: true,
    group: 'integrations',
  },

  // ── Federated API Gateway ─────────────────────────────────────────────────
  {
    key: 'FEDERATION_API_TOKENS',
    required: false,
    description: 'Comma-separated list of tokens accepted from federated partner APIs',
    sensitive: true,
    group: 'auth',
  },

  // ── Build Metadata (CI-injected) ──────────────────────────────────────────
  {
    key: 'BUILD_VERSION',
    required: false,
    description: 'Application version label injected by CI (do not set manually)',
    defaultValue: '0.0.0',
    group: 'runtime',
  },
  {
    key: 'BUILD_TIMESTAMP',
    required: false,
    description: 'Build timestamp injected by CI (do not set manually)',
    group: 'runtime',
  },
  {
    key: 'COMMIT_SHA',
    required: false,
    description: 'Git commit SHA injected by CI (do not set manually)',
    group: 'runtime',
  },

  // ── App-Specific Admin Contacts ───────────────────────────────────────────
  {
    key: 'CARLOTA_ADMIN_EMAIL',
    required: false,
    description: 'Admin email for Carlota Jo consulting app notifications',
    group: 'server',
  },
  {
    key: 'STEPHEN_ADMIN_EMAIL',
    required: false,
    description: 'Admin email for Stephen site notifications',
    group: 'server',
  },
  {
    key: 'SZL_INTERNAL_EMAIL',
    required: false,
    description: 'Internal SZL email address for platform notifications',
    group: 'server',
  },

  // ── Backup ────────────────────────────────────────────────────────────────
  {
    key: 'BACKUP_DIR',
    required: false,
    description: 'Directory to write backup files (local dev only)',
    defaultValue: '/tmp/szl-backups',
    group: 'storage',
  },

  // ── Billing (additional) ─────────────────────────────────────────────────
  {
    key: 'STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key for client-side Stripe.js initialization',
    group: 'billing',
  },

  // ── Platform URLs ─────────────────────────────────────────────────────────
  {
    key: 'APP_MODE',
    required: false,
    description: 'Application mode label (e.g. production | staging | demo)',
    group: 'server',
  },
  {
    key: 'APP_URL',
    required: false,
    description: 'Canonical application URL (alias for PUBLIC_APP_URL)',
    group: 'server',
  },
  {
    key: 'APP_BASE_URL',
    required: false,
    description: 'Base URL path prefix for the application (useful when hosted under a sub-path)',
    group: 'server',
  },
  {
    key: 'PLATFORM_UI_URL',
    required: false,
    description: 'Public URL of the platform UI (used for cross-service links)',
    group: 'server',
  },
  {
    key: 'PLATFORM_API_URL',
    required: false,
    description: 'Public URL of the platform API (used for cross-service calls)',
    group: 'server',
  },

  // ── Domain product toggles ────────────────────────────────────────────────
  {
    key: 'AEGIS_ENV',
    required: false,
    description: 'Aegis environment label override (e.g. demo | staging | production)',
    group: 'platform',
  },
  {
    key: 'PRISM_COUNSEL_SEED_DEMO',
    required: false,
    description: "Set to 'true' to seed PRISM Counsel demo data on startup",
    defaultValue: 'false',
    group: 'platform',
  },
  {
    key: 'SELF_HEALING_DEMO_SEED',
    required: false,
    description: "Set to 'true' to seed self-healing orchestrator demo data on startup",
    defaultValue: 'false',
    group: 'platform',
  },

  // ── AI / LLM (additional) ─────────────────────────────────────────────────
  {
    key: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for direct OpenAI calls (non-Replit-proxy path)',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'OPENAI_BASE_URL',
    required: false,
    description: 'OpenAI API base URL override (for proxies or Azure OpenAI)',
    group: 'integrations',
  },
  {
    key: 'HF_PROVIDER',
    required: false,
    description: 'HuggingFace inference provider (e.g. hf-inference | together | replicate)',
    group: 'integrations',
  },
  {
    key: 'HF_EMBED_MODEL',
    required: false,
    description: 'HuggingFace embedding model ID (e.g. sentence-transformers/all-MiniLM-L6-v2)',
    group: 'integrations',
  },
  {
    key: 'ALLOY_POLICY_LLM_MODEL',
    required: false,
    description: 'LLM model used for Alloy policy compilation and reasoning',
    defaultValue: 'gpt-4o',
    group: 'alloy',
  },
  {
    key: 'AI_BUDGET_DAILY_USD',
    required: false,
    description: 'Daily AI spend budget cap in USD — triggers alert at AI_BUDGET_ALERT_PCT',
    group: 'integrations',
  },
  {
    key: 'AI_BUDGET_HOURLY_USD',
    required: false,
    description: 'Hourly AI spend budget cap in USD — triggers alert at AI_BUDGET_ALERT_PCT',
    group: 'integrations',
  },
  {
    key: 'AI_BUDGET_MONTHLY_USD',
    required: false,
    description: 'Monthly AI spend budget cap in USD — triggers alert at AI_BUDGET_ALERT_PCT',
    group: 'integrations',
  },
  {
    key: 'AI_BUDGET_ALERT_PCT',
    required: false,
    description: 'Percentage of AI budget consumed before an alert fires (0–100)',
    defaultValue: '80',
    group: 'integrations',
  },
  {
    key: 'AI_REQUIRE_APPROVAL_FOR_HIGH_RISK',
    required: false,
    description: "Set to 'true' to require human approval before executing high-risk AI actions",
    defaultValue: 'true',
    group: 'integrations',
  },
  {
    key: 'AI_REVIEW_HYDRATE_LIMIT',
    required: false,
    description: 'Maximum number of AI review records to hydrate per request',
    defaultValue: '50',
    group: 'integrations',
  },
  {
    key: 'AI_TRACE_HYDRATE_LIMIT',
    required: false,
    description: 'Maximum number of AI trace records to hydrate per request',
    defaultValue: '100',
    group: 'integrations',
  },

  // ── AEF / Substrate Gateway ──────────────────────────────────────────────
  {
    key: 'AEF_API_URL',
    required: false,
    description: 'AEF (Agentic Execution Fabric) API base URL',
    group: 'integrations',
  },
  {
    key: 'AEF_API_KEY',
    required: false,
    description: 'AEF API key for authenticating with the execution fabric',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'AEF_GATEWAY_URL',
    required: false,
    description: 'AEF gateway URL for agent routing',
    group: 'integrations',
  },
  {
    key: 'AEF_TENANT_ID',
    required: false,
    description: 'AEF tenant ID for multi-tenant fabric isolation',
    group: 'integrations',
  },
  {
    key: 'SUBSTRATE_GATEWAY_API_KEY',
    required: false,
    description: 'Substrate gateway API key for agent mesh authentication',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SUBSTRATE_GATEWAY_PORT',
    required: false,
    description: 'Substrate gateway listen port',
    defaultValue: '8080',
    group: 'integrations',
  },
  {
    key: 'SUBSTRATE_SIGNING_KEY',
    required: false,
    description: 'Substrate request signing key (hex) for agent-mesh HMAC signatures',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SUBSTRATE_PYTHON_WORKER_URL',
    required: false,
    description: 'URL of the Substrate Python worker for heavy compute tasks',
    group: 'integrations',
  },
  {
    key: 'MCP_GATEWAY_ENDPOINT',
    required: false,
    description: 'MCP (Model Context Protocol) gateway endpoint URL',
    group: 'integrations',
  },
  {
    key: 'MCP_GATEWAY_UPSTREAM_TIMEOUT_MS',
    required: false,
    description: 'Timeout in ms for upstream MCP gateway calls',
    defaultValue: '30000',
    group: 'integrations',
  },

  // ── Security (additional) ─────────────────────────────────────────────────
  {
    key: 'SECRET_ENCRYPTION_KEY',
    required: false,
    description: 'Generic secret encryption key used by the secrets vault module',
    sensitive: true,
    group: 'security',
  },
  {
    key: 'SESSION_MIN_CREATED_AT',
    required: false,
    description: 'ISO timestamp — sessions created before this date are invalidated (forced re-login after key rotation)',
    group: 'auth',
  },
  {
    key: 'INTERNAL_SERVICE_TOKENS',
    required: false,
    description: 'Comma-separated list of bearer tokens accepted from trusted internal services',
    sensitive: true,
    group: 'security',
  },
  {
    key: 'INTERNAL_TOKENS_ALLOW_LEGACY_ONLY',
    required: false,
    description: "Set to 'true' to restrict internal tokens to the legacy single-token format (migration aid)",
    defaultValue: 'false',
    group: 'security',
  },
  {
    key: 'UNSUBSCRIBE_SECRET',
    required: false,
    description: 'HMAC secret used to sign and verify email unsubscribe tokens',
    sensitive: true,
    group: 'security',
  },
  {
    key: 'USAGE_EVENT_SERVICE_TOKEN',
    required: false,
    description: 'Bearer token for server-to-server usage event ingestion (POST /api/orgs/:slug/usage/events)',
    sensitive: true,
    group: 'security',
  },

  // ── Integrations — CRM / Ticketing ────────────────────────────────────────
  {
    key: 'JIRA_CLIENT_ID',
    required: false,
    description: 'Jira OAuth client ID',
    group: 'integrations',
  },
  {
    key: 'JIRA_CLIENT_SECRET',
    required: false,
    description: 'Jira OAuth client secret',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'JIRA_WEBHOOK_SECRET',
    required: false,
    description: 'Jira webhook shared secret for payload verification',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SALESFORCE_CLIENT_ID',
    required: false,
    description: 'Salesforce Connected App client ID',
    group: 'integrations',
  },
  {
    key: 'SALESFORCE_CLIENT_SECRET',
    required: false,
    description: 'Salesforce Connected App client secret',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SALESFORCE_WEBHOOK_SECRET',
    required: false,
    description: 'Salesforce outbound message HMAC secret',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'PAGERDUTY_WEBHOOK_SECRET',
    required: false,
    description: 'PagerDuty webhook signing secret',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'POWER_AUTOMATE_WEBHOOK_SECRET',
    required: false,
    description: 'Power Automate webhook HMAC secret',
    sensitive: true,
    group: 'integrations',
  },

  // ── Email webhooks ────────────────────────────────────────────────────────
  {
    key: 'RESEND_WEBHOOK_SECRET',
    required: false,
    description: 'Resend email webhook signing secret (svix payload verification)',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'SENDGRID_WEBHOOK_SECRET',
    required: false,
    description: 'SendGrid event webhook verification key',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'WEBHOOK_DELIVERY_ALLOWLIST',
    required: false,
    description: 'Comma-separated hostname allowlist for outbound webhook delivery (empty = allow all)',
    group: 'integrations',
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    key: 'POSTHOG_API_KEY',
    required: false,
    description: 'PostHog project API key for product analytics',
    sensitive: true,
    group: 'observability',
  },
  {
    key: 'AMPLITUDE_API_KEY',
    required: false,
    description: 'Amplitude project API key for product analytics',
    sensitive: true,
    group: 'observability',
  },

  // ── Security feeds ────────────────────────────────────────────────────────
  {
    key: 'SIEM_INGEST_TOKEN',
    required: false,
    description: 'Bearer token for authenticating SIEM event ingest requests',
    sensitive: true,
    group: 'security',
  },
  {
    key: 'TAXII_SERVER_URL',
    required: false,
    description: 'TAXII 2.x server URL for STIX threat intelligence feeds',
    group: 'integrations',
  },
  {
    key: 'OT_ICS_FEED_ENABLED',
    required: false,
    description: "Set to 'true' to enable OT/ICS threat feed ingestion",
    defaultValue: 'false',
    group: 'features',
  },

  // ── Data retention ───────────────────────────────────────────────────────
  {
    key: 'ATLAS_RETENTION_DAYS',
    required: false,
    description: 'Number of days to retain ATLAS entity history before compaction',
    defaultValue: '90',
    group: 'atlas',
  },
  {
    key: 'ATLAS_EXPORT_CONCURRENCY',
    required: false,
    description: 'Maximum parallel ATLAS export workers',
    defaultValue: '4',
    group: 'atlas',
  },
  {
    key: 'ATLAS_EXPORT_POLL_MS',
    required: false,
    description: 'Polling interval in ms for ATLAS export progress checks',
    defaultValue: '2000',
    group: 'atlas',
  },
  {
    key: 'COMPACTION_DRY_RUN',
    required: false,
    description: "Set to 'true' to simulate compaction without deleting records",
    defaultValue: 'false',
    group: 'atlas',
  },
  {
    key: 'CORTEX_DRAFT_RETENTION_DAYS',
    required: false,
    description: 'Days to keep draft Cortex snapshots before pruning',
    defaultValue: '7',
    group: 'platform',
  },
  {
    key: 'CORTEX_SNAPSHOT_INTERVAL_HOURS',
    required: false,
    description: 'Hours between automatic Cortex consciousness snapshots',
    defaultValue: '24',
    group: 'platform',
  },
  {
    key: 'CHECKPOINT_RETENTION_HOURS',
    required: false,
    description: 'Hours to retain incremental checkpoints before rolling into a snapshot',
    defaultValue: '48',
    group: 'platform',
  },
  {
    key: 'ENTITY_SNAPSHOT_RETENTION_DAYS',
    required: false,
    description: 'Days to retain entity snapshots in the ATLAS store',
    defaultValue: '30',
    group: 'atlas',
  },
  {
    key: 'EVIDENCE_RETENTION_DAYS',
    required: false,
    description: 'Days to retain risk evidence records before archival',
    defaultValue: '365',
    group: 'platform',
  },
  {
    key: 'RECOMMENDATION_RETENTION_DAYS',
    required: false,
    description: 'Days to retain AI recommendation records',
    defaultValue: '90',
    group: 'platform',
  },
  {
    key: 'SIGNAL_RETENTION_DAYS',
    required: false,
    description: 'Days to retain signal records in the signal mesh',
    defaultValue: '30',
    group: 'platform',
  },

  // ── Scheduler intervals ───────────────────────────────────────────────────
  {
    key: 'SIGNAL_FUSION_INTERVAL_MINUTES',
    required: false,
    description: 'Minutes between signal fusion runs in the Alloy orchestrator',
    defaultValue: '15',
    group: 'platform',
  },
  {
    key: 'DRIFT_SAMPLE_INTERVAL_MINUTES',
    required: false,
    description: 'Minutes between ownership drift sampling runs',
    defaultValue: '60',
    group: 'platform',
  },
  {
    key: 'ALERT_EVAL_INTERVAL_MINUTES',
    required: false,
    description: 'Minutes between alert rule evaluation cycles',
    defaultValue: '5',
    group: 'platform',
  },
  {
    key: 'COGNITIVE_TELEMETRY_FLUSH_INTERVAL_MS',
    required: false,
    description: 'Milliseconds between cognitive telemetry flush operations',
    defaultValue: '60000',
    group: 'platform',
  },
  {
    key: 'OTEL_COGNITIVE_ENDPOINT',
    required: false,
    description: 'OTLP endpoint for cognitive telemetry spans (separate from main OTLP endpoint)',
    group: 'observability',
  },
  {
    key: 'STUCK_RUN_HARD_TIMEOUT_MS',
    required: false,
    description: 'Milliseconds after which a stuck workflow run is force-terminated',
    defaultValue: '3600000',
    group: 'platform',
  },

  // ── Agent mesh thresholds ─────────────────────────────────────────────────
  {
    key: 'MESH_ALERT_DROP_THRESHOLD',
    required: false,
    description: 'Resilience index score below which an alert is fired for the agent mesh',
    defaultValue: '0.5',
    group: 'platform',
  },
  {
    key: 'MESH_ALERT_SUBINDEX_THRESHOLD',
    required: false,
    description: 'Sub-index score below which individual agent alerts are raised',
    defaultValue: '0.3',
    group: 'platform',
  },
  {
    key: 'MESH_SCHEDULED_ONLY_ORG_IDS',
    required: false,
    description: 'Comma-separated org IDs restricted to scheduled (non-realtime) mesh runs',
    group: 'platform',
  },
  {
    key: 'MESH_SCHEDULED_ORG_IDS',
    required: false,
    description: 'Comma-separated org IDs enabled for scheduled mesh scan runs',
    group: 'platform',
  },
  {
    key: 'HEALTH_DEGRADED_ALERT_CHANNEL',
    required: false,
    description: 'Slack channel or email address for health-degraded alert notifications',
    group: 'observability',
  },
  {
    key: 'HEALTH_DEGRADED_ALERT_SEVERITY',
    required: false,
    description: 'Minimum severity level to trigger health-degraded alerts (info | warn | error)',
    defaultValue: 'warn',
    group: 'observability',
  },
  {
    key: 'ALERTS_PAGE_URL',
    required: false,
    description: 'Public URL of the alerts management page (embedded in alert notification emails)',
    group: 'server',
  },
  {
    key: 'GUARDIAN_TIER_CACHE_TTL_MS',
    required: false,
    description: 'TTL in ms for Guardian tier resolution cache entries',
    defaultValue: '300000',
    group: 'platform',
  },

  // ── Real estate (Terra) ───────────────────────────────────────────────────
  {
    key: 'REAL_ESTATE_DATA_PROVIDER',
    required: false,
    description: 'Active real estate data provider (attom | costar | compstak | mls)',
    group: 'integrations',
  },
  {
    key: 'ATTOM_API_KEY',
    required: false,
    description: 'ATTOM Data Solutions API key for property data',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'COSTAR_API_KEY',
    required: false,
    description: 'CoStar Group API key for commercial real estate data',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'TERRA_COSTAR_ENABLED',
    required: false,
    description: "Set to 'true' to enable live CoStar data in Terra property intelligence",
    defaultValue: 'false',
    group: 'features',
  },
  {
    key: 'TERRA_COMPSTAK_ENABLED',
    required: false,
    description: "Set to 'true' to enable live CompStak lease comps in Terra",
    defaultValue: 'false',
    group: 'features',
  },
  {
    key: 'TERRA_MLS_ENABLED',
    required: false,
    description: "Set to 'true' to enable MLS feed integration in Terra",
    defaultValue: 'false',
    group: 'features',
  },
  {
    key: 'TERRA_DILIGENCE_TOKEN',
    required: false,
    description: 'Bearer token for the Terra diligence data provider',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'TERRA_INGESTION_INTERVAL_MS',
    required: false,
    description: 'Milliseconds between Terra property data ingestion cycles',
    defaultValue: '3600000',
    group: 'platform',
  },
  {
    key: 'TERRA_EXTENDED_INGESTION_INTERVAL_MS',
    required: false,
    description: 'Milliseconds between Terra extended (deep-enrichment) ingestion cycles',
    defaultValue: '86400000',
    group: 'platform',
  },

  // ── Maritime (Vessels) ────────────────────────────────────────────────────
  {
    key: 'VESSELS_BOL_HMAC_SECRET',
    required: false,
    description: 'HMAC secret for verifying bill-of-lading webhook payloads from the shipping carrier',
    sensitive: true,
    group: 'integrations',
  },
  {
    key: 'NYC_OPEN_DATA_TOKEN',
    required: false,
    description: 'NYC Open Data Socrata app token for increased API rate limits',
    sensitive: true,
    group: 'integrations',
  },

  // ── Integrations — Misc ───────────────────────────────────────────────────
  {
    key: 'CONNECT_BASE_URL',
    required: false,
    description: 'Base URL for the SZL Connect integration gateway',
    group: 'integrations',
  },

  // ── Notifications / digest recipients ────────────────────────────────────
  {
    key: 'COMPETITIVE_INTEL_EMAIL_RECIPIENTS',
    required: false,
    description: 'Comma-separated email addresses for competitive intelligence digest delivery',
    group: 'server',
  },
  {
    key: 'COMPETITIVE_INTEL_SLACK_CHANNEL',
    required: false,
    description: 'Slack channel for competitive intelligence digest delivery',
    group: 'integrations',
  },
  {
    key: 'PROOF_CHAIN_DIGEST_EMAIL_RECIPIENTS',
    required: false,
    description: 'Comma-separated email addresses for proof-chain digest delivery',
    group: 'server',
  },
  {
    key: 'PROOF_CHAIN_DIGEST_SLACK_CHANNEL',
    required: false,
    description: 'Slack channel for proof-chain digest delivery',
    group: 'integrations',
  },
  {
    key: 'FOUNDER_ALERT_EMAIL',
    required: false,
    description: 'Email address for founder-level operational alerts',
    group: 'server',
  },
  {
    key: 'SUPPORT_ADMIN_EMAIL',
    required: false,
    description: 'Email address that receives new support ticket notifications',
    group: 'server',
  },
  {
    key: 'SUPPORT_EMAIL_NOTIFICATIONS',
    required: false,
    description: "Set to 'true' to enable email notifications for support ticket events",
    defaultValue: 'true',
    group: 'server',
  },
  {
    key: 'SZL_INVESTORS_EMAIL',
    required: false,
    description: 'Email address for investor-facing notifications and LP portal alerts',
    group: 'server',
  },

  // ── Backup (additional) ────────────────────────────────────────────────────
  {
    key: 'BACKUP_REMOTE_BACKEND',
    required: false,
    description: 'Remote backup backend identifier (e.g. s3 | gcs | azure)',
    group: 'storage',
  },
  {
    key: 'BACKUP_REMOTE_RPO_HOURS',
    required: false,
    description: 'Recovery point objective in hours for remote backup verification',
    defaultValue: '24',
    group: 'storage',
  },

  // ── Runtime performance ───────────────────────────────────────────────────
  {
    key: 'NODE_HEAP_LIMIT_MB',
    required: false,
    description: 'V8 heap size limit in MB (passed as --max-old-space-size at startup)',
    group: 'server',
  },

  // ── Vite client-side env vars ─────────────────────────────────────────────
  {
    key: 'VITE_APP_URL',
    required: false,
    description: 'App URL injected into Vite bundles for client-side use',
    group: 'server',
  },
  {
    key: 'VITE_POSTHOG_KEY',
    required: false,
    description: 'PostHog project API key injected into Vite bundles for browser-side analytics',
    sensitive: true,
    group: 'observability',
  },
  {
    key: 'VITE_AMPLITUDE_API_KEY',
    required: false,
    description: 'Amplitude API key injected into Vite bundles for browser-side analytics',
    sensitive: true,
    group: 'observability',
  },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  resolved: Record<string, string>;
  runtimeMode: import('@szl-holdings/config').RuntimeMode;
  envSummary: {
    group: string;
    vars: { key: string; configured: boolean; required: boolean; description: string }[];
  }[];
}

export function validateStartupConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const resolved: Record<string, string> = {};

  for (const spec of ENV_SPECS) {
    const value = process.env[spec.key];

    if (!value && spec.required) {
      errors.push(`Missing required env var: ${spec.key} — ${spec.description}`);
    } else if (!value && spec.defaultValue) {
      process.env[spec.key] = spec.defaultValue;
      resolved[spec.key] = spec.defaultValue;
    } else if (value) {
      resolved[spec.key] = spec.sensitive ? '***' : value;
    }
  }

  const explicitMode = process.env.RUNTIME_MODE;
  if (
    explicitMode &&
    !['local-dev', 'internal-preview', 'demo', 'production'].includes(explicitMode)
  ) {
    errors.push(
      `RUNTIME_MODE is set to an unrecognized value: "${explicitMode}". ` +
        `Valid values: local-dev, internal-preview, demo, production. ` +
        `Unset or correct RUNTIME_MODE before starting the server.`,
    );
  }

  let isProduction = false;
  let isDemoMode = false;
  let runtimeMode: import('@szl-holdings/config').RuntimeMode = 'local-dev';
  try {
    isProduction = isProductionMode();
    isDemoMode = resolveIsDemoMode();
    runtimeMode = resolveRuntimeMode();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Runtime mode resolution failed: ${msg}`);
    isProduction = process.env.NODE_ENV === 'production';
  }

  if (!process.env.DATABASE_URL) {
    if (isProduction) {
      errors.push(
        'DATABASE_URL is not set — the server cannot connect to the database and will not start. ' +
          'Set DATABASE_URL in Replit Secrets (see docs/SECRETS_POLICY.md).',
      );
    } else {
      warnings.push('DATABASE_URL not set — database features will be unavailable');
    }
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (isProduction) {
      errors.push(
        'SESSION_SECRET is not set — the server will not start without a session signing secret. ' +
          'Generate a secure 64-char random value and set it in Replit Secrets.',
      );
    } else {
      warnings.push('SESSION_SECRET not set — sessions will use an insecure default (not safe for production)');
    }
  } else if (sessionSecret.length < 32) {
    if (isProduction) {
      errors.push(
        `SESSION_SECRET is too short (${sessionSecret.length} chars, minimum 32) — replace with a ` +
          'cryptographically random value of at least 32 characters.',
      );
    } else {
      warnings.push(
        `SESSION_SECRET is short (${sessionSecret.length} chars) — use at least 32 characters in production`,
      );
    }
  }

  if (isProduction && !process.env.CORS_ORIGINS) {
    warnings.push('CORS_ORIGINS not set in production — cross-origin requests may be blocked');
  }

  if (isProduction && !process.env.PUBLIC_APP_URL) {
    warnings.push(
      'PUBLIC_APP_URL not set in production — OIDC redirects and email links may be broken',
    );
  }

  if (isProduction && !process.env.SERVICE_ROLE_KEY) {
    warnings.push(
      'SERVICE_ROLE_KEY not set — machine-to-machine calls requiring admin bypass will fail',
    );
  }

  if (isProduction && !process.env.SENTRY_DSN) {
    warnings.push(
      'SENTRY_DSN not set — error tracking is disabled in production (KG028). Set SENTRY_DSN in Key Vault before first production traffic.',
    );
  }

  if (
    isProduction &&
    !process.env.OTEL_EXPORTER_OTLP_ENDPOINT &&
    !process.env.OTLP_ENDPOINT &&
    !process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING
  ) {
    warnings.push(
      'No OTEL exporter configured in production (KG009). Set OTEL_EXPORTER_OTLP_ENDPOINT or AZURE_APP_INSIGHTS_CONNECTION_STRING in Key Vault before first production traffic.',
    );
  }

  const alloyToken = process.env.ALLOY_INTERNAL_TOKEN;
  if (!alloyToken) {
    if (isProduction) {
      errors.push(
        'ALLOY_INTERNAL_TOKEN is not set — this is required in production. Set a secure 32+ character secret.',
      );
    } else {
      const generated = randomBytes(48).toString('hex');
      process.env.ALLOY_INTERNAL_TOKEN = generated;
      warnings.push(
        'ALLOY_INTERNAL_TOKEN not set — auto-generated a secure 96-char token for this session (set a permanent secret for production)',
      );
    }
  } else if (alloyToken.length < 32) {
    if (isProduction) {
      errors.push(
        `ALLOY_INTERNAL_TOKEN is too short (${alloyToken.length} chars, minimum 32) — replace with a secure 32+ character secret.`,
      );
    } else {
      warnings.push(
        `ALLOY_INTERNAL_TOKEN is short (${alloyToken.length} chars) — use a 32+ character secret in production`,
      );
    }
  }

  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!alphaVantageKey) {
    if (isProduction) {
      errors.push(
        'ALPHA_VANTAGE_API_KEY is not set. This key is required in production for the Lyte macro ' +
          'indicator panel. Without it, all market indicator requests return the built-in seed snapshot ' +
          '(dataQuality=seed, isStale=true). Set ALPHA_VANTAGE_API_KEY in Replit Secrets.',
      );
    } else {
      warnings.push(
        'ALPHA_VANTAGE_API_KEY is not set — Lyte market indicators will use the built-in seed snapshot. ' +
          'Set the key to enable live Alpha Vantage delayed/EOD feeds.',
      );
    }
  }

  // B-02: Detect known-dev plaintext key values that must never reach production.
  // These values appear in the .replit [userenv] block for convenience during
  // local development. In production they MUST be superseded by Replit Secrets.
  const KNOWN_DEV_ALLOY_TOKEN = 'dev-3e8122992689a527adcf8ba067ccabfae77b81f3e52aa713';
  const KNOWN_DEV_SUBSTRATE_KEY = '5228884b12bc50c3be1c0f8345d5f5475baf5bc2ccb265d5e9bc02674c04258a';
  const KNOWN_DEV_SUBSTRATE_GW_KEY = 'szl_dev_9b77bf02c5939ec060f07d87ad02542a2561330d0c9ae5fc';

  if (process.env.ALLOY_INTERNAL_TOKEN === KNOWN_DEV_ALLOY_TOKEN) {
    if (isProduction) {
      errors.push(
        'ALLOY_INTERNAL_TOKEN matches the known dev-tier placeholder — this value MUST NOT run in production. ' +
          'Set a cryptographically random 64+ character token in Replit Secrets (see docs/SECRETS_POLICY.md).',
      );
    } else {
      warnings.push(
        '[B-02] ALLOY_INTERNAL_TOKEN is the known dev placeholder — override via Replit Secrets before deploying.',
      );
    }
  }

  const substrateSigningKey = process.env.SUBSTRATE_SIGNING_KEY;
  if (substrateSigningKey === KNOWN_DEV_SUBSTRATE_KEY) {
    if (isProduction) {
      errors.push(
        'SUBSTRATE_SIGNING_KEY matches the known dev-tier value from .replit — this key MUST NOT run in production. ' +
          'Set a unique 64-char hex key in Replit Secrets (see docs/SECRETS_POLICY.md).',
      );
    } else {
      warnings.push(
        '[B-02] SUBSTRATE_SIGNING_KEY is the known dev value — override via Replit Secrets before deploying.',
      );
    }
  }

  const substrateGwKey = process.env.SUBSTRATE_GATEWAY_API_KEY;
  if (substrateGwKey === KNOWN_DEV_SUBSTRATE_GW_KEY) {
    if (isProduction) {
      errors.push(
        'SUBSTRATE_GATEWAY_API_KEY matches the known dev-tier value — this key MUST NOT run in production. ' +
          'Rotate and set the production key in Replit Secrets (see docs/SECRETS_POLICY.md).',
      );
    } else {
      warnings.push(
        '[B-02] SUBSTRATE_GATEWAY_API_KEY is the known dev value — override via Replit Secrets before deploying.',
      );
    }
  }

  const connectorKey = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!connectorKey) {
    if (isProduction) {
      errors.push(
        'CONNECTOR_ENCRYPTION_KEY is not set — this is required in production for RMM credential encryption. Generate a 64-char hex key and add it to secrets.',
      );
    } else {
      warnings.push(
        'CONNECTOR_ENCRYPTION_KEY not set — RMM provider credentials will use a derived development key (not safe for production)',
      );
    }
  } else if (!/^[0-9a-fA-F]{64}$/.test(connectorKey)) {
    if (isProduction) {
      errors.push(
        'CONNECTOR_ENCRYPTION_KEY must be exactly 64 hex characters (256 bits) — replace with a properly generated key.',
      );
    } else {
      warnings.push(
        'CONNECTOR_ENCRYPTION_KEY format is invalid (expected 64 hex chars) — verify before deploying to production',
      );
    }
  }

  const mfaEncKey = process.env.MFA_SECRET_ENCRYPTION_KEY;
  if (!mfaEncKey) {
    if (isProduction) {
      errors.push(
        'MFA_SECRET_ENCRYPTION_KEY is not set — TOTP secrets will be stored in plaintext, which is a production security violation. ' +
          'Generate a 64-char hex key (openssl rand -hex 32) and add it to secrets before deploying.',
      );
    } else {
      warnings.push(
        'MFA_SECRET_ENCRYPTION_KEY not set — TOTP secrets will fall back to plaintext storage (not safe for production). ' +
          'Set MFA_SECRET_ENCRYPTION_KEY before deploying.',
      );
    }
  } else {
    const isValidHex = /^[0-9a-fA-F]{64}$/.test(mfaEncKey);
    const isValidBase64 = /^[A-Za-z0-9+/]{44}$/.test(mfaEncKey);
    if (!isValidHex && !isValidBase64) {
      if (isProduction) {
        errors.push(
          'MFA_SECRET_ENCRYPTION_KEY format is invalid (expected 64 hex chars or 44 base64 chars = 32 bytes) — replace with a properly generated key.',
        );
      } else {
        warnings.push(
          'MFA_SECRET_ENCRYPTION_KEY format is invalid (expected 64 hex chars or 44 base64 chars) — verify before deploying to production',
        );
      }
    }
  }

  if (!process.env.OAUTH_STATE_SECRET) {
    const generated = randomBytes(32).toString('hex');
    process.env.OAUTH_STATE_SECRET = generated;
    warnings.push(
      'OAUTH_STATE_SECRET not set — auto-generated a secure 64-char secret for this session',
    );
  }

  if (isProduction && process.env.ALLOY_REQUIRE_APPROVAL_CRITICAL === 'false') {
    errors.push(
      "ALLOY_REQUIRE_APPROVAL_CRITICAL cannot be set to 'false' in production — human approval is required for consequential actions. This is an architectural invariant.",
    );
  }

  if (!process.env.UNSUBSCRIBE_SECRET) {
    if (isProduction) {
      errors.push(
        'UNSUBSCRIBE_SECRET is not set — email unsubscribe tokens cannot be signed or verified. ' +
          'Without this secret, unsubscribe and resubscribe links will fail for all users. ' +
          'Generate a cryptographically random 32+ character secret and set it in Replit Secrets.',
      );
    } else {
      warnings.push(
        'UNSUBSCRIBE_SECRET not set — generateUnsubscribeToken() and verifyUnsubscribeToken() will throw at runtime. ' +
          'Set UNSUBSCRIBE_SECRET before testing email unsubscribe flows.',
      );
    }
  }

  if (!process.env.RESEND_WEBHOOK_SECRET) {
    if (isProduction) {
      errors.push(
        'RESEND_WEBHOOK_SECRET is not set — Resend email webhook payloads cannot be authenticated. ' +
          'All POST requests to /api/email-webhooks/resend will be rejected with 401. ' +
          'Set the webhook signing secret from the Resend dashboard in Replit Secrets.',
      );
    } else {
      warnings.push(
        'RESEND_WEBHOOK_SECRET not set — /api/email-webhooks/resend will reject all webhook deliveries with 401',
      );
    }
  }

  if (!process.env.SENDGRID_WEBHOOK_SECRET) {
    if (isProduction) {
      errors.push(
        'SENDGRID_WEBHOOK_SECRET is not set — SendGrid email webhook payloads cannot be authenticated. ' +
          'All POST requests to /api/email-webhooks/sendgrid will be rejected with 401. ' +
          'Set the event webhook verification key from the SendGrid dashboard in Replit Secrets.',
      );
    } else {
      warnings.push(
        'SENDGRID_WEBHOOK_SECRET not set — /api/email-webhooks/sendgrid will reject all webhook deliveries with 401',
      );
    }
  }

  if (isDemoMode) {
    logger.info(
      { runtimeMode },
      'Runtime mode: demo — external service calls will be mocked, destructive operations disabled',
    );
  } else {
    logger.info({ runtimeMode }, 'Runtime mode resolved');
  }

  const groupMap = new Map<string, typeof ENV_SPECS>();
  for (const spec of ENV_SPECS) {
    const g = spec.group ?? 'other';
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)?.push(spec);
  }

  const envSummary = Array.from(groupMap.entries()).map(([group, vars]) => ({
    group,
    vars: vars.map((spec) => ({
      key: spec.key,
      configured: !!process.env[spec.key],
      required: spec.required,
      description: spec.description,
    })),
  }));

  const valid = errors.length === 0;

  if (!valid) {
    logger.error({ errors }, 'Startup config validation FAILED');
  }

  for (const w of warnings) {
    logger.warn(w);
  }

  if (valid) {
    logger.info({ resolved }, 'Startup config validation passed');
  }

  return { valid, errors, warnings, resolved, envSummary, runtimeMode };
}

export function failFastOnInvalidConfig(): void {
  const result = validateStartupConfig();
  if (!result.valid) {
    logger.fatal({ errors: result.errors }, 'Cannot start server — fix configuration errors above');
    process.exit(1);
  }
}
