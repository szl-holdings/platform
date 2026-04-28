import { serverTelemetry } from '@szl-holdings/observability';
import { db } from '@szl-holdings/db';
import { analyticsEventsTable, analyticsEventsColdTable } from '@szl-holdings/db/schema';
import { type Request, type Response, Router } from 'express';
import { and, desc, eq, gte, inArray, isNotNull, lte, sql, lt } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { analyticsEventSchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';

const analyticsRouter = Router();

const ALLOWED_EVENTS = new Set([
  'user_signed_up',
  'user_logged_in',
  'user_login_failed',
  'user_logged_out',
  'session_expired',
  'dashboard_viewed',
  'page_viewed',
  'search_executed',
  'filter_applied',
  'signal_viewed',
  'signal_dismissed',
  'signal_escalated',
  'alert_acknowledged',
  'alert_config_changed',
  'action_created',
  'action_approved',
  'action_rejected',
  'workflow_started',
  'workflow_completed',
  'workflow_failed',
  'approval_decision',
  'subscription_started',
  'subscription_upgraded',
  'subscription_downgraded',
  'subscription_cancelled',
  'payment_succeeded',
  'payment_failed',
  'invoice_generated',
  'trial_started',
  'trial_converted',
  'contact_form_submitted',
  'demo_requested',
  'demo_scheduled',
  'demo_completed',
  'ai_inference_called',
  'ai_recommendation_shown',
  'ai_recommendation_acted_on',
  'ai_provider_failure',
  'tour_started',
  'tour_completed',
  'tour_skipped',
  'tour_step_viewed',
  'checklist_item_completed',
  'checklist_dismissed',
  'checklist_viewed',
  'help_tip_opened',
  'changelog_viewed',
]);

const ALLOWED_PLATFORMS = new Set([
  'lyte',
  'aegis',
  'terra',
  'vessels',
  'carlota_jo',
  'admin',
  'api',
  'szl',
]);

/**
 * Returns org-scoping conditions for analytics queries.
 * - Admins / super_admins: unrestricted; may optionally filter by clientOrgId.
 * - All other authenticated roles: restricted to the org IDs attached to their session.
 * The clientOrgId supplied via query params is ONLY honoured for elevated users so that
 * regular callers cannot enumerate other tenants' data.
 */
function getOrgConditions(
  req: Request,
  clientOrgId?: string,
): ReturnType<typeof inArray | typeof eq | typeof sql>[] {
  const user = req.user;
  if (!user) return [sql`1 = 0`];
  const isElevated = user.roles.includes('admin') || user.roles.includes('super_admin');
  if (isElevated) {
    if (clientOrgId) return [eq(analyticsEventsTable.tenantId, clientOrgId)];
    return [];
  }
  const orgIds = user.orgs.map((o) => o.orgId).filter((id): id is number => id > 0);
  // Deny-all for authenticated non-admin users with no org memberships —
  // returning an empty array would grant them unscoped access to all tenant data.
  if (!orgIds.length) return [sql`1 = 0`];
  return [inArray(analyticsEventsTable.organizationId, orgIds)];
}

/** Same semantics as getOrgConditions but applied to the cold events table. */
function getOrgConditionsCold(
  req: Request,
): ReturnType<typeof inArray | typeof sql>[] {
  const user = req.user;
  if (!user) return [sql`1 = 0`];
  const isElevated = user.roles.includes('admin') || user.roles.includes('super_admin');
  if (isElevated) return [];
  const orgIds = user.orgs.map((o) => o.orgId).filter((id): id is number => id > 0);
  if (!orgIds.length) return [sql`1 = 0`];
  return [inArray(analyticsEventsColdTable.organizationId, orgIds)];
}

analyticsRouter.post(
  '/analytics/event',
  validateBody(analyticsEventSchema),
  (req: Request, res: Response) => {
    try {
      const { event, platform, timestamp, properties } = req.body;

      if (!ALLOWED_EVENTS.has(event)) {
        res.status(400).json({ error: 'unknown event type' });
        return;
      }

      const resolvedPlatform = platform && ALLOWED_PLATFORMS.has(platform) ? platform : 'unknown';

      const eventPayload = {
        type: event,
        metadata: {
          platform: resolvedPlatform,
          timestamp: timestamp ?? new Date().toISOString(),
          userId: (req as Request & { user?: { id?: number } }).user?.id,
          ...(properties && typeof properties === 'object' ? properties : {}),
        },
      };

      serverTelemetry.recordBusinessEvent(eventPayload);

      logger.debug({ event, platform: resolvedPlatform }, '[analytics] event recorded');

      res.status(202).json({ ok: true });
    } catch (err) {
      logger.warn({ err }, '[analytics] Failed to record event');
      res.status(500).json({ error: 'Failed to record event' });
    }
  },
);

analyticsRouter.get('/analytics/summary', (_req: Request, res: Response) => {
  try {
    const snapshot = serverTelemetry.getSnapshot();
    res.json({
      timestamp: new Date().toISOString(),
      businessEvents: snapshot.businessEvents,
      requestCount: snapshot.requestCount,
      errorRate: snapshot.errorRate,
      workflowCompletions: snapshot.workflowCompletions,
      jobFailures: snapshot.jobFailures,
    });
  } catch (err) {
    logger.warn({ err }, '[analytics] Failed to fetch summary');
    res.status(500).json({ error: 'Failed to fetch analytics summary' });
  }
});

// ---------------------------------------------------------------------------
// Time-series metrics endpoint
// GET /analytics/timeseries?metric=<name>&from=<iso>&to=<iso>&granularity=minute|hour|day&domain=<domain>&orgId=<id>
// ---------------------------------------------------------------------------

const timeseriesSchema = z.object({
  metric: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  granularity: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional().default('day'),
  domain: z.string().optional(),
  orgId: z.string().optional(),
  sourceApp: z.string().optional(),
});

analyticsRouter.get(
  '/analytics/timeseries',
  authMiddleware(),
  requireRole('ops', 'admin', 'viewer'),
  async (req: Request, res: Response) => {
    try {
      const parsed = timeseriesSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid query parameters' });
        return;
      }

      const { metric, from, to, granularity, domain, orgId, sourceApp } = parsed.data;

      const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to) : new Date();

      const conditions = [
        gte(analyticsEventsTable.occurredAt, fromDate),
        lte(analyticsEventsTable.occurredAt, toDate),
      ];

      if (metric) conditions.push(eq(analyticsEventsTable.eventName, metric));
      if (domain) conditions.push(eq(analyticsEventsTable.domain, domain));
      if (sourceApp) conditions.push(eq(analyticsEventsTable.sourceApp, sourceApp));
      conditions.push(...getOrgConditions(req, orgId));

      const truncFn: Record<string, string> = {
        minute: 'minute',
        hour: 'hour',
        day: 'day',
        week: 'week',
        month: 'month',
      };
      const trunc = truncFn[granularity] ?? 'day';

      const coldConditions = [
        gte(analyticsEventsColdTable.occurredAt, fromDate),
        lte(analyticsEventsColdTable.occurredAt, toDate),
      ];
      if (metric) coldConditions.push(eq(analyticsEventsColdTable.eventName, metric));
      if (domain) coldConditions.push(eq(analyticsEventsColdTable.domain, domain));
      if (sourceApp) coldConditions.push(eq(analyticsEventsColdTable.sourceApp, sourceApp));
      coldConditions.push(...getOrgConditionsCold(req));

      const [hotRows, coldRows] = await Promise.all([
        db
          .select({
            bucket: sql<string>`date_trunc(${trunc}, ${analyticsEventsTable.occurredAt})::text`,
            eventName: analyticsEventsTable.eventName,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(analyticsEventsTable)
          .where(and(...conditions))
          .groupBy(
            sql`date_trunc(${trunc}, ${analyticsEventsTable.occurredAt})`,
            analyticsEventsTable.eventName,
          ),
        db
          .select({
            bucket: sql<string>`date_trunc(${trunc}, ${analyticsEventsColdTable.occurredAt})::text`,
            eventName: analyticsEventsColdTable.eventName,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(analyticsEventsColdTable)
          .where(and(...coldConditions))
          .groupBy(
            sql`date_trunc(${trunc}, ${analyticsEventsColdTable.occurredAt})`,
            analyticsEventsColdTable.eventName,
          ),
      ]);

      // Merge hot and cold counts by (bucket, eventName), preserving chronological order
      const mergedMap = new Map<string, Map<string, number>>();
      for (const r of [...hotRows, ...coldRows]) {
        if (!mergedMap.has(r.bucket)) mergedMap.set(r.bucket, new Map());
        const bucketMap = mergedMap.get(r.bucket)!;
        bucketMap.set(r.eventName, (bucketMap.get(r.eventName) ?? 0) + r.count);
      }
      const rows = Array.from(mergedMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([bucket, events]) =>
          Array.from(events.entries()).map(([eventName, count]) => ({ bucket, eventName, count })),
        );

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        metric,
        domain,
        granularity,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        dataPoints: rows,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, '[analytics] timeseries query error');
      res.status(500).json({ error: 'timeseries query failed' });
    }
  },
);

// ---------------------------------------------------------------------------
// Live KPIs endpoint — powers real-time Command dashboard
// GET /analytics/kpis
// Returns DAU/WAU/MAU, latency percentiles, error rate, event counts
// ---------------------------------------------------------------------------

analyticsRouter.get(
  '/analytics/kpis',
  authMiddleware(),
  requireRole('ops', 'admin', 'viewer'),
  async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const orgConditions = getOrgConditions(req);

      const REVENUE_EVENTS = ['subscription_started', 'subscription_upgraded', 'subscription_downgraded', 'subscription_cancelled'];

      const [dauRow, wauRow, mauRow, eventsByDomain, recentEventClasses, revenueRows] = await Promise.all([
        db
          .select({ count: sql<number>`cast(count(distinct ${analyticsEventsTable.userId}) as int)` })
          .from(analyticsEventsTable)
          .where(and(gte(analyticsEventsTable.occurredAt, dayAgo), ...orgConditions)),
        db
          .select({ count: sql<number>`cast(count(distinct ${analyticsEventsTable.userId}) as int)` })
          .from(analyticsEventsTable)
          .where(and(gte(analyticsEventsTable.occurredAt, weekAgo), ...orgConditions)),
        db
          .select({ count: sql<number>`cast(count(distinct ${analyticsEventsTable.userId}) as int)` })
          .from(analyticsEventsTable)
          .where(and(gte(analyticsEventsTable.occurredAt, monthAgo), ...orgConditions)),
        db
          .select({
            domain: analyticsEventsTable.domain,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(analyticsEventsTable)
          .where(and(gte(analyticsEventsTable.occurredAt, dayAgo), ...orgConditions))
          .groupBy(analyticsEventsTable.domain)
          .orderBy(desc(sql`count(*)`))
          .limit(10),
        db
          .select({
            eventName: analyticsEventsTable.eventName,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(analyticsEventsTable)
          .where(and(gte(analyticsEventsTable.occurredAt, dayAgo), ...orgConditions))
          .groupBy(analyticsEventsTable.eventName)
          .orderBy(desc(sql`count(*)`))
          .limit(20),
        // Revenue event counts for the last 30 days (hot tier is sufficient since
        // subscription events are recent; cold tier adds nothing material here)
        db
          .select({
            eventName: analyticsEventsTable.eventName,
            count: sql<number>`cast(count(*) as int)`,
          })
          .from(analyticsEventsTable)
          .where(and(gte(analyticsEventsTable.occurredAt, monthAgo), ...orgConditions, inArray(analyticsEventsTable.eventName, REVENUE_EVENTS)))
          .groupBy(analyticsEventsTable.eventName),
      ]);

      const snapshot = serverTelemetry.getSnapshot();

      const byDomain: Record<string, number> = {};
      for (const row of eventsByDomain) byDomain[row.domain] = row.count;

      const featureAdoption: Record<string, number> = {};
      for (const row of recentEventClasses) featureAdoption[row.eventName] = row.count;

      const revenueByEvent: Record<string, number> = {};
      for (const row of revenueRows) revenueByEvent[row.eventName] = row.count;

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        timestamp: now.toISOString(),
        users: {
          dau: dauRow[0]?.count ?? 0,
          wau: wauRow[0]?.count ?? 0,
          mau: mauRow[0]?.count ?? 0,
        },
        api: {
          errorRate: snapshot.errorRate,
          p50Latency: snapshot.p50Latency,
          p95Latency: snapshot.p95Latency,
          p99Latency: snapshot.p99Latency,
          throughputPerHour: snapshot.throughputPerHour,
          requestCount: snapshot.requestCount,
        },
        errorBudget: {
          burnRate: snapshot.errorRate > 0 ? (snapshot.errorRate / 0.1) * 100 : 0,
          budget99_9: Math.max(0, 43.8 - (snapshot.errorRate / 100) * snapshot.uptimeSeconds / 60),
        },
        featureAdoption,
        byDomain,
        revenue: {
          subscriptionsStarted30d: revenueByEvent['subscription_started'] ?? 0,
          subscriptionsUpgraded30d: revenueByEvent['subscription_upgraded'] ?? 0,
          subscriptionsDowngraded30d: revenueByEvent['subscription_downgraded'] ?? 0,
          subscriptionsCancelled30d: revenueByEvent['subscription_cancelled'] ?? 0,
          netSubscriptionDelta30d:
            (revenueByEvent['subscription_started'] ?? 0) +
            (revenueByEvent['subscription_upgraded'] ?? 0) -
            (revenueByEvent['subscription_downgraded'] ?? 0) -
            (revenueByEvent['subscription_cancelled'] ?? 0),
        },
        jobs: {
          failures: snapshot.jobFailures,
          completions: snapshot.workflowCompletions,
        },
      });
    } catch (err) {
      logger.error({ err }, '[analytics] kpis error');
      res.status(500).json({ error: 'kpis query failed' });
    }
  },
);

// ---------------------------------------------------------------------------
// Funnel analysis endpoint
// POST /analytics/funnel
// Body: { steps: string[], from: string, to: string, domain?: string, orgId?: string }
// Returns drop-off counts for each funnel step
// ---------------------------------------------------------------------------

const funnelSchema = z.object({
  steps: z.array(z.string().min(1)).min(2).max(10),
  from: z.string().optional(),
  to: z.string().optional(),
  domain: z.string().optional(),
  orgId: z.string().optional(),
});

analyticsRouter.post(
  '/analytics/funnel',
  authMiddleware(),
  requireRole('ops', 'admin', 'viewer'),
  validateBody(funnelSchema),
  async (req: Request, res: Response) => {
    try {
      const { steps, from, to, domain, orgId } = req.body as z.infer<typeof funnelSchema>;

      const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to) : new Date();

      const baseConditions = [
        gte(analyticsEventsTable.occurredAt, fromDate),
        lte(analyticsEventsTable.occurredAt, toDate),
      ];
      if (domain) baseConditions.push(eq(analyticsEventsTable.domain, domain));
      baseConditions.push(...getOrgConditions(req, orgId));

      // Build cold conditions for the funnel (same date window, same org scope, any step event)
      const coldFunnelConditions = [
        gte(analyticsEventsColdTable.occurredAt, fromDate),
        lte(analyticsEventsColdTable.occurredAt, toDate),
      ];
      if (domain) coldFunnelConditions.push(eq(analyticsEventsColdTable.domain, domain));
      coldFunnelConditions.push(...getOrgConditionsCold(req));

      // Fetch first occurrence of each step per user across hot + cold tiers.
      // Using MIN so each user has at most one timestamp per step — this
      // lets us enforce strict temporal ordering in application code without
      // resorting to complex dynamic CTEs.
      const [hotOccurrences, coldOccurrences] = await Promise.all([
        db.select({
            userId: analyticsEventsTable.userId,
            eventName: analyticsEventsTable.eventName,
            firstTs: sql<string>`min(${analyticsEventsTable.occurredAt})::text`,
          }).from(analyticsEventsTable)
          .where(and(...baseConditions, isNotNull(analyticsEventsTable.userId), inArray(analyticsEventsTable.eventName, steps)))
          .groupBy(analyticsEventsTable.userId, analyticsEventsTable.eventName),
        db.select({
            userId: analyticsEventsColdTable.userId,
            eventName: analyticsEventsColdTable.eventName,
            firstTs: sql<string>`min(${analyticsEventsColdTable.occurredAt})::text`,
          }).from(analyticsEventsColdTable)
          .where(and(...coldFunnelConditions, isNotNull(analyticsEventsColdTable.userId), inArray(analyticsEventsColdTable.eventName, steps)))
          .groupBy(analyticsEventsColdTable.userId, analyticsEventsColdTable.eventName),
      ]);

      // Merge hot + cold: for each (userId, eventName), keep the earliest timestamp
      const firstOccurrences: Array<{ userId: string | null; eventName: string; firstTs: string }> = [];
      const mergedFunnelMap = new Map<string, { userId: string | null; eventName: string; firstTs: string }>();
      for (const r of [...hotOccurrences, ...coldOccurrences]) {
        const key = `${r.userId}||${r.eventName}`;
        const ex = mergedFunnelMap.get(key);
        if (!ex || (r.firstTs && r.firstTs < ex.firstTs)) {
          mergedFunnelMap.set(key, r as { userId: string | null; eventName: string; firstTs: string });
        }
      }
      firstOccurrences.push(...mergedFunnelMap.values());

      // Build a per-user map of { eventName -> firstTs }
      const userMap = new Map<string, Map<string, string>>();
      for (const row of firstOccurrences) {
        if (!row.userId) continue;
        if (!userMap.has(row.userId)) userMap.set(row.userId, new Map());
        userMap.get(row.userId)!.set(row.eventName, row.firstTs);
      }

      // For each step i, count users who completed all steps 0..i in order.
      // Step i is qualified iff the user has a timestamp for every step 0..i
      // and each timestamp is >= the previous step's timestamp.
      const orderedCounts: number[] = steps.map((_, i) => {
        let count = 0;
        for (const [, eventMap] of userMap) {
          let prevTs: string | null = null;
          let qualified = true;
          for (let j = 0; j <= i; j++) {
            const ts = eventMap.get(steps[j] as string);
            if (ts == null) { qualified = false; break; }
            if (prevTs !== null && ts < prevTs) { qualified = false; break; }
            prevTs = ts;
          }
          if (qualified) count++;
        }
        return count;
      });

      const funnelSteps = orderedCounts.map((count, i) => {
        const prevCount = i === 0 ? count : (orderedCounts[i - 1] ?? 0);
        const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 0;
        const dropOff = i === 0 ? 0 : prevCount - count;
        const dropOffRate = prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0;
        return {
          step: steps[i],
          count,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          dropOff,
          dropOffRate: parseFloat(dropOffRate.toFixed(2)),
        };
      });

      const overallConversion =
        orderedCounts[0] && orderedCounts[0] > 0
          ? ((orderedCounts[orderedCounts.length - 1] ?? 0) / orderedCounts[0]) * 100
          : 0;

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        domain,
        steps: funnelSteps,
        overallConversionRate: parseFloat(overallConversion.toFixed(2)),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, '[analytics] funnel error');
      res.status(500).json({ error: 'funnel analysis failed' });
    }
  },
);

// ---------------------------------------------------------------------------
// Cohort retention endpoint
// GET /analytics/cohort?event=<signup_event>&from=<iso>&to=<iso>&periods=<number>&domain=<domain>
// Returns week-over-week retention data bucketed by cohort
// ---------------------------------------------------------------------------

const cohortSchema = z.object({
  event: z.string().optional().default('user_signed_up'),
  returnEvent: z.string().optional().default('user_logged_in'),
  from: z.string().optional(),
  to: z.string().optional(),
  periods: z.coerce.number().int().min(1).max(12).optional().default(8),
  domain: z.string().optional(),
  orgId: z.string().optional(),
});

analyticsRouter.get(
  '/analytics/cohort',
  authMiddleware(),
  requireRole('ops', 'admin', 'viewer'),
  async (req: Request, res: Response) => {
    try {
      const parsed = cohortSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid query parameters' });
        return;
      }

      const { event, returnEvent, from, to, periods, domain, orgId } = parsed.data;

      const fromDate = from ? new Date(from) : new Date(Date.now() - periods * 7 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to) : new Date();

      const baseConditions = [
        gte(analyticsEventsTable.occurredAt, fromDate),
        lte(analyticsEventsTable.occurredAt, toDate),
        isNotNull(analyticsEventsTable.userId),
      ];
      if (domain) baseConditions.push(eq(analyticsEventsTable.domain, domain));
      baseConditions.push(...getOrgConditions(req, orgId));

      const coldBase = [
        gte(analyticsEventsColdTable.occurredAt, fromDate),
        lte(analyticsEventsColdTable.occurredAt, toDate),
        isNotNull(analyticsEventsColdTable.userId),
      ];
      if (domain) coldBase.push(eq(analyticsEventsColdTable.domain, domain));
      coldBase.push(...getOrgConditionsCold(req));

      // Fetch distinct (cohortWeek, userId) and (returnWeek, userId) pairs from both hot
      // and cold tiers. Combining both tables ensures cohort analysis covers dates beyond
      // the hot-tier retention window, so long-term retention remains accurate.
      const [hotSignup, coldSignup, hotReturn, coldReturn] = await Promise.all([
        db.select({
            cohortWeek: sql<string>`date_trunc('week', ${analyticsEventsTable.occurredAt})::text`,
            userId: analyticsEventsTable.userId,
          }).from(analyticsEventsTable)
          .where(and(...baseConditions, eq(analyticsEventsTable.eventName, event)))
          .groupBy(sql`date_trunc('week', ${analyticsEventsTable.occurredAt})`, analyticsEventsTable.userId),
        db.select({
            cohortWeek: sql<string>`date_trunc('week', ${analyticsEventsColdTable.occurredAt})::text`,
            userId: analyticsEventsColdTable.userId,
          }).from(analyticsEventsColdTable)
          .where(and(...coldBase, eq(analyticsEventsColdTable.eventName, event)))
          .groupBy(sql`date_trunc('week', ${analyticsEventsColdTable.occurredAt})`, analyticsEventsColdTable.userId),
        db.select({
            returnWeek: sql<string>`date_trunc('week', ${analyticsEventsTable.occurredAt})::text`,
            userId: analyticsEventsTable.userId,
          }).from(analyticsEventsTable)
          .where(and(...baseConditions, eq(analyticsEventsTable.eventName, returnEvent)))
          .groupBy(sql`date_trunc('week', ${analyticsEventsTable.occurredAt})`, analyticsEventsTable.userId),
        db.select({
            returnWeek: sql<string>`date_trunc('week', ${analyticsEventsColdTable.occurredAt})::text`,
            userId: analyticsEventsColdTable.userId,
          }).from(analyticsEventsColdTable)
          .where(and(...coldBase, eq(analyticsEventsColdTable.eventName, returnEvent)))
          .groupBy(sql`date_trunc('week', ${analyticsEventsColdTable.occurredAt})`, analyticsEventsColdTable.userId),
      ]);

      const signupUsers = [...hotSignup, ...coldSignup] as Array<{ cohortWeek: string; userId: string | null }>;
      const returnUsers = [...hotReturn, ...coldReturn] as Array<{ returnWeek: string; userId: string | null }>;

      // Build lookup structures
      const cohortMap = new Map<string, Set<string>>();
      for (const row of signupUsers) {
        if (!row.userId) continue;
        if (!cohortMap.has(row.cohortWeek)) cohortMap.set(row.cohortWeek, new Set());
        cohortMap.get(row.cohortWeek)!.add(row.userId);
      }
      const returnMap = new Map<string, Set<string>>();
      for (const row of returnUsers) {
        if (!row.userId) continue;
        if (!returnMap.has(row.returnWeek)) returnMap.set(row.returnWeek, new Set());
        returnMap.get(row.returnWeek)!.add(row.userId);
      }

      const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
      const returnWeeks = Array.from(returnMap.keys()).sort();
      const cohortWeeks = Array.from(cohortMap.keys()).sort();

      const cohorts = cohortWeeks.map((cohortWeek) => {
        const cohortUsers = cohortMap.get(cohortWeek)!;
        const cohortSize = cohortUsers.size;
        const matrix: Array<{ offset: number; returnWeek: string; retained: number; retentionRate: number }> = [];

        for (const returnWeek of returnWeeks) {
          if (returnWeek < cohortWeek) continue;
          const offset = Math.round(
            (new Date(returnWeek).getTime() - new Date(cohortWeek).getTime()) / MS_PER_WEEK,
          );
          if (offset > periods) continue;
          const returnedUsers = returnMap.get(returnWeek) ?? new Set();
          let retained = 0;
          for (const uid of returnedUsers) {
            if (cohortUsers.has(uid)) retained++;
          }
          matrix.push({
            offset,
            returnWeek,
            retained,
            retentionRate: cohortSize > 0 ? parseFloat(((retained / cohortSize) * 100).toFixed(2)) : 0,
          });
        }

        return { cohortWeek, cohortSize, periods: matrix };
      });

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        signupEvent: event,
        returnEvent,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        cohorts,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, '[analytics] cohort error');
      res.status(500).json({ error: 'cohort analysis failed' });
    }
  },
);

// ---------------------------------------------------------------------------
// Top-N breakdown endpoint
// GET /analytics/topn?by=domain|eventName|sourceApp&from=<iso>&to=<iso>&limit=<n>&domain=<domain>
// ---------------------------------------------------------------------------

const topNSchema = z.object({
  by: z.enum(['domain', 'eventName', 'sourceApp']).optional().default('eventName'),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  domain: z.string().optional(),
  orgId: z.string().optional(),
});

analyticsRouter.get(
  '/analytics/topn',
  authMiddleware(),
  requireRole('ops', 'admin', 'viewer'),
  async (req: Request, res: Response) => {
    try {
      const parsed = topNSchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid query parameters' });
        return;
      }

      const { by, from, to, limit, domain, orgId } = parsed.data;

      const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to) : new Date();

      const conditions = [
        gte(analyticsEventsTable.occurredAt, fromDate),
        lte(analyticsEventsTable.occurredAt, toDate),
      ];
      if (domain) conditions.push(eq(analyticsEventsTable.domain, domain));
      conditions.push(...getOrgConditions(req, orgId));

      const coldConditionsTopN = [
        gte(analyticsEventsColdTable.occurredAt, fromDate),
        lte(analyticsEventsColdTable.occurredAt, toDate),
      ];
      if (domain) coldConditionsTopN.push(eq(analyticsEventsColdTable.domain, domain));
      coldConditionsTopN.push(...getOrgConditionsCold(req));

      const coldGroupCol =
        by === 'domain'
          ? analyticsEventsColdTable.domain
          : by === 'sourceApp'
            ? analyticsEventsColdTable.sourceApp
            : analyticsEventsColdTable.eventName;

      const hotGroupCol =
        by === 'domain'
          ? analyticsEventsTable.domain
          : by === 'sourceApp'
            ? analyticsEventsTable.sourceApp
            : analyticsEventsTable.eventName;

      const [hotRows, coldRows] = await Promise.all([
        db.select({ key: hotGroupCol, count: sql<number>`cast(count(*) as int)` })
          .from(analyticsEventsTable).where(and(...conditions))
          .groupBy(hotGroupCol).orderBy(desc(sql`count(*)`)).limit(limit),
        db.select({ key: coldGroupCol, count: sql<number>`cast(count(*) as int)` })
          .from(analyticsEventsColdTable).where(and(...coldConditionsTopN))
          .groupBy(coldGroupCol).orderBy(desc(sql`count(*)`)).limit(limit),
      ]);

      // Merge hot + cold by key
      const keyMap = new Map<string, number>();
      for (const r of [...hotRows, ...coldRows]) {
        keyMap.set(r.key, (keyMap.get(r.key) ?? 0) + r.count);
      }
      const merged = Array.from(keyMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit);

      const total = merged.reduce((s, [, c]) => s + c, 0);
      const items = merged.map(([key, count]) => ({
        key,
        count,
        share: total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
      }));

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        by,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        items,
        total,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, '[analytics] topn error');
      res.status(500).json({ error: 'topn query failed' });
    }
  },
);

// ---------------------------------------------------------------------------
// Event replay — reprocess historical events through new grouping rules
// POST /analytics/replay
// Body: { from: string, to: string, domain?: string, groupBy: string }
// ---------------------------------------------------------------------------

const replaySchema = z.object({
  from: z.string(),
  to: z.string(),
  domain: z.string().optional(),
  groupBy: z.enum(['domain', 'eventName', 'sourceApp', 'hour', 'day']).optional().default('day'),
  limit: z.coerce.number().int().min(1).max(5000).optional().default(1000),
});

analyticsRouter.post(
  '/analytics/replay',
  authMiddleware(),
  requireRole('admin'),
  validateBody(replaySchema),
  async (req: Request, res: Response) => {
    try {
      const { from, to, domain, groupBy, limit } = req.body as z.infer<typeof replaySchema>;
      const fromDate = new Date(from);
      const toDate = new Date(to);

      const hotConditions = [
        gte(analyticsEventsTable.occurredAt, fromDate),
        lte(analyticsEventsTable.occurredAt, toDate),
      ];
      if (domain) hotConditions.push(eq(analyticsEventsTable.domain, domain));
      hotConditions.push(...getOrgConditions(req));

      const coldConditions = [
        gte(analyticsEventsColdTable.occurredAt, fromDate),
        lte(analyticsEventsColdTable.occurredAt, toDate),
      ];
      if (domain) coldConditions.push(eq(analyticsEventsColdTable.domain, domain));
      coldConditions.push(...getOrgConditionsCold(req));

      // Helper: merge hot + cold counts by key
      const mergeRows = (
        hotRows: Array<{ key: string; count: number }>,
        coldRows: Array<{ key: string; count: number }>,
      ): Array<{ key: string; count: number }> => {
        const merged = new Map<string, number>();
        for (const r of [...hotRows, ...coldRows]) {
          merged.set(r.key, (merged.get(r.key) ?? 0) + r.count);
        }
        return Array.from(merged.entries())
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
      };

      let rows: Array<{ key: string; count: number }> = [];

      if (groupBy === 'domain') {
        const [hotRaw, coldRaw] = await Promise.all([
          db.select({ key: analyticsEventsTable.domain, count: sql<number>`cast(count(*) as int)` })
            .from(analyticsEventsTable).where(and(...hotConditions)).groupBy(analyticsEventsTable.domain),
          db.select({ key: analyticsEventsColdTable.domain, count: sql<number>`cast(count(*) as int)` })
            .from(analyticsEventsColdTable).where(and(...coldConditions)).groupBy(analyticsEventsColdTable.domain),
        ]);
        rows = mergeRows(hotRaw, coldRaw);
      } else if (groupBy === 'eventName') {
        const [hotRaw, coldRaw] = await Promise.all([
          db.select({ key: analyticsEventsTable.eventName, count: sql<number>`cast(count(*) as int)` })
            .from(analyticsEventsTable).where(and(...hotConditions)).groupBy(analyticsEventsTable.eventName),
          db.select({ key: analyticsEventsColdTable.eventName, count: sql<number>`cast(count(*) as int)` })
            .from(analyticsEventsColdTable).where(and(...coldConditions)).groupBy(analyticsEventsColdTable.eventName),
        ]);
        rows = mergeRows(hotRaw, coldRaw);
      } else if (groupBy === 'sourceApp') {
        const [hotRaw, coldRaw] = await Promise.all([
          db.select({ key: analyticsEventsTable.sourceApp, count: sql<number>`cast(count(*) as int)` })
            .from(analyticsEventsTable).where(and(...hotConditions)).groupBy(analyticsEventsTable.sourceApp),
          db.select({ key: analyticsEventsColdTable.sourceApp, count: sql<number>`cast(count(*) as int)` })
            .from(analyticsEventsColdTable).where(and(...coldConditions)).groupBy(analyticsEventsColdTable.sourceApp),
        ]);
        rows = mergeRows(hotRaw, coldRaw);
      } else {
        const trunc = groupBy === 'hour' ? 'hour' : 'day';
        const [hotRaw, coldRaw] = await Promise.all([
          db.select({
            key: sql<string>`date_trunc(${trunc}, ${analyticsEventsTable.occurredAt})::text`,
            count: sql<number>`cast(count(*) as int)`,
          }).from(analyticsEventsTable).where(and(...hotConditions))
            .groupBy(sql`date_trunc(${trunc}, ${analyticsEventsTable.occurredAt})`)
            .orderBy(sql`date_trunc(${trunc}, ${analyticsEventsTable.occurredAt})`),
          db.select({
            key: sql<string>`date_trunc(${trunc}, ${analyticsEventsColdTable.occurredAt})::text`,
            count: sql<number>`cast(count(*) as int)`,
          }).from(analyticsEventsColdTable).where(and(...coldConditions))
            .groupBy(sql`date_trunc(${trunc}, ${analyticsEventsColdTable.occurredAt})`)
            .orderBy(sql`date_trunc(${trunc}, ${analyticsEventsColdTable.occurredAt})`),
        ]);
        // For time-series, merge chronologically
        const merged = new Map<string, number>();
        for (const r of [...hotRaw, ...coldRaw]) {
          merged.set(r.key, (merged.get(r.key) ?? 0) + r.count);
        }
        rows = Array.from(merged.entries())
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => a.key.localeCompare(b.key))
          .slice(0, limit);
      }

      logger.info({ from, to, domain, groupBy, rows: rows.length }, '[analytics] replay completed');

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        domain,
        groupBy,
        rows,
        replayedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, '[analytics] replay error');
      res.status(500).json({ error: 'replay failed' });
    }
  },
);

// ---------------------------------------------------------------------------
// Data retention status — shows cold storage archive stats
// GET /analytics/retention-status
// ---------------------------------------------------------------------------

analyticsRouter.get(
  '/analytics/retention-status',
  authMiddleware(),
  requireRole('admin'),
  async (_req: Request, res: Response) => {
    try {
      const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS ?? '90', 10);
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const [hotRow, pendingColdRow, archivedColdRow, oldestHotRow, oldestColdRow] = await Promise.all([
        db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(analyticsEventsTable)
          .where(gte(analyticsEventsTable.occurredAt, cutoff)),
        db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(analyticsEventsTable)
          .where(lt(analyticsEventsTable.occurredAt, cutoff)),
        db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(analyticsEventsColdTable),
        db
          .select({ oldest: sql<string>`min(${analyticsEventsTable.occurredAt})::text` })
          .from(analyticsEventsTable),
        db
          .select({ oldest: sql<string>`min(${analyticsEventsColdTable.occurredAt})::text` })
          .from(analyticsEventsColdTable),
      ]);

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        retentionDays,
        cutoff: cutoff.toISOString(),
        hotEvents: hotRow[0]?.count ?? 0,
        pendingArchiveEvents: pendingColdRow[0]?.count ?? 0,
        coldArchivedEvents: archivedColdRow[0]?.count ?? 0,
        oldestHotEvent: oldestHotRow[0]?.oldest ?? null,
        oldestColdEvent: oldestColdRow[0]?.oldest ?? null,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, '[analytics] retention-status error');
      res.status(500).json({ error: 'retention status failed' });
    }
  },
);

export default analyticsRouter;
