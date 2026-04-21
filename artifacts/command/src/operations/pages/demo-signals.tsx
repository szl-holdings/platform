import { demoSignals } from '@lyte/lib/demo-seed';
import { cn } from '@lyte/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  Filter,
  Radio,
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

const SEV: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  critical: {
    text: '#c45a4a',
    bg: 'rgba(196,90,74,0.08)',
    border: 'rgba(196,90,74,0.2)',
    dot: '#c45a4a',
  },
  high: {
    text: '#c8953c',
    bg: 'rgba(200,149,60,0.08)',
    border: 'rgba(200,149,60,0.2)',
    dot: '#c8953c',
  },
  medium: {
    text: '#d4a054',
    bg: 'rgba(212,160,84,0.08)',
    border: 'rgba(212,160,84,0.2)',
    dot: '#d4a054',
  },
  low: {
    text: '#4a90b8',
    bg: 'rgba(74,144,184,0.08)',
    border: 'rgba(74,144,184,0.2)',
    dot: '#4a90b8',
  },
};

const SRC_TYPE_LABELS: Record<string, string> = {
  crm: 'CRM',
  slack: 'Slack',
  jira: 'Jira',
  email: 'Email',
  monitoring: 'Monitoring',
  erp: 'ERP',
  hr: 'HR',
  billing: 'Billing',
  cs_platform: 'CS Platform',
  project_mgmt: 'Project Mgmt',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string): string {
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

interface SignalDetailProps {
  signal: (typeof demoSignals)[0];
  onClose: () => void;
}

function SignalDetail({ signal, onClose }: SignalDetailProps) {
  const c = SEV[signal.severity];
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
            <span
              className="text-[9px] font-mono px-2 py-px rounded uppercase tracking-widest"
              style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
            >
              {signal.severity}
            </span>
            <button
              onClick={onClose}
              className="text-[12px] transition-colors"
              style={{ color: TEXT.muted }}
            >
              ✕
            </button>
          </div>
          <h2 className="text-sm font-semibold leading-snug mb-2" style={{ color: TEXT.primary }}>
            {signal.title}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
              {signal.source}
            </span>
            <span className="text-[9px]" style={{ color: TEXT.muted }}>
              ·
            </span>
            <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
              {SRC_TYPE_LABELS[signal.sourceType]}
            </span>
          </div>
        </div>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[11px] leading-relaxed" style={{ color: TEXT.secondary }}>
            {signal.summary}
          </p>
        </div>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Detected', value: timeAgo(signal.detectedAt) },
              {
                label: 'Status',
                value: signal.status.charAt(0).toUpperCase() + signal.status.slice(1),
              },
              { label: 'Function', value: signal.affectedFunction },
              { label: 'Owner', value: signal.owner },
              { label: 'Value at Risk', value: fmt(signal.valueAtRisk) },
              { label: 'Source Type', value: SRC_TYPE_LABELS[signal.sourceType] },
            ].map(({ label, value }) => (
              <div key={label}>
                <div
                  className="text-[8px] uppercase tracking-wider mb-0.5"
                  style={{ color: TEXT.muted }}
                >
                  {label}
                </div>
                <div className="text-[10px] font-medium" style={{ color: TEXT.primary }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: TEXT.muted }}>
            Tags
          </div>
          <div className="flex flex-wrap gap-1">
            {signal.tags.map((tag) => (
              <span
                key={tag}
                className="text-[8px] px-2 py-px rounded-full"
                style={{
                  color: TEXT.secondary,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: TEXT.muted }}>
            Actions
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Acknowledge', color: '#d4a054' },
              { label: 'Escalate', color: '#c45a4a' },
              { label: 'Resolve', color: '#6b8f71' },
            ].map((a) => (
              <button
                key={a.label}
                onClick={onClose}
                className="text-[10px] px-3 py-1.5 rounded border font-medium transition-opacity hover:opacity-80"
                style={{ color: a.color, background: `${a.color}14`, borderColor: `${a.color}30` }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DemoSignalsPage() {
  const [selected, setSelected] = useState<(typeof demoSignals)[0] | null>(null);
  const [sevFilter, setSevFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [srcFilter, setSrcFilter] = useState('all');

  const filtered = demoSignals.filter((s) => {
    if (sevFilter !== 'all' && s.severity !== sevFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (srcFilter !== 'all' && s.sourceType !== srcFilter) return false;
    return true;
  });

  const counts = {
    critical: demoSignals.filter((s) => s.severity === 'critical' && s.status === 'active').length,
    active: demoSignals.filter((s) => s.status === 'active').length,
    acknowledged: demoSignals.filter((s) => s.status === 'acknowledged').length,
  };

  return (
    <div className="p-4 max-w-[1200px] space-y-4">
      {selected && <SignalDetail signal={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Radio className="w-3.5 h-3.5" style={{ color: '#d4a054' }} />
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: '#d4a054' }}
            >
              Command · Signals
            </span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>
            Signal Intake Queue
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
            Live operational signals — all sources, all severities
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded border transition-colors"
          style={{ color: TEXT.secondary, borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Critical Active',
            value: counts.critical,
            color: '#c45a4a',
            icon: AlertTriangle,
          },
          { label: 'Active Signals', value: counts.active, color: '#c8953c', icon: Radio },
          { label: 'Acknowledged', value: counts.acknowledged, color: '#d4a054', icon: Clock },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-md p-3 flex items-center gap-3"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <c.icon className="w-4 h-4 shrink-0" style={{ color: c.color }} />
            <div>
              <div className="text-xl font-bold font-mono" style={{ color: c.color }}>
                {c.value}
              </div>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: TEXT.muted }}>
                {c.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider mr-1" style={{ color: TEXT.muted }}>
            Severity:
          </span>
          {['all', 'critical', 'high', 'medium', 'low'].map((f) => {
            const c = SEV[f];
            return (
              <button
                key={f}
                onClick={() => setSevFilter(f)}
                className="text-[9px] px-2.5 py-1 rounded border capitalize transition-all"
                style={{
                  color: sevFilter === f ? (c?.text ?? '#d4a054') : TEXT.muted,
                  background: sevFilter === f ? (c?.bg ?? 'rgba(212,160,84,0.08)') : 'transparent',
                  borderColor:
                    sevFilter === f ? (c?.border ?? 'rgba(212,160,84,0.2)') : BORDER.subtle,
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider mr-1" style={{ color: TEXT.muted }}>
            Status:
          </span>
          {['all', 'active', 'acknowledged', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className="text-[9px] px-2.5 py-1 rounded border capitalize transition-all"
              style={{
                color: statusFilter === f ? '#d4a054' : TEXT.muted,
                background: statusFilter === f ? 'rgba(212,160,84,0.08)' : 'transparent',
                borderColor: statusFilter === f ? 'rgba(212,160,84,0.2)' : BORDER.subtle,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[9px] font-mono" style={{ color: TEXT.muted }}>
          {filtered.length} signals
        </span>
      </div>

      <div
        className="rounded-md overflow-hidden"
        style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
      >
        <div
          className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 px-3 py-1.5 border-b"
          style={{ borderColor: BORDER.subtle }}
        >
          {['SEV', 'Signal', 'Source', 'VAR', 'Age'].map((h) => (
            <div
              key={h}
              className="text-[8px] uppercase tracking-widest font-medium"
              style={{ color: TEXT.muted }}
            >
              {h}
            </div>
          ))}
        </div>
        <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
          {filtered.map((sig) => {
            const c = SEV[sig.severity];
            const isActive = sig.status === 'active';
            return (
              <div
                key={sig.id}
                onClick={() => setSelected(sig)}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-3 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      isActive && sig.severity === 'critical' ? 'animate-pulse' : '',
                    )}
                    style={{ background: c.dot }}
                  />
                  <span
                    className="text-[8px] font-mono px-1.5 py-px rounded uppercase"
                    style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
                  >
                    {sig.severity}
                  </span>
                </div>
                <div className="min-w-0">
                  <div
                    className="text-[11px] font-medium leading-snug truncate"
                    style={{ color: TEXT.primary }}
                  >
                    {sig.title}
                  </div>
                  <div className="text-[9px] mt-0.5 truncate" style={{ color: TEXT.muted }}>
                    {sig.affectedFunction} · {sig.owner}
                  </div>
                </div>
                <div className="text-[9px] shrink-0" style={{ color: TEXT.muted }}>
                  {SRC_TYPE_LABELS[sig.sourceType]}
                </div>
                <div
                  className="text-[9px] font-mono shrink-0 text-right"
                  style={{ color: '#c45a4a' }}
                >
                  {fmt(sig.valueAtRisk)}
                </div>
                <div
                  className="text-[9px] font-mono shrink-0 text-right"
                  style={{ color: TEXT.muted }}
                >
                  {timeAgo(sig.detectedAt)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
