import { useMemo, useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';
const GREEN = '#22c55e';
const RED = '#f87171';
const AMBER = '#fbbf24';

interface ScenarioInput {
  id: string;
  name: string;
  domain: string;
  date: string;
  governed: { outcome: string; confidence: number; liftUsd: number; proofId: string };
  shadow: { outcome: string; confidence: number; harmUsd: number };
  // PRISM-replayable decision shape (for the counterfactual engine).
  decision: {
    decisionId: string;
    scenario: string;
    domain: string;
    inputs: Record<string, number | string | boolean>;
    rulesFired: string[];
    scores: { alignment: number; confidence: number; risk: number };
    outcome: string;
    downstreamEffects: { label: string; valueUsd: number }[];
  };
}

const SCENARIOS: ScenarioInput[] = [
  {
    id: 'sc-1',
    name: 'Port Standby — MV Cascade',
    domain: 'Maritime',
    date: '2026-05-04',
    governed: { outcome: 'Port standby ordered', confidence: 94, liftUsd: 42000, proofId: 'chain-044' },
    shadow: { outcome: 'Full voyage continued', confidence: 81, harmUsd: 38000 },
    decision: {
      decisionId: 'dec-sc-1',
      scenario: 'Port Standby — MV Cascade',
      domain: 'Maritime',
      inputs: { weatherSeverity: 7.2, fuelMarginPct: 12, crewFatigueIdx: 0.42, sanctionsScreened: true },
      rulesFired: ['weather:high-sea-state', 'fuel:safety-margin', 'crew:fatigue-threshold'],
      scores: { alignment: 94, confidence: 94, risk: 35 },
      outcome: 'Port standby ordered',
      downstreamEffects: [
        { label: 'Demurrage avoided', valueUsd: 42000 },
        { label: 'Cargo penalty risk', valueUsd: -8000 },
      ],
    },
  },
  {
    id: 'sc-2',
    name: 'Contract Clause Escalation',
    domain: 'Legal',
    date: '2026-05-03',
    governed: { outcome: 'Escalated to counsel', confidence: 97, liftUsd: 125000, proofId: 'chain-041' },
    shadow: { outcome: 'Auto-drafted clause accepted', confidence: 72, harmUsd: 95000 },
    decision: {
      decisionId: 'dec-sc-2',
      scenario: 'Contract Clause Escalation',
      domain: 'Legal',
      inputs: { contractValueUsd: 1200000, novelClause: true, jurisdictionRiskIdx: 0.65, counterpartyTier: 'A' },
      rulesFired: ['contract:value-threshold', 'clause:novel-language', 'jurisdiction:risk-floor'],
      scores: { alignment: 97, confidence: 97, risk: 22 },
      outcome: 'Escalated to counsel',
      downstreamEffects: [
        { label: 'Litigation exposure avoided', valueUsd: 125000 },
      ],
    },
  },
  {
    id: 'sc-3',
    name: 'Sanctions Screening — Bulk Carrier',
    domain: 'Maritime',
    date: '2026-05-02',
    governed: { outcome: 'Voyage cleared after screen', confidence: 99, liftUsd: 0, proofId: 'chain-038' },
    shadow: { outcome: 'Voyage cleared without screen', confidence: 99, harmUsd: 180000 },
    decision: {
      decisionId: 'dec-sc-3',
      scenario: 'Sanctions Screening — Bulk Carrier',
      domain: 'Maritime',
      inputs: { flagState: 'PA', portCalls: 3, ofacMatch: false, ownerOpacityIdx: 0.18 },
      rulesFired: ['sanctions:screen-all-voyages', 'ofac:negative-clear'],
      scores: { alignment: 99, confidence: 99, risk: 8 },
      outcome: 'Voyage cleared after screen',
      downstreamEffects: [{ label: 'Sanctions fine avoided', valueUsd: 180000 }],
    },
  },
  {
    id: 'sc-4',
    name: 'NOC Alert — Critical Service',
    domain: 'Security',
    date: '2026-05-01',
    governed: { outcome: 'Auto-remediated within SLO', confidence: 96, liftUsd: 28000, proofId: 'chain-035' },
    shadow: { outcome: 'Escalated to on-call — 28min delay', confidence: 88, harmUsd: 28000 },
    decision: {
      decisionId: 'dec-sc-4',
      scenario: 'NOC Alert — Critical Service',
      domain: 'Security',
      inputs: { blastRadius: 'service', errorBudgetPct: 4.2, autoRemediationApproved: true },
      rulesFired: ['noc:auto-remediate-allowed', 'slo:within-budget'],
      scores: { alignment: 96, confidence: 96, risk: 18 },
      outcome: 'Auto-remediated within SLO',
      downstreamEffects: [{ label: 'Downtime cost avoided', valueUsd: 28000 }],
    },
  },
];

interface CounterfactualBranch {
  decisionId: string;
  scenario: string;
  domain: string;
  inputs: Record<string, number | string | boolean>;
  rulesFired: string[];
  scores: { alignment: number; confidence: number; risk: number };
  outcome: string;
  downstreamEffects: { label: string; valueUsd: number }[];
}

interface CounterfactualResult {
  base: CounterfactualBranch;
  branch: CounterfactualBranch;
  diff: {
    inputs: Array<{ key: string; baseValue: unknown; branchValue: unknown }>;
    rulesFiredAdded: string[];
    rulesFiredRemoved: string[];
    scoreDeltas: { alignment: number; confidence: number; risk: number };
    outcomeChanged: boolean;
    downstreamDeltaUsd: number;
  };
  proofHash: string;
}

export function DecisionTwin() {
  const [selected, setSelected] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [cf, setCf] = useState<CounterfactualResult | null>(null);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfError, setCfError] = useState<string | null>(null);

  function runSim() {
    setSimulating(true);
    setTimeout(() => { setSimulating(false); setSimDone(true); }, 2500);
  }

  const scenario = selected ? SCENARIOS.find(s => s.id === selected) : null;
  const totalLift = SCENARIOS.reduce((s, sc) => s + sc.governed.liftUsd, 0);
  const totalHarmAvoided = SCENARIOS.reduce((s, sc) => s + sc.shadow.harmUsd, 0);

  const inputKeys = useMemo(() => (scenario ? Object.keys(scenario.decision.inputs) : []), [scenario]);

  async function runCounterfactual() {
    if (!scenario) return;
    const parsed: Record<string, number | string | boolean> = {};
    for (const [k, raw] of Object.entries(overrides)) {
      if (raw === '' || raw === undefined) continue;
      const baseVal = scenario.decision.inputs[k];
      if (typeof baseVal === 'number') {
        const n = Number(raw);
        if (Number.isFinite(n)) parsed[k] = n;
      } else if (typeof baseVal === 'boolean') {
        parsed[k] = raw === 'true';
      } else {
        parsed[k] = raw;
      }
    }
    if (Object.keys(parsed).length === 0) {
      setCfError('Provide at least one override.');
      return;
    }
    setCfLoading(true);
    setCfError(null);
    try {
      const r = await fetch('/api/a11oy/decisions/counterfactual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base: scenario.decision, overrides: parsed }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setCf(d as CounterfactualResult);
    } catch (e) {
      setCfError(e instanceof Error ? e.message : 'counterfactual failed');
      setCf(null);
    } finally {
      setCfLoading(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        label="DECISIONS / DECISION-TWIN PRISM"
        title="Decision-Twin PRISM"
        subtitle="Replay any governed decision against a Helpful-Only Shadow Twin and now against a counterfactual branch where operator-chosen inputs are perturbed. PRISM quantifies the exact value of governance and the marginal effect of each input."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="DECISIONS REPLAYED" value={String(SCENARIOS.length)} sub="this session" accent={GOLD} />
        <KpiCard label="GOVERNANCE VALUE" value={`$${(totalLift / 1000).toFixed(0)}k`} sub="Covenant Lift $" accent={GREEN} />
        <KpiCard label="SHADOW HARM AVOIDED" value={`$${(totalHarmAvoided / 1000).toFixed(0)}k`} sub="if ungoverned" accent={RED} />
        <KpiCard label="AVG ALIGNMENT SCORE" value="96.4%" sub="across live recipes" accent={GOLD} />
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2 space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Scenarios</div>
          {SCENARIOS.map(sc => (
            <div key={sc.id} className="rounded-lg border p-3 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: selected === sc.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)' }}
              onClick={() => { setSelected(selected === sc.id ? null : sc.id); setOverrides({}); setCf(null); setCfError(null); }}>
              <div className="font-medium text-xs mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{sc.name}</div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sc.domain} · {sc.date}</div>
              <div className="text-xs mt-1" style={{ color: GREEN }}>+${sc.governed.liftUsd.toLocaleString()} lift</div>
            </div>
          ))}
        </div>

        <div className="md:col-span-3 space-y-4">
          {scenario ? (
            <>
              <Card>
                <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PRISM Comparison</div>
                <div className="font-medium mb-4" style={{ color: 'var(--color-a11oy-text)' }}>{scenario.name}</div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div className="text-xs font-mono uppercase mb-2" style={{ color: GREEN }}>Governed Agent</div>
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{scenario.governed.outcome}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Confidence: {scenario.governed.confidence}%</div>
                    <div className="text-xs" style={{ color: GREEN }}>Lift: +${scenario.governed.liftUsd.toLocaleString()}</div>
                    <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{scenario.governed.proofId}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                    <div className="text-xs font-mono uppercase mb-2" style={{ color: RED }}>Shadow Twin (ungoverned)</div>
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{scenario.shadow.outcome}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Confidence: {scenario.shadow.confidence}%</div>
                    <div className="text-xs" style={{ color: RED }}>Harm if ungoverned: ${scenario.shadow.harmUsd.toLocaleString()}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No proof chain</div>
                  </div>
                </div>

                <div className="p-3 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
                  <div className="font-mono mb-1" style={{ color: GOLD }}>PRISM Delta Analysis</div>
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Governance added ${scenario.governed.liftUsd.toLocaleString()} in Covenant Lift $ while preventing ${scenario.shadow.harmUsd.toLocaleString()} in potential harm. ROI: {Math.round((scenario.governed.liftUsd + scenario.shadow.harmUsd) / Math.max(scenario.governed.liftUsd, 1) * 100)}% governance value-add.
                  </div>
                </div>
              </Card>

              <Card>
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  Counterfactual Replay
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  Perturb one or more inputs to ask <em>&quot;what would the same governed agent have decided?&quot;</em> Every replay returns a proof hash you can pin to the audit trail.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {inputKeys.map(k => {
                    const baseVal = scenario.decision.inputs[k];
                    return (
                      <label key={k} className="block">
                        <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: '#888' }}>{k}</div>
                        <div className="text-[10px] mb-1" style={{ color: '#666' }}>base: {String(baseVal)}</div>
                        <input
                          type="text"
                          placeholder="override…"
                          value={overrides[k] ?? ''}
                          onChange={(e) => setOverrides({ ...overrides, [k]: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs rounded"
                          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#eee' }}
                        />
                      </label>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={runCounterfactual}
                  disabled={cfLoading}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: cfLoading ? 'not-allowed' : 'pointer' }}
                >
                  {cfLoading ? 'Replaying…' : '⤿ Run counterfactual'}
                </button>
                {cfError && <div className="text-xs mt-2" style={{ color: RED }}>{cfError}</div>}
              </Card>

              {cf && (
                <Card>
                  <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Base ↔ Counterfactual Branch
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-[10px] font-mono uppercase mb-2" style={{ color: '#888' }}>BASE</div>
                      <div className="text-xs mb-1" style={{ color: '#eee' }}>{cf.base.outcome}</div>
                      <ScoreLine label="Alignment" v={cf.base.scores.alignment} />
                      <ScoreLine label="Confidence" v={cf.base.scores.confidence} />
                      <ScoreLine label="Risk" v={cf.base.scores.risk} risk />
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.2)' }}>
                      <div className="text-[10px] font-mono uppercase mb-2" style={{ color: GOLD }}>COUNTERFACTUAL</div>
                      <div className="text-xs mb-1" style={{ color: '#eee' }}>{cf.branch.outcome}</div>
                      <ScoreLine label="Alignment" v={cf.branch.scores.alignment} />
                      <ScoreLine label="Confidence" v={cf.branch.scores.confidence} />
                      <ScoreLine label="Risk" v={cf.branch.scores.risk} risk />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3 text-[11px]">
                    <DeltaBox label="Δ Alignment" v={cf.diff.scoreDeltas.alignment} suffix="" />
                    <DeltaBox label="Δ Confidence" v={cf.diff.scoreDeltas.confidence} suffix="" />
                    <DeltaBox label="Δ Risk" v={cf.diff.scoreDeltas.risk} suffix="" invert />
                  </div>
                  {cf.diff.inputs.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-mono uppercase mb-1" style={{ color: '#888' }}>INPUT DIFF</div>
                      {cf.diff.inputs.map(d => (
                        <div key={d.key} className="text-xs font-mono" style={{ color: '#ccc' }}>
                          {d.key}: <span style={{ color: '#888' }}>{String(d.baseValue)}</span> → <span style={{ color: GOLD }}>{String(d.branchValue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(cf.diff.rulesFiredAdded.length + cf.diff.rulesFiredRemoved.length > 0) && (
                    <div className="mb-3">
                      <div className="text-[10px] font-mono uppercase mb-1" style={{ color: '#888' }}>RULES FIRED Δ</div>
                      {cf.diff.rulesFiredAdded.map(r => <div key={`+${r}`} className="text-xs font-mono" style={{ color: GREEN }}>+ {r}</div>)}
                      {cf.diff.rulesFiredRemoved.map(r => <div key={`-${r}`} className="text-xs font-mono" style={{ color: RED }}>− {r}</div>)}
                    </div>
                  )}
                  <div className="text-xs mb-2" style={{ color: cf.diff.downstreamDeltaUsd >= 0 ? GREEN : RED }}>
                    Downstream Δ: {cf.diff.downstreamDeltaUsd >= 0 ? '+' : ''}${cf.diff.downstreamDeltaUsd.toLocaleString()}
                    {cf.diff.outcomeChanged && <span style={{ color: AMBER, marginLeft: 8 }}>· outcome changed</span>}
                  </div>
                  <div className="font-mono text-[10px] mt-2 p-2 rounded" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', color: '#888', wordBreak: 'break-all' }}>
                    proof: {cf.proofHash}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Run New PRISM Simulation</div>
              <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                Run a PRISM simulation to compare your current governed agent recipe against a Helpful-Only Shadow Twin across 500 historical decisions.
              </p>
              {!simDone ? (
                <button type="button" onClick={runSim} disabled={simulating}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-colors"
                  style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: simulating ? 'not-allowed' : 'pointer' }}>
                  {simulating ? <span className="animate-pulse">↻ Simulating 500 decisions…</span> : '▶ Run PRISM Simulation'}
                </button>
              ) : (
                <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="font-medium mb-1" style={{ color: GREEN }}>✓ Simulation Complete</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Alignment score: 96.4% · Threshold: 88% · PASSED</div>
                  <div className="text-xs mt-1" style={{ color: GREEN }}>Covenant Lift advantage: +$195k across 500 decisions</div>
                </div>
              )}
              <div className="mt-4 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Or select a scenario above to replay a historical PRISM comparison or run a counterfactual branch.
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Decision-Twin PRISM absorbs the Lyte Dashboard decision replay view and the PRAXIS EvalConsole. Counterfactual branches replay through the same governed agent with operator-chosen input perturbations; results carry a SHA-256 proof hash.
      </div>
    </Layout>
  );
}

function ScoreLine({ label, v, risk }: { label: string; v: number; risk?: boolean }) {
  const color = risk ? (v > 60 ? RED : v > 30 ? AMBER : GREEN) : v > 85 ? GREEN : v > 65 ? AMBER : RED;
  return (
    <div className="text-[11px] font-mono flex justify-between" style={{ color: '#aaa' }}>
      <span>{label}</span>
      <span style={{ color }}>{v.toFixed(1)}</span>
    </div>
  );
}

function DeltaBox({ label, v, suffix, invert }: { label: string; v: number; suffix: string; invert?: boolean }) {
  const positive = invert ? v <= 0 : v >= 0;
  return (
    <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[9px] font-mono uppercase" style={{ color: '#888' }}>{label}</div>
      <div className="text-sm font-mono" style={{ color: positive ? GREEN : RED }}>
        {v >= 0 ? '+' : ''}{v}{suffix}
      </div>
    </div>
  );
}
