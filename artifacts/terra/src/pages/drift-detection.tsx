import {
  DRIFT_EVENTS,
  formatCurrency,
  getSeverityColor,
  type Severity,
} from '@szl-holdings/shared-ui/core-observability-data';
import { ArrowRight, Clock, Radar } from 'lucide-react';

function SeverityBadge({ severity }: { severity: Severity }) {
  const color = getSeverityColor(severity);
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
      style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
    >
      {severity}
    </span>
  );
}

export default function DriftDetection() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Radar className="w-4 h-4" style={{ color: '#0ea5e9' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#0ea5e9' }}
          >
            KORA · Drift Detection
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Drift Detection</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Unexpected changes, timing anomalies, contributing factors, and affected workflows. KORA
          surfaces drift before it becomes a crisis.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Drift Events', value: DRIFT_EVENTS.length.toString(), color: '#ef4444' },
          {
            label: 'Critical Severity',
            value: DRIFT_EVENTS.filter((d) => d.severity === 'critical').length.toString(),
            color: '#ef4444',
          },
          {
            label: 'High Severity',
            value: DRIFT_EVENTS.filter((d) => d.severity === 'high').length.toString(),
            color: '#f97316',
          },
          {
            label: 'Value Impact',
            value: formatCurrency(DRIFT_EVENTS.reduce((s, d) => s + d.value_impact, 0)),
            color: '#f59e0b',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="text-[10px] font-medium mb-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {c.label}
            </div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {DRIFT_EVENTS.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border p-5"
            style={{
              borderColor:
                d.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)',
              background:
                d.severity === 'critical' ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.01)',
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-2">
                  <SeverityBadge severity={d.severity} />
                  <span className="text-sm font-semibold text-white">{d.title}</span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Entity: {d.entity}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  {d.value_impact > 0 && (
                    <>
                      <div className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                        {formatCurrency(d.value_impact)}
                      </div>
                      <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        impact
                      </div>
                    </>
                  )}
                </div>
                <div
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <Clock className="w-3 h-3" />
                  {new Date(d.detected_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div
                className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Contributing Factors
              </div>
              <div className="flex flex-wrap gap-2">
                {d.contributing_factors.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {d.affected_workflows.length > 0 && (
              <div className="mb-4">
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Affected Workflows
                </div>
                <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {d.affected_workflows.join(', ')}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <a
                href="/command/operations/"
                className="text-[9px] px-2.5 py-1 rounded font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
                style={{
                  color: '#f59e0b',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                <ArrowRight className="w-3 h-3" /> Route in KORA
              </a>
              <a
                href="/alloy"
                className="text-[9px] px-2.5 py-1 rounded font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
                style={{
                  color: '#6366f1',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              >
                <ArrowRight className="w-3 h-3" /> Model in FORGE
              </a>
              <a
                href="/causal-drilldown"
                className="text-[9px] px-2.5 py-1 rounded font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
                style={{
                  color: '#0ea5e9',
                  background: 'rgba(14,165,233,0.1)',
                  border: '1px solid rgba(14,165,233,0.2)',
                }}
              >
                Drill down →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
