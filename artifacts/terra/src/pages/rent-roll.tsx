import { useStandardQuery } from '@szl-holdings/api-client-react';
import { color as dsColor } from '@szl-holdings/design-system';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion as m } from 'framer-motion';
import {
  RefreshCw,
  Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '../lib/api';

interface Lease {
  id: string;
  tenant: string;
  suite: string;
  sqft: number;
  monthlyRent: number;
  rentPerSqft: number;
  marketRent: number;
  leaseStart: string;
  leaseEnd: string;
  escalation: string;
  securityDeposit: number;
  status: 'active' | 'expiring' | 'month-to-month' | 'vacant';
  creditScore: 'A' | 'B' | 'C' | 'D';
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  markToMarketGap: number;
}

interface PropertyRentRoll {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  totalSqft: number;
  occupiedSqft: number;
  grossPotentialRent: number;
  effectiveGrossIncome: number;
  vacancyLoss: number;
  leases: Lease[];
}

const PROPERTIES: PropertyRentRoll[] = [
  {
    id: 'rr-1',
    name: 'Gateway Commerce Center',
    address: '1200 Gateway Blvd, Dallas, TX 75201',
    totalUnits: 12,
    occupiedUnits: 10,
    totalSqft: 86000,
    occupiedSqft: 74200,
    grossPotentialRent: 215000,
    effectiveGrossIncome: 186500,
    vacancyLoss: 28500,
    leases: [
      {
        id: 'l1',
        tenant: 'Meridian Technologies',
        suite: '100',
        sqft: 12500,
        monthlyRent: 31250,
        rentPerSqft: 2.5,
        marketRent: 2.85,
        leaseStart: '2022-01-01',
        leaseEnd: '2027-12-31',
        escalation: '3% annual',
        securityDeposit: 62500,
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 14,
      },
      {
        id: 'l2',
        tenant: 'Apex Financial Group',
        suite: '200',
        sqft: 8200,
        monthlyRent: 22960,
        rentPerSqft: 2.8,
        marketRent: 2.85,
        leaseStart: '2023-06-01',
        leaseEnd: '2026-05-31',
        escalation: '2.5% annual',
        securityDeposit: 45920,
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 2,
      },
      {
        id: 'l3',
        tenant: 'Vanguard Legal LLP',
        suite: '300',
        sqft: 6800,
        monthlyRent: 18360,
        rentPerSqft: 2.7,
        marketRent: 2.85,
        leaseStart: '2021-03-01',
        leaseEnd: '2026-02-28',
        escalation: '3% annual',
        securityDeposit: 36720,
        status: 'expiring',
        creditScore: 'B',
        paymentHistory: 'good',
        markToMarketGap: 6,
      },
      {
        id: 'l4',
        tenant: 'BrightPath Health',
        suite: '400',
        sqft: 10500,
        monthlyRent: 23100,
        rentPerSqft: 2.2,
        marketRent: 2.85,
        leaseStart: '2019-07-01',
        leaseEnd: '2026-06-30',
        escalation: '2% annual',
        securityDeposit: 46200,
        status: 'expiring',
        creditScore: 'B',
        paymentHistory: 'good',
        markToMarketGap: 30,
      },
      {
        id: 'l5',
        tenant: 'Cascade Marketing',
        suite: '500',
        sqft: 4200,
        monthlyRent: 10500,
        rentPerSqft: 2.5,
        marketRent: 2.85,
        leaseStart: '2024-01-01',
        leaseEnd: '2026-12-31',
        escalation: '3% annual',
        securityDeposit: 21000,
        status: 'active',
        creditScore: 'B',
        paymentHistory: 'excellent',
        markToMarketGap: 14,
      },
      {
        id: 'l6',
        tenant: 'DataVault Systems',
        suite: '600',
        sqft: 9800,
        monthlyRent: 27440,
        rentPerSqft: 2.8,
        marketRent: 2.85,
        leaseStart: '2023-09-01',
        leaseEnd: '2028-08-31',
        escalation: '2.5% annual',
        securityDeposit: 54880,
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 2,
      },
      {
        id: 'l7',
        tenant: 'Pinnacle Consulting',
        suite: '700',
        sqft: 3800,
        monthlyRent: 7600,
        rentPerSqft: 2.0,
        marketRent: 2.85,
        leaseStart: '2020-01-01',
        leaseEnd: '2025-12-31',
        escalation: '2% annual',
        securityDeposit: 15200,
        status: 'expiring',
        creditScore: 'C',
        paymentHistory: 'fair',
        markToMarketGap: 43,
      },
      {
        id: 'l8',
        tenant: 'Vertex Engineering',
        suite: '800',
        sqft: 7200,
        monthlyRent: 19440,
        rentPerSqft: 2.7,
        marketRent: 2.85,
        leaseStart: '2024-03-01',
        leaseEnd: '2029-02-28',
        escalation: '3% annual',
        securityDeposit: 38880,
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 6,
      },
      {
        id: 'l9',
        tenant: 'Summit HR Solutions',
        suite: '900',
        sqft: 5600,
        monthlyRent: 14000,
        rentPerSqft: 2.5,
        marketRent: 2.85,
        leaseStart: '2022-08-01',
        leaseEnd: '2027-07-31',
        escalation: '2.5% annual',
        securityDeposit: 28000,
        status: 'active',
        creditScore: 'B',
        paymentHistory: 'good',
        markToMarketGap: 14,
      },
      {
        id: 'l10',
        tenant: 'Ironclad Security',
        suite: '1000',
        sqft: 5600,
        monthlyRent: 15680,
        rentPerSqft: 2.8,
        marketRent: 2.85,
        leaseStart: '2023-11-01',
        leaseEnd: '2028-10-31',
        escalation: '3% annual',
        securityDeposit: 31360,
        status: 'active',
        creditScore: 'A',
        paymentHistory: 'excellent',
        markToMarketGap: 2,
      },
    ],
  },
];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}K`
      : `$${n.toLocaleString()}`;

const STATUS_COLORS: Record<string, string> = {
  active: dsColor.accent.green,
  expiring: dsColor.accent.amber,
  'month-to-month': dsColor.accent.amber,
  vacant: dsColor.accent.red,
};

const CREDIT_COLORS: Record<string, string> = {
  A: dsColor.accent.green,
  B: dsColor.accent.blue,
  C: dsColor.accent.amber,
  D: dsColor.accent.red,
};

export default function RentRollPage() {
  const [uploading, setUploading] = useState(false);
  const [sortBy, setSortBy] = useState<'tenant' | 'gap' | 'expiry'>('gap');

  const { data: apiData, isLoading, isError } = useStandardQuery({
    queryKey: ['terra-rent-roll'],
    queryFn: () => api.rentRoll.list(),
    staleTime: 30_000,
  });

  const apiReachable = !isLoading && !isError && apiData;
  const allProperties = apiReachable && apiData.properties.length > 0
    ? apiData.properties.map((p) => ({
        ...p,
        totalSqft: p.leases.reduce((s, l) => s + l.sqft, 0),
        occupiedSqft: p.leases.filter((l) => l.status !== 'vacant').reduce((s, l) => s + l.sqft, 0),
        leases: p.leases.map((l) => ({
          ...l,
          rentPerSqft: l.sqft > 0 ? l.monthlyRent / l.sqft : 0,
          marketRent: l.sqft > 0 ? (l.monthlyRent / l.sqft) * 1.05 : 0,
          leaseStart: '',
          escalation: '',
          securityDeposit: 0,
        })),
      }))
    : PROPERTIES;
  const prop = allProperties[0];

  const occupancyRate = Math.round((prop.occupiedUnits / prop.totalUnits) * 100);
  const wale = useMemo(() => {
    const now = Date.now();
    let weighted = 0,
      totalRent = 0;
    for (const l of prop.leases) {
      const remaining = (new Date(l.leaseEnd).getTime() - now) / (365.25 * 24 * 3600000);
      if (remaining > 0) {
        weighted += remaining * l.monthlyRent;
        totalRent += l.monthlyRent;
      }
    }
    return totalRent > 0 ? (weighted / totalRent).toFixed(1) : '0';
  }, [prop]);

  const totalGapUpside = useMemo(() => {
    return prop.leases.reduce((sum, l) => sum + (l.marketRent - l.rentPerSqft) * l.sqft * 12, 0);
  }, [prop]);

  const sortedLeases = useMemo(() => {
    const leases = [...prop.leases];
    if (sortBy === 'gap') return leases.sort((a, b) => b.markToMarketGap - a.markToMarketGap);
    if (sortBy === 'expiry')
      return leases.sort((a, b) => new Date(a.leaseEnd).getTime() - new Date(b.leaseEnd).getTime());
    return leases.sort((a, b) => a.tenant.localeCompare(b.tenant));
  }, [prop, sortBy]);

  const expiringCount = prop.leases.filter((l) => l.status === 'expiring').length;

  return (
    <div className="min-h-screen" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
              Rent Roll Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{prop.name}</h1>
            <p className="mt-1 text-sm text-white/40">{prop.address}</p>
          </div>
          <button
            onClick={() => {
              setUploading(true);
              setTimeout(() => setUploading(false), 2000);
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            style={{ background: '#2d6a4f20', color: '#2d6a4f', border: '1px solid #2d6a4f30' }}
          >
            {uploading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Upload Leases
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {[
            {
              label: 'Occupancy',
              value: `${occupancyRate}%`,
              sub: `${prop.occupiedUnits}/${prop.totalUnits} units`,
              color: occupancyRate >= 90 ? '#34d399' : '#fbbf24',
            },
            {
              label: 'EGI (Monthly)',
              value: fmt(prop.effectiveGrossIncome),
              sub: `GPR: ${fmt(prop.grossPotentialRent)}`,
              color: '#2d6a4f',
            },
            {
              label: 'WALE',
              value: `${wale} yrs`,
              sub: 'Weighted avg lease expiry',
              color: '#60a5fa',
            },
            {
              label: 'Mark-to-Market Upside',
              value: fmt(totalGapUpside),
              sub: 'Annual potential at market',
              color: '#34d399',
            },
            {
              label: 'Expiring (12mo)',
              value: String(expiringCount),
              sub: `${expiringCount} leases at risk`,
              color: expiringCount > 2 ? '#ef4444' : '#fbbf24',
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-2">
                {m.label}
              </div>
              <div className="text-xl font-semibold text-white">{m.value}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Lease Schedule</h3>
            <div className="flex gap-1.5">
              {(['tenant', 'gap', 'expiry'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    'text-[10px] font-semibold px-2.5 py-1 rounded-full transition',
                    s === sortBy ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50',
                  )}
                >
                  {s === 'gap' ? 'Gap ↓' : s === 'expiry' ? 'Expiry ↑' : 'A-Z'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    'Tenant',
                    'Suite',
                    'SF',
                    'Rent/SF',
                    'Market',
                    'Gap',
                    'Lease End',
                    'Credit',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 font-semibold text-white/40 uppercase tracking-wider"
                      style={{ fontSize: '10px' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedLeases.map((l) => (
                  <tr key={l.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 text-sm font-medium text-white">{l.tenant}</td>
                    <td className="py-2.5 pr-4 text-sm text-white/60">{l.suite}</td>
                    <td className="py-2.5 pr-4 text-sm text-white/60">{l.sqft.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-sm text-white">${l.rentPerSqft.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-sm text-white/40">
                      ${l.marketRent.toFixed(2)}
                    </td>
                    <td
                      className="py-2.5 pr-4 text-sm font-semibold"
                      style={{
                        color:
                          l.markToMarketGap > 10
                            ? '#34d399'
                            : l.markToMarketGap > 0
                              ? '#60a5fa'
                              : '#ef4444',
                      }}
                    >
                      {l.markToMarketGap > 0 ? '+' : ''}
                      {l.markToMarketGap}%
                    </td>
                    <td className="py-2.5 pr-4 text-sm text-white/40">{l.leaseEnd}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${CREDIT_COLORS[l.creditScore]}15`,
                          color: CREDIT_COLORS[l.creditScore],
                        }}
                      >
                        {l.creditScore}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: `${STATUS_COLORS[l.status]}15`,
                          color: STATUS_COLORS[l.status],
                        }}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Revenue Optimization Recommendations
            </h3>
            <div className="space-y-3">
              {[
                {
                  title: 'Renew BrightPath Health at Market Rate',
                  impact: '+$81,900/yr',
                  detail:
                    'Current $2.20/SF is 30% below market $2.85/SF. Lease expires Jun 2026. Offer early renewal with 5-year term at $2.75/SF.',
                  priority: 'high',
                },
                {
                  title: 'Non-Renew Pinnacle Consulting',
                  impact: '+$38,760/yr',
                  detail:
                    'C-credit tenant paying $2.00/SF. Suite 700 can be re-leased at $2.85/SF. Fair payment history increases renewal risk.',
                  priority: 'high',
                },
                {
                  title: 'Early Renewal — Vanguard Legal',
                  impact: '+$12,240/yr',
                  detail:
                    'Lease expiring Feb 2026. Offer 3-year extension at $2.85/SF with 6 months free rent concession.',
                  priority: 'medium',
                },
                {
                  title: 'Parking Revenue Optimization',
                  impact: '+$24,000/yr',
                  detail:
                    '18 unreserved spaces at $0/mo. Market rate for reserved parking is $150/mo. Convert to reserved.',
                  priority: 'low',
                },
              ].map((r, i) => (
                <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{r.title}</span>
                    <span className="text-xs font-bold" style={{ color: '#34d399' }}>
                      {r.impact}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/35">{r.detail}</p>
                  <span
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full mt-2 inline-block"
                    style={{
                      background:
                        r.priority === 'high'
                          ? '#ef444415'
                          : r.priority === 'medium'
                            ? '#fbbf2415'
                            : '#60a5fa15',
                      color:
                        r.priority === 'high'
                          ? '#ef4444'
                          : r.priority === 'medium'
                            ? '#fbbf24'
                            : '#60a5fa',
                    }}
                  >
                    {r.priority} priority
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Lease Expiration Risk</h3>
            <div className="space-y-3">
              {[2026, 2027, 2028, 2029].map((year) => {
                const expiring = prop.leases.filter(
                  (l) => new Date(l.leaseEnd).getFullYear() === year,
                );
                const sqftExpiring = expiring.reduce((s, l) => s + l.sqft, 0);
                const rentExpiring = expiring.reduce((s, l) => s + l.monthlyRent, 0);
                const pctOfTotal = Math.round((sqftExpiring / prop.totalSqft) * 100);
                return (
                  <div
                    key={year}
                    className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{year}</span>
                      <span className="text-xs text-white/40">
                        {expiring.length} leases · {sqftExpiring.toLocaleString()} SF
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-white/[0.06]">
                        <m.div
                          className="h-2 rounded-full"
                          style={{
                            background:
                              pctOfTotal > 25 ? '#ef4444' : pctOfTotal > 15 ? '#fbbf24' : '#34d399',
                            width: `${pctOfTotal}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white/50 w-12 text-right">
                        {pctOfTotal}%
                      </span>
                    </div>
                    <div className="text-[10px] text-white/30 mt-1">
                      Monthly rent at risk: {fmt(rentExpiring)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
