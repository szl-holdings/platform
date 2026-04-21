import { StatusBadge as DSStatusBadge, type StatusVariant } from '@szl-holdings/design-system';
import { AlertTriangle, CheckCircle2, Circle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function FitBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    strong: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    moderate: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    weak: 'bg-red-500/10 text-red-500 border-red-500/20',
    not_applicable: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
        map[level] ?? map.moderate,
      )}
    >
      {level.replace('_', ' ')}
    </span>
  );
}

const OWNERSHIP_PRIORITY_VARIANT: Record<string, StatusVariant> = {
  critical: 'error', high: 'warning', medium: 'warning', low: 'info',
};
export function PriorityBadge({ priority }: { priority: string }) {
  return <DSStatusBadge variant={OWNERSHIP_PRIORITY_VARIANT[priority] ?? 'neutral'} label={priority} />;
}

const OWNERSHIP_STATUS_VARIANT: Record<string, StatusVariant> = {
  open: 'active', in_progress: 'pending', pending: 'pending',
  resolved: 'approved', current: 'success', documented: 'success',
  missing: 'error', needs_update: 'warning',
  draft: 'neutral', not_started: 'neutral',
};
export function StatusBadge({ status }: { status: string }) {
  return <DSStatusBadge variant={OWNERSHIP_STATUS_VARIANT[status] ?? 'neutral'} label={status.replace(/_/g, ' ')} />;
}

export function ScoreBar({
  label,
  score,
  color = 'bg-primary',
}: {
  label: string;
  score?: number;
  color?: string;
}) {
  if (score == null) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{score}/100</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function BoolCheck({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
      )}
      <span className={cn('text-xs', value ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  );
}

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-sm">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 text-amber-200/80 text-xs leading-relaxed">
        <span className="font-semibold text-amber-400">Readiness Analysis Only.</span> This system
        evaluates structural readiness for potential certification, banking, and governance
        alignment. It does not constitute legal advice, confirm eligibility for any certification,
        or make any eligibility determination. All scenarios require qualified attorney and CPA
        review before any filings or applications.
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400/60 hover:text-amber-400 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
