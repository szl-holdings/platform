import * as React from "react";
import type { AadHttpClient } from "@microsoft/sp-http";

interface WorkflowRun {
  id: number;
  workflowId: number;
  state: string;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
}

interface AlloyDashboard {
  summary: {
    totalWorkflows: number;
    totalRuns: number;
    totalArtifacts: number;
    pendingApprovals: number;
  };
  recentRuns: WorkflowRun[];
}

interface IAlloyWorkflowStatusProps {
  apiBaseUrl: string;
  orgId: string;
  refreshIntervalSeconds: number;
  showPendingApprovals: boolean;
  maxWorkflows: number;
  statusFilter: string;
  aadClient: AadHttpClient | undefined;
  userDisplayName: string;
}

const stateColor = (state: string): string => {
  switch (state) {
    case "completed": return "#10b981";
    case "running": return "#3b82f6";
    case "queued": return "#94a3b8";
    case "waiting_approval": return "#f59e0b";
    case "failed": return "#ef4444";
    case "canceled": return "#6b7280";
    default: return "#6b7280";
  }
};

const formatDuration = (ms: number | null): string => {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
};

const AlloyWorkflowStatus: React.FC<IAlloyWorkflowStatusProps> = (props) => {
  const [dashboard, setDashboard] = React.useState<AlloyDashboard | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!props.apiBaseUrl) {
      setError("API Base URL not configured. Edit this web part to set the SZL API URL.");
      setLoading(false);
      return;
    }
    try {
      const url = `${props.apiBaseUrl}/alloy/dashboard`;
      let response: Response;
      if (props.aadClient) {
        const azRes = await props.aadClient.get(url, 1, {});
        response = azRes as unknown as Response;
      } else {
        response = await fetch(url, { credentials: "include" });
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json() as { data: AlloyDashboard };
      setDashboard(json.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Alloy data");
    } finally {
      setLoading(false);
    }
  }, [props.apiBaseUrl, props.aadClient]);

  React.useEffect(() => {
    void fetchData();
    const interval = setInterval(() => { void fetchData(); }, props.refreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [fetchData, props.refreshIntervalSeconds]);

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
    background: "#0f172a",
    color: "#f1f5f9",
    borderRadius: 12,
    padding: 20,
    minHeight: 200,
  };

  if (loading) return <div style={containerStyle}><div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading Alloy status...</div></div>;
  if (error) return <div style={containerStyle}><div style={{ color: "#ef4444", padding: 20 }}><strong>Error:</strong> {error}</div></div>;
  if (!dashboard) return null;

  const displayRuns = (props.statusFilter === "all"
    ? dashboard.recentRuns
    : dashboard.recentRuns.filter(r => r.state === props.statusFilter)
  ).slice(0, props.maxWorkflows);

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Alloy Execution Fabric</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Workflow Status Dashboard</div>
        </div>
        {lastUpdated && <div style={{ fontSize: 10, color: "#64748b" }}>Updated {lastUpdated.toLocaleTimeString()}</div>}
      </div>

      {props.showPendingApprovals && dashboard.summary.pendingApprovals > 0 && (
        <div style={{ background: "#78350f20", border: "1px solid #f59e0b40", borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
          <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>
            {dashboard.summary.pendingApprovals} artifact{dashboard.summary.pendingApprovals !== 1 ? "s" : ""} pending approval
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Workflows", value: dashboard.summary.totalWorkflows, color: "#94a3b8" },
          { label: "Runs", value: dashboard.summary.totalRuns, color: "#3b82f6" },
          { label: "Artifacts", value: dashboard.summary.totalArtifacts, color: "#10b981" },
          { label: "Pending", value: dashboard.summary.pendingApprovals, color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#1e293b", borderRadius: 8, padding: "10px 12px", border: "1px solid #334155" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2, textTransform: "uppercase" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Runs</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {displayRuns.length === 0 && <div style={{ color: "#64748b", fontSize: 12 }}>No runs match the current filter</div>}
        {displayRuns.map((run) => (
          <div key={run.id} style={{ background: "#1e293b", borderRadius: 6, padding: "8px 12px", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stateColor(run.state), flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>Run #{run.id} · Workflow #{run.workflowId}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                {run.startedAt ? new Date(run.startedAt).toLocaleString() : new Date(run.queuedAt).toLocaleString()}
                {run.durationMs && ` · ${formatDuration(run.durationMs)}`}
              </div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${stateColor(run.state)}20`, color: stateColor(run.state), textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {run.state.replace("_", " ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlloyWorkflowStatus;
