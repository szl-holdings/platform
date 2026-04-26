import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card, SectionTitle } from '../components/ui';

const LAYERS = [
  {
    id: 1, name: 'Signal Mesh', role: 'Ingestion & Normalization', color: '#8a8a8a',
    description: 'Ingests, normalizes, deduplicates, and routes business signals from all connected sources. Every signal is classified and attributed before entering the decision loop.',
    inputs: ['Webhooks', 'APIs', 'IoT Streams', 'File uploads'],
    outputs: ['Classified Signal'],
    latency: '12ms', throughput: '2,400 events/hr', health: 99,
  },
  {
    id: 2, name: 'Causal Core', role: 'Evidence Graph Builder', color: '#c9b787',
    description: 'Traces signal causality, builds evidence graphs, and surfaces correlated events. Powers the "why" behind every recommendation.',
    inputs: ['Classified Signal', 'Historical Context'],
    outputs: ['Evidence Graph'],
    latency: '28ms', throughput: '840 graphs/hr', health: 98,
  },
  {
    id: 3, name: 'Context Engine', role: 'Context Assembly', color: '#8a8a8a',
    description: 'Assembles context packs for workcells — enriches signals with historical data, domain schemas, and operator instructions.',
    inputs: ['Evidence Graph', 'Domain Schema', 'Operator Instructions'],
    outputs: ['Context Pack'],
    latency: '45ms', throughput: '420 packs/hr', health: 97,
  },
  {
    id: 4, name: 'Workcell Engine', role: 'Governed Execution Runtime', color: '#8a8a8a',
    description: 'Provisions, executes, and monitors governed workcells. Binds agents, tools, policies, and proof trails. Every workcell is checkpoint-recoverable.',
    inputs: ['Context Pack', 'Agent Spec', 'Tool Registry'],
    outputs: ['Action Proposal'],
    latency: '820ms avg', throughput: '48 cells/hr', health: 96,
  },
  {
    id: 5, name: 'Covenant Layer', role: 'Policy Gate (Non-Bypassable)', color: '#b08d52',
    description: 'The non-bypassable policy gate. Every action passes through the Covenant Layer before execution. Enforces who can approve, when, and under what conditions.',
    inputs: ['Action Proposal', 'Policy Rules'],
    outputs: ['Gate Decision', 'Approval Request'],
    latency: '8ms', throughput: 'all actions', health: 100,
  },
  {
    id: 6, name: 'MirrorEval', role: 'Counterfactual Evaluator', color: '#c9b787',
    description: 'Evaluates recommendations against counterfactuals, computes confidence delta, and generates 14-dimension reasoning chains. Guards against hallucination.',
    inputs: ['Gate Decision', 'Evidence Graph', 'Counterfactual Spec'],
    outputs: ['Eval Score', 'Confidence Delta', 'Reasoning Chain'],
    latency: '1.2s avg', throughput: '240 evals/hr', health: 95,
  },
  {
    id: 7, name: 'Proof Ledger', role: 'Immutable Audit Chain', color: '#c9b787',
    description: 'Appends immutable proof entries for every governed execution. SHA-256 hash chain — no tampering, no silent deletions. Queryable by actor or decision.',
    inputs: ['Execution Result', 'Approval Record'],
    outputs: ['Proof Packet (SHA-256)'],
    latency: '4ms', throughput: 'all executions', health: 100,
  },
];

const DECISION_LOOP = ['Signal', 'Context', 'Recommendation', 'Simulation', 'Policy', 'Execution', 'Proof', 'Outcome', 'Learning'];

const PRINCIPALS = [
  { name: 'MCP Gateway', desc: 'Tool and egress containment for all agents. Zero-trust containment rules enforce which MCP servers and tools each agent class can access.', icon: '⬡' },
  { name: 'Proof-Carrying Execution (PCE)', desc: 'Contract binding every workcell to its originating signal, approval record, policy clause, and execution output hash.', icon: '◆' },
  { name: 'Outcome Graph', desc: 'Closes the decision loop — records the real-world consequence of each governed action and feeds it back to calibrate future confidence.', icon: '◉' },
];

export function ArchitectureOverview() {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const layer = selectedLayer !== null ? LAYERS.find(l => l.id === selectedLayer) : null;

  return (
    <Layout>
      <PageHeader
        label="ARCHITECTURE"
        title="Seven-Layer Execution Fabric"
        subtitle="A11oy's governed execution fabric — from raw signal ingestion to immutable proof. Every layer is monitored, every action is traceable, every decision carries proof."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="FABRIC LAYERS" value={7} sub="all operational" accent="#c9b787" />
        <KpiCard label="DECISION LOOP" value={9} sub="canonical stages" accent="#c9b787" />
        <KpiCard label="PROOF INTEGRITY" value="100%" sub="chain intact" accent="#b08d52" />
        <KpiCard label="POLICY GATES" value="100%" sub="non-bypassable" accent="#c9b787" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <SectionTitle>Fabric Layers</SectionTitle>
          <div className="flex flex-col gap-2">
            {LAYERS.map(l => (
              <div
                key={l.id}
                className="rounded-lg border p-4 cursor-pointer transition-all"
                onClick={() => setSelectedLayer(selectedLayer === l.id ? null : l.id)}
                style={{
                  backgroundColor: selectedLayer === l.id ? `${l.color}08` : 'var(--color-a11oy-card)',
                  borderColor: selectedLayer === l.id ? l.color : 'var(--color-a11oy-border)',
                  borderLeft: `3px solid ${l.color}`,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                      style={{ background: `${l.color}18`, color: l.color }}
                    >{l.id}</div>
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--color-a11oy-text)' }}>
                        {l.name}
                        <span className="text-xs font-normal font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{l.role}</span>
                      </div>
                      {selectedLayer !== l.id && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{l.description.slice(0, 80)}…</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 text-xs font-mono" style={{ color: l.color }}>{l.health}%</div>
                </div>
                {selectedLayer === l.id && (
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{l.description}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="font-mono uppercase text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Inputs</div>
                        {l.inputs.map(inp => (
                          <div key={inp} className="flex items-center gap-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                            <span style={{ color: l.color }}>→</span> {inp}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="font-mono uppercase text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Outputs</div>
                        {l.outputs.map(out => (
                          <div key={out} className="flex items-center gap-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                            <span style={{ color: l.color }}>←</span> {out}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs font-mono">
                      <div>
                        <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Latency: </span>
                        <span style={{ color: l.color }}>{l.latency}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Throughput: </span>
                        <span style={{ color: l.color }}>{l.throughput}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <SectionTitle>Nine-Stage Decision Loop</SectionTitle>
            <div className="rounded-lg border p-4 flex flex-col gap-2" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              {DECISION_LOOP.map((stage, i) => (
                <div key={stage} className="flex items-center gap-3 text-xs">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold"
                    style={{ background: 'rgba(201,183,135,0.12)', color: '#c9b787' }}
                  >{i + 1}</div>
                  <span style={{ color: i === 0 || i === 8 ? '#c9b787' : 'var(--color-a11oy-text-sub)' }}>{stage}</span>
                  {i < DECISION_LOOP.length - 1 && (
                    <div className="ml-auto w-0.5 h-3 ml-2" style={{ background: 'rgba(255,255,255,0.06)', marginLeft: '0.5rem' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Core Principals</SectionTitle>
            <div className="flex flex-col gap-3">
              {PRINCIPALS.map(p => (
                <Card key={p.name} className="text-xs">
                  <div className="flex items-start gap-2 mb-2">
                    <span style={{ color: '#c9b787' }}>{p.icon}</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{p.name}</span>
                  </div>
                  <p style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
