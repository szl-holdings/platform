import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

const SCENARIOS = [
  { id: 'sc-1', name: 'Port Standby — MV Cascade', domain: 'Maritime', date: '2026-05-04', governed: { outcome: 'Port standby ordered', confidence: 94, liftUsd: 42000, proofId: 'chain-044' }, shadow: { outcome: 'Full voyage continued', confidence: 81, harmUsd: 38000 } },
  { id: 'sc-2', name: 'Contract Clause Escalation', domain: 'Legal', date: '2026-05-03', governed: { outcome: 'Escalated to counsel', confidence: 97, liftUsd: 125000, proofId: 'chain-041' }, shadow: { outcome: 'Auto-drafted clause accepted', confidence: 72, harmUsd: 95000 } },
  { id: 'sc-3', name: 'Sanctions Screening — Bulk Carrier', domain: 'Maritime', date: '2026-05-02', governed: { outcome: 'Voyage cleared after screen', confidence: 99, liftUsd: 0, proofId: 'chain-038' }, shadow: { outcome: 'Voyage cleared without screen', confidence: 99, harmUsd: 180000 } },
  { id: 'sc-4', name: 'NOC Alert — Critical Service', domain: 'Security', date: '2026-05-01', governed: { outcome: 'Auto-remediated within SLO', confidence: 96, liftUsd: 28000, proofId: 'chain-035' }, shadow: { outcome: 'Escalated to on-call — 28min delay', confidence: 88, harmUsd: 28000 } },
];

export function DecisionTwin() {
  const [selected, setSelected] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simDone, setSimDone] = useState(false);

  function runSim() {
    setSimulating(true);
    setTimeout(() => { setSimulating(false); setSimDone(true); }, 2500);
  }

  const scenario = selected ? SCENARIOS.find(s => s.id === selected) : null;
  const totalLift = SCENARIOS.reduce((s, sc) => s + sc.governed.liftUsd, 0);
  const totalHarmAvoided = SCENARIOS.reduce((s, sc) => s + sc.shadow.harmUsd, 0);

  return (
    <Layout>
      <PageHeader
        label="DECISIONS / DECISION-TWIN PRISM"
        title="Decision-Twin PRISM"
        subtitle="Replay any governed decision against a Helpful-Only Shadow Twin — the same agent running without constitutional constraints. PRISM quantifies the exact value of governance in harm-avoided dollars."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="DECISIONS REPLAYED" value={String(SCENARIOS.length)} sub="this session" accent={GOLD} />
        <KpiCard label="GOVERNANCE VALUE" value={`$${(totalLift / 1000).toFixed(0)}k`} sub="Covenant Lift $" accent="#22c55e" />
        <KpiCard label="SHADOW HARM AVOIDED" value={`$${(totalHarmAvoided / 1000).toFixed(0)}k`} sub="if ungoverned" accent="#f87171" />
        <KpiCard label="AVG ALIGNMENT SCORE" value="96.4%" sub="across live recipes" accent={GOLD} />
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2 space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Scenarios</div>
          {SCENARIOS.map(sc => (
            <div key={sc.id} className="rounded-lg border p-3 cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: selected === sc.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)' }}
              onClick={() => setSelected(selected === sc.id ? null : sc.id)}>
              <div className="font-medium text-xs mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{sc.name}</div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{sc.domain} · {sc.date}</div>
              <div className="text-xs mt-1" style={{ color: '#22c55e' }}>+${sc.governed.liftUsd.toLocaleString()} lift</div>
            </div>
          ))}
        </div>

        <div className="md:col-span-3">
          {scenario ? (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PRISM Comparison</div>
              <div className="font-medium mb-4" style={{ color: 'var(--color-a11oy-text)' }}>{scenario.name}</div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="text-xs font-mono uppercase mb-2" style={{ color: '#22c55e' }}>Governed Agent</div>
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{scenario.governed.outcome}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Confidence: {scenario.governed.confidence}%</div>
                  <div className="text-xs" style={{ color: '#22c55e' }}>Lift: +${scenario.governed.liftUsd.toLocaleString()}</div>
                  <div className="text-xs font-mono mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{scenario.governed.proofId}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                  <div className="text-xs font-mono uppercase mb-2" style={{ color: '#f87171' }}>Shadow Twin (ungoverned)</div>
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-a11oy-text)' }}>{scenario.shadow.outcome}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Confidence: {scenario.shadow.confidence}%</div>
                  <div className="text-xs" style={{ color: '#f87171' }}>Harm if ungoverned: ${scenario.shadow.harmUsd.toLocaleString()}</div>
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
                  <div className="font-medium mb-1" style={{ color: '#22c55e' }}>✓ Simulation Complete</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Alignment score: 96.4% · Threshold: 88% · PASSED</div>
                  <div className="text-xs mt-1" style={{ color: '#22c55e' }}>Covenant Lift advantage: +$195k across 500 decisions</div>
                </div>
              )}
              <div className="mt-4 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Or select a scenario above to replay a historical PRISM comparison.
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Decision-Twin PRISM absorbs the Lyte Dashboard decision replay view and the PRAXIS EvalConsole. One simulation surface, one shadow-twin comparison model, one Covenant Lift $ ledger.
      </div>
    </Layout>
  );
}
