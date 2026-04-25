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
