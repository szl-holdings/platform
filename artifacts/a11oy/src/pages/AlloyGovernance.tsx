import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { T } from './alloy-theme';
import { AlloyTopBar } from './AlloyTopBar';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (path: string) => `${BASE}${path}`;
const ease = [0.22, 1, 0.36, 1] as const;

type EventType = 'PROOF' | 'POLICY' | 'APPR' | 'AUDIT' | 'AGENT' | 'SYS';

interface GovernanceEvent {
  id: string;
  type: EventType;
  actor: string;
  action: string;
  detail?: string;
  ts: string;
  color: string;
  source: 'proof-chain' | 'covenant' | 'audit';
}

interface RawProofEntry {
  id?: string;
  type?: string;
  actor?: string;
  description?: string;
  action?: string;
  detail?: string;
  createdAt?: string;
  timestamp?: string;
}

interface RawCovenantDecision {
  id?: string;
  action?: string;
  resource?: string;
  effect?: string;
  reason?: string;
  evaluatedAt?: string;
  timestamp?: string;
  actor?: string;
  principal?: string;
}

interface RawAuditEntry {
  id?: string;
  event_type?: string;
  eventType?: string;
  actor?: string;
  user_id?: string;
  description?: string;
  action?: string;
  detail?: string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
}

const TYPE_COLOR: Record<EventType, string> = {
  PROOF: '#c9b787',
  POLICY: '#6366f1',
  APPR: '#10b981',
  AUDIT: '#3b82f6',
  AGENT: '#8b5cf6',
  SYS: '#5a5a5a',
};

function isValidEventType(v: string): v is EventType {
  return Object.keys(TYPE_COLOR).includes(v);
}

function apiBase(): string {
  const base = import.meta.env.BASE_URL ?? '/a11oy/';
  return base.replace('/a11oy/', '/api/');
}

function normalizeProof(entries: RawProofEntry[]): GovernanceEvent[] {
  return entries.map((e) => {
    const rawType = typeof e.type === 'string' ? e.type.toUpperCase() : 'PROOF';
    const type: EventType = isValidEventType(rawType) ? rawType : 'PROOF';
    return {
      id: e.id ?? `proof-${Math.random().toString(36).slice(2)}`,
      type,
      actor: e.actor ?? 'system',
      action: e.description ?? e.action ?? 'Proof chain entry',
      detail: e.detail,
      ts: e.createdAt ?? e.timestamp ?? new Date().toISOString(),
      color: TYPE_COLOR[type],
      source: 'proof-chain' as const,
    };
  });
}

function normalizeCovenant(decisions: RawCovenantDecision[]): GovernanceEvent[] {
  return decisions.map((d) => ({
    id: d.id ?? `cov-${Math.random().toString(36).slice(2)}`,
    type: 'POLICY' as const,
    actor: d.actor ?? d.principal ?? 'policy-engine',
    action: `${d.effect ?? 'evaluate'}: ${d.action ?? 'action'} on ${d.resource ?? 'resource'}`,
    detail: d.reason,
    ts: d.evaluatedAt ?? d.timestamp ?? new Date().toISOString(),
    color: TYPE_COLOR.POLICY,
    source: 'covenant' as const,
  }));
}

function normalizeAudit(entries: RawAuditEntry[]): GovernanceEvent[] {
  return entries.map((e) => {
    const rawType = (e.event_type ?? e.eventType ?? 'AUDIT').toUpperCase();
    const type: EventType = isValidEventType(rawType) ? rawType : 'AUDIT';
    return {
      id: e.id ?? `audit-${Math.random().toString(36).slice(2)}`,
      type,
      actor: e.actor ?? e.user_id ?? 'system',
      action: e.description ?? e.action ?? 'Audit event',
      detail: e.detail,
      ts: e.created_at ?? e.createdAt ?? e.timestamp ?? new Date().toISOString(),
      color: TYPE_COLOR[type],
      source: 'audit' as const,
    };
  });
}

function GovernanceRow({ entry, i }: { entry: GovernanceEvent; i: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.04 * i }}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 8, overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded((e) => !e)}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.875rem 1rem',
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 6,
          background: `${entry.color}14`, border: `1px solid ${entry.color}28`,
          fontSize: 10, fontFamily: T.mono, fontWeight: 700, color: entry.color,
          flexShrink: 0,
        }}>
          {entry.type}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.8125rem', color: '#e0e0e0', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {entry.action}
          </div>
          <div style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono, marginTop: '0.1875rem' }}>
            {entry.actor}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{
            fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted,
            padding: '0.125rem 0.375rem',
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
            borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{entry.source}</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: T.textMuted, fontFamily: T.mono }}>
              {new Date(entry.ts).toLocaleTimeString()}
            </div>
            <div style={{ fontSize: '0.625rem', color: T.textMuted }}>
              {new Date(entry.ts).toLocaleDateString()}
            </div>
          </div>
          <span style={{
            fontSize: 10, color: T.textMuted,
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>▼</span>
        </div>
      </div>
      {expanded && entry.detail && (
        <div style={{
          padding: '0.875rem 1rem',
          borderTop: `1px solid ${T.border}`,
          background: 'rgba(0,0,0,0.15)',
        }}>
          <p style={{
            fontSize: '0.8125rem', color: T.textDim,
            lineHeight: 1.6, margin: 0, fontFamily: T.mono,
          }}>
            {entry.detail}
          </p>
        </div>
      )}
    </motion.div>
  );
}

type LoadState = 'loading' | 'empty' | 'error' | 'ready';

interface SourceStatus {
  proofChain: 'ok' | 'error' | 'pending';
  covenant: 'ok' | 'error' | 'pending';
  audit: 'ok' | 'error' | 'pending';
}

export function AlloyGovernance() {
  const [entries, setEntries] = useState<GovernanceEvent[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState('');
  const [sourceStatus, setSourceStatus] = useState<SourceStatus>({
    proofChain: 'pending', covenant: 'pending', audit: 'pending',
  });

  useEffect(() => {
    const api = apiBase();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const fetchProofChain = fetch(`${api}proof-chain/recent?limit=30`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<RawProofEntry[]>;
      })
      .then((data) => {
        setSourceStatus((s) => ({ ...s, proofChain: 'ok' }));
        return Array.isArray(data) ? normalizeProof(data) : [];
      })
      .catch(() => {
        setSourceStatus((s) => ({ ...s, proofChain: 'error' }));
        return [] as GovernanceEvent[];
      });

    const fetchCovenant = fetch(`${api}covenant/decisions?limit=20`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<RawCovenantDecision[]>;
      })
      .then((data) => {
        setSourceStatus((s) => ({ ...s, covenant: 'ok' }));
        return Array.isArray(data) ? normalizeCovenant(data) : [];
      })
      .catch(() => {
        setSourceStatus((s) => ({ ...s, covenant: 'error' }));
        return [] as GovernanceEvent[];
      });

    const fetchAudit = fetch(`${api}audit/events?limit=20`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<RawAuditEntry[]>;
      })
      .then((data) => {
        setSourceStatus((s) => ({ ...s, audit: 'ok' }));
        return Array.isArray(data) ? normalizeAudit(data) : [];
      })
      .catch(() => {
        setSourceStatus((s) => ({ ...s, audit: 'error' }));
        return [] as GovernanceEvent[];
      });

    Promise.all([fetchProofChain, fetchCovenant, fetchAudit])
      .then(([proofEvents, covenantEvents, auditEvents]) => {
        clearTimeout(timer);
        const all = [...proofEvents, ...covenantEvents, ...auditEvents]
          .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
        if (all.length === 0) {
          setLoadState('empty');
        } else {
          setEntries(all);
          setLoadState('ready');
        }
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        setErrorMsg(err instanceof Error ? err.message : 'Unable to reach governance APIs.');
        setLoadState('error');
      });

    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  const filtered = entries
    .filter((e) => typeFilter === 'all' || e.type === typeFilter)
    .filter((e) => sourceFilter === 'all' || e.source === sourceFilter);

  const sourceDot = (status: 'ok' | 'error' | 'pending') =>
    status === 'ok' ? '#10b981' : status === 'error' ? '#ef4444' : '#f59e0b';

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.sans }}>
      <AlloyTopBar backLabel="Alloy" backHref={b('/hub')} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '5rem clamp(1.25rem, 5vw, 4rem) 3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          style={{ marginBottom: '2.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800, color: T.text, letterSpacing: '-0.04em',
            }}>
              Evidence Stream
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: sourceDot(sourceStatus.proofChain) }} />
                <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>Proof</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: sourceDot(sourceStatus.covenant) }} />
                <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>Policy</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: sourceDot(sourceStatus.audit) }} />
                <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>Audit</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.9375rem', color: T.textDim, maxWidth: '52ch', marginBottom: '1.5rem' }}>
            Every consequential action in the ecosystem — immutable, cryptographically verifiable,
            audit-ready. Aggregated from Proof Chain, Covenant Policy Engine, and Audit Events. Click any entry to expand its detail.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {(['all', 'PROOF', 'POLICY', 'APPR', 'AUDIT', 'AGENT'] as const).map((t) => {
                const color = t === 'all' ? '#c9b787' : TYPE_COLOR[t as EventType];
                const active = typeFilter === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    style={{
                      padding: '0.3125rem 0.75rem',
                      background: active ? `${color}14` : 'transparent',
                      border: `1px solid ${active ? `${color}40` : T.border}`,
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.75rem', fontWeight: 600,
                      fontFamily: T.mono, letterSpacing: '0.08em',
                      color: active ? color : T.textDim,
                      transition: 'all 0.15s',
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {(['all', 'proof-chain', 'covenant', 'audit'] as const).map((s) => {
                const active = sourceFilter === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSourceFilter(s)}
                    style={{
                      padding: '0.3125rem 0.75rem',
                      background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(255,255,255,0.15)' : T.border}`,
                      borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.6875rem', fontWeight: 500,
                      fontFamily: T.mono,
                      color: active ? T.text : T.textMuted,
                      transition: 'all 0.15s',
                    }}
                  >
                    {s === 'all' ? 'All sources' : s}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {loadState === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                height: 64, borderRadius: 8,
                background: T.surface, border: `1px solid ${T.border}`,
              }} />
            ))}
          </div>
        )}

        {(loadState === 'error' || loadState === 'empty') && (
          <div style={{
            padding: '4rem 2rem', textAlign: 'center',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
              fontSize: 18, marginBottom: '1rem',
            }}>
              {loadState === 'error' ? '⚡' : '◯'}
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: T.text, marginBottom: '0.375rem' }}>
              {loadState === 'error' ? 'Governance APIs unavailable' : 'No events recorded yet'}
            </p>
            <p style={{ fontSize: '0.8125rem', color: T.textDim, maxWidth: '40ch', margin: '0 auto 1rem' }}>
              {loadState === 'error'
                ? errorMsg || 'The Proof Chain, Covenant Policy Engine, and Audit APIs are not reachable. Check your API server connection.'
                : 'Governance events will appear here as agents execute, approvals are processed, and policies are evaluated.'}
            </p>
            {loadState === 'error' && (
              <button
                type="button"
                onClick={() => { setLoadState('loading'); setErrorMsg(''); window.location.reload(); }}
                style={{
                  padding: '0.5rem 1.25rem', background: T.surface,
                  border: `1px solid ${T.border}`, borderRadius: 6,
                  cursor: 'pointer', fontSize: '0.8125rem', color: T.textDim,
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {loadState === 'ready' && (
          <>
            {filtered.length === 0 ? (
              <div style={{
                padding: '3rem 2rem', textAlign: 'center',
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 12,
              }}>
                <p style={{ fontSize: '0.875rem', color: T.textDim, marginBottom: '0.375rem' }}>
                  No events match this filter.
                </p>
                <button
                  type="button"
                  onClick={() => { setTypeFilter('all'); setSourceFilter('all'); }}
                  style={{
                    marginTop: '0.75rem', padding: '0.5rem 1rem',
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 6, cursor: 'pointer',
                    fontSize: '0.8125rem', color: T.textDim,
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filtered.map((entry, i) => (
                  <GovernanceRow key={entry.id} entry={entry} i={i} />
                ))}
              </div>
            )}

            <div style={{
              marginTop: '2rem', padding: '1rem',
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.75rem',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.75rem', color: T.textMuted, fontFamily: T.mono }}>
                {filtered.length} events · 3 sources aggregated
              </span>
              <span style={{ flex: 1 }} />
              <Link href={b('/proof')} style={{
                fontSize: '0.75rem', color: T.accent, textDecoration: 'none',
              }}>
                View full Proof Ledger →
              </Link>
              <Link href={b('/thesis')} style={{
                fontSize: '0.75rem', color: T.accent, textDecoration: 'none',
              }}>
                Read the Ouroboros Thesis v9 →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
