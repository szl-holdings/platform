import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ACCENT, apiUrl, DOMAIN_COLORS, fetchJson, GUARDIAN_TIER_TO_AUTONOMY } from './shared';

type AutonomyTier = 'read-only' | 'advisory' | 'supervised' | 'autonomous';
type Env = 'production' | 'staging' | 'sandbox';

const TIER_META: Record<AutonomyTier, { color: string; label: string; description: string }> = {
  'read-only': {
    color: '#475569',
    label: 'Read-Only',
    description: 'Agent may only observe and surface data. No action or recommendation generation.',
  },
  advisory: {
    color: '#0ea5e9',
    label: 'Advisory',
    description:
      'Agent generates recommendations but all actions require explicit human approval before execution.',
  },
  supervised: {
    color: '#f59e0b',
    label: 'Supervised',
    description:
      'Agent executes low-risk actions autonomously; high-risk actions require human approval.',
  },
  autonomous: {
    color: '#22c55e',
    label: 'Autonomous',
    description:
      'Agent executes across the full action space with policy guardrails. Human can override at any time.',
  },
};

interface TierMatrixEntry {
  route: string;
  skill: string;
  domain: string;
  production: AutonomyTier;
  staging: AutonomyTier;
  sandbox: AutonomyTier;
  lastChanged: string;
  changedBy: string;
}

interface AllowlistEntry {
  category: 'model' | 'tool';
  name: string;
  domains: string[];
  tiers: AutonomyTier[];
  reason: string;
  approvedBy: string;
  approvedAt: string;
}

interface PendingApproval {
  id: string | number;
  type: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  domain: string;
  impact: 'low' | 'medium' | 'high';
  currentValue?: string;
  proposedValue?: string;
}

interface RollbackEvent {
  id: string;
  domain: string;
  route: string;
  reason: string;
  rolledBackBy: string;
  rolledBackAt: string;
  previousTier: AutonomyTier;
  revertedTier: AutonomyTier;
  incidentRef?: string;
}

interface ApiApproval {
  id: number;
  title?: string;
  description?: string;
  actionClass?: string;
  status: string;
  priority?: string;
  resourceType?: string;
  resourceId?: string;
  requestedById?: number;
  requestedByRole?: string;
  createdAt?: string;
  payload?: Record<string, unknown>;
}

interface ApiPolicy {
  id: number;
  name: string;
  description?: string;
  tier?: string;
  conditions?: unknown[];
  action?: string;
  priority?: number;
  enabled?: boolean;
  owner?: string;
  tags?: string[];
  allowedModels?: string[];
  allowedTools?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ApiRollbackEvent {
  id: number;
  actionId?: string;
  requestId?: string;
  agentId?: string;
  orgId?: number;
  tier?: string;
  triggeredBy?: string;
  reason?: string;
  status?: string;
  createdAt?: string;
  metadata?: Record<string, unknown> & {
    domain?: string;
    route?: string;
    previousTier?: string;
    revertedTier?: string;
    incidentRef?: string;
  };
}

interface ApiGuardianAction {
  id: number;
  agentId?: string;
  tier?: string;
  outcome?: string;
  toolId?: string;
  toolName?: string;
  traceId?: string;
  decision?: string;
  reason?: string;
  riskLevel?: string;
  createdAt?: string;
  orgId?: number;
}

const SEEDED_TIER_MATRIX: TierMatrixEntry[] = [
  {
    route: '/soc/triage',
    skill: 'threat_triage',
    domain: 'aegis',
    production: 'supervised',
    staging: 'autonomous',
    sandbox: 'autonomous',
    lastChanged: '2025-04-10',
    changedBy: 'James Okafor',
  },
  {
    route: '/soc/containment',
    skill: 'network_isolate',
    domain: 'aegis',
    production: 'supervised',
    staging: 'supervised',
    sandbox: 'autonomous',
    lastChanged: '2025-04-08',
    changedBy: 'James Okafor',
  },
  {
    route: '/soc/escalation',
    skill: 'soc_escalate',
    domain: 'aegis',
    production: 'autonomous',
    staging: 'autonomous',
    sandbox: 'autonomous',
    lastChanged: '2025-03-22',
    changedBy: 'System',
  },
  {
    route: '/soc/forensics',
    skill: 'forensic_scan',
    domain: 'aegis',
    production: 'supervised',
    staging: 'autonomous',
    sandbox: 'autonomous',
    lastChanged: '2025-04-01',
    changedBy: 'James Okafor',
  },
  {
    route: '/voyage/optimize',
    skill: 'voyage_plan_commit',
    domain: 'vessels',
    production: 'supervised',
    staging: 'autonomous',
    sandbox: 'autonomous',
    lastChanged: '2025-04-14',
    changedBy: 'Marcus Chen',
  },
  {
    route: '/voyage/route',
    skill: 'route_optimizer',
    domain: 'vessels',
    production: 'advisory',
    staging: 'supervised',
    sandbox: 'autonomous',
    lastChanged: '2025-04-14',
    changedBy: 'Marcus Chen',
  },
  {
    route: '/voyage/port-notify',
    skill: 'port_agent_notify',
    domain: 'vessels',
    production: 'autonomous',
    staging: 'autonomous',
    sandbox: 'autonomous',
    lastChanged: '2025-03-10',
    changedBy: 'System',
  },
  {
    route: '/portfolio/stress',
    skill: 'nav_calculator',
    domain: 'terra',
    production: 'supervised',
    staging: 'autonomous',
    sandbox: 'autonomous',
    lastChanged: '2025-04-05',
    changedBy: 'Sofia Reyes',
  },
  {
    route: '/portfolio/disposition',
    skill: 'disposition_ranker',
    domain: 'terra',
    production: 'advisory',
    staging: 'supervised',
    sandbox: 'autonomous',
    lastChanged: '2025-04-05',
    changedBy: 'Sofia Reyes',
  },
  {
    route: '/compliance/sar',
    skill: 'sar_generator',
    domain: 'prism',
    production: 'advisory',
    staging: 'supervised',
    sandbox: 'autonomous',
    lastChanged: '2025-03-30',
    changedBy: 'Priya Nair',
  },
  {
    route: '/compliance/breach-notify',
    skill: 'regulator_notify',
    domain: 'prism',
    production: 'advisory',
    staging: 'advisory',
    sandbox: 'supervised',
    lastChanged: '2025-03-28',
    changedBy: 'Priya Nair',
  },
  {
    route: '/cross-domain/data-export',
    skill: 'data_export',
    domain: 'cross-domain',
    production: 'read-only',
    staging: 'advisory',
    sandbox: 'supervised',
    lastChanged: '2025-04-16',
    changedBy: 'System',
  },
];

const SEEDED_ALLOWLIST: AllowlistEntry[] = [
  {
    category: 'model',
    name: 'gpt-4o-2024-11-20',
    domains: ['aegis', 'vessels', 'terra', 'prism', 'cross-domain'],
    tiers: ['advisory', 'supervised', 'autonomous'],
    reason: 'Primary production model — validated across all domains',
    approvedBy: 'Stephen Lutar',
    approvedAt: '2025-03-01',
  },
  {
    category: 'model',
    name: 'gpt-4o-finetuned',
    domains: ['aegis', 'vessels', 'cross-domain'],
    tiers: ['supervised', 'autonomous'],
    reason:
      'Fine-tuned on SOC and maritime domain data — higher precision for production autonomous tiers',
    approvedBy: 'James Okafor',
    approvedAt: '2025-04-01',
  },
  {
    category: 'model',
    name: 'claude-3-5-sonnet-20241022',
    domains: ['terra', 'prism', 'cross-domain'],
    tiers: ['advisory', 'supervised'],
    reason: 'Strong long-form artifact generation; approved for advisory and supervised tiers only',
    approvedBy: 'Priya Nair',
    approvedAt: '2025-03-15',
  },
  {
    category: 'tool',
    name: 'network_isolate',
    domains: ['aegis'],
    tiers: ['supervised', 'autonomous'],
    reason: 'Network segment isolation — gated to supervised+ only in production',
    approvedBy: 'James Okafor',
    approvedAt: '2025-03-20',
  },
  {
    category: 'tool',
    name: 'soc_escalate',
    domains: ['aegis'],
    tiers: ['advisory', 'supervised', 'autonomous'],
    reason: 'Escalation is low-risk and always traceable — approved for all active tiers',
    approvedBy: 'James Okafor',
    approvedAt: '2025-02-28',
  },
  {
    category: 'tool',
    name: 'voyage_plan_commit',
    domains: ['vessels'],
    tiers: ['supervised', 'autonomous'],
    reason: 'Commits voyage plan changes — requires supervised+ approval flow',
    approvedBy: 'Marcus Chen',
    approvedAt: '2025-03-10',
  },
  {
    category: 'tool',
    name: 'regulator_notify',
    domains: ['prism'],
    tiers: ['advisory'],
    reason: 'External regulatory contact — restricted to advisory only; human must send',
    approvedBy: 'Priya Nair',
    approvedAt: '2025-03-28',
  },
  {
    category: 'tool',
    name: 'data_export',
    domains: ['cross-domain'],
    tiers: [],
    reason: 'Blocked in all tiers pending data governance policy finalization',
    approvedBy: 'Priya Nair',
    approvedAt: '2025-04-16',
  },
];

const SEEDED_PENDING_APPROVALS: PendingApproval[] = [
  {
    id: 'req-001',
    type: 'tier-change',
    description: 'Upgrade /voyage/route autonomous tier from advisory → supervised in production',
    requestedBy: 'Marcus Chen',
    requestedAt: '2025-04-16T09:00:00Z',
    domain: 'vessels',
    impact: 'medium',
    currentValue: 'advisory',
    proposedValue: 'supervised',
  },
  {
    id: 'req-002',
    type: 'model-add',
    description: 'Add claude-3-5-sonnet-20241022 to aegis domain for supervised tier',
    requestedBy: 'James Okafor',
    requestedAt: '2025-04-15T14:30:00Z',
    domain: 'aegis',
    impact: 'medium',
  },
  {
    id: 'req-003',
    type: 'allowlist-modify',
    description:
      'Enable regulator_notify tool for supervised tier in prism domain (currently advisory-only)',
    requestedBy: 'Priya Nair',
    requestedAt: '2025-04-14T11:00:00Z',
    domain: 'prism',
    impact: 'high',
    currentValue: 'advisory only',
    proposedValue: 'advisory + supervised',
  },
];

const SEEDED_ROLLBACK_EVENTS: RollbackEvent[] = [
  {
    id: 'rb-001',
    domain: 'aegis',
    route: '/soc/containment',
    reason:
      'Agent incorrectly isolated a healthy network segment during false positive triage — 3 services impacted for 12min',
    rolledBackBy: 'James Okafor',
    rolledBackAt: '2025-04-09T16:44:00Z',
    previousTier: 'autonomous',
    revertedTier: 'supervised',
    incidentRef: 'INC-2025-19112',
  },
  {
    id: 'rb-002',
    domain: 'vessels',
    route: '/voyage/route',
    reason:
      'Agent recommended Malacca route despite elevated piracy advisory not yet reflected in tool feed — captain override required',
    rolledBackBy: 'Marcus Chen',
    rolledBackAt: '2025-04-14T18:10:00Z',
    previousTier: 'supervised',
    revertedTier: 'advisory',
    incidentRef: 'INC-2025-19780',
  },
  {
    id: 'rb-003',
    domain: 'cross-domain',
    route: '/cross-domain/data-export',
    reason:
      'Data export tool executed against unvalidated tenant scope — potential cross-tenant data exposure, blocked immediately',
    rolledBackBy: 'System',
    rolledBackAt: '2025-04-16T07:22:00Z',
    previousTier: 'supervised',
    revertedTier: 'read-only',
    incidentRef: 'SEC-2025-0041',
  },
];

function apiRollbackEventToRollback(e: ApiRollbackEvent): RollbackEvent {
  const md = e.metadata ?? {};
  const tierFromApi = GUARDIAN_TIER_TO_AUTONOMY[e.tier ?? ''] as AutonomyTier | undefined;
  const previousTier =
    (GUARDIAN_TIER_TO_AUTONOMY[md.previousTier ?? ''] as AutonomyTier | undefined) ??
    tierFromApi ??
    'autonomous';
  const revertedTier =
    (GUARDIAN_TIER_TO_AUTONOMY[md.revertedTier ?? ''] as AutonomyTier | undefined) ?? 'supervised';
  const domain = (md.domain ?? 'cross-domain').toLowerCase();
  const route =
    md.route ?? (e.actionId ? `/action/${e.actionId}` : `/agent/${e.agentId ?? 'unknown'}`);
  return {
    id: `rb-${e.id}`,
    domain,
    route,
    reason: e.reason ?? `Rollback event #${e.id}`,
    rolledBackBy: e.triggeredBy ?? `Agent #${e.agentId ?? '?'}`,
    rolledBackAt: e.createdAt ?? new Date().toISOString(),
    previousTier,
    revertedTier,
    incidentRef: md.incidentRef ?? `RB-${String(e.id).padStart(7, '0')}`,
  };
}

function apiApprovalToPending(a: ApiApproval): PendingApproval {
  const domain = (a.payload?.domain as string) ?? a.resourceType ?? 'cross-domain';
  const priority = a.priority ?? 'medium';
  return {
    id: a.id,
    type: a.actionClass ?? 'policy-change',
    description: a.title ?? a.description ?? `Approval request #${a.id}`,
    requestedBy: a.requestedByRole ?? `User #${a.requestedById ?? '?'}`,
    requestedAt: a.createdAt ?? new Date().toISOString(),
    domain: domain.toLowerCase(),
    impact:
      priority === 'critical' || priority === 'high'
        ? 'high'
        : priority === 'medium'
          ? 'medium'
          : 'low',
  };
}

function TierPill({ tier }: { tier: AutonomyTier }) {
  const { color, label } = TIER_META[tier];
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        color,
        background: `${color}18`,
        padding: '2px 7px',
        borderRadius: 4,
        border: `1px solid ${color}40`,
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      {label.toUpperCase()}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: 'low' | 'medium' | 'high' }) {
  const colors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
  const c = colors[impact];
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: c,
        background: `${c}18`,
        padding: '2px 7px',
        borderRadius: 4,
        border: `1px solid ${c}40`,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {impact} impact
    </span>
  );
}

export default function CognitivePolicies() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'allowlists' | 'approvals' | 'rollbacks'>(
    'matrix',
  );
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterEnv, setFilterEnv] = useState<Env>('production');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | number | null>(null);
  const qc = useQueryClient();

  const approvalsQuery = useStandardQuery<{ data: ApiApproval[]; meta?: { total?: number } }>({
    queryKey: ['cognitive', 'approvals', 'pending'],
    queryFn: () => fetchJson(apiUrl('/approvals?status=pending&limit=50')),
    retry: 1,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const policiesQuery = useStandardQuery<{ data: ApiPolicy[]; meta?: { count?: number } }>({
    queryKey: ['cognitive', 'policies'],
    queryFn: () => fetchJson(apiUrl('/policies?limit=50')),
    retry: 1,
    staleTime: 120_000,
  });

  const rollbackEventsQuery = useStandardQuery<{
    data: ApiRollbackEvent[];
    meta?: { total?: number };
  }>({
    queryKey: ['cognitive', 'rollback-events'],
    queryFn: () => fetchJson(apiUrl('/rollback-events?limit=50')),
    retry: 1,
    staleTime: 60_000,
  });

  const actionsQuery = useStandardQuery<{ data: ApiGuardianAction[]; meta?: { total?: number } }>({
    queryKey: ['cognitive', 'actions'],
    queryFn: () => fetchJson(apiUrl('/actions?limit=20')),
    retry: 1,
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

  const reviewMutation = useStandardMutation({
    mutationFn: ({ id, decision }: { id: number; decision: 'approved' | 'rejected' }) =>
      fetchJson<unknown>(apiUrl(`/approvals/${id}/review`), {
        method: 'POST',
        body: JSON.stringify({ decision }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cognitive', 'approvals'] });
      setReviewingId(null);
    },
    onError: () => {
      setReviewingId(null);
    },
  });

  const apiApprovals = (approvalsQuery.data?.data ?? []).map(apiApprovalToPending);
  const pendingApprovals: PendingApproval[] =
    apiApprovals.length > 0 ? apiApprovals : SEEDED_PENDING_APPROVALS;
  const isLiveApprovals = apiApprovals.length > 0;

  const livePolicies: ApiPolicy[] = policiesQuery.data?.data ?? [];
  const isLivePolicies = livePolicies.length > 0;

  const KNOWN_DOMAINS = ['aegis', 'vessels', 'terra', 'prism', 'pulse'];

  const liveTierMatrix: TierMatrixEntry[] = livePolicies
    .filter((p) => p.enabled !== false)
    .map((p) => {
      const autonomyTier =
        (GUARDIAN_TIER_TO_AUTONOMY[p.tier ?? ''] as AutonomyTier | undefined) ?? 'supervised';
      const domain = (p.tags ?? []).find((t) => KNOWN_DOMAINS.includes(t)) ?? 'cross-domain';
      return {
        route: p.name,
        skill: p.action ?? 'guardian',
        domain,
        production: autonomyTier,
        staging: autonomyTier,
        sandbox: 'autonomous' as AutonomyTier,
        lastChanged: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—',
        changedBy: p.owner ?? 'system',
      } satisfies TierMatrixEntry;
    });

  const tierMatrix: TierMatrixEntry[] =
    liveTierMatrix.length > 0 ? liveTierMatrix : SEEDED_TIER_MATRIX;
  const isLiveTierMatrix = liveTierMatrix.length > 0;

  const liveModelAllowlist: AllowlistEntry[] = Array.from(
    new Set(livePolicies.flatMap((p) => p.allowedModels ?? [])),
  ).map((modelName) => {
    const sourcePolicy = livePolicies.find((p) => (p.allowedModels ?? []).includes(modelName));
    return {
      category: 'model' as const,
      name: modelName,
      domains: livePolicies
        .filter((p) => (p.allowedModels ?? []).includes(modelName))
        .flatMap((p) => (p.tags ?? []).filter((t) => KNOWN_DOMAINS.includes(t))),
      tiers: [] as AutonomyTier[],
      reason: sourcePolicy?.description ?? `Allowed by policy: ${sourcePolicy?.name ?? 'guardian'}`,
      approvedBy: sourcePolicy?.owner ?? 'system',
      approvedAt: sourcePolicy?.createdAt
        ? new Date(sourcePolicy.createdAt).toLocaleDateString()
        : '—',
    } satisfies AllowlistEntry;
  });

  const liveToolAllowlist: AllowlistEntry[] = Array.from(
    new Set(livePolicies.flatMap((p) => p.allowedTools ?? [])),
  ).map((toolName) => {
    const sourcePolicy = livePolicies.find((p) => (p.allowedTools ?? []).includes(toolName));
    return {
      category: 'tool' as const,
      name: toolName,
      domains: livePolicies
        .filter((p) => (p.allowedTools ?? []).includes(toolName))
        .flatMap((p) => (p.tags ?? []).filter((t) => KNOWN_DOMAINS.includes(t))),
      tiers: [] as AutonomyTier[],
      reason: sourcePolicy?.description ?? `Allowed by policy: ${sourcePolicy?.name ?? 'guardian'}`,
      approvedBy: sourcePolicy?.owner ?? 'system',
      approvedAt: sourcePolicy?.createdAt
        ? new Date(sourcePolicy.createdAt).toLocaleDateString()
        : '—',
    } satisfies AllowlistEntry;
  });

  const hasLiveAllowlistData = liveModelAllowlist.length > 0 || liveToolAllowlist.length > 0;
  const activeAllowlistModel = hasLiveAllowlistData
    ? liveModelAllowlist
    : SEEDED_ALLOWLIST.filter((e) => e.category === 'model');
  const activeAllowlistTool = hasLiveAllowlistData
    ? liveToolAllowlist
    : SEEDED_ALLOWLIST.filter((e) => e.category === 'tool');

  const apiRollbacks = (rollbackEventsQuery.data?.data ?? []).map(apiRollbackEventToRollback);
  const rollbackEvents: RollbackEvent[] =
    apiRollbacks.length > 0 ? apiRollbacks : SEEDED_ROLLBACK_EVENTS;
  const isLiveIncidents = apiRollbacks.length > 0;

  const liveActions: ApiGuardianAction[] = actionsQuery.data?.data ?? [];
  const isLiveActions = liveActions.length > 0;

  const domains = ['all', ...Array.from(new Set(tierMatrix.map((r) => r.domain)))];
  const filteredMatrix = tierMatrix.filter(
    (r) => filterDomain === 'all' || r.domain === filterDomain,
  );

  const tierCounts = (['read-only', 'advisory', 'supervised', 'autonomous'] as AutonomyTier[]).map(
    (tier) => ({
      tier,
      count: tierMatrix.filter((r) => r[filterEnv] === tier).length,
    }),
  );

  return (
    <div
      style={{
        background: '#080c14',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Policy Console</span>
            <span
              style={{
                fontSize: 11,
                color: ACCENT,
                background: `${ACCENT}18`,
                padding: '2px 10px',
                borderRadius: 20,
                border: `1px solid ${ACCENT}40`,
                fontWeight: 600,
              }}
            >
              COGNITIVE
            </span>
            {pendingApprovals.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: '#f59e0b',
                  background: '#f59e0b18',
                  padding: '2px 10px',
                  borderRadius: 20,
                  border: '1px solid #f59e0b40',
                  fontWeight: 600,
                }}
              >
                {pendingApprovals.length} PENDING APPROVAL{pendingApprovals.length > 1 ? 'S' : ''}
              </span>
            )}
            {approvalsQuery.isLoading && (
              <span style={{ fontSize: 10, color: '#475569' }}>Loading approvals…</span>
            )}
            {isLiveApprovals && (
              <span
                style={{
                  fontSize: 10,
                  color: '#22c55e',
                  background: '#22c55e15',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                ● LIVE
              </span>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Autonomy tier matrix in force per route, skill, and environment — plus model/tool
            allowlists, pending approval queue, and recent rollback events.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {tierCounts.map((tc) => {
            const { color, label } = TIER_META[tc.tier];
            return (
              <div
                key={tc.tier}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: '14px 18px',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{tc.count}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label} routes</div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#334155',
                    marginTop: 2,
                    textTransform: 'capitalize',
                  }}
                >
                  {filterEnv}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 20,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            padding: 4,
            width: 'fit-content',
          }}
        >
          {(['matrix', 'allowlists', 'approvals', 'rollbacks'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: activeTab === t ? ACCENT : 'transparent',
                color: activeTab === t ? '#fff' : '#64748b',
                border: 'none',
                borderRadius: 6,
                padding: '7px 18px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t === 'matrix'
                ? 'Tier Matrix'
                : t === 'allowlists'
                  ? 'Allowlists'
                  : t === 'approvals'
                    ? `Approvals (${pendingApprovals.length})`
                    : `Rollbacks (${rollbackEvents.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'matrix' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              {policiesQuery.isLoading && (
                <span style={{ fontSize: 10, color: '#475569' }}>Loading tier matrix…</span>
              )}
              {isLiveTierMatrix && (
                <span
                  style={{
                    fontSize: 10,
                    color: '#22c55e',
                    background: '#22c55e15',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  ● LIVE — {liveTierMatrix.length} policies from /api/policies
                </span>
              )}
              {!isLiveTierMatrix && !policiesQuery.isLoading && (
                <span style={{ fontSize: 10, color: '#475569' }}>
                  Showing sample tier matrix — no policies defined yet
                </span>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 14,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {domains.map((d) => {
                  const dc = DOMAIN_COLORS[d] ?? DOMAIN_COLORS.default;
                  return (
                    <button
                      key={d}
                      onClick={() => setFilterDomain(d)}
                      style={{
                        background: filterDomain === d ? dc : 'rgba(255,255,255,0.05)',
                        color: filterDomain === d ? '#fff' : '#94a3b8',
                        border: 'none',
                        borderRadius: 5,
                        padding: '4px 10px',
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginLeft: 12, display: 'flex', gap: 4 }}>
                {(['production', 'staging', 'sandbox'] as Env[]).map((env) => (
                  <button
                    key={env}
                    onClick={() => setFilterEnv(env)}
                    style={{
                      background:
                        filterEnv === env ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                      color: filterEnv === env ? '#e2e8f0' : '#475569',
                      border: `1px solid ${filterEnv === env ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 5,
                      padding: '4px 10px',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr 90px 90px 90px 1fr 1fr',
                gap: 8,
                padding: '8px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 4,
              }}
            >
              {[
                'Route',
                'Skill',
                'Domain',
                'Production',
                'Staging',
                'Sandbox',
                'Last Changed',
                'By',
              ].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 9,
                    color: '#475569',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {filteredMatrix.map((row) => {
              const dc = DOMAIN_COLORS[row.domain] ?? DOMAIN_COLORS.default;
              const isExpanded = expandedRow === row.route;
              return (
                <React.Fragment key={row.route}>
                  <div
                    onClick={() => setExpandedRow(isExpanded ? null : row.route)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 1fr 1fr 90px 90px 90px 1fr 1fr',
                      gap: 8,
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: isExpanded ? `${ACCENT}06` : 'transparent',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#e2e8f0', fontFamily: 'monospace' }}>
                      {row.route}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                      {row.skill}
                    </div>
                    <div style={{ fontSize: 10, color: dc, fontWeight: 700 }}>
                      {row.domain.toUpperCase()}
                    </div>
                    <TierPill tier={row.production} />
                    <TierPill tier={row.staging} />
                    <TierPill tier={row.sandbox} />
                    <div style={{ fontSize: 10, color: '#475569' }}>{row.lastChanged}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{row.changedBy}</div>
                  </div>
                  {isExpanded && (
                    <div
                      style={{
                        padding: '10px 16px',
                        background: `${ACCENT}06`,
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <div
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}
                      >
                        {(['production', 'staging', 'sandbox'] as Env[]).map((env) => {
                          const tier = row[env];
                          const { color, label, description } = TIER_META[tier];
                          return (
                            <div
                              key={env}
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 6,
                                padding: '10px 12px',
                                border: `1px solid ${color}30`,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 9,
                                  color: '#475569',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                  marginBottom: 4,
                                }}
                              >
                                {env}
                              </div>
                              <div
                                style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}
                              >
                                {label}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                                {description}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {activeTab === 'allowlists' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              {policiesQuery.isLoading && (
                <span style={{ fontSize: 10, color: '#475569' }}>Loading allowlists…</span>
              )}
              {hasLiveAllowlistData && (
                <span
                  style={{
                    fontSize: 10,
                    color: '#22c55e',
                    background: '#22c55e15',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  ● LIVE — /api/policies allowedModels + allowedTools
                </span>
              )}
              {!hasLiveAllowlistData && !policiesQuery.isLoading && (
                <span style={{ fontSize: 10, color: '#475569' }}>
                  Showing sample allowlists — no policies with allowedModels/allowedTools yet
                </span>
              )}
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}
            >
              {(['model', 'tool'] as const).map((cat) => {
                const entries = cat === 'model' ? activeAllowlistModel : activeAllowlistTool;
                return (
                  <div key={cat}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#94a3b8',
                        marginBottom: 12,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {cat === 'model' ? 'Model Allowlist' : 'Tool Allowlist'}
                    </div>
                    {entries.length === 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#334155',
                          padding: '12px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 8,
                          border: '1px dashed rgba(255,255,255,0.07)',
                        }}
                      >
                        No {cat} entries in active policies yet
                      </div>
                    )}
                    {entries.map((entry) => {
                      const isBlocked = entry.tiers.length === 0;
                      return (
                        <div
                          key={entry.name}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isBlocked ? '#ef444430' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: 8,
                            padding: '12px 14px',
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: isBlocked ? '#ef4444' : '#e2e8f0',
                                fontFamily: 'monospace',
                              }}
                            >
                              {entry.name}
                            </span>
                            {isBlocked && (
                              <span
                                style={{
                                  fontSize: 9,
                                  color: '#ef4444',
                                  background: '#ef444418',
                                  padding: '1px 6px',
                                  borderRadius: 3,
                                  fontWeight: 700,
                                }}
                              >
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div
                            style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}
                          >
                            {entry.domains.map((d) => {
                              const dc = DOMAIN_COLORS[d] ?? DOMAIN_COLORS.default;
                              return (
                                <span
                                  key={d}
                                  style={{
                                    fontSize: 9,
                                    color: dc,
                                    background: `${dc}15`,
                                    padding: '1px 5px',
                                    borderRadius: 3,
                                    fontWeight: 700,
                                  }}
                                >
                                  {d.toUpperCase()}
                                </span>
                              );
                            })}
                          </div>
                          {entry.tiers.length > 0 && (
                            <div
                              style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}
                            >
                              {entry.tiers.map((t) => (
                                <TierPill key={t} tier={t} />
                              ))}
                            </div>
                          )}
                          {entry.reason && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#475569',
                                lineHeight: 1.4,
                                marginBottom: 6,
                              }}
                            >
                              {entry.reason}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: '#334155' }}>
                            Approved by {entry.approvedBy} · {entry.approvedAt}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Governance Policies
                </div>
                {policiesQuery.isLoading && (
                  <span style={{ fontSize: 10, color: '#475569' }}>Loading…</span>
                )}
                {isLivePolicies && (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#22c55e',
                      background: '#22c55e15',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    ● LIVE — /api/policies
                  </span>
                )}
                {!isLivePolicies && !policiesQuery.isLoading && (
                  <span style={{ fontSize: 10, color: '#475569' }}>
                    No policies defined · Create via{' '}
                    <code style={{ fontSize: 9 }}>POST /api/policies</code>
                  </span>
                )}
              </div>
              {isLivePolicies ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {livePolicies.map((policy) => {
                    const isEnabled = policy.enabled !== false;
                    const domainTag = (policy.tags ?? []).find((t) => KNOWN_DOMAINS.includes(t));
                    const dc = domainTag
                      ? (DOMAIN_COLORS[domainTag] ?? DOMAIN_COLORS.default)
                      : ACCENT;
                    return (
                      <div
                        key={policy.id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isEnabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                          borderRadius: 8,
                          padding: '12px 14px',
                          opacity: isEnabled ? 1 : 0.6,
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                            {policy.name}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              color: isEnabled ? '#22c55e' : '#475569',
                              background: isEnabled ? '#22c55e18' : 'rgba(255,255,255,0.05)',
                              padding: '1px 6px',
                              borderRadius: 3,
                              fontWeight: 700,
                            }}
                          >
                            {isEnabled ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                          {policy.tier && (
                            <span
                              style={{
                                fontSize: 9,
                                color: ACCENT,
                                background: `${ACCENT}15`,
                                padding: '1px 6px',
                                borderRadius: 3,
                                fontWeight: 600,
                              }}
                            >
                              {policy.tier}
                            </span>
                          )}
                          {policy.action && (
                            <span
                              style={{
                                fontSize: 9,
                                color: '#64748b',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1px 6px',
                                borderRadius: 3,
                              }}
                            >
                              {policy.action}
                            </span>
                          )}
                          {domainTag && (
                            <span
                              style={{
                                fontSize: 9,
                                color: dc,
                                background: `${dc}15`,
                                padding: '1px 6px',
                                borderRadius: 3,
                                fontWeight: 600,
                              }}
                            >
                              {domainTag.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {policy.description && (
                          <div
                            style={{
                              fontSize: 11,
                              color: '#475569',
                              lineHeight: 1.4,
                              marginBottom: 4,
                            }}
                          >
                            {policy.description}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: '#334155' }}>
                          Priority {policy.priority ?? '—'} · Owner: {policy.owner ?? 'system'}
                          {policy.updatedAt &&
                            ` · Updated ${new Date(policy.updatedAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    padding: '20px',
                    textAlign: 'center',
                    color: '#334155',
                    fontSize: 12,
                    border: '1px dashed rgba(255,255,255,0.07)',
                  }}
                >
                  No governance policies in database — POST to /api/policies to define model-usage
                  rules, compliance constraints, and cost guards
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div>
            {!isLiveApprovals && (
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
                Showing sample requests · live data from{' '}
                <code style={{ fontSize: 10, color: '#64748b' }}>/api/approvals</code>
              </div>
            )}
            {pendingApprovals.length === 0 ? (
              <div
                style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontSize: 13 }}
              >
                ✓ No pending policy change approvals
              </div>
            ) : (
              pendingApprovals.map((req) => {
                const dc = DOMAIN_COLORS[req.domain] ?? DOMAIN_COLORS.default;
                const isReviewing = reviewingId === req.id;
                return (
                  <div
                    key={String(req.id)}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: '16px 18px',
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 16,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: '#475569',
                              background: 'rgba(255,255,255,0.05)',
                              padding: '1px 7px',
                              borderRadius: 3,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {req.type.replace(/-/g, ' ')}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              color: dc,
                              background: `${dc}15`,
                              padding: '1px 6px',
                              borderRadius: 3,
                              fontWeight: 700,
                            }}
                          >
                            {req.domain.toUpperCase()}
                          </span>
                          <ImpactBadge impact={req.impact} />
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#e2e8f0',
                            marginBottom: 4,
                          }}
                        >
                          {req.description}
                        </div>
                        <div style={{ fontSize: 11, color: '#475569' }}>
                          Requested by <span style={{ color: '#94a3b8' }}>{req.requestedBy}</span> ·{' '}
                          {new Date(req.requestedAt).toLocaleString()}
                        </div>
                      </div>
                      {req.currentValue && req.proposedValue && (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
                        >
                          <span style={{ fontSize: 11, color: '#64748b' }}>{req.currentValue}</span>
                          <span style={{ color: '#334155', fontSize: 14 }}>→</span>
                          <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>
                            {req.proposedValue}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        paddingTop: 10,
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <button
                        disabled={isReviewing || reviewMutation.isPending}
                        onClick={() => {
                          if (typeof req.id === 'number') {
                            setReviewingId(req.id);
                            reviewMutation.mutate({ id: req.id, decision: 'approved' });
                          }
                        }}
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: isReviewing ? 'not-allowed' : 'pointer',
                          opacity: isReviewing ? 0.7 : 1,
                        }}
                      >
                        {isReviewing ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        disabled={isReviewing || reviewMutation.isPending}
                        onClick={() => {
                          if (typeof req.id === 'number') {
                            setReviewingId(req.id);
                            reviewMutation.mutate({ id: req.id, decision: 'rejected' });
                          }
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: '#ef4444',
                          border: '1px solid #ef444430',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: isReviewing ? 'not-allowed' : 'pointer',
                          opacity: isReviewing ? 0.7 : 1,
                        }}
                      >
                        Reject
                      </button>
                      <button
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          color: '#64748b',
                          border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Request More Info
                      </button>
                      {reviewMutation.isError && reviewingId === req.id && (
                        <span style={{ fontSize: 10, color: '#f59e0b', alignSelf: 'center' }}>
                          ⚠ Action requires elevated role in production
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'rollbacks' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {rollbackEventsQuery.isLoading && (
                <span style={{ fontSize: 10, color: '#475569' }}>Loading rollback events…</span>
              )}
              {isLiveIncidents && (
                <span
                  style={{
                    fontSize: 10,
                    color: '#22c55e',
                    background: '#22c55e15',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  ● LIVE — /api/rollback-events
                </span>
              )}
              {!isLiveIncidents && !rollbackEventsQuery.isLoading && (
                <span style={{ fontSize: 10, color: '#475569' }}>
                  Showing sample rollback events
                </span>
              )}
            </div>
            {rollbackEvents.map((rb) => {
              const dc = DOMAIN_COLORS[rb.domain] ?? DOMAIN_COLORS.default;
              const prevMeta = TIER_META[rb.previousTier];
              const revertMeta = TIER_META[rb.revertedTier];
              return (
                <div
                  key={rb.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderLeft: '3px solid #ef4444',
                    borderRadius: 10,
                    padding: '16px 18px',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#e2e8f0',
                            fontFamily: 'monospace',
                          }}
                        >
                          {rb.route}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: dc,
                            background: `${dc}15`,
                            padding: '1px 6px',
                            borderRadius: 3,
                            fontWeight: 700,
                          }}
                        >
                          {rb.domain.toUpperCase()}
                        </span>
                        {rb.incidentRef && (
                          <span
                            style={{
                              fontSize: 9,
                              color: '#ef4444',
                              background: '#ef444418',
                              padding: '1px 6px',
                              borderRadius: 3,
                              fontFamily: 'monospace',
                            }}
                          >
                            {rb.incidentRef}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: '#94a3b8',
                          margin: '0 0 6px',
                          lineHeight: 1.5,
                        }}
                      >
                        {rb.reason}
                      </p>
                      <div style={{ fontSize: 10, color: '#475569' }}>
                        Rolled back by <span style={{ color: '#64748b' }}>{rb.rolledBackBy}</span> ·{' '}
                        {new Date(rb.rolledBackAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#475569', marginBottom: 3 }}>Was</div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: prevMeta.color,
                            background: `${prevMeta.color}18`,
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          {prevMeta.label.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ color: '#334155', fontSize: 16 }}>→</span>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: '#475569', marginBottom: 3 }}>
                          Reverted to
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: revertMeta.color,
                            background: `${revertMeta.color}18`,
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          {revertMeta.label.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                paddingTop: 20,
                marginTop: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Guardian Action Feed
                </div>
                {actionsQuery.isLoading && (
                  <span style={{ fontSize: 10, color: '#475569' }}>Loading…</span>
                )}
                {isLiveActions && (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#22c55e',
                      background: '#22c55e15',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    ● LIVE — /api/actions
                  </span>
                )}
                {!isLiveActions && !actionsQuery.isLoading && (
                  <span style={{ fontSize: 10, color: '#475569' }}>
                    No guardian actions recorded yet
                  </span>
                )}
              </div>
              {isLiveActions ? (
                <div>
                  {liveActions.map((action) => {
                    const outcomeColor =
                      action.outcome === 'allow'
                        ? '#22c55e'
                        : action.outcome === 'block'
                          ? '#ef4444'
                          : '#f59e0b';
                    return (
                      <div
                        key={action.id}
                        style={{
                          display: 'flex',
                          gap: 12,
                          alignItems: 'flex-start',
                          padding: '10px 14px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 8,
                          marginBottom: 8,
                          border: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: outcomeColor,
                            background: `${outcomeColor}15`,
                            padding: '2px 8px',
                            borderRadius: 4,
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          {(action.outcome ?? 'unknown').toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}
                          >
                            {action.toolName && (
                              <span
                                style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}
                              >
                                {action.toolName}
                              </span>
                            )}
                            {action.tier && (
                              <span
                                style={{
                                  fontSize: 9,
                                  color: ACCENT,
                                  background: `${ACCENT}15`,
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                }}
                              >
                                {action.tier}
                              </span>
                            )}
                            {action.riskLevel && (
                              <span
                                style={{
                                  fontSize: 9,
                                  color: '#f59e0b',
                                  background: '#f59e0b15',
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                }}
                              >
                                {action.riskLevel}
                              </span>
                            )}
                          </div>
                          {action.reason && (
                            <div style={{ fontSize: 11, color: '#64748b' }}>{action.reason}</div>
                          )}
                          {action.traceId && (
                            <div
                              style={{
                                fontSize: 10,
                                color: '#334155',
                                fontFamily: 'monospace',
                                marginTop: 2,
                              }}
                            >
                              trace: {action.traceId}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: '#334155', flexShrink: 0 }}>
                          {action.createdAt ? new Date(action.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    padding: '20px',
                    textAlign: 'center',
                    color: '#334155',
                    fontSize: 12,
                    border: '1px dashed rgba(255,255,255,0.07)',
                  }}
                >
                  Guardian actions are recorded when the agent engine runs policy checks on tool
                  calls. No actions have been recorded yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
