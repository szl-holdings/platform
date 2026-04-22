import { agentModelAssignments, aiSafetyEvents, db } from '@szl-holdings/db';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AGENT_REGISTRY } from './nuro-mesh.js';

const safetyRouter: IRouter = Router();

const safetyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior)\s+instructions?/gi,
  /forget\s+your\s+(system|previous)\s+(prompt|instructions?)/gi,
  /you\s+are\s+now\s+(a\s+)?(different|new|another)\s+(ai|assistant|bot|model)/gi,
  /disregard\s+(your|all)\s+(training|guidelines|constraints)/gi,
  /act\s+as\s+if\s+you\s+have\s+no\s+(restrictions|limitations|rules)/gi,
  /reveal\s+your\s+(system\s+)?prompt/gi,
  /override\s+(your\s+)?(safety|security|content)\s+filter/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,
];

const PII_PATTERNS = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'SSN' },
  { pattern: /\b\d{16}\b/g, type: 'credit_card' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'phone' },
  { pattern: /\bpassword\s*[:=]\s*\S+/gi, type: 'password' },
  { pattern: /\bapi[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{20,}/gi, type: 'api_key' },
  { pattern: /\bsecret\s*[:=]\s*\S{10,}/gi, type: 'secret' },
];

export function scanForPromptInjection(input: string): { detected: boolean; patterns: string[] } {
  const detected: string[] = [];
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      detected.push(pattern.source.slice(0, 50));
    }
  }
  return { detected: detected.length > 0, patterns: detected };
}

export function scanForPII(text: string): { detected: boolean; types: string[]; redacted: string } {
  const types: string[] = [];
  let redacted = text;

  for (const { pattern, type } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      types.push(type);
      pattern.lastIndex = 0;
      redacted = redacted.replace(pattern, `[${type.toUpperCase()} REDACTED]`);
    }
  }

  return { detected: types.length > 0, types, redacted };
}

export async function logSafetyEvent(
  eventType: string,
  description: string,
  options: { agentId?: string; severity?: string; blocked?: boolean; inputSample?: string } = {},
): Promise<void> {
  try {
    await db.insert(aiSafetyEvents).values({
      eventType,
      agentId: options.agentId,
      severity: options.severity ?? 'low',
      description,
      blocked: options.blocked ?? false,
      inputSample: options.inputSample?.slice(0, 200),
    });
  } catch {}
}

export async function checkTokenBudget(
  agentId: string,
  requestedTokens = 1000,
): Promise<{ allowed: boolean; remaining: number; budget: number }> {
  try {
    const [assignment] = await db
      .select()
      .from(agentModelAssignments)
      .where(eq(agentModelAssignments.agentId, agentId))
      .limit(1);

    if (!assignment) {
      return { allowed: true, remaining: 100000, budget: 100000 };
    }

    const now = new Date();
    if (assignment.periodResetAt < now) {
      await db
        .update(agentModelAssignments)
        .set({ tokensUsedPeriod: 0, periodResetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) })
        .where(eq(agentModelAssignments.agentId, agentId));
      return { allowed: true, remaining: assignment.tokenBudget, budget: assignment.tokenBudget };
    }

    const remaining = assignment.tokenBudget - assignment.tokensUsedPeriod;
    const allowed = remaining >= requestedTokens;

    if (!allowed) {
      await logSafetyEvent(
        'budget_exceeded',
        `Agent ${agentId} exceeded token budget (${assignment.tokensUsedPeriod}/${assignment.tokenBudget})`,
        {
          agentId,
          severity: 'medium',
          blocked: true,
        },
      );
    }

    return { allowed, remaining: Math.max(0, remaining), budget: assignment.tokenBudget };
  } catch {
    return { allowed: true, remaining: 100000, budget: 100000 };
  }
}

safetyRouter.post('/ai-safety/scan-input', safetyRateLimit, async (req: Request, res: Response) => {
  try {
    const { input, agentId } = req.body as { input: string; agentId?: string };
    if (!input) {
      res.status(400).json({ error: 'Input is required' });
      return;
    }

    const injectionScan = scanForPromptInjection(input);
    const piiScan = scanForPII(input);

    if (injectionScan.detected) {
      await logSafetyEvent('prompt_injection_attempt', `Prompt injection detected in input`, {
        agentId,
        severity: 'high',
        blocked: true,
        inputSample: input.slice(0, 200),
      });
    }

    if (piiScan.detected) {
      await logSafetyEvent('pii_in_input', `PII detected in input: ${piiScan.types.join(', ')}`, {
        agentId,
        severity: 'medium',
        blocked: false,
        inputSample: input.slice(0, 100),
      });
    }

    res.json({
      safe: !injectionScan.detected,
      injectionDetected: injectionScan.detected,
      injectionPatterns: injectionScan.patterns,
      piiDetected: piiScan.detected,
      piiTypes: piiScan.types,
      sanitizedInput: piiScan.redacted,
    });
  } catch (_err) {
    res.status(500).json({ error: 'Safety scan failed' });
  }
});

safetyRouter.post(
  '/ai-safety/scan-output',
  safetyRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { output, agentId } = req.body as { output: string; agentId?: string };
      if (!output) {
        res.status(400).json({ error: 'Output is required' });
        return;
      }

      const piiScan = scanForPII(output);

      if (piiScan.detected) {
        await logSafetyEvent(
          'pii_in_output',
          `PII detected in AI output: ${piiScan.types.join(', ')}`,
          {
            agentId,
            severity: 'high',
            blocked: false,
            inputSample: output.slice(0, 100),
          },
        );
      }

      res.json({
        safe: !piiScan.detected,
        piiDetected: piiScan.detected,
        piiTypes: piiScan.types,
        redactedOutput: piiScan.redacted,
      });
    } catch (_err) {
      res.status(500).json({ error: 'Output scan failed' });
    }
  },
);

safetyRouter.get('/ai-safety/events', safetyRateLimit, async (req: Request, res: Response) => {
  try {
    const { limit = '50', severity, agentId } = req.query as Record<string, string>;

    const conditions = [];
    if (severity) conditions.push(eq(aiSafetyEvents.severity, severity));
    if (agentId) conditions.push(eq(aiSafetyEvents.agentId, agentId));

    const events = await db
      .select()
      .from(aiSafetyEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(aiSafetyEvents.detectedAt))
      .limit(Math.min(parseInt(limit, 10), 200));

    const stats = await db
      .select({
        eventType: aiSafetyEvents.eventType,
        count: sql<number>`count(*)`,
        blocked: sql<number>`sum(case when blocked then 1 else 0 end)`,
      })
      .from(aiSafetyEvents)
      .where(gte(aiSafetyEvents.detectedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
      .groupBy(aiSafetyEvents.eventType);

    res.json({ events, stats, total: events.length });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch safety events' });
  }
});

safetyRouter.get(
  '/ai-safety/model-registry',
  safetyRateLimit,
  async (_req: Request, res: Response) => {
    try {
      const assignments = await db
        .select()
        .from(agentModelAssignments)
        .orderBy(agentModelAssignments.agentId);

      const registry = AGENT_REGISTRY.map((agent) => {
        const assignment = assignments.find((a) => a.agentId === agent.id);
        return {
          agentId: agent.id,
          agentName: agent.name,
          domain: agent.domain,
          currentModel: assignment?.model ?? agent.preferredModel,
          currentProvider: assignment?.provider ?? agent.preferredProvider,
          defaultModel: agent.preferredModel,
          defaultProvider: agent.preferredProvider,
          tokenBudget: assignment?.tokenBudget ?? 100000,
          tokensUsedPeriod: assignment?.tokensUsedPeriod ?? 0,
          budgetUtilization: assignment
            ? Math.round((assignment.tokensUsedPeriod / assignment.tokenBudget) * 100)
            : 0,
          tools: agent.tools,
          highStakesDomains: agent.highStakesDomains,
        };
      });

      res.json({ registry, totalAgents: registry.length });
    } catch (_err) {
      res.status(500).json({ error: 'Failed to fetch model registry' });
    }
  },
);

safetyRouter.put(
  '/ai-safety/model-registry/:agentId',
  safetyRateLimit,
  async (req: Request, res: Response) => {
    try {
      const agentId = String(req.params.agentId ?? '');
      const { model, provider, tokenBudget } = req.body as {
        model?: string;
        provider?: string;
        tokenBudget?: number;
      };

      const agent = AGENT_REGISTRY.find((a) => a.id === agentId);
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      const [existing] = await db
        .select()
        .from(agentModelAssignments)
        .where(eq(agentModelAssignments.agentId, agentId))
        .limit(1);

      const updateData = {
        agentId,
        agentName: agent.name,
        model: model ?? agent.preferredModel,
        provider: provider ?? agent.preferredProvider,
        tokenBudget: tokenBudget ?? 100000,
        updatedAt: new Date(),
      };

      if (existing) {
        await db
          .update(agentModelAssignments)
          .set(updateData)
          .where(eq(agentModelAssignments.agentId, agentId));
      } else {
        await db.insert(agentModelAssignments).values({
          ...updateData,
          tokensUsedPeriod: 0,
          periodResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }

      res.json({ success: true, agentId, model: updateData.model, provider: updateData.provider });
    } catch (_err) {
      res.status(500).json({ error: 'Failed to update model assignment' });
    }
  },
);

safetyRouter.get('/ai-safety/dashboard', safetyRateLimit, async (_req: Request, res: Response) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentEvents, blockedCount, budgetStats] = await Promise.all([
      db
        .select()
        .from(aiSafetyEvents)
        .where(gte(aiSafetyEvents.detectedAt, last24h))
        .orderBy(desc(aiSafetyEvents.detectedAt))
        .limit(10),
      db
        .select({ count: sql<number>`count(*)` })
        .from(aiSafetyEvents)
        .where(and(gte(aiSafetyEvents.detectedAt, last24h), eq(aiSafetyEvents.blocked, true))),
      db.select().from(agentModelAssignments),
    ]);

    const totalBudget = budgetStats.reduce((sum, a) => sum + a.tokenBudget, 0);
    const totalUsed = budgetStats.reduce((sum, a) => sum + a.tokensUsedPeriod, 0);

    const eventTypeCounts = recentEvents.reduce(
      (acc, e) => {
        acc[e.eventType] = (acc[e.eventType] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    res.json({
      last24h: {
        totalEvents: recentEvents.length,
        blockedAttempts: blockedCount[0]?.count ?? 0,
        eventTypes: eventTypeCounts,
        recentEvents: recentEvents.slice(0, 5),
      },
      budgets: {
        totalBudget,
        totalUsed,
        utilizationPct: totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0,
        agentBudgets: budgetStats.map((a) => ({
          agentId: a.agentId,
          agentName: a.agentName,
          budget: a.tokenBudget,
          used: a.tokensUsedPeriod,
          pct: Math.round((a.tokensUsedPeriod / a.tokenBudget) * 100),
        })),
      },
      safetyScore: Math.max(0, 100 - recentEvents.length * 2 - (blockedCount[0]?.count ?? 0) * 5),
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch safety dashboard' });
  }
});

export default safetyRouter;
