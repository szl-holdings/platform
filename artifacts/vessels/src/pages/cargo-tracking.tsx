
import {
  Activity,
  ArrowRight,
  BarChart3,
  Layers,
  Package,
  RefreshCw,
  Search,
  Ship,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type CommodityType =
  | 'crude_oil'
  | 'lng'
  | 'iron_ore'
  | 'grain'
  | 'container'
  | 'chemicals'
  | 'coal';

interface TradeFlow {
  id: string;
  commodity: CommodityType;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  volume_mt: number;
  volume_change: number;
  vessels_active: number;
  avg_transit_days: number;
  value_usd_m: number;
  trend: number[];
  last_updated: string;
}

const COMMODITY_CONFIG: Record<
  CommodityType,
  { label: string; color: string; icon: string; unit: string }
> = {
  crude_oil: { label: 'Crude Oil', color: '#f97316', icon: '', unit: 'MT' },
  lng: { label: 'LNG', color: '#60a5fa', icon: '', unit: 'MT' },
  iron_ore: { label: 'Iron Ore', color: '#a78bfa', icon: '', unit: 'MT' },
  grain: { label: 'Grain / Agri', color: '#34d399', icon: '', unit: 'MT' },
  container: { label: 'Container / General', color: '#38bdf8', icon: '', unit: 'TEU' },
  chemicals: { label: 'Chemicals', color: '#fb923c', icon: '', unit: 'MT' },
  coal: { label: 'Coal', color: '#94a3b8', icon: '', unit: 'MT' },
};

const TRADE_FLOWS: TradeFlow[] = [
  {
    id: 'tf-001',
    commodity: 'crude_oil',
    origin: 'Saudi Arabia',
    originCode: 'SA',
    destination: 'China',
    destinationCode: 'CN',
    volume_mt: 6.8,
    volume_change: 3.2,
    vessels_active: 34,
    avg_transit_days: 18,
    value_usd_m: 3940,
    trend: [5.2, 5.8, 6.1, 6.0, 6.4, 6.8],
    last_updated: '2h ago',
  },
  {
    id: 'tf-002',
    commodity: 'lng',
    origin: 'Qatar',
    originCode: 'QA',
    destination: 'Japan',
    destinationCode: 'JP',
    volume_mt: 2.4,
    volume_change: -1.8,
    vessels_active: 18,
    avg_transit_days: 12,
    value_usd_m: 2100,
    trend: [2.9, 2.7, 2.5, 2.6, 2.5, 2.4],
    last_updated: '1h ago',
  },
  {
    id: 'tf-003',
    commodity: 'iron_ore',
    origin: 'Australia',
    originCode: 'AU',
    destination: 'China',
    destinationCode: 'CN',
    volume_mt: 8.2,
    volume_change: 5.1,
    vessels_active: 52,
    avg_transit_days: 9,
    value_usd_m: 1240,
    trend: [6.4, 7.0, 7.4, 7.8, 7.9, 8.2],
    last_updated: '3h ago',
  },
  {
    id: 'tf-004',
    commodity: 'grain',
    origin: 'United States',
    originCode: 'US',
    destination: 'Egypt',
    destinationCode: 'EG',
    volume_mt: 1.2,
    volume_change: -4.3,
    vessels_active: 9,
    avg_transit_days: 22,
    value_usd_m: 380,
    trend: [1.6, 1.5, 1.3, 1.4, 1.2, 1.2],
    last_updated: '4h ago',
  },
  {
    id: 'tf-005',
    commodity: 'container',
    origin: 'China',
    originCode: 'CN',
    destination: 'United States',
    destinationCode: 'US',
    volume_mt: 1240000,
    volume_change: -8.4,
    vessels_active: 67,
    avg_transit_days: 16,
    value_usd_m: 8200,
    trend: [1420, 1380, 1310, 1290, 1260, 1240],
    last_updated: '1h ago',
  },
  {
    id: 'tf-006',
    commodity: 'chemicals',
    origin: 'Netherlands',
    originCode: 'NL',
    destination: 'India',
    destinationCode: 'IN',
    volume_mt: 0.8,
    volume_change: 12.4,
    vessels_active: 11,
    avg_transit_days: 20,
    value_usd_m: 620,
    trend: [0.55, 0.6, 0.67, 0.72, 0.77, 0.8],
    last_updated: '2h ago',
  },
  {
    id: 'tf-007',
    commodity: 'coal',
    origin: 'Indonesia',
    originCode: 'ID',
    destination: 'India',
    destinationCode: 'IN',
    volume_mt: 3.4,
    volume_change: 2.7,
    vessels_active: 28,
    avg_transit_days: 7,
    value_usd_m: 510,
    trend: [2.8, 2.9, 3.0, 3.2, 3.3, 3.4],
    last_updated: '5h ago',
  },
];

const MONTHLY_VOLUME_DATA = [
  {
    month: 'Oct',
    crude: 5.8,
    lng: 2.6,
    iron: 7.2,
    grain: 1.5,
    container: 1380,
    chemicals: 0.7,
    coal: 3.1,
  },
  {
    month: 'Nov',
    crude: 6.0,
    lng: 2.5,
    iron: 7.4,
    grain: 1.4,
    container: 1360,
    chemicals: 0.72,
    coal: 3.2,
  },
  {
    month: 'Dec',
    crude: 6.1,
    lng: 2.7,
    iron: 7.6,
    grain: 1.3,
    container: 1310,
    chemicals: 0.67,
    coal: 3.0,
  },
  {
    month: 'Jan',
    crude: 6.4,
    lng: 2.6,
    iron: 7.9,
    grain: 1.3,
    container: 1290,
    chemicals: 0.72,
    coal: 3.2,
  },
  {
    month: 'Feb',
    crude: 6.5,
    lng: 2.5,
    iron: 8.0,
    grain: 1.2,
    container: 1260,
    chemicals: 0.77,
    coal: 3.3,
  },
  {
    month: 'Mar',
    crude: 6.8,
    lng: 2.4,
    iron: 8.2,
    grain: 1.2,
    container: 1240,
    chemicals: 0.8,
    coal: 3.4,
  },
];

const COMMODITY_SHARE = [
  { name: 'Crude Oil', value: 28, color: '#f97316' },
  { name: 'Container', value: 22, color: '#38bdf8' },
  { name: 'Iron Ore', value: 18, color: '#a78bfa' },
  { name: 'Coal', value: 12, color: '#94a3b8' },
  { name: 'LNG', value: 10, color: '#60a5fa' },
  { name: 'Grain', value: 6, color: '#34d399' },
  { name: 'Chemicals', value: 4, color: '#fb923c' },
];

function MiniTrend({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 60;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

export default function CargoTrackingPage() {
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType | 'all'>('all');
  const [selectedFlow, setSelectedFlow] = useState<TradeFlow | null>(TRADE_FLOWS[0]);
  const [search, setSearch] = useState('');

  const filtered = TRADE_FLOWS.filter((f) => {
    const matchCommodity = selectedCommodity === 'all' || f.commodity === selectedCommodity;
    const matchSearch =
      !search ||
      f.origin.toLowerCase().includes(search.toLowerCase()) ||
      f.destination.toLowerCase().includes(search.toLowerCase());
    return matchCommodity && matchSearch;
  });

  const totalVessels = TRADE_FLOWS.reduce((s, f) => s + f.vessels_active, 0);
  const totalValueBn = (TRADE_FLOWS.reduce((s, f) => s + f.value_usd_m, 0) / 1000).toFixed(1);
  const _growingFlows = TRADE_FLOWS.filter((f) => f.volume_change > 0).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#040c1a]">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'rgba(56,189,248,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(56,189,248,0.1)' }}
          >
            <Package className="w-4 h-4 text-[#c9b787]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#f5f5f5]">Cargo Flow Intelligence</h1>
            <p className="text-[10px] text-[#6a6a6a]">
              Global commodity flows · origin/destination · volume & trade patterns
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded border text-[10px]"
            style={{
              borderColor: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              background: 'rgba(56,189,248,0.06)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
            Live — {TRADE_FLOWS.reduce((s, f) => s + f.vessels_active, 0)} vessels tracked
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div
        className="px-6 py-3 border-b grid grid-cols-3 gap-4 shrink-0"
        style={{ borderColor: 'rgba(56,189,248,0.06)' }}
      >
        {[
          {
            label: 'Active Trade Flows',
            value: TRADE_FLOWS.length,
            icon: Layers,
            color: '#38bdf8',
          },
          { label: 'Vessels Tracked', value: totalVessels, icon: Ship, color: '#60a5fa' },
          {
            label: 'Est. Cargo Value',
            value: `$${totalValueBn}B`,
            icon: BarChart3,
            color: '#34d399',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3 rounded-xl border"
            style={{ borderColor: `${color}15`, background: `${color}06` }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color }} />
            <div>
              <p className="text-[9px] text-[#6a6a6a]">{label}</p>
              <p className="text-lg font-bold text-[#f5f5f5] font-mono">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Flows List */}
        <div
          className="w-[380px] shrink-0 border-r flex flex-col overflow-hidden"
          style={{ borderColor: 'rgba(56,189,248,0.08)' }}
        >
          {/* Commodity Filter */}
          <div
            className="p-3 space-y-2 border-b shrink-0"
            style={{ borderColor: 'rgba(56,189,248,0.06)' }}
          >
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <Search className="w-3 h-3 text-white/30" />
              <input
                className="flex-1 bg-transparent text-[11px] text-white placeholder:text-white/20 outline-none"
                placeholder="Search origin / destination…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setSelectedCommodity('all')}
                className="px-2 py-0.5 rounded text-[9px] border transition-all"
                style={{
                  borderColor:
                    selectedCommodity === 'all' ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.08)',
                  color: selectedCommodity === 'all' ? '#38bdf8' : 'rgba(255,255,255,0.3)',
                  background: selectedCommodity === 'all' ? 'rgba(56,189,248,0.08)' : 'transparent',
                }}
              >
                All
              </button>
              {(Object.keys(COMMODITY_CONFIG) as CommodityType[]).map((c) => {
                const cfg = COMMODITY_CONFIG[c];
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCommodity(c)}
                    className="px-2 py-0.5 rounded text-[9px] border transition-all"
                    style={{
                      borderColor:
                        selectedCommodity === c ? `${cfg.color}40` : 'rgba(255,255,255,0.08)',
                      color: selectedCommodity === c ? cfg.color : 'rgba(255,255,255,0.3)',
                      background: selectedCommodity === c ? `${cfg.color}10` : 'transparent',
                    }}
                  >
                    {cfg.icon} {cfg.label.split('/')[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((flow) => {
              const cfg = COMMODITY_CONFIG[flow.commodity];
              const isSelected = selectedFlow?.id === flow.id;
              return (
                <button
                  key={flow.id}
                  onClick={() => setSelectedFlow(flow)}
                  className="w-full text-left p-4 border-b transition-all"
                  style={{
                    borderColor: 'rgba(255,255,255,0.04)',
                    background: isSelected ? `${cfg.color}08` : 'transparent',
                    borderLeft: isSelected ? `2px solid ${cfg.color}` : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cfg.icon}</span>
                      <div>
                        <p className="text-[10px] text-[#6a6a6a]">{cfg.label}</p>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#f5f5f5]">
                          <span>{flow.origin}</span>
                          <ArrowRight className="w-3 h-3 text-[#5a5a5a] shrink-0" />
                          <span>{flow.destination}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {flow.volume_change >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span
                        className="text-[9px] font-medium"
                        style={{ color: flow.volume_change >= 0 ? '#34d399' : '#ef4444' }}
                      >
                        {flow.volume_change >= 0 ? '+' : ''}
                        {flow.volume_change}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[9px] text-[#6a6a6a]">
                      <span>{flow.vessels_active} vessels</span>
                      <span>·</span>
                      <span>{flow.avg_transit_days}d transit</span>
                      <span>·</span>
                      <span>${flow.value_usd_m.toLocaleString()}M</span>
                    </div>
                    <MiniTrend data={flow.trend} color={cfg.color} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flow Detail */}
        {selectedFlow &&
          (() => {
            const cfg = COMMODITY_CONFIG[selectedFlow.commodity];
            return (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Flow Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">{cfg.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-[#f5f5f5]">
                            {selectedFlow.origin}
                          </span>
                          <ArrowRight className="w-4 h-4 text-[#5a5a5a]" />
                          <span className="text-sm font-bold text-[#f5f5f5]">
                            {selectedFlow.destination}
                          </span>
                        </div>
                        <p className="text-[10px]" style={{ color: cfg.color }}>
                          {cfg.label} Trade Corridor
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-[#5a5a5a]">Trade Value</p>
                    <p className="text-2xl font-black font-mono text-[#f5f5f5]">
                      ${selectedFlow.value_usd_m.toLocaleString()}M
                    </p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      {selectedFlow.volume_change >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span
                        className="text-[10px]"
                        style={{ color: selectedFlow.volume_change >= 0 ? '#34d399' : '#ef4444' }}
                      >
                        {selectedFlow.volume_change >= 0 ? '+' : ''}
                        {selectedFlow.volume_change}% MoM
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Active Vessels',
                      value: selectedFlow.vessels_active,
                      icon: Ship,
                      color: cfg.color,
                    },
                    {
                      label: 'Avg Transit',
                      value: `${selectedFlow.avg_transit_days}d`,
                      icon: Activity,
                      color: '#60a5fa',
                    },
                    {
                      label: `Volume (${cfg.unit})`,
                      value:
                        selectedFlow.volume_mt < 100
                          ? `${selectedFlow.volume_mt}M`
                          : `${(selectedFlow.volume_mt / 1000).toFixed(1)}M`,
                      icon: Package,
                      color: '#34d399',
                    },
                    {
                      label: 'Last Updated',
                      value: selectedFlow.last_updated,
                      icon: RefreshCw,
                      color: '#94a3b8',
                    },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 border"
                      style={{ borderColor: `${color}15`, background: `${color}06` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3 h-3" style={{ color }} />
                        <span className="text-[9px] text-[#5a5a5a]">{label}</span>
                      </div>
                      <p className="text-sm font-bold text-[#f5f5f5] font-mono">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Volume Trend */}
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: 'rgba(56,189,248,0.1)',
                    background: 'rgba(56,189,248,0.02)',
                  }}
                >
                  <h3 className="text-xs font-bold text-[#f5f5f5] mb-3">6-Month Volume Trend</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart
                      data={MONTHLY_VOLUME_DATA.map((d, i) => ({
                        month: d.month,
                        volume: selectedFlow.trend[i],
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(56,189,248,0.4)' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'rgba(56,189,248,0.4)' }} />
                      <Tooltip
                        contentStyle={{
                          background: '#0a1628',
                          border: '1px solid rgba(56,189,248,0.2)',
                          borderRadius: 8,
                          fontSize: 11,
                          color: '#e0f2fe',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke={cfg.color}
                        fill={cfg.color}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Commodity Share Chart */}
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: 'rgba(56,189,248,0.1)',
                      background: 'rgba(56,189,248,0.02)',
                    }}
                  >
                    <h3 className="text-xs font-bold text-[#f5f5f5] mb-3">Global Commodity Mix</h3>
                    <div className="flex items-center gap-4">
                      <PieChart width={100} height={100}>
                        <Pie
                          data={COMMODITY_SHARE}
                          cx={50}
                          cy={50}
                          innerRadius={28}
                          outerRadius={45}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {COMMODITY_SHARE.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                              opacity={entry.name === cfg.label ? 1 : 0.3}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                      <div className="space-y-1.5">
                        {COMMODITY_SHARE.slice(0, 5).map((item) => (
                          <div key={item.name} className="flex items-center gap-2 text-[9px]">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: item.color }}
                            />
                            <span
                              style={{
                                color:
                                  item.name === cfg.label
                                    ? 'rgba(255,255,255,0.8)'
                                    : 'rgba(255,255,255,0.3)',
                              }}
                            >
                              {item.name}
                            </span>
                            <span
                              className="ml-auto font-mono"
                              style={{
                                color:
                                  item.name === cfg.label ? cfg.color : 'rgba(255,255,255,0.3)',
                              }}
                            >
                              {item.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: 'rgba(56,189,248,0.1)',
                      background: 'rgba(56,189,248,0.02)',
                    }}
                  >
                    <h3 className="text-xs font-bold text-[#f5f5f5] mb-3">Corridor Risk Profile</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Sanctions Risk', value: 12, color: '#22c55e' },
                        { label: 'Weather Risk', value: 34, color: '#eab308' },
                        {
                          label: 'Piracy Risk',
                          value: selectedFlow.origin === 'Saudi Arabia' ? 68 : 8,
                          color: selectedFlow.origin === 'Saudi Arabia' ? '#f97316' : '#22c55e',
                        },
                        {
                          label: 'Port Congestion',
                          value: selectedFlow.destination === 'China' ? 89 : 42,
                          color: selectedFlow.destination === 'China' ? '#ef4444' : '#eab308',
                        },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between text-[9px] mb-1">
                            <span className="text-[#6a6a6a]">{label}</span>
                            <span style={{ color }}>{value}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${value}%`, background: color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
