import { m } from 'framer-motion';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AnimatedBar({
  value,
  max,
  color,
  delay = 0,
}: {
  value: number;
  max: number;
  color: string;
  delay?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <m.div
      className="h-full rounded-md"
      style={{ background: color }}
      initial={{ width: 0 }}
      animate={{ width: `${pct}%` }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    />
  );
}

export function AnimatedConfidenceBadge({ value, color }: { value: number; color: string }) {
  return (
    <m.span
      className="text-lg font-bold font-display"
      style={{ color }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'backOut' }}
    >
      {(value * 100).toFixed(0)}%
    </m.span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/10 border-red-500/25 text-red-400',
    high: 'bg-orange-500/10 border-orange-500/25 text-orange-400',
    medium: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
    low: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
    info: 'bg-muted/20 border-border/30 text-muted-foreground',
  };
  return (
    <span
      className={cn(
        'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border',
        colors[severity] ?? colors.info,
      )}
    >
      {severity}
    </span>
  );
}

export function LiveDataBanner({
  status,
  lastFetchedAt,
  onRefresh,
}: {
  status: string;
  lastFetchedAt: string | null;
  onRefresh: () => void;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 mb-4"
    >
      {status === 'loading' ? (
        <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin flex-shrink-0" />
      ) : status === 'error' ? (
        <WifiOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      ) : (
        <m.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        </m.div>
      )}
      <span className="text-[11px] text-muted-foreground flex-1">
        {status === 'loading' && 'Fetching live platform telemetry…'}
        {status === 'error' && (
          <span className="text-red-400">
            Could not load live data — API unreachable or session expired
          </span>
        )}
        {status === 'success' && (
          <>
            <span className="font-semibold text-emerald-400">Live Data</span>
            {lastFetchedAt &&
              ` · Fetched ${new Date(lastFetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </>
        )}
      </span>
      <button
        onClick={onRefresh}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Refresh live data"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </m.div>
  );
}
