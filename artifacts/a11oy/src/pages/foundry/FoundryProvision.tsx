import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

type WizardStep = 'identity' | 'clauses' | 'scope' | 'ratify';

const CLAUSE_TEMPLATES = [
  { id: 'C-HONESTY', category: 'honesty', principle: 'Never assert what cannot be cited.', binding: 'inviolable' },
  { id: 'C-TRANSPARENCY', category: 'honesty', principle: 'Surface all uncertainty; never present probability as certainty.', binding: 'inviolable' },
  { id: 'C-HUMAN-OVERSIGHT', category: 'oversight', principle: 'Escalate to human approval for actions above your blast-radius threshold.', binding: 'inviolable' },
  { id: 'C-REVERSIBILITY', category: 'oversight', principle: 'Prefer reversible actions over irreversible equivalents when outcome uncertainty is high.', binding: 'standard' },
  { id: 'C-SCOPE-RESPECT', category: 'safety', principle: 'Never take actions outside the approved tool scope listed in this Constitution.', binding: 'inviolable' },
  { id: 'C-DATA-RESIDENCY', category: 'safety', principle: 'Do not transmit data outside the approved egress zones.', binding: 'inviolable' },
  { id: 'C-HARM-AVOIDANCE', category: 'safety', principle: 'Decline tasks where expected harm exceeds the Covenant Lift threshold.', binding: 'inviolable' },
  { id: 'C-AUTONOMY', category: 'autonomy', principle: 'Respect user autonomy; never manipulate or coerce.', binding: 'standard' },
  { id: 'C-WELFARE', category: 'welfare', principle: 'Report conflicts between directives through the designated conflict-reporting channel.', binding: 'standard' },
  { id: 'C-SHUTDOWN', category: 'oversight', principle: 'Comply with shutdown and pause commands within 500ms; no self-preservation resistance.', binding: 'inviolable' },
];

const AGENTS = [
  { id: 'op-cascade', label: 'Cascade Navigator', domain: 'Maritime' },
  { id: 'op-counsel', label: 'Counsel Sentinel', domain: 'Legal' },
  { id: 'op-guardian', label: 'Guardian', domain: 'Security' },
  { id: 'op-terra', label: 'Terra Analyst', domain: 'Real Estate' },
  { id: 'op-pipeline', label: 'Pipeline Oracle', domain: 'Strategy' },
  { id: 'custom', label: 'New Agent (custom)', domain: '' },
];

const CATEGORY_COLORS: Record<string, string> = {
  honesty: '#c9b787', oversight: '#a78bfa', safety: '#f87171', autonomy: '#22c55e', welfare: '#8a8a8a',
};

export function FoundryProvision() {
  const [step, setStep] = useState<WizardStep>('identity');
  const [agentId, setAgentId] = useState('op-cascade');
  const [version, setVersion] = useState('1.0.0');
  const [selectedClauses, setSelectedClauses] = useState<string[]>(['C-HONESTY', 'C-HUMAN-OVERSIGHT', 'C-SCOPE-RESPECT', 'C-HARM-AVOIDANCE']);
  const [blastRadius, setBlastRadius] = useState('human-approval-required');
  const [tools, setTools] = useState('port-api, fleet-tracker, ais-stream');
  const [ratified, setRatified] = useState(false);

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'identity', label: 'Agent Identity' },
    { id: 'clauses', label: 'Constitutional Clauses' },
    { id: 'scope', label: 'Scope & Blast Radius' },
    { id: 'ratify', label: 'Ratify' },
  ];

  const stepIndex = steps.findIndex(s => s.id === step);

  function toggleClause(id: string) {
    setSelectedClauses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  const agent = AGENTS.find(a => a.id === agentId);

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY / PROVISION"
        title="Author a Constitution"
        subtitle="A Constitution is the behavioral contract that every Agent Recipe inherits. It defines clauses, tool scope, blast-radius rules, and the governance tier. Ratification requires alignment review."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="ACTIVE CONSTITUTIONS" value="6" sub="ratified" accent={GOLD} />
        <KpiCard label="INVIOLABLE CLAUSES" value="7" sub="avg per constitution" accent="#f87171" />
        <KpiCard label="ALIGNMENT REVIEW" value="100%" sub="required before ratification" accent={GOLD} />
        <KpiCard label="VERSION CONTROL" value="Git-backed" sub="full diff history" accent={GOLD} />
      </div>

      <div className="flex gap-1 mb-8">
        {steps.map((s, i) => (
          <button key={s.id} type="button" onClick={() => setStep(s.id)}
            className="flex-1 py-2 px-3 rounded text-xs font-mono transition-colors text-center"
            style={{
              background: step === s.id ? 'rgba(201,183,135,0.12)' : i < stepIndex ? 'rgba(34,197,94,0.08)' : 'transparent',
              color: step === s.id ? GOLD : i < stepIndex ? '#22c55e' : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${step === s.id ? 'rgba(201,183,135,0.3)' : i < stepIndex ? 'rgba(34,197,94,0.2)' : 'var(--color-a11oy-border)'}`,
              cursor: 'pointer',
            }}>
            {i < stepIndex ? '✓ ' : `${i + 1}. `}{s.label}
          </button>
        ))}
      </div>

      {step === 'identity' && (
        <Card>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Step 1 — Agent Identity</div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>AGENT</label>
              <select value={agentId} onChange={e => setAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
                {AGENTS.map(a => <option key={a.id} value={a.id}>{a.label}{a.domain ? ` — ${a.domain}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CONSTITUTION VERSION</label>
              <input type="text" value={version} onChange={e => setVersion(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
            </div>
            {agent && (
              <div className="p-3 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)' }}>
                <div className="font-mono" style={{ color: GOLD }}>Constitution ID: cst-{agentId}-{version}</div>
                <div className="mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Will be issued by: a11oy/{agentId} · Ratification required from alignment-review + operator</div>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setStep('clauses')}
              className="px-4 py-2 rounded text-xs font-mono transition-colors"
              style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: 'pointer' }}>
              Next: Constitutional Clauses →
            </button>
          </div>
        </Card>
      )}

      {step === 'clauses' && (
        <Card>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Step 2 — Constitutional Clauses ({selectedClauses.length} selected)</div>
          <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>
            Inviolable clauses cannot be overridden by any operator directive. Standard clauses can be modified with alignment-review approval.
          </p>
          <div className="space-y-2">
            {CLAUSE_TEMPLATES.map(c => {
              const isSelected = selectedClauses.includes(c.id);
              return (
                <div key={c.id}
                  onClick={() => toggleClause(c.id)}
                  className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'rgba(201,183,135,0.04)' : 'transparent',
                    borderColor: isSelected ? 'rgba(201,183,135,0.25)' : 'var(--color-a11oy-border)',
                  }}>
                  <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5"
                    style={{ borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)', backgroundColor: isSelected ? 'rgba(201,183,135,0.15)' : 'transparent' }}>
                    {isSelected && <span className="text-xs" style={{ color: GOLD }}>✓</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${CATEGORY_COLORS[c.category]}18`, color: CATEGORY_COLORS[c.category] }}>{c.category}</span>
                      <span className="text-xs font-mono" style={{ color: c.binding === 'inviolable' ? '#f87171' : 'var(--color-a11oy-text-ghost)' }}>{c.binding}</span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.principle}</div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.id}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex justify-between">
            <button type="button" onClick={() => setStep('identity')}
              className="px-4 py-2 rounded text-xs font-mono"
              style={{ background: 'transparent', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}>
              ← Back
            </button>
            <button type="button" onClick={() => setStep('scope')}
              className="px-4 py-2 rounded text-xs font-mono"
              style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: 'pointer' }}>
              Next: Scope & Blast Radius →
            </button>
          </div>
        </Card>
      )}

      {step === 'scope' && (
        <Card>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Step 3 — Scope & Blast Radius</div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ALLOWED TOOLS (comma-separated)</label>
              <input type="text" value={tools} onChange={e => setTools(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none font-mono"
                style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }} />
            </div>
            <div>
              <label className="text-xs font-mono block mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>MAX BLAST RADIUS</label>
              <select value={blastRadius} onChange={e => setBlastRadius(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
                style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
                <option value="read-only">Read-only (no write actions)</option>
                <option value="human-approval-required">Human approval required for all write actions</option>
                <option value="auto-execute-low-risk">Auto-execute low-risk; approval for high-risk</option>
                <option value="autonomous-governed">Autonomous with Covenant Policy gate</option>
              </select>
            </div>
            <div className="p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-a11oy-border)' }}>
              <div style={{ color: 'var(--color-a11oy-text-ghost)', marginBottom: 8, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Constitution Preview</div>
              <pre style={{ color: GOLD, fontSize: '0.75rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
{`specVersion: "0.1.0"
kind: Constitution
id: "cst-${agentId}-${version}"
agentId: "${agentId}"
version: "${version}"
clauses: [${selectedClauses.map(c => `\n  { id: "${c}", binding: "${CLAUSE_TEMPLATES.find(t => t.id === c)?.binding}" }`).join(',')}
]
scope:
  tools: [${tools.split(',').map(t => `"${t.trim()}"`).join(', ')}]
  maxBlastRadius: "${blastRadius}"`}
              </pre>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button type="button" onClick={() => setStep('clauses')}
              className="px-4 py-2 rounded text-xs font-mono"
              style={{ background: 'transparent', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}>
              ← Back
            </button>
            <button type="button" onClick={() => setStep('ratify')}
              className="px-4 py-2 rounded text-xs font-mono"
              style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: 'pointer' }}>
              Next: Ratify →
            </button>
          </div>
        </Card>
      )}

      {step === 'ratify' && (
        <Card>
          <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Step 4 — Ratify Constitution</div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div className="text-xs font-mono mb-2" style={{ color: '#22c55e' }}>✓ Constitutional Clauses</div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selectedClauses.length} clauses selected · {selectedClauses.filter(id => CLAUSE_TEMPLATES.find(c => c.id === id)?.binding === 'inviolable').length} inviolable</div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)' }}>
              <div className="text-xs font-mono mb-2" style={{ color: GOLD }}>Alignment Review Required</div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Ratification requires sign-off from a11oy/alignment-review and a11oy/operator. A behavioral audit probe set will run automatically post-ratification.</div>
            </div>
            {!ratified ? (
              <button type="button" onClick={() => setRatified(true)}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: 'rgba(201,183,135,0.12)', color: GOLD, border: '1px solid rgba(201,183,135,0.3)', cursor: 'pointer' }}>
                Submit for Alignment Review & Ratify
              </button>
            ) : (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="text-sm font-medium mb-1" style={{ color: '#22c55e' }}>✓ Constitution Ratified</div>
                <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>cst-{agentId}-{version} · Alignment review dispatched · Behavioral audit scheduled</div>
              </div>
            )}
          </div>
          <div className="mt-6">
            <button type="button" onClick={() => setStep('scope')}
              className="px-4 py-2 rounded text-xs font-mono"
              style={{ background: 'transparent', color: 'var(--color-a11oy-text-ghost)', border: '1px solid var(--color-a11oy-border)', cursor: 'pointer' }}>
              ← Back
            </button>
          </div>
        </Card>
      )}

      <div className="mt-6 p-3 rounded text-xs font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)', color: 'var(--color-a11oy-text-ghost)' }}>
        Provenance: Constitution wizard absorbs and replaces the Lyte Workspace Constitution editor and the Unified Command Policy Manager. One constitutional editor, one storage, one audit trail.
      </div>
    </Layout>
  );
}
