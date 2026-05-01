/**
 * A11oy Ouroboros — Frustum Reconciliation surface.
 *
 * Demonstrates the MMP-14 frustum primitive applied to A11oy's hardest
 * problem: when agent A passes work to agent B and a third witness
 * observes both, prove all three saw the same artifact.
 *
 * Wires to /api/ouroboros/a11oy/reconcile-handoff. Pure REST.
 */
import { useMemo, useState } from 'react';
import { Layout } from '../components/layout';
import { Card, PageHeader, SectionTitle, ActionButton } from '../components/ui';

const GOLD = '#c9b787';
const NAVY = '#0a0a0a';
const GREY = '#8a8a8a';

interface FrustumGap {
  witnessId: string;
  missing: number;
}

interface ReconciliationReport {
  verdict: 'RECONCILED' | 'DIVERGENT' | 'INSUFFICIENT';
  unionVolume: number;
  intersectionVolume: number;
  perWitnessVolume: number[];
  meanVolume: number;
  maxSymmetricDifference: number;
  gaps: FrustumGap[];
}

interface HandoffVerdict {
  handoffId: string;
  verdict: 'RECONCILED' | 'DIVERGENT' | 'INSUFFICIENT';
  action: 'PROCEED' | 'QUARANTINE' | 'ABORT';
  report: ReconciliationReport;
  formula: string;
  timestamp: number;
}

const SCENARIOS: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  fromLeaves: string[];
  toLeaves: string[];
  observerLeaves: string[];
}> = [
  {
    id: 'reconciled',
    label: 'Reconciled handoff',
    description: 'All three witnesses observe the same five leaves.',
    fromLeaves: ['leaf-a', 'leaf-b', 'leaf-c', 'leaf-d', 'leaf-e'],
    toLeaves: ['leaf-a', 'leaf-b', 'leaf-c', 'leaf-d', 'leaf-e'],
    observerLeaves: ['leaf-a', 'leaf-b', 'leaf-c', 'leaf-d', 'leaf-e'],
  },
  {
    id: 'divergent',
    label: 'Divergent handoff',
    description: 'Observer disagrees on one leaf. Should quarantine.',
    fromLeaves: ['leaf-a', 'leaf-b', 'leaf-c', 'leaf-d'],
    toLeaves: ['leaf-a', 'leaf-b', 'leaf-c', 'leaf-d'],
    observerLeaves: ['leaf-a', 'leaf-b', 'leaf-c', 'leaf-X'],
  },
  {
    id: 'partial-loss',
    label: 'Partial loss',
    description: 'Receiver missed a leaf. Frustum spots the gap.',
    fromLeaves: ['leaf-a', 'leaf-b', 'leaf-c', 'leaf-d'],
    toLeaves: ['leaf-a', 'leaf-b', 'leaf-c'],
    observerLeaves: ['leaf-a', 'leaf-b', 'leaf-c', 'leaf-d'],
  },
];

function VerdictBadge({ verdict }: { verdict: HandoffVerdict['verdict'] }) {
  const colors: Record<HandoffVerdict['verdict'], string> = {
    RECONCILED: GOLD,
    DIVERGENT: '#e08a4a',
    INSUFFICIENT: '#8a8a8a',
  };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: colors[verdict] }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[verdict] }} />
      {verdict}
    </span>
  );
}

export function Ouroboros() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [verdict, setVerdict] = useState<HandoffVerdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );

  async function runReconcile() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ouroboros/a11oy/reconcile-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handoffId: `${scenario.id}-${Date.now()}`,
          fromAgent: 'agent-A',
          toAgent: 'agent-B',
          observerAgent: 'agent-C',
          fromLeaves: scenario.fromLeaves,
          toLeaves: scenario.toLeaves,
          observerLeaves: scenario.observerLeaves,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = (await res.json()) as HandoffVerdict;
      setVerdict(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <PageHeader
          label="OUROBOROS · MMP-14"
          title="Frustum Reconciliation"
          subtitle="Three-witness verification for A11oy fleet handoffs. RECONCILED → PROCEED. DIVERGENT → QUARANTINE."
          status="LIVE"
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <SectionTitle>Scenario</SectionTitle>
            <div className="mt-4 space-y-2">
              {SCENARIOS.map((s) => (
                <label
                  key={s.id}
                  className="flex items-start gap-3 p-3 rounded cursor-pointer"
                  style={{
                    backgroundColor:
                      scenarioId === s.id ? 'rgba(201,183,135,0.08)' : 'rgba(255,255,255,0.02)',
                    border:
                      scenarioId === s.id
                        ? '1px solid rgba(201,183,135,0.4)'
                        : '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <input
                    type="radio"
                    name="scenario"
                    value={s.id}
                    checked={scenarioId === s.id}
                    onChange={() => setScenarioId(s.id)}
                    className="mt-1"
                    style={{ accentColor: GOLD }}
                  />
                  <div>
                    <div className="font-mono text-sm" style={{ color: '#f5f5f5' }}>
                      {s.label}
                    </div>
                    <div className="text-xs mt-1" style={{ color: GREY }}>
                      {s.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-6">
              <ActionButton onClick={runReconcile} disabled={loading}>
                {loading ? 'Reconciling…' : 'Run frustum reconciliation'}
              </ActionButton>
            </div>
            {error && (
              <div
                className="mt-4 p-3 rounded text-sm font-mono"
                style={{ backgroundColor: 'rgba(245,245,245,0.04)', color: '#e08a4a' }}
              >
                {error}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Frustum verdict</SectionTitle>
            {verdict ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <VerdictBadge verdict={verdict.verdict} />
                  <span className="text-xs font-mono" style={{ color: GREY }}>
                    action: {verdict.action}
                  </span>
                </div>
                <div
                  className="font-mono text-sm p-3 rounded"
                  style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: GOLD }}
                >
                  {verdict.formula}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm font-mono">
                  <div>
                    <dt style={{ color: GREY }}>Union volume</dt>
                    <dd style={{ color: '#f5f5f5' }}>{verdict.report.unionVolume}</dd>
                  </div>
                  <div>
                    <dt style={{ color: GREY }}>Intersection</dt>
                    <dd style={{ color: '#f5f5f5' }}>{verdict.report.intersectionVolume}</dd>
                  </div>
                  <div>
                    <dt style={{ color: GREY }}>Mean witness</dt>
                    <dd style={{ color: '#f5f5f5' }}>{verdict.report.meanVolume.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt style={{ color: GREY }}>Max sym diff</dt>
                    <dd style={{ color: '#f5f5f5' }}>{verdict.report.maxSymmetricDifference}</dd>
                  </div>
                </dl>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: GREY }}>
                    Witness gaps
                  </div>
                  <ul className="space-y-1 text-sm font-mono">
                    {verdict.report.gaps.map((g) => (
                      <li key={g.witnessId} className="flex justify-between">
                        <span style={{ color: '#f5f5f5' }}>{g.witnessId}</span>
                        <span style={{ color: g.missing === 0 ? GOLD : '#e08a4a' }}>
                          missing {g.missing}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div
                className="mt-4 text-sm"
                style={{ color: GREY }}
              >
                Pick a scenario and run reconciliation. The frustum formula
                <span className="font-mono" style={{ color: GOLD }}>
                  {' '}V_T = (1/3)(a² + ab + b²){' '}
                </span>
                quantifies disagreement across three witnesses.
              </div>
            )}
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <SectionTitle>Why this matters</SectionTitle>
            <div className="mt-3 text-sm" style={{ color: GREY }}>
              Egyptian mathematicians on Moscow Mathematical Papyrus problem 14
              (c. 1850 BCE) computed the volume of a truncated pyramid. We
              reuse that primitive to detect divergence in three-agent
              handoffs: the frustum's lower base is the union of observed
              leaves, the upper base is the intersection, and the volume
              quantifies how much the witnesses disagreed. RECONCILED
              handoffs proceed; DIVERGENT handoffs are quarantined for
              review; INSUFFICIENT (any witness empty) abort.
            </div>
            <div
              className="mt-3 text-xs font-mono"
              style={{ color: GOLD }}
            >
              POST /api/ouroboros/a11oy/reconcile-handoff
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default Ouroboros;
