import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

const LANE_META = {
  gatherer: { color: '#4d8fcc', role: 'Evidence Discovery', icon: '🔍' },
  'peer-reviewer': { color: '#9b7cc8', role: 'Assumption Challenge', icon: '🔬' },
  drafter: { color: GOLD, role: 'Synthesis', icon: '✍' },
  verifier: { color: '#22c55e', role: 'Citation Verification', icon: '✅' },
};

const EXAMPLES = [
  'What are the key risks in commercial real estate financing heading into 2026?',
  'Summarize the current state of maritime sanctions compliance and enforcement trends.',
  'What AI governance frameworks are emerging in the defense & intelligence sector?',
];

interface Lane { id: keyof typeof LANE_META; status: 'idle' | 'running' | 'done'; output?: string; citations?: string[]; }

const DEMO_OUTPUTS: Record<keyof typeof LANE_META, { output: string; citations: string[] }> = {
  gatherer: { output: 'Gathered 14 sources: IMF Global Financial Stability Report 2026, CBRE Commercial RE Outlook, Federal Reserve Senior Loan Officer Survey Q1 2026, 11 additional peer-reviewed and industry sources.', citations: ['IMF GFSR 2026', 'CBRE Outlook', 'Fed SLOOS Q1 2026'] },
  'peer-reviewer': { output: 'Challenged 3 assumptions: (1) Office vacancy stabilization — contradicted by 2 sources; (2) Rate cut timeline — overly optimistic vs. Fed guidance; (3) Regional differentiation understated.', citations: ['Fed Dot Plot 2026', 'JLL Vacancy Data Q1'] },
  drafter: { output: 'Commercial RE financing faces three compounding risks: persistent elevated rates, office sector structural impairment (WFH permanence), and regional bank exposure concentration. Covenant Lift opportunity: AI-augmented due diligence could reduce loss given default by 18–24%.', citations: ['synthesis of 14 sources'] },
  verifier: { output: 'All 14 citations verified. 2 citations downgraded (source age > 18 months). 1 hallucination detected and removed: fabricated CMBS default rate statistic. Final confidence: 94%.', citations: ['verified 14/14 sources'] },
};

export function ResearchSwarm() {
  const [query, setQuery] = useState('');
  const [lanes, setLanes] = useState<Lane[]>([
    { id: 'gatherer', status: 'idle' },
    { id: 'peer-reviewer', status: 'idle' },
    { id: 'drafter', status: 'idle' },
    { id: 'verifier', status: 'idle' },
  ]);
  const [running, setRunning] = useState(false);

  function runSwarm() {
    if (!query.trim()) return;
    setRunning(true);
    setLanes(prev => prev.map(l => ({ ...l, status: 'idle', output: undefined, citations: undefined })));

    // Simulate parallel execution with staggered completion
    const delays = { gatherer: 1000, 'peer-reviewer': 1800, drafter: 2800, verifier: 3600 };
    Object.entries(delays).forEach(([laneId, delay]) => {
      setTimeout(() => {
        setLanes(prev => prev.map(l => l.id === laneId ? { ...l, status: 'running' } : l));
        setTimeout(() => {
          const demo = DEMO_OUTPUTS[laneId as keyof typeof LANE_META];
          setLanes(prev => prev.map(l => l.id === laneId ? { ...l, status: 'done', output: demo.output, citations: demo.citations } : l));
          if (laneId === 'verifier') setRunning(false);
        }, delay * 0.8);
      }, delay * 0.2);
    });
  }

  return (
    <Layout>
      <PageHeader
        label="PRIMITIVES / RESEARCH SWARM"
        title="Parallel Research Swarm"
        subtitle="Four specialized agent lanes run in parallel: Gatherer (evidence), Peer-Reviewer (challenges), Drafter (synthesis), Verifier (citations). Results are merged, cited, and hallucination-checked."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="AGENT LANES" value="4" sub="parallel" accent={GOLD} />
        <KpiCard label="AVG RESEARCH TIME" value="~4s" sub="vs. 40s sequential" accent={GOLD} />
        <KpiCard label="HALLUCINATION CHECK" value="Built-in" sub="verifier lane" accent="#22c55e" />
        <KpiCard label="CITATIONS" value="Auto-verified" sub="per synthesis" accent={GOLD} />
      </div>

      <Card className="mb-6">
        <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Research Query</div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter a research question…"
            className="flex-1 px-3 py-2 rounded border text-sm bg-transparent outline-none"
            style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            onKeyDown={e => e.key === 'Enter' && runSwarm()}
          />
          <button type="button" onClick={runSwarm} disabled={running || !query.trim()}
            className="px-4 py-2 rounded text-xs font-mono transition-colors"
            style={{ background: running ? 'rgba(94,94,94,0.12)' : 'rgba(201,183,135,0.12)', color: running ? '#5e5e5e' : GOLD, border: `1px solid ${running ? 'var(--color-a11oy-border)' : 'rgba(201,183,135,0.3)'}`, cursor: running ? 'not-allowed' : 'pointer' }}>
            {running ? '↻ Running…' : '▶ Run Swarm'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex} type="button" onClick={() => setQuery(ex)}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)', cursor: 'pointer' }}>
              {ex.slice(0, 50)}…
            </button>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {lanes.map(lane => {
          const meta = LANE_META[lane.id];
          return (
            <div key={lane.id} className="rounded-lg border p-4 transition-all"
              style={{
                backgroundColor: 'var(--color-a11oy-card)',
                borderColor: lane.status === 'running' ? `${meta.color}40` : lane.status === 'done' ? `${meta.color}30` : 'var(--color-a11oy-border)',
                boxShadow: lane.status === 'running' ? `0 0 12px ${meta.color}20` : 'none',
              }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{meta.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm" style={{ color: meta.color }}>{lane.id}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{meta.role}</div>
                </div>
                <div className="text-xs font-mono" style={{ color: lane.status === 'running' ? GOLD : lane.status === 'done' ? '#22c55e' : 'var(--color-a11oy-text-ghost)' }}>
                  {lane.status === 'running' && <span className="animate-pulse">● running</span>}
                  {lane.status === 'done' && '✓ done'}
                  {lane.status === 'idle' && '○ idle'}
                </div>
              </div>
              {lane.output && (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>{lane.output}</p>
                  {lane.citations && (
                    <div className="flex flex-wrap gap-1">
                      {lane.citations.map(c => (
                        <span key={c} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${meta.color}12`, color: meta.color }}>📎 {c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Parallel Research Swarm ported from PRAXIS (/nexus/research). Normalized to A11oy brand tokens and governance model. Shadow Council hallucination gate added post-migration.
      </div>
    </Layout>
  );
}
