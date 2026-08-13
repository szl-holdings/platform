import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, HashId, VerdictBadge } from '../components/ui';
import { SEED_PCE_CONTRACTS, SEED_WORKCELLS, SEED_PROOF_PACKETS } from '@workspace/a11oy-fabric';

const MODE_COLORS: Record<string, string> = {
  governed: '#c9b787',
  autonomous: '#c9b787',
  supervised: '#c9b787',
  demo: '#a3a3a3',
};

export function Pce() {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedContract = selected ? SEED_PCE_CONTRACTS.find((c) => c.id === selected) : null;
  const linkedWC = selected ? SEED_WORKCELLS.find((w) => w.pceContractId === selected) : null;
  const linkedProof = selectedContract
    ? SEED_PROOF_PACKETS.find((p) => p.id === selectedContract.proofPacketId)
    : null;

  const verified = SEED_PCE_CONTRACTS.filter((c) => c.isVerified).length;
  const modes = Array.from(new Set(SEED_PCE_CONTRACTS.map((c) => c.mode)));

  return (
    <Layout>
      <PageHeader
        label="PROOF-CARRYING EXECUTION"
        title="Seeded PCE Contract Registry"
        subtitle="Repository fixtures demonstrate fields that can bind a Workcell to signals, policy evaluation, approval, trace, and receipt references."
        status="DEMO"
      />

      <div
        className="mb-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm leading-6"
        style={{ color: 'var(--color-a11oy-text-sub)' }}
        role="note"
      >
        <strong style={{ color: 'var(--color-a11oy-text)' }}>Evidence boundary:</strong> all
        contracts and linked records below are seed fixtures. A fixture flag such as
        <code> isVerified=true </code>is not a production attestation.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="SEED CONTRACTS"
          value={SEED_PCE_CONTRACTS.length}
          sub="repository fixtures"
          accent="#b08d52"
        />
        <KpiCard
          label="FIXTURE VERIFIED"
          value={verified}
          sub="seed field count"
          accent="#c9b787"
        />
        <KpiCard
          label="FIXTURE RATE"
          value={`${Math.round((verified / SEED_PCE_CONTRACTS.length) * 100)}%`}
          sub="not production SLO"
          accent="#c9b787"
        />
        <KpiCard label="DEMO MODES" value={modes.length} sub="seeded modes" accent="#8a8a8a" />
      </div>

      {/* Concept callout */}
      <div
        className="mb-6 p-4 rounded-lg border"
        style={{ backgroundColor: 'rgba(176,141,82,0.06)', borderColor: 'rgba(176,141,82,0.25)' }}
      >
        <div className="text-sm font-semibold mb-1" style={{ color: '#b08d52' }}>
          What is a PCE Contract?
        </div>
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
          A Proof-Carrying Execution (PCE) contract is designed to bind a Workcell to its causal
          chain. This seeded model includes the originating signal, causal-chain, policy-evaluation,
          approval, execution-trace, and proof-packet reference fields. The page does not establish
          an operational registry.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contract list */}
        <div className="lg:col-span-2">
          <SectionTitle>PCE Contracts ({SEED_PCE_CONTRACTS.length})</SectionTitle>
          <div className="flex flex-col gap-2">
            {SEED_PCE_CONTRACTS.map((c) => {
              const modeColor = MODE_COLORS[c.mode] ?? '#5e5e5e';
              const isSelected = c.id === selected;
              const wc = SEED_WORKCELLS.find((w) => w.pceContractId === c.id);

              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={c.id}
                  className="w-full min-h-11 rounded-lg border cursor-pointer text-left transition-all p-3"
                  onClick={() => setSelected(isSelected ? null : c.id)}
                  aria-pressed={isSelected}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelected(isSelected ? null : c.id);
                    }
                  }}
                  style={{
                    backgroundColor: isSelected
                      ? 'rgba(201,183,135,0.04)'
                      : 'var(--color-a11oy-card)',
                    borderColor: isSelected ? '#c9b787' : 'var(--color-a11oy-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <HashId id={c.id} />
                        <span
                          className="font-mono text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${modeColor}18`, color: modeColor }}
                        >
                          {c.mode}
                        </span>
                        {c.isVerified && (
                          <span className="text-xs font-mono" style={{ color: '#c9b787' }}>
                            ✓ verified
                          </span>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                        <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                          Origin:{' '}
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>
                            {c.originSignalId}
                          </span>
                        </div>
                        <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                          Action:{' '}
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.actionId}</span>
                        </div>
                        {wc && (
                          <div
                            className="sm:col-span-2"
                            style={{ color: 'var(--color-a11oy-text-ghost)' }}
                          >
                            Workcell:{' '}
                            <span style={{ color: 'var(--color-a11oy-blue)' }}>{wc.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {wc && <VerdictBadge verdict={wc.mirrorEvalResult.verdict} />}
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      className="mt-3 pt-3 border-t"
                      style={{ borderColor: 'var(--color-a11oy-border)' }}
                    >
                      <div className="grid sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div
                            className="font-mono mb-1"
                            style={{ color: 'var(--color-a11oy-text-ghost)' }}
                          >
                            CAUSAL CHAIN
                          </div>
                          {c.causalChainIds.map((id) => (
                            <div
                              key={id}
                              className="font-mono"
                              style={{ color: 'var(--color-a11oy-text-ghost)' }}
                            >
                              → {id}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div
                            className="font-mono mb-1"
                            style={{ color: 'var(--color-a11oy-text-ghost)' }}
                          >
                            RECORD REFS
                          </div>
                          <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                            Policy: {c.policyEvaluationId}
                          </div>
                          {c.approvalRecordId && (
                            <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                              Approval: {c.approvalRecordId}
                            </div>
                          )}
                          <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                            Trace: {c.executionTraceId}
                          </div>
                          <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                            Proof: {c.proofPacketId}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-6">
          {/* Contract Detail */}
          {selectedContract ? (
            <div>
              <SectionTitle>Contract Detail</SectionTitle>
              <Card className="text-xs">
                <HashId id={selectedContract.id} />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      MODE
                    </div>
                    <div style={{ color: MODE_COLORS[selectedContract.mode] ?? '#5e5e5e' }}>
                      {selectedContract.mode}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      VERIFIED
                    </div>
                    <div style={{ color: selectedContract.isVerified ? '#c9b787' : '#f5f5f5' }}>
                      {selectedContract.isVerified ? '✓ YES' : '✗ NO'}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      ORIGIN SIGNAL
                    </div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>
                      {selectedContract.originSignalId}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div
                      className="font-mono mb-1"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      CAUSAL CHAIN ({selectedContract.causalChainIds.length})
                    </div>
                    {selectedContract.causalChainIds.map((id) => (
                      <div
                        key={id}
                        className="font-mono"
                        style={{ color: 'var(--color-a11oy-text-ghost)' }}
                      >
                        → {id}
                      </div>
                    ))}
                  </div>
                </div>
                {linkedWC && (
                  <div
                    className="mt-3 pt-3 border-t"
                    style={{ borderColor: 'var(--color-a11oy-border)' }}
                  >
                    <div
                      className="font-mono mb-1"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      LINKED WORKCELL
                    </div>
                    <div className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>
                      {linkedWC.name}
                    </div>
                    <VerdictBadge verdict={linkedWC.mirrorEvalResult.verdict} />
                  </div>
                )}
                {linkedProof && (
                  <div
                    className="mt-3 pt-3 border-t"
                    style={{ borderColor: 'var(--color-a11oy-border)' }}
                  >
                    <div
                      className="font-mono mb-1"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      PROOF PACKET HASH
                    </div>
                    <div className="font-mono break-all" style={{ color: '#b08d52' }}>
                      {linkedProof.hash.slice(0, 40)}…
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : null}

          {/* Mode Breakdown */}
          <div>
            <SectionTitle>Execution Mode Breakdown</SectionTitle>
            <div className="flex flex-col gap-2">
              {modes.map((mode) => {
                const count = SEED_PCE_CONTRACTS.filter((c) => c.mode === mode).length;
                const color = MODE_COLORS[mode] ?? '#5e5e5e';
                return (
                  <Card key={mode} className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono" style={{ color }}>
                        {mode}
                      </span>
                      <span className="font-mono" style={{ color }}>
                        {count} contracts
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Verification Stats */}
          <div>
            <SectionTitle>Verification Stats</SectionTitle>
            <Card className="text-xs">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Total contracts</span>
                  <span className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    {SEED_PCE_CONTRACTS.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Verified</span>
                  <span className="font-mono" style={{ color: '#c9b787' }}>
                    {verified}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    With approval record
                  </span>
                  <span className="font-mono" style={{ color: '#8a8a8a' }}>
                    {SEED_PCE_CONTRACTS.filter((c) => c.approvalRecordId).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Proof packets linked
                  </span>
                  <span className="font-mono" style={{ color: '#b08d52' }}>
                    {SEED_PCE_CONTRACTS.filter((c) => c.proofPacketId).length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Constitutional Principle */}
          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: 'rgba(176,141,82,0.08)',
              border: '1px solid rgba(176,141,82,0.25)',
            }}
          >
            <div className="text-xs font-semibold mb-1" style={{ color: '#b08d52' }}>
              Modeled constitutional principle
            </div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
              The prototype design intends to block material actions that lack a valid PCE contract.
              This fixture demonstrates that contract shape; it does not prove production
              enforcement.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
