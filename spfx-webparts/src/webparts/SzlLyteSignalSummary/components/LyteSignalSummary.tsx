import * as React from "react";
import type { ILyteSignalSummaryProps } from "./ILyteSignalSummaryProps";

interface LyteSignal {
  id: number;
  title: string;
  severity: string;
  status: string;
  source: string;
  receivedAt: string;
}

interface LyteSummary {
  totalSignals: number;
  criticalSignalCount: number;
  openIncidentCount: number;
  pendingRecommendationCount: number;
  activeCommandCardCount: number;
  recentSignals: LyteSignal[];
}

const severityColor = (severity: string): string => {
  switch (severity) {
    case "critical": return "#ef4444";
    case "warning": return "#f59e0b";
    case "info": return "#3b82f6";
    default: return "#6b7280";
  }
};

const LyteSignalSummary: React.FC<ILyteSignalSummaryProps> = (props) => {
  const [summary, setSummary] = React.useState<LyteSummary | null>(null);
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
      const url = `${props.apiBaseUrl}/lyte/executive-summary`;
      let response: Response;
      if (props.aadClient) {
        const azRes = await props.aadClient.get(url, 1, {});
        response = azRes as unknown as Response;
      } else {
        response = await fetch(url, { credentials: "include" });
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json() as { data: LyteSummary };
      setSummary(json.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Lyte data");
    } finally {
      setLoading(false);
    }
  }, [props.apiBaseUrl, props.aadClient]);

  React.useEffect(() => {
    void fetchData();
    const interval = setInterval(() => { void fetchData(); }, props.refreshIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [fetchData, props.refreshIntervalSeconds]);

  const isDark = props.theme === "dark";
  const containerStyle: React.CSSProperties = {
    fontFamily: "'Segoe UI', -apple-system, sans-serif",
    background: isDark ? "#0f172a" : "#f8fafc",
    color: isDark ? "#f1f5f9" : "#0f172a",
    borderRadius: 12,
    padding: 20,
    minHeight: 200,
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
          Loading Lyte signals...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{ color: "#ef4444", padding: 20 }}>
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const signals = props.showCriticalOnly
    ? summary.recentSignals.filter(s => s.severity === "critical")
    : summary.recentSignals;
  const displaySignals = signals.slice(0, props.maxSignals);

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
            Lyte Command Center
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Welcome, {props.userDisplayName}
          </div>
        </div>
        {lastUpdated && (
          <div style={{ fontSize: 10, color: "#64748b" }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Critical Signals", value: summary.criticalSignalCount, color: "#ef4444" },
          { label: "Open Incidents", value: summary.openIncidentCount, color: "#f59e0b" },
          { label: "Pending Actions", value: summary.pendingRecommendationCount, color: "#3b82f6" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: isDark ? "#1e293b" : "#ffffff",
            borderRadius: 8,
            padding: "12px 14px",
            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Recent Signals
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {displaySignals.length === 0 && (
          <div style={{ color: "#64748b", fontSize: 12, padding: "8px 0" }}>No signals to display</div>
        )}
        {displaySignals.map((signal) => (
          <div key={signal.id} style={{
            background: isDark ? "#1e293b" : "#ffffff",
            borderRadius: 6,
            padding: "8px 12px",
            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: severityColor(signal.severity),
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {signal.title}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                {signal.source} · {new Date(signal.receivedAt).toLocaleString()}
              </div>
            </div>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              background: `${severityColor(signal.severity)}20`,
              color: severityColor(signal.severity),
              textTransform: "uppercase",
            }}>
              {signal.severity}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LyteSignalSummary;
