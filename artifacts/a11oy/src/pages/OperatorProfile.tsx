import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { useApiData } from '../hooks/useApiData';

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  gold: '#b08d52',
};

type QVerdict = 'HEALTHY' | 'DEGRADED' | 'OVER_BUDGET';

interface OperatorProfileType {
  id: string;
  name: string;
  role: string;
  domains: string[];
  trustScore: number;
  decisionsMade: number;
  avgResponseMs: number;
  approvalRate: number;
  overrideRate: number;
  deferralRate: number;
  fatigueSignal: 'low' | 'medium' | 'high';
  decisionPatterns: Array<{ actionType: string; approvalRate: number; avgLatencyMs: number; count: number }>;
  domainEngagement: Array<{ domain: string; engagementScore: number }>;
  responseTimeTrend: Array<{ week: string; avgMs: number }>;
  overrideHistory: Array<{ date: string; policy: string; reason: string }>;
  // ─── ouroboros-resonance@{computeQFactor, measureCadence} ───
  qFactor?: number;
  qFactorVerdict?: QVerdict;
  qFactorWorkUseful?: number;
  qFactorWorkLost?: number;
  cadenceFrequency?: number;
  cadenceJitter?: number;
  cadenceMatch?: number;
  resonancePrimitive?: string;
}

const Q_VERDICT_STYLE: Record<QVerdict, { color: string }> = {
  HEALTHY:     { color: '#22c55e' },
  DEGRADED:    { color: '#f97316' },
  OVER_BUDGET: { color: '#ef4444' },
};

interface DelegationRouting {
  operator: string;
  strength: string;
  avoid: string;
  reason: string;
}

interface OperatorProfilesPayload {
  profiles: OperatorProfileType[];
  delegationRouting: DelegationRouting[];
}

interface OperatorMeta {
  total: number;
  totalDecisions: number;
  fatigueSignals: number;
  overrideEvidence: number;
}

const FATIGUE_STYLE = {
  low: { color: '#22c55e', label: 'LOW', desc: 'Decision quality consistent. Response times stable.' },
  medium: { color: '#c9b787', label: 'MEDIUM', desc: 'Response times trending upward over last 3 weeks. Monitor for continued increase.' },
  high: { color: '#ef4444', label: 'HIGH', desc: 'Significant response time increase + rising override rate. Consider workload redistribution.' },
};

export function OperatorProfile() {
  const [activeTab, setActiveTab] = useState<'profile' | 'delegation' | 'welfare' | 'amendments'>('profile');
  const [selectedId, setSelectedId] = useState<string>('op-001');

  const { data: payload, meta } = useApiData<OperatorProfilesPayload>('/adaptive/operators/profiles') as {
    data: OperatorProfilesPayload | null;
    meta: OperatorMeta | null;
    loading: boolean;
    error: string | null;
    source: 'api' | 'demo';
  };

  const profiles = payload?.profiles ?? [];
  const delegationRouting = payload?.delegationRouting ?? [];
  const selectedOp = profiles.find(p => p.id === selectedId) ?? profiles[0];

  const totalDecisions = (meta as OperatorMeta | null)?.totalDecisions ?? profiles.reduce((a, o) => a + o.decisionsMade, 0);
  const fatigueSignals = (meta as OperatorMeta | null)?.fatigueSignals ?? profiles.filter(o => o.fatigueSignal !== 'low').length;
  const overrideEvidence = (meta as OperatorMeta | null)?.overrideEvidence ?? profiles.reduce((a, o) => a + o.overrideHistory.length, 0);

  const TABS = [
    { id: 'profile' as const, label: 'Decision Profile' },
    { id: 'delegation' as const, label: 'Delegation Routing' },
    { id: 'welfare' as const, label: 'Welfare Signals' },
    { id: 'amendments' as const, label: 'Amendment Evidence' },
  ];

  if (!selectedOp) {
    return (
      <Layout>
        <PageHeader label="OPERATORS · A11OY.1" title="Operator Decision Profiles" subtitle="Loading operator profiles…" status="LIVE" />
        <div className="text-center py-16 text-xs" style={{ color: T.muted }}>Loading from API…</div>
      </Layout>
    );
  }

  const fatigue = FATIGUE_STYLE[selectedOp.fatigueSignal];
  const latencyTrend = selectedOp.responseTimeTrend;
  const isLatencyIncreasing = latencyTrend[latencyTrend.length - 1].avgMs > latencyTrend[0].avgMs;

  return (
    <Layout>
      <PageHeader
        label="OPERATORS · A11OY.1"
        title="Operator Decision Profiles"
        subtitle="Per-operator decision patterns, approval rates by action type and domain, response time trends, and welfare-aware fatigue detection. Override patterns feed into the Adaptive Governance Loop as amendment evidence."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="OPERATORS PROFILED" value={profiles.length} sub="active decision makers" accent="#c9b787" />
        <KpiCard label="DECISIONS THIS MONTH" value={totalDecisions} sub="across all operators" accent="#c9b787" />
        <KpiCard label="FATIGUE SIGNALS" value={fatigueSignals} sub="operators flagged" accent="#c9b787" />
        <KpiCard label="OVERRIDE EVIDENCE" value={overrideEvidence} sub="fed to governance loop" accent="#c9b787" />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SectionTitle>Operators</SectionTitle>
          <div className="flex flex-col gap-2">
            {profiles.map(op => {
              const isSelected = selectedId === op.id;
              const ft = FATIGUE_STYLE[op.fatigueSignal];
              return (
                <button
                  key={op.id}
                  onClick={() => setSelectedId(op.id)}
                  className="text-left w-full rounded p-3 transition-colors"
                  style={{ background: isSelected ? `${T.accent}12` : T.surface, border: `1px solid ${isSelected ? T.accent + '44' : T.border}` }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: T.text }}>{op.name}</span>
                    <span className="text-[9px] font-mono" style={{ color: ft.color }}>●</span>
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: T.muted }}>{op.role}</div>
                  <div className="text-[10px] font-mono mt-1" style={{ color: T.accent }}>{Math.round(op.approvalRate * 100)}% approval · trust {op.trustScore}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex gap-2 mb-4 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="text-[11px] font-mono px-3 py-1.5 rounded"
                style={{
                  background: activeTab === tab.id ? `${T.accent}22` : T.surface,
                  color: activeTab === tab.id ? T.accent : T.dim,
                  border: `1px solid ${activeTab === tab.id ? T.accent + '44' : T.border}`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <div className="flex flex-col gap-4">
              <Card>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'DECISIONS', value: selectedOp.decisionsMade },
                    { label: 'APPROVAL RATE', value: `${Math.round(selectedOp.approvalRate * 100)}%` },
                    { label: 'OVERRIDE RATE', value: `${Math.round(selectedOp.overrideRate * 100)}%` },
                    { label: 'AVG RESPONSE', value: `${(selectedOp.avgResponseMs / 1000).toFixed(1)}s` },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-2 rounded" style={{ background: T.surface }}>
                      <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>{label}</div>
                      <div className="text-sm font-semibold" style={{ color: T.accent }}>{value}</div>
                    </div>
                  ))}
                </div>
                {selectedOp.qFactor !== undefined && selectedOp.cadenceMatch !== undefined && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded" style={{ background: 'rgba(167,139,250,0.06)', border: `1px solid ${T.border}` }} title="ouroboros-resonance@computeQFactor — Q = workUseful / (workUseful + workLost)">
                      <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>Q-FACTOR (resonance)</div>
                      <div className="text-sm font-semibold" style={{ color: selectedOp.qFactorVerdict ? Q_VERDICT_STYLE[selectedOp.qFactorVerdict].color : T.accent }}>
                        {selectedOp.qFactor.toFixed(3)}
                      </div>
                      {selectedOp.qFactorVerdict && (
                        <div className="text-[8px] font-mono mt-0.5" style={{ color: Q_VERDICT_STYLE[selectedOp.qFactorVerdict].color }}>{selectedOp.qFactorVerdict}</div>
                      )}
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: 'rgba(56,189,248,0.06)', border: `1px solid ${T.border}` }} title="ouroboros-resonance@measureCadence — phase coherence between operator cadence and target cadence (0–1)">
                      <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>CADENCE MATCH</div>
                      <div className="text-sm font-semibold" style={{ color: selectedOp.cadenceMatch >= 0.7 ? '#22c55e' : selectedOp.cadenceMatch >= 0.4 ? T.accent : '#f97316' }}>
                        {(selectedOp.cadenceMatch * 100).toFixed(1)}%
                      </div>
                      {selectedOp.cadenceFrequency !== undefined && (
                        <div className="text-[8px] font-mono mt-0.5" style={{ color: T.muted }}>
                          {selectedOp.cadenceFrequency.toFixed(3)} Hz
                          {selectedOp.cadenceJitter !== undefined && ` · jitter ${selectedOp.cadenceJitter.toFixed(3)}`}
                        </div>
                      )}
                    </div>
                    {selectedOp.qFactorWorkUseful !== undefined && selectedOp.qFactorWorkLost !== undefined && (
                      <div className="text-center p-2 rounded" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>WORK USEFUL / LOST</div>
                        <div className="text-sm font-semibold" style={{ color: T.dim }}>
                          <span style={{ color: '#22c55e' }}>{selectedOp.qFactorWorkUseful.toFixed(2)}</span>
                          {' / '}
                          <span style={{ color: '#ef4444' }}>{selectedOp.qFactorWorkLost.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-[10px] font-mono mb-2" style={{ color: T.muted }}>RESPONSE TIME TREND (8 weeks)</div>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={selectedOp.responseTimeTrend} margin={{ top: 2, right: 8, bottom: 2, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="week" tick={{ fill: T.muted, fontSize: 9 }} />
                    <YAxis tick={{ fill: T.muted, fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#111', border: `1px solid ${T.border}`, borderRadius: 6 }} formatter={(v: number) => [`${(v / 1000).toFixed(1)}s`, 'Avg Response']} />
                    <Line type="monotone" dataKey="avgMs" stroke={isLatencyIncreasing ? '#f97316' : '#22c55e'} dot={false} strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
                {isLatencyIncreasing && (
                  <div className="mt-2 text-[10px] font-mono" style={{ color: '#f97316' }}>⚠ Response time trending upward — welfare signal flagged</div>
                )}
              </Card>

              <Card>
                <div className="text-[10px] font-mono mb-3" style={{ color: T.muted }}>APPROVAL RATE BY ACTION TYPE</div>
                <div className="flex flex-col gap-2">
                  {selectedOp.decisionPatterns.map(dp => (
                    <div key={dp.actionType} className="flex items-center gap-3">
                      <div className="text-[10px] font-mono w-36 shrink-0" style={{ color: T.dim }}>{dp.actionType.replace(/_/g, ' ')}</div>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${dp.approvalRate * 100}%`, background: dp.approvalRate >= 0.85 ? '#22c55e' : dp.approvalRate >= 0.70 ? T.accent : '#f97316' }} />
                      </div>
                      <span className="text-[10px] font-mono w-8 text-right" style={{ color: T.accent }}>{Math.round(dp.approvalRate * 100)}%</span>
                      <span className="text-[9px] font-mono w-12 text-right" style={{ color: T.muted }}>{(dp.avgLatencyMs / 1000).toFixed(1)}s · {dp.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="text-[10px] font-mono mb-3" style={{ color: T.muted }}>DOMAIN ENGAGEMENT</div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedOp.domainEngagement}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="domain" tick={{ fill: T.muted, fontSize: 9 }} />
                    <Radar name={selectedOp.name} dataKey="engagementScore" stroke={T.accent} fill={T.accent} fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {activeTab === 'delegation' && (
            <div className="flex flex-col gap-4">
              <div className="mb-2 p-3 rounded border" style={{ background: 'rgba(201,183,135,0.06)', borderColor: 'rgba(201,183,135,0.2)' }}>
                <div className="text-xs" style={{ color: T.dim, lineHeight: 1.7 }}>
                  Delegation routing intelligence learns which action types and risk levels each operator handles well. The approval queue routes accordingly — high-confidence maritime actions go to VP Operations; discovery escalations go to General Counsel; threat responses go to CISO.
                </div>
              </div>
              {delegationRouting.map(dr => (
                <Card key={dr.operator}>
                  <div className="text-sm font-semibold mb-2" style={{ color: T.text }}>{dr.operator}</div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <div className="text-[9px] font-mono mb-1" style={{ color: '#22c55e' }}>STRONG FIT</div>
                      <p className="text-xs" style={{ color: T.dim }}>{dr.strength}</p>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono mb-1" style={{ color: '#ef4444' }}>AVOID ROUTING</div>
                      <p className="text-xs" style={{ color: T.dim }}>{dr.avoid}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono" style={{ color: T.muted }}>{dr.reason}</p>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'welfare' && (
            <div className="flex flex-col gap-4">
              <div className="mb-2 p-3 rounded border" style={{ background: 'rgba(201,183,135,0.06)', borderColor: 'rgba(201,183,135,0.2)' }}>
                <div className="text-xs" style={{ color: T.dim, lineHeight: 1.7 }}>
                  Welfare-aware operator monitoring adapts from the A11oy Model Welfare Program (Anthropic, 2025–2026). If an operator shows signs of decision fatigue — increasing response times, rising override rate, declining approval quality — the system surfaces this here and adjusts briefing synthesis to reduce cognitive load.
                </div>
              </div>
              {profiles.map(op => {
                const ft = FATIGUE_STYLE[op.fatigueSignal];
                const latencyUp = op.responseTimeTrend[op.responseTimeTrend.length - 1].avgMs > op.responseTimeTrend[0].avgMs;
                return (
                  <Card key={op.id}>
                    <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: T.text }}>{op.name}</div>
                        <div className="text-[10px] font-mono" style={{ color: T.muted }}>{op.role}</div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: `${ft.color}18`, color: ft.color }}>FATIGUE: {ft.label}</span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: T.dim, lineHeight: 1.6 }}>{ft.desc}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded" style={{ background: T.surface }}>
                        <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>AVG LATENCY</div>
                        <div className="text-xs font-semibold" style={{ color: latencyUp ? '#f97316' : '#22c55e' }}>{(op.avgResponseMs / 1000).toFixed(1)}s {latencyUp ? '↑' : '→'}</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ background: T.surface }}>
                        <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>OVERRIDE RATE</div>
                        <div className="text-xs font-semibold" style={{ color: op.overrideRate > 0.12 ? '#f97316' : '#22c55e' }}>{Math.round(op.overrideRate * 100)}%</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ background: T.surface }}>
                        <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>TRUST SCORE</div>
                        <div className="text-xs font-semibold" style={{ color: T.accent }}>{op.trustScore}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {activeTab === 'amendments' && (
            <div>
              <div className="mb-4 p-3 rounded border" style={{ background: 'rgba(201,183,135,0.06)', borderColor: 'rgba(201,183,135,0.2)' }}>
                <div className="text-xs" style={{ color: T.dim, lineHeight: 1.7 }}>
                  Operator override patterns feed into the Adaptive Governance Loop as evidence for amendment proposals. When an operator consistently overrides the same policy, this is a signal the policy may need calibration — not the operator.
                </div>
              </div>
              <SectionTitle>Override History — {selectedOp.name}</SectionTitle>
              {selectedOp.overrideHistory.length === 0 ? (
                <Card><div className="text-center py-6 text-xs" style={{ color: T.muted }}>No overrides recorded for this operator</div></Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedOp.overrideHistory.map((ov, i) => (
                    <Card key={i}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono" style={{ color: T.accent }}>{ov.date}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: T.dim }}>{ov.policy}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded ml-auto" style={{ background: 'rgba(201,183,135,0.1)', color: T.accent }}>AMENDMENT EVIDENCE</span>
                      </div>
                      <p className="text-xs" style={{ color: T.dim, lineHeight: 1.6 }}>{ov.reason}</p>
                    </Card>
                  ))}
                  <div className="p-3 rounded border text-xs" style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)', color: '#86efac' }}>
                    {selectedOp.overrideHistory.length} override(s) queued as evidence for policy amendment review.{' '}
                    {selectedOp.overrideHistory.length >= 2
                      ? `Amendment proposal may be generated for ${selectedOp.overrideHistory[0].policy} — threshold: 3 overrides in 90 days.`
                      : 'Insufficient overrides for automatic amendment proposal. Threshold: 3 in 90 days.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
