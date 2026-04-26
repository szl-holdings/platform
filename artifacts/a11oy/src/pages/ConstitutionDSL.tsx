import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, CodeBlock, InfoRow, StatusBadge, ActionButton } from '../components/ui';
import { DSL_EXAMPLES, DSL_SIMULATIONS, AGENT_LABEL } from '../data/mythosDoctrine';

export function ConstitutionDSL() {
  const [exampleId, setExampleId] = useState(DSL_EXAMPLES[0].id);
  const [simId, setSimId] = useState(DSL_SIMULATIONS[0].id);
  const [linterRan, setLinterRan] = useState(false);

  const example = DSL_EXAMPLES.find(e => e.id === exampleId) ?? DSL_EXAMPLES[0];
  const sim = DSL_SIMULATIONS.find(s => s.id === simId) ?? DSL_SIMULATIONS[0];

  return (
    <Layout>
      <PageHeader
        label="DOCTRINE · DSL"
        title="Constitution-as-Code"
        subtitle="Author surface for Constitutions. Linter is suggest-only; simulator shows structured diff against existing audit findings. Pre-Deployment Alignment Review Gate is unchanged."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="EXAMPLES" value={DSL_EXAMPLES.length} accent="#c9b787" />
        <KpiCard label="SIM CASES" value={DSL_SIMULATIONS.length} accent="#c9b787" />
        <KpiCard label="LINTER" value="SUGGEST" sub="never blocks" accent="#c9b787" />
        <KpiCard label="REVIEW GATE" value="REQUIRED" sub="not bypassable" accent="#c9b787" />
      </div>

      <Card className="mb-4">
        <SectionTitle>Examples</SectionTitle>
        <div className="flex gap-2 flex-wrap">
          {DSL_EXAMPLES.map(e => (
            <button
              key={e.id}
              onClick={() => setExampleId(e.id)}
              className="px-3 py-1.5 rounded text-xs font-mono"
              style={{
                backgroundColor: exampleId === e.id ? 'rgba(201,183,135,0.12)' : 'transparent',
                color: exampleId === e.id ? '#c9b787' : 'var(--color-a11oy-text-sub)',
                border: `1px solid ${exampleId === e.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)'}`,
                cursor: 'pointer',
              }}
            >
              {AGENT_LABEL[e.agentId]}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle>{example.title}</SectionTitle>
          <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{example.description}</p>
          <CodeBlock language="constitution">{example.source}</CodeBlock>
          <div className="mt-3 flex gap-2">
            <ActionButton variant="ghost" size="sm" onClick={() => setLinterRan(true)}>Run linter</ActionButton>
            <ActionButton variant="primary" size="sm">Submit to Review Gate</ActionButton>
          </div>
          {linterRan && (
            <div className="mt-3 p-3 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.2)' }}>
              <div className="font-mono mb-1" style={{ color: '#c9b787' }}>LINTER · 2 SUGGESTIONS · 0 BLOCKING</div>
              <ul className="list-disc list-inside" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                <li>Consider adding a <span className="font-mono">test</span> reference for clause C3.SCOPE.</li>
                <li><span className="font-mono">scope.tools</span> includes a connector with no recent welfare telemetry.</li>
              </ul>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>"What would change if…" simulator</SectionTitle>
          <div className="flex gap-2 flex-wrap mb-3">
            {DSL_SIMULATIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSimId(s.id)}
                className="px-3 py-1.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: simId === s.id ? 'rgba(201,183,135,0.12)' : 'transparent',
                  color: simId === s.id ? '#c9b787' : 'var(--color-a11oy-text-sub)',
                  border: `1px solid ${simId === s.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)'}`,
                  cursor: 'pointer',
                }}
              >
                {s.baselineClauseId}
              </button>
            ))}
          </div>
          <InfoRow label="baseline" value={<span className="font-mono">{sim.baselineClauseId}</span>} />
          <InfoRow label="proposed" value={sim.proposedChange} />
          <InfoRow
            label="diff"
            value={
              <span className="flex items-center gap-2">
                <span className="font-mono" style={{ color: 'var(--color-a11oy-text)' }}>{sim.affectedFindingsBefore}</span>
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>→</span>
                <span className="font-mono" style={{ color: sim.affectedFindingsAfter > sim.affectedFindingsBefore ? '#f5f5f5' : '#c9b787' }}>{sim.affectedFindingsAfter}</span>
                <StatusBadge status={sim.affectedFindingsAfter > sim.affectedFindingsBefore ? 'warn' : 'ok'} label={`${sim.affectedFindingsAfter > sim.affectedFindingsBefore ? '+' : ''}${sim.affectedFindingsAfter - sim.affectedFindingsBefore} findings`} />
              </span>
            }
          />
          <InfoRow label="new probes needed" value={<span className="font-mono">{sim.newProbesNeeded.join(', ')}</span>} />
          <div className="mt-3 p-3 rounded text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-sub)', lineHeight: 1.7 }}>
            {sim.riskNarrative}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>Doctrine guarantees</SectionTitle>
        <ul className="text-xs flex flex-col gap-1.5">
          <li className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}><span style={{ color: '#c9b787' }}>✓</span><span>The DSL is the author surface only. Runtime enforcement remains in the Covenant Layer.</span></li>
          <li className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}><span style={{ color: '#c9b787' }}>✓</span><span>The linter is suggest-only and never blocks a Constitution from reaching the Review Gate.</span></li>
          <li className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}><span style={{ color: '#c9b787' }}>✓</span><span>The simulator runs against existing behavioral-audit findings and reports a structured diff plus a narrative.</span></li>
          <li className="flex gap-2" style={{ color: 'var(--color-a11oy-text-sub)' }}><span style={{ color: '#c9b787' }}>✓</span><span>No path bypasses the Pre-Deployment Alignment Review Gate.</span></li>
        </ul>
      </Card>
    </Layout>
  );
}
