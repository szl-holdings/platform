import { logger } from "./logger";

interface EnvVarSpec {
  key: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

const ENV_SPECS: EnvVarSpec[] = [
  { key: "PORT", required: false, description: "Server listen port", defaultValue: "3000" },
  { key: "NODE_ENV", required: false, description: "Runtime environment", defaultValue: "development" },
  { key: "DATABASE_URL", required: false, description: "PostgreSQL connection string" },
  { key: "SESSION_SECRET", required: false, description: "Session encryption secret" },
  { key: "CORS_ORIGINS", required: false, description: "Comma-separated allowed CORS origins" },
  { key: "LOG_LEVEL", required: false, description: "Pino log level", defaultValue: "info" },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  resolved: Record<string, string>;
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
      const isSensitive = /SECRET|PASSWORD|KEY|TOKEN|URL|CONNECTION/i.test(spec.key);
      resolved[spec.key] = isSensitive ? "***" : value;
    }
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !process.env.DATABASE_URL) {
    warnings.push("DATABASE_URL not set in production — database features will be unavailable");
  }

  if (isProduction && !process.env.SESSION_SECRET) {
    warnings.push("SESSION_SECRET not set in production — sessions will use insecure default");
  }

  if (isProduction && !process.env.CORS_ORIGINS) {
    warnings.push("CORS_ORIGINS not set in production — cross-origin requests may be blocked");
  }

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

  return { valid, errors, warnings, resolved };
}

export function failFastOnInvalidConfig(): void {
  const result = validateStartupConfig();
  if (!result.valid) {
    logger.fatal({ errors: result.errors }, "Cannot start server — fix configuration errors above");
    process.exit(1);
  }
}
