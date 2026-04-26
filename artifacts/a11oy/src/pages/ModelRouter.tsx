import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const API = '/api/a11oy';

interface ModelProfile {
  id: string; name: string; provider: string; providerLabel: string; role: string;
  routingModes: string[]; costPer1kTokens: number; avgLatencyMs: number;
  maxContextTokens: number; callsTotal: number; callsToday: number;
  tokensUsedToday: number; costToday: number; failureRate: number;
  fallbackEvents: number; status: string; demoMode: boolean; healthScore: number;
  domains: string[];
}

interface RoutingRule { mode: string; model: string; reason: string; }
interface HealthEntry { id: string; name: string; provider: string; status: string; healthScore: number; latencyMs: number; failureRate: number; demoMode: boolean; }

interface ModelsData { models: ModelProfile[]; routingPolicy: RoutingRule[]; }
interface HealthData { providers: HealthEntry[]; activeProvider: string; fallbackChain: string[]; lastHealthCheck: string; }

const STATUS_MAP: Record<string, 'LIVE' | 'DEMO' | 'ROADMAP'> = {
  active: 'LIVE', roadmap: 'ROADMAP',
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#c9b787', deepseek: '#c9b787', nvidia: '#c9b787', mock: '#8a8a8a', local: '#5e5e5e',
};

const MODE_LABELS: Record<string, string> = {
  fast_triage: 'Fast Triage',
  deep_reasoning: 'Deep Reasoning',
  long_context: 'Long Context',
  code_analysis: 'Code Analysis',
  document_analysis: 'Document Analysis',
  eval_judge: 'Eval Judge',
  board_packet: 'Board Packet',
  proof_reconstruction: 'Proof Reconstruction',
};

export function ModelRouter() {
  const [models, setModels] = useState<ModelsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/models`).then(r => r.json()),
      fetch(`${API}/models/health`).then(r => r.json()),
    ])
      .then(([m, h]) => {
        if (m.ok) setModels(m.data);
        if (h.ok) setHealth(h.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeModels = models?.models.filter(m => m.status === 'active') ?? [];
  const totalCallsToday = models?.models.reduce((s, m) => s + m.callsToday, 0) ?? 0;
  const avgLatency = activeModels.length ? Math.round(activeModels.reduce((s, m) => s + m.avgLatencyMs, 0) / activeModels.length) : 0;

  return (
    <Layout>
      <PageHeader
        label="MODEL ROUTER"
        title="Inference Routing Layer"
        subtitle="Provider-agnostic model routing — task type, domain, token budget, and latency requirements determine which model handles each inference. No single-model dependency."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading model router…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <KpiCard label="MODELS REGISTERED" value={String(models?.models.length ?? 0)} sub={`${activeModels.length} active, ${(models?.models.length ?? 0) - activeModels.length} roadmap`} accent="#c9b787" />
            <KpiCard label="INFERENCES TODAY" value={totalCallsToday.toLocaleString()} sub="Demo estimate" accent="#c9b787" />
            <KpiCard label="AVG LATENCY" value={`${avgLatency}ms`} sub="Active models" accent="#b08d52" />
            <KpiCard label="COST TODAY" value="$0" sub="Demo mode — no real calls" accent="#c9b787" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div>
              <SectionTitle>Model Profiles</SectionTitle>
              <div className="flex flex-col gap-3">
                {models?.models.map(m => (
                  <Card key={m.id}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{m.name}</div>
                        <div className="text-xs" style={{ color: PROVIDER_COLORS[m.provider] ?? '#5e5e5e' }}>{m.providerLabel}</div>
                      </div>
                      <StatusPill status={STATUS_MAP[m.status] ?? 'DEMO'} />
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.role}</p>
                    <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>latency</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.avgLatencyMs}ms</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>today</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.callsToday}</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>fail rate</div><div style={{ color: m.failureRate > 0.02 ? '#c9b787' : '#c9b787' }}>{(m.failureRate * 100).toFixed(1)}%</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>health</div><div style={{ color: m.healthScore >= 95 ? '#c9b787' : m.healthScore >= 80 ? '#c9b787' : '#5e5e5e' }}>{m.healthScore}</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.routingModes.map(mode => (
                        <span key={mode} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                          {MODE_LABELS[mode] ?? mode}
                        </span>
                      ))}
                    </div>
                    {m.fallbackEvents > 0 && (
                      <div className="mt-1.5 text-xs" style={{ color: '#c9b787' }}>⚠ {m.fallbackEvents} fallback event{m.fallbackEvents > 1 ? 's' : ''}</div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle>Routing Policy</SectionTitle>
              <div className="flex flex-col gap-2 mb-6">
                {models?.routingPolicy.map(rule => (
                  <Card key={rule.mode}>
                    <div className="text-xs font-mono mb-0.5" style={{ color: 'var(--color-a11oy-gold)' }}>
                      MODE: {MODE_LABELS[rule.mode] ?? rule.mode}
                    </div>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                      → <span style={{ color: '#c9b787' }}>{rule.model}</span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{rule.reason}</div>
                  </Card>
                ))}
              </div>

              {health && (
                <>
                  <SectionTitle>Provider Health</SectionTitle>
                  <Card>
                    <div className="text-xs mb-3 flex items-center gap-2">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Active provider:</span>
                      <span className="font-mono" style={{ color: PROVIDER_COLORS[health.activeProvider] ?? '#5e5e5e' }}>{health.activeProvider}</span>
                      <span className="text-xs px-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787' }}>demo mode</span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Fallback chain: {health.fallbackChain.map((p, i) => (
                        <span key={p}>
                          <span style={{ color: PROVIDER_COLORS[p] ?? '#5e5e5e' }}>{p}</span>
                          {i < health.fallbackChain.length - 1 && <span style={{ color: 'var(--color-a11oy-text-ghost)' }}> → </span>}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-2 mt-3">
                      {health.providers.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span style={{ color: PROVIDER_COLORS[p.provider] ?? '#5e5e5e' }}>{p.name}</span>
                          <div className="flex items-center gap-2">
                            <span style={{ color: p.healthScore >= 90 ? '#c9b787' : p.healthScore >= 70 ? '#c9b787' : '#5e5e5e' }}>{p.healthScore > 0 ? `${p.healthScore}%` : 'unavailable'}</span>
                            <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.latencyMs}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Last check: {new Date(health.lastHealthCheck).toLocaleTimeString('en-US')}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
            <DemoBadge /> Demo mode — all inference routing is illustrative. Provider keys are read from environment variables; missing keys fall back to mock provider. No real model API calls.
          </div>
        </>
      )}
    </Layout>
  );
}
