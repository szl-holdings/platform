import { cn } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  type AlertTriangle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Filter,
  Flame,
  Radar,
  RefreshCw,
  ShieldAlert,
  Target,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type SignalType =
  | 'utility-disconnect'
  | 'permit-lapse'
  | 'code-violation'
  | 'tax-delinquency'
  | 'ownership-change';

interface DistressSignal {
  type: SignalType;
  source: string;
  detectedAt: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  daysAgo: number;
}

interface RadarProperty {
  id: string;
  address: string;
  neighborhood: string;
  borough: string;
  propertyType: string;
  estimatedValue: number;
  distressScore: number;
  marketAdvantage: number;
  signals: DistressSignal[];
  ownerName: string;
  acquisitionWindow: string;
  lat: number;
  lng: number;
}

const SIGNAL_META: Record<
  SignalType,
  { label: string; icon: typeof AlertTriangle; color: string; bg: string }
> = {
  'utility-disconnect': {
    label: 'Utility Disconnection',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/20',
  },
  'permit-lapse': {
    label: 'Permit Lapse',
    icon: Wrench,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10 border-orange-400/20',
  },
  'code-violation': {
    label: 'Code Violation',
    icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
  },
  'tax-delinquency': {
    label: 'Tax Delinquency',
    icon: DollarSign,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
  },
  'ownership-change': {
    label: 'Ownership Change',
    icon: Users,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10 border-sky-400/20',
  },
};

const RADAR_PROPERTIES: RadarProperty[] = [
  {
    id: 'r-001',
    address: '1847 Myrtle Ave',
    neighborhood: 'Bushwick',
    borough: 'Brooklyn',
    propertyType: 'Multi-Family',
    estimatedValue: 1_850_000,
    distressScore: 94,
    marketAdvantage: 42,
    ownerName: 'Myrtle Holdings LLC',
    acquisitionWindow: '30-45 days',
    lat: 40.6958,
    lng: -73.9226,
    signals: [
      {
        type: 'tax-delinquency',
        source: 'NYC Dept of Finance',
        detectedAt: '2026-03-18',
        severity: 'critical',
        description: '3 consecutive quarters unpaid. Total delinquency: $87,400.',
        daysAgo: 27,
      },
      {
        type: 'utility-disconnect',
        source: 'ConEdison Records',
        detectedAt: '2026-04-01',
        severity: 'high',
        description: 'Electric service disconnected at unit 2B and 3A. Voluntary shutoff unlikely.',
        daysAgo: 13,
      },
      {
        type: 'code-violation',
        source: 'NYC DOB Violations',
        detectedAt: '2026-02-12',
        severity: 'high',
        description: '2 Class C violations: stairway obstruction, HVAC non-compliance.',
        daysAgo: 61,
      },
    ],
  },
  {
    id: 'r-002',
    address: '392 Nostrand Ave',
    neighborhood: 'Crown Heights',
    borough: 'Brooklyn',
    propertyType: 'Mixed-Use',
    estimatedValue: 2_400_000,
    distressScore: 87,
    marketAdvantage: 38,
    ownerName: 'Crown Cap Partners',
    acquisitionWindow: '45-60 days',
    lat: 40.6689,
    lng: -73.9503,
    signals: [
      {
        type: 'ownership-change',
        source: 'NYC ACRIS',
        detectedAt: '2026-03-22',
        severity: 'medium',
        description:
          'LLC dissolution filing detected. 3 manager transfers in 90 days — likely dissolution.',
        daysAgo: 23,
      },
      {
        type: 'permit-lapse',
        source: 'NYC DOB Permits',
        detectedAt: '2026-01-15',
        severity: 'high',
        description:
          'Active construction permit lapsed without final inspection. $240K exposed liability.',
        daysAgo: 89,
      },
      {
        type: 'tax-delinquency',
        source: 'NYC Dept of Finance',
        detectedAt: '2026-03-01',
        severity: 'high',
        description: '2 quarters delinquent. Lien filing imminent per DOF schedule.',
        daysAgo: 44,
      },
    ],
  },
  {
    id: 'r-003',
    address: '5519 Flatlands Ave',
    neighborhood: 'East Flatbush',
    borough: 'Brooklyn',
    propertyType: 'Single-Family',
    estimatedValue: 890_000,
    distressScore: 79,
    marketAdvantage: 29,
    ownerName: 'Eugene Watts',
    acquisitionWindow: '60-90 days',
    lat: 40.6312,
    lng: -73.9278,
    signals: [
      {
        type: 'utility-disconnect',
        source: 'National Grid Records',
        detectedAt: '2026-03-30',
        severity: 'high',
        description: 'Gas service terminated. Owner-occupied — hardship indicator.',
        daysAgo: 15,
      },
      {
        type: 'code-violation',
        source: 'NYC DOB Violations',
        detectedAt: '2026-02-28',
        severity: 'medium',
        description: '1 Class B violation: roof drainage failure, facade deterioration.',
        daysAgo: 45,
      },
    ],
  },
  {
    id: 'r-004',
    address: '211 Liberty Ave',
    neighborhood: 'East New York',
    borough: 'Brooklyn',
    propertyType: 'Multi-Family',
    estimatedValue: 1_100_000,
    distressScore: 91,
    marketAdvantage: 45,
    ownerName: 'Liberty RE Holdings',
    acquisitionWindow: '14-30 days',
    lat: 40.6643,
    lng: -73.8868,
    signals: [
      {
        type: 'tax-delinquency',
        source: 'NYC Dept of Finance',
        detectedAt: '2026-04-02',
        severity: 'critical',
        description: '5 quarters delinquent. In Rem foreclosure warning issued.',
        daysAgo: 12,
      },
      {
        type: 'permit-lapse',
        source: 'NYC DOB Permits',
        detectedAt: '2026-01-08',
        severity: 'medium',
        description: 'Renovation permit lapsed. Began 2024, abandoned mid-project.',
        daysAgo: 96,
      },
      {
        type: 'ownership-change',
        source: 'NYC ACRIS',
        detectedAt: '2026-02-20',
        severity: 'medium',
        description: 'Deed transfer to LLC 9 months ago. Original owner retained debt.',
        daysAgo: 53,
      },
      {
        type: 'code-violation',
        source: 'NYC DOB Violations',
        detectedAt: '2026-03-10',
        severity: 'high',
        description: '3 Class C violations filed. HPD emergency repair order.',
        daysAgo: 35,
      },
    ],
  },
  {
    id: 'r-005',
    address: '78 Covert St',
    neighborhood: 'Ridgewood',
    borough: 'Queens',
    propertyType: 'Multi-Family',
    estimatedValue: 1_620_000,
    distressScore: 73,
    marketAdvantage: 22,
    ownerName: 'Covert Street Partners',
    acquisitionWindow: '60-90 days',
    lat: 40.7003,
    lng: -73.9044,
    signals: [
      {
        type: 'ownership-change',
        source: 'NYC ACRIS',
        detectedAt: '2026-03-15',
        severity: 'medium',
        description: 'Beneficial interest transfer. Institutional lender issued NOD.',
        daysAgo: 30,
      },
      {
        type: 'utility-disconnect',
        source: 'ConEdison Records',
        detectedAt: '2026-04-05',
        severity: 'medium',
        description: 'Partial service interruption unit 1F. Non-payment indicator.',
        daysAgo: 9,
      },
    ],
  },
  {
    id: 'r-006',
    address: '3301 White Plains Rd',
    neighborhood: 'Wakefield',
    borough: 'Bronx',
    propertyType: 'Commercial',
    estimatedValue: 3_200_000,
    distressScore: 82,
    marketAdvantage: 34,
    ownerName: 'White Plains Dev LLC',
    acquisitionWindow: '30-60 days',
    lat: 40.8878,
    lng: -73.8643,
    signals: [
      {
        type: 'tax-delinquency',
        source: 'NYC Dept of Finance',
        detectedAt: '2026-03-05',
        severity: 'high',
        description: 'Tax lien sold to third party. Owner in negotiations, at risk.',
        daysAgo: 40,
      },
      {
        type: 'code-violation',
        source: 'NYC DOB Violations',
        detectedAt: '2026-01-22',
        severity: 'critical',
        description: 'Emergency declaration: structural deficiency notice. Vacate order risk.',
        daysAgo: 82,
      },
      {
        type: 'permit-lapse',
        source: 'NYC DOB Permits',
        detectedAt: '2026-02-14',
        severity: 'medium',
        description: 'Sprinkler retrofit permit expired. $180K insurance exposure.',
        daysAgo: 59,
      },
    ],
  },
];

const SIGNAL_FILTER_OPTIONS: { value: SignalType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Signals' },
  { value: 'tax-delinquency', label: 'Tax Delinquency' },
  { value: 'utility-disconnect', label: 'Utility Disconnect' },
  { value: 'code-violation', label: 'Code Violation' },
  { value: 'permit-lapse', label: 'Permit Lapse' },
  { value: 'ownership-change', label: 'Ownership Change' },
];

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const color =
    score >= 90 ? '#ef4444' : score >= 75 ? '#f97316' : score >= 60 ? '#f59e0b' : '#6b7280';
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={4}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function SignalBadge({ signal, compact }: { signal: DistressSignal; compact?: boolean }) {
  const meta = SIGNAL_META[signal.type];
  const Icon = meta.icon;
  const sev =
    signal.severity === 'critical'
      ? 'text-red-400 bg-red-400/10 border-red-400/20'
      : signal.severity === 'high'
        ? 'text-orange-400 bg-orange-400/10 border-orange-400/20'
        : 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium',
        meta.bg,
        compact ? 'py-0.5' : '',
      )}
    >
      <Icon className={cn('w-3 h-3 flex-shrink-0', meta.color)} />
      <span className={meta.color}>{meta.label}</span>
      {!compact && (
        <span className={cn('ml-1 px-1 py-0 rounded text-[9px] border', sev)}>
          {signal.severity}
        </span>
      )}
    </div>
  );
}

function PropertyCard({
  property,
  selected,
  onClick,
}: {
  property: RadarProperty;
  selected: boolean;
  onClick: () => void;
}) {
  const criticalCount = property.signals.filter((s) => s.severity === 'critical').length;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'p-4 rounded-xl border cursor-pointer transition-all duration-200',
        selected
          ? 'bg-[#40856a]/10 border-[#40856a]/40'
          : 'bg-[#0f1115] border-white/5 hover:border-white/10 hover:bg-white/2',
      )}
    >
      <div className="flex items-start gap-3">
        <ScoreRing score={property.distressScore} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{property.address}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {property.neighborhood} · {property.borough}
              </p>
            </div>
            {criticalCount > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold flex-shrink-0">
                <Flame className="w-2.5 h-2.5" />
                {criticalCount} CRITICAL
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-white/50">{formatCurrency(property.estimatedValue)}</span>
            <span className="text-xs text-[#40856a]">
              +{property.marketAdvantage}% below market
            </span>
            <span className="text-xs text-white/30">{property.signals.length} signals</span>
          </div>
          <div className="flex gap-1.5 flex-wrap mt-2">
            {property.signals.slice(0, 2).map((s) => (
              <SignalBadge key={s.type} signal={s} compact />
            ))}
            {property.signals.length > 2 && (
              <span className="text-[10px] text-white/30 self-center">
                +{property.signals.length - 2} more
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
      </div>
    </motion.div>
  );
}

function SignalTimeline({ signal }: { signal: DistressSignal }) {
  const meta = SIGNAL_META[signal.type];
  const Icon = meta.icon;
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          'w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0',
          meta.bg,
        )}
      >
        <Icon className={cn('w-3.5 h-3.5', meta.color)} />
      </div>
      <div className="flex-1 pb-4 border-b border-white/5 last:border-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-white">{meta.label}</p>
            <p className="text-[11px] text-white/40 mt-0.5">Source: {signal.source}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded border',
                signal.severity === 'critical'
                  ? 'text-red-400 bg-red-400/10 border-red-400/20'
                  : signal.severity === 'high'
                    ? 'text-orange-400 bg-orange-400/10 border-orange-400/20'
                    : 'text-amber-400 bg-amber-400/10 border-amber-400/20',
              )}
            >
              {signal.severity.toUpperCase()}
            </span>
            <span className="text-[10px] text-white/30">{signal.daysAgo}d ago</span>
          </div>
        </div>
        <p className="text-xs text-white/60 mt-1.5 leading-relaxed">{signal.description}</p>
      </div>
    </div>
  );
}

function DetailPanel({ property, onClose }: { property: RadarProperty; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      className="flex flex-col bg-[#0a0c10] border-l border-white/6 overflow-hidden"
      style={{ width: 400, flexShrink: 0 }}
    >
      <div className="p-5 border-b border-white/6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">{property.address}</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {property.neighborhood} · {property.borough}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            {
              label: 'Distress Score',
              value: `${property.distressScore}`,
              color:
                property.distressScore >= 90
                  ? 'text-red-400'
                  : property.distressScore >= 75
                    ? 'text-orange-400'
                    : 'text-amber-400',
            },
            {
              label: 'Below Market',
              value: `+${property.marketAdvantage}%`,
              color: 'text-[#40856a]',
            },
            { label: 'Acq. Window', value: property.acquisitionWindow, color: 'text-sky-400' },
          ].map((m) => (
            <div key={m.label} className="bg-white/3 border border-white/5 rounded-lg p-3">
              <p className="text-[9px] text-white/30 uppercase tracking-wider">{m.label}</p>
              <p className={cn('text-sm font-bold mt-0.5', m.color)}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 border-b border-white/6">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-white/30">Owner</span>
            <p className="text-white/80 font-medium mt-0.5">{property.ownerName}</p>
          </div>
          <div>
            <span className="text-white/30">Est. Value</span>
            <p className="text-white/80 font-medium mt-0.5">
              {formatCurrency(property.estimatedValue)}
            </p>
          </div>
          <div>
            <span className="text-white/30">Property Type</span>
            <p className="text-white/80 font-medium mt-0.5">{property.propertyType}</p>
          </div>
          <div>
            <span className="text-white/30">Active Signals</span>
            <p className="text-white/80 font-medium mt-0.5">{property.signals.length} detected</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-4">
          Signal Source Timeline
        </p>
        <div className="space-y-0">
          {property.signals.map((signal) => (
            <SignalTimeline key={signal.type} signal={signal} />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-white/6">
        <button className="w-full py-2.5 rounded-lg bg-[#40856a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors flex items-center justify-center gap-2">
          <Target className="w-4 h-4" />
          Launch Deal Autopilot
        </button>
      </div>
    </motion.div>
  );
}

function RadarMapView({
  properties,
  selected,
  onSelect,
}: {
  properties: RadarProperty[];
  selected: RadarProperty | null;
  onSelect: (p: RadarProperty) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const minLat = Math.min(...properties.map((p) => p.lat));
  const maxLat = Math.max(...properties.map((p) => p.lat));
  const minLng = Math.min(...properties.map((p) => p.lng));
  const maxLng = Math.max(...properties.map((p) => p.lng));
  const padLat = (maxLat - minLat) * 0.15;
  const padLng = (maxLng - minLng) * 0.15;

  const toXY = (lat: number, lng: number, w: number, h: number) => ({
    x: ((lng - (minLng - padLng)) / (maxLng + padLng - (minLng - padLng))) * w,
    y: (1 - (lat - (minLat - padLat)) / (maxLat + padLat - (minLat - padLat))) * h,
  });

  const pinColor = (score: number) =>
    score >= 90 ? '#ef4444' : score >= 75 ? '#f97316' : '#f59e0b';

  return (
    <div
      className="relative bg-[#0a0f14] rounded-xl border border-white/6 overflow-hidden"
      style={{ height: 340 }}
    >
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(64,133,106,0.3)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#radarGrid)" />
        </svg>
      </div>
      <svg width="100%" height="100%" className="absolute inset-0">
        {properties.map((p) => {
          const { x, y } = toXY(p.lat, p.lng, 600, 340);
          const isSelected = selected?.id === p.id;
          const isHovered = hovered === p.id;
          const color = pinColor(p.distressScore);
          return (
            <g
              key={p.id}
              onClick={() => onSelect(p)}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {(isSelected || isHovered) && (
                <circle cx={x} cy={y} r={24} fill={color} fillOpacity={0.12} />
              )}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 13 : 10}
                fill={color}
                fillOpacity={0.2}
                className="transition-all"
              />
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 7 : 5.5}
                fill={color}
                className="transition-all"
              />
              {(isSelected || isHovered) && (
                <foreignObject x={x + 14} y={y - 20} width={160} height={44}>
                  <div className="bg-[#0a0c10] border border-white/10 rounded-lg px-2 py-1.5 shadow-xl">
                    <p className="text-[10px] font-semibold text-white leading-tight">
                      {p.address}
                    </p>
                    <p className="text-[9px] text-white/40">
                      {p.signals.length} signals · Score {p.distressScore}
                    </p>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-3 flex gap-2">
        {[
          { label: 'Critical ≥90', color: '#ef4444' },
          { label: 'High ≥75', color: '#f97316' },
          { label: 'Moderate', color: '#f59e0b' },
        ].map((l) => (
          <div
            key={l.label}
            className="flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-1 rounded text-[9px] text-white/60"
          >
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-[9px] text-white/40 flex items-center gap-1">
        <Activity className="w-3 h-3" />
        Live Alt-Data Feed
      </div>
    </div>
  );
}

export default function DistressRadar() {
  const [signalFilter, setSignalFilter] = useState<SignalType | 'all'>('all');
  const [selected, setSelected] = useState<RadarProperty | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [minScore, setMinScore] = useState(60);

  const filtered = useMemo(() => {
    return RADAR_PROPERTIES.filter((p) => p.distressScore >= minScore)
      .filter((p) => signalFilter === 'all' || p.signals.some((s) => s.type === signalFilter))
      .sort((a, b) => b.distressScore - a.distressScore);
  }, [signalFilter, minScore]);

  const stats = useMemo(
    () => ({
      critical: RADAR_PROPERTIES.filter((p) => p.distressScore >= 90).length,
      total: RADAR_PROPERTIES.length,
      avgAdvantage: Math.round(
        RADAR_PROPERTIES.reduce((s, p) => s + p.marketAdvantage, 0) / RADAR_PROPERTIES.length,
      ),
      totalValue: RADAR_PROPERTIES.reduce((s, p) => s + p.estimatedValue, 0),
    }),
    [],
  );

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-white/6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Radar className="w-5 h-5 text-[#40856a]" />
                Distress Signal Radar
              </h1>
              <p className="text-xs text-white/40 mt-1">
                Alternative-data distress detection — 30-60 day market advantage on off-market deals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-[#40856a]/10 border border-[#40856a]/20 rounded text-[10px] text-[#40856a]">
                <Activity className="w-3 h-3" />
                Live
              </div>
              <button className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/40 hover:text-white/60 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              {
                label: 'Properties in Radar',
                value: stats.total.toString(),
                sub: 'active signals',
                color: 'text-white',
              },
              {
                label: 'Critical Distress',
                value: stats.critical.toString(),
                sub: 'score ≥ 90',
                color: 'text-red-400',
              },
              {
                label: 'Avg Market Advantage',
                value: `+${stats.avgAdvantage}%`,
                sub: 'below market est.',
                color: 'text-[#40856a]',
              },
              {
                label: 'Total Pipeline Value',
                value: formatCurrency(stats.totalValue),
                sub: 'at distressed values',
                color: 'text-sky-400',
              },
            ].map((m) => (
              <div key={m.label} className="bg-white/2 border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-white/30 uppercase tracking-wider">{m.label}</p>
                <p className={cn('text-xl font-bold mt-1', m.color)}>{m.value}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-b border-white/6 flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white/80 hover:bg-white/5 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              {SIGNAL_FILTER_OPTIONS.find((o) => o.value === signalFilter)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute top-full left-0 mt-1 z-50 bg-[#10141a] border border-white/10 rounded-xl py-1 shadow-2xl min-w-[180px]"
                >
                  {SIGNAL_FILTER_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        setSignalFilter(o.value as SignalType | 'all');
                        setShowFilterMenu(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs transition-colors',
                        signalFilter === o.value
                          ? 'text-[#40856a] bg-[#40856a]/10'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/3',
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span>Min Score:</span>
            {[60, 70, 80, 90].map((v) => (
              <button
                key={v}
                onClick={() => setMinScore(v)}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] border transition-colors',
                  minScore === v
                    ? 'border-[#40856a]/40 text-[#40856a] bg-[#40856a]/10'
                    : 'border-white/10 text-white/30 hover:border-white/20',
                )}
              >
                {v}+
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-white/30">{filtered.length} properties</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <RadarMapView properties={filtered} selected={selected} onSelect={setSelected} />

          <div className="space-y-2 mt-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-3">
              Ranked by Distress Score
            </p>
            {filtered.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                selected={selected?.id === p.id}
                onClick={() => setSelected(p)}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && <DetailPanel property={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
