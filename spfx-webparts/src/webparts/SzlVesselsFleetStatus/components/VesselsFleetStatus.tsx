import * as React from "react";
import type { AadHttpClient } from "@microsoft/sp-http";

interface VesselSummary {
  vesselId: string;
  name: string;
  flag: string;
  status: string;
  currentPort: string | null;
  destination: string | null;
  speed: number;
  heading: number;
  lastUpdated: string;
  complianceStatus: string;
}

interface IVesselsFleetStatusProps {
  apiBaseUrl: string;
  orgId: string;
  refreshIntervalSeconds: number;
  showMap: boolean;
  vesselFilter: string;
  maxVessels: number;
  aadClient: AadHttpClient | undefined;
  userDisplayName: string;
}

const statusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "active": case "underway": return "#10b981";
    case "in port": case "moored": return "#3b82f6";
    case "alert": case "distress": return "#ef4444";
    case "anchored": return "#f59e0b";
    default: return "#6b7280";
  }
};

const VesselsFleetStatus: React.FC<IVesselsFleetStatusProps> = (props) => {
  const [vessels, setVessels] = React.useState<VesselSummary[]>([]);
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
      const params = new URLSearchParams({ limit: String(props.maxVessels) });
      if (props.vesselFilter !== "all") params.set("status", props.vesselFilter);
      const url = `${props.apiBaseUrl}/vessels/positions?${params.toString()}`;
      let response: Response;
      if (props.aadClient) {
        const azRes = await props.aadClient.get(url, 1, {});
        response = azRes as unknown as Response;
      } else {
        response = await fetch(url, { credentials: "include" });
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json() as { data: VesselSummary[] };
      setVessels(Array.isArray(json.data) ? json.data : []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vessel data");
    } finally {
      setLoading(false);
    }
  }, [props.apiBaseUrl, props.aadClient, props.maxVessels, props.vesselFilter]);

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

  if (loading) return <div style={containerStyle}><div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading fleet data...</div></div>;
  if (error) return <div style={containerStyle}><div style={{ color: "#ef4444", padding: 20 }}><strong>Error:</strong> {error}</div></div>;

  const activeCount = vessels.filter(v => ["active", "underway"].includes(v.status.toLowerCase())).length;
  const portCount = vessels.filter(v => ["in port", "moored"].includes(v.status.toLowerCase())).length;
  const alertCount = vessels.filter(v => ["alert", "distress"].includes(v.status.toLowerCase())).length;

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Vessels Maritime Intelligence</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Fleet Status — {vessels.length} vessels</div>
        </div>
        {lastUpdated && <div style={{ fontSize: 10, color: "#64748b" }}>Updated {lastUpdated.toLocaleTimeString()}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Underway", value: activeCount, color: "#10b981" },
          { label: "In Port", value: portCount, color: "#3b82f6" },
          { label: "Alerts", value: alertCount, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#1e293b", borderRadius: 8, padding: "12px 14px", border: "1px solid #334155" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fleet Roster</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {vessels.length === 0 && <div style={{ color: "#64748b", fontSize: 12, padding: "8px 0" }}>No vessels match the current filter</div>}
        {vessels.map((vessel) => (
          <div key={vessel.vesselId} style={{ background: "#1e293b", borderRadius: 6, padding: "8px 12px", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(vessel.status), flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {vessel.name} <span style={{ fontSize: 10, color: "#94a3b8" }}>{vessel.flag}</span>
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                {vessel.currentPort ? `Port: ${vessel.currentPort}` : vessel.destination ? `→ ${vessel.destination}` : "Position tracking"}
                {vessel.speed > 0 && ` · ${vessel.speed.toFixed(1)} kn`}
              </div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: `${statusColor(vessel.status)}20`, color: statusColor(vessel.status), textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {vessel.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VesselsFleetStatus;
