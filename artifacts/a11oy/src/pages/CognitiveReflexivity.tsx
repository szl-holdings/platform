/**
 * Cognitive Reflexivity Dashboard
 *
 * Live operator surface for the Cognitive Reflexivity Engine. Surfaces:
 *  - Health score (5-component composite from /api/cognitive-reflexivity/health)
 *  - Recent reflexive signals
 *  - Strategy registry (proposed → approved/rejected lifecycle)
 *  - Recent decision traces (where strategies actually shaped routing)
 *
 * Pure REST polling against /api/cognitive-reflexivity. No GraphQL coupling.
 */
import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle, KpiCard, ActionButton } from '../components/ui';

const GOLD = '#c9b787';
const NAVY = '#0a0a0a';
const GREY = '#8a8a8a';
const REFRESH_MS = 5_000;

interface HealthScore {
  score: number;
  tier: 'fragile' | 'recovering' | 'healthy' | 'flourishing';
  components: {
    monologueCadence: number;
    strategyPromotionRate: number;
    dialecticAgreement: number;
    consolidationHealth: number;
    actionRatio: number;
  };
  asOf: string;
}

interface ReflexiveStrategy {
  strategyId: string;
  class: string;
  description: string;
  params: Record<string, unknown>;
  applicableContexts: string[];
  confidence: number;
  tier: string;
  status: string;
  provenance: {
    originatingSignalIds: string[];
    monologueThreadIds: string[];
    dialecticalTrace?: { thesis: string; antithesis: string; synthesis: string; confidence: number };
    proposedBy: string;
    proposedAt: string;
    approvedBy?: string;
    approvedAt?: string;
  };
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

interface DecisionTrace {
  traceId: string;
  decisionAt: string;
  routeClass?: string;
  appliedStrategyIds: string[];
  influencedDimensions: string[];
}

interface CognitiveSignal {
  signalId: string;
  type: string;
  occurredAt: string;
  severity: string;
  confidence: number;
  tags: string[];
  rawPayload?: { reflexive?: { subtype: string; observation: string; intensity: number } };
}

const TIER_COLORS: Record<string, string> = {
  fragile: '#ef4444',
  recovering: '#f97316',
  healthy: GOLD,
  flourishing: '#22c55e',
};

const STATUS_COLORS: Record<string, string> = {
  proposed: GREY,
  'pending-approval': '#f97316',
  active: '#22c55e',
  rejected: '#ef4444',
  retired: GREY,
};

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function fmtAgo(ts: string | undefined): string {
  if (!ts) return '—';
  try {
    const ms = Date.now() - new Date(ts).getTime();
    if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
    if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
    if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
    return `${Math.round(ms / 86_400_000)}d ago`;
  } catch {
    return ts;
  }
}

export default function CognitiveReflexivity() {
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [strategies, setStrategies] = useState<ReflexiveStrategy[]>([]);
  const [traces, setTraces] = useState<DecisionTrace[]>([]);
  const [signals, setSignals] = useState<CognitiveSignal[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [seedBusy, setSeedBusy] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  async function refresh() {
    const [h, s, t, sig] = await Promise.all([
      fetchJSON<HealthScore>('/api/cognitive-reflexivity/health'),
      fetchJSON<{ strategies: ReflexiveStrategy[]; total: number }>(
        `/api/cognitive-reflexivity/strategies?limit=200${statusFilter ? `&status=${statusFilter}` : ''}`,
      ),
      fetchJSON<{ traces: DecisionTrace[] }>('/api/cognitive-reflexivity/traces?limit=50'),
      fetchJSON<{ signals: CognitiveSignal[] }>('/api/cognitive-reflexivity/recent-signals'),
    ]);
    if (h) setHealth(h);
    if (s) setStrategies(s.strategies);
    if (t) setTraces(t.traces);
    if (sig) setSignals(sig.signals);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function decide(id: string, verdict: 'approve' | 'reject') {
    setBusy((b) => ({ ...b, [id]: true }));
    await fetchJSON(`/api/cognitive-reflexivity/strategies/${id}/${verdict}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: 'a11oy-operator' }),
    });
    await refresh();
    setBusy((b) => {
      const n = { ...b };
      delete n[id];
      return n;
    });
  }

  async function seedDemo() {
    setSeedBusy(true);
    setSeedMsg(null);
    const samples = [
      {
        subtype: 'router.lane_drift',
        observation: 'Reasoning lane usage dropped to 12% on counsel pipeline; expected ≥40%.',
        intensity: 0.78,
        data: { suggestedLane: 'reasoning' },
      },
      {
        subtype: 'sync.failed',
        observation: 'Salesforce → Snowflake conduit sync failed twice in 20 minutes.',
        intensity: 0.55,
        data: { connector: 'salesforce', target: 'snowflake' },
      },
      {
        subtype: 'detection.fp_spike',
        observation: 'Sigma rule cred-stuffing-v3 firing 4× normal; FP rate 38%.',
        intensity: 0.82,
        data: { ruleId: 'cred-stuffing-v3' },
      },
    ];
    let ok = 0;
    for (const s of samples) {
      const res = await fetchJSON('/api/cognitive-reflexivity/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (res !== null) ok++;
    }
    setSeedMsg(`Seeded ${ok} of ${samples.length} reflexive signals.`);
    setTimeout(() => setSeedMsg(null), 5000);
    await new Promise((r) => setTimeout(r, 600));
    await refresh();
    setSeedBusy(false);
  }

  const tierColor = health ? TIER_COLORS[health.tier] ?? GOLD : GOLD;
  const proposedCount = useMemo(
    () => strategies.filter((s) => s.status === 'proposed' || s.status === 'pending-approval').length,
    [strategies],
  );
  const activeCount = useMemo(() => strategies.filter((s) => s.status === 'active').length, [strategies]);

  return (
    <Layout>
      <PageHeader
        eyebrow="A11oy / Substrate"
        title="Cognitive Reflexivity"
        subtitle="Self-observing, self-improving governed cognition. Signals → dialectic → strategies → routing."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Health"
          value={health ? `${Math.round(health.score)}` : '—'}
          sub={health ? health.tier.toUpperCase() : 'loading'}
          accent={tierColor}
        />
        <KpiCard label="Active Strategies" value={activeCount} sub="auto + approved" accent={GOLD} />
        <KpiCard label="Awaiting Approval" value={proposedCount} sub="operator queue" accent="#f97316" />
        <KpiCard label="Signals Buffer" value={signals.length} sub="last 100" accent={GREY} />
        <KpiCard label="Decision Traces" value={traces.length} sub="recent" accent={GOLD} />
      </div>

      {health && (
        <Card className="" style={{ marginBottom: 24 }}>
          <SectionTitle>Health Components</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
            {Object.entries(health.components).map(([k, v]) => (
              <div key={k} style={{ background: '#111', padding: 12, border: `1px solid ${GREY}33` }}>
                <div style={{ fontSize: 11, color: GREY, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                <div style={{ fontSize: 22, color: GOLD, fontWeight: 600 }}>{Math.round(v * 100)}%</div>
                <div style={{ height: 4, background: '#222', marginTop: 6 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, v * 100)}%`, background: GOLD }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <SectionTitle>Reflexive Strategies</SectionTitle>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: NAVY, color: GOLD, border: `1px solid ${GOLD}55`, padding: '6px 10px', fontSize: 12 }}
            >
              <option value="">All statuses</option>
              <option value="proposed">Proposed</option>
              <option value="pending-approval">Pending approval</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="retired">Retired</option>
            </select>
            <ActionButton onClick={seedDemo} disabled={seedBusy}>
              {seedBusy ? 'Seeding…' : 'Seed demo signals'}
            </ActionButton>
          </div>
        </div>
        {seedMsg && (
          <div style={{ color: GOLD, fontSize: 12, marginBottom: 8 }}>{seedMsg}</div>
        )}
        {strategies.length === 0 ? (
          <div style={{ color: GREY, padding: 24, textAlign: 'center', fontSize: 13 }}>
            No strategies yet. Click "Seed demo signals" to emit reflexive observations and watch the engine reason.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {strategies.slice(0, 30).map((s) => {
              const statusColor = STATUS_COLORS[s.status] ?? GREY;
              return (
                <div
                  key={s.strategyId}
                  style={{
                    background: '#111',
                    border: `1px solid ${statusColor}55`,
                    padding: 14,
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: GOLD, fontWeight: 600, fontSize: 13 }}>{s.class}</span>
                      <span style={{ fontSize: 10, color: statusColor, border: `1px solid ${statusColor}`, padding: '2px 6px', textTransform: 'uppercase' }}>
                        {s.status}
                      </span>
                      <span style={{ fontSize: 10, color: GREY, border: `1px solid ${GREY}55`, padding: '2px 6px', textTransform: 'uppercase' }}>
                        tier:{s.tier}
                      </span>
                      <span style={{ fontSize: 11, color: GREY }}>conf {Math.round(s.confidence * 100)}%</span>
                      <span style={{ fontSize: 11, color: GREY }}>{fmtAgo(s.createdAt)}</span>
                    </div>
                    <div style={{ color: '#eee', fontSize: 13, marginBottom: 6 }}>{s.description}</div>
                    {s.provenance.dialecticalTrace && (
                      <details style={{ fontSize: 11, color: GREY, marginTop: 4 }}>
                        <summary style={{ cursor: 'pointer', color: GOLD }}>Dialectic trace</summary>
                        <div style={{ paddingTop: 6, paddingLeft: 12, borderLeft: `1px solid ${GOLD}33`, marginTop: 4 }}>
                          <div><b style={{ color: GOLD }}>Thesis:</b> {s.provenance.dialecticalTrace.thesis}</div>
                          <div><b style={{ color: GOLD }}>Antithesis:</b> {s.provenance.dialecticalTrace.antithesis}</div>
                          <div><b style={{ color: GOLD }}>Synthesis:</b> {s.provenance.dialecticalTrace.synthesis}</div>
                        </div>
                      </details>
                    )}
                    {s.applicableContexts.length > 0 && (
                      <div style={{ fontSize: 10, color: GREY, marginTop: 6 }}>
                        contexts: {s.applicableContexts.join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    {(s.status === 'proposed' || s.status === 'pending-approval') && (
                      <>
                        <ActionButton onClick={() => decide(s.strategyId, 'approve')} disabled={busy[s.strategyId]}>
                          Approve
                        </ActionButton>
                        <ActionButton onClick={() => decide(s.strategyId, 'reject')} disabled={busy[s.strategyId]}>
                          Reject
                        </ActionButton>
                      </>
                    )}
                    {s.status === 'active' && (
                      <span style={{ fontSize: 11, color: GREY }}>used {s.usageCount}×</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        <Card className="">
          <SectionTitle>Recent Reflexive Signals</SectionTitle>
          {signals.length === 0 ? (
            <div style={{ color: GREY, padding: 12, fontSize: 13 }}>No signals observed yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {signals.slice(0, 20).map((sig) => {
                const refl = sig.rawPayload?.reflexive;
                return (
                  <div key={sig.signalId} style={{ background: '#111', padding: 10, border: `1px solid ${GREY}33`, fontSize: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: GOLD, fontWeight: 600 }}>{refl?.subtype ?? sig.type}</span>
                      <span style={{ color: GREY }}>{fmtAgo(sig.occurredAt)}</span>
                      {refl?.intensity != null && (
                        <span style={{ marginLeft: 'auto', color: GREY }}>intensity {refl.intensity.toFixed(2)}</span>
                      )}
                    </div>
                    <div style={{ color: '#ccc' }}>{refl?.observation ?? '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="">
          <SectionTitle>Decision Traces</SectionTitle>
          {traces.length === 0 ? (
            <div style={{ color: GREY, padding: 12, fontSize: 13 }}>No decisions traced yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {traces.slice(0, 20).map((tr) => (
                <div key={tr.traceId} style={{ background: '#111', padding: 10, border: `1px solid ${GREY}33`, fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: GOLD, fontWeight: 600 }}>{tr.routeClass ?? 'general'}</span>
                    <span style={{ color: GREY, marginLeft: 'auto' }}>{fmtAgo(tr.decisionAt)}</span>
                  </div>
                  <div style={{ color: '#ccc', marginTop: 4 }}>
                    Influenced: {tr.influencedDimensions.length === 0 ? 'defaults' : tr.influencedDimensions.join(', ')}
                  </div>
                  <div style={{ color: GREY, fontSize: 10, marginTop: 4 }}>
                    {tr.appliedStrategyIds.length} strategy{tr.appliedStrategyIds.length === 1 ? '' : 'ies'} applied
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
