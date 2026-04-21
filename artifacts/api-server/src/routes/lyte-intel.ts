/**
 * Lyte Intel — read-only API endpoints powering the Signal Fusion, Governance
 * Posture, and Decision Schema Library surfaces.
 *
 * Each endpoint serves a curated catalog of demo-grade metadata (titles,
 * trigger patterns, action sequences, etc.) and overlays live aggregate
 * counts derived from the lyte_* tables when data is present.
 *
 * Mounted in routes/index.ts before the lyte group so the tenant scope
 * middleware does not intercept these public read endpoints. Paths are
 * whitelisted in middlewares/global-auth-enforcer.ts.
 */

import { db, lyteActionsTable, lyteIncidentsTable, lyteSignalsTable } from '@szl-holdings/db';
import { desc, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();
const noAuth = authMiddleware({ required: false });

interface FusionSignalSeed {
  id: string;
  domain: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  sourceType: string;
  confidence: number;
  correlatedWith: string[];
  correlationType?: 'causal' | 'temporal' | 'semantic';
  correlationStrength?: number;
  timestamp: string;
  metadata: Record<string, string>;
}

const FUSION_SIGNALS_SEED: FusionSignalSeed[] = [
  {
    id: 'sf1',
    domain: 'PARAGON',
    severity: 'critical',
    title: 'KEV CVE-2025-1337 active exploitation — 3 internal hosts confirmed',
    sourceType: 'threat_intelligence',
    confidence: 0.94,
    correlatedWith: ['sf4', 'sf6'],
    correlationType: 'causal',
    correlationStrength: 0.87,
    timestamp: 'T-04m',
    metadata: {
      'Attack vector': 'RCE via log4j derivative',
      'Affected systems': '3 (auth-svc, api-gw, reporting)',
      SLA: 'T-2h',
    },
  },
  {
    id: 'sf2',
    domain: 'SEXTANT',
    severity: 'high',
    title: 'MV Adriatic Star — AIS dark gap 6h20m, last fix Strait of Messina',
    sourceType: 'ais_telemetry',
    confidence: 0.91,
    correlatedWith: ['sf5'],
    correlationType: 'temporal',
    correlationStrength: 0.72,
    timestamp: 'T-11m',
    metadata: {
      'Gap duration': '6h20m',
      'Last AIS fix': '37.42N, 15.61E',
      'OFAC status': 'Pending',
    },
  },
  {
    id: 'sf3',
    domain: 'Counsel',
    severity: 'high',
    title: 'Motion HC-2025-0487 — deadline T-38h, no filing draft, no owner',
    sourceType: 'deadline_monitor',
    confidence: 0.98,
    correlatedWith: [],
    timestamp: 'T-22m',
    metadata: { 'Matter ID': 'HC-2025-0487', Deadline: '38h remaining', Owner: 'Unassigned' },
  },
  {
    id: 'sf4',
    domain: 'FORGE',
    severity: 'high',
    title: 'Approval queue depth 14 workflows — 6 exceed 72h threshold',
    sourceType: 'workflow_monitor',
    confidence: 0.99,
    correlatedWith: ['sf1'],
    correlationType: 'causal',
    correlationStrength: 0.63,
    timestamp: 'T-02h',
    metadata: { 'Queue depth': '14 pending', 'Over SLA': '6 workflows', Oldest: '89h 14m' },
  },
  {
    id: 'sf5',
    domain: 'DOMAINE',
    severity: 'medium',
    title: 'NYC portfolio distress threshold — 12 properties, $340M exposure',
    sourceType: 'market_intelligence',
    confidence: 0.83,
    correlatedWith: ['sf2'],
    correlationType: 'semantic',
    correlationStrength: 0.54,
    timestamp: 'T-01h',
    metadata: {
      'Properties in scope': '12',
      'Estimated exposure': '$340M',
      Diligence: '34% complete',
    },
  },
  {
    id: 'sf6',
    domain: 'IMPERIUM',
    severity: 'medium',
    title: 'Configuration drift detected — AWS us-east-1 unrestricted egress rule',
    sourceType: 'cloud_policy',
    confidence: 0.96,
    correlatedWith: ['sf1'],
    correlationType: 'causal',
    correlationStrength: 0.51,
    timestamp: 'T-04h',
    metadata: { Asset: 'sg-0xf823b1a', Policy: 'unrestricted egress', Region: 'us-east-1' },
  },
  {
    id: 'sf7',
    domain: 'Carlota Jo',
    severity: 'info',
    title: 'Engagement milestone 3 — delivery confirmed, awaiting client sign-off',
    sourceType: 'engagement_tracker',
    confidence: 0.88,
    correlatedWith: [],
    timestamp: 'T-03h',
    metadata: { Client: 'Archipelago Capital', Milestone: '3 of 6', 'Response SLA': '48h' },
  },
];

const CORRELATION_PAIRS = [
  {
    from: 'sf1',
    to: 'sf4',
    type: 'causal' as const,
    strength: 0.87,
    label: 'Exploit → Approval stall',
  },
  {
    from: 'sf1',
    to: 'sf6',
    type: 'causal' as const,
    strength: 0.51,
    label: 'KEV → Cloud drift vector',
  },
  {
    from: 'sf2',
    to: 'sf5',
    type: 'temporal' as const,
    strength: 0.54,
    label: 'Dark vessel ↔ Portfolio exposure',
  },
];

// Map known signal source values (from lyte_signals.source) to fusion domains.
const SOURCE_TO_DOMAIN: Record<string, string> = {
  aegis: 'PARAGON',
  vessels: 'SEXTANT',
  terra: 'DOMAINE',
  prism: 'Counsel',
  'prism-counsel': 'Counsel',
  alloy: 'FORGE',
  carlota: 'Carlota Jo',
  'carlota-jo': 'Carlota Jo',
  imperium: 'IMPERIUM',
};

const SEVERITY_NORMALIZE: Record<string, 'critical' | 'high' | 'medium' | 'info'> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'info',
  info: 'info',
};

router.get('/lyte/signal-fusion', noAuth, async (_req, res) => {
  try {
    const liveSignals = await db
      .select()
      .from(lyteSignalsTable)
      .orderBy(desc(lyteSignalsTable.receivedAt))
      .limit(50)
      .catch((): Array<typeof lyteSignalsTable.$inferSelect> => []);

    const liveFusion: FusionSignalSeed[] = liveSignals
      .filter((s) => SOURCE_TO_DOMAIN[String(s.source).toLowerCase()])
      .slice(0, 7)
      .map((s, idx) => {
        const meta = (s.metadata as Record<string, unknown>) ?? {};
        const metaStr: Record<string, string> = {};
        Object.entries(meta)
          .slice(0, 3)
          .forEach(([k, v]) => {
            if (v != null) metaStr[k] = String(v);
          });
        const ageMin = Math.max(
          1,
          Math.floor((Date.now() - new Date(s.receivedAt).getTime()) / 60000),
        );
        const timestamp =
          ageMin < 60 ? `T-${String(ageMin).padStart(2, '0')}m` : `T-${Math.floor(ageMin / 60)}h`;
        return {
          id: `live-sf${s.id}`,
          domain: SOURCE_TO_DOMAIN[String(s.source).toLowerCase()] ?? 'IMPERIUM',
          severity: SEVERITY_NORMALIZE[s.severity] ?? 'info',
          title: s.title,
          sourceType: s.sourceType ?? 'monitoring',
          confidence:
            typeof meta.confidence === 'number' ? meta.confidence : 0.85 + (idx % 3) * 0.04,
          correlatedWith: [],
          timestamp,
          metadata: metaStr,
        };
      });

    const signals = liveFusion.length >= 3 ? liveFusion : FUSION_SIGNALS_SEED;
    sendSuccess(res, {
      signals,
      correlations: liveFusion.length >= 3 ? [] : CORRELATION_PAIRS,
      dataAvailable: liveFusion.length >= 3,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch signal fusion');
  }
});

interface DomainHealthSeed {
  domain: string;
  color: string;
  iconKey: 'Shield' | 'Ship' | 'Building2' | 'Briefcase' | 'Users' | 'Layers';
  policyCount: number;
  activePolicies: number;
  pendingApprovals: number;
  approvalThroughputPct: number;
  overrideRate: number;
  proofCoverage: number;
  slaBreaches: number;
  maturityScore: number;
  trend: 'rising' | 'stable' | 'declining';
  lastReviewed: string;
}

const DOMAIN_HEALTH_SEED: DomainHealthSeed[] = [
  {
    domain: 'PARAGON',
    color: 'hsl(222,60%,60%)',
    iconKey: 'Shield',
    policyCount: 24,
    activePolicies: 22,
    pendingApprovals: 3,
    approvalThroughputPct: 94,
    overrideRate: 4.2,
    proofCoverage: 99.1,
    slaBreaches: 1,
    maturityScore: 91,
    trend: 'rising',
    lastReviewed: '2d ago',
  },
  {
    domain: 'SEXTANT',
    color: 'hsl(206,72%,54%)',
    iconKey: 'Ship',
    policyCount: 18,
    activePolicies: 16,
    pendingApprovals: 2,
    approvalThroughputPct: 88,
    overrideRate: 7.8,
    proofCoverage: 97.4,
    slaBreaches: 2,
    maturityScore: 82,
    trend: 'stable',
    lastReviewed: '5d ago',
  },
  {
    domain: 'DOMAINE',
    color: 'hsl(142,52%,48%)',
    iconKey: 'Building2',
    policyCount: 14,
    activePolicies: 14,
    pendingApprovals: 4,
    approvalThroughputPct: 79,
    overrideRate: 12.3,
    proofCoverage: 95.2,
    slaBreaches: 0,
    maturityScore: 74,
    trend: 'declining',
    lastReviewed: '7d ago',
  },
  {
    domain: 'Counsel',
    color: 'hsl(260,60%,65%)',
    iconKey: 'Briefcase',
    policyCount: 21,
    activePolicies: 21,
    pendingApprovals: 5,
    approvalThroughputPct: 97,
    overrideRate: 2.1,
    proofCoverage: 99.8,
    slaBreaches: 0,
    maturityScore: 97,
    trend: 'rising',
    lastReviewed: '1d ago',
  },
  {
    domain: 'Carlota Jo',
    color: 'hsl(340,52%,60%)',
    iconKey: 'Users',
    policyCount: 11,
    activePolicies: 11,
    pendingApprovals: 0,
    approvalThroughputPct: 100,
    overrideRate: 0,
    proofCoverage: 98.7,
    slaBreaches: 0,
    maturityScore: 99,
    trend: 'stable',
    lastReviewed: '2d ago',
  },
  {
    domain: 'IMPERIUM',
    color: 'hsl(25,72%,54%)',
    iconKey: 'Layers',
    policyCount: 31,
    activePolicies: 28,
    pendingApprovals: 0,
    approvalThroughputPct: 91,
    overrideRate: 5.6,
    proofCoverage: 96.8,
    slaBreaches: 1,
    maturityScore: 86,
    trend: 'rising',
    lastReviewed: '1d ago',
  },
];

const APPROVAL_QUEUE_SEED = [
  {
    id: 'a1',
    title: 'KEV response — isolation approval',
    domain: 'PARAGON',
    priority: 'critical',
    requestedBy: 'SOC Analyst',
    age: '4h',
    dueIn: 'T-2h',
    status: 'pending',
  },
  {
    id: 'a2',
    title: 'LP notification — NYC distressed portfolio',
    domain: 'DOMAINE',
    priority: 'high',
    requestedBy: 'Investment Lead',
    age: '18h',
    dueIn: 'T-6h',
    status: 'pending',
  },
  {
    id: 'a3',
    title: 'MV Adriatic Star — OFAC filing decision',
    domain: 'SEXTANT',
    priority: 'high',
    requestedBy: 'Compliance Officer',
    age: '11h',
    dueIn: 'T-12h',
    status: 'escalated',
  },
  {
    id: 'a4',
    title: 'HC-2025-0487 — filing route selection',
    domain: 'Counsel',
    priority: 'high',
    requestedBy: 'Lead Attorney',
    age: '22h',
    dueIn: 'T-14h',
    status: 'pending',
  },
  {
    id: 'a5',
    title: 'Cloud configuration change — sg-0xf823b1a',
    domain: 'IMPERIUM',
    priority: 'medium',
    requestedBy: 'Cloud Ops',
    age: '4h',
    dueIn: 'T-20h',
    status: 'pending',
  },
];

const VIOLATION_LOG_SEED = [
  {
    id: 'v1',
    domain: 'FORGE',
    type: 'SLA breach',
    detail: 'Approval queue depth exceeded 72h threshold',
    severity: 'high',
    timestamp: '2h ago',
    status: 'open',
  },
  {
    id: 'v2',
    domain: 'DOMAINE',
    type: 'Override without justification',
    detail: 'Policy gate bypassed on acquisition sign-off',
    severity: 'high',
    timestamp: '1d ago',
    status: 'open',
  },
  {
    id: 'v3',
    domain: 'SEXTANT',
    type: 'Review state gap',
    detail: 'AI recommendation exported without review completion',
    severity: 'medium',
    timestamp: '3d ago',
    status: 'resolved',
  },
  {
    id: 'v4',
    domain: 'IMPERIUM',
    type: 'Configuration drift',
    detail: 'Unrestricted egress rule persisted 4h after detection',
    severity: 'medium',
    timestamp: '4h ago',
    status: 'open',
  },
];

function ageString(from: Date | null | undefined): string {
  if (!from) return '—';
  const min = Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / 60000));
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.floor(min / 60)}h`;
  return `${Math.floor(min / 1440)}d`;
}

function dueInString(due: Date | null | undefined): string {
  if (!due) return '—';
  const min = Math.floor((new Date(due).getTime() - Date.now()) / 60000);
  if (min <= 0) return 'overdue';
  if (min < 60) return `T-${min}m`;
  if (min < 1440) return `T-${Math.floor(min / 60)}h`;
  return `T-${Math.floor(min / 1440)}d`;
}

const CATEGORY_TO_DOMAIN: Record<string, string> = {
  approval_latency: 'FORGE',
  ownership_gap: 'Counsel',
  forecast_drift: 'DOMAINE',
  stalled_workflow: 'FORGE',
  handoff_failure: 'Carlota Jo',
  status_conflict: 'IMPERIUM',
  readiness_blocker: 'PARAGON',
  pipeline_hygiene: 'SEXTANT',
};

router.get('/lyte/governance-domains', noAuth, async (_req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const [actionAgg, signalAgg, incidentAgg, actions7d, queueRows, violationRows] =
      await Promise.all([
        db
          .select({
            pending: sql<number>`count(*) filter (where state in ('new','assigned'))::int`,
            total: sql<number>`count(*)::int`,
          })
          .from(lyteActionsTable)
          .catch(() => [{ pending: 0, total: 0 }]),
        db
          .select({
            total: sql<number>`count(*)::int`,
            sla: sql<number>`count(*) filter (where status = 'new' and received_at <= now() - interval '24 hours')::int`,
          })
          .from(lyteSignalsTable)
          .catch(() => [{ total: 0, sla: 0 }]),
        db
          .select({
            total: sql<number>`count(*)::int`,
            open: sql<number>`count(*) filter (where status not in ('resolved','closed'))::int`,
          })
          .from(lyteIncidentsTable)
          .catch(() => [{ total: 0, open: 0 }]),
        db
          .select({
            total: sql<number>`count(*)::int`,
            dismissed: sql<number>`count(*) filter (where state = 'dismissed')::int`,
          })
          .from(lyteActionsTable)
          .where(sql`created_at >= ${sevenDaysAgo}`)
          .catch(() => [{ total: 0, dismissed: 0 }]),
        db
          .select()
          .from(lyteActionsTable)
          .where(sql`state in ('new','assigned','escalated')`)
          .orderBy(desc(lyteActionsTable.createdAt))
          .limit(8)
          .catch((): Array<typeof lyteActionsTable.$inferSelect> => []),
        db
          .select()
          .from(lyteIncidentsTable)
          .orderBy(desc(lyteIncidentsTable.createdAt))
          .limit(8)
          .catch((): Array<typeof lyteIncidentsTable.$inferSelect> => []),
      ]);

    const act = actionAgg[0] ?? { pending: 0, total: 0 };
    const sig = signalAgg[0] ?? { total: 0, sla: 0 };
    const inc = incidentAgg[0] ?? { total: 0, open: 0 };
    const act7d = actions7d[0] ?? { total: 0, dismissed: 0 };

    const liveOverrideRate =
      act7d.total > 0 ? parseFloat(((act7d.dismissed / act7d.total) * 100).toFixed(1)) : null;
    const liveProofCoverage =
      inc.total > 0 ? parseFloat((((inc.total - inc.open) / inc.total) * 100).toFixed(1)) : null;

    // Distribute live pending count across domains proportional to seed values.
    const totalSeedPending = DOMAIN_HEALTH_SEED.reduce((a, d) => a + d.pendingApprovals, 0);
    const livePending = act.pending ?? 0;

    const domains = DOMAIN_HEALTH_SEED.map((d) => {
      const pendingApprovals =
        livePending > 0 && totalSeedPending > 0
          ? Math.round((d.pendingApprovals / totalSeedPending) * livePending)
          : d.pendingApprovals;
      return {
        ...d,
        pendingApprovals,
        overrideRate:
          liveOverrideRate != null
            ? parseFloat((d.overrideRate * 0.5 + liveOverrideRate * 0.5).toFixed(1))
            : d.overrideRate,
        proofCoverage:
          liveProofCoverage != null
            ? parseFloat(((d.proofCoverage + liveProofCoverage) / 2).toFixed(1))
            : d.proofCoverage,
      };
    });

    const platformMetrics = {
      totalPolicies: domains.reduce((a, d) => a + d.policyCount, 0),
      activePolicies: domains.reduce((a, d) => a + d.activePolicies, 0),
      pendingApprovals: domains.reduce((a, d) => a + d.pendingApprovals, 0),
      avgApprovalThroughput:
        domains.reduce((a, d) => a + d.approvalThroughputPct, 0) / domains.length,
      avgOverrideRate: domains.reduce((a, d) => a + d.overrideRate, 0) / domains.length,
      avgProofCoverage: domains.reduce((a, d) => a + d.proofCoverage, 0) / domains.length,
      totalSlaBreaches: (sig.sla ?? 0) + domains.reduce((a, d) => a + d.slaBreaches, 0),
      avgMaturity: domains.reduce((a, d) => a + d.maturityScore, 0) / domains.length,
    };

    const liveApprovalQueue = queueRows.map((r) => ({
      id: `q${r.id}`,
      title: r.title,
      domain: CATEGORY_TO_DOMAIN[r.signalCategory] ?? 'FORGE',
      priority: r.priority === 'urgent' ? 'critical' : r.priority,
      requestedBy: r.owner ?? r.assignedTo ?? 'Unassigned',
      age: ageString(r.createdAt),
      dueIn: dueInString(r.dueAt),
      status: r.state === 'escalated' ? 'escalated' : 'pending',
    }));
    const approvalQueue = liveApprovalQueue.length > 0 ? liveApprovalQueue : APPROVAL_QUEUE_SEED;

    const SEVERITY_TO_VIOLATION = (s: string) => (s === 'critical' ? 'high' : s);
    const liveViolations = violationRows.map((r) => ({
      id: `vi${r.id}`,
      domain: r.impactArea ?? 'IMPERIUM',
      type: r.rootCause ?? 'Policy violation',
      detail: r.description ?? r.title,
      severity: SEVERITY_TO_VIOLATION(r.severity),
      timestamp: ageString(r.createdAt) + ' ago',
      status: r.status === 'resolved' || r.status === 'closed' ? 'resolved' : 'open',
    }));
    const violations = liveViolations.length > 0 ? liveViolations : VIOLATION_LOG_SEED;

    sendSuccess(res, {
      domains,
      approvalQueue,
      violations,
      platformMetrics,
      dataAvailable: sig.total + inc.total + act.total > 0,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch governance domains');
  }
});

interface SchemaStepSeed {
  stage: string;
  action: string;
  owner: string;
  gate?: string;
  timeout?: string;
}
interface DecisionSchemaSeed {
  id: string;
  name: string;
  category: string;
  domain: string;
  color: string;
  iconKey: 'Shield' | 'Ship' | 'Building2' | 'Briefcase' | 'Users' | 'Layers';
  description: string;
  triggerPatterns: string[];
  actionSequence: SchemaStepSeed[];
  policyGates: string[];
  expectedOutcome: string;
  avgDurationH: number;
  timesUsed: number;
  successRate: number;
  lastUsed: string;
  tags: string[];
  complexity: 'low' | 'medium' | 'high';
}

const SCHEMAS_SEED: DecisionSchemaSeed[] = [
  {
    id: 'sch1',
    name: 'Cyber Incident Response',
    category: 'Security Operations',
    domain: 'PARAGON',
    color: 'hsl(222,60%,60%)',
    iconKey: 'Shield',
    description:
      'Structured response protocol for confirmed cyber incidents — from initial signal triage through containment, eradication, and proof-chain recording.',
    triggerPatterns: [
      'KEV exploitation confirmed on production asset',
      'MITRE ATT&CK technique detected (T1071, T1566)',
      'Identity anomaly score exceeds threshold 0.82',
      'Critical vulnerability + active threat actor correlation',
    ],
    actionSequence: [
      {
        stage: 'Signal',
        action: 'Ingest threat signal from Aegis SOC feed',
        owner: 'SOC Analyst',
        timeout: '5m',
      },
      {
        stage: 'Context',
        action: 'Enrich via MITRE ATT&CK and asset ownership graph',
        owner: 'System',
        timeout: '2m',
      },
      {
        stage: 'Recommendation',
        action: 'AI generates containment options with evidence lineage',
        owner: 'AI Agent',
        gate: 'Confidence ≥ 0.80',
      },
      {
        stage: 'Simulation',
        action: 'Model impact of containment on service availability',
        owner: 'System',
        timeout: '3m',
      },
      {
        stage: 'Policy',
        action: 'Covenant Policy checks approver eligibility for isolation action',
        owner: 'System',
      },
      {
        stage: 'Execution',
        action: 'Alloy orchestrates isolation workflow with checkpoint recovery',
        owner: 'SOC Lead',
        gate: 'Approver: security_lead',
      },
      {
        stage: 'Proof',
        action: 'Proof Chain records full chain: detection → action → isolation',
        owner: 'System',
      },
      {
        stage: 'Outcome',
        action: 'Outcome Graph measures time-to-containment vs simulation',
        owner: 'System',
        timeout: '24h',
      },
    ],
    policyGates: [
      'security_lead approval required',
      'service_owner notification mandatory',
      'exec_briefing if severity=critical',
      'post-incident review within 72h',
    ],
    expectedOutcome:
      'Asset isolated within SLA, evidence chain preserved, root cause identified, recurrence prevented',
    avgDurationH: 4.2,
    timesUsed: 34,
    successRate: 0.94,
    lastUsed: '3 days ago',
    tags: ['incident-response', 'containment', 'mitre', 'soc'],
    complexity: 'high',
  },
  {
    id: 'sch2',
    name: 'Maritime Anomaly Investigation',
    category: 'Fleet Operations',
    domain: 'SEXTANT',
    color: 'hsl(206,72%,54%)',
    iconKey: 'Ship',
    description:
      'Systematic investigation of dark vessel events, AIS signal gaps, and sanctions exposure — with OFAC screening integrated into the governed approval flow.',
    triggerPatterns: [
      'AIS signal gap exceeds 4 hours for flagged route',
      'Vessel proximity to OFAC-designated entity',
      'Dark vessel detection from satellite imagery correlation',
      'Sanctions list match score exceeds 0.75',
    ],
    actionSequence: [
      {
        stage: 'Signal',
        action: 'Ingest AIS gap signal from Vessels telemetry feed',
        owner: 'System',
      },
      {
        stage: 'Context',
        action: 'Correlate last known position, cargo manifest, port schedule',
        owner: 'System',
        timeout: '5m',
      },
      {
        stage: 'Recommendation',
        action: 'AI risk assessment with OFAC screening results',
        owner: 'AI Agent',
        gate: 'OFAC API response received',
      },
      {
        stage: 'Simulation',
        action: 'Model cargo and voyage P&L impact scenarios',
        owner: 'System',
      },
      {
        stage: 'Policy',
        action: 'Policy check for compliance officer notification trigger',
        owner: 'System',
      },
      {
        stage: 'Execution',
        action: 'Flag voyage twin, alert fleet manager, initiate OFAC report',
        owner: 'Compliance Officer',
        gate: 'Approver: compliance_officer',
      },
      {
        stage: 'Proof',
        action: 'Record investigation chain with timestamp and decision attribution',
        owner: 'System',
      },
      {
        stage: 'Outcome',
        action: 'Track vessel re-emergence and compliance clearance',
        owner: 'System',
      },
    ],
    policyGates: [
      'compliance_officer approval on OFAC match',
      'legal review if sanctions exposure confirmed',
      'regulatory filing if threshold exceeded',
    ],
    expectedOutcome:
      'Vessel status resolved, sanctions exposure documented, regulatory filings submitted if required',
    avgDurationH: 8.5,
    timesUsed: 22,
    successRate: 0.91,
    lastUsed: '11 days ago',
    tags: ['maritime', 'sanctions', 'ofac', 'ais', 'compliance'],
    complexity: 'medium',
  },
  {
    id: 'sch3',
    name: 'Distressed Asset Acquisition Review',
    category: 'Investment Operations',
    domain: 'DOMAINE',
    color: 'hsl(142,52%,48%)',
    iconKey: 'Building2',
    description:
      'End-to-end acquisition workflow for distressed real estate — from initial distress signal through underwriting, LP approval, and post-acquisition outcome tracking.',
    triggerPatterns: [
      'Distress signal threshold breached (≥3 indicators)',
      'Ownership transfer filing detected on target property',
      'Tax lien accumulation above $500K on monitored asset',
      'Broker network signal: off-market interest confirmed',
    ],
    actionSequence: [
      {
        stage: 'Signal',
        action: 'Ingest distress signal composite from Terra intelligence feed',
        owner: 'System',
      },
      {
        stage: 'Context',
        action: 'Build ownership entity graph, debt stack, lien history',
        owner: 'System',
      },
      {
        stage: 'Recommendation',
        action: 'AI generates acquisition thesis with comparable analysis',
        owner: 'AI Agent',
        gate: 'Diligence checklist ≥60% complete',
      },
      {
        stage: 'Simulation',
        action: 'Model IRR scenarios: base/bull/bear with sensitivity analysis',
        owner: 'System',
      },
      { stage: 'Policy', action: 'Investment committee approval threshold check', owner: 'System' },
      {
        stage: 'Execution',
        action: 'Route to LP approval workflow via Alloy with deal memorandum',
        owner: 'Investment Lead',
        gate: 'Approver: investment_committee',
      },
      {
        stage: 'Proof',
        action: 'Record complete underwriting chain for LP reporting',
        owner: 'System',
      },
      {
        stage: 'Outcome',
        action: 'Track against projected IRR and acquisition thesis at 12/24/36m',
        owner: 'Investment Lead',
      },
    ],
    policyGates: [
      'investment_committee quorum required',
      'LP notification on deals >$10M',
      'legal review of title chain mandatory',
      'environmental review if applicable',
    ],
    expectedOutcome:
      'Acquisition completed within modeled parameters, LP reporting satisfied, outcome tracked against thesis',
    avgDurationH: 168,
    timesUsed: 12,
    successRate: 0.88,
    lastUsed: '21 days ago',
    tags: ['real-estate', 'acquisition', 'underwriting', 'lp-approval'],
    complexity: 'high',
  },
  {
    id: 'sch4',
    name: 'Legal Deadline Response Protocol',
    category: 'Legal Operations',
    domain: 'Counsel',
    color: 'hsl(260,60%,65%)',
    iconKey: 'Briefcase',
    description:
      'Automated detection and governed response for approaching legal deadlines — from motion filings through court-mandated responses.',
    triggerPatterns: [
      'Motion deadline within 72h, no filing draft confirmed',
      'Discovery deadline approach without production status',
      'Court order deadline detected without acknowledgment',
      'Settlement demand deadline approaching without response status',
    ],
    actionSequence: [
      {
        stage: 'Signal',
        action: 'Deadline proximity signal from PRISM Counsel matter twin',
        owner: 'System',
      },
      {
        stage: 'Context',
        action: 'Pull matter status, pending docs, assigned counsel, opposing counsel',
        owner: 'System',
      },
      {
        stage: 'Recommendation',
        action: 'AI drafts filing response options with relevant precedent',
        owner: 'AI Agent',
        gate: 'Attorney review required',
      },
      {
        stage: 'Simulation',
        action: 'Model outcome scenarios: file, extension request, consequence',
        owner: 'System',
      },
      {
        stage: 'Policy',
        action: 'Check approval routing: associate vs partner vs external counsel',
        owner: 'System',
      },
      {
        stage: 'Execution',
        action: 'Route filing workflow with approval gates and court system sync',
        owner: 'Lead Attorney',
        gate: 'Approver: supervising_attorney',
      },
      {
        stage: 'Proof',
        action: 'Record filing chain: recommendation → review → approval → submission',
        owner: 'System',
      },
      {
        stage: 'Outcome',
        action: 'Track court acknowledgment and downstream matter impact',
        owner: 'System',
      },
    ],
    policyGates: [
      'supervising_attorney approval mandatory',
      'client notification if billing impact',
      'malpractice review if deadline missed',
      'bar compliance check on all filings',
    ],
    expectedOutcome:
      'Filing completed before deadline, court acknowledgment received, matter record updated',
    avgDurationH: 36,
    timesUsed: 18,
    successRate: 0.97,
    lastUsed: '5 days ago',
    tags: ['legal', 'filing', 'deadline', 'matter-management'],
    complexity: 'medium',
  },
  {
    id: 'sch5',
    name: 'Client Engagement Delivery Protocol',
    category: 'Advisory Operations',
    domain: 'Carlota Jo',
    color: 'hsl(340,52%,60%)',
    iconKey: 'Users',
    description:
      'Governed delivery workflow for advisory engagements — milestone confirmation, document delivery, and client sign-off with full audit trail.',
    triggerPatterns: [
      'Engagement milestone completion signal from delivery tracker',
      'Client communication gap exceeds SLA threshold',
      'Deliverable review deadline approaching without sign-off',
      'Service agreement renewal window within 30 days',
    ],
    actionSequence: [
      {
        stage: 'Signal',
        action: 'Milestone completion signal from engagement tracker',
        owner: 'System',
      },
      {
        stage: 'Context',
        action: 'Pull engagement record, prior deliverables, client preferences',
        owner: 'System',
      },
      {
        stage: 'Recommendation',
        action: 'AI generates delivery memo with key milestones and context',
        owner: 'AI Agent',
      },
      {
        stage: 'Simulation',
        action: 'Model client relationship impact scenarios',
        owner: 'System',
      },
      {
        stage: 'Policy',
        action: 'Check NDA compliance and document export safety state',
        owner: 'System',
      },
      {
        stage: 'Execution',
        action: 'Route secure delivery workflow with client confirmation gate',
        owner: 'Engagement Manager',
        gate: 'Approver: engagement_manager',
      },
      {
        stage: 'Proof',
        action: 'Record delivery chain: preparation → approval → delivery → confirmation',
        owner: 'System',
      },
      {
        stage: 'Outcome',
        action: 'Track client satisfaction signal and next engagement stage',
        owner: 'Engagement Manager',
      },
    ],
    policyGates: [
      'engagement_manager approval on all deliverables',
      'NDA compliance check before delivery',
      'client principal sign-off for milestone gates',
    ],
    expectedOutcome:
      'Deliverable confirmed by client, engagement milestone closed, relationship health maintained',
    avgDurationH: 48,
    timesUsed: 28,
    successRate: 0.96,
    lastUsed: '2 days ago',
    tags: ['advisory', 'delivery', 'client-management', 'engagement'],
    complexity: 'low',
  },
  {
    id: 'sch6',
    name: 'Cloud Policy Violation Remediation',
    category: 'Infrastructure Governance',
    domain: 'IMPERIUM',
    color: 'hsl(25,72%,54%)',
    iconKey: 'Layers',
    description:
      'Automated detection and governed remediation of cloud infrastructure policy violations — configuration drift, unauthorized access changes, and compliance gaps.',
    triggerPatterns: [
      'Security group policy violation detected (unrestricted ingress/egress)',
      'Configuration drift from approved baseline',
      'Unauthorized IAM permission escalation',
      'Compliance benchmark failure (CIS, SOC 2, ISO 27001)',
    ],
    actionSequence: [
      {
        stage: 'Signal',
        action: 'Policy violation signal from IMPERIUM cloud scanner',
        owner: 'System',
      },
      {
        stage: 'Context',
        action: 'Map asset ownership, blast radius, policy lineage',
        owner: 'System',
      },
      {
        stage: 'Recommendation',
        action: 'AI generates remediation options ranked by risk reduction',
        owner: 'AI Agent',
        gate: 'Confidence ≥ 0.85',
      },
      {
        stage: 'Simulation',
        action: 'Model service impact of remediation options',
        owner: 'System',
      },
      {
        stage: 'Policy',
        action: 'Check approval chain based on asset criticality tier',
        owner: 'System',
      },
      {
        stage: 'Execution',
        action: 'Apply remediation via Alloy with automatic rollback gate',
        owner: 'Cloud Ops',
        gate: 'Approver: cloud_ops_lead',
      },
      {
        stage: 'Proof',
        action: 'Record violation → detection → remediation → verification chain',
        owner: 'System',
      },
      {
        stage: 'Outcome',
        action: 'Verify policy compliance restoration and track recurrence',
        owner: 'System',
      },
    ],
    policyGates: [
      'cloud_ops_lead approval for production changes',
      'change_advisory_board for tier-1 assets',
      'security approval for IAM changes',
    ],
    expectedOutcome:
      'Policy violation remediated, compliance restored, no service disruption, evidence chain preserved',
    avgDurationH: 2.5,
    timesUsed: 47,
    successRate: 0.99,
    lastUsed: '1 day ago',
    tags: ['cloud', 'compliance', 'remediation', 'infrastructure'],
    complexity: 'medium',
  },
];

router.get('/lyte/decision-schemas', noAuth, async (_req, res) => {
  try {
    const counts = await db
      .select({
        category: lyteActionsTable.signalCategory,
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where state = 'completed')::int`,
      })
      .from(lyteActionsTable)
      .groupBy(lyteActionsTable.signalCategory)
      .catch(() => [] as Array<{ category: string | null; total: number; completed: number }>);

    const categoryToStats = new Map<string, { total: number; completed: number }>();
    for (const row of counts) {
      if (row.category)
        categoryToStats.set(row.category, { total: row.total, completed: row.completed });
    }

    // Map each schema to a synthetic action category match by lowercased domain.
    const schemas = SCHEMAS_SEED.map((s) => {
      const liveStats = categoryToStats.get(s.domain.toLowerCase().replace(/[^a-z]/g, ''));
      if (!liveStats || liveStats.total === 0) return s;
      const successRate =
        liveStats.completed > 0
          ? Math.min(0.99, liveStats.completed / liveStats.total)
          : s.successRate;
      return {
        ...s,
        timesUsed: s.timesUsed + liveStats.total,
        successRate: parseFloat(successRate.toFixed(2)),
      };
    });

    sendSuccess(res, {
      schemas,
      categories: Array.from(new Set(schemas.map((s) => s.category))),
      dataAvailable: counts.length > 0,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch decision schemas');
  }
});

export default router;
