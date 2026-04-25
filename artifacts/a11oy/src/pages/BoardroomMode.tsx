import { useEffect, useState } from 'react';
import { Layout } from '../components/layout';
import { DemoBadge, VerdictBadge } from '../components/ui';
import { SEED_SIGNALS, SEED_WORKCELLS, SEED_OUTCOMES, SEED_PROOF_PACKETS } from '@workspace/a11oy-fabric';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#3b82f6', 'vessels-maritime': '#06b6d4', 'terra-real-estate': '#10b981',
  'aegis-defense': '#ef4444', 'prism-counsel': '#8b5cf6', 'carlota-jo': '#f59e0b', 'alloy-core': '#6366f1',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue', 'vessels-maritime': 'Vessels', 'terra-real-estate': 'Terra',
  'aegis-defense': 'Aegis', 'prism-counsel': 'Counsel', 'carlota-jo': 'Carlota Jo', 'alloy-core': 'Core',
};

const STAGE_LABELS = ['SENSE', 'STRUCTURE', 'CORRELATE', 'EXPLAIN', 'RECOMMEND', 'APPROVE', 'EXECUTE', 'VERIFY', 'PROVE'];

const activeSignals = SEED_SIGNALS.filter(s => s.status === 'active' || s.status === 'escalated');
const criticalSignals = SEED_SIGNALS.filter(s => s.severity === 'critical');
const pendingApprovals = SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running');
const outcomesAtRisk = SEED_OUTCOMES.filter(o => o.status === 'blocked' || o.status === 'missed');
const failedWC = SEED_WORKCELLS.filter(w => w.status === 'error');
const mirrorWarnCount = SEED_WORKCELLS.filter(w => w.mirrorEvalResult.verdict === 'warn' || w.mirrorEvalResult.verdict === 'fail').length;

const KPIs = [
  { label: 'ACTIVE SIGNALS',       value: String(activeSignals.length),   sub: `${criticalSignals.length} critical`,   color: '#ef4444' },
  { label: 'PENDING APPROVALS',    value: String(pendingApprovals.length), sub: 'human gate required',                  color: '#8b5cf6' },
  { label: 'OUTCOMES AT RISK',      value: String(outcomesAtRisk.length),  sub: 'blocked or missed',                    color: '#f59e0b' },
  { label: 'PROOF COVERAGE',        value: '91%',                          sub: `${SEED_PROOF_PACKETS.length} packets`,  color: '#10b981' },
  { label: 'FAILED WORKCELLS',      value: String(failedWC.length),        sub: 'need attention',                       color: failedWC.length > 0 ? '#ef4444' : '#10b981' },
  { label: 'MIRROREVAL FLAGS',      value: String(mirrorWarnCount),        sub: 'evaluation warnings',                  color: mirrorWarnCount > 0 ? '#f59e0b' : '#10b981' },
  { label: 'VERIFIED ACTIONS',      value: '47',                           sub: 'last 24h',                             color: '#10b981' },
  { label: 'FABRIC HEALTH',         value: '99.2%',                        sub: 'all 7 layers live',                    color: '#3b82f6' },
];

export function BoardroomMode() {
  const [time, setTime] = useState(new Date());
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setTime(new Date());
      setTicker(t => t + 1);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const rotatingSignal = activeSignals[ticker % activeSignals.length];

  return (
    <Layout fullscreen>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#050810', color: '#f0f4fc' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-4 border-b flex-wrap gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded flex items-center justify-center font-mono font-bold text-sm" style={{ backgroundColor: '#3b82f6', color: 'white' }}>A</div>
            <div>
              <div className="text-lg font-display font-semibold tracking-tight">A11oy</div>
              <div className="text-xs font-mono" style={{ color: '#4d607a' }}>LIVE ENTERPRISE EXECUTION FABRIC</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-xs font-mono" style={{ color: '#4d607a' }}>
              {time.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })} UTC
            </div>
            <div className="flex items-center gap-2 text-sm font-mono">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }} />
              <span style={{ color: '#10b981' }}>Fabric operational</span>
            </div>
            <DemoBadge />
          </div>
        </div>

        <div className="flex-1 px-6 sm:px-10 py-6 overflow-auto">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            {KPIs.map(kpi => (
              <div key={kpi.label} className="flex flex-col gap-1 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="font-mono tracking-wider" style={{ color: '#4d607a', fontSize: '9px' }}>{kpi.label}</div>
                <div className="text-2xl font-display font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-xs" style={{ color: '#9bacc4' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* 3-panel middle */}
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            {/* Vertical Status */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs font-mono tracking-widest mb-4" style={{ color: '#4d607a' }}>VERTICAL STATUS</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(VERTICAL_LABELS).map(([id, label]) => {
                  const sigs = SEED_SIGNALS.filter(s => s.vertical === id);
                  const critical = sigs.filter(s => s.severity === 'critical').length;
                  const high = sigs.filter(s => s.severity === 'high').length;
                  const color = VERTICAL_COLORS[id] ?? '#9bacc4';
                  const statusLabel = critical > 0 ? 'ACTIVE' : high > 0 ? 'MONITORING' : 'NOMINAL';
                  const statusColor = critical > 0 ? '#ef4444' : high > 0 ? '#f59e0b' : '#10b981';
                  return (
                    <div key={id} className="p-2 rounded" style={{ backgroundColor: `${color}08`, border: `1px solid ${color}20` }}>
                      <div className="text-xs font-mono mb-0.5" style={{ color }}>{label}</div>
                      <div className="text-xs font-bold mb-0.5" style={{ color: statusColor }}>{statusLabel}</div>
                      <div className="text-xs" style={{ color: '#9bacc4' }}>{sigs.length} sigs</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Execution Pipeline */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs font-mono tracking-widest mb-4" style={{ color: '#4d607a' }}>EXECUTION PIPELINE</div>
              <div className="flex flex-col gap-1.5">
                {STAGE_LABELS.map((stage, i) => (
                  <div key={stage} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: i < 5 ? '#3b82f6' : i === 5 ? '#8b5cf6' : '#10b981' }} />
                    <span className="text-xs font-mono" style={{ color: i < 5 ? '#3b82f6' : i === 5 ? '#8b5cf6' : '#10b981' }}>{stage}</span>
                    {i === 5 && <span className="text-xs" style={{ color: '#8b5cf6' }}>← human gate</span>}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs" style={{ color: '#4d607a' }}>
                APPROVE stage is non-bypassable. Zero silent executions.
              </div>
            </div>

            {/* Proof Ledger */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(176,141,82,0.06)', border: '1px solid rgba(176,141,82,0.15)' }}>
              <div className="text-xs font-mono tracking-widest mb-4" style={{ color: '#b08d52' }}>PROOF LEDGER</div>
              <div className="space-y-3">
                {SEED_PROOF_PACKETS.slice(0, 5).map(p => (
                  <div key={p.id} className="text-xs">
                    <div className="font-mono" style={{ color: '#b08d52' }}>{p.hash.slice(0, 22)}…</div>
                    <div style={{ color: '#9bacc4' }}>{p.kind} · {p.vertical}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Signal Ticker */}
          <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-xs font-mono tracking-widest mb-3" style={{ color: '#4d607a' }}>LIVE SIGNAL TICKER</div>
            {rotatingSignal && (
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: rotatingSignal.severity === 'critical' ? '#ef4444' : rotatingSignal.severity === 'high' ? '#f59e0b' : '#10b981' }} />
                <div>
                  <span className="text-xs font-mono mr-2" style={{ color: VERTICAL_COLORS[rotatingSignal.vertical] ?? '#9bacc4' }}>
                    {VERTICAL_LABELS[rotatingSignal.vertical]}
                  </span>
                  <span className="text-xs" style={{ color: '#f0f4fc' }}>{rotatingSignal.title}</span>
                </div>
                <div className="ml-auto text-xs font-mono" style={{ color: '#4d607a' }}>
                  {activeSignals.indexOf(rotatingSignal) + 1} / {activeSignals.length}
                </div>
              </div>
            )}
          </div>

          {/* MirrorEval Summary */}
          <div className="grid lg:grid-cols-4 gap-3">
            {SEED_WORKCELLS.slice(0, 4).map(wc => (
              <div key={wc.id} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs font-medium mb-1 truncate" style={{ color: '#f0f4fc' }}>{wc.name}</div>
                <VerdictBadge verdict={wc.mirrorEvalResult.verdict} />
                <div className="text-xs mt-1 font-mono" style={{ color: '#9bacc4' }}>
                  Score: {Math.round(wc.mirrorEvalResult.score * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: '#4d607a' }}>
            <span>A11oy — Live Enterprise Execution Fabric (pronounced "Alloy")</span>
            <DemoBadge />
          </div>
        </div>
      </div>
    </Layout>
  );
}
