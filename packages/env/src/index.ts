/**
 * @szl-holdings/env
 *
 * Zod-validated environment variable loader.
 * Import this module early in the entry point of every service.
 * It throws clearly on startup if any required variable is missing or invalid.
 *
 * Usage:
 *   import { env } from "@szl-holdings/env";
 *   const dbUrl = env.DATABASE_URL;
 */

import { z } from "zod";

const booleanFromString = z
  .string()
  .optional()
  .transform((v) => v !== "false" && v !== "0" && v !== "");

const portSchema = z
  .string()
  .optional()
  .default("3000")
  .transform((v) => Number.parseInt(v, 10))
  .pipe(z.number().int().min(1).max(65535));

const optionalUrl = z.string().url().optional().or(z.literal(""));
const optionalStr = z.string().optional();
const optionalInt = (def: string) =>
  z
    .string()
    .optional()
    .default(def)
    .transform((v) => Number.parseInt(v, 10))
    .pipe(z.number().int().min(0));
const optionalFloat = (def: string) =>
  z
    .string()
    .optional()
    .default(def)
    .transform((v) => Number.parseFloat(v))
    .pipe(z.number().min(0).max(1));

export const envSchema = z.object({
  // ── Node / Server ────────────────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "production", "staging", "test"]).default("development"),
  PORT: portSchema,
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .optional()
    .default("info"),

  // ── Runtime Mode ────────────────────────────────────────────────────────
  RUNTIME_MODE: z
    .enum(["local-dev", "internal-preview", "demo", "production"])
    .optional(),
  APP_ENV: optionalStr,

  // ── Database ────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").optional(),
  DB_POOL_MIN: optionalInt("1"),
  // DB_POOL_MAX default reduced from 100 → 12 (Phase 4 hardening, 2026-04-23).
  // Rationale: Replit's shared Postgres has a finite per-instance connection
  // budget (typically ~25–30). With the previous default of 100, two concurrent
  // boots during a post-merge storm (api-server + drizzle-kit + worker fan-out)
  // exhausted the budget and produced "sorry, too many clients already"
  // crashes. 12 leaves headroom for the dedicated healthPool (max 2) plus
  // peer services and migrations. Production deployments with a dedicated
  // Postgres should override via the environment variable.
  DB_POOL_MAX: optionalInt("12"),
  DB_CONNECT_TIMEOUT_MS: optionalInt("90000"),
  DB_IDLE_TIMEOUT_MS: optionalInt("60000"),
  DB_STATEMENT_TIMEOUT_MS: optionalInt("60000"),
  SLOW_QUERY_THRESHOLD_MS: optionalInt("500"),
  // OBS-007 follow-on: warn when a single pool checkout (client.connect →
  // client.release) is held longer than this many ms. Catches leaked
  // clients and runaway transactions at the per-checkout level instead of
  // only when aggregate pool saturation has already happened.
  DB_CHECKOUT_WARN_THRESHOLD_MS: optionalInt("30000"),

  // ── Authentication ──────────────────────────────────────────────────────
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters").optional(),
  ISSUER_URL: optionalUrl,
  OAUTH_STATE_SECRET: optionalStr,
  CLERK_SECRET_KEY: optionalStr,

  // ── Public URLs ─────────────────────────────────────────────────────────
  PUBLIC_APP_URL: optionalUrl,
  CORS_ORIGINS: optionalStr,
  VITE_APP_URL: optionalUrl,
  BASE_URL: optionalStr,
  API_BASE_URL: optionalStr,
  BASE_PATH: optionalStr,

  // ── Internal Service Auth ────────────────────────────────────────────────
  ALLOY_INTERNAL_TOKEN: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 32, { message: "ALLOY_INTERNAL_TOKEN must be >= 32 chars" }),
  CONNECTOR_ENCRYPTION_KEY: optionalStr,
  ADMIN_PIN: optionalStr,
  INTEGRATION_TEST_TOKEN: optionalStr,
  SZL_API_BASE: optionalStr,
  SZL_INTERNAL_TOKEN: optionalStr,

  // ── Email ────────────────────────────────────────────────────────────────
  EMAIL_PROVIDER: z.enum(["resend", "sendgrid", "smtp"]).optional(),
  RESEND_API_KEY: optionalStr,
  SENDGRID_API_KEY: optionalStr,
  SMTP_HOST: optionalStr,
  SMTP_PORT: optionalInt("587"),
  SMTP_USER: optionalStr,
  SMTP_PASS: optionalStr,
  SMTP_FROM: optionalStr,
  SZL_INTERNAL_EMAIL: optionalStr,
  STEPHEN_ADMIN_EMAIL: optionalStr,
  CARLOTA_ADMIN_EMAIL: optionalStr,

  // ── Stripe ───────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: optionalStr,
  STRIPE_PUBLISHABLE_KEY: optionalStr,
  STRIPE_WEBHOOK_SECRET: optionalStr,
  STRIPE_PRICE_STRATEGY_SESSION: optionalStr,
  STRIPE_PRICE_ADVISORY_RETAINER: optionalStr,
  STRIPE_PRICE_PORTFOLIO_REVIEW: optionalStr,
  STRIPE_PRICE_TERRA_STARTER: optionalStr,
  STRIPE_PRICE_TERRA_PRO: optionalStr,
  STRIPE_PRICE_FIRESTORM_ENTERPRISE: optionalStr,
  STRIPE_PRICE_LYTE_STARTER: optionalStr,
  STRIPE_PRICE_LYTE_PRO: optionalStr,
  STRIPE_PRICE_VESSELS_FLEET: optionalStr,

  // ── AI / LLM Providers ───────────────────────────────────────────────────
  OPENAI_API_KEY: optionalStr,
  ANTHROPIC_API_KEY: optionalStr,
  GEMINI_API_KEY: optionalStr,
  AI_INTEGRATIONS_OPENAI_API_KEY: optionalStr,
  AI_INTEGRATIONS_OPENAI_BASE_URL: optionalUrl,
  AI_INTEGRATIONS_ANTHROPIC_API_KEY: optionalStr,
  AI_INTEGRATIONS_ANTHROPIC_BASE_URL: optionalUrl,
  AI_INTEGRATIONS_GEMINI_API_KEY: optionalStr,
  AI_INTEGRATIONS_GEMINI_BASE_URL: optionalUrl,
  AI_INTEGRATIONS_OPENROUTER_API_KEY: optionalStr,
  AI_INTEGRATIONS_OPENROUTER_BASE_URL: optionalUrl,
  NIM_API_KEY: optionalStr,
  NIM_API_BASE_URL: optionalUrl,
  HF_TOKEN: optionalStr,
  HUGGINGFACE_API_KEY: optionalStr,

  // ── WebSocket ────────────────────────────────────────────────────────────
  // ALLOY_INTERNAL_TOKEN doubles as WS auth token (declared above)

  // ── Analytics ────────────────────────────────────────────────────────────
  VITE_PLAUSIBLE_DOMAIN: optionalStr,

  // ── Notifications ────────────────────────────────────────────────────────
  SLACK_WEBHOOK_URL: optionalUrl,
  SLACK_BOT_TOKEN: optionalStr,
  SLACK_ALERT_CHANNEL: optionalStr,
  ALLOY_DIGEST_SLACK_CHANNEL: optionalStr,
  MICROSOFT_TEAMS_WEBHOOK_URL: optionalUrl,
  TWILIO_ACCOUNT_SID: optionalStr,
  TWILIO_AUTH_TOKEN: optionalStr,
  TWILIO_PHONE_NUMBER: optionalStr,
  EXPO_ACCESS_TOKEN: optionalStr,
  VAPID_PUBLIC_KEY: optionalStr,
  VAPID_PRIVATE_KEY: optionalStr,
  VAPID_SUBJECT: optionalStr,

  // ── Maps / Geocoding ─────────────────────────────────────────────────────
  MAPBOX_ACCESS_TOKEN: optionalStr,
  GOOGLE_MAPS_API_KEY: optionalStr,

  // ── Intelligence Feeds ───────────────────────────────────────────────────
  AIS_FEED_ENABLED: booleanFromString,
  AIS_API_KEY: optionalStr,
  AIS_BASE_URL: optionalStr,
  AISHUB_USERNAME: optionalStr,
  MARINETRAFFIC_API_KEY: optionalStr,
  TAXII_SERVER_URL: optionalStr,
  TAXII_COLLECTION: optionalStr,
  TAXII_API_KEY: optionalStr,
  MISP_URL: optionalStr,
  OTX_API_KEY: optionalStr,
  LEGAL_FEED_ENABLED: booleanFromString,
  LEGAL_FEED_SEARCH_QUERIES: optionalStr,
  COURT_LISTENER_API_KEY: optionalStr,
  COURTLISTENER_API_TOKEN: optionalStr,
  SANCTIONS_FEED_ENABLED: booleanFromString,
  STIX_FEED_ENABLED: booleanFromString,
  SODA_APP_TOKEN: optionalStr,
  MARINE_TRAFFIC_API_KEY: optionalStr,
  WEATHER_API_KEY: optionalStr,

  // ── Observability ────────────────────────────────────────────────────────
  OTEL_SERVICE_NAME: z.string().optional().default("szl-holdings-api"),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,
  OTLP_ENDPOINT: optionalUrl,
  OTEL_IN_MEMORY: booleanFromString,
  OTEL_CONSOLE_EXPORT: booleanFromString,
  NEW_RELIC_LICENSE_KEY: optionalStr,
  SENTRY_DSN: optionalStr,
  SENTRY_TRACES_SAMPLE_RATE: optionalFloat("0.1"),
  SENTRY_PROFILES_SAMPLE_RATE: optionalFloat("0.1"),
  VITE_SENTRY_DSN: optionalStr,
  AZURE_APP_INSIGHTS_CONNECTION_STRING: optionalStr,

  // ── Redis ────────────────────────────────────────────────────────────────
  REDIS_URL: optionalUrl,

  // ── Cloud Storage ────────────────────────────────────────────────────────
  STORAGE_ACCESS_KEY: optionalStr,
  STORAGE_SECRET_KEY: optionalStr,
  STORAGE_BUCKET: optionalStr,
  STORAGE_ENDPOINT: optionalUrl,
  PRIVATE_OBJECT_DIR: optionalStr,
  PUBLIC_OBJECT_SEARCH_PATHS: optionalStr,
  DEFAULT_ORG_STORAGE_QUOTA_BYTES: optionalInt("10737418240"),
  BACKUP_DIR: optionalStr,

  // ── Azure ────────────────────────────────────────────────────────────────
  AZURE_PG_CONNECTION_STRING: optionalStr,
  AZURE_REDIS_CONNECTION_STRING: optionalStr,
  AZURE_STORAGE_CONNECTION_STRING: optionalStr,
  AZURE_KEY_VAULT_URL: optionalUrl,
  AZURE_AD_TENANT_ID: optionalStr,
  AZURE_AD_CLIENT_ID: optionalStr,
  AZURE_AD_CLIENT_SECRET: optionalStr,
  AZURE_DOC_INTEL_ENDPOINT: optionalUrl,
  AZURE_DOC_INTEL_KEY: optionalStr,

  // ── Microsoft / DocuSign / Salesforce ───────────────────────────────────
  DYNAMICS_TENANT_ID: optionalStr,
  DYNAMICS_CLIENT_ID: optionalStr,
  DYNAMICS_CLIENT_SECRET: optionalStr,
  DYNAMICS_ORG_URL: optionalUrl,
  DATAVERSE_TENANT_ID: optionalStr,
  DATAVERSE_CLIENT_ID: optionalStr,
  DATAVERSE_CLIENT_SECRET: optionalStr,
  DATAVERSE_ORG_URL: optionalUrl,
  SHAREPOINT_TENANT_ID: optionalStr,
  SHAREPOINT_TENANT_URL: optionalUrl,
  SHAREPOINT_CLIENT_ID: optionalStr,
  SHAREPOINT_CLIENT_SECRET: optionalStr,
  POWER_AUTOMATE_WEBHOOK_SECRET: optionalStr,
  DOCUSIGN_CLIENT_ID: optionalStr,
  DOCUSIGN_USER_ID: optionalStr,
  DOCUSIGN_ACCOUNT_ID: optionalStr,
  DOCUSIGN_BASE_URL: optionalUrl,
  DOCUSIGN_AUTH_URL: optionalUrl,
  DOCUSIGN_PRIVATE_KEY: optionalStr,
  DOCUSIGN_CONNECT_HMAC_KEY: optionalStr,
  SALESFORCE_CLIENT_ID: optionalStr,
  SALESFORCE_CLIENT_SECRET: optionalStr,
  SALESFORCE_INSTANCE_URL: optionalStr,
  SALESFORCE_ACCESS_TOKEN: optionalStr,
  PAGERDUTY_API_KEY: optionalStr,

  // ── Integrations ─────────────────────────────────────────────────────────
  GITHUB_TOKEN: optionalStr,
  HUBSPOT_ACCESS_TOKEN: optionalStr,
  JIRA_BASE_URL: optionalUrl,
  JIRA_API_TOKEN: optionalStr,
  NOTION_API_KEY: optionalStr,
  GOOGLE_CLIENT_ID: optionalStr,
  GOOGLE_CLIENT_SECRET: optionalStr,
  GOOGLE_SERVICE_ACCOUNT_KEY: optionalStr,
  GOOGLE_PROJECT_ID: optionalStr,
  ATLASSIAN_APP_KEY: optionalStr,

  // ── Alloy Workflow ───────────────────────────────────────────────────────
  ALLOY_MAX_BATCH_SIZE: optionalInt("100"),
  ALLOY_WORKFLOW_AUTO_RUN: booleanFromString,
  ALLOY_REQUIRE_APPROVAL_CRITICAL: booleanFromString,
  ALLOY_EMAIL_INGEST_SECRET: optionalStr,

  // ── Feature Flags ────────────────────────────────────────────────────────
  FEATURE_ALLOY_GOVERNANCE: booleanFromString,
  FEATURE_ALLOY_ORCHESTRATION: booleanFromString,
  FEATURE_ALLOY_WEBHOOKS: booleanFromString,
  FEATURE_AUDIT_LOGGING: booleanFromString,

  // ── Session ──────────────────────────────────────────────────────────────
  SESSION_TTL_MS: optionalInt(String(7 * 24 * 60 * 60 * 1000)),

  // ── Security ─────────────────────────────────────────────────────────────
  FIELD_ENCRYPTION_KEY: optionalStr,
  SECRET_ENCRYPTION_KEY: optionalStr,
  IP_HASH_SALT: optionalStr,
  SERVICE_ROLE_KEY: optionalStr,

  // ── Mobile (Expo / APEX) ───────────────────────────────────────────────
  EXPO_PUBLIC_API_URL: optionalUrl,
  EXPO_PUBLIC_API_BASE_URL: optionalUrl,
  EXPO_PUBLIC_ISSUER_URL: optionalUrl,
  EXPO_PUBLIC_DOMAIN: optionalStr,
  EXPO_PUBLIC_REPL_ID: optionalStr,

  // ── Platform / Runtime (injected by Replit) ──────────────────────────────
  REPL_ID: optionalStr,
  REPLIT_DEV_DOMAIN: optionalStr,
  EMBED_API_SERVER: optionalStr,

  // ── Build / CI ───────────────────────────────────────────────────────────
  BUILD_VERSION: z.string().optional().default("0.0.0-dev"),
  BUILD_TIMESTAMP: optionalStr,
  COMMIT_SHA: optionalStr,
  CI: booleanFromString,

  // ── Atlas ────────────────────────────────────────────────────────────────
  ATLAS_SCHEMA_VERSION: optionalStr,

  // ── Supabase ─────────────────────────────────────────────────────────────
  SERVICE_ROLE_KEY_SUPABASE: optionalStr,

  // ── Federation ───────────────────────────────────────────────────────────
  FEDERATION_API_TOKENS: optionalStr,

  // ── Debug / Test Flags ───────────────────────────────────────────────────
  CONSCIOUSNESS_PREFLIGHT_BLOCKING: booleanFromString,
  SYNTHETIC_ALERTS: booleanFromString,
  __FAST_START_SERVER: booleanFromString,
  INNGEST_PORT: optionalInt("8288"),
  GOMAXPROCS: optionalStr,

  // ── Demo Mode ────────────────────────────────────────────────────────────
  DEMO_MODE: booleanFromString,
  ENABLE_DEMO_SEED: booleanFromString,
});

export type Env = z.infer<typeof envSchema>;

/**
 * Cached parsed environment. Populated by parseEnv() on first call.
 */
let _env: Env | null = null;

/**
 * Parse and validate process.env against the Env schema.
 * Throws a descriptive ZodError if validation fails.
 * Returns a cached result on subsequent calls.
 */
export function parseEnv(raw: Record<string, string | undefined> = process.env): Env {
  if (_env) return _env;
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`[env] Environment validation failed:\n${issues}`);
  }
  _env = result.data;
  return _env;
}

/**
 * Reset the cached env. Useful in tests.
 */
export function resetEnvCache(): void {
  _env = null;
}

/**
 * The parsed, validated environment. Throws if validation has not been run yet
 * (i.e. parseEnv() was never called). Call parseEnv() at service startup.
 */
export function getEnv(): Env {
  if (!_env) {
    return parseEnv();
  }
  return _env;
}

export { envSchema as schema };
export default { parseEnv, getEnv, resetEnvCache };
