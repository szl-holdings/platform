import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useDefenseData } from '../hooks/useDefenseData';
import { LoadingState, ErrorState, RefreshBar } from '../components/DefenseDataState';
import { DefenseCrossNav, DefenseLink } from '../components/DefenseCrossNav';

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

interface ATTACKTechnique {
  id: string;
  name: string;
  tactic: string;
  coverage: 'full' | 'partial' | 'planned';
  relevance: string;
}

interface OWASPAgenticItem {
  id: string;
  name: string;
  status: 'compliant' | 'partial' | 'in-progress';
  description: string;
  a11oyControl: string;
  detections: number;
}

interface AtlasShieldData {
  atlasTechniques: ATLASTechnique[];
  attckTechniques: ATTACKTechnique[];
  owaspAgentic: OWASPAgenticItem[];
}

const COVERAGE_COLORS: Record<string, string> = { full: '#c9b787', partial: '#f59e0b', planned: '#5e5e5e' };
const STATUS_COLORS: Record<string, string> = { compliant: '#c9b787', partial: '#f59e0b', 'in-progress': '#3b82f6' };

export function AtlasShield() {
  const [view, setView] = useState<'atlas' | 'attck' | 'owasp' | 'coverage'>('atlas');
  const { data, loading, error, lastUpdated, refresh } = useDefenseData<AtlasShieldData>(
    '/api/internal/a11oy/defense/atlas-shield'
  );

  const atlasTechniques = data?.atlasTechniques ?? [];
  const attckTechniques = data?.attckTechniques ?? [];
  const owaspAgentic = data?.owaspAgentic ?? [];

  const atlasFullCoverage = atlasTechniques.filter(t => t.coverage === 'full').length;
  const attckFullCoverage = attckTechniques.filter(t => t.coverage === 'full').length;
  const owaspCompliant = owaspAgentic.filter(i => i.status === 'compliant').length;
  const totalDetections = atlasTechniques.reduce((a, t) => a + t.detections, 0);

  return (
    <Layout>
      <PageHeader
        label="ATLAS SHIELD"
        title="Dual-Framework AI Threat Coverage"
        subtitle="MITRE ATLAS (84 AI-specific attack techniques) + MITRE ATT&CK coverage — combined with OWASP Agentic Security Top 10 compliance for comprehensive agent threat defense."
        status="LIVE"
      />

      <RefreshBar loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={refresh} />

      {!data && loading ? (
        <LoadingState label="Loading ATLAS coverage matrix…" />
      ) : !data && error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KpiCard label="ATLAS COVERAGE" value={`${atlasFullCoverage}/${atlasTechniques.length}`} sub="techniques covered" accent={T.accent} />
            <KpiCard label="ATT&CK COVERAGE" value={`${attckFullCoverage}/${attckTechniques.length}`} sub="techniques mapped" accent={T.accent} />
            <KpiCard label="OWASP AGENTIC" value={`${owaspCompliant}/10`} sub="compliant" accent={T.accent} />
            <KpiCard label="TOTAL DETECTIONS" value={totalDetections.toLocaleString()} sub="threats caught" accent={T.accent} />
            <KpiCard label="PROMPT INJECTIONS" value={atlasTechniques.find(t => t.id === 'AML.T0048')?.detections.toLocaleString() ?? '0'} sub="blocked" accent={T.text} />
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
                    {atlasTechniques.map(tech => (
                      <tr key={tech.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                        <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.accent }}>{tech.id}</td>
                        <td className="px-4 py-2.5" style={{ color: T.text }}>{tech.name}</td>
                        <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}>{tech.tactic}</span></td>
                        <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${COVERAGE_COLORS[tech.coverage]}15`, color: COVERAGE_COLORS[tech.coverage] }}>{tech.coverage}</span></td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: tech.detections > 100 ? T.text : T.dim }}>{tech.detections.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-[10px]" style={{ color: T.dim, maxWidth: 300 }}>
                          <div>{tech.a11oyDefense}</div>
                          <DefenseLink to="adversarial" title="See this technique blocked in a simulation">
                            <span className="text-[9px] font-mono">Simulate in Adversarial Resilience →</span>
                          </DefenseLink>
                        </td>
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
                    {attckTechniques.map(tech => (
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
                {owaspAgentic.map(item => (
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
                    <div className="p-2.5 rounded flex items-start justify-between gap-3" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                      <div>
                        <span className="text-[9px] font-mono" style={{ color: T.accent }}>A11OY CONTROL:</span>
                        <span className="text-[10px] ml-1.5" style={{ color: T.dim }}>{item.a11oyControl}</span>
                      </div>
                      <DefenseLink to="agent-zero-trust" title="Agent identity & ephemeral credentials">
                        <span className="text-[9px] whitespace-nowrap">Zero Trust →</span>
                      </DefenseLink>
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
                    <div className="text-3xl font-mono font-bold" style={{ color: T.accent }}>{atlasTechniques.length ? ((atlasFullCoverage / atlasTechniques.length) * 100).toFixed(0) : '0'}%</div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full" style={{ background: T.surface }}>
                        <div className="h-3 rounded-full" style={{ width: `${atlasTechniques.length ? (atlasFullCoverage / atlasTechniques.length) * 100 : 0}%`, background: T.accent }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[10px]">
                    <div><span style={{ color: T.accent }}>Full:</span> <span style={{ color: T.text }}>{atlasFullCoverage}</span></div>
                    <div><span style={{ color: '#f59e0b' }}>Partial:</span> <span style={{ color: T.text }}>{atlasTechniques.filter(t => t.coverage === 'partial').length}</span></div>
                    <div><span style={{ color: T.muted }}>Planned:</span> <span style={{ color: T.text }}>{atlasTechniques.filter(t => t.coverage === 'planned').length}</span></div>
                  </div>
                </Card>
                <Card>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>MITRE ATT&CK COVERAGE</div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-3xl font-mono font-bold" style={{ color: T.accent }}>{attckTechniques.length ? ((attckFullCoverage / attckTechniques.length) * 100).toFixed(0) : '0'}%</div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full" style={{ background: T.surface }}>
                        <div className="h-3 rounded-full" style={{ width: `${attckTechniques.length ? (attckFullCoverage / attckTechniques.length) * 100 : 0}%`, background: '#3b82f6' }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[10px]">
                    <div><span style={{ color: '#3b82f6' }}>Full:</span> <span style={{ color: T.text }}>{attckFullCoverage}</span></div>
                    <div><span style={{ color: '#f59e0b' }}>Partial:</span> <span style={{ color: T.text }}>{attckTechniques.filter(t => t.coverage === 'partial').length}</span></div>
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
                  {owaspAgentic.map(item => (
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

          <DefenseCrossNav
            currentId="atlas-shield"
            related={[
              { id: 'weaponized-intel', reason: 'Adversary techniques behind these mappings' },
              { id: 'adversarial', reason: 'Live attack simulations across coverage' },
              { id: 'agent-zero-trust', reason: 'Identity controls for OWASP Agentic Top 10' },
              { id: 'precision-ai', reason: 'Detection telemetry feeding the matrix' },
            ]}
          />
        </>
      )}
    </Layout>
  );
}
