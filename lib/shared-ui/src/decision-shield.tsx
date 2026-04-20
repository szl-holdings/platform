import { useMemo, useState } from 'react';
import { cn } from './utils';

export interface DecisionItem {
  id: string;
  domain: string;
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  autoResolved?: boolean;
  autoResolvedAt?: number;
  proofChainId?: string;
  deadline?: string;
  impact?: string;
  estimatedTimeSaved?: string;
}

export interface DecisionShieldSummary {
  pendingDecisions: DecisionItem[];
  autoResolved: DecisionItem[];
  totalAlerts: number;
  consolidatedTo: number;
  timeSavedMinutes: number;
}

export function useDecisionShield(items: DecisionItem[]): DecisionShieldSummary {
  return useMemo(() => {
    const autoResolved = items.filter((i) => i.autoResolved);
    const pending = items.filter((i) => !i.autoResolved);
    const timeSaved = autoResolved.length * 12;

    return {
      pendingDecisions: pending.slice(0, 3),
      autoResolved,
      totalAlerts: items.length,
      consolidatedTo: Math.min(pending.length, 3),
      timeSavedMinutes: timeSaved,
    };
  }, [items]);
}

export interface DecisionShieldPanelProps {
  items: DecisionItem[];
  accentColor?: string;
  onDecide?: (item: DecisionItem, action: 'approve' | 'reject' | 'defer') => void;
  onViewAutoResolved?: () => void;
  className?: string;
}

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
};

export function DecisionShieldPanel({
  items,
  accentColor = '#8b5cf6',
  onDecide,
  onViewAutoResolved,
  className,
}: DecisionShieldPanelProps) {
  const summary = useDecisionShield(items);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div
      className={cn('rounded-xl border bg-neutral-900/50 backdrop-blur', className)}
      style={{ borderColor: `${accentColor}20` }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: `${accentColor}10` }}
      >
        <div>
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <span className="text-base">🛡</span>
            Decision Shield
          </h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            {summary.totalAlerts} alerts → {summary.consolidatedTo} decisions needed
          </p>
        </div>
        {summary.autoResolved.length > 0 && (
          <button
            onClick={onViewAutoResolved}
            className="text-[10px] px-2 py-1 rounded-full border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            {summary.autoResolved.length} auto-resolved • {summary.timeSavedMinutes}min saved
          </button>
        )}
      </div>

      <div className="divide-y" style={{ ['--tw-divide-opacity' as string]: '0.05' }}>
        {summary.pendingDecisions.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="px-4 py-3">
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: RISK_COLORS[item.risk] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/85 truncate">{item.title}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                      style={{
                        background: `${RISK_COLORS[item.risk]}20`,
                        color: RISK_COLORS[item.risk],
                      }}
                    >
                      {item.risk}
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">
                    {item.domain} • {item.description}
                  </p>
                </div>
                <span className="text-white/20 text-xs shrink-0">{isExpanded ? '▲' : '▼'}</span>
              </div>

              {isExpanded && (
                <div className="mt-3 ml-5 space-y-2">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                      AI Recommendation
                    </div>
                    <p className="text-xs text-white/70">{item.recommendation}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.confidence * 100}%`,
                            background:
                              item.confidence > 0.8
                                ? '#10b981'
                                : item.confidence > 0.6
                                  ? '#f59e0b'
                                  : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-white/50 font-mono">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {item.impact && (
                    <p className="text-[11px] text-white/50">Impact: {item.impact}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onDecide?.(item, 'approve')}
                      className="text-[11px] px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onDecide?.(item, 'reject')}
                      className="text-[11px] px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onDecide?.(item, 'defer')}
                      className="text-[11px] px-3 py-1 rounded bg-white/10 text-white/50 hover:bg-white/15 transition-colors"
                    >
                      Defer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {summary.pendingDecisions.length === 0 && (
        <div className="px-4 py-6 text-center">
          <div className="text-2xl mb-1">✓</div>
          <p className="text-sm text-white/50">All clear — no decisions needed</p>
          {summary.autoResolved.length > 0 && (
            <p className="text-[11px] text-emerald-400/60 mt-1">
              {summary.autoResolved.length} items auto-resolved today
            </p>
          )}
        </div>
      )}
    </div>
  );
}
