import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Anchor,
  CheckCircle2,
  Map,
  Navigation,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

const PORTS = [
  {
    id: 'NLRTM',
    name: 'Rotterdam',
    country: 'Netherlands',
    congestionLevel: 'moderate',
    waitingTime: 14.2,
    berthUtilization: 78,
    vessels: [
      {
        id: 'MV-001',
        name: 'Pacific Navigator',
        eta: 'Apr 20 06:00',
        berth: null,
        status: 'inbound',
      },
      { id: 'MV-007', name: 'Nordic Sun', eta: 'Apr 20 09:30', berth: 'B-12', status: 'berthed' },
      { id: 'MV-014', name: 'Atlantic Wave', eta: 'Apr 20 14:00', berth: null, status: 'anchored' },
    ],
    berths: [
      {
        id: 'B-11',
        type: 'VLCC',
        occupied: true,
        vessel: 'Pioneer Star',
        eta_departure: 'Apr 20 04:00',
      },
      {
        id: 'B-12',
        type: 'Aframax',
        occupied: true,
        vessel: 'Nordic Sun',
        eta_departure: 'Apr 20 12:00',
      },
      { id: 'B-13', type: 'VLCC', occupied: false, vessel: null, eta_departure: null },
      {
        id: 'B-14',
        type: 'LNG',
        occupied: true,
        vessel: 'Arctic Spirit',
        eta_departure: 'Apr 21 08:00',
      },
      { id: 'B-15', type: 'Bulk', occupied: false, vessel: null, eta_departure: null },
    ],
    jitSavings: { fuel: 4_200, co2: 12.4, hours: 6.8 },
  },
  {
    id: 'SGSIN',
    name: 'Singapore',
    country: 'Singapore',
    congestionLevel: 'low',
    waitingTime: 3.8,
    berthUtilization: 62,
    vessels: [
      {
        id: 'MV-002',
        name: 'Arctic Breeze',
        eta: 'May 12 14:00',
        berth: 'T-03',
        status: 'berthed',
      },
    ],
    berths: [
      {
        id: 'T-01',
        type: 'LNG',
        occupied: true,
        vessel: 'Qatari Star',
        eta_departure: 'May 12 10:00',
      },
      { id: 'T-02', type: 'LNG', occupied: false, vessel: null, eta_departure: null },
      {
        id: 'T-03',
        type: 'LNG',
        occupied: true,
        vessel: 'Arctic Breeze',
        eta_departure: 'May 14 06:00',
      },
    ],
    jitSavings: { fuel: 1_800, co2: 5.2, hours: 2.4 },
  },
  {
    id: 'CNSHA',
    name: 'Shanghai',
    country: 'China',
    congestionLevel: 'high',
    waitingTime: 28.6,
    berthUtilization: 94,
    vessels: [
      {
        id: 'MV-009',
        name: 'Pacific Dragon',
        eta: 'Apr 22 08:00',
        berth: null,
        status: 'anchored',
      },
      { id: 'MV-011', name: 'Yangtze Star', eta: 'Apr 22 16:00', berth: null, status: 'inbound' },
    ],
    berths: [
      {
        id: 'Z-01',
        type: 'Bulk',
        occupied: true,
        vessel: 'Iron Mountain',
        eta_departure: 'Apr 24 12:00',
      },
      {
        id: 'Z-02',
        type: 'Bulk',
        occupied: true,
        vessel: 'Steel Horizon',
        eta_departure: 'Apr 23 06:00',
      },
      {
        id: 'Z-03',
        type: 'Container',
        occupied: true,
        vessel: 'Cosco Galaxy',
        eta_departure: 'Apr 22 20:00',
      },
    ],
    jitSavings: { fuel: 8_400, co2: 24.8, hours: 14.2 },
  },
];

const CONGESTION_FORECAST = [
  { port: 'Rotterdam', todayPct: 78, d3Pct: 72, d7Pct: 68, trend: 'down' },
  { port: 'Singapore', todayPct: 62, d3Pct: 65, d7Pct: 71, trend: 'up' },
  { port: 'Shanghai', todayPct: 94, d3Pct: 88, d7Pct: 82, trend: 'down' },
  { port: 'Houston', todayPct: 71, d3Pct: 75, d7Pct: 78, trend: 'up' },
  { port: 'Fujairah', todayPct: 55, d3Pct: 52, d7Pct: 48, trend: 'down' },
];

const congestionColor: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function BerthGrid({ berths }: { berths: (typeof PORTS)[0]['berths'] }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {berths.map((b) => (
        <div
          key={b.id}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg border',
            b.occupied
              ? 'bg-[#c9b787]/8 border-white/[0.08]'
              : 'bg-emerald-500/5 border-emerald-500/15',
          )}
        >
          <div
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              b.occupied ? 'bg-[#c9b787]' : 'bg-emerald-400',
            )}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#d4c598]">{b.id}</span>
              <span className="text-[9px] text-[#6a6a6a]">{b.type}</span>
            </div>
            {b.vessel && <p className="text-[10px] text-[#e0e0e0]">{b.vessel}</p>}
          </div>
          {b.eta_departure && (
            <span className="text-[9px] text-[#6a6a6a]">Departs: {b.eta_departure}</span>
          )}
          {!b.occupied && (
            <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/20">
              AVAILABLE
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PortTwinPage() {
  const [selectedPort, setSelectedPort] = useState(PORTS[0]);
  const [tab, setTab] = useState<'berths' | 'forecast' | 'jit'>('berths');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Anchor className="w-4 h-4 text-[#c9b787]" />
            <h1 className="font-display text-xl font-bold text-[#f5f5f5]">
              Port Digital Twin & Berth Optimization
            </h1>
            <Badge
              variant="outline"
              className="text-[9px] text-[#c9b787] border-[#c9b787]/24 bg-[#c9b787]/8"
            >
              AIS DENSITY
            </Badge>
          </div>
          <p className="text-xs text-[#6a6a6a]">
            Congestion prediction, berth allocation optimization & just-in-time arrival routing
          </p>
        </div>
        <div className="flex items-center gap-4">
          {PORTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPort(p)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                selectedPort.id === p.id
                  ? 'bg-[#c9b787]/10 border-[#c9b787]/24 text-[#d4c598]'
                  : 'border-white/[0.06] text-[#6a6a6a] hover:text-[#d4c598]',
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-1">Congestion</p>
          <Badge
            variant="outline"
            className={cn('text-xs', congestionColor[selectedPort.congestionLevel])}
          >
            {selectedPort.congestionLevel}
          </Badge>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-1">Avg Wait Time</p>
          <p className="text-lg font-bold font-mono text-amber-400">{selectedPort.waitingTime}h</p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-1">
            Berth Utilization
          </p>
          <p className="text-lg font-bold font-mono text-[#c9b787]">
            {selectedPort.berthUtilization}%
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <p className="text-[9px] text-[#6a6a6a] uppercase tracking-wider mb-1">Fleet Vessels</p>
          <p className="text-lg font-bold font-mono text-[#c9b787]">{selectedPort.vessels.length}</p>
        </div>
      </div>

      <div className="flex gap-1">
        {(['berths', 'forecast', 'jit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'text-xs px-4 py-1.5 rounded-lg capitalize transition-colors',
              tab === t
                ? 'bg-[#c9b787]/10 text-[#d4c598] border border-white/[0.08]'
                : 'text-[#8a8a8a] hover:text-[#d4c598]',
            )}
          >
            {t === 'berths'
              ? 'Berth Status'
              : t === 'forecast'
                ? 'Congestion Forecast'
                : 'JIT Arrival'}
          </button>
        ))}
      </div>

      {tab === 'berths' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#e0e0e0] mb-3 flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-[#c9b787]" />
                {selectedPort.name} Port — Live Berth Status
              </p>
              <BerthGrid berths={selectedPort.berths} />
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#e0e0e0] mb-3 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#c9b787]" />
                Fleet Vessels — {selectedPort.name}
              </p>
              <div className="space-y-2">
                {selectedPort.vessels.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#c9b787]/14 border border-white/[0.08]"
                  >
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        v.status === 'berthed'
                          ? 'bg-[#c9b787]'
                          : v.status === 'anchored'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-emerald-400',
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#e0e0e0]">{v.name}</p>
                      <p className="text-[9px] text-[#6a6a6a]">ETA: {v.eta}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px]',
                          v.status === 'berthed'
                            ? 'text-[#c9b787] border-white/[0.08]'
                            : v.status === 'anchored'
                              ? 'text-amber-400 border-amber-500/20'
                              : 'text-emerald-400 border-emerald-500/20',
                        )}
                      >
                        {v.status}
                      </Badge>
                      {v.berth && (
                        <p className="text-[9px] text-[#6a6a6a] mt-0.5">Berth {v.berth}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                JIT Savings — {selectedPort.name}
              </p>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#8a8a8a]">Fuel saved</span>
                  <span className="font-mono text-emerald-400">
                    ${selectedPort.jitSavings.fuel.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8a8a]">CO₂ avoided</span>
                  <span className="font-mono text-emerald-400">
                    {selectedPort.jitSavings.co2} t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8a8a]">Wait hours eliminated</span>
                  <span className="font-mono text-emerald-400">
                    {selectedPort.jitSavings.hours}h
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#e0e0e0] mb-2">Berth Allocation Algorithm</p>
              <div className="space-y-1.5 text-[10px] text-[#8a8a8a]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-[#c9b787]/14 rounded-full" />
                  Vessel type matching
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-[#c9b787]/14 rounded-full" />
                  Tidal window optimization
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-[#c9b787]/14 rounded-full" />
                  Cargo priority scoring
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-[#c9b787]/14 rounded-full" />
                  Turnaround time minimization
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-[#c9b787]/14 rounded-full" />
                  Port equipment availability
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'forecast' && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-[#e0e0e0]">
              Port Congestion Forecast — Next 7 Days
            </p>
          </div>
          <div className="divide-y divide-sky-500/5">
            {CONGESTION_FORECAST.map((p) => (
              <div key={p.port} className="px-4 py-3 flex items-center gap-6">
                <p className="text-sm text-[#e0e0e0] w-24 shrink-0">{p.port}</p>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Today', val: p.todayPct },
                    { label: '+3 Days', val: p.d3Pct },
                    { label: '+7 Days', val: p.d7Pct },
                  ].map((d) => (
                    <div key={d.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[9px] text-[#6a6a6a]">{d.label}</span>
                        <span className="text-[9px] font-mono text-[#d4c598]">{d.val}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${d.val}%`,
                            background:
                              d.val >= 85 ? '#f87171' : d.val >= 70 ? '#fbbf24' : '#34d399',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="shrink-0">
                  {p.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'jit' && (
        <div className="space-y-4">
          {PORTS.map((p) => (
            <div key={p.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#f5f5f5]">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={cn('text-[9px]', congestionColor[p.congestionLevel])}
                    >
                      {p.congestionLevel}
                    </Badge>
                    <span className="text-[10px] text-[#6a6a6a]">Wait: {p.waitingTime}h avg</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-emerald-400">JIT Optimization Active</p>
                  <p className="text-[9px] text-[#6a6a6a]">
                    {p.vessels.length} vessel{p.vessels.length !== 1 ? 's' : ''} in scope
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-500/5 rounded-lg p-2">
                  <p className="text-sm font-bold font-mono text-emerald-400">
                    ${p.jitSavings.fuel.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-[#6a6a6a]">Fuel saved</p>
                </div>
                <div className="bg-emerald-500/5 rounded-lg p-2">
                  <p className="text-sm font-bold font-mono text-emerald-400">
                    {p.jitSavings.co2} t
                  </p>
                  <p className="text-[9px] text-[#6a6a6a]">CO₂ avoided</p>
                </div>
                <div className="bg-[#c9b787]/8 rounded-lg p-2">
                  <p className="text-sm font-bold font-mono text-[#c9b787]">{p.jitSavings.hours}h</p>
                  <p className="text-[9px] text-[#6a6a6a]">Wait eliminated</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
