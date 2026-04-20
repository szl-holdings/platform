import {
  alloySignals,
  alloyWorkflows,
  db,
  firestormAlertsTable,
  firestormAssetsTable,
  firestormFindingsTable,
  firestormIncidentsTable,
  vesselsAlertsTable,
  vesselsEventsTable,
  vesselsFleetsTable,
  vesselsPositionsTable,
  vesselsTable,
} from '@szl-holdings/db';
import { and, asc, eq, gt, gte, or } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { listQuerySchema, validateQuery } from '../lib/validation.js';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

function parseSince(since: string | undefined): Date {
  if (!since) return new Date(0);
  const ts = Number(since);
  if (!isNaN(ts)) return new Date(ts);
  const d = new Date(since);
  if (!isNaN(d.getTime())) return d;
  return new Date(0);
}

function parseLimit(limit: string | undefined): number {
  const n = Number(limit ?? DEFAULT_PAGE_SIZE);
  return Math.min(isNaN(n) ? DEFAULT_PAGE_SIZE : n, MAX_PAGE_SIZE);
}

interface EntityCursorEntry {
  ts: number;
  id: number | string;
}

type PerEntityCursor = Record<string, EntityCursorEntry>;

function encodeCursor(cursors: PerEntityCursor): string {
  return Buffer.from(JSON.stringify(cursors)).toString('base64');
}

function decodeCursor(cursor: string | undefined): PerEntityCursor | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as PerEntityCursor;
  } catch {
    return null;
  }
}

function makeEntityCondition(
  entityType: string,
  tsCol: Parameters<typeof gte>[0],
  idCol: Parameters<typeof gt>[0],
  cursor: PerEntityCursor | null,
  since: Date,
) {
  const entry = cursor?.[entityType];
  if (!entry) return gte(tsCol, since);
  const entryTs = new Date(entry.ts);
  return or(gt(tsCol, entryTs), and(eq(tsCol, entryTs), gt(idCol, entry.id as number)))!;
}

type ChangeRecord = {
  id: number | string;
  entityType: string;
  updatedAt: string;
  data: Record<string, unknown>;
};

function buildNextCursor(
  entityResults: Array<{ entityType: string; records: ChangeRecord[]; hitLimit: boolean }>,
): { hasMore: boolean; nextCursor: string | undefined } {
  const hasMore = entityResults.some((e) => e.hitLimit);
  if (!hasMore) return { hasMore: false, nextCursor: undefined };

  const cursors: PerEntityCursor = {};
  for (const { entityType, records } of entityResults) {
    if (records.length > 0) {
      const last = records[records.length - 1];
      cursors[entityType] = {
        ts: new Date(last.updatedAt).getTime(),
        id: last.id,
      };
    }
  }
  return { hasMore: true, nextCursor: encodeCursor(cursors) };
}

router.get('/aegis/sync', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const snapshotTime = Date.now();
    const cursor = decodeCursor(req.query.cursor as string | undefined);
    const since = parseSince(req.query.since as string | undefined);
    const limit = parseLimit(req.query.limit as string | undefined);
    const perType = Math.ceil(limit / 4);

    const [incidents, alerts, findings, assets] = await Promise.all([
      db
        .select()
        .from(firestormIncidentsTable)
        .where(
          makeEntityCondition(
            'incident',
            firestormIncidentsTable.updatedAt,
            firestormIncidentsTable.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(firestormIncidentsTable.updatedAt), asc(firestormIncidentsTable.id))
        .limit(perType),

      db
        .select()
        .from(firestormAlertsTable)
        .where(
          makeEntityCondition(
            'alert',
            firestormAlertsTable.createdAt,
            firestormAlertsTable.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(firestormAlertsTable.createdAt), asc(firestormAlertsTable.id))
        .limit(perType),

      db
        .select()
        .from(firestormFindingsTable)
        .where(
          makeEntityCondition(
            'finding',
            firestormFindingsTable.updatedAt,
            firestormFindingsTable.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(firestormFindingsTable.updatedAt), asc(firestormFindingsTable.id))
        .limit(perType),

      db
        .select()
        .from(firestormAssetsTable)
        .where(
          makeEntityCondition(
            'asset',
            firestormAssetsTable.updatedAt,
            firestormAssetsTable.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(firestormAssetsTable.updatedAt), asc(firestormAssetsTable.id))
        .limit(perType),
    ]);

    const incidentRecords: ChangeRecord[] = incidents.map((r) => ({
      id: r.id,
      entityType: 'incident',
      updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
      data: r as Record<string, unknown>,
    }));
    const alertRecords: ChangeRecord[] = alerts.map((r) => ({
      id: r.id,
      entityType: 'alert',
      updatedAt: r.createdAt.toISOString(),
      data: r as Record<string, unknown>,
    }));
    const findingRecords: ChangeRecord[] = findings.map((r) => ({
      id: r.id,
      entityType: 'finding',
      updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
      data: r as Record<string, unknown>,
    }));
    const assetRecords: ChangeRecord[] = assets.map((r) => ({
      id: r.id,
      entityType: 'asset',
      updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
      data: r as Record<string, unknown>,
    }));

    const changes = [...incidentRecords, ...alertRecords, ...findingRecords, ...assetRecords];
    changes.sort((a, b) => {
      const tDiff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (tDiff !== 0) return tDiff;
      return String(a.id).localeCompare(String(b.id));
    });

    const { hasMore, nextCursor } = buildNextCursor([
      { entityType: 'incident', records: incidentRecords, hitLimit: incidents.length >= perType },
      { entityType: 'alert', records: alertRecords, hitLimit: alerts.length >= perType },
      { entityType: 'finding', records: findingRecords, hitLimit: findings.length >= perType },
      { entityType: 'asset', records: assetRecords, hitLimit: assets.length >= perType },
    ]);

    sendSuccess(res, {
      domain: 'aegis',
      since: since.getTime(),
      changes,
      hasMore,
      nextCursor,
      serverTime: snapshotTime,
      counts: {
        incidents: incidents.length,
        alerts: alerts.length,
        findings: findings.length,
        assets: assets.length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch Aegis delta-sync');
  }
});

router.get('/vessels/sync', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const snapshotTime = Date.now();
    const cursor = decodeCursor(req.query.cursor as string | undefined);
    const since = parseSince(req.query.since as string | undefined);
    const limit = parseLimit(req.query.limit as string | undefined);
    const perType = Math.ceil(limit / 5);

    const [fleets, vessels, positions, alerts, events] = await Promise.all([
      db
        .select()
        .from(vesselsFleetsTable)
        .where(
          makeEntityCondition(
            'fleet',
            vesselsFleetsTable.updatedAt,
            vesselsFleetsTable.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(vesselsFleetsTable.updatedAt), asc(vesselsFleetsTable.id))
        .limit(perType),

      db
        .select()
        .from(vesselsTable)
        .where(
          makeEntityCondition('vessel', vesselsTable.updatedAt, vesselsTable.id, cursor, since),
        )
        .orderBy(asc(vesselsTable.updatedAt), asc(vesselsTable.id))
        .limit(perType),

      db
        .select()
        .from(vesselsPositionsTable)
        .where(
          makeEntityCondition(
            'position',
            vesselsPositionsTable.recordedAt,
            vesselsPositionsTable.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(vesselsPositionsTable.recordedAt), asc(vesselsPositionsTable.id))
        .limit(perType),

      db
        .select()
        .from(vesselsAlertsTable)
        .where(
          makeEntityCondition(
            'vessel-alert',
            vesselsAlertsTable.triggeredAt,
            vesselsAlertsTable.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(vesselsAlertsTable.triggeredAt), asc(vesselsAlertsTable.id))
        .limit(perType),

      db
        .select()
        .from(vesselsEventsTable)
        .where(
          makeEntityCondition(
            'vessel-event',
            vesselsEventsTable.createdAt,
            vesselsEventsTable.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(vesselsEventsTable.createdAt), asc(vesselsEventsTable.id))
        .limit(perType),
    ]);

    const fleetRecords: ChangeRecord[] = fleets.map((r) => ({
      id: r.id,
      entityType: 'fleet',
      updatedAt: r.updatedAt.toISOString(),
      data: r as Record<string, unknown>,
    }));
    const vesselRecords: ChangeRecord[] = vessels.map((r) => ({
      id: r.id,
      entityType: 'vessel',
      updatedAt: r.updatedAt.toISOString(),
      data: r as Record<string, unknown>,
    }));
    const positionRecords: ChangeRecord[] = positions.map((r) => ({
      id: r.id,
      entityType: 'position',
      updatedAt: r.recordedAt.toISOString(),
      data: r as Record<string, unknown>,
    }));
    const alertRecords: ChangeRecord[] = alerts.map((r) => ({
      id: r.id,
      entityType: 'vessel-alert',
      updatedAt: r.triggeredAt.toISOString(),
      data: r as Record<string, unknown>,
    }));
    const eventRecords: ChangeRecord[] = events.map((r) => ({
      id: r.id,
      entityType: 'vessel-event',
      updatedAt: r.createdAt.toISOString(),
      data: r as Record<string, unknown>,
    }));

    const changes = [
      ...fleetRecords,
      ...vesselRecords,
      ...positionRecords,
      ...alertRecords,
      ...eventRecords,
    ];
    changes.sort((a, b) => {
      const tDiff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (tDiff !== 0) return tDiff;
      return String(a.id).localeCompare(String(b.id));
    });

    const { hasMore, nextCursor } = buildNextCursor([
      { entityType: 'fleet', records: fleetRecords, hitLimit: fleets.length >= perType },
      { entityType: 'vessel', records: vesselRecords, hitLimit: vessels.length >= perType },
      { entityType: 'position', records: positionRecords, hitLimit: positions.length >= perType },
      { entityType: 'vessel-alert', records: alertRecords, hitLimit: alerts.length >= perType },
      { entityType: 'vessel-event', records: eventRecords, hitLimit: events.length >= perType },
    ]);

    sendSuccess(res, {
      domain: 'vessels',
      since: since.getTime(),
      changes,
      hasMore,
      nextCursor,
      serverTime: snapshotTime,
      counts: {
        fleets: fleets.length,
        vessels: vessels.length,
        positions: positions.length,
        alerts: alerts.length,
        events: events.length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch Vessels delta-sync');
  }
});

router.get('/alloy/sync', authMiddleware(), validateQuery(listQuerySchema), async (req, res) => {
  try {
    const snapshotTime = Date.now();
    const cursor = decodeCursor(req.query.cursor as string | undefined);
    const since = parseSince(req.query.since as string | undefined);
    const limit = parseLimit(req.query.limit as string | undefined);
    const perType = Math.ceil(limit / 2);

    const [signals, workflows] = await Promise.all([
      db
        .select()
        .from(alloySignals)
        .where(
          makeEntityCondition('signal', alloySignals.updatedAt, alloySignals.id, cursor, since),
        )
        .orderBy(asc(alloySignals.updatedAt), asc(alloySignals.id))
        .limit(perType),

      db
        .select()
        .from(alloyWorkflows)
        .where(
          makeEntityCondition(
            'workflow',
            alloyWorkflows.updatedAt,
            alloyWorkflows.id,
            cursor,
            since,
          ),
        )
        .orderBy(asc(alloyWorkflows.updatedAt), asc(alloyWorkflows.id))
        .limit(perType),
    ]);

    const signalRecords: ChangeRecord[] = signals.map((r) => ({
      id: r.id,
      entityType: 'signal',
      updatedAt: r.updatedAt.toISOString(),
      data: r as Record<string, unknown>,
    }));
    const workflowRecords: ChangeRecord[] = workflows.map((r) => ({
      id: r.id,
      entityType: 'workflow',
      updatedAt: r.updatedAt.toISOString(),
      data: r as Record<string, unknown>,
    }));

    const changes = [...signalRecords, ...workflowRecords];
    changes.sort((a, b) => {
      const tDiff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (tDiff !== 0) return tDiff;
      return String(a.id).localeCompare(String(b.id));
    });

    const { hasMore, nextCursor } = buildNextCursor([
      { entityType: 'signal', records: signalRecords, hitLimit: signals.length >= perType },
      { entityType: 'workflow', records: workflowRecords, hitLimit: workflows.length >= perType },
    ]);

    sendSuccess(res, {
      domain: 'alloy',
      since: since.getTime(),
      changes,
      hasMore,
      nextCursor,
      serverTime: snapshotTime,
      counts: {
        signals: signals.length,
        workflows: workflows.length,
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch Alloy delta-sync');
  }
});

export default router;
