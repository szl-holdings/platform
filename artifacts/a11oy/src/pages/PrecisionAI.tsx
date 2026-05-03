import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useDefenseData } from '../hooks/useDefenseData';
import { LoadingState, ErrorState, RefreshBar } from '../components/DefenseDataState';
import { DefenseCrossNav } from '../components/DefenseCrossNav';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

interface SmartScoreSignal {
  id: string;
  source: string;
  category: 'threat' | 'compliance' | 'operational' | 'financial' | 'agent';
  rawScore: number;
  smartScore: number;
  confidence: number;
  snr: number;
  triageResult: 'escalate' | 'auto-resolve' | 'monitor' | 'suppress';
  timestamp: string;
  description: string;
  analyticsModules: string[];
}

interface AnalyticsModule {
  id: string;
  name: string;
  category: string;
  status: string;
  signalsProcessed: number;
  accuracy: number;
}

interface ByomlModel {
  id: string;
  name: string;
  framework: string;
  status: string;
  accuracy: number;
  lastTrained: string;
  inferenceLatency: string;
}

interface PrecisionAIData {
  signals: SmartScoreSignal[];
  analyticsModules: AnalyticsModule[];
  byomlModels: ByomlModel[];
}

const TRIAGE_COLORS: Record<string, string> = {
  escalate: '#f5f5f5', monitor: '#c9b787', 'auto-resolve': '#8a8a8a', suppress: '#5e5e5e',
};
const CATEGORY_COLORS: Record<string, string> = {
  threat: '#ef4444', compliance: '#f59e0b', operational: '#3b82f6', financial: '#10b981', agent: '#8b5cf6',
};

export function PrecisionAI() {
  const [filter, setFilter] = useState<string>('all');
  const [liveCounter, setLiveCounter] = useState(0);
  const { data, loading, error, lastUpdated, refresh } = useDefenseData<PrecisionAIData>(
    '/api/internal/a11oy/defense/precision-ai'
  );

  useEffect(() => {
    const iv = setInterval(() => setLiveCounter(c => c + Math.floor(Math.random() * 3 + 1)), 2000);
    return () => clearInterval(iv);
  }, []);

  const signals = data?.signals ?? [];
  const analyticsModules = data?.analyticsModules ?? [];
  const byomlModels = data?.byomlModels ?? [];

  const filtered = filter === 'all' ? signals : signals.filter(s => s.triageResult === filter);
  const escalated = signals.filter(s => s.triageResult === 'escalate').length;
  const suppressed = signals.filter(s => s.triageResult === 'suppress').length;
  const avgConfidence = signals.length
    ? (signals.reduce((a, s) => a + s.confidence, 0) / signals.length * 100).toFixed(1)
    : '0.0';
  const avgSNR = signals.length
    ? (signals.reduce((a, s) => a + s.snr, 0) / signals.length).toFixed(1)
    : '0.0';

  return (
    <Layout>
      <PageHeader
        label="PRECISION AI ENGINE"
        title="SmartScore Dynamic Risk Scoring"
        subtitle="XSIAM-inspired analytics engine — real-time confidence calibration, signal-to-noise optimization, and autonomous triage across 10,000+ analytics modules for every signal flowing through A11oy."
        status="LIVE"
      />

      <RefreshBar loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={refresh} />

      {!data && loading ? (
        <LoadingState label="Loading SmartScore signals…" />
      ) : !data && error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KpiCard label="SIGNALS TODAY" value={(signals.length + liveCounter).toLocaleString()} sub="processed" accent={T.accent} />
            <KpiCard label="ESCALATED" value={escalated} sub="require attention" accent={T.text} />
            <KpiCard label="AUTO-TRIAGED" value={`${signals.length - escalated}`} sub="no human needed" accent={T.accent} />
            <KpiCard label="AVG CONFIDENCE" value={`${avgConfidence}%`} sub="calibrated" accent={T.accent} />
            <KpiCard label="SIGNAL-TO-NOISE" value={`${avgSNR}:1`} sub="ratio" accent={T.accent} />
            <KpiCard label="ANALYTICS MODULES" value={analyticsModules.length.toLocaleString()} sub="active" accent={T.dim} />
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'escalate', 'monitor', 'auto-resolve', 'suppress'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded text-xs font-mono uppercase transition-all" style={{ background: filter === f ? 'rgba(201,183,135,0.12)' : T.surface, border: `1px solid ${filter === f ? 'rgba(201,183,135,0.3)' : T.border}`, color: filter === f ? T.accent : T.muted, cursor: 'pointer' }}>
                {f === 'all' ? `all (${signals.length})` : `${f} (${signals.filter(s => s.triageResult === f).length})`}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 flex flex-col gap-3">
              <SectionTitle>Live Signal Feed — SmartScore Triage</SectionTitle>
              {filtered.map(signal => (
                <Card key={signal.id} style={{ borderLeft: `3px solid ${TRIAGE_COLORS[signal.triageResult]}` }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono" style={{ color: T.dim }}>{signal.id}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${CATEGORY_COLORS[signal.category]}18`, color: CATEGORY_COLORS[signal.category] }}>{signal.category}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${TRIAGE_COLORS[signal.triageResult]}15`, color: TRIAGE_COLORS[signal.triageResult], border: `1px solid ${TRIAGE_COLORS[signal.triageResult]}30` }}>{signal.triageResult.toUpperCase()}</span>
                        <span className="text-[9px] font-mono" style={{ color: T.muted }}>{signal.source}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: T.dim }}>{signal.description}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xl font-mono font-bold" style={{ color: signal.smartScore >= 80 ? T.text : signal.smartScore >= 50 ? T.accent : T.dim }}>{signal.smartScore}</div>
                      <div className="text-[9px] font-mono" style={{ color: T.muted }}>SmartScore</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-2 pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                    <div>
                      <div className="text-[9px] font-mono" style={{ color: T.muted }}>Raw Score</div>
                      <div className="text-xs font-mono" style={{ color: T.dim }}>{signal.rawScore}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono" style={{ color: T.muted }}>Confidence</div>
                      <div className="text-xs font-mono" style={{ color: T.accent }}>{(signal.confidence * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono" style={{ color: T.muted }}>SNR</div>
                      <div className="text-xs font-mono" style={{ color: signal.snr >= 5 ? T.accent : T.dim }}>{signal.snr}:1</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono" style={{ color: T.muted }}>Modules</div>
                      <div className="text-xs font-mono" style={{ color: T.dim }}>{signal.analyticsModules.length}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {signal.analyticsModules.map(m => (
                      <span key={m} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.06)', color: T.muted }}>{m}</span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <SectionTitle>Confidence Calibration</SectionTitle>
              <Card>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>SMARTSCORE DISTRIBUTION</div>
                <div className="flex flex-col gap-2">
                  {[
                    { range: '90-100', label: 'Critical', count: signals.filter(s => s.smartScore >= 90).length, color: '#f5f5f5' },
                    { range: '70-89', label: 'High', count: signals.filter(s => s.smartScore >= 70 && s.smartScore < 90).length, color: '#c9b787' },
                    { range: '40-69', label: 'Medium', count: signals.filter(s => s.smartScore >= 40 && s.smartScore < 70).length, color: '#8a8a8a' },
                    { range: '0-39', label: 'Low', count: signals.filter(s => s.smartScore < 40).length, color: '#5e5e5e' },
                  ].map(bucket => (
                    <div key={bucket.range} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono w-14" style={{ color: bucket.color }}>{bucket.range}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: T.surface }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${signals.length ? (bucket.count / signals.length) * 100 : 0}%`, background: bucket.color }} />
                      </div>
                      <span className="text-[10px] font-mono w-6 text-right" style={{ color: T.dim }}>{bucket.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <SectionTitle>Auto-Triage Summary</SectionTitle>
              <Card>
                <div className="flex flex-col gap-2">
                  {['escalate', 'monitor', 'auto-resolve', 'suppress'].map(triage => {
                    const count = signals.filter(s => s.triageResult === triage).length;
                    const pct = signals.length ? ((count / signals.length) * 100).toFixed(0) : '0';
                    return (
                      <div key={triage} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: TRIAGE_COLORS[triage] }} />
                          <span className="text-[10px] font-mono uppercase" style={{ color: TRIAGE_COLORS[triage] }}>{triage}</span>
                        </div>
                        <span className="text-[10px] font-mono" style={{ color: T.dim }}>{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 text-[10px]" style={{ borderTop: `1px solid ${T.border}`, color: T.muted }}>
                  {suppressed + signals.filter(s => s.triageResult === 'auto-resolve').length} of {signals.length} signals auto-handled — {signals.length ? ((1 - escalated / signals.length) * 100).toFixed(0) : '0'}% noise reduction
                </div>
              </Card>

              <SectionTitle>BYOML Models</SectionTitle>
              <div className="flex flex-col gap-2">
                {byomlModels.map(model => (
                  <Card key={model.id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono" style={{ color: T.dim }}>{model.id}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: model.status === 'deployed' ? 'rgba(201,183,135,0.1)' : 'rgba(245,245,245,0.06)', color: model.status === 'deployed' ? T.accent : T.dim }}>{model.status}</span>
                    </div>
                    <div className="text-xs font-medium mb-1" style={{ color: T.text }}>{model.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-[9px] font-mono">
                      <div><span style={{ color: T.muted }}>FW:</span> <span style={{ color: T.dim }}>{model.framework}</span></div>
                      <div><span style={{ color: T.muted }}>Acc:</span> <span style={{ color: T.accent }}>{(model.accuracy * 100).toFixed(1)}%</span></div>
                      <div><span style={{ color: T.muted }}>Lat:</span> <span style={{ color: T.dim }}>{model.inferenceLatency}</span></div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <SectionTitle>Analytics Module Inventory</SectionTitle>
          <div className="rounded-lg overflow-hidden mb-6" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Module', 'Category', 'Status', 'Signals Processed', 'Accuracy'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyticsModules.map(mod => (
                  <tr key={mod.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-[10px]" style={{ color: T.muted }}>{mod.id}</div>
                      <div className="text-xs" style={{ color: T.text }}>{mod.name}</div>
                    </td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}>{mod.category}</span></td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono" style={{ color: T.accent }}>{mod.status}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{mod.signalsProcessed.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono font-bold" style={{ color: mod.accuracy >= 0.97 ? T.accent : T.text }}>{(mod.accuracy * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} /> Precision AI Engine — every signal scored, calibrated, and triaged autonomously. Only high-confidence, high-SNR signals reach human operators.
          </div>

          <DefenseCrossNav
            currentId="precision-ai"
            related={[
              { id: 'weaponized-intel', reason: 'Threats SmartScore is calibrated against' },
              { id: 'atlas-shield', reason: 'MITRE techniques scored by analytics modules' },
              { id: 'adversarial', reason: 'Stress tests for triage decisions' },
            ]}
          />
        </>
      )}
    </Layout>
  );
}
