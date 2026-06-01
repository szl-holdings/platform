import { TERRA_PROPERTY_RETURNS } from '@szl-holdings/monte-carlo/scenarios';
import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import { Sliders } from 'lucide-react';
import { RiskSimulationPanel } from '@/components/risk-simulation-panel';

const TERRA_ACCENT = LANE_ACCENT_HEX.terra.primary;

export default function RiskSimulationPage() {
  return (
    <div className="min-h-screen px-6 py-8" style={{ background: '#080b0d' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center"
            style={{ background: `${TERRA_ACCENT}15`, border: `1px solid ${TERRA_ACCENT}30` }}
          >
            <Sliders className="w-4 h-4" style={{ color: TERRA_ACCENT }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Risk Simulation</h1>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Monte Carlo modeling of property investment returns under uncertain market, financing
              and operating conditions.
            </p>
          </div>
        </header>

        <RiskSimulationPanel
          scenario={TERRA_PROPERTY_RETURNS}
          accentColor={TERRA_ACCENT}
          subtitle="Models 5-year IRR, equity multiple, exit value and total return for a real estate investment given stochastic cap rates, rent growth, vacancy, financing and exit assumptions."
        />
      </div>
    </div>
  );
}
