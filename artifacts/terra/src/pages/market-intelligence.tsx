import { useStandardQuery } from '@szl-holdings/api-client-react';
import { type AutonomyMode, ProofEnvelope } from '@szl-holdings/design-system';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  ChevronDown,
  DollarSign,
  Download,
  Globe,
  Layers,
  Target,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const TERRA_GREEN = '#40856a';
const TERRA_GREEN_LIGHT = '#4a9d7d';
const BG = { page: '#080e0a', surface: '#0a120c', elevated: '#0e1610' };
const BORDER = { subtle: 'rgba(64,133,106,0.1)', muted: 'rgba(64,133,106,0.15)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};

const SUBMARKETS = [
  {
    id: 'midtown',
    name: 'Midtown Manhattan',
    class: 'Office',
    avg_rent: 98.4,
    rent_growth: 4.2,
    vacancy: 12.1,
    cap_rate: 5.2,
    velocity: 87,
    absorption: 142000,
    heat: 92,
  },
  {
    id: 'downtown-bk',
    name: 'Downtown Brooklyn',
    class: 'Mixed-Use',
    avg_rent: 62.1,
    rent_growth: 8.7,
    vacancy: 6.4,
    cap_rate: 5.8,
    velocity: 94,
    absorption: 98000,
    heat: 96,
  },
  {
    id: 'chelsea',
    name: 'Chelsea / Hudson Yards',
    class: 'Office + Retail',
    avg_rent: 118.2,
    rent_growth: 2.1,
    vacancy: 15.8,
    cap_rate: 4.8,
    velocity: 64,
    absorption: -24000,
    heat: 52,
  },
  {
    id: 'lic',
    name: 'Long Island City',
    class: 'Industrial + Multi',
    avg_rent: 41.8,
    rent_growth: 12.4,
    vacancy: 3.2,
    cap_rate: 5.1,
    velocity: 99,
    absorption: 218000,
    heat: 99,
  },
  {
    id: 'nolita',
    name: 'Nolita / Lower East',
    class: 'Retail + Resi',
    avg_rent: 78.5,
    rent_growth: 3.8,
    vacancy: 8.7,
    cap_rate: 5.4,
    velocity: 72,
    absorption: 44000,
    heat: 71,
  },
  {
    id: 'fidi',
    name: 'Financial District',
    class: 'Office + Resi Conv.',
    avg_rent: 68.3,
    rent_growth: -1.2,
    vacancy: 22.4,
    cap_rate: 6.1,
    velocity: 41,
    absorption: -67000,
    heat: 28,
  },
  {
    id: 'williamsburg',
    name: 'Williamsburg',
    class: 'Multi + Retail',
    avg_rent: 55.7,
    rent_growth: 7.9,
    vacancy: 4.1,
    cap_rate: 5.3,
    velocity: 91,
    absorption: 76000,
    heat: 88,
  },
  {
    id: 'bronx-sb',
    name: 'South Bronx',
    class: 'Industrial + Multi',
    avg_rent: 28.4,
    rent_growth: 14.8,
    vacancy: 2.8,
    cap_rate: 5.9,
    velocity: 98,
    absorption: 184000,
    heat: 97,
  },
];

const COMPS_DATA = [
  {
    address: '127 W 25th St, Chelsea',
    type: 'Office',
    sf: 18400,
    price: 14800000,
    ppsf: 804,
    date: '2026-03-15',
    cap_rate: 5.4,
    buyer: 'Blackstone RE',
  },
  {
    address: '88 Richardson St, Williamsburg',
    type: 'Multi-Family',
    sf: 24100,
    price: 22100000,
    ppsf: 917,
    date: '2026-03-10',
    cap_rate: 4.9,
    buyer: 'Related Companies',
  },
  {
    address: '30-02 Queens Blvd, LIC',
    type: 'Industrial',
    sf: 62400,
    price: 48700000,
    ppsf: 780,
    date: '2026-03-08',
    cap_rate: 5.1,
    buyer: 'Prologis',
  },
  {
    address: '240 Kent Ave, Williamsburg',
    type: 'Retail',
    sf: 8200,
    price: 9400000,
    ppsf: 1146,
    date: '2026-02-28',
    cap_rate: 5.8,
    buyer: 'Private',
  },
  {
    address: '425 W 50th St, Midtown',
    type: 'Office',
    sf: 41200,
    price: 38900000,
    ppsf: 944,
    date: '2026-02-22',
    cap_rate: 5.2,
    buyer: 'SL Green',
  },
];

const MARKET_CYCLE = Array.from({ length: 24 }, (_, i) => ({
  month: `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(i + 3) % 12]} '${24 + Math.floor((i + 3) / 12)}`,
  office_rent: 88 + Math.sin(i * 0.3) * 6 + i * 0.4,
  industrial_rent: 32 + i * 0.8 + Math.cos(i * 0.2) * 2,
  multi_rent: 52 + i * 0.5 + Math.sin(i * 0.4) * 3,
  vacancy: Math.max(4, 18 - i * 0.3 + Math.sin(i * 0.5) * 3),
}));

const ABSORPTION_DATA = [
  { submarket: 'South Bronx', absorption: 184, color: TERRA_GREEN },
  { submarket: 'LIC', absorption: 218, color: TERRA_GREEN },
  { submarket: 'Williamsburg', absorption: 76, color: TERRA_GREEN },
  { submarket: 'Downtown BK', absorption: 98, color: TERRA_GREEN },
  { submarket: 'Midtown', absorption: 142, color: TERRA_GREEN_LIGHT },
  { submarket: 'Nolita', absorption: 44, color: '#6b8f71' },
  { submarket: 'Chelsea', absorption: -24, color: '#c8953c' },
  { submarket: 'FiDi', absorption: -67, color: '#c45a4a' },
];

function HeatCell({ heat }: { heat: number }) {
  const getColor = (h: number) => {
    if (h >= 90) return '#22c55e';
    if (h >= 70) return '#84cc16';
    if (h >= 50) return '#f59e0b';
    if (h >= 30) return '#f97316';
    return '#ef4444';
  };
  return (
    <div
      className="w-8 h-6 rounded text-[8px] font-bold font-mono flex items-center justify-center"
      style={{
        background: `${getColor(heat)}18`,
        color: getColor(heat),
        border: `1px solid ${getColor(heat)}30`,
      }}
    >
      {heat}
    </div>
  );
}

interface TerraMarketResponse {
  data: {
    marketSummary?: {
      avgCapRate?: number;
      vacancyRate?: number;
      rentGrowth?: number;
      totalTransactions?: number;
    };
    submarkets?: Array<{
      name: string;
      class: string;
      avgRent?: number;
      vacancy?: number;
      rentGrowth?: number;
    }>;
    fetchedAt?: string;
  };
}
interface TerraSectorResponse {
  data: {
    sectors?: Array<{ sector: string; ytdReturn: number; capRate: number; trend: string }>;
    fetchedAt?: string;
  };
}
interface TerraMortgageResponse {
  data: {
    rates?: Array<{ term: string; rate: number; change: number; date: string }>;
    fetchedAt?: string;
  };
}

export default function MarketIntelligence() {
  const [selectedSubmarket, setSelectedSubmarket] = useState(SUBMARKETS[1]);
  const [activeTab, setActiveTab] = useState<'heat' | 'absorption' | 'comps' | 'cycle'>('heat');
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('recommend');

  const { data: marketData, isError: isMarketError } = useStandardQuery<TerraMarketResponse>({
    queryKey: ['market-intelligence-terra'],
    queryFn: () => apiFetch<TerraMarketResponse>('/terra/market-intelligence'),
    refetchInterval: 60000,
    retry: 1,
  });

  const { data: sectorData } = useStandardQuery<TerraSectorResponse>({
    queryKey: ['market-intelligence-sectors'],
    queryFn: () => apiFetch<TerraSectorResponse>('/terra/sector-performance'),
    refetchInterval: 60000,
    retry: 1,
  });

  const { data: mortgageData } = useStandardQuery<TerraMortgageResponse>({
    queryKey: ['market-intelligence-mortgage'],
    queryFn: () => apiFetch<TerraMortgageResponse>('/terra/live/mortgage-rates'),
    refetchInterval: 60000,
    retry: 1,
  });

  const liveMarket = marketData?.data;
  const _liveSectors = sectorData?.data?.sectors ?? [];
  const liveMortgage = mortgageData?.data?.rates ?? [];
  const isLive = !isMarketError && !!liveMarket;

  return (
    <div className="min-h-screen" style={{ background: BG.page, color: TEXT.primary }}>
      {/* Header */}
      <div
        className="px-5 py-3 border-b flex items-center justify-between"
        style={{ borderColor: BORDER.subtle, background: BG.surface }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'rgba(64,133,106,0.12)', border: `1px solid ${BORDER.muted}` }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: TERRA_GREEN }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Market Intelligence</h1>
            <p className="text-[10px]" style={{ color: TEXT.tertiary }}>
              Submarket analytics · Absorption · Comp pricing · Market cycle
            </p>
          </div>
          <div className="h-3 w-px" style={{ background: BORDER.subtle }} />
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <Wifi className="w-3 h-3" style={{ color: TERRA_GREEN }} />
            ) : (
              <WifiOff className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            )}
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: isLive ? TERRA_GREEN : 'rgba(255,255,255,0.15)' }}
            />
            <span
              className="text-[10px] font-mono"
              style={{ color: isLive ? TERRA_GREEN : 'rgba(255,255,255,0.35)' }}
            >
              {isLive ? 'LIVE · CoStar Feed' : 'Q1 2026 · NYC Metro'}
            </span>
          </div>
          {liveMortgage.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] font-mono ml-2">
              {liveMortgage.slice(0, 2).map((r) => (
                <span key={r.term} style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {r.term}: {r.rate}%
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded"
            style={{
              background: 'rgba(64,133,106,0.06)',
              border: `1px solid ${BORDER.subtle}`,
              color: TEXT.secondary,
            }}
          >
            <Globe className="w-3 h-3" />
            NYC Metro
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded"
            style={{
              background: 'rgba(64,133,106,0.06)',
              border: `1px solid ${BORDER.subtle}`,
              color: TEXT.secondary,
            }}
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Tab nav */}
        <div
          className="flex items-center gap-1 p-1 rounded-md w-fit"
          style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
        >
          {[
            { id: 'heat', label: 'Market Heat Map' },
            { id: 'absorption', label: 'Net Absorption' },
            { id: 'comps', label: 'Comp Sales' },
            { id: 'cycle', label: 'Market Cycle' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors"
              style={{
                background: activeTab === tab.id ? TERRA_GREEN : 'transparent',
                color: activeTab === tab.id ? 'white' : TEXT.tertiary,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Heat Map Tab */}
        {activeTab === 'heat' && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
              >
                <div
                  className="px-4 py-2.5 border-b flex items-center justify-between"
                  style={{ borderColor: BORDER.subtle }}
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" style={{ color: TERRA_GREEN }} />
                    <span className="text-[11px] font-semibold text-white">
                      Submarket Heat Index — Q1 2026
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2 text-[9px]"
                    style={{ color: TEXT.tertiary }}
                  >
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-emerald-500/70" />
                      Hot (90+)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-amber-500/70" />
                      Neutral (50–69)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-red-500/70" />
                      Cold (&lt;30)
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                        {[
                          'Submarket',
                          'Class',
                          'Avg Rent/SF',
                          'Rent Growth',
                          'Vacancy',
                          'Cap Rate',
                          'Absorption',
                          'Heat',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-semibold"
                            style={{ color: TEXT.tertiary }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...SUBMARKETS]
                        .sort((a, b) => b.heat - a.heat)
                        .map((sm) => (
                          <tr
                            key={sm.id}
                            onClick={() => setSelectedSubmarket(sm)}
                            className="cursor-pointer transition-colors"
                            style={{
                              borderBottom: `1px solid ${BORDER.subtle}`,
                              background:
                                selectedSubmarket.id === sm.id
                                  ? 'rgba(64,133,106,0.06)'
                                  : 'transparent',
                            }}
                          >
                            <td className="px-3 py-2.5">
                              <p
                                className="font-semibold"
                                style={{
                                  color:
                                    selectedSubmarket.id === sm.id ? TERRA_GREEN : TEXT.primary,
                                }}
                              >
                                {sm.name}
                              </p>
                            </td>
                            <td className="px-3 py-2.5" style={{ color: TEXT.tertiary }}>
                              {sm.class}
                            </td>
                            <td
                              className="px-3 py-2.5 font-mono font-bold"
                              style={{ color: TEXT.secondary }}
                            >
                              ${sm.avg_rent.toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={cn(
                                  'flex items-center gap-0.5 font-mono font-bold',
                                  sm.rent_growth >= 0 ? 'text-emerald-400' : 'text-red-400',
                                )}
                              >
                                {sm.rent_growth >= 0 ? (
                                  <TrendingUp className="w-2.5 h-2.5" />
                                ) : (
                                  <TrendingDown className="w-2.5 h-2.5" />
                                )}
                                {sm.rent_growth >= 0 ? '+' : ''}
                                {sm.rent_growth}%
                              </span>
                            </td>
                            <td
                              className="px-3 py-2.5 font-mono"
                              style={{
                                color:
                                  sm.vacancy > 15
                                    ? '#ef4444'
                                    : sm.vacancy > 8
                                      ? '#f59e0b'
                                      : '#22c55e',
                              }}
                            >
                              {sm.vacancy}%
                            </td>
                            <td className="px-3 py-2.5 font-mono" style={{ color: TEXT.secondary }}>
                              {sm.cap_rate}%
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className={cn(
                                  'font-mono text-[9px]',
                                  sm.absorption >= 0 ? 'text-emerald-400' : 'text-red-400',
                                )}
                              >
                                {sm.absorption >= 0 ? '+' : ''}
                                {(sm.absorption / 1000).toFixed(0)}K SF
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <HeatCell heat={sm.heat} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Submarket detail */}
            <div className="col-span-4 space-y-3">
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}
              >
                <div className="h-0.5" style={{ background: TERRA_GREEN }} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold text-white">{selectedSubmarket.name}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: TEXT.tertiary }}>
                        {selectedSubmarket.class}
                      </p>
                    </div>
                    <HeatCell heat={selectedSubmarket.heat} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: 'Avg Rent/SF',
                        value: `$${selectedSubmarket.avg_rent}/yr`,
                        color: TERRA_GREEN,
                      },
                      {
                        label: 'Rent Growth',
                        value: `${selectedSubmarket.rent_growth >= 0 ? '+' : ''}${selectedSubmarket.rent_growth}%`,
                        color: selectedSubmarket.rent_growth >= 0 ? '#22c55e' : '#ef4444',
                      },
                      {
                        label: 'Vacancy Rate',
                        value: `${selectedSubmarket.vacancy}%`,
                        color: selectedSubmarket.vacancy > 15 ? '#ef4444' : '#22c55e',
                      },
                      {
                        label: 'Cap Rate',
                        value: `${selectedSubmarket.cap_rate}%`,
                        color: TEXT.secondary,
                      },
                      {
                        label: 'Market Velocity',
                        value: `${selectedSubmarket.velocity}/100`,
                        color: selectedSubmarket.velocity > 80 ? TERRA_GREEN : '#f59e0b',
                      },
                      {
                        label: 'Net Absorption',
                        value: `${selectedSubmarket.absorption >= 0 ? '+' : ''}${(selectedSubmarket.absorption / 1000).toFixed(0)}K SF`,
                        color: selectedSubmarket.absorption >= 0 ? '#22c55e' : '#ef4444',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded p-2"
                        style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}
                      >
                        <p className="text-[8px] mb-1" style={{ color: TEXT.tertiary }}>
                          {item.label}
                        </p>
                        <p
                          className="text-[11px] font-bold font-mono"
                          style={{ color: item.color }}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <p className="text-[8px] mb-1.5" style={{ color: TEXT.tertiary }}>
                      Market velocity
                    </p>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: 'rgba(64,133,106,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${selectedSubmarket.velocity}%`, background: TERRA_GREEN }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {selectedSubmarket.heat >= 85 && (
                <ProofEnvelope
                  title={`High Opportunity Zone — ${selectedSubmarket.name}`}
                  confidence={selectedSubmarket.heat}
                  timestamp={new Date().toISOString()}
                  policyState="allowed"
                  autonomyMode={autonomyMode}
                  onAutonomyChange={setAutonomyMode}
                  accentColor={TERRA_GREEN}
                  evidence={[
                    {
                      id: `terra-opp-${selectedSubmarket.id}`,
                      label: 'Submarket Heat Score — Terra Analytics',
                      type: 'model',
                      excerpt: `Heat: ${selectedSubmarket.heat}/100. Rent growth: +${selectedSubmarket.rent_growth}%. Vacancy: ${selectedSubmarket.vacancy}%. Absorption: +${(selectedSubmarket.absorption / 1000).toFixed(0)}K SF.`,
                    },
                    {
                      id: `terra-opp-comp-${selectedSubmarket.id}`,
                      label: 'Comparable Transaction Analysis',
                      type: 'document',
                      excerpt:
                        '5 recent comps in similar submarkets averaging 5.2% cap rate. Entry multiples aligned with historical VC averages.',
                    },
                  ]}
                >
                  <p className="text-[10px] mt-1" style={{ color: TEXT.secondary }}>
                    Rent growth, low vacancy, and positive absorption make this one of the top
                    submarkets in the metro. Early entry advisable.
                  </p>
                </ProofEnvelope>
              )}

              {selectedSubmarket.vacancy > 18 && (
                <ProofEnvelope
                  title={`Elevated Vacancy Risk — ${selectedSubmarket.name}`}
                  confidence={70}
                  timestamp={new Date().toISOString()}
                  policyState="requires-approval"
                  policyReason="High vacancy submarkets require investment committee sign-off before capital deployment"
                  autonomyMode={autonomyMode}
                  onAutonomyChange={setAutonomyMode}
                  accentColor="#ef4444"
                  evidence={[
                    {
                      id: `terra-vac-${selectedSubmarket.id}`,
                      label: 'Vacancy Rate Monitor — Terra Analytics',
                      type: 'model',
                      excerpt: `Vacancy: ${selectedSubmarket.vacancy}% (threshold: 18%). Absorption: ${(selectedSubmarket.absorption / 1000).toFixed(0)}K SF (negative trajectory).`,
                    },
                    {
                      id: `terra-vac-hist-${selectedSubmarket.id}`,
                      label: 'Historical Distress Analysis',
                      type: 'document',
                      excerpt:
                        'Markets with vacancy >18% historically show distress sale opportunities in H2 of same year. FiDi 2025 precedent.',
                    },
                  ]}
                >
                  <p className="text-[10px] mt-1" style={{ color: TEXT.secondary }}>
                    Vacancy above 18% may indicate structural demand issues. Distress opportunities
                    likely to emerge in H2 2026.
                  </p>
                </ProofEnvelope>
              )}
            </div>
          </div>
        )}

        {/* Net Absorption Tab */}
        {activeTab === 'absorption' && (
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
            >
              <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER.subtle }}>
                <p className="text-[11px] font-semibold text-white">
                  Net Absorption by Submarket (Q1 2026, '000 SF)
                </p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={ABSORPTION_DATA}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.04)"
                      horizontal={false}
                    />
                    <XAxis type="number" tick={{ fontSize: 9, fill: TEXT.tertiary }} />
                    <YAxis
                      dataKey="submarket"
                      type="category"
                      tick={{ fontSize: 9, fill: TEXT.tertiary }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        background: BG.surface,
                        border: `1px solid ${BORDER.muted}`,
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
                    <Bar dataKey="absorption" name="Net Absorption (K SF)" radius={[0, 3, 3, 0]}>
                      {ABSORPTION_DATA.map((entry) => (
                        <Cell
                          key={entry.submarket}
                          fill={entry.absorption >= 0 ? TERRA_GREEN : '#c45a4a'}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-lg overflow-hidden"
              style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
            >
              <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER.subtle }}>
                <p className="text-[11px] font-semibold text-white">
                  Rent Trend by Asset Class ($/SF/yr)
                </p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={MARKET_CYCLE}
                    margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 8, fill: TEXT.tertiary }}
                      interval={3}
                    />
                    <YAxis tick={{ fontSize: 9, fill: TEXT.tertiary }} />
                    <Tooltip
                      contentStyle={{
                        background: BG.surface,
                        border: `1px solid ${BORDER.muted}`,
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="office_rent"
                      name="Office"
                      stroke="#3b82f6"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="multi_rent"
                      name="Multi-Family"
                      stroke={TERRA_GREEN}
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="industrial_rent"
                      name="Industrial"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 justify-center mt-2">
                  {[
                    ['Office', '#3b82f6'],
                    ['Multi-Family', TERRA_GREEN],
                    ['Industrial', '#f59e0b'],
                  ].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-3 h-0.5 rounded" style={{ background: color as string }} />
                      <span className="text-[8px]" style={{ color: TEXT.tertiary }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comp Sales Tab */}
        {activeTab === 'comps' && (
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="px-4 py-2.5 border-b flex items-center justify-between"
              style={{ borderColor: BORDER.subtle }}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" style={{ color: TERRA_GREEN }} />
                <span className="text-[11px] font-semibold text-white">
                  Recent Investment Sales Comps — NYC Metro · Q1 2026
                </span>
              </div>
              <span className="text-[9px]" style={{ color: TEXT.tertiary }}>
                {COMPS_DATA.length} transactions
              </span>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
                  {['Address', 'Type', 'SF', 'Price', 'Price/SF', 'Cap Rate', 'Buyer', 'Date'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left font-semibold"
                        style={{ color: TEXT.tertiary }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {COMPS_DATA.map((comp, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
                    className="hover:bg-terra-surface-hover transition-colors"
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: TEXT.primary }}>
                      {comp.address}
                    </td>
                    <td className="px-4 py-3" style={{ color: TEXT.tertiary }}>
                      {comp.type}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: TEXT.secondary }}>
                      {comp.sf.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: TERRA_GREEN }}>
                      ${(comp.price / 1e6).toFixed(1)}M
                    </td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: TEXT.primary }}>
                      ${comp.ppsf.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: TEXT.secondary }}>
                      {comp.cap_rate}%
                    </td>
                    <td className="px-4 py-3" style={{ color: TEXT.tertiary }}>
                      {comp.buyer}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: TEXT.tertiary }}>
                      {comp.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Market Cycle */}
        {activeTab === 'cycle' && (
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
            >
              <div className="px-4 py-2.5 border-b" style={{ borderColor: BORDER.subtle }}>
                <p className="text-[11px] font-semibold text-white">
                  Vacancy Rate Trend (All Classes)
                </p>
              </div>
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={MARKET_CYCLE}
                    margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 8, fill: TEXT.tertiary }}
                      interval={3}
                    />
                    <YAxis tick={{ fontSize: 9, fill: TEXT.tertiary }} domain={[0, 25]} />
                    <Tooltip
                      contentStyle={{
                        background: BG.surface,
                        border: `1px solid ${BORDER.muted}`,
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="vacancy"
                      name="Vacancy %"
                      stroke="#c45a4a"
                      fill="#c45a4a"
                      fillOpacity={0.1}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
            >
              <p className="text-[11px] font-semibold text-white mb-3">Market Cycle Position</p>
              <div className="space-y-3">
                {[
                  {
                    class: 'Industrial',
                    position: 'Expansion',
                    desc: 'Demand exceeds supply, rents rising, vacancy falling',
                    stage: 85,
                    color: TERRA_GREEN,
                  },
                  {
                    class: 'Multi-Family',
                    position: 'Expansion',
                    desc: 'Strong fundamentals, migration driven demand, low vacancy',
                    stage: 78,
                    color: TERRA_GREEN_LIGHT,
                  },
                  {
                    class: 'Office',
                    position: 'Contraction',
                    desc: 'WFH headwinds, negative absorption, rising tenant concessions',
                    stage: 28,
                    color: '#c45a4a',
                  },
                  {
                    class: 'Retail',
                    position: 'Recovery',
                    desc: 'Selective revival in experiential / food-anchored, not all retail',
                    stage: 52,
                    color: '#f59e0b',
                  },
                ].map((item) => (
                  <div key={item.class}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold" style={{ color: TEXT.primary }}>
                          {item.class}
                        </span>
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            color: item.color,
                            background: `${item.color}12`,
                            border: `1px solid ${item.color}25`,
                          }}
                        >
                          {item.position}
                        </span>
                      </div>
                      <span
                        className="text-[9px] font-mono font-bold"
                        style={{ color: item.color }}
                      >
                        {item.stage}/100
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden mb-1"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.stage}%`, background: item.color }}
                      />
                    </div>
                    <p className="text-[8px]" style={{ color: TEXT.tertiary }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
