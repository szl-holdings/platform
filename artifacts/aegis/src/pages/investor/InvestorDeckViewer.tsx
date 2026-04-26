import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Camera,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Lock,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import manifest from '@/data/slides-manifest.json';
import {
  type DeckCopyOverrides,
  type DeckSnapshot,
  type LiveMetrics,
  investorDeckApi,
  loadCopyOverrides,
} from '../../lib/investor-deck-api';
import { FALLBACK_METRICS, useLiveMetrics } from '../../hooks/useLiveMetrics';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

type ManifestEntry = {
  id: string;
  position: number;
  title: string;
  description: string;
};
const SLIDES = (manifest as ManifestEntry[])
  .slice()
  .sort((a, b) => a.position - b.position);
const TOTAL = SLIDES.length;

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  value: string | number | null;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
}

function MetricCard({ label, value, sub, accent = '#0cc8d9', icon }: MetricCardProps) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accent}28`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && (
          <span style={{ color: accent, opacity: 0.75, display: 'flex' }}>{icon}</span>
        )}
        <span
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.45)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: value != null ? '#f0ece6' : 'rgba(255,255,255,0.3)',
          fontFamily: "'Sora', sans-serif",
          letterSpacing: '-0.02em',
        }}
      >
        {value ?? '—'}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live metrics panel
// ---------------------------------------------------------------------------

function LiveMetricsPanel({
  metrics,
  isLive,
  snapshotLabel,
  snapshotCreatedAt,
}: {
  metrics: LiveMetrics;
  isLive: boolean;
  snapshotLabel?: string;
  snapshotCreatedAt?: string;
}) {
  const fetchedDate = new Date(metrics.fetchedAt);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          background: isLive ? 'rgba(34,197,94,0.08)' : 'rgba(245,166,35,0.08)',
          border: `1px solid ${isLive ? 'rgba(34,197,94,0.25)' : 'rgba(245,166,35,0.25)'}`,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isLive ? '#22c55e' : '#f5a623',
            boxShadow: isLive ? '0 0 6px #22c55e' : '0 0 6px #f5a623',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            color: isLive ? '#86efac' : '#fcd34d',
            fontWeight: 500,
          }}
        >
          {isLive ? 'Live' : snapshotLabel ?? 'Snapshot'}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            marginLeft: 'auto',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {isLive
            ? fetchedDate.toLocaleTimeString()
            : snapshotCreatedAt
              ? new Date(snapshotCreatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''}
        </div>
      </div>

      {/* Business metrics */}
      <div
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Inter, sans-serif',
          paddingLeft: 2,
        }}
      >
        Business
      </div>

      <MetricCard
        label="ARR"
        value={metrics.arr}
        sub={
          metrics.mrrGrowthPct != null
            ? `MoM growth: +${metrics.mrrGrowthPct.toFixed(1)}%`
            : undefined
        }
        accent="#0cc8d9"
        icon={<TrendingUp size={13} />}
      />
      <MetricCard
        label="MRR"
        value={metrics.mrr}
        accent="#0cc8d9"
        icon={<BarChart3 size={13} />}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricCard
          label="Customers"
          value={metrics.customers}
          accent="#0cc8d9"
          icon={<Users size={12} />}
        />
        <MetricCard
          label="NRR"
          value={metrics.nrr != null ? `${metrics.nrr}%` : null}
          accent="#0cc8d9"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricCard
          label="Churn"
          value={metrics.churnRatePct != null ? `${metrics.churnRatePct.toFixed(1)}%` : null}
          accent="#f5a623"
        />
        <MetricCard
          label="Uptime"
          value={`${metrics.platformUptime}%`}
          accent="#22c55e"
          icon={<Zap size={12} />}
        />
      </div>

      {/* Security metrics */}
      <div
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Inter, sans-serif',
          paddingLeft: 2,
          marginTop: 4,
        }}
      >
        Security
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricCard
          label="Open Criticals"
          value={metrics.openCriticals}
          accent="#ef4444"
          icon={<Shield size={12} />}
        />
        <MetricCard
          label="Compliance"
          value={metrics.compliancePct != null ? `${metrics.compliancePct}%` : null}
          accent="#22c55e"
          icon={<CheckCircle size={12} />}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricCard
          label="MTTR"
          value={metrics.meanTimeToRespondMin != null ? `${metrics.meanTimeToRespondMin}m` : null}
          accent="#0cc8d9"
          icon={<Clock size={12} />}
        />
        <MetricCard
          label="Risk Score"
          value={metrics.aggregateRisk}
          accent={
            metrics.aggregateRisk == null
              ? '#888'
              : metrics.aggregateRisk < 30
                ? '#22c55e'
                : metrics.aggregateRisk < 60
                  ? '#f5a623'
                  : '#ef4444'
          }
          icon={<Lock size={12} />}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide copy override display
// ---------------------------------------------------------------------------

type SlideOverride = DeckCopyOverrides[string];

function SlideOverrideSection({
  slideId,
  overrides,
}: {
  slideId: string;
  overrides: DeckCopyOverrides;
}) {
  const o: SlideOverride | undefined = overrides[slideId];
  if (!o || (!o.headline && !o.subhead && !o.body)) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(245,166,35,0.6)',
          fontFamily: 'Inter, sans-serif',
          paddingLeft: 2,
        }}
      >
        Slide Copy Override
      </div>
      {o.headline && (
        <div
          style={{
            background: 'rgba(245,166,35,0.06)',
            border: '1px solid rgba(245,166,35,0.15)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: 9, color: 'rgba(245,166,35,0.5)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Headline</div>
          <div style={{ fontSize: 12, color: '#f0ece6', fontFamily: "'Sora', sans-serif" }}>{o.headline}</div>
        </div>
      )}
      {o.subhead && (
        <div
          style={{
            background: 'rgba(245,166,35,0.06)',
            border: '1px solid rgba(245,166,35,0.15)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: 9, color: 'rgba(245,166,35,0.5)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subhead</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif' }}>{o.subhead}</div>
        </div>
      )}
      {o.body && (
        <div
          style={{
            background: 'rgba(245,166,35,0.06)',
            border: '1px solid rgba(245,166,35,0.15)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: 9, color: 'rgba(245,166,35,0.5)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Body</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>{o.body}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snapshot creation dialog
// ---------------------------------------------------------------------------

function SnapshotDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (s: DeckSnapshot) => void;
}) {
  const [label, setLabel] = useState(
    `Investor Meeting — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
  );
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      investorDeckApi.createSnapshot(label, loadCopyOverrides() as Record<string, unknown>),
    onSuccess: (snap) => {
      queryClient.invalidateQueries({ queryKey: ['aegis-investor-snapshots'] });
      onCreated(snap);
    },
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0e1520',
          border: '1px solid rgba(12,200,217,0.3)',
          borderRadius: 14,
          padding: 28,
          width: 440,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{ fontSize: 16, fontWeight: 700, color: '#f0ece6', fontFamily: "'Sora', sans-serif" }}
        >
          Snapshot This Deck
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
          Freezes all live metrics and copy as of right now. Use this before a meeting so the deck
          never changes mid-presentation.
        </div>
        <div>
          <label
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'Inter, sans-serif',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Label
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '9px 12px',
              color: '#f0ece6',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '8px 16px',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !label.trim()}
            style={{
              background: 'rgba(12,200,217,0.18)',
              border: '1px solid rgba(12,200,217,0.4)',
              borderRadius: 8,
              padding: '8px 20px',
              color: '#0cc8d9',
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: mutation.isPending ? 'not-allowed' : 'pointer',
              opacity: mutation.isPending ? 0.6 : 1,
            }}
          >
            {mutation.isPending ? 'Freezing…' : 'Freeze Deck'}
          </button>
        </div>
        {mutation.isError && (
          <div style={{ fontSize: 12, color: '#f87171', fontFamily: 'Inter, sans-serif' }}>
            {(mutation.error as Error).message}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share dialog
// ---------------------------------------------------------------------------

function ShareDialog({
  snapshot,
  onClose,
}: {
  snapshot: DeckSnapshot;
  onClose: () => void;
}) {
  const [recipient, setRecipient] = useState('');
  const [ttlDays, setTtlDays] = useState(30);
  const [result, setResult] = useState<{ token: string; expiresAt: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => investorDeckApi.createShare(snapshot.id, recipient || 'Investor', ttlDays),
    onSuccess: (data) => setResult(data),
  });

  const shareUrl = result
    ? `${window.location.origin}${BASE}/share?token=${result.token}`
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0e1520',
          border: '1px solid rgba(245,166,35,0.3)',
          borderRadius: 14,
          padding: 28,
          width: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{ fontSize: 16, fontWeight: 700, color: '#f0ece6', fontFamily: "'Sora', sans-serif" }}
        >
          Generate Investor Share Link
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
          Creates a read-only, watermarked link from snapshot <strong style={{ color: '#f5a623' }}>{snapshot.label}</strong>. No login required. Link expires after the selected period.
        </div>

        {!result ? (
          <>
            <div>
              <label style={labelStyle}>Recipient Name</label>
              <input
                placeholder="e.g. Andreessen Horowitz"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Link Expiry</label>
              <select
                value={ttlDays}
                onChange={(e) => setTtlDays(Number(e.target.value))}
                style={inputStyle}
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                style={primaryBtnStyle('#f5a623', mutation.isPending)}
              >
                {mutation.isPending ? 'Generating…' : 'Generate Link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#86efac', fontFamily: 'Inter, sans-serif' }}>
              Share link created — expires {new Date(result.expiresAt).toLocaleDateString()}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <code
                style={{
                  fontSize: 12,
                  color: '#f0ece6',
                  fontFamily: "'JetBrains Mono', monospace",
                  flex: 1,
                  wordBreak: 'break-all',
                }}
              >
                {shareUrl}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(shareUrl ?? '')}
                title="Copy"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0cc8d9',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <ExternalLink size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>
                Done
              </button>
              <button
                type="button"
                onClick={() => window.open(shareUrl ?? '', '_blank', 'noopener')}
                style={primaryBtnStyle('#0cc8d9')}
              >
                Open Link ↗
              </button>
            </div>
          </>
        )}
        {mutation.isError && (
          <div style={{ fontSize: 12, color: '#f87171' }}>
            {(mutation.error as Error).message}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main InvestorDeckViewer
// ---------------------------------------------------------------------------

export interface InvestorDeckViewerProps {
  /** When set, shows frozen snapshot data instead of live metrics */
  snapshot?: DeckSnapshot;
  /** Shows watermark overlay (for share-link mode) */
  watermark?: string;
}

export default function InvestorDeckViewer({ snapshot: snapshotProp, watermark }: InvestorDeckViewerProps) {
  const [current, setCurrent] = useState(1);
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const snapshotIdParam = new URLSearchParams(window.location.search).get('snapshot');

  const { data: fetchedSnapshot } = useQuery({
    queryKey: ['aegis-investor-snapshot', snapshotIdParam],
    queryFn: () => investorDeckApi.getSnapshot(snapshotIdParam!),
    enabled: !!snapshotIdParam && !snapshotProp,
    staleTime: Infinity,
  });

  const snapshot = snapshotProp ?? fetchedSnapshot ?? null;
  const [lastSnapshot, setLastSnapshot] = useState<DeckSnapshot | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const applyScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const scale = w / 1920;
    container.style.height = `${Math.round(1080 * scale)}px`;
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${scale})`;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(() => applyScale());
    obs.observe(container);
    applyScale();
    return () => obs.disconnect();
  }, [applyScale]);

  useEffect(() => {
    applyScale();
  }, [current, applyScale]);

  const { data: liveMetrics, isRefetching, refetch } = useLiveMetrics({ refetchInterval: 60_000 });

  const isLive = snapshot == null && lastSnapshot == null;
  const metrics = snapshot?.metrics ?? lastSnapshot?.metrics ?? liveMetrics ?? FALLBACK_METRICS;

  const activeOverrides: DeckCopyOverrides = (snapshot?.copyOverrides as DeckCopyOverrides) ?? loadCopyOverrides();

  const goTo = useCallback(
    (n: number) => setCurrent(Math.min(Math.max(n, 1), TOTAL)),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(current - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, goTo]);

  const slide = SLIDES[current - 1];
  const slideUrl = `${BASE}/slides/${current}?embed=1`;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #07080d 0%, #0a1322 100%)',
        color: '#e2e8f0',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(7,8,13,0.9)',
          backdropFilter: 'blur(8px)',
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'rgba(12,200,217,0.7)',
              marginBottom: 1,
            }}
          >
            Aegis · Investor Deck
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {slide?.title ?? ''} · {current} / {TOTAL}
          </div>
        </div>

        {!snapshot && (
          <>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              title="Refresh metrics"
              style={iconBtnStyle}
            >
              <RefreshCw size={14} style={{ opacity: isRefetching ? 0.4 : 1 }} />
            </button>
            <button
              type="button"
              onClick={() => setShowSnapshotDialog(true)}
              style={headerBtnStyle('rgba(12,200,217,0.12)', '#0cc8d9')}
            >
              <Camera size={13} />
              Snapshot
            </button>
            {lastSnapshot && (
              <button
                type="button"
                onClick={() => setShowShareDialog(true)}
                style={headerBtnStyle('rgba(245,166,35,0.12)', '#f5a623')}
              >
                <ExternalLink size={13} />
                Share
              </button>
            )}
          </>
        )}

        {snapshot && watermark && (
          <div
            style={{
              fontSize: 11,
              color: 'rgba(245,166,35,0.7)',
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Lock size={11} />
            CONFIDENTIAL · INVESTOR USE ONLY
          </div>
        )}
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Slide frame */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            position: 'relative',
          }}
        >
          {/* Navigation controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current <= 1}
              style={navBtnStyle(current <= 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div style={{ display: 'flex', gap: 4 }}>
              {SLIDES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.position)}
                  title={s.title}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    border:
                      s.position === current
                        ? '1px solid rgba(12,200,217,0.7)'
                        : '1px solid rgba(255,255,255,0.12)',
                    background:
                      s.position === current ? 'rgba(12,200,217,0.25)' : 'rgba(255,255,255,0.04)',
                    color:
                      s.position === current ? '#0cc8d9' : 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {s.position}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current >= TOTAL}
              style={navBtnStyle(current >= TOTAL)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Slide iframe */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              margin: '0 16px 16px',
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#000',
              width: '100%',
            }}
          >
            <iframe
              ref={iframeRef}
              key={current}
              src={slideUrl}
              title={slide?.title ?? `Slide ${current}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '1920px',
                height: '1080px',
                transformOrigin: 'top left',
                transform: 'scale(0.5)',
                border: 'none',
                pointerEvents: 'none',
              }}
              scrolling="no"
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* Watermark overlay */}
            {watermark && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    transform: 'rotate(-35deg)',
                    fontSize: 'clamp(12px, 2.5vw, 28px)',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(245,166,35,0.14)',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    textShadow: 'none',
                  }}
                >
                  CONFIDENTIAL · {watermark} · INVESTOR USE ONLY
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live metrics sidebar */}
        <aside
          style={{
            width: 280,
            flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <LiveMetricsPanel
            metrics={metrics}
            isLive={isLive}
            snapshotLabel={snapshot?.label ?? lastSnapshot?.label}
            snapshotCreatedAt={snapshot?.createdAt ?? lastSnapshot?.createdAt}
          />
          {slide && (
            <div style={{ marginTop: 8 }}>
              <SlideOverrideSection
                slideId={slide.id}
                overrides={activeOverrides}
              />
            </div>
          )}
        </aside>
      </div>

      {/* Dialogs */}
      {showSnapshotDialog && (
        <SnapshotDialog
          onClose={() => setShowSnapshotDialog(false)}
          onCreated={(snap) => {
            setLastSnapshot(snap);
            setShowSnapshotDialog(false);
          }}
        />
      )}
      {showShareDialog && lastSnapshot && (
        <ShareDialog
          snapshot={lastSnapshot}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const labelStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'rgba(255,255,255,0.45)',
  display: 'block',
  marginBottom: 6,
};

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#f0ece6',
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const cancelBtnStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  padding: '8px 16px',
  color: 'rgba(255,255,255,0.6)',
  fontFamily: 'Inter, sans-serif',
  fontSize: 13,
  cursor: 'pointer',
};

function primaryBtnStyle(color: string, disabled = false): CSSProperties {
  return {
    background: `${color}22`,
    border: `1px solid ${color}55`,
    borderRadius: 8,
    padding: '8px 20px',
    color,
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };
}

const iconBtnStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  padding: '6px 8px',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

function headerBtnStyle(bg: string, color: string): CSSProperties {
  return {
    background: bg,
    border: `1px solid ${color}44`,
    borderRadius: 8,
    padding: '6px 14px',
    color,
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    letterSpacing: '0.02em',
  };
}

function navBtnStyle(disabled: boolean): CSSProperties {
  return {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 7,
    padding: '6px 12px',
    color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };
}
