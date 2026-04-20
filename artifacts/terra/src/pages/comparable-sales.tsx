import { cn } from '@szl-holdings/shared-ui/utils';
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Filter,
  Layers,
  MapPin,
  Search,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

type PropertyType =
  | 'all'
  | 'multifamily'
  | 'office'
  | 'retail'
  | 'industrial'
  | 'mixed_use'
  | 'land';
type SortKey = 'date' | 'price' | 'price_psf' | 'cap_rate' | 'units';

interface Comp {
  id: string;
  address: string;
  neighborhood: string;
  borough: string;
  propertyType: PropertyType;
  saleDate: string;
  salePrice: number;
  pricePSF: number;
  sqft: number;
  units?: number;
  capRate?: number;
  yearBuilt: number;
  buyer: string;
  seller: string;
  distance_mi?: number;
  noteworthy?: string;
}

const COMPS: Comp[] = [
  {
    id: 'COMP-001',
    address: '125 W 55th St',
    neighborhood: 'Midtown West',
    borough: 'Manhattan',
    propertyType: 'office',
    saleDate: 'Mar 14, 2026',
    salePrice: 84200000,
    pricePSF: 312,
    sqft: 270000,
    yearBuilt: 1964,
    buyer: 'BXP Inc.',
    seller: 'Blackstone RE',
    capRate: 5.8,
    distance_mi: 0.4,
    noteworthy: 'Core office asset — major lease-up story',
  },
  {
    id: 'COMP-002',
    address: '242 N 8th St',
    neighborhood: 'Williamsburg',
    borough: 'Brooklyn',
    propertyType: 'multifamily',
    saleDate: 'Feb 28, 2026',
    salePrice: 28400000,
    pricePSF: 488,
    sqft: 58200,
    units: 54,
    yearBuilt: 2018,
    buyer: 'Eagle Rock Partners',
    seller: 'Waterman Equity',
    capRate: 4.9,
    distance_mi: 1.2,
  },
  {
    id: 'COMP-003',
    address: '41-11 27th St',
    neighborhood: 'Long Island City',
    borough: 'Queens',
    propertyType: 'multifamily',
    saleDate: 'Jan 10, 2026',
    salePrice: 21600000,
    pricePSF: 422,
    sqft: 51200,
    units: 48,
    yearBuilt: 2021,
    buyer: 'Tishman Speyer',
    seller: 'L&M Development',
    capRate: 5.2,
    distance_mi: 2.8,
  },
  {
    id: 'COMP-004',
    address: '55 Water St',
    neighborhood: 'Financial District',
    borough: 'Manhattan',
    propertyType: 'office',
    saleDate: 'Nov 15, 2025',
    salePrice: 152800000,
    pricePSF: 218,
    sqft: 700000,
    yearBuilt: 1972,
    buyer: '60 Guilders',
    seller: 'TF Cornerstone',
    capRate: 7.1,
    distance_mi: 0.9,
    noteworthy: 'Distressed sale — below replacement cost',
  },
  {
    id: 'COMP-005',
    address: '850 Third Ave',
    neighborhood: 'Midtown East',
    borough: 'Manhattan',
    propertyType: 'office',
    saleDate: 'Sep 15, 2025',
    salePrice: 195000000,
    pricePSF: 481,
    sqft: 405000,
    yearBuilt: 1961,
    buyer: 'RXR Realty',
    seller: 'Sage Realty',
    capRate: 5.4,
    distance_mi: 1.7,
  },
  {
    id: 'COMP-006',
    address: '10 Halletts Point',
    neighborhood: 'Astoria',
    borough: 'Queens',
    propertyType: 'multifamily',
    saleDate: 'Jul 22, 2025',
    salePrice: 38200000,
    pricePSF: 392,
    sqft: 97400,
    units: 92,
    yearBuilt: 2022,
    buyer: 'Durst Organization',
    seller: 'Halletts Development',
    distance_mi: 3.4,
  },
  {
    id: 'COMP-007',
    address: '32-02 Queens Blvd',
    neighborhood: 'Jackson Heights',
    borough: 'Queens',
    propertyType: 'retail',
    saleDate: 'Apr 12, 2025',
    salePrice: 8400000,
    pricePSF: 210,
    sqft: 40000,
    yearBuilt: 1955,
    buyer: 'Private Investor',
    seller: 'Estate Sale',
    capRate: 6.8,
    distance_mi: 4.1,
  },
  {
    id: 'COMP-008',
    address: '160 Cabrini Blvd',
    neighborhood: 'Washington Heights',
    borough: 'Manhattan',
    propertyType: 'multifamily',
    saleDate: 'Jan 30, 2025',
    salePrice: 44800000,
    pricePSF: 358,
    sqft: 125000,
    units: 124,
    yearBuilt: 1928,
    buyer: 'L3 Capital',
    seller: 'Wavecrest Management',
    capRate: 5.6,
    distance_mi: 2.1,
  },
  {
    id: 'COMP-009',
    address: '1 Dock 72 Way',
    neighborhood: 'Brooklyn Navy Yard',
    borough: 'Brooklyn',
    propertyType: 'industrial',
    saleDate: 'Oct 15, 2024',
    salePrice: 62000000,
    pricePSF: 388,
    sqft: 160000,
    yearBuilt: 2019,
    buyer: 'CBRE Investment',
    seller: 'Boston Properties',
    capRate: 4.4,
    distance_mi: 1.5,
    noteworthy: 'Premium industrial — life science conversion',
  },
  {
    id: 'COMP-010',
    address: '550 Washington St',
    neighborhood: 'Hudson Square',
    borough: 'Manhattan',
    propertyType: 'mixed_use',
    saleDate: 'Jun 30, 2024',
    salePrice: 584000000,
    pricePSF: 1124,
    sqft: 519800,
    yearBuilt: 2023,
    buyer: 'Google',
    seller: 'Atlas Capital',
    distance_mi: 0.6,
    noteworthy: 'One of largest NYC transactions 2023',
  },
];

const TYPE_LABELS: Record<string, string> = {
  all: 'All Types',
  multifamily: 'Multifamily',
  office: 'Office',
  retail: 'Retail',
  industrial: 'Industrial',
  mixed_use: 'Mixed Use',
  land: 'Land',
};

const TYPE_COLORS: Record<string, string> = {
  multifamily: '#34d399',
  office: '#60a5fa',
  retail: '#f97316',
  industrial: '#a78bfa',
  mixed_use: '#c8a060',
  land: '#94a3b8',
};

function formatMoney(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

export default function ComparableSalesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<PropertyType>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [selectedComp, setSelectedComp] = useState<Comp | null>(COMPS[0]);
  const [radiusMi, setRadiusMi] = useState(2);
  const [maxDate, setMaxDate] = useState('12m');

  const maxAgeDays =
    maxDate === '3m'
      ? 90
      : maxDate === '6m'
        ? 180
        : maxDate === '12m'
          ? 365
          : maxDate === '24m'
            ? 730
            : 365;

  const filtered = COMPS.filter((c) => {
    const matchType = typeFilter === 'all' || c.propertyType === typeFilter;
    const matchSearch =
      !search ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.neighborhood.toLowerCase().includes(search.toLowerCase()) ||
      c.borough.toLowerCase().includes(search.toLowerCase());
    const matchRadius = c.distance_mi === undefined || c.distance_mi <= radiusMi;
    const compDate = new Date(c.saleDate);
    const daysSince = (Date.now() - compDate.getTime()) / (1000 * 60 * 60 * 24);
    const matchDate = !isNaN(daysSince) && daysSince <= maxAgeDays;
    return matchType && matchSearch && matchRadius && matchDate;
  }).sort((a, b) => {
    if (sortBy === 'price') return b.salePrice - a.salePrice;
    if (sortBy === 'price_psf') return b.pricePSF - a.pricePSF;
    if (sortBy === 'cap_rate') return (b.capRate ?? 0) - (a.capRate ?? 0);
    if (sortBy === 'units') return (b.units ?? 0) - (a.units ?? 0);
    return 0; // date — already sorted
  });

  const avgPSF =
    filtered.length > 0
      ? Math.round(filtered.reduce((s, c) => s + c.pricePSF, 0) / filtered.length)
      : 0;
  const avgCapRate =
    filtered.filter((c) => c.capRate).length > 0
      ? (
          filtered.filter((c) => c.capRate).reduce((s, c) => s + (c.capRate ?? 0), 0) /
          filtered.filter((c) => c.capRate).length
        ).toFixed(2)
      : '—';
  const totalVolume = filtered.reduce((s, c) => s + c.salePrice, 0);

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
              Comparable Sales
            </h1>
            <p className="text-[9px]" style={{ color: 'rgba(200,160,96,0.4)' }}>
              Search comps by radius · property type · date range with per-SF analysis
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px]"
          style={{
            borderColor: 'rgba(200,160,96,0.2)',
            color: '#c8a060',
            background: 'rgba(200,160,96,0.06)',
          }}
        >
          <Download className="w-3 h-3" /> Export
        </button>
      </div>

      {/* Filters */}
      <div
        className="px-5 py-3 border-b space-y-2 shrink-0"
        style={{ borderColor: 'rgba(200,160,96,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 flex-1 px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
          >
            <Search className="w-3 h-3 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search address, neighborhood, borough…"
              className="flex-1 bg-transparent text-[11px] text-white/60 placeholder:text-white/20 outline-none"
            />
          </div>
          {/* Radius filter */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px]"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          >
            <MapPin className="w-3 h-3" />
            <select
              value={radiusMi}
              onChange={(e) => setRadiusMi(Number(e.target.value))}
              className="bg-transparent text-[10px] text-white/40 outline-none"
            >
              {[0.25, 0.5, 1, 2, 5].map((r) => (
                <option key={r} value={r}>
                  {r} mi
                </option>
              ))}
            </select>
          </div>
          {/* Date range */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px]"
            style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          >
            <Calendar className="w-3 h-3" />
            <select
              value={maxDate}
              onChange={(e) => setMaxDate(e.target.value)}
              className="bg-transparent text-[10px] text-white/40 outline-none"
            >
              {['3m', '6m', '12m', '24m', '60m'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Property type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(TYPE_LABELS) as PropertyType[]).map((t) => {
            const color = t === 'all' ? '#c8a060' : (TYPE_COLORS[t] ?? '#94a3b8');
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="px-2 py-0.5 rounded text-[9px] border transition-all"
                style={{
                  borderColor: typeFilter === t ? `${color}40` : 'rgba(255,255,255,0.06)',
                  color: typeFilter === t ? color : 'rgba(255,255,255,0.3)',
                  background: typeFilter === t ? `${color}10` : 'transparent',
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Row */}
      <div
        className="px-5 py-2 border-b grid grid-cols-4 gap-4 shrink-0 text-center"
        style={{ borderColor: 'rgba(200,160,96,0.06)' }}
      >
        {[
          { label: 'Comps Found', value: filtered.length },
          { label: 'Avg Price/SF', value: `$${avgPSF}` },
          { label: 'Avg Cap Rate', value: `${avgCapRate}%` },
          { label: 'Total Volume', value: formatMoney(totalVolume) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p
              className="text-[8px] uppercase tracking-wider"
              style={{ color: 'rgba(200,160,96,0.35)' }}
            >
              {label}
            </p>
            <p className="text-sm font-bold font-mono" style={{ color: '#f4e8d0' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Comp List */}
        <div className="flex-1 overflow-y-auto">
          {/* Sort Controls */}
          <div
            className="px-4 py-2 border-b flex items-center gap-2 text-[9px]"
            style={{ borderColor: 'rgba(200,160,96,0.06)', color: 'rgba(200,160,96,0.35)' }}
          >
            <span>Sort:</span>
            {[
              { id: 'date', label: 'Date' },
              { id: 'price', label: 'Price' },
              { id: 'price_psf', label: '$/SF' },
              { id: 'cap_rate', label: 'Cap Rate' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id as SortKey)}
                className="px-2 py-0.5 rounded border transition-all"
                style={{
                  borderColor: sortBy === s.id ? 'rgba(200,160,96,0.3)' : 'rgba(255,255,255,0.06)',
                  color: sortBy === s.id ? '#c8a060' : 'rgba(255,255,255,0.25)',
                  background: sortBy === s.id ? 'rgba(200,160,96,0.07)' : 'transparent',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {filtered.map((comp) => {
            const typeColor = TYPE_COLORS[comp.propertyType] ?? '#94a3b8';
            const isSelected = selectedComp?.id === comp.id;
            return (
              <button
                key={comp.id}
                onClick={() => setSelectedComp(isSelected ? null : comp)}
                className="w-full text-left px-5 py-3.5 border-b transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.04)',
                  background: isSelected ? 'rgba(200,160,96,0.06)' : 'transparent',
                  borderLeft: isSelected
                    ? '2px solid rgba(200,160,96,0.4)'
                    : '2px solid transparent',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold" style={{ color: '#f4e8d0' }}>
                        {comp.address}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-medium"
                        style={{ color: typeColor, background: `${typeColor}15` }}
                      >
                        {TYPE_LABELS[comp.propertyType]}
                      </span>
                      {comp.noteworthy && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[8px]"
                          style={{ color: '#c8a060', background: 'rgba(200,160,96,0.1)' }}
                        >
                          ★
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] mb-2" style={{ color: 'rgba(200,160,96,0.4)' }}>
                      {comp.neighborhood} · {comp.borough} · Built {comp.yearBuilt}
                    </p>
                    <div className="flex items-center gap-4 text-[10px]">
                      <span className="font-bold font-mono" style={{ color: '#f4e8d0' }}>
                        {formatMoney(comp.salePrice)}
                      </span>
                      <span style={{ color: 'rgba(200,160,96,0.5)' }}>·</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>${comp.pricePSF}/SF</span>
                      <span style={{ color: 'rgba(200,160,96,0.5)' }}>·</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {(comp.sqft / 1000).toFixed(0)}K SF
                      </span>
                      {comp.units && (
                        <>
                          <span style={{ color: 'rgba(200,160,96,0.5)' }}>·</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{comp.units} units</span>
                        </>
                      )}
                      {comp.capRate && (
                        <>
                          <span style={{ color: 'rgba(200,160,96,0.5)' }}>·</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {comp.capRate}% cap
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px]" style={{ color: 'rgba(200,160,96,0.35)' }}>
                      {comp.saleDate}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div
                    className="mt-3 pt-3 border-t grid grid-cols-2 gap-3 text-[10px]"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                  >
                    <div>
                      <p className="text-[8px] mb-0.5" style={{ color: 'rgba(200,160,96,0.35)' }}>
                        Buyer
                      </p>
                      <p style={{ color: '#f4e8d0' }}>{comp.buyer}</p>
                    </div>
                    <div>
                      <p className="text-[8px] mb-0.5" style={{ color: 'rgba(200,160,96,0.35)' }}>
                        Seller
                      </p>
                      <p style={{ color: '#f4e8d0' }}>{comp.seller}</p>
                    </div>
                    {comp.noteworthy && (
                      <div
                        className="col-span-2 p-2 rounded-lg"
                        style={{
                          background: 'rgba(200,160,96,0.08)',
                          borderColor: 'rgba(200,160,96,0.15)',
                          border: '1px solid',
                        }}
                      >
                        <p className="text-[9px]" style={{ color: 'rgba(200,160,96,0.7)' }}>
                          ★ {comp.noteworthy}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
