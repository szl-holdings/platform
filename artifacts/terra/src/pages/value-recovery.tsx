import {
  EVENTS,
  formatCurrency,
  getStateColor,
  WORKFLOWS,
} from '@szl-holdings/shared-ui/core-observability-data';
import { CheckCircle, TrendingDown, } from 'lucide-react';

export default function ValueRecovery() {
  const recovered = EVENTS.filter((e) => e.status === 'recovered');
  const atRisk = WORKFLOWS.reduce((sum, w) => sum + w.value_at_risk, 0);
  const recoveredAmount = recovered.reduce((sum, e) => sum + e.business_value_impact, 0);

  const recoveryScenarios = [
    {
      id: 'rec-001',
      title: 'Northgate Contract — Approval Reroute',
      before: {
        status: 'blocked',
        latency: '48h',
        value_at_risk: 840000,
        approval_sla: 'BREACHED',
      },
      after: {
        status: 'executing',
        latency: '2h remaining',
        value_at_risk: 0,
        approval_sla: 'ON TRACK',
      },
      action: 'Rerouted to CFO backup via Counsel',
      cycle_time_saved: '6.2h',
      correlation_id: 'gf-2026-q1-001',
      recovered: 840000,
      confidence: 91,
    },
  ];

  const atRiskBreakdown = WORKFLOWS.filter((w) => w.value_at_risk > 0).sort(
    (a, b) => b.value_at_risk - a.value_at_risk,
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4" style={{ color: '#10b981' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#0ea5e9' }}
          >
            Lyte · Value Recovery
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Value Recovery View</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Risk estimation, intervention impact, and before/after recovery comparison. Phase: VERIFY.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Total Value at Risk',
            value: formatCurrency(atRisk),
            color: '#ef4444',
            sub: `${atRiskBreakdown.length} workflows affected`,
          },
          {
            label: 'Value Recovered (30d)',
            value: formatCurrency(recoveredAmount),
            color: '#10b981',
            sub: 'Via Counsel interventions',
          },
          {
            label: 'Recovery Rate',
            value: '91%',
            color: '#0ea5e9',
            sub: 'Intervention success rate',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-5"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="text-[11px] font-medium mb-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {c.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border"
        style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}
      >
        <div
          className="px-5 py-4 border-b flex items-center gap-2"
          style={{ borderColor: 'rgba(16,185,129,0.1)' }}
        >
          <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
          <span className="text-sm font-semibold text-white">
            Recovery Interventions — Before & After
          </span>
        </div>
        {recoveryScenarios.map((s) => (
          <div key={s.id} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">{s.title}</div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Action: {s.action}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{
                    color: '#10b981',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.25)',
                  }}
                >
                  Cycle time saved: {s.cycle_time_saved}
                </span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{
                    color: '#10b981',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.25)',
                  }}
                >
                  Confidence: {s.confidence}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-lg border p-4"
                style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: '#ef4444' }}
                >
                  BEFORE
                </div>
                {Object.entries(s.before).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-xs py-1 border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k.replace(/_/g, ' ')}</span>
                    <span
                      className="font-medium"
                      style={{
                        color:
                          typeof v === 'number'
                            ? '#ef4444'
                            : v === 'BREACHED'
                              ? '#ef4444'
                              : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {typeof v === 'number' ? formatCurrency(v) : v}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="rounded-lg border p-4"
                style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: '#10b981' }}
                >
                  AFTER
                </div>
                {Object.entries(s.after).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-xs py-1 border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k.replace(/_/g, ' ')}</span>
                    <span
                      className="font-medium"
                      style={{
                        color:
                          typeof v === 'number' && v === 0
                            ? '#10b981'
                            : v === 'ON TRACK'
                              ? '#10b981'
                              : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {typeof v === 'number' ? formatCurrency(v) : v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div
          className="px-5 py-4 border-b flex items-center gap-2"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
          <span className="text-sm font-semibold text-white">
            Current Value at Risk — Breakdown
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {atRiskBreakdown.map((w) => (
            <div key={w.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{w.name}</div>
                <div
                  className="text-[10px] mt-0.5 flex items-center gap-3"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <span>{w.owner || 'Unassigned'}</span>
                  <span>{w.team}</span>
                  {w.blocked_step && <span style={{ color: '#f97316' }}>↳ {w.blocked_step}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                    {formatCurrency(w.value_at_risk)}
                  </div>
                  <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    at risk
                  </div>
                </div>
                <span
                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: getStateColor(w.status),
                    background: `${getStateColor(w.status)}15`,
                    border: `1px solid ${getStateColor(w.status)}30`,
                  }}
                >
                  {w.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
