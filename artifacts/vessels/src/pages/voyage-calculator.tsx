import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Anchor,
  ArrowRight,
  Calculator,
  ChevronDown,
  DollarSign,
  Droplets,
  Fuel,
  Leaf,
  Loader2,
  MapPin,
  Ship,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

interface VesselClass {
  id: string;
  name: string;
  dwt: number;
  typicalSpeedKnots: number;
  dailyBunkerConsumptionMt: number;
  dailyOpex: number;
  insuranceDailyUsd: number;
}

interface RouteDefinition {
  id: string;
  from: string;
  to: string;
  distanceNm: number;
  canals: string[];
  portDays: number;
}

interface CharterRateEstimate {
  vesselClass: string;
  timeCharterRateUsd: number;
  spotRateUsd: number;
  trend: 'rising' | 'stable' | 'falling';
  weeklyChange: number;
}

interface VoyageEstimate {
  vesselClass: string;
  route: { from: string; to: string; distanceNm: number; seaDays: number; canalTransits: string[] };
  revenue: { charterType: string; ratePerDay: number; totalRevenue: number; cargoQuantityMt: number; freightRatePerMt: number };
  costs: {
    bunkerCost: number;
    bunkerConsumptionMt: number;
    bunkerPricePerMt: number;
    portCharges: number;
    canalFees: number;
    canalBreakdown: { canal: string; fee: number }[];
    insurance: number;
    crewAndOpex: number;
    commissions: number;
    miscellaneous: number;
    totalCosts: number;
  };
  economics: {
    grossProfit: number;
    grossMarginPct: number;
    tceRate: number;
    breakEvenFreightRate: number;
    dailyPnl: number;
    voyageDays: number;
    seaDays: number;
    portDays: number;
    carbonEmissionsMt: number;
    carbonCostUsd: number;
  };
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] text-white/30 font-mono uppercase">{label}</p>
      <p className={cn('text-lg font-mono mt-0.5', color ?? 'text-white/90')}>{value}</p>
      {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

function CostBreakdownBar({ items, total }: { items: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <div className="space-y-2">
      <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.04]">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn('h-full', item.color)}
            style={{ width: `${((item.value / total) * 100).toFixed(1)}%` }}
            title={`${item.label}: $${item.value.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-sm', item.color)} />
            <span className="text-[10px] text-white/40">{item.label}</span>
            <span className="text-[10px] font-mono text-white/60 ml-auto">
              ${item.value.toLocaleString()} ({((item.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VoyageCalculatorPage() {
  const [vesselClassId, setVesselClassId] = useState('vlcc');
  const [routeId, setRouteId] = useState('ras-tanura-ningbo');
  const [charterType, setCharterType] = useState<'time_charter' | 'spot'>('time_charter');

  const { data: refData } = useQuery({
    queryKey: ['voyage-calc-ref'],
    queryFn: async () => {
      const [vcRes, rtRes, crRes] = await Promise.all([
        fetch(`${API_BASE}/api/vessels/voyage-calc/vessel-classes`),
        fetch(`${API_BASE}/api/vessels/voyage-calc/routes`),
        fetch(`${API_BASE}/api/vessels/voyage-calc/charter-rates`),
      ]);
      const [vcJson, rtJson, crJson] = await Promise.all([vcRes.json(), rtRes.json(), crRes.json()]);
      return {
        vesselClasses: vcJson.data.vesselClasses as VesselClass[],
        routes: rtJson.data.routes as RouteDefinition[],
        charterRates: crJson.data.charterRates as CharterRateEstimate[],
      };
    },
    staleTime: 300_000,
  });

  const estimateMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_BASE}/api/vessels/voyage-calc/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vesselClassId, routeId, charterType }),
      });
      if (!r.ok) throw new Error('Failed to compute estimate');
      const json = await r.json();
      return json.data.estimate as VoyageEstimate;
    },
  });

  const estimate = estimateMutation.data;
  const selectedRoute = refData?.routes.find((r) => r.id === routeId);
  const selectedVessel = refData?.vesselClasses.find((v) => v.id === vesselClassId);
  const selectedRate = refData?.charterRates.find((c) => c.vesselClass === vesselClassId);

  const costItems = estimate
    ? [
        { label: 'Bunker', value: estimate.costs.bunkerCost, color: 'bg-sky-500/70' },
        { label: 'Port Charges', value: estimate.costs.portCharges, color: 'bg-violet-500/70' },
        { label: 'Canal Fees', value: estimate.costs.canalFees, color: 'bg-amber-500/70' },
        { label: 'Insurance', value: estimate.costs.insurance, color: 'bg-emerald-500/70' },
        { label: 'Crew & OPEX', value: estimate.costs.crewAndOpex, color: 'bg-orange-500/70' },
        { label: 'Commissions', value: estimate.costs.commissions, color: 'bg-pink-500/70' },
        { label: 'Miscellaneous', value: estimate.costs.miscellaneous, color: 'bg-white/20' },
      ]
    : [];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-tight flex items-center gap-2">
          <Calculator className="w-5 h-5 text-sky-400" />
          Voyage Economics Calculator
        </h1>
        <p className="text-[11px] text-white/30 mt-0.5">
          Estimate voyage P&L with real-time charter rates, bunker prices, and canal fees
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Voyage Parameters</p>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 flex items-center gap-1"><Ship className="w-3 h-3" /> Vessel Class</label>
              <div className="relative">
                <select
                  value={vesselClassId}
                  onChange={(e) => setVesselClassId(e.target.value)}
                  className="w-full h-8 rounded bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/80 px-2 appearance-none cursor-pointer"
                >
                  {(refData?.vesselClasses ?? []).map((vc) => (
                    <option key={vc.id} value={vc.id}>{vc.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {selectedVessel && (
                <p className="text-[10px] text-white/30 font-mono">
                  DWT: {selectedVessel.dwt.toLocaleString()} · {selectedVessel.typicalSpeedKnots} kts · {selectedVessel.dailyBunkerConsumptionMt} MT/day
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 flex items-center gap-1"><MapPin className="w-3 h-3" /> Route</label>
              <div className="relative">
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full h-8 rounded bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/80 px-2 appearance-none cursor-pointer"
                >
                  {(refData?.routes ?? []).map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.from} → {rt.to}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-white/30 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {selectedRoute && (
                <p className="text-[10px] text-white/30 font-mono">
                  {selectedRoute.distanceNm.toLocaleString()} nm · {selectedRoute.portDays}d port
                  {selectedRoute.canals.length > 0 ? ` · ${selectedRoute.canals.join(', ')}` : ''}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Charter Type</label>
              <div className="flex gap-2">
                {(['time_charter', 'spot'] as const).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setCharterType(ct)}
                    className={cn(
                      'flex-1 h-8 rounded text-[11px] font-medium border transition-colors',
                      charterType === ct
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                        : 'bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/60',
                    )}
                  >
                    {ct === 'time_charter' ? 'Time Charter' : 'Spot'}
                  </button>
                ))}
              </div>
              {selectedRate && (
                <div className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
                  <span>${(charterType === 'time_charter' ? selectedRate.timeCharterRateUsd : selectedRate.spotRateUsd).toLocaleString()}/day</span>
                  <Badge variant="outline" className={cn('text-[8px] ml-1 border-0 px-1',
                    selectedRate.trend === 'rising' ? 'text-emerald-400 bg-emerald-500/10' :
                    selectedRate.trend === 'falling' ? 'text-red-400 bg-red-500/10' :
                    'text-white/30 bg-white/[0.03]'
                  )}>
                    {selectedRate.trend === 'rising' ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : selectedRate.trend === 'falling' ? <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> : null}
                    {selectedRate.weeklyChange >= 0 ? '+' : ''}{selectedRate.weeklyChange}% w/w
                  </Badge>
                </div>
              )}
            </div>

            <button
              onClick={() => estimateMutation.mutate()}
              disabled={estimateMutation.isPending}
              className="w-full h-9 rounded bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[12px] font-semibold hover:bg-sky-500/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {estimateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
              Calculate P&L
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!estimate && !estimateMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/20 text-[12px]">
              <Ship className="w-8 h-8 mb-2 text-sky-400/20" />
              Select parameters and click Calculate P&L
            </div>
          )}

          {estimateMutation.isPending && (
            <div className="flex items-center justify-center h-64 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
            </div>
          )}

          {estimate && (
            <>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-[12px] text-white/60">
                  <Ship className="w-4 h-4 text-sky-400" />
                  <span className="font-medium text-white/80">{estimate.vesselClass}</span>
                  <ArrowRight className="w-3 h-3 text-white/20" />
                  <Anchor className="w-3.5 h-3.5 text-sky-400/50" />
                  <span>{estimate.route.from}</span>
                  <ArrowRight className="w-3 h-3 text-white/20" />
                  <span>{estimate.route.to}</span>
                  <span className="ml-auto text-[10px] text-white/30 font-mono">
                    {estimate.route.distanceNm.toLocaleString()} nm · {estimate.economics.voyageDays} days
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KpiCard
                  label="Gross Profit"
                  value={`$${(estimate.economics.grossProfit / 1000).toFixed(0)}K`}
                  sub={`${estimate.economics.grossMarginPct}% margin`}
                  color={estimate.economics.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <KpiCard label="TCE Rate" value={`$${estimate.economics.tceRate.toLocaleString()}/day`} sub="Time charter equivalent" />
                <KpiCard label="Revenue" value={`$${(estimate.revenue.totalRevenue / 1000).toFixed(0)}K`} sub={`$${estimate.revenue.ratePerDay.toLocaleString()}/day`} />
                <KpiCard label="Total Costs" value={`$${(estimate.costs.totalCosts / 1000).toFixed(0)}K`} sub={`$${Math.round(estimate.costs.totalCosts / estimate.economics.voyageDays).toLocaleString()}/day`} />
                <KpiCard label="Daily P&L" value={`$${estimate.economics.dailyPnl.toLocaleString()}`} color={estimate.economics.dailyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'} />
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Cost Breakdown</p>
                <CostBreakdownBar items={costItems} total={estimate.costs.totalCosts} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider flex items-center gap-1"><Fuel className="w-3 h-3" /> Bunker</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><p className="text-white/30">Consumption</p><p className="font-mono text-white/70">{estimate.costs.bunkerConsumptionMt.toLocaleString()} MT</p></div>
                    <div><p className="text-white/30">Price</p><p className="font-mono text-white/70">${estimate.costs.bunkerPricePerMt}/MT</p></div>
                    <div className="col-span-2"><p className="text-white/30">Total Cost</p><p className="font-mono text-white/80">${estimate.costs.bunkerCost.toLocaleString()}</p></div>
                  </div>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider flex items-center gap-1"><Droplets className="w-3 h-3" /> Canal Transits</p>
                  {estimate.costs.canalBreakdown.length > 0 ? (
                    <div className="space-y-1.5">
                      {estimate.costs.canalBreakdown.map((c) => (
                        <div key={c.canal} className="flex items-center justify-between text-[11px]">
                          <span className="text-white/60">{c.canal}</span>
                          <span className="font-mono text-white/70">${c.fee.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/30">No canal transits on this route</p>
                  )}
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider flex items-center gap-1"><Leaf className="w-3 h-3" /> Carbon Footprint</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><p className="text-white/30">CO₂ Emissions</p><p className="font-mono text-white/70">{estimate.economics.carbonEmissionsMt.toLocaleString()} MT</p></div>
                    <div><p className="text-white/30">Carbon Cost</p><p className="font-mono text-white/70">${estimate.economics.carbonCostUsd.toLocaleString()}</p></div>
                  </div>
                  <p className="text-[10px] text-white/30">Based on EU ETS @ $85/tCO₂</p>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Freight Economics</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[11px]">
                  <div><p className="text-white/30">Cargo Quantity</p><p className="font-mono text-white/70">{estimate.revenue.cargoQuantityMt.toLocaleString()} MT</p></div>
                  <div><p className="text-white/30">Freight Rate</p><p className="font-mono text-white/70">${estimate.revenue.freightRatePerMt}/MT</p></div>
                  <div><p className="text-white/30">Break-Even Rate</p><p className="font-mono text-white/70">${estimate.economics.breakEvenFreightRate}/MT</p></div>
                  <div><p className="text-white/30">Sea Days / Port Days</p><p className="font-mono text-white/70">{estimate.economics.seaDays} / {estimate.economics.portDays}</p></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
