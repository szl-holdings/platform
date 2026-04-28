import { Router } from 'express';
import { getTrustEngineForTenant, extractTenantId } from '../services/tenant-trust-registry';
import type { CrewRunResult, PendingApproval } from '@workspace/alloy';
import { callModel } from '../services/ai/call-model';

const router = Router();

interface StoredPlan {
  result: CrewRunResult;
  tenantId: string;
  createdAt: number;
  request: { objective: string; domain?: string };
}

const _pendingPlans = new Map<string, StoredPlan>();

const PLAN_TTL_MS = 60 * 60 * 1000;

function pruneExpiredPlans(): void {
  const now = Date.now();
  for (const [planId, plan] of _pendingPlans) {
    if (now - plan.createdAt > PLAN_TTL_MS) {
      _pendingPlans.delete(planId);
    }
  }
}

async function createLlmClient(): Promise<import('@workspace/alloy').LlmChatClient> {
  const mod = await import('@szl-holdings/ai-engine/providers/openai');
  const openai = mod.openai;
  return {
    async chat(params: {
      model: string;
      maxTokens?: number;
      messages: Array<{ role: string; content: string }>;
    }): Promise<string> {
      const { content } = await callModel({
        provider: 'openai',
        model: params.model,
        surface: 'multi-agent-crew',
        fn: async () => {
          const response = await openai.chat.completions.create({
            model: params.model,
            max_completion_tokens: params.maxTokens,
            messages: params.messages.map((m) => ({
              role: m.role as 'system' | 'user' | 'assistant',
              content: m.content,
            })),
          });
          const text = response.choices[0]?.message?.content ?? '[No response]';
          return { promptTokens: response.usage?.prompt_tokens ?? 0, completionTokens: response.usage?.completion_tokens ?? 0, content: text };
        },
      });
      return content;
    },
  };
}

router.post('/crew/run', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body.objective !== 'string' || !body.objective.trim()) {
      res.status(400).json({ error: 'Request body must include a non-empty "objective" string' });
      return;
    }

    const tenantId = extractTenantId(req as Record<string, unknown>);
    const { MultiAgentCrew } = await import('@workspace/alloy');
    const [llmClient, trustEngine] = await Promise.all([
      createLlmClient(),
      getTrustEngineForTenant(tenantId),
    ]);

    const crew = new MultiAgentCrew({
      llmClient,
      trustEngine,
    });
    const result = await crew.run(body);

    if (result.pendingApprovals.length > 0) {
      pruneExpiredPlans();
      _pendingPlans.set(result.planId, {
        result,
        tenantId,
        createdAt: Date.now(),
        request: { objective: body.objective, domain: body.domain },
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Crew run failed' });
  }
});

router.get('/crew/members', async (_req, res) => {
  try {
    const { getDefaultCrew } = await import('@workspace/alloy');
    res.json({ members: getDefaultCrew() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list crew' });
  }
});

router.get('/crew/plans/pending', (req, res) => {
  const tenantId = extractTenantId(req as Record<string, unknown>);
  pruneExpiredPlans();

  const plans: Array<{
    planId: string;
    objective: string;
    pendingApprovals: PendingApproval[];
    createdAt: number;
  }> = [];

  for (const [planId, plan] of _pendingPlans) {
    if (plan.tenantId !== tenantId) continue;
    if (plan.result.pendingApprovals.length === 0) continue;
    plans.push({
      planId,
      objective: plan.result.objective,
      pendingApprovals: plan.result.pendingApprovals,
      createdAt: plan.createdAt,
    });
  }

  res.json({ plans });
});

router.post('/crew/plans/:planId/approve', async (req, res) => {
  try {
    const { planId } = req.params;
    const tenantId = extractTenantId(req as Record<string, unknown>);
    const stored = _pendingPlans.get(planId);

    if (!stored || stored.tenantId !== tenantId) {
      res.status(404).json({ error: 'Plan not found or does not belong to this tenant' });
      return;
    }

    const { subPlanIds } = req.body as { subPlanIds?: string[] };
    if (!Array.isArray(subPlanIds) || subPlanIds.length === 0) {
      res.status(400).json({ error: '"subPlanIds" is required and must be a non-empty array' });
      return;
    }

    const validIds = new Set(stored.result.pendingApprovals.map((p) => p.subPlanId));
    for (const id of subPlanIds) {
      if (!validIds.has(id)) {
        res.status(400).json({ error: `subPlanId "${id}" is not a pending approval for this plan` });
        return;
      }
    }

    const { MultiAgentCrew } = await import('@workspace/alloy');
    const [llmClient, trustEngine] = await Promise.all([
      createLlmClient(),
      getTrustEngineForTenant(tenantId),
    ]);

    const crew = new MultiAgentCrew({ llmClient, trustEngine });
    const result = await crew.resumeApproved(stored.result, new Set(subPlanIds));

    _pendingPlans.delete(planId);

    if (result.pendingApprovals.length > 0) {
      _pendingPlans.set(result.planId, {
        result,
        tenantId,
        createdAt: Date.now(),
        request: stored.request,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Approval failed' });
  }
});

router.delete('/crew/plans/:planId', (req, res) => {
  const { planId } = req.params;
  const tenantId = extractTenantId(req as Record<string, unknown>);
  const stored = _pendingPlans.get(planId);

  if (!stored || stored.tenantId !== tenantId) {
    res.status(404).json({ error: 'Plan not found or does not belong to this tenant' });
    return;
  }

  _pendingPlans.delete(planId);
  res.json({ success: true });
});

router.post('/crew/custom', async (req, res) => {
  try {
    const body = req.body;
    if (!body?.request || typeof body.request.objective !== 'string' || !body.request.objective.trim()) {
      res.status(400).json({ error: 'Request body must include "request" with a non-empty "objective" string' });
      return;
    }
    if (!Array.isArray(body.members) || body.members.length === 0) {
      res.status(400).json({ error: 'Request body must include a non-empty "members" array' });
      return;
    }

    const tenantId = extractTenantId(req as Record<string, unknown>);
    const { createCrew } = await import('@workspace/alloy');
    const [llmClient, trustEngine] = await Promise.all([
      createLlmClient(),
      getTrustEngineForTenant(tenantId),
    ]);

    const crew = createCrew(body.members, {
      llmClient,
      trustEngine,
    });
    const result = await crew.run(body.request);

    if (result.pendingApprovals.length > 0) {
      pruneExpiredPlans();
      _pendingPlans.set(result.planId, {
        result,
        tenantId,
        createdAt: Date.now(),
        request: body.request,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Custom crew run failed' });
  }
});

export default router;
