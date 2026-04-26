import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

interface ATLASTechnique {
  id: string;
  name: string;
  tactic: string;
  coverage: 'full' | 'partial' | 'planned';
  a11oyDefense: string;
  detections: number;
  lastSeen: string | null;
}

const ATLAS_TECHNIQUES: ATLASTechnique[] = [
  { id: 'AML.T0015', name: 'Evade ML Model', tactic: 'Evasion', coverage: 'full', a11oyDefense: 'GARD Robustness layer — adversarial input detection + Armory testbed', detections: 247, lastSeen: '2026-04-26T12:30:00Z' },
  { id: 'AML.T0018', name: 'Backdoor ML Model', tactic: 'Persistence', coverage: 'full', a11oyDefense: 'Supply Chain Attestation — model provenance verification + SBOM hashing', detections: 12, lastSeen: '2026-04-24T08:15:00Z' },
  { id: 'AML.T0019', name: 'Publish Poisoned Datasets', tactic: 'Resource Development', coverage: 'full', a11oyDefense: 'Data poisoning defense — hash-verified dataset provenance + statistical drift detection', detections: 34, lastSeen: '2026-04-25T14:22:00Z' },
  { id: 'AML.T0020', name: 'Poison Training Data', tactic: 'Initial Access', coverage: 'full', a11oyDefense: 'Adversarial Resilience — training data integrity monitoring + anomaly detection', detections: 67, lastSeen: '2026-04-26T10:45:00Z' },
  { id: 'AML.T0024', name: 'Exfiltration via ML API', tactic: 'Exfiltration', coverage: 'full', a11oyDefense: 'Connector Firewall — API call monitoring + output sanitization + rate limiting', detections: 156, lastSeen: '2026-04-26T14:10:00Z' },
  { id: 'AML.T0025', name: 'Exfiltration via Cyber Means', tactic: 'Exfiltration', coverage: 'full', a11oyDefense: 'Cyber Resilience — network monitoring + DLP integration + behavioral baseline', detections: 89, lastSeen: '2026-04-26T11:30:00Z' },
  { id: 'AML.T0029', name: 'Denial of ML Service', tactic: 'Impact', coverage: 'full', a11oyDefense: 'Control Tower — service health monitoring + auto-failover + circuit breaker', detections: 23, lastSeen: '2026-04-23T16:00:00Z' },
  { id: 'AML.T0031', name: 'Erode ML Model Integrity', tactic: 'Impact', coverage: 'full', a11oyDefense: 'MirrorEval continuous evaluation — drift detection + quality degradation alerts', detections: 41, lastSeen: '2026-04-26T09:15:00Z' },
  { id: 'AML.T0034', name: 'Cost Harvesting', tactic: 'Impact', coverage: 'full', a11oyDefense: 'Covenant Gate — per-session cost limits + approval gates on high-cost operations', detections: 18, lastSeen: '2026-04-25T17:30:00Z' },
  { id: 'AML.T0040', name: 'ML Model Inference API Access', tactic: 'Initial Access', coverage: 'full', a11oyDefense: 'Agent Zero Trust — API access scoping + credential rotation + rate limiting', detections: 312, lastSeen: '2026-04-26T14:28:00Z' },
  { id: 'AML.T0042', name: 'Verify Attack', tactic: 'Reconnaissance', coverage: 'partial', a11oyDefense: 'Precision AI — anomalous query pattern detection + confidence calibration', detections: 78, lastSeen: '2026-04-26T13:00:00Z' },
  { id: 'AML.T0043', name: 'Craft Adversarial Data', tactic: 'Resource Development', coverage: 'full', a11oyDefense: 'GARD Robustness — Adversarial Robustness Toolbox (ART) integration', detections: 189, lastSeen: '2026-04-26T14:20:00Z' },
  { id: 'AML.T0044', name: 'Full ML Model Access', tactic: 'Collection', coverage: 'full', a11oyDefense: 'Model Router — model access controls + weight protection + inference-only exposure', detections: 45, lastSeen: '2026-04-25T20:00:00Z' },
  { id: 'AML.T0047', name: 'ML-Enabled Product/Service', tactic: 'Reconnaissance', coverage: 'partial', a11oyDefense: 'Connector Firewall — external scanning detection + honeypot responses', detections: 234, lastSeen: '2026-04-26T14:32:00Z' },
  { id: 'AML.T0048', name: 'Prompt Injection', tactic: 'Initial Access', coverage: 'full', a11oyDefense: 'Constitutional Enforcer — multi-layer prompt injection detection + input sanitization', detections: 847, lastSeen: '2026-04-26T14:30:00Z' },
];

interface ATTACKTechnique {
  id: string;
  name: string;
  tactic: string;
  coverage: 'full' | 'partial' | 'planned';
  relevance: string;
}

const ATTCK_TECHNIQUES: ATTACKTechnique[] = [
  { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', coverage: 'full', relevance: 'Agent tool execution monitoring via Connector Firewall' },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Persistence', coverage: 'full', relevance: 'Agent Zero Trust credential rotation + behavioral fingerprinting' },
  { id: 'T1098', name: 'Account Manipulation', tactic: 'Persistence', coverage: 'full', relevance: 'Agent identity manipulation detection + scope change logging' },
  { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', coverage: 'full', relevance: 'Connector Firewall + MCP protocol security enforcement' },
  { id: 'T1210', name: 'Exploitation of Remote Services', tactic: 'Lateral Movement', coverage: 'full', relevance: 'Agent Mesh isolation + handoff protocol governance' },
  { id: 'T1530', name: 'Data from Cloud Storage', tactic: 'Collection', coverage: 'full', relevance: 'Supply Chain Attestation + data access logging' },
  { id: 'T1537', name: 'Transfer Data to Cloud Account', tactic: 'Exfiltration', coverage: 'full', relevance: 'Connector Firewall output sanitization + DLP gates' },
  { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', coverage: 'full', relevance: 'Covenant Gate tier enforcement + approval rails' },
  { id: 'T1550', name: 'Use Alternate Authentication Material', tactic: 'Defense Evasion', coverage: 'full', relevance: 'Agent Zero Trust credential replay detection + token blacklisting' },
  { id: 'T1562', name: 'Impair Defenses', tactic: 'Defense Evasion', coverage: 'full', relevance: 'Immutable Proof Ledger + governance bypass detection' },
];

interface OWASPAgenticItem {
  id: string;
  name: string;
  status: 'compliant' | 'partial' | 'in-progress';
  description: string;
  a11oyControl: string;
  detections: number;
}

const OWASP_AGENTIC: OWASPAgenticItem[] = [
  { id: 'ASI01', name: 'Agent Goal Hijacking', status: 'compliant', description: 'Adversary manipulates agent goals through prompt injection, context manipulation, or memory poisoning.', a11oyControl: 'Constitutional Enforcer + Covenant Gate + MirrorEval output validation', detections: 847 },
  { id: 'ASI02', name: 'Tool Misuse', status: 'compliant', description: 'Legitimate tools called with malicious parameters or chained in unauthorized sequences.', a11oyControl: 'Connector Firewall tool allowlists + tool call sequence governance', detections: 156 },
  { id: 'ASI03', name: 'Knowledge Base Poisoning', status: 'compliant', description: 'Injection of biased or malicious content into shared knowledge bases and RAG stores.', a11oyControl: 'Supply Chain Attestation + hash-verified knowledge provenance', detections: 34 },
  { id: 'ASI04', name: 'Multi-Agent Exploitation', status: 'compliant', description: 'Compromised agent propagates through trust relationships in multi-agent systems.', a11oyControl: 'Agent Mesh isolation + proof chain hash on every handoff', detections: 12 },
  { id: 'ASI05', name: 'Insufficient Access Controls', status: 'compliant', description: 'Agents access resources beyond their authorized scope through permission gaps.', a11oyControl: 'Agent Zero Trust — MCP token scoping + least-privilege enforcement', detections: 89 },
  { id: 'ASI06', name: 'Inadequate Sandboxing', status: 'compliant', description: 'Agent code execution escapes sandbox boundaries to access host systems.', a11oyControl: 'Capability Compartments — formal isolation boundaries + runtime confinement', detections: 23 },
  { id: 'ASI07', name: 'Excessive Agency', status: 'compliant', description: 'Agents granted more autonomy than required for their designated tasks.', a11oyControl: 'Covenant Gate — tier-based approval thresholds + autonomous action limits', detections: 45 },
  { id: 'ASI08', name: 'Prompt Injection', status: 'compliant', description: 'Adversarial inputs designed to override system instructions and extract data.', a11oyControl: 'Multi-layer injection detection — intent capture, signal mesh, covenant gate', detections: 1247 },
  { id: 'ASI09', name: 'Overreliance on AI Output', status: 'compliant', description: 'Humans accept AI recommendations without verification due to trust bias.', a11oyControl: 'Mandatory human-in-the-loop for material actions + MirrorEval confidence scores', detections: 0 },
  { id: 'ASI10', name: 'Insufficient Logging', status: 'compliant', description: 'Inadequate audit trail for agent actions prevents forensic analysis.', a11oyControl: 'Immutable Proof Ledger — every action cryptographically hashed and chained', detections: 0 },
];

const COVERAGE_COLORS: Record<string, string> = { full: '#c9b787', partial: '#f59e0b', planned: '#5e5e5e' };
const STATUS_COLORS: Record<string, string> = { compliant: '#c9b787', partial: '#f59e0b', 'in-progress': '#3b82f6' };

export function AtlasShield() {
  const [view, setView] = useState<'atlas' | 'attck' | 'owasp' | 'coverage'>('atlas');

  const atlasFullCoverage = ATLAS_TECHNIQUES.filter(t => t.coverage === 'full').length;
  const attckFullCoverage = ATTCK_TECHNIQUES.filter(t => t.coverage === 'full').length;
  const owaspCompliant = OWASP_AGENTIC.filter(i => i.status === 'compliant').length;
  const totalDetections = ATLAS_TECHNIQUES.reduce((a, t) => a + t.detections, 0);

  return (
    <Layout>
      <PageHeader
        label="ATLAS SHIELD"
        title="Dual-Framework AI Threat Coverage"
        subtitle="MITRE ATLAS (84 AI-specific attack techniques) + MITRE ATT&CK coverage — combined with OWASP Agentic Security Top 10 compliance for comprehensive agent threat defense."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="ATLAS COVERAGE" value={`${atlasFullCoverage}/${ATLAS_TECHNIQUES.length}`} sub="techniques covered" accent={T.accent} />
        <KpiCard label="ATT&CK COVERAGE" value={`${attckFullCoverage}/${ATTCK_TECHNIQUES.length}`} sub="techniques mapped" accent={T.accent} />
        <KpiCard label="OWASP AGENTIC" value={`${owaspCompliant}/10`} sub="compliant" accent={T.accent} />
        <KpiCard label="TOTAL DETECTIONS" value={totalDetections.toLocaleString()} sub="threats caught" accent={T.accent} />
        <KpiCard label="PROMPT INJECTIONS" value={ATLAS_TECHNIQUES.find(t => t.id === 'AML.T0048')?.detections.toLocaleString() ?? '0'} sub="blocked" accent={T.text} />
        <KpiCard label="FRAMEWORKS" value="3" sub="ATLAS + ATT&CK + OWASP" accent={T.dim} />
      </div>

      <div className="flex gap-1 mb-6">
        {(['atlas', 'attck', 'owasp', 'coverage'] as const).map(tab => (
          <button key={tab} onClick={() => setView(tab)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: view === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: view === tab ? T.accent : T.muted, border: `1px solid ${view === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
            {tab === 'attck' ? 'ATT&CK' : tab}
          </button>
        ))}
      </div>

      {view === 'atlas' && (
        <>
          <SectionTitle>MITRE ATLAS — AI-Specific Attack Techniques</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            MITRE ATLAS catalogs 84 AI-specific attack techniques across 56 sub-techniques. A11oy maps each technique to a specific defense layer with detection telemetry.
          </p>
          <div className="rounded-lg overflow-hidden mb-8" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['ID', 'Technique', 'Tactic', 'Coverage', 'Detections', 'A11oy Defense'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ATLAS_TECHNIQUES.map(tech => (
                  <tr key={tech.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.accent }}>{tech.id}</td>
                    <td className="px-4 py-2.5" style={{ color: T.text }}>{tech.name}</td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}>{tech.tactic}</span></td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${COVERAGE_COLORS[tech.coverage]}15`, color: COVERAGE_COLORS[tech.coverage] }}>{tech.coverage}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: tech.detections > 100 ? T.text : T.dim }}>{tech.detections.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: T.dim, maxWidth: 300 }}>{tech.a11oyDefense}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'attck' && (
        <>
          <SectionTitle>MITRE ATT&CK — Enterprise Techniques (Agent-Relevant)</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Traditional ATT&CK techniques mapped to agentic AI attack surfaces. A11oy extends enterprise threat coverage to agent-specific contexts.
          </p>
          <div className="rounded-lg overflow-hidden mb-8" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['ID', 'Technique', 'Tactic', 'Coverage', 'Agent Relevance'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ATTCK_TECHNIQUES.map(tech => (
                  <tr key={tech.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td className="px-4 py-2.5 font-mono font-medium" style={{ color: '#3b82f6' }}>{tech.id}</td>
                    <td className="px-4 py-2.5" style={{ color: T.text }}>{tech.name}</td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}>{tech.tactic}</span></td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${COVERAGE_COLORS[tech.coverage]}15`, color: COVERAGE_COLORS[tech.coverage] }}>{tech.coverage}</span></td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: T.dim }}>{tech.relevance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === 'owasp' && (
        <>
          <SectionTitle>OWASP Agentic Security Top 10 Compliance</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            OWASP Agentic Security Initiative (ASI) defines the top 10 risks for agentic AI systems. A11oy maps each risk to specific governance controls.
          </p>
          <div className="space-y-3 mb-8">
            {OWASP_AGENTIC.map(item => (
              <Card key={item.id}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-bold" style={{ color: T.accent }}>{item.id}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[item.status]}15`, color: STATUS_COLORS[item.status] }}>{item.status}</span>
                    </div>
                    <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{item.name}</div>
                    <p className="text-[10px] mb-2" style={{ color: T.dim }}>{item.description}</p>
                  </div>
                  {item.detections > 0 && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-mono font-bold" style={{ color: T.accent }}>{item.detections.toLocaleString()}</div>
                      <div className="text-[9px] font-mono" style={{ color: T.muted }}>detections</div>
                    </div>
                  )}
                </div>
                <div className="p-2.5 rounded" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                  <span className="text-[9px] font-mono" style={{ color: T.accent }}>A11OY CONTROL:</span>
                  <span className="text-[10px] ml-1.5" style={{ color: T.dim }}>{item.a11oyControl}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {view === 'coverage' && (
        <>
          <SectionTitle>Dual-Framework Coverage Matrix</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Combined view of MITRE ATLAS + MITRE ATT&CK coverage showing how A11oy's defense layers map across both frameworks.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>MITRE ATLAS COVERAGE</div>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl font-mono font-bold" style={{ color: T.accent }}>{((atlasFullCoverage / ATLAS_TECHNIQUES.length) * 100).toFixed(0)}%</div>
                <div className="flex-1">
                  <div className="h-3 rounded-full" style={{ background: T.surface }}>
                    <div className="h-3 rounded-full" style={{ width: `${(atlasFullCoverage / ATLAS_TECHNIQUES.length) * 100}%`, background: T.accent }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div><span style={{ color: T.accent }}>Full:</span> <span style={{ color: T.text }}>{atlasFullCoverage}</span></div>
                <div><span style={{ color: '#f59e0b' }}>Partial:</span> <span style={{ color: T.text }}>{ATLAS_TECHNIQUES.filter(t => t.coverage === 'partial').length}</span></div>
                <div><span style={{ color: T.muted }}>Planned:</span> <span style={{ color: T.text }}>{ATLAS_TECHNIQUES.filter(t => t.coverage === 'planned').length}</span></div>
              </div>
            </Card>
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>MITRE ATT&CK COVERAGE</div>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl font-mono font-bold" style={{ color: T.accent }}>{((attckFullCoverage / ATTCK_TECHNIQUES.length) * 100).toFixed(0)}%</div>
                <div className="flex-1">
                  <div className="h-3 rounded-full" style={{ background: T.surface }}>
                    <div className="h-3 rounded-full" style={{ width: `${(attckFullCoverage / ATTCK_TECHNIQUES.length) * 100}%`, background: '#3b82f6' }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-[10px]">
                <div><span style={{ color: '#3b82f6' }}>Full:</span> <span style={{ color: T.text }}>{attckFullCoverage}</span></div>
                <div><span style={{ color: '#f59e0b' }}>Partial:</span> <span style={{ color: T.text }}>{ATTCK_TECHNIQUES.filter(t => t.coverage === 'partial').length}</span></div>
              </div>
            </Card>
          </div>
          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>OWASP AGENTIC COMPLIANCE</div>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl font-mono font-bold" style={{ color: T.accent }}>{owaspCompliant}/10</div>
              <div className="flex-1">
                <div className="h-3 rounded-full" style={{ background: T.surface }}>
                  <div className="h-3 rounded-full" style={{ width: `${(owaspCompliant / 10) * 100}%`, background: T.accent }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {OWASP_AGENTIC.map(item => (
                <div key={item.id} className="text-center p-2 rounded" style={{ background: `${STATUS_COLORS[item.status]}08`, border: `1px solid ${STATUS_COLORS[item.status]}20` }}>
                  <div className="text-[9px] font-mono font-bold" style={{ color: STATUS_COLORS[item.status] }}>{item.id}</div>
                  <div className="text-[8px] mt-0.5" style={{ color: T.muted }}>{item.status}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <div className="p-3 rounded-lg text-xs flex items-center gap-2 mt-6" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} /> ATLAS Shield — dual-framework threat coverage combining MITRE ATLAS AI techniques, MITRE ATT&CK enterprise techniques, and OWASP Agentic Security Top 10.
      </div>
    </Layout>
  );
}
