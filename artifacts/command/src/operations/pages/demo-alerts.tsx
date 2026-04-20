import { demoAlerts } from '@lyte/lib/demo-seed';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronDown,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

const BG = { surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.06)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};

const ALERT_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  firing: {
    label: 'FIRING',
    color: '#c45a4a',
    bg: 'rgba(196,90,74,0.08)',
    border: 'rgba(196,90,74,0.2)',
  },
  active: {
    label: 'ACTIVE',
    color: '#6b8f71',
    bg: 'rgba(107,143,113,0.08)',
    border: 'rgba(107,143,113,0.2)',
  },
  resolved: {
    label: 'RESOLVED',
    color: '#4a90b8',
    bg: 'rgba(74,144,184,0.08)',
    border: 'rgba(74,144,184,0.2)',
  },
  silenced: {
    label: 'SILENCED',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.2)',
  },
  draft: {
    label: 'DRAFT',
    color: '#d4a054',
    bg: 'rgba(212,160,84,0.08)',
    border: 'rgba(212,160,84,0.2)',
  },
};

const SEV_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  critical: { text: '#c45a4a', bg: 'rgba(196,90,74,0.08)', border: 'rgba(196,90,74,0.2)' },
  high: { text: '#c8953c', bg: 'rgba(200,149,60,0.08)', border: 'rgba(200,149,60,0.2)' },
  medium: { text: '#d4a054', bg: 'rgba(212,160,84,0.08)', border: 'rgba(212,160,84,0.2)' },
  low: { text: '#4a90b8', bg: 'rgba(74,144,184,0.08)', border: 'rgba(74,144,184,0.2)' },
};

const TYPE_LABELS: Record<string, string> = {
  threshold: 'Threshold',
  anomaly: 'Anomaly Detection',
  composite: 'Composite Rule',
  sla_breach: 'SLA Breach',
};

const COND_LABELS: Record<string, string> = {
  gt: '>',
  lt: '<',
  gte: '≥',
  lte: '≤',
  eq: '=',
  anomaly: 'anomaly',
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const absDiff = -diff;
    const mins = Math.floor(absDiff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AlertDetail({ alert, onClose }: { alert: (typeof demoAlerts)[0]; onClose: () => void }) {
  const st = ALERT_STATUS[alert.status];
  const sc = SEV_COLORS[alert.severity];
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50" />
      <div
        className="w-full max-w-lg border-l flex flex-col h-full overflow-y-auto"
        style={{ background: '#0a0e18', borderColor: 'rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex gap-1.5">
              <span
                className="text-[9px] font-mono px-2 py-px rounded uppercase tracking-widest"
                style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}
              >
                {alert.severity}
              </span>
              <span
                className="text-[9px] font-mono px-2 py-px rounded uppercase tracking-widest"
                style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
              >
                {st.label}
              </span>
            </div>
            <button onClick={onClose} className="text-[12px]" style={{ color: TEXT.muted }}>
              ✕
            </button>
          </div>
          <h2 className="text-sm font-semibold mb-1.5" style={{ color: TEXT.primary }}>
            {alert.name}
          </h2>
          <p className="text-[10px] leading-relaxed" style={{ color: TEXT.secondary }}>
            {alert.description}
          </p>
        </div>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Alert Type', value: TYPE_LABELS[alert.alertType] },
              { label: 'Service', value: alert.service },
              { label: 'Metric', value: alert.metricName },
              {
                label: 'Condition',
                value: `${COND_LABELS[alert.condition] ?? alert.condition} ${alert.threshold ?? ''}`,
              },
              { label: 'Times Fired', value: alert.firingCount.toString() },
              { label: 'Last Fired', value: timeAgo(alert.lastFiredAt) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded px-3 py-2"
                style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
              >
                <div
                  className="text-[8px] uppercase tracking-wider mb-0.5"
                  style={{ color: TEXT.muted }}
                >
                  {label}
                </div>
                <div className="text-[10px] font-medium font-mono" style={{ color: TEXT.primary }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: TEXT.muted }}>
            Notification Channels
          </div>
          <div className="flex flex-wrap gap-1.5">
            {alert.notificationChannels.map((ch) => (
              <span
                key={ch}
                className="text-[9px] px-2 py-1 rounded"
                style={{
                  color: '#d4a054',
                  background: 'rgba(212,160,84,0.08)',
                  border: '1px solid rgba(212,160,84,0.15)',
                }}
              >
                {ch}
              </span>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: TEXT.muted }}>
            Actions
          </div>
          <div className="flex gap-2">
            {alert.status === 'firing' && (
              <button
                className="text-[10px] px-3 py-1.5 rounded border"
                style={{
                  color: '#4a90b8',
                  background: 'rgba(74,144,184,0.1)',
                  borderColor: 'rgba(74,144,184,0.25)',
                }}
              >
                Mark Resolved
              </button>
            )}
            {(alert.status === 'firing' || alert.status === 'active') && (
              <button
                className="text-[10px] px-3 py-1.5 rounded border"
                style={{
                  color: '#6b7280',
                  background: 'rgba(107,114,128,0.1)',
                  borderColor: 'rgba(107,114,128,0.25)',
                }}
              >
                Silence (1h)
              </button>
            )}
            {alert.status === 'silenced' && (
              <button
                className="text-[10px] px-3 py-1.5 rounded border"
                style={{
                  color: '#6b8f71',
                  background: 'rgba(107,143,113,0.1)',
                  borderColor: 'rgba(107,143,113,0.25)',
                }}
              >
                Re-enable
              </button>
            )}
            <button
              className="text-[10px] px-3 py-1.5 rounded border"
              style={{ color: TEXT.muted, borderColor: BORDER.subtle }}
            >
              Edit Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoAlertsPage() {
  const [selected, setSelected] = useState<(typeof demoAlerts)[0] | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');

  const filtered = demoAlerts.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (sevFilter !== 'all' && a.severity !== sevFilter) return false;
    return true;
  });

  const firing = demoAlerts.filter((a) => a.status === 'firing').length;
  const active = demoAlerts.filter((a) => a.status === 'active').length;
  const critical = demoAlerts.filter((a) => a.severity === 'critical').length;

  return (
    <div className="p-4 max-w-[1100px] space-y-4">
      {selected && <AlertDetail alert={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Bell className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: '#d4a054' }}
            >
              Lyte · Alerts
            </span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>
            Alert Configuration
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Active alert rules with thresholds, status, and notification routing
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded border"
          style={{
            color: '#d4a054',
            background: 'rgba(212,160,84,0.08)',
            borderColor: 'rgba(212,160,84,0.2)',
          }}
        >
          <Plus className="w-3 h-3" /> Create Alert
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Alerts', value: demoAlerts.length, color: TEXT.secondary },
          { label: 'Firing', value: firing, color: '#c45a4a' },
          { label: 'Active', value: active, color: '#6b8f71' },
          { label: 'Critical Severity', value: critical, color: '#c45a4a' },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-md p-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>
              {c.label}
            </div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color as string }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider mr-1" style={{ color: TEXT.muted }}>
            Status:
          </span>
          {['all', 'firing', 'active', 'silenced', 'resolved'].map((f) => {
            const st = ALERT_STATUS[f];
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className="text-[9px] px-2.5 py-1 rounded border capitalize"
                style={{
                  color: statusFilter === f ? (st?.color ?? '#d4a054') : TEXT.muted,
                  background:
                    statusFilter === f ? (st?.bg ?? 'rgba(212,160,84,0.08)') : 'transparent',
                  borderColor:
                    statusFilter === f ? (st?.border ?? 'rgba(212,160,84,0.2)') : BORDER.subtle,
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider mr-1" style={{ color: TEXT.muted }}>
            Severity:
          </span>
          {['all', 'critical', 'high', 'medium'].map((f) => {
            const sc = SEV_COLORS[f];
            return (
              <button
                key={f}
                onClick={() => setSevFilter(f)}
                className="text-[9px] px-2.5 py-1 rounded border capitalize"
                style={{
                  color: sevFilter === f ? (sc?.text ?? '#d4a054') : TEXT.muted,
                  background: sevFilter === f ? (sc?.bg ?? 'rgba(212,160,84,0.08)') : 'transparent',
                  borderColor:
                    sevFilter === f ? (sc?.border ?? 'rgba(212,160,84,0.2)') : BORDER.subtle,
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-[9px] font-mono" style={{ color: TEXT.muted }}>
          {filtered.length} alerts
        </span>
      </div>

      <div className="space-y-2">
        {filtered.map((alert) => {
          const st = ALERT_STATUS[alert.status];
          const sc = SEV_COLORS[alert.severity];
          const isFiring = alert.status === 'firing';
          return (
            <div
              key={alert.id}
              onClick={() => setSelected(alert)}
              className="rounded-md px-4 py-3 cursor-pointer hover:bg-white/[0.015] transition-colors"
              style={{
                background: BG.surface,
                border: `1px solid ${isFiring ? 'rgba(196,90,74,0.15)' : BORDER.subtle}`,
              }}
            >
              {isFiring && (
                <div
                  className="h-px mb-3"
                  style={{ background: 'linear-gradient(90deg, #c45a4a, transparent)' }}
                />
              )}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 shrink-0">
                  <span
                    className="text-[7px] font-mono px-1.5 py-px rounded uppercase tracking-widest"
                    style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
                  >
                    {st.label}
                  </span>
                  <span
                    className="text-[7px] font-mono px-1.5 py-px rounded uppercase tracking-widest"
                    style={{ color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold mb-0.5" style={{ color: TEXT.primary }}>
                    {alert.name}
                  </div>
                  <div className="text-[9px] mb-0.5" style={{ color: TEXT.secondary }}>
                    {alert.description}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[8px] px-1.5 py-px rounded"
                      style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
                    >
                      {TYPE_LABELS[alert.alertType]}
                    </span>
                    <span className="text-[8px]" style={{ color: TEXT.muted }}>
                      {alert.service}
                    </span>
                    <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>
                      {alert.metricName} {COND_LABELS[alert.condition] ?? alert.condition}{' '}
                      {alert.threshold ?? ''}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 shrink-0 text-right">
                  <div>
                    <div
                      className="text-[10px] font-mono font-bold"
                      style={{ color: isFiring ? '#c45a4a' : TEXT.tertiary }}
                    >
                      {alert.firingCount}
                    </div>
                    <div
                      className="text-[7px] uppercase tracking-wider"
                      style={{ color: TEXT.muted }}
                    >
                      Times Fired
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
                      {timeAgo(alert.lastFiredAt)}
                    </div>
                    <div
                      className="text-[7px] uppercase tracking-wider"
                      style={{ color: TEXT.muted }}
                    >
                      Last Fired
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
