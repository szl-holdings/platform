import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api-fetch';
import { cn } from '../utils';

export interface UsageIndicatorProps {
  featureKey?: string;
  label?: string;
  accentColor?: string;
  billingHref?: string;
  className?: string;
  compact?: boolean;
}

interface UsageSummary {
  limit: number | null;
  used: number;
  unit?: string;
}

const DEMO_USAGE: Record<string, UsageSummary> = {
  api_calls: { limit: 10000, used: 6230, unit: 'calls' },
  agent_runs: { limit: 500, used: 312, unit: 'runs' },
  vessels_tracked: { limit: 200, used: 147, unit: 'vessels' },
  briefings: { limit: 100, used: 58, unit: 'briefings' },
  default: { limit: 1000, used: 420, unit: 'events' },
};

function isDemoMode(): boolean {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    return env?.VITE_BILLING_DEMO_MODE === 'true' || env?.VITE_BILLING_DEMO_MODE === true;
  } catch {
    return false;
  }
}

function pct(used: number, limit: number | null): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function barColor(p: number, accent: string): string {
  if (p >= 90) return '#ef4444';
  if (p >= 75) return '#f59e0b';
  return accent;
}

export function UsageIndicator({
  featureKey = 'default',
  label,
  accentColor = '#6366f1',
  billingHref = '/account/billing',
  className,
  compact = false,
}: UsageIndicatorProps) {
  const queryFn = React.useCallback(async (): Promise<UsageSummary> => {
    if (isDemoMode()) {
      return DEMO_USAGE[featureKey] ?? DEMO_USAGE.default;
    }
    try {
      const raw = await apiFetch<UsageSummary & { demo?: boolean }>(
        `/api/billing/usage-summary?featureKey=${encodeURIComponent(featureKey)}`,
      );
      if (!raw || raw.demo || typeof raw.used !== 'number') {
        return DEMO_USAGE[featureKey] ?? DEMO_USAGE.default;
      }
      return raw;
    } catch {
      return DEMO_USAGE[featureKey] ?? DEMO_USAGE.default;
    }
  }, [featureKey]);

  const { data, isLoading } = useQuery<UsageSummary>({
    queryKey: ['billing-usage-indicator', featureKey],
    queryFn,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const usage = (data && typeof data.used === 'number') ? data : { limit: null, used: 0, unit: undefined };
  const p = pct(usage.used, usage.limit);
  const color = barColor(p, accentColor);
  const displayLabel = label ?? (featureKey === 'default' ? 'Usage' : featureKey.replace(/_/g, ' '));

  if (isLoading) return null;

  if (compact) {
    return (
      <a
        href={billingHref}
        className={cn('block group', className)}
        title={`${displayLabel}: ${usage.used}${usage.limit ? ` / ${usage.limit}` : ''} ${usage.unit ?? ''}`}
      >
        <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-1 rounded-full transition-all"
            style={{ width: `${p}%`, background: color }}
          />
        </div>
      </a>
    );
  }

  return (
    <a
      href={billingHref}
      className={cn(
        'block group rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]',
        className,
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {displayLabel}
        </span>
        {isDemoMode() && (
          <span className="text-[8px] font-mono uppercase tracking-wider px-1 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
            demo
          </span>
        )}
      </div>
      <div className="w-full h-1.5 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${p}%`, background: color }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {usage.used.toLocaleString()}
          {usage.limit ? ` / ${usage.limit.toLocaleString()}` : ''}
          {usage.unit ? ` ${usage.unit}` : ''}
        </span>
        <span
          className="text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: accentColor }}
        >
          view →
        </span>
      </div>
    </a>
  );
}
