export type AppEnvironment = "development" | "staging" | "production";

export function getEnvironment(): AppEnvironment {
  const env = process.env.NODE_ENV;
  if (env === "production") return "production";
  if (env === "staging") return "staging";
  return "development";
}

export function isProduction(): boolean {
  return getEnvironment() === "production";
}

export function isStaging(): boolean {
  return getEnvironment() === "staging";
}

export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

export const ENV_CONFIG = {
  environment: getEnvironment(),
  isProduction: isProduction(),
  isDevelopment: isDevelopment(),
  isStaging: isStaging(),

  alloy: {
    enableDemoSeeder: !isProduction(),
    enableWebhookSignatureVerification: isProduction(),
    maxBatchSize: parseInt(process.env.ALLOY_MAX_BATCH_SIZE ?? "100", 10),
    workflowAutoRun: process.env.ALLOY_WORKFLOW_AUTO_RUN !== "false",
    requireApprovalForCritical: process.env.ALLOY_REQUIRE_APPROVAL_CRITICAL !== "false",
  },

  auth: {
    sessionTtlMs: parseInt(process.env.SESSION_TTL_MS ?? String(7 * 24 * 60 * 60 * 1000), 10),
    adminRoles: ["super_admin"] as string[],
    operatorRoles: ["super_admin", "ops", "operator"] as string[],
  },

  features: {
    alloyOrchestration: process.env.FEATURE_ALLOY_ORCHESTRATION !== "false",
    alloyGovernance: process.env.FEATURE_ALLOY_GOVERNANCE !== "false",
    alloyWebhooks: process.env.FEATURE_ALLOY_WEBHOOKS !== "false",
    auditLogging: process.env.FEATURE_AUDIT_LOGGING !== "false",
  },
} as const;
