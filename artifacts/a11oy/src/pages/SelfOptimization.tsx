import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar } from '../components/ui';
import { useApiData } from '../hooks/useApiData';

const GOLD = '#c9b787';

interface OptTarget {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  baselineValue: number;
  targetValue: number;
  unit: string;
  delta: number;
  locked: boolean;
  history: number[];
}

const DEMO_OPT_TARGETS: OptTarget[] = [
  { id: 'opt-routing', name: 'Routing Accuracy', category: 'Performance', currentValue: 94.2, baselineValue: 88.0, targetValue: 97.0, unit: '%', delta: 6.2, locked: false, history: [88.0, 89.1, 90.3, 91.2, 92.0, 93.1, 94.2] },
  { id: 'opt-governance', name: 'Governance Precision', category: 'Safety', currentValue: 97.8, baselineValue: 94.0, targetValue: 99.0, unit: '%', delta: 3.8, locked: false, history: [94.0, 94.8, 95.5, 96.2, 96.9, 97.4, 97.8] },
  { id: 'opt-latency', name: 'End-to-End Latency', category: 'Performance', currentValue: 840, baselineValue: 1200, targetValue: 600, unit: 'ms', delta: -360, locked: false, history: [1200, 1120, 1040, 960, 900, 860, 840] },
  { id: 'opt-false-pos', name: 'False Positive Rate', category: 'Accuracy', currentValue: 2.1, baselineValue: 8.4, targetValue: 1.0, unit: '%', delta: -6.3, locked: true, history: [8.4, 6.8, 5.2, 4.1, 3.2, 2.6, 2.1] },
  { id: 'opt-proof-time', name: 'Proof Chain Time', category: 'Performance', currentValue: 4.2, baselineValue: 12.0, targetValue: 2.0, unit: 's', delta: -7.8, locked: false, history: [12.0, 10.2, 8.4, 7.0, 5.8, 4.8, 4.2] },
  { id: 'opt-resource', name: 'Resource Efficiency', category: 'Cost', currentValue: 89.4, baselineValue: 72.0, targetValue: 95.0, unit: '%', delta: 17.4, locked: false, history: [72.0, 75.8, 79.2, 82.6, 85.4, 87.8, 89.4] },
];

const DEMO_REWARD_SIGNALS = [
  { week: 'W1', predicted: 0.82, actual: 0.84, reward: 0.02 },
  { week: 'W2', predicted: 0.84, actual: 0.83, reward: -0.01 },
  { week: 'W3', predicted: 0.85, actual: 0.87, reward: 0.02 },
  { week: 'W4', predicted: 0.87, actual: 0.89, reward: 0.02 },
  { week: 'W5', predicted: 0.88, actual: 0.90, reward: 0.02 },
  { week: 'W6', predicted: 0.90, actual: 0.91, reward: 0.01 },
  { week: 'W7', predicted: 0.91, actual: 0.92, reward: 0.01 },
  { week: 'W8', predicted: 0.92, actual: 0.94, reward: 0.02 },
];

const DEMO_POLICY_GRADIENTS = [
  { parameter: 'Maritime delay threshold', from: '24h', to: '18h', gradient: +0.08, status: 'applied' },
  { parameter: 'Threat escalation confidence', from: '0.95', to: '0.90', gradient: +0.12, status: 'applied' },
  { parameter: 'Pipeline churn alert sensitivity', from: '15%', to: '12%', gradient: +0.05, status: 'pending' },
  { parameter: 'Legal deadline early warning', from: 'T-48h', to: 'T-72h', gradient: +0.03, status: 'applied' },
  { parameter: 'Cap rate compression threshold', from: '20bps', to: '15bps', gradient: +0.06, status: 'pending' },
  { parameter: 'MirrorEval pass threshold', from: '0.80', to: '0.82', gradient: +0.02, status: 'locked' },
];

const GRADIENT_COLORS: Record<string, string> = { applied: '#22c55e', pending: GOLD, locked: '#ef4444' };

export function SelfOptimization() {
  const { data } = useApiData<{ targets: OptTarget[]; rewardSignals: typeof DEMO_REWARD_SIGNALS; policyGradients: typeof DEMO_POLICY_GRADIENTS }>('/pages/optimization', { targets: DEMO_OPT_TARGETS, rewardSignals: DEMO_REWARD_SIGNALS, policyGradients: DEMO_POLICY_GRADIENTS });
  const REWARD_SIGNALS = data.rewardSignals;
  const POLICY_GRADIENTS = data.policyGradients;
  const [activeTab, setActiveTab] = useState<'targets' | 'rewards' | 'gradients'>('targets');
  const [targets, setTargets] = useState(data.targets);
  useEffect(() => { setTargets(data.targets); }, [data.targets]);

  const toggleLock = (id: string) => {
    setTargets(prev => prev.map(t => t.id === id ? { ...t, locked: !t.locked } : t));
  };

  const avgImprovement = Math.round(targets.reduce((a, t) => {
    const range = Math.abs(t.targetValue - t.baselineValue);
    const progress = Math.abs(t.currentValue - t.baselineValue);
    return a + (range > 0 ? (progress / range) * 100 : 0);
  }, 0) / targets.length);

  return (
    <Layout>
      <PageHeader
        label="SELF-OPTIMIZATION ENGINE"
        title="Reinforcement Learning Optimization"
        subtitle="A11oy uses outcome data and reinforcement learning signals to continuously optimize routing thresholds, governance sensitivity, and resource allocation — with human override on every parameter."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="OPT TARGETS" value={targets.length} sub="parameters tracked" accent={GOLD} />
        <KpiCard label="AVG IMPROVEMENT" value={`${avgImprovement}%`} sub="toward target" accent="#22c55e" />
        <KpiCard label="REWARD SIGNAL" value="+0.02" sub="latest week" accent={GOLD} />
        <KpiCard label="LOCKED PARAMS" value={targets.filter(t => t.locked).length} sub="human-locked" accent="#ef4444" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['targets', 'rewards', 'gradients'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all"
            style={{
              background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent',
              color: activeTab === tab ? GOLD : '#5e5e5e',
              border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {tab === 'targets' ? 'Optimization Targets' : tab === 'rewards' ? 'Reward Signal' : 'Policy Gradients'}
          </button>
        ))}
      </div>

      {activeTab === 'targets' && (
        <>
          <SectionTitle>Optimization Targets ({targets.length})</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map(t => {
              const range = Math.abs(t.targetValue - t.baselineValue);
              const progress = Math.abs(t.currentValue - t.baselineValue);
              const pct = range > 0 ? Math.min(Math.round((progress / range) * 100), 100) : 0;
              const improving = (t.targetValue > t.baselineValue && t.delta > 0) || (t.targetValue < t.baselineValue && t.delta < 0);
              const chartData = t.history.map((v, i) => ({ w: `W${i + 1}`, v }));

              return (
                <Card key={t.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{t.name}</div>
                      <div className="text-[9px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{t.category}</div>
                    </div>
                    <button
                      onClick={() => toggleLock(t.id)}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        color: t.locked ? '#ef4444' : '#22c55e',
                        backgroundColor: t.locked ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                        border: `1px solid ${t.locked ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      {t.locked ? '🔒 LOCKED' : '🔓 AUTO'}
                    </button>
                  </div>

                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-mono font-bold" style={{ color: 'var(--color-a11oy-text)' }}>{t.currentValue}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{t.unit}</span>
                    <span className="text-xs font-mono ml-auto" style={{ color: improving ? '#22c55e' : '#ef4444' }}>
                      {t.delta > 0 ? '+' : ''}{t.delta}{t.unit}
                    </span>
                  </div>

                  <div className="mb-2">
                    <ProgressBar value={pct} max={100} color={pct >= 80 ? '#22c55e' : pct >= 50 ? GOLD : '#f97316'} />
                    <div className="flex justify-between text-[9px] mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      <span>Baseline: {t.baselineValue}{t.unit}</span>
                      <span>Target: {t.targetValue}{t.unit}</span>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={48}>
                    <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                      <Line type="monotone" dataKey="v" stroke={GOLD} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'rewards' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <SectionTitle>Reward Signal — Predicted vs Actual Performance</SectionTitle>
            <Card>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={REWARD_SIGNALS} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: '#5e5e5e', fontSize: 10 }} />
                  <YAxis domain={[0.75, 1]} tick={{ fill: '#5e5e5e', fontSize: 10 }} tickFormatter={v => `${Math.round(v * 100)}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }} formatter={(v: number) => [`${Math.round(v * 100)}%`]} />
                  <Line type="monotone" dataKey="predicted" stroke="#8a8a8a" strokeWidth={1.5} dot={false} name="Predicted" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="actual" stroke={GOLD} strokeWidth={2} dot={false} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
          <div>
            <SectionTitle>Reward Delta per Week</SectionTitle>
            <Card>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={REWARD_SIGNALS} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: '#5e5e5e', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#5e5e5e', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}`]} />
                  <Bar dataKey="reward" radius={[3, 3, 0, 0]}>
                    {REWARD_SIGNALS.map((d, i) => (
                      <Cell key={i} fill={d.reward >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <div className="mt-3 p-3 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
              Positive reward = actual outcome exceeded prediction. Negative = prediction was overconfident. The optimization engine adjusts thresholds to maximize cumulative positive reward.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gradients' && (
        <>
          <SectionTitle>Policy Gradient — Threshold Tuning</SectionTitle>
          <div className="flex flex-col gap-3">
            {POLICY_GRADIENTS.map((pg, i) => {
              const color = GRADIENT_COLORS[pg.status];
              return (
                <Card key={i}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{pg.parameter}</div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{pg.from}</span>
                        <span style={{ color: GOLD }}>→</span>
                        <span className="font-mono" style={{ color: GOLD }}>{pg.to}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-mono mb-1" style={{ color: pg.gradient > 0 ? '#22c55e' : '#ef4444' }}>+{pg.gradient.toFixed(2)} gradient</div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>{pg.status}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>Human Override Control</div>
            <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              Any parameter can be locked by a human operator at any time. Locked parameters are excluded from the optimization loop and retain their current value until manually unlocked. The optimization engine never overrides a human lock.
            </p>
          </div>
        </>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Self-optimization is governed by A11oy doctrine — all threshold changes are logged to the Proof Ledger and subject to Covenant Layer review.
      </div>
    </Layout>
  );
}
