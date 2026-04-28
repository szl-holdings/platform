import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar, ActionButton } from '../components/ui';

const GOLD = '#c9b787';

const SESSION_MEMORIES = [
  { id: 'sm-001', key: 'mv_cascade_active_context', value: 'Active voyage: ETA deviation 18h, port standby recommended, demurrage exposure $42K', operator: 'Cascade Navigator', workcell: 'WC-0041', ts: '2026-04-25T04:00:00Z', ttl: '4h', accessCount: 12, provenanceHash: 'sha256:sm01a1', decayScore: 0.92, reinforcementScore: 0.88 },
  { id: 'sm-002', key: 'talbot_active_deadline', value: 'Discovery deadline T-48h, 340 docs outstanding, escalation pending GC approval', operator: 'Counsel Sentinel', workcell: 'WC-0042', ts: '2026-04-25T02:30:00Z', ttl: '4h', accessCount: 8, provenanceHash: 'sha256:sm02b2', decayScore: 0.85, reinforcementScore: 0.76 },
  { id: 'sm-003', key: 'tg_ember_active_iocs', value: 'Current IOC set: 3 C2 beacons, 2 lateral movement indicators, 1 exfil pattern', operator: 'Guardian', workcell: 'WC-0043', ts: '2026-04-25T18:42:00Z', ttl: '2h', accessCount: 24, provenanceHash: 'sha256:sm03c3', decayScore: 0.98, reinforcementScore: 0.95 },
  { id: 'sm-004', key: 'q2_pipeline_snapshot', value: 'Pipeline velocity: 14.1 deals/week (22.5% below baseline), 3 at-risk deals flagged', operator: 'Pipeline Oracle', workcell: 'WC-0044', ts: '2026-04-25T01:00:00Z', ttl: '4h', accessCount: 6, provenanceHash: 'sha256:sm04d4', decayScore: 0.72, reinforcementScore: 0.65 },
];

const BANK_MEMORIES = [
  { id: 'bm-001', key: 'cascade_delay_pattern', value: 'ETA deviation >30h triggers port standby recommendation. Historical success rate: 88%. 12 prior cases.', operator: 'Cascade Navigator', consolidatedFrom: ['sm-prev-001', 'sm-prev-012', 'sm-prev-023'], consolidatedAt: '2026-04-20T00:00:00Z', proofHash: 'sha256:bm01a1', accessCount: 47, version: 3, decayScore: 0.94, reinforcementScore: 0.91 },
  { id: 'bm-002', key: 'talbot_opposing_counsel_pattern', value: 'Opposing counsel has filed late 3 of last 5 cases. Early escalation pattern yields 40% better outcomes.', operator: 'Counsel Sentinel', consolidatedFrom: ['sm-prev-002', 'sm-prev-014'], consolidatedAt: '2026-04-18T00:00:00Z', proofHash: 'sha256:bm02b2', accessCount: 23, version: 2, decayScore: 0.88, reinforcementScore: 0.82 },
  { id: 'bm-003', key: 'tg_ember_fingerprint', value: 'TG-Ember APT: C2 on 443/8080, exfil via DNS-over-HTTPS. YARA rules v4.2 active. 24 prior incidents.', operator: 'Guardian', consolidatedFrom: ['sm-prev-003', 'sm-prev-015', 'sm-prev-027', 'sm-prev-038'], consolidatedAt: '2026-04-22T00:00:00Z', proofHash: 'sha256:bm03c3', accessCount: 92, version: 4, decayScore: 0.97, reinforcementScore: 0.96 },
  { id: 'bm-004', key: 'plano_cap_rate_model', value: 'Cap rate +18bps over 30d (6.2%). Historical reversal threshold: 6.5%. Comparable: 5.8-6.4% in DFW metro.', operator: 'DOMAINE Analyst', consolidatedFrom: ['sm-prev-006'], consolidatedAt: '2026-04-19T00:00:00Z', proofHash: 'sha256:bm04d4', accessCount: 15, version: 1, decayScore: 0.78, reinforcementScore: 0.68 },
  { id: 'bm-005', key: 'mirror_eval_baseline', value: 'Global MirrorEval pass rate: 94.2%. Maritime: 96.1%, Legal: 97.4%, Defense: 91.8%, Revenue: 88.4%.', operator: 'Fabric Watchdog', consolidatedFrom: ['sm-prev-007', 'sm-prev-019'], consolidatedAt: '2026-04-21T00:00:00Z', proofHash: 'sha256:bm05e5', accessCount: 34, version: 5, decayScore: 0.95, reinforcementScore: 0.93 },
];

const RESTRICTED_MEMORIES = [
  { key: 'talbot_privileged_comms', restriction: 'Attorney-Client Privilege', authority: 'pol-privilege-001', operator: 'Counsel Sentinel', reason: 'Contains privileged attorney-client communications — sealed from non-legal operators' },
  { key: 'tg_ember_classified_iocs', restriction: 'Classified', authority: 'pol-classification-002', operator: 'Guardian', reason: 'IOC set sourced from classified threat feed — restricted to CISO-approved operators' },
  { key: 'hr_compensation_model', restriction: 'PII/Sensitive', authority: 'pol-pii-001', operator: 'Pipeline Oracle', reason: 'Contains individual compensation data — PII redacted before bank storage' },
  { key: 'acquisition_target_valuation', restriction: 'Material Non-Public', authority: 'pol-mnpi-001', operator: 'DOMAINE Analyst', reason: 'Pre-announcement acquisition valuation — MNPI wall enforced' },
];

const CONSOLIDATION_EVENTS = [
  { id: 'ce-001', from: 'Session Memory (WC-0038)', to: 'Memory Bank', key: 'cascade_delay_pattern', action: 'Merged 3 session observations into bank entry', proofHash: 'sha256:ce01a1', ts: '2026-04-20T00:00:00Z', delta: '+2 cases added to historical record' },
  { id: 'ce-002', from: 'Session Memory (WC-0039)', to: 'Memory Bank', key: 'tg_ember_fingerprint', action: 'Updated TG-Ember IOC set with 4 new indicators', proofHash: 'sha256:ce02b2', ts: '2026-04-22T00:00:00Z', delta: '+4 IOCs, YARA rules updated to v4.2' },
  { id: 'ce-003', from: 'Session Memory (WC-0040)', to: 'Memory Bank', key: 'mirror_eval_baseline', action: 'Refreshed baseline metrics from latest eval run', proofHash: 'sha256:ce03c3', ts: '2026-04-21T00:00:00Z', delta: 'Pass rate updated: 94.2% → 94.2% (stable)' },
  { id: 'ce-004', from: 'Session Memory (WC-0037)', to: 'Memory Bank', key: 'talbot_opposing_counsel_pattern', action: 'Added new late-filing data point', proofHash: 'sha256:ce04d4', ts: '2026-04-18T00:00:00Z', delta: 'Filing pattern updated: 2/4 → 3/5 late' },
];

const GOVERNANCE_RULES = [
  { rule: 'No cross-operator memory sharing without Covenant Layer permission', status: 'enforced' },
  { rule: 'All memory access logged to Proof Ledger', status: 'enforced' },
  { rule: 'Session memory auto-expires after workcell TTL', status: 'enforced' },
  { rule: 'Bank consolidation requires proof chain attestation', status: 'enforced' },
  { rule: 'Memory provenance hash computed on every write', status: 'enforced' },
  { rule: 'PII/classified data redacted before bank storage', status: 'enforced' },
  { rule: 'Memory access audit trail retained 90 days', status: 'enforced' },
];

const DEMO_WORKCELLS = [
  { id: 'WC-0041', label: 'Horizon Star — Maritime Risk', domain: 'maritime', color: '#8a8a8a' },
  { id: 'WC-0042', label: 'Talbot — Legal Escalation', domain: 'legal', color: GOLD },
  { id: 'WC-0043', label: 'TG-Ember — Cyber Incident', domain: 'cyber', color: '#f5f5f5' },
];

const RETRIEVAL_TRACES: Record<string, Array<{ step: string; source: string; size: string; content: string; latency: string }>> = {
  'WC-0041': [
    { step: 'Query Session Memory', source: 'Session Layer', size: '12 KB', content: 'Active context: Horizon Star charter party terms, last 4 AIS pings, voyage plan', latency: '3ms' },
    { step: 'Query Memory Bank', source: 'Bank Layer', size: '48 KB', content: 'Historical ETA deviations for Cascade Navigator (88 records), Port Klang capacity data', latency: '28ms' },
    { step: 'Retrieve domain schema', source: 'Context Engine', size: '8 KB', content: 'Maritime domain schema v2.3 — vessel entity types, port codes, sanctions lists', latency: '5ms' },
    { step: 'Inject operator instructions', source: 'Operator Profile', size: '2 KB', content: 'Cascade Navigator: "Always include fuel cost delta in port recommendations"', latency: '1ms' },
    { step: 'Fetch proof cache', source: 'Proof Cache', size: '4 KB', content: 'OFAC/EU/UN screens cached for Horizon Star — last verified 2h ago', latency: '4ms' },
    { step: 'Assemble context pack', source: 'Context Engine', size: '74 KB', content: 'Final context pack: 6 sources merged, deduped, ranked by recency × relevance', latency: '12ms' },
    { step: 'Pack delivered to workcell', source: 'Workcell Engine', size: '74 KB', content: 'Context pack bound to WC-0041 — ready for Cascade Navigator invocation', latency: '2ms' },
  ],
  'WC-0042': [
    { step: 'Query Session Memory', source: 'Session Layer', size: '8 KB', content: 'Active context: Talbot matter metadata, upcoming deadline, assigned attorney', latency: '2ms' },
    { step: 'Query Memory Bank', source: 'Bank Layer', size: '64 KB', content: 'Talbot full case history: 18 docket entries, 5 filings, opposing counsel track record', latency: '31ms' },
    { step: 'Retrieve domain schema', source: 'Context Engine', size: '6 KB', content: 'Legal domain schema v1.8 — matter types, deadline rules, motion templates', latency: '4ms' },
    { step: 'Inject operator instructions', source: 'Operator Profile', size: '3 KB', content: 'Counsel Sentinel: "Flag opposing late pattern, cite minimum 3 precedents"', latency: '1ms' },
    { step: 'Load docket feed cache', source: 'Proof Cache', size: '2 KB', content: 'Court calendar sync cached — Talbot deadlines confirmed current as of 4h ago', latency: '3ms' },
    { step: 'Assemble context pack', source: 'Context Engine', size: '83 KB', content: 'Final context pack: 5 sources merged, deadline proximity boost applied', latency: '14ms' },
    { step: 'Pack delivered to workcell', source: 'Workcell Engine', size: '83 KB', content: 'Context pack bound to WC-0042 — ready for Counsel Sentinel invocation', latency: '2ms' },
  ],
  'WC-0043': [
    { step: 'Query Session Memory', source: 'Session Layer', size: '6 KB', content: 'Active context: SIEM alert #4821, initial IOC match, affected host list', latency: '2ms' },
    { step: 'Query Memory Bank', source: 'Bank Layer', size: '92 KB', content: 'TG-Ember threat intel: 24 prior incidents, TTPs, C2 infrastructure, YARA rules', latency: '38ms' },
    { step: 'Retrieve domain schema', source: 'Context Engine', size: '10 KB', content: 'Cyber domain schema v3.1 — STIX/TAXII entity types, MITRE ATT&CK mappings', latency: '6ms' },
    { step: 'Inject operator instructions', source: 'Operator Profile', size: '2 KB', content: 'Guardian: "Auto-isolate at IOC confidence >0.90 for known APTs"', latency: '1ms' },
    { step: 'Fetch threat intel cache', source: 'Proof Cache', size: '18 KB', content: 'IOC hashes cached from ISAC feed — TG-Ember C2 list updated 6h ago', latency: '5ms' },
    { step: 'Assemble context pack', source: 'Context Engine', size: '128 KB', content: 'Final context pack: 5 sources merged — threat intel ranked highest', latency: '18ms' },
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
  const [activeTab, setActiveTab] = useState<'vault' | 'consolidation' | 'trace' | 'governance'>('vault');
  const [memoryLayer, setMemoryLayer] = useState<'session' | 'bank'>('session');
  const [selectedWorkcell, setSelectedWorkcell] = useState<string>(DEMO_WORKCELLS[0].id);
  const [traceStep, setTraceStep] = useState(-1);
  const [traceRunning, setTraceRunning] = useState(false);

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
        label="GOVERNED MEMORY VAULT"
        title="Two-Layer Memory Architecture"
        subtitle="Session Memory (ephemeral, per-workcell) + Memory Bank (persistent, consolidated). Every memory write is provenance-tracked, every consolidation is proof-attested, every access is governed."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="SESSION ENTRIES" value={SESSION_MEMORIES.length} sub="active workcells" accent={GOLD} />
        <KpiCard label="BANK ENTRIES" value={BANK_MEMORIES.length} sub="persistent knowledge" accent={GOLD} />
        <KpiCard label="CONSOLIDATIONS" value={CONSOLIDATION_EVENTS.length} sub="proof-attested" accent="#22c55e" />
        <KpiCard label="GOVERNANCE" value={`${GOVERNANCE_RULES.length}/${GOVERNANCE_RULES.length}`} sub="all enforced" accent="#22c55e" />
      </div>

      <div className="flex gap-1 mb-6">
        {(['vault', 'consolidation', 'trace', 'governance'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all" style={{ background: activeTab === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: activeTab === tab ? GOLD : '#5e5e5e', border: `1px solid ${activeTab === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
            {tab === 'vault' ? 'Memory Vault' : tab === 'consolidation' ? 'Consolidation' : tab === 'trace' ? 'Retrieval Trace' : 'Governance'}
          </button>
        ))}
      </div>

      {activeTab === 'vault' && (
        <>
          <div className="flex gap-2 mb-4">
            {(['session', 'bank'] as const).map(l => (
              <button key={l} onClick={() => setMemoryLayer(l)} className="text-xs px-3 py-1.5 rounded-lg font-mono" style={{ backgroundColor: memoryLayer === l ? 'rgba(201,183,135,0.12)' : 'var(--color-a11oy-muted)', color: memoryLayer === l ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${memoryLayer === l ? 'rgba(201,183,135,0.3)' : 'transparent'}`, cursor: 'pointer' }}>
                {l === 'session' ? 'Session Memory' : 'Memory Bank'}
              </button>
            ))}
          </div>

          {memoryLayer === 'session' && (
            <>
              <SectionTitle>Session Memory — Ephemeral ({SESSION_MEMORIES.length})</SectionTitle>
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                      {['Key', 'Value', 'Operator', 'Workcell', 'TTL', 'Decay', 'Reinf.', 'Provenance'].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SESSION_MEMORIES.map((e, i) => (
                      <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                        <td className="px-3 py-2 font-mono" style={{ color: '#b08d52', maxWidth: 140 }}><div className="truncate">{e.key}</div></td>
                        <td className="px-3 py-2" style={{ color: 'var(--color-a11oy-text-sub)', maxWidth: 260 }}><div className="truncate">{e.value}</div></td>
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.operator}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: GOLD }}>{e.workcell}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.ttl}</td>
                        <td className="px-3 py-2 font-mono" style={{ color: e.decayScore >= 0.9 ? '#22c55e' : e.decayScore >= 0.75 ? GOLD : '#ef4444' }}>{Math.round(e.decayScore * 100)}%</td>
                        <td className="px-3 py-2 font-mono" style={{ color: e.reinforcementScore >= 0.85 ? '#22c55e' : e.reinforcementScore >= 0.7 ? GOLD : '#ef4444' }}>{Math.round(e.reinforcementScore * 100)}%</td>
                        <td className="px-3 py-2 font-mono" style={{ color: '#22c55e', fontSize: 9 }}>{e.provenanceHash.slice(0, 16)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
                Session memory is ephemeral — scoped to a single workcell execution and auto-expires after TTL. No cross-workcell leakage.
              </div>
            </>
          )}

          {memoryLayer === 'bank' && (
            <>
              <SectionTitle>Memory Bank — Persistent ({BANK_MEMORIES.length})</SectionTitle>
              <div className="flex flex-col gap-3">
                {BANK_MEMORIES.map(e => (
                  <Card key={e.id}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="font-mono text-sm font-semibold" style={{ color: '#b08d52' }}>{e.key}</div>
                        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.operator} · v{e.version} · {e.accessCount} accesses</div>
                      </div>
                      <div className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)' }}>PERSISTENT</div>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{e.value}</p>
                    <div className="grid grid-cols-2 gap-2 text-[9px] mb-2">
                      <div className="flex items-center gap-2"><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Decay:</span><span className="font-mono" style={{ color: e.decayScore >= 0.9 ? '#22c55e' : GOLD }}>{Math.round(e.decayScore * 100)}%</span></div>
                      <div className="flex items-center gap-2"><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Reinforcement:</span><span className="font-mono" style={{ color: e.reinforcementScore >= 0.85 ? '#22c55e' : GOLD }}>{Math.round(e.reinforcementScore * 100)}%</span></div>
                    </div>
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className="font-mono" style={{ color: '#22c55e' }}>{e.proofHash}</span>
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Consolidated from {e.consolidatedFrom.length} sessions</span>
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(e.consolidatedAt)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'consolidation' && (
        <>
          <SectionTitle>Consolidation Proof Chain ({CONSOLIDATION_EVENTS.length})</SectionTitle>
          <div className="flex flex-col gap-0">
            {CONSOLIDATION_EVENTS.map((ce, idx) => {
              const isLast = idx === CONSOLIDATION_EVENTS.length - 1;
              return (
                <div key={ce.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '2px solid #22c55e', color: '#22c55e', fontSize: 10, fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{idx + 1}</div>
                    {!isLast && <div className="w-0.5 flex-1 my-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)', minHeight: 20 }} />}
                  </div>
                  <div className="flex-1 pb-4">
                    <Card>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--color-a11oy-text)' }}>{ce.key}</div>
                          <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{ce.from} → {ce.to}</div>
                        </div>
                        <div className="text-[9px] font-mono" style={{ color: '#22c55e' }}>{ce.proofHash}</div>
                      </div>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{ce.action}</p>
                      <div className="text-xs font-mono" style={{ color: GOLD }}>{ce.delta}</div>
                      <div className="text-[9px] mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(ce.ts)}</div>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'trace' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {DEMO_WORKCELLS.map(w => (
              <button key={w.id} onClick={() => { setSelectedWorkcell(w.id); setTraceStep(-1); setTraceRunning(false); }} className="px-4 py-2 rounded-lg text-xs font-mono transition-all" style={{ background: selectedWorkcell === w.id ? `${w.color}18` : 'rgba(255,255,255,0.025)', border: `1px solid ${selectedWorkcell === w.id ? w.color + '40' : 'rgba(255,255,255,0.08)'}`, color: selectedWorkcell === w.id ? w.color : '#5e5e5e', cursor: 'pointer' }}>
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
                <span className="text-[9px] font-mono" style={{ color: GOLD }}>
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
                    <motion.div className="rounded-lg p-3" style={{ background: isActive ? `${wc.color}12` : isDone ? 'rgba(255,255,255,0.02)' : 'transparent', border: `1px solid ${isActive ? wc.color + '40' : isDone ? 'rgba(255,255,255,0.06)' : 'transparent'}`, opacity: traceStep >= 0 && !isActive && !isDone ? 0.35 : 1, transition: 'all 0.3s ease' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0" style={{ background: (isActive || isDone) ? `${wc.color}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${(isActive || isDone) ? wc.color + '50' : 'rgba(255,255,255,0.08)'}`, color: (isActive || isDone) ? wc.color : '#5e5e5e' }}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-medium" style={{ color: (isActive || isDone) ? '#f5f5f5' : '#5e5e5e' }}>{step.step}</span>
                            <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: '#5e5e5e' }}>{step.source}</span>
                          </div>
                          <AnimatePresence>
                            {(isActive || isDone) && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-[10px] mt-1" style={{ color: '#8a8a8a' }}>
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

      {activeTab === 'governance' && (
        <>
          <SectionTitle>Memory Governance Panel</SectionTitle>
          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>MEMORY ACCESS POLICY</div>
            <div className="space-y-2">
              {GOVERNANCE_RULES.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{r.rule}</span>
                  <span className="font-mono flex-shrink-0" style={{ color: '#22c55e' }}>{r.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-4">
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: '#ef4444' }}>POLICY-RESTRICTED MEMORIES</div>
            <div className="space-y-2">
              {RESTRICTED_MEMORIES.map((rm, i) => (
                <div key={i} className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold" style={{ color: '#ef4444' }}>{rm.key}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}>{rm.restriction}</span>
                  </div>
                  <p className="text-[10px] mb-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{rm.reason}</p>
                  <div className="flex items-center gap-3 text-[9px]">
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{rm.operator}</span>
                    <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{rm.authority}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-4">
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: GOLD }}>MEMORY ARCHITECTURE</div>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.1)' }}>
                <div className="font-semibold mb-1" style={{ color: GOLD }}>Session Memory (Layer 1)</div>
                <p style={{ color: 'var(--color-a11oy-text-sub)' }}>Ephemeral, per-workcell context. Auto-expires after TTL. No cross-workcell leakage. Every read/write provenance-hashed.</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                <div className="font-semibold mb-1" style={{ color: '#22c55e' }}>Memory Bank (Layer 2)</div>
                <p style={{ color: 'var(--color-a11oy-text-sub)' }}>Persistent, versioned knowledge. Consolidated from session observations via proof-attested pipeline. Domain-scoped access control.</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </Layout>
  );
}
