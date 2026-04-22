import { type AlloyDecisionEvidenceRef, type RiskLevel, getKernelAuditTrail, verifyAuditChainIntegrity } from '@szl-holdings/ai-engine';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { load as yamlLoad } from 'js-yaml';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { agentEventBus } from '../../lib/event-bus';

export type AgentEntry = {
  id: string;
  name: string;
  subtitle: string;
  domain: string;
  capabilities: string[];
  riskTolerance: string;
  collaborationRules: string[];
  scopeCertMaxRisk: 'low' | 'medium' | 'high' | 'critical';
  version: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadAgentManifest(): { agents: AgentEntry[]; version: string; date: string } {
  const manifestPath = join(__dirname, 'config/agent-manifest.yaml');
  let raw: string;
  try {
    raw = readFileSync(manifestPath, 'utf8');
  } catch (err) {
    throw new Error(`[control-tower] Cannot read agent manifest at ${manifestPath}: ${err}`);
  }
  const doc = yamlLoad(raw) as { agents?: AgentEntry[] };
  if (!doc || !Array.isArray(doc.agents) || doc.agents.length === 0) {
    throw new Error(
      '[control-tower] Agent manifest is empty or malformed — cannot start without a valid agent registry',
    );
  }
  const versionMatch = raw.match(/^# Version:\s*(.+)$/m);
  const dateMatch = raw.match(/^# Date:\s*(.+)$/m);
  return {
    agents: doc.agents,
    version: versionMatch?.[1]?.trim() ?? 'unknown',
    date: dateMatch?.[1]?.trim() ?? 'unknown',
  };
}

const {
  agents: CONTROL_TOWER_AGENT_REGISTRY,
  version: AGENT_MANIFEST_VERSION,
  date: AGENT_MANIFEST_DATE,
} = loadAgentManifest();

export { AGENT_MANIFEST_DATE, AGENT_MANIFEST_VERSION, CONTROL_TOWER_AGENT_REGISTRY };
export const REGISTERED_AGENT_IDS = new Set(CONTROL_TOWER_AGENT_REGISTRY.map((a) => a.id));

export interface PolicyDef {
  id: string;
  name: string;
  description: string;
  category: string;
  enforced: boolean;
  blocking: boolean;
  appliesWhen: (riskLevel: string, action: string, agentId: string) => boolean;
  violationMessage: string;
}

export const DOMAIN_NAMESPACES = [
  'firestorm',
  'vessels',
  'terra',
  'lyte',
  'prism',
  'alloy',
] as const;

export const POLICIES: PolicyDef[] = [
  {
    id: 'pol-001',
    name: 'High-Risk Action Approval Gate',
    description:
      'Any AI action with risk level >= high requires explicit human approval before execution',
    category: 'authorization',
    enforced: true,
    blocking: true,
    appliesWhen: (riskLevel) => riskLevel === 'high' || riskLevel === 'critical',
    violationMessage: 'High-risk action requires human approval before execution',
  },
  {
    id: 'pol-002',
    name: 'Scope Certificate Expiry Enforcement',
    description:
      'Critical-risk actions from non-orchestrator agents require a valid scope certificate',
    category: 'identity',
    enforced: true,
    blocking: false,
    appliesWhen: (riskLevel, _action, agentId) =>
      riskLevel === 'critical' && agentId !== 'alloy-orchestrator',
    violationMessage:
      'Critical-risk action from non-orchestrator agent — scope certificate required',
  },
  {
    id: 'pol-003',
    name: 'Cross-Domain Data Isolation',
    description:
      'Actions referencing 2+ domain namespaces must route through the orchestrator mediator',
    category: 'data-governance',
    enforced: true,
    blocking: true,
    appliesWhen: (_riskLevel, action) => {
      const lower = action.toLowerCase();
      return DOMAIN_NAMESPACES.filter((d) => lower.includes(d)).length >= 2;
    },
    violationMessage:
      'Cross-domain action detected — must be routed through alloy-orchestrator mediator',
  },
  {
    id: 'pol-004',
    name: 'Decision Journal Completeness',
    description: 'Deep orchestration actions must be pre-approved and journaled before execution',
    category: 'audit',
    enforced: true,
    blocking: false,
    appliesWhen: (riskLevel, action) =>
      riskLevel === 'high' || riskLevel === 'critical' || action.includes('deep'),
    violationMessage: 'High-risk action should be pre-journaled — submit as proposed, then approve',
  },
  {
    id: 'pol-005',
    name: 'Pipeline Output Audit Trail',
    description: 'All pipeline executions must reference a registered pipeline configuration',
    category: 'audit',
    enforced: true,
    blocking: false,
    appliesWhen: (_riskLevel, action) =>
      action.startsWith('execute pipeline') &&
      !action.match(/terra-|vessels-|alloy-|lyte-|firestorm-/i),
    violationMessage: 'Pipeline execution should reference a registered pipeline template',
  },
];

export function evaluatePolicies(
  agentId: string,
  action: string,
  riskLevel: string,
  approvalGranted = false,
): {
  allowed: boolean;
  requiresApproval: boolean;
  blockedReason: string | null;
  violatedPolicies: string[];
} {
  const agentDef = CONTROL_TOWER_AGENT_REGISTRY.find((a) => a.id === agentId);
  const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  const maxRisk = agentDef?.scopeCertMaxRisk ?? 'medium';

  const exceedsScope = (riskOrder[riskLevel] ?? 0) > (riskOrder[maxRisk] ?? 1);
  const requiresApproval = riskLevel === 'high' || riskLevel === 'critical';
  const pol001Violated = requiresApproval && !approvalGranted;

  const violatedPolicies: string[] = [];
  let blockingViolation: string | null = null;

  if (exceedsScope) violatedPolicies.push('pol-001-scope');
  if (pol001Violated) {
    violatedPolicies.push('pol-001');
    blockingViolation ??= 'pol-001';
  }

  for (const policy of POLICIES) {
    if (
      policy.enforced &&
      policy.appliesWhen(riskLevel, action, agentId) &&
      !violatedPolicies.includes(policy.id)
    ) {
      violatedPolicies.push(policy.id);
      if (policy.blocking && !pol001Violated && !exceedsScope) {
        blockingViolation ??= policy.id;
      }
    }
  }

  const allowed = !exceedsScope && !pol001Violated && blockingViolation === null;
  const blockedReason = exceedsScope
    ? `Risk level '${riskLevel}' exceeds agent '${agentId}' scope maximum '${maxRisk}'`
    : pol001Violated
      ? `High-risk action requires explicit human approval (pol-001). Submit the decision, obtain approval, then call /decide/approve/:id to execute.`
      : blockingViolation
        ? (POLICIES.find((p) => p.id === blockingViolation)?.violationMessage ??
          `Policy ${blockingViolation} violated`)
        : null;

  return { allowed, requiresApproval, blockedReason, violatedPolicies };
}

export interface AgentPerformanceRecord {
  agentId: string;
  domain: string;
  totalDecisions: number;
  acceptedDecisions: number;
  avgConfidence: number;
  avgLatencyMs: number;
  totalTokenCost: number;
  proposedOptimizations: Array<{
    id: string;
    proposedAt: string;
    description: string;
    expectedImprovement: string;
    status: 'pending' | 'applied' | 'rejected';
  }>;
  lastUpdated: string;
}

export const agentPerformanceStore = new Map<string, AgentPerformanceRecord>();

export function getOrCreatePerf(agentId: string, domain: string): AgentPerformanceRecord {
  if (!agentPerformanceStore.has(agentId)) {
    agentPerformanceStore.set(agentId, {
      agentId,
      domain,
      totalDecisions: 0,
      acceptedDecisions: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
      totalTokenCost: 0,
      proposedOptimizations: [],
      lastUpdated: new Date().toISOString(),
    });
  }
  return agentPerformanceStore.get(agentId)!;
}

export function toRiskLevel(humanRisk: string): RiskLevel {
  const map: Record<string, RiskLevel> = { critical: 'P0', high: 'P1', medium: 'P2', low: 'P3' };
  return map[humanRisk] ?? 'P2';
}

export function riskLevelToDepth(riskLevel: string): 'deep' | 'standard' | 'shallow' {
  if (riskLevel === 'P0') return 'deep';
  if (riskLevel === 'P1') return 'standard';
  return 'shallow';
}

export function makeEvidenceRef(partial: {
  refId?: string;
  source: string;
  sourceType: AlloyDecisionEvidenceRef['sourceType'];
  content: string;
  relevanceScore?: number;
  objectId?: string | null;
}): AlloyDecisionEvidenceRef {
  return {
    refId: partial.refId ?? randomUUID(),
    source: partial.source,
    sourceType: partial.sourceType,
    content: partial.content.slice(0, 400),
    relevanceScore: partial.relevanceScore ?? 0.85,
    timestamp: new Date().toISOString(),
    objectId: partial.objectId ?? null,
  };
}

export function buildSignalBusSnapshot() {
  const events = agentEventBus.getHistory({ limit: 100 });
  const stats = agentEventBus.getStats();
  const domainSignals: Record<string, { count: number; lastSeverity: string; lastAt: number }> = {};
  for (const evt of events) {
    const d = evt.sourceDomain;
    if (!domainSignals[d]) domainSignals[d] = { count: 0, lastSeverity: 'info', lastAt: 0 };
    domainSignals[d]!.count++;
    domainSignals[d]!.lastSeverity = evt.severity;
    domainSignals[d]!.lastAt = Math.max(domainSignals[d]?.lastAt, evt.timestamp);
  }
  return {
    totalSignals: stats.totalPublished,
    activeSubscribers: stats.subscriptionCount,
    recentEvents: events.slice(0, 50),
    domainSummary: Object.entries(domainSignals).map(([domain, info]) => ({ domain, ...info })),
    eventsByType: stats.byType,
    historyWindowSize: stats.historySize,
  };
}

export function buildCompliancePosture() {
  const auditTrail = getKernelAuditTrail();
  const integrity = verifyAuditChainIntegrity();
  const last24h = auditTrail.filter((e) => new Date(e.timestamp).getTime() > Date.now() - 86400000);
  const blockedActions = last24h.filter((e) => e.authorizationResult === 'unauthorized').length;
  const escalatedActions = last24h.filter((e) => e.authorizationResult === 'escalated').length;
  const validatedActions = last24h.filter((e) => e.validationResult === 'passed').length;
  const totalActions = last24h.length;
  const overallScore =
    totalActions === 0
      ? 100
      : Math.round(
          100 - (blockedActions / totalActions) * 30 - (escalatedActions / totalActions) * 10,
        );
  return {
    overallComplianceScore: Math.max(overallScore, 50),
    auditChainIntegrity: integrity.valid,
    auditChainBrokenAt: integrity.brokenAt,
    totalAuditEntries: auditTrail.length,
    last24hSummary: {
      total: totalActions,
      authorized: validatedActions,
      blocked: blockedActions,
      escalated: escalatedActions,
    },
    policies: POLICIES.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      enforced: p.enforced,
      status: p.enforced ? 'compliant' : 'inactive',
    })),
    riskPosture: overallScore >= 90 ? 'low' : overallScore >= 70 ? 'medium' : 'high',
  };
}

export function buildAgentRegistryWithHealth() {
  const auditTrail = getKernelAuditTrail();
  return CONTROL_TOWER_AGENT_REGISTRY.map((agent) => {
    const agentAuditEntries = auditTrail.filter((e) => e.agentId.includes(agent.domain));
    const perf = agentPerformanceStore.get(agent.id);
    const successCount = agentAuditEntries.filter((e) => e.executionResult === 'success').length;
    const totalCount = agentAuditEntries.length;
    const successRate = totalCount > 0 ? successCount / totalCount : 1;
    return {
      ...agent,
      manifestVersion: AGENT_MANIFEST_VERSION,
      manifestDate: AGENT_MANIFEST_DATE,
      health: {
        status: successRate >= 0.9 ? 'healthy' : successRate >= 0.7 ? 'degraded' : 'unhealthy',
        successRate: parseFloat(successRate.toFixed(3)),
        totalExecutions: totalCount,
        avgLatencyMs: perf?.avgLatencyMs ?? 0,
        lastActivity: agentAuditEntries[0]?.timestamp ?? null,
      },
      performance: {
        totalDecisions: perf?.totalDecisions ?? 0,
        acceptanceRate:
          perf && perf.totalDecisions > 0
            ? parseFloat((perf.acceptedDecisions / perf.totalDecisions).toFixed(3))
            : null,
        avgConfidence: perf?.avgConfidence ?? null,
        totalTokenCost: perf?.totalTokenCost ?? 0,
      },
    };
  });
}
