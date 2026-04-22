import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  DollarSign,
  Layers,
  Percent,
  Target,
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
import { Link } from 'wouter';

interface PropertyAsset {
  id: string;
  name: string;
  type: string;
  location: string;
  acquisition_date: string;
  acquisition_price: number;
  current_value: number;
  noi_annual: number;
  noi_change_pct: number;
  occupancy_pct: number;
  cap_rate: number;
  debt_amount: number;
  equity_value: number;
  irr_pct?: number;
  status: 'performing' | 'watch' | 'critical';
  units?: number;
  sqft: number;
}

const PORTFOLIO: PropertyAsset[] = [
  {
    id: 'P001',
    name: 'The Meridian',
    type: 'Multifamily',
    location: 'Williamsburg, BK',
    acquisition_date: 'Mar 2021',
    acquisition_price: 24800000,
    current_value: 31200000,
    noi_annual: 1720000,
    noi_change_pct: 6.8,
    occupancy_pct: 96.2,
    cap_rate: 5.5,
    debt_amount: 14880000,
    equity_value: 16320000,
    irr_pct: 18.4,
    status: 'performing',
    units: 54,
    sqft: 58000,
  },
  {
    id: 'P002',
    name: 'Corsair Plaza',
    type: 'Mixed Use',
    location: 'LIC, Queens',
    acquisition_date: 'Sep 2022',
    acquisition_price: 18200000,
    current_value: 21400000,
    noi_annual: 1240000,
    noi_change_pct: 4.2,
    occupancy_pct: 91.4,
    cap_rate: 5.8,
    debt_amount: 10920000,
    equity_value: 10480000,
    irr_pct: 14.2,
    status: 'performing',
    units: 32,
    sqft: 42000,
  },
  {
    id: 'P003',
    name: '125 Pine Commerce',
    type: 'Office',
    location: 'Downtown Manhattan',
    acquisition_date: 'Jan 2020',
    acquisition_price: 42400000,
    current_value: 36800000,
    noi_annual: 2680000,
    noi_change_pct: -8.4,
    occupancy_pct: 74.0,
    cap_rate: 7.3,
    debt_amount: 25440000,
    equity_value: 11360000,
    irr_pct: -4.2,
    status: 'critical',
    sqft: 180000,
  },
  {
    id: 'P004',
    name: 'Thornfield Residences',
    type: 'Multifamily',
    location: 'Astoria, Queens',
    acquisition_date: 'Jun 2022',
    acquisition_price: 14600000,
    current_value: 17200000,
    noi_annual: 1020000,
    noi_change_pct: 8.1,
    occupancy_pct: 98.0,
    cap_rate: 5.9,
    debt_amount: 8760000,
    equity_value: 8440000,
    irr_pct: 16.8,
    status: 'performing',
    units: 38,
    sqft: 38400,
  },
  {
    id: 'P005',
    name: 'Brooklyn Navy Industrial',
    type: 'Industrial',
    location: 'Navy Yard, BK',
    acquisition_date: 'Nov 2023',
    acquisition_price: 28400000,
    current_value: 29200000,
    noi_annual: 1840000,
    noi_change_pct: 2.4,
    occupancy_pct: 100,
    cap_rate: 6.3,
    debt_amount: 17040000,
    equity_value: 12160000,
    irr_pct: 8.2,
    status: 'performing',
    sqft: 82000,
  },
  {
    id: 'P006',
    name: 'South Fordham Apartments',
    type: 'Multifamily',
    location: 'Fordham, Bronx',
    acquisition_date: 'Apr 2021',
    acquisition_price: 8200000,
    current_value: 10800000,
    noi_annual: 720000,
    noi_change_pct: 12.4,
    occupancy_pct: 97.4,
    cap_rate: 6.7,
    debt_amount: 4920000,
    equity_value: 5880000,
    irr_pct: 22.1,
    status: 'performing',
    units: 24,
    sqft: 28000,
  },
  {
    id: 'P007',
    name: 'Metro Commons',
    type: 'Retail Strip',
    location: 'Bay Ridge, BK',
    acquisition_date: 'Aug 2019',
    acquisition_price: 6800000,
    current_value: 6200000,
    noi_annual: 420000,
    noi_change_pct: -3.8,
    occupancy_pct: 82.0,
    cap_rate: 6.8,
    debt_amount: 4080000,
    equity_value: 2120000,
    irr_pct: -1.2,
    status: 'watch',
    sqft: 14000,
  },
];

const NOI_TREND = [
  { q: "Q1 '23", noi: 7.2 },
  { q: "Q2 '23", noi: 7.6 },
  { q: "Q3 '23", noi: 7.9 },
  { q: "Q4 '23", noi: 8.0 },
  { q: "Q1 '24", noi: 8.4 },
  { q: "Q2 '24", noi: 8.6 },
];

const ALLOCATION_DATA = [
  { name: 'Multifamily', value: 54, color: '#34d399' },
  { name: 'Office', value: 23, color: '#60a5fa' },
  { name: 'Industrial', value: 13, color: '#a78bfa' },
  { name: 'Mixed Use', value: 7, color: '#c8a060' },
  { name: 'Retail', value: 3, color: '#f97316' },
];

const STATUS_CONFIG = {
  performing: { color: '#34d399', label: 'Performing' },
  watch: { color: '#f59e0b', label: 'Watch List' },
  critical: { color: '#ef4444', label: 'Critical' },
};

function formatMoney(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

export default function PortfolioDashboardPage() {
  const [selected, setSelected] = useState<PropertyAsset | null>(PORTFOLIO[0]);

  const totalGAV = PORTFOLIO.reduce((s, p) => s + p.current_value, 0);
  const totalNAV = PORTFOLIO.reduce((s, p) => s + p.equity_value, 0);
  const totalNOI = PORTFOLIO.reduce((s, p) => s + p.noi_annual, 0);
  const totalDebt = PORTFOLIO.reduce((s, p) => s + p.debt_amount, 0);
  const avgOccupancy = (
    PORTFOLIO.reduce((s, p) => s + p.occupancy_pct, 0) / PORTFOLIO.length
  ).toFixed(1);
  const avgCapRate = (PORTFOLIO.reduce((s, p) => s + p.cap_rate, 0) / PORTFOLIO.length).toFixed(2);
  const watchList = PORTFOLIO.filter((p) => p.status !== 'performing').length;
  const ltvPct = ((totalDebt / totalGAV) * 100).toFixed(1);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#060c12' }}>
      {/* Header */}
      <div
        className="px-5 py-3.5 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: 'rgba(200,160,96,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(200,160,96,0.1)' }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: '#c8a060' }} />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: '#f4e8d0' }}>
              Portfolio Dashboard
            </h1>
            <p className="text-[9px]" style={{ color: 'rgba(200,160,96,0.4)' }}>
              Multi-property performance · NOI tracking · occupancy · value at risk
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px]" style={{ color: 'rgba(200,160,96,0.35)' }}>
            Total Portfolio Value
          </p>
          <p className="text-lg font-black font-mono" style={{ color: '#f4e8d0' }}>
            {formatMoney(totalGAV)}
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div
        className="px-5 py-3 border-b grid grid-cols-6 gap-3 shrink-0"
        style={{ borderColor: 'rgba(200,160,96,0.06)' }}
      >
        {[
          {
            label: 'Net Asset Value',
            value: formatMoney(totalNAV),
            color: '#34d399',
            icon: DollarSign,
          },
          { label: 'Annual NOI', value: formatMoney(totalNOI), color: '#c8a060', icon: TrendingUp },
          { label: 'Avg Occupancy', value: `${avgOccupancy}%`, color: '#60a5fa', icon: Activity },
          { label: 'Avg Cap Rate', value: `${avgCapRate}%`, color: '#a78bfa', icon: Percent },
          {
            label: 'Portfolio LTV',
            value: `${ltvPct}%`,
            color: Number(ltvPct) > 65 ? '#f97316' : '#34d399',
            icon: BarChart3,
          },
          {
            label: 'Watch/Critical',
            value: watchList,
            color: watchList > 0 ? '#f97316' : '#34d399',
            icon: AlertTriangle,
          },
        ].map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl p-3 border"
            style={{ borderColor: `${color}15`, background: `${color}06` }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Icon className="w-3 h-3" style={{ color }} />
              <span className="text-[8px]" style={{ color: 'rgba(200,160,96,0.4)' }}>
                {label}
              </span>
            </div>
            <p className="text-sm font-bold font-mono" style={{ color: '#f4e8d0' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Property List */}
        <div className="flex-1 overflow-y-auto">
          {/* Column headers */}
          <div
            className="grid grid-cols-8 px-5 py-2 text-[8px] font-medium uppercase tracking-wider border-b"
            style={{ color: 'rgba(200,160,96,0.3)', borderColor: 'rgba(200,160,96,0.06)' }}
          >
            <div className="col-span-2">Property</div>
            <div>Status</div>
            <div>NOI</div>
            <div>Occupancy</div>
            <div>Cap Rate</div>
            <div>Equity</div>
            <div>IRR</div>
          </div>

          {PORTFOLIO.map((asset) => {
            const st = STATUS_CONFIG[asset.status];
            const isSelected = selected?.id === asset.id;
            return (
              <button
                key={asset.id}
                onClick={() => setSelected(isSelected ? null : asset)}
                className="w-full grid grid-cols-8 px-5 py-3.5 border-b text-left transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.04)',
                  background: isSelected ? 'rgba(200,160,96,0.06)' : 'transparent',
                  borderLeft: isSelected
                    ? '2px solid rgba(200,160,96,0.4)'
                    : '2px solid transparent',
                }}
              >
                <div className="col-span-2 min-w-0">
                  <p className="text-[11px] font-bold" style={{ color: '#f4e8d0' }}>
                    {asset.name}
                  </p>
                  <p className="text-[9px]" style={{ color: 'rgba(200,160,96,0.4)' }}>
                    {asset.type} · {asset.location}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: st.color, background: `${st.color}15` }}
                  >
                    {st.label}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-mono" style={{ color: '#f4e8d0' }}>
                    {formatMoney(asset.noi_annual)}
                  </p>
                  <div className="flex items-center gap-0.5">
                    {asset.noi_change_pct >= 0 ? (
                      <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                    )}
                    <span
                      className="text-[8px]"
                      style={{ color: asset.noi_change_pct >= 0 ? '#34d399' : '#ef4444' }}
                    >
                      {asset.noi_change_pct >= 0 ? '+' : ''}
                      {asset.noi_change_pct}%
                    </span>
                  </div>
                </div>
                <div>
                  <p
                    className="text-[11px] font-mono"
                    style={{ color: asset.occupancy_pct < 85 ? '#ef4444' : '#f4e8d0' }}
                  >
                    {asset.occupancy_pct}%
                  </p>
                  <div className="h-1 w-12 rounded-full bg-white/5 mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${asset.occupancy_pct}%`,
                        background:
                          asset.occupancy_pct >= 95
                            ? '#34d399'
                            : asset.occupancy_pct >= 85
                              ? '#c8a060'
                              : '#ef4444',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-mono" style={{ color: '#f4e8d0' }}>
                    {asset.cap_rate}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-mono" style={{ color: '#f4e8d0' }}>
                    {formatMoney(asset.equity_value)}
                  </p>
                </div>
                <div>
                  {asset.irr_pct !== undefined && (
                    <p
                      className="text-[11px] font-mono font-bold"
                      style={{
                        color:
                          asset.irr_pct >= 12
                            ? '#34d399'
                            : asset.irr_pct >= 0
                              ? '#c8a060'
                              : '#ef4444',
                      }}
                    >
                      {asset.irr_pct >= 0 ? '+' : ''}
                      {asset.irr_pct}%
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Panel — Charts + Selected Detail */}
        <div
          className="w-[320px] shrink-0 border-l overflow-y-auto p-4 space-y-4"
          style={{ borderColor: 'rgba(200,160,96,0.08)' }}
        >
          {/* NOI Trend */}
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: 'rgba(200,160,96,0.1)', background: 'rgba(200,160,96,0.02)' }}
          >
            <h3 className="text-[10px] font-bold mb-2" style={{ color: '#f4e8d0' }}>
              Portfolio NOI Trend ($M)
            </h3>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={NOI_TREND} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="q" tick={{ fontSize: 8, fill: 'rgba(200,160,96,0.4)' }} />
                <YAxis tick={{ fontSize: 8, fill: 'rgba(200,160,96,0.4)' }} />
                <Tooltip
                  contentStyle={{
                    background: '#0a1410',
                    border: '1px solid rgba(200,160,96,0.2)',
                    borderRadius: 8,
                    fontSize: 10,
                    color: '#f4e8d0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="noi"
                  stroke="#c8a060"
                  fill="#c8a060"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation */}
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: 'rgba(200,160,96,0.1)', background: 'rgba(200,160,96,0.02)' }}
          >
            <h3 className="text-[10px] font-bold mb-2" style={{ color: '#f4e8d0' }}>
              Asset Allocation
            </h3>
            <div className="flex items-center gap-3">
              <PieChart width={80} height={80}>
                <Pie
                  data={ALLOCATION_DATA}
                  cx={40}
                  cy={40}
                  innerRadius={22}
                  outerRadius={36}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {ALLOCATION_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="space-y-1.5">
                {ALLOCATION_DATA.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[9px]">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: d.color }}
                    />
                    <span style={{ color: 'rgba(200,160,96,0.5)' }}>{d.name}</span>
                    <span className="ml-auto font-mono" style={{ color: d.color }}>
                      {d.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Construction Monitor */}
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: 'rgba(200,160,96,0.1)', background: 'rgba(200,160,96,0.02)' }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Target className="w-3 h-3" style={{ color: '#c8a060' }} />
              <h3 className="text-[10px] font-bold" style={{ color: '#f4e8d0' }}>
                Construction Monitor
              </h3>
              <span
                className="px-1.5 py-0.5 rounded text-[8px] font-semibold"
                style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)' }}
              >
                2 On Track
              </span>
              <Link
                href="/construction-monitor"
                className="ml-auto text-[8px] flex items-center gap-0.5"
                style={{ color: 'rgba(200,160,96,0.4)' }}
              >
                View all <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  name: 'The Meridian — Roof',
                  budget: '$1.2M',
                  spent: 78,
                  status: 'on-track',
                  color: '#34d399',
                },
                {
                  name: 'Navy Industrial — HVAC',
                  budget: '$3.4M',
                  spent: 45,
                  status: 'on-track',
                  color: '#34d399',
                },
                {
                  name: 'Corsair Plaza — Lobby',
                  budget: '$840K',
                  spent: 92,
                  status: 'at-risk',
                  color: '#f59e0b',
                },
              ].map((proj) => (
                <div key={proj.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px]" style={{ color: 'rgba(244,232,208,0.6)' }}>
                      {proj.name}
                    </span>
                    <span
                      className="text-[8px] font-mono"
                      style={{ color: 'rgba(200,160,96,0.4)' }}
                    >
                      {proj.budget}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${proj.spent}%`, background: proj.color }}
                      />
                    </div>
                    <span
                      className="text-[8px] font-mono w-7 text-right"
                      style={{ color: proj.color }}
                    >
                      {proj.spent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Asset Detail */}
          {selected && (
            <div
              className="rounded-xl border p-3"
              style={{ borderColor: 'rgba(200,160,96,0.15)', background: 'rgba(200,160,96,0.04)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[11px] font-bold" style={{ color: '#f4e8d0' }}>
                    {selected.name}
                  </h3>
                  <p className="text-[9px]" style={{ color: 'rgba(200,160,96,0.4)' }}>
                    {selected.type} · {selected.location}
                  </p>
                </div>
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: STATUS_CONFIG[selected.status].color,
                    background: `${STATUS_CONFIG[selected.status].color}15`,
                  }}
                >
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  { label: 'Acquired', value: selected.acquisition_date },
                  { label: 'Acq. Price', value: formatMoney(selected.acquisition_price) },
                  { label: 'Current Value', value: formatMoney(selected.current_value) },
                  {
                    label: 'Appreciation',
                    value: `+${(((selected.current_value - selected.acquisition_price) / selected.acquisition_price) * 100).toFixed(1)}%`,
                  },
                  { label: 'Total Debt', value: formatMoney(selected.debt_amount) },
                  {
                    label: 'LTV',
                    value: `${((selected.debt_amount / selected.current_value) * 100).toFixed(1)}%`,
                  },
                  {
                    label: 'Size',
                    value: `${(selected.sqft / 1000).toFixed(0)}K SF${selected.units ? ` · ${selected.units} units` : ''}`,
                  },
                  {
                    label: 'IRR',
                    value:
                      selected.irr_pct !== undefined
                        ? `${selected.irr_pct >= 0 ? '+' : ''}${selected.irr_pct}%`
                        : '—',
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[8px]" style={{ color: 'rgba(200,160,96,0.35)' }}>
                      {label}
                    </p>
                    <p className="font-medium" style={{ color: '#f4e8d0' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
