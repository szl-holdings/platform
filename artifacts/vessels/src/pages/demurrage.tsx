import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface LaytimeEvent {
  event: string;
  timestamp: string;
  hours: number;
  counts: boolean;
  note?: string;
}

interface DemurrageCase {
  id: string;
  voyageRef: string;
  vessel: string;
  port: string;
  type: 'loading' | 'discharging';
  status: 'ongoing' | 'settled' | 'disputed';
  norTendered: string;
  norAccepted: string;
  allowedLaytime: number;
  usedLaytime: number;
  demurrageRate: number;
  despatchRate: number;
  events: LaytimeEvent[];
  disputeFlags: string[];
}

const CASES: DemurrageCase[] = [
  {
    id: 'DMR-001',
    voyageRef: 'SZL-VOY-2026-0142',
    vessel: 'Pacific Navigator',
    port: 'Zhoushan, CHN',
    type: 'discharging',
    status: 'ongoing',
    norTendered: '2026-04-15T08:30',
    norAccepted: '2026-04-15T10:00',
    allowedLaytime: 96,
    usedLaytime: 112.5,
    demurrageRate: 18500,
    despatchRate: 9250,
    events: [
      { event: 'NOR Tendered', timestamp: 'Apr 15 08:30', hours: 0, counts: false },
      { event: 'NOR Accepted', timestamp: 'Apr 15 10:00', hours: 0, counts: false },
      { event: 'Laytime Commenced', timestamp: 'Apr 15 10:00', hours: 0, counts: true },
      {
        event: 'Berth Occupied — Waiting at Anchorage',
        timestamp: 'Apr 15 10:00',
        hours: 18.5,
        counts: true,
        note: 'Port congestion — charterer responsible',
      },
      { event: 'Berthed', timestamp: 'Apr 16 04:30', hours: 0, counts: true },
      { event: 'Discharge Commenced', timestamp: 'Apr 16 06:00', hours: 1.5, counts: true },
      {
        event: 'Rain Delay',
        timestamp: 'Apr 17 14:00',
        hours: 4.0,
        counts: false,
        note: 'WIBON clause applies — excluded',
      },
      { event: 'Discharge Resumed', timestamp: 'Apr 17 18:00', hours: 0, counts: true },
      { event: 'Discharge Completed', timestamp: 'Apr 19 20:30', hours: 74.5, counts: true },
    ],
    disputeFlags: [
      'Anchorage time: charterer contesting 8.5h (claims berth was available)',
      'Rain exclusion: owner challenging WIBON clause interpretation',
    ],
  },
  {
    id: 'DMR-002',
    voyageRef: 'SZL-VOY-2026-0098',
    vessel: 'Meridian Bulk',
    port: 'Santos, BRA',
    type: 'loading',
    status: 'settled',
    norTendered: '2026-02-14T06:00',
    norAccepted: '2026-02-14T06:00',
    allowedLaytime: 72,
    usedLaytime: 61.2,
    demurrageRate: 15500,
    despatchRate: 7750,
    events: [
      { event: 'NOR Tendered & Accepted', timestamp: 'Feb 14 06:00', hours: 0, counts: true },
      { event: 'Loading Commenced', timestamp: 'Feb 14 08:00', hours: 2.0, counts: true },
      { event: 'Loading Completed', timestamp: 'Feb 16 21:12', hours: 61.2, counts: true },
    ],
    disputeFlags: [],
  },
  {
    id: 'DMR-003',
    voyageRef: 'SZL-VOY-2026-0115',
    vessel: 'Cape Resolute',
    port: 'Houston, USA',
    type: 'loading',
    status: 'disputed',
    norTendered: '2026-03-22T14:00',
    norAccepted: '2026-03-22T20:00',
    allowedLaytime: 48,
    usedLaytime: 76.5,
    demurrageRate: 22000,
    despatchRate: 11000,
    events: [
      { event: 'NOR Tendered', timestamp: 'Mar 22 14:00', hours: 0, counts: false },
      {
        event: 'NOR Rejected — Berth not ready',
        timestamp: 'Mar 22 14:00',
        hours: 0,
        counts: false,
        note: 'Owner contesting — WIBON applies',
      },
      { event: 'NOR Accepted', timestamp: 'Mar 22 20:00', hours: 0, counts: false },
      {
        event: 'Berthed',
        timestamp: 'Mar 23 12:00',
        hours: 16,
        counts: true,
        note: 'Owner: 16h counts; Charterer: 16h excluded (WIBON)',
      },
      { event: 'Loading Commenced', timestamp: 'Mar 23 14:00', hours: 2, counts: true },
      {
        event: 'Equipment breakdown — shore crane',
        timestamp: 'Mar 24 18:00',
        hours: 8.5,
        counts: false,
        note: 'Port equipment — charterer responsible under C/P',
      },
      { event: 'Loading Resumed', timestamp: 'Mar 25 02:30', hours: 0, counts: true },
      { event: 'Loading Completed', timestamp: 'Mar 26 02:30', hours: 50, counts: true },
    ],
    disputeFlags: [
      'WIBON interpretation: 6h difference (owner claims laytime ran from NOR tender, charterer from berth)',
      'Shore crane breakdown: owner claims 8.5h counts; charterer disagrees',
      'NOR validity: charterer claims first NOR invalid',
    ],
  },
];

const statusConfig: Record<string, string> = {
  ongoing: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  settled: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  disputed: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function LaytimeBar({ allowed, used }: { allowed: number; used: number }) {
  const overrun = used > allowed;
  const pct = Math.min((used / (allowed * 1.5)) * 100, 100);
  const allowedPct = Math.min((allowed / (allowed * 1.5)) * 100, 100);
  return (
    <div className="relative h-2.5 bg-sky-500/10 rounded-full overflow-hidden mt-1">
      <div
        className="absolute h-full rounded-full bg-sky-400/30"
        style={{ width: `${allowedPct}%` }}
      />
      <div
        className={cn(
          'absolute h-full rounded-full transition-all',
          overrun ? 'bg-red-400' : 'bg-emerald-400',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DemurrageCard({ c }: { c: DemurrageCase }) {
  const [expanded, setExpanded] = useState(false);
  const overage = c.usedLaytime - c.allowedLaytime;
  const isDemurrage = overage > 0;
  const amount = isDemurrage
    ? (overage / 24) * c.demurrageRate
    : (Math.abs(overage) / 24) * c.despatchRate;
  const _pct = ((c.usedLaytime / c.allowedLaytime) * 100 - 100).toFixed(1);

  return (
    <div
      className={cn(
        'bg-[#0a1628]/80 border rounded-xl overflow-hidden transition-all',
        c.status === 'disputed'
          ? 'border-red-500/20'
          : c.status === 'settled'
            ? 'border-emerald-500/15'
            : 'border-sky-500/10',
      )}
    >
      <button className="w-full text-left px-4 py-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              isDemurrage ? 'bg-orange-500/10' : 'bg-emerald-500/10',
            )}
          >
            <Clock
              className={cn('w-3.5 h-3.5', isDemurrage ? 'text-orange-400' : 'text-emerald-400')}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-sky-100">{c.id}</span>
              <span className="text-[10px] font-mono text-sky-400/50">{c.voyageRef}</span>
              <Badge variant="outline" className={cn('text-[9px]', statusConfig[c.status])}>
                {c.status}
              </Badge>
              <Badge
                variant="outline"
                className="text-[9px] text-sky-400/40 border-sky-500/10 capitalize"
              >
                {c.type}
              </Badge>
            </div>
            <p className="text-xs text-sky-300 mt-0.5">
              {c.vessel} · {c.port}
            </p>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-sky-400/40">
                  Laytime: {c.usedLaytime}h used / {c.allowedLaytime}h allowed
                </span>
                <span
                  className={cn(
                    'text-[10px] font-mono',
                    isDemurrage ? 'text-orange-400' : 'text-emerald-400',
                  )}
                >
                  {isDemurrage
                    ? `+${overage.toFixed(1)}h demurrage`
                    : `${Math.abs(overage).toFixed(1)}h despatch`}
                </span>
              </div>
              <LaytimeBar allowed={c.allowedLaytime} used={c.usedLaytime} />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                'text-sm font-bold font-mono',
                isDemurrage ? 'text-orange-400' : 'text-emerald-400',
              )}
            >
              {isDemurrage ? '+' : '-'}${(amount / 1000).toFixed(0)}K
            </p>
            <p className="text-[9px] text-sky-400/40">{isDemurrage ? 'demurrage' : 'despatch'}</p>
            {c.disputeFlags.length > 0 && (
              <div className="flex items-center gap-1 mt-1 justify-end">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                <span className="text-[9px] text-red-400">{c.disputeFlags.length} disputes</span>
              </div>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-sky-500/10 pt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'NOR Tendered',
                value: new Date(c.norTendered).toLocaleString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
              {
                label: 'NOR Accepted',
                value: new Date(c.norAccepted).toLocaleString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
              { label: 'Demurrage Rate', value: `$${c.demurrageRate.toLocaleString()}/day` },
              { label: 'Despatch Rate', value: `$${c.despatchRate.toLocaleString()}/day` },
            ].map((f) => (
              <div key={f.label} className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{f.label}</p>
                <p className="text-xs font-mono text-sky-200 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">
              Statement of Facts (Laytime Log)
            </p>
            <div className="space-y-1">
              {c.events.map((ev, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 px-3 py-2 rounded-lg text-[11px]',
                    ev.counts ? 'bg-sky-500/5 border border-sky-500/8' : 'opacity-60',
                  )}
                >
                  <span className="text-[10px] font-mono text-sky-400/40 w-20 shrink-0">
                    {ev.timestamp.split(' ').slice(0, 3).join(' ')}
                  </span>
                  <span className="flex-1 text-sky-200">{ev.event}</span>
                  {ev.hours > 0 && (
                    <span className="font-mono text-sky-300 shrink-0">{ev.hours}h</span>
                  )}
                  <span
                    className={cn(
                      'text-[9px] shrink-0',
                      ev.counts ? 'text-orange-400' : 'text-sky-400/30',
                    )}
                  >
                    {ev.counts ? 'COUNTS' : 'excl.'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {c.disputeFlags.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <p className="text-[9px] text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Dispute Flags
              </p>
              <div className="space-y-1.5">
                {c.disputeFlags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] font-mono text-red-400/50 mt-0.5">{i + 1}.</span>
                    <p className="text-[11px] text-red-300/80">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DemurragePage() {
  const totalDemurrage = CASES.reduce((acc, c) => {
    const ov = c.usedLaytime - c.allowedLaytime;
    return ov > 0 ? acc + (ov / 24) * c.demurrageRate : acc;
  }, 0);
  const totalDespatch = CASES.reduce((acc, c) => {
    const ov = c.usedLaytime - c.allowedLaytime;
    return ov < 0 ? acc + (Math.abs(ov) / 24) * c.despatchRate : acc;
  }, 0);
  const disputed = CASES.filter((c) => c.status === 'disputed').length;
  const avgLaytimePct =
    (CASES.reduce((a, c) => a + c.usedLaytime / c.allowedLaytime, 0) / CASES.length) * 100;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-orange-400" />
          Demurrage Calculator
        </h1>
        <p className="text-xs text-sky-400/50 mt-0.5">
          Automated laytime tracking, demurrage/despatch computation, and dispute flagging
        </p>
        <Badge variant="outline" className="text-[9px] mt-1 text-sky-400/30 border-sky-500/15">
          Simulated data — for demonstration purposes
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Demurrage Accrued',
            value: `$${(totalDemurrage / 1000).toFixed(0)}K`,
            color: 'text-orange-400',
            icon: TrendingUp,
          },
          {
            label: 'Despatch Earned',
            value: `$${(totalDespatch / 1000).toFixed(0)}K`,
            color: 'text-emerald-400',
            icon: TrendingDown,
          },
          { label: 'Disputed Cases', value: disputed, color: 'text-red-400', icon: AlertTriangle },
          {
            label: 'Avg Laytime Usage',
            value: `${avgLaytimePct.toFixed(0)}%`,
            color: avgLaytimePct > 100 ? 'text-orange-400' : 'text-sky-300',
            icon: Clock,
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn('w-3.5 h-3.5', s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {CASES.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            headline="No demurrage exposure"
            description="Every voyage is operating within laytime — no demurrage or despatch claims are open."
            accentColor="#10b981"
          />
        ) : (
          CASES.map((c) => <DemurrageCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  );
}
