import { randomBytes } from "node:crypto";
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

  { key: "STRIPE_SECRET_KEY", required: false, description: "Stripe secret key for payment processing", sensitive: true, group: "billing" },

  { key: "GITHUB_TOKEN", required: false, description: "GitHub personal access token or OAuth token for repository integration", sensitive: true, group: "integrations" },
  { key: "OPENAI_API_KEY", required: false, description: "OpenAI API key for AI agent inference", sensitive: true, group: "integrations" },
  { key: "ANTHROPIC_API_KEY", required: false, description: "Anthropic API key for Claude model access", sensitive: true, group: "integrations" },
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
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  resolved: Record<string, string>;
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

  const isProduction = process.env.NODE_ENV === "production";
  const isDemoMode = process.env.DEMO_MODE === "true";

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
      const generated = randomBytes(48).toString("hex");
      process.env.ALLOY_INTERNAL_TOKEN = generated;
      warnings.push("ALLOY_INTERNAL_TOKEN was too short (< 32 characters) — auto-generated a secure 96-char token for this session (set a permanent secret for production)");
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
    logger.info("DEMO_MODE=true — external service calls will be mocked, destructive operations disabled");
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

  return { valid, errors, warnings, resolved, envSummary };
}

export function failFastOnInvalidConfig(): void {
  const result = validateStartupConfig();
  if (!result.valid) {
    logger.fatal({ errors: result.errors }, "Cannot start server — fix configuration errors above");
    process.exit(1);
  }
}
