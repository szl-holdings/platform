import { AlertTriangle, CheckCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const API_BASE = (() => {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.VITE_API_BASE_URL ?? '';
  } catch {
    return '';
  }
})();

type ProbeStatus =
  | 'ok'
  | 'degraded'
  | 'error'
  | 'not_configured'
  | 'connected'
  | 'unavailable'
  | 'backpressure'
  | string;
type OverallStatus = 'healthy' | 'degraded' | 'warning' | string;

interface ServiceEntry {
  status: ProbeStatus;
  latencyMs?: number | null;
  depth?: number;
  mode?: string;
  details?: string;
}

interface DetailedHealthResponse {
  status?: OverallStatus;
  environment?: string;
  mode?: string;
  version?: string;
  uptime?: number;
  cacheAgeMs?: number | null;
  services?: {
    server?: Partial<ServiceEntry> | null;
    database?: Partial<ServiceEntry> | null;
    auth?: Partial<ServiceEntry> | null;
    ai?: Partial<ServiceEntry> | null;
    job_queue?: Partial<ServiceEntry> | null;
    [key: string]: unknown;
  };
}

const ENV_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  production: { color: '#c45a4a', bg: 'rgba(196,90,74,0.12)', label: 'PRODUCTION' },
  staging: { color: '#c8953c', bg: 'rgba(200,149,60,0.12)', label: 'STAGING' },
  development: { color: '#6b8f71', bg: 'rgba(107,143,113,0.1)', label: 'DEVELOPMENT' },
  'local-dev': { color: '#6b8f71', bg: 'rgba(107,143,113,0.1)', label: 'LOCAL' },
  demo: { color: '#8b7ac8', bg: 'rgba(139,122,200,0.1)', label: 'DEMO' },
};

const SLOW_THRESHOLD_MS = 500;

function resolveColor(status: ProbeStatus, latencyMs?: number | null): string {
  if (status === 'ok' || status === 'connected') {
    if (latencyMs != null && latencyMs > SLOW_THRESHOLD_MS) return '#c8953c';
    return '#6b8f71';
  }
  if (status === 'degraded' || status === 'backpressure' || status === 'not_configured')
    return '#c8953c';
  return '#c45a4a';
}

function isOkStatus(status: ProbeStatus, latencyMs?: number | null): boolean {
  return (
    (status === 'ok' || status === 'connected') &&
    !(latencyMs != null && latencyMs > SLOW_THRESHOLD_MS)
  );
}

function ServiceDot({
  label,
  status,
  latencyMs,
}: {
  label: string;
  status: ProbeStatus;
  latencyMs?: number | null;
}) {
  const color = resolveColor(status, latencyMs);
  const ok = isOkStatus(status, latencyMs);
  const latencyLabel = latencyMs != null ? `${latencyMs}ms` : null;

  const title = `${label}: ${status}${latencyMs != null ? ` · ${latencyMs}ms` : ''}`;

  return (
    <div
      className="flex items-center gap-1 cursor-default"
      title={title}
      role="status"
      aria-label={`${label} status: ${status}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${!ok ? 'animate-pulse' : ''}`}
        style={{ background: color }}
        aria-hidden="true"
      />
      <span
        className="text-[8px] font-mono hidden lg:inline"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {label}
      </span>
      {latencyLabel && (
        <span className="text-[7px] font-mono hidden xl:inline" style={{ color }}>
          {latencyLabel}
        </span>
      )}
    </div>
  );
}

export function ServiceStatusRail() {
  const [health, setHealth] = useState<DetailedHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/health/detailed`, {
        signal: AbortSignal.timeout(6000),
        credentials: 'include',
      });
      if (resp.ok || resp.status === 503) {
        try {
          const data: DetailedHealthResponse = await resp.json();
          setHealth(data);
          setError(false);
          setLastFetched(new Date());
        } catch {
          setError(true);
        }
      } else if (resp.status === 401 || resp.status === 403) {
        const fallback = await fetch(`${API_BASE}/api/health`, {
          signal: AbortSignal.timeout(4000),
          credentials: 'include',
        });
        if (fallback.ok || fallback.status === 503) {
          try {
            const data: DetailedHealthResponse = await fallback.json();
            setHealth(data);
            setError(false);
            setLastFetched(new Date());
          } catch {
            setError(true);
          }
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const env = health?.mode ?? health?.environment ?? 'development';
  const envCfg = (ENV_COLORS[env] ?? ENV_COLORS.development) as NonNullable<
    typeof ENV_COLORS.development
  >;
  const overallStatus = health?.status;
  const isHealthy = !error && (overallStatus === 'healthy' || overallStatus === 'warning');
  const isConnected = !error && health != null;

  const svc = health?.services ?? {};
  const apiStatus = (svc.server?.status as ProbeStatus | undefined) ?? 'unavailable';
  const dbStatus = (svc.database?.status as ProbeStatus | undefined) ?? 'unavailable';
  const dbLatency = svc.database?.latencyMs ?? null;
  const authStatus = (svc.auth?.status as ProbeStatus | undefined) ?? 'not_configured';
  const authLatency = svc.auth?.latencyMs ?? null;
  const aiStatus = (svc.ai?.status as ProbeStatus | undefined) ?? 'not_configured';
  const aiLatency = svc.ai?.latencyMs ?? null;
  const queueStatus = (svc.job_queue?.status as ProbeStatus | undefined) ?? 'not_configured';
  const queueLatency = svc.job_queue?.latencyMs ?? null;

  return (
    <div
      className="flex items-center justify-between px-3 py-1 shrink-0"
      style={{
        background: 'rgba(6,10,18,0.9)',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        backdropFilter: 'blur(4px)',
      }}
      role="complementary"
      aria-label="Service status rail"
    >
      <div className="flex items-center gap-3">
        <span
          className="text-[7px] font-mono font-black uppercase tracking-[0.2em] px-1.5 py-px rounded"
          style={{
            color: envCfg.color,
            background: envCfg.bg,
            border: `1px solid ${envCfg.color}20`,
          }}
          aria-label={`Environment: ${envCfg.label}`}
        >
          {envCfg.label}
        </span>

        {isConnected ? (
          <div className="flex items-center gap-2.5">
            <ServiceDot label="API" status={apiStatus} />
            <ServiceDot label="DB" status={dbStatus} latencyMs={dbLatency} />
            <ServiceDot label="Auth" status={authStatus} latencyMs={authLatency} />
            <ServiceDot label="AI" status={aiStatus} latencyMs={aiLatency} />
            <ServiceDot label="Queue" status={queueStatus} latencyMs={queueLatency} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-1" title="Cannot reach API">
            <WifiOff className="w-2.5 h-2.5" style={{ color: '#c45a4a' }} aria-hidden="true" />
            <span className="text-[8px] font-mono" style={{ color: '#c45a4a' }}>
              API unreachable
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse"
              aria-hidden="true"
            />
            <span className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Connecting…
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {overallStatus === 'degraded' && (
          <div className="flex items-center gap-1">
            <AlertTriangle
              className="w-2.5 h-2.5"
              style={{ color: '#c45a4a' }}
              aria-hidden="true"
            />
            <span className="text-[8px] font-mono" style={{ color: '#c45a4a' }}>
              Degraded
            </span>
          </div>
        )}
        {overallStatus === 'warning' && (
          <div className="flex items-center gap-1">
            <AlertTriangle
              className="w-2.5 h-2.5"
              style={{ color: '#c8953c' }}
              aria-hidden="true"
            />
            <span className="text-[8px] font-mono hidden sm:inline" style={{ color: '#c8953c' }}>
              Warning
            </span>
          </div>
        )}
        {isHealthy && overallStatus === 'healthy' && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" style={{ color: '#6b8f71' }} aria-hidden="true" />
            <span
              className="text-[8px] font-mono hidden sm:inline"
              style={{ color: 'rgba(107,143,113,0.7)' }}
            >
              All systems operational
            </span>
          </div>
        )}

        {lastFetched && (
          <span
            className="text-[7px] font-mono hidden md:inline"
            style={{ color: 'rgba(255,255,255,0.18)' }}
          >
            Synced {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-0.5 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          aria-label="Refresh service status"
          title="Refresh status"
        >
          <RefreshCw
            className={`w-2.5 h-2.5 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </button>

        {health?.version && (
          <span
            className="text-[7px] font-mono hidden md:inline"
            style={{ color: 'rgba(255,255,255,0.14)' }}
          >
            v{health.version}
          </span>
        )}
      </div>
    </div>
  );
}
