import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge, StatusPill } from '../components/ui';

const API = '/api/a11oy';

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

export function ConnectorFirewall() {
  const [data, setData] = useState<FirewallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Connector | null>(null);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState('all');

  useEffect(() => {
    fetch(`${API}/connectors/sovereign`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function testConnector(connector: Connector) {
    setTestLoading(true);
    setTestResult(null);
    setSelected(connector);
    fetch(`${API}/connectors/${connector.id}/test`, { method: 'POST' })
      .then(r => r.json())
      .then(d => setTestResult(d))
      .catch(() => {})
      .finally(() => setTestLoading(false));
  }

  const filtered = data?.connectors.filter(c => filterRisk === 'all' || c.riskLevel === filterRisk) ?? [];

  return (
    <Layout>
      <PageHeader
        label="CONNECTOR FIREWALL"
        title="Integration Registry & Firewall"
        subtitle="Every connector is untrusted until registered, schema-validated, and consent-gated. Default deny — no tool call proceeds without an approved allowlist entry."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading connector registry…</div>
      ) : data ? (
        <>
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
                      <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: (testResult as Record<string, unknown>).ok ? 'rgba(201,183,135,0.08)' : 'rgba(245,245,245,0.08)', color: (testResult as Record<string, unknown>).ok ? '#c9b787' : '#f5f5f5', border: `1px solid ${(testResult as Record<string, unknown>).ok ? 'rgba(201,183,135,0.2)' : 'rgba(245,245,245,0.2)'}` }}>
                        {(testResult as Record<string, unknown>).ok
                          ? `✓ Connection test passed (demo mode) — latency: ${(testResult.data as Record<string, unknown>)?.latencyMs}ms`
                          : `✗ ${((testResult.error as Record<string, unknown>)?.message as string) ?? 'Blocked'}`
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
        </>
      ) : (
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Connector registry unavailable.</div>
      )}

      <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Demo mode — no real connector calls. All trust scores and firewall events are seeded. Destructive tools are always blocked.
      </div>
    </Layout>
  );
}
