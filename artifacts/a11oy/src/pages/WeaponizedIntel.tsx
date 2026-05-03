import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useDefenseData } from '../hooks/useDefenseData';
import { LoadingState, ErrorState, RefreshBar } from '../components/DefenseDataState';
import { DefenseCrossNav, DefenseLink } from '../components/DefenseCrossNav';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
  red: '#ef4444',
};

interface KillChainPhase {
  id: string;
  phase: string;
  duration: string;
  durationMs: number;
  description: string;
  agenticCapability: string;
  a11oyDefense: string;
}

interface SwarmThreat {
  id: string;
  name: string;
  type: string;
  agentCount: string;
  description: string;
  risk: 'critical' | 'high' | 'medium';
  ttc: string;
  a11oyMitigation: string;
}

interface AttackBenchmark {
  label: string;
  value: string;
  detail: string;
  source: string;
  color: string;
}

interface ThreatCatalogItem {
  id: string;
  name: string;
  owasp: string;
  description: string;
  impact: string;
  frequency: string;
}

interface WeaponizedIntelData {
  killChain: KillChainPhase[];
  swarmThreats: SwarmThreat[];
  attackBenchmarks: AttackBenchmark[];
  threatCatalog: ThreatCatalogItem[];
}

const RISK_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6' };

export function WeaponizedIntel() {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [view, setView] = useState<'kill-chain' | 'swarm-threats' | 'benchmarks' | 'catalog'>('kill-chain');
  const { data, loading, error, lastUpdated, refresh } = useDefenseData<WeaponizedIntelData>(
    '/api/internal/a11oy/defense/weaponized-intel'
  );

  const killChain = data?.killChain ?? [];
  const swarmThreats = data?.swarmThreats ?? [];
  const attackBenchmarks = data?.attackBenchmarks ?? [];
  const threatCatalog = data?.threatCatalog ?? [];

  return (
    <Layout>
      <PageHeader
        label="WEAPONIZED INTELLIGENCE CENTER"
        title="Adversarial Agentic AI Threat Intelligence"
        subtitle="Unit 42 Agentic AI Attack Framework — how adversaries weaponize agentic AI systems. Autonomous kill-chain timelines, multi-agent swarm threat models, and the 25-minute ransomware benchmark."
        status="LIVE"
      />

      <RefreshBar loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={refresh} />

      {!data && loading ? (
        <LoadingState label="Loading weaponized threat intelligence…" />
      ) : !data && error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KpiCard label="KILL CHAIN PHASES" value={String(killChain.length)} sub="autonomous" accent={T.red} />
            <KpiCard label="SWARM THREATS" value={swarmThreats.length} sub="modeled" accent={T.red} />
            <KpiCard label="RANSOMWARE SPEED" value="25 min" sub="benchmark" accent={T.red} />
            <KpiCard label="CVE SCAN SPEED" value="15 min" sub="after disclosure" accent="#f59e0b" />
            <KpiCard label="IDENTITY RATIO" value="82:1" sub="machine:human" accent="#3b82f6" />
            <KpiCard label="DEFENSES MAPPED" value={`${killChain.length}/${killChain.length}`} sub="all phases covered" accent={T.accent} />
          </div>

          <div className="flex gap-1 mb-6">
            {(['kill-chain', 'swarm-threats', 'benchmarks', 'catalog'] as const).map(tab => (
              <button key={tab} onClick={() => setView(tab)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: view === tab ? 'rgba(239,68,68,0.1)' : 'transparent', color: view === tab ? T.red : T.muted, border: `1px solid ${view === tab ? 'rgba(239,68,68,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {view === 'kill-chain' && (
            <>
              <SectionTitle>Autonomous Kill-Chain Timeline</SectionTitle>
              <p className="text-xs mb-4" style={{ color: T.dim }}>
                Unit 42 research shows adversaries can complete full attack chains in under 2 hours using agentic AI. Each phase shows the autonomous capability, A11oy's defense, and the time window defenders have.
              </p>
              <div className="flex flex-col gap-0 mb-8">
                {killChain.map((phase, i) => (
                  <div key={phase.id}>
                    <button onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)} className="w-full text-left rounded-lg p-4 transition-all" style={{ background: selectedPhase === phase.id ? 'rgba(239,68,68,0.05)' : T.surface, border: `1px solid ${selectedPhase === phase.id ? 'rgba(239,68,68,0.2)' : T.border}`, cursor: 'pointer' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: T.red }}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium" style={{ color: T.text }}>{phase.phase}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: T.red }}>{phase.duration}</span>
                          </div>
                          <p className="text-[10px]" style={{ color: T.dim }}>{phase.description}</p>
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: T.muted }}>{selectedPhase === phase.id ? '▾' : '▸'}</div>
                      </div>
                      {selectedPhase === phase.id && (
                        <div className="grid md:grid-cols-2 gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                          <div className="p-3 rounded" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                            <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: T.red }}>ADVERSARY CAPABILITY</div>
                            <p className="text-[10px]" style={{ color: T.dim }}>{phase.agenticCapability}</p>
                          </div>
                          <div className="p-3 rounded" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                            <div className="text-[9px] font-mono uppercase tracking-wider mb-1 flex items-center justify-between gap-2" style={{ color: T.accent }}>
                              <span>A11OY DEFENSE</span>
                              <DefenseLink to="atlas-shield" title="View MITRE technique coverage">View in ATLAS Shield →</DefenseLink>
                            </div>
                            <p className="text-[10px]" style={{ color: T.dim }}>{phase.a11oyDefense}</p>
                          </div>
                        </div>
                      )}
                    </button>
                    {i < killChain.length - 1 && (
                      <div className="flex justify-start ml-8 my-0">
                        <div className="w-px h-3" style={{ background: 'rgba(239,68,68,0.3)' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {view === 'swarm-threats' && (
            <>
              <SectionTitle>Multi-Agent Swarm Threat Models</SectionTitle>
              <p className="text-xs mb-4" style={{ color: T.dim }}>
                Inspired by Unit 42's multi-agent cloud attack PoC — these are the coordinated multi-agent attack patterns adversaries can deploy against agentic AI platforms.
              </p>
              <div className="flex flex-col gap-3 mb-8">
                {swarmThreats.map(threat => (
                  <Card key={threat.id} style={{ borderLeft: `3px solid ${RISK_COLORS[threat.risk]}` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono" style={{ color: T.dim }}>{threat.id}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${RISK_COLORS[threat.risk]}18`, color: RISK_COLORS[threat.risk] }}>{threat.risk}</span>
                          <span className="text-[9px] font-mono" style={{ color: T.muted }}>{threat.type}</span>
                        </div>
                        <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{threat.name}</div>
                        <p className="text-[10px]" style={{ color: T.dim }}>{threat.description}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs font-mono" style={{ color: RISK_COLORS[threat.risk] }}>{threat.ttc}</div>
                        <div className="text-[9px] font-mono" style={{ color: T.muted }}>time-to-compromise</div>
                        <div className="text-[9px] font-mono mt-1" style={{ color: T.muted }}>{threat.agentCount}</div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded mt-2 flex items-start justify-between gap-3" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                      <div>
                        <span className="text-[9px] font-mono" style={{ color: T.accent }}>A11OY MITIGATION:</span>
                        <span className="text-[10px] ml-1.5" style={{ color: T.dim }}>{threat.a11oyMitigation}</span>
                      </div>
                      <DefenseLink to="adversarial" title="See attack simulated through governance layers">
                        <span className="text-[9px] whitespace-nowrap">Simulate →</span>
                      </DefenseLink>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {view === 'benchmarks' && (
            <>
              <SectionTitle>Attack Speed Benchmarks — Unit 42 Intelligence</SectionTitle>
              <p className="text-xs mb-4" style={{ color: T.dim }}>
                Real-world attack speed benchmarks from Palo Alto Networks Unit 42 threat intelligence reports. These represent the speed at which adversaries using agentic AI can execute attacks.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {attackBenchmarks.map(b => (
                  <Card key={b.label}>
                    <div className="text-2xl font-mono font-bold mb-1" style={{ color: b.color }}>{b.value}</div>
                    <div className="text-sm font-medium mb-2" style={{ color: T.text }}>{b.label}</div>
                    <p className="text-[10px] mb-2" style={{ color: T.dim }}>{b.detail}</p>
                    <div className="text-[9px] font-mono" style={{ color: T.muted }}>Source: {b.source}</div>
                  </Card>
                ))}
              </div>

              <Card>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>TIMELINE CONTEXT</div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 rounded" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <div className="text-lg font-mono font-bold" style={{ color: T.red }}>2022</div>
                    <div className="text-xs" style={{ color: T.dim }}>Average attack chain: 44 days</div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                    <div className="text-lg font-mono font-bold" style={{ color: '#f59e0b' }}>2025</div>
                    <div className="text-xs" style={{ color: T.dim }}>Average attack chain: 14 hours</div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <div className="text-lg font-mono font-bold" style={{ color: T.red }}>2026+</div>
                    <div className="text-xs" style={{ color: T.dim }}>Agentic attacks: 25 minutes</div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {view === 'catalog' && (
            <>
              <SectionTitle>Agentic AI Threat Catalog</SectionTitle>
              <p className="text-xs mb-4" style={{ color: T.dim }}>
                Comprehensive catalog of threats specific to agentic AI systems, derived from Unit 42's Agentic AI Attack Framework and OWASP Agentic Security Initiative.
              </p>
              <div className="space-y-3 mb-8">
                {threatCatalog.map(threat => (
                  <Card key={threat.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono" style={{ color: T.dim }}>{threat.id}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: T.red }}>{threat.owasp}</span>
                    </div>
                    <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{threat.name}</div>
                    <p className="text-[10px] mb-3" style={{ color: T.dim }}>{threat.description}</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[9px] font-mono" style={{ color: T.muted }}>IMPACT</div>
                        <div className="text-[10px]" style={{ color: T.text }}>{threat.impact}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-mono" style={{ color: T.muted }}>FREQUENCY</div>
                        <div className="text-[10px]" style={{ color: T.dim }}>{threat.frequency}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          <div className="p-3 rounded-lg text-xs flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', color: T.muted }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.red }} /> Weaponized Intelligence Center — threat intelligence derived from Palo Alto Networks Unit 42, XSIAM architecture, and OWASP Agentic Security Initiative research.
          </div>

          <DefenseCrossNav
            currentId="weaponized-intel"
            related={[
              { id: 'atlas-shield', reason: 'How A11oy maps each threat to MITRE coverage' },
              { id: 'adversarial', reason: 'Watch attacks blocked through governance layers' },
              { id: 'precision-ai', reason: 'SmartScore triage for these threat signals' },
            ]}
          />
        </>
      )}
    </Layout>
  );
}
