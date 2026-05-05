import { Database, TrendingUp, AlertTriangle, Archive, RefreshCw } from 'lucide-react';

const MEMORY_TIERS = [
  {
    tier: 'Working Memory',
    totalEntries: 284,
    freshEntries: 271,
    staleEntries: 13,
    redactedEntries: 0,
    compactedEntries: 0,
    freshnessScore: 0.95,
    lastCompactionAt: new Date(Date.now() - 3600_000).toISOString(),
    policyAdherence: 0.99,
    color: '#22c55e',
    description: 'Active session memory — current workcell context, live signals, recent tool outputs.',
  },
  {
    tier: 'Episodic Memory',
    totalEntries: 1847,
    freshEntries: 1620,
    staleEntries: 190,
    redactedEntries: 37,
    compactedEntries: 0,
    freshnessScore: 0.88,
    lastCompactionAt: new Date(Date.now() - 86400_000).toISOString(),
    policyAdherence: 0.96,
    color: '#8b7ac8',
    description: 'Workcell execution history, past decisions, agent call sequences, and outcome records.',
  },
  {
    tier: 'Semantic Memory',
    totalEntries: 12400,
    freshEntries: 11100,
    staleEntries: 1100,
    redactedEntries: 200,
    compactedEntries: 9800,
    freshnessScore: 0.90,
    lastCompactionAt: new Date(Date.now() - 172800_000).toISOString(),
    policyAdherence: 0.98,
    color: '#4d8fcc',
    description: 'Operator instructions, tool schemas, Covenant Policies, skill definitions, domain knowledge.',
  },
  {
    tier: 'Proof Ledger Memory',
    totalEntries: 847,
    freshEntries: 847,
    staleEntries: 0,
    redactedEntries: 0,
    compactedEntries: 0,
    freshnessScore: 1.0,
    lastCompactionAt: new Date(Date.now() - 600_000).toISOString(),
    policyAdherence: 1.0,
    color: '#d4a054',
    description: 'Immutable Proof Packets, approval records, hash digests, and verification results.',
  },
  {
    tier: 'Policy Store',
    totalEntries: 24,
    freshEntries: 24,
    staleEntries: 0,
    redactedEntries: 0,
    compactedEntries: 0,
    freshnessScore: 1.0,
    lastCompactionAt: new Date(Date.now() - 3600_000 * 6).toISOString(),
    policyAdherence: 1.0,
    color: '#ec4899',
    description: 'Active Covenant Policies, guardrail rules, approval routing tables, and retention schedules.',
  },
];

const RETENTION_POLICY = [
  { tier: 'Working Memory', retentionWindow: '24 hours', compactionStrategy: 'Auto-evict on session end', purgable: true },
  { tier: 'Episodic Memory', retentionWindow: '90 days', compactionStrategy: 'Semantic clustering + compression', purgable: false },
  { tier: 'Semantic Memory', retentionWindow: 'Indefinite', compactionStrategy: 'Version-controlled compaction', purgable: false },
  { tier: 'Proof Ledger Memory', retentionWindow: '7 years (regulatory)', compactionStrategy: 'None — immutable', purgable: false },
  { tier: 'Policy Store', retentionWindow: 'Indefinite', compactionStrategy: 'Version controlled', purgable: false },
];

export function MemoryPage() {
  const totalEntries = MEMORY_TIERS.reduce((s, t) => s + t.totalEntries, 0);
  const avgFreshness = MEMORY_TIERS.reduce((s, t) => s + t.freshnessScore, 0) / MEMORY_TIERS.length;
  const totalStale = MEMORY_TIERS.reduce((s, t) => s + t.staleEntries, 0);
  const totalRedacted = MEMORY_TIERS.reduce((s, t) => s + t.redactedEntries, 0);

  return (
    <div style={{ background: 'var(--gi-bg-base)', minHeight: '100vh', color: 'var(--gi-text-primary)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--gi-border-subtle)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: 'rgba(139,122,200,0.15)', border: '1px solid rgba(139,122,200,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database size={18} color="#8b7ac8" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Operational Memory Health</div>
          <div style={{ fontSize: 12, color: 'var(--gi-text-muted)' }}>5 memory tiers — freshness monitoring · retention policy · compaction status</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '5px 12px' }}>
          <RefreshCw size={11} color="#22c55e" />
          <span style={{ fontSize: 11, color: '#22c55e' }}>Live monitoring</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderBottom: '1px solid var(--gi-border-subtle)' }}>
        {[
          { label: 'Total Entries', value: totalEntries.toLocaleString(), color: '#8b7ac8', icon: Database },
          { label: 'Avg Freshness', value: `${Math.round(avgFreshness * 100)}%`, color: avgFreshness >= 0.9 ? '#22c55e' : '#d4a054', icon: TrendingUp },
          { label: 'Stale Entries', value: totalStale.toLocaleString(), color: totalStale > 500 ? '#d4a054' : '#22c55e', icon: AlertTriangle },
          { label: 'Redacted Entries', value: totalRedacted.toLocaleString(), color: 'var(--gi-text-muted)', icon: Archive },
        ].map((s) => (
          <div key={s.label} style={{ padding: '16px 24px', background: 'var(--gi-bg-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <s.icon size={14} color={s.color} />
              <span style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 32px' }}>
        {/* Memory Tier Cards */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Memory Tiers</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {MEMORY_TIERS.map((tier) => (
              <div key={tier.tier} style={{ background: 'var(--gi-bg-base)', borderRadius: 10, border: `1px solid ${tier.color}18`, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: tier.color }} />
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{tier.tier}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>{tier.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: tier.color }}>{Math.round(tier.freshnessScore * 100)}%</div>
                    <div style={{ fontSize: 10, color: 'var(--gi-text-muted)' }}>freshness</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 12 }}>
                  {[
                    { label: 'Total', value: tier.totalEntries.toLocaleString(), color: '#94a3b8' },
                    { label: 'Fresh', value: tier.freshEntries.toLocaleString(), color: '#22c55e' },
                    { label: 'Stale', value: tier.staleEntries.toLocaleString(), color: tier.staleEntries > 100 ? '#d4a054' : 'var(--gi-text-muted)' },
                    { label: 'Redacted', value: tier.redactedEntries.toLocaleString(), color: 'var(--gi-text-muted)' },
                    { label: 'Policy Adherence', value: `${Math.round(tier.policyAdherence * 100)}%`, color: tier.policyAdherence >= 0.95 ? '#22c55e' : '#d4a054' },
                  ].map((m) => (
                    <div key={m.label}>
                      <div style={{ fontSize: 9, color: 'var(--gi-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Freshness bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: '#475569' }}>freshness distribution</span>
                    <span style={{ fontSize: 9, color: '#475569' }}>last compaction: {new Date(tier.lastCompactionAt).toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--gi-border-subtle)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(tier.freshEntries / tier.totalEntries) * 100}%`, background: '#22c55e' }} />
                    <div style={{ width: `${(tier.staleEntries / tier.totalEntries) * 100}%`, background: '#d4a054' }} />
                    <div style={{ width: `${(tier.redactedEntries / tier.totalEntries) * 100}%`, background: '#475569' }} />
                    <div style={{ width: `${(tier.compactedEntries / tier.totalEntries) * 100}%`, background: 'var(--gi-border-subtle)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                    {[{ label: 'Fresh', color: '#22c55e' }, { label: 'Stale', color: '#d4a054' }, { label: 'Redacted', color: '#475569' }, { label: 'Compacted', color: 'var(--gi-border-subtle)' }].map((l) => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 8, height: 3, background: l.color, borderRadius: 1 }} />
                        <span style={{ fontSize: 9, color: '#475569' }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Policy */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Data Retention Policy</div>
          <div style={{ background: 'var(--gi-bg-base)', borderRadius: 10, border: '1px solid var(--gi-border-subtle)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.5fr auto', padding: '10px 16px', borderBottom: '1px solid var(--gi-border-subtle)' }}>
              {['Tier', 'Retention Window', 'Compaction Strategy', 'Purgeable'].map((h) => (
                <div key={h} style={{ fontSize: 10, color: 'var(--gi-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {RETENTION_POLICY.map((r, i) => (
              <div key={r.tier} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.5fr auto', padding: '12px 16px', borderBottom: i < RETENTION_POLICY.length - 1 ? '1px solid var(--gi-bg-base)' : 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--gi-text-primary)', fontWeight: 500 }}>{r.tier}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.retentionWindow}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.compactionStrategy}</div>
                <div>
                  {r.purgable ? (
                    <span style={{ fontSize: 10, color: '#d4a054', background: 'rgba(212,160,84,0.08)', border: '1px solid rgba(212,160,84,0.2)', borderRadius: 10, padding: '2px 8px' }}>Yes (approval)</span>
                  ) : (
                    <span style={{ fontSize: 10, color: '#475569', background: 'rgba(71,85,105,0.08)', border: '1px solid rgba(71,85,105,0.2)', borderRadius: 10, padding: '2px 8px' }}>No</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoryPage;
