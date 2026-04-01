import { logger } from "./logger";

interface EnvVarSpec {
  key: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  sensitive?: boolean;
  group?: string;
}

const ENV_SPECS: EnvVarSpec[] = [
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

  { key: "ALLOY_INTERNAL_TOKEN", required: false, description: "Internal admin token for AlloyChat admin context (enables privileged agent access)", sensitive: true, group: "alloy" },

  { key: "STRIPE_SECRET_KEY", required: false, description: "Stripe secret key for payment processing", sensitive: true, group: "billing" },

  { key: "GITHUB_TOKEN", required: false, description: "GitHub personal access token or OAuth token for repository integration", sensitive: true, group: "integrations" },
  { key: "OPENAI_API_KEY", required: false, description: "OpenAI API key for AI agent inference", sensitive: true, group: "integrations" },
  { key: "ANTHROPIC_API_KEY", required: false, description: "Anthropic API key for Claude model access", sensitive: true, group: "integrations" },
  { key: "ELEVENLABS_API_KEY", required: false, description: "ElevenLabs API key for voice asset generation", sensitive: true, group: "integrations" },

  { key: "REPLIT_OBJECT_STORAGE_BUCKET_ID", required: false, description: "Replit object storage bucket ID for file uploads", group: "storage" },
  { key: "REPLIT_DEV_DOMAIN", required: false, description: "Replit development domain for proxy-aware redirects", group: "runtime" },
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

  if (!process.env.ALLOY_INTERNAL_TOKEN) {
    if (isProduction) {
      errors.push("ALLOY_INTERNAL_TOKEN is required in production — autonomous agents will get 401s on all internal API calls");
    } else {
      warnings.push("ALLOY_INTERNAL_TOKEN not set — autonomous agents will receive 401s on internal API calls");
    }
  } else if (process.env.ALLOY_INTERNAL_TOKEN.length < 32) {
    if (isProduction) {
      logger.fatal("ALLOY_INTERNAL_TOKEN is too short (< 32 characters) — refusing to start in production mode");
      process.exit(1);
    } else {
      warnings.push("ALLOY_INTERNAL_TOKEN is too short (< 32 characters) — use a high-entropy token in production");
    }
  }

  if (!process.env.OAUTH_STATE_SECRET) {
    if (isProduction) {
      errors.push("OAUTH_STATE_SECRET is required in production — OAuth CSRF protection will be disabled");
    } else {
      warnings.push("OAUTH_STATE_SECRET not set — OAuth state validation will be skipped");
    }
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
