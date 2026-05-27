// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { TRUST_ATTESTATIONS, type TrustAttestation } from '../data/complianceFabric';

const GOLD = '#c9b787';

const BRACKET_COLORS: Record<string, string> = {
  exceptional: '#22c55e',
  strong: '#c9b787',
  moderate: '#f97316',
  developing: '#ef4444',
};

const ISO_COLORS: Record<string, string> = {
  certified: '#22c55e',
  aligned: '#c9b787',
  partial: '#f97316',
  'not-started': '#ef4444',
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  active: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  expired: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  'pending-verification': { color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
};

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AttestationCard({ attestation }: { attestation: TrustAttestation }) {
  const [expanded, setExpanded] = useState(false);
  const ss = STATUS_STYLE[attestation.status];

  return (
    <div
      className="rounded-lg border p-4 cursor-pointer transition-all"
      onClick={() => setExpanded(!expanded)}
      style={{
        backgroundColor: expanded ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
        borderColor: expanded ? GOLD : 'var(--color-a11oy-border)',
        borderLeft: `3px solid ${attestation.direction === 'outbound' ? GOLD : '#4a9eff'}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{
              backgroundColor: attestation.direction === 'outbound' ? 'rgba(201,183,135,0.08)' : 'rgba(74,158,255,0.08)',
              color: attestation.direction === 'outbound' ? GOLD : '#4a9eff',
            }}>
              {attestation.direction === 'outbound' ? 'OUTBOUND' : 'INBOUND'}
            </span>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: ss.bg, color: ss.color }}>
              {attestation.status.toUpperCase().replace('-', ' ')}
            </span>
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{attestation.partnerName}</div>
          <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{attestation.partnerOrgId}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div>
          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Robustness:</span>
          <span className="ml-1 font-bold" style={{ color: BRACKET_COLORS[attestation.adversarialRobustnessBracket] }}>{attestation.adversarialRobustnessBracket}</span>
        </div>
        <div>
          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Constitution:</span>
          <span className="ml-1 font-bold" style={{ color: BRACKET_COLORS[attestation.constitutionAdherenceBracket] }}>{attestation.constitutionAdherenceBracket}</span>
        </div>
        <div>
          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ISO 42001:</span>
          <span className="ml-1 font-bold" style={{ color: ISO_COLORS[attestation.iso42001Alignment] }}>{attestation.iso42001Alignment}</span>
        </div>
        <div>
          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Last CAVD:</span>
          <span className="ml-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(attestation.lastCavdDisclosure)}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-a11oy-border)' }}>
          <div className="text-xs">
            <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Agent-BOM Hash:</span>
            <span className="ml-1 font-mono" style={{ color: '#22c55e' }}>{attestation.agentBomHash}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Attested:</span> <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(attestation.attestedAt)}</span></div>
            <div><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Expires:</span> <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(attestation.expiresAt)}</span></div>
          </div>
          <div className="p-2 rounded text-xs" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)' }}>
            <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>A2A AGENT CARD EXTENSIONS</div>
            <div style={{ color: 'var(--color-a11oy-text-sub)' }}>
              Attestation carries compliance posture brackets (not raw scores) to protect proprietary details.
              Compatible with A2A v1.0 Agent Card format.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TrustExchange() {
  const [filter, setFilter] = useState<'all' | 'outbound' | 'inbound'>('all');

  const outbound = TRUST_ATTESTATIONS.filter(a => a.direction === 'outbound');
  const inbound = TRUST_ATTESTATIONS.filter(a => a.direction === 'inbound');
  const active = TRUST_ATTESTATIONS.filter(a => a.status === 'active');
  const filtered = filter === 'all' ? TRUST_ATTESTATIONS : TRUST_ATTESTATIONS.filter(a => a.direction === filter);

  return (
    <Layout>
      <PageHeader
        label="FEDERATED TRUST EXCHANGE"
        title="Trust Mesh"
        subtitle="When A11oy agents interact with partner agents across organizational boundaries, verifiable attestations of compliance posture are exchanged without exposing proprietary internals. Built on A2A v1.0 protocol patterns."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiCard label="ATTESTATIONS" value={String(TRUST_ATTESTATIONS.length)} sub="total" accent={GOLD} />
        <KpiCard label="OUTBOUND" value={String(outbound.length)} sub="advertised" accent={GOLD} />
        <KpiCard label="INBOUND" value={String(inbound.length)} sub="received" accent="#4a9eff" />
        <KpiCard label="ACTIVE" value={String(active.length)} sub="verified" accent="#22c55e" />
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'outbound', 'inbound'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded font-mono"
            style={{
              backgroundColor: filter === f ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
              color: filter === f ? GOLD : 'var(--color-a11oy-text-ghost)',
              border: filter === f ? '1px solid rgba(201,183,135,0.3)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div>
          <SectionTitle>Attestation Registry ({filtered.length})</SectionTitle>
          <div className="flex flex-col gap-3">
            {filtered.map(a => <AttestationCard key={a.id} attestation={a} />)}
          </div>
        </div>

        <div>
          <SectionTitle>Attestation Protocol</SectionTitle>
          <Card>
            <div className="space-y-3 text-xs">
              <div>
                <div className="font-mono font-bold mb-1" style={{ color: GOLD }}>POSTURE BRACKETS</div>
                <p style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  Attestations carry compliance posture as brackets (exceptional / strong / moderate / developing)
                  rather than raw scores. This prevents proprietary governance details from being exposed while
                  enabling trust verification.
                </p>
              </div>
              <div>
                <div className="font-mono font-bold mb-1" style={{ color: GOLD }}>ATTESTATION PAYLOAD</div>
                <div className="space-y-1">
                  {[
                    'Adversarial robustness bracket',
                    'Constitution adherence bracket',
                    'ISO 42001 alignment status',
                    'Last CAVD disclosure date',
                    'Agent-BOM hash (for supply chain verification)',
                  ].map(item => (
                    <div key={item} className="flex items-start gap-2">
                      <span style={{ color: GOLD, flexShrink: 0 }}>→</span>
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-mono font-bold mb-1" style={{ color: GOLD }}>A2A COMPATIBILITY</div>
                <p style={{ color: 'var(--color-a11oy-text-sub)' }}>
                  Attestation format extends A2A v1.0 Agent Card with compliance fields.
                  Partner agents verify attestations without accessing internal governance data.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-4">
            <SectionTitle>Bracket Legend</SectionTitle>
            <Card>
              <div className="space-y-2">
                {Object.entries(BRACKET_COLORS).map(([bracket, color]) => (
                  <div key={bracket} className="flex items-center gap-3 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono font-bold" style={{ color }}>{bracket}</span>
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {bracket === 'exceptional' && '— Top-tier governance posture'}
                      {bracket === 'strong' && '— Robust governance with minor gaps'}
                      {bracket === 'moderate' && '— Governance in progress'}
                      {bracket === 'developing' && '— Early-stage governance'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Federated Trust Exchange — extends the Pillpintu Partner Lifecycle Console with machine-readable trust exchange. Proprietary details stay private; compliance posture is verifiable.
      </div>
    </Layout>
  );
}
