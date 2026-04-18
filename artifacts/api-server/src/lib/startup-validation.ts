import { randomBytes } from "node:crypto";
import { resolveRuntimeMode, isProductionMode, isDemoMode as resolveIsDemoMode } from "@szl-holdings/config";
import { logger } from "./logger";

interface EnvVarSpec {
  key: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  sensitive?: boolean;
  group?: string;
}

export const ENV_SPECS: EnvVarSpec[] = [
  { key: "PORT", required: false, description: "Server listen port", defaultValue: "3000", group: "server" },
  { key: "NODE_ENV", required: false, description: "Runtime environment (development | production | test)", defaultValue: "development", group: "server" },
  { key: "APP_ENV", required: false, description: "Application environment label (staging | production | demo)", group: "server" },
  { key: "RUNTIME_MODE", required: false, description: "Explicit runtime mode override: local-dev | internal-preview | demo | production (resolved from APP_ENV/NODE_ENV/DEMO_MODE if not set)", group: "server" },
  { key: "LOG_LEVEL", required: false, description: "Pino log level (trace | debug | info | warn | error | fatal)", defaultValue: "info", group: "server" },
  { key: "PUBLIC_APP_URL", required: false, description: "Public-facing application URL (used for OIDC redirects and email links)", group: "server" },
  { key: "CORS_ORIGINS", required: false, description: "Comma-separated list of allowed CORS origins", group: "server" },

  { key: "DATABASE_URL", required: false, description: "PostgreSQL connection string for the primary database", sensitive: true, group: "database" },

  { key: "DEMO_MODE", required: false, description: "Set to 'true' to enable demo mode (mocks external services, disables destructive ops)", defaultValue: "false", group: "platform" },

  { key: "AUTH_PROVIDER_URL", required: false, description: "OIDC provider discovery URL (defaults to Replit OIDC)", group: "auth" },
  { key: "AUTH_PROVIDER_KEY", required: false, description: "OIDC client secret or API key for the auth provider", sensitive: true, group: "auth" },
  { key: "SERVICE_ROLE_KEY", required: false, description: "Internal service role key for machine-to-machine calls (admin bypass)", sensitive: true, group: "auth" },
  { key: "SESSION_SECRET", required: false, description: "Session encryption secret (must be set in production)", sensitive: true, group: "auth" },
  { key: "REPL_ID", required: false, description: "Replit deployment REPL_ID used for OIDC client ID", group: "auth" },
  { key: "ISSUER_URL", required: false, description: "OIDC issuer URL (defaults to https://replit.com/oidc)", group: "auth" },

  { key: "ALLOY_INTERNAL_TOKEN", required: false, description: "Internal admin token for AlloyChat admin context (enables privileged agent access) — must be 32+ chars", sensitive: true, group: "alloy" },
  { key: "CONNECTOR_ENCRYPTION_KEY", required: false, description: "AES-256-GCM encryption key (64 hex chars) for RMM provider credential storage — required in production", sensitive: true, group: "alloy" },

  { key: "STRIPE_SECRET_KEY", required: false, description: "Stripe secret key for payment processing", sensitive: true, group: "billing" },

  { key: "GITHUB_TOKEN", required: false, description: "GitHub personal access token or OAuth token for repository integration", sensitive: true, group: "integrations" },
  { key: "AI_INTEGRATIONS_OPENAI_API_KEY", required: false, description: "Replit AI Integrations proxy key for OpenAI-compatible inference", sensitive: true, group: "integrations" },
  { key: "AI_INTEGRATIONS_ANTHROPIC_API_KEY", required: false, description: "Replit AI Integrations proxy key for Anthropic-compatible inference", sensitive: true, group: "integrations" },
  { key: "ELEVENLABS_API_KEY", required: false, description: "ElevenLabs API key for voice asset generation", sensitive: true, group: "integrations" },

  { key: "DEFAULT_OBJECT_STORAGE_BUCKET_ID", required: false, description: "Replit GCS object storage bucket ID (set by App Storage provisioning)", group: "storage" },
  { key: "PUBLIC_OBJECT_SEARCH_PATHS", required: false, description: "Comma-separated GCS paths for public asset serving (set by App Storage provisioning)", group: "storage" },
  { key: "PRIVATE_OBJECT_DIR", required: false, description: "GCS path prefix for private object uploads (set by App Storage provisioning)", group: "storage" },
  { key: "REPLIT_DEV_DOMAIN", required: false, description: "Replit development domain for proxy-aware redirects", group: "runtime" },

  { key: "ATLAS_SCHEMA_VERSION", required: false, description: "ATLAS enterprise state model schema version — used for compatibility checks across domain packs", defaultValue: "1.0.0", group: "atlas" },
  { key: "ATLAS_DOMAIN_PACK_ENFORCE", required: false, description: "Set to 'true' to enforce strict ATLAS conformance validation on entity writes", defaultValue: "false", group: "atlas" },
  { key: "ATLAS_EVENT_BUS_ENABLED", required: false, description: "Set to 'true' to enable cross-domain ATLAS event bus routing", defaultValue: "false", group: "atlas" },
  { key: "ATLAS_CROSS_DOMAIN_TELEMETRY", required: false, description: "Set to 'true' to capture cross-domain entity relationship telemetry", defaultValue: "false", group: "atlas" },

  { key: "ENABLE_DEMO_SEED", required: false, description: "Set to 'true' to enable demo data seeding on startup (sets runtime mode to 'demo')", defaultValue: "false", group: "platform" },
  { key: "FEATURE_ALLOY_ORCHESTRATION", required: false, description: "Set to 'true' to enable the Alloy orchestration subsystem", defaultValue: "true", group: "features" },
  { key: "FEATURE_ALLOY_GOVERNANCE", required: false, description: "Set to 'true' to enable the Alloy governance and approval subsystem", defaultValue: "true", group: "features" },
  { key: "FEATURE_ALLOY_WEBHOOKS", required: false, description: "Set to 'true' to enable Alloy outbound webhook delivery", defaultValue: "true", group: "features" },
  { key: "FEATURE_AUDIT_LOGGING", required: false, description: "Set to 'true' to enable platform-wide immutable audit logging", defaultValue: "true", group: "features" },
  { key: "ALLOY_REQUIRE_APPROVAL_CRITICAL", required: false, description: "Set to 'true' to require human approval for critical operations (cannot be false in production)", defaultValue: "true", group: "alloy" },
  { key: "ALLOY_WORKFLOW_AUTO_RUN", required: false, description: "Set to 'true' to auto-run scheduled workflows on server startup", defaultValue: "true", group: "alloy" },
  { key: "ALLOY_MAX_BATCH_SIZE", required: false, description: "Maximum number of items processed in a single workflow batch", defaultValue: "100", group: "alloy" },

  { key: "SENTRY_DSN", required: false, description: "Sentry DSN for error tracking — activates lib/sentry.ts when set. Required in production (KG028).", sensitive: true, group: "observability" },
  { key: "SENTRY_TRACES_SAMPLE_RATE", required: false, description: "Sentry trace sample rate (0–1). Default: 0.1", defaultValue: "0.1", group: "observability" },
  { key: "SENTRY_PROFILES_SAMPLE_RATE", required: false, description: "Sentry profile sample rate (0–1). Default: 0.1", defaultValue: "0.1", group: "observability" },
  { key: "OTEL_EXPORTER_OTLP_ENDPOINT", required: false, description: "OTLP exporter URL for distributed tracing (Grafana Tempo, Jaeger, Honeycomb, Datadog). Required in production (KG009).", group: "observability" },
  { key: "OTLP_ENDPOINT", required: false, description: "Alias for OTEL_EXPORTER_OTLP_ENDPOINT", group: "observability" },
  { key: "OTEL_SERVICE_NAME", required: false, description: "OpenTelemetry service name tag. Default: szl-api", defaultValue: "szl-api", group: "observability" },
  { key: "OTEL_CONSOLE_EXPORT", required: false, description: "Set to 'true' to log OTel spans to stdout (development/debug only)", defaultValue: "false", group: "observability" },
  { key: "AZURE_APP_INSIGHTS_CONNECTION_STRING", required: false, description: "Azure Application Insights connection string — enables Azure Monitor OTLP export. Preferred exporter for Azure production deploys.", sensitive: true, group: "observability" },
  { key: "NEW_RELIC_LICENSE_KEY", required: false, description: "New Relic license key — enables New Relic OTLP ingest", sensitive: true, group: "observability" },
  { key: "UPTIME_MONITOR_ID", required: false, description: "External uptime monitor ID (Betterstack/UptimeRobot) — informational; used in health status reporting", group: "observability" },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  resolved: Record<string, string>;
  runtimeMode: import("@szl-holdings/config").RuntimeMode;
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
      resolved[spec.key] = spec.sensitive ? "***" : value;
    }
  }

  const explicitMode = process.env["RUNTIME_MODE"];
  if (explicitMode && !["local-dev", "internal-preview", "demo", "production"].includes(explicitMode)) {
    errors.push(
      `RUNTIME_MODE is set to an unrecognized value: "${explicitMode}". ` +
        `Valid values: local-dev, internal-preview, demo, production. ` +
        `Unset or correct RUNTIME_MODE before starting the server.`,
    );
  }

  let isProduction = false;
  let isDemoMode = false;
  let runtimeMode: import("@szl-holdings/config").RuntimeMode = "local-dev";
  try {
    isProduction = isProductionMode();
    isDemoMode = resolveIsDemoMode();
    runtimeMode = resolveRuntimeMode();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Runtime mode resolution failed: ${msg}`);
    isProduction = process.env["NODE_ENV"] === "production";
  }

  if (isProduction && !process.env.DATABASE_URL) {
    warnings.push("DATABASE_URL not set in production — database features will be unavailable");
  }

  if (isProduction && !process.env.SESSION_SECRET) {
    warnings.push("SESSION_SECRET not set in production — sessions will use insecure default");
  }

  if (isProduction && !process.env.CORS_ORIGINS) {
    warnings.push("CORS_ORIGINS not set in production — cross-origin requests may be blocked");
  }

  if (isProduction && !process.env.PUBLIC_APP_URL) {
    warnings.push("PUBLIC_APP_URL not set in production — OIDC redirects and email links may be broken");
  }

  if (isProduction && !process.env.SERVICE_ROLE_KEY) {
    warnings.push("SERVICE_ROLE_KEY not set — machine-to-machine calls requiring admin bypass will fail");
  }

  if (isProduction && !process.env.SENTRY_DSN) {
    warnings.push("SENTRY_DSN not set — error tracking is disabled in production (KG028). Set SENTRY_DSN in Key Vault before first production traffic.");
  }

  if (
    isProduction &&
    !process.env.OTEL_EXPORTER_OTLP_ENDPOINT &&
    !process.env.OTLP_ENDPOINT &&
    !process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING
  ) {
    warnings.push(
      "No OTEL exporter configured in production (KG009). Set OTEL_EXPORTER_OTLP_ENDPOINT or AZURE_APP_INSIGHTS_CONNECTION_STRING in Key Vault before first production traffic."
    );
  }

  const alloyToken = process.env.ALLOY_INTERNAL_TOKEN;
  if (!alloyToken) {
    if (isProduction) {
      errors.push("ALLOY_INTERNAL_TOKEN is not set — this is required in production. Set a secure 32+ character secret.");
    } else {
      const generated = randomBytes(48).toString("hex");
      process.env.ALLOY_INTERNAL_TOKEN = generated;
      warnings.push("ALLOY_INTERNAL_TOKEN not set — auto-generated a secure 96-char token for this session (set a permanent secret for production)");
    }
  } else if (alloyToken.length < 32) {
    if (isProduction) {
      errors.push(`ALLOY_INTERNAL_TOKEN is too short (${alloyToken.length} chars, minimum 32) — replace with a secure 32+ character secret.`);
    } else {
      warnings.push(`ALLOY_INTERNAL_TOKEN is short (${alloyToken.length} chars) — use a 32+ character secret in production`);
    }
  }

  const connectorKey = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!connectorKey) {
    if (isProduction) {
      errors.push("CONNECTOR_ENCRYPTION_KEY is not set — this is required in production for RMM credential encryption. Generate a 64-char hex key and add it to secrets.");
    } else {
      warnings.push("CONNECTOR_ENCRYPTION_KEY not set — RMM provider credentials will use a derived development key (not safe for production)");
    }
  } else if (!/^[0-9a-fA-F]{64}$/.test(connectorKey)) {
    if (isProduction) {
      errors.push("CONNECTOR_ENCRYPTION_KEY must be exactly 64 hex characters (256 bits) — replace with a properly generated key.");
    } else {
      warnings.push("CONNECTOR_ENCRYPTION_KEY format is invalid (expected 64 hex chars) — verify before deploying to production");
    }
  }

  if (!process.env.OAUTH_STATE_SECRET) {
    const generated = randomBytes(32).toString("hex");
    process.env.OAUTH_STATE_SECRET = generated;
    warnings.push("OAUTH_STATE_SECRET not set — auto-generated a secure 64-char secret for this session");
  }

  if (isProduction && process.env.ALLOY_REQUIRE_APPROVAL_CRITICAL === "false") {
    errors.push("ALLOY_REQUIRE_APPROVAL_CRITICAL cannot be set to 'false' in production — human approval is required for consequential actions. This is an architectural invariant.");
  }

  if (isDemoMode) {
    logger.info({ runtimeMode }, "Runtime mode: demo — external service calls will be mocked, destructive operations disabled");
  } else {
    logger.info({ runtimeMode }, "Runtime mode resolved");
  }

  const groupMap = new Map<string, typeof ENV_SPECS>();
  for (const spec of ENV_SPECS) {
    const g = spec.group ?? "other";
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(spec);
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
    logger.error({ errors }, "Startup config validation FAILED");
  }

  for (const w of warnings) {
    logger.warn(w);
  }

  if (valid) {
    logger.info({ resolved }, "Startup config validation passed");
  }

  return { valid, errors, warnings, resolved, envSummary, runtimeMode };
}

export function failFastOnInvalidConfig(): void {
  const result = validateStartupConfig();
  if (!result.valid) {
    logger.fatal({ errors: result.errors }, "Cannot start server — fix configuration errors above");
    process.exit(1);
  }
}
