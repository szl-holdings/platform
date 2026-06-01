import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const GOLD = '#c9b787';

interface AgentCard {
  id: string;
  name: string;
  description: string;
  vertical: string;
  version: string;
  capabilities: string[];
  inputModes: string[];
  outputModes: string[];
  authSchemes: string[];
  endpoint: string;
  status: 'registered' | 'discovered' | 'negotiating';
  trustScore: number;
  origin: 'internal' | 'external';
}

const AGENT_CARDS: AgentCard[] = [
  { id: 'ac-cascade', name: 'Cascade Navigator', description: 'Maritime domain specialist — ETA monitoring, port cost analysis, route optimization, demurrage calculation.', vertical: 'vessels-maritime', version: '2.4.1', capabilities: ['eta-monitoring', 'port-cost-analysis', 'route-optimization', 'demurrage-calc'], inputModes: ['application/json', 'text/plain'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS', 'DPoP'], endpoint: 'a11oy://agents/cascade-navigator', status: 'registered', trustScore: 970, origin: 'internal' },
  { id: 'ac-counsel', name: 'Counsel Sentinel', description: 'Legal domain specialist — deadline tracking, document status, matter monitoring, risk scoring.', vertical: 'prism-counsel', version: '2.3.0', capabilities: ['deadline-tracking', 'doc-review', 'matter-monitoring', 'risk-scoring'], inputModes: ['application/json', 'text/plain'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS', 'DPoP'], endpoint: 'a11oy://agents/counsel-sentinel', status: 'registered', trustScore: 990, origin: 'internal' },
  { id: 'ac-guardian', name: 'Guardian', description: 'Defense domain specialist — threat intelligence, posture assessment, incident triage, perimeter hardening.', vertical: 'aegis-defense', version: '3.1.0', capabilities: ['threat-intel', 'posture-assessment', 'incident-triage', 'perimeter-hardening'], inputModes: ['application/json', 'application/stix+json'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS', 'DPoP', 'SPIFFE'], endpoint: 'a11oy://agents/guardian', status: 'registered', trustScore: 990, origin: 'internal' },
  { id: 'ac-pipeline', name: 'Pipeline Oracle', description: 'Revenue domain specialist — pipeline analysis, deal scoring, forecast modeling, CRM monitoring.', vertical: 'lyte-revenue', version: '2.1.0', capabilities: ['pipeline-analysis', 'deal-scoring', 'forecast-modeling', 'churn-prediction'], inputModes: ['application/json'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS', 'DPoP'], endpoint: 'a11oy://agents/pipeline-oracle', status: 'registered', trustScore: 910, origin: 'internal' },
  { id: 'ac-terra', name: 'Terra Analyst', description: 'Real estate domain specialist — cap rate tracking, portfolio analysis, valuation modeling.', vertical: 'terra-real-estate', version: '1.8.2', capabilities: ['cap-rate-tracking', 'portfolio-analysis', 'valuation-modeling', 'comp-analysis'], inputModes: ['application/json'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS'], endpoint: 'a11oy://agents/terra-analyst', status: 'registered', trustScore: 880, origin: 'internal' },
  { id: 'ac-ext-visa', name: 'Visa Risk Agent', description: 'External financial risk assessment agent — transaction scoring, fraud pattern detection.', vertical: 'finance', version: '1.0.0', capabilities: ['txn-risk-scoring', 'fraud-detection', 'merchant-risk'], inputModes: ['application/json'], outputModes: ['application/json'], authSchemes: ['OAuth2', 'mTLS'], endpoint: 'https://agents.visa.com/risk-agent/v1', status: 'discovered', trustScore: 720, origin: 'external' },
  { id: 'ac-ext-mandiant', name: 'Mandiant Threat Intel', description: 'External threat intelligence agent — IOC enrichment, threat actor profiling, campaign attribution.', vertical: 'security', version: '2.1.0', capabilities: ['ioc-enrichment', 'threat-profiling', 'campaign-attribution'], inputModes: ['application/stix+json', 'application/json'], outputModes: ['application/stix+json'], authSchemes: ['OAuth2', 'API-Key'], endpoint: 'https://api.mandiant.com/a2a/v1', status: 'negotiating', trustScore: 810, origin: 'external' },
];

interface A2ATask {
  id: string;
  from: string;
  to: string;
  action: string;
  status: 'submitted' | 'working' | 'input-required' | 'completed' | 'failed';
  submittedAt: string;
  completedAt: string | null;
  proofHash: string | null;
}

const A2A_TASKS: A2ATask[] = [
  { id: 'task-001', from: 'Cascade Navigator', to: 'Guardian', action: 'Verify vessel sanctions clearance for MV Cascade', status: 'completed', submittedAt: '2026-04-25T04:00:00Z', completedAt: '2026-04-25T04:02:12Z', proofHash: 'sha256:a1b2c3' },
  { id: 'task-002', from: 'Pipeline Oracle', to: 'Counsel Sentinel', action: 'Review contract terms for Meridian renewal', status: 'working', submittedAt: '2026-04-25T09:30:00Z', completedAt: null, proofHash: null },
  { id: 'task-003', from: 'Guardian', to: 'Mandiant Threat Intel', action: 'Enrich IOC set for TG-Ember campaign', status: 'input-required', submittedAt: '2026-04-25T18:45:00Z', completedAt: null, proofHash: null },
  { id: 'task-004', from: 'Terra Analyst', to: 'Pipeline Oracle', action: 'Cross-reference port-adjacent asset impact on Q2 pipeline', status: 'completed', submittedAt: '2026-04-24T14:00:00Z', completedAt: '2026-04-24T14:18:30Z', proofHash: 'sha256:d4e5f6' },
  { id: 'task-005', from: 'Counsel Sentinel', to: 'Cascade Navigator', action: 'Provide demurrage clause interpretation for Talbot matter', status: 'completed', submittedAt: '2026-04-24T08:10:00Z', completedAt: '2026-04-24T08:14:55Z', proofHash: 'sha256:e5f6a7' },
  { id: 'task-006', from: 'Visa Risk Agent', to: 'Guardian', action: 'Correlate merchant risk scores with TG-Ember TTPs', status: 'submitted', submittedAt: '2026-04-25T20:00:00Z', completedAt: null, proofHash: null },
];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  submitted: { color: '#8a8a8a', bg: 'rgba(138,138,138,0.1)' },
  working: { color: '#c9b787', bg: 'rgba(201,183,135,0.1)' },
  'input-required': { color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  failed: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const ORIGIN_STYLE: Record<string, { color: string; bg: string }> = {
  internal: { color: GOLD, bg: `${GOLD}15` },
  external: { color: '#8a8a8a', bg: 'rgba(138,138,138,0.1)' },
};

export function A2AInterop() {
  const [activeTab, setActiveTab] = useState<'cards' | 'tasks' | 'topology'>('cards');
  const [selectedCard, setSelectedCard] = useState<AgentCard | null>(null);
  const [filterOrigin, setFilterOrigin] = useState('all');

  const filteredCards = AGENT_CARDS.filter(c => filterOrigin === 'all' || c.origin === filterOrigin);

  return (
    <Layout>
      <PageHeader
        label="A2A INTEROP"
        title="Agent-to-Agent Protocol Layer"
        subtitle="Every A11oy workcell publishes an Agent Card (JSON capability manifest) and can discover, negotiate, and exchange tasks with internal and external agents via the A2A protocol."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="AGENT CARDS" value={AGENT_CARDS.length} sub={`${AGENT_CARDS.filter(c => c.origin === 'internal').length} internal · ${AGENT_CARDS.filter(c => c.origin === 'external').length} external`} accent={GOLD} />
        <KpiCard label="A2A TASKS" value={A2A_TASKS.length} sub={`${A2A_TASKS.filter(t => t.status === 'completed').length} completed`} accent={GOLD} />
        <KpiCard label="PROTOCOL" value="v0.3" sub="A2A + gRPC" accent="#8a8a8a" />
        <KpiCard label="PROOF COVERAGE" value={`${Math.round((A2A_TASKS.filter(t => t.proofHash).length / A2A_TASKS.length) * 100)}%`} sub={`${A2A_TASKS.filter(t => t.proofHash).length}/${A2A_TASKS.length} attested`} accent={A2A_TASKS.every(t => t.proofHash) ? '#22c55e' : GOLD} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['cards', 'tasks', 'topology'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all"
            style={{
              background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent',
              color: activeTab === tab ? GOLD : '#5e5e5e',
              border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {tab === 'cards' ? 'Agent Cards' : tab === 'tasks' ? 'Task Lifecycle' : 'Network Topology'}
          </button>
        ))}
      </div>

      {activeTab === 'cards' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {['all', 'internal', 'external'].map(o => (
                <button key={o} onClick={() => setFilterOrigin(o)} className="text-xs px-2.5 py-1 rounded font-mono" style={{ backgroundColor: filterOrigin === o ? 'rgba(201,183,135,0.12)' : 'var(--color-a11oy-muted)', color: filterOrigin === o ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterOrigin === o ? 'rgba(201,183,135,0.25)' : 'transparent'}`, cursor: 'pointer' }}>
                  {o}
                </button>
              ))}
            </div>
            <SectionTitle>Agent Card Registry ({filteredCards.length})</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredCards.map(card => {
                const os = ORIGIN_STYLE[card.origin];
                return (
                  <div
                    key={card.id}
                    className="rounded-xl border p-4 cursor-pointer transition-all"
                    onClick={() => setSelectedCard(card)}
                    style={{
                      backgroundColor: selectedCard?.id === card.id ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                      borderColor: selectedCard?.id === card.id ? GOLD : 'var(--color-a11oy-border)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{card.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>v{card.version}</div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: os.color, backgroundColor: os.bg }}>{card.origin}</span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{card.description.slice(0, 80)}…</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {card.capabilities.slice(0, 3).map(c => (
                        <span key={c} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{c}</span>
                      ))}
                      {card.capabilities.length > 3 && <span className="text-[9px] px-1 py-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>+{card.capabilities.length - 3}</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono" style={{ color: card.trustScore >= 900 ? '#22c55e' : card.trustScore >= 700 ? GOLD : '#f97316' }}>Trust: {card.trustScore}</span>
                      <span className="font-mono" style={{ color: card.status === 'registered' ? '#22c55e' : card.status === 'discovered' ? GOLD : '#f97316' }}>{card.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            {selectedCard ? (
              <>
                <SectionTitle>Agent Card — {selectedCard.name}</SectionTitle>
                <Card>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{selectedCard.name}</div>
                  <p className="text-xs mb-4" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedCard.description}</p>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ENDPOINT</div>
                      <div className="font-mono px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: GOLD, wordBreak: 'break-all' }}>{selectedCard.endpoint}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CAPABILITIES</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedCard.capabilities.map(c => (
                          <span key={c} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${GOLD}12`, color: GOLD }}>{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>INPUT MODES</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedCard.inputModes.map(m => (
                          <span key={m} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>OUTPUT MODES</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedCard.outputModes.map(m => (
                          <span key={m} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{m}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>AUTH SCHEMES</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedCard.authSchemes.map(a => (
                          <span key={a} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>{a}</span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TRUST SCORE</div>
                        <div className="font-mono text-lg font-bold" style={{ color: selectedCard.trustScore >= 900 ? '#22c55e' : GOLD }}>{selectedCard.trustScore}/1000</div>
                      </div>
                      <div>
                        <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>VERSION</div>
                        <div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>v{selectedCard.version}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <>
                <SectionTitle>Protocol Specification</SectionTitle>
                <Card>
                  <div className="space-y-3 text-xs">
                    {[
                      { label: 'Protocol', value: 'A2A v0.3 (Linux Foundation)' },
                      { label: 'Transport', value: 'HTTPS + gRPC bidirectional streaming' },
                      { label: 'Discovery', value: 'Agent Cards (JSON capability manifests)' },
                      { label: 'Auth', value: 'mTLS + DPoP token binding' },
                      { label: 'Task Model', value: 'submitted → working → input-required → completed' },
                      { label: 'Proof', value: 'Every A2A task attested in Proof Ledger' },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between">
                        <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{r.label}</span>
                        <span className="font-mono" style={{ color: GOLD }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <>
          <SectionTitle>A2A Task Lifecycle ({A2A_TASKS.length})</SectionTitle>
          <div className="flex flex-col gap-3">
            {A2A_TASKS.map(task => {
              const ss = STATUS_STYLE[task.status];
              return (
                <Card key={task.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: ss.color, backgroundColor: ss.bg }}>{task.status.toUpperCase()}</span>
                        <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{task.id}</span>
                      </div>
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{task.action}</div>
                      <div className="text-xs flex items-center gap-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        <span style={{ color: GOLD }}>{task.from}</span>
                        <span>→</span>
                        <span style={{ color: GOLD }}>{task.to}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs flex-shrink-0">
                      {task.proofHash && (
                        <div className="font-mono mb-1" style={{ color: '#22c55e' }}>{task.proofHash}</div>
                      )}
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        {new Date(task.submittedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-6">
            <SectionTitle>Task State Machine</SectionTitle>
            <Card>
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                {['submitted', 'working', 'input-required', 'completed'].map((s, i) => {
                  const ss = STATUS_STYLE[s];
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded" style={{ color: ss.color, backgroundColor: ss.bg }}>{s}</span>
                      {i < 3 && <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>→</span>}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                Every state transition is logged to the Proof Ledger. Failed tasks trigger automatic retry with exponential backoff. Input-required tasks hold until the requesting agent provides additional context.
              </p>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'topology' && (
        <>
          <SectionTitle>A2A Network Topology</SectionTitle>
          <Card>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {AGENT_CARDS.map(card => {
                const os = ORIGIN_STYLE[card.origin];
                const connections = A2A_TASKS.filter(t => t.from === card.name || t.to === card.name);
                return (
                  <div key={card.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--color-a11oy-border)', backgroundColor: 'var(--color-a11oy-deep)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{card.name}</span>
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ color: os.color, backgroundColor: os.bg }}>{card.origin}</span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{connections.length} connections</div>
                    <div className="flex flex-wrap gap-1">
                      {card.authSchemes.map(a => (
                        <span key={a} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <SectionTitle>Connection Matrix</SectionTitle>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                    {['From', 'To', 'Tasks', 'Protocol', 'Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {A2A_TASKS.map((t, i) => (
                    <tr key={t.id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                      <td className="px-3 py-2" style={{ color: GOLD }}>{t.from}</td>
                      <td className="px-3 py-2" style={{ color: GOLD }}>{t.to}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{t.action.slice(0, 40)}…</td>
                      <td className="px-3 py-2 font-mono" style={{ color: '#22c55e' }}>mTLS + A2A</td>
                      <td className="px-3 py-2">
                        <span className="font-mono px-1.5 py-0.5 rounded" style={{ color: STATUS_STYLE[t.status].color, backgroundColor: STATUS_STYLE[t.status].bg }}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> A2A protocol governed by A11oy doctrine — every inter-agent exchange is attested, consent-gated, and proof-carrying.
      </div>
    </Layout>
  );
}
