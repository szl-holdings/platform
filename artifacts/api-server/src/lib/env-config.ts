/**
 * @szl-holdings/env is the single Zod-validated env loader.
 * parseEnv() runs at module load time and throws clearly if any var is invalid.
 * All reads below use _env instead of process.env directly.
 */
import { getEnv } from '@szl-holdings/env';

const _env = getEnv();

export type AppEnvironment = 'development' | 'staging' | 'production';

export function getEnvironment(): AppEnvironment {
  const nodeEnv = _env.NODE_ENV;
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'staging') return 'staging';
  return 'development';
}

export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

export function isStaging(): boolean {
  return getEnvironment() === 'staging';
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

export const ENV_CONFIG = {
  environment: getEnvironment(),
  isProduction: isProduction(),
  isDevelopment: isDevelopment(),
  isStaging: isStaging(),

  alloy: {
    enableDemoSeeder: false,
    enableWebhookSignatureVerification: isProduction(),
    maxBatchSize: _env.ALLOY_MAX_BATCH_SIZE,
    workflowAutoRun: _env.ALLOY_WORKFLOW_AUTO_RUN ?? false,
    requireApprovalForCritical: _env.ALLOY_REQUIRE_APPROVAL_CRITICAL ?? true,
  },

  auth: {
    sessionTtlMs: _env.SESSION_TTL_MS,
    adminRoles: ['super_admin'] as string[],
    operatorRoles: ['super_admin', 'ops', 'operator'] as string[],
  },

  features: {
    alloyOrchestration: _env.FEATURE_ALLOY_ORCHESTRATION ?? true,
    alloyGovernance: _env.FEATURE_ALLOY_GOVERNANCE ?? true,
    alloyWebhooks: _env.FEATURE_ALLOY_WEBHOOKS ?? true,
    auditLogging: _env.FEATURE_AUDIT_LOGGING ?? true,
  },
} as const;

/**
 * Direct access to the validated env for cases where ENV_CONFIG doesn't expose
 * the value you need. Prefer ENV_CONFIG where possible.
 */
export function getValidatedEnv() {
  return _env;
}
