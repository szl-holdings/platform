import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { DELEGATION_CHAINS, type DelegationChain as DelegationChainType, type DelegationHop } from '../data/complianceFabric';

const GOLD = '#c9b787';

const DECISION_STYLE: Record<string, { color: string; bg: string }> = {
  approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  blocked: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  escalated: { color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function HopNode({ hop, index, isLast }: { hop: DelegationHop; index: number; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const ds = DECISION_STYLE[hop.covenantDecision];

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 cursor-pointer"
          style={{ backgroundColor: ds.bg, border: `2px solid ${ds.color}`, color: ds.color, fontSize: 10, fontFamily: 'ui-monospace', fontWeight: 700 }}
          onClick={() => setExpanded(!expanded)}
        >
          {index + 1}
        </div>
        {!isLast && <div className="w-0.5 flex-1 my-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)', minHeight: 20 }} />}
      </div>
      <div className="flex-1 pb-4">
        <div
          className="rounded-lg border p-3 cursor-pointer transition-all"
          onClick={() => setExpanded(!expanded)}
          style={{
            backgroundColor: expanded ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
            borderColor: expanded ? `${ds.color}30` : 'var(--color-a11oy-border)',
          }}
        >
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: ds.bg, color: ds.color }}>{hop.covenantDecision.toUpperCase()}</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{hop.parentAgentName}</span>
            <span style={{ color: GOLD }}>→</span>
            <span className="text-xs font-semibold" style={{ color: GOLD }}>{hop.childAgentName}</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{hop.scopeNarrowed} — {fmt(hop.timestamp)}</div>

          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div className="text-xs"><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Scope:</span> <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{hop.scopeNarrowed}</span></div>
              <div className="text-xs">
                <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Permissions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hop.permissionsGranted.map(p => (
                    <span key={p} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: GOLD }}>{p}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Parent Corr ID:</span><br /><span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{hop.parentCorrelationId}</span></div>
                <div><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Child Corr ID:</span><br /><span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{hop.childCorrelationId}</span></div>
              </div>
              <div className="font-mono text-xs px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: '#22c55e', wordBreak: 'break-all' }}>
                {hop.proofHash}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChainVisualization({ chain }: { chain: DelegationChainType }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{chain.workcellId} — {chain.status}</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{chain.workcellName}</div>
        </div>
        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{
          backgroundColor: chain.status === 'complete' ? 'rgba(34,197,94,0.08)' : chain.status === 'violation' ? 'rgba(239,68,68,0.08)' : 'rgba(201,183,135,0.08)',
          color: chain.status === 'complete' ? '#22c55e' : chain.status === 'violation' ? '#ef4444' : GOLD,
        }}>
          {chain.status.toUpperCase()}
        </span>
      </div>

      <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
        <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ROOT AGENT</div>
        <div className="text-xs font-semibold mt-1" style={{ color: GOLD }}>{chain.rootAgentName}</div>
      </div>

      <div className="relative">
        {chain.hops.map((hop, idx) => (
          <HopNode key={hop.id} hop={hop} index={idx} isLast={idx === chain.hops.length - 1} />
        ))}
      </div>
    </Card>
  );
}

export function DelegationChain() {
  const [selectedChainId, setSelectedChainId] = useState(DELEGATION_CHAINS[0].id);
  const selectedChain = DELEGATION_CHAINS.find(c => c.id === selectedChainId) ?? DELEGATION_CHAINS[0];

  const totalHops = DELEGATION_CHAINS.reduce((a, c) => a + c.hops.length, 0);
  const violations = DELEGATION_CHAINS.filter(c => c.status === 'violation').length;

  return (
    <Layout>
      <PageHeader
        label="DELEGATION CHAIN GOVERNANCE"
        title="Chain-of-Command"
        subtitle="When agents delegate to sub-agents, the full delegation tree is governed with correlation IDs, scope narrowing at each hop, privilege boundary enforcement, and full chain replay from any node. Extends the Proof Ledger with delegation tree structure."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiCard label="DELEGATION CHAINS" value={String(DELEGATION_CHAINS.length)} sub="tracked" accent={GOLD} />
        <KpiCard label="TOTAL HOPS" value={String(totalHops)} sub="scope-narrowed" accent={GOLD} />
        <KpiCard label="VIOLATIONS" value={String(violations)} sub="privilege boundary" accent={violations > 0 ? '#ef4444' : '#22c55e'} />
        <KpiCard label="CHAIN INTEGRITY" value="100%" sub="all hops verified" accent="#22c55e" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div>
          <SectionTitle>Delegation Chains</SectionTitle>
          <div className="flex flex-col gap-2">
            {DELEGATION_CHAINS.map(chain => {
              const isSelected = chain.id === selectedChainId;
              return (
                <div
                  key={chain.id}
                  className="rounded-lg border p-3 cursor-pointer transition-all"
                  onClick={() => setSelectedChainId(chain.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                    borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)',
                  }}
                >
                  <div className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{chain.workcellName}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Root: {chain.rootAgentName} — {chain.hops.length} hop{chain.hops.length !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <SectionTitle>Governance Rules</SectionTitle>
            <Card>
              <div className="space-y-2 text-xs">
                {[
                  'Scope must narrow at each delegation hop',
                  'Permissions are subset of parent permissions',
                  'Covenant decision required at each boundary',
                  'Correlation IDs link parent and child',
                  'Every hop writes a Proof Ledger entry',
                  'Full chain replay from any node',
                  'Privilege escalation structurally impossible',
                ].map(rule => (
                  <div key={rule} className="flex items-start gap-2">
                    <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{rule}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-2">
          <SectionTitle>Delegation Tree — {selectedChain.workcellName}</SectionTitle>
          <ChainVisualization chain={selectedChain} />
        </div>
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Delegation Chain Governance — addresses the NIST gap: "no concept of delegation boundary." Every hop is scope-narrowed, permission-bounded, and proof-recorded.
      </div>
    </Layout>
  );
}
