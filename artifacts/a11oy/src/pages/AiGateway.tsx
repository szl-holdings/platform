import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusPill } from '../components/ui';

const API = '/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProviderStatus {
  provider: string;
  status: string;
  configured: boolean;
  avgLatencyMs: number;
  circuitState: string;
  successRate: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  totalCallsLast5m: number;
  costLast5mUsd: number;
  circuitBreaker: {
    state: string;
    consecutiveFailures: number;
    openedAt: number | null;
    totalTripped: number;
  } | null;
}

interface GatewayStatusData {
  providers: ProviderStatus[];
  defaultStrategy: string;
  supportedStrategies: string[];
  taskTypes: string[];
}

interface TelemetrySummary {
  totalInferences: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  successRate: number;
  throughputPerMinute: number;
}

interface ProviderBreakdown {
  provider: string;
  totalRequests: number;
  successRequests: number;
  errorRate: number;
  avgLatencyMs: number;
  totalCostUsd: number;
}

interface ModelBreakdown {
  model: string;
  totalRequests: number;
  errorRate: number;
  avgLatencyMs: number;
  totalCostUsd: number;
}

interface MetricsData {
  summary: TelemetrySummary;
  providerBreakdown: ProviderBreakdown[];
  modelBreakdown: ModelBreakdown[];
}

interface CostDomain {
  domain: string;
  calls: number;
  costUsd: number;
  tokens: number;
}

interface CostModel {
  model: string;
  calls: number;
  costUsd: number;
  tokens: number;
}

interface CostData {
  totals: { calls: number; costUsd: number; tokens: number };
  byDomain: CostDomain[];
  byModel: CostModel[];
}

interface FailoverEvent {
  id: string;
  provider: string;
  model: string;
  domain: string | null;
  retryCount: number;
  success: boolean;
  latencyMs: number;
  errorType: string | null;
  timestamp: number;
}

interface FailoverData {
  failoverEvents: FailoverEvent[];
  circuitBreakerTrips: Array<{
    provider: string;
    state: string;
    totalTripped: number;
    consecutiveFailures: number;
  }>;
}

interface InferRecord {
  id: string;
  provider: string;
  model: string;
  domain: string | null;
  latencyMs: number;
  success: boolean;
  routingStrategy: string;
  estimatedCostUsd: number;
  timestamp: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  'replit-proxy': '#4ade80',
  openai:         '#10b981',
  anthropic:      '#f59e0b',
  gemini:         '#3b82f6',
  huggingface:    '#8b5cf6',
  qclaw:          '#ec4899',
};

const CIRCUIT_STATE_STYLE: Record<string, { color: string; label: string }> = {
  closed:    { color: '#4ade80', label: 'Healthy' },
  'half-open': { color: '#f59e0b', label: 'Recovering' },
  open:      { color: '#ef4444', label: 'Open' },
};

const RISK_TIER_OPTIONS = ['advisory', 'supervised', 'operator-approved'];
const STRATEGY_OPTIONS = ['fastest', 'cheapest', 'preferred', 'fallback'];
const DOMAIN_OPTIONS = ['general', 'maritime', 'legal', 'security', 'real-estate', 'finance', 'infrastructure'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  if (n < 0.001) return `$${(n * 1000).toFixed(3)}m`;
  return `$${n.toFixed(4)}`;
}

function fmtMs(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}s`;
  return `${Math.round(n)}ms`;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function statusColor(status: string): string {
  if (status === 'healthy') return '#4ade80';
  if (status === 'degraded') return '#f59e0b';
  if (status === 'down') return '#ef4444';
  return '#6b7280';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AiGateway() {
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatusData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [failoverData, setFailoverData] = useState<FailoverData | null>(null);
  const [recentRecords, setRecentRecords] = useState<InferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cost' | 'failover' | 'infer' | 'code-agent'>('overview');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ── Infer form ──────────────────────────────────────────────────────────────
  const [inferPrompt, setInferPrompt] = useState('');
  const [inferDomain, setInferDomain] = useState('general');
  const [inferTier, setInferTier] = useState('advisory');
  const [inferStrategy, setInferStrategy] = useState('fastest');
  const [inferRunning, setInferRunning] = useState(false);
  const [inferResult, setInferResult] = useState<Record<string, unknown> | null>(null);
  const [inferError, setInferError] = useState<string | null>(null);

  // ── Code agent form ─────────────────────────────────────────────────────────
  const [codeTask, setCodeTask] = useState('');
  const [codeDomain, setCodeDomain] = useState('general');
  const [codeTier, setCodeTier] = useState('advisory');
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeResult, setCodeResult] = useState<Record<string, unknown> | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [statusRes, metricsRes, costRes, failRes, recordsRes] = await Promise.all([
        fetch(`${API}/ai-gateway/status`),
        fetch(`${API}/ai-gateway/metrics?windowMs=3600000`),
        fetch(`${API}/ai-gateway/cost?windowMs=86400000`),
        fetch(`${API}/ai-gateway/failover?windowMs=3600000`),
        fetch(`${API}/ai-gateway/records?limit=20&windowMs=3600000`),
      ]);

      if (statusRes.ok) {
        const j = await statusRes.json() as { ok: boolean; data: GatewayStatusData };
        if (j.ok) setGatewayStatus(j.data);
      }
      if (metricsRes.ok) {
        const j = await metricsRes.json() as { ok: boolean; data: MetricsData };
        if (j.ok) setMetrics(j.data);
      }
      if (costRes.ok) {
        const j = await costRes.json() as { ok: boolean; data: CostData };
        if (j.ok) setCostData(j.data);
      }
      if (failRes.ok) {
        const j = await failRes.json() as { ok: boolean; data: FailoverData };
        if (j.ok) setFailoverData(j.data);
      }
      if (recordsRes.ok) {
        const j = await recordsRes.json() as { ok: boolean; data: { records: InferRecord[] } };
        if (j.ok) setRecentRecords(j.data.records ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => { void load(); }, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // ── Governed Inference ──────────────────────────────────────────────────────
  async function runInfer() {
    if (!inferPrompt.trim()) return;
    setInferRunning(true);
    setInferResult(null);
    setInferError(null);
    try {
      const res = await fetch(`${API}/ai-gateway/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: inferPrompt }],
          domain: inferDomain,
          riskTier: inferTier,
          strategy: inferStrategy,
        }),
      });
      const json = await res.json() as Record<string, unknown>;
      if (res.ok && json.ok) {
        setInferResult(json.data as Record<string, unknown>);
      } else {
        setInferError((json.error as string) ?? 'Inference failed');
      }
    } catch (err) {
      setInferError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setInferRunning(false);
    }
  }

  // ── Code Agent ──────────────────────────────────────────────────────────────
  async function runCodeAgent() {
    if (!codeTask.trim()) return;
    setCodeRunning(true);
    setCodeResult(null);
    setCodeError(null);
    try {
      const res = await fetch(`${API}/ai-gateway/code-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: codeTask, domain: codeDomain, riskTier: codeTier }),
      });
      const json = await res.json() as Record<string, unknown>;
      if (res.ok && json.ok) {
        setCodeResult(json.data as Record<string, unknown>);
      } else {
        setCodeError((json.error as string) ?? 'Code agent failed');
      }
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setCodeRunning(false);
    }
  }

  const summary = metrics?.summary;
  const totalCalls = summary?.totalInferences ?? 0;
  const successRate = summary ? ((summary.successRate ?? 0) * 100).toFixed(1) : '—';
  const avgLatency = summary ? fmtMs(summary.avgLatencyMs) : '—';
  const totalCost = summary ? fmt$(summary.totalCostUsd) : '—';

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'overview',    label: 'Overview' },
    { id: 'cost',        label: 'Cost Intelligence' },
    { id: 'failover',    label: 'Failover & Health' },
    { id: 'infer',       label: 'Governed Inference' },
    { id: 'code-agent',  label: 'Code Agent' },
  ];

  const dossierHref = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/foundry/deepseek-v4`;
  return (
    <Layout>
      <a
        href={dossierHref}
        style={{
          display: 'block', marginBottom: '1rem', padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(201,183,135,0.08), rgba(201,183,135,0.02))',
          border: '1px solid rgba(201,183,135,0.4)', borderRadius: 8,
          textDecoration: 'none', color: '#e5e7eb',
        }}
      >
        <div style={{ fontSize: '0.625rem', fontFamily: 'ui-monospace,monospace', color: '#c9b787', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
          GATEWAY · DEFAULT REASONING TIER
        </div>
        <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
          DeepSeek-V4-Pro / Flash routed under A11oy Covenant — 1M context, FP4+FP8, MIT
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
          Reasoning lane defaults to DeepSeek-V4-Pro; fast lane to DeepSeek-V4-Flash. Open dossier →
        </div>
      </a>
      <PageHeader
        label="AI GATEWAY"
        title="Governed AI Gateway"
        subtitle="Multi-model routing with policy gates, cost tracking, and sandboxed code agents"
        status="LIVE"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Inferences (1h)"
          value={loading ? '…' : totalCalls.toLocaleString()}
          sub={summary ? `${(summary.throughputPerMinute ?? 0).toFixed(1)}/min` : undefined}
        />
        <KpiCard
          label="Success Rate"
          value={loading ? '…' : `${successRate}%`}
          trend={!loading && summary ? (Number(successRate) >= 95 ? 'up' : 'down') : 'neutral'}
        />
        <KpiCard
          label="Avg Latency"
          value={loading ? '…' : avgLatency}
        />
        <KpiCard
          label="Cost (1h)"
          value={loading ? '…' : totalCost}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === t.id ? '#c9b787' : '#6b7280',
              borderBottom: activeTab === t.id ? '2px solid #c9b787' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
        {lastRefresh && (
          <span className="ml-auto text-xs self-center pr-2" style={{ color: '#4b5563' }}>
            Updated {timeAgo(lastRefresh.getTime())}
          </span>
        )}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <SectionTitle>Provider Health</SectionTitle>
          {loading && (
            <p style={{ color: '#6b7280' }}>Loading provider status…</p>
          )}
          {!loading && gatewayStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gatewayStatus.providers.map((p) => {
                const accent = PROVIDER_COLORS[p.provider] ?? '#c9b787';
                const circuit = CIRCUIT_STATE_STYLE[p.circuitBreaker?.state ?? 'closed'] ?? CIRCUIT_STATE_STYLE.closed;
                return (
                  <Card key={p.provider}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                        <span className="font-medium" style={{ color: '#e5e7eb' }}>
                          {p.provider}
                        </span>
                      </div>
                      <StatusPill status={
                        !p.configured
                          ? 'GATED'
                          : p.status === 'healthy'
                            ? 'LIVE'
                            : p.status === 'degraded'
                              ? 'WARN'
                              : 'ERROR'
                      } />
                    </div>
                    <div className="space-y-1.5 text-xs" style={{ color: '#6b7280' }}>
                      <div className="flex justify-between">
                        <span>Circuit Breaker</span>
                        <span style={{ color: circuit.color }}>{circuit.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate</span>
                        <span style={{ color: p.successRate !== null && p.successRate >= 95 ? '#4ade80' : '#f59e0b' }}>
                          {p.successRate !== null ? `${p.successRate.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>P50 Latency</span>
                        <span style={{ color: '#9ca3af' }}>
                          {p.p50LatencyMs !== null ? fmtMs(p.p50LatencyMs) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>P95 Latency</span>
                        <span style={{ color: '#9ca3af' }}>
                          {p.p95LatencyMs !== null ? fmtMs(p.p95LatencyMs) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calls (5m)</span>
                        <span style={{ color: '#9ca3af' }}>{p.totalCallsLast5m}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost (5m)</span>
                        <span style={{ color: '#9ca3af' }}>{fmt$(p.costLast5mUsd)}</span>
                      </div>
                      {p.circuitBreaker && p.circuitBreaker.totalTripped > 0 && (
                        <div className="flex justify-between">
                          <span>Times Tripped</span>
                          <span style={{ color: '#ef4444' }}>{p.circuitBreaker.totalTripped}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Provider breakdown table */}
          {!loading && metrics && metrics.providerBreakdown.length > 0 && (
            <>
              <SectionTitle>Provider Breakdown (1h)</SectionTitle>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: '#4b5563', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th className="text-left pb-3 pr-4">Provider</th>
                        <th className="text-right pb-3 pr-4">Requests</th>
                        <th className="text-right pb-3 pr-4">Success Rate</th>
                        <th className="text-right pb-3 pr-4">Avg Latency</th>
                        <th className="text-right pb-3">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.providerBreakdown.map((p) => (
                        <tr key={p.provider} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: PROVIDER_COLORS[p.provider] ?? '#c9b787' }}
                              />
                              <span style={{ color: '#e5e7eb' }}>{p.provider}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-4 text-right" style={{ color: '#9ca3af' }}>{p.totalRequests}</td>
                          <td className="py-2 pr-4 text-right" style={{ color: p.errorRate < 0.05 ? '#4ade80' : '#f59e0b' }}>
                            {((1 - p.errorRate) * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 pr-4 text-right" style={{ color: '#9ca3af' }}>{fmtMs(p.avgLatencyMs)}</td>
                          <td className="py-2 text-right" style={{ color: '#9ca3af' }}>{fmt$(p.totalCostUsd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* Recent activity */}
          {!loading && recentRecords.length > 0 && (
            <>
              <SectionTitle>Recent Inference Activity</SectionTitle>
              <Card>
                <div className="space-y-1">
                  {recentRecords.slice(0, 15).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 py-1.5 text-xs"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: r.success ? '#4ade80' : '#ef4444' }}
                      />
                      <span style={{ color: '#6b7280', width: '5rem', flexShrink: 0 }}>
                        {timeAgo(r.timestamp)}
                      </span>
                      <span
                        style={{
                          color: PROVIDER_COLORS[r.provider] ?? '#9ca3af',
                          width: '8rem',
                          flexShrink: 0,
                        }}
                      >
                        {r.provider}
                      </span>
                      <span style={{ color: '#9ca3af', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.model}
                      </span>
                      <span style={{ color: '#6b7280', width: '4rem', textAlign: 'right', flexShrink: 0 }}>
                        {fmtMs(r.latencyMs)}
                      </span>
                      <span style={{ color: '#6b7280', width: '4rem', textAlign: 'right', flexShrink: 0 }}>
                        {fmt$(r.estimatedCostUsd)}
                      </span>
                      <span style={{ color: '#4b5563', width: '5rem', textAlign: 'right', flexShrink: 0 }}>
                        {r.domain ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {!loading && recentRecords.length === 0 && (
            <Card>
              <p className="text-sm text-center py-4" style={{ color: '#4b5563' }}>
                No inference records in the last hour. Use the Governed Inference tab to make your first request.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ── COST ── */}
      {activeTab === 'cost' && (
        <div className="space-y-6">
          {loading && <p style={{ color: '#6b7280' }}>Loading cost data…</p>}

          {!loading && costData && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Total Calls (24h)" value={costData.totals.calls.toLocaleString()} />
                <KpiCard label="Total Cost (24h)" value={fmt$(costData.totals.costUsd)} />
                <KpiCard label="Total Tokens (24h)" value={costData.totals.tokens.toLocaleString()} />
              </div>

              <SectionTitle>Cost by Domain</SectionTitle>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: '#4b5563', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        <th className="text-left pb-3 pr-4">Domain</th>
                        <th className="text-right pb-3 pr-4">Calls</th>
                        <th className="text-right pb-3 pr-4">Tokens</th>
                        <th className="text-right pb-3 pr-4">Cost</th>
                        <th className="text-right pb-3">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costData.byDomain.map((d) => (
                        <tr key={d.domain} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="py-2 pr-4" style={{ color: '#e5e7eb' }}>{d.domain}</td>
                          <td className="py-2 pr-4 text-right" style={{ color: '#9ca3af' }}>{d.calls}</td>
                          <td className="py-2 pr-4 text-right" style={{ color: '#9ca3af' }}>{d.tokens.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right" style={{ color: '#c9b787' }}>{fmt$(d.costUsd)}</td>
                          <td className="py-2 text-right" style={{ color: '#6b7280' }}>
                            {costData.totals.costUsd > 0
                              ? `${((d.costUsd / costData.totals.costUsd) * 100).toFixed(1)}%`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <SectionTitle>Cost by Model</SectionTitle>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: '#4b5563', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        <th className="text-left pb-3 pr-4">Model</th>
                        <th className="text-right pb-3 pr-4">Calls</th>
                        <th className="text-right pb-3 pr-4">Tokens</th>
                        <th className="text-right pb-3">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costData.byModel.map((m) => (
                        <tr key={m.model} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <td className="py-2 pr-4" style={{ color: '#e5e7eb' }}>{m.model}</td>
                          <td className="py-2 pr-4 text-right" style={{ color: '#9ca3af' }}>{m.calls}</td>
                          <td className="py-2 pr-4 text-right" style={{ color: '#9ca3af' }}>{m.tokens.toLocaleString()}</td>
                          <td className="py-2 text-right" style={{ color: '#c9b787' }}>{fmt$(m.costUsd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {costData.byDomain.length === 0 && costData.byModel.length === 0 && (
                <p className="text-sm" style={{ color: '#4b5563' }}>
                  No cost data in the last 24 hours. Inference calls will appear here after requests flow through the gateway.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ── FAILOVER & HEALTH ── */}
      {activeTab === 'failover' && (
        <div className="space-y-6">
          {loading && <p style={{ color: '#6b7280' }}>Loading failover data…</p>}

          {!loading && failoverData && (
            <>
              {failoverData.circuitBreakerTrips.length > 0 && (
                <>
                  <SectionTitle>Circuit Breaker History</SectionTitle>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {failoverData.circuitBreakerTrips.map((cb) => {
                      const style = CIRCUIT_STATE_STYLE[cb.state] ?? CIRCUIT_STATE_STYLE.closed;
                      return (
                        <Card key={cb.provider}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium" style={{ color: '#e5e7eb' }}>{cb.provider}</span>
                            <span className="text-xs font-medium" style={{ color: style.color }}>{style.label}</span>
                          </div>
                          <div className="text-xs space-y-1" style={{ color: '#6b7280' }}>
                            <div className="flex justify-between">
                              <span>Total Trips</span>
                              <span style={{ color: cb.totalTripped > 0 ? '#ef4444' : '#4ade80' }}>{cb.totalTripped}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Consecutive Failures</span>
                              <span>{cb.consecutiveFailures}</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}

              <SectionTitle>Recent Failover Events (1h)</SectionTitle>
              {failoverData.failoverEvents.length === 0 ? (
                <Card>
                  <p className="text-sm text-center py-4" style={{ color: '#4ade80' }}>
                    No failover events in the last hour — all providers healthy.
                  </p>
                </Card>
              ) : (
                <Card>
                  <div className="space-y-1">
                    {failoverData.failoverEvents.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start gap-3 py-2 text-xs"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                          style={{ background: e.success ? '#f59e0b' : '#ef4444' }}
                        />
                        <span style={{ color: '#6b7280', width: '5rem', flexShrink: 0 }}>
                          {timeAgo(e.timestamp)}
                        </span>
                        <span style={{ color: PROVIDER_COLORS[e.provider] ?? '#9ca3af', width: '7rem', flexShrink: 0 }}>
                          {e.provider}
                        </span>
                        <span style={{ color: '#9ca3af', flex: 1 }}>{e.model}</span>
                        <span style={{ color: '#6b7280', flexShrink: 0 }}>
                          {e.retryCount} retr{e.retryCount === 1 ? 'y' : 'ies'}
                        </span>
                        {e.errorType && (
                          <span
                            className="px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', flexShrink: 0, maxWidth: '10rem', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {e.errorType.slice(0, 40)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── GOVERNED INFERENCE ── */}
      {activeTab === 'infer' && (
        <div className="space-y-6">
          <SectionTitle>Test Governed Inference</SectionTitle>
          <Card>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Domain</label>
                  <select
                    value={inferDomain}
                    onChange={(e) => setInferDomain(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb' }}
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Risk Tier</label>
                  <select
                    value={inferTier}
                    onChange={(e) => setInferTier(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb' }}
                  >
                    {RISK_TIER_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Routing Strategy</label>
                  <select
                    value={inferStrategy}
                    onChange={(e) => setInferStrategy(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb' }}
                  >
                    {STRATEGY_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Prompt</label>
                <textarea
                  value={inferPrompt}
                  onChange={(e) => setInferPrompt(e.target.value)}
                  rows={4}
                  placeholder="Enter your prompt here…"
                  className="w-full px-3 py-2 text-sm rounded resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e5e7eb',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { void runInfer(); }}
                  disabled={inferRunning || !inferPrompt.trim()}
                  className="px-4 py-2 rounded text-sm font-medium transition-colors"
                  style={{
                    background: inferRunning || !inferPrompt.trim() ? 'rgba(255,255,255,0.04)' : 'rgba(201,183,135,0.15)',
                    color: inferRunning || !inferPrompt.trim() ? '#4b5563' : '#c9b787',
                    border: '1px solid rgba(201,183,135,0.2)',
                    cursor: inferRunning || !inferPrompt.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {inferRunning ? 'Running…' : 'Run Governed Inference'}
                </button>
                <span className="text-xs" style={{ color: '#4b5563' }}>
                  Guardian policy gate → provider routing → Proof Chain record
                </span>
              </div>
            </div>
          </Card>

          {inferError && (
            <Card>
              <div className="flex items-start gap-2">
                <span style={{ color: '#ef4444' }}>✕</span>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#ef4444' }}>Inference Error</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{inferError}</p>
                </div>
              </div>
            </Card>
          )}

          {inferResult && (
            <div className="space-y-4">
              <SectionTitle>Result</SectionTitle>
              <Card>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Response</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#e5e7eb' }}>
                      {(inferResult.content as string) ?? ''}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                      { label: 'Provider', value: (inferResult.provider as string) ?? '—' },
                      { label: 'Model', value: (inferResult.model as string) ?? '—' },
                      { label: 'Latency', value: fmtMs((inferResult.totalLatencyMs as number) ?? 0) },
                      { label: 'Cost', value: fmt$((inferResult.estimatedCostUsd as number) ?? 0) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs" style={{ color: '#4b5563' }}>{label}</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#9ca3af' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {inferResult.policy && (
                    <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Policy Decision</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}
                        >
                          {((inferResult.policy as Record<string, unknown>).outcome as string) ?? 'allow'}
                        </span>
                        <span className="text-xs" style={{ color: '#4b5563' }}>
                          {((inferResult.policy as Record<string, unknown>).reason as string) ?? ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── CODE AGENT ── */}
      {activeTab === 'code-agent' && (
        <div className="space-y-6">
          <SectionTitle>Sandboxed Code Agent</SectionTitle>
          <Card>
            <p className="text-xs mb-4" style={{ color: '#6b7280' }}>
              Submit analytical tasks to the code agent. Execution is governed by a scope certificate issued
              by the Guardian engine — agents can read data within their permitted domain scope but cannot
              perform writes or external calls without explicit approval.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Domain Scope</label>
                  <select
                    value={codeDomain}
                    onChange={(e) => setCodeDomain(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb' }}
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Risk Tier</label>
                  <select
                    value={codeTier}
                    onChange={(e) => setCodeTier(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb' }}
                  >
                    {RISK_TIER_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#6b7280' }}>Analytical Task</label>
                <textarea
                  value={codeTask}
                  onChange={(e) => setCodeTask(e.target.value)}
                  rows={4}
                  placeholder="Describe an analytical task, e.g.: Calculate the average latency across all providers and identify which domain has the highest cost per inference."
                  className="w-full px-3 py-2 text-sm rounded resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e5e7eb',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { void runCodeAgent(); }}
                  disabled={codeRunning || !codeTask.trim()}
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: codeRunning || !codeTask.trim() ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.15)',
                    color: codeRunning || !codeTask.trim() ? '#4b5563' : '#a78bfa',
                    border: '1px solid rgba(139,92,246,0.2)',
                    cursor: codeRunning || !codeTask.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {codeRunning ? 'Executing…' : 'Execute Code Agent'}
                </button>
                <span className="text-xs" style={{ color: '#4b5563' }}>
                  Scope-certified · Guardian-gated · Proof Chain recorded
                </span>
              </div>
            </div>
          </Card>

          {codeError && (
            <Card>
              <div className="flex items-start gap-2">
                <span style={{ color: '#ef4444' }}>✕</span>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#ef4444' }}>Code Agent Error</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{codeError}</p>
                </div>
              </div>
            </Card>
          )}

          {codeResult && (
            <div className="space-y-4">
              <SectionTitle>Agent Output</SectionTitle>
              <Card>
                <div className="space-y-4">
                  {(codeResult.output as { type: string; code?: string; answer?: string; explanation?: string }) && (
                    <>
                      {(codeResult.output as { type: string; code?: string }).type === 'code' &&
                        (codeResult.output as { code?: string }).code && (
                          <div>
                            <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Generated Code</p>
                            <pre
                              className="text-xs p-3 rounded overflow-x-auto"
                              style={{ background: 'rgba(255,255,255,0.03)', color: '#a78bfa', fontFamily: 'monospace' }}
                            >
                              {(codeResult.output as { code?: string }).code}
                            </pre>
                          </div>
                        )}
                      {(codeResult.output as { answer?: string }).answer && (
                        <div>
                          <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Answer</p>
                          <p className="text-sm whitespace-pre-wrap" style={{ color: '#e5e7eb' }}>
                            {(codeResult.output as { answer?: string }).answer}
                          </p>
                        </div>
                      )}
                      {(codeResult.output as { explanation?: string }).explanation && (
                        <div>
                          <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Explanation</p>
                          <p className="text-sm" style={{ color: '#9ca3af' }}>
                            {(codeResult.output as { explanation?: string }).explanation}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                      { label: 'Model', value: (codeResult.model as string) ?? '—' },
                      { label: 'Execution Time', value: fmtMs((codeResult.execDurationMs as number) ?? 0) },
                      { label: 'Cost', value: fmt$((codeResult.estimatedCostUsd as number) ?? 0) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs" style={{ color: '#4b5563' }}>{label}</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: '#9ca3af' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {codeResult.scopeCertificate && (
                    <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Scope Certificate</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: 'Domain', value: ((codeResult.scopeCertificate as Record<string, unknown>).domain as string) ?? '—' },
                          { label: 'Risk Tier', value: ((codeResult.scopeCertificate as Record<string, unknown>).riskTier as string) ?? '—' },
                          { label: 'Writes Allowed', value: ((codeResult.scopeCertificate as Record<string, unknown>).allowWrites as boolean) ? 'Yes' : 'No' },
                          { label: 'External Calls', value: ((codeResult.scopeCertificate as Record<string, unknown>).allowExternalCalls as boolean) ? 'Yes' : 'No' },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <span style={{ color: '#4b5563' }}>{label}</span>
                            <span style={{ color: value === 'No' ? '#4ade80' : value === 'Yes' ? '#f59e0b' : '#9ca3af' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          <Card>
            <p className="text-xs" style={{ color: '#4b5563' }}>
              <strong style={{ color: '#6b7280' }}>Architecture note:</strong> Code agents operate within
              scope certificates issued by the Guardian engine. The certificate bounds the agent's domain
              scope, write permissions, and external call privileges. Every execution is recorded to the
              Proof Chain for full audit traceability. This pattern is inspired by HuggingFace's smolagents
              "code agents" design but wrapped in A11oy's governance model.
            </p>
          </Card>
        </div>
      )}
    </Layout>
  );
}
