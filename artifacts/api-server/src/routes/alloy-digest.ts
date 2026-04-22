import { bodyShape } from '@szl-holdings/contracts/common';
import {
  alloyApprovals,
  alloySignals,
  alloyWorkflows,
  auditEventsTable,
  db,
  notificationPreferencesTable,
  pool,
} from '@szl-holdings/db';
import { services } from '@szl-holdings/services';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendCreated, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const router: IRouter = Router();

router.use('/alloy/digest', tenantScope({ required: true }));

interface DigestContent {
  keyDecisions: Array<{
    id: string;
    workflow: string;
    decision: string;
    impact: string;
    time: string;
  }>;
  pendingApprovals: Array<{
    id: string;
    workflow: string;
    description: string;
    requiredBy: string;
    urgency: string;
  }>;
  workflowSummary: { completed: number; failed: number; running: number; pendingApproval: number };
  signalsSummary: { critical: number; high: number; medium: number; low: number; newToday: number };
  policyDecisionsSummary: {
    approved: number;
    rejected: number;
    total: number;
    avgConfidence: number | null;
    recent: Array<{
      id: number;
      decision: string;
      action: string;
      product: string | null;
      resolvedMode: string | null;
      confidence: number | null;
      blockedReason: string | null;
      decidedAt: string;
    }>;
  };
  suggestedPriorities: Array<{ rank: number; action: string; reason: string; urgency: string }>;
  metrics: Record<string, unknown>;
}

export async function gatherDigestData(roleScope: string): Promise<DigestContent> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [workflowStats, pendingApprovals, signals, policyDecisions] = await Promise.all([
    db
      .select({ status: alloyWorkflows.status, cnt: count() })
      .from(alloyWorkflows)
      .where(gte(alloyWorkflows.createdAt, since24h))
      .groupBy(alloyWorkflows.status),
    db
      .select()
      .from(alloyApprovals)
      .where(eq(alloyApprovals.status, 'pending'))
      .orderBy(desc(alloyApprovals.createdAt))
      .limit(10),
    db
      .select({ severity: alloySignals.severity, cnt: count() })
      .from(alloySignals)
      .where(gte(alloySignals.createdAt, since24h))
      .groupBy(alloySignals.severity),
    db
      .select()
      .from(auditEventsTable)
      .where(
        and(
          sql`${auditEventsTable.action} IN ('policy.approve', 'policy.reject')`,
          gte(auditEventsTable.createdAt, since24h),
        ),
      )
      .orderBy(desc(auditEventsTable.createdAt))
      .limit(50),
  ]);

  const workflowSummary = {
    completed: 0,
    failed: 0,
    running: 0,
    pendingApproval: 0,
  };
  for (const row of workflowStats) {
    if (row.status === 'completed') workflowSummary.completed = Number(row.cnt);
    else if (row.status === 'failed') workflowSummary.failed = Number(row.cnt);
    else if (row.status === 'running') workflowSummary.running = Number(row.cnt);
    else if (row.status === 'waiting_approval') workflowSummary.pendingApproval = Number(row.cnt);
  }

  const signalsSummary = { critical: 0, high: 0, medium: 0, low: 0, newToday: 0 };
  for (const row of signals) {
    const cnt = Number(row.cnt);
    signalsSummary.newToday += cnt;
    if (row.severity === 'critical') signalsSummary.critical = cnt;
    else if (row.severity === 'high') signalsSummary.high = cnt;
    else if (row.severity === 'medium') signalsSummary.medium = cnt;
    else if (row.severity === 'low') signalsSummary.low = cnt;
  }

  const approvalItems = pendingApprovals.map((a) => ({
    id: String(a.id),
    workflow: `Workflow ${a.workflowId}`,
    description: a.reason ?? 'Requires approval',
    requiredBy: a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : 'No deadline',
    urgency:
      a.expiresAt && new Date(a.expiresAt) < new Date(Date.now() + 4 * 60 * 60 * 1000)
        ? 'high'
        : 'medium',
  }));

  const suggestedPriorities: Array<{
    rank: number;
    action: string;
    reason: string;
    urgency: string;
  }> = [];
  let rank = 1;

  if (signalsSummary.critical > 0) {
    suggestedPriorities.push({
      rank: rank++,
      action: `Review ${signalsSummary.critical} critical signal(s)`,
      reason: 'Critical signals require immediate attention',
      urgency: 'immediate',
    });
  }
  if (approvalItems.length > 0) {
    suggestedPriorities.push({
      rank: rank++,
      action: `Process ${approvalItems.length} pending approval(s)`,
      reason: 'Blocked workflows waiting on approval',
      urgency: approvalItems[0]?.urgency ?? 'medium',
    });
  }
  if (workflowSummary.failed > 0) {
    suggestedPriorities.push({
      rank: rank++,
      action: `Investigate ${workflowSummary.failed} failed workflow(s)`,
      reason: 'Failed workflows may indicate issues requiring remediation',
      urgency: 'high',
    });
  }
  if (signalsSummary.high > 0) {
    suggestedPriorities.push({
      rank: rank++,
      action: `Triage ${signalsSummary.high} high-severity signal(s)`,
      reason: 'High-severity signals may escalate if unaddressed',
      urgency: 'high',
    });
  }
  if (roleScope === 'executive' && workflowSummary.completed > 0) {
    suggestedPriorities.push({
      rank: rank++,
      action: `Review ${workflowSummary.completed} completed workflow outputs`,
      reason: 'Completed workflows may have deliverables requiring review',
      urgency: 'low',
    });
  }

  const policyApproved = policyDecisions.filter((d) => d.decision === 'approved').length;
  const policyRejected = policyDecisions.filter((d) => d.decision === 'rejected').length;
  const confidences = policyDecisions
    .map((d) => (typeof d.confidence === 'number' ? d.confidence : null))
    .filter((c): c is number => c !== null);
  const avgConfidence =
    confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null;
  const policyDecisionsSummary = {
    approved: policyApproved,
    rejected: policyRejected,
    total: policyDecisions.length,
    avgConfidence,
    recent: policyDecisions.slice(0, 10).map((d) => {
      const newValues = (d.newValues as Record<string, unknown> | null) ?? {};
      return {
        id: d.id,
        decision: d.decision ?? 'unknown',
        action:
          typeof newValues.action === 'string' ? (newValues.action as string) : '(unknown)',
        product: d.product ?? null,
        resolvedMode: d.resolvedMode ?? null,
        confidence: typeof d.confidence === 'number' ? d.confidence : null,
        blockedReason: d.blockedReason ?? null,
        decidedAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
      };
    }),
  };

  if (policyRejected > 0) {
    suggestedPriorities.push({
      rank: rank++,
      action: `Review ${policyRejected} rejected policy decision(s)`,
      reason: 'Rejected actions may indicate policy gaps or escalations needing attention',
      urgency: 'medium',
    });
  }

  return {
    keyDecisions: [],
    pendingApprovals: approvalItems,
    workflowSummary,
    signalsSummary,
    policyDecisionsSummary,
    suggestedPriorities,
    metrics: {
      workflowCompletionRate:
        workflowSummary.completed + workflowSummary.failed > 0
          ? Math.round(
              (workflowSummary.completed / (workflowSummary.completed + workflowSummary.failed)) *
                100,
            )
          : null,
      signalResponseRate: null,
      approvalBacklog: approvalItems.length,
      policyDecisions24h: policyDecisions.length,
      policyApprovalRate:
        policyDecisions.length > 0
          ? Math.round((policyApproved / policyDecisions.length) * 100)
          : null,
    },
  };
}

export async function generateDigestMarkdown(
  data: DigestContent,
  roleScope: string,
  date: string,
): Promise<string> {
  const dateStr = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const prompt = `Generate a concise executive daily digest in markdown for ${dateStr}.

Role scope: ${roleScope}

Data:
- Workflows (last 24h): ${data.workflowSummary.completed} completed, ${data.workflowSummary.failed} failed, ${data.workflowSummary.running} running, ${data.workflowSummary.pendingApproval} awaiting approval
- Signals: ${data.signalsSummary.critical} critical, ${data.signalsSummary.high} high, ${data.signalsSummary.medium} medium, ${data.signalsSummary.newToday} new today
- Pending Approvals: ${data.pendingApprovals.length} items
- Policy Decisions (last 24h): ${data.policyDecisionsSummary.total} total — ${data.policyDecisionsSummary.approved} approved, ${data.policyDecisionsSummary.rejected} rejected${data.policyDecisionsSummary.avgConfidence !== null ? `, avg confidence ${(data.policyDecisionsSummary.avgConfidence * 100).toFixed(0)}%` : ''}
- Suggested Priorities: ${data.suggestedPriorities.map((p) => p.action).join('; ')}

Format it as:
## Daily Briefing — [Date]
### At a Glance (key metrics)
### Action Required (approvals, critical items)
### Operations Summary (workflow status)
### Signal Intelligence (what's surfacing)
### Suggested Priorities (ranked list)
### Today's Focus

Keep it executive-grade: sharp, actionable, no fluff. Use tables for metrics where appropriate.`;

  try {
    const result = await services.ai.chatCompletion(
      [
        {
          role: 'system',
          content:
            'You are an executive briefing writer. Generate concise, high-signal daily digests in markdown format.',
        },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 1200 },
    );
    return result.content;
  } catch {
    return `## Daily Briefing — ${dateStr}

### At a Glance
| Metric | Value |
|--------|-------|
| Workflows Completed | ${data.workflowSummary.completed} |
| Workflows Failed | ${data.workflowSummary.failed} |
| Critical Signals | ${data.signalsSummary.critical} |
| Pending Approvals | ${data.pendingApprovals.length} |
| Policy Decisions (24h) | ${data.policyDecisionsSummary.total} (${data.policyDecisionsSummary.approved} ✓ / ${data.policyDecisionsSummary.rejected} ✗) |

### Proof Chain — Recent Policy Decisions
${data.policyDecisionsSummary.recent.length > 0 ? data.policyDecisionsSummary.recent.map((d) => `- **${d.decision.toUpperCase()}** \`${d.action}\`${d.product ? ` · ${d.product}` : ''}${d.resolvedMode ? ` · mode: ${d.resolvedMode}` : ''}${d.confidence !== null ? ` · conf ${(d.confidence * 100).toFixed(0)}%` : ''}${d.blockedReason ? ` — ${d.blockedReason}` : ''}`).join('\n') : '_No policy decisions in the last 24h._'}

### Action Required
${data.pendingApprovals.length > 0 ? data.pendingApprovals.map((a) => `- **${a.urgency.toUpperCase()}**: ${a.description}`).join('\n') : '_No pending approvals._'}

### Suggested Priorities
${data.suggestedPriorities.map((p) => `${p.rank}. **${p.action}** — ${p.reason}`).join('\n') || '_No immediate priorities identified._'}`;
  }
}

router.post(
  '/alloy/digest/generate',
  authMiddleware(),
  validateBody(
    bodyShape({
      deliveryChannels: z.unknown().optional(),
      digestDate: z.unknown().optional(),
      keyDecisions: z.unknown().optional(),
      metrics: z.unknown().optional(),
      pendingApprovals: z.unknown().optional(),
      roleScope: z.unknown().optional(),
      signalsSummary: z.unknown().optional(),
      suggestedPriorities: z.unknown().optional(),
      workflowSummary: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const {
        roleScope = 'executive',
        digestDate,
        deliveryChannels = ['in_app'],
      } = req.body as {
        roleScope?: string;
        digestDate?: string;
        deliveryChannels?: string[];
      };

      const date = digestDate ?? new Date().toISOString().slice(0, 10);
      const data = await gatherDigestData(roleScope);
      const markdown = await generateDigestMarkdown(data, roleScope, date);

      const id = `digest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        await pool.query(
          `INSERT INTO alloy_daily_digests (id, digest_date, role_scope, user_id, content, markdown_content, key_decisions, pending_approvals, workflow_summary, signals_summary, suggested_priorities, metrics, delivery_channels, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'delivered',NOW(),NOW())
         ON CONFLICT (digest_date, role_scope, user_id) DO UPDATE
         SET content=EXCLUDED.content, markdown_content=EXCLUDED.markdown_content, key_decisions=EXCLUDED.key_decisions,
             pending_approvals=EXCLUDED.pending_approvals, workflow_summary=EXCLUDED.workflow_summary,
             signals_summary=EXCLUDED.signals_summary, suggested_priorities=EXCLUDED.suggested_priorities,
             metrics=EXCLUDED.metrics, status='delivered', updated_at=NOW()`,
          [
            id,
            date,
            roleScope,
            req.user?.id ?? null,
            JSON.stringify(data),
            markdown,
            JSON.stringify(data.keyDecisions),
            JSON.stringify(data.pendingApprovals),
            JSON.stringify(data.workflowSummary),
            JSON.stringify(data.signalsSummary),
            JSON.stringify(data.suggestedPriorities),
            JSON.stringify(data.metrics),
            JSON.stringify(deliveryChannels),
          ],
        );
      } catch (dbErr) {
        logger.warn({ err: dbErr }, 'alloy-digest: conflict on upsert, fetching existing');
      }

      const deliveryOutcomes: Record<string, { sent: boolean; error?: string; sentAt?: string }> =
        {};

      if (deliveryChannels.includes('slack')) {
        const slackToken = process.env.SLACK_BOT_TOKEN;
        const slackChannel = process.env.ALLOY_DIGEST_SLACK_CHANNEL;
        if (!slackToken || !slackChannel) {
          deliveryOutcomes.slack = {
            sent: false,
            error: 'SLACK_BOT_TOKEN or ALLOY_DIGEST_SLACK_CHANNEL not configured',
          };
          logger.warn(
            'alloy-digest: Slack delivery requested but SLACK_BOT_TOKEN/ALLOY_DIGEST_SLACK_CHANNEL not set',
          );
        } else {
          try {
            const slackText = `*Alloy Daily Digest — ${date}*\n*Role: ${roleScope}*\n\n${markdown.slice(0, 2800)}${markdown.length > 2800 ? '\n\n_[digest truncated — view full version in app]_' : ''}`;
            const slackRes = await fetch('https://slack.com/api/chat.postMessage', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${slackToken}`,
              },
              body: JSON.stringify({ channel: slackChannel, text: slackText, mrkdwn: true }),
            });
            if (slackRes.ok) {
              deliveryOutcomes.slack = { sent: true, sentAt: new Date().toISOString() };
            } else {
              deliveryOutcomes.slack = { sent: false, error: `Slack API ${slackRes.status}` };
            }
          } catch (slackErr) {
            deliveryOutcomes.slack = { sent: false, error: String(slackErr) };
            logger.warn({ err: slackErr }, 'alloy-digest: Slack delivery failed');
          }
        }
      }

      if (deliveryChannels.includes('in_app') || deliveryChannels.length === 0) {
        deliveryOutcomes.in_app = { sent: true, sentAt: new Date().toISOString() };
      }

      try {
        await pool.query(
          `UPDATE alloy_daily_digests SET delivered_at = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(deliveryOutcomes), id],
        );
      } catch {}

      sendCreated(res, {
        id,
        digestDate: date,
        roleScope,
        markdownContent: markdown,
        data,
        deliveryChannels,
        deliveryOutcomes,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to generate digest');
    }
  },
);

router.get(
  '/alloy/digest/latest',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const roleScope = (req.query as Record<string, string>).roleScope ?? 'executive';
      const userId = req.user?.id ?? null;

      const result = await pool.query(
        `SELECT * FROM alloy_daily_digests WHERE role_scope = $1 AND (user_id = $2 OR user_id IS NULL) ORDER BY CASE WHEN user_id = $2 THEN 0 ELSE 1 END, digest_date DESC LIMIT 1`,
        [roleScope, userId],
      );

      if (!result.rows[0]) {
        const data = await gatherDigestData(roleScope);
        const date = new Date().toISOString().slice(0, 10);
        const markdown = await generateDigestMarkdown(data, roleScope, date);
        sendSuccess(res, {
          digestDate: date,
          roleScope,
          markdownContent: markdown,
          data,
          fresh: true,
        });
        return;
      }

      sendSuccess(res, result.rows[0]);
    } catch (err) {
      handleRouteError(res, err, 'Failed to get latest digest');
    }
  },
);

router.get(
  '/alloy/digest/history',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { roleScope = 'executive', limit: limitStr = '14' } = req.query as Record<
        string,
        string
      >;
      const limit = Math.min(parseInt(limitStr, 10), 90);
      const result = await pool.query(
        `SELECT id, digest_date, role_scope, status, workflow_summary, signals_summary, created_at
       FROM alloy_daily_digests WHERE role_scope = $1 ORDER BY digest_date DESC LIMIT $2`,
        [roleScope, limit],
      );
      sendSuccess(res, { digests: result.rows, total: result.rowCount });
    } catch (err) {
      handleRouteError(res, err, 'Failed to get digest history');
    }
  },
);

const digestConfigSchema = z.object({
  enabled: z.boolean(),
  deliveryHour: z.number().int().min(0).max(23),
  deliveryMinute: z.number().int().min(0).max(59),
  timezone: z.string().min(1).max(64).default('UTC'),
  includedDomains: z.array(z.string()).max(64),
  sections: z.record(z.string(), z.boolean()),
  digestFormat: z.enum(['concise', 'detailed']),
});

router.get('/alloy/digest/config', authMiddleware(), async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      sendBadRequest(res, 'Authentication required');
      return;
    }
    const rows = await db
      .select({ digestConfig: notificationPreferencesTable.digestConfig })
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, req.user.id))
      .limit(1);
    sendSuccess(res, { config: rows[0]?.digestConfig ?? null });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load digest config');
  }
});

router.put(
  '/alloy/digest/config',
  authMiddleware(),
  validateBody(digestConfigSchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.id) {
        sendBadRequest(res, 'Authentication required');
        return;
      }
      const config = req.body as z.infer<typeof digestConfigSchema>;
      await pool.query(
        `INSERT INTO notification_preferences (user_id, digest_config, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET digest_config = EXCLUDED.digest_config, updated_at = NOW()`,
        [req.user.id, JSON.stringify(config)],
      );
      sendSuccess(res, { config, savedAt: new Date().toISOString() });
    } catch (err) {
      handleRouteError(res, err, 'Failed to save digest config');
    }
  },
);

router.get('/alloy/digest/:id', authMiddleware(), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM alloy_daily_digests WHERE id = $1`, [
      req.params.id,
    ]);
    if (!result.rows[0]) {
      const res404 = res as Response;
      res404.status(404).json({ error: 'Digest not found' });
      return;
    }
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    handleRouteError(res, err, 'Failed to get digest');
  }
});

export async function generateAndStoreDigest(roleScope: string = 'executive'): Promise<string> {
  const date = new Date().toISOString().slice(0, 10);
  const data = await gatherDigestData(roleScope);
  const markdown = await generateDigestMarkdown(data, roleScope, date);

  const id = `digest-sched-${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO alloy_daily_digests (id, digest_date, role_scope, content, markdown_content, key_decisions, pending_approvals, workflow_summary, signals_summary, suggested_priorities, metrics, delivery_channels, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'["in_app"]','delivered',NOW(),NOW())
       ON CONFLICT (digest_date, role_scope, user_id) DO UPDATE
       SET markdown_content=EXCLUDED.markdown_content, status='delivered', updated_at=NOW()`,
      [
        id,
        date,
        roleScope,
        JSON.stringify(data),
        markdown,
        JSON.stringify(data.keyDecisions),
        JSON.stringify(data.pendingApprovals),
        JSON.stringify(data.workflowSummary),
        JSON.stringify(data.signalsSummary),
        JSON.stringify(data.suggestedPriorities),
        JSON.stringify(data.metrics),
      ],
    );
  } catch (err) {
    logger.warn({ err }, 'alloy-digest: scheduled generation conflict ignored');
  }

  return id;
}

export default router;
