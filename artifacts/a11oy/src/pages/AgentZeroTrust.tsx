import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useDefenseData } from '../hooks/useDefenseData';
import { LoadingState, ErrorState, RefreshBar } from '../components/DefenseDataState';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

interface AgentIdentity {
  id: string;
  name: string;
  type: 'agent' | 'service' | 'connector' | 'tool-server' | 'human';
  status: 'verified' | 'rotating' | 'anomalous' | 'suspended';
  credentialType: string;
  lastRotation: string;
  nextRotation: string;
  rotationIntervalHrs: number;
  mcpTokens: number;
  mcpScopes: string[];
  privilegeLevel: 'minimal' | 'standard' | 'elevated' | 'admin';
  trustScore: number;
  anomalyCount: number;
  lastActivity: string;
}

interface BehaviorAnomaly {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  action: string;
}

interface AgentZeroTrustData {
  identities: AgentIdentity[];
  anomalies: BehaviorAnomaly[];
}

const STATUS_COLORS: Record<string, string> = { verified: '#c9b787', rotating: '#3b82f6', anomalous: '#ef4444', suspended: '#f59e0b' };
const TYPE_ICONS: Record<string, string> = { agent: '⬡', service: '◈', connector: '◆', 'tool-server': '◇', human: '●' };
const PRIV_COLORS: Record<string, string> = { minimal: '#5e5e5e', standard: '#8a8a8a', elevated: '#c9b787', admin: '#f5f5f5' };
const SEV_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#8a8a8a' };

export function AgentZeroTrust() {
  const [view, setView] = useState<'inventory' | 'rotation' | 'mcp-matrix' | 'anomalies'>('inventory');
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [pulseIdx, setPulseIdx] = useState(0);
  const { data, loading, error, lastUpdated, refresh } = useDefenseData<AgentZeroTrustData>(
    '/api/internal/a11oy/defense/agent-zero-trust'
  );

  const identities = data?.identities ?? [];
  const anomalies = data?.anomalies ?? [];

  useEffect(() => {
    if (identities.length === 0) return;
    const iv = setInterval(() => setPulseIdx(p => (p + 1) % identities.length), 3000);
    return () => clearInterval(iv);
  }, [identities.length]);

  const machineCount = identities.filter(i => i.type !== 'human').length;
  const humanCount = identities.filter(i => i.type === 'human').length;
  const ratio = humanCount > 0 ? Math.round(machineCount / humanCount) : machineCount;
  const anomalousCount = identities.filter(i => i.status === 'anomalous').length;
  const selected = identities.find(i => i.id === selectedIdentity);

  return (
    <Layout>
      <PageHeader
        label="AGENT ZERO TRUST"
        title="Identity-First Agent Security"
        subtitle="Every agent identity is untrusted by default — inspired by PANW's 82:1 machine-to-human identity ratio finding. Credential rotation, MCP token scoping, least-privilege enforcement, and behavioral anomaly detection."
        status="LIVE"
      />

      <RefreshBar loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={refresh} />

      {!data && loading ? (
        <LoadingState label="Loading agent identity inventory…" />
      ) : !data && error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KpiCard label="IDENTITIES" value={identities.length} sub="registered" accent={T.accent} />
            <KpiCard label="MACHINE:HUMAN" value={`${ratio}:1`} sub="identity ratio" accent={T.accent} />
            <KpiCard label="VERIFIED" value={identities.filter(i => i.status === 'verified').length} sub="active" accent={T.accent} />
            <KpiCard label="ANOMALOUS" value={anomalousCount} sub="flagged" accent={anomalousCount > 0 ? '#ef4444' : T.accent} />
            <KpiCard label="MCP TOKENS" value={identities.reduce((a, i) => a + i.mcpTokens, 0)} sub="scoped" accent={T.dim} />
            <KpiCard label="AVG TRUST" value={identities.length ? Math.round(identities.reduce((a, i) => a + i.trustScore, 0) / identities.length) : 0} sub="score" accent={T.accent} />
          </div>

          <div className="p-4 rounded-lg mb-6" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)' }}>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.accent }}>MACHINE-TO-HUMAN IDENTITY RATIO</div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="flex gap-0.5 flex-wrap">
                  {identities.filter(i => i.type !== 'human').map((_, idx) => (
                    <div key={idx} className="w-3 h-3 rounded-sm transition-all" style={{ background: idx === pulseIdx ? T.accent : 'rgba(201,183,135,0.15)', border: `1px solid ${idx === pulseIdx ? T.accent : 'rgba(201,183,135,0.08)'}` }} />
                  ))}
                  {identities.filter(i => i.type === 'human').map((_, idx) => (
                    <div key={`h-${idx}`} className="w-3 h-3 rounded-full" style={{ background: T.text, border: `1px solid ${T.text}` }} />
                  ))}
                </div>
                <div className="text-[10px] mt-2" style={{ color: T.dim }}>
                  {machineCount} machine identities for every {humanCount} human — each is an attack surface that requires zero-trust verification
                </div>
              </div>
              <div className="text-3xl font-mono font-bold flex-shrink-0" style={{ color: T.accent }}>{ratio}:1</div>
            </div>
          </div>

          <div className="flex gap-1 mb-6">
            {(['inventory', 'rotation', 'mcp-matrix', 'anomalies'] as const).map(tab => (
              <button key={tab} onClick={() => setView(tab)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: view === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: view === tab ? T.accent : T.muted, border: `1px solid ${view === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {view === 'inventory' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-2">
                <SectionTitle>Agent Identity Inventory</SectionTitle>
                {identities.map(identity => (
                  <button key={identity.id} onClick={() => setSelectedIdentity(identity.id)} className="w-full text-left rounded-lg p-4 transition-all" style={{ background: selectedIdentity === identity.id ? 'rgba(201,183,135,0.05)' : T.surface, border: `1px solid ${selectedIdentity === identity.id ? 'rgba(201,183,135,0.2)' : identity.status === 'anomalous' ? 'rgba(239,68,68,0.3)' : T.border}` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg" style={{ color: STATUS_COLORS[identity.status] }}>{TYPE_ICONS[identity.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: T.text }}>{identity.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[identity.status]}15`, color: STATUS_COLORS[identity.status] }}>{identity.status}</span>
                          <span className="text-[9px] font-mono" style={{ color: T.muted }}>{identity.type}</span>
                        </div>
                        <div className="text-[10px] font-mono mt-0.5" style={{ color: T.dim }}>
                          {identity.credentialType} · Trust: {identity.trustScore} · Privilege: <span style={{ color: PRIV_COLORS[identity.privilegeLevel] }}>{identity.privilegeLevel}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono" style={{ color: identity.anomalyCount > 0 ? '#ef4444' : T.accent }}>{identity.mcpTokens} tokens</div>
                        <div className="text-[9px] font-mono" style={{ color: T.muted }}>{identity.anomalyCount > 0 ? `${identity.anomalyCount} anomalies` : 'clean'}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div>
                {selected ? (
                  <div className="rounded-lg p-5 sticky top-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg" style={{ color: STATUS_COLORS[selected.status] }}>{TYPE_ICONS[selected.type]}</span>
                      <div className="text-sm font-medium" style={{ color: T.text }}>{selected.name}</div>
                    </div>
                    <div className="text-[10px] font-mono mb-4" style={{ color: T.dim }}>{selected.id} · {selected.type}</div>
                    <div className="space-y-3 text-[10px]">
                      <div><span style={{ color: T.muted }}>Credential Type:</span> <span style={{ color: T.text }}>{selected.credentialType}</span></div>
                      <div><span style={{ color: T.muted }}>Privilege Level:</span> <span style={{ color: PRIV_COLORS[selected.privilegeLevel] }}>{selected.privilegeLevel}</span></div>
                      <div><span style={{ color: T.muted }}>Trust Score:</span> <span className="font-mono font-bold" style={{ color: selected.trustScore >= 90 ? T.accent : selected.trustScore >= 50 ? T.dim : '#ef4444' }}>{selected.trustScore}</span></div>
                      <div><span style={{ color: T.muted }}>Rotation Interval:</span> <span style={{ color: T.text }}>{selected.rotationIntervalHrs}h</span></div>
                      <div><span style={{ color: T.muted }}>Last Rotation:</span> <span style={{ color: T.dim }}>{selected.lastRotation}</span></div>
                      <div><span style={{ color: T.muted }}>Next Rotation:</span> <span style={{ color: T.accent }}>{selected.nextRotation}</span></div>
                      {selected.mcpScopes.length > 0 && (
                        <div>
                          <div className="mb-1" style={{ color: T.muted }}>MCP Scopes ({selected.mcpScopes.length}):</div>
                          <div className="flex flex-wrap gap-1">
                            {selected.mcpScopes.map(s => (
                              <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selected.anomalyCount > 0 && (
                        <div className="p-2 rounded" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                          <span style={{ color: '#ef4444' }}>{selected.anomalyCount} anomalies detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg p-8 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    <div className="text-xs" style={{ color: T.muted }}>Select an identity to inspect</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'rotation' && (
            <>
              <SectionTitle>Credential Rotation Schedule</SectionTitle>
              <p className="text-xs mb-4" style={{ color: T.dim }}>
                All agent credentials rotate on enforced schedules. High-privilege identities rotate more frequently. Expired credentials are automatically revoked.
              </p>
              <div className="rounded-lg overflow-hidden mb-8" style={{ border: `1px solid ${T.border}` }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {['Identity', 'Type', 'Credential', 'Interval', 'Last Rotation', 'Next Rotation', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {identities.map(id => (
                      <tr key={id.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                        <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>{id.name}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{id.type}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{id.credentialType}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{id.rotationIntervalHrs}h</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{id.lastRotation === '—' ? '—' : new Date(id.lastRotation).toLocaleTimeString()}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{id.nextRotation === '—' ? '—' : new Date(id.nextRotation).toLocaleTimeString()}</td>
                        <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[id.status]}15`, color: STATUS_COLORS[id.status] }}>{id.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {view === 'mcp-matrix' && (
            <>
              <SectionTitle>MCP Token Scope Matrix</SectionTitle>
              <p className="text-xs mb-4" style={{ color: T.dim }}>
                Every MCP tool server token is scoped to specific capabilities. Agents can only invoke tools within their granted scopes. No wildcard access permitted.
              </p>
              <div className="space-y-3 mb-8">
                {identities.filter(i => i.mcpTokens > 0).map(id => (
                  <Card key={id.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: STATUS_COLORS[id.status] }}>{TYPE_ICONS[id.type]}</span>
                        <span className="text-xs font-medium" style={{ color: T.text }}>{id.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${PRIV_COLORS[id.privilegeLevel]}15`, color: PRIV_COLORS[id.privilegeLevel] }}>{id.privilegeLevel}</span>
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: T.accent }}>{id.mcpTokens} tokens</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {id.mcpScopes.map(scope => (
                        <span key={scope} className="text-[9px] font-mono px-2 py-1 rounded" style={{ background: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.12)', color: T.accent }}>{scope}</span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              <Card>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>LEAST-PRIVILEGE ENFORCEMENT</div>
                <div className="space-y-2 text-[10px]">
                  {[
                    { rule: 'No wildcard MCP scopes — every tool call requires explicit scope grant', status: 'enforced' },
                    { rule: 'Agent privilege cannot exceed its credential type ceiling', status: 'enforced' },
                    { rule: 'Cross-agent tool sharing requires bilateral scope approval', status: 'enforced' },
                    { rule: 'Elevated privileges auto-expire after 4 hours without renewal', status: 'enforced' },
                    { rule: 'Human admin required for any privilege elevation request', status: 'enforced' },
                    { rule: 'All scope changes logged to Proof Ledger with cryptographic hash', status: 'enforced' },
                  ].map(rule => (
                    <div key={rule.rule} className="flex items-center gap-2">
                      <span style={{ color: T.accent }}>✓</span>
                      <span style={{ color: T.dim }}>{rule.rule}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {view === 'anomalies' && (
            <>
              <SectionTitle>Behavioral Anomaly Timeline</SectionTitle>
              <p className="text-xs mb-4" style={{ color: T.dim }}>
                Continuous behavioral fingerprinting detects identity anomalies — credential replay, scope escalation attempts, behavioral pattern mismatches, and unverified agent registration.
              </p>
              <div className="space-y-3 mb-8">
                {anomalies.map(anomaly => (
                  <Card key={anomaly.id} style={{ borderLeft: `3px solid ${SEV_COLORS[anomaly.severity]}` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono" style={{ color: T.dim }}>{anomaly.id}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${SEV_COLORS[anomaly.severity]}18`, color: SEV_COLORS[anomaly.severity] }}>{anomaly.severity}</span>
                          <span className="text-[9px] font-mono" style={{ color: T.muted }}>{anomaly.type}</span>
                        </div>
                        <div className="text-xs font-medium mb-1" style={{ color: T.text }}>{anomaly.agentName}</div>
                        <p className="text-[10px]" style={{ color: T.dim }}>{anomaly.description}</p>
                      </div>
                      <div className="text-[9px] font-mono flex-shrink-0" style={{ color: T.muted }}>{new Date(anomaly.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div className="p-2 rounded mt-2" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                      <span className="text-[9px] font-mono" style={{ color: T.accent }}>ACTION:</span>
                      <span className="text-[10px] ml-1.5" style={{ color: T.dim }}>{anomaly.action}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} /> Agent Zero Trust — every identity verified, every credential rotated, every scope enforced, every anomaly detected. No implicit trust.
          </div>
        </>
      )}
    </Layout>
  );
}
