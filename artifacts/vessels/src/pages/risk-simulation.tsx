import { VESSELS_VOYAGE_COST } from "@szl-holdings/monte-carlo/scenarios";
import { RiskSimulationPanel } from "@/components/risk-simulation-panel";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { Sliders } from "lucide-react";

const VESSELS_ACCENT = LANE_ACCENT_HEX.vessels.primaryLight;

export default function RiskSimulationPage() {
  return (
    <div className="min-h-screen px-6 py-8" style={{ background: "#040a14" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: `${VESSELS_ACCENT}15`, border: `1px solid ${VESSELS_ACCENT}30` }}>
            <Sliders className="w-4 h-4" style={{ color: VESSELS_ACCENT }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Risk Simulation</h1>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              Monte Carlo modeling of total voyage cost under uncertain fuel, weather, port, and risk premium conditions.
            </p>
          </div>
        </header>

        <RiskSimulationPanel
          scenario={VESSELS_VOYAGE_COST}
          accentColor={VESSELS_ACCENT}
          subtitle="Simulates total voyage cost — fuel burn, weather delays, port fees and piracy risk premium — across thousands of voyage outcomes to surface percentile bands and the inputs driving variance."
        />
      </div>
    </div>
  );
}
