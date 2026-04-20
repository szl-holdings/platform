import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from './utils';

export interface AmbientSignal {
  id: string;
  domain: string;
  title: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  score: number;
  timestamp: number;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  correlationIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface AmbientIntelligenceConfig {
  appDomain: string;
  maxSignals?: number;
  refreshIntervalMs?: number;
  roleWeights?: Record<string, number>;
}

const SEVERITY_COLORS: Record<AmbientSignal['severity'], string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#6b7280',
};

const SEVERITY_PRIORITY: Record<AmbientSignal['severity'], number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  info: 10,
};

function temporalDecay(timestamp: number, halfLifeMs: number = 3600000): number {
  const age = Date.now() - timestamp;
  return 0.5 ** (age / halfLifeMs);
}

function scoreSignal(signal: AmbientSignal): number {
  const severityWeight = SEVERITY_PRIORITY[signal.severity];
  const decay = temporalDecay(signal.timestamp);
  return signal.score * severityWeight * decay;
}

export function useAmbientIntelligence(signals: AmbientSignal[]) {
  const ranked = useMemo(() => {
    return [...signals]
      .map((s) => ({ ...s, computedScore: scoreSignal(s) }))
      .sort((a, b) => b.computedScore - a.computedScore);
  }, [signals]);

  const topSignal = ranked[0] ?? null;
  const topThree = ranked.slice(0, 3);

  return { ranked, topSignal, topThree };
}

export interface AmbientBarProps {
  signals: AmbientSignal[];
  appDomain: string;
  accentColor?: string;
  onSignalClick?: (signal: AmbientSignal) => void;
  className?: string;
  compact?: boolean;
}

export function AmbientBar({
  signals,
  appDomain,
  accentColor = '#8b5cf6',
  onSignalClick,
  className,
  compact = false,
}: AmbientBarProps) {
  const { topSignal, topThree } = useAmbientIntelligence(signals);
  const [expanded, setExpanded] = useState(false);

  if (!topSignal) return null;

  return (
    <div
      className={cn('w-full border-b backdrop-blur-sm transition-all', className)}
      style={{
        background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}04 100%)`,
        borderColor: `${accentColor}20`,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-2">
        <div
          className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white shrink-0"
          style={{ background: SEVERITY_COLORS[topSignal.severity] }}
        >
          !
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
              What Matters Now
            </span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: `${SEVERITY_COLORS[topSignal.severity]}20`,
                color: SEVERITY_COLORS[topSignal.severity],
              }}
            >
              {topSignal.severity}
            </span>
          </div>
          <p className="text-sm font-medium truncate mt-0.5 text-white/90">{topSignal.title}</p>
          {!compact && <p className="text-xs text-white/50 truncate">{topSignal.summary}</p>}
        </div>

        {topSignal.actionUrl && (
          <button
            onClick={() => onSignalClick?.(topSignal)}
            className="text-xs px-3 py-1.5 rounded font-medium transition-colors shrink-0"
            style={{
              background: `${accentColor}20`,
              color: accentColor,
            }}
          >
            {topSignal.actionLabel ?? 'View'}
          </button>
        )}

        {topThree.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-white/40 hover:text-white/60 transition-colors shrink-0"
          >
            {expanded ? '▲' : `+${topThree.length - 1} more`}
          </button>
        )}
      </div>

      {expanded && topThree.length > 1 && (
        <div className="border-t px-4 py-2 space-y-1" style={{ borderColor: `${accentColor}10` }}>
          {topThree.slice(1).map((signal) => (
            <div
              key={signal.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-2 py-1 transition-colors"
              onClick={() => onSignalClick?.(signal)}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: SEVERITY_COLORS[signal.severity] }}
              />
              <span className="text-xs text-white/70 truncate flex-1">{signal.title}</span>
              <span className="text-[10px] text-white/30">
                {new Date(signal.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
