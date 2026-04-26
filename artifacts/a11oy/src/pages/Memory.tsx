import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar } from '../components/ui';

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
  const totalUsed = MEMORY_STORES.reduce((acc, m) => acc + m.used, 0);
  const totalCap = MEMORY_STORES.reduce((acc, m) => acc + m.capacity, 0);

  return (
    <Layout>
      <PageHeader
        label="OPERATOR MEMORY"
        title="Memory & Context Stores"
        subtitle="Short-term operational context, long-term domain knowledge, proof cache, and context packs — all scoped by operator and workcell."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="TOTAL CAPACITY" value={`${(totalCap / 1024).toFixed(1)} MB`} sub="across all stores" accent="#c9b787" />
        <KpiCard label="USED" value={`${(totalUsed / 1024).toFixed(1)} MB`} sub={`${Math.round((totalUsed / totalCap) * 100)}% utilization`} accent="#c9b787" />
        <KpiCard label="MEMORY ENTRIES" value={MEMORY_ENTRIES.length} sub="in demo session" accent="#c9b787" />
        <KpiCard label="ACTIVE OPERATORS" value={6} sub="with memory context" accent="#8a8a8a" />
      </div>

      {/* Memory Stores */}
      <SectionTitle>Memory Stores</SectionTitle>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Memory Entries */}
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
    </Layout>
  );
}
