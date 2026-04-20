import {
  type AutonomyMode,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
} from '@szl-holdings/design-system';
import { ArrowRight, Zap } from 'lucide-react';
import { useState } from 'react';
import { matterTwins } from '../data/counsel-twin';

const ACCENT = '#8b5cf6';
const DEADLINE_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-risk-001',
    label: 'Matter Management — Obligation Dependency Tracker',
    type: 'api',
    timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
    excerpt:
      'Discovery request from Morrison & Vance overdue by 18 days. 2 filing obligations for Meridian Compliance v.3 are blocked. Regulatory deadline in 11 days.',
  },
  {
    id: 'ev-risk-002',
    label: 'Exposure Model — Deadline Miss Simulator',
    type: 'model',
    timestamp: new Date(Date.now() - 15 * 60_000).toISOString(),
    excerpt:
      'If filing deadline missed: $4.1M exposure activates. Regulatory penalty modeled at $2.8M + $1.3M litigation exposure. Escalation reduces probability to 14%.',
  },
];

const BUDGET_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-risk-003',
    label: 'eBilling — Sterling & Ross Spend Analysis',
    type: 'api',
    timestamp: new Date(Date.now() - 60 * 60_000).toISOString(),
    excerpt:
      'Sterling & Ross YTD actual: $284K vs $408K budget. 30.4% under budget. Performance rating: 92/100 across 3 active matters. Recommend reallocation.',
  },
];

export default function RiskExposureDesk() {
  const [escalationMode, setEscalationMode] = useState<AutonomyMode>('recommend');
  const [budgetMode, setBudgetMode] = useState<AutonomyMode>('recommend');
  const highRiskMatters = matterTwins.filter((m) => m.exposureUsd > 3000000);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-violet-100">Risk & Exposure Desk</h1>
        <p className="text-violet-400/60 text-sm">
          Financial exposure analysis and AI-driven risk mitigation.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-violet-100 mb-4">
              Financial Exposure by Type
            </h3>
            <div className="h-64 flex items-end justify-between gap-4 px-4 pt-8">
              {[
                { label: 'Regulatory', val: 4.1 },
                { label: 'Litigation', val: 1.2 },
                { label: 'M&A', val: 15.0 },
                { label: 'Compliance', val: 2.5 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex flex-col items-center">
                    <div className="absolute -top-6 text-[10px] font-bold text-violet-100">
                      ${bar.val}M
                    </div>
                    <div
                      className="w-full bg-violet-500/20 border border-violet-500/40 rounded-t-lg transition-all group-hover:bg-violet-500/40"
                      style={{ height: `${(bar.val / 15) * 160}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-violet-400/60 mt-3 uppercase tracking-wider">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-violet-100 mb-4">
              What-If: Deadline Miss Scenarios
            </h3>
            <div className="space-y-3">
              {highRiskMatters.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-violet-100">{m.name}</div>
                    <div className="text-[10px] text-red-400/60">
                      Missed Deadline Risk: High Severity
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-400">
                      +${((m.exposureUsd * 0.4) / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-[10px] text-violet-400/50">Est. Penalty Escalation</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-violet-100 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              AI Recommendations
            </h3>

            <ProofEnvelope
              title="Escalation Recommended — Meridian Deadline"
              accentColor={ACCENT}
              evidence={DEADLINE_EVIDENCE}
              timestamp={DEADLINE_EVIDENCE[0]!.timestamp}
              confidence={92}
              policyState={'requires-approval' as PolicyState}
              autonomyMode={escalationMode}
              onAutonomyChange={setEscalationMode}
            >
              <div className="space-y-3">
                <p className="text-xs text-violet-200 leading-relaxed">
                  Looming deadline for{' '}
                  <span className="text-violet-100 font-bold">Meridian Compliance v.3</span> (11
                  days) is blocked by 18-day overdue discovery response from Morrison & Vance.
                </p>
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                    Recommended Action
                  </div>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2 text-[10px] text-violet-300/70">
                      <ArrowRight className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
                      Issue formal preservation notice to M&V lead partner.
                    </li>
                    <li className="flex items-start gap-2 text-[10px] text-violet-300/70">
                      <ArrowRight className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
                      Parallel track discovery with internal e-discovery team.
                    </li>
                  </ul>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold py-2 rounded transition-colors">
                    Approve Escalation
                  </button>
                  <button className="flex-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-[10px] font-bold py-2 rounded transition-colors border border-violet-500/20">
                    Reject
                  </button>
                </div>
              </div>
            </ProofEnvelope>

            <ProofEnvelope
              title="Budget Realignment — Sterling & Ross"
              accentColor={ACCENT}
              evidence={BUDGET_EVIDENCE}
              timestamp={BUDGET_EVIDENCE[0]!.timestamp}
              confidence={85}
              policyState={'allowed' as PolicyState}
              autonomyMode={budgetMode}
              onAutonomyChange={setBudgetMode}
            >
              <div className="space-y-2">
                <p className="text-xs text-violet-200">
                  Sterling & Ross actual spend is 30% under budget while performance is &gt; 90%.
                  Recommend shifting $50K from contingency to IP Settlement matter.
                </p>
                <button className="w-full bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-[10px] font-bold py-2 rounded transition-colors border border-violet-500/20">
                  Review Realignment
                </button>
              </div>
            </ProofEnvelope>
          </div>
        </div>
      </div>
    </div>
  );
}
