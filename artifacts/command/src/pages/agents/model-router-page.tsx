import { useState } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Zap, Clock, DollarSign, Activity } from 'lucide-react';
import { MODEL_PROVIDERS } from '@szl/a11oy-runtime';

const ROUTING_RULES = [
  { condition: 'No API keys configured', provider: 'A11oy Mock Provider', reason: 'Demo mode — all calls return mock results with realistic latency.' },
  { condition: 'MODEL_PROVIDER=openai', provider: 'OpenAI', reason: 'Uses GPT-4o-mini for fast tasks, o1-preview for reasoning.' },
  { condition: 'MODEL_PROVIDER=deepseek', provider: 'DeepSeek', reason: 'Uses deepseek-reasoner for complex reasoning, deepseek-chat for fast tasks.' },
  { condition: 'MODEL_PROVIDER=nvidia', provider: 'NVIDIA NIM', reason: 'Uses NVIDIA Llama 70B for reasoning, 8B for fast tasks.' },
  { condition: 'MODEL_PROVIDER=local', provider: 'Local Open Model', reason: 'Uses Ollama endpoint — no API cost, highest latency.' },
];

const ROUTING_METRICS = [
  { operator: 'Planner', model: 'reasoning', tokens: 128000, calls: 47, avgLatencyMs: 3200, avgCostUsd: 0.052 },
  { operator: 'Analyst', model: 'reasoning', tokens: 245000, calls: 98, avgLatencyMs: 2800, avgCostUsd: 0.038 },
  { operator: 'Risk', model: 'reasoning', tokens: 89000, calls: 82, avgLatencyMs: 2400, avgCostUsd: 0.031 },
  { operator: 'Proof', model: 'reasoning', tokens: 312000, calls: 44, avgLatencyMs: 4100, avgCostUsd: 0.071 },
  { operator: 'Action', model: 'fast', tokens: 64000, calls: 31, avgLatencyMs: 800, avgCostUsd: 0.008 },
  { operator: 'Verification', model: 'fast', tokens: 72000, calls: 38, avgLatencyMs: 900, avgCostUsd: 0.009 },
  { operator: 'Board Packet', model: 'reasoning', tokens: 198000, calls: 12, avgLatencyMs: 5200, avgCostUsd: 0.094 },
  { operator: 'Connector', model: 'fast', tokens: 48000, calls: 124, avgLatencyMs: 600, avgCostUsd: 0.005 },
  { operator: 'Evaluator', model: 'reasoning', tokens: 142000, calls: 67, avgLatencyMs: 2100, avgCostUsd: 0.027 },
];

export function ModelRouterPage() {
  const [activeProvider, setActiveProvider] = useState('mock');

  const currentProvider = MODEL_PROVIDERS.find((p) => p.id === activeProvider);
  const totalTokens = ROUTING_METRICS.reduce((s, r) => s + r.tokens, 0);
  const totalCalls = ROUTING_METRICS.reduce((s, r) => s + r.calls, 0);
  const totalCost = ROUTING_METRICS.reduce((s, r) => s + r.avgCostUsd * r.calls, 0);

  return (
    <div style={{ background: '#080c14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: 'rgba(77,143,204,0.15)', border: '1px solid rgba(77,143,204,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Cpu size={18} color="#4d8fcc" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Model Router</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Provider selection · routing rules · per-operator model assignment</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '5px 12px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 11, color: '#22c55e' }}>Demo Mode — Mock Provider Active</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderBottom: '1px solid #1e293b' }}>
        {[
          { label: 'Total Tokens (7d)', value: (totalTokens / 1000).toFixed(0) + 'K', color: '#8b7ac8', icon: Activity },
          { label: 'Total Calls (7d)', value: totalCalls.toLocaleString(), color: '#4d8fcc', icon: Zap },
          { label: 'Avg Latency', value: `${((ROUTING_METRICS.reduce((s, r) => s + r.avgLatencyMs, 0) / ROUTING_METRICS.length) / 1000).toFixed(2)}s`, color: '#d4a054', icon: Clock },
          { label: 'Total Cost (7d)', value: `$${totalCost.toFixed(2)}`, color: '#22c55e', icon: DollarSign },
        ].map((s) => (
          <div key={s.label} style={{ padding: '16px 24px', background: '#080c14' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <s.icon size={14} color={s.color} />
              <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: 'calc(100vh - 200px)' }}>
        {/* Provider List */}
        <div style={{ borderRight: '1px solid #1e293b', overflow: 'auto', padding: 20 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Model Providers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODEL_PROVIDERS.map((p) => {
              const isActive = activeProvider === p.id;
              const statusColor = p.isAvailable ? '#22c55e' : '#ef4444';

              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProvider(p.id)}
                  style={{
                    background: isActive ? 'rgba(77,143,204,0.08)' : '#0f172a',
                    border: `1px solid ${isActive ? 'rgba(77,143,204,0.3)' : '#1e293b'}`,
                    borderRadius: 10, padding: 14, cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                      <span style={{ fontSize: 10, color: statusColor }}>{p.isAvailable ? 'Available' : 'No API key'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                    {p.isMock ? 'Demo mock — no API calls' : `Env: ${p.envKey}`}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <div><div style={{ fontSize: 9, color: '#475569' }}>Reasoning</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{p.reasoningModel.slice(0, 20)}</div></div>
                    <div><div style={{ fontSize: 9, color: '#475569' }}>Fast</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{p.fastModel.slice(0, 20)}</div></div>
                    <div><div style={{ fontSize: 9, color: '#475569' }}>Cost / 1K tokens</div><div style={{ fontSize: 10, color: p.costPer1kTokens === 0 ? '#22c55e' : '#d4a054' }}>{p.costPer1kTokens === 0 ? 'Free' : `$${p.costPer1kTokens}`}</div></div>
                    <div><div style={{ fontSize: 9, color: '#475569' }}>Latency</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{p.latencyProfile}</div></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Routing Rules */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Routing Rules</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ROUTING_RULES.map((r, i) => (
                <div key={i} style={{ background: '#0f172a', borderRadius: 6, border: '1px solid #1e293b', padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: '#8b7ac8', fontFamily: 'monospace', marginBottom: 4 }}>{r.condition}</div>
                  <div style={{ fontSize: 10, color: '#d4a054', marginBottom: 3 }}>→ {r.provider}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{r.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-Operator Routing Table */}
        <div style={{ overflow: 'auto', padding: 20 }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Per-Operator Model Assignment</div>
          <div style={{ background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 0.8fr 0.8fr 1fr', padding: '10px 16px', borderBottom: '1px solid #1e293b' }}>
              {['Operator', 'Model Type', 'Tokens (7d)', 'Calls', 'Avg Latency', 'Avg Cost/Call'].map((h) => (
                <div key={h} style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {ROUTING_METRICS.map((r, i) => (
              <div key={r.operator} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 0.8fr 0.8fr 1fr', padding: '12px 16px', borderBottom: i < ROUTING_METRICS.length - 1 ? '1px solid rgba(30,41,59,0.5)' : 'none' }}>
                <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{r.operator}</div>
                <div>
                  <span style={{ fontSize: 10, color: r.model === 'reasoning' ? '#8b7ac8' : '#4d8fcc', background: r.model === 'reasoning' ? 'rgba(139,122,200,0.1)' : 'rgba(77,143,204,0.1)', border: `1px solid ${r.model === 'reasoning' ? 'rgba(139,122,200,0.25)' : 'rgba(77,143,204,0.25)'}`, borderRadius: 10, padding: '2px 8px' }}>
                    {r.model}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{(r.tokens / 1000).toFixed(0)}K</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.calls}</div>
                <div style={{ fontSize: 12, color: r.avgLatencyMs > 3000 ? '#d4a054' : '#22c55e' }}>{(r.avgLatencyMs / 1000).toFixed(1)}s</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>${r.avgCostUsd.toFixed(3)}</div>
              </div>
            ))}
          </div>

          {/* Env Key Status */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Environment Key Status</div>
            <div style={{ background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b', padding: 16 }}>
              {[
                { key: 'OPENAI_API_KEY', status: 'not set' },
                { key: 'DEEPSEEK_API_KEY', status: 'not set' },
                { key: 'NVIDIA_API_KEY', status: 'not set' },
                { key: 'MODEL_PROVIDER', status: 'not set — default: mock' },
                { key: 'DEFAULT_REASONING_MODEL', status: 'not set — default: provider default' },
                { key: 'DEFAULT_FAST_MODEL', status: 'not set — default: provider default' },
              ].map((e, i) => (
                <div key={e.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid #0a0f1a' : 'none' }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{e.key}</span>
                  <span style={{ fontSize: 11, color: e.status.startsWith('not set') ? '#475569' : '#22c55e' }}>{e.status}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(139,122,200,0.06)', borderRadius: 6, border: '1px solid rgba(139,122,200,0.15)' }}>
                <div style={{ fontSize: 11, color: '#8b7ac8' }}>→ Demo mode active — all model calls use A11oy Mock Provider. No API keys required.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelRouterPage;
