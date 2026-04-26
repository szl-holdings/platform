import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

interface CounterfactualBranch {
  id: string;
  label: string;
  description: string;
  outcome: string;
  impactScore: number;
  deltaVsActual: number;
  risk: 'lower' | 'same' | 'higher';
  timeoutDelta: string;
  costDelta: string;
}

interface CounterfactualScenario {
  id: string;
  label: string;
  color: string;
  domain: string;
  actual: {
    decision: string;
    outcome: string;
    impactScore: number;
    model: string;
    threshold: number;
    humanApproval: boolean;
  };
  branches: CounterfactualBranch[];
}

const SCENARIOS: CounterfactualScenario[] = [
  {
    id: 'maritime-01',
    label: 'Horizon Star — Port Reroute',
    color: '#8a8a8a',
    domain: 'maritime',
    actual: {
      decision: 'Recommended Port Klang standby + route optimization. VP-Operations approved.',
      outcome: 'Vessel arrived 2.1h early. Fuel savings: $4,200. Charter party notified. No demurrage.',
      impactScore: 88,
      model: 'claude-sonnet-4',
      threshold: 0.85,
      humanApproval: true,
    },
    branches: [
      { id: 'b1', label: 'No action taken', description: 'System observes but does not recommend. Operator not alerted.', outcome: 'Vessel arrived 3.8h late. Demurrage: $28,000. Charter party escalated.', impactScore: 31, deltaVsActual: -57, risk: 'higher', timeoutDelta: '+5.9h', costDelta: '+$32,200' },
      { id: 'b2', label: 'Different model (GPT-4o)', description: 'Route optimization run with GPT-4o instead of Claude Sonnet. Different route scored.', outcome: 'Vessel arrived 1.6h early. Fuel savings: $3,100. Slightly suboptimal route selected.', impactScore: 81, deltaVsActual: -7, risk: 'same', timeoutDelta: '+0.5h', costDelta: '+$1,100' },
      { id: 'b3', label: 'Threshold lowered (0.70)', description: 'Alert triggered at 0.70 confidence instead of 0.85 — earlier but noisier.', outcome: 'Alerted 4h earlier. 2 false-positive alerts also sent. VP mildly annoyed.', impactScore: 79, deltaVsActual: -9, risk: 'same', timeoutDelta: '−4h earlier', costDelta: '+$200 (ops time)' },
      { id: 'b4', label: 'No human approval', description: 'System auto-executes route change without VP-Operations gate.', outcome: 'Faster execution (−22min). But unauthorized route change flagged by charter party compliance.', impactScore: 72, deltaVsActual: -16, risk: 'higher', timeoutDelta: '−22min', costDelta: '+$8,000 compliance review' },
    ],
  },
  {
    id: 'cyber-01',
    label: 'TG-Ember — Host Isolation',
    color: '#f5f5f5',
    domain: 'cyber',
    actual: {
      decision: 'Immediate isolation of 3 hosts + YARA deploy + IOC block. Auto-approved by Covenant.',
      outcome: 'Threat contained in 94 seconds. Zero lateral movement post-isolation. CISO briefed.',
      impactScore: 96,
      model: 'claude-sonnet-4',
      threshold: 0.95,
      humanApproval: false,
    },
    branches: [
      { id: 'b5', label: 'Observe for 30 minutes', description: 'Monitor behavior before isolating. Standard watch-and-wait protocol.', outcome: 'Lateral movement to 2 additional hosts in 18 minutes. IR scope tripled. +$140K remediation.', impactScore: 42, deltaVsActual: -54, risk: 'higher', timeoutDelta: '+18min exposure', costDelta: '+$140,000' },
      { id: 'b6', label: 'Lower threshold (0.80)', description: 'Trigger isolation at 0.80 IOC confidence instead of 0.95.', outcome: '2 false-positive isolations. 1 production server taken offline unnecessarily. 4h recovery.', impactScore: 71, deltaVsActual: -25, risk: 'higher', timeoutDelta: '+4h recovery', costDelta: '+$22,000' },
      { id: 'b7', label: 'Require CISO approval', description: 'Route isolation request to CISO before executing — adds approval latency.', outcome: 'CISO approved in 8 minutes. Partial lateral movement to 1 host. Contained but wider impact.', impactScore: 80, deltaVsActual: -16, risk: 'higher', timeoutDelta: '+8min exposure', costDelta: '+$35,000' },
    ],
  },
  {
    id: 'legal-01',
    label: 'Talbot — Motion to Compel',
    color: '#c9b787',
    domain: 'legal',
    actual: {
      decision: 'Draft and file motion to compel with late-filing precedents. Managing Partner approved.',
      outcome: 'Court granted motion. Discovery extended 14 days. Opposing counsel sanctioned.',
      impactScore: 92,
      model: 'gpt-4o',
      threshold: 0.90,
      humanApproval: true,
    },
    branches: [
      { id: 'b8', label: 'Request extension instead', description: 'File for extension rather than motion to compel. Lower confrontation approach.', outcome: 'Extension granted but opposing counsel continued delay tactics. Trial prep compressed by 3 weeks.', impactScore: 61, deltaVsActual: -31, risk: 'higher', timeoutDelta: '−3 weeks prep', costDelta: '+$18,000 billing' },
      { id: 'b9', label: 'No action at 48h', description: 'Wait until 24h deadline to alert. Standard practice, not early-warning.', outcome: 'Deadline met but rushed. Motion filed without optimal precedents. Court granted with caveat.', impactScore: 74, deltaVsActual: -18, risk: 'higher', timeoutDelta: '−24h prep', costDelta: '+$6,000 rush billing' },
      { id: 'b10', label: 'Different precedent set', description: 'System selects alternative precedent citations from different jurisdiction.', outcome: 'Motion filed. Court cited jurisdictional mismatch. Accepted but weaker outcome.', impactScore: 82, deltaVsActual: -10, risk: 'same', timeoutDelta: '±0', costDelta: '+$2,000' },
    ],
  },
  {
    id: 'revenue-01',
    label: 'Pipeline — Velocity Recovery',
    color: '#b08d52',
    domain: 'revenue',
    actual: {
      decision: 'Surface top 3 interventions: coaching, competitive re-framing, champion enablement. CFO notified.',
      outcome: 'W8 velocity recovered to 16.8 deals/week (+19% from trough). 3 at-risk deals closed.',
      impactScore: 84,
      model: 'gpt-4o',
      threshold: 0.80,
      humanApproval: true,
    },
    branches: [
      { id: 'b11', label: 'No intervention surfaced', description: 'System detects drop but does not surface recommendations. Passive monitoring.', outcome: 'Velocity continued to decline. Q2 miss by $3.8M. Board required explanation.', impactScore: 28, deltaVsActual: -56, risk: 'higher', timeoutDelta: '−6 weeks', costDelta: '−$3.8M revenue' },
      { id: 'b12', label: 'Single intervention only', description: 'System recommends coaching only — does not run full intervention scoring.', outcome: 'Partial recovery to 15.4 deals/week. 2 deals closed. CFO not notified of full scope.', impactScore: 66, deltaVsActual: -18, risk: 'same', timeoutDelta: '−4 weeks recovery', costDelta: '−$1.2M vs actual' },
      { id: 'b13', label: 'Threshold raised (0.90)', description: 'Only surface interventions with >90% confidence. Fewer recommendations.', outcome: 'Only 1 intervention surfaced. 1 deal closed. Coaching skipped due to lower confidence score.', impactScore: 58, deltaVsActual: -26, risk: 'higher', timeoutDelta: '−6 weeks', costDelta: '−$2.1M vs actual' },
    ],
  },
];

function ImpactBar({ score, color, baseline }: { score: number; color: string; baseline?: number }) {
  return (
    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      {baseline !== undefined && (
        <div className="absolute top-0 bottom-0 w-0.5" style={{ left: `${baseline}%`, background: 'rgba(255,255,255,0.4)' }} />
      )}
    </div>
  );
}

export function Counterfactuals() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const scenario = SCENARIOS.find(s => s.id === selectedScenario)!;
  const branch = selectedBranch ? scenario.branches.find(b => b.id === selectedBranch) : null;

  return (
    <Layout>
      <PageHeader
        label="COUNTERFACTUAL EXPLORER"
        title="What-If Analysis"
        subtitle="For any completed execution, explore alternate decisions: different model, lower threshold, no approval, delayed response. See impact deltas side-by-side."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="SCENARIOS" value={SCENARIOS.length} sub="pre-built" accent={T.accent} />
        <KpiCard label="BRANCHES" value={SCENARIOS.reduce((a, s) => a + s.branches.length, 0)} sub="total" accent={T.accent} />
        <KpiCard label="AVG IMPACT DELTA" value="−27pts" sub="vs actual best" accent={T.accent} />
        <KpiCard label="ACTUAL WIN RATE" value="100%" sub="vs counterfactuals" accent={T.dim} />
      </div>

      {/* Scenario selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => { setSelectedScenario(s.id); setSelectedBranch(null); }}
            className="px-4 py-2 rounded-lg text-xs font-mono transition-all"
            style={{
              background: selectedScenario === s.id ? `${s.color}18` : T.surface,
              border: `1px solid ${selectedScenario === s.id ? s.color + '40' : T.border}`,
              color: selectedScenario === s.id ? s.color : T.dim,
              cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Actual outcome */}
        <div>
          <SectionTitle>Actual Decision</SectionTitle>
          <Card style={{ borderLeft: `3px solid ${scenario.color}` }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: scenario.color }}>ACTUAL EXECUTION</div>
            <p className="text-xs mb-3" style={{ color: T.text }}>{scenario.actual.decision}</p>
            <div className="mb-3">
              <div className="text-[9px] font-mono mb-1" style={{ color: T.muted }}>OUTCOME</div>
              <p className="text-xs" style={{ color: T.dim }}>{scenario.actual.outcome}</p>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span style={{ color: T.muted }}>Impact Score</span>
                <span className="font-mono font-bold" style={{ color: scenario.color }}>{scenario.actual.impactScore}/100</span>
              </div>
              <ImpactBar score={scenario.actual.impactScore} color={scenario.color} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div><div style={{ color: T.muted }}>Model</div><div style={{ color: T.dim }}>{scenario.actual.model}</div></div>
              <div><div style={{ color: T.muted }}>Threshold</div><div style={{ color: T.dim }}>{scenario.actual.threshold}</div></div>
              <div><div style={{ color: T.muted }}>Human Approval</div><div style={{ color: T.dim }}>{scenario.actual.humanApproval ? 'Required' : 'Auto'}</div></div>
              <div><div style={{ color: T.muted }}>Domain</div><div style={{ color: scenario.color }}>{scenario.domain}</div></div>
            </div>
          </Card>

          <div className="mt-4">
            <SectionTitle>Select Branch</SectionTitle>
            <div className="flex flex-col gap-2">
              {scenario.branches.map(b => {
                const riskColor = b.risk === 'lower' ? '#c9b787' : b.risk === 'higher' ? '#f5f5f5' : '#8a8a8a';
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBranch(selectedBranch === b.id ? null : b.id)}
                    className="text-left rounded-lg p-3 transition-all"
                    style={{
                      background: selectedBranch === b.id ? `${riskColor}12` : T.surface,
                      border: `1px solid ${selectedBranch === b.id ? riskColor + '40' : T.border}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: `${riskColor}18`, color: riskColor }}>{b.risk} risk</span>
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>{b.deltaVsActual > 0 ? '+' : ''}{b.deltaVsActual}pts</span>
                    </div>
                    <div className="text-[10px]" style={{ color: selectedBranch === b.id ? T.text : T.dim }}>{b.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {branch ? (
              <motion.div key={branch.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <SectionTitle>Counterfactual: {branch.label}</SectionTitle>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {/* Counterfactual */}
                  <Card style={{ borderLeft: '3px solid rgba(255,255,255,0.15)' }}>
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>COUNTERFACTUAL</div>
                    <p className="text-xs mb-2" style={{ color: T.dim }}>{branch.description}</p>
                    <div className="mb-3">
                      <div className="text-[9px] font-mono mb-1" style={{ color: T.muted }}>OUTCOME</div>
                      <p className="text-xs" style={{ color: T.dim }}>{branch.outcome}</p>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span style={{ color: T.muted }}>Impact Score</span>
                        <span className="font-mono font-bold" style={{ color: '#8a8a8a' }}>{branch.impactScore}/100</span>
                      </div>
                      <ImpactBar score={branch.impactScore} color="#8a8a8a" baseline={scenario.actual.impactScore} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div><div style={{ color: T.muted }}>Time delta</div><div style={{ color: T.dim }}>{branch.timeoutDelta}</div></div>
                      <div><div style={{ color: T.muted }}>Cost delta</div><div style={{ color: T.dim }}>{branch.costDelta}</div></div>
                    </div>
                  </Card>

                  {/* Diff */}
                  <Card>
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>IMPACT DELTA</div>
                    <div className="text-4xl font-mono font-bold mb-1" style={{ color: branch.deltaVsActual < 0 ? '#f5f5f5' : '#c9b787' }}>
                      {branch.deltaVsActual > 0 ? '+' : ''}{branch.deltaVsActual}
                    </div>
                    <div className="text-[10px] mb-4" style={{ color: T.muted }}>points vs actual</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 text-[9px]" style={{ color: T.muted }}>Actual</div>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${scenario.actual.impactScore}%`, background: scenario.color }} />
                        </div>
                        <span className="text-[9px] font-mono w-8 text-right" style={{ color: scenario.color }}>{scenario.actual.impactScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 text-[9px]" style={{ color: T.muted }}>Counterfactual</div>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${branch.impactScore}%`, background: '#8a8a8a' }} />
                        </div>
                        <span className="text-[9px] font-mono w-8 text-right" style={{ color: '#8a8a8a' }}>{branch.impactScore}</span>
                      </div>
                    </div>
                    <div className="mt-4 p-2 rounded text-[10px]" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                      Risk level: <span style={{ color: branch.risk === 'higher' ? '#f5f5f5' : branch.risk === 'lower' ? '#c9b787' : '#8a8a8a' }}>{branch.risk}</span>
                    </div>
                  </Card>
                </div>

                <Card>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>ALL BRANCHES — COMPARISON</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] w-40 truncate" style={{ color: scenario.color }}>Actual Decision</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ width: `${scenario.actual.impactScore}%`, height: '100%', background: scenario.color, borderRadius: 999 }} />
                      </div>
                      <span className="text-[10px] font-mono w-8 text-right" style={{ color: scenario.color }}>{scenario.actual.impactScore}</span>
                    </div>
                    {scenario.branches.map(b => {
                      const rc = b.risk === 'higher' ? '#f5f5f5' : '#5e5e5e';
                      return (
                        <div key={b.id} className="flex items-center gap-3">
                          <span className="text-[10px] w-40 truncate" style={{ color: b.id === branch?.id ? T.dim : T.muted }}>{b.label}</span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div style={{ width: `${b.impactScore}%`, height: '100%', background: rc, borderRadius: 999, opacity: 0.7 }} />
                          </div>
                          <span className="text-[10px] font-mono w-8 text-right" style={{ color: rc }}>{b.impactScore}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64 rounded-lg" style={{ border: `1px dashed ${T.border}` }}>
                <div className="text-center text-xs" style={{ color: T.muted }}>
                  <div className="text-3xl mb-2" style={{ color: T.border }}>⇄</div>
                  Select a branch to compare with the actual decision
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
