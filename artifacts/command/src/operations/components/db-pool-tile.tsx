import { Database, RefreshCw } from "lucide-react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useStandardQuery } from "@szl-holdings/api-client-react";

interface DbPoolStats {
  total: number;
  idle: number;
  active: number;
  waiting: number;
  max: number;
  usedPct: number;
  status: "ok" | "elevated" | "saturated";
}

interface DetailedHealthPayload {
  dbPool?: DbPoolStats;
}

const STATUS_COLORS: Record<DbPoolStats["status"], { fg: string; bg: string; bd: string; label: string }> = {
  ok:        { fg: "#6b8f71", bg: "rgba(107,143,113,0.06)", bd: "rgba(107,143,113,0.22)", label: "OK" },
  elevated:  { fg: "#d4a054", bg: "rgba(212,160,84,0.06)",  bd: "rgba(212,160,84,0.22)",  label: "ELEVATED" },
  saturated: { fg: "#c45a4a", bg: "rgba(196,90,74,0.06)",   bd: "rgba(196,90,74,0.22)",   label: "SATURATED" },
};

export function DbPoolTile() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useStandardQuery<DetailedHealthPayload>({
    queryKey: ["ops-db-pool"],
    queryFn: () => apiFetch<DetailedHealthPayload>("/health/detailed"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const pool = data?.dbPool;
  const derivedStatus: DbPoolStats["status"] = pool
    ? pool.usedPct > 80 || pool.waiting > 0
      ? "saturated"
      : pool.usedPct > 60
        ? "elevated"
        : "ok"
    : "ok";
  const effectiveStatus = pool?.status ?? derivedStatus;
  const colors = STATUS_COLORS[effectiveStatus] ?? STATUS_COLORS.ok;
  const usedPct = pool?.usedPct ?? 0;
  const barWidth = Math.min(100, Math.max(0, usedPct));

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: colors.bd, background: colors.bg }}
    >
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${colors.bd}` }}>
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5" style={{ color: colors.fg }} />
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: colors.fg }}>
            DB Connection Pool
          </span>
          {pool && (
            <span
              className="text-[8px] font-mono px-1.5 py-px rounded uppercase tracking-wider"
              style={{ color: colors.fg, background: `${colors.fg}10`, border: `1px solid ${colors.bd}` }}
            >
              {colors.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dataUpdatedAt > 0 && (
            <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
              {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            aria-label="Refresh pool stats"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        {isError && !pool ? (
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
            Pool stats unavailable. Diagnostics endpoint may require sign-in.
          </div>
        ) : !pool ? (
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Loading pool stats…
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-2xl font-bold font-mono" style={{ color: colors.fg }}>
                  {pool.usedPct.toFixed(1)}%
                </div>
                <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Used (active / max)
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {pool.active} active · {pool.idle} idle
                </div>
                <div className="text-[10px] font-mono" style={{ color: pool.waiting > 0 ? "#c45a4a" : "rgba(255,255,255,0.35)" }}>
                  {pool.waiting} waiting · max {pool.max}
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${barWidth}%`, background: colors.fg }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[8px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
              <span>0%</span>
              <span style={{ color: usedPct > 60 ? "#d4a054" : "rgba(255,255,255,0.25)" }}>60% elevated</span>
              <span style={{ color: usedPct > 80 ? "#c45a4a" : "rgba(255,255,255,0.25)" }}>80% saturated</span>
              <span>100%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
