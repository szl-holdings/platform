import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ActionButton } from '../components/ui';

const API_BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/a11oy\/$/, '/api').replace(/\/$/, '');

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787', gold: '#b08d52',
};

type MemoryTier = 'org-constitution' | 'project-doctrine' | 'auto-memory';

interface MemoryEntry {
  id: string;
  tier: MemoryTier;
  key: string;
  content: string;
  artifact_id?: string;
  redacted: boolean;
  redaction_reason?: string;
  provenance: {
    written_by_hook?: string;
    written_on_event?: string;
    written_for_run?: string;
    session_id?: string;
    agent_id?: string;
  };
  proof_packet_id?: string;
  created_at: string;
  version: number;
}


const TIER_META: Record<MemoryTier, { label: string; color: string; description: string; icon: string }> = {
  'org-constitution': { label: 'Org Constitution', color: '#b08d52', description: 'Immutable per release. Sourced from mythosDoctrine + Constitution. Cannot be overridden by operators.', icon: '◆' },
  'project-doctrine': { label: 'Project Doctrine', color: '#c9b787', description: 'Per-artifact CLAUDE.md-style directives. Writable by operators. Versioned.', icon: '◈' },
  'auto-memory': { label: 'Auto-Memory', color: '#8a8a8a', description: 'Learned, append-only entries written by hooks on PostToolUse / PostSubagentReturn. Redactable with proof entry.', icon: '◉' },
};

const EVENT_COLORS: Record<string, string> = {
  SessionStart: '#c9b787',
  PostToolUse: '#8a8a8a',
  PostSubagentReturn: '#8a8a8a',
  PrePromptSubmit: '#f5f5f5',
  manual: '#c9b787',
};

export function Memory() {
  const [activeTier, setActiveTier] = useState<MemoryTier | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const [showRedacted, setShowRedacted] = useState(false);
  const [redactPending, setRedactPending] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<MemoryEntry[]>([]);
  const [tierStats, setTierStats] = useState<{ org_constitution: { count: number }; project_doctrine: { count: number }; auto_memory: { count: number; redacted: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [entriesRes, tiersRes] = await Promise.all([
          fetch(`${API_BASE}/a11oy/memory/entries?limit=200&artifact_id=a11oy`),
          fetch(`${API_BASE}/a11oy/memory/tiers`),
        ]);
        const [entriesJson, tiersJson] = await Promise.all([entriesRes.json(), tiersRes.json()]);
        if (!cancelled) {
          if (entriesJson.ok && Array.isArray(entriesJson.data)) {
            setAllEntries(entriesJson.data as MemoryEntry[]);
          }
          if (tiersJson.ok && tiersJson.data) {
            setTierStats(tiersJson.data);
          }
        }
      } catch {
        // Silently fall back to seed data already in state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = allEntries.filter(e => {
    if (activeTier !== 'all' && e.tier !== activeTier) return false;
    if (!showRedacted && e.redacted) return false;
    return true;
  });

  const autoEntries = allEntries.filter(e => e.tier === 'auto-memory');
  const autoTotal = tierStats?.auto_memory?.count ?? autoEntries.length;
  const autoRedacted = tierStats?.auto_memory?.redacted ?? autoEntries.filter(e => e.redacted).length;
  const constitutionCount = tierStats?.org_constitution?.count ?? allEntries.filter(e => e.tier === 'org-constitution').length;
  const doctrineCount = tierStats?.project_doctrine?.count ?? allEntries.filter(e => e.tier === 'project-doctrine').length;

  async function handleRedact(id: string) {
    setRedactPending(id);
    try {
      const res = await fetch(`${API_BASE}/a11oy/memory/redact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reason: 'Operator redaction request' }),
      });
      if (res.ok) {
        setAllEntries(prev => prev.map(e => e.id === id ? { ...e, redacted: true, content: '[REDACTED]', redaction_reason: 'Operator redaction request' } : e));
        if (selectedEntry?.id === id) setSelectedEntry(null);
      }
    } finally {
      setRedactPending(null);
    }
  }

  return (
    <Layout>
      <PageHeader
        label="TIERED MEMORY"
        title="Three-Tier Memory Architecture"
        subtitle="Every memory entry is sourced, versioned, and proof-chained. Org constitution is immutable. Project doctrine is operator-controlled. Auto-memory is hook-written and redactable."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="CONSTITUTION" value={loading ? '…' : String(constitutionCount)} sub="immutable entries" accent={T.gold} />
        <KpiCard label="DOCTRINE" value={loading ? '…' : String(doctrineCount)} sub="operator-controlled" accent={T.accent} />
        <KpiCard label="AUTO-MEMORY" value={loading ? '…' : String(autoTotal - autoRedacted)} sub="hook-written" accent={T.dim} />
        <KpiCard label="REDACTED" value={loading ? '…' : String(autoRedacted)} sub="with proof entry" accent={T.muted} />
      </div>

      {/* Tier overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.entries(TIER_META) as [MemoryTier, typeof TIER_META[MemoryTier]][]).map(([tier, meta]) => (
          <div
            key={tier}
            className="p-3 rounded border cursor-pointer transition-colors"
            style={{
              borderColor: activeTier === tier ? meta.color : T.border,
              backgroundColor: activeTier === tier ? `${meta.color}08` : T.surface,
            }}
            onClick={() => setActiveTier(activeTier === tier ? 'all' : tier)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: meta.color }}>{meta.icon}</span>
              <span className="text-xs font-medium" style={{ color: T.text }}>{meta.label}</span>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: T.muted }}>{meta.description}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <SectionTitle>{activeTier === 'all' ? 'All Entries' : TIER_META[activeTier].label} — {filtered.length} shown</SectionTitle>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showRedacted}
              onChange={e => setShowRedacted(e.target.checked)}
              className="w-3 h-3"
            />
            <span className="text-[11px]" style={{ color: T.muted }}>Show redacted</span>
          </label>
          <div className="flex gap-1">
            {(['all', 'org-constitution', 'project-doctrine', 'auto-memory'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTier(t)}
                className="text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
                style={{
                  backgroundColor: activeTier === t ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.04)',
                  color: activeTier === t ? T.accent : T.muted,
                }}
              >
                {t === 'all' ? 'ALL' : TIER_META[t].label.split(' ')[0]?.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Entry list */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          {filtered.map(entry => {
            const meta = TIER_META[entry.tier];
            return (
              <div
                key={entry.id}
                className="p-3 rounded border cursor-pointer transition-colors"
                style={{
                  borderColor: selectedEntry?.id === entry.id ? meta.color : T.border,
                  backgroundColor: selectedEntry?.id === entry.id ? `${meta.color}06` : T.surface,
                  opacity: entry.redacted ? 0.7 : 1,
                }}
                onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono" style={{ color: meta.color }}>{meta.icon} {meta.label}</span>
                    {entry.artifact_id && (
                      <span className="text-[10px] font-mono px-1.5 py-0 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: T.dim }}>{entry.artifact_id}</span>
                    )}
                    {entry.redacted && (
                      <span className="text-[10px] font-mono px-1.5 py-0 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.06)', color: '#f5f5f5' }}>REDACTED</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: T.muted }}>v{entry.version}</span>
                </div>
                <div className="text-xs font-mono mb-1" style={{ color: T.accent }}>{entry.key}</div>
                <div className="text-xs leading-relaxed" style={{ color: entry.redacted ? T.muted : T.dim }}>
                  {entry.content.length > 120 ? `${entry.content.slice(0, 120)}…` : entry.content}
                </div>
                {entry.redacted && entry.redaction_reason && (
                  <div className="text-[10px] mt-1" style={{ color: '#5e5e5e' }}>{entry.redaction_reason}</div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-6 text-center rounded border" style={{ borderColor: T.border, color: T.muted }}>
              No entries match the current filter.
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="flex flex-col gap-3">
          {selectedEntry ? (
            <>
              <SectionTitle>Entry Detail</SectionTitle>
              <div className="p-3 rounded border" style={{ borderColor: T.border, backgroundColor: T.surface }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono" style={{ color: TIER_META[selectedEntry.tier].color }}>
                    {TIER_META[selectedEntry.tier].icon} {TIER_META[selectedEntry.tier].label}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: T.muted }}>v{selectedEntry.version}</span>
                </div>

                <div className="text-xs font-mono mb-2" style={{ color: T.accent }}>{selectedEntry.key}</div>
                <div className="text-xs leading-relaxed mb-4" style={{ color: T.dim }}>{selectedEntry.content}</div>

                <div className="space-y-2 mb-4">
                  <div className="text-[10px] font-mono uppercase mb-1" style={{ color: T.muted }}>Provenance</div>
                  {selectedEntry.provenance.written_by_hook && (
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: T.muted }}>Hook</span>
                      <span className="text-[10px] font-mono" style={{ color: T.dim }}>{selectedEntry.provenance.written_by_hook}</span>
                    </div>
                  )}
                  {selectedEntry.provenance.written_on_event && (
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: T.muted }}>Event</span>
                      <span className="text-[10px] font-mono" style={{ color: EVENT_COLORS[selectedEntry.provenance.written_on_event] ?? T.dim }}>
                        {selectedEntry.provenance.written_on_event}
                      </span>
                    </div>
                  )}
                  {selectedEntry.provenance.agent_id && (
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: T.muted }}>Agent</span>
                      <span className="text-[10px] font-mono" style={{ color: T.dim }}>{selectedEntry.provenance.agent_id}</span>
                    </div>
                  )}
                  {selectedEntry.provenance.session_id && (
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: T.muted }}>Session</span>
                      <span className="text-[10px] font-mono" style={{ color: T.dim }}>{selectedEntry.provenance.session_id}</span>
                    </div>
                  )}
                  {selectedEntry.provenance.written_for_run && (
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: T.muted }}>Run</span>
                      <span className="text-[10px] font-mono" style={{ color: T.dim }}>{selectedEntry.provenance.written_for_run}</span>
                    </div>
                  )}
                  {selectedEntry.proof_packet_id && (
                    <div className="flex justify-between">
                      <span className="text-[10px]" style={{ color: T.muted }}>Proof</span>
                      <span className="text-[10px] font-mono" style={{ color: T.accent }}>{selectedEntry.proof_packet_id}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono mb-3" style={{ color: T.muted }}>
                  <span>{new Date(selectedEntry.created_at).toLocaleDateString()}</span>
                  {selectedEntry.artifact_id && <span>artifact: {selectedEntry.artifact_id}</span>}
                </div>

                {selectedEntry.tier === 'auto-memory' && !selectedEntry.redacted && (
                  <button
                    type="button"
                    onClick={() => handleRedact(selectedEntry.id)}
                    disabled={redactPending === selectedEntry.id}
                    className="w-full text-[11px] font-mono py-1.5 rounded transition-colors"
                    style={{
                      backgroundColor: 'rgba(245,245,245,0.05)',
                      color: redactPending === selectedEntry.id ? T.muted : '#f5f5f5',
                      border: '1px solid rgba(245,245,245,0.15)',
                    }}
                  >
                    {redactPending === selectedEntry.id ? 'REDACTING… (covenant gate)' : 'REDACT ENTRY'}
                  </button>
                )}
                {selectedEntry.tier === 'org-constitution' && (
                  <div className="text-[10px] text-center py-1.5 rounded" style={{ backgroundColor: 'rgba(176,141,82,0.06)', color: T.gold, border: '1px solid rgba(176,141,82,0.15)' }}>
                    IMMUTABLE — constitutional entry cannot be modified
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <SectionTitle>Governance Rules</SectionTitle>
              <div className="p-3 rounded border" style={{ borderColor: T.border, backgroundColor: T.surface }}>
                {[
                  'No cross-operator memory sharing without Covenant Layer permission',
                  'All memory access logged to Proof Ledger',
                  'Auto-memory entries written only by registered hooks',
                  'Org-constitution tier immutable per release',
                  'Memory provenance hash computed on every write',
                  'PII/classified data redacted before auto-memory storage',
                  'Memory access audit trail retained 90 days',
                  'Redaction action requires covenant policy gate pass',
                ].map(rule => (
                  <div key={rule} className="flex items-start gap-2 py-1.5 border-b last:border-0" style={{ borderColor: T.border }}>
                    <span className="text-[10px] mt-0.5 shrink-0" style={{ color: T.accent }}>✓</span>
                    <span className="text-[11px]" style={{ color: T.dim }}>{rule}</span>
                  </div>
                ))}
              </div>

              <SectionTitle>Tier Comparison</SectionTitle>
              <div className="rounded border overflow-hidden" style={{ borderColor: T.border }}>
                <div className="grid grid-cols-3 gap-0 text-[10px] font-mono">
                  {[
                    ['Property', 'Org Constitution', 'Project Doctrine', 'Auto-Memory'],
                    ['Writable by', 'Release system', 'Operators', 'Hooks only'],
                    ['Redactable', 'No', 'No (versioned)', 'Yes + proof'],
                    ['Scope', 'All artifacts', 'Per-artifact', 'Per-session'],
                    ['Source', 'mythosDoctrine', 'CLAUDE.md-style', 'PostToolUse hook'],
                    ['Audit', 'Immutable', 'Versioned', 'Proof-chained'],
                  ].map((row, i) => (
                    <div key={i} className="contents">
                      {row.map((cell, j) => (
                        <div
                          key={j}
                          className="p-2 border-b border-r last:border-r-0"
                          style={{
                            borderColor: T.border,
                            backgroundColor: i === 0 ? 'rgba(255,255,255,0.04)' : 'transparent',
                            color: i === 0 ? T.dim : j === 0 ? T.muted : T.dim,
                            fontWeight: i === 0 || j === 0 ? '500' : '400',
                          }}
                        >
                          {cell}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
