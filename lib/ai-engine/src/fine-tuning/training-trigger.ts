/**
 * Autonomous Training Trigger System
 *
 * Periodically evaluates conditions that warrant automatic fine-tuning:
 * (a) New corrections/feedback count since last fine-tuning exceeds threshold
 * (b) Latest eval scores dropped below historical baseline
 * (c) Confidence calibration bias exceeds tolerance
 *
 * Includes per-agent enable/disable flag and a global kill switch.
 * All trigger decisions (fired or suppressed) are recorded in audit logs.
 */

import {
  agentFeedback,
  alloyAgentCorrections,
  auditLogsTable,
  db,
  fineTuningTriggerConfigs,
  fineTuningJobs,
} from '@szl-holdings/db';
import { and, desc, eq, gte } from 'drizzle-orm';
import { getAllSupportedAgents } from './domain-curators.js';
import { computeAgentCalibrations } from '../learning/eval-pipeline.js';
import { runIdleCanaryChecks } from './canary-manager.js';

const GLOBAL_KILL_SWITCH_ENV = 'AUTONOMOUS_TRAINING_ENABLED';

// Runtime override: when explicitly set via API, it takes precedence over the env var.
// null = no override (defer to env var), true/false = admin forced state.
let _runtimeOverride: boolean | null = null;

export function isAutonomousTrainingGloballyEnabled(): boolean {
  // Runtime API toggle takes full precedence — admin can disable even when env var is set.
  if (_runtimeOverride !== null) return _runtimeOverride;
  const envVal = process.env[GLOBAL_KILL_SWITCH_ENV];
  return envVal === 'true' || envVal === '1';
}

export function setGlobalTrainingKillSwitch(enabled: boolean): void {
  _runtimeOverride = enabled;
}

async function writeAuditEntry(
  actionType: string,
  agentId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      actionType,
      entityType: 'fine_tuning_trigger',
      entityId: agentId,
      payloadJson: payload,
    });
  } catch {
    // Non-critical
  }
}

export async function getTriggerConfig(agentId: string): Promise<{
  agentId: string;
  enabled: boolean;
  correctionThreshold: number;
  evalScoreDropThreshold: number;
  calibrationBiasThreshold: number;
  cooldownHours: number;
  lastTriggeredAt: string | null;
  lastCheckedAt: string | null;
  lastDecision: string | null;
}> {
  try {
    const [existing] = await db
      .select()
      .from(fineTuningTriggerConfigs)
      .where(eq(fineTuningTriggerConfigs.agentId, agentId))
      .limit(1);

    if (existing) {
      return {
        agentId: existing.agentId,
        enabled: existing.enabled,
        correctionThreshold: existing.correctionThreshold,
        evalScoreDropThreshold: existing.evalScoreDropThreshold,
        calibrationBiasThreshold: existing.calibrationBiasThreshold,
        cooldownHours: existing.cooldownHours,
        lastTriggeredAt: existing.lastTriggeredAt?.toISOString() ?? null,
        lastCheckedAt: existing.lastCheckedAt?.toISOString() ?? null,
        lastDecision: existing.lastDecision,
      };
    }
  } catch {
    // Table may not exist yet during migrations
  }

  return {
    agentId,
    enabled: true,
    correctionThreshold: 50,
    evalScoreDropThreshold: 0.05,
    calibrationBiasThreshold: 0.15,
    cooldownHours: 24,
    lastTriggeredAt: null,
    lastCheckedAt: null,
    lastDecision: null,
  };
}

export async function upsertTriggerConfig(
  agentId: string,
  updates: {
    enabled?: boolean;
    correctionThreshold?: number;
    evalScoreDropThreshold?: number;
    calibrationBiasThreshold?: number;
    cooldownHours?: number;
  },
): Promise<void> {
  const existing = await getTriggerConfig(agentId);

  await db
    .insert(fineTuningTriggerConfigs)
    .values({
      agentId,
      enabled: updates.enabled ?? existing.enabled,
      correctionThreshold: updates.correctionThreshold ?? existing.correctionThreshold,
      evalScoreDropThreshold: updates.evalScoreDropThreshold ?? existing.evalScoreDropThreshold,
      calibrationBiasThreshold:
        updates.calibrationBiasThreshold ?? existing.calibrationBiasThreshold,
      cooldownHours: updates.cooldownHours ?? existing.cooldownHours,
    })
    .onConflictDoUpdate({
      target: fineTuningTriggerConfigs.agentId,
      set: {
        ...(updates.enabled !== undefined ? { enabled: updates.enabled } : {}),
        ...(updates.correctionThreshold !== undefined
          ? { correctionThreshold: updates.correctionThreshold }
          : {}),
        ...(updates.evalScoreDropThreshold !== undefined
          ? { evalScoreDropThreshold: updates.evalScoreDropThreshold }
          : {}),
        ...(updates.calibrationBiasThreshold !== undefined
          ? { calibrationBiasThreshold: updates.calibrationBiasThreshold }
          : {}),
        ...(updates.cooldownHours !== undefined ? { cooldownHours: updates.cooldownHours } : {}),
        updatedAt: new Date(),
      },
    });

  await writeAuditEntry('fine_tuning.trigger.config_updated', agentId, {
    agentId,
    updates,
  });
}

export interface TriggerEvaluationResult {
  agentId: string;
  shouldTrigger: boolean;
  suppressedReasons: string[];
  triggerReasons: string[];
  conditions: {
    correctionCount: number;
    correctionThreshold: number;
    correctionsMet: boolean;
    evalScoreDrop: number | null;
    evalDropThreshold: number;
    evalDropMet: boolean;
    calibrationBias: number | null;
    calibrationThreshold: number;
    calibrationMet: boolean;
    globalEnabled: boolean;
    agentEnabled: boolean;
    inCooldown: boolean;
  };
}

async function evaluateTriggerConditions(agentId: string): Promise<TriggerEvaluationResult> {
  const config = await getTriggerConfig(agentId);

  const globalEnabled = isAutonomousTrainingGloballyEnabled();
  const agentEnabled = config.enabled;
  const suppressedReasons: string[] = [];
  const triggerReasons: string[] = [];

  if (!globalEnabled) suppressedReasons.push('Global autonomous training kill switch is active');
  if (!agentEnabled) suppressedReasons.push(`Agent '${agentId}' autonomous training is disabled`);

  let inCooldown = false;
  if (config.lastTriggeredAt) {
    const lastTriggered = new Date(config.lastTriggeredAt).getTime();
    const hoursSinceLast = (Date.now() - lastTriggered) / (1000 * 60 * 60);
    if (hoursSinceLast < config.cooldownHours) {
      inCooldown = true;
      suppressedReasons.push(
        `Cooldown active: ${hoursSinceLast.toFixed(1)}h elapsed of ${config.cooldownHours}h required`,
      );
    }
  }

  const [lastJob] = await db
    .select()
    .from(fineTuningJobs)
    .where(eq(fineTuningJobs.agentId, agentId))
    .orderBy(desc(fineTuningJobs.createdAt))
    .limit(1);

  const sinceDate = lastJob?.completedAt ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [corrections, feedback] = await Promise.all([
    db
      .select()
      .from(alloyAgentCorrections)
      .where(
        and(
          eq(alloyAgentCorrections.sourceAgentId, agentId),
          gte(alloyAgentCorrections.createdAt, sinceDate),
        ),
      ),
    db
      .select()
      .from(agentFeedback)
      .where(
        and(
          eq(agentFeedback.agentId, agentId),
          gte(agentFeedback.createdAt, sinceDate),
        ),
      ),
  ]);

  const correctionCount = corrections.length + feedback.filter((f) => f.rating <= 2).length;
  const correctionsMet = correctionCount >= config.correctionThreshold;

  if (correctionsMet) {
    triggerReasons.push(
      `New corrections/feedback accumulated: ${correctionCount} >= ${config.correctionThreshold} threshold`,
    );
  }

  let evalScoreDrop: number | null = null;
  let evalDropMet = false;

  // Per-agent eval quality signal: derived from agent-specific feedback ratings.
  // The global evalRuns table has no agentId column, so we use the already-fetched
  // agentFeedback for this agent as a true per-agent quality indicator.
  // "Good" feedback is defined as rating >= 3 (on a 1-5 scale).
  const MIN_FEEDBACK_FOR_EVAL = 5;
  if (feedback.length >= MIN_FEEDBACK_FOR_EVAL) {
    const goodRatings = feedback.filter((f) => (f.rating ?? 3) >= 3).length;
    const currentPassRate = goodRatings / feedback.length;

    // Baseline: use baseModelEvalScores from last successful fine-tuning job,
    // falling back to the industry default of 0.75.
    let baselinePassRate = 0.75;
    try {
      const [lastSucceededJob] = await db
        .select()
        .from(fineTuningJobs)
        .where(and(eq(fineTuningJobs.agentId, agentId), eq(fineTuningJobs.status, 'registered')))
        .orderBy(desc(fineTuningJobs.completedAt))
        .limit(1);

      if (lastSucceededJob?.baseModelEvalScores) {
        const baseScores = lastSucceededJob.baseModelEvalScores as Record<string, unknown>;
        if (typeof baseScores.passRate === 'number') {
          baselinePassRate = baseScores.passRate;
        }
      }
    } catch {
      // Fall back to 0.75 default
    }

    evalScoreDrop = baselinePassRate - currentPassRate;
    evalDropMet = evalScoreDrop > config.evalScoreDropThreshold;
    if (evalDropMet) {
      triggerReasons.push(
        `Agent feedback quality dropped ${(evalScoreDrop * 100).toFixed(1)}% below ` +
          `baseline (${goodRatings}/${feedback.length} good ratings; ` +
          `threshold: ${(config.evalScoreDropThreshold * 100).toFixed(1)}%)`,
      );
    }
  }

  let calibrationBias: number | null = null;
  let calibrationMet = false;

  const calibrations = await computeAgentCalibrations();
  const agentCalibration = calibrations.find((c) => c.agentId === agentId);
  if (agentCalibration) {
    calibrationBias = Math.abs(agentCalibration.calibrationBias);
    calibrationMet = calibrationBias > config.calibrationBiasThreshold;
    if (calibrationMet) {
      triggerReasons.push(
        `Calibration bias ${(calibrationBias * 100).toFixed(1)}% exceeds tolerance (threshold: ${(config.calibrationBiasThreshold * 100).toFixed(1)}%)`,
      );
    }
  }

  const shouldTrigger = suppressedReasons.length === 0 && triggerReasons.length > 0;

  return {
    agentId,
    shouldTrigger,
    suppressedReasons,
    triggerReasons,
    conditions: {
      correctionCount,
      correctionThreshold: config.correctionThreshold,
      correctionsMet,
      evalScoreDrop,
      evalDropThreshold: config.evalScoreDropThreshold,
      evalDropMet,
      calibrationBias,
      calibrationThreshold: config.calibrationBiasThreshold,
      calibrationMet,
      globalEnabled,
      agentEnabled,
      inCooldown,
    },
  };
}

export async function checkAndTriggerTraining(
  agentId: string,
  options?: {
    baseModel?: string;
    provider?: 'openai' | 'gemini';
    dryRun?: boolean;
  },
): Promise<TriggerEvaluationResult & { jobId?: string; error?: string }> {
  const evaluation = await evaluateTriggerConditions(agentId);

  try {
    await db
      .insert(fineTuningTriggerConfigs)
      .values({
        agentId,
        enabled: true,
        correctionThreshold: 50,
        evalScoreDropThreshold: 0.05,
        calibrationBiasThreshold: 0.15,
        cooldownHours: 24,
        lastCheckedAt: new Date(),
        lastDecision: evaluation.shouldTrigger ? 'triggered' : 'suppressed',
      })
      .onConflictDoUpdate({
        target: fineTuningTriggerConfigs.agentId,
        set: {
          lastCheckedAt: new Date(),
          lastDecision: evaluation.shouldTrigger ? 'triggered' : 'suppressed',
          updatedAt: new Date(),
        },
      });
  } catch {
    // Table may not be migrated yet
  }

  const auditAction = evaluation.shouldTrigger
    ? 'fine_tuning.trigger.fired'
    : 'fine_tuning.trigger.suppressed';

  await writeAuditEntry(auditAction, agentId, {
    agentId,
    shouldTrigger: evaluation.shouldTrigger,
    triggerReasons: evaluation.triggerReasons,
    suppressedReasons: evaluation.suppressedReasons,
    conditions: evaluation.conditions,
    dryRun: options?.dryRun ?? false,
  });

  if (!evaluation.shouldTrigger || options?.dryRun) {
    return evaluation;
  }

  try {
    const { submitFineTuningJob } = await import('./job-manager.js');

    const defaultModels: Record<string, string> = {
      openai: 'gpt-4o-mini-2024-07-18',
      gemini: 'gemini-1.5-flash-001',
    };

    const provider = options?.provider ?? 'openai';
    const job = await submitFineTuningJob({
      agentId,
      provider: provider as 'openai' | 'gemini',
      baseModel: options?.baseModel ?? defaultModels[provider] ?? 'gpt-4o-mini-2024-07-18',
      triggeredBy: 'auto',
      options: { minSamples: 10 },
    });

    try {
      await db
        .update(fineTuningTriggerConfigs)
        .set({
          lastTriggeredAt: new Date(),
          lastDecision: 'triggered',
          updatedAt: new Date(),
        })
        .where(eq(fineTuningTriggerConfigs.agentId, agentId));
    } catch {
      // Non-critical
    }

    await writeAuditEntry('fine_tuning.trigger.job_submitted', agentId, {
      agentId,
      jobId: job.jobId,
      provider: job.provider,
      baseModel: job.baseModel,
      triggerReasons: evaluation.triggerReasons,
    });

    return { ...evaluation, jobId: job.jobId };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);

    await writeAuditEntry('fine_tuning.trigger.submission_failed', agentId, {
      agentId,
      error: errMsg,
      triggerReasons: evaluation.triggerReasons,
    });

    return { ...evaluation, error: errMsg };
  }
}

export async function runTriggerCheckForAllAgents(
  options?: { dryRun?: boolean },
): Promise<Array<TriggerEvaluationResult & { jobId?: string; error?: string }>> {
  const agents = getAllSupportedAgents();
  const results = await Promise.allSettled(
    agents.map((agentId) => checkAndTriggerTraining(agentId, options)),
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      agentId: agents[i] ?? 'unknown',
      shouldTrigger: false,
      suppressedReasons: [],
      triggerReasons: [],
      conditions: {
        correctionCount: 0,
        correctionThreshold: 0,
        correctionsMet: false,
        evalScoreDrop: null,
        evalDropThreshold: 0,
        evalDropMet: false,
        calibrationBias: null,
        calibrationThreshold: 0,
        calibrationMet: false,
        globalEnabled: false,
        agentEnabled: false,
        inCooldown: false,
      },
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });
}

let _scheduledTriggerHandle: ReturnType<typeof setInterval> | null = null;

export function startScheduledTriggerChecks(intervalMs = 60 * 60 * 1000): void {
  if (_scheduledTriggerHandle) return;
  _scheduledTriggerHandle = setInterval(() => {
    // Run trigger evaluation for all agents and also resolve idle canaries.
    // Both run concurrently — canary idle check is independent of trigger decisions.
    void Promise.allSettled([
      runTriggerCheckForAllAgents(),
      runIdleCanaryChecks(),
    ]);
  }, intervalMs);
}

export function stopScheduledTriggerChecks(): void {
  if (_scheduledTriggerHandle) {
    clearInterval(_scheduledTriggerHandle);
    _scheduledTriggerHandle = null;
  }
}

export async function getPipelineHealth(): Promise<{
  globalEnabled: boolean;
  lastTriggerCheck: string | null;
  schedulerRunning: boolean;
  agentStatuses: Array<{
    agentId: string;
    enabled: boolean;
    lastTriggeredAt: string | null;
    lastCheckedAt: string | null;
    lastDecision: string | null;
  }>;
}> {
  let configs: Array<{
    agentId: string;
    enabled: boolean;
    lastTriggeredAt: Date | null;
    lastCheckedAt: Date | null;
    lastDecision: string | null;
  }> = [];

  try {
    configs = await db.select().from(fineTuningTriggerConfigs);
  } catch {
    // Table may not be migrated yet
  }

  const agents = getAllSupportedAgents();

  const agentStatuses = agents.map((agentId) => {
    const config = configs.find((c) => c.agentId === agentId);
    return {
      agentId,
      enabled: config?.enabled ?? true,
      lastTriggeredAt: config?.lastTriggeredAt?.toISOString() ?? null,
      lastCheckedAt: config?.lastCheckedAt?.toISOString() ?? null,
      lastDecision: config?.lastDecision ?? null,
    };
  });

  const latestCheck = configs
    .map((c) => c.lastCheckedAt)
    .filter(Boolean)
    .sort((a, b) => (b?.getTime() ?? 0) - (a?.getTime() ?? 0))[0];

  return {
    globalEnabled: isAutonomousTrainingGloballyEnabled(),
    lastTriggerCheck: latestCheck?.toISOString() ?? null,
    schedulerRunning: _scheduledTriggerHandle !== null,
    agentStatuses,
  };
}
