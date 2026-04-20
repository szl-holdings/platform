import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  GitCommit,
  History,
  Layers,
  LineChart as LineChartIcon,
  RefreshCw,
  RotateCcw,
  Server,
  TrendingDown,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  type DeploymentRecord,
  useDeploymentHistory,
  useDeployments,
  useDriftHistory,
  useDriftSummary,
  useExecutiveBrief,
  useRollbackDeployment,
} from '../lib/api';

function StatusDot({ status }: { status: 'healthy' | 'degraded' | 'critical' }) {
  const color = status === 'healthy' ? '#4eca8b' : status === 'degraded' ? '#c8a84b' : '#e05050';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}80`,
      }}
    />
  );
}

function severityColor(s: 'info' | 'warning' | 'critical'): string {
  return s === 'critical' ? '#e05050' : s === 'warning' ? '#e08c40' : '#5090e8';
}

function deploymentColor(s: string): string {
  switch (s) {
    case 'active':
      return '#4eca8b';
    case 'deploying':
      return '#5090e8';
    case 'rolled-back':
      return '#c8a84b';
    case 'failed':
      return '#e05050';
    default:
      return '#7a8295';
  }
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="section-card" style={{ padding: 18, ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <h2
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--pulse-text-muted)',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <span style={{ fontSize: '0.7rem', color: 'var(--pulse-text-muted)' }}>· {subtitle}</span>
        )}
      </div>
      {right}
    </div>
  );
}

const DOMAIN_COLORS: Record<string, string> = {
  terra: '#4eca8b',
  prism: '#c8a84b',
  vessels: '#5090e8',
  aegis: '#e05050',
  lyte: '#a070e0',
  imperium: '#e08c40',
  'carlota-jo': '#40c0c0',
  platform: '#7a8295',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {toasts.map((t) => {
        const color = t.kind === 'success' ? '#4eca8b' : '#e05050';
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(15,18,28,0.95)',
              border: `1px solid ${color}66`,
              borderLeft: `3px solid ${color}`,
              color: 'var(--pulse-text)',
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: '0.82rem',
              minWidth: 280,
              maxWidth: 420,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {t.kind === 'success' ? (
              <CheckCircle size={14} color={color} />
            ) : (
              <AlertTriangle size={14} color={color} />
            )}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--pulse-text-muted)',
                cursor: 'pointer',
                display: 'flex',
              }}
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConfirmModal({
  deployment,
  onCancel,
  onConfirm,
  pending,
  errorMessage,
}: {
  deployment: DeploymentRecord;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  errorMessage?: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rollback-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--pulse-bg, #11141d)',
          border: '1px solid var(--pulse-border)',
          borderRadius: 8,
          padding: 22,
          maxWidth: 460,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <RotateCcw size={16} color="#c8a84b" />
          <h3
            id="rollback-modal-title"
            style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--pulse-text)' }}
          >
            Roll back deployment?
          </h3>
        </div>
        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--pulse-text-muted)',
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          This will mark the active deployment as rolled-back and promote the previous version of{' '}
          <strong style={{ color: 'var(--pulse-text)' }}>{deployment.appName}</strong> in{' '}
          <strong style={{ color: 'var(--pulse-text)' }}>{deployment.environment}</strong>.
        </p>
        <div
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid var(--pulse-border)',
            borderRadius: 4,
            padding: 10,
            marginBottom: 14,
            fontSize: '0.78rem',
            color: 'var(--pulse-text-dim)',
          }}
        >
          <div>
            App: <span style={{ color: 'var(--pulse-text)' }}>{deployment.appName}</span>
          </div>
          <div>
            Current version:{' '}
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--pulse-gold)' }}>
              v{deployment.version}
            </span>
          </div>
          <div>
            Deployed by: <span style={{ color: 'var(--pulse-text)' }}>{deployment.deployedBy}</span>
          </div>
        </div>
        {errorMessage && (
          <div
            style={{
              background: 'rgba(224,80,80,0.1)',
              borderLeft: '2px solid #e05050',
              padding: '8px 10px',
              marginBottom: 12,
              fontSize: '0.78rem',
              color: '#e05050',
              borderRadius: 4,
            }}
          >
            {errorMessage}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={pending}
            style={{
              padding: '8px 14px',
              borderRadius: 5,
              background: 'transparent',
              border: '1px solid var(--pulse-border)',
              color: 'var(--pulse-text)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: pending ? 'not-allowed' : 'pointer',
              opacity: pending ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            style={{
              padding: '8px 14px',
              borderRadius: 5,
              background: 'rgba(224,80,80,0.18)',
              border: '1px solid rgba(224,80,80,0.5)',
              color: '#ffb3b3',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: pending ? 'not-allowed' : 'pointer',
              opacity: pending ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RotateCcw size={12} />
            {pending ? 'Rolling back…' : 'Confirm rollback'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryDrawer({
  appId,
  environment,
}: {
  appId: string;
  environment: 'production' | 'staging' | 'development';
}) {
  const histQ = useDeploymentHistory(appId, environment);
  const items = histQ.data?.history ?? [];
  return (
    <div
      style={{
        marginTop: 8,
        marginLeft: 14,
        padding: '10px 12px',
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid var(--pulse-border)',
        borderRadius: 5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <History size={11} color="var(--pulse-text-muted)" />
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--pulse-text-muted)',
          }}
        >
          Version History
        </span>
        {histQ.data && (
          <span style={{ fontSize: '0.68rem', color: 'var(--pulse-text-dim)' }}>
            · {histQ.data.count} entries
          </span>
        )}
      </div>
      {histQ.isLoading && (
        <div style={{ fontSize: '0.78rem', color: 'var(--pulse-text-muted)' }}>
          Loading history…
        </div>
      )}
      {histQ.error && (
        <div style={{ fontSize: '0.78rem', color: '#e05050' }}>Failed to load history.</div>
      )}
      {histQ.data && items.length === 0 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--pulse-text-muted)' }}>
          No history available.
        </div>
      )}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[...items].reverse().map((h, i) => (
            <div
              key={`${h.deployedAt}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 8px',
                borderRadius: 4,
                background: h.status === 'active' ? 'rgba(78,202,139,0.06)' : 'transparent',
                borderLeft: `2px solid ${deploymentColor(h.status)}`,
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.72rem',
                  color: 'var(--pulse-gold-dim)',
                  minWidth: 60,
                }}
              >
                v{h.version}
              </span>
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: deploymentColor(h.status),
                  minWidth: 80,
                }}
              >
                {h.status}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--pulse-text-dim)', flex: 1 }}>
                {new Date(h.deployedAt).toLocaleString('en-US', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}{' '}
                · by {h.deployedBy}
              </span>
              {h.commitSha && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.68rem',
                    color: 'var(--pulse-text-muted)',
                  }}
                >
                  <GitCommit size={9} />
                  {h.commitSha.slice(0, 7)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SystemHealth() {
  const briefQ = useExecutiveBrief();
  const driftQ = useDriftSummary();
  const historyQ = useDriftHistory();
  const deployQ = useDeployments('production');
  const rollback = useRollbackDeployment('production');

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmTarget, setConfirmTarget] = useState<DeploymentRecord | null>(null);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const brief = briefQ.data;
  const drift = driftQ.data;
  const history = historyQ.data;
  const deploys = deployQ.data;

  const [showPerDomain, setShowPerDomain] = useState(false);

  const refreshAll = async () => {
    briefQ.refetch();
    deployQ.refetch();
    // Sequence drift -> history so the new snapshot appears in the trend immediately.
    await driftQ.refetch();
    historyQ.refetch();
  };

  const overallChartData = (history?.snapshots ?? []).map((s) => ({
    t: formatTime(s.measuredAt),
    score: s.overallDriftScore,
    status: s.status,
  }));

  const domainKeys = Array.from(
    new Set((history?.snapshots ?? []).flatMap((s) => s.domains.map((d) => d.domain))),
  );

  const perDomainChartData = (history?.snapshots ?? []).map((s) => {
    const row: Record<string, number | string> = { t: formatTime(s.measuredAt) };
    for (const d of s.domains) row[d.domain] = d.driftScore;
    return row;
  });

  const pushToast = (kind: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleConfirmRollback = async () => {
    if (!confirmTarget) return;
    setConfirmError(undefined);
    try {
      const result = await rollback.mutateAsync({ appId: confirmTarget.appId });
      setConfirmTarget(null);
      pushToast(
        'success',
        `Rolled back ${result.previous.appName} from v${result.previous.version} to v${result.current.version}.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rollback failed';
      setConfirmError(message);
      pushToast('error', `Rollback failed: ${message}`);
    }
  };

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {confirmTarget && (
        <ConfirmModal
          deployment={confirmTarget}
          onCancel={() => {
            if (!rollback.isPending) {
              setConfirmTarget(null);
              setConfirmError(undefined);
            }
          }}
          onConfirm={handleConfirmRollback}
          pending={rollback.isPending}
          errorMessage={confirmError}
        />
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 22,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              color: 'var(--pulse-text)',
              marginBottom: 6,
            }}
          >
            System Health
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--pulse-text-muted)' }}>
            Cross-domain executive briefing, model/data drift, and live deployment registry
          </p>
        </div>
        <button
          onClick={refreshAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 6,
            background: 'rgba(200,168,75,0.1)',
            border: '1px solid rgba(200,168,75,0.3)',
            color: 'var(--pulse-gold)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Executive briefing */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          icon={<Activity size={14} color="var(--pulse-gold)" />}
          title="Executive Briefing"
          subtitle={
            brief
              ? `Generated ${new Date(brief.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              : undefined
          }
          right={
            brief && (
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  fontSize: '0.72rem',
                  color: 'var(--pulse-text-dim)',
                }}
              >
                <span>
                  <strong style={{ color: 'var(--pulse-text)' }}>{brief.totalEntities}</strong>{' '}
                  entities
                </span>
                <span>
                  <strong style={{ color: 'var(--pulse-text)' }}>{brief.totalEdges}</strong> edges
                </span>
                <span>
                  <strong style={{ color: 'var(--pulse-text)' }}>{brief.crossDomainLinks}</strong>{' '}
                  cross-domain
                </span>
                <span>
                  <strong style={{ color: '#4eca8b' }}>
                    {Math.round(brief.overallHealthScore * 100)}%
                  </strong>{' '}
                  health
                </span>
              </div>
            )
          }
        />
        {briefQ.isLoading && (
          <div style={{ color: 'var(--pulse-text-muted)', fontSize: '0.85rem' }}>
            Loading executive briefing…
          </div>
        )}
        {briefQ.error && (
          <div style={{ color: '#e05050', fontSize: '0.85rem' }}>
            Failed to load executive briefing.
          </div>
        )}
        {brief && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 10,
                marginBottom: 14,
              }}
            >
              {brief.domains.map((d) => (
                <div
                  key={d.domain}
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--pulse-border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--pulse-text)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {d.domain}
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color:
                          d.healthScore >= 0.85
                            ? '#4eca8b'
                            : d.healthScore >= 0.6
                              ? '#c8a84b'
                              : '#e05050',
                      }}
                    >
                      {Math.round(d.healthScore * 100)}%
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--pulse-text-muted)',
                      lineHeight: 1.45,
                    }}
                  >
                    {d.entityCount} entities · {d.activeCount} active · {d.edgeCount} edges
                  </div>
                  <div
                    style={{ fontSize: '0.68rem', color: 'var(--pulse-text-muted)', marginTop: 4 }}
                  >
                    Avg confidence {(d.avgConfidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
            {brief.alerts.length > 0 && (
              <div style={{ borderTop: '1px solid var(--pulse-border)', paddingTop: 12 }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--pulse-text-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Alerts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {brief.alerts.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 4,
                        background: `${severityColor(a.severity)}10`,
                        borderLeft: `2px solid ${severityColor(a.severity)}`,
                      }}
                    >
                      <AlertTriangle
                        size={12}
                        color={severityColor(a.severity)}
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ fontSize: '0.78rem', color: 'var(--pulse-text)' }}>
                        <strong style={{ textTransform: 'capitalize', marginRight: 6 }}>
                          {a.domain}:
                        </strong>
                        {a.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Drift */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader
          icon={<TrendingDown size={14} color="var(--pulse-gold)" />}
          title="Data & Model Drift"
          subtitle={
            drift
              ? `Measured ${new Date(drift.measuredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              : undefined
          }
          right={
            drift && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                <StatusDot status={drift.status} />
                <span
                  style={{
                    color: 'var(--pulse-text)',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {drift.status}
                </span>
                <span style={{ color: 'var(--pulse-text-muted)' }}>·</span>
                <span style={{ color: 'var(--pulse-text-dim)' }}>
                  Score {drift.overallDriftScore.toFixed(3)}
                </span>
              </div>
            )
          }
        />
        {driftQ.isLoading && (
          <div style={{ color: 'var(--pulse-text-muted)', fontSize: '0.85rem' }}>
            Loading drift report…
          </div>
        )}
        {driftQ.error && (
          <div style={{ color: '#e05050', fontSize: '0.85rem' }}>Failed to load drift report.</div>
        )}

        {/* Drift trend chart */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LineChartIcon size={12} color="var(--pulse-text-muted)" />
              <span
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--pulse-text-muted)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Drift Trend
              </span>
              {history && (
                <span style={{ fontSize: '0.68rem', color: 'var(--pulse-text-dim)' }}>
                  · last {history.snapshots.length} of {history.count} snapshots
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPerDomain((v) => !v)}
              disabled={!history || history.snapshots.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                background: 'transparent',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text-muted)',
                fontSize: '0.7rem',
                cursor: history && history.snapshots.length > 0 ? 'pointer' : 'not-allowed',
                opacity: history && history.snapshots.length > 0 ? 1 : 0.5,
              }}
            >
              {showPerDomain ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              {showPerDomain ? 'Hide per-domain' : 'Inspect per-domain'}
            </button>
          </div>

          {historyQ.isLoading && (
            <div
              style={{ color: 'var(--pulse-text-muted)', fontSize: '0.8rem', padding: '12px 0' }}
            >
              Loading drift history…
            </div>
          )}
          {historyQ.error && (
            <div style={{ color: '#e05050', fontSize: '0.8rem', padding: '12px 0' }}>
              Failed to load drift history.
            </div>
          )}
          {history && history.snapshots.length === 0 && !historyQ.isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 12px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.2)',
                border: '1px dashed var(--pulse-border)',
                color: 'var(--pulse-text-muted)',
                fontSize: '0.8rem',
              }}
            >
              <Activity size={13} />
              No drift snapshots yet. History begins after the next drift measurement (refresh or
              wait for the next polling cycle).
            </div>
          )}
          {history && history.snapshots.length > 0 && !showPerDomain && (
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={overallChartData}
                  margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="driftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c8a84b" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#c8a84b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="t" stroke="var(--pulse-text-dim)" tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="var(--pulse-text-dim)"
                    tick={{ fontSize: 10 }}
                    domain={[0, (max: number) => Math.max(0.5, Math.ceil(max * 10) / 10)]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,18,28,0.95)',
                      border: '1px solid var(--pulse-border)',
                      borderRadius: 6,
                      fontSize: '0.75rem',
                    }}
                    labelStyle={{ color: 'var(--pulse-text-muted)' }}
                    formatter={(v: number) => [v.toFixed(3), 'Drift']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#c8a84b"
                    strokeWidth={2}
                    fill="url(#driftGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {history && history.snapshots.length > 0 && showPerDomain && (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={perDomainChartData}
                    margin={{ top: 4, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="t" stroke="var(--pulse-text-dim)" tick={{ fontSize: 10 }} />
                    <YAxis
                      stroke="var(--pulse-text-dim)"
                      tick={{ fontSize: 10 }}
                      domain={[0, (max: number) => Math.max(0.5, Math.ceil(max * 10) / 10)]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,18,28,0.95)',
                        border: '1px solid var(--pulse-border)',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                      }}
                      labelStyle={{ color: 'var(--pulse-text-muted)' }}
                      formatter={(v: number) => v.toFixed(3)}
                    />
                    {domainKeys.map((dk) => (
                      <Line
                        key={dk}
                        type="monotone"
                        dataKey={dk}
                        stroke={DOMAIN_COLORS[dk] ?? '#7a8295'}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {domainKeys.map((dk) => (
                  <div
                    key={dk}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: '0.7rem',
                      color: 'var(--pulse-text-dim)',
                    }}
                  >
                    <span
                      style={{ width: 10, height: 2, background: DOMAIN_COLORS[dk] ?? '#7a8295' }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{dk}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {drift && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr
                    style={{
                      color: 'var(--pulse-text-muted)',
                      textAlign: 'left',
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <th
                      style={{ padding: '8px 10px', borderBottom: '1px solid var(--pulse-border)' }}
                    >
                      Domain
                    </th>
                    <th
                      style={{ padding: '8px 10px', borderBottom: '1px solid var(--pulse-border)' }}
                    >
                      Status
                    </th>
                    <th
                      style={{ padding: '8px 10px', borderBottom: '1px solid var(--pulse-border)' }}
                    >
                      Drift Score
                    </th>
                    <th
                      style={{ padding: '8px 10px', borderBottom: '1px solid var(--pulse-border)' }}
                    >
                      Confidence
                    </th>
                    <th
                      style={{ padding: '8px 10px', borderBottom: '1px solid var(--pulse-border)' }}
                    >
                      Stale 24h
                    </th>
                    <th
                      style={{ padding: '8px 10px', borderBottom: '1px solid var(--pulse-border)' }}
                    >
                      Entities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drift.domains.map((d) => {
                    const stale24 = d.freshnessWindows.find((w) => w.windowHours === 24);
                    return (
                      <tr key={d.domain} style={{ color: 'var(--pulse-text)' }}>
                        <td
                          style={{
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--pulse-border)',
                            textTransform: 'capitalize',
                            fontWeight: 500,
                          }}
                        >
                          {d.domain}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--pulse-border)',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <StatusDot status={d.status} />
                            <span style={{ textTransform: 'capitalize', fontSize: '0.75rem' }}>
                              {d.status}
                            </span>
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--pulse-border)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.75rem',
                          }}
                        >
                          {d.driftScore.toFixed(3)}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--pulse-border)',
                          }}
                        >
                          {(d.avgConfidence * 100).toFixed(0)}%
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--pulse-border)',
                          }}
                        >
                          {stale24 ? `${stale24.stalePercent}%` : '—'}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--pulse-border)',
                            color: 'var(--pulse-text-dim)',
                          }}
                        >
                          {d.totalEntities}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {drift.topAlerts.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--pulse-text-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Top Drift Alerts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {drift.topAlerts.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 4,
                        background: `${severityColor(a.severity)}10`,
                        borderLeft: `2px solid ${severityColor(a.severity)}`,
                      }}
                    >
                      <AlertTriangle
                        size={12}
                        color={severityColor(a.severity)}
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ fontSize: '0.78rem', color: 'var(--pulse-text)' }}>
                        <strong style={{ textTransform: 'capitalize', marginRight: 6 }}>
                          {a.domain}:
                        </strong>
                        {a.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Deployments */}
      <Card>
        <SectionHeader
          icon={<Server size={14} color="var(--pulse-gold)" />}
          title="Production Deployments"
          subtitle={deploys ? `${deploys.count} active in ${deploys.environment}` : undefined}
        />
        {deployQ.isLoading && (
          <div style={{ color: 'var(--pulse-text-muted)', fontSize: '0.85rem' }}>
            Loading deployments…
          </div>
        )}
        {deployQ.error && (
          <div style={{ color: '#e05050', fontSize: '0.85rem' }}>Failed to load deployments.</div>
        )}
        {deploys && deploys.deployments.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 12px',
              color: 'var(--pulse-text-muted)',
              fontSize: '0.82rem',
            }}
          >
            <Layers size={14} />
            No active deployments registered yet. Register one via{' '}
            <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 3 }}>
              POST /deployments
            </code>
            .
          </div>
        )}
        {deploys && deploys.deployments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deploys.deployments.map((d) => {
              const isOpen = !!expanded[d.appId];
              return (
                <div key={`${d.appId}-${d.deployedAt}`}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--pulse-border)',
                      borderLeft: `3px solid ${deploymentColor(d.status)}`,
                    }}
                  >
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [d.appId]: !prev[d.appId] }))
                      }
                      aria-expanded={isOpen}
                      aria-label={
                        isOpen
                          ? `Collapse history for ${d.appName}`
                          : `Expand history for ${d.appName}`
                      }
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{ marginTop: 2, color: 'var(--pulse-text-muted)', display: 'flex' }}
                      >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                        >
                          <CheckCircle size={12} color={deploymentColor(d.status)} />
                          <span
                            style={{
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              color: 'var(--pulse-text)',
                            }}
                          >
                            {d.appName}
                          </span>
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '0.7rem',
                              color: 'var(--pulse-gold-dim)',
                              padding: '1px 6px',
                              borderRadius: 3,
                              background: 'rgba(200,168,75,0.08)',
                            }}
                          >
                            v{d.version}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: deploymentColor(d.status),
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                            }}
                          >
                            {d.status}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            fontSize: '0.7rem',
                            color: 'var(--pulse-text-muted)',
                          }}
                        >
                          <span>{d.environment}</span>
                          <span>·</span>
                          <span>by {d.deployedBy}</span>
                          <span>·</span>
                          <span>
                            {new Date(d.deployedAt).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          {d.commitSha && (
                            <>
                              <span>·</span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  fontFamily: 'JetBrains Mono, monospace',
                                }}
                              >
                                <GitCommit size={10} />
                                {d.commitSha.slice(0, 7)}
                              </span>
                            </>
                          )}
                        </div>
                        {d.notes && (
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--pulse-text-dim)',
                              marginTop: 4,
                            }}
                          >
                            {d.notes}
                          </div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmError(undefined);
                        setConfirmTarget(d);
                      }}
                      disabled={d.status !== 'active'}
                      title={
                        d.status !== 'active'
                          ? 'Only active deployments can be rolled back'
                          : 'Roll back to previous version'
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 5,
                        background: 'rgba(224,80,80,0.12)',
                        border: '1px solid rgba(224,80,80,0.35)',
                        color: '#ffb3b3',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: d.status !== 'active' ? 'not-allowed' : 'pointer',
                        opacity: d.status !== 'active' ? 0.4 : 1,
                        flexShrink: 0,
                      }}
                    >
                      <RotateCcw size={11} />
                      Rollback
                    </button>
                  </div>
                  {isOpen && <HistoryDrawer appId={d.appId} environment="production" />}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
