import { useEffect, useMemo, useState } from "react";
import { RefreshCw, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface NarrativeOption {
  id: string;
  label: string;
}

interface StatusResponse {
  enabled: boolean;
  narratives: NarrativeOption[];
  estimatedSeconds: { all: number; single: number };
}

interface ResetResponse {
  sessionId: string;
  narrative: string;
  narrativeLabel: string;
  durationMs: number;
  operations: Array<{ operation: string; status: string; detail?: string }>;
  readyForDemo: boolean;
}

type ResetState =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "success"; result: ResetResponse }
  | { kind: "error"; message: string };

/**
 * In-platform demo reset toolbar. Renders only when the API reports
 * `DEMO_MODE=true` (typically demo / staging environments). Lets a presenter
 * with an admin session restore demo data without opening a terminal.
 */
export function DemoResetToolbar() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [narrative, setNarrative] = useState<string>("all");
  const [state, setState] = useState<ResetState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/api/demo/reset/status`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled) return;
        const data = body?.data ?? body;
        if (data && typeof data.enabled === "boolean") {
          setStatus(data);
        }
      })
      .catch(() => {
        // silent — toolbar simply won't render
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const elapsedLabel = useMemo(() => {
    if (state.kind === "running") {
      return "Reset in progress…";
    }
    if (state.kind === "success") {
      return `Ready in ${(state.result.durationMs / 1000).toFixed(1)}s`;
    }
    if (state.kind === "error") {
      return state.message;
    }
    return null;
  }, [state]);

  if (!status?.enabled) return null;

  const handleReset = async () => {
    if (state.kind === "running") return;
    setState({ kind: "running", startedAt: Date.now() });
    try {
      const response = await fetch(`${BASE}/api/demo/reset`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const errMsg =
          body?.error ||
          body?.message ||
          (response.status === 401 ? "Sign in as an admin to reset demo data." :
           response.status === 403 ? "Admin role required to reset demo data." :
           response.status === 404 ? "Demo reset endpoint disabled." :
           `Reset failed (HTTP ${response.status})`);
        setState({ kind: "error", message: errMsg });
        toast.error(errMsg);
        return;
      }
      const data: ResetResponse = body?.data ?? body;
      setState({ kind: "success", result: data });
      toast.success(`Demo reset complete in ${(data.durationMs / 1000).toFixed(1)}s — ${data.narrativeLabel}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error during demo reset";
      setState({ kind: "error", message: msg });
      toast.error(msg);
    }
  };

  const indicator = (() => {
    if (state.kind === "running") return <Loader2 size={12} className="animate-spin" style={{ color: "hsl(192,72%,55%)" }} />;
    if (state.kind === "success") return <CheckCircle size={12} style={{ color: "hsl(142,55%,60%)" }} />;
    if (state.kind === "error") return <AlertTriangle size={12} style={{ color: "hsl(0,72%,60%)" }} />;
    return <RefreshCw size={12} style={{ color: "hsl(210,5%,52%)" }} />;
  })();

  const isRunning = state.kind === "running";

  return (
    <div
      data-testid="demo-reset-toolbar"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.625rem 0.875rem",
        borderRadius: "0.5rem",
        background: "hsla(38,72%,58%,0.06)",
        border: "1px solid hsla(38,72%,58%,0.22)",
        marginBottom: "1.25rem",
        fontSize: "12.5px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: "10px",
          color: "hsl(38,72%,72%)",
        }}
      >
        Demo Mode
      </span>

      <label htmlFor="demo-reset-narrative" style={{ color: "hsl(210,5%,62%)" }}>
        Narrative:
      </label>
      <select
        id="demo-reset-narrative"
        data-testid="demo-reset-narrative-select"
        value={narrative}
        onChange={(e) => setNarrative(e.target.value)}
        disabled={isRunning}
        style={{
          padding: "0.3rem 0.5rem",
          borderRadius: "5px",
          background: "hsla(0,0%,100%,0.04)",
          border: "1px solid hsla(0,0%,100%,0.1)",
          color: "hsl(38,12%,88%)",
          fontSize: "12px",
          cursor: isRunning ? "not-allowed" : "pointer",
        }}
      >
        {status.narratives.map((n) => (
          <option key={n.id} value={n.id}>
            {n.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        data-testid="demo-reset-button"
        onClick={handleReset}
        disabled={isRunning}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: "0.375rem 0.75rem",
          borderRadius: "5px",
          background: isRunning ? "hsla(38,72%,58%,0.05)" : "hsla(38,72%,58%,0.14)",
          border: "1px solid hsla(38,72%,58%,0.4)",
          color: "hsl(38,72%,72%)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: isRunning ? "not-allowed" : "pointer",
          transition: "all 0.18s",
        }}
      >
        <RefreshCw size={11} className={isRunning ? "animate-spin" : ""} />
        {isRunning ? "Resetting…" : "Reset Demo"}
      </button>

      {elapsedLabel && (
        <span
          data-testid="demo-reset-status"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            color:
              state.kind === "error"
                ? "hsl(0,72%,72%)"
                : state.kind === "success"
                ? "hsl(142,55%,68%)"
                : "hsl(210,5%,68%)",
          }}
        >
          {indicator}
          {elapsedLabel}
        </span>
      )}

      <span style={{ color: "hsl(210,5%,42%)", marginLeft: "auto", fontSize: "11px" }}>
        Reset typically completes in &lt; 60 seconds.
      </span>
    </div>
  );
}
