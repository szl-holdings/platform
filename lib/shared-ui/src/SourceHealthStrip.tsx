/**
 * SourceHealthStrip — live source freshness + connector health at the top of every app.
 * Stale or degraded sources surface inline on affected widgets, not buried in admin.
 */
import * as React from "react";
import type { SourceHealthRecord, SourceHealthStatus } from "./os-layer";
import { cn } from "./utils";

const STATUS_STYLE: Record<SourceHealthStatus, { color: string; bg: string; border: string; label: string }> = {
  healthy:      { color: "#6b8f71", bg: "rgba(107,143,113,0.10)", border: "rgba(107,143,113,0.20)", label: "Live" },
  degraded:     { color: "#c8953c", bg: "rgba(200,149,60,0.10)",  border: "rgba(200,149,60,0.20)",  label: "Degraded" },
  stale:        { color: "#c45a4a", bg: "rgba(196,90,74,0.10)",   border: "rgba(196,90,74,0.20)",   label: "Stale" },
  disconnected: { color: "#7c85a0", bg: "rgba(124,133,160,0.10)", border: "rgba(124,133,160,0.20)", label: "Disconnected" },
};

function freshnessLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

export interface SourceHealthPillProps {
  source: SourceHealthRecord;
  className?: string;
}

export function SourceHealthPill({ source, className }: SourceHealthPillProps) {
  const [open, setOpen] = React.useState(false);
  const style = STATUS_STYLE[source.status];

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn("inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80", className)}
        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
        aria-label={`${source.sourceName}: ${style.label}`}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />
        <span>{source.sourceName}</span>
        <span style={{ color: "rgba(255,255,255,0.35)" }}>{freshnessLabel(source.freshnessSeconds)}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute top-full left-0 mt-1 z-50 w-64 rounded-lg text-xs p-3 space-y-2"
            style={{ background: "#10141e", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>{source.sourceName}</span>
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                {style.label}
              </span>
            </div>
            <div className="space-y-1 text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <div>Connector: <span style={{ color: "rgba(255,255,255,0.72)" }}>{source.connector}</span></div>
              <div>Last seen: <span style={{ color: "rgba(255,255,255,0.72)" }}>{new Date(source.lastSeenAt).toLocaleString()}</span></div>
              {source.latencyMs && <div>Latency: <span style={{ color: "rgba(255,255,255,0.72)" }}>{source.latencyMs}ms</span></div>}
              {source.errorMessage && (
                <div className="mt-1 rounded px-2 py-1" style={{ background: "rgba(196,90,74,0.1)", color: "#c45a4a", border: "1px solid rgba(196,90,74,0.2)" }}>
                  {source.errorMessage}
                </div>
              )}
              {source.affectedWidgets?.length ? (
                <div>Affects: <span style={{ color: "rgba(255,255,255,0.72)" }}>{source.affectedWidgets.join(", ")}</span></div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export interface SourceHealthStripProps {
  sources: SourceHealthRecord[];
  loading?: boolean;
  variant?: string;
  className?: string;
}

export function SourceHealthStrip({ sources, loading = false, variant, className }: SourceHealthStripProps) {
  const degraded = sources.filter(s => s.status !== "healthy");
  const hasIssues = degraded.length > 0;

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 px-4 py-1.5", className)}
        style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.15)" }} />
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Loading source health…</span>
      </div>
    );
  }

  if (!sources.length) return null;

  return (
    <div
      className={cn("flex items-center gap-2 px-4 py-1.5 flex-wrap", className)}
      style={{
        background: hasIssues ? "rgba(200,149,60,0.04)" : "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span className="text-[9px] uppercase tracking-widest font-mono mr-1" style={{ color: "rgba(255,255,255,0.22)" }}>
        Sources
      </span>
      {sources.map(src => (
        <SourceHealthPill key={src.sourceId} source={src} />
      ))}
      {hasIssues && (
        <span className="ml-auto text-[9px] font-mono" style={{ color: "#c8953c" }}>
          {degraded.length} source{degraded.length !== 1 ? "s" : ""} degraded — affected widgets marked below
        </span>
      )}
    </div>
  );
}

// Per-widget freshness pill for inline use on KPI tiles, charts, alerts
export interface FreshnessPillProps {
  sourceId: string;
  sourceName?: string;
  freshnessSeconds: number;
  status?: SourceHealthStatus;
  className?: string;
}

export function FreshnessPill({ sourceId: _sourceId, sourceName, freshnessSeconds, status = "healthy", className }: FreshnessPillProps) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded text-[9px] font-mono px-1.5 py-0.5", className)}
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
      title={sourceName ? `Source: ${sourceName} — ${freshnessLabel(freshnessSeconds)}` : undefined}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: style.color }} />
      {freshnessLabel(freshnessSeconds)}
    </span>
  );
}
