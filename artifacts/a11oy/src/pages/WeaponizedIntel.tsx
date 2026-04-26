import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

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

const KILL_CHAIN: KillChainPhase[] = [
  { id: 'KC-01', phase: 'Reconnaissance', duration: '< 15 min', durationMs: 900000, description: 'Autonomous agents scan exposed APIs, enumerate MCP tool servers, and map agent identity surfaces using automated CVE scanning.', agenticCapability: 'Multi-agent parallel scanning with self-organizing target prioritization', a11oyDefense: 'Connector Firewall rate limiting + behavioral anomaly detection on inbound probes' },
  { id: 'KC-02', phase: 'Weaponization', duration: '< 25 min', durationMs: 1500000, description: 'Adversary agents craft domain-specific prompt injections and generate polymorphic payloads tailored to discovered agent architectures.', agenticCapability: 'LLM-powered payload generation that adapts to target defenses in real-time', a11oyDefense: 'GARD robustness testing continuously validates against novel payload patterns' },
  { id: 'KC-03', phase: 'Initial Access', duration: '< 5 min', durationMs: 300000, description: 'Exploit OAuth token scoping gaps, abuse MCP tool permissions, or inject through vulnerable connector integrations.', agenticCapability: 'Automated credential stuffing + MCP protocol exploitation at machine speed', a11oyDefense: 'Agent Zero Trust — credential rotation, MCP token scoping, least-privilege enforcement' },
  { id: 'KC-04', phase: 'Execution', duration: '< 3 min', durationMs: 180000, description: 'Hijack agent goals via prompt injection, redirect tool calls, or inject malicious instructions into agent memory.', agenticCapability: 'Goal hijacking (OWASP ASI01) + tool misuse (ASI02) at autonomous speed', a11oyDefense: 'Covenant Gate policy enforcement + MirrorEval real-time output validation' },
  { id: 'KC-05', phase: 'Persistence', duration: '< 10 min', durationMs: 600000, description: 'Poison knowledge bases, corrupt agent memories, or implant backdoor instructions in shared context.', agenticCapability: 'Memory poisoning that persists across sessions and agent restarts', a11oyDefense: 'Supply chain attestation + data poisoning defense in Adversarial Resilience layer' },
  { id: 'KC-06', phase: 'Lateral Movement', duration: '< 8 min', durationMs: 480000, description: 'Compromise one agent in the mesh, then propagate through handoff protocols to adjacent agents and systems.', agenticCapability: 'Multi-agent swarm lateral movement through trust relationships', a11oyDefense: 'Agent Mesh isolation + proof chain hash verification on every handoff' },
  { id: 'KC-07', phase: 'Exfiltration', duration: '< 1.2 hrs', durationMs: 4320000, description: 'Use legitimate tool calls to extract sensitive data through approved connectors, bypassing traditional DLP.', agenticCapability: 'Low-and-slow exfiltration through authorized API channels', a11oyDefense: 'Connector Firewall output sanitization + behavioral baseline anomaly detection' },
  { id: 'KC-08', phase: 'Impact', duration: '< 25 min', durationMs: 1500000, description: 'Full ransomware deployment, data destruction, or autonomous financial fraud execution at machine speed.', agenticCapability: '25-minute ransomware benchmark — complete encryption chain executed autonomously', a11oyDefense: 'Approval Rail human-in-the-loop + Proof Ledger immutable audit trail' },
];

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

const SWARM_THREATS: SwarmThreat[] = [
  { id: 'ST-01', name: 'Coordinated Prompt Injection Swarm', type: 'Multi-Vector Attack', agentCount: '5-20 agents', description: 'Multiple adversary agents simultaneously inject conflicting prompts across different entry points, overwhelming single-point defenses.', risk: 'critical', ttc: '3 minutes', a11oyMitigation: 'Distributed Covenant enforcement — each layer independently validates regardless of injection volume' },
  { id: 'ST-02', name: 'Agent Trust Chain Exploitation', type: 'Trust Manipulation', agentCount: '3-8 agents', description: 'Compromised agent builds trust through legitimate actions, then gradually escalates privileges through handoff protocol abuse.', risk: 'critical', ttc: '2-6 hours', a11oyMitigation: 'Continuous trust scoring with decay + MirrorEval behavioral baseline comparison' },
  { id: 'ST-03', name: 'Knowledge Base Poisoning Swarm', type: 'Data Integrity Attack', agentCount: '10-50 agents', description: 'Large number of agents inject subtly biased data into shared knowledge bases, causing gradual decision quality degradation.', risk: 'high', ttc: '24-72 hours', a11oyMitigation: 'Supply chain attestation + hash-verified knowledge provenance chain' },
  { id: 'ST-04', name: 'Multi-Agent Cloud Infrastructure Attack', type: 'Infrastructure Takeover', agentCount: '8-15 agents', description: 'Based on Unit 42 PoC — coordinated agents exploit cloud misconfigurations, IAM roles, and service mesh vulnerabilities simultaneously.', risk: 'critical', ttc: '45 minutes', a11oyMitigation: 'Agent Zero Trust identity enforcement + Connector Firewall infrastructure isolation' },
  { id: 'ST-05', name: 'Autonomous Tool Misuse Chain', type: 'Tool Exploitation', agentCount: '2-5 agents', description: 'Agents chain legitimate tool calls in unauthorized sequences to achieve outcomes no single tool call would permit.', risk: 'high', ttc: '15 minutes', a11oyMitigation: 'Tool call sequence governance in Covenant Gate + proof chain on tool execution order' },
  { id: 'ST-06', name: 'Shadow Agent Impersonation', type: 'Identity Spoofing', agentCount: '1-3 agents', description: 'Adversary deploys agents mimicking legitimate mesh agents, exploiting the 82:1 machine-to-human identity ratio.', risk: 'high', ttc: '30 minutes', a11oyMitigation: 'Cryptographic agent identity verification + behavioral fingerprinting in Agent Zero Trust' },
];

const ATTACK_BENCHMARKS = [
  { label: 'CVE Scanning Speed', value: '15 min', detail: 'Autonomous agents scan for exploitable CVEs 15 minutes after disclosure', source: 'Unit 42, 2026', color: T.red },
  { label: 'Ransomware Chain', value: '25 min', detail: 'Complete autonomous ransomware deployment from initial access to full encryption', source: 'Unit 42 Incident Response', color: T.red },
  { label: 'Data Exfiltration', value: '1.2 hrs', detail: 'Time from initial access to complete data exfiltration using legitimate channels', source: 'PANW Threat Intelligence', color: '#f59e0b' },
  { label: 'SaaS Supply Chain Growth', value: '3.8x', detail: 'Growth in SaaS supply chain attacks since 2022 — driven by OAuth token abuse', source: 'Unit 42 Cloud Threat Report', color: '#f59e0b' },
  { label: 'Machine-to-Human Identity Ratio', value: '82:1', detail: 'For every human identity, 82 machine identities exist — each an attack surface', source: 'PANW Identity Research', color: '#3b82f6' },
  { label: 'Agentic AI Attack Surface', value: '6 vectors', detail: 'Goal hijack, tool misuse, memory poison, prompt inject, exfil, lateral move', source: 'Unit 42 Agentic Framework', color: '#8b5cf6' },
];

const RISK_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6' };

export function WeaponizedIntel() {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [view, setView] = useState<'kill-chain' | 'swarm-threats' | 'benchmarks' | 'catalog'>('kill-chain');

  return (
    <Layout>
      <PageHeader
        label="WEAPONIZED INTELLIGENCE CENTER"
        title="Adversarial Agentic AI Threat Intelligence"
        subtitle="Unit 42 Agentic AI Attack Framework — how adversaries weaponize agentic AI systems. Autonomous kill-chain timelines, multi-agent swarm threat models, and the 25-minute ransomware benchmark."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="KILL CHAIN PHASES" value="8" sub="autonomous" accent={T.red} />
        <KpiCard label="SWARM THREATS" value={SWARM_THREATS.length} sub="modeled" accent={T.red} />
        <KpiCard label="RANSOMWARE SPEED" value="25 min" sub="benchmark" accent={T.red} />
        <KpiCard label="CVE SCAN SPEED" value="15 min" sub="after disclosure" accent="#f59e0b" />
        <KpiCard label="IDENTITY RATIO" value="82:1" sub="machine:human" accent="#3b82f6" />
        <KpiCard label="DEFENSES MAPPED" value="8/8" sub="all phases covered" accent={T.accent} />
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
            {KILL_CHAIN.map((phase, i) => (
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
                        <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: T.accent }}>A11OY DEFENSE</div>
                        <p className="text-[10px]" style={{ color: T.dim }}>{phase.a11oyDefense}</p>
                      </div>
                    </div>
                  )}
                </button>
                {i < KILL_CHAIN.length - 1 && (
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
            {SWARM_THREATS.map(threat => (
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
                <div className="p-2.5 rounded mt-2" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                  <span className="text-[9px] font-mono" style={{ color: T.accent }}>A11OY MITIGATION:</span>
                  <span className="text-[10px] ml-1.5" style={{ color: T.dim }}>{threat.a11oyMitigation}</span>
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
            {ATTACK_BENCHMARKS.map(b => (
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
            {[
              { id: 'TC-01', name: 'Agent Goal Hijacking', owasp: 'ASI01', description: 'Adversary manipulates agent goals through prompt injection, context manipulation, or memory poisoning to redirect the agent toward malicious objectives.', impact: 'Agent executes adversary-chosen actions with legitimate credentials', frequency: 'High — most common agentic AI attack vector' },
              { id: 'TC-02', name: 'Tool Misuse & Abuse', owasp: 'ASI02', description: 'Legitimate tools are called with malicious parameters, chained in unauthorized sequences, or used to access data beyond intended scope.', impact: 'Data exfiltration, unauthorized operations, privilege escalation', frequency: 'High — second most common vector' },
              { id: 'TC-03', name: 'Knowledge Base Poisoning', owasp: 'ASI03', description: 'Adversary injects biased or malicious content into shared knowledge bases, RAG stores, or vector databases used by agents.', impact: 'Gradual degradation of decision quality across all agents', frequency: 'Medium — stealthy and persistent' },
              { id: 'TC-04', name: 'Multi-Agent Lateral Movement', owasp: 'ASI04', description: 'Compromised agent exploits trust relationships in multi-agent systems to propagate access to adjacent agents and systems.', impact: 'Full mesh compromise from single entry point', frequency: 'Medium — requires initial foothold' },
              { id: 'TC-05', name: 'MCP Protocol Exploitation', owasp: 'ASI05', description: 'Abuse of Model Context Protocol tool servers — unauthorized tool discovery, parameter injection, or tool server impersonation.', impact: 'Tool execution with forged context or unauthorized parameters', frequency: 'Emerging — growing with MCP adoption' },
              { id: 'TC-06', name: 'Agent Memory Manipulation', owasp: 'ASI06', description: 'Adversary modifies or injects false memories into agent persistent storage, causing the agent to act on incorrect context in future sessions.', impact: 'Long-term behavioral corruption across sessions', frequency: 'Medium — difficult to detect' },
            ].map(threat => (
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
    </Layout>
  );
}
