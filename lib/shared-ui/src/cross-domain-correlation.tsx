import { useMemo, useState } from 'react';
import { cn } from './utils';

export interface CrossDomainCorrelation {
  id: string;
  title: string;
  description: string;
  domains: string[];
  confidence: number;
  timestamp: number;
  signals: Array<{
    domain: string;
    event: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  }>;
  suggestedActions?: string[];
  impact?: 'high' | 'medium' | 'low';
}

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  firestorm: '#ef4444',
  vessels: '#3b82f6',
  terra: '#10b981',
  lyte: '#f59e0b',
  prism: '#8b5cf6',
  'szl-holdings': '#6366f1',
  'carlota-jo': '#ec4899',
  stephen: '#a855f7',
  imperium: '#c9a227',
};

const DOMAIN_LABELS: Record<string, string> = {
  aegis: 'Aegis',
  firestorm: 'Aegis',
  vessels: 'Vessels',
  terra: 'Terra',
  lyte: 'Lyte',
  prism: 'PRISM',
  'szl-holdings': 'SZL Holdings',
  'carlota-jo': 'Carlota Jo',
  stephen: 'Stephen',
  imperium: 'Imperium',
};

export interface CorrelationFeedProps {
  correlations: CrossDomainCorrelation[];
  currentDomain?: string;
  accentColor?: string;
  className?: string;
  maxItems?: number;
  onCorrelationClick?: (correlation: CrossDomainCorrelation) => void;
}

export function CorrelationFeed({
  correlations,
  currentDomain,
  accentColor = '#8b5cf6',
  className,
  maxItems = 10,
  onCorrelationClick,
}: CorrelationFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...correlations].sort((a, b) => b.timestamp - a.timestamp);
    if (currentDomain) {
      return sorted.filter((c) => c.domains.includes(currentDomain)).slice(0, maxItems);
    }
    return sorted.slice(0, maxItems);
  }, [correlations, currentDomain, maxItems]);

  if (filtered.length === 0) {
    return (
      <div className={cn('text-center py-6', className)}>
        <p className="text-xs text-white/30">No cross-domain correlations detected</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 px-1 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Cross-Domain Intelligence
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">
          {filtered.length}
        </span>
      </div>

      {filtered.map((correlation) => {
        const isExpanded = expandedId === correlation.id;
        return (
          <div
            key={correlation.id}
            className="rounded-lg border bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="px-3 py-2.5 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : correlation.id)}
            >
              <div className="flex items-start gap-2">
                <div className="flex -space-x-1 mt-0.5 shrink-0">
                  {correlation.domains.slice(0, 3).map((domain) => (
                    <div
                      key={domain}
                      className="w-4 h-4 rounded-full border border-neutral-900 flex items-center justify-center text-[7px] font-bold text-white"
                      style={{ background: DOMAIN_COLORS[domain] ?? '#6b7280' }}
                      title={DOMAIN_LABELS[domain] ?? domain}
                    >
                      {(DOMAIN_LABELS[domain] ?? domain).charAt(0)}
                    </div>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{correlation.title}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">
                    {correlation.description}
                  </p>
                </div>
                {correlation.impact && (
                  <span
                    className={cn(
                      'text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                      correlation.impact === 'high'
                        ? 'bg-red-500/20 text-red-400'
                        : correlation.impact === 'medium'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400',
                    )}
                  >
                    {correlation.impact}
                  </span>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                  <span>Confidence:</span>
                  <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${correlation.confidence * 100}%`,
                        background: correlation.confidence > 0.8 ? '#10b981' : '#f59e0b',
                      }}
                    />
                  </div>
                  <span className="font-mono">{Math.round(correlation.confidence * 100)}%</span>
                </div>

                <div className="space-y-1">
                  {correlation.signals.map((signal, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: DOMAIN_COLORS[signal.domain] ?? '#6b7280' }}
                      />
                      <span className="text-white/50">
                        {DOMAIN_LABELS[signal.domain] ?? signal.domain}:
                      </span>
                      <span className="text-white/70">{signal.event}</span>
                    </div>
                  ))}
                </div>

                {correlation.suggestedActions && correlation.suggestedActions.length > 0 && (
                  <div className="bg-white/5 rounded-md p-2 mt-1">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">
                      Suggested Actions
                    </div>
                    {correlation.suggestedActions.map((action, i) => (
                      <div key={i} className="text-[11px] text-white/60 flex items-start gap-1.5">
                        <span className="text-white/20 mt-0.5">→</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => onCorrelationClick?.(correlation)}
                  className="text-[10px] px-2 py-1 rounded border border-white/10 text-white/50 hover:text-white/70 hover:border-white/20 transition-colors"
                >
                  Investigate →
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
