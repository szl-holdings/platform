/**
 * Canary Deployment Manager
 *
 * Manages percentage-based canary traffic splitting for fine-tuned models.
 * Tracks per-request outcomes, auto-promotes on improvement, or auto-rolls
 * back on regression. Records all lifecycle transitions in the audit log.
 */

import { db, auditLogsTable, fineTunedModelRegistry } from '@szl-holdings/db';
import { and, desc, eq, lt } from 'drizzle-orm';

const logger = {
  warn: (_obj: Record<string, unknown>, _msg: string) => {},
};

export interface CanaryStatus {
  modelId: string;
  agentId: string;
  lifecycle: string;
  canaryTrafficPct: number;
  canaryRequestsTotal: number;
  canaryRequestsSuccess: number;
  canarySuccessRate: number;
  canaryStartedAt: string | null;
  hoursInCanary: number;
  promotionEligible: boolean;
  rollbackRisk: boolean;
}

export interface CanaryRouteDecision {
  useCanary: boolean;
  modelId: string;
  isCanary: boolean;
}

const DEFAULT_CANARY_PCT = 10;
const PROMOTE_THRESHOLD_REQUESTS = 100;
const PROMOTE_MIN_SUCCESS_RATE = 0.85;
const ROLLBACK_MAX_FAILURE_RATE = 0.30;
const MAX_CANARY_HOURS = 48;

async function writeAuditEntry(
  actionType: string,
  entityId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      actionType,
      entityType: 'fine_tuned_model',
      entityId,
      payloadJson: payload,
    });
  } catch {
    // Audit write failure should not block pipeline
  }
}

export async function routeCanaryRequest(
  _agentId: string,
  activeModelId: string,
  canaryModelId: string,
  canaryTrafficPct: number,
): Promise<CanaryRouteDecision> {
  const useCanary = Math.random() * 100 < canaryTrafficPct;
  return {
    useCanary,
    modelId: useCanary ? canaryModelId : activeModelId,
    isCanary: useCanary,
  };
}

export async function recordCanaryOutcome(
  modelId: string,
  success: boolean,
): Promise<void> {
  try {
    const [model] = await db
      .select()
      .from(fineTunedModelRegistry)
      .where(eq(fineTunedModelRegistry.modelId, modelId))
      .limit(1);

    if (!model || model.lifecycle !== 'canary') return;

    // Total requests are counted once by recordCanaryRequest (called during routing).
    // Here we only track success/failure outcomes to avoid double-counting totals.
    const currentTotal = model.canaryRequestsTotal ?? 0;
    const newSuccess = (model.canaryRequestsSuccess ?? 0) + (success ? 1 : 0);

    await db
      .update(fineTunedModelRegistry)
      .set({ canaryRequestsSuccess: newSuccess })
      .where(eq(fineTunedModelRegistry.modelId, modelId));

    await evaluateCanaryPromotion(model.agentId, modelId, currentTotal, newSuccess, model.canaryStartedAt, model.canaryPromoteThreshold ?? PROMOTE_THRESHOLD_REQUESTS);
  } catch (err) {
    logger.warn({ err }, 'recordCanaryOutcome failed — outcome not persisted');
  }
}

/**
 * Get the current production baseline success rate for an agent.
 *
 * Uses the evalPassRate stored on the active fine-tuned model as the production baseline.
 * Falls back to the PROMOTE_MIN_SUCCESS_RATE constant when no active model exists yet.
 */
async function getProductionSuccessRate(agentId: string): Promise<number> {
  try {
    const [activeModel] = await db
      .select()
      .from(fineTunedModelRegistry)
      .where(
        and(
          eq(fineTunedModelRegistry.agentId, agentId),
          eq(fineTunedModelRegistry.lifecycle, 'active'),
          eq(fineTunedModelRegistry.isActive, true),
        ),
      )
      .orderBy(desc(fineTunedModelRegistry.promotedAt))
      .limit(1);

    if (activeModel?.evalPassRate != null) return activeModel.evalPassRate;
  } catch {
    // Fall through to default
  }
  return PROMOTE_MIN_SUCCESS_RATE;
}

async function evaluateCanaryPromotion(
  agentId: string,
  modelId: string,
  totalRequests: number,
  successRequests: number,
  canaryStartedAt: Date | null,
  threshold: number,
): Promise<void> {
  const canarySuccessRate = totalRequests > 0 ? successRequests / totalRequests : 0;
  const canaryFailureRate = 1 - canarySuccessRate;

  // Fetch production baseline for comparative evaluation
  const productionSuccessRate = await getProductionSuccessRate(agentId);

  const hoursElapsed = canaryStartedAt
    ? (Date.now() - canaryStartedAt.getTime()) / (1000 * 60 * 60)
    : 0;

  // Hard failure gate: rollback if canary significantly under-performs production
  if (totalRequests >= 10 && canaryFailureRate > ROLLBACK_MAX_FAILURE_RATE) {
    await performCanaryRollback(
      modelId,
      `Canary failure rate ${(canaryFailureRate * 100).toFixed(1)}% exceeds threshold ` +
        `(production baseline: ${(productionSuccessRate * 100).toFixed(1)}%)`,
    );
    return;
  }

  // Time-based forced decision for low-traffic canaries:
  // After MAX_CANARY_HOURS, promote if canary >= production baseline, otherwise rollback.
  if (hoursElapsed >= MAX_CANARY_HOURS) {
    if (totalRequests === 0 || canarySuccessRate >= productionSuccessRate) {
      await performCanaryPromotion(modelId, canarySuccessRate, totalRequests, productionSuccessRate);
    } else {
      await performCanaryRollback(
        modelId,
        `Canary timed out after ${MAX_CANARY_HOURS}h: ` +
          `${(canarySuccessRate * 100).toFixed(1)}% success rate below ` +
          `production baseline ${(productionSuccessRate * 100).toFixed(1)}%`,
      );
    }
    return;
  }

  // Threshold-based promotion: canary must meet request count AND outperform production baseline
  if (totalRequests >= threshold && canarySuccessRate >= Math.max(PROMOTE_MIN_SUCCESS_RATE, productionSuccessRate)) {
    await performCanaryPromotion(modelId, canarySuccessRate, totalRequests, productionSuccessRate);
  }
}

export async function performCanaryPromotion(
  modelId: string,
  canarySuccessRate: number,
  totalRequests: number,
  productionSuccessRate?: number,
): Promise<void> {
  await db
    .update(fineTunedModelRegistry)
    .set({
      lifecycle: 'active',
      promotedAt: new Date(),
    })
    .where(eq(fineTunedModelRegistry.modelId, modelId));

  await writeAuditEntry('fine_tuning.canary.promoted', modelId, {
    modelId,
    canarySuccessRate,
    totalRequests,
    productionSuccessRate: productionSuccessRate ?? null,
    successDelta:
      productionSuccessRate != null
        ? parseFloat((canarySuccessRate - productionSuccessRate).toFixed(4))
        : null,
    reason: 'Canary success rate meets/exceeds production baseline and request threshold',
  });
}

export async function performCanaryRollback(modelId: string, reason: string): Promise<void> {
  await db
    .update(fineTunedModelRegistry)
    .set({
      lifecycle: 'deprecated',
      isActive: false,
      deprecatedAt: new Date(),
    })
    .where(eq(fineTunedModelRegistry.modelId, modelId));

  await writeAuditEntry('fine_tuning.canary.rolled_back', modelId, {
    modelId,
    reason,
  });
}

export async function activateCanary(
  modelId: string,
  trafficPct?: number,
  promoteThreshold?: number,
): Promise<void> {
  const pct = Math.min(100, Math.max(1, trafficPct ?? DEFAULT_CANARY_PCT));
  await db
    .update(fineTunedModelRegistry)
    .set({
      lifecycle: 'canary',
      canaryTrafficPct: pct,
      canaryRequestsTotal: 0,
      canaryRequestsSuccess: 0,
      canaryStartedAt: new Date(),
      canaryPromoteThreshold: promoteThreshold ?? PROMOTE_THRESHOLD_REQUESTS,
    })
    .where(eq(fineTunedModelRegistry.modelId, modelId));

  await writeAuditEntry('fine_tuning.canary.activated', modelId, {
    modelId,
    trafficPct: pct,
    promoteThreshold: promoteThreshold ?? PROMOTE_THRESHOLD_REQUESTS,
  });
}

export async function getCanaryStatus(agentId: string): Promise<CanaryStatus | null> {
  try {
    const models = await db
      .select()
      .from(fineTunedModelRegistry)
      .where(
        and(
          eq(fineTunedModelRegistry.agentId, agentId),
          eq(fineTunedModelRegistry.lifecycle, 'canary'),
          eq(fineTunedModelRegistry.isActive, true),
        ),
      )
      .limit(1);

    const model = models[0];
    if (!model) return null;

    const total = model.canaryRequestsTotal ?? 0;
    const success = model.canaryRequestsSuccess ?? 0;
    const successRate = total > 0 ? success / total : 0;
    const threshold = model.canaryPromoteThreshold ?? PROMOTE_THRESHOLD_REQUESTS;

    const hoursInCanary = model.canaryStartedAt
      ? (Date.now() - model.canaryStartedAt.getTime()) / (1000 * 60 * 60)
      : 0;

    return {
      modelId: model.modelId,
      agentId: model.agentId,
      lifecycle: model.lifecycle,
      canaryTrafficPct: model.canaryTrafficPct ?? DEFAULT_CANARY_PCT,
      canaryRequestsTotal: total,
      canaryRequestsSuccess: success,
      canarySuccessRate: successRate,
      canaryStartedAt: model.canaryStartedAt?.toISOString() ?? null,
      hoursInCanary: Math.round(hoursInCanary * 10) / 10,
      promotionEligible: total >= threshold && successRate >= PROMOTE_MIN_SUCCESS_RATE,
      rollbackRisk: total >= 10 && 1 - successRate > ROLLBACK_MAX_FAILURE_RATE,
    };
  } catch {
    return null;
  }
}

export async function getAllCanaryStatuses(): Promise<CanaryStatus[]> {
  try {
    const models = await db
      .select()
      .from(fineTunedModelRegistry)
      .where(
        and(
          eq(fineTunedModelRegistry.lifecycle, 'canary'),
          eq(fineTunedModelRegistry.isActive, true),
        ),
      );

    return models.map((model) => {
      const total = model.canaryRequestsTotal ?? 0;
      const success = model.canaryRequestsSuccess ?? 0;
      const successRate = total > 0 ? success / total : 0;
      const threshold = model.canaryPromoteThreshold ?? PROMOTE_THRESHOLD_REQUESTS;
      const hoursInCanary = model.canaryStartedAt
        ? (Date.now() - model.canaryStartedAt.getTime()) / (1000 * 60 * 60)
        : 0;

      return {
        modelId: model.modelId,
        agentId: model.agentId,
        lifecycle: model.lifecycle,
        canaryTrafficPct: model.canaryTrafficPct ?? DEFAULT_CANARY_PCT,
        canaryRequestsTotal: total,
        canaryRequestsSuccess: success,
        canarySuccessRate: successRate,
        canaryStartedAt: model.canaryStartedAt?.toISOString() ?? null,
        hoursInCanary: Math.round(hoursInCanary * 10) / 10,
        promotionEligible: total >= threshold && successRate >= PROMOTE_MIN_SUCCESS_RATE,
        rollbackRisk: total >= 10 && 1 - successRate > ROLLBACK_MAX_FAILURE_RATE,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Evaluate all canaries that have been running longer than MAX_CANARY_HOURS
 * without receiving enough traffic to auto-promote via outcome recording.
 *
 * Called periodically (e.g. from the training trigger scheduler) so that idle
 * canaries resolve to promote/rollback independently of manual outcome calls.
 */
export async function runIdleCanaryChecks(): Promise<void> {
  try {
    const deadline = new Date(Date.now() - MAX_CANARY_HOURS * 60 * 60 * 1000);
    const idleCanaries = await db
      .select()
      .from(fineTunedModelRegistry)
      .where(
        and(
          eq(fineTunedModelRegistry.lifecycle, 'canary'),
          eq(fineTunedModelRegistry.isActive, true),
          lt(fineTunedModelRegistry.canaryStartedAt, deadline),
        ),
      );

    for (const model of idleCanaries) {
      if (!model.canaryStartedAt) continue;
      const total = model.canaryRequestsTotal ?? 0;
      const success = model.canaryRequestsSuccess ?? 0;
      const threshold = model.canaryPromoteThreshold ?? PROMOTE_THRESHOLD_REQUESTS;
      await evaluateCanaryPromotion(
        model.agentId,
        model.modelId,
        total,
        success,
        model.canaryStartedAt,
        threshold,
      );
    }
  } catch {
    // Non-critical — idle check failures should not block other pipeline work
  }
}
