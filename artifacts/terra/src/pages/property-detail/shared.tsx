import { TooltipProps } from 'recharts';
import { cn } from '@szl-holdings/shared-ui';

export function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-xl"
      style={{
        background: 'rgba(15,20,32,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <p className="text-[10px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: ${((entry.value as number) / 1e3).toFixed(0)}K
        </p>
      ))}
    </div>
  );
}

export function FreshnessTag({ label, confidence }: { label: string; confidence: string }) {
  const isHigh = confidence === 'High';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded',
        isHigh
          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
          : 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
      )}
    >
      <span
        className={cn('w-1 h-1 rounded-full', isHigh ? 'bg-emerald-400' : 'bg-amber-400')}
      />
      {label}
    </span>
  );
}

export function ProvenanceTag({ source }: { source: string }) {
  return (
    <span
      className="inline-flex items-center text-[9px] font-semibold px-1.5 py-0.5 rounded"
      style={{
        color: 'rgba(255,255,255,0.25)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {source}
    </span>
  );
}

export function DiligenceStatus({
  status,
}: {
  status: 'complete' | 'in-progress' | 'pending' | 'flagged';
}) {
  const cfgs = {
    complete: { color: '#40856a', bg: 'rgba(64,133,106,0.1)', label: '✓' },
    'in-progress': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: '→' },
    pending: { color: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.04)', label: '○' },
    flagged: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: '!' },
  };
  const c = cfgs[status];
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
      style={{ color: c.color, background: c.bg }}
    >
      {c.label}
    </div>
  );
}

export function _ActionSeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#40856a',
  };
  const c = colors[severity] ?? 'rgba(255,255,255,0.3)';
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
      style={{ color: c, background: `${c}14`, border: `1px solid ${c}30` }}
    >
      {severity}
    </span>
  );
}

export const OCCI_COLORS = ['#40856a', 'rgba(255,255,255,0.08)'];
