import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

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

const SIGNALS: SmartScoreSignal[] = [
  { id: 'SIG-4821', source: 'Connector Firewall', category: 'threat', rawScore: 87, smartScore: 94, confidence: 0.97, snr: 12.4, triageResult: 'escalate', timestamp: '2026-04-26T14:32:00Z', description: 'Anomalous API call pattern from vendor-risk-db connector — 3.2x normal volume with payload size deviation', analyticsModules: ['behavioral-baseline', 'volumetric-anomaly', 'payload-analysis'] },
  { id: 'SIG-4822', source: 'Agent Mesh', category: 'agent', rawScore: 72, smartScore: 81, confidence: 0.91, snr: 8.7, triageResult: 'escalate', timestamp: '2026-04-26T14:28:00Z', description: 'Claude Code agent trust score dropped 6 points in 2 hours — output quality drift detected by MirrorEval', analyticsModules: ['trust-decay', 'output-quality', 'drift-detection'] },
  { id: 'SIG-4823', source: 'Covenant Gate', category: 'compliance', rawScore: 45, smartScore: 62, confidence: 0.88, snr: 5.3, triageResult: 'monitor', timestamp: '2026-04-26T14:25:00Z', description: 'Tier-2 approval bypassed for low-value procurement action — policy exception flagged', analyticsModules: ['policy-exception', 'approval-pattern', 'risk-scoring'] },
  { id: 'SIG-4824', source: 'Signal Mesh', category: 'operational', rawScore: 34, smartScore: 28, confidence: 0.94, snr: 2.1, triageResult: 'auto-resolve', timestamp: '2026-04-26T14:22:00Z', description: 'Vessel ETA recalculation triggered by weather data update — standard deviation within normal range', analyticsModules: ['baseline-comparison', 'weather-correlation'] },
  { id: 'SIG-4825', source: 'Proof Ledger', category: 'compliance', rawScore: 91, smartScore: 96, confidence: 0.99, snr: 18.2, triageResult: 'escalate', timestamp: '2026-04-26T14:18:00Z', description: 'Proof chain hash mismatch detected on action PL-7842 — potential tamper attempt or clock skew', analyticsModules: ['hash-verification', 'clock-analysis', 'tamper-detection', 'forensic-trace'] },
  { id: 'SIG-4826', source: 'MirrorEval', category: 'agent', rawScore: 58, smartScore: 41, confidence: 0.86, snr: 3.4, triageResult: 'monitor', timestamp: '2026-04-26T14:15:00Z', description: 'Evaluation drift on Pipeline Oracle agent — forecast accuracy dipped 1.8% below 30-day baseline', analyticsModules: ['forecast-accuracy', 'drift-detection', 'baseline-comparison'] },
  { id: 'SIG-4827', source: 'Connector Firewall', category: 'threat', rawScore: 22, smartScore: 15, confidence: 0.92, snr: 1.2, triageResult: 'suppress', timestamp: '2026-04-26T14:12:00Z', description: 'Routine port scan from known research IP — no payload, no persistence. Previously classified benign.', analyticsModules: ['ip-reputation', 'pattern-match'] },
  { id: 'SIG-4828', source: 'Twin Foundry', category: 'operational', rawScore: 63, smartScore: 71, confidence: 0.89, snr: 6.8, triageResult: 'monitor', timestamp: '2026-04-26T14:08:00Z', description: 'Digital twin state divergence for asset RE-2241 — valuation model inputs differ from market feed by 4.2%', analyticsModules: ['state-divergence', 'valuation-model', 'market-feed-correlation'] },
  { id: 'SIG-4829', source: 'Revenue Pipeline', category: 'financial', rawScore: 76, smartScore: 83, confidence: 0.93, snr: 9.1, triageResult: 'escalate', timestamp: '2026-04-26T14:02:00Z', description: 'Q3 pipeline coverage ratio dropped below 3.0x threshold — 4 deals moved to at-risk in 48 hours', analyticsModules: ['pipeline-coverage', 'deal-velocity', 'risk-scoring', 'forecast-impact'] },
  { id: 'SIG-4830', source: 'Guardian', category: 'threat', rawScore: 15, smartScore: 8, confidence: 0.95, snr: 0.8, triageResult: 'suppress', timestamp: '2026-04-26T13:58:00Z', description: 'Low-severity CVE advisory for unused dependency — no attack surface exposure confirmed', analyticsModules: ['cve-correlation', 'dependency-graph', 'exposure-analysis'] },
];

const ANALYTICS_MODULES = [
  { id: 'AM-001', name: 'Behavioral Baseline Engine', category: 'Detection', status: 'active', signalsProcessed: 48210, accuracy: 0.968 },
  { id: 'AM-002', name: 'Volumetric Anomaly Detector', category: 'Detection', status: 'active', signalsProcessed: 31847, accuracy: 0.942 },
  { id: 'AM-003', name: 'Drift Detection Module', category: 'Quality', status: 'active', signalsProcessed: 22104, accuracy: 0.957 },
  { id: 'AM-004', name: 'Hash Verification Engine', category: 'Integrity', status: 'active', signalsProcessed: 89421, accuracy: 0.999 },
  { id: 'AM-005', name: 'Trust Decay Analyzer', category: 'Agent', status: 'active', signalsProcessed: 12847, accuracy: 0.934 },
  { id: 'AM-006', name: 'Policy Exception Classifier', category: 'Compliance', status: 'active', signalsProcessed: 7842, accuracy: 0.961 },
  { id: 'AM-007', name: 'Forecast Impact Predictor', category: 'Financial', status: 'active', signalsProcessed: 5621, accuracy: 0.928 },
  { id: 'AM-008', name: 'CVE Correlation Engine', category: 'Threat', status: 'active', signalsProcessed: 41283, accuracy: 0.975 },
  { id: 'AM-009', name: 'Payload Analysis Module', category: 'Detection', status: 'active', signalsProcessed: 28947, accuracy: 0.951 },
  { id: 'AM-010', name: 'Tamper Detection Scanner', category: 'Integrity', status: 'active', signalsProcessed: 15284, accuracy: 0.997 },
  { id: 'AM-011', name: 'State Divergence Monitor', category: 'Operational', status: 'active', signalsProcessed: 9847, accuracy: 0.944 },
  { id: 'AM-012', name: 'IP Reputation Scorer', category: 'Threat', status: 'active', signalsProcessed: 67421, accuracy: 0.982 },
];

const BYOML_MODELS = [
  { id: 'BYOML-001', name: 'Custom Anomaly Detector', framework: 'PyTorch', status: 'deployed', accuracy: 0.947, lastTrained: '2026-04-20', inferenceLatency: '12ms' },
  { id: 'BYOML-002', name: 'Domain-Specific NER', framework: 'HuggingFace', status: 'deployed', accuracy: 0.962, lastTrained: '2026-04-18', inferenceLatency: '8ms' },
  { id: 'BYOML-003', name: 'Transaction Risk Classifier', framework: 'XGBoost', status: 'deployed', accuracy: 0.938, lastTrained: '2026-04-22', inferenceLatency: '3ms' },
  { id: 'BYOML-004', name: 'Behavioral Fingerprint Model', framework: 'TensorFlow', status: 'validating', accuracy: 0.921, lastTrained: '2026-04-25', inferenceLatency: '18ms' },
];

const TRIAGE_COLORS: Record<string, string> = {
  escalate: '#f5f5f5', monitor: '#c9b787', 'auto-resolve': '#8a8a8a', suppress: '#5e5e5e',
};
const CATEGORY_COLORS: Record<string, string> = {
  threat: '#ef4444', compliance: '#f59e0b', operational: '#3b82f6', financial: '#10b981', agent: '#8b5cf6',
};

export function PrecisionAI() {
  const [filter, setFilter] = useState<string>('all');
  const [liveCounter, setLiveCounter] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setLiveCounter(c => c + Math.floor(Math.random() * 3 + 1)), 2000);
    return () => clearInterval(iv);
  }, []);

  const filtered = filter === 'all' ? SIGNALS : SIGNALS.filter(s => s.triageResult === filter);
  const escalated = SIGNALS.filter(s => s.triageResult === 'escalate').length;
  const suppressed = SIGNALS.filter(s => s.triageResult === 'suppress').length;
  const avgConfidence = (SIGNALS.reduce((a, s) => a + s.confidence, 0) / SIGNALS.length * 100).toFixed(1);
  const avgSNR = (SIGNALS.reduce((a, s) => a + s.snr, 0) / SIGNALS.length).toFixed(1);

  return (
    <Layout>
      <PageHeader
        label="PRECISION AI ENGINE"
        title="SmartScore Dynamic Risk Scoring"
        subtitle="XSIAM-inspired analytics engine — real-time confidence calibration, signal-to-noise optimization, and autonomous triage across 10,000+ analytics modules for every signal flowing through A11oy."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="SIGNALS TODAY" value={(SIGNALS.length + liveCounter).toLocaleString()} sub="processed" accent={T.accent} />
        <KpiCard label="ESCALATED" value={escalated} sub="require attention" accent={T.text} />
        <KpiCard label="AUTO-TRIAGED" value={`${SIGNALS.length - escalated}`} sub="no human needed" accent={T.accent} />
        <KpiCard label="AVG CONFIDENCE" value={`${avgConfidence}%`} sub="calibrated" accent={T.accent} />
        <KpiCard label="SIGNAL-TO-NOISE" value={`${avgSNR}:1`} sub="ratio" accent={T.accent} />
        <KpiCard label="ANALYTICS MODULES" value={ANALYTICS_MODULES.length.toLocaleString()} sub="active" accent={T.dim} />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'escalate', 'monitor', 'auto-resolve', 'suppress'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded text-xs font-mono uppercase transition-all" style={{ background: filter === f ? 'rgba(201,183,135,0.12)' : T.surface, border: `1px solid ${filter === f ? 'rgba(201,183,135,0.3)' : T.border}`, color: filter === f ? T.accent : T.muted, cursor: 'pointer' }}>
            {f === 'all' ? `all (${SIGNALS.length})` : `${f} (${SIGNALS.filter(s => s.triageResult === f).length})`}
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
                { range: '90-100', label: 'Critical', count: SIGNALS.filter(s => s.smartScore >= 90).length, color: '#f5f5f5' },
                { range: '70-89', label: 'High', count: SIGNALS.filter(s => s.smartScore >= 70 && s.smartScore < 90).length, color: '#c9b787' },
                { range: '40-69', label: 'Medium', count: SIGNALS.filter(s => s.smartScore >= 40 && s.smartScore < 70).length, color: '#8a8a8a' },
                { range: '0-39', label: 'Low', count: SIGNALS.filter(s => s.smartScore < 40).length, color: '#5e5e5e' },
              ].map(bucket => (
                <div key={bucket.range} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono w-14" style={{ color: bucket.color }}>{bucket.range}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: T.surface }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${(bucket.count / SIGNALS.length) * 100}%`, background: bucket.color }} />
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
                const count = SIGNALS.filter(s => s.triageResult === triage).length;
                const pct = ((count / SIGNALS.length) * 100).toFixed(0);
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
              {suppressed + SIGNALS.filter(s => s.triageResult === 'auto-resolve').length} of {SIGNALS.length} signals auto-handled — {((1 - escalated / SIGNALS.length) * 100).toFixed(0)}% noise reduction
            </div>
          </Card>

          <SectionTitle>BYOML Models</SectionTitle>
          <div className="flex flex-col gap-2">
            {BYOML_MODELS.map(model => (
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
            {ANALYTICS_MODULES.map(mod => (
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
    </Layout>
  );
}
