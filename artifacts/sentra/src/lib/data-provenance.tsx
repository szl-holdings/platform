import { cn } from '@szl-holdings/shared-ui/utils';
import { Database, Loader2, WifiOff } from 'lucide-react';

interface DataProvenanceProps {
  source: 'live' | 'seed' | 'loading' | 'error';
  label?: string;
  className?: string;
}

export function DataProvenance({ source, label, className }: DataProvenanceProps) {
  if (source === 'loading') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider',
          'bg-slate-800 border border-slate-700 text-slate-500',
          className,
        )}
      >
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        Loading
      </span>
    );
  }

  if (source === 'error') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider',
          'bg-red-900/40 border border-red-700/40 text-red-400',
          className,
        )}
      >
        <WifiOff className="w-2.5 h-2.5" />
        {label ?? 'Unavailable'}
      </span>
    );
  }

  if (source === 'seed') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider',
          'bg-amber-900/30 border border-amber-600/30 text-amber-400',
          className,
        )}
      >
        <Database className="w-2.5 h-2.5" />
        {label ?? 'Demo Data'}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider',
        'bg-emerald-900/30 border border-emerald-600/30 text-emerald-400',
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {label ?? 'Live API'}
    </span>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  provenance?: DataProvenanceProps['source'];
  provenanceLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, provenance, provenanceLabel, actions }: PageHeaderProps) {
  return (
    <header className="flex justify-between items-start gap-4">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-display font-bold text-slate-100">{title}</h1>
          {provenance && (
            <DataProvenance source={provenance} label={provenanceLabel} />
          )}
        </div>
        {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  );
}

export function SeverityChip({
  severity,
  className,
}: {
  severity: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
}) {
  const styles = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase',
        styles[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}

export function StatusChip({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const styles: Record<string, string> = {
    open: 'bg-red-500/10 text-red-400 border-red-500/20',
    triaging: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    escalated: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    contained: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    acknowledged: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    suppressed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase',
        styles[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        className,
      )}
    >
      {status}
    </span>
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-800 rounded" />
      <div className="h-4 w-96 bg-slate-800/60 rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="sentra-panel p-6 space-y-3">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-8 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      <div className="sentra-panel overflow-hidden">
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="flex gap-4 px-6 py-4 border-b border-slate-800"
          >
            <div className="h-3 flex-1 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="sentra-panel p-16 text-center flex flex-col items-center gap-4">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-600" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
