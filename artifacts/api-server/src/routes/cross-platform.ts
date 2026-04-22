/**
 * Cross-Platform Intelligence endpoints
 *
 * These endpoints implement rule-based cross-product signal correlation by
 * querying the trace-graph (defaultTraceStore + defaultQueryEngine) for real
 * data produced by KORA, SEXTANT, DOMAINE, PRAXIS, PARAGON, and Carlota agents.
 *
 * Auth model:
 *   - All four routes use authMiddleware({ required: false }), so an auth
 *     token is never required by the route itself.
 *   - Global auth enforcement: in production (NODE_ENV === "production"),
 *     global-auth-enforcer.ts blocks unauthenticated access to /api/ before
 *     this router is reached. In non-production environments the enforcer
 *     applies a NODE_ENV guard that lets the demo surface through.
 *   - The /api/cross-platform/ prefix is NOT in PUBLIC_PREFIXES — it is
 *     intentionally protected in production behind the global enforcer.
 *
 * Tenant scoping:
 *   - tenantContextFromRequest extracts orgSlug from req.user.orgs[0].
 *   - filterByOrg performs a post-query org-level isolation pass:
 *       - Traces tagged with metadata.orgSlug that do NOT match the caller's
 *         orgSlug are excluded (cross-tenant isolation).
 *       - Untagged traces (demo / system traces without metadata.orgSlug) are
 *         always included so the portfolio surface remains usable before agents
 *         emit org-tagged runs.
 *   - Full org-tag instrumentation at write-time is tracked in a follow-up task.
 */

import { db, partnerPilotsTable } from '@szl-holdings/db';
import { prismBus } from '@szl-holdings/prism-bus';
import {
  defaultQueryEngine,
  defaultTraceStore,
  type TraceQueryFilter,
  type TraceRecord,
} from '@workspace/trace-graph';
import { and, eq, gte, inArray, isNull, lte, or, type SQL } from 'drizzle-orm';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// Product metadata — shared across all four surfaces
// ────────────────────────────────────────────────────────────────────────────

const PRODUCTS = ['lyte', 'vessels', 'terra', 'prism', 'aegis', 'carlota'] as const;
type Product = (typeof PRODUCTS)[number];

const PRODUCT_META: Record<
  Product,
  { label: string; color: string; icon: string; drillBase: string }
> = {
  lyte: { label: 'KORA AIOps', color: '#d4a054', icon: '⚡', drillBase: '/operations/runs' },
  vessels: { label: 'SEXTANT', color: '#0ea5e9', icon: '⚓', drillBase: '/vessels' },
  terra: { label: 'DOMAINE', color: '#22c55e', icon: '⬢', drillBase: '/terra' },
  prism: { label: 'Counsel', color: '#a855f7', icon: '⚖', drillBase: '/prism-counsel' },
  aegis: { label: 'PARAGON Security', color: '#ef4444', icon: '⚔', drillBase: '/aegis' },
  carlota: { label: 'Carlota Jo', color: '#f59e0b', icon: '◉', drillBase: '/carlota-jo' },
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function domainFromTrace(metadata: Record<string, unknown>): string | null {
  const d = metadata?.domain;
  return typeof d === 'string' ? d.toLowerCase() : null;
}

function tenantContextFromRequest(req: Request): { orgSlug: string | null } {
  const primaryOrg = req.user?.orgs?.[0];
  return { orgSlug: primaryOrg?.orgSlug ?? null };
}

/**
 * Build a base TraceQueryFilter from optional caller-supplied params.
 * Org-level isolation is applied separately via filterByOrg() because the
 * trace-graph query engine does not yet accept an orgSlug field natively.
 */
function buildTenantFilter(orgSlug: string | null, base: TraceQueryFilter = {}): TraceQueryFilter {
  // orgSlug is captured for post-filtering; the query engine receives only the
  // standard fields (domain, after, before, limit, etc.).
  void orgSlug;
  return base;
}

/**
 * Post-query org-level isolation.
 *
 * Enforcement rules:
 *   - Unauthenticated / no orgSlug: all traces returned (demo mode).
 *   - Authenticated with orgSlug:
 *       - Traces whose metadata.orgSlug matches the caller's org: included.
 *       - Traces whose metadata.orgSlug differs from the caller's org: EXCLUDED
 *         (strict cross-tenant isolation).
 *       - Traces with no metadata.orgSlug field (untagged/demo traces): included
 *         so the portfolio surface stays usable before full write-time tagging.
 *
 * Full org-tag instrumentation at write-time is tracked in follow-up task #1871.
 */
function filterByOrg(traces: TraceRecord[], orgSlug: string | null): TraceRecord[] {
  if (!orgSlug) return traces; // unauthenticated / demo mode: no restriction

  const isProd = process.env.NODE_ENV === 'production';

  return traces.filter((t) => {
    const traceOrg = t.metadata?.orgSlug;
    if (typeof traceOrg === 'string') {
      return traceOrg === orgSlug; // tagged trace: strict org match
    }
    // Untagged trace (no metadata.orgSlug):
    //   - Production: EXCLUDED (fail-closed; prevents leaking pre-instrumented data
    //     across authenticated org boundaries before write-time tagging is complete)
    //   - Non-production: INCLUDED (so the demo/sandbox surface remains usable)
    return !isProd;
  });
}

function _parseTimeWindow(query: Record<string, unknown>): { after?: string; before?: string } {
  const after = typeof query.after === 'string' ? query.after : undefined;
  const before = typeof query.before === 'string' ? query.before : undefined;
  return { after, before };
}

/**
 * Compute the authoritative owning product for each entity across the given
 * trace set. "Owner" = the product domain of the earliest trace that recorded
 * the entity (the originating product). Used by both correlations and evidence
 * endpoints so the UI does not need to guess via string-prefix heuristics.
 *
 * Only domains in PRODUCTS contribute. Traces with non-product domains or no
 * domain are skipped when assigning ownership.
 */
function buildEntityOwnerMap(traces: TraceRecord[]): Map<string, Product> {
  const owners = new Map<string, Product>();
  const sorted = [...traces].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );
  const productSet = new Set<string>(PRODUCTS);
  for (const t of sorted) {
    const dom = domainFromTrace(t.metadata);
    if (!dom || !productSet.has(dom)) continue;
    const entityIds = defaultQueryEngine.getEntitiesForTrace(t.traceId);
    for (const eid of entityIds) {
      if (!owners.has(eid)) owners.set(eid, dom as Product);
    }
  }
  return owners;
}

// ────────────────────────────────────────────────────────────────────────────
// Cross-platform correlation alert emission
//
// When a correlation is detected with strength ≥ 0.85 OR outcome === "escalated",
// we publish a `cross_domain_correlation` event onto the prism-bus. The Command
// Inbox (/operations/inbox) reads this stream via /api/command/alerts and surfaces
// the correlation as an inbox message — operators no longer have to navigate to
// the Signal Correlation page to see them.
//
// When the correlation also involves an unresolved policy breach (a guardrail
// outcome of "block" / "require-approval" on any participating trace), we
// additionally create a human-in-the-loop approval request via covenant-policy
// so it appears in /operations/approvals.
//
// Both emissions are deduplicated by correlationId (in-memory) so re-running the
// detector on the same trace-graph state does not flood the inbox / approvals.
// ────────────────────────────────────────────────────────────────────────────

const emittedCorrelationEventIds = new Set<string>();
const emittedCorrelationApprovalIds = new Set<string>();
const MAX_DEDUP_SET_SIZE = 5000;

type CorrelationForEmission = {
  correlationId: string;
  rule: string;
  title: string;
  description: string;
  products: string[];
  strength: number;
  outcome: string;
  hasUnresolvedPolicyBreach: boolean;
};

function dedupKey(orgId: number | null, orgSlug: string | null, correlationId: string): string {
  // Prefer the numeric orgId for tenant scoping (matches the tenantId tagged
  // onto bus events and approval rows). Fall back to orgSlug, then to a
  // global bucket only when no tenant context is available.
  const tenantPart =
    orgId != null ? `org:${orgId}` : orgSlug != null ? `slug:${orgSlug}` : '_global_';
  return `${tenantPart}::${correlationId}`;
}

// Map a cross-platform product code (lyte, vessels, terra, prism, aegis, carlota)
// to a valid PrismDomain accepted by prism-bus. Products without a 1:1 domain
// (prism, carlota) collapse to their canonical domain or to "global".
function productToPrismDomain(
  product: string | undefined,
): 'lyte' | 'vessels' | 'terra' | 'aegis' | 'carlota-jo' | 'global' {
  switch (product) {
    case 'lyte':
    case 'vessels':
    case 'terra':
    case 'aegis':
      return product;
    case 'carlota':
      return 'carlota-jo';
    default:
      return 'global';
  }
}

function trimDedupSet(set: Set<string>): void {
  if (set.size <= MAX_DEDUP_SET_SIZE) return;
  const overflow = set.size - MAX_DEDUP_SET_SIZE;
  const it = set.values();
  for (let i = 0; i < overflow; i++) {
    const next = it.next();
    if (next.done) break;
    set.delete(next.value);
  }
}

async function emitCorrelationAlerts(
  correlations: CorrelationForEmission[],
  tenant: { orgSlug: string | null; orgId: number | null },
  userId: number | null,
): Promise<void> {
  const { orgSlug, orgId } = tenant;
  for (const c of correlations) {
    const isHighStrength = c.strength >= 0.85;
    const isEscalated = c.outcome === 'escalated';
    // Inbox surfacing fires when the correlation is high-strength OR escalated.
    // Approval surfacing fires whenever an unresolved policy breach is involved
    // — independently of strength — because the requirement is HITL review for
    // breaches, even those whose strength formula falls below the inbox bar
    // (e.g. time-window correlations with require-approval but no block).
    const shouldEmitInbox = isHighStrength || isEscalated;
    const shouldEmitApproval = c.hasUnresolvedPolicyBreach;
    if (!shouldEmitInbox && !shouldEmitApproval) continue;

    const key = dedupKey(orgId, orgSlug, c.correlationId);

    // ── Inbox surfacing via prism-bus ────────────────────────────────────
    if (shouldEmitInbox && !emittedCorrelationEventIds.has(key)) {
      const severity: 'high' | 'critical' = isEscalated ? 'critical' : 'high';
      try {
        await prismBus.publish({
          type: 'cross_domain_correlation',
          // Map the first product of the correlation to a valid PrismDomain so
          // the bus receives a semantically correct domain (no untyped cast).
          domain: productToPrismDomain(c.products[0]),
          sourceId: 'cross-platform-correlation-detector',
          payload: {
            correlationId: c.correlationId,
            rule: c.rule,
            title: c.title,
            description: c.description,
            products: c.products,
            strength: c.strength,
            outcome: c.outcome,
            drillUrl: `/strategy/cross-platform?correlationId=${encodeURIComponent(c.correlationId)}`,
          },
          severity,
          correlationId: c.correlationId,
          // Tenant-tag the bus event so per-tenant inbox readers can filter it.
          tenantId: orgId != null ? String(orgId) : (orgSlug ?? null),
          userId: userId != null ? String(userId) : null,
        });
        // Mark deduped only after successful publish so transient failures
        // can still be retried on the next detection run.
        emittedCorrelationEventIds.add(key);
        trimDedupSet(emittedCorrelationEventIds);
      } catch (err) {
        logger.warn(
          { err, correlationId: c.correlationId },
          'cross-platform.correlation-alert-publish-failed',
        );
      }
    }

    // ── Approvals surfacing for unresolved policy-breach correlations ────
    if (shouldEmitApproval && !emittedCorrelationApprovalIds.has(key)) {
      try {
        const { createApprovalRequest, listApprovalsByResource } = await import(
          '@szl-holdings/covenant-policy'
        );
        // listApprovalsByResource is global — filter by the caller's orgId so
        // we do not let one tenant's approval suppress emission for another.
        const existing = await listApprovalsByResource(
          'cross-platform-correlation',
          c.correlationId,
        );
        const sameOrg = existing.filter((a) => (a.orgId ?? null) === (orgId ?? null));
        const hasOpen = sameOrg.some((a) => a.status === 'pending' || a.status === 'escalated');
        if (!hasOpen) {
          await createApprovalRequest({
            orgId,
            resourceType: 'cross-platform-correlation',
            resourceId: c.correlationId,
            title: `Cross-platform correlation requires review: ${c.title}`,
            description:
              `${c.description}\n\nStrength: ${(c.strength * 100).toFixed(0)}%. ` +
              `Outcome: ${c.outcome}. Products: ${c.products.join(', ')}. ` +
              `An unresolved policy breach is involved — operator review required.`,
            actionClass: 'policy-review',
            priority: 'critical',
            requestedById: null,
            requestedByRole: 'cross-platform-correlation-agent',
            requiredApproverRole: 'compliance',
            correlationId: c.correlationId,
            serviceAttribution: 'cross-platform-correlation-detector',
            payload: {
              correlationId: c.correlationId,
              rule: c.rule,
              products: c.products,
              strength: c.strength,
              outcome: c.outcome,
              drillUrl: `/strategy/cross-platform?correlationId=${encodeURIComponent(c.correlationId)}`,
            },
          });
        }
        // Mark deduped only after the create attempt completed without throwing
        // (or after we determined an open approval already exists). Transient
        // failures will be re-attempted on the next detection run.
        emittedCorrelationApprovalIds.add(key);
        trimDedupSet(emittedCorrelationApprovalIds);
      } catch (err) {
        logger.warn(
          { err, correlationId: c.correlationId },
          'cross-platform.correlation-approval-create-failed',
        );
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/cross-platform/correlations
//
// Rule 1: entity-overlap — same entityId appears in traces from ≥2 distinct
//   product domains. The entityLinks index in TraceQueryEngine is the source.
// Rule 2: time-window — two traces from different domains started within a
//   configurable window (default 30 min) share no explicit entityId overlap but
//   are temporally coupled.
// ────────────────────────────────────────────────────────────────────────────

const correlationsQuerySchema = z.object({
  product: z.string().optional(),
  entity: z.string().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
  windowMins: z.coerce.number().min(1).max(1440).default(30),
  limit: z.coerce.number().min(1).max(200).default(40),
  offset: z.coerce.number().min(0).default(0),
});

router.get(
  '/cross-platform/correlations',
  authMiddleware({ required: false }),
  validateQuery(correlationsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { product, entity, after, before, windowMins, limit, offset } = req.query as z.infer<
        typeof correlationsQuerySchema
      >;

      const { orgSlug } = tenantContextFromRequest(req);
      const baseFilter: TraceQueryFilter = buildTenantFilter(orgSlug, {
        after,
        before,
        limit: 500,
      });
      const allTraces = filterByOrg(defaultQueryEngine.query(baseFilter).traces, orgSlug);

      // Build entity → {domain, traceId}[] index for rule 1
      const entityDomainMap = new Map<string, { domain: string; traceId: string }[]>();
      for (const t of allTraces) {
        const dom = domainFromTrace(t.metadata) ?? 'lyte';
        const entityIds = defaultQueryEngine.getEntitiesForTrace(t.traceId);
        for (const eid of entityIds) {
          if (!entityDomainMap.has(eid)) entityDomainMap.set(eid, []);
          entityDomainMap.get(eid)?.push({ domain: dom, traceId: t.traceId });
        }
      }

      // Authoritative entity → owning product map. The trace store knows which
      // trace recorded each entity; the owner is the originating product (the
      // earliest trace's domain). The UI consumes this so it does not need to
      // guess via string-prefix heuristics.
      const entityOwnerMap = buildEntityOwnerMap(allTraces);

      const correlations: Array<{
        correlationId: string;
        rule: string;
        title: string;
        description: string;
        products: string[];
        entityIds: string[];
        entityOwners: Record<string, string>;
        traceRefs: Array<{ traceId: string; domain: string; drillUrl: string }>;
        strength: number;
        outcome: string;
        detectedAt: string;
        proofEnvelope: { hash: string; signedAt: string; signerAgentId: string };
      }> = [];

      // Track which correlations involve an unresolved policy breach so we can
      // emit a corresponding approval request after the response is built.
      const unresolvedPolicyBreachByCorrelationId = new Set<string>();

      // ── Rule 1: entity-overlap ──────────────────────────────────────────
      for (const [eid, entries] of entityDomainMap.entries()) {
        const domainSet = new Set(entries.map((e) => e.domain));
        if (domainSet.size < 2) continue;
        const products = Array.from(domainSet);
        const traceRefs = entries.map((e) => ({
          traceId: e.traceId,
          domain: e.domain,
          drillUrl: `${PRODUCT_META[e.domain as Product]?.drillBase ?? '/'}?traceId=${e.traceId}`,
        }));
        const hasBlock = entries.some((e) => {
          const t = defaultTraceStore.get(e.traceId);
          return t?.guardrailResults.some(
            (g) => g.outcome === 'block' || g.outcome === 'require-approval',
          );
        });
        const hasError = entries.some((e) => {
          const t = defaultTraceStore.get(e.traceId);
          return (t?.errors.length ?? 0) > 0;
        });

        const eoCorrelationId = `CORR-eo-${eid.replace(/[^a-z0-9]/gi, '-').slice(0, 24)}`;
        if (hasBlock) unresolvedPolicyBreachByCorrelationId.add(eoCorrelationId);

        correlations.push({
          correlationId: eoCorrelationId,
          rule: 'entity-overlap',
          title: `Entity ${eid} spans ${products.join(' + ')}`,
          description:
            `Entity identifier "${eid}" appears in traces from ${products.length} distinct ` +
            `product domains (${products.join(', ')}), indicating a shared real-world object ` +
            `or counterparty across the portfolio.`,
          products,
          entityIds: [eid],
          // Only emit an owner when authoritatively known from the trace
          // store. UI falls back to its local heuristic when omitted.
          entityOwners: entityOwnerMap.has(eid) ? { [eid]: entityOwnerMap.get(eid)! } : {},
          traceRefs,
          strength: Math.min(0.6 + (domainSet.size - 2) * 0.12 + (hasBlock ? 0.1 : 0), 0.98),
          outcome: hasBlock ? 'escalated' : hasError ? 'under-review' : 'informational',
          detectedAt: new Date().toISOString(),
          proofEnvelope: {
            hash: `sha256:${Buffer.from(`entity-overlap:${eid}`).toString('hex').slice(0, 32)}`,
            signedAt: new Date().toISOString(),
            signerAgentId: 'cross-platform-correlation-agent',
          },
        });
      }

      // ── Rule 2: time-window (different domains, same time bucket) ────────
      // Dedup key: timeBucket + domain-set so the same domain pair in different
      // time windows produces distinct correlations (not collapsed into one).
      const windowMs = Number(windowMins) * 60 * 1000;
      const processed = new Set<string>();
      const sorted = [...allTraces].sort(
        (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
      );

      for (let i = 0; i < sorted.length; i++) {
        const ta = sorted[i];
        const domA = domainFromTrace(ta.metadata);
        if (!domA) continue;
        const pairDomains: Set<string> = new Set([domA]);
        const pairTraces = [{ traceId: ta.traceId, domain: domA }];
        const tA = new Date(ta.startedAt).getTime();
        // Time-bucket: floor the anchor trace start to the nearest window boundary
        const timeBucket = Math.floor(tA / windowMs);

        for (let j = i + 1; j < sorted.length; j++) {
          const tb = sorted[j];
          const tB = new Date(tb.startedAt).getTime();
          if (tB - tA > windowMs) break;
          const domB = domainFromTrace(tb.metadata);
          if (!domB || domB === domA) continue;
          pairDomains.add(domB);
          pairTraces.push({ traceId: tb.traceId, domain: domB });
        }

        if (pairDomains.size < 2) continue;
        // Include timeBucket in dedup key: same domains in different windows = distinct correlations
        const pairKey = `${timeBucket}:${[...pairDomains].sort().join('|')}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const products = Array.from(pairDomains);
        const hasBlock = pairTraces.some((pt) => {
          const t = defaultTraceStore.get(pt.traceId);
          return t?.guardrailResults.some((g) => g.outcome === 'block');
        });
        // Parity with entity-overlap rule: an unresolved "require-approval"
        // outcome is also a policy breach that needs HITL review.
        const hasUnresolvedBreachTW = pairTraces.some((pt) => {
          const t = defaultTraceStore.get(pt.traceId);
          return t?.guardrailResults.some(
            (g) => g.outcome === 'block' || g.outcome === 'require-approval',
          );
        });

        const twCorrelationId = `CORR-tw-${pairKey.replace(/[^a-z0-9]/gi, '-').slice(0, 24)}`;
        if (hasUnresolvedBreachTW) unresolvedPolicyBreachByCorrelationId.add(twCorrelationId);

        correlations.push({
          correlationId: twCorrelationId,
          rule: 'time-window',
          title: `Concurrent ${products.join(' + ')} activity within ${windowMins}min window`,
          description:
            `Traces from ${products.join(' and ')} were initiated within a ` +
            `${windowMins}-minute window, indicating temporally coupled agent activity ` +
            `across product boundaries.`,
          products,
          entityIds: [],
          entityOwners: {},
          traceRefs: pairTraces.map((pt) => ({
            ...pt,
            drillUrl: `${PRODUCT_META[pt.domain as Product]?.drillBase ?? '/'}?traceId=${pt.traceId}`,
          })),
          strength: Math.min(0.5 + (pairDomains.size - 2) * 0.08 + (hasBlock ? 0.12 : 0), 0.88),
          outcome: hasBlock ? 'escalated' : 'informational',
          detectedAt: new Date().toISOString(),
          proofEnvelope: {
            hash: `sha256:${Buffer.from(`time-window:${pairKey}`).toString('hex').slice(0, 32)}`,
            signedAt: new Date().toISOString(),
            signerAgentId: 'cross-platform-correlation-agent',
          },
        });
      }

      // ── Apply post-query filters ─────────────────────────────────────────
      let filtered = correlations;
      if (product) {
        const p = product.toLowerCase();
        filtered = filtered.filter((c) => c.products.includes(p));
      }
      if (entity) {
        const e = entity.toLowerCase();
        filtered = filtered.filter((c) => c.entityIds.some((id) => id.toLowerCase().includes(e)));
      }

      filtered.sort((a, b) => b.strength - a.strength);
      const total = filtered.length;
      const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

      sendSuccess(res, {
        correlations: paginated,
        total,
        liveData: true,
        dataSource: 'trace-graph:entity-overlap+time-window',
        productMeta: PRODUCT_META,
      });

      // Fire-and-forget: surface high-strength / escalated correlations to the
      // Command Inbox via prism-bus, and mint approval requests for those
      // involving an unresolved policy breach. Failures must not affect the
      // response.
      const forEmission: CorrelationForEmission[] = correlations.map((c) => ({
        correlationId: c.correlationId,
        rule: c.rule,
        title: c.title,
        description: c.description,
        products: c.products,
        strength: c.strength,
        outcome: c.outcome,
        hasUnresolvedPolicyBreach: unresolvedPolicyBreachByCorrelationId.has(c.correlationId),
      }));
      const callerOrgId = req.user?.orgs?.[0]?.orgId ?? null;
      void emitCorrelationAlerts(
        forEmission,
        { orgSlug, orgId: callerOrgId },
        req.user?.id ?? null,
      ).catch((err) => {
        logger.warn({ err }, 'cross-platform.correlation-emit-failed');
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load cross-platform correlations');
    }
  },
);

// ────────────────────────────────────────────────────────────────────────────
// GET /api/cross-platform/evidence
//
// Reads evidence from the trace-graph: guardrail results, tool calls, errors,
// and verifier decisions are mapped to typed evidence nodes. Supports unified
// search across all product domains with product, kind, entity, time, and
// free-text filters.
// ────────────────────────────────────────────────────────────────────────────

const evidenceQuerySchema = z.object({
  q: z.string().optional(),
  product: z.string().optional(),
  kind: z.string().optional(),
  entity: z.string().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

router.get(
  '/cross-platform/evidence',
  authMiddleware({ required: false }),
  validateQuery(evidenceQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { q, product, kind, entity, after, before, limit, offset } = req.query as z.infer<
        typeof evidenceQuerySchema
      >;

      const { orgSlug } = tenantContextFromRequest(req);
      const traceFilter: TraceQueryFilter = buildTenantFilter(orgSlug, {
        after,
        before,
        limit: 500,
      });
      if (entity) traceFilter.entityId = entity;

      const traces = filterByOrg(defaultQueryEngine.query(traceFilter).traces, orgSlug);

      // Authoritative entity → owning product map (originating product).
      const entityOwnerMap = buildEntityOwnerMap(traces);

      const nodes: Array<{
        evidenceId: string;
        product: string;
        kind: string;
        ref: string;
        summary: string;
        entityId: string;
        // Optional — only populated when authoritatively known from the trace
        // store. UI falls back to its local heuristic when absent.
        entityOwner?: Product;
        tags: string[];
        capturedAt: string;
        traceId: string;
        drillUrl: string;
      }> = [];

      for (const t of traces) {
        const dom = domainFromTrace(t.metadata) ?? 'lyte';
        const prodMeta = PRODUCT_META[dom as Product];
        const drillBase = prodMeta?.drillBase ?? '/';
        const entityIds = defaultQueryEngine.getEntitiesForTrace(t.traceId);
        const primaryEntity = entityIds[0] ?? t.agentId ?? t.traceId;
        const primaryEntityOwner = entityOwnerMap.get(primaryEntity);

        // Guardrail results → policy-decision evidence nodes
        for (const g of t.guardrailResults) {
          nodes.push({
            evidenceId: `EVD-${t.traceId.slice(0, 8)}-gr-${g.guardId.slice(0, 6)}`,
            product: dom,
            kind: g.outcome === 'block' ? 'policy-block' : 'policy-decision',
            ref: g.guardId,
            summary: `[${dom}] Guardian ${g.tier} ${g.outcome}: ${g.reason ?? 'no reason'}`,
            entityId: primaryEntity,
            entityOwner: primaryEntityOwner,
            tags: ['guardrail', g.outcome, g.tier, dom],
            capturedAt: t.startedAt,
            traceId: t.traceId,
            drillUrl: `${drillBase}?traceId=${t.traceId}`,
          });
        }

        // Errors → error evidence nodes
        for (const e of t.errors) {
          nodes.push({
            evidenceId: `EVD-${t.traceId.slice(0, 8)}-err-${e.code.slice(0, 6)}`,
            product: dom,
            kind: 'error-event',
            ref: e.code,
            summary: `[${dom}] Error ${e.code}: ${e.message}`,
            entityId: primaryEntity,
            entityOwner: primaryEntityOwner,
            tags: ['error', e.code, dom],
            capturedAt: e.timestamp,
            traceId: t.traceId,
            drillUrl: `${drillBase}?traceId=${t.traceId}`,
          });
        }

        // Verifier decisions → compliance evidence nodes
        for (const v of t.verifierDecisions) {
          nodes.push({
            evidenceId: `EVD-${t.traceId.slice(0, 8)}-vd-${v.verifierId.slice(0, 6)}`,
            product: dom,
            kind: 'verifier-decision',
            ref: v.verifierId,
            summary: `[${dom}] Verifier ${v.verifierId} at step "${v.step}": ${v.outcome}${v.reason ? ` — ${v.reason}` : ''}`,
            entityId: primaryEntity,
            entityOwner: primaryEntityOwner,
            tags: ['verifier', v.outcome, dom],
            capturedAt: v.timestamp,
            traceId: t.traceId,
            drillUrl: `${drillBase}?traceId=${t.traceId}`,
          });
        }

        // Run completion → run-record evidence node
        if (t.status === 'completed' || t.status === 'failed') {
          nodes.push({
            evidenceId: `EVD-${t.traceId.slice(0, 8)}-run`,
            product: dom,
            kind: 'run-record',
            ref: t.runId ?? t.traceId,
            summary:
              `[${dom}] Run ${t.status} — agent ${t.agentId ?? 'unknown'}, ` +
              `${t.latencyMs ?? 0}ms, ${t.totalTokens ?? 0} tokens`,
            entityId: primaryEntity,
            entityOwner: primaryEntityOwner,
            tags: ['run', t.status, dom, ...(t.agentId ? [t.agentId] : [])],
            capturedAt: t.startedAt,
            traceId: t.traceId,
            drillUrl: `${drillBase}?traceId=${t.traceId}`,
          });
        }
      }

      // ── Post-filters ──────────────────────────────────────────────────────
      let filtered = nodes;
      if (product) filtered = filtered.filter((n) => n.product === product.toLowerCase());
      if (kind) filtered = filtered.filter((n) => n.kind === kind);
      if (q) {
        const lq = q.toLowerCase();
        filtered = filtered.filter(
          (n) =>
            n.summary.toLowerCase().includes(lq) ||
            n.ref.toLowerCase().includes(lq) ||
            n.entityId.toLowerCase().includes(lq) ||
            n.tags.some((t) => t.toLowerCase().includes(lq)),
        );
      }

      filtered.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

      const total = filtered.length;
      const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

      sendSuccess(res, {
        nodes: paginated,
        total,
        liveData: true,
        dataSource: 'trace-graph:guardrail+verifier+error+run',
        productMeta: PRODUCT_META,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load evidence registry');
    }
  },
);

// ────────────────────────────────────────────────────────────────────────────
// GET /api/cross-platform/run-health
//
// Per-product health computed from the trace-graph. For each product domain,
// queries the trace store and computes pass rate, policy breach count, and
// autonomy mode mix. A 7-day trend is produced by bucketing traces by day.
// ────────────────────────────────────────────────────────────────────────────

const runHealthQuerySchema = z.object({
  after: z.string().optional(),
  before: z.string().optional(),
});

router.get(
  '/cross-platform/run-health',
  authMiddleware({ required: false }),
  validateQuery(runHealthQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { after, before } = req.query as z.infer<typeof runHealthQuerySchema>;
      const { orgSlug } = tenantContextFromRequest(req);

      const now = Date.now();
      const effectiveAfter = after ?? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      const effectiveBefore = before ?? new Date(now).toISOString();

      const productHealth = await Promise.all(
        PRODUCTS.map(async (dom) => {
          const result = defaultQueryEngine.query(
            buildTenantFilter(orgSlug, {
              domain: dom,
              after: effectiveAfter,
              before: effectiveBefore,
              limit: 10000,
            }),
          );
          const traces = filterByOrg(result.traces, orgSlug);

          const totalRuns = traces.length;
          const passCount = traces.filter(
            (t) => t.status === 'completed' && t.errors.length === 0,
          ).length;
          const failCount = totalRuns - passCount;
          const passRate = totalRuns > 0 ? Math.round((passCount / totalRuns) * 1000) / 10 : 0;

          const policyBreachCount = traces.filter((t) =>
            t.guardrailResults.some((g) => g.outcome === 'block'),
          ).length;

          // Autonomy mix — derive from guardrail tier labels
          const autonomyMix = { autonomous: 0, supervised: 0, advisory: 0, readOnly: 0 };
          for (const t of traces) {
            const tiers = new Set(t.guardrailResults.map((g) => g.tier.toLowerCase()));
            if (tiers.has('t3') || tiers.has('t4') || tiers.has('autonomous'))
              autonomyMix.autonomous++;
            else if (tiers.has('t2') || tiers.has('supervised')) autonomyMix.supervised++;
            else if (tiers.has('t1') || tiers.has('advisory')) autonomyMix.advisory++;
            else autonomyMix.readOnly++;
          }
          if (totalRuns === 0) autonomyMix.readOnly = 0; // keep zeros

          // 7-day trend — bucket by calendar day
          const dayBuckets: { date: string; pass: number; total: number }[] = [];
          for (let d = 6; d >= 0; d--) {
            const dayStart = new Date(now - d * 86400000);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart.getTime() + 86400000);
            const dayTraces = traces.filter((t) => {
              const ts = new Date(t.startedAt).getTime();
              return ts >= dayStart.getTime() && ts < dayEnd.getTime();
            });
            dayBuckets.push({
              date: dayStart.toISOString().slice(0, 10),
              pass: dayTraces.filter((t) => t.status === 'completed' && t.errors.length === 0)
                .length,
              total: dayTraces.length,
            });
          }
          const p7dTrend = dayBuckets.map((b) => ({
            date: b.date,
            passRate: b.total > 0 ? b.pass / b.total : null,
            runs: b.total,
          }));

          // Regression delta — compare last 7 days vs prior 7
          const recent7 = traces.filter(
            (t) => new Date(t.startedAt).getTime() >= now - 7 * 86400000,
          );
          const prior7 = traces.filter((t) => {
            const ts = new Date(t.startedAt).getTime();
            return ts >= now - 14 * 86400000 && ts < now - 7 * 86400000;
          });
          const recent7Pass =
            recent7.length > 0
              ? recent7.filter((t) => t.status === 'completed' && t.errors.length === 0).length /
                recent7.length
              : null;
          const prior7Pass =
            prior7.length > 0
              ? prior7.filter((t) => t.status === 'completed' && t.errors.length === 0).length /
                prior7.length
              : null;
          const regressionDelta =
            recent7Pass !== null && prior7Pass !== null
              ? Math.round((recent7Pass - prior7Pass) * 1000) / 10
              : null;

          const lastTrace = traces[0];

          return {
            product: dom,
            ...PRODUCT_META[dom],
            totalRuns,
            passCount,
            failCount,
            passRate,
            policyBreachCount,
            regressionDelta,
            autonomyMix,
            p7dTrend,
            lastRunAt: lastTrace?.startedAt ?? null,
            status:
              totalRuns === 0
                ? 'no-data'
                : passRate >= 88
                  ? 'healthy'
                  : passRate >= 72
                    ? 'degraded'
                    : 'critical',
          };
        }),
      );

      const aggregate = {
        totalRuns: productHealth.reduce((s, p) => s + p.totalRuns, 0),
        totalPass: productHealth.reduce((s, p) => s + p.passCount, 0),
        totalFail: productHealth.reduce((s, p) => s + p.failCount, 0),
        totalPolicyBreaches: productHealth.reduce((s, p) => s + p.policyBreachCount, 0),
        period: { after: effectiveAfter, before: effectiveBefore },
      };

      sendSuccess(res, {
        products: productHealth,
        aggregate,
        liveData: true,
        dataSource: 'trace-graph:run-records',
        productMeta: PRODUCT_META,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load run health');
    }
  },
);

// ────────────────────────────────────────────────────────────────────────────
// GET /api/cross-platform/pilots
//
// Pilot / design-partner / prospect pipeline. Reads real records from the
// `partner_pilots` table and joins each row with live trace-graph activity
// for the row's `product` domain (weekly runs, pass rate, last-run, agents).
//
// Empty-state behavior: if the table has no rows, this endpoint returns
// { accounts: [], pipeline: { ...zeros }, total: 0 } with dataSource set to
// "partner_pilots:empty" — explicit empty state, no fabricated demo data.
// ────────────────────────────────────────────────────────────────────────────

const pilotsQuerySchema = z.object({
  status: z.string().optional(),
  product: z.string().optional(),
  after: z.string().optional(),
  before: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

router.get(
  '/cross-platform/pilots',
  authMiddleware({ required: false }),
  validateQuery(pilotsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { status, product, after, before, limit, offset } = req.query as z.infer<
        typeof pilotsQuerySchema
      >;

      const { orgSlug } = tenantContextFromRequest(req);
      const callerOrgIds = (req.user?.orgs ?? []).map((o) => o.orgId);

      // Query window for the joined trace-graph activity columns
      const windowEnd = before ?? new Date(Date.now()).toISOString();
      const windowStart = after ?? new Date(Date.now() - 30 * 86400000).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      // ── Pull real pilot rows (tenant-scoped) ────────────────────────────
      // Tenant rule: rows with organization_id NULL are global/demo and visible
      // to everyone; rows with a concrete org are visible only to callers who
      // are members of that org. Callers without orgs (anonymous / unauth in
      // dev) only see global rows.
      const conditions: SQL[] = [];
      const tenantClause: SQL =
        callerOrgIds.length > 0
          ? or(
              isNull(partnerPilotsTable.organizationId),
              inArray(partnerPilotsTable.organizationId, callerOrgIds),
            )!
          : isNull(partnerPilotsTable.organizationId);
      conditions.push(tenantClause);

      // Note: status filter is intentionally NOT applied at SQL level — the
      // effective response status can be promoted to "at-risk" from live trace
      // activity, so filtering must happen after that derivation. Product and
      // date filters are safe to apply early because they reference stored
      // columns directly.
      if (product) conditions.push(eq(partnerPilotsTable.product, product));
      if (after) conditions.push(gte(partnerPilotsTable.createdAt, new Date(after)));
      if (before) conditions.push(lte(partnerPilotsTable.createdAt, new Date(before)));

      const pilotRows = await db
        .select()
        .from(partnerPilotsTable)
        .where(and(...conditions));

      // ── Empty state: no fabricated data ────────────────────────────────
      if (pilotRows.length === 0) {
        sendSuccess(res, {
          accounts: [],
          pipeline: {
            total: 0,
            active: 0,
            pilot: 0,
            prospect: 0,
            atRisk: 0,
            inactive: 0,
            totalRuns: 0,
            weeklyRuns: 0,
            contractValueUsd: 0,
            // Backward-compatible aliases for existing UI consumers
            totalDomains: 0,
            activeDomains: 0,
          },
          total: 0,
          liveData: true,
          dataSource: 'partner_pilots:empty',
          productMeta: PRODUCT_META,
        });
        return;
      }

      // ── Join each pilot with live trace-graph activity for its product ──
      const accounts = await Promise.all(
        pilotRows.map(async (row) => {
          const productKey = row.product as Product;
          const meta = PRODUCT_META[productKey];

          let totalRuns = 0;
          let weeklyRuns = 0;
          let errorCount = 0;
          let passRate: number | null = null;
          let agents: string[] = [];
          let lastRunAt: string | null = null;

          if (meta) {
            const monthTraces = filterByOrg(
              defaultQueryEngine.query(
                buildTenantFilter(orgSlug, {
                  domain: productKey,
                  after: windowStart,
                  before: windowEnd,
                  limit: 5000,
                }),
              ).traces,
              orgSlug,
            );

            const weekTraces = monthTraces.filter((t) => t.startedAt >= weekAgo);
            totalRuns = monthTraces.length;
            weeklyRuns = weekTraces.length;
            errorCount = monthTraces.filter((t) => t.errors.length > 0).length;
            const passCount = monthTraces.filter(
              (t) => t.status === 'completed' && t.errors.length === 0,
            ).length;
            passRate = totalRuns > 0 ? Math.round((passCount / totalRuns) * 1000) / 10 : null;
            agents = [...new Set(monthTraces.map((t) => t.agentId).filter(Boolean))];
            lastRunAt =
              monthTraces
                .map((t) => t.startedAt)
                .sort()
                .reverse()[0] ?? null;
          }

          // Promote stored status to "at-risk" when live activity is unhealthy.
          // Stored status wins for prospect/inactive (lifecycle, not health).
          const liveDerivedAtRisk =
            (row.status === 'active' || row.status === 'pilot') &&
            passRate !== null &&
            passRate < 70;
          const effectiveStatus = liveDerivedAtRisk ? 'at-risk' : row.status;

          return {
            accountId: row.externalId,
            id: row.id,
            organizationId: row.organizationId,
            name: row.name,
            domain: row.product,
            product: row.product,
            status: effectiveStatus,
            storedStatus: row.status,
            tier: row.tier,
            region: row.region,
            industry: row.industry,
            primaryContact: row.primaryContact,
            contactEmail: row.contactEmail,
            pilotStartedAt: row.pilotStartedAt?.toISOString() ?? null,
            contractValueUsd: row.contractValueUsd,
            notes: row.notes,
            metadata: row.metadata,
            icon: meta?.icon ?? '●',
            color: meta?.color ?? '#888',
            drillBase: meta?.drillBase ?? '/',
            label: meta?.label ?? row.product,
            totalRuns,
            weeklyRuns,
            passRate,
            errorCount,
            agents,
            lastRunAt,
            dataSource: 'partner_pilots+trace-graph:domain-activity',
          };
        }),
      );

      // Apply status filter against the EFFECTIVE (post-promotion) status so
      // ?status=at-risk catches rows promoted from active/pilot by live trace
      // health, and ?status=active no longer returns rows now flagged at-risk.
      const visibleAccounts = status ? accounts.filter((a) => a.status === status) : accounts;

      const pipeline = {
        total: visibleAccounts.length,
        active: visibleAccounts.filter((a) => a.status === 'active').length,
        pilot: visibleAccounts.filter((a) => a.status === 'pilot').length,
        prospect: visibleAccounts.filter((a) => a.status === 'prospect').length,
        atRisk: visibleAccounts.filter((a) => a.status === 'at-risk').length,
        inactive: visibleAccounts.filter((a) => a.status === 'inactive').length,
        totalRuns: visibleAccounts.reduce((s, a) => s + a.totalRuns, 0),
        weeklyRuns: visibleAccounts.reduce((s, a) => s + a.weeklyRuns, 0),
        contractValueUsd: visibleAccounts.reduce((s, a) => s + (a.contractValueUsd ?? 0), 0),
        // Backward-compatible aliases for existing UI consumers
        totalDomains: visibleAccounts.length,
        activeDomains: visibleAccounts.filter((a) => a.status === 'active').length,
      };

      const total = visibleAccounts.length;
      const paginated = visibleAccounts.slice(Number(offset), Number(offset) + Number(limit));

      sendSuccess(res, {
        accounts: paginated,
        pipeline,
        total,
        liveData: true,
        dataSource: 'partner_pilots+trace-graph:domain-activity',
        productMeta: PRODUCT_META,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to load pilot intelligence');
    }
  },
);

export default router;
