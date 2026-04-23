import {
  formatCurrency,
  PREDICTIONS,
} from '@szl-holdings/shared-ui/core-observability-data';
import { AlertOctagon, ArrowRight, Brain, Clock, ExternalLink } from 'lucide-react';

const ESCALATIONS = [
  {
    id: 'esc-001',
    title: 'Northgate Contract — VP Legal Unavailable, Q1 Close at Risk',
    reason:
      '48h approval SLA breach. Legal team at 94% capacity. Q1 close window closes in 6 days. $840K ARR at risk.',
    escalate_to: 'CFO + CEO',
    team: 'Revenue Operations',
    urgency: 'critical' as const,
    impact: 840000,
    alloy_rationale: 'pred-001',
    correlation_id: 'gf-2026-q1-001',
    recommended_action: 'CEO-to-VP escalation + parallel approval path via CFO backup',
    age_hours: 48,
  },
  {
    id: 'esc-002',
    title: 'TechCorp Churn — Executive Engagement Required Within 12h',
    reason:
      'NPS dropped 42 points. Competitive renewal offer received. 88% churn probability without executive contact.',
    escalate_to: 'CEO',
    team: 'Customer Success',
    urgency: 'critical' as const,
    impact: 480000,
    alloy_rationale: 'pred-003',
    correlation_id: 'corr-churn-techcorp',
    recommended_action: 'CEO-to-CEO outreach + approve 30% retention offer',
    age_hours: 24,
  },
  {
    id: 'esc-003',
    title: 'Apex Vendor Onboarding — Procurement Process Gap',
    reason:
      'Compliance step has no owner for 6 days. Blocking 6 downstream vendor onboardings. Process gap from team reorg.',
    escalate_to: 'CPO',
    team: 'Procurement',
    urgency: 'high' as const,
    impact: 780000,
    alloy_rationale: 'pred-002',
    correlation_id: 'corr-vendor-apex',
    recommended_action:
      'Assign dedicated compliance resource + fast-track approval for low-risk vendors',
    age_hours: 144,
  },
];

export default function EscalationCenter() {
  const critical = ESCALATIONS.filter((e) => e.urgency === 'critical');
  const high = ESCALATIONS.filter((e) => e.urgency === 'high');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertOctagon className="w-4 h-4" style={{ color: '#d4a054' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#d4a054' }}
          >
            Command · Escalation Center
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Escalation Center</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          What needs escalation, why, to whom — with FORGE rationale and recommended actions
          attached.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Critical Escalations', value: critical.length, color: '#c45a4a' },
          { label: 'High Priority', value: high.length, color: '#c8953c' },
          {
            label: 'Total Impact',
            value: formatCurrency(ESCALATIONS.reduce((s, e) => s + e.impact, 0)),
            color: '#d4a054',
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
        {ESCALATIONS.map((esc) => {
          const alloyPred = PREDICTIONS.find((p) => p.id === esc.alloy_rationale);
          const borderColor =
            esc.urgency === 'critical' ? 'rgba(196,90,74,0.2)' : 'rgba(249,115,22,0.15)';
          const bgColor =
            esc.urgency === 'critical' ? 'rgba(196,90,74,0.03)' : 'rgba(249,115,22,0.02)';

          return (
            <div
              key={esc.id}
              className="rounded-xl border p-5"
              style={{ borderColor, background: bgColor }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{
                        color: esc.urgency === 'critical' ? '#c45a4a' : '#c8953c',
                        background:
                          esc.urgency === 'critical'
                            ? 'rgba(196,90,74,0.12)'
                            : 'rgba(249,115,22,0.12)',
                        border: `1px solid ${esc.urgency === 'critical' ? 'rgba(196,90,74,0.25)' : 'rgba(249,115,22,0.25)'}`,
                      }}
                    >
                      {esc.urgency}
                    </span>
                    <span
                      className="text-[10px] flex items-center gap-1"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      <Clock className="w-3 h-3" />
                      {esc.age_hours}h
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{esc.title}</div>
                  <div
                    className="text-[11px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {esc.reason}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold mb-0.5" style={{ color: '#d4a054' }}>
                    {formatCurrency(esc.impact)}
                  </div>
                  <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    impact
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-[9px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Escalate To
                  </div>
                  <div className="text-xs font-medium text-white">{esc.escalate_to}</div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {esc.team}
                  </div>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="text-[9px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Recommended Action
                  </div>
                  <div className="text-[10px] leading-relaxed text-white">
                    {esc.recommended_action}
                  </div>
                </div>
              </div>

              {alloyPred && (
                <div
                  className="rounded-lg p-3 mb-4"
                  style={{
                    background: 'rgba(139,92,246,0.05)',
                    border: '1px solid rgba(139,92,246,0.15)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="w-3 h-3" style={{ color: '#8b7ac8' }} />
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider"
                      style={{ color: '#8b7ac8' }}
                    >
                      FORGE Rationale
                    </span>
                    <span className="text-[9px] ml-1" style={{ color: 'rgba(139,92,246,0.6)' }}>
                      Confidence: {alloyPred.confidence}%
                    </span>
                  </div>
                  <div
                    className="text-[10px] leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {alloyPred.rationale}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{
                    color: '#c45a4a',
                    background: 'rgba(196,90,74,0.1)',
                    border: '1px solid rgba(196,90,74,0.25)',
                  }}
                >
                  Escalate Now
                </button>
                <a
                  href="/intervention"
                  className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                  style={{
                    color: '#d4a054',
                    background: 'rgba(212,160,84,0.1)',
                    border: '1px solid rgba(212,160,84,0.2)',
                  }}
                >
                  Open Intervention <ArrowRight className="w-3 h-3" />
                </a>
                <a
                  href="/alloy"
                  className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 flex items-center gap-1"
                  style={{
                    color: '#8b7ac8',
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.15)',
                  }}
                >
                  <ExternalLink className="w-3 h-3" /> FORGE Full Analysis
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
