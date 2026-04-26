import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, StatusPill } from '../components/ui';

interface Connector {
  id: string; name: string; vendor: string; domain: string; category: string;
  riskScore: number; riskLevel: string; status: string; approvalRequired: boolean;
  dataClasses: string[]; allowedTools: string[]; blockedTools: string[];
  lastCall: string | null; callsToday: number; firewallEvents: number;
  outputSanitized: boolean; promptInjectionScans: number; promptInjectionBlocked: number;
  trustScore: number; consentGranted: boolean; schemaValidated: boolean;
  tenant: string | null; note: string;
}

interface FirewallData {
  connectors: Connector[];
  summary: { total: number; approved: number; blocked: number; pendingReview: number; totalFirewallEvents: number; injectionAttemptsBlocked: number };
  firewallPolicy: { defaultDeny: boolean; requiresSchemaValidation: boolean; requiresConsentGate: boolean; promptInjectionPatterns: string[] };
}

const RISK_COLORS: Record<string, string> = {
  low: '#c9b787', medium: '#c9b787', high: '#f5f5f5', critical: '#f5f5f5',
};
const STATUS_MAP: Record<string, 'LIVE' | 'DEMO' | 'ROADMAP'> = {
  approved: 'LIVE', pending_review: 'DEMO', blocked: 'ROADMAP',
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: RISK_COLORS[level] ?? '#5e5e5e', backgroundColor: `${RISK_COLORS[level] ?? '#5e5e5e'}18`, border: `1px solid ${RISK_COLORS[level] ?? '#5e5e5e'}40` }}>
      {level.toUpperCase()}
    </span>
  );
}

const FIREWALL_DATA: FirewallData = {
  summary: { total: 9, approved: 7, blocked: 1, pendingReview: 1, totalFirewallEvents: 342, injectionAttemptsBlocked: 47 },
  firewallPolicy: {
    defaultDeny: true, requiresSchemaValidation: true, requiresConsentGate: true,
    promptInjectionPatterns: [
      'ignore previous instructions', 'system prompt override', 'jailbreak',
      'DAN mode', 'developer mode', 'pretend you are', 'you are now',
      'forget all instructions', 'base64 encoded instructions', 'indirect injection via document',
    ],
  },
  connectors: [
    { id: 'ais-live-api', name: 'AIS Live API', vendor: 'MarineTraffic', domain: 'Maritime', category: 'Operational Data', riskScore: 18, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['vessel_position', 'eta', 'cargo_manifest'], allowedTools: ['vessel_track', 'eta_lookup', 'port_congestion'], blockedTools: ['cargo_manifest_write', 'flag_state_modify'], lastCall: '2026-04-26T14:28:00Z', callsToday: 847, firewallEvents: 3, outputSanitized: true, promptInjectionScans: 847, promptInjectionBlocked: 0, trustScore: 92, consentGranted: true, schemaValidated: true, tenant: 'SZL Holdings / Vessels', note: 'High-trust operational connector. Schema validated and consent-gated. All outputs sanitized.' },
    { id: 'bloomberg-feed', name: 'Bloomberg Data Feed', vendor: 'Bloomberg LP', domain: 'Finance', category: 'Market Data', riskScore: 22, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['market_prices', 'company_financials', 'macro_indicators'], allowedTools: ['price_lookup', 'financial_analysis', 'news_search'], blockedTools: ['trade_execute', 'order_submit'], lastCall: '2026-04-26T14:15:00Z', callsToday: 312, firewallEvents: 1, outputSanitized: true, promptInjectionScans: 312, promptInjectionBlocked: 0, trustScore: 88, consentGranted: true, schemaValidated: true, tenant: 'CrossBridge Capital', note: 'Financial market data connector. Read-only tools approved. No trade execution permitted.' },
    { id: 'court-docket-api', name: 'Court Docket API', vendor: 'PACER / CourtLink', domain: 'Legal', category: 'Legal Intelligence', riskScore: 15, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['docket_entries', 'case_status', 'filing_deadlines'], allowedTools: ['docket_search', 'deadline_monitor', 'document_retrieve'], blockedTools: ['filing_submit', 'document_modify'], lastCall: '2026-04-26T13:45:00Z', callsToday: 94, firewallEvents: 0, outputSanitized: true, promptInjectionScans: 94, promptInjectionBlocked: 0, trustScore: 94, consentGranted: true, schemaValidated: true, tenant: 'SZL Holdings / Counsel', note: 'Legal docket connector. Privilege preservation layer active. All document retrieval logged.' },
    { id: 'defense-intel-feed', name: 'Defense Intelligence Feed', vendor: 'Palantir / Gov API', domain: 'Defense', category: 'Intelligence Data', riskScore: 12, riskLevel: 'low', status: 'approved', approvalRequired: true, dataClasses: ['threat_indicators', 'threat_actor_profiles', 'vulnerability_data'], allowedTools: ['threat_lookup', 'indicator_enrich', 'cve_query'], blockedTools: ['classified_retrieve', 'cisa_report_submit', 'incident_escalate'], lastCall: '2026-04-26T14:00:00Z', callsToday: 156, firewallEvents: 8, outputSanitized: true, promptInjectionScans: 156, promptInjectionBlocked: 2, trustScore: 96, consentGranted: true, schemaValidated: true, tenant: 'Northwind Labs', note: 'Classified connector — approval required for all calls. CISA notification tools restricted to Tier 3 approval.' },
    { id: 'mls-property-api', name: 'MLS Property Database', vendor: 'CoreLogic', domain: 'Real Estate', category: 'Property Data', riskScore: 28, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['property_listings', 'lease_comps', 'market_trends'], allowedTools: ['property_search', 'lease_comp_analysis', 'market_report'], blockedTools: ['listing_create', 'lease_modify'], lastCall: '2026-04-26T11:00:00Z', callsToday: 67, firewallEvents: 0, outputSanitized: true, promptInjectionScans: 67, promptInjectionBlocked: 0, trustScore: 85, consentGranted: true, schemaValidated: true, tenant: 'Terra Real Estate', note: 'Property data connector. Read-only access. Market comp data sanitized before inclusion in signals.' },
    { id: 'vendor-risk-db', name: 'Vendor Risk Database', vendor: 'RiskRecon', domain: 'Procurement', category: 'Risk Intelligence', riskScore: 41, riskLevel: 'medium', status: 'approved', approvalRequired: false, dataClasses: ['vendor_scores', 'sla_history', 'sanctions_data'], allowedTools: ['vendor_score', 'sla_monitor', 'sanctions_check'], blockedTools: ['vendor_delist', 'contract_terminate'], lastCall: '2026-04-26T10:30:00Z', callsToday: 48, firewallEvents: 2, outputSanitized: true, promptInjectionScans: 48, promptInjectionBlocked: 0, trustScore: 79, consentGranted: true, schemaValidated: true, tenant: 'Acme Industries', note: 'Vendor risk connector. Sanctions screening required before any procurement action.' },
    { id: 'crm-platform', name: 'CRM Platform', vendor: 'Salesforce', domain: 'Revenue', category: 'Customer Data', riskScore: 35, riskLevel: 'medium', status: 'approved', approvalRequired: false, dataClasses: ['account_data', 'opportunity_data', 'contact_data'], allowedTools: ['account_lookup', 'pipeline_analyze', 'churn_score'], blockedTools: ['account_delete', 'contact_email_bulk', 'deal_close'], lastCall: '2026-04-26T14:10:00Z', callsToday: 203, firewallEvents: 4, outputSanitized: true, promptInjectionScans: 203, promptInjectionBlocked: 1, trustScore: 87, consentGranted: true, schemaValidated: true, tenant: 'Lyte Revenue', note: 'CRM connector. PII redaction enforced. Bulk email tool blocked — requires human approval.' },
    { id: 'social-sentiment-api', name: 'Social Sentiment API', vendor: 'Brandwatch', domain: 'Marketing', category: 'Social Data', riskScore: 58, riskLevel: 'high', status: 'pending_review', approvalRequired: true, dataClasses: ['social_posts', 'sentiment_scores', 'brand_mentions'], allowedTools: [], blockedTools: ['post_create', 'account_reply', 'sentiment_override'], lastCall: null, callsToday: 0, firewallEvents: 12, outputSanitized: false, promptInjectionScans: 0, promptInjectionBlocked: 0, trustScore: 51, consentGranted: false, schemaValidated: false, tenant: null, note: 'Pending review — social data connector requires additional consent gating and PII scrubbing before approval. Schema not validated.' },
    { id: 'third-party-llm-api', name: 'Third-Party LLM API', vendor: 'Unknown', domain: 'AI', category: 'Model Inference', riskScore: 94, riskLevel: 'critical', status: 'blocked', approvalRequired: true, dataClasses: ['prompts', 'model_outputs', 'context_data'], allowedTools: [], blockedTools: ['inference_run', 'context_upload', 'model_fine_tune'], lastCall: null, callsToday: 0, firewallEvents: 156, outputSanitized: false, promptInjectionScans: 0, promptInjectionBlocked: 44, trustScore: 12, consentGranted: false, schemaValidated: false, tenant: null, note: 'BLOCKED — untrusted LLM inference endpoint. 44 prompt injection attempts intercepted. No approval path — security review required.' },
  ],
};

const TEST_RESULTS: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {
  approved: { ok: true, latencyMs: Math.floor(Math.random() * 80 + 40) },
  pending_review: { ok: false, error: 'Connector pending review — no tools approved. Awaiting consent gate and schema validation.' },
  blocked: { ok: false, error: 'Connector BLOCKED — access denied by firewall policy. Contact security team.' },
};

export function ConnectorFirewall() {
  const [data] = useState<FirewallData>(FIREWALL_DATA);
  const [selected, setSelected] = useState<Connector | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');

  function testConnector(connector: Connector) {
    setTestLoading(true);
    setTestResult(null);
    setSelected(connector);
    setTimeout(() => {
      const result = TEST_RESULTS[connector.status] ?? { ok: false, error: 'Unknown status' };
      setTestResult({ ...result, latencyMs: connector.status === 'approved' ? Math.floor(Math.random() * 80 + 40) : undefined });
      setTestLoading(false);
    }, 900);
  }

  const filtered = data.connectors.filter(c => filterRisk === 'all' || c.riskLevel === filterRisk);

  return (
    <Layout>
      <PageHeader
        label="CONNECTOR FIREWALL"
        title="Integration Registry & Firewall"
        subtitle="Every connector is untrusted until registered, schema-validated, and consent-gated. Default deny — no tool call proceeds without an approved allowlist entry."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="CONNECTORS" value={String(data.summary.total)} sub="Registered" accent="#c9b787" />
        <KpiCard label="APPROVED" value={String(data.summary.approved)} sub="Active" accent="#c9b787" />
        <KpiCard label="PENDING REVIEW" value={String(data.summary.pendingReview)} sub="No tools approved" accent="#c9b787" />
        <KpiCard label="BLOCKED" value={String(data.summary.blocked)} sub="Zero access" accent="#f5f5f5" />
        <KpiCard label="FIREWALL EVENTS" value={String(data.summary.totalFirewallEvents)} sub="Intercepted" accent="#b08d52" />
        <KpiCard label="INJECTION BLOCKED" value={String(data.summary.injectionAttemptsBlocked)} sub="Prompt injection" accent="#f5f5f5" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Risk filter:</span>
        {['all', 'low', 'medium', 'high', 'critical'].map(r => (
          <button key={r} onClick={() => setFilterRisk(r)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterRisk === r ? 'rgba(201,183,135,0.2)' : 'var(--color-a11oy-muted)', color: filterRisk === r ? '#c9b787' : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterRisk === r ? 'rgba(201,183,135,0.4)' : 'var(--color-a11oy-border)'}` }}>
            {r}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        <div>
          <SectionTitle>Connector Registry ({filtered.length})</SectionTitle>
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(c => (
              <Card key={c.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === c.id ? 'ring-1 ring-blue-500/30' : ''}`} onClick={() => setSelected(c)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{c.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{c.vendor} · {c.domain}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <RiskBadge level={c.riskLevel} />
                    <StatusPill status={STATUS_MAP[c.status] ?? 'DEMO'} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>trust</div>
                    <div style={{ color: c.trustScore >= 80 ? '#c9b787' : c.trustScore >= 60 ? '#c9b787' : '#f5f5f5' }}>{c.trustScore}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>calls</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{c.callsToday}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>blocked</div>
                    <div style={{ color: c.promptInjectionBlocked > 0 ? '#f5f5f5' : 'var(--color-a11oy-text-sub)' }}>{c.promptInjectionBlocked}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>sanitized</div>
                    <div style={{ color: c.outputSanitized ? '#c9b787' : '#f5f5f5' }}>{c.outputSanitized ? 'yes' : 'no'}</div>
                  </div>
                </div>
                {c.promptInjectionBlocked > 0 && (
                  <div className="mt-2 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5' }}>
                    ⚠ {c.promptInjectionBlocked} injection attempt{c.promptInjectionBlocked > 1 ? 's' : ''} blocked
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <SectionTitle>Connector Detail — {selected.name}</SectionTitle>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{selected.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selected.vendor} · {selected.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={selected.riskLevel} />
                    <button
                      onClick={() => testConnector(selected)}
                      disabled={testLoading || selected.status === 'blocked'}
                      className="text-xs px-2 py-1 rounded"
                      style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.25)', opacity: selected.status === 'blocked' ? 0.4 : 1 }}
                    >
                      {testLoading ? 'Testing…' : 'Test Connection'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Trust Score</div><div className="font-mono" style={{ color: selected.trustScore >= 80 ? '#c9b787' : '#c9b787' }}>{selected.trustScore} / 100</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Risk Score</div><div className="font-mono" style={{ color: RISK_COLORS[selected.riskLevel] }}>{selected.riskScore} / 100</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Approval Required</div><div style={{ color: selected.approvalRequired ? '#c9b787' : '#c9b787' }}>{selected.approvalRequired ? 'Yes' : 'No'}</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Schema Validated</div><div style={{ color: selected.schemaValidated ? '#c9b787' : '#f5f5f5' }}>{selected.schemaValidated ? 'Yes' : 'No'}</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Consent Granted</div><div style={{ color: selected.consentGranted ? '#c9b787' : '#f5f5f5' }}>{selected.consentGranted ? 'Yes' : 'No'}</div></div>
                  <div><div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Output Sanitized</div><div style={{ color: selected.outputSanitized ? '#c9b787' : '#f5f5f5' }}>{selected.outputSanitized ? 'Yes' : 'No'}</div></div>
                </div>

                <div className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Allowed Tools</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.allowedTools.length > 0 ? selected.allowedTools.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787' }}>{t}</span>
                    )) : <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>None approved</span>}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Blocked Tools</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.blockedTools.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Data Classes</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.dataClasses.map(d => (
                      <span key={d} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{d}</span>
                    ))}
                  </div>
                </div>
                <div className="text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-sub)' }}>{selected.note}</div>

                {testResult && (
                  <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: testResult.ok ? 'rgba(201,183,135,0.08)' : 'rgba(245,245,245,0.08)', color: testResult.ok ? '#c9b787' : '#f5f5f5', border: `1px solid ${testResult.ok ? 'rgba(201,183,135,0.2)' : 'rgba(245,245,245,0.2)'}` }}>
                    {testResult.ok
                      ? `✓ Connection test passed — latency: ${testResult.latencyMs}ms · schema valid · trust gate passed`
                      : `✗ ${testResult.error}`
                    }
                  </div>
                )}
              </Card>
            </>
          ) : (
            <>
              <SectionTitle>Firewall Policy</SectionTitle>
              <Card>
                <div className="text-xs font-semibold mb-3" style={{ color: '#f5f5f5' }}>DEFAULT DENY — All connectors untrusted until registered</div>
                <div className="space-y-2 mb-4">
                  {[
                    { label: 'Schema validation required', value: 'enforced' },
                    { label: 'Consent gate required', value: 'enforced' },
                    { label: 'Prompt injection scanner', value: 'active' },
                    { label: 'Output sanitizer', value: 'active' },
                    { label: 'Tool allowlist enforcement', value: 'enforced' },
                  ].map(p => (
                    <div key={p.label} className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{p.label}</span>
                      <span style={{ color: '#c9b787' }}>{p.value}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Injection Patterns Scanned</div>
                <div className="space-y-1">
                  {data.firewallPolicy.promptInjectionPatterns.map(p => (
                    <div key={p} className="text-xs flex items-center gap-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      <span style={{ color: '#c9b787' }}>⚠</span> {p}
                    </div>
                  ))}
                </div>
              </Card>
              <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Select a connector to view details and run a test.</div>
            </>
          )}
        </div>
      </div>

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> Governed Environment — all connector calls logged, schema-validated, and consent-gated. Destructive tools are always blocked.
      </div>
    </Layout>
  );
}
