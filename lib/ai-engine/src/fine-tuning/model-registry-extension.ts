/**
 * Model Registry Extension for Fine-Tuned Models
 *
 * Extends the base model registry so agents can be routed to their fine-tuned variants
 * with automatic fallback to base models when not available.
 * Supports percentage-based canary traffic splitting with auto-promotion/rollback.
 */

import { db, fineTunedModelRegistry, fineTuningJobs } from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';

export interface FineTunedModelInfo {
  modelId: string;
  agentId: string;
  jobId: string;
  baseModel: string;
  provider: string;
  lifecycle: 'staging' | 'canary' | 'active' | 'deprecated';
  evalPassRate: number;
  datasetVersion: string;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  registeredAt: string;
  promotedAt?: string;
  canaryTrafficPct?: number;
  canaryRequestsTotal?: number;
  canaryRequestsSuccess?: number;
}

const _modelCache = new Map<string, { model: FineTunedModelInfo; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getActiveFineTunedModel(
  agentId: string,
  requiredLifecycle: Array<'staging' | 'canary' | 'active'> = ['active', 'canary'],
): Promise<FineTunedModelInfo | null> {
  const cacheKey = `${agentId}:${requiredLifecycle.join(',')}`;
  const cached = _modelCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.model;

  try {
    const models = await db
      .select()
      .from(fineTunedModelRegistry)
      .where(
        and(eq(fineTunedModelRegistry.agentId, agentId), eq(fineTunedModelRegistry.isActive, true)),
      )
      .orderBy(desc(fineTunedModelRegistry.registeredAt))
      .limit(10);

    const eligible = models.filter(
      (m) =>
        requiredLifecycle.includes(m.lifecycle as 'staging' | 'canary' | 'active') && m.isActive,
    );

    if (eligible.length === 0) return null;

    const prioritized = eligible.sort((a, b) => {
      const lifecycleScore = { active: 3, canary: 2, staging: 1, deprecated: 0 };
      const aScore = lifecycleScore[a.lifecycle as keyof typeof lifecycleScore] ?? 0;
      const bScore = lifecycleScore[b.lifecycle as keyof typeof lifecycleScore] ?? 0;
      if (aScore !== bScore) return bScore - aScore;
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    });

    const best = prioritized[0]!;
    const _promotedAt = best.promotedAt?.toISOString();
    const result: FineTunedModelInfo = {
      modelId: best.modelId,
      agentId: best.agentId,
      jobId: best.jobId,
      baseModel: best.baseModel,
      provider: best.provider,
      lifecycle: best.lifecycle as FineTunedModelInfo['lifecycle'],
      evalPassRate: best.evalPassRate ?? 0,
      datasetVersion: best.datasetVersion,
      registeredAt: best.registeredAt.toISOString(),
      ...(best.costPer1kInput != null ? { costPer1kInput: best.costPer1kInput } : {}),
      ...(best.costPer1kOutput != null ? { costPer1kOutput: best.costPer1kOutput } : {}),
      ...(_promotedAt !== undefined ? { promotedAt: _promotedAt } : {}),
      ...(best.canaryTrafficPct != null ? { canaryTrafficPct: best.canaryTrafficPct } : {}),
      ...(best.canaryRequestsTotal != null ? { canaryRequestsTotal: best.canaryRequestsTotal } : {}),
      ...(best.canaryRequestsSuccess != null
        ? { canaryRequestsSuccess: best.canaryRequestsSuccess }
        : {}),
    };

    _modelCache.set(cacheKey, { model: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    return null;
  }
}

export async function resolveModelForAgent(
  agentId: string,
  baseModel: string,
  options?: {
    preferFineTuned?: boolean;
    minLifecycle?: 'staging' | 'canary' | 'active';
    trackOutcome?: boolean;
  },
): Promise<{
  model: string;
  provider: string;
  isFineTuned: boolean;
  isCanary: boolean;
  fineTunedInfo?: FineTunedModelInfo;
}> {
  const preferFineTuned = options?.preferFineTuned ?? true;

  if (!preferFineTuned) {
    return { model: baseModel, provider: detectProvider(baseModel), isFineTuned: false, isCanary: false };
  }

  // Query canary model FIRST — explicit separate lookup ensures that when both
  // active and canary exist, the canary traffic-split is actually applied.
  // (A combined query with lifecycle priority always resolves to the active model,
  // bypassing the canary split entirely.)
  const canaryModel = await getActiveFineTunedModel(agentId, ['canary']);

  if (canaryModel) {
    const canaryPct = canaryModel.canaryTrafficPct ?? 10;
    const useCanary = Math.random() * 100 < canaryPct;

    if (useCanary) {
      // Always record canary routing so totalRequests stays accurate.
      // recordCanaryOutcome (called by callers when response is known) then
      // only increments the success counter — no double-counting.
      void recordCanaryRequest(canaryModel.modelId).catch(() => {});
      return {
        model: canaryModel.modelId,
        provider: canaryModel.provider,
        isFineTuned: true,
        isCanary: true,
        fineTunedInfo: canaryModel,
      };
    }

    // Traffic NOT routed to canary — send to the production active model (not base).
    const activeModel = await getActiveFineTunedModel(agentId, ['active']);
    if (activeModel) {
      return {
        model: activeModel.modelId,
        provider: activeModel.provider,
        isFineTuned: true,
        isCanary: false,
        fineTunedInfo: activeModel,
      };
    }
    return { model: baseModel, provider: detectProvider(baseModel), isFineTuned: false, isCanary: false };
  }

  // No canary present: resolve best available fine-tuned model.
  const lifecyclePriority: Array<'staging' | 'canary' | 'active'> =
    options?.minLifecycle === 'active'
      ? ['active']
      : options?.minLifecycle === 'canary'
        ? ['active', 'canary']
        : ['active', 'canary', 'staging'];

  const fineTuned = await getActiveFineTunedModel(agentId, lifecyclePriority);

  if (!fineTuned) {
    return { model: baseModel, provider: detectProvider(baseModel), isFineTuned: false, isCanary: false };
  }

  return {
    model: fineTuned.modelId,
    provider: fineTuned.provider,
    isFineTuned: true,
    isCanary: false,
    fineTunedInfo: fineTuned,
  };
}

async function recordCanaryRequest(modelId: string): Promise<void> {
  const [model] = await db
    .select()
    .from(fineTunedModelRegistry)
    .where(eq(fineTunedModelRegistry.modelId, modelId))
    .limit(1);

  if (!model) return;

  const newTotal = (model.canaryRequestsTotal ?? 0) + 1;

  await db
    .update(fineTunedModelRegistry)
    .set({ canaryRequestsTotal: newTotal })
    .where(eq(fineTunedModelRegistry.modelId, modelId));

  invalidateModelCache(model.agentId);
}

export async function getAllFineTunedModels(): Promise<FineTunedModelInfo[]> {
  const models = await db
    .select()
    .from(fineTunedModelRegistry)
    .where(eq(fineTunedModelRegistry.isActive, true))
    .orderBy(desc(fineTunedModelRegistry.registeredAt));

  return models.map((m) => {
    const _pAt = m.promotedAt?.toISOString();
    return {
      modelId: m.modelId,
      agentId: m.agentId,
      jobId: m.jobId,
      baseModel: m.baseModel,
      provider: m.provider,
      lifecycle: m.lifecycle as FineTunedModelInfo['lifecycle'],
      evalPassRate: m.evalPassRate ?? 0,
      datasetVersion: m.datasetVersion,
      registeredAt: m.registeredAt.toISOString(),
      ...(m.costPer1kInput != null ? { costPer1kInput: m.costPer1kInput } : {}),
      ...(m.costPer1kOutput != null ? { costPer1kOutput: m.costPer1kOutput } : {}),
      ...(_pAt !== undefined ? { promotedAt: _pAt } : {}),
      ...(m.canaryTrafficPct != null ? { canaryTrafficPct: m.canaryTrafficPct } : {}),
      ...(m.canaryRequestsTotal != null ? { canaryRequestsTotal: m.canaryRequestsTotal } : {}),
      ...(m.canaryRequestsSuccess != null
        ? { canaryRequestsSuccess: m.canaryRequestsSuccess }
        : {}),
    } satisfies FineTunedModelInfo;
  });
}

export async function deprecateFineTunedModel(modelId: string): Promise<void> {
  invalidateModelCache();
  await db
    .update(fineTunedModelRegistry)
    .set({
      lifecycle: 'deprecated',
      isActive: false,
      deprecatedAt: new Date(),
    })
    .where(eq(fineTunedModelRegistry.modelId, modelId));
}

export function invalidateModelCache(agentId?: string): void {
  if (agentId) {
    for (const key of _modelCache.keys()) {
      if (key.startsWith(`${agentId}:`)) _modelCache.delete(key);
    }
  } else {
    _modelCache.clear();
  }
}

export async function getModelLineage(modelId: string): Promise<{
  model: FineTunedModelInfo | null;
  baseModelName: string;
  jobHistory: Array<{ jobId: string; status: string; submittedAt: string; datasetVersion: string }>;
}> {
  const [model] = await db
    .select()
    .from(fineTunedModelRegistry)
    .where(eq(fineTunedModelRegistry.modelId, modelId))
    .limit(1);

  if (!model) {
    return { model: null, baseModelName: '', jobHistory: [] };
  }

  const jobs = await db
    .select()
    .from(fineTuningJobs)
    .where(eq(fineTuningJobs.agentId, model.agentId))
    .orderBy(desc(fineTuningJobs.createdAt))
    .limit(20);

  const _mPAt = model.promotedAt?.toISOString();
  return {
    model: {
      modelId: model.modelId,
      agentId: model.agentId,
      jobId: model.jobId,
      baseModel: model.baseModel,
      provider: model.provider,
      lifecycle: model.lifecycle as FineTunedModelInfo['lifecycle'],
      evalPassRate: model.evalPassRate ?? 0,
      datasetVersion: model.datasetVersion,
      registeredAt: model.registeredAt.toISOString(),
      ...(model.costPer1kInput != null ? { costPer1kInput: model.costPer1kInput } : {}),
      ...(model.costPer1kOutput != null ? { costPer1kOutput: model.costPer1kOutput } : {}),
      ...(_mPAt !== undefined ? { promotedAt: _mPAt } : {}),
    } satisfies FineTunedModelInfo,
    baseModelName: model.baseModel,
    jobHistory: jobs.map((j) => ({
      jobId: j.jobId,
      status: j.status,
      submittedAt: j.submittedAt.toISOString(),
      datasetVersion: j.datasetVersion,
    })),
  };
}

function detectProvider(model: string): string {
  if (model.startsWith('gpt') || model.startsWith('ft:')) return 'openai';
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gemini') || model.startsWith('tunedModels/')) return 'gemini';
  return 'openai';
}
