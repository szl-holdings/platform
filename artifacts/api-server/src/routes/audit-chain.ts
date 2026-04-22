/**
 * Compliance & Audit Provenance Chain
 *
 * Append-only, SHA-256 hash-chained audit log. Each event is linked to
 * the previous event via cryptographic hash, enabling tamper detection.
 *
 * Routes:
 *   GET  /audit-chain/events  — paginated event list (tenant-scoped)
 *   POST /audit-chain/events  — append a new event (auto-chains hash)
 *   GET  /audit-chain/verify  — verify chain integrity
 *   GET  /audit-chain/export  — export chain (?format=csv|json, default json)
 *   GET  /audit/query         — alias of /audit-chain/events for spec naming
 */

import { auditChainEventsTable, db } from '@szl-holdings/db';
import { createHash } from 'crypto';
import { and, count, desc, eq, gte, ilike, or } from 'drizzle-orm';
import { type IRouter, type Request, type Response, Router } from 'express';
import {
  handleRouteError,
  sendCreated,
  sendSuccess,
} from '../lib/api-response';
import { logger } from '../lib/logger';
import {
  auditChainEventSchema,
  listQuerySchema,
  validateBody,
  validateQuery,
} from '../lib/validation';
import { authMiddleware, requireRole } from '../middlewares/auth';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

const router: IRouter = Router();

export function computeEventHash(
  prevHash: string,
  payload: {
    action: string;
    actor: string;
    domain: string;
    actionType: string;
    entityId?: string | null;
    createdAt: string;
  },
): string {
  const data = [
    prevHash,
    payload.action,
    payload.actor,
    payload.domain,
    payload.actionType,
    payload.entityId ?? '',
    payload.createdAt,
  ].join('|');
  return createHash('sha256').update(data).digest('hex');
}

async function getLastEvent(orgId: number | null) {
  // Use id desc (monotonic) rather than createdAt desc, which is non-deterministic
  // when two events land in the same millisecond and produces broken chains.
  const conditions = orgId != null ? [eq(auditChainEventsTable.orgId, orgId)] : [];
  const [last] = await db
    .select({ id: auditChainEventsTable.id, eventHash: auditChainEventsTable.eventHash })
    .from(auditChainEventsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditChainEventsTable.id))
    .limit(1);
  return last ?? null;
}

function callerOrgId(req: Request): number | null {
  return (req.user?.orgs?.[0]?.orgId as number | undefined) ?? null;
}

function buildListConditions(req: Request) {
  const orgId = callerOrgId(req);
  const domain = req.query['domain'] as string | undefined;
  const actionType = req.query['actionType'] as string | undefined;
  const riskLevel = req.query['riskLevel'] as string | undefined;
  const actor = req.query['actor'] as string | undefined;
  const entityUri = req.query['entityUri'] as string | undefined;
  const since = req.query['since'] as string | undefined;
  const search = req.query['search'] as string | undefined;

  const conditions: ReturnType<typeof eq>[] = [];
  // Tenant scoping: always filter by caller's org. System events (orgId IS NULL)
  // are intentionally excluded from per-tenant queries.
  if (orgId != null) {
    conditions.push(eq(auditChainEventsTable.orgId, orgId));
  }
  if (domain) conditions.push(eq(auditChainEventsTable.domain, domain));
  if (actionType) conditions.push(eq(auditChainEventsTable.actionType, actionType));
  if (riskLevel) conditions.push(eq(auditChainEventsTable.riskLevel, riskLevel));
  if (actor) conditions.push(ilike(auditChainEventsTable.actorLabel, `%${actor}%`));
  if (entityUri) conditions.push(eq(auditChainEventsTable.entityId, entityUri));
  if (since) {
    const d = new Date(since);
    if (!isNaN(d.getTime())) conditions.push(gte(auditChainEventsTable.createdAt, d));
  }

  const whereClause = search
    ? and(
        ...(conditions as Parameters<typeof and>),
        or(
          ilike(auditChainEventsTable.action, `%${search}%`),
          ilike(auditChainEventsTable.actorLabel, `%${search}%`),
          ilike(auditChainEventsTable.domain, `%${search}%`),
        ),
      )
    : conditions.length > 0
      ? and(...(conditions as Parameters<typeof and>))
      : undefined;

  return { whereClause, orgId };
}

async function handleListEvents(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(Number(req.query['limit'] ?? 50), 200);
    const offset = Number(req.query['offset'] ?? 0);
    const { whereClause } = buildListConditions(req);

    const [events, [totRow]] = await Promise.all([
      db
        .select()
        .from(auditChainEventsTable)
        .where(whereClause)
        .orderBy(desc(auditChainEventsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(auditChainEventsTable).where(whereClause),
    ]);

    sendSuccess(res, {
      events,
      total: Number(totRow?.total ?? 0),
      limit,
      offset,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch audit chain events');
  }
}

router.get(
  '/audit-chain/events',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  validateQuery(listQuerySchema),
  handleListEvents,
);

// Spec alias — same behavior, named to match #2915 "/api/audit/query".
router.get(
  '/audit/query',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  validateQuery(listQuerySchema),
  handleListEvents,
);

router.post(
  '/audit-chain/events',
  authMiddleware({ required: false }),
  perUserWriteSlidingLimiter,
  validateBody(auditChainEventSchema),
  async (req, res) => {
    const {
      action,
      actionType,
      domain,
      actor: actorLabel,
      entityId,
      entityType,
      metadata,
    } = req.body;

    const riskLevel = (req.body as Record<string, unknown>).riskLevel as string | undefined;
    const complianceTags = (req.body as Record<string, unknown>).complianceTags;
    const outcome = (req.body as Record<string, unknown>).outcome as string | undefined;
    const details = (req.body as Record<string, unknown>).details;

    try {
      const orgId = callerOrgId(req);
      const actorUserId = req.user?.id ?? null;
      const now = new Date();

      const last = await getLastEvent(orgId);
      const prevHash = last?.eventHash ?? 'genesis';

      const eventHash = computeEventHash(prevHash, {
        action,
        actor: actorLabel ?? req.user?.displayName ?? 'system',
        domain,
        actionType,
        entityId: entityId ?? null,
        createdAt: now.toISOString(),
      });

      const [inserted] = await db
        .insert(auditChainEventsTable)
        .values({
          orgId,
          actorUserId,
          actorLabel: actorLabel ?? req.user?.displayName ?? 'system',
          action,
          actionType,
          domain,
          entityId: entityId ?? null,
          entityType: entityType ?? null,
          riskLevel: riskLevel ?? 'low',
          complianceTags: Array.isArray(complianceTags) ? complianceTags : [],
          outcome: outcome ?? 'success',
          details: details ?? null,
          metadata: metadata ?? {},
          prevHash,
          eventHash,
        })
        .returning();

      logger.info(
        { id: inserted.id, domain, actionType, eventHash: eventHash.substring(0, 16) + '...' },
        '[AuditChain] Event appended',
      );

      sendCreated(res, inserted);
    } catch (err) {
      handleRouteError(res, err, 'Failed to append audit chain event');
    }
  },
);

router.get(
  '/audit-chain/verify',
  authMiddleware({ required: false }),
  requireRole('ops', 'analyst', 'admin'),
  perUserApiSlidingLimiter,
  async (req, res) => {
    try {
      const orgId = callerOrgId(req);
      const conditions = orgId != null ? [eq(auditChainEventsTable.orgId, orgId)] : [];

      const events = await db
        .select()
        .from(auditChainEventsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(auditChainEventsTable.id);

      let intact = true;
      let brokenAt: number | null = null;

      for (let i = 0; i < events.length; i++) {
        const ev = events[i]!;
        const expectedPrev = i === 0 ? 'genesis' : events[i - 1]!.eventHash;

        if (ev.prevHash !== expectedPrev) {
          intact = false;
          brokenAt = ev.id;
          break;
        }

        const recomputed = computeEventHash(ev.prevHash, {
          action: ev.action,
          actor: ev.actorLabel,
          domain: ev.domain,
          actionType: ev.actionType,
          entityId: ev.entityId ?? null,
          createdAt: ev.createdAt.toISOString(),
        });

        if (recomputed !== ev.eventHash) {
          intact = false;
          brokenAt = ev.id;
          break;
        }
      }

      sendSuccess(res, {
        intact,
        chainLength: events.length,
        brokenAt,
        verifiedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleRouteError(res, err, 'Chain verification failed');
    }
  },
);

function eventsToCsv(rows: Array<typeof auditChainEventsTable.$inferSelect>): string {
  const cols = [
    'id',
    'createdAt',
    'orgId',
    'actorLabel',
    'action',
    'actionType',
    'domain',
    'entityId',
    'entityType',
    'riskLevel',
    'outcome',
    'prevHash',
    'eventHash',
  ] as const;
  const escape = (v: unknown): string => {
    if (v == null) return '';
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(',');
  const body = rows
    .map((r) => cols.map((c) => escape((r as Record<string, unknown>)[c])).join(','))
    .join('\n');
  return `${header}\n${body}\n`;
}

router.get(
  '/audit-chain/export',
  authMiddleware(),
  requireRole('ops', 'analyst'),
  async (req, res) => {
    try {
      const orgId = callerOrgId(req);
      const conditions = orgId != null ? [eq(auditChainEventsTable.orgId, orgId)] : [];
      const format = (req.query['format'] as string | undefined)?.toLowerCase() === 'csv'
        ? 'csv'
        : 'json';

      const events = await db
        .select()
        .from(auditChainEventsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditChainEventsTable.createdAt))
        .limit(10000);

      if (format === 'csv') {
        const csv = eventsToCsv(events);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="audit-chain-${new Date().toISOString().slice(0, 10)}.csv"`,
        );
        res.status(200).send(csv);
        return;
      }

      sendSuccess(res, {
        exportedAt: new Date().toISOString(),
        count: events.length,
        events,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to export audit chain');
    }
  },
);

export default router;
