/**
 * Compliance & Audit Provenance Chain
 *
 * Append-only, SHA-256 hash-chained audit log. Each event is linked to
 * the previous event via cryptographic hash, enabling tamper detection.
 * New events additionally carry a hybrid (Ed25519 + ML-DSA-65) signature
 * bound to the signing DID — legacy rows without signatures are classified
 * as `legacy_unsigned` (not failures) on verify.
 *
 * Routes:
 *   GET  /audit-chain/events  — paginated event list (tenant-scoped)
 *   POST /audit-chain/events  — append a new event (auto-chains hash + hybrid sig)
 *   GET  /audit-chain/verify  — verify chain integrity + signature classification
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
import {
  signAuditEvent,
  verifyAuditRow,
  handleSigningFailure,
  type SignatureStatus,
} from '../lib/audit-chain-signer';

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

    const eventsWithStatus = await Promise.all(
      events.map(async (ev) => ({
        ...ev,
        sigStatus: (await verifyAuditRow({
          ed25519Sig: ev.ed25519Sig,
          mldsa65Sig: ev.mldsa65Sig,
          sigPublicKeyEd25519: ev.sigPublicKeyEd25519,
          sigPublicKeyMldsa65: ev.sigPublicKeyMldsa65,
          signingDid: ev.signingDid,
          keyId: ev.keyId,
          schemeVersion: ev.schemeVersion,
          prevHash: ev.prevHash,
          action: ev.action,
          actorLabel: ev.actorLabel,
          domain: ev.domain,
          actionType: ev.actionType,
          entityId: ev.entityId,
          createdAt: ev.createdAt,
        })).status,
      })),
    );

    sendSuccess(res, {
      events: eventsWithStatus,
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
      const resolvedActorLabel = actorLabel ?? req.user?.displayName ?? 'system';

      const last = await getLastEvent(orgId);
      const prevHash = last?.eventHash ?? 'genesis';

      const eventHash = computeEventHash(prevHash, {
        action,
        actor: resolvedActorLabel,
        domain,
        actionType,
        entityId: entityId ?? null,
        createdAt: now.toISOString(),
      });

      // Attempt hybrid signing. On failure, apply rollout flag behavior.
      const actorDid = (req.user as (typeof req.user & { did?: string }) | undefined)?.did;
      let sigResult = await signAuditEvent({
        prevHash,
        action,
        actorLabel: resolvedActorLabel,
        domain,
        actionType,
        entityId: entityId ?? null,
        createdAt: now,
        actorDid,
      });

      if (!sigResult) {
        const { shouldAbort } = handleSigningFailure(
          new Error('signAuditEvent returned null — platform DID not ready'),
          { action, domain, actionType },
        );
        if (shouldAbort) {
          res.status(503).json({
            ok: false,
            error: 'signing_required',
            detail: 'AUDIT_CHAIN_ROLLOUT=enforce: signing is required but failed. Retry after platform identity bootstrap.',
          });
          return;
        }
      }

      const [inserted] = await db
        .insert(auditChainEventsTable)
        .values({
          orgId,
          actorUserId,
          actorLabel: resolvedActorLabel,
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
          // Signature columns — null if signing failed/unavailable (legacy_unsigned)
          ed25519Sig: sigResult?.ed25519Sig ?? null,
          mldsa65Sig: sigResult?.mldsa65Sig ?? null,
          signingDid: sigResult?.signingDid ?? null,
          keyId: sigResult?.keyId ?? null,
          schemeVersion: sigResult?.schemeVersion ?? null,
          sigPublicKeyEd25519: sigResult?.sigPublicKeyEd25519 ?? null,
          sigPublicKeyMldsa65: sigResult?.sigPublicKeyMldsa65 ?? null,
        })
        .returning();

      logger.info(
        {
          id: inserted.id,
          domain,
          actionType,
          eventHash: eventHash.substring(0, 16) + '...',
          sigStatus: sigResult ? 'hybrid_signed' : 'unsigned',
          signingDid: sigResult?.signingDid,
        },
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
      let hybridVerified = 0;
      let legacyUnsigned = 0;
      let broken = 0;
      const brokenReasons: Array<{ id: number; reason: string }> = [];
      // Λ-receipt aggregate (Ouroboros Thesis v3 four-axis envelope).
      // meanLambda is the geometric-mean trust scalar across all signed rows in [0,1].
      let lambdaSum = 0;
      let lambdaCount = 0;

      for (let i = 0; i < events.length; i++) {
        const ev = events[i]!;
        const expectedPrev = i === 0 ? 'genesis' : events[i - 1]!.eventHash;

        // 1. Hash chain integrity check
        if (ev.prevHash !== expectedPrev) {
          intact = false;
          brokenAt = ev.id;
          broken++;
          brokenReasons.push({ id: ev.id, reason: 'prev_hash_mismatch' });
          continue;
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
          if (brokenAt === null) brokenAt = ev.id;
          broken++;
          brokenReasons.push({ id: ev.id, reason: 'hash_mismatch' });
          continue;
        }

        // 2. Hybrid signature check (async — performs registry cross-check G3/G4/G5)
        const sigResult = await verifyAuditRow({
          ed25519Sig: ev.ed25519Sig,
          mldsa65Sig: ev.mldsa65Sig,
          sigPublicKeyEd25519: ev.sigPublicKeyEd25519,
          sigPublicKeyMldsa65: ev.sigPublicKeyMldsa65,
          signingDid: ev.signingDid,
          keyId: ev.keyId,
          schemeVersion: ev.schemeVersion,
          prevHash: ev.prevHash,
          action: ev.action,
          actorLabel: ev.actorLabel,
          domain: ev.domain,
          actionType: ev.actionType,
          entityId: ev.entityId,
          createdAt: ev.createdAt,
        });

        if (sigResult.status === 'hybrid_verified') {
          hybridVerified++;
        } else if (sigResult.status === 'legacy_unsigned') {
          legacyUnsigned++;
        } else {
          broken++;
          if (brokenAt === null) brokenAt = ev.id;
          brokenReasons.push({ id: ev.id, reason: sigResult.reason ?? 'signature_invalid' });
        }

        if (sigResult.lambdaReceipt) {
          lambdaSum += sigResult.lambdaReceipt.lambda;
          lambdaCount++;
        }
      }

      const meanLambda = lambdaCount > 0 ? lambdaSum / lambdaCount : null;

      sendSuccess(res, {
        intact,
        chainLength: events.length,
        brokenAt,
        verifiedAt: new Date().toISOString(),
        summary: {
          hybrid_verified: hybridVerified,
          legacy_unsigned: legacyUnsigned,
          broken,
        },
        // Λ-receipt aggregate (Ouroboros Thesis v3 four-axis envelope).
        // axiomSet=lutar-v3-4axis: C·H·R·F geometric mean per row, averaged across chain.
        lambdaReceipt: meanLambda !== null
          ? { meanLambda, sampledRows: lambdaCount, axiomSet: 'lutar-v3-4axis' as const }
          : null,
        brokenReasons: brokenReasons.length > 0 ? brokenReasons : undefined,
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
    'signingDid',
    'schemeVersion',
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
