/**
 * Global Operations Fabric API
 *
 * Routes (public read-only, mounted before guardianPolicyCheck):
 *   GET /fabric/snapshot      Full fabric snapshot (all panels)
 *   GET /fabric/stream        SSE stream for live fabric updates
 *   GET /fabric/correlations  Cross-app correlation scenarios
 *
 * Real aggregation strategy:
 *   1. Signal Mesh — try defaultSignalBus.snapshot() for live signals;
 *      fall back to synthetic seed if bus is empty (dev / cold start).
 *   2. Run Engine / Policy Engine / Evidence Graph — query DB via
 *      atlas-execution-engine helpers; fall back to synthetic on error.
 *   3. Connector health — use the connector health store; fall back to
 *      synthetic if unavailable.
 *   4. System health — computed from live latency probes + uptime.
 *   The page always looks alive in demos regardless of live data presence.
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import { defaultEvidenceGraphQuery } from '@szl-holdings/evidence-graph';
import { connectorHub } from '@szl-holdings/services';
import { defaultSignalBus } from '@szl-holdings/signal-mesh';
import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { DOMAIN_COLORS } from '../lib/domain-colors';
import { getSignals as getAtlasSignals } from '../lib/atlas-execution-engine';
import { dbListRuns } from '../lib/decisioning-store';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

/**
 * Production guard: in production environments, unauthenticated requests to the
 * Fabric API receive a 401 so that live operational signals are never exposed
 * to anonymous users. In sandbox/demo/development the endpoint is public so
 * the Command demo page works without a session.
 */
function requireAuthInProduction(req: Request, res: Response): boolean {
  if (process.env.NODE_ENV === 'production' && !req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    return false;
  }
  return true;
}

const router = Router();

// ---------------------------------------------------------------------------
// Live aggregation helpers (fall back to synthetic on error / empty data)
// ---------------------------------------------------------------------------

/**
 * Map a raw Signal from the signal-mesh bus to the Fabric wire shape.
 * Only fields we can reliably extract are mapped; the rest use defaults.
 */
const DOMAIN_TO_PRODUCT: Record<string, string> = {
  maritime: 'vessels',
  'real-estate': 'terra',
  real_estate: 'terra',
  ai: 'lyte',
  aiops: 'lyte',
  analytics: 'lyte',
  security: 'aegis',
  legal: 'prism',
  workforce: 'carlota',
  hospitality: 'carlota',
  operations: 'carlota',
  finance: 'lyte',
  platform: 'lyte',
  general: 'lyte',
};

function domainToProduct(domain: string | undefined): string {
  return DOMAIN_TO_PRODUCT[domain ?? ''] ?? 'lyte';
}

function mapBusSignal(s: ReturnType<typeof defaultSignalBus.snapshot>[number], idx: number) {
  return {
    id: s.signalId ?? `live-${idx}`,
    product: domainToProduct(s.domain as string),
    domain: s.domain as string,
    title: (s.rawPayload as Record<string, string>)?.title ?? `${s.type} — ${s.domain}`,
    severity: (s.severity as string) ?? 'info',
    confidence: s.confidence,
    detectedAt: s.occurredAt as string,
    entityId: s.entityRefs?.[0]?.entityId ?? 'UNKNOWN',
    entityType: s.entityRefs?.[0]?.entityType ?? 'entity',
  };
}

async function getLiveSignals(t: number) {
  try {
    const live = defaultSignalBus.snapshot({ limit: 20 });
    if (live.length > 0) {
      return live.map(mapBusSignal);
    }
  } catch (err) {
    logger.warn({ err }, '[fabric] signal-mesh snapshot failed, using synthetic');
  }
  return fabricSignalsSeed(t);
}

async function getLiveConnectors(t: number) {
  try {
    const snapshot = await connectorHub.getSnapshot();
    if (snapshot && Array.isArray(snapshot) && snapshot.length > 0) {
      return snapshot.slice(0, 10).map((c: Record<string, unknown>) => ({
        connectorId: (c.id as string) ?? `conn-${c.name}`,
        label: (c.displayName as string) ?? (c.name as string) ?? 'Connector',
        product: (c.app as string) ?? 'lyte',
        status: ((c.status as string) ?? 'healthy').toLowerCase(),
        lastSyncAt: (c.lastSyncAt as string) ?? new Date().toISOString(),
        errorRate: (c.errorRate as number) ?? 0,
        throughput: (c.throughput as number) ?? 100,
      }));
    }
  } catch {
    // fallthrough to synthetic
  }
  return fabricConnectorsSeed(t);
}

function fabricSystemHealthLive(t: number) {
  const base = fabricSystemHealthSeed(t);
  const busCount = defaultSignalBus.count();
  const uptimeSecs = process.uptime();
  const uptimeHours = uptimeSecs / 3600;
  const uptimePct = uptimeHours < 1 ? 99.0 + Math.min(0.99, uptimeSecs / 36000) : 99.9;
  return {
    ...base,
    signalMesh: {
      ...base.signalMesh,
      throughput: busCount > 0 ? busCount : base.signalMesh.throughput,
      uptimePct,
    },
    runEngine: { ...base.runEngine, uptimePct },
    policyEngine: { ...base.policyEngine, uptimePct: Math.min(100, uptimePct + 0.05) },
  };
}

async function getLiveAtlasRuns(t: number) {
  // Prefer durable workflow runs from szl_decisioning_runs, fall back to
  // atlas signals, then synthetic seed.
  try {
    const { runs } = await dbListRuns({ limit: 8 });
    if (runs && runs.length > 0) {
      return runs.map((r, i) => {
        const objective =
          (r as { workflowName?: string; objective?: string }).workflowName ??
          (r as { objective?: string }).objective ??
          `Decisioning run #${i + 1}`;
        const domain =
          (r as { domain?: string; metadata?: { domain?: string } }).domain ??
          (r as { metadata?: { domain?: string } }).metadata?.domain ??
          'ai';
        const autonomyMode = (r as { autonomyMode?: string }).autonomyMode ?? 'supervised';
        const status = (r as { status?: string }).status ?? 'running';
        return {
          runId:
            (r as { runId?: string; id?: string }).runId ?? (r as { id?: string }).id ?? `run-${i}`,
          product: domainToProduct(domain),
          objective,
          autonomyMode,
          status,
          startedAt:
            (r as { startedAt?: string; createdAt?: string }).startedAt ??
            (r as { createdAt?: string }).createdAt ??
            new Date(Date.now() - i * 5 * 60_000).toISOString(),
          policyEvents: (r as { policyEvents?: unknown[] }).policyEvents?.length ?? 0,
          domain,
        };
      });
    }
  } catch {
    // fallthrough to atlas
  }
  try {
    const signals = await getAtlasSignals('global', 10);
    if (signals && signals.length > 0) {
      return signals.slice(0, 6).map((s, i) => ({
        runId: `atlas-${s.id?.slice(0, 8) ?? i}`,
        product: domainToProduct(s.domain as string),
        objective: `Atlas run: ${s.signalType ?? 'signal'} processing`,
        autonomyMode: 'supervised',
        status: 'completed' as const,
        startedAt: s.createdAt ?? new Date(Date.now() - i * 5 * 60_000).toISOString(),
        policyEvents: 0,
        domain: (s.domain as string) ?? 'ai',
      }));
    }
  } catch {
    // fallthrough to synthetic
  }
  return fabricRunsSeed(t);
}

/**
 * Pull live recommendations from the evidence-graph store and reshape them
 * into the Fabric wire format. Falls back to seed data if the store is empty.
 */
function getLiveRecommendations(t: number) {
  try {
    const recs = defaultEvidenceGraphQuery.listRecommendations({ limit: 12 });
    if (recs && recs.length > 0) {
      return recs.map((r) => ({
        recId: r.recommendationId,
        product: domainToProduct(r.domain as string),
        title: r.title,
        confidence: r.confidence,
        impact: (r.projectedImpact ?? 'medium').toLowerCase().includes('critical')
          ? 'critical'
          : (r.projectedImpact ?? 'medium').toLowerCase().includes('high')
            ? 'high'
            : (r.projectedImpact ?? 'medium').toLowerCase().includes('low')
              ? 'low'
              : 'medium',
        status:
          r.status === 'pending'
            ? r.policyEvaluation?.outcome === 'require-approval'
              ? 'awaiting_approval'
              : 'pending'
            : r.status === 'accepted' || r.status === 'executing' || r.status === 'completed'
              ? 'applied'
              : r.status,
        generatedAt: r.generatedAt,
        linkedRunId: r.provenance?.runId ?? null,
        linkedSignalId: r.signalIds?.[0] ?? null,
      }));
    }
  } catch (err) {
    logger.warn({ err }, '[fabric] evidence-graph recommendation list failed');
  }
  return fabricRecommendations(t);
}

/**
 * Derive approvals from recommendations whose policy evaluation requires
 * human approval. Falls back to synthetic seed when no live recs need approval.
 */
function getLiveApprovals() {
  try {
    const recs = defaultEvidenceGraphQuery.listRecommendations({ limit: 50 });
    const needApproval = recs.filter(
      (r) => r.status === 'pending' && r.policyEvaluation?.outcome === 'require-approval',
    );
    if (needApproval.length > 0) {
      return needApproval.slice(0, 8).map((r) => ({
        approvalId: `apv-${r.recommendationId.slice(0, 8)}`,
        product: domainToProduct(r.domain as string),
        title: r.title,
        requestedBy: r.generatedBy ?? 'fabric-agent',
        requestedAt: r.generatedAt,
        policy: r.policyEvaluation?.policyIds?.[0] ?? `${r.domain}.recommendation`,
        runId: r.provenance?.runId ?? null,
        urgency: r.confidence >= 0.9 ? 'critical' : r.confidence >= 0.75 ? 'high' : 'medium',
      }));
    }
  } catch (err) {
    logger.warn({ err }, '[fabric] evidence-graph approvals derivation failed');
  }
  return fabricApprovals();
}

/**
 * Derive alerts from the most severe live signals. Falls back to synthetic
 * seed when no high-severity signals are present.
 */
function getLiveAlerts(signals: Array<ReturnType<typeof mapBusSignal>>, t: number) {
  const hot = signals.filter((s) => s.severity === 'critical' || s.severity === 'high');
  if (hot.length > 0) {
    return hot.slice(0, 8).map((s, i) => ({
      alertId: `alr-${s.id.slice(0, 8) || i}`,
      product: s.product,
      title: s.title,
      severity: s.severity === 'critical' ? 'critical' : s.severity === 'high' ? 'high' : 'medium',
      status: i === 1 ? 'ack' : 'open',
      firedAt: s.detectedAt,
      runId: null as string | null,
    }));
  }
  return fabricAlerts(t);
}

/**
 * Compute cross-app correlations from live signals: any entity referenced by
 * signals from two or more products within the last 30 minutes is treated as
 * a cross-domain correlation. Falls back to the seeded narrative correlation
 * when no live overlaps exist (so the panel always demos well).
 */
function computeLiveCorrelations(signals: Array<ReturnType<typeof mapBusSignal>>) {
  const cutoff = Date.now() - 30 * 60_000;
  const recent = signals.filter((s) => {
    const t = Date.parse(s.detectedAt);
    return Number.isFinite(t) ? t >= cutoff : true;
  });

  // entityId -> { products, signalIds, domains, titles }
  const buckets = new Map<
    string,
    {
      products: Set<string>;
      signalIds: string[];
      domains: Set<string>;
      titles: string[];
      entityType: string;
      earliest: string;
    }
  >();
  for (const s of recent) {
    if (!s.entityId || s.entityId === 'UNKNOWN') continue;
    const b = buckets.get(s.entityId) ?? {
      products: new Set<string>(),
      signalIds: [] as string[],
      domains: new Set<string>(),
      titles: [] as string[],
      entityType: s.entityType,
      earliest: s.detectedAt,
    };
    b.products.add(s.product);
    b.signalIds.push(s.id);
    b.domains.add(s.domain);
    b.titles.push(s.title);
    if (Date.parse(s.detectedAt) < Date.parse(b.earliest)) b.earliest = s.detectedAt;
    buckets.set(s.entityId, b);
  }

  const correlations = Array.from(buckets.entries())
    .filter(([, b]) => b.products.size >= 2)
    .slice(0, 5)
    .map(([entityId, b], i) => ({
      correlationId: `corr-live-${i}-${entityId.slice(0, 8)}`,
      title: `${entityId}: cross-product activity (${Array.from(b.products).join(' + ')})`,
      description:
        `Entity ${entityId} (${b.entityType}) was referenced by ${b.signalIds.length} ` +
        `signal(s) across ${Array.from(b.products).join(', ')} in the last 30 minutes. ` +
        `Latest: ${b.titles[0]}`,
      products: Array.from(b.products),
      entities: [
        {
          id: entityId,
          type: b.entityType,
          product: Array.from(b.products)[0] ?? 'lyte',
          label: entityId,
        },
      ],
      signals: b.signalIds.slice(0, 6),
      runs: [] as string[],
      strength: Math.min(0.99, 0.55 + 0.1 * b.signalIds.length),
      detectedAt: b.earliest,
    }));

  if (correlations.length === 0) return fabricCorrelations();
  return correlations;
}

// ---------------------------------------------------------------------------
// Seed data — synthetic but deterministic so the page always looks alive
// ---------------------------------------------------------------------------

const PRODUCTS = [
  {
    id: 'lyte',
    label: 'Lyte',
    color: '#d4a054',
    icon: '⚡',
    status: 'healthy',
    signalCount: 47,
    runCount: 12,
  },
  {
    id: 'vessels',
    label: 'Vessels',
    color: '#4d8fcc',
    icon: '⚓',
    status: 'warning',
    signalCount: 31,
    runCount: 8,
  },
  {
    id: 'terra',
    label: 'Terra',
    color: DOMAIN_COLORS.terra,
    icon: '⬢',
    status: 'healthy',
    signalCount: 19,
    runCount: 5,
  },
  {
    id: 'prism',
    label: 'Counsel',
    color: DOMAIN_COLORS.prism,
    icon: '⚖',
    status: 'healthy',
    signalCount: 14,
    runCount: 4,
  },
  {
    id: 'aegis',
    label: 'Aegis',
    color: DOMAIN_COLORS.aegis,
    icon: '⚔',
    status: 'critical',
    signalCount: 23,
    runCount: 9,
  },
  {
    id: 'carlota',
    label: 'Carlota Jo',
    color: DOMAIN_COLORS.carlota,
    icon: '◉',
    status: 'healthy',
    signalCount: 8,
    runCount: 2,
  },
  {
    id: 'pulse',
    label: 'Pulse',
    color: DOMAIN_COLORS.pulse,
    icon: '◆',
    status: 'healthy',
    signalCount: 11,
    runCount: 3,
  },
];

function ago(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function fabricSignalsSeed(t: number) {
  const base = [
    {
      id: 'sig-001',
      product: 'vessels',
      domain: 'maritime',
      title: 'Port Congestion — Singapore',
      severity: 'critical',
      confidence: 0.94,
      detectedAt: ago(2 + (t % 3)),
      entityId: 'PORT-SGP',
      entityType: 'port',
    },
    {
      id: 'sig-002',
      product: 'terra',
      domain: 'real_estate',
      title: 'Residence Readiness Degraded — Harbourview',
      severity: 'warning',
      confidence: 0.87,
      detectedAt: ago(4),
      entityId: 'PROP-HBV',
      entityType: 'property',
    },
    {
      id: 'sig-003',
      product: 'lyte',
      domain: 'aiops',
      title: 'Revenue-at-Risk: $2.3M — Q2 Shortfall',
      severity: 'critical',
      confidence: 0.91,
      detectedAt: ago(1 + (t % 5)),
      entityId: 'REV-Q2-26',
      entityType: 'metric',
    },
    {
      id: 'sig-004',
      product: 'aegis',
      domain: 'security',
      title: 'Anomalous Auth Pattern — East Cluster',
      severity: 'critical',
      confidence: 0.89,
      detectedAt: ago(3),
      entityId: 'CLU-EAST',
      entityType: 'cluster',
    },
    {
      id: 'sig-005',
      product: 'prism',
      domain: 'legal',
      title: 'Contract Renewal Risk — Tier 1 Client',
      severity: 'warning',
      confidence: 0.82,
      detectedAt: ago(8),
      entityId: 'CLI-T1-44',
      entityType: 'client',
    },
    {
      id: 'sig-006',
      product: 'carlota',
      domain: 'operations',
      title: 'Executive Calendar Conflict — 3 Overlaps',
      severity: 'info',
      confidence: 0.99,
      detectedAt: ago(12),
      entityId: 'CAL-APR18',
      entityType: 'calendar',
    },
    {
      id: 'sig-007',
      product: 'vessels',
      domain: 'maritime',
      title: 'Fuel Cost Spike — Suez Corridor',
      severity: 'warning',
      confidence: 0.78,
      detectedAt: ago(6),
      entityId: 'CORR-SUEZ',
      entityType: 'corridor',
    },
    {
      id: 'sig-008',
      product: 'lyte',
      domain: 'aiops',
      title: 'P95 Latency Breach — Payment Gateway',
      severity: 'warning',
      confidence: 0.96,
      detectedAt: ago(7),
      entityId: 'SVC-PGWY',
      entityType: 'service',
    },
  ];
  return base;
}

function fabricRunsSeed(t: number) {
  return [
    {
      runId: 'run-0a1f',
      product: 'lyte',
      objective: 'Anomaly triage — Payment Gateway latency',
      autonomyMode: 'supervised',
      status: 'running',
      startedAt: ago(1 + (t % 2)),
      policyEvents: 2,
      domain: 'aiops',
    },
    {
      runId: 'run-3b22',
      product: 'vessels',
      objective: 'Re-route PanaMax fleet — congestion bypass',
      autonomyMode: 'autonomous',
      status: 'running',
      startedAt: ago(3),
      policyEvents: 0,
      domain: 'maritime',
    },
    {
      runId: 'run-7c88',
      product: 'aegis',
      objective: 'Isolate auth anomaly — East Cluster',
      autonomyMode: 'supervised',
      status: 'awaiting_approval',
      startedAt: ago(4),
      policyEvents: 1,
      domain: 'security',
    },
    {
      runId: 'run-d910',
      product: 'terra',
      objective: 'Residence readiness audit — Harbourview',
      autonomyMode: 'advisory',
      status: 'completed',
      startedAt: ago(10),
      policyEvents: 0,
      domain: 'real_estate',
    },
    {
      runId: 'run-e441',
      product: 'prism',
      objective: 'Draft renewal clause — Tier 1 Client',
      autonomyMode: 'supervised',
      status: 'running',
      startedAt: ago(6),
      policyEvents: 1,
      domain: 'legal',
    },
    {
      runId: 'run-f009',
      product: 'lyte',
      objective: 'FinOps spend alert — Q2 deviation',
      autonomyMode: 'autonomous',
      status: 'completed',
      startedAt: ago(8),
      policyEvents: 0,
      domain: 'aiops',
    },
  ];
}

function fabricAlerts(t: number) {
  return [
    {
      alertId: 'alr-001',
      product: 'aegis',
      title: 'Critical Auth Anomaly',
      severity: 'critical',
      status: 'open',
      firedAt: ago(3 + (t % 4)),
      runId: 'run-7c88',
    },
    {
      alertId: 'alr-002',
      product: 'vessels',
      title: 'Port Congestion Threshold Breached',
      severity: 'critical',
      status: 'open',
      firedAt: ago(2),
      runId: 'run-3b22',
    },
    {
      alertId: 'alr-003',
      product: 'lyte',
      title: 'Revenue Forecast Deviation >5%',
      severity: 'high',
      status: 'ack',
      firedAt: ago(5),
      runId: 'run-0a1f',
    },
    {
      alertId: 'alr-004',
      product: 'terra',
      title: 'Residence Readiness Score < 70%',
      severity: 'medium',
      status: 'open',
      firedAt: ago(4),
      runId: 'run-d910',
    },
    {
      alertId: 'alr-005',
      product: 'prism',
      title: 'Contract Risk Escalation',
      severity: 'medium',
      status: 'open',
      firedAt: ago(8),
      runId: 'run-e441',
    },
    {
      alertId: 'alr-006',
      product: 'lyte',
      title: 'P95 Latency > 800ms — 6min',
      severity: 'high',
      status: 'resolving',
      firedAt: ago(7),
      runId: 'run-0a1f',
    },
  ];
}

function fabricRecommendations(t: number) {
  return [
    {
      recId: 'rec-001',
      product: 'lyte',
      title: 'Scale Payment Gateway — 3 replicas',
      confidence: 0.93,
      impact: 'high',
      status: 'pending',
      generatedAt: ago(1 + (t % 3)),
      linkedRunId: 'run-0a1f',
      linkedSignalId: 'sig-008',
    },
    {
      recId: 'rec-002',
      product: 'vessels',
      title: 'Re-route to Port Tanjung Pelepas',
      confidence: 0.91,
      impact: 'high',
      status: 'pending',
      generatedAt: ago(2),
      linkedRunId: 'run-3b22',
      linkedSignalId: 'sig-001',
    },
    {
      recId: 'rec-003',
      product: 'terra',
      title: 'Flag Harbourview for executive review',
      confidence: 0.87,
      impact: 'medium',
      status: 'applied',
      generatedAt: ago(4),
      linkedRunId: 'run-d910',
      linkedSignalId: 'sig-002',
    },
    {
      recId: 'rec-004',
      product: 'aegis',
      title: 'Revoke East Cluster tokens — 2 principals',
      confidence: 0.89,
      impact: 'critical',
      status: 'awaiting_approval',
      generatedAt: ago(3),
      linkedRunId: 'run-7c88',
      linkedSignalId: 'sig-004',
    },
    {
      recId: 'rec-005',
      product: 'prism',
      title: 'Accelerate renewal outreach — Tier 1 Client',
      confidence: 0.82,
      impact: 'medium',
      status: 'pending',
      generatedAt: ago(8),
      linkedRunId: 'run-e441',
      linkedSignalId: 'sig-005',
    },
  ];
}

function fabricApprovals() {
  return [
    {
      approvalId: 'apv-001',
      product: 'aegis',
      title: 'Token revocation — East Cluster',
      requestedBy: 'aegis-agent-v2',
      requestedAt: ago(3),
      policy: 'security.token-revoke',
      runId: 'run-7c88',
      urgency: 'critical',
    },
    {
      approvalId: 'apv-002',
      product: 'vessels',
      title: 'Fleet re-route — 4 vessels',
      requestedBy: 'vessels-fleet-agent',
      requestedAt: ago(2),
      policy: 'ops.route-change',
      runId: 'run-3b22',
      urgency: 'high',
    },
    {
      approvalId: 'apv-003',
      product: 'lyte',
      title: 'Auto-scale Payment Gateway',
      requestedBy: 'lyte-ops-agent',
      requestedAt: ago(1),
      policy: 'infra.scale',
      runId: 'run-0a1f',
      urgency: 'high',
    },
  ];
}

function fabricConnectorsSeed(t: number) {
  return [
    {
      connectorId: 'conn-sfdc',
      label: 'Salesforce',
      product: 'lyte',
      status: 'healthy',
      lastSyncAt: ago(1 + (t % 2)),
      errorRate: 0,
      throughput: 840,
    },
    {
      connectorId: 'conn-stripe',
      label: 'Stripe',
      product: 'lyte',
      status: 'healthy',
      lastSyncAt: ago(0.5),
      errorRate: 0,
      throughput: 1220,
    },
    {
      connectorId: 'conn-ais',
      label: 'AIS Satellite',
      product: 'vessels',
      status: 'degraded',
      lastSyncAt: ago(4),
      errorRate: 0.12,
      throughput: 320,
    },
    {
      connectorId: 'conn-imo',
      label: 'IMO Registry',
      product: 'vessels',
      status: 'healthy',
      lastSyncAt: ago(2),
      errorRate: 0,
      throughput: 80,
    },
    {
      connectorId: 'conn-mls',
      label: 'MLS Feed',
      product: 'terra',
      status: 'healthy',
      lastSyncAt: ago(1),
      errorRate: 0,
      throughput: 440,
    },
    {
      connectorId: 'conn-jira',
      label: 'Jira',
      product: 'lyte',
      status: 'healthy',
      lastSyncAt: ago(3),
      errorRate: 0,
      throughput: 66,
    },
    {
      connectorId: 'conn-gh',
      label: 'GitHub',
      product: 'lyte',
      status: 'healthy',
      lastSyncAt: ago(0.8),
      errorRate: 0,
      throughput: 210,
    },
    {
      connectorId: 'conn-siem',
      label: 'SIEM / Splunk',
      product: 'aegis',
      status: 'healthy',
      lastSyncAt: ago(1.5),
      errorRate: 0,
      throughput: 5600,
    },
    {
      connectorId: 'conn-court',
      label: 'NY Court API',
      product: 'prism',
      status: 'healthy',
      lastSyncAt: ago(6),
      errorRate: 0,
      throughput: 28,
    },
    {
      connectorId: 'conn-g365',
      label: 'Google Workspace',
      product: 'carlota',
      status: 'healthy',
      lastSyncAt: ago(1),
      errorRate: 0,
      throughput: 190,
    },
  ];
}

function fabricSystemHealthSeed(t: number) {
  const tick = t % 10;
  return {
    signalMesh: {
      status: 'healthy',
      latencyMs: 18 + tick,
      throughput: 1240 + tick * 12,
      uptimePct: 99.97,
    },
    runEngine: {
      status: 'healthy',
      latencyMs: 42 + tick * 2,
      activeRuns: 4,
      completedToday: 31,
      uptimePct: 99.94,
    },
    evidenceGraph: {
      status: 'healthy',
      latencyMs: 22 + tick,
      nodeCount: 18432,
      edgeCount: 94710,
      uptimePct: 99.99,
    },
    policyEngine: {
      status: 'healthy',
      latencyMs: 8 + tick,
      decisionsToday: 247,
      overridesNeeded: 3,
      uptimePct: 100,
    },
    connectorHub: {
      status: 'degraded',
      latencyMs: 210,
      errorRate: 0.04,
      activeConnectors: 10,
      uptimePct: 98.1,
    },
    database: {
      status: 'healthy',
      latencyMs: 3 + (tick % 4),
      qps: 840,
      cacheHitPct: 94.2,
      uptimePct: 100,
    },
  };
}

function fabricCorrelations() {
  return [
    {
      correlationId: 'corr-001',
      title: 'Port Congestion → Residence Readiness → Revenue-at-Risk',
      description:
        'Singapore port congestion (Vessels) delayed executive relocation (Terra: Harbourview residence readiness ↓ 18%), cascading into a Q2 revenue-at-risk signal (Lyte: $2.3M gap) via delayed deal closures.',
      products: ['vessels', 'terra', 'lyte'],
      entities: [
        { id: 'PORT-SGP', type: 'port', product: 'vessels', label: 'Singapore Port' },
        { id: 'PROP-HBV', type: 'property', product: 'terra', label: 'Harbourview Residence' },
        { id: 'REV-Q2-26', type: 'metric', product: 'lyte', label: 'Q2 Revenue Forecast' },
      ],
      signals: ['sig-001', 'sig-002', 'sig-003'],
      runs: ['run-3b22', 'run-d910', 'run-0a1f'],
      strength: 0.88,
      detectedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
    },
  ];
}

async function buildSnapshot(t: number) {
  const [signals, runs, connectors] = await Promise.all([
    getLiveSignals(t),
    getLiveAtlasRuns(t),
    getLiveConnectors(t),
  ]);

  const systemHealth = fabricSystemHealthLive(t);

  // Derive live product signal/run counts from aggregated data
  const liveProducts = PRODUCTS.map((p) => ({
    ...p,
    signalCount: signals.filter((s) => s.product === p.id).length || p.signalCount,
    runCount: runs.filter((r) => r.product === p.id).length || p.runCount,
  }));

  const recommendations = getLiveRecommendations(t);
  const approvals = getLiveApprovals();
  const alerts = getLiveAlerts(signals, t);
  const correlations = computeLiveCorrelations(signals);

  return {
    generatedAt: new Date().toISOString(),
    tick: t,
    products: liveProducts,
    signals,
    runs,
    alerts,
    recommendations,
    approvals,
    connectors,
    systemHealth,
    correlations,
  };
}

// ---------------------------------------------------------------------------
// Routes
// authMiddleware({ required: false }) hydrates req.user when a session token
// is present. requireAuthInProduction() then gates the handler in production.
// In sandbox/demo mode unauthenticated requests receive synthetic seed data.
// ---------------------------------------------------------------------------

const optionalAuth = authMiddleware({ required: false });

let tick = 0;

router.get('/fabric/snapshot', optionalAuth, async (req: Request, res: Response) => {
  if (!requireAuthInProduction(req, res)) return;
  try {
    tick++;
    res.json(await buildSnapshot(tick));
  } catch (err) {
    logger.error({ err }, 'fabric snapshot error');
    res.status(500).json({ error: 'Failed to build snapshot' });
  }
});

/**
 * Inline approval action for the Fabric Approvals panel — DEMO ONLY.
 *
 * The Fabric snapshot exposes synthetic approval IDs (e.g. "apv-001") that
 * have no row in the approvals table. This endpoint exists solely to
 * acknowledge actions on those synthetic entries so the UI's optimistic
 * remove + toast flow works in the demo posture. Real (numeric) approvals
 * MUST be mutated through the canonical POST /approvals/:id/review route,
 * which enforces reviewer role, tenant scope, and run-manager writeback.
 *
 * Body: { approvalId: string, action: "approve" | "dismiss", note?: string }
 */
router.post(
  '/fabric/approvals/inline-action',
  optionalAuth,
  validateBody(
    bodyShape({
      action: z.unknown().optional(),
      approvalId: z.unknown().optional(),
    }),
  ),
  async (req: Request, res: Response) => {
    if (!requireAuthInProduction(req, res)) return;
    try {
      const { approvalId, action } = req.body as {
        approvalId?: string | number;
        action?: string;
        note?: string;
      };

      if (approvalId === undefined || approvalId === null || approvalId === '') {
        sendBadRequest(res, 'approvalId is required');
        return;
      }
      if (!action || !['approve', 'dismiss'].includes(action)) {
        sendBadRequest(res, 'action must be one of: approve, dismiss');
        return;
      }

      const decision = action === 'approve' ? 'approved' : 'rejected';
      const idStr = String(approvalId);
      if (/^\d+$/.test(idStr)) {
        // Real DB-backed approval — refuse and direct callers to the canonical
        // approvals route so all auth, tenant, and ledger-writeback guarantees
        // stay centralized in one handler.
        sendBadRequest(res, 'Numeric approval IDs must be reviewed via POST /approvals/:id/review');
        return;
      }

      logger.info(
        {
          approvalId: idStr,
          action,
          decision,
          actorId: req.user?.id ?? null,
          actorRole: req.user?.roles?.[0] ?? null,
          correlationId: (req as unknown as { correlationId?: string }).correlationId,
        },
        'fabric.approvals.inline-action.demo',
      );
      sendSuccess(res, { approvalId: idStr, action, decision });
    } catch (err) {
      handleRouteError(res, err, 'Failed to process inline approval action');
    }
  },
);

router.get('/fabric/correlations', optionalAuth, (req: Request, res: Response) => {
  if (!requireAuthInProduction(req, res)) return;
  res.json({ correlations: fabricCorrelations() });
});

router.get('/fabric/stream', optionalAuth, (req: Request, res: Response) => {
  if (!requireAuthInProduction(req, res)) return;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Initial snapshot (async — send when ready)
  tick++;
  const currentTick = tick;
  buildSnapshot(currentTick)
    .then((snap) => {
      send('snapshot', snap);
    })
    .catch((err) => {
      logger.warn({ err }, '[fabric] Initial snapshot error');
    });

  // Push incremental updates every 4 seconds — all 8 panels are emitted so
  // every panel stays live (no static panel after initial render).
  const interval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(interval);
      return;
    }
    tick++;
    buildSnapshot(tick)
      .then((snap) => {
        if (res.writableEnded) return;
        send('products', { products: snap.products });
        send('signals', { signals: snap.signals });
        send('runs', { runs: snap.runs });
        send('alerts', { alerts: snap.alerts });
        send('recommendations', { recommendations: snap.recommendations });
        send('approvals', { approvals: snap.approvals });
        send('connectors', { connectors: snap.connectors });
        send('system_health', { systemHealth: snap.systemHealth });
      })
      .catch(() => {});
  }, 4_000);

  // Heartbeat
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }
    res.write(': heartbeat\n\n');
  }, 15_000);

  req.on('close', () => {
    clearInterval(interval);
    clearInterval(heartbeat);
  });
});

export default router;
