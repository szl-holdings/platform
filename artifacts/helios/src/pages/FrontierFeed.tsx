import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  Building2,
  ChevronDown,
  ExternalLink,
  Filter,
  Radar,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { heliosApi, type Signal, type SignalKind } from '../lib/api';

const KIND_META: Record<SignalKind, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  capability: { label: 'Capability', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', Icon: Zap },
  market:     { label: 'Market',     color: '#34d399', bg: 'rgba(52,211,153,0.1)',  Icon: TrendingUp },
  threat:     { label: 'Threat',     color: '#f87171', bg: 'rgba(248,113,113,0.1)', Icon: AlertTriangle },
  regulation: { label: 'Regulation', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', Icon: Shield },
  vendor:     { label: 'Vendor',     color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  Icon: Building2 },
  benchmark:  { label: 'Benchmark',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  Icon: BarChart2 },
};

const SCANNER_LABELS: Record<string, string> = {
  github:     'GitHub',
  arxiv:      'arXiv',
  conference: 'Conferences',
  vendor:     'Vendors',
  market:     'Market Intel',
  mena:       'MENA AI',
};

function ConfidencePip({ value }: { value: number }) {
  const color = value >= 0.8 ? '#34d399' : value >= 0.6 ? '#f59e0b' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 48, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: '0.67rem', color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const [expanded, setExpanded] = useState(false);
  const meta = KIND_META[signal.kind];
  const { Icon } = meta;

  return (
    <div
      className="section-card animate-fadeIn"
      style={{ marginBottom: 10, transition: 'border-color 0.2s', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Kind icon */}
          <div style={{
            width: 30, height: 30, borderRadius: 6,
            background: meta.bg, border: `1px solid ${meta.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
          }}>
            <Icon size={13} color={meta.color} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px',
                background: meta.bg, color: meta.color,
                border: `1px solid ${meta.color}30`, borderRadius: 4,
                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {meta.label}
              </span>
              <span style={{ fontSize: '0.67rem', color: 'var(--helios-text-muted)', fontFamily: 'monospace' }}>
                {SCANNER_LABELS[signal.scanner] ?? signal.scanner}
              </span>
              <span style={{ fontSize: '0.67rem', color: 'var(--helios-text-muted)', marginLeft: 'auto' }}>
                {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
              </span>
            </div>

            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--helios-text)', marginBottom: 4, lineHeight: 1.4 }}>
              {signal.title}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--helios-text-dim)', lineHeight: 1.5, marginBottom: 8 }}>
              {signal.summary}
            </div>

            {/* So what */}
            <div style={{
              padding: '7px 10px', borderRadius: 5,
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
              fontSize: '0.78rem', color: 'var(--helios-amber)', lineHeight: 1.4,
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 6 }}>So What:</span>
              {signal.soWhat}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <ConfidencePip value={signal.confidence} />
            <ChevronDown size={13} color="var(--helios-text-muted)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--helios-border)' }}>
            {/* Entities */}
            {signal.entities.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 6 }}>
                  Entities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {signal.entities.map((e) => (
                    <span key={e} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: '0.72rem', color: 'var(--helios-text-dim)' }}>
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Affected agents */}
            {signal.affectedAgents.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 6 }}>
                  Portfolio Impact
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {signal.affectedAgents.map((a) => (
                    <span key={a} style={{ padding: '2px 8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, fontSize: '0.72rem', color: 'var(--helios-amber)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Claims */}
            {signal.claims.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 6 }}>
                  Extracted Claims
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {signal.claims.map((c, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: 'var(--helios-text-dim)' }}>
                      <span style={{ color: 'var(--helios-amber)', flexShrink: 0 }}>·</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source */}
            <a
              href={signal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 5, fontSize: '0.72rem', color: 'var(--helios-text-dim)',
                textDecoration: 'none', transition: 'color 0.15s',
              }}
            >
              <BookOpen size={11} />
              {signal.sourceName}
              <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function KindFilter({ active, onChange }: { active: SignalKind | null; onChange: (k: SignalKind | null) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button
        onClick={() => onChange(null)}
        style={{
          padding: '5px 12px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
          background: active === null ? 'rgba(245,158,11,0.12)' : 'transparent',
          color: active === null ? '#f59e0b' : 'var(--helios-text-muted)',
          borderColor: active === null ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)',
        }}
      >
        All
      </button>
      {(Object.keys(KIND_META) as SignalKind[]).map((k) => {
        const meta = KIND_META[k];
        return (
          <button
            key={k}
            onClick={() => onChange(k)}
            style={{
              padding: '5px 12px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: active === k ? meta.bg : 'transparent',
              color: active === k ? meta.color : 'var(--helios-text-muted)',
              borderColor: active === k ? `${meta.color}40` : 'rgba(255,255,255,0.08)',
            }}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

export default function FrontierFeed() {
  const [kindFilter, setKindFilter] = useState<SignalKind | null>(null);
  const [search, setSearch] = useState('');
  const [page] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['signals', kindFilter, page, search],
    queryFn: () => heliosApi.getSignals({ kind: kindFilter ?? undefined, page, pageSize: 20, q: search || undefined }),
  });

  const { data: stats } = useQuery({
    queryKey: ['helios-stats'],
    queryFn: () => heliosApi.getStats(),
    refetchInterval: 60_000,
  });

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radar size={20} color="var(--helios-amber)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '-0.01em' }}>
              Frontier Feed
            </h1>
          </div>
          <button
            onClick={() => refetch()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 6, fontSize: '0.75rem', color: 'var(--helios-amber)', cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} className={isFetching ? 'spin' : ''} />
            Refresh
          </button>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--helios-text-muted)', lineHeight: 1.5 }}>
          Live stream of structured signals extracted from GitHub, arXiv, conferences, vendor announcements, and market intelligence.
        </p>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Signals Today', value: stats.signalsToday, color: '#f59e0b' },
            { label: 'Open Proposals', value: stats.proposalsOpen, color: '#34d399' },
            { label: 'Active Scanners', value: stats.scannersActive, color: '#60a5fa' },
            { label: 'Avg Confidence', value: `${Math.round(stats.avgConfidence * 100)}%`, color: '#a78bfa' },
          ].map((s) => (
            <div key={s.label} className="section-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--helios-text-muted)', marginTop: 4, fontWeight: 500, letterSpacing: '0.04em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--helios-text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search signals, entities, vendors…"
            style={{
              width: '100%', padding: '8px 12px 8px 34px',
              background: 'var(--helios-card)', border: '1px solid var(--helios-border)',
              borderRadius: 6, fontSize: '0.825rem', color: 'var(--helios-text)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={12} color="var(--helios-text-muted)" />
          <KindFilter active={kindFilter} onChange={setKindFilter} />
        </div>
      </div>

      {/* Signal list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="section-card" style={{ padding: 16, opacity: 0.5 }}>
              <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 8, width: '60%' }} />
              <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '90%' }} />
            </div>
          ))}
        </div>
      ) : data?.signals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--helios-text-muted)' }}>
          <Radar size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No signals found</div>
          <div style={{ fontSize: '0.825rem' }}>Try adjusting filters or refreshing to pull latest scanner output.</div>
        </div>
      ) : (
        <div>
          {data?.signals.map((s) => (
            <SignalCard key={s.id} signal={s} />
          ))}
          {data && (
            <div style={{ fontSize: '0.72rem', color: 'var(--helios-text-muted)', textAlign: 'center', marginTop: 8 }}>
              Showing {data.signals.length} of {data.total} signals
            </div>
          )}
        </div>
      )}
    </div>
  );
}
