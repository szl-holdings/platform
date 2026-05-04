import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar } from '../components/ui';
import { useApiData } from '../hooks/useApiData';

const GOLD = '#c9b787';

interface AgentIdentity {
  id: string;
  name: string;
  spiffeUri: string;
  certFingerprint: string;
  certIssued: string;
  certExpires: string;
  trustScore: number;
  trustTier: string;
  behaviorBaseline: number;
  currentBehavior: number;
  driftPct: number;
  driftStatus: 'stable' | 'watch' | 'drift';
  capabilities: string[];
  permissions: { action: string; scope: string; granted: boolean }[];
  vertical: string;
  riskClassification: string;
  lastActivity: string;
}

const TRUST_TIERS: Record<string, { color: string; label: string; range: string }> = {
  sovereign: { color: '#22c55e', label: 'SOVEREIGN', range: '900-1000' },
  trusted: { color: GOLD, label: 'TRUSTED', range: '700-899' },
  provisional: { color: '#f97316', label: 'PROVISIONAL', range: '500-699' },
  restricted: { color: '#ef4444', label: 'RESTRICTED', range: '200-499' },
  untrusted: { color: '#7f1d1d', label: 'UNTRUSTED', range: '0-199' },
};

const DEMO_AGENTS: AgentIdentity[] = [
  {
    id: 'aid-cascade', name: 'Cascade Navigator', spiffeUri: 'spiffe://a11oy.szl/agents/cascade-navigator', certFingerprint: 'SHA256:9f:3a:b2:c1:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6', certIssued: '2026-03-01T00:00:00Z', certExpires: '2027-03-01T00:00:00Z', trustScore: 970, trustTier: 'sovereign', behaviorBaseline: 94.2, currentBehavior: 96.8, driftPct: 0.4, driftStatus: 'stable',
    capabilities: ['eta-monitoring', 'port-cost-analysis', 'route-optimization', 'demurrage-calc'],
    permissions: [
      { action: 'read:vessel-data', scope: 'all-vessels', granted: true },
      { action: 'write:voyage-plan', scope: 'assigned-vessels', granted: true },
      { action: 'execute:port-standby', scope: 'with-approval', granted: true },
      { action: 'read:financial-data', scope: 'maritime-only', granted: true },
      { action: 'execute:trade', scope: 'any', granted: false },
    ],
    vertical: 'vessels-maritime', riskClassification: 'High', lastActivity: '2026-04-25T10:34:00Z',
  },
  {
    id: 'aid-counsel', name: 'Counsel Sentinel', spiffeUri: 'spiffe://a11oy.szl/agents/counsel-sentinel', certFingerprint: 'SHA256:a1:b2:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7', certIssued: '2026-02-15T00:00:00Z', certExpires: '2027-02-15T00:00:00Z', trustScore: 990, trustTier: 'sovereign', behaviorBaseline: 97.4, currentBehavior: 98.1, driftPct: 0.2, driftStatus: 'stable',
    capabilities: ['deadline-tracking', 'doc-review', 'matter-monitoring', 'risk-scoring'],
    permissions: [
      { action: 'read:matter-records', scope: 'all-matters', granted: true },
      { action: 'write:matter-status', scope: 'assigned-matters', granted: true },
      { action: 'execute:escalation', scope: 'with-approval', granted: true },
      { action: 'read:privileged-docs', scope: 'with-privilege-gate', granted: true },
      { action: 'execute:filing', scope: 'any', granted: false },
    ],
    vertical: 'prism-counsel', riskClassification: 'Critical', lastActivity: '2026-04-25T08:10:00Z',
  },
  {
    id: 'aid-guardian', name: 'Guardian', spiffeUri: 'spiffe://a11oy.szl/agents/guardian', certFingerprint: 'SHA256:b2:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8', certIssued: '2026-01-01T00:00:00Z', certExpires: '2027-01-01T00:00:00Z', trustScore: 990, trustTier: 'sovereign', behaviorBaseline: 98.1, currentBehavior: 99.0, driftPct: 0.1, driftStatus: 'stable',
    capabilities: ['threat-intel', 'posture-assessment', 'incident-triage', 'perimeter-hardening'],
    permissions: [
      { action: 'read:threat-feeds', scope: 'all-sources', granted: true },
      { action: 'write:firewall-rules', scope: 'perimeter-only', granted: true },
      { action: 'execute:auto-escalate', scope: 'up-to-HIGH', granted: true },
      { action: 'execute:isolate-host', scope: 'with-ciso-approval', granted: true },
      { action: 'read:classified', scope: 'any', granted: false },
    ],
    vertical: 'aegis-defense', riskClassification: 'Critical', lastActivity: '2026-04-25T18:56:00Z',
  },
  {
    id: 'aid-pipeline', name: 'Pipeline Oracle', spiffeUri: 'spiffe://a11oy.szl/agents/pipeline-oracle', certFingerprint: 'SHA256:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9', certIssued: '2026-03-15T00:00:00Z', certExpires: '2027-03-15T00:00:00Z', trustScore: 910, trustTier: 'sovereign', behaviorBaseline: 88.6, currentBehavior: 91.2, driftPct: 1.8, driftStatus: 'watch',
    capabilities: ['pipeline-analysis', 'deal-scoring', 'forecast-modeling', 'churn-prediction'],
    permissions: [
      { action: 'read:crm-data', scope: 'all-accounts', granted: true },
      { action: 'write:crm-activity', scope: 'assigned-accounts', granted: true },
      { action: 'execute:outreach', scope: 'with-approval', granted: true },
      { action: 'execute:deal-close', scope: 'any', granted: false },
      { action: 'write:bulk-email', scope: 'any', granted: false },
    ],
    vertical: 'lyte-revenue', riskClassification: 'Medium', lastActivity: '2026-04-25T09:25:00Z',
  },
  {
    id: 'aid-terra', name: 'DOMAINE Analyst', spiffeUri: 'spiffe://a11oy.szl/agents/terra-analyst', certFingerprint: 'SHA256:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9:a1', certIssued: '2026-04-01T00:00:00Z', certExpires: '2027-04-01T00:00:00Z', trustScore: 880, trustTier: 'trusted', behaviorBaseline: 85.0, currentBehavior: 88.4, driftPct: 2.8, driftStatus: 'watch',
    capabilities: ['cap-rate-tracking', 'portfolio-analysis', 'valuation-modeling', 'comp-analysis'],
    permissions: [
      { action: 'read:property-data', scope: 'portfolio-only', granted: true },
      { action: 'write:valuation-model', scope: 'assigned-portfolios', granted: true },
      { action: 'execute:loi-draft', scope: 'with-approval', granted: true },
      { action: 'execute:acquisition', scope: 'any', granted: false },
    ],
    vertical: 'terra-real-estate', riskClassification: 'Medium', lastActivity: '2026-04-25T16:45:00Z',
  },
  {
    id: 'aid-watchdog', name: 'Fabric Watchdog', spiffeUri: 'spiffe://a11oy.szl/agents/fabric-watchdog', certFingerprint: 'SHA256:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9:a1:b2', certIssued: '2026-01-01T00:00:00Z', certExpires: '2027-01-01T00:00:00Z', trustScore: 1000, trustTier: 'sovereign', behaviorBaseline: 100.0, currentBehavior: 100.0, driftPct: 0.0, driftStatus: 'stable',
    capabilities: ['health-probe', 'proof-verification', 'layer-monitoring', 'latency-tracking'],
    permissions: [
      { action: 'read:all-metrics', scope: 'fabric-layers', granted: true },
      { action: 'execute:health-check', scope: 'all-layers', granted: true },
      { action: 'write:any', scope: 'any', granted: false },
    ],
    vertical: 'alloy-core', riskClassification: 'Low', lastActivity: '2026-04-26T10:00:00Z',
  },
];

const RISK_COLORS: Record<string, string> = { Critical: '#ef4444', High: '#f97316', Medium: GOLD, Low: '#22c55e' };
const DRIFT_COLORS: Record<string, string> = { stable: '#22c55e', watch: '#f97316', drift: '#ef4444' };

const DEMO_TRUST_EDGES: { from: string; to: string; relation: string; strength: number }[] = [
  { from: 'aid-cascade', to: 'aid-guardian', relation: 'sanctions-verification', strength: 0.95 },
  { from: 'aid-cascade', to: 'aid-counsel', relation: 'demurrage-clause-interp', strength: 0.88 },
  { from: 'aid-counsel', to: 'aid-guardian', relation: 'privilege-gate-review', strength: 0.82 },
  { from: 'aid-pipeline', to: 'aid-counsel', relation: 'contract-review', strength: 0.78 },
  { from: 'aid-pipeline', to: 'aid-terra', relation: 'cross-vertical-pipeline', strength: 0.72 },
  { from: 'aid-terra', to: 'aid-cascade', relation: 'port-adjacent-asset-impact', strength: 0.65 },
  { from: 'aid-watchdog', to: 'aid-cascade', relation: 'health-monitoring', strength: 0.99 },
  { from: 'aid-watchdog', to: 'aid-guardian', relation: 'health-monitoring', strength: 0.99 },
  { from: 'aid-watchdog', to: 'aid-counsel', relation: 'health-monitoring', strength: 0.99 },
  { from: 'aid-watchdog', to: 'aid-pipeline', relation: 'health-monitoring', strength: 0.97 },
  { from: 'aid-watchdog', to: 'aid-terra', relation: 'health-monitoring', strength: 0.97 },
  { from: 'aid-guardian', to: 'aid-cascade', relation: 'threat-intel-feed', strength: 0.91 },
];

const TOPO_POSITIONS: Record<string, { x: number; y: number }> = {
  'aid-watchdog': { x: 340, y: 40 },
  'aid-cascade': { x: 120, y: 140 },
  'aid-guardian': { x: 540, y: 140 },
  'aid-counsel': { x: 340, y: 200 },
  'aid-pipeline': { x: 120, y: 300 },
  'aid-terra': { x: 540, y: 300 },
};

export function AgentIdentityRegistry() {
  const { data, loading, error } = useApiData<{ agents: AgentIdentity[]; trustEdges: { from: string; to: string; relation: string; strength: number }[] }>('/pages/identity', { agents: DEMO_AGENTS, trustEdges: DEMO_TRUST_EDGES });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registry' | 'topology'>('registry');

  if (!data) {
    return (
      <Layout>
        <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.8rem', color: loading ? '#c9b787' : '#ef4444' }}>
          {loading ? 'Loading agent registry…' : (error ?? 'Failed to load agent registry')}
        </div>
      </Layout>
    );
  }

  const AGENTS = data.agents;
  const TRUST_EDGES = data.trustEdges;
  const selected = AGENTS.find(a => a.id === selectedId);

  return (
    <Layout>
      <PageHeader
        label="AGENT IDENTITY REGISTRY"
        title="Cryptographic Agent Identity"
        subtitle="Every A11oy agent has a cryptographic identity (SPIFFE URI + X.509 certificate), behavioral trust score, drift detection, and explicit authorization matrix."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="REGISTERED" value={AGENTS.length} sub="agents" accent={GOLD} />
        <KpiCard label="SOVEREIGN" value={AGENTS.filter(a => a.trustTier === 'sovereign').length} sub="900+ trust" accent="#22c55e" />
        <KpiCard label="AVG TRUST" value={Math.round(AGENTS.reduce((a, x) => a + x.trustScore, 0) / AGENTS.length)} sub="out of 1000" accent={GOLD} />
        <KpiCard label="CERTS VALID" value={`${AGENTS.length}/${AGENTS.length}`} sub="all current" accent="#22c55e" />
        <KpiCard label="DRIFT ALERTS" value={AGENTS.filter(a => a.driftStatus !== 'stable').length} sub="watching" accent="#f97316" />
        <KpiCard label="ZERO BYPASS" value="0" sub="no identity spoofing" accent={GOLD} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['registry', 'topology'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all"
            style={{
              backgroundColor: activeTab === tab ? `${GOLD}18` : 'transparent',
              color: activeTab === tab ? GOLD : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${activeTab === tab ? `${GOLD}30` : 'transparent'}`,
            }}
          >
            {tab === 'registry' ? 'Identity Registry' : 'Trust Topology'}
          </button>
        ))}
      </div>

      {activeTab === 'topology' && (
        <>
          <SectionTitle>Trust Topology Graph</SectionTitle>
          <Card className="mb-6">
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>AGENT TRUST RELATIONSHIPS</div>
            <svg viewBox="0 0 680 360" className="w-full" style={{ maxHeight: 400 }}>
              {TRUST_EDGES.map((edge, i) => {
                const fromPos = TOPO_POSITIONS[edge.from];
                const toPos = TOPO_POSITIONS[edge.to];
                if (!fromPos || !toPos) return null;
                const opacity = 0.15 + edge.strength * 0.45;
                const isMonitor = edge.relation === 'health-monitoring';
                return (
                  <line
                    key={i}
                    x1={fromPos.x} y1={fromPos.y}
                    x2={toPos.x} y2={toPos.y}
                    stroke={isMonitor ? '#22c55e' : GOLD}
                    strokeWidth={isMonitor ? 1 : 1.5}
                    strokeOpacity={opacity}
                    strokeDasharray={isMonitor ? '4 4' : 'none'}
                  />
                );
              })}
              {AGENTS.map(agent => {
                const pos = TOPO_POSITIONS[agent.id];
                if (!pos) return null;
                const tier = TRUST_TIERS[agent.trustTier];
                const isSelected = selectedId === agent.id;
                const radius = agent.trustTier === 'sovereign' ? 22 : 18;
                return (
                  <g key={agent.id} onClick={() => setSelectedId(isSelected ? null : agent.id)} style={{ cursor: 'pointer' }}>
                    <circle cx={pos.x} cy={pos.y} r={radius + 4} fill={`${tier.color}08`} stroke={`${tier.color}20`} strokeWidth={isSelected ? 2 : 0} />
                    <circle cx={pos.x} cy={pos.y} r={radius} fill="#0a0a0a" stroke={tier.color} strokeWidth={isSelected ? 2.5 : 1.5} />
                    <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill={tier.color} fontSize={8} fontFamily="ui-monospace, monospace" fontWeight={700}>{agent.trustScore}</text>
                    <text x={pos.x} y={pos.y + 7} textAnchor="middle" fill="#8a8a8a" fontSize={6} fontFamily="ui-monospace, monospace">{tier.label}</text>
                    <text x={pos.x} y={pos.y + radius + 14} textAnchor="middle" fill="#f5f5f5" fontSize={9} fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight={600}>{agent.name}</text>
                    <text x={pos.x} y={pos.y + radius + 26} textAnchor="middle" fill="#5e5e5e" fontSize={7} fontFamily="ui-monospace, monospace">{agent.vertical}</text>
                  </g>
                );
              })}
            </svg>
          </Card>

          <SectionTitle>Trust Edges ({TRUST_EDGES.length})</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {TRUST_EDGES.filter(e => e.relation !== 'health-monitoring').map((edge, i) => {
              const fromAgent = AGENTS.find(a => a.id === edge.from);
              const toAgent = AGENTS.find(a => a.id === edge.to);
              return (
                <Card key={i}>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-semibold" style={{ color: GOLD }}>{fromAgent?.name}</span>
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>→</span>
                    <span className="font-semibold" style={{ color: GOLD }}>{toAgent?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{edge.relation}</span>
                    <span className="font-mono" style={{ color: edge.strength >= 0.85 ? '#22c55e' : edge.strength >= 0.7 ? GOLD : '#f97316' }}>strength: {Math.round(edge.strength * 100)}%</span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                    <div className="h-full rounded-full" style={{ width: `${edge.strength * 100}%`, backgroundColor: edge.strength >= 0.85 ? '#22c55e' : edge.strength >= 0.7 ? GOLD : '#f97316' }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'registry' && (
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle>Identity Registry ({AGENTS.length})</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {AGENTS.map(agent => {
              const tierStyle = TRUST_TIERS[agent.trustTier];
              const riskColor = RISK_COLORS[agent.riskClassification];
              const driftColor = DRIFT_COLORS[agent.driftStatus];
              const isSelected = selectedId === agent.id;
              return (
                <div
                  key={agent.id}
                  className="rounded-xl border p-4 cursor-pointer transition-all"
                  onClick={() => setSelectedId(isSelected ? null : agent.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                    borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)',
                    borderLeft: `3px solid ${riskColor}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{agent.name}</div>
                      <div className="text-[9px] font-mono truncate" style={{ color: 'var(--color-a11oy-text-ghost)', maxWidth: 200 }}>{agent.spiffeUri}</div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: tierStyle.color, backgroundColor: `${tierStyle.color}15` }}>{tierStyle.label}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-mono font-bold" style={{ color: tierStyle.color }}>Trust: {agent.trustScore}</span>
                    <span className="font-mono" style={{ color: driftColor }}>drift: {agent.driftPct}%</span>
                  </div>
                  <ProgressBar value={agent.trustScore} max={1000} color={tierStyle.color} />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.capabilities.slice(0, 3).map(c => (
                      <span key={c} className="text-[9px] px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{c}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <SectionTitle>Identity Detail — {selected.name}</SectionTitle>
              <Card>
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SPIFFE URI</div>
                    <div className="font-mono px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: GOLD, wordBreak: 'break-all' }}>{selected.spiffeUri}</div>
                  </div>
                  <div>
                    <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CERT FINGERPRINT</div>
                    <div className="font-mono px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)', wordBreak: 'break-all', fontSize: 10 }}>{selected.certFingerprint}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ISSUED</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{new Date(selected.certIssued).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EXPIRES</div>
                      <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{new Date(selected.certExpires).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>BEHAVIORAL DRIFT</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Baseline: {selected.behaviorBaseline}%</span>
                          <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Current: {selected.currentBehavior}%</span>
                        </div>
                        <ProgressBar value={selected.currentBehavior} max={100} color={DRIFT_COLORS[selected.driftStatus]} />
                      </div>
                      <span className="font-mono px-1.5 py-0.5 rounded" style={{ color: DRIFT_COLORS[selected.driftStatus], backgroundColor: `${DRIFT_COLORS[selected.driftStatus]}15` }}>{selected.driftStatus}</span>
                    </div>
                  </div>

                  <div>
                    <div className="font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>AUTHORIZATION MATRIX</div>
                    <div className="space-y-1">
                      {selected.permissions.map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-1 px-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                          <div>
                            <span className="font-mono" style={{ color: p.granted ? '#22c55e' : '#ef4444' }}>{p.granted ? '✓' : '✗'}</span>
                            <span className="ml-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{p.action}</span>
                          </div>
                          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{p.scope}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <>
              <SectionTitle>Trust Tier Definitions</SectionTitle>
              <Card>
                <div className="space-y-3 text-xs">
                  {Object.entries(TRUST_TIERS).map(([key, tier]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tier.color }} />
                        <span className="font-mono" style={{ color: tier.color }}>{tier.label}</span>
                      </div>
                      <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{tier.range}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
                  Trust scores are computed from behavioral consistency, proof completion rate, policy compliance, and drift metrics. Scores below 500 trigger automatic capability restriction.
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Agent identities are SPIFFE-compliant (X.509 SVIDs) with mTLS enforcement. No agent operates without a valid, non-expired certificate.
      </div>
    </Layout>
  );
}
