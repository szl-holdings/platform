/**
 * Alloy Meridian — Signal Graph & Signal Debt
 *
 * Maps signals from all platform sources into a typed business graph.
 * Computes Signal Debt scores for stale, missing, contradictory, and
 * low-confidence signals.
 *
 * Debt classification:
 * - stale: signal exists but freshness < 0.35 (collected too long ago)
 * - low_confidence: confidence < 0.65 (source reliability is low)
 * - missing: an expected signal from a domain/source pair is absent
 * - contradictory: two signals in the graph have a `contradicts` edge
 */

export type SignalSource =
  | 'github'
  | 'replit'
  | 'ci_cd'
  | 'issues'
  | 'incidents'
  | 'meetings'
  | 'analytics'
  | 'payments'
  | 'docs'
  | 'customers'
  | 'security'
  | 'infrastructure';

export type SignalDomain =
  | 'engineering'
  | 'operations'
  | 'finance'
  | 'growth'
  | 'security'
  | 'legal'
  | 'maritime'
  | 'real_estate';

export type SignalQuality = 'fresh' | 'stale' | 'missing' | 'contradictory' | 'low_confidence';

export interface BusinessSignal {
  id: string;
  source: SignalSource;
  domain: SignalDomain;
  label: string;
  value: unknown;
  confidence: number;
  freshness: number;
  collectedAt: string;
  expiresAt?: string;
  tags: string[];
  relatedEntities: string[];
  quality: SignalQuality;
}

export interface SignalEdge {
  from: string;
  to: string;
  relationship: 'causes' | 'correlates_with' | 'contradicts' | 'amplifies' | 'depends_on';
  weight: number;
}

export interface SignalGraph {
  nodes: BusinessSignal[];
  edges: SignalEdge[];
  generatedAt: string;
  totalSignals: number;
  healthScore: number;
}

export interface SignalDebtItem {
  signalId: string;
  label: string;
  source: SignalSource;
  domain: SignalDomain;
  debtType: 'stale' | 'missing' | 'contradictory' | 'low_confidence';
  debtScore: number;
  impact: 'critical' | 'high' | 'medium' | 'low';
  staleDays?: number;
  contradictsWith?: string[];
  recommendation: string;
}

export interface SignalDebtReport {
  totalDebt: number;
  criticalItems: number;
  items: SignalDebtItem[];
  topDomain: SignalDomain;
  computedAt: string;
}

const SIMULATED_SIGNALS: Omit<BusinessSignal, 'id' | 'quality'>[] = [
  {
    source: 'github',
    domain: 'engineering',
    label: 'Open PR count',
    value: 12,
    confidence: 0.97,
    freshness: 0.95,
    collectedAt: new Date(Date.now() - 15 * 60_000).toISOString(),
    tags: ['pr', 'engineering', 'velocity'],
    relatedEntities: ['engineering-team'],
  },
  {
    source: 'github',
    domain: 'engineering',
    label: 'Commit frequency (7d)',
    value: 47,
    confidence: 0.95,
    freshness: 0.90,
    collectedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
    tags: ['commits', 'cadence'],
    relatedEntities: ['engineering-team'],
  },
  {
    source: 'ci_cd',
    domain: 'engineering',
    label: 'Build success rate',
    value: 0.87,
    confidence: 0.98,
    freshness: 0.88,
    collectedAt: new Date(Date.now() - 20 * 60_000).toISOString(),
    tags: ['ci', 'quality', 'reliability'],
    relatedEntities: ['api-server', 'szl-holdings'],
  },
  {
    source: 'incidents',
    domain: 'operations',
    label: 'Active incidents',
    value: 2,
    confidence: 0.99,
    freshness: 0.99,
    collectedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    tags: ['incidents', 'sre'],
    relatedEntities: ['api-server'],
  },
  {
    source: 'analytics',
    domain: 'growth',
    label: 'Weekly active users',
    value: 3420,
    confidence: 0.92,
    freshness: 0.70,
    collectedAt: new Date(Date.now() - 8 * 3_600_000).toISOString(),
    tags: ['wau', 'growth', 'engagement'],
    relatedEntities: ['szl-holdings', 'command'],
  },
  {
    source: 'payments',
    domain: 'finance',
    label: 'MRR (current)',
    value: 48_200,
    confidence: 0.96,
    freshness: 0.60,
    collectedAt: new Date(Date.now() - 24 * 3_600_000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 3_600_000).toISOString(),
    tags: ['mrr', 'revenue', 'finance'],
    relatedEntities: ['billing'],
  },
  {
    source: 'payments',
    domain: 'finance',
    label: 'Churn rate (30d)',
    value: 0.032,
    confidence: 0.88,
    freshness: 0.55,
    collectedAt: new Date(Date.now() - 30 * 3_600_000).toISOString(),
    tags: ['churn', 'retention', 'finance'],
    relatedEntities: ['billing'],
  },
  {
    source: 'customers',
    domain: 'growth',
    label: 'NPS score',
    value: 42,
    confidence: 0.75,
    freshness: 0.30,
    collectedAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    tags: ['nps', 'satisfaction'],
    relatedEntities: ['support'],
  },
  {
    source: 'security',
    domain: 'security',
    label: 'Open critical CVEs',
    value: 3,
    confidence: 0.95,
    freshness: 0.80,
    collectedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    tags: ['cve', 'security', 'risk'],
    relatedEntities: ['api-server', 'packages'],
  },
  {
    source: 'docs',
    domain: 'engineering',
    label: 'Docs coverage score',
    value: 0.62,
    confidence: 0.70,
    freshness: 0.25,
    collectedAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    tags: ['docs', 'quality'],
    relatedEntities: ['engineering-team'],
  },
  {
    source: 'meetings',
    domain: 'operations',
    label: 'Decision backlog (pending)',
    value: 8,
    confidence: 0.80,
    freshness: 0.45,
    collectedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    tags: ['decisions', 'backlog'],
    relatedEntities: ['ops-team'],
  },
  {
    source: 'infrastructure',
    domain: 'operations',
    label: 'Infrastructure health score',
    value: 0.91,
    confidence: 0.97,
    freshness: 0.97,
    collectedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    tags: ['infra', 'health', 'uptime'],
    relatedEntities: ['api-server'],
  },
  // Contradictory pair: engineering productivity signals conflict.
  // GitHub shows high commit frequency (healthy) but CI shows low pass rate (unhealthy).
  // This contradiction surfaces as Signal Debt for both signals.
  {
    source: 'analytics',
    domain: 'growth',
    label: 'Conversion rate (signups → paid)',
    value: 0.031,
    confidence: 0.82,
    freshness: 0.65,
    collectedAt: new Date(Date.now() - 12 * 3_600_000).toISOString(),
    tags: ['conversion', 'growth', 'funnel'],
    relatedEntities: ['billing', 'szl-holdings'],
  },
  {
    source: 'customers',
    domain: 'growth',
    label: 'Conversion rate (sales-reported)',
    value: 0.071,
    confidence: 0.78,
    freshness: 0.68,
    collectedAt: new Date(Date.now() - 18 * 3_600_000).toISOString(),
    tags: ['conversion', 'growth', 'sales'],
    relatedEntities: ['crm', 'sales-team'],
  },
];

/**
 * Signals that should exist for a complete portfolio view but have no
 * data in the current signal set. Each entry defines what is expected
 * so the debt system can surface the gap explicitly.
 */
const EXPECTED_MISSING_SIGNALS: Array<{
  id: string;
  source: SignalSource;
  domain: SignalDomain;
  label: string;
  tags: string[];
  relatedEntities: string[];
}> = [
  {
    id: 'missing-vessel-ais',
    source: 'infrastructure',
    domain: 'maritime',
    label: 'Vessel AIS heartbeat',
    tags: ['ais', 'maritime', 'vessel'],
    relatedEntities: ['vessels', 'sextant'],
  },
  {
    id: 'missing-legal-matter-status',
    source: 'docs',
    domain: 'legal',
    label: 'Active matter risk summary',
    tags: ['legal', 'matter', 'risk'],
    relatedEntities: ['counsel'],
  },
  {
    id: 'missing-property-pipeline',
    source: 'customers',
    domain: 'real_estate',
    label: 'Property acquisition pipeline value',
    tags: ['real-estate', 'pipeline', 'terra'],
    relatedEntities: ['terra'],
  },
];

function classifyQuality(signal: Omit<BusinessSignal, 'id' | 'quality'>): SignalQuality {
  if (signal.freshness < 0.35) return 'stale';
  if (signal.confidence < 0.65) return 'low_confidence';
  return 'fresh';
}

function computeDebtScore(signal: BusinessSignal): number {
  let debt = 0;
  if (signal.quality === 'stale') debt += (1 - signal.freshness) * 60;
  if (signal.quality === 'low_confidence') debt += (1 - signal.confidence) * 50;
  if (signal.quality === 'contradictory') debt += 80;
  if (signal.quality === 'missing') debt += 90;
  return Math.min(100, Math.round(debt));
}

function debtImpact(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function staleDays(signal: BusinessSignal): number {
  return Math.round((Date.now() - new Date(signal.collectedAt).getTime()) / 86_400_000);
}

function buildRecommendation(signal: BusinessSignal): string {
  if (signal.quality === 'stale') {
    return `Refresh ${signal.label} from ${signal.source}. Last updated ${Math.round((Date.now() - new Date(signal.collectedAt).getTime()) / 86_400_000)} days ago.`;
  }
  if (signal.quality === 'low_confidence') {
    return `Improve confidence for ${signal.label} by adding corroborating sources or increasing sample size.`;
  }
  if (signal.quality === 'contradictory') {
    return `Resolve contradiction in ${signal.label}. Cross-reference ${signal.source} with domain ground truth and reconcile conflicting signals.`;
  }
  return `Collect missing signal: ${signal.label} from ${signal.source}. This gap reduces Decision Weather and forecast accuracy for the ${signal.domain} domain.`;
}

export class SignalGraphService {
  buildGraph(): SignalGraph {
    const nodes: BusinessSignal[] = SIMULATED_SIGNALS.map((s, idx) => {
      const quality = classifyQuality(s);
      return { ...s, id: `sig-${idx + 1}`, quality };
    });

    const edges: SignalEdge[] = [
      { from: 'sig-1', to: 'sig-2', relationship: 'correlates_with', weight: 0.7 },
      { from: 'sig-3', to: 'sig-4', relationship: 'correlates_with', weight: 0.6 },
      { from: 'sig-4', to: 'sig-12', relationship: 'causes', weight: 0.8 },
      { from: 'sig-5', to: 'sig-6', relationship: 'amplifies', weight: 0.5 },
      { from: 'sig-6', to: 'sig-7', relationship: 'correlates_with', weight: 0.75 },
      { from: 'sig-9', to: 'sig-3', relationship: 'depends_on', weight: 0.6 },
      // Contradictory edge: analytics conversion rate vs sales-reported conversion rate.
      // sig-13 = analytics conversion (0.031), sig-14 = sales-reported conversion (0.071).
      // A 2.3× discrepancy between analytics and CRM cannot be explained by attribution;
      // this contradiction blocks automated execution of growth recommendations.
      { from: 'sig-13', to: 'sig-14', relationship: 'contradicts', weight: 0.9 },
    ];

    // Apply contradictory quality to nodes involved in contradicts edges.
    const contradictedIds = new Set<string>();
    for (const edge of edges) {
      if (edge.relationship === 'contradicts') {
        contradictedIds.add(edge.from);
        contradictedIds.add(edge.to);
      }
    }
    for (const node of nodes) {
      if (contradictedIds.has(node.id)) {
        node.quality = 'contradictory';
      }
    }

    const freshCount = nodes.filter((n) => n.quality === 'fresh').length;
    const healthScore = Math.round((freshCount / nodes.length) * 100) / 100;

    return {
      nodes,
      edges,
      generatedAt: new Date().toISOString(),
      totalSignals: nodes.length,
      healthScore,
    };
  }

  computeSignalDebt(): SignalDebtReport {
    const graph = this.buildGraph();
    const debtItems: SignalDebtItem[] = [];

    // Existing signals: stale, low_confidence, contradictory
    for (const signal of graph.nodes) {
      if (signal.quality === 'fresh') continue;
      const score = computeDebtScore(signal);
      if (score < 5) continue;

      // Build contradictsWith list for contradictory signals.
      const contradictsWith: string[] | undefined =
        signal.quality === 'contradictory'
          ? graph.edges
              .filter(
                (e) =>
                  e.relationship === 'contradicts' &&
                  (e.from === signal.id || e.to === signal.id),
              )
              .flatMap((e) => [e.from, e.to])
              .filter((id) => id !== signal.id)
          : undefined;

      debtItems.push({
        signalId: signal.id,
        label: signal.label,
        source: signal.source,
        domain: signal.domain,
        debtType: signal.quality as SignalDebtItem['debtType'],
        debtScore: score,
        impact: debtImpact(score),
        staleDays: signal.quality === 'stale' ? staleDays(signal) : undefined,
        contradictsWith,
        recommendation: buildRecommendation(signal),
      });
    }

    // Missing signals: synthetic debt items for absent-but-expected signals.
    for (const missing of EXPECTED_MISSING_SIGNALS) {
      const missingSig: BusinessSignal = {
        id: missing.id,
        source: missing.source,
        domain: missing.domain,
        label: missing.label,
        value: null,
        confidence: 0,
        freshness: 0,
        collectedAt: new Date(0).toISOString(),
        tags: missing.tags,
        relatedEntities: missing.relatedEntities,
        quality: 'missing',
      };
      const score = computeDebtScore(missingSig);
      debtItems.push({
        signalId: missing.id,
        label: missing.label,
        source: missing.source,
        domain: missing.domain,
        debtType: 'missing',
        debtScore: score,
        impact: debtImpact(score),
        recommendation: buildRecommendation(missingSig),
      });
    }

    debtItems.sort((a, b) => b.debtScore - a.debtScore);
    const totalDebt = debtItems.reduce((s, d) => s + d.debtScore, 0);
    const criticalItems = debtItems.filter((d) => d.impact === 'critical').length;

    const domainCounts = new Map<SignalDomain, number>();
    for (const item of debtItems) {
      domainCounts.set(item.domain, (domainCounts.get(item.domain) ?? 0) + 1);
    }
    const topDomain = [...domainCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'engineering';

    return {
      totalDebt,
      criticalItems,
      items: debtItems,
      topDomain,
      computedAt: new Date().toISOString(),
    };
  }
}

export const signalGraphService = new SignalGraphService();
