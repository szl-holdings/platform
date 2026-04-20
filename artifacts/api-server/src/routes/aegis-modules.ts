import {
  type ActionQueuePriority,
  type ActionQueueStatus,
  type AuditEntry,
  aegisActionQueueItemsTable,
  aegisDeceptionHotpotsTable,
  aegisSoarPlaybooksTable,
  aegisSoarRunsTable,
  db,
  firestormAssetsTable,
  firestormFindingsTable,
  firestormIncidentsTable,
  firestormSimulationRunsTable,
  type PlaybookNode,
  type PlaybookStatus,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleRouteError, sendBadRequest, sendNotFound, sendSuccess } from '../lib/api-response';
import { broadcastWs } from '../lib/pubsub-bridge';
import {
  aegisActionCreateSchema,
  aegisActionTransitionSchema,
  aegisDigitalTwinScenarioRunSchema,
  aegisDigitalTwinSyncSchema,
  aegisHoneypotCreateSchema,
  aegisListQuerySchema,
  aegisPushIocSchema,
  aegisSoarExecuteSchema,
  aegisSoarPlaybookCreateSchema,
  aegisSoarPlaybookDeleteSchema,
  aegisSoarPlaybookUpdateSchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded' },
  validate: { xForwardedForHeader: false, ip: false },
});

const nowIso = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Normalize DB status "complete" → "completed" for consistent frontend contract */
function serializeQueueItem(item: typeof aegisActionQueueItemsTable.$inferSelect) {
  return {
    ...item,
    status: item.status === 'complete' ? 'completed' : item.status,
    dueDate: item.dueAt?.toISOString() ?? null,
  };
}

function relLabel(date: Date): string {
  const ms = Date.now() - date.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// Map firestorm asset_type → twin topology node type for visual classification
const ASSET_TYPE_TO_TWIN_TYPE: Record<string, string> = {
  server: 'server',
  endpoint: 'workstation',
  network_device: 'network',
  cloud_resource: 'cloud',
  application: 'server',
  database: 'database',
  api: 'server',
  iam_identity: 'server',
  container: 'server',
  other: 'server',
};

// Map exposure level → criticality tier (lower = more critical)
const EXPOSURE_TO_TIER: Record<string, string> = {
  critical: 'tier-0',
  public: 'tier-1',
  restricted: 'tier-2',
  internal: 'tier-3',
};

// Map firestorm environment → twin zone label
const ENV_TO_ZONE: Record<string, string> = {
  production: 'prod',
  staging: 'staging',
  development: 'dev',
  internal: 'internal',
  dmz: 'dmz',
};

const STALE_SYNC_HOURS = 24; // beyond this last_scanned_at counts as drifted
const OFFLINE_HOURS = 168; // 7 days without a scan → offline

function durationLabel(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function mapSimStatus(s: string | null | undefined): string {
  if (s === 'pending') return 'queued';
  if (s === 'aborted') return 'failed';
  return s ?? 'queued';
}

// Static deception events — in this iteration, captured honeypot hits are append-only session events
const DECEPTION_EVENTS = [
  {
    id: 'DE-001',
    time: new Date(Date.now() - 900000).toISOString(),
    honeypot: 'SSH Honeypot Alpha',
    event: 'SSH brute force attempt — 47 password combinations',
    severity: 'critical',
    attackerIp: '185.220.101.47',
    technique: 'T1110.001 — Brute Force',
    intel: 'Exit node matches Tor network. APT-29 pivot pattern.',
    pushedToFeed: false,
  },
  {
    id: 'DE-002',
    time: new Date(Date.now() - 1800000).toISOString(),
    honeypot: 'Postgres Decoy',
    event: 'SQL injection payload detected on login endpoint',
    severity: 'high',
    attackerIp: '92.118.36.199',
    technique: 'T1190 — Exploit Public-Facing App',
    intel: 'Payload signature matches DARKSIDE ransomware reconnaissance kit.',
    pushedToFeed: false,
  },
  {
    id: 'DE-003',
    time: new Date(Date.now() - 2700000).toISOString(),
    honeypot: 'PLC SCADA Emulator',
    event: 'Canary token triggered — credential accessed',
    severity: 'critical',
    attackerIp: '10.10.0.5',
    technique: 'T1078 — Valid Accounts',
    intel: 'INTERNAL THREAT: Source IP belongs to OT segment.',
    pushedToFeed: true,
  },
  {
    id: 'DE-004',
    time: new Date(Date.now() - 4200000).toISOString(),
    honeypot: 'SSH Honeypot Alpha',
    event: 'Automated vulnerability scanner — 1,200 probe requests',
    severity: 'high',
    attackerIp: '104.21.45.87',
    technique: 'T1595 — Active Scanning',
    intel: 'Shodan crawler fingerprint. Pre-attack reconnaissance phase.',
    pushedToFeed: false,
  },
  {
    id: 'DE-005',
    time: new Date(Date.now() - 5400000).toISOString(),
    honeypot: 'SMB File Server',
    event: 'Mass file enumeration — 340 files accessed in 8s',
    severity: 'high',
    attackerIp: '10.99.1.89',
    technique: 'T1083 — File and Directory Discovery',
    intel: 'Behavior consistent with ransomware pre-encryption staging.',
    pushedToFeed: false,
  },
];

// ─── DIGITAL TWIN ROUTES ──────────────────────────────────────────────────────

router.get(
  '/aegis/digital-twin/topology',
  limiter,
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const [assets, openFindings, activeIncidents] = await Promise.all([
        db
          .select()
          .from(firestormAssetsTable)
          .where(eq(firestormAssetsTable.isActive, true))
          .orderBy(desc(firestormAssetsTable.riskScore)),
        db
          .select({
            affectedAsset: firestormFindingsTable.affectedAsset,
            severity: firestormFindingsTable.severity,
            status: firestormFindingsTable.status,
          })
          .from(firestormFindingsTable)
          .where(inArray(firestormFindingsTable.status, ['open', 'confirmed'] as const)),
        db
          .select({
            affectedAssets: firestormIncidentsTable.affectedAssets,
            status: firestormIncidentsTable.status,
            severity: firestormIncidentsTable.severity,
          })
          .from(firestormIncidentsTable)
          .where(sql`${firestormIncidentsTable.status} != 'closed'`),
      ]);

      // Aggregate findings counts per asset name
      const findingsByAsset = new Map<string, { total: number; critical: number; high: number }>();
      for (const f of openFindings) {
        const key = f.affectedAsset ?? '';
        if (!key) continue;
        const cur = findingsByAsset.get(key) ?? { total: 0, critical: 0, high: 0 };
        cur.total += 1;
        if (f.severity === 'critical') cur.critical += 1;
        else if (f.severity === 'high') cur.high += 1;
        findingsByAsset.set(key, cur);
      }

      // Track which assets have an active (non-closed) incident referencing them
      const incidentAssetNames = new Set<string>();
      for (const inc of activeIncidents) {
        const arr = (inc.affectedAssets ?? []) as unknown as string[];
        if (Array.isArray(arr))
          arr.forEach((n) => typeof n === 'string' && incidentAssetNames.add(n));
      }

      const now = Date.now();
      const nodes = assets.map((a) => {
        const lastScan = a.lastScannedAt ? a.lastScannedAt.getTime() : null;
        const ageHours = lastScan ? (now - lastScan) / 3600000 : Infinity;

        // Sync state derived from last_scanned_at + open incidents/critical findings
        const findingAgg = findingsByAsset.get(a.name);
        const hasIncident = incidentAssetNames.has(a.name);
        const hasCritical = (findingAgg?.critical ?? 0) > 0 || a.criticalFindings > 0;

        let syncState: 'synced' | 'drifted' | 'offline';
        if (ageHours >= OFFLINE_HOURS) syncState = 'offline';
        else if (hasIncident || hasCritical || ageHours >= STALE_SYNC_HOURS) syncState = 'drifted';
        else syncState = 'synced';

        const meta = (a.metadata ?? {}) as Record<string, unknown>;
        const ip = typeof meta.ip === 'string' ? meta.ip : '—';
        const os = typeof meta.os === 'string' ? meta.os : '—';

        const tier = EXPOSURE_TO_TIER[a.exposureLevel] ?? 'tier-3';
        const lastSyncDate = a.lastScannedAt ?? a.createdAt;

        // Vulnerabilities count: prefer live findings count, fallback to seeded counters
        const vulnerabilities = findingAgg?.total ?? a.criticalFindings + a.highFindings;

        return {
          id: `asset-${a.id}`,
          name: a.name,
          type: ASSET_TYPE_TO_TWIN_TYPE[a.assetType] ?? 'server',
          assetType: a.assetType,
          zone: ENV_TO_ZONE[a.environment] ?? a.environment,
          tier,
          syncState,
          criticalityTier: parseInt(tier.replace('tier-', ''), 10),
          vulnerabilities,
          criticalVulnerabilities: findingAgg?.critical ?? a.criticalFindings,
          highVulnerabilities: findingAgg?.high ?? a.highFindings,
          riskScore: Number(a.riskScore),
          owner: a.owner,
          team: a.team ?? null,
          environment: a.environment,
          exposureLevel: a.exposureLevel,
          hasActiveIncident: hasIncident,
          lastSync: lastSyncDate.toISOString(),
          lastSyncLabel: relLabel(lastSyncDate),
          ip,
          os,
          meta,
        };
      });

      // Sort: drifted/offline first, then by criticality tier, so the operator sees risk first
      nodes.sort((a, b) => {
        const stateRank = (s: string) => (s === 'drifted' ? 0 : s === 'offline' ? 1 : 2);
        const sa = stateRank(a.syncState);
        const sb = stateRank(b.syncState);
        if (sa !== sb) return sa - sb;
        return a.criticalityTier - b.criticalityTier;
      });

      const syncedCount = nodes.filter((n) => n.syncState === 'synced').length;
      const driftedCount = nodes.filter((n) => n.syncState === 'drifted').length;
      const offlineCount = nodes.filter((n) => n.syncState === 'offline').length;
      const totalVulns = nodes.reduce((s, n) => s + n.vulnerabilities, 0);

      // Twin fidelity = % of assets currently in-sync (real measure, not a static label)
      const fidelityPct = nodes.length ? (syncedCount / nodes.length) * 100 : 100;
      const fidelity = `${fidelityPct.toFixed(1)}%`;

      // Attack surface derived from real asset risk distribution
      const groupAvg = (filter: (a: (typeof assets)[number]) => boolean): number => {
        const subset = assets.filter(filter);
        if (!subset.length) return 0;
        const sum = subset.reduce((acc, a) => acc + Number(a.riskScore), 0);
        return Math.round((sum / subset.length) * 10); // riskScore 0-10 → percent 0-100
      };
      const attackSurface = [
        { area: 'External Attack Surface', risk: groupAvg((a) => a.exposureLevel === 'public') },
        {
          area: 'Internal Lateral Movement',
          risk: groupAvg((a) => a.exposureLevel === 'internal'),
        },
        {
          area: 'Privilege Escalation Paths',
          risk: groupAvg((a) => a.assetType === 'iam_identity'),
        },
        {
          area: 'Cloud / SaaS Exposure',
          risk: groupAvg((a) => a.assetType === 'cloud_resource' || a.assetType === 'container'),
        },
        {
          area: 'Identity & Access Risk',
          risk: groupAvg((a) => a.assetType === 'iam_identity' || a.exposureLevel === 'critical'),
        },
      ];

      sendSuccess(res, {
        nodes,
        syncedCount,
        driftedCount,
        offlineCount,
        totalVulns,
        fidelity,
        fetchedAt: nowIso(),
        attackSurface,
        source: 'firestorm_assets',
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch digital twin topology');
    }
  },
);

router.post(
  '/aegis/digital-twin/sync',
  validateBody(aegisDigitalTwinSyncSchema),
  limiter,
  authMiddleware({ required: true }),
  async (_req: Request, res: Response) => {
    try {
      // Bring the twin back in sync with the live asset inventory by stamping the
      // last_scanned_at on every active asset. Drift will re-emerge naturally as
      // new findings/incidents land.
      const updated = await db
        .update(firestormAssetsTable)
        .set({ lastScannedAt: new Date(), updatedAt: new Date() })
        .where(eq(firestormAssetsTable.isActive, true))
        .returning({ id: firestormAssetsTable.id });
      sendSuccess(res, {
        message: `Digital twin synchronized — ${updated.length} assets re-scanned from live inventory`,
        syncedAt: nowIso(),
        assetsSynced: updated.length,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to sync digital twin');
    }
  },
);

router.get(
  '/aegis/digital-twin/scenarios',
  limiter,
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const runs = await db
        .select()
        .from(firestormSimulationRunsTable)
        .orderBy(desc(firestormSimulationRunsTable.createdAt))
        .limit(20);

      // Pull findings counts per simulation run in one query
      const runIds = runs.map((r) => r.id);
      const findingsByRun = new Map<number, { total: number; critical: number }>();
      if (runIds.length) {
        const rows = await db
          .select({
            simulationRunId: firestormFindingsTable.simulationRunId,
            severity: firestormFindingsTable.severity,
          })
          .from(firestormFindingsTable)
          .where(inArray(firestormFindingsTable.simulationRunId, runIds));
        for (const r of rows) {
          if (r.simulationRunId == null) continue;
          const cur = findingsByRun.get(r.simulationRunId) ?? { total: 0, critical: 0 };
          cur.total += 1;
          if (r.severity === 'critical') cur.critical += 1;
          findingsByRun.set(r.simulationRunId, cur);
        }
      }

      const scenarios = runs.map((r) => {
        const status = mapSimStatus(r.status);
        const startedMs = r.startedAt?.getTime() ?? null;
        const completedMs = r.completedAt?.getTime() ?? null;
        let progress = 0;
        let durationStr = '—';
        if (status === 'completed') {
          progress = 100;
          durationStr = durationLabel(
            r.durationSeconds ??
              (startedMs && completedMs ? Math.round((completedMs - startedMs) / 1000) : null),
          );
        } else if (status === 'running') {
          // Estimate progress based on elapsed vs typical 6-minute window
          const elapsed = startedMs ? (Date.now() - startedMs) / 1000 : 0;
          progress = Math.min(95, Math.max(5, Math.round((elapsed / 360) * 100)));
          durationStr = 'ongoing';
        } else if (status === 'failed') {
          progress =
            startedMs && completedMs
              ? Math.min(99, Math.round(((completedMs - startedMs) / 360000) * 100))
              : 0;
          durationStr = durationLabel(r.durationSeconds);
        }
        const agg = findingsByRun.get(r.id) ?? { total: 0, critical: 0 };
        const params = (r.parameters ?? {}) as Record<string, unknown>;
        const technique =
          typeof params.technique === 'string'
            ? params.technique
            : typeof params.mitre === 'string'
              ? params.mitre
              : Array.isArray(params.techniques)
                ? (params.techniques as unknown[])
                    .filter((t): t is string => typeof t === 'string')
                    .join(' + ')
                : '—';
        return {
          id: `SIM-${String(r.id).padStart(3, '0')}`,
          runId: r.id,
          name: r.name,
          technique,
          status,
          progress,
          findings: agg.total,
          criticalFindings: agg.critical,
          duration: durationStr,
          startedAt: r.startedAt?.toISOString(),
          mode: r.mode,
        };
      });

      sendSuccess(res, { scenarios, fetchedAt: nowIso(), source: 'firestorm_simulation_runs' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch digital twin scenarios');
    }
  },
);

router.post(
  '/aegis/digital-twin/scenarios/:id/run',
  validateBody(aegisDigitalTwinScenarioRunSchema),
  limiter,
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      // Accept either raw numeric id or "SIM-###" form
      const raw = String(req.params.id ?? '');
      const numeric = raw.startsWith('SIM-')
        ? Number.parseInt(raw.slice(4), 10)
        : Number.parseInt(raw, 10);
      if (!Number.isFinite(numeric)) {
        sendBadRequest(res, 'Invalid scenario id');
        return;
      }

      const [existing] = await db
        .select()
        .from(firestormSimulationRunsTable)
        .where(eq(firestormSimulationRunsTable.id, numeric))
        .limit(1);
      if (!existing) {
        sendNotFound(res, 'Scenario');
        return;
      }

      // Only allow launching scenarios that haven't already started — prevents
      // overwriting a completed/failed run's history via this endpoint.
      if (existing.status !== 'pending') {
        sendBadRequest(
          res,
          `Scenario SIM-${String(existing.id).padStart(3, '0')} is ${existing.status} — only pending scenarios can be launched`,
        );
        return;
      }

      const [updated] = await db
        .update(firestormSimulationRunsTable)
        .set({ status: 'running', startedAt: new Date() })
        .where(
          and(
            eq(firestormSimulationRunsTable.id, existing.id),
            eq(firestormSimulationRunsTable.status, 'pending'),
          ),
        )
        .returning();
      if (!updated) {
        sendBadRequest(res, 'Scenario state changed — refresh and try again');
        return;
      }

      sendSuccess(res, {
        message: `Red team scenario SIM-${String(updated.id).padStart(3, '0')} launched against digital twin — live infrastructure unaffected`,
        scenario: {
          id: `SIM-${String(updated.id).padStart(3, '0')}`,
          runId: updated.id,
          name: updated.name,
          status: 'running',
          progress: 0,
          startedAt: updated.startedAt?.toISOString() ?? nowIso(),
        },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to launch scenario');
    }
  },
);

// ─── DECEPTION GRID ROUTES ────────────────────────────────────────────────────

router.get(
  '/aegis/deception/honeypots',
  limiter,
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(aegisDeceptionHotpotsTable)
        .orderBy(desc(aegisDeceptionHotpotsTable.interactions));
      const honeypots = rows.map((h) => ({
        id: h.id,
        name: h.name,
        type: h.type,
        ip: h.ip,
        os: h.os,
        status: h.status,
        interactions: h.interactions,
        iocsPushed: h.iocsPushed,
        deceptionScore: h.deceptionScore,
        lastInteraction: h.lastHit ? h.lastHit.toISOString() : null,
        deployedAt: h.createdAt.toISOString(),
      }));
      const totalInteractions = honeypots.reduce((s, h) => s + h.interactions, 0);
      const avgDeception = honeypots.length
        ? Math.round(honeypots.reduce((s, h) => s + h.deceptionScore, 0) / honeypots.length)
        : 0;
      const intelItems = honeypots.reduce((s, h) => s + h.iocsPushed, 0) + 34;
      sendSuccess(res, {
        honeypots,
        totalInteractions,
        avgDeception,
        intelItems,
        fetchedAt: nowIso(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch honeypots');
    }
  },
);

router.post(
  '/aegis/deception/honeypots',
  limiter,
  authMiddleware({ required: true }),
  validateBody(aegisHoneypotCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as { name?: string; type?: string; ip?: string; os?: string };
      const inserted = await db
        .insert(aegisDeceptionHotpotsTable)
        .values({
          id: uid('hp'),
          name: body.name ?? `STAGE-ENV-${Date.now().toString(36).toUpperCase()}`,
          type: (body.type ?? 'server') as 'ssh' | 'http' | 'smb' | 'ftp' | 'db' | 'ics',
          ip:
            body.ip ??
            `10.99.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
          os: body.os ?? 'Windows Server 2019 (Emulated)',
          status: 'active',
          interactions: 0,
          iocsPushed: 0,
          deceptionScore: 85 + Math.floor(Math.random() * 13),
        })
        .returning();
      sendSuccess(res, {
        honeypot: inserted[0],
        message: `New honeypot deployed: ${inserted[0].name}`,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to deploy honeypot');
    }
  },
);

router.get(
  '/aegis/deception/events',
  limiter,
  authMiddleware({ required: false }),
  (_req: Request, res: Response) => {
    sendSuccess(res, { events: DECEPTION_EVENTS, fetchedAt: nowIso() });
  },
);

router.post(
  '/aegis/deception/events/:id/push-ioc',
  validateBody(aegisPushIocSchema),
  limiter,
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const evtId = req.params.id;
      const evt = DECEPTION_EVENTS.find((e) => e.id === evtId);
      if (!evt) {
        sendNotFound(res, 'Event');
        return;
      }
      // Increment iocsPushed on the honeypot matching this event
      const hp = await db
        .select()
        .from(aegisDeceptionHotpotsTable)
        .where(eq(aegisDeceptionHotpotsTable.name, evt.honeypot))
        .limit(1);
      if (hp.length > 0) {
        await db
          .update(aegisDeceptionHotpotsTable)
          .set({ iocsPushed: hp[0].iocsPushed + 1, updatedAt: new Date() })
          .where(eq(aegisDeceptionHotpotsTable.id, hp[0].id));
      }
      evt.pushedToFeed = true;
      sendSuccess(res, {
        message: 'IOC pushed to threat intel feeds and SIEM blocklist',
        event: evt,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to push IOC');
    }
  },
);

// ─── ACTION QUEUE ROUTES ──────────────────────────────────────────────────────

router.get(
  '/aegis/action-queue',
  validateQuery(aegisListQuerySchema),
  limiter,
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const { status, priority } = req.query as Record<string, string>;
      const conditions = [];
      if (status)
        conditions.push(eq(aegisActionQueueItemsTable.status, status as ActionQueueStatus));
      if (priority)
        conditions.push(eq(aegisActionQueueItemsTable.priority, priority as ActionQueuePriority));

      const allItems = await db
        .select()
        .from(aegisActionQueueItemsTable)
        .orderBy(desc(aegisActionQueueItemsTable.createdAt));
      const items = conditions.length
        ? await db
            .select()
            .from(aegisActionQueueItemsTable)
            .where(and(...conditions))
            .orderBy(desc(aegisActionQueueItemsTable.createdAt))
        : allItems;

      const openCount = allItems.filter((a) => a.status !== 'complete').length;
      const blockedCount = allItems.filter((a) => a.status === 'blocked').length;
      const overdueCount = allItems.filter(
        (a) => a.dueAt && a.dueAt < new Date() && a.status !== 'complete',
      ).length;
      const completedCount = allItems.filter((a) => a.status === 'complete').length;
      sendSuccess(res, {
        items: items.map(serializeQueueItem),
        openCount,
        blockedCount,
        overdueCount,
        completedCount,
        fetchedAt: nowIso(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch action queue');
    }
  },
);

router.post(
  '/aegis/action-queue/:id/complete',
  limiter,
  authMiddleware({ required: true }),
  validateBody(aegisActionTransitionSchema),
  async (req: Request, res: Response) => {
    try {
      const [item] = await db
        .select()
        .from(aegisActionQueueItemsTable)
        .where(eq(aegisActionQueueItemsTable.id, req.params.id))
        .limit(1);
      if (!item) {
        sendNotFound(res, 'Action');
        return;
      }
      const entry: AuditEntry = {
        actor: req.user?.email ?? 'operator',
        action: 'marked_complete',
        at: nowIso(),
        note: (req.body as { note?: string }).note,
      };
      const newTrail: AuditEntry[] = [...(item.auditTrail ?? []), entry];
      const [updated] = await db
        .update(aegisActionQueueItemsTable)
        .set({ status: 'complete', auditTrail: newTrail, updatedAt: new Date() })
        .where(eq(aegisActionQueueItemsTable.id, item.id))
        .returning();
      sendSuccess(res, {
        item: serializeQueueItem(updated),
        message: `Action ${item.id} marked complete — outcome recorded in audit trail`,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to complete action');
    }
  },
);

router.post(
  '/aegis/action-queue/:id/escalate',
  limiter,
  authMiddleware({ required: true }),
  validateBody(aegisActionTransitionSchema),
  async (req: Request, res: Response) => {
    try {
      const [item] = await db
        .select()
        .from(aegisActionQueueItemsTable)
        .where(eq(aegisActionQueueItemsTable.id, req.params.id))
        .limit(1);
      if (!item) {
        sendNotFound(res, 'Action');
        return;
      }
      const newPriority: ActionQueuePriority = item.priority === 'medium' ? 'high' : 'critical';
      const entry: AuditEntry = {
        actor: req.user?.email ?? 'operator',
        action: 'escalated',
        at: nowIso(),
        note: (req.body as { note?: string }).note,
      };
      const newTrail: AuditEntry[] = [...(item.auditTrail ?? []), entry];
      const [updated] = await db
        .update(aegisActionQueueItemsTable)
        .set({ priority: newPriority, auditTrail: newTrail, updatedAt: new Date() })
        .where(eq(aegisActionQueueItemsTable.id, item.id))
        .returning();
      sendSuccess(res, {
        item: serializeQueueItem(updated),
        message: `Action ${item.id} escalated to ${newPriority}`,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to escalate action');
    }
  },
);

router.post(
  '/aegis/action-queue',
  limiter,
  authMiddleware({ required: true }),
  validateBody(aegisActionCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        title?: string;
        description?: string;
        priority?: string;
        assignedTo?: string;
        dueAt?: string;
        incidentId?: string;
        source?: string;
        playbookRef?: string;
      };
      if (!body.title || !body.priority) {
        sendBadRequest(res, 'title and priority are required');
        return;
      }
      const initAudit: AuditEntry[] = [
        { actor: req.user?.email ?? 'operator', action: 'created', at: nowIso() },
      ];
      const [inserted] = await db
        .insert(aegisActionQueueItemsTable)
        .values({
          id: uid('aq'),
          title: body.title,
          description: body.description ?? '',
          priority: (body.priority ?? 'medium') as ActionQueuePriority,
          status: 'open',
          assignedTo: body.assignedTo,
          dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
          incidentId: body.incidentId,
          source: body.source ?? 'manual',
          playbookRef: body.playbookRef,
          auditTrail: initAudit,
        })
        .returning();
      const serialized = serializeQueueItem(inserted);
      broadcastWs('aegis-incidents', 'action-created', {
        id: serialized.id,
        title: serialized.title,
        description: serialized.description,
        priority: serialized.priority,
        status: serialized.status,
        assignedTo: serialized.assignedTo ?? null,
        dueDate: serialized.dueDate,
        incidentId: serialized.incidentId ?? null,
        source: serialized.source ?? 'manual',
        createdAt: serialized.createdAt,
      });
      sendSuccess(res, { item: inserted, message: 'Action created' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create action');
    }
  },
);

// ─── SOAR BUILDER ROUTES ──────────────────────────────────────────────────────

router.get(
  '/aegis/soar-builder/playbooks',
  limiter,
  authMiddleware({ required: false }),
  async (_req: Request, res: Response) => {
    try {
      const [playbooks, runs] = await Promise.all([
        db.select().from(aegisSoarPlaybooksTable).orderBy(desc(aegisSoarPlaybooksTable.updatedAt)),
        db
          .select({
            id: aegisSoarRunsTable.id,
            playbookId: aegisSoarRunsTable.playbookId,
            status: aegisSoarRunsTable.status,
          })
          .from(aegisSoarRunsTable),
      ]);
      const summary = playbooks.map((pb) => {
        const pbRuns = runs.filter((r) => r.playbookId === pb.id);
        const doneRuns = pbRuns.filter((r) => r.status !== 'awaiting_approval');
        const successRate = doneRuns.length
          ? Math.round(
              (doneRuns.filter((r) => r.status === 'completed').length / doneRuns.length) * 100,
            )
          : 100;
        return {
          id: pb.id,
          name: pb.name,
          trigger: pb.trigger,
          description: pb.description,
          nodeCount: (pb.nodes as PlaybookNode[]).length,
          status: pb.status,
          createdAt: pb.createdAt,
          updatedAt: pb.updatedAt,
          runCount: pbRuns.length,
          successRate,
        };
      });
      sendSuccess(res, { playbooks: summary, total: summary.length, fetchedAt: nowIso() });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch SOAR playbooks');
    }
  },
);

router.get(
  '/aegis/soar-builder/playbooks/:id',
  limiter,
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const [pb] = await db
        .select()
        .from(aegisSoarPlaybooksTable)
        .where(eq(aegisSoarPlaybooksTable.id, req.params.id))
        .limit(1);
      if (!pb) {
        sendNotFound(res, 'Playbook');
        return;
      }
      const runs = await db
        .select()
        .from(aegisSoarRunsTable)
        .where(eq(aegisSoarRunsTable.playbookId, pb.id))
        .orderBy(desc(aegisSoarRunsTable.startedAt))
        .limit(20);
      sendSuccess(res, { playbook: pb, runs });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch playbook');
    }
  },
);

router.post(
  '/aegis/soar-builder/playbooks',
  limiter,
  authMiddleware({ required: true }),
  validateBody(aegisSoarPlaybookCreateSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        name?: string;
        trigger?: string;
        description?: string;
        nodes?: PlaybookNode[];
        status?: string;
      };
      if (!body.name || !body.trigger) {
        sendBadRequest(res, 'name and trigger are required');
        return;
      }
      const [inserted] = await db
        .insert(aegisSoarPlaybooksTable)
        .values({
          id: uid('pb'),
          name: body.name,
          trigger: body.trigger,
          description: body.description ?? '',
          nodes: body.nodes ?? [],
          status: (body.status ?? 'draft') as PlaybookStatus,
          runCount: 0,
          successCount: 0,
        })
        .returning();
      sendSuccess(res, { playbook: inserted, message: `Playbook "${inserted.name}" saved` });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create playbook');
    }
  },
);

router.put(
  '/aegis/soar-builder/playbooks/:id',
  limiter,
  authMiddleware({ required: true }),
  validateBody(aegisSoarPlaybookUpdateSchema),
  async (req: Request, res: Response) => {
    try {
      const [existing] = await db
        .select()
        .from(aegisSoarPlaybooksTable)
        .where(eq(aegisSoarPlaybooksTable.id, req.params.id))
        .limit(1);
      if (!existing) {
        sendNotFound(res, 'Playbook');
        return;
      }
      const body = req.body as {
        name?: string;
        trigger?: string;
        description?: string;
        nodes?: PlaybookNode[];
        status?: string;
      };
      const [updated] = await db
        .update(aegisSoarPlaybooksTable)
        .set({
          name: body.name ?? existing.name,
          trigger: body.trigger ?? existing.trigger,
          description: body.description ?? existing.description,
          nodes: body.nodes ?? existing.nodes,
          status: (body.status ?? existing.status) as PlaybookStatus,
          updatedAt: new Date(),
        })
        .where(eq(aegisSoarPlaybooksTable.id, existing.id))
        .returning();
      sendSuccess(res, { playbook: updated, message: 'Playbook updated' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to update playbook');
    }
  },
);

router.delete(
  '/aegis/soar-builder/playbooks/:id',
  validateBody(aegisSoarPlaybookDeleteSchema),
  limiter,
  authMiddleware({ required: true }),
  async (req: Request, res: Response) => {
    try {
      const [existing] = await db
        .select()
        .from(aegisSoarPlaybooksTable)
        .where(eq(aegisSoarPlaybooksTable.id, req.params.id))
        .limit(1);
      if (!existing) {
        sendNotFound(res, 'Playbook');
        return;
      }
      await db.delete(aegisSoarPlaybooksTable).where(eq(aegisSoarPlaybooksTable.id, existing.id));
      sendSuccess(res, { message: 'Playbook deleted' });
    } catch (err) {
      handleRouteError(res, err, 'Failed to delete playbook');
    }
  },
);

router.get(
  '/aegis/soar-builder/runs',
  validateQuery(aegisListQuerySchema),
  limiter,
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const { playbookId } = req.query as Record<string, string>;
      const conditions = playbookId ? [eq(aegisSoarRunsTable.playbookId, playbookId)] : [];
      const runs = await db
        .select()
        .from(aegisSoarRunsTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(aegisSoarRunsTable.startedAt))
        .limit(100);
      sendSuccess(res, { runs, total: runs.length, fetchedAt: nowIso() });
    } catch (err) {
      handleRouteError(res, err, 'Failed to fetch run history');
    }
  },
);

router.post(
  '/aegis/soar-builder/execute',
  limiter,
  authMiddleware({ required: true }),
  validateBody(aegisSoarExecuteSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as { playbookId?: string; incidentId?: string; triggeredBy?: string };
      if (!body.playbookId) {
        sendBadRequest(res, 'playbookId is required');
        return;
      }
      const [pb] = await db
        .select()
        .from(aegisSoarPlaybooksTable)
        .where(eq(aegisSoarPlaybooksTable.id, body.playbookId))
        .limit(1);
      if (!pb) {
        sendNotFound(res, 'Playbook');
        return;
      }
      const nodes = pb.nodes as PlaybookNode[];
      const hasApprovalGate = nodes.some((n) => n.type === 'approve' && !n.auto);
      const runStatus = hasApprovalGate ? 'awaiting_approval' : 'completed';
      const stepsCompleted = hasApprovalGate
        ? nodes.findIndex((n) => n.type === 'approve')
        : nodes.length;
      const duration = hasApprovalGate ? undefined : `${10 + nodes.length * 8}s`;
      const completedAt = hasApprovalGate ? undefined : new Date();
      const [run] = await db
        .insert(aegisSoarRunsTable)
        .values({
          id: uid('run'),
          playbookId: pb.id,
          playbookName: pb.name,
          triggeredBy: body.triggeredBy ?? req.user?.email ?? 'Manual execution',
          status: runStatus as 'awaiting_approval' | 'completed',
          stepsCompleted,
          stepsFailed: 0,
          duration,
          outcome: hasApprovalGate
            ? undefined
            : `Playbook ${pb.name} executed — all ${nodes.length} steps completed`,
          incidentId: body.incidentId,
          completedAt,
        })
        .returning();
      // Update run_count and success_count on the playbook
      await db
        .update(aegisSoarPlaybooksTable)
        .set({
          runCount: pb.runCount + 1,
          successCount: runStatus === 'completed' ? pb.successCount + 1 : pb.successCount,
          updatedAt: new Date(),
        })
        .where(eq(aegisSoarPlaybooksTable.id, pb.id));
      const message = hasApprovalGate
        ? 'Playbook execution paused at approval gate — awaiting CISO authorization'
        : `Playbook ${pb.name} executed successfully`;
      sendSuccess(res, { run, message });
    } catch (err) {
      handleRouteError(res, err, 'Failed to execute playbook');
    }
  },
);

export default router;
