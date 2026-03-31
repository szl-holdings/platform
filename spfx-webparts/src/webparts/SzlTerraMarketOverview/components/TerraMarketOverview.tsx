import * as React from "react";
import type { AadHttpClient } from "@microsoft/sp-http";

interface TerraMarketSignal {
  id: number;
  propertyAddress: string;
  borough: string;
  signalType: string;
  estimatedValue: number;
  riskScore: number;
  createdAt: string;
}

interface ITerraMarketOverviewProps {
  apiBaseUrl: string;
  orgId: string;
  refreshIntervalSeconds: number;
  marketFilter: string;
  showHeatmap: boolean;
  currency: string;
  aadClient: AadHttpClient | undefined;
  userDisplayName: string;
}

const formatCurrency = (value: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(value);
};

const riskColor = (score: number): string => {
  if (score >= 75) return "#ef4444";
  if (score >= 50) return "#f59e0b";
  return "#10b981";
};

const TerraMarketOverview: React.FC<ITerraMarketOverviewProps> = (props) => {
  const [signals, setSignals] = React.useState<TerraMarketSignal[]>([]);
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
      const url = `${props.apiBaseUrl}/terra/distress/signals?limit=20`;
      let response: Response;
      if (props.aadClient) {
        const azRes = await props.aadClient.get(url, 1, {});
        response = azRes as unknown as Response;
      } else {
        response = await fetch(url, { credentials: "include" });
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json() as { data: TerraMarketSignal[] };
      setSignals(Array.isArray(json.data) ? json.data : []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Terra market data");
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

  if (loading) return <div style={containerStyle}><div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading market data...</div></div>;
  if (error) return <div style={containerStyle}><div style={{ color: "#ef4444", padding: 20 }}><strong>Error:</strong> {error}</div></div>;

  const highRiskCount = signals.filter(s => s.riskScore >= 75).length;
  const medRiskCount = signals.filter(s => s.riskScore >= 50 && s.riskScore < 75).length;
  const totalValue = signals.reduce((sum, s) => sum + (s.estimatedValue || 0), 0);

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>Terra Real Estate Intelligence</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Market Overview — {signals.length} signals</div>
        </div>
        {lastUpdated && <div style={{ fontSize: 10, color: "#64748b" }}>Updated {lastUpdated.toLocaleTimeString()}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "High Risk", value: highRiskCount, color: "#ef4444" },
          { label: "Med Risk", value: medRiskCount, color: "#f59e0b" },
          { label: "Total Value", value: formatCurrency(totalValue, props.currency), color: "#10b981" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#1e293b", borderRadius: 8, padding: "12px 14px", border: "1px solid #334155" }}>
            <div style={{ fontSize: typeof value === "number" ? 22 : 16, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Market Signals</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {signals.length === 0 && <div style={{ color: "#64748b", fontSize: 12 }}>No market signals available</div>}
        {signals.slice(0, 10).map((signal) => (
          <div key={signal.id} style={{ background: "#1e293b", borderRadius: 6, padding: "8px 12px", border: "1px solid #334155", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor(signal.riskScore), flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {signal.propertyAddress}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>
                {signal.borough} · {signal.signalType} · {formatCurrency(signal.estimatedValue, props.currency)}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: riskColor(signal.riskScore) }}>
              {signal.riskScore}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerraMarketOverview;
