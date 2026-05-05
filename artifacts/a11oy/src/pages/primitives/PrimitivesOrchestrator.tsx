import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

interface Step {
  id: string;
  agent: string;
  action: string;
  reasoning: string;
  input?: string;
  output?: string;
  status: 'pending' | 'running' | 'done' | 'error';
  protocol: string;
}

const DEMO_TASK = 'Assess regulatory risk for a new dry bulk shipping route from Brazil to China, covering sanctions exposure, port state control, and contract obligations.';

const DEMO_STEPS: Step[] = [
  { id: 's1', agent: 'Research Swarm', action: 'gather_regulatory_signals', reasoning: 'Need current regulatory data before risk assessment. Dispatching Research Swarm to gather Brazil–China route signals.', input: 'Brazil, China, dry bulk, 2026', output: '14 regulatory signals gathered: OFAC shipping advisory, China port state control Q1 2026 report, BIMCO contract templates.', status: 'done', protocol: 'A2A' },
  { id: 's2', agent: 'Cascade Navigator', action: 'screen_sanctions_exposure', reasoning: 'Route passes near sanctioned entities. Cascade Navigator has maritime sanctions domain expertise and access to OFAC/UN lists.', input: 'Route: Santos → Qingdao · Vessel type: dry bulk', output: 'Sanctions clear. 0 flagged entities on voyage manifest. Port of Qingdao: clean. Santos: clean. Intermediate ports: none.', status: 'done', protocol: 'MCP' },
  { id: 's3', agent: 'Counsel Sentinel', action: 'review_contract_obligations', reasoning: 'Contract review requires privileged legal analysis. Routing to Counsel Sentinel with sovereign governance tier.', input: '8 contract documents · BIMCO format', output: '3 material obligations identified: laytime clause (72h free time), deviation clause (port of refuge permitted), force majeure scope (includes port congestion).', status: 'done', protocol: 'ACP' },
  { id: 's4', agent: 'Cascade Navigator', action: 'synthesize_risk_assessment', reasoning: 'All signals gathered. Synthesizing final risk assessment with Proof Chain logging.', input: 'Regulatory signals + sanctions result + contract obligations', output: 'Overall risk: MODERATE. Primary risk: port state control delays at Qingdao (avg 2.1 days Q1 2026). Recommendation: include 96h laytime buffer. Proof Chain ID: chain-045.', status: 'done', protocol: 'ANP' },
];

export function PrimitivesOrchestrator() {
  const [steps, setSteps] = useState<Step[]>(DEMO_STEPS.map(s => ({ ...s, status: 'pending', output: undefined })));
  const [running, setRunning] = useState(false);
  const [explainStep, setExplainStep] = useState<string | null>(null);

  function runOrchestration() {
    setRunning(true);
    setSteps(DEMO_STEPS.map(s => ({ ...s, status: 'pending', output: undefined })));

    DEMO_STEPS.forEach((step, i) => {
      setTimeout(() => {
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'running' } : s));
        setTimeout(() => {
          setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'done', output: step.output } : s));
          if (i === DEMO_STEPS.length - 1) setRunning(false);
        }, 1200);
      }, i * 1800);
    });
  }

  const PROTOCOL_COLORS: Record<string, string> = { A2A: '#4d8fcc', MCP: GOLD, ACP: '#9b7cc8', ANP: '#22c55e' };

  const STATUS_LABEL: Record<string, string> = { pending: '○ pending', running: '● running', done: '✓ done', error: '✗ error' };
  const STATUS_COLOR: Record<string, string> = { pending: 'var(--color-a11oy-text-ghost)', running: GOLD, done: '#22c55e', error: '#f87171' };

  return (
    <Layout>
      <PageHeader
        label="PRIMITIVES / ORCHESTRATOR"
        title="Cross-App Orchestrator"
        subtitle="Routes complex tasks across multiple A11oy agents. Every routing decision includes ExplainPanel attribution — showing which agent handled which step, which protocol was used, and the reasoning for that choice."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="AGENTS CONNECTED" value="6" sub="in mesh" accent={GOLD} />
        <KpiCard label="PROTOCOLS USED" value="4" sub="A2A/MCP/ACP/ANP" accent={GOLD} />
        <KpiCard label="EXPLAIN PANEL" value="Every step" sub="full attribution" accent="#22c55e" />
        <KpiCard label="PROOF CHAIN" value="Auto-linked" sub="cross-agent" accent={GOLD} />
      </div>

      <Card className="mb-6">
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Demo Task</div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>{DEMO_TASK}</p>
        <button type="button" onClick={runOrchestration} disabled={running}
          className="px-4 py-2 rounded text-xs font-mono transition-colors"
          style={{ background: running ? 'rgba(94,94,94,0.12)' : 'rgba(201,183,135,0.12)', color: running ? '#5e5e5e' : GOLD, border: `1px solid ${running ? 'var(--color-a11oy-border)' : 'rgba(201,183,135,0.3)'}`, cursor: running ? 'not-allowed' : 'pointer' }}>
          {running ? '↻ Orchestrating…' : '▶ Run Orchestration'}
        </button>
      </Card>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const protoColor = PROTOCOL_COLORS[step.protocol] ?? GOLD;
          const isExplain = explainStep === step.id;

          return (
            <div key={step.id} className="rounded-lg border transition-all"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: step.status === 'done' ? 'rgba(34,197,94,0.2)' : step.status === 'running' ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)' }}>
              <div className="flex items-start gap-3 p-4">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 mt-0.5"
                  style={{ backgroundColor: `${STATUS_COLOR[step.status]}18`, color: STATUS_COLOR[step.status], border: `1px solid ${STATUS_COLOR[step.status]}30` }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{step.agent}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${protoColor}18`, color: protoColor }}>{step.protocol}</span>
                    <span className="text-xs font-mono ml-auto" style={{ color: STATUS_COLOR[step.status] }}>
                      {step.status === 'running' ? <span className="animate-pulse">{STATUS_LABEL[step.status]}</span> : STATUS_LABEL[step.status]}
                    </span>
                  </div>
                  <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>→ {step.action}</div>
                  {step.output && (
                    <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>{step.output}</p>
                  )}
                </div>
                <button type="button" onClick={() => setExplainStep(isExplain ? null : step.id)}
                  className="text-xs font-mono px-2 py-1 rounded shrink-0 transition-colors"
                  style={{ background: isExplain ? 'rgba(201,183,135,0.12)' : 'transparent', color: GOLD, border: `1px solid ${isExplain ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
                  Explain
                </button>
              </div>
              {isExplain && (
                <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2 mt-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ExplainPanel — Routing Reasoning</div>
                  <p className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)', lineHeight: 1.6 }}>{step.reasoning}</p>
                  {step.input && (
                    <div className="mt-2 p-2 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--color-a11oy-text-ghost)' }}>
                      Input: {step.input}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Cross-App Orchestrator ported from PRAXIS (/nexus/orchestrator). ExplainPanel attribution and ANP notarization are A11oy additions. Protocol routing logic normalized to A11oy governance tiers.
      </div>
    </Layout>
  );
}
