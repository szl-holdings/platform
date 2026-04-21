import { useStandardQuery } from '@szl-holdings/api-client-react';
import { color } from '@szl-holdings/design-system';

import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowRight,
  BarChart3,
  Box,
  ChevronDown,
  Clock,
  DollarSign,
  Download,
  Droplets,
  Filter,
  Fuel,
  Globe,
  Layers,
  MapPin,
  Navigation,
  Package,
  Ship,
  TrendingDown,
  TrendingUp,
  Wheat,
  Wifi,
  WifiOff,
  Wind,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COMMODITIES = [
  {
    id: 'crude',
    name: 'Crude Oil',
    icon: Droplets,
    color: '#f97316',
    unit: 'MB/day',
    volume: 82.4,
    change: +2.1,
    vessels: 142,
    avg_days: 21,
  },
  {
    id: 'lng',
    name: 'LNG',
    icon: Fuel,
    color: '#38bdf8',
    unit: 'MT/month',
    volume: 34.1,
    change: -1.4,
    vessels: 67,
    avg_days: 18,
  },
  {
    id: 'bulk',
    name: 'Dry Bulk',
    icon: Wheat,
    color: '#f59e0b',
    unit: 'MT/week',
    volume: 128.7,
    change: +5.3,
    vessels: 234,
    avg_days: 14,
  },
  {
    id: 'container',
    name: 'Containers',
    icon: Box,
    color: '#a855f7',
    unit: 'TEU/week',
    volume: 2840,
    change: +1.7,
    vessels: 89,
    avg_days: 25,
  },
];

const PORT_CONGESTION = [
  {
    port: 'Singapore',
    country: 'SGP',
    lat: 1.3,
    lon: 103.8,
    vessels_waiting: 47,
    avg_wait_hrs: 31,
    capacity_pct: 94,
    risk: 'high',
    commodity: 'Crude + Container',
  },
  {
    port: 'Rotterdam',
    country: 'NLD',
    lat: 51.9,
    lon: 4.5,
    vessels_waiting: 23,
    avg_wait_hrs: 14,
    capacity_pct: 78,
    risk: 'medium',
    commodity: 'Container + Bulk',
  },
  {
    port: 'Fujairah',
    country: 'UAE',
    lat: 25.1,
    lon: 56.3,
    vessels_waiting: 38,
    avg_wait_hrs: 22,
    capacity_pct: 89,
    risk: 'high',
    commodity: 'Crude + Bunker',
  },
  {
    port: 'Houston',
    country: 'USA',
    lat: 29.7,
    lon: -95.0,
    vessels_waiting: 15,
    avg_wait_hrs: 9,
    capacity_pct: 62,
    risk: 'low',
    commodity: 'LNG + Crude',
  },
  {
    port: 'Qingdao',
    country: 'CHN',
    lat: 36.1,
    lon: 120.4,
    vessels_waiting: 31,
    avg_wait_hrs: 18,
    capacity_pct: 83,
    risk: 'medium',
    commodity: 'Iron Ore + Coal',
  },
  {
    port: 'Algeciras',
    country: 'ESP',
    lat: 36.1,
    lon: -5.4,
    vessels_waiting: 12,
    avg_wait_hrs: 6,
    capacity_pct: 55,
    risk: 'low',
    commodity: 'Container Transit',
  },
  {
    port: 'Corpus Christi',
    country: 'USA',
    lat: 27.8,
    lon: -97.4,
    vessels_waiting: 8,
    avg_wait_hrs: 4,
    capacity_pct: 48,
    risk: 'low',
    commodity: 'LNG Export',
  },
];

const FLOW_ROUTES = [
  {
    id: 'persian-asia',
    name: 'Persian Gulf → Asia',
    from: 'Fujairah / Kharg',
    to: 'Singapore / Qingdao',
    commodity: 'Crude Oil',
    volume: '18.4 MB/day',
    vessels_active: 89,
    risk: 'medium',
    canal: 'Strait of Hormuz',
    choke_risk: true,
  },
  {
    id: 'us-europe',
    name: 'US Gulf → NW Europe',
    from: 'Houston / Corpus Christi',
    to: 'Rotterdam / Wilhelmshaven',
    commodity: 'LNG + Crude',
    volume: '4.2 MT/month',
    vessels_active: 34,
    risk: 'low',
    canal: 'Direct Atlantic',
    choke_risk: false,
  },
  {
    id: 'australia-china',
    name: 'Australia → China',
    from: 'Port Hedland / Newcastle',
    to: 'Qingdao / Tianjin',
    commodity: 'Iron Ore + Coal',
    volume: '64.2 MT/month',
    vessels_active: 67,
    risk: 'low',
    canal: 'South China Sea',
    choke_risk: false,
  },
  {
    id: 'red-sea',
    name: 'Red Sea Transit',
    from: 'Suez Canal',
    to: 'All Directions',
    commodity: 'Mixed',
    volume: '12% of global trade',
    vessels_active: 41,
    risk: 'critical',
    canal: 'Bab el-Mandeb / Suez',
    choke_risk: true,
  },
  {
    id: 'russia-asia',
    name: 'Russia → Asia (Northern Route)',
    from: 'Novorossiysk / Primorsk',
    to: 'India / China',
    commodity: 'Sanctioned Crude',
    volume: 'Est. 2.1 MB/day',
    vessels_active: 28,
    risk: 'critical',
    canal: 'Around Cape',
    choke_risk: false,
  },
];

const VOYAGE_COST = [
  { month: 'Sep', voyage_cost: 42, bunker: 28, port: 8, canal: 6 },
  { month: 'Oct', voyage_cost: 45, bunker: 30, port: 9, canal: 6 },
  { month: 'Nov', voyage_cost: 48, bunker: 32, port: 10, canal: 6 },
  { month: 'Dec', voyage_cost: 52, bunker: 35, port: 10, canal: 7 },
  { month: 'Jan', voyage_cost: 51, bunker: 34, port: 10, canal: 7 },
  { month: 'Feb', voyage_cost: 54, bunker: 36, port: 11, canal: 7 },
  { month: 'Mar', voyage_cost: 57, bunker: 38, port: 12, canal: 7 },
];

const RATE_DATA = [
  { route: 'VLCC AG/China (TD3C)', current: 42.8, prev: 38.1, unit: 'WS', trend: 'up' },
  { route: 'Suezmax W.Africa/UKC (TD20)', current: 87.2, prev: 92.4, unit: 'WS', trend: 'down' },
  { route: 'Aframax NS/UKC (TD7)', current: 118.5, prev: 108.0, unit: 'WS', trend: 'up' },
  { route: 'LNG Pacific (BLNG3G)', current: 62400, prev: 68200, unit: '$/day', trend: 'down' },
  { route: 'Capesize C5 (FE/China)', current: 14.2, prev: 12.8, unit: '$/MT', trend: 'up' },
];

const VESSEL_QUEUE = [
  {
    vessel: 'NORDIC CROWN',
    imo: '9847234',
    type: 'VLCC',
    port: 'Fujairah',
    wait_hrs: 42,
    cargo: '1.95 MB Crude',
    eta_berth: '2026-04-03',
  },
  {
    vessel: 'PACIFIC EMPRESS',
    imo: '9521087',
    type: 'VLCC',
    port: 'Singapore',
    wait_hrs: 28,
    cargo: '2.0 MB Crude',
    eta_berth: '2026-04-02',
  },
  {
    vessel: 'MSC AMSTERDAM',
    imo: '9768341',
    type: 'ULCS',
    port: 'Singapore',
    wait_hrs: 19,
    cargo: '18,420 TEU',
    eta_berth: '2026-04-02',
  },
  {
    vessel: 'EXCEL GALAXY',
    imo: '9412567',
    type: 'Capesize',
    port: 'Qingdao',
    wait_hrs: 22,
    cargo: '160k MT Iron Ore',
    eta_berth: '2026-04-02',
  },
  {
    vessel: 'ATLANTIC GAS',
    imo: '9634112',
    type: 'LNG Carrier',
    port: 'Rotterdam',
    wait_hrs: 11,
    cargo: '138k CBM LNG',
    eta_berth: '2026-04-01',
  },
];

const riskColors: Record<string, string> = {
  critical: color.accent.red,
  high: color.accent.amber,
  medium: color.accent.amber,
  low: color.accent.green,
};

interface ChokepointAlert {
  id: string;
  name: string;
  status: string;
  risk: string;
  affectedVessels?: number;
  region?: string;
}
interface ChokepointsResponse {
  data: { chokepoints?: ChokepointAlert[]; fetchedAt?: string };
}
interface FleetSummaryResponse {
  data: {
    totalVessels?: number;
    activeVessels?: number;
    inPort?: number;
    atAnchor?: number;
    criticalAlerts?: number;
    fetchedAt?: string;
  };
}

export default function CommodityFlowIntelligence() {
  const [selectedCommodity, setSelectedCommodity] = useState('crude');
  const [activeRoute, setActiveRoute] = useState<string | null>('red-sea');

  const BG = '#060e1a';
  const SURFACE = '#081018';
  const BORDER = 'rgba(14,165,233,0.1)';
  const SKY = '#0ea5e9';

  const { data: chokepointsData, isError: isChokepointsError } =
    useStandardQuery<ChokepointsResponse>({
      queryKey: ['commodity-flow-chokepoints'],
      queryFn: () => apiFetch<ChokepointsResponse>('/vessels/live/chokepoints'),
      refetchInterval: 30000,
      retry: 1,
    });

  const { data: fleetSummaryData } = useStandardQuery<FleetSummaryResponse>({
    queryKey: ['commodity-flow-fleet-summary'],
    queryFn: () => apiFetch<FleetSummaryResponse>('/vessels/live/fleet-summary'),
    refetchInterval: 30000,
    retry: 1,
  });

  const liveChokepoints = chokepointsData?.data?.chokepoints ?? [];
  const liveFleet = fleetSummaryData?.data;
  const isLive = !isChokepointsError && liveChokepoints.length > 0;

  return (
    <div className="min-h-screen" style={{ background: BG, color: 'rgba(255,255,255,0.85)' }}>
      {/* Header */}
      <div
        className="px-6 py-3.5 border-b flex items-center justify-between"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: 'rgba(14,165,233,0.12)', border: `1px solid ${BORDER}` }}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Commodity Flow Intelligence</h1>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Global cargo flows · Port analytics · Rate intelligence
              </p>
            </div>
          </div>
          <div className="h-3 w-px" style={{ background: BORDER }} />
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <Wifi className="w-3 h-3 text-sky-400" />
            ) : (
              <WifiOff className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[10px] font-mono text-sky-400">
              {isLive
                ? `LIVE · ${liveChokepoints.length} chokepoints monitored`
                : 'LIVE · AIS + Port Data'}
            </span>
          </div>
          {liveFleet && (
            <>
              <div className="h-3 w-px" style={{ background: BORDER }} />
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {liveFleet.totalVessels ?? '—'} vessels tracked
                </span>
                {(liveFleet.criticalAlerts ?? 0) > 0 && (
                  <span style={{ color: '#ef4444' }}>
                    {liveFleet.criticalAlerts} critical alerts
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${BORDER}`,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <Filter className="w-3 h-3" />
            Filter
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${BORDER}`,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Commodity selector KPIs */}
        <div className="grid grid-cols-4 gap-3">
          {COMMODITIES.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCommodity === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCommodity(c.id)}
                className="text-left p-3.5 rounded-lg transition-all"
                style={{
                  background: isSelected ? `${c.color}10` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? `${c.color}35` : BORDER}`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {c.name}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-0.5 text-[9px] font-mono',
                      c.change >= 0 ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {c.change >= 0 ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {c.change >= 0 ? '+' : ''}
                    {c.change}%
                  </div>
                </div>
                <p
                  className="text-xl font-bold font-mono mb-0.5"
                  style={{ color: isSelected ? c.color : 'rgba(255,255,255,0.8)' }}
                >
                  {typeof c.volume === 'number' && c.volume > 999
                    ? c.volume.toLocaleString()
                    : c.volume}
                </p>
                <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {c.unit}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Ship className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {c.vessels} vessels · avg {c.avg_days}d voyage
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main 3-column grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Port congestion */}
          <div
            className="col-span-5 rounded-lg overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-2">
                <Anchor className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-semibold text-white">Port Congestion Index</span>
              </div>
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Live · 7 major ports
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {[...PORT_CONGESTION]
                .sort((a, b) => b.vessels_waiting - a.vessels_waiting)
                .map((port) => (
                  <div key={port.port} className="px-4 py-3 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                      style={{
                        background: `${riskColors[port.risk]}10`,
                        border: `1px solid ${riskColors[port.risk]}25`,
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" style={{ color: riskColors[port.risk] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-white">{port.port}</span>
                          <span
                            className="text-[9px] font-mono px-1 py-0.5 rounded"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.35)',
                            }}
                          >
                            {port.country}
                          </span>
                        </div>
                        <span
                          className="text-xs font-bold font-mono"
                          style={{ color: riskColors[port.risk] }}
                        >
                          {port.vessels_waiting} vessels
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-3 text-[9px]"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        <span>
                          Avg wait:{' '}
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {port.avg_wait_hrs}h
                          </span>
                        </span>
                        <span>{port.commodity}</span>
                      </div>
                      <div
                        className="mt-1.5 h-1 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${port.capacity_pct}%`,
                            background: riskColors[port.risk],
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className="text-[10px] font-mono font-bold shrink-0"
                      style={{ color: riskColors[port.risk] }}
                    >
                      {port.capacity_pct}%
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Trade routes */}
          <div className="col-span-7 space-y-3">
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div
                className="px-4 py-2.5 border-b flex items-center gap-2"
                style={{ borderColor: BORDER }}
              >
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-semibold text-white">
                  Major Trade Corridors · Risk Assessment
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: BORDER }}>
                {FLOW_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => setActiveRoute(activeRoute === route.id ? null : route.id)}
                    className="w-full text-left px-4 py-3 transition-colors hover:bg-sky-500/3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: riskColors[route.risk] }}
                        />
                        <span
                          className="text-[9px] font-medium uppercase"
                          style={{ color: riskColors[route.risk] }}
                        >
                          {route.risk}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-white">{route.name}</span>
                          <div className="flex items-center gap-2">
                            {route.choke_risk && (
                              <span
                                className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                                style={{
                                  color: '#f97316',
                                  background: 'rgba(249,115,22,0.1)',
                                  border: '1px solid rgba(249,115,22,0.2)',
                                }}
                              >
                                CHOKE POINT
                              </span>
                            )}
                            <Ship className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
                            <span
                              className="text-[10px] font-mono font-bold"
                              style={{ color: 'rgba(255,255,255,0.6)' }}
                            >
                              {route.vessels_active}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-1 text-[9px] mb-1"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
                        >
                          <span>{route.from}</span>
                          <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                          <span>{route.to}</span>
                        </div>
                        <div
                          className="flex items-center gap-3 text-[9px]"
                          style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{route.commodity}</span>
                          <span>·</span>
                          <span>{route.volume}</span>
                          <span>·</span>
                          <span>via {route.canal}</span>
                        </div>
                        {activeRoute === route.id && route.risk === 'critical' && (
                          <div
                            className="mt-2 p-2 rounded text-[9px] leading-relaxed"
                            style={{
                              background: 'rgba(239,68,68,0.07)',
                              border: '1px solid rgba(239,68,68,0.15)',
                              color: '#ef4444',
                            }}
                          >
                            {route.id === 'red-sea'
                              ? '⚠ Houthi attacks have reduced traffic by 67%. Suezmax and VLCC owners diverting via Cape of Good Hope (+14 days). Insurance premiums +380% vs pre-crisis. Monitor ICS / MSCHOA advisories.'
                              : '⚠ Sanctioned fleet operating without standard insurance. AIS blackouts observed. Do not engage without OFAC/HM Treasury screening.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Freight rate table */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <div
                className="px-4 py-2.5 border-b flex items-center gap-2"
                style={{ borderColor: BORDER }}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold text-white">
                  Spot Freight Rates · Baltic Exchange
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: BORDER }}>
                {RATE_DATA.map((r) => (
                  <div key={r.route} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {r.route}
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        {r.prev} {r.unit}
                      </span>
                      <ArrowRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                      <div className="flex items-center gap-1">
                        <span
                          className="text-[11px] font-bold font-mono"
                          style={{ color: r.trend === 'up' ? '#22c55e' : '#ef4444' }}
                        >
                          {typeof r.current === 'number' && r.current > 999
                            ? r.current.toLocaleString()
                            : r.current}{' '}
                          {r.unit}
                        </span>
                        {r.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Voyage cost chart + vessel queue */}
        <div className="grid grid-cols-12 gap-4">
          <div
            className="col-span-5 rounded-lg overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-4 py-2.5 border-b flex items-center gap-2"
              style={{ borderColor: BORDER }}
            >
              <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-semibold text-white">
                Average Voyage Cost Breakdown (USD/MT)
              </span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={VOYAGE_COST} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#081018',
                      border: '1px solid rgba(14,165,233,0.2)',
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                  <Bar
                    dataKey="bunker"
                    name="Bunker"
                    stackId="a"
                    fill="#f97316"
                    fillOpacity={0.8}
                  />
                  <Bar dataKey="port" name="Port" stackId="a" fill="#0ea5e9" fillOpacity={0.8} />
                  <Bar
                    dataKey="canal"
                    name="Canal"
                    stackId="a"
                    fill="#a855f7"
                    fillOpacity={0.8}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 justify-center">
                {[
                  ['Bunker', '#f97316'],
                  ['Port', '#0ea5e9'],
                  ['Canal', '#a855f7'],
                ].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ background: color as string }} />
                    <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="col-span-7 rounded-lg overflow-hidden"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-semibold text-white">
                  Anchorage Queue — Waiting Vessels
                </span>
              </div>
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {VESSEL_QUEUE.length} vessels monitoring
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {VESSEL_QUEUE.map((v) => (
                <div key={v.imo} className="px-4 py-2.5 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(14,165,233,0.08)',
                      border: '1px solid rgba(14,165,233,0.12)',
                    }}
                  >
                    <Ship className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-white">{v.vessel}</span>
                      <span
                        className="text-[10px] font-mono font-bold"
                        style={{
                          color:
                            v.wait_hrs >= 30 ? '#f97316' : v.wait_hrs >= 20 ? '#f59e0b' : '#22c55e',
                        }}
                      >
                        {v.wait_hrs}h wait
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 text-[9px] mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      <span className="font-mono">IMO {v.imo}</span>
                      <span>·</span>
                      <span>{v.type}</span>
                      <span>·</span>
                      <span>{v.port}</span>
                    </div>
                    <div
                      className="flex items-center gap-2 mt-0.5 text-[9px]"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      <Package className="w-2.5 h-2.5" />
                      <span>{v.cargo}</span>
                      <span>·</span>
                      <span>Berth ETA: {v.eta_berth}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
