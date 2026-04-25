import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Play,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  XCircle,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { heliosApi, type Scanner } from '../lib/api';

const STATUS_META = {
  healthy:  { color: '#34d399', Icon: CheckCircle, label: 'Healthy' },
  degraded: { color: '#f59e0b', Icon: AlertTriangle, label: 'Degraded' },
  error:    { color: '#f87171', Icon: XCircle, label: 'Error' },
  idle:     { color: 'rgba(255,255,255,0.25)', Icon: Activity, label: 'Idle' },
};

function ScannerCard({ scanner }: { scanner: Scanner }) {
  const queryClient = useQueryClient();
  const statusMeta = STATUS_META[scanner.status];
  const StatusIcon = statusMeta.Icon;

  const { mutate: toggle, isPending: toggling } = useMutation({
    mutationFn: () => heliosApi.toggleScanner(scanner.id, !scanner.enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanners'] });
      toast.success(`Scanner ${scanner.enabled ? 'disabled' : 'enabled'}`);
    },
    onError: () => toast.error('Failed to toggle scanner'),
  });

  const { mutate: run, isPending: running } = useMutation({
    mutationFn: () => heliosApi.runScanner(scanner.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scanners'] });
      toast.success(data.message);
    },
    onError: () => toast.error('Failed to trigger scanner'),
  });

  return (
    <div
      className="section-card"
      style={{
        padding: '16px 18px',
        borderLeft: `3px solid ${scanner.enabled ? statusMeta.color : 'rgba(255,255,255,0.1)'}`,
        opacity: scanner.enabled ? 1 : 0.65,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `${statusMeta.color}12`, border: `1px solid ${statusMeta.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <StatusIcon size={15} color={statusMeta.color} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--helios-text)' }}>
              {scanner.name}
            </div>
            <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: statusMeta.color, background: `${statusMeta.color}12`, border: `1px solid ${statusMeta.color}25` }}>
              {statusMeta.label}
            </span>
            {!scanner.enabled && (
              <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Disabled
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--helios-text-dim)', marginBottom: 8, lineHeight: 1.4 }}>
            {scanner.description}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Today', value: scanner.signalsToday },
              { label: 'Total', value: scanner.totalSignals },
              {
                label: 'Last Run',
                value: scanner.lastRun
                  ? formatDistanceToNow(new Date(scanner.lastRun), { addSuffix: true })
                  : 'Never',
              },
              {
                label: 'Next Run',
                value: scanner.nextRun
                  ? formatDistanceToNow(new Date(scanner.nextRun), { addSuffix: false })
                  : '—',
              },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 2 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--helios-text)', fontFamily: typeof stat.value === 'number' ? 'JetBrains Mono, monospace' : undefined }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {scanner.errorMessage && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, fontSize: '0.72rem', color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>
              {scanner.errorMessage}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => toggle()}
            disabled={toggling}
            title={scanner.enabled ? 'Disable scanner' : 'Enable scanner'}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', background: scanner.enabled ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${scanner.enabled ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.1)'}`, color: scanner.enabled ? '#34d399' : 'var(--helios-text-muted)' }}
          >
            {scanner.enabled ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            {scanner.enabled ? 'On' : 'Off'}
          </button>
          <button
            onClick={() => run()}
            disabled={running || !scanner.enabled}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: scanner.enabled ? 'pointer' : 'not-allowed', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: scanner.enabled ? 'var(--helios-amber)' : 'var(--helios-text-muted)', opacity: scanner.enabled ? 1 : 0.5 }}
          >
            {running ? <RefreshCw size={11} className="spin" /> : <Play size={11} />}
            Run
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScannerAdmin() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['scanners'],
    queryFn: () => heliosApi.getScanners(),
    refetchInterval: 30_000,
  });

  const scanners = data?.scanners ?? [];
  const healthyCount = scanners.filter(s => s.status === 'healthy').length;
  const enabledCount = scanners.filter(s => s.enabled).length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      <Toaster position="bottom-right" theme="dark" />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={20} color="var(--helios-amber)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '-0.01em' }}>
              Scanner Admin
            </h1>
          </div>
          <button
            onClick={() => refetch()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, fontSize: '0.75rem', color: 'var(--helios-amber)', cursor: 'pointer' }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--helios-text-muted)', lineHeight: 1.5 }}>
          Enable, disable, and manually trigger each scanner. View run health and signal throughput per source family.
        </p>
      </div>

      {/* Summary stats */}
      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Scanners', value: scanners.length, color: '#f59e0b' },
            { label: 'Active', value: enabledCount, color: '#34d399' },
            { label: 'Healthy', value: healthyCount, color: '#60a5fa' },
          ].map((s) => (
            <div key={s.label} className="section-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--helios-text-muted)', marginTop: 4, fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scanner list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="section-card" style={{ padding: 16, height: 110, opacity: 0.5 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scanners.map((s) => <ScannerCard key={s.id} scanner={s} />)}
        </div>
      )}
    </div>
  );
}
