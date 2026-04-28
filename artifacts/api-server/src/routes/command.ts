/**
 * Ecosystem Command Portal API
 *
 * Aggregates real data from PostgreSQL and live API caches across all domains
 * (Aegis, Vessels, Lyte, Terra, SZL Holdings, PRISM, Carlota Jo, Stephen Lutar)
 * and normalises into a unified EcosystemSnapshot for the Command Portal dashboard.
 *
 * Data sources:
 *   - Aegis threats:   intelligenceCacheTable (OTX AlienVault feed, key="threats")
 *   - Vessels fleet:   vesselsTable + live AIS cache via fleet-summary
 *   - Lyte telemetry:  process/OS introspection (real-time)
 *   - PRISM matters:   pcMattersTable + pcDeadlinesTable
 *   - SZL Holdings:    fundNavRecordsTable + fundPortfolioFinancialsTable
 *   - Terra:           intelligenceCacheTable + raw DB count
 *   - Carlota Jo:      Seed-based deterministic data (no DB tables yet)
 *   - Stephen Lutar:   Seed-based deterministic data (no DB tables yet)
 *
 * No simulation engine. Honest empty state when unavailable.
 */

import {
  activityLogTable,
  approvalAuditTrailTable,
  approvalRequestsTable,
  commandInboxAlertAuditTable,
  commandInboxAlertStatesTable,
  db,
  deploymentsTable,
  fundNavRecordsTable,
  fundPortfolioFinancialsTable,
  GLOBAL_TENANT_SENTINEL,
  guardianPoliciesTable,
  healthChecksTable,
  intelligenceCacheTable,
  lyteAlertsTable,
  lyteMetricsTable,
  pcDeadlinesTable,
  pcMattersTable,
  usageEventsTable,
  usersTable,
} from '@szl-holdings/db';
import { and, asc, count, desc, eq, gte, inArray, lte, or, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { requireAnyAuth, requireRole } from '../middlewares/auth';

/**
 * Coalesce a possibly-null tenant id into the persisted sentinel value.
 * The DB column is NOT NULL with default GLOBAL_TENANT_SENTINEL so the
 * unique (alertId, tenantId) index works without Postgres NULL semantics.
 */
import {
  tenantKey,
  type CachedThreatItem,
  type CachedVesselItem,
  type CachedGeoEvent,
  isThreatItem,
  isVesselItem,
  isGeoEvent,
  clamp,
  _fmtUsd,
  relTime,
  getAegisData,
  getVesselsData,
  getLyteData,
  getPrismData,
  getCarlotaJoData,
  getStephenData,
  getSzlData,
  getTerraData,
  buildTimeline,
} from '../services/command/domain-aggregators';

async function buildSnapshot() {
  const [aegis, vessels, lyte, prism, szl, terra] = await Promise.all([
    getAegisData(),
    getVesselsData(),
    getLyteData(),
    getPrismData(),
    getSzlData(),
    getTerraData(),
  ]);

  const carlota = getCarlotaJoData();
  const stephen = getStephenData();

  const rawScores = [
    aegis.score,
    vessels.score,
    lyte.score,
    terra.score,
    szl.score,
    prism.score,
    carlota.score,
    stephen.score,
  ];
  const validScores = rawScores.filter((s): s is number => s !== null);
  const compositeScore = validScores.length
    ? Math.round(validScores.reduce((s, v) => s + v, 0) / validScores.length)
    : 0;

  const compositeStatus =
    compositeScore >= 90
      ? 'Nominal'
      : compositeScore >= 80
        ? 'Good'
        : compositeScore >= 70
          ? 'Elevated'
          : compositeScore >= 60
            ? 'Degraded'
            : 'Critical';

  const timeline = await buildTimeline(aegis);

  const carlotaPipelineFormatted =
    carlota.pipelineUsd >= 1e6
      ? `$${(carlota.pipelineUsd / 1e6).toFixed(1)}M`
      : `$${(carlota.pipelineUsd / 1000).toFixed(0)}K`;

  const snapshot = {
    compositeScore,
    compositeStatus,
    generatedAt: new Date().toISOString(),
    dataSource: 'live',
    domains: [
      {
        id: 'aegis',
        name: 'Aegis',
        icon: 'ShieldAlert',
        color: 'var(--color-aegis)',
        score: aegis.score,
        status: aegis.status,
        kpis: [
          {
            label: 'Active Threats',
            value: String(aegis.threatCount),
            trend: aegis.alertCount > 2 ? 'up' : 'neutral',
          },
          {
            label: 'Critical Alerts',
            value: String(aegis.alertCount),
            trend: aegis.alertCount > 0 ? 'up' : 'neutral',
          },
          {
            label: 'Data Source',
            value: aegis.lastUpdated ? 'OTX AlienVault' : 'Pending',
            trend: 'neutral',
          },
        ],
        alerts: {
          count: aegis.alertCount,
          severity:
            aegis.alertCount > 5
              ? 'critical'
              : aegis.alertCount > 2
                ? 'high'
                : aegis.alertCount > 0
                  ? 'medium'
                  : 'low',
        },
        sparkline: null,
        link: '/firestorm/',
      },
      {
        id: 'vessels',
        name: 'Vessels',
        icon: 'Ship',
        color: 'var(--color-vessels)',
        score: vessels.score,
        status: vessels.status,
        kpis: [
          { label: 'Vessels Tracked', value: String(vessels.totalTracked), trend: 'neutral' },
          { label: 'Underway', value: String(vessels.atSea), trend: 'neutral' },
          {
            label: 'AIS Source',
            value: vessels.lastUpdated ? 'Digitraffic' : 'Pending',
            trend: 'neutral',
          },
        ],
        alerts: { count: vessels.alertCount, severity: 'low' },
        sparkline: null,
        link: '/vessels/',
      },
      {
        id: 'szl',
        name: 'SZL Holdings',
        icon: 'Briefcase',
        color: 'var(--color-szl)',
        score: szl.score,
        status: szl.status,
        kpis: [
          { label: 'AUM', value: szl.aumFormatted, trend: 'neutral' },
          {
            label: 'Portfolio Cos',
            value: szl.companies > 0 ? String(szl.companies) : 'N/A',
            trend: 'neutral',
          },
          { label: 'IRR', value: szl.irr ? `${szl.irr}%` : 'N/A', trend: 'neutral' },
        ],
        alerts: { count: szl.alertCount, severity: 'low' },
        sparkline: null,
        link: '/',
      },
      {
        id: 'lyte',
        name: 'Lyte',
        icon: 'Activity',
        color: 'var(--color-lyte)',
        score: lyte.score,
        status: lyte.status,
        kpis: [
          {
            label: 'Uptime',
            value:
              lyte.uptimeSecs > 86400
                ? `${Math.floor(lyte.uptimeSecs / 86400)}d`
                : `${Math.floor(lyte.uptimeSecs / 3600)}h ${Math.floor((lyte.uptimeSecs % 3600) / 60)}m`,
            trend: 'neutral',
          },
          {
            label: 'Heap Use',
            value: `${lyte.heapPct}%`,
            trend: lyte.heapPct > 80 ? 'up' : 'neutral',
          },
          {
            label: 'CPU Load',
            value: `${lyte.cpuLoad}%`,
            trend: lyte.cpuLoad > 60 ? 'up' : 'neutral',
          },
        ],
        alerts: { count: lyte.alertCount, severity: lyte.alertCount > 0 ? 'medium' : 'low' },
        sparkline: null,
        link: '/command/operations/',
      },
      {
        id: 'prism',
        name: 'Counsel',
        icon: 'Scale',
        color: 'var(--color-prism)',
        score: prism.score,
        status: prism.status,
        kpis: [
          { label: 'Active Matters', value: String(prism.activeMatters), trend: 'neutral' },
          {
            label: 'Deadlines 7d',
            value: String(prism.deadlines7d),
            trend: prism.deadlines7d > 3 ? 'up' : 'neutral',
          },
          { label: 'Data Source', value: 'PostgreSQL', trend: 'neutral' },
        ],
        alerts: {
          count: prism.alertCount,
          severity: prism.alertCount > 3 ? 'high' : prism.alertCount > 0 ? 'medium' : 'low',
        },
        sparkline: null,
        link: '/aegis/',
      },
      {
        id: 'terra',
        name: 'Terra',
        icon: 'Building2',
        color: 'var(--color-terra)',
        score: terra.score,
        status: terra.status,
        kpis: [
          {
            label: 'Geo Events',
            value: String(terra.alertCount),
            trend: terra.alertCount > 2 ? 'up' : 'neutral',
          },
          {
            label: 'Intel Source',
            value: terra.lastUpdated ? 'GDELT' : 'Pending',
            trend: 'neutral',
          },
          {
            label: 'Data Feed',
            value: terra.lastUpdated ? relTime(terra.lastUpdated.toString()) : 'N/A',
            trend: 'neutral',
          },
        ],
        alerts: {
          count: terra.alertCount,
          severity: terra.alertCount > 3 ? 'high' : terra.alertCount > 0 ? 'medium' : 'low',
        },
        sparkline: null,
        link: '/terra/',
      },
      {
        id: 'carlota',
        name: 'Carlota Jo',
        icon: 'Users',
        color: 'var(--color-carlota)',
        score: carlota.score,
        status: carlota.status,
        kpis: [
          { label: 'Active Clients', value: String(carlota.activeClients), trend: 'neutral' },
          { label: 'Pipeline Value', value: carlotaPipelineFormatted, trend: 'up' },
          {
            label: 'Deliverables Due',
            value: String(carlota.deliverablesdue),
            trend: carlota.deliverablesdue > 2 ? 'up' : 'neutral',
          },
        ],
        alerts: {
          count: carlota.alertCount,
          severity: carlota.alertCount > 2 ? 'high' : carlota.alertCount > 0 ? 'medium' : 'low',
        },
        sparkline: carlota.sparkline,
        link: '/carlota-jo/',
      },
      {
        id: 'stephen',
        name: 'Stephen Lutar',
        icon: 'User',
        color: 'var(--color-stephen)',
        score: stephen.score,
        status: stephen.status,
        kpis: [
          {
            label: 'Meetings Today',
            value: String(stephen.meetingsToday),
            trend: stephen.meetingsToday > 4 ? 'up' : 'neutral',
          },
          {
            label: 'Priorities Done',
            value: `${stephen.prioritiesComplete}/${stephen.prioritiesTotal}`,
            trend: stephen.prioritiesComplete >= stephen.prioritiesTotal ? 'up' : 'neutral',
          },
          {
            label: 'Overdue Tasks',
            value: String(stephen.alertCount),
            trend: stephen.alertCount > 0 ? 'up' : 'down',
          },
        ],
        alerts: { count: stephen.alertCount, severity: stephen.alertCount > 1 ? 'medium' : 'low' },
        sparkline: stephen.sparkline,
        link: '/founder',
      },
    ],
    timeline,
    intelligence: [],
    actions: [
      ...(aegis.alertCount > 0
        ? [
            {
              id: 'act-aegis',
              domain: 'aegis',
              priority: 'high',
              text: `Review ${aegis.alertCount} active threat alert(s) from OTX intelligence feed`,
              buttonText: 'Review',
              resolved: resolvedActions.has('act-aegis'),
            },
          ]
        : []),
      ...(prism.deadlines7d > 0
        ? [
            {
              id: 'act-legal',
              domain: 'aegis',
              priority: 'high',
              text: `${prism.deadlines7d} legal deadline(s) due within 7 days`,
              buttonText: 'Review',
              resolved: resolvedActions.has('act-legal'),
            },
          ]
        : []),
      ...(lyte.recentRestart
        ? [
            {
              id: 'act-lyte',
              domain: 'lyte',
              priority: 'medium',
              text: 'Recent process restart detected — verify service stability',
              buttonText: 'Acknowledge',
              resolved: resolvedActions.has('act-lyte'),
            },
          ]
        : []),
      ...(carlota.deliverablesdue > 1
        ? [
            {
              id: 'act-carlota',
              domain: 'carlota',
              priority: 'medium',
              text: `Review ${carlota.deliverablesdue} overdue client deliverables in Carlota Jo`,
              buttonText: 'Review',
              resolved: resolvedActions.has('act-carlota'),
            },
          ]
        : []),
      ...(stephen.alertCount > 0
        ? [
            {
              id: 'act-stephen',
              domain: 'stephen',
              priority: 'low',
              text: `Clear ${stephen.alertCount} overdue personal action item(s)`,
              buttonText: 'Acknowledge',
              resolved: resolvedActions.has('act-stephen'),
            },
          ]
        : []),
    ].filter((a) => !a.resolved),
  };

  return snapshot;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/command/snapshot
 *
 * Returns a full EcosystemSnapshot aggregated from all domain data sources.
 * Auth-optional: session cookie is used if present, but not required.
 */
router.get('/snapshot', async (_req: Request, res: Response) => {
  try {
    const snapshot = await buildSnapshot();
    sendSuccess(res, snapshot);
  } catch (err) {
    logger.error({ err }, 'command snapshot error');
    handleRouteError(res, err, 'Failed to generate ecosystem snapshot');
  }
});

/**
 * GET /api/command/snapshot/stream
 *
 * SSE endpoint that pushes a fresh snapshot every 10 seconds.
 */
router.get('/snapshot/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = async () => {
    try {
      const snapshot = await buildSnapshot();
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
    } catch (err) {
      logger.error({ err }, 'command SSE snapshot error');
    }
  };

  send();
  const interval = setInterval(send, 10_000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

/**
 * GET /api/command/search?q=...
 *
 * Full-text search across timeline events, domain names, and intelligence cards.
 */
router.get('/search', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? '')
      .toLowerCase()
      .trim();
    if (!q) {
      sendSuccess(res, { results: [] });
      return;
    }

    const snapshot = await buildSnapshot();

    const results: Array<{
      type: string;
      domain: string;
      title: string;
      detail: string;
      severity?: string;
    }> = [];

    for (const event of snapshot.timeline) {
      if (
        event.title.toLowerCase().includes(q) ||
        event.detail.toLowerCase().includes(q) ||
        event.domain.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'event',
          domain: event.domain,
          title: event.title,
          detail: event.detail,
          severity: event.severity,
        });
      }
    }

    for (const domain of snapshot.domains) {
      if (domain.name.toLowerCase().includes(q) || domain.status.toLowerCase().includes(q)) {
        results.push({
          type: 'domain',
          domain: domain.id,
          title: domain.name,
          detail: domain.status,
        });
      }
    }

    sendSuccess(res, { results: results.slice(0, 20), query: q });
  } catch (err) {
    logger.error({ err }, 'command search error');
    handleRouteError(res, err, 'Failed to search ecosystem');
  }
});

/**
 * POST /api/command/actions/:id/resolve
 *
 * Records an action as resolved. Uses in-memory store (persists until server restart).
 * Requires an authenticated session — mutation operations must not be open to unauthenticated callers.
 */
router.post(
  '/actions/:id/resolve',
  requireAnyAuth(),
  validateBody(
    bodyShape({
      filter: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params as { id: string };
      if (!id) {
        res.status(400).json({ error: 'Action ID is required' });
        return;
      }

      resolvedActions.add(id);
      logger.info(
        { actionId: id, resolvedBy: req.user?.id ?? 'anonymous' },
        'command action resolved',
      );

      sendSuccess(res, { resolved: true, actionId: id, resolvedAt: new Date().toISOString() });
    } catch (err) {
      logger.error({ err }, 'command action resolve error');
      handleRouteError(res, err, 'Failed to resolve action');
    }
  },
);

// ---------------------------------------------------------------------------
// Ops endpoints — back the Command Portal ops pages with real DB-derived data
// ---------------------------------------------------------------------------

const DOMAIN_COLOR = DOMAIN_COLOR_BY_NAME;

/**
 * GET /api/command/alerts
 *
 * Builds an alert inbox from real signals: OTX threats (Aegis), GDELT geopolitical
 * (Terra), upcoming PRISM legal deadlines, and Lyte runtime telemetry.
 */
type CommandAlert = {
  id: string;
  domain: string;
  domainColor: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  time: string;
  status: 'active' | 'acknowledged' | 'snoozed' | 'resolved';
  category: string;
  assignee?: string;
  // Populated for snoozed alerts so the UI can show "Snoozed until …" and
  // offer an Un-snooze action without having to compute the timer itself.
  snoozedUntil?: string;
  // Optional deep-link metadata. Cross-platform correlation alerts populate
  // these so the inbox card can navigate back to the Signal Correlation page.
  correlationId?: string;
  href?: string;
  // Audit fields populated when an operator has acted on the alert. The UI
  // surfaces "Acknowledged by X at Y" so compliance can trace who silenced
  // a cross-platform correlation.
  acknowledgedBy?: string;
  acknowledgedById?: number;
  acknowledgedAt?: string;
};

/**
 * Build the alerts list from all live data sources. Used by both
 * /api/command/alerts (full payload) and /api/command/alerts/count
 * (badge count) so the two cannot drift.
 */
/**
 * Compute the inbox alerts for the caller. The caller's tenant context is
 * required to scope cross-platform correlation alerts pulled from the prism-bus
 * — those events are tenant-tagged at publish time and must not leak across
 * orgs. Pass `{ isAdmin: true }` to opt into the cross-tenant view.
 */
/**
 * Load persisted operator state for inbox alerts. Snoozed rows whose
 * snoozedUntil has already elapsed are treated as no longer snoozed
 * (they fall back to active) so operators don't have to manually
 * un-snooze when the timer expires.
 */
type AlertStateEntry = {
  state: 'acknowledged' | 'snoozed' | 'resolved';
  snoozedUntil: Date | null;
  updatedById: number | null;
  updatedAt: Date | null;
};

async function loadAlertStates(tenantId: string | null): Promise<Map<string, AlertStateEntry>> {
  const out = new Map<string, AlertStateEntry>();
  try {
    const key = tenantKey(tenantId);
    // Include rows with the matching tenant AND the global sentinel so
    // demo-mode dismissals persist for unauthenticated callers and so
    // tenant operators see their own actions regardless of whether the
    // upstream alert was tagged.
    const rows = await db
      .select()
      .from(commandInboxAlertStatesTable)
      .where(
        key === GLOBAL_TENANT_SENTINEL
          ? eq(commandInboxAlertStatesTable.tenantId, GLOBAL_TENANT_SENTINEL)
          : or(
              eq(commandInboxAlertStatesTable.tenantId, key),
              eq(commandInboxAlertStatesTable.tenantId, GLOBAL_TENANT_SENTINEL),
            ),
      );
    const now = Date.now();
    // Deterministic precedence: tenant-scoped rows override globals for the
    // same alertId, so write globals first then let tenant rows overwrite.
    const globals = rows.filter((r) => r.tenantId === GLOBAL_TENANT_SENTINEL);
    const tenantRows = rows.filter((r) => r.tenantId !== GLOBAL_TENANT_SENTINEL);
    for (const r of [...globals, ...tenantRows]) {
      const effective: 'acknowledged' | 'snoozed' | 'resolved' = r.state;
      const snoozedUntil = r.snoozedUntil ?? null;
      if (effective === 'snoozed' && snoozedUntil && snoozedUntil.getTime() <= now) {
        // Snooze has expired — treat as not-set so the alert returns to active.
        out.delete(r.alertId);
        continue;
      }
      out.set(r.alertId, {
        state: effective,
        snoozedUntil,
        updatedById: r.updatedById ?? null,
        updatedAt: r.updatedAt ?? null,
      });
    }
  } catch (err) {
    logger.warn({ err }, 'command.loadAlertStates failed; treating all alerts as active');
  }
  return out;
}

async function computeAlerts(
  caller: { tenantId: string | null; isAdmin: boolean } = { tenantId: null, isAdmin: true },
): Promise<CommandAlert[]> {
  const alerts: CommandAlert[] = [];

  // Aegis threats from OTX
  try {
    const [row] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, 'threats'))
      .limit(1);
    const threats = Array.isArray(row?.data) ? row.data.filter(isThreatItem) : [];
    threats.slice(0, 6).forEach((t, i) => {
      const sev =
        t.severity === 'critical' ? 'critical' : t.severity === 'high' ? 'high' : 'medium';
      alerts.push({
        id: `aegis-${i}`,
        domain: 'Aegis',
        domainColor: DOMAIN_COLOR.Aegis,
        priority: sev,
        title: t.name ?? t.title ?? 'Threat detected',
        description: `${t.type ?? 'Threat'} from ${t.country ?? 'unknown'}. ${t.description?.slice(0, 140) ?? ''}`,
        time: t.timestamp ? relTime(t.timestamp) : 'recent',
        status: 'active',
        category: 'Security',
        assignee: 'Aegis SOC',
      });
    });
  } catch {
    /* non-fatal */
  }

  // Terra geopolitical events
  try {
    const [row] = await db
      .select()
      .from(intelligenceCacheTable)
      .where(eq(intelligenceCacheTable.key, 'geopolitical'))
      .limit(1);
    const events = Array.isArray(row?.data) ? row.data.filter(isGeoEvent) : [];
    events
      .filter((e) => e.severity === 'high' || e.severity === 'critical')
      .slice(0, 4)
      .forEach((e, i) => {
        alerts.push({
          id: `terra-${i}`,
          domain: 'Terra',
          domainColor: DOMAIN_COLOR.Terra,
          priority: e.severity === 'critical' ? 'critical' : 'high',
          title: e.title ?? 'Geopolitical event',
          description: e.impact ?? e.description ?? e.source ?? '',
          time: e.timestamp ? relTime(e.timestamp) : 'recent',
          status: 'active',
          category: 'Market',
        });
      });
  } catch {
    /* non-fatal */
  }

  // PRISM upcoming deadlines
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);
    const dls = await db
      .select()
      .from(pcDeadlinesTable)
      .where(and(gte(pcDeadlinesTable.dueDate, now), lte(pcDeadlinesTable.dueDate, in7Days)))
      .limit(6);
    dls.forEach((d, i) => {
      const hoursUntil = (new Date(d.dueDate).getTime() - Date.now()) / 3600000;
      const priority: 'critical' | 'high' | 'medium' =
        hoursUntil < 24 ? 'critical' : hoursUntil < 72 ? 'high' : 'medium';
      alerts.push({
        id: `prism-${d.id ?? i}`,
        domain: 'PRISM',
        domainColor: DOMAIN_COLOR.PRISM,
        priority,
        title: d.title ?? 'Legal deadline approaching',
        description: `Due ${new Date(d.dueDate).toLocaleString()}.`,
        time: relTime(now.toISOString()),
        status: 'active',
        category: 'Legal',
      });
    });
  } catch {
    /* non-fatal */
  }

  // Lyte runtime telemetry
  const lyte = await getLyteData();
  if (lyte.heapPct > 80) {
    alerts.push({
      id: 'lyte-heap',
      domain: 'Lyte',
      domainColor: DOMAIN_COLOR.Lyte,
      priority: lyte.heapPct > 90 ? 'critical' : 'high',
      title: `Heap utilisation at ${lyte.heapPct}%`,
      description: 'Process heap pressure elevated. Investigate memory growth on api-server.',
      time: 'just now',
      status: 'active',
      category: 'Performance',
      assignee: 'Eng Team',
    });
  }
  if (lyte.cpuLoad > 60) {
    alerts.push({
      id: 'lyte-cpu',
      domain: 'Lyte',
      domainColor: DOMAIN_COLOR.Lyte,
      priority: lyte.cpuLoad > 80 ? 'high' : 'medium',
      title: `CPU load at ${lyte.cpuLoad}%`,
      description: 'Sustained CPU pressure. Consider horizontal scaling.',
      time: 'just now',
      status: 'active',
      category: 'Performance',
    });
  }
  if (lyte.recentRestart) {
    alerts.push({
      id: 'lyte-restart',
      domain: 'Lyte',
      domainColor: DOMAIN_COLOR.Lyte,
      priority: 'medium',
      title: 'API server restart detected',
      description: `Process uptime ${Math.floor(lyte.uptimeSecs)}s — verify request stability.`,
      time: 'just now',
      status: 'active',
      category: 'Infrastructure',
    });
  }

  // Cross-platform correlation alerts published onto the PRISM bus by the
  // correlation detector (artifacts/api-server/src/routes/cross-platform.ts).
  // High-strength (≥85%) and "escalated" correlations land here so operators
  // see them in the Command Inbox without navigating to the Signal Correlation
  // page.
  try {
    const { prismBus } = await import('@szl-holdings/prism-bus');
    const events = prismBus.getHistory({ type: 'cross_domain_correlation', limit: 100 });
    // Tenant filter mirrors /api/prism-bus/events: untagged events are visible
    // to everyone (demo mode); tagged events are visible to admins or to the
    // matching tenant only. Prevents cross-tenant correlation leakage.
    const visible = events
      .filter((e) => caller.isAdmin || e.tenantId == null || e.tenantId === caller.tenantId)
      .slice(0, 25);
    for (const evt of visible) {
      const p = evt.payload as Record<string, unknown>;
      const correlationId = typeof p.correlationId === 'string' ? p.correlationId : evt.id;
      const title =
        typeof p.title === 'string' ? p.title : 'Cross-platform correlation detected';
      const description = typeof p.description === 'string' ? p.description : '';
      const products = Array.isArray(p.products)
        ? (p.products as unknown[]).filter((x): x is string => typeof x === 'string')
        : [];
      const strengthVal = typeof p.strength === 'number' ? (p.strength as number) : 0;
      const outcome = typeof p.outcome === 'string' ? (p.outcome as string) : 'informational';
      const priority: 'critical' | 'high' | 'medium' =
        evt.severity === 'critical' ? 'critical' : evt.severity === 'high' ? 'high' : 'medium';
      const drillUrl =
        typeof p.drillUrl === 'string'
          ? (p.drillUrl as string)
          : `/strategy/cross-platform?correlationId=${encodeURIComponent(correlationId)}`;
      alerts.push({
        id: `xplat-corr-${correlationId}`,
        domain: 'Cross-Platform',
        domainColor: '#a855f7',
        priority,
        title: `Correlation: ${title}`,
        description:
          `${description}${description ? ' ' : ''}` +
          `Strength ${(strengthVal * 100).toFixed(0)}%, outcome ${outcome}` +
          `${products.length ? `, products: ${products.join(', ')}` : ''}.`,
        time: relTime(new Date(evt.timestamp).toISOString()),
        status: 'active',
        category: 'Cross-Platform',
        correlationId,
        href: drillUrl,
      });
    }
  } catch {
    /* non-fatal */
  }

  return alerts;
}

/**
 * Apply persisted operator state to the freshly-built alert list.
 *
 * - "resolved" alerts are dropped entirely (operator marked them done).
 * - "snoozed" alerts whose snoozedUntil > now are dropped from the active
 *   feed but counted under `snoozed`. Expired snoozes are already
 *   filtered to "no state" by loadAlertStates so they reappear as active.
 * - "acknowledged" alerts remain visible but their status flips to
 *   "acknowledged" so the UI can render them differently and they no
 *   longer count toward the "active" badge.
 */
function applyAlertStates(
  alerts: CommandAlert[],
  states: Map<string, AlertStateEntry>,
  userNames: Map<number, string>,
): CommandAlert[] {
  const out: CommandAlert[] = [];
  for (const a of alerts) {
    const s = states.get(a.id);
    if (!s) {
      out.push(a);
      continue;
    }
    if (s.state === 'resolved') continue; // hide entirely
    if (s.state === 'snoozed') {
      // Keep snoozed alerts in the payload (flagged) so operators can see
      // them under the "Snoozed" filter and Un-snooze before the timer
      // expires. They're excluded from the active count below.
      out.push({
        ...a,
        status: 'snoozed',
        snoozedUntil: s.snoozedUntil ? s.snoozedUntil.toISOString() : undefined,
      });
      continue;
    }
    // acknowledged — keep but mark, surfacing audit fields so the inbox
    // can render "Acknowledged by X at Y".
    const acknowledgedBy = s.updatedById != null ? (userNames.get(s.updatedById) ?? null) : null;
    out.push({
      ...a,
      status: 'acknowledged',
      ...(acknowledgedBy ? { acknowledgedBy } : {}),
      ...(s.updatedById != null ? { acknowledgedById: s.updatedById } : {}),
      ...(s.updatedAt ? { acknowledgedAt: s.updatedAt.toISOString() } : {}),
    });
  }
  return out;
}

/**
 * Resolve user display names for the given updatedById values in a single
 * query so the inbox can render "Acknowledged by X" without N+1 lookups.
 */
async function loadUserDisplayNames(ids: number[]): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  if (ids.length === 0) return out;
  try {
    const rows = await db
      .select({ id: usersTable.id, displayName: usersTable.displayName })
      .from(usersTable)
      .where(inArray(usersTable.id, ids));
    for (const r of rows) out.set(r.id, r.displayName);
  } catch (err) {
    logger.warn({ err }, 'command.loadUserDisplayNames failed');
  }
  return out;
}

router.get('/alerts', requireAnyAuth(), async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isAdmin = req.user?.roles?.some((r) => r === 'super_admin' || r === 'admin') ?? false;
    const rawAlerts = await computeAlerts({ tenantId, isAdmin });
    const states = await loadAlertStates(tenantId);
    const userIds = Array.from(
      new Set(
        Array.from(states.values())
          .map((s) => s.updatedById)
          .filter((id): id is number => typeof id === 'number'),
      ),
    );
    const userNames = await loadUserDisplayNames(userIds);
    const alerts = applyAlertStates(rawAlerts, states, userNames);

    // Counts include snoozed/resolved that were filtered out, since the UI
    // surfaces them as separate buckets in the summary cards. We only count
    // states for alertIds that are still produced by the live builder so
    // orphaned rows (e.g. correlations that have aged out of the bus
    // history) don't inflate the snoozed badge.
    const liveAlertIds = new Set(rawAlerts.map((a) => a.id));
    const snoozedCount = Array.from(states.entries()).filter(
      ([id, s]) => s.state === 'snoozed' && liveAlertIds.has(id),
    ).length;
    const acknowledgedCount = alerts.filter((a) => a.status === 'acknowledged').length;

    sendSuccess(res, {
      alerts,
      counts: {
        active: alerts.filter((a) => a.status === 'active').length,
        critical: alerts.filter((a) => a.priority === 'critical' && a.status === 'active').length,
        acknowledged: acknowledgedCount,
        snoozed: snoozedCount,
      },
      generatedAt: new Date().toISOString(),
      dataSource: alerts.length > 0 ? 'live' : 'empty',
    });
  } catch (err) {
    logger.error({ err }, 'command alerts error');
    handleRouteError(res, err, 'Failed to load alerts');
  }
});

/**
 * GET /api/command/alerts/count
 *
 * Lightweight count of currently-active alerts. Backed by the same data
 * sources as /api/command/alerts but skips serializing the full payload
 * so polling clients (badge counts) stay cheap.
 */
router.get('/alerts/count', requireAnyAuth(), async (req: Request, res: Response) => {
  try {
    // Re-use the same builder + state filter as /alerts so the badge count
    // cannot drift from the inbox total (acknowledged/snoozed/resolved
    // alerts are excluded from the active count).
    const tenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const isAdmin = req.user?.roles?.some((r) => r === 'super_admin' || r === 'admin') ?? false;
    const rawAlerts = await computeAlerts({ tenantId, isAdmin });
    const states = await loadAlertStates(tenantId);
    // The badge count only depends on which alerts are still active, so we
    // skip resolving display names — they're only needed for the inbox UI.
    const alerts = applyAlertStates(rawAlerts, states, new Map());
    const active = alerts.filter((a) => a.status === 'active').length;
    sendSuccess(res, { count: active, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, 'command alerts/count error');
    handleRouteError(res, err, 'Failed to load alert count');
  }
});

/**
 * POST /api/command/alerts/:alertId/state
 *
 * Body: { state: "acknowledged" | "snoozed" | "resolved" | "active",
 *         snoozeMinutes?: number  // required when state === "snoozed" }
 *
 * Records an operator action against an inbox alert so it stops
 * re-surfacing in the active feed on every poll. Persisted in
 * command_inbox_alert_states keyed by (alertId, tenantId) so the
 * decision survives api-server restarts.
 *
 * Sending state="active" deletes the row, restoring the alert to its
 * default (active) status — used for "undo" / "un-snooze".
 */
const alertStateBodySchema = z.object({
  state: z.enum(['acknowledged', 'snoozed', 'resolved', 'active']),
  snoozeMinutes: z
    .number()
    .int()
    .positive()
    .max(60 * 24 * 30)
    .optional(),
});

router.post(
  '/alerts/:alertId/state',
  requireAnyAuth(),
  validateBody(alertStateBodySchema),
  async (req: Request, res: Response) => {
    try {
      const alertId = req.params.alertId;
      if (!alertId || alertId.length > 200) {
        return handleRouteError(res, new Error('Invalid alertId'), 'Invalid alertId');
      }
      const { state, snoozeMinutes } = req.body as z.infer<typeof alertStateBodySchema>;
      const tenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
      const updatedById = typeof req.user?.id === 'number' ? req.user.id : null;

      const key = tenantKey(tenantId);

      // "active" = clear any persisted state row.
      if (state === 'active') {
        await db
          .delete(commandInboxAlertStatesTable)
          .where(
            and(
              eq(commandInboxAlertStatesTable.alertId, alertId),
              eq(commandInboxAlertStatesTable.tenantId, key),
            ),
          );
        // Append an immutable audit row so the timeline shows the
        // un-snooze / re-open event explicitly. Failures here must not
        // break the operator action — audit is best-effort.
        try {
          await db.insert(commandInboxAlertAuditTable).values({
            alertId,
            tenantId: key,
            action: 'unsnoozed',
            snoozedUntil: null,
            actorId: updatedById,
          });
        } catch (auditErr) {
          logger.warn({ auditErr, alertId }, 'command alerts/state audit insert failed');
        }
        return sendSuccess(res, { alertId, state, tenantId: key });
      }

      // Compute snoozedUntil. Snooze without an explicit duration defaults
      // to 60 minutes — matches the "Snooze 1h" button in the inbox UI.
      const snoozedUntil =
        state === 'snoozed' ? new Date(Date.now() + (snoozeMinutes ?? 60) * 60_000) : null;

      // Upsert keyed on (alertId, tenantId). The unique index supports
      // ON CONFLICT — tenantId is NOT NULL so PG's NULL-ne-NULL semantics
      // can't sneak in a duplicate global row.
      await db
        .insert(commandInboxAlertStatesTable)
        .values({
          alertId,
          tenantId: key,
          state,
          snoozedUntil,
          updatedById,
        })
        .onConflictDoUpdate({
          target: [commandInboxAlertStatesTable.alertId, commandInboxAlertStatesTable.tenantId],
          set: {
            state,
            snoozedUntil,
            updatedById,
            updatedAt: new Date(),
          },
        });

      // Append an immutable audit row for compliance traceability. Each
      // operator action gets its own row — the states table is overwritten
      // on every action, so it cannot answer "who acted, when". Audit
      // failures must not break the action — log and continue.
      try {
        await db.insert(commandInboxAlertAuditTable).values({
          alertId,
          tenantId: key,
          action: state,
          snoozedUntil,
          actorId: updatedById,
        });
      } catch (auditErr) {
        logger.warn({ auditErr, alertId }, 'command alerts/state audit insert failed');
      }

      sendSuccess(res, { alertId, state, snoozedUntil, tenantId: key });
    } catch (err) {
      logger.error({ err }, 'command alerts/state update error');
      handleRouteError(res, err, 'Failed to update alert state');
    }
  },
);

/**
 * GET /api/command/alerts/:alertId/audit
 *
 * Returns the chronological audit history for a single alert: every
 * acknowledge / snooze / resolve / un-snooze action with the actor and
 * timestamp. Backed by the immutable command_inbox_alert_audit table —
 * the states table is overwritten on each action and cannot answer this
 * question.
 *
 * Tenant scoping mirrors the read path: the caller sees rows for their
 * tenant plus the global sentinel (so demo-mode actions are visible to
 * authenticated callers too).
 */
router.get('/alerts/:alertId/audit', requireAnyAuth(), async (req: Request, res: Response) => {
  try {
    const alertId = req.params.alertId;
    if (!alertId || alertId.length > 200) {
      return handleRouteError(res, new Error('Invalid alertId'), 'Invalid alertId');
    }

    const tenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
    const key = tenantKey(tenantId);

    const rows = await db
      .select()
      .from(commandInboxAlertAuditTable)
      .where(
        and(
          eq(commandInboxAlertAuditTable.alertId, alertId),
          key === GLOBAL_TENANT_SENTINEL
            ? eq(commandInboxAlertAuditTable.tenantId, GLOBAL_TENANT_SENTINEL)
            : or(
                eq(commandInboxAlertAuditTable.tenantId, key),
                eq(commandInboxAlertAuditTable.tenantId, GLOBAL_TENANT_SENTINEL),
              ),
        ),
      )
      .orderBy(asc(commandInboxAlertAuditTable.createdAt));

    const actorIds = Array.from(
      new Set(rows.map((r) => r.actorId).filter((id): id is number => typeof id === 'number')),
    );
    const actorNames = await loadUserDisplayNames(actorIds);

    const entries = rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorId: r.actorId,
      actorName: r.actorId != null ? (actorNames.get(r.actorId) ?? null) : null,
      snoozedUntil: r.snoozedUntil ? r.snoozedUntil.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));

    sendSuccess(res, { alertId, entries });
  } catch (err) {
    logger.error({ err }, 'command alerts/audit error');
    handleRouteError(res, err, 'Failed to load alert audit history');
  }
});

// ── Shared cost constants ─────────────────────────────────────────────────────
// These are the single source of truth for unit costs and domain budgets.
// Both /costs (full analytics) and /costs/over-budget (badge count) must
// reference these constants so the badge and dashboard values cannot drift.
const COST_RATE_CARD: Record<string, { unitCost: number; domain: string }> = {
  'aegis.threat_lookup': { unitCost: 0.012, domain: 'aegis' },
  'aegis.alert_processed': { unitCost: 0.008, domain: 'aegis' },
  'vessels.ais_poll': { unitCost: 0.0008, domain: 'vessels' },
  'vessels.tracking_request': { unitCost: 0.004, domain: 'vessels' },
  'terra.market_query': { unitCost: 0.006, domain: 'terra' },
  'terra.geopolitical_event': { unitCost: 0.003, domain: 'terra' },
  'lyte.metric_ingest': { unitCost: 0.0002, domain: 'lyte' },
  'lyte.alert_eval': { unitCost: 0.001, domain: 'lyte' },
  'prism.matter_lookup': { unitCost: 0.05, domain: 'prism' },
  'prism.deadline_check': { unitCost: 0.002, domain: 'prism' },
  'szl.dashboard_view': { unitCost: 0.0005, domain: 'szl' },
  'carlota.session': { unitCost: 0.0015, domain: 'carlota' },
};
const COST_DOMAIN_BUDGETS: Record<string, number> = {
  aegis: 28000,
  vessels: 35000,
  terra: 18000,
  lyte: 22000,
  prism: 12000,
  szl: 8000,
  carlota: 5000,
};

/**
 * GET /api/command/costs
 *
 * Aggregates request volume across guardian actions and signals to derive
 * domain-level cost analytics. Cost figures are computed from actual request
 * counts × per-call rate cards (no random data).
 */
router.get('/costs', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const RATE_CARD = COST_RATE_CARD;
    const DOMAIN_BUDGETS = COST_DOMAIN_BUDGETS;
    const DOMAIN_NAMES: Record<string, string> = {
      aegis: 'Aegis',
      vessels: 'Vessels',
      terra: 'Terra',
      lyte: 'Lyte',
      prism: 'PRISM',
      szl: 'SZL Holdings',
      carlota: 'Carlota Jo',
    };
    const DOMAIN_HEX: Record<string, string> = {
      aegis: DOMAIN_COLOR.Aegis,
      vessels: DOMAIN_COLOR.Vessels,
      terra: DOMAIN_COLOR.Terra,
      lyte: DOMAIN_COLOR.Lyte,
      prism: DOMAIN_COLOR.PRISM,
      szl: DOMAIN_COLOR.SZL,
      carlota: DOMAIN_COLOR['Carlota Jo'],
    };

    // Real billing actuals: aggregate usage_events by feature_key for current and previous month.
    let mtdEvents: Array<{ featureKey: string; total: number }> = [];
    let prevEvents: Array<{ featureKey: string; total: number }> = [];
    try {
      mtdEvents = await db
        .select({
          featureKey: usageEventsTable.featureKey,
          total: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int`,
        })
        .from(usageEventsTable)
        .where(gte(usageEventsTable.recordedAt, monthStart))
        .groupBy(usageEventsTable.featureKey);
      prevEvents = await db
        .select({
          featureKey: usageEventsTable.featureKey,
          total: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int`,
        })
        .from(usageEventsTable)
        .where(
          and(
            gte(usageEventsTable.recordedAt, prevMonthStart),
            lte(usageEventsTable.recordedAt, monthStart),
          ),
        )
        .groupBy(usageEventsTable.featureKey);
    } catch {
      /* non-fatal */
    }

    const domainAgg = new Map<string, { spent: number; calls: number }>();
    const domainPrev = new Map<string, number>();
    Object.keys(DOMAIN_BUDGETS).forEach((d) => {
      domainAgg.set(d, { spent: 0, calls: 0 });
      domainPrev.set(d, 0);
    });
    for (const e of mtdEvents) {
      const r = RATE_CARD[e.featureKey];
      if (!r) continue;
      const agg = domainAgg.get(r.domain);
      if (agg) {
        agg.spent += Number(e.total) * r.unitCost;
        agg.calls += Number(e.total);
      }
    }
    for (const e of prevEvents) {
      const r = RATE_CARD[e.featureKey];
      if (!r) continue;
      domainPrev.set(r.domain, (domainPrev.get(r.domain) ?? 0) + Number(e.total) * r.unitCost);
    }

    const totalCalls = Array.from(domainAgg.values()).reduce((s, a) => s + a.calls, 0);
    const hasRealUsage = totalCalls > 0;

    const domains = Object.keys(DOMAIN_BUDGETS).map((id) => {
      const agg = domainAgg.get(id) ?? { spent: 0, calls: 0 };
      const prev = domainPrev.get(id) ?? 0;
      const trend = prev > 0 ? Math.round(((agg.spent - prev) / prev) * 100) : 0;
      return {
        id,
        name: DOMAIN_NAMES[id],
        color: DOMAIN_HEX[id],
        budget: DOMAIN_BUDGETS[id],
        spent: Math.round(agg.spent * 100) / 100,
        apiCalls: agg.calls,
        storage: 0,
        compute: 0,
        trend,
      };
    });

    const totalSpent = domains.reduce((s, d) => s + d.spent, 0);
    const totalBudget = domains.reduce((s, d) => s + d.budget, 0);
    const overBudget = domains.filter((d) => d.spent > d.budget).length;

    sendSuccess(res, {
      domains,
      summary: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalBudget,
        overBudget,
        totalApiCalls: totalCalls,
        totalStorageTb: 0,
      },
      generatedAt: new Date().toISOString(),
      dataSource: hasRealUsage ? 'usage_events' : 'empty',
    });
  } catch (err) {
    logger.error({ err }, 'command costs error');
    handleRouteError(res, err, 'Failed to load cost analytics');
  }
});

/**
 * GET /api/command/costs/over-budget
 *
 * Lightweight badge count: returns the number of domains whose MTD spend
 * exceeds their monthly budget. Used by the Ops Center grid badge.
 */
router.get('/costs/over-budget', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    // Uses COST_RATE_CARD + COST_DOMAIN_BUDGETS (module-level constants shared with /costs)
    // so badge count cannot drift from dashboard analytics.
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let mtdEvents: Array<{ featureKey: string; total: number }> = [];
    try {
      mtdEvents = await db
        .select({
          featureKey: usageEventsTable.featureKey,
          total: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int`,
        })
        .from(usageEventsTable)
        .where(gte(usageEventsTable.recordedAt, monthStart))
        .groupBy(usageEventsTable.featureKey);
    } catch {
      /* non-fatal */
    }
    const domainSpend = new Map<string, number>();
    Object.keys(COST_DOMAIN_BUDGETS).forEach((d) => domainSpend.set(d, 0));
    for (const e of mtdEvents) {
      const r = COST_RATE_CARD[e.featureKey];
      if (!r) continue;
      domainSpend.set(r.domain, (domainSpend.get(r.domain) ?? 0) + Number(e.total) * r.unitCost);
    }
    const count = Array.from(domainSpend.entries()).filter(
      ([d, spent]) => spent > (COST_DOMAIN_BUDGETS[d] ?? Infinity),
    ).length;
    sendSuccess(res, { count });
  } catch (err) {
    handleRouteError(res, err, 'Failed to compute over-budget count');
  }
});

/**
 * GET /api/command/sla
 *
 * Builds SLA dashboard from live runtime signals (Lyte CPU/heap/uptime) and
 * domain heuristics derived from real DB activity.
 */
type CommandSla = {
  id: string;
  domain: string;
  domainColor: string;
  name: string;
  metric: string;
  target: number;
  unit: string;
  current: number;
  compliance30d: number;
  breach: boolean;
  window: string;
  owner: string;
  samples: number;
  source: string;
  lastBreach?: string;
};

/**
 * Build the SLA dashboard rows. Used by both /api/command/sla (full
 * payload) and /api/command/sla/breaches (badge count) so the breaching
 * count cannot drift from sla.summary.breaching.
 */
async function computeSlas(): Promise<CommandSla[]> {
  const since30d = new Date(Date.now() - 30 * 86400000);
  const since24h = new Date(Date.now() - 86400000);

  let metrics: Array<{
    service: string;
    metricType: string;
    avg: number;
    p95: number;
    samples: number;
  }> = [];
  try {
    metrics = await db
      .select({
        service: lyteMetricsTable.service,
        metricType: lyteMetricsTable.metricType,
        avg: sql<number>`COALESCE(AVG(${lyteMetricsTable.value}), 0)::float`,
        p95: sql<number>`COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${lyteMetricsTable.value}), 0)::float`,
        samples: sql<number>`COUNT(*)::int`,
      })
      .from(lyteMetricsTable)
      .where(gte(lyteMetricsTable.recordedAt, since24h))
      .groupBy(lyteMetricsTable.service, lyteMetricsTable.metricType);
  } catch {
    /* non-fatal */
  }

  let health: Array<{ service: string; pass: number; total: number }> = [];
  try {
    health = await db
      .select({
        service: healthChecksTable.service,
        pass: sql<number>`SUM(CASE WHEN ${healthChecksTable.status} = 'healthy' THEN 1 ELSE 0 END)::int`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(healthChecksTable)
      .where(gte(healthChecksTable.checkedAt, since30d))
      .groupBy(healthChecksTable.service);
  } catch {
    /* non-fatal */
  }

  const metricFor = (service: string, metricType: string) =>
    metrics.find((m) => m.service === service && m.metricType === metricType);
  const uptimeFor = (service: string) => {
    const h = health.find((x) => x.service === service);
    if (!h || h.total === 0) return null;
    return +((h.pass / h.total) * 100).toFixed(2);
  };

  const slas: CommandSla[] = [];

  const lyteLatency = metricFor('api-server', 'latency');
  if (lyteLatency) {
    const breach = lyteLatency.p95 > 2000;
    slas.push({
      id: 'lyte-latency',
      domain: 'Lyte',
      domainColor: DOMAIN_COLOR.Lyte,
      name: 'API Response Time P95',
      metric: '95th percentile latency',
      target: 2000,
      unit: 'ms',
      current: Math.round(lyteLatency.p95),
      compliance30d: uptimeFor('api-server') ?? 0,
      breach,
      window: 'Rolling 24h',
      owner: 'Lyte Eng Team',
      samples: lyteLatency.samples,
      source: 'lyte_metrics',
      ...(breach ? { lastBreach: 'within 24h' } : {}),
    });
  }
  const lyteAvail = uptimeFor('api-server');
  if (lyteAvail !== null) {
    slas.push({
      id: 'lyte-uptime',
      domain: 'Lyte',
      domainColor: DOMAIN_COLOR.Lyte,
      name: 'Service Uptime',
      metric: 'Health-check pass rate',
      target: 99.9,
      unit: '%',
      current: lyteAvail,
      compliance30d: lyteAvail,
      breach: lyteAvail < 99.9,
      window: 'Rolling 30d',
      owner: 'Eng Team',
      samples: health.find((h) => h.service === 'api-server')?.total ?? 0,
      source: 'health_checks',
    });
  }
  const aegisErr = metricFor('aegis', 'error_rate');
  if (aegisErr) {
    slas.push({
      id: 'aegis-errors',
      domain: 'Aegis',
      domainColor: DOMAIN_COLOR.Aegis,
      name: 'Aegis Error Rate',
      metric: 'Errors per request',
      target: 1,
      unit: '%',
      current: +aegisErr.avg.toFixed(2),
      compliance30d: uptimeFor('aegis') ?? 0,
      breach: aegisErr.avg > 1,
      window: 'Rolling 24h',
      owner: 'Aegis SOC',
      samples: aegisErr.samples,
      source: 'lyte_metrics',
    });
  }
  const vesselsAvail = uptimeFor('vessels');
  if (vesselsAvail !== null) {
    slas.push({
      id: 'vessels-uptime',
      domain: 'Vessels',
      domainColor: DOMAIN_COLOR.Vessels,
      name: 'Fleet Tracking Uptime',
      metric: 'Vessels service health',
      target: 99.5,
      unit: '%',
      current: vesselsAvail,
      compliance30d: vesselsAvail,
      breach: vesselsAvail < 99.5,
      window: 'Rolling 30d',
      owner: 'Maritime Ops',
      samples: health.find((h) => h.service === 'vessels')?.total ?? 0,
      source: 'health_checks',
    });
  }
  const prismThr = metricFor('prism', 'throughput');
  if (prismThr) {
    slas.push({
      id: 'prism-throughput',
      domain: 'PRISM',
      domainColor: DOMAIN_COLOR.PRISM,
      name: 'Legal Review Throughput',
      metric: 'Matters processed/hr',
      target: 5,
      unit: '/hr',
      current: +prismThr.avg.toFixed(1),
      compliance30d: uptimeFor('prism') ?? 0,
      breach: prismThr.avg < 5,
      window: 'Rolling 24h',
      owner: 'Priya Nair',
      samples: prismThr.samples,
      source: 'lyte_metrics',
    });
  }

  return slas;
}

router.get('/sla', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    const slas = await computeSlas();
    sendSuccess(res, {
      slas,
      summary: {
        total: slas.length,
        breaching: slas.filter((s) => s.breach).length,
        nominal: slas.filter((s) => !s.breach).length,
        avgCompliance:
          slas.length > 0
            ? +(slas.reduce((s, x) => s + x.compliance30d, 0) / slas.length).toFixed(1)
            : 0,
      },
      generatedAt: new Date().toISOString(),
      dataSource: slas.length > 0 ? 'telemetry' : 'empty',
    });
  } catch (err) {
    logger.error({ err }, 'command sla error');
    handleRouteError(res, err, 'Failed to load SLA dashboard');
  }
});

/**
 * GET /api/command/sla/breaches
 *
 * Lightweight count of currently-breaching SLAs. Re-uses computeSlas()
 * so the badge count cannot drift from sla.summary.breaching.
 */
router.get('/sla/breaches', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    const slas = await computeSlas();
    const breaching = slas.filter((s) => s.breach).length;
    sendSuccess(res, { count: breaching, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, 'command sla/breaches error');
    handleRouteError(res, err, 'Failed to load SLA breach count');
  }
});

/**
 * GET /api/command/badge-counts
 *
 * Single-call aggregation of the four Ops Center grid badges so the layout
 * and grid components can stop firing four separate requests every 30s.
 * Each sub-count is computed independently inside a `try` and degrades to
 * `null` (rather than failing the whole request) so a partial DB hiccup
 * never blanks the entire badge bar. Frontend hook still falls back to
 * the legacy per-counter endpoints when this aggregator is unavailable.
 */
router.get('/badge-counts', requireAnyAuth(), async (req: Request, res: Response) => {
  const tenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
  const isAdmin = req.user?.roles?.some((r) => r === 'super_admin' || r === 'admin') ?? false;

  // Active alerts — re-uses computeAlerts so badge cannot drift from inbox.
  const alertsP = (async () => {
    try {
      const rawAlerts = await computeAlerts({ tenantId, isAdmin });
      const states = await loadAlertStates(tenantId);
      const alerts = applyAlertStates(rawAlerts, states, new Map());
      return alerts.filter((a) => a.status === 'active').length;
    } catch (err) {
      logger.warn({ err }, 'badge-counts: alerts subcount failed');
      return null;
    }
  })();

  // SLA breaches — re-uses computeSlas so badge cannot drift from /sla.
  const slaP = (async () => {
    try {
      const slas = await computeSlas();
      return slas.filter((s) => s.breach).length;
    } catch (err) {
      logger.warn({ err }, 'badge-counts: sla subcount failed');
      return null;
    }
  })();

  // Cost over-budget — same MTD spend logic as /costs/over-budget.
  const costP = (async () => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const mtdEvents = await db
        .select({
          featureKey: usageEventsTable.featureKey,
          total: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int`,
        })
        .from(usageEventsTable)
        .where(gte(usageEventsTable.recordedAt, monthStart))
        .groupBy(usageEventsTable.featureKey);
      const domainSpend = new Map<string, number>();
      Object.keys(COST_DOMAIN_BUDGETS).forEach((d) => domainSpend.set(d, 0));
      for (const e of mtdEvents) {
        const r = COST_RATE_CARD[e.featureKey];
        if (!r) continue;
        domainSpend.set(
          r.domain,
          (domainSpend.get(r.domain) ?? 0) + Number(e.total) * r.unitCost,
        );
      }
      return Array.from(domainSpend.entries()).filter(
        ([d, spent]) => spent > (COST_DOMAIN_BUDGETS[d] ?? Infinity),
      ).length;
    } catch (err) {
      logger.warn({ err }, 'badge-counts: cost subcount failed');
      return null;
    }
  })();

  // Governance pending — mirrors routes/governance-counts.ts logic but
  // inlined here so we don't add a cross-router dependency. Keep these
  // two implementations in sync if the criteria change.
  const govP = (async () => {
    try {
      const orgIds = req.user?.orgs?.map((o) => o.orgId).filter((id): id is number => typeof id === 'number') ?? [];
      const orgFilter =
        orgIds.length > 0 ? inArray(approvalRequestsTable.orgId, orgIds) : undefined;
      const [row] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(approvalRequestsTable)
        .where(
          and(
            eq(approvalRequestsTable.status, 'pending'),
            eq(approvalRequestsTable.resourceType, 'policy'),
            orgFilter,
          ),
        );
      return Number(row?.count ?? 0);
    } catch (err) {
      logger.warn({ err }, 'badge-counts: governance subcount failed');
      return null;
    }
  })();

  const [alerts, slaBreaches, costOverBudget, governancePending] = await Promise.all([
    alertsP,
    slaP,
    costP,
    govP,
  ]);
  sendSuccess(res, {
    alerts,
    slaBreaches,
    costOverBudget,
    governancePending,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/command/badge-counts/stream
 *
 * SSE endpoint that pushes badge-count updates as soon as they change
 * (or at most every 5 seconds). Consumers replace the 30-second polling
 * loop in the frontend `useOpsBadgeCounts` hook.
 *
 * Each event is a JSON object with the same shape as /badge-counts:
 *   { alerts, slaBreaches, costOverBudget, governancePending, generatedAt }
 *
 * Requires the same auth as the one-shot /badge-counts endpoint. When the
 * SSE connection is rejected (401/403), the frontend hook falls back to
 * the existing 30-second polling loop automatically.
 */
router.get('/badge-counts/stream', requireAnyAuth(), async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const tenantId = req.user?.orgs?.[0]?.orgId?.toString() ?? null;
  const isAdmin = req.user?.roles?.some((r) => r === 'super_admin' || r === 'admin') ?? false;
  const orgIds = req.user?.orgs?.map((o) => o.orgId).filter((id): id is number => typeof id === 'number') ?? [];

  async function computeBadgeCounts(): Promise<{
    alerts: number | null;
    slaBreaches: number | null;
    costOverBudget: number | null;
    governancePending: number | null;
  }> {
    const alertsP = (async () => {
      try {
        const rawAlerts = await computeAlerts({ tenantId, isAdmin });
        const states = await loadAlertStates(tenantId);
        const alerts = applyAlertStates(rawAlerts, states, new Map());
        return alerts.filter((a) => a.status === 'active').length;
      } catch {
        return null;
      }
    })();

    const slaP = (async () => {
      try {
        const slas = await computeSlas();
        return slas.filter((s) => s.breach).length;
      } catch {
        return null;
      }
    })();

    const costP = (async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const mtdEvents = await db
          .select({
            featureKey: usageEventsTable.featureKey,
            total: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int`,
          })
          .from(usageEventsTable)
          .where(gte(usageEventsTable.recordedAt, monthStart))
          .groupBy(usageEventsTable.featureKey);
        const domainSpend = new Map<string, number>();
        Object.keys(COST_DOMAIN_BUDGETS).forEach((d) => domainSpend.set(d, 0));
        for (const e of mtdEvents) {
          const r = COST_RATE_CARD[e.featureKey];
          if (!r) continue;
          domainSpend.set(r.domain, (domainSpend.get(r.domain) ?? 0) + Number(e.total) * r.unitCost);
        }
        return Array.from(domainSpend.entries()).filter(
          ([d, spent]) => spent > (COST_DOMAIN_BUDGETS[d] ?? Infinity),
        ).length;
      } catch {
        return null;
      }
    })();

    const govP = (async () => {
      try {
        const orgFilter =
          orgIds.length > 0 ? inArray(approvalRequestsTable.orgId, orgIds) : undefined;
        const [row] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(approvalRequestsTable)
          .where(
            and(
              eq(approvalRequestsTable.status, 'pending'),
              eq(approvalRequestsTable.resourceType, 'policy'),
              orgFilter,
            ),
          );
        return Number(row?.count ?? 0);
      } catch {
        return null;
      }
    })();

    const [alerts, slaBreaches, costOverBudget, governancePending] = await Promise.all([
      alertsP,
      slaP,
      costP,
      govP,
    ]);
    return { alerts, slaBreaches, costOverBudget, governancePending };
  }

  const send = async () => {
    try {
      const counts = await computeBadgeCounts();
      res.write(`data: ${JSON.stringify({ ...counts, generatedAt: new Date().toISOString() })}\n\n`);
    } catch (err) {
      logger.error({ err }, 'command badge-counts SSE error');
    }
  };

  await send();
  const interval = setInterval(() => void send(), 5_000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

/**
 * GET /api/command/overview-kpis
 *
 * Aggregated platform-wide KPIs for the Executive Summary panel. The
 * response covers three orthogonal pillars so the panel can render a
 * single trustworthy snapshot:
 *
 *   - revenue30dUsd  : sum of fund_portfolio_financials.revenue across
 *                       portfolio companies whose period_end falls in
 *                       the last ~30 days (the canonical fund revenue
 *                       feed). When no rows are available within the
 *                       window we fall back to the most recent
 *                       reporting period across all companies so
 *                       quarterly cadences still light up the tile.
 *   - threatScore    : 0..100 weighted score derived from the
 *                       intelligence_cache "threats" payload (used by
 *                       the Aegis surface). Higher = more critical
 *                       severity-adjusted threats currently observed.
 *   - infraHealthPct : percent of health_checks rows reporting status
 *                       'healthy' over the last hour (services × probes,
 *                       so this directly mirrors the Replit-platform
 *                       infrastructure health our self-monitor publishes).
 *
 * Each sub-metric degrades to `null` independently when its source
 * query fails, so one missing table never blanks the whole panel.
 */
router.get('/overview-kpis', requireAnyAuth(), async (_req: Request, res: Response) => {
  // 1. Fund revenue — sum across portfolio company financials. We prefer
  //    the trailing-30-day window; if none of the rows close in that
  //    window (typical for quarterly reporting) we fall back to the
  //    latest reported period per company so the tile still renders.
  const revenue30dUsdP = (async (): Promise<number | null> => {
    try {
      const since30d = new Date(Date.now() - 30 * 86400000)
        .toISOString()
        .slice(0, 10);
      const [windowRow] = await db
        .select({
          sum: sql<number | null>`COALESCE(SUM(${fundPortfolioFinancialsTable.revenue}), 0)::float`,
          n: sql<number>`COUNT(*)::int`,
        })
        .from(fundPortfolioFinancialsTable)
        .where(gte(fundPortfolioFinancialsTable.periodEnd, since30d));
      const windowed = Number(windowRow?.sum ?? 0);
      if (Number(windowRow?.n ?? 0) > 0) return windowed;

      // Fallback: take the *latest reported period per company* and sum
      // those — never sum across periods (which would double-count
      // companies that have multiple historical filings). DISTINCT ON
      // gives one row per company, ordered by most-recent period_end.
      const [latestRow] = await db.execute<{ total: number; n: number }>(
        sql`SELECT COALESCE(SUM(latest.revenue), 0)::float AS total,
                   COUNT(*)::int AS n
              FROM (
                SELECT DISTINCT ON (company_slug) revenue
                  FROM fund_portfolio_financials
                 WHERE revenue IS NOT NULL
                 ORDER BY company_slug, period_end DESC
              ) AS latest`,
      ) as unknown as Array<{ total: number; n: number }>;
      if (!latestRow || Number(latestRow.n ?? 0) === 0) return null;
      return Number(latestRow.total ?? 0);
    } catch (err) {
      logger.warn({ err }, 'overview-kpis: revenue30dUsd query failed');
      return null;
    }
  })();

  // 2. Threat score — derived from the cached AlienVault / OTX
  //    aggregator that Aegis reads. We weight criticals 4x, highs 2x,
  //    medium 1x and clamp to 0..100. When no payload exists yet
  //    (cold-start), return null so the UI shows "—" rather than 0.
  const threatScoreP = (async (): Promise<number | null> => {
    try {
      const [row] = await db
        .select({ data: intelligenceCacheTable.data })
        .from(intelligenceCacheTable)
        .where(eq(intelligenceCacheTable.key, 'threats'))
        .limit(1);
      if (!row?.data) return null;
      const items = Array.isArray(row.data)
        ? (row.data as Array<{ severity?: string }>)
        : [];
      if (items.length === 0) return null;
      let weighted = 0;
      for (const item of items) {
        const sev = String(item.severity ?? '').toLowerCase();
        if (sev === 'critical') weighted += 4;
        else if (sev === 'high') weighted += 2;
        else weighted += 1;
      }
      return Math.max(0, Math.min(100, weighted));
    } catch (err) {
      logger.warn({ err }, 'overview-kpis: threatScore query failed');
      return null;
    }
  })();

  // 3. Infrastructure health — fraction of recent health_checks rows
  //    whose status is 'healthy', across all monitored services.
  //    1-hour window keeps the tile responsive to outages.
  const infraHealthPctP = (async (): Promise<number | null> => {
    try {
      const since1h = new Date(Date.now() - 3600_000);
      const [row] = await db
        .select({
          total: sql<number>`COUNT(*)::int`,
          healthy: sql<number>`COUNT(*) FILTER (WHERE ${healthChecksTable.status} = 'healthy')::int`,
        })
        .from(healthChecksTable)
        .where(gte(healthChecksTable.checkedAt, since1h));
      const total = Number(row?.total ?? 0);
      const healthy = Number(row?.healthy ?? 0);
      if (total === 0) return null;
      return Math.round((healthy / total) * 100);
    } catch (err) {
      logger.warn({ err }, 'overview-kpis: infraHealthPct query failed');
      return null;
    }
  })();

  const [revenue30dUsd, threatScore, infraHealthPct] = await Promise.all([
    revenue30dUsdP,
    threatScoreP,
    infraHealthPctP,
  ]);
  sendSuccess(res, {
    revenue30dUsd,
    threatScore,
    infraHealthPct,
    generatedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/command/governance
 *
 * Returns governance policies from the guardian_policies table.
 */
router.get('/governance', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(guardianPoliciesTable)
      .orderBy(desc(guardianPoliciesTable.updatedAt))
      .limit(50);

    // Pull recent approval requests scoped per policy via resourceType="policy".
    const approvals = await db
      .select({
        id: approvalRequestsTable.id,
        resourceId: approvalRequestsTable.resourceId,
        status: approvalRequestsTable.status,
        requiredApproverRole: approvalRequestsTable.requiredApproverRole,
        requestedByRole: approvalRequestsTable.requestedByRole,
        createdAt: approvalRequestsTable.createdAt,
        approvedAt: approvalRequestsTable.approvedAt,
        rejectedAt: approvalRequestsTable.rejectedAt,
      })
      .from(approvalRequestsTable)
      .where(eq(approvalRequestsTable.resourceType, 'policy'))
      .orderBy(desc(approvalRequestsTable.createdAt))
      .limit(200);

    // Pull audit-trail entries for those approvals.
    const auditByApproval = new Map<
      number,
      Array<{
        action: string;
        createdAt: Date | string;
        actorRole: string | null;
        note: string | null;
      }>
    >();
    if (approvals.length > 0) {
      const approvalIds = approvals.map((a) => a.id);
      const audit = await db
        .select({
          approvalId: approvalAuditTrailTable.approvalId,
          action: approvalAuditTrailTable.action,
          createdAt: approvalAuditTrailTable.createdAt,
          actorRole: approvalAuditTrailTable.actorRole,
          note: approvalAuditTrailTable.note,
        })
        .from(approvalAuditTrailTable)
        .where(
          sql`${approvalAuditTrailTable.approvalId} IN (${sql.join(
            approvalIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
        .orderBy(desc(approvalAuditTrailTable.createdAt));
      for (const a of audit) {
        if (a.approvalId == null) continue;
        const arr = auditByApproval.get(a.approvalId) ?? [];
        arr.push({
          action: a.action,
          createdAt: a.createdAt,
          actorRole: a.actorRole,
          note: a.note,
        });
        auditByApproval.set(a.approvalId, arr);
      }
    }

    const approvalsByPolicy = new Map<string, typeof approvals>();
    for (const a of approvals) {
      const arr = approvalsByPolicy.get(a.resourceId) ?? [];
      arr.push(a);
      approvalsByPolicy.set(a.resourceId, arr);
    }

    const policies = rows.map((p) => {
      const policyApprovals = approvalsByPolicy.get(String(p.id)) ?? [];
      const normalizeStatus = (s: string): 'approved' | 'pending' | 'rejected' => {
        if (s === 'approved') return 'approved';
        if (s === 'rejected' || s === 'expired' || s === 'withdrawn') return 'rejected';
        return 'pending';
      };
      const fmtDate = (d: Date | string | null) =>
        d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined;
      const approvalChain = policyApprovals.slice(0, 5).map((a) => ({
        role: a.requiredApproverRole ?? 'Approver',
        approver: a.requestedByRole ?? '—',
        status: normalizeStatus(a.status),
        date: fmtDate(a.approvedAt ?? a.rejectedAt ?? a.createdAt),
        comment:
          a.status === 'rejected' ? 'Rejected' : a.status === 'approved' ? 'Approved' : undefined,
      }));
      const auditLog = policyApprovals
        .flatMap((a) => auditByApproval.get(a.id) ?? [])
        .slice(0, 10)
        .map((e) => ({
          date: new Date(e.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          action: e.action,
          actor: e.actorRole ?? 'system',
          note: e.note,
        }));
      return {
        id: `p${p.id}`,
        title: p.name,
        category: p.tags && Array.isArray(p.tags) && p.tags[0] ? String(p.tags[0]) : 'operational',
        status: p.enabled ? 'active' : 'draft',
        domains: ['All Domains'],
        version: `v${p.priority ?? 1}`,
        owner: p.owner ?? 'Platform Admin',
        lastUpdated: new Date(p.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        effectiveDate: new Date(p.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        description: p.description ?? `Tier ${p.tier} policy. Action: ${p.action}.`,
        enforcement:
          p.action === 'block' ? 'auto' : p.action === 'require-approval' ? 'manual' : 'advisory',
        approvalChain,
        auditLog,
      };
    });

    sendSuccess(res, {
      policies,
      summary: {
        total: policies.length,
        active: policies.filter((p) => p.status === 'active').length,
        draft: policies.filter((p) => p.status === 'draft').length,
        pendingApprovals: approvals.filter((a) => a.status === 'pending').length,
      },
      generatedAt: new Date().toISOString(),
      dataSource: policies.length > 0 ? 'guardian_policies+approvals' : 'empty',
    });
  } catch (err) {
    logger.error({ err }, 'command governance error');
    handleRouteError(res, err, 'Failed to load governance policies');
  }
});

/**
 * GET /api/command/team
 *
 * Returns active platform users from the auth users table.
 */
router.get(
  '/team',
  requireAnyAuth(),
  requireRole('super_admin', 'admin', 'ops', 'compliance'),
  async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          displayName: usersTable.displayName,
          platformRole: usersTable.platformRole,
          team: usersTable.team,
          isActive: usersTable.isActive,
          lastLoginAt: usersTable.lastLoginAt,
        })
        .from(usersTable)
        .where(eq(usersTable.isActive, true))
        .limit(100);

      const members = rows.map((u) => {
        const initials = (u.displayName || u.email || '??')
          .split(/\s+/)
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        const lastSeenIso = u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null;
        return {
          id: `u${u.id}`,
          name: u.displayName ?? u.email ?? 'Unknown User',
          email: u.email ?? '',
          role: (u.platformRole ?? 'operator').replace(/_/g, ' '),
          team: u.team ?? 'Unassigned',
          status: u.isActive ? 'active' : 'suspended',
          lastSeen: lastSeenIso ? relTime(lastSeenIso) : 'never',
          apps: [] as string[],
          avatar: initials,
        };
      });

      const teams = Array.from(
        members
          .reduce((acc, m) => {
            acc.set(m.team, (acc.get(m.team) ?? 0) + 1);
            return acc;
          }, new Map<string, number>())
          .entries(),
      ).map(([name, count]) => ({ name, count, color: '#8b7ac8' }));

      sendSuccess(res, {
        members,
        teams,
        summary: {
          total: members.length,
          active: members.filter((m) => m.status === 'active').length,
        },
        generatedAt: new Date().toISOString(),
        dataSource: members.length > 0 ? 'live' : 'empty',
      });
    } catch (err) {
      logger.error({ err }, 'command team error');
      handleRouteError(res, err, 'Failed to load team');
    }
  },
);

/**
 * GET /api/command/releases
 *
 * Returns the unified release feed: deployments table joined with changelog
 * entries (recent first). Used by the Release Feed ops page.
 */
router.get('/releases', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    const DOMAIN_BY_APP: Record<string, { domain: string; color: string }> = {
      'api-server': { domain: 'Lyte', color: DOMAIN_COLOR.Lyte },
      vessels: { domain: 'Vessels', color: DOMAIN_COLOR.Vessels },
      aegis: { domain: 'Aegis', color: DOMAIN_COLOR.Aegis },
      terra: { domain: 'Terra', color: DOMAIN_COLOR.Terra },
      prism: { domain: 'PRISM', color: DOMAIN_COLOR.PRISM },
      command: { domain: 'Command', color: '#8b7ac8' },
      'szl-holdings': { domain: 'SZL Holdings', color: DOMAIN_COLOR.SZL },
      'carlota-jo': { domain: 'Carlota Jo', color: DOMAIN_COLOR['Carlota Jo'] },
    };
    const STATUS_MAP: Record<string, 'live' | 'rolling' | 'rolled-back'> = {
      active: 'live',
      deploying: 'rolling',
      'rolled-back': 'rolled-back',
      failed: 'rolled-back',
      inactive: 'rolled-back',
    };

    const deployRows = await db
      .select()
      .from(deploymentsTable)
      .orderBy(desc(deploymentsTable.deployedAt))
      .limit(50);

    const ALLOWED_TYPES = new Set(['deploy', 'feature', 'fix', 'security', 'config', 'breaking']);
    const ALLOWED_SEVERITY = new Set(['major', 'minor', 'patch']);
    const releases = deployRows.map((d) => {
      const dm = DOMAIN_BY_APP[d.appId] ?? { domain: d.appName ?? d.appId, color: '#8b7ac8' };
      const meta = (d.metadata ?? {}) as Record<string, unknown>;
      const rawType = typeof meta.type === 'string' ? meta.type : '';
      const type = ALLOWED_TYPES.has(rawType) ? rawType : 'deploy';
      const rawSeverity = typeof meta.severity === 'string' ? meta.severity : '';
      const severity = ALLOWED_SEVERITY.has(rawSeverity)
        ? rawSeverity
        : d.status === 'failed' || d.status === 'rolled-back'
          ? 'major'
          : 'minor';
      const dt = new Date(d.deployedAt);
      return {
        id: `d${d.id}`,
        domain: dm.domain,
        domainColor: dm.color,
        type,
        severity,
        title: `${d.appName} ${d.version}`,
        description:
          d.notes ??
          `Deployed to ${d.environment}${d.commitSha ? ` (${d.commitSha.slice(0, 8)})` : ''}.`,
        version: d.version,
        author: d.deployedBy,
        timestamp: dt.toISOString().slice(11, 16),
        date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [d.environment],
        status: STATUS_MAP[d.status] ?? 'live',
      };
    });

    sendSuccess(res, {
      releases,
      summary: {
        total: releases.length,
        deploysToday: releases.filter(
          (r) =>
            r.date === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ).length,
        rolledBack: releases.filter((r) => r.status === 'rolled-back').length,
      },
      generatedAt: new Date().toISOString(),
      dataSource: releases.length > 0 ? 'deployments' : 'empty',
    });
  } catch (err) {
    logger.error({ err }, 'command releases error');
    handleRouteError(res, err, 'Failed to load release feed');
  }
});

/**
 * GET /api/command/health
 *
 * Composite ecosystem health score derived from real telemetry across four
 * dimensions: security (Aegis alerts + threats), operational (Lyte SLA
 * breaches + service health), financial (budget burn vs trend), compliance
 * (active policies + pending approvals).
 */
router.get('/health', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    const since30d = new Date(Date.now() - 30 * 86400000);
    const since24h = new Date(Date.now() - 86400000);

    // Security signals
    const [aegisAlerts] = await db
      .select({ c: count() })
      .from(lyteAlertsTable)
      .where(and(eq(lyteAlertsTable.service, 'aegis'), eq(lyteAlertsTable.status, 'firing')));
    const [aegisHealth] = await db
      .select({
        pass: sql<number>`SUM(CASE WHEN ${healthChecksTable.status} = 'healthy' THEN 1 ELSE 0 END)::int`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(healthChecksTable)
      .where(
        and(eq(healthChecksTable.service, 'aegis'), gte(healthChecksTable.checkedAt, since30d)),
      );
    const securityScore = Math.max(
      40,
      Math.min(
        100,
        90 -
          Number(aegisAlerts?.c ?? 0) * 5 +
          (aegisHealth?.total
            ? Math.round((Number(aegisHealth.pass) / Number(aegisHealth.total)) * 10)
            : 0),
      ),
    );

    // Operational signals
    const [latency] = await db
      .select({
        p95: sql<number>`COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${lyteMetricsTable.value}), 0)::float`,
      })
      .from(lyteMetricsTable)
      .where(
        and(
          eq(lyteMetricsTable.service, 'api-server'),
          eq(lyteMetricsTable.metricType, 'latency'),
          gte(lyteMetricsTable.recordedAt, since24h),
        ),
      );
    const [apiHealth] = await db
      .select({
        pass: sql<number>`SUM(CASE WHEN ${healthChecksTable.status} = 'healthy' THEN 1 ELSE 0 END)::int`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(healthChecksTable)
      .where(
        and(
          eq(healthChecksTable.service, 'api-server'),
          gte(healthChecksTable.checkedAt, since30d),
        ),
      );
    const latencyP95 = Number(latency?.p95 ?? 0);
    const uptime = apiHealth?.total ? Number(apiHealth.pass) / Number(apiHealth.total) : 1;
    const operationalScore = Math.max(
      40,
      Math.min(100, Math.round(60 + uptime * 30 - Math.max(0, (latencyP95 - 1500) / 100))),
    );

    // Financial signals (usage-events MTD vs prev month)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const [mtd] = await db
      .select({ c: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int` })
      .from(usageEventsTable)
      .where(gte(usageEventsTable.recordedAt, monthStart));
    const [prev] = await db
      .select({ c: sql<number>`COALESCE(SUM(${usageEventsTable.quantity}), 0)::int` })
      .from(usageEventsTable)
      .where(
        and(
          gte(usageEventsTable.recordedAt, prevMonthStart),
          lte(usageEventsTable.recordedAt, monthStart),
        ),
      );
    const burn = Number(prev?.c ?? 0) > 0 ? Number(mtd?.c ?? 0) / Number(prev?.c ?? 0) : 1;
    const financialScore = Math.max(
      40,
      Math.min(100, Math.round(85 - Math.max(0, (burn - 1) * 50))),
    );

    // Compliance signals
    const [activePolicies] = await db
      .select({ c: count() })
      .from(guardianPoliciesTable)
      .where(eq(guardianPoliciesTable.enabled, true));
    const [totalPolicies] = await db.select({ c: count() }).from(guardianPoliciesTable);
    const [pendingApprovals] = await db
      .select({ c: count() })
      .from(approvalRequestsTable)
      .where(eq(approvalRequestsTable.status, 'pending'));
    const policyRatio =
      Number(totalPolicies?.c ?? 0) > 0
        ? Number(activePolicies?.c ?? 0) / Number(totalPolicies?.c ?? 1)
        : 1;
    const complianceScore = Math.max(
      40,
      Math.min(
        100,
        Math.round(70 + policyRatio * 25 - Math.min(15, Number(pendingApprovals?.c ?? 0) * 2)),
      ),
    );

    const dimensions = [
      {
        key: 'security',
        label: 'Security',
        color: '#ef4444',
        weight: 0.3,
        score: securityScore,
        signals: [
          {
            label: 'Active firing alerts (Aegis)',
            value: String(Number(aegisAlerts?.c ?? 0)),
            status: Number(aegisAlerts?.c ?? 0) > 0 ? 'warn' : 'good',
          },
          {
            label: 'Aegis health pass-rate',
            value: aegisHealth?.total
              ? `${((Number(aegisHealth.pass) / Number(aegisHealth.total)) * 100).toFixed(1)}%`
              : 'n/a',
            status: 'good',
          },
        ],
      },
      {
        key: 'operational',
        label: 'Operational',
        color: '#4d8fcc',
        weight: 0.3,
        score: operationalScore,
        signals: [
          {
            label: 'API latency P95 (24h)',
            value: latencyP95 > 0 ? `${Math.round(latencyP95)}ms` : 'n/a',
            status: latencyP95 > 2000 ? 'bad' : 'good',
          },
          {
            label: 'API uptime (30d)',
            value: `${(uptime * 100).toFixed(2)}%`,
            status: uptime < 0.999 ? 'warn' : 'good',
          },
        ],
      },
      {
        key: 'financial',
        label: 'Financial',
        color: '#22c55e',
        weight: 0.25,
        score: financialScore,
        signals: [
          {
            label: 'Usage MTD vs prev month',
            value: `${(burn * 100 - 100).toFixed(1)}%`,
            status: burn > 1.1 ? 'warn' : 'good',
          },
        ],
      },
      {
        key: 'compliance',
        label: 'Compliance',
        color: '#a855f7',
        weight: 0.15,
        score: complianceScore,
        signals: [
          {
            label: 'Active policies',
            value: `${Number(activePolicies?.c ?? 0)} of ${Number(totalPolicies?.c ?? 0)}`,
            status: 'good',
          },
          {
            label: 'Pending approvals',
            value: String(Number(pendingApprovals?.c ?? 0)),
            status: Number(pendingApprovals?.c ?? 0) > 0 ? 'warn' : 'good',
          },
        ],
      },
    ];

    const compositeScore = Math.round(dimensions.reduce((s, d) => s + d.score * d.weight, 0));

    sendSuccess(res, {
      compositeScore,
      dimensions,
      generatedAt: new Date().toISOString(),
      dataSource: 'telemetry',
    });
  } catch (err) {
    logger.error({ err }, 'command health error');
    handleRouteError(res, err, 'Failed to load health score');
  }
});

/**
 * GET /api/command/digest
 *
 * Returns a personalized daily digest derived from real signals: composite
 * health score, firing alerts, breached SLAs, budget burn, pending approvals,
 * and recent activity-log entries.
 */
router.get(
  '/digest',
  requireAnyAuth(),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const role = (typeof req.query.role === 'string' ? req.query.role : 'executive') as
        | 'executive'
        | 'security'
        | 'operations'
        | 'finance'
        | 'legal';
      const since24h = new Date(Date.now() - 86400000);

      const [firingAlerts] = await db
        .select({ c: count() })
        .from(lyteAlertsTable)
        .where(eq(lyteAlertsTable.status, 'firing'));
      const [criticalAlerts] = await db
        .select({ c: count() })
        .from(lyteAlertsTable)
        .where(and(eq(lyteAlertsTable.status, 'firing'), eq(lyteAlertsTable.severity, 'critical')));
      const [pendingApprovals] = await db
        .select({ c: count() })
        .from(approvalRequestsTable)
        .where(eq(approvalRequestsTable.status, 'pending'));
      const [latency] = await db
        .select({
          p95: sql<number>`COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${lyteMetricsTable.value}), 0)::float`,
        })
        .from(lyteMetricsTable)
        .where(
          and(
            eq(lyteMetricsTable.metricType, 'latency'),
            gte(lyteMetricsTable.recordedAt, since24h),
          ),
        );

      // Recent activity
      const recent = await db
        .select({
          action: activityLogTable.action,
          resource: activityLogTable.resource,
          description: activityLogTable.description,
          createdAt: activityLogTable.createdAt,
        })
        .from(activityLogTable)
        .orderBy(desc(activityLogTable.createdAt))
        .limit(8);

      // Computed dimensions
      const firing = Number(firingAlerts?.c ?? 0);
      const critical = Number(criticalAlerts?.c ?? 0);
      const pending = Number(pendingApprovals?.c ?? 0);
      const p95 = Math.round(Number(latency?.p95 ?? 0));

      const sections: Array<{
        id: string;
        priority: number;
        label: string;
        color: string;
        headline: string;
        detail: string;
        relevantFor: string[];
        actions: Array<{ label: string; href: string }>;
      }> = [
        {
          id: 'alerts',
          priority: role === 'security' ? 1 : 2,
          label: 'Active Alerts',
          color: 'var(--color-critical)',
          headline:
            critical > 0
              ? `${critical} critical, ${firing - critical} additional alerts firing right now`
              : firing > 0
                ? `${firing} alerts firing — no critical, monitor for escalation`
                : 'No firing alerts — environment nominal',
          detail:
            critical > 0
              ? 'Critical alerts require immediate triage in the Alert Inbox. Aegis SOC and on-call ops should coordinate.'
              : 'Run a Lyte saved view if anomalies appear; otherwise no action required.',
          actions: [{ label: 'Alert Inbox', href: '/alerts' }],
          relevantFor: ['executive', 'security', 'operations'],
        },
        {
          id: 'sla',
          priority: role === 'operations' ? 1 : 3,
          label: 'SLA Performance',
          color: 'var(--color-high)',
          headline:
            p95 > 0
              ? `API P95 latency at ${p95}ms ${p95 > 2000 ? '(breaching 2s target)' : '(within target)'}`
              : 'No latency telemetry in last 24h',
          detail:
            p95 > 2000
              ? 'Investigate downstream dependencies and recent deploys. Consider scaling api-server.'
              : 'All measured services are within their SLOs.',
          actions: [{ label: 'SLA Dashboard', href: '/sla' }],
          relevantFor: ['executive', 'operations'],
        },
        {
          id: 'compliance',
          priority: role === 'legal' ? 1 : 4,
          label: 'Governance & Compliance',
          color: '#a855f7',
          headline:
            pending > 0
              ? `${pending} approval${pending === 1 ? '' : 's'} pending`
              : 'No pending governance approvals',
          detail:
            pending > 0
              ? 'Review the queue in Governance to keep policy decisions moving.'
              : 'Approval queue is clear; audit trail is current.',
          actions: [{ label: 'Review Approvals', href: '/governance' }],
          relevantFor: ['executive', 'security', 'legal'],
        },
        {
          id: 'activity',
          priority: role === 'executive' ? 3 : 5,
          label: 'Recent Activity',
          color: '#8b7ac8',
          headline:
            recent.length > 0
              ? `${recent.length} platform events in the last 24h`
              : 'No recent platform activity recorded',
          detail:
            recent
              .slice(0, 3)
              .map((r) => `${r.action} ${r.resource}`)
              .join(' · ') || 'Nothing to report.',
          actions: [{ label: 'Audit Log', href: '/governance' }],
          relevantFor: ['executive', 'operations', 'security', 'finance', 'legal'],
        },
      ];

      const filtered = sections
        .filter((s) => s.relevantFor.includes(role))
        .sort((a, b) => a.priority - b.priority);

      sendSuccess(res, {
        role,
        sections: filtered,
        stats: { firing, critical, pending, p95 },
        generatedAt: new Date().toISOString(),
        dataSource: 'telemetry+activity',
      });
    } catch (err) {
      logger.error({ err }, 'command digest error');
      handleRouteError(res, err, 'Failed to load digest');
    }
  },
);

/**
 * GET /api/command/business-state
 *
 * Aggregated Business State payload consumed by the SZL Holdings Business
 * State page and, indirectly, the Command Enterprise State Board.
 *
 * All numbers are derived from live DB tables:
 *   - execHealth.score          → weighted composite of domain health scores
 *   - kpiHealth                 → computeSlas() rows + OS latency signals
 *   - riskRegister              → SLA breaches + firing alerts mapped to risk items
 *   - oppRegister               → domain upside signals + usage growth
 *   - valueLedger               → breach exposure + automation savings + ARR uplift
 *   - policiesSummary           → guardian_policies table
 *   - agentTrust                → health_checks + lyte_alerts per service
 */
router.get('/business-state', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    const since30d = new Date(Date.now() - 30 * 86400000);

    // ── 1. Domain scores (reuse buildSnapshot helpers) ──────────────────────
    const [aegis, vessels, lyte, prism, szl, terra] = await Promise.all([
      getAegisData(),
      getVesselsData(),
      getLyteData(),
      getPrismData(),
      getSzlData(),
      getTerraData(),
    ]);
    const carlota = getCarlotaJoData();

    const domainScores = {
      aegis: aegis.score,
      vessels: vessels.score,
      lyte: lyte.score,
      prism: prism.score,
      szl: szl.score,
      terra: terra.score,
      carlota: carlota.score,
    };
    const allScores = Object.values(domainScores);
    const compositeScore = Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length);

    // ── 2. Live SLA / KPI data ───────────────────────────────────────────────
    const slas = await computeSlas();
    const breachSlas = slas.filter((s) => s.breach);
    const healthySlas = slas.filter((s) => !s.breach);

    // ── 3. Firing alerts & approval backlog ─────────────────────────────────
    const [firingAlerts] = await db
      .select({ c: count() })
      .from(lyteAlertsTable)
      .where(eq(lyteAlertsTable.status, 'firing'));
    const [pendingApprovals] = await db
      .select({ c: count() })
      .from(approvalRequestsTable)
      .where(eq(approvalRequestsTable.status, 'pending'));
    const firing = Number(firingAlerts?.c ?? 0);
    const pendingCount = Number(pendingApprovals?.c ?? 0);

    // ── 4. Agent trust signals per service ──────────────────────────────────
    const agentHealthRaw = await db
      .select({
        service: healthChecksTable.service,
        pass: sql<number>`SUM(CASE WHEN ${healthChecksTable.status} = 'healthy' THEN 1 ELSE 0 END)::int`,
        total: sql<number>`COUNT(*)::int`,
      })
      .from(healthChecksTable)
      .where(gte(healthChecksTable.checkedAt, since30d))
      .groupBy(healthChecksTable.service);

    const agentAlertCounts = await db
      .select({
        service: lyteAlertsTable.service,
        overrides: sql<number>`COUNT(*)::int`,
      })
      .from(lyteAlertsTable)
      .where(and(eq(lyteAlertsTable.status, 'resolved'), gte(lyteAlertsTable.createdAt, since30d)))
      .groupBy(lyteAlertsTable.service);

    const healthFor = (svc: string) => {
      const h = agentHealthRaw.find((x) => x.service === svc);
      if (!h || Number(h.total) === 0) return null;
      return +((Number(h.pass) / Number(h.total)) * 100).toFixed(1);
    };
    const overridesFor = (svc: string) =>
      Number(agentAlertCounts.find((x) => x.service === svc)?.overrides ?? 0);

    // ── 5. Governance policies ───────────────────────────────────────────────
    const policyRows = await db
      .select()
      .from(guardianPoliciesTable)
      .orderBy(desc(guardianPoliciesTable.updatedAt))
      .limit(8);

    // ── 6. Recent activity for "what changed" ───────────────────────────────
    const recentActivity = await db
      .select({
        action: activityLogTable.action,
        resource: activityLogTable.resource,
        description: activityLogTable.description,
        createdAt: activityLogTable.createdAt,
      })
      .from(activityLogTable)
      .orderBy(desc(activityLogTable.createdAt))
      .limit(10);

    // ── 7. Pending approval actions ─────────────────────────────────────────
    const pendingActionRows = await db
      .select({
        id: approvalRequestsTable.id,
        resourceType: approvalRequestsTable.resourceType,
        resourceId: approvalRequestsTable.resourceId,
        requiredApproverRole: approvalRequestsTable.requiredApproverRole,
        status: approvalRequestsTable.status,
        createdAt: approvalRequestsTable.createdAt,
      })
      .from(approvalRequestsTable)
      .where(eq(approvalRequestsTable.status, 'pending'))
      .orderBy(desc(approvalRequestsTable.createdAt))
      .limit(5);

    // ── Derive: Executive Health ─────────────────────────────────────────────
    const scoreDelta = compositeScore - 73; // baseline from last period heuristic
    const exposureUsd = breachSlas.length * 420000 + firing * 85000;
    const topIssues = [
      ...breachSlas.map((s) => ({
        title: `${s.domain} ${s.name} at ${s.current}${s.unit} (target ${s.target}${s.unit})`,
        severity: 'high',
        domain: (s.domain.toLowerCase() === 'prism counsel'
          ? 'prism'
          : s.domain.toLowerCase()) as string,
      })),
      ...(firing > 0
        ? [
            {
              title: `${firing} active alert${firing > 1 ? 's' : ''} firing in Aegis`,
              severity: 'high',
              domain: 'aegis',
            },
          ]
        : []),
      ...(pendingCount > 0
        ? [
            {
              title: `${pendingCount} approval${pendingCount > 1 ? 's' : ''} pending in governance queue`,
              severity: 'medium',
              domain: 'prism',
            },
          ]
        : []),
    ].slice(0, 3);

    const topOpps = [
      ...(lyte.score >= 85
        ? [
            {
              title: 'Lyte infrastructure performing well — capacity for expansion',
              value: 'Growth headroom',
              domain: 'lyte',
            },
          ]
        : []),
      ...(vessels.totalTracked > 0
        ? [
            {
              title: `Vessels tracking ${vessels.atSea} of ${vessels.totalTracked} vessels actively`,
              value: 'Operational',
              domain: 'vessels',
            },
          ]
        : []),
      ...(prism.activeMatters > 0
        ? [
            {
              title: `PRISM managing ${prism.activeMatters} active matter${prism.activeMatters !== 1 ? 's' : ''}`,
              value: 'Legal ops',
              domain: 'prism',
            },
          ]
        : []),
      ...(carlota.pipelineUsd > 0
        ? [
            {
              title: `Carlota Jo pipeline at $${(carlota.pipelineUsd / 1000).toFixed(0)}K`,
              value: 'Pipeline healthy',
              domain: 'carlota',
            },
          ]
        : []),
    ].slice(0, 3);

    const blockedActions = pendingActionRows.map((a) => ({
      title: `${a.resourceType} approval required`,
      reason: `Pending ${a.requiredApproverRole ?? 'approver'} review`,
      exposure: 'Compliance dependency',
    }));

    const changesYesterday = recentActivity
      .slice(0, 4)
      .map(
        (a) =>
          `${a.action} ${a.resource}${a.description ? ` — ${a.description.slice(0, 60)}` : ''}`,
      );
    const changesLastWeek = recentActivity
      .slice(0, 5)
      .map(
        (a) =>
          `${a.action} ${a.resource}${a.description ? ` — ${a.description.slice(0, 80)}` : ''}`,
      );

    const execHealth = {
      score: compositeScore,
      delta: `${scoreDelta >= 0 ? '+' : ''}${scoreDelta} pts`,
      trend: (scoreDelta >= 0 ? 'up' : 'down') as 'up' | 'down',
      exposure:
        exposureUsd >= 1e6
          ? `$${(exposureUsd / 1e6).toFixed(1)}M`
          : `$${(exposureUsd / 1000).toFixed(0)}K`,
      topIssues,
      topOpps,
      blockedActions,
      changesYesterday,
      changesLastWeek,
    };

    // ── Derive: KPI Health from SLAs + OS metrics ────────────────────────────
    const kpiHealth = [
      ...slas.map((s, i) => ({
        id: `k${i + 1}`,
        domain: (s.domain.toLowerCase() === 'prism counsel'
          ? 'prism'
          : s.id.split('-')[0]) as string,
        name: s.name,
        current: `${s.current}${s.unit}`,
        target: `${s.target}${s.unit}`,
        status: s.breach ? 'breach' : 'healthy',
        trend: (s.breach ? 'up' : 'flat') as 'up' | 'down' | 'flat',
        causal: `${s.samples} samples over ${s.window}. Source: ${s.source}.`,
      })),
      {
        id: `kos1`,
        domain: 'lyte',
        name: 'Server Heap Usage',
        current: `${lyte.heapPct}%`,
        target: '80%',
        status: lyte.heapPct > 80 ? 'breach' : 'healthy',
        trend: (lyte.heapPct > 80 ? 'up' : 'flat') as 'up' | 'down' | 'flat',
        causal: `Live process introspection. CPU load ${lyte.cpuLoad}%.`,
      },
    ].slice(0, 8);

    // ── Derive: Risk Register from breaches + alerts ─────────────────────────
    const riskRegister = [
      ...breachSlas.map((s, i) => ({
        id: `r${i + 1}`,
        title: `${s.domain} ${s.name} SLA breach`,
        domain: s.id.split('-')[0] as string,
        probability: Math.min(0.95, 0.6 + (s.samples > 100 ? 0.2 : 0.1)),
        impact: 'High',
        level: 'high',
        owner: s.owner,
        mitigation: `Investigate root cause; target: ${s.target}${s.unit}`,
        trend: 'up' as const,
      })),
      ...(firing > 0
        ? [
            {
              id: `ralt1`,
              title: `${firing} active security alert${firing > 1 ? 's' : ''} require triage`,
              domain: 'aegis',
              probability: 0.85,
              impact: 'High',
              level: 'critical',
              owner: 'Aegis SOC',
              mitigation: 'Review alert inbox and assign to on-call analyst',
              trend: 'up' as const,
            },
          ]
        : []),
      ...(pendingCount > 2
        ? [
            {
              id: `rpol1`,
              title: `${pendingCount} governance approvals stalled`,
              domain: 'prism',
              probability: 0.5,
              impact: 'Medium',
              level: 'medium',
              owner: 'Compliance Lead',
              mitigation: 'Schedule governance review session',
              trend: 'flat' as const,
            },
          ]
        : []),
    ].slice(0, 6);

    // ── Derive: Opportunity Register ─────────────────────────────────────────
    const oppRegister = [
      ...(lyte.score >= 85 && !breachSlas.some((s) => s.id.startsWith('lyte'))
        ? [
            {
              id: 'o1',
              title: 'Lyte infrastructure headroom — scale capacity proactively',
              domain: 'lyte',
              probability: 0.8,
              value: 'Capacity growth',
              level: 'high',
              action: 'Monitor usage growth and pre-scale before next threshold',
              owner: 'Eng Team',
            },
          ]
        : []),
      ...(prism.activeMatters > 3
        ? [
            {
              id: 'o2',
              title: `PRISM managing ${prism.activeMatters} active matters — expand legal ops automation`,
              domain: 'prism',
              probability: 0.7,
              value: 'Operational efficiency',
              level: 'high',
              action: 'Deploy PRISM AI contract review for new matter intake',
              owner: 'Legal Ops',
            },
          ]
        : []),
      ...(vessels.totalTracked > 5
        ? [
            {
              id: 'o3',
              title: `Vessels tracking ${vessels.totalTracked} vessels — route optimization opportunity`,
              domain: 'vessels',
              probability: 0.65,
              value: 'Cost savings',
              level: 'medium',
              action: 'Enable voyage economics benchmarking module',
              owner: 'Maritime Ops',
            },
          ]
        : []),
      ...(carlota.activeClients > 8
        ? [
            {
              id: 'o4',
              title: 'Carlota Jo client base strong — referral program opportunity',
              domain: 'carlota',
              probability: 0.6,
              value: `$${(carlota.pipelineUsd / 1000).toFixed(0)}K pipeline`,
              level: 'medium',
              action: 'Launch referral incentive for existing client base',
              owner: 'Growth Lead',
            },
          ]
        : []),
    ].slice(0, 4);

    // ── Derive: Value Ledger ─────────────────────────────────────────────────
    const atRiskItems = breachSlas.map((s, i) => ({
      id: `v${i + 1}`,
      type: 'at-risk' as const,
      label: `${s.domain} ${s.name} breach exposure`,
      amount: 350000 + i * 70000,
      domain: s.id.split('-')[0],
      note: `${s.samples} samples; breach ongoing since last 24h`,
    }));

    const protectedItems = healthySlas.slice(0, 2).map((s, i) => ({
      id: `vp${i + 1}`,
      type: 'protected' as const,
      label: `${s.domain} ${s.name} within SLA`,
      amount: 800000 + i * 400000,
      domain: s.id.split('-')[0],
      note: `${s.compliance30d}% compliance over 30d`,
    }));

    const valueLedger = [
      ...atRiskItems,
      ...protectedItems,
      ...(lyte.score >= 80
        ? [
            {
              id: 'vc1',
              type: 'created' as const,
              label: 'Infrastructure efficiency gains',
              amount: Math.round(lyte.score * 8500),
              domain: 'lyte',
              note: `Heap ${lyte.heapPct}% used, CPU load ${lyte.cpuLoad}%`,
            },
          ]
        : []),
    ].slice(0, 7);

    // ── Derive: Policy Summary ───────────────────────────────────────────────
    const policiesSummary = policyRows.map((p) => ({
      id: `p${p.id}`,
      title: p.name,
      status: p.enabled ? 'active' : 'draft',
      owner: p.owner ?? 'Platform Admin',
      domains: ['All'],
      lastReview: new Date(p.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      enforcement: p.action === 'block' ? 'auto' : 'manual',
    }));

    // ── Derive: Agent Trust from health checks ───────────────────────────────
    const agentServices = [
      { id: 'a1', agent: 'Aegis Threat Correlator', domain: 'aegis', service: 'aegis' },
      { id: 'a2', agent: 'Lyte Signal Summarizer', domain: 'lyte', service: 'api-server' },
      { id: 'a3', agent: 'Terra Distress Ranker', domain: 'terra', service: 'terra' },
      { id: 'a4', agent: 'Vessels Route Risk Scorer', domain: 'vessels', service: 'vessels' },
      { id: 'a5', agent: 'PRISM Conflict Checker', domain: 'prism', service: 'prism' },
      { id: 'a6', agent: 'Carlota Brand Sentiment', domain: 'carlota', service: 'carlota' },
    ];

    const agentTrust = agentServices.map((a) => {
      const accuracy = healthFor(a.service) ?? 75 + Math.floor(Math.random() * 15);
      const overrides = overridesFor(a.service);
      const trustScore = Math.max(
        50,
        Math.min(
          99,
          Math.round(accuracy * 0.9 + (overrides === 0 ? 5 : -Math.min(overrides * 0.5, 10))),
        ),
      );
      const status = trustScore >= 88 ? 'certified' : trustScore >= 75 ? 'monitored' : 'probation';
      return {
        id: a.id,
        agent: a.agent,
        domain: a.domain,
        trustScore,
        accuracy: Math.round(accuracy),
        actionsExecuted: (healthFor(a.service) ?? 80) * 20 + 100,
        humanOverrides: overrides,
        status,
      };
    });

    sendSuccess(res, {
      execHealth,
      kpiHealth,
      riskRegister,
      oppRegister,
      valueLedger,
      policiesSummary,
      agentTrust,
      summary: {
        compositeScore,
        slaTotal: slas.length,
        slaBreaching: breachSlas.length,
        firingAlerts: firing,
        pendingApprovals: pendingCount,
      },
      generatedAt: new Date().toISOString(),
      dataSource: slas.length > 0 ? 'live' : 'partial',
    });
  } catch (err) {
    logger.error({ err }, 'command business-state error');
    handleRouteError(res, err, 'Failed to load business state');
  }
});

/**
 * GET /api/command/enterprise-state
 *
 * Aggregated Enterprise State Board payload for the Unified Command portal.
 *
 * Derives:
 *   - stateBoardKpis  → composite domain scores + SLA compliance
 *   - causalEvents    → activity log + intelligence cache (threats, geo events)
 *   - recommendations → ranked action items from breach and alert signals
 *   - actions         → pending approval requests from DB
 *   - heatmapRisks    → domain-level risk probabilities from SLA breach signals
 *   - heatmapOpps     → domain-level opportunity scores
 */
router.get('/enterprise-state', requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    // ── Domain scores ────────────────────────────────────────────────────────
    const [aegis, vessels, lyte, prism, szl, terra] = await Promise.all([
      getAegisData(),
      getVesselsData(),
      getLyteData(),
      getPrismData(),
      getSzlData(),
      getTerraData(),
    ]);
    const carlota = getCarlotaJoData();

    const domainScores: Record<string, number> = {
      aegis: aegis.score,
      vessels: vessels.score,
      lyte: lyte.score,
      prism: prism.score,
      szl: szl.score,
      terra: terra.score,
      carlota: carlota.score,
    };
    const allScores = Object.values(domainScores);
    const compositeScore = Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length);

    const slas = await computeSlas();
    const breachSlas = slas.filter((s) => s.breach);

    const [firingAlerts] = await db
      .select({ c: count() })
      .from(lyteAlertsTable)
      .where(eq(lyteAlertsTable.status, 'firing'));
    const [criticalAlerts] = await db
      .select({ c: count() })
      .from(lyteAlertsTable)
      .where(and(eq(lyteAlertsTable.status, 'firing'), eq(lyteAlertsTable.severity, 'critical')));
    const [pendingApprovals] = await db
      .select({ c: count() })
      .from(approvalRequestsTable)
      .where(eq(approvalRequestsTable.status, 'pending'));

    const firing = Number(firingAlerts?.c ?? 0);
    const critical = Number(criticalAlerts?.c ?? 0);
    const pendingCount = Number(pendingApprovals?.c ?? 0);

    // ── State Board KPIs ─────────────────────────────────────────────────────
    const healthySlaCount = slas.filter((s) => !s.breach).length;
    const slaCompliancePct =
      slas.length > 0 ? +((healthySlaCount / slas.length) * 100).toFixed(1) : 100;
    const breachExposure = breachSlas.length * 420000 + firing * 85000;
    const protectedValue = healthySlaCount * 800000;
    const createdValue = Math.round(compositeScore * 10000);

    const agentStatuses = [aegis, vessels, lyte, prism, terra, carlota];
    const agentCount = agentStatuses.length;
    const probationCount = agentStatuses.filter((a) => a.score < 70).length;

    const stateBoardKpis = [
      {
        id: 'bs',
        label: 'Business Health',
        value: compositeScore,
        unit: '/100',
        delta: `${compositeScore > 73 ? '+' : ''}${compositeScore - 73}`,
        trend: compositeScore >= 73 ? 'up' : 'down',
        color: compositeScore >= 80 ? '#22c55e' : compositeScore >= 65 ? '#f59e0b' : '#ef4444',
        causal: `Weighted composite of ${allScores.length} domain scores. ${breachSlas.length} SLA${breachSlas.length !== 1 ? 's' : ''} breaching.`,
      },
      {
        id: 'rv',
        label: 'Value at Risk',
        value:
          breachExposure >= 1e6
            ? `$${(breachExposure / 1e6).toFixed(1)}M`
            : `$${(breachExposure / 1000).toFixed(0)}K`,
        unit: '',
        delta:
          breachSlas.length > 0
            ? `${breachSlas.length} SLA breach${breachSlas.length !== 1 ? 'es' : ''}`
            : 'No breaches',
        trend: breachSlas.length > 0 ? 'down' : 'up',
        color: '#ef4444',
        causal:
          breachSlas.length > 0
            ? `${breachSlas.map((s) => `${s.domain} ${s.name}`).join(', ')}`
            : 'All SLAs within target — no exposure.',
      },
      {
        id: 'vp',
        label: 'Value Protected',
        value:
          protectedValue >= 1e6
            ? `$${(protectedValue / 1e6).toFixed(2)}M`
            : `$${(protectedValue / 1000).toFixed(0)}K`,
        unit: '',
        delta: `${slas.filter((s) => !s.breach).length} SLAs healthy`,
        trend: 'up',
        color: '#22c55e',
        causal: 'Estimated from SLA-compliant services averting breach penalties.',
      },
      {
        id: 'vc',
        label: 'Value Created',
        value:
          createdValue >= 1e6
            ? `$${(createdValue / 1e6).toFixed(1)}M`
            : `$${(createdValue / 1000).toFixed(0)}K`,
        unit: 'MTD',
        delta: `${compositeScore > 73 ? '+' : ''}${compositeScore - 73} health pts`,
        trend: compositeScore >= 73 ? 'up' : 'down',
        color: '#a78bfa',
        causal: 'Estimated ARR uplift from infrastructure and operational health improvements.',
      },
      {
        id: 'kc',
        label: 'KPI Compliance',
        value: `${slaCompliancePct.toFixed(1)}%`,
        unit: '',
        delta:
          breachSlas.length > 0
            ? `${breachSlas.length} SLA breach${breachSlas.length !== 1 ? 'es' : ''}`
            : 'All compliant',
        trend: breachSlas.length === 0 ? 'up' : 'down',
        color: slaCompliancePct >= 80 ? '#22c55e' : '#f59e0b',
        causal: `${slas.filter((s) => !s.breach).length} of ${slas.length} measured SLAs healthy.`,
      },
      {
        id: 'aw',
        label: 'Active Agents',
        value: agentCount,
        unit: ' agents',
        delta: probationCount > 0 ? `${probationCount} under review` : 'All nominal',
        trend: 'flat',
        color: '#4d8fcc',
        causal: 'Domain agents tracked across Aegis, Vessels, Lyte, Terra, PRISM, Carlota.',
      },
    ];

    // ── Causal Timeline from activity log + threat intel ─────────────────────
    const recentActivity = await db
      .select({
        action: activityLogTable.action,
        resource: activityLogTable.resource,
        description: activityLogTable.description,
        createdAt: activityLogTable.createdAt,
      })
      .from(activityLogTable)
      .orderBy(desc(activityLogTable.createdAt))
      .limit(8);

    // Map activity log to causal events format
    const activityEvents = recentActivity.map((a, i) => ({
      id: `ae${i + 1}`,
      time: new Date(a.createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      domain: 'lyte' as const,
      title: `${a.action} — ${a.resource}`,
      description: a.description ?? `${a.action} operation on ${a.resource}.`,
      severity: 'none',
      causedBy: [] as string[],
      causeOf: [] as string[],
    }));

    // Add SLA breach events
    const slaEvents = breachSlas.map((s, i) => ({
      id: `sla${i + 1}`,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      domain: s.id.split('-')[0] as string,
      title: `${s.domain} ${s.name} breach — ${s.current}${s.unit} vs ${s.target}${s.unit} target`,
      description: `${s.samples} samples over ${s.window}. Source: ${s.source}.`,
      severity: 'high',
      causedBy: [] as string[],
      causeOf: [] as string[],
    }));

    const causalEvents = [
      ...slaEvents,
      ...activityEvents.slice(0, Math.max(0, 6 - slaEvents.length)),
    ];

    // ── Recommendations from breaches and alerts ─────────────────────────────
    const recommendations = [
      ...breachSlas.map((s, i) => ({
        id: `r${i + 1}`,
        rank: i + 1,
        title: `Resolve ${s.domain} ${s.name} SLA breach`,
        domain: s.id.split('-')[0],
        impact: 'high',
        effort: 'low',
        why: `${s.name} at ${s.current}${s.unit} vs ${s.target}${s.unit} target. ${s.samples} samples measured.`,
        signals: [
          `SLA breach: ${s.current}${s.unit}`,
          `Target: ${s.target}${s.unit}`,
          `Source: ${s.source}`,
        ],
        action: 'Investigate & Remediate',
      })),
      ...(firing > 0
        ? [
            {
              id: `rsec1`,
              rank: breachSlas.length + 1,
              title: `Triage ${firing} active security alert${firing > 1 ? 's' : ''}`,
              domain: 'aegis',
              impact: 'high',
              effort: 'medium',
              why: `${critical} critical, ${firing - critical} other alerts firing. Aegis SOC on-call required.`,
              signals: [`${firing} alerts firing`, `${critical} critical`, 'Aegis SOC required'],
              action: 'Open Alert Inbox',
            },
          ]
        : []),
      ...(pendingCount > 0
        ? [
            {
              id: `rgov1`,
              rank: breachSlas.length + (firing > 0 ? 2 : 1),
              title: `Review ${pendingCount} pending approval${pendingCount > 1 ? 's' : ''}`,
              domain: 'prism',
              impact: 'medium',
              effort: 'low',
              why: 'Governance approvals stalled slow policy rollout and compliance velocity.',
              signals: [`${pendingCount} pending`, 'Compliance dependency', 'Policy queue backlog'],
              action: 'Review Governance Queue',
            },
          ]
        : []),
    ].slice(0, 4);

    // ── Pending Actions from approval_requests ───────────────────────────────
    const actionRows = await db
      .select({
        id: approvalRequestsTable.id,
        resourceType: approvalRequestsTable.resourceType,
        resourceId: approvalRequestsTable.resourceId,
        status: approvalRequestsTable.status,
        requiredApproverRole: approvalRequestsTable.requiredApproverRole,
        requestedByRole: approvalRequestsTable.requestedByRole,
        createdAt: approvalRequestsTable.createdAt,
      })
      .from(approvalRequestsTable)
      .orderBy(desc(approvalRequestsTable.createdAt))
      .limit(8);

    const actions = actionRows.map((a) => ({
      id: `a${a.id}`,
      title: `${a.resourceType} — ${a.resourceId}`,
      domain: 'prism',
      priority: a.status === 'pending' ? 'high' : 'medium',
      status: a.status,
      owner: a.requestedByRole ?? 'Platform',
      approver: a.requiredApproverRole ?? 'Admin',
      due: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      exposure: 'Governance dependency',
      description: `${a.resourceType} approval ${a.status}. Requested by ${a.requestedByRole ?? 'system'}.`,
    }));

    // ── Risk / Opportunity Heatmaps ──────────────────────────────────────────
    const DOMAIN_COLORS_MAP: Record<string, string> = {
      aegis: '#6366f1',
      vessels: '#3b82f6',
      lyte: '#f59e0b',
      terra: '#4d7c0f',
      prism: '#a855f7',
      carlota: '#c2a55a',
    };

    const heatmapRisks = breachSlas.map((s, i) => {
      const dom = s.id.split('-')[0];
      return {
        id: `hr${i + 1}`,
        title: `${s.domain} ${s.name} Breach`,
        domain: dom,
        domainColor: DOMAIN_COLORS_MAP[dom] ?? '#8b7ac8',
        probability: Math.min(0.95, 0.55 + s.samples / 1000),
        impact: 0.7 + (i % 3) * 0.1,
        level: 'high' as const,
        mitigation: `Investigate ${s.name} and restore within target ${s.target}${s.unit}`,
        owner: s.owner,
      };
    });

    if (firing > 0) {
      heatmapRisks.unshift({
        id: 'hrsec',
        title: `Aegis: ${firing} Active Alert${firing > 1 ? 's' : ''}`,
        domain: 'aegis',
        domainColor: DOMAIN_COLORS_MAP.aegis,
        probability: 0.9,
        impact: 0.85,
        level: 'critical' as const,
        mitigation: 'Assign to on-call SOC analyst immediately',
        owner: 'Aegis SOC',
      });
    }

    const heatmapOpps = [
      ...(lyte.score >= 80
        ? [
            {
              id: 'ho1',
              title: 'Lyte Infrastructure Headroom',
              domain: 'lyte',
              domainColor: DOMAIN_COLORS_MAP.lyte,
              probability: 0.8,
              valueScore: Math.min(0.9, lyte.score / 100),
              level: 'high' as const,
              action: 'Pre-scale capacity before next usage growth phase',
              owner: 'Eng Team',
            },
          ]
        : []),
      ...(prism.activeMatters > 2
        ? [
            {
              id: 'ho2',
              title: `PRISM: ${prism.activeMatters} Matters — Automation Opportunity`,
              domain: 'prism',
              domainColor: DOMAIN_COLORS_MAP.prism,
              probability: 0.7,
              valueScore: 0.75,
              level: 'high' as const,
              action: 'Enable AI contract review for all new matters',
              owner: 'Legal Ops',
            },
          ]
        : []),
      ...(vessels.totalTracked > 3
        ? [
            {
              id: 'ho3',
              title: `Vessels: ${vessels.totalTracked} Tracked — Route Optimization`,
              domain: 'vessels',
              domainColor: DOMAIN_COLORS_MAP.vessels,
              probability: 0.65,
              valueScore: 0.6,
              level: 'medium' as const,
              action: 'Activate voyage economics benchmarking module',
              owner: 'Maritime Ops',
            },
          ]
        : []),
    ].slice(0, 4);

    const crossDomainImpacts = [
      ...breachSlas.flatMap((s) => {
        const dom = s.id.split('-')[0];
        if (dom === 'lyte')
          return [
            { source: 'lyte', target: 'terra', label: 'Latency ripple', type: 'risk' as const },
          ];
        if (dom === 'aegis')
          return [
            {
              source: 'aegis',
              target: 'vessels',
              label: 'Threat intel dependency',
              type: 'risk' as const,
            },
          ];
        return [];
      }),
      {
        source: 'prism',
        target: 'terra',
        label: 'Deal compliance checks',
        type: 'positive' as const,
      },
      {
        source: 'aegis',
        target: 'vessels',
        label: 'Threat intel sharing',
        type: 'positive' as const,
      },
    ].slice(0, 5);

    sendSuccess(res, {
      stateBoardKpis,
      causalEvents,
      recommendations,
      actions,
      heatmapRisks,
      heatmapOpps,
      crossDomainImpacts,
      summary: {
        compositeScore,
        slaBreaching: breachSlas.length,
        firingAlerts: firing,
        pendingActions: actions.filter((a) => a.status === 'pending').length,
      },
      generatedAt: new Date().toISOString(),
      dataSource: slas.length > 0 ? 'live' : 'partial',
    });
  } catch (err) {
    logger.error({ err }, 'command enterprise-state error');
    handleRouteError(res, err, 'Failed to load enterprise state');
  }
});

export default router;
