import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = '/api';

export type AgentHealthStatus = 'healthy' | 'degraded' | 'offline';

export interface AIStatusBarMetrics {
  activeAgents: number;
  totalAgents: number;
  avgSuccessRate: number;
  avgLatencyMs: number;
  activeRuns: number;
  lastRefreshed: Date;
  status: AgentHealthStatus;
}

async function fetchAgentMetrics(): Promise<AIStatusBarMetrics | null> {
  try {
    const res = await fetch(`${API_BASE}/ai/mastra/agentops/metrics?windowHours=1`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const overall = data.overall ?? {};
    const healthy = overall.healthyAgents ?? 0;
    const degraded = overall.degradedAgents ?? 0;
    const breached = overall.breachedAgents ?? 0;
    const total = healthy + degraded + breached;
    const status: AgentHealthStatus =
      breached > 0 ? 'degraded' : degraded > 0 ? 'degraded' : total === 0 ? 'offline' : 'healthy';
    return {
      activeAgents: healthy + degraded,
      totalAgents: total,
      avgSuccessRate: overall.avgSuccessRate ?? 0,
      avgLatencyMs: overall.avgLatencyMs ?? 0,
      activeRuns: overall.totalRuns ?? 0,
      lastRefreshed: new Date(),
      status,
    };
  } catch {
    return null;
  }
}

function formatFreshness(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function PulseDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}88`,
        animation: 'aiStatusPulse 2s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  );
}

export interface AIStatusBarProps {
  onOpenCopilot?: () => void;
  accentColor?: string;
  domain?: string;
  compact?: boolean;
}

export function AIStatusBar({
  onOpenCopilot,
  accentColor = 'hsl(258, 80%, 62%)',
  domain,
  compact = false,
}: AIStatusBarProps) {
  const [metrics, setMetrics] = useState<AIStatusBarMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedAt, setCachedAt] = useState<Date | null>(null);
  const [_tick, setTick] = useState(0);
  const hasEverLoaded = useRef(false);

  const refresh = useCallback(async () => {
    const result = await fetchAgentMetrics();
    if (result) {
      setMetrics(result);
      setCachedAt(new Date());
      hasEverLoaded.current = true;
    } else if (!hasEverLoaded.current) {
      setMetrics({
        activeAgents: 0,
        totalAgents: 0,
        avgSuccessRate: 0,
        avgLatencyMs: 0,
        activeRuns: 0,
        lastRefreshed: new Date(),
        status: 'offline',
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  const statusColor =
    !metrics || metrics.status === 'offline'
      ? 'hsl(0, 0%, 40%)'
      : metrics.status === 'degraded'
        ? 'hsl(38, 88%, 52%)'
        : 'hsl(142, 70%, 45%)';

  const statusLabel =
    !metrics || metrics.status === 'offline'
      ? 'Offline'
      : metrics.status === 'degraded'
        ? 'Degraded'
        : 'Healthy';

  if (compact) {
    return (
      <>
        <style>{`
          @keyframes aiStatusPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
        `}</style>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.5)',
            cursor: onOpenCopilot ? 'pointer' : 'default',
            padding: '3px 8px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.025)',
            transition: 'all 0.15s',
          }}
          onClick={() => {
            onOpenCopilot?.();
            window.dispatchEvent(new CustomEvent('szl:open-copilot'));
          }}
          title="AI Intelligence Status"
        >
          <PulseDot color={statusColor} />
          <span style={{ color: statusColor, fontWeight: 600 }}>{statusLabel}</span>
          {metrics && metrics.totalAgents > 0 && (
            <span style={{ opacity: 0.6 }}>
              {metrics.activeAgents}/{metrics.totalAgents} agents
            </span>
          )}
          {cachedAt && <span style={{ opacity: 0.4 }}>{formatFreshness(cachedAt)}</span>}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes aiStatusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .ai-status-bar-btn:hover {
          background: rgba(255,255,255,0.07) !important;
          color: rgba(255,255,255,0.9) !important;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '6px 16px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.45)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            AI Intelligence
          </span>
          <PulseDot color={isLoading ? 'rgba(255,255,255,0.2)' : statusColor} />
          <span
            style={{
              color: isLoading ? 'rgba(255,255,255,0.3)' : statusColor,
              fontWeight: 600,
              fontSize: '0.68rem',
            }}
          >
            {isLoading ? 'Connecting…' : statusLabel}
          </span>
        </div>

        {metrics && metrics.totalAgents > 0 && (
          <>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
            <span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                {metrics.activeAgents}
              </span>
              <span style={{ opacity: 0.5 }}>/{metrics.totalAgents} agents</span>
            </span>
            {metrics.activeRuns > 0 && (
              <>
                <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
                <span>
                  <span style={{ color: accentColor, fontWeight: 600 }}>{metrics.activeRuns}</span>
                  <span style={{ opacity: 0.5 }}> active runs</span>
                </span>
              </>
            )}
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
            <span>
              <span
                style={{
                  color:
                    metrics.avgSuccessRate > 0.95
                      ? 'hsl(142,70%,50%)'
                      : metrics.avgSuccessRate > 0.8
                        ? 'hsl(38,88%,52%)'
                        : 'hsl(0,72%,55%)',
                  fontWeight: 600,
                }}
              >
                {(metrics.avgSuccessRate * 100).toFixed(0)}%
              </span>
              <span style={{ opacity: 0.5 }}> success</span>
            </span>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ opacity: 0.6 }}>avg {metrics.avgLatencyMs}ms</span>
          </>
        )}

        {cachedAt && (
          <>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ opacity: 0.4 }}>refreshed {formatFreshness(cachedAt)}</span>
          </>
        )}

        {domain && (
          <>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
            <span
              style={{
                opacity: 0.35,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '0.6rem',
              }}
            >
              {domain} domain
            </span>
          </>
        )}

        <div style={{ flex: 1 }} />

        <button
          className="ai-status-bar-btn"
          onClick={() => {
            onOpenCopilot?.();
            window.dispatchEvent(new CustomEvent('szl:open-copilot'));
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 5,
            border: `1px solid ${accentColor}40`,
            background: `${accentColor}10`,
            color: accentColor,
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            transition: 'all 0.15s',
          }}
        >
          ✦ AI Copilot
        </button>
      </div>
    </>
  );
}
