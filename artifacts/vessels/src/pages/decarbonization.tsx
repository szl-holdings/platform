import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Leaf,
} from 'lucide-react';
import { useState } from 'react';

const CII_DATA = [
  {
    vessel: 'Pacific Navigator',
    cii: 'B',
    score: 8.42,
    limit: 9.1,
    ytdCO2: 12_480,
    target: 13_200,
    trajectory: 'improving',
    ets: { allocation: 4_200, used: 3_840, price: 62.4, exposure: 23_232 },
  },
  {
    vessel: 'Arctic Breeze',
    cii: 'A',
    score: 6.18,
    limit: 7.4,
    ytdCO2: 8_920,
    target: 10_400,
    trajectory: 'stable',
    ets: { allocation: 2_800, used: 2_230, price: 62.4, exposure: 0 },
  },
  {
    vessel: 'Meridian Bulk',
    cii: 'C',
    score: 11.84,
    limit: 10.2,
    ytdCO2: 16_220,
    target: 14_280,
    trajectory: 'worsening',
    ets: { allocation: 5_100, used: 5_890, price: 62.4, exposure: 49_296 },
  },
  {
    vessel: 'Cape Resolute',
    cii: 'B',
    score: 9.01,
    limit: 9.8,
    ytdCO2: 9_640,
    target: 10_600,
    trajectory: 'stable',
    ets: { allocation: 3_300, used: 3_210, price: 62.4, exposure: 0 },
  },
];

const FUEL_PATHWAYS = [
  {
    fuel: 'VLSFO',
    co2Factor: 3.151,
    current: true,
    cost: 620,
    availability: 'global',
    color: 'amber',
    vessels: 4,
  },
  {
    fuel: 'LNG',
    co2Factor: 2.75,
    current: false,
    cost: 480,
    availability: 'major ports',
    color: 'sky',
    vessels: 1,
  },
  {
    fuel: 'Methanol',
    co2Factor: 1.375,
    current: false,
    cost: 890,
    availability: 'limited',
    color: 'violet',
    vessels: 0,
  },
  {
    fuel: 'Ammonia',
    co2Factor: 0.0,
    current: false,
    cost: 1_240,
    availability: 'pilot',
    color: 'emerald',
    vessels: 0,
  },
  {
    fuel: 'B30 Biofuel',
    co2Factor: 2.206,
    current: false,
    cost: 710,
    availability: 'select ports',
    color: 'teal',
    vessels: 0,
  },
];

const CARBON_CREDITS = [
  {
    type: 'EU Allowances (EUA)',
    units: 12_400,
    price: 62.4,
    value: 773_760,
    status: 'held',
    expiry: 'Dec 2026',
  },
  {
    type: 'Voluntary Carbon (VCS)',
    units: 8_200,
    price: 14.2,
    value: 116_440,
    status: 'held',
    expiry: 'None',
  },
  {
    type: 'Gold Standard',
    units: 3_500,
    price: 18.8,
    value: 65_800,
    status: 'held',
    expiry: 'None',
  },
  {
    type: 'IMO DCS Credits',
    units: 2_100,
    price: 22.0,
    value: 46_200,
    status: 'pending',
    expiry: 'Mar 2027',
  },
];

const CII_RATING_COLOR: Record<string, string> = {
  'A+': 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30',
  A: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  B: 'text-[#c9b787] bg-[#c9b787]/10 border-white/[0.08]',
  C: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  D: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  E: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const fuelColor: Record<string, string> = {
  amber: 'text-amber-400',
  sky: 'text-[#c9b787]',
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  teal: 'text-teal-400',
};
const _fuelBg: Record<string, string> = {
  amber: 'bg-amber-500/5 border-amber-500/15',
  sky: 'bg-[#c9b787]/8 border-white/[0.08]',
  violet: 'bg-violet-500/5 border-violet-500/15',
  emerald: 'bg-emerald-500/5 border-emerald-500/15',
  teal: 'bg-teal-500/5 border-teal-500/15',
};

function CIIGauge({ cii, score, limit }: { cii: string; score: number; limit: number }) {
  const pct = Math.min(100, (score / (limit * 1.3)) * 100);
  const color =
    cii === 'A' ? '#34d399' : cii === 'B' ? '#38bdf8' : cii === 'C' ? '#fbbf24' : '#f87171';
  return (
    <div className="relative">
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-1">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color}44)` }}
        />
        <div
          className="absolute top-0 h-full border-r-2 border-dashed border-white/20"
          style={{ left: `${(limit / (limit * 1.3)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[8px]">
        <span className="text-[#5a5a5a]">0</span>
        <span className="text-white/20">Limit: {limit}</span>
        <span style={{ color }} className="font-mono">
          {score.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default function DecarbonizationPage() {
  const [tab, setTab] = useState<'cii' | 'ets' | 'fuels' | 'credits'>('cii');
  const totalEtsExposure = CII_DATA.reduce((a, v) => a + v.ets.exposure, 0);
  const totalCO2 = CII_DATA.reduce((a, v) => a + v.ytdCO2, 0);
  const totalCreditsValue = CARBON_CREDITS.reduce((a, c) => a + c.value, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <h1 className="font-display text-xl font-bold text-[#f5f5f5]">
              Decarbonization Command Center
            </h1>
            <Badge
              variant="outline"
              className="text-[9px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
            >
              IMO 2030 READY
            </Badge>
          </div>
          <p className="text-xs text-[#6a6a6a]">
            CII tracking, EU ETS compliance, fuel pathway analysis & carbon credit portfolio
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-amber-400">
              ${(totalEtsExposure / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-[#6a6a6a]">ETS Exposure</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-emerald-400">
              ${(totalCreditsValue / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-[#6a6a6a]">Credit Portfolio</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-[#c9b787]">
              {(totalCO2 / 1000).toFixed(1)}K t
            </p>
            <p className="text-[9px] text-[#6a6a6a]">YTD CO₂</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        {(['cii', 'ets', 'fuels', 'credits'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'text-xs px-4 py-1.5 rounded-lg capitalize transition-colors',
              tab === t
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'text-[#8a8a8a] hover:text-[#d4c598]',
            )}
          >
            {t === 'cii'
              ? 'CII Ratings'
              : t === 'ets'
                ? 'EU ETS'
                : t === 'fuels'
                  ? 'Fuel Pathways'
                  : 'Carbon Credits'}
          </button>
        ))}
      </div>

      {tab === 'cii' && (
        <div className="space-y-3">
          {CII_DATA.map((v) => (
            <div key={v.vessel} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-start gap-6">
                <div className="shrink-0 text-center">
                  <Badge
                    variant="outline"
                    className={cn('text-2xl font-bold px-4 py-2', CII_RATING_COLOR[v.cii])}
                  >
                    {v.cii}
                  </Badge>
                  <p className="text-[9px] text-[#6a6a6a] mt-1">CII 2026</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#f5f5f5]">{v.vessel}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px]',
                        v.trajectory === 'improving'
                          ? 'text-emerald-400 border-emerald-500/20'
                          : v.trajectory === 'worsening'
                            ? 'text-red-400 border-red-500/20'
                            : 'text-[#6a6a6a] border-white/[0.06]',
                      )}
                    >
                      {v.trajectory}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-[#6a6a6a] mb-3">
                    CII Score: {v.score} g CO₂/DWT·nm · Limit: {v.limit}
                  </p>
                  <CIIGauge cii={v.cii} score={v.score} limit={v.limit} />
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <div>
                    <p className="text-xs font-mono text-[#d4c598]">{v.ytdCO2.toLocaleString()} t</p>
                    <p className="text-[9px] text-[#6a6a6a]">YTD CO₂</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-[#8a8a8a]">
                      {v.target.toLocaleString()} t
                    </p>
                    <p className="text-[9px] text-[#6a6a6a]">Annual target</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-400 mb-2">IMO DCS Reporting</p>
            <div className="flex gap-6 text-[10px]">
              <div>
                <span className="text-[#6a6a6a]">Next submission:</span>{' '}
                <span className="text-[#d4c598]">Jun 30, 2026</span>
              </div>
              <div>
                <span className="text-[#6a6a6a]">Status:</span>{' '}
                <span className="text-emerald-400">On track</span>
              </div>
              <div>
                <span className="text-[#6a6a6a]">Data completeness:</span>{' '}
                <span className="text-[#d4c598]">98.4%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'ets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {CII_DATA.map((v) => (
            <div key={v.vessel} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-sm font-semibold text-[#f5f5f5] mb-3">{v.vessel}</p>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#8a8a8a]">Allocated EUAs</span>
                  <span className="font-mono text-[#d4c598]">
                    {v.ets.allocation.toLocaleString()} t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8a8a]">Used (YTD)</span>
                  <span className="font-mono text-[#d4c598]">{v.ets.used.toLocaleString()} t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8a8a]">Balance</span>
                  <span
                    className={cn(
                      'font-mono',
                      v.ets.allocation >= v.ets.used ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {(v.ets.allocation - v.ets.used).toLocaleString()} t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8a8a]">EUA Price</span>
                  <span className="font-mono text-[#d4c598]">€{v.ets.price}/t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8a8a]">Financial Exposure</span>
                  <span
                    className={cn(
                      'font-mono font-bold',
                      v.ets.exposure > 0 ? 'text-amber-400' : 'text-emerald-400',
                    )}
                  >
                    {v.ets.exposure > 0 ? `€${v.ets.exposure.toLocaleString()}` : 'Surplus'}
                  </span>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (v.ets.used / v.ets.allocation) * 100)}%`,
                    background: v.ets.used > v.ets.allocation ? '#f87171' : '#34d399',
                  }}
                />
              </div>
            </div>
          ))}
          <div className="lg:col-span-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-400 mb-2">Fleet EU ETS Summary</p>
            <div className="flex gap-8 text-[10px]">
              <div>
                <span className="text-[#6a6a6a]">Total EUA Allocated:</span>{' '}
                <span className="text-[#d4c598] font-mono">15,400 t</span>
              </div>
              <div>
                <span className="text-[#6a6a6a]">Total Used:</span>{' '}
                <span className="text-[#d4c598] font-mono">15,170 t</span>
              </div>
              <div>
                <span className="text-[#6a6a6a]">Net Exposure:</span>{' '}
                <span className="text-amber-400 font-mono">€72,528</span>
              </div>
              <div>
                <span className="text-[#6a6a6a]">Hedging Strategy:</span>{' '}
                <span className="text-emerald-400">Forward purchase recommended</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'fuels' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {FUEL_PATHWAYS.map((f) => (
              <div
                key={f.fuel}
                className={cn(
                  'bg-white/[0.02] border rounded-xl p-4',
                  f.current ? 'border-amber-500/30' : 'border-white/[0.06]',
                )}
              >
                {f.current && (
                  <Badge
                    variant="outline"
                    className="text-[8px] text-amber-400 border-amber-500/20 mb-2"
                  >
                    CURRENT FLEET
                  </Badge>
                )}
                <p className={cn('text-sm font-bold mb-1', fuelColor[f.color])}>{f.fuel}</p>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-[#6a6a6a]">CO₂ Factor</span>
                    <span className="font-mono text-[#d4c598]">{f.co2Factor} g/g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a6a]">Price</span>
                    <span className="font-mono text-[#d4c598]">${f.cost}/MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a6a]">Availability</span>
                    <span className={cn(fuelColor[f.color])}>{f.availability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a6a6a]">Fleet vessels</span>
                    <span className="font-mono text-[#d4c598]">{f.vessels}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-[9px] text-[#5a5a5a] mb-1">CO₂ reduction vs VLSFO</div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        f.current ? 'bg-amber-500/40' : 'bg-emerald-500/40',
                      )}
                      style={{ width: f.current ? '100%' : `${(1 - f.co2Factor / 3.151) * 100}%` }}
                    />
                  </div>
                  <div
                    className="text-right text-[8px] mt-0.5"
                    style={{ color: fuelColor[f.color] ? undefined : '#38bdf8' }}
                  >
                    <span className={cn(fuelColor[f.color])}>
                      {f.current ? 'baseline' : `-${((1 - f.co2Factor / 3.151) * 100).toFixed(0)}%`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'credits' && (
        <div className="space-y-3">
          {CARBON_CREDITS.map((c, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#f5f5f5]">{c.type}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[#8a8a8a]">
                    <span>{c.units.toLocaleString()} units</span>
                    <span>·</span>
                    <span>${c.price.toFixed(1)}/unit</span>
                    <span>·</span>
                    <span>Expires: {c.expiry}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold font-mono text-emerald-400">
                    ${c.value.toLocaleString()}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px]',
                      c.status === 'held'
                        ? 'text-emerald-400 border-emerald-500/20'
                        : 'text-amber-400 border-amber-500/20',
                    )}
                  >
                    {c.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-emerald-400 mb-2">Portfolio Summary</p>
            <div className="grid grid-cols-3 gap-4 text-[10px]">
              <div>
                <p className="text-[#6a6a6a]">Total Value</p>
                <p className="text-lg font-bold font-mono text-emerald-400">
                  ${(totalCreditsValue / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-[#6a6a6a]">Total Units</p>
                <p className="text-lg font-bold font-mono text-[#d4c598]">
                  {CARBON_CREDITS.reduce((a, c) => a + c.units, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[#6a6a6a]">Net ETS Coverage</p>
                <p className="text-lg font-bold font-mono text-[#d4c598]">86%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
