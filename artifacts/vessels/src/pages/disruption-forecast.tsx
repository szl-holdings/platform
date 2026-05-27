import { color as dsColor } from '@szl-holdings/design-system';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Clock,
  Filter,
  Globe,
  Navigation,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocation } from 'wouter';
import { DISRUPTION_ZONES } from '../data/disruption-zones-data';
import { fireBriefSignal } from '../lib/briefSignal';

// Simplified world landmass paths for equirectangular projection
const CONTINENT_PATHS = [
  // North America
  'M 148,48 L 162,44 L 178,42 L 192,44 L 198,52 L 196,62 L 202,68 L 208,78 L 198,90 L 188,98 L 178,104 L 168,112 L 158,118 L 148,126 L 142,118 L 136,110 L 128,102 L 122,92 L 120,82 L 126,72 L 132,62 L 138,54 Z',
  // South America
  'M 178,140 L 188,136 L 196,142 L 200,154 L 202,168 L 198,182 L 192,194 L 182,202 L 172,206 L 162,200 L 158,188 L 160,174 L 162,160 L 168,148 Z',
  // Europe
  'M 290,42 L 304,38 L 318,40 L 326,48 L 320,56 L 310,60 L 300,56 L 292,50 Z',
  // Africa
  'M 296,88 L 312,82 L 326,84 L 334,96 L 336,112 L 332,128 L 324,142 L 312,152 L 298,154 L 286,148 L 280,134 L 280,118 L 284,104 L 290,94 Z',
  // Russia / N Asia
  'M 320,32 L 360,28 L 400,30 L 430,38 L 440,48 L 420,52 L 390,50 L 360,54 L 330,52 L 318,44 Z',
  // Middle East / S Asia
  'M 326,72 L 356,68 L 380,70 L 396,78 L 400,90 L 388,98 L 368,96 L 344,90 L 330,82 Z',
  // East Asia
  'M 400,52 L 430,48 L 458,54 L 468,66 L 460,78 L 442,86 L 420,82 L 404,72 Z',
  // Southeast Asia
  'M 438,96 L 452,90 L 466,94 L 472,106 L 462,114 L 448,110 L 440,104 Z',
  // Australia
  'M 432,144 L 452,138 L 470,142 L 480,154 L 478,168 L 464,176 L 448,174 L 436,164 L 430,152 Z',
  // Greenland
  'M 196,24 L 214,20 L 228,24 L 224,34 L 210,38 L 198,34 Z',
];

function lonToX(lon: number, w: number) {
  return ((lon + 180) / 360) * w;
}
function latToY(lat: number, h: number) {
  return ((90 - lat) / 180) * h;
}

function DisruptionGlobe({
  zones,
  selectedId,
  onSelect,
}: {
  zones: typeof DISRUPTION_ZONES;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const W = 560;
  const H = 280;

  const severityColor: Record<string, string> = {
    Critical: dsColor.accent.red,
    High: dsColor.accent.amber,
    Medium: dsColor.accent.amber,
    Low: dsColor.accent.green,
  };

  return (
    <div
      className="bg-[#060e1a] border border-white/[0.08] rounded-xl overflow-hidden relative"
      style={{ height: 310 }}
    >
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-[#8a8a8a]" />
        <span className="text-[10px] text-[#6a6a6a] uppercase tracking-widest">
          72-Hour Disruption Globe
        </span>
      </div>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {[
          ['Critical', dsColor.accent.red],
          ['High', dsColor.accent.amber],
          ['Medium', dsColor.accent.amber],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1 text-[9px]" style={{ color }}>
            <span className="w-2 h-2 rounded-full" style={{ background: color, opacity: 0.8 }} />{' '}
            {label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: 'block' }}>
        {/* Ocean background */}
        <rect x={0} y={0} width={W} height={H} fill="#060e1a" />

        {/* Grid lines */}
        {[-60, -30, 0, 30, 60].map((lat) => (
          <line
            key={lat}
            x1={0}
            y1={latToY(lat, H)}
            x2={W}
            y2={latToY(lat, H)}
            stroke="#1e3a5f"
            strokeWidth={lat === 0 ? 0.8 : 0.4}
            strokeDasharray={lat === 0 ? 'none' : '4,6'}
          />
        ))}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => (
          <line
            key={lon}
            x1={lonToX(lon, W)}
            y1={0}
            x2={lonToX(lon, W)}
            y2={H}
            stroke="#1e3a5f"
            strokeWidth={0.4}
            strokeDasharray="4,6"
          />
        ))}

        {/* Continents */}
        {CONTINENT_PATHS.map((d, i) => (
          <path key={i} d={d} fill="#0f2844" stroke="#1e3a5f" strokeWidth={0.8} />
        ))}

        {/* Trade route hints */}
        {[
          { x1: lonToX(56, W), y1: latToY(26, H), x2: lonToX(104, W), y2: latToY(3, H) },
          { x1: lonToX(43, W), y1: latToY(12, H), x2: lonToX(29, W), y2: latToY(41, H) },
        ].map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="#38bdf8"
            strokeWidth={0.5}
            strokeOpacity={0.2}
            strokeDasharray="4,4"
          />
        ))}

        {/* Disruption zones */}
        {zones.map((zone) => {
          const cx = lonToX(zone.lon, W);
          const cy = latToY(zone.lat, H);
          const color = severityColor[zone.severity] ?? '#f59e0b';
          const r = 6 + (zone.probability72h / 100) * 8;
          const isSelected = selectedId === zone.id;

          return (
            <g key={zone.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(zone.id)}>
              {/* status ring */}
              <circle
                cx={cx}
                cy={cy}
                r={r + 6}
                fill="none"
                stroke={color}
                strokeWidth={0.8}
                strokeOpacity={0.3}
              >
                <animate
                  attributeName="r"
                  values={`${r + 4};${r + 14};${r + 4}`}
                  dur="2.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-opacity"
                  values="0.4;0;0.4"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Main circle */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth={isSelected ? 2 : 1}
              />
              {/* Center dot */}
              <circle cx={cx} cy={cy} r={3} fill={color} fillOpacity={0.9} />
              {/* Label */}
              <text
                x={cx}
                y={cy - r - 4}
                textAnchor="middle"
                fontSize={7}
                fill={color}
                fillOpacity={0.85}
                fontFamily="monospace"
              >
                {zone.probability72h}%
              </text>
              {isSelected && (
                <text
                  x={cx}
                  y={cy + r + 10}
                  textAnchor="middle"
                  fontSize={7}
                  fill={color}
                  fillOpacity={0.9}
                  fontFamily="sans-serif"
                  fontWeight="bold"
                >
                  {zone.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CountdownTimer({ etaString }: { etaString: string }) {
  const parseHours = (s: string) => {
    const m = s.match(/^(\d+(?:\.\d+)?)\s*h$/i);
    return m ? parseFloat(m[1]) : null;
  };
  const mountedAt = useRef(Date.now());
  const etaMs = (() => {
    const h = parseHours(etaString);
    return h !== null ? h * 3600 * 1000 : null;
  })();
  const calcRemaining = () => {
    if (etaMs === null) return null;
    return Math.max(0, etaMs - (Date.now() - mountedAt.current));
  };
  const [remaining, setRemaining] = useState<number | null>(calcRemaining);
  useEffect(() => {
    if (etaMs === null) return;
    const id = setInterval(() => setRemaining(calcRemaining()), 60_000);
    return () => clearInterval(id);
  }, [etaMs]);
  if (remaining === null) return <span>{etaString}</span>;
  const totalMins = Math.floor(remaining / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return (
    <span>
      {h}h {m.toString().padStart(2, '0')}m
    </span>
  );
}

const CHOKEPOINT_HISTORY = [
  { hour: '-72h', risk: 42 },
  { hour: '-60h', risk: 45 },
  { hour: '-48h', risk: 51 },
  { hour: '-36h', risk: 58 },
  { hour: '-24h', risk: 64 },
  { hour: '-12h', risk: 71 },
  { hour: 'Now', risk: 78 },
  { hour: '+12h', risk: 82 },
  { hour: '+24h', risk: 84 },
  { hour: '+36h', risk: 80 },
  { hour: '+48h', risk: 76 },
  { hour: '+72h', risk: 71 },
];

const RADAR_DATA = [
  { factor: 'Weather', value: 68 },
  { factor: 'Geopolitical', value: 84 },
  { factor: 'Congestion', value: 72 },
  { factor: 'Sanctions', value: 61 },
  { factor: 'Piracy', value: 55 },
  { factor: 'Regulatory', value: 48 },
];

const severityColors: Record<string, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const _typeColors: Record<string, string> = {
  Geopolitical: 'text-red-400',
  Security: 'text-orange-400',
  Congestion: 'text-amber-400',
  Regulatory: 'text-purple-400',
  Weather: 'text-[#c9b787]',
};

function ProbabilityArc({ value }: { value: number }) {
  const color =
    value >= 75 ? '#ef4444' : value >= 50 ? '#f97316' : value >= 30 ? '#f59e0b' : '#22c55e';
  return (
    <div className="relative flex items-center justify-center">
      <svg width="64" height="64" className="rotate-[-90deg]">
        <circle cx="32" cy="32" r="26" fill="none" stroke="#1e3a5f" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${(value / 100) * 163.4} 163.4`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-mono font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function ZoneCard({
  zone,
  expanded,
  onToggle,
}: {
  zone: (typeof DISRUPTION_ZONES)[0];
  expanded: boolean;
  onToggle: () => void;
}) {
  const [, navigate] = useLocation();
  return (
    <div
      className={cn(
        'bg-white/[0.02] border rounded-xl overflow-hidden transition-all cursor-pointer',
        expanded ? 'border-[#c9b787]/24' : 'border-white/[0.06] hover:border-white/[0.08]',
      )}
      onClick={onToggle}
    >
      <div className="px-4 py-4">
        <div className="flex items-start gap-4">
          <ProbabilityArc value={zone.probability72h} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-bold text-[#f5f5f5]">{zone.name}</p>
              <Badge variant="outline" className={cn('text-[9px]', severityColors[zone.severity])}>
                {zone.severity}
              </Badge>
              <Badge variant="outline" className="text-[9px] text-[#8a8a8a] border-white/[0.08]">
                {zone.type}
              </Badge>
            </div>
            <p className="text-[11px] text-[#8a8a8a] mb-2">{zone.region}</p>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1 text-[#9a9a9a]">
                <Clock className="w-3 h-3" /> Peak in <CountdownTimer etaString={zone.eta} />
              </span>
              <span className="flex items-center gap-1 text-[#9a9a9a]">
                <Navigation className="w-3 h-3" /> {zone.affectedVessels} vessels
              </span>
              <span className="flex items-center gap-1 text-[#9a9a9a]">
                <BarChart3 className="w-3 h-3" /> {zone.cargoValue} at risk
              </span>
            </div>
          </div>
          <ChevronRight
            className={cn(
              'w-4 h-4 text-[#5a5a5a] shrink-0 mt-1 transition-transform',
              expanded && 'rotate-90',
            )}
          />
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 py-4 space-y-3 bg-[#c9b787]/14">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a] mb-2">
              Signal Drivers
            </p>
            <ul className="space-y-1">
              {zone.drivers.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#d4c598]/60">
                  <span className="w-1 h-1 rounded-full bg-orange-400/60 mt-1.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#c9b787]/8 border border-white/[0.06] rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a] mb-1">
              Recommended Action
            </p>
            <p className="text-xs text-[#e0e0e0]/80">{zone.recommendation}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fireBriefSignal({
                query: `Generate a maritime intelligence brief for: ${zone.name} — ${zone.type} disruption. Probability: ${zone.probability72h}% in 72h. Affected vessels: ${zone.affectedVessels}. Cargo value at risk: ${zone.cargoValue}. Region: ${zone.region}. Peak ETA: ${zone.eta}. Provide situation summary, affected parties, dollar impact, and 3 numbered recommended actions.`,
                context: `Disruption Forecast Engine signal — ${zone.severity} severity ${zone.type} event`,
                source: `Disruption Forecast Engine — ${zone.probability72h}% probability (${zone.severity})`,
              });
              navigate('/intelligence-briefs');
            }}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-300 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg py-2 transition-colors"
          >
            <Zap className="w-3 h-3" /> Generate Intelligence Brief for this Zone
          </button>
        </div>
      )}
    </div>
  );
}

export default function DisruptionForecast() {
  const [expandedZone, setExpandedZone] = useState<string | null>('DZ-001');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = DISRUPTION_ZONES.filter((z) => {
    if (filterSeverity !== 'all' && z.severity !== filterSeverity) return false;
    if (filterType !== 'all' && z.type !== filterType) return false;
    return true;
  });

  const totalAtRisk = DISRUPTION_ZONES.reduce((s, z) => s + z.affectedVessels, 0);
  const criticalCount = DISRUPTION_ZONES.filter((z) => z.severity === 'Critical').length;
  const highCount = DISRUPTION_ZONES.filter((z) => z.severity === 'High').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-[#c9b787]" />
            <h1 className="text-xl font-bold text-[#f5f5f5] font-display">
              Disruption Forecast Engine
            </h1>
            <Badge
              variant="outline"
              className="text-[9px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
            >
              LIVE · 72H
            </Badge>
          </div>
          <p className="text-xs text-[#8a8a8a]">
            Predictive disruption zones with probability scores and time-to-impact countdowns
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-[#8a8a8a] hover:text-[#d4c598] transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Updated 4m ago
        </button>
      </div>

      {/* Globe Map */}
      <DisruptionGlobe
        zones={DISRUPTION_ZONES}
        selectedId={expandedZone}
        onSelect={(id) => setExpandedZone(expandedZone === id ? null : id)}
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Disruption Zones',
            value: DISRUPTION_ZONES.length,
            sub: 'across 6 regions',
            icon: AlertTriangle,
            color: 'text-orange-400',
          },
          {
            label: 'Vessels at Risk',
            value: totalAtRisk,
            sub: 'in 72h window',
            icon: Navigation,
            color: 'text-[#c9b787]',
          },
          {
            label: 'Critical Zones',
            value: criticalCount,
            sub: 'require immediate action',
            icon: Zap,
            color: 'text-red-400',
          },
          {
            label: 'High-Risk Zones',
            value: highCount,
            sub: 'monitor closely',
            icon: Shield,
            color: 'text-amber-400',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-[#6a6a6a]">{kpi.label}</p>
              <kpi.icon className={cn('w-4 h-4', kpi.color)} />
            </div>
            <p className={cn('text-2xl font-bold font-mono', kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] text-[#6a6a6a] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Risk trend chart */}
        <div className="xl:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-[#e0e0e0]">Aggregate Risk Index — Hormuz</p>
              <p className="text-[10px] text-[#6a6a6a]">Historical + 72h forecast</p>
            </div>
            <Badge variant="outline" className="text-[9px] text-red-400 border-red-500/20">
              ↑ 18% vs 24h ago
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={CHOKEPOINT_HISTORY}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#4a7fa5' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#4a7fa5' }} />
              <Tooltip
                contentStyle={{
                  background: '#0a1628',
                  border: '1px solid #1e3a5f',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{ color: '#94c5e8' }}
                formatter={(v: number) => [`${v}%`, 'Risk Score']}
              />
              <Area
                type="monotone"
                dataKey="risk"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#riskGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[9px] text-[#5a5a5a] font-mono">← HISTORICAL</span>
            <div className="flex-1 h-px border-t border-dashed border-white/[0.08]" />
            <span className="text-[9px] text-[#5a5a5a] font-mono">FORECAST →</span>
          </div>
        </div>

        {/* Radar */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#e0e0e0] mb-1">Risk Factor Breakdown</p>
          <p className="text-[10px] text-[#6a6a6a] mb-3">All zones · composite score</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#1e3a5f" />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 9, fill: '#4a7fa5' }} />
              <Radar
                dataKey="value"
                stroke="#38bdf8"
                fill="#38bdf8"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-[#6a6a6a]" />
        <span className="text-[10px] text-[#6a6a6a] uppercase tracking-wider">
          Filter by severity:
        </span>
        {['all', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterSeverity(s)}
            className={cn(
              'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
              filterSeverity === s
                ? 'bg-[#c9b787]/10 border-[#c9b787]/24 text-[#d4c598]'
                : 'border-white/[0.06] text-[#6a6a6a] hover:text-[#d4c598]',
            )}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
        <span className="text-[10px] text-[#5a5a5a] ml-2 uppercase tracking-wider">Type:</span>
        {['all', 'Geopolitical', 'Security', 'Congestion', 'Weather', 'Regulatory'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              'text-[10px] px-2.5 py-1 rounded-full border transition-colors',
              filterType === t
                ? 'bg-[#c9b787]/10 border-[#c9b787]/24 text-[#d4c598]'
                : 'border-white/[0.06] text-[#6a6a6a] hover:text-[#d4c598]',
            )}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {/* Zone list */}
      <div className="space-y-3">
        {filtered.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            expanded={expandedZone === zone.id}
            onToggle={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#5a5a5a] text-sm">
            No disruption zones match current filters
          </div>
        )}
      </div>
    </div>
  );
}
