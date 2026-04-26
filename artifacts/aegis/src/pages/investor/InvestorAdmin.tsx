import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Camera,
  CheckCircle,
  Clock,
  ExternalLink,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { type CSSProperties, useState } from 'react';
import {
  type DeckCopyOverrides,
  type SnapshotSummary,
  investorDeckApi,
  loadCopyOverrides,
  saveCopyOverrides,
} from '../../lib/investor-deck-api';
import { useLiveMetrics } from '../../hooks/useLiveMetrics';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// ---------------------------------------------------------------------------
// Share dialog
// ---------------------------------------------------------------------------

function ShareDialog({
  snapshot,
  onClose,
}: {
  snapshot: SnapshotSummary;
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
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle('#f5a623')} onClick={(e) => e.stopPropagation()}>
        <div style={dialogTitleStyle}>Generate Investor Share Link</div>
        <div style={dialogBodyStyle}>
          From snapshot <strong style={{ color: '#f5a623' }}>{snapshot.label}</strong> (
          {new Date(snapshot.createdAt).toLocaleDateString()}). Creates a read-only, watermarked
          link — no login required.
        </div>

        {!result ? (
          <>
            <div>
              <label style={labelStyle}>Recipient Name (shown on watermark)</label>
              <input
                placeholder="e.g. Sequoia Capital"
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
            <div style={dialogActionsStyle}>
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
            <div style={{ fontSize: 13, color: '#86efac' }}>
              ✓ Link created — expires {new Date(result.expiresAt).toLocaleDateString()}
            </div>
            <div style={copyBoxStyle}>
              <code style={codeStyle}>{shareUrl}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(shareUrl ?? '')}
                title="Copy to clipboard"
                style={iconActionStyle}
              >
                <ExternalLink size={13} />
              </button>
            </div>
            <div style={dialogActionsStyle}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>
                Done
              </button>
              <button
                type="button"
                onClick={() => window.open(shareUrl ?? '', '_blank', 'noopener')}
                style={primaryBtnStyle('#0cc8d9')}
              >
                Open ↗
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
// Snapshot row
// ---------------------------------------------------------------------------

function SnapshotRow({
  snap,
  onShare,
  onDelete,
  onOpen,
}: {
  snap: SnapshotSummary;
  onShare: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
      }}
    >
      <Camera size={15} style={{ color: '#0cc8d9', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#f0ece6',
            fontFamily: "'Sora', sans-serif",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {snap.label}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
          {new Date(snap.createdAt).toLocaleString()} · ARR {snap.arr} · {snap.customers ?? '—'}{' '}
          customers
        </div>
      </div>
      <button type="button" onClick={onOpen} style={rowBtnStyle('#0cc8d9')}>
        Open
      </button>
      <button type="button" onClick={onShare} style={rowBtnStyle('#f5a623')}>
        <ExternalLink size={12} />
        Share
      </button>
      <button type="button" onClick={onDelete} style={rowBtnStyle('#ef4444')}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy editor
// ---------------------------------------------------------------------------

const SLIDE_COPY_FIELDS: Array<{ slideId: string; title: string; fields: string[] }> = [
  {
    slideId: 'sa-0001-4000-8000-000000000001',
    title: 'Cover',
    fields: ['headline', 'subhead'],
  },
  {
    slideId: 'sa-0003-4000-8000-000000000003',
    title: 'Category & Market',
    fields: ['headline', 'subhead', 'body'],
  },
  {
    slideId: 'sa-0010-4000-8000-000000000010',
    title: 'Business Model',
    fields: ['headline', 'subhead', 'body'],
  },
  {
    slideId: 'sa-0011-4000-8000-000000000011',
    title: 'The Ask',
    fields: ['headline', 'subhead', 'body'],
  },
];

function CopyEditor() {
  const [overrides, setOverrides] = useState<DeckCopyOverrides>(() => loadCopyOverrides());
  const [saved, setSaved] = useState(false);

  const set = (slideId: string, field: string, value: string) => {
    setOverrides((prev) => ({
      ...prev,
      [slideId]: { ...(prev[slideId] ?? {}), [field]: value },
    }));
    setSaved(false);
  };

  const save = () => {
    saveCopyOverrides(overrides);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {SLIDE_COPY_FIELDS.map(({ slideId, title, fields }) => (
        <div key={slideId}>
          <div style={sectionSubheadStyle}>{title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {fields.map((field) => (
              <div key={field}>
                <label style={labelStyle}>{field}</label>
                {field === 'body' ? (
                  <textarea
                    value={overrides[slideId]?.[field as keyof (typeof overrides)[string]] ?? ''}
                    onChange={(e) => set(slideId, field, e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                ) : (
                  <input
                    value={overrides[slideId]?.[field as keyof (typeof overrides)[string]] ?? ''}
                    onChange={(e) => set(slideId, field, e.target.value)}
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={save} style={primaryBtnStyle('#0cc8d9')}>
          Save to This Browser
        </button>
        {saved && (
          <span style={{ fontSize: 12, color: '#86efac', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={12} /> Saved
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        Overrides are stored in your browser. Include them in a snapshot to ship with a share link.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main admin page
// ---------------------------------------------------------------------------

export default function InvestorAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'live' | 'snapshots' | 'copy'>('live');
  const [shareTarget, setShareTarget] = useState<SnapshotSummary | null>(null);
  const [showNewSnapshotInput, setShowNewSnapshotInput] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');

  const { data: liveMetrics, isLoading: metricsLoading, refetch, isRefetching } = useLiveMetrics();
  const {
    data: snapshotList,
    isLoading: snapshotsLoading,
    refetch: refetchSnaps,
  } = useQuery({
    queryKey: ['aegis-investor-snapshots'],
    queryFn: () => investorDeckApi.listSnapshots(),
  });

  const createSnap = useMutation({
    mutationFn: () =>
      investorDeckApi.createSnapshot(
        snapshotLabel || `Snapshot ${new Date().toLocaleDateString()}`,
        loadCopyOverrides() as Record<string, unknown>,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aegis-investor-snapshots'] });
      setShowNewSnapshotInput(false);
      setSnapshotLabel('');
      setActiveTab('snapshots');
    },
  });

  const deleteSnap = useMutation({
    mutationFn: (id: string) => investorDeckApi.deleteSnapshot(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aegis-investor-snapshots'] }),
  });

  const metrics = liveMetrics;

  const METRIC_ROWS = metrics
    ? [
        { icon: <TrendingUp size={13} />, label: 'ARR', value: metrics.arr, color: '#0cc8d9' },
        { icon: <BarChart3 size={13} />, label: 'MRR', value: metrics.mrr, color: '#0cc8d9' },
        {
          icon: <Users size={13} />,
          label: 'Customers',
          value: metrics.customers ?? '—',
          color: '#0cc8d9',
        },
        {
          icon: <TrendingUp size={13} />,
          label: 'NRR',
          value: metrics.nrr != null ? `${metrics.nrr}%` : '—',
          color: '#22c55e',
        },
        {
          icon: <Clock size={13} />,
          label: 'MTTR',
          value: metrics.meanTimeToRespondMin != null ? `${metrics.meanTimeToRespondMin}m` : '—',
          color: '#0cc8d9',
        },
        {
          icon: <Shield size={13} />,
          label: 'Open Criticals',
          value: metrics.openCriticals ?? '—',
          color: '#ef4444',
        },
        {
          icon: <CheckCircle size={13} />,
          label: 'Compliance',
          value: metrics.compliancePct != null ? `${metrics.compliancePct}%` : '—',
          color: '#22c55e',
        },
        {
          icon: <Lock size={13} />,
          label: 'Aggregate Risk',
          value: metrics.aggregateRisk ?? '—',
          color: '#f5a623',
        },
      ]
    : [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #07080d 0%, #0a1322 100%)',
        color: '#e2e8f0',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <header style={adminHeaderStyle}>
        <div>
          <div style={adminHeaderEyebrowStyle}>Aegis · Investor Deck Admin</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f0ece6', fontFamily: "'Sora', sans-serif" }}>
            Deck Management
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`${BASE}/investor`} style={linkBtnStyle}>
            Open Live Deck ↗
          </a>
        </div>
      </header>

      {/* Tab bar */}
      <div style={tabBarStyle}>
        {(['live', 'snapshots', 'copy'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={tabStyle(tab === activeTab)}
          >
            {tab === 'live' && 'Live Metrics'}
            {tab === 'snapshots' && `Snapshots${snapshotList ? ` (${snapshotList.length})` : ''}`}
            {tab === 'copy' && 'Copy & Captions'}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={adminMainStyle}>
        {/* ── Live metrics tab ─────────────────────────────────────────── */}
        {activeTab === 'live' && (
          <div>
            <div style={sectionHeadStyle}>
              <span>Platform Metrics — Live</span>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isRefetching || metricsLoading}
                style={smallBtnStyle}
              >
                <RefreshCw size={12} style={{ opacity: isRefetching ? 0.4 : 1 }} />
                {isRefetching ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            {metricsLoading ? (
              <div style={emptyStyle}>Loading metrics…</div>
            ) : (
              <div style={metricsGridStyle}>
                {METRIC_ROWS.map((r) => (
                  <div key={r.label} style={metricTileStyle(r.color)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ color: r.color }}>{r.icon}</span>
                      <span style={metricLabelStyle}>{r.label}</span>
                    </div>
                    <div style={metricValueStyle}>{r.value}</div>
                  </div>
                ))}
              </div>
            )}
            {metrics && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>
                Last fetched: {new Date(metrics.fetchedAt).toLocaleString()}
              </div>
            )}

            <div style={{ marginTop: 28 }}>
              <div style={sectionHeadStyle}>
                <span>Quick Actions</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSnapshotInput(true);
                    setActiveTab('snapshots');
                  }}
                  style={primaryBtnStyle('#0cc8d9')}
                >
                  <Camera size={13} />
                  Snapshot Now
                </button>
                <a href={`${BASE}/investor`} style={primaryBtnStyle('#f5a623')}>
                  <ExternalLink size={13} />
                  Open Live Deck
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Snapshots tab ─────────────────────────────────────────────── */}
        {activeTab === 'snapshots' && (
          <div>
            <div style={sectionHeadStyle}>
              <span>Frozen Snapshots</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => refetchSnaps()}
                  disabled={snapshotsLoading}
                  style={smallBtnStyle}
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSnapshotInput((v) => !v)}
                  style={smallBtnStyle}
                >
                  <Plus size={12} />
                  New Snapshot
                </button>
              </div>
            </div>

            {showNewSnapshotInput && (
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(12,200,217,0.05)',
                  border: '1px solid rgba(12,200,217,0.2)',
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <input
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder={`Investor Meeting — ${new Date().toLocaleDateString()}`}
                  style={{ ...inputStyle, flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => createSnap.mutate()}
                  disabled={createSnap.isPending}
                  style={primaryBtnStyle('#0cc8d9', createSnap.isPending)}
                >
                  {createSnap.isPending ? 'Freezing…' : 'Freeze Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSnapshotInput(false)}
                  style={cancelBtnStyle}
                >
                  Cancel
                </button>
              </div>
            )}

            {snapshotsLoading ? (
              <div style={emptyStyle}>Loading snapshots…</div>
            ) : !snapshotList?.length ? (
              <div style={emptyStyle}>
                No snapshots yet. Create one before your next investor meeting.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {snapshotList.map((snap) => (
                  <SnapshotRow
                    key={snap.id}
                    snap={snap}
                    onShare={() => setShareTarget(snap)}
                    onDelete={() => {
                      if (window.confirm(`Delete "${snap.label}"?`)) {
                        deleteSnap.mutate(snap.id);
                      }
                    }}
                    onOpen={() =>
                      window.open(`${BASE}/investor?snapshot=${snap.id}`, '_blank', 'noopener')
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Copy & captions tab ───────────────────────────────────────── */}
        {activeTab === 'copy' && (
          <div>
            <div style={sectionHeadStyle}>
              <span>Slide Copy & Captions</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
              Override headlines, subheads, and body copy for key slides. These overrides are
              stored in your browser and included when you create a snapshot.
            </div>
            <CopyEditor />
          </div>
        )}
      </main>

      {shareTarget && (
        <ShareDialog snapshot={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

function dialogStyle(accent: string): CSSProperties {
  return {
    background: '#0e1520',
    border: `1px solid ${accent}44`,
    borderRadius: 14,
    padding: 28,
    width: 480,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };
}

const dialogTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: '#f0ece6',
  fontFamily: "'Sora', sans-serif",
};

const dialogBodyStyle: CSSProperties = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.55)',
};

const dialogActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'flex-end',
};

const copyBoxStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '10px 14px',
};

const codeStyle: CSSProperties = {
  fontSize: 11,
  color: '#f0ece6',
  fontFamily: "'JetBrains Mono', monospace",
  flex: 1,
  wordBreak: 'break-all',
};

const iconActionStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#0cc8d9',
  padding: 4,
  display: 'flex',
};

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
    background: `${color}18`,
    border: `1px solid ${color}44`,
    borderRadius: 8,
    padding: '8px 18px',
    color,
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    textDecoration: 'none',
  };
}

function rowBtnStyle(color: string): CSSProperties {
  return {
    background: `${color}10`,
    border: `1px solid ${color}30`,
    borderRadius: 7,
    padding: '5px 10px',
    color,
    fontFamily: 'Inter, sans-serif',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  };
}

const smallBtnStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  padding: '5px 10px',
  color: 'rgba(255,255,255,0.6)',
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
};

const adminHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 28px',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
};

const adminHeaderEyebrowStyle: CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: 'rgba(12,200,217,0.7)',
  marginBottom: 4,
};

const linkBtnStyle: CSSProperties = {
  background: 'rgba(12,200,217,0.08)',
  border: '1px solid rgba(12,200,217,0.25)',
  borderRadius: 8,
  padding: '7px 14px',
  color: '#0cc8d9',
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const tabBarStyle: CSSProperties = {
  display: 'flex',
  gap: 0,
  padding: '0 28px',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
};

function tabStyle(active: boolean): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #0cc8d9' : '2px solid transparent',
    padding: '12px 18px',
    color: active ? '#0cc8d9' : 'rgba(255,255,255,0.45)',
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    marginBottom: -1,
  };
}

const adminMainStyle: CSSProperties = {
  maxWidth: 860,
  margin: '0 auto',
  padding: '28px',
};

const sectionHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
  fontSize: 15,
  fontWeight: 600,
  color: '#e2e8f0',
  fontFamily: "'Sora', sans-serif",
};

const sectionSubheadStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  paddingBottom: 8,
  borderBottom: '1px solid rgba(255,255,255,0.07)',
};

const emptyStyle: CSSProperties = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.4)',
  padding: '24px 0',
  textAlign: 'center',
};

const metricsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 12,
  marginTop: 12,
};

function metricTileStyle(color: string): CSSProperties {
  return {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${color}22`,
    borderRadius: 10,
    padding: '12px 14px',
  };
}

const metricLabelStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: 'rgba(255,255,255,0.4)',
};

const metricValueStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: '#f0ece6',
  fontFamily: "'Sora', sans-serif",
  letterSpacing: '-0.02em',
  marginTop: 4,
};

