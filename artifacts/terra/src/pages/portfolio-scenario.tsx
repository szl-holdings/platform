import { cn } from '@szl-holdings/shared-ui/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Plus,
  Sliders,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface PortfolioAsset {
  id: string;
  address: string;
  neighborhood: string;
  type: string;
  value: number;
  noi: number;
  ltv: number;
  irr: number;
  cashOnCash: number;
  capRate: number;
  climateRisk: 'low' | 'medium' | 'high';
}

interface CandidateProperty {
  id: string;
  address: string;
  neighborhood: string;
  type: string;
  askPrice: number;
  projectedNoi: number;
  arv: number;
  rehabCost: number;
  projectedCapRate: number;
  projectedIrr: number;
  projectedCashOnCash: number;
  ltv: number;
  climateRisk: 'low' | 'medium' | 'high';
}

const PORTFOLIO: PortfolioAsset[] = [
  {
    id: 'p-1',
    address: '84 Grand St',
    neighborhood: 'Williamsburg',
    type: 'Multi-Family',
    value: 3_800_000,
    noi: 228_000,
    ltv: 0.58,
    irr: 14.2,
    cashOnCash: 7.4,
    capRate: 6.0,
    climateRisk: 'low',
  },
  {
    id: 'p-2',
    address: '210 Kent Ave',
    neighborhood: 'Williamsburg',
    type: 'Mixed-Use',
    value: 5_200_000,
    noi: 364_000,
    ltv: 0.62,
    irr: 12.8,
    cashOnCash: 6.2,
    capRate: 7.0,
    climateRisk: 'low',
  },
  {
    id: 'p-3',
    address: '1002 Myrtle Ave',
    neighborhood: 'Bushwick',
    type: 'Multi-Family',
    value: 2_100_000,
    noi: 147_000,
    ltv: 0.71,
    irr: 16.4,
    cashOnCash: 8.8,
    capRate: 7.0,
    climateRisk: 'low',
  },
  {
    id: 'p-4',
    address: '422 Flatbush Ave',
    neighborhood: 'Park Slope',
    type: 'Commercial',
    value: 7_400_000,
    noi: 444_000,
    ltv: 0.54,
    irr: 11.1,
    cashOnCash: 5.4,
    capRate: 6.0,
    climateRisk: 'medium',
  },
  {
    id: 'p-5',
    address: '55 Ocean Ave',
    neighborhood: 'Crown Heights',
    type: 'Multi-Family',
    value: 1_650_000,
    noi: 115_500,
    ltv: 0.68,
    irr: 15.6,
    cashOnCash: 8.1,
    capRate: 7.0,
    climateRisk: 'low',
  },
];

const CANDIDATES: CandidateProperty[] = [
  {
    id: 'c-1',
    address: '211 Liberty Ave',
    neighborhood: 'East New York',
    type: 'Multi-Family',
    askPrice: 790_000,
    projectedNoi: 79_000,
    arv: 1_100_000,
    rehabCost: 140_000,
    projectedCapRate: 10.0,
    projectedIrr: 22.4,
    projectedCashOnCash: 13.2,
    ltv: 0.64,
    climateRisk: 'low',
  },
  {
    id: 'c-2',
    address: '1847 Myrtle Ave',
    neighborhood: 'Bushwick',
    type: 'Multi-Family',
    askPrice: 1_350_000,
    projectedNoi: 108_000,
    arv: 1_850_000,
    rehabCost: 210_000,
    projectedCapRate: 8.0,
    projectedIrr: 18.9,
    projectedCashOnCash: 10.8,
    ltv: 0.72,
    climateRisk: 'low',
  },
  {
    id: 'c-3',
    address: '392 Nostrand Ave',
    neighborhood: 'Crown Heights',
    type: 'Mixed-Use',
    askPrice: 2_100_000,
    projectedNoi: 147_000,
    arv: 2_400_000,
    rehabCost: 85_000,
    projectedCapRate: 7.0,
    projectedIrr: 15.2,
    projectedCashOnCash: 8.6,
    ltv: 0.68,
    climateRisk: 'low',
  },
  {
    id: 'c-4',
    address: '78 Covert St',
    neighborhood: 'Ridgewood',
    type: 'Multi-Family',
    askPrice: 1_540_000,
    projectedNoi: 107_800,
    arv: 1_620_000,
    rehabCost: 45_000,
    projectedCapRate: 7.0,
    projectedIrr: 13.4,
    projectedCashOnCash: 7.2,
    ltv: 0.6,
    climateRisk: 'low',
  },
];

function formatCurrency(n: number, compact = false) {
  if (compact) {
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  }
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function _DeltaBadge({
  base,
  projected,
  format = 'pct',
  higher = 'good',
}: {
  base: number;
  projected: number;
  format?: 'pct' | 'currency';
  higher?: 'good' | 'bad';
}) {
  const delta = projected - base;
  const pct = ((delta / Math.abs(base)) * 100).toFixed(1);
  const positive = higher === 'good' ? delta > 0 : delta < 0;
  const color = delta === 0 ? 'text-white/40' : positive ? 'text-emerald-400' : 'text-red-400';
  const Icon = delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className={cn('flex items-center gap-0.5 text-xs font-bold', color)}>
      {delta !== 0 && <Icon className="w-3 h-3" />}
      {format === 'pct'
        ? `${delta > 0 ? '+' : ''}${pct}%`
        : `${delta > 0 ? '+' : ''}${formatCurrency(Math.abs(delta), true)}`}
    </div>
  );
}

function MetricTile({
  label,
  base,
  projected,
  format = 'pct',
  unit = '',
  higher = 'good',
}: {
  label: string;
  base: number;
  projected: number;
  format?: 'pct' | 'currency' | 'number';
  unit?: string;
  higher?: 'good' | 'bad';
}) {
  const delta = projected - base;
  const positive = higher === 'good' ? delta >= 0 : delta <= 0;
  const noChange = Math.abs(delta) < 0.001;
  return (
    <div className="bg-[#0f1115] border border-white/6 rounded-xl p-4">
      <p className="text-[9px] text-white/30 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-2 mt-1.5">
        <p className="text-xl font-bold text-white">
          {format === 'currency'
            ? formatCurrency(projected, true)
            : format === 'pct'
              ? `${projected.toFixed(1)}%`
              : `${projected.toFixed(1)}${unit}`}
        </p>
        {!noChange && (
          <span
            className={cn(
              'text-xs font-semibold mb-0.5',
              positive ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {delta > 0 ? '+' : ''}
            {format === 'currency'
              ? formatCurrency(Math.abs(delta), true)
              : format === 'pct'
                ? `${delta.toFixed(1)}%`
                : `${delta.toFixed(1)}${unit}`}
          </span>
        )}
      </div>
      <p className="text-[10px] text-white/20 mt-1">
        Base:{' '}
        {format === 'currency'
          ? formatCurrency(base, true)
          : format === 'pct'
            ? `${base.toFixed(1)}%`
            : `${base.toFixed(1)}${unit}`}
      </p>
    </div>
  );
}

function GeographicConcentration({ assets }: { assets: { neighborhood: string }[] }) {
  const counts: Record<string, number> = {};
  assets.forEach((a) => {
    counts[a.neighborhood] = (counts[a.neighborhood] || 0) + 1;
  });
  const total = assets.length;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-2">
      {sorted.map(([hood, count]) => (
        <div key={hood} className="flex items-center gap-2">
          <span className="text-xs text-white/50 w-28 truncate">{hood}</span>
          <div className="flex-1 bg-white/5 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-[#40856a]"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-white/30 w-8 text-right">
            {Math.round((count / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

interface StressScenario {
  id: string;
  name: string;
  description: string;
  capRateShift: number;
  vacancyShift: number;
  rentGrowth: number;
  interestRateShift: number;
  noiImpact: number;
  valuationImpact: number;
  severity: 'mild' | 'moderate' | 'severe';
}

const STRESS_SCENARIOS: StressScenario[] = [
  {
    id: 'base',
    name: 'Base Case',
    description: 'Current market conditions maintained. No significant macro shifts.',
    capRateShift: 0,
    vacancyShift: 0,
    rentGrowth: 2.5,
    interestRateShift: 0,
    noiImpact: 0,
    valuationImpact: 0,
    severity: 'mild',
  },
  {
    id: 'recession',
    name: 'Mild Recession',
    description:
      'GDP contraction 1-2%. Unemployment rises to 5.5%. Credit tightening. Flight to quality.',
    capRateShift: 0.75,
    vacancyShift: 3.0,
    rentGrowth: -0.5,
    interestRateShift: -0.5,
    noiImpact: -8,
    valuationImpact: -12,
    severity: 'moderate',
  },
  {
    id: 'rate-shock',
    name: 'Rate Shock (+200bps)',
    description:
      'Fed raises rates aggressively. Refinancing costs spike. Cap rate expansion across all asset classes.',
    capRateShift: 1.5,
    vacancyShift: 1.0,
    rentGrowth: 1.0,
    interestRateShift: 2.0,
    noiImpact: -3,
    valuationImpact: -18,
    severity: 'severe',
  },
  {
    id: 'stagflation',
    name: 'Stagflation',
    description:
      'High inflation with stagnant growth. Operating costs surge. Tenant credit deterioration.',
    capRateShift: 0.5,
    vacancyShift: 4.0,
    rentGrowth: -1.5,
    interestRateShift: 1.0,
    noiImpact: -15,
    valuationImpact: -22,
    severity: 'severe',
  },
  {
    id: 'tech-bust',
    name: 'Tech Employment Bust',
    description: 'Major tech layoffs. Office/flex space demand collapses. Sublease market floods.',
    capRateShift: 1.0,
    vacancyShift: 6.0,
    rentGrowth: -3.0,
    interestRateShift: -1.0,
    noiImpact: -12,
    valuationImpact: -16,
    severity: 'severe',
  },
  {
    id: 'recovery',
    name: 'Strong Recovery',
    description: 'GDP growth 3%+. Low unemployment. Rent growth accelerates. Capital inflows.',
    capRateShift: -0.5,
    vacancyShift: -2.0,
    rentGrowth: 4.5,
    interestRateShift: 0.25,
    noiImpact: 8,
    valuationImpact: 12,
    severity: 'mild',
  },
];

function StressTestPanel({ portfolio }: { portfolio: typeof PORTFOLIO }) {
  const [activeScenario, setActiveScenario] = useState('base');
  const scenario = STRESS_SCENARIOS.find((s) => s.id === activeScenario)!;
  const totalValue = portfolio.reduce((s, a) => s + a.value, 0);
  const totalNoi = portfolio.reduce((s, a) => s + a.noi, 0);
  const stressedValue = totalValue * (1 + scenario.valuationImpact / 100);
  const stressedNoi = totalNoi * (1 + scenario.noiImpact / 100);
  const portfolioVar95 = totalValue * 0.18;

  return (
    <div>
      <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">
        Economic Stress Testing
      </p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {STRESS_SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveScenario(s.id)}
            className={cn(
              'text-left p-3 rounded-xl border transition-all text-[10px]',
              s.id === activeScenario
                ? 'border-[#40856a]/40 bg-[#40856a]/8'
                : 'border-white/6 bg-white/2 hover:border-white/10',
            )}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-semibold text-white text-xs">{s.name}</span>
              <span
                className={cn(
                  'px-1 py-0.5 rounded text-[8px] font-bold uppercase',
                  s.severity === 'mild'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : s.severity === 'moderate'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-red-500/10 text-red-400',
                )}
              >
                {s.severity}
              </span>
            </div>
            <span className="text-white/30">{s.description.slice(0, 60)}...</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-[#0f1115] border border-white/6 rounded-xl p-3">
          <p className="text-[9px] text-white/30 uppercase">Stressed AUM</p>
          <p className="text-lg font-bold text-white">{formatCurrency(stressedValue, true)}</p>
          <p
            className={cn(
              'text-[10px] font-semibold',
              scenario.valuationImpact >= 0 ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {scenario.valuationImpact >= 0 ? '+' : ''}
            {scenario.valuationImpact}%
          </p>
        </div>
        <div className="bg-[#0f1115] border border-white/6 rounded-xl p-3">
          <p className="text-[9px] text-white/30 uppercase">Stressed NOI</p>
          <p className="text-lg font-bold text-white">{formatCurrency(stressedNoi, true)}</p>
          <p
            className={cn(
              'text-[10px] font-semibold',
              scenario.noiImpact >= 0 ? 'text-emerald-400' : 'text-red-400',
            )}
          >
            {scenario.noiImpact >= 0 ? '+' : ''}
            {scenario.noiImpact}%
          </p>
        </div>
        <div className="bg-[#0f1115] border border-white/6 rounded-xl p-3">
          <p className="text-[9px] text-white/30 uppercase">Cap Rate Shift</p>
          <p className="text-lg font-bold text-white">
            {scenario.capRateShift >= 0 ? '+' : ''}
            {scenario.capRateShift.toFixed(2)}%
          </p>
          <p className="text-[10px] text-white/30">
            Vacancy: {scenario.vacancyShift >= 0 ? '+' : ''}
            {scenario.vacancyShift}%
          </p>
        </div>
        <div className="bg-[#0f1115] border border-white/6 rounded-xl p-3">
          <p className="text-[9px] text-white/30 uppercase">Portfolio VaR (95%)</p>
          <p className="text-lg font-bold text-red-400">
            {formatCurrency(
              portfolioVar95 * (1 + (Math.abs(scenario.valuationImpact) / 100) * 0.5),
              true,
            )}
          </p>
          <p className="text-[10px] text-white/30">Max 12mo loss</p>
        </div>
      </div>

      <div className="bg-white/2 border border-white/6 rounded-xl p-4">
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">
          Asset Vulnerability Ranking
        </p>
        <div className="space-y-1.5">
          {portfolio.map((a) => {
            const assetStressedValue =
              a.value *
              (1 +
                (scenario.valuationImpact / 100) *
                  (a.climateRisk === 'high' ? 1.3 : a.climateRisk === 'medium' ? 1.1 : 1.0));
            const loss = a.value - assetStressedValue;
            const lossPct = (loss / a.value) * 100;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 px-3 py-2 bg-white/2 border border-white/5 rounded-lg"
              >
                <span className="text-xs text-white/60 flex-1">{a.address}</span>
                <span className="text-[10px] text-white/30 w-20 text-right">
                  {formatCurrency(a.value, true)}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold w-20 text-right',
                    lossPct > 0 ? 'text-red-400' : 'text-emerald-400',
                  )}
                >
                  {lossPct > 0 ? '-' : '+'}
                  {Math.abs(lossPct).toFixed(1)}%
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold w-24 text-right',
                    loss > 0 ? 'text-red-400' : 'text-emerald-400',
                  )}
                >
                  {loss > 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(loss), true)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PortfolioScenario() {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [equityContribution, setEquityContribution] = useState(25);
  const [exitYears, setExitYears] = useState(5);
  const [rehabMultiplier, setRehabMultiplier] = useState(1.0);

  const candidate = CANDIDATES.find((c) => c.id === selectedCandidate) ?? null;

  const baseMetrics = useMemo(() => {
    const totalValue = PORTFOLIO.reduce((s, a) => s + a.value, 0);
    const totalNoi = PORTFOLIO.reduce((s, a) => s + a.noi, 0);
    const avgCapRate = PORTFOLIO.reduce((s, a) => s + a.capRate, 0) / PORTFOLIO.length;
    const avgIrr = PORTFOLIO.reduce((s, a) => s + a.irr, 0) / PORTFOLIO.length;
    const avgCoc = PORTFOLIO.reduce((s, a) => s + a.cashOnCash, 0) / PORTFOLIO.length;
    const avgLtv = PORTFOLIO.reduce((s, a) => s + a.ltv, 0) / PORTFOLIO.length;
    const highRisk = PORTFOLIO.filter((a) => a.climateRisk === 'high').length;
    return {
      totalValue,
      totalNoi,
      avgCapRate,
      avgIrr,
      avgCoc,
      avgLtv,
      count: PORTFOLIO.length,
      highRisk,
    };
  }, []);

  const projectedMetrics = useMemo(() => {
    if (!candidate) return baseMetrics;
    const adjustedRehab = candidate.rehabCost * rehabMultiplier;
    const totalCost = candidate.askPrice + adjustedRehab;
    const _equityIn = totalCost * (equityContribution / 100);
    const adjustedIrr =
      candidate.projectedIrr *
      (1 - (rehabMultiplier - 1) * 0.3) *
      (exitYears <= 3 ? 0.9 : exitYears >= 7 ? 1.1 : 1.0);
    const adjustedNoi = candidate.projectedNoi * (rehabMultiplier > 1.2 ? 0.95 : 1.0);
    const allAssets = [
      ...PORTFOLIO,
      {
        value: candidate.arv,
        noi: adjustedNoi,
        capRate: candidate.projectedCapRate,
        irr: adjustedIrr,
        cashOnCash: candidate.projectedCashOnCash * (exitYears <= 3 ? 0.85 : 1.0),
        ltv: candidate.ltv,
        climateRisk: candidate.climateRisk,
      },
    ];
    const totalValue = allAssets.reduce((s, a) => s + a.value, 0);
    const totalNoi = allAssets.reduce((s, a) => s + a.noi, 0);
    const avgCapRate = allAssets.reduce((s, a) => s + a.capRate, 0) / allAssets.length;
    const avgIrr = allAssets.reduce((s, a) => s + a.irr, 0) / allAssets.length;
    const avgCoc = allAssets.reduce((s, a) => s + a.cashOnCash, 0) / allAssets.length;
    const avgLtv = allAssets.reduce((s, a) => s + a.ltv, 0) / allAssets.length;
    const highRisk = allAssets.filter((a) => a.climateRisk === 'high').length;
    return {
      totalValue,
      totalNoi,
      avgCapRate,
      avgIrr,
      avgCoc,
      avgLtv,
      count: allAssets.length,
      highRisk,
    };
  }, [candidate, baseMetrics, equityContribution, exitYears, rehabMultiplier]);

  const allNeighborhoods = candidate
    ? [
        ...PORTFOLIO.map((a) => ({ neighborhood: a.neighborhood })),
        { neighborhood: candidate.neighborhood },
      ]
    : PORTFOLIO.map((a) => ({ neighborhood: a.neighborhood }));

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-white/6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#40856a]" />
            Portfolio Scenario Modeler
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Interactive what-if analysis — see how adding a property changes returns, risk,
            concentration, and cash flow
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">
              Select Candidate Property
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CANDIDATES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCandidate(selectedCandidate === c.id ? null : c.id)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    selectedCandidate === c.id
                      ? 'border-[#40856a]/40 bg-[#40856a]/8'
                      : 'border-white/6 bg-white/2 hover:border-white/10',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{c.address}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        {c.neighborhood} · {c.type}
                      </p>
                    </div>
                    {selectedCandidate === c.id && <CheckIcon />}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] text-white/40">
                      Ask: <span className="text-white/70">{formatCurrency(c.askPrice, true)}</span>
                    </span>
                    <span className="text-[10px] text-[#40856a]">
                      IRR: {c.projectedIrr.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-sky-400">
                      Cap: {c.projectedCapRate.toFixed(1)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {candidate && (
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">
                Scenario Parameters
              </p>
              <div className="grid grid-cols-3 gap-4 bg-white/2 border border-white/6 rounded-xl p-4">
                <div>
                  <label className="text-[10px] text-white/40 block mb-1.5">
                    Equity Contribution:{' '}
                    <span className="text-white/70 font-bold">{equityContribution}%</span>
                  </label>
                  <input
                    type="range"
                    min={15}
                    max={50}
                    value={equityContribution}
                    onChange={(e) => setEquityContribution(+e.target.value)}
                    className="w-full accent-[#40856a]"
                  />
                  <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
                    <span>15%</span>
                    <span>50%</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1.5">
                    Hold Period: <span className="text-white/70 font-bold">{exitYears} yrs</span>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={exitYears}
                    onChange={(e) => setExitYears(+e.target.value)}
                    className="w-full accent-[#40856a]"
                  />
                  <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
                    <span>2 yr</span>
                    <span>10 yr</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 block mb-1.5">
                    Rehab Cost:{' '}
                    <span className="text-white/70 font-bold">
                      {(rehabMultiplier * 100 - 100).toFixed(0)}% adj
                    </span>
                  </label>
                  <input
                    type="range"
                    min={0.7}
                    max={1.5}
                    step={0.05}
                    value={rehabMultiplier}
                    onChange={(e) => setRehabMultiplier(+e.target.value)}
                    className="w-full accent-[#40856a]"
                  />
                  <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
                    <span>-30%</span>
                    <span>+50%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs text-white/30 uppercase tracking-wider font-medium">
                Portfolio Impact
              </p>
              {candidate && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#40856a]/10 border border-[#40856a]/20 text-[#40856a]">
                  +1 property scenario
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricTile
                label="Portfolio AUM"
                base={baseMetrics.totalValue}
                projected={projectedMetrics.totalValue}
                format="currency"
                higher="good"
              />
              <MetricTile
                label="Total NOI"
                base={baseMetrics.totalNoi}
                projected={projectedMetrics.totalNoi}
                format="currency"
                higher="good"
              />
              <MetricTile
                label="Avg Cap Rate"
                base={baseMetrics.avgCapRate}
                projected={projectedMetrics.avgCapRate}
                format="pct"
                higher="good"
              />
              <MetricTile
                label="Blended IRR"
                base={baseMetrics.avgIrr}
                projected={projectedMetrics.avgIrr}
                format="pct"
                higher="good"
              />
              <MetricTile
                label="Avg Cash-on-Cash"
                base={baseMetrics.avgCoc}
                projected={projectedMetrics.avgCoc}
                format="pct"
                higher="good"
              />
              <MetricTile
                label="Avg LTV"
                base={baseMetrics.avgLtv * 100}
                projected={projectedMetrics.avgLtv * 100}
                format="pct"
                higher="bad"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/2 border border-white/6 rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                Geographic Concentration
              </p>
              <GeographicConcentration assets={allNeighborhoods} />
              {candidate && (
                <p className="text-[10px] text-white/30 mt-3">
                  {(() => {
                    const counts: Record<string, number> = {};
                    allNeighborhoods.forEach((a) => {
                      counts[a.neighborhood] = (counts[a.neighborhood] || 0) + 1;
                    });
                    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                    const pct = Math.round((top[1] / allNeighborhoods.length) * 100);
                    return pct > 35
                      ? `⚠ ${top[0]} at ${pct}% — concentration risk`
                      : `Concentration within acceptable limits`;
                  })()}
                </p>
              )}
            </div>

            <div className="bg-white/2 border border-white/6 rounded-xl p-4">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Risk Profile</p>
              <div className="space-y-3">
                {[
                  {
                    label: 'Climate Risk (High)',
                    base: baseMetrics.highRisk,
                    projected: projectedMetrics.highRisk,
                    icon: '🌊',
                    higher: 'bad' as const,
                  },
                  {
                    label: 'Avg LTV',
                    base: +(baseMetrics.avgLtv * 100).toFixed(1),
                    projected: +(projectedMetrics.avgLtv * 100).toFixed(1),
                    icon: '🏦',
                    higher: 'bad' as const,
                  },
                  {
                    label: 'Properties',
                    base: baseMetrics.count,
                    projected: projectedMetrics.count,
                    icon: '🏢',
                    higher: 'good' as const,
                  },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{r.icon}</span>
                      <span className="text-xs text-white/50">{r.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/30">{r.base}</span>
                      <ChevronRight className="w-3 h-3 text-white/20" />
                      <span className="text-xs text-white font-bold">{r.projected}</span>
                      {candidate && r.base !== r.projected && (
                        <span
                          className={cn(
                            'text-[10px] font-bold',
                            r.projected > r.base === (r.higher === 'good')
                              ? 'text-emerald-400'
                              : 'text-red-400',
                          )}
                        >
                          {r.projected > r.base ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <StressTestPanel
            portfolio={
              candidate
                ? [
                    ...PORTFOLIO,
                    {
                      id: candidate.id,
                      address: candidate.address,
                      neighborhood: candidate.neighborhood,
                      type: candidate.type,
                      value: candidate.arv,
                      noi: candidate.projectedNoi * (rehabMultiplier > 1.2 ? 0.95 : 1.0),
                      ltv: candidate.ltv,
                      irr: candidate.projectedIrr,
                      cashOnCash: candidate.projectedCashOnCash,
                      capRate: candidate.projectedCapRate,
                      climateRisk: candidate.climateRisk,
                    },
                  ]
                : PORTFOLIO
            }
          />

          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">
              Current Portfolio
            </p>
            <div className="space-y-1.5">
              {PORTFOLIO.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 px-4 py-2.5 bg-white/2 border border-white/5 rounded-lg"
                >
                  <Building2 className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <span className="text-xs text-white/60 flex-1">{a.address}</span>
                  <span className="text-[10px] text-white/30 w-20 text-right">
                    {formatCurrency(a.value, true)}
                  </span>
                  <span className="text-[10px] text-[#40856a] w-16 text-right">IRR {a.irr}%</span>
                  <span className="text-[10px] text-sky-400 w-12 text-right">Cap {a.capRate}%</span>
                </div>
              ))}
              {candidate && (
                <div className="flex items-center gap-4 px-4 py-2.5 bg-[#40856a]/8 border border-[#40856a]/20 rounded-lg">
                  <Plus className="w-3.5 h-3.5 text-[#40856a] flex-shrink-0" />
                  <span className="text-xs text-[#40856a] flex-1">
                    {candidate.address} <span className="text-[#40856a]/60">(scenario)</span>
                  </span>
                  <span className="text-[10px] text-[#40856a]/70 w-20 text-right">
                    {formatCurrency(candidate.arv, true)}
                  </span>
                  <span className="text-[10px] text-[#40856a] w-16 text-right">
                    IRR {candidate.projectedIrr}%
                  </span>
                  <span className="text-[10px] text-sky-400 w-12 text-right">
                    Cap {candidate.projectedCapRate}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <div className="w-4 h-4 rounded-full bg-[#40856a] flex items-center justify-center flex-shrink-0">
      <svg width="8" height="8" viewBox="0 0 8 8">
        <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
