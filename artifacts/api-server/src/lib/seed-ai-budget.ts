/**
 * Seed default AI budget policies for the default org.
 *
 * This runs once on server startup and is idempotent — calling it more than
 * once simply overwrites the policy with the same values (which is harmless).
 *
 * Policy values are intentionally generous so they don't block real usage
 * in development, but they do ensure the hard-stop mechanism is exercised.
 * Override via environment variables if tighter limits are needed.
 */

import { costController } from "@szl-holdings/ai-control-plane";
import { logger } from "./logger";

const DEFAULT_ORG_ID = "default";

const HOURLY_LIMIT_USD = parseFloat(process.env["AI_BUDGET_HOURLY_USD"] ?? "5.0");
const DAILY_LIMIT_USD = parseFloat(process.env["AI_BUDGET_DAILY_USD"] ?? "50.0");
const MONTHLY_LIMIT_USD = parseFloat(process.env["AI_BUDGET_MONTHLY_USD"] ?? "500.0");
const ALERT_THRESHOLD_PCT = parseFloat(process.env["AI_BUDGET_ALERT_PCT"] ?? "80");

export function seedAiBudgetPolicies(): void {
  try {
    costController.addPolicy({
      orgId: DEFAULT_ORG_ID,
      periodType: "hourly",
      limitUsd: HOURLY_LIMIT_USD,
      alertThresholdPct: ALERT_THRESHOLD_PCT,
      hardStop: false,
    });

    costController.addPolicy({
      orgId: DEFAULT_ORG_ID,
      periodType: "daily",
      limitUsd: DAILY_LIMIT_USD,
      alertThresholdPct: ALERT_THRESHOLD_PCT,
      hardStop: false,
    });

    costController.addPolicy({
      orgId: DEFAULT_ORG_ID,
      periodType: "monthly",
      limitUsd: MONTHLY_LIMIT_USD,
      alertThresholdPct: ALERT_THRESHOLD_PCT,
      hardStop: true,
    });

    logger.info(
      {
        orgId: DEFAULT_ORG_ID,
        hourly: HOURLY_LIMIT_USD,
        daily: DAILY_LIMIT_USD,
        monthly: MONTHLY_LIMIT_USD,
        alertThresholdPct: ALERT_THRESHOLD_PCT,
      },
      "[seed-ai-budget] Default AI budget policies registered",
    );
  } catch (err) {
    logger.warn({ err }, "[seed-ai-budget] Failed to register AI budget policies (non-fatal)");
  }
}
