import { useState, useMemo } from "react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { AmbientBar, type AmbientSignal } from "@szl-holdings/shared-ui/ambient-intelligence";
import { EnergyPulse, type EnergyMetrics } from "@szl-holdings/shared-ui/energy-heartbeat";
import { CorrelationFeed, type CrossDomainCorrelation } from "@szl-holdings/shared-ui/cross-domain-correlation";

interface VoyageCarbonData {
  id: string;
  vesselName: string;
  voyageId: string;
  origin: string;
  destination: string;
  distanceNm: number;
  fuelConsumedMt: number;
  co2EmissionsMt: number;
  co2PerNm: number;
  fleetAvgCo2PerNm: number;
  efficiencyScore: number;
  weatherAdjustedScore: number;
  portCongestionWasteHours: number;
  carbonCostUsd: number;
  euEtsLiability: number;
  ciiRating: "A" | "B" | "C" | "D" | "E";
  status: "in-progress" | "completed";
}

const DEMO_VOYAGES: VoyageCarbonData[] = [
  {
    id: "v-001", vesselName: "MV Stellar Horizon", voyageId: "SH-2026-042",
    origin: "Rotterdam", destination: "Singapore", distanceNm: 8420,
    fuelConsumedMt: 1240, co2EmissionsMt: 3844, co2PerNm: 0.456, fleetAvgCo2PerNm: 0.512,
    efficiencyScore: 89, weatherAdjustedScore: 92, portCongestionWasteHours: 14,
    carbonCostUsd: 192_200, euEtsLiability: 84_500, ciiRating: "B", status: "in-progress",
  },
  {
    id: "v-002", vesselName: "MV Pacific Titan", voyageId: "PT-2026-018",
    origin: "Shanghai", destination: "Los Angeles", distanceNm: 6380,
    fuelConsumedMt: 980, co2EmissionsMt: 3038, co2PerNm: 0.476, fleetAvgCo2PerNm: 0.512,
    efficiencyScore: 83, weatherAdjustedScore: 78, portCongestionWasteHours: 32,
    carbonCostUsd: 151_900, euEtsLiability: 0, ciiRating: "B", status: "completed",
  },
  {
    id: "v-003", vesselName: "MV Northern Spirit", voyageId: "NS-2026-031",
    origin: "Houston", destination: "Antwerp", distanceNm: 5120,
    fuelConsumedMt: 890, co2EmissionsMt: 2759, co2PerNm: 0.539, fleetAvgCo2PerNm: 0.512,
    efficiencyScore: 71, weatherAdjustedScore: 74, portCongestionWasteHours: 6,
    carbonCostUsd: 137_950, euEtsLiability: 62_100, ciiRating: "C", status: "in-progress",
  },
  {
    id: "v-004", vesselName: "MV Coral Endeavour", voyageId: "CE-2026-055",
    origin: "Jebel Ali", destination: "Mumbai", distanceNm: 1240,
    fuelConsumedMt: 145, co2EmissionsMt: 450, co2PerNm: 0.363, fleetAvgCo2PerNm: 0.512,
    efficiencyScore: 96, weatherAdjustedScore: 95, portCongestionWasteHours: 2,
    carbonCostUsd: 22_500, euEtsLiability: 0, ciiRating: "A", status: "completed",
  },
];

const CII_COLORS: Record<string, string> = { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", E: "#ef4444" };

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

export default function VoyageCarbonPassport() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ambientSignals: AmbientSignal[] = [
    { id: "sig-1", domain: "vessels", title: "Carbon Below Target", summary: "Fleet carbon intensity trending 12% below IMO 2026 target", severity: "info", score: 0.45, timestamp: Date.now() },
  ];
  const energyMetrics: EnergyMetrics = { apiCallsPerMinute: 84, wsMessagesPerMinute: 210, chartRendersPerMinute: 12, dataRefreshesPerMinute: 8, activeSubscriptions: 28, deferredUpdates: 1, totalBudget: 120, usedBudget: 52 };
  const correlations: CrossDomainCorrelation[] = [
    { id: "cor-2", title: "Port Congestion → Material Delays", description: "Port congestion signals predict construction material delivery delays by 48 hours", domains: ["vessels", "terra"], confidence: 0.84, timestamp: Date.now(), signals: [{ domain: "vessels", event: "Shanghai congestion +18%", severity: "medium" }, { domain: "terra", event: "Steel delivery delays", severity: "high" }], impact: "high" },
  ];

  const fleetTotals = useMemo(() => ({
    totalCo2: DEMO_VOYAGES.reduce((s, v) => s + v.co2EmissionsMt, 0),
    totalCarbonCost: DEMO_VOYAGES.reduce((s, v) => s + v.carbonCostUsd, 0),
    avgEfficiency: Math.round(DEMO_VOYAGES.reduce((s, v) => s + v.efficiencyScore, 0) / DEMO_VOYAGES.length),
    totalEuEts: DEMO_VOYAGES.reduce((s, v) => s + v.euEtsLiability, 0),
  }), []);

  const selected = DEMO_VOYAGES.find((v) => v.id === selectedId);

  return (
    <div className="min-h-screen bg-[#060810] text-white p-6 space-y-6">
      <AmbientBar signals={ambientSignals} appDomain="vessels" accentColor="#3b82f6" compact />
      <div>
        <h1 className="text-2xl font-bold text-white/90">Voyage Carbon Passport</h1>
        <p className="text-sm text-white/40 mt-1">Environmental impact per voyage — fuel efficiency, carbon cost, and CII rating alongside P&L</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Fleet CO₂ Emissions", value: `${formatNum(fleetTotals.totalCo2)} MT`, color: "#ef4444" },
          { label: "Total Carbon Cost", value: `$${formatNum(fleetTotals.totalCarbonCost)}`, color: "#f59e0b" },
          { label: "Avg Efficiency Score", value: `${fleetTotals.avgEfficiency}/100`, color: "#10b981" },
          { label: "EU ETS Liability", value: `$${formatNum(fleetTotals.totalEuEts)}`, color: "#8b5cf6" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/30">{kpi.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {DEMO_VOYAGES.map((voyage) => (
          <div
            key={voyage.id}
            className={cn(
              "rounded-xl border p-4 cursor-pointer transition-all",
              selectedId === voyage.id ? "bg-white/[0.06] border-white/15" : "bg-white/[0.02] border-white/5 hover:border-white/10",
            )}
            onClick={() => setSelectedId(selectedId === voyage.id ? null : voyage.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white")}
                  style={{ background: CII_COLORS[voyage.ciiRating] }}>
                  {voyage.ciiRating}
                </div>
                <div>
                  <div className="text-sm font-medium text-white/85">{voyage.vesselName}</div>
                  <div className="text-[11px] text-white/40">{voyage.origin} → {voyage.destination} • {voyage.voyageId}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-white/40">CO₂/nm</div>
                  <div className={cn("text-sm font-mono font-medium", voyage.co2PerNm < voyage.fleetAvgCo2PerNm ? "text-emerald-400" : "text-red-400")}>
                    {voyage.co2PerNm.toFixed(3)} MT
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40">Efficiency</div>
                  <div className="text-sm font-mono font-medium" style={{ color: voyage.efficiencyScore >= 85 ? "#10b981" : voyage.efficiencyScore >= 70 ? "#f59e0b" : "#ef4444" }}>
                    {voyage.efficiencyScore}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/40">Carbon Cost</div>
                  <div className="text-sm font-mono font-medium text-amber-400">${formatNum(voyage.carbonCostUsd)}</div>
                </div>
              </div>
            </div>

            {selectedId === voyage.id && (
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-[10px] text-white/30 uppercase mb-2">Fuel & Emissions</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/50">Fuel Consumed</span><span className="text-white/70 font-mono">{voyage.fuelConsumedMt} MT</span></div>
                    <div className="flex justify-between"><span className="text-white/50">CO₂ Emissions</span><span className="text-white/70 font-mono">{voyage.co2EmissionsMt} MT</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Distance</span><span className="text-white/70 font-mono">{voyage.distanceNm} nm</span></div>
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-[10px] text-white/30 uppercase mb-2">Performance vs Fleet</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/50">Your CO₂/nm</span><span className="font-mono" style={{ color: voyage.co2PerNm < voyage.fleetAvgCo2PerNm ? "#10b981" : "#ef4444" }}>{voyage.co2PerNm.toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Fleet Avg</span><span className="text-white/70 font-mono">{voyage.fleetAvgCo2PerNm.toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Weather-Adj Score</span><span className="text-white/70 font-mono">{voyage.weatherAdjustedScore}%</span></div>
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <div className="text-[10px] text-white/30 uppercase mb-2">Financial Impact</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-white/50">Carbon Cost</span><span className="text-amber-400 font-mono">${formatNum(voyage.carbonCostUsd)}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">EU ETS Liability</span><span className="text-white/70 font-mono">${formatNum(voyage.euEtsLiability)}</span></div>
                    <div className="flex justify-between"><span className="text-white/50">Port Waste</span><span className="text-white/70 font-mono">{voyage.portCongestionWasteHours}h</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div className="md:col-span-2">
          <CorrelationFeed correlations={correlations} currentDomain="vessels" accentColor="#3b82f6" />
        </div>
        <div className="flex items-start justify-center">
          <EnergyPulse metrics={energyMetrics} utilization={energyMetrics.usedBudget / energyMetrics.totalBudget} accentColor="#3b82f6" />
        </div>
      </div>
    </div>
  );
}
