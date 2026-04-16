import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

// Prefer an explicit API base from env (for split-domain deployments),
// otherwise fall back to same-origin relative path (standard Vite-proxy setup).
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

type ServiceStatus = "ok" | "degraded" | "not_configured" | "unavailable";
type OverallStatus = "healthy" | "degraded" | "warning";

interface HealthService {
  status: ServiceStatus;
  latencyMs?: number | null;
  mode?: string;
}

interface HealthResponse {
  status?: OverallStatus | string;
  environment?: string;
  mode?: string;
  version?: string;
  uptime?: number;
  services?: {
    server?: Partial<HealthService> | null;
    database?: Partial<HealthService> | null;
    job_queue?: { status?: string; depth?: number } | null;
    storage?: Partial<HealthService> | null;
    auth?: Partial<HealthService> | null;
    ai?: Partial<HealthService> | null;
    [key: string]: unknown;
  };
}

const ENV_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  production: { color: "#c45a4a", bg: "rgba(196,90,74,0.12)", label: "PRODUCTION" },
  staging:    { color: "#c8953c", bg: "rgba(200,149,60,0.12)", label: "STAGING" },
  development:{ color: "#6b8f71", bg: "rgba(107,143,113,0.1)", label: "DEVELOPMENT" },
  demo:       { color: "#8b7ac8", bg: "rgba(139,122,200,0.1)", label: "DEMO" },
};

function getStatusDot(status: string) {
  if (status === "ok" || status === "connected") return "#6b8f71";
  if (status === "degraded" || status === "backpressure") return "#c8953c";
  return "#c45a4a";
}

function ServiceDot({ label, status, latencyMs }: { label: string; status: string; latencyMs?: number | null }) {
  const color = getStatusDot(status);
  const isOk = status === "ok" || status === "connected";
  return (
    <div
      className="flex items-center gap-1 cursor-default"
      title={`${label}: ${status}${latencyMs != null ? ` · ${latencyMs}ms` : ""}`}
      role="status"
      aria-label={`${label} status: ${status}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${!isOk ? "animate-pulse" : ""}`}
        style={{ background: color }}
        aria-hidden="true"
      />
      <span className="text-[8px] font-mono hidden lg:inline" style={{ color: "rgba(255,255,255,0.35)" }}>
        {label}
      </span>
    </div>
  );
}

export function ServiceStatusRail() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/health`, {
        signal: AbortSignal.timeout(4000),
        credentials: "include",
      });
      // Accept 200 (healthy/warning) and 503 (degraded) — both return structured JSON.
      // Only treat non-parseable or true network errors as "unreachable".
      if (resp.ok || resp.status === 503) {
        try {
          const data: HealthResponse = await resp.json();
          setHealth(data);
          setError(false);
          setLastFetched(new Date());
        } catch {
          // Body is not JSON (e.g. a proxy error page) — treat as unreachable
          setError(true);
        }
      } else {
        // Unexpected status (4xx auth, 502 gateway, etc.) — treat as unreachable
        setError(true);
      }
    } catch {
      // Network error or timeout — truly unreachable
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Prefer explicit `mode` (demo/prod/staging) over NODE_ENV-derived `environment`
  // so demo setups running with NODE_ENV=production show the correct badge.
  const env = health?.mode ?? health?.environment ?? "development";
  const envCfg = ENV_COLORS[env] ?? ENV_COLORS.development;
  const overallStatus = health?.status;
  const isHealthy = !error && (overallStatus === "healthy" || overallStatus === "warning");
  const isConnected = !error && health != null;

  const svc = health?.services ?? {};
  const apiStatus   = svc.server?.status    ?? "unavailable";
  const dbStatus    = svc.database?.status  ?? "unavailable";
  const dbLatency   = svc.database?.latencyMs ?? null;
  const authStatus  = svc.auth?.status      ?? "not_configured";
  const aiStatus    = svc.ai?.status        ?? "not_configured";
  const queueStatus = svc.job_queue?.status ?? "not_configured";

  return (
    <div
      className="flex items-center justify-between px-3 py-1 shrink-0"
      style={{
        background: "rgba(6,10,18,0.9)",
        borderTop: "1px solid rgba(255,255,255,0.03)",
        backdropFilter: "blur(4px)",
      }}
      role="complementary"
      aria-label="Service status rail"
    >
      <div className="flex items-center gap-3">
        <span
          className="text-[7px] font-mono font-black uppercase tracking-[0.2em] px-1.5 py-px rounded"
          style={{ color: envCfg.color, background: envCfg.bg, border: `1px solid ${envCfg.color}20` }}
          aria-label={`Environment: ${envCfg.label}`}
        >
          {envCfg.label}
        </span>

        {isConnected ? (
          <div className="flex items-center gap-2.5">
            <ServiceDot label="API"   status={apiStatus} />
            <ServiceDot label="DB"    status={dbStatus}  latencyMs={dbLatency} />
            <ServiceDot label="Auth"  status={authStatus} />
            <ServiceDot label="AI"    status={aiStatus} />
            <ServiceDot label="Queue" status={queueStatus} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-1" title="Cannot reach API">
            <WifiOff className="w-2.5 h-2.5" style={{ color: "#c45a4a" }} aria-hidden="true" />
            <span className="text-[8px] font-mono" style={{ color: "#c45a4a" }}>API unreachable</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" aria-hidden="true" />
            <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Connecting…</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {overallStatus === "degraded" && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" style={{ color: "#c45a4a" }} aria-hidden="true" />
            <span className="text-[8px] font-mono" style={{ color: "#c45a4a" }}>Degraded</span>
          </div>
        )}
        {overallStatus === "warning" && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" style={{ color: "#c8953c" }} aria-hidden="true" />
            <span className="text-[8px] font-mono hidden sm:inline" style={{ color: "#c8953c" }}>Warning</span>
          </div>
        )}
        {isHealthy && overallStatus === "healthy" && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" style={{ color: "#6b8f71" }} aria-hidden="true" />
            <span className="text-[8px] font-mono hidden sm:inline" style={{ color: "rgba(107,143,113,0.7)" }}>All systems operational</span>
          </div>
        )}

        {lastFetched && (
          <span className="text-[7px] font-mono hidden md:inline" style={{ color: "rgba(255,255,255,0.18)" }}>
            Synced {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-0.5 rounded hover:bg-white/5 transition-colors"
          style={{ color: "rgba(255,255,255,0.25)" }}
          aria-label="Refresh service status"
          title="Refresh status"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>

        {health?.version && (
          <span className="text-[7px] font-mono hidden md:inline" style={{ color: "rgba(255,255,255,0.14)" }}>
            v{health.version}
          </span>
        )}
      </div>
    </div>
  );
}
