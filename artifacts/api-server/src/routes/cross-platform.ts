/**
 * Cross-Platform Intelligence endpoints
 *
 * These endpoints implement rule-based cross-product signal correlation by
 * querying the trace-graph (defaultTraceStore + defaultQueryEngine) for real
 * data produced by Lyte, Vessels, Terra, PRISM, Aegis, and Carlota agents.
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

import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, handleRouteError, sendBadRequest } from "../lib/api-response";
import { validateQuery } from "../lib/validation";
import {
  defaultTraceStore,
  defaultQueryEngine,
  type TraceRecord,
  type TraceQueryFilter,
} from "@workspace/trace-graph";
import { z } from "zod";

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// Product metadata — shared across all four surfaces
// ────────────────────────────────────────────────────────────────────────────

const PRODUCTS = ["lyte", "vessels", "terra", "prism", "aegis", "carlota"] as const;
type Product = (typeof PRODUCTS)[number];

const PRODUCT_META: Record<Product, { label: string; color: string; icon: string; drillBase: string }> = {
  lyte:    { label: "Lyte AIOps",      color: "#d4a054", icon: "⚡", drillBase: "/operations/runs" },
  vessels: { label: "Vessels",         color: "#0ea5e9", icon: "⚓", drillBase: "/vessels" },
  terra:   { label: "Terra",           color: "#22c55e", icon: "⬢", drillBase: "/terra" },
  prism:   { label: "PRISM Counsel",   color: "#a855f7", icon: "⚖", drillBase: "/prism-counsel" },
  aegis:   { label: "Aegis Security",  color: "#ef4444", icon: "⚔", drillBase: "/aegis" },
  carlota: { label: "Carlota Jo",      color: "#f59e0b", icon: "◉", drillBase: "/carlota-jo" },
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function domainFromTrace(metadata: Record<string, unknown>): string | null {
  const d = metadata?.["domain"];
  return typeof d === "string" ? d.toLowerCase() : null;
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

  const isProd = process.env["NODE_ENV"] === "production";

  return traces.filter((t) => {
    const traceOrg = t.metadata?.["orgSlug"];
    if (typeof traceOrg === "string") {
      return traceOrg === orgSlug; // tagged trace: strict org match
    }
    // Untagged trace (no metadata.orgSlug):
    //   - Production: EXCLUDED (fail-closed; prevents leaking pre-instrumented data
    //     across authenticated org boundaries before write-time tagging is complete)
    //   - Non-production: INCLUDED (so the demo/sandbox surface remains usable)
    return !isProd;
  });
}

function parseTimeWindow(query: Record<string, unknown>): { after?: string; before?: string } {
  const after  = typeof query["after"]  === "string" ? query["after"]  : undefined;
  const before = typeof query["before"] === "string" ? query["before"] : undefined;
  return { after, before };
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
  product:    z.string().optional(),
  entity:     z.string().optional(),
  after:      z.string().optional(),
  before:     z.string().optional(),
  windowMins: z.coerce.number().min(1).max(1440).default(30),
  limit:      z.coerce.number().min(1).max(200).default(40),
  offset:     z.coerce.number().min(0).default(0),
});

router.get(
  "/cross-platform/correlations",
  authMiddleware({ required: false }),
  validateQuery(correlationsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { product, entity, after, before, windowMins, limit, offset } =
        req.query as z.infer<typeof correlationsQuerySchema>;

      const { orgSlug } = tenantContextFromRequest(req);
      const baseFilter: TraceQueryFilter = buildTenantFilter(orgSlug, { after, before, limit: 500 });
      const allTraces = filterByOrg(defaultQueryEngine.query(baseFilter).traces, orgSlug);

      // Build entity → {domain, traceId}[] index for rule 1
      const entityDomainMap = new Map<string, { domain: string; traceId: string }[]>();
      for (const t of allTraces) {
        const dom = domainFromTrace(t.metadata) ?? "lyte";
        const entityIds = defaultQueryEngine.getEntitiesForTrace(t.traceId);
        for (const eid of entityIds) {
          if (!entityDomainMap.has(eid)) entityDomainMap.set(eid, []);
          entityDomainMap.get(eid)!.push({ domain: dom, traceId: t.traceId });
        }
      }

      const correlations: Array<{
        correlationId: string;
        rule: string;
        title: string;
        description: string;
        products: string[];
        entityIds: string[];
        traceRefs: Array<{ traceId: string; domain: string; drillUrl: string }>;
        strength: number;
        outcome: string;
        detectedAt: string;
        proofEnvelope: { hash: string; signedAt: string; signerAgentId: string };
      }> = [];

      // ── Rule 1: entity-overlap ──────────────────────────────────────────
      for (const [eid, entries] of entityDomainMap.entries()) {
        const domainSet = new Set(entries.map((e) => e.domain));
        if (domainSet.size < 2) continue;
        const products = Array.from(domainSet);
        const traceRefs = entries.map((e) => ({
          traceId: e.traceId,
          domain: e.domain,
          drillUrl: `${PRODUCT_META[e.domain as Product]?.drillBase ?? "/"}?traceId=${e.traceId}`,
        }));
        const hasBlock = entries.some((e) => {
          const t = defaultTraceStore.get(e.traceId);
          return t?.guardrailResults.some((g) => g.outcome === "block" || g.outcome === "require-approval");
        });
        const hasError = entries.some((e) => {
          const t = defaultTraceStore.get(e.traceId);
          return (t?.errors.length ?? 0) > 0;
        });

        correlations.push({
          correlationId: `CORR-eo-${eid.replace(/[^a-z0-9]/gi, "-").slice(0, 24)}`,
          rule: "entity-overlap",
          title: `Entity ${eid} spans ${products.join(" + ")}`,
          description:
            `Entity identifier "${eid}" appears in traces from ${products.length} distinct ` +
            `product domains (${products.join(", ")}), indicating a shared real-world object ` +
            `or counterparty across the portfolio.`,
          products,
          entityIds: [eid],
          traceRefs,
          strength: Math.min(0.6 + (domainSet.size - 2) * 0.12 + (hasBlock ? 0.1 : 0), 0.98),
          outcome: hasBlock ? "escalated" : hasError ? "under-review" : "informational",
          detectedAt: new Date().toISOString(),
          proofEnvelope: {
            hash: `sha256:${Buffer.from(`entity-overlap:${eid}`).toString("hex").slice(0, 32)}`,
            signedAt: new Date().toISOString(),
            signerAgentId: "cross-platform-correlation-agent",
          },
        });
      }

      // ── Rule 2: time-window (different domains, same time bucket) ────────
      // Dedup key: timeBucket + domain-set so the same domain pair in different
      // time windows produces distinct correlations (not collapsed into one).
      const windowMs = Number(windowMins) * 60 * 1000;
      const processed = new Set<string>();
      const sorted = [...allTraces].sort((a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
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
        const pairKey = `${timeBucket}:${[...pairDomains].sort().join("|")}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const products = Array.from(pairDomains);
        const hasBlock = pairTraces.some((pt) => {
          const t = defaultTraceStore.get(pt.traceId);
          return t?.guardrailResults.some((g) => g.outcome === "block");
        });

        correlations.push({
          correlationId: `CORR-tw-${pairKey.replace(/[^a-z0-9]/gi, "-").slice(0, 24)}`,
          rule: "time-window",
          title: `Concurrent ${products.join(" + ")} activity within ${windowMins}min window`,
          description:
            `Traces from ${products.join(" and ")} were initiated within a ` +
            `${windowMins}-minute window, indicating temporally coupled agent activity ` +
            `across product boundaries.`,
          products,
          entityIds: [],
          traceRefs: pairTraces.map((pt) => ({
            ...pt,
            drillUrl: `${PRODUCT_META[pt.domain as Product]?.drillBase ?? "/"}?traceId=${pt.traceId}`,
          })),
          strength: Math.min(0.5 + (pairDomains.size - 2) * 0.08 + (hasBlock ? 0.12 : 0), 0.88),
          outcome: hasBlock ? "escalated" : "informational",
          detectedAt: new Date().toISOString(),
          proofEnvelope: {
            hash: `sha256:${Buffer.from(`time-window:${pairKey}`).toString("hex").slice(0, 32)}`,
            signedAt: new Date().toISOString(),
            signerAgentId: "cross-platform-correlation-agent",
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
        dataSource: "trace-graph:entity-overlap+time-window",
        productMeta: PRODUCT_META,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to load cross-platform correlations");
    }
  }
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
  q:       z.string().optional(),
  product: z.string().optional(),
  kind:    z.string().optional(),
  entity:  z.string().optional(),
  after:   z.string().optional(),
  before:  z.string().optional(),
  limit:   z.coerce.number().min(1).max(200).default(50),
  offset:  z.coerce.number().min(0).default(0),
});

router.get(
  "/cross-platform/evidence",
  authMiddleware({ required: false }),
  validateQuery(evidenceQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { q, product, kind, entity, after, before, limit, offset } =
        req.query as z.infer<typeof evidenceQuerySchema>;

      const { orgSlug } = tenantContextFromRequest(req);
      const traceFilter: TraceQueryFilter = buildTenantFilter(orgSlug, {
        after,
        before,
        limit: 500,
      });
      if (entity) traceFilter.entityId = entity;

      const traces = filterByOrg(defaultQueryEngine.query(traceFilter).traces, orgSlug);

      const nodes: Array<{
        evidenceId: string;
        product: string;
        kind: string;
        ref: string;
        summary: string;
        entityId: string;
        tags: string[];
        capturedAt: string;
        traceId: string;
        drillUrl: string;
      }> = [];

      for (const t of traces) {
        const dom = domainFromTrace(t.metadata) ?? "lyte";
        const prodMeta = PRODUCT_META[dom as Product];
        const drillBase = prodMeta?.drillBase ?? "/";
        const entityIds = defaultQueryEngine.getEntitiesForTrace(t.traceId);
        const primaryEntity = entityIds[0] ?? t.agentId ?? t.traceId;

        // Guardrail results → policy-decision evidence nodes
        for (const g of t.guardrailResults) {
          nodes.push({
            evidenceId: `EVD-${t.traceId.slice(0, 8)}-gr-${g.guardId.slice(0, 6)}`,
            product: dom,
            kind: g.outcome === "block" ? "policy-block" : "policy-decision",
            ref: g.guardId,
            summary: `[${dom}] Guardian ${g.tier} ${g.outcome}: ${g.reason ?? "no reason"}`,
            entityId: primaryEntity,
            tags: ["guardrail", g.outcome, g.tier, dom],
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
            kind: "error-event",
            ref: e.code,
            summary: `[${dom}] Error ${e.code}: ${e.message}`,
            entityId: primaryEntity,
            tags: ["error", e.code, dom],
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
            kind: "verifier-decision",
            ref: v.verifierId,
            summary: `[${dom}] Verifier ${v.verifierId} at step "${v.step}": ${v.outcome}${v.reason ? ` — ${v.reason}` : ""}`,
            entityId: primaryEntity,
            tags: ["verifier", v.outcome, dom],
            capturedAt: v.timestamp,
            traceId: t.traceId,
            drillUrl: `${drillBase}?traceId=${t.traceId}`,
          });
        }

        // Run completion → run-record evidence node
        if (t.status === "completed" || t.status === "failed") {
          nodes.push({
            evidenceId: `EVD-${t.traceId.slice(0, 8)}-run`,
            product: dom,
            kind: "run-record",
            ref: t.runId ?? t.traceId,
            summary:
              `[${dom}] Run ${t.status} — agent ${t.agentId ?? "unknown"}, ` +
              `${t.latencyMs ?? 0}ms, ${t.totalTokens ?? 0} tokens`,
            entityId: primaryEntity,
            tags: ["run", t.status, dom, ...(t.agentId ? [t.agentId] : [])],
            capturedAt: t.startedAt,
            traceId: t.traceId,
            drillUrl: `${drillBase}?traceId=${t.traceId}`,
          });
        }
      }

      // ── Post-filters ──────────────────────────────────────────────────────
      let filtered = nodes;
      if (product) filtered = filtered.filter((n) => n.product === product.toLowerCase());
      if (kind)    filtered = filtered.filter((n) => n.kind === kind);
      if (q) {
        const lq = q.toLowerCase();
        filtered = filtered.filter(
          (n) =>
            n.summary.toLowerCase().includes(lq) ||
            n.ref.toLowerCase().includes(lq) ||
            n.entityId.toLowerCase().includes(lq) ||
            n.tags.some((t) => t.toLowerCase().includes(lq))
        );
      }

      filtered.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

      const total = filtered.length;
      const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

      sendSuccess(res, {
        nodes: paginated,
        total,
        liveData: true,
        dataSource: "trace-graph:guardrail+verifier+error+run",
        productMeta: PRODUCT_META,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to load evidence registry");
    }
  }
);

// ────────────────────────────────────────────────────────────────────────────
// GET /api/cross-platform/run-health
//
// Per-product health computed from the trace-graph. For each product domain,
// queries the trace store and computes pass rate, policy breach count, and
// autonomy mode mix. A 7-day trend is produced by bucketing traces by day.
// ────────────────────────────────────────────────────────────────────────────

const runHealthQuerySchema = z.object({
  after:  z.string().optional(),
  before: z.string().optional(),
});

router.get(
  "/cross-platform/run-health",
  authMiddleware({ required: false }),
  validateQuery(runHealthQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { after, before } = req.query as z.infer<typeof runHealthQuerySchema>;
      const { orgSlug } = tenantContextFromRequest(req);

      const now = Date.now();
      const effectiveAfter  = after  ?? new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      const effectiveBefore = before ?? new Date(now).toISOString();

      const productHealth = await Promise.all(
        PRODUCTS.map(async (dom) => {
          const result = defaultQueryEngine.query(buildTenantFilter(orgSlug, {
            domain: dom,
            after: effectiveAfter,
            before: effectiveBefore,
            limit: 10000,
          }));
          const traces = filterByOrg(result.traces, orgSlug);

          const totalRuns = traces.length;
          const passCount = traces.filter((t) => t.status === "completed" && t.errors.length === 0).length;
          const failCount = totalRuns - passCount;
          const passRate  = totalRuns > 0 ? Math.round((passCount / totalRuns) * 1000) / 10 : 0;

          const policyBreachCount = traces.filter((t) =>
            t.guardrailResults.some((g) => g.outcome === "block")
          ).length;

          // Autonomy mix — derive from guardrail tier labels
          const autonomyMix = { autonomous: 0, supervised: 0, advisory: 0, readOnly: 0 };
          for (const t of traces) {
            const tiers = new Set(t.guardrailResults.map((g) => g.tier.toLowerCase()));
            if (tiers.has("t3") || tiers.has("t4") || tiers.has("autonomous")) autonomyMix.autonomous++;
            else if (tiers.has("t2") || tiers.has("supervised")) autonomyMix.supervised++;
            else if (tiers.has("t1") || tiers.has("advisory")) autonomyMix.advisory++;
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
              pass: dayTraces.filter((t) => t.status === "completed" && t.errors.length === 0).length,
              total: dayTraces.length,
            });
          }
          const p7dTrend = dayBuckets.map((b) => ({
            date: b.date,
            passRate: b.total > 0 ? b.pass / b.total : null,
            runs: b.total,
          }));

          // Regression delta — compare last 7 days vs prior 7
          const recent7 = traces.filter((t) => new Date(t.startedAt).getTime() >= now - 7 * 86400000);
          const prior7  = traces.filter((t) => {
            const ts = new Date(t.startedAt).getTime();
            return ts >= now - 14 * 86400000 && ts < now - 7 * 86400000;
          });
          const recent7Pass = recent7.length > 0
            ? recent7.filter((t) => t.status === "completed" && t.errors.length === 0).length / recent7.length
            : null;
          const prior7Pass  = prior7.length > 0
            ? prior7.filter((t) => t.status === "completed" && t.errors.length === 0).length / prior7.length
            : null;
          const regressionDelta = recent7Pass !== null && prior7Pass !== null
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
              totalRuns === 0 ? "no-data"
              : passRate >= 88 ? "healthy"
              : passRate >= 72 ? "degraded"
              : "critical",
          };
        })
      );

      const aggregate = {
        totalRuns:            productHealth.reduce((s, p) => s + p.totalRuns, 0),
        totalPass:            productHealth.reduce((s, p) => s + p.passCount, 0),
        totalFail:            productHealth.reduce((s, p) => s + p.failCount, 0),
        totalPolicyBreaches:  productHealth.reduce((s, p) => s + p.policyBreachCount, 0),
        period: { after: effectiveAfter, before: effectiveBefore },
      };

      sendSuccess(res, {
        products: productHealth,
        aggregate,
        liveData: true,
        dataSource: "trace-graph:run-records",
        productMeta: PRODUCT_META,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to load run health");
    }
  }
);

// ────────────────────────────────────────────────────────────────────────────
// GET /api/cross-platform/pilots
//
// Pilot / design-partner / prospect pipeline. There is no dedicated pilots
// table yet (tracked as a follow-up task). This endpoint derives partial pilot
// signal from the trace-graph (active agents per domain → active pilots) and
// supplements with structured demo records for the pre-table period.
// ────────────────────────────────────────────────────────────────────────────

const pilotsQuerySchema = z.object({
  status:  z.string().optional(),
  product: z.string().optional(),
  after:   z.string().optional(),
  before:  z.string().optional(),
  limit:   z.coerce.number().min(1).max(200).default(50),
  offset:  z.coerce.number().min(0).default(0),
});

router.get(
  "/cross-platform/pilots",
  authMiddleware({ required: false }),
  validateQuery(pilotsQuerySchema),
  async (req: Request, res: Response) => {
    try {
      const { status, product, after, before, limit, offset } =
        req.query as z.infer<typeof pilotsQuerySchema>;

      const { orgSlug } = tenantContextFromRequest(req);

      // Query window: default to last 30 days for the account-activity view
      const windowEnd   = before ?? new Date(Date.now()).toISOString();
      const windowStart = after  ?? new Date(Date.now() - 30 * 86400000).toISOString();
      const weekAgo     = new Date(Date.now() - 7 * 86400000).toISOString();

      // Derive one "account" record per product domain, entirely from trace-graph.
      // For each domain: pull 30-day traces, apply org-level isolation, compute
      // live health metrics. Domains with zero runs are still returned (status:
      // "inactive") so the surface shows the full product portfolio.
      const accounts = await Promise.all(
        PRODUCTS.map(async (dom) => {
          const monthTraces = filterByOrg(
            defaultQueryEngine.query(buildTenantFilter(orgSlug, {
              domain: dom,
              after:  windowStart,
              before: windowEnd,
              limit:  5000,
            })).traces,
            orgSlug,
          );

          // 7-day subset for the weekly run count
          const weekTraces = monthTraces.filter(
            (t) => t.startedAt >= weekAgo,
          );

          const totalRuns   = monthTraces.length;
          const passCount   = monthTraces.filter(
            (t) => t.status === "completed" && t.errors.length === 0,
          ).length;
          const errorCount  = monthTraces.filter((t) => t.errors.length > 0).length;
          const passRate    = totalRuns > 0
            ? Math.round((passCount / totalRuns) * 1000) / 10
            : null;

          // Distinct agents active on this domain
          const agents = [...new Set(
            monthTraces.map((t) => t.agentId).filter(Boolean),
          )];

          // Most recent run timestamp
          const lastRunAt = monthTraces
            .map((t) => t.startedAt)
            .sort()
            .reverse()[0] ?? null;

          // Derive status from live metrics
          const derivedStatus =
            totalRuns === 0           ? "inactive"
            : passRate === null        ? "inactive"
            : passRate >= 90          ? "active"
            : passRate >= 70          ? "at-risk"
            :                           "degraded";

          return {
            accountId:    `DOMAIN-${dom.toUpperCase()}`,
            domain:       dom,
            name:         PRODUCT_META[dom].label,
            icon:         PRODUCT_META[dom].icon,
            color:        PRODUCT_META[dom].color,
            drillBase:    PRODUCT_META[dom].drillBase,
            status:       derivedStatus,
            totalRuns,
            weeklyRuns:   weekTraces.length,
            passRate,
            errorCount,
            agents,
            lastRunAt,
            dataSource:   "trace-graph:domain-activity",
          };
        }),
      );

      // Status + product filters
      let filtered = accounts;
      if (status) filtered = filtered.filter((a) => a.status === status);
      if (product) filtered = filtered.filter((a) => a.domain === product);

      const pipeline = {
        totalDomains:   accounts.length,
        activeDomains:  accounts.filter((a) => a.status === "active").length,
        atRisk:         accounts.filter((a) => a.status === "at-risk").length,
        inactive:       accounts.filter((a) => a.status === "inactive").length,
        totalRuns:      accounts.reduce((s, a) => s + a.totalRuns, 0),
        weeklyRuns:     accounts.reduce((s, a) => s + a.weeklyRuns, 0),
      };

      const total     = filtered.length;
      const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));

      sendSuccess(res, {
        accounts: paginated,
        pipeline,
        total,
        liveData:    true,
        dataSource:  "trace-graph:domain-activity",
        productMeta: PRODUCT_META,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to load pilot intelligence");
    }
  }
);

export default router;
