import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar, ActionButton } from '../components/ui';

const MEMORY_STORES = [
  { id: 'stm', name: 'Short-Term Memory', description: 'Active workcell context. Cleared after workcell completion or timeout (4h).', capacity: 512, used: 84, unit: 'KB', retention: '4 hours', operators: ['Cascade Navigator', 'Pipeline Oracle'], color: '#c9b787' },
  { id: 'ltm', name: 'Long-Term Memory', description: 'Persisted operator memory across workcell sessions. Stored in vector DB.', capacity: 10240, used: 1200, unit: 'KB', retention: 'indefinite', operators: ['All operators'], color: '#c9b787' },
  { id: 'cache', name: 'Proof Cache', description: 'Cached proof hashes for fast verification. Periodically synced with Proof Ledger.', capacity: 1024, used: 342, unit: 'KB', retention: '7 days', operators: ['Fabric Watchdog'], color: '#8a8a8a' },
  { id: 'context', name: 'Context Packs', description: 'Enriched context bundles assembled by Context Engine for active workcells.', capacity: 5120, used: 890, unit: 'KB', retention: 'per-workcell', operators: ['Context Engine'], color: '#c9b787' },
];

const MEMORY_ENTRIES = [
  { id: 'mem-001', kind: 'operational', key: 'mv_cascade_delay_pattern', value: 'ETA deviation >30h triggers port standby recommendation. Historical success rate: 88%.', operator: 'Cascade Navigator', ts: '2026-04-25T04:00:00Z', ttl: '4h' },
  { id: 'mem-002', kind: 'domain', key: 'talbot_matter_history', value: 'Opposing counsel has filed late 3 of last 5 cases. Flagged for early escalation pattern.', operator: 'Counsel Sentinel', ts: '2026-04-25T02:30:00Z', ttl: 'indefinite' },
  { id: 'mem-003', kind: 'domain', key: 'q2_pipeline_baseline', value: 'Q2 baseline velocity: 18.2 deals/week. Current: 14.1. Drop of 22.5%.', operator: 'Pipeline Oracle', ts: '2026-04-25T01:00:00Z', ttl: 'indefinite' },
  { id: 'mem-004', kind: 'threat', key: 'tg_ember_fingerprint', value: 'TG-Ember: C2 pattern on 443/8080, exfil via DNS-over-HTTPS. YARA rules active.', operator: 'Guardian', ts: '2026-04-24T18:00:00Z', ttl: 'indefinite' },
  { id: 'mem-005', kind: 'operational', key: 'proof_chain_last_verified', value: 'Chain tail: sha256:f1c6b3a8…. Last verified: 2026-04-25T04:40:00Z. 5 entries, 0 tampering.', operator: 'Fabric Watchdog', ts: '2026-04-25T04:40:00Z', ttl: '1h' },
  { id: 'mem-006', kind: 'domain', key: 'plano_cap_rate_trend', value: 'Cap rate +18bps over 30d. At 6.2%. Historical reversal threshold: 6.5%.', operator: 'Terra Analyst', ts: '2026-04-24T22:00:00Z', ttl: 'indefinite' },
  { id: 'mem-007', kind: 'system', key: 'mirror_eval_baseline', value: 'Global MirrorEval pass rate: 94.2%. Maritime domain: 96.1%, Legal: 97.4%, Defense: 91.8%.', operator: 'Fabric Watchdog', ts: '2026-04-25T03:00:00Z', ttl: '24h' },
  { id: 'mem-008', kind: 'domain', key: 'carlota_client_patterns', value: '3 clients pending follow-up from last advisory deck review cycle. Average follow-up delay: 4.2 days.', operator: 'Carlota Jo Advisor', ts: '2026-04-24T16:00:00Z', ttl: 'indefinite' },
];

const KIND_COLORS: Record<string, string> = {
  operational: '#c9b787', domain: '#c9b787', threat: '#f5f5f5', system: '#8a8a8a',
};

const DEMO_WORKCELLS = [
  { id: 'WC-0041', label: 'Horizon Star — Maritime Risk', domain: 'maritime', color: '#8a8a8a' },
  { id: 'WC-0042', label: 'Talbot — Legal Escalation', domain: 'legal', color: '#c9b787' },
  { id: 'WC-0043', label: 'TG-Ember — Cyber Incident', domain: 'cyber', color: '#f5f5f5' },
];

const RETRIEVAL_TRACES: Record<string, Array<{ step: string; source: string; size: string; content: string; latency: string; }>> = {
  'WC-0041': [
    { step: 'Query STM', source: 'Short-Term Memory', size: '12 KB', content: 'Active context: Horizon Star charter party terms, last 4 AIS pings, voyage plan', latency: '3ms' },
    { step: 'Query LTM', source: 'Long-Term Memory', size: '48 KB', content: 'Historical ETA deviations for Cascade Navigator (88 records), Port Klang capacity data (12mo)', latency: '28ms' },
    { step: 'Retrieve domain schema', source: 'Context Engine', size: '8 KB', content: 'Maritime domain schema v2.3 — vessel entity types, port codes, sanctions lists', latency: '5ms' },
    { step: 'Inject operator instructions', source: 'Operator Profile', size: '2 KB', content: 'Cascade Navigator: "Always include fuel cost delta in port recommendations"', latency: '1ms' },
    { step: 'Fetch sanctions cache', source: 'Proof Cache', size: '4 KB', content: 'OFAC/EU/UN screens cached for Horizon Star — last verified 2h ago', latency: '4ms' },
    { step: 'Assemble context pack', source: 'Context Engine', size: '74 KB', content: 'Final context pack: 6 sources merged, deduped, ranked by recency × relevance', latency: '12ms' },
    { step: 'Pack delivered to workcell', source: 'Workcell Engine', size: '74 KB', content: 'Context pack bound to WC-0041 — ready for Cascade Navigator invocation', latency: '2ms' },
  ],
  'WC-0042': [
    { step: 'Query STM', source: 'Short-Term Memory', size: '8 KB', content: 'Active context: Talbot matter metadata, upcoming deadline, assigned attorney', latency: '2ms' },
    { step: 'Query LTM', source: 'Long-Term Memory', size: '64 KB', content: 'Talbot full case history: 18 docket entries, 5 filings, opposing counsel track record', latency: '31ms' },
    { step: 'Retrieve domain schema', source: 'Context Engine', size: '6 KB', content: 'Legal domain schema v1.8 — matter types, deadline rules, motion templates', latency: '4ms' },
    { step: 'Inject operator instructions', source: 'Operator Profile', size: '3 KB', content: 'Counsel Sentinel: "Flag opposing late pattern, cite minimum 3 precedents in motions"', latency: '1ms' },
    { step: 'Load docket feed cache', source: 'Proof Cache', size: '2 KB', content: 'Court calendar sync cached — Talbot deadlines confirmed current as of 4h ago', latency: '3ms' },
    { step: 'Assemble context pack', source: 'Context Engine', size: '83 KB', content: 'Final context pack: 5 sources merged, deadline proximity boost applied to ranking', latency: '14ms' },
    { step: 'Pack delivered to workcell', source: 'Workcell Engine', size: '83 KB', content: 'Context pack bound to WC-0042 — ready for Counsel Sentinel invocation', latency: '2ms' },
  ],
  'WC-0043': [
    { step: 'Query STM', source: 'Short-Term Memory', size: '6 KB', content: 'Active context: SIEM alert #4821, initial IOC match, affected host list', latency: '2ms' },
    { step: 'Query LTM', source: 'Long-Term Memory', size: '92 KB', content: 'TG-Ember threat intelligence: 24 prior incidents, TTPs, C2 infrastructure, YARA rules', latency: '38ms' },
    { step: 'Retrieve domain schema', source: 'Context Engine', size: '10 KB', content: 'Cyber domain schema v3.1 — STIX/TAXII entity types, MITRE ATT&CK mappings', latency: '6ms' },
    { step: 'Inject operator instructions', source: 'Operator Profile', size: '2 KB', content: 'Guardian: "Auto-isolate at IOC confidence >0.90 for known APTs. Always notify CISO."', latency: '1ms' },
    { step: 'Fetch threat intel cache', source: 'Proof Cache', size: '18 KB', content: 'IOC hashes cached from ISAC feed — TG-Ember C2 list updated 6h ago', latency: '5ms' },
    { step: 'Assemble context pack', source: 'Context Engine', size: '128 KB', content: 'Final context pack: 5 sources merged — threat intel ranked highest by severity', latency: '18ms' },
    { step: 'Pack delivered to workcell', source: 'Workcell Engine', size: '128 KB', content: 'Context pack bound to WC-0043 — ready for Guardian invocation', latency: '2ms' },
  ],
};

function fmt(ts: string) {
  try {
    const d = new Date(ts);
    const diffH = Math.round((Date.now() - d.getTime()) / 3_600_000);
    if (diffH < 1) return '<1h ago';
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  } catch { return ts; }
}

export function Memory() {
  const [activeTab, setActiveTab] = useState<'stores' | 'entries' | 'trace'>('stores');
  const [selectedWorkcell, setSelectedWorkcell] = useState<string>(DEMO_WORKCELLS[0].id);
  const [traceStep, setTraceStep] = useState(-1);
  const [traceRunning, setTraceRunning] = useState(false);

  const totalUsed = MEMORY_STORES.reduce((acc, m) => acc + m.used, 0);
  const totalCap = MEMORY_STORES.reduce((acc, m) => acc + m.capacity, 0);

  const wc = DEMO_WORKCELLS.find(w => w.id === selectedWorkcell)!;
  const traceSteps = RETRIEVAL_TRACES[selectedWorkcell] ?? [];

  function runTrace() {
    setTraceStep(-1);
    setTraceRunning(true);
    let i = 0;
    const tick = setInterval(() => {
      setTraceStep(i);
      i++;
      if (i >= traceSteps.length) {
        clearInterval(tick);
        setTraceRunning(false);
      }
    }, 600);
  }

  return (
    <Layout>
      <PageHeader
        label="OPERATOR MEMORY"
        title="Memory & Context Stores"
        subtitle="Short-term operational context, long-term domain knowledge, proof cache, and context packs — all scoped by operator and workcell."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="TOTAL CAPACITY" value={`${(totalCap / 1024).toFixed(1)} MB`} sub="across all stores" accent="#c9b787" />
        <KpiCard label="USED" value={`${(totalUsed / 1024).toFixed(1)} MB`} sub={`${Math.round((totalUsed / totalCap) * 100)}% utilization`} accent="#c9b787" />
        <KpiCard label="MEMORY ENTRIES" value={MEMORY_ENTRIES.length} sub="in demo session" accent="#c9b787" />
        <KpiCard label="ACTIVE OPERATORS" value={6} sub="with memory context" accent="#8a8a8a" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['stores', 'entries', 'trace'] as const).map(tab => (
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
            {tab === 'trace' ? 'Retrieval Trace' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'stores' && (
        <>
          <SectionTitle>Memory Stores</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEMORY_STORES.map(store => {
              const pct = Math.round((store.used / store.capacity) * 100);
              return (
                <Card key={store.id}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-semibold text-sm" style={{ color: store.color }}>{store.name}</div>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{pct}%</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{store.description}</p>
                  <ProgressBar value={store.used} max={store.capacity} color={store.color} />
                  <div className="mt-2 text-xs flex items-center justify-between">
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{store.used} / {store.capacity} {store.unit}</span>
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>TTL: {store.retention}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {store.operators.map(o => (
                      <span key={o} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{o}</span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'entries' && (
        <>
          <SectionTitle>Memory Entries ({MEMORY_ENTRIES.length})</SectionTitle>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Kind', 'Key', 'Value', 'Operator', 'Stored', 'TTL'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEMORY_ENTRIES.map((e, i) => (
                  <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                    <td className="px-3 py-2">
                      <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${KIND_COLORS[e.kind] ?? '#5e5e5e'}18`, color: KIND_COLORS[e.kind] ?? '#5e5e5e' }}>{e.kind}</span>
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color: '#b08d52', maxWidth: 120 }}><div className="truncate">{e.key}</div></td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text-sub)', maxWidth: 280 }}><div className="truncate">{e.value}</div></td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text-ghost)', whiteSpace: 'nowrap' }}>{e.operator}</td>
                    <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(e.ts)}</td>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.ttl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs p-3 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
            Memory entries are scoped per operator and workcell. No cross-operator memory sharing without explicit Covenant Layer permission. All memory access is logged to the Proof Ledger.
          </div>
        </>
      )}

      {activeTab === 'trace' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {DEMO_WORKCELLS.map(w => (
              <button
                key={w.id}
                onClick={() => { setSelectedWorkcell(w.id); setTraceStep(-1); setTraceRunning(false); }}
                className="px-4 py-2 rounded-lg text-xs font-mono transition-all"
                style={{
                  background: selectedWorkcell === w.id ? `${w.color}18` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${selectedWorkcell === w.id ? w.color + '40' : 'rgba(255,255,255,0.08)'}`,
                  color: selectedWorkcell === w.id ? w.color : '#5e5e5e',
                  cursor: 'pointer',
                }}
              >
                {w.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 p-3 rounded-lg text-xs" style={{ background: `${wc.color}08`, border: `1px solid ${wc.color}20` }}>
              <span style={{ color: wc.color }}>Workcell: {wc.id}</span>
              <span className="ml-3" style={{ color: '#5e5e5e' }}>{wc.domain} domain</span>
            </div>
            <ActionButton variant="primary" size="sm" onClick={runTrace} disabled={traceRunning}>
              {traceRunning ? '⟳ Assembling…' : traceStep >= 0 ? '↺ Re-trace' : '▶ Run Retrieval Trace'}
            </ActionButton>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#5e5e5e' }}>Context Assembly Trace — {traceSteps.length} steps</span>
              {traceStep >= 0 && (
                <span className="text-[9px] font-mono" style={{ color: '#c9b787' }}>
                  {traceSteps.slice(0, traceStep + 1).reduce((a, s) => a + parseInt(s.size), 0)} KB assembled
                </span>
              )}
            </div>
            <div className="p-4 flex flex-col gap-2">
              {traceSteps.map((step, i) => {
                const isActive = traceStep === i;
                const isDone = traceStep > i;
                return (
                  <div key={i}>
                    <motion.div
                      className="rounded-lg p-3"
                      style={{
                        background: isActive ? `${wc.color}12` : isDone ? 'rgba(255,255,255,0.02)' : 'transparent',
                        border: `1px solid ${isActive ? wc.color + '40' : isDone ? 'rgba(255,255,255,0.06)' : 'transparent'}`,
                        opacity: traceStep >= 0 && !isActive && !isDone ? 0.35 : 1,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                          style={{
                            background: (isActive || isDone) ? `${wc.color}20` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${(isActive || isDone) ? wc.color + '50' : 'rgba(255,255,255,0.08)'}`,
                            color: (isActive || isDone) ? wc.color : '#5e5e5e',
                          }}
                        >
                          {isDone ? '✓' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-medium" style={{ color: (isActive || isDone) ? '#f5f5f5' : '#5e5e5e' }}>{step.step}</span>
                            <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: '#5e5e5e' }}>{step.source}</span>
                          </div>
                          <AnimatePresence>
                            {(isActive || isDone) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-[10px] mt-1"
                                style={{ color: '#8a8a8a' }}
                              >
                                {step.content}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {(isActive || isDone) && (
                          <div className="text-right flex-shrink-0 text-[9px]">
                            <div className="font-mono" style={{ color: wc.color }}>{step.size}</div>
                            <div style={{ color: '#5e5e5e' }}>{step.latency}</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                    {i < traceSteps.length - 1 && (
                      <div className="flex justify-start ml-3 my-0.5">
                        <div className="w-px h-2" style={{ background: isDone ? `${wc.color}30` : 'rgba(255,255,255,0.06)' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
