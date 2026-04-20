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

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
        map[priority] ?? map.medium,
      )}
    >
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    current: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    missing: 'bg-red-500/10 text-red-500 border-red-500/20',
    needs_update: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    draft: 'bg-muted text-muted-foreground border-border',
    not_started: 'bg-muted text-muted-foreground border-border',
    documented: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  return (
    <span
      className={cn(
        'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
        map[status] ?? map.draft,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
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
