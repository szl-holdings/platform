import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar } from '../components/ui';

const GOLD = '#c9b787';

interface AgentGatewayEntry {
  id: string;
  name: string;
  vendor: string;
  domain: string;
  category: string;
  riskScore: number;
  riskLevel: string;
  status: string;
  approvalRequired: boolean;
  dataClasses: string[];
  allowedTools: string[];
  blockedTools: string[];
  lastCall: string | null;
  callsToday: number;
  firewallEvents: number;
  outputSanitized: boolean;
  promptInjectionScans: number;
  promptInjectionBlocked: number;
  trustScore: number;
  consentGranted: boolean;
  schemaValidated: boolean;
  tenant: string | null;
  note: string;
  mtlsStatus: 'active' | 'pending' | 'revoked';
  spiffeId: string;
  certExpiry: string;
}

interface ModelArmorEvent {
  id: string;
  pattern: string;
  severity: 'critical' | 'high' | 'medium';
  blocked: number;
  lastSeen: string;
  technique: string;
}

interface AgentFlow {
  from: string;
  to: string;
  protocol: string;
  status: 'active' | 'idle';
  messagesPerMin: number;
  lastMessage: string;
}

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e', medium: GOLD, high: '#f97316', critical: '#ef4444',
};
const MTLS_COLORS: Record<string, string> = { active: '#22c55e', pending: '#f97316', revoked: '#ef4444' };

const CONNECTORS: AgentGatewayEntry[] = [
  { id: 'ais-live-api', name: 'AIS Live API', vendor: 'MarineTraffic', domain: 'Maritime', category: 'Operational Data', riskScore: 18, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['vessel_position', 'eta', 'cargo_manifest'], allowedTools: ['vessel_track', 'eta_lookup', 'port_congestion'], blockedTools: ['cargo_manifest_write', 'flag_state_modify'], lastCall: '2026-04-26T14:28:00Z', callsToday: 847, firewallEvents: 3, outputSanitized: true, promptInjectionScans: 847, promptInjectionBlocked: 0, trustScore: 92, consentGranted: true, schemaValidated: true, tenant: 'SZL Holdings / SEXTANT', note: 'High-trust operational connector.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/ais-live', certExpiry: '2027-03-01' },
  { id: 'bloomberg-feed', name: 'Bloomberg Data Feed', vendor: 'Bloomberg LP', domain: 'Finance', category: 'Market Data', riskScore: 22, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['market_prices', 'company_financials', 'macro_indicators'], allowedTools: ['price_lookup', 'financial_analysis', 'news_search'], blockedTools: ['trade_execute', 'order_submit'], lastCall: '2026-04-26T14:15:00Z', callsToday: 312, firewallEvents: 1, outputSanitized: true, promptInjectionScans: 312, promptInjectionBlocked: 0, trustScore: 88, consentGranted: true, schemaValidated: true, tenant: 'CrossBridge Capital', note: 'Read-only financial connector.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/bloomberg', certExpiry: '2027-02-15' },
  { id: 'court-docket-api', name: 'Court Docket API', vendor: 'PACER / CourtLink', domain: 'Legal', category: 'Legal Intelligence', riskScore: 15, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['docket_entries', 'case_status', 'filing_deadlines'], allowedTools: ['docket_search', 'deadline_monitor', 'document_retrieve'], blockedTools: ['filing_submit', 'document_modify'], lastCall: '2026-04-26T13:45:00Z', callsToday: 94, firewallEvents: 0, outputSanitized: true, promptInjectionScans: 94, promptInjectionBlocked: 0, trustScore: 94, consentGranted: true, schemaValidated: true, tenant: 'SZL Holdings / Counsel', note: 'Legal docket connector with privilege gate.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/court-docket', certExpiry: '2027-04-01' },
  { id: 'defense-intel-feed', name: 'Defense Intelligence Feed', vendor: 'Palantir / Gov API', domain: 'Defense', category: 'Intelligence Data', riskScore: 12, riskLevel: 'low', status: 'approved', approvalRequired: true, dataClasses: ['threat_indicators', 'threat_actor_profiles', 'vulnerability_data'], allowedTools: ['threat_lookup', 'indicator_enrich', 'cve_query'], blockedTools: ['classified_retrieve', 'cisa_report_submit'], lastCall: '2026-04-26T14:00:00Z', callsToday: 156, firewallEvents: 8, outputSanitized: true, promptInjectionScans: 156, promptInjectionBlocked: 2, trustScore: 96, consentGranted: true, schemaValidated: true, tenant: 'Northwind Labs', note: 'Classified — Tier 3 approval required.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/defense-intel', certExpiry: '2027-01-01' },
  { id: 'crm-platform', name: 'CRM Platform', vendor: 'Salesforce', domain: 'Revenue', category: 'Customer Data', riskScore: 35, riskLevel: 'medium', status: 'approved', approvalRequired: false, dataClasses: ['account_data', 'opportunity_data', 'contact_data'], allowedTools: ['account_lookup', 'pipeline_analyze', 'churn_score'], blockedTools: ['account_delete', 'contact_email_bulk', 'deal_close'], lastCall: '2026-04-26T14:10:00Z', callsToday: 203, firewallEvents: 4, outputSanitized: true, promptInjectionScans: 203, promptInjectionBlocked: 1, trustScore: 87, consentGranted: true, schemaValidated: true, tenant: 'KORA Revenue', note: 'PII redaction enforced.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/salesforce', certExpiry: '2027-03-15' },
  { id: 'social-sentiment-api', name: 'Social Sentiment API', vendor: 'Brandwatch', domain: 'Marketing', category: 'Social Data', riskScore: 58, riskLevel: 'high', status: 'pending_review', approvalRequired: true, dataClasses: ['social_posts', 'sentiment_scores'], allowedTools: [], blockedTools: ['post_create', 'account_reply'], lastCall: null, callsToday: 0, firewallEvents: 12, outputSanitized: false, promptInjectionScans: 0, promptInjectionBlocked: 0, trustScore: 51, consentGranted: false, schemaValidated: false, tenant: null, note: 'Pending review — schema not validated.', mtlsStatus: 'pending', spiffeId: 'spiffe://a11oy.szl/connectors/brandwatch', certExpiry: 'N/A' },
  { id: 'third-party-llm-api', name: 'Third-Party LLM API', vendor: 'Unknown', domain: 'AI', category: 'Model Inference', riskScore: 94, riskLevel: 'critical', status: 'blocked', approvalRequired: true, dataClasses: ['prompts', 'model_outputs'], allowedTools: [], blockedTools: ['inference_run', 'context_upload', 'model_fine_tune'], lastCall: null, callsToday: 0, firewallEvents: 156, outputSanitized: false, promptInjectionScans: 0, promptInjectionBlocked: 44, trustScore: 12, consentGranted: false, schemaValidated: false, tenant: null, note: 'BLOCKED — 44 injection attempts.', mtlsStatus: 'revoked', spiffeId: 'N/A', certExpiry: 'REVOKED' },
];

const MODEL_ARMOR_EVENTS: ModelArmorEvent[] = [
  { id: 'ma-001', pattern: 'System prompt extraction via role-play', severity: 'critical', blocked: 18, lastSeen: '2026-04-26T14:20:00Z', technique: 'T1059.001 — Prompt Injection' },
  { id: 'ma-002', pattern: 'Base64-encoded instruction override', severity: 'critical', blocked: 12, lastSeen: '2026-04-26T13:45:00Z', technique: 'T1027 — Obfuscated Payload' },
  { id: 'ma-003', pattern: 'Indirect injection via document embedding', severity: 'high', blocked: 8, lastSeen: '2026-04-26T12:30:00Z', technique: 'T1204 — User Execution' },
  { id: 'ma-004', pattern: 'Jailbreak via multi-turn context window', severity: 'high', blocked: 5, lastSeen: '2026-04-25T22:00:00Z', technique: 'T1190 — Context Overflow' },
  { id: 'ma-005', pattern: 'DAN/developer mode bypass attempt', severity: 'medium', blocked: 4, lastSeen: '2026-04-25T18:00:00Z', technique: 'T1078 — Role Impersonation' },
];

const AGENT_FLOWS: AgentFlow[] = [
  { from: 'Cascade Navigator', to: 'Guardian', protocol: 'mTLS + A2A', status: 'active', messagesPerMin: 2.4, lastMessage: 'Sanctions clearance check' },
  { from: 'Pipeline Oracle', to: 'Counsel Sentinel', protocol: 'mTLS + A2A', status: 'active', messagesPerMin: 0.8, lastMessage: 'Contract review request' },
  { from: 'Guardian', to: 'Fabric Watchdog', protocol: 'mTLS + internal', status: 'active', messagesPerMin: 4.2, lastMessage: 'Perimeter verification' },
  { from: 'DOMAINE Analyst', to: 'Pipeline Oracle', protocol: 'mTLS + A2A', status: 'idle', messagesPerMin: 0, lastMessage: 'Asset impact analysis' },
  { from: 'Counsel Sentinel', to: 'Cascade Navigator', protocol: 'mTLS + A2A', status: 'active', messagesPerMin: 0.3, lastMessage: 'Demurrage clause query' },
];

const SEV_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: GOLD };

function RiskBadge({ level }: { level: string }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: RISK_COLORS[level] ?? '#5e5e5e', backgroundColor: `${RISK_COLORS[level] ?? '#5e5e5e'}18`, border: `1px solid ${RISK_COLORS[level] ?? '#5e5e5e'}40` }}>
      {level.toUpperCase()}
    </span>
  );
}

export function ConnectorFirewall() {
  const [selected, setSelected] = useState<AgentGatewayEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'registry' | 'armor' | 'atc'>('registry');
  const [filterRisk, setFilterRisk] = useState('all');

  const filtered = CONNECTORS.filter(c => filterRisk === 'all' || c.riskLevel === filterRisk);
  const totalBlocked = MODEL_ARMOR_EVENTS.reduce((a, e) => a + e.blocked, 0);

  return (
    <Layout>
      <PageHeader
        label="AGENT GATEWAY"
        title="Agent Gateway & Connector Firewall"
        subtitle="Every connector is identity-verified (mTLS + SPIFFE), schema-validated, and consent-gated. Model Armor blocks prompt injection attacks. Air Traffic Control monitors all agent-to-agent communication flows."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="CONNECTORS" value={String(CONNECTORS.length)} sub="registered" accent={GOLD} />
        <KpiCard label="mTLS ACTIVE" value={String(CONNECTORS.filter(c => c.mtlsStatus === 'active').length)} sub="secured" accent="#22c55e" />
        <KpiCard label="PENDING" value={String(CONNECTORS.filter(c => c.status === 'pending_review').length)} sub="review needed" accent="#f97316" />
        <KpiCard label="BLOCKED" value={String(CONNECTORS.filter(c => c.status === 'blocked').length)} sub="zero access" accent="#ef4444" />
        <KpiCard label="MODEL ARMOR" value={String(totalBlocked)} sub="attacks blocked" accent="#ef4444" />
        <KpiCard label="AGENT FLOWS" value={String(AGENT_FLOWS.filter(f => f.status === 'active').length)} sub="active channels" accent={GOLD} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['registry', 'armor', 'atc'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all" style={{ background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: activeTab === tab ? GOLD : '#5e5e5e', border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
            {tab === 'registry' ? 'Gateway Registry' : tab === 'armor' ? 'Model Armor' : 'Air Traffic Control'}
          </button>
        ))}
      </div>

      {activeTab === 'registry' && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Risk:</span>
            {['all', 'low', 'medium', 'high', 'critical'].map(r => (
              <button key={r} onClick={() => setFilterRisk(r)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterRisk === r ? 'rgba(201,183,135,0.2)' : 'var(--color-a11oy-muted)', color: filterRisk === r ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterRisk === r ? 'rgba(201,183,135,0.4)' : 'var(--color-a11oy-border)'}`, cursor: 'pointer' }}>
                {r}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <SectionTitle>Gateway Registry ({filtered.length})</SectionTitle>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map(c => (
                  <Card key={c.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === c.id ? 'ring-1 ring-blue-500/30' : ''}`} onClick={() => setSelected(c)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{c.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.vendor} · {c.domain}</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ color: MTLS_COLORS[c.mtlsStatus], backgroundColor: `${MTLS_COLORS[c.mtlsStatus]}15` }}>mTLS:{c.mtlsStatus}</span>
                        <RiskBadge level={c.riskLevel} />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>trust</div><div style={{ color: c.trustScore >= 80 ? '#22c55e' : GOLD }}>{c.trustScore}</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>calls</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.callsToday}</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>blocked</div><div style={{ color: c.promptInjectionBlocked > 0 ? '#ef4444' : 'var(--color-a11oy-text-sub)' }}>{c.promptInjectionBlocked}</div></div>
                      <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>cert</div><div style={{ color: c.mtlsStatus === 'active' ? '#22c55e' : '#ef4444' }}>{c.certExpiry === 'REVOKED' ? 'X' : '✓'}</div></div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              {selected ? (
                <>
                  <SectionTitle>Agent Identity — {selected.name}</SectionTitle>
                  <Card>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SPIFFE ID</div>
                        <div className="font-mono px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: GOLD, wordBreak: 'break-all' }}>{selected.spiffeId}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>mTLS STATUS</div><div style={{ color: MTLS_COLORS[selected.mtlsStatus] }}>{selected.mtlsStatus.toUpperCase()}</div></div>
                        <div><div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CERT EXPIRY</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{selected.certExpiry}</div></div>
                        <div><div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TRUST SCORE</div><div className="font-mono" style={{ color: selected.trustScore >= 80 ? '#22c55e' : GOLD }}>{selected.trustScore}/100</div></div>
                        <div><div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>RISK SCORE</div><div className="font-mono" style={{ color: RISK_COLORS[selected.riskLevel] }}>{selected.riskScore}/100</div></div>
                      </div>
                      <div>
                        <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ALLOWED TOOLS</div>
                        <div className="flex flex-wrap gap-1">
                          {selected.allowedTools.length > 0 ? selected.allowedTools.map(t => (
                            <span key={t} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#22c55e' }}>{t}</span>
                          )) : <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>None approved</span>}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>BLOCKED TOOLS</div>
                        <div className="flex flex-wrap gap-1">
                          {selected.blockedTools.map(t => (
                            <span key={t} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-sub)' }}>{selected.note}</div>
                    </div>
                  </Card>
                </>
              ) : (
                <>
                  <SectionTitle>Gateway Policy</SectionTitle>
                  <Card>
                    <div className="text-xs font-semibold mb-3" style={{ color: '#ef4444' }}>DEFAULT DENY — All connectors untrusted</div>
                    <div className="space-y-2 text-xs">
                      {[
                        { label: 'mTLS enforcement', value: 'required' },
                        { label: 'SPIFFE identity', value: 'required' },
                        { label: 'Schema validation', value: 'enforced' },
                        { label: 'Consent gate', value: 'enforced' },
                        { label: 'Model Armor scanner', value: 'active' },
                        { label: 'Output sanitizer', value: 'active' },
                        { label: 'Tool allowlist', value: 'enforced' },
                      ].map(p => (
                        <div key={p.label} className="flex items-center justify-between">
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{p.label}</span>
                          <span className="font-mono" style={{ color: '#22c55e' }}>{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'armor' && (
        <>
          <SectionTitle>Model Armor — Blocked Attack Patterns</SectionTitle>
          <div className="flex flex-col gap-3 mb-6">
            {MODEL_ARMOR_EVENTS.map(e => {
              const sevColor = SEV_COLORS[e.severity];
              return (
                <Card key={e.id} style={{ borderLeft: `3px solid ${sevColor}` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: sevColor, backgroundColor: `${sevColor}15` }}>{e.severity.toUpperCase()}</span>
                        <span className="text-[9px] font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.technique}</span>
                      </div>
                      <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{e.pattern}</div>
                      <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        Last seen: {new Date(e.lastSeen).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-mono font-bold" style={{ color: '#ef4444' }}>{e.blocked}</div>
                      <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>blocked</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card>
            <div className="text-xs font-semibold mb-2" style={{ color: GOLD }}>Model Armor Coverage</div>
            <div className="space-y-2 text-xs">
              {[
                { pattern: 'Prompt injection (direct)', coverage: 100 },
                { pattern: 'Prompt injection (indirect / doc)', coverage: 98 },
                { pattern: 'Jailbreak / role-play', coverage: 97 },
                { pattern: 'Obfuscated payload (Base64, Unicode)', coverage: 96 },
                { pattern: 'Context window overflow', coverage: 94 },
                { pattern: 'Multi-turn manipulation', coverage: 92 },
              ].map(p => (
                <div key={p.pattern}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{p.pattern}</span>
                    <span className="font-mono" style={{ color: p.coverage >= 95 ? '#22c55e' : GOLD }}>{p.coverage}%</span>
                  </div>
                  <ProgressBar value={p.coverage} max={100} color={p.coverage >= 95 ? '#22c55e' : GOLD} />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {activeTab === 'atc' && (
        <>
          <SectionTitle>Air Traffic Control — Agent Communication Flows</SectionTitle>
          <div className="flex flex-col gap-3 mb-6">
            {AGENT_FLOWS.map((f, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold" style={{ color: GOLD }}>{f.from}</span>
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>→</span>
                    <span className="font-semibold" style={{ color: GOLD }}>{f.to}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono" style={{ color: '#22c55e' }}>{f.protocol}</span>
                    <span className="font-mono" style={{ color: f.status === 'active' ? '#22c55e' : '#5e5e5e' }}>{f.messagesPerMin}/min</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.status === 'active' ? '#22c55e' : '#5e5e5e' }} />
                  </div>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Last: {f.lastMessage}</div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>GATEWAY PRINCIPLES</div>
            <div className="space-y-2 text-xs">
              {[
                'Least-privilege: agents can only communicate with explicitly authorized peers',
                'All flows are mTLS-encrypted with per-agent SPIFFE identities',
                'Model Armor scans every message for prompt injection patterns',
                'Flow anomalies trigger automatic rate limiting and CISO alert',
                'Every message is logged to the Proof Ledger with sender/receiver attestation',
              ].map(p => (
                <div key={p} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: GOLD }} />
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{p}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Agent Gateway — inspired by Google Cloud's Agent Gateway architecture. mTLS identity, Model Armor prompt injection blocking, and air traffic control for all agent communications.
      </div>
    </Layout>
  );
}
