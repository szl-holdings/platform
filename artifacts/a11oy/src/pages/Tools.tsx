import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ActionButton } from '../components/ui';
import { SEED_TOOLS } from '@workspace/a11oy-fabric';

const CATEGORY_COLORS: Record<string, string> = {
  'api-caller': '#8a8a8a', 'document-reader': '#c9b787', 'crm-query': '#c9b787',
  'policy-checker': '#b08d52', 'email-sender': '#8a8a8a', 'slack-notify': '#8a8a8a',
  'pdf-generator': '#c9b787', 'data-analyzer': '#c9b787', 'risk-scorer': '#f5f5f5',
  'approval-gateway': '#8a8a8a', 'evidence-packager': '#b08d52', 'twin-updater': '#8a8a8a',
  'proof-issuer': '#b08d52', 'mirror-eval-runner': '#8a8a8a', 'knowledge-retriever': '#c9b787',
};

const GOVERNANCE_COLORS: Record<string, string> = {
  'external-network': '#f5f5f5', 'secret-access': '#c9b787', 'data-privacy-sensitive': '#8a8a8a',
  'pii-access': '#f5f5f5', 'write-access': '#c9b787', 'approval-required': '#8a8a8a',
  'audit-logged': '#c9b787', 'rate-limited': '#5e5e5e',
};

const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue', 'vessels-maritime': 'Vessels Maritime', 'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense', 'prism-counsel': 'Counsel', 'carlota-jo': 'Carlota Jo',
  'alloy-core': 'Alloy Core', 'global': 'Global',
};

const DEMO_EXECUTIONS = [
  {
    id: 'exec-maritime',
    label: 'Horizon Star — Maritime Risk',
    color: '#8a8a8a',
    timeline: [
      { t: 0, tool: 'vessel_lookup', category: 'api-caller', durationMs: 89, status: 'complete', output: 'IMO 9834521 → Horizon Star, pos: 1.2°N 103.8°E' },
      { t: 89, tool: 'sanctions_check', category: 'policy-checker', durationMs: 45, status: 'complete', output: 'OFAC/EU/UN CLEAR — no matches' },
      { t: 134, tool: 'eta_calc', category: 'data-analyzer', durationMs: 210, status: 'complete', output: 'ETA: 14.2h to Port Klang, confidence 0.94' },
      { t: 344, tool: 'weather_api', category: 'api-caller', durationMs: 340, status: 'complete', output: 'Clear, NE 12kt, sea state 2' },
      { t: 684, tool: 'route_opt', category: 'data-analyzer', durationMs: 1200, status: 'complete', output: '3 routes scored — via Malacca saves 2.1h' },
      { t: 1884, tool: 'fuel_diagnostic', category: 'api-caller', durationMs: 290, status: 'complete', output: 'Fuel -2% baseline — minor deviation flagged' },
      { t: 2174, tool: 'proof_issuer', category: 'proof-issuer', durationMs: 8, status: 'complete', output: 'PCE-0041 issued — sha256:7f3a…e2b1' },
    ],
  },
  {
    id: 'exec-legal',
    label: 'Talbot — Legal Escalation',
    color: '#c9b787',
    timeline: [
      { t: 0, tool: 'matter_lookup', category: 'document-reader', durationMs: 60, status: 'complete', output: 'Talbot v. Meridian — 18 docket entries, 48h deadline' },
      { t: 60, tool: 'docket_sync', category: 'api-caller', durationMs: 80, status: 'complete', output: 'Court calendar synced — no extension filed' },
      { t: 140, tool: 'counsel_pattern', category: 'knowledge-retriever', durationMs: 140, status: 'complete', output: 'Opposing: 3/5 cases filed late — pattern flagged' },
      { t: 280, tool: 'precedent_search', category: 'knowledge-retriever', durationMs: 480, status: 'complete', output: '7 precedents found — 4 strong matches' },
      { t: 760, tool: 'motion_draft', category: 'document-reader', durationMs: 1800, status: 'complete', output: 'Motion to compel drafted — 12 pages, 4 citations' },
      { t: 2560, tool: 'slack_notify', category: 'slack-notify', durationMs: 40, status: 'complete', output: 'Managing partner alerted via Slack' },
      { t: 2600, tool: 'proof_issuer', category: 'proof-issuer', durationMs: 6, status: 'complete', output: 'PCE-0042 issued — sha256:9d12…7b4e' },
    ],
  },
  {
    id: 'exec-cyber',
    label: 'TG-Ember — Cyber Incident',
    color: '#f5f5f5',
    timeline: [
      { t: 0, tool: 'ioc_match', category: 'risk-scorer', durationMs: 35, status: 'complete', output: 'TG-Ember C2 fingerprint confirmed on 8080' },
      { t: 35, tool: 'host_isolation', category: 'api-caller', durationMs: 890, status: 'complete', output: '3 hosts isolated — EDR confirmed' },
      { t: 35, tool: 'yara_deploy', category: 'api-caller', durationMs: 340, status: 'complete', output: 'YARA rules pushed to 248 endpoints' },
      { t: 35, tool: 'ioc_block', category: 'policy-checker', durationMs: 120, status: 'complete', output: 'C2 IPs blocked at perimeter + DNS IOC updated' },
      { t: 925, tool: 'forensic_snapshot', category: 'evidence-packager', durationMs: 2100, status: 'complete', output: 'Memory + disk snapshots captured — 4.2GB' },
      { t: 925, tool: 'ciso_notify', category: 'email-sender', durationMs: 20, status: 'complete', output: 'CISO alerted: TG-Ember confirmed, 3 hosts isolated' },
      { t: 3025, tool: 'proof_issuer', category: 'proof-issuer', durationMs: 5, status: 'complete', output: 'PCE-0043 issued — sha256:2c91…f4a8' },
    ],
  },
  {
    id: 'exec-revenue',
    label: 'Pipeline — Revenue Recovery',
    color: '#b08d52',
    timeline: [
      { t: 0, tool: 'crm_pull', category: 'crm-query', durationMs: 280, status: 'complete', output: 'Q2 pipeline: 247 deals, $18.4M, 14.1 velocity' },
      { t: 280, tool: 'stage_analysis', category: 'data-analyzer', durationMs: 640, status: 'complete', output: 'Drop at Proposal→Negotiation: -34% conversion' },
      { t: 280, tool: 'call_sentiment', category: 'data-analyzer', durationMs: 1100, status: 'complete', output: 'Competitor mentions +38%, objection rate +22%' },
      { t: 280, tool: 'churn_risk', category: 'risk-scorer', durationMs: 420, status: 'complete', output: '5 accounts at churn risk — ML score >0.7' },
      { t: 1380, tool: 'intervention_model', category: 'data-analyzer', durationMs: 1800, status: 'complete', output: 'Coaching ranked #1 — +18% win rate estimate' },
      { t: 1380, tool: 'forecast_adj', category: 'data-analyzer', durationMs: 180, status: 'complete', output: 'Q2 forecast adjusted: -$2.1M (−11.4%)' },
      { t: 3180, tool: 'proof_issuer', category: 'proof-issuer', durationMs: 7, status: 'complete', output: 'PCE-0044 issued — sha256:4e87…1c3d' },
    ],
  },
];

const CATEGORIES = Array.from(new Set(SEED_TOOLS.map(t => t.category)));

export function Tools() {
  const [activeTab, setActiveTab] = useState<'registry' | 'orchestration'>('registry');
  const [filterCat, setFilterCat] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedExec, setSelectedExec] = useState(DEMO_EXECUTIONS[0].id);
  const [execStep, setExecStep] = useState(-1);
  const [execRunning, setExecRunning] = useState(false);

  const filtered = SEED_TOOLS.filter(t =>
    (filterCat === 'all' || t.category === filterCat) &&
    (filterVertical === 'all' || t.vertical === filterVertical)
  );

  const hasApprovalRequired = SEED_TOOLS.filter(t => t.governanceFlags.includes('approval-required'));
  const globalTools = SEED_TOOLS.filter(t => t.vertical === 'global');
  const verticals = Array.from(new Set(SEED_TOOLS.map(t => t.vertical)));
  const selectedTool = selected ? SEED_TOOLS.find(t => t.id === selected) : null;

  const exec = DEMO_EXECUTIONS.find(e => e.id === selectedExec)!;
  const totalExecTime = Math.max(...exec.timeline.map(t => t.t + t.durationMs));

  function runExec() {
    setExecStep(-1);
    setExecRunning(true);
    let i = 0;
    const tick = setInterval(() => {
      setExecStep(i);
      i++;
      if (i >= exec.timeline.length) {
        clearInterval(tick);
        setExecRunning(false);
      }
    }, 500);
  }

  return (
    <Layout>
      <PageHeader
        label="TOOL REGISTRY"
        title="Operator Tool Registry"
        subtitle="Discrete, composable tools available to A11oy operators. Each tool has a defined input schema, output schema, and governance flags."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL TOOLS" value={SEED_TOOLS.length} sub="registered" accent="#c9b787" />
        <KpiCard label="GLOBAL TOOLS" value={globalTools.length} sub="all verticals" accent="#c9b787" />
        <KpiCard label="APPROVAL REQUIRED" value={hasApprovalRequired.length} sub="governance gated" accent="#8a8a8a" />
        <KpiCard label="CATEGORIES" value={CATEGORIES.length} sub="distinct types" accent="#b08d52" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['registry', 'orchestration'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all"
            style={{
              background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent',
              color: activeTab === tab ? '#c9b787' : '#5e5e5e',
              border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {tab === 'orchestration' ? 'Live Orchestration' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'registry' && (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setFilterCat('all')} className="text-xs px-2.5 py-1 rounded font-mono" style={{ backgroundColor: filterCat === 'all' ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)', color: filterCat === 'all' ? '#c9b787' : 'var(--color-a11oy-text-ghost)', border: filterCat === 'all' ? '1px solid rgba(201,183,135,0.3)' : '1px solid transparent', cursor: 'pointer' }}>
                All categories
              </button>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setFilterCat(c)} className="text-xs px-2.5 py-1 rounded font-mono" style={{ backgroundColor: filterCat === c ? `${CATEGORY_COLORS[c] ?? '#c9b787'}20` : 'var(--color-a11oy-muted)', color: filterCat === c ? CATEGORY_COLORS[c] ?? '#c9b787' : 'var(--color-a11oy-text-ghost)', border: 'none', cursor: 'pointer' }}>
                  {c}
                </button>
              ))}
            </div>
            <select value={filterVertical} onChange={e => setFilterVertical(e.target.value)} className="text-xs rounded px-2 py-1 border" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}>
              <option value="all">All verticals</option>
              {verticals.map(v => <option key={v} value={v}>{VERTICAL_LABELS[v] ?? v}</option>)}
            </select>
            <span className="text-xs self-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{filtered.length} tools</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3 content-start">
              {filtered.map(t => {
                const catColor = CATEGORY_COLORS[t.category] ?? '#5e5e5e';
                const isSelected = t.id === selected;
                return (
                  <Card key={t.id} className="cursor-pointer transition-all" onClick={() => setSelected(isSelected ? null : t.id)} style={{ borderColor: isSelected ? '#c9b787' : 'var(--color-a11oy-border)', backgroundColor: isSelected ? 'rgba(201,183,135,0.04)' : undefined } as React.CSSProperties}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{t.name}</div>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${catColor}18`, color: catColor }}>{t.category}</span>
                      </div>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{VERTICAL_LABELS[t.vertical] ?? t.vertical}</span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{t.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {t.governanceFlags.slice(0, 3).map(flag => (
                        <span key={flag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${GOVERNANCE_COLORS[flag] ?? '#5e5e5e'}18`, color: GOVERNANCE_COLORS[flag] ?? '#5e5e5e' }}>{flag}</span>
                      ))}
                    </div>
                  </Card>
                );
              })}
              {filtered.length === 0 && <div className="col-span-2 py-12 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No tools match the current filters.</div>}
            </div>

            <div className="flex flex-col gap-4">
              {selectedTool ? (
                <Card>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TOOL DETAIL</div>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{selectedTool.name}</div>
                  <div className="text-xs mb-3 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{selectedTool.id}</div>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedTool.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div><div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CATEGORY</div><div style={{ color: CATEGORY_COLORS[selectedTool.category] ?? '#5e5e5e' }}>{selectedTool.category}</div></div>
                    <div><div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>VERTICAL</div><div style={{ color: 'var(--color-a11oy-text-sub)' }}>{VERTICAL_LABELS[selectedTool.vertical] ?? selectedTool.vertical}</div></div>
                    <div className="col-span-2"><div className="font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>GOVERNANCE FLAGS</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedTool.governanceFlags.map(flag => (
                          <span key={flag} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${GOVERNANCE_COLORS[flag] ?? '#5e5e5e'}18`, color: GOVERNANCE_COLORS[flag] ?? '#5e5e5e', border: `1px solid ${GOVERNANCE_COLORS[flag] ?? '#5e5e5e'}30` }}>{flag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>CATEGORY BREAKDOWN</div>
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.map(cat => {
                      const count = SEED_TOOLS.filter(t => t.category === cat).length;
                      const color = CATEGORY_COLORS[cat] ?? '#5e5e5e';
                      return (
                        <div key={cat} className="flex items-center justify-between text-xs">
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{cat}</span>
                          <span className="font-mono" style={{ color }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
              <div>
                <SectionTitle>By Vertical</SectionTitle>
                <div className="flex flex-col gap-2">
                  {verticals.map(vertical => {
                    const tools = SEED_TOOLS.filter(t => t.vertical === vertical);
                    const flagged = tools.filter(t => t.governanceFlags.length > 0).length;
                    return (
                      <Card key={vertical} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{VERTICAL_LABELS[vertical] ?? vertical}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono" style={{ color: '#8a8a8a' }}>{flagged} gated</span>
                            <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{tools.length} total</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'orchestration' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {DEMO_EXECUTIONS.map(e => (
              <button key={e.id} onClick={() => { setSelectedExec(e.id); setExecStep(-1); setExecRunning(false); }} className="px-4 py-2 rounded-lg text-xs font-mono transition-all" style={{ background: selectedExec === e.id ? `${e.color}18` : 'rgba(255,255,255,0.025)', border: `1px solid ${selectedExec === e.id ? e.color + '40' : 'rgba(255,255,255,0.08)'}`, color: selectedExec === e.id ? e.color : '#5e5e5e', cursor: 'pointer' }}>
                {e.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 p-3 rounded-lg text-xs" style={{ background: `${exec.color}08`, border: `1px solid ${exec.color}20` }}>
              <span style={{ color: exec.color }}>{exec.label}</span>
              <span className="ml-3 font-mono" style={{ color: '#5e5e5e' }}>total: {totalExecTime}ms</span>
              <span className="ml-3 font-mono" style={{ color: '#5e5e5e' }}>{exec.timeline.length} tool calls</span>
            </div>
            <ActionButton variant="primary" size="sm" onClick={runExec} disabled={execRunning}>
              {execRunning ? '⟳ Executing…' : execStep >= 0 ? '↺ Replay' : '▶ Run Execution'}
            </ActionButton>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#5e5e5e' }}>Tool Orchestration Timeline</span>
              {execStep >= 0 && (
                <span className="text-[9px] font-mono" style={{ color: exec.color }}>
                  {exec.timeline.slice(0, execStep + 1).length} of {exec.timeline.length} tools activated
                </span>
              )}
            </div>

            {/* Timeline visualization */}
            <div className="p-4">
              {/* Gantt-style timeline */}
              <div className="mb-4 relative" style={{ height: exec.timeline.length * 28 + 16 }}>
                {exec.timeline.map((item, i) => {
                  const isActive = execStep === i;
                  const isDone = execStep > i;
                  const catColor = CATEGORY_COLORS[item.category] ?? '#5e5e5e';
                  const leftPct = (item.t / totalExecTime) * 100;
                  const widthPct = Math.max(0.5, (item.durationMs / totalExecTime) * 100);
                  return (
                    <div key={i} className="absolute flex items-center gap-2" style={{ top: i * 28, left: 0, right: 0, height: 24 }}>
                      <div className="w-32 flex-shrink-0 text-[9px] font-mono truncate text-right" style={{ color: (isActive || isDone) ? catColor : '#3e3e3e' }}>
                        {item.tool}
                      </div>
                      <div className="flex-1 relative h-4" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                        {(isActive || isDone) && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPct}%` }}
                            style={{
                              position: 'absolute',
                              left: `${leftPct}%`,
                              height: '100%',
                              background: isActive ? catColor : `${catColor}60`,
                              borderRadius: 2,
                            }}
                          />
                        )}
                      </div>
                      <div className="w-12 flex-shrink-0 text-[9px] font-mono" style={{ color: (isActive || isDone) ? '#5e5e5e' : '#2e2e2e' }}>
                        {item.durationMs}ms
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step-by-step list */}
              <div className="flex flex-col gap-1.5 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {exec.timeline.map((item, i) => {
                  const isActive = execStep === i;
                  const isDone = execStep > i;
                  const catColor = CATEGORY_COLORS[item.category] ?? '#5e5e5e';
                  return (
                    <motion.div
                      key={i}
                      className="flex items-start gap-3 p-2.5 rounded-lg"
                      style={{
                        background: isActive ? `${catColor}10` : 'transparent',
                        border: `1px solid ${isActive ? catColor + '30' : 'transparent'}`,
                        opacity: execStep >= 0 && !isActive && !isDone ? 0.3 : 1,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono flex-shrink-0" style={{ background: (isActive || isDone) ? `${catColor}18` : 'rgba(255,255,255,0.04)', color: (isActive || isDone) ? catColor : '#3e3e3e', border: `1px solid ${(isActive || isDone) ? catColor + '40' : 'rgba(255,255,255,0.06)'}` }}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-medium" style={{ color: (isActive || isDone) ? catColor : '#3e3e3e' }}>{item.tool}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: `${catColor}15`, color: catColor }}>{item.category}</span>
                        </div>
                        <AnimatePresence>
                          {(isActive || isDone) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] mt-0.5" style={{ color: '#5e5e5e' }}>
                              {item.output}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="text-[9px] font-mono flex-shrink-0" style={{ color: (isActive || isDone) ? '#5e5e5e' : '#2e2e2e' }}>{item.durationMs}ms</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
