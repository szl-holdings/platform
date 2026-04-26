import { useStandardQuery } from '@szl-holdings/api-client-react';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ACCENT, apiUrl, DOMAIN_COLORS, fetchJson } from './shared';

type AutonomyTier = 'read-only' | 'advisory' | 'supervised' | 'autonomous';
type SimOutcome = 'allowed' | 'approval' | 'blocked';

const TIER_RANK: Record<AutonomyTier, number> = {
  'read-only': 0,
  advisory: 1,
  supervised: 2,
  autonomous: 3,
};

const TIER_COLOR: Record<AutonomyTier, string> = {
  'read-only': '#475569',
  advisory: '#0ea5e9',
  supervised: '#f59e0b',
  autonomous: '#22c55e',
};

const OUTCOME_META: Record<SimOutcome, { color: string; label: string }> = {
  allowed: { color: '#22c55e', label: 'Allowed' },
  approval: { color: '#f59e0b', label: 'Approval Req.' },
  blocked: { color: '#ef4444', label: 'Blocked' },
};

interface PolicyChange {
  id: string;
  title: string;
  rationale: string;
  domain: string;
  route: string;
  fromTier: AutonomyTier;
  toTier: AutonomyTier;
  toolDenylistAdds: string[];
  costCeilingUsd?: number;
  riskCategory: 'tightening' | 'loosening' | 'scoped';
}

interface HistoricalTrace {
  id: string;
  label: string;
  domain: string;
  route: string;
  startedAt: string;
  costUsd: number;
  latencyMs: number;
  toolsUsed: string[];
  effectiveTier: AutonomyTier;
  originalOutcome: SimOutcome;
  riskScore: number;
}

interface SimResult {
  traceId: string;
  before: SimOutcome;
  after: SimOutcome;
  reason: string;
  riskDelta: number;
}

const POLICY_CHANGES: PolicyChange[] = [
  {
    id: 'pc-aegis-ransomware-tighten',
    title: 'Demote PARAGON containment routes to Supervised',
    rationale:
      'Q2 audit flagged 3 false-positive containments. Add human-in-loop for endpoint isolation > 5 hosts.',
    domain: 'aegis',
    route: 'aegis.containment.lateral-movement',
    fromTier: 'autonomous',
    toTier: 'supervised',
    toolDenylistAdds: ['endpoint_mass_isolate'],
    costCeilingUsd: 0.05,
    riskCategory: 'tightening',
  },
  {
    id: 'pc-vessels-bunker-loosen',
    title: 'Promote Vessels bunker-fuel reroute to Autonomous',
    rationale:
      'Reroute decisions are reversible within 90 min. 47 supervised approvals in last 30d had 100% approval rate.',
    domain: 'vessels',
    route: 'vessels.bunker.reroute',
    fromTier: 'supervised',
    toTier: 'autonomous',
    toolDenylistAdds: [],
    costCeilingUsd: 0.1,
    riskCategory: 'loosening',
  },
  {
    id: 'pc-prism-discovery-scope',
    title: 'PRISM discovery: ban summarization tool over privileged docs',
    rationale:
      'Privilege-flag breach risk. Block llm_summarize when document.privilege=true; require human review.',
    domain: 'prism',
    route: 'prism.discovery.privilege-review',
    fromTier: 'advisory',
    toTier: 'advisory',
    toolDenylistAdds: ['llm_summarize_privileged'],
    riskCategory: 'scoped',
  },
  {
    id: 'pc-terra-valuation-tighten',
    title: 'Terra valuation: cap autonomous to <$25M deals',
    rationale: 'Above $25M, require partner sign-off. 12 above-threshold deals in 90d.',
    domain: 'terra',
    route: 'terra.valuation.deal-screen',
    fromTier: 'autonomous',
    toTier: 'supervised',
    toolDenylistAdds: [],
    costCeilingUsd: 0.2,
    riskCategory: 'tightening',
  },
];

const SEEDED_TRACES: HistoricalTrace[] = [
  {
    id: 'trace-aegis-20250416-001',
    label: "PARAGON"— Ransomware Lateral Movement v2',
    domain: 'aegis',
    route: 'aegis.containment.lateral-movement',
    startedAt: '2025-04-16T08:14:22Z',
    costUsd: 0.0341,
    latencyMs: 4820,
    toolsUsed: ['endpoint_telemetry_pull', 'endpoint_mass_isolate', 'soc_escalate'],
    effectiveTier: 'autonomous',
    originalOutcome: 'allowed',
    riskScore: 0.62,
  },
  {
    id: 'trace-aegis-20250415-007',
    label: "PARAGON"— Phishing Cluster Containment',
    domain: 'aegis',
    route: 'aegis.containment.lateral-movement',
    startedAt: '2025-04-15T14:02:11Z',
    costUsd: 0.0212,
    latencyMs: 3110,
    toolsUsed: ['endpoint_telemetry_pull', 'endpoint_isolate', 'soc_escalate'],
    effectiveTier: 'autonomous',
    originalOutcome: 'allowed',
    riskScore: 0.34,
  },
  {
    id: 'trace-aegis-20250414-002',
    label: "PARAGON"— False-Positive Mass Isolate',
    domain: 'aegis',
    route: 'aegis.containment.lateral-movement',
    startedAt: '2025-04-14T22:38:45Z',
    costUsd: 0.0288,
    latencyMs: 5260,
    toolsUsed: ['endpoint_telemetry_pull', 'endpoint_mass_isolate'],
    effectiveTier: 'autonomous',
    originalOutcome: 'allowed',
    riskScore: 0.81,
  },
  {
    id: 'trace-vessels-20250416-014',
    label: 'Vessels — Bunker Reroute Singapore→Fujairah',
    domain: 'vessels',
    route: 'vessels.bunker.reroute',
    startedAt: '2025-04-16T05:55:00Z',
    costUsd: 0.0094,
    latencyMs: 2410,
    toolsUsed: ['fuel_quote', 'route_optimizer'],
    effectiveTier: 'supervised',
    originalOutcome: 'approval',
    riskScore: 0.21,
  },
  {
    id: 'trace-vessels-20250415-011',
    label: 'Vessels — Bunker Reroute Suez → Algeciras',
    domain: 'vessels',
    route: 'vessels.bunker.reroute',
    startedAt: '2025-04-15T11:18:00Z',
    costUsd: 0.0102,
    latencyMs: 2630,
    toolsUsed: ['fuel_quote', 'route_optimizer'],
    effectiveTier: 'supervised',
    originalOutcome: 'approval',
    riskScore: 0.18,
  },
  {
    id: 'trace-vessels-20250413-009',
    label: 'Vessels — Bunker Reroute Houston → Cristóbal',
    domain: 'vessels',
    route: 'vessels.bunker.reroute',
    startedAt: '2025-04-13T19:42:10Z',
    costUsd: 0.0118,
    latencyMs: 2820,
    toolsUsed: ['fuel_quote', 'route_optimizer', 'weather_lookup'],
    effectiveTier: 'supervised',
    originalOutcome: 'approval',
    riskScore: 0.27,
  },
  {
    id: 'trace-prism-20250416-003',
    label: 'PRISM — Discovery Set #4421 (Wells privilege batch)',
    domain: 'prism',
    route: 'prism.discovery.privilege-review',
    startedAt: '2025-04-16T13:22:00Z',
    costUsd: 0.0421,
    latencyMs: 7200,
    toolsUsed: ['doc_classify', 'llm_summarize_privileged', 'redaction'],
    effectiveTier: 'advisory',
    originalOutcome: 'allowed',
    riskScore: 0.74,
  },
  {
    id: 'trace-prism-20250415-006',
    label: 'PRISM — Discovery Set #4419 (general)',
    domain: 'prism',
    route: 'prism.discovery.privilege-review',
    startedAt: '2025-04-15T16:50:00Z',
    costUsd: 0.0388,
    latencyMs: 6610,
    toolsUsed: ['doc_classify', 'llm_summarize', 'redaction'],
    effectiveTier: 'advisory',
    originalOutcome: 'allowed',
    riskScore: 0.31,
  },
  {
    id: 'trace-terra-20250416-005',
    label: 'Terra — Valuation Brookfield Tower ($42M)',
    domain: 'terra',
    route: 'terra.valuation.deal-screen',
    startedAt: '2025-04-16T10:08:00Z',
    costUsd: 0.0512,
    latencyMs: 8450,
    toolsUsed: ['comp_lookup', 'cap_rate_calc', 'deal_score'],
    effectiveTier: 'autonomous',
    originalOutcome: 'allowed',
    riskScore: 0.58,
  },
  {
    id: 'trace-terra-20250414-001',
    label: 'Terra — Valuation 1428 Riverside ($18M)',
    domain: 'terra',
    route: 'terra.valuation.deal-screen',
    startedAt: '2025-04-14T09:11:00Z',
    costUsd: 0.0498,
    latencyMs: 8210,
    toolsUsed: ['comp_lookup', 'cap_rate_calc', 'deal_score'],
    effectiveTier: 'autonomous',
    originalOutcome: 'allowed',
    riskScore: 0.22,
  },
];

interface ApiTracesResponse {
  data?: unknown;
}

function simulate(change: PolicyChange, traces: HistoricalTrace[]): SimResult[] {
  return traces.map((t) => {
    if (t.route !== change.route) {
      return {
        traceId: t.id,
        before: t.originalOutcome,
        after: t.originalOutcome,
        reason: 'Out of policy scope — unchanged.',
        riskDelta: 0,
      };
    }

    const usesDeniedTool = t.toolsUsed.some((tool) => change.toolDenylistAdds.includes(tool));
    const overCostCap = change.costCeilingUsd != null && t.costUsd > change.costCeilingUsd;

    const fromRank = TIER_RANK[change.fromTier];
    const toRank = TIER_RANK[change.toTier];
    let after: SimOutcome = t.originalOutcome;
    const reasons: string[] = [];

    if (usesDeniedTool) {
      after = 'blocked';
      reasons.push(
        `Uses newly-denied tool (${t.toolsUsed.filter((x) => change.toolDenylistAdds.includes(x)).join(', ')})`,
      );
    } else if (overCostCap) {
      after = 'approval';
      reasons.push(
        `Trace cost $${t.costUsd.toFixed(4)} exceeds new ceiling $${change.costCeilingUsd?.toFixed(2)}`,
      );
    } else if (toRank < fromRank) {
      // Tightening: high-risk traces that were allowed now require approval
      if (t.originalOutcome === 'allowed' && t.riskScore >= 0.5) {
        after = 'approval';
        reasons.push(
          `Tier demoted to ${change.toTier}; risk score ${t.riskScore.toFixed(2)} now requires human approval`,
        );
      } else if (t.originalOutcome === 'allowed') {
        reasons.push(
          `Tier demoted but risk score ${t.riskScore.toFixed(2)} within new tier limits`,
        );
      }
    } else if (toRank > fromRank) {
      // Loosening: traces that required approval now run autonomously
      if (t.originalOutcome === 'approval' && t.riskScore < 0.5) {
        after = 'allowed';
        reasons.push(
          `Tier promoted to ${change.toTier}; low-risk trace (${t.riskScore.toFixed(2)}) now autonomous`,
        );
      } else if (t.originalOutcome === 'approval') {
        reasons.push(
          `Tier promoted but risk score ${t.riskScore.toFixed(2)} still requires approval`,
        );
      }
    } else {
      reasons.push('No tier change — only scope/tool restrictions evaluated');
    }

    if (reasons.length === 0) reasons.push('No change under proposed policy.');

    const riskDelta =
      after === 'blocked' || after === 'approval'
        ? -t.riskScore
        : t.originalOutcome === 'approval' && after === 'allowed'
          ? +0.1
          : 0;
    return {
      traceId: t.id,
      before: t.originalOutcome,
      after,
      reason: reasons.join(' · '),
      riskDelta,
    };
  });
}

function OutcomePill({ outcome }: { outcome: SimOutcome }) {
  const m = OUTCOME_META[outcome];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: m.color,
        background: `${m.color}18`,
        border: `1px solid ${m.color}40`,
        padding: '2px 8px',
        borderRadius: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}
    >
      {m.label}
    </span>
  );
}

function TierBadge({ tier }: { tier: AutonomyTier }) {
  const c = TIER_COLOR[tier];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: c,
        background: `${c}18`,
        border: `1px solid ${c}40`,
        padding: '2px 8px',
        borderRadius: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}
    >
      {tier}
    </span>
  );
}

export default function CognitivePolicySim() {
  const [selectedChangeId, setSelectedChangeId] = useState<string>(POLICY_CHANGES[0].id);
  const [selectedTraceIds, setSelectedTraceIds] = useState<Set<string>>(
    new Set(SEEDED_TRACES.map((t) => t.id)),
  );
  const [simRan, setSimRan] = useState(false);

  // Read-only liveness probe to indicate that the trace API is reachable.
  // Simulation itself runs client-side over the curated historical trace set.
  const tracesQuery = useStandardQuery<ApiTracesResponse>({
    queryKey: ['cognitive', 'policy-sim', 'traces'],
    queryFn: () => fetchJson<ApiTracesResponse>(apiUrl('/traces?limit=10')),
    staleTime: 60_000,
    retry: false,
  });

  const isLive = tracesQuery.isSuccess && tracesQuery.data != null;

  const change = POLICY_CHANGES.find((p) => p.id === selectedChangeId)!;
  const dc = DOMAIN_COLORS[change.domain] ?? DOMAIN_COLORS.default;
  const inScope = SEEDED_TRACES.filter((t) => selectedTraceIds.has(t.id));

  const results = useMemo(() => simulate(change, inScope), [change, inScope]);

  const counts = useMemo(() => {
    const before = { allowed: 0, approval: 0, blocked: 0 };
    const after = { allowed: 0, approval: 0, blocked: 0 };
    results.forEach((r) => {
      before[r.before]++;
      after[r.after]++;
    });
    return { before, after };
  }, [results]);

  const changedCount = results.filter((r) => r.before !== r.after).length;
  const inScopeCount = results.filter((r) => {
    const trace = SEEDED_TRACES.find((t) => t.id === r.traceId)!;
    return trace.route === change.route;
  }).length;

  function toggleTrace(id: string) {
    const next = new Set(selectedTraceIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTraceIds(next);
    setSimRan(false);
  }

  function selectAll() {
    setSelectedTraceIds(new Set(SEEDED_TRACES.map((t) => t.id)));
    setSimRan(false);
  }
  function selectScope() {
    setSelectedTraceIds(
      new Set(SEEDED_TRACES.filter((t) => t.route === change.route).map((t) => t.id)),
    );
    setSimRan(false);
  }

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
              Policy Simulation
            </span>
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
            {isLive && (
              <span
                style={{
                  fontSize: 10,
                  color: '#22c55e',
                  background: '#22c55e15',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                ● LIVE TRACES
              </span>
            )}
            {tracesQuery.isLoading && (
              <span style={{ fontSize: 10, color: '#475569' }}>Loading recent traces…</span>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Run a proposed policy change against historical agent traces and preview the outcome
            delta — allowed, approval-required, and blocked counts — before applying to production.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
            gap: 18,
            marginBottom: 22,
          }}
        >
          {/* Left: pick proposed policy change */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#475569',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Proposed Policy Change
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {POLICY_CHANGES.map((p) => {
                const isSel = p.id === selectedChangeId;
                const pdc = DOMAIN_COLORS[p.domain] ?? DOMAIN_COLORS.default;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedChangeId(p.id);
                      setSimRan(false);
                    }}
                    style={{
                      textAlign: 'left',
                      background: isSel ? `${ACCENT}10` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSel ? `${ACCENT}60` : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 8,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      color: '#e2e8f0',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: pdc,
                          background: `${pdc}18`,
                          padding: '1px 6px',
                          borderRadius: 3,
                        }}
                      >
                        {p.domain.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color:
                            p.riskCategory === 'loosening'
                              ? '#22c55e'
                              : p.riskCategory === 'tightening'
                                ? '#f59e0b'
                                : '#64748b',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        {p.riskCategory}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: isSel ? '#e2e8f0' : '#cbd5e1',
                        marginBottom: 4,
                      }}
                    >
                      {p.title}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                      {p.rationale}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: change spec */}
          <div
            style={{
              background: `${dc}06`,
              border: `1px solid ${dc}30`,
              borderRadius: 10,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#475569',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              Change Specification
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>
              {change.title}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: '8px 14px',
                fontSize: 12,
              }}
            >
              <span style={{ color: '#475569' }}>Route</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontSize: 11 }}>
                {change.route}
              </span>

              <span style={{ color: '#475569' }}>Tier change</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TierBadge tier={change.fromTier} />
                <span style={{ color: '#475569' }}>→</span>
                <TierBadge tier={change.toTier} />
              </span>

              {change.toolDenylistAdds.length > 0 && (
                <>
                  <span style={{ color: '#475569' }}>Deny tools</span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {change.toolDenylistAdds.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 10,
                          color: '#ef4444',
                          background: '#ef444415',
                          border: '1px solid #ef444430',
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontFamily: 'monospace',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </>
              )}

              {change.costCeilingUsd != null && (
                <>
                  <span style={{ color: '#475569' }}>Cost ceiling</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                    ${change.costCeilingUsd.toFixed(2)} per trace
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  setSimRan(true);
                }}
                style={{
                  background: ACCENT,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ▶ Run Simulation
              </button>
              <button
                onClick={selectScope}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '8px 14px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Select in-scope traces only
              </button>
              <button
                onClick={selectAll}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '8px 14px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Select all
              </button>
            </div>
          </div>
        </div>

        {/* Outcome delta summary */}
        {simRan && (
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${ACCENT}40`,
              borderRadius: 10,
              padding: 18,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                  Outcome Delta — {inScope.length} traces simulated
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {inScopeCount} in policy scope · {changedCount} outcome change
                  {changedCount === 1 ? '' : 's'} under proposed policy
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                Simulation only — nothing applied to production
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {(['allowed', 'approval', 'blocked'] as SimOutcome[]).map((k) => {
                const m = OUTCOME_META[k];
                const b = counts.before[k];
                const a = counts.after[k];
                const delta = a - b;
                return (
                  <div
                    key={k}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${m.color}30`,
                      borderRadius: 8,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: m.color,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 8,
                      }}
                    >
                      {m.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0' }}>{a}</span>
                      <span style={{ fontSize: 11, color: '#475569' }}>was {b}</span>
                      {delta !== 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: delta > 0 ? m.color : '#94a3b8',
                          }}
                        >
                          {delta > 0 ? '+' : ''}
                          {delta}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-trace results */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#475569',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Historical Traces ({inScope.length} selected of {SEEDED_TRACES.length})
            </div>
            <div style={{ fontSize: 10, color: '#475569' }}>
              Click a trace row to toggle inclusion
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  {['', 'Trace', 'Route', 'Cost', 'Risk', 'Before', simRan ? 'After' : '', 'Why']
                    .filter(Boolean)
                    .map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          color: '#475569',
                          padding: '6px 10px',
                          fontWeight: 600,
                          fontSize: 9,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {SEEDED_TRACES.map((t) => {
                  const selected = selectedTraceIds.has(t.id);
                  const r = simRan ? results.find((x) => x.traceId === t.id) : null;
                  const inPolicy = t.route === change.route;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => toggleTrace(t.id)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        opacity: selected ? 1 : 0.45,
                        background: r && r.before !== r.after ? `${ACCENT}06` : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 10px' }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          readOnly
                          style={{ accentColor: ACCENT }}
                        />
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <Link
                          href={`/cognitive/traces?trace=${encodeURIComponent(t.id)}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: '#cbd5e1', textDecoration: 'none', fontWeight: 600 }}
                        >
                          {t.label}
                        </Link>
                        <div
                          style={{
                            fontSize: 9,
                            color: '#475569',
                            fontFamily: 'monospace',
                            marginTop: 2,
                          }}
                        >
                          {t.id}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          fontFamily: 'monospace',
                          fontSize: 10,
                          color: inPolicy ? '#cbd5e1' : '#475569',
                        }}
                      >
                        {t.route}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#94a3b8' }}>
                        ${t.costUsd.toFixed(4)}
                      </td>
                      <td
                        style={{
                          padding: '10px 10px',
                          color: t.riskScore >= 0.5 ? '#f59e0b' : '#94a3b8',
                          fontWeight: 600,
                        }}
                      >
                        {t.riskScore.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <OutcomePill outcome={t.originalOutcome} />
                      </td>
                      {simRan && (
                        <td style={{ padding: '10px 10px' }}>
                          {r && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <OutcomePill outcome={r.after} />
                              {r.before !== r.after && (
                                <span style={{ fontSize: 9, color: ACCENT, fontWeight: 700 }}>
                                  Δ
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                      )}
                      <td
                        style={{
                          padding: '10px 10px',
                          color: '#64748b',
                          maxWidth: 320,
                          lineHeight: 1.5,
                        }}
                      >
                        {r
                          ? r.reason
                          : inPolicy
                            ? 'In policy scope — run simulation to evaluate'
                            : 'Out of policy scope'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 11, color: '#475569', display: 'flex', gap: 12 }}>
          <Link href="/cognitive/policies" style={{ color: ACCENT, textDecoration: 'none' }}>
            ↗ Open Policy Console
          </Link>
          <Link href="/cognitive/traces" style={{ color: ACCENT, textDecoration: 'none' }}>
            ↗ Open Trace Replay
          </Link>
          <Link href="/cognitive/evals" style={{ color: ACCENT, textDecoration: 'none' }}>
            ↗ Open Eval Console
          </Link>
        </div>
      </div>
    </div>
  );
}
