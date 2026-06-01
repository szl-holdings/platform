import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Navigation,
  Waves,
  Wind,
} from 'lucide-react';
import { useState } from 'react';

const WAVE_ANALYSIS = [
  {
    vessel: 'Pacific Navigator',
    route: 'Strait of Hormuz → Cape of Good Hope',
    currentPosition: 'Arabian Sea',
    significantWaveHeight: 3.8,
    peakPeriod: 12.4,
    swellDirection: 'SW',
    windSpeed: 28,
    windDirection: 'WSW',
    parametricRollingRisk: 'medium',
    hullStressIndex: 42,
    recommendedHeading: '210°',
    speedOptimum: 12.8,
    speedActual: 13.4,
    fuelPenalty: 4.2,
    forecastWindow: '72h',
    alerts: [
      {
        type: 'wave',
        msg: 'Swell height increasing to 5.2m in 18h — speed reduction recommended',
        severity: 'warn',
      },
      {
        type: 'parametric',
        msg: 'Parametric rolling risk LOW at current heading',
        severity: 'info',
      },
    ],
  },
  {
    vessel: 'Meridian Bulk',
    route: 'Port Hedland → Yangtze River',
    currentPosition: 'South China Sea',
    significantWaveHeight: 1.9,
    peakPeriod: 8.2,
    swellDirection: 'NE',
    windSpeed: 14,
    windDirection: 'NE',
    parametricRollingRisk: 'low',
    hullStressIndex: 22,
    recommendedHeading: '025°',
    speedOptimum: 14.2,
    speedActual: 14.0,
    fuelPenalty: 0.8,
    forecastWindow: '72h',
    alerts: [
      { type: 'weather', msg: 'Typhoon warning issued — track monitoring', severity: 'info' },
    ],
  },
  {
    vessel: 'Cape Resolute',
    route: 'Suez Canal → Singapore',
    currentPosition: 'Red Sea',
    significantWaveHeight: 2.4,
    peakPeriod: 9.8,
    swellDirection: 'N',
    windSpeed: 22,
    windDirection: 'NNW',
    parametricRollingRisk: 'high',
    hullStressIndex: 68,
    recommendedHeading: 'Heading change +15°',
    speedOptimum: 11.5,
    speedActual: 12.2,
    fuelPenalty: 6.8,
    forecastWindow: '48h',
    alerts: [
      {
        type: 'parametric',
        msg: 'PARAMETRIC ROLLING RISK HIGH — heading adjustment required',
        severity: 'critical',
      },
      {
        type: 'hull',
        msg: 'Hull stress 68% — approaching 70% advisory threshold',
        severity: 'warn',
      },
    ],
  },
];

const WAVE_SPECTRUM_DATA = [
  { freq: 0.05, energy: 0.4 },
  { freq: 0.07, energy: 1.8 },
  { freq: 0.09, energy: 4.2 },
  { freq: 0.11, energy: 7.6 },
  { freq: 0.13, energy: 11.4 },
  { freq: 0.15, energy: 14.2 },
  { freq: 0.17, energy: 12.8 },
  { freq: 0.19, energy: 9.4 },
  { freq: 0.21, energy: 6.2 },
  { freq: 0.23, energy: 3.8 },
  { freq: 0.25, energy: 2.1 },
  { freq: 0.27, energy: 1.2 },
  { freq: 0.29, energy: 0.7 },
  { freq: 0.31, energy: 0.4 },
];

const HEADING_OPTIMIZATION = [
  { heading: '200°', parametricRisk: 0.08, hullStress: 32, fuelBurn: 67.2 },
  { heading: '210°', parametricRisk: 0.04, hullStress: 28, fuelBurn: 68.4 },
  { heading: '220°', parametricRisk: 0.12, hullStress: 38, fuelBurn: 69.8 },
  { heading: '230°', parametricRisk: 0.21, hullStress: 48, fuelBurn: 71.4 },
  { heading: '240°', parametricRisk: 0.34, hullStress: 58, fuelBurn: 70.2 },
];

const riskColor: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const sevColor: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/5 border-red-500/15',
  warn: 'text-amber-400 bg-amber-500/5 border-amber-500/15',
  info: 'text-sky-400/70 bg-sky-500/5 border-sky-500/10',
};

function WaveSpectrum() {
  const max = Math.max(...WAVE_SPECTRUM_DATA.map((d) => d.energy));
  return (
    <div className="flex items-end gap-0.5 h-24">
      {WAVE_SPECTRUM_DATA.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
          <div
            className="w-full rounded-t-sm transition-all duration-700"
            style={{
              height: `${(d.energy / max) * 100}%`,
              background: d.energy > 10 ? 'rgba(56,189,248,0.7)' : 'rgba(56,189,248,0.3)',
            }}
          />
          {i % 3 === 0 && (
            <span className="text-[7px] text-sky-400/30 font-mono">{d.freq.toFixed(2)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function StressGauge({ value }: { value: number }) {
  const color = value >= 70 ? '#f87171' : value >= 50 ? '#fbbf24' : '#34d399';
  return (
    <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-mono font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

export default function WeatherRoutingPage() {
  const [selectedVessel, setSelectedVessel] = useState(WAVE_ANALYSIS[0]);
  const [tab, setTab] = useState<'vessels' | 'spectrum' | 'headings'>('vessels');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Waves className="w-4 h-4 text-sky-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">
              Weather Routing & Wave Spectrum Analysis
            </h1>
            <Badge
              variant="outline"
              className="text-[9px] text-sky-400 border-sky-500/30 bg-sky-500/5"
            >
              NOAA FEED
            </Badge>
          </div>
          <p className="text-xs text-sky-400/40">
            Full wave spectrum modeling, hull stress prediction, parametric rolling risk &
            speed/heading optimization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-red-400">1</p>
            <p className="text-[9px] text-sky-400/40">Critical Risk</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono text-amber-400">1</p>
            <p className="text-[9px] text-sky-400/40">Warn</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {WAVE_ANALYSIS.map((v) => (
          <button
            key={v.vessel}
            onClick={() => setSelectedVessel(v)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs whitespace-nowrap transition-all shrink-0',
              selectedVessel.vessel === v.vessel
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : 'bg-[#0a1628]/60 border-sky-500/10 text-sky-400/50 hover:text-sky-300',
            )}
          >
            <Wind className="w-3 h-3" />
            <div className="text-left">
              <p className="font-medium">{v.vessel}</p>
              <p className="text-[9px] opacity-60">{v.currentPosition}</p>
            </div>
            <Badge
              variant="outline"
              className={cn('text-[8px]', riskColor[v.parametricRollingRisk])}
            >
              {v.parametricRollingRisk}
            </Badge>
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {(['vessels', 'spectrum', 'headings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'text-xs px-4 py-1.5 rounded-lg capitalize transition-colors',
              tab === t
                ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                : 'text-sky-400/50 hover:text-sky-300',
            )}
          >
            {t === 'vessels'
              ? 'Vessel Conditions'
              : t === 'spectrum'
                ? 'Wave Spectrum'
                : 'Heading Optimizer'}
          </button>
        ))}
      </div>

      {tab === 'vessels' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-3">
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-sky-100">{selectedVessel.vessel}</p>
                  <p className="text-[10px] text-sky-400/40">
                    {selectedVessel.route} · {selectedVessel.currentPosition}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('text-[9px]', riskColor[selectedVessel.parametricRollingRisk])}
                >
                  Parametric Roll: {selectedVessel.parametricRollingRisk}
                </Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  {
                    label: 'Wave Height',
                    val: `${selectedVessel.significantWaveHeight}m`,
                    icon: Waves,
                    color: 'sky',
                  },
                  {
                    label: 'Peak Period',
                    val: `${selectedVessel.peakPeriod}s`,
                    icon: Activity,
                    color: 'violet',
                  },
                  {
                    label: 'Wind Speed',
                    val: `${selectedVessel.windSpeed} kts`,
                    icon: Wind,
                    color: 'amber',
                  },
                  {
                    label: 'Optimal Speed',
                    val: `${selectedVessel.speedOptimum} kts`,
                    icon: Navigation,
                    color: 'emerald',
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-sky-500/3 border border-sky-500/8 rounded-lg p-3 text-center"
                  >
                    <m.icon
                      className={cn(
                        'w-3.5 h-3.5 mx-auto mb-1',
                        m.color === 'sky'
                          ? 'text-sky-400'
                          : m.color === 'violet'
                            ? 'text-violet-400'
                            : m.color === 'amber'
                              ? 'text-amber-400'
                              : 'text-emerald-400',
                      )}
                    />
                    <p className="text-sm font-bold font-mono text-sky-200">{m.val}</p>
                    <p className="text-[9px] text-sky-400/40">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-sky-400/50">Hull Stress Index</span>
                  <span className="text-xs font-mono text-sky-300">
                    {selectedVessel.hullStressIndex}%
                  </span>
                </div>
                <StressGauge value={selectedVessel.hullStressIndex} />
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] text-sky-400/50 pt-3 border-t border-sky-500/10">
                <span>
                  Swell: <span className="text-sky-300">{selectedVessel.swellDirection}</span>
                </span>
                <span>
                  Wind:{' '}
                  <span className="text-sky-300">
                    {selectedVessel.windDirection} {selectedVessel.windSpeed}kts
                  </span>
                </span>
                <span>
                  Rec. Heading:{' '}
                  <span className="text-emerald-400">{selectedVessel.recommendedHeading}</span>
                </span>
                <span>
                  Fuel penalty:{' '}
                  <span className="text-amber-400">+{selectedVessel.fuelPenalty}%</span>
                </span>
                <span>
                  Forecast: <span className="text-sky-300">{selectedVessel.forecastWindow}</span>
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {selectedVessel.alerts.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2.5 rounded-lg border text-[11px]',
                    sevColor[a.severity],
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{a.msg}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-200 mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                Fleet Weather Summary
              </p>
              {WAVE_ANALYSIS.map((v) => (
                <div
                  key={v.vessel}
                  className="flex items-center justify-between py-2 border-b border-sky-500/5 last:border-0"
                >
                  <div>
                    <p className="text-[11px] text-sky-200">{v.vessel}</p>
                    <p className="text-[9px] text-sky-400/40">{v.currentPosition}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={cn('text-[9px]', riskColor[v.parametricRollingRisk])}
                    >
                      {v.parametricRollingRisk}
                    </Badge>
                    <p className="text-[9px] font-mono text-sky-400/40 mt-0.5">
                      {v.significantWaveHeight}m Hs
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-200 mb-3">Speed/Heading Optimization</p>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Current speed</span>
                  <span className="font-mono text-sky-300">{selectedVessel.speedActual} kts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Optimal speed</span>
                  <span className="font-mono text-emerald-400">
                    {selectedVessel.speedOptimum} kts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Fuel penalty</span>
                  <span className="font-mono text-amber-400">+{selectedVessel.fuelPenalty}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-400/50">Rec. heading</span>
                  <span className="font-mono text-emerald-400">
                    {selectedVessel.recommendedHeading}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'spectrum' && (
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-sky-200">
                JONSWAP Wave Spectrum — {selectedVessel.vessel}
              </p>
              <p className="text-[10px] text-sky-400/40">
                {selectedVessel.currentPosition} · Hs={selectedVessel.significantWaveHeight}m · Tp=
                {selectedVessel.peakPeriod}s
              </p>
            </div>
            <Badge variant="outline" className="text-[9px] text-sky-400 border-sky-500/20">
              JONSWAP Model
            </Badge>
          </div>
          <WaveSpectrum />
          <div className="flex justify-between mt-2 text-[9px] text-sky-400/30">
            <span>Frequency (Hz)</span>
            <span>Peak: {(1 / selectedVessel.peakPeriod).toFixed(3)} Hz</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-sky-500/10">
            <div>
              <p className="text-[9px] text-sky-400/40">Significant Wave Height</p>
              <p className="text-sm font-bold font-mono text-sky-300">
                {selectedVessel.significantWaveHeight}m
              </p>
            </div>
            <div>
              <p className="text-[9px] text-sky-400/40">Peak Period</p>
              <p className="text-sm font-bold font-mono text-sky-300">
                {selectedVessel.peakPeriod}s
              </p>
            </div>
            <div>
              <p className="text-[9px] text-sky-400/40">Spectral Energy</p>
              <p className="text-sm font-bold font-mono text-violet-400">
                {(selectedVessel.significantWaveHeight ** 2 / 16).toFixed(3)} m²·s
              </p>
            </div>
          </div>
          <div className="mt-4 bg-sky-500/5 border border-sky-500/15 rounded-lg p-3">
            <p className="text-[10px] text-sky-400/50">
              The spectrum shows the distribution of wave energy across frequencies. The peak at{' '}
              {(1 / selectedVessel.peakPeriod).toFixed(3)} Hz indicates dominant swell period of{' '}
              {selectedVessel.peakPeriod}s. Parametric rolling occurs when ship encounter period
              equals natural roll period. Current encounter period:{' '}
              {(selectedVessel.peakPeriod * 0.82).toFixed(1)}s.
            </p>
          </div>
        </div>
      )}

      {tab === 'headings' && (
        <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-sky-500/10">
            <p className="text-xs font-semibold text-sky-200">
              Heading Optimization Matrix — {selectedVessel.vessel}
            </p>
            <p className="text-[10px] text-sky-400/40">
              Parametric rolling risk, hull stress & fuel burn by heading
            </p>
          </div>
          <div className="divide-y divide-sky-500/5">
            <div className="grid grid-cols-4 px-4 py-2 text-[9px] text-sky-400/40 uppercase tracking-wider">
              <span>Heading</span>
              <span>Parametric Risk</span>
              <span>Hull Stress</span>
              <span>Fuel Burn</span>
            </div>
            {HEADING_OPTIMIZATION.map((h, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-4 px-4 py-3 items-center',
                  h.parametricRisk ===
                    Math.min(...HEADING_OPTIMIZATION.map((x) => x.parametricRisk)) &&
                    'bg-emerald-500/5',
                )}
              >
                <span className="text-sm font-mono font-bold text-sky-200 flex items-center gap-1.5">
                  {h.heading}
                  {h.parametricRisk ===
                    Math.min(...HEADING_OPTIMIZATION.map((x) => x.parametricRisk)) && (
                    <Badge
                      variant="outline"
                      className="text-[8px] text-emerald-400 border-emerald-500/20"
                    >
                      OPTIMAL
                    </Badge>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${h.parametricRisk * 100 * 3}%`,
                        background:
                          h.parametricRisk > 0.2
                            ? '#f87171'
                            : h.parametricRisk > 0.1
                              ? '#fbbf24'
                              : '#34d399',
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-mono',
                      h.parametricRisk > 0.2
                        ? 'text-red-400'
                        : h.parametricRisk > 0.1
                          ? 'text-amber-400'
                          : 'text-emerald-400',
                    )}
                  >
                    {(h.parametricRisk * 100).toFixed(0)}%
                  </span>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-mono',
                    h.hullStress >= 55
                      ? 'text-red-400'
                      : h.hullStress >= 40
                        ? 'text-amber-400'
                        : 'text-emerald-400',
                  )}
                >
                  {h.hullStress}%
                </span>
                <span className="text-[10px] font-mono text-sky-300">{h.fuelBurn} t/day</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
