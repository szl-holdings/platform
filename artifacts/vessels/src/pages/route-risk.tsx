import { useState } from "react";
import { AlertTriangle, Navigation, Wind, Anchor, Shield, Plug, BarChart3 } from "lucide-react";
import { voyageTwins, vesselTwins } from "@/data/fleet-twin";

const ACCENT = "hsl(205 70% 50%)";

const RISK_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
  low: { color: "#40856a", bg: "#40856a15", border: "#40856a30", label: "Low" },
  moderate: { color: "#c08a2c", bg: "#c08a2c15", border: "#c08a2c30", label: "Moderate" },
  elevated: { color: "#c04a2a", bg: "#c04a2a15", border: "#c04a2a30", label: "Elevated" },
  high: { color: "#c04a2a", bg: "#c04a2a15", border: "#c04a2a30", label: "High" },
  critical: { color: "#f87171", bg: "#9b1c1c15", border: "#9b1c1c40", label: "Critical" },
};

const WEATHER_STYLE = {
  low: "#40856a",
  moderate: "#c08a2c",
  high: "#c04a2a",
  severe: "#f87171",
};

function RiskGauge({ level }: { level: string }) {
  const levels = ["low", "moderate", "elevated", "critical"];
  const idx = levels.indexOf(level);
  return (
    <div className="flex items-center gap-1">
      {levels.map((l, i) => (
        <div
          key={l}
          className="h-2 w-8 rounded-sm transition-all"
          style={{
            background: i <= idx ? RISK_STYLE[l as keyof typeof RISK_STYLE]?.color : "rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </div>
  );
}

const CONTEXT_PANELS = [
  {
    id: "weather",
    label: "Weather Context",
    icon: Wind,
    description: "Live weather routing data — swell height, wind speed, tropical storm tracking, piracy advisories.",
    source: "StormGeo / MetOcean",
    status: "not_connected",
  },
  {
    id: "port",
    label: "Port Congestion",
    icon: Anchor,
    description: "Port AIS congestion, ETA advisories, berth availability, and terminal congestion indexes.",
    source: "PortChain / AIS",
    status: "not_connected",
  },
  {
    id: "sanctions",
    label: "Sanctions & Geopolitical",
    icon: Shield,
    description: "OFAC, EU, UN sanctions screening. Geopolitical risk zones, transit restrictions, embargo status.",
    source: "Dow Jones / WorldCheck",
    status: "not_connected",
  },
];

export default function RouteRisk() {
  const [selected, setSelected] = useState(voyageTwins[0]?.id ?? null);
  const voyage = voyageTwins.find(v => v.id === selected) ?? voyageTwins[0];
  const vessel = voyage ? vesselTwins.find(v => v.id === voyage.vesselId) : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Route Risk Board</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Voyage-level risk analysis — route, weather, port, and sanctions exposure
          </p>
        </div>
        <div className="flex items-center gap-2">
          {voyageTwins.map(v => (
            <button
              key={v.id}
              onClick={() => setSelected(v.id)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: selected === v.id ? "hsl(205 70% 38% / 0.15)" : "rgba(255,255,255,0.04)",
                color: selected === v.id ? ACCENT : "rgba(255,255,255,0.4)",
                border: `1px solid ${selected === v.id ? "hsl(205 70% 38% / 0.35)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {v.voyageNumber}
            </button>
          ))}
        </div>
      </div>

      {voyage && vessel && (
        <div className="space-y-6">
          <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Navigation size={16} style={{ color: ACCENT }} />
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{voyage.voyageNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{
                    background: `${RISK_STYLE[voyage.routeRisk].color}20`,
                    color: RISK_STYLE[voyage.routeRisk].color,
                  }}>
                    {RISK_STYLE[voyage.routeRisk].label} Route Risk
                  </span>
                </div>
                <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {voyage.vesselName} · {voyage.originPort} → {voyage.destinationPort} · {voyage.cargo}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Overall Route Risk</div>
                <RiskGauge level={voyage.routeRisk} />
                <div className="text-sm font-semibold mt-2 capitalize" style={{ color: RISK_STYLE[voyage.routeRisk].color }}>
                  {RISK_STYLE[voyage.routeRisk].label}
                </div>
              </div>
              <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Weather Risk</div>
                <RiskGauge level={voyage.weatherRisk} />
                <div className="text-sm font-semibold mt-2 capitalize" style={{ color: WEATHER_STYLE[voyage.weatherRisk] }}>
                  {voyage.weatherRisk.charAt(0).toUpperCase() + voyage.weatherRisk.slice(1)}
                </div>
              </div>
              <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Port Congestion Risk</div>
                <RiskGauge level={voyage.portCongestionRisk} />
                <div className="text-sm font-semibold mt-2 capitalize" style={{ color: RISK_STYLE[voyage.portCongestionRisk]?.color ?? "rgba(255,255,255,0.5)" }}>
                  {voyage.portCongestionRisk}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Risk Factors</span>
              {voyage.sanctionsExposure && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#c04a2a20", color: "#c04a2a", border: "1px solid #c04a2a30" }}>
                  ⚠ Sanctions Exposure
                </span>
              )}
            </div>
            {voyage.routeRiskFactors.length === 0 ? (
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No specific risk factors identified.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {voyage.routeRiskFactors.map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full" style={{
                    background: "#c08a2c10",
                    color: "#c08a2c",
                    border: "1px solid #c08a2c25",
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>External Context Sources</div>
            <div className="grid grid-cols-3 gap-4">
              {CONTEXT_PANELS.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.id} className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={15} style={{ color: "rgba(255,255,255,0.35)" }} />
                      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{p.label}</span>
                    </div>
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{p.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{p.source}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>
                        <Plug size={10} />
                        Connect to enable
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>Voyage Economics</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Voyage Revenue", value: `$${(voyage.economics.voyageRevenue / 1000).toFixed(0)}K` },
                { label: "Total Costs", value: `$${(voyage.economics.voyageCosts / 1000).toFixed(0)}K` },
                { label: "Bunker Cost", value: `$${(voyage.economics.bunkerCost / 1000).toFixed(0)}K` },
                { label: "Port Disbursements", value: `$${(voyage.economics.portDisbursements / 1000).toFixed(0)}K` },
                { label: "TC Equivalent", value: `$${voyage.economics.tcEquivalent.toLocaleString()}/d` },
                { label: "Profit Margin", value: `${voyage.economics.profitMarginPct.toFixed(1)}%`, color: voyage.economics.profitMarginPct > 20 ? "#40856a" : "#c08a2c" },
              ].map(m => (
                <div key={m.label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
                  <div className="text-sm font-semibold" style={{ color: m.color ?? "rgba(255,255,255,0.8)" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
